/* ============================================================
   f98 — the numbering gap a deletion leaves, and the lock after signature
   ============================================================
   Two reports, one root.

   1. DELETE A CLAUSE AND THE CONTRACT READS 8, 10. clauseRemove takes the
      heading and its body out and closes nothing up, which is correct — a
      number is the text the file carries, and printing one it does not carry is
      a renumbering however small (js/views/negotiation.js, the heading
      renderer). What was missing is that NOTHING SAID SO. A lawyer meeting
      clause 8 followed by clause 10 reads a mangled document, because that is
      what a skipped number almost always means.

   2. THE NUMBERING OF AN EXECUTED CONTRACT IS CITED FOREVER. Every amendment
      that varies a signed agreement names its clauses by the numbers the signed
      copy carries, and so does anybody arguing about it afterwards. Tidying
      1..8, 10..24 into 1..23 on an executed contract repoints all of that
      silently, because the wording underneath stays right. So the numbering has
      to be locked at execution, and the notice must not offer to tidy anything.

   THE TRAP THIS FILE EXISTS TO KEEP SHUT. The obvious implementation — scan the
   numbers, report what is skipped — is wrong on the product's own primary
   fixture. The prototype's contract is numbered 1, 4, 5, 6, 9, 12 because it is
   an EXTRACT of a longer agreement, and clausefixtures.js keeps it that way
   deliberately so nothing can treat a number as an index. Nobody deleted
   clauses 2 and 3. A scan reports six faults on a perfectly good document, and
   would do the same on every uploaded contract shaped like it. The gap is
   reported only where an accepted deleteClause accounts for it, and the test
   that holds that line is "an uploaded extract raises nothing" below. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const F = require('./clausefixtures.js');

function protoContract(over = {}){
  return { id: 'MK-198', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}

/* File a deletion of the clause printed as `num`, decided by the other side.
   Nobody rules on their own ask, so the counterparty proposes and the owner
   decides — the same route the room takes. */
async function deleteClause(win, c, num, opts = {}){
  const cl = win.negoClauseList(c).find(x => x.num === num);
  assert.ok(cl, `clause ${num} must be findable by its number`);
  const ch = await win.negoDeleteClause(c, cl.clauseId,
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
  assert.ok(ch, `a deletion of clause ${num} must file a change`);
  if (opts.accept !== false)
    assert.ok(win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' }),
      `the owner must be able to accept the deletion of clause ${num}`);
  return ch;
}

/* ============================================================
   1 — clauseNumberGap: the narrow question, asked of one number
   ============================================================ */
describe('clauseNumberGap answers about one number, not about the run', () => {
  const W = buildWorld();
  const win = W.win;
  const NUMS = ['1', '4', '5', '6', '9', '12'];

  test('a number the document carries is present, and is not a gap', () => {
    const g = win.clauseNumberGap(NUMS, '9');
    assert.equal(g.present, true);
  });

  test('a number the document does not carry reports its nearest siblings', () => {
    const g = win.clauseNumberGap(NUMS, '7');
    assert.equal(g.present, false);
    assert.equal(g.before, '6', 'the nearest number below, not the previous array entry');
    assert.equal(g.after, '9');
  });

  test('numbers are compared numerically, never as strings', () => {
    /* '9' sorts after '12' as a string. A run that reported clause 12 as the
       number "before" clause 9 would put the notice's own sentence backwards. */
    const g = win.clauseNumberGap(NUMS, '10');
    assert.equal(g.before, '9', '9 is below 10 — string ordering would say 6');
    assert.equal(g.after, '12');
  });

  test('nothing below the first clause, nothing above the last', () => {
    assert.deepEqual({ ...win.clauseNumberGap(NUMS, '0.5') }, { present: false, before: '', after: '' },
      'a non-integer part is not a clause number and answers nothing');
    const low = win.clauseNumberGap(['4', '5'], '3');
    assert.equal(low.before, '', 'no sibling below');
    assert.equal(low.after, '4');
    const high = win.clauseNumberGap(['4', '5'], '6');
    assert.equal(high.before, '5');
    assert.equal(high.after, '', 'no sibling above');
  });

  test('a sub-clause is compared against its own siblings and nothing else', () => {
    const nums = ['8', '8.1', '8.3', '9', '12'];
    const g = win.clauseNumberGap(nums, '8.2');
    assert.equal(g.present, false, '8.2 is missing from a document carrying 8.1 and 8.3');
    assert.equal(g.before, '8.1', 'and the sibling below is 8.1, not 8');
    assert.equal(g.after, '8.3', 'and the sibling above is 8.3, not 9');
  });

  test('a sub-clause whose parent has no other children has no siblings to miss', () => {
    /* 8.2 in a document of 8, 9, 12 is not a gap in anything: there is no run
       of sub-clauses under 8 for it to be missing from. Reporting one would
       mean every top-level document had infinitely many missing sub-clauses. */
    const g = win.clauseNumberGap(['8', '9', '12'], '8.2');
    assert.equal(g.present, false);
    assert.equal(g.before, '', 'clause 8 is the PARENT, not a sibling below');
    assert.equal(g.after, '', 'clause 9 is at another depth and answers for nothing');
  });

  test('12 never answers for 1.2', () => {
    assert.equal(win.clauseNumberGap(['1.1', '1.3'], '12').present, false);
    assert.equal(win.clauseNumberGap(['1.1', '1.3'], '12').before, '',
      'depth is part of the comparison, so a flat 12 has no siblings here');
    assert.equal(win.clauseNumberGap(['12'], '1.2').present, false,
      'and the reverse: 12 does not make 1.2 present');
  });
});

/* ============================================================
   2 — the gap is ATTRIBUTED to a deletion, never scanned for
   ============================================================ */
describe('a gap is only reported where a deletion accounts for it', () => {

  test('an uploaded extract numbered 1, 4, 5, 6, 9, 12 raises nothing', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    assert.deepEqual(Array.from(win.negoNumberingGaps(c)), [],
      'nobody deleted clauses 2, 3, 7, 8, 10 or 11 — they were never in the file. '
      + 'A scan for skipped numbers reports six faults on a good document.');
  });

  test('a deletion that is only PROPOSED is not a gap', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    await deleteClause(win, c, '9', { accept: false });
    assert.equal(win.negoNumberingGaps(c).length, 0,
      'the wording stays in the document until somebody accepts the deletion');
  });

  test('a deletion accepted but not yet closed out is not a gap either', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    await deleteClause(win, c, '9');
    /* Accepted, and struck through in the working pane — but the clause is
       still in the baseline until the round closes and negoResolvedBody removes
       it. The notice must appear when the GAP does, not when the decision is
       taken, or it announces a hole that is not there yet. */
    assert.ok(win.negoClauseList(c).some(cl => cl.num === '9'),
      'the clause is still in the document at this point');
    assert.equal(win.negoNumberingGaps(c).length, 0);
  });

  test('closing the round is what makes the gap, and it is reported then', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    await deleteClause(win, c, '9');
    assert.ok(win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' }), 'the round closes');

    assert.ok(!win.negoClauseList(c).some(cl => cl.num === '9'), 'clause 9 has gone');
    const gaps = Array.from(win.negoNumberingGaps(c));
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].num, '9');
    assert.equal(gaps[0].label, 'Clause 9 · Termination Notice',
      'named as the reader knew it, from the label stored on the change');
    assert.equal(gaps[0].before, '6', 'the run either side, read off the surviving numbers');
    assert.equal(gaps[0].after, '12');
  });

  test('the change that caused it is archived by then, and is still found', async () => {
    /* The one that would have made this silently return nothing. Closing the
       round creates the gap AND empties c.changes onto the round record, so a
       read of the live set alone finds no deletion to attribute anything to. */
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const ch = await deleteClause(win, c, '9');
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    assert.equal(win.negoChanges(c).length, 0, 'the live set is empty after the round closes');
    assert.equal(win.negoNumberingGaps(c)[0].changeId, ch.id,
      'and the gap still names the change that made it');
  });

  test('two deletions in one round report two gaps, in numeric order', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    await deleteClause(win, c, '12');
    await deleteClause(win, c, '4');
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    assert.deepEqual(Array.from(win.negoNumberingGaps(c)).map(g => g.num), ['4', '12'],
      '4 before 12 — numeric, not the order they were filed or the order strings sort in');
  });

  test('a rejected deletion leaves the clause and reports nothing', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    const ch = await win.negoDeleteClause(c, cl.clauseId,
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
    win.negoResolve(c, ch.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    assert.ok(win.negoClauseList(c).some(x => x.num === '9'), 'clause 9 stays');
    assert.equal(win.negoNumberingGaps(c).length, 0);
  });
});

/* ============================================================
   3 — the lock
   ============================================================ */
describe('an executed contract has final numbering', () => {

  test('execution is read from three signals, not from the status alone', () => {
    const { win } = buildWorld();
    assert.equal(win.negoExecuted(protoContract()), false, 'a live negotiation is not executed');
    assert.equal(win.negoExecuted(protoContract({ status: 'Signed' })), true);
    assert.equal(win.negoExecuted(protoContract({ hash: 'abc123' })), true,
      'a sealed record is executed whatever its status field says');
    assert.equal(win.negoExecuted(protoContract({ execution: { at: '2026-03-01T09:00:00Z' } })), true,
      'and so is one carrying an execution stamp');
  });

  test('the numbering lock turns on exactly that fact', () => {
    const { win } = buildWorld();
    for (const over of [{ status: 'Signed' }, { hash: 'abc123' }, { execution: { at: '2026-03-01' } }])
      assert.equal(win.negoNumberingLocked(protoContract(over)), true,
        `numbering must be locked for ${JSON.stringify(over)}`);
    assert.equal(win.negoNumberingLocked(protoContract()), false,
      'and a draft must stay renumberable — the lock is about execution, not about tidiness');
  });

  test('the executed door still refuses a decision, through the same predicate', async () => {
    /* negoResolve's signed door was an inlined copy of this expression. The
       copy is gone; this asserts the door did not go with it. */
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const ch = await deleteClause(win, c, '9', { accept: false });
    c.hash = 'abc123';
    assert.equal(win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' }), null,
      'a sealed record takes no new decisions, however it came to be sealed');
  });
});

/* ============================================================
   4 — the notice
   ============================================================ */
describe('the notice says what happened and offers nothing', () => {
  async function withGap(over = {}){
    const { win } = buildWorld({ negotiationView: true });
    const c = protoContract(over);
    win.negoInit(c);
    await deleteClause(win, c, '9');
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    return { win, c };
  }

  test('nothing is drawn on a document with no gap', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = protoContract();
    win.negoInit(c);
    assert.equal(win.negoNumberingNoticeHtml(c, {}), '',
      'an extract numbered 1, 4, 5, 6, 9, 12 gets no notice at all');
  });

  test('it names the clause, the act and the run', async () => {
    const { win, c } = await withGap();
    const html = win.negoNumberingNoticeHtml(c, {});
    assert.match(html, /Clause 9 was deleted/, 'the clause and the act');
    assert.match(html, /numbering was not closed up/, 'and what was not done about it');
    assert.match(html, /6 is followed by 12/, 'and what the reader is looking at');
    assert.match(html, /data-gaps="1"/);
  });

  test('on a draft it explains that nothing else moved, and never offers a button', async () => {
    const { win, c } = await withGap();
    const html = win.negoNumberingNoticeHtml(c, {});
    assert.match(html, /data-locked="0"/);
    assert.match(html, /no reference to another clause was repointed/,
      'the reassurance that matters: numbers are literal, so nothing silently repointed');
    assert.ok(!/<button/i.test(html),
      'closing the gap is a renumbering and a renumbering is a deliberate act — '
      + 'a notice that quietly offers the undo is how a contract gets renumbered by accident');
  });

  test('on an executed contract it says the numbering is final', async () => {
    const { win, c } = await withGap();
    c.status = 'Signed';
    const html = win.negoNumberingNoticeHtml(c, {});
    assert.match(html, /data-locked="1"/);
    assert.match(html, /numbering is final/);
    assert.match(html, /the gap stays exactly where it is/);
    assert.ok(!/deliberate act/.test(html),
      'the draft voice invites a tidy-up; over an executed agreement that is advice to corrupt it');
    assert.ok(!/<button/i.test(html));
  });

  test('the seal alone locks the voice, without a Signed status', async () => {
    const { win, c } = await withGap();
    c.hash = 'abc123';
    assert.match(win.negoNumberingNoticeHtml(c, {}), /data-locked="1"/);
  });

  test('two gaps are named together, and the run is not spelled out', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = protoContract();
    win.negoInit(c);
    await deleteClause(win, c, '4');
    await deleteClause(win, c, '9');
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    const html = win.negoNumberingNoticeHtml(c, {});
    assert.match(html, /Clauses 4 and 9 were deleted/, 'plural, and both named');
    assert.ok(!/is followed by/.test(html),
      'four "x is followed by y" clauses is a sentence nobody reads; the numbers already say it');
  });

  test('it is drawn on the working pane and not on the baseline beside it', async () => {
    const { win, c } = await withGap();
    const work = win.negoDocHtml(c, { baseline: false, side: 'owner' });
    const base = win.negoDocHtml(c, { baseline: true, side: 'owner' });
    assert.match(work, /id="nego-gaps"/, 'the document the reader is working on says so');
    assert.ok(!/nego-gaps/.test(base),
      'the baseline carries the same gap; saying it twice side by side reads as two faults');
  });

  test('and on the redline workbench, under its own id', async () => {
    const { win, c } = await withGap();
    const html = win.redlineDocHtml(c, { side: 'owner' });
    assert.match(html, /id="rl-gaps"/,
      'the two canvases can be in one DOM, so the notice cannot claim one id twice');
    assert.match(html, /Clause 9 was deleted/);
  });
});
