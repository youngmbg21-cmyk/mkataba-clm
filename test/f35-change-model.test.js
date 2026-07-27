/* ============================================================
   f35 — the canonical change model, on the REAL clause model
   ============================================================
   Rewritten in this session. The previous version of this file passed 664
   tests against a clause model that returned fourteen nameless fragments for
   the prototype's six-clause contract — because its fixtures had been shaped to
   fit the implementation. These fixtures are shaped like the PROTOTYPE'S OWN
   CONTRACT instead (test/clausefixtures.js): "Clause 4 · Payment Terms"
   headings, non-contiguous numbering 1/4/5/6/9/12, multi-paragraph bodies, plus
   an ALL-CAPS variant and a headingless document.

   The point of these tests is not that the model has fields. It is that the
   model cannot lie:

     · rejecting everything reproduces the baseline EXACTLY — now asserted at
       the canonicalRich level, not merely on a text projection
     · a pending change is not in the document
     · a change's fingerprint does not move when the change is decided
     · a redline is rendered from STORED ops and does not depend on which diff
       implementation happens to be loaded
     · a revision keeps its #CHG id, chains its hash, and leaves every prior
       wording recoverable
     · a comment opens no round, captures no version and moves no wording
     · nobody rules on their own ask
     · nothing is ever silently dropped — not on migration, not anywhere

   The three intake paths are exercised for real: the wizard/template path and
   the custom-template path through the bodies those features actually write,
   and the Word path through docxExtract() on real .docx bytes. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const { mkDocx, para } = require('./docxfix');
const F = require('./clausefixtures.js');

const own = xs => Array.from(xs);

/* The prototype's contract, as a contract record. Rich, because that is what
   every intake path produces once it has been normalised. */
function protoContract(over = {}){
  return { id: 'MK-191', name: 'Warehousing and Logistics Services Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], redlineText: F.protoRich(), format: 'rich', ...over };
}
/* A negotiation on the prototype's contract with Erik's four asks filed, one
   per clause, exactly as prototype.html carries them. */
async function withAsks(win, nums = ['4', '5', '6', '9'], over = {}){
  const c = protoContract(over);
  win.negoInit(c);
  const filed = [];
  for (const n of nums){
    const cl = win.negoClauseList(c).find(x => x.num === n);
    assert.ok(cl, `clause ${n} must be findable by its number`);
    const ch = await win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[n].text}</p>`,
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB',
        summary: F.PROTO_ASKS[n].summary });
    assert.ok(ch, `an ask on clause ${n} must file a change`);
    filed.push(ch);
  }
  return { c, filed };
}

describe('a change is anchored on a clause, not on a position', () => {
  test('each of the prototype’s four asks files one change on one clause', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win);
    assert.equal(filed.length, 4);
    assert.equal(win.negoChanges(c).length, 4, 'four asks, four fingerprints');
    assert.deepEqual(own(filed.map(x => x.id)), ['CHG-001', 'CHG-002', 'CHG-003', 'CHG-004']);
    for (const ch of filed){
      assert.match(ch.clauseId, /^cl_[a-z0-9]+$/, 'anchored on a durable clause id');
      assert.equal(ch.changeType, 'modify');
      assert.equal(ch.status, 'pending');
      assert.equal(ch.authorSide, 'counterparty');
      assert.equal(ch.hashV, 2, 'and stamped with the hash format it was written under');
    }
    assert.deepEqual(own(filed.map(x => x.clauseLabel)),
      ['Clause 4 · Payment Terms', 'Clause 5 · Storage Conditions and Duration',
        'Clause 6 · Liability and Insurance', 'Clause 9 · Termination Notice'],
      'and each one names the clause a reader would name');
  });

  test('inserting a clause above a changed one re-points nothing', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const ch = filed[0];
    const scope = win.negoClauseList(c).find(x => x.num === '1');

    /* A new clause 2 goes in above clause 4, and the whole contract is
       renumbered 1..7 the way a lawyer tidies a draft. Under the old model the
       change's id was a LINE INDEX and every one of these moves re-pointed it. */
    const ins = win.clauseInsert(c.negotiation.baselineBody, scope.clauseId,
      { headingText: 'Clause 2 · Definitions', bodyHtml: '<p>In this Agreement, “Goods” means the items stored.</p>' });
    let body = ins.html;
    win.clauseSegment(body).forEach((cl, i) => {
      body = win.clauseReplaceHeading(body, cl.clauseId, `Clause ${i + 1} · ${cl.title}`);
    });
    c.negotiation.baselineBody = body;

    const now = win.negoClauseById(c, ch.clauseId);
    assert.ok(now, 'the change still finds its clause after an insert AND a renumber');
    assert.equal(now.title, 'Payment Terms', 'and it is still the payment clause');
    /* The list is now [1, new, 4, 5, 6, 9, 12] and the renumber runs 1..7, so
       the payment clause prints as 3. The number moved; the anchor did not. */
    assert.equal(now.num, '3', 'whose printed number has moved from 4 to 3');
    assert.ok(now.text.includes('thirty (30) days'), 'carrying its own baseline wording');
    assert.equal(win.negoChangeById(c, ch.id).clauseId, ch.clauseId, 'the anchor never moved');
  });
});

describe('the redline is stored, not re-derived', () => {
  test('the ops on the record reproduce both wordings exactly', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const ch = filed[0];
    assert.ok(Array.isArray(ch.ops) && ch.ops.length, 'the ops are ON the record');
    assert.equal(win.redlineOldText(ch.ops), ch.oldText, 'keep + del is the old wording');
    assert.equal(win.redlineNewText(ch.ops), ch.newText, 'keep + ins is the new wording');
    assert.ok(ch.ops.some(o => o.op === 'del' && o.text.includes('thirty (30)')));
    assert.ok(ch.ops.some(o => o.op === 'ins' && o.text.includes('forty-five (45)')));
  });

  /* The property that was missing when the diff changed mid-session (U-006) and
     the same change started rendering differently on different days. */
  test('the rendered redline survives the diff implementation being swapped out', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4', '5', '6']);
    const before = filed.map(ch => win.negoChangeHtml(ch));

    const real = win.redlineOps;
    win.redlineOps = () => [{ op: 'ins', text: 'THIS DIFF IS A STUB AND MUST NOT BE CONSULTED' }];
    try {
      const after = win.negoChanges(c).map(ch => win.negoChangeHtml(ch));
      assert.deepEqual(own(after), own(before),
        'rendering must read the STORED ops, never run a diff');
      for (const html of after)
        assert.ok(!html.includes('STUB'), 'the stub diff must never reach the screen');
    } finally { win.redlineOps = real; }
  });
});

describe('the hash chain', () => {
  test('a five-change chain builds and every hash verifies from stored content', async () => {
    const { win } = buildWorld();
    const { c } = await withAsks(win, ['4', '5', '6', '9']);
    const cl12 = win.negoClauseList(c).find(x => x.num === '12');
    await win.negoDeleteClause(c, cl12.clauseId,
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });

    const iss = win.negoIssuances(c);
    assert.equal(iss.length, 5, 'five issuances, in creation order');
    assert.deepEqual(own(iss.map(x => x.seq)), [1, 2, 3, 4, 5]);
    assert.equal(iss[0].prevChangeHash, null, 'the first link chains to nothing');
    for (let i = 1; i < iss.length; i++)
      assert.equal(iss[i].prevChangeHash, iss[i - 1].hash,
        `#${iss[i].id} must chain onto the change created before it`);
    for (const x of iss) assert.match(x.hash, /^0x[0-9a-f]{64}$/, 'a real SHA-256, 64 hex digits');

    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, true, v.detail);
    assert.equal(v.checked, 5);
  });

  /* 2.3 — the "Verified" pill rendered unconditionally before this session,
     which is the exact fakery the prototype is criticised for. */
  test('altering a stored oldText makes the chain name exactly that change', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4', '5', '6', '9']);
    assert.equal((await win.verifyChangeChain(c)).ok, true, 'clean to start with');

    // reach past the model and edit the stored record, as a tampered database would
    win.negoChangeById(c, filed[2].id).oldText += ' (and nothing else)';
    const v = await win.verifyChangeChain(c);
    assert.equal(v.ok, false);
    assert.equal(v.failedAt, filed[2].id, 'the FIRST broken link is named');
    assert.equal(v.reason, 'content-altered');
    assert.match(v.detail, /stored wording has been altered/);
  });

  test('a decision, an undo and a comment never move a hash', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4', '5']);
    const before = filed.map(x => x.hash);

    win.negoResolve(c, filed[0].id, 'accepted', { by: 'Wanjiru Kamau' });
    win.negoResolve(c, filed[1].id, 'rejected', { by: 'Wanjiru Kamau' });
    win.negoResolve(c, filed[1].id, 'pending', { by: 'Wanjiru Kamau' });
    win.negoPostComment(c, filed[0].id, 'Net-45 works if you invoice on the 1st.', { side: 'owner' });

    assert.deepEqual(own(win.negoChanges(c).map(x => x.hash)), own(before),
      'a fingerprint names the change, not what anyone decided about it');
    assert.equal((await win.verifyChangeChain(c)).ok, true, 'so the chain still verifies');
  });

  test('a chain built on a weak digest is reported unverifiable, never verified', async () => {
    const { win } = buildWorld();
    const { c } = await withAsks(win, ['4']);
    assert.equal((await win.verifyChangeChain(c)).ok, true);
    /* crypto.subtle exists only in a secure context — a share link opened over
       plain http has none, and js/core.js then falls back to a 32-bit rolling
       hash. "Two weak digests agree" is not evidence about a legal document. */
    const real = win.sha256IsReal;
    win.sha256IsReal = () => false;
    try {
      const v = await win.verifyChangeChain(c);
      assert.equal(v.ok, false);
      assert.equal(v.reason, 'weak-digest');
      assert.match(v.detail, /secure context/);
    } finally { win.sha256IsReal = real; }
  });
});

describe('one open change per clause, updated in place', () => {
  test('re-editing a pending change keeps its id and chains a new hash', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const ch = filed[0];
    const firstHash = ch.hash, firstSeq = ch.seq;

    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const revised = await win.negoEditClause(c, cl.clauseId,
      '<p>All invoices are payable within sixty (60) days from the date of issue (Net-60).</p>',
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });

    assert.equal(win.negoChanges(c).length, 1, 'one clause carries ONE open change, not two');
    assert.equal(revised.id, ch.id, 'the fingerprint id names the slot and does not move');
    assert.notEqual(revised.hash, firstHash, 'the hash names the content and does');
    assert.equal(revised.prevChangeHash, firstHash, 'chained onto the wording it replaced');
    assert.ok(revised.seq > firstSeq, 'and it is a later link in creation order');
    assert.ok(revised.newText.includes('sixty (60)'));
    assert.equal((await win.verifyChangeChain(c)).ok, true, 'the chain still verifies across the revision');
  });

  test('every prior wording stays recoverable from the chain', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const h1 = filed[0].hash;
    await win.negoEditClause(c, cl.clauseId, '<p>Payable within sixty (60) days (Net-60).</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    const h2 = win.negoChangeById(c, filed[0].id).hash;
    await win.negoEditClause(c, cl.clauseId, '<p>Payable within ninety (90) days (Net-90).</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });

    const ch = win.negoChangeById(c, filed[0].id);
    assert.equal(ch.revisions.length, 2, 'two superseded wordings are on the record');
    const first = win.negoRevisionAt(c, ch.id, h1);
    assert.ok(first, 'the original wording is recoverable by its hash');
    assert.ok(first.newText.includes('forty-five (45)'), 'and it is the wording that was actually filed');
    const second = win.negoRevisionAt(c, ch.id, h2);
    assert.ok(second.newText.includes('sixty (60)'));
    assert.ok(win.negoRevisionAt(c, ch.id, ch.hash).current, 'and the current one says it is current');
    /* a precise citation is id@hash — the id alone names a slot whose contents moved */
    assert.notEqual(first.hash, second.hash);
  });

  test('a comment is stamped with the wording it was written against', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const msg = win.negoPostComment(c, filed[0].id, 'Net-45 is too long for us.', { side: 'owner' });
    assert.equal(msg.atHash, filed[0].hash, 'the comment records the revision it is about');

    const ch = win.negoChangeById(c, filed[0].id);
    assert.equal(win.negoCommentIsStale(ch, msg), false, 'and is current while the wording is');

    const cl = win.negoClauseList(c).find(x => x.num === '4');
    await win.negoEditClause(c, cl.clauseId, '<p>Payable within sixty (60) days.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(win.negoCommentIsStale(win.negoChangeById(c, ch.id), msg), true,
      'once the wording is revised the thread can say the objection predates it');
  });

  test('a no-op save files no record at all', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '4');
    const same = await win.negoEditClause(c, cl.clauseId, cl.bodyHtml,
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(same, null, 'saving a clause you did not change proposes nothing');
    assert.equal(win.negoChanges(c).length, 0, 'and files no fingerprint against it');
  });
});

describe('accept and reject operate on the document, not through its text', () => {
  /* THE safety property, restated at the level the document actually lives at.
     Byte equality of a text projection would pass even if every heading, list
     and table had been flattened on the way through — which is exactly what
     B-004 was. */
  test('rejecting everything reproduces the baseline by canonicalRich', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4', '5', '6', '9']);
    const baseline = c.negotiation.baselineBody;
    const canonBefore = win.canonicalRich(baseline);

    for (const ch of filed) win.negoResolve(c, ch.id, 'rejected', { by: 'Wanjiru Kamau' });

    assert.equal(win.canonicalRich(win.negoResolvedBody(c)), canonBefore,
      'the rebuilt document is the baseline, formatting and clause identity included');
    assert.equal(win.canonicalRich(c.redlineText), canonBefore,
      'and so is what was written back to the contract');
    assert.equal(win.docFormat(c.format), 'rich', 'which is still a formatted document');
  });

  test('a change nobody decided is NOT in the document', async () => {
    const { win } = buildWorld();
    const { c } = await withAsks(win, ['4', '5', '6', '9']);
    const text = win.docPlainText(c);
    assert.ok(text.includes('thirty (30) days'), 'the baseline wording still stands');
    assert.ok(!text.includes('forty-five (45)'), 'the ask is not in the document');
    assert.ok(!text.includes('EUR 250,000'), 'nor is any other undecided ask');
  });

  test('accepting replaces the clause body in place and keeps the rest untouched', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4', '5', '6', '9']);
    const before = win.clauseSegment(c.negotiation.baselineBody);

    win.negoResolve(c, filed[0].id, 'accepted', { by: 'Wanjiru Kamau' });

    const after = win.clauseSegment(c.redlineText);
    assert.equal(after.length, 6, 'no clause gained or lost');
    assert.deepEqual(own(after.map(x => x.clauseId)), own(before.map(x => x.clauseId)),
      'every clause identity survived the merge');
    assert.deepEqual(own(after.map(x => x.title)), own(before.map(x => x.title)),
      'and so did every heading');
    assert.ok(after.find(x => x.num === '4').text.includes('forty-five (45)'), 'the accepted wording is in');
    assert.equal(after.find(x => x.num === '5').text, before.find(x => x.num === '5').text,
      'and the neighbouring clause is byte-identical');
  });

  test('a multi-paragraph clause keeps both paragraphs through accept', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const five = win.negoClauseList(c).find(x => x.num === '5');
    assert.equal(five.bodyHtml.match(/<p>/g).length, 2, 'clause 5 really is two paragraphs');
    const ch = await win.negoEditClause(c, five.clauseId,
      '<p>Stored goods may remain for a maximum of ninety (90) days.</p>'
      + '<p>After that period, the Provider may charge additional fees.</p>',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolve(c, ch.id, 'accepted', { by: 'Wanjiru Kamau' });
    const now = win.clauseSegment(c.redlineText).find(x => x.num === '5');
    assert.equal(now.bodyHtml.match(/<p>/g).length, 2, 'and it still is');
    assert.ok(now.text.includes('ninety (90)'));
  });

  test('an accepted deletion removes the clause; the wording stays until then', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const nine = win.negoClauseList(c).find(x => x.num === '9');
    const ch = await win.negoDeleteClause(c, nine.clauseId, { side: 'counterparty', author: 'Erik' });

    assert.ok(win.docPlainText(c).includes("sixty (60) days' written notice"),
      'a PROPOSED deletion removes nothing — the text is struck through, not deleted');
    assert.equal(win.clauseSegment(win.negoResolvedBody(c)).length, 6);

    win.negoResolve(c, ch.id, 'accepted', { by: 'Wanjiru Kamau' });
    const after = win.clauseSegment(c.redlineText);
    assert.equal(after.length, 5, 'accepted, the clause goes');
    assert.ok(!after.some(x => x.clauseId === nine.clauseId), 'and its id retires with it');
    assert.ok(!win.docPlainText(c).includes("sixty (60) days' written notice"));
  });

  test('an accepted insertion lands where it was proposed, not appended', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const four = win.negoClauseList(c).find(x => x.num === '4');
    const ch = await win.negoInsertClause(c, four.clauseId,
      { headingText: 'Clause 4A · Invoice disputes',
        bodyHtml: '<p>A disputed invoice must be raised within ten (10) days.</p>' },
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(ch.changeType, 'insertClause');
    assert.equal(win.clauseSegment(win.negoResolvedBody(c)).length, 6, 'nothing is added until it is accepted');

    win.negoResolve(c, ch.id, 'accepted', { by: 'Wanjiru Kamau' });
    const after = win.clauseSegment(c.redlineText);
    assert.equal(after.length, 7);
    const at = after.findIndex(x => x.clauseId === ch.clauseId);
    assert.equal(at, 2, 'it sits directly after clause 4, where it was asked to go');
    assert.equal(after[1].num, '4', 'clause 4 is still above it');
    assert.equal(after[3].num, '5', 'and clause 5 still below');
    assert.notEqual(at, after.length - 1, 'it was NOT swept to the end of the document');
  });
});

describe('nobody rules on their own ask', () => {
  test('the model refuses it, not only the UI', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const ch = filed[0];
    assert.equal(ch.authorSide, 'counterparty');

    assert.equal(win.negoResolve(c, ch.id, 'accepted', { side: 'counterparty', by: 'Erik' }), null,
      'the side that proposed it cannot accept it');
    assert.equal(win.negoChangeById(c, ch.id).status, 'pending');
    assert.equal(win.negoResolve(c, ch.id, 'rejected', { side: 'counterparty', by: 'Erik' }), null,
      'nor reject it');
    assert.equal(win.negoChangeById(c, ch.id).status, 'pending');

    assert.ok(win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' }),
      'the other side may');
    assert.equal(win.negoChangeById(c, ch.id).status, 'accepted');
    assert.equal(win.negoChangeById(c, ch.id).resolvedBy, 'Wanjiru Kamau',
      'and the audit trail names the decider, not the proposer');
    assert.equal(win.negoChangeById(c, ch.id).author, 'Erik Lindqvist · Nordfrakt Logistik AB',
      'while authorship of the WORDING stays with whoever wrote it');
  });
});

describe('a comment moves nothing', () => {
  test('it opens no round, captures no version and changes no wording', async () => {
    const { win } = buildWorld();
    const { c, filed } = await withAsks(win, ['4']);
    const textBefore = win.docPlainText(c);
    const rounds = (c.rounds || []).length, versions = (c.versions || []).length;

    win.negoPostComment(c, filed[0].id, 'Our AP cycle runs monthly.',
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoPostComment(c, filed[0].id, 'Then invoice on the 1st.', { side: 'owner' });

    assert.equal(win.negoChangeById(c, filed[0].id).thread.length, 2);
    assert.equal(win.docPlainText(c), textBefore, 'the wording is untouched');
    assert.equal((c.rounds || []).length, rounds, 'no round was opened');
    assert.equal((c.versions || []).length, versions, 'no version was captured');
    assert.equal(win.negoChangeById(c, filed[0].id).status, 'pending', 'and nothing was decided');
  });
});

describe('migration: nothing is silently dropped', () => {
  test('a contract mid-negotiation is re-keyed onto durable clause ids', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    const clauses = win.clauseSegment(F.protoRich());
    /* A change filed by the OLD model: keyed on a line index, no ops, no hash
       version, `type` rather than `changeType`. */
    c.changes = [{ id: 'CHG-001', clauseId: 'clause:#5', type: 'modify',
      oldText: clauses.find(x => x.num === '4').text,
      newText: F.PROTO_ASKS['4'].text,
      hash: '0xdeadbeef', status: 'pending', author: 'Erik Lindqvist',
      authorSide: 'counterparty', createdAt: '2026-07-01T09:00:00Z', roundN: 1, thread: [] }];
    win.negoInit(c);
    const res = win.negoMigrate(c);

    assert.equal(res.migrated, 1);
    assert.equal(res.flagged, 0);
    const ch = win.negoChangeById(c, 'CHG-001');
    assert.match(ch.clauseId, /^cl_[a-z0-9]+$/, 're-anchored onto a real clause');
    assert.equal(ch.clauseId, win.negoClauseList(c).find(x => x.num === '4').clauseId,
      'and onto the RIGHT clause — the one its oldText came from');
    assert.equal(ch.changeType, 'modify', 'the record shape moved with it');
    assert.ok(ch.ops.some(o => o.op === 'ins' && o.text.includes('forty-five (45)')),
      'and the ops it never had are computed once, from the wording it does have');
    assert.equal(ch.needsReview, false);
  });

  test('a change that matches no clause is FLAGGED, never dropped', async () => {
    const { win, log } = buildWorld();
    const c = protoContract();
    c.changes = [{ id: 'CHG-001', clauseId: 'clause:#3', type: 'modify',
      oldText: 'Wording from a document that is no longer in this contract at all.',
      newText: 'Some replacement for it.', hash: '0xdeadbeef', status: 'pending',
      author: 'Erik Lindqvist', authorSide: 'counterparty',
      createdAt: '2026-07-01T09:00:00Z', roundN: 1, thread: [] }];
    win.negoInit(c);
    const res = win.negoMigrate(c);

    assert.equal(res.flagged, 1);
    assert.equal(win.negoChanges(c).length, 1, 'it is STILL THERE — an ask that stops being asked is the one failure this prevents');
    const ch = win.negoChangeById(c, 'CHG-001');
    assert.equal(ch.needsReview, true);
    assert.match(ch.needsReviewWhy, /confirm which clause it belongs to/);
    assert.equal(ch.newText, 'Some replacement for it.', 'and its wording is intact');
    assert.ok(log.audit.some(a => /flagged for review \(none dropped\)/.test(a.detail)),
      'and the audit trail says so out loud');
  });

  test('a contract with nothing pending migrates cleanly', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const res = win.negoMigrate(c);
    assert.equal(res.migrated, 0);
    assert.equal(res.flagged, 0);
    assert.equal(res.already, true);
  });

  test('clause ids are stamped into the document on first open, once', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    assert.ok(!c.redlineText.includes('data-clause-id'), 'the document starts without them');
    win.negoNormalizeDocument(c);
    assert.ok(c.redlineText.includes('data-clause-id'), 'and carries them afterwards');
    const ids = win.clauseSegment(c.redlineText).map(x => x.clauseId);
    win.negoNormalizeDocument(c);
    assert.deepEqual(own(win.clauseSegment(c.redlineText).map(x => x.clauseId)), own(ids),
      'opening it again moves nothing');
  });
});

describe('all three intake paths produce the same normalized shape', () => {
  /* Path 1 — standard template: the rich body the wizard writes from one of
     the built-ins in js/templates.js. */
  const standardTemplateContract = () => supplyContract({ id: 'MK-STD-1', template: 'RM' });
  /* Path 2 — custom/user template: identical except that it carries templateId
     instead of a built-in template key. */
  const customTemplateContract = () => supplyContract({
    id: 'MK-CUS-1', template: null, templateId: 'tpl_user_1',
    templateName: 'Nordfrakt master warehousing terms' });
  /* Path 3 — an uploaded Word file, read by the real docxExtract on real bytes.
     Its headings are ALL-CAPS and numbered, per the fixture rule. */
  const WORD_LINES = ['WAREHOUSING AND LOGISTICS SERVICES AGREEMENT']
    .concat(F.PROTO_CLAUSES.flatMap(cl => [`${cl.num}. ${cl.title.toUpperCase()}`, cl.text]));
  async function uploadedWordContract(win){
    const bytes = mkDocx(WORD_LINES.map(para).join(''));
    const res = await win.docxExtract(bytes);
    assert.ok(res.text && res.text.trim(), 'the extractor must yield wording');
    return { c: { id: 'MK-DOCX-1', name: 'Uploaded warehousing agreement',
      counterparty: 'Nordfrakt Logistik AB', source: 'upload', status: 'Under Review',
      folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [],
      upload: { fileName: 'contract.docx', docKind: 'docx', mime: win.DOCX_MIME,
        size: bytes.length, extractedText: res.text, textChars: res.text.length } } };
  }

  test('the normaliser reports the right path for each of the three', async () => {
    const { win } = buildWorld();
    win.TEMPLATES = { RM: { id: 'RM', name: 'Raw Material Supply Agreement' } };
    win.customTemplates = () => [{ id: 'tpl_user_1', name: 'Nordfrakt master warehousing terms' }];
    assert.equal(win.negoNormalizeDocument(standardTemplateContract()).path, 'standard-template');
    assert.equal(win.negoNormalizeDocument(customTemplateContract()).path, 'custom-template');
    const { c } = await uploadedWordContract(win);
    assert.equal(win.negoNormalizeDocument(c).path, 'upload');
  });

  test('every path yields a rich document with real clauses and no changes yet', async () => {
    const { win } = buildWorld();
    win.TEMPLATES = { RM: { id: 'RM' } };
    win.customTemplates = () => [{ id: 'tpl_user_1' }];
    const { c: docxC } = await uploadedWordContract(win);
    const shapes = [
      ['standard-template', win.negoNormalizeDocument(standardTemplateContract())],
      ['custom-template', win.negoNormalizeDocument(customTemplateContract())],
      ['upload', win.negoNormalizeDocument(docxC)],
    ];
    for (const [label, s] of shapes){
      assert.equal(s.rich, true, `${label}: the body must be a rich document`);
      assert.equal(s.format, 'rich', `${label}: format marker`);
      assert.equal(s.empty, false, `${label}: it must carry wording`);
      assert.ok(s.clauses.length > 0, `${label}: it must be segmented into clauses`);
      for (const cl of s.clauses)
        assert.match(cl.clauseId, /^cl_[a-z0-9]+$/, `${label}: every clause carries a durable id`);
      assert.equal(s.changes.length, 0, `${label}: a fresh intake has no changes yet`);
      assert.equal(s.round, 1, `${label}: it starts at round 1`);
      assert.equal(s.turn, 'owner', `${label}: and it is the owner's move`);
      assert.deepEqual(own(Object.keys(s).sort()),
        ['baselineBody', 'baselineText', 'body', 'changes', 'clauses', 'empty', 'format',
          'path', 'rich', 'round', 'text', 'turn'],
        `${label}: the normalized shape must not vary by path`);
    }
  });

  test('the uploaded Word contract segments into the same six clauses', async () => {
    const { win } = buildWorld();
    const { c } = await uploadedWordContract(win);
    const s = win.negoNormalizeDocument(c);
    assert.equal(s.clauses.length, 6, 'six clauses, from ALL-CAPS numbered headings');
    assert.deepEqual(own(s.clauses.map(x => x.num)), ['1', '4', '5', '6', '9', '12'],
      'with the prototype’s own non-contiguous numbering read as written');
  });

  test('the same ask against any path files the same kind of change', async () => {
    const { win } = buildWorld();
    win.TEMPLATES = { RM: { id: 'RM' } };
    win.customTemplates = () => [{ id: 'tpl_user_1' }];
    for (const c of [standardTemplateContract(), customTemplateContract()]){
      win.negoNormalizeDocument(c);
      const cl = win.negoClauseList(c).find(x => /PAYMENT/i.test(x.title));
      assert.ok(cl, 'the payment clause must be findable');
      const ch = await win.negoEditClause(c, cl.clauseId,
        cl.bodyHtml.replace('thirty (30) days', 'forty-five (45) days'),
        { side: 'counterparty', author: 'Erik Lindqvist' });
      assert.equal(ch.changeType, 'modify');
      assert.equal(ch.status, 'pending');
      assert.match(ch.hash, /^0x[0-9a-f]{64}$/);
      win.negoResolve(c, ch.id, 'accepted', { by: 'Wanjiru Kamau' });
      assert.match(win.docPlainText(c), /forty-five \(45\) days/);
      assert.equal(win.docFormat(c.format), 'rich', 'and it is still a formatted document');
      assert.ok(c.redlineText.includes('<ol'), 'with its list structure intact');
    }
  });
});

describe('the turn model', () => {
  test('a hand-over flips the turn, snapshots a version and names the mover', async () => {
    const { win, log } = buildWorld();
    const { c } = await withAsks(win, ['4']);
    assert.equal(win.negoTurn(c), 'owner');
    const versions = (c.versions || []).length;

    const res = win.negoHandOver(c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    assert.ok(res);
    assert.equal(win.negoTurn(c), 'counterparty');
    assert.equal((c.versions || []).length, versions + 1, 'every turn close snapshots a version');
    assert.ok(log.audit.some(a => /Turn handed to counterparty by Wanjiru Kamau/.test(a.detail)));
    assert.equal(win.negoHandOver(c, { to: 'counterparty' }), null, 'handing it over twice is a no-op');
  });

  test('the banner says whose move it is, from the record', async () => {
    const { win } = buildWorld();
    const { c } = await withAsks(win, ['4', '5']);
    const mine = win.negoTurnBanner(c, 'owner');
    assert.equal(mine.mine, true);
    assert.equal(mine.text, 'Your turn — 2 changes to review');
    const theirs = win.negoTurnBanner(c, 'counterparty');
    assert.equal(theirs.mine, false);
    assert.match(theirs.text, /^Waiting on /);

    win.negoHandOver(c, { to: 'counterparty', by: 'Wanjiru Kamau' });
    assert.equal(win.negoTurnBanner(c, 'owner').mine, false);
    assert.equal(win.negoTurnBanner(c, 'counterparty').mine, true);
  });
});

describe('summaries are quoted, never invented', () => {
  test('the proposer’s own line is used verbatim when they write one', async () => {
    const { win } = buildWorld();
    const { filed } = await withAsks(win, ['4']);
    assert.equal(filed[0].summary, 'Payment terms extended from Net-30 to Net-45',
      'the prototype’s own wording, untouched');
  });

  test('with no summary the mechanical diff stands in, quoting the ops', async () => {
    const { win } = buildWorld();
    const c = protoContract();
    win.negoInit(c);
    const cl = win.negoClauseList(c).find(x => x.num === '9');
    const ch = await win.negoEditClause(c, cl.clauseId,
      cl.bodyHtml.replace("sixty (60) days'", "thirty (30) days'"),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(ch.summary, '“sixty (60)” → “thirty (30)”',
      'what goes and what arrives, quoted from the stored ops — no prose about it');
    for (const o of ch.ops.filter(o => o.op !== 'keep'))
      assert.ok(ch.summary.includes(o.text.trim()) || ch.ops.length > 4,
        'the summary can only quote fragments that are really in the change');
  });
});
