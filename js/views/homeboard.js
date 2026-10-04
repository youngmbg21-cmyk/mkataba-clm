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
    ins: null, insKept: {}, insOff: {}, keptSent: '', why: {} };
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
    if (Array.isArray(v.panels)) s.panels = v.panels.filter(p => p && (HB_KINDS[p.kind] || (p.kind === 'view' && typeof p.key === 'string' && /^q:/.test(p.key))))
      .slice(-HB_PANELS_MAX).map(p => p.kind === 'view'
        ? { id: String(p.id || ''), kind: 'view', key: p.key.slice(0, 300), title: String(p.title || '').slice(0, 120), shape: String(p.shape || '').slice(0, 20),
            recipe: (hbRecipeClean({ k: p.recipe || {} }).k) || null, split: false, big: !!p.big }
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
    s.recipe = hbRecipeClean(v.recipe);
    /* the Chart · Bars · List switch of 3 Oct is the Picture now */
    if (v.digView && typeof v.digView === 'object') Object.entries(v.digView).forEach(([k, m]) => { if (typeof k === 'string' && (m === 'list' || m === 'bars') && !s.recipe[k]) s.recipe[k] = { pic: m }; });
    s.digBig = !!v.digBig;
    /* Copilot's answers to "What could explain this?", kept per chart for the day */
    if (v.why && typeof v.why === 'object') Object.entries(v.why).slice(-12).forEach(([k, w]) => {
      if (typeof k === 'string' && w && typeof w.day === 'string' && typeof w.sig === 'string' && typeof w.text === 'string')
        s.why[k.slice(0, 300)] = { day: w.day.slice(0, 10), sig: w.sig.slice(0, 400), text: w.text.slice(0, 4000), dropped: Number(w.dropped) || 0, at: String(w.at || '').slice(0, 5), notice: String(w.notice || '').slice(0, 300) }; });
  }
  _hbS = s; _hbSUid = uid;
  return s;
}
function hbSave(){
  const s = hbS();
  try { localStorage.setItem(HB_LS + hbUid(), JSON.stringify(s)); } catch (_){}
}
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
function hbRootKey(key){ let k = String(key || ''); while (/^(qg|qm|qv):/.test(k)) k = k.replace(/^(qg|qm|qv):/, '').split(HB_KEY_SEP)[0]; return k; }
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
    d.live = live.length;
    d.us = live.filter(c => move(c) === 'you').length;
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
      rows.push({ id: c.id, days: w.expiresDays, expiry: w.expiry, decided: !!w.decided, inWindow: !!w.inWindow });
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
    const cs = hbListOf(P.ids, lens);
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
        chart: { pic: R.pic, split: R.split, measure: R.measure, trend: R.trend } };
    }
    const party = cq.length === 1 && cq[0].field === 'counterparty';
    const title = party ? i18t('hb_found_party', { who: labels[0] }) : labels.join(' · ');
    /* the chart the question's shape asks for: an attention question → the
       bubbles; a money question → the blocks; a date question → the timeline;
       else the ring over the groups the question did not already fix */
    const fields = cq.map(x => x.field);
    const chart = fields.some(f => HB_ATTENTION_RE.test(f)) ? { mode: 'attention' } : fields.some(f => /^value/.test(f)) ? { mode: 'values' } : fields.some(f => /Window$|^expired$/.test(f)) ? { mode: 'months' } : { mode: 'groups', by: hbNextGroup(fields) };
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
  map:       /\b(the map|map|explorer|brain|kartan|karta|utforskaren|hjärnan)\b/i,
  board:     /\b(the board|board|dashboard|back to the numbers|tavlan|översikten|tillbaka till siffrorna)\b/i,
  present:   /\b(present|presentation|full ?screen|meeting mode|presentera|helskärm|mötesläge)\b/i,
  save:      /(?:save|keep) (?:this|the|my) board as (.+)|spara (?:den här tavlan|tavlan) som (.+)/i,
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
  return '';
}
function hbGroupLabel(field, g){
  if (!g) return field === 'counterparty' ? i18t('hb_no_counterparty') : field === 'owner' ? i18t('hb_nobody_owns') : '—';
  if (field === 'status') return (typeof statusLabel === 'function') ? statusLabel(g) : g;
  if (field === 'side') return i18t(g === 'supplier' ? 'hb_lens_suppliers' : 'hb_lens_customers');
  return g;
}
function hbGroupWord(field){ return i18t({ status: 'hb_by_stage', folder: 'hb_by_stream', counterparty: 'hb_by_party', kind: 'hb_by_kind', side: 'hb_by_side' }[field] || 'hb_by_stage'); }
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
  else rows.sort((a, b) => (money ? b.v - a.v : b.n - a.n) || a.label.localeCompare(b.label));
  return rows;
}
function _hbSvgDoor(dig, title){ return `${dig ? `data-hb-dig="${_hbE(dig)}" tabindex="0" role="button"` : ''}><title>${_hbE(title)}</title`; }
function hbRingSvg(D, cs, field, money){
  const sayOf = (n, v) => money ? _hbM(v) + ' · ' + _hbN(n) : _hbN(n);
  let rows = hbGroupsOf(cs, field, money);
  if (rows.length > HB_RING_MAX){ const rest = rows.slice(HB_RING_MAX - 1); rows = rows.slice(0, HB_RING_MAX - 1).concat([{ g: null, label: i18t('hb_chart_more_groups', { n: _hbN(rest.length) }), list: rest.flatMap(r => r.list), n: rest.reduce((a, r) => a + r.n, 0), v: rest.reduce((a, r) => a + r.v, 0), rest: true }]); }
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
    const dig = g.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + g.g;
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
function hbBlocksSvg(D, cs, field, money){
  let groups = hbGroupsOf(cs.filter(c => hbValueOfOne(c) > 0), field, true);
  const unvalued = cs.length - groups.reduce((a, g) => a + g.n, 0);
  if (!groups.length) return hbRingSvg(D, cs, field, money);
  if (groups.length > HB_BLOCK_GROUPS){ const rest = groups.slice(HB_BLOCK_GROUPS - 1); groups = groups.slice(0, HB_BLOCK_GROUPS - 1).concat([{ g: null, label: i18t('hb_chart_more_groups', { n: _hbN(rest.length) }), list: rest.flatMap(r => r.list), n: rest.reduce((a, r) => a + r.n, 0), v: rest.reduce((a, r) => a + r.v, 0), rest: true }]); }
  const whole = groups.reduce((a, g) => a + g.v, 0) || 1, vmax = Math.max(1, ...cs.map(hbValueOfOne));
  const W = 1000, H = 330; let x = 0, out = '';
  groups.forEach((g, gi) => {
    const w = W * g.v / whole; const hue = g.rest ? '#9FB3C8' : hbHueOf(field, g.g, gi);
    const title = g.label + ': ' + _hbM(g.v) + ' · ' + _hbN(g.n) + ' · ' + Math.round(g.v / whole * 100) + '%';
    const dig = g.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + g.g;
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
const HB_PICS = ['cols', 'gantt', 'ring', 'bars', 'blocks', 'bubbles', 'list'];
const HB_MEASURES = ['count', 'value', 'daysToSign', 'payDays', 'rounds', 'live'];
const HB_UNITS = ['m', 'q', 'y'];
const HB_DATES = ['end', 'signed', 'start', 'created', 'decision'];
const HB_SPLIT_GROUPS = ['status', 'folder', 'counterparty', 'owner', 'kind', 'side', 'valueBand'];
const HB_TREND_MIN_N = 3, HB_TREND_MIN_PTS = 6, HB_COLS_MAX = 24;
const _HB_BY = '(?:by|per|across|for each|grouped by|split by|broken down by|efter|uppdelat på)\\s+(?:the\\s+|their\\s+)?';
const HB_RC = {
  unit: [['m', /\b(?:(?:by|per|each|every|a|for each|i) (?:month|månad)|monthly|month by month|month on month|månadsvis|varje månad)\b/],
         ['q', /\b(?:(?:by|per|each|every|a|for each|i) (?:quarter|kvartal)|quarterly|quarter by quarter|quarter on quarter|kvartalsvis|varje kvartal)\b/],
         ['y', /\b(?:(?:by|per|each|every|for each) (?:year|år)|yearly|annually|year by year|year on year|årsvis|varje år)\b/]],
  gantt: /\b(?:timeline|time line|gantt|tidslinje)\b/,
  pic: [['ring', /\b(?:as an? |in an? )?(?:pie(?: chart)?|donut|doughnut|ring(?: chart)?|tårtdiagram|cirkeldiagram|tårta)\b/],
        ['bubbles', /\b(?:as |in )?(?:a )?(?:bubbles?(?: chart)?|scatter(?: plot)?|bubbeldiagram|bubblor)\b/],
        ['blocks', /\b(?:as |in )?(?:a )?(?:blocks|treemap|tree map)\b/],
        ['list', /\b(?:as a list|as list|in a list|as a table|in a table|som (?:en )?lista|som tabell)\b/],
        ['bars', /\b(?:as |in )?(?:a )?(?:bars?(?: chart| graph)?|column chart|columns|histogram|stapl\w*)\b/]],
  chart: /\b(?:chart|graph|plot|diagram|visuali[sz]e|draw)\b/,
  split: [['status', new RegExp('\\b' + _HB_BY + '(?:stages?|status(?:es)?|lifecycle|phases?|skede|steg)\\b')],
          ['folder', new RegExp('\\b' + _HB_BY + '(?:value streams?|streams?|departments?|business units?|categor(?:y|ies)|värdeström(?:mar)?|avdelning(?:ar)?)\\b')],
          ['counterparty', new RegExp('\\b' + _HB_BY + '(?:counterpart(?:y|ies)|customers?|clients?|suppliers?|vendors?|compan(?:y|ies)|part(?:y|ies)|partners?|motpart(?:er)?|kund(?:er)?|leverantör(?:er)?)\\b')],
          ['owner', new RegExp('\\b' + _HB_BY + '(?:owners?|who owns (?:them|it)|ägare|ansvarig)\\b')],
          ['kind', new RegExp('\\b' + _HB_BY + '(?:contract types?|types?|kinds?|avtalstyp(?:er)?|typ(?:er)?)\\b')],
          /* "suppliers vs customers" stays the side-by-side panels' question */
          ['side', new RegExp('\\b' + _HB_BY + '(?:side|sida)\\b')],
          ['valueBand', new RegExp('\\b' + _HB_BY + '(?:value bands?|values?|sizes?|amounts?|värde|storlek)\\b')]],
  date: [['signed', /\b(?:signed|signing|signature|signatures|executed|signerade?|undertecknade?|signering)\b/],
         ['start', /\b(?:start(?:s|ed|ing)?|effective|began|begin|startar|startade|startdatum)\b/],
         ['created', /\b(?:created|raised|drafted|opened|new (?:contracts|agreements)|skapade?|nya avtal)\b/],
         ['decision', /\b(?:renew\w*|decision|decisions|decide|förny\w*|beslut)\b/],
         ['end', /\b(?:end(?:s|ed|ing)?|expir\w*|löper ut|slutar|slutdatum|upphör\w*|går ut)\b/]],
  when: /\bwhen (?:do|does|will|did)\b|\bnär (?:löper|går|slutar|förnyas)\b/,
  m: {
    daysToSign: /\b(?:time to sign|days to sign|how (?:long|quickly|fast) (?:does it take |it takes |do they take |do we take |we take )?to (?:sign|get (?:them |it )?signed)|signing time|time to signature|cycle time|turnaround(?: time)?|tid till signering|signeringstid)\b/,
    payDays: /\b(?:payment terms?|days to pay|payment days|betalningsvillkor|betalningstid)\b/,
    rounds: /\b(?:negotiation rounds|rounds of negotiation|rounds|förhandlingsrundor|rundor)\b/,
    value: /\b(?:value|worth|money|how much|amount|spend|värde|belopp|hur mycket)\b/,
    live: /\b(?:how many (?:live |active )?(?:contracts|agreements) (?:did we have|we had|were live)|(?:live|active|levande|aktiva) (?:contracts|agreements|avtal))\b/,
  },
  trend: /\b(?:trend\w*|over time|over the (?:last|past)|getting (?:faster|slower|longer|shorter|better|worse|bigger|smaller)|faster|slower|grow(?:s|ing)?|shrink\w*|increas\w*|decreas\w*|rising|falling|going (?:up|down)|month on month|year on year|quarter on quarter|compared (?:to|with) last|utveckling|ökar|minskar|snabbare|långsammare)\b/,
  /* words a chart question may carry that name nothing to count */
  filler: /\b(?:when|do|does|did|will|by|per|each|every|over|time|as|an?|on|in|at|into|getting|draw|make|create|build|plot|me|it|they|we|our|take|takes|took|is|are|was|were|been|be|end|ends|ended|ending|expir\w*|start|starts|starting|started|signed|signing|created|raised|renewal|renewals|renew|renewing|decision|decisions|date|dates|new|month|months|quarter|quarters|year|years|chart|graph|than|then|so|far|has|have|had|live|active|faster|slower|more|fewer|less|längre|när|per|varje|som|av|på|i)\b/g,
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
  let unit = null;
  for (const [u, re] of HB_RC.unit){ const m = take(re); if (m){ unit = u; unitAt = full.indexOf(m[0].trim()); break; } }
  let group = null;
  if (!unit) for (const [g, re] of HB_RC.split){ if (take(re)){ group = g; break; } }
  const gantt = !!take(HB_RC.gantt);
  let pic = null;
  for (const [p, re] of HB_RC.pic){ if (take(re)){ pic = p; break; } }
  const chartWord = !!take(HB_RC.chart);
  let measure = null;
  for (const k of ['daysToSign', 'rounds', 'payDays']){ if (take(HB_RC.m[k])){ measure = k; break; } }
  const trend = !!take(HB_RC.trend);
  const when = HB_RC.when.test(full);
  const live = (unit || trend) && !group && !measure && HB_RC.m.live.test(full);
  if (live){ take(HB_RC.m.live); measure = 'live'; }
  if (!measure && HB_RC.m.value.test(t) && (unit || group || pic || chartWord || trend || gantt)) measure = 'value';
  const isChart = unit || group || gantt || pic || chartWord || trend || when || live || measure === 'daysToSign' || measure === 'rounds';
  if (!isChart) return null;
  /* the time split: asked for, or implied by a trend, a "when" or a measure that lives in time */
  let split = null;
  const timeAsked = unit || trend || when || live || (measure === 'daysToSign' && !group);
  if (timeAsked && !group){
    const lean = (measure === 'daysToSign' || measure === 'rounds' || measure === 'payDays' || (trend && !when)) ? 'signed' : 'end';
    split = { by: 'date', unit: unit || 'm', date: measure === 'daysToSign' ? 'signed' : hbRcDateOf(full.trim(), unitAt, lean) };
  } else if (group) split = { by: group };
  if (gantt && !unit) pic = 'gantt';
  else if (split && split.by === 'date' && (!pic || pic === 'bars')) pic = 'cols';
  const R = { split, pic, measure: measure || 'count', trend: trend || (measure === 'daysToSign' && !unit && !group), condText: t.trim() };
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
function hbPlanBase(D){
  const c = D.chart || {}; const fixed = D.fixed || [];
  if (c.pic || c.split || c.measure){
    const P = { pic: c.pic || null, split: c.split || null, measure: c.measure || 'count', trend: !!c.trend };
    if (!P.pic) P.pic = P.split && P.split.by === 'date' ? 'cols' : P.measure === 'value' ? 'blocks' : P.measure === 'count' ? 'ring' : 'bars';
    if (!P.split && ['ring', 'blocks', 'bars'].includes(P.pic)) P.split = { by: hbNextGroup(fixed) };
    return P;
  }
  if (c.mode === 'values') return { pic: 'blocks', split: { by: c.by || hbNextGroup(fixed) }, measure: 'value', trend: false };
  if (c.mode === 'months') return { pic: 'gantt', split: null, measure: 'count', trend: false };
  if (c.mode === 'attention') return { pic: 'bubbles', split: null, measure: 'count', trend: false };
  return { pic: 'ring', split: { by: c.by || hbNextGroup(fixed) }, measure: 'count', trend: false };
}
function hbPlanFix(P, D){
  const money = hbMoneyOk(); const fixed = (D && D.fixed) || [];
  const isDate = P.split && P.split.by === 'date';
  if (!money && P.measure === 'value') P.measure = 'count';
  if (!money && (P.pic === 'blocks' || P.pic === 'bubbles')) P.pic = isDate ? 'cols' : 'ring';
  if (P.pic === 'cols' && !isDate) P.split = { by: 'date', unit: 'm', date: 'end' };
  if (['ring', 'blocks'].includes(P.pic) && (isDate || !P.split)) P.split = { by: hbNextGroup(fixed) };
  if (['ring', 'blocks'].includes(P.pic) && P.split && P.split.by === 'valueBand') P.pic = 'bars';
  if (P.pic === 'bars' && !P.split) P.split = { by: hbNextGroup(fixed) };
  if (P.pic === 'bars' && P.split.by === 'date') P.pic = 'cols';
  if (P.measure === 'live' && P.pic !== 'cols'){ P.pic = 'cols'; P.split = { by: 'date', unit: 'm', date: 'end' }; }
  if (P.pic !== 'cols') P.trend = false;
  return P;
}
function hbPlan(D){
  const o = (hbS().recipe || {})[D.key] || {};
  const P = Object.assign(hbPlanBase(D), {});
  if (o.pic) P.pic = o.pic;
  if (o.split) P.split = o.split.by === 'none' ? null : o.split;
  if (o.measure) P.measure = o.measure;
  if (typeof o.trend === 'boolean') P.trend = o.trend;
  return hbPlanFix(P, D);
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
  if (m === 'daysToSign'){ const s = hbDateOf(c, 'signed'), r = hbDateOf(c, 'created'); if (!s || !r) return null; const d = Math.round((Date.parse(s) - Date.parse(r)) / 864e5); return d >= 0 ? d : null; }
  if (m === 'payDays'){ try { const d = (typeof payDays === 'function') ? payDays(c) : null; return d == null ? null : Number(d); } catch (_){ return null; } }
  if (m === 'rounds'){ const r = c.negotiation && Array.isArray(c.negotiation.rounds) ? c.negotiation.rounds.length : 0; return r || null; }
  return 1;
}
function hbMeasure(list, m){
  if (m === 'count' || m === 'live') return { y: list.length, n: list.length, left: 0 };
  if (m === 'value') return { y: list.reduce((a, c) => a + hbValueOfOne(c), 0), n: list.length, left: 0 };
  const ok = list.map(c => hbMeasureOne(c, m)).filter(v => v != null && isFinite(v));
  return { y: ok.length ? ok.reduce((a, b) => a + b, 0) / ok.length : null, n: ok.length, left: list.length - ok.length };
}
const hbAvgMeasure = m => m === 'daysToSign' || m === 'payDays' || m === 'rounds';
function hbMeasureFmt(m, y){
  if (y == null || !isFinite(y)) return '—';
  if (m === 'value') return _hbM(y);
  if (m === 'daysToSign' || m === 'payDays') return i18tn('hb_days_n', Math.round(y), { n: _hbN(Math.round(y)) });
  if (m === 'rounds') return (Math.round(y * 10) / 10).toLocaleString((typeof jxLocale === 'function') ? jxLocale() : undefined);
  return _hbN(Math.round(y));
}
function hbMeasureShort(m, y){
  if (y == null || !isFinite(y)) return '';
  if (m === 'value') return _hbM(y);
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
  if (m === 'daysToSign') return i18t(pct < 0 ? 'hb_tr_faster' : 'hb_tr_slower');
  return i18t(pct > 0 ? 'hb_tr_up' : 'hb_tr_down');
}
/* ---- MONTH COLUMNS: one column per month (quarter, year) on the date asked ---- */
function hbColsSvg(D, cs, P){
  const unit = P.split.unit || 'm', date = P.split.date || 'end', m = P.measure;
  if (m === 'live') return hbLiveSvg(D, P);
  const today = hbToday(), nowB = hbBucketOf(today, unit);
  /* a chart on the signing date (or of time to sign) is a chart of what was
     signed: a contract not signed yet is not "no date", it is said apart */
  const unsigned = (date === 'signed' || m === 'daysToSign') ? cs.filter(c => !hbDateOf(c, 'signed')) : [];
  if (unsigned.length) cs = cs.filter(c => hbDateOf(c, 'signed'));
  const keyed = cs.map(c => ({ c, b: hbBucketOf(hbDateOf(c, date), unit) }));
  const dated = keyed.filter(x => x.b !== 'none').map(x => x.b).sort();
  const forward = date === 'end' || date === 'decision' || date === 'start';
  let span = [];
  if (dated.length){
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
  const T = P.trend ? hbTrendOf(pts) : null;
  /* geometry */
  const W = 1000, H = 320, L = 64, R = 18, Tp = 30, B = 52, base = H - B;
  const extra = none.length ? 1.6 : 0, n = cols.length, step = (W - L - R) / Math.max(1, n + extra), cw = Math.min(28, step * 0.52);
  const band = Array.isArray(P.band) && P.band.length === 2 ? P.band : null;
  const ys = cols.map(c => c.M.y || 0).concat(none.length ? [hbMeasure(none, m).y || 0] : []).concat(T ? [T.y0, T.y1] : []).concat(band || []);
  const top = hbNiceMax(Math.max(...ys, 0) * 1.12);
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top), X = i => L + step * (i + 0.5);
  const fmtAxis = v => m === 'value' ? _hbM(v) : avg ? _hbN(Math.round(v)) : _hbN(Math.round(v));
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
      <text x="${X(T.i0).toFixed(1)}" y="${(Y(T.y0) - 14).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" class="hb-sv-glow">${_hbE(hbMeasureFmt(m, T.y0))}</text>
      <text x="${X(T.i1).toFixed(1)}" y="${(Y(T.y1) - 14).toFixed(1)}" text-anchor="middle" font-size="13" font-weight="700" class="hb-sv-glow">${_hbE(hbMeasureFmt(m, T.y1))}</text>`;
    const span = T.i1 - T.i0 + 1;
    say = i18t('hb_tr_say', { what: i18t('hb_ms_' + m), from: hbMeasureFmt(m, T.y0), to: hbMeasureFmt(m, T.y1), n: _hbN(span), units: i18tn('hb_tr_units_' + unit, span, { n: span }), dir: hbTrendDir(m, T) });
    const notes = [];
    if (cols.some(c => c.hollow)) notes.push(i18t('hb_tr_hollow', { min: HB_TREND_MIN_N }));
    if (cols.some(c => c.sofar)) notes.push(i18t('hb_tr_sofar', { unit: i18tn('hb_tr_units_' + unit, 1, { n: 1 }) }));
    note = notes.join(' ');
  } else if (P.trend){
    note = i18t('hb_tr_few', { need: HB_TREND_MIN_PTS, units: i18tn('hb_tr_units_' + unit, HB_TREND_MIN_PTS, { n: HB_TREND_MIN_PTS }), min: HB_TREND_MIN_N, n: _hbN(pts.length) });
  }
  const leftN = avg ? cs.length - cols.reduce((a, c) => a + c.M.n, 0) - (none.length ? hbMeasure(none, m).n : 0) : 0;
  if (leftN > 0) note = [note, i18t('hb_ms_left', { n: _hbN(leftN), what: i18t('hb_ms_' + m).toLowerCase() })].filter(Boolean).join(' ');
  if (unsigned.length) note = [note, i18tn('hb_cols_unsigned', unsigned.length, { n: _hbN(unsigned.length) })].filter(Boolean).join(' ');
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
    unsigned: unsigned.length, date, m, left: leftN };
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
  const top = hbNiceMax(Math.max(...snaps.map(x => Number(x.live) || 0), 1) * 1.15);
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
    say = i18t('hb_tr_say', { what: i18t('hb_ms_live'), from: _hbN(Math.round(T.y0)), to: _hbN(Math.round(T.y1)), n: _hbN(T.i1 - T.i0 + 1), units: i18tn('hb_tr_units_m', T.i1 - T.i0 + 1, { n: T.i1 - T.i0 + 1 }), dir: hbTrendDir('live', T) }); }
  else { let when = snaps[0].month; for (let i = 1; i < HB_TREND_MIN_PTS; i++) when = hbBucketNext(when, 'm');
    const x5 = X(HB_TREND_MIN_PTS - 1);
    g += `<line x1="${x5.toFixed(1)}" x2="${x5.toFixed(1)}" y1="${Tp}" y2="${base}" class="hb-sv-grid" stroke-dasharray="3 4"/><text x="${(x5 - 6).toFixed(1)}" y="${Tp + 12}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(i18t('hb_snap_starts'))}</text>`;
    note = i18t('hb_snap_few', { first: hbBucketLabel(snaps[0].month, 'm', false), need: HB_TREND_MIN_PTS, when: hbBucketLabel(when, 'm', false) }); }
  return { body: `<svg class="hb-svg hb-cols" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>${T ? '' : `<div class="hb-snap-instead">${instead}</div>`}`, by, note, say,
    lead: `<b>${_hbN(snaps[snaps.length - 1].live)}</b> ${_hbE(i18t('hb_snap_lead', { month: hbBucketLabel(snaps[snaps.length - 1].month, 'm', false) }))}` };
}
function hbNiceMax(v){ if (!(v > 0)) return 1; const p = Math.pow(10, Math.floor(Math.log10(v))); for (const k of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (k * p >= v) return k * p; return 10 * p; }
/* ---- BARS for a split by a group, on any measure ---- */
function hbGroupBars(D, cs, P){
  const field = P.split.by, m = P.measure;
  if (field === 'valueBand') return hbBarsFamily(D, cs, 'values', 'status', hbMoneyOk());
  let rows = hbGroupsOf(cs, field, m === 'value').map(r => { const M = hbMeasure(r.list, m);
    return { g: r.g, label: r.label, n: r.n, v: M.y || 0, say: hbMeasureFmt(m, M.y) + (m === 'count' ? '' : ' · ' + _hbN(r.n)), dig: 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + r.g,
      color: field === 'status' && typeof hmStageTone === 'function' ? hmStageTone(r.g) : '' }; });
  if (field !== 'status') rows.sort((a, b) => (b.v - a.v) || a.label.localeCompare(b.label));
  let note = '';
  if (rows.length > HB_CHART_BARS){ note = i18t('hb_chart_more_groups', { n: _hbN(rows.length - HB_CHART_BARS) }); rows = rows.slice(0, HB_CHART_BARS); }
  return { body: hbChartBarsHtml(rows, true), by: hbSplitWord(P.split) + (m !== 'count' ? ' · ' + i18t('hb_ms_' + m).toLowerCase() : ''), note };
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
function hbRcOptions(part, P, D){
  const money = hbMoneyOk(), isDate = P.split && P.split.by === 'date';
  const opt = (v, word, on, why) => ({ v, word, on, why: why || '' });
  if (part === 'which') return [opt('set', i18t('hb_rc_only', { what: D.setLabel || D.crumb || '' }), true), opt('all', i18t('hb_rc_all'), true)];
  if (part === 'pic') return HB_PICS.map(p => {
    const word = p === 'cols' ? i18t('hb_pic_cols_' + ((isDate && P.split.unit) || 'm')) : i18t('hb_pic_' + p);
    if ((p === 'blocks' || p === 'bubbles') && !money) return opt(p, word, false, i18t('hb_why_money'));
    if ((p === 'ring' || p === 'blocks') && P.split && P.split.by === 'valueBand') return opt(p, word, false, i18t('hb_why_group'));
    return opt(p, word, true);
  });
  if (part === 'split'){
    const ds = [['m', 'end'], ['q', 'end'], ['y', 'end'], ['m', 'signed'], ['q', 'signed'], ['m', 'start'], ['m', 'created'], ['m', 'decision']]
      .map(([u, d]) => opt('d:' + u + ':' + d, i18t('hb_sp_' + u) + ' · ' + i18t('hb_dt_' + d), true));
    const gs = HB_SPLIT_GROUPS.map(gk => opt('g:' + gk, hbSplitWord({ by: gk }), !(gk === 'valueBand' && !money), gk === 'valueBand' && !money ? i18t('hb_why_money') : ''));
    return ds.concat(gs).concat([opt('none', i18t('hb_sp_none'), true)]);
  }
  if (part === 'measure'){
    const own = !['cols', 'bars'].includes(P.pic);
    return HB_MEASURES.map(k => {
      if (own && k !== 'count') return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_own_measure'));
      if (k === 'value' && !money) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_money'));
      if (k === 'live' && !isDate) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_date'));
      return opt(k, i18t('hb_ms_' + k), true);
    });
  }
  return [];
}
function hbRcCur(part, P){
  if (part === 'pic') return P.pic; if (part === 'measure') return P.measure;
  if (part === 'split') return !P.split ? 'none' : P.split.by === 'date' ? 'd:' + P.split.unit + ':' + P.split.date : 'g:' + P.split.by;
  return null;
}
let _hbRcOpen = null;
const _hbTick = '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m3 8.5 3.2 3L13 4.5"/></svg>';
const _hbCaret = '<svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 3.5 5 6.5 8 3.5"/></svg>';
function hbRecipeRowHtml(D, P){
  const s = hbS(); const o = (s.recipe || {})[D.key] || {};
  const canWhich = /^(q|ls):?/.test(D.key) && D.kind === 'list';
  const chip = (part, label, value) => {
    const open = _hbRcOpen === part;
    const menu = open ? `<div class="hb-rmenu" role="menu" aria-label="${_hbE(label)}">${hbRcOptions(part, P, D).map(x => {
      const cur = part === 'which' ? ((o.which || 'set') === x.v) : hbRcCur(part, P) === x.v;
      return `<button type="button" role="menuitemradio" aria-checked="${cur}" data-hb-rset="${_hbE(part + ':' + x.v)}"${x.on ? '' : ' disabled'}${x.why ? ` title="${_hbE(x.why)}"` : ''}><span>${_hbE(x.word)}</span>${x.why ? `<small>${_hbE(x.why)}</small>` : cur ? `<b aria-hidden="true">${_hbTick}</b>` : ''}</button>`; }).join('')}</div>` : '';
    return `<span class="hb-rwrap"><button type="button" class="hb-rc${open ? ' is-open' : ''}" data-hb-rc="${part}" aria-haspopup="menu" aria-expanded="${open}"><i>${_hbE(label)}</i><span>${_hbE(value)}</span>${_hbCaret}</button>${menu}</span>`;
  };
  const which = D.whole ? i18t('hb_rc_all') : (D.setLabel || D.crumb || '');
  const whichChip = canWhich ? chip('which', i18t('hb_rc_which'), which)
    : `<span class="hb-rwrap"><span class="hb-rc is-still" title="${_hbE(i18t('hb_rc_which_still'))}"><i>${_hbE(i18t('hb_rc_which'))}</i><span>${_hbE(which)}</span></span></span>`;
  const canTrend = P.pic === 'cols' && P.measure !== 'live';
  const trend = `<button type="button" class="hb-tg${P.trend ? ' is-on' : ''}" data-hb-rtrend aria-pressed="${!!P.trend}"${canTrend ? '' : ` disabled title="${_hbE(i18t('hb_why_trend'))}"`}><span class="hb-tg-sl" aria-hidden="true"></span>${_hbE(i18t('hb_rc_trend'))}</button>`;
  return `<div class="hb-recipe" role="group" aria-label="${_hbE(i18t('hb_rc_menu'))}">${whichChip}${chip('split', i18t('hb_rc_split'), hbSplitWord(P.split))}${chip('pic', i18t('hb_rc_pic'), hbPicWord(P))}${chip('measure', i18t('hb_rc_measure'), i18t('hb_ms_' + P.measure))}${trend}</div>`;
}
/* a press on a dropdown: kept per card, so the same question draws the same */
function hbRecipeSet(key, part, v){
  const s = hbS(); s.recipe = s.recipe || {}; const o = Object.assign({}, s.recipe[key] || {});
  if (part === 'which') o.which = v === 'all' ? 'all' : 'set';
  else if (part === 'pic' && HB_PICS.includes(v)) o.pic = v;
  else if (part === 'measure' && HB_MEASURES.includes(v)) o.measure = v;
  else if (part === 'split'){
    if (v === 'none') o.split = { by: 'none' };
    else if (/^d:/.test(v)){ const [, u, d] = v.split(':'); if (HB_UNITS.includes(u) && HB_DATES.includes(d)){ o.split = { by: 'date', unit: u, date: d }; if (o.pic !== 'list') o.pic = 'cols'; } }
    else if (/^g:/.test(v)){ const gk = v.slice(2); if (HB_SPLIT_GROUPS.includes(gk)){ o.split = { by: gk }; if (!o.pic || o.pic === 'cols' || o.pic === 'gantt') o.pic = gk === 'valueBand' ? 'bars' : 'ring'; } }
  }
  else if (part === 'trend') o.trend = !!v;
  delete s.recipe[key]; s.recipe[key] = o;
  const ks = Object.keys(s.recipe); if (ks.length > 30) delete s.recipe[ks[0]];
  hbSave();
}
function hbRecipeClean(v){
  const out = {};
  if (!v || typeof v !== 'object') return out;
  Object.entries(v).slice(-30).forEach(([k, o]) => { if (typeof k !== 'string' || !o || typeof o !== 'object') return; const r = {};
    if (HB_PICS.includes(o.pic)) r.pic = o.pic;
    if (HB_MEASURES.includes(o.measure)) r.measure = o.measure;
    if (typeof o.trend === 'boolean') r.trend = o.trend;
    if (o.which === 'all' || o.which === 'set') r.which = o.which;
    const sp = o.split;
    if (sp && sp.by === 'date' && HB_UNITS.includes(sp.unit) && HB_DATES.includes(sp.date)) r.split = { by: 'date', unit: sp.unit, date: sp.date };
    else if (sp && (HB_SPLIT_GROUPS.includes(sp.by) || sp.by === 'none')) r.split = { by: sp.by };
    out[k] = r; });
  return out;
}
function hbChartHtml(D, cs, big){
  const money = hbMoneyOk();
  const P = hbPlan(D);
  if (!cs.length && P.measure !== 'live') return `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
  const total = money ? cs.reduce((a, c) => a + hbValueOfOne(c), 0) : null;
  let R;
  if (P.pic === 'cols') R = hbColsSvg(D, cs, P);
  else if (P.pic === 'gantt') R = hbTimelineSvg(D, cs, money);
  else if (P.pic === 'bubbles') R = hbBubblesSvg(D, cs);
  else if (P.pic === 'blocks') R = hbBlocksSvg(D, cs, P.split.by, money);
  else if (P.pic === 'bars') R = hbGroupBars(D, cs, P);
  else R = hbRingSvg(D, cs, P.split.by, money);
  const lead = R.lead || `<b>${_hbN(cs.length)}</b> ${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}${money ? ` · <b>${_hbE(_hbM(total))}</b>` : ''}`;
  /* enlarged, the chart opens with HaTi's reading in place of the trend
     line's arithmetic (READ, THEN ASK, below) */
  const read = big ? hbReadHtml(D, cs, P, R) : '';
  return `${read || (R.say ? `<p class="hb-tr-say">${_hbE(R.say)}</p>` : '')}<div class="hb-chart-lead">${lead}<span class="hb-chart-by">${_hbE(R.by)}</span></div>${R.body}${R.note ? `<div class="hb-quiet hb-chart-note">${_hbE(R.note)}</div>` : ''}`;
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
/* THE READING: lines (HTML) and the counts it states (for the check). */
function hbReadingOf(D, cs, P, R){
  const lines = [], counts = new Set([cs.length]);
  const say = (key, parts, n) => { const l = hbReadLine(key, parts, n); if (l) lines.push(l); };
  if (!cs.length) return null;
  if (P.pic === 'cols' && R && Array.isArray(R.cols) && R.cols.length && P.measure !== 'live'){
    const unit = R.unit || 'm', m = R.m || P.measure, avg = hbAvgMeasure(m);
    const label = b => hbBucketLabel(b, unit, false);
    const units = n => i18tn('hb_tr_units_' + unit, n, { n });   /* the word alone: "months" */
    const cols = R.cols, edges = R.edges || [];
    const counted = cols.reduce((a, c) => a + c.k, 0) + edges.reduce((a, c) => a + c.k, 0);
    cols.forEach(c => counts.add(c.k)); edges.forEach(c => counts.add(c.k)); counts.add(counted);
    if (!avg){
      const money = m === 'value';
      const tot = cols.reduce((a, c) => a + (c.y || 0), 0) + edges.reduce((a, c) => a + (c.y || 0), 0);
      if ((R.date === 'signed' || m === 'daysToSign') && R.unsigned) say('hb_read_signed', { n: _hbN(counted), t: _hbN(cs.length) }, counted);
      else if (money) say('hb_read_value', { v: _hbM(tot), n: _hbN(counted) }, counted);
      else say('hb_read_counted', { n: _hbN(counted) }, counted);
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
    if (R.none){ counts.add(R.none); say('hb_read_none', { n: { html: hbReadDoor(R.none, R.noneDig) }, what: i18t('hb_dt_' + (R.date || 'end')) }, R.none); }
    if (R.unsigned){ counts.add(R.unsigned); say('hb_read_unsigned', { n: _hbN(R.unsigned) }, R.unsigned); }
    return lines.length ? { lines, counts } : null;
  }
  if ((P.pic === 'ring' || P.pic === 'bars' || P.pic === 'blocks') && P.split && P.split.by && P.split.by !== 'valueBand' && P.split.by !== 'none' && P.split.by !== 'date'){
    const field = P.split.by, money = hbMoneyOk() && (P.pic === 'blocks' || P.measure === 'value');
    const rows = hbGroupsOf(cs, field, money);
    if (!rows.length) return null;
    rows.forEach(r => counts.add(r.n));
    const tot = rows.reduce((a, r) => a + (money ? r.v : r.n), 0) || 1;
    const dig = r => 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + r.g;
    say('hb_read_groups', { n: _hbN(cs.length), k: _hbN(rows.length), by: hbSplitWord(P.split).toLowerCase() }, rows.length);
    const named = rows.filter(r => r.g);
    if (named.length){
      const top = named[0], pct = Math.round((money ? top.v : top.n) / tot * 100);
      say(money ? 'hb_read_top_value' : 'hb_read_top', { who: top.label, n: { html: hbReadDoor(top.n, dig(top)) }, v: _hbM(top.v), pct: _hbN(pct) }, top.n);
      if (named.length > 3){ const three = named.slice(0, 3), sum = three.reduce((a, r) => a + (money ? r.v : r.n), 0);
        counts.add(three.reduce((a, r) => a + r.n, 0));
        say('hb_read_top_three', { pct: _hbN(Math.round(sum / tot * 100)) }); }
    }
    const blank = rows.find(r => !r.g);
    if (blank){ counts.add(blank.n); say('hb_read_blank', { n: { html: hbReadDoor(blank.n, dig(blank)) }, what: blank.label }, blank.n); }
    return lines.length ? { lines, counts } : null;
  }
  return null;
}
/* the chart's identity for a kept answer: what it asked and what it counted */
function hbWhySig(D, P, cs){
  let h = 5381; const ids = cs.map(c => c.id).sort().join(',');
  for (let i = 0; i < ids.length; i++) h = ((h * 33) ^ ids.charCodeAt(i)) >>> 0;
  return JSON.stringify([P.pic, P.split, P.measure]) + ':' + cs.length + ':' + h.toString(36);
}
function hbWhyKept(key, sig){
  const w = (hbS().why || {})[key];
  return w && w.day === hbToday() && w.sig === sig ? w : null;
}
/* what Copilot is shown: the chart's own numbers, HaTi's reading, and the
   contracts behind it (a cap is said) */
function hbWhyPrompt(D, P, cs, R, reading){
  const title = hbCrumbOf(D.key, hbS().lens);
  const plain = h => String(h || '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const out = [`A chart on the HaTi Home board: "${title}". Picture: ${hbPicWord(P)}; split: ${hbSplitWord(P.split)}; measure: ${i18t('hb_ms_' + P.measure)}.`];
  if (R && Array.isArray(R.cols)){
    const unit = R.unit || 'm';
    out.push('Columns (label: value, contracts):');
    (R.edges || []).filter(e => /^lt:/.test(e.b)).forEach(e => out.push(`- before ${hbBucketLabel(e.b.slice(3), unit, false)}: ${e.k}`));
    R.cols.forEach(c => out.push(`- ${hbBucketLabel(c.b, unit, false)}: ${c.y == null ? '—' : Math.round(c.y * 10) / 10}, ${c.k}`));
    (R.edges || []).filter(e => /^gt:/.test(e.b)).forEach(e => out.push(`- after ${hbBucketLabel(e.b.slice(3), unit, false)}: ${e.k}`));
  }
  if (reading) out.push('What HaTi already told the reader:', ...reading.lines.map(l => '- ' + plain(l)));
  const ids = cs.slice(0, HB_WHY_IDS).map(c => (typeof contractRef === 'function') ? contractRef(c) : c.id);
  out.push(`The contracts behind it (${cs.length}${cs.length > HB_WHY_IDS ? `, the first ${HB_WHY_IDS} listed` : ''}): ${ids.join(', ')}.`);
  out.push(`Question: what could explain this pattern, and what is worth checking next? Do not repeat what HaTi already said. Answer in at most three short sentences, in ${i18t('hb_cx_lang')}. Use only counts shown above or found with your tools; name contracts by their reference.`);
  return out.join('\n');
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
  const D = hbDigData(key, hbS().lens); if (!D || D.kind !== 'list') return;
  const cs = hbListOf(D.ids, hbS().lens), P = hbPlan(D);
  const R = P.pic === 'cols' ? hbColsSvg(D, cs, P) : null;
  const reading = hbReadingOf(D, cs, P, R);
  const sig = hbWhySig(D, P, cs);
  if (_hbWhyBusy.has(key)) return;
  if (!(typeof copilotAvailable === 'function' && copilotAvailable())){ _hbWhyErr.set(key, i18t('hb_cx_nokey')); hbPaintBoard(); return; }
  _hbWhyBusy.add(key); _hbWhyErr.delete(key); hbPaintBoard();
  try {
    const res = await copilotAsk([{ role: 'user', content: hbWhyPrompt(D, P, cs, R, reading) }], { view: 'intel' }, null, { quiet: true });
    const chk = hbWhyCheck(res && res.answer, reading ? reading.counts : new Set([cs.length]));
    const s = hbS(); s.why = s.why || {};
    delete s.why[key];
    s.why[key] = { day: hbToday(), sig, text: chk.text.slice(0, 4000), dropped: chk.dropped,
      at: new Date().toTimeString().slice(0, 5), notice: res && res.notice ? String(res.notice).slice(0, 300) : '' };
    const ks = Object.keys(s.why); if (ks.length > HB_WHY_KEEP) delete s.why[ks[0]];
    hbSave();
    if (!chk.text) _hbWhyErr.set(key, i18t('hb_cx_empty'));
  } catch (e){
    _hbWhyErr.set(key, e && e.needsKey ? i18t('hb_cx_nokey') : i18t('hb_cx_failed', { why: String((e && e.message) || e || '').slice(0, 160) }));
  } finally { _hbWhyBusy.delete(key); hbPaintBoard(); }
}
/* the follow-up goes to the panel on the page: an enlarged card steps aside */
function hbWhyFollow(key){
  const s = hbS(); if (s.digBig){ s.digBig = false; hbSave(); hbPaintBoard(); }
  hbAskInPanel(i18t('hb_cx_follow_q', { what: hbCrumbOf(key, s.lens) }));
}
/* teal: HaTi's reading. amber: Copilot's answer, under it. */
function hbReadHtml(D, cs, P, R){
  const reading = hbReadingOf(D, cs, P, R);
  if (!reading) return '';
  const key = D.key, sig = hbWhySig(D, P, cs), kept = hbWhyKept(key, sig), busy = _hbWhyBusy.has(key), err = _hbWhyErr.get(key);
  const live = typeof copilotAvailable === 'function' && copilotAvailable();
  const read = `<div class="hb-read"><div class="hb-read-h"><span>${_hbE(i18t('hb_read_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_read_src'))}</span></div>
    <ul>${reading.lines.map(l => `<li>${l}</li>`).join('')}</ul></div>`;
  const ask = kept && !err ? '' : `<div class="hb-why-ask"><button type="button" class="hb-btn" data-hb-why="${_hbE(key)}"${busy ? ' disabled' : ''}${live ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t(err ? 'hb_cx_again' : 'hb_cx_btn'))}</button>
    <span class="hb-quiet">${_hbE(live ? i18tn('hb_cx_cost', cs.length, { n: _hbN(cs.length) }) : i18t('hb_cx_nokey'))}</span></div>`;
  let box = '';
  if (busy) box = `<div class="hb-why" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span></div><p class="hb-quiet">${_hbE(i18t('hb_cx_busy'))}</p></div>`;
  else if (err) box = `<div class="hb-why is-err" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span></div><p>${_hbE(err)}</p></div>`;
  else if (kept) box = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: kept.at }))}</span></div>
    <div class="hb-why-b">${(typeof aiRichText === 'function') ? aiRichText(kept.text) : _hbE(kept.text)}</div>
    <div class="hb-why-f"><span class="${kept.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(kept.dropped ? i18tn('hb_cx_dropped', kept.dropped, { n: kept.dropped }) : i18t('hb_cx_ok'))}</span>${kept.notice ? `<span>${_hbE(kept.notice)}</span>` : ''}<span class="hb-grow"></span>
      <button type="button" class="hb-link" data-hb-why-follow="${_hbE(key)}">${_hbE(i18t('hb_cx_follow'))}</button></div></div>`;
  return read + ask + box;
}

function hbDigBodyHtml(D, lens, big){
  if (D.kind === 'list'){
    const cs = hbListOf(D.ids, lens);
    const fig = D.fig || '';
    const label = D.crumb || (D.word ? i18t(D.word) : '');
    const lead = fig ? `<div class="hb-say">${_hbE(i18tn('hb_say_' + fig, cs.length, { n: _hbN(cs.length) }))}</div>` : '';
    /* CHART FIRST, ALWAYS; the rows are the List picture */
    if (hbPlan(D).pic !== 'list') return lead + hbChartHtml(D, cs, big) + (cs.length ? hbListFootHtml(cs, label, D.stage || null, i18tn('hb_all_counted', cs.length, { n: _hbN(cs.length) })) : '');
    return lead + hbListHtml(cs, fig, label, D.stage || null);
  }
  if (D.kind === 'obl') return `<div class="hb-say">${_hbE(i18tn('hb_say_overdue', D.n, { n: _hbN(D.n) }))}</div>${hbOblRowsHtml(D.rows)}
    <div class="hb-foot"><span>${_hbE(i18tn('hb_all_shown', D.rows.length, { n: _hbN(D.rows.length) }))}</span><button type="button" class="hb-btn" data-hb-obl="overdue">${_hbE(i18t('hb_open_obligations'))}</button></div>`;
  if (D.kind === 'stages'){
    const max = Math.max(1, ...D.stages.map(s => D.money ? (s.v || 0) : s.n));
    return `<div class="hb-say">${_hbE(D.money ? i18t('hb_say_value', { v: _hbM(D.v) }) : i18t('hb_say_value_hidden'))}</div>${hbBarsHtml(D.stages.map(s => ({ label: s.word ? i18t(s.word) : s.k, v: D.money ? (s.v || 0) : s.n, say: D.money ? _hbM(s.v) : _hbN(s.n), dig: 'st:' + s.k, tone: s.tone })), max)}`;
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
  const tools = D.kind === 'list' ? `${hbBigBtnHtml(s.digBig, 'data-hb-digbig')}` : '';
  return `<div class="hb-focus" id="hb-focus"><nav class="hb-trail" aria-label="${_hbE(i18t('hb_trail'))}"><button type="button" data-hb-crumb="-1">${_hbE(i18t('hb_face_board'))}</button><span aria-hidden="true">›</span>${crumbs}</nav>
    <section class="hb-card hb-dig${_hbFocusNew ? ' is-new' : ''}${s.digBig && D.kind === 'list' ? ' is-big' : ''}"><header class="hb-ch"><span class="hb-ct">${_hbE(title)}</span><span class="hb-grow"></span>${tools}${eye}
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
    : hbPanelBodyHtml(p.kind, lens);
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
  hbKeptSync();
  const panels = s.panels.slice().reverse().map(p => hbPanelHtml(p, s.lens, { sent: gifts.sent[p.id] || null })).join('');
  const received = gifts.received.map(g => hbPanelHtml({ id: 'gift:' + g.id, kind: g.kind, split: !!g.split, big: false }, HB_LENSES.includes(g.lens) ? g.lens : 'all', { from: g })).join('');
  /* and the freshness line too: WHEN it was counted is a fact the reader
     cannot know; "all contracts" is one they chose. */
  const cut = [hbCountLabel(s.lens), s.lens === 'all' ? '' : i18t('hb_lens_' + s.lens).toLowerCase()].filter(Boolean).join(' · ');
  return `<div class="hb-note"><span class="hb-live"><i></i>${_hbE(i18t('hb_live'))}</span><span>${_hbE(cut ? i18t('hb_counted', { time, lens: cut }) : i18t('hb_counted_plain', { time }))}</span></div>
    ${hbBookHtml(d, moved, base && base.at)}
    ${hbPrepHtml(A, base && base.at)}
    ${hbFocusHtml()}
    <div class="hb-grid">${received}${panels || (received ? '' : `<div class="hb-empty">${_hbE(i18t('hb_empty'))}</div>`)}</div>`;
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
const HB_FOCUS_KEYS = ['data-hb-dig', 'data-hb-act', 'data-hb-prep', 'data-hb-crumb', 'data-hb-watch', 'data-hb-lens', 'data-hm-agent', 'data-hb-rc', 'data-hb-rset', 'data-hb-rtrend', 'data-hb-digbig'];
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
  if (!s.recipe[key]) s.recipe[key] = JSON.parse(JSON.stringify(r));
}
/* the board's own chart for a question, drawn exactly as the dig-in draws it
   (the shelf may add its normal range and the column it is about) */
function hbInsChart(key, extra){
  const D = hbDigData(key, 'all'); if (!D || D.kind !== 'list') return null;
  const cs = hbListOf(D.ids, 'all'), P = Object.assign({}, hbPlan(D), extra || {}), money = hbMoneyOk();
  let R = null;
  try {
    if (P.pic === 'cols') R = hbColsSvg(D, cs, P);
    else if (P.pic === 'blocks') R = hbBlocksSvg(D, cs, P.split.by, money);
    else if (P.pic === 'bars') R = hbGroupBars(D, cs, P);
    else if (P.pic === 'ring') R = hbRingSvg(D, cs, P.split.by, money);
  } catch (_){ R = null; }
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
  if (p.recipe){ const s = hbS(); s.recipe = s.recipe || {}; if (!s.recipe[p.key]) s.recipe[p.key] = JSON.parse(JSON.stringify(p.recipe)); }
  const D = hbDigData(p.key, lens);
  const body = D ? (D.kind === 'list' ? hbRecipeRowHtml(D, hbPlan(D)) : '') + `<div class="hb-cb">${hbDigBodyHtml(D, lens, !!p.big)}</div>` : `<div class="hb-cb"><div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div></div>`;
  return `<section class="hb-card hb-panel hb-view${p.big ? ' is-big' : ''}${p.id === _hbNewPanel ? ' is-new' : ''}" data-hb-pid="${_hbE(p.id)}">
    <header class="hb-ch"><span class="hb-ct">${_hbE(hbPanelWord(p))}</span><span class="hb-grow"></span>
      <span class="hb-src" title="${_hbE(i18t('hb_ins_src_tip'))}">${_hbE(i18t('hb_ins_src'))}</span>
      ${hbBigBtnHtml(p.big, 'data-hb-act="big"')}
      <button type="button" class="hb-ib hb-x" data-hb-act="x" title="${_hbE(i18t('hb_p_x'))}" aria-label="${_hbE(i18t('hb_p_x'))}">${_hbX}</button></header>
    ${body}</section>`;
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
    try { if (p.recipe){ s.recipe = s.recipe || {}; if (!s.recipe[p.key]) s.recipe[p.key] = JSON.parse(JSON.stringify(p.recipe)); }
      const C = hbInsChart(p.key); if (C) say = C.R.say || i18tn('hb_all_counted', C.cs.length, { n: _hbN(C.cs.length) }); } catch (_){}
    return { title: hbPanelWord(p), say, at: hbToday() }; });
  s.keptSent = sig; hbSave();
  Promise.resolve(api('home/kept', 'PUT', { views: out })).catch(() => { s.keptSent = ''; hbSave(); });
}

/* ---- THE ASK: the board's free reader in front of Explorer's own ----
   Called by intelAsk on Home. Returns the answer it gave (HTML for the dock),
   or null to hand the question on. */
function hbAsk(q){
  const r = hbParse(q);
  /* a chart question HaTi could not read whole goes on to Copilot with its
     picture words already read (hbShowFound puts them on the answer) */
  _hbPendingRecipe = r ? null : hbRecipeRead(q);
  if (!r) return null;
  const s = hbS();
  /* EXPLORER STAYS AS DESIGNED (the owner's words): on the map side the
     board's reader steps aside for every question but the two that are about
     the screen itself — back to the board, and Present. A question about
     renewals asked of the map is the map's to answer. */
  if (s.face !== 'board' && !((r.act === 'face' && r.face === 'board') || r.act === 'present' || r.act === 'analyze')) return null;
  const free = i18t('hb_free');
  const say = (html, opts) => { if (!opts || !opts.noPaint){ if (s.face === 'board') hbPaintBoard(opts && opts.jump ? { jump: opts.jump } : undefined); } return html + `<div class="hb-cost">${_hbE(free)}</div>`; };
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
    const keep = { screen: s.screen, watches: s.watches, saved: s.saved, seen: s.seen, seq: s.seq };
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
    return say(_hbE(i18tn('hb_found_n', D.n, { n: _hbN(D.n), what: D.title || '' })), { noPaint: true });
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
  const pg = hbPage(); if (pg) pg.classList.toggle('hb-presenting', _hbPresenting);
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
  if ((el = on('[data-hb-crumb]'))){ const s = hbS(), i = Number(el.getAttribute('data-hb-crumb'));
    s.path = i < 0 ? [] : (s.path || []).slice(0, i + 1); _hbFocusNew = i >= 0; _hbWatchForm = null; hbSave(); hbPaintBoard({ jump: i < 0 ? null : 'focus' }); return; }
  if ((el = on('[data-hb-rc]'))){ const p = el.getAttribute('data-hb-rc'); _hbRcOpen = _hbRcOpen === p ? null : p; hbPaintBoard(); return; }
  if ((el = on('[data-hb-rset]'))){ if (el.disabled) return; const s = hbS(), key = (s.path || []).slice(-1)[0], v = el.getAttribute('data-hb-rset'), i = v.indexOf(':');
    _hbRcOpen = null; if (key && i > 0) hbRecipeSet(key, v.slice(0, i), v.slice(i + 1)); hbPaintBoard(); return; }
  if ((el = on('[data-hb-rtrend]'))){ if (el.disabled) return; const s = hbS(), key = (s.path || []).slice(-1)[0];
    if (key){ const D = hbDigData(key, s.lens); if (D) hbRecipeSet(key, 'trend', !hbPlan(D).trend); } _hbRcOpen = null; hbPaintBoard(); return; }
  if (on('[data-hb-rinstead]')){ const s = hbS(), key = (s.path || []).slice(-1)[0];
    if (key){ hbRecipeSet(key, 'measure', 'count'); hbRecipeSet(key, 'split', 'd:m:signed'); hbRecipeSet(key, 'trend', true); } hbPaintBoard(); return; }
  if (on('[data-hb-digbig]')){ const s = hbS(); s.digBig = !s.digBig; hbSave(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-prep]'))){ const v = el.getAttribute('data-hb-prep'); if (HB_PREP.includes(v)){ hbS().prep = v; hbSave(); hbPaintBoard(); } return; }
  if ((el = on('[data-hb-watch-stop]'))){ const s = hbS(); s.watches.splice(Number(el.getAttribute('data-hb-watch-stop')), 1); hbSave(); hbAlertsChanged(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-watch]'))){ const k = el.getAttribute('data-hb-watch'); _hbWatchForm = _hbWatchForm === k ? null : k; hbPaintBoard(); return; }
  if (on('[data-hb-watch-cancel]')){ _hbWatchForm = null; hbPaintBoard(); return; }
  if (on('[data-hb-give-cancel]')){ _hbGiveForm = null; hbPaintBoard(); return; }
  if ((el = on('[data-hb-ungive]'))){ hbUngive(el.getAttribute('data-hb-ungive')); return; }
  if ((el = on('[data-hb-act]'))){
    const card = el.closest('[data-hb-pid]'); const pid = card && card.getAttribute('data-hb-pid'); if (!pid) return;
    const act = el.getAttribute('data-hb-act'), s = hbS();
    if (/^gift:/.test(pid)){ if (act === 'x') hbDropGift(pid.slice(5)); return; }
    const p = s.panels.find(x => x.id === pid); if (!p) return;
    if (act === 'x') s.panels.splice(s.panels.indexOf(p), 1);
    else if (act === 'split') p.split = !p.split;
    else if (act === 'big') p.big = !p.big;
    else if (act === 'give') _hbGiveForm = _hbGiveForm === pid ? null : pid;
    hbSave(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-analyze]'))){ hbAnalyze(el.getAttribute('data-hb-analyze')); return; }
  if ((el = on('[data-hb-map]'))){ hbShowOnMap(el.getAttribute('data-hb-map'), el.getAttribute('data-hb-what')); return; }
  if ((el = on('[data-hb-open][data-hb-stage]')) && typeof regGoFiltered === 'function'){ regGoFiltered({ stage: el.getAttribute('data-hb-stage') }); return; }
  if ((el = on('[data-hb-open]'))){ const ids = String(el.getAttribute('data-hb-open') || '').split(',').filter(Boolean);
    if (ids.length && typeof regShowOnly === 'function') regShowOnly(ids, el.getAttribute('data-hb-what') || ''); return; }
  if (on('[data-hb-obl]')){ if (typeof obwGoFiltered === 'function') obwGoFiltered({ state: 'overdue' }); else setView('obligations'); return; }
  if ((el = on('[data-hb-room]'))){ if (typeof openWorkspace === 'function') openWorkspace(el.getAttribute('data-hb-room')); return; }
  if ((el = on('[data-hb-why]'))){ hbWhyAsk(el.getAttribute('data-hb-why')); return; }
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
  if (f && f.matches && f.matches('[data-hb-give-form]')){
    e.preventDefault();
    hbGive(f.getAttribute('data-hb-give-form'), f.to.value, f.note.value);
  }
}
function hbOnPointer(e){
  const col = document.getElementById('hb-col'); if (!col || !state || state.view !== 'dashboard') return;
  if (_hbTool === 'pointer'){
    const r = col.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    const lz = document.getElementById('hb-laser'); if (lz) lz.style.transform = `translate(${x}px,${y}px)`;
    _hbTrail.unshift([x, y]); _hbTrail = _hbTrail.slice(0, 10);
    for (let i = 1; i <= 3; i++){ const q = _hbTrail[i * 3]; const d = document.getElementById('hb-laser-' + i);
      if (d){ d.hidden = !q; if (q){ d.style.transform = `translate(${q[0]}px,${q[1]}px)`; d.style.opacity = String(0.5 - i * 0.14); } } }
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
  if (e.key === 'Escape' && _hbRcOpen){ const p = _hbRcOpen; _hbRcOpen = null; hbPaintBoard(); const b = document.querySelector(`[data-hb-rc="${p}"]`); if (b) try { b.focus({ preventScroll: true }); } catch (_){} return; }
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

Object.assign(window, { HB_LS, HB_FACES, HB_LENSES, HB_SCREENS, HB_PREP, HB_FIGS, HB_FIG_KEYS, HB_KINDS, HB_KIND_KEYS,
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
  hbBigBtnHtml, hbReadingOf, hbReadHtml, hbWhySig, hbWhyKept, hbWhyPrompt, hbWhyCheck, hbWhyAsk, hbWhyFollow, HB_WHY_KEEP });
