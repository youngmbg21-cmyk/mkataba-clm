/* ============================================================
   C4a — TWO SIGNERS, ONE RECORD (the same-moment double press)
   ============================================================
   Two admins hold the same contract open at the same version. Both are allowed
   to sign it; both press Sign. This is not a permissions question — it is what
   the product does with the SECOND one.

   WHAT IS REAL HERE: the server (a real HaTi on a real port), the two accounts,
   the optimistic-lock refusal, the executed-record guard, and — the part that
   decides the outcome — js/core.js's OWN save path, sliced out of the source at
   run time by savepath.js, dialog branch and all.

   WHAT IS STAGED: the two signature payloads. signDocument/finalizeExecution
   run in a browser with a signature pad and js/core.js's sealString beside
   them; what they WRITE is a contract record, and the record is what collides.
   The keys written here are asserted against js/views/contract.js's own source
   below, so a payload that stopped resembling the product fails loudly rather
   than quietly testing a fiction.

   Two halves:
     HALF 1 — the loser is looking at the contract  → the H-4 dialog fires.
              What does "Keep mine & save" mean over a signature?
     HALF 2 — the loser's save is a background flush → no dialog, one toast.
              Is that toast true?

   Run:  node test/audit/collisions/c4a-two-signers-one-record.js
*/
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('../../helpers');
const { makeSaver, harness, ROOT } = require('./savepath');

const ID = 'MK-A2';

/* The record finalizeExecution leaves behind, in the same shape and with the
   same keys. Asserted against the real source before it is used. */
function signedPayload(base, who, at) {
  const c = JSON.parse(JSON.stringify(base));
  delete c._v; delete c._light; delete c._loaded;
  c.execution = { at, method: 'session-authenticated', consent: true,
    ua: 'probe', ip: null, firstParty: 'Highland Corporate Ltd' };
  c.signedAt = at;
  c.signatures = (c.signatures || []).concat([{
    party: 'first', name: who.name, email: who.email, title: 'Director', at,
    method: 'session-authenticated', ip: null, ua: 'probe', form: 'session' }]);
  c.sealVersion = 2;
  c.hash = require('node:crypto').createHash('sha256').update(who.name + at).digest('hex');
  c.status = 'Signed';
  c.audit = (c.audit || []).concat([{ at, user: who.name, action: 'Signed',
    detail: `Executed & sealed — 1 signature(s) · text hash ${'x'.repeat(16)}…` }]);
  return c;
}

(async () => {
  const t = harness('C4a two signers, one record');
  const h = await startHati();
  try {
    /* ---- the payload shape is the product's, not this file's ---- */
    const cv = fs.readFileSync(path.join(ROOT, 'js', 'views', 'contract.js'), 'utf8');
    for (const marker of ["method:'session-authenticated'", 'c.sealVersion=2', "c.status='Signed'",
      "c.hash=await sha256(sealString(c))", "party:'first'"]) {
      t.ok(cv.includes(marker), `finalizeExecution really writes ${marker}`, marker);
    }

    await seedWorkspace(h);
    const A = h.client('A-amina');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    /* A SECOND ADMIN. Both may sign; neither is capped (the workspace switch is
       off by default) and neither is on a signing route — the single-signer
       path, which is what a contract with no named signers gets. */
    await A.json('/api/users', { method: 'POST', body: {
      name: 'Daniel Mwangi', email: 'daniel@example.co.ke', role: 'admin', password: 'temporary-pass-1' } });
    const D = h.client('D-daniel');
    await D.json('/api/login', { method: 'POST', body: { email: 'daniel@example.co.ke', password: 'temporary-pass-1' } });
    await D.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'daniels-own-pass-9' } });

    /* ================= ARM ================= */
    const a0 = await A.json('/api/contracts/' + ID);
    const d0 = await D.json('/api/contracts/' + ID);
    t.ok(a0._v === d0._v, `ARMED: both admins hold ${ID} at the same version ${a0._v}`, { a: a0._v, d: d0._v });
    t.ok((a0.signatures || []).length === 0 && a0.status !== 'Signed',
      `ARMED: ${ID} is unsigned to start with (status ${a0.status}, ${(a0.signatures || []).length} signatures)`,
      { status: a0.status, sigs: (a0.signatures || []).length });
    t.ok(!Array.isArray(a0.signerPlan) || !a0.signerPlan.length,
      'ARMED: no signing route, so both admins are on the single-signer path (either may seal)',
      a0.signerPlan || null);

    /* ================= HALF 1 — A signs, then D signs from a stale copy ================= */
    const at1 = new Date().toISOString();
    const aSigned = signedPayload(a0, { name: 'Amina Otieno', email: 'admin@example.co.ke' }, at1);
    const rA = await A.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: aSigned, baseVersion: a0._v } });
    const afterA = await A.json('/api/contracts/' + ID);
    t.ok(afterA.status === 'Signed' && (afterA.signatures || []).length === 1
      && afterA.signatures[0].name === 'Amina Otieno',
      `ARMED: Amina's signature is on the record at version ${rA.version}`,
      { status: afterA.status, sigs: (afterA.signatures || []).map(s => s.name), v: afterA._v });

    /* D's browser still holds the pre-signature copy — D never saw Amina press
       anything. D presses Sign. */
    const at2 = new Date(Date.now() + 1000).toISOString();
    const dSigned = signedPayload(d0, { name: 'Daniel Mwangi', email: 'daniel@example.co.ke' }, at2);
    dSigned._v = d0._v; dSigned._loaded = true; dSigned._light = false;

    const saverD = makeSaver(D, {
      keepMine: n => n <= 6,              // answer "Keep mine" six times: a loop is visible but bounded
      state: { view: 'contract', activeId: ID, contracts: [dSigned] },
    });
    await saverD.saveContract(dSigned);

    t.note(`dialogs shown to Daniel: ${saverD.log.dialogs.length}`);
    t.note(`dialog title/message: ${JSON.stringify(saverD.log.dialogs[0] || null)}`);
    t.note(`toasts shown to Daniel: ${JSON.stringify(saverD.log.toasts.map(x => x.msg))}`);

    const finalRec = await A.json('/api/contracts/' + ID);
    t.ok((finalRec.signatures || []).length === 1,
      'YARDSTICK one question one answer — the record holds ONE signature, not two',
      (finalRec.signatures || []).map(s => s.name));
    t.ok((finalRec.signatures || [])[0] && finalRec.signatures[0].name === 'Amina Otieno',
      'the signature on the record is the one that landed first',
      (finalRec.signatures || []).map(s => s.name));
    t.ok(finalRec.hash === aSigned.hash,
      'the seal is Amina\'s — Daniel\'s never overwrote it',
      { stored: String(finalRec.hash).slice(0, 12), amina: String(aSigned.hash).slice(0, 12), daniel: String(dSigned.hash).slice(0, 12) });

    /* THE YARDSTICK THIS PROBE EXISTS FOR: a refused save is a told save, and a
       signature is the one act where "keep mine" is the wrong question. */
    const said = saverD.log.toasts.map(x => x.msg).join(' | ');
    const toldSigned = /executed|already signed|signature|amendment/i.test(said);
    t.ok(toldSigned,
      'YARDSTICK a refused save is a told save — Daniel is told his signature did not land, in words that name the reason',
      { toasts: saverD.log.toasts.map(x => x.msg) });
    t.ok(saverD.log.dialogs.length === 1,
      'YARDSTICK every press lands — Daniel is asked the overwrite question ONCE, not once per press',
      { dialogs: saverD.log.dialogs.length });
    const dialogMentionsSignature = /sign|executed/i.test(JSON.stringify(saverD.log.dialogs[0] || {}));
    t.ok(dialogMentionsSignature,
      'the question Daniel is asked says a SIGNATURE is what he would be overwriting',
      saverD.log.dialogs[0] || null);

    /* Does the trail carry Daniel's press at all? */
    const auditActions = (finalRec.audit || []).map(a => `${a.user}:${a.action}`);
    const danielInTrail = auditActions.some(x => /Daniel/.test(x));
    t.note(`audit trail after the collision: ${JSON.stringify(auditActions)}`);
    t.ok(!danielInTrail,
      'YARDSTICK nothing is discarded silently — a signature that never landed leaves no line claiming it did',
      auditActions);

    /* ================= HALF 2 — the same collision as a BACKGROUND flush ================= */
    /* A second contract, so half 1's executed record does not colour this. Both
       admins hold MK-A1? No: A1 ships Signed. Use a fresh draft raised by A. */
    const NEW = 'MK-C4A';
    const draft = { id: NEW, name: 'Collision draft', counterparty: 'Kabras Sugar', folder: 'proc',
      value: 1000000, valueType: 'standard', status: 'Under Review', template: 'RM',
      expiry: '2027-06-30', fields: {}, metadata: { value: 1000000, currency: 'KES' },
      comments: [], audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe' }],
      signatures: [], obligations: [], rounds: [], changes: [] };
    await A.json('/api/contracts/' + NEW, { method: 'PUT', body: { contract: draft, baseVersion: 0 } });
    const b0 = await A.json('/api/contracts/' + NEW);
    const e0 = await D.json('/api/contracts/' + NEW);
    t.ok(b0._v === e0._v, `ARMED: both hold ${NEW} at version ${b0._v}`, { a: b0._v, d: e0._v });

    const at3 = new Date().toISOString();
    const aSigned2 = signedPayload(b0, { name: 'Amina Otieno', email: 'admin@example.co.ke' }, at3);
    await A.json('/api/contracts/' + NEW, { method: 'PUT', body: { contract: aSigned2, baseVersion: b0._v } });
    const armed2 = await A.json('/api/contracts/' + NEW);
    t.ok(armed2.status === 'Signed', `ARMED: ${NEW} is executed by Amina`, { status: armed2.status });

    const dSigned2 = signedPayload(e0, { name: 'Daniel Mwangi', email: 'daniel@example.co.ke' },
      new Date(Date.now() + 2000).toISOString());
    dSigned2._v = e0._v; dSigned2._loaded = true; dSigned2._light = false;
    const saverD2 = makeSaver(D, {
      keepMine: () => true,
      state: { view: 'dashboard', activeId: null, contracts: [dSigned2] },   // NOT the open contract
    });
    await saverD2.saveContract(dSigned2);
    t.note(`background-flush dialogs: ${saverD2.log.dialogs.length}`);
    t.note(`background-flush toasts: ${JSON.stringify(saverD2.log.toasts.map(x => x.msg))}`);
    t.ok(saverD2.log.dialogs.length === 0, 'a background flush pops no modal over unrelated work (by design)',
      saverD2.log.dialogs.length);
    const bgSaid = saverD2.log.toasts.map(x => x.msg).join(' | ');
    t.ok(!/open it and save again/i.test(bgSaid),
      'YARDSTICK a refused save is a told save — the background toast does NOT promise a retry that can never work',
      { toasts: saverD2.log.toasts.map(x => x.msg) });

    const final2 = await A.json('/api/contracts/' + NEW);
    t.ok((final2.signatures || []).length === 1 && final2.signatures[0].name === 'Amina Otieno',
      'the executed record is untouched by the background flush',
      (final2.signatures || []).map(s => s.name));

    /* ================= HALF 3 — CAN TWO PEOPLE SIGN ONE *STEP*? =================
       The single-signer path above is the reachable race. This half tries the
       other reading of C4 — two people on ONE row of a signing route — and
       records which guard stops it, so the guard is on the record as
       load-bearing rather than assumed. */
    const R = 'MK-C4R';
    const me = await A.json('/api/bootstrap');
    const routed = { ...draft, id: R, name: 'Routed draft', status: 'Under Review',
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Created', detail: 'probe' }],
      signerPlan: [
        { id: 'sg-cp', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director', signed: false },
        { id: 'sg-us', party: 'internal', order: 2, name: 'Amina Otieno', email: 'admin@example.co.ke',
          role: 'Director', memberId: me.me.id, signed: false } ] };
    await A.json('/api/contracts/' + R, { method: 'PUT', body: { contract: routed, baseVersion: 0 } });
    const r0 = await D.json('/api/contracts/' + R);
    t.ok((r0.signerPlan || []).length === 2 && r0.signerPlan[1].memberId === me.me.id,
      `ARMED: ${R} carries a route whose internal step is reserved for Amina (memberId ${String(me.me.id).slice(0, 8)}…)`,
      (r0.signerPlan || []).map(x => `${x.id}:${x.party}:${x.memberId || 'no-member'}`));

    // Daniel claims Amina's reserved step.
    const steal = JSON.parse(JSON.stringify(r0)); delete steal._v;
    steal.signerPlan[1].signed = true; steal.signerPlan[1].by = 'Daniel Mwangi'; steal.signerPlan[1].at = new Date().toISOString();
    steal.signatures = [{ party: 'internal-planned', name: 'Amina Otieno', email: 'admin@example.co.ke',
      at: new Date().toISOString(), method: 'session-authenticated', form: 'session' }];
    const stolen = await D.raw('/api/contracts/' + R, { method: 'PUT', body: { contract: steal, baseVersion: r0._v } });
    t.note(`reserved-step refusal: ${stolen.status} ${JSON.stringify(stolen.json)}`);
    t.ok(stolen.status === 403,
      'UNREACHABLE — the reserved-step guard refuses a second person on one step (403)',
      { status: stolen.status, error: stolen.json && stolen.json.error, reservedFor: stolen.json && stolen.json.reservedFor });

    // …and with no memberId on the row (a name typed by hand), the signature
    // itself still has to belong to the caller.
    const plain = JSON.parse(JSON.stringify(r0)); delete plain._v;
    delete plain.signerPlan[1].memberId;
    plain.signerPlan[1].signed = true;
    plain.signatures = [{ party: 'internal-planned', name: 'Amina Otieno', email: 'admin@example.co.ke',
      at: new Date().toISOString(), method: 'session-authenticated', form: 'session' }];
    const forged = await D.raw('/api/contracts/' + R, { method: 'PUT', body: { contract: plain, baseVersion: r0._v } });
    t.note(`unreserved-row refusal: ${forged.status} ${JSON.stringify(forged.json)}`);
    t.ok(forged.status === 403,
      'UNREACHABLE — and an in-app signature naming somebody else is refused too (403)',
      { status: forged.status, error: forged.json && forged.json.error });
    const routedAfter = await A.json('/api/contracts/' + R);
    t.ok((routedAfter.signatures || []).length === 0 && !routedAfter.signerPlan[1].signed,
      'nothing was half-written by either refusal',
      { sigs: (routedAfter.signatures || []).length, signed: routedAfter.signerPlan[1].signed });

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + ((e && e.stack) || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
