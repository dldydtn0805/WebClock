import { getAppElements } from './dom.js?v=20260325-52';
import { startClock } from './features/clock.js?v=20260325-52';
import { createFocusFeature } from './features/focus.js?v=20260325-52';
import { createMusicFeature } from './features/music.js?v=20260325-52';
import { createWeatherFeature } from './features/weather.js?v=20260325-52';
import { loadState, saveState as persistState } from './state.js?v=20260325-52';

const state = loadState();
const elements = getAppElements();
const saveState = () => persistState(state);

const focusFeature = createFocusFeature({ state, saveState, elements });
const musicFeature = createMusicFeature({ state, saveState, elements });
const weatherFeature = createWeatherFeature({ state, saveState, elements });

startClock(elements);

try {
    focusFeature.hydrate();
    focusFeature.bindEvents();
} catch (error) {
    console.error('Focus feature failed to initialize.', error);
}

try {
    weatherFeature.hydrate();
    weatherFeature.bindEvents();
    weatherFeature.refreshWeather();
} catch (error) {
    console.error('Weather feature failed to initialize.', error);
}

try {
    musicFeature.hydrate();
    musicFeature.bindEvents();
    musicFeature.restore();
} catch (error) {
    console.error('Music feature failed to initialize.', error);
}
