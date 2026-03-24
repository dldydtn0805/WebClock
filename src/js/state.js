import { STORAGE_KEY } from './config.js';

export function createDefaultMusic() {
    return {
        url: '',
        videoId: '',
        title: '',
        isLooping: true,
        volume: 70,
        activeTrackId: '',
        tracks: []
    };
}

export function createDefaultState() {
    return {
        weather: '',
        weatherCode: null,
        weatherTemperature: null,
        weatherIsDay: true,
        focus: '',
        music: createDefaultMusic(),
        updatedAt: ''
    };
}

function normalizeTracks(rawTracks, defaultTracks) {
    return Array.isArray(rawTracks)
        ? rawTracks
            .filter((track) => (
                typeof track?.id === 'string'
                && typeof track?.url === 'string'
                && typeof track?.videoId === 'string'
            ))
            .map((track) => ({
                id: track.id,
                url: track.url,
                videoId: track.videoId,
                title: typeof track.title === 'string' ? track.title : '',
                thumbnailUrl: typeof track.thumbnailUrl === 'string' ? track.thumbnailUrl : ''
            }))
        : defaultTracks;
}

function normalizeMusic(rawMusic, defaultMusic = createDefaultMusic()) {
    return {
        url: typeof rawMusic?.url === 'string' ? rawMusic.url : defaultMusic.url,
        videoId: typeof rawMusic?.videoId === 'string'
            ? rawMusic.videoId
            : defaultMusic.videoId,
        title: typeof rawMusic?.title === 'string' ? rawMusic.title : defaultMusic.title,
        isLooping: typeof rawMusic?.isLooping === 'boolean'
            ? rawMusic.isLooping
            : defaultMusic.isLooping,
        volume: Number.isInteger(rawMusic?.volume)
            ? Math.min(Math.max(rawMusic.volume, 0), 100)
            : defaultMusic.volume,
        activeTrackId: typeof rawMusic?.activeTrackId === 'string'
            ? rawMusic.activeTrackId
            : defaultMusic.activeTrackId,
        tracks: normalizeTracks(rawMusic?.tracks, defaultMusic.tracks)
    };
}

function normalizeState(saved) {
    const defaultState = createDefaultState();

    return {
        weather: typeof saved?.weather === 'string' ? saved.weather : defaultState.weather,
        weatherCode: Number.isInteger(saved?.weatherCode) ? saved.weatherCode : defaultState.weatherCode,
        weatherTemperature: Number.isFinite(saved?.weatherTemperature)
            ? saved.weatherTemperature
            : defaultState.weatherTemperature,
        weatherIsDay: typeof saved?.weatherIsDay === 'boolean'
            ? saved.weatherIsDay
            : defaultState.weatherIsDay,
        focus: typeof saved?.focus === 'string' ? saved.focus : defaultState.focus,
        music: normalizeMusic(saved?.music, defaultState.music),
        updatedAt: typeof saved?.updatedAt === 'string' ? saved.updatedAt : defaultState.updatedAt
    };
}

export function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return normalizeState(saved);
    } catch (error) {
        return createDefaultState();
    }
}

export function getSharedStateSnapshot(state) {
    const normalized = normalizeState(state);

    return {
        focus: normalized.focus,
        music: normalized.music,
        updatedAt: normalized.updatedAt
    };
}

export function applySharedState(state, snapshot) {
    const normalized = normalizeState({
        ...state,
        focus: snapshot?.focus,
        music: snapshot?.music,
        updatedAt: snapshot?.updatedAt
    });

    state.focus = normalized.focus;
    state.music = normalized.music;
    state.updatedAt = normalized.updatedAt;

    return state;
}

export function saveState(state, { touch = true } = {}) {
    if (touch) {
        state.updatedAt = new Date().toISOString();
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    return state.updatedAt;
}
