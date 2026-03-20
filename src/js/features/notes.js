export function createNotesFeature({ state, saveState, elements }) {
    function hydrate() {
        elements.focusInput.value = state.focus;
    }

    function bindEvents() {
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
