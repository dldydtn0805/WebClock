const STORAGE_KEY = 'desk-clock-planner-state';
const POMODORO_DURATIONS = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
};

function createDefaultPomodoro() {
    return {
        mode: 'focus',
        remainingSeconds: POMODORO_DURATIONS.focus,
        isRunning: false,
        completedFocusSessions: 0
    };
}

function createDefaultState() {
    return {
        todos: [],
        memo: '',
        focus: '',
        pomodoro: createDefaultPomodoro()
    };
}

function loadState() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        const defaultState = createDefaultState();
        const savedPomodoro = saved && saved.pomodoro ? saved.pomodoro : {};

        return {
            todos: Array.isArray(saved && saved.todos) ? saved.todos : defaultState.todos,
            memo: typeof (saved && saved.memo) === 'string' ? saved.memo : defaultState.memo,
            focus: typeof (saved && saved.focus) === 'string' ? saved.focus : defaultState.focus,
            pomodoro: {
                mode: savedPomodoro.mode === 'focus' || savedPomodoro.mode === 'shortBreak' || savedPomodoro.mode === 'longBreak'
                    ? savedPomodoro.mode
                    : defaultState.pomodoro.mode,
                remainingSeconds: Number.isInteger(savedPomodoro.remainingSeconds)
                    ? savedPomodoro.remainingSeconds
                    : defaultState.pomodoro.remainingSeconds,
                isRunning: Boolean(savedPomodoro.isRunning),
                completedFocusSessions: Number.isInteger(savedPomodoro.completedFocusSessions)
                    ? savedPomodoro.completedFocusSessions
                    : defaultState.pomodoro.completedFocusSessions
            }
        };
    } catch (error) {
        return createDefaultState();
    }
}

function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function getAppElements() {
    return {
        body: document.body,
        time: document.querySelector('.pixel-time'),
        date: document.querySelector('.pixel-date'),
        greeting: document.querySelector('.greeting-text'),
        completedCount: document.querySelector('.completed-count'),
        taskCount: document.querySelector('.task-count'),
        emptyState: document.querySelector('.empty-state'),
        todoForm: document.querySelector('.todo-form'),
        todoInput: document.getElementById('todo-input'),
        todoList: document.querySelector('.todo-list'),
        memoInput: document.getElementById('memo-input'),
        focusInput: document.getElementById('focus-input'),
        pomodoroTime: document.querySelector('.pomodoro-time'),
        pomodoroPhase: document.querySelector('.pomodoro-phase'),
        pomodoroCycle: document.querySelector('.pomodoro-cycle'),
        pomodoroHint: document.querySelector('.pomodoro-hint'),
        pomodoroActions: document.querySelectorAll('.timer-btn')
    };
}

function getGreeting(hours) {
    if (hours < 6) return 'Start softly and keep it simple.';
    if (hours < 12) return 'Good morning. Pick one clear priority.';
    if (hours < 18) return 'Keep the pace steady this afternoon.';
    if (hours < 22) return 'Wrap up the essentials before the night.';
    return 'Slow down and close the day well.';
}

function updateClock(elements) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');

    elements.time.textContent = `${String(hours).padStart(2, '0')}:${minutes}`;
    elements.date.textContent = now.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    });
    elements.greeting.textContent = getGreeting(hours);
    elements.body.classList.toggle('night-mode', hours >= 20 || hours < 6);
}

function startClock(elements) {
    updateClock(elements);
    return window.setInterval(function () {
        updateClock(elements);
    }, 1000);
}

function createNotesFeature(options) {
    const state = options.state;
    const persist = options.saveState;
    const elements = options.elements;

    return {
        hydrate() {
            elements.memoInput.value = state.memo;
            elements.focusInput.value = state.focus;
        },
        bindEvents() {
            elements.memoInput.addEventListener('input', function () {
                state.memo = elements.memoInput.value;
                persist(state);
            });

            elements.focusInput.addEventListener('input', function () {
                state.focus = elements.focusInput.value;
                persist(state);
            });
        }
    };
}

function createTodosFeature(options) {
    const state = options.state;
    const persist = options.saveState;
    const elements = options.elements;

    function renderTodos() {
        elements.todoList.innerHTML = '';

        state.todos.forEach(function (todo) {
            const item = document.createElement('li');
            item.className = `todo-item${todo.done ? ' done' : ''}`;

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.className = 'todo-check';
            checkbox.checked = todo.done;
            checkbox.setAttribute('aria-label', `Mark ${todo.text} as done`);
            checkbox.addEventListener('change', function () {
                toggleTodo(todo.id);
            });

            const text = document.createElement('span');
            text.className = 'todo-text';
            text.textContent = todo.text;

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.type = 'button';
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', function () {
                deleteTodo(todo.id);
            });

            item.append(checkbox, text, deleteButton);
            elements.todoList.append(item);
        });

        const total = state.todos.length;
        const completed = state.todos.filter(function (todo) {
            return todo.done;
        }).length;

        elements.completedCount.textContent = `${completed} / ${total}`;
        elements.taskCount.textContent = `${total} item${total === 1 ? '' : 's'}`;
        elements.emptyState.hidden = total > 0;
    }

    function createId() {
        if (window.crypto && typeof window.crypto.randomUUID === 'function') {
            return window.crypto.randomUUID();
        }

        return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }

    function addTodo(text) {
        state.todos.unshift({
            id: createId(),
            text,
            done: false
        });
        persist(state);
        renderTodos();
    }

    function toggleTodo(id) {
        state.todos = state.todos.map(function (todo) {
            return todo.id === id ? { ...todo, done: !todo.done } : todo;
        });
        persist(state);
        renderTodos();
    }

    function deleteTodo(id) {
        state.todos = state.todos.filter(function (todo) {
            return todo.id !== id;
        });
        persist(state);
        renderTodos();
    }

    return {
        render: renderTodos,
        bindEvents() {
            elements.todoForm.addEventListener('submit', function (event) {
                event.preventDefault();
                const text = elements.todoInput.value.trim();

                if (!text) {
                    elements.todoInput.focus();
                    return;
                }

                addTodo(text);
                elements.todoInput.value = '';
                elements.todoInput.focus();
            });
        }
    };
}

function createPomodoroFeature(options) {
    const state = options.state;
    const persist = options.saveState;
    const elements = options.elements;
    let intervalId = null;

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
                remainingSeconds: shouldTakeLongBreak ? POMODORO_DURATIONS.longBreak : POMODORO_DURATIONS.shortBreak,
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
        persist(state);
        renderPomodoro();
        stopInterval();
    }

    function tick() {
        if (!state.pomodoro.isRunning) return;

        if (state.pomodoro.remainingSeconds > 0) {
            state.pomodoro.remainingSeconds -= 1;
            persist(state);
            renderPomodoro();
        }

        if (state.pomodoro.remainingSeconds <= 0) {
            completePhase();
        }
    }

    function start() {
        if (state.pomodoro.isRunning) return;

        state.pomodoro.isRunning = true;
        persist(state);
        renderPomodoro();
        intervalId = window.setInterval(tick, 1000);
    }

    function pause() {
        state.pomodoro.isRunning = false;
        persist(state);
        stopInterval();
        renderPomodoro();
    }

    function reset() {
        state.pomodoro.isRunning = false;
        state.pomodoro.remainingSeconds = POMODORO_DURATIONS[state.pomodoro.mode];
        persist(state);
        stopInterval();
        renderPomodoro();
    }

    function skip() {
        state.pomodoro.isRunning = false;
        state.pomodoro = getNextPomodoroState();
        persist(state);
        stopInterval();
        renderPomodoro();
    }

    return {
        render: renderPomodoro,
        bindEvents() {
            elements.pomodoroActions.forEach(function (button) {
                button.addEventListener('click', function () {
                    const action = button.dataset.action;

                    if (action === 'start') start();
                    if (action === 'pause') pause();
                    if (action === 'reset') reset();
                    if (action === 'skip') skip();
                });
            });
        },
        resumeIfNeeded() {
            if (state.pomodoro.isRunning) {
                intervalId = window.setInterval(tick, 1000);
            }
        }
    };
}

const state = loadState();
const elements = getAppElements();

const notesFeature = createNotesFeature({
    state,
    saveState,
    elements
});

const todosFeature = createTodosFeature({
    state,
    saveState,
    elements
});

const pomodoroFeature = createPomodoroFeature({
    state,
    saveState,
    elements
});

notesFeature.hydrate();
notesFeature.bindEvents();
todosFeature.bindEvents();
pomodoroFeature.bindEvents();

todosFeature.render();
pomodoroFeature.render();
pomodoroFeature.resumeIfNeeded();
startClock(elements);
