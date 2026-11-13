const toast = document.querySelector('.surprise-toast');
let toastTimeout;

const galaxy = document.querySelector('#galaxy');
const galaxyContext = galaxy?.getContext('2d');

if (galaxy && galaxyContext) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = { width: 0, height: 0, pixelRatio: 1, yaw: -0.5, pitch: 0.35, dragging: false, lastX: 0, lastY: 0, lastAnimationFrame: 0 };
  const randomBetween = (min, max) => min + Math.random() * (max - min);
  const stars = Array.from({ length: 720 }, () => {
    const radius = Math.sqrt(Math.random());
    const arm = Math.floor(Math.random() * 4);
    const angle = arm * Math.PI / 2 + radius * 9 + randomBetween(-0.38, 0.38) * (0.3 + radius);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: randomBetween(-0.16, 0.16) * (1 - radius * 0.55),
      size: randomBetween(0.45, 1.8),
      alpha: randomBetween(0.24, 0.88),
      hue: radius < 0.13 ? 42 : [202, 232, 280, 326][arm] + randomBetween(-12, 12)
    };
  });
  const distantStars = Array.from({ length: 130 }, () => ({
    x: Math.random(),
    y: Math.random(),
    size: randomBetween(0.35, 1.1),
    alpha: randomBetween(0.2, 0.55),
    hue: [214, 248, 292, 328][Math.floor(Math.random() * 4)]
  }));

  const resizeGalaxy = () => {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    galaxy.width = Math.round(state.width * state.pixelRatio);
    galaxy.height = Math.round(state.height * state.pixelRatio);
    galaxyContext.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
    drawGalaxy();
  };

  const drawGalaxy = (time = 0) => {
    const { width, height } = state;
    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const radius = Math.min(width, height) * 0.43;
    const cosYaw = Math.cos(state.yaw);
    const sinYaw = Math.sin(state.yaw);
    const cosPitch = Math.cos(state.pitch);
    const sinPitch = Math.sin(state.pitch);
    const context = galaxyContext;

    context.clearRect(0, 0, width, height);
    distantStars.forEach((star, index) => {
      const shimmer = 0.78 + Math.sin(time * 0.001 + index) * 0.22;
      context.fillStyle = `hsla(${star.hue}, 72%, 48%, ${star.alpha * shimmer})`;
      context.beginPath();
      context.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
      context.fill();
    });

    const glow = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    glow.addColorStop(0, 'rgba(255, 174, 221, 0.32)');
    glow.addColorStop(0.18, 'rgba(145, 161, 255, 0.24)');
    glow.addColorStop(0.58, 'rgba(93, 196, 228, 0.1)');
    glow.addColorStop(1, 'rgba(183, 166, 218, 0)');
    context.fillStyle = glow;
    context.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);

    [202, 246, 318, 42].forEach((hue, arm) => {
      const angle = state.yaw * 0.12 + arm * Math.PI / 2;
      const x = centerX + Math.cos(angle) * radius * 0.36;
      const y = centerY + Math.sin(angle) * radius * 0.16;
      const nebula = context.createRadialGradient(x, y, 0, x, y, radius * 0.36);
      nebula.addColorStop(0, `hsla(${hue}, 88%, 62%, 0.2)`);
      nebula.addColorStop(0.4, `hsla(${hue}, 82%, 64%, 0.1)`);
      nebula.addColorStop(1, `hsla(${hue}, 82%, 64%, 0)`);
      context.fillStyle = nebula;
      context.fillRect(x - radius * 0.36, y - radius * 0.36, radius * 0.72, radius * 0.72);
    });

    stars.forEach((star, index) => {
      const rotatedX = star.x * cosYaw - star.z * sinYaw;
      const rotatedZ = star.x * sinYaw + star.z * cosYaw;
      const rotatedY = star.y * cosPitch - rotatedZ * sinPitch;
      const depth = star.y * sinPitch + rotatedZ * cosPitch;
      const perspective = 1 / (1 + depth * 0.34);
      const x = centerX + rotatedX * radius * perspective;
      const y = centerY + rotatedY * radius * 0.48 * perspective;
      const shimmer = 0.78 + Math.sin(time * 0.0012 + index * 0.7) * 0.22;
      const alpha = star.alpha * shimmer * (0.7 + perspective * 0.3);

      context.fillStyle = `hsla(${star.hue}, 82%, 50%, ${alpha})`;
      context.beginPath();
      context.arc(x, y, star.size * perspective, 0, Math.PI * 2);
      context.fill();
    });

    const core = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 0.16);
    core.addColorStop(0, 'rgba(255, 242, 249, 0.5)');
    core.addColorStop(0.35, 'rgba(238, 188, 219, 0.19)');
    core.addColorStop(1, 'rgba(238, 188, 219, 0)');
    context.fillStyle = core;
    context.beginPath();
    context.ellipse(centerX, centerY, radius * 0.2, radius * 0.1, state.yaw * 0.15, 0, Math.PI * 2);
    context.fill();
  };

  const animateGalaxy = (time) => {
    if (time - state.lastAnimationFrame >= 1000 / 30) {
      state.lastAnimationFrame = time;
      if (!state.dragging && !reducedMotion.matches) state.yaw += 0.0007;
      drawGalaxy(time);
    }
    if (!reducedMotion.matches) window.requestAnimationFrame(animateGalaxy);
  };

  const stopDragging = () => {
    if (!state.dragging) return;
    state.dragging = false;
    document.documentElement.classList.remove('galaxy-dragging');
    if (reducedMotion.matches) drawGalaxy();
  };

  window.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 || event.target.closest('a, button, input, textarea, select, [data-close-animal]')) return;
    state.dragging = true;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    document.documentElement.classList.add('galaxy-dragging');
  });

  window.addEventListener('pointermove', (event) => {
    if (!state.dragging) return;
    const deltaX = event.clientX - state.lastX;
    const deltaY = event.clientY - state.lastY;
    state.yaw += deltaX * 0.008;
    state.pitch = Math.max(-1.1, Math.min(1.1, state.pitch + deltaY * 0.006));
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    if (reducedMotion.matches) drawGalaxy();
  });

  window.addEventListener('pointerup', stopDragging);
  window.addEventListener('pointercancel', stopDragging);
  window.addEventListener('blur', stopDragging);
  window.addEventListener('resize', resizeGalaxy);
  resizeGalaxy();
  if (!reducedMotion.matches) window.requestAnimationFrame(animateGalaxy);
}

const animalStage = document.querySelector('#animal-stage');
const animalStageCard = animalStage.querySelector('.animal-stage-card');
const animalStageClose = animalStage.querySelector('.animal-stage-close');
const animalStageEmoji = document.querySelector('#animal-stage-emoji');
const animalStageTitle = document.querySelector('#animal-stage-title');
const animalStageDescription = document.querySelector('#animal-stage-description');
const animalCountdown = document.querySelector('#animal-countdown');
const animalProgress = document.querySelector('#animal-countdown-progress');
const animalDetails = {
  rabbit: { emoji: '🐰', name: '¡Hola, conejito!', description: 'Unos saltitos suaves para alegrarte el día.', color: '#e7a5c4' },
  hamster: { emoji: '🐹', name: '¡Hola, hámster!', description: 'Una bolita curiosa llegó para sacarte una sonrisa.', color: '#e8b47d' },
  penguin: { emoji: '🐧', name: '¡Hola, pingüino!', description: 'Un pequeño amigo del hielo vino a saludarte.', color: '#8eb8df' },
  sheep: { emoji: '🐑', name: '¡Hola, ovejita!', description: 'Una nubecita lanuda vino a compartir un momento tranquilo.', color: '#b2cba8' }
};
let animalTimer;
let animalCloseDelay;
let activeAnimalTrigger;

const closeAnimalStage = (restoreFocus = true) => {
  if (animalStage.hidden) return;
  window.clearInterval(animalTimer);
  animalStage.classList.remove('is-visible');
  document.body.classList.remove('animal-stage-open');
  window.clearTimeout(animalCloseDelay);
  animalCloseDelay = window.setTimeout(() => {
    animalStage.hidden = true;
    if (restoreFocus && activeAnimalTrigger) activeAnimalTrigger.focus();
    activeAnimalTrigger = null;
  }, 250);
};

document.querySelectorAll('[data-animal]').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const animal = animalDetails[trigger.dataset.animal];
    if (!animal) return;

    window.clearInterval(animalTimer);
    window.clearTimeout(animalCloseDelay);
    activeAnimalTrigger = trigger;
    animalStageEmoji.textContent = animal.emoji;
    animalStageTitle.textContent = animal.name;
    animalStageDescription.textContent = animal.description;
    animalStageCard.style.setProperty('--animal-color', animal.color);
    animalCountdown.textContent = '10';
    animalProgress.style.width = '100%';
    animalStage.hidden = false;
    document.body.classList.add('animal-stage-open');
    window.requestAnimationFrame(() => animalStage.classList.add('is-visible'));
    animalStageClose.focus();

    const startedAt = Date.now();
    animalTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, Math.ceil((10000 - elapsed) / 1000));
      animalCountdown.textContent = String(remaining);
      animalProgress.style.width = `${Math.max(0, 100 - elapsed / 100)}%`;
      if (elapsed >= 10000) closeAnimalStage();
    }, 100);
  });
});

animalStageClose.addEventListener('click', () => closeAnimalStage());
animalStage.querySelector('[data-close-animal]').addEventListener('click', () => closeAnimalStage());
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !animalStage.hidden) closeAnimalStage();
});

const tulipGame = document.querySelector('#tulip-game');
if (tulipGame) {
  const plots = [...tulipGame.querySelectorAll('[data-tulip]')];
  const harvestDisplay = document.querySelector('#tulip-harvest-count');
  const gameMessage = document.querySelector('#tulip-game-message');
  const stageNames = ['Semilla', 'Brote', 'Hojas', 'Capullo', 'Casi florecido', 'Flor madura'];
  const stageWaits = [30, 90, 180, 240, 360].map((seconds) => seconds * 1000);
  const stateByPlot = new Map(plots.map((plot) => [plot, {
    growth: 0,
    waterCount: 0,
    growthDueAt: null,
    growthDuration: 0,
    fed: false
  }]));
  let harvestCount = 0;

  const formatWait = (milliseconds) => {
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
  };

  const renderPlot = (plot, state, now = Date.now()) => {
    const waterButton = plot.querySelector('.plot-water');
    const feedButton = plot.querySelector('[data-action="feed"]');
    const harvestButton = plot.querySelector('[data-action="harvest"]');
    const isGrowing = state.growthDueAt !== null;
    const isMature = state.growth === 5;
    const remaining = isGrowing ? Math.max(0, state.growthDueAt - now) : 0;
    const wateringLabel = plot.querySelector('.plot-water-count');
    const timerLabel = plot.querySelector('.plot-time-label');
    const progress = plot.querySelector('.plot-timer-track span');
    const stageLabel = plot.querySelector('.plot-stage-name');
    const waterLeft = 3 - state.waterCount;
    const tulipName = plot.dataset.tulip;

    plot.dataset.growth = String(state.growth);
    stageLabel.textContent = stageNames[state.growth];
    waterButton.disabled = isGrowing || isMature;
    waterButton.setAttribute('aria-label', isMature
      ? `Tulipán ${tulipName}, maduro y listo para cosechar`
      : isGrowing
        ? `Tulipán ${tulipName}, creciendo. Le faltan ${formatWait(remaining)}`
        : `Regar tulipán ${tulipName}, ${state.waterCount} de 3 riegos`);
    wateringLabel.textContent = isMature
      ? 'Listo para cosechar'
      : isGrowing
        ? `Etapa ${state.growth + 1} de 5`
        : `${state.waterCount}/3 riegos`;
    timerLabel.textContent = isGrowing
      ? `Crece en ${formatWait(remaining)}`
      : isMature
        ? '¡Flor madura!'
        : state.waterCount === 0
          ? 'Listo para regar'
          : `Faltan ${waterLeft} ${waterLeft === 1 ? 'riego' : 'riegos'}`;
    progress.style.width = isGrowing
      ? `${Math.min(100, 100 - (remaining / state.growthDuration) * 100)}%`
      : isMature ? '100%' : '0%';
    feedButton.disabled = !isGrowing || state.fed;
    feedButton.textContent = state.fed ? '🌿 Alimentada' : '🌿 Alimentar';
    harvestButton.disabled = !isMature;
    feedButton.setAttribute('aria-label', state.fed
      ? `El tulipán ${tulipName} ya recibió comida en esta etapa`
      : `Alimentar el tulipán ${tulipName} para reducir su espera a la mitad`);
    harvestButton.setAttribute('aria-label', isMature
      ? `Cortar y cosechar el tulipán ${tulipName}`
      : `Las tijeras estarán disponibles cuando el tulipán ${tulipName} madure`);
  };

  const updateGarden = () => {
    const now = Date.now();
    stateByPlot.forEach((state, plot) => {
      if (state.growthDueAt !== null && now >= state.growthDueAt) {
        state.growth += 1;
        state.waterCount = 0;
        state.growthDueAt = null;
        state.growthDuration = 0;
        state.fed = false;
        gameMessage.textContent = `¡El tulipán ${plot.dataset.tulip} llegó a la etapa ${state.growth} de 5: ${stageNames[state.growth].toLowerCase()}!`;
      }
      renderPlot(plot, state, now);
    });
  };

  const startGrowth = (plot, state) => {
    const now = Date.now();
    state.growthDuration = stageWaits[state.growth];
    state.growthDueAt = now + state.growthDuration;
    state.fed = false;
    gameMessage.textContent = `¡Tres riegos para el tulipán ${plot.dataset.tulip}! Empieza la etapa ${state.growth + 1} de 5.`;
  };

  plots.forEach((plot) => {
    const state = stateByPlot.get(plot);
    const waterButton = plot.querySelector('.plot-water');
    const feedButton = plot.querySelector('[data-action="feed"]');
    const harvestButton = plot.querySelector('[data-action="harvest"]');

    waterButton.addEventListener('click', () => {
      if (state.growthDueAt !== null || state.growth >= 5) return;
      state.waterCount += 1;
      if (state.waterCount === 3) startGrowth(plot, state);
      else gameMessage.textContent = `El tulipán ${plot.dataset.tulip} recibió una gotita. Van ${state.waterCount} de 3 riegos.`;
      plot.classList.remove('is-watering');
      void plot.offsetWidth;
      plot.classList.add('is-watering');
      window.setTimeout(() => plot.classList.remove('is-watering'), 800);
      renderPlot(plot, state);
    });

    feedButton.addEventListener('click', () => {
      if (state.growthDueAt === null || state.fed) return;
      const now = Date.now();
      const remaining = Math.max(0, state.growthDueAt - now);
      if (remaining === 0) {
        updateGarden();
        return;
      }
      state.growthDueAt = now + Math.ceil(remaining / 2);
      state.fed = true;
      gameMessage.textContent = `¡Comida para el tulipán ${plot.dataset.tulip}! Su espera se redujo a la mitad.`;
      renderPlot(plot, state, now);
    });

    harvestButton.addEventListener('click', () => {
      if (state.growth < 5) return;
      state.growth = 0;
      state.waterCount = 0;
      state.growthDueAt = null;
      state.growthDuration = 0;
      state.fed = false;
      harvestCount += 1;
      harvestDisplay.textContent = String(harvestCount);
      plot.classList.add('is-cutting');
      window.setTimeout(() => plot.classList.remove('is-cutting'), 650);
      gameMessage.textContent = `¡Tulipán ${plot.dataset.tulip} cosechado! Ya puedes volver a cultivarlo.`;
      renderPlot(plot, state);
    });

    feedButton.setAttribute('aria-label', `Alimentar el tulipán ${plot.dataset.tulip}; una dosis por etapa`);
    harvestButton.setAttribute('aria-label', `Cortar y cosechar el tulipán ${plot.dataset.tulip} cuando esté maduro`);
    renderPlot(plot, state);
  });

  window.setInterval(updateGarden, 1000);
}

const f1Game = document.querySelector('#f1-game');
if (f1Game) {
  const canvas = document.querySelector('#f1-canvas');
  const context = canvas.getContext('2d');
  const speedDisplay = document.querySelector('#f1-speed');
  const speedBar = document.querySelector('#f1-speed-bar');
  const speedCheer = document.querySelector('#speed-cheer');
  const distanceDisplay = document.querySelector('#f1-distance');
  const progressBar = document.querySelector('#f1-progress');
  const overtakesDisplay = document.querySelector('#f1-overtakes');
  const raceMessage = document.querySelector('#f1-race-message');
  const trackName = document.querySelector('#canvas-track-name');
  const startButton = document.querySelector('#f1-start');
  const pauseButton = document.querySelector('#f1-pause');
  const trackButtons = [...f1Game.querySelectorAll('[data-track]')];
  const controlButtons = [...f1Game.querySelectorAll('[data-race-control]')];
  const circuits = {
    stella: { name: 'Circuito Stella', label: 'CIRCUITO STELLA', length: 8000, curve: 0.72, phase: 0.3, grass: '#779e79', sky: '#c4dced', curb: '#d887a4', accent: '#da7297' },
    orbit: { name: 'Órbita Azul', label: 'ÓRBITA AZUL', length: 10000, curve: 0.46, phase: 1.8, grass: '#7185a6', sky: '#b8c5e0', curb: '#91a4d5', accent: '#7898d3' },
    emerald: { name: 'Curvas Esmeralda', label: 'CURVAS ESMERALDA', length: 9000, curve: 1.05, phase: 3.2, grass: '#638a70', sky: '#bfd8cc', curb: '#e1c47b', accent: '#82ae8c' }
  };
  const playerDepth = 0.84;
  const playerCollisionDistance = 1050 * (1 - playerDepth);
  const inputs = { left: false, right: false, accelerate: false, brake: false };
  const rivalColors = ['#6c9bc8', '#e3b65e', '#93b579', '#bb7f9e'];
  const state = {
    width: 0,
    height: 0,
    pixelRatio: 1,
    selectedTrack: 'stella',
    running: false,
    paused: false,
    speed: 0,
    distance: 0,
    lane: 0,
    laneVelocity: 0,
    playerCrashTimer: 0,
    playerCrashDirection: 1,
    playerCrashMessageTimer: 0,
    overtakes: 0,
    rivals: [],
    collisionCooldown: 0,
    lastFrame: 0,
    frameAccumulator: 0,
    hudUpdateTimer: 0,
    animationFrameId: null,
    roadPoints: []
  };

  const selectedCircuit = () => circuits[state.selectedTrack];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const makeRival = (distanceAhead, lane, color, speed) => ({
    distanceAhead,
    lane,
    targetLane: lane,
    color,
    speed,
    crashTimer: 0,
    crashDirection: 1
  });

  const updateRaceHud = () => {
    const circuit = selectedCircuit();
    const speed = Math.round(state.speed);
    speedDisplay.textContent = String(speed);
    speedBar.style.width = `${Math.min(100, speed / 360 * 100)}%`;
    speedCheer.textContent = speed >= 300 ? '¡Más de 300 km/h! ¡Vuela, Stella!' : '¡Acelera hasta la zona turbo!';
    speedCheer.classList.toggle('is-turbo', speed >= 300);
    distanceDisplay.textContent = `${(state.distance / 1000).toFixed(1)} / ${(circuit.length / 1000).toFixed(1)} km`;
    progressBar.style.width = `${Math.min(100, state.distance / circuit.length * 100)}%`;
    overtakesDisplay.textContent = String(state.overtakes);
  };

  const drawRaceCar = (x, y, scale, color, isPlayer = false, rotation = 0) => {
    context.save();
    context.translate(x, y);
    context.rotate(rotation);
    context.scale(scale, scale);
    context.shadowColor = isPlayer ? 'rgba(25, 22, 38, .45)' : 'rgba(19, 25, 33, .3)';
    context.shadowBlur = isPlayer ? 13 : 7;
    context.shadowOffsetY = 5;

    context.fillStyle = '#24232a';
    context.fillRect(-18, -12, 8, 24);
    context.fillRect(10, -12, 8, 24);
    context.fillRect(-14, 11, 7, 17);
    context.fillRect(7, 11, 7, 17);

    context.fillStyle = color;
    context.beginPath();
    context.moveTo(0, -36);
    context.lineTo(7, -22);
    context.lineTo(12, -4);
    context.lineTo(10, 17);
    context.lineTo(5, 26);
    context.lineTo(-5, 26);
    context.lineTo(-10, 17);
    context.lineTo(-12, -4);
    context.lineTo(-7, -22);
    context.closePath();
    context.fill();

    context.shadowColor = 'transparent';
    context.fillStyle = isPlayer ? '#f5e9f0' : 'rgba(255,255,255,.82)';
    context.fillRect(-17, 15, 34, 4);
    context.fillRect(-21, -19, 42, 4);
    context.fillStyle = '#292631';
    context.beginPath();
    context.ellipse(0, -5, 5, 10, 0, 0, Math.PI * 2);
    context.fill();
    if (isPlayer) {
      context.fillStyle = '#fff4bd';
      context.fillRect(-8, -29, 4, 3);
      context.fillRect(4, -29, 4, 3);
    }
    context.restore();
  };

  const drawCrashEffect = (x, y, scale, strength, direction) => {
    if (strength <= 0) return;
    context.save();
    context.translate(x + direction * 13 * scale, y);
    context.globalAlpha = Math.min(1, strength * 1.8);
    context.strokeStyle = '#ffe08a';
    context.lineWidth = Math.max(1, 2 * scale);
    for (let index = 0; index < 5; index += 1) {
      const angle = index * Math.PI * 0.4 - 1;
      context.beginPath();
      context.moveTo(Math.cos(angle) * 5 * scale, Math.sin(angle) * 5 * scale);
      context.lineTo(Math.cos(angle) * (12 + index % 2 * 4) * scale, Math.sin(angle) * (12 + index % 2 * 4) * scale);
      context.stroke();
    }
    context.restore();
  };

  const drawScene = () => {
    const { width, height } = state;
    if (!width || !height) return;

    const circuit = selectedCircuit();
    const horizon = height * 0.34;
    const roadLength = height - horizon + 24;
    const sky = context.createLinearGradient(0, 0, 0, horizon);
    sky.addColorStop(0, circuit.sky);
    sky.addColorStop(1, '#f4dce4');
    context.clearRect(0, 0, width, height);
    context.fillStyle = sky;
    context.fillRect(0, 0, width, horizon);
    context.fillStyle = circuit.grass;
    context.fillRect(0, horizon, width, height - horizon);

    for (let index = 0; index < 11; index += 1) {
      const x = width * index / 10;
      const radius = 8 + (index % 3) * 4;
      context.fillStyle = index % 2 ? 'rgba(43, 74, 57, .22)' : 'rgba(54, 80, 105, .17)';
      context.beginPath();
      context.arc(x, horizon + 5, radius, Math.PI, 0);
      context.fill();
    }

    const segmentCount = 34;
    const roadPoints = [];
    for (let index = 0; index < segmentCount; index += 1) {
      const depth = index / (segmentCount - 1);
      const y = horizon + Math.pow(depth, 1.62) * roadLength;
      const widthAtDepth = width * (0.12 + 0.69 * depth);
      const bend = Math.sin(state.distance / 420 + depth * 3.5 + circuit.phase) * circuit.curve * width * 0.12 * depth;
      roadPoints.push({ y, center: width * 0.5 + bend, width: widthAtDepth, depth });
    }
    state.roadPoints = roadPoints;

    context.beginPath();
    roadPoints.forEach((point, index) => {
      const x = point.center - point.width * 0.5;
      if (index === 0) context.moveTo(x, point.y);
      else context.lineTo(x, point.y);
    });
    for (let index = roadPoints.length - 1; index >= 0; index -= 1) {
      const point = roadPoints[index];
      context.lineTo(point.center + point.width * 0.5, point.y);
    }
    context.closePath();
    context.fillStyle = '#41414a';
    context.fill();

    for (let index = 0; index < roadPoints.length - 1; index += 1) {
      const current = roadPoints[index];
      const next = roadPoints[index + 1];
      const stripe = Math.floor(state.distance / 24 + index) % 2 === 0;
      const curbColor = stripe ? '#f4eee9' : circuit.curb;
      const currentCurb = Math.max(2, current.width * 0.035);
      const nextCurb = Math.max(2, next.width * 0.035);
      context.fillStyle = curbColor;
      context.beginPath();
      context.moveTo(current.center - current.width * 0.5, current.y);
      context.lineTo(current.center - current.width * 0.5 + currentCurb, current.y);
      context.lineTo(next.center - next.width * 0.5 + nextCurb, next.y);
      context.lineTo(next.center - next.width * 0.5, next.y);
      context.closePath();
      context.fill();
      context.beginPath();
      context.moveTo(current.center + current.width * 0.5 - currentCurb, current.y);
      context.lineTo(current.center + current.width * 0.5, current.y);
      context.lineTo(next.center + next.width * 0.5, next.y);
      context.lineTo(next.center + next.width * 0.5 - nextCurb, next.y);
      context.closePath();
      context.fill();

      if (Math.floor(state.distance / 34 + index) % 4 < 2) {
        context.strokeStyle = 'rgba(255, 255, 240, .84)';
        context.lineWidth = 1 + next.depth * 2;
        [1 / 3, 2 / 3].forEach((laneMark) => {
          const x1 = current.center - current.width * 0.5 + current.width * laneMark;
          const x2 = next.center - next.width * 0.5 + next.width * laneMark;
          context.beginPath();
          context.moveTo(x1, current.y);
          context.lineTo(x2, next.y);
          context.stroke();
        });
      }
    }

    state.rivals.forEach((rival) => {
      if (rival.distanceAhead <= -5) return;
      const depth = clamp(1 - rival.distanceAhead / 1050, 0.035, 0.94);
      const pointIndex = Math.min(roadPoints.length - 1, Math.round(depth * (roadPoints.length - 1)));
      const roadPoint = roadPoints[pointIndex];
      const scale = 0.2 + depth * 0.82;
      const x = roadPoint.center + rival.lane * roadPoint.width * 0.36;
      const y = roadPoint.y - 7 * scale;
      const rotation = rival.crashTimer > 0
        ? Math.sin((0.7 - rival.crashTimer) * 25) * 0.42 * rival.crashDirection
        : 0;
      drawRaceCar(x, y, scale, rival.color, false, rotation);
      drawCrashEffect(x, y, scale, rival.crashTimer, rival.crashDirection);
    });

    const playerPoint = roadPoints[Math.round((roadPoints.length - 1) * playerDepth)];
    const playerX = playerPoint.center + state.lane * playerPoint.width * 0.36;
    const playerRotation = state.playerCrashTimer > 0
      ? Math.sin((0.55 - state.playerCrashTimer) * 25) * 0.42 * state.playerCrashDirection
      : 0;
    drawRaceCar(playerX, height * 0.83, 1.12, circuit.accent, true, playerRotation);
    drawCrashEffect(playerX, height * 0.83, 1.12, state.playerCrashTimer, state.playerCrashDirection);

    if (!state.running || state.paused) {
      const finished = state.distance >= circuit.length;
      context.fillStyle = 'rgba(31, 29, 42, .62)';
      context.fillRect(0, height * 0.43, width, height * 0.18);
      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.font = `700 ${Math.max(12, width * 0.022)}px "DM Sans", sans-serif`;
      const title = state.paused ? 'CARRERA EN PAUSA' : finished ? '¡BANDERA A CUADROS!' : 'PULSA «EMPEZAR CARRERA» PARA INICIAR';
      context.fillText(title, width * 0.5, height * 0.51);
      context.font = `500 ${Math.max(10, width * 0.016)}px "DM Sans", sans-serif`;
      const subtitle = state.paused
        ? 'Pulsa «Reanudar» para volver a la pista'
        : finished ? '¡Qué gran carrera, Stella!' : 'La salida comienza solo al pulsar el botón';
      context.fillText(subtitle, width * 0.5, height * 0.565);
    }
  };

  const updateRace = (delta) => {
    if (!state.running || state.paused) return;
    const circuit = selectedCircuit();
    if (inputs.accelerate) state.speed += 126 * delta;
    else if (inputs.brake) state.speed -= 210 * delta;
    else state.speed -= 24 * delta;
    state.speed = clamp(state.speed, 0, 360);

    const steer = Number(inputs.right) - Number(inputs.left);
    const steeringTarget = steer * 1.15;
    state.laneVelocity += (steeringTarget - state.laneVelocity) * Math.min(1, delta * 7);
    state.lane = clamp(state.lane + state.laneVelocity * delta * (0.65 + state.speed / 420), -0.92, 0.92);
    const distanceDelta = state.speed / 3.6 * delta;
    state.distance += distanceDelta;
    state.collisionCooldown = Math.max(0, state.collisionCooldown - delta);
    state.playerCrashTimer = Math.max(0, state.playerCrashTimer - delta);
    state.playerCrashMessageTimer = Math.max(0, state.playerCrashMessageTimer - delta);

    state.rivals.forEach((rival) => {
      rival.distanceAhead += (rival.speed - state.speed) / 3.6 * delta;
      rival.lane += (rival.targetLane - rival.lane) * Math.min(1, delta * 2.8);
      rival.crashTimer = Math.max(0, rival.crashTimer - delta);
      if (Math.abs(rival.distanceAhead - playerCollisionDistance) < 45 &&
          Math.abs(rival.lane - state.lane) < 0.42 && state.collisionCooldown === 0) {
        state.speed = Math.max(45, state.speed - 95);
        state.collisionCooldown = 0.8;
        rival.distanceAhead = playerCollisionDistance + 42;
        rival.targetLane = rival.lane > state.lane ? 0.65 : -0.65;
        rival.crashTimer = 0.7;
        rival.crashDirection = state.lane <= rival.lane ? 1 : -1;
        state.playerCrashTimer = 0.55;
        state.playerCrashMessageTimer = 2.2;
        state.playerCrashDirection = state.lane < rival.lane ? -1 : 1;
        state.laneVelocity += state.playerCrashDirection * 0.8;
        raceMessage.textContent = '¡Choque! Golpeaste a un rival y perdiste velocidad. ¡Vuelve a la pista!';
      }
      if (rival.distanceAhead < -45) {
        state.overtakes += 1;
        rival.distanceAhead = 680 + Math.random() * 500;
        rival.speed = 190 + Math.random() * 115;
        rival.lane = [-0.66, 0, 0.66][Math.floor(Math.random() * 3)];
        rival.targetLane = rival.lane;
      } else if (rival.distanceAhead > 1650) {
        rival.distanceAhead = 650 + Math.random() * 550;
        rival.speed = 190 + Math.random() * 115;
        rival.lane = [-0.66, 0, 0.66][Math.floor(Math.random() * 3)];
        rival.targetLane = rival.lane;
      }
    });

    for (let firstIndex = 0; firstIndex < state.rivals.length; firstIndex += 1) {
      const first = state.rivals[firstIndex];
      for (let secondIndex = firstIndex + 1; secondIndex < state.rivals.length; secondIndex += 1) {
        const second = state.rivals[secondIndex];
        if (first.crashTimer > 0 || second.crashTimer > 0 ||
            Math.abs(first.distanceAhead - second.distanceAhead) > 22 ||
            Math.abs(first.lane - second.lane) > 0.28) continue;

        const firstDirection = first.lane <= 0 ? -1 : 1;
        first.targetLane = clamp(first.lane + firstDirection * 0.42, -0.68, 0.68);
        second.targetLane = clamp(second.lane - firstDirection * 0.42, -0.68, 0.68);
        if (Math.abs(first.targetLane - second.targetLane) < 0.3) {
          second.targetLane = clamp(second.lane + firstDirection * 0.5, -0.68, 0.68);
        }
        first.speed = Math.max(120, first.speed - 36);
        second.speed = Math.max(120, second.speed - 36);
        first.crashTimer = 0.7;
        second.crashTimer = 0.7;
        first.crashDirection = firstDirection;
        second.crashDirection = -firstDirection;
        if (state.playerCrashMessageTimer === 0) {
          raceMessage.textContent = '¡Dos rivales chocaron! Aprovecha el espacio y adelántalos.';
        }
      }
    }

    if (state.distance >= circuit.length) {
      state.distance = circuit.length;
      state.running = false;
      state.paused = false;
      releaseRaceControls();
      trackButtons.forEach((button) => { button.disabled = false; });
      pauseButton.disabled = true;
      pauseButton.setAttribute('aria-pressed', 'false');
      pauseButton.textContent = 'Pausar ⏸';
      startButton.textContent = 'Correr de nuevo 🏁';
      raceMessage.textContent = `¡Bandera a cuadros en ${circuit.name}! ¡Qué gran carrera, Stella!`;
    }
    state.hudUpdateTimer += delta;
    if (state.hudUpdateTimer >= 0.1 || !state.running) {
      state.hudUpdateTimer = 0;
      updateRaceHud();
    }
  };

  const raceFrame = (timestamp) => {
    state.frameAccumulator += Math.max(0, timestamp - state.lastFrame);
    state.lastFrame = timestamp;
    if (state.frameAccumulator < 1000 / 60) {
      state.animationFrameId = window.requestAnimationFrame(raceFrame);
      return;
    }
    const delta = Math.min(state.frameAccumulator / 1000, 0.05);
    state.frameAccumulator %= 1000 / 60;
    updateRace(delta);
    drawScene();
    if (state.running) state.animationFrameId = window.requestAnimationFrame(raceFrame);
    else state.animationFrameId = null;
  };

  const resizeRace = () => {
    const bounds = canvas.getBoundingClientRect();
    state.width = bounds.width;
    state.height = bounds.height;
    state.pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(state.width * state.pixelRatio);
    canvas.height = Math.round(state.height * state.pixelRatio);
    context.setTransform(state.pixelRatio, 0, 0, state.pixelRatio, 0, 0);
    drawScene();
  };

  const releaseRaceControls = () => {
    Object.keys(inputs).forEach((input) => { inputs[input] = false; });
    controlButtons.forEach((button) => button.classList.remove('is-held'));
  };

  const startRace = () => {
    const circuit = selectedCircuit();
    state.running = true;
    state.paused = false;
    state.speed = 0;
    state.distance = 0;
    state.lane = 0;
    state.laneVelocity = 0;
    state.playerCrashTimer = 0;
    state.playerCrashMessageTimer = 0;
    state.overtakes = 0;
    state.collisionCooldown = 0;
    state.frameAccumulator = 0;
    state.hudUpdateTimer = 0;
    state.rivals = [
      makeRival(390, -0.55, rivalColors[0], 268),
      makeRival(540, -0.55, rivalColors[1], 236),
      makeRival(850, 0.55, rivalColors[2], 258),
      makeRival(1000, 0.55, rivalColors[3], 224),
      makeRival(1320, 0, '#d88967', 248),
      makeRival(1470, 0, '#a18bc4', 215)
    ];
    releaseRaceControls();
    trackButtons.forEach((button) => { button.disabled = true; });
    pauseButton.disabled = false;
    pauseButton.setAttribute('aria-pressed', 'false');
    pauseButton.textContent = 'Pausar ⏸';
    startButton.textContent = 'Reiniciar carrera ↻';
    raceMessage.textContent = `¡Luces fuera en ${circuit.name}! Mantén ↑ o Acelerar para ganar velocidad.`;
    updateRaceHud();
    state.lastFrame = performance.now();
    if (state.animationFrameId !== null) window.cancelAnimationFrame(state.animationFrameId);
    state.animationFrameId = window.requestAnimationFrame(raceFrame);
  };

  const selectTrack = (button) => {
    if (state.running) return;
    state.selectedTrack = button.dataset.track;
    trackButtons.forEach((option) => {
      const isSelected = option === button;
      option.classList.toggle('is-selected', isSelected);
      option.setAttribute('aria-pressed', String(isSelected));
    });
    trackName.textContent = selectedCircuit().label;
    state.distance = 0;
    state.speed = 0;
    state.laneVelocity = 0;
    state.playerCrashTimer = 0;
    state.playerCrashMessageTimer = 0;
    state.rivals = [];
    updateRaceHud();
    drawScene();
  };

  const keyControls = {
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'accelerate', KeyW: 'accelerate', Space: 'accelerate',
    ArrowDown: 'brake', KeyS: 'brake'
  };

  trackButtons.forEach((button) => {
    button.addEventListener('click', () => selectTrack(button));
  });
  startButton.addEventListener('click', startRace);
  pauseButton.addEventListener('click', () => {
    if (!state.running) return;
    state.paused = !state.paused;
    releaseRaceControls();
    pauseButton.setAttribute('aria-pressed', String(state.paused));
    if (state.paused) {
      pauseButton.textContent = 'Reanudar ▶';
      if (state.animationFrameId !== null) window.cancelAnimationFrame(state.animationFrameId);
      state.animationFrameId = null;
      drawScene();
      return;
    }

    pauseButton.textContent = 'Pausar ⏸';
    state.lastFrame = performance.now();
    state.frameAccumulator = 0;
    state.animationFrameId = window.requestAnimationFrame(raceFrame);
  });

  window.addEventListener('keydown', (event) => {
    const control = keyControls[event.code];
    if (!state.running || !control) return;
    event.preventDefault();
    inputs[control] = true;
  });
  window.addEventListener('keyup', (event) => {
    const control = keyControls[event.code];
    if (control) inputs[control] = false;
  });

  controlButtons.forEach((button) => {
    const control = button.dataset.raceControl;
    const release = () => {
      inputs[control] = false;
      button.classList.remove('is-held');
    };
    button.addEventListener('pointerdown', (event) => {
      if (!state.running) return;
      event.preventDefault();
      inputs[control] = true;
      button.classList.add('is-held');
      button.setPointerCapture(event.pointerId);
    });
    button.addEventListener('pointerup', release);
    button.addEventListener('pointercancel', release);
    button.addEventListener('lostpointercapture', release);
  });

  window.addEventListener('blur', releaseRaceControls);
  window.addEventListener('resize', resizeRace);
  trackName.textContent = selectedCircuit().label;
  resizeRace();
  updateRaceHud();
}

document.querySelectorAll('[data-surprise]').forEach((button) => {
  button.addEventListener('click', () => {
    toast.textContent = button.dataset.surprise;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 4200);
  });
});

document.querySelectorAll('[data-story-close]').forEach((button) => {
  button.addEventListener('click', () => {
    const story = button.closest('.story-card');
    if (!story) return;
    story.open = false;
    story.querySelector('summary').focus();
  });
});

const musicTracks = {
  queen: [
    { id: 'fJ9rUzIMcZQ', title: 'Bohemian Rhapsody' },
    { id: 'HgzGwKwLmgM', title: "Don't Stop Me Now" },
    { id: 'rY0WxgSXdEE', title: 'Another One Bites the Dust' },
    { id: '-tJYN-eG1zk', title: 'We Will Rock You' }
  ],
  beatles: [
    { id: 'xUNqsfFUwhY', title: 'Here Comes The Sun' },
    { id: 'A_MjCqQoLLA', title: 'Hey Jude' },
    { id: 'QDYfEBY9NM4', title: 'Let It Be' },
    { id: '45cYwDMibGo', title: 'Come Together' }
  ]
};

document.querySelectorAll('[data-random-track]').forEach((button) => {
  button.addEventListener('click', () => {
    const artist = button.dataset.randomTrack;
    const tracks = musicTracks[artist];
    const player = document.querySelector(`[data-music-player="${artist}"]`);
    const status = document.querySelector(`[data-track-status="${artist}"]`);
    const options = tracks.filter((track) => track.id !== player.dataset.trackId);
    const track = options[Math.floor(Math.random() * options.length)];
    player.dataset.trackId = track.id;
    player.title = `${artist === 'queen' ? 'Queen' : 'The Beatles'} - ${track.title} (video oficial)`;
    player.src = `https://www.youtube-nocookie.com/embed/${track.id}?rel=0&modestbranding=1&playsinline=1&autoplay=1`;
    status.textContent = `Canción completa: ${track.title}`;
  });
});

const bookPages = document.querySelector('#book-pages');
if (bookPages) {
  const chapters = [
    {
      title: 'Lo primero: que existes',
      openings: [
        'Stella, estas páginas empiezan con una verdad que quiero que recuerdes: me alegra que existas.',
        'Si este libro pudiera darte algo al abrirse, sería un abrazo que dijera cuánto te valoro.',
        'No escribo para enumerar tus gustos, sino para celebrar a la persona maravillosa que los disfruta.',
        'Cada capítulo guarda una pequeña luz, pero la luz más especial de este mundo eres tú.',
        'Quiero que este libro se sienta como una pausa bonita hecha solo para ti.'
      ],
      moments: [
        'Admiro la manera única en que llenas de vida hasta los días más sencillos.',
        'Tu presencia hace que los lugares se sientan más cálidos y que las sonrisas duren un poco más.',
        'Hay algo muy tuyo en la forma de mirar el mundo: sensible, curiosa y llena de imaginación.',
        'No necesitas hacer nada extraordinario para ser importante; ser tú ya es algo enorme.',
        'Cuando pienso en todo lo que vales, ninguna página me parece suficiente para decirlo.'
      ],
      endings: [
        'Ojalá nunca olvides que mereces cariño sincero, paciencia y alegría.',
        'Quiero acompañarte celebrando cada sueño, cada risa y cada pequeño logro.',
        'Tu valor no depende de un día perfecto: sigue contigo en todos los días.',
        'Gracias por ser exactamente tú, con todo lo que te hace especial.',
        'Si alguna vez dudas de ti, vuelve a estas palabras y recuerda que yo sí veo tu luz.',
        'Deseo que la vida te devuelva, multiplicado, todo el cariño que das.',
        'En este libro siempre tendrás un lugar donde sentirte querida.',
        'Y si solo recuerdas una cosa, que sea esta: te valoro muchísimo.'
      ]
    },
    {
      title: 'Orejas, patitas y ternura',
      openings: [
        'En esta parte del libro aparecen conejitos de orejas atentas y saltitos capaces de alegrar una tarde.',
        'Imagina un jardín tranquilo donde los conejitos exploran sin prisa y encuentran rincones suaves.',
        'Los hámsteres llegan en una bolita de energía, curiosidad y planes diminutos.',
        'Un conejito y un hámster se asoman a estas páginas para recordarnos que lo pequeño también puede ser inmenso.',
        'Tus animalitos favoritos merecen su propio capítulo, porque conocen muy bien el camino a tu sonrisa.'
      ],
      moments: [
        'Los conejitos representan esa ternura que invita a bajar el ritmo y mirar con cuidado.',
        'La curiosidad de un hámster en su ruedita parece decir que siempre hay algo nuevo por descubrir.',
        'Entre patitas y bigotes, el mundo se vuelve un poquito más amable.',
        'Cada salto pequeño puede convertirse en una aventura cuando se mira con imaginación.',
        'Pienso en cuánto cariño tienes para los seres que necesitan delicadeza y compañía.'
      ],
      endings: [
        'Que nunca te falten motivos suaves para sonreír.',
        'Ojalá cada día tenga un rincón seguro donde descansar el corazón.',
        'Tu ternura es una fuerza bonita; cuídala tanto como cuidas a los demás.',
        'A veces la felicidad cabe en una patita, una mirada y un momento tranquilo.',
        'Que siempre puedas encontrar alegría en las cosas pequeñas.',
        'Este capítulo te recuerda que mereces la misma paciencia y dulzura que regalas.',
        'Cuando necesites una pausa, imagina a tus animalitos haciéndote compañía.',
        'Y que cada saltito te acerque a algo que te haga feliz.'
      ]
    },
    {
      title: 'Nubes frías, corazón cálido',
      openings: [
        'Los pingüinos desfilan por aquí con su elegancia de aletas y su manera graciosa de avanzar.',
        'Una colonia de pingüinos convierte el hielo en un lugar lleno de compañía.',
        'Las ovejitas aparecen como pequeñas nubes con patas, listas para llenar de calma este capítulo.',
        'Entre un pingüino curioso y una ovejita tranquila, estas páginas encuentran su propio ritmo.',
        'Hay animales que enseñan a sonreír sin decir una palabra; los tuyos saben hacerlo muy bien.'
      ],
      moments: [
        'Los pingüinos nos recuerdan que hasta en los días fríos se puede caminar acompañado.',
        'Las ovejitas parecen guardar un pedacito de cielo en su lana esponjosa.',
        'A veces avanzar con pasitos cortos también es llegar lejos.',
        'La compañía buena no necesita grandes discursos: basta con estar cerca.',
        'Pensar en tus animales favoritos vuelve más amable hasta la página más gris.'
      ],
      endings: [
        'Que encuentres abrigo en las personas que te quieren de verdad.',
        'Ojalá siempre haya alguien dispuesto a caminar a tu lado.',
        'No tienes que apresurarte; tu propio paso también es perfecto.',
        'Que la calma te encuentre cuando la necesites.',
        'Tu corazón merece un hogar lleno de cuidado.',
        'Hasta el invierno más largo termina dejando espacio a la primavera.',
        'Deja que estas pequeñas nubes te recuerden respirar y descansar.',
        'Y guarda una sonrisa para cada nuevo comienzo.'
      ]
    },
    {
      title: 'El jardín que crece contigo',
      openings: [
        'En tu jardín imaginario, los tulipanes encuentran sitio para crecer a su manera.',
        'Cada tulipán de estas páginas tiene un color distinto, como cada una de las cosas que te hacen ser tú.',
        'El azul abre un cielo tranquilo y el rosa pinta de ternura los bordes de este capítulo.',
        'El negro también tiene su belleza: profundo, valiente y perfecto para hacer brillar otros colores.',
        'El verde aparece como una promesa de vida nueva entre mil tulipanes.'
      ],
      moments: [
        'Regar una planta enseña que el cariño también se demuestra con constancia y pequeños gestos.',
        'Algunas flores tardan más en abrirse, pero eso no las hace menos hermosas.',
        'Azul, rosa, negro y verde: cuatro tonos distintos que juntos cuentan algo de tu mundo.',
        'Un jardín no le exige a cada flor crecer igual; solo le da espacio, luz y cuidado.',
        'Imagino los tulipanes inclinándose hacia ti como si quisieran agradecerte por visitarlos.'
      ],
      endings: [
        'Que puedas crecer sin prisa y sin tener que parecerte a nadie.',
        'Mereces cuidado en los días de brote y también en los días de descanso.',
        'Nunca dudes de que hay belleza en tu manera particular de florecer.',
        'Ojalá tus sueños reciban agua, paciencia y un poquito de sol cada día.',
        'Cada etapa tuya merece ser celebrada, incluso las que todavía están empezando.',
        'Que el color que elijas hoy te haga sentir en casa.',
        'Tu jardín es más bonito porque tú estás en él.',
        'Y cuando florezca algo nuevo en ti, aquí estaré para alegrarme contigo.'
      ]
    },
    {
      title: 'A toda velocidad hacia tus sueños',
      openings: [
        'Se encienden las luces del circuito y tu monoplaza espera el momento de salir.',
        'La pista se abre frente a ti, llena de curvas nuevas y posibilidades.',
        'En esta carrera, cada vuelta lleva escrito uno de tus sueños.',
        'El motor ruge, el corazón se emociona y empieza una aventura hecha para Stella.',
        'Hasta los 300 kilómetros por hora parecen pequeños al lado de todo lo que puedes alcanzar.'
      ],
      moments: [
        'No importa si eliges la ruta más rápida o la más sinuosa: el volante sigue en tus manos.',
        'Una curva inesperada no borra el camino que ya recorriste.',
        'Descansar en boxes también forma parte de una carrera inteligente.',
        'Cada vez que vuelves a acelerar, demuestras que todavía tienes ganas de avanzar.',
        'Me encanta imaginarte cruzando la meta con una sonrisa orgullosa.'
      ],
      endings: [
        'Ve hacia tus sueños a tu propio ritmo; no existe una sola forma correcta de llegar.',
        'Confío en todo lo que puedes lograr, incluso cuando tú todavía estás reuniendo fuerzas.',
        'Que nunca te falte valor para elegir tu próxima curva.',
        'Si el camino se complica, recuerda que puedes parar, respirar y volver a intentarlo.',
        'Celebra cada tramo, no solo la bandera final.',
        'Tu vida no es una competencia con nadie; es una carrera que merece ser tuya.',
        'Te estaré animando desde la primera vuelta hasta la última.',
        'Y cuando alcances una meta, ojalá te permitas sentir todo el orgullo que mereces.'
      ]
    },
    {
      title: 'Risas, rarezas y amistad',
      openings: [
        'Una pantalla se enciende y Eddsworld abre la puerta a un mundo de ocurrencias.',
        'En un rincón de este libro, las bromas de Edd y sus amigos convierten el caos en risa.',
        'El Eltingville Club entra con sus debates de cómics, terror y ciencia ficción.',
        'Hay amistades que discuten por sus historias favoritas y aun así llenan el día de momentos memorables.',
        'Estas páginas celebran tus mundos raros, divertidos y llenos de personalidad.'
      ],
      moments: [
        'Un chiste inesperado a veces ilumina justo el día que más lo necesitaba.',
        'Las aficiones compartidas pueden convertirse en puentes entre personas.',
        'Ser apasionada por algo es una forma preciosa de estar viva.',
        'No tienes que ocultar las cosas que te entusiasman para encajar.',
        'Tus gustos distintos hacen que tu universo tenga más puertas y más colores.'
      ],
      endings: [
        'Que nunca te falte alguien con quien reír hasta que te duelan las mejillas.',
        'Ojalá siempre puedas disfrutar aquello que te encanta sin pedir permiso.',
        'Las mejores historias también se construyen con gente que te acepta.',
        'Que la risa te encuentre incluso en los capítulos inesperados.',
        'Tu entusiasmo merece espacio y celebración.',
        'A veces lo más valioso es poder ser tú y compartirlo con alguien.',
        'Guarda tus rarezas con cariño: también son parte de tu brillo.',
        'Y que siempre encuentres una nueva historia que te haga decir: una más.'
      ]
    },
    {
      title: 'Amor, misterio y decisiones',
      openings: [
        'Heartstopper trae a estas páginas la dulzura de descubrir que una amistad puede crecer.',
        'Nick y Charlie recuerdan que aprender a quererse también requiere paciencia y valentía.',
        'En otro rincón, Death Note enciende un misterio que invita a pensar en la justicia.',
        'Entre una historia tierna y un enigma oscuro, tu imaginación puede recorrer muchos caminos.',
        'Tus historias favoritas hablan de emociones distintas, y todas encuentran un sitio aquí.'
      ],
      moments: [
        'El cariño sano deja espacio para ser uno mismo y crecer acompañado.',
        'Las decisiones importantes merecen reflexión, empatía y tiempo.',
        'Un misterio puede atraparnos, pero las personas siempre valen más que cualquier respuesta fácil.',
        'La ternura no es debilidad: puede ser una manera valiente de cuidar.',
        'Me gusta que puedas disfrutar tanto de un romance amable como de una historia llena de preguntas.'
      ],
      endings: [
        'Mereces vínculos donde te escuchen, te respeten y te quieran tal como eres.',
        'Que siempre puedas elegir con libertad y con el corazón bien cuidado.',
        'Las preguntas difíciles también pueden llevar a comprender mejor el mundo.',
        'Nunca confundas el amor con tener que dejar de ser tú.',
        'Ojalá encuentres finales felices, pero también fuerza para escribir los tuyos.',
        'Tu sensibilidad es algo que merece protección y orgullo.',
        'Que la bondad siga siendo una de tus formas favoritas de valentía.',
        'Y que ninguna sombra te haga olvidar toda la luz que llevas dentro.'
      ]
    },
    {
      title: 'Valentía y sabiduría',
      openings: [
        'Tanjiro comienza su viaje con una determinación que nace del amor por su familia.',
        'Demon Slayer llena este capítulo de espadas, pruebas difíciles y una voluntad que no se rinde.',
        'Maomao observa una pista diminuta y descubre que la curiosidad puede abrir grandes misterios.',
        'Los diarios de la boticaria nos llevan a un palacio donde las plantas y la inteligencia importan.',
        'Aquí conviven la valentía de una aventura y la calma de buscar respuestas con cuidado.'
      ],
      moments: [
        'La fuerza puede ser proteger, aprender, pedir ayuda o volver a intentarlo.',
        'El conocimiento crece cuando alguien mira con atención y hace buenas preguntas.',
        'La compasión permite ver a las personas más allá de sus dificultades.',
        'Una pista pequeña puede cambiar la manera de entender toda una historia.',
        'Me inspira que disfrutes personajes que enfrentan retos con corazón y cabeza.'
      ],
      endings: [
        'Que tengas valor para defender lo que amas y sabiduría para cuidarte a ti.',
        'No tienes que resolverlo todo hoy; algunas respuestas llegan paso a paso.',
        'Tu curiosidad puede llevarte a lugares maravillosos.',
        'Pedir compañía también es una forma de ser valiente.',
        'Que tus decisiones siempre tengan espacio para la bondad.',
        'Ojalá recuerdes que eres más fuerte de lo que piensas y nunca estás obligada a poder con todo.',
        'Cada aprendizaje tuyo merece respeto, por pequeño que parezca.',
        'Y que siempre haya alguien celebrando tus victorias, grandes o silenciosas.'
      ]
    },
    {
      title: 'Magia, vuelo y heroísmo',
      openings: [
        'Una carta invita a descubrir Hogwarts, donde la magia empieza con una puerta abierta.',
        'Las páginas vuelan hacia Nunca Jamás, siguiendo a Peter Pan y a quienes se atreven a imaginar.',
        'Hércules aparece entre mitos para recordar que ser héroe también consiste en elegir con el corazón.',
        'Un castillo, una isla lejana y un cielo lleno de dioses caben en este capítulo.',
        'Tus historias de magia y aventura hacen que cualquier lugar pueda convertirse en un mundo nuevo.'
      ],
      moments: [
        'La amistad puede sentirse como encontrar tu propio grupo en medio de un castillo enorme.',
        'Volar hacia Nunca Jamás representa ese permiso de soñar sin hacerte pequeña.',
        'La verdadera fuerza no siempre está en los músculos: también vive en la bondad.',
        'La imaginación convierte una habitación común en un portal a otra aventura.',
        'Me alegra que guardes espacio para la magia, incluso en los días cotidianos.'
      ],
      endings: [
        'Que tus sueños nunca reciban un límite antes de poder desplegar sus alas.',
        'Elige la valentía que se parece a ti, no la que otros esperan.',
        'Que encuentres amistades que se sientan como hogar.',
        'No tienes que ser perfecta para ser protagonista de tu propia historia.',
        'Ojalá siempre puedas volver a creer en lo extraordinario.',
        'Tu imaginación merece todos los cielos que quiera explorar.',
        'La bondad que llevas es una clase de magia que sí existe.',
        'Y aunque cambie el capítulo, siempre puedes escribir uno nuevo.'
      ]
    },
    {
      title: 'Canciones para acompañarte',
      openings: [
        'Queen levanta el telón con una canción que parece hecha para cantar a todo pulmón.',
        'Los acordes de Queen convierten una habitación cualquiera en un escenario enorme.',
        'The Beatles traen una melodía que suena como caminar bajo un cielo despejado.',
        'Una canción de The Beatles puede guardar recuerdos, alegría y ganas de seguir caminando.',
        'Este último capítulo tiene ritmo, porque tus bandas favoritas también forman parte de tu mundo.'
      ],
      moments: [
        'La música acompaña lo que a veces cuesta poner en palabras.',
        'Cada canción puede ser una pequeña máquina del tiempo hacia un momento feliz.',
        'Me gusta imaginarte encontrando el volumen perfecto para cada emoción.',
        'Queen y The Beatles recuerdan que una melodía puede reunir a muchas generaciones.',
        'Cuando suena una canción querida, el corazón también encuentra su propio compás.'
      ],
      endings: [
        'Que siempre tengas una canción cerca para bailar, descansar o volver a empezar.',
        'Ojalá la música te acompañe en todos los caminos que elijas.',
        'Nunca dejes de celebrar las cosas que hacen cantar a tu corazón.',
        'Que cada estribillo te recuerde que mereces alegría.',
        'Hay melodías que se quedan; el cariño sincero también.',
        'Gracias por compartir conmigo un pedacito de las canciones que amas.',
        'Cuando el mundo haga demasiado ruido, busca el ritmo que te dé paz.',
        'Cierro estas páginas, pero no el cariño: ese sigue sonando para ti.'
      ]
    }
  ];

  const pagesPerChapter = 200;
  const totalBookPages = chapters.length * pagesPerChapter;
  const fragment = document.createDocumentFragment();
  chapters.forEach((chapter, chapterIndex) => {
    for (let pageIndex = 0; pageIndex < pagesPerChapter; pageIndex += 1) {
      const pageNumber = chapterIndex * pagesPerChapter + pageIndex + 1;
      const page = document.createElement('article');
      page.className = 'book-page';
      page.setAttribute('aria-label', `Página ${pageNumber}: ${chapter.title}`);

      const header = document.createElement('div');
      header.className = 'book-page-header';
      const chapterLabel = document.createElement('span');
      chapterLabel.className = 'book-page-chapter';
      chapterLabel.textContent = `Capítulo ${String(chapterIndex + 1).padStart(2, '0')} · ${chapter.title}`;
      const pageLabel = document.createElement('span');
      pageLabel.textContent = `${pageNumber} / ${totalBookPages}`;
      header.append(chapterLabel, pageLabel);
      page.appendChild(header);

      if (pageIndex === 0) {
        const title = document.createElement('h3');
        title.className = 'book-page-title';
        title.textContent = chapter.title;
        page.appendChild(title);
      }

      const opening = chapter.openings[pageIndex % chapter.openings.length];
      const momentIndex = Math.floor(pageIndex / chapter.openings.length);
      const moment = chapter.moments[momentIndex % chapter.moments.length];
      const closingIndex = Math.floor(momentIndex / chapter.moments.length);
      const closing = chapter.endings[closingIndex % chapter.endings.length];
      const paragraph = document.createElement('p');
      paragraph.textContent = `${opening} ${moment} ${closing}`;
      page.appendChild(paragraph);

      const pageNumberLabel = document.createElement('span');
      pageNumberLabel.className = 'book-page-number';
      pageNumberLabel.textContent = `Página ${pageNumber}`;
      page.appendChild(pageNumberLabel);
      fragment.appendChild(page);
    }
  });
  bookPages.appendChild(fragment);
}
