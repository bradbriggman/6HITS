console.log("JS loaded!");
  
/* ============================================================
   GLOBAL STATE
============================================================ */
let isPaused = false;          // Pause flag
let beltsMoving = false;       // Prevent double-start

const counters = {
  approach: 0,
  hold: 0,
  intercept: 0,
  track: 0
};


/* ============================================================
   PAUSE BUTTON — SINGLE CLEAN LISTENER
============================================================ */
document.getElementById("pauseBtn").addEventListener("click", () => {
  isPaused = !isPaused;

  // Update button text
  document.getElementById("pauseBtn").textContent = isPaused ? "Resume" : "Pause";

  // Freeze/unfreeze belts
  document.querySelectorAll(".belt-rollers").forEach(rollers => {
    rollers.style.animationPlayState = isPaused ? "paused" : "running";
  });
});


/* ============================================================
   COUNTER BUTTONS (+ / -)
============================================================ */
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


/* ============================================================
   BEGIN BUTTON — START BELT MOVEMENT
============================================================ */
document.getElementById("beginBtn").addEventListener("click", () => {
  if (beltsMoving) return;
  beltsMoving = true;

  document.querySelectorAll(".belt-rollers").forEach(rollers => {
    rollers.style.animation = "roll 0.3s linear infinite";
  });
});


/* ============================================================
   ROLLER ANIMATION KEYFRAMES
============================================================ */
const style = document.createElement("style");
style.innerHTML = `
@keyframes roll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-28px); }
}`;
document.head.appendChild(style);


/* ============================================================
   LOG BUTTON → CREATE BOX
============================================================ */
document.getElementById("logBtn").addEventListener("click", () => {
  const label = buildLabel();
  if (!label) return;

  createBox(label);
  resetCounters();
});


/* ============================================================
   BUILD LABEL FROM COUNTERS
============================================================ */
function buildLabel() {
  let parts = [];

  if (counters.approach > 0) parts.push(`${counters.approach}A`);
  if (counters.hold > 0) parts.push(`${counters.hold}H`);
  if (counters.intercept > 0) parts.push(`${counters.intercept}I`);
  if (counters.track > 0) parts.push(`${counters.track}T`);

  return parts.join(" ");
}


/* ============================================================
   RESET COUNTERS
============================================================ */
function resetCounters() {
  for (let key in counters) counters[key] = 0;

  document.getElementById("approachCount").textContent = 0;
  document.getElementById("holdCount").textContent = 0;
  document.getElementById("interceptCount").textContent = 0;
  document.getElementById("trackCount").textContent = 0;
}


/* ============================================================
   CREATE + MOVE BOX
============================================================ */
function createBox(label) {
  const box = document.createElement("div");
  box.className = "box";
  box.textContent = label;

  const layer = document.getElementById("boxesLayer");
  layer.appendChild(box);

  // Starting position on Belt 1
  box.style.left = "0px";
  box.style.top = "120px";

  const pixelsPerFrame = 0.27777; // 16.6666px/sec at 60fps

  const interval = setInterval(() => {
    if (isPaused) return;

    // Smooth movement at 16.6666px/sec
    let currentLeft = parseFloat(box.style.left) || 0;
    let newLeft = currentLeft + pixelsPerFrame;
    box.style.left = newLeft + "px";

    // Drop to Belt 2 when passing 6-month mark (300px)
    if (!box.hasDropped && newLeft >= 300) {
      box.style.top = "500px"; // adjust if needed
      box.hasDropped = true;
    }

  }, 16.67); // <-- THIS is the critical fix
}
