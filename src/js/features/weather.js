const WEATHER_CODES = {
    0: 'Clear',
    1: 'Mostly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Rime fog',
    51: 'Light drizzle',
    53: 'Drizzle',
    55: 'Dense drizzle',
    56: 'Freezing drizzle',
    57: 'Heavy freezing drizzle',
    61: 'Light rain',
    63: 'Rain',
    65: 'Heavy rain',
    66: 'Freezing rain',
    67: 'Heavy freezing rain',
    71: 'Light snow',
    73: 'Snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Rain showers',
    81: 'Heavy rain showers',
    82: 'Violent rain showers',
    85: 'Snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with hail',
    99: 'Severe thunderstorm with hail'
};

function getWeatherLabel(code, isDay) {
    if (code === 0) {
        return isDay ? 'Sunny' : 'Clear night';
    }

    return WEATHER_CODES[code] ?? 'Current conditions';
}

function formatTemperature(value) {
    return `${Math.round(value)}C`;
}

function renderWeather(elements, { summary, meta, isError = false, isLoading = false }) {
    elements.weatherSummary.textContent = summary;
    elements.weatherMeta.textContent = meta;
    elements.weatherSummary.dataset.state = isError ? 'error' : (isLoading ? 'loading' : 'ready');
    elements.weatherRefreshButton.disabled = isLoading;
    elements.weatherRefreshButton.textContent = isLoading ? 'Refreshing...' : 'Refresh';
}

function getWeatherErrorMeta(error) {
    if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 1) {
            return 'Location permission was blocked';
        }

        if (error.code === 2) {
            return 'Current location is unavailable';
        }

        if (error.code === 3) {
            return 'Location request timed out';
        }
    }

    const message = typeof error?.message === 'string' ? error.message : '';
    if (message.toLowerCase().includes('geolocation')) {
        return 'Allow location access and try again';
    }

    return 'Weather service is temporarily unavailable';
}

function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported in this browser.'));
            return;
        }

        navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 10 * 60 * 1000
        });
    });
}

async function fetchWeather(latitude, longitude) {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude.toFixed(4));
    url.searchParams.set('longitude', longitude.toFixed(4));
    url.searchParams.set(
        'current',
        'temperature_2m,apparent_temperature,weather_code,wind_speed_10m,is_day'
    );
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Weather request failed with status ${response.status}.`);
    }

    const data = await response.json();
    if (!data.current) {
        throw new Error('Weather data is unavailable.');
    }

    return data.current;
}

export function createWeatherFeature({ state, saveState, elements }) {
    function hydrate() {
        if (state.weather) {
            renderWeather(elements, {
                summary: state.weather,
                meta: 'Last saved weather snapshot'
            });
            return;
        }

        renderWeather(elements, {
            summary: 'Loading current weather...',
            meta: 'Using your current location',
            isLoading: true
        });
    }

    async function refreshWeather() {
        renderWeather(elements, {
            summary: 'Loading current weather...',
            meta: 'Using your current location',
            isLoading: true
        });

        try {
            const position = await getCurrentPosition();
            const weather = await fetchWeather(
                position.coords.latitude,
                position.coords.longitude
            );

            const summary = [
                getWeatherLabel(weather.weather_code, weather.is_day === 1),
                formatTemperature(weather.temperature_2m),
                `Feels like ${formatTemperature(weather.apparent_temperature)}`,
                `Wind ${Math.round(weather.wind_speed_10m)} km/h`
            ].join(' · ');

            state.weather = summary;
            saveState();

            renderWeather(elements, {
                summary,
                meta: 'Auto-updated from your current location'
            });
        } catch (error) {
            renderWeather(elements, {
                summary: state.weather || 'Unable to load weather automatically.',
                meta: getWeatherErrorMeta(error),
                isError: true
            });
        }
    }

    function bindEvents() {
        elements.weatherRefreshButton.addEventListener('click', () => {
            refreshWeather();
        });
    }

    return {
        bindEvents,
        hydrate,
        refreshWeather
    };
}
