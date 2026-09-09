/* ============================================================
   THE STANDARDS PAGE'S OWN READINGS (owner-approved design, 9 Sep 2026)
   ============================================================
   Three questions the Our standards page asks and nothing answered before:

     · what STANCE does a clause carry — required or preferred — so the closed
       row can say it without opening anything (owner's ruling 1);
     · what would a FIRST playbook look like for a workspace that has none,
       read off the contracts that company has already signed (idea 21);
     · what do the rounds we have SETTLED this quarter say our standards should
       be (idea 20).

   A READING WITH NO VIEW, on the shelf js/precedent.js and js/payterms.js
   already sit on: it annotates nothing, writes nothing, and asks the three
   files it needs through `typeof` so a stage without them answers honestly
   rather than confidently. THERE IS NO ROUTE AND THERE MUST NEVER BE ONE —
   what a company signs and where it settles is that workspace's own business,
   and every figure here is counted in the browser off `state.contracts`, the
   caller's already-scoped bootstrap.

   COUNTING, NOT MODELLING. No model is asked anything by this file. Every
   number can be opened to the contracts or rounds it was read from, which is
   the whole reason a person can be asked to trust it. */

/* A quarter. The window idea 20 reads, and it is a WINDOW rather than a
   cadence: a proposal to move a standing position should rest on how the
   company is behaving now, not on something it did two years ago. */
const STD_WINDOW_DAYS = 92;
/* The same floor js/precedent.js already uses, for the same reason: a figure
   settled once is an anecdote. Asked of the WINDOW, so a subject argued twice
   this quarter is not proposed — which is correct, and is why a young
   workspace sees nothing here rather than a proposal built on two rounds. */
const STD_MIN_ROUNDS = (typeof PRECEDENT_MIN === 'number') ? PRECEDENT_MIN : 3;
/* Idea 21's own floor: how many signed contracts must carry a fact before the
   commonest value is worth calling a pattern. */
const STD_DRAFT_MIN = 3;
/* And how much of a majority. Below this the book does not agree with itself,
   and the honest answer is to propose nothing rather than pick a winner. */
const STD_DRAFT_SHARE = 0.5;

const _stdLib = () => (typeof clauseLibrary === 'function') ? (clauseLibrary() || []) : [];
const _stdPb = () => {
  if (typeof playbook === 'function') { try { return playbook() || {}; } catch (_) { /* no state */ } }
  return (typeof DEFAULT_PLAYBOOK === 'object' && DEFAULT_PLAYBOOK) || {};
};
const _stdBase = () => {
  const pb = _stdPb();
  return pb._default || ((typeof DEFAULT_PLAYBOOK === 'object' && DEFAULT_PLAYBOOK) || {})._default || {};
};
const _stdSame = (a, b) => String(a == null ? '' : a).trim().toLowerCase()
  === String(b == null ? '' : b).trim().toLowerCase();

/* ---- 1 · THE STANCE A CLAUSE CARRIES -------------------------------------
   Owner's ruling: the closed row shows Required or Preferred, which today
   lives on the Negotiation playbook tab.

   READ EVERY TIME IT IS DRAWN, NEVER STORED. That was the whole condition on
   showing it here: one fact drawn in two places is the thing that drifts, and
   a reading cannot drift from its own source.

   THE BASELINE IS WHAT IT REPORTS WHERE THERE IS ONE, and that is the only
   honest single answer. A stance is per contract TYPE — a liability cap is
   preferred on supply paper and required on services — so there is no one
   stance for a clause. What IS true of every contract is the _default block,
   so that is the chip; where a type is stricter the row says so on its hover
   rather than over-stating in a word. A RANGE counts as a preference with an
   outer limit, which is what a range is.

   WHERE THERE IS NO BASELINE AT ALL the answer is `scope:'some'` rather than
   silence — see the note at that branch — and a clause no type mentions
   returns null and the row draws nothing. */
const STD_STANCE_RANK = { forbidden: 3, required: 3, preferred: 1 };
function stdStanceOf(cl){
  if (!cl) return null;
  const base = _stdBase();
  const hit = (list) => (Array.isArray(list) ? list : []).find(p => p
    && ((cl.id && p.clause && p.clause === cl.id) || _stdSame(p.category, cl.category)));
  const bp = hit(base.positions);
  let pos = bp ? String(bp.pos || '') : '';
  if (!pos) {
    const rg = (Array.isArray(base.ranges) ? base.ranges : [])
      .find(r => r && _stdSame(r.label, cl.category));
    if (rg) pos = 'preferred';
  }
  /* WHAT THE TYPES SAY, gathered once and read two ways below. Named by the
     type's own label, because that is what a reader will look for on the
     Negotiation playbook tab. */
  const types = [];
  const pb = _stdPb();
  for (const key of Object.keys(pb)) {
    if (key === '_default') continue;
    const t = pb[key]; if (!t) continue;
    const tp = hit(t.positions);
    if (tp && tp.pos) types.push({ key, label: t.label || key, pos: tp.pos });
  }
  /* A BASELINE IS TRUE OF EVERY CONTRACT, so it is what the chip says; a type
     that is STRICTER rides the hover rather than over-stating in one word. */
  if (pos) {
    const rank = STD_STANCE_RANK[pos] || 0;
    return { pos, scope: 'all', from: bp ? 'position' : 'range',
      types: types.filter(t => (STD_STANCE_RANK[t.pos] || 0) > rank) };
  }
  /* WITH NO BASELINE, SAYING NOTHING IS THE LEAST USEFUL HONEST ANSWER.
     Confidentiality is required on services paper and carries no baseline at
     all, so a silent row tells a reader nothing about the clause they push
     hardest on. The chip states the strongest stance any type takes and marks
     itself PARTIAL — a quieter chip, and the types named on its hover — which
     is true where a bare word would not be. */
  if (!types.length) return null;
  const strongest = types.slice().sort((a, b) =>
    (STD_STANCE_RANK[b.pos] || 0) - (STD_STANCE_RANK[a.pos] || 0)
    || (a.label < b.label ? -1 : a.label > b.label ? 1 : 0))[0];
  return { pos: strongest.pos, scope: 'some', from: 'position',
    types: types.filter(t => t.pos === strongest.pos) };
}

/* ---- 2 · WHAT THE FALLBACK SAYS, SHORT ------------------------------------
   The closed row carries the fallback as a figure where the wording carries
   one — "Fallback 45 days" is the fact a person is actually deciding against.
   READ FROM THE WORDING, never stored beside it, and precedentFigure is the
   ONE reader: it already knows "forty-five (45) days" as well as "45 days",
   which is how legal drafting and this product's own library both write a
   number. Where it can read none the row says only that a fallback exists. */
const STD_UNITS = [['days?', 'days'], ['months?', 'months'], ['years?', 'years']];
function stdFigureIn(text){
  if (typeof precedentFigure !== 'function') return null;
  for (const [re, unit] of STD_UNITS) {
    const n = precedentFigure(text, re);
    if (n != null) return { figure: n, unit };
  }
  return null;
}
function stdFallbackOf(cl){
  const t = String((cl && cl.fallback) || '').trim();
  if (!t) return null;
  return Object.assign({ text: t }, stdFigureIn(t) || { figure: null, unit: null });
}
const stdPreferredFigure = cl => stdFigureIn(String((cl && cl.preferred) || ''));

/* ---- 3 · WHAT THIS QUARTER'S SETTLED ROUNDS SAY (idea 20) ------------------
   js/precedent.js already mines settled rounds and already proposes a
   FALLBACK; this is that reading widened, not a second one beside it —
   precedentMine does the counting, PRECEDENT_MIN is the floor, and the worst
   REPEATED figure is still the line (never an average, which is a number
   nobody signed, and never the extreme, which may be the one deal everybody
   regrets).

   TWO THINGS ARE NEW AND ONLY TWO. It reads a WINDOW, and it compares the
   settled figure against the PREFERRED as well as the fallback.

   AND THE SECOND OF THOSE REVERSES A RULE THIS PRODUCT HAD WRITTEN DOWN,
   which is said out loud rather than slipped in. precedentSuggestions' own
   note reads: "THE ONLY SUGGESTION MADE IS ABOUT THE FALLBACK, never the
   preferred position. A preferred position is what the company wants; history
   cannot argue with an aspiration." That reasoning is real and is kept here in
   full. What the owner ruled against it (9 Sep 2026) is the other half: where
   a company settles at 45 in seven of nine rounds, asking for 30 is not an
   aspiration, it is a round of negotiation spent every time for a figure
   nobody gets. So the proposal is MADE — and adopting one opens the clause
   editor rather than writing, because the preferred is the wording HaTi
   drafts with and a person should read a change to it before it ships.
   precedentSuggestions itself is UNTOUCHED and still proposes fallbacks only. */
/* THE ONE READING OF "WHERE THIS SUBJECT SETTLES" — the worst figure this
   workspace has agreed to more than once. Lifted out because the quarterly
   card and the clause row's own history line both print it, and two copies of
   this arithmetic is how a card and a row come to disagree about one number.
   Null below the floor, which is what makes silence the honest default. */
function stdHeld(row, topic, min){
  if (!row || !topic || !topic.num || !topic.unit) return null;
  const settled = row.numbers.oursAccepted.concat(row.numbers.theirsAccepted)
    .filter(n => n != null && isFinite(n));
  if (settled.length < (min == null ? STD_MIN_ROUNDS : min)) return null;
  const counts = new Map();
  for (const n of settled) counts.set(n, (counts.get(n) || 0) + 1);
  const repeated = [...counts.entries()].filter(([, n]) => n > 1).map(([v]) => v);
  if (!repeated.length) return null;
  const held = (topic.dir === 'lower-is-worse') ? Math.min(...repeated) : Math.max(...repeated);
  return { figure: held, unit: topic.unit, seen: counts.get(held) || 0, settled: settled.length };
}

/* This clause's own history, for the line inside its open row. Unwindowed —
   the row is answering "where has this ever landed", not "what should change
   this quarter" — and it is the same arithmetic the card uses. */
function stdHistoryFor(cl){
  if (!cl || typeof precedentMine !== 'function' || !Array.isArray(window.PRECEDENT_TOPICS)) return null;
  const t = PRECEDENT_TOPICS.find(x => x.clause === cl.id
    || _stdSame(x.category, cl.category));
  if (!t) return null;
  let mined = null;
  try { mined = precedentMine(); } catch (_) { return null; }
  const h = stdHeld(mined && mined[t.key], t);
  return h ? Object.assign({ key: t.key, category: t.category }, h) : null;
}

function stdWindow(days){
  const n = Number(days) > 0 ? Number(days) : STD_WINDOW_DAYS;
  const to = new Date();
  const from = new Date(to.getTime() - n * 86400000);
  return { from, to, days: n };
}
function stdLearned(opts = {}){
  if (typeof precedentMine !== 'function' || !Array.isArray(window.PRECEDENT_TOPICS))
    return null;
  const win = stdWindow(opts.days);
  let mined = null;
  try { mined = precedentMine({ since: win.from.toISOString() }); } catch (_) { mined = null; }
  if (!mined) return null;
  const lib = _stdLib();
  const byId = new Map(lib.map(cl => [cl.id, cl]));
  const proposals = [], holding = [];
  let rounds = 0;
  for (const t of PRECEDENT_TOPICS) {
    const row = mined[t.key];
    if (!row || !t.num || !t.unit) continue;
    rounds += row.total || 0;
    const h = stdHeld(row, t);
    if (!h) continue;
    const held = h.figure;
    const cl = byId.get(t.clause) || null;
    const fb = cl ? stdFallbackOf(cl) : null;
    const pf = cl ? stdPreferredFigure(cl) : null;
    /* WHICH LINE NEEDS MOVING, and it can be neither, one, or both. */
    const moves = [];
    if (cl && pf && pf.figure !== held) moves.push('preferred');
    if (cl && fb && fb.figure !== held) moves.push('fallback');
    const base = { key: t.key, category: t.category, clause: t.clause,
      figure: held, unit: t.unit, seen: h.seen, settled: h.settled,
      preferredFigure: pf ? pf.figure : null, fallbackFigure: fb ? fb.figure : null,
      contracts: (row.contracts || []).slice(0,
        (typeof PRECEDENT_EXAMPLES === 'number') ? PRECEDENT_EXAMPLES : 3) };
    /* A POSITION THAT IS HOLDING SAYS SO AND OFFERS NOTHING. A card where
       every row demands a decision is one people stop opening. */
    if (moves.length) proposals.push(Object.assign(base, { moves }));
    else holding.push(base);
  }
  return { window: win, rounds, proposals, holding };
}

/* ---- 4 · A FIRST PLAYBOOK, READ OFF WHAT WAS SIGNED (idea 21) -------------
   For a workspace with no standards at all, the page today is three empty tabs
   and an Add button — which is the state a new customer meets on day one, so
   it is the state that decides whether they ever set standards.

   IT READS THE RECORD, NOT THE WORDING. Every figure comes off `metadata`,
   which IS this product's reading of a contract: extracted on upload, printed
   back with the verbatim span it came from, and confirmed by a person on the
   Key terms panel. So every count here traces to a field somebody has already
   seen. Re-reading 34 agreements to derive a standard would be slower, would
   need a model, and would rest on nothing anybody had checked.

   WHAT IT THEREFORE CANNOT PROPOSE IS NAMED, NEVER GUESSED. A confidentiality
   duration and a liability cap in months are not fields the record holds, so
   they come back under `unreadable` and the screen says so. A cap or an
   omission is a FACT — the standing rule — and inventing a standard is the one
   thing this feature must never do. */
const STD_DRAFT_SUBJECTS = [
  { key: 'law', category: 'Governing law', clause: 'cl-law', kind: 'text',
    read: c => String((c.metadata && c.metadata.governingLaw) || '').trim() },
  { key: 'payment', category: 'Payment terms', clause: 'cl-pay', kind: 'days',
    read: c => (typeof payDays === 'function') ? payDays(c) : null },
  { key: 'term', category: 'Termination', clause: 'cl-term', kind: 'days',
    read: c => { const n = Number(c.metadata && c.metadata.noticePeriodDays);
      return isFinite(n) && n > 0 ? n : null; } },
  { key: 'liability', category: 'Liability cap', clause: 'cl-liab', kind: 'text',
    read: c => { const v = String((c.metadata && c.metadata.liabilityCapped) || '').trim();
      return (v === 'capped' || v === 'uncapped') ? v : ''; } },
];
/* The subjects the library holds a clause for and this reading cannot answer.
   Listed so the screen can say which ones the customer has to write by hand. */
const STD_DRAFT_UNREADABLE = ['Confidentiality', 'Data protection'];

const stdSignedBook = () => ((window.state && Array.isArray(state.contracts)) ? state.contracts : [])
  .filter(c => c && c.status === 'Signed' && !(c.archived && c.archived.at));

function stdDraftFromSigned(){
  const signed = stdSignedBook();
  const lib = _stdLib();
  const byId = new Map(lib.map(cl => [cl.id, cl]));
  const rows = [];
  for (const s of STD_DRAFT_SUBJECTS) {
    const vals = [];
    for (const c of signed) {
      let v = null;
      try { v = s.read(c); } catch (_) { v = null; }
      if (v == null || v === '' || (s.kind === 'days' && !isFinite(v))) continue;
      vals.push(v);
    }
    const have = vals.length;
    const counts = new Map();
    for (const v of vals) {
      const k = (s.kind === 'days') ? String(v) : String(v).trim().toLowerCase();
      const e = counts.get(k) || { n: 0, sample: v };
      e.n++; counts.set(k, e);
    }
    /* The commonest value, and a stable order so two runs agree: by count,
       then by the value itself. */
    const ranked = [...counts.entries()].sort((a, b) => (b[1].n - a[1].n)
      || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    const top = ranked.length ? ranked[0] : null;
    const seen = top ? top[1].n : 0;
    const share = have ? seen / have : 0;
    const usual = top ? top[1].sample : null;
    /* WHAT THE STANDARD SAYS TODAY, so the row can be read as a comparison
       rather than as an instruction. Only a figure is comparable — where the
       standard is prose there is nothing to line up against a counted value,
       and the row says what was signed and leaves the judgement alone. */
    const cl = byId.get(s.clause) || null;
    const cur = (cl && s.kind === 'days') ? stdPreferredFigure(cl) : null;
    const current = cur ? cur.figure : null;
    const agrees = (current != null && usual != null) ? Number(current) === Number(usual) : null;
    rows.push({ key: s.key, category: s.category, clause: s.clause, kind: s.kind,
      value: usual, seen, have, signed: signed.length,
      confidence: have ? Math.round(share * 100) : 0,
      distinct: counts.size,
      current, agrees,
      /* PROPOSED means there is a pattern AND it differs from what the
         standard already says. Where they agree the row is good news and
         offers nothing — a table where every row demands a decision is one
         nobody reads to the end. */
      pattern: have >= STD_DRAFT_MIN && share >= STD_DRAFT_SHARE,
      proposed: have >= STD_DRAFT_MIN && share >= STD_DRAFT_SHARE && agrees === false });
  }
  return { signed: signed.length, rows,
    proposed: rows.filter(r => r.proposed).length,
    agreeing: rows.filter(r => r.agrees === true).length,
    unreadable: STD_DRAFT_UNREADABLE.slice() };
}

/* HAS THIS WORKSPACE SET ITS OWN STANDARDS, or is it still on HaTi's?
   THE DESIGN CALLED THIS "no standards yet" AND THAT STATE DOES NOT EXIST:
   clauseLibrary() and playbook() both fall back to HaTi's own defaults, so
   every workspace has six clauses and a baseline from its first minute. What
   IS real, detectable and exactly the day-one case idea 21 was drawn for is a
   workspace that has never SAVED either — it is running on wording somebody
   else wrote, which is the thing worth offering to fix. Saying "no standards
   yet" over six visible standards would be the page contradicting itself. */
function stdUsingDefaults(){
  const st = (window.state && state.settings) || {};
  return !Array.isArray(st.clauseLibrary) && !(st.playbook && typeof st.playbook === 'object');
}
/* And the offer is only worth making where the book can answer. Below the
   floor there is nothing to read and the page says nothing. */
function stdDraftWorthOffering(){
  return stdUsingDefaults() && stdSignedBook().length >= STD_DRAFT_MIN;
}

Object.assign(window, { STD_WINDOW_DAYS, STD_MIN_ROUNDS, STD_DRAFT_MIN, STD_DRAFT_SHARE,
  STD_STANCE_RANK, STD_DRAFT_SUBJECTS, STD_DRAFT_UNREADABLE,
  stdStanceOf, stdFigureIn, stdFallbackOf, stdPreferredFigure,
  stdWindow, stdHeld, stdHistoryFor, stdLearned, stdSignedBook, stdDraftFromSigned,
  stdUsingDefaults, stdDraftWorthOffering });
