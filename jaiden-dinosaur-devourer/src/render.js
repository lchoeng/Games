// ================= RENDER =================
const FONT = "'Arial Rounded MT Bold','Trebuchet MS','Avenir Next',system-ui,sans-serif";
function txt(c, s, x, y, size, col = '#fff', align = 'center', sw = null, base = 'middle') {
  c.font = `900 ${size}px ${FONT}`; c.textAlign = align; c.textBaseline = base;
  const lw = sw === null ? Math.max(2, size * 0.22) : sw;
  if (lw > 0) { c.lineJoin = 'round'; c.lineWidth = lw; c.strokeStyle = OUT; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y);
}
function wrap(c, s, maxW, size) {
  c.font = `900 ${size}px ${FONT}`; const words = s.split(' '), lines = []; let cur = '';
  for (const w of words) { const t = cur ? cur + ' ' + w : w; if (c.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}
function rrect(c, x, y, w, h, r, fill, stroke = OUT, lw = 2) { c.beginPath(); c.roundRect(x, y, w, h, r); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = lw; c.strokeStyle = stroke; c.stroke(); } }

function drawTiles(c, overlay) {
  const L = game.L, P_ = WORLDS[L.wi].pal;
  const x0 = Math.max(0, Math.floor(cam.x / T) - 1), x1 = Math.min(L.w - 1, Math.floor((cam.x + VIEW_W) / T) + 1);
  const y0 = Math.max(0, Math.floor(cam.y / T) - 1), y1 = Math.min(L.h - 1, Math.floor((cam.y + VIEW_H) / T) + 1);
  const key = WORLDS[L.wi].key;
  const wcol = key === 'arctic' ? 'rgba(70,140,200,0.5)' : key === 'beach' ? 'rgba(40,190,210,0.45)' : key === 'city' ? 'rgba(60,110,150,0.55)' : 'rgba(50,140,230,0.45)';
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    const t = L.t[ty * L.w + tx]; if (!t) continue;
    const X = tx * T, Y = ty * T;
    if (!overlay) {
      let img = null;
      switch (t) {
        case TL.G: { const a = ty > 0 ? L.t[(ty - 1) * L.w + tx] : 0; img = (a === TL.G || a === TL.IC) ? TILES.dirt : TILES.top; break; }
        case TL.P: img = TILES.plat; break; case TL.RK: img = TILES.rock; break; case TL.BU: img = TILES.burn; break;
        case TL.ME: img = TILES.metal; break; case TL.VI: img = TILES.vine; break; case TL.IC: img = TILES.ice; break;
        case TL.BO: c.drawImage(TILES.dirt, X, Y, T + 0.6, T + 0.6); c.drawImage(TILES.bounce, X - 2, Y - 16, T + 4, T + 4); continue;
        case TL.SP: { const on = P_.spike !== 'electric' || elecOn(tx); c.globalAlpha = on ? 1 : 0.4; c.drawImage(TILES.spike, X, Y, T, T); if (on && P_.spike === 'electric' && Math.random() < 0.3) { c.strokeStyle = '#9ff'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X + 6, Y + 10); c.lineTo(X + 14, Y + 4 + Math.random() * 6); c.lineTo(X + 26, Y + 10); c.stroke(); } c.globalAlpha = 1; continue; }
        case TL.CR: { const cr = crumbles.get(ty * L.w + tx); if (cr && cr.gone > 0) continue; const j = cr ? (Math.random() - 0.5) * 3 : 0; c.drawImage(TILES.crumble, X + j, Y, T, T); continue; }
      }
      if (img) c.drawImage(img, X, Y, T + 0.6, T + 0.6);
    } else {
      if (t === TL.WA) {
        c.fillStyle = wcol; c.fillRect(X, Y, T + 0.5, T + 0.5);
        if (ty === 0 || L.t[(ty - 1) * L.w + tx] !== TL.WA) { c.fillStyle = 'rgba(255,255,255,.55)'; const o = Math.sin(game.t * 3 + tx) * 2; c.fillRect(X, Y + o, T + 0.5, 3); c.fillStyle = key === 'arctic' ? 'rgba(230,248,255,.5)' : 'rgba(255,255,255,.18)'; c.fillRect(X, Y + 3 + o, T + 0.5, 5); }
      } else if (t === TL.QS) { c.globalAlpha = 0.92; c.drawImage(TILES.quick, X, Y + (Math.sin(game.t * 2 + tx) * 1), T, T); c.globalAlpha = 1; }
    }
  }
}

// ---------- player ----------
function pickFrame() {
  const p = P, t = p.anim;
  if (p.dead) return 'hurt';
  if (p.victory) return 'cheer';
  if (p.transformT > 0) return 'cheer';
  if (p.inv > 1.25) return 'hurt';
  if (p.slideT > 0) return 'kick';
  if (p.chargeT > 0) return 'run2';
  if (p.inhaling) { if (!p.onGround) return Math.floor(t * 8) % 2 ? 'inhaleJump' : 'inhaleJump2'; if (p.crouch) return 'inhaleCrouch'; return p.pullClose ? 'inhaleMega' : (Math.floor(t * 6) % 2 ? 'inhaleBig' : 'inhaleHuge'); }
  if (p.atkT > 0 || p.fireT > 0) { if (p.atkKind === 'fire') return 'inhaleRun'; if (p.atkKind === 'bite') return 'inhaleHuge'; return 'point'; }
  if (p.crouch) return 'crouch';
  if (p.floating) return 'flail';
  if (!p.onGround) { if (p.vy < 0) return p.jumps === 2 ? 'jump3' : 'jump1'; return 'jump2'; }
  if (Math.abs(p.vx) > 20) { const cyc = ['walk', 'run', 'run2', 'run']; return cyc[Math.floor(t * (Math.abs(p.vx) / 18)) % 4]; }
  if (p.mouth) return 'idle';
  return (Math.floor(t / 1.6) % 3 === 2) ? 'idle2' : 'idle';
}
function drawLinusSprite(c, name, x, y, face, opts = {}) {
  const f = SPR[name], im = IMG[name].im;
  const k = LK * (opts.scale || 1);
  c.save(); c.translate(x, y);
  if (opts.rot) c.rotate(opts.rot);
  c.scale(face * k * (opts.sx || 1), k * (opts.sy || 1));
  c.translate(-f.w * 0.48, -f.h);
  if (opts.glow) { c.shadowColor = opts.glow; c.shadowBlur = 14; }
  if (opts.alpha !== undefined) c.globalAlpha *= opts.alpha;
  if (opts.power) { const sb = c.shadowBlur; c.shadowBlur = 0; drawHoodTail(c, opts.power, f, game.t); c.shadowBlur = sb; }
  c.drawImage(im, 0, 0, f.w, f.h);
  c.shadowBlur = 0;
  if (opts.power) drawHood(c, opts.power, f, game.t);
  if (opts.mouth) {
    const m = opts.mouth, fr = f.front;
    const mx = f.hb[2] - 4, my = f.hb[3] + 2;
    shape(c, m.col, 3, () => { c.moveTo(mx - 4, my - 6); c.quadraticCurveTo(mx + 26, my - 10 + Math.sin(game.t * 12) * 5, mx + 34, my + 6 + Math.sin(game.t * 12) * 6); c.quadraticCurveTo(mx + 14, my + 8, mx - 4, my + 8); });
    if (m.n > 1) { shape(c, '#ffd84a', 3, () => ell(c, mx + 10, my - 18, 6, 6)); }
  }
  c.restore();
}
function drawPlayer(c) {
  const p = P; if (!p) return;
  if (p.inv > 0 && p.inv < 1.25 && Math.floor(p.inv * 14) % 2 && !p.dead) return;
  const name = pickFrame();
  const x = p.x + p.w / 2, y = p.y + p.h + 2;
  const opts = { power: p.power };
  if (p.dead) opts.rot = p.deadT * 6;
  if (p.mouth) { opts.sx = 1.12; opts.sy = 0.96 + Math.sin(game.t * 8) * 0.02; opts.mouth = p.mouth; }
  if (p.floating) opts.sy = 1 + Math.sin(game.t * 10) * 0.03;
  if (p.camoT > 0) opts.alpha = 0.28 + Math.sin(game.t * 8) * 0.05;
  if (p.rainbowT > 0) opts.glow = `hsl(${game.t * 400 % 360},100%,60%)`;
  else if (p.power) opts.glow = POW[p.power].col2;
  if (p.megaT > 0) opts.glow = '#c98aff';
  if (p.transformT > 0) {
    const f = p.transformT;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(x, y - 30, (1 - ((f * 2 + i / 3) % 1)) * 70, 0, Math.PI * 2); c.strokeStyle = p.power ? POW[p.power].col2 : '#fff'; c.lineWidth = 3; c.globalAlpha = 0.7; c.stroke(); c.globalAlpha = 1; }
    opts.scale = 1 + Math.sin(f * 20) * 0.08;
  }
  drawLinusSprite(c, name, x, y, p.face, opts);
  // inhale cone
  if (p.inhaling) {
    const f = p.face, mx = p.x + p.w / 2 + f * 12, my = p.y + (p.crouch ? 8 : 16), R = (105 + SAVE.up.inh * 28) * (p.megaT > 0 ? 1.45 : 1);
    const g = c.createLinearGradient(mx, 0, mx + f * R, 0); g.addColorStop(0, 'rgba(255,255,255,.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(mx, my - 8); c.lineTo(mx + f * R, my - 40); c.lineTo(mx + f * R, my + 40); c.lineTo(mx, my + 8); c.fill();
  }
  // melee visuals
  for (const m of melees) {
    const prog = 1 - m.life / m.max;
    if (m.kind === 'slash') {
      const cx = P.x + P.w / 2 + P.face * 8, cy = P.y + 18;
      c.save(); c.translate(cx, cy); c.scale(P.face, 1);
      c.strokeStyle = m.pow === 'theri' ? 'rgba(220,255,140,.9)' : 'rgba(255,255,255,.95)'; c.lineCap = 'round';
      for (let i = 0; i < 3; i++) { c.lineWidth = 4 - i; c.beginPath(); c.arc(4, 0, 30 + i * 7, -1.4 + prog * 1.2, 0.2 + prog * 1.4); c.stroke(); }
      c.restore();
    } else if (m.kind === 'bite') {
      const cx = P.x + P.w / 2 + P.face * 30, cy = P.y + 14, o = (1 - Math.sin(prog * Math.PI)) * 14;
      c.save(); c.translate(cx, cy); c.scale(P.face, 1);
      shape(c, '#fff', 2, () => { for (let i = 0; i < 4; i++) { c.moveTo(-14 + i * 8, -o - 4); c.lineTo(-10 + i * 8, -o + 6); c.lineTo(-6 + i * 8, -o - 4); } });
      shape(c, '#fff', 2, () => { for (let i = 0; i < 4; i++) { c.moveTo(-14 + i * 8, o + 4); c.lineTo(-10 + i * 8, o - 6); c.lineTo(-6 + i * 8, o + 4); } });
      c.restore();
    } else if (m.kind === 'charge') {
      c.save(); c.globalAlpha = 0.5; c.strokeStyle = POW.drex.col2; c.lineWidth = 3;
      for (let i = 0; i < 4; i++) { const yy = P.y + 8 + i * 10; c.beginPath(); c.moveTo(P.x + P.w / 2 - P.face * (20 + i * 6), yy); c.lineTo(P.x + P.w / 2 - P.face * (50 + i * 10), yy); c.stroke(); }
      c.restore();
    }
  }
}

// ---------- world objects ----------
function drawProps(c) {
  for (const pr of props) {
    if (pr.x < cam.x - 100 || pr.x > cam.x + VIEW_W + 100) continue;
    if (pr.k === 'sign') {
      c.fillStyle = '#7a5228'; c.fillRect(pr.x - 2, pr.y - 26, 4, 26);
      rrect(c, pr.x - 12, pr.y - 36, 24, 16, 3, '#c8925a', OUT, 1.5);
      txt(c, '!', pr.x, pr.y - 28, 12, '#fff', 'center', 2);
    } else if (pr.k === 'checkpoint') {
      c.fillStyle = '#ddd'; c.fillRect(pr.x - 2, pr.y - 64, 4, 64); c.strokeStyle = OUT; c.lineWidth = 1; c.strokeRect(pr.x - 2, pr.y - 64, 4, 64);
      const wv = Math.sin(game.t * 5) * 3;
      shape(c, pr.on ? '#3ccf5a' : '#e84a4a', 1.5, () => { c.moveTo(pr.x + 2, pr.y - 62); c.quadraticCurveTo(pr.x + 16, pr.y - 60 + wv, pr.x + 28, pr.y - 54); c.quadraticCurveTo(pr.x + 16, pr.y - 50 - wv, pr.x + 2, pr.y - 46); });
      drawEgg(c, pr.x, pr.y - 70, 6, 0);
    } else if (pr.k === 'goal') {
      const x = pr.x, y = pr.y;
      rrect(c, x - 40, y - 120, 14, 120, 3, '#ffd84a'); rrect(c, x + 26, y - 120, 14, 120, 3, '#ffd84a');
      rrect(c, x - 46, y - 132, 92, 18, 6, '#ff5a8a');
      txt(c, 'GOAL', x, y - 123, 13, '#fff');
      c.save(); c.translate(x, y - 70); c.rotate(game.t * 2);
      drawStar(c, 0, 0, 22 + Math.sin(game.t * 6) * 2, '#fff36a', 0, 2.5); c.restore();
      for (let i = 0; i < 2; i++) if (Math.random() < 0.3) part({ x: x + (Math.random() - 0.5) * 60, y: y - Math.random() * 110, vx: 0, vy: -20, life: 0.6, col: '#fff6a0', size: 4, kind: 'star' });
    } else if (pr.k === 'door') {
      const x = pr.x, y = pr.y;
      shape(c, '#6a3fa0', 2, () => { c.moveTo(x - 18, y); c.lineTo(x - 18, y - 34); c.arc(x, y - 34, 18, Math.PI, 0); c.lineTo(x + 18, y); c.closePath(); });
      shape(c, '#2a1650', 0, () => { c.moveTo(x - 13, y); c.lineTo(x - 13, y - 32); c.arc(x, y - 32, 13, Math.PI, 0); c.lineTo(x + 13, y); c.closePath(); });
      drawStar(c, x, y - 30, 8 + Math.sin(game.t * 4), '#ffd84a', game.t, 1.5);
      if (pr.near) txt(c, '▼', x, y - 66 + Math.sin(game.t * 8) * 3, 16, '#fff');
    }
  }
}
function drawSignBubbles(c) {
  let best = null, bd = 1e9;
  for (const pr of props) { if (pr.k !== 'sign') continue; const d = Math.abs(P.x + P.w / 2 - pr.x); if (d <= 90 && Math.abs(P.y + P.h - pr.y) <= 120 && d < bd) { bd = d; best = pr; } }
  for (const pr of best ? [best] : []) {
    const lines = wrap(c, pr.text, 180, 11);
    const w = 196, h = lines.length * 14 + 12, x = clamp(pr.x - w / 2, cam.x + 6, cam.x + VIEW_W - w - 6), y = Math.max(cam.y + 34, Math.min(P.y, pr.y - 64) - 18 - h);
    rrect(c, x, y, w, h, 8, 'rgba(255,255,255,.95)', OUT, 2);
    lines.forEach((l, i) => txt(c, l, x + w / 2, y + 13 + i * 14, 11, '#3a2a1a', 'center', 0));
  }
}
function drawHazards(c) {
  const key = WORLDS[game.wi].key;
  for (const m of movers) {
    if (m.elev || key === 'city') { c.strokeStyle = '#555'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(m.x + 6, m.y); c.lineTo(m.x + 6, m.y - 400); c.moveTo(m.x + m.w - 6, m.y); c.lineTo(m.x + m.w - 6, m.y - 400); c.stroke(); }
    for (let i = 0; i < m.w / T; i++) c.drawImage(TILES.plat, m.x + i * T, m.y, T + 0.5, T);
    shape(c, '#ffd84a', 1, () => ell(c, m.x + m.w / 2, m.y + 6, 3, 3));
  }
  for (const hz of hazards) {
    if (hz.k === 'pend') {
      c.strokeStyle = hz.ride ? '#3c7a28' : '#555'; c.lineWidth = hz.ride ? 3 : 2.5;
      c.beginPath(); c.moveTo(hz.ax * T, hz.ay * T); c.lineTo(hz.ex, hz.ey); c.stroke();
      if (!hz.ride) { c.setLineDash([4, 3]); c.stroke(); c.setLineDash([]); }
      shape(c, '#666', 1.5, () => ell(c, hz.ax * T, hz.ay * T, 5, 5));
      if (hz.ride) { rrect(c, hz.x, hz.y, hz.w, 12, 6, '#9b6b3a'); c.fillStyle = '#7a5228'; c.fillRect(hz.x + 8, hz.y + 4, hz.w - 16, 2); if (key === 'jungle') { c.fillStyle = '#4c9a34'; c.beginPath(); ell(c, hz.ex, hz.ey - 2, 8, 4); c.fill(); } }
      else { shape(c, '#3a3a44', 2.5, () => ell(c, hz.ex, hz.ey, 20, 20)); shape(c, '#6a6a78', 0, () => ell(c, hz.ex - 6, hz.ey - 6, 6, 5)); }
    } else if (hz.k === 'faller') {
      if (hz.st === 'gone') continue;
      const j = hz.st === 'shake' ? (Math.random() - 0.5) * 4 : 0, x = hz.x + j, y = hz.y;
      if (hz.st === 'shake' && Math.random() < 0.3) part({ x: x + 12, y: y + 2, vx: (Math.random() - 0.5) * 40, vy: 20, life: 0.4, col: '#aaa', size: 2, grav: 1 });
      if (key === 'arctic') shape(c, '#dff6ff', 1.5, () => { c.moveTo(x, y); c.lineTo(x + 24, y); c.lineTo(x + 12, y + 30); c.closePath(); });
      else if (key === 'jungle' || key === 'forest' || key === 'beach') { rrect(c, x, y, 24, 26, 6, '#8a5a2e'); shape(c, '#c8925a', 1.5, () => ell(c, x + 12, y + 4, 10, 4)); c.strokeStyle = '#6e4522'; c.lineWidth = 1; c.beginPath(); ell(c, x + 12, y + 4, 5, 2); c.stroke(); }
      else if (key === 'city') { rrect(c, x - 4, y, 32, 14, 2, '#c84a2a'); c.fillStyle = '#e8e8e8'; for (let i = 0; i < 3; i++) c.fillRect(x + i * 10, y + 4, 4, 6); }
      else shape(c, '#a8865a', 2, () => { c.moveTo(x + 4, y); c.lineTo(x + 22, y + 3); c.lineTo(x + 24, y + 20); c.lineTo(x + 12, y + 26); c.lineTo(x, y + 18); c.closePath(); });
    } else if (hz.k === 'roller') {
      const x = hz.x + hz.w / 2, y = hz.y + hz.h / 2;
      c.save(); c.translate(x, y);
      if (key === 'beach') { c.rotate(0); shape(c, '#3ab0e8', 2, () => { c.moveTo(-16, 14); c.quadraticCurveTo(-16, -18, 8, -16); c.quadraticCurveTo(18, -14, 14, -4); c.quadraticCurveTo(4, -10, 0, 0); c.quadraticCurveTo(-2, 10, 16, 14); c.closePath(); }); c.fillStyle = '#fff'; c.beginPath(); ell(c, 6, -15, 8, 3); c.fill(); }
      else { c.rotate(hz.rot || 0); shape(c, hz.flash > 0 ? '#fff' : key === 'arctic' ? '#f4fbff' : '#9a8a72', 2, () => ell(c, 0, 0, 14, 14)); c.strokeStyle = key === 'arctic' ? '#bcd8ec' : '#6a5a48'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-8, -4); c.lineTo(0, 2); c.lineTo(6, -6); c.moveTo(-2, 6); c.lineTo(4, 10); c.stroke(); }
      c.restore();
    } else if (hz.k === 'car') {
      const x = hz.x, y = hz.y;
      rrect(c, x, y + 6, hz.w, 14, 4, hz.col);
      rrect(c, x + 12, y - 4, hz.w - 26, 12, 4, hz.col);
      c.fillStyle = '#bfe6ff'; c.fillRect(x + 15, y - 1, 13, 8); c.fillRect(x + 31, y - 1, 13, 8);
      shape(c, '#222', 1.5, () => ell(c, x + 13, y + 21, 6, 6)); shape(c, '#222', 1.5, () => ell(c, x + hz.w - 13, y + 21, 6, 6));
      c.fillStyle = '#fff6a0'; c.fillRect(x, y + 9, 4, 4);
    }
  }
}
function drawItems(c) {
  for (const it of items) {
    if (it.x < cam.x - 30 || it.x > cam.x + VIEW_W + 30) continue;
    const bob = it.phys ? 0 : Math.sin(it.t * 3) * 2, x = it.x, y = it.y + bob;
    if (it.life !== undefined && it.life < 2 && Math.floor(it.life * 10) % 2) continue;
    switch (it.k) {
      case 'coin': drawCoin(c, x, y, 7, it.t); break;
      case 'star': c.save(); c.translate(x, y); c.rotate(Math.sin(it.t * 2) * 0.3); drawStar(c, 0, 0, 9, '#ffe14a'); c.restore(); break;
      case 'heart': drawHeart(c, x, y, 8 + Math.sin(it.t * 6) * 0.8); break;
      case 'oneup': { c.save(); c.translate(x, y); c.beginPath(); ell(c, 0, 0, 13, 13); c.fillStyle = '#7aff7a'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); c.beginPath(); ell(c, 0, 0, 12, 12); c.clip(); const im = IMG.idle.im, fw = SPR.idle.w; c.drawImage(im, 0, 0, fw, fw * 1.2, -12, -13, 24, 28.8); c.restore(); txt(c, '1UP', x, y + 18, 9, '#7aff7a'); break; }
      case 'egg': drawEgg(c, x, y, 10, it.t); break;
      case 'golden': drawGolden(c, x, y + 14, 1, it.t); if (Math.random() < 0.15) part({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, vx: 0, vy: -10, life: 0.5, col: '#fff6a0', size: 3, kind: 'star' }); break;
      case 'capsule': drawCapsule(c, x, y, 9, it.c, it.t); break;
      case 'powerstar': { c.save(); c.translate(x, y); c.rotate(it.t * 4); drawStar(c, 0, 0, 13, POW[it.pw].col2, 0, 2); c.restore(); powIcon(c, it.pw, x, y, 7); break; }
    }
  }
}
function drawEnemies(c) {
  for (const e of enemies) {
    if (e.x + e.w < cam.x - 40 || e.x > cam.x + VIEW_W + 40) continue;
    let face = e.face; if (e.d.beh === 'hop' || e.d.beh === 'fly' || e.d.beh === 'shoot') face = sign(P.x - e.x); else if (Math.abs(e.vx) > 1) face = sign(e.vx);
    c.save();
    if (e.sucked) { c.translate(e.x + e.w / 2, e.y + e.h); c.rotate(Math.sin(game.t * 40) * 0.25); c.translate(-(e.x + e.w / 2), -(e.y + e.h)); }
    drawDino(c, e.x + e.w / 2, e.y + e.h, e.d, face, { t: e.t, walk: e.walk, jaw: (e.jawT > 0 || e.sucked) ? 1 : 0, flash: e.flash > 0, alpha: e.d.camo ? e.alpha : undefined });
    c.restore();
    if (e.d.power && !e.sucked && Math.floor(game.t * 2) % 4 === 0) { powIcon(c, e.d.power, e.x + e.w / 2, e.y - 10, 6); }
  }
}
function drawBoss(c) {
  const b = boss; if (!b) return;
  c.save();
  if (b.sub > 0) { c.beginPath(); c.rect(cam.x - 50, cam.y - 400, VIEW_W + 100, b.floorY - cam.y + 400); c.clip(); }
  if (b.st === 'stun') { for (let i = 0; i < 3; i++) { const a = game.t * 5 + i * 2.1; drawStar(c, b.x + b.w / 2 + Math.cos(a) * 30, b.y - 10 + Math.sin(a) * 8, 6, '#ffe14a', a); } }
  if (b.st === 'chargeW' || b.st === 'stompW') c.translate((Math.random() - 0.5) * 4, 0);
  const sl = b.slash > 0 ? 1 - b.slash : 0;
  drawDino(c, b.x + b.w / 2, b.y + b.h + 4, b.d, b.face, { t: b.t, walk: b.walk, jaw: Math.min(1, b.jaw), flash: b.flash > 0, alpha: b.alpha, slash: sl }, b.B.size);
  if ((b.st === 'claw' && b.stT > 0.6 && b.stT < 0.95) || b.slash > 0.2) {
    c.strokeStyle = 'rgba(255,90,90,.85)'; c.lineCap = 'round';
    const cx = b.x + b.w / 2 + b.face * b.w * 0.45, cy = b.y + b.h * 0.45;
    for (let i = 0; i < 3; i++) { c.lineWidth = 5 - i; c.beginPath(); c.arc(cx, cy, 40 + i * 12, b.face > 0 ? -1.2 : Math.PI - 0.6, b.face > 0 ? 0.6 : Math.PI + 1.2); c.stroke(); }
  }
  c.restore();
  if (b.st === 'dive' && b.sub >= 1) { c.fillStyle = 'rgba(30,60,90,.35)'; c.beginPath(); ell(c, b.x + b.w / 2, b.floorY - 2, b.w * 0.4, 6); c.fill(); shape(c, b.d.col, 2, () => { const fx = b.x + b.w / 2; c.moveTo(fx - 12, b.floorY); c.lineTo(fx + 4, b.floorY - 22); c.lineTo(fx + 12, b.floorY); }); }
}
function drawProjs(c) {
  for (const pr of projs) {
    const x = pr.x + pr.w / 2, y = pr.y + pr.h / 2;
    if (pr.delay > 0) {
      let fy = boss ? boss.floorY : y; if (!boss) { for (let ty = Math.floor(pr.y / T); ty < game.L.h; ty++) if (solidAt(Math.floor(x / T), ty)) { fy = ty * T; break; } }
      c.fillStyle = `rgba(255,40,40,${0.3 + 0.3 * Math.sin(game.t * 20)})`; c.beginPath(); ell(c, x, fy - 2, 16, 5); c.fill();
      txt(c, '!', x, fy - 18, 14, '#ff4a4a'); continue;
    }
    switch (pr.kind) {
      case 'star': c.save(); c.translate(x, y); c.rotate(pr.t * 14); drawStar(c, 0, 0, pr.big ? 16 : 12, '#fff36a', 0, 2); c.restore(); if (Math.random() < 0.7) part({ x, y, vx: -pr.vx * 0.1, vy: (Math.random() - 0.5) * 40, life: 0.3, col: '#fff6a0', size: 3, kind: 'star' }); break;
      case 'puff': c.globalAlpha = Math.max(0, pr.life / 0.3); shape(c, '#fff', 1.5, () => { ell(c, x, y, 9, 7); }); shape(c, '#fff', 0, () => { ell(c, x - 5, y + 2, 6, 5); ell(c, x + 5, y - 2, 6, 5); }); c.globalAlpha = 1; break;
      case 'water': case 'bwater': shape(c, '#5ab8ff', 1.5, () => ell(c, x, y, pr.w / 2 + 2, pr.h / 2)); shape(c, '#e0f6ff', 0, () => ell(c, x + 3, y - 2, 4, 2)); if (Math.random() < 0.5) part({ x, y, vx: 0, vy: 30, life: 0.3, col: '#9fd8ff', size: 3 }); break;
      case 'fire': { const f = 1 - pr.life / 0.34; const g = c.createRadialGradient(x, y, 1, x, y, pr.w / 2 + 2); g.addColorStop(0, `rgba(255,255,200,${1 - f})`); g.addColorStop(0.5, `rgba(255,150,30,${0.9 - f * 0.6})`); g.addColorStop(1, 'rgba(255,60,0,0)'); c.fillStyle = g; c.beginPath(); ell(c, x, y, pr.w / 2 + 2, pr.h / 2 + 2); c.fill(); break; }
      case 'claw': c.save(); c.translate(x, y); c.scale(pr.face || 1, 1); c.strokeStyle = pr.own === 'p' ? '#e8ff9a' : '#ff6a6a'; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.lineWidth = 4; c.beginPath(); c.arc(-8 + i * 5, 0, 14 - i * 2, -1.1, 1.1); c.stroke(); } c.restore(); break;
      case 'shock': case 'shockE': c.fillStyle = pr.own === 'p' ? 'rgba(200,180,255,.8)' : 'rgba(210,180,130,.9)'; c.beginPath(); c.moveTo(pr.x, pr.y + pr.h); c.quadraticCurveTo(x, pr.y - 6, pr.x + pr.w, pr.y + pr.h); c.fill(); c.strokeStyle = OUT; c.lineWidth = 1.5; c.stroke(); break;
      case 'venom': shape(c, '#7ad040', 1.5, () => ell(c, x, y, 6, 6)); break;
      case 'sand': shape(c, '#d8a860', 1.5, () => ell(c, x, y, 7, 7)); break;
      case 'ice': case 'icicle': c.save(); c.translate(x, y); c.rotate(Math.atan2(pr.vy, pr.vx)); shape(c, '#e8f8ff', 1.5, () => { c.moveTo(-9, -5); c.lineTo(11, 0); c.lineTo(-9, 5); c.closePath(); }); c.restore(); break;
      case 'rock': c.save(); c.translate(x, y); c.rotate(pr.t * 4); shape(c, '#9a8a72', 2, () => { c.moveTo(-10, -6); c.lineTo(2, -11); c.lineTo(11, -2); c.lineTo(6, 10); c.lineTo(-8, 8); c.closePath(); }); c.restore(); break;
      case 'wave': c.save(); c.translate(x, y); c.scale(pr.face || 1, 1); c.strokeStyle = '#ff5a5a'; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.lineWidth = 4; c.beginPath(); c.arc(-6 + i * 4, 2, 16 - i * 3, -1.3, 1.3); c.stroke(); } c.restore(); break;
      default: shape(c, '#ff8a3a', 1.5, () => ell(c, x, y, 7, 7));
    }
    if (pr.own === 'e' && pr.kind === 'fire') { const g = c.createRadialGradient(x, y, 1, x, y, 12); g.addColorStop(0, '#fff8c0'); g.addColorStop(0.5, '#ff8a20'); g.addColorStop(1, 'rgba(255,40,0,0)'); c.fillStyle = g; c.beginPath(); ell(c, x, y, 12, 12); c.fill(); }
  }
}
function drawParts(c) {
  for (const p of parts) {
    const f = p.t / p.life, a = Math.max(0, 1 - f);
    c.globalAlpha = a;
    switch (p.kind) {
      case 'dot': c.fillStyle = p.col; c.beginPath(); ell(c, p.x, p.y, p.size * (1 - f * 0.5), p.size * (1 - f * 0.5)); c.fill(); break;
      case 'chunk': c.fillStyle = p.col; c.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); break;
      case 'star': drawStar(c, p.x, p.y, p.size * (1 - f * 0.4), p.col, (p.rot || 0) + p.t * 6, 0); break;
      case 'ring': c.strokeStyle = p.col; c.lineWidth = 2; c.beginPath(); ell(c, p.x, p.y, p.size * (0.3 + f), p.size * (0.3 + f)); c.stroke(); break;
      case 'text': c.globalAlpha = Math.min(1, a * 2); txt(c, p.str, p.x, p.y, 11, p.col); break;
      case 'swirl': if (p.cx !== undefined) { c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(p.cx, p.cy); c.lineTo(p.cx + (p.x - p.tx) * 0.12, p.cy + (p.y - p.ty) * 0.12); c.stroke(); } break;
    }
  }
  c.globalAlpha = 1;
}
function drawZonesFX(c) {
  for (const z of zones) {
    if (z.k !== 'wind' || z.x > cam.x + VIEW_W || z.x + z.w < cam.x) continue;
    if (Math.sin(game.t * 1.2) > -0.2) {
      c.fillStyle = 'rgba(230,190,120,.18)'; c.fillRect(0, 0, VIEW_W, VIEW_H);
      c.strokeStyle = 'rgba(255,230,170,.6)'; c.lineWidth = 1.5;
      for (let i = 0; i < 18; i++) { const x = (VIEW_W - ((game.t * 420 + i * 97) % (VIEW_W + 80))), y = (i * 53) % VIEW_H; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 30, y + 2); c.stroke(); }
      txt(c, 'SANDSTORM!', VIEW_W / 2, 70, 12, '#ffe0a0');
    }
  }
  if (WORLDS[game.wi].key === 'arctic') { c.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 30; i++) { const x = (i * 71 + game.t * 20 * (1 + i % 3) - cam.x * 0.3) % VIEW_W, y = (i * 37 + game.t * 40 * (1 + i % 2)) % VIEW_H; c.fillRect((x + VIEW_W) % VIEW_W, y, 2, 2); } }
}

function drawPlay() {
  const c = ctx;
  c.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  drawBG(c, cam.x, game.L.h * T - VIEW_H - cam.y, game.t);
  c.save();
  const sx = cam.shake ? (Math.random() - 0.5) * cam.shake : 0, sy = cam.shake ? (Math.random() - 0.5) * cam.shake : 0;
  c.translate(Math.round((-cam.x + sx) * SCALE) / SCALE, Math.round((-cam.y + sy) * SCALE) / SCALE);
  drawTiles(c, false);
  drawProps(c);
  drawHazards(c);
  drawItems(c);
  drawEnemies(c);
  drawBoss(c);
  drawPlayer(c);
  drawProjs(c);
  drawTiles(c, true);
  drawParts(c);
  drawSignBubbles(c);
  c.restore();
  drawZonesFX(c);
  drawHUD(c);
  if (IS_TOUCH || Object.keys(touchPts).length) drawControls(c);
}

// ---------- HUD ----------
function linusHead(c, x, y, r) {
  c.save(); c.beginPath(); ell(c, x, y, r, r); c.fillStyle = '#ffe9a0'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke(); c.clip();
  const f = SPR.idle; c.drawImage(IMG.idle.im, 0, 0, f.w, f.w * 1.22, x - r, y - r, r * 2, r * 2 * 1.22); c.restore();
}
function drawHUD(c) {
  const L = SAFE.l + 10, top = SAFE.t + 8;
  for (let i = 0; i < P.maxhp; i++) drawHeart(c, L + 8 + i * 16, top + 8, 6.5, i < P.hp ? '#ff4a6a' : 'rgba(0,0,0,.35)');
  linusHead(c, L + 10, top + 27, 9); txt(c, '×' + Math.max(0, SAVE.lives), L + 24, top + 28, 11, '#fff', 'left');
  drawCoin(c, L + 62, top + 27, 6, 0); txt(c, '' + SAVE.coins, L + 72, top + 28, 11, '#ffe060', 'left');
  if (game.stageStats && game.stageStats.golden) drawGolden(c, L + 120, top + 36, 0.45, game.t);
  // score + pause
  const pr = VIEW_W - SAFE.r - 24;
  rrect(c, pr - 14, top, 28, 24, 7, 'rgba(0,0,0,.35)', '#fff', 1.5);
  c.fillStyle = '#fff'; c.fillRect(pr - 5, top + 6, 3, 12); c.fillRect(pr + 2, top + 6, 3, 12);
  ui.btn(pr - 18, top - 4, 36, 32, () => { game.state = 'pause'; SFX.click(); suckStop(); });
  txt(c, 'SCORE ' + SAVE.score, pr + 14, top + 34, 9, '#fff', 'right');
  // power badge
  const cx = VIEW_W / 2;
  if (P.mouth) {
    rrect(c, cx - 92, top, 184, 22, 11, 'rgba(0,0,0,.5)', '#fff', 1.5);
    txt(c, P.mouth.power ? 'INHALE = spit ⭐   POWER = copy!' : 'INHALE = spit ⭐   POWER = gulp', cx, top + 11, 9.5, P.mouth.power ? POW[P.mouth.power].col2 : '#fff');
  } else if (P.power) {
    rrect(c, cx - 70, top, 140, 22, 11, 'rgba(0,0,0,.45)', POW[P.power].col2, 2);
    powIcon(c, P.power, cx - 58, top + 11, 9);
    txt(c, POW[P.power].name, cx + 6, top + 11, 10, POW[P.power].col2);
  }
  // timers
  let ty = top + 30;
  for (const [k, v, col, lab] of [['rainbowT', 8, '#ff5aa0', 'RAINBOW'], ['speedT', 10, '#3cd070', 'SPEED'], ['megaT', 10, '#b05aff', 'MEGA'], ['camoT', 5, '#ccc', 'CAMO']]) {
    if (P[k] > 0) { rrect(c, cx - 40, ty, 80, 8, 4, 'rgba(0,0,0,.4)', null); rrect(c, cx - 40, ty, 80 * P[k] / v, 8, 4, col, null); txt(c, lab, cx, ty + 4, 7, '#fff', 'center', 2); ty += 11; }
  }
  if (game.si === 5 && game.stash) txt(c, '⏱ ' + Math.ceil(game.bonusT), cx, ty + 12, 18, game.bonusT < 6 ? '#ff6a6a' : '#fff');
  // boss bar
  if (boss && boss.st !== 'intro') {
    const w = Math.min(260, VIEW_W - 220), x = cx - w / 2, y = (P.mouth || P.power) ? top + 28 : top + 4;
    txt(c, WORLDS[game.wi].bossName, cx, y + 4, 9, '#fff');
    rrect(c, x, y + 10, w, 10, 5, 'rgba(0,0,0,.5)', '#fff', 1.5);
    const f = Math.max(0, boss.hp / boss.max);
    if (f > 0) rrect(c, x + 1, y + 11, (w - 2) * f, 8, 4, f < 0.25 ? '#ff4a4a' : f < 0.5 ? '#ffa030' : '#ff6a3a', null);
    txt(c, 'WEAK TO ' + POW[WORLDS[game.wi].weak].name, cx, y + 27, 7.5, POW[WORLDS[game.wi].weak].col2, 'center', 2);
  }
  // banner
  if (game.banner) {
    const b = game.banner, a = Math.min(1, b.t * 3), s = 1 + Math.max(0, (b.t - 2.2)) * 0;
    c.globalAlpha = a;
    const y = VIEW_H * 0.32;
    rrect(c, cx - 170, y - 24, 340, b.sub ? 50 : 34, 12, 'rgba(0,0,0,.45)', null);
    txt(c, b.text, cx, y - 6, 20 * s, b.col || '#fff');
    if (b.sub) txt(c, b.sub, cx, y + 15, 10.5, '#fff');
    if (b.isNew) txt(c, '★ NEW POWER DISCOVERED ★', cx, y - 34, 10, '#ffe060');
    c.globalAlpha = 1;
  }
}
function drawControls(c) {
  const lab = {
    left: null, right: null, down: null,
    jump: 'JUMP',
    inhale: P.mouth ? 'SPIT' : 'INHALE',
    special: P.mouth ? (P.mouth.power ? 'COPY!' : 'GULP') : (P.power ? (P.power === 'mosa' ? 'BLAST' : P.power === 'rex' ? 'FIRE' : P.power === 'drex' ? 'CHARGE' : P.power === 'sarco' ? 'CHOMP' : 'CLAW') : 'PUFF')
  };
  for (const k in BTN) {
    if (k === 'u') continue;
    const b = BTN[k], on = input[k];
    let col = 'rgba(255,255,255,.22)';
    if (k === 'jump') col = 'rgba(90,200,255,.45)'; if (k === 'inhale') col = 'rgba(255,220,90,.45)'; if (k === 'special') col = P.power ? hexA(POW[P.power].col, 0.6) : 'rgba(255,120,160,.45)';
    if (k === 'special' && P.mouth) col = P.mouth.power ? hexA(POW[P.mouth.power].col, 0.75) : 'rgba(255,120,160,.6)';
    c.beginPath(); ell(c, b.x, b.y, b.r * (on ? 0.94 : 1), b.r * (on ? 0.94 : 1));
    c.fillStyle = on ? 'rgba(255,255,255,.55)' : col; c.fill(); c.lineWidth = 2.5; c.strokeStyle = 'rgba(255,255,255,.75)'; c.stroke();
    c.save(); c.translate(b.x, b.y); c.scale(BTN.u, BTN.u); c.translate(-b.x, -b.y);
    if (k === 'left' || k === 'right' || k === 'down') {
      c.save(); c.translate(b.x, b.y); c.rotate(k === 'left' ? Math.PI : k === 'down' ? Math.PI / 2 : 0);
      const s = b.r / BTN.u * 0.42; c.beginPath(); c.moveTo(s, 0); c.lineTo(-s * 0.6, -s * 0.9); c.lineTo(-s * 0.6, s * 0.9); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke(); c.restore();
    } else if (k === 'jump') {
      c.beginPath(); c.moveTo(b.x, b.y - 14); c.lineTo(b.x - 11, b.y - 1); c.lineTo(b.x - 4, b.y - 1); c.lineTo(b.x - 4, b.y + 6); c.lineTo(b.x + 4, b.y + 6); c.lineTo(b.x + 4, b.y - 1); c.lineTo(b.x + 11, b.y - 1); c.closePath();
      c.fillStyle = '#fff'; c.fill(); c.lineWidth = 2; c.strokeStyle = OUT; c.stroke();
      txt(c, lab.jump, b.x, b.y + 16, 8, '#fff', 'center', 2.5);
    } else if (k === 'inhale') {
      if (P.mouth) drawStar(c, b.x, b.y - 3, 11, '#fff36a', game.t * 2, 2);
      else { c.strokeStyle = '#fff'; c.lineWidth = 2.5; c.lineCap = 'round'; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(b.x + 12, b.y - 10 + i * 7); c.quadraticCurveTo(b.x, b.y - 8 + i * 6, b.x - 10, b.y - 4 + i * 3); c.stroke(); } c.beginPath(); ell(c, b.x - 11, b.y - 1, 4, 5); c.fillStyle = OUT; c.fill(); }
      txt(c, lab.inhale, b.x, b.y + 15, 8, '#fff', 'center', 2.5);
    } else {
      const pw = P.mouth ? P.mouth.power : P.power;
      if (pw) powIcon(c, pw, b.x, b.y - 3, 12); else { shape(c, '#fff', 1.5, () => { ell(c, b.x, b.y - 3, 8, 6); ell(c, b.x - 6, b.y - 1, 5, 4); ell(c, b.x + 6, b.y - 5, 5, 4); }); }
      txt(c, lab.special, b.x, b.y + 14, 8, '#fff', 'center', 2.5);
    }
    c.restore();
  }
}
function hexA(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; }
