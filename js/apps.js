/* =====================
   GLOBAL STATE
===================== */
const MIN_DIM = 2;
const FIXED_ANGLE_DEG = 15;

let currentDielineData = null;
let panelsVisible = true;
let isCadMode = false;

// Transform
let scale = 1.0;
let offsetX = 0;
let offsetY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Canvas
const container = document.getElementById('canvasContainer');
const canvas = document.getElementById('dielineCanvas');
const ctx = canvas.getContext('2d');

/* =====================
   UI FUNCTIONS
===================== */
function toggleTheme() {
  isCadMode = !isCadMode;
  document.body.className = isCadMode ? 'cad-mode' : 'light-mode';
  drawDieline();
}

function toggleInterface(force) {
  panelsVisible = force ?? !panelsVisible;
  document
    .querySelectorAll('.floating-panel')
    .forEach(p => p.classList.toggle('hidden-panel', !panelsVisible));
}

function hideInterfaceOnClick() {
  if (panelsVisible) toggleInterface(false);
}

function resetView() {
  scale = 1;
  offsetX = 0;
  offsetY = 0;
  drawDieline();
}

function handleZoom(factor) {
  scale *= factor;
  drawDieline();
}

/* =====================
   CANVAS SIZE
===================== */
function resizeCanvas() {
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  drawDieline();
}

/* =====================
   MAIN DRAW (ASYNC)
===================== */
async function drawDieline() {
  const statusMessage = document.getElementById('statusMessage');
  const summaryDiv = document.getElementById('summaryText');

  const P = parseFloat(txtP.value);
  const L = parseFloat(txtL.value);
  const T = parseFloat(txtT.value);
  const F = parseFloat(txtF.value);
  const Pl = parseFloat(txtPl.value);
  const coak = parseFloat(txtCoak.value);

  if ([P, L, T, F, Pl].some(v => isNaN(v) || v < MIN_DIM)) {
    statusMessage.textContent = "Masukkan dimensi yang valid";
    statusMessage.style.opacity = "1";
    return;
  }

  // === HITUNGAN DI BACKEND (CLOUDFLARE) ===
  const res = await fetch("https://aged-snow-1470.farid-pdx.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ P, L, T, F, Pl, coak })
  });

  const d = await res.json();
  currentDielineData = d;

  const {
    H_FLAP,
    totalWidthMM,
    totalHeightMM,
    rects,
    flapLem,
    R2_X,
    R3_X,
    R4_X,
    R5_X,
    END_X
  } = d;

  // === SUMMARY ===
  summaryDiv.innerHTML = `
    <div class="flex justify-between"><span>Lebar Sheet</span><b>${totalWidthMM.toFixed(1)} mm</b></div>
    <div class="flex justify-between"><span>Tinggi Sheet</span><b>${totalHeightMM.toFixed(1)} mm</b></div>
    <div class="flex justify-between"><span>Flap</span><b>${H_FLAP.toFixed(1)} mm</b></div>
  `;

  // === CANVAS TRANSFORM ===
  const padding = 60;
  const fitScale = Math.min(
    (canvas.width - padding * 2) / totalWidthMM,
    (canvas.height - padding * 2) / totalHeightMM
  );
  const finalScale = fitScale * scale;

  const startXpx = offsetX + (canvas.width - totalWidthMM * finalScale) / 2;
  const startYpx = offsetY + (canvas.height - totalHeightMM * finalScale) / 2;

  const mm = v => v * finalScale;
  const Y = y => startYpx + mm(totalHeightMM - y);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // === COLORS ===
  const cutColor = isCadMode ? '#22d3ee' : '#1E40AF';
  const creaseColor = isCadMode ? '#fbbf24' : '#D97706';

  // === FLAP LEM ===
  ctx.fillStyle = flapLem.color;
  ctx.strokeStyle = cutColor;
  ctx.beginPath();
  flapLem.points.forEach((p, i) => {
    const x = startXpx + mm(p.x);
    const y = Y(p.y);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // === PANELS ===
  rects.forEach(r => {
    ctx.fillStyle = r.color;
    ctx.strokeStyle = cutColor;
    ctx.beginPath();
    ctx.rect(
      startXpx + mm(r.x),
      Y(r.y + r.h),
      mm(r.w),
      mm(r.h)
    );
    ctx.fill();
    ctx.stroke();
  });

  // === CREASE LINES ===
  ctx.strokeStyle = creaseColor;
  ctx.setLineDash([5, 5]);

  [R2_X, R3_X, R4_X, R5_X].forEach(x => {
    ctx.beginPath();
    ctx.moveTo(startXpx + mm(x), Y(0));
    ctx.lineTo(startXpx + mm(x), Y(totalHeightMM));
    ctx.stroke();
  });

  [H_FLAP, H_FLAP + T].forEach(y => {
    ctx.beginPath();
    ctx.moveTo(startXpx + mm(0), Y(y));
    ctx.lineTo(startXpx + mm(END_X), Y(y));
    ctx.stroke();
  });

  ctx.setLineDash([]);

  statusMessage.textContent = "Dieline Updated";
  statusMessage.style.opacity = "1";
  setTimeout(() => statusMessage.style.opacity = "0", 1500);
}

/* =====================
   EXPORT
===================== */
function exportToSVG() {
  if (!currentDielineData) return;
  alert("Export SVG OK (logic SVG tetap milik lu)");
}

/* =====================
   INTERACTION
===================== */
container.addEventListener('mousedown', e => {
  isDragging = true;
  startX = e.clientX - offsetX;
  startY = e.clientY - offsetY;
});

window.addEventListener('mousemove', e => {
  if (!isDragging) return;
  offsetX = e.clientX - startX;
  offsetY = e.clientY - startY;
  drawDieline();
});

window.addEventListener('mouseup', () => isDragging = false);

container.addEventListener('wheel', e => {
  e.preventDefault();
  scale *= e.deltaY > 0 ? 0.9 : 1.1;
  drawDieline();
}, { passive: false });

/* =====================
   EXPOSE TO HTML
===================== */
window.toggleTheme = toggleTheme;
window.toggleInterface = toggleInterface;
window.hideInterfaceOnClick = hideInterfaceOnClick;
window.resetView = resetView;
window.handleZoom = handleZoom;
window.exportToSVG = exportToSVG;

/* =====================
   INIT
===================== */
window.onload = resizeCanvas;
window.onresize = resizeCanvas;
