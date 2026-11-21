// ================= AUDIO =================
const AU = { ctx: null, master: null, music: null, sfx: null, noiseBuf: null, suck: null };
function auInit() {
  if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
  try {
    if (navigator.audioSession) navigator.audioSession.type = 'playback';
    const C = window.AudioContext || window.webkitAudioContext;
    AU.ctx = new C();
    AU.master = AU.ctx.createGain(); AU.master.gain.value = SAVE.muted ? 0 : 0.8; AU.master.connect(AU.ctx.destination);
    AU.music = AU.ctx.createGain(); AU.music.gain.value = 0.32; AU.music.connect(AU.master);
    AU.sfx = AU.ctx.createGain(); AU.sfx.gain.value = 0.7; AU.sfx.connect(AU.master);
    const len = AU.ctx.sampleRate * 1.5;
    AU.noiseBuf = AU.ctx.createBuffer(1, len, AU.ctx.sampleRate);
    const d = AU.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    setInterval(musicTick, 25);
  } catch (e) { AU.ctx = null; }
}
function setMuted(m) { SAVE.muted = m; persist(); if (AU.master) AU.master.gain.value = m ? 0 : 0.8; }
function tone(f, dur, type = 'square', vol = 0.3, f2 = null, delay = 0, dest = null) {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + delay;
  const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(dest || AU.sfx); o.start(t); o.stop(t + dur + 0.05);
}
function noise(dur, vol = 0.3, freq = 1000, type = 'lowpass', f2 = null, delay = 0, dest = null) {
  if (!AU.ctx) return;
  const t = AU.ctx.currentTime + delay;
  const s = AU.ctx.createBufferSource(); s.buffer = AU.noiseBuf;
  const fl = AU.ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(freq, t);
  if (f2) fl.frequency.exponentialRampToValueAtTime(f2, t + dur);
  const g = AU.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(fl); fl.connect(g); g.connect(dest || AU.sfx); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}
const SFX = {
  jump() { tone(330, 0.16, 'square', 0.15, 660); },
  jump2() { tone(440, 0.18, 'square', 0.14, 990); },
  flap() { tone(520, 0.08, 'triangle', 0.12, 700); noise(0.08, 0.05, 2000, 'bandpass'); },
  land() { noise(0.07, 0.12, 400); },
  coin() { tone(988, 0.07, 'square', 0.12); tone(1319, 0.18, 'square', 0.12, null, 0.06); },
  star() { [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.1, 'triangle', 0.13, null, i * 0.04)); },
  heart() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.12, 'sine', 0.2, null, i * 0.06)); },
  oneup() { [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.12, null, i * 0.08)); },
  hurt() { tone(500, 0.3, 'sawtooth', 0.18, 120); noise(0.2, 0.1, 800); },
  hit() { noise(0.1, 0.25, 1800, 'bandpass'); tone(220, 0.1, 'square', 0.12, 90); },
  pop() { tone(700, 0.1, 'sine', 0.2, 1400); noise(0.08, 0.1, 3000, 'highpass'); },
  break() { noise(0.25, 0.35, 900, 'lowpass', 200); tone(120, 0.2, 'square', 0.1, 60); },
  spit() { tone(300, 0.15, 'square', 0.2, 900); noise(0.12, 0.15, 2500, 'bandpass'); },
  puff() { noise(0.15, 0.2, 1500, 'bandpass', 600); },
  gulp() { tone(400, 0.12, 'sine', 0.3, 150); tone(250, 0.14, 'sine', 0.3, 90, 0.12); },
  transform() { [392, 523, 659, 784, 1047, 1319, 1568].forEach((f, i) => { tone(f, 0.14, 'square', 0.1, null, i * 0.055); tone(f * 1.5, 0.14, 'triangle', 0.06, null, i * 0.055 + 0.02); }); },
  water() { noise(0.2, 0.25, 1200, 'bandpass', 400); tone(600, 0.15, 'sine', 0.12, 300); },
  splash() { noise(0.3, 0.2, 1500, 'lowpass', 300); },
  fire() { noise(0.09, 0.08, 700, 'lowpass', 300); },
  bite() { tone(180, 0.08, 'square', 0.25, 80); noise(0.06, 0.25, 3000, 'highpass'); },
  slash() { noise(0.14, 0.25, 4000, 'highpass', 1200); tone(900, 0.1, 'sawtooth', 0.06, 300); },
  charge() { tone(110, 0.4, 'sawtooth', 0.18, 220); noise(0.35, 0.15, 600); },
  stomp() { tone(90, 0.4, 'sine', 0.5, 35); noise(0.4, 0.4, 300); },
  camo() { [800, 600, 400, 300].forEach((f, i) => tone(f, 0.1, 'sine', 0.12, null, i * 0.05)); },
  roar(big = 1) { tone(140 * (big ? 0.7 : 1.4), 0.7, 'sawtooth', 0.22, 60, 0, null); noise(0.8, 0.25 * big, 500, 'lowpass', 150); tone(95 * (big ? 0.7 : 1.4), 0.6, 'square', 0.12, 50, 0.05); },
  thump() { tone(70, 0.25, 'sine', 0.45, 35); noise(0.15, 0.2, 200); },
  bounce() { tone(200, 0.25, 'sine', 0.3, 800); },
  checkpoint() { [523, 784, 1047, 1568].forEach((f, i) => tone(f, 0.15, 'triangle', 0.15, null, i * 0.07)); },
  egg() { noise(0.15, 0.2, 2500, 'highpass'); [784, 988, 1175, 1568].forEach((f, i) => tone(f, 0.12, 'square', 0.1, null, 0.1 + i * 0.07)); },
  golden() { [523, 659, 784, 1047, 784, 1047, 1319, 1568].forEach((f, i) => tone(f, 0.16, 'square', 0.12, null, i * 0.08)); },
  click() { tone(800, 0.05, 'square', 0.1); },
  deny() { tone(200, 0.2, 'square', 0.15, 150); },
  victory() {
    stopMusic();
    const n = [523, 523, 523, 659, 784, 0, 659, 784, 1047, 1047, 1047];
    const d = [0.12, 0.12, 0.12, 0.2, 0.36, 0.1, 0.16, 0.16, 0.5, 0, 0];
    let t = 0; n.slice(0, 9).forEach((f, i) => { if (f) { tone(f, d[i] + 0.05, 'square', 0.13, null, t, AU.music); tone(f / 2, d[i] + 0.05, 'triangle', 0.25, null, t, AU.music); } t += d[i]; });
  },
  bossWin() {
    stopMusic();
    const seq = [392, 494, 587, 784, 587, 784, 988, 1175, 1568];
    seq.forEach((f, i) => { tone(f, 0.22, 'square', 0.12, null, i * 0.13, AU.music); tone(f / 2, 0.22, 'triangle', 0.25, null, i * 0.13, AU.music); });
  },
};
function suckStart() {
  if (!AU.ctx || AU.suck) return;
  const s = AU.ctx.createBufferSource(); s.buffer = AU.noiseBuf; s.loop = true;
  const fl = AU.ctx.createBiquadFilter(); fl.type = 'bandpass'; fl.Q.value = 2.5;
  const t = AU.ctx.currentTime;
  fl.frequency.setValueAtTime(400, t); fl.frequency.exponentialRampToValueAtTime(2200, t + 0.6);
  const g = AU.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.08);
  const lfo = AU.ctx.createOscillator(); lfo.frequency.value = 9; const lg = AU.ctx.createGain(); lg.gain.value = 300;
  lfo.connect(lg); lg.connect(fl.frequency); lfo.start();
  s.connect(fl); fl.connect(g); g.connect(AU.sfx); s.start();
  AU.suck = { s, g, lfo };
}
function suckStop() {
  if (!AU.suck) return;
  const { s, g, lfo } = AU.suck; const t = AU.ctx.currentTime;
  g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(g.gain.value, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
  s.stop(t + 0.1); lfo.stop(t + 0.1); AU.suck = null;
}

// ---------- music sequencer ----------
const SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10], mixolydian: [0, 2, 4, 5, 7, 9, 10] };
const RHY = [
  [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 0, 0], [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 0],
  [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0], [1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 0, 0],
  [1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]];
function genSong(cfg) {
  const r = rng(cfg.seed * 7919);
  const sc = SCALES[cfg.scale];
  const deg = d => { const o = Math.floor(d / 7); return cfg.root + sc[((d % 7) + 7) % 7] + o * 12; };
  const bars = 8, steps = bars * 16;
  const mel = new Array(steps).fill(null), bass = new Array(steps).fill(null), drum = new Array(steps).fill(0);
  const rA = r.pick(RHY), rB = r.pick(RHY);
  // motif: contour of scale offsets
  const motif = []; let cur = 0; for (let i = 0; i < 16; i++) { cur += r.pick([-2, -1, -1, 0, 1, 1, 2, 3, -3]); cur = clamp(cur, -3, 6); motif.push(cur); }
  const motif2 = motif.map((v, i) => i < 8 ? v : clamp(v + r.pick([-2, 0, 2]), -3, 7));
  for (let b = 0; b < bars; b++) {
    const ch = cfg.prog[b % 4];
    const rr = (b % 4 === 1 || b % 4 === 3) ? rB : rA;
    const mo = b >= 4 ? motif2 : motif;
    for (let s = 0; s < 16; s++) {
      const i = b * 16 + s;
      if (rr[s]) {
        let d = ch + mo[s];
        if (s % 4 === 0) { const ct = [ch, ch + 2, ch + 4, ch + 7]; d = ct.reduce((a, c) => Math.abs(c - d) < Math.abs(a - d) ? c : a, ct[0]); }
        if (b % 4 === 3 && s >= 12) d = (s === 12 ? ch + 2 : null);
        mel[i] = d === null ? null : deg(d + 7);
      }
      // bass
      const bp = cfg.boss ? [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] : [1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0];
      if (bp[s]) bass[i] = deg(ch + ((s === 6 || s === 14) && !cfg.boss ? 4 : 0)) - 24 + (cfg.boss && s % 8 === 4 ? 12 : 0);
      drum[i] = (s % 8 === 0 ? 1 : 0) | (s % 8 === 4 ? 2 : 0) | (s % 2 === 0 ? 4 : 0) | (cfg.boss && s % 4 === 2 ? 1 : 0);
    }
  }
  return { mel, bass, drum, bpm: cfg.bpm, lead: cfg.lead, steps };
}
const MUS = { song: null, cfg: null, step: 0, next: 0 };
const songCache = new Map();
function playMusic(cfg) {
  if (MUS.cfg === cfg) return;
  MUS.cfg = cfg;
  if (!songCache.has(cfg)) songCache.set(cfg, genSong(cfg));
  MUS.song = songCache.get(cfg); MUS.step = 0; MUS.next = AU.ctx ? AU.ctx.currentTime + 0.1 : 0;
}
function stopMusic() { MUS.song = null; MUS.cfg = null; }
function musicTick() {
  if (!AU.ctx || !MUS.song) return;
  const s = MUS.song, dt = 60 / s.bpm / 4;
  if (MUS.next < AU.ctx.currentTime - 0.3) MUS.next = AU.ctx.currentTime + 0.05;
  while (MUS.next < AU.ctx.currentTime + 0.15) {
    const i = MUS.step % s.steps, t = MUS.next - AU.ctx.currentTime;
    const m = s.mel[i];
    if (m) { const f = 440 * Math.pow(2, (m - 69) / 12); tone(f, dt * 1.6, s.lead, s.lead === 'sawtooth' ? 0.07 : 0.1, null, t, AU.music); tone(f * 2, dt * 0.8, 'sine', 0.025, null, t, AU.music); }
    const b = s.bass[i];
    if (b) tone(440 * Math.pow(2, (b - 69) / 12), dt * 1.7, 'triangle', 0.28, null, t, AU.music);
    const d = s.drum[i];
    if (d & 1) tone(150, 0.12, 'sine', 0.45, 45, t, AU.music);
    if (d & 2) noise(0.12, 0.18, 1800, 'bandpass', null, t, AU.music);
    if (d & 4) noise(0.03, 0.05, 7000, 'highpass', null, t, AU.music);
    MUS.next += dt; MUS.step++;
  }
}
