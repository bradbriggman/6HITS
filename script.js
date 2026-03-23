// --- State ---
let isPaused = false;

let simRunning = false;

let pilotWasCurrentAtLog = false;

const requirements = {
  Approach: 6,
  Hold: 1,
  Intercept: 1,
  Track: 1
};

let boxIdCounter = 0;

const counts = {
  Approach: 0,
  Hold: 0,
  Intercept: 0,
  Track: 0
};

// --- DOM references ---
const beginButton = document.getElementById('beginButton');
const logButton = document.getElementById('logButton');
const belt1 = document.getElementById('belt1');
const belt2 = document.getElementById('belt2');
const thoughtText = document.getElementById('thoughtText');
const ipcOverlay = document.getElementById('ipcOverlay');
const resetButton = document.getElementById('resetButton');

function updatePauseState() {
  logButton.disabled = isPaused;
}

// --- Build one label per task (one box per event) ---
function buildBoxes() {
  const boxes = [];

  for (let i = 0; i < counts.Approach; i++) boxes.push('A');
  for (let i = 0; i < counts.Hold; i++) boxes.push('H');
  for (let i = 0; i < counts.Intercept; i++) boxes.push('I');
  for (let i = 0; i < counts.Track; i++) boxes.push('T');

  return boxes;
}

const pauseBtn = document.getElementById('pauseBtn');

pauseBtn.addEventListener('click', () => {
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";

  // Freeze or unfreeze all moving boxes
  document.querySelectorAll('.box').forEach(box => {
    box.style.animationPlayState = isPaused ? "paused" : "running";
  });

  // Disable only the Log button
  logButton.disabled = isPaused;
});

// Disable only the Log button when paused
logButton.disabled = isPaused;

// --- Plus / minus buttons ---
document.querySelectorAll('.plus').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    counts[type]++;
    document.getElementById(`count-${type}`).textContent = counts[type];
  });
});

document.querySelectorAll('.minus').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    if (counts[type] > 0) {
      counts[type]--;
      document.getElementById(`count-${type}`).textContent = counts[type];
    }
  });
});

// --- Helpers ---
function updateThoughtBubble() {
  const parts = [];

  if (requirements.Approach > 0) {
    parts.push(`${requirements.Approach} approach${requirements.Approach > 1 ? 'es' : ''}`);
  }
  if (requirements.Hold > 0) {
    parts.push('a hold');
  }
  if (requirements.Intercept > 0) {
    parts.push('an intercept');
  }
  if (requirements.Track > 0) {
    parts.push('to track a navigation point');
  }

  if (parts.length === 0) {
    thoughtText.textContent = 'I am fully current.';
  } else {
    thoughtText.textContent = `I need ${parts.join(', ')} in order to get current.`;
  }
}

// --- Create a labeled box ---
function createBox(label) {
  const box = document.createElement('div');
  box.classList.add('box');
  box.dataset.id = ++boxIdCounter;
  box.dataset.label = label;   // IMPORTANT FIX

  // Internal 3-row layout
  const labelContainer = document.createElement('div');
  labelContainer.classList.add('box-labels');

  const top = document.createElement('div');
  top.classList.add('box-row');
  top.textContent = label === 'A' ? 'Approach' : '';

  const middle = document.createElement('div');
  middle.classList.add('box-row');
  middle.textContent = label === 'H' ? 'Hold' : '';

  const bottom = document.createElement('div');
  bottom.classList.add('box-row', 'bottom-row');

  if (label === 'I') {
    const iTag = document.createElement('span');
    iTag.textContent = 'Intercept';
    bottom.appendChild(iTag);
  }

  if (label === 'T') {
    const tTag = document.createElement('span');
    tTag.textContent = 'Track';
    bottom.appendChild(tTag);
  }

  labelContainer.appendChild(top);
  labelContainer.appendChild(middle);
  labelContainer.appendChild(bottom);

  box.appendChild(labelContainer);
  return box;
}

// --- Belt 1 logging ---
function logEventToBelt1(label) {
  const box = createBox(label);

  box.style.left = '0px';
  belt1.appendChild(box);

  if (simRunning && !isPaused) {
  requestAnimationFrame(() => box.classList.add('moving'));
}

  box.addEventListener('animationend', () => {
    moveBoxToBelt2(box);
  }, { once: true });
}

// --- Move box to Belt 2 ---
function moveBoxToBelt2(box) {
  if (box.parentElement === belt1) {
    belt1.removeChild(box);
  }

  const label = box.dataset.label;

  // Only increment requirements if the pilot was NOT current at log time
  if (!pilotWasCurrentAtLog) {
    if (label === 'A') requirements.Approach++;
    if (label === 'H') requirements.Hold++;
    if (label === 'I') requirements.Intercept++;
    if (label === 'T') requirements.Track++;
  }

  updateThoughtBubble();

  box.classList.remove('moving');
  box.style.transform = 'translateX(0)';
  box.style.left = '0px';

  belt2.appendChild(box);

  if (simRunning && !isPaused) {
    requestAnimationFrame(() => box.classList.add('moving'));
  }

  box.addEventListener('animationend', () => {
    if (!isPilotCurrent()) triggerIPC();
  }, { once: true });
}

// --- IPC ---
function triggerIPC() {
  simRunning = false;
  ipcOverlay.classList.remove('hidden');
}

// --- Reset ---
function resetSim() {
  simRunning = false;
  ipcOverlay.classList.add('hidden');

  requirements.Approach = 6;
  requirements.Hold = 1;
  requirements.Intercept = 1;
  requirements.Track = 1;

  updateThoughtBubble();

  document.querySelectorAll('.box').forEach(b => b.remove());

  for (let key in counts) {
    counts[key] = 0;
    document.getElementById(`count-${key}`).textContent = 0;
  }
}

// --- Pilot current check ---
function isPilotCurrent() {
  return (
    requirements.Approach === 0 &&
    requirements.Hold === 0 &&
    requirements.Intercept === 0 &&
    requirements.Track === 0
  );
}

// --- Event listeners ---
beginButton.addEventListener('click', () => {
  simRunning = true;

  document.querySelectorAll('.box').forEach(box => {
    if (!box.classList.contains('moving')) {
      requestAnimationFrame(() => box.classList.add('moving'));
    }
  });

  beginButton.disabled = true;
});

logButton.addEventListener('click', () => {
  const labels = buildBoxes();
  if (labels.length === 0) return;

  // Capture whether the pilot was current BEFORE logging
  pilotWasCurrentAtLog = isPilotCurrent();

  if (counts.Approach > 0) {
    requirements.Approach = Math.max(0, requirements.Approach - counts.Approach);
  }
  if (counts.Hold > 0) {
    requirements.Hold = Math.max(0, requirements.Hold - counts.Hold);
  }
  if (counts.Intercept > 0) {
    requirements.Intercept = Math.max(0, requirements.Intercept - counts.Intercept);
  }
  if (counts.Track > 0) {
    requirements.Track = Math.max(0, requirements.Track - counts.Track);
  }

  updateThoughtBubble();

  labels.forEach(label => logEventToBelt1(label));

  for (let key in counts) {
    counts[key] = 0;
    document.getElementById(`count-${key}`).textContent = 0;
  }
});

resetButton.addEventListener('click', () => {
  resetSim();
  beginButton.disabled = false;
});

// Initial text
updateThoughtBubble();
