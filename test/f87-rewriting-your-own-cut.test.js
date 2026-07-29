/* F87 — wording your own draft cuts can still be rewritten.

   The selection guard refused any selection of struck-through text, on one
   reading of what struck-through means: this wording is on its way out, so
   there is nothing to rewrite. That is true of a deletion the counterparty has
   READ. It is not true of one sitting in an unsent draft, where the only person
   who has ever seen it is the person now selecting it.

   The refusal made a small, ordinary act impossible. You cut a sub-clause, read
   the clause back, and decide it should be narrowed rather than removed — and
   the product told you to decide the change first. To alter your own draft you
   had to discard your own draft.

   So the test moved from "is this struck out" to WHO HAS SEEN IT:

     · unsent internal draft, ours alone  → rewrite it, and the cut becomes a
       replacement: the old wording still goes and the new wording lands where
       it was.
     · sent, or settled                   → still refused, because the
       counterparty is part-way through answering it and rewriting it underneath
       them changes the question after it was asked.

   The whole visible stack is tested, not just its head: a colleague can stack
   an unsent pass on top of an ask that already went out, and the deletion under
   it is very much on the table. */
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

/* redline.js first: the placement helpers live there and doclab reads them off
   the same window the browser gives it. */
function loadLab(){
  const store = new Map();
  const localStorage = {
    getItem: k => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => { store.set(k, String(v)); },
    removeItem: k => { store.delete(k); }
  };
  const win = { FIRST_PARTY: 'Wanjiru Catering Ltd' };
  const ctx = vm.createContext({
    window: win, localStorage, JSON, Math, console, Int32Array, Uint32Array,
    nowISO: () => '2026-07-28T14:30:00.000Z'
  });
  for (const f of ['redline.js', 'views/doclab.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'js', f), 'utf8'), ctx, { filename: f });
  return win;
}

const BASE = 'The Customer shall pay within thirty (30) days and shall provide audited accounts annually.';
/* The annual-accounts duty cut out. This is the draft the guard used to lock. */
const CUT  = 'The Customer shall pay within thirty (30) days.';
const STRUCK = 'audited accounts annually';

const SARAH = { userId: 'u1', name: 'Sarah Jenkins', organization: 'Wanjiru Catering Ltd', role: 'contributor' };
const PETER = { userId: 'u2', name: 'Peter Otieno',  organization: 'Wanjiru Catering Ltd', role: 'contributor' };

const newLab = () => ({ threads: [], changes: [], nextId: 1 });
const cut = (lab, l, who = SARAH, after = CUT) => lab.labFileChange(l, {
  clauseId: 'c1', clauseLabel: 'Payment', before: BASE, after,
  side: 'owner', authorRef: who, author: who.name });

describe('F87a — the selection really is unfindable, which is why this is needed', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  test('struck wording is in the baseline and not in the working text', () => {
    assert.ok(BASE.includes(STRUCK), 'it is on screen, struck through');
    assert.ok(!CUT.includes(STRUCK), 'and it is in no version of the proposed wording');
    assert.equal(lab.labPickOccurrence(CUT, STRUCK, 60), -1,
      'so the ordinary occurrence lookup cannot place it — hence the old refusal');
  });
});

describe('F87b — an unsent draft of our own is editable', () => {
  let lab, l;
  beforeEach(() => { lab = loadLab(); l = newLab(); });

  test('the stack is ours alone while nothing has been sent', () => {
    cut(lab, l);
    assert.equal(lab.labDraftOnlyStack(l.changes, 'c1', 'owner'), true);
  });

  test('a struck passage in it resolves to a place to put the answer', () => {
    cut(lab, l);
    const t = lab.labStruckTarget(BASE, CUT, STRUCK, l.changes, 'c1', 'owner', 60);
    assert.ok(t, 'THE FIX: this used to be a refusal');
    assert.equal(typeof t.at, 'number');
  });

  /* The seam, and what makes it the right answer: splicing there turns the cut
     into a replacement without disturbing anything the person did not select. */
  test('splicing at it turns the cut into a replacement', () => {
    cut(lab, l);
    const t = lab.labStruckTarget(BASE, CUT, STRUCK, l.changes, 'c1', 'owner', 60);
    const replacement = ' and shall provide unaudited management accounts annually';
    const proposed = CUT.slice(0, t.at) + replacement + CUT.slice(t.at);

    assert.ok(!proposed.includes('audited accounts annually'),
      'the wording that was cut is still cut');
    assert.ok(proposed.includes('unaudited management accounts'),
      'and the narrower duty is in its place');
    assert.ok(proposed.startsWith('The Customer shall pay within thirty (30) days.'),
      'the wording nobody selected is untouched, and reads as a sentence');
    assert.notEqual(proposed, BASE);
    assert.notEqual(proposed, CUT);
  });

  /* Requirement 3, and the reason the old message ended "Nothing was changed."
     The record the person was looking at is the record that moves. */
  test('applying UPDATES the existing change in place rather than filing a new one', () => {
    const first = cut(lab, l);
    assert.equal(first.id, 'L-001');
    const t = lab.labStruckTarget(BASE, CUT, STRUCK, l.changes, 'c1', 'owner', 60);
    const proposed = CUT.slice(0, t.at) + ' and shall provide management accounts' + CUT.slice(t.at);

    const again = lab.labFileChange(l, { clauseId: 'c1', clauseLabel: 'Payment',
      before: BASE, after: proposed, side: 'owner', authorRef: SARAH, author: 'Sarah Jenkins' });

    assert.equal(again.id, 'L-001', 'the same card, so its notes and threads survive');
    assert.equal(l.changes.length, 1, 'and no second ask on the same clause');
    assert.equal(again.revised, 1);
    assert.equal(again.before, BASE, 'still measured from the settled wording');
    assert.match(again.after, /management accounts/);
  });

  test('a colleague doing it stacks, which is the multi-author rule and not an exception', () => {
    cut(lab, l);
    const t = lab.labStruckTarget(BASE, CUT, STRUCK, l.changes, 'c1', 'owner', 60);
    const proposed = CUT.slice(0, t.at) + ' and shall provide management accounts' + CUT.slice(t.at);
    const theirs = lab.labFileChange(l, { clauseId: 'c1', clauseLabel: 'Payment',
      before: BASE, after: proposed, side: 'owner', authorRef: PETER, author: 'Peter Otieno' });
    assert.equal(theirs.id, 'L-002');
    assert.equal(theirs.parentChangeId, 'L-001', 'Peter did not erase Sarah’s cut');
  });
});

describe('F87c — a deletion the other side has seen is still refused', () => {
  let lab, l;
  beforeEach(() => { lab = loadLab(); l = newLab(); });

  test('once sent, the same selection is refused', () => {
    const ch = cut(lab, l);
    lab.labSendChange(l, ch.id);
    assert.equal(lab.labDraftOnlyStack(l.changes, 'c1', 'owner'), false);
    assert.equal(lab.labStruckTarget(BASE, CUT, STRUCK, l.changes, 'c1', 'owner', 60), null,
      'they are part-way through answering this; it is not ours to rewrite underneath them');
  });

  test('a decided change is not a draft either', () => {
    const ch = cut(lab, l);
    lab.labSendChange(l, ch.id);
    lab.labDecide(l, ch.id, 'rejected', { name: 'Erik' }, 'counterparty');
    assert.equal(lab.labDraftOnlyStack(l.changes, 'c1', 'owner'), false);
  });

  /* THE CASE THE HEAD ALONE WOULD GET WRONG. L-001 went out; Peter then stacked
     an unsent pass on it. The head is unsent, but the deletion underneath it is
     on the counterparty's table. */
  test('an unsent pass stacked on a SENT ask does not make the clause private again', () => {
    const first = cut(lab, l);
    lab.labSendChange(l, first.id);
    const second = lab.labFileChange(l, { clauseId: 'c1', clauseLabel: 'Payment',
      before: BASE, after: CUT + ' Interest accrues on late payment.',
      side: 'owner', authorRef: PETER, author: 'Peter Otieno' });
    assert.equal(second.sent, false, 'precondition: the head really is an unsent draft');
    assert.equal(lab.labDraftOnlyStack(l.changes, 'c1', 'owner'), false,
      'asking only the head would call this clause ours alone when it is not');
  });

  test('a folded draft does not count as a live draft', () => {
    cut(lab, l);
    lab.labPublishRound(l, 'owner', SARAH, {});
    assert.equal(lab.labDraftOnlyStack(l.changes, 'c1', 'owner'), false,
      'publishing put it on the table');
  });

  test('a clause with no pending work at all is not a draft stack', () => {
    assert.equal(lab.labDraftOnlyStack([], 'c1', 'owner'), false);
    assert.equal(lab.labStruckTarget(BASE, BASE, STRUCK, [], 'c1', 'owner', 0), null,
      'nothing is struck, so there is nothing to restore');
  });
});

describe('F87d — the seam is still refused where it always was', () => {
  let lab, l;
  beforeEach(() => { lab = loadLab(); l = newLab(); });

  /* Widening the rule for struck wording must not widen it for a selection
     that spans the boundary between kept and struck text. That string exists in
     neither version and there is nowhere honest to put an answer. */
  test('a selection running from kept wording into a deletion is not covered', () => {
    const base = 'A. Scope of work. B. Audit rights. C. Term.';
    const after = 'A. Scope of work. C. Term.';
    cut(lab, l, SARAH, after);
    const spans = lab.redlineDeletedSpans(base, after);
    assert.equal(spans.length, 1);
    assert.equal(spans[0].text.trim(), 'B. Audit rights.');

    assert.ok(lab.redlineDeletionCovering(base, after, 'Audit rights'),
      'wholly inside the deletion — covered');
    assert.equal(lab.redlineDeletionCovering(base, after, 'Scope of work. B. Audit'), null,
      'starts in kept wording and ends in struck wording — covered by no single run');
  });

  test('wording that is nowhere at all is not covered', () => {
    assert.equal(lab.redlineDeletionCovering(BASE, CUT, 'force majeure'), null);
    assert.equal(lab.redlineDeletionCovering(BASE, CUT, ''), null);
  });
});

describe('F87e — where the seam goes, across the shapes deletions come in', () => {
  let lab;
  beforeEach(() => { lab = loadLab(); });

  const place = (before, after, sel, hint) => {
    const s = lab.redlineDeletionCovering(before, after, sel, hint);
    return s ? after.slice(0, s.at) + '«X»' + after.slice(s.at) : null;
  };

  test('a deletion at the end of a clause puts the new wording at the end', () => {
    assert.equal(place(BASE, CUT, STRUCK, 60),
      'The Customer shall pay within thirty (30) days.«X»');
  });

  test('a deletion in the middle puts it where the gap is', () => {
    assert.equal(place('A. Scope. B. Audit rights. C. Term.', 'A. Scope. C. Term.', 'Audit rights', 10),
      'A. Scope. «X»C. Term.');
  });

  /* THE ANCHOR WALKS PAST A REPLACEMENT rather than landing inside it. The diff
     for a trailing cut puts a re-inserted fragment after the deleted run, and
     anchoring at the raw seam produced "…thirty (30) «X»days." — not a
     sentence. */
  test('the anchor is past the replacement wording, not inside it', () => {
    const spans = lab.redlineDeletedSpans(BASE, CUT);
    assert.equal(spans.length, 1);
    assert.notEqual(spans[0].at, spans[0].seam,
      'this shape has a re-inserted fragment, so the two differ');
    assert.equal(CUT.slice(0, spans[0].at), CUT,
      'and the anchor is the end of the proposed wording, not a point inside it');
  });

  /* PINNED BECAUSE IT IS A KNOWN LIMIT, not because it is ideal. Where the
     draft already REPLACED the selected wording, the new wording is added
     alongside the replacement rather than instead of it — the splice only ever
     inserts. Guessing which adjacent insertion is a true stand-in and which is
     a tokenisation artifact would mean deleting wording nobody selected, and a
     wrong guess drops words from a contract. The popover says so and points at
     selecting the inserted wording instead, which the ordinary replace path
     already handles exactly right. */
  test('a struck passage that was already replaced places alongside the replacement', () => {
    const before = 'Pay within thirty (30) days of receipt.';
    const after  = 'Pay within sixty (60) days of receipt.';
    assert.equal(place(before, after, 'thirty (30)', 12),
      'Pay within sixty (60)«X» days of receipt.');
    /* And the route that does resolve it cleanly is still open, because the
       replacement wording IS in the working text. */
    assert.ok(after.includes('sixty (60)'),
      'selecting the green wording puts this on the ordinary replace path');
  });

  test('two identical deletions are told apart by the hint', () => {
    const before = 'Clause A: audit rights apply. Clause B: audit rights apply.';
    const after  = 'Clause A: . Clause B: audit rights apply.';
    const spans = lab.redlineDeletedSpans(before, after);
    assert.ok(spans.length >= 1, 'precondition: at least one run was cut');
    const near = lab.redlineDeletionCovering(before, after, 'audit rights', 0);
    const far  = lab.redlineDeletionCovering(before, after, 'audit rights', 400);
    assert.ok(near && far, 'both hints resolve to a run');
    assert.ok(near.at <= far.at, 'and a hint near the start does not pick a later run');
  });
});

describe('F87f — the shipped files carry the rule', () => {
  const lab = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'doclab.js'), 'utf8');
  const red = fs.readFileSync(path.join(__dirname, '..', 'js', 'redline.js'), 'utf8');
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const labCode = strip(lab), redCode = strip(red);

  test('the struck-wording branch runs before the refusal', () => {
    assert.ok(/labStruckTarget\(base, working, text, lab\.changes, clause\.clauseId, side, ctx\.hint\)/.test(labCode));
    assert.ok(/mode = 'restore'/.test(labCode));
    assert.ok(/spliceLen = 0/.test(labCode), 'restoring inserts at a seam, it does not overwrite');
  });

  test('the draft test asks the whole stack, not just its head', () => {
    assert.ok(/labStackOn\(changes, clauseId, side\)/.test(labCode));
    assert.ok(/stack\.every\(/.test(labCode),
      'every entry must be an unsent draft, or a sent ask underneath would be missed');
    assert.ok(/x\.sent !== true/.test(labCode) && /x\.stage === LAB_STAGE_DRAFT/.test(labCode));
  });

  test('the refusal that remains is about having been sent, not about being struck', () => {
    assert.ok(!/it is on its way out of the clause, so there is nothing to rewrite/.test(lab),
      'the old message described the wrong reason and must not survive');
    assert.ok(/has already gone to/.test(lab));
  });

  test('redline.js reports the seam and refuses to cover a partial overlap', () => {
    assert.ok(/function redlineDeletedSpans\(before, after\)/.test(redCode));
    assert.ok(/function redlineDeletionCovering\(before, after, text, hint\)/.test(redCode));
    assert.ok(/redlineDeletedSpans, redlineDeletionCovering,/.test(redCode),
      'and both are exported, or doclab cannot reach them');
  });
});
