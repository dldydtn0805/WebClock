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
        return track?.title || 'Untitled YouTube track';
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

        elements.musicTitle.textContent = state.music.title || activeTrack?.title || 'No track loaded';
        elements.musicCurrentMeta.textContent = activeTrack
            ? `${getSafeTitle(activeTrack)} is ready to play.`
            : 'Save favorite YouTube links and switch between them anytime.';

        if (thumbnailUrl) {
            elements.musicThumbnail.src = thumbnailUrl;
            elements.musicThumbnail.alt = state.music.title || activeTrack?.title || 'Selected YouTube track thumbnail';
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
            thumbnail.alt = `${getSafeTitle(track)} thumbnail`;

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
            playButton.textContent = 'Play';
            playButton.addEventListener('click', async () => {
                await selectTrack(track.id, true);
            });

            const deleteButton = document.createElement('button');
            deleteButton.type = 'button';
            deleteButton.className = 'music-library-btn';
            deleteButton.textContent = 'Remove';
            deleteButton.addEventListener('click', () => {
                removeTrack(track.id);
            });

            actions.append(playButton, deleteButton);
            item.append(thumbnail, info, actions);
            elements.musicLibraryList.append(item);
        });

        const count = state.music.tracks.length;
        elements.musicLibraryCount.textContent = `${count} saved`;
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
        updateStatus(wasActive ? 'Track removed from saved list.' : 'Saved track removed.');
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
                            updateStatus(`Playing "${state.music.title || 'selected track'}" on loop.`);
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
                                updateStatus('Playback finished.');
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

                            updateStatus(`Playing "${state.music.title || 'selected track'}"${state.music.isLooping ? ' on loop.' : '.'}`);
                        }

                        if (event.data === YT.PlayerState.PAUSED) {
                            updateProgress();
                            stopProgressLoop();
                            updateStatus('Playback paused.');
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
            updateStatus('That link does not look like a valid YouTube URL.');
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
        elements.musicTitle.textContent = 'Loading track...';
        elements.musicUrlInput.value = state.music.url;
        updateStatus('Loading YouTube player...');
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
                    updateStatus('Track loaded. Press play when you are ready.');
                }

                syncVolume();
                updateProgress();
            }
        } catch (error) {
            updateStatus('Unable to load the YouTube player right now.');
        }
    }

    async function selectTrack(trackId, autoplay = false) {
        const track = state.music.tracks.find((item) => item.id === trackId);

        if (!track) {
            updateStatus('Saved track could not be found.');
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
                updateStatus('Paste a YouTube link first.');
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
            updateStatus(state.music.isLooping ? 'Playlist loop is on.' : 'Playlist loop is off.');
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
                    updateStatus('Load a YouTube link before using the player controls.');
                    return;
                }

                await ensurePlayer();

                if (!isPlayerReady) {
                    updateStatus('The player is still getting ready.');
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
                    updateStatus('Playback stopped.');
                }
            });
        });
    }

    async function restore() {
        if (!state.music.videoId) {
            updateStatus('Paste a YouTube link to start a loopable background track.');
            return;
        }

        updateStatus('Restoring your last YouTube track...');

        try {
            await ensurePlayer();

            if (isPlayerReady) {
                player.cueVideoById(state.music.videoId);
                syncVolume();
                renderPreview();
                renderLibrary();
                updateProgress();
                updateStatus('Last track restored. Press play to resume.');
            }
        } catch (error) {
            updateStatus('Saved track found, but the YouTube player could not be restored.');
        }
    }

    return {
        bindEvents,
        hydrate,
        restore
    };
}
