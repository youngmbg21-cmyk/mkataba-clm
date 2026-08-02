/* ============================================================
   f140 — a contract signed right through its route IS executed
   ============================================================
   Field report (Young, 02 Aug 2026): MK-280 sat with "Executed & sealed. This
   document is locked" across the top of the document and a "Partially signed"
   chip beside its title. Two signatures were on its face, both taken in-app,
   both showing as SIGNER rather than First party / Counterparty.

   TWO AUTHORITIES, READING DIFFERENT RECORDS.

     allSigned()        — every row on the SIGNING ROUTE has signed. This is
                          what runs finalizeExecution: it froze the wording,
                          fingerprinted it, sealed it and locked the fields.
     executionParties() — classified the SIGNATURES by their `party` field and
                          inferred that a counterparty still owed one, from
                          nothing more than c.counterparty holding a name.

   A route whose rows are all internal — the owner and a colleague, two
   directors, a signatory and a witness — satisfies the first and fails the
   second. Signatures taken in-app are recorded party:'internal-planned', and
   the in-app path REFUSES to sign a counterparty row at all ("share the link to
   collect their signature"), so an all-internal route can never produce the
   counterparty signature the second test was waiting for.

   AND IT WAS TERMINAL, not cosmetic. distributeExecuted() holds the copy until
   bothPartiesSigned(), so nobody — neither party — ever received the executed
   contract. No later signature could arrive to release it, because the route
   was complete and the document was locked. The contract could not leave that
   state by any route the product offers.

   THE RULE. The signing route is the owner's explicit statement of who must
   sign; the editor's own words are "signers execute in order" and "counterparty
   signers each get their own secure link", so a counterparty who has to sign
   belongs ON it. Where there is a route it answers "is this executed", exactly
   as it already answers "may this seal". Where there is NO route nothing moves:
   that is the single-signer path f135 protects, where the owner signs, the
   contract seals, and the counterparty's mark lands afterwards by share link.

   Both sides of the wire compute this — executionParties() in js/approvals.js
   and signedParties() in server/server.js — so both are pinned here. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FIXTURES } = require('./helpers');

/* The real approvals.js, so this reads the product's own rule rather than a
   copy of it kept in a test. */
function world(over = {}) {
  const w = loadViews(['js/core.js', 'js/approvals.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, API_MODE: () => false,
    docBody: () => '<p>doc</p>', captureVersion: () => null,
    renderSignButton() {}, renderAuditSection() {}, renderWorkspace() {}, ...over });
  w.REMOTE = null;
  return w;
}

const routeRow = (over = {}) => ({ id: 'sg_' + (over.order || 1), party: 'internal',
  name: 'A Signer', email: 'a@highland.co.ke', order: 1, signed: false, at: null, ...over });
/* A signature as the in-app route path records it (js/views/contract.js) —
   party:'internal-planned', which is neither 'first' nor 'counterparty'. */
const inAppSig = (over = {}) => ({ party: 'internal-planned', name: 'A Signer',
  email: 'a@highland.co.ke', at: 't', form: 'type', ...over });

/* MK-280 as reported: two internal route rows, both signed in-app, sealed, with
   a counterparty named on the record. */
const mk280 = (over = {}) => ({
  id: 'MK-280', name: 'Mutual Non-Disclosure Agreement', counterparty: 'Sofi',
  status: 'Signed', hash: '453dd87505eafc17c3f2c1614af3aa774fb2a79e6703b247984097d01397fee7',
  folder: 'corp', fields: {}, audit: [], comments: [], rounds: [], versions: [],
  signerPlan: [
    routeRow({ order: 1, name: 'Young Mbagaya', email: 'youngmbg21@gmail.com', signed: true, at: 't1' }),
    routeRow({ order: 2, name: 'Young Mbagaya', email: 'young.mbagaya@saint-gobain.com', signed: true, at: 't2' }),
  ],
  signatures: [
    inAppSig({ name: 'Young Mbagaya', email: 'youngmbg21@gmail.com', at: 't1' }),
    inAppSig({ name: 'Young Mbagaya', email: 'young.mbagaya@saint-gobain.com', at: 't2' }),
  ], ...over });

describe('f140 — the reported contract, end to end', () => {
  test('the route completed, so the contract reads Executed — not Partially signed', () => {
    const w = world(), c = mk280();
    assert.equal(w.allSigned(c), true, 'this is what sealed and locked it');
    assert.equal(w.executionParties(c).fully, true,
      'and this must agree — two authorities disagreeing is the whole defect');
    assert.equal(w.contractPartiallySigned(c), false);
    assert.equal(w.contractStage(c), 'Signed');
    assert.match(w.contractStatusChip(c), /Executed/);
  });

  test('and the executed copy is no longer withheld from everybody', () => {
    const w = world();
    assert.equal(w.bothPartiesSigned(mk280()), true,
      'distributeExecuted holds the copy on this test — false here means nobody ever gets the contract');
  });

  test('the seal and the chip cannot contradict each other on a routed contract', () => {
    /* The contradiction in the screenshot: "Executed & sealed, locked" beside
       "Partially signed". Sealing is driven by allSigned; while a route exists
       the two must move together, whatever the rows are. */
    const w = world();
    for (const parties of [['internal', 'internal'], ['internal', 'counterparty'], ['counterparty', 'counterparty']]) {
      const c = mk280({ signerPlan: parties.map((p, i) =>
        routeRow({ order: i + 1, party: p, signed: true, at: 't' })) });
      assert.equal(w.executionParties(c).fully, w.allSigned(c),
        `a route of ${parties.join(' + ')} must seal and read executed on the same test`);
    }
  });
});

describe('f140 — a route that is NOT finished is still honestly partial', () => {
  test('an outstanding counterparty row keeps the contract partially signed', () => {
    const w = world();
    const c = mk280({
      signerPlan: [routeRow({ order: 1, signed: true, at: 't1' }),
        routeRow({ order: 2, party: 'counterparty', name: 'Erik', email: 'erik@sofi.se', signed: false })],
      signatures: [inAppSig()] });
    assert.equal(w.executionParties(c).fully, false, 'their signature is genuinely outstanding');
    assert.equal(w.contractPartiallySigned(c), true);
    assert.match(w.contractStatusChip(c), /Partially signed/);
  });

  test('an outstanding INTERNAL row is outstanding too', () => {
    const w = world();
    const c = mk280({
      signerPlan: [routeRow({ order: 1, signed: true, at: 't1' }), routeRow({ order: 2, signed: false })],
      signatures: [inAppSig()] });
    assert.equal(w.executionParties(c).fully, false);
  });
});

describe('f140 — with no route, f135 rules unchanged', () => {
  /* The single-signer path: no signerPlan at all. The owner signs, the contract
     seals, and the counterparty's mark lands later through their share link.
     Nothing about that flow may move — it is the commonest one there is. */
  const sealedAwaitingThem = (over = {}) => mk280({ signerPlan: undefined,
    signatures: [{ party: 'first', name: 'Amina Otieno', email: 'amina@highland.co.ke', at: 't1' }], ...over });

  test('sealed with only our signature → still Partially signed', () => {
    const w = world();
    assert.equal(w.executionParties(sealedAwaitingThem()).fully, false);
    assert.equal(w.contractPartiallySigned(sealedAwaitingThem()), true);
  });

  test('both sides signed → Executed', () => {
    const w = world();
    const c = sealedAwaitingThem();
    c.signatures.push({ party: 'counterparty', name: 'Erik', at: 't2' });
    assert.equal(w.executionParties(c).fully, true);
  });

  test('no counterparty named → one signature is the whole story', () => {
    const w = world();
    assert.equal(w.executionParties(sealedAwaitingThem({ counterparty: '' })).fully, true);
  });

  test('a legacy Signed record with no signatures is not accused of being half-done', () => {
    const w = world();
    assert.equal(w.contractPartiallySigned(sealedAwaitingThem({ signatures: [] })), false);
  });

  test('an empty route is no route — the inference still applies', () => {
    const w = world();
    assert.equal(w.executionParties(sealedAwaitingThem({ signerPlan: [] })).fully, false,
      'an empty plan must not read as "every row signed"');
  });
});

/* ---------- the same rule, on the server that actually sends the copy ---------- */
describe('f140 — the server agrees, and the parties get their contract', () => {
  const SEAL = 'e'.repeat(64);
  const routed = () => ({
    ...fixtureContract('MK-280', 'Mutual Non-Disclosure Agreement', 'Sofi', FOLDER_A, 1000000, 'Signed'),
    hash: SEAL, signedAt: '02 Aug 2026, 16:08 EAT',
    signerPlan: [
      { id: 'sg_1', party: 'internal', name: 'Young Mbagaya', email: 'youngmbg21@gmail.com', order: 1, signed: true, at: 't1' },
      { id: 'sg_2', party: 'internal', name: 'Young Mbagaya', email: 'young.mbagaya@saint-gobain.com', order: 2, signed: true, at: 't2' },
    ],
    signatures: [
      { party: 'internal-planned', name: 'Young Mbagaya', email: 'youngmbg21@gmail.com', at: '2026-08-02T15:51:00Z', form: 'typed' },
      { party: 'internal-planned', name: 'Young Mbagaya', email: 'young.mbagaya@saint-gobain.com', at: '2026-08-02T16:08:00Z', form: 'typed' },
    ],
    execution: { at: '2026-08-02T16:08:01Z', textHash: 'f'.repeat(64),
      html: '<h2>MUTUAL NON-DISCLOSURE AGREEMENT</h2><p>The Parties wish to explore a business relationship.</p>' },
  });
  const RECIPIENTS = [
    { name: 'Young Mbagaya', email: 'youngmbg21@gmail.com', role: '', party: 'internal' },
    { name: 'Young Mbagaya', email: 'young.mbagaya@saint-gobain.com', role: '', party: 'internal' },
  ];

  let h, W;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: FIXTURES.concat([routed()]) });
  });
  after(async () => { await h.stop(); });

  test('a completed route distributes the EXECUTED copy, not a progress notice', async () => {
    const r = await W.admin.json('/api/contracts/MK-280/distribute',
      { method: 'POST', body: { recipients: RECIPIENTS, appUrl: 'https://hati.example/' } });
    assert.equal(r.fullyExecuted, true,
      'the server withheld the copy from both parties for ever — no signature could ever arrive to release it');
    assert.equal(r.attached, true, 'and the contract itself travels with it');
  });
});
