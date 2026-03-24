export function createFocusFeature({ state, saveState, elements }) {
    function hydrate() {
        if (!elements.focusInput) {
            return;
        }

        elements.focusInput.value = state.focus;
    }

    function bindEvents() {
        if (!elements.focusInput) {
            return;
        }

        elements.focusInput.addEventListener('input', () => {
            state.focus = elements.focusInput.value;
            saveState();
        });
    }

    return {
        bindEvents,
        hydrate
    };
}
