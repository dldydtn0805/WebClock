function getNextTheme(theme) {
    return theme === 'dark' ? 'light' : 'dark';
}

function applyThemeToDom(elements, theme) {
    if (!elements?.body) {
        return;
    }

    const isDark = theme === 'dark';
    elements.body.classList.toggle('night-mode', isDark);

    if (!elements.themeToggleButton) {
        return;
    }

    elements.themeToggleButton.setAttribute('aria-pressed', String(isDark));
    elements.themeToggleButton.textContent = isDark ? '라이트 모드' : '다크 모드';
    elements.themeToggleButton.title = isDark
        ? '라이트 모드로 전환'
        : '다크 모드로 전환';
}

export function createThemeFeature({ state, saveState, elements }) {
    const applyTheme = () => {
        applyThemeToDom(elements, state.theme);
    };

    return {
        hydrate() {
            applyTheme();
        },
        bindEvents() {
            if (!elements?.themeToggleButton) {
                return;
            }

            elements.themeToggleButton.addEventListener('click', () => {
                state.theme = getNextTheme(state.theme);
                applyTheme();
                saveState({ sync: false, touch: false });
            });
        }
    };
}
