import { getAppElements } from './dom.js';
import { startClock } from './features/clock.js';
import { createMusicFeature } from './features/music.js';
import { createNotesFeature } from './features/notes.js';
import { createTodosFeature } from './features/todos.js';
import { createWeatherFeature } from './features/weather.js';
import { loadState, saveState as persistState } from './state.js';

const state = loadState();
const elements = getAppElements();
const saveState = () => persistState(state);

const notesFeature = createNotesFeature({ state, saveState, elements });
const todosFeature = createTodosFeature({ state, saveState, elements });
const musicFeature = createMusicFeature({ state, saveState, elements });
const weatherFeature = createWeatherFeature({ state, saveState, elements });

notesFeature.hydrate();
weatherFeature.hydrate();
notesFeature.bindEvents();
todosFeature.bindEvents();
musicFeature.hydrate();
musicFeature.bindEvents();
weatherFeature.bindEvents();

todosFeature.render();
musicFeature.restore();
weatherFeature.refreshWeather();
startClock(elements);
