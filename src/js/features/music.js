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
    let shouldAutoplayOnReady = false;
    let progressIntervalId = null;
    let isSeeking = false;

    function formatPlaybackTime(totalSeconds) {
        const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
        const minutes = Math.floor(safeSeconds / 60);
        const seconds = String(safeSeconds % 60).padStart(2, '0');
        return `${minutes}:${seconds}`;
    }

    function updateStatus(message) {
        elements.musicStatus.textContent = message;
    }

    function persistMusic() {
        saveState();
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

    function setVolumeLabel() {
        elements.musicVolumeValue.textContent = `${state.music.volume}%`;
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

    function updateProgress() {
        if (!player || !isPlayerReady) {
            renderTime(0, 0);
            return;
        }

        const currentSeconds = typeof player.getCurrentTime === 'function'
            ? player.getCurrentTime()
            : 0;
        const durationSeconds = typeof player.getDuration === 'function'
            ? player.getDuration()
            : 0;

        renderTime(currentSeconds, durationSeconds);
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

        if (thumbnailUrl) {
            elements.musicThumbnail.src = thumbnailUrl;
            elements.musicThumbnail.alt = state.music.title || activeTrack?.title || '선택한 유튜브 곡 썸네일';
            elements.musicThumbnail.hidden = false;
        } else {
            elements.musicThumbnail.hidden = true;
            elements.musicThumbnail.alt = '';
        }
    }

    function renderLibrary() {
        elements.musicLibraryList.innerHTML = '';

        state.music.tracks.forEach((track) => {
            const item = document.createElement('li');
            item.className = `music-library-item${track.id === state.music.activeTrackId ? ' active' : ''}`;

            const thumbnail = document.createElement('img');
            thumbnail.className = 'music-library-thumb';
            thumbnail.src = track.thumbnailUrl || getThumbnailUrl(track.videoId);
            thumbnail.alt = `${getSafeTitle(track)} 썸네일`;

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
            playButton.className = 'music-library-btn';
            playButton.textContent = '재생';
            playButton.addEventListener('click', async () => {
                await selectTrack(track.id, true);
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'music-library-btn';
            deleteButton.textContent = '삭제';
            deleteButton.addEventListener('click', () => {
                removeTrack(track.id);
            });

            actions.append(playButton, deleteButton);
            item.append(thumbnail, info, actions);
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

                        if (shouldAutoplayOnReady && state.music.videoId) {
                            player.playVideo();
                            updateStatus(`"${state.music.title || '선택한 곡'}"을(를) 반복 재생하고 있어요.`);
                            shouldAutoplayOnReady = false;
                        }

                        resolve(player);
                    },
                    onStateChange: (event) => {
                        if (!state.music.videoId) {
                            return;
                        }

                        if (event.data === YT.PlayerState.ENDED) {
                            updateProgress();
                            if (state.music.isLooping) {
                                const nextTrack = getNextTrack();

                                if (nextTrack) {
                                    selectTrack(nextTrack.id, true);
                                } else {
                                    player.seekTo(0);
                                    player.playVideo();
                                }
                            } else {
                                updateStatus('재생이 끝났어요.');
                            }
                        }

                        if (event.data === YT.PlayerState.PLAYING) {
                            startProgressLoop();
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

                            updateStatus(`"${state.music.title || '선택한 곡'}"을(를)${state.music.isLooping ? ' 반복 재생 중이에요.' : ' 재생 중이에요.'}`);
                        }

                        if (event.data === YT.PlayerState.PAUSED) {
                            updateProgress();
                            stopProgressLoop();
                            updateStatus('재생을 잠시 멈췄어요.');
                        }

                        if (event.data === YT.PlayerState.BUFFERING) {
                            updateProgress();
                        }

                        if (event.data === YT.PlayerState.CUED) {
                            updateProgress();
                            stopProgressLoop();
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
        updateStatus('유튜브 플레이어를 불러오는 중이에요...');
        renderPreview();
        renderLibrary();
        persistMusic();

        try {
            shouldAutoplayOnReady = autoplay;
            await ensurePlayer();

            if (isPlayerReady) {
                if (autoplay) {
                    player.loadVideoById(videoId);
                } else if (typeof player.cueVideoById === 'function') {
                    player.cueVideoById(videoId);
                    updateStatus('곡을 불러왔어요. 원할 때 재생해 주세요.');
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

        state.music.activeTrackId = track.id;
        state.music.url = track.url;
        state.music.videoId = track.videoId;
        state.music.title = track.title || '';
        elements.musicUrlInput.value = track.url;
        renderPreview();
        renderLibrary();
        persistMusic();
        await loadTrack(track.url, autoplay);
    }

    function hydrate() {
        elements.musicUrlInput.value = state.music.url;
        elements.musicLoopInput.checked = state.music.isLooping;
        elements.musicVolumeInput.value = String(state.music.volume);
        setVolumeLabel();
        renderPreview();
        renderLibrary();
    }

    function bindEvents() {
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

        elements.musicLoopInput.addEventListener('change', () => {
            state.music.isLooping = elements.musicLoopInput.checked;
            persistMusic();
            updateStatus(state.music.isLooping ? '목록 반복 재생이 켜졌어요.' : '목록 반복 재생이 꺼졌어요.');
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
                    player.stopVideo();
                    stopProgressLoop();
                    renderTime(0, typeof player.getDuration === 'function' ? player.getDuration() : 0);
                    updateStatus('재생을 멈췄어요.');
                }
            });
        });
    }

    async function restore() {
        if (!state.music.videoId) {
            updateStatus('유튜브 링크를 넣으면 반복 배경음악을 시작할 수 있어요.');
            return;
        }

        updateStatus('마지막으로 들은 곡을 복원하는 중이에요...');

        try {
            await ensurePlayer();

            if (isPlayerReady) {
                player.cueVideoById(state.music.videoId);
                syncVolume();
                renderPreview();
                renderLibrary();
                updateProgress();
                updateStatus('마지막 곡을 불러왔어요. 재생을 눌러 이어서 들을 수 있어요.');
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
