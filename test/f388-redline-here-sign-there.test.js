/* ============================================================
   f388 — redline here, sign there (Young's go, 26 Sep 2026: "go as
   recommended. Start from the latest main")
   ============================================================
   A contract the other side will sign their own way is worked in HaTi as a
   working file (RL-###), handed over as a clean Word file once both sides
   agree, and filed when the signed copy comes back — at which point it takes
   its contract number (MK-###).

   Two halves:
     (1) the reading, js/outside.js, which BOTH hosts load — asked here
         directly: the references, the route, the clock, the word check, who
         signed and when, and the blanks;
     (2) the server, driven over HTTP with real sessions: the working file,
         the handover route and every wall behind it, the lock, the other
         side's link, the reminders, the filing save and the number.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const { mkDocx, para } = require('./docxfix');

const ROOT = path.join(__dirname, '..');
/* A BUILD WITHOUT THE FEATURE REPORTS A CLAIM AT A TIME rather than failing to load:
   js/outside.js does not exist at the parent, so it reads as empty there and every
   claim that needs it fails on its own line. */
const O = (() => { try { return require('../js/outside.js'); } catch (_) { return {}; } })();
const SA = require('../js/signapproval.js');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ---------------------------------------------------------------------------
   (1) THE READING
   --------------------------------------------------------------------------- */
describe('f388 (1) the references', () => {
  test('1a a working reference is RL-###, and the number printed is the contract number where there is one', () => {
    assert.equal(O.isWorkingId('RL-012'), true);
    assert.equal(O.isWorkingId('MK-012'), false);
    assert.equal(O.workingIdOf(7), 'RL-007');
    assert.equal(O.contractRef({ id: 'RL-012' }), 'RL-012');
    assert.equal(O.contractRef({ id: 'RL-012', contractNo: 'MK-231' }), 'MK-231');
    assert.equal(O.contractRef({ id: 'MK-9' }), 'MK-9', 'every contract on file reads as it always has');
  });
  test('1b a working file is one that has not taken its number; an MK record never is one', () => {
    assert.equal(O.contractIsWorkingFile({ id: 'RL-012' }), true);
    assert.equal(O.contractIsWorkingFile({ id: 'RL-012', contractNo: 'MK-231' }), false);
    assert.equal(O.contractIsWorkingFile({ id: 'MK-5', signRoute: 'outside' }), false);
  });
  test('1c either reference finds the one file, whatever the case typed', () => {
    const c = { id: 'RL-012', contractNo: 'MK-231' };
    assert.equal(O.contractRefMatches(c, 'rl-012'), true);
    assert.equal(O.contractRefMatches(c, ' MK-231 '), true);
    assert.equal(O.contractRefMatches(c, 'MK-23'), false);
  });
  test('1d the route: absent reads "we sign in HaTi", which is what every contract on file does', () => {
    assert.equal(O.signRouteOf({}), 'inside');
    assert.equal(O.signRouteOf({ signRoute: 'outside' }), 'outside');
    assert.equal(O.signRouteOf({ signRoute: 'nonsense' }), 'inside');
  });
  test('1e a working file is listed on Negotiations until it is filed, and never from the shelf or a dead deal', () => {
    assert.equal(O.outsideListed({ id: 'RL-1', status: 'Under Review' }), true);
    assert.equal(O.outsideListed({ id: 'RL-1', status: 'Declined' }), false);
    assert.equal(O.outsideListed({ id: 'RL-1', status: 'Under Review', archived: { at: 'x' } }), false);
    assert.equal(O.outsideListed({ id: 'RL-1', contractNo: 'MK-2', status: 'Signed', execution: { at: 'x' } }), false);
    assert.equal(O.outsideListed({ id: 'MK-3', status: 'Under Review' }), false, 'an ordinary contract is not');
  });
});

describe('f388 (2) the clock', () => {
  const at = '2026-09-25T10:00:00'; // a Friday
  const ho = (over = {}) => ({ id: 'RL-1', status: 'Under Review', signRoute: 'outside', handover: { at, ...over } });
  test('2a working days are counted exactly as the approval reminders count them', () => {
    for (const [from, to] of [['2026-09-25T10:00:00', '2026-10-02T09:00:00'], ['2026-09-26T08:00:00', '2026-09-28T18:00:00'],
      ['2026-12-24T12:00:00', '2027-01-04T12:00:00'], ['2026-09-25T10:00:00', '2026-09-25T11:00:00']])
      assert.equal(O.ohWorkdays(from, Date.parse(to)), SA.saWorkdays(from, Date.parse(to)), `${from} → ${to}`);
  });
  test('2b the first reminder is on the fifth working day, then weekly', () => {
    const first = O.handoverFirstReminderAt(ho());
    assert.equal(new Date(first).getDay(), 5, 'Friday to Friday: five working days');
    assert.equal(O.handoverReminderKey(ho(), first - 1000), null, 'not before');
    assert.equal(O.handoverReminderKey(ho(), first + 1000), 'r1');
    assert.equal(O.handoverReminderKey(ho(), first + 7 * 86400000 + 1000), 'w1');
    assert.equal(O.handoverReminderKey(ho(), first + 14 * 86400000 + 1000), 'w2');
    assert.equal(O.handoverNextReminderAt(ho(), first + 1000), first + 7 * 86400000);
  });
  test('2c after sixty days it asks whether the deal is still live — not while a copy they signed is in, and "keep waiting" starts the count again', () => {
    const d60 = Date.parse(at) + 60 * 86400000 + 1000;
    assert.equal(O.handoverStillLiveDue(ho(), d60 - 2 * 86400000), false);
    assert.equal(O.handoverStillLiveDue(ho(), d60), true);
    assert.equal(O.handoverStage(ho(), d60), 'stale');
    assert.equal(O.handoverStillLiveDue(ho({ partial: { at: '2026-10-01' } }), d60), false);
    assert.equal(O.handoverStage(ho({ partial: { at: '2026-10-01' } }), d60), 'partial');
    assert.equal(O.handoverStillLiveDue(ho({ live: { keptAt: '2026-11-20T10:00:00' } }), d60), false);
  });
  test('2d a reopened handover, or a filed contract, is not out and has no clock', () => {
    assert.equal(O.handoverActive(ho({ cancelledAt: '2026-10-01' })), false);
    assert.equal(O.handoverActive({ ...ho(), status: 'Signed', execution: { at: 'x' } }), false);
    assert.equal(O.handoverReminderKey({ ...ho(), status: 'Signed', execution: { at: 'x' } }, Date.now()), null);
  });
});

describe('f388 (3) the word check', () => {
  const agreed = [
    { text: 'SOFTWARE AS A SERVICE AGREEMENT', title: true },
    { text: 'This Agreement is made between Nordkust Industri AB and Highland Corporate Ltd.' },
    { text: '1. Term. This Agreement is effective from 1 October 2026 and continues until 31 December 2027.', label: '1 · Term' },
    { text: '2. Services. The Provider shall make the Services available to the Customer throughout the Term.', label: '2 · Services' },
    { text: '3. Fees. The Customer shall pay the fees set out in the Order Form within thirty days of invoice.', label: '3 · Fees' },
    { text: '4. Notices. Either party may terminate this Agreement on ninety (90) days written notice to the other party.', label: '4 · Notices' },
  ];
  const body = [
    'This Agreement is made between Nordkust Industri AB and Highland Corporate Ltd.',
    '§1 Term. This Agreement is effective from 1 October 2026 and continues until 31 December 2027.',
    '§2 Services. The Provider shall make the Services available to the Customer throughout the Term.',
    '§3 Fees. The Customer shall pay the fees set out in the Order Form within thirty days of invoice.',
    '§4 Notices. Either party may terminate this Agreement on ninety (90) days written notice to the other party.',
  ];
  const copy = (lines, head = 'SOFTWARE AS A SERVICE AGREEMENT') => [head, ...lines,
    'Signed for Nordkust Industri AB: Lars Berg, 29 September 2026',
    'Signed for Highland Corporate Ltd: Amina Otieno, 30 September 2026'].join('\n');

  test('3a their design and their numbering are not differences; a signature block is shown apart', () => {
    const r = O.outsideCompare(agreed, copy(body));
    assert.equal(r.same, true, JSON.stringify(r.changed));
    assert.ok(r.aroundWords > 0, 'the signature block is around the agreement');
    assert.equal(r.inserted.length, 0);
  });
  test('3b the document name may carry their company; a title missing an agreed word is still a difference', () => {
    assert.equal(O.outsideCompare(agreed, copy(body, 'NORDKUST INDUSTRI AB — SOFTWARE AS A SERVICE AGREEMENT')).same, true);
    const lost = O.outsideCompare(agreed, copy(body, 'SOFTWARE SERVICE AGREEMENT'));
    assert.equal(lost.same, false);
    const notTitle = O.outsideCompare(agreed.map(p => ({ ...p, title: false })), copy(body, 'NORDKUST INDUSTRI AB — SOFTWARE AS A SERVICE AGREEMENT'));
    assert.equal(notTitle.same, false, 'only the document name has that allowance');
  });
  test('3c one changed word is named by its clause, with both wordings', () => {
    const b = body.slice(); b[4] = b[4].replace('ninety (90)', 'thirty (30)');
    const r = O.outsideCompare(agreed, copy(b));
    assert.equal(r.same, false);
    assert.equal(r.changedCount, 1);
    assert.equal(r.changed[0].label, '4 · Notices');
    assert.ok(r.changed[0].a.some(x => x.t === 'd' && /ninety/.test(x.s)));
    assert.ok(r.changed[0].b.some(x => x.t === 'i' && /thirty/.test(x.s)));
  });
  test('3d words added on the same line as a clause are part of it', () => {
    const b = body.slice(); b[3] = b[3] + ' Late payment carries interest at 2% a month.';
    const r = O.outsideCompare(agreed, copy(b));
    assert.equal(r.same, false);
    assert.equal(r.changed[0].label, '3 · Fees');
  });
  test('3e a clause left out is missing; a paragraph added inside the agreement is inserted', () => {
    const missing = O.outsideCompare(agreed, copy(body.filter((_, i) => i !== 2)));
    assert.equal(missing.missingCount, 1);
    assert.equal(missing.missing[0].label, '2 · Services');
    const b = body.slice(); b.splice(3, 0, 'The Customer waives every right to withhold payment for any reason whatsoever.');
    const ins = O.outsideCompare(agreed, copy(b));
    assert.equal(ins.same, false);
    assert.equal(ins.inserted.length, 1);
  });
  test('3f a term renamed throughout is said once, as a rename', () => {
    const b = body.map(l => l.replace(/Customer/g, 'Client'));
    const r = O.outsideCompare(agreed, copy(b));
    assert.equal(r.same, false);
    assert.deepEqual(r.renamed.map(x => [x.from, x.to]), [['customer', 'client']]);
  });
  test('3g a document with almost nothing in common is not this agreement\'s signed copy', () => {
    const r = O.outsideCompare(agreed, 'MINUTES OF THE BOARD\nThe board met on Tuesday and approved the budget for the coming year.');
    assert.equal(r.unrelated, true);
    assert.equal(r.same, false);
  });
  test('3h a heading of five or six words is found whole, on a line of its own', () => {
    const r = O.outsideCompare([{ text: 'Five words in this heading' }, { text: agreed[1].text }],
      'Five words in this heading\n' + agreed[1].text);
    assert.equal(r.same, true);
  });
  test('3i the record line is English and says what was found', () => {
    assert.match(O.outsideCompareLine(O.outsideCompare(agreed, copy(body))), /^Same wording as agreed/);
    const b = body.slice(); b[4] = b[4].replace('ninety (90)', 'thirty (30)');
    assert.match(O.outsideCompareLine(O.outsideCompare(agreed, copy(b))), /differ/i);
  });
});

describe('f388 (4) who signed, and when', () => {
  const text = [
    'Signed for Nordkust Industri AB: Lars Berg, 29 September 2026',
    'Signed for Highland Corporate Ltd: Amina Otieno, 30/09/2026',
    'DocuSign Envelope ID: 1A2B3C4D-1111-2222-3333-444455556666',
  ].join('\n');
  test('4a a named signer is found with the date beside the name; the day it was signed is the LAST signature', () => {
    const r = O.outsideReadCopy(text, [{ name: 'Lars Berg', side: 'theirs' }, { name: 'Amina Otieno', side: 'ours' }]);
    assert.deepEqual(r.signers.map(s => [s.name, s.found, s.on]), [['Lars Berg', true, '2026-09-29'], ['Amina Otieno', true, '2026-09-30']]);
    assert.equal(r.signedOn, '2026-09-30');
    assert.equal(r.via, 'docusign');
    assert.equal(r.envelope, '1A2B3C4D-1111-2222-3333-444455556666');
  });
  test('4b nobody named on their side: their company beside a signature word is the reading — and it says it is unsure', () => {
    const r = O.outsideReadCopy(text, [{ name: 'Nordkust Industri AB', side: 'theirs', party: true }]);
    assert.equal(r.signers[0].found, true);
    assert.equal(r.signers[0].unsure, true);
    assert.equal(r.signers[0].on, '2026-09-29');
    const no = O.outsideReadCopy('Nordkust Industri AB is a company in Sweden.', [{ name: 'Nordkust Industri AB', side: 'theirs', party: true }]);
    assert.equal(no.signers[0].found, false, 'a company named in the wording is not a signature');
  });
  test('4c a surname alone is a weaker reading, and says so; a date merely printed is no signature', () => {
    const r = O.outsideReadCopy('Signed: P. Rotich, 2 October 2026', [{ name: 'Peter Rotich', side: 'ours' }]);
    assert.equal(r.signers[0].found, true);
    assert.equal(r.signers[0].unsure, true);
    const d = O.outsideReadCopy('This agreement starts on 1 October 2026.', [{ name: 'Peter Rotich', side: 'ours' }]);
    assert.equal(d.signedOn, '', 'no name found, no signing date');
  });
  test('4d "starts on the last signature" is read, so the start date can be filled rather than asked', () => {
    assert.equal(O.outsideStartsOnSignature('This Agreement takes effect on the date of the last signature below.'), true);
    assert.equal(O.outsideStartsOnSignature('This Agreement takes effect on 1 October 2026.'), false);
  });
});

describe('f388 (5) a blank still in the agreed words', () => {
  test('5a bracketed and braced blanks are found; a bracket that says what it is, is not a blank', () => {
    const found = O.outsideBlanksIn('Fee: [Insert amount]. Party: [COMPANY NAME]. Ref {{po_number}}. [Signature] [Schedule 2] [Reserved] [INTENTIONALLY LEFT BLANK]');
    assert.deepEqual(found, ['[Insert amount]', '[COMPANY NAME]', '{{po_number}}']);
  });
  test('5b a ruled line is never a blank: their signature page is lines to be signed on', () => {
    assert.deepEqual(O.outsideBlanksIn('Signature: ____________  Date: __________'), []);
  });
});

describe('f388 (6) every file the route keeps is the contract\'s', () => {
  test('6a the agreed Word file, a partial copy, a held copy, the signed copy, the certificate, and the reopened ones', () => {
    const c = { handover: { file: { fileId: 'f1' }, partial: { fileId: 'f2' }, held: { fileId: 'f3' } },
      handoverHistory: [{ file: { fileId: 'f4' } }], execution: { fileId: 'f5' },
      signedCopy: { file: { fileId: 'f5' }, certificate: { fileId: 'f6' } } };
    assert.deepEqual(O.outsideFileIds(c), ['f1', 'f2', 'f3', 'f4', 'f5', 'f6']);
  });
  test('6b the server asks it wherever it decides which files a contract owns', () => {
    const s = read('server/server.js');
    const n = (s.match(/outsideFileIds\(/g) || []).length;
    assert.ok(n >= 5, `asked in the scope check, the delete, the demo clear and both orphan sweeps (${n})`);
  });
});

/* ---------------------------------------------------------------------------
   (7) THE SERVER
   --------------------------------------------------------------------------- */
describe('f388 (7) the server is the wall', () => {
  let h, W, me, U1;
  const get = (cl, id) => cl.json('/api/contracts/' + id);
  const put = async (cl, c) => { const v = c._v; const body = { ...c }; delete body._v;
    return cl.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion: v } }); };
  const act = (cl, id, body) => cl.raw('/api/contracts/' + id + '/handover', { method: 'POST', body });
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const docx = lines => Buffer.from(mkDocx(lines.map(l => para(l)).join(''))).toString('base64');
  const AGREED = ['SOFTWARE AS A SERVICE AGREEMENT',
    'This Agreement is made between Nordkust Industri AB and Highland Corporate Ltd.',
    '1. Term. This Agreement is effective from 1 October 2026 and continues until 31 December 2027.',
    '2. Fees. The Customer shall pay the fees set out in the Order Form within thirty days of invoice.'];
  const hand = (over = {}) => ({ act: 'hand', how: { kind: 'email', at: today() }, channel: 'download',
    to: { name: '', email: '' }, note: '', agreedHash: 'h-agreed', agreedWords: 40, version: 1,
    file: { filename: 'RL-001-agreed.docx', content: docx(AGREED) }, ...over });
  const working = (id, over = {}) => ({ id, name: 'SaaS agreement', counterparty: 'Nordkust Industri AB',
    folder: 'proc', value: 120000, valueType: 'standard', status: 'Under Review', signRoute: 'outside',
    template: null, redlineText: AGREED.join('\n'), format: 'text', lastAction: '26 Sep 2026',
    upload: { fileName: 'saas.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', extractedText: AGREED.join('\n') },
    fields: {}, metadata: { currency: 'KES' }, audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Uploaded', detail: 'fixture' }],
    signatures: [], obligations: [], rounds: [], ...over });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    me = (await W.admin.json('/api/bootstrap')).me;
    U1 = W.users.unrestricted;
  });
  after(async () => { await h.stop(); });

  test('7a a working file is saved under its working reference and carries no number yet', async () => {
    const r = await W.admin.raw('/api/contracts/RL-001', { method: 'PUT', body: { contract: working('RL-001'), baseVersion: 0, rlUid: 1 } });
    assert.equal(r.status, 200, r.text);
    assert.ok(!r.json.contractNo, 'no number while it is a working file');
    assert.equal(r.json.rlUid, 1, 'the working counter is kept on the server and only goes up');
    const c = await get(W.admin, 'RL-001');
    assert.equal(c.signRoute, 'outside');
    assert.ok(!c.contractNo);
    const boot = await W.admin.json('/api/bootstrap');
    assert.equal(Number(boot.rlUid), 1);
  });

  test('7b the handover is refused where HaTi runs the signing, and until the negotiation is settled', async () => {
    await W.admin.json('/api/contracts/MK-A2', { method: 'GET' });
    let r = await act(W.admin, 'MK-A2', hand());
    assert.equal(r.status, 409, r.text);
    assert.match(r.json.error, /HaTi runs the signing/);
    const c = await get(W.admin, 'RL-001');
    c.changes = [{ id: 'CHG-001', status: 'pending', clauseId: 'cl_1', authorSide: 'counterparty' }];
    assert.equal((await put(W.admin, c)).status, 200);
    r = await act(W.admin, 'RL-001', hand());
    assert.equal(r.status, 409);
    assert.match(r.json.error, /still open/);
    const c2 = await get(W.admin, 'RL-001');
    c2.changes = [];
    assert.equal((await put(W.admin, c2)).status, 200);
  });

  test('7c how they agreed is asked, never assumed: a day, and never a day that has not come', async () => {
    let r = await act(W.admin, 'RL-001', hand({ how: { kind: 'email', at: '' } }));
    assert.equal(r.status, 400);
    r = await act(W.admin, 'RL-001', hand({ how: { kind: 'email', at: '2999-01-01' } }));
    assert.equal(r.status, 400);
    r = await act(W.admin, 'RL-001', hand({ how: { kind: 'signal' } }));
    assert.equal(r.status, 400, 'no Ready to sign from them on file');
    assert.match(r.json.error, /Ready to sign/);
  });

  test('7d the file is read, not trusted: it has to be a Word document, and it may not carry a blank', async () => {
    let r = await act(W.admin, 'RL-001', hand({ file: { filename: 'x.docx', content: Buffer.from('not a zip at all').toString('base64') } }));
    assert.equal(r.status, 400, r.text);
    assert.match(r.json.error, /not a Word document/);
    r = await act(W.admin, 'RL-001', hand({ file: { filename: 'x.docx', content: docx([...AGREED, '3. Liability. The cap is [Insert amount].']) } }));
    assert.equal(r.status, 409, r.text);
    assert.deepEqual(r.json.blanks, ['[Insert amount]']);
    r = await act(W.admin, 'RL-001', hand({ file: {} }));
    assert.equal(r.status, 400);
  });

  test('7e the handover is written by the route, on the stored record, and the Word file is kept', async () => {
    const r = await act(W.admin, 'RL-001', hand());
    assert.equal(r.status, 200, r.text);
    const ho = r.json.handover;
    assert.equal(ho.how.kind, 'email');
    assert.equal(ho.channel, 'download');
    assert.ok(ho.file.fileId);
    assert.ok(r.json.audit.some(l => l.action === 'Handed over'));
    const f = await W.admin.json('/api/files/' + ho.file.fileId);
    assert.match(f.dataUrl, /^data:application\/vnd\.openxmlformats/);
    const again = await act(W.admin, 'RL-001', hand());
    assert.equal(again.status, 409, 'handed over once');
  });

  test('7f while it is out the words lock — and a save cannot forge, lift or move the handover', async () => {
    const c = await get(W.admin, 'RL-001');
    assert.ok(c.handover && c.handover.at);
    let r = await put(W.admin, { ...c, redlineText: c.redlineText + '\n5. Extra.' });
    assert.equal(r.status, 409);
    assert.equal(r.json.handoverFreeze, true);
    r = await put(W.admin, { ...c, value: 999 });
    assert.equal(r.status, 409, 'the value the approver said yes to is locked too');
    r = await put(W.admin, { ...c, signRoute: undefined });
    assert.equal(r.status, 409, 'and the route');
    const c2 = await get(W.admin, 'RL-001');
    r = await put(W.admin, { ...c2, handover: null, name: 'Renamed while out' });
    assert.equal(r.status, 200, 'a save that tries to drop the handover is simply not listened to');
    assert.ok((await get(W.admin, 'RL-001')).handover.at, 'the stored handover stands');
    const c3 = await get(W.admin, 'RL-001');
    r = await put(W.admin, { ...c3, signatures: [{ name: me.name, email: me.email, method: 'session-authenticated',
      at: new Date().toISOString(), identity: `session:${me.id}` }] });
    assert.equal(r.status, 409, 'nobody signs it in HaTi while it is out');
  });

  test('7g no signing link on this route, and no round while it is out; their link reads only', async () => {
    const payload = purpose => ({ kind: 'hati-share', purpose, purposeChosen: purpose, org: 'Highland Corporate Ltd',
      sharedBy: 'Amina Otieno', at: new Date().toISOString(), contract: { id: 'RL-001', name: 'x', docText: 'x' } });
    let r = await W.admin.raw('/api/shares', { method: 'POST', body: { payload: payload('sign'), channel: 'link',
      recipient: { name: 'Lars', email: 'lars@nordkust.se' }, expiryDays: 30, purpose: 'sign' } });
    assert.equal(r.status, 409);
    assert.equal(r.json.theySign, true);
    r = await W.admin.raw('/api/shares', { method: 'POST', body: { payload: payload('negotiate'), channel: 'link',
      recipient: { name: 'Lars', email: 'lars@nordkust.se' }, expiryDays: 30, durable: true, purpose: 'negotiate' } });
    assert.equal(r.status, 409);
    assert.equal(r.json.handedOver, true);
    r = await W.admin.raw('/api/shares', { method: 'POST', body: { payload: payload('view'), channel: 'link',
      recipient: { name: 'Lars', email: 'lars@nordkust.se' }, expiryDays: 30, purpose: 'view' } });
    assert.equal(r.status, 200, 'reading it is fine');
  });

  test('7h send again, chase: to an address, and a chase only ever to the address it was sent to', async () => {
    let r = await act(W.admin, 'RL-001', { act: 'chase' });
    assert.equal(r.status, 200);
    assert.equal(r.json.reason, 'no-address', 'downloaded and sent by hand: nothing to chase, said');
    r = await act(W.admin, 'RL-001', { act: 'send', to: { name: 'Lars', email: 'not-an-address' } });
    assert.equal(r.status, 400);
    r = await act(W.admin, 'RL-001', { act: 'send', to: { name: 'Lars Berg', email: 'lars@nordkust.se' } });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.outbox, true, 'no provider in the test: the outbox, said');
    r = await act(W.admin, 'RL-001', { act: 'chase', to: { email: 'somebody@else.com' } });
    assert.equal(r.status, 400, 'a chase never takes an address from the body');
    r = await act(W.admin, 'RL-001', { act: 'chase' });
    assert.equal(r.status, 200, r.text);
    const box = (await W.admin.json('/api/outbox')).items || [];
    assert.ok(box.filter(m => m.to_addr === 'lars@nordkust.se').length >= 2, 'the Word file and the chase');
  });

  test('7i the check before we sign and a copy only they have signed are recorded, and the clock can be kept', async () => {
    let r = await act(W.admin, 'RL-001', { act: 'check', fileName: 'theirs.pdf', sha256: 'abc',
      result: { same: true, line: 'Same wording as agreed — 3 parts match.' } });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.handover.checks.length, 1);
    r = await act(W.admin, 'RL-001', { act: 'live' });
    assert.equal(r.status, 200);
    assert.ok(r.json.handover.live && r.json.handover.live.keptAt);
  });

  test('7j the old paper door is closed: a signed copy is filed on a file that was handed over, or not at all', async () => {
    const c = await get(W.admin, 'MK-A2');
    const r = await put(W.admin, { ...c, status: 'Signed', execution: { at: new Date().toISOString(), method: 'paper', offPlatform: true } });
    assert.equal(r.status, 409, r.text);
    assert.equal(r.json.handoverNeeded, true);
  });

  let signedFile = null;
  test('7k filing checks what it is told: the copy on the server, how it was signed, and a difference needs the right person', async () => {
    const up = await W.admin.json('/api/files', { method: 'POST', body: { name: 'signed.pdf', mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK' } });
    signedFile = up.id;
    const base = await get(W.admin, 'RL-001');
    const filed = (over = {}) => ({ ...base, status: 'Signed', signedAt: '2026-09-30',
      execution: { at: new Date().toISOString(), by: me.name, method: 'outside', offPlatform: true, via: 'docusign',
        fileName: 'signed.pdf', fileHash: 'sha', fileId: signedFile, signedOn: '2026-09-30' },
      signedCopy: { at: new Date().toISOString(), by: { id: me.id, name: me.name }, via: 'docusign',
        file: { name: 'signed.pdf', fileId: signedFile, sha256: 'sha' }, signedOn: '2026-09-30',
        compare: { same: true, line: 'Same wording as agreed.' }, differs: null, everyone: true }, sealVersion: 3, hash: 'h', ...over });
    let r = await put(W.admin, filed({ signedCopy: { ...filed().signedCopy, everyone: false } }));
    assert.equal(r.status, 400, 'filing needs every party\'s signature on the copy');
    assert.equal(r.json.everyone, false);
    r = await put(W.admin, filed({ signedCopy: { ...filed().signedCopy, file: { name: 'x', fileId: 'f_nothere', sha256: 's' } } }));
    assert.equal(r.status, 400, 'the copy has to be on the server');
    r = await put(W.admin, filed({ execution: { ...filed().execution, via: 'carrier pigeon' } }));
    assert.equal(r.status, 400, 'how it was signed is one of the five answers');
    const differs = filed({ signedCopy: { ...filed().signedCopy, compare: { same: false }, differs: null } });
    r = await put(W.admin, differs);
    assert.equal(r.status, 403, 'a copy whose words differ needs a reason');
    const asOther = { ...differs, signedCopy: { ...differs.signedCopy, differs: { by: { id: U1.id, name: U1.name, role: 'legal' }, why: 'fine', at: new Date().toISOString() } } };
    r = await put(W.unrestricted, asOther);
    assert.equal(r.status, 403, 'and the approver or an admin — not whoever is holding the file');
  });

  /* FOUND ON THE LAST READ-THROUGH: the wall counted a WITHDRAWN request as an
     approval, where the browser's own reading (_hoApprovedBy) counts only one that
     was given. A request taken back while it waited was never a yes, and one
     withdrawn at a reopen was a yes to wording that has since moved. The function
     itself is evaluated, off the server's own source. */
  test('7k2 only an approval that was GIVEN may accept a copy whose words differ — a withdrawn request is not a yes', () => {
    const SRV = read('server/server.js');
    const at = SRV.indexOf('function srvMayAcceptDiffer(');
    assert.ok(at > 0, 'the wall is one named function');
    const src = SRV.slice(at, SRV.indexOf('\n}\n', at) + 2);
    const may = new Function('handoverOf', src + '\nreturn srvMayAcceptDiffer;')(c => (c && c.handover) || null);
    const ola = { id: 'u9', name: 'Ola Berg', role: 'legal' };
    const asked = status => ({ signApprovals: [{ status, approverId: 'u9', backupId: 'u8',
      decidedBy: status === 'approved' ? { id: 'u9' } : null }] });
    assert.equal(may(asked('approved'), ola), true, 'the approver who said yes');
    assert.equal(may(asked('withdrawn'), ola), false, 'a request taken back is not a yes');
    assert.equal(may(asked('pending'), ola), false, 'nor is one still waiting');
    assert.equal(may(asked('refused'), ola), false, 'nor a no');
    assert.equal(may({}, { ...ola, role: 'admin' }), true, 'an admin always');
    assert.equal(may({ handover: { approvals: [{ byId: 'u9' }] } }, ola), true, 'and whoever approved the version that went out');
  });

  test('7l filed as signed, the contract takes its number from the server in the same save', async () => {
    const base = await get(W.admin, 'RL-001');
    const c = { ...base, status: 'Signed', signedAt: '2026-09-30',
      execution: { at: new Date().toISOString(), by: me.name, method: 'outside', offPlatform: true, via: 'docusign',
        fileName: 'signed.pdf', fileHash: 'sha', fileId: signedFile, signedOn: '2026-09-30' },
      signedCopy: { at: new Date().toISOString(), by: { id: me.id, name: me.name }, via: 'docusign',
        file: { name: 'signed.pdf', fileId: signedFile, sha256: 'sha' }, signedOn: '2026-09-30',
        compare: { same: true, line: 'Same wording as agreed.' }, differs: null, everyone: true }, sealVersion: 3, hash: 'h' };
    const r = await put(W.admin, c);
    assert.equal(r.status, 200, r.text);
    assert.match(r.json.contractNo, /^MK-\d+$/);
    assert.equal(r.json.contractNo, 'MK-201', 'the next number after the workspace\'s own counter (uid 200)');
    assert.ok(r.json.numberedLine && /took contract number MK-201/.test(r.json.numberedLine.detail));
    const back = await get(W.admin, 'RL-001');
    assert.equal(back.contractNo, 'MK-201');
    assert.equal(back.id, 'RL-001', 'the key never changes');
    const boot = await W.admin.json('/api/bootstrap');
    assert.ok(Number(boot.uid) >= 201, 'the contract counter moved past the number given');
    const told = await act(W.admin, 'RL-001', { act: 'filed' });
    assert.equal(told.status, 200, told.text);
  });

  test('7m the number, the signed copy and the route are part of what was signed', async () => {
    const c = await get(W.admin, 'RL-001');
    let r = await put(W.admin, { ...c, contractNo: 'MK-999' });
    assert.equal((await get(W.admin, 'RL-001')).contractNo, 'MK-201', 'a save never moves the number');
    r = await put(W.admin, { ...c, signedCopy: { ...c.signedCopy, file: { ...c.signedCopy.file, name: 'swapped.pdf' } } });
    assert.equal(r.status, 409, 'swapping the signed copy is not an edit to a signed contract');
    const f = await W.admin.json('/api/files/' + signedFile);
    assert.ok(f.dataUrl, 'the signed copy is readable by whoever can read the contract');
  });

  test('7n a new working file cannot take an id that is already a contract number', async () => {
    const r = await W.admin.raw('/api/contracts/MK-201', { method: 'PUT', body: { contract: working('MK-201', { signRoute: undefined }), baseVersion: 0 } });
    assert.equal(r.status, 409);
    assert.equal(r.json.idTaken, true);
  });

  test('7o activity carries the number, so the feed prints it', async () => {
    const r = await W.admin.json('/api/activity?limit=200');
    const ev = (r.events || []).find(e => e.id === 'RL-001');
    assert.ok(ev, 'the working file is in the feed');
    assert.equal(ev.contractNo, 'MK-201');
  });

  test('7p reopen: the handover is withdrawn, the words unlock, and their link says the version was withdrawn', async () => {
    const put2 = await W.admin.raw('/api/contracts/RL-002', { method: 'PUT', body: { contract: working('RL-002'), baseVersion: 0, rlUid: 2 } });
    assert.equal(put2.status, 200, put2.text);
    const share = await W.admin.json('/api/shares', { method: 'POST', body: { payload: { kind: 'hati-share', purpose: 'negotiate',
      purposeChosen: 'negotiate', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
      contract: { id: 'RL-002', name: 'x', docText: 'x' } }, channel: 'link', recipient: { name: 'Lars', email: 'lars@nordkust.se' },
      expiryDays: 30, durable: true, purpose: 'negotiate' } });
    let r = await act(W.admin, 'RL-002', hand({ file: { filename: 'RL-002-agreed.docx', content: docx(AGREED) } }));
    assert.equal(r.status, 200, r.text);
    const live = await h.client('them').json('/api/shares/' + share.token);
    assert.equal(live.handover.live, true, 'their link knows the words are with them');
    const dl = await h.client('them').raw('/api/shares/' + share.token + '/handover-file');
    assert.equal(dl.status, 200);
    assert.match(dl.headers.get('content-type'), /wordprocessingml/);
    const refused = await h.client('them').raw('/api/shares/' + share.token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'RL-002', action: 'comment', comment: 'x', at: new Date().toISOString() } });
    assert.equal(refused.status, 409, 'nothing more is answered on the link while it is out');
    assert.ok(refused.json.handedOver);
    r = await act(W.admin, 'RL-002', { act: 'reopen', why: 'They asked for a longer notice period.' });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.handover, null);
    assert.ok(r.json.handoverHistory.length === 1 && r.json.handoverHistory[0].cancelledAt);
    const after = await h.client('them').json('/api/shares/' + share.token);
    assert.ok(after.handover && after.handover.withdrawnAt, 'the version handed over was withdrawn — said on their link');
    const c = await get(W.admin, 'RL-002');
    const ok = await put(W.admin, { ...c, redlineText: c.redlineText + '\n3. Notice. Ninety days.' });
    assert.equal(ok.status, 200, 'the words unlock');
  });

  test('7q the route moves only before anybody signs in HaTi', async () => {
    const c = await get(W.admin, 'MK-A2');
    c.signerPlan = [{ id: 'sg1', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false },
      { id: 'sg2', party: 'counterparty', name: 'Grace', email: 'grace@nandi.co.ke', order: 2, signed: false }];
    c.signatures = [{ name: me.name, email: me.email, method: 'session-authenticated', at: new Date().toISOString(), identity: `session:${me.id}`, party: 'first' }];
    let r = await put(W.admin, c);
    assert.equal(r.status, 200, r.text);
    const c2 = await get(W.admin, 'MK-A2');
    r = await put(W.admin, { ...c2, signRoute: 'outside' });
    assert.equal(r.status, 409);
    assert.equal(r.json.routeFreeze, true);
  });

  test('7r the reminder goes to the lead on the fifth working day, once, and the still-live question after sixty days', async () => {
    const put3 = await W.admin.raw('/api/contracts/RL-003', { method: 'PUT', body: { contract: working('RL-003'), baseVersion: 0, rlUid: 3 } });
    assert.equal(put3.status, 200, put3.text);
    const r = await act(W.admin, 'RL-003', hand({ file: { filename: 'RL-003-agreed.docx', content: docx(AGREED) } }));
    assert.equal(r.status, 200, r.text);
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const row = db.prepare('SELECT json FROM contracts WHERE id=?').get('RL-003');
    const c = JSON.parse(row.json);
    c.handover.at = new Date(Date.now() - 12 * 86400000).toISOString();
    db.prepare('UPDATE contracts SET json=? WHERE id=?').run(JSON.stringify(c), 'RL-003');
    db.close();
    const run = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(run.handover && run.handover.sent >= 1, JSON.stringify(run));
    const ofMine = async () => ((await W.admin.json('/api/outbox')).items || [])
      .filter(m => m.to_addr === me.email && /RL-003/.test(String(m.subject) + String(m.body)));
    const mine = await ofMine();
    assert.ok(mine.length >= 1, 'the lead is reminded');
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.equal((await ofMine()).length, mine.length, 'and only once for that reminder');
    /* sixty-five days out: the still-live question, once */
    const db2 = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const c2 = JSON.parse(db2.prepare('SELECT json FROM contracts WHERE id=?').get('RL-003').json);
    c2.handover.at = new Date(Date.now() - 65 * 86400000).toISOString();
    db2.prepare('UPDATE contracts SET json=? WHERE id=?').run(JSON.stringify(c2), 'RL-003');
    db2.close();
    const run3 = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(run3.handover.sent >= 1, JSON.stringify(run3));
    const live = (await ofMine()).filter(m => /still live|lever/i.test(String(m.subject) + String(m.body)));
    assert.equal(live.length, 1, 'is the deal still live? — asked');
  });
});

/* ---------------------------------------------------------------------------
   (9) MORE THAN TWO PARTIES (Phase 2)
   --------------------------------------------------------------------------- */
describe('f388 (9) every party that negotiated agrees, and the file goes to each', () => {
  let h, W;
  const act = (cl, id, body) => cl.raw('/api/contracts/' + id + '/handover', { method: 'POST', body });
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const docx = lines => Buffer.from(mkDocx(lines.map(l => para(l)).join(''))).toString('base64');
  const LINES = ['SUPPLY AGREEMENT', 'This Agreement is made between Highland Corporate Ltd, Nordkust Industri AB and Baltic Freight AB.',
    '1. Supply. The Supplier shall supply the goods set out in Schedule 1.'];
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const c = { id: 'RL-001', name: 'Three-party supply', counterparty: 'Nordkust Industri AB', folder: 'proc', value: 120000,
      valueType: 'standard', status: 'Under Review', signRoute: 'outside', redlineText: LINES.join('\n'), format: 'text',
      upload: { fileName: 'x.docx', extractedText: LINES.join('\n') }, lastAction: '26 Sep 2026', fields: {}, metadata: { currency: 'KES' },
      parties: [{ id: 'py_us', name: 'Highland Corporate Ltd', side: 'ours', involvement: 'negotiate' },
        { id: 'py_a', name: 'Nordkust Industri AB', side: 'theirs', involvement: 'negotiate', email: 'lars@nordkust.se' },
        { id: 'py_b', name: 'Baltic Freight AB', side: 'theirs', involvement: 'negotiate', email: 'eva@balticfreight.se' }],
      audit: [], signatures: [], obligations: [], rounds: [] };
    const r = await W.admin.raw('/api/contracts/RL-001', { method: 'PUT', body: { contract: c, baseVersion: 0, rlUid: 1 } });
    assert.equal(r.status, 200, r.text);
  });
  after(async () => { await h.stop(); });

  test('9a one day for "they" is not enough: each party that negotiated is named, or nothing is handed over', async () => {
    const r = await act(W.admin, 'RL-001', { act: 'hand', how: { kind: 'email', at: today() }, channel: 'download',
      file: { filename: 'a.docx', content: docx(LINES) } });
    assert.equal(r.status, 400, r.text);
    assert.deepEqual(r.json.parties.sort(), ['py_a', 'py_b']);
    assert.match(r.json.error, /Nordkust Industri AB/);
    assert.match(r.json.error, /Baltic Freight AB/);
    const one = await act(W.admin, 'RL-001', { act: 'hand', how: { kind: 'email', parties: [{ id: 'py_a', at: today() }] }, channel: 'download',
      file: { filename: 'a.docx', content: docx(LINES) } });
    assert.equal(one.status, 400);
    assert.deepEqual(one.json.parties, ['py_b']);
  });

  test('9b every party\'s day, and the Word file mailed to each address — each send recorded and said', async () => {
    const r = await act(W.admin, 'RL-001', { act: 'hand', how: { kind: 'email', parties: [{ id: 'py_a', at: today() }, { id: 'py_b', at: today() }] },
      channel: 'email', to: { name: 'Lars', email: 'lars@nordkust.se' }, also: [{ name: 'Eva', email: 'eva@balticfreight.se', partyId: 'py_b' }],
      file: { filename: 'a.docx', content: docx(LINES) } });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.handover.how.parties.length, 2);
    assert.deepEqual(r.json.handover.sends.map(s => s.to.email), ['lars@nordkust.se', 'eva@balticfreight.se']);
    const line = r.json.audit.find(l => l.action === 'Handed over').detail;
    assert.match(line, /Nordkust Industri AB on/);
    assert.match(line, /Baltic Freight AB on/);
    assert.match(line, /eva@balticfreight\.se/);
    const box = (await W.admin.json('/api/outbox')).items || [];
    assert.ok(box.some(m => m.to_addr === 'eva@balticfreight.se'), 'the second party got the file too');
  });

  test('9c a difference on a copy only they have signed is accepted by the approver or an admin, with a reason — and nothing is filed', async () => {
    const up = await W.admin.json('/api/files', { method: 'POST', body: { name: 'part.pdf', mime: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK' } });
    let r = await act(W.unrestricted, 'RL-001', { act: 'partial', fileId: up.id, fileName: 'part.pdf', differs: { why: 'fine' } });
    assert.equal(r.status, 403, 'not whoever is holding the file');
    r = await act(W.admin, 'RL-001', { act: 'partial', fileId: up.id, fileName: 'part.pdf', differs: { why: '' } });
    assert.equal(r.status, 400, 'a reason');
    r = await act(W.admin, 'RL-001', { act: 'partial', fileId: up.id, fileName: 'part.pdf', signedBy: ['Nordkust Industri AB'],
      differs: { why: 'Their template says "Client"; the meaning is the same.' } });
    assert.equal(r.status, 200, r.text);
    assert.equal(r.json.handover.partial.same, false);
    assert.equal(r.json.handover.partial.differs.by.name, 'Amina Otieno');
    const c = await W.admin.json('/api/contracts/RL-001');
    assert.notEqual(c.status, 'Signed', 'a part-signed copy is never the contract of record');
  });
});

/* ---------------------------------------------------------------------------
   (8) BOTH BOOKS
   --------------------------------------------------------------------------- */
/* ---------------------------------------------------------------------------
   (10) THE UPLOAD'S RECOGNITION HAS A CAP, AND SAYS SO BY CONSTRUCTION
   --------------------------------------------------------------------------- */
describe('f388 (10) more files out than the upload compares', () => {
  /* A CAP IS A FACT, NEVER A SILENT TRIM. The first build compared the first
     twenty files out in the order the list held them and offered the first forty
     in the pick-list: a twenty-first file out was never recognised, and a
     forty-first could not be chosen at all. Driven in the page's own world. */
  const { buildWorld } = require('./world');
  const LINES = ['SUPPLY AGREEMENT', '1. Term. This Agreement runs for two years from the effective date.',
    '2. Price. The Buyer shall pay the price in the Order within thirty days of invoice.',
    '3. Law. This Agreement is governed by the laws of Sweden.'];
  const stage = () => {
    const w = buildWorld({ contractView: true });
    const out = n => ({ id: `RL-${String(n).padStart(3, '0')}`, name: `Agreement ${n}`, counterparty: `Company ${n} AB`,
      status: 'Under Review', signRoute: 'outside', format: 'text',
      redlineText: n === 44 ? LINES.join('\n') : `FILE ${n}\n1. Something else entirely, numbered ${n}.`,
      handover: { at: `2026-09-${String((n % 28) + 1).padStart(2, '0')}T10:00:00Z` } });
    /* This world loads no core.js, so there is no shared `state`; the view reads
       it bare, and a window property is what a bare read finds. */
    w.win.state = { contracts: Array.from({ length: 45 }, (_, i) => out(i + 1)), settings: {} };
    return w.win;
  };
  test('10a the pick-list names every file out — no silent cut at forty', () => {
    const win = stage();
    const html = win.outsideUploadOfferHtml({ best: null, outs: win.state.contracts });
    assert.equal((html.match(/<option value="RL-/g) || []).length, 45, 'every one of the 45 is a choice');
  });
  test('10b the file whose company the copy names is compared first, however far down the list it is', async () => {
    const win = stage();
    assert.ok(win.HO_MATCH_MAX < 44, 'the cap is below the file that matches, so only the order can find it');
    const copy = ['Company 44 AB', ...LINES, 'Signed for Company 44 AB'].join('\n');
    const m = await win.outsideMatchUpload(copy, 'docx');
    assert.ok(m.best, 'recognised');
    assert.equal(m.best.c.id, 'RL-044');
  });
});

describe('f388 (8) every wording key is in both books', () => {
  test('8a English and Swedish carry every ho_ key the screens ask for', () => {
    const I = require('../js/i18n.js').STRINGS;
    const used = new Set();
    for (const f of ['js/views/handover.js', 'js/views/contract.js', 'js/views/register.js', 'js/app.js', 'js/core.js', 'js/views/portal.js', 'js/mobile-contract.js'])
      for (const m of read(f).matchAll(/i18tn?\('((?:ho|po_ho|al_ho|ngl_band_out)[a-z_]*)'/g)) used.add(m[1]);
    assert.ok(used.size > 60, `found ${used.size}`);
    const miss = lang => [...used].filter(k => !(k in I[lang] || (k + '_one') in I[lang]));
    assert.deepEqual(miss('en'), [], 'English');
    assert.deepEqual(miss('sv'), [], 'Swedish');
  });
});
