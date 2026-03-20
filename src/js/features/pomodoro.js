import { POMODORO_DURATIONS } from '../config.js';

function formatSeconds(totalSeconds) {
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${minutes}:${seconds}`;
}

function getPomodoroLabel(mode) {
    if (mode === 'focus') return 'Focus Session';
    if (mode === 'shortBreak') return 'Short Break';
    return 'Long Break';
}

function getPomodoroHint(mode) {
    if (mode === 'focus') return 'Stay with one task until the timer ends.';
    if (mode === 'shortBreak') return 'Take a short reset, then come back.';
    return 'Step away for a longer recharge.';
}

export function createPomodoroFeature({ state, saveState, elements }) {
    let intervalId = null;

    function getRoundLabel() {
        const nextRound = Math.min((state.pomodoro.completedFocusSessions % 4) + 1, 4);
        return `Round ${nextRound}`;
    }

    function renderPomodoro() {
        elements.pomodoroTime.textContent = formatSeconds(state.pomodoro.remainingSeconds);
        elements.pomodoroPhase.textContent = getPomodoroLabel(state.pomodoro.mode);
        elements.pomodoroCycle.textContent = getRoundLabel();
        elements.pomodoroHint.textContent = getPomodoroHint(state.pomodoro.mode);
    }

    function stopInterval() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    function getNextPomodoroState() {
        if (state.pomodoro.mode === 'focus') {
            const completedFocusSessions = state.pomodoro.completedFocusSessions + 1;
            const shouldTakeLongBreak = completedFocusSessions % 4 === 0;

            return {
                mode: shouldTakeLongBreak ? 'longBreak' : 'shortBreak',
                remainingSeconds: shouldTakeLongBreak
                    ? POMODORO_DURATIONS.longBreak
                    : POMODORO_DURATIONS.shortBreak,
                isRunning: false,
                completedFocusSessions
            };
        }

        return {
            mode: 'focus',
            remainingSeconds: POMODORO_DURATIONS.focus,
            isRunning: false,
            completedFocusSessions: state.pomodoro.completedFocusSessions
        };
    }

    function completePhase() {
        state.pomodoro = getNextPomodoroState();
        saveState();
        renderPomodoro();
        stopInterval();
    }

    function tick() {
        if (!state.pomodoro.isRunning) return;

        if (state.pomodoro.remainingSeconds > 0) {
            state.pomodoro.remainingSeconds -= 1;
            saveState();
            renderPomodoro();
        }

        if (state.pomodoro.remainingSeconds <= 0) {
            completePhase();
        }
    }

    function start() {
        if (state.pomodoro.isRunning) return;

        state.pomodoro.isRunning = true;
        saveState();
        renderPomodoro();
        intervalId = window.setInterval(tick, 1000);
    }

    function pause() {
        state.pomodoro.isRunning = false;
        saveState();
        stopInterval();
        renderPomodoro();
    }

    function reset() {
        state.pomodoro.isRunning = false;
        state.pomodoro.remainingSeconds = POMODORO_DURATIONS[state.pomodoro.mode];
        saveState();
        stopInterval();
        renderPomodoro();
    }

    function skip() {
        state.pomodoro.isRunning = false;
        state.pomodoro = getNextPomodoroState();
        saveState();
        stopInterval();
        renderPomodoro();
    }

    function bindEvents() {
        elements.pomodoroActions.forEach((button) => {
            button.addEventListener('click', () => {
                const action = button.dataset.action;

                if (action === 'start') start();
                if (action === 'pause') pause();
                if (action === 'reset') reset();
                if (action === 'skip') skip();
            });
        });
    }

    function resumeIfNeeded() {
        if (state.pomodoro.isRunning) {
            intervalId = window.setInterval(tick, 1000);
        }
    }

    return {
        bindEvents,
        render: renderPomodoro,
        resumeIfNeeded
    };
}
