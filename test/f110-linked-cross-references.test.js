/* ============================================================
   f110 — cross-references: found, resolved, and reported only when broken HERE
   ============================================================
   OI-1. A contract talks about itself — "subject to Clause 9", "the limits in
   Section 4", "as defined in 8.2(a)" — and until now nothing in the product
   knew those were references at all. Delete clause 9 and the sentence citing it
   went on citing it, silently.

   WHY THIS SHIPS BEFORE ANYTHING THAT MOVES A NUMBER. While numbers never move,
   a reference to a deleted clause points at NOTHING: a reader who follows it
   finds an absence and knows something is wrong. Once numbers can be
   renumbered, the same reference points at the WRONG CLAUSE — plausible,
   readable, and lying. Renumbering without this turns today's honest gaps into
   silent misstatements of what the contract means.

   THE TRAP THIS FILE KEEPS SHUT, inherited word for word from f98. The obvious
   implementation — report every reference that does not resolve — is wrong on
   the product's own primary fixture. The prototype contract is an EXTRACT,
   numbered 1, 4, 5, 6, 9, 12, and an extract cites the agreement it was cut
   from. "Subject to Clause 2" is a perfectly good sentence in a document that
   has no clause 2 and never did. A scan reports faults nobody can fix, on that
   document and on every uploaded contract shaped like it.

   So: a reference is reported ONLY when an accepted deleteClause on this record
   accounts for its target. Everything else is either fine or somebody else's
   document. The whole-document check (negoAllRefs) still lists the rest, but
   neutrally — "refers to a clause not in this document" — because on an extract
   that is a fact, not a fault.

   AND IT NEVER EDITS. Repairing a reference changes what the contract means.
   This names the problem and stops. */
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

/* ============================================================
   1 — detection: the grammar, and what it deliberately will not match
   ============================================================ */
describe('clauseRefsInText finds references and nothing else', () => {
  const { win } = buildWorld();
  /* Array.from rebuilds in THIS realm. The modules run inside the jsdom
     window, so an array they return has that realm's prototype and
     assert.deepEqual (strict) refuses it against a plain literal. */
  const nums = s => Array.from(win.clauseRefsInText(s), r => r.num);

  test('the words a contract actually uses', () => {
    assert.deepEqual(nums('subject to Clause 9'), ['9']);
    assert.deepEqual(nums('the limits in Section 4'), ['4']);
    assert.deepEqual(nums('as set out in Article 7'), ['7']);
    assert.deepEqual(nums('see Art. 3'), ['3']);
    assert.deepEqual(nums('per Sec. 2.1'), ['2.1']);
    assert.deepEqual(nums('under §9'), ['9']);
    assert.deepEqual(nums('in paragraph 5'), ['5']);
  });

  test('case does not matter — drafters are inconsistent', () => {
    assert.deepEqual(nums('subject to clause 9 and CLAUSE 4'), ['9', '4']);
  });

  test('sub-paragraph forms survive intact', () => {
    assert.deepEqual(nums('as defined in Clause 8.2(a)'), ['8.2(a)']);
    assert.deepEqual(nums('Clause 1.1(b)(ii)'), ['1.1(b)(ii)']);
  });

  test('a range is two endpoints, because either end can break', () => {
    assert.deepEqual(nums('Clauses 4 to 6'), ['4', '6']);
    assert.deepEqual(nums('Clauses 4–6'), ['4', '6']);
    assert.deepEqual(nums('Clauses 4-6'), ['4', '6']);
  });

  test('a range is not read twice as a range and a single', () => {
    const r = win.clauseRefsInText('Clauses 4 to 6');
    assert.equal(r.length, 2, 'two endpoints, not three references');
  });

  test('a bare number is NOT a reference', () => {
    /* "within 30 days" is not a citation, and nothing in the text says
       otherwise. Guessing here fills every payment clause in the portfolio
       with false warnings — a false warning is worse than a missed one,
       because it is the one that teaches people to ignore the feature. */
    assert.deepEqual(nums('payable within 30 days of invoice'), []);
    assert.deepEqual(nums('a sum of 48,000,000'), []);
  });

  test('the span points at the words, so a caller need not search again', () => {
    const s = 'Nothing in this agreement limits Clause 9 above.';
    const r = win.clauseRefsInText(s)[0];
    assert.equal(s.slice(r.start, r.end), 'Clause 9');
  });

  test('it is a read — the text it was given is not touched', () => {
    const s = 'subject to Clause 9';
    const copy = String(s);
    win.clauseRefsInText(s);
    assert.equal(s, copy);
  });
});

/* ============================================================
   2 — resolution: resolved, self, dangling
   ============================================================ */
describe('clauseResolveRefs says what each reference points at', () => {
  const { win } = buildWorld();
  const CLAUSES = [
    { clauseId: 'a', num: '1', text: 'This agreement is subject to Clause 4.' },
    { clauseId: 'b', num: '4', text: 'Nothing in this Clause 4 limits Clause 12.' },
    { clauseId: 'c', num: '12', text: 'As described in Clause 2 of the parent agreement.' },
    { clauseId: 'd', num: '1.2', text: 'See Clause 1.2 only.' },
  ];
  const refs = () => Array.from(win.clauseResolveRefs(CLAUSES));

  test('a reference to a clause that is here resolves to it', () => {
    const r = refs().find(x => x.fromClauseId === 'a');
    assert.equal(r.state, 'resolved');
    assert.equal(r.toClauseId, 'b');
  });

  test('a clause citing itself is never a fault', () => {
    const self = refs().find(x => x.fromClauseId === 'b' && x.num === '4');
    assert.equal(self.state, 'self', 'ordinary drafting — "nothing in this Clause 4 limits…"');
    const other = refs().find(x => x.fromClauseId === 'b' && x.num === '12');
    assert.equal(other.state, 'resolved');
  });

  test('a reference out of the document is dangling, not an error', () => {
    const r = refs().find(x => x.fromClauseId === 'c');
    assert.equal(r.state, 'dangling',
      'an extract citing its parent agreement — a fact about the document, not a fault');
  });

  test('12 never answers for 1.2', () => {
    const r = refs().find(x => x.fromClauseId === 'd');
    assert.equal(r.state, 'self');
    assert.notEqual(r.toClauseId, 'c');
  });
});

/* ============================================================
   3 — THE TRAP: the extract raises nothing
   ============================================================ */
describe('the prototype extract raises no attributed warning', () => {
  const { win } = buildWorld();

  test('a document nobody has deleted from reports nothing', async () => {
    const c = protoContract();
    win.negoInit(c);
    assert.deepEqual(Array.from(win.negoBrokenRefs(c)), [],
      'the fixture is numbered 1, 4, 5, 6, 9, 12 — a scan would report six faults on a good document');
  });
});

/* ============================================================
   4 — attribution: reported when THIS record deleted the target
   ============================================================ */
describe('a deletion that breaks a reference is reported, on the citing clause', () => {
  /* A two-clause document where the second cites the first, so the act and its
     consequence are unambiguous. */
  function citing(){
    return protoContract({ format: 'rich', redlineText:
      '<h2>Clause 9 · Insurance</h2><p>The Supplier shall maintain insurance.</p>'
      + '<h2>Clause 15 · Liability</h2><p>Liability is capped subject to Clause 9 above.</p>' });
  }

  async function deleteNine(win, c, { accept = true } = {}){
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    assert.ok(cl, 'clause 9 must be findable');
    const ch = await win.negoDeleteClause(c, cl.clauseId,
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
    assert.ok(ch, 'the deletion must file');
    if (accept){
      assert.ok(win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' }));
      /* CLOSING THE ROUND is what makes the gap real, and it is why this report
         reads negoAllChanges rather than c.changes. Until the round closes, the
         baseline both sides are measuring against still carries clause 9 —
         nothing is broken yet, because the deletion is still a proposal that has
         been agreed rather than a change to the document of record. The warning
         appears when the gap does. Same sequencing as f98. */
      assert.ok(win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' }), 'the round must close');
    }
    return ch;
  }

  test('before the deletion, nothing is reported', async () => {
    const { win } = buildWorld();
    const c = citing();
    win.negoInit(c);
    assert.deepEqual(Array.from(win.negoBrokenRefs(c)), []);
  });

  test('an accepted deletion flags the clause that cites it, naming both ends', async () => {
    const { win } = buildWorld();
    const c = citing();
    win.negoInit(c);
    await deleteNine(win, c);
    const out = Array.from(win.negoBrokenRefs(c));
    assert.equal(out.length, 1, 'one broken reference');
    const b = out[0];
    assert.equal(b.num, '9', 'the number that went');
    assert.equal(b.fromNum, '15', 'reported on the clause that CONTAINS the reference');
    assert.match(b.deletedLabel, /9/, 'and it names what was deleted');
    assert.ok(b.changeId, 'attributed to the change that did it');
  });

  test('a REJECTED deletion flags nothing', async () => {
    const { win } = buildWorld();
    const c = citing();
    win.negoInit(c);
    const ch = await deleteNine(win, c, { accept: false });
    win.negoResolve(c, ch.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    assert.deepEqual(Array.from(win.negoBrokenRefs(c)), [],
      'the clause is still in the document — nothing is broken');
  });

  test('the report is a read: the document is byte-identical afterwards', async () => {
    const { win } = buildWorld();
    const c = citing();
    win.negoInit(c);
    await deleteNine(win, c);
    const before = c.redlineText;
    win.negoBrokenRefs(c);
    win.negoAllRefs(c);
    assert.equal(c.redlineText, before,
      'a warning that edits the wording is not a warning, it is a change nobody agreed');
  });
});

/* ============================================================
   5 — the whole-document check lists everything, neutrally
   ============================================================ */
describe('negoAllRefs is the on-demand check, not the warning', () => {
  const { win } = buildWorld();

  test('it lists references the attributed report deliberately ignores', async () => {
    const c = protoContract({ format: 'rich', redlineText:
      '<h2>Clause 1 · Scope</h2><p>As described in Clause 2 of the parent agreement.</p>' });
    win.negoInit(c);
    const all = Array.from(win.negoAllRefs(c));
    assert.equal(all.length, 1);
    assert.equal(all[0].state, 'dangling');
    assert.deepEqual(Array.from(win.negoBrokenRefs(c)), [],
      'listed by the check, silent in the warning — the difference is the whole doctrine');
  });
});

/* ============================================================
   6 — surfacing it: one notice, naming both ends
   ============================================================
   Appended to the gap notice rather than raised beside it. Both sentences are
   about the same act, and two banners stacked on one screen saying two halves
   of one fact is how a reader learns to close notices without reading them.

   The f98 rule that the notice carries NO BUTTON on an executed contract keeps
   holding here — this adds a sentence to it, never an action. */
describe('the notice says a reference was broken, and names both ends', () => {
  async function noticeFor(win, c){
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    const ch = await win.negoDeleteClause(c, cl.clauseId, { side: 'counterparty', author: 'Erik' });
    win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    return win.negoNumberingNoticeHtml(c, { noticeId: 'nego-gaps' });
  }
  const citing = over => ({ id: 'MK-198', name: 'X', counterparty: 'N', template: 'WH',
    status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
    versions: [], signatures: [], comments: [], format: 'rich',
    redlineText: '<h2>Clause 9 · Insurance</h2><p>The Supplier shall maintain insurance.</p>'
      + '<h2>Clause 15 · Liability</h2><p>Liability is capped subject to Clause 9 above.</p>',
    ...over });

  test('it names the citing clause and the deleted one', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = citing();
    win.negoInit(c);
    const html = await noticeFor(win, c);
    assert.match(html, /data-brokenrefs="1"/);
    assert.match(html, /Clause 15/, 'the clause with the problem in it');
    assert.match(html, /still refers to it/i);
  });

  test('a document with a gap but no reference to it says only that', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = citing({ redlineText:
      '<h2>Clause 9 · Insurance</h2><p>The Supplier shall maintain insurance.</p>'
      + '<h2>Clause 15 · Liability</h2><p>Liability is capped at the contract value.</p>' });
    win.negoInit(c);
    const html = await noticeFor(win, c);
    assert.match(html, /data-brokenrefs="0"/);
    assert.ok(!/still refers/i.test(html), 'nothing cites clause 9 — there is nothing to add');
  });

  test('the notice still carries no button on an executed contract', async () => {
    const { win } = buildWorld({ negotiationView: true });
    const c = citing();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    const ch = await win.negoDeleteClause(c, cl.clauseId, { side: 'counterparty', author: 'Erik' });
    win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    win.negoAdvanceRound(c, { by: 'Wanjiru Kamau' });
    c.status = 'Signed'; c.execution = { at: '2026-07-31T10:00:00.000Z' };
    const html = win.negoNumberingNoticeHtml(c, { noticeId: 'nego-gaps' });
    assert.match(html, /data-locked="1"/);
    assert.ok(!/<button/i.test(html),
      'f98 asserts an executed contract is offered no way to tidy its numbering — adding a sentence must not add an action');
  });
});
