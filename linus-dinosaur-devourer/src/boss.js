// ================= BOSSES =================
const BOSS = {
  rex: { d: EN.rex, size: 3.7, w: 130, h: 118, hp: 30, atks: ['charge', 'stomp', 'fire', 'summon'], minis: ['compy', 'mosa'], proj: 'fire' },
  theri: { d: EN.theri, size: 3.7, w: 110, h: 120, hp: 34, atks: ['claw', 'wave', 'stomp', 'summon'], minis: ['compy', 'rex'], proj: 'claw' },
  drex: { d: EN.drex, size: 3.4, w: 120, h: 120, hp: 38, atks: ['charge', 'stomp', 'rocks', 'fire', 'summon'], minis: ['raptor', 'mosa'], proj: 'sand' },
  mosa: { d: EN.mosa, size: 4.0, w: 180, h: 95, hp: 40, atks: ['dive', 'splash', 'charge', 'summon'], minis: ['compy', 'rex'], proj: 'ice' },
  sarco: { d: EN.sarco, size: 4.0, w: 200, h: 70, hp: 44, atks: ['dive', 'chomp', 'charge', 'splash', 'summon'], minis: ['compy', 'drex'], proj: 'water' },
  indo: { d: EN.indo, size: 3.6, w: 130, h: 120, hp: 52, atks: ['camo', 'charge', 'claw', 'stomp', 'fire', 'summon'], minis: ['raptor', 'theri'], proj: 'claw' },
};
function makeBoss(type, x, y) {
  const B = BOSS[type];
  boss = { type, B, d: B.d, x: x - B.w / 2, y: y - B.h, w: B.w, h: B.h, hp: B.hp + game.wi * 2, max: B.hp + game.wi * 2, face: -1, st: 'intro', stT: 0, t: 0, vx: 0, vy: 0,
    inv: 0, flash: 0, jaw: 0, walk: 0, alpha: 1, alive: true, last: '', miniT: 6, floorY: y, count: 0, sub: 0, slash: 0 };
}
function bossBox() { const b = boss; return { x: b.x + b.w * 0.1, y: b.y + b.h * 0.12, w: b.w * 0.8, h: b.h * 0.88 }; }
function bossHittable() { const b = boss; return b.st !== 'intro' && b.st !== 'dead' && !(b.st === 'dive' && b.sub > 0.3); }
function bossGo(st) { boss.st = st; boss.stT = 0; boss.count = 0; }
function bossProj(kind, x, y, vx, vy, grav = 700, w = 18, h = 18) { projs.push({ own: 'e', kind, x: x - w / 2, y: y - h / 2, w, h, vx, vy, grav, life: 3, dmg: 1, t: 0 }); }
function bossPick() {
  const b = boss; let list = b.B.atks.slice();
  if (b.hp / b.max < 0.35 && !list.includes('rocks')) list.push('rocks');
  const minis = enemies.length;
  if (minis === 0 && b.last !== 'summon' && Math.random() < 0.6) { bossGo('summon'); b.last = 'summon'; return; }
  list = list.filter(a => a !== b.last && !(a === 'summon' && minis >= 2));
  const a = list[Math.floor(Math.random() * list.length)];
  b.last = a;
  if (a === 'charge') bossGo('chargeW');
  else if (a === 'stomp') bossGo('stompW');
  else bossGo(a);
}
function spawnMini(type) {
  const x = clamp(P.x + (Math.random() - 0.5) * 200, 2 * T, (game.L.w - 3) * T);
  const e = spawnEnemy(type, x, cam.y - 10);
  e.vy = 0; e.y = cam.y - 40;
  if (e.d.nograv) { e.d = Object.assign({}, e.d, { nograv: 0 }); }
  part({ x, y: cam.y + 20, kind: 'text', str: '▼', col: '#fff', life: 0.8, vx: 0, vy: 30 });
}
function updateBoss(dt) {
  const b = boss; if (!b) return;
  b.t += dt; b.stT += dt;
  if (b.inv > 0) b.inv -= dt; if (b.flash > 0) b.flash -= dt; if (b.slash > 0) b.slash -= dt * 3;
  b.jaw = Math.max(0, b.jaw - dt * 2);
  const ratio = b.hp / b.max, spd = ratio < 0.25 ? 1.45 : ratio < 0.5 ? 1.22 : 1;
  const px = P.x + P.w / 2, bx = b.x + b.w / 2, wallL = T, wallR = (game.L.w - 1) * T;
  let grav = true;
  b.wall = 0;
  switch (b.st) {
    case 'intro':
      b.face = -1; if (b.stT > 0.6 && !b.roared) { b.roared = true; SFX.roar(1); cam.shake = 14; b.jaw = 1.5; }
      if (b.stT > 2.4) bossGo('idle'); break;
    case 'idle':
      b.face = sign(px - bx); b.vx = b.face * 50 * spd * (Math.abs(px - bx) > 90 ? 1 : 0);
      if (b.stT > 1.4 / spd) bossPick(); break;
    case 'chargeW':
      b.vx = 0; b.jaw = 1; b.face = sign(px - bx); if (b.stT < 0.05) SFX.roar(1);
      if (b.stT > 0.75 / spd) { bossGo('charge'); } break;
    case 'charge':
      b.vx = b.face * 290 * spd; b.walk += dt * 18;
      if (Math.random() < 0.5) part({ x: bx - b.face * b.w / 2, y: b.y + b.h, vx: -b.face * 80, vy: -40, life: 0.5, col: '#c8b088', size: 7 });
      if ((b.face > 0 && b.x + b.w >= wallR - 2) || (b.face < 0 && b.x <= wallL + 2)) {
        bossGo('stun'); cam.shake = 14; SFX.stomp();
        for (let i = 0; i < 3; i++) bossProj('rock', clamp(px + (i - 1) * 90 + (Math.random() - 0.5) * 40, 2 * T, wallR - T), cam.y - 20, 0, 0, 900, 22, 22), projs[projs.length - 1].delay = 0.5 + i * 0.25;
      } break;
    case 'stun': b.vx = 0; if (b.stT > 1.1) bossGo('idle'); break;
    case 'stompW': b.vx = 0; if (b.stT > 0.45 / spd) { b.vy = -700; b.vx = clamp((px - bx) / 1.0, -260, 260); bossGo('stompA'); SFX.roar(0); } break;
    case 'stompA':
      if (b.vy >= 0 && b.y + b.h >= b.floorY - 1) {
        b.vx = 0; SFX.stomp(); cam.shake = 16;
        for (const s of [-1, 1]) projs.push({ own: 'e', kind: 'shockE', x: bx - 12 + s * b.w * 0.4, y: b.floorY - 22, w: 24, h: 22, vx: s * 230 * spd, vy: 0, life: 2.2, dmg: 1, t: 0 });
        bossGo('recover');
      } break;
    case 'recover': b.vx = 0; if (b.stT > 0.7 / spd) bossGo('idle'); break;
    case 'fire': case 'splash': {
      b.vx = 0; b.face = sign(px - bx); b.jaw = 1;
      const n = b.st === 'splash' ? 5 : 3;
      if (b.count < n && b.stT > 0.35 + b.count * (b.st === 'splash' ? 0.12 : 0.32) / spd) {
        b.count++;
        const mx = bx + b.face * b.w * 0.45, my = b.y + (b.d.kind === 'theropod' ? 10 : b.h * 0.3);
        const tt = 0.9 + (b.st === 'splash' ? b.count * 0.12 : 0), tx = px + (b.st === 'splash' ? (b.count - 3) * 50 : (Math.random() - 0.5) * 60);
        bossProj(b.B.proj, mx, my, (tx - mx) / tt, (P.y + 20 - my) / tt - 0.5 * 700 * tt);
        b.B.proj === 'fire' ? SFX.fire() : SFX.spit();
      }
      if (b.stT > 1.7) bossGo('idle'); break;
    }
    case 'wave':
      b.vx = 0; b.face = sign(px - bx);
      if (b.count < 2 && b.stT > 0.4 + b.count * 0.6 / spd) { b.count++; b.slash = 1; SFX.slash(); projs.push({ own: 'e', kind: 'wave', x: bx + b.face * b.w * 0.4 - 15, y: b.floorY - 28, w: 30, h: 28, vx: b.face * 240 * spd, vy: 0, life: 2.5, dmg: 1, t: 0, face: b.face }); }
      if (b.stT > 1.8) bossGo('idle'); break;
    case 'claw':
      if (b.stT < 0.6) { b.face = sign(px - bx); b.vx = b.face * 210 * spd; b.walk += dt * 14; }
      else if (b.stT < 0.95) { b.vx = 0; if (!b.swiped) { b.swiped = true; b.slash = 1; SFX.slash(); } const hb = { x: b.face > 0 ? b.x + b.w * 0.6 : b.x - 50, y: b.y, w: b.w * 0.4 + 50, h: b.h }; if (overlap(hb, P)) hurtPlayer(bx, 1); }
      else { b.swiped = false; bossGo('recover'); } break;
    case 'chomp':
      if (b.stT < 0.25) { b.vx = 0; b.face = sign(px - bx); b.jaw = 1; }
      else if (b.stT < 0.75) { b.vx = b.face * 360 * spd; b.jaw = 0.5 + 0.5 * Math.sin(b.stT * 30); if (Math.sin(b.stT * 30) > 0.9) SFX.bite(); }
      else bossGo('recover'); break;
    case 'rocks':
      b.vx = 0; b.jaw = 1;
      if (b.stT < 0.05) { SFX.roar(1); cam.shake = 12; for (let i = 0; i < 5; i++) { const x = i === 0 ? px : 2 * T + Math.random() * (wallR - 3 * T); bossProj(WORLDS[game.wi].key === 'arctic' ? 'icicle' : 'rock', x, cam.y - 20, 0, 0, 900, 22, 22); projs[projs.length - 1].delay = 0.7 + i * 0.22; } }
      if (b.stT > 1.8) bossGo('idle'); break;
    case 'summon':
      b.vx = 0; b.jaw = 1;
      if (b.stT < 0.05) { SFX.roar(1); cam.shake = 10; spawnMini(b.B.minis[0]); setTimeout(() => { if (boss && boss.alive && game.state === 'play') spawnMini(b.B.minis[1]); }, 450); }
      if (b.stT > 1.3) bossGo('idle'); break;
    case 'dive':
      grav = false;
      if (b.stT < 0.8) { b.sub = b.stT / 0.8; b.vx = 0; b.y = b.floorY - b.h + b.sub * (b.h + 30); if (b.stT < 0.05) SFX.splash(); }
      else if (b.stT < 1.9) { b.sub = 1; b.x = lerp(b.x, px - b.w / 2, dt * 4); b.x = clamp(b.x, wallL, wallR - b.w); if (Math.random() < 0.5) part({ x: b.x + b.w / 2 + (Math.random() - 0.5) * 60, y: b.floorY - 2, vx: 0, vy: -60, life: 0.5, col: '#dff6ff', size: 5, kind: 'ring' }); }
      else { if (b.count === 0) { b.count = 1; b.vy = -820; b.face = sign(px - (b.x + b.w / 2)) || 1; SFX.splash(); SFX.roar(1); burst(b.x + b.w / 2, b.floorY, 14, '#bfe8ff', 220); b.jaw = 1.2; }
        b.sub = Math.max(0, b.sub - dt * 3); grav = true; b.vy += 1500 * dt; b.y += b.vy * dt;
        if (b.vy > 0 && b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; b.vy = 0; b.sub = 0; cam.shake = 10; SFX.stomp(); bossGo('recover'); }
        grav = false; }
      break;
    case 'camo':
      b.vx = 0;
      if (b.stT < 0.5) b.alpha = 1 - b.stT / 0.5 * 0.88;
      else if (b.stT < 1.6) { b.alpha = 0.12; if (!b.moved) { b.moved = true; SFX.camo(); } b.x = lerp(b.x, clamp(px - b.w / 2 - P.face * 140, wallL, wallR - b.w), dt * 3); }
      else { b.moved = false; b.alpha = 1; bossGo('stompW'); }
      break;
    case 'stagger': b.vx = 0; if (b.stT > 0.6) bossGo('idle'); break;
    case 'dead':
      b.vx = 0; grav = false; b.flash = (Math.floor(b.stT * 12) % 2) ? 0.1 : 0;
      if (Math.random() < 0.35) { burst(b.x + Math.random() * b.w, b.y + Math.random() * b.h, 6, ['#ffd84a', '#ff7a4a', '#fff'][Math.floor(Math.random() * 3)], 200); SFX.pop(); }
      if (b.stT > 2.6 && b.alive) { b.alive = false; bossDefeated(); }
      break;
  }
  if (b.st !== 'camo') b.alpha = Math.min(1, b.alpha + dt * 3);
  if (b.st === 'idle' || b.st === 'charge' || b.st === 'claw') b.walk += dt * Math.abs(b.vx) * 0.06;
  if (grav) { b.vy += 1500 * dt; b.y += b.vy * dt; if (b.y + b.h >= b.floorY) { b.y = b.floorY - b.h; b.vy = 0; } }
  b.x += b.vx * dt;
  if (b.x < wallL) { b.x = wallL; b.wall = -1; } if (b.x + b.w > wallR) { b.x = wallR - b.w; b.wall = 1; }
  // contact
  if (b.st !== 'dead' && b.st !== 'intro' && b.alpha > 0.5 && b.sub < 0.3 && overlap(P, bossBox()) && !P.dead) {
    if (P.rainbowT > 0 || P.chargeT > 0) { if (b.inv <= 0) damageBoss(P.rainbowT > 0 ? 2 : 3, P.chargeT > 0 ? 'drex' : null, px, P.y + 20); P.vx = -P.face * 200; P.chargeT = 0; }
    else if (P.stomp) { damageBoss(4, 'drex', px, P.y + P.h); P.vy = -450; P.stomp = false; stompLand(); }
    else hurtPlayer(bx, 1, 'contact');
  }
  // keep ammo available
  b.miniT -= dt;
  if (b.miniT <= 0 && b.st !== 'dead') { b.miniT = 7; if (enemies.length < 2) spawnMini(enemies.length === 0 ? b.B.minis[1] : b.B.minis[Math.floor(Math.random() * 2)]); }
}
function damageBoss(dmg, pow, x, y) {
  const b = boss; if (!b || b.inv > 0 || b.st === 'dead') return;
  const weak = pow && pow === WORLDS[game.wi].weak;
  const d = dmg * (weak ? 2 : 1);
  b.hp -= d; b.inv = 0.35; b.flash = 0.18; SFX.hit(); burst(x, y, 6, weak ? '#ff6af0' : '#ffd84a', 160);
  floatText(weak ? 'SUPER EFFECTIVE!' : '-' + Math.round(d), x, y - 10, weak ? '#ff8af0' : '#fff');
  addScore(Math.round(d) * 50);
  if (weak && ['idle', 'recover', 'fire', 'splash', 'summon', 'wave'].includes(b.st)) bossGo('stagger');
  if (b.hp <= 0) { b.hp = 0; bossGo('dead'); SFX.roar(1); cam.shake = 20; stopMusic(); enemies.forEach(e => killEnemy(e)); projs = projs.filter(p => p.own !== 'e'); }
}
function bossDefeated() {
  const wi = game.wi;
  SAVE.done[`${wi}-4`] = 1;
  if (SAVE.unlocked < wi + 2) SAVE.unlocked = Math.min(6, wi + 2);
  SAVE.score += 5000; persist();
  SFX.bossWin(); P.victory = true;
  burst(boss.x + boss.w / 2, boss.y + boss.h / 2, 40, '#ffd84a', 320);
  items.push({ k: 'heart', x: boss.x + boss.w / 2, y: boss.y, r: 8, t: 0 });
  setTimeout(() => { if (game.state === 'play') game.state = wi === 5 ? 'ending' : 'bossclear'; }, 2600);
}
