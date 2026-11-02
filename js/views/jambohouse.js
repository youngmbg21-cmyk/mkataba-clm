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
/* A TYPED PERIOD (owner, 13 Oct 2026): any whole number of days up to the
   ledger's own reach — the server's AGENT_PIECES_DAYS_MAX says the same 120. */
const JH_DAYS_MAX = 120;
/* THE LOOK IS A PERSON'S DEFAULT (owner, 13 Oct 2026): one dropdown; the
   choice is kept in their own preferences (PUT /api/me/prefs agentsLook), so it
   follows them to any computer and the house opens on it next time. Without a
   server (static mode) the browser's place store keeps it instead. */
const JH_LOOKS = ['plan', 'drawing'];
function jhLookPref(){ try { const v = window.REMOTE && REMOTE.me && REMOTE.me.prefs && REMOTE.me.prefs.agentsLook; const i = JH_LOOKS.indexOf(v); return i < 0 ? null : i; } catch (_) { return null; } }
const jhServerKeeps = () => typeof API_MODE === 'function' && API_MODE() && typeof api === 'function';
const jhDaysOk = d => Number.isInteger(d) && d >= 1 && d <= JH_DAYS_MAX;
const jhRangeLabel = r => JH_RANGES.includes(r) ? _jhT('jh_r_' + r) : _jhTn('jh_r_days', r, { n: r });
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
/* EACH AGENT'S COLOUR, READ ONCE FOR EVERY DRAWING (round 23; the owner's
   answer (18), 19 Oct 2026, "Fold to one line"): the Board's Jambo's work card
   tags each folded piece with its room's colour, as the drawing does, from
   this table — so a piece and its room are one colour. A new agent takes its
   spare in JH_ORDER's turn, as the house gives it. */
function jhAgentColour(k){
  if (JH_LOOK[k]) return JH_LOOK[k][0];
  const extra = JH_ORDER.filter(x => !JH_LOOK[x]).indexOf(k);
  return extra >= 0 ? JH_SPARE[extra % JH_SPARE.length][0] : '';
}

const _jhE = s => (typeof esc === 'function') ? esc(s)
  : String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const _jhT = (k, v) => (typeof i18t === 'function') ? i18t(k, v || {}) : String(k);
const _jhTn = (k, n, v) => (typeof i18tn === 'function') ? i18tn(k, n, v || {}) : String(n);
/* Hours said in words that agree with their number (owner, 13 Oct 2026: no
   "1 hours"): one decimal under an hour (or when asked), whole hours above;
   exactly 1 is singular in both books. */
function jhHoursWords(hrs, digits){
  const h = Math.max(0, Number(hrs) || 0), d = digits != null ? digits : (h < 1 ? 1 : 0), n = +h.toFixed(d);
  let shown = String(n);
  try { shown = n.toLocaleString((typeof langLocale === 'function') ? langLocale() : undefined, { minimumFractionDigits: d, maximumFractionDigits: d }); } catch (_) {}
  return _jhTn('jh_hrs', n, { n: n === 1 ? '1' : shown });
}
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
const _jh = { log: [], ptab: 'log', tab: 'house', range: 30, look: 0, speed: 1, one: '', sel: null, data: null, loading: false, t: 1, playing: false, last: 0, raf: 0, pops: [], trails: [], lastPos: [], hover: null, fed: [] };
function jhPlace(){ const p = { tab: _jh.tab, range: _jh.range, speed: _jh.speed }; if (!jhServerKeeps()) p.look = _jh.look; return p; }
function jhPlacePut(p){
  if (!p || typeof p !== 'object') return;
  if (JH_TABS.includes(p.tab) || p.tab === 'agents') _jh.tab = p.tab;
  if (jhDaysOk(Number(p.range))) _jh.range = Number(p.range);
  if ((p.look === 0 || p.look === 1) && !jhServerKeeps()) _jh.look = p.look;
  if (JH_SPEEDS.includes(Number(p.speed))) _jh.speed = Number(p.speed);
}
const jhRangeWords = () => _jh.range === 1 ? _jhT('jh_r_1') : _jhT('jh_last_n', { r: jhRangeLabel(_jh.range) });

/* jhFetch reads a period without touching the page; jhLoad keeps it as the page's. */
/* NOT BEFORE SIGN-IN, AND A REFUSAL IS NOT AN ANSWER (owner, 13 Oct 2026: "Fix
   the Not signed in message"): with a server and nobody signed in yet the read
   is not sent at all (null = not yet); a read that failed is kept only to say
   so, and the next drawing of the page asks again (renderJamboHouse). */
const jhSignedIn = () => { try { return !!(window.REMOTE && REMOTE.me); } catch (_) { return false; } };
async function jhFetch(days){
  if (!(typeof API_MODE === 'function' && API_MODE()) || typeof api !== 'function') return { pieces: [], contracts: {}, static: true, days };
  if (!jhSignedIn()) return null;
  /* The four reading agents report what they laid out (agReportPrepared) —
     asked here so the house shows it, waited for a moment, never blocked on. */
  try { if (typeof agentsData === 'function') agentsData();
    const st = (typeof agentsStatus === 'function' && !agentsStatus() && typeof agentsStatusLoad === 'function') ? agentsStatusLoad() : null;
    await Promise.race([Promise.all([typeof agPreparedSettled === 'function' ? agPreparedSettled() : null, st]), new Promise(r => setTimeout(r, 1500))]); } catch (_) {}
  try { const r = await api('agents/pieces?days=' + days); return { pieces: (r && r.pieces) || [], contracts: (r && r.contracts) || {}, cut: !!(r && r.cut), max: r && r.max, days, from: r && r.from }; }
  catch (e){ return { pieces: [], contracts: {}, error: (e && e.message) || String(e), days }; }
}
async function jhLoad(){
  if (_jh.loading) return;
  _jh.loading = true;
  try { const d = await jhFetch(_jh.range); if (d) _jh.data = d; } finally { _jh.loading = false; }
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
/* ONE AGENT AT A TIME (owner picked "press the card, and Play follows it",
   13 Oct 2026): while an agent's card is pressed, a replay plays that agent's
   work alone — the other rooms stay quiet (nothing counted, nobody walking)
   until the replay ends; at rest every room shows its whole period again. */
const jhSoloQuiet = k => !!_jh.sel && k !== _jh.sel && _jh.t < 1;
const jhUptoFor = (k, upto) => jhSoloQuiet(k) ? 0 : upto;

/* ---------------- THE HOUSE: drawn from the list ---------------- */
/* THE HOUSE FITS THE SCREEN AND IS DRAWN SHARP (owner, 13 Oct 2026: "the
   graphic is too big on screen … both grainy and not fit for release"). The
   drawing keeps one logical width (JH_W) but its floors shrink to fit the
   window (_jhFH between JH_FH_MIN and JH_FH_MAX), and the canvas is sized to
   its real on-screen box times the screen's pixel density (jhFitCanvas), so
   nothing is stretched.
   THE HOUSE NEVER SCROLLS (owner, 13 Oct 2026: "do not put the graphic on
   scroll"): where three rooms a floor would make the floors shorter than
   JH_FH_MIN, the house takes four rooms a floor (fewer floors, still no free
   room); short of that the floors shrink to JH_FH_HARD and the page, not the
   house, takes the rest. */
const JH_FH_MAX = 132, JH_FH_MIN = 92, JH_FH_HARD = 68, JH_FIT_FOOT = 16, JH_FIT_MIN_CSS = 300;
let _jhFH = JH_FH_MAX, _jhFitH = 0;
const JH_W = 1160, JH_COLS = 3, JH_COLS_MAX = 4, JH_SX = 160, JH_RX0 = 206, JH_RX1 = 1144, JH_GAP = 12;
/* THE HOUSE FILLS ITS PAGE, NEVER GROWS (round 23's gaps, 19 Oct 2026: as drawn,
   the house runs from the page's left edge to Jambo's folded strip, where it was
   held at 1200px and centred). Past JH_K_MAX the drawing is not scaled up — its
   floors would shrink to fit the window's height until words met (the reason
   for the old 1200px) — it is drawn WIDER instead: _jhW, the logical width,
   grows with the stage and every room's card with it, at today's size. */
const JH_K_MAX = .75;
let _jhW = JH_W;
const jhRX1 = () => _jhW - (JH_W - JH_RX1);
let _jhTop = 70, _jhF = 1, _jhH = 620, _jhRooms = [], _jhCols = JH_COLS;
/* JAMBO'S OFFICE (owner, 13 Oct 2026: "make the house an office where all the
   agents have offices and your desk is the big office at the top floor. They
   then go through the different rooms like contract vault and directory plus
   to your desk … we also need to see the accumulated paper"). The house keeps
   its floors, stairs, cards and two looks; it becomes an office block:
     · the two lowest floors hold the SHARED ROOMS every agent uses — reception
       (where the four readings sit: they are not agents, so no Jambo), the
       contract vault, the directory, the spending limits, the Jambo engine and
       the mail depot (JH_SHARED_FLOORS);
     · above them every real agent has an office, as evenly as the floors take
       them (jhFloorCounts — NO FREE ROOM still holds);
     · YOUR DESK is the big office across the top floor, one tray per agent.
   Each floor's corridor is the track and the stairs join them (jhCorr). */
const JH_SHARED_FLOORS = [['reception', 'vault', 'people'], ['money', 'jambo', 'mail']];
let _jhShared = [], _jhDesk = null;
const jhIsReading = k => typeof AG_READINGS !== 'undefined' && Array.isArray(AG_READINGS) && AG_READINGS.includes(k);
const jhLY = f => _jhTop + (_jhF - f) * _jhFH;
const jhFoot = f => jhLY(f) - 18;
const jhCorr = f => jhLY(f) - 13;
function jhLayout(){
  const keys = agPointsKeys(), offices = keys.filter(k => !jhIsReading(k)), reads = keys.filter(k => jhIsReading(k));
  _jhTop = _jh.look === 1 ? 128 : 70;
  /* the drawing's foot holds its ground line and the measuring line only —
     its title block is gone (owner, 13 Oct 2026: "remove this part") */
  const foot = _jh.look === 1 ? 48 : 16, SH = JH_SHARED_FLOORS.length;
  const floorsFor = cols => SH + Math.ceil(offices.length / cols) + 1;
  const fhFor = cols => Math.floor((_jhFitH - _jhTop - foot) / floorsFor(cols));
  /* AS DRAWN (round 23's gaps, second pass, 18 Oct 2026: "three and four rooms
     to a floor"): more offices than two floors of three hold stand four and
     three — five floors in all — so every room keeps its three lines with
     its agent clear of them; a short window still takes four a floor */
  _jhCols = offices.length > JH_COLS * 2 ? JH_COLS_MAX : JH_COLS;
  if (_jhFitH && fhFor(_jhCols) < JH_FH_MIN && offices.length > _jhCols) _jhCols = JH_COLS_MAX;
  _jhF = floorsFor(_jhCols);
  _jhFH = _jhFitH ? Math.max(JH_FH_HARD, Math.min(JH_FH_MAX, fhFor(_jhCols))) : JH_FH_MAX;
  _jhH = _jhTop + _jhF * _jhFH + foot;
  const cardOf = (f, c, n) => { const w = (jhRX1() - JH_RX0 - JH_GAP * (n - 1)) / n, x = JH_RX0 + c * (w + JH_GAP);
    return { x, y: jhLY(f) - _jhFH + 8, w, h: _jhFH - 34 }; };
  _jhShared = [];
  JH_SHARED_FLOORS.forEach((ids, f) => ids.forEach((id, c) => _jhShared.push({ id, f, card: cardOf(f, c, ids.length) })));
  _jhDesk = { id: 'desk', f: _jhF - 1, card: cardOf(_jhF - 1, 0, 1) };
  let spare = 0, i = 0;
  _jhRooms = [];
  const lookOf = k => JH_LOOK[k] || JH_SPARE[spare++ % JH_SPARE.length];
  jhFloorCounts(offices.length).forEach((n, fi) => { const f = SH + fi;
    for (let c = 0; c < n; c++, i++){ const k = offices[i], look = lookOf(k), card = cardOf(f, c, n);
      _jhRooms.push({ k, i, f, col: look[0], hat: look[1], card, cx: card.x + card.w / 2, seat: jhCompact(card) ? { x: card.x + 20, y: card.y + card.h / 2 + 12 } : { x: card.x + 30, y: card.y + card.h - 4 } }); } });
  /* the readings: a place each at reception's desk, a magnifying glass, no Jambo */
  const rc = _jhShared.find(s => s.id === 'reception').card, cw = (rc.w - 24) / 2;
  const rTop = jhCompact(rc) ? 24 : 36, rGap = jhCompact(rc) ? Math.max(11, Math.min(16, (rc.h - 26) / 2)) : Math.max(14, Math.min(20, (rc.h - 44) / 2));
  reads.forEach((k, j) => { const look = lookOf(k), x = rc.x + 12 + (j % 2) * cw, y = rc.y + rTop + Math.floor(j / 2) * rGap;
    _jhRooms.push({ k, i: i++, f: 0, col: look[0], hat: look[1], reading: true, card: { x, y: y - 9, w: cw - 6, h: 18 }, cx: x + 12, seat: { x: x + 12, y: y + 6 } }); });
  /* one tray per agent on your desk, in the house's order */
  const d = _jhDesk.card, tw = (d.w - 40) / Math.max(1, _jhRooms.length);
  _jhDesk.trays = {}; _jhRooms.forEach((r, j) => { _jhDesk.trays[r.k] = { x: d.x + 20 + tw * j + tw / 2, w: tw }; });
}
function jhFloorCounts(n, cols){ const F = Math.max(1, Math.ceil(n / (cols || _jhCols))), base = Math.floor(n / F), extra = n % F;
  return Array.from({ length: F }, (_, f) => base + (f < extra ? 1 : 0)); }
/* A SHORT FLOOR GETS A COMPACT CARD (owner, 13 Oct 2026: "why are the images
   distorted in my laptop but okay in my ipad?"): a laptop's window is shorter,
   the floors shrink to fit, and a card under 60 high has room for one or two
   lines only — so it draws only what fits: the name and points, the seat beside
   them, a pile no taller than the card, your desk's title in the floor column. */
const jhCompact = c => !!c && c.h < 60;
/* NOTHING RUNS INTO ITS NEIGHBOUR: a name shrinks to the room it has (never below 8), a line too long ends in an ellipsis */
function jhFitFont(ctx, txt, maxW, fontOf, size, min){ let fs = size; ctx.font = fontOf(fs); while (fs > (min || 8) && ctx.measureText(txt).width > maxW){ fs -= .5; ctx.font = fontOf(fs); } return fs; }
function jhClip(ctx, txt, maxW){ if (ctx.measureText(txt).width <= maxW) return txt; let t = String(txt); while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1); return t + '…'; }
const jhPileMax = (room, cap) => Math.max(0, Math.min(cap, Math.floor(room / 2.2)));
const jhFloorRooms = f => _jhRooms.filter(r => r.f === f && !r.reading);
const jhFloorCards = f => [..._jhShared.filter(s => s.f === f).map(s => s.card), ...jhFloorRooms(f).map(r => r.card), ...(_jhDesk && _jhDesk.f === f ? [_jhDesk.card] : [])].sort((a, b) => a.x - b.x);
/* The canvas's own box: as wide as the stage, as tall as the window leaves
   below it, at the screen's pixel density. Lays the house out again for it. */
function jhFitCanvas(){
  const cv = document.getElementById('jh-cv'), stage = document.getElementById('jh-stage');
  if (!cv || !stage) return false;
  const cssW = stage.clientWidth || JH_W, k = Math.min(cssW / JH_W, JH_K_MAX);
  _jhW = Math.max(JH_W, Math.round(cssW / k));
  let top = stage.getBoundingClientRect().top;
  for (let p = stage.parentElement; p; p = p.parentElement) top += p.scrollTop || 0;
  const avail = Math.max(JH_FIT_MIN_CSS, (window.innerHeight || 900) - top - JH_FIT_FOOT);
  _jhFitH = avail / k;
  jhLayout(); _jhRooms.forEach(jhSimulate);
  const cssH = Math.round(_jhH * k), dpr = Math.max(1, Math.min(3, window.devicePixelRatio || 1));
  const bw = Math.round(cssW * dpr), bh = Math.round(cssH * dpr);
  if (cv.width !== bw) cv.width = bw;
  if (cv.height !== bh) cv.height = bh;
  cv.style.height = cssH + 'px';
  return true;
}
/* A new window size or zoom fits and redraws the house where it stands. */
let _jhFitW = 0;
function jhRefit(force){
  if (typeof state === 'undefined' || state.view !== 'jambo' || _jh.tab !== 'house') return;
  const stage = document.getElementById('jh-stage'); if (!stage) return;
  const w = stage.clientWidth; if (!force && w === _jhFitW && !_jhRefitWin) return;
  _jhFitW = w; _jhRefitWin = false;
  if (jhFitCanvas()){ jhFitPanel(); jhFrame(typeof performance !== 'undefined' ? performance.now() : 0); }
}
let _jhRefitWin = false;
if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', () => { _jhRefitWin = true; jhRefit(); });
const jhGeom = () => ({ top: _jhTop, fh: _jhFH, floors: _jhF, h: _jhH, w: _jhW, cols: _jhCols });
/* EACH JAMBO MOVES ONLY FOR REAL WORK (owner picked C, 13 Oct 2026), NOW AS A
   TRIP THROUGH THE OFFICE (owner, 13 Oct 2026). At each moment his agent
   prepared a piece he leaves his office carrying the paper, walks the
   corridor and the stairs through the rooms THAT AGENT REALLY USES (JH_ROUTE,
   read off what its code does: the renewals office reads the contract in the
   vault, finds the owner in the directory, checks the spending limits and
   asks the Jambo engine for the memo), lays the paper in its tray on your
   desk at the moment the piece was prepared, and walks back. An agent with no
   work stays in his office. The moments come from the pieces on screen
   (`jhPieces`: the period, the typed contract), read once per data, contract
   and period. A person's decision is a pop in his office, not a trip. */
const JH_ROUTE = { renew: ['vault', 'people', 'money', 'jambo'], late: ['vault', 'people', 'mail'], ours: ['vault', 'people', 'mail'],
  link: ['vault', 'people', 'mail'], round: ['vault', 'jambo'], paper: ['vault', 'money', 'jambo'], import: ['vault', 'jambo'],
  approve: ['vault'], request: ['vault'], week: ['vault'], quiet: ['vault'] };
const jhRouteOf = k => JH_ROUTE[k] || ['vault'];
/* A CALM WALK (owner, 13 Oct 2026: "the agents are running at lightning speed
   and taking crooked lines"): a Jambo walks at one steady pace along the
   corridors and stairs — right angles only — and stops a moment in every room.
   He is one person: while he is out, the work that comes up waits for his next
   trip, and work that comes up before he reaches your desk joins the paper he
   is already carrying (`jhTripsOf`). */
const JH_WALK = 480, JH_STOP_S = 0.7, JH_TRIP_GAP = 0.5;
function jhSimulate(r){ r._ev = null; r._trips = null; r.trip = jhTripOf(r); }
function jhVisitSpot(s, r){
  const c = s.card, q = 0.28 + 0.5 * ((r.i * 3) % 7) / 6;
  return { x: c.x + c.w * q, y: c.y + c.h - 4 };
}
function jhTripOf(r){
  const pts = [], stopAt = [];
  let cur = { x: r.seat.x, y: r.seat.y }, curF = r.f;
  pts.push(cur);
  const add = p => { const l = pts[pts.length - 1]; if (Math.abs(l.x - p.x) > .5 || Math.abs(l.y - p.y) > .5) pts.push(p); };
  const go = (to, f, stop) => { const a = jhCorr(curF), b = jhCorr(f);
    add({ x: cur.x, y: a }); if (curF !== f){ add({ x: JH_SX, y: a }); add({ x: JH_SX, y: b }); }
    add({ x: to.x, y: b }); add({ x: to.x, y: to.y }); if (stop) stopAt.push({ i: pts.length - 1, id: stop }); cur = to; curF = f; };
  jhRouteOf(r.k).forEach(id => { const s = _jhShared.find(x => x.id === id); if (s) go(jhVisitSpot(s, r), s.f, id); });
  if (_jhDesk && _jhDesk.trays[r.k]) go({ x: _jhDesk.trays[r.k].x, y: _jhDesk.card.y + _jhDesk.card.h - 4 }, _jhDesk.f, 'desk');
  go({ x: r.seat.x, y: r.seat.y }, r.f, null);
  /* the timeline: a walk between every two points at one pace, a stop at every room */
  const seq = []; let t = 0;
  for (let j = 1; j < pts.length; j++){ const d = Math.hypot(pts[j].x - pts[j - 1].x, pts[j].y - pts[j - 1].y) / JH_WALK;
    if (d > 0){ seq.push({ t0: t, t1: t + d, a: pts[j - 1], b: pts[j], kind: 'walk', j }); t += d; }
    stopAt.filter(x => x.i === j).forEach(st => { seq.push({ t0: t, t1: t + JH_STOP_S, a: pts[j], b: pts[j], kind: 'work', stop: st.id, j }); t += JH_STOP_S; }); }
  const stopT = {}, stops = []; seq.forEach(x => { if (x.stop && stopT[x.stop] == null){ stopT[x.stop] = x.t0; stops.push(x.stop); } });
  return { pts, seq, T: t, stopT, stops, tDesk: stopT.desk != null ? stopT.desk : t / 2 };
}
/* the moments this agent prepared a piece, with the piece, in replay seconds */
function jhEventsOf(r){
  const key = (_jh.data || null), one = _jh.one, range = _jh.range;
  if (r._ev && r._evData === key && r._evOne === one && r._evRange === range) return r._ev;
  const S = jhSpan(), total = JH_DURATION_MS / 1000, ev = [];
  for (const p of jhPieces()){
    if (p.agent !== r.k) continue;
    const t = Date.parse(p.at || ''); if (!t || t < S.from || t > S.end) continue;
    ev.push({ t: (t - S.from) / (S.end - S.from) * total, p });
  }
  ev.sort((a, b) => a.t - b.t);
  r._ev = ev; r._evData = key; r._evOne = one; r._evRange = range; r._trips = null;
  return ev;
}
/* his trips: one at a time; a piece that comes up before he reaches the desk rides with him */
function jhTripsOf(r){
  const ev = jhEventsOf(r);
  if (r._trips && r._tripsOf === ev) return r._trips;
  const tr = r.trip || (r.trip = jhTripOf(r)), out = [];
  for (const e of ev){
    const cur = out[out.length - 1];
    if (cur && e.t <= cur.start + tr.tDesk){ cur.pieces.push(e.p); continue; }
    const start = Math.max(e.t - tr.tDesk, cur ? cur.start + tr.T + JH_TRIP_GAP : -Infinity);
    out.push({ start, pieces: [e.p] });
  }
  r._trips = out; r._tripsOf = ev;
  return out;
}
const jhIdle = r => ({ x: r.seat.x, y: r.seat.y, kind: 'idle', k: 0 });
function jhPosAt(r, tt){
  const s = tt * JH_DURATION_MS / 1000, tr = r.trip || (r.trip = jhTripOf(r));
  for (const trip of jhTripsOf(r)){
    const q = s - trip.start;
    if (q < 0 || q > tr.T) continue;
    const x = tr.seq.find(z => q >= z.t0 && q <= z.t1) || tr.seq[tr.seq.length - 1];
    const k = x.t1 > x.t0 ? (q - x.t0) / (x.t1 - x.t0) : 1;
    return { x: x.a.x + (x.b.x - x.a.x) * k, y: x.a.y + (x.b.y - x.a.y) * k, kind: x.kind, k, stop: x.stop || null, carrying: q < tr.tDesk + JH_STOP_S * .6, j: x.j, n: trip.pieces.length, trip };
  }
  return jhIdle(r);
}
/* THE PAPER THAT CAME THROUGH A ROOM by the replay's moment: every sheet his
   trips have brought there so far (read from the same trips, so the pile and
   the Jambos never disagree). At rest it is the whole period's. */
function jhSheetsIn(id, tt){
  const s = tt * JH_DURATION_MS / 1000; let n = 0;
  for (const r of _jhRooms){ if (jhSoloQuiet(r.k)) continue; const tr = r.trip; if (!tr || tr.stopT[id] == null) continue;
    for (const trip of jhTripsOf(r)) if (trip.start + tr.stopT[id] <= s) n += trip.pieces.length; }
  return n;
}
/* THE WORK LOG (owner, 13 Oct 2026, from the mock-up: "it is missing the log
   panel"): every step of every trip as the replay reaches it. A line says who,
   what he did there and on which contract, stamped with the moment that piece
   was really prepared (the walk is drawn out so it can be watched; the work
   itself took seconds). */
function jhLogWords(r, id, trip){
  const c = trip.pieces[0] && trip.pieces[0].cid && _jh.data && _jh.data.contracts && _jh.data.contracts[trip.pieces[0].cid];
  const ref = c && c.no ? c.no : _jhT('jh_log_the_contract'), n = trip.pieces.length;
  if (id === 'vault') return _jhT('jh_log_vault', { ref });
  if (id === 'jambo') return _jhT('jh_log_jambo', { job: _jhT(['renew', 'paper', 'round', 'import'].includes(r.k) ? 'jh_log_job_' + r.k : 'jh_log_job') });
  if (id === 'desk') return _jhTn('jh_log_desk', n, { n: _jhFmt(n) });
  return _jhT('jh_log_' + id);
}
function jhLogStep(s0, s1){
  if (s1 <= s0) return;
  const S = jhSpan(), total = JH_DURATION_MS / 1000, rows = [];
  for (const r of _jhRooms){ if (_jh.sel && r.k !== _jh.sel) continue; const tr = r.trip; if (!tr) continue;
    for (const trip of jhTripsOf(r)) for (const id of tr.stops){ const at = trip.start + tr.stopT[id];
      if (at > s0 && at <= s1) rows.push({ at, r, id, trip }); } }
  rows.sort((a, b) => a.at - b.at).forEach(x => { _jh.log.unshift({ when: Date.parse((x.trip.pieces[0] || {}).at || '') || S.from + Math.max(0, x.at) / total * (S.end - S.from), k: x.r.k, col: x.r.col, reading: !!x.r.reading, words: jhLogWords(x.r, x.id, x.trip) }); });
  if (rows.length){ _jh.log.length = Math.min(_jh.log.length, 60); jhLogPaint(); }
}
function jhLogWhen(ms){
  try { const d = new Date(ms), loc = (typeof langLocale === 'function') ? langLocale() : undefined;
    return _jh.range === 1 ? d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString(loc, { weekday: 'short', day: 'numeric', month: 'short' }) + ' · ' + d.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit' }); }
  catch (_) { return ''; }
}
function jhLogPaint(){
  const box = document.getElementById('jh-log'); if (!box) return;
  box.innerHTML = _jh.log.length ? _jh.log.map(l => `<div class="jh-log-l"><span class="jh-log-t">${_jhE(jhLogWhen(l.when))}</span><span><i class="jh-dot" style="background:${l.col}"></i><b>${_jhE(_jhT('jh_room_' + l.k))}</b>${l.reading ? ` <span class="jh-log-rd">${_jhE(_jhT('jh_log_reading'))}</span>` : ''} ${_jhE(l.words)}</span></div>`).join('')
    : `<p class="jh-none">${_jhE(_jhT('jh_log_none'))}</p>`;
}
/* The colours from the page's own tokens, read when the house is drawn. */
const _jhC = {};
function jhColors(){
  try {
    const s = getComputedStyle(document.documentElement), g = n => s.getPropertyValue(n).trim();
    Object.assign(_jhC, { card: g('--color-surface') || '#fff', fg: g('--color-text') || '#111', muted: g('--color-neutral-600') || '#667', line: g('--color-divider') || '#dde',
      soft: g('--color-neutral-100') || '#f5f6f8', accent: g('--color-accent') || '#264c9e', accentSoft: g('--color-accent-50') || '#eef2fb', amber: g('--st-amber-fg') || '#b45309',
      ruby: g('--st-ruby-fg') || '#b42318', ok: g('--st-green-fg') || '#15803d', gold: g('--st-amber-dot') || '#d99a18' });
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
/* WORK WAITING ON A PERSON, IN ITS ROOM (owner picked B, 13 Oct 2026): what
   Jambo prepared and nobody has used, changed or thrown away yet, as of the
   replay's moment, is a small stack of papers in the room's lower corner with
   its count. It scores nothing (agPointsTally's `open`); the points come when
   a person acts. Drawn under the runners, so a Jambo walks in front of it. */
/* A ROOM SAYS WHY IT IS QUIET, AND HOW ITS AGENT IS SET (owner picked E,
   13 Oct 2026). With no work in the whole period the sub-line gives the
   reason — switched off, left to you, or nothing came up — instead of "0";
   the agent's setting stands in small type in the room's lower left (Ask me
   first · Do it for me · Leave it to me · Reads only · Switched off), read off
   the status the agents' page already loads (agentsStatus). */
function jhAgentOff(k){ try { const s = (typeof agentsStatus === 'function') ? agentsStatus() : null; const a = s && s.agents && s.agents[k]; return !!(a && a.on === false); } catch (_) { return false; } }
/* "1 approval laid out", never "1 approvals" (owner, 13 Oct 2026): the
   count and its unit agree, through the plural keys jh_unit_<agent>_one/_other
   (the plain jh_unit_<agent> keys are inert). */
function jhUnitWords(k, n){ return n + ' ' + _jhTn('jh_unit_' + k, n, { n }); }
function jhRoomQuietWhy(k){
  if (jhAgentOff(k)) return _jhT('jh_zero_off');
  const reads = typeof AG_READINGS !== 'undefined' && Array.isArray(AG_READINGS) && AG_READINGS.includes(k);
  if (!reads && typeof agLevelOf === 'function' && agLevelOf(k) === 'mine') return _jhT('jh_zero_mine');
  return _jhT('jh_zero_none');
}
function jhRoomSub(r, s, pieces, mono){
  const all = agPointsTally(r.k, pieces, Infinity);
  const tail = all.n ? (mono ? String(s.n) : jhUnitWords(r.k, s.n)) : jhRoomQuietWhy(r.k);
  return _jhT('ag_' + r.k) + ' · ' + tail;
}
function jhRoomStateWords(k){ return jhAgentOff(k) ? _jhT('jh_state_off') : jhLevelWords(k); }
function jhRoomState(ctx, r, mono){
  const C = _jhC, c = r.card, w = jhRoomStateWords(r.k);
  ctx.save(); ctx.textAlign = 'left'; ctx.fillStyle = C.muted; ctx.globalAlpha = .85;
  ctx.font = mono ? '500 10.5px ' + JH_MONO : '500 11.5px Geist, sans-serif';
  ctx.fillText(mono ? w.toUpperCase() : w, c.x + (mono ? 6 : 12), c.y + c.h - 10);
  ctx.restore();
}
function jhWaitStack(ctx, r, n, mono){
  if (!(n > 0)) return;
  const C = _jhC, c = r.card, x1 = c.x + c.w - 12, y1 = c.y + c.h - 8, sw = 10, sh = 12, k = Math.min(3, n);
  ctx.save();
  for (let i = k - 1; i >= 0; i--){ const x = x1 - sw - i * 3, y = y1 - sh - i * 3;
    ctx.fillStyle = C.card; ctx.strokeStyle = r.col; ctx.lineWidth = 1.2; ctx.fillRect(x, y, sw, sh); ctx.strokeRect(x + .5, y + .5, sw - 1, sh - 1); }
  ctx.textAlign = 'right'; ctx.fillStyle = C.muted; ctx.font = mono ? '500 11px ' + JH_MONO : '500 12px Geist, sans-serif';
  const w = mono ? _jhT('jh_waiting_n', { n }).toUpperCase() : _jhT('jh_waiting_n', { n });
  ctx.fillText(w, x1 - sw - (k - 1) * 3 - 6, y1 - 2);
  ctx.restore();
}
/* "5 WAITING FOR YOU" IS JAMBO'S WORK'S OWN COUNT, AND A DOOR TO IT (round
   23's gaps, 18 Oct 2026 — the drawing: Your desk "5 waiting for you" equals
   Home's "5 prepared"; a room's "1 waiting for you" is its piece). At rest
   (the whole book, not one typed contract) the desk, its trays and every room
   read counterWorkByAgent — the pieces the Board's Jambo's work card lists,
   so the approvals desk (never on that card) waits for nobody here either;
   while a replay plays, the trays fill as the period's own record did. The
   words are drawn as links: their boxes are kept (_jhLinks) for the press
   and the pointer, and a press LANDS ON the Board's card (LAND ON IT, owner
   18 Oct 2026: "it should take you to the jambos work card in the board") —
   that agent's work below it where a room was pressed (hbOpenAgent). */
function jhWaitNow(){ try { return (typeof counterWorkByAgent === 'function') ? counterWorkByAgent() : null; } catch (_) { return null; } }
let _jhLinks = [];
function jhLinkText(ctx, txt, x, y, col, k){
  const w = ctx.measureText(txt).width, a = ctx.textAlign, x0 = a === 'right' ? x - w : a === 'center' ? x - w / 2 : x;
  ctx.fillStyle = col; ctx.fillText(txt, x, y);
  if (_jh.hover === 'wait:' + k) ctx.fillRect(x0, y + 2.5, w, 1.2);
  if (ctx.canvas && ctx.canvas.id === 'jh-cv') _jhLinks.push({ k, x: x0 - 2, y: y - 14, w: w + 4, h: 19 });
}
function jhLinkAt(x, y){ for (const l of _jhLinks) if (x >= l.x && x <= l.x + l.w && y >= l.y && y <= l.y + l.h) return l.k; return null; }
/* THE OFFICE, IN THE HOUSE'S TWO LOOKS (Floor plan: Geist on cards; Architect's
   drawing: section A–A in ink and IBM Plex Mono). One drawing for both, so the
   two never place a room differently — only the clothes differ. */
const JH_MONO = '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
let _jhPileLog = null;
function jhPile(ctx, x, y, n, col, max){
  const m = Math.min(max == null ? 18 : max, n);
  if (_jhPileLog && m > 0) _jhPileLog.push({ x: x - 11, y: y - (m - 1) * 2.2 - 1, w: 22, h: (m - 1) * 2.2 + 3.6 });
  for (let i = 0; i < m; i++){ const j = ((i * 37) % 7 - 3) * .35; ctx.fillStyle = i % 2 ? '#F6F7FA' : '#FDFDFB'; ctx.strokeStyle = 'rgba(15,26,51,.28)'; ctx.lineWidth = .7;
    ctx.fillRect(x - 11 + j, y - i * 2.2, 22, 2.6); ctx.strokeRect(x - 11 + j, y - i * 2.2, 22, 2.6); }
  if (n > 0 && col){ ctx.fillStyle = col; ctx.fillRect(x - 11, y - (m - 1) * 2.2 - 1, 5, 3); }
}
function jhDrawOffice(ctx, pieces, upto, mono){
  const C = _jhC, ink = C.accent, font = (w, s) => mono ? `${w} ${s}px ${JH_MONO}` : `${w} ${s}px Geist, sans-serif`, up = t => mono ? String(t).toUpperCase() : t;
  const topY = jhLY(_jhF - 1) - _jhFH, bot = jhLY(0), X0 = 120, X1 = _jhW - 8, mid = (X0 + X1) / 2, tt = _jh.t;
  const pos = _jh.pos || [];
  /* a house narrowed to one contract keeps that contract's own record */
  const W = upto === Infinity && !_jh.one ? jhWaitNow() : null;
  if (ctx.canvas && ctx.canvas.id === 'jh-cv') _jhLinks = [];
  let deskTot = 0; const deskOpen = {}; _jhRooms.forEach(r => { deskOpen[r.k] = W ? (W.by[r.k] || 0) : (agPointsTally(r.k, pieces, jhUptoFor(r.k, upto)).open || 0); deskTot += deskOpen[r.k]; });
  const deskSmall = jhCompact(_jhDesk && _jhDesk.card);
  ctx.fillStyle = C.card; ctx.fillRect(0, 0, _jhW, _jhH);
  if (mono){ ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.globalAlpha = .55;
    for (let x = 0; x < _jhW; x += 20){ ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, _jhH); ctx.stroke(); }
    for (let y = 0; y < _jhH; y += 20){ ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(_jhW, y + .5); ctx.stroke(); }
    ctx.globalAlpha = 1; }
  ctx.textAlign = 'left'; ctx.fillStyle = C.fg; ctx.font = font(600, 13); ctx.fillText(up(_jhT(mono ? 'jh_office_drawing_title' : 'jh_office_title')), 20, 30);
  ctx.font = font(400, 12); ctx.fillStyle = C.muted; ctx.fillText(up(jhHouseSub()), 20, 48);
  // the floors, each with its corridor: the track, two thin rails and a dashed centre
  for (let f = 0; f < _jhF; f++){ const y = jhLY(f);
    if (!mono){ ctx.fillStyle = f % 2 ? C.soft : C.card; ctx.fillRect(0, y - _jhFH, _jhW, _jhFH); ctx.fillStyle = C.line; ctx.fillRect(0, y - 1, _jhW, 1); }
    ctx.fillStyle = C.muted; ctx.font = font(500, mono ? 10.5 : 12); ctx.textAlign = 'left';
    if (f === _jhF - 1 && deskSmall){ /* a short top floor: your desk's title and count stand in the floor column */
      const colW = mono ? 98 : JH_SX - 26 - 26, t1 = up(_jhT('jh_rm_desk')), t2 = up(_jhT('jh_desk_waiting', { n: _jhFmt(deskTot) }));
      ctx.fillStyle = mono ? ink : C.fg; jhFitFont(ctx, t1, colW, z => font(600, z), mono ? 11.5 : 13); ctx.fillText(t1, mono ? 14 : 20, y - _jhFH / 2 - 2);
      jhFitFont(ctx, t2, colW, z => font(500, z), mono ? 10 : 11.5, 7);
      if (W && deskTot) jhLinkText(ctx, t2, mono ? 14 : 20, y - _jhFH / 2 + 13, C.ok, 'desk'); else { ctx.fillStyle = deskTot ? C.ok : C.muted; ctx.fillText(t2, mono ? 14 : 20, y - _jhFH / 2 + 13); }
    } else ctx.fillText(up(jhFloorWord(f)), mono ? 14 : 20, y - _jhFH / 2 + 4);
    ctx.strokeStyle = mono ? ink : C.line; ctx.lineWidth = 1; ctx.globalAlpha = mono ? .55 : 1;
    [-5, 5].forEach(d => { ctx.beginPath(); ctx.moveTo(JH_SX + 26, jhCorr(f) + d); ctx.lineTo(jhRX1(), jhCorr(f) + d); ctx.stroke(); });
    ctx.setLineDash([3, 6]); ctx.globalAlpha = mono ? .35 : .6; ctx.beginPath(); ctx.moveTo(JH_SX + 26, jhCorr(f)); ctx.lineTo(jhRX1(), jhCorr(f)); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1; }
  if (mono){
    ctx.strokeStyle = ink; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(X0 - 26, topY); ctx.lineTo(mid, topY - 62); ctx.lineTo(X1 + 26, topY); ctx.stroke();
    ctx.lineWidth = 1; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(X0 + 6, topY - 4); ctx.lineTo(mid, topY - 50); ctx.lineTo(X1 - 6, topY - 4); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.lineWidth = 2; ctx.strokeRect(X0, topY, X1 - X0, bot - topY);
    ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(10, bot + 6); ctx.lineTo(_jhW - 10, bot + 6); ctx.stroke();
    ctx.globalAlpha = .35; for (let x = 14; x < _jhW - 10; x += 10){ ctx.beginPath(); ctx.moveTo(x, bot + 16); ctx.lineTo(x + 10, bot + 6); ctx.stroke(); } ctx.globalAlpha = 1;
    for (let f = 0; f < _jhF; f++){ const y = jhLY(f);
      if (f > 0){ ctx.lineWidth = 1.4; [0, 5].forEach(d => { ctx.beginPath(); ctx.moveTo(X0, y + d); ctx.lineTo(JH_SX - 26, y + d); ctx.moveTo(JH_SX + 26, y + d); ctx.lineTo(X1, y + d); ctx.stroke(); }); }
      ctx.lineWidth = 1.2; [194].concat(jhFloorCards(f).slice(1).map(c => c.x - JH_GAP / 2)).forEach(x => { ctx.beginPath(); ctx.moveTo(x, y - _jhFH + 6); ctx.lineTo(x, y); ctx.stroke(); });
      const xa = f % 2 ? JH_SX + 18 : JH_SX - 18, xb = f % 2 ? JH_SX - 18 : JH_SX + 18, yb = y - _jhFH + 6;
      ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(xa, y); ctx.lineTo(xb, yb); ctx.stroke();
      for (let s = 1; s < 12; s++){ const q = s / 12, x = xa + (xb - xa) * q, yy = y + (yb - y) * q; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x, yy - 6); ctx.stroke(); }
      ctx.fillStyle = C.muted; ctx.font = font(500, 11); ctx.textAlign = 'right'; ctx.fillText(f === 0 ? '±0.00' : '+' + (f * 3.2).toFixed(2), 112, y - 4);
      ctx.strokeStyle = ink; ctx.globalAlpha = .5; ctx.beginPath(); ctx.moveTo(84, y); ctx.lineTo(X0, y); ctx.stroke(); ctx.globalAlpha = 1; }
    ctx.fillStyle = C.muted; ctx.font = font(500, 10.5); ctx.textAlign = 'center'; ctx.fillText(_jhT('jh_stairs').toUpperCase(), JH_SX, topY + 14);
  } else {
    ctx.fillStyle = C.accentSoft; ctx.fillRect(JH_SX - 26, topY + 10, 52, _jhF * _jhFH - 14);
    ctx.strokeStyle = C.line; ctx.lineWidth = 1; for (let y = topY + 20; y < bot - 6; y += 12){ ctx.beginPath(); ctx.moveTo(JH_SX - 18, y); ctx.lineTo(JH_SX + 18, y); ctx.stroke(); }
    ctx.fillStyle = C.muted; ctx.font = font(500, 11); ctx.textAlign = 'center'; ctx.fillText(_jhT('jh_stairs'), JH_SX, topY + 4);
  }
  const box = (c, hov, lit) => { if (mono){ if (hov || lit){ ctx.fillStyle = C.accentSoft; ctx.fillRect(c.x - 4, c.y - 4, c.w + 8, c.h + 8); } return; }
    ctx.fillStyle = hov ? C.accentSoft : C.card; ctx.strokeStyle = hov || lit ? C.accent : C.line; ctx.lineWidth = hov || lit ? 1.5 : 1; jhRoundRect(ctx, c.x, c.y, c.w, c.h, 8); ctx.fill(); ctx.stroke(); };
  const lx = c => c.x + (mono ? 6 : 12), ly1 = c => c.y + (mono ? 18 : 22), ly2 = c => c.y + (mono ? 34 : 40);
  /* the shared rooms: what came through them piles up, with its count */
  const busy = new Set(pos.filter(p => p && p.kind === 'work' && p.stop).map(p => p.stop));
  _jhShared.forEach(s => { const c = s.card, hov = _jh.hover === 'rm:' + s.id, lit = busy.has(s.id);
    box(c, hov, lit); ctx.textAlign = 'left';
    if (s.id === 'reception'){
      const cp = jhCompact(c), ty = cp ? c.y + 15 : ly1(c);
      ctx.fillStyle = mono ? ink : C.fg; ctx.font = font(600, cp ? (mono ? 11.5 : 13) : (mono ? 13 : 15)); ctx.fillText(up(_jhT('jh_rm_reception')), lx(c), ty);
      const w0 = ctx.measureText(up(_jhT('jh_rm_reception'))).width; ctx.fillStyle = C.muted; ctx.font = font(400, mono ? 10.5 : 12); if (!cp || c.w > 330) ctx.fillText(up(_jhT('jh_rm_reception_sub')), lx(c) + w0 + 10, ty);
      return; }
    const cp = jhCompact(c), ny = cp ? c.y + c.h / 2 + 5 : ly1(c);
    ctx.fillStyle = ink; const rn = up(_jhT('jh_rm_' + s.id)); jhFitFont(ctx, rn, c.w * (cp ? .55 : .9), z => font(600, z), mono ? 13 : 15); ctx.fillText(rn, lx(c), ny);
    if (!cp){ ctx.fillStyle = C.muted; ctx.font = font(400, mono ? 11.5 : 13); ctx.fillText(up(_jhT('jh_rm_shared')), lx(c), ly2(c));
      ctx.font = font(500, mono ? 10.5 : 11.5); ctx.fillStyle = lit ? ink : C.muted; ctx.fillText(up(_jhT(lit ? 'jh_in_use' : 'jh_ready')), lx(c), c.y + c.h - 8); }
    const n = jhSheetsIn(s.id, tt);
    /* the pile never climbs out of its room */
    if (n){ jhPile(ctx, c.x + c.w - 26, c.y + c.h - 7, n, ink, jhPileMax(c.h - 12, 18)); ctx.textAlign = 'right'; ctx.fillStyle = C.fg; ctx.font = font(600, mono ? 11 : 12.5); ctx.fillText(up(_jhTn('jh_rm_sheets', n, { n: _jhFmt(n) })), c.x + c.w - 44, cp ? ny : c.y + c.h - 8); } });
  /* your desk: the big office, one tray per agent holding what still waits for a person */
  { const d = _jhDesk, c = d.card, hov = _jh.hover === 'rm:desk', lit = busy.has('desk');
    box(c, hov, lit); ctx.textAlign = 'left';
    const tot = deskTot, open = deskOpen;
    if (!deskSmall){ ctx.fillStyle = mono ? ink : C.fg; ctx.font = font(600, mono ? 14 : 17); ctx.fillText(up(_jhT('jh_rm_desk')), lx(c), ly1(c) + 2);
      const w0 = ctx.measureText(up(_jhT('jh_rm_desk'))).width; ctx.fillStyle = C.muted; ctx.font = font(400, mono ? 11 : 12.5); ctx.fillText(up(_jhT('jh_rm_desk_sub')), lx(c) + w0 + 12, ly1(c) + 2);
      ctx.textAlign = 'right'; ctx.font = font(600, mono ? 13 : 15); const dw = up(_jhT('jh_desk_waiting', { n: _jhFmt(tot) }));
      if (W && tot) jhLinkText(ctx, dw, c.x + c.w - 14, ly1(c) + 2, C.ok, 'desk'); else { ctx.fillStyle = tot ? C.ok : C.muted; ctx.fillText(dw, c.x + c.w - 14, ly1(c) + 2); } }
    const base = c.y + c.h - (deskSmall ? 14 : 22), room = base - 4 - (c.y + (deskSmall ? 4 : 30));
    _jhRooms.forEach(r => { const t = d.trays[r.k], n = open[r.k]; if (!t) return;
      ctx.save(); if (_jh.sel && _jh.sel !== r.k) ctx.globalAlpha = .35;
      ctx.strokeStyle = mono ? ink : C.line; ctx.lineWidth = 1; ctx.strokeRect(t.x - t.w / 2 + 4, base - 2, t.w - 8, 5);
      jhPile(ctx, t.x, base - 4, n, r.col, jhPileMax(room, 12));
      ctx.textAlign = 'center'; ctx.fillStyle = n ? C.fg : C.muted; ctx.font = font(500, mono ? 9.5 : 10.5);
      const nm = _jhT('jh_room_' + r.k), lab = n ? nm + ' · ' + _jhFmt(n) : nm; let fs = mono ? 9.5 : 10.5; ctx.font = font(500, fs);
      while (fs > 7.5 && ctx.measureText(up(lab)).width > t.w - 4){ fs -= .5; ctx.font = font(500, fs); }
      ctx.fillText(up(lab), t.x, base + (deskSmall ? 11 : 13)); ctx.restore(); }); }
  /* the offices: the agent's name, points and work; his seat, empty while he is out */
  _jhRooms.forEach((r, i) => { const s = agPointsTally(r.k, pieces, jhUptoFor(r.k, upto)), hov = _jh.hover === r.k || _jh.sel === r.k;
    if (r.reading){ const c = r.card; if (hov){ ctx.fillStyle = mono ? C.card : C.accentSoft; jhRoundRect(ctx, c.x, c.y, c.w, c.h, 9); ctx.fill(); }
      ctx.fillStyle = C.fg; ctx.font = font(500, mono ? 10.5 : 12.5); ctx.textAlign = 'left'; let fs = mono ? 10.5 : 12.5; const nm = up(_jhT('jh_room_' + r.k));
      while (fs > 8 && ctx.measureText(nm).width > c.w - 30){ fs -= .5; ctx.font = font(500, fs); } ctx.fillText(nm, c.x + 24, c.y + 13);
      jhLens(ctx, r.seat.x, r.seat.y - 6, 6, r.col); return; }
    const c = r.card, p = pos[i], out = p && p.kind !== 'idle';
    box(c, hov, false);
    /* a short card: the seat beside the name, the status under it, nothing else */
    const cp = jhCompact(c), two = c.h >= 36, nx = cp ? c.x + 40 : lx(c), ny = cp ? (two ? c.y + c.h / 2 - 1 : c.y + c.h / 2 + 5) : ly1(c);
    if (mono){ ctx.fillStyle = r.col; ctx.beginPath(); ctx.arc(c.x + c.w - 8, c.y + 14, 4, 0, Math.PI * 2); ctx.fill(); } else { ctx.fillStyle = r.col; ctx.fillRect(c.x, c.y + (cp ? 6 : 8), 3, cp ? c.h - 12 : 30); }
    const ptsTxt = up(_jhFmt(s.pts) + ' ' + _jhT('jh_pts')); ctx.font = font(600, mono ? 13 : 16); const ptsW = ctx.measureText(ptsTxt).width, ptsX = c.x + c.w - (mono ? 18 : 12);
    ctx.textAlign = 'left'; ctx.fillStyle = mono ? ink : C.fg; const nm = up(_jhT('jh_room_' + r.k)); jhFitFont(ctx, nm, ptsX - ptsW - 10 - nx, z => font(600, z), mono ? 13 : 15); ctx.fillText(nm, nx, ny);
    let px = nx + 6 + ctx.measureText(nm).width;
    if (agPointsIsNew(r.k)) px += jhPill(ctx, _jhT('jh_new_tag'), px, ny - 1, C.amber) + 4;
    if (agPointsMine(r.k)) jhPill(ctx, _jhT('jh_mine_tag'), px, ny - 1, C.accent);
    /* the work line only where it clears the seat below it, measured: a card a
       little over the compact height (60–70) has the room for its name and the
       seat, not for the line between them as well. Where an agent has work
       waiting, the line says so and is the door to it (round 23's gaps) */
    if (!cp && ly2(c) + 4 <= r.seat.y - 25){ ctx.fillStyle = C.muted; ctx.font = font(400, mono ? 11.5 : 13);
      const wx = lx(c), room = c.x + c.w - 10 - wx, wn = W ? (W.by[r.k] || 0) : 0;
      /* THE AGENT'S NAME STAYS WHOLE, AS DRAWN ("Their round came back · 1
         waiting…"): where the line is too long it is the link's end that is
         cut, never the name or its " · " (round 23's gaps, 19 Oct 2026: the
         name was cut mid-word and the ellipsis ran into the link) */
      if (wn > 0){ const head = up(_jhT('ag_' + r.k) + ' · '), hw = ctx.measureText(head).width;
        if (hw + 24 <= room){ const link = jhClip(ctx, up(_jhT('jh_desk_waiting', { n: _jhFmt(wn) })), room - hw);
          ctx.fillText(head, wx, ly2(c)); jhLinkText(ctx, link, wx + hw, ly2(c), C.amber, r.k); }
        else ctx.fillText(jhClip(ctx, up(_jhT('ag_' + r.k)), room), wx, ly2(c)); }
      else ctx.fillText(jhClip(ctx, up(jhRoomSub(r, s, pieces, mono)), room), wx, ly2(c)); }
    ctx.textAlign = 'right'; ctx.fillStyle = C.accent; ctx.font = font(600, mono ? 13 : 16); ctx.fillText(ptsTxt, ptsX, ny);
    if (out){ ctx.save(); ctx.strokeStyle = r.col; ctx.globalAlpha = .7; ctx.lineWidth = 1.4; ctx.setLineDash([2.5, 3]); ctx.beginPath(); ctx.arc(r.seat.x, r.seat.y - 12, 10, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
    ctx.textAlign = 'left'; ctx.fillStyle = out ? C.ok : C.muted; ctx.font = font(500, mono ? 10.5 : 11.5);
    const stX = cp ? nx : r.seat.x + 18;
    if (cp ? two : true) ctx.fillText(jhClip(ctx, up(_jhT(out ? 'jh_out' : 'jh_at_base') + ' · ' + jhRoomStateWords(r.k)), c.x + c.w - 10 - stX), stX, cp ? ny + 14 : c.y + c.h - 8); });
  if (mono){ const dy = bot + 34; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.globalAlpha = .7;
    const g = jhFloorCards(0);
    g.forEach(c => { const x0 = c.x - JH_GAP / 2, x1 = x0 + c.w + JH_GAP; ctx.beginPath(); ctx.moveTo(x0, dy); ctx.lineTo(x1, dy); ctx.moveTo(x0, dy - 5); ctx.lineTo(x0, dy + 5); ctx.moveTo(x1, dy - 5); ctx.lineTo(x1, dy + 5); ctx.stroke();
      ctx.fillStyle = ink; ctx.font = font(500, 11); ctx.textAlign = 'center'; ctx.fillText((12.6 / g.length).toFixed(2), (x0 + x1) / 2, dy - 6); });
    ctx.globalAlpha = 1; }
}
const jhFloorWord = f => f === _jhF - 1 && _jhF > 1 ? _jhT('jh_floor_top') : jhFloorName(f);
function jhLens(ctx, x, y, r, col){ ctx.save(); ctx.fillStyle = _jhC.card; ctx.beginPath(); ctx.arc(x, y, r + 2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.4, r * .28);
  ctx.beginPath(); ctx.arc(x - r * .18, y - r * .18, r * .6, 0, Math.PI * 2); ctx.stroke(); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + r * .25, y + r * .25); ctx.lineTo(x + r * .8, y + r * .8); ctx.stroke(); ctx.restore(); }
/* THE OVERLAP AUDIT (owner, 13 Oct 2026, after the laptop report): draws the office
   once more on a spare canvas and records every word and every pile it put down;
   a word or pile that leaves its room, or two words that touch inside one room,
   is a fault. jambo-agents-verify runs it at the owner's shortest screen. */
function jhOverlapAudit(){
  if (!_jhDesk) return { ok: false, faults: ['no office'] };
  const cv = document.createElement('canvas'); cv.width = _jhW; cv.height = Math.ceil(_jhH);
  const ctx = cv.getContext('2d'), boxes = [], piles = [], ft = ctx.fillText;
  ctx.fillText = function(t, x, y){ const m = this.measureText(t), w = m.width, a = this.textAlign;
    const asc = m.actualBoundingBoxAscent || 9, dsc = m.actualBoundingBoxDescent || 2;
    boxes.push({ t: String(t), x: a === 'right' ? x - w : a === 'center' ? x - w / 2 : x, y: y - asc, w, h: asc + dsc }); return ft.call(this, t, x, y); };
  _jhPileLog = piles;
  try { (_jh.look === 1 ? jhDrawDrawing : jhDrawPlan)(ctx, jhPieces(), jhUpto()); } finally { _jhPileLog = null; }
  const cards = [..._jhShared.map(s => s.card), _jhDesk.card, ..._jhRooms.filter(r => !r.reading).map(r => r.card)];
  const inside = (b, c) => b.x >= c.x - 1 && b.x + b.w <= c.x + c.w + 1 && b.y >= c.y - 1 && b.y + b.h <= c.y + c.h + 1;
  const home = b => cards.find(c => b.x + b.w / 2 >= c.x && b.x + b.w / 2 <= c.x + c.w && b.y + b.h / 2 >= c.y && b.y + b.h / 2 <= c.y + c.h);
  const faults = [], byCard = new Map();
  /* each agent's seat, where his face sits at base, counts as something in the room */
  _jhRooms.filter(r => !r.reading).forEach(r => boxes.push({ t: '[seat ' + r.k + ']', x: r.seat.x - 11, y: r.seat.y - 25, w: 22, h: 22 }));
  boxes.forEach(b => { if (!b.t.trim()) return; const c = home(b); if (!c) return;
    if (!inside(b, c)) faults.push('leaves its room: ' + b.t);
    (byCard.get(c) || byCard.set(c, []).get(c)).push(b); });
  byCard.forEach(list => { for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++){ const a = list[i], b = list[j];
    if (a.x < b.x + b.w - .5 && b.x < a.x + a.w - .5 && a.y < b.y + b.h - .5 && b.y < a.y + a.h - .5) faults.push('touch: ' + a.t + ' / ' + b.t); } });
  piles.forEach(p => { const c = home(p); if (c && !inside(p, c)) faults.push('a pile climbs out of its room'); });
  return { ok: faults.length === 0, faults, words: boxes.length };
}
function jhDrawPlan(ctx, pieces, upto){ jhDrawOffice(ctx, pieces, upto, false); }
function jhDrawDrawing(ctx, pieces, upto){ jhDrawOffice(ctx, pieces, upto, true); }
function jhHouseSub(){
  const parts = [];
  if (_jh.one) parts.push(_jhT('jh_only', { no: jhOneNo() }));
  const nA = _jhRooms.filter(r => !r.reading).length;
  parts.push(jhRangeLabel(_jh.range), _jhTn('jh_n_agents', nA, { n: nA }), _jhTn('jh_n_floors', _jhF, { n: _jhF }));
  return parts.join(' · ');
}
function jhOneNo(){ const c = _jh.data && _jh.data.contracts && _jh.data.contracts[_jh.one]; return c ? c.no : _jh.one; }
/* one sheet of paper: a page with a folded corner, three lines and its agent's tab */
function jhSheet(ctx, x, y, s, rot, col){
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-6, -8); ctx.lineTo(3, -8); ctx.lineTo(6, -5); ctx.lineTo(6, 8); ctx.lineTo(-6, 8); ctx.closePath();
  ctx.fillStyle = '#FDFDFB'; ctx.fill(); ctx.strokeStyle = 'rgba(15,26,51,.35)'; ctx.lineWidth = .7; ctx.stroke();
  ctx.fillStyle = '#E4E8F0'; ctx.beginPath(); ctx.moveTo(3, -8); ctx.lineTo(3, -5); ctx.lineTo(6, -5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(15,26,51,.32)'; ctx.fillRect(-3.5, -3, 7, .9); ctx.fillRect(-3.5, -.6, 7, .9); ctx.fillRect(-3.5, 1.8, 5, .9);
  if (col){ ctx.fillStyle = col; ctx.fillRect(-6, -8, 2.2, 5); }
  ctx.restore();
}
/* ALIVE, NEVER A STILL PHOTO (owner, 13 Oct 2026): a Jambo at rest breathes,
   sways and tilts his hat; at work he moves a little quicker. Each one is out
   of step with the next. Still for a reader who asked for less motion. */
function jhAlive(ctx, x, y, rad, i, busy, fn){
  if (jhReduced()){ fn(x, y); return; }
  const t = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000 * (busy ? 1.7 : 1) + i * 1.3;
  const s = 1 + 0.04 * Math.sin(t * 2.1), rot = 0.09 * Math.sin(t * 1.3) + (busy ? 0.05 * Math.sin(t * 5.2) : 0), dy = -Math.abs(Math.sin(t * 1.6)) * rad * 0.12;
  ctx.save(); ctx.translate(x, y + dy); ctx.rotate(rot); ctx.scale(s, s); fn(0, 0); ctx.restore();
}
function jhRunners(ctx, pieces){
  const atRest = !_jh.playing && _jh.t >= 1;
  const on = _jh.one ? new Set(pieces.map(p => p.agent)) : null;
  const pts = _jh.pos || _jhRooms.map(r => atRest || jhSoloQuiet(r.k) ? jhIdle(r) : jhPosAt(r, _jh.t));
  /* the path walked so far on this trip, along the track's own right angles (never sampled frames) */
  pts.forEach((p, i) => { const r = _jhRooms[i]; if (!r || p.kind === 'idle' || !r.trip || p.j == null) return;
    ctx.save(); ctx.strokeStyle = r.col; ctx.lineWidth = _jh.look === 1 ? 1.6 : 2; ctx.setLineDash(_jh.look === 1 || r.reading ? [4, 4] : []); ctx.globalAlpha = _jh.sel === null ? .5 : _jh.sel === r.k ? .9 : .08;
    const P = r.trip.pts; ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y - 8); for (let j = 1; j < p.j; j++) ctx.lineTo(P[j].x, P[j].y - 8); ctx.lineTo(p.x, p.y - 8); ctx.stroke(); ctx.restore(); });
  _jh.lastPos = pts.map((p, i) => { const r = _jhRooms[i], lit = _jh.sel === r.k, dim = (_jh.sel !== null && !lit) || (on && !on.has(r.k)), rad = 10 + (lit ? 3 : 0), cy = p.y - rad - 2;
    ctx.save(); if (dim) ctx.globalAlpha = .3;
    /* a reading is not an agent: no Jambo, only its paper moving */
    if (r.reading){ if (p.kind !== 'idle' && p.carrying) jhSheet(ctx, p.x, p.y - 10, 1.05, 0, r.col); ctx.restore(); return { x: p.x, y: p.y - 10 }; }
    const work = p.kind === 'work' && !atRest;
    jhAlive(ctx, p.x, cy, rad, i, work, (x, y) => jhJambo(ctx, r, x, y, rad, lit));
    if (work){ ctx.strokeStyle = r.col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, cy, rad + 6, -Math.PI / 2, -Math.PI / 2 + p.k * Math.PI * 2); ctx.stroke(); }
    const now = (typeof performance !== 'undefined' ? performance.now() : 0);
    if (p.kind === 'walk' && p.carrying) for (let q = Math.min(3, p.n || 1) - 1; q >= 0; q--) jhSheet(ctx, p.x + rad * .95 + q * 1.5, cy - rad - 6 - q * 2.5 + Math.sin(now / 120 + i) * 1.2, 1, -.18, r.col);
    else if (work && p.carrying) jhSheet(ctx, p.x + rad * 1.3, cy + 4 + Math.sin(now / 180 + i) * 1.5, .95, Math.sin(now / 260 + i) * .35, r.col);
    ctx.restore(); return { x: p.x, y: cy }; });
}
function jhDateCard(ctx){
  const S = jhSpan(), cur = new Date(_jh.t >= 1 ? S.end : S.from + _jh.t * (S.end - S.from));
  let txt = '';
  try { txt = _jh.range === 1 ? _jhT('jh_r_1') + ' · ' + cur.toLocaleTimeString((typeof langLocale === 'function') ? langLocale() : undefined, { hour: '2-digit', minute: '2-digit' })
    : cur.toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { weekday: 'short', day: 'numeric', month: 'short' }) + '  ·  ' + _jhT('jh_day_of', { d: Math.max(1, Math.ceil(_jh.t * _jh.range)), n: _jh.range }); }
  catch (_) { txt = ''; }
  if (!txt) return;
  ctx.font = '600 13px Geist, sans-serif'; const w = ctx.measureText(txt).width + 22, x = _jhW - w - 16, y = 18;
  ctx.fillStyle = _jhC.soft; ctx.strokeStyle = _jhC.line; jhRoundRect(ctx, x, y, w, 28, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = _jhC.fg; ctx.textAlign = 'left'; ctx.fillText(txt, x + 11, y + 18);
}
function jhDrawPops(ctx){
  _jh.pops = _jh.pops.filter(p => p.a < 1); _jh.pops.forEach(p => { p.a += .016;
    ctx.globalAlpha = (1 - p.a) * (p.soft ? .8 : 1); ctx.font = p.soft ? '600 12px Geist, sans-serif' : '700 16px Geist, sans-serif'; ctx.textAlign = 'center';
    ctx.lineWidth = 4; ctx.strokeStyle = _jhC.card; ctx.strokeText(p.text, p.x, p.y - p.a * 34); ctx.fillStyle = p.col; ctx.fillText(p.text, p.x, p.y - p.a * 34); ctx.globalAlpha = 1; });
}
/* A POP SAYS WHAT HAPPENED (owner picked D, 13 Oct 2026): the points, or
   "prepared", and the contract it was on — "+25 · MK-104". */
function jhPopRef(p){ const c = p && p.cid && _jh.data && _jh.data.contracts && _jh.data.contracts[p.cid]; return c && c.no ? ' · ' + c.no : ''; }
/* ONE FRAME: the house, its runners, the date, the points that landed. */
function jhFrame(now){
  _jh.raf = 0;
  const cv = document.getElementById('jh-cv');
  if (!cv || typeof state === 'undefined' || state.view !== 'jambo' || _jh.tab !== 'house') return;
  const pieces = jhPieces();
  if (_jh.playing){
    const dt = Math.min(60, now - (_jh.last || now)); _jh.last = now;
    const t0 = _jh.t; _jh.t = Math.min(1, _jh.t + dt * _jh.speed / JH_DURATION_MS);
    jhLogStep(t0 * JH_DURATION_MS / 1000, _jh.t * JH_DURATION_MS / 1000);
    const S = jhSpan(), a = S.from + t0 * (S.end - S.from), b = S.from + _jh.t * (S.end - S.from);
    /* THE MOMENT JAMBO DID IT: a piece prepared inside this step rises in its
       room as "prepared" (softer than points); its points come later, when a
       person decides. A piece written already decided has no separate moment. */
    for (const p of pieces){
      const pAt = Date.parse(p.at || '') || 0;
      if (!pAt || pAt <= a || pAt > b || (p.outcome && p.decidedAt === p.at) || (_jh.sel && p.agent !== _jh.sel)) continue;
      const i = _jhRooms.findIndex(r => r.k === p.agent); if (i < 0) continue;
      const pos = _jh.lastPos[i] || { x: _jhW / 2, y: _jhH / 2 };
      _jh.pops.push({ x: pos.x, y: pos.y - 20, text: _jhT('jh_pop_prep') + jhPopRef(p), col: _jhRooms[i].col, a: 0, soft: true }); if (_jh.pops.length > 80) _jh.pops.shift();
    }
    for (const p of pieces){
      const at = Date.parse(p.decidedAt || '') || 0;
      if (!p.outcome || at <= a || at > b || (_jh.sel && p.agent !== _jh.sel)) continue;
      const i = _jhRooms.findIndex(r => r.k === p.agent); if (i < 0) continue;
      const pos = _jh.lastPos[i] || { x: _jhW / 2, y: _jhH / 2 }, v = agPointsEach(agPointsOf(p.agent), p.outcome);
      _jh.pops.push({ x: pos.x, y: pos.y - 20, text: (v >= 0 ? '+' : '−') + Math.abs(Math.round(v)) + jhPopRef(p), col: v >= 0 ? _jhRooms[i].col : _jhC.ruby, a: 0 }); if (_jh.pops.length > 80) _jh.pops.shift();
      jhFeedAdd(p);
    }
    if (_jh.t >= 1){ _jh.playing = false; jhFinish(); jhSetPlayWord(); }
  } else _jh.last = now;
  const ctx = cv.getContext('2d'), kk = cv.width / _jhW;
  ctx.setTransform(kk, 0, 0, kk, 0, 0);
  const upto = jhUpto(), atRest = !_jh.playing && _jh.t >= 1;
  _jh.pos = _jhRooms.map(r => atRest || jhSoloQuiet(r.k) ? jhIdle(r) : jhPosAt(r, _jh.t));
  (_jh.look === 1 ? jhDrawDrawing : jhDrawPlan)(ctx, pieces, upto);
  jhRunners(ctx, pieces); jhDateCard(ctx); jhDrawPops(ctx);
  const xk = jhXfK(), xf = _jh.xf;
  if (xf && xf.img){ ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1 - xk; ctx.drawImage(xf.img, 0, 0, cv.width, cv.height); ctx.restore(); }
  jhScorePaint(pieces, upto, xf ? xk : 1);
  if (_jh.playing || _jh.pops.length || _jh.xf) _jh.raf = requestAnimationFrame(jhFrame);
  /* at rest the Jambos still breathe: a slow beat, never for a reader who asked for less motion */
  else if (!jhReduced() && !_jh.idleT) _jh.idleT = setTimeout(() => { _jh.idleT = 0; jhKick(); }, 70);
}
function jhKick(){ if (!_jh.raf && typeof requestAnimationFrame === 'function') _jh.raf = requestAnimationFrame(jhFrame); }

/* ---------------- THE SCORE PANEL: one card per agent, in a scroll ---------------- */
let _jhScKey = '';
function jhScorePaint(pieces, upto, xk){
  const rows = document.getElementById('jh-rows'); if (!rows) return;
  let total = 0; const xf = _jh.xf && xk < 1 ? _jh.xf : null, mix = (o, n) => (xf && o != null) ? o + (n - o) * xk : n;
  _jhRooms.forEach(r => { const s = agPointsTally(r.k, pieces, jhUptoFor(r.k, upto)); total += s.pts;
    const el = rows.querySelector(`[data-jh-agent="${r.k}"]`); if (!el) return;
    const p = el.querySelector('[data-jh-p]'), d = el.querySelector('[data-jh-d]');
    const pt = _jhFmt(mix(xf && xf.oldPts[r.k], s.pts)), dt = jhUnitWords(r.k, s.n) + (s.n ? ' · ' + _jhT('jh_pct_used', { p: s.n ? Math.round(s.used / s.n * 100) : 0 }) : '');
    if (p && p.textContent !== pt) p.textContent = pt; if (d && d.textContent !== dt) d.textContent = dt; });
  const tw = _jhFmt(mix(xf && xf.oldTotal, total)), tot = document.getElementById('jh-total'); if (tot && tot.textContent !== tw) tot.textContent = tw;
  const prog = document.getElementById('jh-prog'); if (prog) prog.style.width = (_jh.t * 100) + '%';
  jhScorecard(pieces, upto);
}
/* WHAT CHANGED, BESIDE THE POINTS (owner picked F, 13 Oct 2026): contracts
   Jambo's work touched, dates he caught (renewals, our promises, the week
   laid out) and chases and nudges he prepared (late promises, links to sign,
   dropped threads) — counted from the same pieces, as of the replay's moment. */
const JH_RES_DATES = ['renew', 'ours', 'week'], JH_RES_NUDGES = ['late', 'link', 'quiet'];
function jhResults(pieces, upto, keys){
  const lim = upto == null ? Infinity : upto, ids = new Set(); let dates = 0, nudges = 0;
  for (const p of pieces || []){
    if (keys && !keys.includes(p.agent)) continue;
    const at = Date.parse(p.at || '') || 0; if (at > lim) continue;
    if (p.cid) ids.add(p.cid);
    if (JH_RES_DATES.includes(p.agent)) dates++;
    if (JH_RES_NUDGES.includes(p.agent)) nudges++;
  }
  return { touched: ids.size, dates, nudges };
}
function jhResultsLine(r){ return [_jhTn('jh_res_touched', r.touched, { n: _jhFmt(r.touched) }), _jhTn('jh_res_dates', r.dates, { n: _jhFmt(r.dates) }), _jhTn('jh_res_nudges', r.nudges, { n: _jhFmt(r.nudges) })].join(' · '); }
function jhScorecard(pieces, upto){
  const host = document.getElementById('jh-sc'); if (!host) return;
  const list = _jh.sel ? [_jh.sel] : _jhRooms.map(r => r.k);
  let n = 0, used = 0, changed = 0, thrown = 0, open = 0, pts = 0, hrs = 0;
  list.forEach(k => { const s = agPointsTally(k, pieces, upto); n += s.n; used += s.used; changed += s.changed; thrown += s.thrown; open += s.open; pts += s.pts; hrs += s.hrs; });
  const title = (_jh.sel ? _jhT('ag_' + _jh.sel) : _jhT('jh_all')) + (_jh.one ? ' · ' + jhOneNo() : '');
  const res = jhResults(pieces, upto, list);
  const key = [title, n, used, changed, thrown, open, pts, res.touched, res.dates, res.nudges, JSON.stringify(_jh.sel ? agPointsOf(_jh.sel) : ''), _jh.sel ? jhLevelPickHtml(_jh.sel) : ''].join('|');
  if (key === _jhScKey) return; _jhScKey = key;
  const done = used + changed + thrown, pc = x => done ? Math.round(x / done * 100) : 0;
  const lvl = _jh.sel ? jhLevelWords(_jh.sel) : jhRangeWords();
  const sum = _jh.sel ? (() => { const s = agPointsTally(_jh.sel, pieces, upto);
    return `<div class="jh-sum"><small>${_jhE(_jhT('jh_sum_h'))}${agPointsMine(_jh.sel) ? ' · ' + _jhE(_jhT('jh_mine_tag')) : ''}</small>${_jhE(agPointsSumLine(s, _jh.sel))}<span>${_jhE(_jhT('jh_sum_rule'))}</span></div>`; })() : '';
  const pick = _jh.sel ? jhLevelPickHtml(_jh.sel) : '';
  host.innerHTML = `<h4 class="jh-sc-h"><span>${_jhE(title)}</span>${pick || `<span class="jh-quiet">${_jhE(lvl)}</span>`}</h4>
    <div class="jh-mix" role="img" aria-label="${_jhE(_jhT('jh_used'))} ${pc(used)}%, ${_jhE(_jhT('jh_changed'))} ${pc(changed)}%, ${_jhE(_jhT('jh_thrown'))} ${pc(thrown)}%">
      <i style="width:${pc(used)}%" class="u"></i><i style="width:${pc(changed)}%" class="c"></i><i style="width:${pc(thrown)}%" class="t"></i></div>
    <div class="jh-legend"><span><b class="u"></b>${_jhE(_jhT('jh_used'))} ${pc(used)}%</span><span><b class="c"></b>${_jhE(_jhT('jh_changed'))} ${pc(changed)}%</span><span><b class="t"></b>${_jhE(_jhT('jh_thrown'))} ${pc(thrown)}%</span></div>
    <div class="jh-kpis"><div><small>${_jhE(_jhT('jh_k_pieces'))}</small><b>${_jhFmt(n)}</b></div><div><small>${_jhE(_jhT('jh_k_hours'))}</small><b>${hrs.toFixed(1)}</b></div>
      <div><small>${_jhE(_jhT('jh_k_waiting'))}</small><b>${_jhFmt(open)}</b></div><div><small>${_jhE(_jhT('jh_k_points'))}</small><b>${_jhFmt(pts)}</b></div></div>
    <div class="jh-res" id="jh-res"><div><b>${_jhFmt(res.touched)}</b><small>${_jhE(_jhT('jh_k_touched'))}</small></div><div><b>${_jhFmt(res.dates)}</b><small>${_jhE(_jhT('jh_k_dates'))}</small></div><div><b>${_jhFmt(res.nudges)}</b><small>${_jhE(_jhT('jh_k_nudges'))}</small></div></div>${sum}`;
  jhFitPanel();
}
/* EACH PERSON CHOOSES (round 23, owner, 17 Oct 2026): on an acting agent's
   card, "For you" — the company's level, or a step DOWN from it (Ask me
   first · Leave it to me). "Just do it" is never offered here: it stays the
   admin's. Where nothing is below the company's, the words alone. */
function jhLevelPickHtml(k){
  if (typeof AG_READINGS !== 'undefined' && Array.isArray(AG_READINGS) && AG_READINGS.includes(k)) return '';
  if (typeof agLevelCo !== 'function' || typeof agentLevelMineSet !== 'function') return '';
  const co = agLevelCo(k), mine = (typeof agLevelMine === 'function') ? agLevelMine(k) : null;
  const below = co === 'auto' ? ['ask', 'mine'] : co === 'ask' ? ['mine'] : [];
  if (!below.length) return '';
  const lv = w => _jhT('st_agents_lv_' + w);
  const opt = (v, label) => `<option value="${v}"${(mine || '') === v ? ' selected' : ''}>${_jhE(label)}</option>`;
  return `<label class="jh-lv"><span>${_jhE(_jhT('ag_lv_for_you'))}</span><select data-jh-lv="${_jhE(k)}">${opt('', _jhT('ag_lv_company', { lv: lv(co) }))}${below.map(w => opt(w, lv(w))).join('')}</select></label>`;
}
function jhLevelWords(k){
  if (typeof AG_READINGS !== 'undefined' && Array.isArray(AG_READINGS) && AG_READINGS.includes(k)) return _jhT('jh_reads_only');
  const lv = (typeof agLevelOf === 'function') ? agLevelOf(k) : 'ask';
  return _jhT('st_agents_lv_' + (['auto', 'ask', 'mine'].includes(lv) ? lv : 'ask'));
}
/* The panel stands as tall as the house; its agent cards scroll inside it. */
function jhFitPanel(){
  jhLogPaint();
  const panel = document.querySelector('.jh-panel'), stage = document.getElementById('jh-stage'), rows = document.getElementById('jh-rows');
  if (!panel || !stage || !rows || typeof requestAnimationFrame !== 'function') return;
  requestAnimationFrame(() => {
    if (!document.body.contains(rows)) return;
    if (typeof matchMedia === 'function' && !matchMedia('(min-width: 1180px)').matches){ rows.style.maxHeight = '420px'; return; }
    const log = document.getElementById('jh-log'), card = stage.closest('.jh-housecard') || stage;
    rows.style.maxHeight = '0px'; if (log) log.style.maxHeight = '0px';
    const other = panel.offsetHeight;
    rows.style.maxHeight = Math.max(170, card.offsetHeight - other) + 'px';
    if (log) log.style.maxHeight = Math.max(170, card.offsetHeight - other + ((document.getElementById('jh-sc') || {}).offsetHeight || 0)) + 'px';
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
  return `<div><b>${_jhE(_jhT('ag_' + p.agent))}</b> ${_jhE(_jhT('jh_act_' + p.agent))}${what ? ' — ' + _jhE(what) : ''} <span class="jh-out is-${p.outcome || 'open'}">${_jhE(out)}</span>${p.rebuilt ? ` <span class="jh-quiet">· ${_jhE(_jhT('jh_rb_tag'))}</span>` : ''}</div>`;
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
  const tot = _jhRooms.filter(r => !_jh.sel || r.k === _jh.sel).map(r => ({ k: r.k, s: agPointsTally(r.k, pieces, Infinity) }));
  const total = tot.reduce((a, x) => a + x.s.pts, 0), hrs = tot.reduce((a, x) => a + x.s.hrs, 0);
  const best = tot.slice().sort((a, b) => b.s.pts - a.s.pts)[0];
  document.getElementById('jh-end-t').textContent = _jhT('jh_end_title', { n: _jhFmt(total) });
  document.getElementById('jh-end-l').textContent = !total && !tot.some(x => x.s.used + x.s.changed + x.s.thrown) ? _jhT('jh_end_none')
    : _jhT(_jh.sel ? (_jh.one ? 'jh_end_agent_on' : 'jh_end_agent') : _jh.one ? 'jh_end_line_on' : 'jh_end_line', { h: jhHoursWords(hrs), name: best ? _jhT('ag_' + best.k) : '', no: jhOneNo() });
  const er = document.getElementById('jh-end-r'); if (er) er.textContent = jhResultsLine(jhResults(pieces, Infinity, tot.map(x => x.k)));
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
  /* No facts line under the title (owner, 13 Oct 2026): the agents are counted
     on the Jobs tab and in the house, the period and points in the panel.
     THE FILTERS STAND BESIDE THE TABS (owner picked "Beside the tabs", 13 Oct
     2026, the Contracts page's way): labelled boxes on the tab row, and only
     the ones that change what this tab shows — the house all four, Jobs its
     period, How points work none. */
  return `<div class="sap-band jh-band ph-card">
    <div class="jh-head ph-top"><div style="min-width:0"><h1 class="jh-t">${_jhE(_jhT('nav_jambo'))}</h1></div>
      <div class="jh-acts"><button type="button" class="ui-btn" data-jh-points>${_jhE(_jhT('jh_change_points'))}</button></div></div>
    <div class="jh-tabbar"><div class="jh-tabs" role="tablist">${JH_TABS.map(t => `<button type="button" role="tab" class="jh-tab" data-jh-tab="${t}" aria-selected="${_jh.tab === t}">${_jhE(_jhT('jh_tab_' + t))}${t === 'jobs' ? ` <span class="jh-quiet">${agPointsKeys().length}</span>` : ''}</button>`).join('')}</div>${jhFiltersHtml()}</div>
  </div>`;
}
function jhBoxSel(id, label, opts, cur){
  return `<label class="jh-box" for="${id}"><span class="jh-box-l">${_jhE(label)}</span><select id="${id}" class="jh-box-v">${opts.map(([v, w]) => `<option value="${_jhE(String(v))}"${String(v) === String(cur) ? ' selected' : ''}>${_jhE(w)}</option>`).join('')}</select></label>`;
}
function jhFiltersHtml(){
  if (_jh.tab === 'how') return '';
  const range = `<span class="jh-rangewrap">${jhRangeSelHtml()}<span class="jh-range-wait" id="jh-range-wait" hidden>${(typeof busyHtml === 'function') ? busyHtml('') : ''}</span>${jhDaysHtml()}</span>`;
  if (_jh.tab === 'jobs') return `<div class="jh-fb">${range}</div>`;
  if (!_jh.data || _jh.loading) return `<div class="jh-fb">${range}</div>`;
  return `<div class="jh-fb">${range}
      <span class="jh-combo jh-box"><svg class="jh-combo-ic" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5L14 14"/></svg>
        <input id="jh-one" type="text" autocomplete="off" spellcheck="false" role="combobox" aria-label="${_jhE(_jhT('jh_contract'))}" aria-expanded="false" aria-controls="jh-one-list" aria-autocomplete="list" placeholder="${_jhE(_jhT('jh_contract_ph'))}">
        <button type="button" class="jh-combo-x" id="jh-one-x" aria-label="${_jhE(_jhT('jh_contract_all'))}" hidden>${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : '×'}</button>
        <span class="jh-combo-list" id="jh-one-list" role="listbox" hidden></span></span>
      ${jhBoxSel('jh-look', _jhT('jh_look'), [[0, _jhT('jh_look_plan')], [1, _jhT('jh_look_drawing')]], _jh.look)}
      ${jhBoxSel('jh-speed', _jhT('jh_speed'), JH_SPEEDS.map(v => [v, _jhT('jh_sp_' + String(v).replace('.', ''))]), _jh.speed)}
    </div>`;
}
/* The period: one labelled box — the four set periods, a typed one when there
   is one, and Custom…, which opens a box for a number of days under it. */
function jhRangeOpts(){
  const o = JH_RANGES.map(r => [r, _jhT('jh_r_' + r)]);
  if (!JH_RANGES.includes(_jh.range)) o.push([_jh.range, jhRangeLabel(_jh.range)]);
  return o.concat([['custom', _jhT('jh_r_custom')]]);
}
function jhRangeSelHtml(){ return jhBoxSel('jh-range', _jhT('jh_range'), jhRangeOpts(), _jh.range); }
function jhDaysHtml(){
  return `<span class="jh-days" id="jh-days" hidden><label class="jh-lbl" for="jh-days-n">${_jhE(_jhT('jh_r_custom_last'))}</label><input id="jh-days-n" type="number" min="1" max="${JH_DAYS_MAX}" step="1" inputmode="numeric" value="${_jh.range}"><span class="jh-lbl">${_jhE(_jhT('jh_r_custom_unit'))}</span><button type="button" class="ui-btn" data-jh-days-go>${_jhE(_jhT('jh_r_custom_go'))}</button><span class="jh-days-bad" id="jh-days-bad" hidden>${_jhE(_jhT('jh_r_custom_bad', { n: JH_DAYS_MAX }))}</span></span>`;
}
/* The box says the period it holds, a typed one too (no flash: only its options). */
function jhRangeSelPaint(){
  const sel = document.getElementById('jh-range'); if (!sel) return;
  sel.innerHTML = jhRangeOpts().map(([v, w]) => `<option value="${_jhE(String(v))}">${_jhE(w)}</option>`).join('');
  sel.value = String(_jh.range);
}
function jhNotesHtml(){ const D = _jh.data || {};
  return [D.static ? _jhT('jh_static') : '', D.error ? D.error : '', D.cut ? _jhT('jh_cut', { n: _jhFmt(D.max) }) : ''].filter(Boolean).map(x => `<p class="jh-note">${_jhE(x)}</p>`).join(''); }
function jhHouseHtml(){
  const D = _jh.data;
  if (!D || _jh.loading) return `<div class="jh-body"><p class="jh-note">${(typeof busyHtml === 'function') ? busyHtml(_jhT('jh_loading')) : _jhE(_jhT('jh_loading'))}</p></div>`;
  return `<div class="jh-body">
    <div id="jh-notes">${jhNotesHtml()}</div>
    <div class="jh-split">
      <div class="jh-left">
        <div class="jh-housecard">
        <div class="jh-sh">
          <button type="button" class="ui-btn ui-btn-primary jh-play" data-jh-play>${_jhE(jhPlayWord())}</button>
          <button type="button" class="ui-btn" data-jh-restart>${_jhE(_jhT('jh_again'))}</button>
          <span class="jh-prog" aria-hidden="true"><i id="jh-prog"></i></span>
        </div>
        <div class="jh-stage" id="jh-stage">
          <canvas id="jh-cv" width="${_jhW}" height="${_jhH}" role="img" aria-label="${_jhE(_jhT('jh_house_aria'))}"></canvas>
          <button type="button" class="sr-only" data-jh-work>${_jhE(_jhT('jh_wait_open'))}</button>
          <div class="jh-tip" id="jh-tip" role="tooltip" hidden></div>
          <div class="jh-end" id="jh-end" hidden><div class="jh-end-card" role="dialog" aria-labelledby="jh-end-t"><button type="button" class="jh-end-x" data-jh-end-x aria-label="${_jhE(_jhT('jh_end_close'))}" title="${_jhE(_jhT('jh_end_close'))}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : '×'}</button>${(typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 56, 'jh-end-face') : ''}
            <h3 id="jh-end-t"></h3><p id="jh-end-l"></p><p class="jh-end-r" id="jh-end-r"></p><p class="jh-quiet">${_jhE(_jhT('jh_end_hint'))}</p>
            <button type="button" class="ui-btn ui-btn-primary" data-jh-restart>${_jhE(_jhT('jh_again'))}</button></div></div>
        </div>
        </div>
        <div class="jh-feedcard"><h4>${_jhE(_jhT('jh_feed_h'))}</h4><div class="jh-feed" id="jh-feed" aria-live="polite"></div></div>
      </div>
      <aside class="jh-panel" aria-label="${_jhE(_jhT('jh_k_points'))}">
        <div class="jh-total"><b id="jh-total">0</b><span id="jh-total-l">${_jhE(_jhT('jh_pts'))} · ${_jhE(_jh.one ? jhOneNo() + ' · ' : '')}${_jhE(jhRangeWords())}</span></div>
        <p class="jh-note">${_jhE(_jhT('jh_point_rule'))} ${_jhE(_jhT(agPointsKeys().some(k => agPointsMine(k)) ? 'jh_vals_mine' : 'jh_vals_company'))}</p>
        <div class="jh-ptabs" role="tablist">${['log', 'points'].map(t => `<button type="button" role="tab" class="jh-ptab" data-jh-ptab="${t}" aria-selected="${_jh.ptab === t}">${_jhE(_jhT('jh_ptab_' + t))}</button>`).join('')}</div>
        <div class="jh-log" id="jh-log" aria-live="polite"${_jh.ptab === 'log' ? '' : ' hidden'}></div>
        <div class="jh-pbox" id="jh-pbox"${_jh.ptab === 'points' ? '' : ' hidden'}>
        <div class="jh-rows" id="jh-rows">${jhRowsHtml()}</div>
        <div class="jh-sc" id="jh-sc"></div>
        </div>
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
      <p class="jh-big">${_jhE(_jhT('jh_ex_big', { n: _jhFmt(s.pts), h: jhHoursWords(s.hrs, 1) }))}</p>`
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
/* JAMBO FOLDED TO THE RIGHT EDGE BESIDE HIS HOUSE (round 23's gaps, second
   pass, 18 Oct 2026 — the drawing: "The house itself stays as it is today,
   with Jambo's panel folded to the right edge beside it", a narrow strip with
   his face and his count, "Jambo" and ‹). Home's folded strip in its own
   clothes (.igd-door): his face, the Counter's number his tab carries
   (counterNeedsCount), his name read top to bottom, ‹. A press opens Jambo
   beside the page — his window at the right edge, the one Copilot door's own
   act (openAI); nothing else. The house is not on the phone, nor is this. */
function jhJamboDoorHtml(){
  let n = 0; try { n = (typeof counterNeedsCount === 'function') ? Number(counterNeedsCount()) || 0 : 0; } catch (_) { n = 0; }
  const face = (typeof jamboFaceHtml === 'function') ? jamboFaceHtml('hello', 28, 'igd-door-face').replace('<img', '<img data-ink-exempt') : '';
  const name = _jhT('pd_tab_copilot'), open = _jhT('int_open_panel');
  return `<aside class="jh-jambo" id="jh-jambo" aria-label="${_jhE(name)}"><button type="button" class="igd-door" data-jh-jambo title="${_jhE(open)}" aria-label="${_jhE(n ? _jhT('pd_tab_n', { name, n }) : open)}"><span class="igd-door-i">${face}${n ? `<span class="pd-tab-n is-warn" data-jh-jambo-n>${n > 99 ? '99+' : n}</span>` : ''}</span><span class="igd-door-w">${_jhE(name)}</span><svg class="igd-door-o" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><use href="#i-left"/></svg></button></aside>`;
}
function renderJamboHouse(opts){
  const host = document.getElementById('content'); if (!host) return;
  if (typeof cancelAnimationFrame === 'function' && _jh.raf){ cancelAnimationFrame(_jh.raf); _jh.raf = 0; }
  /* ARRIVING IS AT REST: a replay paused on the way out is not where the page
     opens next time — it opens on the whole period's totals, still. */
  if (!document.querySelector('.jh-page')){ jhReplayFromStart(false); const lp = jhLookPref(); if (lp !== null && jhServerKeeps()) _jh.look = lp; }
  jhColors(); jhLayout(); _jhRooms.forEach(jhSimulate);
  const stale = !_jh.data || _jh.data.days !== _jh.range || (_jh.data.error && !(opts && opts.fromLoad));
  if (stale && !_jh.loading && (jhSignedIn() || !(typeof API_MODE === 'function' && API_MODE()))){
    if (_jh.data && _jh.data.error) _jh.data = null;
    jhLoad().then(() => { if (typeof state !== 'undefined' && state.view === 'jambo') renderJamboHouse({ fromLoad: true }); });
  }
  const nl = jhnOn();
  if (!nl && _jh.tab === 'agents') _jh.tab = 'house';
  const body = _jh.tab === 'agents' ? jhnAgentsHtml() : _jh.tab === 'jobs' ? (_jh.data ? jhJobsHtml() : jhHouseHtml()) : _jh.tab === 'how' ? jhHowHtml() : jhHouseHtml();
  /* THE NEW LOOK (round 7, as drawn): one white page, the tabs beside the title, Jambo's panel beside it */
  if (nl) host.innerHTML = `<style>${JH_CSS}</style><div class="view-enter sap-page ap-page is-ins apn-page jh-page jhn-page" data-jh-tab-on="${_jh.tab}" data-ins-page="jambo" data-ins="1"><div class="ap-body is-ins"><section class="ap-card apn-card jhn-card">${jhnHeadHtml()}${body}</section><aside id="ins-panel" class="ins-panel" aria-label="${_jhE(_jhT('ins_panel_label'))}"></aside></div></div>`;
  else host.innerHTML = `<style>${JH_CSS}</style><div class="jh-wrap"><div class="view-enter sap-page jh-page" data-jh-tab-on="${_jh.tab}">${jhBandHtml()}${body}</div>${jhJamboDoorHtml()}</div>`;
  if (nl && typeof insPaintPanel === 'function'){ insPaintPanel({ seat: 'jambo', jlWord: _jhT('nav_jambo'), item: { id: 'jambo' }, head: false, tabCount: 0, body: jhnPanelHtml() }); if (typeof insWatchWidth === 'function') insWatchWidth(); }
  jhWire(host);
  if (typeof setActiveNav === 'function') setActiveNav('jambo');
  if (_jh.tab === 'house' && document.getElementById('jh-cv')){
    jhFitCanvas(); _jhFitW = document.getElementById('jh-stage').clientWidth;
    try { if (typeof ResizeObserver === 'function'){ const st = document.getElementById('jh-stage'); if (!st.dataset.jhRo){ st.dataset.jhRo = '1'; new ResizeObserver(() => jhRefit()).observe(st); } } } catch (_) {}
    jhPaintFaces(host); jhOneShow(); jhFeedFill(); _jhScKey = '';
    const face = jhFaceImg(); if (face && !face.complete) face.onload = () => { jhPaintFaces(); jhKick(); };
    jhFrame(typeof performance !== 'undefined' ? performance.now() : 0);
    jhFitPanel();
  }
}
/* CHANGING THE PERIOD IS A TRANSITION, NOT A RELOAD (owner, 13 Oct 2026: "just
   a transition and not a flash that looks like a glitch"). The page is never
   rebuilt: the old house stays drawn while the new period is read, then its
   picture fades out over the new one and every number counts to its new value. */
const JH_XF_MS = 450;
let _jhRangeAsk = 0;
const jhXfEase = k => 1 - Math.pow(1 - k, 3);
function jhXfK(){ const x = _jh.xf; if (!x) return 1; const k = Math.min(1, ((typeof performance !== 'undefined' ? performance.now() : Date.now()) - x.at) / JH_XF_MS); if (k >= 1){ _jh.xf = null; return 1; } return jhXfEase(k); }
function jhReduced(){ try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_) { return false; } }
async function jhSetRange(d){
  if (!jhDaysOk(d)) return;
  const cv = document.getElementById('jh-cv');
  if (!cv || _jh.tab !== 'house'){ _jh.range = d; _jh.one = ''; _jh.sel = null; jhReplayFromStart(false); if (typeof placeSave === 'function') placeSave(); renderJamboHouse(); return; }
  const ask = ++_jhRangeAsk;
  const wait = document.getElementById('jh-range-wait'), sel = document.getElementById('jh-range');
  if (wait) wait.hidden = false;
  const data = (_jh.data && _jh.data.days === d && !_jh.data.error) ? _jh.data : await jhFetch(d);
  if (ask !== _jhRangeAsk || !document.getElementById('jh-cv')) return;
  if (wait) wait.hidden = true;
  if (!data){ if (sel) sel.value = String(_jh.range); return; }
  /* the picture and the numbers as they stand, before anything moves */
  let img = null;
  if (!jhReduced()){ try { img = document.createElement('canvas'); img.width = cv.width; img.height = cv.height; img.getContext('2d').drawImage(cv, 0, 0); } catch (_) { img = null; } }
  const oldPts = {}, upto0 = jhUpto(); let oldTotal = 0;
  _jhRooms.forEach(r => { const v = agPointsTally(r.k, jhPieces(), upto0).pts; oldPts[r.k] = v; oldTotal += v; });
  _jh.range = d; _jh.data = data; _jh.one = ''; _jh.sel = null; jhReplayFromStart(false);
  if (typeof placeSave === 'function') placeSave();
  jhRangeSelPaint(); jhRangeWordsPaint();
  _jh.xf = img ? { at: (typeof performance !== 'undefined' ? performance.now() : Date.now()), img, oldPts, oldTotal } : null;
  jhFrame(typeof performance !== 'undefined' ? performance.now() : 0);
}
/* Every word on the page that names the period, said again in place. */
function jhRangeWordsPaint(){
  const tl = document.getElementById('jh-total-l'); if (tl) tl.textContent = _jhT('jh_pts') + ' · ' + jhRangeWords();
  const notes = document.getElementById('jh-notes'); if (notes) notes.innerHTML = jhNotesHtml();
  const oneIn = document.getElementById('jh-one'); if (oneIn && document.activeElement !== oneIn) oneIn.value = '';
  jhOneShow();
  document.querySelectorAll('[data-jh-agent]').forEach(b => { b.classList.remove('on'); b.setAttribute('aria-pressed', 'false'); });
  const end = document.getElementById('jh-end'); if (end) end.hidden = true;
  jhSetPlayWord(); jhFeedFill(); _jhScKey = '';
}
/* A new look redraws the house in place (no rebuild, so no flash) and becomes
   this person's default. */
function jhSetLook(v){
  if (v === _jh.look) return;
  _jh.look = v; _jh.trails = [];
  const cv = document.getElementById('jh-cv'), tip = document.getElementById('jh-tip'); if (tip) tip.hidden = true;
  if (cv && jhFitCanvas()){ jhFitPanel(); jhFrame(typeof performance !== 'undefined' ? performance.now() : 0); } else jhRepaint();
  if (typeof placeSave === 'function') placeSave();
  if (jhServerKeeps()) api('me/prefs', 'PUT', { agentsLook: JH_LOOKS[v] })
    .then(r => { if (window.REMOTE && REMOTE.me && r && r.prefs) REMOTE.me.prefs = r.prefs; })
    .catch(e => { if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); });
}
function jhDaysClose(){ const box = document.getElementById('jh-days'); if (box) box.hidden = true; }
function jhDaysOpen(){ const box = document.getElementById('jh-days'); if (!box) return; box.hidden = false;
  const i = document.getElementById('jh-days-n'); if (i){ i.value = String(_jh.range); i.focus(); try { i.select(); } catch (_) {} } }
/* THE END CARD CLOSES (owner, 13 Oct 2026: "an x exit button … so that you can
   remove it from screen"): the ×, Esc, or a press beside the card; it comes
   back only when the next replay ends. */
function jhEndClose(){ const e = document.getElementById('jh-end'); if (e) e.hidden = true; }
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', e => {
  if (e.key !== 'Escape' || typeof state === 'undefined' || state.view !== 'jambo') return;
  const end = document.getElementById('jh-end'); if (end && !end.hidden){ end.hidden = true; e.preventDefault(); }
});
function jhDaysGo(){
  const i = document.getElementById('jh-days-n'), bad = document.getElementById('jh-days-bad'); if (!i) return;
  const d = Number(String(i.value).trim()), ok = jhDaysOk(d);
  i.setAttribute('aria-invalid', String(!ok)); if (bad) bad.hidden = ok; if (!ok) return;
  jhDaysClose(); jhSetRange(d);
}
function jhRepaint(){ if (typeof state !== 'undefined' && state.view === 'jambo') renderJamboHouse(); }
function jhReplayFromStart(play){
  _jh.t = play ? 0 : 1; _jh.pops = []; _jh.trails = []; _jh.log = []; jhLogPaint(); _jh.playing = !!play; _jh.last = 0; _jhScKey = '';
}
function jhPlayWord(){ return _jh.playing ? _jhT('jh_pause') : _jh.sel ? _jhT('jh_play_agent', { name: _jhT('ag_' + _jh.sel) }) : _jhT('jh_play'); }
function jhSetPlayWord(){ const b = document.querySelector('[data-jh-play]'); if (b) b.textContent = jhPlayWord(); const e = document.getElementById('jh-end'); if (e && _jh.playing) e.hidden = true; }
function jhWire(host){
  if (host.dataset.jhWired) return; host.dataset.jhWired = '1';
  host.addEventListener('click', e => {
    if (typeof state === 'undefined' || state.view !== 'jambo') return;
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    let el;
    if ((el = t.closest('[data-jh-ptab]'))){ _jh.ptab = el.getAttribute('data-jh-ptab') === 'points' ? 'points' : 'log';
      document.querySelectorAll('[data-jh-ptab]').forEach(b => b.setAttribute('aria-selected', String(b.getAttribute('data-jh-ptab') === _jh.ptab)));
      const lg = document.getElementById('jh-log'), pb = document.getElementById('jh-pbox'); if (lg) lg.hidden = _jh.ptab !== 'log'; if (pb) pb.hidden = _jh.ptab !== 'points'; jhFitPanel(); return; }
    if ((el = t.closest('[data-jh-tab]'))){ _jh.tab = el.getAttribute('data-jh-tab'); if (typeof placeSave === 'function') placeSave(); renderJamboHouse(); return; }
    if (!t.closest('#jh-days') && !t.closest('#jh-range')) jhDaysClose();
    if (t.closest('[data-jh-end-x]')){ jhEndClose(); return; }
    if (t.closest('[data-jh-points]')){ jhOpenPoints(); return; }
    if (t.closest('[data-jh-work]')){ if (typeof hbOpenAgent === 'function') hbOpenAgent(); return; }
    /* THE EDGE TAB SLIDES JAMBO IN BESIDE THE PAGE, and out on the same press (owner, 21 Oct 2026; ai.js aiSideToggle) */
    if (t.closest('[data-jh-jambo]')){ if (typeof aiSideToggle === 'function') aiSideToggle(); else if (typeof openAI === 'function') openAI(); return; }
    if (t.closest('.jh-end') && !t.closest('.jh-end-card')){ jhEndClose(); return; }
    if (t.closest('[data-jh-days-go]')){ jhDaysGo(); return; }
    if (t.closest('[data-jh-play]')){ if (_jh.playing){ _jh.playing = false; } else { if (_jh.t >= 1){ jhReplayFromStart(true); jhFeedFill(); } else _jh.playing = true; _jh.last = 0; } jhSetPlayWord(); jhKick(); return; }
    if (t.closest('[data-jh-restart]')){ jhReplayFromStart(true); jhFeedFill(); jhSetPlayWord(); jhKick(); return; }
    if ((el = t.closest('[data-jh-agent]'))){ const k = el.getAttribute('data-jh-agent'); _jh.sel = _jh.sel === k ? null : k; _jhScKey = '';
      host.querySelectorAll('[data-jh-agent]').forEach(b => { const on = b.getAttribute('data-jh-agent') === _jh.sel; b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on)); });
      jhFeedFill(); jhSetPlayWord(); jhKick(); return; }
    if (t.closest('#jh-one-x')){ const i = document.getElementById('jh-one'); if (i) i.value = ''; jhOnePick(''); return; }
  });
  host.addEventListener('pointerdown', e => { const b = e.target && e.target.closest && e.target.closest('[data-jh-one]'); if (b){ e.preventDefault(); jhOnePick(b.getAttribute('data-jh-one')); } });
  host.addEventListener('focusin', e => { if (e.target && e.target.id === 'jh-one'){ try { e.target.select(); } catch (_) {} _jhOneAct = 0; jhOnePaintList(); } });
  host.addEventListener('focusout', e => { if (e.target && e.target.id === 'jh-one') setTimeout(jhOneShow, 0); });
  host.addEventListener('change', e => { const id = e.target && e.target.id;
    const lvk = e.target && e.target.getAttribute && e.target.getAttribute('data-jh-lv');
    if (lvk){ const v = e.target.value || null;
      Promise.resolve(agentLevelMineSet(lvk, v)).then(ok => { if (!ok) return; _jhScKey = '';
        if (typeof toast === 'function') toast(_jhT('ag_lv_saved', { lv: _jhT('st_agents_lv_' + agLevelOf(lvk)) }), 'ok');
        jhKick(); },
      err => { if (typeof toast === 'function') toast(_jhT('st_pref_failed') + ' ' + ((err && err.message) || ''), 'err'); _jhScKey = ''; });
      return; }
    if (id === 'jh-look') jhSetLook(Number(e.target.value) === 1 ? 1 : 0);
    else if (id === 'jh-speed'){ const v = Number(e.target.value); if (JH_SPEEDS.includes(v)){ _jh.speed = v; if (typeof placeSave === 'function') placeSave(); } }
    else if (id === 'jh-range'){ const v = e.target.value;
      if (v === 'custom'){ e.target.value = String(_jh.range); jhDaysOpen(); return; }
      jhDaysClose(); jhSetRange(Number(v) || 30); } });
  host.addEventListener('input', e => { if (e.target && e.target.id === 'jh-one'){ _jhOneAct = 0; jhOnePaintList(); } });
  host.addEventListener('keydown', e => {
    if (e.target && e.target.id === 'jh-days-n'){ if (e.key === 'Enter'){ e.preventDefault(); jhDaysGo(); } else if (e.key === 'Escape'){ e.preventDefault(); jhDaysClose(); } return; }
    if (!e.target || e.target.id !== 'jh-one') return;
    const hits = jhOneMatches(e.target.value);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); _jhOneAct = (_jhOneAct + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % Math.max(1, hits.length); jhOnePaintList(); }
    else if (e.key === 'Enter'){ e.preventDefault(); if (!e.target.value.trim()) jhOnePick(''); else if (hits[_jhOneAct]) jhOnePick(hits[_jhOneAct].id); }
    else if (e.key === 'Escape'){ e.preventDefault(); e.target.blur(); jhOneShow(); }
  });
  host.addEventListener('mousemove', e => {
    const cv = e.target && e.target.id === 'jh-cv' ? e.target : null, tip = document.getElementById('jh-tip');
    if (!cv){ if (_jh.hover){ _jh.hover = null; if (tip) tip.hidden = true; jhKickOnce(); } return; }
    const b = cv.getBoundingClientRect(), x = (e.clientX - b.left) * _jhW / b.width, y = (e.clientY - b.top) * _jhH / b.height;
    const lk = jhLinkAt(x, y), k = lk ? 'wait:' + lk : jhRoomAt(x, y);
    if (k !== _jh.hover){ _jh.hover = k; jhKickOnce(); }
    cv.style.cursor = k && k !== 'stairs' ? 'pointer' : 'default';
    if (!tip) return; if (!k){ tip.hidden = true; return; }
    tip.innerHTML = jhTipHtml(k); tip.hidden = false;
    const sb = cv.parentElement.getBoundingClientRect(), tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = e.clientX - sb.left + 16, top = e.clientY - sb.top + 16;
    if (left + tw > sb.width - 8) left = e.clientX - sb.left - tw - 16; if (top + th > sb.height - 8) top = Math.max(8, sb.height - th - 8);
    tip.style.left = Math.max(8, left) + 'px'; tip.style.top = top + 'px';
  });
  host.addEventListener('mouseleave', () => { if (_jh.hover){ _jh.hover = null; const tip = document.getElementById('jh-tip'); if (tip) tip.hidden = true; jhKickOnce(); } }, true);
  host.addEventListener('click', e => {
    /* "N waiting for you": lands on the Board's Jambo's work card, that agent's work open below it */
    if (e.target && e.target.id === 'jh-cv' && String(_jh.hover || '').startsWith('wait:')){ const k = _jh.hover.slice(5);
      if (typeof hbOpenAgent === 'function') hbOpenAgent(k === 'desk' ? null : k); return; }
    if (e.target && e.target.id === 'jh-cv' && _jh.hover && _jhRooms.some(r => r.k === _jh.hover)){
    const b = document.querySelector(`[data-jh-agent="${_jh.hover}"]`); if (b){ b.click(); try { b.scrollIntoView({ block: 'nearest' }); } catch (_) {} } } });
}
/* A still house is drawn again once after a hover moved, then waits. */
function jhKickOnce(){ if (!_jh.playing && !_jh.raf) jhFrame(typeof performance !== 'undefined' ? performance.now() : 0); }
function jhRoomAt(x, y){
  for (const r of _jhRooms){ const c = r.card; if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return r.k; }
  for (const s of [..._jhShared, ...(_jhDesk ? [_jhDesk] : [])]){ const c = s.card; if (x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h) return 'rm:' + s.id; }
  if (Math.abs(x - JH_SX) <= 26 && y >= jhLY(_jhF - 1) - _jhFH && y <= jhLY(0)) return 'stairs';
  return null;
}
function jhTipHtml(k){
  if (String(k).startsWith('wait:')) return `<b>${_jhE(_jhT('jh_wait_open'))}</b><p>${_jhE(_jhT('jh_wait_open_p'))}</p>`;
  if (k === 'stairs') return `<b>${_jhE(_jhT('jh_stairs'))}</b><p>${_jhE(_jhT('jh_tip_stairs'))}</p>`;
  if (String(k).startsWith('rm:')){ const id = k.slice(3), n = id === 'desk' || id === 'reception' ? null : jhSheetsIn(id, _jh.t);
    return `<b>${_jhE(_jhT('jh_rm_' + id))}</b><p>${_jhE(_jhT('jh_tip_rm_' + id))}</p>${n != null ? `<p>${_jhE(_jhT('jh_tip_rm_n', { n: _jhFmt(n) }))}</p>` : ''}`; }
  const r = _jhRooms.find(x => x.k === k), s = agPointsTally(k, jhPieces(), jhUpto()), v = agPointsOf(k);
  return `<div class="jh-tip-h"><span class="jh-dot" style="background:${r.col}"></span><b>${_jhE(_jhT('jh_room_' + k))}</b><span>${_jhE(_jhT('ag_' + k))}</span></div>
    <p>${_jhE(_jhT('ag_' + k + '_does'))}</p>
    <p class="jh-route"><b>${_jhE(_jhT('jh_tip_route'))}</b> ${_jhE([...jhRouteOf(k).map(id => _jhT('jh_rm_' + id)), _jhT('jh_rm_desk')].join(' → '))}</p>
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
    ? `<div class="ag-pt-foot"><span class="st-note">${_jhE(_jhT('jh_pt_foot_admin'))}</span>${anyNew ? `<button type="button" class="ui-btn ui-btn-primary ui-btn-sm" data-ag-pt-saveall>${_jhE(_jhT('jh_pt_save_new'))}</button>` : ''}</div>
       <div class="ag-pt-foot"><span></span><span><button type="button" class="ui-btn ui-btn-sm" data-ag-rebuild>${_jhE(_jhT('jh_rb_btn'))}</button> <button type="button" class="ui-link" data-ag-rebuild-undo>${_jhE(_jhT('jh_rb_undo'))}</button></span></div>`
    : `<div class="ag-pt-foot"><span class="st-note">${_jhE(_jhT('jh_pt_foot_mine'))}</span>${anyMine ? `<button type="button" class="ui-btn ui-btn-sm" data-ag-pt-allback>${_jhE(_jhT('jh_pt_all_back'))}</button>` : ''}</div>`;
  return `<div class="ag-pt" data-ag-pt-mode="${mode}"><style>${AG_PT_CSS}</style><p class="st-note">${_jhE(_jhT(company ? 'jh_pt_sub_admin' : 'jh_pt_sub_mine'))}</p>
    <div class="ag-pt-tw"><table class="ag-pt-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>${foot}</div>`;
}
/* THE AGENTS' PAST, REBUILT (owner, 13 Oct 2026): an admin's one-off catch-up
   from Settings → Jambo's agents. A preview first (POST /api/agents/rebuild
   {dry}) shows what the records hold per agent; Rebuild writes it, marked as
   rebuilt; Remove takes every rebuilt piece out again. */
async function jhRebuildAsk(btn){
  const say = (m, k) => { if (typeof toast === 'function') toast(m, k || 'ok'); };
  let pre = null;
  try { if (typeof busySet === 'function') busySet(btn, _jhT('jh_rb_btn')); pre = await api('agents/rebuild', 'POST', { dry: true }); }
  catch (e){ say((e && e.message) || String(e), 'err'); return; }
  finally { btn.textContent = _jhT('jh_rb_btn'); }
  if (!pre || !pre.total){ say(_jhT('jh_rb_none'), 'warn'); return; }
  let from = String(pre.from || '').slice(0, 10); try { from = new Date(pre.from).toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_) {}
  const rows = Object.keys(pre.byAgent || {}).map(k => { const o = pre.byAgent[k]; return '• ' + _jhT('jh_rb_row', { name: _jhT('ag_' + k), n: o.found, used: o.used, changed: o.changed, thrown: o.thrown, waiting: o.waiting }); }).join('\n');
  const ok = (typeof confirmDialog === 'function') ? await confirmDialog({ title: _jhT('jh_rb_title'), message: _jhT('jh_rb_lead', { from }) + '\n\n' + rows, multiline: true, confirmLabel: _jhT('jh_rb_go') }) : true;
  if (!ok) return;
  try { const r = await api('agents/rebuild', 'POST', {}); _jh.data = null; say(_jhT('jh_rb_done', { n: r.written || 0 })); jhRepaint(); }
  catch (e){ say((e && e.message) || String(e), 'err'); }
}
async function jhRebuildUndoAsk(){
  const say = (m, k) => { if (typeof toast === 'function') toast(m, k || 'ok'); };
  let n = 0; try { const pre = await api('agents/rebuild', 'POST', { dry: true }); n = (pre && pre.already) || 0; } catch (_) { n = 0; }
  if (!n){ say(_jhT('jh_rb_undone', { n: 0 }), 'warn'); return; }
  const ok = (typeof confirmDialog === 'function') ? await confirmDialog({ title: _jhT('jh_rb_undo_title'), message: _jhT('jh_rb_undo_lead', { n }), confirmLabel: _jhT('jh_rb_undo_go'), danger: true }) : true;
  if (!ok) return;
  try { const r = await api('agents/rebuild', 'POST', { undo: true }); _jh.data = null; say(_jhT('jh_rb_undone', { n: r.removed || 0 })); jhRepaint(); }
  catch (e){ say((e && e.message) || String(e), 'err'); }
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
    if ((el = t.closest('[data-ag-rebuild]'))){ jhRebuildAsk(el); return; }
    if ((el = t.closest('[data-ag-rebuild-undo]'))){ jhRebuildUndoAsk(el); return; }
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
  .jh-wrap{display:flex;align-items:flex-start;min-height:var(--view-h)}
  .jh-wrap > .jh-page{flex:1 1 auto;min-width:0}
  .jh-jambo{flex:none;width:46px;position:sticky;top:0;height:var(--view-h,calc(100vh - 48px))}
  .jh-page .sap-band{padding-top:var(--page-pad-t);display:flex;flex-direction:column;gap:var(--s-2);padding-bottom:0}
  .jh-head{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--s-3);flex-wrap:wrap}
  .jh-t{margin:0;font-family:var(--font-title);font-size:20px;font-weight:var(--w-title-serif);letter-spacing:-.01em;line-height:1.2;color:var(--color-text)}
  .jh-acts{display:flex;align-items:center;gap:var(--s-2);flex:none}
  .jh-tabbar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:0 var(--s-4)}
  .jh-tabs{display:flex;gap:4px;overflow-x:auto;flex:0 1 auto;min-width:0}
  .jh-fb{display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:var(--s-2);margin-left:auto;padding:var(--s-1) 0}
  .jh-box{display:inline-flex;align-items:center;height:var(--ctl-h,32px);box-sizing:border-box;padding:0 0 0 var(--s-2);border:1px solid var(--chip-edge,var(--color-divider));border-radius:var(--radius);background:var(--color-surface);cursor:pointer;min-width:0}
  .jh-box:hover{border-color:var(--color-neutral-400)}
  .jh-box:focus-within{box-shadow:0 0 0 2px color-mix(in srgb,var(--color-accent) 22%,transparent)}
  .jh-box-l{color:var(--color-neutral-600);white-space:nowrap;margin-right:4px}
  .jh-box-v:focus,.jh-box-v:focus-visible{outline:none;box-shadow:none}
  .jh-box-l::after{content:":"}
  .jh-box-v{border:0;background:none;font:inherit;color:var(--color-text);font-weight:var(--w-label);height:100%;padding:0 6px 0 0;cursor:pointer;outline:none;max-width:200px}
  .jh-rangewrap{position:relative;display:inline-flex;align-items:center;gap:6px}
  .jh-range-wait[hidden]{display:none}
  .jh-rangewrap .jh-days{position:absolute;z-index:31;top:calc(100% + 4px);left:0;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);box-shadow:var(--shadow-pop,0 14px 32px -12px rgba(0,0,0,.25));padding:8px 10px;white-space:nowrap;flex-wrap:wrap;max-width:min(420px,calc(100vw - 32px))}
  .jh-rangewrap .jh-days[hidden]{display:none}
  .jh-tab{border:0;background:none;padding:9px 12px;cursor:pointer;border-bottom:2px solid transparent;color:var(--color-neutral-600);font:inherit;font-weight:var(--w-label);white-space:nowrap}
  .jh-tab[aria-selected="true"]{color:var(--color-accent);border-bottom-color:var(--color-accent)}
  .jh-quiet{color:var(--color-neutral-600);font-weight:400}
  .jh-body{padding:var(--s-4) 0 var(--s-6);display:flex;flex-direction:column;gap:var(--s-3);min-width:0}
  .jh-lbl{font-size:var(--t-label);color:var(--color-neutral-600)}
  .jh-days{display:inline-flex;align-items:center;gap:6px}
  .jh-days input{width:64px;height:var(--ctl-h-sm,28px);font:inherit;padding:0 6px;border:1px solid var(--btn-edge,var(--color-divider));border-radius:var(--radius);background:var(--color-surface);color:var(--color-text);font-variant-numeric:tabular-nums}
  .jh-days input[aria-invalid="true"]{border-color:var(--color-danger,#b42318)}
  .jh-days-bad{font-size:12px;color:var(--color-danger,#b42318)}
  .jh-play{min-width:84px}
  .jh-prog{flex:1 1 140px;height:6px;border-radius:3px;background:var(--color-divider);overflow:hidden;min-width:90px}
  .jh-prog i{display:block;height:100%;width:0;background:var(--st-amber-dot)}
  .jh-note{margin:0;font-size:var(--t-label);color:var(--color-neutral-600)}
  .jh-combo{position:relative;flex:none;width:250px;max-width:100%;padding:0;cursor:text}
  .jh-combo input{width:100%;height:100%;box-sizing:border-box;font:inherit;border:0;border-radius:var(--radius);padding:0 28px 0 30px;background:none;color:var(--color-text);outline:none}
  .jh-combo:has(input.has){border-color:var(--color-accent)}
  .jh-combo input.has{font-weight:var(--w-label)}
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
  .jh-housecard{background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);overflow:hidden;min-width:0}
  .jh-sh{display:flex;align-items:center;gap:8px 10px;padding:8px 12px;border-bottom:1px solid var(--color-divider)}
  .jh-stage{position:relative;background:var(--color-surface);overflow:hidden;min-width:0}
  .jh-stage canvas{display:block;width:100%;height:auto}
  .jh-tip{position:absolute;z-index:5;width:310px;max-width:calc(100% - 16px);background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:12px 14px;box-shadow:var(--shadow-pop,0 14px 34px -12px rgba(0,0,0,.25));font-size:var(--t-meta);pointer-events:none}
  .jh-tip p{margin:6px 0;color:var(--color-neutral-600)}
  .jh-tip-h{display:flex;align-items:center;gap:8px}.jh-tip-h span:last-child{margin-left:auto;color:var(--color-neutral-600);font-size:var(--t-label)}
  .jh-tip dl{display:grid;grid-template-columns:auto 1fr;gap:3px 10px;margin:6px 0}.jh-tip dt{color:var(--color-neutral-600)}.jh-tip dd{margin:0}
  .jh-dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:1px}
  .jh-sum{background:var(--color-neutral-100);border-radius:var(--radius);padding:7px 9px;font-variant-numeric:tabular-nums;font-weight:var(--w-strong);font-size:var(--t-meta)}
  .jh-sum small{display:block;font-weight:var(--w-label);color:var(--color-quiet);font-size:11px;margin-bottom:2px}
  .jh-sum span{display:block;font-weight:400;color:var(--color-quiet);font-size:11px;margin-top:2px}
  .jh-end{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--color-bg) 70%,transparent)}
  .jh-end[hidden]{display:none}
  .jh-end-card{position:relative;background:var(--color-surface);border:1px solid var(--color-divider);border-radius:var(--radius-lg);padding:20px 24px;text-align:center;max-width:340px;box-shadow:var(--shadow-pop,0 18px 40px -14px rgba(0,0,0,.25))}
  .jh-end-card h3{font-size:22px;font-weight:var(--w-title);margin:6px 0 2px}
  .jh-end-card p{margin:4px 0 10px;color:var(--color-neutral-600)}
  .jh-end-face{border-radius:50%}
  .jh-end-card .jh-end-r{color:var(--color-text);font-weight:var(--w-label);font-size:var(--t-meta)}
  .jh-end-x{position:absolute;top:8px;right:8px;width:28px;height:28px;display:flex;align-items:center;justify-content:center;border:1px solid transparent;border-radius:var(--radius);background:none;color:var(--color-neutral-600);font-size:20px;line-height:1;cursor:pointer}
  .jh-end-x:hover{border-color:var(--color-divider);color:var(--color-text);background:var(--color-neutral-100)}
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
  .jh-ptabs{display:flex;gap:4px;border-bottom:1px solid var(--color-divider);flex:none}
  .jh-ptab{border:0;background:none;padding:6px 10px;cursor:pointer;border-bottom:2px solid transparent;color:var(--color-neutral-600);font:inherit;font-size:var(--t-meta);font-weight:var(--w-label);white-space:nowrap}
  .jh-ptab[aria-selected="true"]{color:var(--color-accent);border-bottom-color:var(--color-accent)}
  .jh-log{display:flex;flex-direction:column;overflow-y:auto;overscroll-behavior:contain;max-height:420px;font-size:var(--t-label);padding-right:4px}
  .jh-log-l{display:grid;grid-template-columns:1fr;gap:1px;padding:7px 0;border-top:1px solid var(--color-divider);color:var(--color-neutral-600);line-height:1.4}
  .jh-log-l:first-child{border-top:0}
  .jh-log-l b{color:var(--color-text);font-weight:var(--w-strong)}
  .jh-log-t{font-variant-numeric:tabular-nums;font-size:11.5px}
  .jh-log-l .jh-dot{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:6px;vertical-align:0}
  .jh-log-rd{font-size:11px;border:1px solid var(--color-divider);border-radius:999px;padding:0 6px}
  .jh-pbox{display:flex;flex-direction:column;gap:10px;min-height:0}
  .jh-pbox[hidden],.jh-log[hidden]{display:none}
  .jh-rows{display:flex;flex-direction:column;gap:8px;overflow-y:auto;overscroll-behavior:contain;padding:2px 4px 2px 0;scroll-snap-type:y proximity;max-height:420px}
  .jh-row{display:grid;grid-template-columns:28px minmax(0,1fr) auto;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--radius-lg);cursor:pointer;border:1px solid var(--color-divider);background:var(--color-surface);flex:none;scroll-snap-align:start;text-align:left;font:inherit;color:var(--color-text)}
  .jh-row:hover{border-color:var(--color-accent)}
  .jh-row.on{border-color:var(--color-accent);background:var(--color-accent-50)}
  .jh-row canvas{width:28px;height:28px}
  .jh-row-t{min-width:0;display:flex;flex-direction:column}
  .jh-row-n{font-weight:var(--w-strong);font-size:var(--t-meta);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-row-d{font-size:11.5px;color:var(--color-quiet);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jh-row-p{font-variant-numeric:tabular-nums;font-weight:var(--w-title)}
  .jh-sc{border-top:1px solid var(--color-divider);padding-top:10px;display:flex;flex-direction:column;gap:8px;flex:none}
  .jh-sc-h{margin:0;font-size:var(--t-meta);font-weight:var(--w-strong);display:flex;justify-content:space-between;gap:8px}
  .jh-sc-h{align-items:center;flex-wrap:wrap}
  .jh-lv{display:flex;flex:1 1 100%;align-items:center;gap:8px;font-weight:400;color:var(--color-neutral-600);min-width:0}
  .jh-lv>span{white-space:nowrap}
  .jh-lv select{flex:1 1 auto;min-width:0;height:var(--ctl-h-sm);font-size:var(--t-meta)}
  .jh-mix{display:flex;height:8px;border-radius:4px;overflow:hidden;background:var(--color-divider)}
  .jh-mix i{display:block;height:100%}
  .jh-mix .u,.jh-legend .u,.jh-sw.u{background:var(--st-green-dot)} .jh-mix .c,.jh-legend .c,.jh-sw.c{background:var(--st-amber-dot)} .jh-mix .t,.jh-legend .t,.jh-sw.t{background:var(--st-ruby-dot)}
  .jh-legend{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11.5px;color:var(--color-quiet)}
  .jh-legend b{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px}
  .jh-kpis{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .jh-res{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin-top:6px}
  .jh-res > div{border:1px solid var(--color-divider);border-radius:var(--radius);padding:6px 8px;min-width:0}
  .jh-res b{display:block;font-size:15px;font-weight:var(--w-strong);font-variant-numeric:tabular-nums}
  .jh-res small{display:block;color:var(--color-quiet);font-size:11px;line-height:1.25}
  .jh-kpis > div{background:var(--color-neutral-100);border-radius:var(--radius);padding:7px 9px;min-width:0}
  .jh-kpis small{display:block;color:var(--color-quiet);font-size:11px}
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

Object.assign(window, { jhAgentColour, jhLevelPickHtml, jhWaitNow, jhLinkAt, jhLinks: () => _jhLinks.slice(), jhJamboDoorHtml, AG_POINTS_LAUNCH, AG_POINTS_START_MINS, AG_POINTS_NEW_MINS, AG_POINTS_FIELDS, agPointsKeys, agPointsStart, agPointsCompany, agPointsMine, agPointsOf,
  agPointsIsNew, agPointsEach, agPointsTally, agPointsSumLine, agPieceSay, agPointsTableHtml, agPointsWire, renderJamboHouse, jhRepaint, jhPlace, jhPlacePut, jhLayout, jhRoomAt, jhFloorCounts, jhGeom, jhFinish, jhUptoFor, jhHoursWords, jhPopsSoft: () => _jh.pops.filter(p => p.soft).length, jhMotionOf: (k, t) => { const r = _jhRooms.find(x => x.k === k); return r ? jhPosAt(r, t) : null; }, jhPopRef, jhRoomQuietWhy, jhRoomStateWords, jhResults, jhUnitWords, jhSheetsIn, JH_ROUTE, _jhPlaying: () => _jh.playing, jhOverlapAudit,
  jhOfficeOf: () => ({ floors: _jhF, desk: _jhDesk && { f: _jhDesk.f, x0: _jhDesk.card.x, x1: _jhDesk.card.x + _jhDesk.card.w }, shared: _jhShared.map(s => ({ id: s.id, f: s.f })), rooms: _jhRooms.map(r => ({ k: r.k, f: r.f, reading: !!r.reading })) }) });


/* ═══ JAMBO'S AGENTS, THE NEW LOOK (round 7, second half, as drawn; behind the admin's "Try the new look") ═══
   One white page: the title with the tabs beside it (The house · Agents · Jobs · How points work) and the period
   and the look as grey pills on the right; Jambo's panel beside it in place of the folded strip. AGENTS is the list
   as drawn: what each did this week, MAY HE — On his own · Ask me first · Never (the owner's mapping, 1 Nov 2026:
   On his own = Just do it, still the admin's and only where an agent may act alone; Never = I'll do it myself) —
   and its points. A person moves an agent DOWN for themselves (agentLevelMineSet); On his own opens the admin's own
   setting (Settings › Jambo's agents), never written from here. */
function jhnOn(){ return typeof window.newLookOn === 'function' && newLookOn() && typeof insFits === 'function' && insFits() && typeof insPaintPanel === 'function'; }
const JHN_TABS = ['house', 'agents', 'jobs', 'how'];
function jhnWeek(){ const from = Date.now() - 7 * 864e5; return ((_jh.data && _jh.data.pieces) || []).filter(p => (Date.parse(p.at || '') || 0) >= from); }
function jhnHeadHtml(){
  const keys = agPointsKeys(), wk = jhnWeek();
  const facts = _jh.tab === 'agents' ? [_jhTn('jhn_agents_n', keys.length, { n: keys.length }), _jhTn('jhn_pieces_week', wk.length, { n: wk.length })].join(' \u00b7 ') : '';
  const tab = t => `<button type="button" role="tab" class="jhn-tab" data-jh-tab="${t}" aria-selected="${_jh.tab === t}">${_jhE(_jhT(t === 'agents' ? 'jhn_tab_agents' : 'jh_tab_' + t))}${t === 'jobs' ? ` <span>${keys.length}</span>` : ''}</button>`;
  return `<div class="jhn-head"><h2 class="ctf-h">${_jhE(_jhT('nav_jambo'))}</h2>${facts ? `<span class="ctf-hf">${_jhE(facts)}</span>` : ''}<div class="jhn-tabs" role="tablist">${JHN_TABS.map(tab).join('')}</div><span class="ctf-sp"></span>`
    + `${_jh.tab === 'agents' || _jh.tab === 'how' ? '' : jhFiltersHtml()}<button type="button" class="ui-btn jhn-pill" data-jh-points>${_jhE(_jhT('jh_change_points'))}</button></div>`;
}
/* what one agent did this week, in the list's words: its pieces, how many you decided, how many wait */
function jhnWeekSaid(k){
  const L = jhnWeek().filter(p => p.agent === k); if (!L.length) return _jhT('jhn_week_none');
  const open = L.filter(p => !p.outcome).length, done = L.length - open;
  return [_jhTn('jhn_week_pieces', L.length, { n: L.length }), done ? _jhTn('jhn_week_decided', done, { n: done }) : '', open ? _jhTn('jhn_week_wait', open, { n: open }) : ''].filter(Boolean).join(' \u00b7 ');
}
/* MAY HE: the three, the one in force pressed; what this reader may not choose is grey with its reason */
function jhnMayHtml(k){
  if (typeof AG_READINGS !== 'undefined' && Array.isArray(AG_READINGS) && AG_READINGS.includes(k)) return `<span class="jhn-reads">${_jhE(_jhT('jh_reads_only'))}</span>`;
  const now = (typeof agLevelOf === 'function') ? agLevelOf(k) : 'ask', co = (typeof agLevelCo === 'function') ? agLevelCo(k) : 'ask';
  const admin = typeof isAdmin === 'function' && isAdmin();
  /* the server lets only link-only acts run alone (AGENT_AUTO_OK, server/server.js): the link agent */
  const autoOk = k === 'link';
  const rank = { auto: 0, ask: 1, mine: 2 };
  const why = v => v === 'auto' ? (!autoOk ? _jhT('jhn_why_auto_never') : !admin ? _jhT('jhn_why_auto_admin') : '') : (rank[v] < rank[co] ? _jhT('jhn_why_up', { lv: _jhT('st_agents_lv_' + co) }) : '');
  const b = (v, w) => { const no = why(v); return `<button type="button" data-jhn-may="${_jhE(k)}" data-jhn-lv="${v}" aria-pressed="${now === v}"${no ? ` disabled title="${_jhE(no)}"` : ''}>${_jhE(_jhT(w))}</button>`; };
  return `<span class="jhn-seg" role="group" aria-label="${_jhE(_jhT('jhn_c_may'))}">${b('auto', 'jhn_lv_auto')}${b('ask', 'jhn_lv_ask')}${b('mine', 'jhn_lv_mine')}</span>`;
}
function jhnAgentsHtml(){
  if (!_jh.data) return jhHouseHtml();
  const pieces = jhPieces();
  const rows = agPointsKeys().map(k => `<tr data-jhn-row="${_jhE(k)}"><td><div class="cun-name"><i class="jhn-dot" aria-hidden="true"></i>${_jhE(_jhT('ag_' + k))}</div><div class="cun-sub">${_jhE(_jhT('ag_' + k + '_does'))}</div></td>`
    + `<td class="jhn-wk">${_jhE(jhnWeekSaid(k))}</td><td>${jhnMayHtml(k)}</td><td class="n">${_jhFmt(agPointsTally(k, pieces, Infinity).pts)}</td></tr>`).join('');
  return `<div class="cu-scroll"><table class="apn-table cun-table jhn-table"><colgroup><col style="width:34%"><col><col style="width:268px" data-floor="268"><col style="width:72px" data-floor="72"></colgroup>
    <thead><tr><th>${_jhE(_jhT('jh_col_agent'))}</th><th>${_jhE(_jhT('jhn_c_week'))}</th><th>${_jhE(_jhT('jhn_c_may'))}</th><th class="n">${_jhE(_jhT('jhn_c_points'))}</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="apn-foot rdn-foot"><span>${_jhE(_jhT('jhn_foot'))}</span><button type="button" class="rfp-a" data-jh-tab="house">${_jhE(_jhTn('jhn_foot_log', jhnWeek().length, { n: jhnWeek().length }))}</button></div>`;
}
function jhnPanelHtml(){
  const E = _jhE, wk = jhnWeek(), keys = agPointsKeys();
  const open = wk.filter(p => !p.outcome), put = wk.filter(p => p.outcome === 'thrown').length, done = wk.length - open.length;
  const lv = keys.filter(k => !(typeof AG_READINGS !== 'undefined' && AG_READINGS.includes(k))).map(k => (typeof agLevelOf === 'function') ? agLevelOf(k) : 'ask');
  const allAsk = lv.length && lv.every(v => v === 'ask');
  const row = (l, v, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(v)}</b><i>${E(src || '')}</i></div>`;
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${E(w)}</button><span>${E(cost)}</span></div>`;
  if (_jh.tab === 'agents'){
    const head = (allAsk ? _jhTn('jhn_p_all_ask', lv.length, { n: lv.length }) + ' ' : '') + _jhT('jhn_p_week', { n: wk.length, d: done, a: put, w: open.length });
    const by = {}; open.forEach(p => { by[p.agent] = (by[p.agent] || 0) + 1; });
    const waits = Object.keys(by).map(k => row(_jhT('ag_' + k), _jhTn('jhn_p_waits_n', by[k], { n: by[k] }), '')).join('');
    return `<div class="pd2-chosen cun-panel jhn-panel"><p class="pd2-ch-head">${E(head)}</p>${waits ? `<div class="pd2-ch-cap">${E(_jhT('jhn_p_waits'))}</div><div class="pd2-ch-tbl">${waits}</div>` : ''}`
      + `<div class="pd2-ch-cap">${E(_jhT('jhn_p_ladder'))}</div><p class="stn-pp">${E(_jhT('jhn_p_ladder_s'))}</p>`
      + `<div class="pd2-ch-cap">${E(_jhT('pd2_ch_doors'))}</div>${door('data-jh-tab="house"', _jhT('jhn_d_log'), _jhT('pd2_ch_free'))}${typeof isAdmin === 'function' && isAdmin() ? door('data-jh-points', _jhT('jhn_d_points'), _jhT('pd2_ch_free')) : ''}</div>`;
  }
  const lead = open.length ? _jhTn('jhn_p_desk', open.length, { n: open.length }) : _jhT('jhn_p_desk_none');
  return `<div class="pd2-chosen cun-panel jhn-panel"><div class="cn2-jcard"><p>${E(lead)}</p><small>${E(_jhT('jhn_p_desk_src'))}</small></div>`
    + `<div class="pd2-ch-cap">${E(_jhT('jhn_p_house'))}</div><p class="stn-pp">${E(_jhT('jhn_p_house_s'))}</p>`
    + `<div class="pd2-ch-cap">${E(_jhT('pd2_ch_doors'))}</div>${door('data-jhn-board', _jhT('jhn_d_board'), _jhT('pd2_ch_free'))}${typeof isAdmin === 'function' && isAdmin() ? door('data-jh-points', _jhT('jhn_d_points'), _jhT('pd2_ch_free')) : ''}${door('data-jh-tab="agents"', _jhT('jhn_d_never'), _jhT('pd2_ch_free'))}</div>`;
}
/* MAY HE pressed: down for oneself through the person's own writer; On his own opens the admin's own setting */
async function jhnMaySet(k, v){
  if (v === 'auto'){ if (typeof openSettingsAt === 'function') openSettingsAt('company', 'agents'); return; }
  const co = (typeof agLevelCo === 'function') ? agLevelCo(k) : 'ask';
  try { const ok = await agentLevelMineSet(k, v === co ? null : v); if (!ok) return;
    if (typeof toast === 'function') toast(_jhT('ag_lv_saved', { lv: _jhT('st_agents_lv_' + agLevelOf(k)) }), 'ok');
    renderJamboHouse(); }
  catch (err){ if (typeof toast === 'function') toast(_jhT('st_pref_failed') + ' ' + ((err && err.message) || ''), 'err'); }
}
if (typeof document !== 'undefined' && !document._jhnWired){ document._jhnWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t || typeof state === 'undefined' || state.view !== 'jambo') return; let el;
    if ((el = t.closest('[data-jhn-may]'))){ e.preventDefault(); if (!el.disabled) jhnMaySet(el.getAttribute('data-jhn-may'), el.getAttribute('data-jhn-lv')); return; }
    if (t.closest('[data-jhn-board]')){ e.preventDefault(); if (typeof caGo === 'function') caGo({ kind: 'go', place: 'board' }); }
  });
}
Object.assign(window, { jhnOn, JHN_TABS, jhnHeadHtml, jhnAgentsHtml, jhnPanelHtml, jhnMayHtml, jhnWeekSaid, jhnMaySet });
