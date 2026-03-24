function getGreeting(hours) {
    if (hours < 6) return '천천히 시작해도 괜찮아요.';
    if (hours < 12) return '좋은 아침이에요. 가장 중요한 일부터 해봐요.';
    if (hours < 18) return '오후에도 리듬을 잃지 말고 이어가 봐요.';
    if (hours < 22) return '오늘 꼭 필요한 일들만 차분히 마무리해요.';
    return '이제는 조금 느리게 하루를 닫아도 좋아요.';
}

export function setClockTickerMessage(elements, message, mode = 'default') {
    if (!elements?.clockTicker || !elements?.clockTickerTexts?.length) {
        return;
    }

    elements.clockTicker.dataset.tickerMode = mode;
    elements.clockTickerTexts.forEach((element) => {
        element.textContent = message;
    });
}

export function updateClock(elements) {
    if (!elements?.time || !elements?.date || !elements?.body) {
        return;
    }

    const now = new Date();
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');

    elements.time.textContent = `${String(hours).padStart(2, '0')}:${minutes}`;
    elements.date.textContent = now.toLocaleDateString('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    if (elements.clockTicker?.dataset.tickerMode !== 'music') {
        setClockTickerMessage(
            elements,
            `${getGreeting(hours)} 현재 시간이 항상 표시됩니다.`,
            'default'
        );
    }

    elements.body.classList.remove('night-mode');
}

export function startClock(elements) {
    updateClock(elements);
    return window.setInterval(() => updateClock(elements), 1000);
}
