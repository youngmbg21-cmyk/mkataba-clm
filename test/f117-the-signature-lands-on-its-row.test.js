/* ============================================================
   f117 — an incoming signature lands on its bound row, or on none
   ============================================================
   W7 fault 3, the recording half — a LIVE data-integrity bug until this
   stage. applyResponse stamped an incoming counterparty signature on
   whichever row nextSigner() said was next:

     const ns = nextSigner(c);
     if (ns && ns.party === 'counterparty'){ ns.signed = true; ns.by = r.name; … }

   With links out to their MD (order 3) and their FD (order 4), the FD signing
   first landed the FD's signature ON THE MD'S ROW. The real name was written
   to `by`, so the trail was not false — but the official running order was
   wrong from then on, and nothing anywhere said so.

   The server now refuses out-of-order at the respond route (f115) and stamps
   the share's binding onto the stored response (r.signerId). This file proves
   the owner-side half: the signature is recorded against THAT row, a replay
   or an out-of-order response is refused before anything is written (this
   function is also the import door for static-mode response codes, which
   never touch the respond route), a response whose bound row was edited away
   is kept as a signature with the gap named rather than guessed onto someone
   else's step, and the seal still fires when the bound last signature lands. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

function loadCore(overrides = {}) {
  const sealed = [];
  const w = loadViews(['js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    refreshStats() {}, renderAuditSection() {},
    API_MODE: () => false,
    ...overrides,
  });
  // The route helpers live in js/approvals.js; the seal lives in contract.js.
  // Stood in here so the test can see exactly what applyResponse asked for.
  w.signerPlan = c => c.signerPlan || [];
  w.nextSigner = c => (c.signerPlan || []).slice().sort((a, b) => a.order - b.order).find(s => !s.signed) || null;
  w.allSigned = c => (c.signerPlan || []).length > 0 && c.signerPlan.every(s => s.signed);
  w.bothPartiesSigned = () => false;
  w.finalizeExecution = async c => { sealed.push(c.id); };
  w.REMOTE = null;
  return { w, sealed };
}

const plan = () => [
  { id: 'S1', order: 1, party: 'internal', name: 'Amina (CEO)', signed: true, at: 't1', by: 'Amina' },
  { id: 'S2', order: 2, party: 'internal', name: 'Grace (CFO)', signed: true, at: 't2', by: 'Grace' },
  { id: 'S3', order: 3, party: 'counterparty', name: 'Their MD', email: 'md@n.se', signed: false },
  { id: 'S4', order: 4, party: 'counterparty', name: 'Their FD', email: 'fd@n.se', signed: false },
];

const contract = () => ({ id: 'MK-1', name: 'Warehousing Agreement', counterparty: 'Nordfrakt',
  template: 'RM', status: 'Under Review', folder: 'proc', fields: {},
  redlineText: 'Article 1\n\nAgreed wording.', format: 'text',
  comments: [], audit: [], rounds: [], versions: [], signatures: [],
  compliance: { consent: true }, _loaded: true, signerPlan: plan() });

const signResponse = (signerId, name, over = {}) => ({ v: 1, kind: 'hati-response', id: 'MK-1',
  action: 'sign', name, title: '', email: name.toLowerCase().replace(/\s+/g, '.') + '@n.se',
  at: '2026-07-31T10:00:00.000Z', signatureForm: 'typed', signatureTypedName: name,
  ...(signerId ? { signerId } : {}), ...over });

describe('f117 — the bound row is the row', () => {
  test('THE BUG: the FD signing first no longer lands on the MD\'s row — refused, nothing written', async () => {
    const { w } = loadCore();
    const c = contract();
    const ok = await w.applyResponse(c, signResponse('S4', 'Their FD'));
    assert.equal(ok, false, 'out of order is refused, not refiled');
    assert.equal(c.signatures.length, 0, 'no signature was pushed on a refusal');
    const md = c.signerPlan.find(s => s.id === 'S3'), fd = c.signerPlan.find(s => s.id === 'S4');
    assert.equal(md.signed, false, 'the MD\'s row — where the old code would have filed this — is untouched');
    assert.equal(fd.signed, false, 'and the FD\'s own row waits for its turn');
  });

  test('in order, each signature lands on its OWN row, named in the audit', async () => {
    const { w } = loadCore();
    const c = contract();
    assert.equal(await w.applyResponse(c, signResponse('S3', 'Their MD')), true);
    const md = c.signerPlan.find(s => s.id === 'S3');
    assert.equal(md.signed, true);
    assert.equal(md.by, 'Their MD');
    assert.equal(c.signatures.length, 1);
    assert.match(c.audit.map(a => a.detail).join(' '), /step 3 of the signing route, on their own bound link/);
    assert.equal(c.signerPlan.find(s => s.id === 'S4').signed, false);
  });

  test('the seal fires when the LAST bound signature lands', async () => {
    const { w, sealed } = loadCore();
    const c = contract();
    await w.applyResponse(c, signResponse('S3', 'Their MD'));
    assert.deepEqual(sealed, [], 'not before the route is complete');
    await w.applyResponse(c, signResponse('S4', 'Their FD'));
    assert.deepEqual(sealed, ['MK-1'], 'the route completing is what seals');
    assert.equal(c.signerPlan.find(s => s.id === 'S4').by, 'Their FD');
  });

  test('a replayed response is refused — a step signs once', async () => {
    const { w } = loadCore();
    const c = contract();
    await w.applyResponse(c, signResponse('S3', 'Their MD'));
    const ok = await w.applyResponse(c, signResponse('S3', 'Somebody Holding The Code'));
    assert.equal(ok, false);
    assert.equal(c.signatures.length, 1, 'no second signature');
    assert.equal(c.signerPlan.find(s => s.id === 'S3').by, 'Their MD', 'and the row keeps its real signer');
  });

  test('a bound row edited away: the signature is KEPT, the gap is NAMED, no row is guessed', async () => {
    const { w } = loadCore();
    const c = contract();
    c.signerPlan = c.signerPlan.filter(s => s.id !== 'S3');   // the owner deleted the MD's step
    const ok = await w.applyResponse(c, signResponse('S3', 'Their MD'));
    assert.equal(ok, true, 'a real signature is evidence — it is not thrown away');
    assert.equal(c.signatures.length, 1);
    assert.equal(c.signerPlan.find(s => s.id === 'S4').signed, false,
      'the FD\'s row must NOT inherit a signature bound to a deleted step');
    assert.match(c.audit.map(a => a.detail).join(' '), /no step was marked signed/,
      'the trail states exactly what is and is not claimed');
  });

  test('an unbound response — a pre-W7 link, a static-mode code — still takes the next row', async () => {
    const { w } = loadCore();
    const c = contract();
    const ok = await w.applyResponse(c, signResponse(null, 'Their MD'));
    assert.equal(ok, true);
    assert.equal(c.signerPlan.find(s => s.id === 'S3').signed, true,
      'next-in-order is all an unbound response carries, and it keeps working');
  });
});
