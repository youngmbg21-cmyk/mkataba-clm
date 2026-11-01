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
/* THE PAPER IS A THIRD SIDE OF HOME (Young, 7 Oct 2026: "there should be
   another button that says paper ... the same paper currently on screen when
   you analyse a contract"; Explorer loses its own Graph | Paper switch). */
/* CALENDAR IS HOME'S SECOND TAB (owner, 11 Oct 2026, WORKORDER-four-builds
   item 1): today → coming up → one contract → the whole book */
/* THE BREAKDOWN FACE IS GONE (owner, 13 Oct 2026: "You were also supposed to
   delete breakdown"): its reading lives on in Document → Clauses (Stakes,
   js/views/breakdown.js stkDecorate). A kept "breakdown" face lands on Board.
   THE ORDER IS THE OWNER'S (11 Oct 2026): Board · Document · Calendar ·
   Explorer, drawn as one sliding pill (hbHeadHtml). */
const HB_FACES = ['board', 'paper', 'calendar', 'explorer'];
/* each face's drawn icon, from the shared ICONS (components.js) */
const HB_FACE_ICON = { board: 'grid', paper: 'file', calendar: 'calendar', explorer: 'network' };
const HB_LENSES = ['all', 'suppliers', 'customers'];
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
  /* figures a person may pick instead (owner, 11 Oct 2026: "only 5 cards, but
     a small settings feature to add other KPI cards while removing one") */
  { k: 'drafting', word: 'hb_f_drafting', tip: 'hb_f_drafting_tip', tone: '', stage: 'Draft' },
  { k: 'review',   word: 'hb_f_review',   tip: 'hb_f_review_tip',   tone: '', stage: 'Under Review' },
  { k: 'signed',   word: 'hb_f_signed',   tip: 'hb_f_signed_tip',   tone: '', stage: 'Signed' },
  /* WHAT WE PAY AGAINST HOW WE ARE PAID (owner picked "figures in the picker",
     11 Oct 2026): js/payterms.js's own reading (payTermsData) — the averages
     weighted by value, sides by the contract's category — never counted here */
  { k: 'wewait', word: 'hb_f_wewait', tip: 'hb_f_wewait_tip', tone: '', days: true },
  { k: 'wepay',  word: 'hb_f_wepay',  tip: 'hb_f_wepay_tip',  tone: '', days: true },
  { k: 'paygap', word: 'hb_f_paygap', tip: 'hb_f_paygap_tip', tone: '', days: true },
];
/* FIVE FIGURES, EACH PERSON'S OWN (s.figs): the default five, a press on the
   head's sliders swaps one for another; never more than five */
const HB_FIGS_MAX = 5, HB_FIGS_DEFAULT = ['live', 'value', 'ending', 'past', 'overdue'];
let _hbFigPick = false;
function hbFigsChosen(money){
  const s = hbS(); const keys = Array.isArray(s.figs) && s.figs.length ? s.figs : HB_FIGS_DEFAULT;
  return keys.map(k => HB_FIGS.find(f => f.k === k)).filter(f => f && (!f.money || money)).slice(0, HB_FIGS_MAX);
}
function hbFigToggle(k){
  const s = hbS(); const cur = (Array.isArray(s.figs) && s.figs.length ? s.figs : HB_FIGS_DEFAULT).slice();
  const i = cur.indexOf(k);
  if (i >= 0){ if (cur.length > 1) cur.splice(i, 1); }
  else if (cur.length < HB_FIGS_MAX && HB_FIG_KEYS.includes(k)) cur.push(k);
  s.figs = cur; hbSave();
}
function hbFigPickHtml(money){
  const s = hbS(); const cur = Array.isArray(s.figs) && s.figs.length ? s.figs : HB_FIGS_DEFAULT, full = cur.length >= HB_FIGS_MAX;
  const rows = HB_FIGS.filter(f => !f.money || money).map(f => { const on = cur.includes(f.k), dead = !on && full;
    return `<label class="hb-fp-row${dead ? ' is-dead' : ''}"${dead ? ` title="${_hbE(i18t('hb_figs_full'))}"` : ''}><input type="checkbox" data-hb-figkey="${f.k}"${on ? ' checked' : ''}${dead ? ' disabled' : ''}><span>${_hbE(i18t(f.word))}</span></label>`; }).join('');
  return `<div class="hb-figpick" role="dialog" aria-label="${_hbE(i18t('hb_figs_pick'))}"><div class="hb-dp-head">${_hbE(i18t('hb_figs_head', { n: HB_FIGS_MAX }))}</div>${rows}</div>`;
}
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
/* a contract's view on the Board (stage 4, see hbCvNow); declared here because
   hbSave reads it */
let _hbCv = { v: 'book', id: null };
function hbFresh(){
  return { face: 'board', lens: 'all', panels: [], path: [], prep: 'open',
    watches: [], chartWatches: [], seen: null, saved: [], seq: 0, found: null, recipe: {}, digBig: false,
    ins: null, insKept: {}, insOff: {}, keptSent: '', why: {}, undo: [], undoSeq: 0, an: {}, sy: {}, refs: {}, myq: [], strips: [] };
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
    if (typeof v.insFold === 'boolean') s.insFold = v.insFold;
    /* the Needs you card folded to its head (ndFoldSet, js/views/counter.js) */
    if (typeof v.ndFold === 'boolean') s.ndFold = v.ndFold;
    if (Array.isArray(v.path)) s.path = v.path.filter(k => typeof k === 'string').slice(-HB_PATH_MAX);
    /* THE CONTRACTS BROUGHT UP, AS STRIPS (the overnight work order, step 8;
       js/views/boardstrip.js): one not kept belongs to the day it was brought
       up, a kept one stays until it is closed. A trail that ended on a
       contract's old card (a 'c:' key) comes back as that contract's strip. */
    if (Array.isArray(v.strips)) s.strips = v.strips.filter(x => x && typeof x.id === 'string' && x.id).slice(0, 12)
      .map(x => ({ id: x.id.slice(0, 80), page: ['ov', 'where', 'hist', 'details'].includes(x.page) ? x.page : 'ov', kept: !!x.kept,
        day: /^\d{4}-\d{2}-\d{2}$/.test(String(x.day || '')) ? x.day : '', at: String(x.at || '').slice(0, 8) }))
      .filter(x => x.kept || x.day === hbToday());
    /* the contract's page on the desk comes back with its strip (round 7) */
    if (typeof v.card === 'string' && s.strips.some(x => x.id === v.card)) s.card = v.card;
    { const ck = s.path.filter(k => /^c:/.test(k));
      if (ck.length){ const id = ck[ck.length - 1].slice(2);
        if (id && !s.strips.some(x => x.id === id)) s.strips.unshift({ id, page: 'ov', kept: false, day: hbToday(), at: '' });
        s.path = s.path.filter(k => !/^c:/.test(k)); } }
    if (Array.isArray(v.figs)) s.figs = v.figs.filter(k => HB_FIG_KEYS.includes(k)).filter((k, i, a) => a.indexOf(k) === i).slice(0, HB_FIGS_MAX);
    if (Array.isArray(v.watches)) s.watches = v.watches.filter(w => w && HB_FIG_KEYS.includes(w.k)
      && (w.dir === 'above' || w.dir === 'below') && isFinite(Number(w.n))).slice(0, HB_WATCH_MAX)
      .map(w => ({ k: w.k, dir: w.dir, n: Number(w.n) }));
    if (Array.isArray(v.chartWatches)) s.chartWatches = v.chartWatches.filter(w => w && typeof w.key === 'string' && /^(q|cd|ls):/.test(w.key)
      && (w.dir === 'above' || w.dir === 'below') && isFinite(Number(w.n))).slice(0, HB_WATCH_MAX)
      .map(w => ({ key: w.key.slice(0, 200), title: String(w.title || '').slice(0, 120), dir: w.dir, n: Number(w.n) }));
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
    s.recipeStart = {};
    if (v.recipeStart && typeof v.recipeStart === 'object') Object.entries(v.recipeStart).slice(-30).forEach(([k, r]) => { if (typeof k === 'string') s.recipeStart[k] = r && typeof r === 'object' ? hbCardClean(r) : null; });
    s.digBig = !!v.digBig;
    /* MY QUESTIONS (A4): a name and a view key, or a name and a recipe */
    if (Array.isArray(v.myq)) s.myq = v.myq.filter(q => q && typeof q.name === 'string' && (typeof q.key === 'string' || (q.recipe && typeof q.recipe === 'object'))).slice(-HB_MYQ_MAX)
      .map(q => q.key ? { name: q.name.slice(0, 60), key: q.key.slice(0, 300) } : { name: q.name.slice(0, 60), which: hbCardClean({ which: q.which }).which || { all: true }, recipe: hbCardClean(q.recipe || {}) });
    /* a card's reference lines (G5): the reader's own switches, by card */
    if (v.refs && typeof v.refs === 'object') Object.entries(v.refs).slice(-HB_REFS_KEEP).forEach(([k, r]) => {
      if (typeof k !== 'string' || !r || typeof r !== 'object') return;
      const t = Number(r.tgt); s.refs[k.slice(0, 300)] = { avg: !!r.avg, ly: !!r.ly, tgt: r.tgt != null && r.tgt !== '' && isFinite(t) ? t : null }; });
    /* Copilot's answers to "What could explain this?", kept per chart for the day */
    if (v.why && typeof v.why === 'object') Object.entries(v.why).slice(-12).forEach(([k, w]) => {
      if (typeof k === 'string' && w && typeof w.day === 'string' && typeof w.sig === 'string' && typeof w.text === 'string')
        s.why[k.slice(0, 300)] = { day: w.day.slice(0, 10), sig: w.sig.slice(0, 400), text: w.text.slice(0, 4000), dropped: Number(w.dropped) || 0, at: String(w.at || '').slice(0, 5), notice: String(w.notice || '').slice(0, 300) }; });
  }
  /* STORIES: the words Copilot wrote, with the numbers they were written over,
     and the story's Dig deeper run */
  if (v && v.sy && typeof v.sy === 'object') Object.entries(v.sy).slice(-HB_STORY_KEEP).forEach(([k, r]) => {
    if (!hbStoryValid(k) || !r || typeof r !== 'object') return;
    const txt = (x, n) => String(x == null ? '' : x).slice(0, n);
    const paras = {}; if (r.paras && typeof r.paras === 'object') Object.entries(r.paras).forEach(([c, t]) => { if (/^c\d$/.test(c) && typeof t === 'string') paras[c] = t.slice(0, 900); });
    s.sy[k] = { day: txt(r.day, 10), sig: txt(r.sig, 400), lead: txt(r.lead, 900), paras, dropped: Number(r.dropped) || 0, at: txt(r.at, 5), notice: txt(r.notice, 300),
      deeper: /^r[0-9a-z]{1,20}$/.test(String(r.deeper || '')) ? r.deeper : undefined };
  });
  /* the analyst's runs (Dig deeper), kept for a refresh; one cut short by
     the refresh says so. A story's own run is kept while its story is. */
  const held = new Set(Object.values(s.sy).map(r => r && r.deeper).filter(Boolean));
  if (v && v.an && typeof v.an === 'object') Object.entries(v.an).filter(([k], i, all) => held.has(k) || all.filter(([x]) => !held.has(x)).slice(-HB_DD_KEEP).some(([x]) => x === k)).forEach(([k, r]) => {
    if (!/^r[0-9a-z]{1,20}$/.test(k) || !r || typeof r !== 'object' || !Array.isArray(r.steps)) return;
    const txt = (x, n) => String(x == null ? '' : x).slice(0, n);
    const story = hbStoryValid(r.story) ? r.story : null;
    const run = { id: k, q: txt(r.q, 400), state: ['done', 'empty', 'err', 'stopped'].includes(r.state) ? r.state : 'err', summary: txt(r.summary, 1500), dropped: Number(r.dropped) || 0,
      err: r.state === 'busy' ? i18t('hb_dd_stopped') : txt(r.err, 300), notice: txt(r.notice, 300), at: txt(r.at, 5), added: !!r.added,
      cards: Array.isArray(r.cards) ? r.cards.slice(0, 3).filter(c => c && typeof c === 'object').map(c => ({ which: hbCardClean({ which: c.which }).which || { all: true }, recipe: hbCardClean(c.recipe || {}), title: txt(c.title, HB_TITLE_MAX) })) : [],
      next: Array.isArray(r.next) ? r.next.filter(x => typeof x === 'string').slice(0, 3).map(x => x.slice(0, 120)) : [],
      /* a card's own run (Dig deeper on a card) stays on that card */
      ...(typeof r.on === 'string' && r.on ? { on: txt(r.on, 400), sig: txt(r.sig, 400) } : {}),
      steps: r.steps.slice(0, story ? HB_STORY_STEPS : HB_DD_STEPS).filter(x => x && typeof x === 'object').map(x => ({ name: x.name === 'pack' ? 'pack' : 'calculate', why: txt(x.why, 200), title: txt(x.title, 160),
        input: x.input && typeof x.input === 'object' ? { which: hbCardClean({ which: x.input.which }).which || { all: true }, recipe: hbCardClean(x.input.recipe || {}) } : null,
        lines: Array.isArray(x.lines) ? x.lines.filter(l => typeof l === 'string').slice(0, 4).map(l => _hbE(hbFactPlain(l).slice(0, 600))) : [],   /* read back as words, never as markup */
        ids: Array.isArray(x.ids) ? x.ids.filter(i => typeof i === 'string').slice(0, HB_DD_IDS_MAX) : [], n: Number(x.n) || 0, dig: /^pk:\w+$/.test(String(x.dig || '')) ? x.dig : '' })) };
    if (story){ run.story = story; run.max = HB_STORY_STEPS;
      const n = run.steps.length, st = x => { const k = Number(x); return Number.isInteger(k) && k >= 1 && k <= n ? k : null; };
      run.chapters = Array.isArray(r.chapters) ? r.chapters.filter(c => c && st(c.step)).slice(0, 6).map(c => ({ step: st(c.step), title: txt(c.title, HB_TITLE_MAX), text: txt(c.text, 700), recipe: hbStoryPicOf(c.recipe) })) : [];
      run.watch = Array.isArray(r.watch) ? r.watch.filter(w => w && typeof w.text === 'string').slice(0, 4).map(w => ({ text: txt(w.text, 300), step: st(w.step) })) : [];
      run.aside = Array.isArray(r.aside) ? r.aside.filter(a => a && typeof a.idea === 'string').slice(0, 4).map(a => ({ idea: txt(a.idea, 160), why: txt(a.why, 300) })) : []; }
    s.an[k] = run; });
  if (v && Array.isArray(v.undo)) s.undo = v.undo.filter(u => u && Number(u.n) > 0 && typeof u.shape === 'string' && u.shape.length < 400000).slice(-HB_UNDO_MAX).map(u => ({ n: Number(u.n), shape: u.shape }));
  if (v && Number(v.undoSeq) > 0) s.undoSeq = Number(v.undoSeq);
  _hbS = s; _hbSUid = uid; _hbShape = hbShapeOf(s);
  return s;
}
function hbSave(){
  const s = hbS();
  /* SOMETHING NEW PUT ON THE BOOK SHOWS ON THE BOOK (stage 4): a card, an
     answer or a dig changes the board's shape, and a contract's view steps
     aside so it is not drawn behind the view */
  if (_hbCv.v !== 'book' && _hbShape != null && hbShapeOf(s) !== _hbShape) _hbCv = { v: 'book', id: _hbCv.id };
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
    const h = (typeof fxCounted === 'function') ? fxCounted(c) : { v: Number(c.value || 0), missing: false };   // a private stream adds nothing
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
  const ending = agreements.filter(c => c.status === 'Signed')   /* signed only (owner, 16 Oct 2026), as hmDashSlices */
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
      drafting: hbStageFig(stages, 'Draft'),
      review:   hbStageFig(stages, 'Under Review'),
      signed:   hbStageFig(stages, 'Signed'),
      ...hbPayFigs(),
    },
    stages };
}
/* the three payment-terms figures, read from payTermsData (whole book): a
   side with no terms on file has NO figure (none), never 0 */
function hbPayFigs(){
  let P = null; try { P = (typeof payTermsData === 'function') ? payTermsData() : null; } catch (_){ P = null; }
  const side = S => ({ n: S && S.avgDays != null ? S.avgDays : 0, none: !(S && S.avgDays != null), ids: S ? S.rows.map(r => r.id) : [], basis: S ? S.basis : null });
  const cu = side(P && P.customer), su = side(P && P.supplier);
  const gap = P && P.gap != null ? P.gap : null;
  /* paid in before we pay out is good: the customers' days below the suppliers' */
  return { wewait: cu, wepay: su,
    paygap: { n: gap == null ? 0 : Math.abs(gap), none: gap == null, gap, ids: cu.ids.concat(su.ids), tone: gap == null || gap === 0 ? '' : gap < 0 ? 'good' : 'bad' } };
}
/* A CARD THAT SPLITS PAYMENT TERMS BY SIDE carries the three figures above
   its picture (owner picked "the ready question splits by side", 11 Oct
   2026): the same readings as Your book's tiles (hbPayFigs), each a door */
function hbPayKpiHtml(P){
  const by = [P && P.split && P.split.by, P && P.split2 && P.split2.by];
  if (!(by.includes('side') && by.includes('payterms'))) return '';
  const F = hbPayFigs();
  const one = (k, word) => { const f = F[k]; const n = f.none ? '—' : i18tn('hb_f_days', f.n, { n: _hbN(f.n) });
    const tone = k === 'paygap' && f.tone ? ' is-' + f.tone : '';
    return `<button type="button" class="hb-payk-i${tone}" ${f.none ? 'disabled' : `data-hb-dig="f:${k}"`} title="${_hbE(i18t(k === 'paygap' && f.gap != null ? (f.gap < 0 ? 'hb_f_paygap_good' : f.gap > 0 ? 'hb_f_paygap_bad' : 'hb_f_paygap_tip') : 'hb_f_' + k + '_tip'))}"><span class="hb-payk-l">${_hbE(i18t(word))}</span><span class="hb-payk-n">${_hbE(n)}</span></button>`; };
  return `<div class="hb-payk">${one('wewait', 'hb_f_wewait')}${one('wepay', 'hb_f_wepay')}${one('paygap', 'hb_f_paygap')}</div>`;
}
function hbStageFig(stages, k){ const st = (stages || []).find(x => x.k === k); return { n: st ? st.n : 0, ids: st ? st.ids.slice() : [] }; }
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
  hbHistTick(seen, now);
  s.seen = seen; hbSave();
  return seen.base;
}
/* ---- THE FIGURES' OWN HISTORY: A TREND LINE UNDER EACH (the new board
   design, 11 Oct 2026, owner's "Build now" over the "HaTi Board" artifact).
   A figure's past cannot be read back off the record (a stage, a duty's
   state, whose move it is are today's facts only), so NOTHING IS GUESSED:
   each day Home is painted, the six numbers it showed are kept in this
   person's own browser record of what they looked at (one row a day, the
   last of the day wins, at most HB_HIST_DAYS rows). The line draws only the
   days that were seen, and only once HB_HIST_MIN days are kept; before
   that the tile carries no line at all. */
const HB_HIST_DAYS = 60, HB_HIST_MIN = 3;
function hbHistTick(seen, now){
  const row = { at: now.at, n: {} };
  HB_FIG_KEYS.forEach(k => { row.n[k] = Number(now.figs[k] && now.figs[k].n) || 0; });
  const h = Array.isArray(seen.hist) ? seen.hist.filter(r => r && typeof r.at === 'string' && r.n && typeof r.n === 'object' && r.at !== now.at) : [];
  h.push(row);
  h.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
  seen.hist = h.slice(-HB_HIST_DAYS);
}
function hbHistOf(k){
  const s = hbS(), h = s.seen && Array.isArray(s.seen.hist) ? s.seen.hist : [];
  return h.filter(r => r && r.n && isFinite(Number(r.n[k]))).map(r => ({ at: r.at, v: Number(r.n[k]) }));
}
/* A FIGURE'S LAST SIX MONTHS, FROM THE CONTRACTS' OWN DATES (owner's go,
   11 Oct 2026; reverses "a line only from days actually seen"): each month-end
   is counted with today's rules over what the record dates — started on or
   before it, its end date, its duties' due and done dates. Nothing is
   guessed: a figure the record cannot date (waiting on us) draws no line.
   The last point is the figure on the tile, exactly. */
/* EVERY FIGURE HAS ITS LINE (owner, 11 Oct 2026: "the cards all need to have
   trend lines"): each is counted at each month-end from dates the record
   holds — a stage from its signing date and its first change on the table, a
   contract waiting on us from who filed the last change before that day,
   payment days from the contracts that had started by then */
const HB_SPARK_MONTHS = 6, HB_SPARK_DATED = ['live', 'value', 'ending', 'past', 'overdue', 'us', 'drafting', 'review', 'signed', 'wewait', 'wepay', 'paygap'];
function hbMonthsAgo(n){ const t = new Date(hbToday() + 'T00:00:00'); const d = new Date(t.getFullYear(), t.getMonth() - n, 1); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(t.getDate(), last)); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const _hbSeriesMemo = new Map();
function hbFigSeries(k, d){
  if (!HB_SPARK_DATED.includes(k)) return [];
  const cs = hbBook('all'), sig = hbToday() + '|' + cs.length + '|' + hbFigNumber(d, k);
  const mk = k + '|' + sig; if (_hbSeriesMemo.has(mk)) return _hbSeriesMemo.get(mk);
  const day = v => { const x = String(v || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : null; };
  const born = c => day(hbStartOf(c)) || day(c.createdAt);
  const endOf = c => day((typeof effectiveExpiry === 'function') ? effectiveExpiry(c) : null) || day(c.metadata && c.metadata.expiryDate) || day(c.expiry);
  const live = cs.filter(c => c.status !== 'Declined');
  const agr = ((typeof agreementsIn === 'function') ? agreementsIn(cs) : cs).filter(c => c.status !== 'Declined');
  const ids = new Set(cs.map(c => c.id));
  const obs = (typeof allObligations === 'function' ? (allObligations() || []) : []).filter(o => o && ids.has(o.cid));
  const plus90 = iso => { const t = new Date(iso + 'T00:00:00'); t.setDate(t.getDate() + 90); return t.toISOString().slice(0, 10); };
  const at = iso => {
    const lv = live.filter(c => { const b = born(c); return !b || b <= iso; });
    if (k === 'live') return lv.length;
    if (k === 'value') return lv.reduce((a, c) => a + hbValueOfOne(c), 0);
    if (k === 'ending'){ const hi = plus90(iso); return agr.filter(c => { const e = endOf(c), b = born(c); return e && e >= iso && e <= hi && (!b || b <= iso); }).length; }
    if (k === 'past') return agr.filter(c => { const e = endOf(c); return c.status === 'Signed' && e && e < iso; }).length;
    const signedOn = c => c.status === 'Signed' ? (day(c.signedAt) || born(c) || '0000-01-01') : null;
    const signedBy = c => { const sd = signedOn(c); return !!sd && sd <= iso; };
    const firstMove = c => { const xs = (Array.isArray(c.changes) ? c.changes : []).map(x => day(x && x.createdAt)).filter(Boolean).sort(); return xs[0] || null; };
    const inReviewBy = c => { const f = firstMove(c); return f ? f <= iso : (c.status === 'Under Review' || c.status === 'Signed'); };
    if (k === 'signed') return lv.filter(signedBy).length;
    if (k === 'review') return lv.filter(c => !signedBy(c) && inReviewBy(c)).length;
    if (k === 'drafting') return lv.filter(c => !signedBy(c) && !inReviewBy(c)).length;
    if (k === 'us') return lv.filter(c => { if (signedBy(c)) return false;
      const last = (Array.isArray(c.changes) ? c.changes : []).filter(x => x && day(x.createdAt) && day(x.createdAt) <= iso).sort((a, b) => String(a.createdAt) < String(b.createdAt) ? -1 : 1).pop();
      return !!last && last.authorSide === 'counterparty'; }).length;
    if (k === 'wewait' || k === 'wepay' || k === 'paygap') return hbPayAt(iso, born);
    if (k === 'overdue') return obs.filter(o => { const due = day((typeof obligationDue === 'function') ? obligationDue(o) : o.due); if (!due || due >= iso) return false;
      const done = day(o.completedAt); const st = (typeof obState === 'function') ? obState(o) : o.status; return st !== 'done' || (done && done > iso); }).length;
    return 0; };
  /* the payment figures at a past day: the same rows payTermsData reads, only
     the contracts started by then, averaged on the same basis */
  let PT = null;
  const hbPayAt = (iso, born) => {
    if (!PT){ try { PT = typeof payTermsData === 'function' ? payTermsData() : null; } catch (_){ PT = null; } }
    if (!PT) return null;
    const byId = new Map(cs.map(c => [c.id, c]));
    const avg = S => { const rows = (S && S.rows || []).filter(r => { const c = byId.get(r.id), b = c ? born(c) : null; return !b || b <= iso; });
      if (!rows.length) return null;
      if (S.basis === 'value'){ const w = rows.reduce((a, r) => a + r.value, 0); if (w > 0) return Math.round(rows.reduce((a, r) => a + r.days * r.value, 0) / w); }
      return Math.round(rows.reduce((a, r) => a + r.days, 0) / rows.length); };
    const cu = avg(PT.customer), su = avg(PT.supplier);
    if (k === 'wewait') return cu;
    if (k === 'wepay') return su;
    return cu != null && su != null ? Math.abs(cu - su) : null;
  };
  const out = [];
  for (let m = HB_SPARK_MONTHS; m >= 1; m--){ const iso = hbMonthsAgo(m); const v = at(iso); if (v != null) out.push({ at: iso, v }); }
  /* a figure with no reading today (no payment terms on that side) draws no line */
  if (d.figs[k] && d.figs[k].none){ _hbSeriesMemo.clear(); return []; }
  out.push({ at: hbToday(), v: hbFigNumber(d, k) });
  _hbSeriesMemo.clear(); _hbSeriesMemo.set(mk, out);
  return out;
}
/* "+58 · vs 6 months ago": the tile's number against the first point of its line */
/* THE TABLE'S CHANGE (bare) says the value's change as money, "+KES 16M",
   as round 17 draws it; `tail` is words that ride the number ("to decide") */
function hbVsHtml(k, d, tone, bare, tail){
  const h = hbFigSeries(k, d); if (h.length < 2) return '';
  const was = h[0].v, now = h[h.length - 1].v, dlt = now - was;
  const amt = k === 'value' ? ((was > 0 && !bare) ? (dlt >= 0 ? '+' : '−') + (Math.abs(dlt) / was * 100).toFixed(1).replace(/\.0$/, '') + '%' : (dlt >= 0 ? '+' : '−') + _hbM(Math.abs(dlt))) : (dlt > 0 ? '+' : dlt < 0 ? '−' : '') + _hbN(Math.abs(dlt));
  const good = tone === 'bad' || tone === 'warn' ? dlt < 0 : dlt > 0;
  const cls = !dlt ? '' : tail ? ' is-warn' : good ? ' is-good' : (tone === 'bad' ? ' is-bad' : ' is-warn');
  return `<span class="hb-vs"><b class="hb-vs-n${cls}">${_hbE((dlt ? amt : i18t('hb_vs_same')) + (dlt && tail ? ' ' + tail : ''))}</b>${bare ? '' : ' · ' + _hbE(i18t('hb_vs_6m'))}</span>`;
}
function hbSparkHtml(k, fmt, book){
  const h = book ? hbFigSeries(k, book) : hbHistOf(k);
  if (h.length < HB_HIST_MIN) return '';
  const w = 120, ht = 26, vs = h.map(r => r.v), mn = Math.min(...vs), mx = Math.max(...vs), r = (mx - mn) || 1;
  const pts = vs.map((v, i) => [3 + i * (w - 6) / (vs.length - 1), mx === mn ? ht / 2 : ht - 4 - (v - mn) / r * (ht - 8)]);
  const d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' ');
  const e = pts[pts.length - 1];
  const tip = book ? i18t('hb_spark_tip6', { from: fmt(vs[0]), to: fmt(vs[vs.length - 1]), when: hbDayWords(h[0].at) })
    : i18t('hb_spark_tip', { n: h.length, from: fmt(vs[0]), to: fmt(vs[vs.length - 1]), when: hbDayWords(h[0].at) });
  return `<svg class="hb-spark" viewBox="0 0 ${w} ${ht}" preserveAspectRatio="none" role="img" aria-label="${_hbE(tip)}"><title>${_hbE(tip)}</title>`
    /* a plain line and a dot at its end (round 17 as drawn): the dot is a
       round cap on a point, so the stretched picture keeps it round */
    + `<path d="${d}" class="hb-spark-l"/><path d="M${e[0].toFixed(1)} ${e[1].toFixed(1)}h0" class="hb-spark-e"/></svg>`;
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
  /* APPROVALS ARE NOT ON THE BOARD (the nine flow rules' rule 6, Young 8 Oct
     2026): work you owe lives in your checklist, the bell and the phone, which
     open the contract on the Paper with the pack. The board keeps Copilot's
     prepared work only. */
  const onBoard = k => !HB_OFF_BOARD.includes(k);
  const rows = keys.filter(k => onBoard(k) && D.agents[k] && D.agents[k].ready.length).map(k => {
    const a = D.agents[k], it = a.ready[0], p = parts(it);
    /* the pill counts what the list behind it shows: the week is ONE card
       of eight dates, and its pill said 1 beside "8 dates" (15 Oct 2026) */
    const pill = a.ready.reduce((s, x) => s + (x && x.kind === 'week' && Number(x.n) > 0 ? Number(x.n) : 1), 0);
    return { k, n: a.ready.length, pill, who: p.who || '', sum: p.sum || '', urg: p.urg || '', tone: it.tone || '',
      icon: ((window.AG_DEF && AG_DEF[k]) || {}).icon || 'spark',
      items: a.ready.map(x => { const q = parts(x); return { key: x.key, cid: (x.c && x.c.id) || null, who: q.who || '', sum: q.sum || '', urg: q.urg || '', tone: x.tone || '' }; }) };
  });
  const since = sinceIso ? String(sinceIso) : null;
  const done = since ? keys.filter(onBoard).map(k => {
    const a = D.agents[k]; if (!a) return null;
    const items = a.done.filter(x => String(x.at || '').slice(0, 10) >= since);
    return items.length ? { k, n: items.length, items: items.map(x => { const q = parts(x); return { cid: (x.c && x.c.id) || null, who: q.who || '', sum: q.sum || '', at: x.at || '' }; }) } : null;
  }).filter(Boolean) : [];
  const ready = rows.reduce((s, r) => s + r.pill, 0);   /* the same count the pills show */
  return { ready, rows, done };
}
/* "Our promises" left the Board too (owner, 16 Oct 2026): the bell and the
   Obligations overdue figure already tell you what your side owes; the agent
   still runs and still sends its reminders, on the agents page */
const HB_OFF_BOARD = ['approve', 'ours'];

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
      .map(o => ({ cid: o.cid, what: o.desc || '', who: o.assignee || '', cp: o.counterparty || '', late: -o.days, theirs: !!(typeof obligationIsTheirs === 'function' && obligationIsTheirs(o)) }));
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
/* the reference DRAWN on the board wears the reference face (refHtml) */
const _hbRefH = c => (typeof refHtml === 'function') ? refHtml(c && typeof c === 'object' ? hbRef(c) : c) : _hbE(c && typeof c === 'object' ? hbRef(c) : c);
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
  /* A STORY: the story, its chapters, its lists, its deeper chapters */
  if (k === 'sy'){ const dot = a.indexOf('.'); return hbStoryDig(dot < 0 ? a : a.slice(0, dot), dot < 0 ? '' : a.slice(dot + 1), lens); }
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
    const SF = HB_FIGS.find(f => f.k === a);
    if (SF && SF.days) return { key, kind: 'list', crumb: i18t(SF.word), title: i18t(SF.word), ids: F.ids, n: F.ids.length,
      chart: a === 'paygap' ? { mode: 'groups', by: 'side' } : { mode: 'groups', by: 'payterms' }, fixed: ['side'] };
    if (SF && SF.stage) return { key, kind: 'list', word: 'hb_f_' + a, fig: a, ids: F.ids, n: F.n, chart: { mode: 'groups', by: 'counterparty' }, fixed: ['status'], stage: SF.stage };
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
  /* A PIECE OF ONE OF THE NEW PICTURES (G8): the card's key, then the picture
     and the piece, read from the END; the list is worked out by the same
     reading that drew it, so the number on the piece is the list behind it */
  if (k === 'qx'){
    const parts = a.split(HB_KEY_SEP); if (parts.length < 3) return null;
    const [pic, part] = parts.slice(-2), pk = parts.slice(0, -2).join(HB_KEY_SEP);
    const P = hbDigData(pk, lens); if (!P || P.kind !== 'list') return null;
    const Pp = hbPlan(P), cs0 = hbListOf(P.ids, lens);
    const X = hbExtraSets(pic, Pp, cs0);
    const piece = X && X.parts.find(x => String(x.k) === part); if (!piece) return null;
    const ids = piece.list.map(c => c.id), name = piece.word;
    const fixed = (P.fixed || []).concat(pic === 'sp' && Pp.split ? [Pp.split.by] : []);
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
    /* "The agents" (as drawn): every agent on the Board, what it does, when it runs, what it has ready */
    if (!a){ const H = hbAgentsData(null); const keys = (Array.isArray(window.AG_KEYS) ? AG_KEYS : []).filter(x => !HB_OFF_BOARD.includes(x));
      return { key, kind: 'agents', crumb: i18t('hb_the_agents'), rows: keys.map(x => { const r = H.rows.find(y => y.k === x); return { k: x, n: r ? r.n : 0 }; }), n: keys.length }; }
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
    return { what: o.desc || '', who: o.assignee || '', due, state: st, theirs: !!(typeof obligationIsTheirs === 'function' && obligationIsTheirs(o)) };
  }).filter(o => o.state !== 'done');
  let blockers = [];
  try { blockers = (typeof signBlockers === 'function' && c.status !== 'Signed') ? (signBlockers(c) || []).map(b => String(b.say || b.text || b.msg || b.why || b.kind || '')).filter(Boolean).slice(0, 4) : []; } catch (_){ blockers = []; }
  const audit = Array.isArray(c.audit) ? c.audit.slice(-4).reverse().map(a => ({ at: a.at || a.date || a.ts || '', what: a.action || '', who: a.user || '' })) : null;
  const brief = (c._brief && typeof triageBriefLine === 'function') ? (triageBriefLine(c._brief) || null) : null;
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
  boardSum:  /\b(summari[sz]e|summary|sum up|in brief|brief me|sammanfatta|sammanfattning)\b/i,
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
    drafting: /^(?:the )?(?:contracts )?in drafting$|^under utkast$/i,
    review:   /^(?:the )?(?:contracts )?in review$|^under granskning$/i,
    signed:   /^(?:the )?executed contracts$|^undertecknade avtal$/i,
    wewait:   /how long (?:do )?we wait|days to be paid|how long (?:do )?customers take to pay|hur länge väntar vi/i,
    wepay:    /how long (?:do )?we take to pay|how (?:fast|quickly) do we pay|hur snabbt betalar vi/i,
    paygap:   /payment gap|cash gap|betalningsgap/i,
  },
};
/* Which contract a question names: its reference anywhere in the words, or
   — after "bring up", "open", "show me" — its name or its counterparty when
   exactly one contract answers. Two candidates are not a guess: null. */
function hbFindContract(q){
  if (typeof caRefFix === 'function') q = caRefFix(q);
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
    /* "show me Amani Foods by month" is a chart of their contracts (A2) */
    if (hbRecipeRead(w)) return null;
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
/* A CONTRACT NUMBER ON ITS OWN OPENS IT ON HOME (owner, 15 Oct 2026): "mk 450",
   "MK-450", "mk450", "contract 450" — the number alone and nothing else. On
   the Board "show me / open / bring up MK-…" keep their contract card (the
   strip, hbOpenOne / hbBringOf); on the paper "open MK-…" is that paper
   (caPlaceOf); a question that names a contract stays a question about it. */
const HB_OPEN_REF_LEAD = /^\s*(?:the\s+)?(?:contract\s+|agreement\s+|avtalet\s+)?#?/i;
function hbOpenRef(qRaw){
  const q = (typeof caRefFix === 'function') ? caRefFix(String(qRaw || '').trim()) : String(qRaw || '').trim();
  const rest = q.replace(HB_OPEN_REF_LEAD, '').replace(/[?.!\s]+$/, '');
  if (!rest || /\s/.test(rest)) return null;
  const cs = (state.contracts || []).filter(c => c && !c.archived);
  return cs.find(x => hbRef(x).toUpperCase() === rest.toUpperCase() || String(x.id).toUpperCase() === rest.toUpperCase()) || null;
}
/* the words left once the board is named: "put juno llc on the board" → "juno llc"; lead words only → nothing */
const HB_BOARD_WORDS_RE = /\b(?:on|onto|to|in|på|till|i)?\s*(?:the\s+)?(?:board|dashboard|tavlan)\b/gi;
const HB_BOARD_LEAD_RE = /^(?:show|show me|put|take me|go|back|open|visa|ta mig|gå|tillbaka|me|us|please|snälla)(?:\s+(?:show|me|us|please|snälla|to|back))*$/i;
function hbBoardRest(q){
  const rest = String(q || '').replace(HB_BOARD_WORDS_RE, ' ').replace(/\s+/g, ' ').trim().replace(/[,.!?]+$/, '').trim();
  if (!rest || HB_BOARD_LEAD_RE.test(rest)) return '';
  return rest;
}
function hbParse(qRaw){
  const q = (typeof caRefFix === 'function') ? caRefFix(String(qRaw || '').trim()) : String(qRaw || '').trim(); if (!q) return null;
  const s = q.toLowerCase();
  const one = hbOpenRef(q); if (one) return { act: 'openc', id: one.id };
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
  /* "Summarise my board" typed is the button pressed (it answered "Back to the board.") */
  if (HB_RX.boardSum.test(s) && HB_RX.board.test(s) && s.length < 60) return { act: 'boardsum' };
  /* "SHOW ME JUNO LLC ON THE BOARD" IS JUNO LLC, ON THE BOARD (owner, 24 Oct 2026: the Board's words only turned
     the face): the board words are taken off and what is left is read as its own ask; the act carries `toBoard`,
     so hbAsk turns to the Board first wherever the words were typed. Bare "board" still turns the face. */
  if (HB_RX.board.test(s)){
    const rest = hbBoardRest(q);
    if (rest){ const r2 = hbParse(rest); if (r2 && r2.act !== 'face' && r2.act !== 'noref') return Object.assign({ toBoard: true }, r2); }
    if (s.length < 40) return { act: 'face', face: 'board' };
  }
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
        if (c0.field === 'overdue') return { act: 'dig', key: 'f:overdue' };
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
  /* ONE LIST OF LATE DUTIES (owner, 16 Oct 2026): asking for them opens the
     Obligations overdue figure's own list, never a second panel of the same */
  if (kind === 'obl' && !HB_RX.remove.test(s) && !sup && !cus) return { act: 'dig', key: 'f:overdue' };
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
   Dark | Light. NO "+ DRAFT NEW AGREEMENT" HERE (the overnight work order,
   step 3; owner, 14 Oct 2026): drafting is Jambo's — the chip "draft a new
   agreement", a sentence, and the one form behind his card. Other pages keep
   their own draft door. */
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
  /* the Calendar tab carries the count its menu door carried — the same
     reading (navCounts' 'calendar'), painted by the same beat */
  /* THE SLIDING PILL (owner picked it by name, 11 Oct 2026): one track, five
     buttons of ONE width, a white pill that slides to the chosen face. The
     width is the widest label in EVERY language — each button stacks all its
     languages' words in one cell (hbFaceWordsHtml) and the grid's equal
     columns take the widest — so switching language moves nothing. */
  const face = f => `<button type="button" role="tab" data-hb-face="${f}" aria-selected="${s.face === f}">${(typeof icon === 'function') ? icon(HB_FACE_ICON[f], 'hb-face-ic', 2) : ''}${hbFaceWordsHtml(f)}${f === 'calendar' ? (() => { const n = (typeof window.calendarDoorCount === 'function') ? calendarDoorCount() : 0;
    return `<span class="hb-face-n" data-count="calendar" data-count-quiet-zero${n ? ' data-tone="amber"' : ''}>${n ? n : ''}</span>`; })() : ''}</button>`;
  /* ---- NO ROW ABOVE THE PAGE ON A COMPUTER (the owner picked "The SAP
     way", 18 Oct 2026; reverses "Desk tabs") ---- the top bar names the page
     and opens Recent (js/views/counter.js), so on a computer this head is
     drawn empty and hidden: Present is Recent's last row, the Board's Light |
     Dark and its counting chip stand on the Board's own first line, and
     Explorer's Group by rides the map's top-right corner (renderIntel). The
     paper starts right under the bar. The phone keeps its own Home. */
  const desk = typeof window.deskShellOn === 'function' && window.deskShellOn();
  return `<style>#page-head{background:var(--color-surface)}</style>
  <header id="hb-head" class="hb-head"${desk ? ' hidden' : ''}>
    ${desk ? '' : `<div class="hb-hello">${hbHelloInner()}</div>
    <div class="hb-seg hb-faces" role="tablist" aria-label="${_hbE(i18t('hb_show'))}" style="--hb-fi:${Math.max(0, HB_FACES.indexOf(s.face))};--hb-fn:${HB_FACES.length}"><span class="hb-thumb" aria-hidden="true"></span>${HB_FACES.map(face).join('')}</div>`}
    <span class="hb-grow"></span>
    ${desk ? '' : `<label class="hb-groupby" id="hb-groupby"${s.face === 'explorer' ? '' : ' hidden'}>${_hbE(i18t('hb_group_by'))} ${groupSel || ''}</label>
    <span class="hb-counting">${hbCountChipHtml()}</span>
    <button type="button" class="ui-btn ui-btn-sm" id="hb-present" title="${_hbE(i18t('hb_present_tip'))}">${_hbE(i18t('hb_present'))}</button>`}
  </header>`;
}
/* A face's word in the reader's language, with every other language's word
   reserving its width unseen, so the button is as wide as the widest. */
function hbFaceWordsHtml(f){
  const key = 'hb_face_' + f, now = i18t(key);
  const all = (typeof LANGUAGES !== 'undefined' && typeof STRINGS !== 'undefined')
    ? LANGUAGES.map(l => (STRINGS[l.id] || {})[key]).filter(Boolean) : [];
  const others = [...new Set(all)].filter(w => w !== now);
  /* the other words reserve the width from CSS (attr() into ::before/::after),
     so the button's own text stays its one word */
  return `<span class="hb-face-w"${others[0] ? ` data-w1="${_hbE(others[0])}"` : ''}${others[1] ? ` data-w2="${_hbE(others[1])}"` : ''}><span>${_hbE(now)}</span></span>`;
}

/* ---- YOUR BOOK: six figures and the stage bar ----
   EVERY FIGURE IS A DOOR AND A ZERO IS NOT ONE (Home's own rule since 20 Aug
   2026). The change since the baseline rides its own small chip, a door onto
   exactly the contracts that moved. */
/* "Thu" within the week just gone, "3 Oct" before it: the tile's chip says WHEN */
function hbSinceDay(iso){
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00'), days = Math.round((new Date(hbToday() + 'T00:00:00') - d) / 864e5);
    const loc = (typeof langLocale === 'function') ? langLocale() : undefined;
    return days >= 0 && days < 7 ? d.toLocaleDateString(loc, { weekday: 'short' }) : d.toLocaleDateString(loc, { day: 'numeric', month: 'short' });
  } catch (_){ return String(iso); }
}
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
  const txt = (M.d ? (up ? '▲ ' : '▼ ') + amt : '↔') + ' ' + i18t('hb_d_since', { day: hbSinceDay(since) });
  return `<button type="button" class="hb-fd${cls}" data-hb-dig="mv:${k}" title="${_hbE(i18t(M.d ? (up ? 'hb_d_up_tip' : 'hb_d_down_tip') : 'hb_d_swap_tip', { n: amt, when }))}">${_hbE(txt)}</button>`;
}
/* WHAT THE VALUE LEAVES OUT IS SAID ON THE TILE (the Board walk-through,
   15 Oct 2026): it lived only in a hover tip, which an iPad never shows. The
   currencies are named, read off the very contracts left out. */
/* OURS AND THEIRS ON THE OVERDUE FIGURE (owner, 16 Oct 2026): the figure counts
   both sides; the bell says ours and "Late promises" theirs, so the figure says
   how its number splits and the three add up */
/* WHAT THE VALUE COUNTS, SAID UNDER IT (round 17 as drawn: "in SEK · EUR at
   11.40 · 1 in NOK left out, no rate · pay and Project Falcon not added"): the
   workspace currency, the rate each converted contract was counted at (the
   admin's dated claim, fxHome's own), what was left out for want of a rate
   (fxCounted's missing — never guessed), and what adds nothing: pay
   (fxIsPay), a private stream's contracts (named by their stream) and a deal
   the reader sees only by its code name. A reading of fxCounted; nothing is
   converted or guessed here. */
function hbValueSay(ids){
  if (typeof fxCounted !== 'function' || typeof fxHomeCode !== 'function') return '';
  const rates = new Map(), left = new Map(), off = [];
  let pay = false;
  (ids || []).forEach(id => {
    const c = hbContract(id); if (!c) return;
    if (c._codeNamed){ const n = String(c.name || '').trim(); if (n && !off.includes(n)) off.push(n); return; }
    let h = null; try { h = fxCounted(c); } catch (_){ h = null; } if (!h) return;
    if (h.pay){ pay = true; return; }
    if (h.private){ const n = String((((typeof FOLDERS === 'object' && FOLDERS) || {})[c.folder] || {}).name || '').trim(); if (n && !off.includes(n)) off.push(n); return; }
    if (h.missing){ left.set(h.code, (left.get(h.code) || 0) + 1); return; }
    if (h.converted && h.rate) rates.set(h.code, h.rate);
  });
  let fmt = r => String(r); try { const loc = (typeof jxLocale === 'function') ? jxLocale() : undefined; fmt = r => Number(r).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 4 }); } catch (_){}
  const out = [i18t('hb_val_in', { code: fxHomeCode() })];
  [...rates.keys()].sort().forEach(k => out.push(i18t('hb_val_rate', { code: k, rate: fmt(rates.get(k)) })));
  const nLeft = [...left.values()].reduce((a, v) => a + v, 0);
  if (nLeft) out.push(i18tn('hb_val_left', nLeft, { n: _hbN(nLeft), codes: [...left.keys()].sort().join(', ') }));
  const not = (pay ? [i18t('hb_val_pay')] : []).concat(off);
  if (not.length) out.push(i18t('hb_val_not_added', { what: not.length > 1 ? not.slice(0, -1).join(', ') + ' ' + i18t('hb_val_and') + ' ' + not[not.length - 1] : not[0] }));
  return out.join(' · ');
}
/* HOW MANY OF THOSE ENDING HAVE A DECISION FILED (round 17 as drawn): the
   renewal window's own reading (renewalWindow(c).decided), counted; null
   where that reading is not loaded */
function hbEndingDecided(ids){
  if (typeof renewalWindow !== 'function') return null;
  return (ids || []).filter(id => { const c = hbContract(id); if (!c) return false;
    try { const w = renewalWindow(c); return !!(w && w.decided); } catch (_){ return false; } }).length;
}
function hbOverdueSplitSay(rows){
  const theirs = (rows || []).filter(o => typeof obligationIsTheirs === 'function' && obligationIsTheirs(o)).length;
  return i18t('hb_f_overdue_split', { ours: _hbN((rows || []).length - theirs), theirs: _hbN(theirs) });
}
/* ---- THEN AND NOW (round 17 of the redesign: the owner picked "Then and
   now" by name, 17 Oct 2026) ----
   The comparison is the card's spine: each figure is a row — what it counts,
   what it was six months ago, today, the change, its six-month line — read
   off the figure's own line (hbFigSeries, the one reading the tiles' "vs 6
   months ago" already used), so the first point IS the "then" and the last
   IS today. The stage bar is drawn twice, then above today, the key saying
   both ("Drafting 6 (7)"). Every today is still its door; a then is history
   and opens nothing. */
function hbThenDay(){ return hbMonthsAgo(HB_SPARK_MONTHS); }
/* WHERE A FIGURE'S DOOR LANDS (round 17 as drawn — its Compare, "Where the
   reader ends up": contract figures open Contracts, Obligations overdue opens
   the Obligations page; the owner's "build all the gaps", 18 Oct 2026). A
   contract figure opens the Contracts place narrowed to exactly the
   contracts it counts (regShowOnly, the door every answer uses — "N of M
   shown ×"); Obligations overdue opens the Obligations page on its Overdue
   tab (obwGoFiltered, the door the overdue card's own button uses). A
   figure a reader picked beyond the drawn five keeps the side list. */
const HB_FIG_TO_CONTRACTS = ['live', 'value', 'ending', 'past'];
function hbFigDoor(key){
  const m = /^f:(\w+)$/.exec(String(key || '')); if (!m) return false;
  const k = m[1];
  /* LAND ON IT (owner, 18 Oct 2026): each lands ON the thing that says what
     it counts — the Overdue tab of the Obligations page, the "N of M shown"
     narrowing of the Contracts list — lit, pressing nothing (focus:false: the
     narrowing's × is never the readied button) */
  if (k === 'overdue'){ if (typeof obwGoFiltered !== 'function') return false; obwGoFiltered({ state: 'overdue' });
    if (typeof landOn === 'function') landOn('[data-obw-view="overdue"]', { block: 'nearest', focus: false }); return true; }
  if (!HB_FIG_TO_CONTRACTS.includes(k) || typeof regShowOnly !== 'function') return false;
  let F = null; try { F = hbBookData(hbS().lens || 'all').figs[k]; } catch (_){ F = null; }
  const ids = (F && Array.isArray(F.ids)) ? F.ids : []; if (!ids.length) return false;
  const f = HB_FIGS.find(x => x.k === k);
  regShowOnly(ids, f ? i18t(f.word) : '');
  if (typeof landOn === 'function') landOn('#reg-only-chip', { block: 'nearest', focus: false });
  return true;
}
function hbThenWord(month){
  try { return new Date(hbThenDay() + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined,
    month ? { month: 'long' } : { day: 'numeric', month: 'long' }); } catch (_){ return hbThenDay(); }
}
const HB_STAGE_FIG = { 'Draft': 'drafting', 'Under Review': 'review', 'Signed': 'signed' };
function hbStageThen(d, k){ const f = HB_STAGE_FIG[k]; const h = f ? hbFigSeries(f, d) : []; return h.length >= 2 ? h[0].v : null; }
function hbBookHtml(d, moved, since){
  const chosen = hbFigsChosen(d.money);
  const thenWord = hbThenWord();
  const fmtOf = f => f.k === 'value' ? _hbM : f.days ? (n => i18tn('hb_f_days', n, { n: _hbN(n) })) : _hbN;
  const tiles = chosen.map(f => {
    const F = d.figs[f.k];
    const num = f.k === 'value' ? _hbM(F.v) : f.days ? (F.none ? '—' : i18tn('hb_f_days', F.n, { n: _hbN(F.n) })) : _hbN(F.n);
    const zero = f.days ? F.none : !F.n;
    const tone = f.days ? (F.tone ? ' is-' + F.tone : '') : !zero && f.tone ? ' is-' + f.tone : '';
    /* UNDER EACH FIGURE, WHAT IT COUNTS AND LEAVES OUT (round 17 as drawn):
       the value's currency, rates, the left out and the not added
       (hbValueSay); how many of those ending have a decision filed
       (hbEndingDecided); the overdue split */
    const decided = (f.k === 'ending' && F.n) ? hbEndingDecided(F.ids) : null;
    const leftSay = (f.k === 'value' && d.money) ? hbValueSay(F.ids)
      : (f.k === 'overdue' && F.n) ? hbOverdueSplitSay(F.rows)
      : decided != null ? i18tn('hb_f_ending_decided', decided, { n: _hbN(decided) }) : '';
    const left = leftSay ? ' · ' + leftSay : '';
    /* THE NEW BOARD'S TILE (11 Oct 2026): what it counts, then the number,
       then what moved since your last visit, then the figure's own line */
    /* THEN AND NOW: one row — what it counts (and what it leaves out), then,
       today (the door), the change, its line */
    const h = hbFigSeries(f.k, d), was = h.length >= 2 ? fmtOf(f)(h[0].v) : '—';
    /* "+2 to decide" (as drawn): more are ending than six months ago, and some have no decision yet */
    const tail = (decided != null && decided < F.n && h.length >= 2 && h[h.length - 1].v > h[0].v) ? i18t('hb_vs_to_decide') : '';
    return `<div class="hb-fig${tone}" data-hb-fig="${f.k}">
      <button type="button" class="hb-fig-main" ${zero ? 'disabled' : `data-hb-dig="f:${f.k}"`} title="${_hbE(i18t(f.k === 'paygap' && F.gap != null ? (F.gap < 0 ? 'hb_f_paygap_good' : F.gap > 0 ? 'hb_f_paygap_bad' : 'hb_f_paygap_tip') : f.tip) + left)}">
        <span class="hb-fig-lw"><span class="hb-fig-l">${_hbE(i18t(f.word))}</span>${leftSay ? `<span class="hb-fig-left is-split">${_hbE(leftSay)}</span>` : ''}</span><span class="hb-fig-then" title="${_hbE(thenWord)}">${_hbE(was)}</span><span class="hb-fig-n">${_hbE(num)}</span></button>
      <span class="hb-fig-chg">${hbVsHtml(f.k, d, f.k === 'paygap' ? (F.tone === 'good' ? '' : 'warn') : f.tone, true, tail)}${hbDeltaHtml(f.k, moved && moved[f.k], since)}</span>${hbSparkHtml(f.k, fmtOf(f), d)}</div>`;
  }).join('');
  const head = `<div class="hb-tn-h" aria-hidden="true"><span>${_hbE(i18t('hb_tn_figure'))}</span><span>${_hbE(thenWord)}</span><span>${_hbE(i18t('hb_tn_today'))}</span><span>${_hbE(i18t('hb_tn_change'))}</span><span>${_hbE(i18t('hb_tn_six'))}</span></div>`;
  const tot = d.stages.reduce((a, s) => a + s.n, 0);
  /* THE STAGE BAR, THEN ABOVE TODAY: the then bar is history, drawn not pressed */
  const thens = d.stages.map(s => hbStageThen(d, s.k)), thenTot = thens.every(v => v != null) ? thens.reduce((a, v) => a + v, 0) : 0;
  const sw = s => s.word ? i18t(s.word) : s.k;
  const thenBar = thenTot ? `<div class="hb-stagerow is-then"><span class="hb-sr-l">${_hbE(thenWord)}</span><div class="hb-stagebar-then" role="img" aria-label="${_hbE(d.stages.map((s, i) => sw(s) + ' ' + _hbN(thens[i])).join(', '))}">${d.stages.map((s, i) => thens[i] ? `<span style="flex-grow:${thens[i]};background:${_hbE(s.tone)}" title="${_hbE(sw(s) + ' · ' + thenWord + ': ' + i18tn('home_map_n_contracts', thens[i], { n: _hbN(thens[i]) }))}"></span>` : '').join('')}</div><span class="hb-sr-n">${_hbN(thenTot)}</span></div>` : '';
  const bar = tot ? `<div class="hb-stagerows${thenTot ? ' is-two' : ''}">${thenBar}<div class="hb-stagerow"><span class="hb-sr-l">${_hbE(i18t('hb_tn_today'))}</span><div class="hb-stagebar">${d.stages.map(s => s.n ? `<button type="button" style="flex-grow:${s.n};background:${_hbE(s.tone)}" data-hb-dig="st:${_hbE(s.k)}" title="${_hbE(sw(s) + ': ' + i18tn('home_map_n_contracts', s.n, { n: _hbN(s.n) }))}" aria-label="${_hbE(sw(s) + ': ' + i18tn('home_map_n_contracts', s.n, { n: _hbN(s.n) }))}"></button>` : '').join('')}</div><span class="hb-sr-n">${_hbN(tot)}</span></div></div>
    <div class="hb-stagekey">${d.stages.map((s, i) => `<button type="button" ${s.n ? `data-hb-dig="st:${_hbE(s.k)}"` : 'disabled'}><i style="background:${_hbE(s.tone)}"></i>${_hbE(sw(s))} <b>${_hbN(s.n)}</b>${thenTot ? ` <span class="hb-sk-then">(${_hbN(thens[i])})</span>` : ''}</button>`).join('')}${thenTot ? `<span class="hb-sk-note">${_hbE(i18t('hb_tn_brackets', { m: hbThenWord(true) }))}</span>` : ''}</div>` : '';
  const count = hbCountLabel(d.lens);
  /* the same rule as the head's chip: the default is never read back */
  const sub = [i18t('hb_tn_sub', { then: thenWord }), count, d.lens === 'all' ? '' : i18t('hb_lens_' + d.lens), since ? i18t('hb_book_since', { when: hbDayWords(since) }) : '', i18t('hb_tn_doors')].filter(Boolean).join(' · ');
  const unsided = d.unsided ? `<div class="hb-quiet">${_hbE(i18tn('hb_unsided', d.unsided, { n: _hbN(d.unsided) }))}</div>` : '';
  /* THE HEAD AS DRAWN (round 17), with the figure picker KEPT (the owner's
     answer of 18 Oct 2026: "the Board keeps the figure picker on Your book")
     and, while Jambo's work card is closed, the way back to it */
  return `<section class="hb-card hb-book" id="hb-book"><header class="hb-ch"><span class="hb-ct">${_hbE(i18t('hb_book'))}</span><span class="hb-cs">${_hbE(sub)}</span>
    <span class="hb-grow"></span><span class="hb-figpick-w"><button type="button" class="hb-ib hb-figs-set" data-hb-figpick aria-haspopup="dialog" aria-expanded="${_hbFigPick}" title="${_hbE(i18t('hb_figs_pick'))}" aria-label="${_hbE(i18t('hb_figs_pick'))}"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor"><use href="#i-sliders"/></svg></button>${_hbFigPick ? hbFigPickHtml(d.money) : ''}</span></header>
    <div class="hb-cb"><div class="hb-figs hb-tn is-n${chosen.length}" style="--hb-figs-n:${chosen.length}">${head}${tiles}</div>${bar}${unsided}</div></section>`;
}

/* ============================================================
   NEEDS YOU — ONE READING, ON THE COUNTER (owner picked "Jambo's note" by
   name, 15 Oct 2026; the card LEFT THE BOARD with round 17 as drawn — the
   owner's yes of 18 Oct 2026: "they live on the Counter")
   ============================================================
   ONE READING, nothing new kept: needsYouOf(c) over the book — the side
   panel's checklist, the bell and the phone read the same — so the Counter's
   list (cnNeeds), Needs you here beside a paper and the bell can never
   disagree. Each press is the checklist's own door (needsYouGo); a
   colleague's look opens its contract and answers with its own Done
   (lookDone). It spends nothing and writes nothing; walked once per task,
   never kept past it, so a save is seen. */
let _hbNyMemo = null;
function hbNyAge(it){
  const at = it && (it.since || it.at);
  const t = Date.parse(String(at || ''));
  return isFinite(t) ? Math.max(0, Math.floor((Date.now() - t) / 86400000)) : null;
}
function hbNeedsList(){
  if (_hbNyMemo) return _hbNyMemo;
  const out = [];
  if (typeof needsYouOf === 'function') (state.contracts || []).forEach(c => {
    if (!c || c.archived) return;
    let L = []; try { L = needsYouOf(c) || []; } catch (_){ L = []; }
    L.forEach(it => out.push({ c, it, age: hbNyAge(it) }));
  });
  /* THE URGENT FIRST, THEN THE OLDEST, then the checklist's own order
     (needsYouOf already ranks within one contract; a tie keeps it) */
  const rank = k => { const o = (typeof NEEDS_YOU_ORDER !== 'undefined' && NEEDS_YOU_ORDER) || []; const i = o.indexOf(k); return i < 0 ? 99 : i; };
  const L = out.map((x, i) => ({ x, i }))
    .sort((a, b) => (Number(!!b.x.it.urgent) - Number(!!a.x.it.urgent)) || ((b.x.age == null ? -1 : b.x.age) - (a.x.age == null ? -1 : a.x.age))
      || (rank(a.x.it.kind) - rank(b.x.it.kind)) || (a.i - b.i))
    .map(o => o.x);
  /* kept for this task only; the list is returned from its own name, so a
     stage whose timer runs at once still gets it */
  _hbNyMemo = L;
  setTimeout(() => { _hbNyMemo = null; }, 0);
  return L;
}
function hbNeedsCount(){ try { return hbNeedsList().length; } catch (_){ return 0; } }
/* the words of one item: the checklist's own title (insNeedWords), and when */
function hbNyWhat(x){
  let w = null; try { w = (typeof insNeedWords === 'function') ? insNeedWords(x.c, x.it) : null; } catch (_){ w = null; }
  return String((w && w.title) || '');
}
function hbNyDays(n){ return n === 0 ? i18t('ins_days_today') : i18tn('ins_days', n, { n }); }
function hbNyWhen(x){
  if (x.age != null) return hbNyDays(x.age);
  if (x.it.kind === 'renewal' && x.it.d != null) return x.it.d === 0 ? i18t('home_today') : i18t('home_in_days', { n: x.it.d });
  const due = String(x.it.due || '').slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(due) ? ((typeof regDotDate === 'function') ? regDotDate(due) : due) : '';
}
/* the one sentence on what has waited longest — the card and the greeting say the same */
function hbNyOldestSay(L){
  const aged = L.filter(x => x.age != null);
  const o = aged.length ? aged.reduce((a, b) => (b.age > a.age ? b : a)) : L[0];
  if (!o) return '';
  const what = hbNyWhat(o), ref = hbRef(o.c);
  return o.age != null ? i18t('hb_ny_oldest', { what, ref, days: hbNyDays(o.age) }) : i18t('hb_ny_first', { what, ref });
}
/* ---- JAMBO ON THE BOARD (round 17 as drawn, "Then and now"; the owner's
   "build all the gaps", 18 Oct 2026) ----
   The Board is only the book now, so his greeting says what the page is:
   when it was counted (the head's own time, hbCountedAt), that every figure
   opens the list behind it, and that Summarise my board is the one press
   here that spends — with three questions the book answers free ("which N
   end in 90 days?" while any do, "value by stream", "my saved views" while
   any is saved: a chip is never a shut door). Then where the owed work went:
   the Counter's own number (counterNeedsCount, the bell's), Jambo's work
   first when he has any ready, and "what needs me", the word that goes
   there. Every number is a reading the Board or the Counter already makes;
   nothing is spent or written. */
/* the word the panel's head says beside his tab on the Board (round 17 as drawn) */
/* the New agreement sheet in front is what the panel's head names (pdHeadHtml's word), never the Board behind it
   (the detail round, 25 Oct 2026: "New agreement · Boa…" squeezed his tab to "Jam…") */
function hbHeadWord(){ return hbBoardHelloOn() && !(typeof naSheetUp === 'function' && naSheetUp()) ? i18t('hb_face_board') : ''; }
/* THE BOARD ITSELF IS IN FRONT (owner's work order, 23 Oct 2026: "the
   Board's own helpers stay on the Board"): the Board face is up AND no
   contract stands on it. A contract brought up from the Board (bsCardId) is
   drawn ON the Board face, so face === 'board' alone also says yes while the
   reader looks at a contract's Overview, Where we are or History. Every
   helper that is about "the charts are in front" — the gallery under the
   empty box, the Board's moves in "/", the "by" and "in" lists, Ctrl/⌘+Z and
   Esc's step out of an open chart — asks THIS, never the face alone. */
function hbBoardInFront(){
  try { return hbS().face === 'board' && !(typeof window.bsCardId === 'function' && window.bsCardId()); } catch (_){ return false; }
}
function hbBoardHelloOn(){
  return typeof state !== 'undefined' && !!state && state.view === 'dashboard' && hbBoardInFront()
    && !!(typeof currentUser === 'function' && currentUser());
}
function hbBoardHelloHtml(){
  /* not over a contract brought up as a page: the desk shows that contract, not the book */
  if (!hbBoardHelloOn()) return '';
  /* THE OVERVIEW, THE LEGORA WAY (owner picked it, 26 Oct 2026; jamboOverviewHtml, the one builder): the Board in
     one head sentence, its facts (the one desk ndRead, Jambo's ready work, the book's own counts), each with its
     door, then "Ask me" with the chips his greeting carried — no face, no bubble; his greeting is the Jambo tab's.
     "Today's insights" and "Jambo this month" have no reading the panel can make here and are left out. */
  let ending = 0; try { ending = hbBookData(hbS().lens || 'all').figs.ending.n; } catch (_){ ending = 0; }
  let views = 0; try { views = (typeof igViewsRead === 'function') ? igViewsRead().length : 0; } catch (_){ views = 0; }
  let n = 0; try { n = (typeof counterNeedsCount === 'function') ? counterNeedsCount() : hbNeedsCount(); } catch (_){ n = 0; }
  _hbNyDockN = n; _hbNyDockBook = (state.contracts || []).length;
  let work = 0; try { work = hbAgentsData(null).ready || 0; } catch (_){ work = 0; }
  let D = null; try { D = (typeof ndRead === 'function') ? ndRead() : null; } catch (_){ D = null; }
  const sum = (D && typeof ndSumWords === 'function') ? ndSumWords(D) : '';
  const book = (state.contracts || []).filter(c => c && !c.archived && c.status !== 'Declined' && (!window.canAccessFolder || canAccessFolder(c.folder)));
  const signed = book.filter(c => c.status === 'Signed').length, drafts = book.filter(c => c.status === 'Draft').length;
  const facts = [];
  facts.push({ k: i18t('jov_hb_needs'), v: n ? i18tn('jov_hb_needs_v', n, { n, k: work }) + (sum ? ' · ' + sum : '') : i18t('hb_jb_counter_none'), need: !!(D && D.late),
    link: n ? i18t('jov_ln_show_all') : '', run: () => { if (typeof ndOpenBoard === 'function') ndOpenBoard(); } });
  facts.push({ k: i18t('jov_hb_book'), v: i18tn('jov_hb_book_v', book.length, { n: book.length, s: signed, d: drafts }), link: i18t('jov_ln_open'), run: () => { if (typeof hbOpenContracts === 'function') hbOpenContracts(); } });
  if (ending) facts.push({ k: i18t('jov_hb_ending'), v: i18tn('jov_hb_ending_v', ending, { n: ending }), need: true });
  const chip = q => ({ label: q, attr: `data-igsug="${_hbE(q)}"` });
  const asks = [ending ? chip(i18tn('hb_jb_ending', ending, { n: ending })) : null, chip(i18t('hb_jb_by_stream')), views ? chip(i18t('hb_jb_views')) : null,
    n ? chip(i18t('hb_jb_needs_chip')) : null,
    (typeof calHandOff === 'function') ? { label: i18t('ob_yw_chip_week'), title: i18t('cal_plan_p_week'), run: () => calHandOff('week') } : null].filter(Boolean);
  /* "counted at <time>" is the HEAD's own time: it wears a mark so a later board paint moves it in place */
  const src = _hbE(i18t('jov_hb_src', { time: '\uE000' })).replace('\uE000', `<span data-hb-jb-at>${_hbE(hbCountedAt())}</span>`);
  const o = { head: { b: i18t('jov_hb_head_b'), s: i18t('jov_hb_head_s') }, facts, srcHtml: src, asks };
  return (typeof jamboOverviewHtml === 'function') ? `<div class="jl-words is-ov hb-jb-hello">${jamboOverviewHtml(o, 'hb')}</div>` : '';
}
/* JAMBO'S PANEL FOLLOWS THE CARD'S NUMBER: the greeting, his tab's count and
   the lead chip are drawn with the panel, which a board paint does not redraw;
   when the number the panel last drew differs, it is drawn again — never under
   a reader typing in his box. */
let _hbNyDockN = null, _hbNyDockBook = null;
function hbNyDockFollow(){
  try {
    if (hbS().face !== 'board' || typeof renderIntelDock !== 'function') return;
    /* the greeting's time follows the head's, in place (nothing redrawn) */
    const at = hbCountedAt();
    document.querySelectorAll('[data-hb-jb-at]').forEach(el => { if (el.textContent !== at) el.textContent = at; });
    /* the Overview's book count follows too (a book still loading when the panel was drawn) */
    const n = (typeof counterNeedsCount === 'function') ? counterNeedsCount() : hbNeedsCount();
    const b = (state.contracts || []).length; if (n === _hbNyDockN && b === _hbNyDockBook) return;
    const box = document.getElementById('igd-input');
    if (box && document.activeElement === box) return;
    renderIntelDock();
  } catch (_){}
}
/* "needs me" (CA_GO.needs): Home (once the Counter), where Needs you lives
   since round 17 (the owner's yes, 18 Oct 2026), its list in view and lit */
function hbNeedsOpen(){
  if (typeof deskGoCounter === 'function') deskGoCounter(); else if (typeof setView === 'function') setView('counter');
  /* LAND ON IT (owner, 18 Oct 2026): Home's Needs you card, in view and lit,
     pressing nothing — through the one lander */
  if (typeof landOn === 'function') landOn('#cn-needs', { block: 'nearest' });
  return true;
}
/* a press on the card: the checklist's own door; a look opens its contract */
function hbNeedsPress(kind, id){
  const c = (typeof getContract === 'function') ? getContract(id) : null; if (!c) return false;
  if (kind === 'look'){
    if (typeof pdOpenOnHome === 'function' && pdOpenOnHome(c.id, 'open')) return true;
    if (typeof openWorkspace === 'function') openWorkspace(c.id);
    return true;
  }
  return (typeof needsYouGo === 'function') ? needsYouGo(kind, c.id) : false;
}
/* ---- JAMBO'S WORK DRAWS NONE OF IT (4 Oct 2026, still true) ----
   The card is Copilot's prepared work and nothing else; what is waiting on
   you lives on Home since round 17 (hbNeedsList, Home's Needs you). THE BOARD
   KEEPS THIS CARD (the owner's answer of 18 Oct 2026, after LAND ON IT): Home's
   "Jambo's work" row's Open lands on it, lit (hbOpenAgent → landOn). */
function hbPrepHtml(A, since){
  const I = hbInsightsToday();
  /* THE ONE DESK (Round A, the owner picked "The Legora Way", 22 Oct 2026;
     reverses round 17's "Needs you is Home's" for the WHOLE list): this card,
     under Your book, is all of Needs you — Jambo's prepared work and your
     move, one reading (ndBoardHtml, js/views/counter.js); Home draws its top
     three of each. What was done while you were away, the agents' levels and
     the house's door stay at its foot. It never folds or closes: work owed is
     not hidden. */
  if (typeof ndBoardHtml !== 'function') return hbInsCardHtml(I);
  return ndBoardHtml(hbNdOpts(A, since)) + hbInsCardHtml(I);
}
/* the Board's parts of the card: a piece of Jambo's opened in place, chasing
   many at once (on his tab), and the foot — done while away, the levels, the house */
function hbNdOpts(A, since){
  const H = A || hbAgentsData(null);
  const at = since || null;
  const done = (H.done && H.done.length) ? `<div class="hb-done">${_hbE(i18t('hb_done_since', { when: hbDayWords(at) }))} ${H.done.map(x => `<button type="button" data-hb-dig="dn:${_hbE(x.k)}">${_hbE(i18tn('hb_done_' + x.k, x.n, { n: _hbN(x.n) }))}</button>`).join('<span aria-hidden="true">·</span>')}<span class="hb-grow"></span><span class="hb-quiet">${_hbE(i18t('hb_done_trail'))}</span></div>` : '';
  let its = []; try { its = (typeof ndPieces === 'function') ? ndPieces().map(p => p.it) : []; } catch (_){ its = []; }
  const levels = hbAgLevelsHtml();
  const house = `<button type="button" class="hb-edge-b" data-hb-agents-page>${_hbE(i18t('hb_the_agents'))}</button>`;
  return { look: hbNdLookHtml, chase: hbChaseManyHtml(its), keep: !!done, foot: `<div class="nd-foot">${done}<div class="nd-foot-r">${levels || '<span class="hb-grow"></span>'}${house}</div></div>` };
}
/* a piece opened under its row: its body (a chase's letter as it will leave,
   else the piece's own), then its acts — its one act, the rest, Put away last */
function hbNdLookHtml(it){
  if (!it || _hbAgLook !== it.key) return '';
  const c = it.c;
  if (c && !_hbAgLoaded.has(c.id) && typeof agLoadWhole === 'function'){
    _hbAgLoaded.add(c.id);
    let p = null; try { p = agLoadWhole(c); } catch (_){ p = null; }
    if (p && p.then) p.then(() => { if (typeof hbPaintBoard === 'function') try { hbPaintBoard(); } catch (_){} }, () => {});
  }
  const T = (fn, d) => { try { return (typeof window[fn] === 'function') ? window[fn](it) : d; } catch (_){ return d; } };
  const act = T('agRowActOf', null);
  const rest = typeof agActsOf === 'function' ? agActsOf(it).filter(a => a.act !== 'away' && !(act && a.act === act.act)) : [];
  const inBody = typeof agActsInBody === 'function' && agActsInBody(it);
  const acts = inBody ? '' : (act ? `<button type="button" class="ui-btn ui-btn-sm ui-btn-primary" data-ag-act="${_hbE(act.act)}"${act.tip ? ` title="${_hbE(act.tip)}"` : ''}>${_hbE(act.label)}</button>` : '')
    + rest.map(a => `<button type="button" class="${a.cls === 'link' ? 'ui-link' : 'ui-btn ui-btn-sm'}" data-ag-act="${_hbE(a.act)}"${a.tip ? ` title="${_hbE(a.tip)}"` : ''}>${_hbE(a.label)}</button>`).join('')
    + `<button type="button" class="ui-link hb-pc-away" data-ag-act="away">${_hbE(i18t('desk_discard'))}</button>`;
  const body = T('agLookHtml', '') || T('agPanelBody', '');
  const mail = it.kind === 'chase' || it.kind === 'chase-firm';
  return `<div class="hb-pc-body nd-body${mail ? ' is-mail' : ''}">${body}${acts ? `<div class="ag-p-acts hb-pc-more">${acts}</div>` : ''}</div>`;
}
/* ---- HOW FAR THE AGENTS MAY GO, UNDER THE CARD (round 23's drawing, "All
   seven agents: Ask me first · set by Sara for everyone · Ask an admin";
   carried here from Home when LAND ON IT, 18 Oct 2026, made this card the
   one place Jambo's work is listed) ----
   agLevelsSaid's reading (the company's levels grouped, who set them — the
   name the level route wrote — and where this person chose their own), in
   one line under the agents' rows. A member asks an admin FROM HERE: the
   tracked ask Settings makes (stAskDirect, the same settings_asks record, the
   admin's Needs you and bell), and once sent the line says so where the
   button stood (stAskOpenOn). An admin's door is Change, the agents' own
   settings, where the level is set. Drawn under the agents' rows only (as
   drawn, "under the pieces": a folded card, or one holding only what was done
   while you were away, draws none); nothing while the status has not come (it
   says nothing it cannot read); the house stays the head's door. */
let _hbLvAsking = false, _hbLvWanted = false;
function hbLvAskState(){
  if (_hbLvAsking) return `<span class="hb-ag-lv-asked">${(typeof busyHtml === 'function') ? busyHtml(i18t('cn_lv_asking')) : _hbE(i18t('cn_lv_asking'))}</span>`;
  let open = null; try { open = (typeof stAskOpenOn === 'function') ? stAskOpenOn('agents') : null; } catch (_){ open = null; }
  if (!open) return `<button type="button" class="hb-link" data-hb-lv-ask>${_hbE(i18t('cn_lv_ask'))}</button>`;
  let who = ''; try { who = (typeof stAdminsSaid === 'function') ? stAdminsSaid() : ''; } catch (_){ who = ''; }
  return `<span class="hb-ag-lv-asked" data-hb-lv-asked>${_hbE(who ? i18t('cn_lv_asked', { who }) : i18t('cn_lv_asked_any'))}</span>`;
}
async function hbLvAsk(){
  if (_hbLvAsking) return;
  const words = i18t('cn_lv_ask_words');
  /* with no server to keep the ask (the static sample), Settings' own card says so */
  if (typeof stAskDirect !== 'function' || !(typeof API_MODE === 'function' && API_MODE())){ if (typeof stAskFrom === 'function') stAskFrom('agents', words); return; }
  _hbLvAsking = true; hbPaintBoard();
  try { await stAskDirect('agents', words, ''); }
  catch (e){ if (typeof toast === 'function') toast((e && e.message) || i18t('cn_lv_ask_failed'), 'err'); }
  finally { _hbLvAsking = false; hbPaintBoard(); }
}
function hbAgLevelsHtml(){
  let L = null; try { L = (typeof agLevelsSaid === 'function') ? agLevelsSaid() : null; } catch (_){ L = null; }
  if (!L || !L.groups || !L.groups.length) return '';
  const first = s => String(s || '').trim().split(/\s+/)[0] || '';
  const lv = v => i18t('st_agents_lv_' + v), ag = k => i18t('ag_' + k);
  const head = L.groups.length === 1
    ? `${_hbE(L.n === 7 ? i18t('cn_lv_all7') : i18t('cn_lv_all', { n: L.n }))} <b>${_hbE(lv(L.groups[0].lv))}</b>`
    : L.groups.map(g => `${_hbE(g.keys.length === 1 ? i18t('cn_lv_agent', { agent: ag(g.keys[0]) }) : i18tn('cn_lv_n', g.keys.length, { n: g.keys.length }))} <b>${_hbE(lv(g.lv))}</b>`).join(' · ');
  const names = L.by.map(b => b.you ? i18t('cn_lv_you') : first(b.name)).filter(Boolean);
  const by = !names.length ? i18t('cn_lv_start') : i18t('cn_lv_by', { who: names.length < 2 ? names[0] : names.slice(0, -1).join(', ') + ' ' + i18t('ag_ln_and') + ' ' + names[names.length - 1] });
  const mine = !L.mine.length ? '' : L.mine.length === 1 ? i18t('cn_lv_mine_k', { lv: lv(L.mine[0].lv), agent: ag(L.mine[0].k) }) : i18tn('cn_lv_mine', L.mine.length, { n: L.mine.length });
  const admin = typeof isAdmin === 'function' && isAdmin();
  const door = admin ? `<button type="button" class="hb-link" data-hb-lv-change>${_hbE(i18t('cn_lv_change'))}</button>` : hbLvAskState();
  return `<div class="hb-ag-lv"><span class="hb-ag-lv-w" data-hb-levels>${head} · ${_hbE(by)}${mine ? ' · ' + _hbE(mine) : ''}</span>${door}</div>`;
}
/* the levels ride the agents' status: asked once a sitting, when the card is
   on the Board and the status has not come (the latch is raised before the
   promise exists), and the Board drawn again when it arrives */
function hbAgLevelsWanted(){
  if (_hbLvWanted || typeof agentsStatus !== 'function' || agentsStatus() || typeof agentsStatusLoad !== 'function') return;
  if (!(typeof API_MODE === 'function' && API_MODE()) || !document.getElementById('hm-agents')) return;
  _hbLvWanted = true;
  try { agentsStatusLoad().then(s => { if (s && typeof state !== 'undefined' && state && state.view === 'dashboard'){ if (hbS().face === 'board') hbPaintBoard(); else _hbBoardMissed = true; } }, () => {}); } catch (_){}
}
/* C3 (the board as drawn, 11 Oct 2026): TODAY'S INSIGHTS IS ITS OWN CARD under
   Copilot's work — HaTi's own arithmetic, no model; the pictures three across,
   each Open · Keep · Ask why · Let it go; Hide folds it for the sitting's
   person (s.insFold). Its content is the shelf it always was (hbShelfHtml). */
function hbInsCardHtml(I){
  const s = hbS(), U = hbInsUsual(I);
  if (!I.length && !U.length) return '';
  const ins = s.ins || {}, fold = !!s.insFold;
  /* THE HEAD AS DRAWN (round 17, "Then and now"; the owner's "build all the
     gaps", 18 Oct 2026): its own slim card — the title, the count as a pill,
     "what moved most since April · worked out this morning from your book".
     THE PILL COUNTS THE CARDS UNDER IT (hbShelfCards: the findings and the
     usual pictures that fill the row), so the number on the head is what is
     behind it. A shelf with no finding says why it shows the usual pictures.
     HIDE STAYS (the owner's answer of 18 Oct 2026): it folds the pictures for
     this person (s.insFold); the head and its count stay. */
  const sub = I.length ? 'hb_ins_sub_moved' : ins.young ? 'hb_ins_sub_young' : 'hb_ins_sub_quiet';
  const n = hbShelfCards(I).length;
  /* THE PICTURES, EACH ITS OWN CARD, TWO TO A ROW (as drawn; reverses the 11
     Oct "always three across"): the findings first, the usual pictures fill
     the rest up to HB_INS_MAX (hbShelfCards); an odd last card takes the
     row's width — never a hole (the owner's 11 Oct rule, kept). */
  return `<section class="hb-card hb-inscard hb-ins-head${fold ? ' is-folded' : ''}"><header class="hb-ch"><span class="hb-ct">${_hbE(i18t('hb_ins_title'))}</span>`
    + `${n ? `<span class="hb-pill hb-ins-n">${_hbE(_hbN(n))}</span>` : ''}<span class="hb-cs">${_hbE(i18t(sub, { m: hbThenWord(true) }))}</span><span class="hb-grow"></span>`
    + `<button type="button" class="hb-btn is-sm" data-hb-ins-fold aria-expanded="${!fold}">${_hbE(i18t(fold ? 'hb_ins_show' : 'hb_ins_hide'))}</button></header></section>`
    + (fold ? '' : hbShelfHtml(I));
}

/* ---- ONE CONTRACT ROW, in every list on the board ---- */
function hbRowHtml(c, right){
  return `<button type="button" class="hb-row" data-hb-dig="c:${_hbE(c.id)}" title="${_hbE(i18t('hb_open_card'))}">
    <span class="hb-row-a">${_hbRefH(c)} · ${_hbE(c.name || '')}</span><span class="hb-row-r">${right || ''}</span>
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
      <span class="hb-row-b">${[_hbE((c && c.name) || o.cname || ''), _hbE(o.counterparty || o.cp || ''), (o.assignee || o.who) ? _hbE(o.assignee || o.who) : (o.theirs != null ? o.theirs : (typeof obligationIsTheirs === 'function' && obligationIsTheirs(o))) ? '' : '<span class="hb-hollow"></span>' + _hbE(i18t('hb_nobody'))].filter(Boolean).join(' · ')}</span></button>`; }).join('')}</div>`;
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
  if (!g) return field === 'counterparty' ? i18t('hb_no_counterparty') : field === 'owner' ? i18t('hb_nobody_owns') : field === 'payterms' ? i18t('hb_no_payterms') : field === 'side' ? i18t('hb_side_none') : HB_DEAL_GROUPS.includes(field) ? i18t('hb_deal_unknown') : '—';
  if (field === 'move') return i18t('hb_dmove_' + g);
  if (field === 'rounds') return g === '0' ? i18t('hb_rounds_0') : i18tn('hb_rounds_n', g === '4+' ? 4 : Number(g), { n: g });
  if (field === 'overdue') return i18t('hb_overdue_' + g);
  if (field === 'risks') return g === 'unread' ? i18t('hb_risks_unread') : g === '0' ? i18t('hb_risks_0') : i18t('hb_risks_n', { n: g });
  if (field === 'standards') return i18t('hb_std_' + g);
  if (HB_KEY_TERMS[field]) return i18t('hb_kt_' + field + '_' + g);
  if (field === 'payterms') return i18tn('hb_days_n', 2, { n: g });
  if (field === 'status') return (typeof statusLabel === 'function') ? statusLabel(g) : g;
  /* a SIDE is who owes whom (owner, 11 Oct 2026: "what we pay vs how we are paid") */
  if (field === 'side') return i18t(g === 'supplier' ? 'hb_side_we_pay' : 'hb_side_we_are_paid');
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
/* EVERY BOARD FIGURE ADDS THROUGH HERE — so a private stream's money is left
   out of all of them in one place (fxCounted, 17 Oct 2026) */
function hbValueOfOne(c){ const h = (typeof fxCounted === 'function') ? fxCounted(c) : { v: Number(c.value || 0), missing: false }; return (h && !h.missing) ? (h.v || 0) : 0; }
function hbChartBarsHtml(rows, money, yk){
  /* the "N more groups" row is a door, not a bar: it never sets the scale and
     draws no fill, so the groups that were drawn keep their size (11 Oct 2026) */
  const max = Math.max(1, ...rows.filter(r => !r.rest).map(r => money ? r.v : r.n));
  return `<div class="hb-chart hb-chart-bars" data-hb-yk="${_hbE(yk || (money ? 'value' : 'count'))}">${rows.map(r => { const m = money ? r.v : r.n; const pct = Math.max(m ? 1.5 : 0, m / max * 100);
    return `<button type="button" class="hb-cbar${r.rest ? ' is-rest' : ''}" ${r.dig && r.n ? `data-hb-dig="${_hbE(r.dig)}"${_hbYAttr(m)}` : 'disabled'} title="${_hbE(r.label + ': ' + r.say)}">
      <span class="hb-cbar-l"><span class="hb-cbar-t">${_hbE(r.label)}</span>${r.sub ? `<span class="hb-cbar-s">${_hbE(r.sub)}</span>` : ''}</span>
      <span class="hb-cbar-tr">${r.rest ? '' : `<span class="hb-cbar-f" style="width:${pct.toFixed(1)}%${r.color ? ';background:' + _hbE(r.color) : ''}"></span>`}</span>
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
const HB_RING_MAX = 7, HB_BLOCK_GROUPS = 12, HB_TL_MONTHS = 30, HB_TL_ROWS = 48, HB_TL_PACK = 24, HB_TL_SHORT = 2, HB_BUB_MAX = 150;
const HB_ATTENTION_RE = /^(move|owner|overdue|not read yet|off standard|liability)/;
/* SERIES COLOURS THAT PASS FOR COLOUR-BLIND READERS (work order O-24, 7 Oct
   2026): one set for the light board, one for the dark, each passing the five
   palette checks (lightness, strength, colour-blind and normal separation,
   contrast). The first four are the checked set; the tail is for a fifth
   series and later. Blue leads, as it did for nearly every reader before
   the Blue / Green switch left with the Chambers design (20 Oct 2026). Status
   colours never move (hmStageTone). */
const HB_HUES_LIGHT = ['#2F5FC4', '#1A9C8A', '#B87A0F', '#9A5CC8', '#C4503A', '#5E7A1F', '#C2457E', '#5B6B7F'];
const HB_HUES_DARK = ['#4F82E6', '#1C9E8B', '#C08518', '#9E68D2', '#E07A63', '#86A83A', '#E0709F', '#8C9BB0'];
const HB_HUES = HB_HUES_DARK;
const HB_TILE_INK = '#021011';
function hbHues(){
  let dark = true; try { dark = hbScreenNow() !== 'light'; } catch (_){ dark = true; }
  return (dark ? HB_HUES_DARK : HB_HUES_LIGHT).slice();
}
function hbHueOf(field, g, i){
  if (field === 'status' && typeof hmStageTone === 'function') return hmStageTone(g);
  const set = hbHues();
  return set[i % set.length];
}
/* ---- A CHART IS DRAWN AT ITS REAL SIZE, IN THREE STEPS (work order O-22,
   7 Oct 2026) ---- a drawer once built a 1000-wide picture and the page
   stretched it, words and all (7px on a half card, huge when opened). Now
   the card's REAL width is measured after the paint (hbFitMeasure) and the
   chart is drawn again at that width; the height comes from the STEP:
   the board 196px, opened 42% of the window between 280 and 380, full
   screen the window less 230. Type sizes come from the step (CSS
   `--hb-fs-*` on `svg[data-hb-step]`), never from the width. A chart drawn
   outside a card (the shelf, a pack, Copilot's description) keeps the old
   1000 and is not tagged. */
const HB_STEP_H = { board: 196 };
const _hbFitW = new Map();
let _hbFit = null, _hbFitAt = null, _hbFull = false, _hbTableOn = new Set(), _hbFitBusy = false;
function hbStepH(step){
  const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
  if (step === 'full') return Math.max(280, vh - 230);
  if (step === 'open') return Math.max(280, Math.min(380, Math.round(vh * 0.42)));
  return HB_STEP_H.board;
}
function hbFW(){ return _hbFit ? _hbFit.w : 1000; }
/* MAKE BIGGER ALWAYS MAKES IT BIGGER (owner, 20 Oct 2026: "When you press to
   expand or make smaller the frequently do not work accordingly"): a card
   made bigger was only made wider, so a card already the row's width (alone
   on its row, or a one-column board) changed nothing, and an opened chart kept
   its height. A grown card is now drawn TALLER too: on the board at the
   opened height, opened at HB_GROWN_VH of the window (never past full screen) */
const HB_GROWN_VH = 0.55;
function hbGrownH(step){
  const vh = (typeof window !== 'undefined' && window.innerHeight) || 800;
  if (step === 'board') return hbStepH('open');
  if (step === 'open') return Math.min(hbStepH('full'), Math.max(hbStepH('open'), Math.round(vh * HB_GROWN_VH)));
  return hbStepH(step);
}
function hbFH(def){ return _hbFit ? (_hbFit.grow ? hbGrownH(_hbFit.step) : hbStepH(_hbFit.step)) : def; }
/* gridlines: three on the board, four once opened (Instrument) */
function hbGridN(){ return _hbFit && _hbFit.step === 'board' ? 3 : 4; }
function hbFitMeasure(){
  if (_hbFitBusy || typeof document === 'undefined') return;
  let moved = false;
  document.querySelectorAll('svg[data-hb-fit]').forEach(svg => {
    const host = svg.parentElement; if (!host) return;
    /* the room inside the host's padding is the room the chart has */
    const cs = getComputedStyle(host);
    const w = Math.round((host.clientWidth || 0) - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)); if (w < 120) return;
    const k = svg.getAttribute('data-hb-fit'), drawn = Number(svg.getAttribute('data-hb-w')) || 0;
    if (Math.abs(w - drawn) > 6){ _hbFitW.set(k, w); moved = true; }
  });
  if (moved){ _hbFitBusy = true; try { hbPaintBoard(); } finally { _hbFitBusy = false; } }
}
if (typeof window !== 'undefined' && !window._hbFitWired){
  window._hbFitWired = true;
  let t = null;
  window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { try { if (window.state && state.view === 'dashboard') hbFitMeasure(); } catch (_){} }, 120); });
}
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
function _hbSvgDoor(dig, title, extra){ return `${dig ? `data-hb-dig="${_hbE(dig)}" tabindex="0" role="button"` : ''}${extra || ''}><title>${_hbE(title)}</title`; }
/* THE HOVER CARD'S FACTS ON THE PIECE (G4, 10 Oct 2026): the number the piece
   draws, and — for a piece in a run over time — the one before it, so the
   card can say the share and the change without counting anything again */
function _hbYAttr(y, prev){
  if (y == null || !isFinite(y)) return '';
  return ` data-hb-y="${Math.round(y * 100) / 100}" data-hb-part`
    + (prev && prev.y != null && isFinite(prev.y) ? ` data-hb-py="${Math.round(prev.y * 100) / 100}" data-hb-pl="${_hbE(prev.l)}"` : '');
}
/* what a chart's numbers are, for the hover card: a count and an amount add
   up (a share is said), an average or a running total does not */
function _hbYKind(m, show){ return show === 'running' ? 'run' : hbAvgMeasure(m) ? 'avg' : hbMoneyMeasure(m) ? 'value' : 'count'; }
/* SHARP AT EVERY SIZE (G2): on a card the chart is drawn at its real width,
   so an edge on a whole pixel is a crisp edge */
function _hbSnap(v){ return _hbFit ? Math.round(v) : Math.round(v * 10) / 10; }
/* LABELS THAT NEVER COLLIDE OR GET CUT SILENTLY (G3): a word's width at a
   size, a word fitted to the room it has (cut with "…", the whole name in
   the hover card), and how many labels to skip so the names never touch */
function _hbTextW(t, fs){ return String(t == null ? '' : t).length * (fs || 12) * 0.56; }
function _hbFitText(t, room, fs){
  const str = String(t == null ? '' : t); if (_hbTextW(str, fs) <= room) return str;
  const k = Math.max(1, Math.floor(room / ((fs || 12) * 0.56)) - 1);
  return k >= str.length ? str : str.slice(0, k).trimEnd() + '…';
}
function _hbEvery(labels, step, fs, min){
  const w = Math.max(0, ...labels.map(l => _hbTextW(l, fs))) + 8;
  return Math.max(min || 1, Math.ceil(w / Math.max(1, step)));
}
/* ---- ANGLED NAMES (owner picked "Angled" by name, 10 Oct 2026, off the
   "Track and Chart Labels" proposals: "where the words are big and you cant
   fit them, try making them smaller and at an angle") ----
   Where a chart's column names would be cut lying flat, every name in that
   row is drawn a step smaller, never under 12px (HB_ANGLE_FS; the CSS sets
   the step's size) and slanted HB_ANGLE degrees,
   so it reads whole past its narrow column; the chart gives them the height
   (and the side room) they need. Names that fit flat stay flat. A name past
   HB_ANGLE_MAX is still cut, and is whole on the hover card as before. */
const HB_ANGLE = 40, HB_ANGLE_FS = 12, HB_ANGLE_MAX = 220, HB_ANGLE_SIDE = 0.45;
/* `drawn`: the words a slanted name prints (a column's whole name), where
   they differ from the flat ones */
function hbAngleOf(labels, step, fs, drawn){
  if (!labels.length || labels.every(l => _hbTextW(l, fs) <= step - 4)) return null;
  const w = Math.min(HB_ANGLE_MAX, Math.max(0, ...(drawn || labels).map(l => _hbTextW(l, HB_ANGLE_FS))));
  const r = HB_ANGLE * Math.PI / 180;
  return { fs: HB_ANGLE_FS, w, up: Math.ceil(w * Math.sin(r)) + HB_ANGLE_FS, out: Math.ceil(w * Math.cos(r)) };
}
/* THE ROOM ON THE LEFT IS WHAT THE NAMES REALLY HANG OUT (owner, 20 Oct
   2026: "some graphs do not go in the middle or do not use the space wisely"):
   a slanted name ending under its column hangs left by its OWN width, so
   only the first few can reach past the axis; the room was the LONGEST
   name's, wherever it stood, and left a blank strip beside the chart.
   `dx`: how far right of the column's middle the name ends */
function hbAngleLeft(labels, A, step, dx){
  const c = Math.cos(HB_ANGLE * Math.PI / 180);
  return Math.ceil(Math.max(0, ...labels.map((t, i) => Math.min(A.w, _hbTextW(_hbFitText(t, A.w, A.fs), A.fs)) * c - (i + 0.5) * step - (dx || 0))));
}
/* `anchor` 'start': the name rises to the right from (x, y) — over a grid;
   'end': it ends at (x, y) — under an axis */
function hbAngleText(t, x, y, A, anchor){
  const xs = x.toFixed(1), ys = y.toFixed(1);
  return `<text x="${xs}" y="${ys}" text-anchor="${anchor}" font-size="${A.fs}" transform="rotate(-${HB_ANGLE} ${xs} ${ys})" class="hb-sv-ink2 hb-sv-angled">${_hbE(_hbFitText(t, A.w, A.fs))}</text>`;
}
function hbRingSvg(D, cs, field, money, P){
  const sayOf = (n, v) => money ? _hbM(v) + ' · ' + _hbN(n) : _hbN(n);
  /* the reader's order and top N; the rest is one slice, and a door */
  /* ranked by the card's own measure: a count ranks by contracts, value by money */
  const cut = hbGroupsCut(hbGroupsOf(cs, field, money), P || {}, HB_RING_MAX, P && P.measure === 'value' && money ? 'value' : 'count', field);
  const rows = cut.rest ? cut.rows.concat([cut.rest]) : cut.rows;
  const whole = rows.reduce((a, r) => a + (money ? r.v : r.n), 0) || 1;
  /* ---- A RING IN A NARROW CARD STANDS TALL (Young, 7 Oct 2026, work order
     W-5: "graph cards not utilizing the space") ---- in a chapter that does
     not take the whole row the legend goes UNDER the ring, full width, so
     nothing is cut off and no scroll strip appears; elsewhere it stays beside. */
  /* drawn at the card's real width (O-22): a card under 760 wide stands
     tall; wider, the legend sits beside and takes what the card gives */
  const fw = _hbFit ? _hbFit.w : 0;
  /* ON A CARD THE RING FITS THE STEP (O-22, 8 Oct 2026): the height is the
     step's, never the rows'. The ring sits left, sized to that height; the
     legend fills the rest, one line a row when two lines do not fit, and a
     legend past even that is cut and the cut said (every slice is still
     drawn, and each one is a door). Off a card it is drawn as before. */
  const fitted = !!_hbFit;
  const tall = !fitted && (!!(D && D.narrow) || (fw > 0 && fw < 760));
  let rowH = 38, W = tall ? (fw || 440) : (fw || 1000), R = tall ? 104 : 118, r = tall ? 74 : 84, cx = tall ? W / 2 : 150;
  let legY = tall ? 2 * R + 44 : 40, H = tall ? legY + rows.length * rowH + 4 : Math.max(300, 40 + rows.length * rowH + 16), cy = tall ? R + 14 : H / 2;
  let legX = tall ? 16 : 360, rowW = tall ? W - 32 : Math.min(636, W - 376), barW = tall ? Math.min(156, Math.round(W * 0.35)) : 240, barX = rowW - barW - (tall ? 0 : 16);
  let oneLine = false, drawn = rows.length;
  if (fitted){
    H = hbFH(0); R = Math.round(Math.max(40, Math.min(140, (H - 16) / 2, W * 0.22))); r = Math.round(R * 0.71); cx = R + 12; cy = H / 2;
    legX = 2 * R + 36; rowW = W - legX - 8;
    barW = rowW >= 260 ? Math.min(156, Math.round(rowW * 0.35)) : 0; barX = barW ? rowW - barW - 8 : rowW;
    const room = H - 8, n = Math.max(1, rows.length);
    if (room / n >= 36) rowH = Math.min(44, room / n);
    else { oneLine = true; rowH = Math.max(22, Math.min(30, room / n)); if (rows.length * rowH > room) drawn = Math.max(1, Math.floor((room - 22) / 22)); }
    legY = Math.max(4, (H - (drawn + (drawn < rows.length ? 1 : 0)) * rowH) / 2);
  }
  const chars = Math.max(oneLine ? 6 : 10, Math.floor((barX - 34) / 7.6) - (oneLine ? 9 : 0));
  const fit = t => t.length > chars ? t.slice(0, chars - 1) + '…' : t;
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
    slices += `<g class="hb-sv-slice hb-in" style="animation-delay:${i * 40}ms" ${_hbSvgDoor(dig, title, _hbYAttr(money ? g.v : g.n))}><path d="${d}" style="fill:${hue}${fitted ? `;transform-origin:${cx}px ${cy}px` : ''}"/></g>`;
    a0 = a1;
    if (i >= drawn) return;
    const y = legY + i * rowH;
    const bar = barW ? `<rect x="${barX}" y="${oneLine ? (rowH / 2 - 4).toFixed(1) : 5}" width="${barW}" height="8" rx="4" class="hb-sv-track"/><rect x="${barX}" y="${oneLine ? (rowH / 2 - 4).toFixed(1) : 5}" width="${(barW * share).toFixed(1)}" height="8" rx="4" style="fill:${hue}" opacity=".9"/>` : '';
    legend += oneLine
      ? `<g class="hb-sv-row hb-in" style="animation-delay:${i * 40}ms" transform="translate(${legX},${y.toFixed(1)})" ${_hbSvgDoor(dig, title)}>
      <rect x="-8" y="0" width="${rowW + 8}" height="${rowH.toFixed(1)}" fill="transparent"/><rect x="0" y="${(rowH / 2 - 5).toFixed(1)}" width="10" height="10" rx="2" style="fill:${hue}"/>
      <text x="18" y="${(rowH / 2 + 4).toFixed(1)}" font-size="13" font-weight="600" class="hb-sv-ink">${_hbE(fit(g.label))}</text>
      <text x="${barX - 8}" y="${(rowH / 2 + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-ink2">${_hbE(rowW >= 200 ? sayOf(g.n, g.v) + ' · ' : '')}${Math.round(share * 100)}%</text>${bar}</g>`
      : `<g class="hb-sv-row hb-in" style="animation-delay:${i * 40}ms" transform="translate(${legX},${y.toFixed(1)})" ${_hbSvgDoor(dig, title)}>
      <rect x="-8" y="-4" width="${rowW}" height="${rowH}" fill="transparent"/><rect x="0" y="2" width="10" height="10" rx="2" style="fill:${hue}"/>
      <text x="20" y="12" font-size="14" font-weight="600" class="hb-sv-ink">${_hbE(fit(g.label))}</text>
      <text x="20" y="29" font-size="12" class="hb-sv-ink2">${_hbE(sayOf(g.n, g.v))} · ${Math.round(share * 100)}%</text>${bar}</g>`;
  });
  if (drawn < rows.length) legend += `<text x="${legX}" y="${(legY + drawn * rowH + rowH / 2 + 4).toFixed(1)}" font-size="12" class="hb-sv-mute">${_hbE(i18t(_hbFit.step === 'full' ? 'hb_more_rows_full' : 'hb_more_rows', { n: _hbN(rows.length - drawn), all: _hbN(rows.length) }))}</text>`;
  const total = cs.reduce((a, c) => a + hbValueOfOne(c), 0);
  const centre = `<text x="${cx}" y="${cy - 8}" text-anchor="middle" font-size="44" font-weight="700" class="hb-sv-ink">${_hbN(cs.length)}</text>
    <text x="${cx}" y="${cy + 16}" text-anchor="middle" font-size="13" class="hb-sv-ink2">${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}</text>
    ${money ? `<text x="${cx}" y="${cy + 38}" text-anchor="middle" font-size="15" font-weight="600" class="hb-sv-glow">${_hbE(_hbM(total))}</text>` : ''}`;
  return { body: `<svg class="hb-svg hb-ring${tall ? ' is-tall' : ''}" data-hb-yk="${money ? 'value' : 'count'}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(hbGroupWord(field))}">${slices}${centre}${legend}</svg>`, by: hbGroupWord(field), note: '' };
}
/* ---- THE BLOCKS, SQUARIFIED (owner picked "Squarified" by name, 11 Oct 2026,
   over Nested and The SAP way: "the chart is poorly designed and not in line
   with best in class") ----
   One block per group, sized by value, laid out squarified (Bruls et al.),
   in ONE hue that darkens with size — colour carries magnitude, never
   identity; the name, value, share and count are written inside where they
   fit, sentence case; the groups past HB_BLOCK_GROUPS are one grey block,
   a door onto them. 1px surface gaps between blocks. */
function hbSquarify(items, x, y, w, h){
  const tot = items.reduce((a, it) => a + it.v, 0) || 1, area = w * h;
  const q = items.map(it => Object.assign({}, it, { a: it.v / tot * area }));
  const out = []; let row = [];
  const worst = (r, len) => { if (!r.length) return Infinity; const s = r.reduce((a, t) => a + t.a, 0), mx = Math.max(...r.map(t => t.a)), mn = Math.min(...r.map(t => t.a)); return Math.max(len * len * mx / (s * s), (s * s) / (len * len * mn)); };
  const lay = r => { const s = r.reduce((a, t) => a + t.a, 0);
    if (w >= h){ const cw = s / h; let yy = y; r.forEach(t => { const th = t.a / cw; out.push(Object.assign(t, { x, y: yy, w: cw, h: th })); yy += th; }); x += cw; w -= cw; }
    else { const rh = s / w; let xx = x; r.forEach(t => { const tw = t.a / rh; out.push(Object.assign(t, { x: xx, y, w: tw, h: rh })); xx += tw; }); y += rh; h -= rh; } };
  q.forEach(t => { const len = Math.min(w, h); if (!row.length || worst(row.concat([t]), len) <= worst(row, len)) row.push(t); else { lay(row); row = [t]; } });
  if (row.length) lay(row);
  return out;
}
function _hbTileHtml(r, dig, title, hue, op, lines, extra){
  const gap = 1, x = r.x + gap, y = r.y + gap, w = Math.max(0, r.w - 2 * gap), h = Math.max(0, r.h - 2 * gap);
  const light = op < 0.55, ink = light ? 'class="hb-sv-ink"' : 'fill="#fff"', ink2 = light ? 'class="hb-sv-ink2"' : 'fill="#fff" fill-opacity=".85"';
  let txt = '';
  if (w > 64 && h > 34 && lines.length){
    const fits = h > 58 ? 3 : 2; let ty = y + 18;
    lines.slice(0, fits).forEach((L, i) => { const fs = i === 0 ? 12 : 11, s = _hbFitText(L, w - 16, fs); if (s) txt += `<text x="${(x + 8).toFixed(1)}" y="${ty.toFixed(1)}" style="font-size:${fs}px;font-weight:${i === 0 ? 600 : 400}" ${i === 0 ? ink : ink2}>${_hbE(s)}</text>`; ty += i === 0 ? 17 : 15; });
  }
  return `<g class="hb-sv-tile hb-in" ${_hbSvgDoor(dig, title, extra || '')}><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="3" style="fill:${hue}" fill-opacity="${op.toFixed(2)}"/>${txt}</g>`;
}
function hbBlocksSvg(D, cs, field, money, P){
  let groups = hbGroupsOf(cs.filter(c => hbValueOfOne(c) > 0), field, true);
  const unvalued = cs.length - groups.reduce((a, g) => a + g.n, 0);
  if (!groups.length) return hbRingSvg(D, cs, field, money, P);
  const cut = hbGroupsCut(groups, P || {}, HB_BLOCK_GROUPS, 'value', field);
  groups = cut.rest ? cut.rows.concat([cut.rest]) : cut.rows;
  const whole = groups.reduce((a, g) => a + g.v, 0) || 1;
  const vmax = Math.max(1, ...groups.filter(g => !g.rest).map(g => g.v));
  const hue = hbHues()[0], grey = '#8A9BB0';
  const W = hbFW(), H = hbFH(330);
  const pc = v => Math.round(v / whole * 100) + '%';
  let out = '';
  hbSquarify(groups.map(g => ({ g, v: g.v })), 0, 0, W, H).forEach(r => { const g = r.g;
    const dig = g.rest ? hbRestDig(D, field, cut.kept, 'b') : 'qg:' + D.key + HB_KEY_SEP + field + HB_KEY_SEP + g.g;
    const title = g.label + ': ' + _hbM(g.v) + ' · ' + _hbN(g.n) + ' · ' + pc(g.v);
    out += _hbTileHtml(r, dig, title, g.rest ? grey : hue, g.rest ? 0.3 : 0.3 + 0.7 * Math.sqrt(g.v / vmax),
      [g.label, _hbM(g.v) + ' · ' + pc(g.v), i18tn('hb_n_contracts', g.n, { n: _hbN(g.n) })], _hbYAttr(g.v));
  });
  return { body: `<svg class="hb-svg hb-blocks" data-hb-yk="value" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_by_blocks', { by: hbGroupWord(field) }))}">${out}</svg>`,
    by: i18t('hb_by_blocks', { by: hbGroupWord(field) }), note: unvalued ? i18t('hb_chart_unvalued', { n: _hbN(unvalued) }) : '' };
}
function hbTimelineSvg(D, cs, money){
  const today = hbToday(); const tY = Number(today.slice(0, 4)), tM = Number(today.slice(5, 7)) - 1;
  const mIdx = iso => (Number(iso.slice(0, 4)) - tY) * 12 + (Number(iso.slice(5, 7)) - 1 - tM) + (Number(iso.slice(8, 10)) - 1) / 30;
  const items = cs.map(c => ({ c, start: hbStartOf(c), end: hbEndOf(c), status: c.status || '' }));
  const ends = items.map(i => i.end).filter(Boolean).map(mIdx), starts = items.map(i => i.start).filter(Boolean).map(mIdx);
  let m0 = Math.floor(Math.min(-3, ...starts.map(s => Math.max(s, -12)))); let m1 = Math.ceil(Math.max(9, ...ends.map(e => Math.min(e, 30))));
  if (m1 - m0 > HB_TL_MONTHS) m0 = m1 - HB_TL_MONTHS;
  /* ON A CARD THE TIMELINE FITS THE STEP (O-22, 8 Oct 2026): the height is
     the step's; rows are packed only as far as that height holds, a lane
     with no room is not drawn, and every pill left out is counted and said
     under the chart. Off a card it is drawn as before. */
  const fitted = !!_hbFit, tight = fitted && _hbFit.step === 'board';
  const months = m1 - m0; const W = hbFW(), L = Math.min(190, Math.round(hbFW() * 0.28)), Rm = 16, axisY = tight ? 28 : 34, laneGap = tight ? 8 : 14;
  const X = m => L + (W - L - Rm) * (Math.max(m0, Math.min(m1, m)) - m0) / months;
  const keyOf = m => { const y = tY + Math.floor((tM + m) / 12), mo = ((tM + m) % 12 + 12) % 12; return y + '-' + String(mo + 1).padStart(2, '0'); };
  const order = HB_STATUS_ORDER.concat([...new Set(items.map(i => i.status))].filter(s => !HB_STATUS_ORDER.includes(s)));
  /* a lane's contracts with no end date are ONE line ("6 with no end date"),
     a door onto them, so they never crowd the dated ones off the card */
  const lanes = order.map(s => { const all = items.filter(i => i.status === s), noEnd = all.filter(i => !i.end);
    const list = noEnd.length > 1 ? all.filter(i => i.end).concat([{ summary: true, n: noEnd.length, ids: noEnd.map(i => i.c.id), c: noEnd[0].c, start: null, end: null, status: s }]) : all;
    return { s, label: hbGroupLabel('status', s), list, all }; }).filter(l => l.list.length);
  let out = '', lanesOut = '', y = axisY + 14;
  /* a contract with no end date is a dot and its words: it holds the row for
     as far as its words run, so nothing is drawn over them (11 Oct 2026) */
  const pxMonth = (W - L - Rm) / months, fsPack = 10.5;
  const noEndWord = it => it.summary ? i18tn('hb_tl_noend', it.n, { n: _hbN(it.n) }) : hbRef(it.c) + ' · ' + i18t('hb_c_no_end');
  const noEndMonths = it => (66 + _hbTextW(noEndWord(it), fsPack) + 12) / pxMonth;
  const span = (it, short) => { const e = it.end ? mIdx(it.end) : null; let s = it.start ? mIdx(it.start) : (e != null ? e - 1 : 0); if (short && e != null) s = Math.max(s, e - HB_TL_SHORT);
    if (e == null) s = Math.max(m0, Math.min(m1, s)); return [s, e != null ? e : s + noEndMonths(it)]; };
  /* pills pack into rows per lane; a crowded set keeps only the last months
     of each pill so the lanes stay short, and past the cap the rest is said */
  const pack = (short, cap) => { const placed = []; let rowsUsed = 0, left = 0;
    lanes.forEach(l => { l.list.sort((a, b) => span(a, short)[0] - span(b, short)[0]); const rows = [];
      l.list.forEach(it => { const [s, e] = span(it, short); let ri = rows.findIndex(last => last + 0.35 < s);
        if (ri < 0){ if (rowsUsed + rows.length + 1 > cap){ left++; return; } rows.push(e); ri = rows.length - 1; } else rows[ri] = e;
        placed.push([l, ri, it, s, e]); });
      l.n = rows.length; rowsUsed += rows.length; });
    return { placed, rowsUsed, left }; };
  let P = pack(false, HB_TL_ROWS); if (P.left || P.rowsUsed > HB_TL_PACK) P = pack(true, HB_TL_ROWS);
  /* a crowded chart takes tighter rows and a smaller face; the word "past end" is a key drawn once */
  const rowH = fitted ? (tight ? 18 : 20) : (P.rowsUsed > HB_TL_PACK ? 16 : 20), fs = rowH > 16 ? 10.5 : 9, ty = rowH / 2 + 3.5; let anyPast = false;
  const laneTall = () => lanes.reduce((a, l) => a + (l.n ? l.n * rowH + laneGap : 0), 0);
  if (fitted){ const room = hbFH(0) - axisY - 14 - 36; let cap = Math.min(HB_TL_ROWS, P.rowsUsed);
    while (cap > 1 && laneTall() > room){ cap--; P = pack(true, cap); } }
  const placed = P.placed, left = P.left;
  const H = fitted ? hbFH(0) : axisY + 14 + lanes.reduce((a, l) => a + l.n * rowH + laneGap, 0) + 36;
  /* a long span names every second or third month, so the names never run together */
  const nameEvery = Math.max(1, Math.ceil(months / 14), fitted ? Math.ceil(52 / ((W - L - Rm) / months)) : 1);
  const txAt = X(mIdx(today));
  for (let i = 0; i < months; i++){ const m = m0 + i; const x = X(m), x2 = X(m + 1); const k = keyOf(m); const mo = ((tM + m) % 12 + 12) % 12;
    const underToday = Math.abs((x + x2) / 2 - txAt) < 26 + _hbTextW(i18tn('hb_tl_end_n', 9, { n: '9' }), 11) / 2;
    const n = items.filter(it => it.end && it.end.slice(0, 7) === k).length;
    out += `<rect x="${x.toFixed(1)}" y="${axisY}" width="${(x2 - x).toFixed(1)}" height="${H - axisY - 30}" class="${Math.floor(mo / 3) % 2 ? 'hb-sv-qtr' : ''}" fill="${Math.floor(mo / 3) % 2 ? '' : 'transparent'}"/>`;
    if (mo % 3 === 0) out += `<line x1="${x.toFixed(1)}" y1="${axisY}" x2="${x.toFixed(1)}" y2="${H - 30}" class="hb-sv-grid"/>`;
    const label = hbMonthLabel(k, false); const ttl = label + (n ? ': ' + i18tn('hb_tl_end_n', n, { n: _hbN(n) }) : '');
    out += `<g class="hb-sv-month" ${_hbSvgDoor(n ? 'qm:' + D.key + HB_KEY_SEP + 'm' + HB_KEY_SEP + k : '', ttl)}><rect x="${x.toFixed(1)}" y="${axisY - 24}" width="${(x2 - x).toFixed(1)}" height="22" fill="transparent"/>${i % nameEvery === 0 ? `<text x="${(x + 4).toFixed(1)}" y="${axisY - 8}" font-size="11" class="hb-sv-ink2">${_hbE(label)}</text>` : ''}
      ${n && i % nameEvery === 0 && !underToday ? `<text x="${((x + x2) / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle" font-size="11" font-weight="600" class="hb-sv-ink2">${_hbE(i18tn('hb_tl_end_n', n, { n: _hbN(n) }))}</text>` : ''}</g>`; }
  lanes.filter(l => !fitted || l.n).forEach(l => { const top = y; const lv = l.all.reduce((a, it) => a + hbValueOfOne(it.c), 0); const hue = hbHueOf('status', l.s, 0);
    lanesOut += `<g class="hb-sv-lane" ${_hbSvgDoor('qg:' + D.key + HB_KEY_SEP + 'status' + HB_KEY_SEP + l.s, l.label + ': ' + (money ? _hbM(lv) + ' · ' : '') + _hbN(l.all.length))}><rect x="0" y="${top - 2}" width="${L - 10}" height="${l.n * rowH}" fill="transparent"/><rect x="4" y="${top - 2}" width="3" height="${l.n * rowH}" rx="1.5" style="fill:${hue}"/>
      <text x="12" y="${top + 14}" font-size="13" font-weight="600" class="hb-sv-ink">${_hbE(l.label)}</text>${!fitted || l.n * rowH >= 30 ? `<text x="12" y="${top + 30}" font-size="11" class="hb-sv-ink2">${_hbE(_hbN(l.all.length))}${money ? ' · ' + _hbE(_hbM(lv)) : ''}</text>` : ''}</g>`;
    placed.filter(p => p[0] === l).forEach(([, ri, it, s, e]) => { const yy = top + ri * rowH; const xs = X(s), past = it.end && it.end < today && it.status === 'Signed', xe = it.end ? X(e) : xs + 8; const fill = past ? 'var(--hb-ruby)' : hue;
      const ttl = hbRef(it.c) + ' · ' + String(it.c.name || '') + (it.c.counterparty ? ' · ' + it.c.counterparty : '') + (money ? ': ' + _hbM(hbValueOfOne(it.c)) : '') + ' · ' + (it.end ? i18t('hb_tl_ends', { d: hbMonthLabel(it.end.slice(0, 7), false) }) : i18t('hb_c_no_end'));
      if (past) anyPast = true;
      if (it.end) out += `<g class="hb-sv-pill hb-in" style="animation-delay:${Math.min(ri, 12) * 40}ms" ${_hbSvgDoor('c:' + it.c.id, ttl)}><rect x="${xs.toFixed(1)}" y="${yy + 3}" width="${Math.max(6, xe - xs).toFixed(1)}" height="${rowH - 7}" rx="${rowH > 16 ? 6 : 4}" style="fill:${fill}" opacity="${it.status === 'Declined' ? '.4' : '.9'}"/>${xe - xs > 120 && _hbTextW(hbRef(it.c) + (it.c.counterparty ? ' · ' + it.c.counterparty : ''), fs) + 14 <= xe - xs ? `<text x="${(xs + 8).toFixed(1)}" y="${(yy + ty).toFixed(1)}" font-size="${fs}" font-weight="600" fill="${HB_TILE_INK}">${_hbE(hbRef(it.c) + (it.c.counterparty ? ' · ' + it.c.counterparty : ''))}</text>` : xe - xs > 52 && _hbTextW(hbRef(it.c), fs) + 12 <= xe - xs ? `<text x="${(xs + 7).toFixed(1)}" y="${(yy + ty).toFixed(1)}" font-size="${fs}" font-weight="600" fill="${HB_TILE_INK}">${_hbE(hbRef(it.c))}</text>` : ''}</g>`;
      /* A NAME NEVER RUNS PAST THE CARD (21 Oct 2026, the full-screen timeline): a bar's words are drawn only
         where they fit inside it (above); an undated contract's dot and words start early enough to end in the chart */
      else { const xu = Math.max(L, Math.min(xs, W - Rm - (66 + _hbTextW(noEndWord(it), fs))));
      out += `<g class="hb-sv-pill hb-in" style="animation-delay:${Math.min(ri, 12) * 40}ms" ${_hbSvgDoor(it.summary ? 'q2:' + D.key + HB_KEY_SEP + 'status' + HB_KEY_SEP + l.s + HB_KEY_SEP + 'd.m.end' + HB_KEY_SEP + 'none' : 'c:' + it.c.id, it.summary ? l.label + ' · ' + noEndWord(it) : ttl)}><rect x="${xu.toFixed(1)}" y="${yy + 2}" width="200" height="${rowH - 4}" fill="transparent"/><circle cx="${(xu + 4).toFixed(1)}" cy="${yy + rowH / 2 - 0.5}" r="${rowH > 16 ? 5 : 4}" style="fill:${fill}"/><line x1="${(xu + 12).toFixed(1)}" y1="${yy + rowH / 2 - 0.5}" x2="${(xu + 60).toFixed(1)}" y2="${yy + rowH / 2 - 0.5}" style="stroke:${fill}" stroke-dasharray="2 4"/><text x="${(xu + 66).toFixed(1)}" y="${(yy + ty).toFixed(1)}" font-size="${fs}" class="hb-sv-ink2">${_hbE(noEndWord(it))}</text></g>`; } });
    y += l.n * rowH + laneGap; });
  const tx = X(mIdx(today));
  if (anyPast) out += `<rect x="12" y="${H - 24}" width="10" height="10" rx="2" class="hb-sv-ruby"/><text x="27" y="${H - 15}" font-size="11" class="hb-sv-ink2">${_hbE(i18t('hb_tl_past'))}</text>`;
  out += `<line x1="${tx.toFixed(1)}" y1="${axisY - 2}" x2="${tx.toFixed(1)}" y2="${H - 30}" class="hb-sv-today" stroke-width="1.5" stroke-dasharray="4 3"/><rect x="${(tx - 22).toFixed(1)}" y="${H - 28}" width="44" height="16" rx="8" class="hb-sv-today-pill"/><text x="${tx.toFixed(1)}" y="${H - 16}" text-anchor="middle" font-size="10.5" font-weight="700" fill="${HB_TILE_INK}">${_hbE(i18t('hb_tl_today'))}</text>`;
  return { body: `<svg class="hb-svg hb-tl" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_by_timeline'))}"><line x1="${L}" y1="${axisY}" x2="${W - Rm}" y2="${axisY}" class="hb-sv-axis"/>${out}${lanesOut}</svg>`,
    by: i18t('hb_by_timeline'), note: !left ? '' : fitted ? i18t(_hbFit.step === 'full' ? 'hb_more_rows_full' : 'hb_more_rows', { n: _hbN(left), all: _hbN(items.length) }) : i18t('hb_chart_more', { n: _hbN(left) }) };
}
function hbBubblesSvg(D, cs){
  const W = hbFW(), H = hbFH(360), L = 70, R = 30, T = 28, B = 46, xmin = -90, xmax = 450;
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
    out += `<g class="hb-sv-bub hb-in" style="animation-delay:${Math.min(i, 12) * 40}ms" ${_hbSvgDoor('c:' + c.id, ttl)}><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" style="fill:${hbHueOf('status', c.status || '', 0)}" opacity=".78" class="hb-sv-bub-edge"/>${named.has(c.id) || (days < 90 && v >= ymax * 0.4) ? `<text x="${(x + r + 4).toFixed(1)}" y="${(y + 4).toFixed(1)}" font-size="11" font-weight="600" class="hb-sv-ink">${_hbE(hbRef(c))}</text>` : ''}</g>`; });
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
const HB_PICS = ['cols', 'gantt', 'ring', 'bars', 'blocks', 'bubbles', 'list', 'stack', 'grouped', 'heat', 'waterfall', 'funnel', 'multi', 'spread', 'forecast'];
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
const HB_SHOWS = ['running', 'share', 'growth'];
const HB_UNITS = ['m', 'q', 'y'];
const HB_DATES = ['end', 'signed', 'start', 'created', 'decision'];
const HB_SPLIT_GROUPS = ['status', 'folder', 'counterparty', 'owner', 'kind', 'side', 'payterms', 'valueBand', 'move', 'rounds', 'overdue', 'decision', 'risks', 'standards', 'liabcap', 'autorenew', 'priceup'];
/* THE RECIPE'S OTHER PARTS (work order Part 1, 4 Oct 2026): the pictures two
   splits need, the order, the top N, the period, the comparison, the name */
const HB_PICS2 = ['stack', 'grouped', 'heat', 'multi'];
/* THE FOUR PICTURES ANALYSTS EXPECT (G8 of the Board Upgrade Proposals, the
   owner's "Build", 10 Oct 2026): the WATERFALL (how the book moved over a
   period: live at the start, signed, ended, live at the end — the four always
   add up), the FUNNEL (how far the contracts got: raised, reached review,
   signed), SMALL MULTIPLES (the same small chart once per group, on one
   scale; two splits like a stack) and the SPREAD (days to sign by a group:
   fastest, typical, slowest). Each draws only what the record can carry, and
   says what it left out. */
const HB_PICS_OWN_SPLIT = ['waterfall', 'funnel', 'forecast'];
const HB_SORTS = ['value', 'count', 'name'];
const HB_DIRS = ['down', 'up'];
const HB_COMPARES = ['prev', 'year', 'range'];
const HB_TOP_MAX = 50, HB_TITLE_MAX = 80, HB_SERIES_MAX = 6, HB_HEAT_MAX = 12, HB_HEAT_BOARD_ROWS = 8;
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
        ['forecast', /\b(?:as |in )?(?:a )?(?:(?:renewal )?forecast|projection|prognos(?:is)?|renewal outlook)\b/],
        ['waterfall', /\b(?:as |in )?(?:a )?(?:waterfall(?: chart)?|value bridge|bridge chart|vattenfall(?:sdiagram)?)\b/],
        ['funnel', /\b(?:as |in )?(?:a )?(?:(?:conversion |sales |signing )?funnel(?: chart)?|tratt(?:diagram)?)\b/],
        ['multi', /\b(?:as )?(?:small multiples|(?:a|one) (?:small )?(?:chart|graph) (?:per|for each)|små multiplar|ett (?:litet )?diagram per)\b/],
        ['spread', /\b(?:as |in )?(?:a )?(?:box ?plots?|box[- ]and[- ]whiskers?|spread of (?:days|time|signing)|signing spread|lådagram|spridning)\b/],
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
  /* THE BUBBLES PICTURE'S OWN WORDS (one-build work order A1, 7 Oct 2026):
     "value against time left" is what the bubbles picture draws */
  timeLeft: /\b(?:(?:against|versus|vs\.?|by|over|mot)\s+)?(?:the\s+)?(?:time left|time remaining|months left|time to expiry|time until expiry|time to end|tid kvar)\b/,
  running: /\b(?:running total|cumulative(?:ly)?|add(?:ed|ing)? up over time|ackumulerat|löpande summa)\b/,
  /* GROWTH IN % (A3 of the Board Upgrade Proposals, 10 Oct 2026): each
     column's change from the one before, said on the column */
  growth: /(?<![\wåäö])(?:growth (?:rate|in %|in percent)|growth %|percent(?:age)? change|% change|change in %|change in percent|tillväxt i %|tillväxttakt|procentuell förändring)(?![\wåäö])/,
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
  filler: /\b(?:and|then|first|with|add|och|sedan|when|how|much|total|overall|sum|average|avg|sign|what|whats|do|does|did|will|by|per|each|every|over|time|as|an?|on|in|at|into|getting|draw|make|create|build|plot|me|it|them|these|they|we|our|take|takes|took|is|are|was|were|been|be|end|ends|ended|ending|expir\w*|start|starts|starting|started|signed|signing|created|raised|renewal|renewals|renew|renewing|decision|decisions|date|dates|new|month|months|quarter|quarters|year|years|chart|graph|than|then|so|far|has|have|had|live|active|under|managed|management|altogether|faster|slower|more|fewer|less|längre|när|per|varje|som|av|på|i|of)\b/g,
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
  const timeLeft = !!take(HB_RC.timeLeft);
  let pic = null;
  for (const [p, re] of HB_RC.pic){ if (take(re)){ pic = p; break; } }
  if (!pic && timeLeft) pic = 'bubbles';
  if (!pic && group2 && stackBy === group2) pic = 'stack';
  const chartWord = !!take(HB_RC.chart);
  let measure = exposure ? 'exposure' : null;
  if (!measure) for (const k of ['exposure', 'medianDaysToSign', 'medianValue', 'avgValue', 'daysToSign', 'rounds', 'payDays']){ if (take(HB_RC.m[k])){ measure = k; break; } }
  const show = take(HB_RC.running) ? 'running' : take(HB_RC.growth) ? 'growth' : take(HB_RC.share) ? 'share' : null;
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
  /* the waterfall and the funnel draw the book, not a split; the spread
     draws days to sign by a group (G8) */
  if (HB_PICS_OWN_SPLIT.includes(P.pic)){
    P.split = null; drop('compare'); P.trend = false;
    P.measure = P.measure === 'value' && hbMoneyOk() ? 'value' : 'count';
    if (P.pic === 'waterfall' && !P.window){ P.window = { last: 12, unit: 'm' }; P.winSaid = true; }
    if (P.pic === 'forecast') drop('window');
  } else if (P.pic === 'spread'){
    drop('compare'); P.trend = false;
    P.measure = 'medianDaysToSign';   /* the box's middle line is the median: the measure says so */
    if (!P.split || P.split.by === 'date' || P.split.by === 'valueBand') P.split = { by: hbNextGroup(((D && D.fixed) || []).concat('status')) };
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
    if (!adds || P.split2 || P.compare || ((P.show === 'running' || P.show === 'growth') && P.pic !== 'cols') || (P.show === 'share' && !['bars', 'ring', 'blocks'].includes(P.pic))) drop('show');
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
  /* A COUNT, AN AMOUNT OR A WAIT IS NEVER BELOW NOTHING (bug log, 10 Oct
     2026): a steep fall drew the line under the axis and said "-3 contracts".
     Where every point is at or above zero, so is the line. */
  const floor = pts.every(p => p.y >= 0) ? (v => Math.max(0, v)) : (v => v);
  return { i0, i1, y0: floor(a0 + b * i0), y1: floor(a0 + b * i1), n: k };
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
  const W = hbFW(), H = hbFH(320), L = 64, R = 18, Tp = 30, B = 52, base = H - B;
  /* INSTRUMENT (O-23): thin flat bars, about 62% of their slot, radius 2 */
  const extra = none.length ? 1.6 : 0, n = cols.length, step = (W - L - R) / Math.max(1, n + extra), cw = Math.min(_hbFit ? 64 : 28, step * (_hbFit ? 0.62 : 0.52));
  const band = Array.isArray(P.band) && P.band.length === 2 ? P.band : null;
  /* REFERENCE LINES (G5, 10 Oct 2026): the reader's own switches for this
     card — the average of the columns drawn, the same column a year back
     (faint, behind), and a target they typed. Each is said where it is drawn. */
  const RF = hbRefsOf(D.key, P);
  const meanOf = cols.filter(c => !c.edge && !c.sofar && c.list.length && c.M.y != null);
  const avgY = RF.avg && meanOf.length ? meanOf.reduce((a, c) => a + c.M.y, 0) / meanOf.length : null;
  let ghost = null;
  if (RF.ly && (unit === 'm' || unit === 'q')){
    const back = unit === 'm' ? 12 : 4, out = new Set(unsigned), all = (_hbRunAll || cs).filter(c => !out.has(c));
    ghost = cols.map(c => { if (c.edge) return null; const pb = hbBucketMove(c.b, unit, -back); const list = all.filter(x => hbBucketOf(hbDateOf(x, date), unit) === pb);
      return list.length ? { b: pb, y: hbMeasure(list, m).y || 0, k: list.length } : null; });
  }
  const tgtY = RF.tgt != null && isFinite(RF.tgt) ? RF.tgt : null;
  /* UNUSUAL COLUMNS (C5, 10 Oct 2026): asked for by the reader, found by
     HaTi's own arithmetic — far from the typical column (the median, with a
     robust spread), at least twice it or half it — and each says why */
  const odd = hbOddCols(_hbOddOn.has(D.key) ? cols : null, unit);
  const ys = cols.map(c => c.M.y || 0).concat(none.length ? [hbMeasure(none, m).y || 0] : []).concat(T ? [T.y0, T.y1] : []).concat(band || [])
    .concat(avgY != null ? [avgY] : []).concat(tgtY != null ? [tgtY] : []).concat(ghost ? ghost.filter(Boolean).map(x => x.y) : []);
  const top = hbAxisTop(Math.max(...ys, 0) * 1.12, m !== 'rounds', hbGridN());
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top), X = i => L + step * (i + 0.5);
  const fmtAxis = v => m === 'value' ? _hbM(v) : m === 'rounds' ? hbMeasureFmt(m, v) : _hbN(Math.round(v));
  let g = '';
  const gN = hbGridN();
  for (let k = 0; k <= gN; k++){ const v = top * k / gN, y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(fmtAxis(v))}</text>`; }
  if (_hbFit) g += `<defs><pattern id="hb-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" class="hb-sv-hatchbg"/><line x1="0" y1="0" x2="0" y2="6" class="hb-sv-hatch" stroke-width="2.5"/></pattern></defs>`;
  /* labels pick their moments (O-23): the biggest value and the latest one */
  const realCols = cols.map((c, i) => ({ c, i })).filter(o => !o.c.edge && o.c.list.length);
  const bigI = realCols.length ? realCols.reduce((a, o) => ((o.c.M.y || 0) > (a.c.M.y || 0) ? o : a)).i : -1;
  const lastI = realCols.length ? realCols[realCols.length - 1].i : -1;
  /* every value only where it has the room; else the biggest and the latest (G3) */
  const valRoom = step >= Math.max(...realCols.map(o => _hbTextW(hbMeasureShort(m, o.c.M.y), 12)), 0) + 6;
  const valShown = i => !_hbFit || (_hbFit.step === 'full' && valRoom) || i === bigI || i === lastI || (P.show === 'growth' && step >= 34);
  /* growth in %: the change from the column before, on each column (A3) */
  const gTxt = i => { const a = cols[i], b = cols[i - 1]; if (!b || a.edge || b.edge || !(b.M.y > 0)) return i ? '—' : '';
    const p = Math.round(((a.M.y || 0) - b.M.y) / b.M.y * 100); return (p > 0 ? '+' : p < 0 ? '−' : '') + _hbN(Math.abs(p)) + '%'; };
  const colPath = (x, y) => { const x0 = _hbSnap(x - cw / 2), x1 = _hbSnap(x + cw / 2); y = _hbSnap(y); const h = base - y, r = Math.min(_hbFit ? 2 : 4, h, (x1 - x0) / 2); if (h <= 0.5) return ''; return `M${x0.toFixed(1)},${base} L${x0.toFixed(1)},${(y + r).toFixed(1)} Q${x0.toFixed(1)},${y.toFixed(1)} ${(x0 + r).toFixed(1)},${y.toFixed(1)} L${(x1 - r).toFixed(1)},${y.toFixed(1)} Q${x1.toFixed(1)},${y.toFixed(1)} ${x1.toFixed(1)},${(y + r).toFixed(1)} L${x1.toFixed(1)},${base} Z`; };
  const labelEvery = _hbEvery(cols.filter(c => !c.edge).map(c => hbBucketLabel(c.b, unit, true)), step, 12, n > 18 ? 2 : 1);
  /* the shelf's normal range, and the column it is about (hbInsFinding) */
  if (band) g += `<rect x="${L}" y="${(Math.min(Y(band[1]), Y(band[0]) - 10)).toFixed(1)}" width="${W - R - L}" height="${Math.max(10, Y(band[0]) - Y(band[1])).toFixed(1)}" class="hb-sv-band"/>`;
  /* last year, faint and a little to the left, behind this year's column */
  if (ghost) ghost.forEach((x, i) => { if (!x || !(x.y > 0)) return; const gx = _hbSnap(X(i) - cw / 2 - cw * 0.3), gy = _hbSnap(Y(x.y));
    g += `<rect x="${gx}" y="${gy}" width="${_hbSnap(cw)}" height="${Math.max(0.5, base - gy)}" rx="2" class="hb-sv-ghost"><title>${_hbE(hbBucketLabel(x.b, unit, false) + ': ' + (m === 'count' ? _hbN(x.k) : hbMeasureFmt(m, x.y) + ' · ' + _hbN(x.k)))}</title></rect>`; });
  cols.forEach((c, i) => {
    const x = X(i), y = Y(c.M.y || 0), past = forward && !c.edge && c.b < nowB;
    const cls = P.lit && c.b === P.lit ? 'hb-sv-collit' : T ? 'hb-sv-colq' : c.edge ? 'hb-sv-coledge' : past ? 'hb-sv-colpast' : 'hb-sv-col';
    const lbl = hbBucketLabel(c.b, unit, true);
    const yearLine = !c.edge && unit !== 'y' && (i === 0 || (unit === 'm' ? c.b.slice(5) === '01' : c.b.slice(5) === 'Q1'));
    const nWord = _hbN(c.list.length) + ' ' + i18tn('hb_contracts_word', c.list.length, { n: c.list.length });
    const say = hbBucketLabel(c.b, unit, false) + ': ' + (c.list.length ? (m === 'count' ? nWord : hbMeasureFmt(m, c.M.y) + ' · ' + nWord) : i18t('hb_none_here'))
      + (c.hollow ? ' · ' + i18t('hb_tr_hollow_col', { min: HB_TREND_MIN_N }) : '') + (c.sofar && P.trend ? ' · ' + i18t('hb_tr_sofar_col') : '') + (odd.has(i) ? ' · ' + odd.get(i) : '');
    const pc = i > 0 && !c.edge && !cols[i - 1].edge && !c.sofar ? { y: cols[i - 1].M.y, l: hbBucketLabel(cols[i - 1].b, unit, false) } : null;
    g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(c.list.length ? c.dig : '', say, c.list.length && !c.edge ? _hbYAttr(c.M.y, pc) : '')}><rect x="${(x - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${base - Tp + 40}" fill="transparent"/>`
      + (c.hollow || (c.sofar && T) ? `<path d="${colPath(x, y)}" class="hb-sv-colhollow"/>` : (c.sofar && _hbFit) ? `<path d="${colPath(x, y)}" class="hb-sv-colsofar" fill="url(#hb-hatch)"/>` : `<path d="${colPath(x, y)}" class="${cls}"/>`)
      + (c.list.length && !T && (n <= 30) && valShown(i) ? `<text x="${x.toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(P.show === 'growth' ? gTxt(i) : hbMeasureShort(m, c.M.y))}</text>` : '')
      + (c.sofar && _hbFit && c.list.length ? `<text x="${x.toFixed(1)}" y="${(y - (valShown(i) ? 22 : 7)).toFixed(1)}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(i18t('hb_so_far'))}</text>` : '')
      + (odd.has(i) ? `<circle cx="${x.toFixed(1)}" cy="${(y - (valShown(i) ? 27 : 10)).toFixed(1)}" r="6" class="hb-sv-odd"/>` : '')
      + (i % labelEvery === 0 || c.edge ? `<text x="${x.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(lbl)}</text>` : '')
      + (yearLine ? `<text x="${x.toFixed(1)}" y="${base + 34}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(c.b.slice(0, 4))}</text>` : '') + `</g>`;
  });
  if (avgY != null){ const y = _hbSnap(Y(avgY)) + 0.5;
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="hb-sv-ref-avg"/><text x="${L + 4}" y="${(y - 5).toFixed(1)}" font-size="11" class="hb-sv-ink2 hb-sv-ref-t">${_hbE(i18t('hb_ref_avg_at', { v: hbMeasureShort(m, avgY) }))}</text>`; }
  if (tgtY != null){ const y = _hbSnap(Y(tgtY)) + 0.5;
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" class="hb-sv-ref-tgt"/><text x="${W - R - 2}" y="${(y - 5).toFixed(1)}" text-anchor="end" font-size="11" font-weight="600" class="hb-sv-amber hb-sv-ref-t">${_hbE(i18t('hb_ref_tgt_at', { v: hbMeasureShort(m, tgtY) }))}</text>`; }
  if (ghost && ghost.some(Boolean)) g += `<rect x="${W - R - 150}" y="4" width="9" height="9" rx="2" class="hb-sv-ghost"/><text x="${W - R - 137}" y="12" font-size="11" class="hb-sv-ink2">${_hbE(i18t('hb_ref_ly_key'))}</text>`;
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
  if (_hbOddOn.has(D.key)) note = [note, odd.size ? i18t('hb_odd_note', { list: [...odd.keys()].map(i => hbBucketLabel(cols[i].b, unit, false) + ' (' + odd.get(i) + ')').join('; ') }) : i18t('hb_odd_none', { units: i18tn('hb_tr_units_' + unit, 2, { n: 2 }) })].filter(Boolean).join(' ');
  const leftN = avg ? cs.length - cols.reduce((a, c) => a + c.M.n, 0) - (none.length ? hbMeasure(none, m).n : 0) : 0;
  if (leftN > 0) note = [note, i18t('hb_ms_left', { n: _hbN(leftN), what: i18t('hb_ms_' + m).toLowerCase() })].filter(Boolean).join(' ');
  /* what is left off is said with its money, so a small total is never
     mistaken for the book's (the 1-billion question) */
  const offV = hbMoneyOk() && unsigned.length ? unsigned.reduce((a, c) => a + hbValueOfOne(c), 0) : 0;
  if (unsigned.length) note = [note, offV > 0 ? i18tn('hb_cols_unsigned_value', unsigned.length, { n: _hbN(unsigned.length), v: _hbM(offV) }) : i18tn('hb_cols_unsigned', unsigned.length, { n: _hbN(unsigned.length) })].filter(Boolean).join(' ');
  const by = hbSplitWord(P.split);
  const money = hbMoneyOk();
  const lead = unsigned.length ? `<b>${_hbN(cs.length)}</b> ${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}${money ? hbLeadMoneyHtml(cs, m) : ''}` : '';
  return { lead, body: `<svg class="hb-svg hb-cols" data-hb-yk="${_hbYKind(m, P.show)}" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note, say,
    trend: T ? { y0: T.y0, y1: T.y1, span: T.i1 - T.i0 + 1, unit } : null,
    /* the columns as counted, for the shelf's normal range: the chart's own
       numbers, so a picture can never say what its open chart would not */
    cols: cols.filter(c => !c.edge).map(c => ({ b: c.b, y: c.M.y, n: c.M.n, left: c.M.left || 0, sofar: !!c.sofar, hollow: !!c.hollow, k: c.list.length, dig: c.dig })), unit, nowB,
    /* and what the reading says beside them: the edges, the undated, the unsigned */
    edges: cols.filter(c => c.edge).map(c => ({ b: c.b, y: c.M.y, left: c.M.left || 0, k: c.list.length, dig: c.dig })), none: none.length, noneDig: door('none'),
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
  const W = hbFW(), H = hbFH(300), L = 64, R = 18, Tp = 30, B = 46, base = H - B, n = Math.max(snaps.length, HB_TREND_MIN_PTS), step = (W - L - R) / n;
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
function hbAxisTop(v, whole, n){
  /* a float's leftover (1e-12) is nothing, never a scale of its own */
  if (!(v > 1e-6)) v = 0;
  /* as many nice steps as the chart draws gridlines (three on a board card,
     G2: "0, 11, 21, 32" was four steps cut in three) */
  const k = n > 0 ? n : 4;
  const step0 = hbNiceMax((v > 0 ? v : 1) / k);
  return (whole ? Math.max(1, Math.ceil(step0)) : step0) * k;
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
    rows = rows.concat([{ g: null, rest: true, label: cut.rest.label, n: cut.rest.n, v: M.y || 0, say: hbMeasureFmt(m, M.y) + (m === 'count' ? '' : ' · ' + _hbN(cut.rest.n)), dig: hbRestDig(D, field, cut.kept, m === 'value'), color: '' }]); }
  /* SHARE OF TOTAL: each bar says its part of the whole */
  if (P.show === 'share'){ const tot = rows.reduce((a, r) => a + (r.v || 0), 0) || 1; rows.forEach(r => { r.say = _hbN(Math.round((r.v || 0) / tot * 100)) + '% · ' + r.say; }); }
  return { body: hbChartBarsHtml(rows, true, P.show === 'share' ? _hbYKind(m) : _hbYKind(m, P.show)), by: hbSplitWord(P.split) + (m !== 'count' ? ' · ' + i18t('hb_ms_' + m).toLowerCase() : '') + (P.show ? ' · ' + i18t('hb_show_' + P.show).toLowerCase() : ''), note: '', rows };
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
    if ((p === 'waterfall' || p === 'funnel') && P.compare) return opt(p, word, false, i18t('hb_why_cmp_pic'));
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
    let _dcs = null; const dataCs = () => _dcs || (_dcs = Array.isArray(D.ids) ? hbListOf(D.ids, hbS().lens) : []);
    const own = !['cols', 'bars', 'stack', 'grouped', 'heat', 'multi'].includes(P.pic);
    /* the new pictures' own measures (G8): the waterfall and the funnel count
       or add money; the spread is always days to sign */
    const ownOk = k => P.pic === 'spread' ? k === 'medianDaysToSign' : HB_PICS_OWN_SPLIT.includes(P.pic) ? (k === 'count' || k === 'value') : k === 'count';
    return HB_MEASURES.map(k => {
      if (own && !ownOk(k)) return opt(k, i18t('hb_ms_' + k), false, i18t(P.pic === 'spread' ? 'hb_why_spread_measure' : 'hb_why_own_measure'));
      if (hbMoneyMeasure(k) && !money) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_money'));
      if (k === 'live' && (!isDate || P.split2)) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_date'));
      /* A MEASURE THESE CONTRACTS CANNOT ANSWER IS NOT A CHOICE (owner, 11 Oct
         2026): no rounds on record, no risk read, no payment days — it would
         draw nothing, so it is not listed */
      if (!['count', 'live', 'value'].includes(k)){ const M = hbMeasure(dataCs(), k); if (!(M && M.n > 0 && M.y != null)) return opt(k, i18t('hb_ms_' + k), false, i18t('hb_why_no_data')); }
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
/* ---- A CHOICE THAT CANNOT BE PRESSED IS NOT ON THE LIST (owner, 10 Oct
   2026: "If a choice in the filter can not be clicked on and provide results
   then it should not be a choice in the filter at all") ----
   Reverses the grey-with-its-reason rule for these menus only: hbRcOptions
   still answers every option with its reason (the readings and their tests
   ask it), and the two menus that DRAW it ask this. The choice in use is
   always kept, ticked, so a menu never opens empty; a group's heading moves
   to the first shown choice of its group. The list is asked again at every
   open, so a choice comes back the moment another part makes it work. */
function hbRcShown(part, P, D){
  const out = []; let head = '';
  (hbRcOptions(part, P, D) || []).forEach(x => {
    if (x.head) head = x.head;                       /* a group starts here */
    const keep = x.on || (part !== 'which' && hbRcCurHas(part, P, x.v));
    if (!keep) return;
    const y = Object.assign({}, x, { on: true, why: x.on ? x.why : '' });
    delete y.head;
    if (head) { y.head = head; head = ''; }          /* on its first shown choice */
    out.push(y);
  });
  return out;
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
    const menu = open ? `<div class="hb-rmenu" role="menu" aria-label="${_hbE(label)}">${hbRcShown(part, P, D).map(x => {
      const cur = part === 'which' ? ((o.which || 'set') === x.v) : hbRcCurHas(part, P, x.v);
      return (x.head ? `<div class="hb-rmenu-h" role="presentation">${_hbE(x.head)}</div>` : '') + `<button type="button" role="menuitemradio" aria-checked="${cur}" data-hb-rset="${_hbE(part + ':' + x.v)}"${x.on ? '' : ' disabled'}${x.why ? ` title="${_hbE(x.why)}"` : ''}><span>${_hbE(x.word)}</span>${x.why ? `<small>${_hbE(x.why)}</small>` : cur ? `<b aria-hidden="true">${_hbTick}</b>` : ''}</button>`; }).join('')}<div class="hb-rmenu-foot" role="presentation">${_hbE(i18t('hb_rc_free'))}</div></div>` : '';
    return `<span class="hb-rwrap"><button type="button" class="hb-rc${open ? ' is-open' : ''}" data-hb-rc="${part}" aria-haspopup="menu" aria-expanded="${open}"><i>${_hbE(label)}</i><span>${_hbE(value)}</span>${_hbCaret}</button>${menu}</span>`;
  };
  const which = D.whole ? i18t('hb_rc_all') : (D.setLabel || D.crumb || '');
  const whichChip = canWhich ? chip('which', i18t('hb_rc_which'), which)
    : `<span class="hb-rwrap"><span class="hb-rc is-still" title="${_hbE(i18t('hb_rc_which_still'))}"><i>${_hbE(i18t('hb_rc_which'))}</i><span>${_hbE(which)}</span></span></span>`;
  const canTrend = P.pic === 'cols' && P.measure !== 'live' && !P.compare;
  /* the Trend switch is drawn only where a trend can be drawn (owner, 10 Oct
     2026: "hide it too"); hb_why_trend stays in both books, inert */
  const trend = canTrend ? `<button type="button" class="hb-tg${P.trend ? ' is-on' : ''}" data-hb-rtrend aria-pressed="${!!P.trend}"><span class="hb-tg-sl" aria-hidden="true"></span>${_hbE(i18t('hb_rc_trend'))}</button>` : '';
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
  /* THE RECIPE READS AS ONE SENTENCE (C1, 10 Oct 2026): the same choices,
     the part names kept for a screen reader, joined by plain words — "The
     whole book · by month · as Month columns · counting Count" */
  const join = w => `<span class="hb-rjoin" aria-hidden="true">${_hbE(i18t(w))}</span>`;
  return `<div class="hb-recipe is-sentence" role="group" data-hb-rkey="${_hbE(D.key)}" aria-label="${_hbE(i18t('hb_rc_menu'))}">${whichChip}${chip('split', i18t('hb_rc_split'), hbSplitWord(P.split))}${join('hb_rc_as')}${chip('pic', i18t('hb_rc_pic'), hbPicWord(P))}${join('hb_rc_counting')}${chip('measure', i18t('hb_rc_measure'), i18t('hb_ms_' + P.measure))}${shown}${trend}${moreBtn}</div>`;
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
  /* WHERE YOU STARTED (owner, 11 Oct 2026: "a back button / arrow (small
     one) that brings you back to where you started so you do not get lost"):
     the recipe as it was before the first press is kept once per card */
  if (!seed){ s.recipeStart = s.recipeStart || {}; if (!(key in s.recipeStart)) s.recipeStart[key] = s.recipe[key] ? JSON.parse(JSON.stringify(s.recipe[key])) : null; }
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
/* has this card moved from where it started? */
function hbMovedFromStart(key){
  const s = hbS(), st = s.recipeStart || {};
  if (!(key in st)) return false;
  return JSON.stringify(st[key] || {}) !== JSON.stringify((s.recipe || {})[key] || {});
}
/* back to where it started: the card's first recipe, and on the open card the
   first step of its trail */
function hbBackToStart(key, inFocus){
  const s = hbS(), st = s.recipeStart || {};
  if (key in st){ const was = st[key]; delete st[key];
    /* through the one writer (hbCardSet, as a seed: no new start is kept) */
    delete s.recipe[key]; if (was) hbCardSet(key, was, { seed: true });
    (s.panels || []).forEach(p => { if (p.kind === 'view' && p.key === key) p.recipe = was ? JSON.parse(JSON.stringify(was)) : p.recipe; }); }
  if (inFocus && Array.isArray(s.path) && s.path.length > 1){ const root = s.path[0]; s.path = [root]; if (root in st) return hbBackToStart(root, false); }
  hbSave();
}
function hbStartBtnHtml(key, inFocus){
  const s = hbS(), deep = inFocus && (s.path || []).length > 1;
  if (!key || !(deep || hbMovedFromStart(key))) return '';
  return `<button type="button" class="hb-ib hb-to-start" data-hb-to-start="${_hbE(key)}"${inFocus ? ' data-hb-to-start-focus' : ''} title="${_hbE(i18t('hb_to_start'))}" aria-label="${_hbE(i18t('hb_to_start'))}">${_hbBack}</button>`;
}
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
  /* the sides read We are paid, We pay, then the contracts with no side on file */
  if (field === 'side'){ const r = hbGroupsSorted(rows, P, m, '_side'); const none = r.filter(x => !x.g); return r.filter(x => x.g).sort((a, b) => (a.g === 'customer' ? 0 : 1) - (b.g === 'customer' ? 0 : 1)).concat(none); }
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
/* A17 (the board as drawn, 11 Oct 2026): a legend's colour square switches
   its series off and on, for the sitting; the name stays the door onto the
   group. A hidden series is left out of the columns and their totals and
   drawn faded in the legend, so the reader always sees what is off. */
const _hbSerOff = new Map();
function hbSerOff(key){ return _hbSerOff.get(key) || new Set(); }
function hbSerToggle(key, v){ const s = new Set(hbSerOff(key)); if (s.has(v)) s.delete(v); else s.add(v); if (s.size) _hbSerOff.set(key, s); else _hbSerOff.delete(key); }
function hbStackSvg(D, cs, P){
  const m = P.measure, grouped = P.pic === 'grouped';
  const off = hbSerOff(D.key);
  const X = hbXOf(D, cs, P), f2 = P.split2.by;
  const ser = hbSeriesOf(cs, f2, P, HB_SERIES_MAX);
  const series = ser.rows.map((r, i) => ({ g: r.g, label: r.label, hue: hbHueOf(f2, r.g, i), v: '' + r.g }))
    .concat(ser.rest ? [{ g: null, rest: true, label: ser.rest.label, hue: '#9FB3C8', v: '~' + ser.kept + (ser.mv ? 'v' : 'n') }] : []);
  const inSer = (c, S) => S.rest ? !ser.rows.some(r => r.g === hbGroupOf(c, f2)) : hbGroupOf(c, f2) === S.g;
  const cells = X.cols.map(col => ({ col, parts: series.map(S => { const list = off.has(S.v) ? [] : col.list.filter(c => inSer(c, S)); return { S, list, M: hbMeasure(list, m) }; }) }));
  const tops = cells.map(x => grouped ? Math.max(0, ...x.parts.map(p => p.M.y || 0)) : x.parts.reduce((a, p) => a + (p.M.y || 0), 0));
  const W = hbFW(), R = 18, Tp = 46, n = Math.max(1, cells.length);
  const colWord = (col, whole) => col.b === 'none' ? i18t('hb_c_no_date') : whole ? (col.full || col.label) : col.label;
  /* names that do not fit flat are angled, with the room under the axis and
     to the left that they need (hbAngleOf) */
  const A = X.time ? null : hbAngleOf(cells.map(x => colWord(x.col)), (W - 64 - R) / n, 12, cells.map(x => colWord(x.col, true)));
  /* the slanted names take their height UNDER the chart, never out of it */
  const L = A ? Math.max(64, hbAngleLeft(cells.map(x => colWord(x.col, true)), A, (W - 64 - R) / n, 3) + 6) : 64, B = A ? 20 + A.up : 52, H = hbFH(340) + B - 52, base = H - B, step = (W - L - R) / n;
  const top = hbAxisTop(Math.max(...tops, 0) * 1.1, m !== 'rounds', hbGridN());
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top);
  const fmtAxis = v => m === 'value' ? _hbM(v) : m === 'rounds' ? hbMeasureFmt(m, v) : _hbN(Math.round(v));
  let g = '';
  const gN = hbGridN();
  for (let k = 0; k <= gN; k++){ const v = top * k / gN, y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(fmtAxis(v))}</text>`; }
  /* the legend: each colour a door onto its group, over the period drawn */
  /* the legend wraps onto a second line; past that, what it left out is said (G3) */
  let lx = L, ly = 6, lostS = 0;
  series.forEach(S => { const w = Math.min(200, 26 + _hbTextW(S.label, 12));
    if (lx + w > W - R && ly < 20 && lx > L){ lx = L; ly += 17; }
    if (lx + w > W - R){ lostS++; return; }
    const isOff = off.has(S.v), sw = i18t(isOff ? 'hb_ser_show' : 'hb_ser_hide', { what: S.label });
    g += `<g class="hb-sv-sw${isOff ? ' is-off' : ''}" transform="translate(${lx.toFixed(1)},${ly})" data-hb-ser="${_hbE(S.v)}" data-hb-ser-key="${_hbE(D.key)}" tabindex="0" role="switch" aria-checked="${!isOff}" aria-label="${_hbE(sw)}"><title>${_hbE(sw)}</title><rect x="-4" y="-4" width="18" height="18" fill="transparent"/><rect x="0" y="0" width="10" height="10" rx="2" style="${isOff ? `fill:none;stroke:${S.hue}` : `fill:${S.hue}`}"/></g>`
      + `<g class="hb-sv-row${isOff ? ' is-off' : ''}" transform="translate(${(lx + 15).toFixed(1)},${ly})" ${_hbSvgDoor(S.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + f2 + HB_KEY_SEP + S.g, S.label)}><text x="0" y="9.5" font-size="12" class="hb-sv-ink2">${_hbE(_hbFitText(S.label, w - 20, 12))}</text></g>`;
    lx += w; });
  if (lostS) g += `<text x="${(W - R).toFixed(1)}" y="${ly + 9.5}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(i18t('hb_legend_more', { n: _hbN(lostS) }))}</text>`;
  const labelEvery = X.time ? _hbEvery(cells.filter(x => !x.col.edge).map(x => x.col.label), step, 12, n > 18 ? 2 : 1) : 1;
  cells.forEach((x, i) => {
    const cx = L + step * (i + 0.5), cw = Math.min(grouped ? (_hbFit ? 64 : 40) : (_hbFit ? 48 : 30), step * (_hbFit ? 0.62 : 0.66));
    let y0 = base;
    x.parts.forEach((p, j) => {
      const v = p.M.y || 0; if (!p.list.length || v <= 0) return;
      const say = `${x.col.full} · ${p.S.label}: ${m === 'count' ? _hbN(p.list.length) : hbMeasureFmt(m, p.M.y) + ' · ' + _hbN(p.list.length)}`;
      const dig = hbCellDig(D, X.tok, x.col.b, f2, p.S.v);
      if (grouped){ const bw = cw / series.length, bx = cx - cw / 2 + bw * j, y = Y(v);
        g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(dig, say, _hbYAttr(v))}><rect x="${_hbSnap(bx + 0.5)}" y="${_hbSnap(y)}" width="${Math.max(1, _hbSnap(bw - 1))}" height="${Math.max(0.5, base - _hbSnap(y))}" rx="2" style="fill:${p.S.hue}"/></g>`; }
      else { const y1 = Y((top * (1 - (y0 - Tp) / (base - Tp))) + v);
        g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 18) * 25}ms" ${_hbSvgDoor(dig, say, _hbYAttr(v))}><rect x="${_hbSnap(cx - cw / 2)}" y="${_hbSnap(y1)}" width="${_hbSnap(cw)}" height="${Math.max(0.5, _hbSnap(y0) - _hbSnap(y1) - (_hbFit ? 2 : 1))}" rx="2" style="fill:${p.S.hue}"/></g>`;
        y0 = y1; }
    });
    const tot = tops[i];
    if (!grouped && tot > 0 && n <= 30) g += `<text x="${cx.toFixed(1)}" y="${(Y(tot) - 7).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(hbMeasureShort(m, tot))}</text>`;
    if (A) g += hbAngleText(colWord(x.col, true), cx + 3, base + 14, A, 'end');
    else if (i % labelEvery === 0 || x.col.edge) g += `<text x="${cx.toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(x.col.b === 'none' ? i18t('hb_c_no_date') : _hbFitText(x.col.label, X.time ? step * labelEvery - 4 : step - 4, 12))}</text>`;
    if (X.time && !x.col.edge && X.unit !== 'y' && (i === 0 || (X.unit === 'm' ? String(x.col.b).slice(5) === '01' : String(x.col.b).slice(5) === 'Q1'))) g += `<text x="${cx.toFixed(1)}" y="${base + 34}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(String(x.col.b).slice(0, 4))}</text>`;
  });
  const note = X.unsigned.length ? i18tn('hb_cols_unsigned', X.unsigned.length, { n: _hbN(X.unsigned.length) }) : '';
  const by = hbByThen(P);
  return { body: `<svg class="hb-svg hb-stack" data-hb-yk="cell" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note,
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
  /* A LONG LIST IS CUT, AND THE CUT IS SAID (O-25): rows past the step's
     height are not drawn; counting is never capped, only drawing */
  const nC = Math.max(1, X.cols.length), W = hbFW();
  const colWord = (col, whole) => col.b === 'none' ? i18t('hb_c_no_date') : whole ? (col.full || col.label) : col.label;
  /* names that do not fit flat are angled over the grid, with the height
     and the room on the right that they need (hbAngleOf); the row names'
     column is then only as wide as its longest name, so the grid keeps its
     width, and the room on the right is never more than HB_ANGLE_SIDE of
     it (a name longer than that is cut, whole on the hover card) */
  const L0 = Math.min(190, Math.round(W * 0.3));
  let A = hbAngleOf(X.cols.map(col => colWord(col)), (W - L0 - 12) / nC, 12, X.cols.map(col => colWord(col, true)));
  const L = A ? Math.min(L0, Math.ceil(Math.max(0, ...rowsS.map(S => _hbTextW(S.label, 12.5)))) + 26) : L0;
  let R = 12;
  if (A){ const room = (W - L) * HB_ANGLE_SIDE, half = (W - L - 12) / nC / 2;
    if (A.out - half > room){ const k = (room + half) / A.out; A = { ...A, w: A.w * k, up: Math.ceil((A.up - A.fs) * k) + A.fs, out: Math.ceil(A.out * k) }; }
    R = Math.max(12, Math.ceil(A.out - half) + 4); }
  const Tp = A ? A.up + 16 : 36;
  /* ON THE BOARD THE CARD GROWS TO SHOW THE ROWS (owner, 11 Oct 2026: "it
     gives a chart that tells you a story and is not in full"): up to
     HB_HEAT_BOARD_ROWS rows are drawn whatever the step's height; past that
     the cut is said, as before */
  const allR = rowsS.length, fitR = _hbFit ? Math.floor((hbStepH(_hbFit.step) - 58 - (Tp - 36)) / 30) : allR;
  const capR = _hbFit ? Math.max(2, fitR, _hbFit.step === 'board' ? Math.min(allR, HB_HEAT_BOARD_ROWS) : 0) : allR;
  const cutR = allR > capR ? allR - (capR - 1) : 0;
  const gridAll = grid.slice();
  if (cutR){ rowsS.length = capR - 1; grid.length = capR - 1; }
  const nR = Math.max(1, rowsS.length);
  const cellH = 30, H = Tp + nR * cellH + 22, step = (W - L - R) / nC;
  let g = '';
  X.cols.forEach((col, i) => { const x = L + step * (i + 0.5);
    g += A ? hbAngleText(colWord(col, true), x - 3, Tp - 8, A, 'start')
      : `<text x="${x.toFixed(1)}" y="${Tp - 12}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(_hbFitText(colWord(col), step - 4, 12))}</text>`; });
  grid.forEach((row, ri) => { const y = Tp + ri * cellH, S = rowsS[ri];
    g += `<g class="hb-sv-row" ${_hbSvgDoor(S.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + f2 + HB_KEY_SEP + S.g, S.label)}><rect x="0" y="${y}" width="${L - 10}" height="${cellH}" fill="transparent"/><text x="8" y="${y + cellH / 2 + 4.5}" font-size="12.5" font-weight="600" class="hb-sv-ink">${_hbE(_hbFitText(S.label, L - 18, 12.5))}</text></g>`;
    row.forEach((x, ci) => { const cx = L + step * ci, v = x.list.length ? (x.M.y || 0) : 0, a = x.list.length ? 0.14 + 0.82 * v / max : 0;
      const say = `${x.col.full} · ${S.label}: ${x.list.length ? (m === 'count' ? _hbN(x.list.length) : hbMeasureFmt(m, x.M.y) + ' · ' + _hbN(x.list.length)) : i18t('hb_none_here')}`;
      g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(ri * 3 + ci, 30) * 12}ms" ${_hbSvgDoor(x.list.length ? hbCellDig(D, X.tok, x.col.b, f2, S.v) : '', say, x.list.length ? _hbYAttr(v) : '')}><rect x="${(cx + 1.5).toFixed(1)}" y="${y + 1.5}" width="${Math.max(1, step - 3).toFixed(1)}" height="${cellH - 3}" rx="3" class="${x.list.length ? 'hb-sv-heat' : 'hb-sv-track'}"${x.list.length ? ` fill-opacity="${a.toFixed(2)}"` : ''}/>${x.list.length && step > 26 ? `<text x="${(cx + step / 2).toFixed(1)}" y="${y + cellH / 2 + 4}" text-anchor="middle" font-size="12" font-weight="600" class="${a > 0.55 ? 'hb-sv-heat-ink' : 'hb-sv-ink'}">${_hbE(hbMeasureShort(m, x.M.y))}</text>` : ''}</g>`; });
  });
  const note = [X.unsigned.length ? i18tn('hb_cols_unsigned', X.unsigned.length, { n: _hbN(X.unsigned.length) }) : '',
    cutR ? i18t(_hbFit.step === 'board' ? 'hb_more_rows' : 'hb_more_rows_full', { n: _hbN(cutR), all: _hbN(allR) }) : ''].filter(Boolean).join(' ');
  const by = hbByThen(P);
  return { body: `<svg class="hb-svg hb-heat" data-hb-yk="cell" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note,
    cells: gridAll.flat().filter(x => x.list.length).map(x => ({ a: x.col.full, b: x.S.label, k: x.list.length, y: x.M.y, dig: hbCellDig(D, X.tok, x.col.b, f2, x.S.v) })), unsigned: X.unsigned.length };
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
  const W = hbFW(), L = 64, R = 18, Tp = 40, B = 52;
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
    const H = hbFH(320), base = H - B, n = Math.max(1, rows.length), step = (W - L - R) / n, cw = Math.min(22, step * 0.32);
    const top = hbAxisTop(Math.max(0, ...rows.map(r => Math.max(r.Mc.y || 0, r.Mp.y || 0))) * 1.12, m !== 'rounds');
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
      g += `<text x="8" y="${y + 14}" font-size="13" font-weight="600" class="hb-sv-ink">${_hbE(_hbFitText(r.full, LL - 18, 13))}</text><text x="8" y="${y + 31}" font-size="11.5" class="hb-sv-mute">${_hbE(hbCmpChange(hbCmpY(m, r.Mc), hbCmpY(m, r.Mp)))}</text>`
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
/* ============================================================
   THE FOUR NEW PICTURES (G8, 10 Oct 2026)
   ============================================================
   ONE READING PER PICTURE, hbExtraSets: the drawing and the door ('qx:')
   both ask it, so a piece's number is always the list it opens. */
const HB_FN_STAGES = ['raised', 'review', 'signed'];
const HB_SP_MIN = 3;
function _hbDayWord(iso){ try { return new Date(iso + 'T00:00:00').toLocaleDateString((typeof langLocale === 'function') ? langLocale() : undefined, { day: 'numeric', month: 'short', year: 'numeric' }); } catch (_){ return String(iso); } }
function _hbQuart(xs, q){ const k = xs.length; if (!k) return null; const at = (k - 1) * q, lo = Math.floor(at), hi = Math.ceil(at); return xs[lo] + (xs[hi] - xs[lo]) * (at - lo); }
function hbExtraSets(pic, P, cs0){
  const money = P.measure === 'value' && hbMoneyOk();
  const yOf = list => money ? list.reduce((a, c) => a + hbValueOfOne(c), 0) : list.length;
  if (pic === 'wf'){
    /* THE WATERFALL: live at the period's start + signed in it − ended in it =
       live at its end. An executed contract with no signing date has been
       live since before the period (signed is the stage, not the date). A
       contract whose end comes before its signing is left out and said. */
    const Z = hbWinOf(P); if (!hbWinSpanOk(Z)) return null;
    const F = Z.from, T = Z.to, start = [], add = [], gone = [], end = [];
    let undated = 0, odd = 0;
    cs0.forEach(c => {
      if (c.status !== 'Signed') return;
      const sd = hbDateOf(c, 'signed'), e = hbEndOf(c);
      if (sd && e && e < sd){ odd++; return; }
      const atStart = (!sd || sd < F) && (!e || e >= F), isNew = !!sd && sd >= F && sd <= T;
      if (!sd && atStart) undated++;
      if (atStart) start.push(c);
      if (isNew) add.push(c);
      if ((atStart || isNew) && e && e >= F && e <= T) gone.push(c);
      if ((!sd || sd <= T) && (!e || e > T)) end.push(c);
    });
    const future = T > hbToday();
    const parts = [
      { k: 'start', list: start, word: i18t('hb_wf_at', { d: _hbDayWord(F) }) },
      { k: 'new', list: add, word: i18t('hb_wf_new') },
      { k: 'gone', list: gone, word: i18t(future ? 'hb_wf_gone_soon' : 'hb_wf_gone') },
      { k: 'end', list: end, word: i18t('hb_wf_at', { d: _hbDayWord(T) }) }];
    parts.forEach(x => { x.y = yOf(x.list); });
    return { parts, money, F, T, undated, odd, future };
  }
  const W = P.window ? hbWindowCut(cs0, P) : null, cs = W ? W.cs : cs0;
  if (pic === 'fn'){
    /* THE FUNNEL: how far the contracts got. A stage reached is the stage now
       or a later one; a declined contract is counted as raised only (the list
       does not carry how far it got before it was declined) — and said. */
    const rank = { 'Draft': 0, 'Under Review': 1, 'Signed': 2 };
    const reached = (c, i) => (rank[c.status] != null ? rank[c.status] : -1) >= i;
    const parts = HB_FN_STAGES.map((k, i) => ({ k: String(i), list: i === 0 ? cs.slice() : cs.filter(c => reached(c, i)), word: i18t('hb_fn_' + k) }));
    parts.forEach(x => { x.y = yOf(x.list); });
    return { parts, money, declined: cs.filter(c => c.status === 'Declined').length };
  }
  if (pic === 'fc'){
    /* THE FORECAST: what is up for renewal each of the next 12 months — low
       (only what renews by itself), high (everything renews), likely (low plus
       the rest at the past renewal rate; not drawn under HB_FC_MIN decisions) */
    const m0 = hbBucketOf(hbToday(), 'm'), months = []; let b = m0;
    for (let i = 0; i < 12; i++){ months.push(b); b = hbBucketNext(b, 'm'); }
    const dec = cs0.map(c => c && c.renewalDecision && c.renewalDecision.answer).filter(a => RENEWAL_ANS_FC.includes(a));
    const kept = dec.filter(a => a !== 'lapse').length, rate = dec.length >= HB_FC_MIN ? kept / dec.length : null;
    const parts = months.map(mb => { const list = cs0.filter(c => c.status === 'Signed' && hbBucketOf(hbEndOf(c), 'm') === mb);
      const auto = list.filter(c => _hbAuto(c));
      const hi = yOf(list), lo = yOf(auto);
      return { k: mb, list, word: hbBucketLabel(mb, 'm', false), y: hi, hi, lo, li: rate == null ? null : lo + (hi - lo) * rate }; });
    return { parts, money, rate, decisions: dec.length };
  }
  if (pic === 'ms'){
    const m = P.measure, kind = hbMissKind(m);
    const list = !kind ? [] : kind === 'value' ? cs.filter(c => !(hbValueOfOne(c) > 0)) : cs.filter(c => hbMeasureOne(c, m) == null);
    return { parts: [{ k: '0', list, word: i18t('hb_how_word_' + (kind || 'value')), y: list.length }] };
  }
  if (pic === 'sp'){
    /* THE SPREAD: days from raised to signed, per group — fastest, the middle
       half, the typical (median) and the slowest */
    const field = (P.split && P.split.by) || 'kind', groups = new Map();
    let left = 0;
    cs.forEach(c => { const d = hbMeasureOne(c, 'daysToSign'); if (d == null){ left++; return; }
      const g = hbGroupOf(c, field); const x = groups.get(g) || { list: [], days: [] }; x.list.push(c); x.days.push(d); groups.set(g, x); });
    const parts = [...groups.entries()].map(([g, x]) => { const xs = x.days.slice().sort((a, b) => a - b);
      return { k: String(g), g, list: x.list, word: hbGroupLabel(field, g), n: xs.length, min: xs[0], max: xs[xs.length - 1], q1: _hbQuart(xs, 0.25), med: _hbQuart(xs, 0.5), q3: _hbQuart(xs, 0.75), xs, y: _hbQuart(xs, 0.5) }; })
      .sort((a, b) => b.n - a.n || a.med - b.med || a.word.localeCompare(b.word));
    return { parts, field, left };
  }
  return null;
}
function _hbAxisGrid(W, L, R, Y, top, fmt){
  let g = ''; const gN = hbGridN();
  for (let k = 0; k <= gN; k++){ const v = top * k / gN, y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${L - 8}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-mute">${_hbE(fmt(v))}</text>`; }
  return g;
}
function hbWaterfallSvg(D, cs0, P){
  const X = hbExtraSets('wf', P, cs0);
  if (!X) return { body: `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`, by: i18t('hb_pic_waterfall'), note: '' };
  const money = X.money, fmt = v => money ? _hbM(v) : _hbN(Math.round(v));
  const [S0, A, G, E] = X.parts;
  const W = hbFW(), H = hbFH(300), L = 64, R = 18, Tp = 30, B = 46, base = H - B, step = (W - L - R) / 4, bw = Math.min(_hbFit ? 96 : 120, step * 0.56);
  const top = hbAxisTop(Math.max(S0.y, S0.y + A.y, E.y, 1) * 1.12, !money, hbGridN());
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top), Xc = i => L + step * (i + 0.5);
  const spans = [[0, S0.y, 'hb-sv-wf-total'], [S0.y, S0.y + A.y, 'hb-sv-col'], [S0.y + A.y - G.y, S0.y + A.y, 'hb-sv-wf-down'], [0, E.y, 'hb-sv-wf-total']];
  const sign = ['', '+', '−', ''].map((x, i) => X.parts[i].y > 0 ? x : '');
  let g = _hbAxisGrid(W, L, R, Y, top, fmt);
  X.parts.forEach((p, i) => {
    const [lo, hi, cls] = spans[i], x = _hbSnap(Xc(i) - bw / 2), yTop = _hbSnap(Y(hi)), yBot = _hbSnap(Y(lo));
    const say = p.word + ': ' + (money ? _hbM(p.y) + ' · ' + _hbN(p.list.length) : _hbN(p.list.length)) + ' ' + i18tn('hb_contracts_word', p.list.length, { n: p.list.length });
    const dig = p.list.length ? 'qx:' + D.key + HB_KEY_SEP + 'wf' + HB_KEY_SEP + p.k : '';
    g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${i * 60}ms" ${_hbSvgDoor(dig, say)}><rect x="${(Xc(i) - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${base - Tp + 30}" fill="transparent"/>`
      + `<rect x="${x}" y="${yTop}" width="${_hbSnap(bw)}" height="${Math.max(p.y ? 1 : 0, yBot - yTop)}" rx="2" class="${cls}"/>`
      + `<text x="${Xc(i).toFixed(1)}" y="${(yTop - 7).toFixed(1)}" text-anchor="middle" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(sign[i] + fmt(p.y))}</text>`
      + `<text x="${Xc(i).toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(_hbFitText(p.word, step - 6, 12))}</text></g>`;
    if (i < 3){ const at = [S0.y, S0.y + A.y, S0.y + A.y - G.y][i], yy = _hbSnap(Y(at)) + 0.5;
      g += `<line x1="${(Xc(i) + bw / 2).toFixed(1)}" x2="${(Xc(i + 1) - bw / 2).toFixed(1)}" y1="${yy}" y2="${yy}" class="hb-sv-wf-link"/>`; }
  });
  const by = i18t('hb_by_waterfall', { from: _hbDayWord(X.F), to: _hbDayWord(X.T) });
  const notes = [];
  if (X.undated) notes.push(i18tn('hb_wf_undated', X.undated, { n: _hbN(X.undated) }));
  if (X.odd) notes.push(i18tn('hb_wf_odd', X.odd, { n: _hbN(X.odd) }));
  if (X.future) notes.push(i18t('hb_wf_future'));
  const n = k => X.parts[k].list.length, v = k => fmt(X.parts[k].y);
  const door = (k, word) => ({ html: hbReadDoor(n(k), n(k) ? 'qx:' + D.key + HB_KEY_SEP + 'wf' + HB_KEY_SEP + X.parts[k].k : null, word) });
  const readLines = [
    { key: 'hb_read_wf', parts: { a: door(0, v(0)), b: door(3, v(3)), from: _hbDayWord(X.F), to: _hbDayWord(X.T) }, n: n(3) },
    { key: 'hb_read_wf_moves', parts: { add: door(1, (X.parts[1].y > 0 ? '+' : '') + v(1)), gone: door(2, (X.parts[2].y > 0 ? '−' : '') + v(2)) }, n: n(1) }];
  return { body: `<svg class="hb-svg hb-wf" data-hb-yk="run" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note: notes.join(' '), readLines, readCounts: X.parts.map(p => p.list.length),
    dataLines: ['Waterfall (step: ' + (money ? 'value' : 'contracts') + ', contracts):'].concat(X.parts.map(p => `- ${p.word}: ${Math.round(p.y * 10) / 10}, ${p.list.length}`)),
    lead: `<b>${_hbE(fmt(E.y))}</b> ${_hbE(i18t('hb_wf_lead', { d: _hbDayWord(X.T) }))}` };
}
const HB_FN_ROW_FULL = 96;
function hbFunnelSvg(D, cs, P){
  const X = hbExtraSets('fn', P, cs), money = X.money, fmt = v => money ? _hbM(v) : _hbN(Math.round(v));
  /* IN THE MIDDLE OF ITS ROOM (owner, 20 Oct 2026: "at least bring the chart
     in the middle of the page as opposed to leaving blank space"): the rows
     grow up to HB_FN_ROW_FULL in full screen, and whatever height is left
     over is shared above and below them, never all under */
  const W = hbFW(), H = hbFH(260), n = X.parts.length, rowH = Math.min(_hbFit && _hbFit.step === 'full' ? HB_FN_ROW_FULL : 64, (H - 16) / n), bh = Math.round(rowH * 0.62);
  const top = 8 + Math.max(0, Math.floor((H - 16 - n * rowH) / 2));
  const L = Math.min(200, Math.round(W * 0.26)), Rr = Math.min(130, Math.round(W * 0.16)), room = W - L - Rr, cx = L + room / 2;
  const max = Math.max(1, X.parts[0].y);
  let g = '';
  X.parts.forEach((p, i) => {
    const y = top + i * rowH, w = Math.max(p.y ? 4 : 0, room * p.y / max), last = i === n - 1;
    const say = p.word + ': ' + (money ? _hbM(p.y) + ' · ' : '') + _hbN(p.list.length) + ' ' + i18tn('hb_contracts_word', p.list.length, { n: p.list.length });
    const kept = i ? (X.parts[i - 1].y > 0 ? Math.round(p.y / X.parts[i - 1].y * 100) : null) : null;
    const dig = p.list.length ? 'qx:' + D.key + HB_KEY_SEP + 'fn' + HB_KEY_SEP + p.k : '';
    g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${i * 60}ms" ${_hbSvgDoor(dig, say, _hbYAttr(p.y))}><rect x="0" y="${y.toFixed(1)}" width="${W}" height="${rowH.toFixed(1)}" fill="transparent"/>`
      + `<rect x="${_hbSnap(cx - w / 2)}" y="${_hbSnap(y + (rowH - bh) / 2)}" width="${_hbSnap(w)}" height="${bh}" rx="3" class="${last ? 'hb-sv-col' : 'hb-sv-fn-step'}"/>`
      + `<text x="8" y="${(y + rowH / 2 - 2).toFixed(1)}" font-size="13" font-weight="600" class="hb-sv-ink">${_hbE(_hbFitText(p.word, L - 16, 13))}</text>`
      + `<text x="8" y="${(y + rowH / 2 + 14).toFixed(1)}" font-size="12" class="hb-sv-ink2">${_hbE(fmt(p.y) + (money ? ' · ' + _hbN(p.list.length) : ''))}</text>`
      + (kept != null ? `<text x="${W - 8}" y="${(y + rowH / 2 + 4).toFixed(1)}" text-anchor="end" font-size="12" class="hb-sv-ink2">${_hbE(i18t('hb_fn_kept', { p: _hbN(kept) }))}</text>` : '') + '</g>';
  });
  const H2 = Math.max(H, 16 + n * rowH);
  const notes = X.declined ? [i18tn('hb_fn_declined', X.declined, { n: _hbN(X.declined) })] : [];
  const p0 = X.parts[0], pL = X.parts[n - 1];
  const door = (p, word) => ({ html: hbReadDoor(p.list.length, p.list.length ? 'qx:' + D.key + HB_KEY_SEP + 'fn' + HB_KEY_SEP + p.k : null, word) });
  const readLines = [{ key: 'hb_read_fn', parts: { a: door(p0, _hbN(p0.list.length)), b: door(pL, _hbN(pL.list.length)), p: _hbN(p0.y ? Math.round(pL.y / p0.y * 100) : 0) }, n: pL.list.length }];
  return { body: `<svg class="hb-svg hb-fn" data-hb-yk="run" viewBox="0 0 ${W} ${H2}" role="group" aria-label="${_hbE(i18t('hb_pic_funnel'))}">${g}</svg>`, by: i18t('hb_by_funnel'), note: notes.join(' '), readLines, readCounts: X.parts.map(p => p.list.length).concat(X.declined ? [X.declined] : []),
    dataLines: ['Funnel (stage: ' + (money ? 'value' : 'contracts') + ', contracts):'].concat(X.parts.map(p => `- ${p.word}: ${Math.round(p.y * 10) / 10}, ${p.list.length}`)) };
}
function hbSpreadSvg(D, cs, P){
  const X = hbExtraSets('sp', P, cs), parts = X.parts;
  const by = i18t('hb_by_spread', { by: hbGroupWord(X.field) });
  if (!parts.length) return { body: `<div class="hb-quiet">${_hbE(i18t('hb_spr_empty'))}</div>`, by, note: X.left ? i18tn('hb_spr_left', X.left, { n: _hbN(X.left) }) : '' };
  const W = hbFW(), H = hbFH(300), L = Math.min(190, Math.round(W * 0.26)), Rr = Math.min(150, Math.round(W * 0.2)), Tp = 10, B = 26;
  const rowH0 = 34, capR = Math.max(1, Math.floor((H - Tp - B) / rowH0)), drawn = parts.length > capR ? capR - 1 : parts.length, rows = parts.slice(0, Math.max(1, drawn));
  const rowH = Math.min(44, (H - Tp - B) / Math.max(1, rows.length + (parts.length > rows.length ? 1 : 0)));
  const top = hbAxisTop(Math.max(1, ...rows.map(p => p.max)), true), Xd = d => L + (W - L - Rr) * Math.max(0, d) / top;
  let g = '';
  for (let k = 0; k <= 4; k++){ const d = top * k / 4, x = _hbSnap(Xd(d)) + 0.5;
    g += `<line x1="${x}" x2="${x}" y1="${Tp}" y2="${H - B}" class="${k ? 'hb-sv-grid' : 'hb-sv-axis'}"/><text x="${x}" y="${H - 8}" text-anchor="middle" font-size="11" class="hb-sv-mute">${_hbE(i18tn('hb_days_n', Math.round(d), { n: _hbN(Math.round(d)) }))}</text>`; }
  rows.forEach((p, i) => {
    const y = Tp + i * rowH, cy = Math.round(y + rowH / 2) + 0.5, typ = Math.round(p.med);
    const say = p.word + ': ' + i18t('hb_spr_say', { t: i18tn('hb_days_n', typ, { n: _hbN(typ) }), lo: _hbN(Math.round(p.min)), hi: _hbN(Math.round(p.max)), n: _hbN(p.n) });
    const dig = 'qx:' + D.key + HB_KEY_SEP + 'sp' + HB_KEY_SEP + p.k;
    let mark = '';
    if (p.n >= HB_SP_MIN){
      mark = `<line x1="${Xd(p.min).toFixed(1)}" x2="${Xd(p.max).toFixed(1)}" y1="${cy}" y2="${cy}" class="hb-sv-sp-whisk"/>`
        + `<rect x="${_hbSnap(Xd(p.q1))}" y="${_hbSnap(cy - 8)}" width="${Math.max(2, _hbSnap(Xd(p.q3) - Xd(p.q1)))}" height="16" rx="3" class="hb-sv-sp-box"/>`
        + `<rect x="${(Xd(p.med) - 1.25).toFixed(1)}" y="${_hbSnap(cy - 9)}" width="2.5" height="18" class="hb-sv-sp-med"/>`;
    } else mark = p.xs.map(d => `<circle cx="${Xd(d).toFixed(1)}" cy="${cy}" r="4" class="hb-sv-sp-dot"/>`).join('');
    g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(i, 12) * 40}ms" ${_hbSvgDoor(dig, say, _hbYAttr(p.med))}><rect x="0" y="${y.toFixed(1)}" width="${W}" height="${rowH.toFixed(1)}" fill="transparent"/>${mark}`
      + `<text x="8" y="${cy + 4}" font-size="12.5" font-weight="600" class="hb-sv-ink">${_hbE(_hbFitText(p.word, L - 16, 12.5))}</text>`
      + `<text x="${W - 6}" y="${cy + 4}" text-anchor="end" font-size="12" class="hb-sv-ink2">${_hbE(i18t('hb_spr_typ', { t: i18tn('hb_days_n', typ, { n: _hbN(typ) }), n: _hbN(p.n) }))}</text></g>`;
  });
  const notes = [];
  if (parts.length > rows.length) notes.push(i18t(_hbFit && _hbFit.step === 'full' ? 'hb_more_rows_full' : 'hb_more_rows', { n: _hbN(parts.length - rows.length), all: _hbN(parts.length) }));
  if (X.left) notes.push(i18tn('hb_spr_left', X.left, { n: _hbN(X.left) }));
  if (rows.some(p => p.n < HB_SP_MIN)) notes.push(i18t('hb_spr_few', { min: HB_SP_MIN }));
  const fast = parts.filter(p => p.n >= HB_SP_MIN).sort((a, b) => a.med - b.med);
  const readLines = fast.length >= 2 ? [{ key: 'hb_read_sp', parts: { a: { html: hbReadDoor(fast[0].n, 'qx:' + D.key + HB_KEY_SEP + 'sp' + HB_KEY_SEP + fast[0].k, fast[0].word) }, at: _hbN(Math.round(fast[0].med)),
      b: { html: hbReadDoor(fast[fast.length - 1].n, 'qx:' + D.key + HB_KEY_SEP + 'sp' + HB_KEY_SEP + fast[fast.length - 1].k, fast[fast.length - 1].word) }, bt: _hbN(Math.round(fast[fast.length - 1].med)) }, n: fast[0].n }] : [];
  return { body: `<svg class="hb-svg hb-sp" data-hb-yk="avg" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note: notes.join(' '), readLines, readCounts: parts.map(p => p.n).concat(X.left ? [X.left] : []),
    dataLines: ['Days to sign (group: fastest, typical, slowest, signed):'].concat(parts.map(p => `- ${p.word}: ${Math.round(p.min)}, ${Math.round(p.med)}, ${Math.round(p.max)}, ${p.n}`)) };
}
/* SMALL MULTIPLES: the same small chart once per group of the second split,
   all on ONE scale, so the panels can be read against each other */
function hbMultiSvg(D, cs, P){
  const m = P.measure, X = hbXOf(D, cs, P), f2 = P.split2.by;
  const W = hbFW(), H = hbFH(340), gap = 12, colsN = Math.max(1, Math.min(4, Math.floor((W + gap) / (180 + gap))));
  const rowsMax = Math.max(1, Math.floor((H + gap) / (96 + gap)));
  const ser = hbSeriesOf(cs, f2, P, Math.max(1, colsN * rowsMax - 1));
  const series = ser.rows.map(r => ({ g: r.g, label: r.label, v: '' + r.g })).concat(ser.rest ? [{ g: null, rest: true, label: ser.rest.label, v: '~' + ser.kept + (ser.mv ? 'v' : 'n') }] : []);
  const inSer = (c, S) => S.rest ? !ser.rows.some(r => r.g === hbGroupOf(c, f2)) : hbGroupOf(c, f2) === S.g;
  const xs = X.cols.filter(c => c.b !== 'none');
  const cells = xs.map(col => ({ col, parts: series.map(S => { const list = col.list.filter(c => inSer(c, S)); return { S, list, M: hbMeasure(list, m) }; }) }));
  const top = hbAxisTop(Math.max(0, ...cells.flatMap(x => x.parts.map(p => p.M.y || 0))) * 1.1, m !== 'rounds');
  const rowsN = Math.max(1, Math.ceil(series.length / colsN)), pw = (W - gap * (colsN - 1)) / colsN, ph = Math.min(140, (H - gap * (rowsN - 1)) / rowsN);
  const nC = Math.max(1, xs.length);
  let g = '';
  series.forEach((S, si) => {
    const ox = (si % colsN) * (pw + gap), oy = Math.floor(si / colsN) * (ph + gap), head = 22, foot = 16, base = oy + ph - foot, inner = pw - 16, step = inner / nC, bw = Math.max(1, step * 0.62);
    const Y = v => oy + head + (base - oy - head) * (1 - Math.max(0, v) / top);
    const tot = hbMeasure(xs.flatMap(col => col.list.filter(c => inSer(c, S))), m);   /* what the panel draws */
    g += `<rect x="${_hbSnap(ox) + 0.5}" y="${_hbSnap(oy) + 0.5}" width="${_hbSnap(pw) - 1}" height="${_hbSnap(ph) - 1}" rx="6" class="hb-sv-panel"/>`
      + `<g class="hb-sv-row" ${_hbSvgDoor(S.rest ? '' : 'qg:' + D.key + HB_KEY_SEP + f2 + HB_KEY_SEP + S.g, S.label)}><rect x="${ox}" y="${oy}" width="${pw}" height="${head}" fill="transparent"/><text x="${(ox + 8).toFixed(1)}" y="${(oy + 15).toFixed(1)}" font-size="12" font-weight="600" class="hb-sv-ink">${_hbE(_hbFitText(S.label, pw - 70, 12))}</text></g>`
      + `<text x="${(ox + pw - 8).toFixed(1)}" y="${(oy + 15).toFixed(1)}" text-anchor="end" font-size="11" class="hb-sv-ink2">${_hbE(hbMeasureShort(m, tot.y))}</text>`
      + `<line x1="${(ox + 8).toFixed(1)}" x2="${(ox + pw - 8).toFixed(1)}" y1="${_hbSnap(base) + 0.5}" y2="${_hbSnap(base) + 0.5}" class="hb-sv-axis"/>`;
    cells.forEach((x, ci) => { const p = x.parts[si], v = p.M.y || 0; if (!p.list.length || v <= 0) return;
      const bx = ox + 8 + step * ci + (step - bw) / 2, y = Y(v);
      const say = `${x.col.full} · ${S.label}: ${m === 'count' ? _hbN(p.list.length) : hbMeasureFmt(m, p.M.y) + ' · ' + _hbN(p.list.length)}`;
      g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${Math.min(si * 3 + ci, 30) * 12}ms" ${_hbSvgDoor(hbCellDig(D, X.tok, x.col.b, f2, S.v), say, _hbYAttr(v))}><rect x="${_hbSnap(bx)}" y="${_hbSnap(y)}" width="${Math.max(1, _hbSnap(bw))}" height="${Math.max(0.5, _hbSnap(base) - _hbSnap(y))}" rx="1.5" class="hb-sv-col"/></g>`; });
    if (xs.length){ g += `<text x="${(ox + 8).toFixed(1)}" y="${(oy + ph - 4).toFixed(1)}" font-size="11" class="hb-sv-mute">${_hbE(_hbFitText(xs[0].label, pw / 2 - 12, 11))}</text>`
      + (xs.length > 1 ? `<text x="${(ox + pw - 8).toFixed(1)}" y="${(oy + ph - 4).toFixed(1)}" text-anchor="end" font-size="11" class="hb-sv-mute">${_hbE(_hbFitText(xs[xs.length - 1].label, pw / 2 - 12, 11))}</text>` : ''); }
  });
  const Hd = Math.max(H, rowsN * ph + gap * (rowsN - 1));
  const by = hbByThen(P), undated = X.cols.filter(c => c.b === 'none').reduce((a, c) => a + c.list.length, 0);
  const note = [X.unsigned.length ? i18tn('hb_cols_unsigned', X.unsigned.length, { n: _hbN(X.unsigned.length) }) : '', undated ? i18tn('hb_multi_undated', undated, { n: _hbN(undated) }) : ''].filter(Boolean).join(' ');
  return { body: `<svg class="hb-svg hb-multi" data-hb-yk="cell" viewBox="0 0 ${W} ${Hd}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by, note,
    cells: cells.map(x => ({ b: x.col.b, label: x.col.full, k: x.col.list.filter(c => series.some(S => inSer(c, S))).length, parts: x.parts.map(p => ({ g: p.S.g, label: p.S.label, k: p.list.length, y: p.M.y, dig: hbCellDig(D, X.tok, x.col.b, f2, p.S.v) })) })),
    series: series.map(S => ({ g: S.g, label: S.label, rest: !!S.rest })), unsigned: X.unsigned.length };
}
/* ONE RUN OF A CARD: the period cut, then the picture — the same for the
   card, its reading, the board described to Copilot and the shelf */
let _hbRunAll = null;
function hbChartRun(D, cs0, P){
  const money = hbMoneyOk();
  /* the waterfall reads the whole book against its period's two ends */
  const W = P.window && P.pic !== 'waterfall' && P.pic !== 'forecast' ? hbWindowCut(cs0, P) : null;
  const cs = W ? W.cs : cs0;
  let R;
  _hbRunAll = cs0;
  try {
  if (_hbWhatIf.has(D.key) && P.pic !== 'list') R = hbWhatIfSvg(D, cs, P);
  else if (P.pic === 'waterfall') R = hbWaterfallSvg(D, cs0, P);
  else if (P.pic === 'forecast') R = hbForecastSvg(D, cs0, P);
  else if (P.compare) R = hbCompareSvg(D, cs, P, W);
  else if (P.split2 && P.pic === 'heat') R = hbHeatSvg(D, cs, P);
  else if (P.split2 && P.pic === 'multi') R = hbMultiSvg(D, cs, P);
  else if (P.pic === 'funnel') R = hbFunnelSvg(D, cs, P);
  else if (P.pic === 'spread') R = hbSpreadSvg(D, cs, P);
  else if (P.split2 && (P.pic === 'stack' || P.pic === 'grouped')) R = hbStackSvg(D, cs, P);
  else if (P.pic === 'cols') R = hbColsSvg(D, cs, P);
  else if (P.pic === 'gantt') R = hbTimelineSvg(D, cs, money);
  else if (P.pic === 'bubbles') R = hbBubblesSvg(D, cs);
  else if (P.pic === 'blocks') R = hbBlocksSvg(D, cs, P.split.by, money, P);
  else if (P.pic === 'bars') R = hbGroupBars(D, cs, P);
  else if (P.pic === 'list') R = { body: '', by: '', note: '' };
  else R = hbRingSvg(D, cs, P.split.by, money, P);
  } finally { _hbRunAll = null; }
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
/* ============================================================
   COPILOT WORKING WITH YOU, AND THE ANALYST'S BOARD (C1–C8, A1–A10 of the
   Board Upgrade Proposals; the owner's "Build all C and A ideas", 10 Oct 2026)
   ============================================================ */
const _hbOddOn = new Set();
const _hbMed = xs => { const a = xs.slice().sort((p, q) => p - q), k = a.length; return k ? (k % 2 ? a[(k - 1) / 2] : (a[k / 2 - 1] + a[k / 2]) / 2) : 0; };
/* C5: which columns are far from the usual one, and why — HaTi's arithmetic */
function hbOddCols(cols, unit){
  const out = new Map(); if (!Array.isArray(cols)) return out;
  const pool = cols.map((c, i) => ({ c, i })).filter(o => !o.c.edge && !o.c.sofar && o.c.M && o.c.M.y != null);
  if (pool.length < 6) return out;
  const ys = pool.map(o => o.c.M.y || 0), med = _hbMed(ys);
  if (!(med > 0)) return out;
  const mad = _hbMed(ys.map(y => Math.abs(y - med))), band = Math.max(2.5 * 1.4826 * mad, med * 0.5);
  const word = i18tn('hb_tr_units_' + (unit || 'm'), 1, { n: 1 });
  pool.forEach(o => {
    const y = o.c.M.y || 0; if (Math.abs(y - med) <= band || (y < med * 2 && y > med / 2)) return;
    const x = Math.round(y / med * 10) / 10;
    let why = y > med ? i18t('hb_odd_up', { x: _hbN(x), unit: word }) : i18t('hb_odd_down', { unit: word });
    const list = o.c.list || [];
    if (list.length >= 3){ const by = new Map(); list.forEach(c => { const k = String(c.counterparty || ''); if (k) by.set(k, (by.get(k) || 0) + 1); });
      const top = [...by.entries()].sort((a, b) => b[1] - a[1])[0];
      if (top && top[1] / list.length >= 0.5) why += '; ' + i18t('hb_odd_who', { k: _hbN(top[1]), n: _hbN(list.length), who: top[0] }); }
    out.set(o.i, why);
  });
  return out;
}
/* C6 + A9: HOW THIS WAS COUNTED, AND WHAT IT STANDS ON — one line under a
   chart: the sum (or what an average is of), and the contracts the measure
   could not use, with a door onto them so they can be fixed */
const HB_HOW_PICS = ['cols', 'bars', 'ring', 'blocks', 'stack', 'grouped', 'heat'];
function hbMissKind(m){ return hbSignM(m) ? 'dates' : m === 'payDays' ? 'terms' : m === 'rounds' ? 'rounds' : m === 'exposure' ? 'read' : hbMoneyMeasure(m) ? 'value' : null; }
function hbHowHtml(D, P, R, cs){
  if (!HB_HOW_PICS.includes(P.pic) || P.compare || P.measure === 'live' || !cs.length) return '';
  const m = P.measure, kind = hbMissKind(m), n = cs.length;
  const X = kind ? hbExtraSets('ms', P, cs) : null, miss = X ? X.parts[0].list.length : 0;
  const used = n - miss;
  let what;
  if (m === 'count') what = i18tn('hb_how_count', n, { n: _hbN(n) });
  else if (hbAvgMeasure(m)) what = i18t('hb_how_avg', { what: i18t('hb_ms_' + m), n: _hbN(used) });
  else what = i18t('hb_how_sum', { v: hbMeasureFmt(m, hbMeasure(cs, m).y), n: _hbN(used) });
  if (P.show === 'share') what += ' · ' + i18t('hb_how_share');
  const door = miss ? ` <button type="button" class="hb-link hb-how-go" data-hb-dig="${_hbE('qx:' + D.key + HB_KEY_SEP + 'ms' + HB_KEY_SEP + '0')}">${_hbE(i18t('hb_how_show'))}</button>` : '';
  const base = miss ? ' ' + _hbE(i18t('hb_how_based', { k: _hbN(used), n: _hbN(n) })) + ' ' + _hbE(i18tn('hb_how_miss_' + kind, miss, { n: _hbN(miss) })) + door : '';
  return `<div class="hb-how"><b>${_hbE(i18t('hb_how_lead'))}</b> ${_hbE(what)}.${base}</div>`;
}
/* the money beside a chart's count: the value under contract, or — where the
   chart measures RISK EXPOSURE — the exposure it draws, from the same
   hbMeasure its reading says (Young, 6 Oct 2026: a card of money at risk led
   with the contracts' whole value) */
/* THE SAME NUMBERS AS A TABLE (O-25): read off the chart's own doors — each
   piece's hover note is "label: what it counts" — so the table can never say
   what the chart does not; every row is the same door. */
/* EVERY CHART THE BOARD DRAWS (work order "Home speed", Part 6, 8 Oct 2026:
   "fix this highlighted button so that when you click, it turn the chart to a
   table"): the SVG charts name a piece in a <title> ELEMENT, the bars and the
   month columns (hbChartBarsHtml, hbChartColsHtml) in a title ATTRIBUTE on the
   button. It read only the first, so a bar chart gave no rows and stayed a
   chart while its button said "Show as chart". ONE reader for both; a piece
   with nothing behind it (disabled, no door) is not a row. */
function hbChartTableHtml(svgHtml){
  if (typeof document === 'undefined') return '';
  const box = document.createElement('div'); box.innerHTML = svgHtml;
  const seen = new Set(), rows = [];
  box.querySelectorAll('[data-hb-dig]').forEach(el => {
    if (el.disabled) return;
    const t = el.querySelector('title'); const txt = t ? t.textContent : (el.getAttribute('title') || ''); const dig = el.getAttribute('data-hb-dig');
    if (!txt || seen.has(dig + txt)) return; seen.add(dig + txt);
    const at = txt.lastIndexOf(': ');
    rows.push({ label: at > 0 ? txt.slice(0, at) : txt, val: at > 0 ? txt.slice(at + 2) : '', dig });
  });
  if (!rows.length) return '';
  /* THE TABLE READS LIKE A TABLE (owner, 11 Oct 2026): money and the count
     in their own columns, each right-aligned in even-width digits; a piece
     the chart names without a number (a legend's key) is no row */
  const MONEY = /^[A-Z]{3} -?[\d.,]+[KMB]?$/, COUNT = /^(\d[\d,\s]*)(?: [^\d·]+)?$/;
  rows.forEach(r => { const parts = r.val ? r.val.split(' · ') : []; r.money = ''; r.count = ''; const rest = [];
    parts.forEach(p => { const q = p.trim(); if (!r.money && MONEY.test(q)) r.money = q; else if (!r.count && COUNT.test(q)) r.count = COUNT.exec(q)[1].trim(); else if (q) rest.push(q); });
    r.detail = rest.join(' · '); });
  const shown = rows.some(r => r.money || r.count) ? rows.filter(r => r.money || r.count || r.detail) : rows;
  const hasM = shown.some(r => r.money), hasN = shown.some(r => r.count), hasD = shown.some(r => r.detail);
  return `<table class="hb-ctab"><thead><tr><th>${_hbE(i18t('hb_tab_what'))}</th>${hasM ? `<th class="r">${_hbE(i18t('hb_tab_value'))}</th>` : ''}${hasN ? `<th class="r">${_hbE(i18t('hb_tab_contracts'))}</th>` : ''}${hasD ? `<th>${_hbE(i18t('hb_tab_detail'))}</th>` : ''}</tr></thead><tbody>`
    + shown.map(r => `<tr><td><button type="button" class="hb-link" data-hb-dig="${_hbE(r.dig)}">${_hbE(r.label)}</button></td>${hasM ? `<td class="r">${_hbE(r.money)}</td>` : ''}${hasN ? `<td class="r">${_hbE(r.count)}</td>` : ''}${hasD ? `<td>${_hbE(r.detail)}</td>` : ''}</tr>`).join('') + '</tbody></table>';
}
/* A6: THE FORECAST, WITH AN HONEST RANGE — never one guessed number */
const HB_FC_MIN = 5, RENEWAL_ANS_FC = ['renew', 'renegotiate', 'lapse'];
function hbForecastSvg(D, cs0, P){
  const X = hbExtraSets('fc', P, cs0), money = X.money, fmt = v => money ? _hbM(v) : _hbN(Math.round(v));
  const W = hbFW(), H = hbFH(300), L = 64, R = 18, Tp = 30, B = 40, base = H - B, n = X.parts.length, step = (W - L - R) / n, bw = Math.min(_hbFit ? 48 : 40, step * 0.62);
  const top = hbAxisTop(Math.max(1, ...X.parts.map(p => p.hi)) * 1.12, !money, hbGridN());
  const Y = v => Tp + (base - Tp) * (1 - Math.max(0, v) / top), Xc = i => L + step * (i + 0.5);
  let g = _hbAxisGrid(W, L, R, Y, top, fmt), line = [];
  X.parts.forEach((p, i) => {
    const x = _hbSnap(Xc(i) - bw / 2), say = p.word + ': ' + i18t('hb_fc_say', { lo: fmt(p.lo), hi: fmt(p.hi), n: _hbN(p.list.length) });
    const dig = p.list.length ? 'qx:' + D.key + HB_KEY_SEP + 'fc' + HB_KEY_SEP + p.k : '';
    g += `<g class="hb-sv-cbox hb-in" style="animation-delay:${i * 30}ms" ${_hbSvgDoor(dig, say, p.list.length ? _hbYAttr(p.hi) : '')}><rect x="${(Xc(i) - step / 2).toFixed(1)}" y="${Tp}" width="${step.toFixed(1)}" height="${base - Tp + 30}" fill="transparent"/>`
      + (p.hi > 0 ? `<rect x="${x}" y="${_hbSnap(Y(p.hi))}" width="${_hbSnap(bw)}" height="${Math.max(1, _hbSnap(Y(p.lo)) - _hbSnap(Y(p.hi)))}" rx="2" class="hb-sv-fc-band"/>` : '')
      + (p.lo > 0 ? `<rect x="${x}" y="${_hbSnap(Y(p.lo))}" width="${_hbSnap(bw)}" height="${Math.max(1, base - _hbSnap(Y(p.lo)))}" rx="2" class="hb-sv-fc-low"/>` : '')
      + `<text x="${Xc(i).toFixed(1)}" y="${base + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(hbBucketLabel(p.k, 'm', true))}</text></g>`;
    if (p.li != null) line.push(`${Xc(i).toFixed(1)},${Y(p.li).toFixed(1)}`);
  });
  if (line.length) g += `<polyline points="${line.join(' ')}" class="hb-sv-trend" stroke-width="2.5" fill="none"/>`;
  const sum = k => X.parts.reduce((a, p) => a + (p[k] || 0), 0), all = X.parts.reduce((a, p) => a + p.list.length, 0);
  const lead = `<b>${_hbE(fmt(sum('hi')))}</b> ${_hbE(i18t('hb_fc_lead'))}`;
  const note = [i18t('hb_fc_key'), X.rate == null ? i18t('hb_fc_no_rate', { n: _hbN(X.decisions), min: HB_FC_MIN }) : i18t('hb_fc_rate', { p: _hbN(Math.round(X.rate * 100)), n: _hbN(X.decisions) })].join(' ');
  const readLines = [{ key: X.rate == null ? 'hb_read_fc2' : 'hb_read_fc', parts: { lo: fmt(sum('lo')), hi: fmt(sum('hi')), li: X.rate == null ? '' : fmt(sum('li')), n: _hbN(all) }, n: all }];
  return { body: `<svg class="hb-svg hb-fc" data-hb-yk="value" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(i18t('hb_pic_forecast'))}">${g}</svg>`, by: i18t('hb_by_forecast'), note, lead, readLines, readCounts: [all].concat(X.parts.map(p => p.list.length)),
    dataLines: ['Up for renewal by month (month: if everything renews, renews by itself, contracts):'].concat(X.parts.map(p => `- ${p.word}: ${Math.round(p.hi * 10) / 10}, ${Math.round(p.lo * 10) / 10}, ${p.list.length}`)) };
}
/* A5: WHAT IF THESE DO NOT RENEW — a SCENARIO, drawn dashed and said so,
   never stored: the book's live value at each of the next 12 month-ends, as
   on record with these contracts renewed, against these contracts ending at
   their end dates. Nothing else in the book is touched. */
const _hbWhatIf = new Set();
function hbWhatIfToggle(key){
  if (_hbWhatIf.has(key)){ _hbWhatIf.delete(key); hbPaintBoard(); return; }
  const s = hbS(), D = hbDigData(key, s.lens); if (!D || D.kind !== 'list') return;
  const cs = hbWinCs(hbListOf(D.ids, s.lens), D), lim = hbIsoShift(hbToday(), 366);
  const ending = cs.filter(c => { const e = hbEndOf(c); return c.status === 'Signed' && e && e >= hbToday() && e <= lim; });
  if (!ending.length){ if (typeof toast === 'function') toast(i18t('hb_wi_none'), 'warn'); return; }
  _hbWhatIf.add(key); if (!s.digBig){ s.digBig = true; hbSave(); } hbPaintBoard({ jump: 'focus' });
}
function hbWhatIfSvg(D, cs, P){
  const money = hbMoneyOk(), yOf = l => money ? l.reduce((a, c) => a + hbValueOfOne(c), 0) : l.length, fmt = v => money ? _hbM(v) : _hbN(Math.round(v));
  const these = new Set(cs.map(c => c.id)), book = hbBook(hbS().lens).filter(c => c.status === 'Signed');
  const ends = []; let b = hbBucketOf(hbToday(), 'm'); for (let i = 0; i < 12; i++){ ends.push(hbBucketEnd(b, 'm')); b = hbBucketNext(b, 'm'); }
  const liveAt = (c, d, renew) => { const e = hbEndOf(c); return !e || e > d || (renew && (these.has(c.id) || _hbAuto(c))) || (!renew && !these.has(c.id) && _hbAuto(c)); };
  const base = ends.map(d => yOf(book.filter(c => liveAt(c, d, true)))), scen = ends.map(d => yOf(book.filter(c => liveAt(c, d, false))));
  const W = hbFW(), H = hbFH(300), L = 64, R = 18, Tp = 34, Bm = 40, bot = H - Bm, n = ends.length, step = (W - L - R) / n, bw = Math.min(_hbFit ? 44 : 36, step * 0.62);
  const top = hbAxisTop(Math.max(1, ...base) * 1.1, !money, hbGridN());
  const Y = v => Tp + (bot - Tp) * (1 - Math.max(0, v) / top), Xc = i => L + step * (i + 0.5);
  let g = _hbAxisGrid(W, L, R, Y, top, fmt);
  g += `<text x="${L}" y="14" font-size="11" font-weight="700" letter-spacing=".06em" class="hb-sv-amber">${_hbE(i18t('hb_wi_tag'))}</text>`;
  ends.forEach((d, i) => { const x = _hbSnap(Xc(i) - bw / 2);
    g += `<g><title>${_hbE(hbBucketLabel(d.slice(0, 7), 'm', false) + ': ' + i18t('hb_wi_say', { a: fmt(base[i]), b: fmt(scen[i]) }))}</title>`
      + `<rect x="${x}" y="${_hbSnap(Y(base[i]))}" width="${_hbSnap(bw)}" height="${Math.max(1, bot - _hbSnap(Y(base[i])))}" rx="2" class="hb-sv-wi-base"/>`
      + `<rect x="${x + 1}" y="${_hbSnap(Y(scen[i]))}" width="${Math.max(1, _hbSnap(bw) - 2)}" height="${Math.max(1, bot - _hbSnap(Y(scen[i])))}" rx="2" class="hb-sv-wi-scen"/>`
      + `<text x="${Xc(i).toFixed(1)}" y="${bot + 18}" text-anchor="middle" font-size="12" class="hb-sv-ink2">${_hbE(hbBucketLabel(d.slice(0, 7), 'm', true))}</text></g>`; });
  const gap = base[n - 1] - scen[n - 1];
  const by = i18t('hb_wi_by', { n: _hbN(cs.length) });
  return { body: `<svg class="hb-svg hb-wi" data-hb-yk="run" viewBox="0 0 ${W} ${H}" role="group" aria-label="${_hbE(by)}">${g}</svg>`, by,
    lead: `<b>${_hbE(fmt(gap))}</b> ${_hbE(i18t('hb_wi_lead', { d: hbBucketLabel(ends[n - 1].slice(0, 7), 'm', false) }))}`,
    note: i18t('hb_wi_note'), readLines: [{ key: 'hb_read_wi', parts: { a: fmt(base[n - 1]), b: fmt(scen[n - 1]), d: hbBucketLabel(ends[n - 1].slice(0, 7), 'm', false) }, n: cs.length }], readCounts: [cs.length],
    dataLines: ['SCENARIO, not on record — live value at each month-end (month: if these renew, if these do not renew):'].concat(ends.map((d, i) => `- ${d.slice(0, 7)}: ${Math.round(base[i])}, ${Math.round(scen[i])}`)) };
}
/* A8: THE MONTHLY PACK — every chart kept on the board, drawn as a picture
   with its name, its headline and the date of the data, in one page the
   reader downloads (a standalone page: literal colours, nothing borrowed) */
async function hbPackMake(only){
  /* A11: one chart's own pack (its ⋯ menu) is the same page with one picture */
  const cards = Array.isArray(only) ? only : [...document.querySelectorAll('#hb-board .hb-grid [data-hb-pid]')];
  const said = (k, kind, v) => { if (typeof toast === 'function') toast(i18t(k, v), kind); };
  const items = [];
  for (const card of cards){
    const chart = card.querySelector('svg.hb-svg, .hb-chart-bars'); if (!chart) continue;
    const title = (card.querySelector('.hb-ct') || {}).textContent || '';
    const head = (card.querySelector('.hb-head-line p') || {}).textContent || '';
    try { const blob = await hbChartPngOf(chart, { title, sub: head, n: 0 }); items.push({ title, head, url: await new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); }) }); } catch (_){}
  }
  if (!items.length){ said('hb_pack_none', 'warn'); return; }
  const day = _hbDayWord(hbToday());
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${_hbE(i18t('hb_pack_title', { d: day }))}</title><style>body{font-family:Helvetica,Arial,sans-serif;color:#111;background:#fff;margin:32px auto;max-width:960px;padding:0 16px}h1{font-size:22px;margin:0 0 4px}p.m{color:#555;margin:0 0 28px}section{page-break-inside:avoid;margin:0 0 36px}h2{font-size:16px;margin:0 0 4px}section p{color:#333;margin:0 0 10px}img{max-width:100%;border:1px solid #ddd;border-radius:6px}</style></head><body>`
    + `<h1>${_hbE(i18t('hb_pack_title', { d: day }))}</h1><p class="m">${_hbE(i18tn('hb_pack_sub', items.length, { n: _hbN(items.length) }))}</p>`
    + items.map(x => `<section><h2>${_hbE(x.title)}</h2>${x.head ? `<p>${_hbE(x.head)}</p>` : ''}<img src="${x.url}" alt="${_hbE(x.title)}"></section>`).join('') + '</body></html>';
  _hbSaveFile(new Blob([html], { type: 'text/html' }), 'hati-board-pack-' + hbToday() + '.html');
  said('hb_pack_done', 'ok', { n: _hbN(items.length) });
}
/* ============================================================
   REFERENCE LINES, COPY, THE POINT IN COLOUR, AND ONE VALUE SAID PLAINLY
   (G5, G9, G7, G10 of the Board Upgrade Proposals, 10 Oct 2026)
   ============================================================ */
const HB_REFS_KEEP = 30;
let _hbLinesOpen = null;
/* G5: what a card's reference lines may show, and what the reader turned on */
function hbRefsOf(key, P){
  const r = (hbS().refs || {})[key] || {};
  const lyOk = !!(P.split && P.split.by === 'date' && (P.split.unit === 'm' || P.split.unit === 'q')) && P.show !== 'running' && !P.compare && P.measure !== 'live';
  return { avg: !!r.avg && P.measure !== 'live', ly: !!r.ly && lyOk, tgt: r.tgt != null && isFinite(r.tgt) ? Number(r.tgt) : null, lyOk };
}
function hbRefsSet(key, part, v){
  const s = hbS(); s.refs = s.refs || {};
  const r = Object.assign({ avg: false, ly: false, tgt: null }, s.refs[key] || {});
  if (part === 'tgt') r.tgt = v == null ? null : v; else if (part === 'avg' || part === 'ly') r[part] = !r[part]; else return;
  delete s.refs[key];
  if (r.avg || r.ly || r.tgt != null) s.refs[key] = r;
  const ks = Object.keys(s.refs); if (ks.length > HB_REFS_KEEP) delete s.refs[ks[0]];
  hbSave();
}
/* a typed figure: "3 000 000", "3M", "2,5 M", "750k" — never guessed: what
   does not read as a number is refused, and said */
function hbNumIn(t){
  let x = String(t == null ? '' : t).trim().toLowerCase().replace(/[\s ]/g, '').replace(/^(?:sek|kr|usd|eur|kes|\$|€|£)/, '').replace(/(?:sek|kr|usd|eur|kes)$/, '');
  const mult = /(?:k|tn|tusen)$/.test(x) ? 1e3 : /(?:m|mn|milj|mkr)$/.test(x) ? 1e6 : /(?:b|bn|md|mdr|mrd)$/.test(x) ? 1e9 : 1;
  x = x.replace(/(?:k|tn|tusen|m|mn|milj|mkr|b|bn|md|mdr|mrd)$/, '');
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(x)) x = x.replace(/,/g, '');
  else x = x.replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(x)) return null;
  const n = Number(x) * mult;
  return isFinite(n) ? n : null;
}
function hbLinesMenuHtml(D, P){
  const RF = hbRefsOf(D.key, P), open = _hbLinesOpen === D.key, r = (hbS().refs || {})[D.key] || {};
  const item = (k, word, on, dead) => `<button type="button" role="menuitemcheckbox" aria-checked="${on}" data-hb-line="${k}"${dead ? ` disabled title="${_hbE(dead)}"` : ''}><span>${_hbE(word)}</span>${dead ? `<small>${_hbE(dead)}</small>` : on ? `<b aria-hidden="true">${_hbTick}</b>` : ''}</button>`;
  const menu = open ? `<div class="hb-rmenu hb-lines-menu" role="menu" aria-label="${_hbE(i18t('hb_ref_lines'))}">`
    + item('avg', i18t('hb_ref_avg'), !!r.avg, '')
    + item('ly', i18t('hb_ref_ly'), !!r.ly && RF.lyOk, RF.lyOk ? '' : i18t('hb_ref_ly_why'))
    + `<form class="hb-ref-tgt" data-hb-tgt-form="${_hbE(D.key)}"><label for="hb-ref-tgt-in">${_hbE(i18t('hb_ref_tgt'))}</label><input id="hb-ref-tgt-in" name="t" type="text" inputmode="decimal" autocomplete="off" value="${RF.tgt != null ? _hbE(String(RF.tgt)) : ''}" placeholder="${_hbE(i18t('hb_ref_tgt_ph'))}"><button type="submit" class="hb-link">${_hbE(i18t('hb_ref_tgt_set'))}</button>${RF.tgt != null ? `<button type="button" class="hb-link" data-hb-line="tgt-off">${_hbE(i18t('hb_ref_tgt_off'))}</button>` : ''}</form></div>` : '';
  const n = (RF.avg ? 1 : 0) + (RF.ly ? 1 : 0) + (RF.tgt != null ? 1 : 0);
  return `<span class="hb-rwrap hb-lines-w" data-hb-lines-key="${_hbE(D.key)}"><button type="button" class="hb-link" data-hb-lines aria-haspopup="menu" aria-expanded="${open}">${_hbE(n ? i18t('hb_ref_lines_n', { n }) : i18t('hb_ref_lines'))}</button>${menu}</span>`;
}
/* G7: the piece the chart's point is about wears the colour; the rest calm.
   The point is the headline's own door — when it is one of the pieces. */
function hbLeadMark(body, line){
  const m = /data-hb-dig="([^"]+)"/.exec(line || ''); if (!m) return body;
  const needle = `data-hb-dig="${m[1]}"`, at = body.indexOf(needle); if (at < 0) return body;
  const end = body.indexOf('>', at); if (end < 0 || body.slice(at, end).indexOf('data-hb-part') < 0) return body;
  body = body.slice(0, at) + needle + ' data-hb-lead' + body.slice(at + needle.length);
  return body.replace('<svg class="hb-svg', '<svg class="hb-svg hb-calm').replace('<div class="hb-chart hb-chart-bars"', '<div class="hb-chart hb-chart-bars hb-calm"');
}
/* G10: ONE VALUE IS SAID, NOT DRAWN. A chart with a single piece and nothing
   beside it says its number plainly, names the contracts when they are few,
   and offers the views that would draw a real picture (each a recipe press). */
const _hbUnE = t => String(t || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
function hbSmallOne(body, P){
  if (!['cols', 'bars'].includes(P.pic) || P.compare || P.split2) return null;
  const parts = (body.match(/data-hb-part/g) || []).length; if (parts !== 1) return null;
  if (P.pic === 'cols' && (body.match(/class="hb-sv-cbox/g) || []).length !== 1) return null;
  const m = /data-hb-dig="([^"]*)"[^>]*data-hb-part[^>]*>\s*<title>([^<]*)<\/title>/.exec(body) || /data-hb-dig="([^"]*)"[^>]*data-hb-part[^>]*title="([^"]*)"/.exec(body);
  if (!m) return null;
  const txt = _hbUnE(m[2]), at = txt.lastIndexOf(': ');
  return { dig: _hbUnE(m[1]), label: at > 0 ? txt.slice(0, at) : txt, say: at > 0 ? txt.slice(at + 2) : '', title: txt };
}
function hbSmallHtml(D, P, cs, one){
  /* a bare count says what it counts */
  const figs = String(one.say || '').split(' · ').filter(Boolean).slice(0, 2)
    .map(f => /^\d[\d\s,.\u00a0]*$/.test(f.trim()) ? f.trim() + ' ' + i18tn('hb_contracts_word', Number(f.replace(/[^\d]/g, '')) || 0, { n: f }) : f);
  const names = cs.length <= 3 ? [...new Set(cs.map(c => String(c.counterparty || c.name || '')).filter(Boolean))] : [];
  const date = (P.window && P.window.date) || (hbSignM(P.measure) ? 'signed' : 'end');
  const groupSplit = hbNextGroup(((D.fixed || []).concat(P.split && P.split.by !== 'date' ? [P.split.by] : [])));
  const chips = [];
  if (!P.split || P.split.by !== 'date') chips.push(['split:d:m:' + date, i18t('hb_small_by_month')]);
  else chips.push(['split:g:' + groupSplit, i18t('hb_small_by', { by: hbGroupWord(groupSplit) })]);
  if (P.measure !== 'live') chips.push(['compare:year', i18t('hb_small_cmp')]);
  chips.push(['pic:list', i18t('hb_small_list')]);
  return `<div class="hb-small"><button type="button" class="hb-small-figs" data-hb-dig="${_hbE(one.dig)}" data-hb-part title="${_hbE(one.title)}">${figs.map(f => `<span class="hb-small-fig">${_hbE(f)}</span>`).join('')}</button>`
    + `<div class="hb-small-in">${_hbE(i18t('hb_small_in', { what: one.label }))}${names.length ? ' · ' + _hbE(names.join(' · ')) : ''}</div>`
    + `<div class="hb-small-chips" data-hb-rkey="${_hbE(D.key)}">${chips.map(([v, w]) => `<button type="button" class="hb-small-chip" data-hb-rset="${_hbE(v)}">${_hbE(w)}</button>`).join('')}</div></div>`;
}
/* G9: THE CHART AS A PICTURE AND AS A TABLE, for a slide, an email, a sheet.
   A picture leaving HaTi carries no stylesheet, so every colour and size is
   written on it as a literal (a standalone document carries no :root), with
   its title, what it counts and the date of the data. */
const HB_IMG_PROPS = ['fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-opacity', 'stroke-dasharray', 'opacity', 'font-size', 'font-weight', 'letter-spacing'];
function _hbSvgLiteral(svg){
  const clone = svg.cloneNode(true), a = [svg, ...svg.querySelectorAll('*')], b = [clone, ...clone.querySelectorAll('*')];
  a.forEach((el, i) => { const c = b[i]; if (!c || c.nodeName.toLowerCase() === 'title') return; const cs = getComputedStyle(el);
    const st = HB_IMG_PROPS.map(k => { const v = cs.getPropertyValue(k); return v ? k + ':' + v : ''; }).filter(Boolean);
    if (el.nodeName.toLowerCase() === 'text') st.push('font-family:Helvetica,Arial,sans-serif');
    c.setAttribute('style', st.join(';')); c.removeAttribute('class'); });
  clone.querySelectorAll('title').forEach(t => t.remove());
  return clone;
}
function _hbBarsAsSvg(box){
  const rows = [...box.querySelectorAll('.hb-cbar')], W = 640, rh = 30, H = rows.length * rh;
  const ink = getComputedStyle(box).color || '#222';
  const out = rows.map((r, i) => { const t = (r.querySelector('.hb-cbar-t') || {}).textContent || '', n = (r.querySelector('.hb-cbar-n') || {}).textContent || '';
    const f = r.querySelector('.hb-cbar-f'), pct = f ? parseFloat(f.style.width) || 0 : 0, fill = f ? getComputedStyle(f).backgroundColor : '#888', y = i * rh;
    return `<text x="0" y="${y + 19}" font-size="13" style="fill:${ink};font-family:Helvetica,Arial,sans-serif">${_hbE(_hbFitText(t, 210, 13))}</text><rect x="220" y="${y + 8}" width="${(300 * pct / 100).toFixed(1)}" height="14" rx="3" style="fill:${fill}"/><text x="${W}" y="${y + 19}" text-anchor="end" font-size="13" font-weight="600" style="fill:${ink};font-family:Helvetica,Arial,sans-serif">${_hbE(n)}</text>`; }).join('');
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('viewBox', `0 0 ${W} ${Math.max(H, rh)}`); s.innerHTML = out; return s;
}
/* the chart a card's tools stand over: the drawing right after them (never
   the reading above, whose numbers are doors too) */
const _HB_CHART_SEL = 'svg.hb-svg, .hb-chart, .hb-small, .hb-ctab';
/* the chart a card's tools copy: the card's own (its edge sits in the head, 11 Oct 2026) */
function _hbToolsChart(tools){
  const n = tools && tools.nextElementSibling; if (n && n.matches(_HB_CHART_SEL)) return n;
  const card = tools && tools.closest('.hb-card'); return card ? card.querySelector('.hb-cb ' + _HB_CHART_SEL.split(', ').join(', .hb-cb ')) : null;
}
function hbChartPng(tools){
  const chart = _hbToolsChart(tools); if (!chart) return Promise.reject(new Error('no chart'));
  return hbChartPngOf(chart, { title: tools.getAttribute('data-hb-copy-t') || '', sub: tools.getAttribute('data-hb-copy-s') || '', n: Number(tools.getAttribute('data-hb-copy-n')) || 0 });
}
function hbChartPngOf(chart, meta){
  hbLitClear(); hbTipHide(true);
  const svg0 = chart.matches('svg.hb-svg') ? chart : null, bars = chart.matches('.hb-chart-bars') ? chart : null;
  const inner = svg0 ? _hbSvgLiteral(svg0) : bars ? _hbBarsAsSvg(bars) : null;
  if (!inner) return Promise.reject(new Error('no chart'));
  const vb = (inner.getAttribute('viewBox') || '0 0 600 300').split(/\s+/).map(Number), iw = vb[2], ih = vb[3];
  const pg = hbPage(), cs = pg ? getComputedStyle(pg) : null;
  const bg = (cs && cs.getPropertyValue('--hb-menu').trim()) || '#FFFFFF', ink = (cs && cs.getPropertyValue('--hb-ink').trim()) || '#111111', mute = (cs && cs.getPropertyValue('--hb-mute').trim()) || '#555555';
  const pad = 24, headH = 52, footH = 30, W = iw + pad * 2, H = ih + headH + footH + pad;
  const title = meta.title || '', sub = meta.sub || '', n = meta.n || 0;
  const foot = n ? i18t('hb_copy_foot', { d: _hbDayWord(hbToday()), n: _hbN(n) }) : i18t('hb_copy_foot_day', { d: _hbDayWord(hbToday()) });
  inner.setAttribute('x', pad); inner.setAttribute('y', headH); inner.setAttribute('width', iw); inner.setAttribute('height', ih); inner.setAttribute('overflow', 'visible');
  const font = 'font-family:Helvetica,Arial,sans-serif';
  const outer = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" style="fill:${bg}"/>`
    + `<text x="${pad}" y="${pad + 6}" font-size="17" font-weight="700" style="fill:${ink};${font}">${_hbE(title)}</text>`
    + `<text x="${pad}" y="${pad + 24}" font-size="12" style="fill:${mute};${font}">${_hbE(sub)}</text>`
    + new XMLSerializer().serializeToString(inner).replace(/^<svg(?![^>]*xmlns=)/, '<svg xmlns="http://www.w3.org/2000/svg"')
    + `<text x="${pad}" y="${H - 12}" font-size="11" style="fill:${mute};${font}">${_hbE(foot)}</text></svg>`;
  return new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => { try { const k = 2, cv = document.createElement('canvas'); cv.width = W * k; cv.height = H * k; const cx = cv.getContext('2d'); cx.scale(k, k); cx.drawImage(img, 0, 0); cv.toBlob(b => b ? ok(b) : no(new Error('no picture')), 'image/png'); } catch (e){ no(e); } };
    img.onerror = () => no(new Error('no picture'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(outer);
  });
}
function _hbSaveFile(blob, name){
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
  setTimeout(() => { try { URL.revokeObjectURL(a.href); a.remove(); } catch (_){} }, 1000);
}
function hbCopyChartImage(btn){
  const tools = btn.closest('.hb-open-tools'); if (!tools) return;
  const name = (tools.getAttribute('data-hb-copy-t') || 'chart').replace(/[^\w\- ]+/g, '').trim().slice(0, 60) || 'chart';
  const png = hbChartPng(tools);
  const said = (k, kind) => { if (typeof toast === 'function') toast(i18t(k), kind); };
  const fallback = () => png.then(b => { _hbSaveFile(b, name + '.png'); said('hb_copy_img_saved', 'ok'); }, () => said('hb_copy_img_fail', 'err'));
  try {
    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem === 'function'){
      navigator.clipboard.write([new ClipboardItem({ 'image/png': png })]).then(() => said('hb_copy_img_done', 'ok'), fallback);
      return;
    }
  } catch (_){}
  fallback();
}
function hbCopyChartTable(btn){
  const tools = btn.closest('.hb-open-tools'), chart = _hbToolsChart(tools); if (!chart) return;
  const box = document.createElement('div'); box.innerHTML = chart.matches('.hb-ctab') ? chart.outerHTML : hbChartTableHtml(chart.outerHTML);
  const rows = [...box.querySelectorAll('tbody tr')].map(tr => [...tr.querySelectorAll('td')].map(td => td.textContent.trim()));
  const said = (k, kind) => { if (typeof toast === 'function') toast(i18t(k), kind); };
  if (!rows.length){ said('hb_copy_tab_none', 'warn'); return; }
  const head = [i18t('hb_tab_what'), i18t('hb_tab_count')];
  const tsv = [head].concat(rows).map(r => r.map(x => String(x).replace(/[\t\n]/g, ' ')).join('\t')).join('\n');
  const html = `<table><thead><tr>${head.map(h => `<th>${_hbE(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${_hbE(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  const plain = () => (navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(tsv) : Promise.reject(new Error('no clipboard')))
    .then(() => said('hb_copy_tab_done', 'ok'), () => said('hb_copy_tab_fail', 'err'));
  try {
    if (navigator.clipboard && navigator.clipboard.write && typeof ClipboardItem === 'function'){
      navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([tsv], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]).then(() => said('hb_copy_tab_done', 'ok'), plain);
      return;
    }
  } catch (_){}
  plain();
}
function hbLeadMoneyHtml(cs, m, total){
  if (m === 'exposure') return ` · <b>${_hbE(_hbM(hbMeasure(cs, 'exposure').y || 0))}</b> <span class="hb-lead-w">${_hbE(i18t('hb_lead_exposure'))}</span>`;
  return ` · <b>${_hbE(_hbM(total == null ? cs.reduce((a, c) => a + hbValueOfOne(c), 0) : total))}</b>`;
}
function hbChartHtml(D, cs0, big){
  const money = hbMoneyOk();
  const P = hbPlan(D);
  if (!cs0.length && P.measure !== 'live') return `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
  /* the card this chart sits in, its step and its measured width (O-22) */
  const at = _hbFitAt;
  if (at) _hbFit = { key: at.key, step: at.step, grow: !!at.grow, w: _hbFitW.get(at.key + '|' + at.step) || (at.step === 'board' ? (at.big ? 1100 : 540) : 1100) };
  let run;
  try { run = hbChartRun(D, cs0, P); } finally { _hbFit = null; }
  const { R, cs } = run;
  /* a money picture over contracts that carry no value draws no axis of zeros:
     it says so in one line, the count still a door */
  if (HB_MONEY_MEASURES.includes(P.measure) && cs.length && cs.every(c => !(hbValueOfOne(c) > 0)) && P.pic !== 'list' && P.pic !== 'gantt'){
    R.body = `<div class="hb-quiet hb-novalue" data-hb-rkey="${_hbE(D.key)}">${_hbE(i18tn('hb_no_value_here', cs.length, { n: _hbN(cs.length) }))} <button type="button" class="hb-link" data-hb-rset="measure:count">${_hbE(i18t('hb_no_value_count'))}</button></div>`;
    R.lead = ''; R.say = ''; R.note = ''; R.noValue = true;
  }
  /* the reading is worked out once: the headline says it, and the piece it
     is about wears the colour (G7) */
  const reading = hbReadingOf(D, cs, P, R);
  if (['cols', 'bars'].includes(P.pic) && !P.split2 && !P.compare) R.body = hbLeadMark(String(R.body || ''), hbHeadlineOf(reading));
  const one = hbSmallOne(String(R.body || ''), P);
  if (one) R.body = hbSmallHtml(D, P, cs, one);
  if (at){
    const w = _hbFitW.get(at.key + '|' + at.step) || (at.step === 'board' ? (at.big ? 1100 : 540) : 1100);
    R.body = String(R.body || '').replace(/<svg class="hb-svg/g, `<svg data-hb-fit="${_hbE(at.key + '|' + at.step)}" data-hb-w="${w}" data-hb-step="${at.step}" class="hb-svg`);
    /* THE CARD IS CLEAN, ITS TOOLS ON ITS EDGE (owner, 11 Oct 2026, the
       "HaTi Board" artifact; reverses O-25's "detail is earned once opened"):
       the chart says nothing about its tools; the card's head draws How this
       is drawn ▾ · Table · ⋯ (hbEdgeHtml) from what is stashed here. THE
       BUTTON NEVER LIES (Part 6): Table only where the chart has rows to
       show, Chart only while a table IS showing. */
    if (/data-hb-dig=/.test(R.body)){
      const t = hbChartTableHtml(R.body);
      const tab = !!t && _hbTableOn.has(at.key);
      if (tab) R.body = t;
      _hbEdgeMeta.set(at.key, { canTable: !!t, tab, cols: P.pic === 'cols' && P.measure !== 'live' && !P.compare && !tab,
        title: P.title || D.title || D.crumb || '', by: R.by || '', n: cs.length });
    }
  }
  const total = money ? cs.reduce((a, c) => a + hbValueOfOne(c), 0) : null;
  const lead = R.lead || `<b>${_hbN(cs.length)}</b> ${_hbE(i18tn('hb_contracts_word', cs.length, { n: cs.length }))}${money ? hbLeadMoneyHtml(cs, P.measure, total) : ''}`;
  /* enlarged, the chart opens with HaTi's reading in place of the trend
     line's arithmetic (READ, THEN ASK, below) */
  /* a bigger card ON THE BOARD is only wider (as drawn); its reading opens from ⋯ */
  const onBoard = !!(at && at.step === 'board');
  const read = big && !onBoard ? hbReadHtml(D, cs, P, R) : '';
  /* small, the chart says its point in one line under the totals (HEADLINE) */
  const head = R.noValue || (big && !onBoard) ? '' : hbHeadlineHtml(D.key, hbReadingOf(D, cs, P, R), cs.length, hbWhySig(D, P, cs));
  /* how this was counted: asked for from the card's ⋯ (the artifact's card is clean) */
  const how = at && !one && _hbHowOn.has(D.key) ? hbHowHtml(D, P, R, cs) : '';
  return `${read || (!head && R.say ? `<p class="hb-tr-say">${_hbE(R.say)}</p>` : '')}${hbPayKpiHtml(P)}${R.body}<div class="hb-chart-notes">${head}<div class="hb-chart-lead">${lead}${at ? '' : `<span class="hb-chart-by">${_hbE(R.by)}</span>`}</div>${R.note ? `<div class="hb-quiet hb-chart-note">${_hbE(R.note)}</div>` : ''}</div>${how}`;
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
/* one reading per run of a chart: the headline and the point in colour (G7)
   ask the same run, and it is worked out once */
const _hbReadMemo = new WeakMap();
function hbReadingOf(D, cs, P, R){
  if (R && typeof R === 'object' && _hbReadMemo.has(R)) return _hbReadMemo.get(R);
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
  const out = r.lines.length ? r : null;
  if (R && typeof R === 'object') _hbReadMemo.set(R, out);
  return out;
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
  /* the new pictures say their own reading, worked out with the drawing (G8) */
  if (R && Array.isArray(R.readLines)){ (R.readCounts || []).forEach(k => counts.add(k)); R.readLines.forEach(l => { if (l.n != null) counts.add(l.n); say(l.key, l.parts); }); return lines.length ? { lines, counts, keys } : null; }
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
      if (m === 'exposure'){ const unread = cols.reduce((a, c) => a + (c.left || 0), 0) + edges.reduce((a, c) => a + (c.left || 0), 0);
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
  return `<button type="button" class="hb-read-n" data-hb-dig="c:${_hbE(c.id)}" title="${_hbE(hbRef(c) + ' · ' + String(c.name || '') + (c.counterparty ? ' · ' + c.counterparty : ''))}">${_hbRefH(c)}</button>${c.counterparty ? ' (' + _hbE(c.counterparty) + ')' : ''}`;
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
  /* AN INSIGHTS TODAY CARD's own chart (Young, 6 Oct 2026, Headline order 4a):
     the same run its thumbnail draws (hbInsChart: its question, the whole
     book), read the way every chart is read */
  const ins = /^ins:([a-z]+(?:\.mine)?)$/.exec(String(key || ''));
  if (ins){
    const o = hbInsOf(ins[1]); if (!o) return null;
    const D = hbDigData(hbInsKey(o.k, o.mine), 'all'); if (!D || D.kind !== 'list') return null;
    return hbReadOfList(D, key, hbInsViewWord(o.k, o.mine), 'all');
  }
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
  if (R && Array.isArray(R.dataLines)) R.dataLines.forEach(l => data.push(l));
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
  /* "Ask about this" (C2): the piece and the contracts behind it, so the
     answer can name them — near the top, never cut by the cap */
  const about = hbAskAboutLine(); if (about) out.splice(1, 0, about);
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
  const sentences = String(text || '').replace(/\r/g, '').split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9*"(\[])/);
  let dropped = 0;
  const kept = sentences.filter(snt => {
    const ts = snt.match(/\d(?:[\d\u00a0 ,.]*\d)?/g) || [];
    const has = d => nums.has(d) || nums.has(String(Number(d)));
    for (const t of ts){ const d = t.replace(/\D/g, ''); if (d && !has(d) && !hbNumPieces(t).every(has)){ dropped++; return false; } }
    return true;
  });
  return { text: kept.join(' ').trim(), dropped };
}
/* THE WRITING IS NOT BLAND (Young, 6 Oct 2026: "colour highlights and bold
   letters where necessary … green where all is well and red where things are
   bad"). Copilot marks its own good and bad news — [[good:…]], [[bad:…]] —
   and its key phrase **…** (HB_SAY_RULE, told every time it writes for the
   board); HaTi then bolds every figure and colours a short list of plainly
   good or bad words that no mark already holds, so writing kept from before
   the marks reads the same way. Escaped FIRST: nothing Copilot wrote becomes
   markup except these three marks. */
const HB_SAY_RULE = 'Mark the reader\'s good news [[good:like this]] and bad news [[bad:like this]] (a few words each, at most two of each per paragraph), and the one key phrase **like this**. No other formatting.';
const HB_SAY_BAD = /\b(overdue|expired|lapsed|at risk|stuck|refused|unsigned|missing|behind|slower|fell|dropped|declin\w+|försenad\w*|förfallna|utgångna|saknas|fastnat)\b/giu;
const HB_SAY_GOOD = /\b(on time|on track|all clear|ahead|faster|improved|grew|up from|i tid|enligt plan|snabbare|förbättr\w+)\b/giu;
const HB_SAY_NOT = /\b(no|not|none|nothing|without|inga?|inget|utan)\s+(?:\S+\s+){0,2}$/iu;
const HB_SAY_FIG = /(?:\b(?:SEK|KES|USD|EUR|GBP|NOK|DKK|KSh|kr)\s?)?(?<![\w#\-–])\d(?:[\d  ,.]*\d)?(?:\s?(?:%|[MKB]\b|mn\b|million|billion|miljoner|days?|dagar|months?|månader|contracts?|avtal(?:en)?))?/giu;
function _hbSayWalk(html, fn){
  let deep = 0;
  return html.split(/(<[^>]+>|&#?\w+;)/).map(part => {
    if (part.startsWith('<')){ if (/^<(b|span)\b/i.test(part)) deep++; else if (/^<\/(b|span)>/i.test(part)) deep = Math.max(0, deep - 1); return part; }
    if (part.startsWith('&') || deep) return part;
    return fn(part);
  }).join('');
}
function hbSay(text){
  let h = _hbE(String(text == null ? '' : text));
  h = h.replace(/\[\[\s*(good|bad)\s*:\s*([\s\S]+?)\]\]/gi, (m, k, t) => `<span class="hb-${k.toLowerCase()}">${t}</span>`)
    .replace(/\[\[\s*(?:good|bad)\s*:\s*/gi, '').replace(/\]\]/g, '')
    .replace(/\*\*([^*]+?)\*\*/g, '<b>$1</b>').replace(/\*\*/g, '');
  const tone = (re, cls) => seg => seg.replace(re, (m, _w, off, whole) => HB_SAY_NOT.test(whole.slice(0, off)) ? m : `<span class="hb-${cls}">${m}</span>`);
  h = _hbSayWalk(h, tone(HB_SAY_BAD, 'bad'));
  h = _hbSayWalk(h, tone(HB_SAY_GOOD, 'good'));
  h = _hbSayWalk(h, seg => seg.replace(HB_SAY_FIG, m => /\d/.test(m) ? `<b class="hb-num">${m}</b>` : m));
  return h;
}
/* the plain words, marks taken off (a share, a copy, a hover) */
const hbSayPlain = t => String(t == null ? '' : t).replace(/\[\[\s*(?:good|bad)\s*:\s*/gi, '').replace(/\]\]/g, '').replace(/\*\*/g, '');
/* EXPLAIN THIS CHART, IN THREE POINTS (C4, 10 Oct 2026): always the same
   shape, so it can be read at a glance — what stands out, why, what you
   might do; each on its own line, under its own label */
const HB_WHY3 = ['hb_cx3_a', 'hb_cx3_b', 'hb_cx3_c'];
function hbWhy3Ask(){
  return `Say what this shows, why it matters, and what to do next — in exactly three lines, in ${i18t('hb_cx_lang')}, for a business owner. Start the lines with these labels, word for word: "${i18t(HB_WHY3[0])}:", "${i18t(HB_WHY3[1])}:" and "${i18t(HB_WHY3[2])}:". One or two short sentences each. Name the contracts or groups you mean.`;
}
/* the three points drawn as a list where the answer kept its labels; else as written */
function hbWhy3Html(text){
  const t = String(text || ''), labels = HB_WHY3.map(k => i18t(k));
  const at = labels.map(l => { const m = new RegExp('(?:^|\\n|\\s)(?:\\d\\.\\s*)?\\**' + _hbReEsc(l) + '\\**\\s*:', 'i').exec(t); return m ? { i: m.index + m[0].length, s: m.index } : null; });
  if (at.filter(Boolean).length < 2) return null;
  const parts = labels.map((l, k) => { if (!at[k]) return null; const next = at.slice(k + 1).filter(Boolean).sort((a, b) => a.s - b.s)[0]; return { l, body: t.slice(at[k].i, next ? next.s : t.length).trim() }; }).filter(Boolean);
  return `<ol class="hb-why3">${parts.map(p => `<li><b>${_hbE(p.l)}:</b> ${hbSay(p.body)}</li>`).join('')}</ol>`;
}
function hbSummaryPrompt(sheet, ask){
  return [sheet.text, '',
    ask || `Write three or four plain sentences, in ${i18t('hb_cx_lang')}, for a business owner: what this shows, why it matters, and what to do next.`,
    'Use ONLY numbers that appear on the fact sheet, written exactly as they appear there; never work out a new number (no new totals, percentages, differences or dates). Name contracts by their reference. If the coverage line says some contracts were not read or not checked, say the picture may be incomplete. Do not repeat the sheet line by line.', HB_SAY_RULE].join('\n');
}
/* THE COUNT IS HATI'S: a sentence stating a number of contracts this chart
   does not hold is left out, and how many were left out is said */
function hbWhyCheck(text, counts){
  const sentences = String(text || '').replace(/\r/g, '').split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9*"(\[])/);
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
    const res = await copilotAsk([{ role: 'user', content: hbSummaryPrompt(sheet, key === HB_BOARD_KEY ? i18t('hb_bs_ask', { lang: i18t('hb_cx_lang') }) : hbWhy3Ask()) }], { view: 'intel' }, null, { quiet: true });
    /* an answer that did not finish is not a summary: it is said as a failure,
       never kept under "Every number in it is on HaTi's fact sheet" */
    if (res && res.unfinished){ _hbWhyErr.set(key, String(res.answer || i18t('hb_cx_empty')).slice(0, 300)); return; }
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
  const read = `<div class="hb-read"><div class="hb-read-h"><span>${_hbE(i18t('hb_read_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_read_src'))}</span></div>
    <ul>${reading.lines.map(l => `<li>${l}</li>`).join('')}</ul></div>`;
  /* ONE PRESS, TWO DEPTHS (owner, 23 Oct 2026: "make them one", then "build
     it" — the quick read first, Go further under it): every card's reading
     carries Dig deeper; its first answer is the quick read (one call), and
     under it Go further runs the analyst's steps in the same place — inside
     the card, under the chart, never a second card */
  const card = key !== HB_BOARD_KEY;
  const kept = hbWhyKept(key, sig), busy = _hbWhyBusy.has(key), err = _hbWhyErr.get(key);
  const live = typeof copilotAvailable === 'function' && copilotAvailable();
  const ask = kept && !err ? '' : `<div class="hb-why-ask"><button type="button" class="hb-btn" ${card ? 'data-hb-dd-on' : 'data-hb-why'}="${_hbE(key)}"${busy ? ' disabled' : ''}${live ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t(err ? 'hb_cx_again' : card ? 'hb_dd_btn' : 'hb_cx_btn'))}</button>
    <span class="hb-quiet">${_hbE(live ? i18tn('hb_cx_cost', n, { n: _hbN(n) }) : i18t('hb_cx_nokey'))}</span></div>`;
  let box = '';
  /* C8: WHILE IT WORKS, THE STEPS; WHEN IT STOPS, WHY — and HaTi's own
     reading above stands either way */
  const steps = (stop) => `<ol class="hb-steps"><li class="is-ok">${_hbE(i18tn('hb_st_read', n, { n: _hbN(n) }))}</li><li class="is-ok">${_hbE(i18t('hb_st_count'))}</li>`
    + (stop ? `<li class="is-stop">${_hbE(stop)}</li>` : `<li class="is-on">${_hbE(i18t('hb_st_ask'))}</li><li>${_hbE(i18t('hb_st_check'))}</li>`) + '</ol>';
  if (busy) box = `<div class="hb-why" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span></div><p class="hb-quiet">${_hbE(i18t('hb_cx_busy'))}</p>${steps('')}</div>`;
  else if (err) box = `<div class="hb-why is-err" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span></div>${steps(err)}<p class="hb-quiet">${_hbE(i18t('hb_st_stood'))}</p></div>`;
  else if (kept) box = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_cx_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: kept.at }))}</span></div>
    <div class="hb-why-b">${(key !== HB_BOARD_KEY && hbWhy3Html(kept.text)) || hbSay(kept.text)}</div>
    <div class="hb-why-f"><span class="${kept.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(kept.dropped ? i18tn('hb_cx_dropped', kept.dropped, { n: kept.dropped }) : i18t('hb_cx_ok'))}</span>${kept.notice ? `<span>${_hbE(kept.notice)}</span>` : ''}<span class="hb-grow"></span>
      <button type="button" class="hb-link" data-hb-why-follow="${_hbE(key)}">${_hbE(i18t('hb_cx_follow'))}</button></div></div>`;
  return read + ask + box + (card ? hbDdOnHtml(key, sig, !!kept && !err) : '');
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
  /* on a board card the reading opens from ⋯ → Dig deeper (as drawn);
     its "Read less" stays to fold it again */
  const btn = open || !(_hbFitAt && _hbFitAt.step === 'board');
  return `<div class="hb-head-line"><p>${line}</p>${btn ? `<button type="button" class="hb-link hb-head-more" data-hb-read-more="${_hbE(key)}" aria-expanded="${open}">${_hbE(i18t(open ? 'hb_head_less' : 'hb_head_more'))}</button>` : ''}</div>`
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
  if (D.kind === 'story') return hbStoryHtml(D, lens);
  if (D.kind === 'list'){
    const cs = hbListOf(D.ids, lens);
    const fig = D.fig || '';
    const label = D.crumb || (D.word ? i18t(D.word) : '');
    const lead = fig ? `<div class="hb-say">${_hbE(i18tn('hb_say_' + fig, cs.length, { n: _hbN(cs.length) }))}</div>` : '';
    /* CHART FIRST, ALWAYS; the rows are the List picture */
    const P = hbPlan(D);
    /* on the board the card is clean (as drawn): its contracts are one press
       away in the side list, which carries this foot */
    const onCard = !!(_hbFitAt && _hbFitAt.step === 'board');
    if (P.pic !== 'list') return lead + hbChartHtml(D, cs, big) + (cs.length && !onCard ? hbListFootHtml(cs, label, D.stage || null, i18tn('hb_all_counted', cs.length, { n: _hbN(cs.length) })) : '');
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
  if (D.kind === 'agents'){
    const has = key => { try { return i18t(key) !== key; } catch (_){ return false; } };
    return `<table class="hb-ctab hb-agtab"><thead><tr><th>${_hbE(i18t('hb_agt_agent'))}</th><th>${_hbE(i18t('hb_agt_does'))}</th><th>${_hbE(i18t('hb_agt_runs'))}</th><th class="r">${_hbE(i18t('hb_agt_ready'))}</th><th></th></tr></thead><tbody>`
      + D.rows.map(r => `<tr><td><b>${_hbE(i18t('ag_' + r.k))}</b></td><td class="hb-agt-does">${has('ag_' + r.k + '_does') ? _hbE(i18t('ag_' + r.k + '_does')) : ''}</td><td>${has('ag_' + r.k + '_runs') ? _hbE(i18t('ag_' + r.k + '_runs')) : ''}</td><td class="r">${_hbN(r.n)}</td>`
        + `<td class="r">${r.n ? `<button type="button" class="hb-btn" data-hb-dig="ag:${_hbE(r.k)}">${_hbE(i18t('hb_agt_open'))}</button>` : ''}</td></tr>`).join('') + '</tbody></table>';
  }
  if (D.kind === 'agent' && typeof agFind === 'function' && typeof agPanelBody === 'function') return hbAgentWorkHtml(D);
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
/* ---- COPILOT'S WORK, BELOW THE CARD (Young, 7 Oct 2026: "Go with Below the
   card") ----
   Review on a Prepared by Copilot row opens THAT agent's work here, whole: the
   same head, body and acts the Copilot's work page drew in its side panel
   (agPanelHeadHtml / agPanelBody / agPanelActs), one per item, so the work is
   read and done on the board and nothing sends the reader to a second page.
   The acts are the page's own (agRunAct) — the board adds no act of its own.
   A CAP IS A FACT: past HB_AG_WORK_MAX items the rest are counted, and each
   item's whole record is fetched once per sitting so its body can fill in. */
const HB_AG_WORK_MAX = 8;
const _hbAgLoaded = new Set();
/* THE REST ARE ONE PRESS AWAY (the Board walk-through, 15 Oct 2026: "Our
   promises 24" opened eight, and "Showing 8 of 24" had no way to the other
   sixteen): Show N more widens the agent's list for this sitting */
const _hbAgMore = new Map();
function hbAgentWorkHtml(D){
  const its = D.items.map(x => agFind(x.key)).filter(Boolean);
  const cap = HB_AG_WORK_MAX + (_hbAgMore.get(D.key) || 0);
  const shown = its.slice(0, cap);
  shown.forEach(it => {
    const c = it.c; if (!c || _hbAgLoaded.has(c.id) || typeof agLoadWhole !== 'function') return;
    _hbAgLoaded.add(c.id);
    let p = null; try { p = agLoadWhole(c); } catch (_){ p = null; }
    if (p && p.then) p.then(() => { if (typeof hbPaintBoard === 'function') try { hbPaintBoard(); } catch (_){} }, () => {});
  });
  const cards = shown.map(hbAgPieceHtml).join('');
  const more = its.length - shown.length;
  return `<div class="hb-say">${_hbE(i18t('hb_agent_say'))}</div>${hbChaseManyHtml(its)}<div class="hb-ag-works is-lines">${cards}</div>
    ${more > 0 ? `<div class="hb-foot"><span>${_hbE(i18t('hb_showing', { k: _hbN(shown.length), n: _hbN(its.length) }))}</span><button type="button" class="hb-link" data-hb-ag-more="${_hbE(D.key)}">${_hbE(i18tn('al_show_more', Math.min(more, HB_AG_WORK_MAX), { n: _hbN(Math.min(more, HB_AG_WORK_MAX)) }))}</button></div>` : ''}`;
}
/* ---- EACH PIECE FOLDED TO ONE LINE (the owner's answer (18), 19 Oct 2026:
   "Fold to one line" — round 23's row, on the Board's Jambo's work card) ----
   The agent's tag in its room's colour (jhAgentColour, the house's own), what
   it is, its reference and one sentence (agPieceTitle · agPieceRefHtml ·
   agPieceLine — readings, nothing asked of a model); then Look, its ONE act
   (agRowActOf: Answer on Redlines, Fill in 3 details, Decide the renewal,
   Send the chase, Check the 3 files) and Put away, on every piece. Look opens
   the piece whole under its row (agLookHtml: a chase's letter as it will
   leave, else the piece's body) with its other acts under it; pressed again
   it folds, and another piece's Look moves it there — one open at a time, for
   the sitting. One filled button per area: the act is filled while its piece
   is open (the open piece is the area). Every act is the house's own runner
   (agRunAct, through hbAgentWorkPress); the Board adds none. */
let _hbAgLook = null;
function hbAgPieceHtml(it){
  const T = (fn, d) => { try { return (typeof window[fn] === 'function') ? window[fn](it) : d; } catch (_){ return d; } };
  const look = _hbAgLook === it.key;
  const title = T('agPieceTitle', '') || T('agPanelTitle', '');
  const line = T('agPieceLine', '');
  const ref = T('agPieceRefHtml', '');
  const act = T('agRowActOf', null);
  const col = (typeof jhAgentColour === 'function') ? jhAgentColour(it.agent) : '';
  const tag = `<span class="hb-pc-tag"${col ? ` style="--hb-pc-c:${_hbE(col)}"` : ''}><i aria-hidden="true"></i>${_hbE(i18t('ag_' + it.agent))}</span>`;
  /* a round opened here carries its own buttons in each row (agActsInBody): the line keeps only Look */
  const inBody = look && typeof agActsInBody === 'function' && agActsInBody(it);
  const actBtn = act && !inBody ? `<button type="button" class="ui-btn ui-btn-sm${look ? ' ui-btn-primary' : ''}" data-ag-act="${_hbE(act.act)}"${act.tip ? ` title="${_hbE(act.tip)}"` : ''}>${_hbE(act.label)}</button>` : '';
  /* the piece's other acts, under it while it is open: none is lost by folding */
  const rest = look && typeof agActsOf === 'function' && !inBody ? agActsOf(it).filter(a => a.act !== 'away' && !(act && a.act === act.act)) : [];
  const restHtml = rest.length ? `<div class="ag-p-acts hb-pc-more">${rest.map(a => `<button type="button" class="${a.cls === 'link' ? 'ui-link' : 'ui-btn ui-btn-sm'}" data-ag-act="${_hbE(a.act)}"${a.tip ? ` title="${_hbE(a.tip)}"` : ''}>${_hbE(a.label)}</button>`).join('')}</div>` : '';
  const body = look ? (T('agLookHtml', '') || T('agPanelBody', '')) : '';
  const mail = look && (it.kind === 'chase' || it.kind === 'chase-firm');
  return `<div class="hb-ag-work is-line${look ? ' is-look' : ''}" data-hb-ag-item="${_hbE(it.key)}"><div class="hb-pc-r">
      <div class="hb-pc-w"><b class="hb-pc-t">${tag}<span class="hb-pc-name">${_hbE(title)}</span>${ref ? `<span class="hb-pc-ref">${ref}</span>` : ''}</b><span class="hb-pc-line"${look ? '' : ` title="${_hbE(line)}"`}>${_hbE(line)}</span></div>
      <div class="hb-pc-acts"><button type="button" class="ui-link hb-pc-look${look ? ' is-on' : ''}" data-hb-ag-look="${_hbE(it.key)}" aria-pressed="${look}" aria-expanded="${look}">${_hbE(i18t('cn_jw_look'))}</button>${actBtn}${inBody ? '' : `<button type="button" class="ui-link hb-pc-away" data-ag-act="away">${_hbE(i18t('desk_discard'))}</button>`}</div></div>
    ${look ? `<div class="hb-pc-body${mail ? ' is-mail' : ''}">${body}${restHtml}</div>` : ''}</div>`;
}
/* Home's Look opens the piece on the Board, open (ndOpenBoard) */
function hbAgLookSet(key){ _hbAgLook = key || null; }
/* Look, pressed: open this piece under its row, or fold it again */
function hbAgLookToggle(key){
  _hbAgLook = _hbAgLook === key ? null : key;
  hbPaintBoard();
  if (_hbAgLook){
    const el = document.querySelector(`[data-hb-ag-item="${CSS.escape(key)}"]`);
    if (el) try { el.scrollIntoView({ block: 'nearest' }); } catch (_){}
  }
}
/* ---- CHASE MANY AT ONCE (step 4, Young 8 Oct 2026: "one press for the
   whole list, with a tick box beside each name") ----
   Late promises only: every chase is the obligation's own act
   (obligationChase, firm where the first chase has gone), asked ONCE for the
   ticked list instead of once per row, and said honestly afterwards — how
   many went, how many wait in the outbox, how many could not go. A row with
   no address on record is drawn but cannot be ticked. */
function hbChaseItems(its){
  return (its || []).filter(it => it && it.agent === 'late' && it.ob && (it.kind === 'chase' || it.kind === 'chase-firm'));
}
function hbChaseManyHtml(its){
  const L = hbChaseItems(its);
  const ed = typeof canEdit !== 'function' || canEdit();
  if (L.length < 2 || !ed) return '';
  const ok = L.filter(it => !it.noAddress);
  const rows = L.map(it => `<label class="hb-cm-row${it.noAddress ? ' is-off' : ''}"><input type="checkbox" data-hb-chase-key="${_hbE(it.key)}"${it.noAddress ? ' disabled' : ' checked'}><span>${_hbE((it.c && it.c.counterparty) || '')}</span><small>${_hbE(it.ob.desc || '')}${it.noAddress ? ' · ' + _hbE(i18t('hb_cm_no_address')) : ''}</small></label>`).join('');
  return `<div class="hb-cm" data-hb-chase-many-box><div class="hb-cm-h">${_hbE(i18tn('hb_cm_head', L.length, { n: L.length }))}</div>${rows}
    <div class="hb-cm-foot"><button type="button" class="hb-btn is-primary" data-hb-chase-many${ok.length ? '' : ' disabled'}>${_hbE(i18tn('hb_cm_go', ok.length, { n: ok.length }))}</button><span class="hb-quiet">${_hbE(i18t('hb_cm_note'))}</span></div></div>`;
}
function hbChaseManyCount(box){
  const n = box ? box.querySelectorAll('[data-hb-chase-key]:checked').length : 0;
  const b = box && box.querySelector('[data-hb-chase-many]');
  if (b){ b.textContent = i18tn('hb_cm_go', n, { n }); b.disabled = !n; }
}
let _hbChasing = false;
async function hbChaseManyRun(box){
  if (_hbChasing || !box || typeof obligationChase !== 'function' || typeof agFind !== 'function') return;
  const keys = [...box.querySelectorAll('[data-hb-chase-key]:checked')].map(x => x.getAttribute('data-hb-chase-key'));
  const its = keys.map(k => agFind(k)).filter(it => it && it.ob && !it.noAddress);
  if (!its.length) return;
  const ok = (typeof confirmDialog === 'function') ? await confirmDialog({ title: i18tn('hb_cm_q_title', its.length, { n: its.length }),
    message: its.map(it => '• ' + ((it.c && it.c.counterparty) || '') + ' — ' + (it.ob.desc || '')).join('\n'), confirmLabel: i18tn('hb_cm_go', its.length, { n: its.length }), multiline: true }) : true;
  if (!ok) return;
  _hbChasing = true;
  const tally = { sent: 0, outbox: 0, failed: 0 };
  try {
    for (const it of its){
      let r = null;
      try { r = await obligationChase(it.cid, it.ob.id, { firm: it.kind === 'chase-firm', confirm: false, quiet: true }); } catch (_){ r = null; }
      if (r && r.sent) tally.sent++; else if (r && r.outbox) tally.outbox++; else tally.failed++;
    }
  } finally { _hbChasing = false; }
  if (typeof toast === 'function') toast(i18t('hb_cm_said', tally), tally.failed ? 'warn' : (tally.outbox ? 'warn' : 'ok'));
  if (typeof agRepaint === 'function') try { agRepaint(); } catch (_){}
  hbPaintBoard();
}
/* The panel's presses, read off the element at press time (one delegated
   listener on the board, see hbBoardClick): an act runs the page's own
   function; Send back with a note opens, cancels and sends its one box. */
function hbAgentWorkPress(el){
  const host = el.closest('[data-hb-ag-item]'); if (!host) return false;
  const key = host.getAttribute('data-hb-ag-item');
  const act = el.closest('[data-ag-act]');
  if (act){
    /* AN ACT WHOSE ANSWER IS WRITTEN IN THE PIECE ITSELF opens the piece
       first (19 Oct 2026): a drafted reply, or why there is none, is drawn in
       its body (agQuietBody), and a folded row would leave the press ending
       in nothing the reader can see — never a silent nothing */
    if (act.getAttribute('data-ag-act') === 'draftreply') _hbAgLook = key;
    if (typeof agRunAct === 'function') agRunAct(key, act.getAttribute('data-ag-act'));
    return true;
  }
  const sb = el.closest('[data-ag-sb]'); if (!sb) return false;
  const box = sb.querySelector('.ag-sb-box');
  if (el.closest('[data-ag-sb-open]')){ if (box){ box.hidden = !box.hidden; const n = box.hidden ? null : box.querySelector('.ag-sb-note'); if (n) n.focus(); } return true; }
  if (el.closest('[data-ag-sb-cancel]')){ if (box) box.hidden = true; return true; }
  if (el.closest('[data-ag-sb-go]')){ if (typeof agSendBackPress === 'function') agSendBackPress(key, sb); return true; }
  return false;
}
/* EVERY OLD DOOR ONTO COPILOT'S WORK LANDS HERE: the Board, the card open, and
   that agent's work below it (an item, when one is named, scrolled into view). */
function hbOpenAgent(k, itemKey){
  const s = hbS();
  s.face = 'board';
  /* THE BOARD, NOT A CONTRACT'S PAGE ON IT (owner, 21 Oct 2026: "Open" landed
     on a stale contract card and said "nothing prepared" over 47 pieces): a
     card brought up earlier is put away first, as every other door onto the
     Board's own page puts it away (bsCardLeave) — else the card stays the
     page on top, the Needs you card is never drawn and landOn's missing
     line is untrue. One door: Home's rows, the house and "work" asked. */
  if (typeof window.bsCardLeave === 'function') try { window.bsCardLeave(); } catch (_){}
  s.path = [];
  /* THE ONE DESK (Round A): an agent named (the house's rooms) opens the
     card on Jambo's tab; Home's "Show all" and Look have set the tab already */
  const keys = Array.isArray(window.AG_KEYS) ? AG_KEYS : [];
  if (k && keys.includes(k) && typeof window.ndShow === 'function') ndShow('jambo');
  hbSave();
  if (typeof setView === 'function') setView('dashboard');
  /* LAND ON IT (owner, 18 Oct 2026): the piece named, else that agent's
     first row, else the card itself — brought into view, pressing nothing */
  const target = () => (itemKey && document.querySelector(`#hm-agents [data-hb-ag-item="${CSS.escape(itemKey)}"]`))
    || (k && document.querySelector(`#hm-agents [data-nd-agent="${CSS.escape(k)}"]`)) || document.getElementById('hm-agents');
  if (typeof landOn === 'function') landOn(target, { block: 'start', missing: i18t('hb_land_no_work') });
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
/* A9 (the board as drawn, 11 Oct 2026): ANY CHART'S NUMBER CAN BE WATCHED —
   the contracts it counts (its own list, hbDigData), read where it is drawn;
   crossing the line is a row in the bell, nothing is sent. Kept apart from
   the six figures' watches (s.chartWatches), so theirs read as before. */
function hbChartWatchNow(key){ const D = hbDigData(key, 'all'); return D && Array.isArray(D.ids) ? D.ids.length : null; }
function hbChartWatchFired(w){ const v = hbChartWatchNow(w.key); return v != null && (w.dir === 'above' ? v > w.n : v < w.n); }
function hbChartWatchFormHtml(key, title){
  const v = hbChartWatchNow(key) || 0;
  return `<form class="hb-inl" data-hb-watch-form="chart" data-hb-watch-key="${_hbE(key)}" data-hb-watch-title="${_hbE(title || '')}">${_hbE(i18t('hb_watch_tell', { what: title || i18tn('hb_contracts_word', 2, { n: 2 }) }))}
    <select name="dir" aria-label="${_hbE(i18t('hb_watch_dir'))}"><option value="above">${_hbE(i18t('hb_watch_above'))}</option><option value="below">${_hbE(i18t('hb_watch_below'))}</option></select>
    <input type="number" name="n" value="${Math.round(v)}" min="0" aria-label="${_hbE(i18t('hb_watch_line'))}">
    <button type="submit" class="hb-btn is-primary">${_hbE(i18t('hb_watch_go'))}</button><button type="button" class="hb-btn" data-hb-watch-cancel>${_hbE(i18t('hb_cancel'))}</button>
    <span class="hb-quiet hb-wide">${_hbE(i18t('hb_watch_note'))}</span></form>`;
}
/* "Watching: above N · not yet" on the card, each with its own ×; and the form while it is open */
function hbChartWatchHtml(key, title, formKey){
  const s = hbS(), list = s.chartWatches || [];
  const mine = list.filter(w => w.key === key);
  const form = _hbWatchForm === formKey ? hbChartWatchFormHtml(key, title) : '';
  return form + (mine.length ? `<div class="hb-say hb-watching">${_hbE(i18t('hb_watching'))} ${mine.map(w => `<span class="hb-chip${hbChartWatchFired(w) ? ' is-bad' : ''}">${_hbE(i18t('hb_watch_' + w.dir) + ' ' + _hbN(w.n) + ' · ' + i18t(hbChartWatchFired(w) ? 'hb_watch_fired' : 'hb_watch_not_yet'))}<button type="button" data-hb-cwatch-stop="${list.indexOf(w)}" title="${_hbE(i18t('hb_watch_stop'))}" aria-label="${_hbE(i18t('hb_watch_stop'))}">${_hbX}</button></span>`).join(' ')}</div>` : '');
}
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
  /* the body first: it stashes what the head's edge draws (as drawn, 11 Oct 2026) */
  _hbEdgeMeta.delete('focus');
  const bodyHtml = hbFocusBodyHtml(D, s);
  const tools = D.kind === 'list' ? hbEdgeHtml(D, 'focus', 'focus') : grows && !_hbFull ? `${hbBigBtnHtml(s.digBig, 'data-hb-digbig')}` : '';
  const FM = _hbEdgeMeta.get('focus') || {};
  return `<div class="hb-focus" id="hb-focus"><nav class="hb-trail" aria-label="${_hbE(i18t('hb_trail'))}"><button type="button" data-hb-crumb="-1">${_hbE(i18t('hb_face_board'))}</button><span aria-hidden="true">›</span>${crumbs}${hbFuStepsHtml(path[path.length - 1])}</nav>
    <section class="hb-card hb-dig${_hbFocusNew ? ' is-new' : ''}${s.digBig && grows ? ' is-big' : ''}${_hbFull && grows ? ' is-full' : ''}"><header class="hb-ch">${hbStartBtnHtml(path[0], true)}<span class="hb-ch-l"><span class="hb-ct">${_hbE(title)}</span>${hbVerBadgeHtml((s.panels || []).find(x => x.key === path[path.length - 1]))}${FM.by ? `<span class="hb-cs">${_hbE(FM.by)}</span>` : ''}</span><span class="hb-grow"></span>${tools}${eye}
      ${path.length > 1 ? `<button type="button" class="hb-ib" data-hb-crumb="${path.length - 2}" title="${_hbE(i18t('hb_step_back'))}" aria-label="${_hbE(i18t('hb_step_back'))}">${_hbBack}</button>` : ''}
      <button type="button" class="hb-ib hb-x" data-hb-crumb="-1" title="${_hbE(i18t('hb_close_dig'))}" aria-label="${_hbE(i18t('hb_close_dig'))}">${_hbX}</button></header>
      <div class="hb-cb">${fk && _hbWatchForm === fk ? hbWatchFormHtml(fk) : ''}${watching}${D.kind === 'list' && /^(q|cd|ls):/.test(D.key) ? hbChartWatchHtml(D.key, title, 'chart:focus') : ''}${bodyHtml}</div></section></div>`;
}
/* the opened card is step two, or three in full screen (O-22, O-25) */
function hbFocusBodyHtml(D, s){
  if (_hbFull && !(D.kind === 'list' || D.kind === 'stages')) _hbFull = false;
  _hbFitAt = { key: 'focus', step: _hbFull ? 'full' : 'open', big: true, grow: !!s.digBig && !_hbFull };
  try { return hbDigBodyHtml(D, s.lens, !!s.digBig); } finally { _hbFitAt = null; }
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
    tile(ends, K.expiry ? i18t('hb_c_ends', { day: _hbDayWord(K.expiry) }) : i18t('hb_c_no_end'), K.expired ? 'bad' : (K.days != null && K.days <= 90 ? 'warn' : ''), 'hb-c-renew'),
    tile(K.open ? i18tn('hb_c_open', K.open, { n: K.open }) : '—', moveWord, K.move === 'you' ? 'warn' : '', 'hb-c-nego'),
    tile(_hbN(K.risks.length), K.risks.length ? i18t('hb_c_risks') : i18t('hb_c_no_risks'), K.risks.length ? 'warn' : '', 'hb-c-risk'),
    tile(_hbN(K.obligations.length), lates ? i18tn('hb_c_late', lates, { n: lates }) : i18t('hb_c_promises'), lates ? 'bad' : '', 'hb-c-ob'),
  ].join('');
  const row = (l, v) => `<div class="hb-crow"><span>${_hbE(l)}</span><span>${v}</span></div>`;
  const q = K.move === 'you' && K.holding.length ? i18t('hb_c_ask_stuck', { cp: K.cp, name: K.name, clause: K.holding[0] })
    : K.expired ? i18t('hb_c_ask_past', { name: K.name }) : i18t('hb_c_ask_risks', { name: K.name });
  return `<div class="hb-chead"><div><div class="hb-cref">${_hbRefH(K.ref)}${K.side ? ' · ' + _hbE(i18t('hb_side_' + K.side)) : ''}</div>
      <div class="hb-cname">${_hbE(K.name)}</div><div class="hb-quiet">${_hbE(K.cp || i18t('home_no_counterparty'))}${K.owner ? ' · ' + _hbE(i18t('hb_c_owned', { who: K.owner })) : ''}</div></div>
    <div class="hb-acts">${/* ONE DOOR (owner, 23 Oct 2026): Analyze contract left; Open is the Workspace door */''}<button type="button" class="hb-btn is-primary" data-hb-room="${_hbE(K.id)}" title="${_hbE(i18t('int_open_contract_title'))}">${_hbE(i18t('int_open_contract'))}</button>
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
        ${row(i18t('hb_c_end'), _hbE(K.expiry ? _hbDayWord(K.expiry) : i18t('hb_c_no_end')))}
        ${K.renewal ? row(i18t('hb_c_decide_by'), _hbE(K.renewal.decideBy ? _hbDayWord(String(K.renewal.decideBy).slice(0, 10)) : '—') + (K.renewal.auto ? ' · ' + _hbE(i18t('hb_c_auto')) : ''))
          + row(i18t('hb_c_decision'), K.renewal.decided ? _hbE(i18t('hb_c_decided')) : `<span class="hb-chip is-warn">${_hbE(i18t('hb_c_undecided'))}</span>`) : ''}
        ${K.pay != null ? row(i18t('hb_c_pay'), _hbE(i18tn('hb_c_pay_days', K.pay, { n: K.pay }))) : ''}</div>
      <div class="hb-csec" id="hb-c-ob"><div class="hb-lab">${_hbE(i18t('hb_c_ob'))}</div>
        ${K.obligations.length ? K.obligations.slice(0, 6).map(o => row(o.what, `${_hbE(o.due ? _hbDayWord(String(o.due).slice(0, 10)) : '—')} · <span class="hb-chip${o.state === 'overdue' ? ' is-bad' : ''}">${_hbE(i18t('hb_ob_' + (o.state === 'overdue' ? 'late' : 'open')))}</span>${o.who || o.theirs ? '' : ' · <span class="hb-hollow"></span>' + _hbE(i18t('hb_nobody'))}`)).join('') : `<div class="hb-quiet">${_hbE(i18t('hb_c_no_ob'))}</div>`}</div>
      <div class="hb-csec" id="hb-c-trail"><div class="hb-lab">${_hbE(i18t('hb_c_lately'))}</div>
        ${K.audit && K.audit.length ? K.audit.map(a => row(a.at ? _hbDayWord(String(a.at).slice(0, 10)) : '', _hbE([a.what, a.who].filter(Boolean).join(' · ')))).join('') : `<div class="hb-quiet">${_hbE(i18t(K.full ? 'hb_c_no_trail' : 'hb_c_loading'))}</div>`}</div>
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
  if (kind === 'obl') return `<div class="hb-say">${_hbE(i18tn('hb_say_overdue', d.n, { n: _hbN(d.n) }))} ${_hbE(i18t('hb_p_obl_more', { open: _hbN(d.open), soon: _hbN(d.soon) }))}</div>${hbOblRowsHtml(d.rows.map(r => ({ cid: r.cid, desc: r.what, assignee: r.who, counterparty: r.cp, days: -r.late, theirs: r.theirs })))}`;
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
/* ============================================================
   THE SIDE LIST, AS DRAWN (owner, 11 Oct 2026, the "HaTi Board" artifact;
   work order docs/WORKORDER-board-as-drawn.md, part B)
   ============================================================
   A press on a piece of a chart, a row of its table or a figure opens the
   contracts behind it on the RIGHT, over the page: the same list the number
   was counted from (its ids, hbDigData), one row each. A press on a row lands
   on that contract's Dossier on Home (hbSheetGo — ONE DOOR, 22 Oct 2026; the
   card it used to draw here is gone). × or Esc closes it. Reading never writes. */
let _hbSheet = null;
function hbSheetOpen(key, within, from){ _hbSheet = { key, within: !!within, from: from || null }; try { hbTipHide(true); } catch (_){} hbPaintBoard(); hbSheetFocus(); }
/* the keyboard follows the side list in, and goes back to the door it came from */
function hbSheetFocus(){ const a = document.querySelector('.hb-sheet'); if (a) try { a.focus({ preventScroll: true }); } catch (_){} }
/* A LIST LEFT LYING OVER THE BOARD IS PUT AWAY when the reader moves (the
   glitch audit's second walk, 24 Oct 2026: a figure's list opened, then Home
   or "board" asked again, still covered the Board and its Needs you buttons).
   Every page move (setView) and every ask for the Board lets it go; nothing is
   drawn for it. */
function hbSheetLetGo(){
  if (!_hbSheet) return false;
  _hbSheet = null; _hbWatchForm = null;
  const h = document.getElementById('hb-sheet-host'); if (h) h.innerHTML = '';
  return true;
}
function hbSheetClose(){ const from = _hbSheet && _hbSheet.from; _hbSheet = null; hbPaintBoard();
  const b = from ? document.querySelector(`#hb-board [data-hb-dig="${CSS.escape(from)}"]`) : null; if (b) try { b.focus({ preventScroll: true }); } catch (_){} }
/* THE SIDE LIST IS DRAWN OUTSIDE THE BOARD'S SCROLLER (owner's iPad
   screenshot, 15 Oct 2026: the list sat cut off behind Jambo's panel). iPad
   Safari clips a fixed element to the scrolling box it sits in, so a list
   drawn inside the board ended at the board's edge, under the panel and the
   page head. It lives in its own host on the page, beside the board, and
   lies on top of everything as on a laptop. */
/* ONE DOOR (owner picked "One door" by name, 22 Oct 2026, over the side
   list's card: "showing me a cut off card and you have to scroll to have
   visibility"): the list no longer draws a contract card of its own — a copy
   of the Dossier by a second builder, 615px wider than the panel with a long
   party name. A row pressed lands on the contract's own page, Home's Dossier
   beside the paper, through the door the card's Workspace button already
   used; the list is put away, and the bar's ‹ brings the Board back. */
function hbSheetGo(id){
  if (!id) return false;
  /* the list is put away first: Home's paper is drawn on the same page, and a
     list left lying over it would cover the Dossier it just opened */
  if (_hbSheet) hbSheetClose();
  if (window.roomHomeLand && roomHomeLand(id)) return true;
  if (typeof openWorkspace === 'function'){ openWorkspace(id); return true; }
  return false;
}
function hbSheetPaint(){
  const pg = hbPage(); if (!pg) return;
  let h = document.getElementById('hb-sheet-host');
  if (!h || h.parentElement !== pg){ if (h) h.remove(); h = document.createElement('div'); h.id = 'hb-sheet-host'; pg.appendChild(h); }
  hbMorph(h, hbSheetHtml());
}
function hbSheetHtml(){
  if (!_hbSheet) return '';
  const s = hbS(), lens = s.lens;
  const wrap = (title, sub, body) => `<aside class="hb-sheet" role="dialog" tabindex="-1" aria-label="${_hbE(title)}"><header class="hb-sheet-h"><div><h3>${_hbE(title)}</h3>${sub ? `<p>${_hbE(sub)}</p>` : ''}</div>`
    + `<button type="button" class="hb-ib hb-sheet-x" data-hb-sheet-x title="${_hbE(i18t('hb_close_dig'))}" aria-label="${_hbE(i18t('hb_close_dig'))}">${_hbX}</button></header><div class="hb-sheet-b">${body}</div></aside>`;
  const D = hbDigData(_hbSheet.key, lens);
  if (!D || !Array.isArray(D.ids)){ _hbSheet = null; return ''; }
  const money = hbMoneyOk();
  const cs = hbListOf(D.ids, lens).slice().sort((a, b) => money ? hbValueOfOne(b) - hbValueOfOne(a) : 0);
  const title = hbCrumbOf(_hbSheet.key, lens);
  const stream = c => (typeof FOLDERS !== 'undefined' && FOLDERS && FOLDERS[c.folder] && FOLDERS[c.folder].name) || c.folder || '';
  const owner = c => (typeof contractOwnerName === 'function' ? contractOwnerName(c) : '') || '';
  const rows = cs.map(c => `<tr data-hb-sheet-c="${_hbE(c.id)}" tabindex="0"><td><span class="hb-sheet-cp">${_hbE(c.counterparty || i18t('home_no_counterparty'))}</span><small>${_hbRefH(c)} · ${_hbE(c.name || '')}</small></td>`
    + `<td>${_hbE(stream(c))}</td><td>${_hbE(owner(c))}</td><td class="r">${money ? _hbE((typeof fmtMoneyShortOf === 'function') ? fmtMoneyShortOf(c) : _hbM(hbValueOfOne(c))) : '—'}</td><td>${_hbE(_hbStatus(c.status))}</td></tr>`).join('');
  /* a top figure's watch travels with its list (it lived on the dig-in card) */
  const fk = /^f:/.test(_hbSheet.key) ? _hbSheet.key.slice(2) : null;
  const mine = fk ? (s.watches || []).filter(w => w.k === fk) : [];
  /* the piece's own chart, one level deeper with the trail back (the dig-in it always opened) */
  const deeper = `<div class="hb-sheet-w"><button type="button" class="hb-link" data-hb-sheet-dig>${_hbE(i18t('hb_sheet_chart'))}</button></div>`;
  const watch = fk ? `<div class="hb-sheet-w"><button type="button" class="hb-link" data-hb-watch="${fk}" aria-pressed="${!!(_hbWatchForm === fk || mine.length)}">${_hbE(i18t('hb_watch_menu'))}</button></div>`
    + (_hbWatchForm === fk ? hbWatchFormHtml(fk) : '')
    + (mine.length ? `<div class="hb-say">${_hbE(i18t('hb_watching'))} ${mine.map(w => `<span class="hb-chip${hbWatchFired(w) ? ' is-bad' : ''}">${_hbE(i18t('hb_watch_' + w.dir) + ' ' + (w.k === 'value' ? _hbM(w.n) : _hbN(w.n)) + ' · ' + i18t(hbWatchFired(w) ? 'hb_watch_fired' : 'hb_watch_not_yet'))}<button type="button" data-hb-watch-stop="${s.watches.indexOf(w)}" title="${_hbE(i18t('hb_watch_stop'))}" aria-label="${_hbE(i18t('hb_watch_stop'))}">${_hbX}</button></span>`).join(' ')}</div>` : '') : '';
  const table = cs.length ? `<table class="hb-sheet-t"><colgroup><col class="c"><col class="s"><col class="o"><col class="v"><col class="g"></colgroup><thead><tr><th>${_hbE(i18t('hb_sheet_c'))}</th><th>${_hbE(i18t('hb_sheet_stream'))}</th><th>${_hbE(i18t('hb_sheet_owner'))}</th><th class="r">${_hbE(i18t('hb_c_value'))}</th><th>${_hbE(i18t('hb_c_stage'))}</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div>`;
  /* WHAT THE NUMBER COUNTS, SAID WHERE A FINGER LANDS: the figure's own
     definition lived only in its hover tip, which an iPad never shows */
  const figDef = fk ? HB_FIGS.find(f => f.k === fk) : null;
  const defSay = figDef && figDef.tip ? String(i18t(figDef.tip)).replace(/\s*(Press|Tryck)\b[^.]*\.\s*$/, '') : '';
  const def = defSay ? `<p class="hb-sheet-def">${_hbE(defSay)}</p>` : '';
  return wrap(title, i18tn('hb_sheet_sub', cs.length, { n: _hbN(cs.length) }), def + deeper + watch + table + (cs.length ? hbListFootHtml(cs, title, D.stage || null, '') : ''));
}
/* is this press a piece of a chart or a figure whose list the side list shows? */
function hbSheetKeyOf(el){
  if (!el || el.closest('.hb-sheet, .hb-pmenu, .hb-dp, .hb-trail, .hb-acts, .hb-ag, .hb-ins')) return null;
  if (!el.closest('svg.hb-svg, .hb-chart, .hb-chart-bars, .hb-ctab, .hb-small, .hb-fig-main, .hb-stagebar, .hb-stagekey')) return null;
  const k = el.getAttribute('data-hb-dig'); if (!k || /^(c|ag|pk|sy|mv|dn):/.test(k)) return null;
  const D = hbDigData(k, hbS().lens);
  return D && D.kind === 'list' && Array.isArray(D.ids) && D.ids.length ? k : null;
}
/* ============================================================
   THE CARD'S EDGE, AS DRAWN (owner, 11 Oct 2026, over the "HaTi Board"
   artifact: "the cards in the artifact are clean without filters sitting on
   the screen"; work order docs/WORKORDER-board-as-drawn.md, part A)
   ============================================================
   Every chart card's head carries exactly three controls on its right:
   How this is drawn ▾ (a panel of labelled choices — the SAME choices the
   recipe sentence offered, only those that work, each pressing the same
   handler: data-hb-rset / data-hb-rtrend / data-hb-line), Table (Chart while
   a table shows) and ⋯ (every other tool, in the artifact's order, each the
   SAME door it always was). The card's body is the chart and its notes. */
const _hbEdgeMeta = new Map(), _hbHowOn = new Set();
let _hbDrawnOpen = null;
const _HB_MI = { why: '✦', odd: '◎', how: 'ⓘ', ask: '✦', watch: '⤒', give: '➦', pack: '▤', img: '⧉', tab: '⊞', save: '☆', wi: '◇', ver: '✓', big: '⤢', full: '⛶', x: '✕', split: '⇆', view: '⌖' };
function _hbMi(attrs, sym, word, danger){
  return `<button type="button" role="menuitem" class="hb-mi${danger ? ' is-danger' : ''}" ${attrs}><span class="hb-mi-k" aria-hidden="true">${sym}</span>${_hbE(word)}</button>`;
}
function hbDrawnPanelHtml(D, P){
  const s = hbS(), o = (s.recipe || {})[D.key] || {};
  const canWhich = /^(q|ls):?/.test(D.key) && D.kind === 'list';
  const btn = (attrs, word, on, why) => `<button type="button" ${attrs} aria-pressed="${on}" class="${on ? 'is-on' : ''}"${why ? ` title="${_hbE(why)}"` : ''}>${_hbE(word)}</button>`;
  const group = (part, label) => {
    const xs = hbRcShown(part, P, D);
    if (xs.length < 2) return '';
    /* a long group (HaTi offers some thirty splits) is ONE compact list; up to a dozen stand as buttons, as drawn */
    if (xs.length > 12){
      let og = '';
      const opts = xs.map(x => { const cur = part === 'which' ? ((o.which || 'set') === x.v) : hbRcCurHas(part, P, x.v);
        const head = x.head ? `${og ? '</optgroup>' : ''}<optgroup label="${_hbE(x.head)}">` : ''; if (x.head) og = x.head;
        return `${head}<option value="${_hbE(x.v)}"${cur ? ' selected' : ''}>${_hbE(x.word)}</option>`; }).join('') + (og ? '</optgroup>' : '');
      return `<div class="hb-dp-g"><label class="hb-dp-l">${_hbE(label)}<select class="hb-dp-sel" data-hb-rsel="${_hbE(part)}">${opts}</select></label></div>`;
    }
    return `<div class="hb-dp-g"><div class="hb-dp-l">${_hbE(label)}</div><div class="hb-dp-seg">${xs.map(x => {
      const cur = part === 'which' ? ((o.which || 'set') === x.v) : hbRcCurHas(part, P, x.v);
      return btn(`data-hb-rset="${_hbE(part + ':' + x.v)}"`, x.word, cur, x.why);
    }).join('')}</div></div>`;
  };
  const canTrend = P.pic === 'cols' && P.measure !== 'live' && !P.compare;
  const trend = canTrend ? `<div class="hb-dp-g"><div class="hb-dp-l">${_hbE(i18t('hb_rc_trend'))}</div><div class="hb-dp-seg">${btn(P.trend ? 'data-hb-rtrend' : '', i18t('hb_dp_off'), !P.trend)}${btn(P.trend ? '' : 'data-hb-rtrend', i18t('hb_dp_trend_on'), !!P.trend)}</div></div>` : '';
  const RF = canTrend ? hbRefsOf(D.key, P) : null, r = (s.refs || {})[D.key] || {};
  /* reference lines (G5): the average, last year, and a target typed here */
  const lines = canTrend ? `<div class="hb-dp-g" data-hb-lines-key="${_hbE(D.key)}"><div class="hb-dp-l">${_hbE(i18t('hb_ref_lines'))}</div><div class="hb-dp-seg">${btn('data-hb-line="avg"', i18t('hb_ref_avg'), !!r.avg)}${RF && RF.lyOk ? btn('data-hb-line="ly"', i18t('hb_ref_ly'), !!r.ly) : ''}</div>`
    + `<form class="hb-ref-tgt" data-hb-tgt-form="${_hbE(D.key)}"><label for="hb-ref-tgt-in">${_hbE(i18t('hb_ref_tgt'))}</label><input id="hb-ref-tgt-in" name="t" type="text" inputmode="decimal" autocomplete="off" value="${RF.tgt != null ? _hbE(String(RF.tgt)) : ''}" placeholder="${_hbE(i18t('hb_ref_tgt_ph'))}"><button type="submit" class="hb-link">${_hbE(i18t('hb_ref_tgt_set'))}</button>${RF.tgt != null ? `<button type="button" class="hb-link" data-hb-line="tgt-off">${_hbE(i18t('hb_ref_tgt_off'))}</button>` : ''}</form></div>` : '';
  return `<div class="hb-dp-head">${_hbE(i18t('hb_dp_head'))}</div>`
    + group('pic', i18t('hb_rc_pic')) + group('measure', i18t('hb_rc_measure')) + group('split', i18t('hb_rc_split')) + group('split2', i18t('hb_rc_split2'))
    + group('compare', i18t('hb_rc_compare')) + trend + group('order', i18t('hb_rc_order')) + group('window', i18t('hb_rc_window'))
    + (canWhich ? group('which', i18t('hb_rc_which')) : '') + lines;
}
/* the head's right side for a chart card: akey is the card's own (a panel's
   id, or 'focus'); where says which card it is ('board' | 'focus') */
/* ONE WAY OFF A CARD (owner, 27 Oct 2026: "Make all charts use the exit shown in image 1"): every chart on the Board
   carries the × at the top right that an opened chart closes with, beside its ⋯ — Remove from the board is no longer
   a menu row (reverses 12 Oct's "at the foot of the menu"); a card given to you says "Take it off my board" */
function hbCardXHtml(gift){
  const w = _hbE(i18t(gift && gift.from ? 'hb_p_x_gift' : 'hb_p_x'));
  return `<button type="button" class="hb-ib hb-x" data-hb-act="x" title="${w}" aria-label="${w}">${_hbX}</button>`;
}
function hbEdgeHtml(D, akey, where, p, gift){
  const M = _hbEdgeMeta.get(akey) || {}, P = hbPlan(D), mk = akey + '|' + where, board = where === 'board';
  const drawnOpen = _hbDrawnOpen === mk, moreOpen = _hbToolsMenu === mk;
  const drawn = D.kind === 'list' ? `<span class="hb-edge-w" data-hb-rkey="${_hbE(D.key)}"><button type="button" class="hb-edge-b" data-hb-drawn="${_hbE(mk)}" aria-haspopup="dialog" aria-expanded="${drawnOpen}">${_hbE(i18t('hb_dp_btn'))}${_hbCaret}</button>`
    + (drawnOpen ? `<div class="hb-dp" role="dialog" aria-label="${_hbE(i18t('hb_dp_btn'))}">${hbDrawnPanelHtml(D, P)}</div>` : '') + '</span>' : '';
  const table = M.canTable ? `<button type="button" class="hb-edge-b" data-hb-table="${_hbE(akey)}" aria-pressed="${!!M.tab}">${_hbE(i18t(M.tab ? 'hb_edge_chart' : 'hb_edge_table'))}</button>` : '';
  const k = _hbE(D.key);
  /* THE MOST USED FIRST (owner, 12 Oct 2026): Make bigger and Full screen lead the menu; taking a card off the
     Board is the × beside it (hbCardXHtml, 27 Oct 2026) */
  /* full screen is the biggest a chart gets: there, its way back is Back to opened */
  const items = (board ? _hbMi('data-hb-act="big"', _HB_MI.big, i18t(p && p.big ? 'hb_p_small' : 'hb_p_big')) : _hbFull ? '' : _hbMi('data-hb-digbig', _HB_MI.big, i18t(hbS().digBig ? 'hb_p_small' : 'hb_p_big')))
    + (board ? _hbMi(`data-hb-fullkey="${k}"`, _HB_MI.full, i18t('hb_full_screen')) : _hbMi(`data-hb-full aria-pressed="${_hbFull}"`, _HB_MI.full, i18t(_hbFull ? 'hb_full_back' : 'hb_full_screen')))
    + '<hr>'
    /* Dig deeper (owner, 11 Oct 2026: "needs to be in the drop down"; 23 Oct
       2026: one press with What could explain this?, answering under the
       chart): without a key it greys and says why */
    + _hbMi(`data-hb-dd-on="${k}"${hbDdLive() ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}`, _HB_MI.why, i18t('hb_dd_btn'))
    + (M.cols ? _hbMi(`data-hb-odd="${k}" aria-pressed="${_hbOddOn.has(D.key)}"`, _HB_MI.odd, i18t(_hbOddOn.has(D.key) ? 'hb_odd_off' : 'hb_odd_btn')) : '')
    + _hbMi(`data-hb-howon="${k}" aria-pressed="${_hbHowOn.has(D.key)}"`, _HB_MI.how, i18t(_hbHowOn.has(D.key) ? 'hb_how_off' : 'hb_how_on'))
    + _hbMi(`data-hb-why-follow="${k}"`, _HB_MI.ask, i18t('hb_tip_ask'))
    + (/^(q|cd|ls):/.test(D.key) ? _hbMi(`data-hb-cwatch="${_hbE(akey)}"`, _HB_MI.watch, i18t('hb_watch_menu')) : '')
    + '<hr>'
    + (board && p && p.kind === 'view' && !/^gift:/.test(p.id) && !(gift && gift.from) ? _hbMi('data-hb-act="give"', _HB_MI.give, i18t('hb_p_give') + '…') : '')
    + _hbMi('data-hb-pack-one', _HB_MI.pack, i18t('hb_pack_this'))
    + (M.canTable ? (M.tab ? '' : _hbMi('data-hb-copy-img', _HB_MI.img, i18t('hb_copy_img'))) + _hbMi('data-hb-copy-tab', _HB_MI.tab, i18t('hb_copy_tab')) : '')
    + _hbMi(`data-hb-saveq="${k}"`, _HB_MI.save, i18t('hb_myq_btn'))
    + _hbMi(`data-hb-whatif="${k}" aria-pressed="${_hbWhatIf.has(D.key)}"`, _HB_MI.wi, i18t(_hbWhatIf.has(D.key) ? 'hb_wi_off' : 'hb_wi_btn'))
    + (board && p && hbMayVerify(p) ? _hbMi('data-hb-act="verify"', _HB_MI.ver, i18t('hb_ver_menu')) : '');
  const more = `<span class="hb-tools-w"><button type="button" class="hb-edge-b hb-tools-more" data-hb-tools-more="${_hbE(mk)}" aria-haspopup="menu" aria-expanded="${moreOpen}" title="${_hbE(i18t('hb_tools_more'))}" aria-label="${_hbE(i18t('hb_tools_more'))}">${typeof icon === 'function' ? icon('more', 'w-4 h-4') : '⋯'}</button>`
    + (moreOpen ? `<span class="hb-pmenu hb-tools-menu" role="menu">${items}</span>` : '') + '</span>';
  return `<span class="hb-edge hb-open-tools" data-hb-copy-t="${_hbE(M.title || '')}" data-hb-copy-s="${_hbE(M.by || '')}" data-hb-copy-n="${M.n || 0}">${drawn}${table}${more}${board ? hbCardXHtml(gift) : ''}</span>`;
}
/* a ready-made panel's ⋯ (11 Oct 2026, the artifact's card edge): its
   reading is HaTi's own (hp:<kind>), so what could explain it and asking
   about it are the same two doors an opened chart offers */
function hbKindToolsHtml(p, gift){
  const key = 'hp:' + p.kind, mk = p.id + '|kind', drawnOpen = _hbDrawnOpen === mk, moreOpen = _hbToolsMenu === mk;
  const sb = (on, word) => `<button type="button" ${on ? '' : 'data-hb-act="split"'} aria-pressed="${on}" class="${on ? 'is-on' : ''}">${_hbE(word)}</button>`;
  const drawn = `<span class="hb-edge-w"><button type="button" class="hb-edge-b" data-hb-drawn="${_hbE(mk)}" aria-haspopup="dialog" aria-expanded="${drawnOpen}">${_hbE(i18t('hb_dp_btn'))}${_hbCaret}</button>`
    + (drawnOpen ? `<div class="hb-dp" role="dialog" aria-label="${_hbE(i18t('hb_dp_btn'))}"><div class="hb-dp-head">${_hbE(i18t('hb_dp_head'))}</div><div class="hb-dp-g"><div class="hb-dp-l">${_hbE(i18t('hb_rc_split'))}</div><div class="hb-dp-seg">${sb(!p.split, i18t('hb_sp_none'))}${sb(!!p.split, i18t('hb_p_split'))}</div></div></div>` : '') + '</span>';
  /* the same order as a chart card's ⋯ (owner, 12 Oct 2026): Make bigger first; off the Board by the × (hbCardXHtml) */
  const items = _hbMi('data-hb-act="big"', _HB_MI.big, i18t(p.big ? 'hb_p_small' : 'hb_p_big'))
    + '<hr>' + _hbMi(`data-hb-dd-on="${_hbE(key)}"${hbDdLive() ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}`, _HB_MI.why, i18t('hb_dd_btn'))
    + _hbMi(`data-hb-why-follow="${_hbE(key)}"`, _HB_MI.ask, i18t('hb_tip_ask'))
    + (gift && gift.from ? '' : '<hr>' + _hbMi('data-hb-act="give"', _HB_MI.give, i18t('hb_p_give') + '…'));
  return `<span class="hb-edge">${drawn}<span class="hb-tools-w"><button type="button" class="hb-edge-b hb-tools-more" data-hb-tools-more="${_hbE(mk)}" aria-haspopup="menu" aria-expanded="${moreOpen}" title="${_hbE(i18t('hb_tools_more'))}" aria-label="${_hbE(i18t('hb_tools_more'))}">${typeof icon === 'function' ? icon('more', 'w-4 h-4') : '⋯'}</button>`
    + (moreOpen ? `<span class="hb-pmenu hb-tools-menu" role="menu">${items}</span>` : '') + '</span>' + hbCardXHtml(gift) + '</span>';
}
function hbPanelHtml(p, lens, gift){
  if (p.kind === 'view') return hbViewPanelHtml(p, lens, gift);
  const K = HB_KINDS[p.kind];
  const body = p.split
    ? `<div class="hb-split"><div><div class="hb-lab is-side">${_hbE(i18t('hb_lens_suppliers'))}</div>${hbPanelBodyHtml(p.kind, 'suppliers')}</div><div><div class="hb-lab is-side">${_hbE(i18t('hb_lens_customers'))}</div>${hbPanelBodyHtml(p.kind, 'customers')}</div></div>`
    : (p.big ? hbReadSrcHtml('hp:' + p.kind) : hbReadSrcHeadHtml('hp:' + p.kind)) + hbPanelBodyHtml(p.kind, lens);
  const given = gift && gift.sent ? `<span class="hb-given" title="${_hbE(gift.sent.note || '')}">${_hbE(i18t('hb_given', { who: gift.sent.toName || '', seen: i18t(gift.sent.seenAt ? 'hb_seen' : 'hb_not_seen') }))}<button type="button" data-hb-ungive="${_hbE(gift.sent.id)}" title="${_hbE(i18t('hb_take_back'))}" aria-label="${_hbE(i18t('hb_take_back'))}">${_hbX}</button></span>` : '';
  const from = gift && gift.from ? `<span class="hb-given is-from" title="${_hbE(gift.from.note || '')}">${_hbE(i18t('hb_from', { who: gift.from.fromName || '' }))}</span>` : '';
  return `<section class="hb-card hb-panel${(p.big || p.split) ? ' is-big' : ''}${p.id === _hbNewPanel ? ' is-new' : ''}" data-hb-pid="${_hbE(p.id)}">
    <header class="hb-ch"><span class="hb-ch-l"><span class="hb-ct">${_hbE(i18t(K.word))}</span>${from}${given}<span class="hb-cs" title="${_hbE(i18t('hb_p_src', { tab: i18t(K.src) }))}">${p.split ? _hbE(i18t('hb_side_by_side')) : _hbE(i18t(K.src))}</span></span><span class="hb-grow"></span>
      ${hbKindToolsHtml(p, gift)}</header>
    <div class="hb-cb">${_hbGiveForm === p.id ? hbGiveFormHtml(p) : ''}${body}</div></section>`;
}

/* ---- THE BOARD BALANCES ITS CARDS (work order "Home speed", Part 5; Young,
   8 Oct 2026: "train the Board tab to understand symmetry and the use of
   space to balance the board") ----
   Two cards share a row and end at the same height (index.html: .hb-grid
   stretches its rows; a card's inside stays at its top, the spare room at its
   bottom). A card that would stand ALONE on a row — the only card, the last of
   an odd count, the one left when its partner closes, the one after a big
   card — is marked `is-lone` and spans the row. Marked HERE, in the board's
   own markup, so every paint (hbMorph, a face coming back) carries it and a
   lone card's chart is measured at its full width (hbFitMeasure). A card the
   reader made big stays big. At 1180px and narrower the grid is one column,
   so every card already takes the full width. */
const HB_CARD_HEAD_RE = /^(\s*<section class="hb-card hb-panel)/;
function hbGridBalanced(html){
  const parts = String(html || '').split(/(?=<section class="hb-card hb-panel)/).filter(x => x.trim());
  const big = h => /^\s*<section class="hb-card hb-panel[^"]*\bis-big\b/.test(h);
  let col = 0;
  return parts.map((h, i) => {
    if (!HB_CARD_HEAD_RE.test(h) || big(h)){ col = 0; return h; }
    if (col === 1){ col = 0; return h; }
    const next = parts[i + 1];
    const lone = !next || !HB_CARD_HEAD_RE.test(next) || big(next);
    col = lone ? 0 : 1;
    return lone ? h.replace(HB_CARD_HEAD_RE, '$1 is-lone') : h;
  }).join('');
}
/* ---- THE BOARD ---- */
/* ---- THE BOARD'S HEAD (round 17 as drawn, "Then and now"; the owner's
   "build all the gaps", 18 Oct 2026) ----
   One white card: "Board" and what it is ("your book against six months
   ago"), the live dot and when it was counted, Summarise my board with its
   cost on the button ("1 Jambo call" — the one press here that spends), and
   under them the saved views as chips with their counts (hbSavedViewChipsHtml).
   The first row keeps its class (.hb-note): it is the line every check of
   the Board waits for. Nothing here is new data: the time is the paint's, the
   counts the map's own reading of each view (igRecipeShown). */
let _hbCountedAt = '';
function hbCountedAt(fresh){
  if (fresh || !_hbCountedAt){ try { _hbCountedAt = new Date().toLocaleTimeString(langLocale(), { hour: '2-digit', minute: '2-digit' }); } catch (_){ _hbCountedAt = ''; } }
  return _hbCountedAt;
}
function hbBoardHeadHtml(time, cut, bs, pack, deskBits){
  const at = cut ? i18t('hb_bh_counted', { time, lens: cut }) : i18t('hb_bh_counted_plain', { time });
  return `<section class="hb-card hb-bhead" id="hb-bhead"><div class="hb-note hb-bh-r"><h2 class="hb-bh-t">${_hbE(i18t('hb_face_board'))}</h2><span class="hb-bh-s">${_hbE(i18t('hb_bh_sub'))}</span>`
    + `<span class="hb-live"><i></i>${_hbE(i18t('hb_live'))}</span><span class="hb-bh-at">${_hbE('· ' + at)}</span>${deskBits || ''}<span class="hb-grow"></span>`
    + `${pack || ''}${bs.btn}${hbPulseBtnHtml()}${hbExplorerBtnHtml()}</div>${hbSavedViewChipsHtml()}</section>`;
}
/* THE PULSE BOARD'S DOOR (owner, 29 Oct 2026, off a screenshot of this head: "add a button to take you to the
   pulse board to the right of the summarize my board and move summarize my board to where the highlight is") —
   the head's last control, outlined like Summarise (one filled button per area: there is none here), so
   Summarise steps left by its width. A move, never an act: it costs nothing and says so by saying nothing. */
/* EXPLORER'S DOOR BESIDE IT (owner, 29 Oct 2026: "the explorer page has a button next to the pulse"): the map,
   one press from the Board, dressed as the Pulse board's; the face switch above still opens it too */
function hbExplorerBtnHtml(){
  return `<button type="button" class="hb-btn is-sm hb-pulse-go hb-explorer-go" data-hb-explorer title="${_hbE(i18t('hb_explorer_tip'))}">${typeof icon === 'function' ? icon('network', 'w-3.5 h-3.5') : ''}${_hbE(i18t('hb_explorer_btn'))}</button>`;
}
function hbPulseBtnHtml(){
  if (typeof renderPulse !== 'function') return '';
  /* the new look draws DNA where the Pulse board's button stood (round 6, as drawn) */
  if (typeof window.newLookOn === 'function' && newLookOn()) return hbDnaBtnHtml();
  return `<button type="button" class="hb-btn is-sm hb-pulse-go" data-hb-pulse title="${_hbE(i18t('hb_pulse_tip'))}">${typeof icon === 'function' ? icon('trend', 'w-3.5 h-3.5') : ''}${_hbE(i18t('hb_pulse_btn'))}</button>`;
}
/* SAVED VIEWS ARE CHIPS IN THE HEAD (round 17 as drawn; they moved from the
   panel to the Board's head on 15 Oct, behind one button — now each is its
   own chip with how many contracts it shows). A press opens that view on
   Explorer, where the map is (hbOpenSavedView, the one door). Drawn only
   where a view is saved. */
/* A VIEW SAVED OR FORGOTTEN (Explorer's own words, or the Board's box):
   the head's chips follow at once where the Board shows, and at its next
   showing where it does not */
function hbViewsChanged(){
  try {
    _hbBoardMissed = true;
    const host = hbHost();
    if (hbS().face === 'board' && host && host.getClientRects().length) hbPaintBoard();
  } catch (_){}
}
function hbSavedViewChipsHtml(){
  let v = []; try { v = (typeof igViewsRead === 'function') ? igViewsRead() : []; } catch (_){ v = []; }
  if (!v.length) return '';
  const chips = v.slice().reverse().map(x => {
    let n = null; try { n = (typeof igRecipeShown === 'function') ? igRecipeShown(x.recipe) : null; } catch (_){ n = null; }
    return `<button type="button" class="hb-sv-chip" data-hb-sview="${_hbE(x.name)}" title="${_hbE(i18t('hb_views_tip'))}"><span class="hb-sv-n">${_hbE(x.name)}</span>${n != null ? `<b>${_hbN(n)}</b>` : ''}</button>`;
  }).join('');
  return `<div class="hb-bh-views" role="group" aria-label="${_hbE(i18t('int_saved_views'))}"><span class="hb-bh-l">${_hbE(i18t('int_saved_views'))}</span>${chips}</div>`;
}
/* ---- DNA BY CONTRACT, AS DRAWN (the new look, round 6; the owner's pick "One strand each") ----
   Each live contract one strand: its clauses in paper order, a segment's length the clause's weight in the paper,
   coloured by what HaTi already read of it — within your standard (green), differs or a risk (amber), missing (red),
   a blank still to fill (a ring), asked about by a kept question (steel), read with nothing to say (grey) — and on
   the right its worst mark. A press opens that clause on Home's paper. Readings only (the standards check, the
   blanks, the risks, the kept answers); free. */
let _hbDna = false;
function hbDnaUp(){ return !!_hbDna && typeof window.newLookOn === 'function' && newLookOn() && hbS().face === 'board'; }
const HB_DNA_MAX = 40;
function hbDnaOf(c){
  let cls = []; try { cls = (typeof pd2Clauses === 'function') ? pd2Clauses(c) : []; } catch (_){ cls = []; }
  if (!cls.length) return null;
  const vs = (c.playbook && Array.isArray(c.playbook.verdicts)) ? c.playbook.verdicts : [];
  const word = s => String(s || '').toLowerCase();
  const head = x => word(x.headingText || x.title || '');
  const segs = cls.map((x, i) => {
    const m = /^\s*(\d+)/.exec(String(x.headingText || x.title || ''));
    return { i, no: m ? m[1] : (i === 0 ? 'pre' : ''), id: x.id || '', name: String(x.headingText || x.title || '').replace(/^\s*\d+(\.\d+)*\.?\s*/, ''), w: Math.max(1, String(x.text || '').length), k: 'read' };
  });
  const findSeg = cat => { const w = word(cat).split(/\s+/).filter(t => t.length > 3); return segs.find(sg => w.some(t => head(cls[sg.i]).includes(t))); };
  const extra = [];
  vs.forEach(v => { if (!v) return; const sg = findSeg(v.category);
    const k = v.status === 'missing' ? 'miss' : (v.status === 'aligned' || v.status === 'ok') ? 'ok' : v.status === 'na' ? '' : 'off';
    if (!k) return;
    if (sg){ const rank = { miss: 3, off: 2, ok: 1, read: 0 }; if ((rank[k] || 0) > (rank[sg.k] || 0)) { sg.k = k; sg.why = v.category; } }
    else if (k !== 'ok') extra.push({ i: segs.length + extra.length, no: '', name: v.category, w: 600, k, why: v.category, id: '' }); });
  let risks = []; try { risks = (typeof riskOpenOf === 'function') ? riskOpenOf(c) : []; } catch (_){ risks = []; }
  risks.forEach(r => { const q = word(r.quote).slice(0, 40); const sg = q && segs.find(x => word(cls[x.i].text).includes(q)); if (sg && sg.k !== 'miss'){ sg.k = 'off'; sg.why = (typeof riskTitleOf === 'function') ? riskTitleOf(r) : ''; sg.risk = true; } });
  let blanks = []; try { blanks = (typeof contractBlanks === 'function') ? contractBlanks(c).filter(b => b && !String(b.value || '').trim()) : []; } catch (_){ blanks = []; }
  if (blanks.length && segs[0] && segs[0].k === 'read') segs[0].k = 'blank';
  /* a kept question's answer that names a clause marks it asked about */
  try { const A = window.AC; if (A && A.ans) Object.values(A.ans).forEach(got => { const a = got && got[String(c.id)]; const m = a && /^\s*(\d+)/.exec(String(a.clause || ''));
    const sg = m && segs.find(x => x.no === m[1]); if (sg && sg.k === 'read') sg.k = 'asked'; }); } catch (_){ /* nothing asked */ }
  const all = segs.concat(extra);
  const n = k => all.filter(x => x.k === k).length;
  const miss = all.filter(x => x.k === 'miss').map(x => String(x.why || x.name).toLowerCase());
  const off = all.filter(x => x.k === 'off');
  const worst = miss.length ? { tone: 'ruby', t: i18tn('dna_w_miss', miss.length, { n: miss.length, what: miss.slice(0, 2).join(', ') }) }
    : off.length ? { tone: 'amber', t: off[0].risk ? i18tn('dna_w_risk', off.length, { n: off.length }) + (blanks.length ? ' \u00b7 ' + i18tn('dna_w_blanks', blanks.length, { n: blanks.length }) : '') : i18tn('dna_w_off', off.length, { n: off.length, at: off[0].no ? '\u00a7 ' + off[0].no + ' ' + off[0].name : off[0].name }) }
    : blanks.length ? { tone: 'amber', t: i18tn('dna_w_blanks', blanks.length, { n: blanks.length }) }
    : { tone: '', t: n('asked') ? i18t('dna_w_met_asked', { n: n('asked') }) : i18t('dna_w_met') };
  return { c, segs: all, clauses: segs.length, worst, miss, off: off.map(x => String(x.why || x.name).toLowerCase()), blanks: blanks.length, asked: all.filter(x => x.k === 'asked').map(x => x.no) };
}
function hbDnaRows(){
  return (state.contracts || []).filter(c => c && !c.archived && !c._codeNamed && c.status !== 'Declined' && !c.migration && !(typeof jamboOnPress === 'function' && jamboOnPress(c)))
    .slice(0, HB_DNA_MAX).map(hbDnaOf).filter(Boolean);
}
function hbDnaHtml(){
  const rows = hbDnaRows();
  const legend = [['ok', 'dna_k_ok'], ['off', 'dna_k_off'], ['miss', 'dna_k_miss'], ['blank', 'dna_k_blank'], ['asked', 'dna_k_asked'], ['read', 'dna_k_read']]
    .map(([k, w]) => `<span class="dna-lg"><i class="dna-s is-${k}"></i>${_hbE(i18t(w))}</span>`).join('');
  const strand = d => `<div class="dna-strand">${d.segs.map((sg, j) => `<button type="button" class="dna-seg" style="flex-grow:${sg.w}" data-dna-open="${_hbE(d.c.id)}" data-dna-clause="${_hbE(sg.id || '')}" title="${_hbE([sg.no ? '\u00a7 ' + sg.no : '', sg.name, sg.why && sg.why !== sg.name ? sg.why : ''].filter(Boolean).join(' \u00b7 '))}"><i class="dna-s is-${sg.k}"></i><span class="dna-no">${j % 2 === 0 || d.segs.length < 12 ? _hbE(sg.no) : ''}</span></button>`).join('')}</div>`;
  const ref = c => (typeof refHtml === 'function') ? refHtml(c) : _hbE(c.id);
  const body = rows.map(d => `<tr><td><div class="cun-name">${_hbE(d.c.name || '')}</div><div class="cun-sub">${_hbE(d.c.counterparty || '')} \u00b7 ${ref(d.c)} \u00b7 ${_hbE(i18tn('dna_clauses', d.clauses, { n: d.clauses }))}</div></td>
    <td>${strand(d)}</td><td class="dna-worst${d.worst.tone ? ' is-' + d.worst.tone : ''}">${_hbE(d.worst.t)}</td></tr>`).join('');
  return `<div class="dna-page apn-card"><div class="dna-head"><button type="button" class="ctf-back" data-dna-back>\u2039 ${_hbE(i18t('hb_face_board'))}</button><span class="ctf-crumb">\u203a</span><h2 class="ctf-h">${_hbE(i18t('dna_title'))}</h2><span class="ctf-hf">${_hbE(i18tn('dna_n', rows.length, { n: rows.length }))}</span><span class="ctf-sp"></span><span class="dna-legend">${legend}</span></div>
    <table class="apn-table cun-table dna-table"><colgroup><col style="width:24%"><col><col style="width:150px"></colgroup>
      <thead><tr><th>${_hbE(i18t('reg_col_agreement'))}</th><th>${_hbE(i18t('dna_c_strand'))}</th><th style="text-align:right">${_hbE(i18t('dna_c_worst'))}</th></tr></thead>
      <tbody>${body || `<tr><td colspan="3" class="apn-none">${_hbE(i18t('dna_none'))}</td></tr>`}</tbody></table>
    <div class="apn-foot">${_hbE(i18tn('dna_foot', rows.length, { n: rows.length }))}</div></div>`;
}
/* the DNA's panel: what the strands say across the book, the doors that follow, his note on reading a strand */
function hbDnaPanelHtml(){
  const rows = hbDnaRows(), E = _hbE;
  const tally = key => { const m = new Map(); rows.forEach(d => (d[key] || []).forEach(w => { if (!w) return; const e = m.get(w) || { w, n: 0, ids: [] }; e.n++; e.ids.push(d.c.id); m.set(w, e); })); return [...m.values()].sort((a, b) => b.n - a.n); };
  const miss = tally('miss'), off = tally('off');
  const blanks = rows.filter(d => d.blanks), asked = rows.filter(d => d.asked.length);
  const reds = rows.reduce((n, d) => n + d.miss.length, 0);
  const head = [reds ? i18tn('dna_p_red', reds, { n: reds }) : i18t('dna_p_no_red'), off[0] ? i18tn('dna_p_off', off[0].n, { what: off[0].w, n: off[0].n }) : ''].filter(Boolean).join(' ');
  const row = (l, v, src) => `<div class="pd2-ch-r"><span>${E(l)}</span><b>${E(v)}</b><i>${E(src || '')}</i></div>`;
  const list = xs => xs.slice(0, 2).map(x => i18tn('dna_p_on', x.n, { what: x.w, n: x.n })).join(' \u00b7 ');
  const rowsH = (miss.length ? row(i18t('dna_p_missing'), list(miss), i18t('dna_src_red')) : '') + (off.length ? row(i18t('dna_p_differs'), list(off), i18t('dna_src_amber')) : '')
    + (blanks.length ? row(i18t('dna_p_blanks'), i18tn('dna_p_blanks_v', blanks.length, { n: blanks.reduce((s, d) => s + d.blanks, 0), p: blanks.length }), i18t('dna_src_ring')) : '')
    + (asked.length ? row(i18t('dna_p_asked'), i18tn('dna_p_asked_v', asked.length, { n: asked.length }), i18t('dna_src_steel')) : '');
  const door = (attr, w, cost) => `<div class="pd2-ch-door"><button type="button" class="rfp-a" ${attr}>${E(w)}</button><span>${E(cost)}</span></div>`;
  const doors = miss[0] ? door(`data-dna-show="${E(miss[0].ids.join(','))}" data-dna-label="${E(i18t('dna_label_miss', { what: miss[0].w }))}"`, i18tn('dna_p_open_miss', miss[0].n, { n: miss[0].n, what: miss[0].w }), i18t('pd2_ch_free')) : '';
  const turn = `<div class="pd2-turn"><i class="pd2-jface" aria-hidden="true"></i><div><b>${E(i18t('cn2_jambo'))}</b><p>${E(i18t('dna_p_jambo'))}</p></div></div>`;
  return `<div class="pd2-chosen cun-panel"><p class="pd2-ch-head">${E(head)}</p>${rowsH ? `<div class="pd2-ch-cap">${E(i18t('dna_p_read'))}</div><div class="pd2-ch-tbl">${rowsH}</div>` : ''}${doors ? `<div class="pd2-ch-cap">${E(i18t('pd2_ch_doors'))}</div>${doors}` : ''}${turn}</div>`;
}
function hbDnaBtnHtml(){
  return `<button type="button" class="hb-btn is-sm hb-pulse-go hb-dna-go" data-hb-dna title="${_hbE(i18t('dna_tip'))}">${_hbE(i18t('dna_btn'))}</button>`;
}
if (typeof document !== 'undefined' && !document._hbDnaWired){ document._hbDnaWired = true;
  document.addEventListener('click', e => {
    const t = e.target && e.target.closest ? e.target : null; if (!t) return; let el;
    if ((el = t.closest('[data-hb-dna]'))){ e.preventDefault(); e.stopPropagation(); _hbDna = true; hbPaintBoard({ force: true }); if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    if ((el = t.closest('[data-dna-back]'))){ e.preventDefault(); _hbDna = false; hbPaintBoard({ force: true }); if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    if ((el = t.closest('[data-dna-show]'))){ e.preventDefault(); const ids = el.getAttribute('data-dna-show').split(',').filter(Boolean);
      _hbDna = false; if (typeof setView === 'function') setView('register'); if (typeof regShowOnly === 'function') regShowOnly(ids, el.getAttribute('data-dna-label') || ''); return; }
    if ((el = t.closest('[data-dna-open]'))){ e.preventDefault(); const id = el.getAttribute('data-dna-open'), cl = el.getAttribute('data-dna-clause');
      _hbDna = false; if (typeof regOpenContract === 'function') regOpenContract(id);
      if (cl && typeof igPaperGoClause === 'function'){ let n = 0; const tick = () => { const c = typeof pdContract === 'function' ? pdContract() : null;
        if (c && String(c.id) === String(id) && document.getElementById('ig-canvas')){ igPaperGoClause(cl); return; } if (++n < 40) setTimeout(tick, 100); }; setTimeout(tick, 150); } }
  }, true);
}
function hbBoardHtml(){
  if (hbDnaUp()) return hbDnaHtml();
  /* A CONTRACT BROUGHT UP IS A PAGE ON THE DESK (round 7, "Read down"): the
     card alone, none of the Board's own furniture */
  if (typeof window.bsCardId === 'function' && window.bsCardId() && typeof window.bsStripsHtml === 'function') return window.bsStripsHtml();
  /* THE CONTRACT'S VIEWS ARE GONE (owner, 15 Oct 2026: "the whole page needs
     to go as they are redundant": History is on the contract's strip,
     Obligations has its own tab in Jambo's panel, Your book was useless).
     The Board is the book again; hbOpenView re-routes every old door. */
  const s = hbS();
  const d = hbBookData(s.lens);
  const base = hbSeenTick(hbBookData('all', { whole: true }));
  const moved = (s.lens === 'all' && base && !hbCountKey()) ? hbMoved(d, base) : null;
  const A = hbAgentsData(base && base.at);
  const time = hbCountedAt(true);
  const gifts = hbGiftsFor();
  /* REMEMBERED UNTIL THE BOOK CHANGES (work order "Home speed", Part 3):
     the shelf's candidates were worked out again on every paint; they are
     kept while the day, the book (ids, versions, stages) and the board's own
     recipes are the same. */
  const insSig = hbInsMemoSig();
  /* and whenever the shelf is to choose again (no choice kept for today) */
  if (_hbInsMemoSig !== insSig || !hbS().ins){ _hbInsMemo = new Map(); _hbInsMemoSig = insSig; }
  _hbPackMemo.clear();
  _hbStoryMemo.clear();
  hbKeptSync();
  hbMovedSync();
  const panels = s.panels.slice().reverse().map(p => hbPanelHtml(p, s.lens, { sent: gifts.sent[p.id] || null })).join('');
  const received = gifts.received.map(g => /^sy_/.test(g.kind) ? hbStoryGiftHtml(g)
    : g.kind === 'cv' ? hbCvGiftHtml(g)
    : g.kind === 'view' ? hbViewPanelHtml({ id: 'gift:' + g.id, kind: 'view', key: g.spec.key, title: g.spec.title || '', recipe: g.spec.recipe || null, big: false }, HB_LENSES.includes(g.lens) ? g.lens : 'all', { from: g })
    : hbPanelHtml({ id: 'gift:' + g.id, kind: g.kind, split: !!g.split, big: false }, HB_LENSES.includes(g.lens) ? g.lens : 'all', { from: g })).join('');
  /* and the freshness line too: WHEN it was counted is a fact the reader
     cannot know; "all contracts" is one they chose. */
  const cut = [hbCountLabel(s.lens), s.lens === 'all' ? '' : i18t('hb_lens_' + s.lens).toLowerCase()].filter(Boolean).join(' · ');
  const bs = hbBoardSumHtml();
  /* THE BOARD: its head, Your book, then ALL of Needs you (Round A, the
     owner's yes of 22 Oct 2026: Home keeps the top three of each group and
     "Show all" lands here; it took the place of Jambo's work card), Today's
     insights, the strips and the cards. */
  /* Make a pack, where the Board keeps a chart: in the head, beside Summarise */
  const pack = s.panels.some(p => p.kind === 'view') ? `<button type="button" class="hb-btn is-sm" data-hb-pack-dl>${_hbE(i18t('hb_pack_btn'))}</button>` : '';
  /* on a computer the head row is gone (the SAP way, 18 Oct 2026): the
     counting chip stands on the Board's own head. Its Light | Dark went with
     dark mode (owner, 20 Oct 2026). */
  const desk = typeof window.deskShellOn === 'function' && window.deskShellOn();
  const deskBits = desk ? `<span class="hb-counting">${hbCountChipHtml()}</span>` : '';
  return `${hbBoardHeadHtml(time, cut, bs, pack, deskBits)}
    ${bs.box}
    ${hbBookHtml(d, moved, base && base.at)}
    ${hbPrepHtml(A, base && base.at)}
    ${typeof window.bsStripsHtml === 'function' ? window.bsStripsHtml() : ''}
    ${hbFocusHtml()}
    ${(received || panels) ? `<div class="hb-grid">${hbGridBalanced(received + panels)}</div>` : hbEmptyHtml()}`;
}
/* THE BOARD ENDS WITH ITS INSIGHTS (round 17 as drawn; the owner's "build
   all the gaps", 18 Oct 2026): the dashed box that said where Jambo's
   answers land ("hb_empty", inert in both books) is gone — a tip, said by
   nothing the drawing shows. A brand-new workspace keeps its one door. */
function hbEmptyHtml(){
  const door = hbSetupDoorHtml();
  return door ? `<div class="hb-grid"><div class="hb-empty is-setup">${door}</div></div>` : '';
}
/* ---- FINISH SETTING UP (9 Oct 2026, the overnight run) ----
   A brand-new Home said nothing about what to do first while the admin's
   go-live checklist waited in Settings. NO BAND: one door inside the board's
   own empty slot, for an admin, while the book holds no contract and the
   checklist has rows left — its count is stGoLive's, the list it opens
   (Settings → Build & launch → Before going live). Nothing at all once
   either is done. The ceiling row reads the Copilot config, so that is read
   first and the door repainted where it stands. */
let _hbSetupAsked = false;
/* ONE READING, TWO PLACES (17 Oct 2026): since signing in lands on the Counter
   (the owner's "Front desk"), the same count is the admin's row there too
   (counter.js); null where the door is not drawn at all. */
function hbSetupLeft(){
  try {
    if (!(typeof isAdmin === 'function' && isAdmin())) return null;
    if ((state.contracts || []).length) return null;
    if (typeof window.stGoLive !== 'function') return null;
    if (!state.aiCfg && !_hbSetupAsked && typeof window.stLoadAiCfgOnce === 'function'){ _hbSetupAsked = true;
      window.stLoadAiCfgOnce().then(() => {
        const el = document.querySelector('[data-hb-setup-slot]');
        if (el) el.outerHTML = hbSetupDoorHtml() || '<span data-hb-setup-slot hidden></span>';
        if (state.view === 'counter' && typeof window.renderCounter === 'function') window.renderCounter();
      }).catch(() => {}); }
    return window.stGoLive().filter(r => !r.ok).length;
  } catch (_){ return null; }
}
function hbSetupGo(){ if (typeof window.openSettingsAt === 'function') window.openSettingsAt('build', 'golive'); }
function hbSetupDoorHtml(){
  const left = hbSetupLeft();
  if (left == null) return '';
  if (!left) return '<span data-hb-setup-slot hidden></span>';
  return `<div data-hb-setup-slot style="margin-top:12px"><button type="button" class="ui-btn" data-hb-setup>${_hbE(i18tn('hb_setup_left', left, { n: left }))}</button></div>`;
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
      const why = sev.slice(0, 2).map(it => String((typeof riskTitleOf === 'function' ? riskTitleOf(it) : it.title) || '').trim()).filter(Boolean);
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
    : (P.rows || []).map((r, i) => `<tr><td class="hb-pk-i">${i + 1}</td><td><button type="button" class="hb-read-n" data-hb-dig="c:${_hbE(r.c.id)}">${_hbRefH(r.c)}</button> <span class="hb-quiet">${_hbE(r.c.counterparty || r.c.name || '')}</span></td><td class="hb-pk-n">${_hbE(r.cells[0])}</td><td>${_hbE(r.why || '—')}</td></tr>`).join('');
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
/* a saved view opens on Explorer: the face turns first (its arrival sets the
   Board's lens on the map), then the view's own recipe is laid over it, one
   step back on the map's Undo; nothing is said in Jambo's conversation */
function hbOpenSavedView(name){
  const v = (typeof igViewFind === 'function') ? igViewFind(name) : null;
  if (!v || !window.intel || typeof igRecipeSet !== 'function'){
    if (typeof toast === 'function') toast(i18t('hb_views_gone'), 'warn');
    hbPaintBoard(); return false; }
  hbSetFace('explorer');
  if (typeof igRecipePush === 'function') igRecipePush();
  igRecipeSet(v.recipe);
  try { if (typeof rebuildIntelGraph === 'function') rebuildIntelGraph(); } catch (_){}
  try { if (typeof updateIntelNote === 'function') updateIntelNote(); } catch (_){}
  return true;
}
function hbBoardSumHtml(){
  const src = hbBoardSrc(); const key = HB_BOARD_KEY;
  const kept = hbWhyKept(key, src.sig), busy = _hbWhyBusy.has(key), err = _hbWhyErr.get(key);
  const live = typeof copilotAvailable === 'function' && copilotAvailable();
  /* A BUTTON, NOT A LINK (Young, 7 Oct 2026: "summarise my board should be a
     button") — the board's own small outlined control; same press, same hover. */
  /* THE COST IN ITS HOVER, NOT ON ITS FACE (owner, 29 Oct 2026, off a screenshot of this head: "the jambo count
     next to summarise my board disappears"; reverses round 17's "1 Jambo call" segment): the button says what it
     costs when the pointer rests on it, and nothing is spent until it is pressed */
  const btn = `<button type="button" class="hb-btn is-sm hb-bs-go" data-hb-why="${_hbE(key)}"${busy ? ' disabled' : ''}${live ? ` title="${_hbE(i18t('hb_bs_cost') + ' · ' + i18tn('hb_cx_cost', src.cs.length, { n: _hbN(src.cs.length) }))}"` : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t(kept ? 'hb_bs_again' : 'hb_bs_btn'))}</button>`;
  let box = '';
  if (busy) box = `<div class="hb-why" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_bs_title'))}</span></div><p class="hb-quiet">${_hbE(i18t('hb_bs_busy'))}</p></div>`;
  else if (err) box = `<div class="hb-why is-err" aria-live="polite"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_bs_title'))}</span></div><p>${_hbE(err)}</p></div>`;
  else if (kept) box = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_bs_title'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: kept.at }))}</span></div>
    <div class="hb-why-b">${hbSay(kept.text)}</div>
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
  /* a story's own deeper run is kept while the story is (its chapters live on it) */
  const held = new Set(Object.values(s.sy || {}).map(r => r && r.deeper).filter(Boolean));
  const ks = Object.keys(s.an).filter(k => !held.has(k)); while (ks.length > HB_DD_KEEP) delete s.an[ks.shift()];
  hbSave();
}
/* THE LOOP: ask, run the step, send it back — at most HB_DD_STEPS + 1 calls.
   ON A STORY (opts.story, Young, 6 Oct 2026: "Use Dig deeper as the name")
   it is the same act with a longer allowance (HB_STORY_STEPS): the story's
   own fact sheets go with the question, the run stays on the story's card,
   and the finish names which steps became chapters, what to watch and which
   ideas were set aside — every sentence checked like the summary. */
async function hbDigDeeper(q, opts){
  const o = opts || {};
  const t = String(q || '').trim(); const s = hbS();
  if (!t || s.face !== 'board') return null;
  const max = o.story ? HB_STORY_STEPS : HB_DD_STEPS;
  const id = 'r' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const run = { id, q: t.slice(0, 400), steps: [], state: 'busy', summary: '', dropped: 0, cards: [], next: [], err: '', notice: '', at: '', max };
  if (o.story){ run.story = o.story; run.chapters = []; run.watch = []; run.aside = []; }
  if (o.on){ run.on = String(o.on); run.sig = String(o.sig || ''); }
  hbDdKeep(run); _hbDdBusy.add(id);
  if (o.story) hbStoryDeeperSet(o.story, id); else if (o.on) hbPaintBoard(); else hbDig('an:' + id, false);
  if (!hbDdLive()){ run.state = 'err'; run.err = i18t('hb_cx_nokey'); _hbDdBusy.delete(id); hbDdKeep(run); hbPaintBoard(); return run; }
  const lens = s.lens, nums = new Set(), sent = [];
  if (o.sheet) hbNumsOf(o.sheet).forEach(x => nums.add(x));
  try {
    for (let n = 0; n <= max; n++){
      if (run.stopped) break;
      const body = { question: run.q, guide: hbDataGuide(lens), board: hbBoardNow(), lang: i18t('hb_cx_lang'), steps: sent };
      if (o.story) body.story = String(o.sheet || '').slice(0, HB_STORY_SHEET_MAX);
      else if (o.on) body.chart = String(o.sheet || '').slice(0, HB_DD_SHEET_MAX);
      const r = await api('board/analyst', 'POST', body);
      if (r && r.notice) run.notice = String(r.notice).slice(0, 300);
      const st = r && r.step; if (!st) throw new Error('no step');
      if (run.stopped) break;
      if (st.name === 'finish' || n === max){
        const f = st.name === 'finish' ? st.input || {} : {};
        const chk = hbFactCheck(f.summary || '', nums);
        run.summary = chk.text.slice(0, 1500); run.dropped = chk.dropped;
        run.cards = (Array.isArray(f.cards) ? f.cards : []).slice(0, 3);
        run.next = (Array.isArray(f.next) ? f.next : []).map(x => hbPlainText(x, 120)).filter(Boolean).slice(0, 3);
        if (o.story) hbStoryFinish(run, f, nums);
        break;
      }
      const out = st.name === 'pack' ? hbDdPack(st.input, lens) : hbDdCalc(st.input, lens);
      out.nums.forEach(x => nums.add(x));
      if (out.cov){ const c = out.cov; [c.n, c.read, c.checked, c.n - c.read, c.n - c.checked].forEach(x => nums.add(String(x))); }
      run.steps.push({ name: st.name, why: hbPlainText(st.input && st.input.why, 200), title: out.title, lines: (out.lines || []).slice(0, 4).map(l => _hbE(hbFactPlain(l))), ids: out.ids.slice(0, HB_DD_IDS_MAX), n: out.ids.length, dig: out.dig || '',
        input: st.name === 'calculate' ? { which: (st.input && st.input.which) || { all: true }, recipe: (st.input && st.input.recipe) || {} } : null });
      sent.push({ name: st.name, input: st.input, result: String(out.say).slice(0, HB_DD_SHEET_MAX) });
      hbDdKeep(run); hbPaintBoard();
    }
    run.state = run.stopped ? 'stopped' : run.summary ? 'done' : 'empty';
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
  return `<div class="hb-dd" data-hb-dd="${_hbE(D.run.id)}"><p class="hb-dd-q">${_hbE(D.run.q)}</p>${hbDdBodyHtml(D.run)}</div>`;
}
/* DIG DEEPER ON A CARD: the run that card asked for (run.on), while its
   numbers are the ones it was asked over (run.sig) */
function hbDdOn(key, sig){
  const an = hbS().an || {};
  return Object.values(an).reverse().find(r => r && r.on === key && (!sig || !r.sig || r.sig === sig)) || null;
}
/* GO FURTHER: under the card's quick read, the analyst's steps */
function hbDdOnHtml(key, sig, quickDone){
  const run = hbDdOn(key, sig), busy = !!(run && _hbDdBusy.has(run.id)), live = hbDdLive();
  if (!run && !quickDone) return '';
  const again = run && !busy && run.state !== 'done';
  const ask = run && !again ? '' : `<div class="hb-why-ask hb-dd-far"><button type="button" class="hb-btn" data-hb-dd-far="${_hbE(key)}"${live ? '' : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t(again ? 'hb_cx_again' : 'hb_dd_far'))}</button>
    <span class="hb-quiet">${_hbE(live ? i18t('hb_dd_cost', { n: HB_DD_STEPS, m: HB_DD_STEPS + 1 }) : i18t('hb_cx_nokey'))}</span></div>`;
  return ask + (run ? `<div class="hb-dd is-on" data-hb-dd="${_hbE(run.id)}">${hbDdBodyHtml(run)}</div>` : '');
}
/* the press: the card's own reading opens and its fact sheet goes with the question */
function hbDdOnPress(key){
  const src = hbReadSrc(key); if (!src) return null;
  const run = hbDdOn(key, src.sig); if (run && _hbDdBusy.has(run.id)) return null;
  _hbReadOpen.add(key);
  const sheet = hbFactSheet(src);
  return hbDigDeeper(String(src.title || '').trim() || key, { on: key, sig: src.sig, sheet: sheet ? sheet.text : '' });
}
function hbDdBodyHtml(run){
  const busy = _hbDdBusy.has(run.id);
  /* a step's reading is words: its own doors pointed at a calculation that
     is not a card; the step's ONE door is the count beside its name */
  const how = `<details class="hb-how hb-dd-how"${busy || !run.summary ? ' open' : ''}><summary>${_hbE(i18t('hb_how_title'))} · ${_hbE(i18tn('hb_dd_steps', run.steps.length, { n: run.steps.length }))}</summary>${hbDdStepsHtml(run, busy)}</details>`;
  let ans = '';
  if (run.state === 'err') ans = `<div class="hb-why is-err"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_answer'))}</span></div><p>${_hbE(run.err)}</p></div>`;
  else if (run.summary) ans = `<div class="hb-why"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_answer'))}</span><span class="hb-grow"></span><span class="hb-read-src">${_hbE(i18t('hb_cx_when', { at: run.at }))}</span></div>
    <div class="hb-why-b">${hbSay(run.summary)}</div>
    <div class="hb-why-f"><span class="${run.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(run.dropped ? i18tn('hb_cx_dropped', run.dropped, { n: run.dropped }) : i18t('hb_cx_ok'))}</span>${run.notice ? `<span>${_hbE(run.notice)}</span>` : ''}</div></div>`;
  else if (!busy) ans = `<div class="hb-why is-err"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_answer'))}</span></div><p>${_hbE(i18t('hb_dd_empty'))}</p></div>`;
  const add = run.cards.length ? `<div class="hb-dd-add">${run.added ? `<span class="hb-quiet">${_hbE(i18tn('hb_dd_added', run.cards.length, { n: run.cards.length }))}</span>`
    : `<button type="button" class="ui-btn ui-btn-sm" data-hb-dd-add="${_hbE(run.id)}">${_hbE(i18tn('hb_dd_add', run.cards.length, { n: run.cards.length }))}</button><span class="hb-quiet">${_hbE(run.cards.map(c => c.title || i18t('hb_dd_card')).join(' · ').slice(0, 200))}</span>`}</div>` : '';
  const next = run.next.length ? `<div class="hb-nx"><span class="hb-nx-l">${_hbE(i18t('hb_nx_label'))}</span>${run.next.map(q => `<button type="button" class="hb-nx-q" data-hb-next="${_hbE(q)}">${_hbE(q)}</button>`).join('')}</div>` : '';
  return ans + add + how + next;
}

/* ============================================================
   STORIES — A TREND TOLD IN CHAPTERS (Young, 6 Oct 2026: picked "Quick
   Story" off the "Trend Story Agents" proposal, then "Use Dig deeper as the
   name, build it now")
   ============================================================
   "Build me a story of our negotiation friction over the last year" opens a
   STORY on the board: four chapters, each an ordinary chart card HaTi counts
   for free (sy:<topic>.c1 …, every number a door), and the words — a short
   lead and two or three sentences under each chapter — written by Copilot in
   ONE call from the chapters' fact sheets and checked number by number
   (hbFactCheck); a sentence with a number HaTi did not count is left out and
   the count of those is said. Asking for the story is the press that spends
   the one call; with no key the chapters stand with HaTi's own readings and
   the card says the words need Copilot. The words are kept for the day with
   the numbers they were written over (sig); when the numbers move the card
   says so and offers to write them again.
   DIG DEEPER ON A STORY is the board's one Dig deeper (hbDigDeeper) with a
   longer allowance (HB_STORY_STEPS): Copilot puts forward ideas about what
   drove the trend, HaTi counts each, and the finish names which steps became
   chapters, what to watch and which ideas were set aside. The cost sits beside
   the button; Stop stops it at the next step.
   SHARE is "give a panel to a colleague": what travels is the story's NAME
   (kind sy_<topic>) and a note, never a figure; their Home counts it again
   over the contracts they may see. Ten topics: friction · renewals ·
   spend · pipeline · risk · payment terms · obligations · one counterparty ·
   one value stream · the quarterly review (Young, 6 Oct 2026: "Build the
   other seven story topics"). A story about ONE counterparty or ONE stream
   carries its name in its id (`party~<name>`, `stream~<folder>`, hbStoryId);
   every other piece takes the id as it takes a topic. A new topic is a new
   entry in hbStoryData. NOTHING HERE WRITES A CONTRACT. */
const HB_STORIES = ['friction', 'renewals', 'spend', 'pipeline', 'risk', 'payterms', 'obligations', 'party', 'stream', 'quarter'];
const HB_STORY_ARG = ['party', 'stream'];
const HB_STORY_STEPS = 15, HB_STORY_KEEP = 6, HB_STORY_SHEET_MAX = 6000, HB_STORY_CH_SHEET = 1400, HB_STORY_BARS = 6;
const HB_STORY_WORD = /\b(?:story|stories|storyline|narrative|berättelse\w*)\b/;
/* "brief me on Kevian before the renewal meeting" asks for one counterparty's story */
const HB_STORY_BRIEF = /\b(?:brief me on|briefing on|brief on|ge mig en genomgång av)\b/;
const HB_STORY_RE = {
  /* by its own name; never "board pack", which names cards ("rename this card to Board pack") */
  quarter: /\b(?:quarterly(?: contract)? review|quarter in review|review of the quarter|kvartalsgenomgång\w*|kvartalsrapport\w*)\b/,
  friction: /\b(?:friction|negotiat\w*|rounds?|redlin\w*|förhandl\w*|friktion)\b/,
  renewals: /\b(?:renew\w*|expir\w*|ending|endings|notice|förny\w*|löper ut|upphör\w*)\b/,
  pipeline: /\b(?:pipeline|signing pipeline|in (?:draft|review)|drafts?|open deals|deals in progress|gone quiet|stuck deals|pågående avtal|utkast)\b/,
  risk: /\b(?:risk\w*|exposure|standards?|playbook|liability caps?|riskexponering|standarder)\b/,
  payterms: /\b(?:payment terms?|payment days|days to pay|payers?|paying|betalningsvillkor|betalningstid)\b/,
  obligations: /\b(?:obligations?|duties|duty|deliverables?|skyldighet\w*)\b|(?:^|\s)åtagande\w*/,
  spend: /\b(?:spend\w*|value|money|worth|where (?:our|the) money|portfolio|värde\w*|pengar|utgift\w*)\b/,
};
const HB_STORY_ORDER = ['quarter', 'friction', 'renewals', 'pipeline', 'risk', 'payterms', 'obligations', 'spend'];
/* a story's id: a topic, or a topic and the one name it is about */
function hbStoryId(sid){
  const s = String(sid || ''), at = s.indexOf('~');
  const topic = at < 0 ? s : s.slice(0, at);
  let arg = null; if (at >= 0){ try { arg = decodeURIComponent(s.slice(at + 1)); } catch (_){ arg = null; } }
  return { topic, arg };
}
function hbStorySid(topic, arg){ return arg == null ? topic : topic + '~' + encodeURIComponent(arg).replace(/\./g, '%2E'); }
function hbStoryValid(sid){
  const { topic, arg } = hbStoryId(sid);
  if (!HB_STORIES.includes(topic)) return false;
  return HB_STORY_ARG.includes(topic) ? !!(arg && String(arg).trim()) : arg == null;
}
function hbStoryTitle(sid){
  const { topic, arg } = hbStoryId(sid);
  if (topic === 'party') return i18t('hb_sy_party', { who: arg || '' });
  if (topic === 'stream') return i18t('hb_sy_stream', { what: _hbStreamName(arg) });
  return i18t('hb_sy_' + topic);
}
/* the counterparty or stream a question names: the whole name, or the name
   without its company ending ("Kevian Kenya" for "Kevian Kenya Ltd") */
const HB_STORY_SUFFIX = /\s+(?:ltd|limited|plc|inc|llc|ab|oy|as|gmbh|co|company|kenya ltd)\.?$/i;
function _hbStoryNameIn(t, names){
  let best = null;
  names.forEach(([key, name]) => {
    const n = _hbRcNorm(name).trim(), short = n.replace(HB_STORY_SUFFIX, '').trim(), first = short.split(' ')[0];
    const hit = (w, len) => w && w.length >= len && t.includes(' ' + w + ' ');
    const score = hit(n, 3) ? n.length + 1000 : hit(short, 3) ? short.length + 500 : hit(first, 5) ? first.length : 0;
    if (score && (!best || score > best.score)) best = { key, score };
  });
  return best ? best.key : null;
}
const _hbStreamName = f => (typeof FOLDERS !== 'undefined' && FOLDERS && FOLDERS[f] && FOLDERS[f].name) || String(f || '');
function hbStoryOfQ(q){
  const t = ' ' + _hbRcNorm(q) + ' ';
  const brief = HB_STORY_BRIEF.test(t);
  /* "build our quarterly review" is a story by its own name */
  if (HB_STORY_RE.quarter.test(t)) return 'quarter';
  if (!HB_STORY_WORD.test(t) && !brief) return null;
  const book = (window.state && Array.isArray(state.contracts)) ? state.contracts.filter(c => c && !c.archived) : [];
  const cps = [...new Set(book.map(c => String(c.counterparty || '').trim()).filter(Boolean))].map(n => [n, n]);
  const streams = [...new Set(book.map(c => c.folder).filter(Boolean))].map(f => [f, _hbStreamName(f)]);
  const party = _hbStoryNameIn(t, cps); if (party) return hbStorySid('party', party);
  const topic = HB_STORY_ORDER.find(k => k !== 'quarter' && HB_STORY_RE[k].test(t));
  const stream = _hbStoryNameIn(t, streams);
  if (stream && (!topic || brief)) return hbStorySid('stream', stream);
  return topic || null;
}
const _hbStoryMemo = new Map();
const _hbSyBusy = new Set(), _hbSyErr = new Map();
/* an obligation still to do, and when it is due */
function _hbObOpen(o){ return !!o && !o.completedAt && !o.done && o.status !== 'done' && o.status !== 'completed'; }
function _hbObDue(o){ const d = String((o && o.due) || '').slice(0, 10); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null; }
/* THE STORY, counted once per paint: its chapters, each a chart card or a
   ranked list, all HaTi's arithmetic */
function hbStoryData(sid, lens){
  const memoKey = sid + '|' + (lens || 'all') + '|' + ((window.state && state.contracts) ? state.contracts.length : 0);
  if (_hbStoryMemo.has(memoKey)) return _hbStoryMemo.get(memoKey);
  const { topic, arg } = hbStoryId(sid);
  const book = hbBook(lens || 'all'), money = hbMoneyOk();
  const ids = list => list.map(c => c.id);
  const S = { topic, sid, arg, title: hbStoryTitle(sid), period: i18t('hb_sy_per_' + topic), money, chapters: [], lists: {} };
  const ch = (id, chart, set) => S.chapters.push({ id, title: i18t('hb_sy_' + topic + '_' + id), chart, ids: ids(set) });
  /* a ranked list as a chapter: each row a door onto its contracts */
  const barCh = (id, rows, head, top, unit) => {
    rows = rows.filter(r => r.n).sort((a, b) => b.n - a.n || String(a.label).localeCompare(String(b.label))).slice(0, HB_STORY_BARS);
    const bars = rows.map((r, i) => { const k = id + '_' + i; S.lists[k] = { title: r.label, ids: [...new Set(r.ids)] };
      return { g: r.label, label: r.label, n: r.n, v: r.n, say: i18tn(unit || 'hb_n_contracts', r.n, { n: _hbN(r.n) }), dig: 'sy:' + sid + '.k:' + k }; });
    S.chapters.push({ id, title: i18t('hb_sy_' + topic + '_' + id), bars, top: top || 'hb_sy_bars_most', unit: unit || 'hb_n_contracts',
      facts: [head, ...rows.map(r => `- ${r.label}: ${r.n}`)], empty: !bars.length });
  };
  const mv = money ? 'value' : 'count';
  const live = book.filter(_hbLive);
  const last12 = { last: 12, unit: 'm', date: 'signed' }, next12 = { next: 12, unit: 'm', date: 'end' };
  if (topic === 'friction'){
    ch('c1', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'rounds', trend: true, window: last12 }, book);
    ch('c2', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'medianDaysToSign', trend: true, window: last12 }, book);
    /* which clauses get redlined: the friction tab's own ledger, its year */
    let st = null; try { st = (typeof intelFrictionStats === 'function') ? intelFrictionStats({ days: 365 }) : null; } catch (_){ st = null; }
    const inL = new Set(ids(book));
    barCh('c3', ((st && st.clauses) || []).map(cl => { const cs = (cl.ids || []).filter(x => inL.has(x)); return { label: cl.label, ids: cs, n: cs.length }; }),
      'Clauses redlined in negotiations active in the last 12 months (clause: contracts):', 'hb_sy_bars_top');
    ch('c4', { pic: 'bars', split: { by: 'counterparty' }, measure: 'rounds', top: 6, sort: { by: 'value', dir: 'down' }, window: last12 }, book);
  }
  if (topic === 'renewals'){
    ch('c1', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, measure: mv, window: next12 }, live);
    ch('c2', { pic: 'bars', split: { by: 'folder' }, measure: mv, window: next12 }, live);
    ch('c3', { pic: 'ring', split: { by: 'autorenew' }, measure: 'count', window: next12 }, live);
    ch('c4', { pic: 'ring', split: { by: 'decision' }, measure: 'count', window: { next: 12, unit: 'm', date: 'decision' } }, live);
  }
  if (topic === 'spend'){
    ch('c1', { pic: 'bars', split: { by: 'folder' }, measure: mv }, live);
    ch('c2', { pic: 'bars', split: { by: 'counterparty' }, measure: mv, show: 'share', top: 5 }, live);
    ch('c3', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: money ? 'avgValue' : 'count', trend: true, window: last12 }, book);
    ch('c4', { pic: 'bars', split: { by: 'folder' }, measure: mv, compare: 'year', window: { last: 1, unit: 'y', date: 'signed' } }, book);
  }
  if (topic === 'pipeline'){
    const open = book.filter(c => c.status === 'Draft' || c.status === 'Under Review');
    ch('c1', { pic: 'ring', split: { by: 'status' }, measure: 'count' }, open);
    ch('c2', { pic: 'ring', split: { by: 'move' }, measure: 'count' }, open);
    ch('c3', { pic: 'bars', split: { by: 'folder' }, measure: 'medianDaysToSign', window: last12 }, book);
    ch('c4', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'created' }, measure: 'count' }, open);
  }
  if (topic === 'risk'){
    /* where the money at risk sits */
    ch('c1', { pic: 'bars', split: { by: 'folder' }, measure: money ? 'exposure' : 'count' }, live);
    ch('c2', { pic: 'ring', split: { by: 'standards' }, measure: 'count' }, live);
    ch('c3', { pic: 'ring', split: { by: 'liabcap' }, measure: 'count' }, live);
    ch('c4', { pic: 'bars', split: { by: 'counterparty' }, measure: money ? 'exposure' : 'count', top: 6, sort: { by: 'value', dir: 'down' } }, live);
  }
  if (topic === 'payterms'){
    ch('c1', { pic: 'bars', split: { by: 'payterms' }, measure: 'count' }, live);
    ch('c2', { pic: 'bars', split: { by: 'counterparty' }, measure: 'payDays', top: 6, sort: { by: 'value', dir: 'down' } }, live);
    ch('c3', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'payDays', trend: true, window: last12 }, book);
    ch('c4', { pic: 'bars', split: { by: 'side' }, measure: 'payDays' }, live);
  }
  if (topic === 'obligations'){
    /* the duties themselves, off each contract's own list (open = not done) */
    const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const today = hbToday(), soon = (() => { const d = new Date(today + 'T00:00:00'); d.setMonth(d.getMonth() + 3); return iso(d); })();
    const duties = []; live.forEach(c => (Array.isArray(c.obligations) ? c.obligations : []).forEach(o => { if (_hbObOpen(o)) duties.push({ c, o, due: _hbObDue(o) }); }));
    const late = duties.filter(d => d.due && d.due < today), coming = duties.filter(d => d.due && d.due >= today && d.due <= soon);
    const group = (list, keyOf) => { const m = new Map(); list.forEach(d => { const k = keyOf(d); const r = m.get(k) || { label: k, ids: [], n: 0 }; r.ids.push(d.c.id); r.n++; m.set(k, r); }); return [...m.values()]; };
    const who = d => String((d.o && d.o.assignee) || ((typeof contractOwnerName === 'function') ? contractOwnerName(d.c) : '') || i18t('hb_sy_nobody'));
    ch('c1', { pic: 'ring', split: { by: 'overdue' }, measure: 'count' }, live);
    barCh('c2', group(coming, d => hbReadMonth(d.due.slice(0, 7))), 'Duties due in the next 3 months, by month (month: duties):', 'hb_sy_bars_duty', 'hb_sy_n_duties');
    barCh('c3', group(late.concat(coming), who), 'Duties overdue or due in the next 3 months, by who owns them (owner: duties):', 'hb_sy_bars_duty', 'hb_sy_n_duties');
    barCh('c4', group(late, d => String(d.c.counterparty || '').trim() || i18t('hb_sy_nobody')), 'Overdue duties, by counterparty (counterparty: duties):', 'hb_sy_bars_duty', 'hb_sy_n_duties');
  }
  if (topic === 'party'){
    const theirs = book.filter(c => String(c.counterparty || '').trim() === arg), lv = theirs.filter(_hbLive);
    ch('c1', { pic: 'bars', split: { by: 'status' }, measure: mv }, theirs);
    ch('c2', { pic: 'cols', split: { by: 'date', unit: 'q', date: 'signed' }, measure: 'rounds', window: { last: 2, unit: 'y', date: 'signed' } }, theirs);
    ch('c3', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, measure: mv, window: next12 }, lv);
    ch('c4', { pic: 'ring', split: { by: 'standards' }, measure: 'count' }, lv);
  }
  if (topic === 'stream'){
    const mine = book.filter(c => c.folder === arg), lv = mine.filter(_hbLive);
    ch('c1', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: mv, window: last12 }, mine);
    ch('c2', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'medianDaysToSign', window: last12 }, mine);
    ch('c3', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, measure: mv, window: next12 }, lv);
    ch('c4', { pic: 'ring', split: { by: 'standards' }, measure: 'count' }, lv);
  }
  if (topic === 'quarter'){
    ch('c1', { pic: 'bars', split: { by: 'folder' }, measure: mv, compare: 'prev', window: { last: 1, unit: 'q', date: 'signed' } }, book);
    ch('c2', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'signed' }, measure: 'medianDaysToSign', window: { last: 6, unit: 'm', date: 'signed' } }, book);
    ch('c3', { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, measure: mv, window: { next: 6, unit: 'm', date: 'end' } }, live);
    ch('c4', { pic: 'ring', split: { by: 'standards' }, measure: 'count' }, live);
  }
  const all = new Map(); S.chapters.forEach(c => (c.ids || []).forEach(x => { const k = hbContract(x); if (k) all.set(x, k); }));
  Object.values(S.lists).forEach(L => L.ids.forEach(x => { const k = hbContract(x); if (k) all.set(x, k); }));
  S.cs = [...all.values()];
  _hbStoryMemo.set(memoKey, S);
  return S;
}
/* a chapter, as an ordinary chart card: its key is a door like any other */
function hbStoryCardD(topic, id, lens){
  const S = hbStoryData(topic, lens); const k = S.chapters.find(x => x.id === id); if (!k || !k.chart) return null;
  const ids = k.ids.filter(x => hbContract(x));
  return { key: 'sy:' + topic + '.' + id, kind: 'list', crumb: S.title + ' › ' + k.title, title: k.title, ids, n: ids.length, chart: k.chart, fixed: [] };
}
/* the picture a deeper chapter names for itself (Young, 6 Oct 2026: "Risk
   exposure arrived suddenly in September" was drawn by counterparty): only
   the board's own recipe words survive, as for any card; a picture the board
   cannot draw is dropped and the step's own chart stands */
function hbStoryPicOf(r){
  if (!r || typeof r !== 'object') return undefined;
  const c = hbCardClean(r); delete c.which; delete c.title;
  return c.pic || c.split ? c : undefined;
}
/* a deeper chapter's card: the step's own calculation, counted again, in the
   chapter's own picture where it named one. A PACK step draws the pack's
   first chart (its other charts are one press away) */
function hbStoryDeepD(topic, k, lens){
  const run = hbDdRun((hbStoryKept(topic) || {}).deeper); const st = run && run.steps[k - 1];
  if (!st) return null;
  const key = 'sy:' + topic + '.d' + k, crumb = hbStoryData(topic, lens).title + ' › ' + st.title;
  if (st.name === 'pack'){
    const name = String(st.dig || '').slice(3); if (!HB_PACKS.includes(name)) return null;
    const first = (hbPackData(name, lens).cards || [])[0]; const D = first && hbPackCardD(name, first.id, lens);
    return D ? Object.assign(D, { key, crumb, title: st.title, pack: name }) : null;
  }
  if (!st.input) return null;
  const W = hbWhichOf(st.input.which || { all: true }, lens); if (W.unread) return null;
  const ch = (run.chapters || []).find(c => c.step === k);
  const clean = (ch && ch.recipe) ? Object.assign({}, ch.recipe) : hbCardClean(st.input.recipe || {}); delete clean.which;
  return { key, kind: 'list', crumb, title: st.title, setLabel: W.label, ids: W.ids, n: W.ids.length, whole: W.whole, fixed: W.fields, chart: clean };
}
/* A CHAPTER'S FRAME (Young, 6 Oct 2026, over a story whose grid of streams
   by stage could not be read and whose chapters could not be opened): a
   chart that needs width (a grid, stacked or grouped, a timeline, more than
   HB_STORY_WIDE_COLS columns) takes the story's whole row, and no chart's
   writing is drawn smaller than the board's own small text — a chart that
   would shrink further scrolls inside its chapter instead */
const HB_STORY_WIDE_COLS = 12, HB_STORY_TEXT_MIN = 12;
function hbStoryWide(D, cs){
  const P = hbPlan(D);
  if (P.split2 || ['heat', 'stack', 'grouped', 'gantt', 'multi', 'waterfall', 'spread'].includes(P.pic)) return true;
  if (P.pic !== 'cols') return false;
  const { R } = hbChartRun(D, cs, P);
  return ((R.cols || []).length + (R.edges || []).length) > HB_STORY_WIDE_COLS;
}
function hbStoryPicHtml(pic){
  /* each drawn SVG keeps its writing at least HB_STORY_TEXT_MIN px: its
     smallest font, scaled to the width it is drawn at, decides the floor */
  return `<div class="hb-sy-pic">${String(pic).replace(/<svg class="hb-svg([^"]*)" viewBox="0 0 ([\d.]+) [\d.]+"([\s\S]*?)<\/svg>/g, (whole, cls, w) => {
    const fs = [...whole.matchAll(/font-size="([\d.]+)"/g)].map(x => Number(x[1])).filter(x => x > 0);
    if (!fs.length) return whole;
    const minW = Math.ceil(Number(w) * HB_STORY_TEXT_MIN / Math.min(...fs));
    return whole.replace('<svg class="hb-svg', `<svg style="min-width:${minW}px" class="hb-svg`);
  })}</div>`;
}
function hbStoryChHead(n, title, key){
  const big = key ? hbBigBtnHtml(false, `data-hb-sy-big="${_hbE(key)}"`) : '';
  return `<div class="hb-sy-cht"><span class="hb-sy-n">${n}</span><h4>${_hbE(title)}</h4>${big}</div>`;
}
function hbStoryDig(topic, sub, lens){
  if (!hbStoryValid(topic)) return null;
  const S = hbStoryData(topic, lens);
  if (!sub) return { key: 'sy:' + topic, kind: 'story', topic, crumb: S.title, title: S.title, n: S.cs.length };
  if (/^k:/.test(sub)){ const L = S.lists[sub.slice(2)]; if (!L) return null; const ids = L.ids.filter(x => hbContract(x));
    return { key: 'sy:' + topic + '.' + sub, kind: 'list', crumb: L.title, title: L.title, ids, n: ids.length, chart: { mode: 'groups', by: 'counterparty' }, fixed: [] }; }
  if (/^d\d+$/.test(sub)) return hbStoryDeepD(topic, Number(sub.slice(1)), lens);
  return hbStoryCardD(topic, sub, lens);
}
/* each chapter's own reading and fact sheet — the words are written from these */
function hbStoryChapterRead(topic, k, lens){
  if (k.chart){
    const D = hbStoryCardD(topic, k.id, lens); if (!D) return null;
    const src = hbReadOfList(D, D.key, k.title, lens); if (!src) return { lines: [], sheet: null, cs: [] };
    return { lines: src.reading.lines, sheet: hbFactSheet(src), cs: src.cs };
  }
  const lines = k.bars && k.bars.length ? [hbReadLine(k.top || 'hb_sy_bars_most', { what: k.bars[0].label, n: { html: hbReadDoor(k.bars[0].n, k.bars[0].dig, _hbN(k.bars[0].n)) } }, k.bars[0].n)] : [];
  const text = [`FACT SHEET — ${k.title}`, ...(k.facts || [])].join('\n');
  return { lines, sheet: { text, nums: hbNumsOf(text) }, cs: [] };
}
function hbStorySheet(topic, lens){
  const S = hbStoryData(topic, lens);
  const parts = S.chapters.map((k, i) => { const r = hbStoryChapterRead(topic, k, lens);
    return `CHAPTER ${i + 1} (C${i + 1}): ${k.title}\n` + (r && r.sheet ? String(r.sheet.text).slice(0, HB_STORY_CH_SHEET) : '(nothing to count)'); });
  const text = [`STORY — ${S.title} (${S.period})`, ...parts].join('\n\n');
  return { text, nums: hbNumsOf(text) };
}
function hbStorySig(topic, lens){ const S = hbStoryData(topic, lens); return hbWhySigOf('story:' + topic, S.cs); }
function hbStoryKept(topic){ const s = hbS(); return (s.sy && s.sy[topic]) || null; }
function hbStoryKeep(topic, rec){
  const s = hbS(); s.sy = s.sy || {};
  delete s.sy[topic]; s.sy[topic] = rec;
  const ks = Object.keys(s.sy); while (ks.length > HB_STORY_KEEP) delete s.sy[ks.shift()];
  hbSave();
}
function hbStoryDeeperSet(topic, runId){ const rec = Object.assign({}, hbStoryKept(topic) || {}, { deeper: runId }); hbStoryKeep(topic, rec); }
/* THE WORDS: one Copilot call, each piece checked against the fact sheets */
function hbStoryPrompt(topic, sheet, n){
  return [sheet.text, '',
    `Write a short story about these ${n} chapters, in ${i18t('hb_cx_lang')}, for a business owner. Answer in exactly this shape, one line each, nothing else:`,
    'LEAD: two or three sentences that tell the whole story — what happened, and what it means.',
    ...Array.from({ length: n }, (_, i) => `C${i + 1}: two or three sentences about chapter ${i + 1}: what its chart shows and why it matters.`),
    'Use ONLY numbers that appear on the fact sheets, written exactly as they appear there; never work out a new number (no new totals, percentages, differences or dates). If a coverage line says some contracts were not read or not checked, say the picture may be incomplete. If a chapter has nothing to count, say so in a few words.', HB_SAY_RULE].join('\n');
}
function hbStoryParse(text, n){
  const out = { lead: '', paras: {} };
  String(text || '').replace(/\r/g, '').split('\n').forEach(line => {
    const m = /^\s*\**\s*(LEAD|C(\d+))\s*\**\s*[:\-–]\s*\**\s*(.+)$/i.exec(line); if (!m) return;
    if (/^lead$/i.test(m[1])) out.lead = m[3].trim();
    else { const i = Number(m[2]); if (i >= 1 && i <= n) out.paras['c' + i] = m[3].trim(); }
  });
  return out;
}
async function hbStoryWrite(topic){
  if (!hbStoryValid(topic) || _hbSyBusy.has(topic)) return null;
  if (!(typeof copilotAvailable === 'function' && copilotAvailable())){ _hbSyErr.set(topic, i18t('hb_sy_nokey')); hbPaintBoard(); return null; }
  const s = hbS(), lens = s.lens, S = hbStoryData(topic, lens);
  _hbSyBusy.add(topic); _hbSyErr.delete(topic); hbPaintBoard();
  try {
    const sheet = hbStorySheet(topic, lens), n = S.chapters.length;
    const res = await copilotAsk([{ role: 'user', content: hbStoryPrompt(topic, sheet, n) }], { view: 'intel' }, null, { quiet: true });
    const P = hbStoryParse(res && res.answer, n);
    let dropped = 0; const chk = t => { const c = hbFactCheck(t, sheet.nums); dropped += c.dropped; return c.text.slice(0, 900); };
    const paras = {}; Object.keys(P.paras).forEach(k => { paras[k] = chk(P.paras[k]); });
    const rec = Object.assign({}, hbStoryKept(topic) || {}, { day: hbToday(), sig: hbStorySig(topic, lens), lead: chk(P.lead), paras, dropped,
      at: new Date().toTimeString().slice(0, 5), notice: res && res.notice ? String(res.notice).slice(0, 300) : '' });
    hbStoryKeep(topic, rec);
    if (!rec.lead && !Object.values(paras).some(Boolean)) _hbSyErr.set(topic, i18t('hb_cx_empty'));
    return rec;
  } catch (e){
    _hbSyErr.set(topic, e && e.needsKey ? i18t('hb_sy_nokey') : e && e.spendLimit ? String(e.message || '').slice(0, 200) : i18t('hb_cx_failed', { why: String((e && e.message) || e || '').slice(0, 160) }));
    return null;
  } finally { _hbSyBusy.delete(topic); hbPaintBoard(); }
}
/* the words still stand only over the numbers they were written for */
function hbStoryWords(topic, lens){
  const rec = hbStoryKept(topic); if (!rec || !rec.sig) return null;
  return Object.assign({}, rec, { stale: rec.sig !== hbStorySig(topic, lens) });
}
/* DIG DEEPER ON THE STORY: the board's one Dig deeper, given the story */
function hbStoryDeeper(topic){
  const S = hbStoryData(topic, hbS().lens);
  return hbDigDeeper(i18t('hb_sy_dd_q', { what: S.title, when: S.period }), { story: topic, sheet: hbStorySheet(topic, hbS().lens).text });
}
function hbStoryStop(topic){ const run = hbDdRun((hbStoryKept(topic) || {}).deeper); if (run && _hbDdBusy.has(run.id)){ run.stopped = true; hbDdKeep(run); hbPaintBoard(); } }
/* the finish, kept on the run: which steps became chapters, what to watch,
   which ideas were set aside — each sentence checked like the summary */
function hbStoryFinish(run, f, nums){
  let dropped = 0; const chk = (t, n) => { const c = hbFactCheck(t, nums); dropped += c.dropped; return c.text.slice(0, n); };
  const stepOk = k => Number.isInteger(k) && k >= 1 && k <= run.steps.length;
  run.chapters = (Array.isArray(f.chapters) ? f.chapters : []).filter(c => c && stepOk(Number(c.step))).slice(0, 6)
    .map(c => ({ step: Number(c.step), title: hbPlainText(c.title, HB_TITLE_MAX) || run.steps[Number(c.step) - 1].title, text: chk(String(c.text || ''), 700), recipe: hbStoryPicOf(c.recipe) }))
    .filter((c, i, a) => a.findIndex(x => x.step === c.step) === i);
  run.watch = (Array.isArray(f.watch) ? f.watch : []).slice(0, 4).map(w => ({ text: chk(String((w && w.text) || ''), 300), step: stepOk(Number(w && w.step)) ? Number(w.step) : null })).filter(w => w.text);
  run.aside = (Array.isArray(f.aside) ? f.aside : []).slice(0, 4).map(a => ({ idea: hbPlainText(a && a.idea, 160), why: chk(String((a && a.why) || ''), 300) })).filter(a => a.idea);
  run.dropped += dropped;
}
/* ---- A COUNTER NEVER PASSES ITS LIMIT (Young, 7 Oct 2026, work order W-4:
   "step 16 of up to 15") ---- the step in progress is done + 1, so once every
   step is used the run is WRITING, and says so; one reading for both counters. */
function hbStepInProgress(run){
  const m = run.max || HB_DD_STEPS, n = run.steps.length + 1;
  return n > m ? null : n;
}
/* the steps, as "How HaTi worked this out" lists them — one builder for the
   analyst's card and the story's */
function hbDdStepsHtml(run, busy){
  const steps = run.steps.map((st, i) => {
    const door = st.dig ? `<button type="button" class="hb-read-n" data-hb-dig="${_hbE(st.dig)}">${_hbE(i18tn('hb_n_contracts', st.n, { n: _hbN(st.n) }))}</button>`
      : st.n ? `<button type="button" class="hb-read-n" data-hb-open="${_hbE(st.ids.join(','))}" data-hb-what="${_hbE(st.title)}">${_hbE(i18tn('hb_n_contracts', st.n, { n: _hbN(st.n) }))}</button>` : _hbE(i18tn('hb_n_contracts', 0, { n: 0 }));
    return `<li class="hb-dd-step"><div class="hb-dd-sh"><span class="hb-dd-i">${i + 1}</span><b>${_hbE(st.title)}</b><span class="hb-grow"></span>${door}</div>
      ${st.why ? `<div class="hb-quiet">${_hbE(i18t('hb_dd_why', { why: st.why }))}</div>` : ''}${st.lines.length ? `<ul>${st.lines.map(l => `<li>${l}</li>`).join('')}</ul>` : ''}</li>`;
  }).join('');
  const now = hbStepInProgress(run);
  const working = busy ? `<li class="hb-dd-step is-busy"><span class="hb-quiet">${_hbE(now ? i18t('hb_dd_working', { n: now }) : i18t('hb_dd_writing'))}</span></li>` : '';
  return `<ol class="hb-dd-steps">${steps}${working}</ol>`;
}
/* THE STORY'S CARD */
function hbStoryChapterHtml(topic, k, i, n, words, lens, extraCls){
  const r = hbStoryChapterRead(topic, k, lens);
  let pic = '', wide = false, D = null;
  if (k.chart){ D = hbStoryCardD(topic, k.id, lens); if (D){ const cs = hbListOf(D.ids, lens); wide = hbStoryWide(D, cs); D.narrow = !wide; pic = hbStoryPicHtml(hbChartHtml(D, cs, false)); } }
  else if (k.bars && k.bars.length) pic = hbChartBarsHtml(k.bars, false);
  else pic = `<p class="hb-quiet">${_hbE(i18t('hb_sy_nothing'))}</p>`;
  const para = words && words.paras && words.paras[k.id];
  /* the chart already says HaTi's reading in its headline; a bar chapter says it here */
  const say = para ? `<p class="hb-sy-p">${hbSay(para)}</p>` : (!k.chart && r && r.lines && r.lines[0] ? `<p class="hb-sy-p is-hati">${r.lines[0]}</p>` : '');
  return `<section class="hb-sy-ch${wide ? ' is-wide' : ''}${extraCls || ''}">${hbStoryChHead(_hbE(i18t('hb_sy_ch_n', { i: i + 1, n })), k.title, D && D.ids.length ? D.key : '')}${pic}${say}</section>`;
}
function hbStoryHtml(D, lens){
  const topic = D.topic, S = hbStoryData(topic, lens), n = S.chapters.length;
  const words = hbStoryWords(topic, lens), busy = _hbSyBusy.has(topic), err = _hbSyErr.get(topic);
  const live = typeof copilotAvailable === 'function' && copilotAvailable();
  const rec = hbStoryKept(topic) || {};
  const run = hbDdRun(rec.deeper), dBusy = !!(run && _hbDdBusy.has(run.id));
  const gifts = hbGiftsFor(), sent = gifts.sent['sy:' + topic];
  /* the acts: Share (give it to a colleague), Dig deeper (its cost beside it) */
  const ddLive = hbDdLive();
  const acts = `<div class="hb-sy-acts"><span class="hb-sy-pill">${_hbE(i18tn('hb_sy_pill', n, { n }))} · ${_hbE(S.period)}</span>
    ${sent ? `<span class="hb-given" title="${_hbE(sent.note || '')}">${_hbE(i18t('hb_given', { who: sent.toName || '', seen: i18t(sent.seenAt ? 'hb_seen' : 'hb_not_seen') }))}<button type="button" data-hb-ungive="${_hbE(sent.id)}" title="${_hbE(i18t('hb_take_back'))}" aria-label="${_hbE(i18t('hb_take_back'))}">${_hbX}</button></span>` : ''}
    <span class="hb-grow"></span>
    <button type="button" class="hb-btn" data-hb-sy-give="${_hbE(topic)}" aria-pressed="${_hbGiveForm === 'sy:' + topic}">${_hbE(i18t('hb_sy_share'))}</button>
    ${dBusy ? `<button type="button" class="hb-btn" data-hb-sy-stop="${_hbE(topic)}">${_hbE(i18t('hb_sy_stop'))}</button>`
      : `<button type="button" class="hb-btn hb-sy-dd" data-hb-sy-deeper="${_hbE(topic)}"${ddLive ? ` title="${_hbE(i18t('hb_sy_dd_cost', { n: HB_STORY_STEPS, m: HB_STORY_STEPS + 1 }))}"` : ` disabled title="${_hbE(i18t('hb_cx_nokey'))}"`}>${_hbStar}${_hbE(i18t('hb_dd_btn'))}</button>
      ${ddLive ? `<span class="hb-dd-cost">${_hbE(i18t('hb_sy_dd_cost', { n: HB_STORY_STEPS, m: HB_STORY_STEPS + 1 }))}</span>` : ''}`}</div>`;
  const give = _hbGiveForm === 'sy:' + topic ? hbGiveFormHtml({ id: 'sy:' + topic }) : '';
  /* the lead: Copilot's words, or why there are none yet */
  let lead = '';
  if (busy) lead = `<p class="hb-sy-lead is-wait" aria-live="polite">${_hbE(i18t('hb_sy_writing'))}</p>`;
  else if (err) lead = `<div class="hb-sy-lead is-err"><p>${_hbE(err)}</p>${live ? `<button type="button" class="hb-link" data-hb-sy-write="${_hbE(topic)}">${_hbE(i18t('hb_sy_write'))}</button>` : ''}</div>`;
  else if (words && words.lead) lead = `<p class="hb-sy-lead">${hbSay(words.lead)}</p>${words.stale ? `<p class="hb-quiet hb-sy-stale">${_hbE(i18t('hb_sy_stale'))} <button type="button" class="hb-link" data-hb-sy-write="${_hbE(topic)}">${_hbE(i18t('hb_sy_write_again'))}</button></p>` : ''}`;
  else lead = `<p class="hb-sy-lead is-wait">${_hbE(i18t(live ? 'hb_sy_unwritten' : 'hb_sy_nokey'))}${live ? ` <button type="button" class="hb-link" data-hb-sy-write="${_hbE(topic)}">${_hbE(i18t('hb_sy_write'))}</button>` : ''}</p>`;
  const shown = words && !words.stale ? words : null;
  const deepN = run && run.chapters ? run.chapters.length : 0;
  const total = n + deepN;
  const chapters = S.chapters.map((k, i) => hbStoryChapterHtml(topic, k, i, total, shown, lens)).join('');
  const foot = `<div class="hb-sy-foot"><span class="${shown && shown.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(shown && shown.dropped ? i18tn('hb_cx_dropped', shown.dropped, { n: shown.dropped }) : i18t('hb_sy_counted'))}</span>
    <span>${_hbE(i18tn('hb_sy_made', S.cs.length, { n: _hbN(S.cs.length), at: (shown && shown.at) || '' }))}</span>${shown && shown.notice ? `<span>${_hbE(shown.notice)}</span>` : ''}</div>`;
  return `<div class="hb-sy" data-hb-sy="${_hbE(topic)}">${acts}${give}${lead}<div class="hb-sy-chs">${chapters}</div>${foot}${run ? hbStoryDeepHtml(topic, run, n, total, lens, dBusy) : ''}</div>`;
}
/* the deeper half: working, then the chapters, the ideas set aside, what to
   watch and how it was worked out */
function hbStoryDeepHtml(topic, run, n, total, lens, busy){
  const how = `<details class="hb-how hb-dd-how"${busy ? ' open' : ''}><summary>${_hbE(i18t('hb_how_title'))} · ${_hbE(i18tn('hb_dd_steps', run.steps.length, { n: run.steps.length }))}</summary>${hbDdStepsHtml(run, busy)}</details>`;
  if (busy) return `<div class="hb-sy-deep is-busy"><div class="hb-sy-dh"><span class="hb-sy-pill is-amber">${_hbE(hbStepInProgress(run) ? i18t('hb_sy_going', { n: hbStepInProgress(run), m: run.max || HB_STORY_STEPS }) : i18t('hb_sy_deep_writing'))}</span></div>${how}</div>`;
  if (run.state === 'err') return `<div class="hb-sy-deep"><div class="hb-why is-err"><div class="hb-why-h">${_hbStar}<span>${_hbE(i18t('hb_dd_btn'))}</span></div><p>${_hbE(run.err)}</p></div>${run.steps.length ? how : ''}</div>`;
  const stopped = run.state === 'stopped' ? `<p class="hb-quiet">${_hbE(i18tn('hb_sy_stopped', run.steps.length, { n: run.steps.length }))}</p>` : '';
  const lead = run.summary ? `<p class="hb-sy-lead">${hbSay(run.summary)}</p>` : (run.state === 'empty' ? `<p class="hb-quiet">${_hbE(i18t('hb_dd_empty'))}</p>` : '');
  const chs = (run.chapters || []).map((c, i) => {
    const D = hbStoryDeepD(topic, c.step, lens), st = run.steps[c.step - 1];
    const cs = D ? hbListOf(D.ids, lens) : [];
    /* never blank: the chart, else the step's own lines, else why not — with
       the step's contracts one press away when it kept them */
    const open = st && st.n && st.ids.length ? ` <button type="button" class="hb-read-n" data-hb-open="${_hbE(st.ids.join(','))}" data-hb-what="${_hbE(st.title)}">${_hbE(i18tn('hb_sy_open_n', st.n, { n: _hbN(st.n) }))}</button>` : '';
    const pack = st && st.dig ? `<button type="button" class="hb-link hb-sy-packdoor" data-hb-dig="${_hbE(st.dig)}">${_hbE(i18t('hb_sy_deep_pack'))}</button>` : '';
    const wide = !!(D && cs.length && hbStoryWide(D, cs));
    if (D) D.narrow = !wide;
    const pic = D && cs.length ? hbStoryPicHtml(hbChartHtml(D, cs, false)) + pack
      : st && st.lines.length ? `<ul class="hb-sy-lines">${st.lines.map(l => `<li>${l}</li>`).join('')}</ul>${pack}`
      : `<p class="hb-quiet hb-sy-none">${_hbE(i18t('hb_sy_deep_none'))}${open}</p>${pack}`;
    return `<section class="hb-sy-ch is-deep${wide ? ' is-wide' : ''}">${hbStoryChHead(`${_hbE(i18t('hb_sy_ch_n', { i: n + i + 1, n: total }))} · ${_hbE(i18t('hb_sy_deeper'))}`, c.title, D && cs.length ? D.key : '')}${pic}${c.text ? `<p class="hb-sy-p">${hbSay(c.text)}</p>` : ''}</section>`;
  }).join('');
  const aside = (run.aside || []).length ? `<section class="hb-sy-aside"><h4>${_hbE(i18t('hb_sy_aside'))}</h4><ul>${run.aside.map(a => `<li><b>${_hbE(a.idea)}</b>${a.why ? ': ' + hbSay(a.why) : ''}</li>`).join('')}</ul></section>` : '';
  const watch = (run.watch || []).length ? `<section class="hb-sy-watch"><h4>${_hbE(i18t('hb_sy_watch'))}</h4><ul>${run.watch.map(w => { const st = w.step ? run.steps[w.step - 1] : null;
    const door = st && st.n ? ` <button type="button" class="hb-read-n" ${st.dig ? `data-hb-dig="${_hbE(st.dig)}"` : `data-hb-open="${_hbE(st.ids.join(','))}" data-hb-what="${_hbE(st.title)}"`}>${_hbE(i18tn('hb_sy_open_n', st.n, { n: _hbN(st.n) }))}</button>` : '';
    return `<li>${hbSay(w.text)}${door}</li>`; }).join('')}</ul></section>` : '';
  const foot = `<div class="hb-sy-foot"><span class="${run.dropped ? 'hb-why-cut' : 'hb-why-ok'}">${_hbE(run.dropped ? i18tn('hb_cx_dropped', run.dropped, { n: run.dropped }) : i18t('hb_sy_counted'))}</span><span>${_hbE(i18t('hb_cx_when', { at: run.at }))}</span>${run.notice ? `<span>${_hbE(run.notice)}</span>` : ''}</div>`;
  return `<div class="hb-sy-deep">${stopped}${lead}${chs ? `<div class="hb-sy-chs">${chs}</div>` : ''}<div class="hb-sy-two">${watch}${aside}</div>${how}${foot}</div>`;
}
/* a story a colleague gave: its name and their note; it opens counted on
   THIS reader's own Home */
function hbStoryGiftHtml(g){
  /* the story's id rides the gift's pid (a one-counterparty story carries its name there) */
  const topic = /^sy:/.test(String(g.pid || '')) ? String(g.pid).slice(3) : String(g.kind || '').slice(3);
  if (!hbStoryValid(topic) || 'sy_' + hbStoryId(topic).topic !== g.kind) return '';
  return `<section class="hb-card hb-panel" data-hb-pid="${_hbE('gift:' + g.id)}"><header class="hb-ch"><span class="hb-ct">${_hbE(i18t('hb_sy_gift_title', { what: hbStoryTitle(topic) }))}</span>
    <span class="hb-given is-from" title="${_hbE(g.note || '')}">${_hbE(i18t('hb_from', { who: g.fromName || '' }))}</span><span class="hb-grow"></span>
    <button type="button" class="hb-ib" data-hb-act="x" title="${_hbE(i18t('hb_sy_gift_away'))}" aria-label="${_hbE(i18t('hb_sy_gift_away'))}">${_hbX}</button></header>
    <div class="hb-cb">${g.note ? `<p class="hb-sy-note">${_hbE(g.note)}</p>` : ''}<p class="hb-quiet">${_hbE(i18t('hb_sy_gift_say'))}</p><button type="button" class="hb-btn" data-hb-dig="sy:${_hbE(topic)}">${_hbE(i18t('hb_sy_open'))}</button></div></section>`;
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
const HB_FOCUS_KEYS = ['data-hb-to-start', 'data-hb-dig', 'data-hb-act', 'data-hb-prep', 'data-hb-crumb', 'data-hb-watch', 'data-hb-lens', 'data-hm-agent', 'data-hb-rc', 'data-hb-rset', 'data-hb-rtrend', 'data-hb-digbig', 'data-hb-rmore'];
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
/* ---- A CHART THAT IS DRAWN STAYS DRAWN (Young, 7 Oct 2026: "the board
   charts flicker when copilot is working ... once chart has been built, it
   should not flicker") ----
   Every step Copilot takes repaints the board, and a repaint used to replace
   the whole board's markup — so every chart was a NEW element and played its
   grow-in animation again, once per step. Now the new markup is laid over the
   old one node by node: a node whose markup is unchanged is KEPT (its
   animation already played), a node whose tag and attributes match but whose
   inside moved is walked into, anything else is replaced. Only what changed
   is new, so only what changed animates. Handlers are delegated on document,
   so a kept node loses nothing. */
function hbMorph(host, html){
  const next = document.createElement(host.tagName === 'TBODY' ? 'tbody' : 'div');
  next.innerHTML = html;
  hbMorphKids(host, next);
}
function hbMorphSameShell(a, b){
  if (a.nodeType !== b.nodeType || a.nodeName !== b.nodeName) return false;
  if (a.nodeType !== 1) return true;
  if (a.attributes.length !== b.attributes.length) return false;
  for (const at of b.attributes) if (a.getAttribute(at.name) !== at.value) return false;
  return true;
}
function hbMorphKids(cur, next){
  const want = [...next.childNodes];
  for (let i = 0; i < want.length; i++){
    const w = want[i], c = cur.childNodes[i];
    if (!c){ cur.appendChild(w); continue; }
    if (c.nodeType === 1 && w.nodeType === 1 && c.outerHTML === w.outerHTML) continue;
    if (c.nodeType === 3 && w.nodeType === 3){ if (c.nodeValue !== w.nodeValue) c.nodeValue = w.nodeValue; continue; }
    /* a host its own painter fills (a contract's view, hbCvPaint) keeps its inside */
    if (w.nodeType === 1 && w.hasAttribute('data-hb-own') && hbMorphSameShell(c, w)) continue;
    /* a form control's live value is the reader's, not the markup's: replace
       rather than walk into one whose shell moved */
    if (hbMorphSameShell(c, w) && w.nodeType === 1 && !/^(INPUT|TEXTAREA|SELECT|CANVAS)$/.test(w.nodeName)){ hbMorphKids(c, w); continue; }
    cur.replaceChild(w, c);
  }
  while (cur.childNodes.length > want.length) cur.removeChild(cur.lastChild);
}
/* SMOOTH CHANGE BETWEEN ANSWERS (G6, 10 Oct 2026): a chart redrawn at the
   same width — a follow-up, a press on its recipe — no longer blanks and
   fades in again. Each piece that is still there (the same picture, the same
   name: "March 2026", "Juno") GLIDES from where it was to where it is now;
   only a piece that is new fades in. Nothing glides for a reader who asked
   their computer for less motion, nor when the card changed width. */
const HB_GLIDE_MS = 450;
function _hbGlideId(el){
  const t = el.querySelector(':scope > title');
  const txt = t ? (t.getAttribute('data-hb-tt') || t.textContent) : (el.getAttribute('data-hb-tt') || el.getAttribute('title') || '');
  const at = txt.lastIndexOf(': '); return at > 0 ? txt.slice(0, at) : txt;
}
function _hbGlideOff(){ try { return !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (_){ return true; } }
function hbGlideTake(host){
  if (!host || _hbGlideOff()) return null;
  const out = { svg: new Map(), bars: new Map() };
  host.querySelectorAll('svg.hb-svg[data-hb-fit]').forEach(svg => {
    if (svg.classList.contains('hb-ring')) return;
    const m = new Map();
    svg.querySelectorAll('[data-hb-part]').forEach(g => { const sh = g.querySelector(':scope > :is(path,rect,circle):not([fill="transparent"])'); if (!sh) return;
      try { const b = sh.getBBox(); if (b.width > 0 || b.height > 0) m.set(_hbGlideId(g), { x: b.x, y: b.y, w: b.width, h: b.height }); } catch (_){} });
    out.svg.set(svg.getAttribute('data-hb-fit'), { w: svg.getAttribute('data-hb-w'), kind: svg.getAttribute('class'), m });
  });
  host.querySelectorAll('.hb-chart-bars').forEach((box, i) => {
    const m = new Map(); box.querySelectorAll('.hb-cbar').forEach(b => { const f = b.querySelector('.hb-cbar-f'), t = b.querySelector('.hb-cbar-t'); if (f && t) m.set(t.textContent, f.style.width); });
    out.bars.set(i, m); });
  return out;
}
function hbGlidePlay(host, was){
  if (!was || !host || typeof Element === 'undefined' || !Element.prototype.animate) return;
  const ease = 'cubic-bezier(.22,.61,.36,1)';
  host.querySelectorAll('svg.hb-svg[data-hb-fit]').forEach(svg => {
    const W0 = was.svg.get(svg.getAttribute('data-hb-fit'));
    if (!W0 || W0.w !== svg.getAttribute('data-hb-w') || W0.kind.replace(/ hb-(?:calm|dim)\b/g, '') !== String(svg.getAttribute('class')).replace(/ hb-(?:calm|dim)\b/g, '')) return;
    svg.querySelectorAll('[data-hb-part]').forEach(g => {
      const o = W0.m.get(_hbGlideId(g)); if (!o) return;
      const sh = g.querySelector(':scope > :is(path,rect,circle):not([fill="transparent"])'); if (!sh) return;
      let n; try { n = sh.getBBox(); } catch (_){ return; }
      if (!(n.width > 0.5 && n.height > 0.5)) return;
      if (Math.abs(n.x - o.x) < 0.5 && Math.abs(n.y - o.y) < 0.5 && Math.abs(n.width - o.w) < 0.5 && Math.abs(n.height - o.h) < 0.5){ g.style.animation = 'none'; return; }
      g.style.animation = 'none';
      sh.style.transformBox = 'view-box'; sh.style.transformOrigin = '0 0';
      const sx = Math.max(0, o.w) / n.width, sy = Math.max(0, o.h) / n.height;
      const from = `translate(${(o.x - n.x * sx).toFixed(2)}px,${(o.y - n.y * sy).toFixed(2)}px) scale(${sx.toFixed(4)},${sy.toFixed(4)})`;
      try { sh.animate([{ transform: from }, { transform: 'none' }], { duration: HB_GLIDE_MS, easing: ease }); } catch (_){}
    });
  });
  host.querySelectorAll('.hb-chart-bars').forEach((box, i) => {
    const m = was.bars.get(i); if (!m) return;
    box.querySelectorAll('.hb-cbar').forEach(b => { const f = b.querySelector('.hb-cbar-f'), t = b.querySelector('.hb-cbar-t'); if (!f || !t) return;
      const w0 = m.get(t.textContent); if (w0 == null || w0 === f.style.width) { if (w0 != null) f.style.animation = 'none'; return; }
      f.style.animation = 'none';
      try { f.animate([{ width: w0 }, { width: f.style.width }], { duration: HB_GLIDE_MS, easing: ease }); } catch (_){} });
  });
}
/* ---- THE BOARD KEEPS YOUR PLACE (owner, 10 Oct 2026: "when you click to
   get a new chart or any new changes on the board, the board pushes you to
   the top. I need for the new charts or changes to be on screen not pushed
   out and have scroll and find it") ----
   A repaint no longer jumps to the board's top or to the open card's top.
   It holds the card the reader pressed exactly where it was on the screen
   (hbAnchorOf, the press remembered for HB_ANCHOR_MS), then brings the card
   that changed or arrived into view by the LEAST scroll that shows it
   (hbShowCard) and lights it softly (.is-lit; a new card wears .is-new). */
const HB_ANCHOR_MS = 4000;
let _hbPress = null;
const _hbPidSel = id => `[data-hb-pid="${(window.CSS && CSS.escape) ? CSS.escape(String(id)) : String(id)}"]`;
function hbCardOf(el){ return el && el.closest ? el.closest('#hb-focus, [data-hb-pid]') : null; }
function hbCardSel(card){ return !card ? '' : card.id === 'hb-focus' ? '#hb-focus' : _hbPidSel(card.getAttribute('data-hb-pid')); }
if (typeof document !== 'undefined' && !document._hbPressWatch){
  document._hbPressWatch = true;
  document.addEventListener('pointerdown', e => {
    const host = hbHost(); if (!host || !host.contains(e.target)) return;
    const card = hbCardOf(e.target); _hbPress = card ? { sel: hbCardSel(card), at: Date.now() } : null;
  }, true);
}
function hbAnchorOf(host){
  const fresh = _hbPress && Date.now() - _hbPress.at < HB_ANCHOR_MS ? _hbPress.sel : '';
  const act = document.activeElement;
  const sel = fresh || ((act && host.contains(act)) ? hbCardSel(hbCardOf(act)) : '');
  const el = sel && host.querySelector(sel);
  return el ? { sel, y: el.getBoundingClientRect().top - host.getBoundingClientRect().top } : null;
}
function hbShowCard(host, el, opts){
  if (!host || !el) return;
  const o = opts || {}, pad = 12, H = host.clientHeight;
  const hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  const t = r.top - hr.top, b = r.bottom - hr.top;
  const seen = b > pad && t < H - pad;
  let d = 0;
  if (!(o.ifHidden && seen)){
    if (t < pad) d = t - pad;
    else if (b > H - pad) d = Math.min(b - (H - pad), t - pad);
  }
  if (d) host.scrollTop += d;
  const card = el.classList.contains('hb-card') ? el : el.querySelector('.hb-card');
  if (o.lit && card && !card.classList.contains('is-new')){
    card.classList.remove('is-lit'); void card.offsetWidth; card.classList.add('is-lit');
    clearTimeout(card._hbLitT); card._hbLitT = setTimeout(() => card.classList.remove('is-lit'), 1800);
  }
}
function hbPaintBoard(opts){
  const host = hbHost(); if (!host) return;
  /* a hidden Board is not drawn: it is marked missed and drawn when turned to
     (hbSetFace → hbBoardStale; the glitch audit, 24 Oct 2026) */
  if (hbS().face !== 'board' && !(opts && opts.force)){ _hbBoardMissed = true; return; }
  hbGiftsKeep();
  _hbTipMemo.clear(); if (_hbTipFor) hbTipHide(true);
  _hbBoardPaintedAt = Date.now(); _hbBoardMissed = false;
  const top = host.scrollTop;
  const anchor = hbAnchorOf(host);
  const act = document.activeElement;
  const had = (act && host.contains(act)) ? hbFocusKey(act) : null;
  const glide = hbGlideTake(host);
  hbMorph(host, hbBoardHtml());
  hbGlidePlay(host, glide);
  /* a contract's view (stage 4): its host is filled by its own painter */
  host.classList.toggle('is-cview', !!host.querySelector(':scope > #hb-cv-body'));
  hbCvPaint();
  hbSheetPaint();
  /* the contracts' strips (step 8): Where we are, History and Details are filled by their own painters */
  if (typeof window.bsPaintHosts === 'function') try { window.bsPaintHosts(); } catch (_){}
  hbGiftsSeenSay();
  hbPaintHead();
  hbNyDockFollow();
  hbAgLevelsWanted();
  /* an expanded chart takes the room: the dock FOLDS to its door (it is not
     hidden — the door is the way to Copilot), and opens again when the card
     is made small (igDockStepAside) */
  const pg = hbPage();
  if (pg){ const big = !!document.querySelector('#hb-focus .hb-dig.is-big');
    if (pg.classList.contains('hb-dig-big') !== big){ pg.classList.toggle('hb-dig-big', big); if (typeof igDockStepAside === 'function') igDockStepAside(big); if (typeof igFitSplit === 'function') setTimeout(() => { try { igFitSplit(); } catch (_){} }, 60);
      /* MADE BIGGER, IT IS BROUGHT INTO VIEW (the Board walk-through, 15 Oct
         2026: on an iPad the larger chart opened below the screen's bottom) */
      if (big) setTimeout(() => { try { hbShowCard(host, document.querySelector('#hb-focus .hb-dig.is-big')); } catch (_){} }, 360); } }
  if (had){
    const dig = (opts && opts.jump === 'focus') ? document.querySelector('#hb-focus [data-hb-crumb]') : null;
    const back = dig || hbFocusFind(host, had);
    if (back && back.focus) try { back.focus({ preventScroll: true }); } catch (_){}
  }
  const jump = opts && opts.jump;
  /* the reader's place first: the pressed card stays where it was */
  host.scrollTop = top;
  const held = anchor && host.querySelector(anchor.sel);
  if (held){ const y = held.getBoundingClientRect().top - host.getBoundingClientRect().top; if (Math.abs(y - anchor.y) > 0.5) host.scrollTop += y - anchor.y; }
  /* then the card that changed or arrived is brought on screen, by the least
     scroll; one the reader is working in is left where it is */
  let target = null;
  if (jump === 'focus') target = document.getElementById('hb-focus');
  else if (jump === 'top') target = ((opts && opts.pids) || []).map(id => host.querySelector(_hbPidSel(id))).find(Boolean)
    || host.querySelector('.hb-card.is-new') || null;
  if (target) hbShowCard(host, target, { lit: true, ifHidden: !!(held && (held === target || target.contains(held))) });
  _hbFocusNew = false; _hbNewPanel = null;
  hbPaintHead();
  hbRcMenuPlace(host);
  hbFitMeasure();
  hbFitWatch(host);
}
/* THE BOARD'S OWN WIDTH (owner, 11 Oct 2026: a chart's words grew huge): the
   board narrows and widens without the window moving — the Copilot panel
   opens or folds, the menu hides — so a chart drawn for one width was
   stretched like a photo. One observer per board host re-measures, settled. */
let _hbFitObs = null, _hbFitObsHost = null, _hbFitObsT = null;
function hbFitWatch(host){
  if (typeof ResizeObserver === 'undefined' || !host || _hbFitObsHost === host) return;
  if (_hbFitObs) _hbFitObs.disconnect();
  _hbFitObsHost = host;
  let last = host.clientWidth;
  _hbFitObs = new ResizeObserver(() => { const w = host.clientWidth; if (Math.abs(w - last) < 4) return; last = w;
    clearTimeout(_hbFitObsT); _hbFitObsT = setTimeout(() => { try { if (window.state && state.view === 'dashboard') hbFitMeasure(); } catch (_){} }, 120); });
  _hbFitObs.observe(host);
}
/* AN OPEN DROPDOWN IS ON THE SCREEN (7 Oct 2026, owner: "fix the 2 older
   failures"): a card low on the board opened its Picture list below the
   board's own bottom edge, out of sight. Like any dropdown it opens UPWARD
   when there is more room above, and its height never passes the room it
   has; the board is not scrolled under the reader. */
/* A MENU OPENS WHERE THERE IS ROOM, THE BOARD STAYS PUT (owner's "keeps
   your place", 10 Oct 2026): How this is drawn and ⋯ open upward when the
   room below the button is short, and are never scrolled into view — round
   2's scroll moved the card the reader was working on */
function hbRcMenuPlace(host){
  if (!host) return;
  host.querySelectorAll('.hb-rmenu, .hb-dp, .hb-tools-menu').forEach(m => hbMenuPlaceOne(host, m));
}
function hbMenuPlaceOne(host, m){
  m.classList.remove('is-up'); m.style.maxHeight = '';
  const box = host.getBoundingClientRect(), w = m.parentElement.getBoundingClientRect();
  const bottom = Math.min(box.bottom, window.innerHeight), top = Math.max(box.top, 0);
  const below = bottom - w.bottom - 8, above = w.top - top - 8;
  const want = m.scrollHeight;
  if (want > below && above > below) m.classList.add('is-up');
  const room = m.classList.contains('is-up') ? above : below;
  if (room > 0 && want > room) m.style.maxHeight = Math.max(120, Math.floor(room)) + 'px';
}
/* The head's parts that follow the board — the lens chip and the faces —
   repainted in place, so the head row is never rebuilt under the reader. */
function hbPaintHead(){
  const s = hbS();
  const hello = document.querySelector('#hb-head .hb-hello'); if (hello){ const h = hbHelloInner(); if (hello.innerHTML !== h) hello.innerHTML = h; }
  document.querySelectorAll('[data-hb-face]').forEach(b => b.setAttribute('aria-selected', String(b.getAttribute('data-hb-face') === s.face)));
  /* the pill slides: the track carries the chosen face's place */
  const track = document.querySelector('#hb-head .hb-faces'); if (track) track.style.setProperty('--hb-fi', String(Math.max(0, HB_FACES.indexOf(s.face))));
  const gb = document.getElementById('hb-groupby'); if (gb) gb.hidden = s.face !== 'explorer';
  /* a contract's page on the desk (round 7) is not the Board: its screen and Present are the Board's */
  const card = s.face === 'board' && typeof window.bsCardId === 'function' && !!window.bsCardId();
  const pres = document.getElementById('hb-present'); if (pres) pres.hidden = card;
  const pg0 = hbPage(); if (pg0) pg0.classList.toggle('hb-on-card', card);
  const chip = document.querySelector('.hb-counting');
  if (chip){ const h = hbCountChipHtml(); if (chip.innerHTML !== h) chip.innerHTML = h; }
  /* the face turned: it is the tab in front now (Round 2) */
  if (typeof window.deskTabsSync === 'function') window.deskTabsSync();
}
/* EXPLORER IS ALWAYS DARK (Young, 6 Oct 2026: "no option to make it
   light"), and since dark mode left HaTi (owner, 20 Oct 2026: "Only dark
   theme will be on the explorer and brain as designed today") it is the ONLY
   dark face: the Board, the Workspace and the Calendar are light, and the
   Board's own Light | Dark switch is gone. A screen a reader pressed before
   is not read. */
function hbScreenNow(){
  const s = hbS();
  return s.face === 'explorer' ? 'dark' : 'light';
}
function hbApplyScreen(){
  const pg = hbPage(); if (!pg) return;
  pg.classList.toggle('hb-light', hbScreenNow() === 'light');
  pg.classList.toggle('hb-dark', hbScreenNow() !== 'light');
}
function hbApplyFace(){
  const s = hbS(), host = hbHost(); if (!host) return;
  hbApplyScreen();
  host.hidden = s.face !== 'board';
  const pg = hbPage(); if (pg) pg.setAttribute('data-hb-side', s.face);
  /* the Calendar tab draws the calendar into its own cover over the stage */
  const cal = document.getElementById('hb-cal');
  if (cal){ cal.hidden = s.face !== 'calendar';
    if (s.face === 'calendar' && typeof window.renderCalendar === 'function') try { renderCalendar(); } catch (_){}
    else if (s.face !== 'calendar') cal.innerHTML = ''; }
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
    if (s.face === 'board') hbPaintBoard(); else { _hbBoardMissed = true; hbPaintHead();
      /* the Contracts place follows the book it lists (step 7): drawn again
         only when that book moved, so a quiet beat keeps the reader's scroll */
      if (s.face === 'paper' && typeof window.regHomeStale === 'function' && regHomeStale() && typeof window.igPlacePaint === 'function') try { igPlacePaint(); } catch (_){}
      /* the book moved under the Calendar tab: the calendar reads it again */
      if (s.face === 'calendar' && typeof window.renderCalendar === 'function') try { renderCalendar(); } catch (_){} }
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
  /* the paper has its own side now (7 Oct 2026) */
  const s = hbS(); s.face = 'paper'; hbSave();
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
/* EVERY DOOR THAT STILL NAMES THE CALENDAR (an old link, the bell, a
   refresh, the obligations card's "Open calendar") lands on Home's Calendar
   tab — its one way in since the menu row went (owner, 11 Oct 2026) */
function hbOpenCalendar(){
  const s = hbS(); s.face = 'calendar'; hbSave();
  if (typeof setView === 'function') setView('dashboard'); else hbMount();
}
/* EVERY DOOR THAT STILL NAMES THE CONTRACTS PAGE (the rail's Contracts, a
   number pressed elsewhere through regShowOnly / regGoFiltered, Jambo's
   "contracts", a Delete, a refresh) lands on Home's Document face with no
   paper chosen — the Contracts place (the overnight work order, step 7;
   owner's "Go", 14 Oct 2026). Whatever paper was up is put down first
   (igPickAgain, the strip's own "‹ Contracts"), so the place is what shows. */
function hbOpenContracts(){
  const s = hbS();
  if (window.state && state.view === 'dashboard' && hbPage()){
    if (s.face !== 'paper') hbSetFace('paper');
    if (typeof igPickAgain === 'function') igPickAgain();
    return;
  }
  /* putting the paper down is a choice too: a read still out puts nothing up (igOpenNewer) */
  if (typeof window.igOpenNewer === 'function') igOpenNewer();
  if (window.intel){ intel.paper = null; intel.walk = null; }
  s.face = 'paper'; hbSave();
  if (typeof setView === 'function') setView('dashboard'); else hbMount();
}
/* THE RAIL'S HOME DOOR (step 7, the drawing: rail Home → the Board). Home
   opens as it was left, except on the Contracts place — Home's Document face
   with no paper chosen is the Contracts door's now, so from there (or with
   it remembered) Home is the Board, and the rail lights Home again. */
function hbOpenHome(){
  const s = hbS();
  if (s.face === 'paper' && !(window.intel && intel.paper)){
    /* the rail's Home press has always painted the Board afresh: marked
       missed, the face turns in place and paints it */
    if (window.state && state.view === 'dashboard' && hbPage()){ _hbBoardMissed = true; hbSetFace('board'); return; }
    s.face = 'board'; hbSave();
  }
  if (typeof setView === 'function') setView('dashboard'); else hbMount();
}
function hbAfterMount(){
  const pg = hbPage(); if (pg) pg.setAttribute('data-hb-lang', (typeof langId === 'function') ? langId() : '');
  hbApplyScreen(); hbApplyFace();
  /* THE BOARD IS DRAWN WHEN IT SHOWS (the glitch audit, 24 Oct 2026: Home set up
     for a contract's paper or the Contracts place built the hidden Board first,
     about 150–300 ms at 400 contracts). Hidden, it is marked missed and drawn
     when turned to (hbSetFace → hbBoardStale), as hbRender already does. */
  if (hbS().face === 'board' && !_hbArriving) hbPaintBoard(); else _hbBoardMissed = true;
  hbToolsPaint();
  hbGiftsLoad();
  /* on the Contracts place the rail lights Contracts, as the drawing does */
  if (typeof setActiveNav === 'function') setActiveNav((typeof window.regPlaceUp === 'function' && regPlaceUp()) ? 'register' : 'dashboard');
}
function hbSetFace(f){
  /* one press, one panel (igDockBatch, js/views/intelligence.js) */
  if (typeof window !== 'undefined' && typeof window.igDockBatch === 'function' && !hbSetFace._in){
    hbSetFace._in = true; try { return window.igDockBatch(() => hbSetFace(f)); } finally { hbSetFace._in = false; } }
  if (!HB_FACES.includes(f)) return;
  const s = hbS();
  /* the Board pressed while a contract stands on it is the Board (the glitch audit, 24 Oct 2026) */
  if (f === 'board') hbSheetLetGo();
  if (s.face === f){
    if (f === 'board' && s.card && typeof window.bsCardLeave === 'function' && window.bsCardLeave()){
      hbPaintBoard(); if (typeof window.deskTabsSync === 'function') try { window.deskTabsSync(); } catch (_){} }
    return; }
  const kb = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-hb-face') != null;
  s.face = f;
  /* TURNING TO THE BOARD IS THE BOARD (round 7): a contract's page shown on
     the Board's side is let go; hbStripBring sets it again after the turn */
  if (f === 'board') s.card = null;
  hbSave();
  /* the Notes door and the panel's Notes tab follow the face: the Board has no
     contract in front (paintChatDoor, js/app.js) */
  try { if (window.paintChatDoor) window.paintChatDoor(); } catch (_){}
  /* a presentation carries on across the turn; the pen's marks were drawn
     over the other side, so they go */
  if (_hbPresenting){ _hbStroke = null; hbInkClear(); }
  /* turning to the map is an ARRIVAL, like pressing its tab on Insights was:
     the legend comes in closed (renderIntel's own rule for an arrival) */
  if (f === 'explorer' && window.intel){ intel.legendFolded = true; hbLensOnMap(); }
  /* ---- THE FACE TURNS IN PLACE (work order "Home speed", Part 2, 8 Oct
     2026; measured at 430 contracts, every press rebuilt the whole page and
     the Copilot panel twice) ----
     Where the page is up, in this language, only what differs is painted:
     the stage shows the other side (hbApplyFace), the head's face buttons
     repaint where they stand, the board only when something it shows moved
     while it was hidden (hbBoardStale), and Explorer's side — the map, the
     paper and the panel, ONCE — through igTurnFace. */
  const pg = hbPage(), lang = (typeof langId === 'function') ? langId() : '';
  if (pg && hbHost() && document.getElementById('ig-svg') && pg.getAttribute('data-hb-lang') === lang && typeof window.igTurnFace === 'function'){
    hbApplyFace();
    if (f === 'board' && hbBoardStale() && !_hbArriving) hbPaintBoard();
    hbPaintHead();
    igTurnFace();
    hbToolsPaint();
    return;
  }
  hbMount();
  /* the ask box says what it asks about: the paper's contract on Paper, the
     portfolio elsewhere — read after the side has set the paper's mode */
  if (typeof window.renderIntelDock === 'function' && document.getElementById('igd-input')) try { renderIntelDock(); } catch (_){}
  /* the whole page is drawn again: the pressed half keeps the keyboard */
  if (kb){ const b = document.querySelector(`[data-hb-face="${f}"]`); if (b) try { b.focus({ preventScroll: true }); } catch (_){} }
}
/* WHETHER THE HIDDEN BOARD MISSED A PAINT: a book change repaints the board
   only while it shows (hbRender), so one landing on another side marks it;
   and its clock line is counted again after a minute. */
let _hbBoardPaintedAt = 0, _hbBoardMissed = true;
/* A DOOR ON ITS WAY TO ANOTHER SIDE (a contract's paper): Home is set up for
   it without drawing the Board it is about to leave (the glitch audit, 24 Oct 2026) */
let _hbArriving = null;
function hbArrive(f, fn){ const was = _hbArriving; _hbArriving = f; try { return fn(); } finally { _hbArriving = was; } }
const HB_BOARD_FRESH_MS = 60000;
function hbBoardStale(){ return _hbBoardMissed || Date.now() - _hbBoardPaintedAt > HB_BOARD_FRESH_MS; }
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
  /* ---- A CONTRACT LANDS AS ITS STRIP (the overnight work order, step 8;
     owner's "Go", 14 Oct 2026) ---- "Bring up MK-…", its chip, ⌘K and a
     contract row pressed on the Board all ask for 'c:<id>'; the old card
     (hbCardHtml) is redrawn as the Lifeline strip below Today's insights
     (js/views/boardstrip.js). The side list's sheet keeps its own card. */
  if (/^c:/.test(String(key || '')) && typeof window.hbStripBring === 'function' && window.hbStripBring(String(key).slice(2))) return;
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
const HB_INS_MAX = 4, HB_INS_REST_DAYS = 30;
const HB_INS_NORM_PTS = 6, HB_INS_NORM_MONTHS = 12, HB_INS_RECENT_MONTHS = 3, HB_INS_MARGIN = 0.05;
const HB_INS_REN_MIN = 4, HB_INS_REN_PTS = 6, HB_INS_REN_LIFT = 1.5;
const HB_INS_MINE_MIN = 10, HB_INS_MINE_ALL = 0.9;
const HB_INS = {
  pay:    { q: 'average payment days of signed contracts by month signed with a trend', qm: 'average payment days of my signed contracts by month signed with a trend', m: 'payDays' },
  sign:   { q: 'average days to sign by month signed with a trend', qm: 'average days to sign my contracts by month signed with a trend', m: 'daysToSign', look: 'line' },
  rounds: { q: 'average rounds by month signed with a trend', qm: 'average rounds of my contracts by month signed with a trend', m: 'rounds' },
  ren:    { q: 'contracts ending by quarter', qm: 'my contracts ending by quarter' },
  /* bars, each party's name and value, the first five and the rest said in one row (round 17 as drawn; the blocks before it, `was`, are seeded again) */
  cp:     { q: 'value by counterparty', recipe: { pic: 'bars', measure: 'value', split: { by: 'counterparty' }, top: 5 }, was: { pic: 'blocks', measure: 'value', split: { by: 'counterparty' } } },
};
const HB_INS_SHAPES = Object.keys(HB_INS);
/* the shapes that have a normal to be measured against */
const HB_INS_MEASURED = ['pay', 'sign', 'rounds', 'ren'];
/* the rule the day's pictures were chosen by: raised when the choosing
   changes, so a choice saved under the old rule is made again at once */
const HB_INS_V = 4;
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
  /* a picture seeded under the old drawing, never changed by the reader, is seeded again */
  const was = HB_INS[k].was;
  if (was && s.recipe[key] && JSON.stringify(s.recipe[key]) === JSON.stringify(hbCardClean(was))) delete s.recipe[key];
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
  return { shape: k, mine: !!mine, id: hbInsId(k, mine), C, N, lit: N.last.b, score: Math.min(1, N.off * 2),
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
  const view = (C, say, title, lit) => ({ shape: k, id: hbInsId(k, false), C, plain: true, tone: '', title: title || i18t('hb_ins_view_' + k), say, lit: lit || null });
  /* EACH CARD SAYS WHAT IT SHOWS AS A HEADLINE (round 17 as drawn: "Payment
     days are getting longer", "4 contracts end this quarter", "Signing got
     faster") and one sentence read off the same columns the picture draws
     (hbInsPicCols) — the month it lights against the first month shown */
  if (k === 'pay' || k === 'sign' || k === 'rounds'){
    const C = hbInsChart(hbInsKey(k)); const T = C && C.R && C.R.trend; if (!T) return null;
    const S = hbInsPicCols(C.R, null), m = HB_INS[k].m;
    const lit = S && S.shown[S.lit], first = S && S.shown.find((c, i) => i < S.lit && c.k && c.y != null);
    if (!lit || !first) return view(C, i18t('hb_ins_s_trend', { from: hbMeasureFmt(m, T.y0), to: hbMeasureFmt(m, T.y1), n: _hbN(T.span), units: i18tn('hb_tr_units_' + T.unit, T.span, { n: T.span }) }));
    const pct = (lit.y - first.y) / Math.max(Math.abs(first.y), 1e-9), dir = Math.abs(pct) < 0.05 ? 'flat' : pct > 0 ? 'up' : 'down';
    const bare = v => m === 'rounds' ? hbMeasureFmt(m, v) : _hbN(Math.round(v));
    let month = first.b; try { month = new Date(first.b + '-01T00:00:00').toLocaleDateString(langLocale(), { month: 'long' }); } catch (_){ month = first.b; }
    return view(C, i18t('hb_ins_s_' + k + '_' + dir, { v: hbMeasureFmt(m, lit.y), w: bare(first.y), m: month }), i18t('hb_ins_h_' + k + '_' + dir), lit.b);
  }
  if (k === 'ren'){
    const C = hbInsChart(hbInsKey(k)); if (!C) return null;
    const S = hbInsPicCols(C.R, null), lit = S && S.shown[S.lit];
    if (!lit || !lit.k) return null;
    const ids = (C.cs || []).filter(c => hbBucketOf(hbDateOf(c, 'end'), 'q') === lit.b).map(c => c.id);
    const n = lit.k, decided = hbEndingDecided(ids), now = lit.b === C.R.nowB;
    const title = i18tn(now ? 'hb_ins_h_ren_now' : 'hb_ins_h_ren_q', n, { n: _hbN(n), q: hbBucketLabel(lit.b, 'q', false) });
    const open = decided == null ? null : n - decided;
    const say = open == null ? ''
      : n === 1 ? i18t(open ? 'hb_ins_s_ren_one_open' : 'hb_ins_s_ren_one_done')
      : open === n ? i18t('hb_ins_s_ren_none', { n: hbNumWord(n) })
      : open ? i18tn('hb_ins_s_ren_open', open, { u: hbNumWord(open, true), n: hbNumWord(n) })
      : i18t('hb_ins_s_ren_done', { n: hbNumWord(n) });
    return view(C, say, title, lit.b);
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
let _hbInsMemo = new Map(), _hbInsMemoSig = '';
function hbInsMemoSig(){
  const s = hbS(), cs = (window.state && state.contracts) || [];
  let h = 5381;
  for (const c of cs){ const t = String((c && c.id) || '') + ':' + String((c && (c.version || c.updatedAt || c.updated_at)) || '') + ':' + String((c && c.status) || '');
    for (let i = 0; i < t.length; i++) h = ((h * 33) ^ t.charCodeAt(i)) >>> 0; }
  let r = ''; try { r = JSON.stringify([s.recipe || {}, s.lens || '', s.insKept || {}, s.insRest || null]); } catch (_){ r = String(Math.random()); }
  return [hbToday(), hbInsBookSig(), h.toString(36), r].join('|');
}
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
  /* a chart drawn in HTML (the counterparty bars) is made of buttons: inside
     the picture's own button they become plain spans — a button in a button
     is closed by the browser and the card falls apart */
  return String((R && R.body) || '').replace(/\sdata-hb-dig="[^"]*"/g, '').replace(/\stabindex="[^"]*"/g, '').replace(/\srole="button"/g, '')
    .replace(/<title>[^<]*<\/title>/g, '')
    .replace(/<button\b[^>]*?class="([^"]*)"[^>]*>/g, '<span class="$1">').replace(/<button\b[^>]*>/g, '<span>').replace(/<\/button>/g, '</span>');
}
/* ---- EACH PICTURE AS DRAWN (round 17, "Then and now"; the owner's "build
   all the gaps", 18 Oct 2026) ----
   A card's picture is drawn for the card, from the chart's own columns
   (R.cols, the numbers its open chart counts, so a card can never say what
   its chart would not): the last six finished months (or this quarter and
   the four after it), pale, with the one the card is about lit and its value
   printed above it, the months or quarters named under the axis. Days to
   sign is a line, its two ends marked and said. Value by counterparty is the
   chart's first five bars, each with its party and value only, the first in
   the accent. No normal band, no Today marker, no rank chip: the headline
   and the one sentence say what the picture is about. */
const HB_INS_PIC_M = 6, HB_INS_PIC_Q = 5, HB_INS_PIC_BARS = 5;
function hbInsPicCols(R, litB){
  const cols = (R && Array.isArray(R.cols) ? R.cols : []).filter(c => !c.edge);
  if (!cols.length || !R.nowB) return null;
  /* every bucket in the span is drawn, an empty one as nothing (the chart
     draws only from its first dated bucket to its last) */
  const by = new Map(cols.map(c => [c.b, c]));
  const at = b => by.get(b) || { b, y: 0, n: 0, k: 0, empty: true };
  if (R.unit === 'q'){
    const shown = []; let b = R.nowB;
    for (let i = 0; i < HB_INS_PIC_Q; i++){ shown.push(at(b)); b = hbBucketNext(b, 'q'); }
    if (!shown.some(c => c.k)) return null;
    let lit = litB ? shown.findIndex(c => c.b === litB) : -1;
    if (lit < 0) lit = shown[0].k ? 0 : shown.slice(0, 4).reduce((a, c, i) => ((c.k || 0) > (shown[a].k || 0) ? i : a), 0);
    return { shown, lit };
  }
  let end = litB && by.has(litB) ? litB : null;
  if (!end){ const done = cols.filter(c => !c.sofar && c.k && c.y != null); end = done.length ? done[done.length - 1].b : null; }
  if (!end) return null;
  const shown = []; for (let i = HB_INS_PIC_M - 1; i >= 0; i--) shown.push(at(hbBucketMove(end, 'm', -i)));
  return { shown, lit: shown.length - 1 };
}
/* a small number in words where a sentence reads it ("Two of the four") */
function hbNumWord(n, cap){
  const w = String(i18t('hb_num_words') || '').split(/\s+/)[n];
  const out = (n >= 0 && n <= 10 && w) ? w : _hbN(n);
  return cap ? out.charAt(0).toUpperCase() + out.slice(1) : out;
}
function hbInsPicHtml(x){
  const R = x && x.C && x.C.R; if (!R) return '';
  if (Array.isArray(R.rows) && !Array.isArray(R.cols)){
    const rows = R.rows.filter(r => !r.rest).slice(0, HB_INS_PIC_BARS); if (!rows.length) return hbInsThumb(R);
    const max = Math.max(...rows.map(r => r.v || 0), 0) || 1;
    const val = v => _hbM(v).replace(/^[A-Z]{3}\s+/, '');
    return `<span class="hb-ip-bars">${rows.map((r, i) => `<span class="hb-ip-br"><span class="hb-ip-bn">${_hbE(r.label)}</span><span class="hb-ip-bt"><i class="${i ? '' : 'is-lit'}" style="width:${Math.max(1, Math.round((r.v || 0) / max * 100))}%"></i></span><span class="hb-ip-bv">${_hbE(val(r.v))}</span></span>`).join('')}</span>`;
  }
  const S = hbInsPicCols(R, x.lit); if (!S || !S.shown.length) return hbInsThumb(R);
  const m = R.m, q = R.unit === 'q', line = !!(HB_INS[x.shape] && HB_INS[x.shape].look === 'line');
  const W = 460, H = 150, L = 10, Rt = 10, Tp = 26, B = 24, base = H - B, n = S.shown.length, step = (W - L - Rt) / n;
  const fmt = y => (m === 'count' || m === 'live') ? _hbN(Math.round(y || 0)) : hbMeasureFmt(m, y);
  const max = Math.max(...S.shown.map(c => c.y || 0), 0) || 1;
  const X = i => L + step * (i + 0.5), Y = v => Tp + (base - Tp) * (1 - Math.max(0, v || 0) / max);
  const xl = c => q ? c.b.slice(5) + ' ' + c.b.slice(2, 4) : hbBucketLabel(c.b, 'm', true);
  let g = `<line x1="${L}" x2="${W - Rt}" y1="${base}" y2="${base}" class="hb-ip-axis"/>`;
  S.shown.forEach((c, i) => { g += `<text x="${X(i).toFixed(1)}" y="${base + 17}" text-anchor="middle" class="hb-ip-x">${_hbE(xl(c))}</text>`; });
  if (line){
    const pts = S.shown.map((c, i) => ({ c, i })).filter(o => o.c.k && o.c.y != null);
    if (pts.length){
      g += `<polyline points="${pts.map(o => X(o.i).toFixed(1) + ',' + Y(o.c.y).toFixed(1)).join(' ')}" class="hb-ip-line"/>`;
      [pts[0], pts[pts.length - 1]].filter((o, j, a) => j === 0 || o !== a[0]).forEach(o => {
        g += `<circle cx="${X(o.i).toFixed(1)}" cy="${Y(o.c.y).toFixed(1)}" r="4.5" class="hb-ip-dot"/><text x="${X(o.i).toFixed(1)}" y="${(Y(o.c.y) - 10).toFixed(1)}" text-anchor="middle" class="hb-ip-val">${_hbE(fmt(o.c.y))}</text>`; });
    }
  } else {
    const cw = Math.min(26, step * 0.5);
    S.shown.forEach((c, i) => {
      const y = Y(c.y), h = Math.max(0, base - y), lit = i === S.lit;
      if (h > 0.5) g += `<rect x="${(X(i) - cw / 2).toFixed(1)}" y="${y.toFixed(1)}" width="${cw.toFixed(1)}" height="${h.toFixed(1)}" rx="2" class="hb-ip-bar${lit ? ' is-lit' : ''}"/>`;
      if (lit && c.k) g += `<text x="${X(i).toFixed(1)}" y="${(y - 7).toFixed(1)}" text-anchor="middle" class="hb-ip-val">${_hbE(fmt(c.y))}</text>`;
    });
  }
  return `<svg class="hb-ip" viewBox="0 0 ${W} ${H}" aria-hidden="true">${g}</svg>`;
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
    <span class="hb-ag-k"><span class="hb-ag-ic" aria-hidden="true"><svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor"><use href="#i-insight"/></svg></span><span class="hb-ag-t">${_hbE(i18t('hb_ins_title'))}${I.length ? ` <span class="hb-pill">${_hbN(I.length)}</span>` : ''}</span></span>
    <span class="hb-ag-b"><span class="hb-ag-s">${_hbE(i18t(sub))}</span></span>
    <span></span>${btn}</div>`;
}
function hbShelfCards(I){
  const U = hbInsUsual(I);
  return I.slice(0, HB_INS_MAX).concat(U).slice(0, HB_INS_MAX);
}
function hbShelfHtml(I){
  const s = hbS();
  const cards = hbShelfCards(I), calm = '';
  if (!cards.length) return '';
  const kept = new Set(s.panels.filter(p => p.kind === 'view').map(p => p.key));
  const scope = (s.ins || {}).scope, mineN = scope === 'mine' ? hbInsScope().n : 0;
  return `<div class="hb-shelf hb-shelf-cards" data-hb-shelf-n="${cards.length}">${cards.map(x => { const id = x.id, isKept = kept.has(hbInsKey(x.shape, x.mine));
    /* whose, where it is not the whole book's (round 17 as drawn: no rank chip
       above the headline — the sentence says how far it moved) */
    const chips = x.plain ? '' : (x.mine ? `<span class="hb-ins-scope">${_hbE(i18t('hb_ins_scope_mine', { n: _hbN(mineN) }))}</span>` : scope === 'mine' ? `<span class="hb-ins-scope">${_hbE(i18t('hb_ins_scope_co'))}</span>` : '');
    const tone = x.plain ? ' is-plain' : x.tone === 'warn' ? ' is-warn' : x.tone === 'good' ? ' is-good' : '';
    return `<article class="hb-ins${tone}" data-hb-ins-card="${_hbE(id)}">
      ${chips ? `<div class="hb-ins-top">${chips}</div>` : ''}<div class="hb-ins-h"><div class="hb-ins-t">${_hbE(x.title)}</div>${''/* THE × AT THE TOP RIGHT
        (owner, 27 Oct 2026: "give insights the × too"): the Board's one way off a card, the opened chart's own ×;
        it lets the picture go (rests 30 days), so "Let it go" left the foot */}<button type="button" class="hb-ib hb-x hb-ins-x" data-hb-ins="go" data-hb-ins-k="${_hbE(id)}" title="${_hbE(i18t('hb_ins_letgo'))}" aria-label="${_hbE(i18t('hb_ins_letgo'))}">${_hbX}</button></div>
      <button type="button" class="hb-ins-pic" data-hb-ins="open" data-hb-ins-k="${_hbE(id)}" title="${_hbE(i18t('hb_ins_open_tip'))}" aria-label="${_hbE(x.title + ' — ' + i18t('hb_ins_open'))}">${hbInsPicHtml(x)}</button>
      <div class="hb-ins-f">${_hbE(x.say)}</div>${!x.plain && scope === 'mine' ? `<div class="hb-ins-why">${_hbE(hbInsWhy(x))}</div>` : ''}${_hbReadOpen.has('ins:' + id) ? hbReadSrcHtml('ins:' + id) : ''}
      <div class="hb-ins-acts">
        <button type="button" class="hb-btn is-sm" data-hb-ins="open" data-hb-ins-k="${_hbE(id)}">${_hbE(i18t('hb_ins_open'))}</button>
        <button type="button" class="hb-btn is-sm" data-hb-ins="keep" data-hb-ins-k="${_hbE(id)}"${isKept ? ` disabled title="${_hbE(i18t('hb_ins_kept_tip'))}"` : ` title="${_hbE(i18t('hb_ins_keep_tip'))}"`}>${_hbE(i18t(isKept ? 'hb_ins_kept' : 'hb_ins_keep'))}</button>
        ${''/* "ASK WHY" IS RETIRED (Young, 6 Oct 2026): it sent the question to
               the side panel while every other card asks "What could explain
               this?" in place — two doors onto one question. The card's
               finding is its headline; Read more opens its reading here, the
               same block (hbReadSrcHtml), per sitting (_hbReadOpen).
               hb_ins_why / hb_ins_why_q are inert in both books. */}<button type="button" class="hb-link hb-head-more" data-hb-read-more="${_hbE('ins:' + id)}" aria-expanded="${_hbReadOpen.has('ins:' + id)}">${_hbE(i18t(_hbReadOpen.has('ins:' + id) ? 'hb_head_less' : 'hb_ins_askwhy'))}</button></div></article>`; }).join('')}${calm}</div>`;
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
function hbViewPanelHtml(p, lens, gift){
  if (p.recipe) hbCardSet(p.key, p.recipe, { seed: true });
  const D = hbDigData(p.key, lens);
  _hbEdgeMeta.delete(p.id);
  _hbFitAt = { key: p.id, step: 'board', big: !!p.big, grow: !!p.big };
  let inner; try { inner = D ? hbDigBodyHtml(D, lens, !!p.big) : ''; } finally { _hbFitAt = null; }
  /* THE CARD IS CLEAN (11 Oct 2026, as drawn): no recipe sentence on the card —
     its choices are under How this is drawn ▾ on the head (hbEdgeHtml) */
  const body = D ? `<div class="hb-cb">${inner}</div>` : `<div class="hb-cb"><div class="hb-quiet">${_hbE(i18t('hb_none_here'))}</div></div>`;
  const M = _hbEdgeMeta.get(p.id) || {};
  const tag = p.verified ? '' : /^cd:/.test(p.key) ? `<span class="hb-src" title="${_hbE(i18t('hb_cd_src_tip'))}">${_hbE(i18t('hb_cd_src'))}</span>` : `<span class="hb-src" title="${_hbE(i18t('hb_ins_src_tip'))}">${_hbE(i18t('hb_ins_src'))}</span>`;
  const given = gift && gift.sent ? `<span class="hb-given" title="${_hbE(gift.sent.note || '')}">${_hbE(i18t('hb_given', { who: gift.sent.toName || '', seen: i18t(gift.sent.seenAt ? 'hb_seen' : 'hb_not_seen') }))}<button type="button" data-hb-ungive="${_hbE(gift.sent.id)}" title="${_hbE(i18t('hb_take_back'))}" aria-label="${_hbE(i18t('hb_take_back'))}">${_hbX}</button></span>` : '';
  const from = gift && gift.from ? `<span class="hb-given is-from" title="${_hbE(gift.from.note || '')}">${_hbE(i18t('hb_from', { who: gift.from.fromName || '' }))}</span>` : '';
  const edge = D ? hbEdgeHtml(D, p.id, 'board', p, gift)
    : `<span class="hb-edge">${hbCardXHtml(gift)}</span>`;
  return `<section class="hb-card hb-panel hb-view${p.big ? ' is-big' : ''}${p.id === _hbNewPanel ? ' is-new' : ''}" data-hb-pid="${_hbE(p.id)}">
    <header class="hb-ch">${hbStartBtnHtml(p.key, false)}<span class="hb-ch-l"><span class="hb-ct">${_hbE(hbPanelWord(p))}</span>${hbVerBadgeHtml(p)}${tag}${from}${given}${M.by ? `<span class="hb-cs">${_hbE(M.by)}</span>` : ''}</span><span class="hb-grow"></span>
      ${edge}</header>
    ${_hbVerForm === p.id && hbMayVerify(p) ? hbVerFormHtml(p) : ''}${_hbGiveForm === p.id ? `<div class="hb-cb">${hbGiveFormHtml(p)}</div>` : ''}${D ? hbChartWatchHtml(p.key, hbPanelWord(p), 'chart:' + p.id) : ''}${body}</section>`;
}
function hbInsAct(act, id){
  const s = hbS();
  if (act === 'usual'){ s.ins = s.ins || {}; s.ins.usual = hbInsUsualOpen() ? null : hbToday(); hbSave(); hbPaintBoard(); return; }
  const o = hbInsOf(id); if (!o) return;
  const k = o.k;
  if (act === 'open'){ hbInsRecipeOn(k); hbDig(hbInsKey(k, o.mine)); return; }
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
  lead: /^\s*(?:by|per|as|in|with|without|monthly|quarterly|yearly|annually|over time|split by|split it|grouped by|group by|break (?:it |them )?down|compare(?:d)? (?:with|to|against)|vs|versus|against last|efter|per|som|med|utan|månadsvis|kvartalsvis|jämför med|dela)\b/,
  narrow: /\b(?:only|just|of these|of those|among these|among them|filter (?:it )?to|narrow (?:it )?to|bara|endast)\b/,
  fresh: /\b(?:all contracts|every contract|all agreements|whole book|the book|everything|all of them|alla avtal|hela)\b/,
  noTrend: /\b(?:no trend|without (?:a |the )?trend|remove (?:the )?trend|hide (?:the )?trend|trend off|turn off (?:the )?trend|utan trend)\b/,
  count: /\b(?:count|how many|number of|antal)\b/,
  /* a bare measure is "show value" said without its verb (A2) */
  bare: /^\s*(?:the\s+)?(?:value|count|number|money|amount|average|days to sign|trend|värde|antal)\s*$/,
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
  const refer = HB_FU.refer.test(low), verb = HB_FU.verb.test(low) || HB_FU.bare.test(low), lead = HB_FU.lead.test(low), narrow = HB_FU.narrow.test(low);
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
/* the follow-ups said over an open chart, per sitting (never stored): its trail */
const _hbFuSteps = new Map();
function hbFuStepsHtml(key){
  const st = _hbFuSteps.get(key) || []; if (!st.length) return '';
  return st.map((w, i) => `<span aria-hidden="true">›</span><span class="hb-trail-step${i === st.length - 1 ? ' is-last' : ''}">${_hbE(w)}</span>`).join('')
    + `<button type="button" class="hb-trail-back" data-hb-fu-back="${_hbE(key)}">${_hbE(i18t('hb_fu_back'))}</button>`;
}
function hbFollowUp(qRaw, pre){
  const r = pre || hbFollowUpRead(qRaw); if (!r) return null;
  if (r.narrow){
    const N = hbDigData(r.narrow, hbS().lens); if (!N) return null;
    hbDig(r.narrow, true);
    return _hbE(i18tn('hb_found_n', N.n, { n: _hbN(N.n), what: N.title || '' }));
  }
  const did = hbBoardEdit(r.chart); if (!did) return null;
  /* the step is said in the trail, and Back one step undoes it (C3) */
  const st = _hbFuSteps.get(r.key) || []; st.push(String(qRaw || did.said || '').trim().slice(0, 60)); _hbFuSteps.set(r.key, st.slice(-6));
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
    if (ch.length){ _hbMeta = { choices: ch }; const own = hbProseChecked(String(res.answer || '').trim(), { nothingDrawn: true }).text;
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
   ON THE BOARD A MAP ANSWER NEVER TOUCHES THE HIDDEN MAP (one-build work
   order A3, 7 Oct 2026)
   ============================================================
   "bubble chart of value against time left" came back from Copilot in the
   map's language (groupBy, sizeBy, timeBy…) with no board actions; the map
   behind the board was rearranged and "Grouped 180 contracts…" was said over
   an empty board. Now, asked on the board, an answer with no actions and no
   chart is read here and intelGraphApply is never reached:
     - the reader asked for the map ("the map", "show these on the map") →
       null, the map's road as before;
     - a question about what the board shows ("why…") → Copilot's words,
       checked against the open chart, and nothing drawn;
     - the answer names a SET (visibleIds, where, a top N) → the map's fields
       are taken off and null: the set rides the list road onto the board;
     - the question carried picture words HaTi read (_hbPendingRecipe) →
       that recipe is a card over the contracts it named, through the one
       writer;
     - else Copilot is asked ONCE more for board actions (the check-and-repair
       retry), and what still has none is one plain line. Returns what to say,
       or null for the map's road. */
const HB_MAP_FIELDS = ['groupBy', 'groups', 'floorsBy', 'columnsBy', 'colourBy', 'sizeBy', 'labelBy', 'timeBy', 'view', 'look', 'ask'];
const HB_NO_MAP_NOTE = 'This was asked on the BOARD. The map\'s fields (groupBy, floorsBy, columnsBy, colourBy, sizeBy, labelBy, timeBy, view, look) are not drawn there. Answer with board actions: add_card with a recipe (for example "bubble chart of value against time left" is add_card {which:{all:true}, recipe:{pic:"bubbles", measure:"value"}}).';
function hbMapAsked(q){ const t = String(q || ''); return HB_RX.map.test(t) || HB_RX.showThese.test(t); }
function hbRecipeOfRead(R){
  const c = {};
  ['pic', 'split', 'split2', 'measure', 'trend', 'sort', 'top', 'window', 'compare', 'title', 'show'].forEach(k => { if (R[k] != null && R[k] !== false) c[k] = R[k]; });
  return c;
}
async function hbBoardNoMap(res, retry, q){
  if (q != null) _hbAskQ = String(q);
  const s = hbS(); if (s.face !== 'board' || !res) return null;
  if (hbMapAsked(_hbAskQ)) return null;
  /* A PLACE ASKED FOR ON THE BOARD ("take me to Grace in people"): Jambo's goto is run after the answer
     (aiGotoRun), so his words are said and no chart is asked for again (stage 3: never a dead end) */
  if (res.goto && typeof res.goto === 'object' && (res.goto.door || res.goto.task || res.goto.spot)){
    _hbPendingRecipe = null;
    const t = String(res.answer || '').trim();
    /* with no words of his, the move's own line (caGoSay, said by aiGotoRun) is the answer: nothing is drawn here */
    return t ? ((typeof aiRichText === 'function') ? aiRichText(t) : _hbE(t)) : '<span hidden></span>';
  }
  const hasSet = (Array.isArray(res.visibleIds) && res.visibleIds.length) || (res.where && typeof res.where === 'object' && Object.keys(res.where).length) || !!res.top;
  if (hasSet){ HB_MAP_FIELDS.forEach(k => { delete res[k]; }); return null; }
  /* A QUESTION ABOUT WHAT THE BOARD SHOWS is answered in words, checked
     against the open chart, and draws nothing (the prompt's own rule) */
  if (hbCopilotMaySay(_hbAskQ)){
    _hbPendingRecipe = null;
    const t = hbProseChecked(String(res.answer || '').trim()).text;
    return t ? ((typeof aiRichText === 'function') ? aiRichText(t) : _hbE(t)) : _hbE(i18t('hb_no_map_said'));
  }
  const R = _hbPendingRecipe; _hbPendingRecipe = null;
  if (R && (R.pic || R.chartWord || R.split)){
    /* the contracts it named, in the words HaTi read ("suppliers"), else the book */
    const which = R.conds && R.conds.length ? { q: R.conds.join(' and ') } : { all: true };
    const u0 = hbUndoTop();
    const r = hbBoardApply([{ do: 'add_card', which, recipe: hbRecipeOfRead(R) }]);
    if (r.did.length) return r.html + hbNoteUndo(u0);
  }
  if (typeof retry === 'function'){
    let res2 = null; try { res2 = await retry(HB_NO_MAP_NOTE); } catch (_){ res2 = null; }
    if (res2 && Array.isArray(res2.actions) && res2.actions.length){
      const said = await hbBoardTakesChecked(res2, null, _hbAskQ);
      if (said) return said;
    }
  }
  /* AI FIRST, NEVER A DEAD END (stage 3): words that asked for no picture at all go to Jambo's whole chat */
  if (!R && typeof caAiFirst === 'function' && caAiFirst()) return { chat: true };
  return _hbE(i18t(R ? 'hb_no_map_pic' : 'hb_no_map_said'));
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
  const tail = hbCopilotTail(res.answer, _hbAskQ, { nothingDrawn: !applied.length, say: !!res.say });
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
  else if (act === 'more'){ _hbMoreMenu = _hbMoreMenu === pid ? null : pid; const mk = pid + '|board'; _hbToolsMenu = _hbToolsMenu === mk ? null : mk; }
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
  if (/^open$/i.test(r)){ const key = hbOpenListKey(); if (key) return { open: true, key };
    /* nothing opened: "this chart" is the card the last answer drew, else the
       newest kept chart (owner, 11 Oct 2026: "there is no card 'open'" while
       the chart stood on the board) */
    const views = s.panels.filter(x => x.kind === 'view');
    const p = views.find(x => x.id === s.lastAsked) || views[views.length - 1];
    return p ? { p, key: p.key } : null; }
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
      added.push(p.id); s.lastAsked = p.id;
      const D = hbDigData(p.key, s.lens);
      const lead = hbLeadSay(D, _hbAskQ);
      did.push(i18t('hb_act_added', { what: p.title, how: D ? hbHowWord(hbPlan(D)) : '' }) + (lead ? ' ' + lead : '') + (left ? ' ' + i18t('hb_panel_left', { what: hbPanelWord(left) }) : ''));
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
  if (did.length) hbPaintBoard(jump ? { jump } : still.length ? { jump: 'top', pids: still } : undefined);
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
function hbReadingHtml(rd, live, opts){
  if (!rd || !rd.key) return '';
  const s = hbS(); const D = live ? hbDigData(rd.key, s.lens) : null;
  const P = D && D.kind === 'list' ? hbPlan(D) : null;
  const words = P ? hbRdWords(P) : (rd.words || {});
  const label = p => i18t({ pic: 'hb_rc_pic', split: 'hb_rc_split', measure: 'hb_rc_measure' }[p]);
  if (!P) return `<div class="hb-rd is-still" aria-label="${_hbE(i18t('hb_rd_label'))}">${HB_RD_PARTS.filter(p => words[p]).map(p => `<span class="hb-rd-chip is-still"><i>${_hbE(label(p))}</i>${_hbE(words[p])}</span>`).join('')}</div>`;
  const chip = p => {
    const open = _hbRdOpen === rd.key + '|' + p;
    const menu = open ? `<div class="hb-rd-menu" role="menu" aria-label="${_hbE(label(p))}">${hbRcShown(p, P, D).map(x => {
      const cur = hbRcCurHas(p, P, x.v);
      return (x.head ? `<div class="hb-rd-menu-h" role="presentation">${_hbE(x.head)}</div>` : '') + `<button type="button" role="menuitemradio" aria-checked="${cur}" data-hb-rdset="${_hbE(p + ':' + x.v)}"${x.on ? '' : ' disabled'}${x.why ? ` title="${_hbE(x.why)}"` : ''}><span>${_hbE(x.word)}</span>${x.why ? `<small>${_hbE(x.why)}</small>` : cur ? `<b aria-hidden="true">${_hbTick}</b>` : ''}</button>`; }).join('')}</div>` : '';
    return `<span class="hb-rd-wrap"><button type="button" class="hb-rd-chip${open ? ' is-open' : ''}" data-hb-rd="${p}" aria-haspopup="menu" aria-expanded="${open}"><i>${_hbE(label(p))}</i>${_hbE(words[p])}${_hbCaret}</button>${menu}</span>`;
  };
  return `<div class="hb-rd" role="group" data-hb-rd-key="${_hbE(rd.key)}" aria-label="${_hbE(i18t('hb_rd_label'))}">${HB_RD_PARTS.map(chip).join('')}${opts && opts.noNext ? '' : hbNextHtml(rd.key)}</div>`;
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
    /* next questions moved under Jambo's words (Both halves) are a row of their own: the whole panel is repainted */
    if (h.some(m => m && m.nextKey)){ if (typeof renderIntelDock === 'function') renderIntelDock(); return; }
    document.querySelectorAll('[data-ig-turn] .hb-rd').forEach(el => {
      const turn = el.closest('[data-ig-turn]'); const i = Number(turn && turn.getAttribute('data-ig-turn'));
      const m = h[i]; if (!m || !m.reading) return;
      el.outerHTML = hbReadingHtml(m.reading, hbReadingLive(i), { noNext: !!m.nextMoved }); done = true;
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
  /* THE OPENING WORDS NEVER DECIDE THE ROAD (one-build work order A2, 7 Oct
     2026): "draw", "plot", "display", "put up", a bare "show" — read away
     the same as "show me". "show it", "show these", "show all" stay: they
     are about the open chart, the map or the whole book. */
  [/^\s*(?:draw|plot|display|put up|visa mig|visa|rita)\s+(?:me\s+|up\s+)?/, ' '],
  [/^\s*show\s+(?!it\b|this\b|them\b|these\b|those\b|the chart\b|all\b)/, ' '],
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
  [/\b(?!growth (?:in %|in percent|%))(?:growth rate|rate of growth|growth|growing|grown|grow|grows|trajectory|momentum|evolution|evolving|evolved|development|direction of travel|run rate|velocity of signing|pace of signing|pace|cadence)\b/, HB_AW_DATE + ' trend '],
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
/* THE ANSWER TO "WHICH … THE MOST" IS THE CARD'S LEADER (stage 3d): a card drawn for a question that asks for the
   most or the least names the group at that end, with its figure — HaTi's own words from what was DRAWN */
const HB_MOST_ASK_RE = /\b(?:most|biggest|largest|highest|top|mest|störst\p{L}*|högst\p{L}*)\b/iu, HB_LEAST_ASK_RE = /\b(?:least|smallest|lowest|fewest|minst\p{L}*|lägst\p{L}*)\b/iu;
function hbLeadSay(D, q){
  const t = String(q || ''), least = HB_LEAST_ASK_RE.test(t);
  if (!D || D.kind !== 'list' || !(least || HB_MOST_ASK_RE.test(t))) return '';
  const P = hbPlan(D), S = P && P.split; if (!S || !S.by || S.by === 'date') return '';
  const mv = hbSeriesMv(P);
  const rows = hbGroupsOf(hbListOf(D.ids, hbS().lens), S.by, mv).filter(r => r.g).sort((a, b) => mv ? b.v - a.v : b.n - a.n);
  if (rows.length < 2) return '';
  const r = least ? rows[rows.length - 1] : rows[0];
  return i18t(least ? 'hb_lead_least' : 'hb_lead_most', { what: r.label, how: mv ? _hbM(r.v) : i18tn('int_n_contracts', r.n, { n: _hbN(r.n) }) });
}
/* …and UNDER WHAT HE DREW, for a QUESTION OF FACT ("which customer is worth the most"): the drawing says what it
   shows, his checked sentence says the answer — the name the person asked for (stage 3d) */
const HB_FACT_ASK_RE = /^\s*(?:which|who|whom|whose|what is|what's|whats|how much|how many|vilken|vilket|vilka|vem|hur mycket|hur många)\b/i;
/* the count line: "10 contracts, SEK 729M." — the money only where the card
   measures it and this reader may see it */
function hbAnswerCount(D, P){
  if (!D || !D.n) return '';
  const s = hbS();
  if (P && P.measure === 'value' && hbMoneyOk()) return i18tn('hb_count_n_value', D.n, { n: _hbN(D.n), v: _hbM(hbValueOf(hbListOf(D.ids, s.lens)).v) });
  return i18tn('hb_count_n', D.n, { n: _hbN(D.n) });
}
/* THE SET A LIST'S ANSWER COUNTS, ONE READING for the Board's own answer
   (hbAnswerSay) and a box away from the Board (hbAskFound): its contracts in
   the lens and, where the card has a period, within it. A PERIOD IS PART OF
   WHAT IS COUNTED (the Board walk-through, 15 Oct 2026: "Which contracts end
   this quarter?" said "All contracts: 54" over a chart of 18): the count and
   the name are the window's */
function hbAnswerSet(D, P){
  const s = hbS(); P = P || (D && D.kind === 'list' ? hbPlan(D) : null);
  let cs = hbListOf(D && D.ids, s.lens), what = (D && D.title) || '';
  if (D && D.kind === 'list' && P && P.window){ const W = hbWindowCut(cs, P); if (W){ cs = W.cs; what = [what, hbWinWord(P.window)].filter(Boolean).join(' · '); } }
  return { cs, what, P, windowed: !!(D && D.kind === 'list' && P && P.window) };
}
/* ONE ANSWER WRITER: what is counted, how many, and how it is drawn */
function hbAnswerSay(D, P, opts){
  if (!D) return '';
  P = P || (D.kind === 'list' ? hbPlan(D) : null);
  /* …and where the question asked for an amount ("how much is in drafts"), the set's value is said whatever
     the card measures: it is a fact of the set drawn (stage 3d) */
  const money = D.kind === 'list' && hbMoneyOk() && P && (P.measure === 'value' || !!(opts && opts.money));
  const S = hbAnswerSet(D, P), cs = S.cs, what = S.what;
  const n = S.windowed ? cs.length : D.n;
  const head = money ? i18tn('hb_found_n_value', n, { n: _hbN(n), what, v: _hbM(hbValueOf(cs).v) })
    : i18tn('hb_found_n', n, { n: _hbN(n), what });
  const how = D.kind === 'list' && D.n && P ? ' ' + i18t('hb_found_how', { how: hbHowWord(P) }) : '';
  return _hbE(head + how);
}
/* the name a set Copilot chose is shown under: the one asked for, HaTi's own
   top-N label, the open card's when the question points at it, else the
   person's own words — never Copilot's note */
const HB_FOUND_TITLE_MAX = 60;   // the person's words as a title; longer is named by what was read, or cut with …
function hbFoundTitle(q, top){
  const raw = String(q || '').trim();
  const m = HB_RC.title.exec(raw); if (m && m[1]) return hbPlainText(m[1], HB_TITLE_MAX);
  if (top) return hbPlainText(top, HB_TITLE_MAX);
  const low = ' ' + _hbRcNorm(raw) + ' ', key = hbOpenListKey();
  if (key && HB_FU.refer.test(low)) return hbPlainText(hbCrumbOf(key, hbS().lens), HB_TITLE_MAX);
  /* A CAP IS A FACT, NEVER A SILENT TRIM (owner, 19 Oct 2026: "…that are
     under draft" lost "draft"): words that fit are the title; longer, the set
     is named by what was read (the map's own conditions, "Draft"), else the
     words are cut where it shows (…) */
  const whole = hbPlainText(raw.replace(/[?!.]+$/, ''), 2000);
  let t = whole;
  if (whole.length > HB_FOUND_TITLE_MAX){
    let conds = []; try { conds = (typeof igConditions === 'function') ? (igConditions(whole) || []) : []; } catch (_){ conds = []; }
    t = conds.length ? conds.map(c => c.label).join(' · ') : whole.slice(0, HB_FOUND_TITLE_MAX - 1).trimEnd() + '…';
  }
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : i18t('hb_found_list');
}
/* the reply for a set drawn on the board (after hbShowFound) */
const HB_AMOUNT_Q = /\b(how much|what is .{0,30}\b(worth|value)|total value|hur mycket|vad är .{0,30}värt)\b/i;
function hbFoundSay(q){
  const s = hbS(); const key = (s.path || []).slice(-1)[0]; if (!key) return '';
  return hbAnswerSay(hbDigData(key, s.lens), null, { money: HB_AMOUNT_Q.test(String(q || '')) });
}
/* THE DISCONNECT CHECK: a Copilot sentence that states a count the board
   does not show, a picture the open chart is not, or a split it is not split
   by, is left out. Returns the kept text and what was dropped. */
const HB_PIC_CLAIM_RE = /\b(?:as an?|shown as an?|drawn as an?|now an?|into an?|in an?)\s+(pie|ring|doughnut|donut|bar|bars|column|columns|timeline|gantt|heat ?map|blocks|tree ?map|waterfall|funnel|box ?plot|small multiples)\b/i;
const HB_PIC_OF = { pie: 'ring', ring: 'ring', doughnut: 'ring', donut: 'ring', bar: 'bars', bars: 'bars', column: 'cols', columns: 'cols', timeline: 'gantt', gantt: 'gantt', heatmap: 'heat', 'heat map': 'heat', blocks: 'blocks', treemap: 'blocks', 'tree map': 'blocks', waterfall: 'waterfall', funnel: 'funnel', boxplot: 'spread', 'box plot': 'spread', 'small multiples': 'multi' };
const HB_SPLIT_CLAIM_RE = /\b(?:split|grouped|broken down|shown|drawn|now)\b[^.]{0,30}?\bby (stage|stream|value stream|counterparty|owner|type|side|payment terms|month|quarter|year)\b/i;
const HB_SPLIT_OF = { stage: 'status', stream: 'folder', 'value stream': 'folder', counterparty: 'counterparty', owner: 'owner', type: 'kind', side: 'side', 'payment terms': 'payterms', month: 'date', quarter: 'date', year: 'date' };
/* A4 (one-build work order, 7 Oct 2026): a sentence that names a picture
   while no card landed is dropped — "This bubble chart plots…" over an empty
   board was the reported fault */
const HB_NAMES_CHART_RE = /\b(?:chart|graph|plot(?:s|ted)?|diagram|bubbles?|pie|doughnut|donut|treemap|tree map|heat ?map|timeline|gantt|histogram|scatter)\b/i;
function hbProseChecked(text, opts){
  if (opts && opts.nothingDrawn){
    const all = String(text || '').split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ0-9*"(])/);
    const keep = all.filter(snt => !HB_NAMES_CHART_RE.test(snt));
    if (keep.length < all.length) hbFeedbackSend({ kind: 'disconnect', q: _hbAskQ, said: String(text || '').slice(0, 600) });
    text = keep.join(' ');
  }
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
/* opts.say: the Board's Jambo tab asked him to draw AND say what it shows (igBoardDrawn, owner 27 Oct 2026); his words
   still pass the same check against what was drawn (hbProseChecked) */
function hbCopilotTail(own, q, opts){
  const o = String(own || '').trim(); if (!o || !((opts && opts.say) || hbCopilotMaySay(q) || HB_FACT_ASK_RE.test(String(q || '')))) return '';
  const chk = hbProseChecked(o, opts); if (!chk.text) return '';
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
let _hbMoreMenu = null, _hbVerForm = null, _hbToolsMenu = null;
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
function hbOpenOne(raw){
  const t = String(raw || '').replace(/^\s*(?:(?:can|could|would) you |please )+/i, '').trim();
  const b = HB_RX.bring.exec(t); if (!b || !b[1]) return null;
  if (hbRecipeRead(b[1])) return null;
  const f = hbFindContract(t);
  return f && f.c ? f.c : null;
}
/* "BRING UP MK-…" ON THE PAPER TOO (step 8): the strip is the Board's, but
   the words are read where Jambo's box stands beside the paper as well,
   before any model, and land through the one door (hbDig 'c:' →
   hbStripBring), free. Only the explicit bringing words: on the paper "open
   MK-…" stays that contract's paper (caPlaceOf) and a question that merely
   names a contract stays a question about it. EXPLORER STAYS AS DESIGNED
   (the owner's words; f447 (3)): the map answers there, as it always did. */
const HB_BRING_RE = /^\s*(?:(?:can|could|would) you |please )*(?:bring up|pull up|ta fram)\s+\S/i;
function hbBringOf(qRaw){
  const raw = String(qRaw == null ? '' : qRaw);
  if (!HB_BRING_RE.test(raw)) return null;
  const c = hbOpenOne(raw);
  return c ? { id: c.id } : null;
}
/* A COMMAND ACTS, EVERYTHING ELSE IS THE BRAIN'S (owner, 24 Oct 2026: "give all the jambos the ability"): the free
   readers act at once only on a COMMAND — an imperative draw/show/open/move word first, a bare Board word (a face,
   a lens, "top 10", "undo"), a contract's reference — and say one line. A question, "tell me…", "create a table…",
   "explain…" is never theirs: the brain answers it, in the box it was typed in, with the screen's numbers in its
   context (pageSays) and the full treatment (aiFmt). Asked by intelAsk, aiSubmit and caAskAnywhere alike. */
const HB_CMD_RE = /^\s*(?:please\s+|snälla\s+|can you\s+|could you\s+|kan du\s+)?(?:show|draw|chart|plot|graph|map|group|regroup|split|filter|narrow|only|colou?r|sort|rank|open|go|take me|back|put|undo|redo|clear|reset|hide|remove|add|pin|zoom|dig|bring|pull up|visa|rita|gruppera|dela|filtrera|sortera|öppna|gå|tillbaka|ångra|dölj|ta bort|lägg till|ta fram)(?=[\s.,!:]|$)/i;
/* a sentence that asks the BRAIN for words — never the Board's reader, whatever it could draw */
const HB_BRAIN_VERB_RE = /^\s*(?:please\s+|snälla\s+|can you\s+|could you\s+|kan du\s+|jambo[,:]?\s+)?(?:tell|explain|create|make|build|write|give|describe|analy[sz]e|summari[sz]e|compare|advise|help|suggest|recommend|assess|review|check|think|berätta|förklara|skapa|gör|bygg|skriv|ge|beskriv|analysera|sammanfatta|jämför|hjälp|föreslå|rekommendera|bedöm|granska)(?=[\s.,!:]|$)/i;
function hbBrainVerb(q){ return HB_BRAIN_VERB_RE.test(String(q || '')); }
/* words that ask for a PICTURE the free reader could not read whole ("bubble chart of value for the grumpy
   suppliers"): the Board's drawing model (the graph route) reads them, never the chat */
const HB_CHART_WORD_RE = /\b(chart|graph|plot|bubbles?|pie|bars?|columns?|timeline|blocks|ring|donut|heat ?map|diagram|dashboard|board|cards?|picture|visual\w*|stor(?:y|ies)|berättelse\w*|stapl\w*|cirkel\w*|tidslinje|kurva|tavla\w*|kort)\b/i;
function hbChartWords(q){ return HB_CHART_WORD_RE.test(String(q || '')); }
function hbQuestionAsk(q){ const t = String(q || '').trim(); return /\?\s*$/.test(t) || !!(window.CA_WH_Q && CA_WH_Q.test(t)); }
function hbCommandAsk(qRaw){
  const t = String(qRaw || '').trim();
  if (!t || hbQuestionAsk(t)) return false;
  /* an imperative, or chart words even where the rest is unread ("bubble chart of value for the grumpy suppliers",
     "build me a renewals dashboard"): the Board's reader keeps the picture it read (_hbPendingRecipe) and its
     drawing model fills the rest */
  if (HB_CMD_RE.test(t) || hbChartWords(t)) return true;
  /* the Board's own extra readers ("my saved views") act too */
  if (HB_VIEWS_ASK_RE.test(t)) return true;
  let A = null; try { A = hbAskReadingOf(t); } catch (_) { A = null; }
  /* "make it monthly", "make this look like a league table" follow the OPEN chart: a command; "create a table for
     juno llc payment terms" (a brain verb, nothing open it points at, no chart word) is the brain's, whatever the
     reader thought it could add */
  /* …and a STORY the Board reads ("build our quarterly contract review") is its own drawing */
  if (hbBrainVerb(t)) return !!(A && A.road === 'free' && (A.kind === 'follow' || A.kind === 'story')) || (HB_THIS_RE.test(t) && hbOpenCardKey() != null);
  /* a plain phrase the Board reads whole ("top 10", "By counterparty", "1M to 5M", "only Naivas") is an ask to draw */
  return hbDrawsSomething(A);
}
/* THE FLAT KINDS: a reading that only SAYS a line (an answer pack) draws nothing — never the answer to a question or a
   sentence; every other free reading draws or opens something (a card, a list, a story, a verified view, a follow-up) */
const HB_FLAT_KINDS = ['pack'];
/* words that point at the open chart */
const HB_THIS_RE = /\b(this|it|the open chart|this chart|this card|den här|det här|detta|den)\b/i;
function hbDrawsSomething(A){ return !!(A && A.road === 'free' && !HB_FLAT_KINDS.includes(A.kind)); }
/* A QUESTION THE BOARD CAN DRAW OR OPEN ("what ends this quarter", "which obligations are overdue?", "how many live
   contracts do we have", a verified view) is drawn first, free, and then ALWAYS explained by the brain under the
   Board's line (igAskThenExplain). A question the Board would only answer with a flat pack is the brain's alone. */
function hbDrawAsk(qRaw, onFace){
  const t = String(qRaw || '').trim();
  if (!t || hbCommandAsk(t)) return false;
  /* BOTH HALVES (owner picked it by name, 25 Oct 2026): "tell me more about what ends this quarter" is drawn too —
     the lead words are taken off and what is left is read as the Board reads a question; "create…" keeps the brain */
  if (hbBrainVerb(t) && !hbChartWords(t)) return !!hbTellSubject(t, onFace);
  let A = null; try { A = hbAskReadingOf(t, onFace); } catch (_) { A = null; }
  return hbDrawsSomething(A);
}
/* ---- BOTH HALVES — DRAWN AND EXPLAINED, WHATEVER THE VERB (owner picked it by name, 25 Oct 2026: "if you ask to
   tell you more about something, it should be okay to be pushed to the board and it shows you the charts while
   giving you nuanced answers") ----
   The verb used to decide: "show" drew and said one line, "tell" said words and drew nothing, and only a plain
   question got both. Now the SUBJECT decides: a subject the Board can draw is drawn and then explained by the
   brain (igAskThenExplain); the verb only sets how deep the words go. A change to what is already drawn ("sort by
   value", "make it monthly", "only Naivas", "undo") is still said in one line, and so is a plain command ("show me
   the drafts": the owner's answer, "Show stays free", 25 Oct 2026). "More", "go on", "why" carry on
   from the last answer (hbMoreAsk), and the next questions sit under the words (nextKey). */
const HB_TELL_RE = /^\s*(?:(?:please|can you|could you|would you|jambo[,:]?|snälla|kan du)\s+)*(?:tell (?:me|us)|explain|describe|walk (?:me|us) through|talk (?:me|us) through|take (?:me|us) through|give (?:me|us) (?:an? )?(?:overview|summary|breakdown|rundown|picture) (?:of|on)|summari[sz]e|break down|go deeper (?:on|into)|dig deeper (?:on|into)|berätta(?: för mig)?|förklara|beskriv|sammanfatta)(?:\s+(?:a (?:bit|little) |lite )?(?:more|mer))?(?:\s+(?:about|on|of|regarding|om))?\s+(.+?)\s*[.!?]*\s*$/iu;
/* the kinds of drawing that are a fresh picture worth words; a contract's strip, a face, a saved view are not */
const HB_EXPLAIN_KINDS = ['dig', 'panel', 'split'];
function hbSubjectDraws(A){ return hbDrawsSomething(A) && (HB_EXPLAIN_KINDS.includes(A.kind) || A.kind === 'verified' || A.kind === 'follow'); }
/* the words left once "tell me more about" is taken off, when the Board draws them; else null */
function hbTellSubject(qRaw, onFace){
  const m = HB_TELL_RE.exec(String(qRaw || '')); if (!m || !m[1]) return null;
  const sub = m[1].trim(); if (!sub || /^(?:it|this|that|them|these|those|more|det|detta|dem)$/i.test(sub)) return null;
  let A = null; try { A = hbAskReadingOf(sub, onFace); } catch (_){ A = null; }
  return hbSubjectDraws(A) ? sub : null;
}
/* what the Board draws for these words: the subject of a "tell me…" sentence, else the words as typed */
function hbDrawWordsOf(qRaw, onFace){
  const t = String(qRaw || '').trim();
  return (hbBrainVerb(t) && !hbChartWords(t) && hbTellSubject(t, onFace)) || t;
}
/* a change to what is already drawn, said in one line and never explained */
const HB_TWEAK_RE = /^\s*(?:please\s+|can you\s+|could you\s+)?(?:sort|rank|filter|narrow|only|colou?r|group|regroup|split|open|go|take me|back|put|undo|redo|clear|reset|hide|remove|add|pin|zoom|make (?:it|this)|turn (?:it|this)|switch|as an?|by|sortera|filtrera|gruppera|dela|öppna|gå|tillbaka|ångra|dölj|ta bort|lägg till|bara|som en?|per)(?=[\s.,!:]|$)/i;
/* ONE RULE FOR WHETHER A DRAWING IS ALSO EXPLAINED (asked by igAskThenExplain on every host) */
function hbExplainsDrawn(qRaw, A){
  const t = String(qRaw || '').trim();
  if (!t || !hbDrawsSomething(A)) return false;
  /* a change to what is drawn ("make it monthly", "sort by value", "only Naivas"): one line, asked first because
     "make" is also a word that asks for words */
  if (HB_TWEAK_RE.test(t)) return false;
  /* a question, or a "tell me…" sentence, the Board drew: always explained */
  /* SHOW STAYS FREE (the owner's answer, 25 Oct 2026): a command ("show me the drafts", "deals by stage", a bare
     "obligations") draws and says one line, free, as before — only words that ask for words are explained */
  /* a story writes its own words in its own call (hbStoryWrite): never a second one; and only the TELLING words
     ("tell me more about", "explain", "describe"), never "build", "create", "make" */
  if (A.kind === 'story') return false;
  return hbQuestionAsk(t) || HB_TELL_RE.test(t);
}
/* "more", "go on", "why?", "tell me more": the last answer carried on, by the brain, the Board as it stands */
const HB_MORE_RE = /^\s*(?:(?:and|ok(?:ay)?|so|och|okej)[\s,]+)?(?:(?:tell me |say )?more(?: please| on (?:that|this|it)| about (?:that|this|it))?|go on|keep going|continue|go deeper|dig deeper|elaborate|expand(?: on (?:that|this|it))?|why|how come|tell me more|mer|berätta mer|fortsätt|varför)\s*[.!?]*\s*$/i;
function hbMoreAsk(q){ return HB_MORE_RE.test(String(q || '')); }
function hbAskReadingOf(qRaw, onFace){
  const raw = String(qRaw == null ? '' : qRaw);
  if (!raw.trim()) return null;
  const s = hbS();
  /* onFace: the face the words would be read on — Jambo's panel beside a
     list asks as the Counter's box hands them, on the Board (jlBoardReads) */
  const face = onFace || s.face;
  if (HB_WHY_ASK_RE.test(raw)) return { road: 'copilot', why: true, q: raw };
  if (face === 'paper'){ const br = hbBringOf(raw); if (br) return { road: 'free', kind: 'card', r: { act: 'card', id: br.id }, q: raw }; }
  /* A VERIFIED VIEW ANSWERS FIRST (Part 9): the company's own answer to the
     questions an admin named, exact after normalising, before any reading */
  if (face === 'board'){ const v = hbVerifiedHit(raw); if (v) return { road: 'free', kind: 'verified', v, q: raw }; }
  /* AN ANSWER PACK (Charts That Explain, rec 3): the four questions that
     matter most get their ready answer, free, the same way every time */
  if (face === 'board'){ const pk = hbPackOfQ(raw); if (pk) return { road: 'free', kind: 'pack', pack: pk, q: raw }; }
  /* A STORY: its chapters free, its words one Copilot call (the ask is the press) */
  if (face === 'board'){ const sy = hbStoryOfQ(raw); if (sy) return { road: 'free', kind: 'story', story: sy, q: raw }; }
  /* ONE CONTRACT ASKED FOR BY NAME ("show me Amani Foods", "bring up
     MK-104"): read off the words as typed, before the opening words are read
     away — and only when they carry no chart words (A2) */
  { const oc = hbOpenRef(raw); if (oc) return { road: 'free', kind: 'openc', r: { act: 'openc', id: oc.id }, q: raw }; }
  if (face === 'board'){ const one = hbOpenOne(raw); if (one) return { road: 'free', kind: 'card', r: { act: 'card', id: one.id }, q: raw }; }
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
  if (face !== 'board' && !((r.act === 'face' && r.face === 'board') || r.toBoard || r.act === 'present' || r.act === 'analyze')) return { road: 'map', q, r };
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
    if (A.kind === 'story') return i18t('hb_pre_story', { what: hbStoryTitle(A.story) });
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
    if (r.act === 'openc'){ const K = hbCardData(hbContract(r.id)); return i18t('hb_opening') + ' ' + K.ref + ' · ' + K.name + free; }
    if (r.act === 'card' || r.act === 'analyze'){ const K = hbCardData(hbContract(r.id)); return i18t(r.act === 'card' ? 'hb_pre_card' : 'hb_pre_analyze', { what: K.ref + ' · ' + K.name }) + free; }
  } catch (_){ /* the line is a courtesy: say the plain thing */ }
  return i18t('hb_pre_cmd') + free;
}
/* ---- WHAT A FREE READING FOUND, SAID AWAY FROM THE BOARD (owner, 22 Oct
   2026: Part 8's question 3 = A, "Answer beside the list: Jambo answers in
   the panel on the right. You stay on Approvals (or whichever list you were
   on), with your tab and filters as they were") ----
   The contracts the Board's own reading names — a figure, a set read off the
   words, the book by side, one contract by name — counted by the very
   readings the Board answers from: hbDigData, the set hbAnswerSet counts, the
   figure's own sentence (hbFigSay), the count line (hbAnswerCount). PURE:
   nothing is dug, drawn, saved or spent. Null where the reading is not a set
   the words can say (a Board act, a change to the open chart, a pack, a
   story, a verified view — the Board draws those). Returns { ids, say, one }:
   the ids in the reading's order, `say` plain words (the caller escapes). */
function hbAskFound(A){
  if (!A || A.road !== 'free') return null;
  const s = hbS(), r = A.r || {};
  const ids = cs => cs.map(c => c.id);
  if ((A.kind === 'card' || A.kind === 'openc') && r.id){
    const c = hbContract(r.id); if (!c) return null;
    const K = hbCardData(c);
    return { one: true, ids: [c.id], say: [K.ref + ' · ' + K.name, _hbStatus(K.status), K.cp, K.expiry ? i18t('hb_c_ends', { day: _hbDayWord(K.expiry) }) : ''].filter(Boolean).join(' · ') + '.' };
  }
  if (A.kind === 'noref' && r.ref) return { ids: [], say: i18t('hb_no_ref', { ref: r.ref }) };
  if (A.kind === 'lens' && r.lens){
    const cs = hbBook(r.lens).filter(c => c.status !== 'Declined');
    const what = i18t('hb_lens_' + r.lens);
    return { ids: ids(cs), say: cs.length ? what + ': ' + hbAnswerCount({ n: cs.length, ids: ids(cs) }) : i18t('jl_found_none', { what }) };
  }
  if (A.kind !== 'dig' || !r.key) return null;
  const D = hbDigData(r.key, s.lens); if (!D) return null;
  const fig = /^f:/.test(r.key) ? r.key.slice(2) : '';
  /* late duties: the figure counts obligations; the contracts they sit on are named */
  if (D.kind === 'obl') return { ids: [...new Set((D.rows || []).map(o => o && o.cid).filter(id => hbContract(id)))], say: hbFigSay('overdue') };
  if (D.kind === 'stages'){
    const cs = hbListOf((D.stages || []).flatMap(x => x.ids || []), s.lens);
    const what = i18t(D.word || 'hb_f_value');
    return { ids: ids(cs), say: cs.length ? what + ': ' + hbAnswerCount({ n: cs.length, ids: ids(cs) }, { measure: 'value' }) : i18t('jl_found_none', { what }) };
  }
  if (D.kind !== 'list') return null;
  const S = hbAnswerSet(D);
  if (fig && !S.windowed) return { ids: ids(S.cs), say: hbFigSay(fig) };
  const what = S.what || hbCrumbOf(r.key, s.lens);
  return { ids: ids(S.cs), say: S.cs.length ? what + ': ' + hbAnswerCount({ n: S.cs.length, ids: ids(S.cs) }, S.P) : i18t('jl_found_none', { what }) };
}
/* "MY SAVED VIEWS" (round 17 as drawn: one of his three chips on the Board):
   the views saved, each with how many contracts it shows (igRecipeShown, the
   chips' own count) and where they are — the chips in the Board's head, each
   opening on Explorer. Free; nothing is opened or written. */
const HB_VIEWS_ASK_RE = /^(?:(?:show |list )?(?:me )?(?:my|the) )?saved views\??$|^(?:(?:visa )?(?:mina )?)sparade vyer\??$/;
function hbSavedViewsSay(){
  let v = []; try { v = (typeof igViewsRead === 'function') ? igViewsRead() : []; } catch (_){ v = []; }
  const free = `<div class="hb-cost">${_hbE(i18t('hb_free'))}</div>`;
  if (!v.length) return _hbE(i18t('hb_jb_views_none')) + free;
  const list = v.slice().reverse().map(x => { let n = null; try { n = (typeof igRecipeShown === 'function') ? igRecipeShown(x.recipe) : null; } catch (_){ n = null; }
    return `“${_hbE(x.name)}”${n != null ? ' ' + _hbN(n) : ''}`; }).join(' · ');
  return _hbE(i18tn('hb_jb_views_say', v.length, { n: v.length })) + ' ' + list + '. ' + _hbE(i18t('hb_jb_views_where')) + free;
}
function hbAsk(q){
  _hbMeta = null;
  const A = hbAskReadingOf(q);
  if (HB_VIEWS_ASK_RE.test(String(q || '').trim().toLowerCase())){ _hbPendingRecipe = null; return hbSavedViewsSay(); }
  if (!A){ _hbPendingRecipe = null; return null; }
  if (A.why){ _hbPendingRecipe = null; return null; }
  if (A.kind === 'verified'){ _hbPendingRecipe = null; const u = hbUndoTop(); return hbVerifiedAnswer(A.v) + `<div class="hb-cost">${_hbE(i18t('hb_free'))}${hbNoteUndo(u)}</div>`; }
  if (A.kind === 'story'){
    _hbPendingRecipe = null; const u = hbUndoTop();
    hbDig('sy:' + A.story, false);
    const S = hbStoryData(A.story, hbS().lens);
    const live = typeof copilotAvailable === 'function' && copilotAvailable();
    const w = hbStoryWords(A.story, hbS().lens);
    if (live && !(w && !w.stale && w.lead)) hbStoryWrite(A.story);
    return `<b>${_hbE(S.title)}</b> — ${_hbE(i18tn('hb_sy_said', S.chapters.length, { n: S.chapters.length, when: S.period }))}<div class="hb-cost">${_hbE(i18t(live ? (w && !w.stale && w.lead ? 'hb_sy_cost_kept' : 'hb_sy_cost') : 'hb_sy_cost_nokey'))}${hbNoteUndo(u)}</div>`;
  }
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
  /* the words named the Board: it is turned to first, wherever they were typed */
  if (r.toBoard && s.face !== 'board') hbSetFace('board');
  const free = i18t('hb_free');
  const say = (html, opts) => { if (!opts || !opts.noPaint){ if (s.face === 'board') hbPaintBoard(opts && opts.jump ? { jump: opts.jump } : undefined); } return html + `<div class="hb-cost">${_hbE(free)}${hbNoteUndo(u0)}</div>`; };
  if (r.act === 'card'){
    const c = hbContract(r.id); const K = hbCardData(c);
    hbDig('c:' + c.id, false);
    return say(`<b>${_hbRefH(K.ref)} · ${_hbE(K.name)}</b> — ${_hbE(_hbStatus(K.status))}${K.cp ? ' · ' + _hbE(K.cp) : ''}${K.expiry ? ' · ' + _hbE(i18t('hb_c_ends', { day: _hbDayWord(K.expiry) })) : ''}. ${_hbE(i18t('hb_card_said'))}`, { noPaint: true });
  }
  if (r.act === 'openc'){
    const c = hbContract(r.id); const K = hbCardData(c);
    setTimeout(() => { if (typeof regOpenContract === 'function') regOpenContract(c.id); }, 0);
    return say(`${_hbE(i18t('hb_opening'))} <b>${_hbRefH(K.ref)} · ${_hbE(K.name)}</b>`, { noPaint: true });
  }
  if (r.act === 'analyze'){
    const c = hbContract(r.id); const K = hbCardData(c);
    hbAnalyze(c.id);
    return say(`<b>${_hbRefH(K.ref)} · ${_hbE(K.name)}</b> — ${_hbE(i18t('hb_analyze_said'))}`, { noPaint: true });
  }
  if (r.act === 'noref') return say(_hbE(i18t('hb_no_ref', { ref: r.ref })), { noPaint: true });
  if (r.act === 'reset'){
    const keep = { watches: s.watches, chartWatches: s.chartWatches, saved: s.saved, seen: s.seen, seq: s.seq, undo: s.undo, undoSeq: s.undoSeq };
    Object.assign(s, hbFresh(), keep); hbSave(); hbLensOnMap();
    hbMount();
    return say(_hbE(i18t('hb_reset_said')), { noPaint: true });
  }
  if (r.act === 'boardsum'){ hbSetFace('board'); hbWhyAsk(HB_BOARD_KEY); return say(_hbE(i18t('hb_bs_busy')), { noPaint: true }); }
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
    const host = hbHost(); const el = host && host.querySelector(_hbPidSel(p.id)); if (el && host) hbShowCard(host, el, { lit: true });
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
    : HB_FIGS.some(f => f.k === k && f.days) ? (F.none ? i18t('hb_say_pay_none') : k === 'paygap' ? i18tn(F.gap < 0 ? 'hb_say_paygap_good' : F.gap > 0 ? 'hb_say_paygap_bad' : 'hb_say_paygap_even', F.n, { n: _hbN(F.n) }) : i18tn('hb_say_' + k, F.n, { n: _hbN(F.n) }))
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
/* SUGGESTIONS FROM WHAT THE CHART SHOWS (C7, 10 Oct 2026): over an open
   chart, the first suggestions are read off it — the group that holds most
   of it, the contracts in it ending soon, the same chart a year back — each
   worded so the board's own reader answers it (no model) */
const HB_SUG_SHARE = 0.35, HB_SUG_SOON = 90;
function hbDataSuggestions(key){
  const s = hbS(), out = [];
  try {
    const D = hbDigData(key, s.lens); if (!D || D.kind !== 'list') return out;
    const P = hbPlan(D), cs = hbWinCs(hbListOf(D.ids, s.lens), D); if (cs.length < 2) return out;
    if (P.split && P.split.by !== 'date' && P.split.by !== 'valueBand'){
      const money = P.measure === 'value' && hbMoneyOk(), gs = hbGroupsOf(cs, P.split.by, money), tot = gs.reduce((a, g) => a + (money ? g.v : g.n), 0);
      const top = gs[0]; if (top && gs.length > 1 && tot > 0 && (money ? top.v : top.n) / tot >= HB_SUG_SHARE)
        out.push(i18t('hb_sug_only', { who: top.label, p: _hbN(Math.round((money ? top.v : top.n) / tot * 100)) }));
    }
    const soon = cs.filter(c => { const e = hbEndOf(c); if (!e || c.status !== 'Signed') return false; const d = hbDaysTo(e); return d >= 0 && d <= HB_SUG_SOON; }).length;
    if (soon) out.push(i18tn('hb_sug_soon', soon, { n: _hbN(soon) }));
    if (P.split && P.split.by === 'date' && !P.compare && P.measure !== 'live') out.push(i18t('hb_sug_cmp'));
  } catch (_){}
  return out.slice(0, 2);
}
function hbSuggestions(){
  const s = hbS(); if (s.face !== 'board') return null;
  const open = hbOpenListKey(); const data = open ? hbDataSuggestions(open) : [];
  /* WHAT NEEDS ME LEADS while anything does (Jambo's note, 15 Oct 2026) — the
     word "needs me" brings the card's whole list up (CA_GO.needs) */
  const lead = hbNeedsCount() ? [i18t('hb_ny_chip')] : [];
  if (data.length) return lead.concat(data, hbSuggestions0(s)).slice(0, 3);
  return lead.concat(hbSuggestions0(s)).slice(0, 3);
}
function hbSuggestions0(s){
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
  const charts = hbChartWatchAlerts(s);
  if (!s.watches || !s.watches.length) return charts;
  const d = hbBookData('all', { whole: true });
  return s.watches.filter(w => { const v = hbFigNumber(d, w.k); return w.dir === 'above' ? v > w.n : v < w.n; }).map(w => {
    const v = hbFigNumber(d, w.k);
    return { k: w.k, text: i18t('hb_watch_alert', { what: i18t('hb_f_' + w.k), now: w.k === 'value' ? _hbM(v) : _hbN(v), dir: i18t('hb_watch_' + w.dir), n: w.k === 'value' ? _hbM(w.n) : _hbN(w.n) }),
      go: () => { if (typeof setView === 'function'){ const st = hbS(); st.face = 'board'; st.path = ['f:' + w.k]; hbSave(); setView('dashboard'); } } };
  }).concat(charts);
}
/* a chart's watch (A9): read over the chart's own list, a row in the bell when crossed */
function hbChartWatchAlerts(s){
  return (s.chartWatches || []).filter(hbChartWatchFired).map(w => ({ k: 'chart', text: i18t('hb_watch_alert', { what: w.title || w.key, now: _hbN(hbChartWatchNow(w.key)), dir: i18t('hb_watch_' + w.dir), n: _hbN(w.n) }),
    go: () => { if (typeof setView === 'function'){ const st = hbS(); st.face = 'board'; st.path = [w.key]; hbSave(); setView('dashboard'); } } }));
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
  return { received: (_hbGifts.received || []).filter(g => g && ((g.kind === 'view' && g.spec && /^(q|cd|ls):/.test(String(g.spec.key || ''))) || HB_KINDS[g.kind] || hbCvGiftValid(g) || (/^sy_/.test(g.kind) && HB_STORIES.includes(g.kind.slice(3)) && !!hbStoryGiftHtml(g)))), sent };
}
function hbGiftsLoad(force){
  if (typeof API_MODE !== 'function' || !API_MODE() || typeof api !== 'function') return;
  /* A REFUSAL IS NOT AN ANSWER (13 Oct 2026): a read sent in the instant
     before sign-in finished was refused, yet stamped the minute's throttle
     first — so the Home that sign-in then drew skipped its read and a
     colleague's gift stayed away for a minute. The minute now starts only from
     an answer; one read at a time, and a read asked for while one is on its
     way runs once that one ends (`again`), so a refused first read is retried. */
  if (_hbGifts.busy){ _hbGifts.again = true; return; }
  if (!force && Date.now() - _hbGifts.at < 60000) return;
  _hbGifts.busy = true; _hbGifts.again = false;   /* raised before the promise exists */
  try { _hbGifts.me = (window.REMOTE && REMOTE.me && REMOTE.me.id) || null; } catch (_) { _hbGifts.me = null; }
  api('home/gifts').then(r => {
    if (!r) return;
    _hbGifts.at = Date.now();
    const before = JSON.stringify([_hbGifts.received, _hbGifts.sent]);
    _hbGifts.received = Array.isArray(r.received) ? r.received : [];
    _hbGifts.sent = Array.isArray(r.sent) ? r.sent : [];
    /* SEEN IS SAID WHEN IT IS DRAWN, once per panel, on the reader's own
       Board (hbGiftsSeenSay, from the paint) — never by this read, which the
       bell makes on any page (stage 4, 14 Oct 2026) */
    if (JSON.stringify([_hbGifts.received, _hbGifts.sent]) !== before){
      if (state.view === 'dashboard' && hbS().face === 'board') hbPaintBoard();
      hbAlertsChanged();
    }
  }).catch(() => {}).then(() => { _hbGifts.busy = false; if (_hbGifts.again){ _hbGifts.again = false; hbGiftsLoad(); } });
}
/* ONCE PER PERSON WHO IS SIGNED IN: the board's paint asks for the gifts when
   the last read was sent for nobody (before sign-in finished) or for someone
   else — sign-in then draws the board and the colleague's gift arrives at once.
   A read that fails for the signed-in person is not retried by painting. */
function hbGiftsKeep(){
  let me = null; try { me = (window.REMOTE && REMOTE.me && REMOTE.me.id) || null; } catch (_) {}
  if (me && _hbGifts.me !== me) hbGiftsLoad(true);
}
async function hbGive(pid, to, note){
  /* a story is given by its name (sy_<topic>), like a panel */
  const story = /^sy:/.test(String(pid)) && hbStoryValid(String(pid).slice(3)) ? String(pid).slice(3) : null;
  const p = story ? { kind: 'sy_' + hbStoryId(story).topic, split: false } : hbS().panels.find(x => x.id === pid); if (!p) return;
  if (typeof API_MODE !== 'function' || !API_MODE()){ if (typeof toast === 'function') toast(i18t('hb_give_local'), 'warn'); return; }
  try {
    const spec = p.kind === 'view' ? { key: p.key, title: hbPanelWord(p), recipe: (hbS().recipe || {})[p.key] || p.recipe || null } : undefined;
    const r = await api('home/gifts', 'POST', { to, kind: p.kind, split: !!p.split, lens: hbS().lens, note: String(note || '').slice(0, 500), pid, spec });
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
  hbVeilPaint();
  const pg = hbPage(); if (pg){ pg.classList.toggle('hb-presenting', _hbPresenting); pg.classList.toggle('hb-pointing', _hbTool === 'pointer'); }
}
/* ---- THE POINTER ONLY POINTS, UNTIL YOU EXIT IT (Young, 7 Oct 2026: "When
   you choose pointer, it seizes to become a cursor and only works as a
   pointer and therefore across the screens. You can then exit pointer to get
   back to cursor mode") — REVERSING 6 Oct's "turn into a mouse when hovering
   over a button" ----
   With Pointer on, ONE layer lies over the whole screen (#hb-veil, fixed,
   inset 0): it wears no cursor and takes every press, so nothing under it can
   be opened by accident, on the Board or on Explorer alike. It carries the red
   dot and its trail (#hb-laser, #hb-laser-1..3, drawn at the mouse in screen
   coordinates) and the ONE thing that still takes a press: "Exit pointer"
   (data-hb-tool="pointer", the same toggle as the Pointer button). Escape
   exits too (hbOnKey). The layer lives in the full-screen host (#content), so
   it survives Board ⇄ Explorer like the presentation does. hbPointerHandAt,
   .hb-cur-chain and HB_CUR_CONTROL are STALE. */
function hbVeilHost(){ return document.fullscreenElement || document.getElementById('content') || hbPage() || document.body; }
function hbVeilPaint(){
  if (typeof document === 'undefined') return;
  let v = document.getElementById('hb-veil');
  if (_hbTool !== 'pointer'){ if (v) v.remove(); _hbTrail = []; return; }
  const host = hbVeilHost(); if (!host) return;
  if (!v){
    v = document.createElement('div'); v.id = 'hb-veil'; v.className = 'hb-veil';
    v.innerHTML = `<div id="hb-laser" class="hb-laser" hidden></div><div id="hb-laser-1" class="hb-laser is-trail" hidden></div><div id="hb-laser-2" class="hb-laser is-trail" hidden></div><div id="hb-laser-3" class="hb-laser is-trail" hidden></div>`
      + `<button type="button" class="hb-veil-exit" data-hb-tool="pointer" title="${_hbE(i18t('hb_pointer_exit_tip'))}">${_hbE(i18t('hb_pointer_exit'))}</button>`;
  }
  if (v.parentElement !== host) host.appendChild(v);
  /* the dot stands where the mouse last was, or waits for it */
  const lz = document.getElementById('hb-laser'); if (lz && _hbLastXY) { lz.style.transform = `translate(${_hbLastXY[0]}px,${_hbLastXY[1]}px)`; lz.hidden = false; }
}
let _hbLastXY = null;
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
  /* THE POINTER WAITS FOR ITS BUTTON (Young, 6 Oct 2026): Present opens with
     the ordinary cursor; Pointer turns the laser on */
  /* FULL SCREEN BELONGS TO THE PAGE'S HOST, NOT THE PAGE (Young, 7 Oct 2026:
     "when you move from board to explorer or the other way round, you should
     stay in presentation mode unless you choose to exit"). Turning to the other
     side redraws the page, and a full-screen element that is thrown away ends
     full screen by itself — which the listener below then read as the reader
     leaving. #content survives the redraw, so the presentation does too. */
  const fsHost = document.getElementById('content') || pg;
  /* full screen is granted later: a Present ended before it arrives leaves it again,
     or #content would stay over the bar with nothing to take it down */
  if (on){ _hbTool = ''; if (fsHost && fsHost.requestFullscreen) fsHost.requestFullscreen().then(() => { if (!_hbPresenting && document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); }).catch(() => {}); }
  else { _hbTool = ''; hbInkClear(); if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {}); }
  hbToolsPaint();
  if (typeof igSyncDockWidth === 'function') setTimeout(() => { try { if (typeof igFitSplit === 'function') igFitSplit(); } catch (_){} }, 60);
}

/* ============================================================
   THE CONTRACT'S VIEWS ON THE BOARD (the one-page Home plan, stage 4,
   docs/PLAN-one-page-home.md; the owner picked "Views" by name on 14 Oct
   2026, with all three recommendations: Share gives a view to colleagues
   inside HaTi only; Download is one file per view that looks like its
   print; every door from outside lands here — the Negotiate page's Deal
   board tab and the room's Obligations and History tabs stay until stage 5,
   and Jambo's Obligations tab stays beside the paper for working)
   ============================================================
   ONE SWITCH AT THE BOARD'S TOP: Your book · Deal board · Obligations ·
   History, the last three for the contract on the paper (pdContract — the
   one fact both faces read), drawn only while one is there. One view at a
   time at the Board's full width, Print · Share · Download on the same line.
   EACH VIEW IS THE ROOM'S OWN BUILDER IN A SECOND HOST — dealBoardHtml (its
   presses find their host, rlBoardHostOf), roomPaintObligations and
   roomPaintHistory — so the Board, the room and the Negotiate page can never
   disagree. Its body is painted by its own painter (hbCvPaint) and the
   Board's morph leaves it alone (data-hb-own). Per sitting; a refresh keeps
   it (hbPlace). The number on a switch is the list's own: the deal board's
   "Needs you" (dealBoardFacts) and the tab's overdue (obtRowsOf/obtPass). */
const HB_CVIEWS = ['book', 'deal', 'oblig', 'hist'];
const HB_CV_WORD = { book: 'hb_book', deal: 'ng_board', oblig: 'tab_obligations', hist: 'tab_history' };
/* the phone draws the room: a view's own tab there */
const HB_CV_ROOM_TAB = { deal: 'redline', oblig: 'oblig', hist: 'history' };
let _hbCvShare = false;
function hbCvContract(){ try { return (typeof window.pdContract === 'function') ? pdContract() : null; } catch (_){ return null; } }
/* the view shown: a contract's view only while that contract is the paper's */
function hbCvNow(){
  const c = hbCvContract();
  if (!c) return { v: 'book', c: null };
  return { v: (_hbCv.id === String(c.id) && HB_CVIEWS.includes(_hbCv.v)) ? _hbCv.v : 'book', c };
}
function hbCvSet(v, id){ _hbCv = { v: HB_CVIEWS.includes(v) ? v : 'book', id: id == null ? null : String(id) }; _hbCvShare = false; }
/* THE OBLIGATIONS COUNT IS THE ROOM TAB'S (stage 5: the tab went home to
   this view, and its number with it): what is still owed and can be worked
   on (obligationTabState — the count the room's Obligations tab carried),
   coloured late only when one of them is overdue, the sidebar counts' rule */
function hbCvCounts(c){
  const n = { deal: 0, oblig: 0, obligLate: false };
  try { if (typeof window.dealBoardFacts === 'function') n.deal = dealBoardFacts(c, 'owner').n.you; } catch (_){}
  try { if (typeof window.obligationTabState === 'function'){ const st = obligationTabState(c); n.oblig = st.open; n.obligLate = st.overdue > 0; } } catch (_){}
  return n;
}
/* the history reads the trail, which the light list leaves out: until the
   whole record is here its Print, Share and Download say so, greyed */
function hbCvReady(now){
  return !(now.v === 'hist' && now.c && typeof API_MODE === 'function' && API_MODE() && now.c._light && !now.c._loaded);
}
function hbCvSwitchHtml(now){
  const c = now.c; if (!c) return '';
  const n = hbCvCounts(c);
  const ic = k => (typeof icon === 'function') ? icon(k, 'hb-cv-ic', 2) : '';
  const tab = v => { const k = v === 'deal' ? n.deal : v === 'oblig' ? n.oblig : 0;
    const tone = v === 'oblig' ? (n.obligLate ? ' is-late' : '') : ' is-owed';
    return `<button type="button" role="tab" data-hb-cv="${v}" aria-selected="${now.v === v}">${_hbE(i18t(HB_CV_WORD[v]))}${k ? `<span class="hb-cv-n${tone}">${k}</span>` : ''}</button>`; };
  const ready = hbCvReady(now), wait = ready ? '' : ` disabled title="${_hbE(i18t('hb_cv_reading'))}"`;
  const act = (k, word, tip, extra) => `<button type="button" class="hb-btn" data-hb-cv-act="${k}"${ready ? ` title="${_hbE(i18t(tip))}"` : wait}${extra || ''}>${ic(k === 'down' ? 'download' : k === 'print' ? 'printer' : 'share')}${_hbE(i18t(word))}</button>`;
  const acts = now.v === 'book' ? '' : `<span class="hb-cv-acts">${act('print', 'hb_cv_print', 'hb_cv_print_tip')}<span class="hb-cv-share-w">${act('share', 'act_share', 'hb_cv_share_tip', ` aria-haspopup="dialog" aria-expanded="${_hbCvShare}"`)}${_hbCvShare && ready ? hbCvShareFormHtml(now) : ''}</span>${act('down', 'act_download', 'hb_cv_down_tip')}</span>`;
  const ref = (typeof window.refHtml === 'function') ? refHtml(c) : _hbE((typeof contractRef === 'function') ? contractRef(c) : c.id);
  return `<div class="hb-cv-bar" id="hb-cv-bar"><div class="hb-seg hb-cv-seg" role="tablist" aria-label="${_hbE(i18t('hb_cv_label'))}">${HB_CVIEWS.map(tab).join('')}</div>
    <span class="hb-cv-for">${_hbE(i18t('hb_cv_for'))} ${ref}${c.counterparty ? ` · ${_hbE(c.counterparty)}` : ''}</span><span class="hb-grow"></span>${acts}</div>`;
}
function hbCvBodyHtml(now){
  const id = _hbE(String(now.c.id));
  return `<div class="hb-cv-body hb-cv-${now.v}" id="hb-cv-body" data-hb-own data-hb-cv="${now.v}" data-hb-cv-cid="${id}"${now.v === 'deal' ? ` data-db-host="${id}"` : ''}></div>`;
}
/* THE VIEW'S OWN PAINTER: the room's builder into the Board's host, and only
   when what it would draw has changed — the Board repaints on many presses,
   and a search half-typed in the history or a row chosen in the list stays. */
let _hbCvAsked = null, _hbCvFail = null;
function hbCvPaint(force){
  const host = document.getElementById('hb-cv-body'); if (!host) return;
  const v = host.getAttribute('data-hb-cv');
  const c = (typeof getContract === 'function') ? getContract(host.getAttribute('data-hb-cv-cid')) : null;
  if (!c) return;
  if (v === 'deal'){
    if (typeof window.dealBoardHtml !== 'function') return;
    /* the board's own sheet, which only the Negotiate page had asked for */
    if (typeof window.redlineLayoutCss === 'function') try { redlineLayoutCss(); } catch (_){}
    const html = dealBoardHtml(c, 'owner');
    if (!force && host._dbHtml === html) return;
    const keep = ['#db-list', '#db-pane'].map(s => { const el = host.querySelector(s); return el ? el.scrollTop : 0; });
    host.innerHTML = html; host._dbHtml = html;
    ['#db-list', '#db-pane'].forEach((s, i) => { const el = host.querySelector(s); if (el && keep[i]) el.scrollTop = keep[i]; });
    return;
  }
  if (v === 'oblig'){
    if (typeof window.roomPaintObligations !== 'function') return;
    let sig = '';
    try { sig = JSON.stringify([c.obligations || [], c.obReview || null, typeof obtView === 'function' ? obtView(c.id) : '', typeof insFits === 'function' ? insFits() : '', typeof langId === 'function' ? langId() : '']); } catch (_){ sig = String(Math.random()); }
    if (!force && host._obSig === sig) return;
    host._obSig = sig;
    roomPaintObligations(c, host);
    return;
  }
  if (v === 'hist'){
    if (typeof window.roomPaintHistory !== 'function' || typeof window.roomHistoryHtml !== 'function') return;
    if (!hbCvReady({ v, c })){
      /* a read that failed says so, with its way forward — never a ring that turns for ever */
      if (_hbCvFail === String(c.id)){
        host.innerHTML = `<p class="hb-cv-wait">${_hbE(i18t('hb_cv_read_fail'))} <button type="button" class="hb-btn" data-hb-cv-again>${_hbE(i18t('act_retry'))}</button></p>`;
        return;
      }
      /* the whole record first, once per contract; the trail is drawn when it lands */
      if (!host.querySelector('.ob-spin')) host.innerHTML = `<p class="hb-cv-wait">${typeof busyHtml === 'function' ? busyHtml(i18t('hb_cv_reading')) : _hbE(i18t('hb_cv_reading'))}</p>`;
      if (_hbCvAsked !== String(c.id) && typeof window.ensureFull === 'function'){
        const id = String(c.id); _hbCvAsked = id;
        Promise.resolve(ensureFull(c)).then(() => { _hbCvFail = null; }, () => { _hbCvFail = id; _hbCvAsked = null; })
          .then(() => { if (window.state && state.view === 'dashboard' && hbS().face === 'board') hbPaintBoard(); });
      }
      return;
    }
    const f = host._histF || {};
    if (!force && host._histHtml === roomHistoryHtml(c, f, { board: true })) return;
    const top = host.scrollTop;
    roomPaintHistory(c, f, host);
    host.scrollTop = top;
  }
}
/* THE ONE DOOR FROM OUTSIDE: the contract goes on the paper (igPaperHold, the
   page does not turn) and the Board turns to that view. Below the phone line
   Home draws no Board: the room's own tab. */
function hbOpenView(id, v){
  const c = (typeof getContract === 'function') ? getContract(id) : null;
  if (!c || !HB_CVIEWS.includes(v) || v === 'book') return false;
  const phone = typeof window !== 'undefined' && window.innerWidth && window.innerWidth < 768;
  if (phone || typeof window.igPaperHold !== 'function'){
    if (typeof openWorkspace === 'function') openWorkspace(c.id);
    if (typeof roomGoTab === 'function') try { roomGoTab(getContract(c.id) || c, HB_CV_ROOM_TAB[v]); } catch (_){}
    return true;
  }
  /* EVERY OLD DOOR LANDS ON ITS BETTER HOME (owner, 15 Oct 2026): the
     obligations on Jambo's own Obligations tab beside the paper; the history
     and where the deal stands on the contract's strip on the Board */
  /* Obligations: the Obligations page narrowed to this contract (owner, 15 Oct 2026, "Obligations page, filtered") */
  if (v === 'oblig' && typeof window.obOpenOnPage === 'function') return obOpenOnPage(c.id);
  if (v === 'oblig' && typeof window.pdOpenOnHome === 'function') return pdOpenOnHome(c.id, 'oblig');
  if (typeof window.hbStripBring === 'function' && hbStripBring(c.id, v === 'hist' ? 'hist' : 'where')) return true;
  if (typeof openWorkspace === 'function') openWorkspace(c.id);
  return true;
}
function hbCvPick(v){
  const now = hbCvNow(); if (!now.c || !HB_CVIEWS.includes(v)) return;
  hbCvSet(v, now.c.id);
  hbPaintBoard();
}
/* PRINT AND DOWNLOAD ARE ONE PAGE: the history's own report (its export and
   its print, unchanged), and for the other two the page each view makes of
   itself (dealBoardReportHtml, obReportHtml) — printed through the one print
   runner (printWindowRun), saved through the one saver (downloadFile). */
function hbCvReportOf(v){ return v === 'deal' ? window.dealBoardReportHtml : v === 'oblig' ? window.obReportHtml : null; }
function hbCvPrint(){
  const now = hbCvNow(); if (!now.c || now.v === 'book' || !hbCvReady(now)) return;
  if (now.v === 'hist'){ if (typeof window.negoHistoryPrintRun === 'function') negoHistoryPrintRun(now.c); return; }
  const build = hbCvReportOf(now.v);
  if (typeof build === 'function' && typeof window.printWindowRun === 'function') printWindowRun(() => build(now.c), 'hb_cv_print_fail');
}
function hbCvDownload(){
  const now = hbCvNow(); if (!now.c || now.v === 'book' || !hbCvReady(now)) return;
  if (now.v === 'hist'){ if (typeof window.negoHistoryExportRun === 'function') negoHistoryExportRun(now.c); return; }
  const build = hbCvReportOf(now.v); if (typeof build !== 'function' || typeof window.downloadFile !== 'function') return;
  const ref = (typeof contractRef === 'function') ? contractRef(now.c) : now.c.id;
  downloadFile(`${ref}-${now.v === 'deal' ? 'deal-board' : 'obligations'}.html`, build(now.c), 'text/html');
  if (typeof toast === 'function') toast(i18t('hb_cv_saved', { what: i18t(HB_CV_WORD[now.v]), ref }), 'ok');
}
/* SHARE: COLLEAGUES INSIDE HaTi ONLY (decision 1). The view is given by its
   NAME — which view, which contract — as a Board card is given (hbGive):
   never a figure; the colleague's own Home draws it from what they may see,
   and the server refuses a colleague who cannot open the contract. */
function hbCvShareFormHtml(now){
  const me = typeof currentUser === 'function' ? currentUser() : null;
  const people = (typeof getUsers === 'function' ? (getUsers() || []) : []).filter(u => u && u.id && (!me || u.id !== me.id));
  const ref = (typeof contractRef === 'function') ? contractRef(now.c) : now.c.id;
  const head = `<div class="hb-cv-sh-h"><b>${_hbE(i18t(HB_CV_WORD[now.v]) + ' · ' + ref)}</b><button type="button" class="hb-ib" data-hb-cv-act="share" title="${_hbE(i18t('hb_cancel'))}" aria-label="${_hbE(i18t('hb_cancel'))}">${_hbX}</button></div>`;
  if (!people.length) return `<div class="hb-cv-share" role="dialog" aria-label="${_hbE(i18t('act_share'))}">${head}<p class="hb-quiet">${_hbE(i18t('hb_give_nobody'))}</p></div>`;
  return `<form class="hb-cv-share" data-hb-cv-give role="dialog" aria-label="${_hbE(i18t('act_share'))}">${head}
    <label class="hb-cv-sh-l"><span>${_hbE(i18t('hb_give_to'))}</span><select name="to">${people.map(u => `<option value="${_hbE(u.id)}">${_hbE(u.name || u.email || u.id)}</option>`).join('')}</select></label>
    <label class="hb-cv-sh-l"><span>${_hbE(i18t('hb_cv_note_l'))}</span><textarea name="note" rows="2" maxlength="500" placeholder="${_hbE(i18t('hb_give_note_ph'))}"></textarea></label>
    <p class="hb-quiet">${_hbE(i18t('hb_cv_share_note', { them: String(now.c.counterparty || '').trim() || i18t('hb_cv_them_none') }))}</p>
    <div class="hb-cv-sh-f"><button type="submit" class="hb-btn is-primary">${_hbE(i18t('hb_give_go'))}</button><button type="button" class="hb-btn" data-hb-cv-act="share">${_hbE(i18t('hb_cancel'))}</button></div></form>`;
}
async function hbCvGive(f){
  const now = hbCvNow(); if (!now.c || now.v === 'book' || !f) return;
  if (typeof API_MODE !== 'function' || !API_MODE()){ if (typeof toast === 'function') toast(i18t('hb_give_local'), 'warn'); return; }
  try {
    const r = await api('home/gifts', 'POST', { to: f.to.value, kind: 'cv', note: String(f.note.value || '').slice(0, 500), spec: { v: now.v, cid: String(now.c.id) } });
    if (r && r.gift) _hbGifts.sent.unshift(r.gift);
    _hbCvShare = false; hbPaintBoard();
    if (typeof toast === 'function') toast(i18t('hb_given_toast', { who: (r && r.gift && r.gift.toName) || '' }), 'ok');
  } catch (e){ if (typeof toast === 'function') toast(e.message || String(e), 'err'); }
}
/* A VIEW GIVEN TO YOU: a card on your Board with the note, and a row in your
   bell until it is seen (drawn on your Board, or opened from the bell). */
function hbCvGiftValid(g){ return !!(g && g.kind === 'cv' && g.spec && HB_CVIEWS.includes(g.spec.v) && g.spec.v !== 'book' && g.spec.cid); }
function hbCvGiftHtml(g){
  if (!hbCvGiftValid(g)) return '';
  const c = (typeof getContract === 'function') ? getContract(g.spec.cid) : null;
  const ref = c ? ((typeof contractRef === 'function') ? contractRef(c) : c.id) : '';
  return `<section class="hb-card hb-panel" data-hb-pid="${_hbE('gift:' + g.id)}"><header class="hb-ch"><span class="hb-ct">${_hbE(i18t(HB_CV_WORD[g.spec.v]) + (ref ? ' · ' + ref : ''))}</span>
    <span class="hb-given is-from" title="${_hbE(g.note || '')}">${_hbE(i18t('hb_from', { who: g.fromName || '' }))}</span><span class="hb-grow"></span>
    <button type="button" class="hb-ib" data-hb-act="x" title="${_hbE(i18t('hb_sy_gift_away'))}" aria-label="${_hbE(i18t('hb_sy_gift_away'))}">${_hbX}</button></header>
    <div class="hb-cb">${c ? `<p class="hb-quiet">${_hbE([c.name || '', c.counterparty || ''].filter(Boolean).join(' · '))}</p>` : ''}${g.note ? `<p class="hb-sy-note">${_hbE(g.note)}</p>` : ''}
    ${c ? `<button type="button" class="hb-btn is-primary" data-hb-cv-gift="${_hbE(g.id)}">${_hbE(i18t('act_open'))}</button>` : `<p class="hb-quiet">${_hbE(i18t('hb_cv_gift_gone'))}</p>`}</div></section>`;
}
function hbGiftSeen(g){
  if (!g || g.seenAt) return;
  g.seenAt = new Date().toISOString();
  if (typeof api === 'function') api('home/gifts/' + encodeURIComponent(g.id) + '/seen', 'POST', {}).catch(() => {});
  hbAlertsChanged();
}
function hbCvGiftOpen(id){
  const g = (_hbGifts.received || []).find(x => x && x.id === id);
  if (!hbCvGiftValid(g)) return false;
  hbGiftSeen(g);
  return hbOpenView(g.spec.cid, g.spec.v);
}
/* SEEN IS SAID WHEN IT IS DRAWN, on the reader's own Board (the gift card's
   own rule, now kept to the letter: a read made for the bell on another page
   draws nothing, so it says nothing) */
function hbGiftsSeenSay(){
  if (!(window.state && state.view === 'dashboard' && hbS().face === 'board' && hbCvNow().v === 'book')) return;
  hbGiftsFor().received.filter(g => !g.seenAt).forEach(hbGiftSeen);
}
/* THE BELL'S ROWS: a view given to this reader and not yet seen. Reading the
   bell asks for the gifts at most once a minute (hbGiftsLoad); nothing is
   written by reading. */
function hbGiftAlerts(){
  try { if (window.REMOTE && REMOTE.me) hbGiftsLoad(); } catch (_){}
  return (_hbGifts.received || []).filter(g => hbCvGiftValid(g) && !g.seenAt).map(g => {
    const c = (typeof getContract === 'function') ? getContract(g.spec.cid) : null; if (!c) return null;
    const ref = (typeof contractRef === 'function') ? contractRef(c) : c.id;
    return { c, text: i18t('hb_cv_gift_bell', { who: g.fromName || '', what: i18t(HB_CV_WORD[g.spec.v]), ref }), go: () => hbCvGiftOpen(g.id) };
  }).filter(Boolean);
}

/* ---------------- WHERE YOU WERE ----------------
   The place store's pair for Home (PLACE_PARTS.dashboard): the side of the
   screen and the dig-in come back on a refresh — the board itself is already
   this person's own record — and on the map, the map's own recipe. */
function hbPlace(){
  const s = hbS(); const p = { face: s.face, path: (s.path || []).slice() };
  if (s.face === 'explorer' && typeof igRecipeNow === 'function'){ try { p.recipe = igRecipeNow(); p.cam = intel.cam ? { ...intel.cam, w: intel.cam.w.slice() } : null; } catch (_){} }
  /* the Calendar tab keeps its month, week and view across a refresh */
  if (s.face === 'calendar' && typeof window.calPlace === 'function'){ try { p.cal = calPlace(); } catch (_){} }
  /* the Document tab keeps its contract and its panel tab (11 Oct 2026: the
     contract's own Document tab is gone, so this is where a refresh lands) */
  if (s.face === 'paper' && typeof window.pdContract === 'function'){ try { const c = pdContract(); if (c){ p.paper = { id: String(c.id), tab: typeof pdTab === 'function' ? pdTab() : '' };
    /* and the Clauses list's colour filter (BUGLOG 11 Oct 2026) */
    const tones = typeof window.docThreadTonesNow === 'function' ? docThreadTonesNow(c.id) : []; if (tones.length) p.paper.tones = tones;
    /* and the face of Jambo's tab that was open beside it — Fill in,
       Redlines, Before you sign (stage 5: the pages a refresh used to land
       back on are these faces now) */
    const face = typeof window.pdFaceNow === 'function' ? pdFaceNow() : ''; if (face) p.paper.face = face; } } catch (_){} }
  /* the Board keeps Needs you's tab, kind and find words (Round A) */
  if (s.face === 'board' && typeof window.ndPlace === 'function'){ try { p.nd = ndPlace(); } catch (_){} }
  /* the Board keeps a contract's view and its contract (stage 4, 14 Oct 2026) */
  /* with nothing chosen, the Contracts place keeps its view, tab, filters and
     set (13 Oct 2026; the register's own state since step 7) */
  if (s.face === 'paper' && !p.paper && typeof window.igWallPlace === 'function'){ try { p.wall = igWallPlace(); } catch (_){} }
  /* and with a paper open, the place's Wall | List under it (20 Oct 2026: the
     place lands on the List, so a reader's Wall is kept across a refresh) */
  if (s.face === 'paper' && p.paper && window.state && state.reg && state.reg.show) p.show = state.reg.show;
  return p;
}
const HB_RESUME_HAND = ['pointerdown', 'keydown', 'wheel', 'touchstart'], HB_RESUME_HAND_MS = 20000;
function hbPlacePut(p){
  if (!p) return;
  const s = hbS();
  if (HB_FACES.includes(p.face)) s.face = p.face;
  if (Array.isArray(p.path)) s.path = p.path.filter(k => typeof k === 'string').slice(-HB_PATH_MAX);
  hbSave();
  if (p.recipe && typeof igRecipeSet === 'function'){ try { igRecipeSet(p.recipe); } catch (_){} }
  if (p.cam && Array.isArray(p.cam.w) && window.intel && typeof IGB_NV !== 'undefined' && p.cam.w.length === IGB_NV) intel.cam = { ...p.cam, w: p.cam.w.slice() };
  if (p.cal && typeof window.calPlacePut === 'function'){ try { calPlacePut(p.cal); } catch (_){} }
  if (p.nd && typeof window.ndPlacePut === 'function'){ try { ndPlacePut(p.nd); } catch (_){} }
  if (p.wall && typeof window.igWallPlacePut === 'function'){ try { igWallPlacePut(p.wall); } catch (_){} }
  if (!p.wall && (p.show === 'wall' || p.show === 'list') && typeof window.regPlaceSet === 'function'){ try { regPlaceSet({ show: p.show }); } catch (_){} }
  /* a contract's view saved before 15 Oct 2026 (p.cv) is dropped: the views are gone */
  /* the contract goes back on the Document face once the list holds it,
     through the one door (igWalk), bounded; a contract chosen meanwhile wins */
  if (p.paper && p.paper.id && p.face === 'paper'){
    const want = p.paper; let n = 0;
    if (want.tab && typeof window.pdSetTab === 'function') pdSetTab(want.tab);
    if (Array.isArray(want.tones) && typeof window.docThreadKeepTones === 'function') docThreadKeepTones(want.id, want.tones);
    /* THE READER'S HAND WINS (owner, 16 Oct 2026): until the paper is back, a
       press, a key or a scroll is the reader choosing again — the put-back
       gives up, and a read still out puts nothing up (igOpenNewer), the way
       placeScrollBack lets go of the scroll. */
    let gaveUp = false;
    const unhand = () => HB_RESUME_HAND.forEach(k => window.removeEventListener(k, hand, true));
    const hand = () => { unhand(); if (window.intel && intel.paper) return; gaveUp = true; if (typeof window.igOpenNewer === 'function') igOpenNewer(); };
    HB_RESUME_HAND.forEach(k => window.addEventListener(k, hand, { capture: true, passive: true }));
    setTimeout(unhand, HB_RESUME_HAND_MS);
    const go = () => {
      if (gaveUp) return;
      if (!(window.state && state.view === 'dashboard' && hbS().face === 'paper') || (window.intel && intel.paper)) return;
      if (typeof getContract === 'function' && getContract(want.id) && typeof window.igWalk === 'function'){
        /* the face through its own door (pdOpenOnHome), which puts the
           contract on the paper the same way */
        if (want.face && window.PD_FACE_WORDS && PD_FACE_WORDS.includes(want.face) && typeof window.pdOpenOnHome === 'function'){ pdOpenOnHome(want.id, want.face); return; }
        igWalk([want.id], 0, { tab: want.tab || undefined }); return; }
      if (++n < 60) setTimeout(go, 150);
    };
    setTimeout(go, 0);
  }
}

/* ---------------- ONE LISTENER, armed once at load ----------------
   Every press on the board is delegated here, so a repaint never strands a
   listener and the board's inside can be replaced freely. Only Home's own
   attributes are read, and only while Home is the page. */
/* ---- REVIEW OPENS THE CONTRACT ON PAPER (Young, 8 Oct 2026, "Home first"):
   on a card whose work is about one contract at a time — approvals, renewals,
   late promises — Review opens that contract on the Paper with the desk on the
   tab that holds its act; several are walked with Previous / Next. The row
   itself still opens the agent's work below the card. */
const HB_REVIEW_ON_PAPER = { renew: 'facts', late: 'oblig', round: 'deal' };
function hbReviewOnPaper(k, cid){
  const tab = HB_REVIEW_ON_PAPER[k]; if (!tab || typeof agentsData !== 'function' || typeof igWalk !== 'function') return false;
  const ids = [];
  ((agentsData().agents[k] || {}).ready || []).forEach(it => { const id = it && (it.cid || (it.c && it.c.id)); if (id && !ids.includes(id)) ids.push(id); });
  if (!ids.length) return false;
  /* a row of one item starts the walk on its own contract */
  igWalk(ids, Math.max(0, cid ? ids.indexOf(cid) : 0), { title: i18t('ag_' + k), tab });
  return true;
}
function hbOnClick(e){
  if (!window.state || state.view !== 'dashboard') return;
  const t = e.target && e.target.closest ? e.target : null; if (!t) return;
  /* a press anywhere but the figure picker puts it away */
  if (_hbFigPick && !t.closest('.hb-figpick-w')){ _hbFigPick = false; hbPaintBoard(); }
  /* a door out of the side list (Open these, Show on the map) leaves it closed behind */
  if (_hbSheet && t.closest('.hb-sheet [data-hb-open], .hb-sheet [data-hb-map]')) _hbSheet = null;
  { const rp = t.closest('[data-hb-review-paper]');
    if (rp){ e.preventDefault(); e.stopPropagation(); if (!hbReviewOnPaper(rp.getAttribute('data-hb-review-paper'), rp.getAttribute('data-hb-review-cid'))) hbDig('ag:' + rp.getAttribute('data-hb-review-paper'), false, true); return; } }
  /* an open dropdown closes on a press anywhere else */
  if (_hbRcOpen && !t.closest('.hb-rwrap')){ _hbRcOpen = null; hbPaintBoard(); }
  if (_hbLinesOpen && !t.closest('.hb-lines-w')){ _hbLinesOpen = null; hbPaintBoard(); }
  if (_hbRdOpen && !t.closest('.hb-rd-wrap')){ _hbRdOpen = null; hbDockRepaint(); }
  if (_hbMoreMenu && !t.closest('.hb-more-w')){ _hbMoreMenu = null; hbPaintBoard(); }
  /* the card's ⋯: its own button opens and shuts it; any press elsewhere, or
     on one of its items, shuts it (the item's own handler still runs below) */
  { const dr = t.closest('[data-hb-drawn]');
    if (dr){ const k = dr.getAttribute('data-hb-drawn'); _hbDrawnOpen = _hbDrawnOpen === k ? null : k; _hbToolsMenu = null; hbPaintBoard();
      /* a card low on the screen opens its panel upward (hbRcMenuPlace) */
      return; }
    if (_hbDrawnOpen && !t.closest('.hb-dp')){ _hbDrawnOpen = null; hbPaintBoard(); } }
  { const tm = t.closest('[data-hb-tools-more]');
    if (tm){ const k = tm.getAttribute('data-hb-tools-more'); _hbToolsMenu = _hbToolsMenu === k ? null : k; _hbDrawnOpen = null; hbPaintBoard();
      return; }
    if (_hbToolsMenu){ _hbToolsMenu = null; if (!t.closest('.hb-tools-menu')) hbPaintBoard(); } }
  const on = sel => t.closest(sel);
  let el;
  /* THE CONTRACT'S VIEWS (stage 4): the switch, the three acts on its line,
     and a given view's Open. The Share form shuts on its own button pressed
     again, on × and Cancel, on Esc, and on a press anywhere else. */
  if (_hbCvShare && !t.closest('.hb-cv-share-w')){ _hbCvShare = false; hbPaintBoard(); }
  if ((el = on('[data-hb-cv]'))){ hbCvPick(el.getAttribute('data-hb-cv')); return; }
  if ((el = on('[data-hb-cv-act]'))){ if (el.disabled) return; const k = el.getAttribute('data-hb-cv-act');
    if (k === 'share'){ _hbCvShare = !_hbCvShare; hbPaintBoard(); }
    else if (k === 'print') hbCvPrint();
    else if (k === 'down') hbCvDownload();
    return; }
  if ((el = on('[data-hb-cv-gift]'))){ hbCvGiftOpen(el.getAttribute('data-hb-cv-gift')); return; }
  if (on('[data-hb-cv-again]')){ _hbCvFail = null; hbCvPaint(true); return; }
  /* the hover card's own presses (G4): Ask about this fills the ask box; its
     door is the piece's own, pressed below, with the card taken down first */
  if (on('[data-hb-tip-ask]')){ e.preventDefault(); hbTipAsk(); return; }
  if (on('#hb-tip [data-hb-dig]')) hbTipHide(true);
  if (on('[data-hb-setup]')){ e.preventDefault(); hbSetupGo(); return; }
  if (on('[data-hb-chase-many]')){ e.preventDefault(); hbChaseManyRun(t.closest('[data-hb-chase-many-box]')); return; }
  if (on('[data-hb-chase-key]')){ setTimeout(() => hbChaseManyCount(t.closest('[data-hb-chase-many-box]')), 0); return; }
  if ((el = on('[data-hb-ag-look]'))){ e.stopPropagation(); hbAgLookToggle(el.getAttribute('data-hb-ag-look')); return; }
  if (on('[data-hb-ag-item]') && hbAgentWorkPress(t)){ e.stopPropagation(); return; }
  if ((el = on('[data-hb-face]'))){ hbSetFace(el.getAttribute('data-hb-face')); return; }
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
  if ((el = on('[data-hb-to-start]'))){ hbBackToStart(el.getAttribute('data-hb-to-start'), el.hasAttribute('data-hb-to-start-focus')); _hbRcOpen = null; _hbDrawnOpen = null; hbPaintBoard(); return; }
  if ((el = on('[data-hb-rset]'))){ if (el.disabled) return; const key = rkey(el), v = el.getAttribute('data-hb-rset'), i = v.indexOf(':');
    _hbRcOpen = null; if (key && i > 0) hbRecipeSet(key, v.slice(0, i), v.slice(i + 1)); hbPaintBoard(); return; }
  if ((el = on('[data-hb-rtrend]'))){ if (el.disabled) return; const s = hbS(), key = rkey(el);
    if (key){ const D = hbDigData(key, s.lens); if (D) hbRecipeSet(key, 'trend', !hbPlan(D).trend); } _hbRcOpen = null; hbPaintBoard(); return; }
  if (on('[data-hb-rinstead]')){ const s = hbS(), key = (s.path || []).slice(-1)[0];
    if (key){ hbRecipeSet(key, 'measure', 'count'); hbRecipeSet(key, 'split', 'd:m:signed'); hbRecipeSet(key, 'trend', true); } hbPaintBoard(); return; }
  if (on('[data-hb-digbig]')){ const s = hbS(); s.digBig = !s.digBig; hbSave(); hbPaintBoard(); return; }
  if (on('[data-hb-table]')){ const k = on('[data-hb-table]').getAttribute('data-hb-table'); if (_hbTableOn.has(k)) _hbTableOn.delete(k); else _hbTableOn.add(k); hbPaintBoard(); return; }
  if (on('[data-hb-full]')){ _hbFull = !_hbFull; hbPaintBoard(); return; }
  if ((el = on('[data-hb-fu-back]'))){ const k = el.getAttribute('data-hb-fu-back'), st = _hbFuSteps.get(k) || []; const ok = hbUndo(); if (ok){ st.pop(); _hbFuSteps.set(k, st); }
    hbPaintBoard(); if (typeof toast === 'function') toast(i18t(ok ? 'hb_undo_done' : 'hb_undo_none'), ok ? 'ok' : 'warn'); return; }
  if ((el = on('[data-hb-odd]'))){ const k = el.getAttribute('data-hb-odd'); if (_hbOddOn.has(k)) _hbOddOn.delete(k); else _hbOddOn.add(k); hbPaintBoard(); return; }
  if ((el = on('[data-hb-lines]'))){ const w = el.closest('[data-hb-lines-key]'), k = w && w.getAttribute('data-hb-lines-key'); _hbLinesOpen = _hbLinesOpen === k ? null : k; hbPaintBoard();
    if (_hbLinesOpen){ const f = document.getElementById('hb-ref-tgt-in'); if (f && f.closest('.hb-lines-menu')){ const b = f.closest('.hb-lines-menu').querySelector('button:not([disabled])'); if (b) try { b.focus({ preventScroll: true }); } catch (_){} } } return; }
  if ((el = on('[data-hb-line]'))){ if (el.disabled) return; const w = el.closest('[data-hb-lines-key]'), k = w && w.getAttribute('data-hb-lines-key'); const v = el.getAttribute('data-hb-line');
    if (k){ if (v === 'tgt-off') hbRefsSet(k, 'tgt', null); else hbRefsSet(k, v); } hbPaintBoard(); return; }
  if ((el = on('[data-hb-copy-img]'))){ hbCopyChartImage(el); hbPaintBoard(); return; }
  if ((el = on('[data-hb-saveq]'))){ hbMyqSave(el.getAttribute('data-hb-saveq')); return; }
  if (on('[data-hb-pack-dl]')){ hbPackMake(); return; }
  if ((el = on('[data-hb-sview]'))){ hbOpenSavedView(el.getAttribute('data-hb-sview')); return; }
  if ((el = on('[data-hb-whatif]'))){ hbWhatIfToggle(el.getAttribute('data-hb-whatif')); return; }
  if ((el = on('[data-hb-copy-tab]'))){ hbCopyChartTable(el); hbPaintBoard(); return; }
  /* a story's chapter opens as its own enlarged card; the trail leads back */
  if (on('[data-hb-sy-big]')){ const s = hbS(); s.digBig = true; hbDig(t.closest('[data-hb-sy-big]').getAttribute('data-hb-sy-big'), true); return; }
  if ((el = on('[data-hb-prep]'))){ const v = el.getAttribute('data-hb-prep'); if (HB_PREP.includes(v)){ hbS().prep = v; hbSave(); hbPaintBoard(); } return; }
  if ((el = on('[data-hb-watch-stop]'))){ const s = hbS(); s.watches.splice(Number(el.getAttribute('data-hb-watch-stop')), 1); hbSave(); hbAlertsChanged(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-watch]'))){ const k = el.getAttribute('data-hb-watch'); _hbWatchForm = _hbWatchForm === k ? null : k; hbPaintBoard(); return; }
  if (on('[data-hb-watch-cancel]')){ _hbWatchForm = null; hbPaintBoard(); return; }
  if ((el = on('[data-hb-cwatch-stop]'))){ const s = hbS(); (s.chartWatches || []).splice(Number(el.getAttribute('data-hb-cwatch-stop')), 1); hbSave(); hbAlertsChanged(); hbPaintBoard(); return; }
  if ((el = on('[data-hb-cwatch]'))){ const k = 'chart:' + el.getAttribute('data-hb-cwatch'); _hbToolsMenu = null; _hbWatchForm = _hbWatchForm === k ? null : k; hbPaintBoard(); return; }
  if ((el = on('[data-hb-pack-one]'))){ const c0 = el.closest('.hb-card'), pid = c0 && c0.getAttribute('data-hb-pid'); _hbToolsMenu = null; hbPaintBoard();
    const card = pid ? document.querySelector(`#hb-board [data-hb-pid="${CSS.escape(pid)}"]`) : document.querySelector('#hb-focus .hb-card'); if (card) hbPackMake([card]); return; }
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
  /* "Workspace" opens Home, never the room (the overnight work order, step 2;
     roomHomeLand, the one landing every Workspace door shares) */
  if ((el = on('[data-hb-room]'))){ const id = el.getAttribute('data-hb-room');
    if (!(window.roomHomeLand && roomHomeLand(id)) && typeof openWorkspace === 'function') openWorkspace(id); return; }
  if ((el = on('[data-hb-why]'))){ hbWhyAsk(el.getAttribute('data-hb-why')); return; }
  /* the Pulse board, the head's last button (29 Oct 2026) */
  if (on('[data-hb-pulse]')){ if (typeof pulseOpen === 'function') pulseOpen(); else setView('pulse'); return; }
  /* Explorer, beside it (29 Oct 2026): the same mover the face switch and the word use */
  if (on('[data-hb-explorer]')){ if (typeof caGo === 'function') caGo({ kind: 'go', place: 'explorer' }); else hbSetFace('explorer'); return; }
  /* ⋯ → What could explain this?: the card's reading opens where it stands and
     the same three-point answer is asked for (hbWhyAsk, the one door) */
  if ((el = on('[data-hb-howon]'))){ const k = el.getAttribute('data-hb-howon'); if (_hbHowOn.has(k)) _hbHowOn.delete(k); else _hbHowOn.add(k); hbPaintBoard(); return; }
  /* ⋯ → Full screen on a kept chart: it opens, filling the screen */
  if ((el = on('[data-hb-fullkey]'))){ hbDig(el.getAttribute('data-hb-fullkey')); _hbFull = true; hbPaintBoard(); return; }
  if ((el = on('[data-hb-dd-on]'))){ if (!el.disabled){ const k = el.getAttribute('data-hb-dd-on'); _hbToolsMenu = null; _hbReadOpen.add(k); hbPaintBoard(); hbWhyAsk(k); } return; }
  if ((el = on('[data-hb-dd-far]'))){ if (!el.disabled) hbDdOnPress(el.getAttribute('data-hb-dd-far')); return; }
  if ((el = on('[data-hb-deeper]'))){ if (!el.disabled){ _hbToolsMenu = null; hbDigDeeper(el.getAttribute('data-hb-deeper')); } return; }
  if ((el = on('[data-hb-sy-deeper]'))){ if (!el.disabled) hbStoryDeeper(el.getAttribute('data-hb-sy-deeper')); return; }
  if ((el = on('[data-hb-sy-stop]'))){ hbStoryStop(el.getAttribute('data-hb-sy-stop')); return; }
  if ((el = on('[data-hb-sy-write]'))){ hbStoryWrite(el.getAttribute('data-hb-sy-write')); return; }
  if ((el = on('[data-hb-sy-give]'))){ const k = 'sy:' + el.getAttribute('data-hb-sy-give'); _hbGiveForm = _hbGiveForm === k ? null : k; hbPaintBoard(); return; }
  if ((el = on('[data-hb-dd-add]'))){ hbDdAddCards(el.getAttribute('data-hb-dd-add')); return; }
  if ((el = on('[data-hb-read-more]'))){ hbReadMoreToggle(el.getAttribute('data-hb-read-more')); return; }
  if ((el = on('[data-hb-why-follow]'))){ hbWhyFollow(el.getAttribute('data-hb-why-follow')); return; }
  if ((el = on('[data-hb-ins]'))){ hbInsAct(el.getAttribute('data-hb-ins'), el.getAttribute('data-hb-ins-k')); return; }
  if ((el = on('[data-hb-ai]'))){ hbAskInPanel(el.getAttribute('data-hb-ai'), el.getAttribute('data-hb-ai-id')); return; }
  if ((el = on('[data-hb-ser]'))){ hbSerToggle(el.getAttribute('data-hb-ser-key'), el.getAttribute('data-hb-ser')); hbPaintBoard(); return; }
  if (on('[data-hb-figpick]')){ _hbFigPick = !_hbFigPick; hbPaintBoard(); return; }
  if ((el = on('[data-hb-figkey]'))){ if (!el.disabled){ hbFigToggle(el.getAttribute('data-hb-figkey')); hbPaintBoard(); } return; }
  /* THE AGENTS HAVE ONE PLACE (12 Oct 2026): the card's "The agents" opens
     Jambo's agents behind Insights — his house, his jobs and his points —
     rather than a second table of them here. */
  if (on('[data-hb-agents-page]')){ if (typeof setView === 'function') setView('jambo'); return; }
  /* how far the agents may go (the card's foot): a member asks an admin here,
     the tracked ask; an admin opens the agents' own settings, where it is set */
  if (on('[data-hb-lv-ask]')){ hbLvAsk(); return; }
  if (on('[data-hb-lv-change]')){ if (typeof openSettingsAt === 'function') openSettingsAt('company', 'agents'); return; }
  if (on('[data-hb-ins-fold]')){ const st = hbS(); st.insFold = !st.insFold; hbSave(); hbPaintBoard(); return; }
  if ((el = on('[data-hm-agent]'))){ e.stopPropagation(); hbOpenAgent(el.getAttribute('data-hm-agent')); return; }
  if (on('[data-hb-sheet-x]')){ hbSheetClose(); return; }
  if (on('[data-hb-sheet-dig]')){ const S = _hbSheet; _hbSheet = null; if (S) hbDig(S.key, S.within, true); return; }
  if ((el = on('[data-hb-ag-more]'))){ const k = el.getAttribute('data-hb-ag-more'); _hbAgMore.set(k, (_hbAgMore.get(k) || 0) + HB_AG_WORK_MAX); hbPaintBoard(); return; }
  if ((el = on('[data-hb-sheet-c]'))){ hbSheetGo(el.getAttribute('data-hb-sheet-c')); return; }
  /* a figure of Your book: the list behind it, on its own page (round 17 as drawn, hbFigDoor) */
  if ((el = on('#hb-book .hb-fig-main[data-hb-dig]')) && !el.disabled && hbFigDoor(el.getAttribute('data-hb-dig'))) return;
  /* a piece of a chart, a table row or a figure: its contracts in the side list (as drawn) */
  if ((el = on('.hb-sheet [data-hb-dig^="c:"]')) && _hbSheet){ hbSheetGo(el.getAttribute('data-hb-dig').slice(2)); return; }
  if ((el = on('[data-hb-dig]')) && !el.disabled){ const sk = hbSheetKeyOf(el); if (sk){
    /* PRESS IT AGAIN AND IT CLOSES: the door that opened the side list puts it away */
    if (_hbSheet && !el.closest('.hb-sheet') && _hbSheet.from === el.getAttribute('data-hb-dig') && document.querySelector('.hb-sheet')){ hbSheetClose(); return; }
    hbSheetOpen(sk, !!el.closest('.hb-dig'), el.getAttribute('data-hb-dig')); return; } }
  if ((el = on('[data-hb-dig]'))){ if (el.disabled) return; hbDig(el.getAttribute('data-hb-dig'), !!el.closest('.hb-dig'), true); return; }
}
function hbOnSubmit(e){
  if (!window.state || state.view !== 'dashboard') return;
  const f = e.target;
  if (f && f.matches && f.matches('[data-hb-watch-form="chart"]')){
    e.preventDefault();
    const key = f.getAttribute('data-hb-watch-key'), title = f.getAttribute('data-hb-watch-title') || '', dir = f.dir.value === 'below' ? 'below' : 'above', n = Number(f.n.value);
    if (!isFinite(n) || !/^(q|cd|ls):/.test(key || '')) return;
    const s = hbS(); s.chartWatches = s.chartWatches || [];
    if (s.chartWatches.length >= HB_WATCH_MAX){ if (typeof toast === 'function') toast(i18t('hb_watch_full', { n: HB_WATCH_MAX }), 'warn'); return; }
    s.chartWatches.push({ key, title, dir, n }); _hbWatchForm = null; hbSave(); hbAlertsChanged(); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t('hb_watch_said', { what: title || key, dir: i18t('hb_watch_' + dir), n }), 'ok');
    return;
  }
  if (f && f.matches && f.matches('[data-hb-watch-form]')){
    e.preventDefault();
    const k = f.getAttribute('data-hb-watch-form'), dir = f.dir.value === 'below' ? 'below' : 'above', n = Number(f.n.value);
    if (!isFinite(n)) return;
    const s = hbS(); if (s.watches.length >= HB_WATCH_MAX){ if (typeof toast === 'function') toast(i18t('hb_watch_full', { n: HB_WATCH_MAX }), 'warn'); return; }
    s.watches.push({ k, dir, n }); _hbWatchForm = null; hbSave(); hbAlertsChanged(); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t('hb_watch_said', { what: i18t('hb_f_' + k), dir: i18t('hb_watch_' + dir), n }), 'ok');
    return;
  }
  /* a card's target line (G5): a figure, or a refusal that says why */
  if (f && f.matches && f.matches('[data-hb-tgt-form]')){
    e.preventDefault();
    const k = f.getAttribute('data-hb-tgt-form'), raw = f.t ? f.t.value : '';
    if (!String(raw).trim()){ hbRefsSet(k, 'tgt', null); hbPaintBoard(); return; }
    const n = hbNumIn(raw);
    if (n == null){ if (typeof toast === 'function') toast(i18t('hb_ref_tgt_bad', { t: String(raw).slice(0, 40) }), 'warn'); return; }
    hbRefsSet(k, 'tgt', n); _hbLinesOpen = null; hbPaintBoard(); return;
  }
  if (f && f.matches && f.matches('[data-hb-ver-form]')){
    e.preventDefault();
    hbVerSave(f.getAttribute('data-hb-ver-form'), f.elements.vtitle.value, f.elements.phrases.value);
    return;
  }
  if (f && f.matches && f.matches('[data-hb-give-form]')){
    e.preventDefault();
    hbGive(f.getAttribute('data-hb-give-form'), f.to.value, f.note.value);
    return;
  }
  if (f && f.matches && f.matches('[data-hb-cv-give]')){ e.preventDefault(); hbCvGive(f); }
}
function hbOnPointer(e){
  /* a page left by the keyboard takes the veil with it */
  if (_hbTool === 'pointer' && (!window.state || state.view !== 'dashboard')){ _hbTool = ''; hbVeilPaint(); return; }
  const col = document.getElementById('hb-col'); if (!col || !state || state.view !== 'dashboard') return;
  if (_hbTool === 'pointer'){
    /* the whole screen: the dot is drawn in screen coordinates on the veil;
       over the exit control the dot steps aside so its words can be read */
    const x = e.clientX, y = e.clientY; _hbLastXY = [x, y];
    const onExit = !!(e.target && e.target.closest && e.target.closest('.hb-veil-exit'));
    const lz = document.getElementById('hb-laser'); if (lz){ lz.style.transform = `translate(${x}px,${y}px)`; lz.hidden = onExit; }
    _hbTrail.unshift([x, y]); _hbTrail = _hbTrail.slice(0, 10);
    for (let i = 1; i <= 3; i++){ const q = _hbTrail[i * 3]; const d = document.getElementById('hb-laser-' + i);
      if (d){ d.hidden = !q || onExit; if (q){ d.style.transform = `translate(${q[0]}px,${q[1]}px)`; d.style.opacity = String(0.5 - i * 0.14); } } }
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
  if (hbSlashKey(e)) return;
  /* Ctrl/⌘+Z on the board undoes the last board change (never inside a box being typed in) */
  if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'z' || e.key === 'Z') && hbBoardInFront()){
    const t = e.target; if (t && (t.closest && t.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]'))) return;
    e.preventDefault(); const ok = hbUndo(); hbPaintBoard();
    if (typeof toast === 'function') toast(i18t(ok ? 'hb_undo_done' : 'hb_undo_none'), ok ? 'ok' : 'warn'); return;
  }
  if (e.key === 'Escape' && _hbCvShare){ _hbCvShare = false; hbPaintBoard();
    const b = document.querySelector('[data-hb-cv-act="share"]'); if (b) try { b.focus({ preventScroll: true }); } catch (_){} return; }
  if (e.key === 'Escape' && _hbSheet && document.querySelector('.hb-sheet')){ hbSheetClose(); return; }
  if (e.key === 'Escape' && _hbFigPick){ _hbFigPick = false; hbPaintBoard(); const b = document.querySelector('[data-hb-figpick]'); if (b) try { b.focus({ preventScroll: true }); } catch (_){} return; }
  if (e.key === 'Escape' && (_hbDrawnOpen || _hbToolsMenu)){
    /* the keyboard goes back to the button that opened it */
    const back = _hbDrawnOpen ? `[data-hb-drawn="${CSS.escape(_hbDrawnOpen)}"]` : `[data-hb-tools-more="${CSS.escape(_hbToolsMenu)}"]`;
    _hbDrawnOpen = null; _hbToolsMenu = null; hbPaintBoard();
    const b = document.querySelector(back); if (b) try { b.focus({ preventScroll: true }); } catch (_){}
    return; }
  if (e.key === 'Escape' && _hbRdOpen){ _hbRdOpen = null; hbDockRepaint(); return; }
  if (e.key === 'Escape' && _hbLinesOpen){ const k = _hbLinesOpen; _hbLinesOpen = null; hbPaintBoard();
    const w = [...document.querySelectorAll('[data-hb-lines-key]')].find(x => x.getAttribute('data-hb-lines-key') === k), b = w && w.querySelector('[data-hb-lines]'); if (b) try { b.focus({ preventScroll: true }); } catch (_){} return; }
  /* the hover card is not a layer the reader opened: Esc takes it down and still steps back */
  if (e.key === 'Escape' && _hbTipFor) hbTipHide(true);
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
  /* Esc steps back one step at a time: full screen → opened → the board (O-25) */
  if (_hbFull){ _hbFull = false; hbPaintBoard(); return; }
  if (_hbPresenting){ hbPresent(false); return; }
  { const s = hbS(); if ((s.path || []).length && hbBoardInFront() && !(e.target && e.target.closest && e.target.closest('input, textarea, select'))){ s.path = []; hbSave(); hbPaintBoard(); return; } }
}
/* ============================================================
   THE SOFT HIGHLIGHT AND THE HOVER CARD (G1 + G4 of the Board Upgrade
   Proposals; the owner's "Build", 10 Oct 2026)
   ============================================================
   G1 — "when I press on the chart there should not be a black line outline
   during the press. It should be a soft highlight without an outline." The
   piece under the pointer (or the keyboard) is LIT and the rest of its chart
   steps back; every piece of the same door lights together (a ring's slice
   and its legend row). Nothing is outlined: the look is the sheet's.
   G4 — the hover card: the piece's name and number, its share of the whole
   (only where the numbers add up), the change from the piece before (a run
   over time), the three biggest contracts behind it, and the piece's own
   door ("Open these N" — the same list a press opens, so the number on the
   door is the list behind it) and "Ask about this", which only fills the ask
   box: nothing is asked, nothing is spent, until the reader presses Ask.
   The card counts nothing of its own: the number is the piece's, the list is
   hbDigData's for the piece's own key. While it shows, the browser's own
   tooltip is held back (the words are the card's) and given back after. */
const HB_TIP_TOP = 3, HB_TIP_HIDE_MS = 220;
/* THE CARD STAYS WHILE YOU REACH FOR IT (owner, 11 Oct 2026: "you cannot
   click on the highlighted buttons ... you end up on the next bar"): once a
   card is up, crossing another piece on the way to it does not swap the
   card at once — the pointer must rest there HB_TIP_SWITCH_MS; reaching the
   card cancels the swap. The first card still comes at once. */
const HB_TIP_SWITCH_MS = 320;
let _hbTipSwitchT = null;
let _hbTipFor = null, _hbTipHideT = null, _hbTipHeld = null;
const _hbTipMemo = new Map();
function hbLitClear(){
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.hb-svg.hb-dim').forEach(svg => { svg.classList.remove('hb-dim'); svg.querySelectorAll('.is-lit').forEach(x => x.classList.remove('is-lit')); });
}
function hbLitSet(el){
  const svg = el && el.closest ? el.closest('.hb-svg') : null; if (!svg) return;
  const k = el.getAttribute('data-hb-dig');
  if (svg.classList.contains('hb-dim') && el.classList.contains('is-lit')) return;
  hbLitClear();
  svg.classList.add('hb-dim');
  svg.querySelectorAll('[data-hb-dig]').forEach(x => { if (x.getAttribute('data-hb-dig') === k) x.classList.add('is-lit'); });
}
/* the piece's words: "label: what it counts", from its <title> or title= */
function _hbTipWords(el){
  const t = el.querySelector(':scope > title');
  const txt = t ? (t.getAttribute('data-hb-tt') || t.textContent) : (el.getAttribute('data-hb-tt') || el.getAttribute('title') || '');
  const at = txt.lastIndexOf(': ');
  return { label: at > 0 ? txt.slice(0, at) : txt, say: at > 0 ? txt.slice(at + 2) : '' };
}
function _hbTipHold(el){
  _hbTipGive();
  const t = el.querySelector(':scope > title');
  if (t && t.textContent){ t.setAttribute('data-hb-tt', t.textContent); t.textContent = ''; _hbTipHeld = { el: t, svg: true }; }
  else if (!t && el.getAttribute('title')){ el.setAttribute('data-hb-tt', el.getAttribute('title')); el.removeAttribute('title'); _hbTipHeld = { el, svg: false }; }
}
function _hbTipGive(){
  const h = _hbTipHeld; _hbTipHeld = null; if (!h || !h.el) return;
  const v = h.el.getAttribute('data-hb-tt'); h.el.removeAttribute('data-hb-tt');
  if (v == null) return;
  if (h.svg) h.el.textContent = v; else h.el.setAttribute('title', v);
}
/* the facts the card shows, worked out once per piece per paint */
function hbTipData(el){
  const dig = el.getAttribute('data-hb-dig') || ''; if (!dig) return null;
  const W = _hbTipWords(el);
  const box = el.closest('[data-hb-yk]'), yk = box ? box.getAttribute('data-hb-yk') : '';
  const y = Number(el.getAttribute('data-hb-y'));
  const D = { dig, label: W.label, say: W.say, share: null, change: null, ids: null, n: null, one: null };
  if (el.hasAttribute('data-hb-y') && isFinite(y) && (yk === 'count' || yk === 'value') && box){
    const parts = [...box.querySelectorAll('[data-hb-part]')], seen = new Set();
    const tot = parts.reduce((a, x) => { const k = x.getAttribute('data-hb-dig'); if (seen.has(k)) return a; seen.add(k); return a + (Number(x.getAttribute('data-hb-y')) || 0); }, 0);
    if (seen.size > 1 && tot > 0) D.share = Math.round(y / tot * 100);
  }
  if (el.hasAttribute('data-hb-py') && el.hasAttribute('data-hb-y') && yk !== 'run'){
    const py = Number(el.getAttribute('data-hb-py'));
    if (isFinite(py) && isFinite(y)) D.change = { was: el.getAttribute('data-hb-pl') || '', p: py > 0 ? Math.round((y - py) / py * 100) : null, up: y > py, same: y === py };
  }
  const memo = _hbTipMemo.get(dig);
  if (memo){ D.ids = memo.ids; D.n = memo.n; D.one = memo.one; return D; }
  try {
    if (/^c:/.test(dig)) D.one = hbContract(dig.slice(2)) || null;
    else { const Dd = hbDigData(dig, hbS().lens); if (Dd && Dd.kind === 'list' && Array.isArray(Dd.ids)){ D.ids = Dd.ids; D.n = Dd.n; } }
  } catch (_){}
  _hbTipMemo.set(dig, { ids: D.ids, n: D.n, one: D.one });
  return D;
}
function _hbTipRowHtml(c, money){
  const who = String(c.counterparty || c.name || '');
  return `<li><span class="hb-tip-ref">${_hbRefH(c)}</span><span class="hb-tip-who">${_hbE(who)}</span>${money ? `<b>${_hbE(_hbM(hbValueOfOne(c)))}</b>` : ''}</li>`;
}
function hbTipHtml(D){
  const money = hbMoneyOk();
  const meta = [];
  if (D.share != null) meta.push(`<span>${_hbE(i18t('hb_tip_share', { p: _hbN(D.share) }))}</span>`);
  if (D.change && D.change.was){
    const c = D.change, word = c.same ? i18t('hb_tip_same', { was: c.was }) : c.p == null ? i18t('hb_tip_new', { was: c.was }) : i18t(c.up ? 'hb_tip_up' : 'hb_tip_down', { p: _hbN(Math.abs(c.p)), was: c.was });
    meta.push(`<span class="hb-tip-ch${c.same || c.p == null ? '' : c.up ? ' is-up' : ' is-down'}">${_hbE(word)}</span>`);
  }
  let list = '', acts = '';
  if (D.one){
    list = `<ul class="hb-tip-list">${_hbTipRowHtml(D.one, money)}</ul>`;
    acts = `<button type="button" class="hb-link hb-tip-go" data-hb-dig="${_hbE(D.dig)}">${_hbE(i18t('hb_tip_open_card'))}</button>`;
  } else if (Array.isArray(D.ids) && D.n){
    const cs = hbListOf(D.ids, hbS().lens);
    const top = cs.slice().sort((a, b) => money ? (hbValueOfOne(b) - hbValueOfOne(a)) : String(a.name || '').localeCompare(String(b.name || ''))).slice(0, HB_TIP_TOP);
    list = top.length ? `<div class="hb-tip-sub">${_hbE(i18t(money ? 'hb_tip_top' : 'hb_tip_some'))}</div><ul class="hb-tip-list">${top.map(c => _hbTipRowHtml(c, money)).join('')}</ul>` : '';
    acts = `<button type="button" class="hb-link hb-tip-go" data-hb-dig="${_hbE(D.dig)}">${_hbE(i18tn('hb_tip_open_n', D.n, { n: _hbN(D.n) }))}</button>`;
  }
  acts += `<button type="button" class="hb-link hb-tip-ask" data-hb-tip-ask>${_hbE(i18t('hb_tip_ask'))}</button>`;
  return `<div class="hb-tip-h">${_hbE(D.label)}</div>${D.say ? `<div class="hb-tip-v">${_hbE(D.say)}</div>` : ''}${meta.length ? `<div class="hb-tip-m">${meta.join('')}</div>` : ''}${list}<div class="hb-tip-acts">${acts}</div>`;
}
function _hbTipEl(){
  const pg = hbPage(); if (!pg) return null;
  let t = document.getElementById('hb-tip');
  if (t && t.parentElement !== pg){ t.remove(); t = null; }
  if (!t){ t = document.createElement('div'); t.id = 'hb-tip'; t.className = 'hb-tip'; t.setAttribute('role', 'tooltip'); t.hidden = true; pg.appendChild(t);
    t.addEventListener('pointerenter', () => { clearTimeout(_hbTipHideT); clearTimeout(_hbTipSwitchT); });
    t.addEventListener('pointerleave', () => hbTipHide(false)); }
  return t;
}
function hbTipShow(el){
  if (!el || !el.isConnected) return;
  clearTimeout(_hbTipHideT);
  if (_hbTipFor === el){ return; }
  const D = hbTipData(el); if (!D) return;
  const t = _hbTipEl(); if (!t) return;
  _hbTipHold(el);
  _hbTipFor = el;
  t.innerHTML = hbTipHtml(D);
  t._hbAsk = D;
  t.hidden = false;
  /* beside the piece, on the side with room, inside the board (never over
     the Copilot panel) and never off the window; with no room either side it
     sits above the piece, else below */
  const r = el.getBoundingClientRect(), w = t.offsetWidth, h = t.offsetHeight, gap = 10;
  const host = hbHost(), hb = host ? host.getBoundingClientRect() : null;
  const L0 = Math.max(8, hb ? hb.left + 4 : 8), R0 = Math.min(window.innerWidth - 8, hb ? hb.right - 4 : window.innerWidth - 8), T0 = 8, B0 = window.innerHeight - 8;
  let x, y;
  if (r.right + gap + w <= R0){ x = r.right + gap; y = r.top + r.height / 2 - h / 2; }
  else if (r.left - gap - w >= L0){ x = r.left - gap - w; y = r.top + r.height / 2 - h / 2; }
  else { x = r.left + r.width / 2 - w / 2; y = r.top - gap - h >= T0 ? r.top - gap - h : r.bottom + gap; }
  t.style.left = Math.round(Math.max(L0, Math.min(R0 - w, x))) + 'px';
  t.style.top = Math.round(Math.max(T0, Math.min(B0 - h, y))) + 'px';
}
function hbTipHide(now){
  clearTimeout(_hbTipHideT);
  const go = () => { clearTimeout(_hbTipSwitchT); const t = document.getElementById('hb-tip'); if (t) t.hidden = true; _hbTipGive(); _hbTipFor = null; hbLitClear(); };
  if (now) go(); else _hbTipHideT = setTimeout(go, HB_TIP_HIDE_MS);
}
/* "Ask about this": the question goes into the ask box, and waits there.
   C2: the piece and its contracts are kept for the next question asked on
   the board (ten minutes), so Copilot answers about THOSE contracts */
let _hbAskAbout = null;
const HB_ASK_ABOUT_MS = 10 * 60 * 1000, HB_ASK_ABOUT_IDS = 40;
function hbAskAboutLine(){
  const A = _hbAskAbout; if (!A || Date.now() - A.at > HB_ASK_ABOUT_MS) return '';
  const money = hbMoneyOk();
  const cs = A.one ? [A.one] : hbListOf(A.ids || [], hbS().lens);
  const rows = cs.slice().sort((a, b) => hbValueOfOne(b) - hbValueOfOne(a)).slice(0, HB_ASK_ABOUT_IDS)
    .map(c => `${hbRef(c)} (${String(c.counterparty || c.name || '')}${money ? ', ' + _hbM(hbValueOfOne(c)) : ''}${c.status ? ', ' + c.status : ''})`);
  return `The reader pressed "Ask about this" on one piece of the open chart: "${A.label}"${A.say ? ' (' + A.say + ')' : ''}. The ${cs.length} contract${cs.length === 1 ? '' : 's'} behind it${cs.length > rows.length ? `, the ${rows.length} biggest listed` : ''}: ${rows.join('; ')}. Answer about these contracts and name the ones you mean by their reference.`;
}
function hbTipAsk(){
  const t = document.getElementById('hb-tip'), D = t && t._hbAsk; if (!D) return;
  _hbAskAbout = { label: D.label, say: D.say, ids: D.ids ? D.ids.slice() : null, one: D.one || null, at: Date.now() };
  hbTipHide(true);
  const door = document.getElementById('igd-expand');
  if (door && door.offsetParent !== null) try { door.click(); } catch (_){}
  setTimeout(() => {
    const box = document.getElementById('igd-input'); if (!box) return;
    box.value = i18t('hb_tip_ask_q', { what: D.label, say: D.say || '' }).replace(/\s*\(\)\s*/, ' ').trim();
    try { box.dispatchEvent(new Event('input', { bubbles: true })); } catch (_){}
    try { box.focus(); box.setSelectionRange(box.value.length, box.value.length); } catch (_){}
  }, 60);
}
function _hbPieceOf(t){ return t && t.closest ? t.closest('.hb-svg [data-hb-dig], .hb-chart [data-hb-dig]') : null; }
function hbOnPieceOver(e){
  if (!window.state || state.view !== 'dashboard') return;
  const el = _hbPieceOf(e.target);
  if (!el){ if (e.target && e.target.closest && e.target.closest('#hb-tip')){ clearTimeout(_hbTipSwitchT); return; }
    clearTimeout(_hbTipSwitchT); if (_hbTipFor) hbTipHide(false); return; }
  clearTimeout(_hbTipSwitchT);
  const up = document.getElementById('hb-tip');
  if (e.pointerType !== 'touch' && _hbTipFor && _hbTipFor !== el && up && !up.hidden && _hbTipFor.isConnected){
    clearTimeout(_hbTipHideT);
    _hbTipSwitchT = setTimeout(() => { if (!el.isConnected) return; if (el.closest('.hb-svg')) hbLitSet(el); hbTipShow(el); }, HB_TIP_SWITCH_MS);
    return;
  }
  if (el.closest('.hb-svg')) hbLitSet(el);
  if (e.pointerType === 'touch') return;
  hbTipShow(el);
}
function hbOnPieceFocus(e){
  if (!window.state || state.view !== 'dashboard') return;
  const el = _hbPieceOf(e.target); if (!el) return;
  if (el.closest('.hb-svg')) hbLitSet(el);
  hbTipShow(el);
}
function hbOnPieceBlur(e){
  const el = _hbPieceOf(e.target); if (!el) return;
  const to = e.relatedTarget;
  if (to && to.closest && to.closest('#hb-tip')) return;
  hbTipHide(false);
}
if (typeof document !== 'undefined' && !document._hbTipWired){
  document._hbTipWired = true;
  document.addEventListener('pointerover', hbOnPieceOver, { passive: true });
  document.addEventListener('focusin', hbOnPieceFocus);
  document.addEventListener('focusout', hbOnPieceBlur);
  document.addEventListener('scroll', () => { if (_hbTipFor) hbTipHide(true); }, { capture: true, passive: true });
}
/* ============================================================
   THE ASK BOX, FOR SOMEONE WHO ASKS ALL DAY (A1, A2, A4, A7, A10 of the
   Board Upgrade Proposals; the owner's "Build all C and A ideas", 10 Oct 2026)
   ============================================================
   On Home's Board side, one small list above the ask box:
   - "/" lists the MOVES (A1); a move fills in a starter question to edit, or
     does its act (explain the open chart, save it, what if…);
   - after "by" it offers the groupings this book really has, after "in" the
     periods (A2) — Tab or a press takes one; Enter still asks;
   - an empty box, clicked, shows MY QUESTIONS (A4) and the GALLERY (A7): ready
     analyst views, each drawn as a card by the board's own applier (no model);
   - Ctrl/⌘+Enter asks, ↑ in an empty box brings back the last question, "/"
     anywhere on the board opens the moves (A10).
   Nothing here asks Copilot or spends anything by itself. */
const HB_MYQ_MAX = 20, HB_ASKPOP_MAX = 8, HB_ASK_HIST = 20;
/* the places a "/" lists on the Board before its own moves (Jambo's words, the one-page Home plan, stage 1) */
const HB_SLASH_PLACES = 5;
/* rows a long list draws (the gallery; "/" with places and moves); the rest scroll */
const HB_ASKPOP_LONG = 30;
const HB_SLASH = ['compare', 'trend', 'top', 'split', 'growth', 'explain', 'whatif', 'forecast', 'save'];
const HB_SLASH_ACT = { explain: 1, whatif: 1, save: 1 };
const HB_GALLERY = [
  { k: 'conc', recipe: { pic: 'bars', split: { by: 'counterparty' }, measure: 'value', top: 10, show: 'share' } },
  { k: 'speed', recipe: { pic: 'spread', split: { by: 'kind' } } },
  { k: 'leak', which: { q: 'expired contracts' }, recipe: { pic: 'cols', split: { by: 'date', unit: 'm', date: 'end' }, window: { last: 12, unit: 'm' } } },
  { k: 'prom', recipe: { pic: 'stack', split: { by: 'counterparty' }, split2: { by: 'overdue' }, top: 10 } },
  /* payment terms ACROSS (five short names, read flat), the streams DOWN (owner,
     11 Oct 2026: twelve stream names angled over the grid ate the card's
     height and only one row of four was drawn) */
  /* drawn the SAP way, paired bars per band (owner picked it by name, 11 Oct 2026) */
  { k: 'pay', recipe: { pic: 'grouped', split: { by: 'payterms' }, split2: { by: 'side' } } },
  { k: 'pipe', recipe: { pic: 'funnel' } },
  { k: 'move', recipe: { pic: 'waterfall', measure: 'value', window: { last: 12, unit: 'm' } } },
  { k: 'fc', recipe: { pic: 'forecast', measure: 'value' } }];
const HB_GW_SHOW = ['status', 'folder', 'counterparty', 'owner', 'kind', 'side', 'payterms', 'valueBand', 'move', 'rounds', 'overdue', 'risks', 'standards', 'autorenew'];
const HB_IN_WORDS = ['hb_in_l12', 'hb_in_l3', 'hb_in_ty', 'hb_in_tq', 'hb_in_n6'];
let _hbPop = null;            // { mode, rows, on, moved, start }
const _hbAskHist = []; let _hbHistAt = -1;
/* THE BOX ON HOME'S DOCUMENT TOO (the one-page Home plan, stage 1): "/" there
   lists the places; the gallery and the "by"/"in" helpers stay the Board's */
function hbAskBoxUp(){ try { return !!(window.state && state.view === 'dashboard' && (hbS().face === 'board' || hbS().face === 'paper')); } catch (_){ return false; } }
/* the groupings this book has (two groups or more), in the reader's words */
let _hbGwMemo = null;
function hbGroupingsHere(){
  const n = (state.contracts || []).length;
  if (_hbGwMemo && _hbGwMemo.n === n) return _hbGwMemo.ks;
  const cs = hbBook('all').slice(0, 400);
  const ks = HB_GW_SHOW.filter(k => { if (k === 'valueBand') return hbMoneyOk(); const g = new Set(); for (const c of cs){ g.add(hbGroupOf(c, k)); if (g.size > 1) return true; } return false; });
  _hbGwMemo = { n, ks }; return ks;
}
function hbAskPopRows(v){
  const t = String(v || '');
  /* the charts in front, not a contract brought up on the Board face (hbBoardInFront) */
  const onBoard = hbBoardInFront();
  if (!t.trim()){
    if (!onBoard) return null;
    const myq = (hbS().myq || []).map((q, i) => ({ kind: 'myq', i, word: q.name, sub: i18t('hb_myq_sub') }));
    return { mode: 'gallery', rows: myq.concat(HB_GALLERY.map(g => ({ kind: 'gal', k: g.k, word: i18t('hb_gal_' + g.k), sub: i18t('hb_gal_' + g.k + '_s') }))) };
  }
  /* ONE "/" LIST: Jambo's places first (most used first, caSlashRows), then
     on the Board its own moves. Off the Board, the places alone. */
  let m = /^\s*\/([\w\-åäöÅÄÖ]*)$/.exec(t);
  if (m){ const w = m[1].toLowerCase();
    const places = (typeof window.caSlashRows === 'function') ? caSlashRows(w, { max: onBoard ? HB_SLASH_PLACES : HB_ASKPOP_MAX }) : [];
    const moves = onBoard ? HB_SLASH.filter(k => k.startsWith(w)).map(k => ({ kind: 'slash', k, word: '/' + k, sub: i18t('hb_sl_' + k) })) : [];
    return { mode: 'slash', rows: places.concat(moves) }; }
  if (!onBoard) return null;
  m = /\b(?:by|per|efter)\s+([a-zåäö-]*)$/i.exec(t);
  if (m){ const w = m[1].toLowerCase(), start = t.length - m[1].length;
    const rows = hbGroupingsHere().map(k => ({ kind: 'word', word: i18t('hb_gw_' + k) })).filter(r => !w || r.word.toLowerCase().split(/\s+/).some(x => x.startsWith(w)) || r.word.toLowerCase().startsWith(w));
    return rows.length && !(rows.length === 1 && rows[0].word.toLowerCase() === w) ? { mode: 'by', rows, start } : null; }
  m = /\b(?:in|over|during|i|under)\s+((?:the\s+)?[a-zåäö0-9 ]{0,12})$/i.exec(t);
  if (m && !/\d{4}/.test(m[1])){ const w = m[1].toLowerCase().trim(), start = t.length - m[1].length;
    const rows = HB_IN_WORDS.map(k => ({ kind: 'word', word: i18t(k) })).filter(r => !w || r.word.toLowerCase().startsWith(w));
    return rows.length ? { mode: 'in', rows, start } : null; }
  return null;
}
function hbAskPopHtml(P){
  const head = i18t('hb_pop_' + P.mode);
  let lastKind = null;
  const grouped = P.mode === 'gallery' || P.mode === 'slash';
  const secHead = r => P.mode === 'gallery' ? i18t(r.kind === 'myq' ? 'hb_myq_head' : 'hb_gal_head') : i18t(r.kind === 'place' ? 'hb_pop_places' : 'hb_pop_slash');
  const rows = P.rows.slice(0, grouped ? HB_ASKPOP_LONG : HB_ASKPOP_MAX).map((r, i) => {
    const sec = grouped && r.kind !== lastKind ? `<h5>${_hbE(secHead(r))}</h5>` : ''; lastKind = r.kind;
    return sec + `<div class="ca-opt hb-pop-opt${i === P.on ? ' on' : ''}" role="option" aria-selected="${i === P.on}" data-hb-pop="${i}" data-hb-pop-kind="${_hbE(r.kind || '')}"><span class="who"><b>${_hbE(r.word)}</b>${r.sub ? `<small>${_hbE(r.sub)}</small>` : ''}</span>${''/* THE ROW SAYS WHAT IT DOES (owner picked "The Legora way", 25 Oct 2026): a chart row ends in "Draw ›", as the Dossier's door rows end in "Open ›" */}${r.kind === 'gal' || r.kind === 'myq' ? `<span class="hb-pop-go" aria-hidden="true">${_hbE(i18t('hb_pop_draw'))} ›</span>` : ''}${r.kind === 'myq' ? `<button type="button" class="hb-myq-x" data-hb-myq-del="${r.i}" title="${_hbE(i18t('hb_myq_del'))}" aria-label="${_hbE(i18t('hb_myq_del'))}">${typeof icon === 'function' ? icon('x', 'w-3.5 h-3.5') : '×'}</button>` : ''}${r.kind === 'place' && r.n ? `<em class="hb-pop-n">${_hbE(i18t('hb_pop_used', { n: r.n }))}</em>` : ''}${r.kind === 'place' && typeof caSlashGoHtml === 'function' ? caSlashGoHtml() : ''}</div>`; }).join('');
  return `${grouped ? '' : `<h5>${_hbE(head)}</h5>`}<div role="listbox">${rows}</div><p class="ca-hint">${_hbE(i18t(P.mode === 'by' || P.mode === 'in' ? 'hb_pop_keys_tab' : 'hb_pop_keys'))}</p>`;
}
function hbAskPopClose(){ _hbPop = null; const el = document.getElementById('hb-askpop'); if (el) el.remove(); }
function hbAskPopPaint(inp){
  const dock = document.getElementById('ig-dock'); if (!dock || !_hbPop) return;
  let el = document.getElementById('hb-askpop');
  if (!el){ el = document.createElement('div'); el.id = 'hb-askpop'; el.className = 'ca-pop hb-askpop'; dock.appendChild(el); }
  el.innerHTML = hbAskPopHtml(_hbPop);
  const box = inp && inp.parentElement;
  if (box){ const r = box.getBoundingClientRect(), d = dock.getBoundingClientRect(); el.style.bottom = Math.max(8, d.bottom - r.top + 6) + 'px'; }
}
function hbAskPopRead(inp){
  if (!hbAskBoxUp() || document.getElementById('ca-pop') || /(^|\s)[@#][^\s]*$/.test(String(inp.value || '').slice(0, inp.selectionStart))){ hbAskPopClose(); return; }
  const R = hbAskPopRows(String(inp.value || '').slice(0, inp.selectionStart == null ? undefined : inp.selectionStart));
  if (!R || !R.rows.length){ hbAskPopClose(); return; }
  _hbPop = Object.assign({ on: 0, moved: false }, R);
  hbAskPopPaint(inp);
}
function _hbAskSet(inp, v){
  inp.value = v; try { inp.setSelectionRange(v.length, v.length); inp.focus(); } catch (_){}
  if (typeof chatFieldGrow === 'function') try { chatFieldGrow(inp); } catch (_){}
  try { inp.dispatchEvent(new Event('input', { bubbles: true })); } catch (_){}
}
/* a choice from the list: fill, do, or draw — never ask Copilot by itself */
function hbAskPopChoose(inp, i){
  const P = _hbPop; const r = P && P.rows[i]; if (!r) return;
  hbAskPopClose();
  if (r.kind === 'word'){ const v = String(inp.value || ''); _hbAskSet(inp, v.slice(0, P.start) + r.word + ' '); return; }
  if (r.kind === 'place'){
    if (r.k === 'draft'){ _hbAskSet(inp, r.word.slice(1) + ' '); return; }
    _hbAskSet(inp, '');
    /* a word the Board's own reader answers here ("/obligations" is its
       panel) is still a use of the place */
    if (typeof window.caReadPlace === 'function' && !caReadPlace(r.word) && typeof window.caUseBump === 'function') caUseBump(r.k);
    if (typeof window.intelAsk === 'function') intelAsk(r.word);
    return;
  }
  if (r.kind === 'slash'){
    if (HB_SLASH_ACT[r.k]){ _hbAskSet(inp, ''); hbSlashAct(r.k); return; }
    _hbAskSet(inp, i18t('hb_sl_' + r.k + '_q')); return;
  }
  if (r.kind === 'gal'){ _hbAskSet(inp, ''); hbGalleryRun(r.k); return; }
  if (r.kind === 'myq'){ _hbAskSet(inp, ''); hbMyqRun(r.i); }
}
function hbGalleryRun(k){
  const g = HB_GALLERY.find(x => x.k === k); if (!g) return;
  const recipe = JSON.parse(JSON.stringify(g.recipe));
  if (recipe.measure === 'value' && !hbMoneyOk()){ recipe.measure = 'count'; if (recipe.show === 'share') recipe.show = 'share'; }
  /* a pick is only offered with the Board itself in front (hbAskPopRows); one
     reached another way is refused rather than drawn behind a contract */
  if (!hbBoardInFront()) return;
  const { p } = hbAddCard(g.which || { all: true }, recipe, i18t('hb_gal_' + k + '_t'));
  const s = hbS(); s.path = []; hbSave(); hbPaintBoard({ jump: 'top' });
  hbLandOnCard(p);
  if (typeof toast === 'function') toast(i18t('hb_gal_added', { what: i18t('hb_gal_' + k + '_t') }), 'ok');
}
/* THE NEW CHART IN VIEW (the work order, 23 Oct 2026): "Added to the board"
   matches what the reader sees. Landed through the one lander, no light (the
   21 Oct ruling: .is-landed draws nothing), its main button not taken. */
function hbLandOnCard(p){
  if (!p || typeof landOn !== 'function') return;
  const id = String(p.id);
  landOn(() => [...document.querySelectorAll('#hb-board [data-hb-pid]')].find(x => x.getAttribute('data-hb-pid') === id) || null, { block: 'nearest', focus: false });
}
/* the open chart: what the moves that act need */
function hbOpenCardKey(){ return hbOpenListKey(); }
function hbSlashAct(k){
  const key = hbOpenCardKey();
  if (!key){ if (typeof toast === 'function') toast(i18t('hb_sl_need_open'), 'warn'); return; }
  if (k === 'explain'){ const b = [...document.querySelectorAll('[data-hb-dd-on]')].find(x => x.getAttribute('data-hb-dd-on') === key && !x.closest('.hb-pmenu'));
    if (b && !b.disabled){ b.click(); return; }
    const s = hbS(); if (!s.digBig){ s.digBig = true; hbSave(); hbPaintBoard({ jump: 'focus' }); }
    if (typeof toast === 'function') toast(i18t('hb_sl_explain_here'), 'warn'); return; }
  if (k === 'save'){ hbMyqSave(key); return; }
  if (k === 'whatif'){ hbWhatIfToggle(key); }
}
/* MY QUESTIONS (A4): a name the reader chose for a view; the view is its key
   (a question is read again each time, so "the last 12 months" always means
   the twelve before today) or, for a card Copilot built, its own recipe */
function hbMyqSave(key){
  const s = hbS(); const D = hbDigData(key, s.lens); if (!D || D.kind !== 'list') return;
  const keep = name => {
    const n = hbPlainText(name, 60); if (!n) return;
    s.myq = (s.myq || []).filter(q => q.key !== key || /^cd:/.test(key));
    const p = /^cd:/.test(key) ? (s.panels || []).find(x => x.key === key) : null;
    s.myq.push(p ? { name: n, which: JSON.parse(JSON.stringify(p.which || { all: true })), recipe: JSON.parse(JSON.stringify(hbCardClean(Object.assign({}, p.recipe || {}, (s.recipe || {})[key] || {})))) } : { name: n, key });
    s.myq = s.myq.slice(-HB_MYQ_MAX); hbSave();
    if (typeof toast === 'function') toast(i18t('hb_myq_saved', { name: n }), 'ok');
  };
  const def = hbCrumbOf(key, s.lens);
  if (typeof promptDialog === 'function') Promise.resolve(promptDialog({ title: i18t('hb_myq_title'), label: i18t('hb_myq_label'), value: def, confirmLabel: i18t('hb_myq_save'), required: true })).then(v => { if (v != null) keep(v); });
  else keep(def);
}
function hbMyqRun(i){
  const s = hbS(); const q = (s.myq || [])[i]; if (!q) return;
  if (!hbBoardInFront()) return;
  if (q.key){ s.path = [q.key]; _hbFocusNew = true; hbSave(); hbPaintBoard({ jump: 'focus' }); return; }
  const { p } = hbAddCard(q.which || { all: true }, q.recipe || {}, q.name); s.path = []; hbSave(); hbPaintBoard({ jump: 'top' });
  hbLandOnCard(p);
}
function hbMyqDel(i){ const s = hbS(); s.myq = (s.myq || []).filter((_, k) => k !== i); hbSave(); }
if (typeof document !== 'undefined' && !document._hbAskWired){
  document._hbAskWired = true;
  document.addEventListener('input', e => { const t = e.target; if (t && t.id === 'igd-input'){ _hbHistAt = -1; hbAskPopRead(t); } });
  document.addEventListener('focusin', e => { const t = e.target; if (t && t.id === 'igd-input' && !String(t.value || '').trim()) hbAskPopRead(t); });
  document.addEventListener('keydown', e => {
    const t = e.target; if (!t || t.id !== 'igd-input' || !hbAskBoxUp()) return;
    /* A10: what was asked is kept for ↑ (the box's own handler asks after this) */
    if (e.key === 'Enter' && !e.shiftKey && !_hbPop && String(t.value || '').trim()){ _hbAskHist.unshift(String(t.value).trim()); _hbAskHist.length = Math.min(_hbAskHist.length, HB_ASK_HIST); _hbHistAt = -1; return; }
    if (_hbPop){
      const n = Math.min(_hbPop.rows.length, (_hbPop.mode === 'gallery' || _hbPop.mode === 'slash') ? HB_ASKPOP_LONG : HB_ASKPOP_MAX);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); e.stopPropagation(); _hbPop.on = (_hbPop.on + (e.key === 'ArrowDown' ? 1 : n - 1)) % n; _hbPop.moved = true; hbAskPopPaint(t); return; }
      const takesEnter = _hbPop.mode === 'slash' || _hbPop.mode === 'gallery' || _hbPop.moved;
      if ((e.key === 'Tab' || (e.key === 'Enter' && takesEnter && !e.ctrlKey && !e.metaKey)) && n){ e.preventDefault(); e.stopPropagation(); hbAskPopChoose(t, _hbPop.on); return; }
      if (e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); hbAskPopClose(); return; }
      if (e.key === 'Enter' && String(t.value || '').trim()){ hbAskPopClose(); _hbAskHist.unshift(String(t.value).trim()); _hbAskHist.length = Math.min(_hbAskHist.length, HB_ASK_HIST); return; }
      return;
    }
    if (e.key === 'ArrowUp' && _hbAskHist.length && (!String(t.value || '').trim() || _hbHistAt >= 0)){
      e.preventDefault(); _hbHistAt = Math.min(_hbHistAt + 1, _hbAskHist.length - 1); const v = _hbAskHist[_hbHistAt]; t.value = v; try { t.setSelectionRange(v.length, v.length); } catch (_){} return; }
    if (e.key === 'ArrowDown' && _hbHistAt >= 0){ e.preventDefault(); _hbHistAt--; const v = _hbHistAt >= 0 ? _hbAskHist[_hbHistAt] : ''; t.value = v; return; }
  }, true);
  document.addEventListener('mousedown', e => {
    const x = e.target && e.target.closest ? e.target.closest('[data-hb-myq-del]') : null;
    if (x){ e.preventDefault(); e.stopPropagation(); hbMyqDel(Number(x.getAttribute('data-hb-myq-del'))); const inp = document.getElementById('igd-input'); if (inp) hbAskPopRead(inp); return; }
    const o = e.target && e.target.closest ? e.target.closest('[data-hb-pop]') : null;
    if (o){ e.preventDefault(); const inp = document.getElementById('igd-input'); if (inp) hbAskPopChoose(inp, Number(o.getAttribute('data-hb-pop'))); return; }
    if (_hbPop && !(e.target && e.target.closest && e.target.closest('#hb-askpop, #igd-input'))) hbAskPopClose();
  });
}
/* "/" anywhere on the board (not while typing) opens the moves (A10) */
function hbSlashKey(e){
  if (e.key !== '/' || e.ctrlKey || e.metaKey || e.altKey || !hbAskBoxUp()) return false;
  const t = e.target; if (t && t.closest && t.closest('input, textarea, select, [contenteditable="true"], [contenteditable=""]')) return false;
  const door = document.getElementById('igd-expand'); if (door && door.offsetParent !== null) try { door.click(); } catch (_){}
  const inp = document.getElementById('igd-input'); if (!inp) return false;
  e.preventDefault(); _hbAskSet(inp, '/'); hbAskPopRead(inp); return true;
}
if (typeof document !== 'undefined' && !document._hbWired){
  document._hbWired = true;
  document.addEventListener('click', hbOnClick);
  document.addEventListener('submit', hbOnSubmit);
  /* How this is drawn ▾'s long groups are lists: a choice there is the same hbRecipeSet a button makes */
  document.addEventListener('change', e => { const el = e.target && e.target.closest ? e.target.closest('[data-hb-rsel]') : null; if (!el) return;
    const w = el.closest('[data-hb-rkey]'); if (!w) return; hbRecipeSet(w.getAttribute('data-hb-rkey'), el.getAttribute('data-hb-rsel'), el.value); hbPaintBoard(); });
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

Object.assign(window, { hbDnaUp, hbDnaHtml, hbDnaOf, hbDnaRows, hbDnaPanelHtml, hbDnaBtnHtml });
Object.assign(window, { hbThenDay, hbArrive, hbSheetLetGo, hbBoardInFront, hbLandOnCard, hbThenWord, HB_STAGE_FIG, hbStageThen, HB_FIG_TO_CONTRACTS, hbFigDoor, hbEmptyHtml, hbSetupLeft, hbSetupGo, hbNyAge, hbNeedsList, hbNeedsCount, hbNyWhat, hbNyDays, hbNyWhen, hbNyOldestSay, HB_VIEWS_ASK_RE, hbSavedViewsSay, hbHeadWord, hbValueSay, hbEndingDecided, hbBoardHelloOn, hbBoardHelloHtml, hbCountedAt, hbBoardHeadHtml, hbPulseBtnHtml, hbExplorerBtnHtml, hbSavedViewChipsHtml, hbViewsChanged, hbNeedsOpen, hbNeedsPress, hbOpenSavedView, hbOpenCalendar, hbOpenContracts, hbOpenHome, HB_CVIEWS, HB_CV_WORD, HB_CV_ROOM_TAB, hbCvNow, hbCvSet, hbCvCounts, hbCvReady, hbCvSwitchHtml, hbCvBodyHtml, hbCvPaint, hbOpenView, hbCvPick, hbCvReportOf, hbCvPrint, hbCvDownload, hbCvShareFormHtml, hbCvGive, hbCvGiftValid, hbCvGiftHtml, hbGiftSeen, hbCvGiftOpen, hbGiftsSeenSay, hbGiftAlerts, hbAngleOf, hbAngleText, HB_ANGLE, HB_SLASH_PLACES, HB_ASKPOP_LONG, hbAskPopRows, hbAskPopChoose, hbAskPopClose, hbGalleryRun, HB_GALLERY, HB_SLASH, hbSlashAct, hbMyqSave, hbMyqRun, hbMyqDel, hbSlashKey, hbWhatIfToggle, hbWhatIfSvg, hbPackMake, hbOddCols, hbHowHtml, hbMissKind, hbWhy3Html, hbWhy3Ask, hbAskAboutLine, hbFuStepsHtml, hbDataSuggestions, hbForecastSvg, hbChartPngOf, hbTipAsk, hbTipShow, hbTipHide, hbTipData, hbTipHtml, hbLitSet, hbLitClear, hbRefsOf, hbRefsSet, hbNumIn, hbExtraSets, hbWaterfallSvg, hbFunnelSvg, hbSpreadSvg, hbMultiSvg, hbLeadMark, hbChartPng, hbCopyChartImage, hbCopyChartTable, hbGlideTake, hbGlidePlay, hbChaseItems, hbChaseManyHtml, hbChaseManyCount, hbChaseManyRun, HB_OFF_BOARD, HB_REVIEW_ON_PAPER, hbReviewOnPaper, HB_AG_WORK_MAX, hbAgentWorkHtml, hbAgPieceHtml, hbAgLookToggle, hbAgLookSet, hbNdOpts, hbNdLookHtml, hbAgentWorkPress, hbOpenAgent, hbAgLevelsHtml, hbLvAsk, hbLvAskState, hbAgLevelsWanted, hbScreenNow, hbSay, hbSayPlain, HB_SAY_RULE, HB_STORIES, HB_STORY_ARG, HB_STORY_ORDER, HB_STORY_STEPS, HB_STORY_RE, hbStoryId, hbStorySid, hbStoryValid, hbStoryTitle, hbStoryOfQ, hbStoryData, hbStoryCardD, hbStoryDeepD, hbStoryDig, hbStoryChapterRead, hbStorySheet, hbStorySig, hbStoryKept, hbStoryKeep, hbStoryPrompt, hbStoryParse, hbStoryWrite, hbStoryWords, hbStoryDeeper, hbStoryStop, hbStoryFinish, hbDdStepsHtml, hbStepInProgress, hbStoryHtml, hbStoryDeepHtml, hbStoryGiftHtml, HB_ANALYST_WORDS, hbAnalystWords, hbNumPieces, HB_KEY_TERMS, hbKeyTermsOf, hbKeyTermOf, hbVerdictsOf, HB_DD_STEPS, HB_DD_KEEP, hbDeeperHtml, hbDdCalc, hbDdPack, hbDdRun, hbDigDeeper, hbDdAddCards, hbDdCardHtml, hbDdOn, hbDdOnHtml, hbDdOnPress, hbDdBodyHtml, hbReadOfList, HB_PACKS, HB_PACK_RE, hbPackOfQ, hbPackData, hbPackCardD, hbPackHtml, hbPackSrc, HB_BOARD_KEY, hbBoardSrc, hbBoardSumHtml, HB_FACT_MAX, hbFactSheet, hbNumsOf, hbFactCheck, hbSummaryPrompt, hbCoverageOf, hbAvgMeasure, hbSignM, HB_SHOWS, HB_MONEY_MEASURES, HB_RISK_WEIGHT, hbMoneyMeasure, hbStdStateOf, hbStdBreaches, hbRiskWeightOf, hbExposureOf, HB_HEAD_SKIP, hbHeadlineOf, hbHeadlineHtml, hbReadSrcHeadHtml, hbReadMoreToggle, HB_MOVED_MAX, hbMovedOf, hbMovedSync, hbOpenFromLink, hbAskReadingOf, hbAskPreviewText, hbAskFound, hbVerBadgeHtml, hbPhraseNorm, hbVerifiedList, hbVerifiedHit, hbVerifiedOf, hbVerifiedByLine, hbVerifiedAnswer, hbVerifiedGuide, hbMayVerify, hbVerFormHtml, hbVerSave, HB_DEAL_GROUPS, HB_DEAL_ORDER, hbDealGroupOf, hbMarksHtml, hbMarkPress, hbMarksRepaint, hbBoardReplyMeta, HB_NEXT_MAX, HB_NEXT_TOP, hbNextCandidates, hbNextQuestions, hbNextHtml, hbFollowUpRead, HB_RD_PARTS, HB_FIX_WINDOW_MS, hbRdWords, hbReadingSnap, hbReadingAfter, hbReadingLive, hbReadingHtml, hbReadingSet, hbRdToggle, hbDockRepaint, HB_WORD_SPLIT, HB_WORD_MEASURE, HB_WORD_STAGE, HB_WORD_KINDS, hbWords, hbWordPhrase, hbWordsApply, hbWordClash, hbWordsBuiltIn, hbWordsGuide, hbNameAsked, HB_NAME_ASK_RE, hbAnswerCount, hbAnswerSet, hbAnswerSay, HB_FOUND_TITLE_MAX, hbFoundTitle, hbFoundSay, hbProseChecked, hbCopilotTail, hbFeedbackSend, HB_LS, HB_FACES, HB_FACE_ICON, hbFaceWordsHtml, HB_LENSES, HB_PREP, HB_FIGS, HB_FIG_KEYS, HB_KINDS, HB_KIND_KEYS, HB_AMOUNT_Q, hbLeadSay,
  HB_PANELS_MAX, HB_PATH_MAX, HB_ROWS_MAX, HB_WATCH_MAX, hbS, hbSave, hbFresh, hbFace, hbSideOf, hbInLens, hbBook,
  hbBookData, hbFigNumber, hbSeenNow, hbSeenTick, hbMoved, hbAgentsData, hbPanelData, hbDigData, hbCardData,
  HB_RX, hbFindContract, hbOpenRef, HB_OPEN_REF_LEAD, hbParse, hbListOf, hbRef, hbDayWords, hbHeadHtml, hbBookHtml, hbPrepHtml, hbDeltaHtml, hbRowHtml, hbListHtml,
  hbOblRowsHtml, hbDigBodyHtml, hbFocusHtml, hbCrumbOf, hbCardHtml, hbSheetGo, hbBarsHtml, hbPanelBodyHtml, hbPanelHtml,
  hbBoardHtml, hbWatchFormHtml, hbWatchFired, hbGiveFormHtml, hbPaintBoard, hbPaintHead, hbApplyScreen,
  hbApplyFace, hbMount, hbAfterMount, hbRender, hbOpenExplorer, hbSetFace, hbSetLens, hbLensOnMap, hbShowOnMap, hbDig, hbAddPanel,
  hbAsk, hbFigSay, hbPanelSay, hbSuggestions, hbPlaceholder, hbWatchAlerts, hbGiftsFor, hbGiftsLoad, hbGive,
  hbUngive, hbDropGift, hbToolsPaint, hbSetTool, hbInkClear, hbPresent, hbPlace, hbPlacePut, hbOnClick, hbOnSubmit, hbOnKey, hbHelloInner, hbFocusKey, hbShowFound, HB_KEY_SEP, HB_CHART_BARS, HB_CHART_MONTHS, HB_GROUP_FIELDS, hbNextGroup, hbGroupOf, hbGroupLabel, hbGroupWord, hbMonthOf, hbMonthLabel, hbValueBands, hbChartHtml, hbChartBarsHtml, hbChartColsHtml, hbListFootHtml,
  HB_ATTENTION_RE, HB_HUES, HB_HUES_LIGHT, HB_HUES_DARK, hbHues, hbHueOf, hbFitMeasure, hbStepH, hbChartTableHtml, hbFocusBodyHtml, hbStartOf, hbObOpen, hbGroupsOf, hbRingSvg, hbBlocksSvg, hbTimelineSvg, hbBubblesSvg, hbBarsFamily,
  HB_PICS, HB_MEASURES, HB_UNITS, HB_DATES, HB_SPLIT_GROUPS, HB_TREND_MIN_N, HB_TREND_MIN_PTS, HB_COLS_MAX, HB_RC, hbRecipeRead, hbPlan, hbPlanBase, hbPlanFix,
  hbDateOf, hbMeasure, hbMeasureOne, hbMeasureFmt, hbBucketOf, hbBucketLabel, hbInBucket, hbTrendOf, hbColsSvg, hbLiveSvg, hbSnapsLoad, hbSnapsSet, hbGroupBars, hbSplitWord, hbPicWord,
  hbRcOptions, hbRcShown, hbShowCard, hbAnchorOf, HB_ANCHOR_MS, hbRecipeRowHtml, hbRecipeSet, hbRecipeClean, hbFoundChart,
  hbRootKey, hbCountKey, hbCountIds, hbCounted, hbCountLabel, hbCountChipHtml, hbAskInPanel,
  HB_INS, HB_INS_SHAPES, HB_INS_MEASURED, HB_INS_V, HB_INS_MAX, HB_INS_REST_DAYS, HB_INS_NORM_PTS, HB_INS_MINE_MIN, hbInsKey, hbInsId, hbInsOf, hbInsViewWord, hbInsChart, hbInsCandidate, hbInsCandidateMemo,
  hbMovedFromStart, hbBackToStart, hbStartBtnHtml, hbPayFigs, hbPayKpiHtml, hbFigSeries,
  hbInsScope, hbInsNormal, hbInsRenNormal, hbInsFinding, hbInsFindingMemo, hbInsightsToday, hbInsUsual, hbInsUsualOpen, hbInsWhy, hbInsResting, hbInsBookSig,
  hbInsThumb, HB_INS_PIC_M, HB_INS_PIC_Q, HB_INS_PIC_BARS, hbInsPicCols, hbNumWord, hbInsPicHtml, hbInsRowHtml, hbShelfHtml, hbPanelWord, hbAddView, hbViewPanelHtml, hbInsAct, hbKeptSync,
  hbBigBtnHtml, hbReadingOf, hbReadHtml, hbWhySig, hbWhyKept, hbWhyPrompt, hbWhyCheck, hbWhyAsk, hbWhyFollow, HB_WHY_KEEP,
  hbBoardNow, HB_BOARD_NOW_MAX, hbUsefulGroup, hbTrendFmt, HB_WHY_ASK_RE, HB_FU, hbOpenListKey, hbBoardEdit, hbFollowUp, hbBoardTakes, hbAxisTop,
  HB_PICS2, HB_SORTS, HB_DIRS, HB_COMPARES, HB_TOP_MAX, HB_TITLE_MAX, HB_SERIES_MAX, HB_HEAT_MAX, HB_WIN_MAX, HB_RC_GW, HB_RC_NUMS, HB_WIN_PRESETS, HB_SPLIT_WORDS, HB_UNIT_WORDS,
  hbCardClean, hbCardPlan, hbPlanSpec, hbCardSet, hbCardSetPart, hbSplitClean, hbWindowClean, hbVsClean, hbPeriodWord, hbCmpPrevWord, hbBucketGap, hbCmpY, hbPlainText, hbWinOf, hbWinWord, hbWindowCut, hbWinCs,
  hbGroupsCut, hbGroupsSorted, hbIsGroupDim, hbRestDig, hbKeptGroups, hbSeriesOf, hbXOf, hbCellDig, hbStackSvg, hbHeatSvg, hbCompareSvg, hbCmpChange, hbChartRun,
  hbCardEdit, hbHowWord, hbRecipeWords, hbSplitModelWord, hbOrderWord, hbReadCompareOf, hbReadTwoOf, hbReadingCore, hbRcCur, hbRcCurHas,
  hbBucketPrev, hbBucketMove, hbBucketStart, hbBucketEnd, hbWinSpanOk,
  HB_BOARD_ACTIONS, HB_ACTIONS_MAX, hbWhichOf, hbAddCard, hbPanelAct, hbCrumb, hbArrange, hbPanelName, hbActionClean, hbCardRef, hbBoardApply, hbRcMoreToggle, HB_GUIDE_TOP, HB_GUIDE_MAX, hbDataGuide,
  HB_CHK_GROUPS_MAX, HB_CHK_EMPTY_SHARE, hbCardCheck, hbActionCheck, hbActionsCheck, hbRepairNote, hbActionTitle, hbBoardTakesChecked, hbBoardNoMap, hbMapAsked, hbRecipeOfRead, hbOpenOne, HB_BRING_RE, hbBringOf, HB_MAP_FIELDS, HB_NAMES_CHART_RE,
  HB_UNDO_MAX, hbShapeOf, hbUndoMark, hbUndoTop, hbUndo, hbNoteUndo, hbUndoHtml, hbTakeMeta, hbPreviewHtml, hbIsBig, hbActionWords, hbBoardAnswer, hbPreviewPress, hbPreviewSettle,
  HB_CHOICES_MAX, hbAmbiguity, hbChoicePress, hbHost, hbPage, HB_CMD_RE, HB_BRAIN_VERB_RE, HB_CHART_WORD_RE, hbBrainVerb, hbChartWords, hbQuestionAsk, hbCommandAsk, hbDrawAsk, HB_FLAT_KINDS, hbDrawsSomething,
  HB_TELL_RE, HB_EXPLAIN_KINDS, hbSubjectDraws, hbTellSubject, hbDrawWordsOf, HB_TWEAK_RE, hbExplainsDrawn, HB_MORE_RE, hbMoreAsk });
