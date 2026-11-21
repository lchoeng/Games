'use strict';
// ================= CORE =================
const T = 32;
let VIEW_H = 288;
let VIEW_W = 512, SCALE = 1, DPR = 1;
const SAFE = { l: 0, r: 0, t: 0, b: 0 };
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, 2.5);
  const w = window.innerWidth, h = window.innerHeight;
  cv.width = Math.round(w * DPR); cv.height = Math.round(h * DPR);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  const aspect = w / Math.max(1, h);
  VIEW_H = aspect < 1.8 && aspect >= 1 ? Math.min(400, Math.round(520 / aspect)) : 288;
  SCALE = cv.height / VIEW_H;
  VIEW_W = Math.ceil(cv.width / SCALE);
  const s = getComputedStyle(document.getElementById('safe'));
  const k = DPR / SCALE;
  SAFE.l = (parseFloat(s.paddingLeft) || 0) * k; SAFE.r = (parseFloat(s.paddingRight) || 0) * k;
  SAFE.t = (parseFloat(s.paddingTop) || 0) * k; SAFE.b = (parseFloat(s.paddingBottom) || 0) * k;
  layoutButtons();
}

// ---------- utils ----------
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const sign = v => v < 0 ? -1 : 1;
function rng(seed) {
  let a = seed >>> 0;
  const f = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  f.int = (lo, hi) => lo + Math.floor(f() * (hi - lo + 1));
  f.pick = arr => arr[Math.floor(f() * arr.length)];
  f.chance = p => f() < p;
  return f;
}
const R = rng(Date.now() & 0xffffff);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

// ---------- sprites ----------
const IMG = {};
let imgsLoaded = 0, imgsTotal = 0;
for (const k in SPR) {
  imgsTotal++;
  const im = new Image();
  im.onload = () => imgsLoaded++;
  im.src = SPR[k].d;
  IMG[k] = { im, w: SPR[k].w, h: SPR[k].h };
}

// ---------- save ----------
const SAVE_KEY = 'linus-dino-devourer-v1';
function freshSave() {
  return { unlocked: 1, done: {}, golden: {}, eggs: 0, swallowed: 0, defeated: 0, powers: {}, coins: 0, score: 0,
    up: { hp: 0, flt: 0, inh: 0 }, lives: 5, bonus: {}, muted: false };
}
let SAVE = freshSave();
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s) SAVE = Object.assign(freshSave(), s); } catch (e) {}
function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) {} }

// ---------- input ----------
const keys = {};
const input = { left: 0, right: 0, down: 0, jump: 0, inhale: 0, special: 0 };
const prevIn = { ...input };
const pressed = { ...input };
const BTN = {};
function layoutButtons() {
  const H = VIEW_H, W = VIEW_W, L = SAFE.l + 8, Rr = SAFE.r + 8;
  const cssPerUnit = SCALE / DPR, u = clamp(1.35 / cssPerUnit, 0.55, 1.1);
  BTN.left = { x: L + 38 * u, y: H - 80 * u, r: 32 * u };
  BTN.right = { x: L + 116 * u, y: H - 80 * u, r: 32 * u };
  BTN.down = { x: L + 77 * u, y: H - 25 * u, r: 22 * u };
  BTN.jump = { x: W - Rr - 42 * u, y: H - 48 * u, r: 35 * u };
  BTN.inhale = { x: W - Rr - 122 * u, y: H - 40 * u, r: 31 * u };
  BTN.special = { x: W - Rr - 66 * u, y: H - 126 * u, r: 28 * u };
  BTN.u = u;
}
let touchPts = {};
let uiTaps = [];
function toLogical(cx, cy) { return { x: cx * DPR / SCALE, y: cy * DPR / SCALE }; }
function recomputeTouchButtons() {
  const held = { left: 0, right: 0, down: 0, jump: 0, inhale: 0, special: 0 };
  if (game.state === 'play') {
    for (const id in touchPts) {
      const p = touchPts[id];
      let best = null, bd = 1e9;
      for (const k in BTN) {
        const b = BTN[k]; if (k === 'u') continue; const d = Math.hypot(p.x - b.x, p.y - b.y);
        if (d < b.r * 1.45 && d / b.r < bd) { bd = d / b.r; best = k; }
      }
      if (best) held[best] = 1;
    }
  }
  touchHeld = held;
}
let touchHeld = { left: 0, right: 0, down: 0, jump: 0, inhale: 0, special: 0 };
function onTouch(e) {
  e.preventDefault();
  auInit();
  for (const t of e.changedTouches) {
    const p = toLogical(t.clientX, t.clientY);
    if (e.type === 'touchstart') { touchPts[t.identifier] = p; uiTaps.push(p); }
    else if (e.type === 'touchmove') touchPts[t.identifier] = p;
    else delete touchPts[t.identifier];
  }
  recomputeTouchButtons();
}
cv.addEventListener('touchstart', onTouch, { passive: false });
cv.addEventListener('touchmove', onTouch, { passive: false });
cv.addEventListener('touchend', onTouch, { passive: false });
cv.addEventListener('touchcancel', onTouch, { passive: false });
let mouseDown = false;
cv.addEventListener('mousedown', e => { auInit(); mouseDown = true; const p = toLogical(e.clientX, e.clientY); uiTaps.push(p); touchPts.m = p; recomputeTouchButtons(); });
window.addEventListener('mousemove', e => { if (mouseDown) { touchPts.m = toLogical(e.clientX, e.clientY); recomputeTouchButtons(); } });
window.addEventListener('mouseup', () => { mouseDown = false; delete touchPts.m; recomputeTouchButtons(); });
const KEYMAP = { ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', ArrowDown: 'down', KeyS: 'down',
  Space: 'jump', KeyZ: 'jump', ArrowUp: 'jump', KeyW: 'jump', KeyX: 'inhale', KeyJ: 'inhale', KeyC: 'special', KeyK: 'special' };
window.addEventListener('keydown', e => {
  auInit();
  if (KEYMAP[e.code]) { keys[KEYMAP[e.code]] = 1; e.preventDefault(); }
  if (e.code === 'Enter' || e.code === 'Space') uiTaps.push({ key: true });
  if (e.code === 'Escape' || e.code === 'KeyP') { if (game.state === 'play') game.state = 'pause'; else if (game.state === 'pause') game.state = 'play'; }
});
window.addEventListener('keyup', e => { if (KEYMAP[e.code]) keys[KEYMAP[e.code]] = 0; });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('dblclick', e => e.preventDefault());
function pollInput() {
  for (const k in input) {
    prevIn[k] = input[k];
    input[k] = (keys[k] || touchHeld[k]) ? 1 : 0;
    pressed[k] = input[k] && !prevIn[k] ? 1 : 0;
  }
}

// ---------- data ----------
const POW = {
  mosa: { name: 'MOSASAURUS', move: 'Water Blast + Super Swim', col: '#2f86e0', col2: '#9fd8ff', dark: '#174a86' },
  rex: { name: 'T-REX', move: 'Fire Breath  (▼+POWER = Bite)', col: '#e2462f', col2: '#ffcf4a', dark: '#7a1e12' },
  drex: { name: 'D-REX', move: 'Smash Charge  (▼+POWER in air = Stomp)', col: '#5d4a82', col2: '#c9b3ff', dark: '#2a1f40' },
  indo: { name: 'INDOMINUS REX', move: 'Claw Slash  (▼+POWER = Camouflage)', col: '#dcdcd2', col2: '#ff4f4f', dark: '#6b6b66' },
  theri: { name: 'THERIZINOSAURUS', move: 'Giant Claws + Claw Wave', col: '#4f9a3a', col2: '#d4f06a', dark: '#24501a' },
  sarco: { name: 'SARCOSUCHUS', move: 'Croc Chomp + Water Launch', col: '#7d7d3c', col2: '#e2da84', dark: '#3c3c18' },
};
const POW_ORDER = ['rex', 'theri', 'drex', 'mosa', 'sarco', 'indo'];

const EN = {
  compy: { img: 'compy', kind: 'theropod', name: 'Compy', w: 24, h: 26, hp: 1, speed: 48, beh: 'walk', col: '#7cc144', belly: '#e3f5a8', s: 0.5 },
  raptor: { img: 'raptor', kind: 'theropod', name: 'Raptor', w: 26, h: 36, hp: 2, speed: 60, beh: 'hop', col: '#c98a3a', belly: '#f3d9a0', s: 0.68, stripes: 1, feathers: 1 },
  ptero: { img: 'ptero', kind: 'ptero', name: 'Pteranodon', w: 40, h: 26, hp: 1, speed: 50, beh: 'fly', col: '#8b6bc7', belly: '#e0d0ff', s: 0.7, nograv: 1 },
  ankylo: { img: 'ankylo', kind: 'ankylo', name: 'Ankylosaurus', w: 46, h: 28, hp: 4, speed: 22, beh: 'walk', col: '#8a7a55', belly: '#d9cc9c', s: 0.75, heavy: 1 },
  dilo: { img: 'dilo', kind: 'theropod', name: 'Dilophosaurus', w: 26, h: 36, hp: 2, speed: 0, beh: 'shoot', col: '#e0b030', belly: '#fff0b0', s: 0.66, crest: 1, frill: 1 },
  fish: { img: 'fish', kind: 'fish', name: 'Ichthyosaur', w: 38, h: 20, hp: 1, speed: 55, beh: 'swim', col: '#4fb3c9', belly: '#d8f6ff', s: 0.7, nograv: 1 },
  mammoth: { img: 'mammoth', kind: 'mammoth', name: 'Baby Mammoth', w: 40, h: 40, hp: 3, speed: 30, beh: 'walk', col: '#8a5a3a', belly: '#c79a74', s: 0.75, heavy: 1 },
  rex: { kind: 'theropod', name: 'Mini T-Rex', w: 30, h: 38, hp: 2, speed: 42, beh: 'walk', col: '#7a5e44', belly: '#ffd0a0', s: 0.75, power: 'rex', bighead: 1 },
  drex: { kind: 'theropod', name: 'Mini D-Rex', w: 30, h: 44, hp: 3, speed: 40, beh: 'charge', col: '#8a5a32', belly: '#a998c9', s: 0.78, power: 'drex', spikes: 1, bighead: 1, mutant: 1 },
  indo: { kind: 'theropod', name: 'Mini Indominus', w: 32, h: 40, hp: 3, speed: 46, beh: 'walk', col: '#b8b4ac', belly: '#ffffff', s: 0.76, power: 'indo', spikes: 1, redeye: 1, camo: 1 },
  theri: { kind: 'theri', name: 'Mini Therizino', w: 26, h: 40, hp: 2, speed: 36, beh: 'walk', col: '#6a5040', belly: '#d8f0a0', s: 0.75, power: 'theri' },
  mosa: { kind: 'mosa', name: 'Mini Mosasaurus', w: 44, h: 30, hp: 2, speed: 60, beh: 'swim', col: '#5d7480', belly: '#bfe6ff', s: 0.62, power: 'mosa', nograv: 1 },
  sarco: { kind: 'sarco', name: 'Mini Sarcosuchus', w: 48, h: 26, hp: 3, speed: 40, beh: 'amphib', col: '#7a7044', belly: '#e2da84', s: 0.62, power: 'sarco' },
};

const WORLDS = [
  { name: 'JUNGLE', key: 'jungle', boss: 'rex', bossName: 'GIANT T-REX', weak: 'mosa',
    land: ['compy', 'compy', 'raptor', 'ptero', 'rex', 'rex', 'theri'], water: ['fish', 'mosa', 'mosa'],
    chunks: { flat: 4, gap: 3, plats: 2, swing: 2, faller: 2, quicksand: 2, crumble: 2, water: 2, stairs: 2, wall: 1, tunnel: 1, climb: 1, mover: 1 },
    pal: { top: '#62c23c', top2: '#3e9a2a', dirt: '#8a5a2e', dirt2: '#6e4522', plat: '#a7743d', plat2: '#7a5228', rock: '#9a9a8a', spike: 'thorn' },
    music: { seed: 11, root: 60, bpm: 132, scale: 'major', lead: 'square', prog: [0, 5, 3, 4] } },
  { name: 'FOREST', key: 'forest', boss: 'theri', bossName: 'GIANT THERIZINOSAURUS', weak: 'rex',
    land: ['compy', 'raptor', 'ankylo', 'ptero', 'theri', 'theri', 'rex', 'dilo'], water: ['fish', 'mosa'],
    chunks: { flat: 4, gap: 3, plats: 2, roller: 2, spikes: 2, tunnel: 2, bounce: 2, stairs: 2, crumble: 1, water: 1, wall: 1, climb: 1, mover: 1 },
    pal: { top: '#4fae5a', top2: '#2f7a3c', dirt: '#5e4632', dirt2: '#4a3626', plat: '#c0504d', plat2: '#f2e6d0', rock: '#8c8c8c', spike: 'thorn' },
    music: { seed: 23, root: 62, bpm: 120, scale: 'dorian', lead: 'triangle', prog: [0, 3, 6, 4] } },
  { name: 'DESERT', key: 'desert', boss: 'drex', bossName: 'GIANT D-REX', weak: 'mosa',
    land: ['ankylo', 'dilo', 'raptor', 'drex', 'drex', 'rex', 'compy'], water: ['fish', 'mosa'],
    chunks: { flat: 4, gap: 3, plats: 2, sandstorm: 2, quicksand: 2, faller: 2, crumble: 2, roller: 1, stairs: 2, wall: 2, tunnel: 1, climb: 1, mover: 1, water: 1 },
    pal: { top: '#f2cf7a', top2: '#d9a948', dirt: '#d39a52', dirt2: '#b97f3e', plat: '#c9a06a', plat2: '#9c7442', rock: '#b8986a', spike: 'cactus' },
    music: { seed: 37, root: 57, bpm: 124, scale: 'phrygian', lead: 'sawtooth', prog: [0, 1, 0, 6] } },
  { name: 'ARCTIC', key: 'arctic', boss: 'mosa', bossName: 'GIANT MOSASAURUS', weak: 'rex',
    land: ['mammoth', 'compy', 'ptero', 'drex', 'rex', 'mammoth', 'raptor'], water: ['mosa', 'mosa', 'fish'],
    chunks: { flat: 4, gap: 3, plats: 2, ice: 3, faller: 2, crumble: 2, water: 2, stairs: 2, wall: 1, tunnel: 1, climb: 1, mover: 1, roller: 1 },
    pal: { top: '#f4fbff', top2: '#cfe6f5', dirt: '#8fb6d6', dirt2: '#6f9cc0', plat: '#bfe6ff', plat2: '#8cc6ea', rock: '#a9b9c9', spike: 'icicle' },
    music: { seed: 41, root: 64, bpm: 112, scale: 'minor', lead: 'triangle', prog: [0, 5, 2, 6] } },
  { name: 'BEACH', key: 'beach', boss: 'sarco', bossName: 'ENORMOUS SARCOSUCHUS', weak: 'drex',
    land: ['compy', 'raptor', 'ptero', 'sarco', 'drex', 'dilo'], water: ['mosa', 'sarco', 'fish', 'sarco'],
    chunks: { flat: 3, gap: 3, plats: 2, water: 4, roller: 2, spikes: 2, crumble: 2, stairs: 2, wall: 1, tunnel: 1, climb: 1, mover: 1 },
    pal: { top: '#ffe7a6', top2: '#f0c978', dirt: '#e8b874', dirt2: '#d29c58', plat: '#9a7350', plat2: '#6e5034', rock: '#c7a98a', spike: 'coral' },
    music: { seed: 53, root: 65, bpm: 128, scale: 'mixolydian', lead: 'square', prog: [0, 6, 3, 0] } },
  { name: 'CITY', key: 'city', boss: 'indo', bossName: 'GIANT INDOMINUS REX', weak: 'theri',
    land: ['raptor', 'indo', 'indo', 'drex', 'rex', 'theri', 'ptero', 'dilo'], water: ['fish', 'mosa'],
    chunks: { flat: 3, gap: 3, plats: 2, cars: 3, crumble: 2, faller: 2, elevator: 2, spikes: 2, wreck: 2, stairs: 2, wall: 1, tunnel: 1, climb: 1 },
    pal: { top: '#9aa3ad', top2: '#6f7882', dirt: '#5a5f6a', dirt2: '#4a4e58', plat: '#e0a030', plat2: '#9a6a10', rock: '#8a8f99', spike: 'electric' },
    music: { seed: 67, root: 59, bpm: 140, scale: 'minor', lead: 'sawtooth', prog: [0, 6, 5, 4] } },
];
const BOSS_MUSIC = { seed: 99, root: 52, bpm: 156, scale: 'minor', lead: 'sawtooth', prog: [0, 0, 6, 5], boss: 1 };
const MAP_MUSIC = { seed: 7, root: 60, bpm: 108, scale: 'major', lead: 'triangle', prog: [0, 3, 4, 0] };
const BONUS_MUSIC = { seed: 77, root: 67, bpm: 150, scale: 'major', lead: 'square', prog: [0, 4, 5, 3] };
