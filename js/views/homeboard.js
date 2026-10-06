/* ============================================================
   HOME IS THE BOARD AND THE MAP (Young ruled 3 Oct 2026)
   ============================================================
   *"turn the explore page as a one page insights page ... I prompt and I get
   the KPIs dashboards to pop up and I continue to prompt and it give me more
   insights on the same screen"*, then, over eight rounds of the artifact
   "HaTi Live Board": it becomes the HOME PAGE; it lands on the headline
   numbers with Prepared by Copilot under them; Board | Explorer flips the same
   screen to the Explorer map as designed; Insights keeps its detailed tabs;
   the phone stays as it is; the screen has its own Dark | Light, landing on
   Dark, Light being "Frosted"; and nine features on top — what moved since
   you last looked, show these on the map, done while you were away, side by
   side, watch a number, give a panel to a colleague, present, the red pointer
   and the pen — and "bring up MK-106" gives the contract's whole card.

   THE PAGE IS EXPLORER'S OWN (renderIntel, on Home). The board COVERS the map
   the way Analyze Contract's paper does — it never replaces it — so the map
   keeps every view, recipe, fold, lens and pin it had on Insights, and the
   Copilot panel beside them is the one Explorer always had.

   COUNTING IS NOT DRAWING, the Insights rule: every `hb*Data` returns plain
   data and not one character of markup; every `hb*Html` draws what it is given
   and works nothing out. EVERY FIGURE IS BORROWED from the reading that owns
   it — the stages and the ninety days are Home's own (hmDashSlices' readings),
   the overdue are openObligations', whose move is negWhoseMove's, the side is
   paySide's, risk is exposureData's, friction is intelFrictionStats', payment
   terms are payTermsData's — so this board and the page each reading belongs
   to cannot disagree. NOTHING HERE WRITES TO A CONTRACT; the only thing it
   stores is this person's own board, in this browser, and a panel given to a
   colleague, which is a record on the server and never a permission.

   NO MODEL IS SPENT HERE. The free reader (hbParse) answers what it
   understands; everything else goes on to Explorer's own ask, which states
   its cost before the press. */

/* ---------------- what one person's board remembers ----------------
   Per person, per browser, the same shape every "where was I" in this app
   takes. A panel is remembered as WHAT WAS ASKED (its kind), never as a
   picture of its numbers — every paint counts it again, so a board opened on
   Monday shows Monday's figures. */
const HB_LS = 'hati.v1.homeBoard.';
const HB_FACES = ['board', 'explorer'];
const HB_LENSES = ['all', 'suppliers', 'customers'];
const HB_SCREENS = ['dark', 'light'];
const HB_PREP = ['open', 'folded', 'closed'];
/* The six headline figures, in the order the board draws them. `tone` is the
   colour of the meaning edge when the figure is above zero. */
const HB_FIGS = [
  { k: 'live',    word: 'hb_f_live',    tip: 'hb_f_live_tip',    tone: '' },
  { k: 'value',   word: 'hb_f_value',   tip: 'hb_f_value_tip',   tone: '', money: true },
  { k: 'ending',  word: 'hb_f_ending',  tip: 'hb_f_ending_tip',  tone: 'warn' },
  { k: 'past',    word: 'hb_f_past',    tip: 'hb_f_past_tip',    tone: 'bad' },
  { k: 'overdue', word: 'hb_f_overdue', tip: 'hb_f_overdue_tip', tone: 'bad' },
  { k: 'us',      word: 'hb_f_us',      tip: 'hb_f_us_tip',      tone: 'warn' },
];
const HB_FIG_KEYS = HB_FIGS.map(f => f.k);
/* The panels a question can put on the board. Each is a reading the named
   Insights tab already counts; `src` names that tab on the panel's head. */
const HB_KINDS = {
  obl:  { word: 'hb_k_obl',  src: 'int_obligations' },
  fric: { word: 'hb_k_fric', src: 'int_negotiation_friction' },
  ren:  { word: 'hb_k_ren',  src: 'pf_tab' },
  pay:  { word: 'hb_k_pay',  src: 'pt_tab' },
  exp:  { word: 'hb_k_exp',  src: 'int_exposure' },
  val:  { word: 'hb_k_val',  src: 'pf_tab' },
};
const HB_KIND_KEYS = Object.keys(HB_KINDS);
/* A board holds this many panels; asking for one more lets the oldest go.
   A CAP IS A FACT: the answer says which one left. */
const HB_PANELS_MAX = 8;
/* A dig-in walks at most this deep; the trail shows every step. */
const HB_PATH_MAX = 6;
/* A list inside a dig-in shows this many rows; the rest are counted and the
   door below opens them all. */
const HB_ROWS_MAX = 12;
/* Watched numbers, per person. */
const HB_WATCH_MAX = 10;

function hbUid(){
  const u = (typeof currentUser === 'function') ? currentUser() : null;
  return (u && u.id) || 'anon';
}
let _hbS = null, _hbSUid = null;
function hbFresh(){
  return { face: 'board', lens: 'all', panels: [], path: [], prep: 'open', screen: 'dark',
    watches: [], seen: null, saved: [], seq: 0, found: null, recipe: {}, digBig: false,
    ins: null, insKept: {}, insOff: {}, keptSent: '', why: {}, undo: [], undoSeq: 0, an: {} };
}
/* The board as this person left it. Read once per sitting and per person; a
   value that does not parse, or a word this version does not know, falls
   back to the fresh board rather than drawing something half-remembered. */
function hbS(){
  const uid = hbUid();
  if (_hbS && _hbSUid === uid) return _hbS;
  let v = null;
  try { v = JSON.parse(localStorage.getItem(HB_LS + uid) || 'null'); } catch (_){ v = null; }
  const s = hbFresh();
  if (v && typeof v === 'object'){
    if (HB_FACES.includes(v.face)) s.face = v.face;
    if (HB_LENSES.includes(v.lens)) s.lens = v.lens;
    if (HB_SCREENS.includes(v.screen)) s.screen = v.screen;
    if (HB_PREP.includes(v.prep)) s.prep = v.prep;
    /* a kept view is a question (q:) or a card Copilot built (cd:, its set in `which`) */
    if (Array.isArray(v.panels)) s.panels = v.panels.filter(p => p && (HB_KINDS[p.kind] || (p.kind === 'view' && typeof p.key === 'string' && /^(q|cd):/.test(p.key))))
      .slice(-HB_PANELS_MAX).map(p => p.kind === 'view'
        ? Object.assign({ id: String(p.id || ''), kind: 'view', key: p.key.slice(0, 300), title: String(p.title || '').slice(0, 120), shape: String(p.shape || '').slice(0, 20),
            recipe: (hbRecipeClean({ k: p.recipe || {} }).k) || null, split: false, big: !!p.big }, /^cd:/.test(p.key) ? { which: hbCardClean({ which: p.which }).which || { all: true } } : {})
        : { id: String(p.id || ''), kind: p.kind, split: !!p.split, big: !!p.big });
    /* THE DAY'S SHELF COMES BACK WHOLE (Young, 4 Oct 2026: "fix the shelf
       refresh fault"): an id is a shape or a shape's ".mine" (hbInsOf reads
       both), and the scope, the young book and the open usual pictures are
       part of the day's choice — dropping them kept the day's "yours"
       findings off the shelf until tomorrow */
    if (v.ins && typeof v.ins === 'object' && typeof v.ins.day === 'string' && Array.isArray(v.ins.list))
      s.ins = { day: v.ins.day, n: String(v.ins.n || ''), v: Number(v.ins.v) || 0, list: v.ins.list.filter(k => typeof k === 'string' && !!hbInsOf(k)).slice(0, HB_INS_MAX),
        scope: ['mine', 'few', 'co'].includes(v.ins.scope) ? v.ins.scope : 'co', young: !!v.ins.young,
        usual: typeof v.ins.usual === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v.ins.usual) ? v.ins.usual : null };
    if (v.insKept && typeof v.insKept === 'object') HB_INS_SHAPES.forEach(k => { if (Number(v.insKept[k]) > 0) s.insKept[k] = Math.min(20, Number(v.insKept[k])); });
    if (v.insOff && typeof v.insOff === 'object') HB_INS_SHAPES.forEach(k => { if (/^\d{4}-\d{2}-\d{2}$/.test(String(v.insOff[k] || ''))) s.insOff[k] = v.insOff[k]; });
    if (typeof v.keptSent === 'string') s.keptSent = v.keptSent.slice(0, 4000);
    if (Array.isArray(v.path)) s.path = v.path.filter(k => typeof k === 'string').slice(-HB_PATH_MAX);
    if (Array.isArray(v.watches)) s.watches = v.watches.filter(w => w && HB_FIG_KEYS.includes(w.k)
      && (w.dir === 'above' || w.dir === 'below') && isFinite(Number(w.n))).slice(0, HB_WATCH_MAX)
      .map(w => ({ k: w.k, dir: w.dir, n: Number(w.n) }));
    if (v.seen && typeof v.seen === 'object') s.seen = v.seen;
    if (Array.isArray(v.saved)) s.saved = v.saved.filter(x => x && x.name && Array.isArray(x.kinds)).slice(-6)
      .map(x => ({ name: String(x.name).slice(0, 60), kinds: x.kinds.filter(k => HB_KINDS[k]), lens: HB_LENSES.includes(x.lens) ? x.lens : 'all' }));
    s.seq = Number(v.seq) || s.panels.length;
    if (v.found && Array.isArray(v.found.ids)) s.found = { title: String(v.found.title || '').slice(0, 120), ids: v.found.ids.filter(x => typeof x === 'string').slice(0, 2000),
      chart: (hbRecipeClean({ k: v.found.chart || {} }).k) || null };
    /* the Chart · Bars · List switch of 3 Oct is the Picture now: read into
       the recipe as it loads, through the one cleaner */
    const old = {};
    if (v.digView && typeof v.digView === 'object') Object.entries(v.digView).forEach(([k, m]) => { if (typeof k === 'string' && (m === 'list' || m === 'bars')) old[k] = { pic: m }; });
    s.recipe = hbRecipeClean(Object.assign(old, v.recipe && typeof v.recipe === 'object' ? v.recipe : {}));
    s.digBig = !!v.digBig;
    /* Copilot's answers to "What could explain this?", kept per chart for the day */
    if (v.why && typeof v.why === 'object') Object.entries(v.why).slice(-12).forEach(([k, w]) => {
      if (typeof k === 'string' && w && typeof w.day === 'string' && typeof w.sig === 'string' && typeof w.text === 'string')
        s.why[k.slice(0, 300)] = { day: w.day.slice(0, 10), sig: w.sig.slice(0, 400), text: w.text.slice(0, 4000), dropped: Number(w.dropped) || 0, at: String(w.at || '').slice(0, 5), notice: String(w.notice || '').slice(0, 300) }; });
  }
  /* the analyst's runs (Dig deeper), kept for a refresh; one cut short by
     the refresh says so */
  if (v && v.an && typeof v.an === 'object') Object.entries(v.an).slice(-HB_DD_KEEP).forEach(([k, r]) => {
    if (!/^r[0-9a-z]{1,20}$/.test(k) || !r || typeof r !== 'object' || !Array.isArray(r.steps)) return;
    const txt = (x, n) => String(x == null ? '' : x).slice(0, n);
    const run = { id: k, q: txt(r.q, 400), state: ['done', 'empty', 'err'].includes(r.state) ? r.state : 'err', summary: txt(r.summary, 1500), dropped: Number(r.dropped) || 0,
      err: r.state === 'busy' ? i18t('hb_dd_stopped') : txt(r.err, 300), notice: txt(r.notice, 300), at: txt(r.at, 5), added: !!r.added,
      cards: Array.isArray(r.cards) ? r.cards.slice(0, 3).filter(c => c && typeof c === 'object').map(c => ({ which: hbCardClean({ which: c.which }).which || { all: true }, recipe: hbCardClean(c.recipe || {}), title: txt(c.title, HB_TITLE_MAX) })) : [],
      next: Array.isArray(r.next) ? r.next.filter(x => typeof x === 'string').slice(0, 3).map(x => x.slice(0, 120)) : [],
      steps: r.steps.slice(0, HB_DD_STEPS).filter(x => x && typeof x === 'object').map(x => ({ name: x.name === 'pack' ? 'pack' : 'calculate', why: txt(x.why, 200), title: txt(x.title, 160),
        lines: Array.isArray(x.lines) ? x.lines.filter(l => typeof l === 'string').slice(0, 4).map(l => _hbE(hbFactPlain(l).slice(0, 600))) : [],   /* read back as words, never as markup */
        ids: Array.isArray(x.ids) ? x.ids.filter(i => typeof i === 'string').slice(0, HB_DD_IDS_MAX) : [], n: Number(x.n) || 0, dig: /^pk:\w+$/.test(String(x.dig || '')) ? x.dig : '' })) };
    s.an[k] = run; });
  if (v && Array.isArray(v.undo)) s.undo = v.undo.filter(u => u && Number(u.n) > 0 && typeof u.shape === 'string' && u.shape.length < 400000).slice(-HB_UNDO_MAX).map(u => ({ n: Number(u.n), shape: u.shape }));
  if (v && Number(v.undoSeq) > 0) s.undoSeq = Number(v.undoSeq);
  _hbS = s; _hbSUid = uid; _hbShape = hbShapeOf(s);
  return s;
}
function hbSave(){
  const s = hbS();
  hbUndoMark(s);
  try { localStorage.setItem(HB_LS + hbUid(), JSON.stringify(s)); } catch (_){}
}
/* ---- ONE-PRESS UNDO (work order Part 5) ----
   ONE store, s.undo: the last HB_UNDO_MAX board states (cards, trail,
   recipes), written by ONE writer, here, before every board change —
   whatever made it: a press, the free reader or Copilot. Changes made in one
   go (five cards from one answer) are one step back. Kept on this person's
   own board record; trimmed to ten, unsaid (it holds only their own views). */
const HB_UNDO_MAX = 10;
let _hbShape = null, _hbUndoBusy = false, _hbUndoOpen = false;
function hbShapeOf(s){ return JSON.stringify({ panels: s.panels || [], path: s.path || [], recipe: s.recipe || {} }); }
function hbUndoMark(s){
  if (_hbUndoBusy) return;
  const now = hbShapeOf(s);
  if (_hbShape == null){ _hbShape = now; return; }
  if (now === _hbShape) return;
  if (!_hbUndoOpen){
    s.undoSeq = (Number(s.undoSeq) || 0) + 1;
    s.undo = (s.undo || []).concat([{ n: s.undoSeq, shape: _hbShape }]).slice(-HB_UNDO_MAX);
    /* one go = everything done before control returns (a microtask closes it) */
    _hbUndoOpen = true; Promise.resolve().then(() => { _hbUndoOpen = false; });
  }
  _hbShape = now;
}
function hbUndoTop(){ const u = hbS().undo || []; return u.length ? u[u.length - 1].n : 0; }
/* back to the board as it stood before step n (the latest when none named) */
function hbUndo(n){
  const s = hbS(), list = s.undo || [];
  const i = n == null ? list.length - 1 : list.findIndex(u => u.n === Number(n));
  if (i < 0) return false;
  let shape = null; try { shape = JSON.parse(list[i].shape); } catch (_){ shape = null; }
  if (!shape) return false;
  s.undo = list.slice(0, i);
  s.panels = Array.isArray(shape.panels) ? shape.panels : []; s.path = Array.isArray(shape.path) ? shape.path : []; s.recipe = shape.recipe && typeof shape.recipe === 'object' ? shape.recipe : {};
  _hbUndoBusy = true; try { hbSave(); } finally { _hbUndoBusy = false; }
  _hbShape = hbShapeOf(s);
  return true;
}
/* AN ANSWER'S PRESSES RIDE BESIDE ITS WORDS: the panel strips buttons from
   an answer's text (its wall), so Undo and a preview's ticks travel as the
   message's own fields, drawn by the panel through hbUndoHtml/hbPreviewHtml.
   The ask that made them collects them once (hbTakeMeta). */
let _hbMeta = null;
function hbTakeMeta(){ const m = _hbMeta; _hbMeta = null; return m || {}; }
/* an answer that changed the board carries Undo, back to before it */
function hbNoteUndo(since){
  const u = (hbS().undo || []).find(x => x.n > since);
  if (u) _hbMeta = Object.assign(_hbMeta || {}, { undo: u.n });
  return '';
}
function hbUndoHtml(n){ return `<div class="hb-undo-row"><button type="button" class="ui-link hb-undo" data-hb-undo="${_hbE(String(n))}">${_hbE(i18t('hb_undo'))}</button></div>`; }
function hbFace(){ return hbS().face; }

/* ---------------- the book, through the lens ----------------
   THE LENS IS paySide'S OWN READING — the category the record says, supplier
   or customer — so "suppliers only" here and the supplier half of the
   Payment terms tab are the same contracts. A contract that does not say is
   in neither lens, and the board says how many that is. */
function hbSideOf(c){ try { return (typeof paySide === 'function') ? paySide(c) : null; } catch (_){ return null; } }
function hbInLens(c, lens){
  if (!lens || lens === 'all') return true;
  return hbSideOf(c) === (lens === 'suppliers' ? 'supplier' : 'customer');
}
function hbMoneyOk(){ return (typeof canViewValues !== 'function') || !!canViewValues(); }
function hbBook(lens){
  return ((window.state && Array.isArray(state.contracts)) ? state.contracts : [])
    .filter(c => c && !c.archived && hbInLens(c, lens));
}
function hbValueOf(cs){
  /* fxHome's rule: what cannot be converted is LEFT OUT AND COUNTED. */
  let v = 0, left = 0;
  for (const c of cs){
    const h = (typeof fxHome === 'function') ? fxHome(c) : { v: Number(c.value || 0), missing: false };
    if (h && h.missing) left++; else v += (h && h.v) || 0;
  }
  return { v, left };
}
function hbDays(iso){
  if (!iso) return null;
  try { return (typeof daysUntil === 'function') ? daysUntil(String(iso).slice(0, 10)) : null; } catch (_){ return null; }
}
/* Waiting on us: a live negotiation whose move is ours — negWhoseMove's own
   word, the one the Negotiations list bands its rows by. */
function hbWaitingOnUs(cs){
  const ids = new Set(cs.map(c => c.id));
  let live = [];
  try { live = (typeof negoLiveList === 'function') ? negoLiveList() : []; } catch (_){ live = []; }
  return live.filter(c => c && ids.has(c.id) && !c.archived && (() => {
    try { return typeof negWhoseMove === 'function' && negWhoseMove(c).k === 'you'; } catch (_){ return false; }
  })());
}
/* Overdue: openObligations' own rows, late and on a contract in the lens. */
function hbOverdue(cs){
  const ids = new Set(cs.map(c => c.id));
  let rows = [];
  try { rows = (typeof openObligations === 'function') ? (openObligations() || []) : []; } catch (_){ rows = []; }
  return rows.filter(o => o && ids.has(o.cid) && o.days != null && o.days < 0);
}
/* THE SIX FIGURES AND THE STAGE BAR, for a lens. With the whole book this is
   Home's own reading (hmDashSlices counts the same predicates: live is not
   Declined, the ninety days are effectiveExpiry's across agreements, past is
   contractExpired's) — f447 pins the two equal. */
function hbBookData(lens, opts){
  const cs = (opts && opts.whole) ? hbBook(lens || 'all') : hbCounted(lens || 'all');
  const live = cs.filter(c => c.status !== 'Declined');
  const money = hbMoneyOk();
  const agreements = (typeof agreementsIn === 'function') ? agreementsIn(cs) : cs;
  const ending = agreements.filter(c => c.status !== 'Declined')
    .map(c => ({ c, d: hbDays((typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : c.expiry) }))
    .filter(x => x.d != null && x.d >= 0 && x.d <= 90).sort((a, b) => a.d - b.d).map(x => x.c);
  const past = agreements.filter(c => { try { return typeof contractExpired === 'function' && !!contractExpired(c); } catch (_){ return false; } });
  const overdue = hbOverdue(cs);
  const us = hbWaitingOnUs(cs);
  const val = money ? hbValueOf(live) : { v: null, left: 0 };
  const STG = (window.HM_MAP_STAGES || [{ k: 'Draft' }, { k: 'Under Review' }, { k: 'Signed' }]);
  const stages = STG.map(s => {
    const list = live.filter(c => c.status === s.k);
    return { k: s.k, word: s.word || '', tone: (typeof hmStageTone === 'function') ? hmStageTone(s.k) : '',
      n: list.length, v: money ? hbValueOf(list).v : null, ids: list.map(c => c.id) };
  });
  const unsided = (lens && lens !== 'all') ? hbBook('all').filter(c => !hbSideOf(c)).length : 0;
  return { lens: lens || 'all', money, unsided,
    figs: {
      live:    { n: live.length, ids: live.map(c => c.id) },
      value:   { n: live.length, v: val.v, left: val.left, ids: live.map(c => c.id) },
      ending:  { n: ending.length, ids: ending.map(c => c.id) },
      past:    { n: past.length, ids: past.map(c => c.id) },
      overdue: { n: overdue.length, ids: overdue.map(o => o.id || (o.cid + ':' + (o.title || ''))), rows: overdue },
      us:      { n: us.length, ids: us.map(c => c.id) },
    },
    stages };
}
function hbFigNumber(d, k){ const f = d.figs[k]; return k === 'value' ? (f.v || 0) : f.n; }

/* ---------------- what moved since you last looked ----------------
   ONE BASELINE A DAY. The first time Home is painted on a new day, what was
   seen last becomes the baseline, and every paint that day compares with it —
   so "since Thursday" stays "since Thursday" however often the page repaints,
   and a refresh never makes the changes disappear. Ids, never a picture:
   the dig-in names exactly which contracts arrived and which left. */
function hbToday(){ return (typeof todayISO === 'function') ? todayISO() : new Date().toISOString().slice(0, 10); }
function hbSeenNow(d){
  const figs = {};
  HB_FIG_KEYS.forEach(k => { figs[k] = { n: hbFigNumber(d, k), ids: d.figs[k].ids.slice(0, 2000) }; });
  return { at: hbToday(), figs };
}
/* Advance the record of what was seen. Returns the baseline in force. A
   reading that writes only this person's own browser record of what they
   looked at — never a contract. */
function hbSeenTick(d){
  const s = hbS();
  const now = hbSeenNow(d);
  const seen = s.seen && s.seen.last ? s.seen : { base: null, last: null };
  if (!seen.last) seen.last = now;
  else if (seen.last.at !== now.at){ seen.base = seen.last; seen.last = now; }
  else seen.last = now;
  s.seen = seen; hbSave();
  return seen.base;
}
function hbMoved(d, base){
  const out = {};
  HB_FIG_KEYS.forEach(k => {
    const b = base && base.figs && base.figs[k];
    if (!b){ out[k] = null; return; }
    const was = new Set(b.ids || []), now = new Set(d.figs[k].ids);
    out[k] = { d: hbFigNumber(d, k) - (Number(b.n) || 0),
      added: [...now].filter(id => !was.has(id)), gone: [...was].filter(id => !now.has(id)) };
  });
  return out;
}
function hbDayWords(iso){
  if (!iso) return '';
  try { return new Date(iso + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined,
    { weekday: 'long', day: 'numeric', month: 'long' }); } catch (_){ return String(iso); }
}

/* ---------------- Prepared by Copilot, and done while you were away ----------------
   The agents' own reading (agentsData), read the way Home's card always read
   it: one row per agent with work ready, in AG_KEYS order, the count and the
   first item. Done-while-away is the agents' own finished list since the
   baseline day — every item there is already on a contract's trail. */
function hbAgentsData(sinceIso){
  let D = null;
  try { D = (typeof agentsData === 'function') ? agentsData() : null; } catch (_){ D = null; }
  const keys = Array.isArray(window.AG_KEYS) ? AG_KEYS : [];
  if (!D || !D.agents) return { ready: 0, rows: [], done: [] };
  const parts = it => { try { return (typeof agCardParts === 'function') ? agCardParts(it) : {}; } catch (_){ return {}; } };
  const rows = keys.filter(k => D.agents[k] && D.agents[k].ready.length).map(k => {
    const a = D.agents[k], it = a.ready[0], p = parts(it);
    return { k, n: a.ready.length, who: p.who || '', sum: p.sum || '', urg: p.urg || '', tone: it.tone || '',
      icon: ((window.AG_DEF && AG_DEF[k]) || {}).icon || 'spark',
      items: a.ready.map(x => { const q = parts(x); return { key: x.key, cid: (x.c && x.c.id) || null, who: q.who || '', sum: q.sum || '', urg: q.urg || '', tone: x.tone || '' }; }) };
  });
  const since = sinceIso ? String(sinceIso) : null;
  const done = since ? keys.map(k => {
    const a = D.agents[k]; if (!a) return null;
    const items = a.done.filter(x => String(x.at || '').slice(0, 10) >= since);
    return items.length ? { k, n: items.length, items: items.map(x => { const q = parts(x); return { cid: (x.c && x.c.id) || null, who: q.who || '', sum: q.sum || '', at: x.at || '' }; }) } : null;
  }).filter(Boolean) : [];
  return { ready: D.ready || 0, rows, done };
}

/* ---------------- ONE LIST, ONE PLACE — REVERSED (owner-asked 4 Oct 2026)
   ----------------
   It was built this morning and taken off the same day: *"Remove waiting on
   you from the home page permanently. It is not needed."* The reading that
   fed it (hbNeedsData, the signs HB_NEED_IC, the cap HB_NEED_MAX and the
   [data-hb-need] door) is gone with it, because a reading nothing draws is a
   thing somebody maintains for no reader.
   WHAT IS WAITING ON YOU IS STILL SAID, in the three places it was said
   before and still is: the checklist in the side panel beside each contract
   (needsYouOf / insNeedsHtml), the bell, and the phone's own Home. All three
   read hmDecisionItems, which is untouched. The story is in MAP-HISTORY. */

/* ---------------- THE COUNT FOLLOWS THE QUESTION ----------------
   Young, 3 Oct 2026: "the top constant 6 cards should also change based on
   the results of the latest output" → "Build it" (4 Oct). Whatever the latest
   question answered with is what the board counts: Your book's six figures
   and stage bar, every panel, and the map when you flip to it. The count is
   the focus card's own set — a question (q:) or the list an answer came back
   with (ls), and anything dug deeper beneath it — never the book's own doors
   (a figure, a stage, a panel row), which dig WITHIN the count (hbDig). Closing the
   dig-in, the chip's × or "all contracts" brings the whole book back. What
   moved and the watches stay on the whole book. */
function hbRootKey(key){ let k = String(key || ''); while (/^(qg|qm|qv|qn|q2|qr):/.test(k)) k = k.replace(/^(qg|qm|qv|qn|q2|qr):/, '').split(HB_KEY_SEP)[0]; return k; }
function hbCountKey(){
  const path = hbS().path || [];
  for (let i = path.length - 1; i >= 0; i--){ const r = hbRootKey(path[i]); if (r === 'ls' || /^q:/.test(r)) return path[i]; }
  return null;
}
let _hbCounting = false;
function hbCountIds(lens){
  const key = hbCountKey(); if (!key || _hbCounting) return null;
  _hbCounting = true;
  try { const D = hbDigData(key, lens || 'all'); return (D && D.kind === 'list' && !D.whole) ? new Set(D.ids) : null; }
  finally { _hbCounting = false; }
}
function hbCounted(lens){ const ids = hbCountIds(lens); const cs = hbBook(lens); return ids ? cs.filter(c => ids.has(c.id)) : cs; }
function hbCountLabel(lens){ const key = hbCountKey(); return key && hbCountIds(lens) ? hbCrumbOf(key, lens || 'all') : ''; }
/* ---- THE BOARD NEVER READS THE DEFAULT BACK TO YOU (owner-asked 4 Oct 2026:
   "Delete counting and all contracts from the top of the home page") ----
   "Counting All contracts" is the whole book described to somebody looking at
   the whole book: the reader's own choice read back to them, which this
   product has never allowed to take room on a page. At rest the chip draws
   NOTHING. The moment the board IS cut — a question dug into, or a side lens —
   the cut is named, with "Counting" in front of it, because a bare chip with
   no lead-in does not say that the figures beside it are only counting that
   much, and a narrowed board with no way back is the worse fault of the two.
   The "All contracts" chip is gone for good: it was only ever drawn at rest. */
function hbCountChipHtml(){
  const s = hbS(); const ck = !!hbCountLabel(s.lens);
  if (!ck && s.lens === 'all') return '';
  const count = ck ? `<span class="hb-lens-chip is-count">${_hbE(hbCountLabel(s.lens))}<button type="button" data-hb-crumb="-1" aria-label="${_hbE(i18t('hb_count_x'))}" title="${_hbE(i18t('hb_count_x'))}">${_hbX}</button></span>` : '';
  const lens = s.lens === 'all' ? ''
    : `<span class="hb-lens-chip">${_hbE(i18t('hb_lens_' + s.lens))}<button type="button" data-hb-lens="all" aria-label="${_hbE(i18t('hb_lens_x'))}" title="${_hbE(i18t('hb_lens_x'))}">${_hbX}</button></span>`;
  return _hbE(i18t('hb_counting')) + ' ' + count + lens;
}

/* ---------------- the panels a question puts on the board ---------------- */
function hbLensIds(lens){ return new Set(hbBook(lens).map(c => c.id)); }
function hbPanelData(kind, lens){
  const ids = new Set(hbCounted(lens).map(c => c.id));
  const d = { kind, lens };
  if (kind === 'obl'){
    let open = [];
    try { open = (typeof openObligations === 'function') ? (openObligations() || []) : []; } catch (_){ open = []; }
    open = open.filter(o => ids.has(o.cid));
    d.open = open.length;
    d.soon = open.filter(o => o.days != null && o.days >= 0 && o.days <= 30).length;
    d.rows = open.filter(o => o.days != null && o.days < 0)
      .map(o => ({ cid: o.cid, what: o.desc || '', who: o.assignee || '', cp: o.counterparty || '', late: -o.days }));
    d.n = d.rows.length;
  } else if (kind === 'fric'){
    let st = null;
    try { st = (typeof intelFrictionStats === 'function') ? intelFrictionStats() : null; } catch (_){ st = null; }
    const L = (st && st.ledger) || { clauses: [], counterparties: [], waiting: [] };
    let live = [];
    try { live = (typeof negoLiveList === 'function') ? negoLiveList() : []; } catch (_){ live = []; }
    live = live.filter(c => ids.has(c.id));
    const move = c => { try { return negWhoseMove(c).k; } catch (_){ return 'clear'; } };
    d.live = live.length; d.liveIds = live.map(c => c.id);
    d.us =live.filter(c => move(c) === 'you').length;
    d.them = live.filter(c => move(c) === 'them').length;
    d.clauses = (L.clauses || []).map(cl => ({ label: cl.label,
      n: (cl.openDeals || []).filter(x => ids.has(x.id)).length, ids: (cl.openDeals || []).filter(x => ids.has(x.id)).map(x => x.id) }))
      .filter(x => x.n > 0).sort((a, b) => b.n - a.n).slice(0, 6);
    d.cps = (L.counterparties || []).map(cp => {
      const negs = (cp.negotiations || []).filter(x => ids.has(x.id));
      return { name: cp.name, rounds: cp.avgRounds || 0, n: negs.length, ids: negs.map(x => x.id) };
    }).filter(x => x.n > 0).slice(0, 6);
    d.avgRounds = st ? st.avgRounds : null; d.avgDays = st ? st.avgDays : null; d.whole = lens === 'all';
  } else if (kind === 'ren'){
    const cs = hbCounted(lens).filter(c => c.status !== 'Declined');
    const rows = [];
    cs.forEach(c => {
      let w = null; try { w = (typeof renewalWindow === 'function') ? renewalWindow(c) : null; } catch (_){ w = null; }
      if (!w || !w.expiry || w.expiresDays == null || w.expiresDays < 0 || w.expiresDays > 90) return;
      rows.push({ id: c.id, days: w.expiresDays, expiry: w.expiry, decided: !!w.decided, inWindow: !!w.inWindow, missed: !!w.missed });
    });
    rows.sort((a, b) => a.days - b.days);
    d.rows = rows; d.n = rows.length; d.open = rows.filter(r => !r.decided).length;
    const months = [0, 1, 2].map(i => { const t = new Date(); const m = new Date(t.getFullYear(), t.getMonth() + i, 1);
      return { y: m.getFullYear(), m: m.getMonth(), ids: [] }; });
    rows.forEach(r => { const e = new Date(String(r.expiry).slice(0, 10) + 'T00:00:00');
      const M = months.find(x => x.y === e.getFullYear() && x.m === e.getMonth()); if (M) M.ids.push(r.id); });
    d.months = months;
  } else if (kind === 'pay'){
    let P = null;
    try { P = (typeof payTermsData === 'function') ? payTermsData() : null; } catch (_){ P = null; }
    const want = lens === 'suppliers' ? ['supplier'] : lens === 'customers' ? ['customer'] : ['customer', 'supplier'];
    d.sides = want.map(k => {
      const S0 = (P && P[k]) || { rows: [], over: [] };
      /* the counted set: the side's rows narrowed, the average re-read off them (by value where it carries any, else plainly) */
      const S = hbCountKey() ? { rows: S0.rows.filter(r => ids.has(r.id)), over: S0.over.filter(r => ids.has(r.id)), avgDays: null } : S0;
      if (S !== S0 && S.rows.length){ const w = S.rows.reduce((a, r) => a + (r.value || 0), 0); S.avgDays = Math.round(w > 0 ? S.rows.reduce((a, r) => a + r.days * (r.value || 0), 0) / w : S.rows.reduce((a, r) => a + r.days, 0) / S.rows.length); }
      const buckets = (window.PAY_BUCKETS || []).map((b, i) => ({ i, label: b.k, ids: S.rows.filter(r => r.bucket === b.k).map(r => r.id) }));
      return { key: k, n: S.rows.length, avg: S.avgDays != null ? S.avgDays : null,
        std: (S.rows[0] && S.rows[0].standard) || null, over: S.over.length, overIds: S.over.map(r => r.id), buckets };
    });
    d.noSide = P && P.noSide ? (P.noSide.n || 0) : 0;
  } else if (kind === 'exp'){
    let E = null;
    try { E = (typeof exposureData === 'function') ? exposureData() : null; } catch (_){ E = null; }
    d.rows = ((E && E.rows) || []).map(r => { const inL = r.ids.filter(id => ids.has(id));
      return { k: r.k, title: String(r.title || r.k), n: inL.length, ids: inL }; }).sort((a, b) => b.n - a.n);
    d.lead = d.rows[0] && d.rows[0].n ? d.rows[0].k : null;
    d.unread = E && E.unread ? (E.unread.n || 0) : null;
  } else if (kind === 'val'){
    const B = hbBookData(lens);
    d.stages = B.stages; d.money = B.money;
  }
  return d;
}

/* ---------------- the dig-in: what is behind a figure ----------------
   A KEY NAMES ONE READING, and the trail is a list of keys, so a step back is
   the same reading asked again — today's figures, never a remembered list. */
function hbContract(id){ try { return (typeof getContract === 'function') ? getContract(id) : (state.contracts || []).find(c => c.id === id); } catch (_){ return null; } }
function hbRef(c){ return c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : ''; }
function hbListOf(ids, lens){
  const inL = hbLensIds(lens || 'all');
  return (ids || []).map(id => hbContract(id)).filter(c => c && inL.has(c.id));
}
function hbDigData(key, lens){
  const at = String(key || '').indexOf(':');
  const k = at < 0 ? key : key.slice(0, at), a = at < 0 ? '' : key.slice(at + 1);
  /* DIG DEEPER: one analyst run (Charts That Explain, recs 4 and 5) */
  if (k === 'an'){ const run = hbDdRun(a); if (!run) return null;
    return { key, kind: 'analyst', run, crumb: i18t('hb_dd_crumb'), title: i18t('hb_dd_crumb'), n: run.steps.length }; }
  /* AN ANSWER PACK (Charts That Explain, rec 3): the pack, its cards, its lists */
  if (k === 'pk'){
    const dot = a.indexOf('.'), name = dot < 0 ? a : a.slice(0, dot), sub = dot < 0 ? '' : a.slice(dot + 1);
    if (!HB_PACKS.includes(name)) return null;
    const P = hbPackData(name, lens);
    if (!sub) return { key, kind: 'pack', pack: name, crumb: P.title, title: P.title, n: P.cs.length };
    if (/^k:/.test(sub)){ const L = P.lists[sub.slice(2)]; if (!L) return null; const ids = L.ids.filter(x => hbContract(x));
      return { key, kind: 'list', crumb: L.title, title: L.title, ids, n: ids.length, chart: { mode: 'groups', by: 'counterparty' }, fixed: [] }; }
    return hbPackCardD(name, sub, lens);
  }
  const B = hbBookData(lens);
  if (k === 'f'){
    const F = B.figs[a]; if (!F) return null;
    if (a === 'overdue') return { key, kind: 'obl', word: 'hb_f_overdue', rows: F.rows, n: F.n };
    if (a === 'value') return { key, kind: 'stages', word: 'hb_f_value', stages: B.stages, money: B.money, v: F.v, left: F.left };
    const chart = (a === 'ending' || a === 'past') ? { mode: 'months' } : { mode: 'groups', by: a === 'us' ? 'counterparty' : 'status' };
    return { key, kind: 'list', word: 'hb_f_' + a, fig: a, ids: F.ids, n: F.n, chart, fixed: a === 'live' ? [] : ['status'] };
  }
  if (k === 'st'){
    const s = B.stages.find(x => x.k === a); if (!s) return null;
    /* the whole book's stage opens Contracts ON THAT STAGE (regGoFiltered), the
       door the old Home's stage bar was; a lens's stage is a named set */
    return { key, kind: 'list', crumb: s.word ? i18t(s.word) : a, title: s.word ? i18t(s.word) : a, ids: s.ids, n: s.n,
      stage: (lens || 'all') === 'all' && !hbCountIds(lens) ? a : null, chart: { mode: 'groups', by: 'folder' }, fixed: ['status'] };
  }
  /* DIGGING INTO A CHART (3 Oct 2026): a bar is the parent's set narrowed to
     one group (qg), a column its set in one month (qm). The parent's key is
     carried whole, so the trail reads Board › Juno › Executed. */
  if (k === 'qg' || k === 'qm' || k === 'qv'){
    const [pk, field, label, last] = a.split(HB_KEY_SEP);
    const P = hbDigData(pk, lens); if (!P || P.kind !== 'list') return null;
    /* within the card's period: the number on a door is the list behind it */
    const cs = hbWinCs(hbListOf(P.ids, lens), P);
    if (k === 'qv'){
      const lo = Number(field), hi = Number(label), incl = last === '1';
      const ids = cs.filter(c => { const v = hbValueOfOne(c); return v >= lo && (v < hi || (incl && v <= hi)); }).map(c => c.id);
      const name = _hbM(lo) + ' – ' + _hbM(hi);
      return { key, kind: 'list', crumb: name, title: name, ids, n: ids.length, fixed: P.fixed || [], chart: { mode: 'values' } };
    }
    if (k === 'qg'){
      const ids = cs.filter(c => hbGroupOf(c, field) === label).map(c => c.id);
      const fixed = (P.fixed || []).concat(field);
      return { key, kind: 'list', crumb: hbGroupLabel(field, label), title: hbGroupLabel(field, label), ids, n: ids.length, fixed, chart: { mode: 'groups', by: hbNextGroup(fixed) } };
    }
    const unit = field === 'y' || field === 'q' ? field : 'm', date = HB_DATES.includes(last) ? last : 'end';
    const ids = cs.filter(c => hbInBucket(c, unit, date, label)).map(c => c.id);
    const name = hbBucketLabel(label, unit, false) + (date !== 'end' ? ' · ' + i18t('hb_dt_' + date) : '');
    return { key, kind: 'list', crumb: name, title: name, ids, n: ids.length, fixed: P.fixed || [], chart: { mode: 'groups', by: hbNextGroup(P.fixed || []) } };
  }
  /* ONE CELL OF A TWO-SPLIT PICTURE, A BAR OF A COMPARISON (q2), AND THE REST
     PAST A TOP N (qr) — the card's key first, read from the END, so a card
     nested under another keeps its whole key */
  if (k === 'q2' || k === 'qr'){
    const parts = a.split(HB_KEY_SEP), nTail = k === 'q2' ? 4 : 3;
    if (parts.length <= nTail) return null;
    const tail = parts.slice(-nTail), pk = parts.slice(0, -nTail).join(HB_KEY_SEP);
    const P = hbDigData(pk, lens); if (!P || P.kind !== 'list') return null;
    const Pp = hbPlan(P), cs0 = hbListOf(P.ids, lens);
    const Wc = Pp.window ? hbWindowCut(cs0, Pp) : null;
    const base = Wc ? Wc.cs : cs0;
    const mOf = mv => mv === 'b' ? 'value' : Pp.measure;   /* the measure the picture ranked by */
    /* a group past the first N in the card's own order */
    let ob = base;   /* the contracts the picture ordered its groups over */
    const restOf = (cs, field, tok) => { const mm = /^~(\d+)([vnb])$/.exec(tok); if (!mm) return null;
      const K = hbKeptGroups(ob, field, Pp, mOf(mm[2]), Number(mm[1]), mm[2]); return c => !K.kept.has(hbGroupOf(c, field)) && (mm[2] !== 'b' || hbValueOfOne(c) > 0); };
    const words = [];
    const pass = (cs, t, v) => {
      if (/^d\./.test(t)){ const [, u, d] = t.split('.'); words.push(hbBucketLabel(v, u, false) + (d !== 'end' ? ' · ' + i18t('hb_dt_' + d) : '')); return cs.filter(c => hbInBucket(c, u, d, v)); }
      if (!HB_SPLIT_GROUPS.includes(t)) return [];
      const r = restOf(cs, t, v); if (r){ words.push(i18t('hb_rest_word', { by: hbGroupWord(t).toLowerCase() })); return cs.filter(r); }
      words.push(hbGroupLabel(t, v)); return cs.filter(c => hbGroupOf(c, t) === v);
    };
    let cs, fixed = (P.fixed || []).slice();
    if (k === 'qr'){
      const [field, kept, mv] = tail; if (!HB_SPLIT_GROUPS.includes(field)) return null;
      cs = pass(base, field, '~' + kept + mv); fixed.push(field);
    } else {
      const [t1, v1, t2, v2] = tail;
      if (t1 === 'w'){ ob = base.concat((Wc && Wc.prev) || []); const from = v1 === 'prev' ? ((Wc && Wc.prev) || []) : base; words.push(v1 === 'prev' ? hbCmpPrevWord(Pp) : i18t('hb_cmp_cur_word'));
        cs = pass(from, t2, v2); }
      else cs = pass(pass(base, t1, v1), t2, v2);
      [t1, t2].forEach(t => { if (HB_SPLIT_GROUPS.includes(t)) fixed.push(t); });
    }
    const ids = cs.map(c => c.id), name = words.join(' · ');
    return { key, kind: 'list', crumb: name, title: name, ids, n: ids.length, fixed, chart: { mode: 'groups', by: hbNextGroup(fixed) } };
  }
  /* NARROWING THE OPEN CHART (Young, 4 Oct 2026: "this" is the open chart):
     "only Juno" said over a card is that card's own contracts, narrowed by
     the map's one reader of conditions, nested under it in the trail */
  if (k === 'qn'){
    const cut = a.lastIndexOf(HB_KEY_SEP); if (cut < 0) return null;
    const pk = a.slice(0, cut), text = a.slice(cut + HB_KEY_SEP.length);
    const P = hbDigData(pk, lens); if (!P || P.kind !== 'list' || typeof igConditions !== 'function') return null;
    const cq = igConditions(text); if (!cq.length) return null;
    const ids = (typeof igIdsWhere === 'function') ? igIdsWhere(cq, hbListOf(P.ids, lens)) : [];
    const t = cq.map(x => x.label).join(' · ');
    const fixed = (P.fixed || []).concat(cq.map(x => x.field));
    return { key, kind: 'list', crumb: t, title: t, setLabel: t, ids, n: ids.length, fixed, chart: P.chart && (P.chart.pic || P.chart.split || P.chart.measure) ? P.chart : { mode: 'groups', by: hbNextGroup(fixed) } };
  }
  if (k === 'mv'){
    const base = hbS().seen && hbS().seen.base;
    const M = hbMoved(B, base)[a]; if (!M) return null;
    return { key, kind: 'moved', fig: a, word: 'hb_f_' + a, d: M.d, added: M.added, gone: M.gone, since: base && base.at };
  }
  if (k === 'ag'){
    const A = hbAgentsData(null).rows.find(r => r.k === a); if (!A) return null;
    return { key, kind: 'agent', agent: a, items: A.items, n: A.n };
  }
  if (k === 'dn'){
    const base = hbS().seen && hbS().seen.base;
    const A = hbAgentsData(base && base.at).done.find(r => r.k === a); if (!A) return null;
    return { key, kind: 'done', agent: a, items: A.items, n: A.n, since: base && base.at };
  }
  if (k === 'c'){ const c = hbContract(a); return c ? { key, kind: 'card', card: hbCardData(c) } : null; }
  if (k === 'cl'){
    const P = hbPanelData('fric', lens); const cl = P.clauses.find(x => x.label === a);
    return { key, kind: 'list', crumb: a, title: a, ids: cl ? cl.ids : [], n: cl ? cl.n : 0, chart: { mode: 'groups', by: 'counterparty' }, fixed: [] };
  }
  /* A CARD COPILOT BUILT (work order Part 2): a kept card holding its own
     set (`which`) and recipe; the set is read again on every paint */
  if (k === 'cd'){
    const p = (hbS().panels || []).find(x => x.kind === 'view' && x.key === key); if (!p) return null;
    const W = hbWhichOf(p.which, lens);
    const t = p.title || W.label;
    return { key, kind: 'list', crumb: t, title: t, setLabel: W.label, ids: W.ids, n: W.ids.length, whole: W.whole, fixed: W.fields, chart: Object.assign({}, p.recipe || {}) };
  }
  /* THE QUESTION ITSELF IS THE KEY: the map's reader is run again on every
     paint, so the list is always today's (a refresh keeps the question, never
     a stale list). 'fd:' is the day-old shape of the same door. */
  if (k === 'q' || k === 'fd'){
    if (typeof igConditions !== 'function') return null;
    const R = hbRecipeRead(a);
    const cq = igConditions(R ? R.condText : a); if (!cq.length && !R) return null;
    const o = (hbS().recipe || {})[key] || {};
    const whole = !cq.length || o.which === 'all';
    const book = hbBook(lens);
    const ids = whole ? book.filter(c => c.status !== 'Declined').map(c => c.id) : igIdsWhere(cq, book);
    const labels = cq.map(x => x.label);
    if (R){
      const setLabel = labels.length ? labels.join(' · ') : i18t('hb_lens_all');
      const t = whole ? i18t('hb_lens_all') : setLabel;
      return { key, kind: 'list', crumb: t, title: t, setLabel, ids, n: ids.length, fixed: whole ? [] : cq.map(x => x.field), whole,
        chart: Object.assign({ pic: R.pic, split: R.split, measure: R.measure, trend: R.trend }, ['split2', 'sort', 'top', 'window', 'compare', 'title', 'show'].reduce((o, k) => { if (R[k] != null) o[k] = R[k]; return o; }, {})) };
    }
    const party = cq.length === 1 && cq[0].field === 'counterparty';
    const title = party ? i18t('hb_found_party', { who: labels[0] }) : labels.join(' · ');
    /* the chart the question's shape asks for: an attention question → the
       bubbles; a money question → the blocks; a date question → the timeline;
       else the ring over the groups the question did not already fix */
    const fields = cq.map(x => x.field);
    /* "nobody owns these" is a question about attention; "my contracts" is not */
    const attention = cq.some(x => HB_ATTENTION_RE.test(x.field) && (x.field !== 'owner' || x.label === 'nobody owns'));
    const chart = attention ? { mode: 'attention' } : fields.some(f => /^value/.test(f)) ? { mode: 'values' } : fields.some(f => /Window$|^expired$/.test(f)) ? { mode: 'months' } : { mode: 'groups', by: hbNextGroup(fields) };
    return { key, kind: 'list', crumb: whole ? i18t('hb_lens_all') : labels.join(' · '), title: whole ? i18t('hb_lens_all') : title, setLabel: labels.join(' · '), ids, n: ids.length, fixed: whole ? [] : fields, chart, whole };
  }
  /* THE LIST AN ANSWER CAME BACK WITH (Copilot's or the map's), drawn on the
     board so a question asked on the board always lands on the board */
  if (k === 'ls'){
    const F = hbS().found; if (!F || !Array.isArray(F.ids)) return null;
    const o = (hbS().recipe || {})[key] || {};
    const whole = o.which === 'all';
    const ids = whole ? hbBook(lens).filter(c => c.status !== 'Declined').map(c => c.id) : F.ids.filter(id => hbContract(id));
    const t = F.title || i18t('hb_found_list');
    return { key, kind: 'list', crumb: whole ? i18t('hb_lens_all') : t, title: whole ? i18t('hb_lens_all') : t, setLabel: t, ids, n: ids.length, whole,
      chart: F.chart && (F.chart.pic || F.chart.split || F.chart.measure) ? F.chart : { mode: 'groups', by: 'status' }, fixed: [] };
  }
  if (k === 'cp'){
    const cs = hbCounted(lens).filter(c => String(c.counterparty || '') === a);
    return { key, kind: 'list', crumb: a, title: a, ids: cs.map(c => c.id), n: cs.length, chart: { mode: 'groups', by: 'status' }, fixed: ['counterparty'] };
  }
  if (k === 'mo'){
    const P = hbPanelData('ren', lens); const M = P.months[Number(a)];
    let name = ''; try { name = M ? new Date(M.y, M.m, 1).toLocaleDateString(langLocale(), { month: 'long', year: 'numeric' }) : ''; } catch (_){}
    return { key, kind: 'list', crumb: name, title: i18t('hb_ending_in', { month: name }), ids: M ? M.ids : [], n: M ? M.ids.length : 0, chart: { mode: 'groups', by: 'folder' }, fixed: [] };
  }
  if (k === 'ex'){
    const P = hbPanelData('exp', lens); const r = P.rows.find(x => x.k === a);
    return { key, kind: 'list', crumb: r ? r.title : a, title: r ? r.title : a, ids: r ? r.ids : [], n: r ? r.n : 0, chart: { mode: 'groups', by: 'status' }, fixed: [] };
  }
  if (k === 'pb'){
    const [side, i] = a.split(':');
    const P = hbPanelData('pay', 'all'); const S = P.sides.find(x => x.key === side); const b = S && S.buckets[Number(i)];
    return { key, kind: 'list', crumb: b ? b.label : a, title: b ? b.label : a, ids: b ? b.ids : [], n: b ? b.ids.length : 0, chart: { mode: 'groups', by: 'counterparty' }, fixed: ['side'] };
  }
  if (k === 'po'){
    const P = hbPanelData('pay', 'all'); const S = P.sides.find(x => x.key === a);
    return { key, kind: 'list', crumb: i18t('hb_pay_over'), title: i18t('hb_pay_over'), ids: S ? S.overIds : [], n: S ? S.over : 0, chart: { mode: 'groups', by: 'counterparty' }, fixed: ['side'] };
  }
  return null;
}

/* ---------------- one contract, whole ----------------
   "bring up MK-106" (Young asked 3 Oct 2026: "summary KPIs of that contract
   like the status, negotiation factors, risks, renewal etc"). EVERY LINE IS
   THE RECORD'S OWN READING, borrowed: the stage is STATUS_META's word, whose
   move is negWhoseMove's, the end is effectiveExpiry's, the decision is
   renewalWindow's, the risks are the Exposure kinds this contract trips, the
   brief is the one on record. READING MUST NOT WRITE — c.changes is read raw.
   A LIGHT ROW IS LOADED WHOLE FIRST (hbOpenCard asks ensureFull), so the
   trail and the brief are there to read; until it arrives the card says so. */
function hbCardData(c){
  const money = hbMoneyOk();
  const exp = (typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : (c.expiry || null);
  const days = hbDays(exp);
  let move = null; try { move = (typeof negWhoseMove === 'function') ? negWhoseMove(c) : null; } catch (_){ move = null; }
  const changes = Array.isArray(c.changes) ? c.changes : [];
  const open = changes.filter(x => x && x.status === 'pending' && !x.withdrawn);
  const settled = changes.filter(x => x && (x.status === 'accepted' || x.status === 'rejected')).length;
  const rounds = (c.negotiation && Array.isArray(c.negotiation.rounds)) ? c.negotiation.rounds.length : 0;
  const holding = [...new Set(open.map(x => String(x.clauseLabel || x.clause || x.label || '').trim()).filter(Boolean))].slice(0, 3);
  let win = null; try { win = (typeof renewalWindow === 'function') ? renewalWindow(c) : null; } catch (_){ win = null; }
  let risks = [];
  try { if (typeof EXPOSURE_KINDS !== 'undefined' && Array.isArray(EXPOSURE_KINDS))
    risks = EXPOSURE_KINDS.filter(kd => { try { return !!kd.hit(c); } catch (_){ return false; } }).map(kd => String(kd.title || kd.k)); } catch (_){ risks = []; }
  const obs = (Array.isArray(c.obligations) ? c.obligations : []).filter(Boolean).map(o => {
    const st = (typeof obState === 'function') ? obState(o) : (o.status || 'open');
    const due = (typeof obligationDue === 'function') ? obligationDue(o) : (o.due || null);
    return { what: o.desc || '', who: o.assignee || '', due, state: st };
  }).filter(o => o.state !== 'done');
  let blockers = [];
  try { blockers = (typeof signBlockers === 'function' && c.status !== 'Signed') ? (signBlockers(c) || []).map(b => String(b.say || b.text || b.msg || b.why || b.kind || '')).filter(Boolean).slice(0, 4) : []; } catch (_){ blockers = []; }
  const audit = Array.isArray(c.audit) ? c.audit.slice(-4).reverse().map(a => ({ at: a.at || a.date || a.ts || '', what: a.action || '', who: a.user || '' })) : null;
  const brief = c._brief && (c._brief.summary || c._brief.text) ? String(c._brief.summary || c._brief.text) : null;
  return { id: c.id, ref: hbRef(c), name: c.name || '', cp: c.counterparty || '', status: c.status || '',
    side: hbSideOf(c), owner: (typeof contractOwnerName === 'function') ? (contractOwnerName(c) || '') : (c.owner || ''),
    value: money ? Number(c.value || 0) : null, money,
    currency: (typeof contractCurrency === 'function') ? contractCurrency(c) : '',
    expiry: exp ? String(exp).slice(0, 10) : null, days,
    expired: (() => { try { return typeof contractExpired === 'function' && !!contractExpired(c); } catch (_){ return false; } })(),
    move: move ? move.k : null, moveN: move ? move.n : 0, open: open.length, settled, rounds, holding,
    renewal: win ? { decided: !!win.decided, inWindow: !!win.inWindow, decideBy: win.decideBy ? String(win.decideBy).slice(0, 10) : null, notice: win.notice || 0, auto: !!win.auto, missed: !!win.missed } : null,
    pay: (typeof payDays === 'function') ? payDays(c) : null,
    risks, obligations: obs, blockers, audit, brief, hasBrief: !!(c._hasBrief || brief),
    full: !c._light || !!c._loaded };
}

/* ---------------- the free reader ----------------
   PLAIN WORDS, NO MODEL. It takes what it understands and hands everything
   else on (null), where Explorer's own ask decides — its map reader first,
   then Copilot at its stated cost. THE WORDS ARE ITS OWN, in both of HaTi's
   languages, and never the screen's translated labels: a reader typing in
   English on a Swedish screen is understood, and a relabelled button can
   never change what a question means (the house rule; igRecipeParse's own). */
const HB_RX = {
  reset:     /\b(start over|reset|clear (the )?board|börja om|rensa tavlan)\b/i,
  showThese: /show (these|them) on the map|visa (dessa|dem) på kartan/i,
  /* a heat map or a tree map is a picture on the board, never the map */
  map:       /\b(the map|(?<!heat |heat-|tree |tree-)map|explorer|brain|kartan|(?<!värme)karta|utforskaren|hjärnan)\b/i,
  board:     /\b(the board|board|dashboard|back to the numbers|tavlan|översikten|tillbaka till siffrorna)\b/i,
  present:   /\b(present|presentation|full ?screen|meeting mode|presentera|helskärm|mötesläge)\b/i,
  save:      /(?:save|keep) (?:this|the|my) board as (.+)|spara (?:den här tavlan|tavlan) som (.+)/i,
  /* BUILD ME A DASHBOARD (work order Part 2): several cards at once is
     Copilot's to answer with the board's own buttons — never "back to the
     board" or one panel */
  build:     /\b(?:build|make|create|set up|design|put together|give me|bygg|skapa|gör|sätt ihop)\b[^.?!]{0,40}?\b(?:dashboards?|boards?|cards|charts|views|overview|översikt|tavla|instrumentpanel|kort|diagram)\b/i,
  /* renaming a card is Copilot's (name_card) — never "back to the board"
     because the new name holds the word */
  rename:    /\b(rename|retitle|byt namn på)\b/i,
  obl:       /overdue|past due|obligation|\bdut(y|ies)\b|\blate\b|promise|förfall|åtagande|\bsena?\b/i,
  fric:      /slow|friction|negotiat|delay|stuck|förhandl|trög|fastnat|friktion/i,
  ren:       /renew|expir|\bending\b|end date|förny|löper ut|slutdatum|upphör/i,
  pay:       /payment term|\bpay\b|days to pay|invoice|betalningsvillkor|\bbetal|faktur/i,
  exp:       /\brisk|exposure|liabilit|indemn|exponering|ansvarsbegräns|skadeslös/i,
  val:       /value by stage|\bstage|pipeline|värde per skede|\bskede/i,
  suppliers: /suppl|vendor|leverantör/i,
  customers: /customer|client|\bkund/i,
  split:     /side by side|versus|\bvs\.?\b|\bagainst\b|compare|sida vid sida|mot varandra|jämför/i,
  watch:     /tell me|alert me|let me know|\bwatch|notify|\bwarn|säg till|meddela mig|bevaka|varna/i,
  below:     /\bbelow\b|\bunder\b|less than|fewer than|drops|falls|lägre än|färre än|sjunker|under/i,
  all:       /\b(all contracts|everything|show all|remove the (lens|filter)|alla avtal|visa alla)\b/i,
  remove:    /\b(remove|close|hide|drop|take off|ta bort|stäng|dölj)\b/i,
  open:      /^(?:open|öppna)\s+(.+)$/i,
  /* "expired" is the PAST — past the end date — never "ending soon"; a
     question that also says renew is a renewals question */
  renewWord: /renew|förny/i,
  bring:     /^(?:bring up|pull up|open|show me|look at|find|visa|öppna|ta fram|hitta)\s+(?:the\s+|avtalet\s+)?(?:contract\s+)?(.+?)\??$/i,
  /* READ IT WITH ME (Young, 4 Oct 2026): a question that asks to put ONE
     contract's paper up and ask it things — Explorer's "Analyze contract". */
  analyze:   /\b(?:analy[sz]e|read\b[^?]{0,60}?\bwith me|go through\b[^?]{0,60}?\bwith me|(?:let me |i want to |can i )?ask (?:some |a few )?questions?(?: about| on| of)?|questions? about|analysera|läs\b[^?]{0,60}?\bmed mig|gå igenom\b[^?]{0,60}?\bmed mig|(?:låt mig )?ställa frågor(?: om)?|frågor om)\b/i,
  fig: {
    live:    /live contracts|\blive\b|how many (?:contracts|agreements)|number of (?:contracts|agreements)|levande avtal|aktiva avtal|hur många avtal/i,
    value:   /value under contract|total value|värde under avtal|totalt värde/i,
    ending:  /ending|end in 90|90 days|löper ut|90 dagar/i,
    past:    /past (their |the )?end|expired|efter slutdatum|utgångna|har löpt ut/i,
    overdue: /overdue|past due|förfallna/i,
    us:      /waiting on us|our move|väntar på oss|vårt drag/i,
  },
};
/* Which contract a question names: its reference anywhere in the words, or
   — after "bring up", "open", "show me" — its name or its counterparty when
   exactly one contract answers. Two candidates are not a guess: null. */
function hbFindContract(q){
  const cs = (state.contracts || []).filter(c => c && !c.archived);
  const toks = String(q).split(/[\s,;:!?()"“”]+/).map(t => t.replace(/[.]+$/, '').toUpperCase()).filter(t => t.length >= 3 && /\d/.test(t));
  for (const t of toks){
    const c = cs.find(x => hbRef(x).toUpperCase() === t || String(x.id).toUpperCase() === t);
    if (c) return { c };
  }
  const ref = /\b(?:mk|rl)[- ]?\d+\b/i.exec(q);
  if (ref) return { miss: ref[0].toUpperCase().replace(' ', '-') };
  const b = HB_RX.bring.exec(String(q).trim());
  if (b && b[1]){
    const w = b[1].trim().toLowerCase();
    if (w.length < 4 || HB_RX.map.test(w) || HB_RX.board.test(w)) return null;
    let hit = cs.filter(c => String(c.name || '').toLowerCase() === w);
    if (!hit.length) hit = cs.filter(c => String(c.name || '').toLowerCase().includes(w) || String(c.counterparty || '').toLowerCase() === w);
    if (hit.length === 1) return { c: hit[0] };
  }
  return null;
}
/* What is left of a "read it with me" question once its asking words are
   gone: the contract it names, ready for hbFindContract's name lookup. */
function hbAnalyzeObject(q){
  return String(q)
    .replace(/\b(?:analy[sz]e|analysera|read|go through|läs|gå igenom|with me|med mig|let me|låt mig|can i|i want to|ask|ställa|some|a few|questions?|frågor|so i can|so that i can|så att jag kan)\b/gi, ' ')
    .replace(/\b(?:about|on|of|the|this|contract|agreement|please|and|it|avtalet|om|och|det)\b/gi, ' ')
    .replace(/^\s*(?:open|öppna|bring up|pull up)\s+/i, '').replace(/[?.!]+$/, '').replace(/\s+/g, ' ').trim();
}
function hbParse(qRaw){
  const q = String(qRaw || '').trim(); if (!q) return null;
  const s = q.toLowerCase();
  /* two named contracts are Explorer's to compare side by side */
  if ((q.match(/\b(?:mk|rl)[- ]?\d+\b/gi) || []).length >= 2) return null;
  const found = hbFindContract(q);
  if (HB_RX.analyze.test(q)){
    const f = (found && found.c) ? found : hbFindContract('open ' + hbAnalyzeObject(q));
    if (f && f.c) return { act: 'analyze', id: f.c.id };
  }
  if (found && found.c) return { act: 'card', id: found.c.id };
  if (found && found.miss) return { act: 'noref', ref: found.miss };
  if (HB_RX.reset.test(s)) return { act: 'reset' };
  const save = HB_RX.save.exec(q);
  if (save && (save[1] || save[2])) return { act: 'save', name: String(save[1] || save[2]).trim().replace(/^["“']|["”'.]$/g, '') };
  const open = HB_RX.open.exec(q);
  if (open){ const v = (hbS().saved || []).find(x => x.name.toLowerCase() === open[1].trim().toLowerCase()); if (v) return { act: 'open', name: v.name }; }
  const named = (hbS().saved || []).find(x => x.name.toLowerCase() === s);
  if (named) return { act: 'open', name: named.name };
  if (HB_RX.build.test(s)) return null;
  if (HB_RX.rename.test(s)) return null;
  if (HB_RX.map.test(s) && !HB_RX.showThese.test(s) && s.length < 40) return { act: 'face', face: 'explorer' };
  if (HB_RX.board.test(s) && s.length < 40) return { act: 'face', face: 'board' };
  if (HB_RX.present.test(s) && s.length < 40) return { act: 'present' };
  /* A CHART QUESTION (4 Oct 2026): the picture words are read first, so "by
     month", "timeline", "as a pie" and "trend" reach the board instead of the
     hidden map; a figure's door never answers a question that asked for a
     picture. What neither reader understood goes on to Copilot. */
  const R = hbRecipeRead(q);
  if (R) return R.left ? null : { act: 'dig', key: 'q:' + q };
  /* WHICH CONTRACTS — THE MAP'S OWN READER (3 Oct 2026, the owner's review):
     one reading for both screens. When the conditions are the whole of the
     question, the board lists exactly those contracts; a single condition
     that IS one of Your book's figures opens that figure's own door. */
  if (typeof igConditions === 'function' && typeof igLeftover === 'function'){
    const cq = igConditions(q);
    if (cq.length && !igLeftover(q, cq)){
      if (cq.length === 1){
        const c0 = cq[0];
        if (c0.field === 'expired') return { act: 'dig', key: 'f:past' };
        if (c0.field === 'move' && c0.label === 'waiting on us') return { act: 'dig', key: 'f:us' };
        if (c0.field === 'overdue') return { act: 'panel', kind: 'obl', lens: null };
        if (c0.field === 'expiryWindow' && /\b90 (?:days|dagar)\b/.test(c0.hit || '')) return { act: 'dig', key: 'f:ending' };
        if (c0.field === 'side') return { act: 'lens', lens: c0.fn({ metadata: { category: 'supplier' } }) ? 'suppliers' : 'customers' };
      }
      return { act: 'dig', key: 'q:' + q };
    }
  }
  const pastAsk = HB_RX.fig.past.test(s) && !HB_RX.renewWord.test(s);
  const kind = HB_RX.obl.test(s) ? 'obl' : HB_RX.fric.test(s) ? 'fric' : (HB_RX.ren.test(s) && !pastAsk) ? 'ren'
    : HB_RX.pay.test(s) ? 'pay' : HB_RX.exp.test(s) ? 'exp' : HB_RX.val.test(s) ? 'val' : null;
  const sup = HB_RX.suppliers.test(s), cus = HB_RX.customers.test(s);
  if (HB_RX.watch.test(s)){
    const k = HB_FIG_KEYS.find(f => HB_RX.fig[f].test(s));
    const m = /(\d+(?:[.,]\d+)?)/.exec(q);
    if (k && m) return { act: 'watch', k, dir: HB_RX.below.test(s.replace(/\bunder contract\b/, '')) ? 'below' : 'above', n: Number(m[1].replace(',', '.')) };
  }
  if (HB_RX.split.test(s) && (sup || cus)) return { act: 'split', kind };
  if (HB_RX.all.test(s)) return { act: 'lens', lens: 'all' };
  /* a panel word answers a short ask; a long sentence that merely holds one
     ("a grid of streams against stages…") is a chart Copilot draws */
  if (kind && s.length >= 48 && !HB_RX.remove.test(s)) return null;
  if (kind) return { act: HB_RX.remove.test(s) ? 'remove' : 'panel', kind, lens: sup ? 'suppliers' : cus ? 'customers' : null };
  if (sup && s.length < 40) return { act: 'lens', lens: 'suppliers' };
  if (cus && s.length < 40) return { act: 'lens', lens: 'customers' };
  const fig = HB_FIG_KEYS.find(f => HB_RX.fig[f].test(s));
  if (fig && s.length < 80) return { act: 'dig', key: 'f:' + fig };
  return null;
}

/* ============================================================
   THE DRAWING — computes nothing
   ============================================================ */
const _hbE = s => (typeof esc === 'function') ? esc(s) : String(s == null ? '' : s);
const _hbN = n => { try { return Number(n || 0).toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined); } catch (_){ return String(n || 0); } };
const _hbM = v => (typeof fmtMoneyShort === 'function') ? fmtMoneyShort(v || 0) : String(Math.round(v || 0));
const _hbStatus = s => (typeof statusLabel === 'function') ? statusLabel(s) : s;
const _hbX = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m4 4 8 8M12 4l-8 8"/></svg>';
const _hbBack = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M10 3 5 8l5 5"/></svg>';
const _hbChev = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m3 6 5 5 5-5"/></svg>';
const _hbEye = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/></svg>';
const _hbSplitIc = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="2" y="3" width="5" height="10" rx="1"/><rect x="9" y="3" width="5" height="10" rx="1"/></svg>';
const _hbGiveIc = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="6.5" cy="5.5" r="2.5"/><path d="M1.5 13.5c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5M12 5v4M10 7h4"/></svg>';
const _hbBigIc = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M2 6V2h4M14 10v4h-4M2 2l5 5M14 14l-5-5"/></svg>';
/* MAKE SMALLER LOOKS LIKE IT (Young, 4 Oct 2026: "the expand button should
   turn into contract button when the card is already expanded"): an enlarged
   card's button points its arrows IN, says "Make smaller" to the hand and to a
   screen reader alike. ONE builder for the three places it is drawn. */
const _hbSmallIc = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 2v4H2M10 14v-4h4M6 6 1 1M10 10l5 5"/></svg>';
function hbBigBtnHtml(big, attr){
  const word = _hbE(i18t(big ? 'hb_p_small' : 'hb_p_big'));
  return `<button type="button" class="hb-ib hb-bigbtn${big ? ' is-big' : ''}" ${attr} aria-pressed="${!!big}" title="${word}" aria-label="${word}">${big ? _hbSmallIc : _hbBigIc}</button>`;
}

/* ---- THE HEAD ROW: who you are, which side of the screen, what is counted ----
   The greeting and the day, the Board | Explorer switch, the Group by that
   only the map uses (drawn always, hidden on the board, because the map's
   wiring asks for it by id), the lens chip, Present, and the screen's own
   Dark | Light. The New agreement button stays the one filled act. */
/* The greeting: who, what day, how much is ready. Its own builder because
   the head repaints it in place (hbPaintHead) — the person and the count
   arrive after the first paint, and the head is not rebuilt for them. */
function hbHelloInner(){
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const hour = new Date().getHours();
  const greet = i18t(hour < 12 ? 'home_greet_morning' : hour < 17 ? 'home_greet_afternoon' : 'home_greet_evening');
  const first = String((me && me.name) || '').trim().split(/\s+/)[0] || i18t('home_greet_there');
  /* ---- JUST THE GREETING (owner-asked 4 Oct 2026: "Delete the date and the
     what rest of the update about what is waiting for me that comes after the
     greeting in the home page. Just keep the greeting and name") ----
     It carried the day and "N things ready for you". The day is on every clock
     the reader owns, and what is ready is said by the card that holds it, with
     its own count, a few pixels below. */
  return `<h1>${_hbE(greet)}, ${_hbE(first)}</h1>`;
}
function hbHeadHtml(groupSel){
  const s = hbS();
  const face = f => `<button type="button" role="tab" data-hb-face="${f}" aria-selected="${s.face === f}">${_hbE(i18t('hb_face_' + f))}</button>`;
  const scr = m => `<button type="button" data-hb-screen="${m}" aria-pressed="${s.screen === m}">${_hbE(i18t('hb_screen_' + m))}</button>`;
  return `<style>#page-head{background:var(--color-surface)}</style>
  <header id="hb-head" class="hb-head">
    <div class="hb-hello">${hbHelloInner()}</div>
    <div class="hb-seg" role="tablist" aria-label="${_hbE(i18t('hb_show'))}">${face('board')}${face('explorer')}</div>
    <span class="hb-grow"></span>
    <label class="hb-groupby" id="hb-groupby"${s.face === 'explorer' ? '' : ' hidden'}>${_hbE(i18t('hb_group_by'))} ${groupSel || ''}</label>
    <span class="hb-counting">${hbCountChipHtml()}</span>
    <button type="button" class="ui-btn ui-btn-sm" id="hb-present" title="${_hbE(i18t('hb_present_tip'))}">${_hbE(i18t('hb_present'))}</button>
    <div class="hb-seg hb-scr" role="group" aria-label="${_hbE(i18t('hb_screen_label'))}" title="${_hbE(i18t('hb_screen_tip'))}">${scr('dark')}${scr('light')}</div>
    <button id="hero-draft" class="hm-primary">${(typeof icon === 'function') ? icon('plus', 'w-3.5 h-3.5', 2) : '+'} ${_hbE(i18t('home_draft_new'))}</button>
  </header>`;
}

/* ---- YOUR BOOK: six figures and the stage bar ----
   EVERY FIGURE IS A DOOR AND A ZERO IS NOT ONE (Home's own rule since 20 Aug
   2026). The change since the baseline rides its own small chip, a door onto
   exactly the contracts that moved. */
function hbDeltaHtml(k, M, since){
  if (!M) return '';
  const tone = (HB_FIGS.find(f => f.k === k) || {}).tone;
  const n = Math.abs(M.d);
  const when = hbDayWords(since);
  /* nothing moved: the figure says nothing more */
  if (!M.d && !M.added.length && !M.gone.length) return '';
  const up = M.d > 0;
  const cls = !M.d ? '' : tone === 'bad' ? (up ? ' is-bad' : ' is-good') : tone === 'warn' ? (up ? ' is-warn' : ' is-good') : '';
  const amt = k === 'value' ? _hbM(n) : _hbN(n);
  const txt = M.d ? (up ? '▲ ' : '▼ ') + amt : '↔';
  return `<button type="button" class="hb-fd${cls}" data-hb-dig="mv:${k}" title="${_hbE(i18t(M.d ? (up ? 'hb_d_up_tip' : 'hb_d_down_tip') : 'hb_d_swap_tip', { n: amt, when }))}">${_hbE(txt)}</button>`;
}
function hbBookHtml(d, moved, since){
  const tiles = HB_FIGS.filter(f => !f.money || d.money).map(f => {
    const F = d.figs[f.k];
    const num = f.k === 'value' ? _hbM(F.v) : _hbN(F.n);
    const zero = !F.n;
    const tone = !zero && f.tone ? ' is-' + f.tone : '';
    const left = (f.k === 'value' && F.left) ? ' · ' + i18tn('fx_left_out', F.left, { n: F.left, codes: '' }) : '';
    return `<div class="hb-fig${tone}">
      <button type="button" class="hb-fig-main" ${zero ? 'disabled' : `data-hb-dig="f:${f.k}"`} title="${_hbE(i18t(f.tip) + left)}">
        <span class="hb-fig-n">${_hbE(num)}</span><span class="hb-fig-l">${_hbE(i18t(f.word))}</span></button>
      ${hbDeltaHtml(f.k, moved && moved[f.k], since)}</div>`;
  }).join('');
  const tot = d.stages.reduce((a, s) => a + s.n, 0);
  const bar = tot ? `<div class="hb-stagebar">${d.stages.map(s => s.n ? `<button type="button" style="flex-grow:${s.n};background:${_hbE(s.tone)}" data-hb-dig="st:${_hbE(s.k)}" title="${_hbE((s.word ? i18t(s.word) : s.k) + ': ' + i18tn('home_map_n_contracts', s.n, { n: _hbN(s.n) }))}" aria-label="${_hbE((s.word ? i18t(s.word) : s.k) + ': ' + i18tn('home_map_n_contracts', s.n, { n: _hbN(s.n) }))}"></button>` : '').join('')}</div>
    <div class="hb-stagekey">${d.stages.map(s => `<button type="button" ${s.n ? `data-hb-dig="st:${_hbE(s.k)}"` : 'disabled'}><i style="background:${_hbE(s.tone)}"></i>${_hbE(s.word ? i18t(s.word) : s.k)} <b>${_hbN(s.n)}</b></button>`).join('')}</div>` : '';
  const count = hbCountLabel(d.lens);
  /* the same rule as the head's chip: the default is never read back */
  const sub = [count, d.lens === 'all' ? '' : i18t('hb_lens_' + d.lens), since ? i18t('hb_book_since', { when: hbDayWords(since) }) : ''].filter(Boolean).join(' · ');
  const unsided = d.unsided ? `<div class="hb-quiet">${_hbE(i18tn('hb_unsided', d.unsided, { n: _hbN(d.unsided) }))}</div>` : '';
  return `<section class="hb-card hb-book" id="hb-book"><header class="hb-ch"><span class="hb-ct">${_hbE(i18t('hb_book'))}</span><span class="hb-cs">${_hbE(sub)}</span>
    ${hbS().prep === 'closed' ? `<button type="button" class="hb-link" data-hb-prep="open" title="${_hbE(i18t('hb_prep_back'))}">${_hbE(i18t('hm_ag_title'))} <span class="hb-pill">${_hbN(hbAgentsData(null).ready)}</span></button>` : ''}</header>
    <div class="hb-cb"><div class="hb-figs">${tiles}</div>${bar}${unsided}</div></section>`;
}

/* ---- PREPARED BY COPILOT, under the book ----
   Folds to one line that still says how many and what is next; closes off
   the board, and the count stays on Your book's head as the way back. Review
   opens the agent's work HERE, on the board; the head's link opens Copilot's
   work, where each item is decided. */
/* ---- WAITING ON YOU IS NOT ON THIS PAGE (owner-asked 4 Oct 2026: "Remove
   waiting on you from the home page permanently. It is not needed") ----
   REVERSES "One list, one place" of the same morning. The card is Copilot's
   prepared work again and nothing else. NOTHING IS LOST: every prompt it drew
   is still drawn where it was before — the checklist in the side panel beside
   each contract (needsYouOf), the bell, and the phone's own Home, all three
   reading the same hmDecisionItems. Only this card stops repeating them. */
function hbPrepHtml(A, since){
  const st = hbS().prep;
  const I = hbInsightsToday();
  /* drawn while work is ready, OR work was done while you were away, OR
     today's insights are waiting (the shelf, 4 Oct 2026) */
  const insOn = I.length > 0 || hbInsUsual(I).length > 0;
  if (st === 'closed' || (!A.rows.length && !A.done.length && !insOn)) return '';
  const folded = st === 'folded';
  const next = A.rows[0];
  const sub = (A.ready ? i18tn('hm_ag_sub', A.ready, { n: _hbN(A.ready) }) : '')
    + (folded && next ? (A.ready ? ' · ' : '') + i18t('hb_prep_next', { who: next.who || next.sum }) : '')
    + (folded && I.length ? ((A.ready || next) ? ' · ' : '') + i18tn('hb_ins_n', I.length, { n: I.length }) : '');
  const rows = folded ? '' : A.rows.map(r => {
    const tone = r.tone === 'ruby' ? ' is-neg' : r.tone === 'amber' ? ' is-crit' : '';
    return `<div class="hb-ag${tone}" data-hb-dig="ag:${_hbE(r.k)}" data-hm-agent-row="${_hbE(r.k)}">
      <span class="hb-ag-ic" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"><use href="#i-${_hbE(r.icon)}"/></svg></span>
      <span class="hb-ag-b"><span class="hb-ag-t">${_hbE(i18t('ag_' + r.k))} <span class="hb-pill">${_hbN(r.n)}</span></span><span class="hb-ag-s">${_hbE([r.who, r.sum].filter(Boolean).join(' · '))}</span></span>
      ${r.urg ? `<span class="hb-chip${r.tone === 'ruby' ? ' is-bad' : ' is-warn'}">${_hbE(r.urg)}</span>` : '<span></span>'}
      <button type="button" class="hb-btn" data-hb-dig="ag:${_hbE(r.k)}">${_hbE(i18t('hm_ag_review'))}</button></div>`;
  }).join('');
  const done = (!folded && A.done.length) ? `<div class="hb-done">${_hbE(i18t('hb_done_since', { when: hbDayWords(since) }))} ${A.done.map(x => `<button type="button" data-hb-dig="dn:${_hbE(x.k)}">${_hbE(i18tn('hb_done_' + x.k, x.n, { n: _hbN(x.n) }))}</button>`).join('<span aria-hidden="true">·</span>')}<span class="hb-grow"></span><span class="hb-quiet">${_hbE(i18t('hb_done_trail'))}</span></div>` : '';
  return `<section class="hb-card hb-prep${folded ? ' is-folded' : ''}" id="hm-agents"><header class="hb-ch">
    <button type="button" class="hb-ib" data-hb-prep="${folded ? 'open' : 'folded'}" aria-expanded="${!folded}" title="${_hbE(i18t(folded ? 'hb_prep_open' : 'hb_prep_fold'))}" style="transform:rotate(${folded ? '-90' : '0'}deg)">${_hbChev}</button>
    <span class="hb-ct">${_hbE(i18t('hm_ag_title'))}</span><span class="hb-cs">${_hbE(sub)}</span>
    <button type="button" class="hb-link" data-hm-agent="">${_hbE(i18t('nav_agents'))}</button>
    <button type="button" class="hb-ib hb-x" data-hb-prep="closed" title="${_hbE(i18t('hb_prep_close'))}" aria-label="${_hbE(i18t('hb_prep_close'))}">${_hbX}</button></header>
    ${done}${rows || insOn ? `<div class="hb-ags">${folded ? '' : hbInsRowHtml(I)}${rows}</div>` : ''}${folded ? '' : hbShelfHtml(I)}</section>`;
}

/* ---- ONE CONTRACT ROW, in every list on the board ---- */
function hbRowHtml(c, right){
  return `<button type="button" class="hb-row" data-hb-dig="c:${_hbE(c.id)}" title="${_hbE(i18t('hb_open_card'))}">
    <span class="hb-row-a">${_hbE(hbRef(c))} · ${_hbE(c.name || '')}</span><span class="hb-row-r">${right || ''}</span>
    <span class="hb-row-b">${_hbE(c.counterparty || i18t('home_no_counterparty'))}${(typeof contractOwnerName === 'function' && contractOwnerName(c)) ? ' · ' + _hbE(contractOwnerName(c)) : ''}</span></button>`;
}
function hbRightOf(c, fig){
  if (fig === 'ending' || fig === 'past'){
    const e = (typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : c.expiry; const dd = hbDays(e);
    return dd == null ? '' : `<span class="hb-chip ${dd < 0 ? 'is-bad' : 'is-warn'}">${_hbE(dd < 0 ? i18tn('hb_days_past', -dd, { n: -dd }) : i18tn('hb_days_left', dd, { n: dd }))}</span>`;
  }
  if (fig === 'us'){ let w = null; try { w = negWhoseMove(c); } catch (_){} return w && w.n ? `<span class="hb-chip is-warn">${_hbE(i18tn('hb_n_waiting', w.n, { n: w.n }))}</span>` : ''; }
  return hbMoneyOk() ? `<span>${_hbE((typeof fmtMoneyShortOf === 'function') ? fmtMoneyShortOf(c) : _hbM(c.value))}</span>` : `<span class="hb-quiet">${_hbE(_hbStatus(c.status))}</span>`;
}
function hbListFootHtml(cs, label, stage, said){
  const ids = cs.map(c => c.id);
  return `<div class="hb-foot"><span>${_hbE(said)}</span>
    <span class="hb-acts"><button type="button" class="hb-btn" data-hb-map="${_hbE(ids.join(','))}" data-hb-what="${_hbE(label)}">${_hbE(i18t('hb_show_map'))}</button>
    <button type="button" class="hb-btn" data-hb-open="${_hbE(ids.join(','))}"${stage ? ` data-hb-stage="${_hbE(stage)}"` : ''} data-hb-what="${_hbE(label)}">${_hbE(i18tn('hb_open_n', cs.length, { n: _hbN(cs.length) }))}</button></span></div>`;
}
function hbListHtml(cs, fig, label, stage){
  if (!cs.length) return `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
  const shown = cs.slice(0, HB_ROWS_MAX);
  return `<div class="hb-rows">${shown.map(c => hbRowHtml(c, hbRightOf(c, fig))).join('')}</div>`
    + hbListFootHtml(cs, label, stage, shown.length < cs.length ? i18t('hb_showing', { k: _hbN(shown.length), n: _hbN(cs.length) }) : i18tn('hb_all_shown', cs.length, { n: _hbN(cs.length) }));
}
function hbOblRowsHtml(rows){
  if (!rows.length) return `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
  return `<div class="hb-rows">${rows.slice(0, HB_ROWS_MAX).map(o => { const c = hbContract(o.cid);
    return `<button type="button" class="hb-row" data-hb-dig="c:${_hbE(o.cid)}"><span class="hb-row-a">${_hbE(o.desc || o.what || '')}</span>
      <span class="hb-row-r"><span class="hb-chip is-bad">${_hbE(i18tn('hb_days_late', Math.abs(o.days != null ? o.days : -o.late), { n: Math.abs(o.days != null ? o.days : -o.late) }))}</span></span>
      <span class="hb-row-b">${_hbE((c && c.name) || o.cname || '')} · ${_hbE(o.counterparty || o.cp || '')} · ${(o.assignee || o.who) ? _hbE(o.assignee || o.who) : '<span class="hb-hollow"></span>' + _hbE(i18t('hb_nobody'))}</span></button>`; }).join('')}</div>`;
}

/* ---- THE DIG-IN: a trail, then the reading behind what was pressed ---- */
function hbCrumbOf(key, lens){
  const D = hbDigData(key, lens); if (!D) return '?';
  if (D.crumb) return D.crumb;
  if (D.kind === 'card') return D.card.ref + ' · ' + D.card.name;
  if (D.kind === 'moved') return i18t('hb_moved_crumb', { what: i18t(D.word) });
  if (D.kind === 'agent') return i18t('ag_' + D.agent);
  if (D.kind === 'done') return i18tn('hb_done_' + D.agent, D.n, { n: D.n });
  return D.word ? i18t(D.word) : key;
}
/* ---------------- CHART FIRST (Young, 3 Oct 2026 evening) ----------------
   "since this is a dashboard, the output should be in chart format and then
   you can get an option to make it a list." Every list the board answers
   with is drawn as a chart first — the question's own shape picks which —
   and one switch, Chart | List, remembered per card, shows the rows. Every
   bar and column is a door that digs one step deeper. The chart is HTML, so
   it is read by a keyboard and scales to the room in Present. */
const HB_KEY_SEP = '§';
const HB_CHART_BARS = 12, HB_CHART_MONTHS = 18;
const HB_GROUP_FIELDS = ['status', 'folder', 'counterparty', 'kind'];
const HB_STATUS_ORDER = ['Draft', 'Under Review', 'Signed', 'Declined'];
function hbNextGroup(fixed){ const f = new Set(fixed || []); return HB_GROUP_FIELDS.find(k => !f.has(k)) || 'status'; }
function hbGroupOf(c, field){
  if (field === 'status') return c.status || '';
  if (field === 'folder') return (typeof FOLDERS !== 'undefined' && FOLDERS && FOLDERS[c.folder] && FOLDERS[c.folder].name) || String(c.folder || '');
  if (field === 'counterparty') return (typeof graphPartyLabel === 'function') ? graphPartyLabel(c.counterparty) : String(c.counterparty || '').trim();
  if (field === 'kind'){ try { return (typeof cKind === 'function') ? cKind(c) : ''; } catch (_){ return ''; } }
  if (field === 'side'){ const x = hbSideOf(c); return x || ''; }
  if (field === 'owner'){ try { return String(((typeof contractOwnerName === 'function') ? contractOwnerName(c) : (c.owner && c.owner.name)) || c._raisedBy || '').trim(); } catch (_){ return ''; } }
  /* PAYMENT TERMS: the payment-terms tab's own bands (payBucketOf), so the
     board and that page never sort one contract two ways; no terms read is
     its own slice */
  if (field === 'payterms'){ try { const d = (typeof payDays === 'function') ? payDays(c) : null; return d == null ? '' : ((typeof payBucketOf === 'function') ? payBucketOf(d) : String(d)); } catch (_){ return ''; } }
  /* THE DEAL FACTS (the board that answers right, Part 8): each borrows the
     reading its own page draws, RAW off the record — counting never starts a
     negotiation — and a fact HaTi cannot read is a group of its own */
  if (HB_DEAL_GROUPS.includes(field)) return hbDealGroupOf(c, field);
  return '';
}
/* the five deal facts, as group keys (stable English, translated on the label) */
const HB_DEAL_GROUPS = ['move', 'rounds', 'overdue', 'decision', 'risks', 'standards', 'liabcap', 'autorenew', 'priceup'];
const HB_DEAL_ORDER = { move: ['us', 'them', 'none'], rounds: ['0', '1', '2', '3', '4+'], overdue: ['yes', 'no'], risks: ['3+', '1-2', '0', 'unread'], standards: ['off', 'met', 'unchecked'],
  liabcap: ['uncapped', 'capped', 'unclear', 'unread'], autorenew: ['yes', 'no', 'unclear', 'unread'], priceup: ['at_will', 'indexed', 'fixed', 'none', 'unclear', 'unread'] };
/* WHAT THE CONTRACT SAYS (Charts That Explain, rec 7): the overnight reading
   of each contract's key terms rides the light list as transport (_book, off
   its own server table, book_readings) — a term nobody read is 'unread', one
   the reading could not pin to a quote is 'unclear', never guessed */
const HB_KEY_TERMS = { liabcap: 'liabilityCap', autorenew: 'autoRenew', priceup: 'priceIncrease' };
function hbKeyTermsOf(c){ const b = c && c._book; return b && b.terms && typeof b.terms === 'object' ? b.terms : null; }
function hbKeyTermOf(c, field){
  const kt = hbKeyTermsOf(c); if (!kt) return 'unread';
  const t = kt[HB_KEY_TERMS[field]], st = t && typeof t === 'object' ? String(t.state || '') : '';
  return (HB_DEAL_ORDER[field] || []).includes(st) && st !== 'unread' ? st : 'unclear';
}
/* the playbook verdicts on record, or the overnight check's where the record
   could not take them (an executed contract, read beside it) */
function hbVerdictsOf(c){
  if (c && c.playbook && Array.isArray(c.playbook.verdicts) && c.playbook.verdicts.length) return c.playbook.verdicts;
  const b = c && c._book; return b && b.pb && Array.isArray(b.pb.verdicts) ? b.pb.verdicts : [];
}
function hbDealGroupOf(c, field){
  try {
    if (field === 'move'){
      if (typeof negWhoseMove !== 'function') return '';
      const w = negWhoseMove(c); return !w ? 'none' : w.k === 'you' ? 'us' : w.k === 'them' ? 'them' : 'none';
    }
    if (field === 'rounds'){ const n = c && c.negotiation && Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds.length : 0; return n >= 4 ? '4+' : String(n); }
    if (field === 'overdue'){ if (typeof graphNodeFacts !== 'function') return ''; return graphNodeFacts(c).overdue > 0 ? 'yes' : 'no'; }
    if (field === 'decision'){ if (typeof graphDecisionOf !== 'function') return ''; return String(graphDecisionOf(c).label || ''); }
    if (field === 'risks'){
      /* never read by the scan nor the brief: we do not know */
      if (!(c && c.scan && Array.isArray(c.scan.findings)) && !(c && (c._brief || c._briefLite))) return 'unread';
      const n = (typeof riskOpenOf === 'function') ? riskOpenOf(c).length : 0;
      return n >= 3 ? '3+' : n >= 1 ? '1-2' : '0';
    }
    /* OUR STANDARDS (Charts That Explain, Part 1): off standard, met, or NOT
       CHECKED — a contract nobody checked is a gap, never good news */
    if (field === 'standards') return hbStdStateOf(c);
    if (HB_KEY_TERMS[field]) return hbKeyTermOf(c, field);
  } catch (_){ return ''; }
  return '';
}
/* one reading of a contract against our standards, off the check on record:
   'unchecked' (no check), 'off' (an open deviation or a missing standard), 'met' */
function hbStdStateOf(c){
  const vs = hbVerdictsOf(c);
  if (!vs.length) return 'unchecked';
  const open = v => !!v && ((typeof pbVerdictOpen === 'function') ? pbVerdictOpen(v) : !/^(ok|aligned|na)$/.test(String(v.status || '')));
  return vs.some(open) ? 'off' : 'met';
}
/* the open standards a contract breaks, by name (the standards pack ranks them) */
function hbStdBreaches(c){
  const vs = hbVerdictsOf(c);
  const open = v => !!v && ((typeof pbVerdictOpen === 'function') ? pbVerdictOpen(v) : !/^(ok|aligned|na)$/.test(String(v.status || '')));
  return vs.filter(open).map(v => String(v.category || '').trim()).filter(Boolean);
}
/* RISK EXPOSURE, per contract: its value × the weight of its worst open
   risk; null where nobody has read it (the 'unread' group) */
function hbRiskWeightOf(c){
  if (!(c && c.scan && Array.isArray(c.scan.findings)) && !(c && (c._brief || c._briefLite))) return null;
  const open = (typeof riskOpenOf === 'function') ? riskOpenOf(c) : [];
  return open.reduce((w, it) => Math.max(w, HB_RISK_WEIGHT[it && it.sev] || 0), 0);
}
function hbExposureOf(c){ const w = hbRiskWeightOf(c); return w == null ? null : hbValueOfOne(c) * w; }
function hbGroupLabel(field, g){
  if (!g) return field === 'counterparty' ? i18t('hb_no_counterparty') : field === 'owner' ? i18t('hb_nobody_owns') : field === 'payterms' ? i18t('hb_no_payterms') : HB_DEAL_GROUPS.includes(field) ? i18t('hb_deal_unknown') : '—';
  if (field === 'move') return i18t('hb_dmove_' + g);
  if (field === 'rounds') return g === '0' ? i18t('hb_rounds_0') : i18tn('hb_rounds_n', g === '4+' ? 4 : Number(g), { n: g });
  if (field === 'overdue') return i18t('hb_overdue_' + g);
  if (field === 'risks') return g === 'unread' ? i18t('hb_risks_unread') : g === '0' ? i18t('hb_risks_0') : i18t('hb_risks_n', { n: g });
  if (field === 'standards') return i18t('hb_std_' + g);
  if (HB_KEY_TERMS[field]) return i18t('hb_kt_' + field + '_' + g);
  if (field === 'payterms') return i18tn('hb_days_n', 2, { n: g });
  if (field === 'status') return (typeof statusLabel === 'function') ? statusLabel(g) : g;
  if (field === 'side') return i18t(g === 'supplier' ? 'hb_lens_suppliers' : 'hb_lens_customers');
  return g;
}
function hbGroupWord(field){ return i18t({ status: 'hb_by_stage', folder: 'hb_by_stream', counterparty: 'hb_by_party', kind: 'hb_by_kind', side: 'hb_by_side', owner: 'hb_by_owner', payterms: 'hb_by_payterms', valueBand: 'hb_by_band', move: 'hb_by_move', rounds: 'hb_by_rounds', overdue: 'hb_by_overdue', decision: 'hb_by_decision', risks: 'hb_by_risks', standards: 'hb_by_standards', liabcap: 'hb_by_liabcap', autorenew: 'hb_by_autorenew', priceup: 'hb_by_priceup' }[field] || 'hb_by_stage'); }
function hbEndOf(c){ try { const e = (typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : c.expiry; return e ? String(e).slice(0, 10) : null; } catch (_){ return c.expiry ? String(c.expiry).slice(0, 10) : null; } }
function hbMonthOf(c, byYear){ const e = hbEndOf(c); return e ? (byYear ? e.slice(0, 4) : e.slice(0, 7)) : 'none'; }
function hbMonthLabel(m, byYear){
  if (m === 'none') return i18t('hb_c_no_end');
  if (byYear) return m;
  try { return new Date(m + '-01T00:00:00').toLocaleDateString(langLocale(), { month: 'short', year: '2-digit' }); } catch (_){ return m; }
}
/* Round bands over a range: a step of 1, 2, 2.5 or 5 times a power of ten,
   at most eight bands, the first starting on a round number. */
function hbValueBands(lo, hi, want){
  want = want || 6; if (!(hi > lo)) return [{ lo, hi: hi || lo }];
  const raw = (hi - lo) / want, p = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * p).find(x => x >= raw) || raw;
  const out = []; let a = Math.floor(lo / step) * step;
  while (a < hi && out.length < 8){ out.push({ lo: a, hi: a + step }); a += step; }
  if (out.length && out[out.length - 1].hi < hi) out[out.length - 1].hi = hi;
  return out;
}
function hbValueOfOne(c){ const h = (typeof fxHome === 'function') ? fxHome(c) : { v: Number(c.value || 0), missing: false }; return (h && !h.missing) ? (h.v || 0) : 0; }
function hbChartBarsHtml(rows, money){
  const max = Math.max(1, ...rows.map(r => money ? r.v : r.n));
  return `<div class="hb-chart hb-chart-bars">${rows.map(r => { const m = money ? r.v : r.n; const pct = Math.max(m ? 1.5 : 0, m / max * 100);
    return `<button type="button" class="hb-cbar" ${r.dig && r.n ? `data-hb-dig="${_hbE(r.dig)}"` : 'disabled'} title="${_hbE(r.label + ': ' + r.say)}">
      <span class="hb-cbar-l"><span class="hb-cbar-t">${_hbE(r.label)}</span>${r.sub ? `<span class="hb-cbar-s">${_hbE(r.sub)}</span>` : ''}</span>
      <span class="hb-cbar-tr"><span class="hb-cbar-f" style="width:${pct.toFixed(1)}%${r.color ? ';background:' + _hbE(r.color) : ''}"></span></span>
      <span class="hb-cbar-n">${_hbE(r.say)}</span></button>`; }).join('')}</div>`;
}
function hbChartColsHtml(cols, money){
  const max = Math.max(1, ...cols.map(c => money ? c.v : c.n));
  return `<div class="hb-chart hb-chart-cols">${cols.map(c => { const m = money ? c.v : c.n; const pct = Math.max(m ? 2 : 0, m / max * 100);
    return `<button type="button" class="hb-ccol${c.tone ? ' is-' + c.tone : ''}" ${c.n ? `data-hb-dig="${_hbE(c.dig)}"` : 'disabled'} title="${_hbE(c.label + ': ' + c.say)}">
      <span class="hb-ccol-n">${c.n ? _hbN(c.n) : ''}</span><span class="hb-ccol-tr"><span class="hb-ccol-f" style="height:${pct.toFixed(1)}%"></span></span>
      <span class="hb-ccol-l">${_hbE(c.label)}</span><span class="hb-ccol-v">${money && c.n ? _hbE(_hbM(c.v)) : ''}</span></button>`; }).join('')}</div>`;
}
/* ---------------- THE CHART FAMILY (Young picked the recommendation, 4 Oct 2026)
   "the charts seem to only be in bar charts which can be very boring." The
   question's shape picks the chart: a plain question the RING, a money
   question the BLOCKS, a date question the TIMELINE, an attention question
   the BUBBLES; Bars stays on the card's switch (Chart | Bars | List). Every
   piece is a door one step deeper; the drawing is SVG, so it scales to the
   room in Present and a keyboard walks it (Enter on a focused piece digs). */
const HB_RING_MAX = 7, HB_BLOCK_GROUPS = 6, HB_BLOCK_TILES = 9, HB_TL_MONTHS = 30, HB_TL_ROWS = 48, HB_TL_PACK = 24, HB_TL_SHORT = 2, HB_BUB_MAX = 150;
const HB_ATTENTION_RE = /^(move|owner|overdue|not read yet|off standard|liability)/;
const HB_HUES = ['#38CDB8', '#86B8EA', '#E0CB8F', '#C9A0E8', '#F0A58F', '#8FD39A', '#E8B4C8', '#9FB3C8'];
const HB_TILE_INK = '#021011';
function hbHueOf(field, g, i){ return (field === 'status' && typeof hmStageTone === 'function') ? hmStageTone(g) : HB_HUES[i % HB_HUES.length]; }
function hbStartOf(c){
  const d = c.effectiveDate || (c.fields && c.fields.effDate) || ((typeof contractSignedAt === 'function') ? contractSignedAt(c) : c.signedAt) || c.createdAt || null;
  const s = d ? String(d).slice(0, 10) : '';
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}
function hbObOpen(c){ return (Array.isArray(c.obligations) ? c.obligations : []).filter(o => o && ((typeof obState === 'function') ? obState(o) : (o.status || 'open')) !== 'done').length; }
function hbDaysTo(iso){ const t = new Date(hbToday() + 'T00:00:00'), d = new Date(iso + 'T00:00:00'); return Math.round((d - t) / 864e5); }
function hbGroupsOf(cs, field, money){
  const groups = {}; cs.forEach(c => { const g = hbGroupOf(c, field); (groups[g] || (groups[g] = [])).push(c); });
  const rows = Object.keys(groups).map(g => { const list = groups[g]; const v = list.reduce((a, c) => a + hbValueOfOne(c), 0); return { g, label: hbGroupLabel(field, g), list, n: list.length, v }; });
  if (field === 'status') rows.sort((a, b) => HB_STATUS_ORDER.indexOf(a.g) - HB_STATUS_ORDER.indexOf(b.g));
  else if (HB_DEAL_ORDER[field]){ const at = g => { const i = HB_DEAL_ORDER[field].indexOf(g); return i < 0 ? 98 : i; }; rows.sort((a, b) => at(a.g) - at(b.g)); }
  else if (field === 'payterms'){ const at = g => { const i = (typeof PAY_BUCKETS !== 'undefined' ? PAY_BUCKETS : []).findIndex(b => b.k === g); return g ? (i < 0 ? 98 : i) : 99; }; rows.sort((a, b) => at(a.g) - at(b.g)); }
  else rows.sort((a, b) => (money ? b.v - a.v : b.n - a.n) || a.label.localeCompare(b.label));
  return rows;
}
function _hbSvgDoor(dig, title){ return `${dig ? `data-hb-dig="${_hbE(dig)}" tabindex="0" role="button"` : ''}><title>${_hbE(title)}</title`; }
function hbRingSvg(D, cs, field, money, P){
  const sayOf = (n, v) => money ? _hbM(v) + ' · ' + _hbN(n) : _hbN(n);
  /* the reader's order and top N; the rest is one slice, and a door */
  /* ranked by the card's own measure: a count ranks by contracts, value by money */
  const cut = hbGroupsCut(hbGroupsOf(cs, field, money), P || {}, HB_RING_MAX, P && P.measure === 'value' && money ? 'value' : 'count', field);
  const rows = cut.rest ? cut.rows.concat([cut.rest]) : cut.rows;
  const whole = rows.reduce((a, r) => a + (money ? r.v : r.n), 0) || 1;
  const rowH = 38, H = Math.max(300, 40 + rows.length * rowH + 16), W = 1000, R = 118, r = 84, cx = 150, cy = H / 2;
  let a0 = -Math.PI / 2, slices = '', legend = '';
  rows.forEach((g, i) => {
    const share = (money ? g.v : g.n) / whole; const a1 = a0 + share * Math.PI * 2; const big = (a1 - a0) > Math.PI ? 1 : 0;
    const p = (ang, rad) => [cx + rad * Math.cos(ang), cy + rad * Math.sin(ang)];
    const gap = share < 0.999 ? 0.012 : 0; const g0 = a0 + gap, g1 = a1 - gap;
    const [x0, y0] = p(g0, R), [x1, y1] = p(g1, R), [x2, y2] = p(g1, r), [x3, y3] = p(g0, r);
    const hue = g.rest ? 'rgba(var(--hb-ln),.3)' : hbHueOf(field, g.g, i);
    const title = g.label + ': ' + sayOf(g.n, g.v) + ' · ' + Math.round(share * 100) + '%';
    const dig = g.rest ? hbRestDig(D, field, cut.kept, money) : 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + g.g;
    const d = share >= 0.999 ? `M${cx},${cy - R} A${R},${R} 0 1 1 ${cx - 0.01},${cy - R} L${cx - 0.01},${cy - r} A${r},${r} 0 1 0 ${cx},${cy - r} Z`
      : `M${x0.toFixed(1)},${y0.toFixed(1)} A${R},${R} 0 ${big} 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${r},${r} 0 ${big} 0 ${x3.toFixed(1)},${y3.toFixed(1)} Z`;
    slices += `<g class="hb-sv-slice hb-in" style="animation-delay:${i * 40}ms" ${_hbSvgDoor(dig, title)}><path d="${d}" style="fill:${hue}"/></g>`;
    const y = 40 + i * rowH;
    legend += `<g class="hb-sv-row hb-in" style="animation-delay:${i * 40}ms" transform="translate(360,${y})" ${_hbSvgDoor(dig, title)}>
      <rect x="-8" y="-4" width="636" height="${rowH}" fill="transparent"/><rect x="0" y="2" width="10" height="10" rx="2" style="fill:${hue}"/>
      <text x="20" y="12" font-size="14" font-weight="600" class="hb-sv-ink">${_hbE(g.label)}</text>
      <text x="20" y="29" font-size="12" class="hb-sv-ink2">${_hbE(sayOf(g.n, g.v))} · ${Math.round(share * 100)}%</text>
      <rect x="380" y="5" width="240" height="8" rx="4" class="hb-sv-track"/><rect x="380" y="5" width="${(240 * share).toFixed(1)}" height="8" rx="4" style="fill:${hue}" opacity=".9"/></g>`;
    a0 = a1;
  });
  const total = cs.reduce((a, c) => a + hbValueOfOne(c), 0);
  const centre = `<text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="44" font-weight="700" class="hb-sv-ink">${_hbN(cs.length)}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="13" class="hb-sv-ink2">${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}</text>
    ${money ? `<text x="${cx}" y="${cy + 38}" text-anchor="middle" font-size="15" font-weight="600" class="hb-sv-glow">${_hbE(_hbM(total))}</text>` : ''}`;
  return { body: `<svg class="hb-svg hb-ring" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(hbGroupWord(field))}">${slices}${centre}${legend}</svg>`, by: hbGroupWord(field), note: '' };
}
function hbBlocksSvg(D, cs, field, money, P){
  let groups = hbGroupsOf(cs.filter(c => hbValueOfOne(c) > 0), field, true);
  const unvalued = cs.length - groups.reduce((a, g) => a + g.n, 0);
  if (!groups.length) return hbRingSvg(D, cs, field, money, P);
  const cut = hbGroupsCut(groups, P || {}, HB_BLOCK_GROUPS, 'value', field);
  groups = cut.rest ? cut.rows.concat([cut.rest]) : cut.rows;
  const whole = groups.reduce((a, g) => a + g.v, 0) || 1, vmax = Math.max(1, ...cs.map(hbValueOfOne));
  const W = 1000, H = 330; let x = 0, out = '';
  groups.forEach((g, gi) => {
    const w = W * g.v / whole; const hue = g.rest ? '#9FB3C8' : hbHueOf(field, g.g, gi);
    const title = g.label + ': ' + _hbM(g.v) + ' · ' + _hbN(g.n) + ' · ' + Math.round(g.v / whole * 100) + '%';
    const dig = g.rest ? hbRestDig(D, field, cut.kept, 'b') : 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + g.g;
    out += `<g class="hb-sv-block hb-in" style="animation-delay:${gi * 40}ms" ${_hbSvgDoor(dig, title)}><rect x="${(x + 2).toFixed(1)}" y="2" width="${Math.max(0, w - 4).toFixed(1)}" height="${H - 4}" rx="6" style="fill:${hue};stroke:${hue}" fill-opacity=".16" stroke-opacity=".5"/>
      ${w > 90 ? `<text x="${(x + 14).toFixed(1)}" y="26" font-size="12" font-weight="600" letter-spacing=".06em" style="fill:${hue}">${_hbE(String(g.label).toUpperCase().slice(0, Math.floor(w / 8)))}</text>
      <text x="${(x + 14).toFixed(1)}" y="50" font-size="18" font-weight="700" class="hb-sv-ink">${_hbE(_hbM(g.v))}</text><text x="${(x + 14).toFixed(1)}" y="68" font-size="12" class="hb-sv-ink2">${_hbE(_hbN(g.n))} · ${Math.round(g.v / whole * 100)}%</text>` : ''}</g>`;
    /* tiles: the biggest contracts as strips of rows sized by value; the rest one tile */
    const sorted = g.list.slice().sort((a, b) => hbValueOfOne(b) - hbValueOfOne(a));
    /* the biggest contracts are named tiles in rows the column is wide enough
       for (never a sliver: a tile's width blends an equal share with its
       value's); the rest is one band at the foot */
    const top = 84, innerW = Math.max(0, w - 20), perRow = Math.max(1, Math.min(3, Math.floor(innerW / 80)));
    const named = Math.min(HB_BLOCK_TILES, perRow * 3, sorted.length);
    const tiles = sorted.slice(0, named).map(c => ({ c, v: hbValueOfOne(c) }));
    const more = sorted.slice(named);
    const rows = []; for (let i = 0; i < tiles.length; i += perRow) rows.push(tiles.slice(i, i + perRow));
    if (more.length) rows.push([{ more: more.length, v: more.reduce((a, c) => a + hbValueOfOne(c), 0) }]);
    const rowH = (H - top - 10) / Math.max(rows.length, 1);
    let y = top; rows.forEach(r => { const sum = r.reduce((a, t) => a + t.v, 0) || 1; let tx = x + 10;
      r.forEach(t => { const tw = r.length === 1 ? innerW : innerW * (0.15 + 0.85 * t.v / sum) / (0.15 * r.length + 0.85);
        const ttl = t.more ? i18t('hb_chart_more', { n: _hbN(t.more) }) + ' · ' + _hbM(t.v) : hbRef(t.c) + ' · ' + String(t.c.name || '') + (t.c.counterparty ? ' · ' + t.c.counterparty : '') + ': ' + _hbM(t.v);
        out += `<g class="hb-sv-tile hb-in" style="animation-delay:${gi * 40}ms" ${_hbSvgDoor(t.more ? dig : 'c:' + t.c.id, ttl)}><rect x="${(tx + 2).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(0, tw - 4).toFixed(1)}" height="${Math.max(0, rowH - 6).toFixed(1)}" rx="4" style="fill:${hue}" fill-opacity="${t.more ? 0.3 : (0.5 + 0.45 * t.v / vmax).toFixed(2)}"/>
          ${tw > 64 && rowH > 30 ? `<text x="${(tx + 10).toFixed(1)}" y="${(y + 17).toFixed(1)}" font-size="12" font-weight="600" fill="${HB_TILE_INK}">${_hbE(t.more ? '+' + _hbN(t.more) : hbRef(t.c))}</text>${rowH > 44 ? `<text x="${(tx + 10).toFixed(1)}" y="${(y + 33).toFixed(1)}" font-size="11" fill="${HB_TILE_INK}" opacity=".8">${_hbE(_hbM(t.v))}</text>` : ''}` : ''}</g>`;
        tx += tw; });
      y += rowH; });
    x += w;
  });
  return { body: `<svg class="hb-svg hb-blocks" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_by_blocks', { by: hbGroupWord(field) }))}">${out}</svg>`,
    by: i18t('hb_by_blocks', { by: hbGroupWord(field) }), note: unvalued ? i18t('hb_chart_unvalued', { n: _hbN(unvalued) }) : '' };
}
function hbTimelineSvg(D, cs, money){
  const today = hbToday(); const tY = Number(today.slice(0, 4)), tM = Number(today.slice(5, 7)) - 1;
  const mIdx = iso => (Number(iso.slice(0, 4)) - tY) * 12 + (Number(iso.slice(5, 7)) - 1 - tM) + (Number(iso.slice(8, 10)) - 1) / 30;
  const items = cs.map(c => ({ c, start: hbStartOf(c), end: hbEndOf(c), status: c.status || '' }));
  const ends = items.map(i => i.end).filter(Boolean).map(mIdx), starts = items.map(i => i.start).filter(Boolean).map(mIdx);
  let m0 = Math.floor(Math.min(-3, ...starts.map(s => Math.max(s, -12)))); let m1 = Math.ceil(Math.max(9, ...ends.map(e => Math.min(e, 30))));
  if (m1 - m0 > HB_TL_MONTHS) m0 = m1 - HB_TL_MONTHS;
  const months = m1 - m0; const W = 1000, L = 190, Rm = 16, axisY = 34, laneGap = 14;
  const X = m => L + (W - L - Rm) * (Math.max(m0, Math.min(m1, m)) - m0) / months;
  const keyOf = m => { const y = tY + Math.floor((tM + m) / 12), mo = ((tM + m) % 12 + 12) % 12; return y + '-' + String(mo + 1).padStart(2, '0'); };
  const order = HB_STATUS_ORDER.concat([...new Set(items.map(i => i.status))].filter(s => !HB_STATUS_ORDER.includes(s)));
  const lanes = order.map(s => ({ s, label: hbGroupLabel('status', s), list: items.filter(i => i.status === s) })).filter(l => l.list.length);
  let out = '', lanesOut = '', y = axisY + 14;
  const span = (it, short) => { const e = it.end ? mIdx(it.end) : null; let s = it.start ? mIdx(it.start) : (e != null ? e - 1 : 0); if (short && e != null) s = Math.max(s, e - HB_TL_SHORT); return [s, e != null ? e : s + 1.5]; };
  /* pills pack into rows per lane; a crowded set keeps only the last months
     of each pill so the lanes stay short, and past the cap the rest is said */
  const pack = short => { const placed = []; let rowsUsed = 0, left = 0;
    lanes.forEach(l => { l.list.sort((a, b) => span(a, short)[0] - span(b, short)[0]); const rows = [];
      l.list.forEach(it => { const [s, e] = span(it, short); let ri = rows.findIndex(last => last + 0.35 < s);
        if (ri < 0){ if (rowsUsed + rows.length + 1 > HB_TL_ROWS){ left++; return; } rows.push(e); ri = rows.length - 1; } else rows[ri] = e;
        placed.push([l, ri, it, s, e]); });
      l.n = rows.length; rowsUsed += rows.length; });
    return { placed, rowsUsed, left }; };
  let P = pack(false); if (P.left || P.rowsUsed > HB_TL_PACK) P = pack(true);
  const placed = P.placed, left = P.left;
  /* a crowded chart takes tighter rows and a smaller face; the word "past end" is a key drawn once */
  const rowH = P.rowsUsed > HB_TL_PACK ? 16 : 20, fs = rowH > 16 ? 10.5 : 9, ty = rowH / 2 + 3.5; let anyPast = false;
  const H = axisY + 14 + lanes.reduce((a, l) => a + l.n * rowH + laneGap, 0) + 36;
  /* a long span names every second or third month, so the names never run together */
  const nameEvery = Math.max(1, Math.ceil(months / 14));
  for (let i = 0; i < months; i++){ const m = m0 + i; const x = X(m), x2 = X(m + 1); const k = keyOf(m); const mo = ((tM + m) % 12 + 12) % 12;
    const n = items.filter(it => it.end && it.end.slice(0, 7) === k).length;
    out += `<rect x="${x.toFixed(1)}" y="${axisY}" width="${(x2 - x).toFixed(1)}" height="${H - axisY - 30}" class="${Math.floor(mo / 3) % 2 ? 'hb-sv-qtr' : ''}" fill="${Math.floor(mo / 3) % 2 ? '' : 'transparent'}"/>`;
    if (mo % 3 === 0) out += `<line x1="${x.toFixed(1)}" y1="${axisY}" x2="${x.toFixed(1)}" y2="${H - 30}" class="hb-sv-grid"/>`;
    const label = hbMonthLabel(k, false); const ttl = label + (n ? ': ' + i18tn('hb_tl_end_n', n, { n: _hbN(n) }) : '');
    out += `<g class="hb-sv-month" ${_hbSvgDoor(n ? 'qm:' + D.key + HB_KEY_SEP + 'm' + HB_KEY_SEP + k : '', ttl)}><rect x="${x.toFixed(1)}" y="${axisY - 24}" width="${(x2 - x).toFixed(1)}" height="22" fill="transparent"/>${i % nameEvery === 0 ? `<text x="${(x + 4).toFixed(1)}" y="${axisY - 8}" font-size="11" class="hb-sv-ink2">${_hbE(label)}</text>` : ''}
      ${n && i % nameEvery === 0 ? `<text x="${((x + x2) / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="600" class="hb-sv-ink2">${_hbE(i18tn('hb_tl_end_n', n, { n: _hbN(n) }))}</text>` : ''}</g>`; }
  lanes.forEach(l => { const top = y; const lv = l.list.reduce((a, it) => a + hbValueOfOne(it.c), 0); const hue = hbHueOf('status', l.s, 0);
    lanesOut += `<g class="hb-sv-lane" ${_hbSvgDoor('qg:' + D.key + HB_KEY_SEP + 'status' + HB_KEY_SEP + l.s, l.label + ': ' + (money ? _hbM(lv) + ' · ' : '') + _hbN(l.list.length))}><rect x="0" y="${top - 2}" width="${L - 10}" height="${l.n * rowH}" fill="transparent"/><rect x="4" y="${top - 2}" width="3" height="${l.n * rowH}" rx="1.5" style="fill:${hue}"/>
      <text x="12" y="${top + 14}" font-size="13" font-weight="600" class="hb-sv-ink">${_hbE(l.label)}</text><text x="12" y="${top + 30}" font-size="11" class="hb-sv-ink2">${_hbE(_hbN(l.list.length))}${money ? ' · ' + _hbE(_hbM(lv)) : ''}</text></g>`;
    placed.filter(p => p[0] === l).forEach(([, ri, it, s, e]) => { const yy = top + ri * rowH; const xs = X(s), past = it.end && it.end < today && it.status === 'Signed', xe = it.end ? X(e) : xs + 8; const fill = past ? 'var(--hb-ruby)' : hue;
      const ttl = hbRef(it.c) + ' · ' + String(it.c.name || '') + (it.c.counterparty ? ' · ' + it.c.counterparty : '') + (money ? ': ' + _hbM(hbValueOfOne(it.c)) : '') + ' · ' + (it.end ? i18t('hb_tl_ends', { d: hbMonthLabel(it.end.slice(0, 7), false) }) : i18t('hb_c_no_end'));
      if (past) anyPast = true;
      if (it.end) out += `<g class="hb-sv-pill hb-in" style="animation-delay:${Math.min(ri, 12) * 40}ms" ${_hbSvgDoor('c:' + it.c.id, ttl)}><rect x="${xs.toFixed(1)}" y="${yy + 3}" width="${Math.max(6, xe - xs).toFixed(1)}" height="${rowH - 7}" rx="${rowH > 16 ? 6 : 4}" style="fill:${fill}" opacity="${it.status === 'Declined' ? '.4' : '.9'}"/>${xe - xs > 120 ? `<text x="${(xs + 8).toFixed(1)}" y="${(yy + ty).toFixed(1)}" font-size="${fs}" font-weight="600" fill="${HB_TILE_INK}">${_hbE(hbRef(it.c) + (it.c.counterparty ? ' · ' + it.c.counterparty : ''))}</text>` : xe - xs > 52 ? `<text x="${(xs + 7).toFixed(1)}" y="${(yy + ty).toFixed(1)}" font-size="${fs}" font-weight="600" fill="${HB_TILE_INK}">${_hbE(hbRef(it.c))}</text>` : ''}</g>`;
      else out += `<g class="hb-sv-pill hb-in" style="animation-delay:${Math.min(ri, 12) * 40}ms" ${_hbSvgDoor('c:' + it.c.id, ttl)}><rect x="${xs.toFixed(1)}" y="${yy + 2}" width="200" height="${rowH - 4}" fill="transparent"/><circle cx="${(xs + 4).toFixed(1)}" cy="${yy + rowH / 2 - 0.5}" r="${rowH > 16 ? 5 : 4}" style="fill:${fill}"/><line x1="${(xs + 12).toFixed(1)}" y1="${yy + rowH / 2 - 0.5}" x2="${(xs + 60).toFixed(1)}" y2="${yy + rowH / 2 - 0.5}" style="stroke:${fill}" stroke-dasharray="2 4"/><text x="${(xs + 66).toFixed(1)}" y="${(yy + ty).toFixed(1)}" font-size="${fs}" class="hb-sv-ink2">${_hbE(hbRef(it.c) + ' · ' + i18t('hb_c_no_end'))}</text></g>`; });
    y += l.n * rowH + laneGap; });
  const tx = X(mIdx(today));
  if (anyPast) out += `<rect x="12" y="${H - 24}" width="10" height="10" rx="2" class="hb-sv-ruby"/><text x="27" y="${H - 15}" font-size="11" class="hb-sv-ink2">${_hbE(i18t('hb_tl_past'))}</text>`;
  out += `<line x1="${tx.toFixed(1)}" y1="${axisY - 2}" x2="${tx.toFixed(1)}" y2="${H - 30}" class="hb-sv-today" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="${(tx - 22).toFixed(1)}" y="${H - 28}" width="44" height="16" rx="8" class="hb-sv-today-pill"/><text x="${tx.toFixed(1)}" y="${H - 16}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${HB_TILE_INK}">${_hbE(i18t('hb_tl_today'))}</text>`;
  return { body: `<svg class="hb-svg hb-tl" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_by_timeline'))}"><line x1="${L}" y1="${axisY}" x2="${W - Rm}" y2="${axisY}" class="hb-sv-axis"/>${out}${lanesOut}</svg>`,
    by: i18t('hb_by_timeline'), note: left ? i18t('hb_chart_more', { n: _hbN(left) }) : '' };
}
function hbBubblesSvg(D, cs){
  const W = 1000, H = 360, L = 70, R = 30, T = 28, B = 46, xmin = -90, xmax = 450;
  const vals = cs.map(hbValueOfOne); const bands = hbValueBands(0, Math.max(1, ...vals), 4); const ymax = bands[bands.length - 1].hi || 1;
  const X = d => L + (W - L - R) * (d - xmin) / (xmax - xmin), Y = v => T + (H - T - B) * (1 - Math.min(ymax, v) / ymax);
  let out = '';
  [0, 90, 180, 270, 365].forEach(d => { out += `<line x1="${X(d).toFixed(1)}" y1="${T}" x2="${X(d).toFixed(1)}" y2="${H - B}" class="${d ? 'hb-sv-grid' : 'hb-sv-axis'}" ${d ? '' : 'stroke-dasharray="4 3"'}/><text x="${X(d).toFixed(1)}" y="${H - B + 18}" text-anchor="middle" font-size="11" class="hb-sv-ink2">${_hbE(d === 0 ? i18t('hb_tl_today') : d === 365 ? i18t('hb_bub_year') : i18t('hb_bub_days', { n: d }))}</text>`; });
  bands.forEach(b => { if (!b.hi) return; out += `<line x1="${L}" y1="${Y(b.hi).toFixed(1)}" x2="${W - R}" y2="${Y(b.hi).toFixed(1)}" class="hb-sv-grid"/><text x="${L - 8}" y="${(Y(b.hi) + 4).toFixed(1)}" text-anchor="end" font-size="11" class="hb-sv-ink2">${_hbE(_hbM(b.hi))}</text>`; });
  out += `<text x="${X(20).toFixed(1)}" y="${T + 14}" font-size="11" font-weight="600" letter-spacing=".06em" class="hb-sv-amber">${_hbE(i18t('hb_bub_soon').toUpperCase())}</text><text x="${X(300).toFixed(1)}" y="${T + 14}" font-size="11" font-weight="600" letter-spacing=".06em" class="hb-sv-mute">${_hbE(i18t('hb_bub_hand').toUpperCase())}</text><text x="${X(-85).toFixed(1)}" y="${T + 14}" font-size="11" font-weight="600" letter-spacing=".06em" class="hb-sv-ruby">${_hbE(i18t('hb_bub_past').toUpperCase())}</text>`;
  const shown = cs.slice().sort((a, b) => hbValueOfOne(b) - hbValueOfOne(a)).slice(0, HB_BUB_MAX);
  const named = new Set(shown.slice(0, 6).map(c => c.id));
  shown.forEach((c, i) => { const end = hbEndOf(c); const days = end ? hbDaysTo(end) : xmax; const v = hbValueOfOne(c); const ob = hbObOpen(c);
    const x = X(Math.max(xmin, Math.min(xmax, days))), y = Y(v), r = 7 + Math.min(6, ob) * 4;
    const ttl = hbRef(c) + ' · ' + String(c.name || '') + (c.counterparty ? ' · ' + c.counterparty : '') + ': ' + _hbM(v) + ' · ' + (end ? i18t('hb_bub_days', { n: days }) : i18t('hb_c_no_end')) + ' · ' + i18tn('hb_bub_ob', ob, { n: ob });
    out += `<g class="hb-sv-bub hb-in" style="animation-delay:${Math.min(i, 12) * 40}ms" ${_hbSvgDoor('c:' + c.id, ttl)}><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="fill:${hbHueOf('status', c.status || '', 0)}" opacity=".78" stroke="${HB_TILE_INK}" stroke-width="1"/>${named.has(c.id) || (days < 90 && v >= ymax * 0.4) ? `<text x="${(x + r + 4).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="11" font-weight="600" class="hb-sv-ink">${_hbE(hbRef(c))}</text>` : ''}</g>`; });
  out += `<text x="${((L + W - R) / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(i18t('hb_bub_x'))}</text><text transform="translate(14,${((T + H - B) / 2).toFixed(1)}) rotate(-90)" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(i18t('hb_bub_y'))}</text>`;
  const stages = [...new Set(shown.map(c => c.status || ''))]; const key = stages.map((s, i) => `<g transform="translate(${W - R - 90 * stages.length + i * 90},${T - 12})"><circle cx="0" cy="-4" r="5" style="fill:${hbHueOf('status', s, 0)}"/><text x="10" y="0" font-size="11" class="hb-sv-ink2">${_hbE(hbGroupLabel('status', s))}</text></g>`).join('');
  return { body: `<svg class="hb-svg hb-bub" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_by_bubbles'))}">${out}${key}</svg>`, by: i18t('hb_by_bubbles'), note: cs.length > shown.length ? i18t('hb_chart_more', { n: _hbN(cs.length - shown.length) }) : '' };
}
function hbBarsFamily(D, cs, mode, field, money){
  const sayOf = (n, v) => money ? _hbM(v) + ' · ' + _hbN(n) : _hbN(n);
  let body = '', by = '', note = '';
  if (mode === 'values' && cs.length > HB_CHART_BARS){
    /* a big set by value is BANDS, each a door, so an executive sees the
       shape of the money before any name */
    const vals = cs.map(hbValueOfOne);
    const bands = hbValueBands(Math.min(...vals), Math.max(...vals));
    const rows = bands.map((b, i) => { const last = i === bands.length - 1; const list = cs.filter(c => { const v = hbValueOfOne(c); return v >= b.lo && (v < b.hi || (last && v <= b.hi)); });
      const v = list.reduce((a, c) => a + hbValueOfOne(c), 0);
      return { label: _hbM(b.lo) + ' – ' + _hbM(b.hi), n: list.length, v, say: sayOf(list.length, v), dig: 'qv:' + D.key + HB_KEY_SEP + b.lo + HB_KEY_SEP + b.hi + HB_KEY_SEP + (last ? '1' : '0') }; }).filter(r => r.n);
    body = hbChartBarsHtml(rows, false);
    by = i18t('hb_by_band');
  } else if (mode === 'values'){
    const top = cs.slice().sort((a, b) => hbValueOfOne(b) - hbValueOfOne(a)).slice(0, HB_CHART_BARS);
    body = hbChartBarsHtml(top.map(c => ({ label: hbRef(c) + ' · ' + String(c.name || ''), sub: String(c.counterparty || ''), n: 1, v: hbValueOfOne(c), say: _hbM(hbValueOfOne(c)), dig: 'c:' + c.id })), true);
    by = i18t('hb_by_value');
  } else if (mode === 'months'){
    const keys = cs.map(c => hbMonthOf(c, false)).filter(k => k !== 'none');
    const byYear = !!keys.length && (() => { const ms = keys.slice().sort(); const [y0, m0] = ms[0].split('-').map(Number), [y1, m1] = ms[ms.length - 1].split('-').map(Number); return (y1 - y0) * 12 + (m1 - m0) + 1 > HB_CHART_MONTHS; })();
    const ks = cs.map(c => hbMonthOf(c, byYear)); const none = ks.filter(k => k === 'none').length;
    const dated = ks.filter(k => k !== 'none').sort(); const span = [];
    if (dated.length){
      if (byYear){ for (let y = Number(dated[0]); y <= Number(dated[dated.length - 1]); y++) span.push(String(y)); }
      else { let [y, m] = dated[0].split('-').map(Number); const last = dated[dated.length - 1]; let k = dated[0]; while (k <= last && span.length <= HB_CHART_MONTHS){ span.push(k); m++; if (m > 12){ m = 1; y++; } k = y + '-' + String(m).padStart(2, '0'); } }
    }
    const today = hbToday().slice(0, byYear ? 4 : 7);
    const sep = HB_KEY_SEP, unit = byYear ? 'y' : 'm';
    const cols = span.map(k => { const list = cs.filter(c => hbMonthOf(c, byYear) === k); const v = list.reduce((a, c) => a + hbValueOfOne(c), 0);
      return { label: hbMonthLabel(k, byYear), n: list.length, v, say: sayOf(list.length, v), dig: 'qm:' + D.key + sep + unit + sep + k, tone: k < today ? 'past' : '' }; });
    if (none){ const list = cs.filter(c => hbMonthOf(c, byYear) === 'none'); const v = list.reduce((a, c) => a + hbValueOfOne(c), 0); cols.push({ label: hbMonthLabel('none'), n: none, v, say: sayOf(none, v), dig: 'qm:' + D.key + sep + unit + sep + 'none', tone: 'none' }); }
    body = hbChartColsHtml(cols, money);
    by = i18t(byYear ? 'hb_by_year' : 'hb_by_month');
  } else {
    const groups = {}; cs.forEach(c => { const g = hbGroupOf(c, field); (groups[g] || (groups[g] = [])).push(c); });
    let rows = Object.keys(groups).map(g => { const list = groups[g]; const v = list.reduce((a, c) => a + hbValueOfOne(c), 0);
      return { g, label: hbGroupLabel(field, g), n: list.length, v, say: sayOf(list.length, v), dig: 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + g,
        color: field === 'status' && typeof hmStageTone === 'function' ? hmStageTone(g) : '' }; });
    if (field === 'status') rows.sort((a, b) => HB_STATUS_ORDER.indexOf(a.g) - HB_STATUS_ORDER.indexOf(b.g));
    else rows.sort((a, b) => (money ? b.v - a.v : b.n - a.n) || a.label.localeCompare(b.label));
    if (rows.length > HB_CHART_BARS){ note = i18t('hb_chart_more_groups', { n: _hbN(rows.length - HB_CHART_BARS) }); rows = rows.slice(0, HB_CHART_BARS); }
    body = hbChartBarsHtml(rows, money);
    by = hbGroupWord(field);
  }
  return { body, by, note };
}
/* ---------------- THE RECIPE (Young, "Build it", 4 Oct 2026) ----------------
   "The chart family is still not working well … when I ask for a timeline by
   month the charts do not come out as I asked." The board read only WHICH
   contracts; the words about the PICTURE ("by month", "as a pie", "timeline",
   "trend") were dropped or taken by the hidden map. Now every board question
   is read in four parts and a switch — which contracts · split by · picture ·
   measure · trend — HB_RC holds the words (fixed, both languages, never the
   screen's labels). The parts stand on the card as dropdowns, so a near miss
   is one press, not a new question; a press is kept per card (s.recipe).
   HaTi does every count; a trend is a straight line through months that
   carry enough contracts, and with too few it says so instead of drawing. */
const HB_PICS = ['cols', 'gantt', 'ring', 'bars', 'blocks', 'bubbles', 'list', 'stack', 'grouped', 'heat'];
const HB_MEASURES = ['count', 'value', 'daysToSign', 'payDays', 'rounds', 'live', 'exposure', 'avgValue', 'medianValue', 'medianDaysToSign'];
/* the two signing-speed measures: the average and (the analyst's missing
   calculation, Young, 6 Oct 2026) the MEDIAN days from raised to signed */
const hbSignM = m => m === 'daysToSign' || m === 'medianDaysToSign';
/* CHARTS THAT EXPLAIN, Part 1 (Young, 5 Oct 2026): the money measures — risk
   exposure (value × the weight of the worst open risk), the average and the
   median value — obey canViewValues like value; a reader not shown values is
   shown counts. */
const HB_MONEY_MEASURES = ['value', 'exposure', 'avgValue', 'medianValue'];
const hbMoneyMeasure = m => HB_MONEY_MEASURES.includes(m);
/* RISK EXPOSURE: a contract's value at risk is its value weighted by its
   WORST open risk (high all of it, medium half, low a quarter); no open risk
   is none; a contract never read by the scan nor the brief is not known and
   is left out, and said. */
const HB_RISK_WEIGHT = { high: 1, med: 0.5, low: 0.25 };
/* RUNNING TOTAL and SHARE OF TOTAL: how an additive measure is shown */
const HB_SHOWS = ['running', 'share'];
const HB_UNITS = ['m', 'q', 'y'];
const HB_DATES = ['end', 'signed', 'start', 'created', 'decision'];
const HB_SPLIT_GROUPS = ['status', 'folder', 'counterparty', 'owner', 'kind', 'side', 'payterms', 'valueBand', 'move', 'rounds', 'overdue', 'decision', 'risks', 'standards', 'liabcap', 'autorenew', 'priceup'];
/* THE RECIPE'S OTHER PARTS (work order Part 1, 4 Oct 2026): the pictures two
   splits need, the order, the top N, the period, the comparison, the name */
const HB_PICS2 = ['stack', 'grouped', 'heat'];
const HB_SORTS = ['value', 'count', 'name'];
const HB_DIRS = ['down', 'up'];
const HB_COMPARES = ['prev', 'year', 'range'];
const HB_TOP_MAX = 50, HB_TITLE_MAX = 80, HB_SERIES_MAX = 6, HB_HEAT_MAX = 12;
const HB_WIN_MAX = { m: 120, q: 40, y: 10 };
const HB_TREND_MIN_N = 3, HB_TREND_MIN_PTS = 6, HB_COLS_MAX = 24;
const _HB_BY = '(?:by|per|across|for each|grouped by|split by|broken down by|efter|uppdelat på)\\s+(?:the\\s+|their\\s+)?';
/* the words for each group, once: read after "by" (a split), after "and" or
   "then" (a second split), and after "top 5" (the groups a top N counts) */
const HB_RC_GW = {
  status: '(?:stages?|status(?:es)?|lifecycle|phases?|skede|steg)',
  folder: '(?:value streams?|streams?|departments?|business units?|categor(?:y|ies)|värdeström(?:mar)?|avdelning(?:ar)?)',
  counterparty: '(?:counterpart(?:y|ies)|customers?|clients?|suppliers?|vendors?|compan(?:y|ies)|part(?:y|ies)|partners?|motpart(?:er)?|kund(?:er)?|leverantör(?:er)?)',
  owner: '(?:owners?|who owns (?:them|it)|ägare|ansvarig)',
  kind: '(?:contract types?|types?|kinds?|avtalstyp(?:er)?|typ(?:er)?)',
  side: '(?:side|sida)',
  /* bare "terms" after "by" is payment terms, said and offered the other way (Part 2) */
  payterms: '(?:payment terms?|terms of payment|payment days|credit terms|terms|betalningsvillkor|betalningstid|villkor)',
  valueBand: '(?:value bands?|values?|sizes?|amounts?|värde|storlek)',
  /* the deal facts (Part 8) — read after "by", like every group */
  move: '(?:whose move|whose turn|who is waiting|who it is waiting on|vems drag|vems tur)',
  rounds: '(?:negotiation rounds?|rounds?|förhandlingsrundor|rundor)',
  overdue: '(?:overdue duties|overdue obligations|whether anything is overdue|försenade åtaganden)',
  decision: '(?:renewal decisions?|decision quarters?|förnyelsebeslut)',
  risks: '(?:risks? found|open risks|risks?|öppna risker|risker)',
  standards: '(?:(?:our |company |the )?standards?|playbook (?:checks?|results?)|standardavvikelser|standarder|våra standarder)',
  /* what the contract says (rec 7), off the overnight reading */
  liabcap: '(?:(?:a |the )?liability caps?|caps? on liability|limits? of liability|liability|ansvarsbegränsning(?:ar)?|ansvarstak)',
  autorenew: '(?:auto[- ]?renew(?:al|als|s)?|automatic renewals?|renews? automatically|automatisk förnyelse)',
  priceup: '(?:price increases?|price rises?|price escalations?|indexation|prishöjning(?:ar)?|indexering)',
};
const _HB_NUM = '(\\d{1,3}|a|an|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|en|ett|två|tre|fyra|fem|sex|sju|åtta|nio|tio|elva|tolv)';
const HB_RC_NUMS = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  en: 1, ett: 1, två: 2, tre: 3, fyra: 4, fem: 5, sex: 6, sju: 7, åtta: 8, nio: 9, tio: 10, elva: 11, tolv: 12 };
const _HB_UNITW = '(months?|quarters?|years?|månad(?:er)?|kvartal|år)';
const HB_RC = {
  unit: [['m', /\b(?:(?:by|per|each|every|a|for each|i) (?:month|månad)|monthly|month by month|month on month|månadsvis|varje månad)\b/],
         ['q', /\b(?:(?:by|per|each|every|a|for each|i) (?:quarter|kvartal)|quarterly|quarter by quarter|quarter on quarter|kvartalsvis|varje kvartal)\b/],
         ['y', /\b(?:(?:by|per|each|every|for each) (?:year|år)|yearly|annually|year by year|year on year|årsvis|varje år)\b/]],
  gantt: /\b(?:timeline|time line|gantt|tidslinje)\b/,
  /* the two-split pictures first: "stacked bars" is a stack, not bars */
  pic: [['stack', /\b(?:as |in )?(?:a )?(?:stacked(?: bars?| columns?| chart| column chart| bar chart)?|staplade(?: staplar)?)\b/],
        ['grouped', /\b(?:as |in )?(?:grouped (?:bars?|columns?)|side[- ]by[- ]side (?:bars?|columns?)|clustered(?: bars?| columns?)?|grupperade staplar)\b/],
        ['heat', /\b(?:as |in )?(?:a )?(?:heat ?map|heat ?grid|heatmap|värmekarta)\b/],
        ['ring', /\b(?:as an? |in an? )?(?:pie(?: chart)?|donut|doughnut|ring(?: chart)?|tårtdiagram|cirkeldiagram|tårta)\b/],
        ['bubbles', /\b(?:as |in )?(?:a )?(?:bubbles?(?: chart)?|scatter(?: plot)?|bubbeldiagram|bubblor)\b/],
        ['blocks', /\b(?:as |in )?(?:a )?(?:blocks|treemap|tree map)\b/],
        ['list', /\b(?:as a list|as list|in a list|as a table|in a table|som (?:en )?lista|som tabell)\b/],
        ['bars', /\b(?:as |in )?(?:a )?(?:bars?(?: chart| graph)?|column chart|columns|histogram|stapl\w*)\b/]],
  chart: /\b(?:chart|graph|plot|diagram|visuali[sz]e|draw)\b/,
  split: Object.keys(HB_RC_GW).map(g => [g, new RegExp('\\b' + _HB_BY + HB_RC_GW[g] + '\\b')]),
  /* a second split said with "and" or "then": "by stream and stage" (never a
     value band: "and value" asks for money) */
  split2: Object.keys(HB_RC_GW).filter(g => g !== 'valueBand').map(g => [g, new RegExp('\\b(?:and|then|och|sedan)\\s+(?:then\\s+)?(?:by\\s+|per\\s+|efter\\s+)?(?:the\\s+|their\\s+)?' + HB_RC_GW[g] + '\\b')]),
  stackBy: Object.keys(HB_RC_GW).filter(g => g !== 'valueBand').map(g => [g, new RegExp('\\b(?:stacked|coloured|colored|staplade|färgade)\\s+(?:by|per|efter)\\s+(?:the\\s+|their\\s+)?' + HB_RC_GW[g] + '\\b')]),
  /* "top 5 counterparties", "the 3 biggest streams": the groups a top N counts */
  topGroup: Object.keys(HB_RC_GW).filter(g => g !== 'valueBand').map(g => [g, new RegExp('\\b(?:the\\s+)?(?:top|topp|de)\\s+' + _HB_NUM + '\\s+(?:(biggest|largest|highest|smallest|lowest|största|minsta)\\s+)?' + HB_RC_GW[g] + '\\b')]),
  topBig: Object.keys(HB_RC_GW).filter(g => g !== 'valueBand').map(g => [g, new RegExp('\\b(?:the\\s+)?' + _HB_NUM + '\\s+(biggest|largest|highest|smallest|lowest|största|minsta)\\s+' + HB_RC_GW[g] + '\\b')]),
  sort: [['value:down', /\b(?:(?:biggest|largest|highest) first|by size|största först)\b/],
         ['value:up', /\b(?:(?:smallest|lowest) first|minsta först)\b/],
         ['count:down', /\b(?:most contracts first|flest avtal först)\b/],
         ['name:up', /\b(?:alphabetical(?:ly)?|a to z|a-z|i bokstavsordning)\b/]],
  /* THE PERIOD: "the last 12 months", "this year", "next 6 months" (an ending
     or a renewal "in the next N" stays the map's reader's set) */
  winLast: new RegExp('\\b(?:in |during |over |for )?(?:the )?(?:last|past|previous|senaste|de senaste|förra)\\s+' + _HB_NUM + '?\\s*' + _HB_UNITW + '\\b'),
  winNext: new RegExp('\\b(?:in |during |over |for )?(?:the )?(?:next|coming|kommande|nästa|de närmaste)\\s+' + _HB_NUM + '?\\s*' + _HB_UNITW + '\\b'),
  /* an exact range (the analyst's phrasebook writes "Q2 2026" as one) */
  /* ANY TWO PERIODS: "… from A to B compared with C to D" */
  cmpRange: /\b(?:compared (?:to|with)|against|vs\.?|versus|jämfört med|mot) (\d{4}-\d{2}-\d{2}) (?:to|and|until|till) (\d{4}-\d{2}-\d{2})\b/,
  winRange: /\b(?:from |between )(\d{4}-\d{2}-\d{2}) (?:to|and|until|till) (\d{4}-\d{2}-\d{2})\b/,
  winThis: /\b(?:in |during )?(?:this|the current|det här|detta|denna)\s+(month|quarter|year|månad(?:en)?|kvartal(?:et)?|år(?:et)?)\b|\b(year to date|ytd|i år|hittills i år)\b/,
  /* THE COMPARISON: against the same period a year back, or the one before */
  cmpYear: /\b(?:compared (?:to|with)|against|vs\.?|versus|jämfört med|mot)\s+(?:the same (?:period|time|months?|quarter) )?(?:last year|a year (?:ago|earlier|before)|the year before|previous year|förra året|i fjol|året innan)\b/,
  cmpPrev: /\b(?:compared (?:to|with)|against|vs\.?|versus|jämfört med|mot)\s+(?:the )?(?:previous|prior|last|preceding|förra|föregående)\s+(?:period|quarter|month|perioden|kvartalet|månaden)\b|\b(?:compared (?:to|with)|against)\s+the (?:period|one) before\b/,
  running: /\b(?:running total|cumulative(?:ly)?|add(?:ed|ing)? up over time|ackumulerat|löpande summa)\b/,
  share: /\b(?:share of (?:the )?total|percent(?:age)? of (?:the )?total|as (?:a )?(?:share|percentage)|andel av (?:det )?totala?)\b/,
  title: /\b(?:called|named|titled|kallad|med namnet|med rubriken)\s+["“']?([^"”']{2,80}?)["”']?\s*$/,
  date: [['signed', /\b(?:sign|signed|signing|signature|signatures|executed|signerade?|undertecknade?|signering)\b/],
         ['start', /\b(?:start(?:s|ed|ing)?|effective|began|begin|startar|startade|startdatum)\b/],
         ['created', /\b(?:created|raised|drafted|opened|new (?:contracts|agreements)|skapade?|nya avtal)\b/],
         ['decision', /\b(?:renew\w*|decision|decisions|decide|act by|must act|act|notice dates?|give notice|notice|deadline to act|förny\w*|beslut|agera senast|uppsägningsdatum)\b/],
         ['end', /\b(?:end(?:s|ed|ing)?|expir\w*|löper ut|slutar|slutdatum|upphör\w*|går ut)\b/]],
  when: /\bwhen (?:do|does|will|did)\b|\bnär (?:löper|går|slutar|förnyas)\b/,
  m: {
    /* Charts That Explain, Part 1: read before value, which they contain */
    exposure: /\b(?:risk exposure|exposure|value at risk|money at risk|riskexponering|värde i risk)\b/,
    medianDaysToSign: /\b(?:median (?:time to sign|days to sign|signing time|time to signature|cycle time|turnaround(?: time)?)|median(?:tid)? (?:till|för) signering|mediantid till signering)\b/,
    medianValue: /\b(?:median (?:contract )?value|median|medianvärde)\b/,
    avgValue: /\b(?:average (?:contract )?value|mean (?:contract )?value|average size|genomsnittligt värde|snittvärde)\b/,
    daysToSign: /\b(?:time to sign|days to sign|how (?:long|quickly|fast) (?:does it take |it takes |do they take |do we take |we take )?to (?:sign|get (?:them |it )?signed)|how (?:long|quickly|fast) (?:does|do) signing(?: take)?|signing time|time to signature|cycle time|turnaround(?: time)?|tid till signering|signeringstid)\b/,
    payDays: /\b(?:payment terms?|days to pay|payment days|betalningsvillkor|betalningstid)\b/,
    rounds: /\b(?:negotiation rounds|rounds of negotiation|rounds|förhandlingsrundor|rundor)\b/,
    value: /\b(?:value|worth|money|how much|amount|spend|värde|belopp|hur mycket)\b/,
    live: /\b(?:how many (?:live |active )?(?:contracts|agreements) (?:did we have|we had|were live)|(?:live|active|levande|aktiva) (?:contracts|agreements|avtal))\b/,
  },
  trend: /\b(?:trend\w*|over time|over the (?:last|past)|getting (?:faster|slower|longer|shorter|better|worse|bigger|smaller)|faster|slower|grow(?:s|ing)?|shrink\w*|increas\w*|decreas\w*|rising|falling|going (?:up|down)|month on month|year on year|quarter on quarter|compared (?:to|with) last|utveckling|ökar|minskar|snabbare|långsammare)\b/,
  /* words a chart question may carry that name nothing to count */
  filler: /\b(?:and|then|first|with|add|och|sedan|when|how|much|total|overall|sum|average|avg|sign|what|whats|do|does|did|will|by|per|each|every|over|time|as|an?|on|in|at|into|getting|draw|make|create|build|plot|me|it|them|these|they|we|our|take|takes|took|is|are|was|were|been|be|end|ends|ended|ending|expir\w*|start|starts|starting|started|signed|signing|created|raised|renewal|renewals|renew|renewing|decision|decisions|date|dates|new|month|months|quarter|quarters|year|years|chart|graph|than|then|so|far|has|have|had|live|active|under|managed|management|altogether|faster|slower|more|fewer|less|längre|när|per|varje|som|av|på|i)\b/g,
};
const _hbRcNorm = s => (typeof _igNorm === 'function') ? _igNorm(s) : String(s || '').toLowerCase().replace(/[?!.,;:()]/g, ' ').replace(/\s+/g, ' ').trim();
/* the date a split by time reads: the one named nearest the time words, else
   what the measure implies, else the end date */
function hbRcDateOf(text, near, fallback){
  let best = null, bestD = 1e9;
  const at = near != null ? text.slice(0, near).split(' ').length - 1 : null;
  HB_RC.date.forEach(([k, re]) => { const g = new RegExp(re.source, 'g'); let m;
    while ((m = g.exec(text))){ const pos = text.slice(0, m.index).split(' ').length - 1;
      const d = at == null ? pos : Math.abs(pos - at); if (d < bestD){ bestD = d; best = k; } } });
  return best || fallback || 'end';
}
/* Read a question's chart words. null when it carries none (an ordinary
   "which contracts" question keeps its old road). condText is the question
   with the chart words taken out, for the map's conditions reader; left is
   what neither reader understood (empty = HaTi answers it free). */
function hbRecipeRead(qRaw){
  const full = ' ' + _hbRcNorm(qRaw) + ' '; if (!full.trim()) return null;
  let t = full; let unitAt = null;
  const take = re => { const m = t.match(re); if (!m) return null; t = t.slice(0, m.index) + ' ' + t.slice(m.index + m[0].length); return m; };
  const num = w => w == null || w === '' ? 1 : (/^\d+$/.test(w) ? Number(w) : (HB_RC_NUMS[w] || null));
  const unitOf = w => /^(?:quarter|kvartal)/.test(w) ? 'q' : /^(?:year|år)/.test(w) ? 'y' : 'm';
  /* the card's own name, said at the end ("… called Renewals watch") —
     read from the words as typed, so its letters are kept */
  let title = null;
  { const m = HB_RC.title.exec(String(qRaw || '').trim()); if (m && m[1]){ title = hbPlainText(m[1], HB_TITLE_MAX); take(HB_RC.title); } }
  /* the comparison, before the trend reads "compared with last …" */
  let compare = null, vs = null;
  { const m = take(HB_RC.cmpRange); if (m && m[1] <= m[2]){ compare = 'range'; vs = { from: m[1], to: m[2] }; } }
  if (!compare){ if (take(HB_RC.cmpYear)) compare = 'year'; else if (take(HB_RC.cmpPrev)) compare = 'prev'; }
  /* the period (an ending or a renewal "in the next N …" stays the map's
     reader's set, as it always was) */
  let win = null, winAt = null;
  const endWin = /\b(?:renew\w*|expir\w*|end(?:ing|s)?|förny\w*|löper ut|går ut|upphör\w*)\b[^0-9]*?\b(?:in|within|next|over the next|inom|kommande|de närmaste|nästa|this year|i år)\b/.test(full);
  { const m = take(HB_RC.winRange); if (m && m[1] <= m[2]){ win = { from: m[1], to: m[2] }; winAt = full.indexOf(m[0].trim()); } }
  if (!win){ const m = take(HB_RC.winLast); if (m){ const n = num(m[1]); if (n) { win = { last: n, unit: unitOf(m[2]) }; winAt = full.indexOf(m[0].trim()); } } }
  if (!win && !endWin){ const m = take(HB_RC.winNext); if (m){ const n = num(m[1]); if (n){ win = { next: n, unit: unitOf(m[2]) }; winAt = full.indexOf(m[0].trim()); } } }
  if (!win && !endWin){ const m = take(HB_RC.winThis); if (m){ win = { last: 1, unit: m[1] ? unitOf(m[1]) : 'y' }; winAt = full.indexOf(m[0].trim()); } }
  if (win && HB_RC.date.some(([, re]) => re.test(full))) win.date = hbRcDateOf(full.trim(), winAt, 'end');
  if (compare === 'range'){ if (win && win.from && win.to) win.vs = vs; else compare = null; }
  let unit = null;
  for (const [u, re] of HB_RC.unit){ const m = take(re); if (m){ unit = u; unitAt = full.indexOf(m[0].trim()); break; } }
  /* "risk exposure" is a measure before any split reads it: its "risk" is
     never "by risks" ("top 5 counterparties by risk exposure") */
  const exposure = !!take(HB_RC.m.exposure);
  /* a top N names its groups: "top 5 counterparties", "the 3 biggest streams" */
  let group = null, group2 = null, top = null, sort = null;
  for (const [g, re] of HB_RC.topGroup.concat(HB_RC.topBig)){
    const m = take(re); if (!m) continue;
    const n = num(m[1]); if (!n) continue;
    group = g; top = Math.min(HB_TOP_MAX, n); sort = { by: 'value', dir: /smallest|lowest|minsta/.test(m[2] || '') ? 'up' : 'down' };
    /* "top 5 customers" still counts customers: the side stays for the conditions */
    const side = /\b(supplier|vendor|leverantör|customer|client|kund)\w*/.exec(m[0]); if (side) t += ' ' + side[0] + ' ';
    break;
  }
  /* "stacked by stage", "coloured by owner": that group is the second split
     (the stack), whatever else the question splits by */
  let stackBy = null;
  if (!group) for (const [g, re] of HB_RC.stackBy){ if (take(re)){ stackBy = g; break; } }
  if (!group) for (const [g, re] of HB_RC.split){ if (take(re)){ group = g; break; } }
  /* "by month and stream": time runs across, the group is the second split */
  if (!group && unit) for (const [g, re] of HB_RC.split2){ if (take(re)){ group = g; break; } }
  if (stackBy){ if (group && group !== stackBy) group2 = stackBy; else if (!group) group = stackBy; }
  if (group && !unit && !group2){
    for (const [g, re] of HB_RC.split){ if (g !== group && g !== 'valueBand' && take(re)){ group2 = g; break; } }
    if (!group2) for (const [g, re] of HB_RC.split2){ if (g !== group && take(re)){ group2 = g; break; } }
  }
  /* a top N's "by value" is the money it ranks by, never a split by value band */
  if (top && group2 === null && group !== 'valueBand'){ const vb = HB_RC.split.find(([g]) => g === 'valueBand'); if (vb && vb[1].test(t)){ take(vb[1]); t += ' value '; } }
  for (const [k, re] of HB_RC.sort){ if (take(re)){ const [by, dir] = k.split(':'); sort = { by, dir }; break; } }
  const gantt = !!take(HB_RC.gantt);
  let pic = null;
  for (const [p, re] of HB_RC.pic){ if (take(re)){ pic = p; break; } }
  if (!pic && group2 && stackBy === group2) pic = 'stack';
  const chartWord = !!take(HB_RC.chart);
  let measure = exposure ? 'exposure' : null;
  if (!measure) for (const k of ['exposure', 'medianDaysToSign', 'medianValue', 'avgValue', 'daysToSign', 'rounds', 'payDays']){ if (take(HB_RC.m[k])){ measure = k; break; } }
  const show = take(HB_RC.running) ? 'running' : take(HB_RC.share) ? 'share' : null;
  /* "payment terms as a pie": a ring shows shares, and an average has none —
     the slices are the payment terms themselves, counted */
  if (measure === 'payDays' && !group && !unit && (pic === 'ring' || pic === 'blocks')){ group = 'payterms'; measure = null; }
  const trend = !compare && !!take(HB_RC.trend);
  const when = HB_RC.when.test(full);
  const live = (unit || trend) && !group && !measure && HB_RC.m.live.test(full);
  if (live){ take(HB_RC.m.live); measure = 'live'; }
  /* A QUESTION THAT LEADS WITH MONEY ASKS FOR MONEY ("value of contracts in
     review", "how much is signed", "total value signed by month"): the
     measure is value even with no other chart word, and the money words are
     read here so they are not left over for Copilot */
  const valueLead = /^ (?:what(?: is| s|s)? (?:the |our )?|show (?:me )?(?:the |our )?)?(?:total |overall |the )?(?:value|worth|how much|hur mycket|värdet?)\b/.test(full);
  const more = !!(win || compare || top || sort || title);
  if (!measure && HB_RC.m.value.test(t) && (unit || group || pic || chartWord || trend || gantt || valueLead || more)) measure = 'value';
  if (measure === 'value') for (let k = 0; k < 3 && take(HB_RC.m.value); k++);
  const isChart = unit || group || gantt || pic || chartWord || trend || when || live || more || show || hbSignM(measure) || measure === 'rounds' || (measure === 'value' && valueLead)
    || measure === 'exposure' || measure === 'avgValue' || measure === 'medianValue';
  if (!isChart) return null;
  /* the time split: asked for, or implied by a trend, a "when" or a measure
     that lives in time; a group said with "by month" is the second split */
  let split = null, split2 = null;
  const timeAsked = unit || trend || when || live || (hbSignM(measure) && !group);
  if (timeAsked && (!group || unit)){
    const lean = (hbSignM(measure) || measure === 'rounds' || measure === 'payDays' || (trend && !when)) ? 'signed' : 'end';
    split = { by: 'date', unit: unit || 'm', date: hbSignM(measure) ? 'signed' : hbRcDateOf(full.trim(), unitAt, lean) };
    /* "act by", "notice dates": the date itself, read here — they are no
       condition the map's reader knows ("renewal" still is) */
    if (split.date === 'decision') take(/\b(?:act by dates?|must act by|act by|act on|must act|deadlines? to act|notice dates?|give notice dates?|give notice|notice deadlines?|agera senast|uppsägningsdatum)\b/);
    if (group && unit && group !== 'valueBand') split2 = { by: group };
  } else if (group){ split = { by: group }; if (group2) split2 = { by: group2 }; }
  if (gantt && !unit) pic = 'gantt';
  else if (split && split.by === 'date' && !split2 && (!pic || pic === 'bars')) pic = 'cols';
  /* a compared period over time names its date: the split's own */
  if (win && !win.date && split && split.by === 'date') win.date = split.date;
  const R = { split, pic, measure: measure || 'count', trend: trend || (hbSignM(measure) && !unit && !group), condText: t.trim(), chartWord };
  if (split2) R.split2 = split2;
  if (sort) R.sort = sort;
  if (top) R.top = top;
  if (win) R.window = win;
  if (compare) R.compare = compare;
  if (title) R.title = title;
  if (show) R.show = show;
  /* what is left once the conditions and the chart words are read */
  let cq = [];
  try { cq = (typeof igConditions === 'function') ? igConditions(R.condText) : []; } catch (_){ cq = []; }
  let left = (typeof igLeftover === 'function') ? igLeftover(R.condText, cq) : R.condText;
  left = (' ' + left + ' ').replace(HB_RC.filler, ' ').replace(/\s+/g, ' ').trim();
  R.left = left; R.conds = cq.map(x => x.label);
  return R;
}
/* The plan a card draws: the reader's (or a dig's own) defaults, the reader's
   presses on top, then made drawable — a picture that cannot show this split
   or this measure moves to one that can, and money obeys canViewValues. */
/* A SPLIT THE BOARD PICKS ITSELF MUST SPLIT: "how much is signed" drew one
   ring slice, "Executed 100%". A default that puts every contract in one
   group moves to the next one that divides them; a split the question
   named is drawn as asked. */
function hbUsefulGroup(D, want){
  const fixed = D.fixed || [];
  const cs = hbListOf(D.ids || [], hbS().lens);
  if (cs.length < 2) return want;
  const groups = f => { const g = new Set(); for (const c of cs){ g.add(hbGroupOf(c, f)); if (g.size > 1) break; } return g.size; };
  if (groups(want) >= 2) return want;
  return ['status', 'folder', 'counterparty', 'kind'].filter(f => f !== want && !fixed.includes(f)).find(f => groups(f) >= 2) || want;
}
function hbPlanBase(D){
  const c = D.chart || {}; const fixed = D.fixed || [];
  if (c.pic || c.split || c.measure){
    const P = { pic: c.pic || null, split: c.split || null, measure: c.measure || 'count', trend: !!c.trend };
    if (!P.pic) P.pic = P.split && P.split.by === 'date' ? 'cols' : P.measure === 'value' ? 'blocks' : P.measure === 'count' ? 'ring' : 'bars';
    if (!P.split && ['ring', 'blocks', 'bars'].includes(P.pic)) P.split = { by: hbUsefulGroup(D, hbNextGroup(fixed)) };
    return P;
  }
  if (c.mode === 'values') return { pic: 'blocks', split: { by: hbUsefulGroup(D, c.by || hbNextGroup(fixed)) }, measure: 'value', trend: false };
  if (c.mode === 'months') return { pic: 'gantt', split: null, measure: 'count', trend: false };
  if (c.mode === 'attention') return { pic: 'bubbles', split: null, measure: 'count', trend: false };
  return { pic: 'ring', split: { by: hbUsefulGroup(D, c.by || hbNextGroup(fixed)) }, measure: 'count', trend: false };
}
function hbPlanFix(P, D){
  const money = hbMoneyOk(); const fixed = (D && D.fixed) || [];
  const isDate = P.split && P.split.by === 'date';
  if (!money && hbMoneyMeasure(P.measure)) P.measure = 'count';
  if (!money && (P.pic === 'blocks' || P.pic === 'bubbles')) P.pic = isDate ? 'cols' : 'ring';
  /* a ring or blocks draw shares of a whole; an average has no share — bars
     draw it (the measure the dropdown names is the one drawn) */
  if (['ring', 'blocks'].includes(P.pic) && (hbAvgMeasure(P.measure) || P.measure === 'exposure')) P.pic = 'bars';
  if (P.pic === 'cols' && !isDate) P.split = { by: 'date', unit: 'm', date: 'end' };
  if (['ring', 'blocks'].includes(P.pic) && (isDate || !P.split)) P.split = { by: hbNextGroup(fixed) };
  if (['ring', 'blocks'].includes(P.pic) && P.split && P.split.by === 'valueBand') P.pic = 'bars';
  if (P.pic === 'bars' && !P.split) P.split = { by: hbNextGroup(fixed) };
  if (P.pic === 'bars' && P.split.by === 'date') P.pic = 'cols';
  if (P.measure === 'live' && P.pic !== 'cols'){ P.pic = 'cols'; P.split = { by: 'date', unit: 'm', date: 'end' }; }
  if (P.pic !== 'cols') P.trend = false;
  return P;
}
/* THE CARD'S RECIPE: its own defaults (the question's words, or Copilot's),
   the reader's presses on top (s.recipe, written only by hbCardSet). A part
   switched off by a press ("not split", "the whole period", "compare off")
   stays off. */
function hbPlanSpec(D){
  const o = (hbS().recipe || {})[D.key] || {};
  const P = Object.assign(hbPlanBase(D), {});
  const c = D.chart || {};
  ['split2', 'sort', 'top', 'window', 'compare', 'title', 'show'].forEach(k => { if (c[k] != null) P[k] = c[k]; });
  if (o.pic) P.pic = o.pic;
  if (o.split) P.split = o.split.by === 'none' ? null : o.split;
  if (o.measure) P.measure = o.measure;
  if (typeof o.trend === 'boolean') P.trend = o.trend;
  if (o.split2) P.split2 = o.split2.by === 'none' ? null : o.split2;
  if (o.sort) P.sort = o.sort.by === 'default' ? null : o.sort;
  if (o.top != null) P.top = o.top || null;
  if (o.window) P.window = o.window.all ? null : o.window;
  if (o.compare) P.compare = o.compare === 'off' ? null : o.compare;
  if (o.title) P.title = o.title;
  if (o.show) P.show = o.show === 'off' ? null : o.show;
  return P;
}
function hbPlan(D){ return hbCardPlan(hbPlanSpec(D), D); }
/* THE ONE PLANNER: a recipe made drawable. What it cannot draw it says
   (P.dropped, read out under the chart — A CAP IS A FACT, never a silent
   trim). Today's rules (hbPlanFix: a split that splits, signed is the stage,
   the trend's rules, money hidden folds to the ring) run inside it. */
function hbCardPlan(spec, D){
  const P = Object.assign({ split2: null, sort: null, top: null, window: null, compare: null, title: null, show: null }, spec || {});
  P.dropped = [];
  const drop = k => { if (P[k] != null){ P.dropped.push(k); P[k] = null; } };
  if (!P.measure) P.measure = 'count';
  /* TWO SPLITS: time always runs across; a value band, live contracts or the
     same split twice cannot be drawn against another */
  if (P.split2){
    const s1 = P.split, s2 = P.split2;
    if (!s1 || s1.by === s2.by || (s1.by === 'date' && s2.by === 'date') || s1.by === 'valueBand' || s2.by === 'valueBand' || P.measure === 'live') drop('split2');
    else if (s2.by === 'date'){ P.split = s2; P.split2 = s1; }
  }
  if (P.split2){
    if (!HB_PICS2.includes(P.pic) && P.pic !== 'list') P.pic = 'stack';
    /* averages are never added up: stacked, they would be a sum of averages */
    if (P.pic === 'stack' && hbAvgMeasure(P.measure)) P.pic = 'grouped';
    P.trend = false;
    drop('compare');
  } else if (HB_PICS2.includes(P.pic)) P.pic = P.split && P.split.by === 'date' ? 'cols' : 'bars';
  /* THIS PERIOD AGAINST THE ONE BEFORE: columns over time, else bars, over a
     period (the last 12 months when none is named — said in the reading) */
  if (P.compare){
    if (P.measure === 'live' || P.pic === 'list' || P.pic === 'gantt') drop('compare');
    else if (P.compare === 'range' && !(P.window && P.window.vs)) drop('compare');
    else {
      P.pic = P.split && P.split.by === 'date' ? 'cols' : 'bars';
      if (P.split && P.split.by === 'valueBand') P.split = { by: hbNextGroup((D && D.fixed) || []) };
      if (!P.window){ P.window = { last: 12, unit: 'm' }; P.winSaid = true; }
      P.trend = false;
    }
  }
  hbPlanFix(P, D);
  /* THE PERIOD reads one date: the split's own, else the timeline's end date,
     else the date the measure lives on, else when the contract was created */
  if (P.window){
    if (P.measure === 'live') drop('window');
    else P.window = Object.assign({}, P.window, { date: P.window.date || (P.split && P.split.by === 'date' ? P.split.date : P.pic === 'gantt' ? 'end' : hbSignM(P.measure) ? 'signed' : 'created') });
  }
  /* THE ORDER AND THE TOP N belong to the split by a group: the first, or —
     when time runs across — the second; a list orders its contracts */
  const groupDim = P.split && P.split.by !== 'date' && P.split.by !== 'valueBand' ? 'split' : P.split2 ? 'split2' : P.pic === 'list' ? 'list' : null;
  if (!groupDim || P.pic === 'gantt' || P.pic === 'bubbles'){ drop('sort'); drop('top'); }
  if (P.sort && groupDim === 'list' && P.sort.by === 'count') P.sort = { by: 'value', dir: P.sort.dir };
  if (P.sort && P.sort.by === 'value' && !hbMoneyOk() && P.measure !== 'value' && groupDim === 'list') drop('sort');
  P.groupDim = groupDim;
  /* RUNNING TOTAL over time, SHARE OF TOTAL over groups: only of a measure
     that adds up (an average has no running total and no share) */
  if (P.show){
    const adds = ['count', 'value', 'exposure'].includes(P.measure);
    if (!adds || P.split2 || P.compare || (P.show === 'running' && P.pic !== 'cols') || (P.show === 'share' && !['bars', 'ring', 'blocks'].includes(P.pic))) drop('show');
  }
  if (P.title) P.title = String(P.title).slice(0, HB_TITLE_MAX);
  return P;
}
/* ---- the measures, one arithmetic ---- */
function hbIsoOf(v){ if (v == null || v === '') return null; if (typeof v === 'number'){ const d = new Date(v); return isNaN(d) ? null : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; } const s = String(v).slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null; }
function hbDateOf(c, kind){
  try {
    if (kind === 'signed') return hbIsoOf((typeof contractSignedAt === 'function') ? contractSignedAt(c) : c.signedAt);
    if (kind === 'start') return hbStartOf(c);
    if (kind === 'created') return hbIsoOf((typeof repRaisedAt === 'function') ? repRaisedAt(c) : c._raisedAt);
    if (kind === 'decision') return hbIsoOf((typeof graphDecisionOf === 'function') ? graphDecisionOf(c).date : null);
    return hbEndOf(c);
  } catch (_){ return null; }
}
function hbMeasureOne(c, m){
  if (m === 'value') return hbValueOfOne(c);
  if (hbSignM(m)){ const s = hbDateOf(c, 'signed'), r = hbDateOf(c, 'created'); if (!s || !r) return null; const d = Math.round((Date.parse(s) - Date.parse(r)) / 864e5); return d >= 0 ? d : null; }
  if (m === 'payDays'){ try { const d = (typeof payDays === 'function') ? payDays(c) : null; return d == null ? null : Number(d); } catch (_){ return null; } }
  if (m === 'rounds'){ const r = c.negotiation && Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds.length : 0; return r || null; }
  if (m === 'exposure') return hbExposureOf(c);
  if (m === 'avgValue' || m === 'medianValue'){ const v = hbValueOfOne(c); return v > 0 ? v : null; }
  return 1;
}
function hbMeasure(list, m){
  if (m === 'count' || m === 'live') return { y: list.length, n: list.length, left: 0 };
  if (m === 'value') return { y: list.reduce((a, c) => a + hbValueOfOne(c), 0), n: list.length, left: 0 };
  const ok = list.map(c => hbMeasureOne(c, m)).filter(v => v != null && isFinite(v));
  /* exposure ADDS UP (the unread are left out and said); the median is the middle one */
  if (m === 'exposure') return { y: ok.reduce((a, b) => a + b, 0), n: ok.length, left: list.length - ok.length };
  if (m === 'medianValue' || m === 'medianDaysToSign'){ const xs = ok.slice().sort((a, b) => a - b), k = xs.length;
    return { y: k ? (k % 2 ? xs[(k - 1) / 2] : (xs[k / 2 - 1] + xs[k / 2]) / 2) : null, n: k, left: list.length - k }; }
  return { y: ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null, n: ok.length, left: list.length - ok.length };
}
const hbAvgMeasure = m => m === 'daysToSign' || m === 'payDays' || m === 'rounds' || m === 'avgValue' || m === 'medianValue' || m === 'medianDaysToSign';
function hbMeasureFmt(m, y){
  if (y == null || !isFinite(y)) return '—';
  if (hbMoneyMeasure(m)) return _hbM(y);
  if (hbSignM(m) || m === 'payDays') return i18tn('hb_days_n', Math.round(y), { n: _hbN(Math.round(y)) });
  if (m === 'rounds') return (Math.round(y * 10) / 10).toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined);
  return _hbN(Math.round(y));
}
/* a trend line's end, rounded: it is a line, not a figure on record */
function hbTrendFmt(m, y){
  if (hbMoneyMeasure(m)) return _hbM(Math.abs(y) >= 1000 ? y : Math.round(y));
  if (m === 'count' || m === 'live') return _hbN(Math.round(y));
  return hbMeasureFmt(m, y);
}
function hbMeasureShort(m, y){
  if (y == null || !isFinite(y)) return '';
  if (hbMoneyMeasure(m)) return _hbM(y);
  if (m === 'rounds') return hbMeasureFmt(m, y);
  return _hbN(Math.round(y));
}
/* ---- time buckets ---- */
function hbBucketOf(iso, unit){ if (!iso) return 'none'; const y = iso.slice(0, 4), m = Number(iso.slice(5, 7)); return unit === 'y' ? y : unit === 'q' ? y + '-Q' + (Math.floor((m - 1) / 3) + 1) : iso.slice(0, 7); }
function hbBucketNext(b, unit){
  if (unit === 'y') return String(Number(b) + 1);
  if (unit === 'q'){ let [y, q] = [Number(b.slice(0, 4)), Number(b.slice(6))]; q++; if (q > 4){ q = 1; y++; } return y + '-Q' + q; }
  let [y, m] = b.split('-').map(Number); m++; if (m > 12){ m = 1; y++; } return y + '-' + String(m).padStart(2, '0');
}
function hbBucketLabel(b, unit, short){
  if (b === 'none') return i18t('hb_c_no_date');
  if (/^lt:/.test(b)) return i18t('hb_c_earlier'); if (/^gt:/.test(b)) return i18t('hb_c_later');
  if (unit === 'y') return b;
  if (unit === 'q') return short ? b.slice(5) : b.slice(5) + ' ' + b.slice(0, 4);
  try { return new Date(b + '-01T00:00:00').toLocaleDateString(langLocale(), short ? { month: 'short' } : { month: 'short', year: 'numeric' }); } catch (_){ return b; }
}
function hbInBucket(c, unit, date, b){
  const iso = hbDateOf(c, date); if (b === 'none') return !iso; if (!iso) return false;
  const k = hbBucketOf(iso, unit);
  if (/^lt:/.test(b)) return k < b.slice(3); if (/^gt:/.test(b)) return k > b.slice(3);
  return k === b;
}
/* ---- a straight line through the points that carry enough contracts ---- */
function hbTrendOf(pts){
  const k = pts.length; if (k < HB_TREND_MIN_PTS) return null;
  const mx = pts.reduce((a, p) => a + p.i, 0) / k, my = pts.reduce((a, p) => a + p.y, 0) / k;
  const den = pts.reduce((a, p) => a + (p.i - mx) ** 2, 0); const b = den ? pts.reduce((a, p) => a + (p.i - mx) * (p.y - my), 0) / den : 0;
  const a0 = my - b * mx, i0 = pts[0].i, i1 = pts[k - 1].i;
  return { i0, i1, y0: a0 + b * i0, y1: a0 + b * i1, n: k };
}
function hbTrendDir(m, T){
  const base = Math.max(Math.abs(T.y0), 1e-9), pct = (T.y1 - T.y0) / base;
  if (Math.abs(pct) < 0.05) return i18t('hb_tr_flat');
  if (hbSignM(m)) return i18t(pct < 0 ? 'hb_tr_faster' : 'hb_tr_slower');
  return i18t(pct > 0 ? 'hb_tr_up' : 'hb_tr_down');
}
/* ---- MONTH COLUMNS: one column per month (quarter, year) on the date asked ---- */
function hbColsSvg(D, cs, P){
  const unit = P.split.unit || 'm', date = P.split.date || 'end', m = P.measure;
  if (m === 'live') return hbLiveSvg(D, P);
  const today = hbToday(), nowB = hbBucketOf(today, unit);
  /* a chart on the signing date (or of time to sign) is a chart of what was
     signed: a contract not signed yet is not "no date", it is said apart */
  /* SIGNED IS THE STAGE, NOT THE DATE (Young, 4 Oct 2026: "why does the
     dashboard say 851 SEK when we have over 1 billion"): an executed contract
     with no signing date on record IS signed — it stands in the "No date"
     column, never among the "not signed yet" */
  const unsigned = (date === 'signed' || hbSignM(m)) ? cs.filter(c => !hbDateOf(c, 'signed') && c.status !== 'Signed') : [];
  if (unsigned.length){ const out = new Set(unsigned); cs = cs.filter(c => !out.has(c)); }
  const keyed = cs.map(c => ({ c, b: hbBucketOf(hbDateOf(c, date), unit) }));
  const dated = keyed.filter(x => x.b !== 'none').map(x => x.b).sort();
  const forward = date === 'end' || date === 'decision' || date === 'start';
  let span = [];
  /* a card with a period draws the period's own columns, the empty ones too */
  const Zw = P.window ? hbWinOf(P) : null;
  if (Zw && hbWinSpanOk(Zw) && Zw.date === date){ let b = hbBucketOf(Zw.from, unit); const last = hbBucketOf(Zw.to, unit); while (b <= last && span.length < 400){ span.push(b); b = hbBucketNext(b, unit); } }
  else if (dated.length){
    let b = dated[0]; const last = dated[dated.length - 1];
    while (b <= last && span.length < 400){ span.push(b); b = hbBucketNext(b, unit); }
  }
  let lo = null, hi = null;
  if (span.length > HB_COLS_MAX){
    let from = 0;
    if (forward){ const ti = span.indexOf(nowB); from = ti < 0 ? (nowB < span[0] ? 0 : span.length - HB_COLS_MAX) : Math.max(0, Math.min(ti - Math.floor(HB_COLS_MAX / 4), span.length - HB_COLS_MAX)); }
    else from = span.length - HB_COLS_MAX;
    if (from > 0) lo = span[from];
    if (from + HB_COLS_MAX < span.length) hi = span[from + HB_COLS_MAX - 1];
    span = span.slice(from, from + HB_COLS_MAX);
  }
  const sep = HB_KEY_SEP;
  const door = b => 'qm:' + D.key + sep + unit + sep + b + sep + date;
  const cols = span.map(b => { const list = keyed.filter(x => x.b === b).map(x => x.c); return { b, list, M: hbMeasure(list, m), dig: door(b) }; });
  if (lo){ const list = keyed.filter(x => x.b !== 'none' && x.b < lo).map(x => x.c); cols.unshift({ b: 'lt:' + lo, list, M: hbMeasure(list, m), dig: door('lt:' + lo), edge: true }); }
  if (hi){ const list = keyed.filter(x => x.b !== 'none' && x.b > hi).map(x => x.c); cols.push({ b: 'gt:' + hi, list, M: hbMeasure(list, m), dig: door('gt:' + hi), edge: true }); }
  /* RUNNING TOTAL: each column carries everything up to it (the edges are
     not part of the run; the columns before the first are added in) */
  if (P.show === 'running'){ let run = 0; cols.forEach(c => { if (c.edge && /^gt:/.test(c.b)) return; run += (c.M.y || 0); c.M = Object.assign({}, c.M, { y: run, own: c.M.y }); }); }
  const none = keyed.filter(x => x.b === 'none').map(x => x.c);
  if (!cols.length && !none.length){
    /* nothing to draw is still an answer: a trend asked of nothing says why */
    const why = [P.trend ? i18t('hb_tr_few', { need: HB_TREND_MIN_PTS, units: i18tn('hb_tr_units_' + unit, HB_TREND_MIN_PTS, { n: HB_TREND_MIN_PTS }), min: HB_TREND_MIN_N, n: 0 }) : '',
      unsigned.length ? i18tn('hb_cols_unsigned', unsigned.length, { n: _hbN(unsigned.length) }) : ''].filter(Boolean).join(' ');
    return { body: `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`, by: hbSplitWord(P.split), note: why };
  }
  /* the trend: averages need HB_TREND_MIN_N contracts in a column; the
     column holding today is unfinished for a past-dated measure */
  const avg = hbAvgMeasure(m);
  const unfinished = b => !forward && b === nowB;
  cols.forEach((c, i) => { c.i = i; c.hollow = avg && c.M.n > 0 && c.M.n < HB_TREND_MIN_N; c.sofar = unfinished(c.b); });
  const pts = P.trend ? cols.filter(c => !c.edge && !c.sofar && (avg ? c.M.n >= HB_TREND_MIN_N && c.M.y != null : true)).map(c => ({ i: c.i, y: c.M.y || 0 })) : [];
  /* A LINE NEEDS HISTORY TO STAND ON: a total or a count drawn as a line
     through months that hold nothing is one busy month and a slope; it needs
     HB_TREND_MIN_PTS months that hold contracts, else it is said in words */
  const filled = P.trend && !avg ? cols.filter(c => !c.edge && !c.sofar && c.list.length).length : null;
  const T0 = P.trend && (avg || filled >= HB_TREND_MIN_PTS) ? hbTrendOf(pts) : null;
  /* nothing here is ever below zero: neither is the line */
  const T = T0 ? Object.assign({}, T0, { y0: Math.max(0, T0.y0), y1: Math.max(0, T0.y1) }) : null;
  /* geometry */
  const W = 1000, H = 320, L = 64, R = 18, Tp = 30, B = 52, base = H - B;
  const extra = none.length ? 1.6 : 0, n = cols.length, step = (W - L - R) / Math.max(1, n + extra), cw = Math.min(28, step * 0.52);
  const band = Array.isArray(P.band) && P.band.length === 2 ? P.band : null;
  const ys = cols.map(c => c.M.y || 0).concat(none.length ? [hbMeasure(none, m).y || 0] : []).concat(T ? [T.y0, T.y1] : []).concat(band || []);
  const top = hbAxisTop(Math.max(...ys, 0) * 1.12, m !== 'value' && m !== 'rounds');
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top), X = i => L + step * (i + 0.5);
  const fmtAxis = v => m === 'value' ? _hbM(v) : m === 'rounds' ? hbMeasureFmt(m, v) : _hbN(Math.round(v));
  let g = '';
  for (let k = 0; k <= 4; k++){ const v = top * k / 4, y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(fmtAxis(v))}</text>`; }
  const colPath = (x, y) => { const x0 = x - cw / 2, x1 = x + cw / 2, h = base - y, r = Math.min(4, h, cw / 2); if (h <= 0.5) return ''; return `M${x0.toFixed(1)},${base} L${x0.toFixed(1)},${(y + r).toFixed(1)} Q${x0.toFixed(1)},${y.toFixed(1)} ${(x0 + r).toFixed(1)},${y.toFixed(1)} L${(x1 - r).toFixed(1)},${y.toFixed(1)} Q${x1.toFixed(1)},${y.toFixed(1)} ${x1.toFixed(1)},${(y + r).toFixed(1)} L${x1.toFixed(1)},${base} Z`; };
  const labelEvery = n > 18 ? 2 : 1;
  /* the shelf's normal range, and the column it is about (hbInsFinding) */
  if (band) g += `<rect x="${L}" y="${(Math.min(Y(band[1]), Y(band[0]) - 10)).toFixed(1)}" width="${W - R - L}" height="${Math.max(10, Y(band[0]) - Y(band[1])).toFixed(1)}" class="hb-sv-band"/>`;
  cols.forEach((c, i) => {
    const x = X(i), y = Y(c.M.y || 0), past = forward && !c.edge && c.b < nowB;
    const cls = P.lit && c.b === P.lit ? 'hb-sv-collit' : T ? 'hb-sv-colq' : c.edge ? 'hb-sv-coledge' : past ? 'hb-sv-colpast' : 'hb-sv-col';
    const lbl = hbBucketLabel(c.b, unit, true);
    const yearLine = !c.edge && unit !== 'y' && (i === 0 || (unit === 'm' ? c.b.slice(5) === '01' : c.b.slice(5) === 'Q1'));
    const nWord = _hbN(c.list.length) + ' ' + i18tn('hb_contracts_word', c.list.length, { n: c.list.length });
    const say = hbBucketLabel(c.b, unit, false) + ': ' + (c.list.length ? (m === 'count' ? nWord : hbMeasureFmt(m, c.M.y) + ' · ' + nWord) : i18t('hb_none_here'))
      + (c.hollow ? ' · ' + i18t('hb_tr_hollow_col', { min: HB_TREND_MIN_N }) : '') + (c.sofar && P.trend ? ' · ' + i18t('hb_tr_sofar_col') : '');
    g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(c.list.length ? c.dig : '', say)}><rect x="${(x - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${base - Tp + 40}" fill="transparent"/>`
      + (c.hollow || (c.sofar && T) ? `<path d="${colPath(x, y)}" class="hb-sv-colhollow"/>` : `<path d="${colPath(x, y)}" class="${cls}"/>`)
      + (c.list.length && !T && (n <= 30) ? `<text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(hbMeasureShort(m, c.M.y))}</text>` : '')
      + (i % labelEvery === 0 || c.edge ? `<text x="${x.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(lbl)}</text>` : '')
      + (yearLine ? `<text x="${x.toFixed(1)}" y="${base + 34}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(c.b.slice(0, 4))}</text>` : '') + `</g>`;
  });
  if (none.length){ const x = L + step * (n + 1.1), Mn = hbMeasure(none, m), y = Y(Mn.y || 0);
    g += `<line x1="${(L + step * (n + 0.3)).toFixed(1)}" x2="${(L + step * (n + 0.3)).toFixed(1)}" y1="${Tp}" y2="${base + 30}" class="hb-sv-grid"/>
      <g class="hb-sv-cbox" ${_hbSvgDoor(door('none'), i18t('hb_c_no_date') + ': ' + _hbN(none.length) + ' ' + i18tn('hb_contracts_word', none.length, { n: none.length }))}><rect x="${(x - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${base - Tp + 40}" fill="transparent"/>
      <path d="${colPath(x, y)}" class="hb-sv-coledge"/>${!T ? `<text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(hbMeasureShort(m, Mn.y))}</text>` : ''}
      <text x="${x.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(i18t('hb_c_no_date'))}</text></g>`; }
  if (forward){
    const ti = cols.findIndex(c => !c.edge && c.b === nowB);
    if (ti >= 0){ const x = X(ti) - step / 2 + step * (unit === 'm' ? (Number(today.slice(8, 10)) - 1) / 30 : 0.5);
      g += `<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${Tp - 8}" y2="${base}" class="hb-sv-today" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="${(x - 24).toFixed(1)}" y="${Tp - 26}" width="48" height="17" rx="8.5" class="hb-sv-today-pill"/><text x="${x.toFixed(1)}" y="${Tp - 13}" text-anchor="middle" font-size="11" font-weight="700" fill="${HB_TILE_INK}">${_hbE(i18t('hb_tl_today'))}</text>`; }
  }
  let say = '', note = '';
  if (T){
    g += `<line x1="${X(T.i0).toFixed(1)}" y1="${Y(T.y0).toFixed(1)}" x2="${X(T.i1).toFixed(1)}" y2="${Y(T.y1).toFixed(1)}" class="hb-sv-trend" stroke-width="3" stroke-linecap="round"/>
      <circle cx="${X(T.i0).toFixed(1)}" cy="${Y(T.y0).toFixed(1)}" r="5.5" class="hb-sv-trend-dot"/><circle cx="${X(T.i1).toFixed(1)}" cy="${Y(T.y1).toFixed(1)}" r="5.5" class="hb-sv-trend-dot"/>
      <text x="${X(T.i0).toFixed(1)}" y="${(Y(T.y0) - 14).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" class="hb-sv-glow">${_hbE('≈ ' + hbTrendFmt(m, T.y0))}</text>
      <text x="${X(T.i1).toFixed(1)}" y="${(Y(T.y1) - 14).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" class="hb-sv-glow">${_hbE('≈ ' + hbTrendFmt(m, T.y1))}</text>`;
    const span = T.i1 - T.i0 + 1;
    /* THE LINE'S ENDS ARE THE LINE'S, NOT A TOTAL: said as the trend line, per
       month, rounded — never read as what the book holds */
    say = i18t('hb_tr_say', { what: i18t('hb_ms_' + m).toLowerCase(), per: i18tn('hb_tr_units_' + unit, 1, { n: 1 }), from: hbTrendFmt(m, T.y0), to: hbTrendFmt(m, T.y1), n: _hbN(span), units: i18tn('hb_tr_units_' + unit, span, { n: span }), dir: hbTrendDir(m, T) });
    const notes = [];
    if (cols.some(c => c.hollow)) notes.push(i18t('hb_tr_hollow', { min: HB_TREND_MIN_N }));
    if (cols.some(c => c.sofar)) notes.push(i18t('hb_tr_sofar', { unit: i18tn('hb_tr_units_' + unit, 1, { n: 1 }) }));
    note = notes.join(' ');
  } else if (P.trend){
    note = avg ? i18t('hb_tr_few', { need: HB_TREND_MIN_PTS, units: i18tn('hb_tr_units_' + unit, HB_TREND_MIN_PTS, { n: HB_TREND_MIN_PTS }), min: HB_TREND_MIN_N, n: _hbN(pts.length) })
      : i18t('hb_tr_few_any', { need: HB_TREND_MIN_PTS, units: i18tn('hb_tr_units_' + unit, HB_TREND_MIN_PTS, { n: HB_TREND_MIN_PTS }), n: _hbN(filled || 0) });
  }
  const leftN = avg ? cs.length - cols.reduce((a, c) => a + c.M.n, 0) - (none.length ? hbMeasure(none, m).n : 0) : 0;
  if (leftN > 0) note = [note, i18t('hb_ms_left', { n: _hbN(leftN), what: i18t('hb_ms_' + m).toLowerCase() })].filter(Boolean).join(' ');
  /* what is left off is said with its money, so a small total is never
     mistaken for the book's (the 1-billion question) */
  const offV = hbMoneyOk() && unsigned.length ? unsigned.reduce((a, c) => a + hbValueOfOne(c), 0) : 0;
  if (unsigned.length) note = [note, offV > 0 ? i18tn('hb_cols_unsigned_value', unsigned.length, { n: _hbN(unsigned.length), v: _hbM(offV) }) : i18tn('hb_cols_unsigned', unsigned.length, { n: _hbN(unsigned.length) })].filter(Boolean).join(' ');
  const by = hbSplitWord(P.split);
  const money = hbMoneyOk();
  const lead = unsigned.length ? `<b>${_hbN(cs.length)}</b> ${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}${money ? ` · <b>${_hbE(_hbM(cs.reduce((a, c) => a + hbValueOfOne(c), 0)))}</b>` : ''}` : '';
  return { lead, body: `<svg class="hb-svg hb-cols" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note, say,
    trend: T ? { y0: T.y0, y1: T.y1, span: T.i1 - T.i0 + 1, unit } : null,
    /* the columns as counted, for the shelf's normal range: the chart's own
       numbers, so a picture can never say what its open chart would not */
    cols: cols.filter(c => !c.edge).map(c => ({ b: c.b, y: c.M.y, n: c.M.n, sofar: !!c.sofar, hollow: !!c.hollow, k: c.list.length, dig: c.dig })), unit, nowB,
    /* and what the reading says beside them: the edges, the undated, the unsigned */
    edges: cols.filter(c => c.edge).map(c => ({ b: c.b, y: c.M.y, k: c.list.length, dig: c.dig })), none: none.length, noneDig: door('none'),
    noneY: none.length ? (hbMeasure(none, m).y || 0) : 0,
    unsigned: unsigned.length, unsignedV: offV, date, m, left: leftN };
}
/* ---- LIVE CONTRACTS EACH MONTH: read off the monthly picture of the book ----
   How many were live at a past month's end is not on the contracts, so it
   cannot be worked out backwards: the server keeps one picture a month
   (book_snapshots) and the line waits until there are enough of them. */
let _hbSnaps = null, _hbSnapsAsked = false;
function hbSnapsLoad(){
  if (_hbSnapsAsked) return; _hbSnapsAsked = true;
  if (typeof api !== 'function'){ _hbSnaps = []; return; }
  /* a failed read is no pictures, said as such — never a card left "reading" */
  Promise.resolve().then(() => api('book/snapshots')).then(r => r, () => null).then(r => {
    _hbSnaps = (r && Array.isArray(r.snapshots)) ? r.snapshots.filter(x => x && /^\d{4}-\d{2}$/.test(x.month)) : [];
    try { if (window.state && state.view === 'dashboard') hbPaintBoard(); } catch (_){}
  });
}
/* the pictures as the server last gave them (null: not asked yet) */
function hbSnapsSet(list){ _hbSnaps = Array.isArray(list) ? list.filter(x => x && /^\d{4}-\d{2}$/.test(x.month)) : null; _hbSnapsAsked = _hbSnaps != null; }
function hbLiveSvg(D, P){
  if (_hbSnaps == null){ hbSnapsLoad(); return { body: `<div class="hb-quiet">${_hbE(i18t('hb_snap_loading'))}</div>`, by: '', note: '' }; }
  const snaps = _hbSnaps.slice().sort((a, b) => a.month < b.month ? -1 : 1).slice(-HB_COLS_MAX);
  const instead = `<button type="button" class="hb-btn" data-hb-rinstead>${_hbE(i18t('hb_snap_instead'))}</button>`;
  const by = i18t('hb_snap_by');
  if (!snaps.length) return { body: `<div class="hb-snap-empty"><p>${_hbE(i18t('hb_snap_none'))}</p>${instead}</div>`, by, note: '', lead: `<b>${_hbN(hbBookData('all', { whole: true }).figs.live.n)}</b> ${_hbE(i18t('hb_snap_today'))}` };
  const W = 1000, H = 300, L = 64, R = 18, Tp = 30, B = 46, base = H - B, n = Math.max(snaps.length, HB_TREND_MIN_PTS), step = (W - L - R) / n;
  const top = hbAxisTop(Math.max(...snaps.map(x => Number(x.live) || 0), 1) * 1.15, true);
  const Y = v => Tp + (base - Tp) * (1 - v / top), X = i => L + step * (i + 0.5);
  let g = '';
  for (let k = 0; k <= 4; k++){ const v = top * k / 4, y = Y(v); g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbN(Math.round(v))}</text>`; }
  let b = snaps[0].month;
  for (let i = 0; i < n; i++){ const x = X(i), sn = snaps[i];
    g += `<text x="${x.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="${sn ? 'hb-sv-ink2' : 'hb-sv-mute'}">${_hbE(hbBucketLabel(b, 'm', true))}</text>${i === 0 || b.slice(5) === '01' ? `<text x="${x.toFixed(1)}" y="${base + 34}" text-anchor="middle" font-size="11" class="hb-sv-mute">${b.slice(0, 4)}</text>` : ''}`;
    if (sn) g += `<g class="hb-sv-cbox" ${_hbSvgDoor('', hbBucketLabel(sn.month, 'm', false) + ': ' + _hbN(sn.live) + ' ' + i18tn('hb_contracts_word', sn.live, { n: sn.live }))}><rect x="${(x - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${base - Tp}" fill="transparent"/><circle cx="${x.toFixed(1)}" cy="${Y(sn.live).toFixed(1)}" r="6" class="hb-sv-trend-dot"/></g>`;
    b = hbBucketNext(b, 'm'); }
  const pts = snaps.map((sn, i) => ({ i, y: Number(sn.live) || 0 }));
  const T = hbTrendOf(pts);
  let say = '', note = '';
  if (T){ g += `<line x1="${X(T.i0).toFixed(1)}" y1="${Y(T.y0).toFixed(1)}" x2="${X(T.i1).toFixed(1)}" y2="${Y(T.y1).toFixed(1)}" class="hb-sv-trend" stroke-width="3" stroke-linecap="round"/>`;
    say = i18t('hb_tr_say', { what: i18t('hb_ms_live').toLowerCase(), per: i18tn('hb_tr_units_m', 1, { n: 1 }), from: _hbN(Math.round(T.y0)), to: _hbN(Math.round(T.y1)), n: _hbN(T.i1 - T.i0 + 1), units: i18tn('hb_tr_units_m', T.i1 - T.i0 + 1, { n: T.i1 - T.i0 + 1 }), dir: hbTrendDir('live', T) }); }
  else { let when = snaps[0].month; for (let i = 1; i < HB_TREND_MIN_PTS; i++) when = hbBucketNext(when, 'm');
    const x5 = X(HB_TREND_MIN_PTS - 1);
    g += `<line x1="${x5.toFixed(1)}" x2="${x5.toFixed(1)}" y1="${Tp}" y2="${base}" class="hb-sv-grid" stroke-dasharray="3 4"/><text x="${(x5 - 6).toFixed(1)}" y="${Tp + 12}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(i18t('hb_snap_starts'))}</text>`;
    note = i18t('hb_snap_few', { first: hbBucketLabel(snaps[0].month, 'm', false), need: HB_TREND_MIN_PTS, when: hbBucketLabel(when, 'm', false) }); }
  return { body: `<svg class="hb-svg hb-cols" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>${T ? '' : `<div class="hb-snap-instead">${instead}</div>`}`, by, note, say,
    lead: `<b>${_hbN(snaps[snaps.length - 1].live)}</b> ${_hbE(i18t('hb_snap_lead', { month: hbBucketLabel(snaps[snaps.length - 1].month, 'm', false) }))}` };
}
/* AN AXIS NEVER SAYS ONE NUMBER TWICE (Young, 4 Oct 2026: "fix the axis
   labels" — a chart of 1 or 2 contracts a month read "2, 1, 1, 0, 0"): the
   top is four nice steps, and a step of whole things (contracts, days) is a
   whole number, at least 1 */
function hbAxisTop(v, whole){
  const step0 = hbNiceMax((v > 0 ? v : 1) / 4);
  return (whole ? Math.max(1, Math.ceil(step0)) : step0) * 4;
}
function hbNiceMax(v){ if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * p >= v) return k * p; return 10 * p; }
/* ---- BARS for a split by a group, on any measure ---- */
function hbGroupBars(D, cs, P){
  const field = P.split.by, m = P.measure;
  if (field === 'valueBand') return hbBarsFamily(D, cs, 'values', 'status', hbMoneyOk());
  const bar = r => { const M = hbMeasure(r.list, m);
    return { g: r.g, label: r.label, n: r.n, v: M.y || 0, list: r.list, say: hbMeasureFmt(m, M.y) + (m === 'count' ? '' : ' · ' + _hbN(r.n)), dig: 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + r.g,
      color: field === 'status' && typeof hmStageTone === 'function' ? hmStageTone(r.g) : '' }; };
  let rows = hbGroupsOf(cs, field, m === 'value').map(bar);
  if (field !== 'status') rows.sort((a, b) => (b.v - a.v) || a.label.localeCompare(b.label));
  /* the reader's order and top N; past the cap the rest is ONE bar, a door */
  const cut = hbGroupsCut(rows, P, HB_CHART_BARS, m, field);
  rows = cut.rows;
  if (cut.rest){ const M = hbMeasure(cut.rest.list, m);
    rows = rows.concat([{ g: null, label: cut.rest.label, n: cut.rest.n, v: M.y || 0, say: hbMeasureFmt(m, M.y) + (m === 'count' ? '' : ' · ' + _hbN(cut.rest.n)), dig: hbRestDig(D, field, cut.kept, m === 'value'), color: '' }]); }
  /* SHARE OF TOTAL: each bar says its part of the whole */
  if (P.show === 'share'){ const tot = rows.reduce((a, r) => a + (r.v || 0), 0) || 1; rows.forEach(r => { r.say = _hbN(Math.round((r.v || 0) / tot * 100)) + '% · ' + r.say; }); }
  return { body: hbChartBarsHtml(rows, true), by: hbSplitWord(P.split) + (m !== 'count' ? ' · ' + i18t('hb_ms_' + m).toLowerCase() : '') + (P.show ? ' · ' + i18t('hb_show_' + P.show).toLowerCase() : ''), note: '', rows };
}
/* ---- the words for each part ---- */
function hbSplitWord(S){
  if (!S) return i18t('hb_sp_none');
  if (S.by === 'date') return i18t('hb_sp_' + (S.unit || 'm')) + ' · ' + i18t('hb_dt_' + (S.date || 'end'));
  if (S.by === 'owner') return i18t('hb_by_owner');
  if (S.by === 'valueBand') return i18t('hb_by_band');
  return hbGroupWord(S.by);
}
function hbPicWord(P){ return P.pic === 'cols' ? i18t('hb_pic_cols_' + ((P.split && P.split.unit) || 'm')) : i18t('hb_pic_' + P.pic); }
/* What a press may choose, and why not when it may not (a dead button wears
   grey and says why — the house rule). */
const HB_WIN_PRESETS = [['last', 1, 'q'], ['last', 1, 'y'], ['last', 3, 'm'], ['last', 6, 'm'], ['last', 12, 'm'], ['last', 2, 'y'], ['next', 3, 'm'], ['next', 6, 'm'], ['next', 12, 'm']];
function hbRcOptions(part, P, D){
  const money = hbMoneyOk(), isDate = P.split && P.split.by === 'date';
  const opt = (v, word, on, why) => ({ v, word, on, why: why || '' });
  if (part === 'which') return [opt('set', i18t('hb_rc_only', { what: D.setLabel || D.crumb || '' }), true), opt('all', i18t('hb_rc_all'), true)];
  if (part === 'pic') return HB_PICS.map(p => {
    const word = p === 'cols' ? i18t('hb_pic_cols_' + ((isDate && P.split.unit) || 'm')) : i18t('hb_pic_' + p);
    if ((p === 'blocks' || p === 'bubbles') && !money) return opt(p, word, false, i18t('hb_why_money'));
    if ((p === 'ring' || p === 'blocks') && P.split && P.split.by === 'valueBand') return opt(p, word, false, i18t('hb_why_group'));
    if ((p === 'ring' || p === 'blocks') && hbAvgMeasure(P.measure)) return opt(p, word, false, i18t('hb_why_avg'));
    if (HB_PICS2.includes(p) && !P.split2) return opt(p, word, false, i18t('hb_why_split2'));
    if (P.split2 && !HB_PICS2.includes(p) && p !== 'list') return opt(p, word, false, i18t('hb_why_one_split'));
    return opt(p, word, true);
  });
  if (part === 'split'){
    const ds = [['m', 'end'], ['q', 'end'], ['y', 'end'], ['m', 'signed'], ['q', 'signed'], ['m', 'start'], ['m', 'created'], ['m', 'decision']]
      .map(([u, d]) => opt('d:' + u + ':' + d, i18t('hb_sp_' + u) + ' · ' + i18t('hb_dt_' + d), true));
    const gs = HB_SPLIT_GROUPS.map(gk => Object.assign(opt('g:' + gk, hbSplitWord({ by: gk }), !(gk === 'valueBand' && !money), gk === 'valueBand' && !money ? i18t('hb_why_money') : ''),
      HB_DEAL_GROUPS[0] === gk ? { head: i18t('hb_rc_deal_head') } : {}));
    return ds.concat(gs).concat([opt('none', i18t('hb_sp_none'), true)]);
  }
  /* THEN BY: the second split — a group under time, or time or a group under a group */
  if (part === 'split2'){
    const dead = !P.split ? i18t('hb_why_split_first') : P.split.by === 'valueBand' ? i18t('hb_why_no_split2') : P.measure === 'live' ? i18t('hb_why_no_split2') : '';
    const ds = isDate ? [] : [['m', 'end'], ['q', 'end'], ['m', 'signed'], ['q', 'signed'], ['m', 'created']]
      .map(([u, d]) => opt('d:' + u + ':' + d, i18t('hb_sp_' + u) + ' · ' + i18t('hb_dt_' + d), !dead, dead));
    const gs = HB_SPLIT_GROUPS.filter(gk => gk !== 'valueBand' && !(P.split && P.split.by === gk)).map(gk => opt('g:' + gk, hbSplitWord({ by: gk }), !dead, dead));
    return [opt('none', i18t('hb_sp_none'), true)].concat(gs, ds);
  }
  if (part === 'measure'){
    const own = !['cols', 'bars', 'stack', 'grouped', 'heat'].includes(P.pic);
    return HB_MEASURES.map(k => {
      if (own && k !== 'count') return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_own_measure'));
      if (hbMoneyMeasure(k) && !money) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_money'));
      if (k === 'live' && (!isDate || P.split2)) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_date'));
      return opt(k, i18t('hb_ms_' + k), true);
    });
  }
  /* ORDER: how the groups line up, and how many are drawn (the rest said) */
  if (part === 'order'){
    const dead = P.groupDim ? '' : i18t('hb_why_order');
    const sorts = [['default', i18t('hb_order_default')], ['value:down', i18t('hb_order_value_down')], ['value:up', i18t('hb_order_value_up')], ['count:down', i18t('hb_order_count_down')], ['name:up', i18t('hb_order_name_up')]]
      .map(([v, w]) => opt('sort:' + v, w, !dead, dead));
    const tops = [5, 10, 20].map(n => opt('top:' + n, i18t('hb_top_n', { n }), !dead, dead)).concat([opt('top:0', i18t('hb_top_all'), true)]);
    return sorts.concat(tops);
  }
  /* PERIOD: the contracts whose date falls in it */
  if (part === 'window'){
    const dead = P.measure === 'live' ? i18t('hb_why_live_period') : '';
    return [opt('all', i18t('hb_win_all'), true)].concat(HB_WIN_PRESETS.map(([k, n, u]) => opt(k + ':' + n + ':' + u, hbWinWord({ [k]: n, unit: u }), !dead, dead)));
  }
  if (part === 'compare'){
    const dead = P.split2 ? i18t('hb_why_cmp_split2') : (P.measure === 'live' || P.pic === 'list' || P.pic === 'gantt') ? i18t('hb_why_cmp') : '';
    return [opt('off', i18t('hb_cmp_off'), true), opt('prev', i18t('hb_cmp_prev'), !dead, dead), opt('year', i18t('hb_cmp_year'), !dead, dead)]
      .concat(P.compare === 'range' ? [opt('range', i18t('hb_cmp_range'), !dead, dead)] : []);
  }
  return [];
}
function hbRcCur(part, P){
  if (part === 'pic') return P.pic; if (part === 'measure') return P.measure;
  const sp = S => !S ? 'none' : S.by === 'date' ? 'd:' + S.unit + ':' + S.date : 'g:' + S.by;
  if (part === 'split') return sp(P.split);
  if (part === 'split2') return sp(P.split2);
  if (part === 'order') return P.sort ? 'sort:' + P.sort.by + ':' + P.sort.dir : 'sort:default';
  if (part === 'window'){ const W = P.window; return !W ? 'all' : W.last ? 'last:' + W.last + ':' + W.unit : W.next ? 'next:' + W.next + ':' + W.unit : ''; }
  if (part === 'compare') return P.compare || 'off';
  return null;
}
/* the order's menu marks the order AND the top N it draws */
function hbRcCurHas(part, P, v){
  if (part === 'order' && /^top:/.test(v)) return Number(v.slice(4)) === (P.top || 0);
  return hbRcCur(part, P) === v;
}
let _hbRcOpen = null;
const _hbTick = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 8.5 3.2 3L13 4.5"/></svg>';
const _hbCaret = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg>';
/* THE DROPDOWN ROW EDITS THE CARD IT STANDS ON: the row carries its card's
   key, so a press on a panel's row changes that panel, not the open card */
function hbRecipeRowHtml(D, P){
  const s = hbS(); const o = (s.recipe || {})[D.key] || {};
  const canWhich = /^(q|ls):?/.test(D.key) && D.kind === 'list';
  const chip = (part, label, value) => {
    const open = _hbRcOpen === D.key + '|' + part;
    const menu = open ? `<div class="hb-rmenu" role="menu" aria-label="${_hbE(label)}">${hbRcOptions(part, P, D).map(x => {
      const cur = part === 'which' ? ((o.which || 'set') === x.v) : hbRcCurHas(part, P, x.v);
      return (x.head ? `<div class="hb-rmenu-h" role="presentation">${_hbE(x.head)}</div>` : '') + `<button type="button" role="menuitemradio" aria-checked="${cur}" data-hb-rset="${_hbE(part + ':' + x.v)}"${x.on ? '' : ' disabled'}${x.why ? ` title="${_hbE(x.why)}"` : ''}><span>${_hbE(x.word)}</span>${x.why ? `<small>${_hbE(x.why)}</small>` : cur ? `<b aria-hidden="true">${_hbTick}</b>` : ''}</button>`; }).join('')}</div>` : '';
    return `<span class="hb-rwrap"><button type="button" class="hb-rc${open ? ' is-open' : ''}" data-hb-rc="${part}" aria-haspopup="menu" aria-expanded="${open}"><i>${_hbE(label)}</i><span>${_hbE(value)}</span>${_hbCaret}</button>${menu}</span>`;
  };
  const which = D.whole ? i18t('hb_rc_all') : (D.setLabel || D.crumb || '');
  const whichChip = canWhich ? chip('which', i18t('hb_rc_which'), which)
    : `<span class="hb-rwrap"><span class="hb-rc is-still" title="${_hbE(i18t('hb_rc_which_still'))}"><i>${_hbE(i18t('hb_rc_which'))}</i><span>${_hbE(which)}</span></span></span>`;
  const canTrend = P.pic === 'cols' && P.measure !== 'live' && !P.compare;
  const trend = `<button type="button" class="hb-tg${P.trend ? ' is-on' : ''}" data-hb-rtrend aria-pressed="${!!P.trend}"${canTrend ? '' : ` disabled title="${_hbE(i18t('hb_why_trend'))}"`}><span class="hb-tg-sl" aria-hidden="true"></span>${_hbE(i18t('hb_rc_trend'))}</button>`;
  const order = P.sort || P.top ? [P.sort ? hbOrderWord(P.sort) : '', P.top ? i18t('hb_top_n', { n: P.top }) : ''].filter(Boolean).join(' · ') : i18t('hb_order_default');
  /* THE ROW HOLDS WHAT THE CARD USES: the four first parts always; the
     newer four (then by, order, period, compare) when the card uses them,
     the rest behind ONE "More" — so a half-width card keeps its chart */
  const extra = [['split2', !!P.split2, () => chip('split2', i18t('hb_rc_split2'), P.split2 ? hbSplitWord(P.split2) : i18t('hb_sp_none'))],
    ['order', !!(P.sort || P.top), () => chip('order', i18t('hb_rc_order'), order)],
    ['window', !!P.window, () => chip('window', i18t('hb_rc_window'), P.window ? hbWinWord(P.window) : i18t('hb_win_all'))],
    ['compare', !!P.compare, () => chip('compare', i18t('hb_rc_compare'), i18t('hb_cmp_' + (P.compare || 'off')))]];
  const more = _hbRcMore.has(D.key) || extra.some(([k]) => _hbRcOpen === D.key + '|' + k);
  const shown = extra.filter(([, used]) => used || more).map(([, , draw]) => draw()).join('');
  const left = extra.filter(([, used]) => !used).length;
  const moreBtn = left ? `<button type="button" class="hb-rc hb-rc-more" data-hb-rmore aria-expanded="${more}">${_hbE(more ? i18t('hb_rc_fewer') : i18t('hb_rc_more', { n: left }))}</button>` : '';
  return `<div class="hb-recipe" role="group" data-hb-rkey="${_hbE(D.key)}" aria-label="${_hbE(i18t('hb_rc_menu'))}">${whichChip}${chip('split', i18t('hb_rc_split'), hbSplitWord(P.split))}${chip('pic', i18t('hb_rc_pic'), hbPicWord(P))}${chip('measure', i18t('hb_rc_measure'), i18t('hb_ms_' + P.measure))}${shown}${trend}${moreBtn}</div>`;
}
/* which cards show their whole row (per sitting: a reader's glance, never kept) */
const _hbRcMore = new Set();
function hbRcMoreToggle(key){ if (_hbRcMore.has(key)) _hbRcMore.delete(key); else _hbRcMore.add(key); return _hbRcMore.has(key); }
function hbOrderWord(S){ return i18t('hb_order_' + S.by + '_' + S.dir) || i18t('hb_order_default'); }

/* ============================================================
   ONE RECIPE LANGUAGE FOR EVERY CARD (the owner's work order, Part 1,
   4 Oct 2026: "build almost anything i need in the dashboard with precision")
   ============================================================
   A card is ONE short recipe: which contracts · split (and a second split) ·
   measure · picture · order · top N · period · comparison · name. HaTi draws
   only from it (hbCardPlan), Copilot only writes it (the server's mirror
   cleans what the model writes into these same words), the dropdowns only
   edit it — through ONE writer, hbCardSet. ONE cleaner, hbCardClean, decides
   what a valid recipe is, for a press, a question, a stored board and
   Copilot alike. A stored recipe is READ, never rewritten. */
function hbPlainText(v, n){ return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n); }
function hbSplitClean(sp, allowNone){
  if (!sp || typeof sp !== 'object') return null;
  if (sp.by === 'date') return HB_UNITS.includes(sp.unit) && HB_DATES.includes(sp.date) ? { by: 'date', unit: sp.unit, date: sp.date } : null;
  if (HB_SPLIT_GROUPS.includes(sp.by)) return { by: sp.by };
  return allowNone && sp.by === 'none' ? { by: 'none' } : null;
}
function hbWindowClean(w){
  if (!w || typeof w !== 'object') return null;
  if (w.all === true) return { all: true };
  const unit = HB_UNITS.includes(w.unit) ? w.unit : 'm';
  const num = k => { const v = Math.round(Number(w[k])); return w[k] != null && isFinite(v) && v >= 1 && v <= HB_WIN_MAX[unit] ? v : null; };
  const iso = v => /^\d{4}-\d{2}-\d{2}$/.test(String(v || '')) ? String(v) : null;
  const out = {};
  if (num('last')){ out.last = num('last'); out.unit = unit; }
  else if (num('next')){ out.next = num('next'); out.unit = unit; }
  else { const f = iso(w.from), t = iso(w.to); if (!f && !t) return null; if (f && t && f > t) return null; if (f) out.from = f; if (t) out.to = t; }
  if (HB_DATES.includes(w.date)) out.date = w.date;
  /* ANY TWO PERIODS (Young, 6 Oct 2026): the period a 'range' comparison is
     held against, two whole days in order */
  const vs = hbVsClean(w.vs); if (vs) out.vs = vs;
  return out;
}
function hbVsClean(v){
  if (!v || typeof v !== 'object') return null;
  const iso = x => /^\d{4}-\d{2}-\d{2}$/.test(String(x || '')) ? String(x) : null;
  const f = iso(v.from), t = iso(v.to);
  return f && t && f <= t ? { from: f, to: t } : null;
}
function hbCardClean(v){
  const r = {};
  if (!v || typeof v !== 'object') return r;
  if (HB_PICS.includes(v.pic)) r.pic = v.pic;
  if (HB_MEASURES.includes(v.measure)) r.measure = v.measure;
  if (typeof v.trend === 'boolean') r.trend = v.trend;
  const w = v.which;
  if (w === 'all' || w === 'set') r.which = w;
  else if (w && typeof w === 'object'){
    if (w.all === true) r.which = { all: true };
    else if (typeof w.q === 'string' && hbPlainText(w.q, 200)) r.which = { q: hbPlainText(w.q, 200) };
    else if (Array.isArray(w.ids)){ const ids = w.ids.filter(x => typeof x === 'string' && x).map(x => x.slice(0, 60)).slice(0, 2000); if (ids.length) r.which = { ids }; }
  }
  const sp = hbSplitClean(v.split, true); if (sp) r.split = sp;
  const s2 = hbSplitClean(v.split2, true);
  if (s2 && !(sp && sp.by === s2.by && s2.by !== 'none')) r.split2 = s2;
  if (v.sort && typeof v.sort === 'object'){
    if (v.sort.by === 'default') r.sort = { by: 'default' };
    else if (HB_SORTS.includes(v.sort.by)) r.sort = { by: v.sort.by, dir: HB_DIRS.includes(v.sort.dir) ? v.sort.dir : (v.sort.by === 'name' ? 'up' : 'down') };
  }
  if (v.top != null){ const t = Math.round(Number(v.top)); if (isFinite(t) && t >= 0 && t <= HB_TOP_MAX) r.top = t; }
  const win = hbWindowClean(v.window); if (win) r.window = win;
  if (HB_COMPARES.includes(v.compare) || v.compare === 'off') r.compare = v.compare;
  const title = hbPlainText(v.title, HB_TITLE_MAX); if (title) r.title = title;
  if (HB_SHOWS.includes(v.show) || v.show === 'off') r.show = v.show;
  return r;
}
/* one part, as a press (a dropdown's value) or as a recipe's own words */
function hbCardSetPart(o, part, v){
  const split = x => {
    if (x && typeof x === 'object') return hbSplitClean(x, true);
    if (x === 'none') return { by: 'none' };
    if (/^d:/.test(String(x))){ const [, u, d] = String(x).split(':'); return HB_UNITS.includes(u) && HB_DATES.includes(d) ? { by: 'date', unit: u, date: d } : null; }
    if (/^g:/.test(String(x))){ const gk = String(x).slice(2); return HB_SPLIT_GROUPS.includes(gk) ? { by: gk } : null; }
    return null;
  };
  if (part === 'which'){ if (v === 'all' || v === 'set') o.which = v; else if (v && typeof v === 'object') o.which = v; }
  else if (part === 'pic' && HB_PICS.includes(v)) o.pic = v;
  else if (part === 'measure' && HB_MEASURES.includes(v)) o.measure = v;
  else if (part === 'trend') o.trend = !!v;
  else if (part === 'split'){
    const S = split(v); if (!S) return;
    o.split = S;
    /* a picture that cannot show the new split moves with it (a two-split
       picture and the list stay) */
    if (S.by === 'date'){ if (o.pic !== 'list' && !HB_PICS2.includes(o.pic)) o.pic = 'cols'; }
    else if (S.by !== 'none'){ if (!o.pic || o.pic === 'cols' || o.pic === 'gantt') o.pic = S.by === 'valueBand' ? 'bars' : 'ring'; }
  }
  else if (part === 'split2'){
    const S = split(v); if (!S) return;
    o.split2 = S;
    if (S.by === 'none'){ if (HB_PICS2.includes(o.pic)) delete o.pic; }
    else if (!HB_PICS2.includes(o.pic) && o.pic !== 'list') o.pic = 'stack';
  }
  else if (part === 'order'){
    const m = /^(sort|top):(.+)$/.exec(String(v)); if (!m) return;
    if (m[1] === 'top') o.top = Math.max(0, Math.min(HB_TOP_MAX, Math.round(Number(m[2])) || 0));
    else if (m[2] === 'default') o.sort = { by: 'default' };
    else { const [by, dir] = m[2].split(':'); if (HB_SORTS.includes(by)) o.sort = { by, dir: HB_DIRS.includes(dir) ? dir : 'down' }; }
  }
  else if (part === 'sort'){ if (v && typeof v === 'object') o.sort = v; }
  else if (part === 'top') o.top = v;
  else if (part === 'window'){
    if (v === 'all') o.window = { all: true };
    else if (v && typeof v === 'object') o.window = v;
    else { const m = /^(last|next):(\d+):([mqy])$/.exec(String(v)); if (m) o.window = { [m[1]]: Number(m[2]), unit: m[3] }; }
  }
  else if (part === 'compare'){ if (HB_COMPARES.includes(v) || v === 'off') o.compare = v; }
  else if (part === 'title') o.title = v;
  else if (part === 'show'){ if (HB_SHOWS.includes(v) || v === 'off') o.show = v; }
}
/* THE ONE WRITER of a card's recipe: a press, the free reader, Copilot. The
   parts are applied in the order given (the picture last wins over a split's
   default picture). A kept card's own copy follows, so a press on a panel is
   kept with the panel. */
function hbCardSet(key, parts, opts){
  const s = hbS(); s.recipe = s.recipe || {};
  /* a kept card's own recipe, put back when the board's copy is not there:
     taken whole, never part by part */
  const seed = !!(opts && opts.seed);
  if (seed && s.recipe[key]) return s.recipe[key];
  const o = seed ? {} : Object.assign({}, s.recipe[key] || {});
  if (seed) Object.assign(o, parts || {});
  else Object.keys(parts || {}).forEach(part => hbCardSetPart(o, part, parts[part]));
  const clean = hbCardClean(o);
  delete s.recipe[key]; s.recipe[key] = clean;
  const held = new Set((s.panels || []).filter(p => p.kind === 'view').map(p => p.key));
  const ks = Object.keys(s.recipe).filter(k => !held.has(k)); if (Object.keys(s.recipe).length > 30 && ks.length) delete s.recipe[ks[0]];
  (s.panels || []).forEach(p => { if (p.kind === 'view' && p.key === key) p.recipe = JSON.parse(JSON.stringify(clean)); });
  hbSave();
  return clean;
}
/* a press on a dropdown: one part through the one writer */
function hbRecipeSet(key, part, v){ return hbCardSet(key, { [part]: v }); }
function hbRecipeClean(v){
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.entries(v).slice(-30).forEach(([k, o]) => { if (typeof k !== 'string' || !o || typeof o !== 'object') return; out[k] = hbCardClean(o); });
  return out;
}

/* ---- THE PERIOD: whole months (quarters, years), counted from today ---- */
function hbBucketPrev(b, unit){
  if (unit === 'y') return String(Number(b) - 1);
  if (unit === 'q'){ let [y, q] = [Number(b.slice(0, 4)), Number(b.slice(6))]; q--; if (q < 1){ q = 4; y--; } return y + '-Q' + q; }
  let [y, m] = b.split('-').map(Number); m--; if (m < 1){ m = 12; y--; } return y + '-' + String(m).padStart(2, '0');
}
function hbBucketMove(b, unit, n){ let x = b; for (let i = 0; i < Math.abs(n); i++) x = n > 0 ? hbBucketNext(x, unit) : hbBucketPrev(x, unit); return x; }
function hbBucketStart(b, unit){ return unit === 'y' ? b + '-01-01' : unit === 'q' ? b.slice(0, 4) + '-' + String((Number(b.slice(6)) - 1) * 3 + 1).padStart(2, '0') + '-01' : b + '-01'; }
function hbBucketEnd(b, unit){ const n = hbBucketStart(hbBucketNext(b, unit), unit === 'q' ? 'q' : unit); const d = new Date(n + 'T00:00:00'); d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function hbIsoShift(iso, days){ const d = new Date(iso + 'T00:00:00'); d.setDate(d.getDate() + days); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
/* the period as days (from, to, both kept) and, for a comparison, the one
   before it: the same length just before, or the same months a year back */
function hbWinOf(P){
  const W = P && P.window; if (!W) return null;
  const date = W.date || 'end';
  let from, to, unit = W.unit || 'm', b0 = null, b1 = null;
  if (W.last || W.next){
    const now = hbBucketOf(hbToday(), unit), n = W.last || W.next;
    b0 = W.last ? hbBucketMove(now, unit, -(n - 1)) : now; b1 = W.last ? now : hbBucketMove(now, unit, n - 1);
    from = hbBucketStart(b0, unit); to = hbBucketEnd(b1, unit);
  } else { from = W.from || '0000-01-01'; to = W.to || '9999-12-31'; unit = null; }
  /* A PERIOD STILL RUNNING IS COMPARED LIKE FOR LIKE: a date that only lies in
     the past (signed, created) has nothing after today, so "this year" is this
     year so far, and the period it is held against stops at the same point */
  const today = hbToday(), soFar = (date === 'signed' || date === 'created') && to > today && from <= today;
  const upTo = soFar ? today : to;
  let prev = null;
  const yBack = iso => (Number(iso.slice(0, 4)) - 1) + iso.slice(4);
  if (P.compare === 'range' && W.vs) prev = { from: W.vs.from, to: W.vs.to, shift: null, range: true };
  else if (P.compare === 'year') prev = { from: yBack(from), to: yBack(upTo), shift: unit ? { m: 12, q: 4, y: 1 }[unit] : null, whole: soFar ? { from: yBack(from), to: yBack(to) } : null };
  else if (P.compare === 'prev'){
    if (b0){ const n = W.last || W.next, pf = hbBucketStart(hbBucketMove(b0, unit, -n), unit);
      const pEnd = hbBucketEnd(hbBucketMove(b1, unit, -n), unit);
      prev = { from: pf, to: soFar ? hbIsoShift(pf, Math.round((Date.parse(today) - Date.parse(from)) / 864e5)) : pEnd, shift: n, whole: soFar ? { from: pf, to: pEnd } : null }; }
    else {
      /* an exact whole month, quarter or year is held against the whole one
         before it (Q3 against Q2, not the 92 days before 1 July) */
      const whole = (from > '1900' && to < '9000') ? ['m', 'q', 'y'].find(u => { const b = hbBucketOf(from, u); return hbBucketStart(b, u) === from && hbBucketEnd(b, u) === to; }) : null;
      if (whole){ const pb = hbBucketMove(hbBucketOf(from, whole), whole, -1); prev = { from: hbBucketStart(pb, whole), to: hbBucketEnd(pb, whole), shift: null }; }
      else { const days = Math.round((Date.parse(upTo) - Date.parse(from)) / 864e5) + 1; prev = { from: hbIsoShift(from, -days), to: hbIsoShift(from, -1), shift: null }; }
    }
  }
  return { from, to: upTo, date, unit, b0, b1, prev, soFar };
}
/* a period with both ends on the calendar (an open end is not a span to draw) */
function hbWinSpanOk(Z){ return !!Z && Z.from > '1900' && Z.to < '9000'; }
function hbWinWord(W){
  if (!W) return i18t('hb_win_all');
  const u = W.unit || 'm';
  if (W.last === 1 || W.next === 1) return i18t((W.last ? 'hb_win_this_' : 'hb_win_coming_') + u);
  if (W.last) return i18t('hb_win_last', { n: W.last, units: i18tn('hb_tr_units_' + u, W.last, { n: W.last }) });
  if (W.next) return i18t('hb_win_next', { n: W.next, units: i18tn('hb_tr_units_' + u, W.next, { n: W.next }) });
  /* a period held against another one is named as an analyst names it */
  /* a span with both ends is named with its year ("Q3 2026", "1 July 2025
     to 31 March 2026"): a range can cross a year, and an analyst names it */
  if (W.from && W.to) return hbPeriodWord(W.from, W.to);
  return i18t('hb_win_range', { from: W.from ? hbReadDay(W.from) : '…', to: W.to ? hbReadDay(W.to) : '…' });
}
/* a period named as an analyst names it: a whole year, quarter or month by
   its name ("Q1 2025"), any other span by its two days, years said */
function hbPeriodWord(from, to){
  for (const u of ['y', 'q', 'm']){ const b = hbBucketOf(from, u); if (hbBucketStart(b, u) === from && hbBucketEnd(b, u) === to) return hbBucketLabel(b, u, false); }
  const day = iso => { try { return new Date(iso + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { day: 'numeric', month: 'long', year: 'numeric' }); } catch (_){ return String(iso); } };
  return i18t('hb_win_range', { from: day(from), to: day(to) });
}
/* the words for the period a comparison is held against */
function hbCmpPrevWord(P){
  if (P.compare === 'range' && P.window && P.window.vs) return hbPeriodWord(P.window.vs.from, P.window.vs.to);
  return i18t(P.compare === 'year' ? 'hb_cmp_year_word' : 'hb_cmp_prev_word');
}
/* the number of columns between two periods' first days (Q3 2026 sits 6
   quarters after Q1 2025) */
function hbBucketGap(fromIso, toIso, unit){
  let a = hbBucketOf(fromIso, unit), b = hbBucketOf(toIso, unit), sign = 1;
  if (a > b){ [a, b] = [b, a]; sign = -1; }
  let n = 0; while (a < b && n < 5000){ a = hbBucketNext(a, unit); n++; }
  return sign * n;
}
/* the contracts whose date falls in the period (and, compared, in the one
   before). A contract with no such date is in neither — and said. */
function hbWindowCut(cs, P){
  const Z = hbWinOf(P); if (!Z) return null;
  const inside = [], prev = [], whole = []; let undated = 0;
  const W2 = Z.prev && Z.prev.whole;
  cs.forEach(c => { const iso = hbDateOf(c, Z.date); if (!iso){ undated++; return; }
    if (W2 && iso >= W2.from && iso <= W2.to) whole.push(c);
    if (iso >= Z.from && iso <= Z.to) inside.push(c);
    else if (Z.prev && iso >= Z.prev.from && iso <= Z.prev.to) prev.push(c); });
  /* a period still running is held against the same days before it; the
     WHOLE of the period before is said beside it (early in a quarter the
     same days hold nothing, and the card must not read empty) */
  return { cs: inside, prev: Z.prev ? prev : null, prevWhole: W2 ? whole : null, undated, total: cs.length, Z };
}
/* a dig under a card counts within the card's period: the number on a door
   matches the list behind it */
function hbWinCs(cs, D){ const P = hbPlan(D); const W = P.window ? hbWindowCut(cs, P) : null; return W ? W.cs : cs; }

/* ---- THE ORDER AND THE TOP N, said ---- */
/* the order and the top N belong to ONE split — the one hbCardPlan named */
function hbIsGroupDim(P, field){
  if (!P || !P.groupDim) return false;
  if (P.groupDim === 'split') return !!(P.split && P.split.by === field);
  if (P.groupDim === 'split2') return !!(P.split2 && P.split2.by === field);
  return false;
}
function hbGroupSortKey(r, m, by){ return by === 'count' ? r.n : m === 'value' ? r.v : m === 'count' || m === 'live' ? r.n : (hbMeasure(r.list, m).y || 0); }
function hbGroupsSorted(rows, P, m, field){
  const S = hbIsGroupDim(P, field) ? P.sort : null; if (!S) return rows;
  if (S.by === 'name') return rows.sort((a, b) => (S.dir === 'down' ? -1 : 1) * String(a.label).localeCompare(String(b.label)));
  return rows.sort((a, b) => ((S.dir === 'up' ? 1 : -1) * (hbGroupSortKey(a, m, S.by) - hbGroupSortKey(b, m, S.by))) || String(a.label).localeCompare(String(b.label)));
}
/* the groups as drawn: the reader's order, the top N (or the picture's own
   cap), the rest gathered in ONE place that is itself a door (qr:) — never
   dropped silently */
function hbGroupsCut(rows, P, cap, m, field){
  rows = hbGroupsSorted(rows, P, m, field);
  const want = hbIsGroupDim(P, field) && P.top ? P.top : null;
  const keep = want ? Math.min(want, cap || want) : cap;
  if (!keep || rows.length <= keep) return { rows, rest: null, kept: rows.length };
  const shown = rows.slice(0, want ? keep : keep - 1), left = rows.slice(shown.length);
  const rest = { g: null, rest: true, label: i18tn('hb_top_rest', left.length, { n: _hbN(left.length) }), list: left.flatMap(r => r.list), n: left.reduce((a, r) => a + r.n, 0), v: left.reduce((a, r) => a + r.v, 0), groups: left.length };
  return { rows: shown, rest, kept: shown.length };
}
/* the door onto the rest: the groups past the first `kept` in the card's own
   order, asked again (mv: how the picture ordered them — by value, by count,
   or only the contracts carrying a value, as the blocks do) */
function hbRestDig(D, field, kept, mv){ return 'qr:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + kept + HB_KEY_SEP + (mv === 'b' ? 'b' : mv ? 'v' : 'n'); }
function hbKeptGroups(cs, field, P, m, kept, mv){
  const base = mv === 'b' ? cs.filter(c => hbValueOfOne(c) > 0) : cs;
  return { base, kept: new Set(hbGroupsSorted(hbGroupsOf(base, field, mv !== 'n'), P, m, field).slice(0, kept).map(r => r.g)) };
}
/* the second split's groups (a stack's colours, a heat grid's rows), largest
   first, the rest as one "more" — the same reading a door asks again */
function hbSeriesMv(P){ return P.measure === 'value' && hbMoneyOk(); }
function hbSeriesOf(cs, field, P, cap){
  const mv = hbSeriesOf.mv(P), m = mv ? 'value' : P.measure;
  const cut = hbGroupsCut(hbGroupsOf(cs, field, mv), P, cap, m, field);
  return { rows: cut.rows, rest: cut.rest, kept: cut.kept, mv };
}
hbSeriesOf.mv = hbSeriesMv;

/* ---- WHAT RUNS ACROSS a two-split picture: time buckets, or groups ---- */
function hbXOf(D, cs, P){
  const S = P.split, m = P.measure, money = hbMoneyOk();
  if (S.by === 'date'){
    const unit = S.unit || 'm', date = S.date || 'end', tok = 'd.' + unit + '.' + date;
    const unsigned = date === 'signed' ? cs.filter(c => !hbDateOf(c, 'signed') && c.status !== 'Signed') : [];
    const out = new Set(unsigned), rows = cs.filter(c => !out.has(c));
    const keyed = rows.map(c => ({ c, b: hbBucketOf(hbDateOf(c, date), unit) }));
    const Z = hbWinOf(P); let span = [];
    if (Z && hbWinSpanOk(Z) && Z.date === date){ let b = hbBucketOf(Z.from, unit); const last = hbBucketOf(Z.to, unit); while (b <= last && span.length < 400){ span.push(b); b = hbBucketNext(b, unit); } }
    else { const dated = keyed.filter(x => x.b !== 'none').map(x => x.b).sort();
      if (dated.length){ let b = dated[0]; const last = dated[dated.length - 1]; while (b <= last && span.length < 400){ span.push(b); b = hbBucketNext(b, unit); } } }
    let lo = null, hi = null;
    if (span.length > HB_COLS_MAX){
      const forward = date === 'end' || date === 'decision' || date === 'start', nowB = hbBucketOf(hbToday(), unit), ti = span.indexOf(nowB);
      const from = forward ? (ti < 0 ? (nowB < span[0] ? 0 : span.length - HB_COLS_MAX) : Math.max(0, Math.min(ti - Math.floor(HB_COLS_MAX / 4), span.length - HB_COLS_MAX))) : span.length - HB_COLS_MAX;
      if (from > 0) lo = span[from]; if (from + HB_COLS_MAX < span.length) hi = span[from + HB_COLS_MAX - 1];
      span = span.slice(from, from + HB_COLS_MAX);
    }
    const col = (b, list, edge) => ({ b, label: hbBucketLabel(b, unit, true), full: hbBucketLabel(b, unit, false), list, edge: !!edge });
    const cols = span.map(b => col(b, keyed.filter(x => x.b === b).map(x => x.c)));
    if (lo) cols.unshift(col('lt:' + lo, keyed.filter(x => x.b !== 'none' && x.b < lo).map(x => x.c), true));
    if (hi) cols.push(col('gt:' + hi, keyed.filter(x => x.b !== 'none' && x.b > hi).map(x => x.c), true));
    const none = keyed.filter(x => x.b === 'none').map(x => x.c);
    if (none.length) cols.push(col('none', none, true));
    return { cols, tok, unit, date, unsigned, time: true };
  }
  const mv = m === 'value' && money;
  const cut = hbGroupsCut(hbGroupsOf(cs, S.by, mv), P, HB_CHART_BARS, mv ? 'value' : m, S.by);
  const cols = cut.rows.map(r => ({ b: r.g, label: r.label, full: r.label, list: r.list }));
  if (cut.rest) cols.push({ b: '~' + cut.kept + (mv ? 'v' : 'n'), label: cut.rest.label, full: cut.rest.label, list: cut.rest.list, edge: true });
  return { cols, tok: S.by, unsigned: [], time: false };
}
/* a door onto one cell: the card's own key, then two (dimension, value) pairs */
function hbCellDig(D, t1, v1, t2, v2){ return 'q2:' + D.key + HB_KEY_SEP + t1 + HB_KEY_SEP + v1 + HB_KEY_SEP + t2 + HB_KEY_SEP + v2; }
function hbTokWord(tok){ if (/^d\./.test(tok)){ const [, u, d] = tok.split('.'); return hbSplitWord({ by: 'date', unit: u, date: d }); } return hbSplitWord({ by: tok }); }
function hbByThen(P){ return i18t('hb_by_then', { a: hbSplitWord(P.split), b: hbSplitWord(P.split2) }) + (P.measure !== 'count' ? ' · ' + i18t('hb_ms_' + P.measure).toLowerCase() : ''); }

/* ---- STACKED AND SIDE-BY-SIDE COLUMNS: one split across, one in colour ----
   Every segment is a door onto its own contracts (q2:), every legend entry a
   door onto its group; the axis is hbAxisTop's; colours are the board's own
   hues (a stage keeps its stage colour). */
function hbStackSvg(D, cs, P){
  const m = P.measure, grouped = P.pic === 'grouped';
  const X = hbXOf(D, cs, P), f2 = P.split2.by;
  const ser = hbSeriesOf(cs, f2, P, HB_SERIES_MAX);
  const series = ser.rows.map((r, i) => ({ g: r.g, label: r.label, hue: hbHueOf(f2, r.g, i), v: '' + r.g }))
    .concat(ser.rest ? [{ g: null, rest: true, label: ser.rest.label, hue: '#9FB3C8', v: '~' + ser.kept + (ser.mv ? 'v' : 'n') }] : []);
  const inSer = (c, S) => S.rest ? !ser.rows.some(r => r.g === hbGroupOf(c, f2)) : hbGroupOf(c, f2) === S.g;
  const cells = X.cols.map(col => ({ col, parts: series.map(S => { const list = col.list.filter(c => inSer(c, S)); return { S, list, M: hbMeasure(list, m) }; }) }));
  const tops = cells.map(x => grouped ? Math.max(0, ...x.parts.map(p => p.M.y || 0)) : x.parts.reduce((a, p) => a + (p.M.y || 0), 0));
  const W = 1000, H = 340, L = 64, R = 18, Tp = 46, B = 52, base = H - B, n = Math.max(1, cells.length), step = (W - L - R) / n;
  const top = hbAxisTop(Math.max(...tops, 0) * 1.1, m !== 'value' && m !== 'rounds');
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top);
  const fmtAxis = v => m === 'value' ? _hbM(v) : m === 'rounds' ? hbMeasureFmt(m, v) : _hbN(Math.round(v));
  let g = '';
  for (let k = 0; k <= 4; k++){ const v = top * k / 4, y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(fmtAxis(v))}</text>`; }
  /* the legend: each colour a door onto its group, over the period drawn */
  let lx = L;
  series.forEach(S => { const w = Math.min(200, 26 + S.label.length * 7.2);
    if (lx + w > W - R) return;
    g += `<g class="hb-sv-row" transform="translate(${lx.toFixed(1)},14)" ${_hbSvgDoor(S.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + f2 + HB_KEY_SEP + S.g, S.label)}><rect x="0" y="0" width="10" height="10" rx="2" style="fill:${S.hue}"/><text x="15" y="9.5" font-size="12" class="hb-sv-ink2">${_hbE(S.label)}</text></g>`;
    lx += w; });
  const labelEvery = n > 18 ? 2 : 1;
  cells.forEach((x, i) => {
    const cx = L + step * (i + 0.5), cw = Math.min(grouped ? 40 : 30, step * 0.66);
    let y0 = base;
    x.parts.forEach((p, j) => {
      const v = p.M.y || 0; if (!p.list.length || v <= 0) return;
      const say = `${x.col.full} · ${p.S.label}: ${m === 'count' ? _hbN(p.list.length) : hbMeasureFmt(m, p.M.y) + ' · ' + _hbN(p.list.length)}`;
      const dig = hbCellDig(D, X.tok, x.col.b, f2, p.S.v);
      if (grouped){ const bw = cw / series.length, bx = cx - cw / 2 + bw * j, y = Y(v);
        g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(dig, say)}><rect x="${(bx + 0.5).toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(1, bw - 1).toFixed(1)}" height="${Math.max(0.5, base - y).toFixed(1)}" rx="2" style="fill:${p.S.hue}"/></g>`; }
      else { const y1 = Y((top * (1 - (y0 - Tp) / (base - Tp))) + v), h = y0 - y1;
        g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(dig, say)}><rect x="${(cx - cw / 2).toFixed(1)}" y="${y1.toFixed(1)}" width="${cw.toFixed(1)}" height="${Math.max(0.5, h - 1).toFixed(1)}" rx="2" style="fill:${p.S.hue}"/></g>`;
        y0 = y1; }
    });
    const tot = tops[i];
    if (!grouped && tot > 0 && n <= 30) g += `<text x="${cx.toFixed(1)}" y="${(Y(tot) - 7).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(hbMeasureShort(m, tot))}</text>`;
    if (i % labelEvery === 0 || x.col.edge) g += `<text x="${cx.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(x.col.b === 'none' ? i18t('hb_c_no_date') : String(x.col.label).slice(0, Math.max(4, Math.floor(step / 7))))}</text>`;
    if (X.time && !x.col.edge && X.unit !== 'y' && (i === 0 || (X.unit === 'm' ? String(x.col.b).slice(5) === '01' : String(x.col.b).slice(5) === 'Q1'))) g += `<text x="${cx.toFixed(1)}" y="${base + 34}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(String(x.col.b).slice(0, 4))}</text>`;
  });
  const note = X.unsigned.length ? i18tn('hb_cols_unsigned', X.unsigned.length, { n: _hbN(X.unsigned.length) }) : '';
  const by = hbByThen(P);
  return { body: `<svg class="hb-svg hb-stack" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note,
    cells: cells.map(x => ({ b: x.col.b, label: x.col.full, k: x.col.list.filter(c => series.some(S => inSer(c, S))).length, parts: x.parts.map(p => ({ g: p.S.g, label: p.S.label, k: p.list.length, y: p.M.y, dig: hbCellDig(D, X.tok, x.col.b, f2, p.S.v) })) })),
    series: series.map(S => ({ g: S.g, label: S.label, rest: !!S.rest })), unsigned: X.unsigned.length };
}
/* ---- THE HEAT GRID: one split across, the other down, each cell shaded by
   its measure and a door onto its contracts ---- */
function hbHeatSvg(D, cs, P){
  const m = P.measure, X = hbXOf(D, cs, P), f2 = P.split2.by;
  const ser = hbSeriesOf(cs, f2, P, HB_HEAT_MAX);
  const rowsS = ser.rows.map(r => ({ g: r.g, label: r.label, v: '' + r.g })).concat(ser.rest ? [{ g: null, rest: true, label: ser.rest.label, v: '~' + ser.kept + (ser.mv ? 'v' : 'n') }] : []);
  const inRow = (c, S) => S.rest ? !ser.rows.some(r => r.g === hbGroupOf(c, f2)) : hbGroupOf(c, f2) === S.g;
  const grid = rowsS.map(S => X.cols.map(col => { const list = col.list.filter(c => inRow(c, S)); return { S, col, list, M: hbMeasure(list, m) }; }));
  const max = Math.max(0, ...grid.flat().map(x => x.list.length ? (x.M.y || 0) : 0)) || 1;
  const nC = Math.max(1, X.cols.length), nR = Math.max(1, rowsS.length);
  const W = 1000, L = 190, R = 12, Tp = 36, cellH = 30, H = Tp + nR * cellH + 22, step = (W - L - R) / nC;
  let g = '';
  X.cols.forEach((col, i) => { const x = L + step * (i + 0.5);
    g += `<text x="${x.toFixed(1)}" y="${Tp - 12}" text-anchor="middle" font-size="11.5" class="hb-sv-ink2">${_hbE(col.b === 'none' ? i18t('hb_c_no_date') : String(col.label).slice(0, Math.max(3, Math.floor(step / 7))))}</text>`; });
  grid.forEach((row, ri) => { const y = Tp + ri * cellH, S = rowsS[ri];
    g += `<g class="hb-sv-row" ${_hbSvgDoor(S.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + f2 + HB_KEY_SEP + S.g, S.label)}><rect x="0" y="${y}" width="${L - 10}" height="${cellH}" fill="transparent"/><text x="8" y="${y + cellH / 2 + 4.5}" font-size="12.5" font-weight="600" class="hb-sv-ink">${_hbE(String(S.label).slice(0, 26))}</text></g>`;
    row.forEach((x, ci) => { const cx = L + step * ci, v = x.list.length ? (x.M.y || 0) : 0, a = x.list.length ? 0.14 + 0.82 * v / max : 0;
      const say = `${x.col.full} · ${S.label}: ${x.list.length ? (m === 'count' ? _hbN(x.list.length) : hbMeasureFmt(m, x.M.y) + ' · ' + _hbN(x.list.length)) : i18t('hb_none_here')}`;
      g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(ri * 3 + ci, 30) * 12}ms" ${_hbSvgDoor(x.list.length ? hbCellDig(D, X.tok, x.col.b, f2, S.v) : '', say)}><rect x="${(cx + 1.5).toFixed(1)}" y="${y + 1.5}" width="${Math.max(1, step - 3).toFixed(1)}" height="${cellH - 3}" rx="3" class="${x.list.length ? 'hb-sv-heat' : 'hb-sv-track'}"${x.list.length ? ` fill-opacity="${a.toFixed(2)}"` : ''}/>${x.list.length && step > 26 ? `<text x="${(cx + step / 2).toFixed(1)}" y="${y + cellH / 2 + 4}" text-anchor="middle" font-size="11.5" font-weight="600" class="${a > 0.55 ? 'hb-sv-heat-ink' : 'hb-sv-ink'}">${_hbE(hbMeasureShort(m, x.M.y))}</text>` : ''}</g>`; });
  });
  const note = X.unsigned.length ? i18tn('hb_cols_unsigned', X.unsigned.length, { n: _hbN(X.unsigned.length) }) : '';
  const by = hbByThen(P);
  return { body: `<svg class="hb-svg hb-heat" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note,
    cells: grid.flat().filter(x => x.list.length).map(x => ({ a: x.col.full, b: x.S.label, k: x.list.length, y: x.M.y, dig: hbCellDig(D, X.tok, x.col.b, f2, x.S.v) })), unsigned: X.unsigned.length };
}
/* ---- THIS PERIOD AGAINST THE ONE BEFORE ----
   Over time: each column beside the same column a period (or a year) back.
   By a group: two bars a group, this period and the one before. The change
   is said in words, and every bar is a door onto its own contracts. */
/* the figure a change is measured on: a total with nothing in it is 0; an
   average with nothing in it is NO FIGURE (null), never 0 */
function hbCmpY(m, side){ const y = side && side.y; return hbAvgMeasure(m) ? (y == null ? null : y) : (y || 0); }
function hbCmpChange(a, b){
  if (a == null || b == null) return i18t('hb_cmp_none');
  if (!(b > 0)) return a > 0 ? i18t('hb_cmp_new') : i18t('hb_cmp_same');
  const p = Math.round((a - b) / b * 100);
  return p === 0 ? i18t('hb_cmp_same') : i18t(p > 0 ? 'hb_cmp_up' : 'hb_cmp_down', { p: _hbN(Math.abs(p)) });
}
function hbCompareSvg(D, cs, P, Wc){
  const m = P.measure, money = hbMoneyOk(), Z = Wc && Wc.Z;
  const prevCs = (Wc && Wc.prev) || [];
  const Mc = hbMeasure(cs, m), Mp = hbMeasure(prevCs, m);
  const prevWord = hbCmpPrevWord(P);
  const W = 1000, L = 64, R = 18, Tp = 40, B = 52;
  let g = '', rows = [];
  const isDate = P.split && P.split.by === 'date';
  if (isDate){
    const unit = P.split.unit || 'm', date = P.split.date || 'end', tok = 'd.' + unit + '.' + date;
    /* the period's buckets, each against its partner back in time */
    const buckets = []; if (Z && hbWinSpanOk(Z)){ let b = hbBucketOf(Z.from, unit); const last = hbBucketOf(Z.to, unit); while (b <= last && buckets.length < HB_COLS_MAX){ buckets.push(b); b = hbBucketNext(b, unit); } }
    else { const ds = cs.map(c => hbBucketOf(hbDateOf(c, date), unit)).filter(b => b !== 'none').sort(); if (ds.length){ let b = ds[0]; while (b <= ds[ds.length - 1] && buckets.length < HB_COLS_MAX){ buckets.push(b); b = hbBucketNext(b, unit); } } }
    const back = P.compare === 'year' ? { m: 12, q: 4, y: 1 }[unit] : (Z && Z.prev && Z.prev.range) ? hbBucketGap(Z.prev.from, Z.from, unit) : (Z && Z.prev && Z.prev.shift) || buckets.length || 1;
    rows = buckets.map(b => { const pb = hbBucketMove(b, unit, -back);
      const cur = cs.filter(c => hbInBucket(c, unit, date, b)), prev = prevCs.filter(c => hbInBucket(c, unit, date, pb));
      return { b, pb, label: hbBucketLabel(b, unit, true), full: hbBucketLabel(b, unit, false), pfull: hbBucketLabel(pb, unit, false), cur, prev, Mc: hbMeasure(cur, m), Mp: hbMeasure(prev, m),
        dc: 'qm:' + D.key + HB_KEY_SEP + unit + HB_KEY_SEP + b + HB_KEY_SEP + date, dp: hbCellDig(D, 'w', 'prev', tok, pb) }; });
    const H = 320, base = H - B, n = Math.max(1, rows.length), step = (W - L - R) / n, cw = Math.min(22, step * 0.32);
    const top = hbAxisTop(Math.max(0, ...rows.map(r => Math.max(r.Mc.y || 0, r.Mp.y || 0))) * 1.12, m !== 'value' && m !== 'rounds');
    const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top);
    for (let k = 0; k <= 4; k++){ const v = top * k / 4, y = Y(v); g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(m === 'value' ? _hbM(v) : _hbN(Math.round(v)))}</text>`; }
    rows.forEach((r, i) => { const cx = L + step * (i + 0.5);
      const bar = (x, v, list, dig, cls, say) => list.length && v > 0 ? `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(dig, say)}><rect x="${x.toFixed(1)}" y="${Y(v).toFixed(1)}" width="${cw.toFixed(1)}" height="${Math.max(0.5, base - Y(v)).toFixed(1)}" rx="3" class="${cls}"/></g>` : '';
      const sv = (M, list) => m === 'count' ? _hbN(list.length) : hbMeasureFmt(m, M.y) + ' · ' + _hbN(list.length);
      g += bar(cx - cw - 1, r.Mp.y || 0, r.prev, r.dp, 'hb-sv-colprev', `${r.pfull}: ${sv(r.Mp, r.prev)}`) + bar(cx + 1, r.Mc.y || 0, r.cur, r.dc, 'hb-sv-col', `${r.full}: ${sv(r.Mc, r.cur)}`);
      g += `<text x="${cx.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(r.label)}</text>`; });
    g = `<svg class="hb-svg hb-cols hb-cmp" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_rc_compare'))}">${g}</svg>`;
  } else {
    const field = P.split.by, mv = m === 'value' && money;
    const cutRows = hbGroupsCut(hbGroupsOf(cs.concat(prevCs), field, mv), P, HB_CHART_BARS, mv ? 'value' : m, field);
    const groups = cutRows.rows.map(r => r.g);
    rows = groups.map(gk => { const cur = cs.filter(c => hbGroupOf(c, field) === gk), prev = prevCs.filter(c => hbGroupOf(c, field) === gk);
      return { g: gk, full: hbGroupLabel(field, gk), cur, prev, Mc: hbMeasure(cur, m), Mp: hbMeasure(prev, m),
        dc: 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + gk, dp: hbCellDig(D, 'w', 'prev', field, gk) }; });
    if (cutRows.rest){ const kept = new Set(groups); const cur = cs.filter(c => !kept.has(hbGroupOf(c, field))), prev = prevCs.filter(c => !kept.has(hbGroupOf(c, field)));
      const v = '~' + cutRows.kept + (mv ? 'v' : 'n');
      rows.push({ g: null, full: cutRows.rest.label, cur, prev, Mc: hbMeasure(cur, m), Mp: hbMeasure(prev, m), dc: hbCellDig(D, 'w', 'cur', field, v), dp: hbCellDig(D, 'w', 'prev', field, v), rest: true }); }
    const max = Math.max(1, ...rows.map(r => Math.max(r.Mc.y || 0, r.Mp.y || 0)));
    const rowH = 46, H = Tp + rows.length * rowH + 12, LL = 220, bw = W - LL - 150;
    rows.forEach((r, i) => { const y = Tp + i * rowH;
      const sv = (M, list) => m === 'count' ? _hbN(list.length) : hbMeasureFmt(m, M.y);
      const bar = (yy, v, list, dig, cls, say) => `<g class="hb-sv-cbox hb-in" ${_hbSvgDoor(list.length ? dig : '', say)}><rect x="${LL}" y="${yy}" width="${bw}" height="15" fill="transparent"/><rect x="${LL}" y="${yy}" width="${Math.max(list.length ? 2 : 0, bw * (v || 0) / max).toFixed(1)}" height="15" rx="3" class="${cls}"/><text x="${(LL + bw * (v || 0) / max + 8).toFixed(1)}" y="${yy + 12}" font-size="12" class="hb-sv-ink2">${_hbE(sv(v === r.Mc.y ? r.Mc : r.Mp, list))}</text></g>`;
      g += `<text x="8" y="${y + 14}" font-size="13" font-weight="600" class="hb-sv-ink">${_hbE(String(r.full).slice(0, 28))}</text><text x="8" y="${y + 31}" font-size="11.5" class="hb-sv-mute">${_hbE(hbCmpChange(hbCmpY(m, r.Mc), hbCmpY(m, r.Mp)))}</text>`
        + bar(y + 2, r.Mc.y || 0, r.cur, r.dc, 'hb-sv-col', `${r.full} · ${hbWinWord(P.window)}: ${sv(r.Mc, r.cur)}`) + bar(y + 20, r.Mp.y || 0, r.prev, r.dp, 'hb-sv-colprev', `${r.full} · ${prevWord}: ${sv(r.Mp, r.prev)}`); });
    g = `<svg class="hb-svg hb-cmp" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_rc_compare'))}"><rect x="${LL}" y="10" width="10" height="10" rx="2" class="hb-sv-col"/><text x="${LL + 15}" y="19" font-size="12" class="hb-sv-ink2">${_hbE(hbWinWord(P.window))}</text><rect x="${LL + 200}" y="10" width="10" height="10" rx="2" class="hb-sv-colprev"/><text x="${LL + 215}" y="19" font-size="12" class="hb-sv-ink2">${_hbE(prevWord)}</text>${g}</svg>`;
  }
  const fmt = (M, list) => m === 'count' ? `<b>${_hbN(list.length)}</b> ${_hbE(i18tn('hb_contracts_word', list.length, { n: list.length }))}` : `<b>${_hbE(hbMeasureFmt(m, M.y))}</b> · ${_hbN(list.length)}`;
  const range = P.compare === 'range';
  const nowWord = (range && P.window.from && P.window.to ? hbPeriodWord(P.window.from, P.window.to) : hbWinWord(P.window)) + (Z && Z.soFar && (P.window.last === 1 || range) ? ' ' + i18t('hb_win_sofar') : '');
  const lead = `${_hbE(nowWord)}: ${fmt(Mc, cs)} · ${_hbE(prevWord)}: ${fmt(Mp, prevCs)} · <b>${_hbE(hbCmpChange(hbCmpY(m, Mc), hbCmpY(m, Mp)))}</b>`;
  return { body: g, lead, by: (P.split ? hbSplitWord(P.split) + ' · ' : '') + i18t('hb_cmp_' + P.compare).toLowerCase(), note: '',
    cmp: { cur: { k: cs.length, y: Mc.y }, prev: { k: prevCs.length, y: Mp.y }, whole: Wc && Wc.prevWhole ? { k: Wc.prevWhole.length, y: hbMeasure(Wc.prevWhole, m).y } : null, word: prevWord, low: range ? i18t('hb_cmp_range_in', { p: prevWord }) : prevWord.toLowerCase(), now: nowWord, rows: rows.map(r => ({ label: r.full, ck: r.cur.length, pk: r.prev.length, cy: r.Mc.y, py: r.Mp.y, dc: r.dc, dp: r.dp })) } };
}
/* ONE RUN OF A CARD: the period cut, then the picture — the same for the
   card, its reading, the board described to Copilot and the shelf */
function hbChartRun(D, cs0, P){
  const money = hbMoneyOk();
  const W = P.window ? hbWindowCut(cs0, P) : null;
  const cs = W ? W.cs : cs0;
  let R;
  if (P.compare) R = hbCompareSvg(D, cs, P, W);
  else if (P.split2 && P.pic === 'heat') R = hbHeatSvg(D, cs, P);
  else if (P.split2 && (P.pic === 'stack' || P.pic === 'grouped')) R = hbStackSvg(D, cs, P);
  else if (P.pic === 'cols') R = hbColsSvg(D, cs, P);
  else if (P.pic === 'gantt') R = hbTimelineSvg(D, cs, money);
  else if (P.pic === 'bubbles') R = hbBubblesSvg(D, cs);
  else if (P.pic === 'blocks') R = hbBlocksSvg(D, cs, P.split.by, money, P);
  else if (P.pic === 'bars') R = hbGroupBars(D, cs, P);
  else if (P.pic === 'list') R = { body: '', by: '', note: '' };
  else R = hbRingSvg(D, cs, P.split.by, money, P);
  /* the period and what the plan could not draw are said under the chart */
  const notes = [R.note];
  if (W){ notes.push(i18t('hb_win_note', { what: hbWinWord(P.window), date: i18t('hb_dt_' + W.Z.date), n: _hbN(cs.length), t: _hbN(W.total) }));
    if (W.undated) notes.push(i18tn('hb_win_undated', W.undated, { n: _hbN(W.undated), date: i18t('hb_dt_' + W.Z.date) })); }
  if (P.winSaid) notes.push(i18t('hb_win_default'));
  if (P.dropped && P.dropped.length) notes.push(i18t('hb_dropped', { what: P.dropped.map(k => i18t('hb_part_' + k)).join(', ') }));
  R.note = notes.filter(Boolean).join(' ');
  R.W = W;
  return { R, cs };
}
function hbChartHtml(D, cs0, big){
  const money = hbMoneyOk();
  const P = hbPlan(D);
  if (!cs0.length && P.measure !== 'live') return `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
  const { R, cs } = hbChartRun(D, cs0, P);
  const total = money ? cs.reduce((a, c) => a + hbValueOfOne(c), 0) : null;
  const lead = R.lead || `<b>${_hbN(cs.length)}</b> ${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}${money ? ` · <b>${_hbE(_hbM(total))}</b>` : ''}`;
  /* enlarged, the chart opens with HaTi's reading in place of the trend
     line's arithmetic (READ, THEN ASK, below) */
  const read = big ? hbReadHtml(D, cs, P, R) : '';
  /* small, the chart says its point in one line under the totals (HEADLINE) */
  const head = big ? '' : hbHeadlineHtml(D.key, hbReadingOf(D, cs, P, R), cs.length, hbWhySig(D, P, cs));
  return `${read || (!head && R.say ? `<p class="hb-tr-say">${_hbE(R.say)}</p>` : '')}<div class="hb-chart-lead">${lead}<span class="hb-chart-by">${_hbE(R.by)}</span></div>${head}${R.body}${R.note ? `<div class="hb-quiet hb-chart-note">${_hbE(R.note)}</div>` : ''}`;
}
/* ============================================================
   READ, THEN ASK (Young picked it by name, 4 Oct 2026: "the cards when
   expanded should have some sort of summary explaining the charts … Short
   copilot summaries of what the analytics or data is saying" → "let's go with
   read then ask but the output of the ask should have colors like copilot's
   read")
   ============================================================
   An ENLARGED chart (the dig-in made bigger, or a kept view made bigger)
   opens with HATI'S READING: three or four plain lines worked out from the
   chart's OWN numbers (hbColsSvg hands its columns back; a grouping is
   hbGroupsOf, the ring's and bars' own reading). It replaces the trend line's
   arithmetic ("Count: −2 → 4 over 24 months · rising") on the enlarged card.
   Every number in it that stands for contracts is a DOOR onto them (the
   column's or the slice's own `qm:`/`qg:` key), so a number always matches
   the list behind it. It spends nothing and no model writes a word.
   Under it, ONE press asks Copilot "What could explain this?" (Copilot's
   place: a press, with what it reads said on the button). The answer lands
   in the AMBER box — teal is HaTi's counting, amber is Copilot's opinion —
   and a sentence that states a number of contracts this chart does not hold
   is not printed, and the box says so (THE COUNT IS HATI'S, NEVER THE
   MODEL'S, the map's own rule). An answer is kept with its chart for the day
   (`s.why`, keyed by the chart and what it counted); a different count is a
   different chart. A failure is said in the same box with Try again. */
const HB_WHY_KEEP = 12, HB_WHY_IDS = 60, HB_READ_QUIET_RUN = 3;
const _hbWhyBusy = new Set(), _hbWhyErr = new Map();
const _hbStar = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4.2 4.2l2 2M9.8 9.8l2 2M11.8 4.2l-2 2M6.2 9.8l-2 2"/></svg>';
/* a number that opens the contracts it counts */
function hbReadDoor(n, dig, word){
  const t = word != null ? word : _hbN(n);
  return dig && n > 0 ? `<button type="button" class="hb-read-n" data-hb-dig="${_hbE(dig)}" title="${_hbE(i18t('hb_read_open', { n: _hbN(n) }))}">${_hbE(t)}</button>` : `<b>${_hbE(t)}</b>`;
}
/* The words a reading is said in, with its doors: each line is a key and its
   parts; `{x}` parts that are doors arrive already drawn. */
function hbReadLine(key, parts, count){
  /* every placeholder is kept as itself through the lookup, then filled
     here: a door is HTML, a word is escaped */
  const keep = {}; Object.keys(parts).forEach(k => { keep[k] = '{' + k + '}'; });
  const raw = count == null ? i18t(key, keep) : i18tn(key, count, keep);
  const safe = {}; Object.keys(parts).forEach(k => { safe[k] = parts[k] && parts[k].html != null ? parts[k].html : _hbE(String(parts[k])); });
  return _hbE(raw).replace(/\{(\w+)\}/g, (m, k) => (k in safe ? safe[k] : m));
}
/* THE READING: lines (HTML) and the counts it states (for the check). The
   two-split pictures and the comparison are read here; the rest by
   hbReadingCore; the period and the top N are said after either. */
function hbReadingOf(D, cs, P, R){
  if (!cs.length && !(P.compare && R && R.cmp && (R.cmp.prev.k || (R.cmp.whole && R.cmp.whole.k)))) return null;
  let r = null;
  if (P.compare && R && R.cmp) r = hbReadCompareOf(D, cs, P, R);
  else if (P.split2 && R && Array.isArray(R.cells)) r = hbReadTwoOf(D, cs, P, R);
  else r = hbReadingCore(D, cs, P, R);
  r = r || { lines: [], counts: new Set([cs.length]) };
  if (!r.keys) r.keys = [];
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l){ r.lines.push(l); r.keys.push(key); } };
  /* the top N: what is drawn, and the rest behind ONE door */
  if (P.top && P.groupDim === 'split' && P.split && ['ring', 'bars', 'blocks'].includes(P.pic)){
    const field = P.split.by, money = hbMoneyOk(), mv = P.pic === 'blocks' ? 'b' : P.pic === 'ring' ? money : (P.measure === 'value');
    const base = mv === 'b' ? cs.filter(c => hbValueOfOne(c) > 0) : cs;
    const cap = P.pic === 'ring' ? HB_RING_MAX : P.pic === 'blocks' ? HB_BLOCK_GROUPS : HB_CHART_BARS;
    const cut = hbGroupsCut(hbGroupsOf(base, field, !!mv), P, cap, P.pic === 'blocks' ? 'value' : P.measure, field);
    if (cut.rest){ r.counts.add(cut.rest.n);
      say('hb_read_topn', { n: _hbN(cut.kept), g: _hbN(cut.rest.groups), k: { html: hbReadDoor(cut.rest.n, hbRestDig(D, field, cut.kept, mv)) } }, cut.rest.n); }
  }
  /* the period: how much of the card's set it holds */
  if (R && R.W){ r.counts.add(R.W.total);
    say('hb_read_window', { what: hbWinWord(P.window), date: i18t('hb_dt_' + R.W.Z.date), n: _hbN(cs.length), t: _hbN(R.W.total) }, cs.length); }
  return r.lines.length ? r : null;
}
/* THIS PERIOD AGAINST THE ONE BEFORE, in words: the totals, and the group (or
   month) that moved most — each number a door */
function hbReadCompareOf(D, cs, P, R){
  const lines = [], keys = [], counts = new Set([cs.length]), C = R.cmp, m = P.measure;
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l){ lines.push(l); keys.push(key); } };
  const fmt = (k, y) => m === 'count' ? _hbN(k) : hbMeasureFmt(m, y);
  counts.add(C.cur.k); counts.add(C.prev.k);
  say('hb_read_cmp', { a: C.now || hbWinWord(P.window), x: fmt(C.cur.k, C.cur.y), b: C.low || C.word.toLowerCase(), y: fmt(C.prev.k, C.prev.y), chg: hbCmpChange(hbCmpY(m, C.cur), hbCmpY(m, C.prev)) });
  if (C.whole && C.whole.k !== C.prev.k){ counts.add(C.whole.k); say('hb_read_cmp_whole', { b: C.low || C.word.toLowerCase(), y: fmt(C.whole.k, C.whole.y) }); }
  /* an average with nothing on one side has no move to name */
  const avg = hbAvgMeasure(m);
  const rows = C.rows.filter(x => avg ? (x.cy != null && x.py != null) : (x.ck || x.pk));
  if (rows.length > 1){
    const big = rows.slice().sort((a, b) => Math.abs((b.cy || 0) - (b.py || 0)) - Math.abs((a.cy || 0) - (a.py || 0)))[0];
    counts.add(big.ck); counts.add(big.pk);
    say('hb_read_cmp_most', { who: big.label, x: { html: hbReadDoor(big.ck, big.dc, fmt(big.ck, big.cy)) }, y: { html: hbReadDoor(big.pk, big.dp, fmt(big.pk, big.py)) }, chg: hbCmpChange(hbCmpY(m, { y: big.cy }), hbCmpY(m, { y: big.py })) });
  }
  return { lines, counts, keys };
}
/* TWO SPLITS, in words: the largest part, the busiest column (or the hottest
   cell) — each number a door onto its own contracts */
function hbReadTwoOf(D, cs, P, R){
  const lines = [], keys = [], counts = new Set([cs.length]), m = P.measure, money = m === 'value';
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l){ lines.push(l); keys.push(key); } };
  const fmt = (k, y) => m === 'count' ? _hbN(k) : hbMeasureFmt(m, y);
  say('hb_read_two', { n: _hbN(cs.length), a: hbSplitWord(P.split).toLowerCase(), b: hbSplitWord(P.split2).toLowerCase() }, cs.length);
  if (P.pic === 'heat'){
    const hot = R.cells.slice().sort((a, b) => (b.y || 0) - (a.y || 0) || b.k - a.k)[0];
    if (hot){ counts.add(hot.k); say('hb_read_heat_hot', { a: hot.a, b: hot.b, x: { html: hbReadDoor(hot.k, hot.dig, fmt(hot.k, hot.y)) } }, hot.k); }
    return { lines, counts, keys };
  }
  const f2 = P.split2.by, by = new Map();
  R.cells.forEach(c => c.parts.forEach(p => { if (p.g == null) return; const t = by.get(p.g) || { label: p.label, k: 0, y: 0 }; t.k += p.k; t.y += (p.y || 0); by.set(p.g, t); }));
  const tot = [...by.values()].reduce((a, t) => a + (money ? t.y : t.k), 0) || 1;
  const lead = [...by.entries()].sort((a, b) => (money ? b[1].y - a[1].y : b[1].k - a[1].k))[0];
  if (lead && !hbAvgMeasure(m)){ counts.add(lead[1].k);
    say('hb_read_two_top', { who: lead[1].label, x: { html: hbReadDoor(lead[1].k, 'qg:' + D.key + HB_KEY_SEP + f2 + HB_KEY_SEP + lead[0], money ? _hbM(lead[1].y) : _hbN(lead[1].k)) }, pct: _hbN(Math.round((money ? lead[1].y : lead[1].k) / tot * 100)) }, lead[1].k); }
  const col = R.cells.filter(c => c.b !== 'none').sort((a, b) => b.k - a.k)[0];
  if (col && col.k){ counts.add(col.k);
    say('hb_read_two_col', { a: col.label, n: _hbN(col.k) }, col.k); }
  if (R.unsigned){ counts.add(R.unsigned); say('hb_read_unsigned', { n: _hbN(R.unsigned) }, R.unsigned); }
  return { lines, counts, keys };
}
function hbReadingCore(D, cs, P, R){
  const lines = [], keys = [], counts = new Set([cs.length]);
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l){ lines.push(l); keys.push(key); } };
  if (!cs.length) return null;
  if (P.pic === 'cols' && R && Array.isArray(R.cols) && R.cols.length && P.measure !== 'live'){
    const unit = R.unit || 'm', m = R.m || P.measure, avg = hbAvgMeasure(m);
    const label = b => hbBucketLabel(b, unit, false);
    const units = n => i18tn('hb_tr_units_' + unit, n, { n });   /* the word alone: "months" */
    const cols = R.cols, edges = R.edges || [];
    const counted = cols.reduce((a, c) => a + c.k, 0) + edges.reduce((a, c) => a + c.k, 0);
    cols.forEach(c => counts.add(c.k)); edges.forEach(c => counts.add(c.k)); counts.add(counted);
    if (!avg){
      const money = m === 'value' || m === 'exposure';
      /* the "No date" column is on the chart too: the totals said here are the
         card's, the same as its headline */
      const counted = cols.reduce((a, c) => a + c.k, 0) + edges.reduce((a, c) => a + c.k, 0) + (R.none || 0);
      counts.add(counted);
      const tot = cols.reduce((a, c) => a + (c.y || 0), 0) + edges.reduce((a, c) => a + (c.y || 0), 0) + (R.noneY || 0);
      /* the signed are the dated AND the undated executed ones (the "No date" column) */
      const signedN = counted;
      if ((R.date === 'signed' || hbSignM(m)) && R.unsigned){ counts.add(signedN); say('hb_read_signed', { n: _hbN(signedN), t: _hbN(cs.length) }, signedN); }
      else if (m === 'exposure') say('hb_read_exposure', { v: _hbM(tot), n: _hbN(counted) }, counted);
      else if (money) say('hb_read_value', { v: _hbM(tot), n: _hbN(counted) }, counted);
      else say('hb_read_counted', { n: _hbN(counted) }, counted);
      /* exposure leaves out what nobody has read, and says so */
      if (m === 'exposure'){ const unread = cols.reduce((a, c) => a + (c.M.left || 0), 0) + edges.reduce((a, c) => a + (c.M.left || 0), 0);
        if (unread){ counts.add(unread); say('hb_read_exp_unread', { n: _hbN(unread) }, unread); } }
      /* A RUNNING TOTAL is read as where it ends, never as a busiest month */
      if (P.show === 'running'){ const last = cols.filter(c => !c.edge).slice(-1)[0];
        if (last) say('hb_read_running', { v: money ? _hbM(last.M.y || 0) : _hbN(last.M.y || 0), a: label(last.b) });
        return lines.length ? { lines, counts, keys } : null; }
      /* where most of it sits: the busiest one or two neighbouring columns */
      let best = null;
      cols.forEach((c, i) => {
        const one = { i, j: i, y: c.y || 0, k: c.k };
        if (!best || one.y > best.y) best = one;
        const d = cols[i + 1];
        if (d){ const two = { i, j: i + 1, y: (c.y || 0) + (d.y || 0), k: c.k + d.k }; if (two.y > (best.y || 0) * 1.0001 && (d.y || 0) > 0 && (c.y || 0) > 0) best = two; }
      });
      if (best && best.y > 0){
        counts.add(best.k);
        const a = cols[best.i], b = cols[best.j];
        const fmt = v => money ? _hbM(v) : _hbN(v);
        const share = tot > 0 ? best.y / tot : 0;
        if (best.i !== best.j){
          say(share >= 0.5 ? 'hb_read_most_two' : 'hb_read_busiest_two', { x: { html: money ? `<b>${_hbE(fmt(best.y))}</b>` : `<b>${_hbE(_hbN(best.k))}</b>` },
            a: label(a.b), b: label(b.b), an: { html: hbReadDoor(a.k, a.dig, fmt(a.y || 0)) }, bn: { html: hbReadDoor(b.k, b.dig, fmt(b.y || 0)) } });
        } else say(share >= 0.5 ? 'hb_read_most_single' : 'hb_read_busiest_single', { x: { html: hbReadDoor(a.k, a.dig, fmt(a.y || 0)) }, a: label(a.b) });
      }
      /* the longest stretch with nothing in it */
      let run = 0, runAt = -1, cur = 0;
      cols.forEach((c, i) => { if (!c.k){ cur++; if (cur > run){ run = cur; runAt = i; } } else cur = 0; });
      if (run >= HB_READ_QUIET_RUN){ const from = cols[runAt - run + 1], to = cols[runAt];
        say('hb_read_quiet', { k: _hbN(run), u: units(run), a: label(from.b), b: label(to.b) }); }
      edges.forEach(e => { if (e.k){ const lo = /^lt:/.test(e.b), at = e.b.slice(3);
        say(lo ? 'hb_read_before' : 'hb_read_after', { n: { html: hbReadDoor(e.k, e.dig) }, a: label(at) }, e.k); } });
    } else {
      const ok = cols.filter(c => c.n >= HB_TREND_MIN_N && c.y != null && !c.sofar);
      say('hb_read_avg', { what: i18t('hb_ms_' + m), n: _hbN(counted), u: units(1) }, counted);
      if (ok.length){
        const hi = ok.reduce((a, c) => (c.y > a.y ? c : a)), lo = ok.reduce((a, c) => (c.y < a.y ? c : a));
        counts.add(hi.k); counts.add(lo.k);
        say('hb_read_avg_hi', { v: hbMeasureFmt(m, hi.y), a: label(hi.b), n: { html: hbReadDoor(hi.k, hi.dig) } }, hi.k);
        if (lo !== hi) say('hb_read_avg_lo', { v: hbMeasureFmt(m, lo.y), a: label(lo.b), n: { html: hbReadDoor(lo.k, lo.dig) } }, lo.k);
        const last = ok[ok.length - 1], all = ok.reduce((a, c) => a + c.y * c.n, 0) / Math.max(1, ok.reduce((a, c) => a + c.n, 0));
        if (last !== hi && last !== lo) say('hb_read_avg_last', { v: hbMeasureFmt(m, last.y), a: label(last.b), avg: hbMeasureFmt(m, all) });
      }
      const thin = cols.filter(c => c.hollow).length;
      if (thin) say('hb_read_thin', { k: _hbN(thin), u: units(thin), min: _hbN(HB_TREND_MIN_N) }, thin);
      if (R.left) { counts.add(R.left); say('hb_read_left', { n: _hbN(R.left) }, R.left); }
    }
    if (R.none){ counts.add(R.none);
      if (R.date === 'signed') say('hb_read_none_signed', { n: { html: hbReadDoor(R.none, R.noneDig) } }, R.none);
      else say('hb_read_none', { n: { html: hbReadDoor(R.none, R.noneDig) }, what: i18t('hb_dt_' + (R.date || 'end')) }, R.none); }
    if (R.unsigned){ counts.add(R.unsigned);
      if (R.unsignedV > 0) say('hb_read_unsigned_value', { n: _hbN(R.unsigned), v: _hbM(R.unsignedV) }, R.unsigned);
      else say('hb_read_unsigned', { n: _hbN(R.unsigned) }, R.unsigned); }
    return lines.length ? { lines, counts, keys } : null;
  }
  if ((P.pic === 'ring' || P.pic === 'bars' || P.pic === 'blocks') && P.split && P.split.by && P.split.by !== 'valueBand' && P.split.by !== 'none' && P.split.by !== 'date'){
    const field = P.split.by, expo = P.measure === 'exposure' && hbMoneyOk(), money = hbMoneyOk() && (P.pic === 'blocks' || P.measure === 'value' || expo);
    const rows = hbGroupsOf(cs, field, money);
    if (!rows.length) return null;
    /* exposure ranks by the money at risk, not by the money under contract */
    if (expo){ rows.forEach(r => { r.v = hbMeasure(r.list, 'exposure').y || 0; }); rows.sort((a, b) => b.v - a.v); }
    rows.forEach(r => counts.add(r.n));
    const tot = rows.reduce((a, r) => a + (money ? r.v : r.n), 0) || 1;
    const dig = r => 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + r.g;
    say('hb_read_groups', { n: _hbN(cs.length), k: _hbN(rows.length), by: hbSplitWord(P.split).toLowerCase() }, rows.length);
    /* the LARGEST first: hbGroupsOf keeps stages in stage order (the ring's
       own order), so "has the most" must be measured, never read off the top */
    const named = rows.filter(r => r.g).sort((a, b) => (money ? b.v - a.v : b.n - a.n));
    if (named.length){
      const top = named[0], pct = Math.round((money ? top.v : top.n) / tot * 100);
      say(expo ? 'hb_read_top_exposure' : money ? 'hb_read_top_value' : 'hb_read_top', { who: top.label, n: { html: hbReadDoor(top.n, dig(top)) }, v: _hbM(top.v), pct: _hbN(pct) }, top.n);
      if (named.length > 3){ const three = named.slice(0, 3), sum = three.reduce((a, r) => a + (money ? r.v : r.n), 0);
        counts.add(three.reduce((a, r) => a + r.n, 0));
        say('hb_read_top_three', { pct: _hbN(Math.round(sum / tot * 100)) }); }
    }
    const blank = rows.find(r => !r.g);
    if (blank){ counts.add(blank.n); say('hb_read_blank', { n: { html: hbReadDoor(blank.n, dig(blank)) }, what: blank.label }, blank.n); }
    return lines.length ? { lines, counts, keys } : null;
  }
  /* THE TIMELINE (Ending in 90 days, Past end date, a date question): when
     things end, read off the same end dates the pills are drawn from */
  if (P.pic === 'gantt'){
    const rows = cs.map(c => { const e = hbEndOf(c); return { c, e, d: e ? hbDaysTo(e) : null }; });
    const past = rows.filter(r => r.d != null && r.d < 0), soon = rows.filter(r => r.d != null && r.d >= 0 && r.d <= 90),
      later = rows.filter(r => r.d != null && r.d > 90), none = rows.filter(r => r.d == null);
    [past, soon, later, none].forEach(x => counts.add(x.length));
    if (soon.length){ const first = soon.slice().sort((a, b) => a.d - b.d)[0];
      say('hb_read_tl_soon', { n: _hbN(soon.length), ref: { html: hbReadCDoor(first.c) }, d: hbReadDay(first.e) }, soon.length); }
    if (past.length){ const old = past.slice().sort((a, b) => a.d - b.d)[0];
      say('hb_read_tl_past', { n: _hbN(past.length), a: hbReadMonth(old.e.slice(0, 7)) }, past.length); }
    if (later.length && (soon.length || past.length)) say('hb_read_tl_later', { n: _hbN(later.length) }, later.length);
    /* the busiest month, a door onto its own column of the timeline */
    const by = new Map(); rows.forEach(r => { if (r.e){ const k = r.e.slice(0, 7); by.set(k, (by.get(k) || 0) + 1); } });
    if (by.size >= 2){ const [bk, bn] = [...by.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))[0];
      if (bn >= 2){ counts.add(bn); say('hb_read_tl_busiest', { a: hbReadMonth(bk), x: { html: hbReadDoor(bn, 'qm:' + D.key + HB_KEY_SEP + 'm' + HB_KEY_SEP + bk) } }, bn); } }
    if (soon.length && typeof renewalWindow === 'function'){
      const open = soon.filter(r => { try { const w = renewalWindow(r.c); return !!w && !w.decided; } catch (_){ return false; } }).length;
      if (open){ counts.add(open); say('hb_read_tl_undecided', { n: _hbN(open) }, open); } }
    /* the ruby pills: past their end date and still standing as signed */
    const still = past.filter(r => r.c.status === 'Signed').length;
    if (still){ counts.add(still); say('hb_read_tl_still', { n: _hbN(still), stage: hbGroupLabel('status', 'Signed') }, still); }
    if (none.length) say('hb_read_tl_none', { n: _hbN(none.length) }, none.length);
    return lines.length ? { lines, counts, keys } : null;
  }
  return null;
}
/* one contract, as a door onto its card */
function hbReadCDoor(c){
  return `<button type="button" class="hb-read-n" data-hb-dig="c:${_hbE(c.id)}" title="${_hbE(hbRef(c) + ' · ' + String(c.name || '') + (c.counterparty ? ' · ' + c.counterparty : ''))}">${_hbE(hbRef(c))}</button>${c.counterparty ? ' (' + _hbE(c.counterparty) + ')' : ''}`;
}
/* a month in words, in full: "September 2026" */
function hbReadMonth(ym){
  try { return new Date(ym + '-01T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { month: 'long', year: 'numeric' }); } catch (_){ return String(ym); }
}
function hbReadDay(iso){
  try { return new Date(iso + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { day: 'numeric', month: 'long' }); } catch (_){ return String(iso); }
}
/* VALUE UNDER CONTRACT, and the Value panel: where the money (or, for a
   reader not shown values, the count) sits by stage; each stage a door */
function hbReadStagesOf(stages, money, left){
  const lines = [], counts = new Set();
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l) lines.push(l); };
  const live = (stages || []).filter(s => s.n > 0); if (!live.length) return null;
  const amt = s => money ? (s.v || 0) : s.n;
  const tot = live.reduce((a, s) => a + amt(s), 0);
  const word = s => (s.word ? i18t(s.word) : hbGroupLabel('status', s.k));
  const sorted = live.slice().sort((a, b) => amt(b) - amt(a));
  live.forEach(s => counts.add(s.n)); counts.add(live.reduce((a, s) => a + s.n, 0));
  const pct = s => _hbN(tot > 0 ? Math.round(amt(s) / tot * 100) : 0);
  const top = sorted[0];
  if (money && tot > 0){
    say('hb_read_val_top', { stage: word(top), v: _hbM(top.v || 0), pct: pct(top), n: { html: hbReadDoor(top.n, 'st:' + top.k) } }, top.n);
    sorted.slice(1).forEach(s => say('hb_read_val_stage', { stage: word(s), v: _hbM(s.v || 0), pct: pct(s), n: { html: hbReadDoor(s.n, 'st:' + s.k) } }, s.n));
  } else {
    say('hb_read_stage_top', { stage: word(top), pct: pct(top), n: { html: hbReadDoor(top.n, 'st:' + top.k) } }, top.n);
    sorted.slice(1).forEach(s => say('hb_read_stage_n', { stage: word(s), n: { html: hbReadDoor(s.n, 'st:' + s.k) } }, s.n));
  }
  if (money && left){ counts.add(left); say('hb_read_val_left', { n: _hbN(left) }, left); }
  return lines.length ? { lines, counts } : null;
}
/* THE SIX READY-MADE PANELS, ENLARGED: each read off the panel's own numbers
   (hbPanelData), saying what its own lines do not; every count a door the
   panel already has (f:overdue, cl:, cp:, mo:, pb:, po:, ex:, st:) */
function hbReadPanelOf(kind, d){
  const lines = [], counts = new Set(), facts = [];
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l) lines.push(l); };
  let ids = [];
  if (kind === 'obl'){
    const rows = d.rows || [];
    ids = [...new Set(rows.map(r => r.cid))];
    counts.add(ids.length);
    if (!rows.length) say('hb_read_obl_none', {});
    else {
      const worst = rows.slice().sort((a, b) => b.late - a.late)[0], c = hbContract(worst.cid);
      say('hb_read_obl_worst', { what: worst.what || '', ref: { html: c ? hbReadCDoor(c) : _hbE(worst.cid) }, d: _hbN(worst.late) }, worst.late);
      if (rows.length > 1) say('hb_read_obl_on', { n: _hbN(ids.length) }, ids.length);
      const by = new Map(); rows.forEach(r => { const w = r.who || ''; by.set(w, (by.get(w) || 0) + 1); });
      const nobody = by.get('') || 0; by.delete('');
      if (by.size){ const [who, k] = [...by.entries()].sort((a, b) => b[1] - a[1])[0]; if (k >= 2) say('hb_read_obl_who', { who, n: _hbN(k) }, k); }
      if (nobody) say('hb_read_obl_nobody', { n: _hbN(nobody) }, nobody);
      rows.slice(0, 20).forEach(r => { const c2 = hbContract(r.cid); facts.push(`- "${r.what || ''}" on ${c2 ? hbRef(c2) : r.cid}: ${r.late} days late, ${r.who || 'nobody assigned'}`); });
    }
  } else if (kind === 'fric'){
    ids = d.liveIds || [];
    [d.live, d.us, d.them].forEach(n => counts.add(n));
    if (!d.live) say('hb_read_fric_none', {});
    else {
      const t = (d.clauses || [])[0];
      if (t){ counts.add(t.n); say('hb_read_fric_clause', { what: t.label, n: { html: hbReadDoor(t.n, 'cl:' + t.label) } }, t.n); }
      const slow = (d.cps || []).slice().sort((a, b) => b.rounds - a.rounds)[0];
      if (slow && slow.rounds){ counts.add(slow.n); say('hb_read_fric_slow', { who: slow.name, r: (Math.round(slow.rounds * 10) / 10).toLocaleString(), n: { html: hbReadDoor(slow.n, 'cp:' + slow.name) } }, slow.n); }
      if (d.us && d.live) say('hb_read_fric_us', { pct: _hbN(Math.round(d.us / d.live * 100)) });
      (d.clauses || []).forEach(x => facts.push(`- clause "${x.label}": open in ${x.n} negotiations`));
      (d.cps || []).forEach(x => facts.push(`- ${x.name}: ${Math.round(x.rounds * 10) / 10} rounds on average, ${x.n} negotiations`));
    }
  } else if (kind === 'ren'){
    const rows = d.rows || [];
    ids = rows.map(r => r.id);
    counts.add(d.n); counts.add(d.open);
    if (!rows.length) say('hb_read_ren_none', {});
    else {
      const months = d.months || [];
      const full = months.filter(M => M.ids.length);
      const most = full.slice().sort((a, b) => b.ids.length - a.ids.length)[0];
      if (full.length >= 2 && most.ids.length >= 2){ const i = months.indexOf(most), M = months[i];
        let name = ''; try { name = new Date(M.y, M.m, 1).toLocaleDateString(langLocale(), { month: 'long' }); } catch (_){}
        counts.add(M.ids.length); say('hb_read_ren_month', { a: name, x: { html: hbReadDoor(M.ids.length, 'mo:' + i) } }, M.ids.length); }
      const first = rows[0], c = hbContract(first.id);
      if (c) say(first.decided ? 'hb_read_ren_first_done' : 'hb_read_ren_first_open', { ref: { html: hbReadCDoor(c) }, d: _hbN(first.days) }, first.days);
      /* past the day to decide, and still undecided: the date renewalWindow keeps */
      const missed = rows.filter(r => r.missed && !r.decided).length;
      if (missed){ counts.add(missed); say('hb_read_ren_missed', { n: _hbN(missed) }, missed); }
      rows.slice(0, 30).forEach(r => { const c2 = hbContract(r.id); facts.push(`- ${c2 ? hbRef(c2) : r.id}${c2 && c2.counterparty ? ' (' + c2.counterparty + ')' : ''}: ends in ${r.days} days, ${r.decided ? 'renewal decided' : 'no renewal decision'}${r.missed && !r.decided ? ', the date to decide has passed' : ''}`); });
    }
  } else if (kind === 'pay'){
    (d.sides || []).forEach(S => {
      const side = i18t('hb_pay_side_' + S.key);
      S.buckets.forEach(b => b.ids.forEach(id => ids.push(id)));
      counts.add(S.n); counts.add(S.over);
      if (!S.n) return;
      const most = S.buckets.slice().sort((a, b) => b.ids.length - a.ids.length)[0];
      if (most && most.ids.length){ counts.add(most.ids.length); say('hb_read_pay_most', { side, a: most.label, x: { html: hbReadDoor(most.ids.length, 'pb:' + S.key + ':' + most.i) } }, most.ids.length); }
      if (S.std == null) say('hb_read_pay_nostd', { side });
      else if (S.over) say('hb_read_pay_over', { side, n: { html: hbReadDoor(S.over, 'po:' + S.key) }, t: _hbN(S.n), pct: _hbN(Math.round(S.over / S.n * 100)) }, S.over);
      else say('hb_read_pay_within', { side });
      facts.push(`- ${side}: ${S.n} contracts, ${S.avg == null ? 'no average' : S.avg + ' days on average'}, standard ${S.std == null ? 'not set' : S.std}, ${S.over} over the standard; ` + S.buckets.map(b => `${b.label} days: ${b.ids.length}`).join(', '));
    });
    ids = [...new Set(ids)];
    if (!lines.length) say('hb_read_pay_none', {});
  } else if (kind === 'exp'){
    const rows = d.rows || [], hit = rows.filter(r => r.n > 0);
    hit.forEach(r => { counts.add(r.n); r.ids.forEach(id => ids.push(id)); });
    ids = [...new Set(ids)]; counts.add(ids.length);
    if (!hit.length) say('hb_read_exp_none', {});
    else {
      const t = hit[0];
      say('hb_read_exp_top', { what: t.title, n: { html: hbReadDoor(t.n, 'ex:' + t.k) } }, t.n);
      if (hit.length > 1) say('hb_read_exp_spread', { k: _hbN(hit.length), n: _hbN(ids.length) }, ids.length);
      const clear = rows.length - hit.length;
      if (clear) say('hb_read_exp_clear', { k: _hbN(clear) }, clear);
      rows.forEach(r => facts.push(`- "${r.title}": ${r.n} contracts`));
    }
  } else if (kind === 'val'){
    const R = hbReadStagesOf(d.stages, d.money, 0);
    (d.stages || []).forEach(s => s.ids.forEach(id => ids.push(id)));
    (d.stages || []).forEach(s => facts.push(`- ${s.k}: ${s.n} contracts${d.money ? ', ' + _hbM(s.v || 0) : ''}`));
    if (R){ R.lines.forEach(l => lines.push(l)); R.counts.forEach(n => counts.add(n)); }
  }
  return lines.length ? { lines, counts, ids, facts } : null;
}
/* the chart's identity for a kept answer: what it asked and what it counted */
function hbWhySigOf(tag, cs){
  let h = 5381; const ids = cs.map(c => c.id).sort().join(',');
  for (let i = 0; i < ids.length; i++) h = ((h * 33) ^ ids.charCodeAt(i)) >>> 0;
  return tag + ':' + cs.length + ':' + h.toString(36);
}
function hbWhySig(D, P, cs){
  const more = ['split2', 'sort', 'top', 'window', 'compare'].filter(k => P[k] != null).map(k => [k, P[k]]);
  return hbWhySigOf(JSON.stringify([P.pic, P.split, P.measure].concat(more.length ? [more] : [])), cs);
}
function hbWhyKept(key, sig){
  const w = (hbS().why || {})[key];
  return w && w.day === hbToday() && w.sig === sig ? w : null;
}
/* WHAT A READING STANDS ON, for any enlarged card: a chart's list (its key),
   Value under contract (f:value), or a ready-made panel (hp:<kind>). The one
   place the reading, the contracts behind it and what Copilot is shown are
   worked out, so the drawn box and the asked question never differ. */
function hbReadSrc(key){
  const lens = hbS().lens;
  if (/^pk:\w+$/.test(String(key || ''))) return hbPackSrc(key, lens);
  if (key === HB_BOARD_KEY) return hbBoardSrc(lens);
  const pk = /^hp:(\w+)$/.exec(String(key || ''));
  if (pk){
    if (!HB_KINDS[pk[1]]) return null;
    const r = hbReadPanelOf(pk[1], hbPanelData(pk[1], lens)); if (!r) return null;
    const cs = r.ids.map(id => hbContract(id)).filter(Boolean), title = i18t(HB_KINDS[pk[1]].word);
    return { key, title, head: `A panel on the HaTi Home board: "${title}".`, data: r.facts.length ? ['Its numbers:', ...r.facts] : [], reading: r, cs, sig: hbWhySigOf('panel:' + pk[1], cs) };
  }
  const D = hbDigData(key, lens); if (!D) return null;
  const title = hbCrumbOf(key, lens);
  if (D.kind === 'stages'){
    const r = hbReadStagesOf(D.stages, D.money, D.left); if (!r) return null;
    const cs = hbListOf([].concat(...D.stages.map(s => s.ids)), lens);
    return { key, title, head: `A chart on the HaTi Home board: "${title}", by stage.`, reading: r, cs, sig: hbWhySigOf('stages', cs),
      data: ['Stages (stage: contracts' + (D.money ? ', value' : '') + '):', ...D.stages.map(s => `- ${s.k}: ${s.n}${D.money ? ', ' + _hbM(s.v || 0) : ''}`)] };
  }
  if (D.kind !== 'list') return null;
  return hbReadOfList(D, key, title, lens);
}
/* a list's reading as Copilot is shown it: the same run the card draws (the
   analyst's steps use it too, hbDdCalc) */
function hbReadOfList(D, key, title, lens){
  const P = hbPlan(D);
  /* the same run the card draws: the period cut, then the picture */
  const run = P.pic === 'list' ? { R: null, cs: hbWinCs(hbListOf(D.ids, lens), D) } : hbChartRun(D, hbListOf(D.ids, lens), P);
  const cs = run.cs, R = run.R;
  const r = hbReadingOf(D, cs, P, R); if (!r) return null;
  const data = [];
  if (R && Array.isArray(R.cols)){
    const unit = R.unit || 'm';
    data.push('Columns (label: value, contracts):');
    (R.edges || []).filter(e => /^lt:/.test(e.b)).forEach(e => data.push(`- before ${hbBucketLabel(e.b.slice(3), unit, false)}: ${e.k}`));
    R.cols.forEach(c => data.push(`- ${hbBucketLabel(c.b, unit, false)}: ${c.y == null ? '—' : Math.round(c.y * 10) / 10}, ${c.k}`));
    (R.edges || []).filter(e => /^gt:/.test(e.b)).forEach(e => data.push(`- after ${hbBucketLabel(e.b.slice(3), unit, false)}: ${e.k}`));
  }
  if (R && R.cmp){
    data.push(`Compared (row: this period value, contracts | ${R.cmp.word.toLowerCase()} value, contracts):`);
    R.cmp.rows.slice(0, 24).forEach(x => data.push(`- ${x.label}: ${x.cy == null ? '—' : Math.round(x.cy * 10) / 10}, ${x.ck} | ${x.py == null ? '—' : Math.round(x.py * 10) / 10}, ${x.pk}`));
  }
  if (R && Array.isArray(R.cells) && P.split2){
    data.push('Cells (across · down: value, contracts):');
    (P.pic === 'heat' ? R.cells.map(x => `- ${x.a} · ${x.b}: ${x.y == null ? '—' : Math.round(x.y * 10) / 10}, ${x.k}`)
      : R.cells.flatMap(x => x.parts.filter(p => p.k).map(p => `- ${x.label} · ${p.label}: ${p.y == null ? '—' : Math.round(p.y * 10) / 10}, ${p.k}`))).slice(0, 60).forEach(l => data.push(l));
  }
  if (P.pic === 'gantt'){
    data.push('End dates (contract: ends):');
    cs.slice(0, HB_WHY_IDS).forEach(c => { const e = hbEndOf(c); data.push(`- ${hbRef(c)}${c.counterparty ? ' (' + c.counterparty + ')' : ''}: ${e || 'no end date'}, ${c.status || ''}`); });
  }
  return { key, title, head: `A chart on the HaTi Home board: "${title}". Picture: ${hbPicWord(P)}; split: ${hbSplitWord(P.split)}${P.split2 ? '; then by: ' + hbSplitWord(P.split2) : ''}; measure: ${i18t('hb_ms_' + P.measure)}${P.window ? '; period: ' + hbWinWord(P.window) : ''}${P.compare ? '; compared ' + i18t('hb_cmp_' + P.compare).toLowerCase() : ''}${P.top ? '; top ' + P.top : ''}.`,
    data, reading: r, cs, sig: hbWhySig(D, P, cs) };
}
/* what Copilot is shown: the card's own numbers, HaTi's reading, and the
   contracts behind it (a cap is said) */
function hbWhyPrompt(src){
  const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const out = [src.head, ...(src.data || [])];
  if (src.reading) out.push('What HaTi already told the reader:', ...src.reading.lines.map(l => '- ' + plain(l)));
  const cs = src.cs, ids = cs.slice(0, HB_WHY_IDS).map(c => (typeof contractRef === 'function') ? contractRef(c) : c.id);
  out.push(`The contracts behind it (${cs.length}${cs.length > HB_WHY_IDS ? `, the first ${HB_WHY_IDS} listed` : ''}): ${ids.join(', ')}.`);
  out.push(`Question: what could explain this pattern, and what is worth checking next? Do not repeat what HaTi already said. Answer in at most three short sentences, in ${i18t('hb_cx_lang')}. Use only counts shown above or found with your tools; name contracts by their reference.`);
  return out.join('\n');
}
/* WHAT THE BOARD SHOWS, IN WORDS (Young, 4 Oct 2026: asked in the panel "why
   does the dashboard say 851 SEK when we have over 1 billion", Copilot
   answered "Nothing changed on the map … likely points to a single
   contract's value or a filtered subset" — it had never been shown the
   board). A question asked while the Board is up goes to Copilot with this:
   Your book's figures, what the board is counting, the open card — its set,
   its picture, its headline, its columns, its trend sentence (said to be the
   ends of a fitted line, not totals), what it leaves off and HaTi's reading
   — and the panels on the board. Built from the same readings the board
   draws, so it can never describe a different board. Nothing on the Explorer
   side, where the map is the screen. */
const HB_BOARD_NOW_MAX = 4000;
/* A RECIPE IN COPILOT'S WORDS (the server's mirror reads these same words
   back): what the board's settings are, so "this" can be changed exactly */
const HB_SPLIT_WORDS = { status: 'stage', folder: 'stream', counterparty: 'counterparty', owner: 'owner', kind: 'type', side: 'side', payterms: 'payterms', valueBand: 'valueBand', move: 'move', rounds: 'rounds', overdue: 'overdue', decision: 'decision', risks: 'risks', standards: 'standards', liabcap: 'liabcap', autorenew: 'autorenew', priceup: 'priceup' };
const HB_UNIT_WORDS = { m: 'month', q: 'quarter', y: 'year' };
function hbSplitModelWord(S){ return !S ? 'none' : S.by === 'date' ? `${HB_UNIT_WORDS[S.unit] || 'month'} (date ${S.date})` : (HB_SPLIT_WORDS[S.by] || S.by); }
function hbRecipeWords(P){
  const more = [];
  if (P.split2) more.push('split2=' + hbSplitModelWord(P.split2));
  if (P.sort) more.push(`sort=${P.sort.by} ${P.sort.dir}`);
  if (P.top) more.push('top=' + P.top);
  if (P.window) more.push('window=' + (P.window.last ? `last ${P.window.last} ${HB_UNIT_WORDS[P.window.unit || 'm']}` : P.window.next ? `next ${P.window.next} ${HB_UNIT_WORDS[P.window.unit || 'm']}` : `${P.window.from || '…'} to ${P.window.to || '…'}`) + ` (date ${P.window.date || 'end'})`);
  if (P.compare) more.push('compare=' + P.compare + (P.compare === 'range' && P.window && P.window.vs ? ` (against ${P.window.vs.from} to ${P.window.vs.to})` : ''));
  if (P.title) more.push(`title="${P.title}"`);
  if (P.show) more.push('show=' + P.show);
  return `pic=${P.pic}; split=${hbSplitModelWord(P.split)}; measure=${P.measure}; trend=${P.trend ? 'on' : 'off'}.` + (more.length ? ' Also: ' + more.join('; ') + '.' : '');
}
function hbBoardNow(){
  const s = hbS(); if (s.face !== 'board') return '';
  const plain = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
  const out = [];
  const B = hbBookData(s.lens), money = B.money, F = B.figs;
  out.push(`Your book (the six figures at the top): ${F.live.n} live contracts${money ? `; ${_hbM(F.value.v)} value under contract (all live contracts, every stage)` : ''}; ${F.ending.n} ending in 90 days; ${F.past.n} past their end date; ${F.overdue.n} obligations overdue; ${F.us.n} waiting on us. By stage: ${B.stages.map(x => `${x.k} ${x.n}${money ? ' (' + _hbM(x.v || 0) + ')' : ''}`).join(', ')}.`);
  if (s.lens !== 'all') out.push(`Side shown: ${i18t('hb_lens_' + s.lens)}.`);
  const lab = hbCountLabel(s.lens); if (lab) out.push(`The board is counting only: ${lab}.`);
  const path = s.path || [], key = path[path.length - 1];
  const D = key ? hbDigData(key, s.lens) : null;
  if (D){
    out.push(`Open card: "${hbCrumbOf(key, s.lens)}"${s.digBig ? ' (enlarged)' : ''}.`);
    if (D.kind === 'list'){
      const cs0 = hbListOf(D.ids, s.lens), P = hbPlan(D);
      out.push(`Its set: ${cs0.length} contracts${money ? ', ' + _hbM(hbValueOf(cs0).v) : ''}${D.whole ? ' (the whole book)' : ''}. Picture: ${hbPicWord(P)}; split: ${hbSplitWord(P.split)}${P.split2 ? '; then by: ' + hbSplitWord(P.split2) : ''}; measure: ${i18t('hb_ms_' + P.measure)}${P.trend ? '; trend line on' : ''}.`);
      /* the open chart's settings in the words chart{} takes, so "this" can be changed exactly */
      out.push(`Open chart settings (chart{} words): ${hbRecipeWords(P)}`);
      if (P.pic !== 'list' && P.measure !== 'live'){
        const { R, cs } = hbChartRun(D, cs0, P), unit = R.unit || 'm';
        if (R.lead) out.push(`Headline over the chart: ${plain(R.lead)} (what is drawn).`);
        const cols = (R.cols || []).filter(c => c.k);
        if (cols.length) out.push('Columns (label: ' + i18t('hb_ms_' + P.measure).toLowerCase() + ', contracts): ' + cols.slice(-24).map(c => `${hbBucketLabel(c.b, unit, false)}: ${hbMeasureFmt(P.measure, c.y)}, ${c.k}`).join('; ') + '.');
        if (R.cmp) out.push(`Compared: this period ${hbMeasureFmt(P.measure, R.cmp.cur.y)} (${R.cmp.cur.k} contracts) against ${R.cmp.word.toLowerCase()} ${hbMeasureFmt(P.measure, R.cmp.prev.y)} (${R.cmp.prev.k} contracts).`);
        if (R.say) out.push(`Trend sentence: "${R.say}" — the two ends of a straight line fitted through the columns, per ${i18tn('hb_tr_units_' + unit, 1, { n: 1 })}; they are not totals and not what the book holds.`);
        if (R.note) out.push(`Said under the chart: ${R.note}`);
        const r = hbReadingOf(D, cs, P, R); if (r) out.push('HaTi\'s reading: ' + r.lines.map(plain).join(' '));
      } else {
        const r = hbReadingOf(D, hbWinCs(cs0, D), P, null); if (r) out.push('HaTi\'s reading: ' + r.lines.map(plain).join(' '));
      }
    } else if (D.kind === 'stages'){
      const r = hbReadStagesOf(D.stages, D.money, D.left); if (r) out.push('HaTi\'s reading: ' + r.lines.map(plain).join(' '));
    }
  }
  /* every card with the ref Copilot's actions name it by (work order Part 2) */
  if (s.panels.length) out.push('Cards on the board, top first (ref: name — settings): ' + s.panels.slice().reverse().map(p => {
    if (p.kind !== 'view') return `${p.id}: ${hbPanelWord(p)} (a ready-made panel; it can be moved, sized or removed, not changed)`;
    const Dp = hbDigData(p.key, s.lens); return `${p.id}: ${hbPanelWord(p)}${Dp ? ' — ' + Dp.n + ' contracts; ' + hbRecipeWords(hbPlan(Dp)) : ''}`; }).join(' | ') + (key ? ' The open chart is ref "open".' : ''));
  else if (key) out.push('No cards on the board yet. The open chart is ref "open".');
  const text = out.join('\n');
  return text.length > HB_BOARD_NOW_MAX ? text.slice(0, HB_BOARD_NOW_MAX) + ' …(cut)' : text;
}
/* ============================================================
   A DATA GUIDE FOR COPILOT (work order Part 3, 4 Oct 2026: "Copilot picks
   fields that actually work")
   ============================================================
   For every field a recipe can use: what it means, how many contracts carry
   it (a count and a share — "signing date: 22 of 24 signed have one"), the
   range for dates and money, the top values for a group (at most
   HB_GUIDE_TOP, then how many more), and the live / drafting / signed split.
   Every count is the board's own reading (hbDateOf, hbGroupOf, hbMeasureOne,
   hbValueOfOne), so the guide cannot describe a different book. Money only
   for a reader who may see it (canViewValues); a stream outside
   visibleFolders is never named. It rides with every board question beside
   hbBoardNow, capped at HB_GUIDE_MAX characters — A CAP IS A FACT, said. */
const HB_GUIDE_TOP = 8, HB_GUIDE_MAX = 3000;
function hbDataGuide(lens, max){
  const cs = hbBook(lens || 'all'), money = hbMoneyOk(), n = cs.length;
  const lim = max || HB_GUIDE_MAX;
  const pct = (k, t) => t ? Math.round(k / t * 100) + '%' : '0%';
  const signed = cs.filter(c => c.status === 'Signed'), live = cs.filter(c => c.status !== 'Declined');
  const by = st => cs.filter(c => c.status === st).length;
  const lines = [`Data guide — what each field holds over the ${n} contracts on this board (use fields that are filled; HaTi counts, the guide is not for quoting):`];
  lines.push(`- Stage (split stage): ${HB_STATUS_ORDER.map(st => `${st} ${by(st)}`).join(', ')}. Live ${live.length} · drafting ${by('Draft')} · signed ${signed.length}.`);
  const DATES = [['end', 'End date (expiry)', live, 'live'], ['signed', 'Signing date', signed, 'signed'], ['start', 'Start date', live, 'live'],
    ['created', 'Created date', cs, 'all'], ['decision', 'Renewal decision date', live, 'live']];
  DATES.forEach(([k, word, base, of]) => {
    const ds = base.map(c => hbDateOf(c, k)).filter(Boolean).sort();
    lines.push(`- ${word} (date ${k}): ${ds.length} of ${base.length} ${of} have one (${pct(ds.length, base.length)})${ds.length ? `; from ${ds[0].slice(0, 7)} to ${ds[ds.length - 1].slice(0, 7)}` : ''}.`);
  });
  /* the streams this reader may open, by name; any other is never named */
  const okFolder = (() => { try { const v = (typeof visibleFolders === 'function') ? visibleFolders() : null; return v ? new Set(v.map(f => f.name)) : null; } catch (_){ return null; } })();
  const GROUPS = [['folder', 'Stream (split stream)'], ['counterparty', 'Counterparty (split counterparty)'], ['owner', 'Owner (split owner)'], ['kind', 'Type (split type)'], ['side', 'Side (split side)'], ['payterms', 'Payment terms (split payterms — a pie of payment terms; a ring never draws measure payDays)'],
    ['move', 'Whose move in the negotiation (split move)'], ['rounds', 'Negotiation rounds (split rounds)'], ['overdue', 'Has overdue duties (split overdue)'], ['decision', 'Renewal decision quarter (split decision)'], ['risks', 'Open risks found (split risks)'], ['standards', 'Against our standards — off, met or not checked (split standards)'],
    ['liabcap', 'Liability cap, as the wording says — capped, uncapped, unclear or not read (split liabcap)'], ['autorenew', 'Renews by itself, as the wording says (split autorenew)'], ['priceup', 'Price increases, as the wording says — at will, indexed, fixed, none (split priceup)']];
  GROUPS.forEach(([f, word]) => {
    const rows = hbGroupsOf(cs, f, false);
    const named = rows.filter(r => r.g && !(f === 'folder' && okFolder && !okFolder.has(r.g)));
    const blank = rows.filter(r => !r.g).reduce((a, r) => a + r.n, 0);
    const hidden = rows.filter(r => r.g && f === 'folder' && okFolder && !okFolder.has(r.g)).reduce((a, r) => a + r.n, 0);
    const top = named.slice().sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label))).slice(0, HB_GUIDE_TOP);
    const more = named.length - top.length;
    lines.push(`- ${word}: ${named.length} groups; ${top.map(r => `${r.label} ${r.n}`).join(', ')}${more > 0 ? ` (+${more} more)` : ''}${blank ? `; ${blank} with none on record` : ''}${hidden ? `; ${hidden} in streams this reader cannot open` : ''}.`);
  });
  if (money){
    const vs = cs.map(hbValueOfOne).filter(v => v > 0).sort((a, b) => a - b);
    lines.push(`- Value (measure value; split valueBand): ${vs.length} of ${n} carry one (${pct(vs.length, n)})${vs.length ? `; from ${_hbM(vs[0])} to ${_hbM(vs[vs.length - 1])}` : ''}. Also measure avgValue (average) and medianValue (median).`);
  } else lines.push('- Value: not shown to this reader — do not use measure value or split valueBand.');
  const mk = m => cs.filter(c => { const v = hbMeasureOne(c, m); return v != null && isFinite(v); }).length;
  if (money) lines.push(`- Risk exposure (measure exposure: value weighted by the worst open risk): ${mk('exposure')} of ${n} have their risks read.`);
  lines.push(`- Days to sign (measure daysToSign): ${mk('daysToSign')} contracts have both a created and a signing date. Also measure medianDaysToSign (the median days to sign).`);
  lines.push(`- Payment days (measure payDays): ${mk('payDays')} contracts state payment terms.`);
  lines.push(`- Negotiation rounds (measure rounds): ${mk('rounds')} contracts have rounds on record.`);
  lines.push(`- Live contracts each month (measure live): ${(_hbSnaps || []).length} monthly pictures kept so far.`);
  lines.push('- show: running = a running total over time; share = each group as a share of the total. The renewal decision date (date decision) is the ACT-BY date: the end date minus the notice period.');
  { const vg = hbVerifiedGuide(); if (vg) lines.push(vg); }
  { const wg = hbWordsGuide(); if (wg) lines.push(wg); }
  /* A CAP IS A FACT: what did not fit is said */
  let out = '', left = 0;
  for (const l of lines){ if ((out + l).length + 60 > lim){ left++; continue; } out += (out ? '\n' : '') + l; }
  if (left) out += `\n(${left} more lines of the guide were left out to keep it short.)`;
  return out;
}
/* ============================================================
   THE FACT SHEET AND THE SAFE SUMMARY (Young, 5 Oct 2026, "HaTi Board:
   Charts That Explain", recommendation 2)
   ============================================================
   For every answer HaTi writes a FACT SHEET in one fixed format: the card's
   totals, HaTi's own reading, the numbers drawn, the contracts behind it and
   what is NOT known (risks not read, contracts never checked against our
   standards). Copilot turns it into three or four plain sentences — what it
   shows, why it matters, what to do — and ANY sentence carrying a number that
   is not on the fact sheet is removed (hbFactCheck), so the words can never
   contradict the chart. The sheet is HaTi's arithmetic; Copilot writes only
   on a press, its cost beside the button. */
const HB_FACT_MAX = 6000;
function hbFactPlain(h){ return String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim(); }
/* COVERAGE: how much of a set HaTi could read — said on every sheet, so "no
   breaches" can never mean "nothing checked" */
function hbCoverageOf(cs){
  const n = cs.length;
  const read = cs.filter(c => hbRiskWeightOf(c) != null).length;
  const checked = cs.filter(c => hbStdStateOf(c) !== 'unchecked').length;
  const terms = cs.filter(c => !!hbKeyTermsOf(c)).length;
  return { n, read, checked, terms };
}
function hbFactSheet(src){
  if (!src) return null;
  const cs = src.cs || [], money = hbMoneyOk();
  const lines = [`FACT SHEET — ${src.title || ''}`];
  if (src.head) lines.push(src.head);
  lines.push(`- Contracts on this card: ${cs.length}`);
  if (money){ const v = cs.reduce((a, c) => a + hbValueOfOne(c), 0); if (v > 0) lines.push(`- Value under contract: ${_hbM(v)}`); }
  if (src.reading && src.reading.lines) src.reading.lines.forEach(l => lines.push('- HaTi read: ' + hbFactPlain(l)));
  (src.data || []).forEach(l => lines.push(String(l)));
  (src.extra || []).forEach(l => lines.push(String(l)));
  const cov = hbCoverageOf(cs);
  lines.push(`- Coverage: risks read on ${cov.read} of ${cov.n} (${cov.n - cov.read} not read); checked against our standards: ${cov.checked} of ${cov.n} (${cov.n - cov.checked} never checked).`);
  if (cov.terms) lines.push(`- Key terms read from the wording (liability cap, renewal, price increases): ${cov.terms} of ${cov.n}.`);
  const refs = cs.slice(0, HB_WHY_IDS).map(c => hbRef(c));
  lines.push(`- Contracts behind it (${cs.length}${cs.length > HB_WHY_IDS ? `, the first ${HB_WHY_IDS} listed` : ''}): ${refs.join(', ')}`);
  let text = lines.join('\n');
  if (text.length > HB_FACT_MAX) text = text.slice(0, HB_FACT_MAX) + '\n(The fact sheet was cut here to keep it short.)';
  return { text, nums: hbNumsOf(text), coverage: cov };
}
/* every number written on a sheet, as its digits alone ("SEK 1.06B" → 106,
   "59%" → 59, "1 234" → 1234): what a sentence may say */
function hbNumsOf(text){
  const out = new Set();
  const put = d => { if (d) { out.add(d); out.add(String(Number(d))); } };
  (String(text || '').match(/\d(?:[\d\u00a0 ,.]*\d)?/g) || []).forEach(t => { put(t.replace(/\D/g, '')); hbNumPieces(t).forEach(put); });
  return out;
}
/* a run like "11 and 14, 25" or "Jul 2026: 11, 11" is several numbers: its
   pieces, split at a space or a comma-and-space, each as digits */
function hbNumPieces(t){ return String(t || '').split(/[\u00a0 ]+|,\s+/).map(x => x.replace(/\D/g, '')).filter(Boolean); }
/* A SENTENCE WITH A NUMBER THE SHEET DOES NOT HOLD IS REMOVED, and how many
   were removed is said */
function hbFactCheck(text, nums){
  const sentences = String(text || '').replace(/\r/g, '').split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9*"(])/);
  let dropped = 0;
  const kept = sentences.filter(snt => {
    const ts = snt.match(/\d(?:[\d\u00a0 ,.]*\d)?/g) || [];
    const has = d => nums.has(d) || nums.has(String(Number(d)));
    for (const t of ts){ const d = t.replace(/\D/g, ''); if (d && !has(d) && !hbNumPieces(t).every(has)){ dropped++; return false; } }
    return true;
  });
  return { text: kept.join(' ').trim(), dropped };
}
function hbSummaryPrompt(sheet, ask){
  return [sheet.text, '',
    ask || `Write three or four plain sentences, in ${i18t('hb_cx_lang')}, for a business owner: what this shows, why it matters, and what to do next.`,
    'Use ONLY numbers that appear on the fact sheet, written exactly as they appear there; never work out a new number (no new totals, percentages, differences or dates). Name contracts by their reference. If the coverage line says some contracts were not read or not checked, say the picture may be incomplete. Do not repeat the sheet line by line.'].join('\n');
}
/* THE COUNT IS HATI'S: a sentence stating a number of contracts this chart
   does not hold is left out, and how many were left out is said */
function hbWhyCheck(text, counts){
  const sentences = String(text || '').replace(/\r/g, '').split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9*"(])/);
  let dropped = 0;
  const kept = sentences.filter(snt => {
    const re = /\b(\d[\d,.\s]*?)\s+(?:of\s+(?:the|them|these|those|your|our)\s+)?(?:[\p{L}-]+\s+){0,2}?(?:contracts?|agreements?|avtal(?:en)?)\b/giu;
    let m; while ((m = re.exec(snt))){ const n = Number(String(m[1]).replace(/[^\d]/g, '')); if (isFinite(n) && !counts.has(n)){ dropped++; return false; } }
    return true;
  });
  return { text: kept.join(' ').trim(), dropped };
}
async function hbWhyAsk(key){
  const src = hbReadSrc(key); if (!src) return;
  if (_hbWhyBusy.has(key)) return;
  if (!(typeof copilotAvailable === 'function' && copilotAvailable())){ _hbWhyErr.set(key, i18t('hb_cx_nokey')); hbPaintBoard(); return; }
  _hbWhyBusy.add(key); _hbWhyErr.delete(key); hbPaintBoard();
  try {
    /* the safe summary: written from HaTi's fact sheet, every number checked */
    const sheet = hbFactSheet(src);
    const res = await copilotAsk([{ role: 'user', content: hbSummaryPrompt(sheet, key === HB_BOARD_KEY ? i18t('hb_bs_ask', { lang: i18t('hb_cx_lang') }) : null) }], { view: 'intel' }, null, { quiet: true });
    const cov = sheet.coverage, counts = new Set([...src.reading.counts, cov.n, cov.read, cov.checked, cov.n - cov.read, cov.n - cov.checked]);
    const c1 = hbWhyCheck(res && res.answer, counts), c2 = hbFactCheck(c1.text, sheet.nums);
    const chk = { text: c2.text, dropped: c1.dropped + c2.dropped };
    const s = hbS(); s.why = s.why || {};
    delete s.why[key];
    s.why[key] = { day: hbToday(), sig: src.sig, text: chk.text.slice(0, 4000), dropped: chk.dropped,
      at: new Date().toTimeString().slice(0, 5), notice: res && res.notice ? String(res.notice).slice(0, 300) : '' };
    const ks = Object.keys(s.why); if (ks.length > HB_WHY_KEEP) delete s.why[ks[0]];
    hbSave();
    if (!chk.text) _hbWhyErr.set(key, i18t('hb_cx_empty'));
  } catch (e){
    _hbWhyErr.set(key, e && e.needsKey ? i18t('hb_cx_nokey') : i18t('hb_cx_failed', { why: String((e && e.message) || e || '').slice(0, 160) }));
  } finally { _hbWhyBusy.delete(key); hbPaintBoard(); }
}
/* the follow-up goes to the panel on the page: an enlarged dig-in steps aside
   (an enlarged panel never covers the panel, so it stays as it is) */
function hbWhyFollow(key){
  const s = hbS(); const src = hbReadSrc(key);
  if (s.digBig && !/^hp:/.test(key)){ s.digBig = false; hbSave(); hbPaintBoard(); }
  hbAskInPanel(i18t('hb_cx_follow_q', { what: src ? src.title : hbCrumbOf(key, s.lens) }));
}
/* teal: HaTi's reading. amber: Copilot's answer, under it. ONE builder for
   every enlarged card: a chart, Value under contract, a ready-made panel. */
function hbReadBlockHtml(key, reading, n, sig){
  if (!reading) return '';
  const kept = hbWhyKept(key, sig), busy = _hbWhyBusy.has(key), err = _hbWhyErr.get(key);
  const live = typeof copilotAvailable === 'function' && copilotAvailable();
  const read = `<div class="hb-read"><div class="hb-read-h"><span>${_hbE(i18t('hb_read_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_read_src'))}</span></div>
    <ul>${reading.lines.map(l => `<li>${l}</li>`).join('')}</ul></div>`;
  const ask = kept && !err ? '' : `<div class="hb-why-ask"><button type="button" class="hb-btn" data-hb-why="${_hbE(key)}"${busy ? ' disabled' : ''}${live ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t(err ? 'hb_cx_again' : 'hb_cx_btn'))}</button>
    <span class="hb-quiet">${_hbE(live ? i18tn('hb_cx_cost', n, { n: _hbN(n) }) : i18t('hb_cx_nokey'))}</span></div>`;
  let box = '';
  if (busy) box = `<div class="hb-why" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span></div><p class="hb-quiet">${_hbE(i18t('hb_cx_busy'))}</p></div>`;
  else if (err) box = `<div class="hb-why is-err" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span></div><p>${_hbE(err)}</p></div>`;
  else if (kept) box = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: kept.at }))}</span></div>
    <div class="hb-why-b">${(typeof aiRichText === 'function') ? aiRichText(kept.text) : _hbE(kept.text)}</div>
    <div class="hb-why-f"><span class="${kept.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(kept.dropped ? i18tn('hb_cx_dropped', kept.dropped, { n: kept.dropped }) : i18t('hb_cx_ok'))}</span>${kept.notice ? `<span>${_hbE(kept.notice)}</span>` : ''}<span class="hb-grow"></span>
      <button type="button" class="hb-link" data-hb-why-follow="${_hbE(key)}">${_hbE(i18t('hb_cx_follow'))}</button></div></div>`;
  return read + ask + box;
}
/* a chart: drawn with the columns it already worked out */
function hbReadHtml(D, cs, P, R){
  return hbReadBlockHtml(D.key, hbReadingOf(D, cs, P, R), cs.length, hbWhySig(D, P, cs));
}
/* Value under contract, and a ready-made panel: read through hbReadSrc */
function hbReadSrcHtml(key){
  const src = hbReadSrc(key);
  return src ? hbReadBlockHtml(key, src.reading, src.cs.length, src.sig) : '';
}
/* ============================================================
   HEADLINE: THE CHART'S POINT ON THE SMALL CARD (Young picked "Headline",
   5 Oct 2026, "Chart Reading Options")
   ============================================================
   Every chart card on Home says its main point in ONE line, right under its
   totals, without a press: the first sentence of HaTi's own reading that is
   not the totals said again (HB_HEAD_SKIP; the stage and panel readings have
   no totals line and lead with their point). It is the same reading the
   enlarged card prints — one function, never a second counting — so it costs
   nothing and its numbers are the same doors. "Read more" opens the whole
   reading inside the same card (the label turns to "Show less"), with "What
   could explain this?" in it exactly as on the enlarged card: Copilot runs
   only on that press, its cost beside the button. Which cards are open is a
   fact about this sitting (_hbReadOpen), never stored. Enlarging works as
   before: the full reading is already open there. */
const HB_HEAD_SKIP = new Set(['hb_read_value', 'hb_read_exposure', 'hb_read_counted', 'hb_read_signed', 'hb_read_groups', 'hb_read_two', 'hb_read_avg', 'hb_read_window', 'hb_read_topn']);
const _hbReadOpen = new Set();
function hbHeadlineOf(reading){
  if (!reading || !Array.isArray(reading.lines) || !reading.lines.length) return '';
  const ks = Array.isArray(reading.keys) ? reading.keys : [];
  const i = ks.findIndex(k => !HB_HEAD_SKIP.has(k));
  return reading.lines[i >= 0 ? i : 0];
}
function hbHeadlineHtml(key, reading, n, sig){
  const line = hbHeadlineOf(reading);
  if (!line) return '';
  const open = _hbReadOpen.has(key);
  return `<div class="hb-head-line"><p>${line}</p><button type="button" class="hb-link hb-head-more" data-hb-read-more="${_hbE(key)}" aria-expanded="${open}">${_hbE(i18t(open ? 'hb_head_less' : 'hb_head_more'))}</button></div>`
    + (open ? hbReadBlockHtml(key, reading, n, sig) : '');
}
function hbReadSrcHeadHtml(key){
  const src = hbReadSrc(key);
  return src ? hbHeadlineHtml(key, src.reading, src.cs.length, src.sig) : '';
}
function hbReadMoreToggle(key){
  if (!key) return;
  if (_hbReadOpen.has(key)) _hbReadOpen.delete(key); else _hbReadOpen.add(key);
  hbPaintBoard();
}

function hbDigBodyHtml(D, lens, big){
  if (D.kind === 'pack') return hbPackHtml(D, lens, big);
  if (D.kind === 'analyst') return hbDdCardHtml(D);
  if (D.kind === 'list'){
    const cs = hbListOf(D.ids, lens);
    const fig = D.fig || '';
    const label = D.crumb || (D.word ? i18t(D.word) : '');
    const lead = fig ? `<div class="hb-say">${_hbE(i18tn('hb_say_' + fig, cs.length, { n: _hbN(cs.length) }))}</div>` : '';
    /* CHART FIRST, ALWAYS; the rows are the List picture */
    const P = hbPlan(D);
    if (P.pic !== 'list') return lead + hbChartHtml(D, cs, big) + (cs.length ? hbListFootHtml(cs, label, D.stage || null, i18tn('hb_all_counted', cs.length, { n: _hbN(cs.length) })) : '');
    /* the list keeps the card's period, order and top N — the rest said */
    const W = P.window ? hbWindowCut(cs, P) : null;
    let rows = W ? W.cs : cs.slice();
    if (P.sort){ const S = P.sort, k = c => S.by === 'name' ? String(c.name || '') : hbValueOfOne(c);
      rows.sort((a, b) => S.by === 'name' ? (S.dir === 'down' ? -1 : 1) * k(a).localeCompare(k(b)) : (S.dir === 'up' ? 1 : -1) * (k(a) - k(b))); }
    const more = P.top && rows.length > P.top ? rows.length - P.top : 0;
    if (more) rows = rows.slice(0, P.top);
    const said = [W ? i18t('hb_win_note', { what: hbWinWord(P.window), date: i18t('hb_dt_' + W.Z.date), n: _hbN(W.cs.length), t: _hbN(W.total) }) : '', more ? i18tn('hb_top_more_rows', more, { n: _hbN(more), top: P.top }) : ''].filter(Boolean).join(' ');
    return lead + hbListHtml(rows, fig, label, D.stage || null) + (said ? `<div class="hb-quiet hb-chart-note">${_hbE(said)}</div>` : '');
  }
  if (D.kind === 'obl') return `<div class="hb-say">${_hbE(i18tn('hb_say_overdue', D.n, { n: _hbN(D.n) }))}</div>${hbOblRowsHtml(D.rows)}
    <div class="hb-foot"><span>${_hbE(i18tn('hb_all_shown', D.rows.length, { n: _hbN(D.rows.length) }))}</span><button type="button" class="hb-btn" data-hb-obl="overdue">${_hbE(i18t('hb_open_obligations'))}</button></div>`;
  if (D.kind === 'stages'){
    const max = Math.max(1, ...D.stages.map(s => D.money ? (s.v || 0) : s.n));
    return `${big ? hbReadSrcHtml(D.key) : hbReadSrcHeadHtml(D.key)}<div class="hb-say">${_hbE(D.money ? i18t('hb_say_value', { v: _hbM(D.v) }) : i18t('hb_say_value_hidden'))}</div>${hbBarsHtml(D.stages.map(s => ({ label: s.word ? i18t(s.word) : s.k, v: D.money ? (s.v || 0) : s.n, say: D.money ? _hbM(s.v) : _hbN(s.n), dig: 'st:' + s.k, tone: s.tone })), max)}`;
  }
  if (D.kind === 'moved'){
    const isOb = D.fig === 'overdue';
    const obs = isOb && typeof allObligations === 'function' ? allObligations() : [];
    const show = ids => isOb
      ? hbOblRowsHtml(ids.map(id => obs.find(o => o.id === id)).filter(Boolean).map(o => ({ ...o, days: o.days != null ? o.days : null, late: 0 })))
      : `<div class="hb-rows">${ids.map(id => hbContract(id)).filter(Boolean).slice(0, HB_ROWS_MAX).map(c => hbRowHtml(c, hbRightOf(c, D.fig))).join('')}</div>`;
    const amt = D.fig === 'value' ? _hbM(Math.abs(D.d)) : _hbN(Math.abs(D.d));
    return `<div class="hb-say">${_hbE(D.d ? i18t(D.d > 0 ? 'hb_moved_up' : 'hb_moved_down', { n: amt, when: hbDayWords(D.since) }) : i18t('hb_moved_same', { when: hbDayWords(D.since) }))}</div>
      ${D.added.length ? `<div class="hb-lab">${_hbE(i18tn('hb_moved_new', D.added.length, { n: _hbN(D.added.length) }))}</div>${show(D.added)}` : ''}
      ${D.gone.length ? `<div class="hb-lab">${_hbE(i18tn('hb_moved_gone', D.gone.length, { n: _hbN(D.gone.length) }))}</div>${show(D.gone)}` : ''}
      ${(!isOb && D.added.length) ? `<div class="hb-foot"><span>${_hbE(i18t('hb_moved_note'))}</span><button type="button" class="hb-btn" data-hb-map="${_hbE(D.added.join(','))}" data-hb-what="${_hbE(i18t('hb_moved_crumb', { what: i18t(D.word) }))}">${_hbE(i18t('hb_show_map'))}</button></div>` : ''}`;
  }
  if (D.kind === 'agent' || D.kind === 'done'){
    const rows = D.items.map(it => `<button type="button" class="hb-row" ${it.cid ? `data-hb-dig="c:${_hbE(it.cid)}"` : 'disabled'}>
      <span class="hb-row-a">${_hbE(it.who || '')}</span><span class="hb-row-r">${it.urg ? `<span class="hb-chip ${it.tone === 'ruby' ? 'is-bad' : 'is-warn'}">${_hbE(it.urg)}</span>` : (it.at ? `<span class="hb-quiet">${_hbE(String(it.at).slice(0, 10))}</span>` : '')}</span>
      <span class="hb-row-b">${_hbE(it.sum || '')}</span></button>`).join('');
    return `<div class="hb-say">${_hbE(i18t(D.kind === 'agent' ? 'hb_agent_say' : 'hb_done_say'))}</div><div class="hb-rows">${rows}</div>
      <div class="hb-foot"><span>${_hbE(i18tn('hb_all_shown', D.items.length, { n: _hbN(D.items.length) }))}</span><button type="button" class="hb-btn" data-hm-agent="${_hbE(D.agent)}">${_hbE(i18t('hb_open_agents'))}</button></div>`;
  }
  if (D.kind === 'card') return hbCardHtml(D.card);
  return '';
}
function hbWatchFormHtml(k){
  const d = hbBookData('all', { whole: true }); const v = hbFigNumber(d, k);
  return `<form class="hb-inl" data-hb-watch-form="${k}">${_hbE(i18t('hb_watch_tell', { what: i18t('hb_f_' + k) }))}
    <select name="dir" aria-label="${_hbE(i18t('hb_watch_dir'))}"><option value="above">${_hbE(i18t('hb_watch_above'))}</option><option value="below">${_hbE(i18t('hb_watch_below'))}</option></select>
    <input type="number" name="n" value="${Math.round(v)}" min="0" aria-label="${_hbE(i18t('hb_watch_line'))}">
    <button type="submit" class="hb-btn is-primary">${_hbE(i18t('hb_watch_go'))}</button><button type="button" class="hb-btn" data-hb-watch-cancel>${_hbE(i18t('hb_cancel'))}</button>
    <span class="hb-quiet hb-wide">${_hbE(i18t('hb_watch_note'))}</span></form>`;
}
function hbWatchFired(w){ const v = hbFigNumber(hbBookData('all', { whole: true }), w.k); return w.dir === 'above' ? v > w.n : v < w.n; }
function hbFocusHtml(){
  const s = hbS(); const path = s.path || []; if (!path.length) return '';
  const D = hbDigData(path[path.length - 1], s.lens);
  if (!D){ s.path = []; hbSave(); return ''; }
  const crumbs = path.map((k, i) => i === path.length - 1
    ? `<span aria-current="step">${_hbE(hbCrumbOf(k, s.lens))}</span>`
    : `<button type="button" data-hb-crumb="${i}">${_hbE(hbCrumbOf(k, s.lens))}</button>`).join('<span aria-hidden="true">›</span>');
  const title = D.kind === 'card' ? D.card.ref + ' · ' + D.card.name : hbCrumbOf(path[path.length - 1], s.lens);
  const fk = /^f:/.test(path[path.length - 1]) && path.length === 1 ? path[0].slice(2) : null;
  const mine = fk ? (s.watches || []).filter(w => w.k === fk) : [];
  const eye = fk ? `<button type="button" class="hb-ib" data-hb-watch="${fk}" aria-pressed="${!!(_hbWatchForm === fk || mine.length)}" title="${_hbE(i18t('hb_watch'))}" aria-label="${_hbE(i18t('hb_watch'))}">${_hbEye}</button>` : '';
  const watching = mine.length ? `<div class="hb-say">${_hbE(i18t('hb_watching'))} ${mine.map((w, i) => `<span class="hb-chip${hbWatchFired(w) ? ' is-bad' : ''}">${_hbE(i18t('hb_watch_' + w.dir) + ' ' + (w.k === 'value' ? _hbM(w.n) : _hbN(w.n)) + ' · ' + i18t(hbWatchFired(w) ? 'hb_watch_fired' : 'hb_watch_not_yet'))}<button type="button" data-hb-watch-stop="${s.watches.indexOf(w)}" title="${_hbE(i18t('hb_watch_stop'))}" aria-label="${_hbE(i18t('hb_watch_stop'))}">${_hbX}</button></span>`).join(' ')}</div>` : '';
  /* a chart and Value under contract can be made bigger (the bigger card opens with HaTi's reading) */
  const grows = D.kind === 'list' || D.kind === 'stages';
  const tools = grows ? `${hbBigBtnHtml(s.digBig, 'data-hb-digbig')}` : '';
  return `<div class="hb-focus" id="hb-focus"><nav class="hb-trail" aria-label="${_hbE(i18t('hb_trail'))}"><button type="button" data-hb-crumb="-1">${_hbE(i18t('hb_face_board'))}</button><span aria-hidden="true">›</span>${crumbs}</nav>
    <section class="hb-card hb-dig${_hbFocusNew ? ' is-new' : ''}${s.digBig && grows ? ' is-big' : ''}"><header class="hb-ch"><span class="hb-ct">${_hbE(title)}</span>${hbVerBadgeHtml((s.panels || []).find(x => x.key === path[path.length - 1]))}<span class="hb-grow"></span>${tools}${eye}
      ${path.length > 1 ? `<button type="button" class="hb-ib" data-hb-crumb="${path.length - 2}" title="${_hbE(i18t('hb_step_back'))}" aria-label="${_hbE(i18t('hb_step_back'))}">${_hbBack}</button>` : ''}
      <button type="button" class="hb-ib hb-x" data-hb-crumb="-1" title="${_hbE(i18t('hb_close_dig'))}" aria-label="${_hbE(i18t('hb_close_dig'))}">${_hbX}</button></header>
      ${D.kind === 'list' ? hbRecipeRowHtml(D, hbPlan(D)) : ''}<div class="hb-cb">${fk && _hbWatchForm === fk ? hbWatchFormHtml(fk) : ''}${watching}${hbDigBodyHtml(D, s.lens, !!s.digBig)}</div></section></div>`;
}
let _hbFocusNew = false, _hbWatchForm = null, _hbGiveForm = null, _hbNewPanel = null;

/* ---- THE CONTRACT CARD ----
   Six tiles, then five groups — where it stands, the negotiation, risk,
   renewal and money, the promises — and the trail. Every tile scrolls to its
   group; a group says plainly when the record holds nothing, never a guess. */
function hbCardHtml(K){
  const stTone = K.status === 'Signed' ? 'good' : K.status === 'Under Review' ? 'warn' : K.status === 'Declined' ? 'bad' : '';
  const ends = K.expired ? i18tn('hb_days_past', Math.abs(K.days || 0), { n: Math.abs(K.days || 0) })
    : K.days != null ? i18tn('hb_days_left', K.days, { n: K.days }) : '—';
  const tile = (n, l, tone, to) => `<button type="button" class="hb-fig hb-cfig${tone ? ' is-' + tone : ''}" data-hb-jump="${to}"><span class="hb-fig-n">${_hbE(n)}</span><span class="hb-fig-l">${_hbE(l)}</span></button>`;
  const moveWord = K.move === 'you' ? i18t('hb_move_us') : K.move === 'them' ? i18t('hb_move_them') : i18t('hb_move_none');
  const lates = K.obligations.filter(o => o.state === 'overdue').length;
  const tiles = [
    tile(_hbStatus(K.status), i18t('hb_c_stage'), stTone, 'hb-c-stage'),
    K.money ? tile((typeof fmtMoneyShortIn === 'function') ? fmtMoneyShortIn(K.value, K.currency) : _hbM(K.value), i18t('hb_c_value'), '', 'hb-c-renew') : '',
    tile(ends, K.expiry ? i18t('hb_c_ends', { day: K.expiry }) : i18t('hb_c_no_end'), K.expired ? 'bad' : (K.days != null && K.days <= 90 ? 'warn' : ''), 'hb-c-renew'),
    tile(K.open ? i18tn('hb_c_open', K.open, { n: K.open }) : '—', moveWord, K.move === 'you' ? 'warn' : '', 'hb-c-nego'),
    tile(_hbN(K.risks.length), K.risks.length ? i18t('hb_c_risks') : i18t('hb_c_no_risks'), K.risks.length ? 'warn' : '', 'hb-c-risk'),
    tile(_hbN(K.obligations.length), lates ? i18tn('hb_c_late', lates, { n: lates }) : i18t('hb_c_promises'), lates ? 'bad' : '', 'hb-c-ob'),
  ].join('');
  const row = (l, v) => `<div class="hb-crow"><span>${_hbE(l)}</span><span>${v}</span></div>`;
  const q = K.move === 'you' && K.holding.length ? i18t('hb_c_ask_stuck', { cp: K.cp, name: K.name, clause: K.holding[0] })
    : K.expired ? i18t('hb_c_ask_past', { name: K.name }) : i18t('hb_c_ask_risks', { name: K.name });
  return `<div class="hb-chead"><div><div class="hb-cref">${_hbE(K.ref)}${K.side ? ' · ' + _hbE(i18t('hb_side_' + K.side)) : ''}</div>
      <div class="hb-cname">${_hbE(K.name)}</div><div class="hb-quiet">${_hbE(K.cp || i18t('home_no_counterparty'))}${K.owner ? ' · ' + _hbE(i18t('hb_c_owned', { who: K.owner })) : ''}</div></div>
    <div class="hb-acts"><button type="button" class="hb-btn is-primary" data-hb-room="${_hbE(K.id)}">${_hbE(i18t('hb_c_open'))}</button>
      <button type="button" class="hb-btn" data-hb-analyze="${_hbE(K.id)}" title="${_hbE(i18t('int_analyze_title'))}">${_hbE(i18t('int_analyze'))}</button>
      <button type="button" class="hb-btn" data-hb-map="${_hbE(K.id)}" data-hb-what="${_hbE(K.ref)}">${_hbE(i18t('hb_c_on_map'))}</button>
      <button type="button" class="hb-btn" data-hb-ai="${_hbE(q)}" data-hb-ai-id="${_hbE(K.id)}" title="${_hbE(i18t('hb_c_ask_cost'))}">${_hbE(i18t('hb_c_ask', { q }))}</button></div></div>
    <div class="hb-say">${K.brief ? _hbE(K.brief) + ` <span class="hb-quiet">${_hbE(i18t('hb_c_brief_note'))}</span>` : _hbE(K.full ? (K.hasBrief ? i18t('hb_c_brief_elsewhere') : i18t('hb_c_no_brief')) : i18t('hb_c_loading'))}</div>
    <div class="hb-figs hb-cfigs">${tiles}</div>
    <div class="hb-cgrid">
      <div class="hb-csec" id="hb-c-stage"><div class="hb-lab">${_hbE(i18t('hb_c_where'))}</div>
        ${row(i18t('hb_c_stage'), _hbE(_hbStatus(K.status)))}
        ${K.blockers.length ? row(i18t('hb_c_before_sign'), K.blockers.map(b => _hbE(b)).join('<br>')) : ''}</div>
      <div class="hb-csec" id="hb-c-nego"><div class="hb-lab">${_hbE(i18t('hb_c_nego'))}</div>
        ${K.open || K.settled ? row(i18t('hb_c_move'), `<b>${_hbE(moveWord)}</b>${K.moveN ? ' · ' + _hbE(i18tn('hb_n_waiting', K.moveN, { n: K.moveN })) : ''}`)
          + row(i18t('hb_c_changes'), _hbE(i18t('hb_c_changes_say', { open: K.open, settled: K.settled, rounds: K.rounds })))
          + (K.holding.length ? row(i18t('hb_c_holding'), K.holding.map(h => `<button type="button" class="hb-link" data-hb-dig="cl:${_hbE(h)}">${_hbE(h)}</button>`).join(', ')) : '')
          : row(i18t('hb_c_nego'), _hbE(i18t('hb_c_no_nego')))}</div>
      <div class="hb-csec" id="hb-c-risk"><div class="hb-lab">${_hbE(i18t('hb_c_risk'))}</div>
        ${K.risks.length ? K.risks.map(r => `<div class="hb-crisk"><span class="hb-gd"></span>${_hbE(r)}</div>`).join('') : `<div class="hb-quiet">${_hbE(i18t('hb_c_no_risks_long'))}</div>`}</div>
      <div class="hb-csec" id="hb-c-renew"><div class="hb-lab">${_hbE(i18t('hb_c_renew'))}</div>
        ${row(i18t('hb_c_end'), _hbE(K.expiry || i18t('hb_c_no_end')))}
        ${K.renewal ? row(i18t('hb_c_decide_by'), _hbE(K.renewal.decideBy || '—') + (K.renewal.auto ? ' · ' + _hbE(i18t('hb_c_auto')) : ''))
          + row(i18t('hb_c_decision'), K.renewal.decided ? _hbE(i18t('hb_c_decided')) : `<span class="hb-chip is-warn">${_hbE(i18t('hb_c_undecided'))}</span>`) : ''}
        ${K.pay != null ? row(i18t('hb_c_pay'), _hbE(i18tn('hb_c_pay_days', K.pay, { n: K.pay }))) : ''}</div>
      <div class="hb-csec" id="hb-c-ob"><div class="hb-lab">${_hbE(i18t('hb_c_ob'))}</div>
        ${K.obligations.length ? K.obligations.slice(0, 6).map(o => row(o.what, `${_hbE(o.due ? String(o.due).slice(0, 10) : '—')} · <span class="hb-chip${o.state === 'overdue' ? ' is-bad' : ''}">${_hbE(i18t('hb_ob_' + (o.state === 'overdue' ? 'late' : 'open')))}</span>${o.who ? '' : ' · <span class="hb-hollow"></span>' + _hbE(i18t('hb_nobody'))}`)).join('') : `<div class="hb-quiet">${_hbE(i18t('hb_c_no_ob'))}</div>`}</div>
      <div class="hb-csec" id="hb-c-trail"><div class="hb-lab">${_hbE(i18t('hb_c_lately'))}</div>
        ${K.audit && K.audit.length ? K.audit.map(a => row(String(a.at).slice(0, 10), _hbE([a.what, a.who].filter(Boolean).join(' · ')))).join('') : `<div class="hb-quiet">${_hbE(i18t(K.full ? 'hb_c_no_trail' : 'hb_c_loading'))}</div>`}</div>
    </div>`;
}

/* ---- BARS, the board's one chart: a label, a bar to scale, its figure ---- */
function hbBarsHtml(rows, max){
  return `<div class="hb-bars">${rows.map(r => `<button type="button" class="hb-bar" ${r.dig && r.v ? `data-hb-dig="${_hbE(r.dig)}"` : 'disabled'} title="${_hbE(r.label + ': ' + r.say)}">
    <span class="hb-bar-l">${_hbE(r.label)}</span><span class="hb-bar-t"><span class="hb-bar-f${r.cls ? ' ' + r.cls : ''}" style="width:${Math.max(r.v ? 2 : 0, (r.v / Math.max(1, max)) * 100).toFixed(1)}%${r.tone ? ';background:' + _hbE(r.tone) : ''}"></span></span><span class="hb-bar-n">${_hbE(r.say)}</span></button>`).join('')}</div>`;
}
/* ---- A PANEL'S INSIDE, for one lens ---- */
function hbPanelBodyHtml(kind, lens){
  const d = hbPanelData(kind, lens);
  if (kind === 'obl') return `<div class="hb-say">${_hbE(i18tn('hb_say_overdue', d.n, { n: _hbN(d.n) }))} ${_hbE(i18t('hb_p_obl_more', { open: _hbN(d.open), soon: _hbN(d.soon) }))}</div>${hbOblRowsHtml(d.rows.map(r => ({ cid: r.cid, desc: r.what, assignee: r.who, counterparty: r.cp, days: -r.late })))}`;
  if (kind === 'fric'){
    const cmax = Math.max(1, ...d.clauses.map(x => x.n)), pmax = Math.max(1, ...d.cps.map(x => x.rounds));
    return `<div class="hb-say">${_hbE(i18t('hb_p_fric_say', { live: _hbN(d.live), us: _hbN(d.us), them: _hbN(d.them) }))}${d.whole && d.avgRounds ? ' ' + _hbE(i18t('hb_p_fric_rounds', { n: (Math.round(d.avgRounds * 10) / 10).toLocaleString() })) : ''}</div>
      ${d.clauses.length ? `<div class="hb-lab">${_hbE(i18t('hb_p_fric_clauses'))}</div>${hbBarsHtml(d.clauses.map(x => ({ label: x.label, v: x.n, say: i18tn('hb_n_deals', x.n, { n: x.n }), dig: 'cl:' + x.label })), cmax)}` : ''}
      ${d.cps.length ? `<div class="hb-lab">${_hbE(i18t('hb_p_fric_cps'))}</div>${hbBarsHtml(d.cps.map(x => ({ label: x.name, v: x.rounds, say: i18t('hb_rounds_avg', { n: (Math.round(x.rounds * 10) / 10).toLocaleString() }), dig: 'cp:' + x.name, cls: x.rounds >= 3 ? 'is-warn' : '' })), pmax)}` : ''}
      ${!d.clauses.length && !d.cps.length ? `<div class="hb-quiet">${_hbE(i18t('hb_p_fric_none'))}</div>` : ''}`;
  }
  if (kind === 'ren'){
    const mmax = Math.max(1, ...d.months.map(m => m.ids.length));
    const mname = M => { try { return new Date(M.y, M.m, 1).toLocaleDateString(langLocale(), { month: 'short' }); } catch (_){ return ''; } };
    return `<div class="hb-say">${_hbE(i18tn('hb_p_ren_say', d.n, { n: _hbN(d.n), open: _hbN(d.open) }))}</div>
      ${hbBarsHtml(d.months.map((M, i) => ({ label: mname(M), v: M.ids.length, say: _hbN(M.ids.length), dig: 'mo:' + i, cls: i === 0 ? 'is-warn' : '' })), mmax)}
      <div class="hb-rows">${d.rows.slice(0, 6).map(r => { const c = hbContract(r.id); return c ? hbRowHtml(c, r.decided ? `<span class="hb-chip is-good">${_hbE(i18t('hb_c_decided'))}</span>` : `<span class="hb-chip is-warn">${_hbE(i18tn('hb_days_left', r.days, { n: r.days }))}</span>`) : ''; }).join('')}</div>`;
  }
  if (kind === 'pay'){
    return d.sides.map(S => { const bmax = Math.max(1, ...S.buckets.map(b => b.ids.length));
      return `<div class="hb-lab">${_hbE(i18t('hb_pay_side_' + S.key))}</div>
        <div class="hb-say">${S.n ? _hbE(i18t('hb_pay_avg', { avg: S.avg == null ? '—' : Math.round(S.avg), std: S.std == null ? '—' : S.std })) + (S.over ? ` · <button type="button" class="hb-link" data-hb-dig="po:${S.key}">${_hbE(i18tn('hb_pay_over_n', S.over, { n: S.over }))}</button>` : '') : _hbE(i18t('hb_pay_none'))}</div>
        ${S.n ? hbBarsHtml(S.buckets.map(b => ({ label: b.label + ' ' + i18t('hb_days_word'), v: b.ids.length, say: _hbN(b.ids.length), dig: 'pb:' + S.key + ':' + b.i })), bmax) : ''}`; }).join('')
      + (d.noSide ? `<div class="hb-quiet">${_hbE(i18tn('hb_pay_noside', d.noSide, { n: d.noSide }))}</div>` : '');
  }
  if (kind === 'exp'){
    const emax = Math.max(1, ...d.rows.map(r => r.n));
    return `<div class="hb-say">${_hbE(d.lead ? i18t('hb_p_exp_say', { what: d.rows[0].title }) : i18t('hb_p_exp_none'))}</div>
      ${hbBarsHtml(d.rows.map(r => ({ label: r.title, v: r.n, say: _hbN(r.n), dig: 'ex:' + r.k, cls: r.k === d.lead ? 'is-bad' : '' })), emax)}
      ${d.unread ? `<div class="hb-quiet">${_hbE(i18tn('hb_p_exp_unread', d.unread, { n: d.unread }))}</div>` : ''}`;
  }
  if (kind === 'val'){
    const max = Math.max(1, ...d.stages.map(s => d.money ? (s.v || 0) : s.n));
    return hbBarsHtml(d.stages.map(s => ({ label: s.word ? i18t(s.word) : s.k, v: d.money ? (s.v || 0) : s.n, say: d.money ? _hbM(s.v) : _hbN(s.n), dig: 'st:' + s.k, tone: s.tone })), max);
  }
  return '';
}
function hbGiveFormHtml(p){
  const people = (typeof getUsers === 'function' ? (getUsers() || []) : []).filter(u => u && u.id && (!currentUser() || u.id !== currentUser().id));
  if (!people.length) return `<div class="hb-inl">${_hbE(i18t('hb_give_nobody'))}<button type="button" class="hb-btn" data-hb-give-cancel>${_hbE(i18t('hb_cancel'))}</button></div>`;
  return `<form class="hb-inl" data-hb-give-form="${_hbE(p.id)}">${_hbE(i18t('hb_give_to'))} <select name="to">${people.map(u => `<option value="${_hbE(u.id)}">${_hbE(u.name || u.email || u.id)}</option>`).join('')}</select>
    <textarea name="note" rows="1" maxlength="500" placeholder="${_hbE(i18t('hb_give_note_ph'))}" aria-label="${_hbE(i18t('hb_give_note_ph'))}"></textarea>
    <button type="submit" class="hb-btn is-primary">${_hbE(i18t('hb_give_go'))}</button><button type="button" class="hb-btn" data-hb-give-cancel>${_hbE(i18t('hb_cancel'))}</button>
    <span class="hb-quiet hb-wide">${_hbE(i18t('hb_give_note'))}</span></form>`;
}
function hbPanelHtml(p, lens, gift){
  if (p.kind === 'view') return hbViewPanelHtml(p, lens);
  const K = HB_KINDS[p.kind];
  const body = p.split
    ? `<div class="hb-split"><div><div class="hb-lab is-side">${_hbE(i18t('hb_lens_suppliers'))}</div>${hbPanelBodyHtml(p.kind, 'suppliers')}</div><div><div class="hb-lab is-side">${_hbE(i18t('hb_lens_customers'))}</div>${hbPanelBodyHtml(p.kind, 'customers')}</div></div>`
    : (p.big ? hbReadSrcHtml('hp:' + p.kind) : hbReadSrcHeadHtml('hp:' + p.kind)) + hbPanelBodyHtml(p.kind, lens);
  const given = gift && gift.sent ? `<span class="hb-given" title="${_hbE(gift.sent.note || '')}">${_hbE(i18t('hb_given', { who: gift.sent.toName || '', seen: i18t(gift.sent.seenAt ? 'hb_seen' : 'hb_not_seen') }))}<button type="button" data-hb-ungive="${_hbE(gift.sent.id)}" title="${_hbE(i18t('hb_take_back'))}" aria-label="${_hbE(i18t('hb_take_back'))}">${_hbX}</button></span>` : '';
  const from = gift && gift.from ? `<span class="hb-given is-from" title="${_hbE(gift.from.note || '')}">${_hbE(i18t('hb_from', { who: gift.from.fromName || '' }))}</span>` : '';
  return `<section class="hb-card hb-panel${(p.big || p.split) ? ' is-big' : ''}${p.id === _hbNewPanel ? ' is-new' : ''}" data-hb-pid="${_hbE(p.id)}">
    <header class="hb-ch"><span class="hb-ct">${_hbE(i18t(K.word))}${p.split ? ' · ' + _hbE(i18t('hb_side_by_side')) : ''}</span>${from}${given}<span class="hb-grow"></span>
      <span class="hb-src" title="${_hbE(i18t('hb_p_src', { tab: i18t(K.src) }))}">${_hbE(i18t(K.src))}</span>
      <button type="button" class="hb-ib" data-hb-act="split" aria-pressed="${!!p.split}" title="${_hbE(i18t(p.split ? 'hb_p_unsplit' : 'hb_p_split'))}" aria-label="${_hbE(i18t('hb_p_split'))}">${_hbSplitIc}</button>
      ${gift && gift.from ? '' : `<button type="button" class="hb-ib" data-hb-act="give" aria-pressed="${_hbGiveForm === p.id}" title="${_hbE(i18t('hb_p_give'))}" aria-label="${_hbE(i18t('hb_p_give'))}">${_hbGiveIc}</button>`}
      ${hbBigBtnHtml(p.big, 'data-hb-act="big"')}
      <button type="button" class="hb-ib hb-x" data-hb-act="x" title="${_hbE(i18t(gift && gift.from ? 'hb_p_x_gift' : 'hb_p_x'))}" aria-label="${_hbE(i18t('hb_p_x'))}">${_hbX}</button></header>
    <div class="hb-cb">${_hbGiveForm === p.id ? hbGiveFormHtml(p) : ''}${body}</div></section>`;
}

/* ---- THE BOARD ---- */
function hbBoardHtml(){
  const s = hbS();
  const d = hbBookData(s.lens);
  const base = hbSeenTick(hbBookData('all', { whole: true }));
  const moved = (s.lens === 'all' && base && !hbCountKey()) ? hbMoved(d, base) : null;
  const A = hbAgentsData(base && base.at);
  let time = ''; try { time = new Date().toLocaleTimeString(langLocale(), { hour: '2-digit', minute: '2-digit' }); } catch (_){}
  const gifts = hbGiftsFor();
  _hbInsMemo = new Map();
  _hbPackMemo.clear();
  hbKeptSync();
  hbMovedSync();
  const panels = s.panels.slice().reverse().map(p => hbPanelHtml(p, s.lens, { sent: gifts.sent[p.id] || null })).join('');
  const received = gifts.received.map(g => hbPanelHtml({ id: 'gift:' + g.id, kind: g.kind, split: !!g.split, big: false }, HB_LENSES.includes(g.lens) ? g.lens : 'all', { from: g })).join('');
  /* and the freshness line too: WHEN it was counted is a fact the reader
     cannot know; "all contracts" is one they chose. */
  const cut = [hbCountLabel(s.lens), s.lens === 'all' ? '' : i18t('hb_lens_' + s.lens).toLowerCase()].filter(Boolean).join(' · ');
  const bs = hbBoardSumHtml();
  return `<div class="hb-note"><span class="hb-live"><i></i>${_hbE(i18t('hb_live'))}</span><span>${_hbE(cut ? i18t('hb_counted', { time, lens: cut }) : i18t('hb_counted_plain', { time }))}</span><span class="hb-grow"></span>${bs.btn}</div>
    ${bs.box}
    ${hbBookHtml(d, moved, base && base.at)}
    ${hbPrepHtml(A, base && base.at)}
    ${hbFocusHtml()}
    <div class="hb-grid">${received}${panels || (received ? '' : `<div class="hb-empty">${_hbE(i18t('hb_empty'))}</div>`)}</div>`;
}

/* ============================================================
   ANSWER PACKS (Young, 5 Oct 2026, "HaTi Board: Charts That Explain",
   recommendation 3; "build what it is suggesting in totality")
   ============================================================
   The four questions that matter most get a READY ANSWER, the same way every
   time: Top risks · Money ending · Standards breaches · The next 12 months.
   Each pack is two or three cards, a RANKED LIST with the reason for each
   row, HaTi's reading, the next questions, and "How HaTi worked this out"
   (recommendation 5) — all counted by HaTi, free. Only the summary is
   Copilot's, on a press, written from the pack's fact sheet and checked
   number by number (recommendation 2). A pack opens where any answer opens
   (the focus card, key pk:<name>); its cards are ordinary chart cards
   (pk:<name>.c1), its rows and concerns ordinary lists (pk:<name>.k:<id>),
   so every number is a door onto the contracts it counts. Every pack states
   its COVERAGE: "no breaches" can never mean "nothing checked". */
const HB_PACKS = ['risks', 'ending', 'standards', 'next12'];
const HB_PACK_ROWS = 10, HB_PACK_MONTHS = 18;
const HB_PACK_RE = {
  risks: /\b(?:(?:top|biggest|highest|main|worst|greatest)\s+risk(?:s|y)?(?:\s+(?:contracts?|agreements?))?|riskiest|most risky|high risk contracts|risk(?:iest)? contracts|(?:största|högsta)\s+risk\w*|mest riskfyllda)\b/,
  ending: /\b(?:which|what)\s+(?:month|year|quarter|months|månad|år)\b.*\b(?:most|biggest|largest|highest|mest|störst)\b.*\b(?:end|ends|ending|expire|expires|expiring|come to an end|comes to an end|löper ut|upphör)\b|\bmoney ending\b|\bwhen does the most (?:value|money) (?:end|expire)\b/,
  standards: /\b(?:violat\w*|break\w*|breach\w*|deviat\w*|(?:do not|dont|don't|doesn't|does not) (?:meet|follow)|off|outside|against|bryter mot|avviker från|följer inte)\b.*\b(?:our standards?|company standards?|standards|playbook|polic(?:y|ies)|standarder|våra standarder)\b/,
  next12: /\b(?:concern|worry|worried|watch out|focus on|attention|oroa|bekymra)\w*\b.*\b(?:next|coming|kommande|nästa)\s+(?:12 months|twelve months|year|12 månader|året)\b|\bwhat should (?:concern|worry) me\b/,
};
function hbPackOfQ(q){
  const t = ' ' + _hbRcNorm(q) + ' ';
  return HB_PACKS.find(k => HB_PACK_RE[k].test(t)) || null;
}
const _hbPackMemo = new Map();
/* the dates a pack reads, as days from today */
function _hbDaysAhead(iso){ return iso ? hbDaysTo(String(iso).slice(0, 10)) : null; }
function _hbActBy(c){ try { return (typeof renewalDecisionDate === 'function') ? renewalDecisionDate(c) : hbDateOf(c, 'decision'); } catch (_){ return null; } }
function _hbAuto(c){ return !!(c && c.metadata && c.metadata.renewalType === 'auto-renew'); }
function _hbLive(c){ return c && c.status !== 'Declined' && c.status !== 'Draft' && !(typeof contractExpired === 'function' && contractExpired(c)); }
/* THE PACK, worked out once per paint: what it counts, ranks and says */
function hbPackData(name, lens){
  const memoKey = name + '|' + (lens || 'all') + '|' + ((window.state && state.contracts) ? state.contracts.length : 0);
  if (_hbPackMemo.has(memoKey)) return _hbPackMemo.get(memoKey);
  const book = hbBook(lens || 'all'), money = hbMoneyOk();
  const fv = v => money ? _hbM(v) : _hbN(v);
  const V = list => list.reduce((a, c) => a + hbValueOfOne(c), 0);
  const P = { name, title: i18t('hb_pk_' + name), money, cards: [], rows: [], cols: [], lines: [], counts: new Set(), facts: [], next: [], steps: [], lists: {}, cs: book };
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l) P.lines.push(l); if (n != null) P.counts.add(n); };
  const list = (id, title, cs) => { P.lists[id] = { title, ids: cs.map(c => c.id) }; return 'pk:' + name + '.k:' + id; };
  const door = (id, title, cs, word) => ({ html: hbReadDoor(cs.length, cs.length ? list(id, title, cs) : null, word) });
  const cov = hbCoverageOf(book);
  if (name === 'risks'){
    const rows = book.filter(_hbLive).map(c => ({ c, w: hbRiskWeightOf(c), x: hbExposureOf(c), risks: (typeof riskOpenOf === 'function') ? riskOpenOf(c) : [] }))
      .filter(r => r.w != null && r.risks.length);
    rows.sort((a, b) => (b.x || 0) - (a.x || 0) || b.w - a.w || b.risks.length - a.risks.length);
    const tot = rows.reduce((a, r) => a + (r.x || 0), 0), top3 = rows.slice(0, 3), t3 = top3.reduce((a, r) => a + (r.x || 0), 0);
    const unread = book.filter(c => _hbLive(c) && hbRiskWeightOf(c) == null);
    P.cols = [i18t('hb_pk_col_contract'), money ? i18t('hb_ms_exposure') : i18t('hb_pk_col_risks'), i18t('hb_pk_col_why')];
    P.rows = rows.slice(0, HB_PACK_ROWS).map(r => {
      const sev = r.risks.slice().sort((a, b) => (HB_RISK_WEIGHT[b.sev] || 0) - (HB_RISK_WEIGHT[a.sev] || 0));
      const why = sev.slice(0, 2).map(it => String(it.title || '').trim()).filter(Boolean);
      const w = (typeof renewalWindow === 'function') ? (() => { try { return renewalWindow(r.c); } catch (_){ return null; } })() : null;
      /* the wording's reading adds the missing cap unless a finding already says it */
      const unc = i18t('hb_pk_why_uncapped');
      if (hbKeyTermOf(r.c, 'liabcap') === 'uncapped' && !why.some(x => x.toLowerCase() === unc.toLowerCase())) why.push(unc);
      if (w && !w.decided && w.days != null && w.days <= 183) why.push(i18t(w.auto ? 'hb_pk_why_autorenew' : 'hb_pk_why_renews', { day: hbReadDay(w.decideBy) }));
      return { c: r.c, cells: [money ? _hbM(r.x || 0) : _hbN(r.risks.length)], why: why.join(' · ') };
    });
    if (rows.length){
      say(money ? 'hb_pk_r_total' : 'hb_pk_r_total_n', { n: door('risky', i18t('hb_pk_l_risky'), rows.map(r => r.c)), v: fv(tot) }, rows.length);
      if (money && top3.length >= 2 && tot > 0) say('hb_pk_r_top3', { k: _hbN(top3.length), v: _hbM(t3), pct: _hbN(Math.round(t3 / tot * 100)) });
    } else say('hb_pk_r_none', {});
    if (unread.length) say('hb_pk_unread', { n: door('unread', i18t('hb_pk_l_unread'), unread) }, unread.length);
    P.cards = [
      { id: 'c1', title: i18t(money ? 'hb_pk_c_exp_cp' : 'hb_pk_c_risk_cp'), chart: { pic: 'bars', split: { by: 'counterparty' }, measure: money ? 'exposure' : 'count', top: 8, sort: { by: 'value', dir: 'down' } }, ids: rows.map(r => r.c.id) },
      { id: 'c2', title: i18t('hb_pk_c_risks'), chart: { pic: 'ring', split: { by: 'risks' }, measure: 'count' }, ids: book.filter(_hbLive).map(c => c.id) } ];
    P.facts = ['Ranked by risk exposure (value × the weight of the worst open risk: high 1, medium 0.5, low 0.25):',
      ...rows.slice(0, HB_PACK_ROWS).map((r, i) => `- ${i + 1}. ${hbRef(r.c)}${r.c.counterparty ? ' (' + r.c.counterparty + ')' : ''}: ${money ? _hbM(r.x || 0) + ', ' : ''}${r.risks.length} open risk${r.risks.length === 1 ? '' : 's'}; ${P.rows[i].why}`)];
    P.next = [i18t('hb_pk_n_r1'), i18t('hb_pk_n_r2'), i18t('hb_pk_n_r3')];
    P.steps = [i18t('hb_pk_s_r1'), i18t('hb_pk_s_r2'), i18t('hb_pk_s_r3')];
  }
  if (name === 'ending'){
    const live = book.filter(c => _hbLive(c));
    const ahead = live.map(c => ({ c, e: hbEndOf(c) })).filter(r => r.e && hbDaysTo(r.e) >= 0 && hbDaysTo(r.e) <= HB_PACK_MONTHS * 31);
    const by = new Map(); ahead.forEach(r => { const k = r.e.slice(0, 7); const t = by.get(k) || { k, cs: [], v: 0 }; t.cs.push(r.c); t.v += hbValueOfOne(r.c); by.set(k, t); });
    const months = [...by.values()].sort((a, b) => (money ? b.v - a.v : b.cs.length - a.cs.length) || (a.k < b.k ? -1 : 1));
    const peak = months[0], second = months[1];
    P.cols = [i18t('hb_pk_col_contract'), money ? i18t('hb_ms_value') : i18t('hb_pk_col_ends'), i18t('hb_pk_col_why')];
    if (peak){
      const cs = peak.cs.slice().sort((a, b) => hbValueOfOne(b) - hbValueOfOne(a));
      const acts = cs.map(_hbActBy).filter(Boolean).sort();
      say(money ? 'hb_pk_e_peak' : 'hb_pk_e_peak_n', { a: hbReadMonth(peak.k), v: fv(peak.v), n: door('peak', hbReadMonth(peak.k), cs) }, cs.length);
      const auto = cs.filter(_hbAuto);
      if (auto.length) say('hb_pk_e_auto', { n: door('auto', i18t('hb_pk_l_auto'), auto), d: acts.length ? hbReadDay(acts[0]) : '' }, auto.length);
      if (acts.length) say('hb_pk_e_act', { d: hbReadDay(acts[0]) });
      if (second) say(money ? 'hb_pk_e_second' : 'hb_pk_e_second_n', { a: hbReadMonth(second.k), v: fv(second.v), n: _hbN(second.cs.length) }, second.cs.length);
      P.rows = cs.slice(0, HB_PACK_ROWS).map(c => { const a = _hbActBy(c);
        return { c, cells: [money ? _hbM(hbValueOfOne(c)) : (hbEndOf(c) || '')], why: [a ? i18t('hb_pk_why_actby', { day: hbReadDay(a) }) : '', _hbAuto(c) ? i18t('hb_pk_why_auto') : ''].filter(Boolean).join(' · ') }; });
      P.facts = ['Value ending by month, next 18 months (month: value, contracts):', ...months.slice().sort((a, b) => (a.k < b.k ? -1 : 1)).map(m => `- ${hbReadMonth(m.k)}: ${fv(m.v)}, ${m.cs.length}`),
        `Peak month ${hbReadMonth(peak.k)}, its contracts (ref: value, act by, auto-renew):`, ...cs.slice(0, HB_PACK_ROWS).map(c => `- ${hbRef(c)}: ${fv(hbValueOfOne(c))}, act by ${_hbActBy(c) || 'not known'}, ${_hbAuto(c) ? 'renews automatically' : 'no automatic renewal on record'}`)];
    } else say('hb_pk_e_none', { k: _hbN(HB_PACK_MONTHS) });
    const noEnd = live.filter(c => !hbEndOf(c));
    if (noEnd.length) say('hb_pk_e_noend', { n: door('noend', i18t('hb_pk_l_noend'), noEnd) }, noEnd.length);
    const m = money ? 'value' : 'count';
    P.cards = [
      { id: 'c1', title: i18t('hb_pk_c_ending'), chart: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, measure: m, window: { next: HB_PACK_MONTHS, unit: 'm', date: 'end' } }, ids: live.map(c => c.id) },
      { id: 'c2', title: i18t('hb_pk_c_actby'), chart: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'decision' }, measure: m, window: { next: HB_PACK_MONTHS, unit: 'm', date: 'decision' } }, ids: live.map(c => c.id) } ];
    P.next = [i18t('hb_pk_n_e1'), i18t('hb_pk_n_e2'), i18t('hb_pk_n_e3')];
    P.steps = [i18t('hb_pk_s_e1'), i18t('hb_pk_s_e2'), i18t('hb_pk_s_e3')];
  }
  if (name === 'standards'){
    const live = book.filter(c => c.status !== 'Declined');
    const off = live.filter(c => hbStdStateOf(c) === 'off').sort((a, b) => hbValueOfOne(b) - hbValueOfOne(a));
    const unchecked = live.filter(c => hbStdStateOf(c) === 'unchecked');
    const checked = live.length - unchecked.length;
    const by = new Map(); off.forEach(c => hbStdBreaches(c).forEach(s => { const t = by.get(s) || { s, cs: [], v: 0 }; if (!t.cs.includes(c)){ t.cs.push(c); t.v += hbValueOfOne(c); } by.set(s, t); }));
    const stds = [...by.values()].sort((a, b) => b.cs.length - a.cs.length || b.v - a.v);
    P.cols = [i18t('hb_pk_col_contract'), money ? i18t('hb_ms_value') : i18t('hb_pk_col_breaks'), i18t('hb_pk_col_why')];
    P.rows = off.slice(0, HB_PACK_ROWS).map(c => { const b = hbStdBreaches(c); return { c, cells: [money ? _hbM(hbValueOfOne(c)) : _hbN(b.length)], why: b.join(' · ') }; });
    say('hb_pk_s_checked', { k: _hbN(checked), n: _hbN(live.length) }, checked);
    if (off.length) say(money ? 'hb_pk_s_off' : 'hb_pk_s_off_n', { n: door('off', i18t('hb_std_off'), off), v: fv(V(off)) }, off.length);
    else say(checked ? 'hb_pk_s_none' : 'hb_pk_s_none_checked', {});
    if (stds.length) say(money ? 'hb_pk_s_most' : 'hb_pk_s_most_n', { what: stds[0].s, n: door('std0', stds[0].s, stds[0].cs), v: fv(stds[0].v) }, stds[0].cs.length);
    if (unchecked.length) say('hb_pk_s_unchecked', { n: door('unchecked', i18t('hb_std_unchecked'), unchecked) }, unchecked.length);
    P.bars = stds.slice(0, 8).map((t, i) => ({ g: t.s, label: t.s, n: t.cs.length, v: money ? t.v : t.cs.length, say: _hbN(t.cs.length) + (money ? ' · ' + _hbM(t.v) : ''), dig: list('s' + i, t.s, t.cs) }));
    P.cards = [{ id: 'c1', title: i18t('hb_pk_c_std'), chart: { pic: 'ring', split: { by: 'standards' }, measure: 'count' }, ids: live.map(c => c.id) }];
    P.facts = [`Checked against our standards: ${checked} of ${live.length}; never checked: ${unchecked.length}.`,
      'Standards broken (standard: contracts, value):', ...stds.map(t => `- ${t.s}: ${t.cs.length}, ${fv(t.v)}`),
      'Contracts off standard, largest first (ref: value; standards broken):', ...off.slice(0, HB_PACK_ROWS).map(c => `- ${hbRef(c)}${c.counterparty ? ' (' + c.counterparty + ')' : ''}: ${fv(hbValueOfOne(c))}; ${hbStdBreaches(c).join(', ')}`)];
    P.next = [i18t('hb_pk_n_s1'), i18t('hb_pk_n_s2'), i18t('hb_pk_n_s3')];
    P.steps = [i18t('hb_pk_s_s1'), i18t('hb_pk_s_s2'), i18t('hb_pk_s_s3')];
  }
  if (name === 'next12'){
    const live = book.filter(_hbLive);
    const within = (iso, d) => { const n = _hbDaysAhead(iso); return n != null && n >= -31 && n <= d; };
    const C = [];
    const add = (id, cs, earliest) => { if (cs.length) C.push({ id, cs, v: V(cs), earliest }); };
    const decisions = live.filter(c => { try { const w = (typeof renewalWindow === 'function') ? renewalWindow(c) : null; return w && !w.decided && within(w.decideBy, 365); } catch (_){ return false; } });
    add('decide', decisions, decisions.map(_hbActBy).filter(Boolean).sort()[0]);
    const riskyAuto = live.filter(c => _hbAuto(c) && (hbRiskWeightOf(c) || 0) >= 1 && within(_hbActBy(c), 365));
    add('riskauto', riskyAuto, riskyAuto.map(_hbActBy).filter(Boolean).sort()[0]);
    const overdue = live.filter(c => { try { return (typeof graphNodeFacts === 'function') ? graphNodeFacts(c).overdue > 0 : false; } catch (_){ return false; } });
    add('overdue', overdue, null);
    const offEnding = live.filter(c => hbStdStateOf(c) === 'off' && within(hbEndOf(c), 365));
    add('offend', offEnding, offEnding.map(hbEndOf).filter(Boolean).sort()[0]);
    const blind = live.filter(c => within(hbEndOf(c), 365) && (hbRiskWeightOf(c) == null || hbStdStateOf(c) === 'unchecked'));
    add('blind', blind, null);
    /* ranked: what is owed soonest and weighs most first (money, then count) */
    C.sort((a, b) => (money ? b.v - a.v : b.cs.length - a.cs.length) || ((a.earliest || '9') < (b.earliest || '9') ? -1 : 1));
    P.concerns = C.map(x => ({ id: x.id, word: i18t('hb_pk_k_' + x.id), n: x.cs.length, v: x.v, earliest: x.earliest, dig: list(x.id, i18t('hb_pk_k_' + x.id), x.cs) }));
    P.cols = [i18t('hb_pk_col_concern'), money ? i18t('hb_ms_value') : i18t('hb_pk_col_contracts'), i18t('hb_pk_col_when')];
    if (C.length){ const f = C[0];
      say((money ? 'hb_pk_x_first' : 'hb_pk_x_first_n') + (f.earliest ? '' : '_nod'), { what: i18t('hb_pk_k_' + f.id).toLowerCase(), n: door(f.id, i18t('hb_pk_k_' + f.id), f.cs), v: fv(f.v), d: f.earliest ? hbReadDay(f.earliest) : '' }, f.cs.length);
      say('hb_pk_x_count', { k: _hbN(C.length) }); }
    else say('hb_pk_x_none', {});
    P.cards = [{ id: 'c1', title: i18t('hb_pk_c_next12'), chart: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'decision' }, measure: money ? 'value' : 'count', window: { next: 12, unit: 'm', date: 'decision' } }, ids: live.map(c => c.id) }];
    P.facts = ['Concerns over the next 12 months, ranked (concern: contracts, value, earliest date):', ...C.map((x, i) => `- ${i + 1}. ${i18t('hb_pk_k_' + x.id)}: ${x.cs.length}, ${fv(x.v)}, ${x.earliest || 'no date'}`)];
    P.next = [i18t('hb_pk_n_x1'), i18t('hb_pk_n_x2'), i18t('hb_pk_n_x3')];
    P.steps = [i18t('hb_pk_s_x1'), i18t('hb_pk_s_x2'), i18t('hb_pk_s_x3')];
  }
  P.coverage = cov;
  P.counts.add(cov.n); P.counts.add(cov.read); P.counts.add(cov.checked);
  _hbPackMemo.set(memoKey, P);
  return P;
}
/* a pack's card, as an ordinary chart card: its key is a door like any other */
function hbPackCardD(name, id, lens){
  const P = hbPackData(name, lens); const k = (P.cards || []).find(x => x.id === id); if (!k) return null;
  const ids = k.ids.filter(x => hbContract(x));
  return { key: 'pk:' + name + '.' + id, kind: 'list', crumb: P.title + ' › ' + k.title, title: k.title, ids, n: ids.length, chart: k.chart, fixed: [] };
}
function hbPackHtml(D, lens, big){
  const P = hbPackData(D.pack, lens);
  const reading = { lines: P.lines, counts: P.counts, keys: [] };
  const cards = (P.cards || []).map(k => { const S = hbPackCardD(D.pack, k.id, lens); if (!S) return '';
    return `<section class="hb-pack-card"><h4>${_hbE(k.title)}</h4>${hbChartHtml(S, hbListOf(S.ids, lens), false)}</section>`; }).join('')
    + (P.bars && P.bars.length ? `<section class="hb-pack-card"><h4>${_hbE(i18t('hb_pk_c_broken'))}</h4>${hbChartBarsHtml(P.bars, true)}</section>` : '');
  const rows = P.concerns
    ? P.concerns.map((x, i) => `<tr><td class="hb-pk-i">${i + 1}</td><td><button type="button" class="hb-read-n" data-hb-dig="${_hbE(x.dig)}">${_hbE(x.word)}</button></td><td class="hb-pk-n">${_hbE(P.money ? _hbM(x.v) + ' · ' + _hbN(x.n) : _hbN(x.n))}</td><td>${_hbE(x.earliest ? hbReadDay(x.earliest) : '—')}</td></tr>`).join('')
    : (P.rows || []).map((r, i) => `<tr><td class="hb-pk-i">${i + 1}</td><td><button type="button" class="hb-read-n" data-hb-dig="c:${_hbE(r.c.id)}">${_hbE(hbRef(r.c))}</button> <span class="hb-quiet">${_hbE(r.c.counterparty || r.c.name || '')}</span></td><td class="hb-pk-n">${_hbE(r.cells[0])}</td><td>${_hbE(r.why || '—')}</td></tr>`).join('');
  const table = rows ? `<div class="hb-pack-list"><h4>${_hbE(i18t('hb_pk_ranked'))}</h4><table class="hb-pk-t"><thead><tr><th></th>${P.cols.map(c => `<th>${_hbE(c)}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>` : '';
  const cov = P.coverage;
  const work = `<details class="hb-how"><summary>${_hbE(i18t('hb_how_title'))}</summary><ol>${P.steps.map(s => `<li>${_hbE(s)}</li>`).join('')}</ol>
    <p class="hb-quiet">${_hbE(i18t('hb_how_cov', { n: _hbN(cov.n), r: _hbN(cov.read), k: _hbN(cov.checked) }))}</p></details>`;
  const next = `<div class="hb-nx"><span class="hb-nx-l">${_hbE(i18t('hb_nx_label'))}</span>${P.next.map(q => `<button type="button" class="hb-nx-q" data-hb-next="${_hbE(q)}">${_hbE(q)}</button>`).join('')}</div>`;
  void big;
  return `<div class="hb-pack" data-hb-pack="${_hbE(D.pack)}">${hbReadBlockHtml(D.key, reading, P.cs.length, hbWhySigOf('pack:' + D.pack, P.cs))}
    <div class="hb-pack-cards">${cards}</div>${table}${work}${next}</div>`;
}
/* the pack as Copilot is shown it (its fact sheet is built from this) */
function hbPackSrc(key, lens){
  const m = /^pk:(\w+)$/.exec(String(key || '')); if (!m || !HB_PACKS.includes(m[1])) return null;
  const P = hbPackData(m[1], lens);
  return { key, title: P.title, head: `An answer pack on the HaTi Home board: "${P.title}".`, data: P.facts,
    reading: { lines: P.lines, counts: P.counts, keys: [] }, cs: P.cs, sig: hbWhySigOf('pack:' + m[1], P.cs) };
}

/* ============================================================
   SUMMARISE MY BOARD (recommendation 6): one press for the whole board.
   Its fact sheet is the board as it stands (hbBoardNow — the same words the
   board panel's Copilot is given) and each card's own reading; the answer is
   checked number by number like every summary, and kept for the day.
   ============================================================ */
const HB_BOARD_KEY = 'board:all';
function hbBoardSrc(lens){
  const s = hbS(); const cs = hbBook(lens || s.lens || 'all');
  const data = String(hbBoardNow() || '').split('\n').filter(Boolean);
  const counts = new Set([cs.length]);
  [...String(hbBoardNow() || '').matchAll(/\b(\d+)\b/g)].forEach(m => counts.add(Number(m[1])));
  return { key: HB_BOARD_KEY, title: i18t('hb_bs_title'), head: 'The whole HaTi Home board, as it stands now.', data,
    reading: { lines: [], counts, keys: [] }, cs, sig: hbWhySigOf('board', cs) };
}
function hbBoardSumHtml(){
  const src = hbBoardSrc(); const key = HB_BOARD_KEY;
  const kept = hbWhyKept(key, src.sig), busy = _hbWhyBusy.has(key), err = _hbWhyErr.get(key);
  const live = typeof copilotAvailable === 'function' && copilotAvailable();
  const btn = `<button type="button" class="hb-link hb-bs-go" data-hb-why="${_hbE(key)}"${busy ? ' disabled' : ''}${live ? ` title="${_hbE(i18tn('hb_cx_cost', src.cs.length, { n: _hbN(src.cs.length) }))}"` : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t(kept ? 'hb_bs_again' : 'hb_bs_btn'))}</button>`;
  let box = '';
  if (busy) box = `<div class="hb-why" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_bs_title'))}</span></div><p class="hb-quiet">${_hbE(i18t('hb_bs_busy'))}</p></div>`;
  else if (err) box = `<div class="hb-why is-err" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_bs_title'))}</span></div><p>${_hbE(err)}</p></div>`;
  else if (kept) box = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_bs_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: kept.at }))}</span></div>
    <div class="hb-why-b">${(typeof aiRichText === 'function') ? aiRichText(kept.text) : _hbE(kept.text)}</div>
    <div class="hb-why-f"><span class="${kept.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(kept.dropped ? i18tn('hb_cx_dropped', kept.dropped, { n: kept.dropped }) : i18t('hb_cx_ok'))}</span></div></div>`;
  return { btn, box };
}

/* ============================================================
   DIG DEEPER — THE ANALYST (Young, 5 Oct 2026, "HaTi Board: Charts That
   Explain", recommendations 4 and 5; Young's comment on the doc asked whether
   it should run by itself — it runs ON A PRESS, the house rule that Copilot
   spends only when asked, its cost beside the button)
   ============================================================
   Under a Copilot answer on the board, "Dig deeper" hands the question to
   ONE analyst (POST /api/board/analyst). Copilot plans; HaTi counts: each
   step Copilot asks for one calculation (a set and a recipe, or one of the
   four answer packs), HaTi runs it through the board's one planner
   (hbChartRun, hbReadingOf) and sends back its FACT SHEET; at most
   HB_DD_STEPS steps, then a finish — a summary checked number by number
   against every sheet (hbFactCheck), up to three cards OFFERED (one press
   adds them through the one applier, hbBoardApply), up to three next
   questions. The run is a focus card (an:<id>) that lists every step as
   "How HaTi worked this out", each with its own reading and a door onto the
   contracts it counted. Kept on this person's board for the sitting's
   refresh (s.an, HB_DD_KEEP). */
const HB_DD_STEPS = 5, HB_DD_KEEP = 3, HB_DD_SHEET_MAX = 3400, HB_DD_IDS_MAX = 500;
const _hbDdBusy = new Set();
let _hbDdCalc = 0;
function hbDdLive(){ return typeof API_MODE === 'function' && API_MODE() && typeof copilotAvailable === 'function' && copilotAvailable(); }
/* the press, under a Copilot reply on the board (never on the free road) */
function hbDeeperHtml(q){
  const t = String(q || '').trim(); if (!t || hbS().face !== 'board') return '';
  const live = hbDdLive();
  /* it sits in the panel, so it wears the panel's clothes, not the board's */
  return `<div class="hb-dd-go"><button type="button" class="ui-btn ui-btn-sm" data-hb-deeper="${_hbE(t.slice(0, 400))}"${live ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t('hb_dd_btn'))}</button>
    <span class="hb-dd-cost">${_hbE(live ? i18t('hb_dd_cost', { n: HB_DD_STEPS, m: HB_DD_STEPS + 1 }) : i18t('hb_cx_nokey'))}</span></div>`;
}
/* one calculation, as the analyst asked for it: a set and a recipe, run
   through the board's own planner — the same arithmetic a card draws */
function hbDdCalc(input, lens){
  const W = hbWhichOf((input && input.which) || { all: true }, lens);
  if (W.unread) return { title: W.label, say: `HaTi could not read "${W.label}" as a set of contracts, so nothing was counted. Name the set with the board's own words (a stage, a stream, a counterparty, a type) or use the whole book.`, lines: [], ids: [], nums: new Set() };
  const clean = hbCardClean((input && input.recipe) || {}); delete clean.which;
  const key = 'an' + HB_KEY_SEP + (++_hbDdCalc);
  const D = { key, kind: 'list', crumb: W.label, title: W.label, setLabel: W.label, ids: W.ids, n: W.ids.length, whole: W.whole, fixed: W.fields, chart: clean };
  const P = hbPlan(D);
  const title = hbPlainText(clean.title || (W.label + ' · ' + hbSplitWord(P.split)), HB_TITLE_MAX);
  const src = hbReadOfList(D, key, title, lens);
  if (!src) return { title, say: `Nothing to count: no contracts in "${W.label}".`, lines: [], ids: [], nums: new Set(['0']) };
  const sheet = hbFactSheet(src);
  return { title, say: sheet.text, lines: src.reading.lines, ids: src.cs.map(c => c.id), nums: sheet.nums, cov: sheet.coverage };
}
function hbDdPack(input, lens){
  const name = input && input.name; if (!HB_PACKS.includes(name)) return { title: '?', say: 'No such answer pack.', lines: [], ids: [], nums: new Set() };
  const src = hbPackSrc('pk:' + name, lens), sheet = hbFactSheet(src);
  return { title: src.title, say: sheet.text, lines: src.reading.lines, ids: src.cs.map(c => c.id), dig: 'pk:' + name, nums: sheet.nums, cov: sheet.coverage };
}
function hbDdRun(id){ const s = hbS(); return (s.an && s.an[id]) || null; }
function hbDdKeep(run){
  const s = hbS(); s.an = s.an || {};
  delete s.an[run.id]; s.an[run.id] = run;
  const ks = Object.keys(s.an); while (ks.length > HB_DD_KEEP) delete s.an[ks.shift()];
  hbSave();
}
/* THE LOOP: ask, run the step, send it back — at most HB_DD_STEPS + 1 calls */
async function hbDigDeeper(q){
  const t = String(q || '').trim(); const s = hbS();
  if (!t || s.face !== 'board') return null;
  const id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const run = { id, q: t.slice(0, 400), steps: [], state: 'busy', summary: '', dropped: 0, cards: [], next: [], err: '', notice: '', at: '' };
  hbDdKeep(run); _hbDdBusy.add(id);
  hbDig('an:' + id, false);
  if (!hbDdLive()){ run.state = 'err'; run.err = i18t('hb_cx_nokey'); _hbDdBusy.delete(id); hbDdKeep(run); hbPaintBoard(); return run; }
  const lens = s.lens, nums = new Set(), sent = [];
  try {
    for (let n = 0; n <= HB_DD_STEPS; n++){
      const r = await api('board/analyst', 'POST', { question: run.q, guide: hbDataGuide(lens), board: hbBoardNow(), lang: i18t('hb_cx_lang'), steps: sent });
      if (r && r.notice) run.notice = String(r.notice).slice(0, 300);
      const st = r && r.step; if (!st) throw new Error('no step');
      if (st.name === 'finish' || n === HB_DD_STEPS){
        const f = st.name === 'finish' ? st.input || {} : {};
        const chk = hbFactCheck(f.summary || '', nums);
        run.summary = chk.text.slice(0, 1500); run.dropped = chk.dropped;
        run.cards = (Array.isArray(f.cards) ? f.cards : []).slice(0, 3);
        run.next = (Array.isArray(f.next) ? f.next : []).map(x => hbPlainText(x, 120)).filter(Boolean).slice(0, 3);
        break;
      }
      const out = st.name === 'pack' ? hbDdPack(st.input, lens) : hbDdCalc(st.input, lens);
      out.nums.forEach(x => nums.add(x));
      if (out.cov){ const c = out.cov; [c.n, c.read, c.checked, c.n - c.read, c.n - c.checked].forEach(x => nums.add(String(x))); }
      run.steps.push({ name: st.name, why: hbPlainText(st.input && st.input.why, 200), title: out.title, lines: (out.lines || []).slice(0, 4).map(l => _hbE(hbFactPlain(l))), ids: out.ids.slice(0, HB_DD_IDS_MAX), n: out.ids.length, dig: out.dig || '' });
      sent.push({ name: st.name, input: st.input, result: String(out.say).slice(0, HB_DD_SHEET_MAX) });
      hbDdKeep(run); hbPaintBoard();
    }
    run.state = run.summary ? 'done' : 'empty';
  } catch (e){
    run.state = 'err';
    run.err = e && e.needsKey ? i18t('hb_cx_nokey') : e && e.spendLimit ? String(e.message || '').slice(0, 200) : i18t('hb_cx_failed', { why: String((e && e.message) || e || '').slice(0, 160) });
  } finally {
    run.at = new Date().toTimeString().slice(0, 5);
    _hbDdBusy.delete(id); hbDdKeep(run); hbPaintBoard();
  }
  return run;
}
/* the cards the analyst offered, added on the reader's press */
function hbDdAddCards(id){
  const run = hbDdRun(id); if (!run || !run.cards.length || run.added) return null;
  const r = hbBoardApply(run.cards.map(c => ({ do: 'add_card', which: c.which || { all: true }, recipe: c.recipe || {}, title: c.title })), run.q);
  run.added = true; hbDdKeep(run); hbPaintBoard();
  return r;
}
function hbDdCardHtml(D){
  const run = D.run, busy = _hbDdBusy.has(run.id);
  const steps = run.steps.map((st, i) => {
    const door = st.dig ? `<button type="button" class="hb-read-n" data-hb-dig="${_hbE(st.dig)}">${_hbE(i18tn('hb_n_contracts', st.n, { n: _hbN(st.n) }))}</button>`
      : st.n ? `<button type="button" class="hb-read-n" data-hb-open="${_hbE(st.ids.join(','))}" data-hb-what="${_hbE(st.title)}">${_hbE(i18tn('hb_n_contracts', st.n, { n: _hbN(st.n) }))}</button>` : _hbE(i18tn('hb_n_contracts', 0, { n: 0 }));
    /* a step's reading is words: its own doors pointed at a calculation that
       is not a card; the step's ONE door is the count beside its name */
    return `<li class="hb-dd-step"><div class="hb-dd-sh"><span class="hb-dd-i">${i + 1}</span><b>${_hbE(st.title)}</b><span class="hb-grow"></span>${door}</div>
      ${st.why ? `<div class="hb-quiet">${_hbE(i18t('hb_dd_why', { why: st.why }))}</div>` : ''}${st.lines.length ? `<ul>${st.lines.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}</li>`;
  }).join('');
  const working = busy ? `<li class="hb-dd-step is-busy"><span class="hb-quiet">${_hbE(i18t('hb_dd_working', { n: run.steps.length + 1 }))}</span></li>` : '';
  const how = `<details class="hb-how hb-dd-how"${busy || !run.summary ? ' open' : ''}><summary>${_hbE(i18t('hb_how_title'))} · ${_hbE(i18tn('hb_dd_steps', run.steps.length, { n: run.steps.length }))}</summary><ol class="hb-dd-steps">${steps}${working}</ol></details>`;
  let ans = '';
  if (run.state === 'err') ans = `<div class="hb-why is-err"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_answer'))}</span></div><p>${_hbE(run.err)}</p></div>`;
  else if (run.summary) ans = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_answer'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: run.at }))}</span></div>
    <div class="hb-why-b">${(typeof aiRichText === 'function') ? aiRichText(run.summary) : _hbE(run.summary)}</div>
    <div class="hb-why-f"><span class="${run.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(run.dropped ? i18tn('hb_cx_dropped', run.dropped, { n: run.dropped }) : i18t('hb_cx_ok'))}</span>${run.notice ? `<span>${_hbE(run.notice)}</span>` : ''}</div></div>`;
  else if (!busy) ans = `<div class="hb-why is-err"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_answer'))}</span></div><p>${_hbE(i18t('hb_dd_empty'))}</p></div>`;
  const add = run.cards.length ? `<div class="hb-dd-add">${run.added ? `<span class="hb-quiet">${_hbE(i18tn('hb_dd_added', run.cards.length, { n: run.cards.length }))}</span>`
    : `<button type="button" class="ui-btn ui-btn-sm" data-hb-dd-add="${_hbE(run.id)}">${_hbE(i18tn('hb_dd_add', run.cards.length, { n: run.cards.length }))}</button><span class="hb-quiet">${_hbE(run.cards.map(c => c.title || i18t('hb_dd_card')).join(' · ').slice(0, 200))}</span>`}</div>` : '';
  const next = run.next.length ? `<div class="hb-nx"><span class="hb-nx-l">${_hbE(i18t('hb_nx_label'))}</span>${run.next.map(q => `<button type="button" class="hb-nx-q" data-hb-next="${_hbE(q)}">${_hbE(q)}</button>`).join('')}</div>` : '';
  return `<div class="hb-dd" data-hb-dd="${_hbE(run.id)}"><p class="hb-dd-q">${_hbE(run.q)}</p>${ans}${add}${how}${next}</div>`;
}

/* ============================================================
   THE ACTS — every one changes this person's board, or presses a door the
   product already has. NONE WRITES A CONTRACT.
   ============================================================ */
function hbHost(){ return document.getElementById('hb-board'); }
function hbPage(){ return document.getElementById('ig-page') || document.getElementById('hb-page'); }
/* Paint the board's inside and nothing else. The reader's scroll inside the
   board comes back, unless the paint was a dig, which scrolls to the dig. */
/* A PRESS THAT REPAINTS THE BOARD KEEPS THE KEYBOARD WHERE IT WAS (the
   fault keyboard-reach exists for: a rebuilt card drops focus onto the body
   and a keyboard reader is thrown to the top). The pressed control is found
   again by what it IS — its own data-hb-* attribute — and a dig-in that
   opened takes focus on its first crumb instead. */
const HB_FOCUS_KEYS = ['data-hb-dig', 'data-hb-act', 'data-hb-prep', 'data-hb-crumb', 'data-hb-watch', 'data-hb-lens', 'data-hm-agent', 'data-hb-rc', 'data-hb-rset', 'data-hb-rtrend', 'data-hb-digbig', 'data-hb-rmore'];
function hbFocusKey(el){
  if (!el || !el.getAttribute) return null;
  const pid = el.closest && el.closest('[data-hb-pid]');
  for (const k of HB_FOCUS_KEYS){ const v = el.getAttribute(k); if (v != null) return { k, v, pid: pid ? pid.getAttribute('data-hb-pid') : null }; }
  return null;
}
function hbFocusFind(root, key){
  if (!root || !key) return null;
  const sel = `[${key.k}="${(window.CSS && CSS.escape) ? CSS.escape(key.v) : key.v}"]`;
  const scope = key.pid ? root.querySelector(`[data-hb-pid="${(window.CSS && CSS.escape) ? CSS.escape(key.pid) : key.pid}"]`) : root;
  return scope ? scope.querySelector(sel) : null;
}
function hbPaintBoard(opts){
  const host = hbHost(); if (!host) return;
  const top = host.scrollTop;
  const act = document.activeElement;
  const had = (act && host.contains(act)) ? hbFocusKey(act) : null;
  host.innerHTML = hbBoardHtml();
  hbPaintHead();
  /* an expanded chart takes the room: the dock steps aside, as it does in
     Present, and comes back on the same button */
  const pg = hbPage();
  if (pg){ const big = !!document.querySelector('#hb-focus .hb-dig.is-big');
    if (pg.classList.contains('hb-dig-big') !== big){ pg.classList.toggle('hb-dig-big', big); if (typeof igFitSplit === 'function') setTimeout(() => { try { igFitSplit(); } catch (_){} }, 60); } }
  if (had){
    const dig = (opts && opts.jump === 'focus') ? document.querySelector('#hb-focus [data-hb-crumb]') : null;
    const back = dig || hbFocusFind(host, had);
    if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (_){}
  }
  const jump = opts && opts.jump;
  if (jump === 'focus'){ const f = document.getElementById('hb-focus'); if (f) host.scrollTop = Math.max(0, f.offsetTop - 12); }
  else if (jump === 'top') host.scrollTop = 0;
  else host.scrollTop = top;
  _hbFocusNew = false; _hbNewPanel = null;
  hbPaintHead();
}
/* The head's parts that follow the board — the lens chip and the faces —
   repainted in place, so the head row is never rebuilt under the reader. */
function hbPaintHead(){
  const s = hbS();
  const hello = document.querySelector('#hb-head .hb-hello'); if (hello){ const h = hbHelloInner(); if (hello.innerHTML !== h) hello.innerHTML = h; }
  document.querySelectorAll('[data-hb-face]').forEach(b => b.setAttribute('aria-selected', String(b.getAttribute('data-hb-face') === s.face)));
  document.querySelectorAll('[data-hb-screen]').forEach(b => b.setAttribute('aria-pressed', String(b.getAttribute('data-hb-screen') === s.screen)));
  const gb = document.getElementById('hb-groupby'); if (gb) gb.hidden = s.face !== 'explorer';
  const chip = document.querySelector('.hb-counting');
  if (chip){ const h = hbCountChipHtml(); if (chip.innerHTML !== h) chip.innerHTML = h; }
}
function hbApplyScreen(){
  const pg = hbPage(); if (!pg) return;
  pg.classList.toggle('hb-light', hbS().screen === 'light');
  pg.classList.toggle('hb-dark', hbS().screen !== 'light');
}
function hbApplyFace(){
  const s = hbS(), host = hbHost(); if (!host) return;
  host.hidden = s.face !== 'board';
  const pg = hbPage(); if (pg) pg.setAttribute('data-hb-side', s.face);
}
/* Home on the desktop. The page is Explorer's (renderIntel draws it with
   Home's head and calls hbAfterMount); a stage without Explorer gets the
   board on its own, so a reading of Home never depends on the map. */
function hbMount(){
  if (typeof renderIntel === 'function' && document.getElementById('content')){ renderIntel(); return; }
  const content = document.getElementById('content'); if (!content) return;
  content.innerHTML = `<div id="hb-page" class="view-enter hb-page">${hbHeadHtml('')}<div class="hb-col"><div id="hb-board" class="hb-board scroll-thin"></div></div></div>`;
  hbAfterMount();
}
/* A REPAINT IS NOT A NAVIGATION. Home is repainted by the app whenever the
   book changes underneath it (a save landing, a background refresh); that
   repaints the BOARD and nothing else, so a question half-typed in the
   Copilot panel and a map half-turned are left exactly where they were. The
   page is built again only when it is not there, when the side of the screen
   changed, or when the language did. */
function hbRender(){
  const pg = hbPage(), s = hbS();
  const lang = (typeof langId === 'function') ? langId() : '';
  if (pg && hbHost() && pg.getAttribute('data-hb-side') === s.face && pg.getAttribute('data-hb-lang') === lang){
    if (s.face === 'board') hbPaintBoard(); else hbPaintHead();
    return;
  }
  hbMount();
}
/* A door that still names the map (Insights' old tab, intelGoTab('map'),
   Copilot's own "show me the map") lands here: Home, on its Explorer side. */
/* ANALYZE CONTRACT FROM THE BOARD (Young, 4 Oct 2026): the card's button and
   "let me ask questions about MK-398" both land here — Explorer, with that
   contract's paper up and the panel ready for the first question. The ONE
   door stays Explorer's own igAnalyze; this only takes the reader there. */
function hbAnalyze(id){
  if (!id || !hbContract(id)) return;
  const s = hbS(); s.face = 'explorer'; hbSave();
  hbMount();
  if (typeof igAnalyze === 'function') Promise.resolve(igAnalyze(id)).then(() => {
    const box = document.getElementById('igd-input'); if (box) try { box.focus({ preventScroll: true }); } catch (_){}
  }).catch(() => {});
}
/* ASK COPILOT FROM THE BOARD (Young, 4 Oct 2026): the question goes into the
   Copilot panel beside the board, ready — never the chat window outside the
   page. The contract's reference rides in the words so Copilot reads that
   contract. Typed words already in the box are never overwritten: the
   reader is told so, in one line, where they look. */
function hbAskInPanel(q, id){
  q = String(q || '').trim(); if (!q) return false;
  const c = id ? hbContract(id) : null;
  const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : '';
  const text = ref && q.indexOf(ref) < 0 ? `${q} (${ref})` : q;
  const ok = (typeof intelAskReady === 'function') ? intelAskReady(text) : false;
  if (!ok && typeof toast === 'function') toast(i18t('hb_ask_kept_typed'), 'warn');
  return ok;
}
function hbOpenExplorer(){
  const s = hbS(); s.face = 'explorer'; hbSave();
  if (typeof setView === 'function') setView('dashboard'); else hbMount();
}
function hbAfterMount(){
  const pg = hbPage(); if (pg) pg.setAttribute('data-hb-lang', (typeof langId === 'function') ? langId() : '');
  hbApplyScreen(); hbApplyFace();
  hbPaintBoard();
  hbToolsPaint();
  hbGiftsLoad();
  if (typeof setActiveNav === 'function') setActiveNav('dashboard');
}
function hbSetFace(f){
  if (!HB_FACES.includes(f)) return;
  const s = hbS(); if (s.face === f) return;
  const kb = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-hb-face') != null;
  s.face = f; hbSave();
  /* turning to the map is an ARRIVAL, like pressing its tab on Insights was:
     the legend comes in closed (renderIntel's own rule for an arrival) */
  if (f === 'explorer' && window.intel){ intel.legendFolded = true; hbLensOnMap(); }
  hbMount();
  /* the whole page is drawn again: the pressed half keeps the keyboard */
  if (kb){ const b = document.querySelector(`[data-hb-face="${f}"]`); if (b) try { b.focus({ preventScroll: true }); } catch (_){} }
}
function hbSetLens(lens){
  if (!HB_LENSES.includes(lens)) return;
  const s = hbS(); s.lens = lens; hbSave();
  hbLensOnMap();
  hbPaintBoard();
  if (s.face === 'explorer' && typeof rebuildIntelGraph === 'function') rebuildIntelGraph();
}
/* THE LENS REACHES THE MAP AS ONE OF EXPLORER'S OWN LENSES, marked as the
   board's, so it shows as a chip the reader can lift there too. */
function hbLensOnMap(){
  if (!window.intel || !Array.isArray(intel.lenses)) return;
  const lens = hbS().lens;
  intel.lenses = intel.lenses.filter(l => !l.hb);
  if (lens !== 'all') intel.lenses.push({ id: 'hblens', hb: true, on: true, action: 'filter', label: i18t('hb_lens_' + lens), ids: hbBook(lens).map(c => c.id), badges: null });
  const ids = hbCountIds(lens);
  if (ids) intel.lenses.push({ id: 'hbcount', hb: true, on: true, action: 'filter', label: hbCountLabel(lens), ids: [...ids], badges: null });
}
/* SHOW THESE ON THE MAP: Explorer's own lens, lighting the set and dimming
   the rest, then the flip. A lens is added once (addLens' own rule). */
function hbShowOnMap(ids, label){
  const list = String(ids || '').split(',').filter(Boolean);
  if (!list.length || !window.intel) return;
  /* NARROWED, not lit (the owner, 3 Oct 2026: "I asked for Juno contracts and
     it shows me all these contracts"): the map shows these and nothing else;
     the map's own "Show everything" brings the rest back. */
  const s = hbS(); s.face = 'explorer'; hbSave();
  hbLensOnMap();
  /* the count already narrows the map to this very set: no second chip */
  const same = intel.lenses.find(l => l.hb && l.id === 'hbcount' && l.ids.length === list.length && l.ids.every(id => list.includes(id)));
  if (!same && typeof addLens === 'function'){ intel.lenses = intel.lenses.filter(l => l.action !== 'filter' || l.hb); addLens({ ids: list, label: label || i18tn('hb_n_contracts', list.length, { n: list.length }), action: 'filter' }); }
  hbMount();
}
/* A BOOK DOOR PRESSED WHILE COUNTING OPENS WITHIN THE COUNT (Young, 4 Oct
   2026: "when I press any one of the cards, the numbers return to the whole
   list"): a figure, a stage or a panel row is drawn off the counted set, so
   its press nests under the count — Board › Juno › Live contracts — instead
   of starting a fresh trail that drops Juno. A typed question still starts
   afresh (`keep` is the press's, never the asker's). */
function hbDig(key, deeper, keep){
  const s = hbS();
  const path = s.path || [];
  const ck = (keep && !deeper && !/^(q:|ls$)/.test(hbRootKey(key)) && hbCountLabel(s.lens)) ? hbCountKey() : null;
  const at = ck ? path.lastIndexOf(ck) : -1;
  s.path = deeper ? path.concat(key).slice(-HB_PATH_MAX)
    : at >= 0 ? path.slice(0, at + 1).concat(key === ck ? [] : [key]).slice(-HB_PATH_MAX)
    : [key];
  hbSave(); _hbFocusNew = true; _hbWatchForm = null;
  if (s.face !== 'board'){ s.face = 'board'; hbSave(); hbMount(); return; }
  hbPaintBoard({ jump: 'focus' });
  /* A LIGHT ROW IS LOADED WHOLE before its card is believed: the brief and
     the trail ride the heavy record (ensureFull, the light list's rule). */
  if (/^c:/.test(key)){
    const c = hbContract(key.slice(2));
    if (c && c._light && !c._loaded && typeof ensureFull === 'function')
      Promise.resolve(ensureFull(c)).then(() => { if (state.view === 'dashboard' && (hbS().path || []).slice(-1)[0] === key) hbPaintBoard(); }).catch(() => {});
  }
}
function hbAddPanel(kind, opts){
  const s = hbS();
  let p = s.panels.find(x => x.kind === kind);
  let left = null;
  if (p){ s.panels.splice(s.panels.indexOf(p), 1); }
  else { p = { id: 'p' + (++s.seq), kind, split: false, big: false };
    if (s.panels.length >= HB_PANELS_MAX){ left = s.panels.shift(); } }
  if (opts && opts.split) p.split = true;
  s.panels.push(p); _hbNewPanel = p.id; hbSave();
  return { p, left };
}

/* ============================================================
   TODAY'S INSIGHTS — THE SHELF (Young picked "Shelf" by name; "Build it",
   4 Oct 2026)
   ============================================================
   Once a day, the first time Home is painted, HaTi looks at a few measures
   and offers the ones that are OUTSIDE THEIR NORMAL RANGE, as small pictures
   inside Prepared by Copilot — the one list where Copilot's prepared work
   already lands, so nothing arrives uninvited among the panels the reader
   chose.
   YOURS, MEASURED (Young picked it by name, 4 Oct 2026: "hati is a company
   platform and not just me"): a measure is read first over the contracts
   THIS PERSON OWNS (contractOwnedBy — the board question "my contracts")
   against what has been normal for them; what is unusual there comes first.
   A place left over goes to something unusual in the COMPANY's book, marked
   so. Someone who owns fewer than HB_INS_MINE_MIN contracts, or nearly all
   of them (HB_INS_MINE_ALL), is shown the company's, and the row says which.
   NORMAL IS THE BOOK'S OWN: the columns the chart itself counted
   (hbColsSvg hands them back) over the past year — the range of every month
   but the latest, the highest and lowest dropped. The latest month is
   unusual when it lies outside that range by HB_INS_MARGIN. No range is made
   from fewer than HB_INS_NORM_PTS months carrying HB_TREND_MIN_N contracts:
   too little history is said in words, never guessed. Renewals read
   quarters, a year back and a year ahead.
   A QUIET DAY IS SAID, NOT FILLED: nothing unusual → the row says so, and the
   usual pictures wait behind one press. They open by themselves only while
   the book is too young to have a normal at all.
   IT SPENDS NOTHING AND NO MODEL WRITES A WORD. Every picture is one of the
   board's OWN questions (HB_INS[k].q, or .qm for "my contracts"), read by
   the board's own free reader, counted by its own arithmetic and drawn by
   its own charts; the sentence is HaTi's. Open is the existing dig-in (ONE
   DOOR), Keep is a panel that counts again. Who holds the value keeps no
   history by month, so it is never called unusual — it is a usual picture.
   WHAT INTERESTS YOU TEACHES IT: a shape kept rises in tomorrow's ranking,
   a shape let go rests HB_INS_REST_DAYS. Both live on this person's own board
   record; nothing is sent to anybody.
   Kept views also ride the daily brief: hbKeptSync hands the server what Home
   last counted (PUT /api/home/kept), and the mail says "as of" that day. */
const HB_INS_MAX = 3, HB_INS_REST_DAYS = 30;
const HB_INS_NORM_PTS = 6, HB_INS_NORM_MONTHS = 12, HB_INS_RECENT_MONTHS = 3, HB_INS_MARGIN = 0.05;
const HB_INS_REN_MIN = 4, HB_INS_REN_PTS = 6, HB_INS_REN_LIFT = 1.5;
const HB_INS_MINE_MIN = 10, HB_INS_MINE_ALL = 0.9;
const HB_INS = {
  pay:    { q: 'average payment days of signed contracts by month signed with a trend', qm: 'average payment days of my signed contracts by month signed with a trend', m: 'payDays' },
  sign:   { q: 'average days to sign by month signed with a trend', qm: 'average days to sign my contracts by month signed with a trend', m: 'daysToSign' },
  rounds: { q: 'average rounds by month signed with a trend', qm: 'average rounds of my contracts by month signed with a trend', m: 'rounds' },
  ren:    { q: 'contracts ending by quarter', qm: 'my contracts ending by quarter' },
  cp:     { q: 'value by counterparty', recipe: { pic: 'blocks', measure: 'value', split: { by: 'counterparty' } } },
};
const HB_INS_SHAPES = Object.keys(HB_INS);
/* the shapes that have a normal to be measured against */
const HB_INS_MEASURED = ['pay', 'sign', 'rounds', 'ren'];
/* the rule the day's pictures were chosen by: raised when the choosing
   changes, so a choice saved under the old rule is made again at once */
const HB_INS_V = 3;
/* a picture's id: its shape, and ".mine" when it is about the reader's own */
function hbInsId(k, mine){ return k + (mine && HB_INS[k] && HB_INS[k].qm ? '.mine' : ''); }
function hbInsOf(id){
  const m = /^([a-z]+)(\.mine)?$/.exec(String(id || ''));
  return m && HB_INS[m[1]] ? { k: m[1], mine: !!m[2] && !!HB_INS[m[1]].qm } : null;
}
function hbInsKey(k, mine){ return 'q:' + (mine && HB_INS[k].qm ? HB_INS[k].qm : HB_INS[k].q); }
function hbInsViewWord(k, mine){ return i18t('hb_ins_view_' + k + (mine && HB_INS[k] && HB_INS[k].qm ? '_mine' : '')); }
/* a proposal that needs a picture its words do not name carries the recipe */
function hbInsRecipeOn(k){
  const r = HB_INS[k] && HB_INS[k].recipe; if (!r) return;
  const s = hbS(); s.recipe = s.recipe || {}; const key = hbInsKey(k);
  hbCardSet(key, r, { seed: true });
}
/* the board's own chart for a question, drawn exactly as the dig-in draws it
   (the shelf may add its normal range and the column it is about) */
function hbInsChart(key, extra){
  const D = hbDigData(key, 'all'); if (!D || D.kind !== 'list') return null;
  const cs0 = hbListOf(D.ids, 'all'), P = Object.assign({}, hbPlan(D), extra || {});
  let R = null, cs = cs0;
  try { if (['cols', 'blocks', 'bars', 'ring'].includes(P.pic)){ const run = hbChartRun(D, cs0, P); R = run.R; cs = run.cs; } } catch (_){ R = null; }
  return R ? { D, cs, P, R } : null;
}
/* WHOSE: the reader's own contracts, when there are enough of them to have a
   normal and they are not simply the whole company */
function hbInsScope(){
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  const book = hbBook('all').filter(c => c.status !== 'Declined');
  const n = me && typeof contractOwnedBy === 'function' ? book.filter(c => contractOwnedBy(c, me)).length : 0;
  return { n, all: book.length, mine: n >= HB_INS_MINE_MIN && n < HB_INS_MINE_ALL * book.length, few: n < HB_INS_MINE_MIN };
}
function hbMonthsBack(b, n){
  const y = Number(String(b).slice(0, 4)), m = Number(String(b).slice(5, 7)); if (!y || !m) return '';
  const t = y * 12 + (m - 1) - n; return Math.floor(t / 12) + '-' + String(t % 12 + 1).padStart(2, '0');
}
/* THE NORMAL RANGE of a month-by-month average, off the chart's own columns */
function hbInsNormal(R){
  if (!R || !Array.isArray(R.cols) || R.unit !== 'm' || !R.nowB) return null;
  const from = hbMonthsBack(R.nowB, HB_INS_NORM_MONTHS);
  const yr = R.cols.filter(c => !c.sofar && c.b >= from && c.b < R.nowB && c.n >= HB_TREND_MIN_N && c.y != null && isFinite(c.y));
  if (yr.length < HB_INS_NORM_PTS) return null;
  const last = yr[yr.length - 1];
  /* the latest month counted must be recent, or it is not this morning's news */
  if (last.b < hbMonthsBack(R.nowB, HB_INS_RECENT_MONTHS)) return null;
  const base = yr.slice(0, -1).map(c => c.y).sort((a, b) => a - b);
  const mid = base.length >= 5 ? base.slice(1, -1) : base;
  const lo = mid[0], hi = mid[mid.length - 1], ys = yr.map(c => c.y);
  const edge = last.y > hi ? hi : last.y < lo ? lo : null;
  const off = edge == null ? 0 : Math.abs(last.y - edge) / Math.max(Math.abs(edge), 1e-9);
  return { lo, hi, last, n: yr.length, off, out: off >= HB_INS_MARGIN ? (last.y > hi ? 'above' : 'below') : '',
    rank: last.y >= Math.max(...ys) ? 'high' : last.y <= Math.min(...ys) ? 'low' : '' };
}
/* THE NORMAL RANGE of contracts ending in a quarter: the busiest of the next
   four quarters against the others, a year back and a year ahead */
function hbInsRenNormal(R){
  if (!R || !Array.isArray(R.cols) || R.unit !== 'q' || !R.nowB) return null;
  const i0 = R.cols.findIndex(c => c.b === R.nowB); if (i0 < 0) return null;
  const ahead = R.cols.slice(i0, i0 + 4), behind = R.cols.slice(Math.max(0, i0 - 4), i0);
  if (ahead.length + behind.length < HB_INS_REN_PTS) return null;
  const peak = ahead.reduce((a, c) => ((c.y || 0) > (a.y || 0) ? c : a), ahead[0]);
  const base = behind.concat(ahead.filter(c => c !== peak)).map(c => c.y || 0).sort((a, b) => a - b);
  const mid = base.length >= 5 ? base.slice(1, -1) : base;
  const lo = mid[0], hi = mid[mid.length - 1], y = peak.y || 0;
  const out = y >= HB_INS_REN_MIN && y > hi && y >= HB_INS_REN_LIFT * Math.max(hi, 1) ? 'above' : '';
  return { lo, hi, last: peak, n: ahead.length + behind.length, off: (y - hi) / Math.max(hi, 1), out, rank: '' };
}
/* ONE MEASURE, ONE SCOPE: unusual (a finding), usual (calm), or no normal
   yet (none). A finding carries the picture with its range drawn on it. */
function hbInsFinding(k, mine){
  if (!HB_INS_MEASURED.includes(k) || (mine && !HB_INS[k].qm)) return null;
  const key = hbInsKey(k, mine), ren = k === 'ren';
  const C0 = hbInsChart(key); if (!C0) return { shape: k, mine, none: true };
  const N = ren ? hbInsRenNormal(C0.R) : hbInsNormal(C0.R);
  if (!N) return { shape: k, mine, none: true };
  if (!N.out) return { shape: k, mine, calm: true };
  const C = hbInsChart(key, { band: [N.lo, N.hi], lit: N.last.b }) || C0;
  /* a range says its unit once: "42–44 days" */
  const m = HB_INS[k].m, fmt = v => ren ? _hbN(Math.round(v)) : hbMeasureFmt(m, v), lo = ren ? fmt(N.lo) : hbMeasureShort(m, N.lo);
  const when = hbBucketLabel(N.last.b, ren ? 'q' : 'm', false);
  let say = ren ? i18tn('hb_ins_s_ren_norm', Math.round(N.last.y || 0), { n: fmt(N.last.y || 0), q: when, lo, hi: fmt(N.hi) })
    : i18t(mine ? 'hb_ins_s_norm_mine' : 'hb_ins_s_norm', { v: fmt(N.last.y), when, lo, hi: fmt(N.hi) });
  /* yours beside the company's, for the same month, where the company counted it */
  if (mine && !ren){
    const co = hbInsChart(hbInsKey(k, false)), col = co && co.R && Array.isArray(co.R.cols) ? co.R.cols.find(c => c.b === N.last.b && c.n >= HB_TREND_MIN_N && c.y != null) : null;
    if (col) say += i18t('hb_ins_s_and_co', { c: fmt(col.y) });
  }
  return { shape: k, mine: !!mine, id: hbInsId(k, mine), C, N, score: Math.min(1, N.off * 2),
    tone: k === 'pay' ? '' : (ren || N.out === 'above') ? 'warn' : 'good',
    title: i18t('hb_ins_t_' + k + '_' + N.out, { q: when }), say,
    rank: N.rank ? i18t('hb_ins_rank_' + N.rank, { n: _hbN(N.n) }) : '' };
}
/* A USUAL PICTURE: what a measure shows, named by WHAT IT SHOWS, never by a
   claim — the press behind "Show the usual pictures", and the shelf of a book
   too young to have a normal (Young, 4 Oct 2026: "i do not see the graphs") */
function hbInsCandidate(k){
  const book = hbBook('all').filter(c => c.status !== 'Declined');
  if (!book.length || !HB_INS[k]) return null;
  const view = (C, say) => ({ shape: k, id: hbInsId(k, false), C, plain: true, tone: '', title: i18t('hb_ins_view_' + k), say });
  if (k === 'pay' || k === 'sign' || k === 'rounds'){
    const C = hbInsChart(hbInsKey(k)); const T = C && C.R && C.R.trend; if (!T) return null;
    return view(C, i18t('hb_ins_s_trend', { from: hbMeasureFmt(HB_INS[k].m, T.y0), to: hbMeasureFmt(HB_INS[k].m, T.y1), n: _hbN(T.span), units: i18tn('hb_tr_units_' + T.unit, T.span, { n: T.span }) }));
  }
  if (k === 'ren'){
    const ags = (typeof agreementsIn === 'function') ? agreementsIn(book) : book;
    const byQ = new Map(); let total = 0;
    for (const c of ags){
      const e = (typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : c.expiry; const d = hbDays(e);
      if (d == null || d < 0 || d > 365) continue;
      const b = hbBucketOf(String(e).slice(0, 10), 'q'); byQ.set(b, (byQ.get(b) || 0) + 1); total++;
    }
    const top = [...byQ.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))[0];
    if (!top) return null;
    const C = hbInsChart(hbInsKey(k)); if (!C) return null;
    return view(C, i18tn('hb_ins_s_ren_plain', top[1], { n: _hbN(top[1]), t: _hbN(total), q: hbBucketLabel(top[0], 'q', false) }));
  }
  if (k === 'cp'){
    if (!hbMoneyOk()) return null;
    const by = new Map(); let tot = 0;
    for (const c of book){ const v = hbValueOfOne(c); if (!v) continue; const g = hbGroupOf(c, 'counterparty') || ''; if (!g) continue; by.set(g, (by.get(g) || 0) + v); tot += v; }
    const rows = [...by.entries()].sort((a, b) => b[1] - a[1]);
    if (!tot || rows.length < 2) return null;
    hbInsRecipeOn(k);
    const C = hbInsChart(hbInsKey(k)); if (!C) return null;
    return view(C, i18t('hb_ins_s_cp_plain', { who: rows[0][0], pct: Math.round(rows[0][1] / tot * 100) }));
  }
  return null;
}
/* worked out once per paint: hbBoardHtml empties it, so every picture and
   every sentence is counted off the book as it stands now */
let _hbInsMemo = new Map();
function hbInsCandidateMemo(k){
  if (!_hbInsMemo.has(k)){ let v = null; try { v = hbInsCandidate(k); } catch (_){ v = null; } _hbInsMemo.set(k, v); }
  return _hbInsMemo.get(k);
}
function hbInsFindingMemo(k, mine){
  const mk = 'F:' + k + (mine ? '.mine' : '');
  if (!_hbInsMemo.has(mk)){ let v = null; try { v = hbInsFinding(k, !!mine); } catch (_){ v = null; } _hbInsMemo.set(mk, v); }
  return _hbInsMemo.get(mk);
}
/* which book, and whose: its size, a short hash of its ids, and the reader */
function hbInsBookSig(){
  let h = 5381; const cs = (window.state && state.contracts) || [];
  for (const c of cs){ const id = String((c && c.id) || ''); for (let i = 0; i < id.length; i++) h = ((h * 33) ^ id.charCodeAt(i)) >>> 0; }
  const me = (typeof currentUser === 'function') ? currentUser() : null;
  return cs.length + ':' + h.toString(36) + ':' + String((me && me.id) || '');
}
function hbInsResting(k){
  const off = hbS().insOff[k]; if (!off) return false;
  const d = (Date.parse(hbToday()) - Date.parse(off)) / 864e5;
  return isFinite(d) && d < HB_INS_REST_DAYS;
}
/* TODAY'S FINDINGS, chosen once a day and kept all day: a proposal that no
   longer holds by the afternoon stands down rather than being swapped.
   CHOSEN AGAIN when the book is not the one it was chosen from (the first
   paint after signing in can come before the server's list; a contract added
   later is a different book; another person signing in is a different
   reader) and when it was chosen by an older rule (HB_INS_V). An empty choice
   is a quiet day, and is kept. */
function hbInsightsToday(){
  if (!(window.state && Array.isArray(state.contracts) && state.contracts.length)) return [];
  const s = hbS(), day = hbToday(), n = hbInsBookSig();
  if (!s.ins || s.ins.day !== day || s.ins.n !== n || s.ins.v !== HB_INS_V){
    const S = hbInsScope();
    const boost = k => 0.25 * Math.min(4, s.insKept[k] || 0);
    const rank = xs => xs.filter(x => x && x.id && !hbInsResting(x.shape)).sort((a, b) => (b.score + boost(b.shape)) - (a.score + boost(a.shape)));
    const mineF = S.mine ? HB_INS_MEASURED.map(k => hbInsFindingMemo(k, true)) : [];
    const coF = HB_INS_MEASURED.map(k => hbInsFindingMemo(k, false));
    const yours = rank(mineF);
    const theirs = rank(coF.filter(x => x && !yours.some(y => y.shape === x.shape)));
    /* no measure, yours or the company's, could find a normal: the book is too
       young to say what is unusual, so the usual pictures open by themselves */
    const young = !mineF.concat(coF).some(x => x && !x.none);
    const was = s.ins && s.ins.day === day ? s.ins.usual : null;
    s.ins = { day, n, v: HB_INS_V, list: yours.concat(theirs).slice(0, HB_INS_MAX).map(x => x.id),
      scope: S.mine ? 'mine' : S.few ? 'few' : 'co', young, usual: young ? day : was };
    hbSave();
  }
  return s.ins.list.map(id => { const o = hbInsOf(id); return o ? hbInsFindingMemo(o.k, o.mine) : null; }).filter(x => x && x.id);
}
/* THE USUAL PICTURES: every shape not already on the shelf as a finding */
function hbInsUsual(I){
  const on = new Set((I || []).map(x => x.shape));
  return HB_INS_SHAPES.filter(k => !on.has(k) && !hbInsResting(k)).map(k => hbInsCandidateMemo(k)).filter(Boolean);
}
function hbInsUsualOpen(){ const ins = hbS().ins; return !!(ins && ins.usual === hbToday()); }
/* why a finding is on the shelf, in HaTi's words */
function hbInsWhy(x){
  const scope = (hbS().ins || {}).scope;
  if (!x.mine && scope === 'mine'){ const y = hbInsFindingMemo(x.shape, true); return i18t(y && y.none ? 'hb_ins_why_co_thin' : 'hb_ins_why_co_left'); }
  return i18t('hb_ins_why_' + (x.shape === 'ren' ? 'ren_' : '') + (x.mine ? 'mine' : 'co'));
}
/* A PICTURE, NOT A DOOR-FIELD: the thumbnail is the chart's own drawing with
   its doors taken off, so the whole picture is one press (Open). */
function hbInsThumb(R){
  return String((R && R.body) || '').replace(/\sdata-hb-dig="[^"]*"/g, '').replace(/\stabindex="[^"]*"/g, '').replace(/\srole="button"/g, '')
    .replace(/<title>[^<]*<\/title>/g, '');
}
function hbInsRowHtml(I){
  const U = hbInsUsual(I);
  if (!I.length && !U.length) return '';
  const ins = hbS().ins || {}, open = hbInsUsualOpen();
  const sub = I.length ? (ins.scope === 'mine' ? 'hb_ins_sub_mine' : ins.scope === 'few' ? 'hb_ins_sub_few' : 'hb_ins_sub')
    : ins.young ? 'hb_ins_sub_young' : 'hb_ins_sub_quiet';
  const btn = I.length
    ? `<button type="button" class="hb-btn" data-hb-ins="open" data-hb-ins-k="${_hbE(I[0].id)}">${_hbE(i18t('hm_ag_review'))}</button>`
    : `<button type="button" class="hb-btn" data-hb-ins="usual" aria-pressed="${open}">${_hbE(open ? i18t('hb_ins_usual_hide') : i18t('hb_ins_usual_n', { n: _hbN(U.length) }))}</button>`;
  return `<div class="hb-ag hb-ins-row">
    <span class="hb-ag-ic" aria-hidden="true"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"><use href="#i-insight"/></svg></span>
    <span class="hb-ag-b"><span class="hb-ag-t">${_hbE(i18t('hb_ins_title'))}${I.length ? ` <span class="hb-pill">${_hbN(I.length)}</span>` : ''}</span><span class="hb-ag-s">${_hbE(i18t(sub))}</span></span>
    <span></span>${btn}</div>`;
}
function hbShelfHtml(I){
  const s = hbS(), open = hbInsUsualOpen(), U = hbInsUsual(I);
  const cards = I.concat(open ? U : []);
  /* the places no finding filled say so, with the usual pictures one press away */
  const calm = I.length && I.length < HB_INS_MAX && U.length
    ? `<div class="hb-ins-calm${!open && I.length === 1 ? ' is-wide' : ''}">${open ? '' : `<span><b>${_hbE(i18t('hb_ins_calm'))}</b></span>`}
      <button type="button" class="hb-link" data-hb-ins="usual" aria-pressed="${open}">${_hbE(open ? i18t('hb_ins_usual_hide') : i18t('hb_ins_usual_n', { n: _hbN(U.length) }))}</button></div>` : '';
  if (!cards.length) return '';
  const kept = new Set(s.panels.filter(p => p.kind === 'view').map(p => p.key));
  const scope = (s.ins || {}).scope, mineN = scope === 'mine' ? hbInsScope().n : 0;
  return `<div class="hb-shelf">${cards.map(x => { const id = x.id, isKept = kept.has(hbInsKey(x.shape, x.mine));
    const chips = x.plain ? '' : (x.mine ? `<span class="hb-ins-scope">${_hbE(i18t('hb_ins_scope_mine', { n: _hbN(mineN) }))}</span>` : scope === 'mine' ? `<span class="hb-ins-scope">${_hbE(i18t('hb_ins_scope_co'))}</span>` : '')
      + (x.rank ? `<span class="hb-chip${x.tone === 'good' ? ' is-good' : x.tone === 'warn' ? ' is-warn' : ''}">${_hbE(x.rank)}</span>` : '');
    const tone = x.plain ? ' is-plain' : x.tone === 'warn' ? ' is-warn' : x.tone === 'good' ? ' is-good' : '';
    return `<article class="hb-ins${tone}" data-hb-ins-card="${_hbE(id)}">
      ${chips ? `<div class="hb-ins-top">${chips}</div>` : ''}<div class="hb-ins-t">${_hbE(x.title)}</div>
      <button type="button" class="hb-ins-pic" data-hb-ins="open" data-hb-ins-k="${_hbE(id)}" title="${_hbE(i18t('hb_ins_open_tip'))}" aria-label="${_hbE(x.title + ' — ' + i18t('hb_ins_open'))}">${hbInsThumb(x.C.R)}</button>
      <div class="hb-ins-f">${_hbE(x.say)}</div>${x.plain ? '' : `<div class="hb-ins-why">${_hbE(hbInsWhy(x))}</div>`}
      <div class="hb-ins-acts">
        <button type="button" class="hb-btn is-sm" data-hb-ins="keep" data-hb-ins-k="${_hbE(id)}"${isKept ? ` disabled title="${_hbE(i18t('hb_ins_kept_tip'))}"` : ` title="${_hbE(i18t('hb_ins_keep_tip'))}"`}>${_hbE(i18t(isKept ? 'hb_ins_kept' : 'hb_ins_keep'))}</button>
        <button type="button" class="hb-btn is-sm" data-hb-ins="open" data-hb-ins-k="${_hbE(id)}">${_hbE(i18t('hb_ins_open'))}</button>
        <button type="button" class="hb-link" data-hb-ins="why" data-hb-ins-k="${_hbE(id)}" title="${_hbE(i18t('hb_c_ask_cost'))}">${_hbE(i18t('hb_ins_why'))}</button>
        <span class="hb-grow"></span>
        <button type="button" class="hb-ib hb-ins-x" data-hb-ins="go" data-hb-ins-k="${_hbE(id)}" title="${_hbE(i18t('hb_ins_letgo'))}" aria-label="${_hbE(i18t('hb_ins_letgo'))}">${_hbX}</button></div></article>`; }).join('')}${calm}</div>`;
}
/* A KEPT VIEW IS A PANEL: the question, its recipe, a name that stays true
   (the proposal's sentence was true the morning it was made). */
function hbPanelWord(p){ return p && p.kind === 'view' ? (p.shape && HB_INS[p.shape] ? hbInsViewWord(p.shape, p.mine) : p.title || '') : i18t(HB_KINDS[p.kind].word); }
function hbAddView(k, mine){
  const s = hbS(), key = hbInsKey(k, mine);
  let p = s.panels.find(x => x.kind === 'view' && x.key === key), left = null;
  if (p) s.panels.splice(s.panels.indexOf(p), 1);
  else { p = { id: 'p' + (++s.seq), kind: 'view', key, title: hbInsViewWord(k, mine), shape: k, mine: !!(mine && HB_INS[k].qm), recipe: HB_INS[k].recipe ? JSON.parse(JSON.stringify(HB_INS[k].recipe)) : null, split: false, big: false };
    if (s.panels.length >= HB_PANELS_MAX) left = s.panels.shift(); }
  s.panels.push(p); _hbNewPanel = p.id; hbSave();
  return { p, left };
}
function hbViewPanelHtml(p, lens){
  if (p.recipe) hbCardSet(p.key, p.recipe, { seed: true });
  const D = hbDigData(p.key, lens);
  const body = D ? (D.kind === 'list' ? hbRecipeRowHtml(D, hbPlan(D)) : '') + `<div class="hb-cb">${hbDigBodyHtml(D, lens, !!p.big)}</div>` : `<div class="hb-cb"><div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div></div>`;
  return `<section class="hb-card hb-panel hb-view${p.big ? ' is-big' : ''}${p.id === _hbNewPanel ? ' is-new' : ''}" data-hb-pid="${_hbE(p.id)}">
    <header class="hb-ch"><span class="hb-ct">${_hbE(hbPanelWord(p))}</span>${hbVerBadgeHtml(p)}<span class="hb-grow"></span>
      ${p.verified ? '' : /^cd:/.test(p.key) ? `<span class="hb-src" title="${_hbE(i18t('hb_cd_src_tip'))}">${_hbE(i18t('hb_cd_src'))}</span>` : `<span class="hb-src" title="${_hbE(i18t('hb_ins_src_tip'))}">${_hbE(i18t('hb_ins_src'))}</span>`}
      ${hbMayVerify(p) ? `<span class="hb-more-w"><button type="button" class="hb-ib" data-hb-act="more" aria-haspopup="menu" aria-expanded="${_hbMoreMenu === p.id}" title="${_hbE(i18t('hb_p_more'))}" aria-label="${_hbE(i18t('hb_p_more'))}">⋯</button>${_hbMoreMenu === p.id ? `<span class="hb-pmenu" role="menu"><button type="button" role="menuitem" data-hb-act="verify">${_hbE(i18t('hb_ver_menu'))}${p.verified ? ' ✓' : ''}</button></span>` : ''}</span>` : ''}
      ${hbBigBtnHtml(p.big, 'data-hb-act="big"')}
      <button type="button" class="hb-ib hb-x" data-hb-act="x" title="${_hbE(i18t('hb_p_x'))}" aria-label="${_hbE(i18t('hb_p_x'))}">${_hbX}</button></header>
    ${_hbVerForm === p.id && hbMayVerify(p) ? hbVerFormHtml(p) : ''}${body}</section>`;
}
function hbInsAct(act, id){
  const s = hbS();
  if (act === 'usual'){ s.ins = s.ins || {}; s.ins.usual = hbInsUsualOpen() ? null : hbToday(); hbSave(); hbPaintBoard(); return; }
  const o = hbInsOf(id); if (!o) return;
  const k = o.k;
  if (act === 'open'){ hbInsRecipeOn(k); hbDig(hbInsKey(k, o.mine)); return; }
  if (act === 'why'){
    const I = hbInsightsToday(), c = I.concat(hbInsUsual(I)).find(x => x.id === id);
    hbAskInPanel(i18t('hb_ins_why_q', { what: (c ? c.title : hbInsViewWord(k, o.mine)) + (o.mine ? ' (' + i18t('hb_ins_in_mine') + ')' : '') })); return;
  }
  if (act === 'keep'){
    const r = hbAddView(k, o.mine);
    s.insKept[k] = Math.min(20, (s.insKept[k] || 0) + 1); hbSave();
    if (typeof toast === 'function') toast(i18t('hb_ins_kept_toast', { what: hbInsViewWord(k, o.mine) }) + (r.left ? ' ' + i18t('hb_panel_left', { what: hbPanelWord(r.left) }) : ''), 'ok');
    hbPaintBoard(); return;
  }
  /* letting a shape go rests it, yours and the company's alike */
  if (act === 'go'){ s.insOff[k] = hbToday(); if (s.ins) s.ins.list = (s.ins.list || []).filter(z => { const q = hbInsOf(z); return !q || q.k !== k; }); hbSave(); hbPaintBoard(); }
  /* (a let-go is not re-picked: the list is chosen again only on a new day or another book) */
}
/* WHAT THE BRIEF IS TOLD, once a day or when the kept views change: each
   view's name, HaTi's own sentence, and the day it was counted. */
function hbKeptSync(){
  if (typeof api !== 'function' || (typeof API_MODE === 'function' && !API_MODE())) return;
  const s = hbS(), views = s.panels.filter(p => p.kind === 'view');
  const sig = hbToday() + '|' + views.map(p => p.key).join('§');
  if (s.keptSent === sig) return;
  const out = views.slice(0, 8).map(p => { let say = '';
    try { if (p.recipe) hbCardSet(p.key, p.recipe, { seed: true });
      const C = hbInsChart(p.key); if (C) say = C.R.say || i18tn('hb_all_counted', C.cs.length, { n: _hbN(C.cs.length) }); } catch (_){}
    return { title: hbPanelWord(p), say, at: hbToday() }; });
  s.keptSent = sig; hbSave();
  Promise.resolve(api('home/kept', 'PUT', { views: out })).catch(() => { s.keptSent = ''; hbSave(); });
}

/* ---- "WHAT MOVED", FOR THE BRIEF (work order "the board that answers
   right", Part 11, 5 Oct 2026) ----
   The shelf's findings are counted here, in the browser; the brief cannot
   count them. So when Home paints, the top three are handed over the way kept
   views are (hbKeptSync): HaTi's own sentence, the finding's id and the day it
   was counted — capped, dated, and the mail says "as of" that day. The brief's
   own daily / weekly / off decides whether they go; there is no switch here. */
const HB_MOVED_MAX = 3;
function hbMovedOf(){
  let I = []; try { I = hbInsightsToday(); } catch (_){ I = []; }
  return I.filter(x => x && x.id && x.title).slice(0, HB_MOVED_MAX)
    .map(x => ({ say: hbPlainText(x.title + (x.say ? ' — ' + x.say : ''), 240), key: x.id, at: hbToday() }));
}
/* WHAT THIS TAB LAST SENT is the tab's own, never the shared board record:
   kept there, two open tabs woke each other on every save and sent without
   end (home-board-verify's second tab, 5 Oct 2026). A failed send is not
   retried until what would be sent changes. */
let _hbMovedSent = '';
function hbMovedSync(){
  if (typeof api !== 'function' || (typeof API_MODE === 'function' && !API_MODE())) return;
  if (!(window.state && Array.isArray(state.contracts) && state.contracts.length)) return;
  const out = hbMovedOf();
  const sig = hbToday() + '|' + out.map(x => x.key + ':' + x.say).join('§');
  if (_hbMovedSent === sig) return;
  _hbMovedSent = sig;
  Promise.resolve(api('home/moved', 'PUT', { items: out })).catch(() => {});
}
/* the brief's link lands here (core.js openFromHash, HASH_GO.moved): the board,
   with that finding's chart open — or simply the board, when the finding is no
   longer on today's shelf. Nothing is pressed for the reader. */
function hbOpenFromLink(id){
  const s = hbS(); s.face = 'board';
  const o = hbInsOf(id);
  if (o){ hbInsRecipeOn(o.k); s.path = [hbInsKey(o.k, o.mine)]; _hbFocusNew = true; }
  hbSave();
  return !!o;
}

/* ---- THE ASK: the board's free reader in front of Explorer's own ----
   Called by intelAsk on Home. Returns the answer it gave (HTML for the dock),
   or null to hand the question on. */
/* ============================================================
   "THIS" IS THE OPEN CHART (Young picked it, 4 Oct 2026: "build 1 and 2"; the
   lesson Metabase's Metabot teaches — the question is read in the context of
   the chart being looked at). With a chart open on the board, a follow-up
   CHANGES THAT CHART instead of starting another: "make it monthly", "as a
   pie", "by stream", "show value", "add a trend", "remove the trend". A
   follow-up naming contracts NARROWS it ("only Juno" → a card nested under
   it). "All contracts", "the whole book" start fresh. Free; the same
   recipe the card's dropdowns write (hbBoardEdit), so a press and a sentence
   can never draw different charts.
   ============================================================ */
const HB_FU = {
  /* "that" and "those" are left out: "agreements that are past due" is a new
     question, not a word about the open chart */
  /* "this year", "this quarter" name a period, not the open chart */
  refer: /\b(?:it|this(?!\s+(?:month|quarter|year|week|period))|these|them|the chart|this chart|the same|instead)\b|\b(?:det(?!\s+här\s+(?:året|kvartalet|månaden))|dessa|diagrammet)\b/,
  verb: /^\s*(?:make|change|switch|turn|use|put|redraw|draw it|show it|show this|show them|show (?:the )?(?:value|count|number|money|amount|average|days to sign|trend)|now|add|remove|hide|drop|gör|ändra|byt|visa det|lägg till|ta bort)\b/,
  lead: /^\s*(?:by|per|as|in|with|without|monthly|quarterly|yearly|annually|over time|split by|grouped by|efter|per|som|med|utan|månadsvis|kvartalsvis)\b/,
  narrow: /\b(?:only|just|of these|of those|among these|among them|filter (?:it )?to|narrow (?:it )?to|bara|endast)\b/,
  fresh: /\b(?:all contracts|every contract|all agreements|whole book|the book|everything|all of them|alla avtal|hela)\b/,
  noTrend: /\b(?:no trend|without (?:a |the )?trend|remove (?:the )?trend|hide (?:the )?trend|trend off|turn off (?:the )?trend|utan trend)\b/,
  count: /\b(?:count|how many|number of|antal)\b/,
};
function hbOpenListKey(){
  const s = hbS(); if (s.face !== 'board') return null;
  const key = (s.path || []).slice(-1)[0]; if (!key) return null;
  const D = hbDigData(key, s.lens);
  return D && D.kind === 'list' ? key : null;
}
/* the one edit: a chart's own recipe, written part by part as the dropdowns
   write it; the picture last, so a picture asked for wins over the split's
   default picture */
function hbBoardEdit(chart){
  const key = hbOpenListKey(); if (!key || !chart) return null;
  return hbCardEdit(key, chart);
}
/* one card's recipe changed part by part, through the one writer, in the
   order a press would (the picture last); what it now draws said in words */
function hbCardEdit(key, chart){
  const c = hbCardClean(chart), parts = {};
  ['split', 'split2', 'measure', 'trend', 'sort', 'top', 'window', 'compare', 'title', 'pic'].forEach(k => { if (c[k] != null) parts[k] = c[k]; });
  if (!Object.keys(parts).length) return null;
  hbCardSet(key, parts);
  const s = hbS(); const D = hbDigData(key, s.lens); if (!D) return null;
  const P = hbPlan(D), n = hbAnswerCount(D, P);
  return { key, said: i18t('hb_edit_said', { what: hbCrumbOf(key, s.lens), how: hbHowWord(P) }) + (n ? ' ' + n : '') };
}
/* what a card draws, in the reader's words: picture · split · measure, and
   whichever other parts it carries */
function hbHowWord(P){
  return [hbPicWord(P), hbSplitWord(P.split)].concat(P.split2 ? [i18t('hb_then_by', { b: hbSplitWord(P.split2) })] : [], [i18t('hb_ms_' + P.measure).toLowerCase()],
    P.sort ? [hbOrderWord(P.sort).toLowerCase()] : [], P.top ? [i18t('hb_top_n', { n: P.top }).toLowerCase()] : [], P.window ? [P.window.vs ? hbWinWord(P.window) : hbWinWord(P.window).toLowerCase()] : [],
    P.compare ? [i18t('hb_cmp_' + P.compare).toLowerCase()] : [], P.trend ? [i18t('hb_edit_trend_on')] : []).join(' · ');
}
/* Read a follow-up. Returns what to say, or null when it is not one. */
/* WHAT A FOLLOW-UP WOULD DO, writing nothing (the preview, the next
   questions and the answer read it alike): { key, narrow } — the open chart's
   contracts, narrowed — or { key, chart } — parts of its recipe — or null */
function hbFollowUpRead(qRaw){
  const q = String(qRaw || '').trim(); const key = hbOpenListKey(); if (!q || !key) return null;
  const low = ' ' + _hbRcNorm(q) + ' ';
  if (/\b(?:mk|rl)[- ]?\d+\b/i.test(q) || HB_FU.fresh.test(low)) return null;
  /* the board's own commands win: a panel, a figure, a contract, the lens… */
  const pr = hbParse(q); if (pr && !(pr.act === 'dig' && /^q:/.test(pr.key))) return null;
  const refer = HB_FU.refer.test(low), verb = HB_FU.verb.test(low), lead = HB_FU.lead.test(low), narrow = HB_FU.narrow.test(low);
  const s = hbS(); const D = hbDigData(key, s.lens), P0 = hbPlan(D);
  const R = hbRecipeRead(q);
  let cq = []; try { cq = (typeof igConditions === 'function') ? igConditions(R ? R.condText : q) : []; } catch (_){ cq = []; }
  /* "only Juno", "show these for Naivas": the open chart's contracts, narrowed */
  if (cq.length && (narrow || refer)){
    const nk = 'qn:' + key + HB_KEY_SEP + cq.map(x => x.hit || x.label).join(' ');
    return hbDigData(nk, s.lens) ? { key, narrow: nk } : null;
  }
  const noTrend = HB_FU.noTrend.test(low);
  if (cq.length || !(refer || verb || lead || noTrend)) return null;
  if (!R && !noTrend) return null;
  if (R && R.left && !noTrend) return null;           /* words HaTi cannot read: Copilot, with the board */
  const chart = {};
  if (R){
    const unitNamed = HB_RC.unit.some(([, re]) => re.test(low)), groupNamed = HB_RC.split.some(([, re]) => re.test(low)), dateNamed = HB_RC.date.some(([, re]) => re.test(low));
    if (R.split && R.split.by === 'date' && (unitNamed || (!groupNamed && P0.split && P0.split.by !== 'date' && R.trend)))
      chart.split = { by: 'date', unit: R.split.unit, date: dateNamed || !(P0.split && P0.split.by === 'date') ? R.split.date : P0.split.date };
    else if (R.split && R.split.by !== 'date' && (groupNamed || R.top)) chart.split = R.split;
    if (R.pic) chart.pic = R.pic;
    /* "show them in a graph": the open chart's own contracts and split, drawn
       as bars (Young picked it, 5 Oct 2026) — never a new card */
    else if (R.chartWord && !Object.keys(chart).length && (refer || verb)) chart.pic = 'bars';
    if (R.measure && (R.measure !== 'count' || HB_FU.count.test(low))) chart.measure = R.measure;
    if (R.trend && !noTrend) chart.trend = true;
    /* the recipe's other parts, said as a follow-up ("top 5 counterparties",
       "compared with last year", "the last 12 months") — the next questions
       (Part 5) stand on these */
    ['top', 'sort', 'window', 'compare'].forEach(k => { if (R[k] != null) chart[k] = R[k]; });
  }
  if (noTrend) chart.trend = false;
  return Object.keys(chart).length ? { key, chart } : null;
}
function hbFollowUp(qRaw, pre){
  const r = pre || hbFollowUpRead(qRaw); if (!r) return null;
  if (r.narrow){
    const N = hbDigData(r.narrow, hbS().lens); if (!N) return null;
    hbDig(r.narrow, true);
    return _hbE(i18tn('hb_found_n', N.n, { n: _hbN(N.n), what: N.title || '' }));
  }
  const did = hbBoardEdit(r.chart); if (!did) return null;
  hbPaintBoard({ jump: 'focus' });
  return _hbE(did.said);
}
/* COPILOT PRESSES THE BOARD'S BUTTONS (Young picked it, 4 Oct 2026; the lesson
   CopilotKit teaches — the copilot acts through the app's own controls).
   SEVERAL AT ONCE (work order Part 2): asked on the board, Copilot answers
   with a LIST of actions — add a card, change a card, remove, arrange, name,
   filter the board — and ONE applier, hbBoardApply, does them in order, each
   through the writer a press uses. The older single `chart` answer is read
   as one action (change the open chart, or a new card over the whole book).
   An answer that names a set rides the list road as before (hbShowFound).
   Returns what to say, or null when the answer is the map's. */
function hbBoardTakes(res, q){
  if (q != null) _hbAskQ = String(q);
  const s = hbS(); if (s.face !== 'board' || !res) return null;
  let actions = Array.isArray(res.actions) && res.actions.length ? res.actions : null;
  if (!actions && res.chart && typeof res.chart === 'object'){
    const hasSet = (Array.isArray(res.visibleIds) && res.visibleIds.length) || (res.where && typeof res.where === 'object' && Object.keys(res.where).length);
    if (hasSet) return null;
    const c = res.chart;
    actions = c.target !== 'new' && hbOpenListKey() ? [{ do: 'change_card', card: 'open', recipe: c }]
      : [{ do: 'add_card', which: { all: true }, recipe: c }];
  }
  if (!actions) return null;
  _hbPendingRecipe = null;
  const r = hbBoardApply(actions);
  /* the server keeps the first HB_ACTIONS_MAX; more asked for is said */
  if (Number(res.actionsTotal) > actions.length){ const l = i18t('hb_act_cap', { n: actions.length, m: Number(res.actionsTotal) }); r.refused.push(l); r.html += (r.html ? '<br>' : '') + _hbE(l); }
  if (!r.did.length && !r.refused.length) return null;
  return r.html + hbCopilotTail(res.answer, _hbAskQ);
}

/* ============================================================
   CHECK AND REPAIR (work order Part 4, 4 Oct 2026; the LIDA pattern:
   "Nothing wrong reaches the board quietly")
   ============================================================
   ONE checker, hbCardCheck, reads a card's recipe against the book and
   returns its problems in plain words: no contracts; nothing in the period;
   a picture that cannot show this split; money this reader may not see; too
   many groups to read; a date that is mostly empty; a trend with no history;
   a word the board does not know. Copilot's cards are checked before they
   are applied: what fails goes back to Copilot ONCE (hbBoardTakesChecked),
   the retry is said, and what still fails is NOT applied — one line each.
   The free reader's cards go through the same checker: no retry, the same
   line. */
const HB_CHK_GROUPS_MAX = 25, HB_CHK_EMPTY_SHARE = 0.5;
function hbCardCheck(D, raw, spec){
  const out = [], say = (k, vars) => out.push({ k, say: i18t('hb_chk_' + k, vars || {}) });
  const s = hbS(), money = hbMoneyOk();
  const r = raw && typeof raw === 'object' ? raw : {};
  /* a word the board does not know: what the cleaner dropped */
  const clean = hbCardClean(r);
  const known = Object.keys(r).filter(k => k !== 'target' && k !== 'which');
  const lost = known.filter(k => !(k in clean));
  if (lost.length) say('unknown', { what: lost.join(', ') });
  if (r.measure === 'value' && !money) say('money');
  if (!D){ say('empty'); return out; }
  const P = hbCardPlan(spec || Object.assign(hbPlanSpec(D), clean), D);
  const cs0 = hbListOf(D.ids || [], s.lens);
  if (!cs0.length){ say('empty'); return out; }
  /* the picture asked for, or the split asked for, is not what can be drawn */
  const splitMoved = clean.split && clean.split.by !== 'none' && JSON.stringify(clean.split) !== JSON.stringify(P.split) && JSON.stringify(clean.split) !== JSON.stringify(P.split2);
  if ((clean.pic && clean.pic !== P.pic && !(clean.pic === 'bars' && P.pic === 'cols')) || (clean.pic && splitMoved))
    say('pic', { pic: i18t('hb_pic_' + (clean.pic === 'cols' ? 'cols_m' : clean.pic)), split: hbSplitWord(clean.split || P.split).toLowerCase() });
  if (P.dropped && P.dropped.length) say('dropped', { what: P.dropped.map(k => i18t('hb_part_' + k)).join(', ') });
  let run = null; try { run = P.pic === 'list' ? null : hbChartRun(D, cs0, P); } catch (_){ run = null; }
  if (P.window && run && !run.cs.length) say('period', { what: P.window.vs ? hbWinWord(P.window) : hbWinWord(P.window).toLowerCase() });
  /* too many groups to read, with no top N */
  const field = P.split && P.split.by !== 'date' && P.split.by !== 'valueBand' ? P.split.by : null;
  if (field && !P.top){ const g = new Set((run ? run.cs : cs0).map(c => hbGroupOf(c, field))).size; if (g > HB_CHK_GROUPS_MAX) say('groups', { n: _hbN(g), max: HB_CHK_GROUPS_MAX }); }
  /* a date that is mostly empty: the split's, else the period's */
  const date = P.split && P.split.by === 'date' ? P.split.date : P.window ? P.window.date : null;
  if (date){ const base = date === 'signed' ? cs0.filter(c => c.status === 'Signed' || hbDateOf(c, 'signed')) : cs0;
    const none = base.filter(c => !hbDateOf(c, date)).length;
    if (base.length && none / base.length > HB_CHK_EMPTY_SHARE) say('date', { date: i18t('hb_dtn_' + date), n: _hbN(none), t: _hbN(base.length) }); }
  /* a trend with no history */
  if (P.trend && run && run.R && Array.isArray(run.R.cols)){
    const filled = run.R.cols.filter(c => c.k && !c.sofar).length;
    if (filled < HB_TREND_MIN_PTS) say('trend', { need: HB_TREND_MIN_PTS, n: _hbN(filled) });
  }
  return out;
}
/* the card an action would make, checked: a new card over its set, or a
   change to a card that is there */
function hbActionCheck(a){
  const s = hbS();
  if (a.do === 'add_card'){
    const W = hbWhichOf(a.which || { all: true }, s.lens);
    if (W.unread) return [{ k: 'which', say: i18t('hb_chk_which', { what: W.label }) }];
    const D = { key: 'chk:new', kind: 'list', ids: W.ids, n: W.ids.length, fixed: W.fields, chart: hbCardClean(a.recipe || {}) };
    return hbCardCheck(D, a.recipe || {});
  }
  if (a.do === 'change_card'){
    const C = hbCardRef(a.card || 'open'); if (!C || !C.key) return [];       /* said by the applier */
    const D = hbDigData(C.key, s.lens);
    return hbCardCheck(D, a.recipe || {}, Object.assign(hbPlanSpec(D), hbCardClean(a.recipe || {})));
  }
  return [];
}
function hbActionsCheck(actions){
  const bad = [];
  (actions || []).forEach((raw, i) => { const a = hbActionClean(raw) || raw; const p = a && a.do ? hbActionCheck(a) : [];
    if (p.length) bad.push({ i, a: raw, problems: p }); });
  return bad;
}
/* what Copilot is told when its cards come back: the recipe and the reason */
function hbRepairNote(bad){
  return ['HaTi checked your board actions and did not apply these (nothing else was changed for them):']
    .concat(bad.map((b, j) => `${j + 1}. ${JSON.stringify(b.a).slice(0, 600)} — ${b.problems.map(p => p.say).join('; ')}`))
    .concat(['Send corrected actions for these cards only, in actions. Use fields the data guide shows as filled; for many groups add a top N.']).join('\n');
}
function hbActionTitle(a){ const t = a && (a.title || (a.recipe && a.recipe.title)); return t ? String(t).slice(0, HB_TITLE_MAX) : (a && a.card ? String(a.card) : i18t('hb_chk_card')); }
/* COPILOT'S ANSWER, CHECKED: the good actions apply; the bad go back ONCE;
   what still fails is said and not applied */
async function hbBoardTakesChecked(res, retry, q){
  _hbMeta = null;
  if (q != null) _hbAskQ = String(q);
  const s = hbS(); if (s.face !== 'board' || !res) return null;
  /* Copilot was unsure: up to three readings, each a press (nothing applied) */
  if ((!Array.isArray(res.actions) || !res.actions.length) && Array.isArray(res.choices) && res.choices.length){
    const ch = res.choices.slice(0, HB_CHOICES_MAX).map(c => ({ label: hbPlainText(c && c.label, 60), board: Array.isArray(c && c.actions) ? c.actions : [], q: _hbAskQ })).filter(c => c.label && c.board.length);
    if (ch.length){ _hbMeta = { choices: ch }; const own = String(res.answer || '').trim();
      return _hbE(i18t('hb_ch_copilot_said')) + (own ? '<br>' + ((typeof aiRichText === 'function') ? aiRichText(own) : _hbE(own)) : ''); }
  }
  if (!Array.isArray(res.actions) || !res.actions.length){ const u0 = hbUndoTop(); const said = hbBoardTakes(res, _hbAskQ); return said ? said + hbNoteUndo(u0) : said; }
  const bad = hbActionsCheck(res.actions);
  if (!bad.length) return hbBoardAnswer(res, res.actions, []);
  const good = res.actions.filter((a, i) => !bad.some(b => b.i === i));
  let fixed = [], ran = false, still = bad;
  if (typeof retry === 'function'){
    let res2 = null;
    try { res2 = await retry(hbRepairNote(bad)); ran = true; } catch (_){ res2 = null; ran = true; }
    const again = res2 && Array.isArray(res2.actions) ? res2.actions : [];
    const bad2 = hbActionsCheck(again);
    fixed = again.filter((a, i) => !bad2.some(b => b.i === i));
    /* a card still wrong is said with its second problem; one that never
       came back is said with its first */
    const missing = Math.max(0, bad.length - (fixed.length + bad2.length));
    still = bad2.concat(missing ? bad.slice(bad.length - missing) : []);
  }
  const lines = [];
  if (ran) lines.push(i18tn('hb_chk_retried', bad.length, { n: _hbN(bad.length) }));
  still.forEach(b => lines.push(i18t(b.a && b.a.do === 'change_card' ? 'hb_chk_not_changed' : 'hb_chk_not_added', { what: hbActionTitle(b.a), why: b.problems.map(p => p.say).join('; ') })));
  return hbBoardAnswer(res, good.concat(fixed), lines);
}
/* ============================================================
   CHOICES WHEN A QUESTION IS UNCLEAR (work order Part 6; the NL4DV pattern)
   ============================================================
   The free reader's words can mean more than one thing in three known ways:
   "by month" with no date named (end · signed · created), "by value" (value
   bands · the contract value), and one word matching two or three
   counterparties. The likeliest reading is drawn — and SAID — and the others
   are presses, drawn with the map's own choice buttons (m.choices); a press
   applies that recipe through hbBoardApply and can be undone. Copilot may
   answer the same way (up to three choices, each a list of the board's own
   actions). A clear question offers none. */
const HB_CHOICES_MAX = 3;
function hbAmbiguity(q){
  const full = ' ' + _hbRcNorm(q) + ' ';
  const R = hbRecipeRead(q); const choices = []; let say = '';
  const dateNamed = HB_RC.date.some(([, re]) => re.test(full));
  if (R && R.split && R.split.by === 'date' && !dateNamed && !['daysToSign', 'medianDaysToSign', 'rounds', 'payDays', 'live'].includes(R.measure) && !R.trend){
    ['end', 'signed', 'created'].filter(d => d !== R.split.date).forEach(d => choices.push({ label: i18t('hb_ch_date', { date: i18t('hb_dtn_' + d) }),
      board: [{ do: 'change_card', card: 'open', recipe: { split: { by: 'date', unit: R.split.unit, date: d } } }] }));
    say = i18t('hb_ch_date_said', { date: i18t('hb_dtn_' + R.split.date) });
  }
  if (!choices.length && R && R.split && R.split.by === 'valueBand' && hbMoneyOk() && !/\b(?:value bands?|sizes?|storlek)\b/.test(full)){
    choices.push({ label: i18t('hb_ch_value'), board: [{ do: 'change_card', card: 'open', recipe: { split: { by: 'status' }, measure: 'value', pic: 'blocks' } }] });
    say = i18t('hb_ch_value_said');
  }
  /* ASK OR ASSUME, EVERY TWO-WAY WORD (the board that answers right, Part 2):
     the likeliest reading is drawn and said; the other is one press */
  const word = w => new RegExp('\\b' + w + '\\b').test(full);
  /* "value" read as the contract value — or value bands */
  if (!choices.length && R && R.measure === 'value' && hbMoneyOk() && word('value') && !(R.split && R.split.by === 'valueBand') && !/\b(?:value bands?|sizes?|storlek)\b/.test(full)){
    choices.push({ label: i18t('hb_ch_band'), board: [{ do: 'change_card', card: 'open', recipe: { split: { by: 'valueBand' }, measure: 'count', pic: 'bars' } }] });
    say = i18t('hb_ch_band_said');
  }
  /* "terms" read as payment terms — or how long the contract runs (when it ends) */
  if (!choices.length && R && R.split && R.split.by === 'payterms' && word('terms') && !/\b(?:payment|credit|betalnings)\b/.test(full)){
    choices.push({ label: i18t('hb_ch_terms_end'), board: [{ do: 'change_card', card: 'open', recipe: { split: { by: 'date', unit: 'q', date: 'end' }, pic: 'cols' } }] });
    say = i18t('hb_ch_terms_said');
  }
  /* "stage" in a question about deals read as the lifecycle stage — or the negotiation round (Part 8) */
  if (!choices.length && R && R.split && R.split.by === 'status' && /\bstages?\b/.test(full) && /\b(?:negotiat\w*|deals?|förhandl\w*)\b/.test(full)){
    choices.push({ label: i18t('hb_ch_rounds'), board: [{ do: 'change_card', card: 'open', recipe: { split: { by: 'rounds' } } }] });
    say = i18t('hb_ch_stage_said');
  }
  /* "owner" read as who owns it on our side — or the counterparty */
  if (!choices.length && R && R.split && R.split.by === 'owner' && /\bowners?\b/.test(full) && !/\b(?:our|who owns|internal)\b/.test(full)){
    choices.push({ label: i18t('hb_ch_owner_cp'), board: [{ do: 'change_card', card: 'open', recipe: { split: { by: 'counterparty' } } }] });
    say = i18t('hb_ch_owner_said');
  }
  if (!choices.length && typeof igConditions === 'function'){
    let cq = []; try { cq = igConditions(R ? R.condText : q); } catch (_){ cq = []; }
    const cp = cq.find(x => x.field === 'counterparty');
    if (cp){ const names = [...new Set(hbBook(hbS().lens).filter(c => { try { return cp.fn(c); } catch (_){ return false; } }).map(c => String(c.counterparty || '').trim()).filter(Boolean))];
      if (names.length >= 2 && names.length <= HB_CHOICES_MAX){
        names.sort().forEach(n => choices.push({ label: i18t('hb_ch_only', { who: n }), board: [{ do: 'filter_board', which: { q: n } }] }));
        say = i18t('hb_ch_party_said', { word: cp.hit || cp.label, n: names.length }); } }
  }
  return choices.length ? { choices: choices.slice(0, HB_CHOICES_MAX), say } : null;
}
/* a press on a choice: that recipe, through the one applier, undoable */
function hbChoicePress(c){
  if (!c || !Array.isArray(c.board)) return null;
  _hbMeta = null;
  _hbAskQ = c.q || '';
  const u0 = hbUndoTop();
  const r = hbBoardApply(c.board);
  hbNoteUndo(u0);
  return Object.assign({ html: r.html || _hbE(i18t('hb_ch_nothing')) }, hbTakeMeta());
}
/* ---- PREVIEW A BIG BUILD (work order Part 5) ----
   An answer that would add two or more cards, or remove any, is shown as a
   list with ticks in the panel's answer — "Add all" / "Add chosen" —
   and NOTHING is applied until pressed: the reader's choice, in the cheapest
   channel that carries the act (no band, no dialog). One card, or one change
   to the open card, applies at once, as before. */
const _hbPreviews = new Map();
let _hbPvSeq = 0;
function hbIsBig(actions){
  const list = (actions || []).map(a => hbActionClean(a)).filter(Boolean);
  return list.filter(a => a.do === 'add_card').length >= 2 || list.some(a => a.do === 'remove_card');
}
/* one action in the reader's words, for the list */
function hbActionWords(raw){
  const a = hbActionClean(raw); if (!a) return '';
  const s = hbS();
  if (a.do === 'add_card'){
    const W = hbWhichOf(a.which || { all: true }, s.lens);
    const D = { key: 'pv:new', kind: 'list', ids: W.ids, n: W.ids.length, fixed: W.fields, chart: a.recipe || {} };
    return i18t('hb_pv_add', { what: a.title || (a.recipe && a.recipe.title) || W.label, how: hbHowWord(hbCardPlan(Object.assign(hbPlanBase(D), a.recipe || {}), D)), n: _hbN(W.ids.length) });
  }
  const C = a.card ? hbCardRef(a.card) : null;
  const name = C ? (C.p ? hbPanelWord(C.p) : hbCrumbOf(C.key, s.lens)) : (a.card || '');
  if (a.do === 'remove_card') return i18t('hb_pv_remove', { what: name });
  if (a.do === 'change_card'){ const D = C && C.key ? hbDigData(C.key, s.lens) : null;
    return i18t('hb_pv_change', { what: name, how: D ? hbHowWord(hbCardPlan(Object.assign(hbPlanSpec(D), hbCardClean(a.recipe || {})), D)) : '' }); }
  if (a.do === 'name_card') return i18t('hb_pv_name', { what: name, to: a.title || '' });
  if (a.do === 'arrange') return i18t('hb_pv_arrange');
  if (a.do === 'filter_board') return i18t('hb_pv_filter', { what: hbWhichOf(a.which || { all: true }, s.lens).label });
  return a.do;
}
/* what the panel says for an answer: applied at once, or offered as a list */
function hbBoardAnswer(res, applied, lines){
  const tail = hbCopilotTail(res.answer, _hbAskQ);
  const extra = (lines || []).map(l => _hbE(l)).join('<br>');
  if (applied.length && hbIsBig(applied)){
    const id = 'pv' + (++_hbPvSeq);
    _hbPreviews.set(id, { actions: applied, tail, extra, q: _hbAskQ });
    _hbMeta = Object.assign(_hbMeta || {}, { preview: { id, adds: applied.every(a => a && a.do !== 'remove_card'), rows: applied.map(a => hbActionWords(a)) } });
    return _hbE(i18tn('hb_pv_head', applied.length, { n: _hbN(applied.length) })) + (extra ? '<br>' + extra : '') + tail;
  }
  const u0 = hbUndoTop();
  const said = applied.length ? hbBoardTakes(Object.assign({}, res, { actions: applied, answer: '' }), _hbAskQ) : null;
  /* HaTi's lines first — what was done, the retry, what was not — then Copilot's own sentence */
  return [said ? said + hbNoteUndo(u0) : '', extra].filter(Boolean).join('<br>') + tail;
}
/* the list with ticks, drawn by the panel under the answer's words */
function hbPreviewHtml(P){
  if (!P || !Array.isArray(P.rows)) return '';
  return `<div class="hb-pv" data-hb-pv-id="${_hbE(P.id)}">${P.rows.map((r, i) => `<label class="hb-pv-row"><input type="checkbox" data-hb-pv-item="${i}" checked><span>${_hbE(r)}</span></label>`).join('')}
    <div class="hb-pv-acts"><button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-hb-pv="all">${_hbE(i18t(P.adds ? 'hb_pv_all' : 'hb_pv_apply_all'))}</button><button type="button" class="ui-btn ui-btn-sm" data-hb-pv="chosen">${_hbE(i18t(P.adds ? 'hb_pv_chosen' : 'hb_pv_apply_chosen'))}</button></div></div>`;
}
/* the press on a preview: all, or only the ticked ones; the panel's answer
   becomes what was done, with Undo */
function hbPreviewPress(id, which, chosen){
  const P = _hbPreviews.get(id);
  if (!P) return { html: _hbE(i18t('hb_pv_gone')) };
  const pick = which === 'all' ? P.actions : P.actions.filter((a, i) => (chosen || []).includes(i));
  if (!pick.length) return null;
  _hbPreviews.delete(id);
  _hbAskQ = P.q || '';
  const u0 = hbUndoTop();
  const r = hbBoardApply(pick);
  const left = P.actions.length - pick.length;
  hbNoteUndo(u0);
  const html = r.html + (left ? '<br>' + _hbE(i18tn('hb_pv_left', left, { n: _hbN(left) })) : '') + (P.extra ? '<br>' + P.extra : '') + P.tail;
  return Object.assign({ html, r }, hbTakeMeta());
}
/* the panel's message that held the list is replaced by what was done */
function hbPreviewSettle(id, html, undo){
  try {
    const h = window.intel && Array.isArray(intel.history) ? intel.history : [];
    const m = h.find(x => x && x.role === 'assistant' && x.preview && x.preview.id === id);
    if (m){ m.text = html; delete m.preview; if (undo) m.undo = undo; }
    if (typeof renderIntelDock === 'function') renderIntelDock();
  } catch (_){}
}

/* ---- THE BOARD'S TOOLS, AS COPILOT IS GIVEN THEM (the server's list is the same, f497) ---- */
const HB_BOARD_ACTIONS = ['add_card', 'change_card', 'remove_card', 'arrange', 'name_card', 'filter_board'];
const HB_ACTIONS_MAX = 12;
/* a card's set: the whole book, the map's own reading of plain words, or ids */
function hbWhichOf(which, lens){
  const book = hbBook(lens);
  const w = which || { all: true };
  if (w.ids){ const inL = new Set(book.map(c => c.id)); const ids = w.ids.filter(id => inL.has(id));
    return { ids, label: i18tn('hb_n_contracts', ids.length, { n: ids.length }), whole: false, fields: [] }; }
  if (w.q && typeof igConditions === 'function'){
    let cq = []; try { cq = igConditions(w.q); } catch (_){ cq = []; }
    if (cq.length){ const ids = (typeof igIdsWhere === 'function') ? igIdsWhere(cq, book) : [];
      return { ids, label: cq.map(x => x.label).join(' · '), whole: false, fields: cq.map(x => x.field), unread: false }; }
    return { ids: [], label: hbPlainText(w.q, 80), whole: false, fields: [], unread: true };
  }
  return { ids: book.filter(c => c.status !== 'Declined').map(c => c.id), label: i18t('hb_lens_all'), whole: true, fields: [] };
}
/* ONE WRITER FOR A NEW CARD: a kept view holding its set and its recipe (the
   Keep press's own shape, hbAddView); the board holds HB_PANELS_MAX, and the
   oldest leaving is said */
function hbAddCard(which, recipe, title){
  const s = hbS();
  const id = 'p' + (++s.seq), clean = hbCardClean(recipe || {}); delete clean.which;
  const p = { id, kind: 'view', key: 'cd:' + id, title: '', which: hbCardClean({ which }).which || { all: true }, recipe: clean, split: false, big: false };
  let left = null; if (s.panels.length >= HB_PANELS_MAX) left = s.panels.shift();
  s.panels.push(p); _hbNewPanel = id;
  hbCardSet(p.key, clean, { seed: true });
  /* a card always has a name: the one asked for, else what it counts and how */
  const D = hbDigData(p.key, s.lens);
  p.title = hbPlainText(title || clean.title || (D ? D.setLabel + ' · ' + hbSplitWord(hbPlan(D).split) : ''), HB_TITLE_MAX);
  hbSave();
  return { p, left };
}
/* a panel's own buttons: close, side by side, bigger, give (a press, or Copilot) */
function hbPanelAct(pid, act){
  const s = hbS(); const p = s.panels.find(x => x.id === pid); if (!p) return false;
  if (act === 'x') s.panels.splice(s.panels.indexOf(p), 1);
  else if (act === 'split') p.split = !p.split;
  else if (act === 'big') p.big = !p.big;
  else if (act === 'large') p.big = true;
  else if (act === 'small') p.big = false;
  else if (act === 'give') _hbGiveForm = _hbGiveForm === pid ? null : pid;
  else if (act === 'more') _hbMoreMenu = _hbMoreMenu === pid ? null : pid;
  else if (act === 'verify'){ _hbMoreMenu = null; _hbVerForm = _hbVerForm === pid ? null : pid; return true; }
  else return false;
  hbSave(); return true;
}
/* the trail's crumbs: back to step i, or (-1) to the board — the count goes with it */
function hbCrumb(i){
  const s = hbS();
  s.path = i < 0 ? [] : (s.path || []).slice(0, i + 1); _hbFocusNew = i >= 0; _hbWatchForm = null; hbSave();
}
/* the board's order, top first, and each card's size */
function hbArrange(order, sizes){
  const s = hbS(), byId = new Map(s.panels.map(p => [p.id, p]));
  const top = (order || []).map(id => byId.get(id)).filter(Boolean);
  const shown = s.panels.slice().reverse(), rest = shown.filter(p => !top.includes(p));
  s.panels = top.concat(rest).reverse();
  Object.keys(sizes || {}).forEach(id => { const p = byId.get(id); if (p) p.big = sizes[id] === 'big'; });
  hbSave();
}
/* a card's name: a kept view's own (and its recipe's); a ready-made panel keeps its word */
function hbPanelName(pid, title){
  const s = hbS(); const p = s.panels.find(x => x.id === pid); if (!p || p.kind !== 'view') return false;
  const t = hbPlainText(title, HB_TITLE_MAX); if (!t) return false;
  p.title = t; hbCardSet(p.key, { title: t }); return true;
}
/* one action, cleaned: a word the board does not know is left out (and said) */
function hbActionClean(a){
  if (!a || typeof a !== 'object' || !HB_BOARD_ACTIONS.includes(a.do)) return null;
  const out = { do: a.do };
  if (a.card != null) out.card = hbPlainText(a.card, 40);
  if (a.which != null){ const w = a.which === 'all' ? { all: true } : hbCardClean({ which: a.which }).which; if (w) out.which = w; }
  if (a.recipe && typeof a.recipe === 'object'){ const r = hbCardClean(a.recipe); delete r.which; out.recipe = r; }
  if (a.title != null){ const t = hbPlainText(a.title, HB_TITLE_MAX); if (t) out.title = t; }
  if (Array.isArray(a.order)) out.order = a.order.filter(x => typeof x === 'string').slice(0, HB_PANELS_MAX).map(x => x.slice(0, 40));
  if (a.sizes && typeof a.sizes === 'object') out.sizes = Object.keys(a.sizes).slice(0, HB_PANELS_MAX).reduce((o, k) => { if (a.sizes[k] === 'big' || a.sizes[k] === 'small') o[String(k).slice(0, 40)] = a.sizes[k]; return o; }, {});
  return out;
}
/* which card an action names: "open" (the chart open on the board), a card's
   ref, or its name as the reader sees it */
function hbCardRef(ref){
  const s = hbS(); const r = String(ref || '').trim(); if (!r) return null;
  if (/^open$/i.test(r)){ const key = hbOpenListKey(); return key ? { open: true, key } : null; }
  const p = s.panels.find(x => x.id === r) || s.panels.find(x => hbPanelWord(x).toLowerCase() === r.toLowerCase());
  return p ? { p, key: p.kind === 'view' ? p.key : null } : null;
}
/* THE ONE APPLIER: each action in order, through the writer a press uses;
   what was done is said in HaTi's words, one line each */
function hbBoardApply(actions, q){
  if (q != null) _hbAskQ = String(q);
  const s = hbS(), did = [], refused = [];
  const list = (Array.isArray(actions) ? actions : []).slice(0, HB_ACTIONS_MAX);
  if (Array.isArray(actions) && actions.length > HB_ACTIONS_MAX) refused.push(i18t('hb_act_cap', { n: HB_ACTIONS_MAX, m: actions.length }));
  let jump = null; const added = [];
  list.forEach(raw => {
    const a = hbActionClean(raw);
    if (!a){ refused.push(i18t('hb_act_unknown')); return; }
    if (a.do === 'add_card'){
      const named = hbNameAsked(_hbAskQ);
      if (!named && a.recipe) delete a.recipe.title;
      const { p, left } = hbAddCard(a.which || { all: true }, a.recipe || {}, named ? a.title : null);
      added.push(p.id);
      const D = hbDigData(p.key, s.lens);
      did.push(i18t('hb_act_added', { what: p.title, how: D ? hbHowWord(hbPlan(D)) : '' }) + (left ? ' ' + i18t('hb_panel_left', { what: hbPanelWord(left) }) : ''));
      return;
    }
    if (a.do === 'filter_board'){
      const w = a.which || { all: true };
      if (w.all){ hbCrumb(-1); did.push(i18t('hb_act_unfiltered')); jump = 'top'; return; }
      const W = hbWhichOf(w, s.lens);
      if (W.unread){ refused.push(i18t('hb_act_unread', { what: W.label })); return; }
      const key = w.ids ? 'ls' : 'q:' + w.q;
      if (w.ids){ s.found = { title: W.label, ids: W.ids.slice(0, 2000), chart: null }; if (s.recipe) delete s.recipe.ls; }
      hbDig(key, false);
      did.push(i18tn('hb_act_filtered', W.ids.length, { n: _hbN(W.ids.length), what: W.label })); jump = 'focus';
      return;
    }
    if (a.do === 'arrange'){
      const known = (a.order || []).filter(id => s.panels.some(p => p.id === id));
      hbArrange(known, a.sizes || {});
      const names = known.map(id => hbPanelWord(s.panels.find(p => p.id === id)));
      const sized = Object.keys(a.sizes || {}).filter(id => s.panels.some(p => p.id === id));
      if (!known.length && !sized.length){ refused.push(i18t('hb_act_no_card', { ref: (a.order || []).join(', ') || '—' })); return; }
      did.push(i18t('hb_act_arranged', { what: names.concat(sized.filter(id => !known.includes(id)).map(id => hbPanelWord(s.panels.find(p => p.id === id)))).join(', ') }));
      return;
    }
    const C = hbCardRef(a.card || 'open');
    if (!C){ refused.push(i18t('hb_act_no_card', { ref: a.card || 'open' })); return; }
    if (a.do === 'change_card'){
      if (a.recipe && !hbNameAsked(_hbAskQ)) delete a.recipe.title;
      if (!C.key){ refused.push(i18t('hb_act_fixed', { what: hbPanelWord(C.p) })); return; }
      const r = hbCardEdit(C.key, a.recipe || {});
      if (!r){ refused.push(i18t('hb_act_nothing', { what: C.p ? hbPanelWord(C.p) : hbCrumbOf(C.key, s.lens) })); return; }
      did.push(C.open ? r.said : i18t('hb_act_changed', { what: hbPanelWord(C.p), how: hbHowWord(hbPlan(hbDigData(C.key, s.lens))) }));
      if (C.open) jump = 'focus';
      return;
    }
    if (a.do === 'remove_card'){
      if (C.open){ hbCrumb(-1); did.push(i18t('hb_act_closed')); return; }
      const what = hbPanelWord(C.p); hbPanelAct(C.p.id, 'x'); did.push(i18t('hb_act_removed', { what })); return;
    }
    if (a.do === 'name_card'){
      /* a name nobody asked for is not taken; nothing to say about it */
      if (!hbNameAsked(_hbAskQ)) return;
      if (!a.title){ refused.push(i18t('hb_act_nothing', { what: C.p ? hbPanelWord(C.p) : '' })); return; }
      if (C.open){ hbCardSet(C.key, { title: a.title }); did.push(i18t('hb_act_named', { what: a.title })); return; }
      if (!hbPanelName(C.p.id, a.title)){ refused.push(i18t('hb_act_fixed', { what: hbPanelWord(C.p) })); return; }
      did.push(i18t('hb_act_named', { what: a.title })); return;
    }
  });
  /* cards built together stand together, at the top, in the order asked
     (the board otherwise puts the newest first) */
  const still = added.filter(id => s.panels.some(p => p.id === id));
  if (still.length > 1 && !list.some(x => x && x.do === 'arrange')) hbArrange(still, {});
  if (did.length) hbPaintBoard(jump ? { jump } : still.length ? { jump: 'top' } : undefined);
  const html = did.concat(refused).map(l => _hbE(l)).join('<br>');
  return { did, refused, html };
}
/* A QUESTION ABOUT WHAT IS ON THE SCREEN ("why does the dashboard say 851
   …", "explain the trend line", "what does this chart mean") is Copilot's,
   with the board shown to it (hbBoardNow) — never read as a new chart */
const HB_WHY_ASK_RE = /^\s*(?:why|explain|how come|what (?:does|do) .{0,60}\bmean|what is this|what's this|varför|förklara|vad betyder)\b/i;
/* ============================================================
   THE READING, AS CHIPS (work order "the board that answers right", Part 4,
   5 Oct 2026; ThoughtSpot shows the tokens it read and lets them be changed)
   ============================================================
   Under a reply that drew or changed the open chart, HaTi shows how it read
   the question: Picture · Split · Measure. Each chip opens the SAME menu the
   card's own row opens (hbRcOptions, greyed with its reason) and writes
   through the same writer (hbRecipeSet → hbCardSet, undo marked in hbSave).
   Only the newest reply about the card that is still open is live; an older
   reply shows the words it read as plain text, so it can never edit a card
   that has moved on. Desktop panel only; the phone keeps its own Home. */
let _hbRdOpen = null;
const HB_RD_PARTS = ['pic', 'split', 'measure'];
function hbRdWords(P){ return { pic: hbPicWord(P), split: hbSplitWord(P.split), measure: i18t('hb_ms_' + P.measure) }; }
function hbReadingSnap(){
  const key = hbOpenListKey(); if (!key) return { key: null, sig: '' };
  const D = hbDigData(key, hbS().lens); return { key, sig: D ? JSON.stringify(hbPlan(D)) : '' };
}
/* the reading a reply carries: the open card, when the question drew it or changed it */
function hbReadingAfter(snap){
  const now = hbReadingSnap(); if (!now.key) return null;
  if (snap && now.key === snap.key && now.sig === snap.sig) return null;
  const D = hbDigData(now.key, hbS().lens); if (!D || D.kind !== 'list') return null;
  return { key: now.key, at: Date.now(), words: hbRdWords(hbPlan(D)) };
}
/* is this reply (index i in the panel's history) the live one for its card? */
function hbReadingLive(i){
  const h = (window.intel && Array.isArray(intel.history)) ? intel.history : [];
  const m = h[i]; if (!m || !m.reading || m.reading.key !== hbOpenListKey()) return false;
  for (let j = h.length - 1; j > i; j--) if (h[j] && h[j].reading) return false;
  return true;
}
function hbReadingHtml(rd, live){
  if (!rd || !rd.key) return '';
  const s = hbS(); const D = live ? hbDigData(rd.key, s.lens) : null;
  const P = D && D.kind === 'list' ? hbPlan(D) : null;
  const words = P ? hbRdWords(P) : (rd.words || {});
  const label = p => i18t({ pic: 'hb_rc_pic', split: 'hb_rc_split', measure: 'hb_rc_measure' }[p]);
  if (!P) return `<div class="hb-rd is-still" aria-label="${_hbE(i18t('hb_rd_label'))}">${HB_RD_PARTS.filter(p => words[p]).map(p => `<span class="hb-rd-chip is-still"><i>${_hbE(label(p))}</i>${_hbE(words[p])}</span>`).join('')}</div>`;
  const chip = p => {
    const open = _hbRdOpen === rd.key + '|' + p;
    const menu = open ? `<div class="hb-rd-menu" role="menu" aria-label="${_hbE(label(p))}">${hbRcOptions(p, P, D).map(x => {
      const cur = hbRcCurHas(p, P, x.v);
      return (x.head ? `<div class="hb-rd-menu-h" role="presentation">${_hbE(x.head)}</div>` : '') + `<button type="button" role="menuitemradio" aria-checked="${cur}" data-hb-rdset="${_hbE(p + ':' + x.v)}"${x.on ? '' : ' disabled'}${x.why ? ` title="${_hbE(x.why)}"` : ''}><span>${_hbE(x.word)}</span>${x.why ? `<small>${_hbE(x.why)}</small>` : cur ? `<b aria-hidden="true">${_hbTick}</b>` : ''}</button>`; }).join('')}</div>` : '';
    return `<span class="hb-rd-wrap"><button type="button" class="hb-rd-chip${open ? ' is-open' : ''}" data-hb-rd="${p}" aria-haspopup="menu" aria-expanded="${open}"><i>${_hbE(label(p))}</i>${_hbE(words[p])}${_hbCaret}</button>${menu}</span>`;
  };
  return `<div class="hb-rd" role="group" data-hb-rd-key="${_hbE(rd.key)}" aria-label="${_hbE(i18t('hb_rd_label'))}">${HB_RD_PARTS.map(chip).join('')}${hbNextHtml(rd.key)}</div>`;
}
/* ============================================================
   THREE NEXT QUESTIONS (work order "the board that answers right", Part 5,
   5 Oct 2026; Amazon Q suggests questions beside each answer)
   ============================================================
   Under the live reply, up to three follow-ups worked out from the open
   card's recipe. Each is offered ONLY when the free reader reads it
   (hbFollowUpRead, which writes nothing), it would change the card, and the
   checker finds no fault (never empty, never crowded) — so a press always
   draws and never costs anything. A press asks it as if typed. */
const HB_NEXT_MAX = 3, HB_NEXT_TOP = 5;
const HB_NEXT_GROUP_WORD = { counterparty: 'hb_nx_g_party', folder: 'hb_nx_g_stream', owner: 'hb_nx_g_owner', kind: 'hb_nx_g_kind', status: 'hb_nx_g_stage' };
function hbNextCandidates(D, P){
  const split = P.split && P.split.by, isDate = split === 'date', out = [];
  const cs = hbListOf(D.ids || [], hbS().lens);
  /* ("only suppliers" is not offered: on the board it sets the whole board's
     lens, not the open card's — a different act from the one it would name) */
  if (split && !isDate && HB_NEXT_GROUP_WORD[split] && new Set(cs.map(c => hbGroupOf(c, split))).size > HB_NEXT_TOP + 1)
    out.push(i18t('hb_nx_top', { n: HB_NEXT_TOP, g: i18t(HB_NEXT_GROUP_WORD[split]) }));
  if (!isDate) out.push(i18t('hb_nx_month'));
  if (isDate && !P.compare) out.push(i18t('hb_nx_cmp'));
  out.push(split === 'status' ? i18t('hb_nx_party') : i18t('hb_nx_stage'));
  /* a pie only over groups: over time it would move the split, not the picture */
  if ((P.measure === 'count' || P.measure === 'value') && !isDate) out.push(P.pic === 'ring' ? i18t('hb_nx_bars') : i18t('hb_nx_pie'));
  return out;
}
const _hbPlanSig = P => JSON.stringify(['pic', 'split', 'split2', 'measure', 'top', 'sort', 'window', 'compare', 'trend'].map(k => P[k] == null ? null : P[k]));
function hbNextQuestions(key){
  const s = hbS(); if (!key || key !== hbOpenListKey()) return [];
  const D = hbDigData(key, s.lens); if (!D || D.kind !== 'list' || !D.n) return [];
  const P0 = hbPlan(D), sig0 = _hbPlanSig(P0), out = [];
  for (const q of hbNextCandidates(D, P0)){
    if (out.length >= HB_NEXT_MAX) break;
    let r = null; try { r = hbFollowUpRead(q); } catch (_){ r = null; }
    if (!r) continue;
    if (r.narrow){ const N = hbDigData(r.narrow, s.lens); if (N && N.n > 0 && N.n < D.n) out.push(q); continue; }
    const spec1 = Object.assign({}, hbPlanSpec(D), hbCardClean(r.chart));
    const P1 = hbCardPlan(spec1, D);
    if (_hbPlanSig(P1) === sig0) continue;
    let bad = []; try { bad = hbCardCheck(D, r.chart, spec1); } catch (_){ bad = [{}]; }
    if (!bad.length) out.push(q);
  }
  return out;
}
function hbNextHtml(key){
  const qs = hbNextQuestions(key); if (!qs.length) return '';
  return `<div class="hb-nx" aria-label="${_hbE(i18t('hb_nx_label'))}"><span class="hb-nx-l">${_hbE(i18t('hb_nx_label'))}</span>${qs.map(q => `<button type="button" class="hb-nx-q" data-hb-next="${_hbE(q)}">${_hbE(q)}</button>`).join('')}</div>`;
}
/* a chip's menu, opened or closed (the press, and Escape) */
function hbRdToggle(key, part){ const p = key && part ? key + '|' + part : null; _hbRdOpen = p && _hbRdOpen !== p ? p : null; return _hbRdOpen; }
/* the chip row is redrawn IN PLACE (a whole-panel redraw replays every
   reply's entrance); the panel is redrawn only when the row is not found */
function hbDockRepaint(){
  try {
    const h = (window.intel && Array.isArray(intel.history)) ? intel.history : [];
    let done = false;
    document.querySelectorAll('[data-ig-turn] .hb-rd').forEach(el => {
      const turn = el.closest('[data-ig-turn]'); const i = Number(turn && turn.getAttribute('data-ig-turn'));
      const m = h[i]; if (!m || !m.reading) return;
      el.outerHTML = hbReadingHtml(m.reading, hbReadingLive(i)); done = true;
    });
    if (!done && typeof renderIntelDock === 'function') renderIntelDock();
  } catch (_){ if (typeof renderIntelDock === 'function') try { renderIntelDock(); } catch (_e){ /* the panel is not up */ } }
}
/* a chip's choice, through the card's own writer; a change right after an
   answer is kept as a possible misreading (Part 6, kind 'fix') */
function hbReadingSet(key, part, v){
  const s = hbS(); if (!key || !HB_RD_PARTS.includes(part)) return false;
  const before = hbDigData(key, s.lens); if (!before) return false;
  const P0 = hbPlan(before);
  hbRecipeSet(key, part, v);
  const h = (window.intel && Array.isArray(intel.history)) ? intel.history : [];
  const m = h.slice().reverse().find(x => x && x.reading && x.reading.key === key);
  if (m && Date.now() - (m.reading.at || 0) <= HB_FIX_WINDOW_MS){
    const q = (h.slice(0, h.indexOf(m)).reverse().find(x => x && x.role === 'user') || {}).text || '';
    hbFeedbackSend({ kind: 'fix', q, recipe: hbCardClean(P0), changed: { [part]: v } });
  }
  return true;
}
const HB_FIX_WINDOW_MS = 30000;

/* ============================================================
   THE BOARD'S WORD BOOK (work order "the board that answers right", Part 3,
   5 Oct 2026; Power BI's linguistic schema, Tableau's semantics)
   ============================================================
   The company's own words — "deals", "BU", "ramavtal" — and what the board
   reads them as. ONE list, an admin's (PUT /api/settings/board-words), read
   off the settings blob. Before the board's own reader runs, a company word
   is swapped for a phrase the reader already knows; Copilot is handed the
   same list in the data guide. Words are DATA: escaped, never a regex built
   from translated text. A word the reader already reads is refused in the
   drawer (hbWordClash) — a company word never overrides a built-in one. */
const HB_WORD_SPLIT = { status: 'stage', folder: 'stream', counterparty: 'counterparty', owner: 'owner', kind: 'type', side: 'side', payterms: 'payment terms', valueBand: 'value band', move: 'whose move', rounds: 'negotiation rounds', overdue: 'overdue duties', decision: 'renewal decision', risks: 'risks found' };
const HB_WORD_MEASURE = { count: 'how many', value: 'value', daysToSign: 'days to sign', medianDaysToSign: 'median days to sign', payDays: 'payment days', rounds: 'negotiation rounds', live: 'live contracts' };
const HB_WORD_STAGE = { 'Draft': 'drafts', 'Under Review': 'in review', 'Signed': 'signed', 'Declined': 'declined' };
const HB_WORD_KINDS = ['set', 'split', 'measure', 'stage', 'type', 'side'];
function hbWords(){ try { const l = state && state.settings && state.settings.boardWords; return Array.isArray(l) ? l.filter(w => w && w.say && w.means) : []; } catch (_){ return []; } }
/* the phrase the board's own reader knows, for one meaning */
function hbWordPhrase(m){
  if (!m) return '';
  if (m.kind === 'split') return HB_WORD_SPLIT[m.value] || '';
  if (m.kind === 'measure') return HB_WORD_MEASURE[m.value] || '';
  if (m.kind === 'stage') return HB_WORD_STAGE[m.value] || '';
  if (m.kind === 'side') return m.value === 'supplier' ? 'suppliers' : m.value === 'customer' ? 'customers' : '';
  if (m.kind === 'set' || m.kind === 'type') return hbPlainText(m.value, 80);
  return '';
}
const _hbReEsc = t => String(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* the question with every company word swapped; longest words first, so
   "frame agreements" is read before "agreements" */
/* ============================================================
   THE ANALYST'S PHRASEBOOK (Young, 6 Oct 2026: "think like an analyst … all
   the formats and ways an analyst would ask questions when it comes to
   analysing numbers … teach HaTi. Be expansive")
   ============================================================
   An analyst's shorthand — QoQ, trailing twelve months, quarter to date,
   "breakdown of", "concentration", "deal size", "is it growing", "Q1 vs Q2"
   — said back in the board's own words, BEFORE the reader reads it, so one
   reader (hbParse → hbRecipeRead) answers both. Each rule is a plain
   rewrite; nothing here counts, and a phrase the board cannot answer is left
   alone for Copilot (which is always given the words as typed, never these).
   Where a comparison or a growth question names no date, it reads the
   SIGNING date ("value of our contracts this quarter" = signed this
   quarter): HB_AW_DATE is put in its place, and becomes "signed" only when
   the question names no date of its own. Rules run in order, on the
   question lower-cased with its punctuation kept as spaces. */
const HB_AW_DATE = ' \u0001 ';
const _hbAwN = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12 };
const _hbAwNum = w => /^\d+$/.test(w) ? Number(w) : (_hbAwN[w] || 1);
const _hbAwUnit = u => /^q/.test(u) ? 'quarter' : /^y/.test(u) ? 'year' : 'month';
const _hbAwPrev = u => u === 'year' ? 'compared with last year' : 'compared with the previous ' + u;
const _HB_AW_MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const _HB_AW_MON = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const _hbAwMon = w => _HB_AW_MONTHS.findIndex(m => m.startsWith(String(w).toLowerCase().slice(0, 3))) + 1;
const _hbAwQ = w => { const x = String(w).toLowerCase(); return /^q/.test(x) ? Number(x.slice(1)) : ['first', 'second', 'third', 'fourth'].indexOf(x.split(' ')[0]) + 1; };
/* the whole period before this one, as an exact range: "last quarter" is the
   previous quarter, not the one we are in */
function _hbAwPrevRange(u){
  const d = hbToday(), y = Number(d.slice(0, 4)), m = Number(d.slice(5, 7));
  if (u === 'year') return ` from ${y - 1}-01-01 to ${y - 1}-12-31 `;
  if (u === 'quarter'){ let q = Math.ceil(m / 3) - 1, yy = y; if (q < 1){ q = 4; yy = y - 1; } return ` from ${_hbAwDay(yy, q * 3 - 2, 1)} to ${_hbAwDay(yy, q * 3, 0)} `; }
  let mm = m - 1, yy = y; if (mm < 1){ mm = 12; yy = y - 1; } return ` from ${_hbAwDay(yy, mm, 1)} to ${_hbAwDay(yy, mm, 0)} `;
}
/* a day as ISO: day 0 is the last day of that month */
const _hbAwDay = (y, m, d) => { const x = new Date(Date.UTC(Number(y), d === 0 ? Number(m) : Number(m) - 1, d === 0 ? 0 : d)); return x.toISOString().slice(0, 10); };
/* TWO NAMED PERIODS (Young, 6 Oct 2026 — "any two periods"): side by side
   when one runs straight into the other ("Q4 2025 vs Q1 2026"), else the
   later one held against the earlier with the change said ("Q1 2025 vs Q3
   2026"); each period is [from, to] */
const _hbAwNextDay = iso => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + 1); return d.toISOString().slice(0, 10); };
function _hbAwTwo(a, b, unit){
  const [x, y] = a[0] <= b[0] ? [a, b] : [b, a];
  if (x[0] === y[0]) return HB_AW_DATE + ` from ${x[0]} to ${x[1]} `;
  if (_hbAwNextDay(x[1]) === y[0]) return HB_AW_DATE + ` by ${unit} from ${x[0]} to ${y[1]} `;
  return HB_AW_DATE + ` from ${y[0]} to ${y[1]} compared with ${x[0]} to ${x[1]} `;
}
const _hbAwQRange = (y, q) => [_hbAwDay(y, q * 3 - 2, 1), _hbAwDay(y, q * 3, 0)];
const _hbAwHRange = (y, h) => { const two = /2|second/.test(String(h).toLowerCase()); return [_hbAwDay(y, two ? 7 : 1, 1), _hbAwDay(y, two ? 12 : 6, 0)]; };
const _HB_AW_GRP = '(suppliers?|vendors?|customers?|clients?|counterpart(?:y|ies)|partners?|streams?|value streams?|departments?|business units?|owners?|types?|contract types?|stages?)';
const _HB_AW_THIS = '(?:this|the current|current)\\s+(month|quarter|year)';
const _HB_AW_LAST = '(?:last|the last|previous|the previous|prior|the prior|preceding|the preceding)\\s+(month|quarter|year)';
const _HB_AW_VS = '(?:vs\\.?|versus|against|compared (?:to|with)|compare (?:to|with)|and|to|with|over|relative to)';
const HB_ANALYST_WORDS = [
  /* -- politeness and verbs that ask for an analysis, never a set -- */
  [/^\s*(?:can you |could you |would you |please |pls |kindly )+/, ' '],
  [/\b(?:i (?:want|would like|'d like|need) to (?:see|know|understand)|i want|i need|let me see|give me|tell me|show me|walk me through|help me understand|i'?m curious about)\b/, ' '],
  [/\b(?:analy[sz]e|analysis of|analytics on|look at|run (?:the numbers|a report) on|report on|dig into|drill into)\b/, ' '],
  [/\b(what|who|that|it|how|where|when)['’]s\b/, '$1 is'],
  [/\bhow\s+(?:did|do|are|have|has|is)\s+(?:we|it|things)\s+(?:do|done|doing|performing|perform|performed|tracking|track|trending|gone|going|look(?:ing)?|fared|faring)\b/, ' '],
  [/\bwhat\s+(?:does|do|did)\s+(?:our\s+|the\s+)?(?:contracts|portfolio|book)\s+look\s+like\b/, ' contracts '],
  [/\bhow\s+big\s+(?:is|are)\b|\bhow\s+(?:is|are)\b(?=\s+(?:our\s+|the\s+)?(?:value|contracts|spend|money|portfolio|pipeline))/, ' '],
  [/\b(?:tied up|locked up|sitting)\s+(?:in|with)\b/, ' in '],
  [/\b(?:contract|deal|signing)\s+(?:counts?|volumes?)\b|\bvolumes?\s+of\s+(?:contracts|deals|agreements)\b|\bdeal\s+flow\b/, ' contracts signed '],
  [/\b(?:the\s+|our\s+)?pipeline\b/, ' contracts in negotiation ' + HB_AW_DATE],
  [/\b(?:the\s+|our\s+)?(?:business|company|organi[sz]ation)\b(?=\s+(?:growing|grow|shrinking|trend|signed))/, ' contracts '],
  [/\b(?:our|the)\s+book\b/, ' contracts '],
  [/\bhow\s+much\s+(?:more|less)\b/, ' value '],
  [/\bhow\s+many\s+(?:more|fewer|less)\b/, ' contracts '],
  [/\b(?:did|do|have|has|will)\s+we\s+(?:sign|signed)\b/, ' signed '],
  [/\baverage\s+(?:contract\s+|deal\s+)?(?:worth|size)\b/, ' average contract value '],
  /* -- the Swedish analyst -- */
  [/\bjämför(?:t)?\b(?!\s+med)/, ' '],
  [/\bi\s+år\s+(?:med|mot|jämfört med|kontra)\s+(?:förra året|i fjol|föregående år)\b/, HB_AW_DATE + ' this year compared with last year '],
  [/\bdetta\s+kvartal\s+(?:med|mot|jämfört med|kontra)\s+(?:förra|föregående)\s+kvartal(?:et)?\b/, HB_AW_DATE + ' this quarter compared with the previous quarter '],
  [/\b(?:(?:tillväxt(?:en)?|växer|växt|utveckling(?:en)?|trenden)(?:\s+(?:i|av|för|på))?|trend\s+(?:i|av|för|på))\b/, HB_AW_DATE + ' trend '],
  [/\bvärdet\b/, ' value '],
  [/\b(månad|kvartal)(?:erna|en)\b/, '$1er'],
  [/\båren\b/, 'år'],
  [/\bantal\s+avtal\b/, ' contracts '],
  [/\b(?:fördelning(?:en)?|uppdelning(?:en)?)\s+(?:av|på)\s+/, ' '],
  [/\bandel(?:en)?\s+av\s+(?:värdet|värde|value)\s+per\b/, ' value as a share of the total by '],
  [/\bandel(?:en)?\s+av\s+(?:avtalen|avtal)\s+per\b/, ' contracts as a share of the total by '],
  /* -- the book itself -- */
  [/\b(?:our |the )?(?:contract (?:book|portfolio|base)|portfolio|book of contracts|contract estate|deal book)\b/, ' contracts '],
  [/\b(?:agreements|deals)\b(?! (?:to|getting))/, ' contracts '],
  [/\bsignings\b/, ' contracts signed '],
  [/\b(?:new business|bookings|new deals|deals closed|closed deals|contracts closed|contracts won|wins)\b/, ' contracts signed '],
  /* -- money words an analyst uses for contract value -- */
  [/\b(?:total contract value|tcv|acv|annual contract value|deal values?|deal sizes?|contract sizes?|ticket sizes?|size of (?:our )?contracts|size of (?:our )?deals|commitments?|committed spend|spend under contract)\b/, ' value '],
  [/\b(?:average|mean|avg\.?)\s+value\b/, ' average contract value '],
  [/\b(?:typical|usual|normal|middle)\s+(?:contract\s+)?value\b/, ' median contract value '],
  [/\b(?:typical|usual)\s+(?:contract|deal)\b/, ' median contract value '],
  /* -- rolling and to-date periods -- */
  [/\b(?:last|past|previous|trailing|next|coming)\s+(\d+)\s+days?\b/, (m, n) => ` ${/^(?:next|coming)/.test(m) ? 'next' : 'last'} ${Math.max(1, Math.round(Number(n) / 30))} months `],
  [/\b(?:ttm|ltm|ntm|trailing twelve months|trailing 12 months|last twelve months|rolling twelve months|rolling 12 months|twelve months trailing|12 months trailing)\b/, m => /ntm/.test(m) ? ' next 12 months ' : HB_AW_DATE + ' last 12 months '],
  [/\b(?:trailing|rolling)\s+(\d+|one|two|three|four|five|six|nine|twelve)[- ]?(months?|quarters?|years?)\b/, (m, n, u) => HB_AW_DATE + ` last ${_hbAwNum(n)} ${_hbAwUnit(u)}s `],
  [/\b(over|in|during|from|for|within)\s+the\s+(?:past|last)\s+year\b/, (m, p) => ` ${p} the last 12 months `],
  [/\b(?:qtd|quarter[- ]to[- ]date)\b/, HB_AW_DATE + ' this quarter '],
  [/\b(?:mtd|month[- ]to[- ]date)\b/, HB_AW_DATE + ' this month '],
  [/\b(?:ytd|year[- ]to[- ]date)\b/, HB_AW_DATE + ' this year '],
  [/\b(?:so far this year|so far in \d{4}|since (?:the )?(?:start|beginning) of (?:the |this )?year|since january|since jan|this calendar year|this financial year|this fiscal year|fytd|fiscal year to date)\b/, HB_AW_DATE + ' this year '],
  [/\b(?:to date|so far|all time|ever|historically)\b/, ' '],
  /* -- comparisons of one period with another -- */
  [/\b(?:qoq|q\/q|q-o-q|quarter[- ]over[- ]quarter|quarter vs\.? quarter|quarterly change|change quarter on quarter)\b/, () => HB_AW_DATE + _hbAwPrevRange('quarter') + ' compared with the previous quarter '],
  [/\b(?:yoy|y\/y|y-o-y|year[- ]over[- ]year|year vs\.? year|annual change|change year on year|year on year)\b/, HB_AW_DATE + ' this year compared with last year '],
  [/\b(?:mom|m\/m|m-o-m|month[- ]over[- ]month|month vs\.? month|monthly change|change month on month)\b/, () => HB_AW_DATE + _hbAwPrevRange('month') + ' compared with the previous month '],
  [new RegExp('\\b(?:between\\s+)?' + _HB_AW_THIS + '\\s+' + _HB_AW_VS + '\\s+' + _HB_AW_LAST + '\\b'), (m, a) => HB_AW_DATE + ` this ${a} ${_hbAwPrev(a)} `],
  [new RegExp('\\b(?:between\\s+)?' + _HB_AW_LAST + '\\s+' + _HB_AW_VS + '\\s+' + _HB_AW_THIS + '\\b'), (m, a) => HB_AW_DATE + ` this ${a} ${_hbAwPrev(a)} `],
  [/\b(?:between|across|over|for|in)\s+(?:the\s+)?(?:last|past|previous)\s+(?:2|two)\s+(months|quarters|years)\b/, (m, u, off, str) => {
    /* "quarterly … for the last 2 years" is a period to draw, not a comparison */
    if (!/^between/i.test(m) && /\b(?:by|per|each|every)\s+(?:month|quarter|year)\b|\b(?:monthly|quarterly|yearly|annually)\b/i.test(str)) return ` over the last 2 ${u} `;
    const x = _hbAwUnit(u); return HB_AW_DATE + (x === 'year' ? ` this year ${_hbAwPrev(x)} ` : _hbAwPrevRange(x) + ` ${_hbAwPrev(x)} `); }],
  [/\b(?:pop|period[- ]over[- ]period|period on period)\b/, () => HB_AW_DATE + _hbAwPrevRange('quarter') + ' compared with the previous quarter '],
  [/\bthis\s+(month|quarter|year)\s+(?:vs\.?|versus|against|compared (?:to|with)|than)\s+(?:the\s+)?(?:last|previous|prior)(?:\s+one)?\b(?!\s+(?:month|quarter|year))/, (m, u) => HB_AW_DATE + ` this ${u} ${_hbAwPrev(u)} `],
  [/\b(?:than|vs\.?|versus|against)\s+last\s+(month|quarter|year)\b/, (m, u, off, str) => /\bthis\s+(?:month|quarter|year)\b/i.test(str) ? ` ${_hbAwPrev(u)} ` : HB_AW_DATE + ` this ${u} ${_hbAwPrev(u)} `],
  [/\b(?:are\s+we\s+|we\s+are\s+)?(?:ahead\s+of|behind|tracking\s+(?:against|vs\.?|versus|to)|on\s+track\s+(?:against|vs\.?|with)|up\s+on|down\s+on)\s+last\s+(month|quarter|year)\b/, (m, u) => HB_AW_DATE + ` this ${u} ${_hbAwPrev(u)} `],
  [/\b(?:change|difference|delta|movement|variance|swing)\s+(?:in\s+(?:the\s+)?)?(.*?)\s*\b(?:from|since|on|versus|vs\.?|against|over)\s+(?:the\s+)?(?:last|previous|prior)\s+(month|quarter|year)\b/, (m, what, u) => ` ${what} ` + HB_AW_DATE + (u.toLowerCase() === 'year' ? ' this year compared with last year ' : _hbAwPrevRange(u.toLowerCase()) + ` ${_hbAwPrev(u.toLowerCase())} `)],
  [/\b(?:(?:compared (?:to|with)|vs\.?|versus|against)\s+)?(?:the\s+)?same (?:period|time|months?|quarter) (?:last|a|the previous|previous|the prior|prior) year\b/, ' compared with last year '],
  [/\b(?:than|from|vs\.?|versus|against|compared (?:to|with))\s+(?:a year ago|a year earlier|the year before|12 months ago)\b/, ' compared with last year '],
  /* named periods: two quarters, two halves, two years */
  [/\b(?:compare\s+)?(q[1-4]|first quarter|second quarter|third quarter|fourth quarter)(?:\s+((?:19|20)\d{2}))?\s+(?:and|vs\.?|versus|to|with|against)\s+(q[1-4]|first quarter|second quarter|third quarter|fourth quarter)(?:\s+((?:19|20)\d{2}))?\b/, (m, a, ya, b, yb) => {
    const y2 = yb || ya || hbToday().slice(0, 4), y1 = ya || y2;
    return _hbAwTwo(_hbAwQRange(y1, _hbAwQ(a)), _hbAwQRange(y2, _hbAwQ(b)), 'quarter'); }],
  [/\b(?:compare\s+)?(h[12]|first half|second half)(?:\s+((?:19|20)\d{2}))?\s+(?:and|vs\.?|versus|to|with|against)\s+(h[12]|first half|second half)(?:\s+((?:19|20)\d{2}))?\b/, (m, a, ya, b, yb) => {
    const y2 = yb || ya || hbToday().slice(0, 4), y1 = ya || y2;
    /* the two halves of one year: that year by quarter, as before */
    if (y1 === y2) return HB_AW_DATE + ` by quarter from ${y1}-01-01 to ${y1}-12-31 `;
    return _hbAwTwo(_hbAwHRange(y1, a), _hbAwHRange(y2, b), 'quarter'); }],
  [/\b(?:compare\s+)?((?:19|20)\d{2})\s+(?:and|vs\.?|versus|to|with|against)\s+((?:19|20)\d{2})\b/, (m, a, b) => _hbAwTwo([a + '-01-01', a + '-12-31'], [b + '-01-01', b + '-12-31'], 'year')],
  /* two named months: "compare January 2026 with March 2026", "Jan vs Jun" */
  [new RegExp('\\b(?:compare\\s+' + _HB_AW_MON + '(?:\\s+((?:19|20)\\d{2}))?\\s+(?:and|vs\\.?|versus|to|with|against)|' + _HB_AW_MON + '(?:\\s+((?:19|20)\\d{2}))?\\s+(?:vs\\.?|versus|against|compared (?:to|with)))\\s+' + _HB_AW_MON + '(?:\\s+((?:19|20)\\d{2}))?\\b'), (m, a1, ya1, a2, ya2, b, yb) => {
    const a = a1 || a2, ya = ya1 || ya2, ma = _hbAwMon(a), mb = _hbAwMon(b);
    const y2 = yb || ya || hbToday().slice(0, 4), y1 = ya || y2;
    return _hbAwTwo([_hbAwDay(y1, ma, 1), _hbAwDay(y1, ma, 0)], [_hbAwDay(y2, mb, 1), _hbAwDay(y2, mb, 0)], 'month'); }],
  [/\b(?:by|per|each|every)\s+(?:fiscal\s+|financial\s+|calendar\s+)?(quarter|year|month)\s+(?:and\s+)?(?:compared?(?:\s+(?:to|with))?|vs\.?|versus|against)\s+(?:the\s+)?same\s+(?:quarter|month|period)\s+(?:last|a|the previous|previous)\s+year\b/, (m, u) => ` by ${u} compared with last year `],
  /* "last quarter" (no number) is the whole quarter before this one */
  [/\b(?:in\s+|during\s+|for\s+|over\s+)?(?:the\s+)?(?:last|previous|prior)\s+(month|quarter|year)\b/, (m, u, off, str) => {
    const before = str.slice(Math.max(0, off - 24), off).toLowerCase();
    if (/(?:compared (?:to|with)|vs\.?|versus|against|than|from|since|on|over)\s*$/.test(before)) return m;
    return HB_AW_DATE + _hbAwPrevRange(u.toLowerCase()); }],
  /* a named period is an exact range: Q2 2026, H1, March 2026, January to March */
  [/\b(?:in |during |for |over |of )?(?:the )?(q[1-4]|first quarter|second quarter|third quarter|fourth quarter)(?: of)? ((?:19|20)\d{2})\b|\b(?:in |during |for |over )(?:the )?(q[1-4])\b/, (m, q1, y1, q2) => { const q = _hbAwQ(q1 || q2), y = y1 || hbToday().slice(0, 4); return HB_AW_DATE + ` from ${_hbAwDay(y, q * 3 - 2, 1)} to ${_hbAwDay(y, q * 3, 0)} `; }],
  [/\b(?:in |during |for |over |of )?(?:the )?(h[12]|first half|second half)(?: of)?(?: ((?:19|20)\d{2}))?\b/, (m, h, y) => { const two = /2|second/.test(h); y = y || hbToday().slice(0, 4); return HB_AW_DATE + ` from ${_hbAwDay(y, two ? 7 : 1, 1)} to ${_hbAwDay(y, two ? 12 : 6, 0)} `; }],
  [new RegExp('\\b(?:between|from)\\s+' + _HB_AW_MON + '(?:\\s+((?:19|20)\\d{2}))?\\s+(?:and|to|until|till|through|-)\\s+' + _HB_AW_MON + '(?:\\s+((?:19|20)\\d{2}))?\\b'), (m, a, ya, b, yb) => { const ma = _hbAwMon(a), mb = _hbAwMon(b); const y2 = Number(yb || ya || hbToday().slice(0, 4)); const y1 = Number(ya || (ma > mb ? y2 - 1 : y2)); return HB_AW_DATE + ` from ${_hbAwDay(y1, ma, 1)} to ${_hbAwDay(y2, mb, 0)} `; }],
  [new RegExp('\\b(?:in|during|for)\\s+' + _HB_AW_MON + '\\s+((?:19|20)\\d{2})\\b'), (m, a, y) => { const ma = _hbAwMon(a); return HB_AW_DATE + ` from ${_hbAwDay(y, ma, 1)} to ${_hbAwDay(y, ma, 0)} `; }],
  [/^\s*(?:compare|comparison of|contrast|how does|how do|how did)\b/, ' '],
  [/\b(?:changes?|differences?|delta|movements?|variances?|swings?)\s+(?:in|of)\b/, ' '],
  [/\bhow\s+(?:fast|quickly|rapidly|steeply)\s+(?:is|are|has|have|did|does|do)\b/, ' '],
  [/\b(?:are|is)\s+(?:our\s+)?(?:contracts|deals|agreements)\s+getting\s+(?:bigger|larger|smaller)\b|\b(?:contract|deal)\s+sizes?\s+(?:trend|over time)\b/, ' average contract value trend '],
  [/\b(?:are|is)\s+(?:our\s+)?(?:contracts|deals|agreements)\s+(?:getting\s+)?(?:faster|slower|quicker|longer)\s+to\s+(?:sign|close)\b/, ' time to sign trend '],
  [/\bcompared?\b(?! (?:to|with))/, ' '],
  /* -- growth and direction: the trend, read off the signing date -- */
  [/\b(?:growth rate|rate of growth|growth|growing|grown|grow|grows|trajectory|momentum|evolution|evolving|evolved|development|direction of travel|run rate|velocity of signing|pace of signing|pace|cadence)\b/, HB_AW_DATE + ' trend '],
  [/\b(?:going up or down|up or down|rising or falling|increasing or decreasing|more or fewer|more or less|higher or lower|than before|than last time|over the period|changed over time|change over time|changes over time|changed|changing|improv\w*|worsen\w*|deteriorat\w*|slowing down|speeding up|picking up|dropping off|declin\w*|accelerat\w*|decelerat\w*)\b/, HB_AW_DATE + ' trend '],
  [/\b(?:up|down)\s*$/, HB_AW_DATE + ' trend '],
  [/\b(?:are|is)\s+we\s+signing\s+more\b|\bsigning\s+more\b|\bsigning\s+fewer\b|\bsigning\s+less\b/, ' contracts signed trend '],
  /* -- totals and counts -- */
  [/^\s*(?:what is |what s |whats |what are )?(?:the |our )?(?:total|sum|overall|grand total|aggregate)\s+(?:of\s+)?(?:(?:our|all)\s+)?(?:contract\s+)?value(?:\s+of\s+(?:our\s+|all\s+)?contracts)?\s*$/, ' value under contract '],
  [/\b(?:count|number|tally|volume|quantity|no\.?)\s+of\s+(?:our\s+|all\s+)?(?:contracts|agreements)\b/, ' contracts '],
  [/\b(?:sum|total|aggregate)\s+of\s+/, ' '],
  /* -- rankings: groups (the board draws a top N), contracts (the map's own list) -- */
  [new RegExp('(?<!\\d )\\b(?:who are |which are |what are )?(?:our |the )?(?:biggest|largest|top|highest[- ]value|most valuable|key|main|major)\\s+' + _HB_AW_GRP + '(?:\\s+by\\s+(?:value|spend|size))?\\b'), (m, g) => ` top 10 ${g} by value `],
  /* "top ten counterparties", "the 10 biggest suppliers": a ranking of
     groups with no measure named ranks by the money (an analyst's "top" is
     the biggest, not the busiest); a measure said after it wins */
  [new RegExp('\\b(?:the\\s+)?(?:top|biggest|largest|most valuable)\\s+(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+' + _HB_AW_GRP + '\\b(?!\\s+(?:by|as|in|per|with|on|for)\\b)'), (m, n, g) => ` top ${_hbAwNum(n)} ${g} by value `],
  [new RegExp('\\b(?:the\\s+)?(\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\\s+(?:biggest|largest|most valuable)\\s+' + _HB_AW_GRP + '\\b(?!\\s+(?:by|as|in|per|with|on|for)\\b)'), (m, n, g) => ` top ${_hbAwNum(n)} ${g} by value `],
  [new RegExp('\\b(?:the\\s+)?(?:bottom|lowest[- ]value|least valuable)\\s+(\\d+|one|two|three|five|ten)?\\s*' + _HB_AW_GRP + '(?:\\s+by\\s+(?:value|spend|size))?\\b'), (m, n, g) => ` the ${n ? _hbAwNum(n) : 5} smallest ${g} by value `],
  [new RegExp('\\b(?:the\\s+)?bottom\\s+(\\d+|one|two|three|five|ten)\\s+' + _HB_AW_GRP + '\\s+by\\s+(?:value|spend|size)\\b'), (m, n, g) => ` the ${_hbAwNum(n)} smallest ${g} by value `],
  [new RegExp('(?<!\\d )\\b(?:the\\s+)?smallest\\s+' + _HB_AW_GRP + '\\b'), (m, g) => ` the 5 smallest ${g} `],
  [new RegExp('\\b(?:rank(?:ed)?|ranking\\s+of|leaderboard\\s+of|league\\s+table\\s+of|order)\\s+(?:the\\s+|our\\s+)?' + _HB_AW_GRP + '\\s+by\\s+(?:(?:the\\s+)?(?:number|count)\\s+of\\s+)?contracts\\b'), (m, g) => ` contracts by ${g} most contracts first `],
  [new RegExp('\\b(?:rank(?:ed)?|ranking\\s+of|leaderboard\\s+of|league\\s+table\\s+of|order)\\s+(?:the\\s+|our\\s+)?' + _HB_AW_GRP + '(?:\\s+by\\s+(?:value|spend|size|money))?\\b'), (m, g) => ` value by ${g} biggest first `],
  [new RegExp('\\b(?:which|what)\\s+' + _HB_AW_GRP + '\\s+(?:has|have|holds?|carr(?:y|ies)|owns?|signs?)\\s+(?:the\\s+)?most\\s+(value|spend|money|contracts)\\b'), (m, g, w) => w === 'contracts' ? ` contracts by ${g} most contracts first ` : ` value by ${g} biggest first `],
  [/\bwho\s+(?:owns|holds|has|manages)\s+the\s+most\s+(value|spend|money|contracts)\b/, (m, w) => w === 'contracts' ? ' contracts by owner most contracts first ' : ' value by owner biggest first '],
  [new RegExp('\\b(?:which|what)\\s+' + _HB_AW_GRP + '\\s+(?:signs?|closes?|close)\\s+(?:the\\s+)?(?:fastest|quickest|slowest)\\b'), (m, g) => ` time to sign by ${g} `],
  [new RegExp('\\b(?:which|what)\\s+' + _HB_AW_GRP + '\\s+(?:carr(?:y|ies)|has|have|holds?)\\s+(?:the\\s+)?most\\s+risk\\b'), (m, g) => ` risk exposure by ${g} biggest first `],
  [/\bhow\s+much\s+(?:value|money|spend)\s+(?:is|sits)\s+at\s+risk\b|^\s*(?:value|money)\s+at\s+risk\s*$/, ' risk exposure by counterparty '],
  [/\b(?:share|percent(?:age)?|proportion|how many)\s+of\s+(?:our\s+)?contracts\s+(?:that\s+|which\s+)?(?:meet|comply with|are within|follow|are on)\s+(?:our\s+)?standards?\b/, ' contracts by standards as a share of the total '],
  [/\b(?:what\s+)?(?:share|percent(?:age)?|proportion|portion)\s+of\s+(?:our\s+)?(contracts|value)\s+(?:are|is|that are|that is)\s+(signed|executed|in draft|draft|drafts|in review|under review|expired|live|active)\b/, (m, w) => ` ${w} by stage as a share of the total `],
  [/\b(?:what\s+)?(?:share|percent(?:age)?|proportion|portion)\s+of\s+(?:our\s+)?(value|contracts|spend)\s+(?:is|are|sits?)\s+(?:in|with)\s+(?!suppliers|customers|vendors|clients|the\s+top|top)(?:the\s+)?[\p{L}&-]+(?:\s+(?:stream|value stream|department))?/u, (m, w) => ` ${w === 'spend' ? 'value' : w} by stream as a share of the total `],
  [new RegExp('\\bconcentration\\s+(?:in|among|with|of)\\s+(?:the\\s+|our\\s+)?top\\s+(\\d+|three|five|ten)\\s+' + _HB_AW_GRP + '\\b'), (m, n, g) => ` top ${_hbAwNum(n)} ${g} by value as a share of the total `],
  [/\b(?:up|due|coming up)\s+for\s+renewal\b/, ' renewals in the next 12 months '],
  [/\b(?:contracts?\s+)?(?:that|which)\s+(?:auto[- ]?renew|renew\s+automatically|renew\s+by\s+themselves|roll\s+over)\b/, ' by auto-renewal '],
  [/\b(?:price\s+)?(?:indexation|cpi[- ]linked|escalations?|price\s+review)(?:\s+clauses?)?\b/, ' price increases '],
  [new RegExp('\\bprice\\s+increases\\s+(?:by|per|across)\\s+' + _HB_AW_GRP + '\\b'), (m, g) => ` contracts by ${g} and price increases `],
  /* -- distribution, mix and share -- */
  [/\b(?:distribution|spread|range|histogram|dispersion|bands?|bucket(?:s|ed)?|tiers?|sizes?)\s+(?:of\s+)?(?:our\s+)?(?:contract\s+)?(?:values?|sizes?)\b|\b(?:values?|contract sizes?)\s+(?:distribution|spread|bands?|ranges?|buckets?|tiers?)\b|\bby\s+(?:size|value)\s+(?:band|bucket|tier|range)s?\b|\b(?:size|value)\s+(?:bands?|buckets?|tiers?)\b/, ' contracts by value band '],
  [/\b(?:payment (?:days|terms))\s+(?:distribution|spread|mix|breakdown|profile)\b|\b(?:distribution|spread|mix|breakdown|profile)\s+of\s+payment (?:days|terms)\b/, ' contracts by payment terms '],
  [new RegExp('\\b(?:a |the )?(?:breakdown|split|mix|composition|segmentation|profile|distribution)\\s+of\\s+(?:contract\\s+)?' + _HB_AW_GRP + '\\b'), (m, g) => ` contracts by ${g} `],
  [/\b(?:split|spread|distributed|divided|broken\s+down|allocated|spread\s+out|shared)\s+(?:across|by|over|among|between|per)\s+/, ' by '],
  [/\b(?:a |the )?(?:breakdown|split|mix|composition|segmentation|profile|make[- ]up|makeup|distribution|spread|allocation|cut)\s+(?:of|in|across|for)\s+/, ' '],
  [/\b(?:breakdown|split|mix|composition|segmentation|profile|make[- ]up|makeup|distribution|allocation)\s+(by|per|across)\b/, ' by '],
  [/\b(?:breakdown|mix|composition|split)\b/, ' '],
  [/\b(?:what\s+)?(?:share|percent(?:age)?|proportion|portion|fraction|%)\s+of\s+(value|contracts|spend)\s+(?:is |are |sits |sit |lies |goes )?(?:with|in|from|to)\s+(suppliers|customers|vendors|clients)\b/, (m, w) => ` ${w === 'spend' ? 'value' : w} by side as a share of the total `],
  [/\b(?:what\s+)?(?:share|percent(?:age)?|proportion|portion|fraction|%)\s+of\s+(?:(?:our|the)\s+)?(value|contracts|spend)\s+(?:by|per|across)\s+/, (m, w) => ` ${w === 'spend' ? 'value' : w} as a share of the total by `],
  [new RegExp('\\b(?:what\\s+)?(?:share|percent(?:age)?|proportion|portion|fraction|%)\\s+of\\s+(?:(?:our|the)\\s+)?(value|contracts|spend)\\s+(?:sits?\\s+|is\\s+|lies\\s+|goes\\s+)?(?:with|in|to)\\s+(?:the\\s+|our\\s+)?top\\s+(\\d+|three|five|ten)\\s+' + _HB_AW_GRP + '\\b'), (m, w, n, g) => ` top ${_hbAwNum(n)} ${g} by ${w === 'contracts' ? 'contracts' : 'value'} as a share of the total `],
  [/\b(?:how\s+concentrated\s+(?:is|are)\s+(?:our\s+)?(?:value|spend|contracts)|concentration(?:\s+(?:of|in)\s+(?:our\s+)?(?:value|spend|contracts))?|concentration risk|dependence on|reliance on|pareto(?:\s+of\s+(?:value|spend))?|80\/20)\b/, (m, off, str) => ' value as a share of the total ' + (/\bby\b/.test(str) ? '' : 'by counterparty ')],
  /* -- running totals -- */
  [/\b(?:cumulative|cumulatively|accumulated|running total of|running sum of|running|cume)\b(?! total)/, ' running total '],
  /* -- signing speed -- */
  [/\b(?:how long (?:do|does|did) (?:our |the )?(?:contracts|it|they|agreements) (?:take|need) to (?:sign|close|execute|get signed)|signing speed|speed of signing|speed to sign|time to close(?: contracts)?|time to execute|time to signature|deal velocity|sales cycle(?: length)?|contract cycle(?: time)?|days to close|lead time|average time to close)\b/, ' time to sign '],
  [/\bmedian (?:time to sign|days to sign|signing time|cycle time)\b/, ' median time to sign '],
  /* -- endings, renewals and notice -- */
  [/\b(?:expiries|expirations|maturities|contracts (?:coming|falling) due|roll[- ]?offs?)\b/, ' contracts ending '],
  [/\b(?:upcoming|forthcoming|pending|due)\s+(renewals?|expiries|expirations|endings?|notice dates?|notice deadlines?|contracts ending|renewal decisions)\b/, (m, w) => ` ${w} over the next 12 months `],
  [/\b(?:give |the )?notice (?:dates?|deadlines?|windows?|periods? ending)\b/, ' renewal decisions '],
  [/\b(contracts ending|renewals?|value ending)\s+(?:in\s+)?(?:the\s+)?(?:next|coming)\s+(\d+|twelve|six|three)\s+months\s+by\s+(?:value|spend)\b/, (m, w, n) => ` value ending by month over the next ${_hbAwNum(n)} months `],
  [/\b(?:contracts that auto[- ]?renew|auto[- ]?renewing contracts|evergreen(?: contracts)?|tacit renewals?|rolling contracts)\b/, ' contracts by auto-renewal '],
  [new RegExp('\\bauto[- ]?renewals?\\s+(value|contracts)\\s+(?:by|per)\\s+' + _HB_AW_GRP + '\\b'), (m, w, g) => ` ${w} by ${g} and auto-renewal `],
  /* -- what the wording says, and our standards -- */
  [/\b(?:standards? breaches|breaches of (?:our )?standards|deviations(?: from (?:our )?standards)?|non[- ]?compliant contracts|off[- ]policy contracts|policy breaches|playbook deviations)\s+(?:by|per|across)\s+/, ' contracts off standard by '],
  [/\b(?:uncapped liability|unlimited liability|no liability cap|without a liability cap|liability caps?)(?:\s+value)?\b/, m => /value$/i.test(m) ? ' value by liability cap ' : ' by liability cap '],
  [new RegExp('\\b(?:contracts\\s+)?with\\s+price\\s+(?:increases|escalations?|rises|indexation|review clauses)(?:\\s+clauses)?\\s+(?:by|per|across)\\s+' + _HB_AW_GRP + '\\b'), (m, g) => ` contracts by ${g} and price increases `],
  [new RegExp('\\bprice\\s+(?:escalations?|rises|indexation|review)(?:\\s+clauses)?\\s+(?:by|per|across)\\s+' + _HB_AW_GRP + '\\b'), (m, g) => ` contracts by ${g} and price increases `],
  /* -- a matrix of two facts -- */
  [/\b(?:heat ?map|matrix|grid|cross[- ]?tab(?:ulation)?|pivot(?: table)?)\s+of\s+([a-z]+)\s+(?:by|against|vs\.?|versus|x|and)\s+([a-z]+)\b/, (m, a, b) => /^(?:contracts?|value|agreements|deals|spend)$/i.test(a) ? m
    : /^(?:month|quarter|year)s?$/i.test(b) ? ` contracts by ${b.replace(/s$/i, '')} and ${a} as a heatmap ` : ` contracts by ${a} and ${b} as a heatmap `],
  [/\b([a-z]+)\s+(?:by|against|vs\.?|versus|x)\s+([a-z]+)\s+(?:matrix|grid|cross[- ]?tab|pivot(?: table)?)\b/, (m, a, b) => ` contracts by ${a} and ${b} as a heatmap `],
  /* -- the whole book at a glance -- */
  [/^\s*(?:(?:our |the |my )?(?:kpis?|key (?:numbers|figures|metrics|stats)|headline (?:numbers|figures)|top[- ]line (?:numbers|figures)|portfolio (?:overview|summary|snapshot)|overview|snapshot|the numbers|numbers|summary of (?:our |the )?contracts|contract summary|scorecard|contracts (?:overview|summary|snapshot)|overview of (?:our |the )?contracts|state of (?:the|our) (?:book|contracts|portfolio)))\s*$/, ' value by stage '],
  /* -- a stream named by its own word: "the sales stream" -- */
  [/\b(?!(?:by|per|each|every|the|our|a|value|which|what|that|this|one|any|and|or|then|vs|versus|in|of|to|for|with|against|x)\b)([a-z]+)\s+stream\b/, ' $1 '],
];
/* the question in the board's own words (the phrasebook, then the date) */
const _hbAwCiMemo = new Map();
const _hbAwCi = re => { let x = _hbAwCiMemo.get(re); if (!x){ x = re.flags.includes('i') ? re : new RegExp(re.source, re.flags + 'i'); _hbAwCiMemo.set(re, x); } return x; };
function hbAnalystWords(q){
  const raw = String(q == null ? '' : q);
  /* the words keep their case (a card's name is read from them as typed);
     every rule reads them case-blind. A card's own name ("… called
     Pipeline") is never rewritten: it is set aside and put back. */
  const nm = /\s(?:called|named|titled|kallad|med namnet|med rubriken)\s.+$/i.exec(raw);
  const body = nm ? raw.slice(0, nm.index) : raw;
  let t = ' ' + body.replace(/[?!;()]/g, ' ').replace(/,(?=\s)/g, ' ').replace(/\s+/g, ' ') + ' ';
  for (const [re, to] of HB_ANALYST_WORDS) t = t.replace(_hbAwCi(re), to).replace(/ {2,}/g, ' ');
  /* a comparison or a trend with no date of its own reads the signing date */
  if (t.includes('\u0001')){
    const plain = t.replace(/\u0001/g, ' ').toLowerCase();
    const named = HB_RC.date.some(([, re]) => re.test(plain));
    /* contracts not yet signed have no signing date: they move by the day
       they were raised */
    const unsigned = /\b(?:in negotiation|drafts?|in review|under review|unsigned|not signed)\b/.test(plain);
    t = t.replace(/\s*\u0001\s*/, named ? ' ' : unsigned ? ' created ' : ' signed ').replace(/\u0001/g, ' ');
  }
  t = t.replace(/\b(?:delta|variance|movement|going|is\s+(?=contracts|value)|what\s+is\s+our)\b/gi, ' ');
  /* said once: a second "trend" or "signed" adds nothing; a comparison is
     the answer, so a trend word beside it steps aside */
  let seenT = false; t = t.replace(/\btrend\b/gi, w => seenT ? ' ' : (seenT = true, w));
  if (/\bcompared with\b/i.test(t)) t = t.replace(/\btrend\b/gi, ' ');
  let seenS = false; t = t.replace(/\bsigned\b/gi, w => seenS ? ' ' : (seenS = true, w));
  t = t.replace(/\b(contracts?)(\s+\1\b)+/gi, '$1');
  /* a running total runs over time: by month where no period is named */
  if (/\brunning total\b/i.test(t) && !/\b(?:by|per|each|every)\s+(?:month|quarter|year)\b|\b(?:monthly|quarterly|yearly)\b/i.test(t))
    t += /\b(?:sign|signed|end|ending|expir\w*|start|created|renew\w*)\b/i.test(t) ? ' by month' : ' signed by month';
  t = t.replace(/\s+/g, ' ').trim();
  if (nm) t += nm[0];
  return t || raw;
}
function hbWordsApply(q){
  let t = String(q || ''); const list = hbWords();
  if (!list.length || !t) return t;
  list.slice().sort((a, b) => String(b.say).length - String(a.say).length).forEach(w => {
    const ph = hbWordPhrase(w.means); if (!ph) return;
    const re = new RegExp('(^|[^\\p{L}\\p{N}])' + _hbReEsc(String(w.say).trim()) + '(?=$|[^\\p{L}\\p{N}])', 'giu');
    t = t.replace(re, (m, pre) => pre + ph);
  });
  return t;
}
/* a word the board already reads, on its own or after "by": refused, so a
   company word can never change what the built-in reader does */
function hbWordClash(say){
  const w = String(say || '').trim(); if (!w) return false;
  try {
    if (hbParse(w)) return true;
    const R = hbRecipeRead('contracts by ' + w); if (R && R.split && !R.left) return true;
    if (typeof igConditions === 'function' && igConditions(w).length) return true;
  } catch (_){ return false; }
  return false;
}
/* the built-in words, drawn read-only in the drawer: read off the reader's
   own group words (HB_RC_GW), never a second copy */
function hbWordsBuiltIn(){
  return Object.keys(HB_RC_GW).map(g => ({ group: g, words: HB_RC_GW[g].replace(/\(\?:/g, '').replace(/[()]/g, '').split('|').map(x => x.replace(/\?/g, '').trim()).filter(Boolean) }));
}
/* the list as Copilot is told it, in the data guide */
function hbWordsGuide(){
  const list = hbWords(); if (!list.length) return '';
  return '- Company words (read them so): ' + list.map(w => `"${hbPlainText(w.say, 40)}" = ${w.means.kind} ${hbPlainText(w.means.value, 60)}`).join('; ') + '.';
}

/* ============================================================
   THE HONEST REPLY (work order "the board that answers right", Part 1, 5 Oct
   2026; the owner's screenshots: "Showing 10 of 181 · Top 10 by value · as
   graph" beside a board of 178, a card named by Copilot's note)
   ============================================================
   Every count, scope and card name in a reply on the board is written by
   HaTi from what was DRAWN. Copilot's own sentence may explain — it is
   printed for a why / explain question, or where Copilot did nothing on the
   board — and it never names, counts or titles: a name it offers is taken
   only where the person's own words asked for one (or asked for a whole
   board to be built). Before a Copilot sentence is printed it is held up
   against the open chart (hbProseChecked); a sentence that disagrees is left
   out and the catch is counted (kind 'disconnect'). */
let _hbAskQ = '';
const HB_NAME_ASK_RE = /\b(?:call (?:it|this|them|the card)|name (?:it|this|the card)|rename|retitle|titled?|kalla (?:den|det)|döp|byt namn)\b/i;
function hbNameAsked(q){
  const t = String(q || '').trim(); if (!t) return false;
  return HB_RC.title.test(t) || HB_NAME_ASK_RE.test(t) || HB_RX.build.test(t.toLowerCase());
}
function hbCopilotMaySay(q){ return HB_WHY_ASK_RE.test(String(q || '')); }
/* the count line: "10 contracts, SEK 729M." — the money only where the card
   measures it and this reader may see it */
function hbAnswerCount(D, P){
  if (!D || !D.n) return '';
  const s = hbS();
  if (P && P.measure === 'value' && hbMoneyOk()) return i18tn('hb_count_n_value', D.n, { n: _hbN(D.n), v: _hbM(hbValueOf(hbListOf(D.ids, s.lens)).v) });
  return i18tn('hb_count_n', D.n, { n: _hbN(D.n) });
}
/* ONE ANSWER WRITER: what is counted, how many, and how it is drawn */
function hbAnswerSay(D, P){
  if (!D) return '';
  const s = hbS(); P = P || (D.kind === 'list' ? hbPlan(D) : null);
  const money = D.kind === 'list' && hbMoneyOk() && P && P.measure === 'value';
  const head = money ? i18tn('hb_found_n_value', D.n, { n: _hbN(D.n), what: D.title || '', v: _hbM(hbValueOf(hbListOf(D.ids, s.lens)).v) })
    : i18tn('hb_found_n', D.n, { n: _hbN(D.n), what: D.title || '' });
  const how = D.kind === 'list' && D.n && P ? ' ' + i18t('hb_found_how', { how: hbHowWord(P) }) : '';
  return _hbE(head + how);
}
/* the name a set Copilot chose is shown under: the one asked for, HaTi's own
   top-N label, the open card's when the question points at it, else the
   person's own words — never Copilot's note */
function hbFoundTitle(q, top){
  const raw = String(q || '').trim();
  const m = HB_RC.title.exec(raw); if (m && m[1]) return hbPlainText(m[1], HB_TITLE_MAX);
  if (top) return hbPlainText(top, HB_TITLE_MAX);
  const low = ' ' + _hbRcNorm(raw) + ' ', key = hbOpenListKey();
  if (key && HB_FU.refer.test(low)) return hbPlainText(hbCrumbOf(key, hbS().lens), HB_TITLE_MAX);
  const t = hbPlainText(raw.replace(/[?!.]+$/, ''), 60);
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : i18t('hb_found_list');
}
/* the reply for a set drawn on the board (after hbShowFound) */
function hbFoundSay(){
  const s = hbS(); const key = (s.path || []).slice(-1)[0]; if (!key) return '';
  return hbAnswerSay(hbDigData(key, s.lens));
}
/* THE DISCONNECT CHECK: a Copilot sentence that states a count the board
   does not show, a picture the open chart is not, or a split it is not split
   by, is left out. Returns the kept text and what was dropped. */
const HB_PIC_CLAIM_RE = /\b(?:as an?|shown as an?|drawn as an?|now an?|into an?|in an?)\s+(pie|ring|doughnut|donut|bar|bars|column|columns|timeline|gantt|heat ?map|blocks|tree ?map)\b/i;
const HB_PIC_OF = { pie: 'ring', ring: 'ring', doughnut: 'ring', donut: 'ring', bar: 'bars', bars: 'bars', column: 'cols', columns: 'cols', timeline: 'gantt', gantt: 'gantt', heatmap: 'heat', 'heat map': 'heat', blocks: 'blocks', treemap: 'blocks', 'tree map': 'blocks' };
const HB_SPLIT_CLAIM_RE = /\b(?:split|grouped|broken down|shown|drawn|now)\b[^.]{0,30}?\bby (stage|stream|value stream|counterparty|owner|type|side|payment terms|month|quarter|year)\b/i;
const HB_SPLIT_OF = { stage: 'status', stream: 'folder', 'value stream': 'folder', counterparty: 'counterparty', owner: 'owner', type: 'kind', side: 'side', 'payment terms': 'payterms', month: 'date', quarter: 'date', year: 'date' };
function hbProseChecked(text){
  const s = hbS(); const key = hbOpenListKey();
  const D = key ? hbDigData(key, s.lens) : null, P = D ? hbPlan(D) : null;
  const counts = new Set();
  try { (String(hbBoardNow() || '').match(/\d[\d,]*/g) || []).forEach(x => counts.add(Number(x.replace(/,/g, '')))); } catch (_){ /* no board to read */ }
  if (D) counts.add(D.n);
  const first = hbWhyCheck(text, counts);
  let dropped = first.dropped;
  const sentences = first.text ? first.text.split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9*"(])/) : [];
  const kept = !P ? sentences : sentences.filter(snt => {
    const pm = HB_PIC_CLAIM_RE.exec(snt);
    if (pm){ const want = HB_PIC_OF[pm[1].toLowerCase().replace(/\s+/, ' ')] || HB_PIC_OF[pm[1].toLowerCase().replace(/\s+/g, '')]; if (want && want !== P.pic && !(want === 'bars' && P.pic === 'cols')){ dropped++; return false; } }
    const sm = HB_SPLIT_CLAIM_RE.exec(snt);
    if (sm){ const by = HB_SPLIT_OF[sm[1].toLowerCase()]; const drawn = [P.split && P.split.by, P.split2 && P.split2.by].filter(Boolean); if (by && drawn.length && !drawn.includes(by)){ dropped++; return false; } }
    return true;
  });
  if (dropped) hbFeedbackSend({ kind: 'disconnect', q: _hbAskQ, said: String(text || '').slice(0, 600) });
  return { text: kept.join(' ').trim(), dropped };
}
/* Copilot's own sentence, as the reply may carry it: only for a why or
   explain question, checked against the open chart, formatted */
function hbCopilotTail(own, q){
  const o = String(own || '').trim(); if (!o || !hbCopilotMaySay(q)) return '';
  const chk = hbProseChecked(o); if (!chk.text) return '';
  return '<br>' + ((typeof aiRichText === 'function') ? aiRichText(chk.text) : _hbE(chk.text));
}
/* THE REVIEW RECORD (Part 6): a mark, a quick fix or a caught disconnect,
   sent to POST /api/board/feedback; the server names the person. Nothing is
   said on the page for a 'fix' or a 'disconnect'. */
function hbFeedbackSend(rec){
  if (!rec || typeof API_MODE !== 'function' || !API_MODE() || typeof api !== 'function') return null;
  try { const p = api('board/feedback', 'POST', rec); return p && p.catch ? p.catch(() => null) : p; } catch (_){ return null; }
}
/* ============================================================
   RIGHT OR WRONG (work order "the board that answers right", Part 6, 5 Oct
   2026; screen 4 of the sketches)
   ============================================================
   Two small marks at the foot of every board reply, free or Copilot's.
   Pressed once — a second press does nothing. "Wrong" sends the question,
   the recipe that was drawn and the reply to the admins' review list and
   says so in ONE quiet line; "Right" is kept quietly. No band, no dialog. */
function hbMarksHtml(i, m){
  if (!m || !m.boardReply) return '';
  const on = m.fb || '';
  const b = (k, ic, lab) => `<button type="button" class="hb-fb-b${on === k ? ' is-on is-' + k : ''}" data-hb-fb="${i}:${k}" aria-label="${_hbE(lab)}" title="${_hbE(lab)}" aria-pressed="${on === k}"${on ? ' disabled' : ''}>${(typeof icon === 'function') ? icon(ic, 'w-3 h-3', 2) : _hbE(lab)}</button>`;
  return `<div class="hb-fb">${on === 'wrong' ? `<span class="hb-fb-said">${_hbE(i18t('hb_fb_sent'))}</span>` : ''}${b('right', 'check2', i18t('hb_fb_right'))}${b('wrong', 'x', i18t('hb_fb_wrong'))}</div>`;
}
function hbMarkPress(i, kind){
  const h = (window.intel && Array.isArray(intel.history)) ? intel.history : [];
  const m = h[i]; if (!m || !m.boardReply || m.fb || !['right', 'wrong'].includes(kind)) return false;
  m.fb = kind;
  const q = (h.slice(0, i).reverse().find(x => x && x.role === 'user') || {}).text || '';
  const before = (h.slice(0, i).reverse().filter(x => x && x.role === 'user')[1] || {}).text || '';
  let recipe = null;
  try { const key = m.reading && m.reading.key; const D = key ? hbDigData(key, hbS().lens) : null; if (D && D.kind === 'list') recipe = hbCardClean(hbPlan(D)); } catch (_){ recipe = null; }
  const said = String(m.text || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 600);
  hbFeedbackSend({ kind, q, after: before, recipe, said });
  return true;
}
function hbMarksRepaint(i){
  try {
    const turn = document.querySelector(`[data-ig-turn="${i}"]`); const el = turn && turn.querySelector('.hb-fb');
    const m = window.intel && intel.history[i];
    if (el && m) el.outerHTML = hbMarksHtml(i, m); else if (typeof renderIntelDock === 'function') renderIntelDock();
  } catch (_){ /* the panel is not up */ }
}
/* a reply asked on the board carries the marks */
function hbBoardReplyMeta(){ try { return (window.state && state.view === 'dashboard' && hbS().face === 'board') ? { boardReply: true } : {}; } catch (_){ return {}; } }
/* ---- VERIFIED VIEWS (work order "the board that answers right", Part 9,
   5 Oct 2026; Power BI's verified answers) ----
   An admin saves a card as the company's answer to named questions
   (PUT /api/settings/board-verified, the list on state.settings). Asking one —
   normalised, exact — draws that card through hbAddCard like any card,
   counted LIVE over this reader's own book, marked VERIFIED with who set it
   and when. A view whose recipe no longer passes the checker is drawn as
   stored and the checker's line is SAID — never silently changed. */
function hbPhraseNorm(q){ return String(q || '').toLowerCase().normalize('NFC').replace(/[^\p{L}\p{N}]+/gu, ' ').trim(); }
function hbVerifiedList(){
  const st = (typeof state === 'object' && state && state.settings) || {};
  return Array.isArray(st.boardVerified) ? st.boardVerified.filter(v => v && v.id && v.recipe && Array.isArray(v.phrases)) : [];
}
function hbVerifiedHit(q){
  const n = hbPhraseNorm(q); if (!n) return null;
  return hbVerifiedList().find(v => v.phrases.some(p => hbPhraseNorm(p) === n)) || null;
}
/* the badge on a card head (the board's card and its open copy alike) */
function hbVerBadgeHtml(p){ if (!p || !p.verified) return ''; const v = hbVerifiedOf(p); return `<span class="hb-vb" title="${_hbE(v ? hbVerifiedByLine(v) : '')}">${_hbE(i18t('hb_ver_badge'))}</span>`; }
function hbVerifiedOf(p){ return p && p.verified && p.verified.id ? hbVerifiedList().find(v => v.id === p.verified.id) || null : null; }
function hbDayShort(iso){
  try { return new Date(String(iso).slice(0, 10) + 'T00:00:00').toLocaleDateString(langLocale(), { day: 'numeric', month: 'short' }); } catch (_){ return String(iso || ''); }
}
function hbVerifiedByLine(v){
  return i18t('hb_ver_by', { by: v.by || '—', at: hbDayShort(v.at), qs: v.phrases.slice(0, 3).map(p => '“' + p + '”').join(', ') });
}
function hbVerifiedAnswer(v){
  const s = hbS();
  /* asked again: the same card, fresh from the stored recipe, back on top */
  const old = s.panels.find(x => x.verified && x.verified.id === v.id);
  if (old) s.panels.splice(s.panels.indexOf(old), 1);
  const { p, left } = hbAddCard(v.which || { all: true }, v.recipe, v.title);
  p.verified = { id: v.id, by: v.by || '', at: v.at || '' };
  hbSave();
  hbDig(p.key, false);
  const D = hbDigData(p.key, s.lens) || { n: 0, kind: 'list', ids: [] };
  let warn = '';
  if (D.kind === 'list'){ try { const pr = hbCardCheck(D, v.recipe, Object.assign(hbPlanSpec(D), hbCardClean(v.recipe))); if (pr.length) warn = ' ' + _hbE(i18t('hb_ver_stale', { why: pr.map(x => x.say).join('; ') })); } catch (_){ /* the line is a courtesy */ } }
  _hbMeta = Object.assign(_hbMeta || {}, { verified: { id: v.id } });
  return `<span class="hb-vb">${_hbE(i18t('hb_ver_badge'))}</span> ${hbAnswerSay(D)}${warn}`
    + (left ? ' ' + _hbE(i18t('hb_panel_left', { what: hbPanelWord(left) })) : '')
    + `<br><span class="hb-ver-by">${_hbE(hbVerifiedByLine(v))}</span>`;
}
/* Copilot is told the phrases, so it does not compete with them */
function hbVerifiedGuide(){
  const L = hbVerifiedList(); if (!L.length) return '';
  return 'Verified views (HaTi answers these questions itself with the company\'s own chart; never offer a different chart for them): '
    + L.slice(0, 20).map(v => `"${v.title}" answers ${v.phrases.slice(0, 6).map(p => '"' + p + '"').join(', ')}`).join('; ') + '.';
}
/* the admin's ⋯ menu and its form, on a card the board built (cd:) */
let _hbMoreMenu = null, _hbVerForm = null;
function hbMayVerify(p){ return !!(p && p.kind === 'view' && /^cd:/.test(p.key || '') && typeof isAdmin === 'function' && isAdmin()); }
function hbVerFormHtml(p){
  const v = hbVerifiedOf(p);
  const ph = v ? v.phrases.join('\n') : '';
  return `<form class="hb-inl hb-verf" data-hb-ver-form="${_hbE(p.id)}">
    <label class="hb-wide">${_hbE(i18t('hb_ver_title'))} <input name="vtitle" maxlength="80" value="${_hbE(v ? v.title : hbPanelWord(p))}"></label>
    <label class="hb-wide">${_hbE(i18t('hb_ver_qs'))} <textarea name="phrases" rows="3" maxlength="1500" placeholder="${_hbE(i18t('hb_ver_qs_ph'))}">${_hbE(ph)}</textarea></label>
    <button type="submit" class="hb-btn is-primary">${_hbE(i18t(v ? 'hb_ver_save' : 'hb_ver_set'))}</button>
    ${v ? `<button type="button" class="hb-btn" data-hb-ver-off="${_hbE(p.id)}">${_hbE(i18t('hb_ver_off'))}</button>` : ''}
    <button type="button" class="hb-btn" data-hb-ver-cancel>${_hbE(i18t('hb_cancel'))}</button>
    <span class="hb-quiet hb-wide" data-hb-ver-say></span></form>`;
}
async function hbVerSave(pid, title, phrasesText, remove){
  const s = hbS(), p = s.panels.find(x => x.id === pid); if (!p) return;
  const v = hbVerifiedOf(p);
  const sayEl = () => document.querySelector(`[data-hb-ver-form="${pid}"] [data-hb-ver-say]`);
  let body;
  if (remove){ if (!v) return; body = { id: v.id, remove: true }; }
  else {
    const D = hbDigData(p.key, s.lens); const P = D ? hbPlan(D) : {};
    const recipe = {}; ['pic', 'split', 'split2', 'measure', 'trend', 'sort', 'top', 'window', 'compare'].forEach(k => { if (P[k] != null) recipe[k] = P[k]; });
    const which = p.which && p.which.q ? { q: p.which.q } : { all: true };
    body = { id: v ? v.id : undefined, title: String(title || '').trim(), which, recipe, phrases: String(phrasesText || '').split(/\n+/).map(x => x.trim()).filter(Boolean) };
  }
  try {
    const r = await api('settings/board-verified', 'PUT', body);
    state.settings = state.settings || {}; state.settings.boardVerified = (r && r.boardVerified) || [];
    if (remove) delete p.verified; else if (r && r.view) p.verified = { id: r.view.id, by: r.view.by, at: r.view.at };
    _hbVerForm = null; hbSave(); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t(remove ? 'hb_ver_offed' : 'hb_ver_saved', { what: body.title || (v && v.title) || '' }), 'ok');
  } catch (e){ const el = sayEl(); if (el) el.textContent = (e && e.message) || String(e); else if (typeof toast === 'function') toast((e && e.message) || String(e), 'err'); }
}
/* ---- SEE IT WHILE YOU TYPE (work order "the board that answers right",
   Part 10, 5 Oct 2026) ----
   ONE READING of a question, PURE: what the answer WOULD be — the verified
   view, a change to the open chart, the board's own command, or Copilot —
   and nothing written (no hbDig, no hbCardSet, no hbSave). hbAsk takes this
   as its first step, so the line over the ask box and the answer are the
   same reading. (Named hbAskReadingOf: hbReadingOf is the chart's reading.) */
function hbAskReadingOf(qRaw){
  const raw = String(qRaw == null ? '' : qRaw);
  if (!raw.trim()) return null;
  const s = hbS();
  if (HB_WHY_ASK_RE.test(raw)) return { road: 'copilot', why: true, q: raw };
  /* A VERIFIED VIEW ANSWERS FIRST (Part 9): the company's own answer to the
     questions an admin named, exact after normalising, before any reading */
  if (s.face === 'board'){ const v = hbVerifiedHit(raw); if (v) return { road: 'free', kind: 'verified', v, q: raw }; }
  /* AN ANSWER PACK (Charts That Explain, rec 3): the four questions that
     matter most get their ready answer, free, the same way every time */
  if (s.face === 'board'){ const pk = hbPackOfQ(raw); if (pk) return { road: 'free', kind: 'pack', pack: pk, q: raw }; }
  /* the company's own words first, then the analyst's phrasebook */
  const q = hbAnalystWords(hbWordsApply(raw));
  const fu = hbFollowUpRead(q);
  if (fu) return { road: 'free', kind: 'follow', fu, q };
  const r = hbParse(q);
  if (!r) return { road: 'copilot', q, r: null };
  /* EXPLORER STAYS AS DESIGNED (the owner's words): on the map side the
     board's reader steps aside for every question but the two that are about
     the screen itself — back to the board, and Present. A question about
     renewals asked of the map is the map's to answer. */
  if (s.face !== 'board' && !((r.act === 'face' && r.face === 'board') || r.act === 'present' || r.act === 'analyze')) return { road: 'map', q, r };
  return { road: 'free', kind: r.act, r, q };
}
/* the line's words for a reading: what it will draw, and free — or Copilot,
   with no price (a cost is never guessed) */
function hbAskPreviewText(A){
  if (!A || A.road === 'map') return '';
  if (A.road === 'copilot') return i18t('hb_pre_copilot');
  const s = hbS(), free = ' · ' + i18t('hb_pre_free');
  try {
    if (A.kind === 'verified') return i18t('hb_pre_verified', { what: A.v.title }) + free;
    if (A.kind === 'pack') return i18t('hb_pre_pack', { what: i18t('hb_pk_' + A.pack) }) + free;
    if (A.kind === 'follow'){
      if (A.fu.narrow){ const N = hbDigData(A.fu.narrow, s.lens); return i18t('hb_pre_narrow', { what: (N && N.title) || '' }) + free; }
      const D = hbDigData(A.fu.key, s.lens); if (!D) return i18t('hb_pre_cmd') + free;
      return i18t('hb_pre_change', { how: hbHowWord(hbCardPlan(Object.assign(hbPlanSpec(D), hbCardClean(A.fu.chart)), D)) }) + free;
    }
    const r = A.r;
    if (r.act === 'dig'){
      if (/^f:/.test(r.key)) return i18t('hb_pre_fig', { what: i18t('hb_f_' + r.key.slice(2)) }) + free;
      const D = hbDigData(r.key, s.lens);
      if (D && D.kind === 'list') return i18t('hb_pre_chart', { what: D.setLabel || D.title || '', how: hbHowWord(hbPlan(D)), n: _hbN(D.n) }) + free;
      return i18t('hb_pre_open', { what: (D && D.title) || '' }) + free;
    }
    if (r.act === 'panel' || r.act === 'remove') return i18t(r.act === 'panel' ? 'hb_pre_panel' : 'hb_pre_remove', { what: i18t(HB_KINDS[r.kind].word) }) + free;
    if (r.act === 'card' || r.act === 'analyze'){ const K = hbCardData(hbContract(r.id)); return i18t(r.act === 'card' ? 'hb_pre_card' : 'hb_pre_analyze', { what: K.ref + ' · ' + K.name }) + free; }
  } catch (_){ /* the line is a courtesy: say the plain thing */ }
  return i18t('hb_pre_cmd') + free;
}
function hbAsk(q){
  _hbMeta = null;
  const A = hbAskReadingOf(q);
  if (!A){ _hbPendingRecipe = null; return null; }
  if (A.why){ _hbPendingRecipe = null; return null; }
  if (A.kind === 'verified'){ _hbPendingRecipe = null; const u = hbUndoTop(); return hbVerifiedAnswer(A.v) + `<div class="hb-cost">${_hbE(i18t('hb_free'))}${hbNoteUndo(u)}</div>`; }
  if (A.kind === 'pack'){
    _hbPendingRecipe = null; const u = hbUndoTop();
    hbDig('pk:' + A.pack, false);
    const P = hbPackData(A.pack, hbS().lens);
    return `<b>${_hbE(P.title)}</b> — ${_hbE(i18t('hb_pk_said'))}${P.lines[0] ? ' ' + P.lines[0] : ''}<div class="hb-cost">${_hbE(i18t('hb_free'))}${hbNoteUndo(u)}</div>`;
  }
  q = A.q;
  const u0 = hbUndoTop();
  const fu = A.kind === 'follow' ? hbFollowUp(q, A.fu) : null;
  if (fu){ _hbPendingRecipe = null; return fu + `<div class="hb-cost">${_hbE(i18t('hb_free'))}${hbNoteUndo(u0)}</div>`; }
  const r = 'r' in A ? A.r : hbParse(q);
  /* a chart question HaTi could not read whole goes on to Copilot with its
     picture words already read (hbShowFound puts them on the answer) */
  _hbPendingRecipe = r ? null : hbRecipeRead(q);
  if (!r) return null;
  const s = hbS();
  if (A.road === 'map') return null;
  const free = i18t('hb_free');
  const say = (html, opts) => { if (!opts || !opts.noPaint){ if (s.face === 'board') hbPaintBoard(opts && opts.jump ? { jump: opts.jump } : undefined); } return html + `<div class="hb-cost">${_hbE(free)}${hbNoteUndo(u0)}</div>`; };
  if (r.act === 'card'){
    const c = hbContract(r.id); const K = hbCardData(c);
    hbDig('c:' + c.id, false);
    return say(`<b>${_hbE(K.ref)} · ${_hbE(K.name)}</b> — ${_hbE(_hbStatus(K.status))}${K.cp ? ' · ' + _hbE(K.cp) : ''}${K.expiry ? ' · ' + _hbE(i18t('hb_c_ends', { day: K.expiry })) : ''}. ${_hbE(i18t('hb_card_said'))}`, { noPaint: true });
  }
  if (r.act === 'analyze'){
    const c = hbContract(r.id); const K = hbCardData(c);
    hbAnalyze(c.id);
    return say(`<b>${_hbE(K.ref)} · ${_hbE(K.name)}</b> — ${_hbE(i18t('hb_analyze_said'))}`, { noPaint: true });
  }
  if (r.act === 'noref') return say(_hbE(i18t('hb_no_ref', { ref: r.ref })), { noPaint: true });
  if (r.act === 'reset'){
    const keep = { screen: s.screen, watches: s.watches, saved: s.saved, seen: s.seen, seq: s.seq, undo: s.undo, undoSeq: s.undoSeq };
    Object.assign(s, hbFresh(), keep); hbSave(); hbLensOnMap();
    hbMount();
    return say(_hbE(i18t('hb_reset_said')), { noPaint: true });
  }
  if (r.act === 'face'){ hbSetFace(r.face); return say(_hbE(i18t(r.face === 'explorer' ? 'hb_face_said_map' : 'hb_face_said_board')), { noPaint: true }); }
  if (r.act === 'present'){ hbPresent(true); return say(_hbE(i18t('hb_present_said')), { noPaint: true }); }
  if (r.act === 'lens'){ hbSetLens(r.lens); return say(_hbE(i18t('hb_lens_said', { lens: i18t('hb_lens_' + r.lens).toLowerCase() })), { noPaint: true }); }
  if (r.act === 'watch'){
    if ((s.watches || []).length >= HB_WATCH_MAX) return say(_hbE(i18t('hb_watch_full', { n: HB_WATCH_MAX })), { noPaint: true });
    s.watches.push({ k: r.k, dir: r.dir, n: r.n }); hbSave(); hbAlertsChanged();
    const now = hbFigNumber(hbBookData('all', { whole: true }), r.k);
    return say(_hbE(i18t('hb_watch_said', { what: i18t('hb_f_' + r.k), dir: i18t('hb_watch_' + r.dir), n: r.n })) + ' ' + _hbE(hbWatchFired(s.watches[s.watches.length - 1]) ? i18t('hb_watch_said_now', { n: r.k === 'value' ? _hbM(now) : _hbN(now) }) : i18t('hb_watch_note')));
  }
  if (r.act === 'split'){
    const kind = r.kind || (s.panels.length ? s.panels[s.panels.length - 1].kind : 'val');
    if (s.face !== 'board'){ s.face = 'board'; hbSave(); }
    const { left } = hbAddPanel(kind, { split: true });
    hbMount();
    return say(_hbE(i18t('hb_split_said', { what: i18t(HB_KINDS[kind].word) })) + (left ? ' ' + _hbE(i18t('hb_panel_left', { what: hbPanelWord(left) })) : ''), { noPaint: true });
  }
  if (r.act === 'panel'){
    if (r.lens && r.lens !== s.lens){ s.lens = r.lens; hbLensOnMap(); }
    const flip = s.face !== 'board'; s.face = 'board';
    const { p, left } = hbAddPanel(r.kind);
    hbSave();
    if (flip && typeof renderDashboard === 'function') renderDashboard(); else hbPaintBoard();
    const host = hbHost(); const el = host && host.querySelector(`[data-hb-pid="${p.id}"]`); if (el && host) host.scrollTop = Math.max(0, el.offsetTop - 12);
    return say(_hbE(hbPanelSay(r.kind, s.lens)) + (left ? ' ' + _hbE(i18t('hb_panel_left', { what: hbPanelWord(left) })) : ''), { noPaint: true });
  }
  if (r.act === 'remove'){
    const i = s.panels.findIndex(x => x.kind === r.kind);
    if (i < 0) return say(_hbE(i18t('hb_not_on_board')), { noPaint: true });
    s.panels.splice(i, 1); hbSave();
    return say(_hbE(i18t('hb_removed', { what: i18t(HB_KINDS[r.kind].word) })));
  }
  if (r.act === 'save'){
    s.saved = (s.saved || []).filter(x => x.name.toLowerCase() !== r.name.toLowerCase());
    s.saved.push({ name: r.name.slice(0, 60), kinds: s.panels.filter(p => HB_KINDS[p.kind]).map(p => p.kind), lens: s.lens }); s.saved = s.saved.slice(-6); hbSave();
    return say(_hbE(i18t('hb_saved_said', { name: r.name })), { noPaint: true });
  }
  if (r.act === 'open'){
    const v = s.saved.find(x => x.name === r.name); if (!v) return null;
    s.panels = []; v.kinds.forEach(k => hbAddPanel(k)); s.lens = v.lens; s.path = []; s.face = 'board'; hbSave(); hbLensOnMap();
    hbMount();
    return say(_hbE(i18t('hb_opened_said', { name: v.name })), { noPaint: true });
  }
  if (r.act === 'dig'){
    hbDig(r.key, false);
    if (/^f:/.test(r.key)) return say(_hbE(hbFigSay(r.key.slice(2))), { noPaint: true });
    const D = hbDigData(r.key, s.lens) || { n: 0, title: '' };
    /* WHEN THE WORDS COULD MEAN MORE THAN ONE THING (work order Part 6): the
       likeliest reading is drawn and SAID, and the others are presses */
    let warn = '';
    if (/^q:/.test(r.key)){ const A = hbAmbiguity(r.key.slice(2)); if (A){ warn += ' ' + _hbE(A.say); _hbMeta = Object.assign(_hbMeta || {}, { choices: A.choices }); } }
    /* THE FREE READER'S CARD IS CHECKED TOO (work order Part 4): no retry —
       it is drawn as asked — and what is wrong with it is said, the same line */
    if (/^q:/.test(r.key) && D.kind === 'list' && D.n){ try { const pr = hbCardCheck(D, {}, hbPlanSpec(D)); if (pr.length) warn += ' ' + _hbE(i18t('hb_chk_free', { why: pr.map(p => p.say).join('; ') })); } catch (_){ /* the line is a courtesy */ } }
    /* THE ANSWER SAYS WHAT IS DRAWN, and money where the card measures it:
       ONE writer (hbAnswerSay) for every reply on the board */
    return say(hbAnswerSay(D) + warn, { noPaint: true });
  }
  return null;
}
function hbFigSay(k){
  const d = hbBookData(hbS().lens); const F = d.figs[k];
  return k === 'value' ? (d.money ? i18t('hb_say_value', { v: _hbM(F.v) }) : i18t('hb_say_value_hidden'))
    : i18tn('hb_say_' + k, F.n, { n: _hbN(F.n) });
}
function hbPanelSay(kind, lens){
  const d = hbPanelData(kind, lens);
  if (kind === 'obl') return i18tn('hb_say_overdue', d.n, { n: _hbN(d.n) });
  if (kind === 'fric') return i18t('hb_p_fric_say', { live: _hbN(d.live), us: _hbN(d.us), them: _hbN(d.them) });
  if (kind === 'ren') return i18tn('hb_p_ren_say', d.n, { n: _hbN(d.n), open: _hbN(d.open) });
  if (kind === 'pay') return d.sides.map(S => i18t('hb_pay_side_' + S.key) + ': ' + (S.n ? i18t('hb_pay_avg', { avg: S.avg == null ? '—' : Math.round(S.avg), std: S.std == null ? '—' : S.std }) : i18t('hb_pay_none'))).join(' ');
  if (kind === 'exp') return d.lead ? i18t('hb_p_exp_say', { what: d.rows[0].title }) : i18t('hb_p_exp_none');
  if (kind === 'val') return i18t('hb_p_val_say');
  return '';
}
/* The dock's suggestions on the board: what is not yet on it, in order. */
function hbSuggestions(){
  const s = hbS(); if (s.face !== 'board') return null;
  const on = new Set(s.panels.map(p => p.kind));
  const out = HB_KIND_KEYS.filter(k => !on.has(k)).slice(0, 2).map(k => i18t('hb_sug_' + k));
  const first = (state.contracts || []).find(c => c && !c.archived && c.status !== 'Declined');
  if (first) out.push(i18t('hb_sug_card', { ref: hbRef(first) }));
  if (s.panels.length) out.push(s.lens === 'all' ? i18t('hb_sug_suppliers') : i18t('hb_sug_all'));
  return out.slice(0, 3);
}
function hbPlaceholder(){ return hbS().face === 'board' ? i18t('hb_ask_ph') : null; }

/* An answer from Copilot or the map that came back as a LIST: shown on the
   board as a dig-in, so a question asked on the board never lands only on
   the map hidden behind it. Called by intelAsk; the board side only. */
/* THE PICTURE OF A LIST COPILOT FOUND: the words HaTi read itself win (they
   are what was typed), Copilot's recipe fills the parts they did not say. */
let _hbPendingRecipe = null;
function hbFoundChart(chart){
  const R = _hbPendingRecipe; _hbPendingRecipe = null;
  const c = (hbRecipeClean({ k: chart || {} }).k) || {};
  if (R){ if (R.pic) c.pic = R.pic; if (R.split) c.split = R.split; if (R.measure && R.measure !== 'count') c.measure = R.measure; if (R.trend) c.trend = true; }
  return Object.keys(c).length ? c : null;
}
function hbShowFound(ids, title, chart){
  const s = hbS(); if (s.face !== 'board' || !Array.isArray(ids) || !ids.length){ _hbPendingRecipe = null; return false; }
  s.found = { title: String(title || '').slice(0, 120), ids: ids.filter(x => typeof x === 'string').slice(0, 2000), chart: hbFoundChart(chart) };
  if (s.recipe) delete s.recipe.ls;
  hbDig('ls', false);
  return true;
}

/* ---------------- WATCH A NUMBER ----------------
   A rule this person set, read where the number is; it becomes a row in the
   bell when the line is crossed, and nothing is sent. buildAlerts asks this. */
function hbWatchAlerts(){
  let s; try { s = hbS(); } catch (_){ return []; }
  if (!s.watches || !s.watches.length) return [];
  const d = hbBookData('all', { whole: true });
  return s.watches.filter(w => { const v = hbFigNumber(d, w.k); return w.dir === 'above' ? v > w.n : v < w.n; }).map(w => {
    const v = hbFigNumber(d, w.k);
    return { k: w.k, text: i18t('hb_watch_alert', { what: i18t('hb_f_' + w.k), now: w.k === 'value' ? _hbM(v) : _hbN(v), dir: i18t('hb_watch_' + w.dir), n: w.k === 'value' ? _hbM(w.n) : _hbN(w.n) }),
      go: () => { if (typeof setView === 'function'){ const st = hbS(); st.face = 'board'; st.path = ['f:' + w.k]; hbSave(); setView('dashboard'); } } };
  });
}
function hbAlertsChanged(){ try { if (typeof updateAlertBadge === 'function') updateAlertBadge(); } catch (_){} }

/* ---------------- GIVE A PANEL TO A COLLEAGUE ----------------
   A RECORD, NOT A PERMISSION. What travels is the panel's NAME — the kind,
   the lens, side by side — and a note; never a figure. The colleague's Home
   counts it again in their own reach (the server scopes every list it sends
   them), so a panel can never show anybody a contract they could not already
   see. The server keeps it (POST /api/home/gifts) and says when it was seen. */
let _hbGifts = { received: [], sent: [], at: 0 };
function hbGiftsFor(){
  const sent = {};
  (_hbGifts.sent || []).forEach(g => { if (g && g.pid && !sent[g.pid]) sent[g.pid] = g; });
  return { received: (_hbGifts.received || []).filter(g => g && HB_KINDS[g.kind]), sent };
}
function hbGiftsLoad(force){
  if (typeof API_MODE !== 'function' || !API_MODE() || typeof api !== 'function') return;
  if (!force && Date.now() - _hbGifts.at < 60000) return;
  _hbGifts.at = Date.now();
  api('home/gifts').then(r => {
    if (!r) return;
    const before = JSON.stringify([_hbGifts.received, _hbGifts.sent]);
    _hbGifts.received = Array.isArray(r.received) ? r.received : [];
    _hbGifts.sent = Array.isArray(r.sent) ? r.sent : [];
    /* SEEN IS SAID WHEN IT IS DRAWN, once per panel, on the reader's own Home. */
    _hbGifts.received.filter(g => !g.seenAt).forEach(g => { g.seenAt = new Date().toISOString(); api('home/gifts/' + encodeURIComponent(g.id) + '/seen', 'POST', {}).catch(() => {}); });
    if (JSON.stringify([_hbGifts.received, _hbGifts.sent]) !== before && state.view === 'dashboard' && hbS().face === 'board') hbPaintBoard();
  }).catch(() => {});
}
async function hbGive(pid, to, note){
  const p = hbS().panels.find(x => x.id === pid); if (!p) return;
  if (typeof API_MODE !== 'function' || !API_MODE()){ if (typeof toast === 'function') toast(i18t('hb_give_local'), 'warn'); return; }
  try {
    const r = await api('home/gifts', 'POST', { to, kind: p.kind, split: !!p.split, lens: hbS().lens, note: String(note || '').slice(0, 500), pid });
    if (r && r.gift) _hbGifts.sent.unshift(r.gift);
    _hbGiveForm = null; hbPaintBoard();
    if (typeof toast === 'function') toast(i18t('hb_given_toast', { who: (r && r.gift && r.gift.toName) || '' }), 'ok');
  } catch (e){ if (typeof toast === 'function') toast(e.message || String(e), 'err'); }
}
async function hbUngive(id){
  try { await api('home/gifts/' + encodeURIComponent(id), 'DELETE'); } catch (e){ if (typeof toast === 'function') toast(e.message || String(e), 'err'); return; }
  _hbGifts.sent = _hbGifts.sent.filter(g => g.id !== id); hbPaintBoard();
}
async function hbDropGift(id){
  try { await api('home/gifts/' + encodeURIComponent(id) + '/dismiss', 'POST', {}); } catch (_){}
  _hbGifts.received = _hbGifts.received.filter(g => g.id !== id); hbPaintBoard();
}

/* ---------------- PRESENT, THE RED POINTER AND THE PEN ----------------
   Present fills the screen with the page (the browser's own full screen) and
   puts the Copilot panel away; Escape brings everything back. The pointer is
   a red dot with a short trail that follows the mouse so a room can follow;
   the pen draws in red over whatever is on the screen. NOTHING IS KEPT: the
   drawing is wiped when the pen is cleared or the presenting stops. */
let _hbTool = '', _hbPresenting = false, _hbInk = [], _hbStroke = null, _hbTrail = [];
function hbToolsPaint(){
  const t = document.getElementById('hb-tools'); if (!t) return;
  const b = (k, word, tip) => `<button type="button" data-hb-tool="${k}" aria-pressed="${_hbTool === k}" title="${_hbE(i18t(tip))}">${_hbE(i18t(word))}</button>`;
  t.innerHTML = `<div class="ig-seg">${b('pointer', 'hb_pointer', 'hb_pointer_tip')}${b('pen', 'hb_pen', 'hb_pen_tip')}<button type="button" data-hb-tool="clear" title="${_hbE(i18t('hb_clear_tip'))}">${_hbE(i18t('hb_clear'))}</button></div>${_hbPresenting ? `<div class="ig-seg"><button type="button" data-hb-tool="exit" title="${_hbE(i18t('hb_exit_tip'))}">${_hbE(i18t('hb_exit'))}</button></div>` : ''}`;
  const ink = document.getElementById('hb-ink'); if (ink) ink.classList.toggle('is-on', _hbTool === 'pen');
  const lz = document.getElementById('hb-laser'); if (lz) lz.hidden = _hbTool !== 'pointer';
  const pg = hbPage(); if (pg){ pg.classList.toggle('hb-presenting', _hbPresenting); pg.classList.toggle('hb-pointing', _hbTool === 'pointer'); }
  if (_hbTool !== 'pointer') hbPointerHandAt(null);
}
/* ---- THE POINTER IS THE ONLY MARK ON THE SCREEN (Young, 6 Oct 2026: "the
   mouse tracker should disappear and only have the pointer on screen. It
   should only turn into a mouse when hovering over a button") ----
   With the pointer on, the page hides the system cursor (.hb-pointing). Over
   something you can press it comes back as the hand and the red dot steps
   aside, so you can see what a click will do. HOW HaTi KNOWS A THING IS
   PRESSABLE: it asks the page's own cursor rules, not a list kept here. The
   hovered element and its ancestors are lifted out of the hiding rule
   (.hb-cur-chain), its own cursor is read, and the lift is kept only where
   that cursor is the hand (or the element is a control). Asked again only
   when the element under the mouse changes. */
let _hbCurAt = null, _hbCurHand = false;
const HB_CUR_CONTROL = 'a[href],button:not(:disabled),[role="button"],[role="tab"],select,summary,label,input,textarea';
function hbPointerHandAt(t){
  const pg = hbPage();
  if (t === _hbCurAt) return _hbCurHand;
  if (pg) pg.querySelectorAll('.hb-cur-chain').forEach(n => n.classList.remove('hb-cur-chain'));
  _hbCurAt = t; _hbCurHand = false;
  if (!t || !pg || t === pg || !pg.contains(t) || typeof getComputedStyle !== 'function') return false;
  const chain = []; for (let n = t; n && n !== pg; n = n.parentElement) chain.push(n);
  chain.forEach(n => n.classList.add('hb-cur-chain'));
  _hbCurHand = getComputedStyle(t).cursor === 'pointer' || !!(t.closest && t.closest(HB_CUR_CONTROL));
  if (!_hbCurHand) chain.forEach(n => n.classList.remove('hb-cur-chain'));
  return _hbCurHand;
}
function hbSetTool(k){ _hbTool = (_hbTool === k) ? '' : k; if (_hbTool !== 'pointer') _hbTrail = []; hbToolsPaint(); }
function hbInkSize(){
  const ink = document.getElementById('hb-ink'); if (!ink) return null;
  const r = ink.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  if (ink.width !== Math.round(r.width * dpr) || ink.height !== Math.round(r.height * dpr)){ ink.width = Math.round(r.width * dpr); ink.height = Math.round(r.height * dpr); }
  return { ink, r, dpr };
}
function hbInkDraw(){
  const z = hbInkSize(); if (!z) return;
  const ctx = z.ink.getContext('2d'); ctx.setTransform(z.dpr, 0, 0, z.dpr, 0, 0); ctx.clearRect(0, 0, z.r.width, z.r.height);
  ctx.strokeStyle = '#FF3B30'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (const st of _hbInk.concat(_hbStroke ? [_hbStroke] : [])){
    if (st.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(st[0][0], st[0][1]); for (let i = 1; i < st.length; i++) ctx.lineTo(st[i][0], st[i][1]); ctx.stroke();
  }
}
function hbInkClear(){ _hbInk = []; _hbStroke = null; hbInkDraw(); }
function hbPresent(on){
  _hbPresenting = !!on;
  const pg = hbPage();
  if (on){ _hbTool = 'pointer'; if (pg && pg.requestFullscreen) pg.requestFullscreen().catch(() => {}); }
  else { _hbTool = ''; hbInkClear(); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); }
  hbToolsPaint();
  if (typeof igSyncDockWidth === 'function') setTimeout(() => { try { if (typeof igFitSplit === 'function') igFitSplit(); } catch (_){} }, 60);
}

/* ---------------- WHERE YOU WERE ----------------
   The place store's pair for Home (PLACE_PARTS.dashboard): the side of the
   screen and the dig-in come back on a refresh — the board itself is already
   this person's own record — and on the map, the map's own recipe. */
function hbPlace(){
  const s = hbS(); const p = { face: s.face, path: (s.path || []).slice() };
  if (s.face === 'explorer' && typeof igRecipeNow === 'function'){ try { p.recipe = igRecipeNow(); p.cam = intel.cam ? { ...intel.cam, w: intel.cam.w.slice() } : null; } catch (_){} }
  return p;
}
function hbPlacePut(p){
  if (!p) return;
  const s = hbS();
  if (HB_FACES.includes(p.face)) s.face = p.face;
  if (Array.isArray(p.path)) s.path = p.path.filter(k => typeof k === 'string').slice(-HB_PATH_MAX);
  hbSave();
  if (p.recipe && typeof igRecipeSet === 'function'){ try { igRecipeSet(p.recipe); } catch (_){} }
  if (p.cam && Array.isArray(p.cam.w) && window.intel && typeof IGB_NV !== 'undefined' && p.cam.w.length === IGB_NV) intel.cam = { ...p.cam, w: p.cam.w.slice() };
}

/* ---------------- ONE LISTENER, armed once at load ----------------
   Every press on the board is delegated here, so a repaint never strands a
   listener and the board's inside can be replaced freely. Only Home's own
   attributes are read, and only while Home is the page. */
function hbOnClick(e){
  if (!window.state || state.view !== 'dashboard') return;
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  /* an open dropdown closes on a press anywhere else */
  if (_hbRcOpen && !t.closest('.hb-rwrap')){ _hbRcOpen = null; hbPaintBoard(); }
  if (_hbRdOpen && !t.closest('.hb-rd-wrap')){ _hbRdOpen = null; hbDockRepaint(); }
  if (_hbMoreMenu && !t.closest('.hb-more-w')){ _hbMoreMenu = null; hbPaintBoard(); }
  const on = sel => t.closest(sel);
  let el;
  if ((el = on('[data-hb-face]'))){ hbSetFace(el.getAttribute('data-hb-face')); return; }
  if ((el = on('[data-hb-screen]'))){ const m = el.getAttribute('data-hb-screen'); if (HB_SCREENS.includes(m)){ hbS().screen = m; hbSave(); hbApplyScreen(); hbPaintHead(); if (typeof igRender === 'function') try { igRender(); } catch (_){} } return; }
  if ((el = on('[data-hb-lens]'))){ hbSetLens(el.getAttribute('data-hb-lens')); return; }
  if (on('#hb-present')){ hbPresent(!_hbPresenting); return; }
  if ((el = on('[data-hb-tool]'))){ const k = el.getAttribute('data-hb-tool');
    if (k === 'clear') hbInkClear(); else if (k === 'exit') hbPresent(false); else hbSetTool(k); return; }
  if ((el = on('[data-hb-jump]'))){ const sec = document.getElementById(el.getAttribute('data-hb-jump'));
    if (sec){ try { sec.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (_){} sec.classList.add('is-lit'); setTimeout(() => sec.classList.remove('is-lit'), 1400); } return; }
  if ((el = on('[data-hb-crumb]'))){ const i = Number(el.getAttribute('data-hb-crumb')); hbCrumb(i); hbPaintBoard({ jump: i < 0 ? null : 'focus' }); return; }
  /* THE ROW EDITS ITS OWN CARD: the open dig-in's, or a panel's */
  const rkey = x => { const row = x.closest('[data-hb-rkey]'); return row ? row.getAttribute('data-hb-rkey') : (hbS().path || []).slice(-1)[0]; };
  if ((el = on('[data-hb-pv]'))){ const box = el.closest('[data-hb-pv-id]'); if (!box) return; const id = box.getAttribute('data-hb-pv-id');
    const chosen = [...box.querySelectorAll('[data-hb-pv-item]')].filter(x => x.checked).map(x => Number(x.getAttribute('data-hb-pv-item')));
    const out = hbPreviewPress(id, el.getAttribute('data-hb-pv'), chosen);
    if (!out){ if (typeof toast === 'function') toast(i18t('hb_pv_none_chosen'), 'warn'); return; }
    hbPreviewSettle(id, out.html, out.undo); return; }
  if ((el = on('[data-hb-undo]'))){ const ok = hbUndo(el.getAttribute('data-hb-undo')); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t(ok ? 'hb_undo_done' : 'hb_undo_gone'), ok ? 'ok' : 'warn'); return; }
  /* RIGHT OR WRONG (Part 6): once */
  if ((el = on('[data-hb-fb]'))){ if (el.disabled) return; const [i, k] = String(el.getAttribute('data-hb-fb')).split(':'); if (hbMarkPress(Number(i), k)) hbMarksRepaint(Number(i)); return; }
  /* A NEXT QUESTION (Part 5): asked as if typed, through the panel */
  if ((el = on('[data-hb-next]'))){ const q = el.getAttribute('data-hb-next'); if (q && typeof intelAsk === 'function') intelAsk(q); return; }
  /* THE READING'S CHIPS, in the panel's reply (Part 4) */
  if ((el = on('[data-hb-rd]'))){ const row = el.closest('[data-hb-rd-key]'); if (!row) return; hbRdToggle(row.getAttribute('data-hb-rd-key'), el.getAttribute('data-hb-rd')); hbDockRepaint(); return; }
  if ((el = on('[data-hb-rdset]'))){ if (el.disabled) return; const row = el.closest('[data-hb-rd-key]'); const v = el.getAttribute('data-hb-rdset'), i = v.indexOf(':');
    _hbRdOpen = null; if (row && i > 0) hbReadingSet(row.getAttribute('data-hb-rd-key'), v.slice(0, i), v.slice(i + 1)); hbPaintBoard({ jump: 'focus' }); hbDockRepaint(); return; }
  if ((el = on('[data-hb-rmore]'))){ hbRcMoreToggle(rkey(el)); _hbRcOpen = null; hbPaintBoard(); return; }
  if ((el = on('[data-hb-rc]'))){ const p = rkey(el) + '|' + el.getAttribute('data-hb-rc'); _hbRcOpen = _hbRcOpen === p ? null : p; hbPaintBoard(); return; }
  if ((el = on('[data-hb-rset]'))){ if (el.disabled) return; const key = rkey(el), v = el.getAttribute('data-hb-rset'), i = v.indexOf(':');
    _hbRcOpen = null; if (key && i > 0) hbRecipeSet(key, v.slice(0, i), v.slice(i + 1)); hbPaintBoard(); return; }
  if ((el = on('[data-hb-rtrend]'))){ if (el.disabled) return; const s = hbS(), key = rkey(el);
    if (key){ const D = hbDigData(key, s.lens); if (D) hbRecipeSet(key, 'trend', !hbPlan(D).trend); } _hbRcOpen = null; hbPaintBoard(); return; }
  if (on('[data-hb-rinstead]')){ const s = hbS(), key = (s.path || []).slice(-1)[0];
    if (key){ hbRecipeSet(key, 'measure', 'count'); hbRecipeSet(key, 'split', 'd:m:signed'); hbRecipeSet(key, 'trend', true); } hbPaintBoard(); return; }
  if (on('[data-hb-digbig]')){ const s = hbS(); s.digBig = !s.digBig; hbSave(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-prep]'))){ const v = el.getAttribute('data-hb-prep'); if (HB_PREP.includes(v)){ hbS().prep = v; hbSave(); hbPaintBoard(); } return; }
  if ((el = on('[data-hb-watch-stop]'))){ const s = hbS(); s.watches.splice(Number(el.getAttribute('data-hb-watch-stop')), 1); hbSave(); hbAlertsChanged(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-watch]'))){ const k = el.getAttribute('data-hb-watch'); _hbWatchForm = _hbWatchForm === k ? null : k; hbPaintBoard(); return; }
  if (on('[data-hb-watch-cancel]')){ _hbWatchForm = null; hbPaintBoard(); return; }
  if (on('[data-hb-give-cancel]')){ _hbGiveForm = null; hbPaintBoard(); return; }
  if (on('[data-hb-ver-cancel]')){ _hbVerForm = null; hbPaintBoard(); return; }
  if ((el = on('[data-hb-ver-off]'))){ hbVerSave(el.getAttribute('data-hb-ver-off'), '', '', true); return; }
  if ((el = on('[data-hb-ungive]'))){ hbUngive(el.getAttribute('data-hb-ungive')); return; }
  if ((el = on('[data-hb-act]'))){
    const card = el.closest('[data-hb-pid]'); const pid = card && card.getAttribute('data-hb-pid'); if (!pid) return;
    const act = el.getAttribute('data-hb-act');
    if (/^gift:/.test(pid)){ if (act === 'x') hbDropGift(pid.slice(5)); return; }
    if (hbPanelAct(pid, act)) hbPaintBoard(); return; }
  if ((el = on('[data-hb-analyze]'))){ hbAnalyze(el.getAttribute('data-hb-analyze')); return; }
  if ((el = on('[data-hb-map]'))){ hbShowOnMap(el.getAttribute('data-hb-map'), el.getAttribute('data-hb-what')); return; }
  if ((el = on('[data-hb-open][data-hb-stage]')) && typeof regGoFiltered === 'function'){ regGoFiltered({ stage: el.getAttribute('data-hb-stage') }); return; }
  if ((el = on('[data-hb-open]'))){ const ids = String(el.getAttribute('data-hb-open') || '').split(',').filter(Boolean);
    if (ids.length && typeof regShowOnly === 'function') regShowOnly(ids, el.getAttribute('data-hb-what') || ''); return; }
  if (on('[data-hb-obl]')){ if (typeof obwGoFiltered === 'function') obwGoFiltered({ state: 'overdue' }); else setView('obligations'); return; }
  if ((el = on('[data-hb-room]'))){ if (typeof openWorkspace === 'function') openWorkspace(el.getAttribute('data-hb-room')); return; }
  if ((el = on('[data-hb-why]'))){ hbWhyAsk(el.getAttribute('data-hb-why')); return; }
  if ((el = on('[data-hb-deeper]'))){ if (!el.disabled) hbDigDeeper(el.getAttribute('data-hb-deeper')); return; }
  if ((el = on('[data-hb-dd-add]'))){ hbDdAddCards(el.getAttribute('data-hb-dd-add')); return; }
  if ((el = on('[data-hb-read-more]'))){ hbReadMoreToggle(el.getAttribute('data-hb-read-more')); return; }
  if ((el = on('[data-hb-why-follow]'))){ hbWhyFollow(el.getAttribute('data-hb-why-follow')); return; }
  if ((el = on('[data-hb-ins]'))){ hbInsAct(el.getAttribute('data-hb-ins'), el.getAttribute('data-hb-ins-k')); return; }
  if ((el = on('[data-hb-ai]'))){ hbAskInPanel(el.getAttribute('data-hb-ai'), el.getAttribute('data-hb-ai-id')); return; }
  if ((el = on('[data-hm-agent]'))){ e.stopPropagation(); const k = el.getAttribute('data-hm-agent');
    if (k && typeof agSetSel === 'function') agSetSel(k); setView('agents'); return; }
  if ((el = on('[data-hb-dig]'))){ if (el.disabled) return; hbDig(el.getAttribute('data-hb-dig'), !!el.closest('.hb-dig'), true); return; }
  if (on('#hero-draft')){ e.stopPropagation(); if (typeof openNewMenu === 'function') openNewMenu(on('#hero-draft')); else { const nb = document.getElementById('cmd-new'); if (nb) nb.click(); } }
}
function hbOnSubmit(e){
  if (!window.state || state.view !== 'dashboard') return;
  const f = e.target;
  if (f && f.matches && f.matches('[data-hb-watch-form]')){
    e.preventDefault();
    const k = f.getAttribute('data-hb-watch-form'), dir = f.dir.value === 'below' ? 'below' : 'above', n = Number(f.n.value);
    if (!isFinite(n)) return;
    const s = hbS(); if (s.watches.length >= HB_WATCH_MAX){ if (typeof toast === 'function') toast(i18t('hb_watch_full', { n: HB_WATCH_MAX }), 'warn'); return; }
    s.watches.push({ k, dir, n }); _hbWatchForm = null; hbSave(); hbAlertsChanged(); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t('hb_watch_said', { what: i18t('hb_f_' + k), dir: i18t('hb_watch_' + dir), n }), 'ok');
    return;
  }
  if (f && f.matches && f.matches('[data-hb-ver-form]')){
    e.preventDefault();
    hbVerSave(f.getAttribute('data-hb-ver-form'), f.elements.vtitle.value, f.elements.phrases.value);
    return;
  }
  if (f && f.matches && f.matches('[data-hb-give-form]')){
    e.preventDefault();
    hbGive(f.getAttribute('data-hb-give-form'), f.to.value, f.note.value);
  }
}
function hbOnPointer(e){
  const col = document.getElementById('hb-col'); if (!col || !state || state.view !== 'dashboard') return;
  if (_hbTool === 'pointer'){
    const r = col.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    /* Over a button the hand shows and the dot and its trail step aside. */
    const hand = hbPointerHandAt(e.target);
    const lz = document.getElementById('hb-laser'); if (lz){ lz.style.transform = `translate(${x}px,${y}px)`; lz.hidden = hand; }
    _hbTrail.unshift([x, y]); _hbTrail = _hbTrail.slice(0, 10);
    for (let i = 1; i <= 3; i++){ const q = _hbTrail[i * 3]; const d = document.getElementById('hb-laser-' + i);
      if (d){ d.hidden = !q || hand; if (q){ d.style.transform = `translate(${q[0]}px,${q[1]}px)`; d.style.opacity = String(0.5 - i * 0.14); } } }
  }
  if (_hbTool === 'pen' && _hbStroke){ const r = col.getBoundingClientRect(); _hbStroke.push([e.clientX - r.left, e.clientY - r.top]); hbInkDraw(); }
}
function hbOnPenDown(e){
  if (_hbTool !== 'pen' || !e.target || e.target.id !== 'hb-ink') return;
  const col = document.getElementById('hb-col'); if (!col) return;
  const r = col.getBoundingClientRect(); _hbStroke = [[e.clientX - r.left, e.clientY - r.top]];
  try { e.target.setPointerCapture(e.pointerId); } catch (_){}
  e.preventDefault();
}
function hbOnPenUp(){ if (!_hbStroke) return; if (_hbStroke.length > 1) _hbInk.push(_hbStroke); _hbStroke = null; hbInkDraw(); }
function hbOnKey(e){
  if (!window.state || state.view !== 'dashboard') return;
  /* Ctrl/⌘+Z on the board undoes the last board change (never inside a box being typed in) */
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'z' || e.key === 'Z') && hbS().face === 'board'){
    const t = e.target; if (t && (t.closest && t.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'))) return;
    e.preventDefault(); const ok = hbUndo(); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t(ok ? 'hb_undo_done' : 'hb_undo_none'), ok ? 'ok' : 'warn'); return;
  }
  if (e.key === 'Escape' && _hbRdOpen){ _hbRdOpen = null; hbDockRepaint(); return; }
  if (e.key === 'Escape' && _hbRcOpen){ const at = _hbRcOpen.lastIndexOf('|'), k = _hbRcOpen.slice(0, at), p = _hbRcOpen.slice(at + 1); _hbRcOpen = null; hbPaintBoard();
    const row = [...document.querySelectorAll('[data-hb-rkey]')].find(r => r.getAttribute('data-hb-rkey') === k);
    const b = row && row.querySelector(`[data-hb-rc="${p}"]`); if (b) try { b.focus({ preventScroll: true }); } catch (_){} return; }
  if (e.key === 'Enter' || e.key === ' '){
    /* an SVG piece is not a button: Enter and Space press it as one would */
    const el = e.target && e.target.closest ? e.target.closest('.hb-svg [data-hb-dig]') : null;
    if (el){ e.preventDefault(); hbDig(el.getAttribute('data-hb-dig'), !!el.closest('.hb-dig'), true); }
    return;
  }
  if (e.key !== 'Escape') return;
  if (document.querySelector('[data-top-overlay]')) return;
  const mr = document.getElementById('modal-root'); if (mr && mr.children.length) return;
  if (_hbTool){ _hbTool = ''; hbToolsPaint(); return; }
  if (_hbPresenting){ hbPresent(false); return; }
}
if (typeof document !== 'undefined' && !document._hbWired){
  document._hbWired = true;
  document.addEventListener('click', hbOnClick);
  document.addEventListener('submit', hbOnSubmit);
  document.addEventListener('pointermove', hbOnPointer, { passive: true });
  document.addEventListener('pointerdown', hbOnPenDown);
  document.addEventListener('pointerup', hbOnPenUp);
  document.addEventListener('pointercancel', hbOnPenUp);
  document.addEventListener('keydown', hbOnKey);
  /* TWO TABS, ONE BOARD: another tab's save is read here rather than
     overwritten by this tab's next save (each tab used to keep its own copy
     and write it back whole, so a panel added in one tab could vanish). */
  if (typeof window !== 'undefined') window.addEventListener('storage', e => {
    if (!e || !e.key || e.key.indexOf(HB_LS) !== 0) return;
    _hbS = null;
    try { if (window.state && state.view === 'dashboard' && hbS().face === 'board') hbPaintBoard(); } catch (_){}
  });
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && _hbPresenting) hbPresent(false); });
  if (typeof window !== 'undefined') window.addEventListener('resize', () => { if (_hbInk.length || _hbStroke) hbInkDraw(); });
}

Object.assign(window, { HB_ANALYST_WORDS, hbAnalystWords, hbNumPieces, HB_KEY_TERMS, hbKeyTermsOf, hbKeyTermOf, hbVerdictsOf, HB_DD_STEPS, HB_DD_KEEP, hbDeeperHtml, hbDdCalc, hbDdPack, hbDdRun, hbDigDeeper, hbDdAddCards, hbDdCardHtml, hbReadOfList, HB_PACKS, HB_PACK_RE, hbPackOfQ, hbPackData, hbPackCardD, hbPackHtml, hbPackSrc, HB_BOARD_KEY, hbBoardSrc, hbBoardSumHtml, HB_FACT_MAX, hbFactSheet, hbNumsOf, hbFactCheck, hbSummaryPrompt, hbCoverageOf, hbAvgMeasure, hbSignM, HB_SHOWS, HB_MONEY_MEASURES, HB_RISK_WEIGHT, hbMoneyMeasure, hbStdStateOf, hbStdBreaches, hbRiskWeightOf, hbExposureOf, HB_HEAD_SKIP, hbHeadlineOf, hbHeadlineHtml, hbReadSrcHeadHtml, hbReadMoreToggle, HB_MOVED_MAX, hbMovedOf, hbMovedSync, hbOpenFromLink, hbAskReadingOf, hbAskPreviewText, hbVerBadgeHtml, hbPhraseNorm, hbVerifiedList, hbVerifiedHit, hbVerifiedOf, hbVerifiedByLine, hbVerifiedAnswer, hbVerifiedGuide, hbMayVerify, hbVerFormHtml, hbVerSave, HB_DEAL_GROUPS, HB_DEAL_ORDER, hbDealGroupOf, hbMarksHtml, hbMarkPress, hbMarksRepaint, hbBoardReplyMeta, HB_NEXT_MAX, HB_NEXT_TOP, hbNextCandidates, hbNextQuestions, hbNextHtml, hbFollowUpRead, HB_RD_PARTS, HB_FIX_WINDOW_MS, hbRdWords, hbReadingSnap, hbReadingAfter, hbReadingLive, hbReadingHtml, hbReadingSet, hbRdToggle, hbDockRepaint, HB_WORD_SPLIT, HB_WORD_MEASURE, HB_WORD_STAGE, HB_WORD_KINDS, hbWords, hbWordPhrase, hbWordsApply, hbWordClash, hbWordsBuiltIn, hbWordsGuide, hbNameAsked, HB_NAME_ASK_RE, hbAnswerCount, hbAnswerSay, hbFoundTitle, hbFoundSay, hbProseChecked, hbCopilotTail, hbFeedbackSend, HB_LS, HB_FACES, HB_LENSES, HB_SCREENS, HB_PREP, HB_FIGS, HB_FIG_KEYS, HB_KINDS, HB_KIND_KEYS,
  HB_PANELS_MAX, HB_PATH_MAX, HB_ROWS_MAX, HB_WATCH_MAX, hbS, hbSave, hbFresh, hbFace, hbSideOf, hbInLens, hbBook,
  hbBookData, hbFigNumber, hbSeenNow, hbSeenTick, hbMoved, hbAgentsData, hbPanelData, hbDigData, hbCardData,
  HB_RX, hbFindContract, hbParse, hbListOf, hbRef, hbDayWords, hbHeadHtml, hbBookHtml, hbPrepHtml, hbDeltaHtml, hbRowHtml, hbListHtml,
  hbOblRowsHtml, hbDigBodyHtml, hbFocusHtml, hbCrumbOf, hbCardHtml, hbBarsHtml, hbPanelBodyHtml, hbPanelHtml,
  hbBoardHtml, hbWatchFormHtml, hbWatchFired, hbGiveFormHtml, hbPaintBoard, hbPaintHead, hbApplyScreen,
  hbApplyFace, hbMount, hbAfterMount, hbRender, hbOpenExplorer, hbSetFace, hbSetLens, hbLensOnMap, hbShowOnMap, hbDig, hbAddPanel,
  hbAsk, hbFigSay, hbPanelSay, hbSuggestions, hbPlaceholder, hbWatchAlerts, hbGiftsFor, hbGiftsLoad, hbGive,
  hbUngive, hbDropGift, hbToolsPaint, hbSetTool, hbInkClear, hbPresent, hbPlace, hbPlacePut, hbOnClick, hbOnSubmit, hbOnKey, hbHelloInner, hbFocusKey, hbShowFound, HB_KEY_SEP, HB_CHART_BARS, HB_CHART_MONTHS, HB_GROUP_FIELDS, hbNextGroup, hbGroupOf, hbGroupLabel, hbGroupWord, hbMonthOf, hbMonthLabel, hbValueBands, hbChartHtml, hbChartBarsHtml, hbChartColsHtml, hbListFootHtml,
  HB_ATTENTION_RE, HB_HUES, hbHueOf, hbStartOf, hbObOpen, hbGroupsOf, hbRingSvg, hbBlocksSvg, hbTimelineSvg, hbBubblesSvg, hbBarsFamily,
  HB_PICS, HB_MEASURES, HB_UNITS, HB_DATES, HB_SPLIT_GROUPS, HB_TREND_MIN_N, HB_TREND_MIN_PTS, HB_COLS_MAX, HB_RC, hbRecipeRead, hbPlan, hbPlanBase, hbPlanFix,
  hbDateOf, hbMeasure, hbMeasureOne, hbMeasureFmt, hbBucketOf, hbBucketLabel, hbInBucket, hbTrendOf, hbColsSvg, hbLiveSvg, hbSnapsLoad, hbSnapsSet, hbGroupBars, hbSplitWord, hbPicWord,
  hbRcOptions, hbRecipeRowHtml, hbRecipeSet, hbRecipeClean, hbFoundChart,
  hbRootKey, hbCountKey, hbCountIds, hbCounted, hbCountLabel, hbCountChipHtml, hbAskInPanel,
  HB_INS, HB_INS_SHAPES, HB_INS_MEASURED, HB_INS_V, HB_INS_MAX, HB_INS_REST_DAYS, HB_INS_NORM_PTS, HB_INS_MINE_MIN, hbInsKey, hbInsId, hbInsOf, hbInsViewWord, hbInsChart, hbInsCandidate, hbInsCandidateMemo,
  hbInsScope, hbInsNormal, hbInsRenNormal, hbInsFinding, hbInsFindingMemo, hbInsightsToday, hbInsUsual, hbInsUsualOpen, hbInsWhy, hbInsResting, hbInsBookSig,
  hbInsThumb, hbInsRowHtml, hbShelfHtml, hbPanelWord, hbAddView, hbViewPanelHtml, hbInsAct, hbKeptSync,
  hbBigBtnHtml, hbReadingOf, hbReadHtml, hbWhySig, hbWhyKept, hbWhyPrompt, hbWhyCheck, hbWhyAsk, hbWhyFollow, HB_WHY_KEEP,
  hbBoardNow, HB_BOARD_NOW_MAX, hbUsefulGroup, hbTrendFmt, HB_WHY_ASK_RE, HB_FU, hbOpenListKey, hbBoardEdit, hbFollowUp, hbBoardTakes, hbAxisTop,
  HB_PICS2, HB_SORTS, HB_DIRS, HB_COMPARES, HB_TOP_MAX, HB_TITLE_MAX, HB_SERIES_MAX, HB_HEAT_MAX, HB_WIN_MAX, HB_RC_GW, HB_RC_NUMS, HB_WIN_PRESETS, HB_SPLIT_WORDS, HB_UNIT_WORDS,
  hbCardClean, hbCardPlan, hbPlanSpec, hbCardSet, hbCardSetPart, hbSplitClean, hbWindowClean, hbVsClean, hbPeriodWord, hbCmpPrevWord, hbBucketGap, hbCmpY, hbPlainText, hbWinOf, hbWinWord, hbWindowCut, hbWinCs,
  hbGroupsCut, hbGroupsSorted, hbIsGroupDim, hbRestDig, hbKeptGroups, hbSeriesOf, hbXOf, hbCellDig, hbStackSvg, hbHeatSvg, hbCompareSvg, hbCmpChange, hbChartRun,
  hbCardEdit, hbHowWord, hbRecipeWords, hbSplitModelWord, hbOrderWord, hbReadCompareOf, hbReadTwoOf, hbReadingCore, hbRcCur, hbRcCurHas,
  hbBucketPrev, hbBucketMove, hbBucketStart, hbBucketEnd, hbWinSpanOk,
  HB_BOARD_ACTIONS, HB_ACTIONS_MAX, hbWhichOf, hbAddCard, hbPanelAct, hbCrumb, hbArrange, hbPanelName, hbActionClean, hbCardRef, hbBoardApply, hbRcMoreToggle, HB_GUIDE_TOP, HB_GUIDE_MAX, hbDataGuide,
  HB_CHK_GROUPS_MAX, HB_CHK_EMPTY_SHARE, hbCardCheck, hbActionCheck, hbActionsCheck, hbRepairNote, hbActionTitle, hbBoardTakesChecked,
  HB_UNDO_MAX, hbShapeOf, hbUndoMark, hbUndoTop, hbUndo, hbNoteUndo, hbUndoHtml, hbTakeMeta, hbPreviewHtml, hbIsBig, hbActionWords, hbBoardAnswer, hbPreviewPress, hbPreviewSettle,
  HB_CHOICES_MAX, hbAmbiguity, hbChoicePress });
