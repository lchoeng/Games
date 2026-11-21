// ================= LEVEL GENERATION =================
const TL = { E: 0, G: 1, P: 2, RK: 3, BU: 4, ME: 5, VI: 6, SP: 7, WA: 8, QS: 9, IC: 10, CR: 11, BO: 12 };
const SOLID = new Uint8Array(16); [1, 3, 4, 5, 6, 10, 11, 12].forEach(i => SOLID[i] = 1);
const COPY_TYPES = ['rex', 'drex', 'indo', 'theri', 'mosa', 'sarco'];

function newLevel(w, h) { return { w, h, t: new Uint8Array(w * h), spawns: [] }; }

function genStage(wi, si) {
  const W = WORLDS[wi], r = rng(1000 + wi * 131 + si * 17);
  const len = 120 + si * 20 + wi * 8;
  const L = newLevel(len + 90, 18); L.wi = wi; L.si = si; L.kind = 'stage';
  const h = L.h;
  const g = { x: 0, gy: h - 4, d: wi * 0.8 + si * 0.45 };
  const set = (x, y, v) => { if (x >= 0 && x < L.w && y >= 0 && y < h) L.t[y * L.w + x] = v; };
  const get = (x, y) => (x >= 0 && x < L.w && y >= 0 && y < h) ? L.t[y * L.w + x] : 0;
  const col = (x, gy, v = TL.G) => { for (let y = gy; y < h; y++) set(x, y, v); };
  const sp = (k, tx, ty, o = {}) => L.spawns.push(Object.assign({ k, x: tx * T, y: ty * T }, o));
  const flat = n => { for (let i = 0; i < n; i++) col(g.x + i, g.gy); g.x += n; };
  const coinRow = (tx, ty, n) => { for (let i = 0; i < n; i++) sp('coin', tx + i + 0.5, ty + 0.5); };
  const coinArc = (tx0, n, ty, hh) => { for (let i = 0; i < n; i++) { const f = n > 1 ? i / (n - 1) : 0.5; sp('coin', tx0 + i + 0.5, ty + 0.5 - Math.sin(f * Math.PI) * hh); } };
  let sinceCopy = 99;
  const landPool = W.land, copyPool = W.land.filter(e => EN[e].power);
  const pickLand = () => { if (sinceCopy > 22 && copyPool.length) { sinceCopy = 0; return r.pick(copyPool); } const e = r.pick(landPool); if (EN[e].power) sinceCopy = 0; return e; };
  const enemy = (type, tx, ty) => sp('enemy', tx + 0.5, ty, { e: type });
  const groundEnemies = (x0, n, count) => { for (let i = 0; i < count; i++) { const e = pickLand(); const tx = x0 + Math.floor((i + 0.5) * n / count); if (EN[e].beh === 'fly') enemy(e, tx, g.gy - 3 - r.int(0, 1)); else if (EN[e].kind === 'mosa' || EN[e].kind === 'fish') enemy('compy', tx, g.gy); else enemy(e, tx, g.gy); } };
  const stepTo = target => { while (g.gy !== target) { g.gy += g.gy > target ? -1 : 1; flat(2); } };
  const ensureHigh = maxGy => { if (g.gy > maxGy) stepTo(maxGy); };
  const ensureLow = minGy => { if (g.gy < minGy) stepTo(minGy); };

  const C = {};
  C.flat = () => { const n = r.int(8, 13); const x0 = g.x; flat(n); const cnt = 1 + (r() < 0.25 + g.d * 0.07 ? 1 : 0); groundEnemies(x0 + 2, n - 3, cnt);
    if (r() < 0.5) coinRow(x0 + 3, g.gy - 2, r.int(3, 5));
    if (r() < 0.25) { const px = x0 + r.int(2, n - 4); set(px, g.gy - 4, TL.P); set(px + 1, g.gy - 4, TL.P); sp(r() < 0.35 ? 'egg' : 'star', px + 1, g.gy - 4.6); } };
  C.stairs = () => { const up = g.gy > 9 ? (g.gy < h - 4 ? r() < 0.5 : true) : false; const n = r.int(1, 3); for (let i = 0; i < n; i++) { g.gy += up ? -1 : 1; g.gy = clamp(g.gy, 7, h - 3); flat(r.int(2, 3)); } if (r() < 0.5) enemy(pickLand(), g.x - 1, g.gy); };
  C.gap = () => { flat(2); const wp = clamp(2 + Math.floor(r() * (1.5 + g.d * 0.35)), 2, 5); const x0 = g.x; coinArc(x0, wp, g.gy - 2, 2);
    if (wp >= 5) { set(x0 + 2, g.gy - 1, TL.P); set(x0 + 3, g.gy - 1, TL.P); }
    g.x += wp; if (r() < 0.4) g.gy = clamp(g.gy + r.pick([-1, 1]), 7, h - 3); flat(3); };
  C.plats = () => { flat(2); const n = r.int(3, 4); const x0 = g.x; let px = x0;
    for (let i = 0; i < n; i++) { const py = g.gy - r.int(1, 3); set(px + 1, py, TL.P); set(px + 2, py, TL.P); sp('coin', px + 2, py - 0.6); px += r.int(3, 4); }
    if (r() < 0.5) enemy('ptero', x0 + 4, g.gy - 5); g.x = px + 1; flat(3); };
  C.mover = () => { flat(2); const wp = r.int(8, 11); sp('mover', g.x + 0.2, g.gy - 0.3, { dx: (wp - 3.4) * T, dy: 0, w: 3, spd: 0.5 }); coinRow(g.x + 3, g.gy - 2, wp - 5); g.x += wp; flat(3); };
  C.elevator = () => { if (g.gy - 5 < 6) { C.stairs(); return; } flat(2); const rise = r.int(4, 5); sp('mover', g.x, g.gy - 0.3, { dx: 0, dy: -rise * T - 0.4 * T, w: 3, spd: 0.45, elev: 1 }); col(g.x, g.gy); col(g.x + 1, g.gy); col(g.x + 2, g.gy); g.x += 3; g.gy -= rise; flat(4); };
  C.climb = () => { if (g.gy < 11) { stepTo(h - 4); return; } flat(2); const rise = r.int(4, 6); const x0 = g.x; let steps = Math.ceil(rise / 2);
    for (let i = 0; i < steps + 1; i++) col(x0 + i * 3, g.gy), col(x0 + i * 3 + 1, g.gy), col(x0 + i * 3 + 2, g.gy);
    for (let i = 0; i < steps; i++) { const py = g.gy - 2 * (i + 1); set(x0 + 1 + i * 3, py, TL.P); set(x0 + 2 + i * 3, py, TL.P); sp('coin', x0 + 2 + i * 3, py - 0.6); }
    g.x = x0 + steps * 3 + 1; g.gy = g.gy - steps * 2 + 1; g.gy = clamp(g.gy, 6, h - 3); flat(4); if (r() < 0.5) sp('egg', g.x - 2, g.gy - 0.6); };
  C.swing = () => { flat(2); const wp = 7; sp('pend', g.x + 3.5, g.gy - 7, { len: 5 * T, amp: 0.75, ride: 1 }); sp('coin', g.x + 3.5, g.gy - 3); g.x += wp; flat(3); };
  C.wreck = () => { const x0 = g.x; flat(11); sp('pend', x0 + 5.5, g.gy - 8, { len: 6.6 * T, amp: 1.0, ride: 0 }); enemy(pickLand(), x0 + 9, g.gy); };
  C.faller = () => { const x0 = g.x; flat(12); const n = r.int(2, 3); for (let i = 0; i < n; i++) sp('faller', x0 + 2 + i * 4 + r(), g.gy - 6.5); coinRow(x0 + 3, g.gy - 1, 5); };
  C.roller = () => { const x0 = g.x; flat(15); sp('rollgen', x0 + 15, g.gy, { x0: x0 * T }); coinArc(x0 + 4, 4, g.gy - 2, 1.5); };
  C.cars = () => { const x0 = g.x; flat(18); sp('cargen', x0 + 18, g.gy, { x0: x0 * T }); groundEnemies(x0 + 4, 10, 1); };
  C.quicksand = () => { flat(2); const wq = r.int(4, 6); for (let i = 0; i < wq; i++) { col(g.x + i, g.gy, TL.G); set(g.x + i, g.gy, TL.QS); set(g.x + i, g.gy + 1, TL.QS); } coinArc(g.x, wq, g.gy - 2, 2); g.x += wq; flat(3); };
  C.spikes = () => { flat(2); const ws = r.int(3, 5); for (let i = 0; i < ws; i++) { col(g.x + i, g.gy); set(g.x + i, g.gy - 1, TL.SP); } if (ws >= 4) { set(g.x + 1, g.gy - 4, TL.P); set(g.x + 2, g.gy - 4, TL.P); } coinArc(g.x, ws, g.gy - 3, 1.5); g.x += ws; flat(3); };
  C.crumble = () => { flat(2); const wp = r.int(5, 7); for (let i = 0; i < wp; i++) set(g.x + i, g.gy, TL.CR); coinRow(g.x + 1, g.gy - 1.5, wp - 2); g.x += wp; flat(3); };
  C.water = () => { ensureHigh(h - 6); flat(2); const ww = r.int(10, 15), x0 = g.x;
    col(x0, g.gy); for (let i = 1; i < ww - 1; i++) { col(x0 + i, g.gy); for (let k = 0; k < 4; k++) set(x0 + i, g.gy + k, TL.WA); } col(x0 + ww - 1, g.gy);
    const nE = 1 + (r() < 0.5 + g.d * 0.05 ? 1 : 0); for (let i = 0; i < nE; i++) enemy(r.pick(W.water), x0 + 3 + i * 5, g.gy + 2.5);
    coinRow(x0 + 2, g.gy + 2, ww - 4); if (r() < 0.4) sp('star', x0 + ww - 3, g.gy + 3.2);
    if (W.key === 'arctic' || r() < 0.3) { set(x0 + 4, g.gy - 1, TL.P); set(x0 + 5, g.gy - 1, TL.P); set(x0 + ww - 6, g.gy - 1, TL.P); set(x0 + ww - 5, g.gy - 1, TL.P); }
    if (W.key === 'beach') sp('zone', x0 + 1, g.gy, { w: (ww - 2) * T, h: 4 * T, kind: 'current', fx: r.pick([-40, 40]) });
    g.x += ww; flat(2); };
  C.ice = () => { const x0 = g.x; flat(12); for (let i = 0; i < 12; i++) set(x0 + i, g.gy, TL.IC); groundEnemies(x0 + 3, 8, 1); coinRow(x0 + 2, g.gy - 2, 6); };
  C.sandstorm = () => { const x0 = g.x; flat(16); sp('zone', x0, 0, { w: 16 * T, h: h * T, kind: 'wind', fx: -70 }); groundEnemies(x0 + 3, 12, 2); coinRow(x0 + 4, g.gy - 2, 6); };
  C.bounce = () => { if (g.gy - 5 < 6) { C.stairs(); return; } flat(3); set(g.x - 1, g.gy, TL.BO); const ng = g.gy - 5; g.gy = ng; flat(5); sp('coin', g.x - 3, g.gy - 1); };
  C.wall = () => { const x0 = g.x; flat(8); enemy(pickLand(), x0 + 2, g.gy); for (let y = g.gy - 4; y < g.gy; y++) set(x0 + 5, y, TL.RK); coinRow(x0 + 6, g.gy - 1, 2); };
  C.tunnel = () => { if (g.gy < 7) stepTo(10); const x0 = g.x; flat(10); for (let i = 3; i < 7; i++) for (let y = g.gy - 5; y <= g.gy - 2; y++) set(x0 + i, y, TL.G); coinRow(x0 + 3, g.gy - 1, 4); };

  const secretVault = () => {
    const opts = []; if (copyPool.includes('rex')) opts.push(['rex', TL.BU]); if (copyPool.includes('drex')) opts.push(['drex', TL.ME]); if (copyPool.includes('theri')) opts.push(['theri', TL.VI]);
    if (!opts.length) opts.push(['rex', TL.BU]);
    const [mini, bt] = opts[(wi + si) % opts.length];
    ensureLow(10); const x0 = g.x; flat(14);
    enemy(mini, x0 + 1, g.gy);
    col(x0 + 3, g.gy - 2); // step
    for (let i = 4; i <= 10; i++) set(x0 + i, g.gy - 4, TL.G);
    for (let y = g.gy - 3; y < g.gy; y++) { set(x0 + 4, y, bt); set(x0 + 10, y, TL.G); }
    sp('golden', x0 + 8, g.gy - 0.05); coinRow(x0 + 5, g.gy - 1.5, 3); sp('sign', x0 + 1.5, g.gy, { text: bt === TL.BU ? 'Burn the crates with T-REX fire!' : bt === TL.ME ? 'Smash steel with a D-REX charge!' : 'Slice vines with THERIZINO claws!' });
  };
  const secretCave = () => {
    ensureHigh(h - 8); const x0 = g.x; flat(18);
    for (let x = x0 + 2; x <= x0 + 15; x++) for (let y = g.gy + 2; y <= h - 2; y++) set(x, y, TL.E);
    for (let y = g.gy; y < g.gy + 2; y++) { set(x0 + 3, y, TL.E); set(x0 + 4, y, TL.E); set(x0 + 14, y, TL.E); set(x0 + 15, y, TL.E); }
    set(x0 + 14, h - 1, TL.BO); set(x0 + 15, h - 1, TL.BO);
    coinRow(x0 + 5, h - 2.5, 7); sp('golden', x0 + 12, h - 1.05); sp('egg', x0 + 6, h - 1.6);
    sp('coin', x0 + 3.5, g.gy - 1); sp('coin', x0 + 4.5, g.gy - 1);
  };
  const door = () => { const x0 = g.x; flat(6); sp('door', x0 + 3, g.gy, { to: 'bonus' }); sp('sign', x0 + 1, g.gy, { text: 'A secret door! Stand in front and press ▼' }); };
  const checkpoint = () => { const x0 = g.x; flat(4); sp('checkpoint', x0 + 2, g.gy); };

  // ---- build ----
  flat(10);
  L.start = { x: 3 * T, y: g.gy * T };
  if (wi === 0 && si === 0) {
    sp('sign', 6, g.gy, { text: 'Hold INHALE to suck up dinosaurs!' }); enemy('compy', 9, g.gy);
    let x0 = g.x; flat(12); sp('sign', x0 + 1, g.gy, { text: 'Tap INHALE to spit a star, or POWER to swallow & copy powers!' }); enemy('rex', x0 + 8, g.gy);
    x0 = g.x; flat(6); sp('sign', x0 + 2, g.gy, { text: 'Tap JUMP twice to double jump!' }); g.x += 3; flat(5);
    x0 = g.x; sp('sign', x0 + 1, g.gy, { text: 'Keep holding JUMP in the air to float!' }); flat(3); g.x += 5; coinArc(g.x - 5, 5, g.gy - 3, 1); flat(5);
    x0 = g.x; sp('sign', x0 + 1, g.gy, { text: 'Hold ▼ to crawl through small spaces' }); C.tunnel();
    x0 = g.x; sp('sign', x0 + 1, g.gy, { text: 'Break cracked rocks with POWER, a slide or a spit star!' }); C.wall();
  }
  const chunks = W.chunks;
  const names = Object.keys(chunks), total = names.reduce((a, k) => a + chunks[k], 0);
  let cp = 0, didSecret = false, didDoor = !(si === 1 || si === 3), last = '';
  const secretKind = (si % 2 === 0) ? 'vault' : 'cave';
  while (g.x < len - 24) {
    if (cp < 2 && g.x > len * (cp + 1) / 3) { checkpoint(); cp++; continue; }
    if (!didSecret && g.x > len * 0.45) { didSecret = true; secretKind === 'vault' ? secretVault() : secretCave(); continue; }
    if (!didDoor && g.x > len * 0.7) { didDoor = true; door(); continue; }
    let pick = r() * total, name = names[0];
    for (const k of names) { pick -= chunks[k]; if (pick <= 0) { name = k; break; } }
    if (name === last && name !== 'flat') name = 'flat';
    last = name;
    C[name]();
    sinceCopy += 6;
  }
  stepTo(clamp(g.gy, 9, h - 4));
  const gx = g.x; flat(16);
  sp('goal', gx + 10, g.gy);
  L.goalX = (gx + 10) * T;
  const W2 = g.x, nt = new Uint8Array(W2 * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < W2; x++) nt[y * W2 + x] = L.t[y * L.w + x];
  L.t = nt; L.w = W2;
  return L;
}

function genBoss(wi) {
  const W = WORLDS[wi], L = newLevel(26, 14); L.wi = wi; L.si = 4; L.kind = 'boss';
  const h = L.h, gy = h - 3;
  const set = (x, y, v) => { L.t[y * L.w + x] = v; };
  for (let x = 0; x < L.w; x++) for (let y = gy; y < h; y++) set(x, y, W.key === 'arctic' ? TL.IC : TL.G);
  for (let y = 0; y < h; y++) { set(0, y, TL.G); set(L.w - 1, y, TL.G); }
  for (const x of [3, 4, 5, 20, 21, 22]) set(x, gy - 4, TL.P);
  for (const x of [11, 12, 13, 14]) set(x, gy - 6, TL.P);
  if (W.key === 'arctic' || W.key === 'beach') for (let x = 9; x <= 16; x++) { set(x, gy, TL.WA); set(x, gy + 1, TL.WA); }
  L.start = { x: 3 * T, y: gy * T };
  L.spawns.push({ k: 'boss', x: 19 * T, y: gy * T, b: W.boss });
  L.spawns.push({ k: 'heart', x: 12.5 * T, y: (gy - 6.6) * T });
  return L;
}

function genBonus(wi) {
  const L = newLevel(44, 12); L.wi = wi; L.si = 5; L.kind = 'bonus';
  const h = L.h, gy = h - 3, r = rng(5000 + wi);
  const set = (x, y, v) => { L.t[y * L.w + x] = v; };
  for (let x = 0; x < L.w; x++) for (let y = gy; y < h; y++) set(x, y, TL.G);
  for (let y = 0; y < h; y++) set(0, y, TL.G);
  for (let i = 0; i < 6; i++) { const px = 4 + i * 6, py = gy - 2 - (i % 3); for (let k = 0; k < 3; k++) set(px + k, py, TL.P); for (let k = 0; k < 3; k++) L.spawns.push({ k: 'coin', x: (px + k + 0.5) * T, y: (py - 0.6) * T }); }
  for (let i = 0; i < 30; i++) L.spawns.push({ k: r() < 0.25 ? 'star' : 'coin', x: (3 + i * 1.3) * T, y: (gy - 4.5 - Math.sin(i * 0.6) * 1.5) * T });
  set(10, gy, TL.BO); set(26, gy, TL.BO);
  L.spawns.push({ k: 'oneup', x: 26.5 * T, y: 1.6 * T });
  L.spawns.push({ k: 'capsule', x: 18.5 * T, y: (gy - 0.6) * T, c: 'rainbow' });
  L.spawns.push({ k: 'golden', x: 40 * T, y: (gy - 6) * T, bonus: 1 });
  for (let k = 38; k < 43; k++) set(k, gy - 5, TL.P);
  set(36, gy, TL.BO);
  L.spawns.push({ k: 'door', x: 42 * T, y: gy * T, to: 'exit' });
  L.start = { x: 2 * T, y: gy * T };
  return L;
}
