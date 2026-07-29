/* ============================================================
   F71 — nothing gets sealed while a change is still on the table
   ============================================================
   The most serious kind of fault this product can have: a contract was executed
   — frozen, sealed with a tamper-evident fingerprint, distributed to both
   parties as their record of the deal — while a change was still being argued
   about.

   The gate exists. It has existed since E2 and it says the right thing:
   "don't seal over unresolved proposed edits". It reads `unresolvedRedlines()`,
   which counts `c.rounds` that are still open AND carry proposed text.

   That was the whole of the negotiation once. It is not any more. The
   negotiation room works change by change on `c.changes` — fingerprinted,
   individually accepted or refused — and when the counterparty answers through
   the room, NO ROUND IS CREATED AT ALL. So `unresolvedRedlines()` returns zero
   over a contract with four changes nobody has answered, the gate opens, and
   the signature goes on.

   The model already knows the answer. `negoAlignment()` is a pure read of the
   change set that reports exactly this, and it is what gates the room's own
   "Ready to sign" button. The signing panel simply never asked it.

   Two states have to stop a signature, and the second is the one people miss:

     · PENDING — nobody has answered it.
     · REFUSED AND NOT WITHDRAWN — it has an answer, and the answer was no. The
       round is finished; the parties are not agreed. Sealing here records
       agreement over a live disagreement.

   An accepted change is in the wording. A refused ask the asker has withdrawn
   is settled. Neither blocks anything, and a contract nobody proposed anything
   on is aligned by definition — a clean first draft is the commonest signing
   case there is.
*/
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld, supplyContract } = require('./world');
const F = require('./clausefixtures.js');

function scanFile(name = 'signed.pdf', bytes = 2048) {
  const body = Buffer.alloc(bytes, 0x41);
  return { name, size: bytes, type: 'application/pdf',
    _dataUrl: 'data:application/pdf;base64,' + body.toString('base64') };
}
function installFileReader(win) {
  win.FileReader = class { readAsDataURL(f) { this.result = f._dataUrl; if (this.onload) this.onload(); } };
}

/* Everything the signing panel checks BESIDE the change set, answered yes — so
   the only thing that can stop a signature here is the negotiation. Sealing
   itself is stood in for: what is under test is the gate in front of it, and
   the real seal is covered by f5, f8 and f28. */
function clearTheOtherGates(w) {
  w.win.approvalState = () => ({ required: false, ok: true, chain: [], next: null });
  w.win.signerPlan = () => [];
  w.win.nextSigner = () => null;
  w.win.openFindings = () => [];
  w.win.finalizeExecution = async c => {
    c.signatures = c.signatures || [];
    c.signatures.push({ party: 'first', name: 'Wanjiru Kamau', at: w.win.nowISO() });
    c.status = 'Signed';
  };
}

/* A contract sitting on the signing panel with everything else in order, so the
   only thing that can stop a signature is the change set. */
async function ready(w, build) {
  const c = supplyContract();
  c.status = 'Under Review';
  c.compliance = { ...(c.compliance || {}), consent: true };
  c.redlineText = F.protoRich(); c.format = 'rich';
  w.win.negoInit(c);
  if (build) await build(c);
  return c;
}
const fileChange = async (w, c, num, side) => {
  const cl = w.win.negoClauseList(c).find(x => x.num === num);
  return w.win.negoEditClause(c, cl.clauseId, `<p>${F.PROTO_ASKS[num].text}</p>`,
    { side, author: side === 'owner' ? 'Wanjiru Kamau' : 'Erik Lindqvist',
      summary: F.PROTO_ASKS[num].summary });
};

describe('F71 — the signing panel asks whether the parties are actually agreed', () => {
  let w;
  beforeEach(() => { w = buildWorld({ contractView: true, negotiationView: true });
    installFileReader(w.win); clearTheOtherGates(w); });

  test('a change nobody has answered blocks the seal', async () => {
    const c = await ready(w, async c => { await fileChange(w, c, '4', 'counterparty'); });
    assert.equal(w.win.negoAlignment(c).pending.length, 1, 'the model can see it');
    assert.equal(w.win.unresolvedRedlines(c), 0,
      'and the old round-based gate cannot — which is the fault');
    await w.win.signDocument(c);
    assert.equal((c.signatures || []).length, 0,
      'a contract with an unanswered change must not be sealed');
    assert.notEqual(c.status, 'Signed');
  });

  /* There are three roles — Admin, Legal and Viewer — and a Viewer cannot sign
     at all, so the old "Admin or Legal may override" branch was everybody who
     could reach the button. It is a refusal now, for every role. */
  test('and it refuses rather than asking — for every role that can sign', async () => {
    for (const role of ['admin', 'legal']) {
      const w2 = buildWorld({ contractView: true, negotiationView: true,
        user: { id: 'u_x', name: 'Amina Otieno', role, email: 'a@example.co.ke' } });
      installFileReader(w2.win); clearTheOtherGates(w2);
      let asked = false;
      w2.win.confirmDialog = async () => { asked = true; return true; };
      const c = await ready(w2, async c => { await fileChange(w2, c, '4', 'counterparty'); });
      await w2.win.signDocument(c);
      assert.equal((c.signatures || []).length, 0, `${role} must not be able to seal over an open change`);
      assert.equal(asked, false, 'and must not be offered the choice');
    }
  });

  test('a refused ask nobody has withdrawn blocks it too', async () => {
    const c = await ready(w, async c => {
      const ch = await fileChange(w, c, '4', 'counterparty');
      w.win.negoResolve(c, ch.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
    });
    assert.equal(w.win.negoAlignment(c).contested.length, 1);
    await w.win.signDocument(c);
    assert.equal((c.signatures || []).length, 0,
      'answered is not agreed — sealing here records agreement over a live disagreement');
  });

  test('and the seal goes on once the ask is withdrawn', async () => {
    const c = await ready(w, async c => {
      const ch = await fileChange(w, c, '4', 'counterparty');
      w.win.negoResolve(c, ch.id, 'rejected', { side: 'owner', by: 'Wanjiru Kamau' });
      w.win.negoWithdraw(c, ch.id, { side: 'counterparty', by: 'Erik Lindqvist' });
    });
    assert.equal(w.win.negoAlignment(c).aligned, true);
    await w.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1, 'a settled contract still signs');
  });

  test('an accepted change does not stand in the way', async () => {
    const c = await ready(w, async c => {
      const ch = await fileChange(w, c, '4', 'counterparty');
      w.win.negoResolve(c, ch.id, 'accepted', { side: 'owner', by: 'Wanjiru Kamau' });
    });
    await w.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1, 'it is in the wording — there is nothing left to argue');
  });

  test('a contract nobody proposed anything on signs exactly as before', async () => {
    const c = await ready(w);
    await w.win.signDocument(c);
    assert.equal((c.signatures || []).length, 1,
      'a clean first draft is the commonest signing case there is');
  });

  test('filing a paper signature is held to the same rule', async () => {
    const c = await ready(w, async c => { await fileChange(w, c, '4', 'counterparty'); });
    const out = await w.win.attachPaperSignature(c, scanFile(), { signedOn: '2026-07-24' });
    assert.equal(out, null,
      'a scan of a signature page is the same claim as an electronic one, and '
      + 'must clear the same gate');
    assert.notEqual(c.status, 'Signed');
  });
});
