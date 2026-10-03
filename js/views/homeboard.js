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
    watches: [], seen: null, saved: [], seq: 0, found: null, digView: {}, digBig: false };
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
    if (Array.isArray(v.panels)) s.panels = v.panels.filter(p => p && HB_KINDS[p.kind])
      .slice(-HB_PANELS_MAX).map(p => ({ id: String(p.id || ''), kind: p.kind, split: !!p.split, big: !!p.big }));
    if (Array.isArray(v.path)) s.path = v.path.filter(k => typeof k === 'string').slice(-HB_PATH_MAX);
    if (Array.isArray(v.watches)) s.watches = v.watches.filter(w => w && HB_FIG_KEYS.includes(w.k)
      && (w.dir === 'above' || w.dir === 'below') && isFinite(Number(w.n))).slice(0, HB_WATCH_MAX)
      .map(w => ({ k: w.k, dir: w.dir, n: Number(w.n) }));
    if (v.seen && typeof v.seen === 'object') s.seen = v.seen;
    if (Array.isArray(v.saved)) s.saved = v.saved.filter(x => x && x.name && Array.isArray(x.kinds)).slice(-6)
      .map(x => ({ name: String(x.name).slice(0, 60), kinds: x.kinds.filter(k => HB_KINDS[k]), lens: HB_LENSES.includes(x.lens) ? x.lens : 'all' }));
    s.seq = Number(v.seq) || s.panels.length;
    if (v.found && Array.isArray(v.found.ids)) s.found = { title: String(v.found.title || '').slice(0, 120), ids: v.found.ids.filter(x => typeof x === 'string').slice(0, 2000) };
    if (v.digView && typeof v.digView === 'object') s.digView = Object.fromEntries(Object.entries(v.digView).filter(([k, m]) => typeof k === 'string' && (m === 'chart' || m === 'list')).slice(-30));
    s.digBig = !!v.digBig;
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
function hbBookData(lens){
  const cs = hbBook(lens || 'all');
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

/* ---------------- the panels a question puts on the board ---------------- */
function hbLensIds(lens){ return new Set(hbBook(lens).map(c => c.id)); }
function hbPanelData(kind, lens){
  const ids = hbLensIds(lens);
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
    const cs = hbBook(lens).filter(c => c.status !== 'Declined');
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
      const S = (P && P[k]) || { rows: [], over: [] };
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
      stage: (lens || 'all') === 'all' ? a : null, chart: { mode: 'groups', by: 'folder' }, fixed: ['status'] };
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
    const ids = cs.filter(c => hbMonthOf(c, field === 'y') === label).map(c => c.id);
    return { key, kind: 'list', crumb: hbMonthLabel(label, field === 'y'), title: hbMonthLabel(label, field === 'y'), ids, n: ids.length, fixed: P.fixed || [], chart: { mode: 'groups', by: hbNextGroup(P.fixed || []) } };
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
    const cq = igConditions(a); if (!cq.length) return null;
    const ids = igIdsWhere(cq, hbBook(lens));
    const labels = cq.map(x => x.label);
    const party = cq.length === 1 && cq[0].field === 'counterparty';
    const title = party ? i18t('hb_found_party', { who: labels[0] }) : labels.join(' · ');
    /* the chart the question's shape asks for: a money question → the
       contracts by value; a date question → the months; else the groups the
       question did not already fix */
    const fields = cq.map(x => x.field);
    const chart = fields.some(f => /^value/.test(f)) ? { mode: 'values' } : fields.some(f => /Window$|^expired$/.test(f)) ? { mode: 'months' } : { mode: 'groups', by: hbNextGroup(fields) };
    return { key, kind: 'list', crumb: labels.join(' · '), title, ids, n: ids.length, fixed: fields, chart };
  }
  /* THE LIST AN ANSWER CAME BACK WITH (Copilot's or the map's), drawn on the
     board so a question asked on the board always lands on the board */
  if (k === 'ls'){
    const F = hbS().found; if (!F || !Array.isArray(F.ids)) return null;
    const ids = F.ids.filter(id => hbContract(id));
    return { key, kind: 'list', crumb: F.title || i18t('hb_found_list'), title: F.title || i18t('hb_found_list'), ids, n: ids.length, chart: { mode: 'groups', by: 'status' }, fixed: [] };
  }
  if (k === 'cp'){
    const cs = hbBook(lens).filter(c => String(c.counterparty || '') === a);
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
function hbParse(qRaw){
  const q = String(qRaw || '').trim(); if (!q) return null;
  const s = q.toLowerCase();
  /* two named contracts are Explorer's to compare side by side */
  if ((q.match(/\b(?:mk|rl)[- ]?\d+\b/gi) || []).length >= 2) return null;
  const found = hbFindContract(q);
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
  let day = ''; try { day = new Date().toLocaleDateString(langLocale(), { weekday: 'long', day: 'numeric', month: 'long' }); } catch (_){}
  const A = hbAgentsData(null);
  const sub = [day, A.ready ? i18tn('hb_ready_for_you', A.ready, { n: _hbN(A.ready) }) : ''].filter(Boolean).join(' · ');
  return `<h1>${_hbE(greet)}, ${_hbE(first)}</h1><span>${_hbE(sub)}</span>`;
}
function hbHeadHtml(groupSel){
  const s = hbS();
  const lens = s.lens === 'all' ? `<span class="hb-lens-chip is-all">${_hbE(i18t('hb_lens_all'))}</span>`
    : `<span class="hb-lens-chip">${_hbE(i18t('hb_lens_' + s.lens))}<button type="button" data-hb-lens="all" aria-label="${_hbE(i18t('hb_lens_x'))}" title="${_hbE(i18t('hb_lens_x'))}">${_hbX}</button></span>`;
  const face = f => `<button type="button" role="tab" data-hb-face="${f}" aria-selected="${s.face === f}">${_hbE(i18t('hb_face_' + f))}</button>`;
  const scr = m => `<button type="button" data-hb-screen="${m}" aria-pressed="${s.screen === m}">${_hbE(i18t('hb_screen_' + m))}</button>`;
  return `<style>#page-head{background:var(--color-surface)}</style>
  <header id="hb-head" class="hb-head">
    <div class="hb-hello">${hbHelloInner()}</div>
    <div class="hb-seg" role="tablist" aria-label="${_hbE(i18t('hb_show'))}">${face('board')}${face('explorer')}</div>
    <span class="hb-grow"></span>
    <label class="hb-groupby" id="hb-groupby"${s.face === 'explorer' ? '' : ' hidden'}>${_hbE(i18t('hb_group_by'))} ${groupSel || ''}</label>
    <span class="hb-counting">${_hbE(i18t('hb_counting'))} ${lens}</span>
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
  const sub = [i18t('hb_lens_' + d.lens), since ? i18t('hb_book_since', { when: hbDayWords(since) }) : ''].filter(Boolean).join(' · ');
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
function hbPrepHtml(A, since){
  const st = hbS().prep;
  /* drawn while there is work ready OR work done while you were away */
  if (st === 'closed' || (!A.rows.length && !A.done.length)) return '';
  const folded = st === 'folded';
  const next = A.rows[0];
  const sub = i18tn('hm_ag_sub', A.ready, { n: _hbN(A.ready) }) + (folded && next ? ' · ' + i18t('hb_prep_next', { who: next.who || next.sum }) : '');
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
    <button type="button" class="hb-ib" data-hb-prep="closed" title="${_hbE(i18t('hb_prep_close'))}" aria-label="${_hbE(i18t('hb_prep_close'))}">${_hbX}</button></header>
    ${done}${rows ? `<div class="hb-ags">${rows}</div>` : ''}</section>`;
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
  if (field === 'counterparty') return String(c.counterparty || '').trim();
  if (field === 'kind'){ try { return (typeof cKind === 'function') ? cKind(c) : ''; } catch (_){ return ''; } }
  if (field === 'side'){ const x = hbSideOf(c); return x || ''; }
  return '';
}
function hbGroupLabel(field, g){
  if (!g) return field === 'counterparty' ? i18t('hb_no_counterparty') : '—';
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
function hbChartHtml(D, cs){
  const money = hbMoneyOk();
  const plan = D.chart || { mode: 'groups', by: 'status' };
  const mode = (plan.mode === 'values' && !money) ? 'groups' : plan.mode;
  const total = money ? cs.reduce((a, c) => a + hbValueOfOne(c), 0) : null;
  const sayOf = (n, v) => money ? _hbM(v) + ' · ' + _hbN(n) : _hbN(n);
  let body = '', by = '', note = '';
  if (!cs.length) return `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
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
    const field = plan.by || 'status';
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
  return `<div class="hb-chart-lead"><b>${_hbN(cs.length)}</b> ${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}${money ? ` · <b>${_hbE(_hbM(total))}</b>` : ''}<span class="hb-chart-by">${_hbE(by)}</span></div>${body}${note ? `<div class="hb-quiet hb-chart-note">${_hbE(note)}</div>` : ''}`;
}
function hbDigViewHtml(key){
  const mode = (hbS().digView || {})[key] === 'list' ? 'list' : 'chart';
  const b = (m, w) => `<button type="button" role="tab" data-hb-digview="${m}" aria-selected="${mode === m}">${_hbE(i18t(w))}</button>`;
  return `<div class="hb-seg hb-seg-sm" role="tablist" aria-label="${_hbE(i18t('hb_view_label'))}">${b('chart', 'hb_view_chart')}${b('list', 'hb_view_list')}</div>`;
}
function hbDigBodyHtml(D, lens){
  if (D.kind === 'list'){
    const cs = hbListOf(D.ids, lens);
    const fig = D.fig || '';
    const label = D.crumb || (D.word ? i18t(D.word) : '');
    const lead = fig ? `<div class="hb-say">${_hbE(i18tn('hb_say_' + fig, cs.length, { n: _hbN(cs.length) }))}</div>` : '';
    /* CHART FIRST, ALWAYS; the rows on the switch */
    if ((hbS().digView || {})[D.key] !== 'list') return lead + hbChartHtml(D, cs) + (cs.length ? hbListFootHtml(cs, label, D.stage || null, i18tn('hb_all_counted', cs.length, { n: _hbN(cs.length) })) : '');
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
  const d = hbBookData('all'); const v = hbFigNumber(d, k);
  return `<form class="hb-inl" data-hb-watch-form="${k}">${_hbE(i18t('hb_watch_tell', { what: i18t('hb_f_' + k) }))}
    <select name="dir" aria-label="${_hbE(i18t('hb_watch_dir'))}"><option value="above">${_hbE(i18t('hb_watch_above'))}</option><option value="below">${_hbE(i18t('hb_watch_below'))}</option></select>
    <input type="number" name="n" value="${Math.round(v)}" min="0" aria-label="${_hbE(i18t('hb_watch_line'))}">
    <button type="submit" class="hb-btn is-primary">${_hbE(i18t('hb_watch_go'))}</button><button type="button" class="hb-btn" data-hb-watch-cancel>${_hbE(i18t('hb_cancel'))}</button>
    <span class="hb-quiet hb-wide">${_hbE(i18t('hb_watch_note'))}</span></form>`;
}
function hbWatchFired(w){ const v = hbFigNumber(hbBookData('all'), w.k); return w.dir === 'above' ? v > w.n : v < w.n; }
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
  const key = path[path.length - 1];
  const tools = D.kind === 'list' ? hbDigViewHtml(key) + `<button type="button" class="hb-ib" data-hb-digbig aria-pressed="${!!s.digBig}" title="${_hbE(i18t(s.digBig ? 'hb_p_small' : 'hb_p_big'))}" aria-label="${_hbE(i18t('hb_p_big'))}">${_hbBigIc}</button>` : '';
  return `<div class="hb-focus" id="hb-focus"><nav class="hb-trail" aria-label="${_hbE(i18t('hb_trail'))}"><button type="button" data-hb-crumb="-1">${_hbE(i18t('hb_face_board'))}</button><span aria-hidden="true">›</span>${crumbs}</nav>
    <section class="hb-card hb-dig${_hbFocusNew ? ' is-new' : ''}${s.digBig && D.kind === 'list' ? ' is-big' : ''}"><header class="hb-ch"><span class="hb-ct">${_hbE(title)}</span>${tools}${eye}
      ${path.length > 1 ? `<button type="button" class="hb-ib" data-hb-crumb="${path.length - 2}" title="${_hbE(i18t('hb_step_back'))}" aria-label="${_hbE(i18t('hb_step_back'))}">${_hbBack}</button>` : ''}
      <button type="button" class="hb-ib" data-hb-crumb="-1" title="${_hbE(i18t('hb_close_dig'))}" aria-label="${_hbE(i18t('hb_close_dig'))}">${_hbX}</button></header>
      <div class="hb-cb">${fk && _hbWatchForm === fk ? hbWatchFormHtml(fk) : ''}${watching}${hbDigBodyHtml(D, s.lens)}</div></section></div>`;
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
      <button type="button" class="hb-btn" data-hb-map="${_hbE(K.id)}" data-hb-what="${_hbE(K.ref)}">${_hbE(i18t('hb_c_on_map'))}</button>
      <button type="button" class="hb-btn" data-hb-ai="${_hbE(q)}" title="${_hbE(i18t('hb_c_ask_cost'))}">${_hbE(i18t('hb_c_ask', { q }))}</button></div></div>
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
  const K = HB_KINDS[p.kind];
  const body = p.split
    ? `<div class="hb-split"><div><div class="hb-lab is-side">${_hbE(i18t('hb_lens_suppliers'))}</div>${hbPanelBodyHtml(p.kind, 'suppliers')}</div><div><div class="hb-lab is-side">${_hbE(i18t('hb_lens_customers'))}</div>${hbPanelBodyHtml(p.kind, 'customers')}</div></div>`
    : hbPanelBodyHtml(p.kind, lens);
  const given = gift && gift.sent ? `<span class="hb-given" title="${_hbE(gift.sent.note || '')}">${_hbE(i18t('hb_given', { who: gift.sent.toName || '', seen: i18t(gift.sent.seenAt ? 'hb_seen' : 'hb_not_seen') }))}<button type="button" data-hb-ungive="${_hbE(gift.sent.id)}" title="${_hbE(i18t('hb_take_back'))}" aria-label="${_hbE(i18t('hb_take_back'))}">${_hbX}</button></span>` : '';
  const from = gift && gift.from ? `<span class="hb-given is-from" title="${_hbE(gift.from.note || '')}">${_hbE(i18t('hb_from', { who: gift.from.fromName || '' }))}</span>` : '';
  return `<section class="hb-card hb-panel${(p.big || p.split) ? ' is-big' : ''}${p.id === _hbNewPanel ? ' is-new' : ''}" data-hb-pid="${_hbE(p.id)}">
    <header class="hb-ch"><span class="hb-ct">${_hbE(i18t(K.word))}${p.split ? ' · ' + _hbE(i18t('hb_side_by_side')) : ''}</span>${from}${given}
      <span class="hb-src" title="${_hbE(i18t('hb_p_src', { tab: i18t(K.src) }))}">${_hbE(i18t(K.src))}</span>
      <button type="button" class="hb-ib" data-hb-act="split" aria-pressed="${!!p.split}" title="${_hbE(i18t(p.split ? 'hb_p_unsplit' : 'hb_p_split'))}" aria-label="${_hbE(i18t('hb_p_split'))}">${_hbSplitIc}</button>
      ${gift && gift.from ? '' : `<button type="button" class="hb-ib" data-hb-act="give" aria-pressed="${_hbGiveForm === p.id}" title="${_hbE(i18t('hb_p_give'))}" aria-label="${_hbE(i18t('hb_p_give'))}">${_hbGiveIc}</button>`}
      <button type="button" class="hb-ib" data-hb-act="big" aria-pressed="${!!p.big}" title="${_hbE(i18t(p.big ? 'hb_p_small' : 'hb_p_big'))}" aria-label="${_hbE(i18t('hb_p_big'))}">${_hbBigIc}</button>
      <button type="button" class="hb-ib" data-hb-act="x" title="${_hbE(i18t(gift && gift.from ? 'hb_p_x_gift' : 'hb_p_x'))}" aria-label="${_hbE(i18t('hb_p_x'))}">${_hbX}</button></header>
    <div class="hb-cb">${_hbGiveForm === p.id ? hbGiveFormHtml(p) : ''}${body}</div></section>`;
}

/* ---- THE BOARD ---- */
function hbBoardHtml(){
  const s = hbS();
  const d = hbBookData(s.lens);
  const base = hbSeenTick(hbBookData('all'));
  const moved = (s.lens === 'all' && base) ? hbMoved(d, base) : null;
  const A = hbAgentsData(base && base.at);
  let time = ''; try { time = new Date().toLocaleTimeString(langLocale(), { hour: '2-digit', minute: '2-digit' }); } catch (_){}
  const gifts = hbGiftsFor();
  const panels = s.panels.slice().reverse().map(p => hbPanelHtml(p, s.lens, { sent: gifts.sent[p.id] || null })).join('');
  const received = gifts.received.map(g => hbPanelHtml({ id: 'gift:' + g.id, kind: g.kind, split: !!g.split, big: false }, HB_LENSES.includes(g.lens) ? g.lens : 'all', { from: g })).join('');
  return `<div class="hb-note"><span class="hb-live"><i></i>${_hbE(i18t('hb_live'))}</span><span>${_hbE(i18t('hb_counted', { time, lens: i18t('hb_lens_' + s.lens).toLowerCase() }))}</span></div>
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
const HB_FOCUS_KEYS = ['data-hb-dig', 'data-hb-act', 'data-hb-prep', 'data-hb-crumb', 'data-hb-watch', 'data-hb-lens', 'data-hm-agent', 'data-hb-digview', 'data-hb-digbig'];
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
  if (chip) chip.innerHTML = _hbE(i18t('hb_counting')) + ' ' + (s.lens === 'all' ? `<span class="hb-lens-chip is-all">${_hbE(i18t('hb_lens_all'))}</span>`
    : `<span class="hb-lens-chip">${_hbE(i18t('hb_lens_' + s.lens))}<button type="button" data-hb-lens="all" aria-label="${_hbE(i18t('hb_lens_x'))}" title="${_hbE(i18t('hb_lens_x'))}">${_hbX}</button></span>`);
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
  if (f === 'explorer' && window.intel) intel.legendFolded = true;
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
  if (lens === 'all') return;
  intel.lenses.push({ id: 'hblens', hb: true, on: true, action: 'filter', label: i18t('hb_lens_' + lens), ids: hbBook(lens).map(c => c.id), badges: null });
}
/* SHOW THESE ON THE MAP: Explorer's own lens, lighting the set and dimming
   the rest, then the flip. A lens is added once (addLens' own rule). */
function hbShowOnMap(ids, label){
  const list = String(ids || '').split(',').filter(Boolean);
  if (!list.length || !window.intel) return;
  /* NARROWED, not lit (the owner, 3 Oct 2026: "I asked for Juno contracts and
     it shows me all these contracts"): the map shows these and nothing else;
     the map's own "Show everything" brings the rest back. */
  if (typeof addLens === 'function'){ intel.lenses = intel.lenses.filter(l => l.action !== 'filter' || l.hb); addLens({ ids: list, label: label || i18tn('hb_n_contracts', list.length, { n: list.length }), action: 'filter' }); }
  const s = hbS(); s.face = 'explorer'; hbSave();
  hbMount();
}
function hbDig(key, deeper){
  const s = hbS();
  s.path = deeper ? (s.path || []).concat(key).slice(-HB_PATH_MAX) : [key];
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

/* ---- THE ASK: the board's free reader in front of Explorer's own ----
   Called by intelAsk on Home. Returns the answer it gave (HTML for the dock),
   or null to hand the question on. */
function hbAsk(q){
  const r = hbParse(q); if (!r) return null;
  const s = hbS();
  /* EXPLORER STAYS AS DESIGNED (the owner's words): on the map side the
     board's reader steps aside for every question but the two that are about
     the screen itself — back to the board, and Present. A question about
     renewals asked of the map is the map's to answer. */
  if (s.face !== 'board' && !((r.act === 'face' && r.face === 'board') || r.act === 'present')) return null;
  const free = i18t('hb_free');
  const say = (html, opts) => { if (!opts || !opts.noPaint){ if (s.face === 'board') hbPaintBoard(opts && opts.jump ? { jump: opts.jump } : undefined); } return html + `<div class="hb-cost">${_hbE(free)}</div>`; };
  if (r.act === 'card'){
    const c = hbContract(r.id); const K = hbCardData(c);
    hbDig('c:' + c.id, false);
    return say(`<b>${_hbE(K.ref)} · ${_hbE(K.name)}</b> — ${_hbE(_hbStatus(K.status))}${K.cp ? ' · ' + _hbE(K.cp) : ''}${K.expiry ? ' · ' + _hbE(i18t('hb_c_ends', { day: K.expiry })) : ''}. ${_hbE(i18t('hb_card_said'))}`, { noPaint: true });
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
    const now = hbFigNumber(hbBookData('all'), r.k);
    return say(_hbE(i18t('hb_watch_said', { what: i18t('hb_f_' + r.k), dir: i18t('hb_watch_' + r.dir), n: r.n })) + ' ' + _hbE(hbWatchFired(s.watches[s.watches.length - 1]) ? i18t('hb_watch_said_now', { n: r.k === 'value' ? _hbM(now) : _hbN(now) }) : i18t('hb_watch_note')));
  }
  if (r.act === 'split'){
    const kind = r.kind || (s.panels.length ? s.panels[s.panels.length - 1].kind : 'val');
    if (s.face !== 'board'){ s.face = 'board'; hbSave(); }
    const { left } = hbAddPanel(kind, { split: true });
    hbMount();
    return say(_hbE(i18t('hb_split_said', { what: i18t(HB_KINDS[kind].word) })) + (left ? ' ' + _hbE(i18t('hb_panel_left', { what: i18t(HB_KINDS[left.kind].word) })) : ''), { noPaint: true });
  }
  if (r.act === 'panel'){
    if (r.lens && r.lens !== s.lens){ s.lens = r.lens; hbLensOnMap(); }
    const flip = s.face !== 'board'; s.face = 'board';
    const { p, left } = hbAddPanel(r.kind);
    hbSave();
    if (flip && typeof renderDashboard === 'function') renderDashboard(); else hbPaintBoard();
    const host = hbHost(); const el = host && host.querySelector(`[data-hb-pid="${p.id}"]`); if (el && host) host.scrollTop = Math.max(0, el.offsetTop - 12);
    return say(_hbE(hbPanelSay(r.kind, s.lens)) + (left ? ' ' + _hbE(i18t('hb_panel_left', { what: i18t(HB_KINDS[left.kind].word) })) : ''), { noPaint: true });
  }
  if (r.act === 'remove'){
    const i = s.panels.findIndex(x => x.kind === r.kind);
    if (i < 0) return say(_hbE(i18t('hb_not_on_board')), { noPaint: true });
    s.panels.splice(i, 1); hbSave();
    return say(_hbE(i18t('hb_removed', { what: i18t(HB_KINDS[r.kind].word) })));
  }
  if (r.act === 'save'){
    s.saved = (s.saved || []).filter(x => x.name.toLowerCase() !== r.name.toLowerCase());
    s.saved.push({ name: r.name.slice(0, 60), kinds: s.panels.map(p => p.kind), lens: s.lens }); s.saved = s.saved.slice(-6); hbSave();
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
function hbShowFound(ids, title){
  const s = hbS(); if (s.face !== 'board' || !Array.isArray(ids) || !ids.length) return false;
  s.found = { title: String(title || '').slice(0, 120), ids: ids.filter(x => typeof x === 'string').slice(0, 2000) };
  hbDig('ls', false);
  return true;
}

/* ---------------- WATCH A NUMBER ----------------
   A rule this person set, read where the number is; it becomes a row in the
   bell when the line is crossed, and nothing is sent. buildAlerts asks this. */
function hbWatchAlerts(){
  let s; try { s = hbS(); } catch (_){ return []; }
  if (!s.watches || !s.watches.length) return [];
  const d = hbBookData('all');
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
  if ((el = on('[data-hb-digview]'))){ const s = hbS(), m = el.getAttribute('data-hb-digview'), key = (s.path || []).slice(-1)[0];
    if (key && (m === 'chart' || m === 'list')){ s.digView = s.digView || {}; s.digView[key] = m; const ks = Object.keys(s.digView); if (ks.length > 30) delete s.digView[ks[0]]; hbSave(); hbPaintBoard(); } return; }
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
  if ((el = on('[data-hb-map]'))){ hbShowOnMap(el.getAttribute('data-hb-map'), el.getAttribute('data-hb-what')); return; }
  if ((el = on('[data-hb-open][data-hb-stage]')) && typeof regGoFiltered === 'function'){ regGoFiltered({ stage: el.getAttribute('data-hb-stage') }); return; }
  if ((el = on('[data-hb-open]'))){ const ids = String(el.getAttribute('data-hb-open') || '').split(',').filter(Boolean);
    if (ids.length && typeof regShowOnly === 'function') regShowOnly(ids, el.getAttribute('data-hb-what') || ''); return; }
  if (on('[data-hb-obl]')){ if (typeof obwGoFiltered === 'function') obwGoFiltered({ state: 'overdue' }); else setView('obligations'); return; }
  if ((el = on('[data-hb-room]'))){ if (typeof openWorkspace === 'function') openWorkspace(el.getAttribute('data-hb-room')); return; }
  if ((el = on('[data-hb-ai]'))){ if (typeof openAI === 'function') openAI(el.getAttribute('data-hb-ai')); return; }
  if ((el = on('[data-hm-agent]'))){ e.stopPropagation(); const k = el.getAttribute('data-hm-agent');
    if (k && typeof agSetSel === 'function') agSetSel(k); setView('agents'); return; }
  if ((el = on('[data-hb-dig]'))){ if (el.disabled) return; hbDig(el.getAttribute('data-hb-dig'), !!el.closest('.hb-dig')); return; }
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
  if (e.key !== 'Escape' || !window.state || state.view !== 'dashboard') return;
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
  hbUngive, hbDropGift, hbToolsPaint, hbSetTool, hbInkClear, hbPresent, hbPlace, hbPlacePut, hbOnClick, hbOnSubmit, hbOnKey, hbHelloInner, hbFocusKey, hbShowFound, HB_KEY_SEP, HB_CHART_BARS, HB_CHART_MONTHS, HB_GROUP_FIELDS, hbNextGroup, hbGroupOf, hbGroupLabel, hbGroupWord, hbMonthOf, hbMonthLabel, hbValueBands, hbChartHtml, hbChartBarsHtml, hbChartColsHtml, hbDigViewHtml, hbListFootHtml });
