const DEFAULT_THEME = {
    name: 'Explorer Dino',
    summary: 'Waiting for live weather',
    accent: '#f59e0b',
    skyTop: '#dbeafe',
    skyBottom: '#f8fbff',
    sun: '#ffd166',
    haze: 'rgba(255, 255, 255, 0.7)',
    ground: '#8a9a5b',
    groundLine: '#5f6f43',
    dinoBody: '#2f855a',
    dinoBelly: '#f5f1e8',
    dinoAccessory: '#f59e0b',
    obstacle: '#5f6f43',
    obstacleSecondary: '#8ba75f',
    effect: 'breeze',
    obstacleType: 'cactus',
    accessory: 'sunglasses'
};

function getTemperatureDinoPalette(temperatureCelsius) {
    if (!Number.isFinite(temperatureCelsius)) {
        return null;
    }

    if (temperatureCelsius <= 10) {
        return {
            dinoBody: '#3b82f6',
            dinoBelly: '#dbeafe',
            dinoAccessory: '#1d4ed8'
        };
    }

    if (temperatureCelsius <= 20) {
        return {
            dinoBody: '#22c55e',
            dinoBelly: '#dcfce7',
            dinoAccessory: '#15803d'
        };
    }

    if (temperatureCelsius <= 30) {
        return {
            dinoBody: '#facc15',
            dinoBelly: '#fef9c3',
            dinoAccessory: '#ca8a04'
        };
    }

    return {
        dinoBody: '#ef4444',
        dinoBelly: '#fee2e2',
        dinoAccessory: '#b91c1c'
    };
}

function withTemperatureDinoPalette(theme, temperatureCelsius) {
    const palette = getTemperatureDinoPalette(temperatureCelsius);

    return palette ? { ...theme, ...palette } : theme;
}

function getWeatherTheme(code, isDay, temperatureCelsius) {
    if ([95, 96, 99].includes(code)) {
        return withTemperatureDinoPalette({
            name: 'Storm Chaser',
            summary: 'Storm mode is on',
            accent: '#facc15',
            skyTop: '#3f4d67',
            skyBottom: '#7b879f',
            sun: '#f8fafc',
            haze: 'rgba(255, 255, 255, 0.12)',
            ground: '#334155',
            groundLine: '#0f172a',
            dinoBody: '#a7f3d0',
            dinoBelly: '#ecfeff',
            dinoAccessory: '#facc15',
            obstacle: '#0f172a',
            obstacleSecondary: '#eab308',
            effect: 'storm',
            obstacleType: 'lightning',
            accessory: 'spark'
        }, temperatureCelsius);
    }

    if ([71, 73, 75, 77, 85, 86].includes(code)) {
        return withTemperatureDinoPalette({
            name: 'Snow Scout',
            summary: 'Snow gear equipped',
            accent: '#60a5fa',
            skyTop: '#dff4ff',
            skyBottom: '#f8fdff',
            sun: '#ffffff',
            haze: 'rgba(255, 255, 255, 0.88)',
            ground: '#b6d3ea',
            groundLine: '#6b90a8',
            dinoBody: '#4c956c',
            dinoBelly: '#f8fafc',
            dinoAccessory: '#ffffff',
            obstacle: '#7aa4c0',
            obstacleSecondary: '#ffffff',
            effect: 'snow',
            obstacleType: 'ice',
            accessory: 'scarf'
        }, temperatureCelsius);
    }

    if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
        return withTemperatureDinoPalette({
            name: 'Raincoat Runner',
            summary: 'Splash-ready dinosaur',
            accent: '#facc15',
            skyTop: '#91a7c3',
            skyBottom: '#dbe7f6',
            sun: '#f8fafc',
            haze: 'rgba(255, 255, 255, 0.3)',
            ground: '#506680',
            groundLine: '#334155',
            dinoBody: '#2c7da0',
            dinoBelly: '#f8fafc',
            dinoAccessory: '#facc15',
            obstacle: '#334155',
            obstacleSecondary: '#7dd3fc',
            effect: 'rain',
            obstacleType: 'puddle',
            accessory: 'raincoat'
        }, temperatureCelsius);
    }

    if ([45, 48].includes(code) || code === 3) {
        return withTemperatureDinoPalette({
            name: 'Fog Hopper',
            summary: 'Low-visibility mode',
            accent: '#94a3b8',
            skyTop: '#d9dee8',
            skyBottom: '#f6f7fb',
            sun: '#ffffff',
            haze: 'rgba(255, 255, 255, 0.82)',
            ground: '#9aa5b1',
            groundLine: '#64748b',
            dinoBody: '#4b5563',
            dinoBelly: '#e5e7eb',
            dinoAccessory: '#cbd5e1',
            obstacle: '#6b7280',
            obstacleSecondary: '#cbd5e1',
            effect: 'fog',
            obstacleType: 'rock',
            accessory: 'mask'
        }, temperatureCelsius);
    }

    if (code === 0) {
        if (isDay) {
            return withTemperatureDinoPalette({
                name: 'Sunny Sprinter',
                summary: 'Sunglasses activated',
                accent: '#f97316',
                skyTop: '#8ed1fc',
                skyBottom: '#fef7c3',
                sun: '#ffd166',
                haze: 'rgba(255, 255, 255, 0.58)',
                ground: '#9dc46b',
                groundLine: '#5f6f43',
                dinoBody: '#2f9e44',
                dinoBelly: '#fef3c7',
                dinoAccessory: '#1f2937',
                obstacle: '#5f6f43',
                obstacleSecondary: '#84cc16',
                effect: 'sun',
                obstacleType: 'cactus',
                accessory: 'sunglasses'
            }, temperatureCelsius);
        }

        return withTemperatureDinoPalette({
            name: 'Moonlit Jumper',
            summary: 'Night run engaged',
            accent: '#c4b5fd',
            skyTop: '#0f172a',
            skyBottom: '#1e293b',
            sun: '#f8fafc',
            haze: 'rgba(255, 255, 255, 0.08)',
            ground: '#334155',
            groundLine: '#94a3b8',
            dinoBody: '#8b5cf6',
            dinoBelly: '#ede9fe',
            dinoAccessory: '#f8fafc',
            obstacle: '#94a3b8',
            obstacleSecondary: '#c4b5fd',
            effect: 'stars',
            obstacleType: 'crystal',
            accessory: 'nightcap'
        }, temperatureCelsius);
    }

    if ([1, 2].includes(code)) {
        return withTemperatureDinoPalette({
            ...DEFAULT_THEME,
            name: 'Cloud Cruiser',
            summary: 'Windy and light on feet',
            skyTop: '#b9d8ff',
            skyBottom: '#f8fbff',
            effect: 'clouds',
            obstacleType: 'cactus',
            accessory: 'visor'
        }, temperatureCelsius);
    }

    return withTemperatureDinoPalette(DEFAULT_THEME, temperatureCelsius);
}

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

function randomBetween(min, max) {
    return min + Math.random() * (max - min);
}

function shouldIgnoreKeyboardEvent() {
    const activeElement = document.activeElement;
    if (!activeElement) {
        return false;
    }

    return ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(activeElement.tagName);
}

function drawRoundedRect(context, x, y, width, height, radius, fillStyle) {
    const r = Math.min(radius, width / 2, height / 2);

    context.beginPath();
    context.moveTo(x + r, y);
    context.arcTo(x + width, y, x + width, y + height, r);
    context.arcTo(x + width, y + height, x, y + height, r);
    context.arcTo(x, y + height, x, y, r);
    context.arcTo(x, y, x + width, y, r);
    context.closePath();
    context.fillStyle = fillStyle;
    context.fill();
}

export function createWeatherRunner({
    canvas,
    statusElement,
    hintElement,
    toggleButton
}) {
    if (!canvas || !statusElement || !hintElement || !toggleButton) {
        return {
            setWeather() {},
            setLoading() {},
            setError() {}
        };
    }

    const context = canvas.getContext('2d');
    if (!context) {
        return {
            setWeather() {},
            setLoading() {},
            setError() {}
        };
    }

    const game = {
        width: canvas.width,
        height: canvas.height,
        pixelRatio: 1,
        groundY: canvas.height - 28,
        lastFrameTime: 0,
        running: true,
        crashed: false,
        score: 0,
        bestScore: 0,
        distance: 0,
        spawnTimer: 0.85,
        flashTimer: 0,
        theme: DEFAULT_THEME,
        weatherText: {
            summary: 'Loading current weather...',
            meta: 'Using your current location',
            isLoading: true,
            isError: false
        },
        dino: {
            x: 42,
            y: 0,
            vy: 0,
            width: 28,
            height: 34
        },
        obstacles: []
    };

    function getActiveHint() {
        return `${game.theme.summary}. Tap the stage or press space to jump.`;
    }

    function setHint(text) {
        hintElement.textContent = text;
    }

    function fitText(text, maxWidth) {
        if (context.measureText(text).width <= maxWidth) {
            return text;
        }

        let trimmed = text;
        while (trimmed.length > 0 && context.measureText(`${trimmed}...`).width > maxWidth) {
            trimmed = trimmed.slice(0, -1);
        }

        return trimmed ? `${trimmed}...` : text;
    }

    function updateToggleButton() {
        toggleButton.textContent = game.crashed ? 'Retry' : (game.running ? 'Pause' : 'Resume');
        toggleButton.setAttribute(
            'aria-label',
            game.crashed ? 'Retry weather game' : (game.running ? 'Pause weather game' : 'Resume weather game')
        );
    }

    function updateStatus() {
        const score = Math.floor(game.score);
        const bestScore = Math.floor(game.bestScore);
        const stateLabel = game.crashed ? 'Crash' : (game.running ? 'Running' : 'Paused');
        statusElement.textContent = `${game.theme.name} · ${stateLabel} · ${score} pts · Best ${bestScore}`;
    }

    function getScorePanelWidth() {
        return Math.max(86, Math.min(112, game.width * 0.28));
    }

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(240, Math.floor(rect.width));
        const height = Math.max(132, Math.floor(rect.height));
        const pixelRatio = window.devicePixelRatio || 1;

        canvas.width = Math.floor(width * pixelRatio);
        canvas.height = Math.floor(height * pixelRatio);
        game.width = width;
        game.height = height;
        game.pixelRatio = pixelRatio;
        game.groundY = height - Math.max(22, Math.round(height * 0.18));
        game.dino.x = Math.max(34, Math.round(width * 0.14));
        game.dino.width = clamp(Math.round(width * 0.09), 24, 34);
        game.dino.height = clamp(Math.round(height * 0.24), 30, 40);

        context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    }

    function resetRound() {
        game.score = 0;
        game.distance = 0;
        game.spawnTimer = 0.85;
        game.flashTimer = 0;
        game.crashed = false;
        game.running = true;
        game.lastFrameTime = 0;
        game.dino.y = 0;
        game.dino.vy = 0;
        game.obstacles = [];
        updateToggleButton();
        updateStatus();
        setHint(getActiveHint());
    }

    function jump() {
        if (game.dino.y === 0) {
            game.dino.vy = -clamp(game.height * 2.2, 255, 340);
        }
    }

    function handleCanvasAction() {
        if (game.crashed) {
            resetRound();
            return;
        }

        if (!game.running) {
            game.running = true;
            game.lastFrameTime = 0;
            updateToggleButton();
            updateStatus();
        }

        jump();
    }

    function spawnObstacle() {
        const baseHeight = clamp(Math.round(game.height * 0.16), 16, 26);
        const type = game.theme.obstacleType;
        let width = baseHeight;
        let height = baseHeight;
        let yOffset = 0;

        if (type === 'puddle') {
            width = Math.round(baseHeight * 1.7);
            height = Math.round(baseHeight * 0.56);
            yOffset = -2;
        } else if (type === 'ice') {
            width = Math.round(baseHeight * 1.2);
            height = Math.round(baseHeight * 0.95);
        } else if (type === 'lightning') {
            width = Math.round(baseHeight * 0.95);
            height = Math.round(baseHeight * 1.3);
        } else if (type === 'crystal') {
            width = Math.round(baseHeight);
            height = Math.round(baseHeight * 1.05);
        } else if (type === 'rock') {
            width = Math.round(baseHeight * 1.15);
            height = Math.round(baseHeight * 0.8);
        } else {
            width = Math.round(baseHeight * 0.92);
            height = Math.round(baseHeight * 1.25);
        }

        game.obstacles.push({
            type,
            x: game.width + width + 12,
            width,
            height,
            y: game.groundY - height + yOffset
        });
    }

    function getDinoHitbox() {
        return {
            x: game.dino.x + game.dino.width * 0.16,
            y: game.groundY - game.dino.height - game.dino.y + game.dino.height * 0.12,
            width: game.dino.width * 0.68,
            height: game.dino.height * 0.82
        };
    }

    function hasCollision(obstacle) {
        const dinoBox = getDinoHitbox();
        const obstacleBox = {
            x: obstacle.x + obstacle.width * 0.1,
            y: obstacle.y + obstacle.height * 0.1,
            width: obstacle.width * 0.8,
            height: obstacle.height * 0.8
        };

        return !(
            dinoBox.x + dinoBox.width < obstacleBox.x
            || dinoBox.x > obstacleBox.x + obstacleBox.width
            || dinoBox.y + dinoBox.height < obstacleBox.y
            || dinoBox.y > obstacleBox.y + obstacleBox.height
        );
    }

    function update(deltaTime) {
        game.flashTimer = Math.max(0, game.flashTimer - deltaTime);

        if (!game.running || game.crashed) {
            return;
        }

        const gravity = clamp(game.height * 7.2, 720, 980);
        const speed = clamp(165 + game.score * 2.6, 165, 320);

        game.dino.vy += gravity * deltaTime;
        game.dino.y = Math.max(0, game.dino.y - game.dino.vy * deltaTime);
        if (game.dino.y === 0) {
            game.dino.vy = 0;
        }

        game.spawnTimer -= deltaTime;
        if (game.spawnTimer <= 0) {
            spawnObstacle();
            game.spawnTimer = randomBetween(0.78, 1.4) - Math.min(0.28, game.score * 0.008);
        }

        game.obstacles = game.obstacles.filter((obstacle) => obstacle.x + obstacle.width > -24);
        for (const obstacle of game.obstacles) {
            obstacle.x -= speed * deltaTime;

            if (hasCollision(obstacle)) {
                game.crashed = true;
                game.running = false;
                game.bestScore = Math.max(game.bestScore, game.score);
                game.flashTimer = 0.16;
                updateToggleButton();
                updateStatus();
                setHint('Crashed. Tap the stage or press Retry to start again.');
                break;
            }
        }

        if (!game.crashed) {
            game.distance += speed * deltaTime;
            game.score += deltaTime * 10;
            game.bestScore = Math.max(game.bestScore, game.score);
        }

        updateStatus();
    }

    function drawBackground(time) {
        const gradient = context.createLinearGradient(0, 0, 0, game.height);
        gradient.addColorStop(0, game.theme.skyTop);
        gradient.addColorStop(1, game.theme.skyBottom);
        context.fillStyle = gradient;
        context.fillRect(0, 0, game.width, game.height);

        context.globalAlpha = 0.95;
        context.fillStyle = game.theme.sun;
        const orbX = game.width - 42;
        const orbY = 30;
        const orbRadius = game.theme.effect === 'storm' ? 16 : 18;
        context.beginPath();
        context.arc(orbX, orbY, orbRadius, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = 1;

        context.fillStyle = game.theme.haze;
        for (let index = 0; index < 3; index += 1) {
            const cloudX = ((time * (14 + index * 4)) + index * 98) % (game.width + 82) - 60;
            const cloudY = 18 + index * 18;
            drawRoundedRect(context, cloudX, cloudY, 44, 16, 9, game.theme.haze);
            drawRoundedRect(context, cloudX + 18, cloudY - 7, 32, 18, 9, game.theme.haze);
        }
    }

    function drawEffects(time) {
        if (game.theme.effect === 'rain') {
            context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            context.lineWidth = 2;
            for (let index = 0; index < 16; index += 1) {
                const x = ((time * 170) + index * 27) % (game.width + 24) - 12;
                const y = (index * 22 + time * 120) % (game.height - 36);
                context.beginPath();
                context.moveTo(x, y);
                context.lineTo(x - 5, y + 12);
                context.stroke();
            }
        }

        if (game.theme.effect === 'snow') {
            context.fillStyle = 'rgba(255, 255, 255, 0.95)';
            for (let index = 0; index < 18; index += 1) {
                const x = ((time * (12 + (index % 3) * 3)) + index * 23) % (game.width + 10);
                const y = (index * 19 + time * 38) % (game.height - 18);
                context.beginPath();
                context.arc(x, y + 8, index % 2 === 0 ? 1.8 : 2.4, 0, Math.PI * 2);
                context.fill();
            }
        }

        if (game.theme.effect === 'storm') {
            context.fillStyle = 'rgba(255, 255, 255, 0.1)';
            context.fillRect(0, 0, game.width, game.height);
            if (Math.floor(time * 2.2) % 5 === 0) {
                context.strokeStyle = 'rgba(250, 204, 21, 0.92)';
                context.lineWidth = 3;
                context.beginPath();
                context.moveTo(game.width - 54, 18);
                context.lineTo(game.width - 68, 44);
                context.lineTo(game.width - 56, 44);
                context.lineTo(game.width - 74, 70);
                context.stroke();
            }
        }

        if (game.theme.effect === 'fog') {
            context.fillStyle = 'rgba(255, 255, 255, 0.3)';
            for (let index = 0; index < 4; index += 1) {
                const y = 28 + index * 20;
                const x = ((time * (10 + index)) + index * 54) % (game.width + 110) - 90;
                drawRoundedRect(context, x, y, 92, 14, 7, 'rgba(255, 255, 255, 0.28)');
            }
        }

        if (game.theme.effect === 'stars') {
            context.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let index = 0; index < 14; index += 1) {
                const x = (index * 24 + 16) % game.width;
                const y = 14 + (index % 4) * 12;
                context.fillRect(x, y, 2, 2);
            }
        }
    }

    function drawGround(time) {
        context.fillStyle = game.theme.ground;
        context.fillRect(0, game.groundY, game.width, game.height - game.groundY);
        context.strokeStyle = game.theme.groundLine;
        context.lineWidth = 3;
        context.beginPath();
        context.moveTo(0, game.groundY);
        context.lineTo(game.width, game.groundY);
        context.stroke();

        context.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        context.lineWidth = 2;
        context.beginPath();
        for (let x = -20; x < game.width + 24; x += 24) {
            const offset = (time * 120) % 24;
            context.moveTo(x - offset, game.groundY + 8);
            context.lineTo(x + 8 - offset, game.groundY + 12);
        }
        context.stroke();
    }

    function drawDino(time) {
        const x = game.dino.x;
        const y = game.groundY - game.dino.height - game.dino.y;
        const runCycle = game.running && game.dino.y === 0 ? Math.sin(time * 18) : 0;
        const unit = Math.max(2, Math.round(Math.min(game.dino.width, game.dino.height) / 9));
        const headX = x + unit * 2;
        const headY = y + unit;
        const torsoX = x + unit * 2;
        const torsoY = y + unit * 4;
        const armSwing = runCycle > 0 ? unit : 0;
        const leftLegOffset = runCycle > 0 ? unit : 0;
        const rightLegOffset = runCycle < 0 ? unit : 0;

        context.fillStyle = game.theme.dinoBelly;
        context.fillRect(headX, headY, unit * 3, unit * 3);

        context.fillStyle = game.theme.dinoBody;
        context.fillRect(torsoX, torsoY, unit * 3, unit * 4);
        context.fillRect(x + unit, y + unit * 4, unit, unit * 3 + armSwing);
        context.fillRect(x + unit * 5, y + unit * 4 + armSwing, unit, unit * 3);
        context.fillRect(x + unit * 2, y + unit * 8, unit, unit * 3 + leftLegOffset);
        context.fillRect(x + unit * 4, y + unit * 8, unit, unit * 3 + rightLegOffset);
        context.fillRect(x + unit, y + unit * 11 + leftLegOffset, unit * 2, unit);
        context.fillRect(x + unit * 4, y + unit * 11 + rightLegOffset, unit * 2, unit);

        context.fillStyle = '#111827';
        context.fillRect(x + unit * 3, y + unit * 2, unit, unit);
        context.fillRect(x + unit * 4, y + unit * 2, unit, unit);
        context.fillRect(x + unit * 3, y + unit * 3, unit * 2, Math.max(1, Math.floor(unit / 2)));

        if (game.theme.accessory === 'sunglasses' || game.theme.accessory === 'visor') {
            context.fillStyle = game.theme.dinoAccessory;
            context.fillRect(x + unit * 2, y + unit * 2, unit * 3, unit);
        }

        if (game.theme.accessory === 'raincoat') {
            context.fillStyle = game.theme.dinoAccessory;
            context.fillRect(torsoX, torsoY + unit, unit * 3, unit * 3);
        }

        if (game.theme.accessory === 'scarf') {
            context.fillStyle = '#ffffff';
            context.fillRect(x + unit * 2, y + unit * 4, unit * 3, unit);
            context.fillRect(x + unit * 4, y + unit * 5, unit, unit * 2);
        }

        if (game.theme.accessory === 'spark') {
            context.fillStyle = game.theme.dinoAccessory;
            context.beginPath();
            context.moveTo(x + unit * 3, y + unit);
            context.lineTo(x + unit * 4, y - unit);
            context.lineTo(x + unit * 5, y + unit);
            context.closePath();
            context.fill();
        }

        if (game.theme.accessory === 'mask') {
            context.fillStyle = game.theme.dinoAccessory;
            context.fillRect(x + unit * 3, y + unit * 3, unit * 2, unit);
        }

        if (game.theme.accessory === 'nightcap') {
            context.fillStyle = game.theme.dinoAccessory;
            context.beginPath();
            context.moveTo(x + unit * 2, y + unit * 2);
            context.lineTo(x + unit * 4, y - unit);
            context.lineTo(x + unit * 5, y + unit * 2);
            context.closePath();
            context.fill();
            context.fillStyle = '#ffffff';
            context.beginPath();
            context.arc(x + unit * 4, y, Math.max(1.6, unit * 0.5), 0, Math.PI * 2);
            context.fill();
        }
    }

    function drawObstacle(obstacle) {
        if (obstacle.type === 'puddle') {
            context.fillStyle = game.theme.obstacleSecondary;
            drawRoundedRect(context, obstacle.x, obstacle.y + 7, obstacle.width, obstacle.height, 8, game.theme.obstacleSecondary);
            context.fillStyle = game.theme.obstacle;
            context.fillRect(obstacle.x + obstacle.width * 0.3, obstacle.y - 6, 3, 12);
        } else if (obstacle.type === 'ice') {
            context.fillStyle = game.theme.obstacleSecondary;
            drawRoundedRect(context, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 7, game.theme.obstacleSecondary);
            context.strokeStyle = game.theme.obstacle;
            context.lineWidth = 2;
            context.strokeRect(obstacle.x + 2, obstacle.y + 2, obstacle.width - 4, obstacle.height - 4);
        } else if (obstacle.type === 'lightning') {
            context.fillStyle = game.theme.obstacleSecondary;
            context.beginPath();
            context.moveTo(obstacle.x + obstacle.width * 0.55, obstacle.y);
            context.lineTo(obstacle.x + obstacle.width * 0.2, obstacle.y + obstacle.height * 0.5);
            context.lineTo(obstacle.x + obstacle.width * 0.48, obstacle.y + obstacle.height * 0.5);
            context.lineTo(obstacle.x, obstacle.y + obstacle.height);
            context.lineTo(obstacle.x + obstacle.width * 0.82, obstacle.y + obstacle.height * 0.38);
            context.lineTo(obstacle.x + obstacle.width * 0.54, obstacle.y + obstacle.height * 0.38);
            context.closePath();
            context.fill();
        } else if (obstacle.type === 'crystal') {
            context.fillStyle = game.theme.obstacleSecondary;
            context.beginPath();
            context.moveTo(obstacle.x + obstacle.width / 2, obstacle.y);
            context.lineTo(obstacle.x + obstacle.width, obstacle.y + obstacle.height * 0.45);
            context.lineTo(obstacle.x + obstacle.width * 0.7, obstacle.y + obstacle.height);
            context.lineTo(obstacle.x + obstacle.width * 0.15, obstacle.y + obstacle.height);
            context.lineTo(obstacle.x, obstacle.y + obstacle.height * 0.45);
            context.closePath();
            context.fill();
        } else if (obstacle.type === 'rock') {
            context.fillStyle = game.theme.obstacle;
            drawRoundedRect(context, obstacle.x, obstacle.y, obstacle.width, obstacle.height, 7, game.theme.obstacle);
            context.fillStyle = game.theme.obstacleSecondary;
            context.fillRect(obstacle.x + obstacle.width * 0.2, obstacle.y + 4, obstacle.width * 0.18, 2);
        } else {
            context.fillStyle = game.theme.obstacle;
            context.fillRect(obstacle.x + obstacle.width * 0.35, obstacle.y, obstacle.width * 0.3, obstacle.height);
            context.fillRect(obstacle.x, obstacle.y + obstacle.height * 0.35, obstacle.width, obstacle.height * 0.24);
            context.fillRect(obstacle.x + obstacle.width * 0.58, obstacle.y + obstacle.height * 0.12, obstacle.width * 0.24, obstacle.height * 0.18);
        }
    }

    function drawHud() {
        const panelWidth = getScorePanelWidth();
        const panelX = game.width - panelWidth - 12;
        const panelY = Math.max(12, game.groundY - 44);

        drawRoundedRect(context, panelX, panelY, panelWidth, 32, 14, 'rgba(15, 23, 42, 0.42)');
        context.fillStyle = '#ffffff';
        context.textAlign = 'right';
        context.font = '600 11px "SF Pro Text", "Segoe UI", sans-serif';
        context.fillText(`Score ${Math.floor(game.score)}`, panelX + panelWidth - 10, panelY + 13);
        context.fillText(`Best ${Math.floor(game.bestScore)}`, panelX + panelWidth - 10, panelY + 27);
        context.textAlign = 'start';

        if (!game.running || game.crashed) {
            drawRoundedRect(context, game.width / 2 - 70, 18, 140, 32, 16, 'rgba(15, 23, 42, 0.42)');
            context.fillStyle = '#ffffff';
            context.textAlign = 'center';
            context.fillText(game.crashed ? 'Tap to retry' : 'Paused', game.width / 2, 39);
            context.textAlign = 'start';
        }
    }

    function drawWeatherText() {
        const panelWidth = Math.max(108, game.width - getScorePanelWidth() - 36);
        const metaColor = game.weatherText.isError
            ? '#fecaca'
            : (game.weatherText.isLoading ? 'rgba(255, 255, 255, 0.82)' : 'rgba(255, 255, 255, 0.7)');

        drawRoundedRect(context, 12, 12, panelWidth, 38, 14, 'rgba(15, 23, 42, 0.38)');
        context.fillStyle = '#ffffff';
        context.font = '600 11px "SF Pro Text", "Segoe UI", sans-serif';
        context.fillText(fitText(game.weatherText.summary, panelWidth - 18), 21, 25);

        context.fillStyle = metaColor;
        context.font = '500 10px "SF Pro Text", "Segoe UI", sans-serif';
        context.fillText(fitText(game.weatherText.meta, panelWidth - 18), 21, 39);
    }

    function render(time) {
        context.clearRect(0, 0, game.width, game.height);
        drawBackground(time);
        drawEffects(time);
        drawGround(time);
        drawDino(time);
        for (const obstacle of game.obstacles) {
            drawObstacle(obstacle);
        }
        drawWeatherText();
        drawHud();

        if (game.flashTimer > 0) {
            context.fillStyle = `rgba(255, 255, 255, ${game.flashTimer * 2.8})`;
            context.fillRect(0, 0, game.width, game.height);
        }
    }

    function frame(timestamp) {
        if (game.lastFrameTime === 0) {
            game.lastFrameTime = timestamp;
        }

        const deltaTime = Math.min((timestamp - game.lastFrameTime) / 1000, 0.035);
        game.lastFrameTime = timestamp;
        update(deltaTime);
        render(timestamp / 1000);
        window.requestAnimationFrame(frame);
    }

    function setWeather(code, isDay, temperatureCelsius) {
        game.theme = getWeatherTheme(code, isDay, temperatureCelsius);
        setHint(getActiveHint());
        updateStatus();
        render(performance.now() / 1000);
    }

    function setWeatherText(summary, meta, { isLoading = false, isError = false } = {}) {
        game.weatherText.summary = summary;
        game.weatherText.meta = meta;
        game.weatherText.isLoading = isLoading;
        game.weatherText.isError = isError;
        render(performance.now() / 1000);
    }

    function setLoading() {
        setWeatherText('Loading current weather...', 'Using your current location', { isLoading: true });
        setHint('Fetching live weather and tuning the dinosaur outfit...');
    }

    function setError() {
        setWeatherText(
            game.weatherText.summary,
            'Weather service is temporarily unavailable',
            { isError: true }
        );
        setHint('Weather could not update, so the dinosaur stays in explorer mode.');
    }

    toggleButton.addEventListener('click', () => {
        if (game.crashed) {
            resetRound();
            return;
        }

        game.running = !game.running;
        game.lastFrameTime = 0;
        updateToggleButton();
        updateStatus();
    });

    canvas.addEventListener('pointerdown', handleCanvasAction);
    canvas.addEventListener('touchstart', (event) => {
        event.preventDefault();
    }, { passive: false });

    window.addEventListener('keydown', (event) => {
        if (shouldIgnoreKeyboardEvent()) {
            return;
        }

        if (event.code === 'Space' || event.code === 'ArrowUp') {
            event.preventDefault();
            handleCanvasAction();
        }
    });

    const rerender = () => {
        resizeCanvas()
        render(performance.now() / 1000)
    };

    if (typeof ResizeObserver === 'function') {
        const resizeObserver = new ResizeObserver(rerender);
        resizeObserver.observe(canvas);
    } else {
        window.addEventListener('resize', rerender);
    }

    resizeCanvas();
    updateToggleButton();
    updateStatus();
    setHint(getActiveHint());
    window.requestAnimationFrame(frame);

    return {
        setWeather,
        setWeatherText,
        setLoading,
        setError
    };
}
