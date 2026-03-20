import { POMODORO_DURATIONS, STORAGE_KEY } from './config.js';

export function createDefaultPomodoro() {
    return {
        mode: 'focus',
        remainingSeconds: POMODORO_DURATIONS.focus,
        isRunning: false,
        completedFocusSessions: 0
    };
}

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
        todos: [],
        weather: '',
        weatherCode: null,
        weatherTemperature: null,
        weatherIsDay: true,
        focus: '',
        pomodoro: createDefaultPomodoro(),
        music: createDefaultMusic()
    };
}

function isValidPomodoroMode(mode) {
    return mode === 'focus' || mode === 'shortBreak' || mode === 'longBreak';
}

export function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const defaultState = createDefaultState();

        return {
            todos: Array.isArray(saved?.todos) ? saved.todos : defaultState.todos,
            weather: typeof saved?.weather === 'string' ? saved.weather : defaultState.weather,
            weatherCode: Number.isInteger(saved?.weatherCode) ? saved.weatherCode : defaultState.weatherCode,
            weatherTemperature: Number.isFinite(saved?.weatherTemperature)
                ? saved.weatherTemperature
                : defaultState.weatherTemperature,
            weatherIsDay: typeof saved?.weatherIsDay === 'boolean'
                ? saved.weatherIsDay
                : defaultState.weatherIsDay,
            focus: typeof saved?.focus === 'string' ? saved.focus : defaultState.focus,
            pomodoro: {
                mode: isValidPomodoroMode(saved?.pomodoro?.mode)
                    ? saved.pomodoro.mode
                    : defaultState.pomodoro.mode,
                remainingSeconds: Number.isInteger(saved?.pomodoro?.remainingSeconds)
                    ? saved.pomodoro.remainingSeconds
                    : defaultState.pomodoro.remainingSeconds,
                isRunning: Boolean(saved?.pomodoro?.isRunning),
                completedFocusSessions: Number.isInteger(saved?.pomodoro?.completedFocusSessions)
                    ? saved.pomodoro.completedFocusSessions
                    : defaultState.pomodoro.completedFocusSessions
            },
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
