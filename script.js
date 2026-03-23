// --- State ---

let simRunning = false;

const requirements = {
  Approach: 6,
  Hold: 1,
  Intercept: 1,
  Track: 1
};

// Track boxes so we can later map them to belt 2 / IPC logic
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

function buildLabel() {
  let parts = [];
  if (counts.Approach > 0) parts.push(`${counts.Approach}A`);
  if (counts.Hold > 0) parts.push(`${counts.Hold}H`);
  if (counts.Intercept > 0) parts.push(`${counts.Intercept}I`);
  if (counts.Track > 0) parts.push(`${counts.Track}T`);
  return parts.join(' ');
}

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

function createBox(label) {
  const box = document.createElement('div');
  box.classList.add('box');
  box.textContent = label;
  box.dataset.id = ++boxIdCounter;
  return box;
}

// For now, boxes ride belt 1 only. Later we’ll promote them to belt 2 when they age.
function logEventToBelt1(label) {
  const box = createBox(label);

  // Position box at the left edge of belt 1, visually near the chute
  box.style.left = '0px';
  belt1.appendChild(box);

  // Trigger movement only if sim is running
  if (simRunning) {
    requestAnimationFrame(() => {
      box.classList.add('moving');
    });
  }

  // Listen for animation end to later move to belt 2 or trigger IPC logic
  box.addEventListener('animationend', () => {
    moveBoxToBelt2(box);
  });
}

function moveBoxToBelt2(box) {
  // Remove from belt 1
  if (box.parentElement === belt1) {
    belt1.removeChild(box);
  }

  // Reset animation
  box.classList.remove('moving');
  box.style.transform = 'translateX(0)';
  box.style.left = '0px';

  belt2.appendChild(box);

  if (simRunning) {
    requestAnimationFrame(() => {
      box.classList.add('moving');
    });
  }

  box.addEventListener('animationend', () => {
    // When a box reaches the end of belt 2, it falls into the dumpster.
    // This is where IPC should be triggered if the requirement wasn’t satisfied in time.
    triggerIPC();
  }, { once: true });
}

function triggerIPC() {
  simRunning = false;
  ipcOverlay.classList.remove('hidden');
}

function resetSim() {
  simRunning = false;
  ipcOverlay.classList.add('hidden');

  // Reset requirements
  requirements.Approach = 6;
  requirements.Hold = 1;
  requirements.Intercept = 1;
  requirements.Track = 1;
  updateThoughtBubble();

  // Clear boxes
  document.querySelectorAll('.box').forEach(b => b.remove());

// --- Event listeners ---

beginButton.addEventListener('click', () => {
  simRunning = true;

  // Any existing boxes should start moving if they aren't already
  document.querySelectorAll('.box').forEach(box => {
    if (!box.classList.contains('moving')) {
      requestAnimationFrame(() => {
        box.classList.add('moving');
      });
    }
  });

  beginButton.disabled = true;
});

logButton.addEventListener('click', () => {
  const label = buildLabel();
  if (!label) return; // nothing selected

  logEventToBelt1(label);

  // Reset counters
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
