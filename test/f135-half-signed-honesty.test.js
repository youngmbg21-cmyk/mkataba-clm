/* ============================================================
   f135 — a half-signed contract says so, and the copy follows the LAST signature
   ============================================================
   Field report (Young, 02 Aug 2026), two defects with one root cause: sealing
   is a fact about the DOCUMENT, execution a fact about the PARTIES, and the
   surfaces read one for the other.

   BUG — the executed copy never went out in the commonest flow. The owner
   signs first (single-signer path): the contract seals immediately, status
   'Signed'. The counterparty then signs through the share link, landing in
   applyResponse on an already-sealed record. finalizeExecution — the ONLY
   caller of distributeExecuted — refuses to run twice, so the copy the design
   promises "when the last signature lands" never followed. applyResponse now
   catches exactly that moment and distributes.

   GAP — one signature read as "Executed". c.status becomes 'Signed' at
   sealing, and every chip on every surface translated that to Executed even
   with the counterparty's signature outstanding. The chip now derives
   "Partially signed" (same never-stored pattern as Expired) whenever a
   sealed contract has signature evidence from only one side. Legacy records
   marked Signed with NO signature rows at all keep reading Executed — they
   make no claim about who signed, and must not be accused of being half-done. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

/* core.js with the contract.js/approvals.js halves stood in, so the test sees
   exactly what applyResponse asked for — same harness shape as f117. */
function loadCore(overrides = {}) {
  const distributed = [];
  const w = loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    refreshStats() {}, renderAuditSection() {},
    API_MODE: () => false,
    ...overrides,
  });
  w.signerPlan = c => c.signerPlan || [];
  w.nextSigner = c => (c.signerPlan || []).slice().sort((a, b) => a.order - b.order).find(s => !s.signed) || null;
  w.allSigned = c => (c.signerPlan || []).length > 0 && c.signerPlan.every(s => s.signed);
  // The REAL parties test (mirrors approvals.js executionParties), because the
  // late-distribution trigger and the chip both hang off it.
  w.executionParties = c => {
    const sigs = Array.isArray(c && c.signatures) ? c.signatures : [];
    const isTheirs = s => !!s && (s.party === 'counterparty' || s.party === 'external');
    const theirs = sigs.filter(isTheirs), ours = sigs.filter(s => s && !isTheirs(s));
    const offPlatform = !!(c && (c.hash === 'MIGRATED' || (c.execution && c.execution.offPlatform)));
    const expects = !!String((c && c.counterparty) || '').trim();
    return { ours: ours.length, theirs: theirs.length, ourName: 'us', theirName: 'them',
      fully: offPlatform || (ours.length > 0 && (theirs.length > 0 || !expects)) };
  };
  w.bothPartiesSigned = c => w.executionParties(c).fully;
  w.finalizeExecution = async () => {};
  w.distributeExecuted = async c => {
    distributed.push(c.id);
    c.distribution = { at: 'now', triggeredBy: 'auto', fully: w.bothPartiesSigned(c), recipients: [] };
  };
  w.REMOTE = null;
  return { w, distributed };
}

/* An already-sealed single-signer contract: the owner signed, the seal froze
   the text, the counterparty has not signed yet. This is the exact state the
   missed-copy bug lives in. */
const sealedAwaitingThem = () => ({ id: 'MK-9', name: 'Warehousing Agreement', counterparty: 'Nordfrakt',
  template: 'RM', status: 'Signed', hash: 'abc123sealhash', folder: 'proc', fields: {},
  redlineText: 'Article 1\n\nAgreed wording.', format: 'text',
  comments: [], audit: [], rounds: [], versions: [],
  signatures: [{ party: 'first', name: 'Amina Otieno', email: 'amina@x.co', at: 't1' }],
  compliance: { consent: true }, _loaded: true });

const signResponse = over => ({ v: 1, kind: 'hati-response', id: 'MK-9',
  action: 'sign', name: 'Erik Lindqvist', title: '', email: 'erik@nordfrakt.se',
  at: '2026-08-02T10:00:00.000Z', signatureForm: 'typed', signatureTypedName: 'Erik Lindqvist', ...over });

describe('THE BUG — the copy follows the last signature, even when the seal came first', () => {
  test('counterparty signs an already-sealed contract → the executed copy goes out', async () => {
    const { w, distributed } = loadCore();
    const c = sealedAwaitingThem();
    const ok = await w.applyResponse(c, signResponse());
    assert.equal(ok, true, 'the signature is accepted');
    assert.equal(c.signatures.length, 2, 'both marks are on the record');
    assert.deepEqual(distributed, ['MK-9'],
      'THE FIX: distribution fires from applyResponse — finalizeExecution cannot, the seal already exists');
    assert.equal(c.distribution.fully, true, 'and what went out was the full executed copy');
  });

  test('an earlier part-signed progress notice does not stand in for the copy', async () => {
    const { w, distributed } = loadCore();
    const c = sealedAwaitingThem();
    // The owner force-sent a progress notice while waiting (fully:false).
    c.distribution = { at: 'earlier', triggeredBy: 'auto', fully: false, recipients: [] };
    await w.applyResponse(c, signResponse());
    assert.deepEqual(distributed, ['MK-9'], 'the notice is not the copy — the real one still goes');
    assert.equal(c.distribution.fully, true, 'and the record now shows the copy went');
  });

  test('but a copy already sent is not sent twice', async () => {
    const { w, distributed } = loadCore();
    const c = sealedAwaitingThem();
    c.signatures.push({ party: 'counterparty', name: 'Erik', at: 't2' });   // already fully signed
    c.distribution = { at: 'earlier', triggeredBy: 'auto', fully: true, recipients: [] };
    // A second counterparty-side mark arrives (e.g. their FD countersigning too).
    await w.applyResponse(c, signResponse({ name: 'Their FD', email: 'fd@nordfrakt.se' }));
    assert.deepEqual(distributed, [], 'fully:true means the copy went — no duplicate email storm');
  });

  test('one signature only → still held: no copy goes out half-signed', async () => {
    const { w, distributed } = loadCore();
    const c = sealedAwaitingThem();
    c.counterparty = 'Nordfrakt';
    c.signatures = [];                       // nobody has signed yet
    // A counterparty signs FIRST on an unsealed contract in review — no seal,
    // no distribution; the owner's signature is still to come.
    c.status = 'Under Review'; c.hash = null;
    await w.applyResponse(c, signResponse());
    assert.deepEqual(distributed, [], 'their lone signature does not trigger the copy');
  });
});

describe('THE GAP — the chip tells the truth about who has signed', () => {
  const chipOf = (w, c) => w.contractStatusChip(c);

  test('sealed with only our signature → "Partially signed", not "Executed"', () => {
    const { w } = loadCore();
    const c = sealedAwaitingThem();
    assert.equal(w.contractPartiallySigned(c), true);
    assert.equal(w.contractStage(c), 'Partially signed');
    assert.match(chipOf(w, c), /Partially signed/);
    assert.match(chipOf(w, c), /awaiting the counterparty/, 'the chip explains itself on hover');
  });

  test('both parties signed → "Executed", exactly as before', () => {
    const { w } = loadCore();
    const c = sealedAwaitingThem();
    c.signatures.push({ party: 'counterparty', name: 'Erik', at: 't2' });
    assert.equal(w.contractPartiallySigned(c), false);
    assert.match(chipOf(w, c), /Executed/);
  });

  test('no counterparty named → one signature IS complete → "Executed"', () => {
    const { w } = loadCore();
    const c = sealedAwaitingThem();
    c.counterparty = '';
    assert.equal(w.contractPartiallySigned(c), false, 'a one-party document has one side to hear from');
    assert.match(chipOf(w, c), /Executed/);
  });

  test('legacy Signed record with NO signature rows → left as "Executed", no false alarm', () => {
    const { w } = loadCore();
    const c = sealedAwaitingThem();
    c.signatures = [];                       // pre-seeded / imported history
    assert.equal(w.contractPartiallySigned(c), false,
      'a record that makes no claim about who signed must not be accused of being half-done');
    assert.match(chipOf(w, c), /Executed/);
  });

  test('executed outside HaTi (migrated paper) → "Executed" — the paper carries both marks', () => {
    const { w } = loadCore();
    const c = sealedAwaitingThem();
    c.hash = 'MIGRATED';
    assert.equal(w.contractPartiallySigned(c), false);
  });

  test('half-signed AND past its end date → "Partially signed" outranks "Expired"', () => {
    const { w } = loadCore();
    const c = sealedAwaitingThem();
    c.expiry = '2020-01-01';
    assert.equal(w.contractStage(c), 'Partially signed',
      'a contract missing a signature was never fully in force — "Expired" would read as "it was"');
  });

  test('drafts and reviews are untouched by the new stage', () => {
    const { w } = loadCore();
    for (const status of ['Draft', 'Under Review', 'Declined']) {
      const c = { ...sealedAwaitingThem(), status, hash: null };
      assert.equal(w.contractPartiallySigned(c), false);
      assert.equal(w.contractStage(c), status);
    }
  });
});
