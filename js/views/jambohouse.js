/* ============================================================================
   JAMBO'S AGENTS — THE HOUSE, HIS JOBS AND HIS POINTS (Young, 12 Oct 2026:
   "have two folders when you hover over it [Insights] one for insights and the
   other for the agents", then the house mock-up she chose — the SAP floor plan
   with the architect's drawing kept beside it, a speed, a replay of one
   contract typed by its number, per-agent points in Settings, and "if there is
   a new agent added they should automatically be added to the house and
   settings")
   ============================================================================
   THE PAGE (view 'jambo', the second folder behind Insights in the menu; the
   Board's "The agents" opens it too, so the agents have one place):
     · The house — one room per agent, read off AG_KEYS (js/views/agents.js),
       three to a floor and a new floor when one fills; a replay of the period
       chosen, at the speed chosen, drawn as a floor plan (the SAP way) or as
       an architect's section; a contract typed by its number replays only
       that contract's work. Every number is counted from GET
       /api/agents/pieces — the server's record of each piece of work, its
       contract and what a person did with it. Nothing is invented: a piece
       nobody has acted on is "waiting" and scores nothing.
     · Jobs — every agent, its room, what it does, when it runs, its points.
     · How points work — the sum, who may change it, the new-agent rule.
   THE POINTS: a piece is worth the minutes a person would spend on it; used
   as is counts the whole, changed by a person counts a share, thrown away
   takes a share off; each agent has a daily cap. The company's values are an
   admin's (Settings → Jambo's agents, PUT /api/settings/agent-points); a
   person may set their own (Your account, PUT /api/me/prefs agentPoints),
   which change only what they see. ONE reading, agPointsOf, and one sum,
   agPointsTally, so the house, the cards, the Jobs table, the worked example
   and both settings tables cannot disagree.
   THE NEW-AGENT RULE: every part of this page and both settings tables walk
   AG_KEYS, so an agent added there gets a room, a card, a Jobs row and a
   points row the same day, on the starting values (AG_POINTS_NEW_MINS) and
   marked New until an admin saves. f667 fails if the server's list
   (AGENT_POINT_KEYS) and AG_KEYS differ, or an agent lacks its words.
   NOT ON THE PHONE YET: the menu's fly-out is the desk's. */

/* The agents the ledger began with — every later one is New until an admin
   has saved its points. */
const AG_POINTS_LAUNCH = ['approve', 'request', 'week', 'quiet', 'round', 'link', 'renew', 'paper', 'late', 'ours', 'import'];
/* A person's minutes per piece, the starting value of each agent's points —
   the server's AGENT_POINTS_START_MINS, held equal by f667. */
const AG_POINTS_START_MINS = { approve: 15, request: 20, week: 10, quiet: 5, round: 45, link: 4, renew: 60, paper: 25, late: 8, ours: 10, import: 5 };
const AG_POINTS_NEW_MINS = 10;
const AG_POINTS_SHARES = { used: 100, changed: 60, thrown: 50, cap: 480 };
const AG_POINTS_FIELDS = ['mins', 'used', 'changed', 'thrown', 'cap'];
const JH_RANGES = [1, 7, 30, 90];
const JH_SPEEDS = [0.5, 1, 2, 4];
const JH_TABS = ['house', 'jobs', 'how'];
/* How long one replay takes at Normal speed. */
const JH_DURATION_MS = 30000;
/* Each agent's colour and hat in the house; an agent with none takes the
   next pair in turn, so a new agent is drawn the day it arrives. */
const JH_LOOK = {
  request: ['#be185d', 'peak'], paper: ['#3b6fd8', 'cap'], import: ['#ea580c', 'hard'], round: ['#6d28d9', 'top'],
  approve: ['#0e7490', 'bowler'], link: ['#0f766e', 'peak'], late: ['#dc2626', 'post'], ours: ['#15803d', 'bowler'],
  quiet: ['#7c3aed', 'safari'], week: ['#2563eb', 'cap'], renew: ['#b7791f', 'straw']
};
const JH_SPARE = [['#9333ea', 'top'], ['#0891b2', 'safari'], ['#65a30d', 'hard'], ['#db2777', 'straw'], ['#4f46e5', 'cap'], ['#c2410c', 'post']];
/* The order of the rooms: the work's own path through the house, ground floor
   first — what comes in, what is read, what is negotiated, what is kept. */
const JH_ORDER = ['request', 'paper', 'import', 'round', 'approve', 'link', 'late', 'ours', 'quiet', 'week', 'renew'];

const _jhE = s => (typeof esc === 'function') ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _jhT = (k, v) => (typeof i18t === 'function') ? i18t(k, v || {}) : String(k);
const _jhTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v || {}) : String(n);
const _jhFmt = n => { const v = Math.round(Number(n) || 0); try { return v.toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined); } catch (_) { return String(v); } };

/* ---------------- THE POINTS: one reading, one sum ---------------- */
function agPointsKeys(){
  const list = (typeof AG_KEYS !== 'undefined' && Array.isArray(AG_KEYS)) ? AG_KEYS.slice() : AG_POINTS_LAUNCH.slice();
  return JH_ORDER.filter(k => list.includes(k)).concat(list.filter(k => !JH_ORDER.includes(k)));
}
function agPointsStart(k){ return { mins: AG_POINTS_START_MINS[k] != null ? AG_POINTS_START_MINS[k] : AG_POINTS_NEW_MINS, ...AG_POINTS_SHARES }; }
function _agPtsStore(){ try { return (typeof state !== 'undefined' && state && state.settings && state.settings.agentPoints) || null; } catch (_) { return null; } }
function agPointsCompany(k){ const s = _agPtsStore(); const v = s && s[k]; return v && typeof v === 'object' ? { ...agPointsStart(k), ...v } : agPointsStart(k); }
function _agPtsMineStore(){ try { const p = window.REMOTE && REMOTE.me && REMOTE.me.prefs; return (p && p.agentPoints && typeof p.agentPoints === 'object') ? p.agentPoints : null; } catch (_) { return null; } }
function agPointsMine(k){ const m = _agPtsMineStore(); return m && m[k] ? { ...agPointsStart(k), ...m[k] } : null; }
/* THE VALUES THIS READER COUNTS WITH: their own where they set some, else the company's. */
function agPointsOf(k){ return agPointsMine(k) || agPointsCompany(k); }
function agPointsIsNew(k){
  if (AG_POINTS_LAUNCH.includes(k)) return false;
  const s = _agPtsStore();
  return !(s && Array.isArray(s._seen) && s._seen.includes(k));
}
function agPointsEach(v, o){ return v.mins * (o === 'used' ? v.used : o === 'changed' ? v.changed : o === 'thrown' ? -v.thrown : 0) / 100; }
/* THE ONE SUM, over decided pieces up to a moment (ms; Infinity = all): per
   day, capped at the agent's cap, then added. Waiting pieces score nothing. */
function agPointsTally(k, pieces, upto){
  const v = agPointsOf(k), lim = upto == null ? Infinity : upto;
  const s = { n: 0, used: 0, changed: 0, thrown: 0, open: 0, pts: 0, hrs: 0, capped: false };
  const day = new Map();
  for (const p of pieces || []){
    if (p.agent !== k) continue;
    const at = Date.parse(p.decidedAt || p.at || '') || 0;
    const pAt = Date.parse(p.at || '') || at;
    if (pAt > lim && (!p.outcome || at > lim)) continue;
    s.n++;
    if (!p.outcome || at > lim){ s.open++; continue; }
    s[p.outcome]++;
    const d = String(p.decidedAt || p.at).slice(0, 10);
    day.set(d, (day.get(d) || 0) + agPointsEach(v, p.outcome));
  }
  for (const x of day.values()){ if (x > v.cap){ s.capped = true; s.pts += v.cap; } else s.pts += x; }
  s.pts = Math.round(s.pts);
  s.hrs = Math.max(0, (s.used * v.used + s.changed * v.changed) / 100 * v.mins / 60);
  return s;
}
function agPointsSumLine(s, k){
  const v = agPointsOf(k), n = x => +x.toFixed(1);
  return `${s.used} × ${n(agPointsEach(v, 'used'))} + ${s.changed} × ${n(agPointsEach(v, 'changed'))} − ${s.thrown} × ${n(-agPointsEach(v, 'thrown'))} = ${_jhFmt(s.pts)}${s.capped ? ' ' + _jhT('jh_capped') : ''}`;
}

/* ---------------- A PERSON'S PRESS, SAID TO THE SERVER ----------------
   The Board's acts on Jambo's work call this after the act has happened:
   used as is, changed, or thrown away. Fire and forget — the act is the thing
   that matters, and a static copy (no server) has nowhere to say it. */
function agPieceSay(agent, contractId, outcome, ref){
  try {
    if (!(typeof API_MODE === 'function' && API_MODE()) || typeof api !== 'function') return;
    if (!agPointsKeys().includes(agent) || !['used', 'changed', 'thrown'].includes(outcome)) return;
    api('agents/outcome', 'POST', { agent, contractId: contractId || '', outcome, ref: ref || '' }).then(() => { _jh.data = null; }).catch(() => {});
  } catch (_) {}
}

/* ---------------- THE PAGE'S STATE (per sitting) ---------------- */
const _jh = { tab: 'house', range: 30, look: 0, speed: 1, one: '', sel: null, data: null, loading: false, t: 1, playing: false, last: 0, raf: 0, pops: [], trails: [], lastPos: [], hover: null, fed: [] };
function jhPlace(){ return { tab: _jh.tab, range: _jh.range, look: _jh.look, speed: _jh.speed }; }
function jhPlacePut(p){
  if (!p || typeof p !== 'object') return;
  if (JH_TABS.includes(p.tab)) _jh.tab = p.tab;
  if (JH_RANGES.includes(Number(p.range))) _jh.range = Number(p.range);
  if (p.look === 0 || p.look === 1) _jh.look = p.look;
  if (JH_SPEEDS.includes(Number(p.speed))) _jh.speed = Number(p.speed);
}
const jhRangeWords = () => _jh.range === 1 ? _jhT('jh_r_1') : _jhT('jh_last_n', { r: _jhT('jh_r_' + _jh.range) });

async function jhLoad(){
  if (_jh.loading) return;
  if (!(typeof API_MODE === 'function' && API_MODE()) || typeof api !== 'function'){ _jh.data = { pieces: [], contracts: {}, static: true, days: _jh.range }; return; }
  _jh.loading = true;
  try { const r = await api('agents/pieces?days=' + _jh.range); _jh.data = { pieces: (r && r.pieces) || [], contracts: (r && r.contracts) || {}, cut: !!(r && r.cut), max: r && r.max, days: _jh.range, from: r && r.from }; }
  catch (e){ _jh.data = { pieces: [], contracts: {}, error: (e && e.message) || String(e), days: _jh.range }; }
  finally { _jh.loading = false; }
}
/* The pieces this page counts: the period's, and only the typed contract's. */
function jhPieces(){
  const all = (_jh.data && _jh.data.pieces) || [];
  return _jh.one ? all.filter(p => p.cid === _jh.one) : all;
}
function jhSpan(){
  const end = Date.now(), from = end - _jh.range * 86400000;
  return { from, end, at: x => Math.min(1, Math.max(0, ((Date.parse(x || '') || from) - from) / (end - from))) };
}
/* The moment the replay has reached, as a time. */
const jhUpto = () => { const S = jhSpan(); return _jh.t >= 1 ? Infinity : S.from + _jh.t * (S.end - S.from); };

/* ---------------- THE HOUSE: drawn from the list ---------------- */
const JH_W = 1160, JH_FH = 132, JH_COLS = 3, JH_SX = 160, JH_RX0 = 206, JH_RX1 = 1144, JH_GAP = 12;
const JH_RW = (JH_RX1 - JH_RX0 - JH_GAP * (JH_COLS - 1)) / JH_COLS;
let _jhTop = 70, _jhF = 1, _jhH = 620, _jhRooms = [];
const jhLY = f => _jhTop + (_jhF - f) * JH_FH;
const jhFoot = f => jhLY(f) - 18;
function jhLayout(){
  const keys = agPointsKeys();
  _jhTop = _jh.look === 1 ? 128 : 70;
  _jhF = Math.max(1, Math.ceil(keys.length / JH_COLS));
  _jhH = _jhTop + _jhF * JH_FH + (_jh.look === 1 ? 104 : 16);
  let spare = 0;
  _jhRooms = keys.map((k, i) => {
    const f = Math.floor(i / JH_COLS), c = i % JH_COLS, x = JH_RX0 + c * (JH_RW + JH_GAP);
    const look = JH_LOOK[k] || JH_SPARE[spare++ % JH_SPARE.length];
    return { k, i, f, col: look[0], hat: look[1], card: { x, y: jhLY(f) - JH_FH + 10, w: JH_RW, h: JH_FH - 22 }, cx: x + JH_RW / 2 };
  });
}
function jhFreeCards(){ const out = []; for (let i = _jhRooms.length; i < _jhF * JH_COLS; i++){ const f = Math.floor(i / JH_COLS), c = i % JH_COLS, x = JH_RX0 + c * (JH_RW + JH_GAP); out.push({ x, y: jhLY(f) - JH_FH + 10, w: JH_RW, h: JH_FH - 22 }); } return out; }
/* Each Jambo's walk: his own room, then two others he hands work to, by the stairs. */
const JH_SPEED_PX = 240;
function jhSimulate(r){
  const N = _jhRooms.length, total = JH_DURATION_MS / 1000, segs = [];
  const stops = [r, _jhRooms[(r.i + 4) % N], _jhRooms[(r.i + 7) % N]];
  const spot = (b, own) => { const off = own ? ((r.i * 3) % 5 - 2) * 22 : ((r.i * 7) % 5 - 2) * 16 + 70; return Math.max(b.card.x + 24, Math.min(b.card.x + b.card.w - 24, b.cx + off)); };
  let tt = (r.i % 6) * .2, x = spot(r, true), f = r.f, stop = 0;
  segs.push({ t0: 0, t1: tt, x0: x, y0: jhFoot(f), x1: x, y1: jhFoot(f), kind: 'idle' });
  while (tt < total){
    const own = stop % 3 === 0, b = stops[stop % 3], x2 = spot(b, own), legs = [];
    if (f !== b.f){ legs.push({ x: JH_SX, f, s: 0 }); legs.push({ x: JH_SX, f: b.f, s: 1 }); }
    legs.push({ x: x2, f: b.f, s: 0 });
    for (const w of legs){ const y0 = jhFoot(f), y1 = jhFoot(w.f), d = Math.hypot(w.x - x, y1 - y0), dur = d / (w.s ? JH_SPEED_PX * .6 : JH_SPEED_PX);
      segs.push({ t0: tt, t1: tt + dur, x0: x, y0, x1: w.x, y1, kind: w.s ? 'stairs' : 'walk' }); tt += dur; x = w.x; f = w.f; }
    const dwell = own ? 1.3 + (r.i % 3) * .2 : .45;
    segs.push({ t0: tt, t1: tt + dwell, x0: x, y0: jhFoot(f), x1: x, y1: jhFoot(f), kind: own ? 'work' : 'visit' });
    tt += dwell; stop++;
  }
  r.segs = segs;
}
function jhPosAt(r, tt){
  const s = tt * JH_DURATION_MS / 1000; let g = r.segs[r.segs.length - 1];
  for (const x of r.segs){ if (s < x.t1){ g = x; break; } }
  const k = g.t1 > g.t0 ? Math.min(1, Math.max(0, (s - g.t0) / (g.t1 - g.t0))) : 1;
  return { x: g.x0 + (g.x1 - g.x0) * k, y: g.y0 + (g.y1 - g.y0) * k, kind: g.kind, k };
}
/* The colours from the page's own tokens, read when the house is drawn. */
const _jhC = {};
function jhColors(){
  try {
    const s = getComputedStyle(document.documentElement), g = n => s.getPropertyValue(n).trim();
    Object.assign(_jhC, { card: g('--color-surface') || '#fff', fg: g('--color-text') || '#111', muted: g('--color-neutral-600') || '#667', line: g('--color-divider') || '#dde',
      soft: g('--color-neutral-100') || '#f5f6f8', accent: g('--color-accent') || '#264c9e', accentSoft: g('--color-accent-50') || '#eef2fb', amber: g('--st-amber-fg') || '#b45309',
      ruby: g('--st-ruby-fg') || '#b42318', gold: g('--st-amber-dot') || '#d99a18' });
  } catch (_) {}
}
/* Jambo, in this agent's hat. */
let _jhFace = null;
function jhFaceImg(){ if (_jhFace) return _jhFace; try { _jhFace = new Image(); _jhFace.src = (typeof JAMBO_FACE !== 'undefined' && JAMBO_FACE.hello) || ''; } catch (_) {} return _jhFace; }
function jhHat(ctx, kind, x, y, r){
  ctx.save(); ctx.translate(x, y - r * .78); const w = r * 1.25;
  const fill = c => { ctx.fillStyle = c; ctx.fill(); };
  ctx.lineWidth = Math.max(1, r * .06); ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.beginPath();
  if (kind === 'cap'){ ctx.moveTo(-w * .9, 0); ctx.lineTo(0, -r * .42); ctx.lineTo(w * .9, 0); ctx.lineTo(0, r * .32); ctx.closePath(); fill('#1f2937'); ctx.stroke(); }
  else if (kind === 'safari'){ ctx.ellipse(0, r * .08, w * .95, r * .2, 0, 0, Math.PI * 2); fill('#b08850'); ctx.beginPath(); ctx.ellipse(0, -r * .05, w * .58, r * .42, 0, Math.PI, 0); fill('#d4b483'); }
  else if (kind === 'top'){ ctx.ellipse(0, r * .08, w * .85, r * .16, 0, 0, Math.PI * 2); fill('#111827'); ctx.beginPath(); ctx.rect(-w * .48, -r * .85, w * .96, r * .93); fill('#111827'); ctx.fillStyle = '#b91c1c'; ctx.fillRect(-w * .48, -r * .12, w * .96, r * .14); }
  else if (kind === 'peak'){ ctx.ellipse(0, -r * .05, w * .62, r * .36, 0, Math.PI, 0); fill('#1e3a8a'); ctx.beginPath(); ctx.ellipse(w * .35, r * .06, w * .5, r * .12, 0, 0, Math.PI * 2); fill('#0f172a'); }
  else if (kind === 'post'){ ctx.ellipse(0, -r * .04, w * .6, r * .34, 0, Math.PI, 0); fill('#dc2626'); ctx.beginPath(); ctx.ellipse(-w * .35, r * .06, w * .48, r * .11, 0, 0, Math.PI * 2); fill('#7f1d1d'); }
  else if (kind === 'bowler'){ ctx.ellipse(0, r * .08, w * .82, r * .14, 0, 0, Math.PI * 2); fill('#14532d'); ctx.beginPath(); ctx.ellipse(0, -r * .02, w * .5, r * .46, 0, Math.PI, 0); fill('#166534'); }
  else if (kind === 'straw'){ ctx.ellipse(0, r * .06, w * 1.12, r * .2, 0, 0, Math.PI * 2); fill('#e8c35a'); ctx.beginPath(); ctx.ellipse(0, -r * .03, w * .52, r * .34, 0, Math.PI, 0); fill('#f2d675'); }
  else if (kind === 'hard'){ ctx.ellipse(0, r * .06, w * .82, r * .14, 0, 0, Math.PI * 2); fill('#c2410c'); ctx.beginPath(); ctx.ellipse(0, -r * .02, w * .6, r * .46, 0, Math.PI, 0); fill('#f97316'); }
  ctx.restore();
}
function jhJambo(ctx, r, x, y, rad, lit){
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, rad + Math.max(2, rad * .12), 0, Math.PI * 2); ctx.fillStyle = r.col; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = '#f3efe6'; ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  const img = jhFaceImg(); if (img && img.complete && img.naturalWidth) ctx.drawImage(img, x - rad, y - rad, rad * 2, rad * 2);
  ctx.restore(); jhHat(ctx, r.hat, x, y, rad);
  if (lit){ ctx.beginPath(); ctx.arc(x, y, rad * 1.45, 0, Math.PI * 2); ctx.strokeStyle = _jhC.gold; ctx.lineWidth = 3; ctx.stroke(); }
  ctx.restore();
}
function jhPill(ctx, text, x, y, col, font){ ctx.font = font || '600 10.5px Geist, sans-serif'; const w = ctx.measureText(text).width + 12; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y - 11, w, 15, 7.5); else ctx.rect(x, y - 11, w, 15); ctx.stroke(); ctx.fillStyle = col; ctx.textAlign = 'left'; ctx.fillText(text, x + 6, y); return w; }
const jhFloorName = f => _jhT('jh_floor_' + Math.min(f, 7));
function jhRoundRect(ctx, x, y, w, h, r){ ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); }
function jhDrawPlan(ctx, pieces, upto){
  const C = _jhC;
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, JH_W, _jhH);
  ctx.textAlign = 'left'; ctx.font = '600 13px Geist, sans-serif'; ctx.fillStyle = C.fg; ctx.fillText(_jhT('jh_house_title'), 20, 30);
  ctx.font = '400 12px Geist, sans-serif'; ctx.fillStyle = C.muted;
  ctx.fillText(jhHouseSub(), 20, 48);
  for (let f = 0; f < _jhF; f++){ const y = jhLY(f); ctx.fillStyle = f % 2 ? C.soft : C.card; ctx.fillRect(0, y - JH_FH, JH_W, JH_FH);
    ctx.fillStyle = C.line; ctx.fillRect(0, y - 1, JH_W, 1);
    ctx.fillStyle = C.muted; ctx.font = '500 12px Geist, sans-serif'; ctx.textAlign = 'left'; ctx.fillText(jhFloorName(f), 20, y - JH_FH / 2 + 4); }
  ctx.fillStyle = C.accentSoft; ctx.fillRect(JH_SX - 26, jhLY(_jhF - 1) - JH_FH + 10, 52, _jhF * JH_FH - 14);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; for (let y = jhLY(_jhF - 1) - JH_FH + 20; y < jhLY(0) - 6; y += 12){ ctx.beginPath(); ctx.moveTo(JH_SX - 18, y); ctx.lineTo(JH_SX + 18, y); ctx.stroke(); }
  ctx.fillStyle = C.muted; ctx.font = '500 11px Geist, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(_jhT('jh_stairs'), JH_SX, jhLY(_jhF - 1) - JH_FH + 4);
  _jhRooms.forEach(r => { const c = r.card, s = agPointsTally(r.k, pieces, upto), hov = _jh.hover === r.k || _jh.sel === r.k;
    ctx.fillStyle = hov ? C.accentSoft : C.card; ctx.strokeStyle = hov ? C.accent : C.line; ctx.lineWidth = hov ? 1.5 : 1;
    jhRoundRect(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = r.col; ctx.fillRect(c.x, c.y + 8, 3, 30);
    ctx.textAlign = 'left'; ctx.fillStyle = C.fg; ctx.font = '600 15px Geist, sans-serif'; const nm = _jhT('jh_room_' + r.k); ctx.fillText(nm, c.x + 12, c.y + 22);
    let px = c.x + 18 + ctx.measureText(nm).width;
    if (agPointsIsNew(r.k)) px += jhPill(ctx, _jhT('jh_new_tag'), px, c.y + 21, C.amber) + 4;
    if (agPointsMine(r.k)) jhPill(ctx, _jhT('jh_mine_tag'), px, c.y + 21, C.accent);
    ctx.fillStyle = C.muted; ctx.font = '400 13.5px Geist, sans-serif'; ctx.fillText(_jhT('ag_' + r.k) + ' · ' + s.n + ' ' + _jhT('jh_unit_' + r.k), c.x + 12, c.y + 42);
    ctx.textAlign = 'right'; ctx.fillStyle = C.accent; ctx.font = '600 16px Geist, sans-serif'; ctx.fillText(_jhFmt(s.pts) + ' ' + _jhT('jh_pts'), c.x + c.w - 12, c.y + 22); });
  jhFreeCards().forEach(c => { ctx.save(); ctx.setLineDash([5, 4]); ctx.strokeStyle = C.line; ctx.lineWidth = 1.2; jhRoundRect(ctx, c.x, c.y, c.w, c.h, 8); ctx.stroke(); ctx.restore();
    ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = '600 13px Geist, sans-serif'; ctx.fillText(_jhT('jh_free'), c.x + 12, c.y + 20);
    ctx.font = '400 12px Geist, sans-serif'; ctx.fillText(_jhT('jh_free_sub'), c.x + 12, c.y + 38); });
}
const JH_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
function jhDrawDrawing(ctx, pieces, upto){
  const C = _jhC, ink = C.accent, top = jhLY(_jhF - 1) - JH_FH, bot = jhLY(0), X0 = 120, X1 = 1152, mid = (X0 + X1) / 2;
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, JH_W, _jhH);
  ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.globalAlpha = .55;
  for (let x = 0; x < JH_W; x += 20){ ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, _jhH); ctx.stroke(); }
  for (let y = 0; y < _jhH; y += 20){ ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(JH_W, y + .5); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left'; ctx.fillStyle = C.fg; ctx.font = '600 13px ' + JH_MONO; ctx.fillText(_jhT('jh_drawing_title').toUpperCase(), 20, 30);
  ctx.fillStyle = C.muted; ctx.font = '400 12px ' + JH_MONO; ctx.fillText(jhHouseSub().toUpperCase(), 20, 48);
  ctx.strokeStyle = ink; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(X0 - 26, top); ctx.lineTo(mid, top - 62); ctx.lineTo(X1 + 26, top); ctx.stroke();
  ctx.lineWidth = 1; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(X0 + 6, top - 4); ctx.lineTo(mid, top - 50); ctx.lineTo(X1 - 6, top - 4); ctx.stroke(); ctx.globalAlpha = 1;
  ctx.lineWidth = 2; ctx.strokeRect(X0, top, X1 - X0, bot - top);
  ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, bot + 6); ctx.lineTo(JH_W - 10, bot + 6); ctx.stroke();
  ctx.globalAlpha = .35; for (let x = 14; x < JH_W - 10; x += 10){ ctx.beginPath(); ctx.moveTo(x, bot + 16); ctx.lineTo(x + 10, bot + 6); ctx.stroke(); } ctx.globalAlpha = 1;
  for (let f = 0; f < _jhF; f++){ const y = jhLY(f);
    if (f > 0){ ctx.lineWidth = 1.4; [0, 5].forEach(d => { ctx.beginPath(); ctx.moveTo(X0, y + d); ctx.lineTo(JH_SX - 26, y + d); ctx.moveTo(JH_SX + 26, y + d); ctx.lineTo(X1, y + d); ctx.stroke(); }); }
    ctx.lineWidth = 1.2; [194].concat([1, 2].map(c => JH_RX0 + c * (JH_RW + JH_GAP) - JH_GAP / 2)).forEach(x => { ctx.beginPath(); ctx.moveTo(x, y - JH_FH + 6); ctx.lineTo(x, y); ctx.stroke(); });
    const xa = f % 2 ? JH_SX + 18 : JH_SX - 18, xb = f % 2 ? JH_SX - 18 : JH_SX + 18, yb = y - JH_FH + 6;
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, yb); ctx.stroke();
    for (let s = 1; s < 12; s++){ const k = s / 12, x = xa + (xb - xa) * k, yy = y + (yb - y) * k; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy - 6); ctx.stroke(); }
    ctx.fillStyle = C.muted; ctx.font = '500 11px ' + JH_MONO; ctx.textAlign = 'right'; ctx.fillText(f === 0 ? '±0.00' : '+' + (f * 3.2).toFixed(2), 112, y - 4);
    ctx.textAlign = 'left'; ctx.font = '500 10.5px ' + JH_MONO; ctx.fillText(jhFloorName(f).toUpperCase(), 14, y - JH_FH / 2 + 4);
    ctx.strokeStyle = ink; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(84, y); ctx.lineTo(X0, y); ctx.stroke(); ctx.globalAlpha = 1;
  }
  ctx.fillStyle = C.muted; ctx.font = '500 10.5px ' + JH_MONO; ctx.textAlign = 'center'; ctx.fillText(_jhT('jh_stairs').toUpperCase(), JH_SX, top + 14);
  _jhRooms.forEach(r => { const c = r.card, s = agPointsTally(r.k, pieces, upto), hov = _jh.hover === r.k || _jh.sel === r.k;
    if (hov){ ctx.fillStyle = C.accentSoft; ctx.fillRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8); }
    ctx.textAlign = 'left'; ctx.fillStyle = ink; ctx.font = '600 13px ' + JH_MONO; const nm = _jhT('jh_room_' + r.k).toUpperCase(); ctx.fillText(nm, c.x + 6, c.y + 18);
    let px = c.x + 12 + ctx.measureText(nm).width;
    if (agPointsIsNew(r.k)) px += jhPill(ctx, _jhT('jh_new_tag'), px, c.y + 18, C.amber) + 4;
    if (agPointsMine(r.k)) jhPill(ctx, _jhT('jh_mine_tag'), px, c.y + 18, ink);
    ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(c.x + c.w - 8, c.y + 14, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = C.muted; ctx.font = '400 12px ' + JH_MONO; ctx.fillText(_jhT('ag_' + r.k) + ' · ' + s.n, c.x + 6, c.y + 36);
    ctx.textAlign = 'right'; ctx.fillStyle = ink; ctx.font = '600 14px ' + JH_MONO; ctx.fillText(_jhFmt(s.pts) + ' ' + _jhT('jh_pts').toUpperCase(), c.x + c.w - 18, c.y + 18); });
  jhFreeCards().forEach(c => { ctx.save(); ctx.setLineDash([4, 4]); ctx.strokeStyle = ink; ctx.globalAlpha = .45; ctx.strokeRect(c.x, c.y, c.w, c.h); ctx.restore();
    ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.font = '500 12px ' + JH_MONO; ctx.fillText(_jhT('jh_free').toUpperCase(), c.x + 6, c.y + 18); ctx.font = '400 11.5px ' + JH_MONO; ctx.fillText(_jhT('jh_free_sub'), c.x + 6, c.y + 36); });
  const dy = bot + 34; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.globalAlpha = .7;
  for (let c = 0; c < JH_COLS; c++){ const x0 = JH_RX0 + c * (JH_RW + JH_GAP) - JH_GAP / 2, x1 = x0 + JH_RW + JH_GAP; ctx.beginPath(); ctx.moveTo(x0, dy); ctx.lineTo(x1, dy); ctx.moveTo(x0, dy - 5); ctx.lineTo(x0, dy + 5); ctx.moveTo(x1, dy - 5); ctx.lineTo(x1, dy + 5); ctx.stroke();
    ctx.fillStyle = ink; ctx.font = '500 11px ' + JH_MONO; ctx.textAlign = 'center'; ctx.fillText('4.20', (x0 + x1) / 2, dy - 6); }
  ctx.globalAlpha = 1; const tw = 300, tx = JH_W - tw - 16, ty = _jhH - 46; ctx.strokeStyle = ink; ctx.strokeRect(tx, ty, tw, 38); ctx.beginPath(); ctx.moveTo(tx + 200, ty); ctx.lineTo(tx + 200, ty + 38); ctx.stroke();
  ctx.textAlign = 'left'; ctx.fillStyle = C.fg; ctx.font = '600 11.5px ' + JH_MONO; ctx.fillText(_jhT('jh_drawing_block').toUpperCase(), tx + 10, ty + 16); ctx.fillStyle = C.muted; ctx.font = '400 11px ' + JH_MONO; ctx.fillText('1:50 · A-01', tx + 10, ty + 31);
  ctx.fillText(_jhT('jh_r_' + _jh.range).toUpperCase(), tx + 210, ty + 23);
}
function jhHouseSub(){
  const parts = [];
  if (_jh.one) parts.push(_jhT('jh_only', { no: jhOneNo() }));
  parts.push(_jhT('jh_r_' + _jh.range), _jhTn('jh_n_agents', _jhRooms.length, { n: _jhRooms.length }), _jhTn('jh_n_floors', _jhF, { n: _jhF }));
  return parts.join(' · ');
}
function jhOneNo(){ const c = _jh.data && _jh.data.contracts && _jh.data.contracts[_jh.one]; return c ? c.no : _jh.one; }
function jhRunners(ctx, pieces){
  const atRest = !_jh.playing && _jh.t >= 1;
  const on = _jh.one ? new Set(pieces.map(p => p.agent)) : null;
  const pts = _jhRooms.map(r => jhPosAt(r, atRest ? 0 : _jh.t));
  if (_jh.playing) pts.forEach((p, i) => { const tr = _jh.trails[i] || (_jh.trails[i] = []); tr.push({ x: p.x, y: p.y }); if (tr.length > 110) tr.shift(); });
  _jh.trails.forEach((tr, i) => { if (!tr || tr.length < 2 || !_jhRooms[i]) return; ctx.save(); ctx.strokeStyle = _jhRooms[i].col; ctx.lineWidth = _jh.look === 1 ? 1.6 : 2; ctx.setLineDash(_jh.look === 1 ? [4, 4] : []);
    for (let j = 1; j < tr.length; j++){ ctx.globalAlpha = (j / tr.length) * (_jh.sel === null ? .45 : _jh.sel === _jhRooms[i].k ? .9 : .08); ctx.beginPath(); ctx.moveTo(tr[j - 1].x, tr[j - 1].y - 10); ctx.lineTo(tr[j].x, tr[j].y - 10); ctx.stroke(); } ctx.restore(); });
  _jh.lastPos = pts.map((p, i) => { const r = _jhRooms[i], lit = _jh.sel === r.k, dim = (_jh.sel !== null && !lit) || (on && !on.has(r.k)), rad = 10 + (lit ? 3 : 0), cy = p.y - rad - 6;
    ctx.save(); if (dim) ctx.globalAlpha = .3;
    jhJambo(ctx, r, p.x, cy, rad, lit);
    if (p.kind === 'work' && !atRest){ ctx.strokeStyle = r.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, cy, rad + 6, -Math.PI / 2, -Math.PI / 2 + p.k * Math.PI * 2); ctx.stroke(); }
    if (p.kind === 'visit'){ ctx.fillStyle = '#fff'; ctx.strokeStyle = r.col; ctx.lineWidth = 1.2; ctx.fillRect(p.x + rad - 2, cy - rad - 6, 12, 8); ctx.strokeRect(p.x + rad - 2, cy - rad - 6, 12, 8); }
    ctx.restore(); return { x: p.x, y: cy }; });
}
function jhDateCard(ctx){
  const S = jhSpan(), cur = new Date(_jh.t >= 1 ? S.end : S.from + _jh.t * (S.end - S.from));
  let txt = '';
  try { txt = _jh.range === 1 ? _jhT('jh_r_1') + ' · ' + cur.toLocaleTimeString((typeof langLocale === 'function') ? langLocale() : undefined, { hour: '2-digit', minute: '2-digit' })
    : cur.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + '  ·  ' + _jhT('jh_day_of', { d: Math.max(1, Math.ceil(_jh.t * _jh.range)), n: _jh.range }); }
  catch (_) { txt = ''; }
  if (!txt) return;
  ctx.font = '600 13px Geist, sans-serif'; const w = ctx.measureText(txt).width + 22, x = JH_W - w - 16, y = 18;
  ctx.fillStyle = _jhC.soft; ctx.strokeStyle = _jhC.line; jhRoundRect(ctx, x, y, w, 28, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = _jhC.fg; ctx.textAlign = 'left'; ctx.fillText(txt, x + 11, y + 18);
}
function jhDrawPops(ctx){
  _jh.pops = _jh.pops.filter(p => p.a < 1); _jh.pops.forEach(p => { p.a += .016;
    ctx.globalAlpha = 1 - p.a; ctx.font = '700 16px Geist, sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = _jhC.card; ctx.strokeText(p.text, p.x, p.y - p.a * 34); ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y - p.a * 34); ctx.globalAlpha = 1; });
}
/* ONE FRAME: the house, its runners, the date, the points that landed. */
function jhFrame(now){
  _jh.raf = 0;
  const cv = document.getElementById('jh-cv');
  if (!cv || typeof state === 'undefined' || state.view !== 'jambo' || _jh.tab !== 'house') return;
  const pieces = jhPieces();
  if (_jh.playing){
    const dt = Math.min(60, now - (_jh.last || now)); _jh.last = now;
    const t0 = _jh.t; _jh.t = Math.min(1, _jh.t + dt * _jh.speed / JH_DURATION_MS);
    const S = jhSpan(), a = S.from + t0 * (S.end - S.from), b = S.from + _jh.t * (S.end - S.from);
    for (const p of pieces){
      const at = Date.parse(p.decidedAt || '') || 0;
      if (!p.outcome || at <= a || at > b) continue;
      const i = _jhRooms.findIndex(r => r.k === p.agent); if (i < 0) continue;
      const pos = _jh.lastPos[i] || { x: JH_W / 2, y: _jhH / 2 }, v = agPointsEach(agPointsOf(p.agent), p.outcome);
      _jh.pops.push({ x: pos.x, y: pos.y - 20, text: (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)), col: v >= 0 ? _jhRooms[i].col : _jhC.ruby, a: 0 }); if (_jh.pops.length > 80) _jh.pops.shift();
      jhFeedAdd(p);
    }
    if (_jh.t >= 1){ _jh.playing = false; jhFinish(); }
  } else _jh.last = now;
  const ctx = cv.getContext('2d');
  const upto = jhUpto();
  (_jh.look === 1 ? jhDrawDrawing : jhDrawPlan)(ctx, pieces, upto);
  jhRunners(ctx, pieces); jhDateCard(ctx); jhDrawPops(ctx);
  jhScorePaint(pieces, upto);
  if (_jh.playing || _jh.pops.length) _jh.raf = requestAnimationFrame(jhFrame);
}
function jhKick(){ if (!_jh.raf && typeof requestAnimationFrame === 'function') _jh.raf = requestAnimationFrame(jhFrame); }

/* ---------------- THE SCORE PANEL: one card per agent, in a scroll ---------------- */
let _jhScKey = '';
function jhScorePaint(pieces, upto){
  const rows = document.getElementById('jh-rows'); if (!rows) return;
  let total = 0;
  _jhRooms.forEach(r => { const s = agPointsTally(r.k, pieces, upto); total += s.pts;
    const el = rows.querySelector(`[data-jh-agent="${r.k}"]`); if (!el) return;
    const p = el.querySelector('[data-jh-p]'), d = el.querySelector('[data-jh-d]');
    const pt = _jhFmt(s.pts), dt = s.n + ' ' + _jhT('jh_unit_' + r.k) + (s.n ? ' · ' + _jhT('jh_pct_used', { p: s.n ? Math.round(s.used / s.n * 100) : 0 }) : '');
    if (p && p.textContent !== pt) p.textContent = pt; if (d && d.textContent !== dt) d.textContent = dt; });
  const tot = document.getElementById('jh-total'); if (tot && tot.textContent !== _jhFmt(total)) tot.textContent = _jhFmt(total);
  const prog = document.getElementById('jh-prog'); if (prog) prog.style.width = (_jh.t * 100) + '%';
  jhScorecard(pieces, upto);
}
function jhScorecard(pieces, upto){
  const host = document.getElementById('jh-sc'); if (!host) return;
  const list = _jh.sel ? [_jh.sel] : _jhRooms.map(r => r.k);
  let n = 0, used = 0, changed = 0, thrown = 0, open = 0, pts = 0, hrs = 0;
  list.forEach(k => { const s = agPointsTally(k, pieces, upto); n += s.n; used += s.used; changed += s.changed; thrown += s.thrown; open += s.open; pts += s.pts; hrs += s.hrs; });
  const title = (_jh.sel ? _jhT('ag_' + _jh.sel) : _jhT('jh_all')) + (_jh.one ? ' · ' + jhOneNo() : '');
  const key = [title, n, used, changed, thrown, open, pts, JSON.stringify(_jh.sel ? agPointsOf(_jh.sel) : '')].join('|');
  if (key === _jhScKey) return; _jhScKey = key;
  const done = used + changed + thrown, pc = x => done ? Math.round(x / done * 100) : 0;
  const lvl = _jh.sel ? jhLevelWords(_jh.sel) : jhRangeWords();
  const sum = _jh.sel ? (() => { const s = agPointsTally(_jh.sel, pieces, upto);
    return `<div class="jh-sum"><small>${_jhE(_jhT('jh_sum_h'))}${agPointsMine(_jh.sel) ? ' · ' + _jhE(_jhT('jh_mine_tag')) : ''}</small>${_jhE(agPointsSumLine(s, _jh.sel))}<span>${_jhE(_jhT('jh_sum_rule'))}</span></div>`; })() : '';
  host.innerHTML = `<h4 class="jh-sc-h"><span>${_jhE(title)}</span><span class="jh-quiet">${_jhE(lvl)}</span></h4>
    <div class="jh-mix" role="img" aria-label="${_jhE(_jhT('jh_used'))} ${pc(used)}%, ${_jhE(_jhT('jh_changed'))} ${pc(changed)}%, ${_jhE(_jhT('jh_thrown'))} ${pc(thrown)}%">
      <i style="width:${pc(used)}%" class="u"></i><i style="width:${pc(changed)}%" class="c"></i><i style="width:${pc(thrown)}%" class="t"></i></div>
    <div class="jh-legend"><span><b class="u"></b>${_jhE(_jhT('jh_used'))} ${pc(used)}%</span><span><b class="c"></b>${_jhE(_jhT('jh_changed'))} ${pc(changed)}%</span><span><b class="t"></b>${_jhE(_jhT('jh_thrown'))} ${pc(thrown)}%</span></div>
    <div class="jh-kpis"><div><small>${_jhE(_jhT('jh_k_pieces'))}</small><b>${_jhFmt(n)}</b></div><div><small>${_jhE(_jhT('jh_k_hours'))}</small><b>${hrs.toFixed(1)}</b></div>
      <div><small>${_jhE(_jhT('jh_k_waiting'))}</small><b>${_jhFmt(open)}</b></div><div><small>${_jhE(_jhT('jh_k_points'))}</small><b>${_jhFmt(pts)}</b></div></div>${sum}`;
  jhFitPanel();
}
function jhLevelWords(k){
  if (typeof AG_READINGS !== 'undefined' && Array.isArray(AG_READINGS) && AG_READINGS.includes(k)) return _jhT('jh_reads_only');
  const lv = (typeof agLevelOf === 'function') ? agLevelOf(k) : 'ask';
  return _jhT('st_agents_lv_' + (['auto', 'ask', 'mine'].includes(lv) ? lv : 'ask'));
}
/* The panel stands as tall as the house; its agent cards scroll inside it. */
function jhFitPanel(){
  const panel = document.querySelector('.jh-panel'), stage = document.getElementById('jh-stage'), rows = document.getElementById('jh-rows');
  if (!panel || !stage || !rows || typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    if (!document.body.contains(rows)) return;
    if (typeof matchMedia === 'function' && !matchMedia('(min-width: 1180px)').matches){ rows.style.maxHeight = '420px'; return; }
    rows.style.maxHeight = '0px';
    const other = panel.offsetHeight;
    rows.style.maxHeight = Math.max(170, Math.max(480, stage.offsetHeight) - other) + 'px';
  });
}
function jhRowsHtml(){
  return _jhRooms.map(r => `<button type="button" class="jh-row${_jh.sel === r.k ? ' on' : ''}" data-jh-agent="${r.k}" aria-pressed="${_jh.sel === r.k}">
      <canvas width="56" height="56" data-jh-face="${r.k}" aria-hidden="true"></canvas>
      <span class="jh-row-t"><span class="jh-row-n">${_jhE(_jhT('ag_' + r.k))}${agPointsIsNew(r.k) ? `<span class="jh-tag is-new">${_jhE(_jhT('jh_new_tag'))}</span>` : ''}${agPointsMine(r.k) ? `<span class="jh-tag">${_jhE(_jhT('jh_mine_tag'))}</span>` : ''}</span>
      <span class="jh-row-d" data-jh-d></span></span><span class="jh-row-p" data-jh-p>0</span></button>`).join('');
}
function jhPaintFaces(root){
  (root || document).querySelectorAll('canvas[data-jh-face]').forEach(c => { const r = _jhRooms.find(x => x.k === c.getAttribute('data-jh-face')); if (!r) return;
    const x = c.getContext('2d'); x.clearRect(0, 0, 56, 56); jhJambo(x, r, 28, 33, 17, false); });
}

/* ---------------- WHAT JAMBO DID (the feed under the house) ---------------- */
function jhFeedLine(p){
  const c = p.cid && _jh.data && _jh.data.contracts && _jh.data.contracts[p.cid];
  const what = c ? [c.no, c.cp || c.name].filter(Boolean).join(' · ') : '';
  const out = p.outcome ? _jhT('jh_out_' + p.outcome) : _jhT('jh_open');
  return `<div><b>${_jhE(_jhT('ag_' + p.agent))}</b> ${_jhE(_jhT('jh_act_' + p.agent))}${what ? ' — ' + _jhE(what) : ''} <span class="jh-out is-${p.outcome || 'open'}">${_jhE(out)}</span></div>`;
}
function jhFeedAdd(p){
  if (_jh.sel && p.agent !== _jh.sel) return;
  const f = document.getElementById('jh-feed'); if (!f) return;
  const none = f.querySelector('.jh-none'); if (none) none.remove();
  f.insertAdjacentHTML('afterbegin', jhFeedLine(p)); while (f.children.length > 30) f.lastElementChild.remove();
}
function jhFeedFill(){
  const f = document.getElementById('jh-feed'); if (!f) return;
  const upto = jhUpto();
  const list = jhPieces().filter(p => (!_jh.sel || p.agent === _jh.sel) && p.outcome && (Date.parse(p.decidedAt || '') || 0) <= upto)
    .sort((a, b) => String(b.decidedAt).localeCompare(String(a.decidedAt))).slice(0, 30);
  f.innerHTML = list.length ? list.map(jhFeedLine).join('') : `<p class="jh-none">${_jhE(_jhT('jh_feed_none'))}</p>`;
}
function jhFinish(){
  const end = document.getElementById('jh-end'); if (!end) return;
  const pieces = jhPieces();
  const tot = _jhRooms.map(r => ({ k: r.k, s: agPointsTally(r.k, pieces, Infinity) }));
  const total = tot.reduce((a, x) => a + x.s.pts, 0), hrs = tot.reduce((a, x) => a + x.s.hrs, 0);
  const best = tot.slice().sort((a, b) => b.s.pts - a.s.pts)[0];
  document.getElementById('jh-end-t').textContent = _jhT('jh_end_title', { n: _jhFmt(total) });
  document.getElementById('jh-end-l').textContent = !total && !tot.some(x => x.s.used + x.s.changed + x.s.thrown) ? _jhT('jh_end_none')
    : _jhT(_jh.one ? 'jh_end_line_on' : 'jh_end_line', { h: Math.round(hrs), name: best ? _jhT('ag_' + best.k) : '', no: jhOneNo() });
  end.hidden = false;
}

/* ---------------- THE CONTRACT, TYPED BY ITS NUMBER ---------------- */
let _jhOneAct = 0;
function jhOneOpts(){
  const n = {};
  for (const p of (_jh.data && _jh.data.pieces) || []) if (p.cid) n[p.cid] = (n[p.cid] || 0) + 1;
  const C = (_jh.data && _jh.data.contracts) || {};
  return Object.keys(n).filter(id => C[id]).map(id => ({ id, no: C[id].no || id, name: C[id].cp || C[id].name || '', n: n[id] }))
    .sort((a, b) => String(a.no).localeCompare(String(b.no), undefined, { numeric: true }));
}
const _jhNorm = s => String(s || '').toLowerCase().replace(/[\s\-–_/.]/g, '');
function jhOneMatches(q){
  const k = _jhNorm(q), opts = jhOneOpts(); if (!k) return opts;
  return opts.filter(o => _jhNorm(o.no).includes(k) || _jhNorm(o.no).replace(/^[a-z]+/, '').includes(k) || String(o.name).toLowerCase().includes(String(q).toLowerCase().trim()));
}
function _jhHl(s, q){ const k = String(q || '').trim(); if (!k) return _jhE(s); const i = String(s).toLowerCase().indexOf(k.toLowerCase()); return i < 0 ? _jhE(s) : _jhE(s.slice(0, i)) + '<mark>' + _jhE(s.slice(i, i + k.length)) + '</mark>' + _jhE(s.slice(i + k.length)); }
function jhOnePaintList(){
  const inp = document.getElementById('jh-one'), list = document.getElementById('jh-one-list'), x = document.getElementById('jh-one-x'); if (!inp || !list) return;
  const q = inp.value, hits = jhOneMatches(q); _jhOneAct = Math.min(_jhOneAct, Math.max(0, hits.length - 1));
  list.innerHTML = hits.length ? hits.map((o, i) => `<button type="button" class="jh-opt${i === _jhOneAct ? ' act' : ''}" role="option" aria-selected="${i === _jhOneAct}" data-jh-one="${_jhE(o.id)}"><b>${_jhHl(o.no, q)}</b><span>${_jhHl(o.name, q)}</span><small>${_jhE(_jhTn('jh_n_pieces', o.n, { n: o.n }))}</small></button>`).join('')
    : `<div class="jh-none">${_jhE(_jhT('jh_one_none', { q: q.trim(), r: jhRangeWords() }))}</div>`;
  list.hidden = false; inp.setAttribute('aria-expanded', 'true'); if (x) x.hidden = !_jh.one && !q;
}
function jhOneShow(){
  const inp = document.getElementById('jh-one'), x = document.getElementById('jh-one-x'), list = document.getElementById('jh-one-list'); if (!inp) return;
  if (list){ list.hidden = true; inp.setAttribute('aria-expanded', 'false'); }
  const o = jhOneOpts().find(y => y.id === _jh.one);
  if (document.activeElement !== inp) inp.value = o ? o.no + (o.name ? ' · ' + o.name : '') : '';
  inp.classList.toggle('has', !!o); if (x) x.hidden = !o && !inp.value;
}
function jhOnePick(id){
  _jh.one = id || ''; _jh.sel = null; _jhScKey = '';
  const inp = document.getElementById('jh-one'); if (inp) inp.blur();
  jhReplayFromStart(false); renderJamboHouse();
}

/* ---------------- THE PAGE ---------------- */
function jhBandHtml(){
  const pieces = jhPieces(), n = pieces.length;
  const facts = [_jhTn('jh_n_agents', agPointsKeys().length, { n: agPointsKeys().length })];
  if (_jh.data && !_jh.data.static) facts.push(_jhTn('jh_n_pieces_in', n, { n, r: jhRangeWords() }));
  return `<div class="sap-band jh-band">
    <div class="jh-head"><div style="min-width:0"><h1 class="jh-t">${_jhE(_jhT('nav_jambo'))}</h1><div class="page-facts">${facts.map(_jhE).join(' · ')}</div></div>
      <div class="jh-acts"><button type="button" class="ui-btn" data-jh-points>${_jhE(_jhT('jh_change_points'))}</button></div></div>
    <div class="jh-tabs" role="tablist">${JH_TABS.map(t => `<button type="button" role="tab" class="jh-tab" data-jh-tab="${t}" aria-selected="${_jh.tab === t}">${_jhE(_jhT('jh_tab_' + t))}${t === 'jobs' ? ` <span class="jh-quiet">${agPointsKeys().length}</span>` : ''}</button>`).join('')}</div>
  </div>`;
}
function jhSeg(name, label, opts, cur){
  return `<span class="jh-lbl">${_jhE(label)}</span><span class="jh-seg" role="group" aria-label="${_jhE(label)}">${opts.map(([v, w]) => `<button type="button" data-jh-${name}="${v}" aria-pressed="${String(v) === String(cur)}">${_jhE(w)}</button>`).join('')}</span>`;
}
function jhHouseHtml(){
  const D = _jh.data;
  if (!D || _jh.loading) return `<div class="jh-body"><p class="jh-note">${(typeof busyHtml === 'function') ? busyHtml(_jhT('jh_loading')) : _jhE(_jhT('jh_loading'))}</p></div>`;
  const notes = [D.static ? _jhT('jh_static') : '', D.error ? D.error : '', D.cut ? _jhT('jh_cut', { n: _jhFmt(D.max) }) : ''].filter(Boolean);
  return `<div class="jh-body">
    <div class="jh-bar">
      ${jhSeg('range', _jhT('jh_range'), JH_RANGES.map(r => [r, _jhT('jh_r_' + r)]), _jh.range)}
      <button type="button" class="ui-btn ui-btn-primary jh-play" data-jh-play>${_jhE(_jhT(_jh.playing ? 'jh_pause' : 'jh_play'))}</button>
      <button type="button" class="ui-btn" data-jh-restart>${_jhE(_jhT('jh_again'))}</button>
      <span class="jh-prog" aria-hidden="true"><i id="jh-prog"></i></span>
    </div>
    <div class="jh-bar">
      <label class="jh-lbl" for="jh-one">${_jhE(_jhT('jh_contract'))}</label>
      <span class="jh-combo"><svg class="jh-combo-ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
        <input id="jh-one" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="jh-one-list" aria-autocomplete="list" placeholder="${_jhE(_jhT('jh_contract_ph'))}">
        <button type="button" class="jh-combo-x" id="jh-one-x" aria-label="${_jhE(_jhT('jh_contract_all'))}" hidden>×</button>
        <span class="jh-combo-list" id="jh-one-list" role="listbox" hidden></span></span>
      ${jhSeg('look', _jhT('jh_look'), [[0, _jhT('jh_look_plan')], [1, _jhT('jh_look_drawing')]], _jh.look)}
      ${jhSeg('speed', _jhT('jh_speed'), JH_SPEEDS.map(v => [v, _jhT('jh_sp_' + String(v).replace('.', ''))]), _jh.speed)}
    </div>
    ${notes.map(x => `<p class="jh-note">${_jhE(x)}</p>`).join('')}
    <div class="jh-split">
      <div class="jh-left">
        <div class="jh-stage" id="jh-stage">
          <canvas id="jh-cv" width="${JH_W}" height="${_jhH}" role="img" aria-label="${_jhE(_jhT('jh_house_aria'))}"></canvas>
          <div class="jh-tip" id="jh-tip" role="tooltip" hidden></div>
          <div class="jh-end" id="jh-end" hidden><div class="jh-end-card">${(typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 56, 'jh-end-face') : ''}
            <h3 id="jh-end-t"></h3><p id="jh-end-l"></p><p class="jh-quiet">${_jhE(_jhT('jh_end_hint'))}</p>
            <button type="button" class="ui-btn ui-btn-primary" data-jh-restart>${_jhE(_jhT('jh_again'))}</button></div></div>
        </div>
        <div class="jh-feedcard"><h4>${_jhE(_jhT('jh_feed_h'))}</h4><div class="jh-feed" id="jh-feed" aria-live="polite"></div></div>
      </div>
      <aside class="jh-panel" aria-label="${_jhE(_jhT('jh_k_points'))}">
        <div class="jh-total"><b id="jh-total">0</b><span>${_jhE(_jhT('jh_pts'))} · ${_jhE(_jh.one ? jhOneNo() + ' · ' : '')}${_jhE(jhRangeWords())}</span></div>
        <p class="jh-note">${_jhE(_jhT('jh_point_rule'))} ${_jhE(_jhT(agPointsKeys().some(k => agPointsMine(k)) ? 'jh_vals_mine' : 'jh_vals_company'))}</p>
        <div class="jh-rows" id="jh-rows">${jhRowsHtml()}</div>
        <div class="jh-sc" id="jh-sc"></div>
      </aside>
    </div>
  </div>`;
}
function jhJobsHtml(){
  const pieces = jhPieces();
  const rows = _jhRooms.map(r => { const v = agPointsOf(r.k), s = agPointsTally(r.k, pieces, Infinity);
    const runs = _jhT('ag_' + r.k + '_runs');
    return `<tr><td><span class="jh-dot" style="background:${r.col}"></span><b>${_jhE(_jhT('ag_' + r.k))}</b>${agPointsIsNew(r.k) ? `<span class="jh-tag is-new">${_jhE(_jhT('jh_new_tag'))}</span>` : ''}</td>
      <td>${_jhE(_jhT('jh_room_' + r.k))}, ${_jhE(jhFloorName(r.f).toLowerCase())}</td><td>${_jhE(_jhT('ag_' + r.k + '_does'))}</td><td>${_jhE(runs)}</td>
      <td><span class="jh-lvl">${_jhE(jhLevelWords(r.k))}</span></td><td class="n">${v.mins}${agPointsMine(r.k) ? ` <span class="jh-tag">${_jhE(_jhT('jh_mine_tag'))}</span>` : ''}</td><td class="n">${_jhFmt(s.pts)}</td></tr>`; }).join('');
  return `<div class="jh-body"><div class="jh-tw"><table class="jh-table">
    <thead><tr><th>${_jhE(_jhT('jh_col_agent'))}</th><th>${_jhE(_jhT('jh_col_room'))}</th><th>${_jhE(_jhT('jh_col_does'))}</th><th>${_jhE(_jhT('jh_col_runs'))}</th><th>${_jhE(_jhT('jh_col_works'))}</th><th class="n">${_jhE(_jhT('jh_col_each'))}</th><th class="n">${_jhE(_jhT('jh_col_pts', { r: jhRangeWords() }))}</th></tr></thead>
    <tbody>${rows}</tbody></table></div></div>`;
}
function jhHowHtml(){
  const k = 'paper', v = agPointsOf(k), s = agPointsTally(k, jhPieces(), Infinity), n = x => +x.toFixed(1);
  const ex = (s.used + s.changed + s.thrown)
    ? `<h3>${_jhE(_jhT('jh_ex_h', { name: _jhT('ag_' + k), r: jhRangeWords() }))}</h3>
      <p>${_jhE(_jhT('jh_ex_p', { n: s.used + s.changed + s.thrown, m: v.mins }))}</p>
      <ul><li>${_jhE(_jhT('jh_used'))}: ${s.used} × ${n(agPointsEach(v, 'used'))}</li><li>${_jhE(_jhT('jh_changed'))}: ${s.changed} × ${n(agPointsEach(v, 'changed'))} (${v.changed}%)</li><li>${_jhE(_jhT('jh_thrown'))}: ${s.thrown} × ${n(-agPointsEach(v, 'thrown'))} (−${v.thrown}%)</li></ul>
      <p class="jh-big">${_jhE(_jhT('jh_ex_big', { n: _jhFmt(s.pts), h: s.hrs.toFixed(1) }))}</p>`
    : `<h3>${_jhE(_jhT('jh_ex_h', { name: _jhT('ag_' + k), r: jhRangeWords() }))}</h3><p>${_jhE(_jhT('jh_ex_none', { name: _jhT('ag_' + k) }))}</p>`;
  const card = (t, p) => `<div class="jh-card"><h3>${_jhE(_jhT(t))}</h3><p>${_jhE(_jhT(p))}</p></div>`;
  const out = (cls, t, p, v2) => `<div class="jh-card jh-out-card"><span class="jh-sw ${cls}"></span><div><h3>${_jhE(_jhT(t))}</h3><p>${_jhE(_jhT(p, { v: v2 }))}</p></div></div>`;
  return `<div class="jh-body">
    <div class="jh-rule">${_jhE(_jhT('jh_how_rule'))}</div>
    <div class="jh-grid">${out('u', 'jh_used', 'jh_how_used', AG_POINTS_SHARES.used)}${out('c', 'jh_changed', 'jh_how_changed', AG_POINTS_SHARES.changed)}${out('t', 'jh_thrown', 'jh_how_thrown', AG_POINTS_SHARES.thrown)}</div>
    <div class="jh-card jh-example">${ex}</div>
    <h3 class="jh-sec">${_jhE(_jhT('jh_how_where_h'))}</h3>
    <div class="jh-grid">${card('jh_how_rec_t', 'jh_how_rec')}${card('jh_how_round_t', 'jh_how_round')}${card('jh_how_board_t', 'jh_how_board')}${card('jh_how_wait_t', 'jh_how_wait')}</div>
    <h3 class="jh-sec">${_jhE(_jhT('jh_who_h'))}</h3>
    <div class="jh-grid">${card('jh_who_admin_t', 'jh_who_admin')}${card('jh_who_mine_t', 'jh_who_mine')}${card('jh_cap_t', 'jh_cap')}${card('jh_only_t', 'jh_only_p')}</div>
    <h3 class="jh-sec">${_jhE(_jhT('jh_rule_h'))}</h3>
    <div class="jh-grid">${card('jh_rule_list_t', 'jh_rule_list')}${card('jh_rule_move_t', 'jh_rule_move')}${card('jh_rule_check_t', 'jh_rule_check')}</div>
  </div>`;
}
function renderJamboHouse(){
  const host = document.getElementById('content'); if (!host) return;
  if (typeof cancelAnimationFrame === 'function' && _jh.raf){ cancelAnimationFrame(_jh.raf); _jh.raf = 0; }
  /* ARRIVING IS AT REST: a replay paused on the way out is not where the page
     opens next time — it opens on the whole period's totals, still. */
  if (!document.querySelector('.jh-page')) jhReplayFromStart(false);
  jhColors(); jhLayout(); _jhRooms.forEach(jhSimulate);
  if (!_jh.data || _jh.data.days !== _jh.range){
    if (!_jh.loading) jhLoad().then(() => { if (typeof state !== 'undefined' && state.view === 'jambo') renderJamboHouse(); });
  }
  const body = _jh.tab === 'jobs' ? (_jh.data ? jhJobsHtml() : jhHouseHtml()) : _jh.tab === 'how' ? jhHowHtml() : jhHouseHtml();
  host.innerHTML = `<style>${JH_CSS}</style><div class="view-enter sap-page jh-page" data-jh-tab-on="${_jh.tab}">${jhBandHtml()}${body}</div>`;
  jhWire(host);
  if (typeof setActiveNav === 'function') setActiveNav('jambo');
  if (_jh.tab === 'house' && document.getElementById('jh-cv')){
    jhPaintFaces(host); jhOneShow(); jhFeedFill(); _jhScKey = '';
    const face = jhFaceImg(); if (face && !face.complete) face.onload = () => { jhPaintFaces(); jhKick(); };
    jhFrame(typeof performance !== 'undefined' ? performance.now() : 0);
    jhFitPanel();
  }
}
function jhRepaint(){ if (typeof state !== 'undefined' && state.view === 'jambo') renderJamboHouse(); }
function jhReplayFromStart(play){
  _jh.t = play ? 0 : 1; _jh.pops = []; _jh.trails = []; _jh.playing = !!play; _jh.last = 0; _jhScKey = '';
}
function jhSetPlayWord(){ const b = document.querySelector('[data-jh-play]'); if (b) b.textContent = _jhT(_jh.playing ? 'jh_pause' : 'jh_play'); const e = document.getElementById('jh-end'); if (e && _jh.playing) e.hidden = true; }
function jhWire(host){
  if (host.dataset.jhWired) return; host.dataset.jhWired = '1';
  host.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'jambo') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    let el;
    if ((el = t.closest('[data-jh-tab]'))){ _jh.tab = el.getAttribute('data-jh-tab'); if (typeof placeSave === 'function') placeSave(); renderJamboHouse(); return; }
    if (t.closest('[data-jh-points]')){ jhOpenPoints(); return; }
    if ((el = t.closest('[data-jh-range]'))){ _jh.range = Number(el.getAttribute('data-jh-range')) || 30; _jh.one = ''; _jh.sel = null; jhReplayFromStart(false); if (typeof placeSave === 'function') placeSave(); renderJamboHouse(); return; }
    if ((el = t.closest('[data-jh-look]'))){ _jh.look = Number(el.getAttribute('data-jh-look')) === 1 ? 1 : 0; _jh.trails = []; if (typeof placeSave === 'function') placeSave(); renderJamboHouse(); return; }
    if ((el = t.closest('[data-jh-speed]'))){ _jh.speed = Number(el.getAttribute('data-jh-speed')) || 1;
      host.querySelectorAll('[data-jh-speed]').forEach(b => b.setAttribute('aria-pressed', String(b === el))); if (typeof placeSave === 'function') placeSave(); return; }
    if (t.closest('[data-jh-play]')){ if (_jh.playing){ _jh.playing = false; } else { if (_jh.t >= 1){ jhReplayFromStart(true); jhFeedFill(); } else _jh.playing = true; _jh.last = 0; } jhSetPlayWord(); jhKick(); return; }
    if (t.closest('[data-jh-restart]')){ jhReplayFromStart(true); jhFeedFill(); jhSetPlayWord(); jhKick(); return; }
    if ((el = t.closest('[data-jh-agent]'))){ const k = el.getAttribute('data-jh-agent'); _jh.sel = _jh.sel === k ? null : k; _jhScKey = '';
      host.querySelectorAll('[data-jh-agent]').forEach(b => { const on = b.getAttribute('data-jh-agent') === _jh.sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      jhFeedFill(); jhKick(); return; }
    if (t.closest('#jh-one-x')){ const i = document.getElementById('jh-one'); if (i) i.value = ''; jhOnePick(''); return; }
  });
  host.addEventListener('pointerdown', e => { const b = e.target && e.target.closest && e.target.closest('[data-jh-one]'); if (b){ e.preventDefault(); jhOnePick(b.getAttribute('data-jh-one')); } });
  host.addEventListener('focusin', e => { if (e.target && e.target.id === 'jh-one'){ try { e.target.select(); } catch (_) {} _jhOneAct = 0; jhOnePaintList(); } });
  host.addEventListener('focusout', e => { if (e.target && e.target.id === 'jh-one') setTimeout(jhOneShow, 0); });
  host.addEventListener('input', e => { if (e.target && e.target.id === 'jh-one'){ _jhOneAct = 0; jhOnePaintList(); } });
  host.addEventListener('keydown', e => {
    if (!e.target || e.target.id !== 'jh-one') return;
    const hits = jhOneMatches(e.target.value);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); _jhOneAct = (_jhOneAct + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); jhOnePaintList(); }
    else if (e.key === 'Enter'){ e.preventDefault(); if (!e.target.value.trim()) jhOnePick(''); else if (hits[_jhOneAct]) jhOnePick(hits[_jhOneAct].id); }
    else if (e.key === 'Escape'){ e.preventDefault(); e.target.blur(); jhOneShow(); }
  });
  host.addEventListener('mousemove', e => {
    const cv = e.target && e.target.id === 'jh-cv' ? e.target : null, tip = document.getElementById('jh-tip');
    if (!cv){ if (_jh.hover){ _jh.hover = null; if (tip) tip.hidden = true; jhKickOnce(); } return; }
    const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * JH_W / b.width, y = (e.clientY - b.top) * _jhH / b.height;
    const k = jhRoomAt(x, y);
    if (k !== _jh.hover){ _jh.hover = k; jhKickOnce(); }
    cv.style.cursor = k && k !== 'stairs' && k !== 'free' ? 'pointer' : 'default';
    if (!tip) return; if (!k){ tip.hidden = true; return; }
    tip.innerHTML = jhTipHtml(k); tip.hidden = false;
    const sb = cv.parentElement.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = e.clientX - sb.left + 16, top = e.clientY - sb.top + 16;
    if (left + tw > sb.width - 8) left = e.clientX - sb.left - tw - 16; if (top + th > sb.height - 8) top = Math.max(8, sb.height - th - 8);
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = top + 'px';
  });
  host.addEventListener('mouseleave', () => { if (_jh.hover){ _jh.hover = null; const tip = document.getElementById('jh-tip'); if (tip) tip.hidden = true; jhKickOnce(); } }, true);
  host.addEventListener('click', e => { if (e.target && e.target.id === 'jh-cv' && _jh.hover && _jhRooms.some(r => r.k === _jh.hover)){
    const b = document.querySelector(`[data-jh-agent="${_jh.hover}"]`); if (b){ b.click(); try { b.scrollIntoView({ block: 'nearest' }); } catch (_) {} } } });
}
/* A still house is drawn again once after a hover moved, then waits. */
function jhKickOnce(){ if (!_jh.playing && !_jh.raf) jhFrame(typeof performance !== 'undefined' ? performance.now() : 0); }
function jhRoomAt(x, y){
  for (const r of _jhRooms){ const c = r.card; if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return r.k; }
  for (const c of jhFreeCards()) if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return 'free';
  if (Math.abs(x - JH_SX) <= 26 && y >= jhLY(_jhF - 1) - JH_FH && y <= jhLY(0)) return 'stairs';
  return null;
}
function jhTipHtml(k){
  if (k === 'stairs') return `<b>${_jhE(_jhT('jh_stairs'))}</b><p>${_jhE(_jhT('jh_tip_stairs'))}</p>`;
  if (k === 'free') return `<b>${_jhE(_jhT('jh_tip_free_t'))}</b><p>${_jhE(_jhT('jh_tip_free'))}</p>`;
  const r = _jhRooms.find(x => x.k === k), s = agPointsTally(k, jhPieces(), jhUpto()), v = agPointsOf(k);
  return `<div class="jh-tip-h"><span class="jh-dot" style="background:${r.col}"></span><b>${_jhE(_jhT('jh_room_' + k))}</b><span>${_jhE(_jhT('ag_' + k))}</span></div>
    <p>${_jhE(_jhT('ag_' + k + '_does'))}</p>
    <dl><dt>${_jhE(_jhT('jh_tip_runs'))}</dt><dd>${_jhE(_jhT('ag_' + k + '_runs'))}</dd><dt>${_jhE(_jhT('jh_tip_act'))}</dt><dd>${_jhE(_jhT('jh_act1_' + k))}</dd>
      <dt>${_jhE(_jhT('jh_tip_used'))}</dt><dd>${_jhE(_jhT('jh_used_' + k))}</dd><dt>${_jhE(_jhT('jh_tip_worth'))}</dt><dd>${_jhE(_jhT('jh_tip_worth_v', { m: v.mins, c: v.changed, t: v.thrown }))}${agPointsMine(k) ? ` <span class="jh-tag">${_jhE(_jhT('jh_mine_tag'))}</span>` : ''}</dd></dl>
    <div class="jh-sum"><small>${_jhE(_jhT('jh_tip_so_far', { a: s.used, e: s.changed, d: s.thrown, o: s.open }))}</small>${_jhE(agPointsSumLine(s, k))}</div>
    ${agPointsIsNew(k) ? `<p>${_jhE(_jhT('jh_new_note'))}</p>` : ''}`;
}
/* "Change points": an admin's are the company's (Settings → Jambo's agents);
   everybody else's are their own (Your account). */
function jhOpenPoints(){
  const adm = (typeof isAdmin === 'function') && isAdmin();
  if (adm && typeof openSettingsAt === 'function'){ openSettingsAt('platform', 'agents'); return; }
  if (typeof setView === 'function') setView('team');
  setTimeout(() => { const el = document.getElementById('ag-pts-mine'); if (el) try { el.scrollIntoView({ block: 'start' }); } catch (_) {} }, 60);
}

/* ---------------- THE POINTS TABLE: one builder, two seats ----------------
   mode 'company' (Settings → Jambo's agents, an admin's) or 'mine' (Your
   account). Both walk agPointsKeys, so a new agent's row is there the day it
   arrives. */
function agPointsTableHtml(mode){
  const keys = agPointsKeys(), company = mode === 'company';
  const head = company
    ? `<tr><th>${_jhE(_jhT('jh_col_agent'))}</th>${AG_POINTS_FIELDS.map(f => `<th class="n">${_jhE(_jhT('jh_pt_col_' + f))}</th>`).join('')}<th class="n" title="${_jhE(_jhT('jh_pt_ex_title'))}">${_jhE(_jhT('jh_pt_col_ex'))}</th><th></th></tr>`
    : `<tr><th>${_jhE(_jhT('jh_col_agent'))}</th><th>${_jhE(_jhT('jh_pt_company'))}</th>${AG_POINTS_FIELDS.map(f => `<th class="n">${_jhE(_jhT('jh_pt_col_' + f))}</th>`).join('')}<th></th></tr>`;
  const inputs = (k, v) => AG_POINTS_FIELDS.map(f => `<td class="n"><input type="number" min="0" max="${f === 'cap' ? 9999 : f === 'mins' ? 999 : 200}" step="1" inputmode="numeric" data-ag-pt="${k}" data-ag-pt-f="${f}" value="${_jhE(String(v[f]))}" aria-label="${_jhE(_jhT('ag_' + k) + ' · ' + _jhT('jh_pt_col_' + f))}"></td>`).join('');
  const ex = v => _jhFmt(10 * agPointsEach(v, 'used') + 2 * agPointsEach(v, 'changed') + agPointsEach(v, 'thrown'));
  const coLine = v => `${v.mins} · ${v.used}/${v.changed}/−${v.thrown}% · ${_jhT('jh_pt_cap_short', { n: v.cap })}`;
  const body = keys.map(k => {
    const name = `<td><b>${_jhE(_jhT('ag_' + k))}</b>${agPointsIsNew(k) ? `<span class="jh-tag is-new">${_jhE(_jhT('jh_new_tag'))}</span>` : ''}</td>`;
    if (company){ const v = agPointsCompany(k);
      return `<tr data-ag-pt-row="${k}">${name}${inputs(k, v)}<td class="n ag-pt-ex" data-ag-pt-ex="${k}">${ex(v)}</td><td><button type="button" class="ui-link" data-ag-pt-reset="${k}">${_jhE(_jhT('jh_pt_reset_row'))}</button></td></tr>`; }
    const mine = agPointsMine(k);
    return `<tr data-ag-pt-row="${k}">${name}<td class="ag-pt-co">${_jhE(coLine(agPointsCompany(k)))}</td>${mine ? inputs(k, mine) + `<td><button type="button" class="ui-link" data-ag-pt-undo="${k}">${_jhE(_jhT('jh_pt_undo_mine'))}</button></td>`
      : `<td colspan="${AG_POINTS_FIELDS.length}" class="ag-pt-co">${_jhE(_jhT('jh_pt_same'))}</td><td><button type="button" class="ui-link" data-ag-pt-own="${k}">${_jhE(_jhT('jh_pt_use_mine'))}</button></td>`}</tr>`;
  }).join('');
  const anyNew = keys.some(agPointsIsNew), anyMine = keys.some(k => agPointsMine(k));
  const foot = company
    ? `<div class="ag-pt-foot"><span class="st-note">${_jhE(_jhT('jh_pt_foot_admin'))}</span>${anyNew ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ag-pt-saveall>${_jhE(_jhT('jh_pt_save_new'))}</button>` : ''}</div>`
    : `<div class="ag-pt-foot"><span class="st-note">${_jhE(_jhT('jh_pt_foot_mine'))}</span>${anyMine ? `<button type="button" class="ui-btn ui-btn-sm" data-ag-pt-allback>${_jhE(_jhT('jh_pt_all_back'))}</button>` : ''}</div>`;
  return `<div class="ag-pt" data-ag-pt-mode="${mode}"><style>${AG_PT_CSS}</style><p class="st-note">${_jhE(_jhT(company ? 'jh_pt_sub_admin' : 'jh_pt_sub_mine'))}</p>
    <div class="ag-pt-tw"><table class="ag-pt-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>${foot}</div>`;
}
/* Wired on the host it is drawn in, once; the value is saved when the box is left. */
function agPointsWire(host){
  if (!host || host.dataset.agPtWired) return; host.dataset.agPtWired = '1';
  const say = (m, k) => { if (typeof toast === 'function') toast(m, k || 'ok'); };
  const repaint = () => { const box = host.querySelector('.ag-pt'); if (!box) return; const mode = box.getAttribute('data-ag-pt-mode'); box.outerHTML = agPointsTableHtml(mode); jhRepaint(); };
  const rowVals = k => { const v = {}; host.querySelectorAll(`[data-ag-pt="${k}"]`).forEach(i => { v[i.getAttribute('data-ag-pt-f')] = Math.round(Number(i.value)); }); return v; };
  const putCompany = async (body, ok) => {
    try { const r = await api('settings/agent-points', 'PUT', body);
      state.settings = state.settings || {}; state.settings.agentPoints = r.agentPoints; state.settings.agentPointsLog = r.agentPointsLog;
      if (ok) say(ok); repaint(); }
    catch (e){ say((e && e.message) || String(e), 'err'); repaint(); }
  };
  const putMine = async (patch, ok) => {
    try { const r = await api('me/prefs', 'PUT', { agentPoints: patch });
      if (window.REMOTE && REMOTE.me) REMOTE.me.prefs = r.prefs || REMOTE.me.prefs;
      if (ok) say(ok); repaint(); }
    catch (e){ say((e && e.message) || String(e), 'err'); repaint(); }
  };
  host.addEventListener('input', e => {
    const i = e.target && e.target.closest && e.target.closest('[data-ag-pt]'); if (!i) return;
    const k = i.getAttribute('data-ag-pt'), cell = host.querySelector(`[data-ag-pt-ex="${k}"]`);
    if (cell){ const v = { ...agPointsStart(k), ...rowVals(k) }; cell.textContent = _jhFmt(10 * agPointsEach(v, 'used') + 2 * agPointsEach(v, 'changed') + agPointsEach(v, 'thrown')); }
  });
  host.addEventListener('change', e => {
    const i = e.target && e.target.closest && e.target.closest('[data-ag-pt]'); if (!i) return;
    const k = i.getAttribute('data-ag-pt'), mode = (i.closest('.ag-pt') || host).getAttribute('data-ag-pt-mode');
    const v = rowVals(k);
    if (mode === 'company') putCompany({ agent: k, ...v }, _jhT('jh_pt_saved', { name: _jhT('ag_' + k) }));
    else putMine({ [k]: v }, _jhT('jh_pt_saved_mine', { name: _jhT('ag_' + k) }));
  });
  host.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    let el;
    if ((el = t.closest('[data-ag-pt-reset]'))){ const k = el.getAttribute('data-ag-pt-reset'); putCompany({ agent: k, reset: true }, _jhT('jh_pt_reset_done', { name: _jhT('ag_' + k) })); return; }
    if (t.closest('[data-ag-pt-saveall]')){ putCompany({ saveAll: true }, _jhT('jh_pt_saved_all')); return; }
    if ((el = t.closest('[data-ag-pt-own]'))){ const k = el.getAttribute('data-ag-pt-own'); putMine({ [k]: agPointsCompany(k) }, ''); return; }
    if ((el = t.closest('[data-ag-pt-undo]'))){ const k = el.getAttribute('data-ag-pt-undo'); putMine({ [k]: null }, _jhT('jh_pt_undone', { name: _jhT('ag_' + k) })); return; }
    if (t.closest('[data-ag-pt-allback]')){ putMine(null, _jhT('jh_pt_all_back_done')); return; }
  });
}

const AG_PT_CSS = `
  .ag-pt .ag-pt-tw{overflow-x:auto;border:1px solid var(--color-divider);border-radius:var(--radius-lg);margin-top:var(--s-2)}
  .ag-pt-table{width:100%;border-collapse:collapse;font-size:var(--t-meta)}
  .ag-pt-table th,.ag-pt-table td{padding:6px 6px;border-bottom:1px solid var(--color-divider);text-align:left;vertical-align:middle;white-space:nowrap}
  .ag-pt-table tr:last-child td{border-bottom:0}
  .ag-pt-table th{font-weight:var(--w-label);color:var(--color-neutral-600);font-size:var(--t-label)}
  .ag-pt-table .n{text-align:right;font-variant-numeric:tabular-nums}
  .ag-pt-table input{width:52px;text-align:right;font:inherit;font-variant-numeric:tabular-nums;border:1px solid var(--field-line,var(--color-divider));border-radius:var(--radius);padding:3px 6px;background:var(--color-surface);color:var(--color-text)}
  .ag-pt-table input:focus{outline:none;border-color:var(--color-accent)}
  .ag-pt-co{color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
  .ag-pt-ex{color:var(--color-neutral-600)}
  .ag-pt-foot{display:flex;align-items:center;justify-content:space-between;gap:var(--s-2);flex-wrap:wrap;margin-top:var(--s-2)}
  .ag-pt .jh-tag,.jh-tag{display:inline-block;font-size:11px;font-weight:var(--w-label);color:var(--color-accent);border:1px solid currentColor;border-radius:999px;padding:0 6px;margin-left:6px;vertical-align:1px;line-height:15px}
  .ag-pt .jh-tag.is-new,.jh-tag.is-new{color:var(--st-amber-fg)}
`;
const JH_CSS = `
  .jh-page{min-height:var(--view-h);box-sizing:border-box;padding-inline:var(--page-pad-x)}
  .jh-page .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:var(--s-2);padding-bottom:0}
  .jh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap}
  .jh-t{margin:0;font-family:var(--font-heading);font-size:20px;font-weight:var(--w-title);letter-spacing:-.01em;line-height:1.2;color:var(--color-text)}
  .jh-acts{display:flex;align-items:center;gap:var(--s-2);flex:none}
  .jh-tabs{display:flex;gap:4px;overflow-x:auto}
  .jh-tab{border:0;background:none;padding:9px 12px;cursor:pointer;border-bottom:2px solid transparent;color:var(--color-neutral-600);font:inherit;font-weight:var(--w-label);white-space:nowrap}
  .jh-tab[aria-selected="true"]{color:var(--color-accent);border-bottom-color:var(--color-accent)}
  .jh-quiet{color:var(--color-neutral-600);font-weight:400}
  .jh-body{padding:var(--s-4) 0 var(--s-6);display:flex;flex-direction:column;gap:var(--s-3);min-width:0}
  .jh-bar{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:8px 12px}
  .jh-lbl{font-size:var(--t-label);color:var(--color-neutral-600)}
  .jh-seg{display:inline-flex;border:1px solid var(--btn-edge,var(--color-divider));border-radius:var(--radius);overflow:hidden}
  .jh-seg button{border:0;background:none;padding:0 11px;height:var(--ctl-h-sm,28px);cursor:pointer;font:inherit;color:var(--color-text);border-left:1px solid var(--color-divider);white-space:nowrap}
  .jh-seg button:first-child{border-left:0}
  .jh-seg button[aria-pressed="true"]{background:var(--color-accent-50);color:var(--color-accent);font-weight:var(--w-label)}
  .jh-play{min-width:84px}
  .jh-prog{flex:1 1 140px;height:6px;border-radius:3px;background:var(--color-divider);overflow:hidden;min-width:90px}
  .jh-prog i{display:block;height:100%;width:0;background:var(--st-amber-dot)}
  .jh-note{margin:0;font-size:var(--t-label);color:var(--color-neutral-600)}
  .jh-combo{position:relative;flex:0 1 320px;min-width:min(240px,100%)}
  .jh-combo input{width:100%;box-sizing:border-box;font:inherit;border:1px solid var(--field-line,var(--color-divider));border-radius:var(--radius);height:var(--ctl-h-sm,28px);padding:0 28px 0 30px;background:var(--color-surface);color:var(--color-text)}
  .jh-combo input:focus{outline:none;border-color:var(--color-accent)}
  .jh-combo input.has{border-color:var(--color-accent);font-weight:var(--w-label)}
  .jh-combo-ic{position:absolute;left:9px;top:50%;transform:translateY(-50%);color:var(--color-neutral-600);pointer-events:none}
  .jh-combo-x{position:absolute;right:3px;top:50%;transform:translateY(-50%);border:0;background:none;color:var(--color-neutral-600);font-size:17px;line-height:1;width:22px;height:22px;border-radius:var(--radius);cursor:pointer}
  .jh-combo-x:hover{background:var(--color-neutral-100);color:var(--color-text)}
  .jh-combo-list{position:absolute;z-index:30;left:0;right:0;top:calc(100% + 4px);background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-pop,0 14px 32px -12px rgba(0,0,0,.25));padding:4px;max-height:280px;overflow-y:auto;display:block}
  .jh-combo-list[hidden]{display:none}
  .jh-opt{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:baseline;width:100%;border:0;background:none;text-align:left;padding:7px 9px;border-radius:var(--radius);cursor:pointer;font:inherit;color:var(--color-text)}
  .jh-opt b{font-weight:var(--w-strong);font-variant-numeric:tabular-nums}
  .jh-opt span{color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-opt small{color:var(--color-neutral-600);font-variant-numeric:tabular-nums}
  .jh-opt mark{background:var(--color-accent-50);color:var(--color-accent);border-radius:3px;padding:0 1px}
  .jh-opt.act,.jh-opt:hover{background:var(--color-accent-50)}
  .jh-none{margin:0;padding:8px;color:var(--color-neutral-600);font-size:var(--t-meta)}
  .jh-split{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:var(--s-3);align-items:start}
  @media (max-width:1179px){.jh-split{grid-template-columns:minmax(0,1fr)}}
  .jh-left{display:flex;flex-direction:column;gap:var(--s-3);min-width:0}
  .jh-stage{position:relative;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;min-width:0}
  .jh-stage canvas{display:block;width:100%;height:auto}
  .jh-tip{position:absolute;z-index:5;width:310px;max-width:calc(100% - 16px);background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:12px 14px;box-shadow:var(--shadow-pop,0 14px 34px -12px rgba(0,0,0,.25));font-size:var(--t-meta);pointer-events:none}
  .jh-tip p{margin:6px 0;color:var(--color-neutral-600)}
  .jh-tip-h{display:flex;align-items:center;gap:8px}.jh-tip-h span:last-child{margin-left:auto;color:var(--color-neutral-600);font-size:var(--t-label)}
  .jh-tip dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:6px 0}.jh-tip dt{color:var(--color-neutral-600)}.jh-tip dd{margin:0}
  .jh-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}
  .jh-sum{background:var(--color-neutral-100);border-radius:var(--radius);padding:7px 9px;font-variant-numeric:tabular-nums;font-weight:var(--w-strong);font-size:var(--t-meta)}
  .jh-sum small{display:block;font-weight:var(--w-label);color:var(--color-neutral-600);font-size:11px;margin-bottom:2px}
  .jh-sum span{display:block;font-weight:400;color:var(--color-neutral-600);font-size:11px;margin-top:2px}
  .jh-end{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--color-bg) 70%,transparent)}
  .jh-end[hidden]{display:none}
  .jh-end-card{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:20px 24px;text-align:center;max-width:340px;box-shadow:var(--shadow-pop,0 18px 40px -14px rgba(0,0,0,.25))}
  .jh-end-card h3{font-size:22px;font-weight:var(--w-title);margin:6px 0 2px}
  .jh-end-card p{margin:4px 0 10px;color:var(--color-neutral-600)}
  .jh-end-face{border-radius:50%}
  .jh-feedcard{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:12px 14px}
  .jh-feedcard h4{margin:0 0 6px;font-size:var(--t-meta);font-weight:var(--w-strong)}
  .jh-feed{display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto;font-size:var(--t-label)}
  .jh-feed > div{flex:none;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-feed > div b{color:var(--color-text);font-weight:var(--w-strong)}
  .jh-out{font-size:11px;border-radius:999px;padding:0 6px;border:1px solid currentColor;margin-left:4px}
  .jh-out.is-used{color:var(--st-green-fg)} .jh-out.is-changed{color:var(--st-amber-fg)} .jh-out.is-thrown{color:var(--st-ruby-fg)} .jh-out.is-open{color:var(--color-neutral-600)}
  .jh-panel{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0;overflow:hidden}
  .jh-total{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
  .jh-total b{font-weight:var(--w-title);font-size:28px;line-height:1;font-variant-numeric:tabular-nums}
  .jh-total span{color:var(--color-neutral-600);font-size:var(--t-label);text-align:right}
  .jh-rows{display:flex;flex-direction:column;gap:8px;overflow-y:auto;overscroll-behavior:contain;padding:2px 4px 2px 0;scroll-snap-type:y proximity;max-height:420px}
  .jh-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--radius-lg);cursor:pointer;border:1px solid var(--color-divider);background:var(--color-surface);flex:none;scroll-snap-align:start;text-align:left;font:inherit;color:var(--color-text)}
  .jh-row:hover{border-color:var(--color-accent)}
  .jh-row.on{border-color:var(--color-accent);background:var(--color-accent-50)}
  .jh-row canvas{width:28px;height:28px}
  .jh-row-t{min-width:0;display:flex;flex-direction:column}
  .jh-row-n{font-weight:var(--w-strong);font-size:var(--t-meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-row-d{font-size:11.5px;color:var(--color-neutral-600);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-row-p{font-variant-numeric:tabular-nums;font-weight:var(--w-title)}
  .jh-sc{border-top:1px solid var(--color-divider);padding-top:10px;display:flex;flex-direction:column;gap:8px;flex:none}
  .jh-sc-h{margin:0;font-size:var(--t-meta);font-weight:var(--w-strong);display:flex;justify-content:space-between;gap:8px}
  .jh-mix{display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--color-divider)}
  .jh-mix i{display:block;height:100%}
  .jh-mix .u,.jh-legend .u,.jh-sw.u{background:var(--st-green-dot)} .jh-mix .c,.jh-legend .c,.jh-sw.c{background:var(--st-amber-dot)} .jh-mix .t,.jh-legend .t,.jh-sw.t{background:var(--st-ruby-dot)}
  .jh-legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:var(--color-neutral-600)}
  .jh-legend b{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}
  .jh-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .jh-kpis > div{background:var(--color-neutral-100);border-radius:var(--radius);padding:7px 9px;min-width:0}
  .jh-kpis small{display:block;color:var(--color-neutral-600);font-size:11px}
  .jh-kpis b{font-size:15px;font-variant-numeric:tabular-nums}
  .jh-tw{overflow-x:auto;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg)}
  .jh-table{width:100%;border-collapse:collapse;font-size:var(--t-meta)}
  .jh-table th,.jh-table td{text-align:left;padding:9px 12px;border-bottom:1px solid var(--color-divider);vertical-align:top}
  .jh-table th{font-weight:var(--w-label);color:var(--color-neutral-600);font-size:var(--t-label);white-space:nowrap}
  .jh-table tr:last-child td{border-bottom:0}
  .jh-table .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
  .jh-lvl{font-size:var(--t-label);border-radius:999px;padding:1px 8px;background:var(--color-accent-50);color:var(--color-accent);white-space:nowrap}
  .jh-rule{background:var(--color-accent-50);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:14px 16px;font-size:15px}
  .jh-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
  .jh-card{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:12px 14px}
  .jh-card h3{margin:0 0 4px;font-size:var(--t-body);font-weight:var(--w-strong)}
  .jh-card p{margin:0;color:var(--color-neutral-600);font-size:var(--t-meta)}
  .jh-out-card{display:flex;gap:10px}.jh-sw{flex:none;width:10px;border-radius:3px}
  .jh-example ul{margin:6px 0;padding-left:18px;color:var(--color-neutral-600)}
  .jh-big{font-size:17px;font-weight:var(--w-title);color:var(--color-accent);margin-top:8px!important}
  .jh-sec{font-size:16px;font-weight:var(--w-title);margin:6px 0 0}
`;

/* The menu's face for Jambo's agents takes its picture at load. */
try { if (typeof jamboFacePaint === 'function') jamboFacePaint(); } catch (_) {}

Object.assign(window, { AG_POINTS_LAUNCH, AG_POINTS_START_MINS, AG_POINTS_NEW_MINS, AG_POINTS_FIELDS, agPointsKeys, agPointsStart, agPointsCompany, agPointsMine, agPointsOf,
  agPointsIsNew, agPointsEach, agPointsTally, agPointsSumLine, agPieceSay, agPointsTableHtml, agPointsWire, renderJamboHouse, jhRepaint, jhPlace, jhPlacePut, jhLayout, jhRoomAt });
