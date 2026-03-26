import { setClockTickerMessage } from './clock.js?v=20260325-52';

const YOUTUBE_API_URL = 'https://www.youtube.com/iframe_api';
let youTubeApiPromise;

function createTrackId() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }

    return `track-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getThumbnailUrl(videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

function loadYouTubeIframeApi() {
    if (window.YT?.Player) {
        return Promise.resolve(window.YT);
    }

    if (youTubeApiPromise) {
        return youTubeApiPromise;
    }

    youTubeApiPromise = new Promise((resolve, reject) => {
        const previousReady = window.onYouTubeIframeAPIReady;
        const existingScript = document.querySelector(`script[src="${YOUTUBE_API_URL}"]`);

        window.onYouTubeIframeAPIReady = () => {
            previousReady?.();
            resolve(window.YT);
        };

        if (!existingScript) {
            const script = document.createElement('script');
            script.src = YOUTUBE_API_URL;
            script.async = true;
            script.onerror = () => reject(new Error('YouTube API failed to load.'));
            document.head.append(script);
        }
    });

    return youTubeApiPromise;
}

function extractVideoId(rawValue) {
    const value = rawValue.trim();

    if (/^[\w-]{11}$/.test(value)) {
        return value;
    }

    try {
        const url = new URL(value);
        const host = url.hostname.replace(/^www\./, '');

        if (host === 'youtu.be') {
            return url.pathname.split('/').filter(Boolean)[0] ?? '';
        }

        if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
            if (url.pathname === '/watch') {
                return url.searchParams.get('v') ?? '';
            }

            if (url.pathname.startsWith('/embed/') || url.pathname.startsWith('/shorts/')) {
                return url.pathname.split('/')[2] ?? '';
            }
        }
    } catch (error) {
        return '';
    }

    return '';
}

export function createMusicFeature({ state, saveState, elements }) {
    let player = null;
    let isPlayerReady = false;
    let progressIntervalId = null;
    let autoplayFallbackTimerId = 0;
    let pendingAutoplayVideoId = '';
    let isSeeking = false;
    let draggedTrackId = '';
    let dropTargetTrackId = '';
    let dropTargetPlacement = 'before';
    let pointerDragSession = null;
    let hasPendingReorder = false;
    let dragProxy = null;
    let isReorderEnabled = true;
    let isTouchReorderMode = false;
    let activeConfirmResolver = null;
    let confirmTriggerElement = null;

    function getIsReorderEnabled() {
        const supportsPointerEvents = typeof window.PointerEvent === 'function';
        const supportsTouchEvents = 'ontouchstart' in window
            || (typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0);

        return supportsPointerEvents || supportsTouchEvents;
    }

    function getIsTouchReorderMode() {
        const hasCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
        const hasNoHover = window.matchMedia?.('(hover: none)').matches ?? false;
        const hasTouchPoints = typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;

        return hasCoarsePointer || hasNoHover || hasTouchPoints;
    }

    function formatPlaybackTime(totalSeconds) {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = String(safeSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    function updateStatus(message, { mirrorToTicker = Boolean(state.music.videoId) } = {}) {
        elements.musicStatus.textContent = message;

        if (mirrorToTicker) {
            const tickerTitle = state.music.title || getActiveTrack()?.title || '';
            setClockTickerMessage(elements, tickerTitle || message, 'music');
            return;
        }

        if (!state.music.videoId && elements.clockTicker) {
            elements.clockTicker.dataset.tickerMode = 'default';
            elements.clockTicker.dataset.tickerPlayback = 'playing';
        }
    }

    function setClockTickerPlaybackState(isPlaying) {
        if (!elements.clockTicker) {
            return;
        }

        elements.clockTicker.dataset.tickerPlayback = isPlaying ? 'playing' : 'paused';
    }

    function getPlaybackStatusMessage() {
        return state.music.isLooping
            ? '지금 가장 중요한 일에 집중하고 있어요.'
            : '오늘 해야 할 일을 차분히 이어가고 있어요.';
    }

    function persistMusic(options = {}) {
        saveState(options);
    }

    function getSafeTitle(track) {
        return track?.title || '제목 없는 유튜브 곡';
    }

    function getActiveTrack() {
        return state.music.tracks.find((track) => track.id === state.music.activeTrackId) || null;
    }

    function getNextTrack() {
        if (state.music.tracks.length === 0) {
            return null;
        }

        const activeIndex = state.music.tracks.findIndex((track) => track.id === state.music.activeTrackId);

        if (activeIndex === -1) {
            return state.music.tracks[0];
        }

        const nextIndex = (activeIndex + 1) % state.music.tracks.length;
        return state.music.tracks[nextIndex] || null;
    }

    function getCurrentPlaybackTime() {
        if (!player || !isPlayerReady || typeof player.getCurrentTime !== 'function') {
            return 0;
        }

        return player.getCurrentTime();
    }

    function getPlayerDuration() {
        if (!player || !isPlayerReady || typeof player.getDuration !== 'function') {
            return 0;
        }

        return player.getDuration();
    }

    function getPlayerState() {
        if (!player || !isPlayerReady || typeof player.getPlayerState !== 'function') {
            return null;
        }

        return player.getPlayerState();
    }

    function getIsClockMusicPlaying() {
        const playerState = getPlayerState();

        return playerState === window.YT?.PlayerState?.PLAYING
            || playerState === window.YT?.PlayerState?.BUFFERING;
    }

    function renderClockMusicToggleButton() {
        if (!elements.clockMusicToggleButton) {
            return;
        }

        const hasTrack = Boolean(state.music.videoId);
        const isPlaying = hasTrack && getIsClockMusicPlaying();
        const buttonLabel = !hasTrack
            ? '재생할 곡이 아직 없어요'
            : (isPlaying ? '일시정지' : '최근 곡 재생');
        const buttonText = elements.clockMusicToggleButton.querySelector('.sr-only');

        elements.clockMusicToggleButton.disabled = !hasTrack;
        elements.clockMusicToggleButton.dataset.state = isPlaying ? 'playing' : 'idle';
        elements.clockMusicToggleButton.setAttribute('aria-label', buttonLabel);
        elements.clockMusicToggleButton.title = buttonLabel;

        if (buttonText) {
            buttonText.textContent = buttonLabel;
        }
    }

    function setVolumeLabel() {
        elements.musicVolumeValue.textContent = `${state.music.volume}%`;
    }

    function renderLoopButton() {
        const loopLabel = state.music.isLooping ? 'Loop On' : 'Loop Off';
        const loopText = elements.musicLoopButton.querySelector('.sr-only');

        elements.musicLoopButton.classList.toggle('is-active', state.music.isLooping);
        elements.musicLoopButton.setAttribute('aria-pressed', String(state.music.isLooping));
        elements.musicLoopButton.setAttribute('aria-label', loopLabel);
        elements.musicLoopButton.title = loopLabel;

        if (loopText) {
            loopText.textContent = loopLabel;
        }
    }

    function renderTime(currentSeconds = 0, durationSeconds = 0) {
        const safeDuration = Number.isFinite(durationSeconds) ? durationSeconds : 0;
        const safeCurrent = Number.isFinite(currentSeconds) ? currentSeconds : 0;

        elements.musicCurrentTime.textContent = formatPlaybackTime(safeCurrent);
        elements.musicDuration.textContent = formatPlaybackTime(safeDuration);

        if (!isSeeking) {
            const nextValue = safeDuration > 0
                ? Math.round((Math.min(safeCurrent, safeDuration) / safeDuration) * 1000)
                : 0;

            elements.musicSeekInput.value = String(nextValue);
        }
    }

    function stopProgressLoop() {
        if (progressIntervalId) {
            window.clearInterval(progressIntervalId);
            progressIntervalId = null;
        }
    }

    function clearAutoplayFallback() {
        if (autoplayFallbackTimerId) {
            window.clearTimeout(autoplayFallbackTimerId);
            autoplayFallbackTimerId = 0;
        }

        pendingAutoplayVideoId = '';
    }

    function scheduleAutoplayFallback(videoId, source = 'manual') {
        clearAutoplayFallback();

        if (!videoId) {
            return;
        }

        pendingAutoplayVideoId = videoId;
        autoplayFallbackTimerId = window.setTimeout(() => {
            autoplayFallbackTimerId = 0;

            if (pendingAutoplayVideoId !== videoId) {
                return;
            }

            const playerState = typeof player?.getPlayerState === 'function'
                ? player.getPlayerState()
                : null;

            if (playerState === window.YT?.PlayerState?.PLAYING) {
                clearAutoplayFallback();
                return;
            }

            if (typeof player?.cueVideoById === 'function') {
                player.cueVideoById(videoId);
            }

            updateProgress();
            updateStatus(
                source === 'restore'
                    ? '자동 재생이 브라우저에서 막혔어요. 재생 버튼을 누르면 바로 이어져요.'
                    : '자동 재생이 막혀서 곡만 준비해 뒀어요. 재생 버튼을 눌러 주세요.'
            );
            pendingAutoplayVideoId = '';
        }, 2500);
    }

    function updateProgress() {
        if (!player || !isPlayerReady) {
            renderTime(0, 0);
            renderClockMusicToggleButton();
            return;
        }

        const currentSeconds = getCurrentPlaybackTime();
        const durationSeconds = getPlayerDuration();

        renderTime(currentSeconds, durationSeconds);
        renderClockMusicToggleButton();
    }

    function startProgressLoop() {
        stopProgressLoop();
        updateProgress();
        progressIntervalId = window.setInterval(updateProgress, 500);
    }

    function renderPreview() {
        const activeTrack = getActiveTrack();
        const thumbnailUrl = activeTrack?.thumbnailUrl || (state.music.videoId ? getThumbnailUrl(state.music.videoId) : '');

        elements.musicTitle.textContent = state.music.title || activeTrack?.title || '불러온 곡이 없습니다';
        elements.musicCurrentMeta.textContent = activeTrack
            ? `${getSafeTitle(activeTrack)} 곡을 바로 재생할 수 있어요.`
            : '좋아하는 유튜브 링크를 저장하고 언제든 바꿔 들을 수 있어요.';
        renderClockMusicToggleButton();

        if (thumbnailUrl) {
            elements.musicThumbnail.src = thumbnailUrl;
            elements.musicThumbnail.alt = state.music.title || activeTrack?.title || '선택한 유튜브 곡 썸네일';
            elements.musicThumbnail.draggable = false;
            elements.musicThumbnail.hidden = false;
        } else {
            elements.musicThumbnail.hidden = true;
            elements.musicThumbnail.alt = '';
        }
    }

    function clearDropTarget() {
        elements.musicLibraryList.querySelectorAll('.music-library-item').forEach((item) => {
            item.classList.remove('is-drop-target', 'drop-before', 'drop-after');
        });

        dropTargetTrackId = '';
        dropTargetPlacement = 'before';
    }

    function clearDragState() {
        elements.musicLibraryList.querySelectorAll('.music-library-item').forEach((item) => {
            item.classList.remove('is-dragging', 'is-drag-origin');
        });

        dragProxy?.remove();
        dragProxy = null;
        draggedTrackId = '';
        pointerDragSession = null;
        hasPendingReorder = false;
        clearDropTarget();
    }

    function setDropTarget(item, placement = 'before') {
        clearDropTarget();

        if (!item) {
            return;
        }

        const trackId = item.dataset.trackId || '';

        if (!trackId || trackId === draggedTrackId) {
            return;
        }

        item.classList.add('is-drop-target', placement === 'after' ? 'drop-after' : 'drop-before');
        dropTargetTrackId = trackId;
        dropTargetPlacement = placement;
    }

    function findDropTarget(clientY) {
        const libraryItems = [...elements.musicLibraryList.querySelectorAll('.music-library-item')]
            .filter((item) => item.dataset.trackId !== draggedTrackId);

        if (libraryItems.length === 0) {
            return { targetItem: null, placement: 'before' };
        }

        for (const item of libraryItems) {
            const rect = item.getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;

            if (clientY < midpoint) {
                return { targetItem: item, placement: 'before' };
            }
        }

        return {
            targetItem: libraryItems[libraryItems.length - 1],
            placement: 'after'
        };
    }

    function animateLibraryReorder(previousRects) {
        const libraryItems = [...elements.musicLibraryList.querySelectorAll('.music-library-item')];

        libraryItems.forEach((item) => {
            if (item.dataset.trackId === draggedTrackId) {
                return;
            }

            const previousRect = previousRects.get(item.dataset.trackId || '');

            if (!previousRect) {
                return;
            }

            const nextRect = item.getBoundingClientRect();
            const deltaX = previousRect.left - nextRect.left;
            const deltaY = previousRect.top - nextRect.top;

            if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
                return;
            }

            item.style.transition = 'none';
            item.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

            window.requestAnimationFrame(() => {
                item.style.transition = '';
                item.style.transform = '';
            });
        });
    }

    function updateDragProxyPosition(clientX, clientY) {
        if (!dragProxy || !pointerDragSession) {
            return;
        }

        dragProxy.style.transform = `translate(${clientX - pointerDragSession.offsetX}px, ${clientY - pointerDragSession.offsetY}px)`;
    }

    function createDragProxy(item, event) {
        const rect = item.getBoundingClientRect();
        const proxy = item.cloneNode(true);

        proxy.classList.remove('active', 'is-drop-target', 'drop-before', 'drop-after', 'is-drag-origin');
        proxy.classList.add('music-library-drag-proxy', 'is-dragging');
        proxy.style.width = `${rect.width}px`;
        proxy.style.height = `${rect.height}px`;
        proxy.style.left = '0';
        proxy.style.top = '0';

        dragProxy?.remove();
        dragProxy = proxy;
        document.body.append(proxy);

        pointerDragSession.offsetX = event.clientX - rect.left;
        pointerDragSession.offsetY = event.clientY - rect.top;
        updateDragProxyPosition(event.clientX, event.clientY);
    }

    function reorderLibraryItem(targetItem, placement = 'before') {
        const draggedItem = elements.musicLibraryList.querySelector(`[data-track-id="${draggedTrackId}"]`);

        if (!draggedItem || !targetItem || draggedItem === targetItem) {
            return false;
        }

        const previousRects = new Map(
            [...elements.musicLibraryList.querySelectorAll('.music-library-item')]
                .map((item) => [item.dataset.trackId || '', item.getBoundingClientRect()])
        );

        const nextSibling = placement === 'after' ? targetItem.nextElementSibling : targetItem;

        if (nextSibling === draggedItem) {
            setDropTarget(targetItem, placement);
            return false;
        }

        if (placement === 'after' && targetItem === draggedItem.previousElementSibling) {
            setDropTarget(targetItem, placement);
            return false;
        }

        elements.musicLibraryList.insertBefore(draggedItem, nextSibling);
        setDropTarget(targetItem, placement);
        animateLibraryReorder(previousRects);
        hasPendingReorder = true;
        return true;
    }

    function commitLibraryOrder() {
        const orderedIds = [...elements.musicLibraryList.querySelectorAll('.music-library-item')]
            .map((item) => item.dataset.trackId || '')
            .filter(Boolean);

        if (orderedIds.length !== state.music.tracks.length) {
            clearDragState();
            renderLibrary();
            return;
        }

        const currentIds = state.music.tracks.map((track) => track.id);
        const hasChanged = orderedIds.some((trackId, index) => trackId !== currentIds[index]);

        if (!hasChanged) {
            clearDragState();
            return;
        }

        const tracksById = new Map(state.music.tracks.map((track) => [track.id, track]));
        state.music.tracks = orderedIds
            .map((trackId) => tracksById.get(trackId))
            .filter(Boolean);

        persistMusic();
        clearDragState();
        renderLibrary();
        renderPreview();
        updateStatus('재생목록 순서를 바꿨어요.', { mirrorToTicker: false });
    }

    function bindPointerReorder(item, trackId, { handleOnly = false } = {}) {
        function findTouchById(touchList, identifier) {
            if (!touchList) {
                return null;
            }

            for (const touch of touchList) {
                if (touch.identifier === identifier) {
                    return touch;
                }
            }

            return null;
        }

        function handlePointerMove(event) {
            if (!pointerDragSession || pointerDragSession.pointerId !== event.pointerId) {
                return;
            }

            event.preventDefault();

            const deltaX = event.clientX - pointerDragSession.startX;
            const deltaY = event.clientY - pointerDragSession.startY;

            if (!pointerDragSession.isDragging && Math.hypot(deltaX, deltaY) < 10) {
                return;
            }

            if (!pointerDragSession.isDragging) {
                pointerDragSession.isDragging = true;
                item.classList.add('is-drag-origin');
                createDragProxy(item, event);
            }

            updateDragProxyPosition(event.clientX, event.clientY);

            const { targetItem, placement } = findDropTarget(event.clientY);

            if (!targetItem || targetItem.dataset.trackId === trackId) {
                clearDropTarget();
                return;
            }

            reorderLibraryItem(targetItem, placement);
        }

        function finishPointerReorder(event) {
            if (!pointerDragSession || pointerDragSession.pointerId !== event.pointerId) {
                return;
            }

            const { isDragging } = pointerDragSession;
            pointerDragSession = null;

            try {
                item.releasePointerCapture?.(event.pointerId);
            } catch (error) {
                /* 포인터 캡처가 없더라도 종료 흐름은 그대로 진행합니다. */
            }
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', finishPointerReorder);
            window.removeEventListener('pointercancel', finishPointerReorder);

            if (isDragging && hasPendingReorder) {
                commitLibraryOrder();
                return;
            }

            clearDragState();
        }

        function startReorderSession(clientX, clientY, sessionPatch = {}) {
            pointerDragSession = {
                startX: clientX,
                startY: clientY,
                trackId,
                ...sessionPatch
            };
            draggedTrackId = trackId;
            hasPendingReorder = false;
        }

        function shouldIgnoreDragStart(target) {
            if (target instanceof HTMLElement && target.closest('button')) {
                return true;
            }

            if (
                handleOnly
                && (!(target instanceof HTMLElement) || !target.closest('.music-library-handle'))
            ) {
                return true;
            }

            return false;
        }

        if (typeof window.PointerEvent === 'function') {
            item.addEventListener('pointerdown', (event) => {
                if (event.pointerType === 'mouse' && event.button !== 0) {
                    return;
                }

                if (shouldIgnoreDragStart(event.target)) {
                    return;
                }

                event.preventDefault();
                startReorderSession(event.clientX, event.clientY, { pointerId: event.pointerId });

                try {
                    item.setPointerCapture?.(event.pointerId);
                } catch (error) {
                    /* 브라우저가 포인터 캡처를 거부해도 드래그는 계속 진행합니다. */
                }
                window.addEventListener('pointermove', handlePointerMove, { passive: false });
                window.addEventListener('pointerup', finishPointerReorder);
                window.addEventListener('pointercancel', finishPointerReorder);
            });

            return;
        }

        function handleTouchMove(event) {
            if (!pointerDragSession) {
                return;
            }

            const activeTouch = findTouchById(event.touches, pointerDragSession.touchId);

            if (!activeTouch) {
                return;
            }

            const deltaX = activeTouch.clientX - pointerDragSession.startX;
            const deltaY = activeTouch.clientY - pointerDragSession.startY;

            if (!pointerDragSession.isDragging && Math.hypot(deltaX, deltaY) < 10) {
                return;
            }

            event.preventDefault();

            if (!pointerDragSession.isDragging) {
                pointerDragSession.isDragging = true;
                item.classList.add('is-drag-origin');
                createDragProxy(item, activeTouch);
            }

            updateDragProxyPosition(activeTouch.clientX, activeTouch.clientY);

            const { targetItem, placement } = findDropTarget(activeTouch.clientY);

            if (!targetItem || targetItem.dataset.trackId === trackId) {
                clearDropTarget();
                return;
            }

            reorderLibraryItem(targetItem, placement);
        }

        function finishTouchReorder(event) {
            if (!pointerDragSession) {
                return;
            }

            const endedTouch = findTouchById(event.changedTouches, pointerDragSession.touchId);

            if (!endedTouch) {
                return;
            }

            const { isDragging } = pointerDragSession;
            pointerDragSession = null;

            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', finishTouchReorder);
            window.removeEventListener('touchcancel', finishTouchReorder);

            if (isDragging && hasPendingReorder) {
                commitLibraryOrder();
                return;
            }

            clearDragState();
        }

        item.addEventListener('touchstart', (event) => {
            const [touch] = event.changedTouches;

            if (!touch || shouldIgnoreDragStart(event.target)) {
                return;
            }

            event.preventDefault();
            startReorderSession(touch.clientX, touch.clientY, { touchId: touch.identifier });
            window.addEventListener('touchmove', handleTouchMove, { passive: false });
            window.addEventListener('touchend', finishTouchReorder);
            window.addEventListener('touchcancel', finishTouchReorder);
        });
    }

    function renderLibrary() {
        isReorderEnabled = getIsReorderEnabled();
        isTouchReorderMode = isReorderEnabled && getIsTouchReorderMode();
        elements.musicLibraryList.dataset.reorderEnabled = String(isReorderEnabled);
        elements.musicLibraryList.dataset.reorderMode = isTouchReorderMode ? 'touch' : 'pointer';
        elements.musicLibraryList.innerHTML = '';

        state.music.tracks.forEach((track) => {
            const item = document.createElement('li');
            item.className = `music-library-item${track.id === state.music.activeTrackId ? ' active' : ''}${isReorderEnabled ? '' : ' is-reorder-disabled'}${isTouchReorderMode ? ' is-touch-reorder' : ''}`;
            item.draggable = false;
            item.dataset.trackId = track.id;

            const handle = document.createElement('span');
            handle.className = 'music-library-handle';
            handle.setAttribute('aria-hidden', 'true');
            handle.hidden = !isReorderEnabled;
            handle.title = isReorderEnabled
                ? (isTouchReorderMode
                    ? '이 핸들을 드래그해서 순서를 바꿀 수 있어요'
                    : '드래그해서 순서를 바꿀 수 있어요')
                : '이 브라우저에서는 드래그 정렬을 지원하지 않아요';
            handle.draggable = false;

            const thumbnail = document.createElement('img');
            thumbnail.className = 'music-library-thumb';
            thumbnail.src = track.thumbnailUrl || getThumbnailUrl(track.videoId);
            thumbnail.alt = `${getSafeTitle(track)} 썸네일`;
            thumbnail.draggable = false;

            const info = document.createElement('div');
            info.className = 'music-library-info';

            const title = document.createElement('p');
            title.className = 'music-library-title';
            title.textContent = getSafeTitle(track);

            const url = document.createElement('p');
            url.className = 'music-library-url';
            url.textContent = track.url;

            info.append(title, url);

            const actions = document.createElement('div');
            actions.className = 'music-library-actions';

            const playButton = document.createElement('button');
            playButton.type = 'button';
            playButton.className = 'music-library-btn is-play-btn';
            playButton.textContent = '재생';
            playButton.dataset.hoverLabel = '\u25B6';
            playButton.addEventListener('click', async () => {
                await selectTrack(track.id, true);
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'music-library-btn is-delete-btn';
            deleteButton.textContent = '삭제';
            deleteButton.dataset.hoverLabel = ':(';
            deleteButton.addEventListener('click', async () => {
                if (!await confirmRemoveTrack(track, deleteButton)) {
                    return;
                }

                removeTrack(track.id);
            });

            if (isReorderEnabled) {
                bindPointerReorder(item, track.id, { handleOnly: isTouchReorderMode });
            }
            actions.append(playButton, deleteButton);
            item.append(handle, thumbnail, info, actions);
            elements.musicLibraryList.append(item);
        });

        const count = state.music.tracks.length;
        elements.musicLibraryCount.textContent = `${count}곡 저장됨`;
        elements.musicLibraryEmpty.hidden = count > 0;
    }

    function syncVolume() {
        if (player && isPlayerReady && typeof player.setVolume === 'function') {
            player.setVolume(state.music.volume);
        }
    }

    function updateTrackMetadata(trackId, patch) {
        state.music.tracks = state.music.tracks.map((track) => (
            track.id === trackId ? { ...track, ...patch } : track
        ));
    }

    function closeConfirmDialog(confirmed) {
        if (!activeConfirmResolver) {
            return;
        }

        const resolve = activeConfirmResolver;
        activeConfirmResolver = null;
        elements.confirmDialog.hidden = true;
        resolve(confirmed);
        confirmTriggerElement?.focus();
        confirmTriggerElement = null;
    }

    function confirmRemoveTrack(track, triggerElement) {
        if (
            !elements.confirmDialog
            || !elements.confirmDialogTitle
            || !elements.confirmDialogMessage
            || !elements.confirmDialogCancelButton
            || !elements.confirmDialogConfirmButton
        ) {
            return Promise.resolve(window.confirm(`"${getSafeTitle(track)}" 곡을 재생목록에서 삭제할까요?`));
        }

        if (activeConfirmResolver) {
            closeConfirmDialog(false);
        }

        confirmTriggerElement = triggerElement instanceof HTMLElement ? triggerElement : null;
        elements.confirmDialogTitle.textContent = '이 곡을 삭제할까요?';
        elements.confirmDialogMessage.textContent = `"${getSafeTitle(track)}" 곡이 재생목록에서 사라져요.`;
        elements.confirmDialog.hidden = false;

        return new Promise((resolve) => {
            activeConfirmResolver = resolve;
            window.requestAnimationFrame(() => {
                elements.confirmDialogConfirmButton.focus();
            });
        });
    }

    function upsertTrack(track) {
        const existing = state.music.tracks.find((item) => item.videoId === track.videoId);

        if (existing) {
            updateTrackMetadata(existing.id, {
                url: track.url,
                title: track.title || existing.title,
                thumbnailUrl: track.thumbnailUrl || existing.thumbnailUrl
            });
            state.music.activeTrackId = existing.id;
            return existing.id;
        }

        const id = createTrackId();
        state.music.tracks.unshift({
            id,
            url: track.url,
            videoId: track.videoId,
            title: track.title,
            thumbnailUrl: track.thumbnailUrl
        });
        state.music.activeTrackId = id;
        return id;
    }

    function removeTrack(trackId) {
        const wasActive = state.music.activeTrackId === trackId;
        state.music.tracks = state.music.tracks.filter((track) => track.id !== trackId);

        if (wasActive) {
            const nextTrack = state.music.tracks[0];
            state.music.activeTrackId = nextTrack?.id || '';
            state.music.videoId = nextTrack?.videoId || '';
            state.music.url = nextTrack?.url || '';
            state.music.title = nextTrack?.title || '';
            elements.musicUrlInput.value = state.music.url;
        }

        if (wasActive && player && isPlayerReady) {
            clearAutoplayFallback();
            if (state.music.videoId && typeof player.cueVideoById === 'function') {
                player.cueVideoById(state.music.videoId);
            } else if (typeof player.stopVideo === 'function') {
                player.stopVideo();
            }
        }

        persistMusic();
        renderPreview();
        renderLibrary();
        renderTime(0, 0);
        updateStatus(wasActive ? '현재 곡을 저장 목록에서 삭제했어요.' : '저장된 곡을 삭제했어요.');
    }

    async function ensurePlayer() {
        if (player) {
            return player;
        }

        const YT = await loadYouTubeIframeApi();

        return new Promise((resolve) => {
            player = new YT.Player(elements.youtubePlayerHost, {
                width: '1',
                height: '1',
                videoId: state.music.videoId || undefined,
                playerVars: {
                    autoplay: 0,
                    controls: 0,
                    disablekb: 1,
                    fs: 0,
                    iv_load_policy: 3,
                    loop: state.music.isLooping ? 1 : 0,
                    modestbranding: 1,
                    playsinline: 1,
                    rel: 0,
                    playlist: state.music.videoId || undefined
                },
                events: {
                    onReady: () => {
                        isPlayerReady = true;
                        syncVolume();
                        updateProgress();

                        if (state.music.videoId) {
                            const data = player.getVideoData?.();

                            if (data?.title) {
                                state.music.title = data.title;
                                const activeTrack = getActiveTrack();
                                if (activeTrack) {
                                    updateTrackMetadata(activeTrack.id, { title: data.title });
                                }
                                renderPreview();
                                renderLibrary();
                                persistMusic();
                            }
                        }

                        resolve(player);
                    },
                    onStateChange: (event) => {
                        if (!state.music.videoId) {
                            return;
                        }

                        if (event.data === YT.PlayerState.ENDED) {
                            clearAutoplayFallback();
                            setClockTickerPlaybackState(false);
                            updateProgress();
                            renderClockMusicToggleButton();
                            if (state.music.isLooping) {
                                const nextTrack = getNextTrack();

                                if (nextTrack) {
                                    selectTrack(nextTrack.id, true);
                                } else {
                                    player.seekTo(0);
                                    player.playVideo();
                                }
                            } else {
                                updateStatus('한 곡이 끝났어요. 다음 흐름을 이어가 보세요.');
                            }
                        }

                        if (event.data === YT.PlayerState.PLAYING) {
                            clearAutoplayFallback();
                            setClockTickerPlaybackState(true);
                            startProgressLoop();
                            renderClockMusicToggleButton();
                            const data = player.getVideoData?.();

                            if (data?.title && data.title !== state.music.title) {
                                state.music.title = data.title;
                                const activeTrack = getActiveTrack();
                                if (activeTrack) {
                                    updateTrackMetadata(activeTrack.id, { title: data.title });
                                }
                                renderPreview();
                                renderLibrary();
                                persistMusic();
                            }

                            updateStatus(getPlaybackStatusMessage());
                        }

                        if (event.data === YT.PlayerState.PAUSED) {
                            setClockTickerPlaybackState(false);
                            updateProgress();
                            stopProgressLoop();
                            renderClockMusicToggleButton();
                            updateStatus('잠깐 멈춰도 괜찮아요. 준비되면 다시 이어가요.');
                        }

                        if (event.data === YT.PlayerState.BUFFERING) {
                            updateProgress();
                            renderClockMusicToggleButton();
                        }

                        if (event.data === YT.PlayerState.CUED) {
                            setClockTickerPlaybackState(false);
                            updateProgress();
                            stopProgressLoop();
                            renderClockMusicToggleButton();
                        }
                    }
                }
            });
        });
    }

    async function loadTrack(url, autoplay = false) {
        const videoId = extractVideoId(url);

        if (!videoId) {
            updateStatus('유효한 유튜브 링크가 아닌 것 같아요.');
            elements.musicUrlInput.focus();
            return;
        }

        state.music.url = url.trim();
        state.music.videoId = videoId;
        state.music.title = '';
        state.music.activeTrackId = upsertTrack({
            url: state.music.url,
            videoId,
            title: '',
            thumbnailUrl: getThumbnailUrl(videoId)
        });
        elements.musicTitle.textContent = '곡 불러오는 중...';
        elements.musicUrlInput.value = state.music.url;
        updateStatus('집중에 맞는 배경음을 준비하고 있어요...');
        renderPreview();
        renderLibrary();
        persistMusic();

        try {
            await ensurePlayer();

            if (isPlayerReady) {
                clearAutoplayFallback();
                setClockTickerPlaybackState(false);

                if (autoplay) {
                    player.loadVideoById(videoId);
                    scheduleAutoplayFallback(videoId);
                    updateStatus('집중 세션을 시작했어요.');
                } else if (typeof player.cueVideoById === 'function') {
                    player.cueVideoById(videoId);
                    updateStatus('준비됐어요. 원할 때 바로 재생해요.');
                }

                syncVolume();
                updateProgress();
            }
        } catch (error) {
            updateStatus('지금은 유튜브 플레이어를 불러올 수 없어요.');
        }
    }

    async function selectTrack(trackId, autoplay = false) {
        const track = state.music.tracks.find((item) => item.id === trackId);

        if (!track) {
            updateStatus('저장된 곡을 찾지 못했어요.');
            return;
        }
        await loadTrack(track.url, autoplay);
    }

    function hydrate() {
        elements.musicUrlInput.value = state.music.url;
        renderLoopButton();
        elements.musicVolumeInput.value = String(state.music.volume);
        setVolumeLabel();
        renderPreview();
        renderLibrary();
        renderClockMusicToggleButton();
    }

    function bindEvents() {
        elements.confirmDialogCancelButton?.addEventListener('click', () => {
            closeConfirmDialog(false);
        });

        elements.confirmDialogConfirmButton?.addEventListener('click', () => {
            closeConfirmDialog(true);
        });

        elements.confirmDialog?.addEventListener('click', (event) => {
            if (event.target === elements.confirmDialog) {
                closeConfirmDialog(false);
            }
        });

        window.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && activeConfirmResolver) {
                closeConfirmDialog(false);
            }
        });

        window.addEventListener('resize', () => {
            const nextIsReorderEnabled = getIsReorderEnabled();

            if (nextIsReorderEnabled === isReorderEnabled) {
                return;
            }

            clearDragState();
            renderLibrary();
        });

        async function handleLoad() {
            const url = elements.musicUrlInput.value.trim();

            if (!url) {
                updateStatus('먼저 유튜브 링크를 넣어 주세요.');
                elements.musicUrlInput.focus();
                return;
            }

            await loadTrack(url, true);
        }

        elements.musicForm.addEventListener('submit', (event) => {
            event.preventDefault();
        });

        elements.musicLoadButton.addEventListener('click', async () => {
            await handleLoad();
        });

        elements.musicUrlInput.addEventListener('keydown', async (event) => {
            if (event.key !== 'Enter') {
                return;
            }

            event.preventDefault();
            await handleLoad();
        });

        elements.musicLoopButton.addEventListener('click', () => {
            state.music.isLooping = !state.music.isLooping;
            renderLoopButton();
            persistMusic();
            updateStatus(state.music.isLooping ? '반복 재생으로 집중 흐름을 이어가요.' : '한 곡씩 차분히 재생할게요.');
        });

        elements.clockMusicToggleButton?.addEventListener('click', async () => {
            if (!state.music.videoId) {
                updateStatus('먼저 재생할 유튜브 곡을 불러와 주세요.');
                renderClockMusicToggleButton();
                return;
            }

            await ensurePlayer();

            if (!isPlayerReady) {
                updateStatus('플레이어가 아직 준비 중이에요.');
                renderClockMusicToggleButton();
                return;
            }

            if (getIsClockMusicPlaying()) {
                clearAutoplayFallback();
                player.pauseVideo();
                renderClockMusicToggleButton();
                return;
            }

            player.playVideo();
            updateStatus('집중 세션을 시작했어요.');
            renderClockMusicToggleButton();
        });

        elements.musicVolumeInput.addEventListener('input', () => {
            state.music.volume = Number(elements.musicVolumeInput.value);
            setVolumeLabel();
            syncVolume();
            persistMusic();
        });

        elements.musicSeekInput.addEventListener('input', () => {
            isSeeking = true;

            if (!player || !isPlayerReady) {
                return;
            }

            const durationSeconds = typeof player.getDuration === 'function'
                ? player.getDuration()
                : 0;
            const nextRatio = Number(elements.musicSeekInput.value) / 1000;
            const nextTime = durationSeconds * nextRatio;
            renderTime(nextTime, durationSeconds);
        });

        elements.musicSeekInput.addEventListener('change', () => {
            isSeeking = false;

            if (!player || !isPlayerReady || !state.music.videoId) {
                renderTime(0, 0);
                return;
            }

            const durationSeconds = typeof player.getDuration === 'function'
                ? player.getDuration()
                : 0;
            const nextRatio = Number(elements.musicSeekInput.value) / 1000;
            const nextTime = durationSeconds * nextRatio;

            if (typeof player.seekTo === 'function') {
                player.seekTo(nextTime, true);
            }

            updateProgress();
        });

        elements.musicActions.forEach((button) => {
            button.addEventListener('click', async () => {
                const action = button.dataset.musicAction;

                if (!state.music.videoId) {
                    updateStatus('플레이어를 쓰려면 먼저 유튜브 링크를 불러와 주세요.');
                    return;
                }

                await ensurePlayer();

                if (!isPlayerReady) {
                    updateStatus('플레이어가 아직 준비 중이에요.');
                    return;
                }

                if (action === 'play') {
                    player.playVideo();
                }

                if (action === 'pause') {
                    player.pauseVideo();
                }

                if (action === 'stop') {
                    clearAutoplayFallback();
                    player.stopVideo();
                    stopProgressLoop();
                    renderTime(0, getPlayerDuration());
                    updateStatus('음악을 멈췄어요. 필요한 만큼 조용히 집중해요.');
                }
            });
        });
    }

    async function restore() {
        if (!state.music.videoId) {
            updateStatus('집중용 배경음악을 준비해 보세요.');
            return;
        }

        updateStatus('이전 집중 흐름을 불러오는 중이에요...');

        try {
            await ensurePlayer();

            if (isPlayerReady) {
                clearAutoplayFallback();
                setClockTickerPlaybackState(false);
                player.cueVideoById(state.music.videoId);
                syncVolume();
                renderPreview();
                renderLibrary();
                renderTime(0, getPlayerDuration());
                updateProgress();
                updateStatus('마지막으로 듣던 곡을 준비해 뒀어요. 초록 버튼이나 재생 버튼을 눌러 시작해요.');
            }
        } catch (error) {
            updateStatus('저장된 곡은 찾았지만 플레이어를 복원하지 못했어요.');
        }
    }

    return {
        bindEvents,
        hydrate,
        restore
    };
}
