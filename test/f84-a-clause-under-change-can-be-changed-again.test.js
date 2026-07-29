/* F84 — a clause with an open ask on it can still be worked on.

   The AI rewrite path had a guard on it, and the guard was right about the
   danger and wrong about the boundary. Selecting wording inside a clause that
   is under an undecided change was refused outright, on the reasoning that the
   text on screen — kept words, inserted words, struck-through words — exists in
   no single version of the clause, so a rewrite has nowhere to be placed back.

   That reasoning holds for a selection that CROSSES THE SEAM of a redline. It
   does not hold for the wording either side of one. And the clause with an open
   ask on it is exactly the clause most likely to need one more pass — you
   propose sixty days, someone reads it, you want to say sixty days from the
   invoice date. Under the old guard that required abandoning or deciding the
   ask first, which is not how a person works on wording.

   The fix is a distinction the model was already making everywhere else, and
   which Direct Edit had been making since it was written:

       PROPOSE against the working text — the clause as it would read if the
       pending change were accepted, which is the wording on screen.

       FILE against the baseline — so the change on the table stays one diff
       from the settled text however many passes it takes, and rejecting it
       still returns the original exactly.

   These assertions run on the real js/views/doclab.js. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadLab(){
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
  const win = { FIRST_PARTY: 'Wanjiru Catering Ltd' };
  const ctx = vm.createContext({
    window: win, localStorage, JSON, Math, console,
    nowISO: () => '2026-07-28T14:30:00.000Z'
  });
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
  vm.runInContext(src, ctx, { filename: 'doclab.js' });
  return win;
}

const BASE = 'The Supplier shall invoice monthly and the Customer shall pay within thirty (30) days.';
const ROUND1 = 'The Supplier shall invoice monthly and the Customer shall pay within sixty (60) days.';

const CLAUSE = { clauseId: 'c12', headingText: 'Payment', text: BASE };

/* A lab holding one clause with one undecided change on it, filed by us. */
function labWithOpenAsk(lab){
  const l = { threads: [], changes: [], nextId: 1 };
  lab.labFileChange(l, { clauseId: 'c12', clauseLabel: 'Payment',
    before: BASE, after: ROUND1, side: 'us', author: 'Wanjiru' });
  return l;
}

describe('F84a — what a new edit anchors to', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('with nothing pending, the working text is the clause itself', () => {
    const w = lab.labWorkingText(CLAUSE, [], 'us');
    assert.equal(w.base, BASE);
    assert.equal(w.working, BASE, 'no change on the clause means nothing to read past');
    assert.equal(w.pending, null);
  });

  test('with an open ask, the working text is the clause AS PROPOSED', () => {
    const l = labWithOpenAsk(lab);
    const w = lab.labWorkingText(CLAUSE, l.changes, 'us');
    assert.equal(w.base, BASE, 'the baseline is untouched — it is what rejection returns to');
    assert.equal(w.working, ROUND1,
      'the wording on screen is the proposed wording, and that is what a rewrite lands on');
    assert.equal(w.pending.id, 'L-001');
  });

  /* THE BUG, STATED DIRECTLY. "sixty (60) days" is wording we ourselves put
     there one pass ago. It appears nowhere in the baseline, so a guard that
     looked at the baseline refused to let us touch it. */
  test('wording introduced by the open ask is findable — this is what was refused', () => {
    const l = labWithOpenAsk(lab);
    const w = lab.labWorkingText(CLAUSE, l.changes, 'us');
    assert.ok(!w.base.includes('sixty (60) days'),
      'the baseline does not contain it — which is why the old guard said no');
    assert.ok(w.working.includes('sixty (60) days'),
      'but the clause as it reads does contain it, and that is what the person selected');
  });

  test('an unsent draft is invisible to the other side, so their working text is the baseline', () => {
    const l = labWithOpenAsk(lab);                  // filed by us, never sent
    assert.equal(lab.labWorkingText(CLAUSE, l.changes, 'them').working, BASE,
      'a draft we have not sent must not steer what the counterparty is editing');
  });

  test('once sent, both sides work on the same wording', () => {
    const l = labWithOpenAsk(lab);
    lab.labSendChange(l, 'L-001');
    assert.equal(lab.labWorkingText(CLAUSE, l.changes, 'them').working, ROUND1);
    assert.equal(lab.labWorkingText(CLAUSE, l.changes, 'us').working, ROUND1);
  });

  test('an accepted change becomes the baseline, not something to read past', () => {
    const l = labWithOpenAsk(lab);
    lab.labSendChange(l, 'L-001');
    lab.labDecide(l, 'L-001', 'accepted', { name: 'Erik' }, 'them');
    const w = lab.labWorkingText(CLAUSE, l.changes, 'us');
    assert.equal(w.base, ROUND1, 'settled wording IS the baseline now');
    assert.equal(w.working, ROUND1);
    assert.equal(w.pending, null, 'nothing is awaiting a decision any more');
  });
});

describe('F84b — a second pass revises the ask rather than stacking a new one', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  /* The whole point of the fix, end to end: rewrite wording that only exists
     inside the pending change, and file the result. */
  test('the revision is one change, still measured from the baseline', () => {
    const l = labWithOpenAsk(lab);
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'us');

    // what labAiPropose does with the edited suggestion
    const selected = 'sixty (60) days';
    assert.ok(working.includes(selected), 'precondition: the guard now lets this through');
    const proposed = working.replace(selected, 'sixty (60) days of the invoice date');

    const ch = lab.labFileChange(l, { clauseId: 'c12', clauseLabel: 'Payment',
      before: base, after: proposed, side: 'us', author: 'Wanjiru · Copilot (Soften), edited' });

    assert.equal(l.changes.length, 1, 'one clause, one ask — a second pass is a revision');
    assert.equal(ch.id, 'L-001', 'and it is the same change, so its notes and threads survive');
    assert.equal(ch.before, BASE,
      'BEFORE STAYS THE BASELINE. A revision that reset it would make the diff read as '
      + 'though the first pass had been agreed, which nobody did');
    assert.match(ch.after, /sixty \(60\) days of the invoice date/);
    assert.equal(ch.revised, 1);
  });

  test('a revised ask goes back in hand, because the other side answered something else', () => {
    const l = labWithOpenAsk(lab);
    lab.labSendChange(l, 'L-001');
    assert.equal(l.changes[0].sent, true);
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'us');
    lab.labFileChange(l, { clauseId: 'c12', before: base,
      after: working.replace('sixty (60) days', 'ninety (90) days'), side: 'us', author: 'Wanjiru' });
    assert.equal(l.changes[0].sent, false,
      'wording they have not seen must not sit on their table as though they had');
  });

  /* The property the whole "build, never mutate" model exists to protect, and
     the one a stacking bug would have quietly broken. */
  test('after two passes, rejecting still reproduces the original exactly', () => {
    const l = labWithOpenAsk(lab);
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'us');
    lab.labFileChange(l, { clauseId: 'c12', before: base,
      after: working.replace('sixty (60) days', 'ninety (90) days'), side: 'us', author: 'Wanjiru' });
    lab.labSendChange(l, 'L-001');
    lab.labDecide(l, 'L-001', 'rejected', { name: 'Erik' }, 'them');
    assert.equal(lab.labClauseText(CLAUSE, l.changes), BASE,
      'two passes and a rejection must leave the clause exactly as it was drafted');
  });

  test('a counter-proposal from the other side is their own change, also from the baseline', () => {
    const l = labWithOpenAsk(lab);
    lab.labSendChange(l, 'L-001');
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'them');
    assert.equal(working, ROUND1, 'they are answering the wording we put on the table');
    const theirs = lab.labFileChange(l, { clauseId: 'c12', before: base,
      after: working.replace('sixty (60) days', 'forty-five (45) days'), side: 'them', author: 'Erik' });
    assert.equal(theirs.id, 'L-002', 'their ask is their own, not an edit of ours');
    assert.equal(theirs.before, BASE, 'and it too is a diff from the settled wording');
    assert.equal(l.changes.length, 2);
  });
});

describe('F84c — the seam is still refused', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  /* The danger the original guard was written against is real and is unchanged.
     A selection dragged across a redline picks up struck-through wording
     together with the wording that replaced it, and that string is in neither
     version. There is nowhere honest to put an answer back, and the fallback it
     used to have — replace the whole clause — loses wording nobody agreed to
     lose. */
  test('a selection spanning both sides of a redline is in no version', () => {
    const l = labWithOpenAsk(lab);
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'us');
    const acrossTheSeam = 'thirty (30) dayssixty (60) days';   // what the DOM hands back
    assert.ok(!base.includes(acrossTheSeam));
    assert.ok(!working.includes(acrossTheSeam),
      'widening the guard to the working text must not make the seam findable');
  });

  test('wording already struck out is not in the working text either', () => {
    const l = labWithOpenAsk(lab);
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'us');
    assert.ok(base.includes('thirty (30) days'), 'it is still on screen, struck through');
    assert.ok(!working.includes('thirty (30) days'),
      'but it is on its way out, so there is nothing to rewrite — and the message says so');
  });

  test('wording untouched by the redline is findable in both, as it always was', () => {
    const l = labWithOpenAsk(lab);
    const { base, working } = lab.labWorkingText(CLAUSE, l.changes, 'us');
    for (const settled of ['The Supplier shall invoice monthly', 'the Customer shall pay within']){
      assert.ok(base.includes(settled) && working.includes(settled),
        `"${settled}" is common ground and must stay editable`);
    }
  });
});

describe('F84d — the guard and the anchor are in the shipped file', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');

  test('the AI path anchors on the working text, not the baseline', () => {
    assert.ok(!/if\(!clause\.text\.includes\(text\)\)/.test(src),
      'the baseline-anchored guard is retired');
    /* The guard resolves an offset in the working text and refuses when there
       is none. f85 covers which occurrence that offset lands on; what is
       asserted here is only that `working` is what it searches. */
    assert.ok(/labPickOccurrence\(working, text, ctx\.hint\)/.test(src),
      'the guard now asks where in the wording it would replace the selection sits');
    assert.ok(/if\(at < 0\)\{/.test(src), 'and refuses when the answer is nowhere');
  });

  /* The splice itself is pinned in f85, which is where the offset it uses comes
     from. What matters here is only that it runs against the WORKING text. */
  test('the replacement is spliced into the working text', () => {
    assert.ok(/working\.slice\(0, at\) \+ t \+ working\.slice\(at \+ text\.length\)/.test(src));
  });

  /* Found while moving this line, and it predates the guard entirely. A
     replacement passed to String.replace as a STRING is scanned for $&, $` and
     $$ even when the pattern is a plain string. Contract wording carries money.
     Splicing with slice() has no substitution behaviour at all, so the class of
     bug is gone rather than avoided. */
  test('a suggestion containing $$ would have been corrupted by the string form', () => {
    const clause = 'The Customer shall pay the sum on signature.';
    const selected = 'the sum';
    const suggestion = 'a deposit of US$$500';

    const naive = clause.replace(selected, suggestion);
    assert.ok(!naive.includes('US$$500'),
      'precondition: the string form corrupts it — this is the bug being pinned');
    assert.match(naive, /US\$500/, 'and it does so by silently halving the dollar signs');

    const at = clause.indexOf(selected);
    const safe = clause.slice(0, at) + suggestion + clause.slice(at + selected.length);
    assert.match(safe, /a deposit of US\$\$500/,
      'the splice files the wording the person actually approved');
  });

  test('and no String.replace splice remains in the AI path', () => {
    const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!/\.replace\(text[,)]/.test(code),
      'a splice site using replace() would reopen both this and the wrong-occurrence bug');
  });

  test('but the change is still filed from the baseline', () => {
    assert.ok(/before: base, after: proposed/.test(src),
      'filing from the working text would make each pass look like an agreed step');
  });

  /* Both entry points into the menu have to carry the same anchor, or the
     toolbar's AI Assist would send the baseline wording to the model and then
     be refused by a guard reading the proposed text. */
  test('both entry points carry the working text', () => {
    const hits = src.match(/labWorkingText\(cl, lab\.changes, side\)/g) || [];
    assert.ok(hits.length >= 2,
      `the selection handler and the clause toolbar must both use it — found ${hits.length}`);
  });
});
