const timeEl = document.querySelector('.pixel-time');
const dateEl = document.querySelector('.pixel-date');
const sfx = document.getElementById('zelda-sfx');
const body = document.body;
const frame = document.querySelector('.zelda-frame');

function updateClock() {
const now = new Date();
const h = String(now.getHours()).padStart(2, '0');
const m = String(now.getMinutes()).padStart(2, '0');
const s = String(now.getSeconds()).padStart(2, '0');
const timeStr = `${h}:${m}:${s}`;
const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

timeEl.textContent = timeStr;
dateEl.textContent = dateStr;

// 효과음 재생 (1초 단위)
sfx.currentTime = 0;
sfx.play();

// 야간 모드
if (now.getHours() >= 20 || now.getHours() < 6) {
body.style.background = '#0f0f0f';
frame.style.borderColor = '#555';
frame.style.boxShadow = '0 0 20px #0f0';
} else {
body.style.background = 'linear-gradient(45deg, #a8d5ba, #6b9080)';
frame.style.borderColor = '#4caf50';
frame.style.boxShadow = '0 0 20px #4caf50';
}
}

setInterval(updateClock, 1000);
updateClock();
