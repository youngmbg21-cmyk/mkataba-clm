/* ============================================================
   f35 — the canonical change model (Phase 1)
   ============================================================
   One shape that all three intake paths and both sides of a negotiation share.

   The point of these tests is not that the model has fields. It is that the
   model cannot lie:

     · rejecting everything reproduces the baseline EXACTLY, byte for byte
     · a pending change is not in the document
     · a change's fingerprint does not move when the change is decided
     · a comment opens no round, captures no version and moves no wording
     · the counterparty is never recorded as the author of our wording, or us
       of theirs

   The three intake paths are exercised for real: the wizard/template path and
   the custom-template path through the bodies those features actually write,
   and the Word path through docxExtract() on real .docx bytes built by
   test/docxfix.js. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract, SUPPLY_RICH } = require('./world');
const { mkDocx, para } = require('./docxfix');

/* A plain-text contract whose clauses are numbered the way richToText emits
   them, so the clause keys are the real ones the product will see. */
const PLAIN_CONTRACT = [
  'WAREHOUSING AND LOGISTICS SERVICES AGREEMENT',
  '1. SCOPE OF SERVICES',
  '1. The Provider shall receive, store, handle and dispatch the goods at the designated facility.',
  '2. PAYMENT TERMS',
  '2. All invoices are payable within thirty (30) days from the date of issue.',
  '3. STORAGE',
  '3. Stored goods may remain in the facility for a maximum of one hundred and twenty (120) days.',
  '4. TERMINATION',
  '4. Either party may terminate by giving not less than sixty (60) days written notice.',
].join('\n');

function plainContract(over = {}){
  return { id: 'MK-PLAIN-1', name: 'Warehousing Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [],
    redlineText: PLAIN_CONTRACT, format: 'text', ...over };
}

describe('clause segmentation gives stable, addressable ids', () => {
  test('a heading is not a clause, and it names the clauses under it', () => {
    const { win } = buildWorld();
    const clauses = win.negoClausesOf(PLAIN_CONTRACT);
    // 4 numbered clauses; the 5 heading lines are titles, not terms
    assert.equal(clauses.length, 4, 'headings must not be negotiable');
    assert.ok(clauses.every(c => c.kind === 'clause'));
    assert.equal(clauses[1].title, '2. PAYMENT TERMS');
    assert.match(win.negoClauseLabel(clauses[1]), /^Clause 2 · PAYMENT TERMS$/);
  });

  test('the clause id is keyed on the clause NUMBER, so it survives an edit above it', () => {
    const { win } = buildWorld();
    const before = win.negoClausesOf(PLAIN_CONTRACT);
    const edited = PLAIN_CONTRACT.replace(
      '1. The Provider shall receive, store, handle and dispatch the goods at the designated facility.',
      '1. The Provider shall receive, store, handle, dispatch AND INSURE the goods at the designated facility.');
    const after = win.negoClausesOf(edited);
    assert.equal(after.map(c => c.id).join('|'), before.map(c => c.id).join('|'),
      'editing clause 1 must not renumber the ids of clauses 2-4');
  });

  test('it is the same key js/discuss.js uses, so a comment and a change meet', () => {
    const { win } = buildWorld();
    const clauses = win.negoClausesOf(PLAIN_CONTRACT);
    const topics = win.discussTopics(plainContract(), PLAIN_CONTRACT);
    for (const cl of clauses)
      assert.ok(topics.some(t => t.value === cl.id),
        `clause key ${cl.id} must exist as a discuss topic`);
  });

  test('two clauses numbered the same are both kept, not silently merged', () => {
    const { win } = buildWorld();
    const dup = '4. The first clause four says one thing.\n4. The second clause four says another.';
    const clauses = win.negoClausesOf(dup);
    assert.equal(clauses.length, 2, 'a malformed document must not lose a clause');
    assert.notEqual(clauses[0].id, clauses[1].id);
  });

  test('a rich document is segmented through its text projection, numbering intact', () => {
    const { win } = buildWorld();
    const c = supplyContract();
    const clauses = win.negoClauses(c);
    assert.ok(clauses.length >= 8, 'the ol/start numbering must reach the clause list');
    // <ol start="5"><li>Payment shall be made within thirty (30) days…
    const pay = clauses.find(x => /thirty \(30\) days of a valid invoice/.test(x.text));
    assert.ok(pay, 'the payment clause must be addressable');
    assert.equal(pay.num, '5.');
  });
});

describe('filing a proposal produces fingerprinted changes', () => {
  test('a modified clause becomes one MODIFY change with a full SHA-256 fingerprint', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    win.negoInit(c);
    const proposed = PLAIN_CONTRACT.replace('thirty (30) days', 'forty-five (45) days');
    const filed = await win.negoFileProposal(c, proposed, { side: 'counterparty', author: 'Erik Lindqvist' });

    assert.equal(filed.length, 1, 'one clause changed → one change');
    const ch = filed[0];
    assert.equal(ch.id, 'CHG-001');
    assert.equal(ch.type, 'modify');
    assert.equal(ch.status, 'pending');
    assert.equal(ch.author, 'Erik Lindqvist');
    assert.equal(ch.authorSide, 'counterparty');
    assert.match(ch.hash, /^0x[0-9a-f]{64}$/, 'a real 256-bit digest, not a stub');
    assert.match(ch.oldText, /thirty \(30\) days/);
    assert.match(ch.newText, /forty-five \(45\) days/);
    assert.equal(ch.thread.length, 0, 'a fresh change carries no conversation');
    assert.ok(ch.createdAt);
  });

  test('the summary quotes the passages the reviewer will see highlighted', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const proposed = PLAIN_CONTRACT.replace('thirty (30) days', 'forty-five (45) days');
    const [ch] = await win.negoFileProposal(c, proposed, { side: 'counterparty' });
    assert.ok(ch.summary.includes('thirty (30)'), 'it must name what goes');
    assert.ok(ch.summary.includes('forty-five (45)'), 'it must name what arrives');
  });

  test('an added clause is an INSERT and a removed one is a DELETE', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const proposed = PLAIN_CONTRACT
      + '\n5. Any extension beyond the storage term incurs a premium rate.';
    const filed = await win.negoFileProposal(c, proposed, { side: 'counterparty' });
    assert.equal(filed.length, 1);
    assert.equal(filed[0].type, 'insert');
    assert.equal(filed[0].oldText, '');

    const c2 = plainContract();
    const shorter = PLAIN_CONTRACT.split('\n')
      .filter(l => !l.startsWith('4. Either party')).join('\n');
    const filed2 = await win.negoFileProposal(c2, shorter, { side: 'counterparty' });
    assert.equal(filed2.length, 1);
    assert.equal(filed2[0].type, 'delete');
    assert.equal(filed2[0].newText, '');
  });

  test('identical wording files nothing — there is no change to record', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const filed = await win.negoFileProposal(c, PLAIN_CONTRACT, { side: 'counterparty' });
    assert.equal(filed.length, 0);
    assert.equal(win.negoChanges(c).length, 0);
  });

  test('ids are never reused, even across several proposals', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    await win.negoFileProposal(c, PLAIN_CONTRACT.replace('sixty (60)', 'thirty (30)'), { side: 'counterparty' });
    const ids = win.negoChanges(c).map(x => x.id);
    assert.equal(new Set(ids).size, ids.length, 'a fingerprint must never come back meaning something else');
    assert.equal(ids.join(','), 'CHG-001,CHG-002');
  });

  test('a second live proposal on one clause SUPERSEDES the first, carrying its thread', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [first] = await win.negoFileProposal(c,
      PLAIN_CONTRACT.replace('thirty (30) days', 'sixty (60) days'), { side: 'counterparty' });
    win.negoPostComment(c, first.id, 'Our AP cycle runs monthly.', { side: 'counterparty', author: 'Erik' });
    const [second] = await win.negoFileProposal(c,
      PLAIN_CONTRACT.replace('thirty (30) days', 'forty-five (45) days'), { side: 'counterparty' });

    assert.equal(win.negoChangeById(c, first.id).status, 'superseded');
    assert.equal(second.supersedes, first.id);
    assert.equal(second.thread.length, 1, 'the conversation moves with the change');
    assert.equal(second.thread[0].text, 'Our AP cycle runs monthly.');
    // a superseded change is not something anyone has to decide
    assert.equal(win.negoProgress(c).total, 1);
  });

  test('the fingerprint is stable across accept, reject and reopen', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c,
      PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    const h = ch.hash;
    win.negoResolve(c, ch.id, 'accepted');
    assert.equal(win.negoChangeById(c, ch.id).hash, h);
    win.negoResolve(c, ch.id, 'rejected');
    assert.equal(win.negoChangeById(c, ch.id).hash, h);
    win.negoResolve(c, ch.id, 'pending');
    assert.equal(win.negoChangeById(c, ch.id).hash, h,
      'a hash that moved could not verify the thing it names');
  });

  test('the hash covers the substance and nothing else', () => {
    const { win } = buildWorld();
    const base = { clauseId: 'clause:2.', type: 'modify', oldText: 'a b', newText: 'a c',
      author: 'Erik', createdAt: '2026-07-27T00:00:00.000Z' };
    const same = win.negoHashInput({ ...base, status: 'accepted', summary: 'anything', thread: [1, 2] });
    assert.equal(win.negoHashInput(base), same, 'status, summary and thread must not move the hash');
    assert.notEqual(win.negoHashInput(base), win.negoHashInput({ ...base, newText: 'a d' }));
    assert.notEqual(win.negoHashInput(base), win.negoHashInput({ ...base, author: 'Wanjiru' }));
  });
});

describe('the document is BUILT from the accepted set, never mutated and hoped for', () => {
  test('a pending change is NOT in the document', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    assert.equal(win.negoResolvedText(c), PLAIN_CONTRACT,
      'silence must not adopt a change');
    assert.match(win.docPlainText(c), /thirty \(30\) days/);
  });

  test('rejecting everything reproduces the baseline EXACTLY', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    await win.negoFileProposal(c, PLAIN_CONTRACT
      .replace('thirty (30) days', 'forty-five (45) days')
      .replace('sixty (60) days', 'thirty (30) days')
      .replace('one hundred and twenty (120) days', 'ninety (90) days'), { side: 'counterparty' });
    assert.equal(win.negoProgress(c).total, 3);
    win.negoResolveAll(c, 'rejected');
    assert.equal(win.negoResolvedText(c), PLAIN_CONTRACT,
      'this is the property that makes it safe to run on a legal instrument');
    assert.equal(win.docPlainText(c), PLAIN_CONTRACT);
  });

  test('accepting everything reproduces the proposal exactly', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const proposed = PLAIN_CONTRACT
      .replace('thirty (30) days', 'forty-five (45) days')
      .replace('sixty (60) days', 'thirty (30) days');
    await win.negoFileProposal(c, proposed, { side: 'counterparty' });
    win.negoResolveAll(c, 'accepted');
    assert.equal(win.negoResolvedText(c), proposed);
  });

  test('a partial decision adopts only the accepted wording, and invents nothing', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const filed = await win.negoFileProposal(c, PLAIN_CONTRACT
      .replace('thirty (30) days', 'forty-five (45) days')
      .replace('sixty (60) days', 'ninety (90) days'), { side: 'counterparty' });
    const pay = filed.find(x => /forty-five/.test(x.newText));
    const term = filed.find(x => /ninety \(90\)/.test(x.newText));
    win.negoResolve(c, pay.id, 'accepted');
    win.negoResolve(c, term.id, 'rejected');

    const out = win.negoResolvedText(c);
    assert.match(out, /forty-five \(45\) days/, 'the accepted change is in');
    assert.match(out, /sixty \(60\) days written notice/, 'the rejected clause is at the baseline');
    assert.ok(!/ninety \(90\)/.test(out), 'the refused wording must not appear');
    // and nothing that neither side wrote
    assert.ok(!/forty-five \(45\) days written notice/.test(out));
  });

  test('an accepted DELETE removes the clause; a rejected one keeps it', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const shorter = PLAIN_CONTRACT.split('\n').filter(l => !l.startsWith('4. Either party')).join('\n');
    const [ch] = await win.negoFileProposal(c, shorter, { side: 'counterparty' });
    win.negoResolve(c, ch.id, 'rejected');
    assert.match(win.negoResolvedText(c), /Either party may terminate/);
    win.negoResolve(c, ch.id, 'accepted');
    assert.ok(!/Either party may terminate/.test(win.negoResolvedText(c)));
  });

  test('accepting a change on a RICH contract keeps it formatted', async () => {
    const { win } = buildWorld();
    const c = supplyContract();
    win.negoInit(c);
    const base = win.negoBaseText(c);
    const proposed = base.replace('thirty (30) days of a valid invoice', 'forty-five (45) days of a valid invoice');
    const [ch] = await win.negoFileProposal(c, proposed, { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolve(c, ch.id, 'accepted');

    assert.equal(win.docFormat(c.format), 'rich', 'the document must not be flattened');
    assert.match(c.redlineText, /<h1>RAW MATERIAL SUPPLY AGREEMENT<\/h1>/);
    assert.match(c.redlineText, /<ol start="5">/, 'clause numbering survives');
    assert.match(win.docPlainText(c), /forty-five \(45\) days of a valid invoice/);
  });
});

describe('authorship and the audit trail stay truthful', () => {
  test('the counterparty is recorded as the author of their own wording', async () => {
    const { win, auditActor } = buildWorld();
    const c = plainContract();
    await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'),
      { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB' });
    const line = c.audit.map(e => e.detail).join(' | ');
    assert.match(line, /proposed by Erik Lindqvist · Nordfrakt Logistik AB/);
    assert.match(line, /recorded in their name/);
    assert.ok(!/proposed by Wanjiru/.test(line),
      'the owner must never be credited with the other side\'s wording');
  });

  test('the DECIDER is named separately from the PROPOSER', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolve(c, ch.id, 'accepted');
    const entry = c.audit.find(e => /#CHG-001 accepted/.test(e.detail));
    assert.ok(entry, 'the decision must be on the record');
    assert.match(entry.detail, /accepted by Wanjiru Kamau/);
    assert.match(entry.detail, /proposed by Erik Lindqvist/);
    assert.match(entry.detail, /fingerprint 0x[0-9a-f]{64}/, 'the fingerprint is filed with the decision');
  });

  test('a rejection says the ask travels back as an open point', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolve(c, ch.id, 'rejected', { reply: 'Net-30 stands, or a 2% price increase.' });
    const entry = c.audit.find(e => /#CHG-001 rejected/.test(e.detail));
    assert.match(entry.detail, /travels back as an open point/);

    const points = win.negoOpenPoints(c);
    assert.equal(points.length, 1);
    assert.equal(points[0].id, 'CHG-001');
    assert.equal(points[0].reason, 'Net-30 stands, or a 2% price increase.');
    assert.match(points[0].after, /forty-five \(45\)/);
  });

  test('an executed contract refuses new decisions', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    c.status = 'Signed';
    assert.equal(win.negoResolve(c, ch.id, 'accepted'), null);
    assert.equal(win.negoChangeById(c, ch.id).status, 'pending');
  });
});

describe('discussing a change changes nothing about the contract', () => {
  test('a comment opens no round, captures no version and moves no wording', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'),
      { side: 'counterparty', author: 'Erik' });
    const rounds = (c.rounds || []).length;
    const versions = (c.versions || []).length;
    const text = win.docPlainText(c);
    const status = ch.status;

    win.negoPostComment(c, ch.id, 'Would you take Net-45 with a 1% early-settlement discount?',
      { side: 'owner', author: 'Wanjiru Kamau' });
    win.negoPostComment(c, ch.id, 'That works for us.', { side: 'counterparty', author: 'Erik' });

    assert.equal((c.rounds || []).length, rounds, 'no round was opened');
    assert.equal((c.versions || []).length, versions, 'no version was captured');
    assert.equal(win.docPlainText(c), text, 'the wording did not move');
    assert.equal(win.negoChangeById(c, ch.id).status, status, 'the status did not move');
    assert.equal(win.negoChangeById(c, ch.id).thread.length, 2);
    assert.match(c.audit.map(e => e.detail).join(' '), /the contract is unchanged and no round was opened/);
  });

  test('each side is attributed as itself', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    win.negoPostComment(c, ch.id, 'ours', { side: 'owner' });
    win.negoPostComment(c, ch.id, 'theirs', { side: 'counterparty' });
    const t = win.negoChangeById(c, ch.id).thread;
    assert.equal(t[0].side, 'owner');
    assert.equal(t[0].who, 'Wanjiru Kamau');
    assert.equal(t[1].side, 'counterparty');
    assert.equal(t[1].who, 'Nordfrakt Logistik AB');
  });

  test('an empty comment is not a message', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    assert.equal(win.negoPostComment(c, ch.id, '   '), null);
    assert.equal(win.negoChangeById(c, ch.id).thread.length, 0);
  });
});

describe('progress and the one transition out', () => {
  test('progress counts live changes only', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const filed = await win.negoFileProposal(c, PLAIN_CONTRACT
      .replace('thirty (30) days', 'forty-five (45) days')
      .replace('sixty (60) days', 'ninety (90) days'), { side: 'counterparty' });
    assert.deepEqual({ ...win.negoProgress(c) }, { total: 2, done: 0, pending: 2, pct: 0 });
    win.negoResolve(c, filed[0].id, 'accepted');
    assert.deepEqual({ ...win.negoProgress(c) }, { total: 2, done: 1, pending: 1, pct: 50 });
    win.negoResolve(c, filed[1].id, 'rejected');
    assert.deepEqual({ ...win.negoProgress(c) }, { total: 2, done: 2, pending: 0, pct: 100 });
  });

  test('Ready to sign is a READ of the change set, not a stored flag', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    assert.equal(win.negoReadyToSign(c), false, 'nothing negotiated is not "agreed"');
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    assert.equal(win.negoReadyToSign(c), false);
    win.negoResolve(c, ch.id, 'accepted');
    assert.equal(win.negoReadyToSign(c), true);
    win.negoResolve(c, ch.id, 'pending');
    assert.equal(win.negoReadyToSign(c), false, 'reopening a change withdraws readiness');
  });

  test('closing a round makes the agreed wording the next baseline', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    const [ch] = await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30) days', 'forty-five (45) days'),
      { side: 'counterparty', author: 'Erik' });
    win.negoResolve(c, ch.id, 'accepted');
    const round = win.negoAdvanceRound(c);

    assert.equal(round.n, 1);
    assert.equal(round.changes.length, 1);
    assert.equal(win.negoRound(c), 2);
    assert.match(win.negoBaseText(c), /forty-five \(45\) days/, 'round 2 argues about the agreed text');
    assert.equal(win.negoChanges(c).length, 0, 'the archived set lives on the round');
    assert.equal(win.negoAllChanges(c).length, 1, 'and is still readable as history');
  });

  test('a round with an undecided change cannot be closed', async () => {
    const { win } = buildWorld();
    const c = plainContract();
    await win.negoFileProposal(c, PLAIN_CONTRACT.replace('thirty (30)', 'forty-five (45)'), { side: 'counterparty' });
    assert.equal(win.negoAdvanceRound(c), null);
    assert.equal(win.negoRound(c), 1);
  });
});

/* ============================================================
   The Phase 1 requirement itself: all three intake paths converge.
   ============================================================ */
describe('all three intake paths produce the same normalized shape', () => {
  /* Path 1 — standard template. This is the body the wizard writes: a rich
     document from one of the 12 built-ins in js/templates.js. */
  const standardTemplateContract = () => supplyContract({ id: 'MK-STD-1', template: 'RM' });

  /* Path 2 — custom/user template. Phase 0 confirmed this feature already
     exists (state.settings.customTemplates, js/views/library.js), so the
     contract this produces differs from path 1 in exactly one way: it carries
     templateId instead of a built-in template key. templateFields() in
     js/templatefields.js is already a single accessor over both. */
  const customTemplateContract = () => supplyContract({
    id: 'MK-CUS-1', template: null, templateId: 'tpl_user_1',
    templateName: 'Nordfrakt master warehousing terms' });

  /* Path 3 — uploaded Word file, read by the real docxExtract on real bytes.
     This is the one and only place Word's format matters from here on. */
  async function uploadedWordContract(win){
    const bytes = mkDocx(PLAIN_CONTRACT.split('\n').map(para).join(''));
    const res = await win.docxExtract(bytes);
    assert.ok(res.text && res.text.trim(), 'the extractor must yield wording');
    return { c: { id: 'MK-DOCX-1', name: 'Uploaded warehousing agreement',
      counterparty: 'Nordfrakt Logistik AB', source: 'upload', status: 'Under Review',
      folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
      signatures: [], comments: [],
      upload: { fileName: 'contract.docx', docKind: 'docx', mime: win.DOCX_MIME,
        size: bytes.length, extractedText: res.text, textChars: res.text.length } },
      text: res.text };
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

  test('every path yields a RICH document with clauses and an empty change set', async () => {
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
      assert.equal(s.changes.length, 0, `${label}: a fresh intake has no changes yet`);
      assert.equal(s.round, 1, `${label}: it starts at round 1`);
      assert.equal(s.baselineText, s.text, `${label}: the baseline is the wording as it arrived`);
      // the keys of the shape itself are identical across paths
      assert.deepEqual([...Object.keys(s)].sort(),
        ['baselineText', 'body', 'changes', 'clauses', 'empty', 'format', 'path', 'rich', 'round', 'text'],
        `${label}: the normalized shape must not vary by path`);
    }
  });

  test('the SAME proposal against any path files the same kind of change', async () => {
    const { win } = buildWorld();
    win.TEMPLATES = { RM: { id: 'RM' } };
    win.customTemplates = () => [{ id: 'tpl_user_1' }];

    const cases = [standardTemplateContract(), customTemplateContract()];
    for (const c of cases){
      win.negoNormalizeDocument(c);
      const base = win.negoBaseText(c);
      const [ch] = await win.negoFileProposal(c,
        base.replace('thirty (30) days of a valid invoice', 'forty-five (45) days of a valid invoice'),
        { side: 'counterparty', author: 'Erik Lindqvist' });
      assert.equal(ch.type, 'modify');
      assert.equal(ch.status, 'pending');
      assert.match(ch.hash, /^0x[0-9a-f]{64}$/);
      win.negoResolve(c, ch.id, 'accepted');
      assert.match(win.docPlainText(c), /forty-five \(45\) days of a valid invoice/);
      assert.equal(win.docFormat(c.format), 'rich', 'and it is still a formatted document');
    }
  });

  test('an uploaded Word contract negotiates clause by clause, like anything else', async () => {
    const { win } = buildWorld();
    const { c } = await uploadedWordContract(win);
    const shape = win.negoNormalizeDocument(c);
    assert.ok(shape.clauses.length > 0);

    // change the first negotiable clause, whatever the fixture happens to say
    const target = shape.clauses[0];
    const proposed = shape.text.replace(target.text, target.text.replace(/\.$/, ', as amended.'));
    assert.notEqual(proposed, shape.text, 'the fixture must actually be editable');
    const [ch] = await win.negoFileProposal(c, proposed, { side: 'counterparty', author: 'Erik Lindqvist' });
    assert.equal(ch.type, 'modify');
    assert.equal(ch.clauseId, target.id);
    win.negoResolve(c, ch.id, 'accepted');
    assert.match(win.docPlainText(c), /, as amended\./);
    // the reading view of an uploaded document follows the adopted wording
    assert.match(c.upload.extractedText, /, as amended\./);
  });

  test('Word is needed once, to get the wording in — never again for tracking', async () => {
    const { win } = buildWorld();
    const { c } = await uploadedWordContract(win);
    win.negoNormalizeDocument(c);
    const base = win.negoBaseText(c);
    const target = win.negoClausesOf(base)[0];
    await win.negoFileProposal(c, base.replace(target.text, target.text + ' Amended in HaTi.'),
      { side: 'counterparty', author: 'Erik Lindqvist' });
    win.negoResolveAll(c, 'accepted');
    win.negoAdvanceRound(c);
    // round 2 onwards is entirely native: no file, no round via 'word'
    assert.equal(win.negoRound(c), 2);
    assert.equal((c.rounds || []).filter(r => r.via === 'word').length, 0);
    assert.equal((win.wordVersionList ? win.wordVersionList(c) : []).length, 0,
      'no Word file was needed to track the change');
  });
});
