/* ============================================================
   F16 — the Word round trip belongs to every contract
   ============================================================
   The round trip shipped gated on `isWordDoc`: the contract had to have
   ARRIVED as a .docx. That is the wrong side of the deal. The counterparty who
   insists on Word is usually answering paper we drafted, and for that contract
   — the one an SME actually writes — the feature was switched off entirely.

   These tests pin the gate in its new position and, just as importantly, pin
   the behaviour of the case that already worked: a received .docx must keep
   numbering its versions on top of its original exactly as before, or every
   record created before tonight reads differently tomorrow. */
const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const F = require('./docxfix');

function installFileReader(win) {
  win.FileReader = class { readAsDataURL(f) { this.result = f._dataUrl; if (this.onload) this.onload(); } };
}

const uploadedContract = () => ({
  id: 'MK-UP-1', name: 'Their Paper', counterparty: 'Nampak Kenya', folder: 'proc',
  status: 'Under Review', source: 'upload', value: 1800000, valueType: 'estimated',
  lastAction: '26 Jul 2026', comments: [], audit: [], rounds: [], versions: [], signatures: [],
  upload: { fileName: 'their-paper.docx', docKind: 'docx', mime: F.DOCX_MIME, size: 4096,
    fileHash: 'abc', dataUrl: F.dataUrl(F.mkDocx(F.para('ORIGINAL WORDING here'))),
    extractedText: 'ORIGINAL WORDING here' },
});

describe('F16 — who may use the Word round trip', () => {
  let w;
  before(() => { w = buildWorld(); installFileReader(w.win); });

  test('a contract drafted in HaTi is Word-capable', () => {
    assert.equal(w.win.wordCapable(supplyContract()), true);
  });

  test('a received .docx is still Word-capable (unchanged)', () => {
    assert.equal(w.win.wordCapable(uploadedContract()), true);
    assert.equal(w.win.isWordDoc(uploadedContract()), true);
  });

  test('the controls render on a drafted contract — the button now exists (checklist 2)', () => {
    const html = w.win.wordControlsHtml(supplyContract());
    assert.ok(html, 'a drafted contract must offer the Word round trip');
    assert.match(html, /Upload returned \.docx/);
    assert.match(html, /data-word-return/);
  });

  test('an executed contract offers no new versions, drafted or received', () => {
    const signed = supplyContract({ status: 'Signed', hash: 'a'.repeat(64) });
    assert.equal(w.win.wordDoorClosed(signed), true);
    const html = w.win.wordControlsHtml(signed);
    assert.match(html, /permanently disabled/);
    assert.ok(!/data-word-return/.test(html), 'a sealed agreement takes no returned file');
  });

  test('a viewer sees the ledger but no controls', () => {
    const v = buildWorld({ canEdit: false });
    const html = v.win.wordControlsHtml(supplyContract());
    assert.ok(!/data-word-return/.test(html));
    assert.ok(!/data-word-out/.test(html));
  });
});

describe('F16 — the version ledger, both shapes of contract', () => {
  let w;
  before(() => { w = buildWorld(); installFileReader(w.win); });

  test('a drafted contract has no phantom "original" file entry', () => {
    const c = supplyContract();
    // length, not deepEqual: the array is built inside the jsdom realm, so its
    // prototype is not Node's Array.prototype and a strict deepEqual would
    // compare realms rather than contents
    assert.equal(w.win.wordFileEntries(c).length, 0,
      'there is no received original to offer — the document itself is the source');
  });

  test('a received document still lists its original as v1 (regression)', () => {
    const entries = w.win.wordFileEntries(uploadedContract());
    assert.equal(entries.length, 1);
    assert.equal(entries[0].key, 'v1');
    assert.match(entries[0].label, /Original/);
  });

  test('returns on a RECEIVED document still number from v2 (regression)', async () => {
    const c = uploadedContract();
    const bytes = F.erikRedline('ORIGINAL WORDING here', [{ find: 'ORIGINAL', replace: 'REVISED' }]);
    await w.win.uploadWordVersion(c, F.fileOf(bytes, 'their-paper-v2.docx'));
    w.win.acceptProposedRound(c, c.rounds[0].n);

    assert.equal(c.upload.versions.length, 1, 'the ledger must still live on the upload');
    assert.equal(c.upload.versions[0].n, 2, 'a received document numbers returns from v2');
    assert.equal(c.upload.extractedText.includes('REVISED'), true,
      "the received document's reading view must follow the adopted wording");
    assert.ok(!c.wordVersions, 'a received document must not sprout a second ledger');
  });

  test('returns on a DRAFTED contract number from v1 in their own ledger', async () => {
    const c = supplyContract();
    const sent = w.win.docPlainText(c);
    const bytes = F.erikRedline(sent, [{ find: 'thirty (30) days', replace: 'sixty (60) days' }]);
    await w.win.uploadWordVersion(c, F.fileOf(bytes, 'markup.docx'));
    w.win.acceptProposedRound(c, c.rounds[0].n);

    assert.ok(Array.isArray(c.wordVersions), 'a drafted contract keeps its own file ledger');
    assert.equal(c.wordVersions.length, 1);
    assert.equal(c.wordVersions[0].n, 1, 'with no received original, the first return is v1');
    assert.equal(c.wordVersions[0].roundN, 1);
    assert.equal(c.upload, undefined, 'a drafted contract must not grow a fake upload block');
    assert.match(w.win.docPlainText(c), /sixty \(60\) days/);
  });

  test('the returned file is registered for server-side authorisation and sweeping', async () => {
    const c = supplyContract();
    const bytes = F.erikRedline(w.win.docPlainText(c), [{ find: 'Kenya', replace: 'Kenya (Nairobi)' }]);
    await w.win.uploadWordVersion(c, F.fileOf(bytes, 'markup2.docx'));
    assert.ok(Array.isArray(c.documents) && c.documents.length,
      'a stored version file must be listed in c.documents or it is unreachable on reload');
    assert.equal(c.documents[0].kind, 'word-version');
  });
});

describe('F16 — what goes out is the current wording, never a stale file', () => {
  let w;
  before(() => { w = buildWorld(); installFileReader(w.win); });

  test('a file whose wording still matches the document is not stale', () => {
    const c = uploadedContract();
    c.redlineText = null;
    const cur = w.win.wordCurrentFile(c);
    assert.equal(w.win.wordFileStale(c, cur), false);
  });

  test('a file becomes stale the moment the document is edited past it', () => {
    const c = uploadedContract();
    c.redlineText = 'ORIGINAL WORDING here, as amended in HaTi';
    c.format = 'text';
    const cur = w.win.wordCurrentFile(c);
    assert.equal(w.win.wordFileStale(c, cur), true,
      'handing over a superseded file would have counsel mark up wording that no longer exists');
  });

  test('a contract with no file at all is always "stale" — there is nothing to hand over', () => {
    assert.equal(w.win.wordFileStale(supplyContract(), null), true);
  });
});

describe('F16 — a returned file that changes nothing is not a round', () => {
  let w;
  before(() => { w = buildWorld(); installFileReader(w.win); });

  test('an unchanged return closes the review instead of opening a round', async () => {
    const c = supplyContract();
    c.wordReview = { out: true, since: w.win.nowISO(), by: 'Wanjiru Kamau' };
    const same = F.mkDocx(w.win.docPlainText(c).split('\n').filter(Boolean).map(F.para).join(''));
    await w.win.uploadWordVersion(c, F.fileOf(same, 'unchanged.docx'));

    assert.equal((c.rounds || []).length, 0, 'nothing changed, so there is nothing to negotiate');
    assert.equal(c.wordReview, null, 'the document is back — the soft lock lifts');
    assert.match(w.toastText(), /no wording changes/i);
  });
});
