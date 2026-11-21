// ================= UI / SCREENS / LOOP =================
const ui = {
  list: [], prev: [], def: null,
  btn(x, y, w, h, fn) { this.list.push({ x, y, w, h, fn }); },
  button(c, x, y, w, h, label, col, fn, size = 14, enabled = true) {
    rrect(c, x, y + 3, w, h, h / 2.4, 'rgba(0,0,0,.3)', null);
    rrect(c, x, y, w, h, h / 2.4, enabled ? col : '#888', OUT, 2.5);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.beginPath(); c.roundRect(x + 4, y + 3, w - 8, h * 0.35, h / 3); c.fill();
    txt(c, label, x + w / 2, y + h / 2 + 1, size, '#fff');
    if (enabled) this.btn(x, y, w, h, fn);
  },
};
let selWorld = 0, resetArm = 0, shopMsg = '', shopMsgT = 0;
const WORLD_COLS = ['#3fae4a', '#2f8a5a', '#e8a040', '#6fb8e8', '#2fb8d8', '#7a6ad8'];
function bgGradient(c, a, b) { const g = c.createLinearGradient(0, 0, 0, VIEW_H); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H); }
function panel(c, w, h, col = 'rgba(255,248,230,.97)') { const x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2; rrect(c, x, y + 4, w, h, 18, 'rgba(0,0,0,.3)', null); rrect(c, x, y, w, h, 18, col, OUT, 3); return { x, y }; }
function dim(c) { c.fillStyle = 'rgba(10,10,30,.55)'; c.fillRect(0, 0, VIEW_W, VIEW_H); }

function worldIcon(c, i, x, y, r) {
  c.save(); c.translate(x, y);
  if (i === 0) { c.fillStyle = '#6a4a2a'; c.fillRect(-3, -2, 6, r * 0.7); c.fillStyle = '#2f9a30'; c.beginPath(); ell(c, 0, -6, r * 0.6, r * 0.38); ell(c, -8, -2, r * 0.35, r * 0.25); ell(c, 8, -2, r * 0.35, r * 0.25); c.fill(); }
  if (i === 1) { c.fillStyle = '#f6ecd6'; c.fillRect(-4, -2, 8, r * 0.6); shape(c, '#e85a5a', 1.5, () => { c.moveTo(-r * 0.6, 0); c.quadraticCurveTo(0, -r * 0.9, r * 0.6, 0); c.closePath(); }); c.fillStyle = '#fff'; c.beginPath(); ell(c, -5, -6, 2.5, 2); ell(c, 5, -8, 2.5, 2); c.fill(); }
  if (i === 2) { shape(c, '#e8b060', 1.5, () => { c.moveTo(-r * 0.6, r * 0.4); c.lineTo(0, -r * 0.55); c.lineTo(r * 0.6, r * 0.4); c.closePath(); }); c.strokeStyle = '#b07a30'; c.lineWidth = 1; c.beginPath(); c.moveTo(-r * 0.3, 0); c.lineTo(r * 0.3, 0); c.moveTo(-r * 0.45, r * 0.2); c.lineTo(r * 0.45, r * 0.2); c.stroke(); }
  if (i === 3) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.lineCap = 'round'; for (let k = 0; k < 3; k++) { c.save(); c.rotate(k * Math.PI / 3); c.beginPath(); c.moveTo(0, -r * 0.55); c.lineTo(0, r * 0.55); c.moveTo(-5, -r * 0.4); c.lineTo(0, -r * 0.3); c.lineTo(5, -r * 0.4); c.stroke(); c.restore(); } }
  if (i === 4) { c.strokeStyle = '#8a6040'; c.lineWidth = 3; c.beginPath(); c.moveTo(-2, r * 0.5); c.quadraticCurveTo(0, 0, 4, -r * 0.35); c.stroke(); c.fillStyle = '#2f9a40'; for (let k = 0; k < 4; k++) { c.beginPath(); const a = -Math.PI + k * 1; c.moveTo(4, -r * 0.35); c.quadraticCurveTo(4 + Math.cos(a) * 10, -r * 0.5 + Math.sin(a) * 4, 4 + Math.cos(a) * 16, -r * 0.25); c.quadraticCurveTo(4 + Math.cos(a) * 8, -r * 0.3, 4, -r * 0.3); c.fill(); } c.fillStyle = '#2a8ad8'; c.fillRect(-r * 0.6, r * 0.42, r * 1.2, 4); }
  if (i === 5) { const bs = [[-12, 14, 8, 26], [-3, 14, 9, 34], [7, 14, 8, 22]]; for (const [bx, by, bw, bh] of bs) { shape(c, '#5a5a8a', 1.2, () => c.rect(bx, by - bh, bw, bh)); c.fillStyle = '#ffe080'; for (let yy = by - bh + 3; yy < by - 2; yy += 5) c.fillRect(bx + 2, yy, 2, 2), c.fillRect(bx + bw - 4, yy, 2, 2); } }
  c.restore();
}
function mapNodes() {
  const n = 6, mx = SAFE.l + 50, Mx = VIEW_W - SAFE.r - 50, out = [];
  for (let i = 0; i < n; i++) out.push({ x: mx + (Mx - mx) * i / (n - 1), y: i % 2 ? VIEW_H * 0.62 : VIEW_H * 0.42 });
  return out;
}

// ---------- screens ----------
function drawTitle(c) {
  buildBG(0); buildTiles(0);
  drawBG(c, game.t * 30, 0, game.t);
  c.fillStyle = 'rgba(0,0,0,.15)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
  for (let x = -((game.t * 30) % T); x < VIEW_W; x += T) { c.drawImage(TILES.top, x, VIEW_H - 40, T + 0.5, T); c.drawImage(TILES.dirt, x, VIEW_H - 8, T + 0.5, T); }
  const cx = VIEW_W / 2;
  drawDino(c, cx + 150 + Math.sin(game.t) * 10, VIEW_H - 40, EN.rex, -1, { t: game.t, walk: game.t * 8, jaw: Math.sin(game.t * 3) > 0.5 ? 1 : 0 }, 2.2);
  drawDino(c, cx - 170, VIEW_H - 40, EN.theri, 1, { t: game.t, walk: game.t * 6 }, 1.6);
  drawDino(c, cx + 60, 70 + Math.sin(game.t * 2) * 8, EN.ptero, -1, { t: game.t }, 1.2);
  const bounce = Math.abs(Math.sin(game.t * 3)) * 8;
  drawLinusSprite(c, Math.floor(game.t * 1.5) % 4 === 3 ? 'inhaleMega' : 'cheer', cx - 20, VIEW_H - 38 - bounce, 1, { scale: 1.9 });
  c.save(); c.translate(cx, 52); c.rotate(Math.sin(game.t * 2) * 0.03);
  txt(c, HERO.name, 0, 0, 48, '#ffd23a', 'center', 9);
  txt(c, 'DINOSAUR DEVOURER', 0, 40, 22, '#ff6a4a', 'center', 6);
  c.restore();
  if (Math.floor(game.t * 2) % 2 === 0) txt(c, IS_TOUCH ? 'TAP TO START' : 'CLICK OR PRESS ENTER', cx, VIEW_H - 18, 14, '#fff');
  ui.btn(0, 0, VIEW_W, VIEW_H, () => { SFX.click(); game.state = 'map'; playMusic(MAP_MUSIC); });
  ui.def = () => { game.state = 'map'; playMusic(MAP_MUSIC); };
}
function drawMap(c) {
  bgGradient(c, '#5ec8ff', '#1f7ac8');
  c.fillStyle = 'rgba(255,255,255,.15)';
  for (let i = 0; i < 20; i++) { c.fillRect(((i * 97 + game.t * 10) % (VIEW_W + 40)) - 20, 60 + (i * 53) % (VIEW_H - 60), 22, 2); }
  const N = mapNodes();
  c.strokeStyle = '#fff6d0'; c.lineWidth = 5; c.setLineDash([2, 10]); c.lineCap = 'round';
  c.beginPath(); N.forEach((n, i) => i ? c.lineTo(n.x, n.y) : c.moveTo(n.x, n.y)); c.stroke(); c.setLineDash([]);
  N.forEach((n, i) => {
    const locked = i >= SAVE.unlocked, done = SAVE.done[`${i}-4`];
    shape(c, locked ? '#7a8a7a' : '#f6dca0', 2, () => ell(c, n.x, n.y + 14, 40, 16));
    shape(c, locked ? '#888' : WORLD_COLS[i], 3, () => ell(c, n.x, n.y, 28, 28));
    if (!locked) worldIcon(c, i, n.x, n.y, 26);
    else { shape(c, '#ccc', 2, () => c.roundRect(n.x - 9, n.y - 4, 18, 15, 3)); c.strokeStyle = '#ccc'; c.lineWidth = 3; c.beginPath(); c.arc(n.x, n.y - 5, 6, Math.PI, 0); c.stroke(); }
    txt(c, `${i + 1}. ${WORLDS[i].name}`, n.x, n.y + 40, 11, locked ? '#ccc' : '#fff');
    let cnt = 0; for (let s = 0; s < 5; s++) if (SAVE.done[`${i}-${s}`]) cnt++;
    if (!locked) for (let s = 0; s < 5; s++) shape(c, SAVE.done[`${i}-${s}`] ? (s === 4 ? '#ff5a5a' : '#ffe14a') : 'rgba(0,0,0,.35)', 1, () => ell(c, n.x - 20 + s * 10, n.y + 54, 3.5, 3.5));
    if (done) drawStar(c, n.x + 22, n.y - 22, 9, '#ffe14a', 0, 2);
    if (!locked) ui.btn(n.x - 36, n.y - 36, 72, 96, () => { selWorld = i; game.state = 'stages'; SFX.click(); });
  });
  const cur = clamp(SAVE.unlocked - 1, 0, 5);
  linusHead(c, N[cur].x, N[cur].y - 44 - Math.abs(Math.sin(game.t * 4)) * 6, 13);
  // top bar
  const top = SAFE.t + 6;
  rrect(c, SAFE.l + 8, top, VIEW_W - SAFE.l - SAFE.r - 16, 26, 13, 'rgba(0,0,0,.35)', null);
  linusHead(c, SAFE.l + 24, top + 13, 9); txt(c, '×' + SAVE.lives, SAFE.l + 37, top + 14, 11, '#fff', 'left');
  drawCoin(c, SAFE.l + 78, top + 13, 6, game.t); txt(c, '' + SAVE.coins, SAFE.l + 88, top + 14, 11, '#ffe060', 'left');
  const gold = Object.keys(SAVE.golden).length;
  drawGolden(c, SAFE.l + 140, top + 21, 0.4, game.t); txt(c, gold + '/30', SAFE.l + 152, top + 14, 11, '#ffd23a', 'left');
  txt(c, 'SCORE ' + SAVE.score, VIEW_W / 2 + 20, top + 14, 11, '#fff');
  POW_ORDER.forEach((pw, i) => powIcon(c, pw, VIEW_W - SAFE.r - 30 - (5 - i) * 20, top + 13, 8, !SAVE.powers[pw]));
  // bottom buttons
  const by = VIEW_H - SAFE.b - 40;
  ui.button(c, SAFE.l + 12, by, 84, 32, 'SHOP', '#ff9a3a', () => { game.state = 'shop'; SFX.click(); }, 13);
  ui.button(c, SAFE.l + 104, by, 84, 32, 'STATS', '#7a6ad8', () => { game.state = 'stats'; SFX.click(); }, 13);
  ui.button(c, VIEW_W - SAFE.r - 96, by, 84, 32, SAVE.muted ? 'SOUND: OFF' : 'SOUND: ON', '#3a9ad8', () => { setMuted(!SAVE.muted); SFX.click(); }, 10);
  txt(c, 'Choose a world!', VIEW_W / 2, VIEW_H - SAFE.b - 22, 13, '#fff');
  ui.def = () => { selWorld = cur; game.state = 'stages'; };
}
function stageOpen(w, s) { return s === 0 || SAVE.done[`${w}-${s - 1}`]; }
function drawStages(c) {
  drawMap(c); ui.list = []; dim(c);
  const w = Math.min(470, VIEW_W - 20), h = 210, { x, y } = panel(c, w, h);
  txt(c, `WORLD ${selWorld + 1}: ${WORLDS[selWorld].name}`, x + w / 2, y + 24, 18, WORLD_COLS[selWorld]);
  const n = 5, bw = Math.min(76, (w - 40) / 5 - 8);
  for (let s = 0; s < n; s++) {
    const bx = x + 20 + s * ((w - 40) / 5) + ((w - 40) / 5 - bw) / 2, by = y + 52;
    const open = stageOpen(selWorld, s), done = SAVE.done[`${selWorld}-${s}`];
    ui.button(c, bx, by, bw, bw, s === 4 ? '' : '' + (s + 1), s === 4 ? '#d84a4a' : WORLD_COLS[selWorld], () => { SFX.click(); startStage(selWorld, s); }, 24, open);
    if (s === 4) { c.save(); c.beginPath(); c.roundRect(bx + 3, by + 3, bw - 6, bw - 6, 20); c.clip(); dinoHead(c, WORLDS[selWorld].boss, bx + bw / 2, by + bw / 2, bw * 0.5); c.restore(); }
    if (!open) { c.fillStyle = 'rgba(0,0,0,.4)'; c.beginPath(); c.roundRect(bx, by, bw, bw, bw / 2.4); c.fill(); txt(c, '🔒', bx + bw / 2, by + bw / 2, 20, '#fff', 'center', 0); }
    if (done) drawStar(c, bx + bw - 6, by + 6, 9, '#ffe14a', 0, 2);
    txt(c, s === 4 ? 'BOSS' : 'STAGE ' + (s + 1), bx + bw / 2, by + bw + 14, 10, '#5a3a20', 'center', 0);
    if (s < 4 && SAVE.golden[`${selWorld}-${s}`]) drawGolden(c, bx + 10, by + bw + 4, 0.35, game.t);
  }
  const bonus = SAVE.bonus[selWorld];
  txt(c, bonus ? '✔ Bonus room found! (+ golden dino in bonus: ' + (SAVE.golden[`${selWorld}-bonus`] ? 'yes' : 'not yet') + ')' : 'Secret doors hide in stages 2 and 4!', x + w / 2, y + h - 52, 10, '#7a5a30', 'center', 0);
  txt(c, 'Boss is weak to ' + POW[WORLDS[selWorld].weak].name + ' power', x + w / 2, y + h - 38, 10, POW[WORLDS[selWorld].weak].dark, 'center', 0);
  ui.button(c, x + w / 2 - 50, y + h - 28, 100, 22, 'BACK', '#8a7a6a', () => { game.state = 'map'; SFX.click(); }, 11);
  ui.def = () => { const s = [0, 1, 2, 3, 4].filter(s => stageOpen(selWorld, s) && !SAVE.done[`${selWorld}-${s}`])[0]; startStage(selWorld, s === undefined ? 0 : s); };
}
function drawPause(c) {
  drawPlay(); ui.list = []; dim(c);
  const w = 260, h = 210, { x, y } = panel(c, w, h);
  txt(c, 'PAUSED', x + w / 2, y + 26, 22, '#ff8a3a');
  ui.button(c, x + 30, y + 50, w - 60, 32, 'RESUME', '#3cb85a', () => { game.state = 'play'; SFX.click(); });
  ui.button(c, x + 30, y + 90, w - 60, 32, 'RESTART STAGE', '#e8a030', () => { SFX.click(); startStage(game.wi, game.stash ? game.stash.si : game.si); });
  ui.button(c, x + 30, y + 130, w - 60, 32, 'WORLD MAP', '#7a6ad8', () => { SFX.click(); toMap(); });
  ui.button(c, x + 30, y + 170, w - 60, 28, SAVE.muted ? 'SOUND: OFF' : 'SOUND: ON', '#3a9ad8', () => { setMuted(!SAVE.muted); }, 11);
  ui.def = () => { game.state = 'play'; };
}
function toMap() { game.state = 'map'; game.stash = null; suckStop(); playMusic(MAP_MUSIC); persist(); }
function nextStage() {
  const s = game.si + 1;
  if (s <= 4) startStage(game.wi, s); else toMap();
}
function drawClear(c) {
  drawPlay(); ui.list = []; dim(c);
  const w = 320, h = 220, { x, y } = panel(c, w, h);
  txt(c, 'STAGE CLEAR!', x + w / 2, y + 26, 24, '#ffb020');
  drawLinusSprite(c, 'cheer', x + 58, y + 150 - Math.abs(Math.sin(game.t * 5)) * 6, 1, { scale: 1.6 });
  const s = game.stageStats;
  const rows = [['Coins', s.coins], ['Stars', s.stars], ['Dinos swallowed', s.dinos], ['Mystery eggs', s.eggs], ['Golden dino', s.golden ? 'YES!' : (SAVE.golden[`${game.wi}-${game.si}`] ? 'found' : 'hidden...')], ['Stage score', s.score]];
  rows.forEach(([k, v], i) => { txt(c, k, x + 118, y + 56 + i * 18, 11, '#5a3a20', 'left', 0); txt(c, '' + v, x + w - 20, y + 56 + i * 18, 11, '#c86a10', 'right', 0); });
  ui.button(c, x + 110, y + h - 40, 90, 30, 'MAP', '#7a6ad8', () => { SFX.click(); toMap(); }, 13);
  ui.button(c, x + 210, y + h - 40, 90, 30, game.si === 3 ? 'BOSS ▶' : 'NEXT ▶', '#3cb85a', () => { SFX.click(); nextStage(); }, 13);
  ui.def = nextStage;
}
function drawBossClear(c) {
  drawPlay(); ui.list = []; dim(c);
  const w = 340, h = 200, { x, y } = panel(c, w, h);
  txt(c, `WORLD ${game.wi + 1} CLEAR!`, x + w / 2, y + 28, 24, '#ffb020');
  txt(c, `You beat the ${WORLDS[game.wi].bossName}!`, x + w / 2, y + 56, 12, '#5a3a20', 'center', 0);
  drawLinusSprite(c, 'cheer', x + w / 2, y + 150 - Math.abs(Math.sin(game.t * 5)) * 8, 1, { scale: 1.5 });
  if (game.wi < 5) txt(c, `${WORLDS[game.wi + 1].name} is now open!`, x + w / 2, y + 76, 12, WORLD_COLS[game.wi + 1], 'center', 0);
  ui.button(c, x + 16, y + h - 42, 100, 32, 'MAP', '#7a6ad8', () => { SFX.click(); toMap(); }, 13);
  ui.button(c, x + w - 136, y + h - 42, 120, 32, 'NEXT WORLD ▶', '#3cb85a', () => { SFX.click(); startStage(game.wi + 1, 0); }, 12);
  ui.def = () => startStage(game.wi + 1, 0);
}
function drawEnding(c) {
  bgGradient(c, '#ff9a6a', '#3a2d6a');
  for (let i = 0; i < 6; i++) { const a = game.t * 0.5 + i; drawStar(c, VIEW_W / 2 + Math.cos(a) * 220, 120 + Math.sin(a * 1.3) * 80, 10, '#ffe14a', a); }
  txt(c, `YOU DID IT, ${HERO.name}!`, VIEW_W / 2, 40, 28, '#ffd23a', 'center', 7);
  txt(c, 'All six worlds are safe from the giant dinosaurs!', VIEW_W / 2, 72, 12, '#fff');
  drawLinusSprite(c, 'cheer', VIEW_W / 2, VIEW_H - 50 - Math.abs(Math.sin(game.t * 4)) * 10, 1, { scale: 2.2 });
  drawDino(c, VIEW_W / 2 - 150, VIEW_H - 50, EN.indo, 1, { t: game.t, walk: 0, angry: false }, 1.6);
  drawDino(c, VIEW_W / 2 + 150, VIEW_H - 50, EN.rex, -1, { t: game.t, angry: false, jaw: 1 }, 1.6);
  txt(c, `Score ${SAVE.score}   •   Golden dinos ${Object.keys(SAVE.golden).length}/30   •   Dinos swallowed ${SAVE.swallowed}`, VIEW_W / 2, VIEW_H - 22, 10, '#fff');
  ui.button(c, VIEW_W - SAFE.r - 110, 96, 96, 30, 'MAP', '#7a6ad8', () => { SFX.click(); toMap(); }, 13);
  ui.def = toMap;
}
function drawGameOver(c) {
  bgGradient(c, '#2a1d40', '#100820');
  txt(c, 'GAME OVER', VIEW_W / 2, 60, 34, '#ff6a6a', 'center', 7);
  drawLinusSprite(c, 'hurt', VIEW_W / 2, 200, 1, { scale: 1.5 });
  txt(c, `Don't give up! ${HERO.nice} gets 5 more lives.`, VIEW_W / 2, 100, 12, '#fff');
  ui.button(c, VIEW_W / 2 - 150, VIEW_H - 64, 140, 36, 'TRY AGAIN', '#3cb85a', () => { SFX.click(); SAVE.lives = 5; persist(); startStage(game.wi, game.stash ? game.stash.si : game.si); }, 14);
  ui.button(c, VIEW_W / 2 + 10, VIEW_H - 64, 140, 36, 'WORLD MAP', '#7a6ad8', () => { SFX.click(); SAVE.lives = 5; persist(); toMap(); }, 14);
  ui.def = () => { SAVE.lives = 5; startStage(game.wi, game.si); };
}
const SHOP = [
  { k: 'hp', name: 'Extra Heart', desc: 'Start every stage with +1 heart', costs: [60, 120, 200] },
  { k: 'flt', name: 'Super Float', desc: 'Float longer in the air', costs: [50, 110] },
  { k: 'inh', name: 'Mega Lungs', desc: 'Inhale from farther away', costs: [70, 150] },
  { k: 'life', name: 'Extra Life', desc: 'One more try for ' + HERO.nice, costs: [40] },
];
function drawShop(c) {
  bgGradient(c, '#ffcf7a', '#e8803a');
  txt(c, 'DINO SHOP', VIEW_W / 2, SAFE.t + 26, 26, '#fff', 'center', 6);
  drawCoin(c, VIEW_W / 2 - 34, SAFE.t + 54, 7, game.t); txt(c, '' + SAVE.coins + ' coins', VIEW_W / 2 - 22, SAFE.t + 55, 13, '#fff', 'left');
  const w = Math.min(520, VIEW_W - 30), x0 = (VIEW_W - w) / 2;
  SHOP.forEach((it, i) => {
    const y = SAFE.t + 72 + i * 44, lvl = it.k === 'life' ? 0 : SAVE.up[it.k], max = it.k === 'life' ? 1 : it.costs.length;
    const maxed = lvl >= max, cost = it.costs[Math.min(lvl, it.costs.length - 1)];
    rrect(c, x0, y, w, 38, 12, 'rgba(255,255,255,.9)', OUT, 2);
    if (it.k === 'hp') drawHeart(c, x0 + 22, y + 19, 9); else if (it.k === 'life') linusHead(c, x0 + 22, y + 19, 11); else if (it.k === 'flt') drawLinusSprite(c, 'flail', x0 + 22, y + 36, 1, { scale: 0.55 }); else { c.strokeStyle = '#5ab8ff'; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(x0 + 26, y + 19, 4 + k * 4, 2.4, 3.9); c.stroke(); } }
    txt(c, it.name + (it.k !== 'life' ? `  (${lvl}/${max})` : `  (you have ${SAVE.lives})`), x0 + 42, y + 13, 12, '#5a3a20', 'left', 0);
    txt(c, it.desc, x0 + 42, y + 28, 10, '#8a6a40', 'left', 0);
    const ok = !maxed && SAVE.coins >= cost && !(it.k === 'life' && SAVE.lives >= 99);
    ui.button(c, x0 + w - 100, y + 6, 92, 26, maxed ? 'MAXED' : `BUY ${cost}`, ok ? '#3cb85a' : '#b0a090', () => {
      if (!ok) { SFX.deny(); shopMsg = maxed ? 'Already maxed out!' : 'Not enough coins yet — collect more!'; shopMsgT = 2; return; }
      SAVE.coins -= cost; if (it.k === 'life') SAVE.lives++; else SAVE.up[it.k]++; persist(); SFX.oneup(); shopMsg = it.name + ' bought!'; shopMsgT = 2;
    }, 11);
  });
  if (shopMsgT > 0) { shopMsgT -= 1 / 60; txt(c, shopMsg, VIEW_W / 2, VIEW_H - SAFE.b - 52, 12, '#fff'); }
  ui.button(c, VIEW_W / 2 - 60, VIEW_H - SAFE.b - 38, 120, 30, 'BACK', '#7a6ad8', () => { game.state = 'map'; SFX.click(); }, 13);
  ui.def = () => { game.state = 'map'; };
}
function drawStats(c) {
  bgGradient(c, '#9a8ae8', '#4a3a98');
  txt(c, 'ADVENTURE STATS', VIEW_W / 2, SAFE.t + 24, 22, '#fff', 'center', 6);
  let worlds = 0, stages = 0; for (let w = 0; w < 6; w++) { if (SAVE.done[`${w}-4`]) worlds++; for (let s = 0; s < 5; s++) if (SAVE.done[`${w}-${s}`]) stages++; }
  const rows = [['Worlds completed', worlds + ' / 6'], ['Stages completed', stages + ' / 30'], ['Dinosaurs swallowed', SAVE.swallowed], ['Dinosaurs defeated', SAVE.defeated], ['Powers discovered', Object.keys(SAVE.powers).length + ' / 6'],
    ['Golden dinosaurs', Object.keys(SAVE.golden).length + ' / 30'], ['Mystery eggs opened', SAVE.eggs], ['Bonus rooms found', Object.keys(SAVE.bonus).length + ' / 6'], ['Coins', SAVE.coins], ['Total score', SAVE.score]];
  const w = Math.min(380, VIEW_W - 30), x0 = (VIEW_W - w) / 2;
  rrect(c, x0, SAFE.t + 42, w, rows.length * 16 + 12, 12, 'rgba(255,255,255,.92)', OUT, 2);
  rows.forEach(([k, v], i) => { txt(c, k, x0 + 14, SAFE.t + 56 + i * 16, 11, '#3a2a5a', 'left', 0); txt(c, '' + v, x0 + w - 14, SAFE.t + 56 + i * 16, 11, '#6a3ad8', 'right', 0); });
  const py = SAFE.t + 42 + rows.length * 16 + 32;
  POW_ORDER.forEach((pw, i) => { const x = VIEW_W / 2 + (i - 2.5) * 48; powIcon(c, pw, x, py, 15, !SAVE.powers[pw]); txt(c, SAVE.powers[pw] ? POW[pw].name.split(' ')[0] : '???', x, py + 22, 7.5, '#fff', 'center', 2); });
  ui.button(c, VIEW_W / 2 - 130, VIEW_H - SAFE.b - 36, 120, 28, 'BACK', '#3cb85a', () => { game.state = 'map'; resetArm = 0; SFX.click(); }, 12);
  ui.button(c, VIEW_W / 2 + 10, VIEW_H - SAFE.b - 36, 120, 28, resetArm > 0 ? 'TAP AGAIN!' : 'RESET SAVE', '#c84a4a', () => {
    if (resetArm > 0) { const m = SAVE.muted; SAVE = freshSave(); SAVE.muted = m; persist(); resetArm = 0; SFX.break(); } else { resetArm = 3; SFX.deny(); }
  }, 11);
  if (resetArm > 0) resetArm -= 1 / 60;
  ui.def = () => { game.state = 'map'; };
}

// ---------- loop ----------
let lastT = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - lastT) / 1000; lastT = now; if (dt > 0.1) dt = 0.1; if (dt < 0) dt = 0;
  pollInput();
  const taps = uiTaps; uiTaps = [];
  ui.prev = ui.list; ui.list = [];
  const portrait = IS_TOUCH && window.innerHeight > window.innerWidth;
  if (!portrait) for (const tp of taps) {
    if (tp.key) { if (ui.def && game.state !== 'play') { const f = ui.def; f(); } continue; }
    for (let i = ui.prev.length - 1; i >= 0; i--) { const b = ui.prev[i]; if (tp.x >= b.x && tp.x <= b.x + b.w && tp.y >= b.y && tp.y <= b.y + b.h) { b.fn(); break; } }
  }
  ui.def = null;
  if (game.state !== 'play') game.t += dt;
  if (game.state === 'play' && !portrait && imgsLoaded >= imgsTotal) {
    acc += dt; let n = 0;
    while (acc >= 1 / 60 && n < 5) { updatePlay(1 / 60); acc -= 1 / 60; n++; for (const k in pressed) pressed[k] = 0; if (game.state !== 'play') break; }
  }
  const c = ctx;
  c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  c.imageSmoothingEnabled = true;
  switch (game.state) {
    case 'title': drawTitle(c); break;
    case 'map': drawMap(c); break;
    case 'stages': drawStages(c); break;
    case 'play': drawPlay(); break;
    case 'pause': drawPause(c); break;
    case 'clear': drawClear(c); break;
    case 'bossclear': drawBossClear(c); break;
    case 'ending': drawEnding(c); break;
    case 'gameover': drawGameOver(c); break;
    case 'shop': drawShop(c); break;
    case 'stats': drawStats(c); break;
  }
  if (portrait) {
    c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
    c.fillStyle = 'rgba(20,20,40,.92)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
    txt(c, '↻', VIEW_W / 2, VIEW_H / 2 - 40, 40, '#ffd23a');
    const lines = wrap(c, 'Turn your device sideways to play!', VIEW_W - 20, 14);
    lines.forEach((l, i) => txt(c, l, VIEW_W / 2, VIEW_H / 2 + 10 + i * 18, 14, '#fff'));
  }
}
window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 200));
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (game.state === 'play') game.state = 'pause'; suckStop(); if (AU.ctx) AU.ctx.suspend(); } else if (AU.ctx) AU.ctx.resume(); });
resize();
requestAnimationFrame(frame);

window.__game = { game, get P() { return P; }, startStage, SAVE: () => SAVE, get enemies() { return enemies; }, get boss() { return boss; }, input, keys };
