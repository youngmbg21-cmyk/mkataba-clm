/* ============================================================
   f124 — the same doctrine at every depth (N4)
   ============================================================
   N4-T1's decision, made and documented here: a SUB-CLAUSE is a
   heading-addressable unit with a dotted number at any heading rank the
   document gives it — the grammar clauseNumberGap, N1, N2 and N3 already
   speak. A lettered run INSIDE a clause body ((a), (b), (c) paragraphs)
   stays part of that clause's body, deliberately: "one clause, one badge,
   one decision" — a sub-paragraph is wording within a term, negotiated by
   modifying the term, and references to it (8.2(a)) are already detected
   (N1) and follow their BASE clause when it renumbers (N2, f119's
   8.2(a) → 8.1(a)).

   What this file proves is the work order's own Definition of Done, at
   depth: deleting sub-clause 2.2 in a live contract renumbers 2.3 → 2.2
   without touching clause 3; in an uploaded contract it leaves the gap and,
   if cited, flags the reference — the same doctrine at every depth. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const DEEP_BODY =
  '<h1>Framework Agreement</h1><p>Between the parties</p>'
  + '<h2>1. General</h2><p>Scope of the framework.</p>'
  + '<h2>2. Services</h2><p>The services, per clause 2.2 and clause 2.3.</p>'
  + '<h2>2.1 Cold chain</h2><p>Refrigerated handling.</p>'
  + '<h2>2.2 Dry goods</h2><p>Ambient handling.</p>'
  + '<h2>2.3 Returns</h2><p>Reverse logistics.</p>'
  + '<h2>3. Payment</h2><p>Per clause 3.1.</p>'
  + '<h2>3.1 Invoices</h2><p>Monthly in arrears.</p>';

function deep(win, over = {}){
  return { id: 'MK-D1', name: 'Framework Agreement', counterparty: 'Nordfrakt',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: DEEP_BODY, format: 'rich', numbering: 'live', ...over };
}

async function deleteNum(win, c, num){
  const cl = win.negoClauseList(c).find(x => x.num === num);
  const ch = await win.negoDeleteClause(c, cl.clauseId,
    { side: 'counterparty', author: 'Erik Lindqvist' });
  win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
  win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
  return ch;
}

describe('f124 — sub-clauses behave like clauses, at every depth', () => {
  test('LIVE: deleting 2.2 renumbers 2.3 → 2.2 and touches nothing in clause 3', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = deep(win);
    win.negoInit(c);
    await deleteNum(win, c, '2.2');
    assert.equal(win.negoClauseList(c).map(cl => cl.num).join(','), '1,2,2.1,2.2,3,3.1',
      '2.3 closed to 2.2; clause 3 and its own children never moved');
    const text = win.richToText(c.negotiation.baselineBody);
    assert.match(text, /clause 3\.1/, 'clause 3\'s reference is untouched');
    assert.match(text, /clause 2\.2/, 'the reference to old 2.3 follows it to 2.2');
  });

  test('UPLOAD: the same deletion leaves the gap, and the cited reference flags', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = deep(win, { numbering: undefined,
      upload: { fileName: 'x.pdf', extractedText: 'x' }, source: 'upload' });
    win.negoInit(c);
    await deleteNum(win, c, '2.2');
    assert.equal(win.negoClauseList(c).map(cl => cl.num).join(','), '1,2,2.1,2.3,3,3.1',
      'the gap stays — the paper\'s numbers are the paper\'s facts');
    const gaps = win.negoNumberingGaps(c);
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].num, '2.2');
    assert.equal(gaps[0].before, '2.1', 'sibling-aware at depth: 2.1, not 2');
    assert.equal(gaps[0].after, '2.3');
    const broken = win.negoBrokenRefs(c);
    assert.equal(broken.length, 1, 'the citation of deleted 2.2 flags');
    assert.equal(broken[0].num, '2.2');
    assert.equal(broken[0].fromNum, '2', 'reported on the clause that contains the reference');
  });

  test('a lettered run inside a body stays body — one clause, one badge, one decision', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = deep(win, { redlineText:
      '<h2>8. Liability</h2><p>General rule.</p>'
      + '<h2>8.1 Basics</h2><p>The rule itself.</p>'
      + '<h2>8.3 Exclusions</h2><p>(a) inherent vice; (b) acts of war; (c) delay.</p>'
      + '<h2>9. Law</h2><p>See clause 8.3(a).</p>' });
    win.negoInit(c);
    const clauses = win.negoClauseList(c);
    assert.equal(clauses.map(cl => cl.num).join(','), '8,8.1,8.3,9',
      'the (a)/(b)/(c) run is wording inside 8.3, not three more clauses');
    // and a citation INTO the run follows its BASE clause on a renumber
    const plan = win.clauseRenumberPlan(clauses);
    assert.equal(plan.headings.map(h => `${h.oldNum}→${h.newNum}`).join(','), '8.3→8.2',
      'the run under 8 compacts against its own siblings; 8 and 9 anchor their own runs');
    const ref = plan.refs.find(r => r.from === '8.3' && r.to === '8.2');
    assert.ok(ref, 'the 8.3(a) citation follows the base clause — the (a) is the author\'s, verbatim');
  });
});
