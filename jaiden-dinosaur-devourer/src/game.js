// ================= GAMEPLAY =================
const game = { state: 'title', t: 0, wi: 0, si: 0, L: null, cp: null, banner: null, stageStats: null, freeze: 0, bonusT: 0, stash: null, msgT: 0 };
let P = null;
let enemies = [], projs = [], items = [], parts = [], movers = [], hazards = [], gens = [], zones = [], props = [], melees = [];
let boss = null;
const cam = { x: 0, y: 0, shake: 0 };
const crumbles = new Map();
const LINUS_H = 64 * (HERO.scale || 1), LK = LINUS_H / 207;

function tileAt(tx, ty) { const L = game.L; if (tx < 0 || tx >= L.w) return TL.G; if (ty < 0 || ty >= L.h) return 0; return L.t[ty * L.w + tx]; }
function setTile(tx, ty, v) { const L = game.L; if (tx >= 0 && tx < L.w && ty >= 0 && ty < L.h) L.t[ty * L.w + tx] = v; }
function solidAt(tx, ty) { const t = tileAt(tx, ty); if (t === TL.CR) { const c = crumbles.get(ty * game.L.w + tx); return !(c && c.gone > 0); } return SOLID[t] === 1; }
function tileAtPx(x, y) { return tileAt(Math.floor(x / T), Math.floor(y / T)); }

function moveX(b, dx) {
  b.x += dx; b.wall = 0;
  const y0 = Math.floor(b.y / T), y1 = Math.floor((b.y + b.h - 0.01) / T);
  if (dx > 0) { const tx = Math.floor((b.x + b.w) / T); for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { b.x = tx * T - b.w - 0.01; b.vx = 0; b.wall = 1; return; } }
  else if (dx < 0) { const tx = Math.floor(b.x / T); for (let ty = y0; ty <= y1; ty++) if (solidAt(tx, ty)) { b.x = (tx + 1) * T + 0.01; b.vx = 0; b.wall = -1; return; } }
}
function moveY(b, dy, drop) {
  const prevB = b.y + b.h; b.y += dy; b.onGround = false; b.gt = 0;
  const x0 = Math.floor(b.x / T), x1 = Math.floor((b.x + b.w - 0.01) / T);
  if (dy > 0) {
    const ty = Math.floor((b.y + b.h) / T);
    for (let tx = x0; tx <= x1; tx++) {
      const t = tileAt(tx, ty);
      if (solidAt(tx, ty) || (t === TL.P && prevB <= ty * T + 1 && !drop)) {
        b.y = ty * T - b.h; b.vy = 0; b.onGround = true; b.gt = t; b.gtx = tx; b.gty = ty;
        for (let k = x0; k <= x1; k++) if (tileAt(k, ty) === TL.CR) { const i = ty * game.L.w + k; if (!crumbles.has(i)) crumbles.set(i, { t: 0.55, gone: 0 }); if (tileAt(k, ty) === TL.BO) b.gt = TL.BO; }
        for (let k = x0; k <= x1; k++) if (tileAt(k, ty) === TL.BO) b.gt = TL.BO;
        return;
      }
    }
  } else if (dy < 0) {
    const ty = Math.floor(b.y / T);
    for (let tx = x0; tx <= x1; tx++) if (solidAt(tx, ty)) { b.y = (ty + 1) * T; b.vy = 0; b.bonk = true; return; }
  }
}
function boxSolid(x, y, w, h) {
  for (let ty = Math.floor(y / T); ty <= Math.floor((y + h - 0.01) / T); ty++)
    for (let tx = Math.floor(x / T); tx <= Math.floor((x + w - 0.01) / T); tx++) if (solidAt(tx, ty)) return true;
  return false;
}
function breakTiles(box, breaks) {
  if (!breaks || !breaks.length) return false;
  let any = false;
  for (let ty = Math.floor(box.y / T); ty <= Math.floor((box.y + box.h - 0.01) / T); ty++)
    for (let tx = Math.floor(box.x / T); tx <= Math.floor((box.x + box.w - 0.01) / T); tx++) {
      const t = tileAt(tx, ty);
      if (breaks.includes(t) && tx > 0 && tx < game.L.w - 1) {
        setTile(tx, ty, TL.E); any = true;
        const col = t === TL.BU ? '#ff8a30' : t === TL.VI ? '#5fbf3a' : t === TL.ME ? '#aab4c0' : WORLDS[game.wi].pal.rock;
        for (let i = 0; i < 8; i++) part({ x: tx * T + 16, y: ty * T + 16, vx: (Math.random() - 0.5) * 260, vy: -Math.random() * 260, life: 0.7, col, size: 5, grav: 1, kind: 'chunk' });
        if (t === TL.BU) for (let i = 0; i < 8; i++) part({ x: tx * T + 16, y: ty * T + 16, vx: (Math.random() - 0.5) * 60, vy: -Math.random() * 90, life: 0.6, col: '#ffcf40', size: 6, kind: 'dot' });
        addScore(20, tx * T + 16, ty * T);
      }
    }
  if (any) { SFX.break(); cam.shake = Math.max(cam.shake, 4); }
  return any;
}
function part(o) { if (parts.length < 400) parts.push(Object.assign({ t: 0, size: 3, kind: 'dot' }, o)); }
function floatText(str, x, y, col = '#fff') { part({ x, y, vx: 0, vy: -40, life: 1.0, kind: 'text', str, col }); }
function addScore(n, x, y) { SAVE.score += n; if (game.stageStats) game.stageStats.score += n; if (x !== undefined && n >= 100) floatText('+' + n, x, y, '#fff6a0'); }
function burst(x, y, n, col = '#ffd84a', spd = 200) { for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = spd * (0.4 + Math.random() * 0.6); part({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 0.5 + Math.random() * 0.3, col, size: 5, kind: 'star', rot: Math.random() * 6 }); } }

// ---------------- level loading ----------------
function startStage(wi, si, keepPlayer) {
  game.wi = wi; game.si = si;
  const L = si === 4 ? genBoss(wi) : si === 5 ? genBonus(wi) : genStage(wi, si);
  loadLevel(L);
  game.cp = { x: L.start.x, y: L.start.y };
  if (!keepPlayer || !P) makePlayer();
  placePlayer(game.cp.x, game.cp.y);
  game.stageStats = { coins: 0, stars: 0, dinos: 0, score: 0, golden: false, eggs: 0, t: 0 };
  game.banner = { text: si === 4 ? WORLDS[wi].bossName : si === 5 ? 'BONUS ROOM!' : `WORLD ${wi + 1}-${si + 1}`, sub: si === 5 ? 'Grab everything before time runs out!' : WORLDS[wi].name, t: 2.2 };
  game.state = 'play'; game.freeze = 0;
  playMusic(si === 4 ? BOSS_MUSIC : si === 5 ? BONUS_MUSIC : WORLDS[wi].music);
}
function loadLevel(L) {
  game.L = L; crumbles.clear();
  enemies = []; projs = []; items = []; parts = []; movers = []; hazards = []; gens = []; zones = []; props = []; melees = []; boss = null;
  buildTiles(L.wi); buildBG(L.wi);
  const key = (L.kind === 'bonus') ? `${L.wi}-bonus` : `${L.wi}-${L.si}`;
  for (const s of L.spawns) {
    switch (s.k) {
      case 'enemy': spawnEnemy(s.e, s.x, s.y); break;
      case 'coin': case 'star': case 'heart': case 'oneup': case 'egg':
        items.push({ k: s.k, x: s.x, y: s.y, r: s.k === 'egg' ? 10 : 8, t: Math.random() * 6 }); break;
      case 'golden': if (!SAVE.golden[key]) items.push({ k: 'golden', x: s.x, y: s.y - 14, r: 14, t: 0, key }); else items.push({ k: 'star', x: s.x, y: s.y - 14, r: 8, t: 0 }); break;
      case 'capsule': items.push({ k: 'capsule', c: s.c, x: s.x, y: s.y, r: 10, t: 0 }); break;
      case 'sign': props.push({ k: 'sign', x: s.x, y: s.y, text: s.text }); break;
      case 'checkpoint': props.push({ k: 'checkpoint', x: s.x, y: s.y, on: false }); break;
      case 'goal': props.push({ k: 'goal', x: s.x, y: s.y }); break;
      case 'door': props.push({ k: 'door', x: s.x, y: s.y, to: s.to }); break;
      case 'mover': movers.push({ x: s.x, y: s.y, x0: s.x, y0: s.y, w: s.w * T, h: 12, dx: s.dx, dy: s.dy, t: 0, elev: s.elev, pdx: 0, pdy: 0, spd: 55 }); break;
      case 'pend': hazards.push({ k: 'pend', ax: s.x, ay: s.y, len: s.len, amp: s.amp, ride: s.ride, t: Math.random() * 3, x: 0, y: 0, w: 2 * T, h: 12, pdx: 0, pdy: 0 }); break;
      case 'faller': hazards.push({ k: 'faller', x: s.x - 12, y: s.y, w: 24, h: 26, st: 'wait', t: 0, vy: 0, y0: s.y }); break;
      case 'rollgen': gens.push({ k: 'roll', x: s.x, y: s.y, x0: s.x0, t: 1.5 }); break;
      case 'cargen': gens.push({ k: 'car', x: s.x, y: s.y, x0: s.x0, t: 1 }); break;
      case 'zone': zones.push({ k: s.kind, x: s.x, y: s.y, w: s.w, h: s.h, fx: s.fx }); break;
      case 'boss': makeBoss(s.b, s.x, s.y); break;
    }
  }
}
function makePlayer() {
  const maxhp = 6 + SAVE.up.hp;
  P = { x: 0, y: 0, w: 20, h: 44, vx: 0, vy: 0, face: 1, onGround: false, jumps: 0, floatT: 0, coyote: 0, jbuf: 0, hp: maxhp, maxhp,
    inv: 0, power: null, mouth: null, inhaling: false, inhLock: false, crouch: false, slideT: 0, chargeT: 0, stomp: false, camoT: 0, cd: 0, atkT: 0, atkKind: '',
    rainbowT: 0, speedT: 0, megaT: 0, anim: 0, transformT: 0, dead: false, deadT: 0, safe: null, safeT: 0, onMover: null, fireT: 0, wasAir: false, floating: false, victory: false };
}
function placePlayer(x, y) { P.x = x - P.w / 2 + T / 2; P.y = y - P.h - 1; P.vx = P.vy = 0; P.safe = { x: P.x, y: P.y }; snapCamera(); }
function snapCamera() { cam.x = clamp(P.x - VIEW_W / 2, 0, Math.max(0, game.L.w * T - VIEW_W)); cam.ty = P.y + P.h - VIEW_H * 0.74; cam.y = clamp(cam.ty, 0, game.L.h * T - VIEW_H); }

// ---------------- enemies ----------------
const WORLD_TINT = { arctic: { compy: ['#e8f2fa', '#ffffff'], raptor: ['#9fb8cc', '#e8f2fa'], ptero: ['#7fa0c8', '#e0ecff'] }, desert: { compy: ['#d8a050', '#f8e0b0'], raptor: ['#b86a30', '#f0c890'] }, city: { raptor: ['#6a7a8a', '#c8d0d8'], ptero: ['#5a5a6a', '#c0c0d0'] }, beach: { compy: ['#e07a50', '#ffd8b0'] }, forest: { compy: ['#3a8a5a', '#b0e8b0'] } };
function spawnEnemy(type, cx, by, extra) {
  const base = EN[type]; const tint = (WORLD_TINT[WORLDS[game.wi].key] || {})[type];
  const d = tint ? Object.assign({}, base, { col: tint[0], belly: tint[1] }) : base;
  const e = Object.assign({ type, d, x: cx - d.w / 2, y: by - d.h, w: d.w, h: d.h, vx: 0, vy: 0, face: -1, hp: d.hp, t: Math.random() * 5, walk: 0, flash: 0, sucked: false, onGround: false, cd: 1 + Math.random() * 2, st: 'idle', homeY: by - d.h, alive: true }, extra || {});
  enemies.push(e); return e;
}
function enemyInWater(e) { return tileAtPx(e.x + e.w / 2, e.y + e.h / 2) === TL.WA; }
function updateEnemy(e, dt) {
  e.t += dt; if (e.flash > 0) e.flash -= dt;
  if (e.sucked) { e.walk += dt * 20; return; }
  const d = e.d, px = P.x + P.w / 2, ex = e.x + e.w / 2, dxp = px - ex;
  const spd = d.speed * (1 + game.wi * 0.05);
  const inW = enemyInWater(e);
  const grav = !d.nograv || ((d.beh === 'swim') && !inW && !e.flying);
  switch (d.beh) {
    case 'walk': case 'charge':
      if (e.st === 'dash') { e.vx = e.face * spd * 2.8; e.cd -= dt; if (e.cd <= 0 || e.wall) { e.st = 'idle'; e.cd = 1.5; } }
      else {
        e.vx = e.face * spd;
        if (e.onGround) { const ahead = e.face > 0 ? e.x + e.w + 2 : e.x - 2; if (!solidAt(Math.floor(ahead / T), Math.floor((e.y + e.h + 4) / T)) && tileAtPx(ahead, e.y + e.h + 4) !== TL.P) e.face *= -1; }
        if (e.wall) e.face *= -1;
        if (d.beh === 'charge') { e.cd -= dt; if (e.cd <= 0 && Math.abs(dxp) < 170 && Math.abs(P.y - e.y) < 50) { e.face = sign(dxp); e.st = 'dash'; e.cd = 0.9; SFX.roar(0); } }
        if (d.power === 'rex' && Math.abs(dxp) < 120 && Math.random() < dt * 0.4) { e.jawT = 0.6; if (Math.abs(dxp) < 200) SFX.roar(0); }
      }
      e.walk += dt * Math.abs(e.vx) * 0.25;
      break;
    case 'hop':
      if (e.onGround) { e.vx *= 0.8; e.cd -= dt; e.face = sign(dxp); if (e.cd <= 0 && Math.abs(dxp) < 260) { e.vy = -360; e.vx = e.face * 100; e.cd = 0.9 + Math.random() * 0.8; } }
      e.walk += dt * 8; break;
    case 'fly':
      if (e.baseY === undefined) e.baseY = e.y;
      if (Math.abs(dxp) < 320) { e.face = sign(dxp); e.vx = lerp(e.vx, e.face * spd, dt * 1.5); } else e.vx = lerp(e.vx, 0, dt);
      e.y = e.baseY + Math.sin(e.t * 2.2) * 26; e.vy = 0; break;
    case 'swim': case 'amphib':
      if (inW) {
        e.vx = e.face * spd * (d.beh === 'amphib' ? 1.2 : 1);
        if (e.baseY === undefined) e.baseY = e.y;
        const ny = e.baseY + Math.sin(e.t * 1.6) * 14; e.vy = (ny - e.y) * 3;
        if (Math.abs(dxp) < 150 && Math.abs(P.y - e.y) < 70 && (d.power === 'mosa' || d.power === 'sarco')) { e.face = sign(dxp); e.vx *= 1.6; e.jawT = 0.3; }
        const ahead = e.face > 0 ? e.x + e.w + 3 : e.x - 3;
        if (tileAtPx(ahead, e.y + e.h / 2) !== TL.WA) e.face *= -1;
      } else if (d.beh === 'amphib') {
        e.vx = e.face * spd * 0.8; if (e.wall) e.face *= -1;
        if (e.onGround) { const ahead = e.face > 0 ? e.x + e.w + 2 : e.x - 2; const below = tileAtPx(ahead, e.y + e.h + 4); if (!solidAt(Math.floor(ahead / T), Math.floor((e.y + e.h + 4) / T)) && below !== TL.WA && below !== TL.P) e.face *= -1; }
        e.baseY = undefined;
      } else { e.vx *= 0.9; if (e.onGround && Math.random() < dt * 2) { e.vy = -200; e.face *= -1; } e.baseY = undefined; }
      e.walk += dt * 6; break;
    case 'shoot':
      e.face = sign(dxp); e.vx = 0; e.cd -= dt;
      if (e.cd < 0.5) e.jawT = 0.5;
      if (e.cd <= 0 && Math.abs(dxp) < 280 && Math.abs(P.y - e.y) < 160 && P.camoT <= 0) {
        e.cd = 2.4 - Math.min(0.8, game.wi * 0.12);
        const t = 0.9, vx = clamp(dxp / t, -220, 220), vy = ((P.y + 10) - (e.y + 8)) / t - 0.5 * 700 * t;
        projs.push({ own: 'e', kind: WORLDS[game.wi].key === 'arctic' ? 'ice' : WORLDS[game.wi].key === 'desert' ? 'sand' : 'venom', x: ex + e.face * 10 - 6, y: e.y + 4, w: 12, h: 12, vx, vy: Math.max(vy, -420), grav: 700, life: 3, dmg: 1 });
        SFX.spit();
      }
      break;
  }
  if (e.jawT > 0) e.jawT -= dt;
  if (grav && !(d.beh === 'fly')) { e.vy += (inW ? 300 : 1300) * dt; e.vy = Math.min(e.vy, inW ? 60 : 500); }
  moveX(e, e.vx * dt); moveY(e, e.vy * dt, false);
  if (e.y > game.L.h * T + 40) e.alive = false;
  if (d.camo) e.alpha = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(e.t * 1.8));
}
function damageEnemy(e, dmg, fromX) {
  if (!e.alive) return;
  e.hp -= dmg; e.flash = 0.15; SFX.hit();
  e.vx = sign(e.x + e.w / 2 - fromX) * 120; if (!e.d.nograv) e.vy = -150;
  if (e.hp <= 0) killEnemy(e);
}
function killEnemy(e) {
  e.alive = false; SAVE.defeated++;
  burst(e.x + e.w / 2, e.y + e.h / 2, 10); SFX.pop();
  addScore(200, e.x + e.w / 2, e.y);
  if (Math.random() < 0.35) items.push({ k: 'coin', x: e.x + e.w / 2, y: e.y + e.h / 2, r: 8, t: 0, vy: -220, vx: (Math.random() - 0.5) * 80, phys: 1, life: 8 });
}

// ---------------- player ----------------
function hurtPlayer(srcX, amt = 1, kind = 'hit') {
  if (P.dead || P.inv > 0 || P.rainbowT > 0 || P.transformT > 0 || game.state !== 'play') return;
  if (kind === 'contact' && P.camoT > 0) return;
  P.hp -= amt; P.inv = 1.6; SFX.hurt(); cam.shake = 6;
  P.vx = sign(P.x + P.w / 2 - srcX) * 200; P.vy = -280; P.chargeT = 0; P.slideT = 0; P.stomp = false;
  if (P.inhaling) { P.inhaling = false; suckStop(); }
  if (P.mouth) { P.mouth = null; }
  if (P.power) dropPower();
  if (P.hp <= 0) killPlayer();
}
function dropPower() {
  items.push({ k: 'powerstar', pw: P.power, x: P.x + P.w / 2, y: P.y, r: 12, t: 0, vx: -P.face * 140, vy: -300, phys: 1, bounce: 1, life: 7 });
  floatText('Power lost! Grab it back!', P.x + P.w / 2, P.y - 10, POW[P.power].col2);
  P.power = null; P.camoT = 0;
}
function killPlayer() {
  P.dead = true; P.deadT = 2.0; P.vy = -420; P.vx = 0; SFX.hurt(); stopMusic(); suckStop();
  setTimeout(() => tone(330, 0.2, 'square', 0.15, 160), 300); setTimeout(() => tone(250, 0.3, 'square', 0.15, 100), 550);
}
function respawn() {
  SAVE.lives--; persist();
  if (SAVE.lives < 0) { game.state = 'gameover'; stopMusic(); return; }
  const pw = null; makePlayer(); P.power = pw;
  placePlayer(game.cp.x, game.cp.y); P.inv = 2;
  // fall-safety: clear enemy projectiles
  projs = projs.filter(p => p.own !== 'e');
  playMusic(game.si === 4 ? BOSS_MUSIC : game.si === 5 ? BONUS_MUSIC : WORLDS[game.wi].music);
}
function pitFall() {
  if (P.dead) return;
  if (P.inv <= 0 && P.rainbowT <= 0) { P.hp -= 1; SFX.hurt(); }
  if (P.hp <= 0) { P.hp = 0; P.y = game.L.h * T; killPlayer(); return; }
  P.x = P.safe.x; P.y = P.safe.y; P.vx = P.vy = 0; P.inv = 1.6; cam.shake = 4;
  floatText('Oops!', P.x + P.w / 2, P.y - 10);
}
function setCrouch(on) {
  if (on && !P.crouch) { P.crouch = true; P.y += 18; P.h = 26; }
  else if (!on && P.crouch) { if (boxSolid(P.x, P.y - 18, P.w, 18)) return false; P.crouch = false; P.y -= 18; P.h = 44; }
  return true;
}
function updatePlayer(dt) {
  const p = P;
  p.anim += dt;
  if (p.dead) { p.deadT -= dt; p.vy += 900 * dt; p.y += p.vy * dt; if (p.deadT <= 0) respawn(); return; }
  if (p.victory) { p.vx = 0; p.vy += 1500 * dt; moveY(p, p.vy * dt, false); return; }
  for (const k of ['inv', 'cd', 'atkT', 'camoT', 'rainbowT', 'speedT', 'megaT', 'coyote', 'jbuf']) if (p[k] > 0) p[k] -= dt;
  const cx = p.x + p.w / 2;
  const inWater = tileAtPx(cx, p.y + p.h * 0.45) === TL.WA;
  const feetT = tileAtPx(cx, p.y + p.h - 2), inQuick = feetT === TL.QS || tileAtPx(cx, p.y + p.h * 0.5) === TL.QS;
  const swimPow = p.power === 'mosa' || p.power === 'sarco';
  if (inWater !== p.wasWater) { if (Math.abs(p.vy) > 100) { SFX.splash(); for (let i = 0; i < 8; i++) part({ x: cx, y: Math.round((p.y + p.h * 0.45) / T) * T, vx: (Math.random() - 0.5) * 150, vy: -Math.random() * 200, life: 0.5, col: '#bfe8ff', size: 4, grav: 1 }); } p.wasWater = inWater; }
  // --- mouth actions
  if (p.mouth) {
    if (pressed.inhale) spit();
    else if (pressed.special || pressed.down) swallow();
  }
  if (!input.inhale) p.inhLock = false;
  // --- inhale
  const canInhale = !p.mouth && !p.inhLock && p.slideT <= 0 && p.chargeT <= 0 && !p.stomp;
  const wantInhale = input.inhale && canInhale;
  if (wantInhale && !p.inhaling) suckStart(); if (!wantInhale && p.inhaling) suckStop();
  p.inhaling = wantInhale;
  // --- crouch
  const ceilingBlock = p.crouch && boxSolid(p.x, p.y - 18, p.w, 18);
  if (p.onGround && (input.down && !p.mouth && !p.inhaling) || ceilingBlock) setCrouch(true); else if (p.crouch && p.slideT <= 0) setCrouch(false);
  // --- horizontal
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let maxs = 145;
  if (p.crouch) maxs = 62; if (p.mouth) maxs *= 0.82; if (inWater) maxs *= swimPow ? 1.35 : 0.65; if (inQuick) maxs = 40;
  if (p.speedT > 0) maxs *= 1.5; if (p.fireT > 0) maxs *= 0.5;
  if (p.inhaling && p.onGround) maxs = 0;
  if (dir && !(p.inhaling)) p.face = dir;
  else if (dir && p.inhaling && !p.onGround) p.face = dir;
  if (p.slideT > 0) { p.slideT -= dt; p.vx = p.face * 270 * (p.slideT > 0.1 ? 1 : 0.5); }
  else if (p.chargeT > 0) { p.chargeT -= dt; p.vx = p.face * 390; p.vy = Math.min(p.vy, 40); if (Math.random() < 0.6) part({ x: cx - p.face * 10, y: p.y + p.h - 4, vx: -p.face * 60, vy: -30, life: 0.4, col: '#d8c8a8', size: 5 }); }
  else {
    const ice = p.onGround && p.gt === TL.IC;
    const acc = p.onGround ? (ice ? 260 : 1400) : 950;
    const target = dir * maxs;
    if (dir) p.vx += clamp(target - p.vx, -acc * dt, acc * dt);
    else { const fr = p.onGround ? (ice ? 120 : 1600) : 300; p.vx -= clamp(p.vx, -fr * dt, fr * dt); }
    if (Math.abs(p.vx) > maxs && !ice) p.vx = lerp(p.vx, sign(p.vx) * maxs, dt * 8);
  }
  // --- jump
  if (pressed.jump) p.jbuf = 0.13;
  const maxFloat = 2.0 + SAVE.up.flt * 0.8;
  if (p.jbuf > 0) {
    let used = true;
    if (inWater) { const surf = tileAtPx(cx, p.y - 4) !== TL.WA; p.vy = surf ? (p.power === 'sarco' ? -640 : -440) : (swimPow ? -300 : -230); if (surf && p.power === 'sarco') { SFX.splash(); burst(cx, p.y, 6, '#bfe8ff', 150); } else SFX.flap(); p.jumps = 1; }
    else if (inQuick) { p.vy = -300; SFX.flap(); }
    else if (p.crouch && p.onGround && !p.mouth) { p.slideT = 0.38; SFX.puff(); for (let i = 0; i < 5; i++) part({ x: cx, y: p.y + p.h, vx: -p.face * Math.random() * 120, vy: -Math.random() * 40, life: 0.4, col: '#e8dcc0', size: 4 }); }
    else if (p.onGround || p.coyote > 0) { p.vy = -475; p.jumps = 1; p.onGround = false; p.coyote = 0; SFX.jump(); }
    else if (p.jumps < 2 && !p.mouth) { p.vy = -430; p.jumps = 2; SFX.jump2(); for (let i = 0; i < 6; i++) part({ x: cx, y: p.y + p.h, vx: (Math.random() - 0.5) * 120, vy: 40 + Math.random() * 40, life: 0.4, col: '#ffffff', size: 4, kind: 'ring' }); }
    else if (!p.mouth && p.floatT > 0.25) { p.vy = -230; p.floatT -= 0.3; SFX.flap(); }
    else used = false;
    if (used) p.jbuf = 0;
  }
  if (!input.jump && p.vy < -200 && !inWater && p.jumps === 1 && p.slideT <= 0) p.vy = lerp(p.vy, -200, dt * 10);
  // --- gravity
  p.floating = false;
  if (p.chargeT <= 0) {
    if (inWater) { p.vy += 420 * dt; p.vy = Math.min(p.vy, 90); }
    else if (inQuick) { p.vy = Math.min(p.vy + 300 * dt, 22); }
    else {
      p.vy += (p.stomp ? 2600 : 1500) * dt;
      if (input.jump && p.vy > 0 && !p.onGround && !p.mouth && p.floatT > 0 && !p.stomp && !p.inhaling) { p.vy = Math.min(p.vy, 55); p.floatT -= dt; p.floating = true; }
      p.vy = Math.min(p.vy, p.stomp ? 900 : 540);
    }
  }
  // --- specials
  if (!p.mouth && !p.inhaling) {
    if (pressed.special) doSpecial();
    if (p.power === 'rex' && input.special && !input.down && p.cd <= 0) {
      p.fireT = 0.1; p.atkKind = 'fire'; p.atkT = 0.12;
      if ((p.fireAcc = (p.fireAcc || 0) + dt) > 0.04) {
        p.fireAcc = 0;
        projs.push({ own: 'p', kind: 'fire', x: cx + p.face * 14 - 7, y: p.y + 12 + (p.crouch ? -4 : 0), w: 14, h: 14, vx: p.face * (230 + Math.random() * 80) + p.vx * 0.5, vy: (Math.random() - 0.5) * 70, life: 0.34, dmg: 0.45, breaks: [TL.BU, TL.VI], pow: 'rex', t: 0 });
        if (Math.random() < 0.35) SFX.fire();
      }
    } else if (p.fireT > 0) p.fireT -= dt;
  } else p.fireT = 0;
  // --- move
  const prevBottom = p.y + p.h, wasGround = p.onGround, vyBefore = p.vy;
  if (p.onMover) { p.x += p.onMover.pdx; p.y += p.onMover.pdy; }
  moveX(p, p.vx * dt);
  if (p.chargeT > 0 && p.wall) { p.chargeT = 0; cam.shake = 5; SFX.thump(); }
  moveY(p, p.vy * dt, input.down && pressed.jump);
  p.onMover = null;
  if (p.vy >= 0) {
    for (const m of movers.concat(hazards.filter(h => h.k === 'pend' && h.ride))) {
      if (p.x + p.w > m.x && p.x < m.x + m.w && prevBottom <= m.y + 2 + Math.max(0, m.pdy) && p.y + p.h >= m.y) { p.y = m.y - p.h; p.vy = 0; p.onGround = true; p.gt = TL.P; p.onMover = m; break; }
    }
  }
  if (p.onGround) {
    if (!wasGround && vyBefore > 250) { SFX.land(); for (let i = 0; i < 4; i++) part({ x: cx, y: p.y + p.h, vx: (Math.random() - 0.5) * 100, vy: -Math.random() * 40, life: 0.3, col: '#e8dcc0', size: 3 }); }
    if (p.stomp) { p.stomp = false; stompLand(); }
    p.jumps = 0; p.floatT = maxFloat; p.coyote = 0.1;
    if (p.gt === TL.BO) { p.vy = -840; p.onGround = false; p.jumps = 1; SFX.bounce(); }
    p.safeT -= dt;
    if (p.safeT <= 0 && !p.onMover && (p.gt === TL.G || p.gt === TL.IC || p.gt === TL.P) && !inQuick && !p.inv) {
      const fx = Math.floor((p.x + p.w / 2) / T), fy = Math.floor((p.y + p.h + 2) / T);
      if (solidAt(fx - 1, fy) && solidAt(fx + 1, fy) || p.gt === TL.P) { p.safe = { x: p.x, y: p.y }; p.safeT = 0.4; }
    }
  } else if (wasGround && p.vy >= 0) p.coyote = 0.1;
  // --- hazards
  if (p.y > game.L.h * T + 20) { pitFall(); return; }
  const pal = WORLDS[game.wi].pal;
  for (let ty = Math.floor((p.y + 6) / T); ty <= Math.floor((p.y + p.h - 1) / T); ty++)
    for (let tx = Math.floor((p.x + 2) / T); tx <= Math.floor((p.x + p.w - 2) / T); tx++)
      if (tileAt(tx, ty) === TL.SP) { const yTop = ty * T + 10; if (p.y + p.h > yTop && (pal.spike !== 'electric' || elecOn(tx))) hurtPlayer(tx * T + 16, 1); }
  if (tileAtPx(cx, p.y + 4) === TL.QS) { hurtPlayer(cx, 1); p.x = p.safe.x; p.y = p.safe.y; p.vy = 0; }
  // zones
  for (const z of zones) if (overlap(p, z)) {
    if (z.k === 'wind' && Math.sin(game.t * 1.2) > -0.2 && p.chargeT <= 0) moveX(p, z.fx * dt * (p.onGround ? 1 : 1.3));
    if (z.k === 'current' && inWater) moveX(p, z.fx * dt);
  }
}
function elecOn(tx) { return Math.sin(game.t * 2.2 + tx * 0.7) > -0.1; }

function doSpecial() {
  const p = P, f = p.face, cx = p.x + p.w / 2, my = p.y + (p.crouch ? 8 : 14);
  if (p.cd > 0 && p.power !== 'rex') return;
  const pw = p.power;
  if (!pw) { p.cd = 0.32; p.atkT = 0.22; p.atkKind = 'puff'; projs.push({ own: 'p', kind: 'puff', x: cx + f * 10 - 9, y: my - 9, w: 18, h: 18, vx: f * 270, vy: 0, life: 0.3, dmg: 1, breaks: [TL.RK], t: 0 }); SFX.puff(); return; }
  if (pw === 'mosa') {
    const inW = tileAtPx(cx, p.y + p.h * 0.45) === TL.WA;
    p.cd = 0.22; p.atkT = 0.2; p.atkKind = 'shoot';
    projs.push({ own: 'p', kind: 'water', x: cx + f * 12 - 9, y: my - 6, w: 18, h: 12, vx: f * (inW ? 480 : 430), vy: 0, life: 0.9, dmg: 2, breaks: [TL.RK], pow: 'mosa', t: 0 }); SFX.water();
  } else if (pw === 'rex') {
    if (input.down && p.cd <= 0) { p.cd = 0.4; p.atkT = 0.25; p.atkKind = 'bite'; melee(4, -2, 34, 34, 4, 0.18, [TL.RK], 'rex', 'bite'); SFX.bite(); }
  } else if (pw === 'drex') {
    if (!p.onGround && input.down) { p.stomp = true; p.vy = 500; p.cd = 0.5; SFX.charge(); }
    else { p.chargeT = 0.45; p.cd = 0.7; p.atkKind = 'charge'; melee(-4, 0, 34, p.h, 3, 0.45, [TL.RK, TL.ME], 'drex', 'charge'); SFX.charge(); cam.shake = 3; }
  } else if (pw === 'indo') {
    if (input.down) { p.camoT = 5; p.cd = 0.6; SFX.camo(); burst(cx, p.y + 20, 8, '#ffffff', 120); }
    else { p.cd = 0.3; p.atkT = 0.22; p.atkKind = 'slash'; melee(0, -10, 44, 52, p.camoT > 0 ? 6 : 3, 0.16, [TL.RK], 'indo', 'slash'); SFX.slash(); }
  } else if (pw === 'theri') {
    p.cd = 0.36; p.atkT = 0.25; p.atkKind = 'slash';
    melee(0, -12, 50, 56, 3, 0.16, [TL.RK, TL.VI], 'theri', 'slash');
    projs.push({ own: 'p', kind: 'claw', x: cx + f * 20 - 14, y: p.y + 4, w: 28, h: 30, vx: f * 330, vy: 0, life: 0.55, dmg: 2, breaks: [TL.VI, TL.RK], pow: 'theri', t: 0, face: f });
    SFX.slash();
  } else if (pw === 'sarco') {
    const inW = tileAtPx(cx, p.y + p.h * 0.45) === TL.WA;
    p.cd = 0.4; p.atkT = 0.25; p.atkKind = 'bite';
    if (inW) { p.chargeT = 0.32; melee(-4, 0, 40, p.h, 4, 0.32, [TL.RK], 'sarco', 'bite'); SFX.charge(); }
    else melee(4, -4, 38, 34, 4, 0.18, [TL.RK], 'sarco', 'bite');
    SFX.bite();
  }
}
function melee(ox, oy, w, h, dmg, life, breaks, pow, kind) { melees.push({ ox, oy, w, h, dmg, life, max: life, breaks, pow, kind, hit: new Set(), x: 0, y: 0 }); }
function stompLand() {
  const cx = P.x + P.w / 2, by = P.y + P.h;
  SFX.stomp(); cam.shake = 10;
  for (const s of [-1, 1]) projs.push({ own: 'p', kind: 'shock', x: cx - 10, y: by - 18, w: 20, h: 18, vx: s * 280, vy: 0, life: 0.45, dmg: 2, breaks: [TL.RK], pow: 'drex', t: 0 });
  breakTiles({ x: P.x - 4, y: by + 2, w: P.w + 8, h: 8 }, [TL.RK]);
  for (let i = 0; i < 14; i++) part({ x: cx, y: by, vx: (Math.random() - 0.5) * 300, vy: -Math.random() * 200, life: 0.5, col: '#c8b088', size: 5, grav: 1 });
}
function spit() {
  const p = P, f = p.face, cx = p.x + p.w / 2;
  const big = p.mouth.n > 1;
  projs.push({ own: 'p', kind: 'star', x: cx + f * 10 - 12, y: p.y + 8, w: 24, h: 24, vx: f * 380, vy: 0, life: 1.1, dmg: big ? 7 : 4, breaks: [TL.RK], pierce: big, t: 0, big });
  p.mouth = null; p.atkT = 0.25; p.atkKind = 'spit'; SFX.spit();
}
function swallow() {
  const p = P, m = p.mouth; p.mouth = null;
  SAVE.swallowed++; if (game.stageStats) game.stageStats.dinos++;
  if (m.power) {
    p.power = m.power; p.transformT = 0.9; game.freeze = 0.9; p.camoT = 0;
    const isNew = !SAVE.powers[m.power]; SAVE.powers[m.power] = 1;
    game.banner = { text: POW[m.power].name + ' POWER!', sub: POW[m.power].move, t: 2.6, col: POW[m.power].col, isNew };
    SFX.gulp(); setTimeout(SFX.transform, 150);
    burst(p.x + p.w / 2, p.y + 20, 16, POW[m.power].col2, 220);
    persist();
  } else { SFX.gulp(); addScore(100, p.x + p.w / 2, p.y); floatText('Yum!', p.x + p.w / 2, p.y - 18, '#fff'); }
}

// ---------------- inhale ----------------
function doInhale(dt) {
  const p = P;
  p.pullClose = false;
  if (!p.inhaling) return;
  const f = p.face, mx = p.x + p.w / 2 + f * 10, my = p.y + (p.crouch ? 8 : 16);
  const R = (105 + SAVE.up.inh * 28) * (p.megaT > 0 ? 1.45 : 1);
  const zone = { x: f > 0 ? mx - 4 : mx - R + 4, y: my - 38, w: R, h: 76 };
  const pull = (o, cxo, cyo, heavy) => {
    const dx = mx - cxo, dy = my - cyo, dist = Math.hypot(dx, dy);
    const sp = (heavy ? 0.5 : 1) * (150 + 12000 / (Math.abs(dx) + 40));
    const mvx = sign(dx) * Math.min(Math.abs(dx), sp * dt), mvy = clamp(dy, -1, 1) * Math.min(Math.abs(dy), sp * 0.7 * dt);
    o.x += mvx; o.y += mvy;
    if (dist < 50) p.pullClose = true;
    return dist < 22;
  };
  for (const e of enemies) {
    if (!e.alive) continue;
    if (overlap(e, zone)) {
      e.sucked = true;
      if (pull(e, e.x + e.w / 2, e.y + e.h / 2, e.d.heavy)) {
        e.alive = false;
        if (p.mouth) p.mouth.n++; else p.mouth = { type: e.type, power: e.d.power, col: e.d.col, n: 1 };
        p.inhaling = false; p.inhLock = true; suckStop(); SFX.pop(); cam.shake = 2;
        floatText(e.d.power ? 'Tap POWER to copy!' : 'Got it!', p.x + p.w / 2, p.y - 12, e.d.power ? POW[e.d.power].col2 : '#fff');
        return;
      }
    }
  }
  for (const it of items) {
    if (it.dead || it.k === 'golden' || it.k === 'egg') continue;
    const b = { x: it.x - it.r, y: it.y - it.r, w: it.r * 2, h: it.r * 2 };
    if (overlap(b, zone)) { const o = { x: it.x, y: it.y }; if (pull(o, it.x, it.y, false)) { if (it.k === 'powerstar') { it.dead = true; p.mouth = { type: 'star', power: it.pw, col: POW[it.pw].col, n: 1 }; p.inhaling = false; p.inhLock = true; suckStop(); SFX.pop(); return; } collect(it); } it.x = o.x; it.y = o.y; it.phys = 0; }
  }
  for (const pr of projs) {
    if (pr.own !== 'e' || pr.dead) continue;
    if (overlap(pr, zone)) { const o = { x: pr.x + pr.w / 2, y: pr.y + pr.h / 2 }; pr.vx = pr.vy = 0; pr.grav = 0; if (pull(o, o.x, o.y, false)) { pr.dead = true; p.mouth = { type: 'junk', power: null, col: '#aaa', n: 1 }; p.inhaling = false; p.inhLock = true; suckStop(); SFX.pop(); return; } pr.x = o.x - pr.w / 2; pr.y = o.y - pr.h / 2; }
  }
  if (Math.random() < 0.9) { const d = R * (0.6 + Math.random() * 0.4); part({ kind: 'swirl', x: mx + f * d, y: my + (Math.random() - 0.5) * 60, tx: mx, ty: my, life: 0.3, t: 0 }); }
}

// ---------------- items ----------------
function collect(it) {
  if (it.dead) return; it.dead = true;
  const s = game.stageStats;
  switch (it.k) {
    case 'coin': SAVE.coins++; s.coins++; addScore(10); SFX.coin(); part({ x: it.x, y: it.y, kind: 'ring', life: 0.3, col: '#ffe060', size: 10 }); break;
    case 'star': s.stars++; addScore(100, it.x, it.y); SFX.star(); burst(it.x, it.y, 5, '#fff6a0', 120); break;
    case 'heart': P.hp = Math.min(P.maxhp, P.hp + 2); SFX.heart(); floatText('+♥♥', it.x, it.y, '#ff6a8a'); break;
    case 'oneup': SAVE.lives = Math.min(99, SAVE.lives + 1); SFX.oneup(); floatText('1-UP!', it.x, it.y, '#7aff7a'); break;
    case 'golden': SAVE.golden[it.key] = 1; s.golden = true; SFX.golden(); addScore(2000, it.x, it.y); burst(it.x, it.y, 20, '#ffd84a', 260); game.banner = { text: 'GOLDEN DINOSAUR!', sub: 'A rare treasure!', t: 2.4, col: '#ffcc22' }; break;
    case 'capsule': activateCapsule(it.c); break;
    case 'powerstar': P.power = it.pw; P.transformT = 0.5; game.freeze = 0.5; SFX.transform(); floatText(POW[it.pw].name + '!', it.x, it.y, POW[it.pw].col2); break;
    case 'egg': {
      SAVE.eggs++; s.eggs++; SFX.egg(); burst(it.x, it.y, 10, '#fff4dc', 160);
      const roll = Math.random();
      if (roll < 0.3) { for (let i = 0; i < 10; i++) items.push({ k: 'coin', x: it.x, y: it.y, r: 8, t: 0, vx: (Math.random() - 0.5) * 240, vy: -200 - Math.random() * 200, phys: 1, life: 10 }); floatText('Coin shower!', it.x, it.y - 10, '#ffe060'); }
      else if (roll < 0.45) { SAVE.lives++; SFX.oneup(); floatText('1-UP!', it.x, it.y - 10, '#7aff7a'); }
      else if (roll < 0.65) { P.hp = P.maxhp; floatText('Full health!', it.x, it.y - 10, '#ff6a8a'); SFX.heart(); }
      else if (roll < 0.85) { const c = ['rainbow', 'speed', 'mega'][Math.floor(Math.random() * 3)]; items.push({ k: 'capsule', c, x: it.x, y: it.y - 4, r: 10, t: 0, vy: -250, phys: 1, life: 12 }); floatText('Power-up capsule!', it.x, it.y - 10, '#c9a0ff'); }
      else { addScore(1000, it.x, it.y); floatText('Mega score!', it.x, it.y - 24, '#fff6a0'); }
      break;
    }
  }
}
function activateCapsule(c) {
  SFX.transform();
  if (c === 'rainbow') { P.rainbowT = 8; game.banner = { text: 'RAINBOW POWER!', sub: 'Invincible! Crash through dinos!', t: 2, col: '#ff5aa0' }; }
  if (c === 'speed') { P.speedT = 10; game.banner = { text: 'SPEED BOOST!', sub: 'Zoom zoom!', t: 2, col: '#3cd070' }; }
  if (c === 'mega') { P.megaT = 10; game.banner = { text: 'MEGA INHALE!', sub: 'Super suction + double damage!', t: 2, col: '#b05aff' }; }
}
function updateItems(dt) {
  for (const it of items) {
    if (it.dead) continue;
    it.t += dt;
    if (it.life !== undefined) { it.life -= dt; if (it.life <= 0) { it.dead = true; continue; } }
    if (it.phys) {
      it.vy = (it.vy || 0) + 900 * dt; const b = { x: it.x - it.r, y: it.y - it.r, w: it.r * 2, h: it.r * 2, vx: it.vx || 0, vy: it.vy };
      moveX(b, b.vx * dt); moveY(b, b.vy * dt, false);
      if (b.onGround) { b.vy = it.bounce ? -200 : 0; b.vx *= 0.7; }
      it.x = b.x + it.r; it.y = b.y + it.r; it.vx = b.vx; it.vy = b.vy;
      if (it.y > game.L.h * T + 50) it.dead = true;
    }
    if (it.t < 0.25 && it.phys) continue;
    if (Math.abs(P.x + P.w / 2 - it.x) < P.w / 2 + it.r && Math.abs(P.y + P.h / 2 - it.y) < P.h / 2 + it.r && !P.dead) collect(it);
  }
  items = items.filter(i => !i.dead);
}

// ---------------- projectiles / melee ----------------
function updateProjs(dt) {
  for (const pr of projs) {
    if (pr.dead) continue;
    if (pr.delay > 0) { pr.delay -= dt; continue; }
    pr.t = (pr.t || 0) + dt; pr.life -= dt; if (pr.life <= 0) { pr.dead = true; continue; }
    if (pr.grav) pr.vy += pr.grav * dt;
    pr.x += pr.vx * dt; pr.y += pr.vy * dt;
    if (pr.kind === 'fire') { pr.w += dt * 30; pr.h += dt * 30; pr.x -= dt * 15; pr.y -= dt * 15; }
    if (pr.own === 'p') {
      if (pr.breaks && breakTiles(pr, pr.breaks) && !pr.pierce && pr.kind !== 'fire') { pr.dead = true; continue; }
      if (pr.kind !== 'shock' && pr.kind !== 'fire' && boxSolid(pr.x + 3, pr.y + 3, pr.w - 6, pr.h - 6)) { pr.dead = true; if (pr.kind === 'star') burst(pr.x + 12, pr.y + 12, 6); continue; }
      if (pr.kind === 'fire' && boxSolid(pr.x + 4, pr.y + 4, pr.w - 8, pr.h - 8)) { pr.dead = true; continue; }
      if (pr.kind === 'shock' && !boxSolid(pr.x, pr.y + pr.h + 2, pr.w, 4)) { pr.dead = true; continue; }
      const mult = P.megaT > 0 ? 2 : 1;
      for (const e of enemies) if (e.alive && overlap(pr, e)) { damageEnemy(e, pr.dmg * mult, pr.x + pr.w / 2); if (!pr.pierce) { pr.dead = true; break; } }
      if (!pr.dead) for (const hz of hazards) if (hz.k === 'roller' && !hz.dead && overlap(pr, hz)) { hz.hp -= pr.dmg * mult; hz.flash = 0.1; SFX.hit(); if (hz.hp <= 0) { hz.dead = true; burst(hz.x + hz.w / 2, hz.y + hz.h / 2, 10, '#ccc'); addScore(100, hz.x, hz.y); } if (!pr.pierce) pr.dead = true; break; }
      if (!pr.dead && boss && boss.alive && bossHittable() && overlap(pr, bossBox())) { damageBoss(pr.dmg * mult, pr.pow, pr.x + pr.w / 2, pr.y + pr.h / 2); pr.dead = true; }
    } else {
      if (boxSolid(pr.x + 2, pr.y + 2, pr.w - 4, pr.h - 4) && pr.kind !== 'wave' && pr.kind !== 'shockE') { pr.dead = true; burst(pr.x, pr.y, 4, '#ccc', 60); continue; }
      if (pr.kind === 'shockE' && !boxSolid(pr.x, pr.y + pr.h + 2, pr.w, 4)) { pr.dead = true; continue; }
      if (overlap(pr, P)) { hurtPlayer(pr.x + pr.w / 2, pr.dmg || 1); if (P.inv > 1.5) pr.dead = true; }
    }
    if (pr.x < cam.x - 200 || pr.x > cam.x + VIEW_W + 200) pr.dead = true;
  }
  projs = projs.filter(p => !p.dead);
  for (const m of melees) {
    m.life -= dt;
    const cx = P.x + P.w / 2;
    m.x = P.face > 0 ? cx + m.ox : cx - m.ox - m.w; m.y = P.y + m.oy; m.h = Math.max(m.h, 10);
    if (m.kind === 'charge') { m.h = P.h; m.y = P.y; if (P.chargeT <= 0) m.life = 0; }
    breakTiles(m, m.breaks);
    const mult = P.megaT > 0 ? 2 : 1;
    for (const e of enemies) if (e.alive && !m.hit.has(e) && overlap(m, e)) { m.hit.add(e); damageEnemy(e, m.dmg * mult, cx); }
    for (const hz of hazards) if ((hz.k === 'roller' || hz.k === 'car') && !hz.dead && !m.hit.has(hz) && overlap(m, hz) && (hz.k === 'roller' || m.kind === 'charge')) { m.hit.add(hz); hz.dead = true; burst(hz.x + hz.w / 2, hz.y + hz.h / 2, 12, '#ccc'); addScore(150, hz.x, hz.y); SFX.break(); }
    if (boss && boss.alive && !m.hit.has(boss) && bossHittable() && overlap(m, bossBox())) { m.hit.add(boss); damageBoss(m.dmg * mult, m.pow, m.x + m.w / 2, m.y + m.h / 2); }
  }
  melees = melees.filter(m => m.life > 0);
}

// ---------------- hazards / movers / generators ----------------
function updateWorldObjs(dt) {
  for (const m of movers) {
    const ox = m.x, oy = m.y; m.t += dt;
    const dist = Math.max(Math.abs(m.dx), Math.abs(m.dy)), period = dist / m.spd * 2 + 1.2;
    const ph = (m.t % period) / period;
    let f = ph < 0.5 ? clamp((ph * period - 0.3) / (period / 2 - 0.6), 0, 1) : 1 - clamp(((ph - 0.5) * period - 0.3) / (period / 2 - 0.6), 0, 1);
    f = 0.5 - 0.5 * Math.cos(f * Math.PI);
    m.x = m.x0 + m.dx * f; m.y = m.y0 + m.dy * f; m.pdx = m.x - ox; m.pdy = m.y - oy;
  }
  for (const hz of hazards) {
    if (hz.dead) continue;
    if (hz.k === 'pend') {
      hz.t += dt; const ox = hz.x, oy = hz.y;
      const a = hz.amp * Math.sin(hz.t * Math.sqrt(1500 / hz.len) * 0.9);
      const ex = hz.ax * T + Math.sin(a) * hz.len, ey = hz.ay * T + Math.cos(a) * hz.len;
      hz.ex = ex; hz.ey = ey;
      if (hz.ride) { hz.x = ex - hz.w / 2; hz.y = ey; hz.pdx = hz.x - ox; hz.pdy = hz.y - oy; }
      else { hz.x = ex - 20; hz.y = ey - 20; hz.w = 40; hz.h = 40; if (Math.hypot(P.x + P.w / 2 - ex, P.y + P.h / 2 - ey) < 30) hurtPlayer(ex, 1, 'contact'); }
    } else if (hz.k === 'faller') {
      hz.t += dt;
      if (hz.st === 'wait' && Math.abs(P.x + P.w / 2 - (hz.x + 12)) < 90 && P.y > hz.y) { hz.st = 'shake'; hz.t = 0; }
      else if (hz.st === 'shake' && hz.t > 0.6) { hz.st = 'fall'; hz.vy = 0; }
      else if (hz.st === 'fall') {
        hz.vy += 1200 * dt; hz.y += hz.vy * dt;
        if (overlap(hz, P)) hurtPlayer(hz.x + 12, 1);
        if (boxSolid(hz.x + 2, hz.y + hz.h - 4, hz.w - 4, 6)) { hz.st = 'gone'; SFX.thump(); burst(hz.x + 12, hz.y + hz.h, 8, '#bbb', 150); hz.t = 0; }
        if (hz.y > game.L.h * T) { hz.st = 'gone'; hz.t = 0; }
      } else if (hz.st === 'gone' && hz.t > 4) { hz.st = 'wait'; hz.y = hz.y0; hz.t = 0; }
    } else if (hz.k === 'roller') {
      hz.t += dt; hz.vy += 1300 * dt; hz.rot = (hz.rot || 0) - hz.vx * dt / 14;
      if (hz.flash > 0) hz.flash -= dt;
      moveX(hz, hz.vx * dt); moveY(hz, hz.vy * dt, false);
      if (hz.wall || hz.x < hz.x0 - 64 || hz.y > game.L.h * T) hz.dead = true;
      if (overlap({ x: hz.x + 4, y: hz.y + 4, w: hz.w - 8, h: hz.h - 8 }, P)) hurtPlayer(hz.x + hz.w / 2, 1, 'contact');
    } else if (hz.k === 'car') {
      hz.x += hz.vx * dt; hz.t += dt;
      if (hz.x < hz.x0 - 80) hz.dead = true;
      if (P.x + P.w > hz.x + 4 && P.x < hz.x + hz.w - 4 && P.y + P.h > hz.y && P.y < hz.y + hz.h) {
        if (P.vy > 0 && P.y + P.h - P.vy * dt <= hz.y + 8) { P.y = hz.y - P.h; P.vy = -420; P.jumps = 1; SFX.bounce(); }
        else hurtPlayer(hz.x + hz.w / 2, 1, 'contact');
      }
    }
  }
  hazards = hazards.filter(h => !h.dead);
  for (const g of gens) {
    const near = P.x > g.x0 - 120 && P.x < g.x + 40;
    g.t -= dt;
    if (near && g.t <= 0) {
      if (g.k === 'roll') { g.t = 3.4 - Math.min(1.2, game.wi * 0.15); hazards.push({ k: 'roller', x: g.x - 10, y: g.y - 30, w: 28, h: 28, vx: -140 - game.wi * 8, vy: 0, x0: g.x0, hp: 3, t: 0 }); }
      else { g.t = 2.8 + Math.random() * 1.5; hazards.push({ k: 'car', x: g.x, y: g.y - 24, w: 62, h: 24, vx: -(160 + Math.random() * 60), x0: g.x0, col: ['#e83a3a', '#3a7ae8', '#f0c020', '#30b060'][Math.floor(Math.random() * 4)], t: 0 }); SFX.thump(); }
    }
  }
  for (const [i, c] of crumbles) {
    if (c.gone > 0) { c.gone -= dt; if (c.gone <= 0) crumbles.delete(i); }
    else { c.t -= dt; if (c.t <= 0) { c.gone = 3.5; const tx = i % game.L.w, ty = Math.floor(i / game.L.w); for (let k = 0; k < 4; k++) part({ x: tx * T + 16, y: ty * T + 6, vx: (Math.random() - 0.5) * 80, vy: Math.random() * 50, life: 0.6, col: '#b8864e', size: 5, grav: 1, kind: 'chunk' }); } }
  }
  for (const pr of props) {
    if (pr.k === 'checkpoint' && !pr.on && Math.abs(P.x + P.w / 2 - pr.x) < 22 && Math.abs(P.y + P.h - pr.y) < 60) {
      pr.on = true; game.cp = { x: pr.x - T / 2, y: pr.y }; SFX.checkpoint(); burst(pr.x, pr.y - 50, 10, '#7aff7a'); floatText('CHECKPOINT!', pr.x, pr.y - 70, '#7aff7a'); P.hp = Math.max(P.hp, Math.min(P.maxhp, P.hp + 1));
    }
    if (pr.k === 'goal' && !P.victory && P.x + P.w > pr.x - 10 && Math.abs(P.y + P.h - pr.y) < 140) stageClear();
    if (pr.k === 'door' && Math.abs(P.x + P.w / 2 - pr.x) < 20 && Math.abs(P.y + P.h - pr.y) < 10) { pr.near = true; if (pressed.down && P.onGround) enterDoor(pr); } else pr.near = false;
  }
}

// ---------------- doors / bonus ----------------
function enterDoor(d) {
  SFX.checkpoint();
  if (d.to === 'bonus') {
    game.stash = { L: game.L, enemies, items, props, movers, hazards, gens, zones, cp: game.cp, px: d.x, py: d.y, si: game.si, stats: game.stageStats };
    const L = genBonus(game.wi); loadLevel(L); game.si = 5; placePlayer(L.start.x, L.start.y); game.bonusT = 25;
    game.banner = { text: 'BONUS ROOM!', sub: 'Grab everything before time runs out!', t: 2 }; playMusic(BONUS_MUSIC);
  } else exitBonus();
}
function exitBonus() {
  const s = game.stash; if (!s) return;
  SAVE.bonus[game.wi] = 1; persist();
  game.L = s.L; enemies = s.enemies; items = s.items; props = s.props; movers = s.movers; hazards = s.hazards; gens = s.gens; zones = s.zones; game.cp = s.cp; game.si = s.si;
  projs = []; parts = []; melees = []; crumbles.clear(); game.stash = null;
  placePlayer(s.px - T / 2, s.py); playMusic(WORLDS[game.wi].music);
  game.banner = { text: 'Back to the adventure!', sub: '', t: 1.5 };
}

// ---------------- stage flow ----------------
function stageClear() {
  P.victory = true; P.vx = 0; suckStop(); P.inhaling = false;
  SFX.victory();
  const key = `${game.wi}-${game.si}`;
  SAVE.done[key] = 1; persist();
  game.clearT = 0;
  setTimeout(() => { if (game.state === 'play') game.state = 'clear'; }, 2200);
}

// ---------------- camera ----------------
function updateCamera(dt) {
  const L = game.L, mw = L.w * T, mh = L.h * T;
  let tx = P.x + P.w / 2 - VIEW_W / 2 + P.face * 50;
  if (boss && boss.alive) tx = (P.x + P.w / 2 + boss.x + boss.w / 2) / 2 - VIEW_W / 2;
  cam.x = lerp(cam.x, tx, Math.min(1, dt * 4));
  if (mw <= VIEW_W) cam.x = (mw - VIEW_W) / 2; else cam.x = clamp(cam.x, 0, mw - VIEW_W);
  const feet = P.y + P.h, ty0 = feet - VIEW_H * 0.74;
  if (cam.ty === undefined) cam.ty = ty0;
  if (P.onGround || P.y < cam.y + 50 || feet > cam.y + VIEW_H - 30 || game.L.kind !== 'stage') cam.ty = ty0;
  cam.y = lerp(cam.y, cam.ty, Math.min(1, dt * 3.5));
  cam.y = clamp(cam.y, 0, mh - VIEW_H);
  if (cam.shake > 0) cam.shake = Math.max(0, cam.shake - dt * 25);
}

// ---------------- main update ----------------
function updatePlay(dt) {
  game.t += dt;
  if (game.banner) { game.banner.t -= dt; if (game.banner.t <= 0) game.banner = null; }
  if (game.freeze > 0) { game.freeze -= dt; P.transformT -= dt; P.anim += dt; updateParts(dt); return; }
  if (P.transformT > 0) P.transformT -= dt;
  game.stageStats.t += dt;
  if (game.si === 5 && game.stash) { game.bonusT -= dt; if (game.bonusT <= 0) { exitBonus(); return; } }
  updatePlayer(dt);
  if (!P.dead && !P.victory) {
    for (const e of enemies) e.sucked = false;
    doInhale(dt);
  }
  const ax0 = cam.x - 120, ax1 = cam.x + VIEW_W + 120;
  for (const e of enemies) {
    if (!e.alive) continue;
    if (e.x + e.w < ax0 || e.x > ax1) continue;
    updateEnemy(e, dt);
    if (!P.dead && !P.victory && overlap(e, P) && !e.sucked) {
      if (P.rainbowT > 0 || P.chargeT > 0 || P.slideT > 0) damageEnemy(e, P.rainbowT > 0 ? 99 : 2, P.x + P.w / 2);
      else if (P.stomp) { damageEnemy(e, 3, P.x + P.w / 2); P.vy = -300; }
      else hurtPlayer(e.x + e.w / 2, 1, 'contact');
    }
  }
  enemies = enemies.filter(e => e.alive);
  if (boss) updateBoss(dt);
  updateWorldObjs(dt);
  updateProjs(dt);
  updateItems(dt);
  updateParts(dt);
  updateCamera(dt);
}
function updateParts(dt) {
  for (const p of parts) {
    p.t += dt;
    if (p.kind === 'swirl') { const f = p.t / p.life; p.cx = lerp(p.x, p.tx, f); p.cy = lerp(p.y, p.ty, f) + Math.sin(f * 10) * 4; }
    else { if (p.grav) p.vy += 700 * dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.kind === 'star') { p.vx *= 0.94; p.vy *= 0.94; } }
  }
  parts = parts.filter(p => p.t < p.life);
}
