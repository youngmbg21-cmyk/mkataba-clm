/* ═══════════════════════════════════════════════════════════════════════════
   THE BRAIN — HaTi AS A NETWORK OF NEURONS (Young ruled 27 Sep 2026, over the
   "HaTi Brain" artifact: "Now go build and merge to main. Put it as a page
   before home")

   One brain, three ways to look at it. Every neuron carries three positions —
   A (the brain), W (wiring: clusters round the real parts of the code) and
   L (floors: page, browser, server, outside) — and what is drawn is a blend,
   so a switch is a glide. Six process flows send a signal from part to part;
   a part a flow LANDS on is named with its step number and stays named until
   the flow ends (the 27 Sep ruling: background sparks never flash a name).

   WHAT IS READ, NOT DRAWN: js/brainmap.js holds the catalogue and the reader;
   GET /api/brain answers where each part is in the code, the links between
   parts that the code really makes, and the code updates the server has seen
   (a new published name is a new part, drawn with its code name and a gold
   ring for BRAIN_NEW_DAYS). The page spends nothing, writes nothing and
   touches no contract. Not on the phone: below 768px the desktop shell is not
   drawn.
   ═══════════════════════════════════════════════════════════════════════════ */

const BRAIN_REG_COLOR = { see: '#A7E8D8', in: '#E0CB8F', read: '#86B8EA', ai: '#AC9CFA', nego: '#38CDB8', sign: '#62D291', wall: '#E4ECEA', time: '#F2B24C', out: '#F09274' };
const BRAIN_IDLE_COL = '#2F6C63';
const BRAIN_GOLD = '#F2B24C';
const BRAIN_NEW_DAYS = 7;          // a part born in the code keeps its gold ring this long
const BRAIN_PENDING_MAX = 12;      // new parts drawn at once; the rest are counted in the update
const BRAIN_STEP_S = 3.2, BRAIN_PULSE_S = .85;
const BRAIN_ZMIN = .6, BRAIN_ZMAX = 4;
const BRAIN_LAY_Y = [168, 56, -56, -168];
const BRAIN_VIEWS = ['brain', 'wiring', 'floors'];
const BRAIN_TILT = [.2, .16, .46], BRAIN_SCALE = [1.38, .92, .72], BRAIN_CY = [.47, .47, .41];

const _brT = (k, v) => (typeof i18t === 'function' ? i18t(k, v) : k);
const _brTn = (k, n, v) => (typeof i18tn === 'function' ? i18tn(k, n, v) : k);
const _brEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---- per sitting, in memory ---- */
let _br = null;        // the running page: scene, player, camera
let _brMap = null;     // what GET /api/brain answered, for this sitting
let _brMapErr = '';
let _brView = 0;

/* ---------- small helpers ---------- */
function brRng(seed){ return function(){ seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function brHexA(h, a){ const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }
const _brSpr = {};
function brSprite(col){
  if (_brSpr[col]) return _brSpr[col];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.16, brHexA(col, .95)); gr.addColorStop(.42, brHexA(col, .32)); gr.addColorStop(1, brHexA(col, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return (_brSpr[col] = c);
}
const brColOf = r => (r ? BRAIN_REG_COLOR[r] || BRAIN_IDLE_COL : BRAIN_IDLE_COL);
function brGauss(R){ return (R() + R() + R() - 1.5) / 1.5; }
function brD3(a, b){ const x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2]; return Math.sqrt(x * x + y * y + z * z); }
function brPairs(prev, cur){
  const out = [];
  if (prev.length * cur.length <= 8) prev.forEach(a => cur.forEach(b => out.push([a, b])));
  else cur.forEach((b, j) => out.push([prev[j % prev.length], b]));
  return out;
}
const brEase = x => (x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/* ---------- the parts, as the page draws them ---------- */
function brPartLabel(p){ return p.pending ? p.code : _brT('brn_p_' + p.id); }
function brPartDesc(p){ return p.pending ? _brT('brn_pending') : _brT('brn_pd_' + p.id); }
/* The new parts the code grew lately: the born names of the newest updates,
   newest first, at most BRAIN_PENDING_MAX, each remembering its update. */
function brPendingParts(map){
  const out = [], seen = new Set(BRAIN_PARTS.map(p => p.code));
  const builds = (map && map.builds) || [];
  for (const b of builds){
    for (const n of ((b.diff && b.diff.born) || [])){
      if (seen.has(n.name) || out.length >= BRAIN_PENDING_MAX) continue;
      seen.add(n.name);
      out.push({ id: 'new:' + n.name, code: n.name, reg: n.reg || 'see', floor: n.floor == null ? 1 : n.floor, pending: true, file: n.file, build: b });
    }
  }
  return out;
}
function brIsNew(p){
  if (!p.build || !p.build.at) return false;
  return (Date.now() - Date.parse(p.build.at)) < BRAIN_NEW_DAYS * 86400000;
}

/* ---------- one brain, three arrangements ---------- */
function brRegionOf(x, y, z){
  const nx = x / 150, ny = y / 108, nz = z / 178;
  if (nz > 0.5) return ny > -0.05 ? 'ai' : 'see';
  if (nz < -0.55) return 'read';
  if (ny < -0.12 && Math.abs(nx) > 0.5 && nz > -0.5 && nz < 0.45) return 'nego';
  if (ny > 0.34 && nz > 0.08 && nz < 0.3) return 'sign';
  if (ny > 0.34 && nz > -0.17 && nz <= 0.08) return 'in';
  return null;
}
function brBuild(pending){
  const R = brRng(11), P = [];
  const add = (x, y, z, reg) => P.push({ A: [x, y, z], reg, heat: 0, s: .6 + R() * .8, x, y, z });
  let n = 0;
  while (n < 1120){
    const u = R() * 2 - 1, th = R() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = .8 + .2 * Math.sqrt(R());
    let x = s * Math.cos(th) * 150 * rr, y = u * 108 * rr, z = s * Math.sin(th) * 178 * rr;
    if (y < -62 + Math.max(0, -z - 60) * 0.15) continue;
    if (Math.abs(x) < 8 && y > -34) continue;
    const w = 1 + .05 * Math.sin(x * .09 + z * .02) * Math.sin(z * .085 + y * .06);
    x *= w; y *= w; z *= w; x += Math.sign(x) * 4;
    add(x, y, z, brRegionOf(x, y, z)); n++;
  }
  for (let i = 0; i < 130; i++){ const side = i % 2 ? 1 : -1; add(side * 36 + brGauss(R) * 18, -24 + brGauss(R) * 14, -8 + brGauss(R) * 42, 'wall'); }
  for (let i = 0; i < 180; i++){
    const u = R() * 2 - 1, th = R() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = .82 + .18 * R();
    const x = s * Math.cos(th) * 96 * rr; let y = u * 40 * rr; const z = s * Math.sin(th) * 54 * rr; y += Math.sin(x * .12) * 3;
    if (y > 22) continue; add(x, y - 80, z - 118, 'time');
  }
  for (let i = 0; i < 72; i++){ const a = R() * Math.PI * 2, r = 13 + R() * 6, y = -72 - R() * 100; add(Math.cos(a) * r, y, -50 + Math.sin(a) * r + (y + 72) * -0.08, 'out'); }

  const E = [], seen = new Set();
  for (let i = 0; i < P.length; i++){
    const best = [];
    for (let j = 0; j < P.length; j++){
      if (i === j) continue; const d = brD3(P[i].A, P[j].A); if (d > 30) continue;
      if (best.length < 2){ best.push([d, j]); best.sort((a, b) => a[0] - b[0]); } else if (d < best[1][0]){ best[1] = [d, j]; best.sort((a, b) => a[0] - b[0]); }
    }
    best.forEach(([, j]) => { const k = i < j ? i + '_' + j : j + '_' + i; if (!seen.has(k)){ seen.add(k); E.push([i, j]); } });
  }

  const cat = BRAIN_PARTS.map(p => Object.assign({}, p, { pending: false }));
  const all = cat.concat(pending || []);
  const byReg = {}; P.forEach((p, i) => { (byReg[p.reg || '_'] = byReg[p.reg || '_'] || []).push(i); });
  const HR = brRng(5), chosen = {}, hubs = [];
  all.forEach((h, idx) => {
    const pool = byReg[h.reg] || byReg.see; chosen[h.reg] = chosen[h.reg] || [];
    let best = null, bd = -1;
    for (let t = 0; t < 40; t++){ const p = P[pool[Math.floor(HR() * pool.length)]]; const md = chosen[h.reg].reduce((m, q) => Math.min(m, brD3(p.A, q)), 1e9); if (md > bd){ bd = md; best = p; } }
    chosen[h.reg].push(best.A); const k = h.reg === 'wall' ? 1 : 1.04;
    hubs.push(Object.assign(h, { idx, A: [best.A[0] * k, best.A[1] * k, best.A[2] * k], heat: 0, hold: 0, born: 1, ph: HR() * 6.28, x: 0, y: 0, z: 0 }));
  });

  const WR = brRng(23), C = {}, N = BRAIN_REGIONS.length;
  BRAIN_REGIONS.forEach((r, i) => { const y = 1 - (i + .5) / N * 2, rr = Math.sqrt(1 - y * y), th = i * 2.399963; C[r] = [Math.cos(th) * rr * 215, y * .85 * 190, Math.sin(th) * rr * 215]; });
  const cnt = {};
  hubs.forEach(h => {
    const c = C[h.reg] || C.see; cnt[h.reg] = (cnt[h.reg] || 0) + 1; const k = cnt[h.reg], a = k * 2.4 + h.idx, rad = 26 + k * 12;
    h.W = [c[0] + Math.cos(a) * rad, c[1] + ((k % 3) - 1) * 30 + brGauss(WR) * 8, c[2] + Math.sin(a) * rad];
  });
  const COL = { in: -205, read: -150, see: -95, ai: -40, nego: 10, sign: 60, time: 110, wall: 160, out: 205 }, lc = {};
  hubs.forEach(h => {
    const fl = Math.max(0, Math.min(BRAIN_FLOORS - 1, h.floor | 0)), key = fl + h.reg; lc[key] = (lc[key] || 0) + 1; const k = lc[key];
    h.L = [(COL[h.reg] || 0) + ((k % 2) ? -1 : 1) * k * 9, BRAIN_LAY_Y[fl], -95 + ((h.idx * 53) % 190) + brGauss(WR) * 10];
  });
  P.forEach(p => {
    let bi = 0, bd = 1e9; hubs.forEach((h, i) => { const d = brD3(p.A, h.A); if (d < bd){ bd = d; bi = i; } }); const h = hubs[bi];
    if (p.reg) p.W = [h.W[0] + brGauss(WR) * 30, h.W[1] + brGauss(WR) * 24, h.W[2] + brGauss(WR) * 30];
    else { const u = WR() * 2 - 1, th = WR() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = 150 + WR() * 190; p.W = [s * Math.cos(th) * rr, u * rr * .8, s * Math.sin(th) * rr]; }
    const lx = h.L[0] + brGauss(WR) * 44, lz = h.L[2] + brGauss(WR) * 40;
    p.L = [Math.max(-238, Math.min(238, lx)), h.L[1] + brGauss(WR) * 2, Math.max(-148, Math.min(148, lz))];
  });
  hubs.forEach(h => { h.nb = []; P.forEach((p, i) => { const d = brD3(h.A, p.A); if (d < 48) h.nb.push([i, 1 - d / 48]); }); });
  const labA = BRAIN_REGIONS.map(r => {
    const ids = byReg[r] || []; let x = 0, y = 0, z = 0; ids.forEach(i => { x += P[i].A[0]; y += P[i].A[1]; z += P[i].A[2]; });
    const L0 = ids.length || 1; x /= L0; y /= L0; z /= L0;
    if (r === 'wall') return [0, y - 10, z + 10];
    if (r === 'out') return [x + 40, y - 40, z];
    const L = Math.sqrt(x * x + y * y + z * z) || 1, push = (L + 46) / L, dy = r === 'sign' ? 16 : r === 'in' ? -6 : 0;
    return [x * push, y * push + dy, z * push];
  });
  const labW = BRAIN_REGIONS.map(r => [C[r][0] * 1.42, C[r][1] * 1.42 + 30, C[r][2] * 1.42]);
  const byId = {}; hubs.forEach(h => { byId[h.id] = h; });
  return { P, E, hubs, byId, labA, labW };
}

/* ---------- state for one sitting of the page ---------- */
function brFresh(){
  const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return {
    S: brBuild(brPendingParts(_brMap)), RM,
    w: [1, 0, 0], wFrom: [1, 0, 0], wTo: [1, 0, 0], wT: 1,
    rot: -1.05, tiltOff: 0, autoRot: !RM, speed: 1, zoom: 1, panX: 0, panY: 0,
    W: 0, H: 0, T: 0, glowWall: 0, pulses: [], traces: [], reached: new Map(),
    player: { f: null, i: -1, t: 0, playing: false, done: false },
    upd: null, updT: 0, idleT: 0, idleH: 1.2, hover: null, drag: null, pinch: null, touches: new Map(),
    raf: 0, last: 0, cv: null, ctx: null, SC: 1, SZ: 1, CY: .47, cR: 1, sR: 0, cT: 1, sT: 0, PX: []
  };
}

/* ---------- flows ---------- */
function brFlare(h, str){
  const b = _br; h.heat = Math.max(h.heat, str);
  h.nb.forEach(([i, wt]) => { const p = b.S.P[i]; p.heat = Math.max(p.heat, str * wt); });
  if (h.floor === 2) b.glowWall = Math.max(b.glowWall, str);
}
function brStartStep(i){
  const b = _br, f = b.player.f; b.player.i = i; b.player.t = 0;
  b.S.hubs.forEach(h => { h.hold = 0; });
  const st = f.steps[i], prev = i > 0 ? f.steps[i - 1] : null;
  if (!prev) st.forEach(id => { const h = b.S.byId[id]; if (!h) return; brFlare(h, 1); h.hold = 1; b.reached.set(id, i + 1); });
  else brPairs(prev, st).forEach(([a, c]) => {
    const A = b.S.byId[a], B = b.S.byId[c]; if (!A || !B) return;
    if (a === c){ brFlare(B, 1); B.hold = 1; b.reached.set(c, i + 1); return; }
    b.pulses.push({ a, b: c, u: 0, kind: 'flow', step: i + 1 });
    if ((A.floor === 2) !== (B.floor === 2)) b.glowWall = 1;
  });
  brPaintSteps(); brPaintCap();
}
function brPlayFlow(f, from){
  const b = _br; if (!b) return;
  b.player.f = f; b.player.done = false; b.player.playing = true; b.upd = null;
  for (let k = b.pulses.length - 1; k >= 0; k--) if (b.pulses[k].kind === 'flow') b.pulses.splice(k, 1);
  b.traces = []; b.reached.clear(); b.S.hubs.forEach(h => { h.heat = 0; h.hold = 0; });
  const s = from || 0;
  for (let i = 0; i < s; i++) f.steps[i].forEach(id => b.reached.set(id, i + 1));
  for (let i = 1; i < s; i++) brPairs(f.steps[i - 1], f.steps[i]).forEach(([a, c]) => { if (a !== c) b.traces.push({ a, b: c }); });
  document.querySelectorAll('[data-br-flow]').forEach(x => x.setAttribute('aria-pressed', String(x.getAttribute('data-br-flow') === f.id)));
  document.querySelectorAll('[data-br-upd]').forEach(x => x.setAttribute('aria-pressed', 'false'));
  const t = document.getElementById('br-fl-title'); if (t) t.textContent = _brT('brn_f_' + f.id);
  const l = document.getElementById('br-fl-lead'); if (l) l.textContent = _brT('brn_flead_' + f.id);
  brStartStep(s); brPaintPlay();
}
function brShowUpdate(u){
  const b = _br; if (!b || !u) return;
  b.upd = u; b.updT = 0;
  if (b.player.playing){ b.player.playing = false; brPaintPlay(); }
  b.S.hubs.forEach(h => { if (h.pending && h.build && h.build.key === u.key){ h.born = b.RM ? 1 : 0; h.heat = 1; } });
  ((u.diff && u.diff.edgesAdded) || []).forEach(([a, c], k) => setTimeout(() => {
    if (_br === b && b.upd === u && b.S.byId[a] && b.S.byId[c]) b.pulses.push({ a, b: c, u: 0, kind: 'upd' });
  }, b.RM ? 0 : 1400 + k * 450));
  document.querySelectorAll('[data-br-upd]').forEach(x => x.setAttribute('aria-pressed', String(x.getAttribute('data-br-upd') === u.key)));
  const dot = document.getElementById('br-cap-dot'); if (dot) dot.style.background = BRAIN_GOLD;
  const k = document.getElementById('br-cap-k'); if (k) k.textContent = brUpdName(u) + ' · ' + brDay(u.at);
  const t = document.getElementById('br-cap-t'); if (t) t.textContent = _brT('brn_upd_cap', { what: brUpdWhat(u) });
}

/* ---------- the updates, in words ---------- */
function brDay(iso){
  const d = new Date(iso); if (isNaN(d)) return '';
  try { return d.toLocaleDateString(typeof langLocale === 'function' ? langLocale() : undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_){ return iso.slice(0, 10); }
}
function brUpdName(u){ return u.commit ? u.commit : _brT('brn_upd_code'); }
function brUpdTitle(u){ return u.diff && u.diff.first ? _brT('brn_upd_first') : (u.subject || _brT('brn_upd_code')); }
function brUpdWhat(u){
  const d = u.diff || {};
  if (d.first) return _brT('brn_upd_first_what', { p: u.parts, e: u.edges, n: u.published });
  const bits = [];
  const born = (d.born || []).length + (d.bornMore || 0), gone = (d.retired || []).length + (d.retiredMore || 0), add = (d.edgesAdded || []).length;
  if (born) bits.push(_brTn('brn_upd_born', born, { n: born }));
  if (gone) bits.push(_brTn('brn_upd_retired', gone, { n: gone }));
  if (add) bits.push(_brTn('brn_upd_links', add, { n: add }));
  if (d.edgesCut) bits.push(_brTn('brn_upd_cut', d.edgesCut, { n: d.edgesCut }));
  if ((d.lost || []).length) bits.push(_brT('brn_upd_lost', { names: d.lost.map(id => _brT('brn_p_' + id)).join(', ') }));
  return bits.join(' · ');
}

/* ---------- the frame loop ---------- */
function brUpdate(dt){
  const b = _br, S = b.S;
  b.T += dt;
  if (b.autoRot && !b.drag) b.rot += dt * .07;
  if (b.wT < 1){ b.wT = Math.min(1, b.wT + dt / 1.3); const e = brEase(b.wT); b.w = [0, 1, 2].map(i => b.wFrom[i] + (b.wTo[i] - b.wFrom[i]) * e); }
  const [a, c, l] = b.w;
  for (const p of S.P){ p.x = p.A[0] * a + p.W[0] * c + p.L[0] * l; p.y = p.A[1] * a + p.W[1] * c + p.L[1] * l; p.z = p.A[2] * a + p.W[2] * c + p.L[2] * l; }
  for (const h of S.hubs){
    const dx = Math.cos(b.T * .45 + h.ph) * 7 * c, dy = Math.sin(b.T * .5 + h.ph * 1.3) * 6 * c, dz = Math.sin(b.T * .4 + h.ph) * 7 * c;
    let x = h.A[0] * a + h.W[0] * c + h.L[0] * l + dx, y = h.A[1] * a + h.W[1] * c + h.L[1] * l + dy, z = h.A[2] * a + h.W[2] * c + h.L[2] * l + dz;
    if (h.born < 1){ h.born = Math.min(1, h.born + dt / 1.6); const e = brEase(h.born); x *= e; y = -10 + (y + 10) * e; z *= e; h.heat = Math.max(h.heat, 1 - h.born * .3); }
    h.x = x; h.y = y; h.z = z;
  }
  const pl = b.player;
  if (pl.playing){
    pl.t += dt * b.speed;
    if (pl.t >= BRAIN_STEP_S){
      if (pl.i < pl.f.steps.length - 1) brStartStep(pl.i + 1);
      else { pl.playing = false; pl.done = true; S.hubs.forEach(h => { h.hold = 0; }); brPaintSteps(); brPaintCap(); brPaintPlay(); }
    }
  }
  for (let k = b.pulses.length - 1; k >= 0; k--){
    const p = b.pulses[k];
    p.u += dt * (p.kind === 'flow' ? b.speed / BRAIN_PULSE_S : p.kind === 'upd' ? 1 / 1.1 : 1 / 1.6);
    if (p.u >= 1){
      const h = S.byId[p.b];
      if (h){ brFlare(h, p.kind === 'idle' ? .35 : 1); if (p.kind === 'flow'){ h.hold = 1; b.reached.set(p.b, p.step); b.traces.push({ a: p.a, b: p.b }); } }
      b.pulses.splice(k, 1);
    }
  }
  const dP = Math.pow(.16, dt), dH = Math.pow(.3, dt);
  for (const p of S.P){ if (p.heat > .002) p.heat *= dP; else p.heat = 0; }
  S.hubs.forEach(h => { h.heat *= dH; if (h.hold) h.heat = Math.max(h.heat, .62 + .12 * Math.sin(b.T * 5)); else if (b.reached.has(h.id)) h.heat = Math.max(h.heat, .2); });
  b.glowWall *= Math.pow(.25, dt);
  if (b.upd) b.updT += dt;
  if (!b.RM){
    b.idleT -= dt;
    if (b.idleT <= 0){ b.idleT = .12 + Math.random() * .2; const i = Math.floor(Math.random() * S.P.length); S.P[i].heat = Math.max(S.P[i].heat, .55); }
    b.idleH -= dt;
    if (b.idleH <= 0){
      b.idleH = (pl.playing ? 5 : 2.2) + Math.random() * 1.5;
      const x = S.hubs[Math.floor(Math.random() * S.hubs.length)].id, y = S.hubs[Math.floor(Math.random() * S.hubs.length)].id;
      if (x !== y) b.pulses.push({ a: x, b: y, u: 0, kind: 'idle' });
    }
  }
}
function brPj(x, y, z){
  const b = _br;
  const x1 = x * b.cR - z * b.sR, z1 = x * b.sR + z * b.cR, y2 = y * b.cT - z1 * b.sT, z2 = y * b.sT + z1 * b.cT, f = 820 / (820 - z2);
  return [b.W / 2 + b.panX + x1 * f * b.SC, b.H * b.CY + b.panY - y2 * f * b.SC, f, z2];
}
function brCtrl(A, B){
  const w = _br.w, mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2, mz = (A.z + B.z) / 2;
  const ca = [mx * .5, my * .5 - 12, mz * .5], cw = [(A.x + B.x) * .32, (A.y + B.y) * .32, (A.z + B.z) * .32], cl = [mx, my, mz + (Math.abs(A.y - B.y) < 4 ? -30 : 0)];
  return { x: ca[0] * w[0] + cw[0] * w[1] + cl[0] * w[2], y: ca[1] * w[0] + cw[1] * w[1] + cl[1] * w[2], z: ca[2] * w[0] + cw[2] * w[1] + cl[2] * w[2] };
}
function brBez(a, c, b, u){ const v = 1 - u; return { x: v * v * a.x + 2 * v * u * c.x + u * u * b.x, y: v * v * a.y + 2 * v * u * c.y + u * u * b.y, z: v * v * a.z + 2 * v * u * c.z + u * u * b.z }; }
function brCurve(A, C, B){
  const ctx = _br.ctx; ctx.beginPath(); const a = brPj(A.x, A.y, A.z); ctx.moveTo(a[0], a[1]);
  for (let k = 1; k <= 16; k++){ const pt = brBez(A, C, B, k / 16), q = brPj(pt.x, pt.y, pt.z); ctx.lineTo(q[0], q[1]); }
  ctx.stroke();
}
function brDraw(){
  const b = _br, S = b.S, ctx = b.ctx, w = b.w, W = b.W, H = b.H;
  ctx.clearRect(0, 0, W, H);
  const tilt = Math.max(-.2, Math.min(1.1, BRAIN_TILT[0] * w[0] + BRAIN_TILT[1] * w[1] + BRAIN_TILT[2] * w[2] + b.tiltOff));
  b.cR = Math.cos(b.rot); b.sR = Math.sin(b.rot); b.cT = Math.cos(tilt); b.sT = Math.sin(tilt);
  b.SC = Math.min(W, H * 1.15) / 600 * (BRAIN_SCALE[0] * w[0] + BRAIN_SCALE[1] * w[1] + BRAIN_SCALE[2] * w[2]);
  b.CY = BRAIN_CY[0] * w[0] + BRAIN_CY[1] * w[1] + BRAIN_CY[2] * w[2];
  b.SC *= b.zoom; b.SZ = b.SC / Math.pow(b.zoom, .65);   // zoom spreads neurons apart more than it grows them
  const P = S.P, PX = b.PX, SZ = b.SZ;
  for (let i = 0; i < P.length; i++) PX[i] = brPj(P[i].x, P[i].y, P[i].z);
  S.hubs.forEach(h => { h.p = brPj(h.x, h.y, h.z); });

  if (w[2] > .02) BRAIN_LAY_Y.forEach((y, li) => {
    const cs = [[-245, -155], [245, -155], [245, 155], [-245, 155]].map(([x, z]) => brPj(x, y, z));
    ctx.beginPath(); cs.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
    const wall = li === 2, g = wall ? b.glowWall : 0;
    ctx.fillStyle = wall ? 'rgba(228,236,234,' + ((.035 + g * .07) * w[2]) + ')' : 'rgba(120,200,190,' + (.03 * w[2]) + ')'; ctx.fill();
    ctx.strokeStyle = wall ? 'rgba(228,236,234,' + ((.28 + g * .6) * w[2]) + ')' : 'rgba(150,215,205,' + (.16 * w[2]) + ')'; ctx.lineWidth = wall ? 1.2 + g * 1.5 : 1; ctx.stroke();
  });

  ctx.lineWidth = .6; ctx.strokeStyle = 'rgba(120,200,188,.075)'; ctx.beginPath();
  S.E.forEach(([i, j]) => { const p = P[i], q = P[j], dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z; if (dx * dx + dy * dy + dz * dz > 4900) return; ctx.moveTo(PX[i][0], PX[i][1]); ctx.lineTo(PX[j][0], PX[j][1]); });
  ctx.stroke();

  ctx.globalCompositeOperation = 'lighter';
  S.E.forEach(([i, j]) => {
    const h = Math.max(P[i].heat, P[j].heat); if (h < .18) return;
    const p = P[i], q = P[j], dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z; if (dx * dx + dy * dy + dz * dz > 4900) return;
    ctx.strokeStyle = brHexA(brColOf(p.reg || q.reg), h * .55); ctx.lineWidth = .9; ctx.beginPath(); ctx.moveTo(PX[i][0], PX[i][1]); ctx.lineTo(PX[j][0], PX[j][1]); ctx.stroke();
  });
  /* The links the CODE makes (read by GET /api/brain), drawn in the Wiring view. */
  if (w[1] > .05 && _brMap && _brMap.edges){
    ctx.strokeStyle = 'rgba(150,215,205,' + (.16 * w[1]) + ')'; ctx.lineWidth = .9;
    _brMap.edges.forEach(([x, y]) => { const A = S.byId[x], B = S.byId[y]; if (A && B) brCurve(A, brCtrl(A, B), B); });
  }
  b.traces.forEach(t => { const A = S.byId[t.a], B = S.byId[t.b]; if (!A || !B) return; ctx.strokeStyle = brHexA(brColOf(B.reg), .3); ctx.lineWidth = 1.4; brCurve(A, brCtrl(A, B), B); });
  if (b.upd){
    ctx.setLineDash([5, 5]); ctx.strokeStyle = 'rgba(242,178,76,' + (b.updT < 6 ? .55 : .22) + ')'; ctx.lineWidth = 1.4;
    ((b.upd.diff && b.upd.diff.edgesAdded) || []).forEach(([x, y]) => { const A = S.byId[x], B = S.byId[y]; if (A && B) brCurve(A, brCtrl(A, B), B); });
    ctx.setLineDash([]);
  }
  const round = b.zoom > 1.3;
  for (let i = 0; i < P.length; i++){
    const p = P[i], q = PX[i], df = Math.max(0, Math.min(1, (q[3] + 260) / 520)), col = brColOf(p.reg), sz = (1 + p.s * 1.2) * q[2] * SZ * 1.05;
    ctx.globalAlpha = (p.reg ? .3 : .22) + .5 * df; ctx.fillStyle = col;
    if (round){ ctx.beginPath(); ctx.arc(q[0], q[1], sz * .55, 0, 6.283); ctx.fill(); } else ctx.fillRect(q[0] - sz / 2, q[1] - sz / 2, sz, sz);
    if (p.heat > .12){ ctx.globalAlpha = Math.min(1, p.heat); const s = (5 + p.heat * 16) * q[2] * SZ; ctx.drawImage(brSprite(col), q[0] - s / 2, q[1] - s / 2, s, s); }
  }
  ctx.globalAlpha = 1;
  const found = id => !_brMap || !_brMap.parts || !_brMap.parts[id] || _brMap.parts[id].found;
  S.hubs.forEach(h => {
    const q = h.p, col = brColOf(h.reg), df = Math.max(0, Math.min(1, (q[3] + 260) / 520)), base = (7 + 2 * w[1]) * q[2] * SZ;
    ctx.globalAlpha = (.45 + .45 * df) * (.2 + .8 * h.born) * (h.pending || found(h.id) ? 1 : .35);
    ctx.drawImage(brSprite(col), q[0] - base, q[1] - base, base * 2, base * 2);
    if (h.heat > .05){ ctx.globalAlpha = Math.min(1, h.heat); const s = (14 + h.heat * 46) * q[2] * SZ; ctx.drawImage(brSprite(col), q[0] - s / 2, q[1] - s / 2, s, s); }
    if (b.hover === h){ ctx.globalAlpha = 1; const s = 34 * q[2] * SZ; ctx.drawImage(brSprite(col), q[0] - s / 2, q[1] - s / 2, s, s); }
  });
  ctx.globalAlpha = 1;
  b.pulses.forEach(p => {
    const A = S.byId[p.a], B = S.byId[p.b]; if (!A || !B) return;
    const C = brCtrl(A, B), col = p.kind === 'upd' ? BRAIN_GOLD : brColOf(B.reg), u = p.u < .5 ? 2 * p.u * p.u : 1 - Math.pow(-2 * p.u + 2, 2) / 2, strong = p.kind !== 'idle';
    for (let k = 10; k >= 0; k--){
      const pt = brBez(A, C, B, Math.max(0, u - k * .022)), q = brPj(pt.x, pt.y, pt.z), s = (strong ? 22 : 12) * (1 - k / 12) * q[2] * SZ;
      ctx.globalAlpha = (strong ? 1 : .45) * (1 - k / 11); ctx.drawImage(brSprite(col), q[0] - s / 2, q[1] - s / 2, s, s);
    }
  });
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  S.hubs.forEach(h => {
    if (!h.pending || !brIsNew(h)) return;
    const q = h.p, r = (10 + 2 * Math.sin(b.T * 2.4)) * q[2] * SZ * .9;
    ctx.strokeStyle = 'rgba(242,178,76,' + (.55 + .25 * Math.sin(b.T * 2.4)) + ')'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(q[0], q[1], r, 0, Math.PI * 2); ctx.stroke();
    if (h.born < 1){ const rr = (12 + h.born * 70) * q[2] * SZ; ctx.strokeStyle = 'rgba(242,178,76,' + (1 - h.born) + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], rr, 0, Math.PI * 2); ctx.stroke(); }
  });
  brDrawLabels();
}
const _brTw = {};
function brTw(s, font){ const k = font + s; if (_brTw[k] == null){ _br.ctx.font = font; _brTw[k] = _br.ctx.measureText(s).width; } return _brTw[k]; }
function brRRect(x, y, w0, h0, r){ const ctx = _br.ctx; ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w0, y, x + w0, y + h0, r); ctx.arcTo(x + w0, y + h0, x, y + h0, r); ctx.arcTo(x, y + h0, x, y, r); ctx.arcTo(x, y, x + w0, y, r); ctx.closePath(); }
const BR_FONT = 'Geist, "IBM Plex Sans", system-ui, sans-serif', BR_MONO = '"Geist Mono", Geist, ui-monospace, monospace';
function brDrawLabels(){
  const b = _br, S = b.S, ctx = b.ctx, w = b.w, small = b.W < 560;
  ctx.textBaseline = 'middle';
  if (w[2] > .3) BRAIN_LAY_Y.forEach((y, li) => {
    const q = brPj(-245, y, 155), al = (w[2] - .3) / .7;
    ctx.textAlign = 'left'; ctx.font = '600 12px ' + BR_FONT;
    ctx.fillStyle = li === 2 ? 'rgba(240,246,244,' + (.95 * al) + ')' : 'rgba(200,228,222,' + (.85 * al) + ')';
    ctx.fillText(_brT('brn_floor_' + li), Math.max(10, q[0] - 4), q[1] + 14);
    if (!small){ ctx.font = '400 11px ' + BR_FONT; ctx.fillStyle = 'rgba(143,179,172,' + (.85 * al) + ')'; ctx.fillText(_brT('brn_floor_s_' + li), Math.max(10, q[0] - 4), q[1] + 29); }
  });
  const rh = {}; S.hubs.forEach(h => { rh[h.reg] = Math.max(rh[h.reg] || 0, h.heat); });
  const la = 1 - w[2];
  if (la > .05) BRAIN_REGIONS.forEach((r, i) => {
    const A = S.labA[i], B = S.labW[i], k = w[1] / ((w[0] + w[1]) || 1);
    const q = brPj(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k), df = Math.max(0, Math.min(1, (q[3] + 300) / 600)), lit = Math.min(1, (rh[r] || 0) * 1.3);
    const brain = w[0] >= w[1], nm = brain ? _brT('brn_rb_' + r) : _brT('brn_r_' + r);
    ctx.textAlign = 'center'; ctx.font = '600 11px ' + BR_FONT; ctx.fillStyle = brHexA(BRAIN_REG_COLOR[r], (.35 + .4 * df + .25 * lit) * la);
    ctx.fillText(nm.toUpperCase(), q[0], q[1]);
    if (brain && !small){ ctx.font = '400 11px ' + BR_FONT; ctx.fillStyle = brHexA('#C9DAD6', (.3 + .35 * df + .3 * lit) * la); ctx.fillText(_brT('brn_r_' + r), q[0], q[1] + 14); }
  });
  const wiring = w[1] > .5;
  const inUpd = h => b.upd && h.pending && h.build && h.build.key === b.upd.key;
  const list = S.hubs.filter(h => wiring || b.reached.has(h.id) || h === b.hover || h.born < 1 || inUpd(h)).sort((x, y) => (x.hold - y.hold) || (x.p[3] - y.p[3]));
  list.forEach(h => {
    const q = h.p, df = Math.max(0, Math.min(1, (q[3] + 260) / 520));
    const now = !!h.hold || h === b.hover || h.born < 1, onPath = b.reached.has(h.id), hot = now || (inUpd(h) && b.updT < 6);
    if (wiring && !hot && !onPath && (small || df < .45)) return;
    const name = wiring || h.pending ? h.code : brPartLabel(h), num = onPath ? b.reached.get(h.id) : 0;
    const font = wiring || h.pending ? '500 10.5px ' + BR_MONO : (hot ? '600 12.5px ' : '500 11px ') + BR_FONT, nfont = '600 10.5px ' + BR_MONO;
    const nw = num ? brTw(String(num), nfont) + 10 : 0, wd = brTw(name, font) + 14 + nw, hg = hot ? 22 : 19, x = q[0] + 10 * q[2] * b.SZ, y = q[1] - hg / 2;
    ctx.globalAlpha = hot ? 1 : onPath ? .85 : .35 + .55 * df;
    ctx.fillStyle = hot ? 'rgba(4,22,21,.92)' : 'rgba(4,22,21,.66)'; brRRect(x, y, wd, hg, 4); ctx.fill();
    ctx.strokeStyle = h.pending && brIsNew(h) ? 'rgba(242,178,76,.9)' : brHexA(brColOf(h.reg), hot ? .95 : onPath ? .5 : .35); ctx.lineWidth = hot ? 1.4 : 1; ctx.stroke();
    if (num){
      ctx.fillStyle = brHexA(brColOf(h.reg), hot ? 1 : .7); brRRect(x + 3, y + 3, nw - 4, hg - 6, 3); ctx.fill();
      ctx.font = nfont; ctx.textAlign = 'center'; ctx.fillStyle = '#04191A'; ctx.fillText(String(num), x + 1 + nw / 2, y + hg / 2 + .5);
    }
    ctx.font = font; ctx.textAlign = 'left'; ctx.fillStyle = hot ? '#FFFFFF' : onPath ? '#D5E4E0' : '#C9DAD6'; ctx.fillText(name, x + 7 + nw, y + hg / 2 + .5);
  });
  ctx.globalAlpha = 1;
}
/* THE LOOP STOPS ITSELF when the page is left: a canvas no longer in the
   document, or another view, ends it on the next frame. */
function brFrame(now){
  const b = _br;
  if (!b || !b.cv || !b.cv.isConnected || (typeof state !== 'undefined' && state && state.view !== 'brain')){ if (b) b.raf = 0; return; }
  const dt = Math.min(.05, (now - b.last) / 1000); b.last = now;
  brUpdate(dt); brDraw();
  b.raf = requestAnimationFrame(brFrame);
}

/* ---------- zoom, turn, press ---------- */
function brZoomAt(k, sx, sy){
  const b = _br, nz = Math.max(BRAIN_ZMIN, Math.min(BRAIN_ZMAX, b.zoom * k)); k = nz / b.zoom; if (k === 1) return;
  const rx = sx - (b.W / 2 + b.panX), ry = sy - (b.H * b.CY + b.panY);
  b.panX = sx - b.W / 2 - rx * k; b.panY = sy - b.H * b.CY - ry * k; b.zoom = nz;
  if (b.zoom <= 1.001){ b.panX *= .6; b.panY *= .6; }
  const lim = Math.max(b.W, b.H) * b.zoom * .6; b.panX = Math.max(-lim, Math.min(lim, b.panX)); b.panY = Math.max(-lim, Math.min(lim, b.panY));
  brPaintZoom();
}
function brZoomReset(){ const b = _br; b.zoom = 1; b.panX = 0; b.panY = 0; brPaintZoom(); }
function brHubAt(mx, my, r){ let best = null, bd = r; _br.S.hubs.forEach(h => { if (!h.p) return; const d = Math.hypot(h.p[0] - mx, h.p[1] - my); if (d < bd){ bd = d; best = h; } }); return best; }
function brLocal(e){ const r = _br.cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; }
function brPinchState(){ const [a, c] = [..._br.touches.values()]; return { d: Math.hypot(a[0] - c[0], a[1] - c[1]) || 1, mx: (a[0] + c[0]) / 2, my: (a[1] + c[1]) / 2 }; }
function brFlowsOf(id){ return BRAIN_FLOWS.filter(f => f.steps.some(s => s.includes(id))); }
function brPress(h){
  const b = _br, f = brFlowsOf(h.id)[0];
  if (f && (!b.player.f || !b.player.f.steps.some(s => s.includes(h.id)))) brPlayFlow(f);
  else if (h.pending && h.build) brShowUpdate(h.build);
  else brFlare(h, 1);
}
function brShowTip(h, mx, my){
  const tip = document.getElementById('br-tip'); if (!tip) return;
  const b = _br, where = _brMap && _brMap.parts && _brMap.parts[h.id];
  const loc = h.pending ? _brT('brn_tip_where', { file: h.file || '', line: '' }).replace(/,\s*$/, '')
    : where ? (where.found ? _brT('brn_tip_where', { file: where.file, line: where.line }) : _brT('brn_tip_missing')) : '';
  const nf = brFlowsOf(h.id).length;
  tip.innerHTML = '<b>' + _brEsc(brPartLabel(h)) + '</b><code>' + _brEsc(h.code) + '</code>'
    + '<div class="br-tip-d">' + _brEsc(brPartDesc(h)) + '</div>'
    + '<div class="br-tip-r">' + _brEsc(_brT('brn_r_' + h.reg)) + ' · ' + _brEsc(_brT('brn_rb_' + h.reg)) + ' · ' + _brEsc(_brT('brn_floor_' + Math.max(0, Math.min(3, h.floor | 0))))
    + (nf ? ' · ' + _brEsc(_brTn('brn_tip_in_flows', nf, { n: nf })) : '') + '</div>'
    + (loc ? '<div class="br-tip-f">' + _brEsc(loc) + '</div>' : '')
    + (h.pending && h.build ? '<span class="br-tip-n">' + _brEsc(_brT('brn_new_in', { build: brUpdName(h.build), date: brDay(h.build.at) })) + '</span>' : '');
  tip.hidden = false;
  const tw = tip.offsetWidth, th = tip.offsetHeight;
  tip.style.left = Math.min(b.W - tw - 8, mx + 14) + 'px'; tip.style.top = Math.max(8, Math.min(b.H - th - 8, my - th - 10)) + 'px';
}
function brWireCanvas(cv){
  if (!cv || cv.dataset.brBound) return;
  cv.dataset.brBound = '1';
  const tip = () => document.getElementById('br-tip');
  cv.addEventListener('pointerdown', e => {
    const b = _br, [mx, my] = brLocal(e); b.touches.set(e.pointerId, [mx, my]);
    try { cv.setPointerCapture(e.pointerId); } catch (_){}
    if (b.touches.size === 2){ b.drag = null; b.pinch = brPinchState(); if (tip()) tip().hidden = true; return; }
    if (b.touches.size > 2) return;
    b.hover = brHubAt(mx, my, e.pointerType === 'touch' ? 26 : 16);   // a finger has no hover, so find what it pressed on
    b.drag = { x: e.clientX, y: e.clientY, moved: 0 }; cv.classList.add('is-drag');
  });
  cv.addEventListener('pointermove', e => {
    const b = _br, [mx, my] = brLocal(e);
    if (b.touches.has(e.pointerId)) b.touches.set(e.pointerId, [mx, my]);
    if (b.pinch && b.touches.size >= 2){ const n = brPinchState(); brZoomAt(n.d / b.pinch.d, n.mx, n.my); b.panX += n.mx - b.pinch.mx; b.panY += n.my - b.pinch.my; b.pinch = n; return; }
    if (b.drag){
      const dx = e.clientX - b.drag.x, dy = e.clientY - b.drag.y; b.drag.x = e.clientX; b.drag.y = e.clientY; b.drag.moved += Math.abs(dx) + Math.abs(dy);
      /* THE FACE FOLLOWS THE FINGER (Young, 27 Sep 2026: "Why does it drag the
         opposite way"): the side facing you sits at +z, and brPj puts it at
         x1 = x·cos − z·sin, so a LARGER turn moves it LEFT — the turn has to
         shrink as the pointer goes right. The tilt already followed it. */
      if (b.drag.moved > 4){ b.rot -= dx * .006; b.tiltOff = Math.max(-.5, Math.min(.8, b.tiltOff + dy * .004)); if (tip()) tip().hidden = true; }
      return;
    }
    if (e.pointerType === 'touch') return;
    b.hover = brHubAt(mx, my, 16); if (b.hover) brShowTip(b.hover, mx, my); else if (tip()) tip().hidden = true;
  });
  const end = e => {
    const b = _br, wasPinch = !!b.pinch; b.touches.delete(e.pointerId);
    if (b.touches.size < 2) b.pinch = null;
    if (wasPinch){ b.drag = null; cv.classList.remove('is-drag'); return; }
    if (b.touches.size) return;
    const click = b.drag && b.drag.moved < 6; b.drag = null; cv.classList.remove('is-drag');
    if (click && b.hover){ if (e.pointerType === 'touch'){ const [mx, my] = brLocal(e); brShowTip(b.hover, mx, my); } brPress(b.hover); }
    else if (click && e.pointerType === 'touch'){ b.hover = null; if (tip()) tip().hidden = true; }
  };
  cv.addEventListener('pointerup', end);
  cv.addEventListener('pointercancel', end);
  cv.addEventListener('pointerleave', e => { if (e.pointerType !== 'touch'){ _br.hover = null; if (tip()) tip().hidden = true; } });
  cv.addEventListener('wheel', e => { e.preventDefault(); const [mx, my] = brLocal(e); brZoomAt(Math.exp(-e.deltaY * (e.ctrlKey ? .012 : .0015)), mx, my); }, { passive: false });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => cv.addEventListener(t, e => e.preventDefault()));   // Safari's own page pinch must not take over
  cv.addEventListener('dblclick', e => { const [mx, my] = brLocal(e); if (_br.zoom > 1.4) brZoomReset(); else brZoomAt(2, mx, my); });
}
function brSetView(k){
  const b = _br; _brView = k; if (!b) return;
  b.wFrom = b.w.slice(); b.wTo = [0, 0, 0]; b.wTo[k] = 1; b.wT = b.RM ? 1 : 0; if (b.RM) b.w = b.wTo.slice();
  document.querySelectorAll('[data-br-view]').forEach(x => x.setAttribute('aria-pressed', String(+x.getAttribute('data-br-view') === k)));
  const t = document.getElementById('br-ov-t'); if (t) t.textContent = _brT('brn_ov_' + BRAIN_VIEWS[k]);
  brPaintSteps();
}

/* ---------- the page's own furniture ---------- */
function brFlowTone(f){ const c = {}; f.steps.forEach(s => s.forEach(id => { const p = BRAIN_PARTS.find(x => x.id === id); if (p) c[p.reg] = (c[p.reg] || 0) + 1; })); return Object.keys(c).sort((a, b) => c[b] - c[a])[0] || 'see'; }
function brFlowsHtml(){
  return BRAIN_FLOWS.map(f => '<button class="br-flow" type="button" data-br-flow="' + f.id + '" aria-pressed="false"><i style="background:' + BRAIN_REG_COLOR[brFlowTone(f)] + '"></i>'
    + '<span><b>' + _brEsc(_brT('brn_f_' + f.id)) + '</b><small>' + _brEsc(_brT('brn_fs_' + f.id)) + '</small></span>'
    + '<span class="br-flow-n">' + _brEsc(_brTn('brn_steps_n', f.steps.length, { n: f.steps.length })) + '</span></button>').join('');
}
function brStepTags(st, fid, i){
  const gaps = (_brMap && _brMap.flowGaps) || [];
  return st.map(id => {
    const p = BRAIN_PARTS.find(x => x.id === id); if (!p) return '';
    const gone = gaps.some(g => g.flow === fid && g.step === i + 1 && g.part === id);
    return '<span class="br-tag' + (gone ? ' is-gone' : '') + '"' + (gone ? ' title="' + _brEsc(_brT('brn_gap', { part: _brT('brn_p_' + id) })) + '"' : '') + '><i style="background:' + BRAIN_REG_COLOR[p.reg] + '"></i>' + _brEsc(_brT('brn_p_' + id)) + (gone ? ' · ' + _brEsc(_brT('brn_gap_tag')) : '') + '</span>'
      + (_brView === 1 ? '<span class="br-tag br-tag-code">' + _brEsc(p.code) + '</span>' : '')
      + (_brView === 2 ? '<span class="br-tag">' + _brEsc(_brT('brn_floor_' + p.floor)) + '</span>' : '');
  }).join('');
}
function brPaintSteps(){
  const b = _br; if (!b || !b.player.f) return;
  const f = b.player.f, pl = b.player;
  const cnt = document.getElementById('br-fl-count');
  if (cnt) cnt.textContent = pl.done ? _brT('brn_done') : _brT('brn_step_of', { i: pl.i + 1, n: f.steps.length });
  const ol = document.getElementById('br-steps'); if (!ol) return;
  ol.innerHTML = f.steps.map((s, i) => {
    const cls = (pl.done || i < pl.i) ? ' is-done' : (i === pl.i ? ' is-now' : '');
    return '<li><button type="button" class="br-st' + cls + '" data-br-step="' + i + '"' + (i === pl.i && !pl.done ? ' aria-current="step"' : '') + '><span class="br-st-k">' + (i + 1) + '</span>'
      + '<span><span class="br-st-x">' + _brEsc(_brT('brn_step_' + f.id + '_' + (i + 1))) + '</span><span class="br-tags">' + brStepTags(s, f.id, i) + '</span></span></button></li>';
  }).join('');
}
function brPaintCap(){
  const b = _br; if (!b || !b.player.f) return;
  const f = b.player.f, pl = b.player, st = f.steps[Math.max(0, pl.i)], p = BRAIN_PARTS.find(x => x.id === st[0]);
  const dot = document.getElementById('br-cap-dot'); if (dot) dot.style.background = BRAIN_REG_COLOR[p ? p.reg : 'see'];
  const k = document.getElementById('br-cap-k');
  if (k) k.textContent = pl.done ? _brT('brn_cap_flow_done', { flow: _brT('brn_f_' + f.id) }) : _brT('brn_cap_step', { flow: _brT('brn_f_' + f.id), i: pl.i + 1, n: f.steps.length });
  const t = document.getElementById('br-cap-t'); if (t) t.textContent = pl.done ? _brT('brn_cap_done') : _brT('brn_step_' + f.id + '_' + (pl.i + 1));
}
const BR_IC_PLAY = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M4.5 3v10l8-5z"/></svg>';
const BR_IC_PAUSE = '<svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="4" y="3" width="3" height="10"/><rect x="9" y="3" width="3" height="10"/></svg>';
const BR_IC_TURN = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><ellipse cx="8" cy="8" rx="6" ry="2.6"/><path d="M11.5 4.2l2 1.2-1.6 1.6"/></svg>';
function brPaintPlay(){ const b = _br, el = document.getElementById('br-play'); if (!b || !el) return; el.innerHTML = b.player.playing ? BR_IC_PAUSE + _brEsc(_brT('brn_pause')) : BR_IC_PLAY + _brEsc(b.player.done ? _brT('brn_play_again') : _brT('brn_play')); }
function brPaintRot(){ const b = _br, el = document.getElementById('br-rot'); if (!b || !el) return; el.innerHTML = BR_IC_TURN + _brEsc(b.autoRot ? _brT('brn_turning') : _brT('brn_still')); el.setAttribute('aria-pressed', String(b.autoRot)); }
function brPaintSpeed(){ document.querySelectorAll('[data-br-speed]').forEach(x => x.setAttribute('aria-pressed', String(+x.getAttribute('data-br-speed') === (_br ? _br.speed : 1)))); }
function brPaintZoom(){ const el = document.getElementById('br-zfit'); if (el && _br) el.textContent = Math.round(_br.zoom * 100) + '%'; }
/* The updates list: what the code changed, newest first, read off the server. */
function brUpdatesHtml(){
  if (_brMapErr) return '<p class="br-upd-note">' + _brEsc(_brT('brn_upd_failed', { why: _brMapErr })) + '</p>';
  if (!_brMap) return '<p class="br-upd-note">' + _brEsc(_brT('brn_upd_loading')) + '</p>';
  const builds = _brMap.builds || [];
  if (!builds.length) return '<p class="br-upd-note">' + _brEsc(_brT('brn_upd_none')) + '</p>';
  return builds.map(u => {
    const d = u.diff || {}, born = (d.born || []).slice(0, 6);
    const more = ((d.born || []).length - born.length) + (d.bornMore || 0);
    return '<button class="br-upd" type="button" data-br-upd="' + _brEsc(u.key) + '" aria-pressed="false">'
      + '<span class="br-upd-1"><span>' + _brEsc(brUpdName(u)) + '</span><span>' + _brEsc(brDay(u.at)) + '</span></span>'
      + '<b>' + _brEsc(brUpdTitle(u)) + '</b><span class="br-upd-2">' + _brEsc(brUpdWhat(u)) + '</span>'
      + (born.length ? '<span class="br-tags">' + born.map(n => '<span class="br-tag is-new">+ ' + _brEsc(n.name) + '</span>').join('')
        + (more > 0 ? '<span class="br-tag">' + _brEsc(_brT('brn_upd_more', { n: more })) + '</span>' : '') + '</span>' : '')
      + '</button>';
  }).join('');
}
function brPaintUpdates(){
  const host = document.getElementById('br-upds'); if (host) host.innerHTML = brUpdatesHtml();
  const b = _br, n = b ? b.S.hubs.filter(h => h.pending && brIsNew(h)).length : 0;
  const chip = document.getElementById('br-chip-new');
  if (chip){ chip.hidden = !n; const t = chip.querySelector('span'); if (t) t.textContent = _brTn('brn_new_week', n, { n }); }
  const s = document.getElementById('br-ov-s');
  if (s && b){
    const top = _brMap && _brMap.builds && _brMap.builds[0];
    s.textContent = top ? _brT('brn_counts_read', { n: b.S.P.length.toLocaleString(), p: b.S.hubs.length, build: brUpdName(top) }) : _brT('brn_counts', { n: b.S.P.length.toLocaleString(), p: b.S.hubs.length });
  }
}
/* Ask the server what the code says. Once per sitting; the new parts join the
   brain by rebuilding its positions, and the reader keeps the view, the flow
   and the camera. */
async function brLoadMap(){
  if (_brMap || typeof api !== 'function') return;
  try {
    const m = await api('brain', 'GET', undefined, { quiet: true });
    _brMap = m || { parts: {}, edges: [], builds: [] }; _brMapErr = '';
  } catch (e){ _brMapErr = (e && e.message) || String(e); }
  const b = _br; if (!b) return;
  if (_brMap){
    const keep = b.player.f ? { f: b.player.f, i: b.player.i } : null;
    b.S = brBuild(brPendingParts(_brMap));
    b.pulses = []; b.PX = [];
    if (keep){ const f = keep.f; b.reached.clear(); b.traces = []; for (let i = 0; i <= keep.i; i++) f.steps[i].forEach(id => b.reached.set(id, i + 1)); for (let i = 1; i <= keep.i; i++) brPairs(f.steps[i - 1], f.steps[i]).forEach(([a, c]) => { if (a !== c) b.traces.push({ a, b: c }); }); if (b.player.playing) f.steps[keep.i].forEach(id => { const h = b.S.byId[id]; if (h) h.hold = 1; }); }
  }
  brPaintUpdates(); brPaintSteps();
}

/* ---------- the stylesheet, once, in the product's own tokens ---------- */
function brEnsureCss(){
  if (document.getElementById('brain-css')) return;
  const css = [
    /* THE WHOLE SCREEN (Young, 27 Sep 2026): the page is exactly --view-h tall — the shell's own measured room below the bar (js/app.js, VIEW_OWNS_HEIGHT) — and the stage takes whatever the card has left, so nothing is left over at the bottom and nothing scrolls. */
    '.br-root{display:grid;grid-template-columns:minmax(0,1fr) 360px;grid-template-rows:minmax(0,1fr);gap:12px;align-items:stretch;height:var(--view-h);box-sizing:border-box;padding:12px var(--page-pad-x,16px);min-height:0}',
    '.br-stagecard{background:#04191A;border-radius:var(--radius-lg,8px);overflow:hidden;border:1px solid #0E2C29;display:flex;flex-direction:column;min-width:0;min-height:0}',
    '.br-stage{position:relative;flex:1 1 auto;min-height:0;background:radial-gradient(ellipse at 52% 44%,#0B312C 0%,#05201D 45%,#021011 100%)}',
    '.br-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;cursor:grab;touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}',
    '.br-stage canvas.is-drag{cursor:grabbing}',
    '.br-ov-tl{position:absolute;left:16px;top:14px;pointer-events:none;display:flex;flex-direction:column;gap:2px;max-width:70%}',
    '.br-ov-tl .t{color:#E4ECEA;font-weight:600;font-size:15px}',
    '.br-ov-tl .s{color:#8FB3AC;font-size:12px;font-family:var(--font-mono)}',
    '.br-ov-tr{position:absolute;right:14px;top:12px}',
    '.br-chip{all:unset;cursor:pointer;display:inline-flex;align-items:center;gap:7px;height:26px;padding:0 10px;border-radius:999px;border:1px solid rgba(242,178,76,.45);background:rgba(242,178,76,.10);color:#F6D08E;font-size:12px;font-weight:500}',
    '.br-chip[hidden]{display:none}',
    '.br-chip:hover{background:rgba(242,178,76,.18)}',
    '.br-chip:focus-visible{outline:2px solid #F2B24C;outline-offset:2px}',
    '.br-chip i{width:7px;height:7px;border-radius:50%;background:#F2B24C;box-shadow:0 0 0 3px rgba(242,178,76,.25)}',
    '.br-cap{position:absolute;left:12px;right:12px;bottom:10px;pointer-events:none;display:flex}',
    '.br-cap-in{background:rgba(3,20,19,.78);border:1px solid rgba(140,210,198,.18);border-radius:var(--radius-lg,8px);padding:7px 11px;max-width:435px;backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}',
    '.br-cap-k{font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:#8FB3AC;font-weight:600;display:flex;gap:8px;align-items:center}',
    '.br-cap-k i{width:6px;height:6px;border-radius:50%;display:inline-block;flex:none}',
    '.br-cap-t{color:#EAF2F0;font-size:12px;line-height:1.4;margin-top:2px}',
    '.br-tip{position:absolute;pointer-events:none;background:#062422;border:1px solid rgba(160,220,210,.28);border-radius:var(--radius-lg,8px);padding:9px 11px;color:#E4ECEA;font-size:12.5px;max-width:280px;box-shadow:0 8px 24px rgba(0,0,0,.35);z-index:3}',
    '.br-tip b{font-size:13px;font-weight:600;display:block}',
    '.br-tip code{font-family:var(--font-mono);font-size:11.5px;color:#9FD9CC}',
    '.br-tip .br-tip-d{margin-top:5px;color:#B8CCC8}',
    '.br-tip .br-tip-r{font-size:11px;color:#8FB3AC;margin-top:4px}',
    '.br-tip .br-tip-f{font-size:11px;color:#8FB3AC;font-family:var(--font-mono);margin-top:3px}',
    '.br-tip .br-tip-n{display:inline-block;margin-top:5px;font-size:11px;color:#F6D08E}',
    '.br-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px;padding:10px 12px;background:#031514;border-top:1px solid #0E2C29}',
    '.br-btn{all:unset;box-sizing:border-box;cursor:pointer;height:28px;padding:0 10px;border-radius:var(--radius,4px);border:1px solid rgba(160,220,210,.22);color:#DDEAE7;font-size:13px;font-weight:500;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}',
    '.br-btn:hover{background:rgba(160,220,210,.08)}',
    '.br-btn:focus-visible{outline:2px solid #7FD3C6;outline-offset:2px}',
    '.br-btn svg{width:14px;height:14px}',
    '.br-seg{display:inline-flex;border:1px solid rgba(160,220,210,.22);border-radius:var(--radius,4px);overflow:hidden;height:28px}',
    '.br-seg button{all:unset;box-sizing:border-box;cursor:pointer;padding:0 10px;font-size:13px;color:#BFD3CF;display:flex;align-items:center;gap:6px;font-weight:500;height:100%;white-space:nowrap}',
    '.br-seg.is-mono button{font-family:var(--font-mono);font-size:12.5px;padding:0 9px;font-weight:400}',
    '.br-seg button+button{border-left:1px solid rgba(160,220,210,.22)}',
    '.br-seg button[aria-pressed="true"]{background:#1E7A70;color:#fff}',
    '.br-seg button:focus-visible{outline:2px solid #7FD3C6;outline-offset:-2px}',
    '.br-seg kbd{font-family:var(--font-mono);font-size:10.5px;opacity:.6}',
    '.br-bar .sp{flex:1}',
    '.br-bar .hint{color:#7FA59E;font-size:12px}',
    '.br-panel{background:var(--color-surface);border:1px solid var(--rule);border-radius:var(--radius-lg,8px);display:flex;flex-direction:column;height:0;min-height:100%;overflow-y:auto;overscroll-behavior:contain;scrollbar-width:thin;scrollbar-color:var(--rule-strong) transparent;min-width:0}',
    '.br-psec{padding:14px 16px}',
    '.br-psec+.br-psec{border-top:1px solid var(--rule)}',
    '.br-ph{position:sticky;top:0;z-index:1;background:var(--color-surface);margin:-14px -16px 8px;padding:12px 16px 8px;display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
    '.br-ph h3{margin:0;font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:var(--color-neutral-600);font-weight:600}',
    '.br-ph span{font-size:11px;color:var(--color-neutral-500)}',
    '.br-flows{display:flex;flex-direction:column;gap:4px}',
    '.br-flow{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:10px minmax(0,1fr) auto;gap:10px;align-items:center;padding:8px 10px;border-radius:var(--radius,4px);border:1px solid transparent}',
    '.br-flow:hover{background:var(--color-bg)}',
    '.br-flow:focus-visible{outline:2px solid var(--accent-fill);outline-offset:1px}',
    '.br-flow i{width:10px;height:10px;border-radius:50%}',
    '.br-flow b{font-weight:600;font-size:13.5px;display:block;color:var(--color-text)}',
    '.br-flow small{color:var(--color-neutral-600);font-size:12px}',
    '.br-flow-n{font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-500);white-space:nowrap}',
    '.br-flow[aria-pressed="true"]{background:color-mix(in srgb,var(--accent-fill) 10%,var(--color-surface));border-color:color-mix(in srgb,var(--accent-fill) 35%,transparent)}',
    '.br-fh{display:flex;justify-content:space-between;align-items:baseline;gap:8px}',
    '.br-fh h2{margin:0;font-size:16px;font-weight:600;color:var(--color-text)}',
    '.br-fh span{font-family:var(--font-mono);font-size:12px;color:var(--color-neutral-500);white-space:nowrap}',
    '.br-flead{color:var(--color-neutral-600);margin:4px 0 10px;font-size:13px}',
    'ol.br-steps{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px}',
    '.br-st{all:unset;box-sizing:border-box;cursor:pointer;display:grid;grid-template-columns:22px minmax(0,1fr);gap:8px;padding:7px 8px;border-radius:var(--radius,4px);width:100%}',
    '.br-st:hover{background:var(--color-bg)}',
    '.br-st:focus-visible{outline:2px solid var(--accent-fill);outline-offset:1px}',
    '.br-st-k{width:22px;height:22px;border-radius:50%;border:1px solid var(--rule-strong);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-600);box-sizing:border-box}',
    '.br-st-x{font-size:13px;color:var(--color-text)}',
    '.br-st.is-done .br-st-x{color:var(--color-neutral-600)}',
    '.br-st.is-done .br-st-k{background:var(--color-bg);border-color:var(--rule)}',
    '.br-st.is-now{background:color-mix(in srgb,var(--accent-fill) 10%,var(--color-surface))}',
    '.br-st.is-now .br-st-k{background:var(--accent-fill);border-color:var(--accent-fill);color:#fff}',
    '.br-tags{display:flex;flex-wrap:wrap;gap:4px;margin-top:4px}',
    '.br-tag{font-size:11px;border-radius:var(--radius,4px);padding:0 6px;line-height:18px;background:var(--color-bg);color:var(--color-neutral-600);border:1px solid var(--rule);white-space:nowrap}',
    '.br-tag i{display:inline-block;width:6px;height:6px;border-radius:50%;margin-right:5px;vertical-align:1px;box-shadow:0 0 0 1px color-mix(in srgb,var(--color-text) 22%,transparent)}',
    '.br-tag-code{font-family:var(--font-mono);font-size:10.5px}',
    '.br-tag.is-new{border-color:var(--st-amber-line);color:var(--st-amber-fg);background:var(--st-amber-bg);font-family:var(--font-mono);font-size:10.5px}',
    '.br-tag.is-gone{border-color:var(--st-ruby-line);color:var(--st-ruby-fg);background:var(--st-ruby-bg)}',
    '.br-upds{display:flex;flex-direction:column;gap:6px}',
    '.br-upd{all:unset;box-sizing:border-box;cursor:pointer;display:flex;flex-direction:column;gap:3px;padding:9px 10px;border-radius:var(--radius,4px);border:1px solid var(--rule)}',
    '.br-upd:hover{border-color:var(--rule-strong)}',
    '.br-upd:focus-visible{outline:2px solid var(--accent-fill);outline-offset:1px}',
    '.br-upd[aria-pressed="true"]{border-color:var(--st-amber-line);background:var(--st-amber-bg)}',
    '.br-upd-1{display:flex;justify-content:space-between;gap:8px;font-family:var(--font-mono);font-size:11px;color:var(--color-neutral-500)}',
    '.br-upd b{font-size:13.5px;font-weight:600;color:var(--color-text)}',
    '.br-upd-2{font-size:12px;color:var(--color-neutral-600)}',
    '.br-upd-note,.br-pfoot{font-size:12px;color:var(--color-neutral-500);margin:8px 0 0}',
    '@media (max-width:1100px){.br-root{grid-template-columns:minmax(0,1fr);grid-template-rows:auto;height:auto;min-height:var(--view-h)}.br-stagecard{height:calc(var(--view-h) - 24px)}.br-panel{height:auto;min-height:0;max-height:70vh}}',
    '@media (max-width:760px){.br-bar .hint{display:none}.br-seg kbd{display:none}.br-cap-in{max-width:none}}'
  ].join('\n');
  const st = document.createElement('style'); st.id = 'brain-css'; st.textContent = css; document.head.appendChild(st);
}

/* ---------- the page ---------- */
function renderBrainPage(){
  const host = document.getElementById('content'); if (!host) return;
  brEnsureCss();
  if (_br && _br.raf){ cancelAnimationFrame(_br.raf); }
  host.innerHTML = '<div class="br-root" data-br-root>'
    + '<div class="br-stagecard">'
    + '<div class="br-stage" id="br-stage">'
    + '<canvas id="br-cv" aria-label="' + _brEsc(_brT('brn_aria')) + '"></canvas>'
    + '<div class="br-ov-tl"><div class="t" id="br-ov-t"></div><div class="s" id="br-ov-s"></div></div>'
    + '<div class="br-ov-tr"><button class="br-chip" id="br-chip-new" type="button" hidden><i></i><span></span></button></div>'
    + '<div class="br-cap"><div class="br-cap-in"><div class="br-cap-k"><i id="br-cap-dot"></i><span id="br-cap-k"></span></div><div class="br-cap-t" id="br-cap-t"></div></div></div>'
    + '<div class="br-tip" id="br-tip" hidden></div>'
    + '</div>'
    + '<div class="br-bar">'
    + '<div class="br-seg" role="group" aria-label="' + _brEsc(_brT('brn_view_group')) + '">' + BRAIN_VIEWS.map((v, i) => '<button type="button" data-br-view="' + i + '" aria-pressed="false">' + _brEsc(_brT('brn_view_' + v)) + ' <kbd>' + (i + 1) + '</kbd></button>').join('') + '</div>'
    + '<button class="br-btn" id="br-play" type="button"></button>'
    + '<button class="br-btn" id="br-replay" type="button"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M3 8a5 5 0 1 0 1.5-3.5M3 2.5V5h2.5"/></svg>' + _brEsc(_brT('brn_replay')) + '</button>'
    + '<div class="br-seg is-mono" role="group" aria-label="' + _brEsc(_brT('brn_speed')) + '">' + [.5, 1, 2].map(s => '<button type="button" data-br-speed="' + s + '">' + s + '×</button>').join('') + '</div>'
    + '<button class="br-btn" id="br-rot" type="button"></button>'
    + '<div class="br-seg is-mono" role="group" aria-label="' + _brEsc(_brT('brn_zoom_label')) + '"><button type="button" id="br-zout" aria-label="' + _brEsc(_brT('brn_zoom_out')) + '">−</button><button type="button" id="br-zfit" title="' + _brEsc(_brT('brn_zoom_fit')) + '">100%</button><button type="button" id="br-zin" aria-label="' + _brEsc(_brT('brn_zoom_in')) + '">+</button></div>'
    + '<span class="sp"></span><span class="hint">' + _brEsc(_brT('brn_hint')) + '</span>'
    + '</div></div>'
    + '<aside class="br-panel" id="br-panel">'
    + '<div class="br-psec"><div class="br-ph"><h3>' + _brEsc(_brT('brn_flows')) + '</h3><span>' + _brEsc(_brT('brn_flows_n', { n: BRAIN_FLOWS.length })) + '</span></div><div class="br-flows">' + brFlowsHtml() + '</div></div>'
    + '<div class="br-psec"><div class="br-fh"><h2 id="br-fl-title"></h2><span id="br-fl-count"></span></div><p class="br-flead" id="br-fl-lead"></p><ol class="br-steps" id="br-steps"></ol></div>'
    + '<div class="br-psec" id="br-upd-sec"><div class="br-ph" title="' + _brEsc(_brT('brn_updates_title')) + '"><h3>' + _brEsc(_brT('brn_updates')) + '</h3><span>' + _brEsc(_brT('brn_updates_sub')) + '</span></div>'
    + '<div class="br-upds" id="br-upds"></div><p class="br-pfoot">' + _brEsc(_brT('brn_upd_foot')) + '</p></div>'
    + '</aside></div>';

  const prevView = _brView;
  _br = brFresh();
  const b = _br;
  b.cv = document.getElementById('br-cv'); b.ctx = b.cv.getContext('2d');
  const stage = document.getElementById('br-stage');
  const fit = () => { if (_br !== b || !stage.isConnected) return; const r = stage.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1); b.W = r.width; b.H = r.height; b.cv.width = Math.max(1, b.W * dpr); b.cv.height = Math.max(1, b.H * dpr); b.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
  fit();
  if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(stage);
  brWireCanvas(b.cv);
  brWirePage(host.querySelector('[data-br-root]'));
  b.w = [0, 0, 0]; b.w[prevView] = 1; b.wFrom = b.w.slice(); b.wTo = b.w.slice();
  brSetView(prevView);
  brPaintRot(); brPaintSpeed(); brPaintZoom(); brPaintUpdates();
  brPlayFlow(BRAIN_FLOWS[0]);
  b.last = performance.now(); b.raf = requestAnimationFrame(brFrame);
  if (typeof setActiveNav === 'function') setActiveNav('brain');
  brLoadMap();
}
/* ONE DELEGATED LISTENER PER ROOT, read off the element at press time. */
function brWirePage(root){
  if (!root || root.dataset.brBound) return;
  root.dataset.brBound = '1';
  root.addEventListener('click', ev => {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t || !_br) return;
    const v = t.closest('[data-br-view]'); if (v){ brSetView(+v.getAttribute('data-br-view')); return; }
    const fl = t.closest('[data-br-flow]'); if (fl){ const f = BRAIN_FLOWS.find(x => x.id === fl.getAttribute('data-br-flow')); if (f) brPlayFlow(f); return; }
    const st = t.closest('[data-br-step]'); if (st){ if (_br.player.f) brPlayFlow(_br.player.f, +st.getAttribute('data-br-step')); return; }
    const up = t.closest('[data-br-upd]'); if (up){ const u = ((_brMap && _brMap.builds) || []).find(x => x.key === up.getAttribute('data-br-upd')); if (u) brShowUpdate(u); return; }
    const sp = t.closest('[data-br-speed]'); if (sp){ _br.speed = +sp.getAttribute('data-br-speed'); brPaintSpeed(); return; }
    if (t.closest('#br-play')){ if (_br.player.done || !_br.player.f) brPlayFlow(_br.player.f || BRAIN_FLOWS[0]); else { _br.player.playing = !_br.player.playing; brPaintPlay(); } return; }
    if (t.closest('#br-replay')){ brPlayFlow(_br.player.f || BRAIN_FLOWS[0]); return; }
    if (t.closest('#br-rot')){ _br.autoRot = !_br.autoRot; brPaintRot(); return; }
    if (t.closest('#br-zin')){ brZoomAt(1.4, _br.W / 2, _br.H * _br.CY); return; }
    if (t.closest('#br-zout')){ brZoomAt(1 / 1.4, _br.W / 2, _br.H * _br.CY); return; }
    if (t.closest('#br-zfit')){ brZoomReset(); return; }
    if (t.closest('#br-chip-new')){
      const sec = document.getElementById('br-upd-sec'), pn = document.getElementById('br-panel');
      if (sec && pn) pn.scrollTo({ top: sec.offsetTop - pn.offsetTop, behavior: _br.RM ? 'auto' : 'smooth' });
      const u = _brMap && (_brMap.builds || []).find(x => x.diff && (x.diff.born || []).length); if (u) brShowUpdate(u);
    }
  });
}
/* The keys: 1 2 3 and the arrows choose the view, + − 0 zoom, Space plays.
   Armed once, and asked only while this page is the one on screen. */
function brKeys(e){
  if (!_br || typeof state === 'undefined' || !state || state.view !== 'brain') return;
  if (e.target && e.target.closest && e.target.closest('input,textarea,select,[contenteditable="true"]')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  if (k === '1' || k === '2' || k === '3') brSetView(+k - 1);
  else if (k === 'ArrowRight'){ brSetView((_brView + 1) % 3); e.preventDefault(); }
  else if (k === 'ArrowLeft'){ brSetView((_brView + 2) % 3); e.preventDefault(); }
  else if (k === '+' || k === '='){ brZoomAt(1.25, _br.W / 2, _br.H * _br.CY); }
  else if (k === '-'){ brZoomAt(1 / 1.25, _br.W / 2, _br.H * _br.CY); }
  else if (k === '0'){ brZoomReset(); }
  else if (k === ' ' && !(e.target && e.target.closest && e.target.closest('button'))){ e.preventDefault(); const p = document.getElementById('br-play'); if (p) p.click(); }
}
if (typeof document !== 'undefined' && !document._brKeysWired){ document._brKeysWired = true; document.addEventListener('keydown', brKeys); }

Object.assign(window, { renderBrainPage, brPendingParts, brBuild, brUpdWhat, brUpdTitle, brUpdatesHtml, brLoadMap, brSetView, brPlayFlow, brShowUpdate,
  BRAIN_REG_COLOR, BRAIN_NEW_DAYS, BRAIN_PENDING_MAX, BRAIN_STEP_S });
