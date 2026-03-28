import { getAppElements } from './dom.js?v=20260329-70';
import { startClock } from './features/clock.js?v=20260329-70';
import { createFocusFeature } from './features/focus.js?v=20260325-52';
import { createMusicFeature } from './features/music.js?v=20260326-65';
import { createThemeFeature } from './features/theme.js?v=20260329-70';
import { createWeatherFeature } from './features/weather.js?v=20260326-68';
import { createWorkspaceFeature } from './features/workspace.js?v=20260325-54';
import { loadState, saveState as persistState } from './state.js?v=20260329-70';

const state = loadState();
const elements = getAppElements();
let workspaceFeature;
const persistLocalState = (options = {}) => persistState(state, options);
const saveState = (options = {}) => {
    persistLocalState(options);

    if (options.sync === false) {
        return;
    }

    workspaceFeature?.scheduleSync();
};

const focusFeature = createFocusFeature({ state, saveState, elements });
const musicFeature = createMusicFeature({ state, saveState, elements });
const themeFeature = createThemeFeature({ state, saveState, elements });
const weatherFeature = createWeatherFeature({ state, saveState, elements });
workspaceFeature = createWorkspaceFeature({
    state,
    elements,
    persistLocalState,
    onSharedStateChange: () => {
        focusFeature.hydrate();
        musicFeature.hydrate();
    }
});

try {
    themeFeature.hydrate();
    themeFeature.bindEvents();
} catch (error) {
    console.error('Theme feature failed to initialize.', error);
}

startClock(elements);
workspaceFeature.bindEvents();
await workspaceFeature.initialize();

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
