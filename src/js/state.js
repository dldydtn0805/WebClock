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
        music: createDefaultMusic()
    };
}

export function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
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
            music: {
                url: typeof saved?.music?.url === 'string' ? saved.music.url : defaultState.music.url,
                videoId: typeof saved?.music?.videoId === 'string'
                    ? saved.music.videoId
                    : defaultState.music.videoId,
                title: typeof saved?.music?.title === 'string' ? saved.music.title : defaultState.music.title,
                isLooping: typeof saved?.music?.isLooping === 'boolean'
                    ? saved.music.isLooping
                    : defaultState.music.isLooping,
                volume: Number.isInteger(saved?.music?.volume)
                    ? Math.min(Math.max(saved.music.volume, 0), 100)
                    : defaultState.music.volume,
                activeTrackId: typeof saved?.music?.activeTrackId === 'string'
                    ? saved.music.activeTrackId
                    : defaultState.music.activeTrackId,
                tracks: Array.isArray(saved?.music?.tracks)
                    ? saved.music.tracks
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
                    : defaultState.music.tracks
            }
        };
    } catch (error) {
        return createDefaultState();
    }
}

export function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
