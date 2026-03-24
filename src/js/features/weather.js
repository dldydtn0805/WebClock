const WEATHER_CODES = {
    0: '맑음',
    1: '대체로 맑음',
    2: '구름 조금',
    3: '흐림',
    45: '안개',
    48: '서리 안개',
    51: '약한 이슬비',
    53: '이슬비',
    55: '강한 이슬비',
    56: '어는 이슬비',
    57: '강한 어는 이슬비',
    61: '약한 비',
    63: '비',
    65: '강한 비',
    66: '어는 비',
    67: '강한 어는 비',
    71: '약한 눈',
    73: '눈',
    75: '강한 눈',
    77: '싸락눈',
    80: '소나기',
    81: '강한 소나기',
    82: '매우 강한 소나기',
    85: '눈 소나기',
    86: '강한 눈 소나기',
    95: '뇌우',
    96: '우박을 동반한 뇌우',
    99: '강한 우박을 동반한 뇌우'
};

const SEOUL_LOCATION = {
    latitude: 37.5665,
    longitude: 126.9780,
    label: '서울, 대한민국'
};

function getWeatherLabel(code, isDay) {
    if (code === 0) {
        return isDay ? '맑음' : '맑은 밤';
    }

    return WEATHER_CODES[code] ?? '현재 날씨';
}

function formatTemperature(value) {
    return `${Math.round(value)}도`;
}

function getNumericTemperature(value) {
    return Number.isFinite(value) ? value : null;
}

function renderWeather(elements, { summary, meta, isError = false, isLoading = false }) {
    if (!elements.weatherSummary || !elements.weatherMeta || !elements.weatherRefreshButton) {
        return;
    }

    elements.weatherSummary.textContent = summary;
    elements.weatherMeta.textContent = meta;
    elements.weatherSummary.dataset.state = isError ? 'error' : (isLoading ? 'loading' : 'ready');
    elements.weatherRefreshButton.disabled = isLoading;
    elements.weatherRefreshButton.textContent = isLoading ? '불러오는 중...' : '새로고침';
}

function getWeatherErrorMeta(error) {
    const message = typeof error?.message === 'string' ? error.message : '';

    if (message.toLowerCase().includes('failed with status')) {
        return `서울 날씨 불러오기 오류: ${message}`;
    }

    return '서울 날씨 정보를 잠시 불러올 수 없어요';
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
        throw new Error(`날씨 요청 실패: 상태 코드 ${response.status}`);
    }

    const data = await response.json();
    if (!data.current) {
        throw new Error('날씨 데이터를 받을 수 없어요.');
    }

    return data.current;
}

export function createWeatherFeature({ state, saveState, elements }) {
    function hydrate() {
        if (!elements.weatherSummary || !elements.weatherMeta || !elements.weatherRefreshButton) {
            return;
        }

        if (state.weather) {
            renderWeather(elements, {
                summary: state.weather,
                meta: `마지막으로 저장된 ${SEOUL_LOCATION.label} 날씨`
            });
            return;
        }

        renderWeather(elements, {
            summary: '서울 날씨 불러오는 중...',
            meta: SEOUL_LOCATION.label,
            isLoading: true
        });
    }

    async function refreshWeather() {
        renderWeather(elements, {
            summary: '서울 날씨 불러오는 중...',
            meta: SEOUL_LOCATION.label,
            isLoading: true
        });

        try {
            const weather = await fetchWeather(
                SEOUL_LOCATION.latitude,
                SEOUL_LOCATION.longitude
            );

            const summary = [
                getWeatherLabel(weather.weather_code, weather.is_day === 1),
                formatTemperature(weather.temperature_2m),
                `체감 ${formatTemperature(weather.apparent_temperature)}`,
                `바람 ${Math.round(weather.wind_speed_10m)} km/h`
            ].join(' · ');

            state.weather = summary;
            state.weatherCode = weather.weather_code;
            state.weatherIsDay = weather.is_day === 1;
            state.weatherTemperature = getNumericTemperature(weather.temperature_2m);
            saveState();

            renderWeather(elements, {
                summary,
                meta: `${SEOUL_LOCATION.label} 기준으로 자동 갱신됨`
            });
        } catch (error) {
            renderWeather(elements, {
                summary: state.weather || '서울 날씨를 자동으로 불러오지 못했어요.',
                meta: getWeatherErrorMeta(error),
                isError: true
            });
        }
    }

    function bindEvents() {
        if (!elements.weatherRefreshButton) {
            return;
        }

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
