function getGreeting(hours) {
    if (hours < 6) return 'Start softly and keep it simple.';
    if (hours < 12) return 'Good morning. Pick one clear priority.';
    if (hours < 18) return 'Keep the pace steady this afternoon.';
    if (hours < 22) return 'Wrap up the essentials before the night.';
    return 'Slow down and close the day well.';
}

export function updateClock(elements) {
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

export function startClock(elements) {
    updateClock(elements);
    return window.setInterval(() => updateClock(elements), 1000);
}
