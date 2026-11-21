// ================= ART =================
const OUT = '#2a1d14';
function shape(c, fill, lw, path) { c.beginPath(); path(); c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OUT; c.stroke(); } }
function ell(c, x, y, rx, ry, rot = 0) { c.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); }
function shade(hex, amt) {
  let n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
}
function eye(c, x, y, r, look = 1, red = false, angry = true) {
  shape(c, '#fff', r * 0.35, () => ell(c, x, y, r, r));
  shape(c, red ? '#d01818' : '#111', 0, () => ell(c, x + r * 0.35 * look, y + r * 0.1, r * 0.55, r * 0.6));
  shape(c, '#fff', 0, () => ell(c, x + r * 0.5 * look, y - r * 0.2, r * 0.18, r * 0.18));
  if (angry) { c.beginPath(); c.moveTo(x - r * 1.1, y - r * 1.3); c.lineTo(x + r * 1.1, y - r * 0.7); c.lineWidth = r * 0.45; c.strokeStyle = OUT; c.stroke(); }
}
function teeth(c, x0, x1, y, n, len, down = 1) {
  c.fillStyle = '#fff'; c.beginPath();
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) { c.moveTo(x0 + i * w, y); c.lineTo(x0 + i * w + w / 2, y + len * down); c.lineTo(x0 + (i + 1) * w, y); }
  c.fill();
}

// ---------- photo dinosaurs ----------
const DIMG = {};
for (const k in DSPR) {
  const o = Object.assign({ im: new Image(), white: null }, DSPR[k]);
  o.im.onload = () => { const cn = document.createElement('canvas'); cn.width = o.w; cn.height = o.h; const x = cn.getContext('2d'); x.drawImage(o.im, 0, 0); x.globalCompositeOperation = 'source-in'; x.fillStyle = '#fff'; x.fillRect(0, 0, o.w, o.h); o.white = cn; };
  o.im.src = o.d; DIMG[k] = o;
}
const DW = { rex: 60, drex: 58, indo: 62, theri: 50, mosa: 62, sarco: 66, compy: 52, raptor: 54, ptero: 66, ankylo: 78, dilo: 56, fish: 62, mammoth: 54 };
const HEAD = { mosa: [0.27, 0.33, 3.6], rex: [0.25, 0.27, 4.2], drex: [0.2, 0.24, 5.2], indo: [0.2, 0.23, 5], theri: [0.77, 0.14, 6], sarco: [0.74, 0.4, 3.4] };
function drawDinoImg(c, x, y, pw, facing, st, size) {
  const o = DIMG[pw]; if (!o || !o.im.complete || !o.w) return false;
  const w = DW[pw] * size, h = w * o.h / o.w, walk = st.walk || 0, t = st.t || 0;
  const swim = pw === 'mosa' || pw === 'fish', fly = pw === 'ptero';
  const bob = swim ? Math.sin(t * 3) * 2 * Math.min(size, 2) : Math.abs(Math.sin(walk)) * 1.6 * Math.min(size, 2.5);
  c.save(); c.translate(x, y - bob);
  if (st.alpha !== undefined) c.globalAlpha *= st.alpha;
  let rot = swim ? Math.sin(t * 4) * 0.06 : Math.sin(walk) * 0.045;
  if ((st.jaw || 0) > 0.5) rot -= facing * 0.07;
  if (st.slash) rot += facing * Math.sin(st.slash * Math.PI) * 0.18;
  c.rotate(rot);
  c.scale(facing * o.face, fly ? 1 + Math.sin(t * 10) * 0.08 : 1 + Math.sin(t * 3) * 0.02);
  c.drawImage(o.im, -w / 2, -h, w, h);
  if (st.flash && o.white) { c.globalAlpha *= 0.75; c.drawImage(o.white, -w / 2, -h, w, h); }
  c.restore(); return true;
}
function dinoHead(c, pw, cx, cy, r) {
  const o = DIMG[pw]; if (!o || !o.im.complete || !o.w) return;
  const [hx, hy, k] = HEAD[pw], w = r * k, h = w * o.h / o.w;
  c.save(); c.translate(cx, cy); if (o.face < 0) c.scale(-1, 1);
  c.drawImage(o.im, -hx * w, -hy * h, w, h); c.restore();
}

// st: {t, walk, jaw, hurt, alpha, angry}
function drawDino(c, x, y, d, facing, st, size = 1) {
  const ik = d.img || d.power;
  if (ik && !d.cartoon && drawDinoImg(c, x, y, ik, facing, st, size)) return;
  const u = d.s * size;
  c.save(); c.translate(x, y); c.scale(facing * u, u);
  if (st.alpha !== undefined) c.globalAlpha *= st.alpha;
  const col = st.flash ? '#ffffff' : d.col, belly = st.flash ? '#ffffff' : d.belly, dark = shade(d.col, -0.3);
  const lw = 1.7 / u * (size > 2 ? 1.6 : 1);
  const t = st.t || 0, w = st.walk || 0, jaw = st.jaw || 0;
  const sw = Math.sin(w) * 6, wag = Math.sin(t * 4) * 3;
  const K = d.kind;
  if (K === 'theropod') {
    const hs = d.bighead ? 1.25 : 1;
    // back leg
    leg(c, -4, -18, -4 - sw, 0, dark, lw);
    // tail
    shape(c, col, lw, () => { c.moveTo(-6, -30); c.quadraticCurveTo(-24, -30 + wag, -38, -26 + wag * 1.5); c.quadraticCurveTo(-22, -20, -6, -17); c.closePath(); });
    if (d.spikes) { c.fillStyle = dark; c.beginPath(); for (let i = 0; i < 6; i++) { const sx = -30 + i * 7, sy = -28 + (i < 3 ? wag * (1 - i / 3) : 0) - (i > 2 ? (i - 2) * 3 : 0); c.moveTo(sx - 3, sy); c.lineTo(sx, sy - 6); c.lineTo(sx + 3, sy); } c.fill(); }
    // body
    shape(c, col, lw, () => ell(c, 0, -25, 16, 12, -0.25));
    shape(c, belly, 0, () => ell(c, 4, -21, 11, 7, -0.3));
    if (d.stripes) { c.strokeStyle = dark; c.lineWidth = 2.5; for (let i = -1; i < 3; i++) { c.beginPath(); c.moveTo(-6 + i * 6, -36 + i); c.lineTo(-9 + i * 6, -26 + i); c.stroke(); } }
    if (d.mutant) { c.strokeStyle = '#ff6a6a'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-4, -32); c.lineTo(4, -26); c.moveTo(-1, -33); c.lineTo(6, -28); c.stroke(); }
    // front leg
    leg(c, 5, -18, 5 + sw, 0, col, lw);
    // arm
    c.strokeStyle = col; c.lineWidth = 3.2; c.lineCap = 'round'; c.beginPath(); c.moveTo(11, -26); c.lineTo(16, -21 + Math.sin(t * 6)); c.stroke();
    c.strokeStyle = OUT; c.lineWidth = lw * 0.6; c.stroke();
    if (d.feathers) { c.fillStyle = shade(d.col, 0.3); c.beginPath(); c.moveTo(11, -26); c.lineTo(9, -18); c.lineTo(15, -22); c.fill(); }
    // neck + head
    c.save(); c.translate(14, -36); c.scale(hs, hs);
    if (d.frill && jaw > 0.3) { shape(c, '#ff5ab0', lw, () => { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i - 4.5) * 0.32; const r = i % 2 ? 9 : 14; c.lineTo(Math.cos(a) * r - 2, Math.sin(a) * r * 0.9 + 4); } c.closePath(); }); }
    shape(c, col, lw, () => ell(c, -4, 6, 7, 9, 0.5));
    // lower jaw
    c.save(); c.translate(-2, 4); c.rotate(jaw * 0.6);
    shape(c, belly, lw, () => { c.moveTo(0, 0); c.lineTo(17, 1); c.quadraticCurveTo(16, 6, 6, 6); c.quadraticCurveTo(-2, 5, 0, 0); });
    if (jaw > 0.1) teeth(c, 4, 16, 1, 4, -2.5);
    c.restore();
    // upper head
    shape(c, col, lw, () => { c.moveTo(-8, 4); c.quadraticCurveTo(-8, -9, 4, -9); c.quadraticCurveTo(16, -9, 19, -1); c.quadraticCurveTo(20, 4, 14, 4); c.lineTo(-2, 5); c.closePath(); });
    teeth(c, 2, 17, 3.5, 5, 2.6);
    shape(c, OUT, 0, () => ell(c, 15, -4, 1, 0.8));
    if (d.crest) { shape(c, '#ff5a5a', lw, () => { c.moveTo(-4, -7); c.quadraticCurveTo(0, -17, 6, -8); c.moveTo(1, -8); c.quadraticCurveTo(6, -18, 11, -7); }); }
    if (d.spikes) { c.fillStyle = dark; c.beginPath(); c.moveTo(-6, -6); c.lineTo(-10, -12); c.lineTo(-2, -8); c.moveTo(2, -8); c.lineTo(0, -14); c.lineTo(6, -8); c.fill(); }
    eye(c, 4, -3, 3.3, 1, d.redeye, st.angry !== false);
    c.restore();
  } else if (K === 'theri') {
    leg(c, -3, -20, -3 - sw, 0, dark, lw);
    shape(c, col, lw, () => { c.moveTo(-8, -26); c.quadraticCurveTo(-22, -24 + wag, -28, -18 + wag); c.quadraticCurveTo(-16, -16, -6, -16); c.closePath(); });
    shape(c, col, lw, () => ell(c, 0, -28, 13, 15, 0.2));
    // feather fluff
    c.fillStyle = shade(d.col, 0.25); c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI * 0.7 + i * 0.35; c.moveTo(Math.cos(a) * 12, -28 + Math.sin(a) * 14); c.lineTo(Math.cos(a) * 18, -28 + Math.sin(a) * 18); c.lineTo(Math.cos(a + 0.2) * 12, -28 + Math.sin(a + 0.2) * 14); } c.fill();
    shape(c, belly, 0, () => ell(c, 4, -24, 8, 10, 0.2));
    leg(c, 4, -20, 4 + sw, 0, col, lw);
    // neck & head
    shape(c, col, lw, () => { c.moveTo(4, -40); c.quadraticCurveTo(8, -54, 14, -58); c.lineTo(18, -54); c.quadraticCurveTo(12, -48, 11, -36); c.closePath(); });
    shape(c, col, lw, () => ell(c, 17, -58, 6, 4.5, 0.1));
    shape(c, '#e8c060', lw, () => { c.moveTo(21, -59); c.lineTo(27, -56 + jaw * 3); c.lineTo(21, -55); });
    eye(c, 17, -59.5, 2.2, 1, false, st.angry !== false);
    // giant claws
    const sl = st.slash ? Math.sin(st.slash * Math.PI) * 1.2 : 0;
    c.save(); c.translate(10, -32); c.rotate(-0.3 + sl);
    shape(c, col, lw, () => ell(c, 3, 0, 6, 3));
    c.strokeStyle = '#f5f0e0'; c.lineWidth = 2.2; c.lineCap = 'round';
    for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(7, -1 + i * 1.5); c.quadraticCurveTo(18, 2 + i * 3, 20, 12 + i * 2); c.stroke(); }
    c.restore();
  } else if (K === 'ankylo') {
    const lsw = sw * 0.6;
    leg(c, -12, -8, -12 - lsw, 0, dark, lw, 6); leg(c, 10, -8, 10 + lsw, 0, dark, lw, 6);
    shape(c, col, lw, () => { c.moveTo(-20, -10); c.quadraticCurveTo(-34, -10 + wag, -38, -12 + wag); c.lineTo(-36, -8 + wag); c.quadraticCurveTo(-30, -6, -20, -5); });
    shape(c, dark, lw, () => ell(c, -40, -10 + wag, 6, 5));
    shape(c, col, lw, () => { c.moveTo(-24, -6); c.quadraticCurveTo(-22, -30, 0, -30); c.quadraticCurveTo(22, -30, 24, -6); c.closePath(); });
    c.fillStyle = shade(d.col, 0.25); for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { c.beginPath(); ell(c, -16 + i * 8 + j * 4, -22 + j * 8 - Math.abs(i - 2) * -0.5, 2.6, 2.2); c.fill(); }
    c.fillStyle = OUT; c.beginPath(); for (let i = 0; i < 6; i++) { const sx = -20 + i * 8; c.moveTo(sx - 2, -27 + Math.abs(i - 2.5) * 1.5); c.lineTo(sx, -33 + Math.abs(i - 2.5) * 1.5); c.lineTo(sx + 2, -27 + Math.abs(i - 2.5) * 1.5); } c.fill();
    leg(c, -6, -8, -6 + lsw, 0, col, lw, 6); leg(c, 16, -8, 16 - lsw, 0, col, lw, 6);
    shape(c, col, lw, () => ell(c, 27, -11, 8, 6));
    shape(c, belly, 0, () => ell(c, 31, -8, 4, 2.5));
    eye(c, 28, -14, 2.4, 1, false, st.angry !== false);
  } else if (K === 'ptero') {
    const fl = Math.sin(t * 10) * 10;
    shape(c, shade(d.col, -0.15), lw, () => { c.moveTo(-2, -12); c.lineTo(-26, -12 - fl); c.lineTo(-8, -6); c.closePath(); });
    shape(c, col, lw, () => ell(c, 0, -10, 10, 5));
    shape(c, belly, 0, () => ell(c, 2, -8, 6, 2.5));
    shape(c, col, lw, () => { c.moveTo(2, -12); c.lineTo(22, -12 - fl); c.lineTo(8, -6); c.closePath(); });
    shape(c, col, lw, () => ell(c, 12, -13, 5, 4));
    shape(c, col, lw, () => { c.moveTo(9, -16); c.lineTo(0, -24); c.lineTo(12, -16); });
    shape(c, '#f0c040', lw, () => { c.moveTo(15, -14); c.lineTo(28, -12 + jaw * 2); c.lineTo(15, -11); });
    eye(c, 13, -14, 2, 1, false, st.angry !== false);
  } else if (K === 'mosa' || K === 'fish') {
    const mo = K === 'mosa';
    const L = mo ? 1 : 0.75, und = Math.sin(t * 5) * 3;
    c.save(); c.translate(0, -9);
    shape(c, col, lw, () => { c.moveTo(-14 * L, -3); c.quadraticCurveTo(-28 * L, und, -36 * L, und - 1); c.lineTo(-36 * L, und + 2); c.quadraticCurveTo(-26 * L, 4, -14 * L, 4); });
    shape(c, dark, lw, () => { c.moveTo(-34 * L, und); c.lineTo(-42 * L, und - 9); c.lineTo(-38 * L, und + 1); c.lineTo(-42 * L, und + 9); c.closePath(); });
    shape(c, col, lw, () => ell(c, 0, 0, 20 * L, 7.5));
    shape(c, belly, 0, () => ell(c, 3, 3, 15 * L, 3.5));
    if (!mo) shape(c, dark, lw, () => { c.moveTo(-4, -6); c.lineTo(2, -14); c.lineTo(6, -6); });
    shape(c, dark, lw, () => { c.moveTo(4, 4); c.lineTo(-2 + und, 12); c.lineTo(10, 5); });
    // head
    c.save(); c.translate(16 * L, 0);
    c.save(); c.rotate(jaw * 0.5);
    shape(c, belly, lw, () => { c.moveTo(0, 1); c.lineTo(mo ? 18 : 16, 2); c.lineTo(0, 5); });
    if (jaw > 0.1 && mo) teeth(c, 4, 17, 2, 5, -2.2);
    c.restore();
    shape(c, col, lw, () => { c.moveTo(-4, -6); c.quadraticCurveTo(6, -7, mo ? 20 : 18, 0); c.lineTo(0, 2); c.closePath(); });
    if (mo) teeth(c, 4, 18, 0.5, 6, 2);
    eye(c, 4, -2.5, 2.4, 1, false, mo && st.angry !== false);
    c.restore(); c.restore();
  } else if (K === 'sarco') {
    const lsw = sw * 0.5;
    leg(c, -14, -5, -14 - lsw, 0, dark, lw, 5); leg(c, 10, -5, 10 + lsw, 0, dark, lw, 5);
    shape(c, col, lw, () => { c.moveTo(-18, -11); c.quadraticCurveTo(-34, -9 + wag, -46, -6 + wag); c.quadraticCurveTo(-32, -3, -18, -3); });
    shape(c, col, lw, () => ell(c, 0, -8, 22, 6.5));
    shape(c, belly, 0, () => ell(c, 2, -4.5, 17, 2.5));
    c.fillStyle = dark; for (let i = 0; i < 8; i++) { c.beginPath(); ell(c, -18 + i * 5, -14, 2, 1.6); c.fill(); }
    leg(c, -8, -5, -8 + lsw, 0, col, lw, 5); leg(c, 15, -5, 15 - lsw, 0, col, lw, 5);
    c.save(); c.translate(20, -9);
    c.save(); c.rotate(jaw * 0.45);
    shape(c, belly, lw, () => { c.moveTo(0, 1); c.lineTo(26, 2); c.lineTo(0, 5); });
    if (jaw > 0.1) teeth(c, 3, 25, 2, 8, -1.8);
    c.restore();
    shape(c, col, lw, () => { c.moveTo(-2, -5); c.quadraticCurveTo(4, -6, 10, -3); c.lineTo(24, -1); c.quadraticCurveTo(29, -2, 28, 1); c.lineTo(0, 2); c.closePath(); });
    shape(c, dark, lw * 0.7, () => ell(c, 27, -1, 3, 2.2));
    teeth(c, 4, 26, 1.5, 9, 1.8);
    eye(c, 3, -4.5, 2.4, 1, false, st.angry !== false);
    c.restore();
  } else if (K === 'mammoth') {
    const lsw = sw * 0.5;
    leg(c, -10, -12, -10 - lsw, 0, dark, lw, 7); leg(c, 8, -12, 8 + lsw, 0, dark, lw, 7);
    shape(c, col, lw, () => ell(c, 0, -20, 18, 14));
    c.strokeStyle = dark; c.lineWidth = 1.2; for (let i = 0; i < 8; i++) { c.beginPath(); c.moveTo(-14 + i * 4, -10); c.lineTo(-15 + i * 4, -5); c.stroke(); }
    leg(c, -5, -12, -5 + lsw, 0, col, lw, 7); leg(c, 12, -12, 12 - lsw, 0, col, lw, 7);
    shape(c, col, lw, () => ell(c, 16, -26, 10, 9));
    shape(c, dark, lw, () => ell(c, 10, -27, 4, 6));
    shape(c, col, lw, () => { c.moveTo(22, -24); c.quadraticCurveTo(30, -16, 26, -6 + Math.sin(t * 3) * 2); c.lineTo(23, -7); c.quadraticCurveTo(25, -15, 18, -20); c.closePath(); });
    c.strokeStyle = '#fffbe8'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(20, -20); c.quadraticCurveTo(28, -12, 34, -18); c.stroke();
    eye(c, 18, -29, 2.2, 1, false, false);
    shape(c, '#fff', 0, () => ell(c, 0, -32, 8, 2.5));
  }
  c.restore();
}
function leg(c, hx, hy, fx, fy, col, lw, wd = 6.5) {
  c.lineCap = 'round';
  c.strokeStyle = OUT; c.lineWidth = wd + lw * 2; c.beginPath(); c.moveTo(hx, hy); c.lineTo(fx, fy - 2); c.stroke();
  c.strokeStyle = col; c.lineWidth = wd; c.stroke();
  shape(c, col, lw, () => ell(c, fx + 2, fy - 1.5, 4.5, 2));
}

// ---------- Linus power hoods (built from the photo dinosaurs) ----------
const HOOD = {
  mosa: { h: [0, 0, 0.62, 0.74], t: [0.76, 0.34, 1, 0.68], hw: 1.85, tw: 1.0, hy: 0.62 },
  rex: { h: [0, 0, 0.52, 0.62], t: [0.7, 0.55, 1, 0.8], hw: 1.65, tw: 1.1, hy: 0.66 },
  drex: { h: [0, 0, 0.46, 0.44], t: null, hw: 1.4, tw: 0.8, hy: 0.7, fade: 0.5 },
  indo: { h: [0, 0, 0.6, 0.62], t: [0.74, 0.44, 1, 0.66], hw: 1.75, tw: 1.1, hy: 0.62 },
  theri: { fade: 0.45, h: [0.5, 0, 1, 0.31], t: [0, 0.6, 0.26, 0.82], hw: 1.5, tw: 1.1, hy: 0.7 },
  sarco: { h: [0.42, 0, 1, 0.52], t: [0, 0.08, 0.24, 0.4], hw: 2.1, tw: 1.0, hy: 0.62 },
};
const HOODC = {};
function buildHood(pw) {
  const o = DIMG[pw], H = HOOD[pw];
  if (!o || !o.im.complete || !o.w) return null;
  const mk = (box, fadeRight) => {
    if (!box) return null;
    const sx = box[0] * o.w, sy = box[1] * o.h, sw = Math.round((box[2] - box[0]) * o.w), sh = Math.round((box[3] - box[1]) * o.h);
    const cn = document.createElement('canvas'); cn.width = sw; cn.height = sh; const c = cn.getContext('2d');
    if (o.face < 0) { c.translate(sw, 0); c.scale(-1, 1); }
    c.drawImage(o.im, sx, sy, sw, sh, 0, 0, sw, sh);
    c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'destination-out';
    const g = fadeRight ? c.createLinearGradient(sw, 0, sw * 0.62, 0) : c.createLinearGradient(0, 0, sw * (H.fade || 0.32), 0);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, sw, sh);
    if (!fadeRight) {
      const g2 = c.createLinearGradient(0, sh, 0, sh * 0.72); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
      const g3 = c.createLinearGradient(sw * 0.62, 0, sw * 0.4, 0); g3.addColorStop(0, 'rgba(0,0,0,0)'); g3.addColorStop(1, 'rgba(0,0,0,1)');
      const m = document.createElement('canvas'); m.width = sw; m.height = sh; const mc = m.getContext('2d');
      mc.fillStyle = g2; mc.fillRect(0, 0, sw, sh); mc.globalCompositeOperation = 'destination-in'; mc.fillStyle = g3; mc.fillRect(0, 0, sw, sh);
      c.drawImage(m, 0, 0);
    }
    return cn;
  };
  return (HOODC[pw] = { head: mk(H.h, false), tail: mk(H.t, true) });
}
// sprite pixel space, sprite faces right, drawn at 0,0
function drawHoodTail(c, pw, f, t) {
  const hc = HOODC[pw] || buildHood(pw); if (!hc || !hc.tail) return;
  const H = HOOD[pw], bw = f.hb[2] - f.hb[0], w = bw * H.tw * 1.4, h = w * hc.tail.height / hc.tail.width, hp = f.hip;
  c.save(); c.translate(hp[0] + 16, hp[1] - 4); c.rotate(Math.sin(t * 6) * 0.15 - 0.1);
  c.drawImage(hc.tail, -w, -h / 2, w, h); c.restore();
}
function drawHood(c, pw, f, t) {
  const hc = HOODC[pw] || buildHood(pw); if (!hc) return;
  const H = HOOD[pw], hb = f.hb, bw = hb[2] - hb[0];
  const w = bw * H.hw, h = w * hc.head.height / hc.head.width;
  const bottom = hb[1] + (hb[3] - hb[1]) * H.hy, x0 = hb[0] - bw * 0.28;
  c.save(); c.translate(0, Math.sin(t * 5) * 1.2);
  c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
  c.drawImage(hc.head, x0, bottom - h, w, h);
  c.restore();
}

// ---------- Icons ----------
function powIcon(c, pw, x, y, r, locked) {
  c.save();
  shape(c, locked ? '#555' : POW[pw].col2, 2, () => ell(c, x, y, r, r));
  if (!locked) { c.beginPath(); ell(c, x, y, r - 1, r - 1); c.clip(); dinoHead(c, pw, x, y, r * 1.1); }
  else { c.fillStyle = '#ccc'; c.font = `900 ${r}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', x, y + 1); }
  c.restore();
}
function drawStar(c, x, y, r, col = '#ffd84a', rot = 0, lw = 1.5) {
  c.beginPath();
  for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  c.closePath(); c.fillStyle = col; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OUT; c.stroke(); }
}
function drawHeart(c, x, y, r, col = '#ff4466', lw = 1.5) {
  c.beginPath(); c.moveTo(x, y + r * 0.9);
  c.bezierCurveTo(x - r * 1.4, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.4);
  c.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.4, y - r * 0.1, x, y + r * 0.9);
  c.fillStyle = col; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = OUT; c.stroke(); }
}
function drawCoin(c, x, y, r, t) {
  const sx = Math.abs(Math.cos(t * 4)) * 0.8 + 0.2;
  shape(c, '#ffc928', 1.5, () => ell(c, x, y, r * sx, r));
  shape(c, '#fff3a0', 0, () => ell(c, x, y, r * sx * 0.5, r * 0.6));
}
function drawEgg(c, x, y, r, t) {
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 5) * 0.12);
  shape(c, '#fff4dc', 1.8, () => { c.moveTo(0, -r * 1.25); c.bezierCurveTo(r, -r * 1.2, r, r, 0, r); c.bezierCurveTo(-r, r, -r, -r * 1.2, 0, -r * 1.25); });
  c.fillStyle = '#ff6fb0'; c.beginPath(); ell(c, -r * 0.3, -r * 0.3, r * 0.25, r * 0.2); c.fill();
  c.fillStyle = '#6fc4ff'; c.beginPath(); ell(c, r * 0.35, r * 0.15, r * 0.22, r * 0.18); c.fill();
  c.fillStyle = '#7ad04a'; c.beginPath(); ell(c, -r * 0.1, r * 0.55, r * 0.2, r * 0.15); c.fill();
  c.fillStyle = OUT; c.font = `900 ${r}px sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', r * 0.05, -r * 0.05);
  c.restore();
}
function drawGolden(c, x, y, s, t) {
  c.save(); c.shadowColor = '#fff6a0'; c.shadowBlur = 10 + Math.sin(t * 5) * 4;
  drawDino(c, x, y + Math.sin(t * 3) * 2, { kind: 'theropod', col: '#ffcc22', belly: '#fff2a0', s: 0.6 * s, bighead: 1 }, 1, { t, jaw: 0.3, angry: false });
  c.restore();
  if (Math.random() < 0.1) { /* sparkle handled by particles */ }
}
function drawCapsule(c, x, y, r, kind, t) {
  const cols = { rainbow: ['#ff5a5a', '#5ad0ff'], speed: ['#3cd070', '#ffffff'], mega: ['#b05aff', '#ffd84a'] }[kind];
  c.save(); c.translate(x, y); c.rotate(Math.sin(t * 3) * 0.3);
  c.beginPath(); c.roundRect(-r * 1.2, -r * 0.7, r * 2.4, r * 1.4, r * 0.7); c.fillStyle = cols[1]; c.fill(); c.lineWidth = 1.5; c.strokeStyle = OUT; c.stroke();
  c.beginPath(); c.roundRect(-r * 1.2, -r * 0.7, r * 1.2, r * 1.4, [r * 0.7, 0, 0, r * 0.7]); c.fillStyle = kind === 'rainbow' ? `hsl(${t * 300 % 360},90%,60%)` : cols[0]; c.fill(); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(-r * 0.9, -r * 0.45, r * 1.4, r * 0.2);
  c.restore();
}

// ---------- Tiles (pre-rendered per world) ----------
let TILES = null, TILES_WORLD = -1;
const TR = 2; // tile texture resolution multiplier
function buildTiles(wi) {
  if (TILES_WORLD === wi) return;
  TILES_WORLD = wi; TILES = {};
  const P = WORLDS[wi].pal, key = WORLDS[wi].key;
  const mk = (fn) => { const cn = document.createElement('canvas'); cn.width = cn.height = T * TR; const c = cn.getContext('2d'); c.scale(TR, TR); fn(c); return cn; };
  const r = rng(wi * 99 + 5);
  const dirt = (c) => {
    c.fillStyle = P.dirt; c.fillRect(0, 0, T, T);
    if (key === 'city') { c.fillStyle = P.dirt2; for (let y = 0; y < 4; y++) for (let x = 0; x < 2; x++) c.fillRect(x * 16 + (y % 2) * 8 + 1, y * 8 + 1, 14, 6); }
    else if (key === 'desert') { c.strokeStyle = P.dirt2; c.lineWidth = 1.5; for (let y = 0; y < 4; y++) { c.beginPath(); c.moveTo(0, y * 8 + 8); c.lineTo(T, y * 8 + 8); c.stroke(); for (let x = 0; x < 2; x++) { c.beginPath(); c.moveTo(x * 16 + (y % 2) * 8, y * 8); c.lineTo(x * 16 + (y % 2) * 8, y * 8 + 8); c.stroke(); } } }
    else { c.fillStyle = P.dirt2; for (let i = 0; i < 7; i++) { c.beginPath(); ell(c, r() * T, r() * T, 2 + r() * 3, 1.5 + r() * 2); c.fill(); } }
  };
  TILES.dirt = mk(dirt);
  TILES.top = mk(c => {
    dirt(c);
    c.fillStyle = P.top; c.fillRect(0, 0, T, 10);
    c.fillStyle = P.top2; c.fillRect(0, 9, T, 3);
    if (key === 'jungle' || key === 'forest') { c.fillStyle = P.top; for (let i = 0; i < 6; i++) { c.beginPath(); ell(c, i * 6 + 2, 11, 3.5, 3); c.fill(); } c.fillStyle = shade(P.top, 0.3); for (let i = 0; i < 5; i++) c.fillRect(r() * 30, 2 + r() * 4, 3, 1.5); }
    if (key === 'arctic') { c.fillStyle = '#fff'; for (let i = 0; i < 6; i++) { c.beginPath(); ell(c, i * 6 + 2, 10, 3.5, 3.5); c.fill(); } }
    if (key === 'city') { c.fillStyle = '#c9ced4'; c.fillRect(0, 0, T, 3); c.fillStyle = '#7d858f'; c.fillRect(15, 0, 2, 10); }
    if (key === 'beach' || key === 'desert') { c.fillStyle = shade(P.top, -0.08); for (let i = 0; i < 8; i++) c.fillRect(r() * 30, r() * 8, 1.5, 1.5); }
  });
  TILES.plat = mk(c => {
    if (key === 'forest') { // mushroom cap platform
      shape(c, P.plat, 1.5, () => { c.moveTo(0, 12); c.quadraticCurveTo(0, 0, 16, 0); c.quadraticCurveTo(32, 0, 32, 12); c.closePath(); });
      c.fillStyle = P.plat2; c.beginPath(); ell(c, 9, 5, 3, 2); ell(c, 22, 6, 3.5, 2.2); c.fill();
    } else if (key === 'city') {
      c.fillStyle = P.plat; c.fillRect(0, 0, T, 10); c.strokeStyle = P.plat2; c.lineWidth = 2; c.strokeRect(1, 1, T - 2, 8);
      c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(i * 8, 9); c.lineTo(i * 8 + 8, 1); } c.stroke();
    } else if (key === 'arctic') {
      c.fillStyle = P.plat; c.fillRect(0, 0, T, 10); c.fillStyle = '#fff'; c.fillRect(0, 0, T, 3); c.strokeStyle = P.plat2; c.lineWidth = 1.5; c.strokeRect(0.5, 0.5, T - 1, 9);
    } else {
      c.fillStyle = P.plat; c.fillRect(0, 0, T, 10); c.fillStyle = P.plat2; c.fillRect(0, 8, T, 2); c.fillRect(15, 0, 2, 10);
      c.strokeStyle = OUT; c.lineWidth = 1; c.strokeRect(0.5, 0.5, T - 1, 9);
      if (key === 'jungle') { c.fillStyle = '#3e9a2a'; c.beginPath(); ell(c, 6, 1, 5, 2); ell(c, 26, 1, 4, 2); c.fill(); }
    }
  });
  const block = (fill, edge) => c => { c.fillStyle = fill; c.fillRect(0, 0, T, T); c.fillStyle = shade(fill, 0.2); c.fillRect(0, 0, T, 3); c.fillRect(0, 0, 3, T); c.fillStyle = shade(fill, -0.25); c.fillRect(0, T - 3, T, 3); c.fillRect(T - 3, 0, 3, T); if (edge) edge(c); };
  TILES.rock = mk(block(P.rock, c => { c.strokeStyle = OUT; c.lineWidth = 1.5; c.beginPath(); c.moveTo(6, 4); c.lineTo(14, 14); c.lineTo(10, 22); c.lineTo(18, 28); c.moveTo(14, 14); c.lineTo(24, 10); c.lineTo(28, 16); c.stroke(); }));
  TILES.burn = mk(block('#b5793c', c => { c.strokeStyle = '#6b4220'; c.lineWidth = 2; c.strokeRect(3, 3, T - 6, T - 6); c.beginPath(); c.moveTo(4, 4); c.lineTo(T - 4, T - 4); c.moveTo(T - 4, 4); c.lineTo(4, T - 4); c.stroke(); shape(c, '#ff6a20', 1, () => { c.moveTo(16, 8); c.quadraticCurveTo(24, 16, 20, 24); c.lineTo(12, 24); c.quadraticCurveTo(8, 16, 16, 8); }); shape(c, '#ffd040', 0, () => { c.moveTo(16, 14); c.quadraticCurveTo(20, 19, 18, 23); c.lineTo(14, 23); c.quadraticCurveTo(12, 19, 16, 14); }); }));
  TILES.metal = mk(block('#7c8794', c => { c.fillStyle = '#c0c8d0'; [[6, 6], [26, 6], [6, 26], [26, 26]].forEach(([x, y]) => { c.beginPath(); ell(c, x, y, 2.5, 2.5); c.fill(); }); c.strokeStyle = POW.drex.col; c.lineWidth = 3; c.beginPath(); c.moveTo(10, 16); c.lineTo(22, 16); c.moveTo(17, 11); c.lineTo(22, 16); c.lineTo(17, 21); c.stroke(); }));
  TILES.vine = mk(c => { c.fillStyle = '#2d5a1e'; c.fillRect(0, 0, T, T); c.strokeStyle = '#5fbf3a'; c.lineWidth = 4; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(i * 9, 0); c.bezierCurveTo(i * 9 + 10, 10, i * 9 - 8, 20, i * 9 + 4, T); c.stroke(); } c.fillStyle = '#8ee05a'; for (let i = 0; i < 6; i++) { c.beginPath(); ell(c, r() * T, r() * T, 3, 1.8, r() * 3); c.fill(); } c.strokeStyle = '#f5f0e0'; c.lineWidth = 2; c.beginPath(); c.moveTo(8, 10); c.quadraticCurveTo(16, 12, 18, 22); c.moveTo(13, 8); c.quadraticCurveTo(21, 10, 23, 20); c.stroke(); });
  TILES.ice = mk(c => { c.fillStyle = '#bfe8ff'; c.fillRect(0, 0, T, T); c.fillStyle = '#e8f8ff'; c.fillRect(0, 0, T, 6); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.beginPath(); c.moveTo(4, 12); c.lineTo(12, 8); c.moveTo(18, 22); c.lineTo(28, 16); c.stroke(); c.strokeStyle = '#8cc6ea'; c.lineWidth = 1; c.strokeRect(0.5, 0.5, T - 1, T - 1); });
  TILES.crumble = mk(c => {
    const col = key === 'arctic' ? '#bfe6ff' : key === 'city' ? '#a8a29a' : key === 'beach' ? '#c09a70' : '#b8864e';
    c.fillStyle = col; c.fillRect(0, 0, T, 12); c.strokeStyle = OUT; c.lineWidth = 1.2; c.strokeRect(0.5, 0.5, T - 1, 11);
    c.beginPath(); c.moveTo(8, 0); c.lineTo(11, 6); c.lineTo(8, 12); c.moveTo(22, 0); c.lineTo(20, 5); c.lineTo(24, 12); c.stroke();
  });
  TILES.bounce = mk(c => {
    if (key === 'forest' || key === 'jungle') { shape(c, '#ff5a8a', 1.5, () => { c.moveTo(0, 20); c.quadraticCurveTo(0, 2, 16, 2); c.quadraticCurveTo(32, 2, 32, 20); c.closePath(); }); c.fillStyle = '#fff'; c.beginPath(); ell(c, 9, 10, 3, 2.5); ell(c, 22, 9, 3.5, 2.6); ell(c, 16, 16, 2, 1.6); c.fill(); shape(c, '#f6e8c8', 1.5, () => c.rect(11, 20, 10, 12)); }
    else { shape(c, '#555', 1.5, () => c.rect(2, 22, 28, 10)); shape(c, '#ff4a4a', 1.5, () => c.rect(0, 12, 32, 8)); c.strokeStyle = '#ccc'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(4 + i * 8, 20); c.lineTo(8 + i * 8, 22); } c.stroke(); }
  });
  TILES.spike = mk(c => {
    const s = P.spike;
    if (s === 'thorn') { c.fillStyle = '#3d6b2a'; c.fillRect(0, 22, T, 10); c.fillStyle = '#e8e0c8'; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(i * 8, 24); c.lineTo(i * 8 + 4, 8 + (i % 2) * 4); c.lineTo(i * 8 + 8, 24); } c.fill(); c.strokeStyle = OUT; c.lineWidth = 1; c.stroke(); c.fillStyle = '#4f8a36'; c.beginPath(); ell(c, 8, 24, 7, 4); ell(c, 24, 25, 8, 4); c.fill(); }
    else if (s === 'cactus') { shape(c, '#4f9a3a', 1.5, () => { c.roundRect(10, 6, 12, 26, 6); }); shape(c, '#4f9a3a', 1.5, () => { c.roundRect(2, 14, 8, 6, 3); c.roundRect(22, 10, 8, 6, 3); }); c.fillStyle = '#fff'; for (let i = 0; i < 8; i++) c.fillRect(9 + (i % 2) * 13, 9 + i * 3, 2, 1); }
    else if (s === 'icicle') { c.fillStyle = '#e0f6ff'; c.beginPath(); for (let i = 0; i < 4; i++) { c.moveTo(i * 8, T); c.lineTo(i * 8 + 4, 10 + (i % 2) * 6); c.lineTo(i * 8 + 8, T); } c.fill(); c.strokeStyle = '#7fb8e0'; c.lineWidth = 1.2; c.stroke(); }
    else if (s === 'coral') { c.strokeStyle = '#ff6f8f'; c.lineCap = 'round'; c.lineWidth = 4; c.beginPath(); c.moveTo(8, T); c.lineTo(8, 14); c.lineTo(3, 8); c.moveTo(8, 18); c.lineTo(14, 10); c.moveTo(24, T); c.lineTo(24, 12); c.lineTo(29, 6); c.moveTo(24, 18); c.lineTo(18, 14); c.stroke(); c.fillStyle = '#fff'; c.beginPath(); ell(c, 3, 8, 2, 2); ell(c, 29, 6, 2, 2); ell(c, 14, 10, 2, 2); c.fill(); }
    else { c.fillStyle = '#444'; c.fillRect(0, 20, T, 12); c.fillStyle = '#ffd400'; for (let i = 0; i < 4; i++) { c.beginPath(); c.moveTo(i * 8, 20); c.lineTo(i * 8 + 4, 20); c.lineTo(i * 8, 32); c.lineTo(i * 8 - 4, 32); c.fill(); } c.fillStyle = '#888'; c.fillRect(4, 10, 4, 10); c.fillRect(24, 10, 4, 10); c.fillStyle = '#ccc'; c.fillRect(2, 8, 8, 3); c.fillRect(22, 8, 8, 3); }
  });
  TILES.quick = mk(c => { c.fillStyle = '#d8b46a'; c.fillRect(0, 0, T, T); c.strokeStyle = '#b8924a'; c.lineWidth = 1.5; for (let i = 0; i < 3; i++) { c.beginPath(); c.arc(16, 16, 4 + i * 5, i, i + 4); c.stroke(); } });
}

// ---------- Backgrounds (pre-rendered layers) ----------
let BG = null, BG_WORLD = -1;
function buildBG(wi) {
  if (BG_WORLD === wi) return;
  BG_WORLD = wi; BG = [];
  const key = WORLDS[wi].key, r = rng(wi * 31 + 7);
  const W = 768, H = VIEW_H, S = 2;
  const layer = (fn, par, yoff = 0) => { const cn = document.createElement('canvas'); cn.width = W * S; cn.height = H * S; const c = cn.getContext('2d'); c.scale(S, S); fn(c); BG.push({ cn, par, yoff }); };
  const skies = { jungle: ['#5ec8e0', '#d8f7d0'], forest: ['#9fd8ff', '#ffe6b0'], desert: ['#ff9a4a', '#ffe08a'], arctic: ['#7fb8ef', '#e8f6ff'], beach: ['#3fb0ff', '#c8f0ff'], city: ['#3a2d6a', '#ff9a6a'] };
  BG.sky = skies[key];
  const hills = (c, col, base, amp, n, jag = 0) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let i = 0; i <= n; i++) { const x = i * W / n; const y = base - (jag ? (i % 2 ? amp : amp * 0.3) * (0.6 + r() * 0.4) : Math.sin(i / n * Math.PI * 2 * 3 + r()) * amp * 0.5 - amp * 0.5 * r()); c.lineTo(x, y); } c.lineTo(W, H); c.closePath(); c.fill(); };
  const smoothHills = (c, col, base, amp, waves, ph) => { c.fillStyle = col; c.beginPath(); c.moveTo(0, H); for (let x = 0; x <= W; x += 8) c.lineTo(x, base - (Math.sin(x / W * Math.PI * 2 * waves + ph) * 0.5 + 0.5) * amp - Math.sin(x / W * Math.PI * 2 * waves * 2.3 + ph * 2) * amp * 0.15); c.lineTo(W, H); c.fill(); };
  if (key === 'jungle') {
    layer(c => { smoothHills(c, '#8fc9b0', 150, 70, 2, 1); c.fillStyle = '#e8fff0'; c.globalAlpha = .5; for (let i = 0; i < 3; i++) { c.fillRect(120 + i * 250, 60, 10, 120); } c.globalAlpha = 1; }, 0.1);
    layer(c => { smoothHills(c, '#5aa878', 190, 60, 3, 2); for (let i = 0; i < 7; i++) { const x = i * 110 + r() * 40; c.fillStyle = '#3d7d55'; c.fillRect(x - 6, 80, 12, 140); c.beginPath(); ell(c, x, 80, 40, 26); ell(c, x - 24, 92, 26, 18); ell(c, x + 26, 94, 26, 18); c.fill(); } c.fillStyle = '#9fe8ff'; c.fillRect(380, 100, 22, 120); c.fillStyle = '#e0faff'; for (let y = 100; y < 220; y += 12) c.fillRect(384 + (y % 24 ? 0 : 8), y, 4, 8); c.fillStyle = '#7a8a6a'; c.fillRect(560, 150, 70, 60); c.fillStyle = '#5c6c50'; for (let i = 0; i < 3; i++) c.fillRect(566 + i * 22, 160, 12, 50); c.fillRect(554, 142, 82, 10); }, 0.3);
    layer(c => { for (let i = 0; i < 9; i++) { const x = i * 90 + r() * 30; c.strokeStyle = '#2f6b2a'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 10, 50, x - 5, 70 + r() * 50); c.stroke(); c.fillStyle = '#4c9a34'; for (let j = 0; j < 5; j++) { c.beginPath(); ell(c, x + Math.sin(j) * 6, 15 + j * 14, 5, 3, 0.5); c.fill(); } } c.fillStyle = '#2f7a2a'; c.beginPath(); for (let x = 0; x < W; x += 30) { ell(c, x, 0, 40, 22); } c.fill(); for (let i = 0; i < 14; i++) { const x = i * 56 + r() * 20; c.fillStyle = '#3c8a30'; for (let j = 0; j < 5; j++) { c.beginPath(); c.moveTo(x, H); c.quadraticCurveTo(x + (j - 2) * 14, H - 50, x + (j - 2) * 22, H - 40 - r() * 20); c.quadraticCurveTo(x + (j - 2) * 8, H - 30, x + 4, H); c.fill(); } } }, 0.6);
  } else if (key === 'forest') {
    layer(c => { smoothHills(c, '#b8d8c0', 160, 60, 2, 0.5); }, 0.1);
    layer(c => { smoothHills(c, '#7fb88a', 200, 50, 3, 1); for (let i = 0; i < 9; i++) { const x = i * 88 + r() * 30, h = 90 + r() * 60; c.fillStyle = '#4f6b40'; c.fillRect(x - 5, 230 - h, 10, h); c.fillStyle = '#3f7a48'; c.beginPath(); c.moveTo(x, 200 - h - 30); c.lineTo(x - 34, 250 - h); c.lineTo(x + 34, 250 - h); c.fill(); c.beginPath(); c.moveTo(x, 220 - h); c.lineTo(x - 40, 285 - h); c.lineTo(x + 40, 285 - h); c.fill(); } }, 0.3);
    layer(c => { for (let i = 0; i < 6; i++) { const x = i * 130 + r() * 50, h = 60 + r() * 70, w = 50 + r() * 40, col = r.pick(['#e85a5a', '#f0a040', '#c070e0']); c.fillStyle = '#f6ecd6'; c.fillRect(x - 7, H - h, 14, h); shape(c, col, 2, () => { c.moveTo(x - w / 2, H - h + 4); c.quadraticCurveTo(x - w / 2, H - h - w * 0.5, x, H - h - w * 0.5); c.quadraticCurveTo(x + w / 2, H - h - w * 0.5, x + w / 2, H - h + 4); c.closePath(); }); c.fillStyle = '#fff'; for (let j = 0; j < 4; j++) { c.beginPath(); ell(c, x - w / 3 + j * w / 5, H - h - w * 0.25 + (j % 2) * 6, 4, 3); c.fill(); } } for (let i = 0; i < 16; i++) { c.fillStyle = '#3d7a40'; c.beginPath(); ell(c, i * 50 + r() * 20, H - 6, 26, 18); c.fill(); } }, 0.6);
  } else if (key === 'desert') {
    layer(c => { c.fillStyle = '#fff6c0'; c.beginPath(); ell(c, 560, 70, 34, 34); c.fill(); c.fillStyle = 'rgba(255,240,180,.35)'; c.beginPath(); ell(c, 560, 70, 50, 50); c.fill(); smoothHills(c, '#f3b866', 180, 40, 2, 0.3); c.fillStyle = '#e09a50'; c.beginPath(); c.moveTo(150, 180); c.lineTo(220, 90); c.lineTo(290, 180); c.fill(); c.beginPath(); c.moveTo(260, 180); c.lineTo(310, 120); c.lineTo(360, 180); c.fill(); }, 0.1);
    layer(c => { smoothHills(c, '#e8a458', 215, 45, 3, 1.4); c.fillStyle = '#c8803e'; c.fillRect(480, 130, 100, 80); for (let i = 0; i < 5; i++) c.fillRect(470 + i * 26, 118, 14, 14); c.fillStyle = '#7a4a20'; c.fillRect(518, 170, 24, 40); c.strokeStyle = '#f6efe0'; c.lineWidth = 3; c.lineCap = 'round'; const fx = 160, fy = 205; c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(fx + 40, fy - 30, fx + 90, fy - 10); c.stroke(); for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(fx + 20 + i * 11, fy - 18 + i); c.quadraticCurveTo(fx + 26 + i * 11, fy - 4, fx + 18 + i * 11, fy + 6); c.stroke(); } c.beginPath(); ell(c, fx + 100, fy - 12, 10, 6); c.stroke(); }, 0.3);
    layer(c => { for (let i = 0; i < 7; i++) { const x = i * 120 + r() * 50, h = 40 + r() * 40; c.fillStyle = '#5a9a40'; c.beginPath(); c.roundRect(x - 7, H - h, 14, h, 7); c.roundRect(x - 20, H - h * 0.7, 9, h * 0.35, 4); c.roundRect(x + 11, H - h * 0.8, 9, h * 0.3, 4); c.fill(); } }, 0.6);
  } else if (key === 'arctic') {
    layer(c => { for (let i = 0; i < 3; i++) { c.strokeStyle = ['rgba(120,255,180,.35)', 'rgba(160,120,255,.3)', 'rgba(120,220,255,.3)'][i]; c.lineWidth = 16; c.beginPath(); for (let x = 0; x <= W; x += 16) c.lineTo(x, 50 + i * 18 + Math.sin(x / 90 + i) * 14); c.stroke(); } hills(c, '#c4dcf0', 190, 120, 10, 1); }, 0.1);
    layer(c => { smoothHills(c, '#e8f4ff', 225, 45, 3, 2); for (let i = 0; i < 5; i++) { const x = i * 160 + r() * 40; c.fillStyle = '#a8d4f0'; c.beginPath(); c.moveTo(x, 225); c.lineTo(x + 15, 160); c.lineTo(x + 50, 150); c.lineTo(x + 70, 225); c.fill(); c.fillStyle = '#d8f0ff'; c.beginPath(); c.moveTo(x + 15, 160); c.lineTo(x + 50, 150); c.lineTo(x + 40, 190); c.fill(); } }, 0.3);
    layer(c => { for (let i = 0; i < 10; i++) { const x = i * 80 + r() * 40; c.fillStyle = '#2f5a4a'; c.beginPath(); c.moveTo(x, H - 90); c.lineTo(x - 22, H - 20); c.lineTo(x + 22, H - 20); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, H - 90); c.lineTo(x - 10, H - 60); c.lineTo(x + 10, H - 60); c.fill(); c.fillStyle = '#4a3a2a'; c.fillRect(x - 3, H - 20, 6, 20); } }, 0.6);
  } else if (key === 'beach') {
    layer(c => { c.fillStyle = '#fff8c0'; c.beginPath(); ell(c, 150, 60, 28, 28); c.fill(); c.fillStyle = '#1e8ad8'; c.fillRect(0, 170, W, H - 170); c.fillStyle = '#5ab8f0'; for (let i = 0; i < 40; i++) c.fillRect(r() * W, 175 + r() * 60, 16 + r() * 20, 2); c.fillStyle = '#3a8a4a'; c.beginPath(); ell(c, 520, 172, 60, 18); c.fill(); c.fillStyle = '#f6dca0'; c.beginPath(); ell(c, 520, 174, 64, 8); c.fill(); }, 0.1);
    layer(c => { c.fillStyle = '#6a4a30'; c.beginPath(); c.moveTo(300, 225); c.lineTo(310, 190); c.lineTo(400, 185); c.lineTo(420, 225); c.fill(); c.fillRect(350, 120, 5, 70); c.fillStyle = '#e8e0c8'; c.beginPath(); c.moveTo(356, 125); c.lineTo(395, 160); c.lineTo(356, 165); c.fill(); for (let i = 0; i < 4; i++) { const x = i * 200 + 80; c.strokeStyle = '#8a6040'; c.lineWidth = 6; c.beginPath(); c.moveTo(x, 240); c.quadraticCurveTo(x + 10, 180, x + 24, 140); c.stroke(); c.fillStyle = '#2f9a40'; for (let j = 0; j < 5; j++) { c.beginPath(); const a = -Math.PI + j * 0.75; c.moveTo(x + 24, 140); c.quadraticCurveTo(x + 24 + Math.cos(a) * 30, 130 + Math.sin(a) * 12, x + 24 + Math.cos(a) * 48, 150 + Math.sin(a) * 8); c.quadraticCurveTo(x + 24 + Math.cos(a) * 26, 140, x + 24, 144); c.fill(); } } }, 0.3);
    layer(c => { c.fillStyle = 'rgba(255,255,255,.6)'; for (let i = 0; i < 12; i++) { c.beginPath(); ell(c, r() * W, H - 10 - r() * 20, 20, 4); c.fill(); } }, 0.6);
  } else if (key === 'city') {
    layer(c => { c.fillStyle = '#ffe0a0'; c.beginPath(); ell(c, 600, 150, 40, 40); c.fill(); for (let i = 0; i < 16; i++) { const x = i * 50 + r() * 10, h = 80 + r() * 110, w = 34 + r() * 20; c.fillStyle = '#4a3f78'; c.fillRect(x, H - 60 - h, w, h + 60); c.fillStyle = 'rgba(255,230,140,.7)'; for (let yy = H - 52 - h; yy < H - 60; yy += 12) for (let xx = x + 4; xx < x + w - 6; xx += 9) if (r() < 0.45) c.fillRect(xx, yy, 4, 6); } }, 0.12);
    layer(c => { for (let i = 0; i < 9; i++) { const x = i * 90 + r() * 20, h = 60 + r() * 80, w = 50 + r() * 30; c.fillStyle = '#2d2850'; c.fillRect(x, H - 40 - h, w, h + 40); c.fillStyle = 'rgba(255,240,170,.85)'; for (let yy = H - 34 - h; yy < H - 40; yy += 14) for (let xx = x + 5; xx < x + w - 8; xx += 11) if (r() < 0.5) c.fillRect(xx, yy, 6, 8); } c.strokeStyle = '#e0a030'; c.lineWidth = 3; c.beginPath(); c.moveTo(420, 230); c.lineTo(420, 70); c.lineTo(540, 70); c.moveTo(400, 80); c.lineTo(420, 70); c.moveTo(520, 70); c.lineTo(520, 110); c.stroke(); }, 0.3);
    layer(c => { for (let i = 0; i < 6; i++) { const x = i * 130 + 40; c.fillStyle = '#222'; c.fillRect(x, H - 110, 4, 110); c.fillRect(x, H - 110, 18, 4); c.fillStyle = '#fff2a0'; c.beginPath(); ell(c, x + 18, H - 104, 5, 3); c.fill(); c.fillStyle = 'rgba(255,240,160,.15)'; c.beginPath(); c.moveTo(x + 14, H - 104); c.lineTo(x - 10, H); c.lineTo(x + 46, H); c.fill(); } }, 0.6);
  }
}
function drawBG(c, camx, camy, t) {
  const g = c.createLinearGradient(0, 0, 0, VIEW_H); g.addColorStop(0, BG.sky[0]); g.addColorStop(1, BG.sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, VIEW_W, VIEW_H);
  const vy = clamp(camy, 0, 600);
  for (const L of BG) {
    const w = 768; let ox = -((camx * L.par) % w); if (ox > 0) ox -= w;
    const oy = vy * L.par * 0.25;
    for (let x = ox; x < VIEW_W; x += w) c.drawImage(L.cn, x, oy, w, VIEW_H);
  }
}
