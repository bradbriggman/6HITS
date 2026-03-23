console.log("JS loaded!");

let isPaused = false;
let beltsMoving = false;

const counters = {
  approach: 0,
  hold: 0,
  intercept: 0,
  track: 0
};

document.getElementById("pauseBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").textContent = isPaused ? "Resume" : "Pause";

  document.querySelectorAll(".belt-rollers").forEach(rollers => {
    rollers.style.animationPlayState = isPaused ? "paused" : "running";
  });
});

document.querySelectorAll(".plus").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    counters[type]++;
    document.getElementById(type + "Count").textContent = counters[type];
  });
});

document.querySelectorAll(".minus").forEach(btn => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    if (counters[type] > 0) counters[type]--;
    document.getElementById(type + "Count").textContent = counters[type];
  });
});

document.getElementById("beginBtn").addEventListener("click", () => {
  if (beltsMoving) return;
  beltsMoving = true;

  document.querySelectorAll(".belt-rollers").forEach(rollers => {
    rollers.style.animation = "roll 0.3s linear infinite";
  });
});

const style = document.createElement("style");
style.innerHTML = `
@keyframes roll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-28px); }
}`;
document.head.appendChild(style);

document.getElementById("logBtn").addEventListener("click", () => {
  const label = buildLabel();
  if (!label) return;

  createBox(label);
  resetCounters();
});

function buildLabel() {
  let parts = [];

  if (counters.approach > 0) parts.push(`${counters.approach}A`);
  if (counters.hold > 0) parts.push(`${counters.hold}H`);
  if (counters.intercept > 0) parts.push(`${counters.intercept}I`);
  if (counters.track > 0) parts.push(`${counters.track}T`);

  return parts.join(" ");
}

function resetCounters() {
  for (let key in counters) counters[key] = 0;

  document.getElementById("approachCount").textContent = 0;
  document.getElementById("holdCount").textContent = 0;
  document.getElementById("interceptCount").textContent = 0;
  document.getElementById("trackCount").textContent = 0;
}

function createBox(label) {
  const box = document.createElement("div");
  box.className = "box";
  box.textContent = label;

  const layer = document.getElementById("boxesLayer");
  layer.appendChild(box);

  box.style.left = "0px";
  box.style.top = "0px"; // now aligned by CSS container

  const pixelsPerFrame = 0.27777;

  const interval = setInterval(() => {
    if (isPaused) return;

    let currentLeft = parseFloat(box.style.left) || 0;
    let newLeft = currentLeft + pixelsPerFrame;
    box.style.left = newLeft + "px";

    if (!box.hasDropped && newLeft >= 300) {
      box.style.top = "240px"; 
      box.hasDropped = true;
    }

    if (newLeft >= 580) {
      clearInterval(interval);
      box.remove();
    }

  }, 16.67);
}
