/* ============================================================
   C1c — WHAT THE SERVER DOES ON A STALE SAVE, AND WHAT THE BROWSER HEARS
   ============================================================
   Two halves.

   HALF 1 — the refusal itself. Status, body, and whether anything on the record
   has already moved by the time the route says no. Measured by taking a byte
   copy of the stored row before and after.

   HALF 2 — the browser's reading of it. js/core.js decides "this was a version
   conflict" with  /conflict|version/i.test(e.message)  over the SERVER'S OWN
   SENTENCE. The executed-contract refusal on the same route lists the frozen
   field names in its sentence, and two of those names are `sealVersion` and
   `versions`. So a permanent "this contract is executed" refusal reads to the
   browser as a transient version clash — and the H-4 dialog offers to overwrite
   something that can never be overwritten.

   The collision that reaches it is ordinary and both acts are allowed: A has
   the contract open, B signs it, A saves.

   Run:  node test/audit/collisions/c1c-stale-save-server.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { makeSaver, harness } = require('./savepath');

const ID = 'MK-A2';

(async () => {
  const t = harness('C1c stale save — server refusal and browser reading');
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-admin');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const B = w.unrestricted;

    /* ================= HALF 1 — the plain stale save ================= */
    const a0 = await A.json('/api/contracts/' + ID);
    const v0 = a0._v;
    const before = JSON.stringify(a0);

    const bSave = JSON.parse(JSON.stringify(a0)); delete bSave._v;
    bSave.metadata = { ...(bSave.metadata || {}), note: 'B was here' };
    const bRes = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave, baseVersion: v0 } });
    t.ok(bRes.version === v0 + 1, `ARMED: B moved the record ${v0} → ${bRes.version}`, bRes);

    const mid = await A.json('/api/contracts/' + ID);
    const midJson = JSON.stringify(mid);

    const stale = JSON.parse(JSON.stringify(a0)); delete stale._v;
    stale.value = 1;
    const r = await A.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: stale, baseVersion: v0 } });
    t.ok(r.status === 409, `a stale save is refused with 409 (got ${r.status})`, r.status);
    t.ok(r.json && /conflict/i.test(r.json.error || ''), 'the refusal says "conflict" in words', r.json && r.json.error);
    t.ok(r.json && r.json.version === v0 + 1, 'the refusal hands back the version the caller must rebase on', r.json && r.json.version);

    const after = await A.json('/api/contracts/' + ID);
    t.ok(JSON.stringify(after) === midJson, 'YARDSTICK — nothing on the record moved before the refusal', {
      versionBefore: mid._v, versionAfter: after._v, valueAfter: after.value });
    t.ok(after.value !== 1, 'the refused value never reached the record', after.value);
    const auditGrew = (after.audit || []).length !== (mid.audit || []).length;
    t.ok(!auditGrew, 'a refused save writes no audit line (nothing half-applied)',
      { before: (mid.audit || []).length, after: (after.audit || []).length });
    t.note(`refusal body: ${JSON.stringify(r.json)}`);
    t.note(`the refusal is NOT recorded anywhere on the server — the only trace is in the caller's browser (${before.length === midJson.length ? '' : ''}no audit row, no notice to B)`);

    /* ================= HALF 2 — the misread refusal ================= */
    /* B signs the contract properly: a session-authenticated signature in B's
       own name, the seal, the execution stamp and the status, all in one save —
       which is exactly what js/views/contract.js's signDocument does. */
    const c1 = await A.json('/api/contracts/' + ID);
    const v1 = c1._v;
    const aHolds = JSON.parse(JSON.stringify(c1));      // A's browser copy: pre-signature
    aHolds._v = v1; aHolds._loaded = true; aHolds._light = false;

    const sign = JSON.parse(JSON.stringify(c1)); delete sign._v;
    sign.status = 'Signed';
    sign.signatures = [{ name: 'Unrestricted Legal', email: 'everything@example.co.ke',
      capacity: 'Director', at: new Date().toISOString(), method: 'session-authenticated' }];
    sign.execution = { at: new Date().toISOString(), by: 'Unrestricted Legal' };
    sign.hash = 'a'.repeat(64);
    sign.sealVersion = 2;
    sign.signedAt = new Date().toISOString().slice(0, 10);
    const signRes = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: sign, baseVersion: v1 } });
    const signed = await A.json('/api/contracts/' + ID);
    t.ok(signed.status === 'Signed' && signed.hash && signed.sealVersion === 2,
      `ARMED: B executed the contract at version ${signRes.version}`,
      { status: signed.status, sealVersion: signed.sealVersion, sigs: (signed.signatures || []).length });

    /* What does the route say to a save that is now REBASED (right version) but
       still carries A's pre-signature record? */
    const rebased = JSON.parse(JSON.stringify(aHolds)); delete rebased._v;
    rebased.value = 12345;
    const r2 = await A.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: rebased, baseVersion: signed._v } });
    t.ok(r2.status === 409, `the executed guard refuses with 409 (got ${r2.status})`, r2.status);
    t.note(`executed refusal: ${r2.json && r2.json.error}`);
    t.note(`frozen fields named: ${JSON.stringify(r2.json && r2.json.immutable)}`);
    const msg = String((r2.json && r2.json.error) || '');
    /* THE TEST IS THE PRODUCT'S OWN, lifted out of js/core.js rather than
       retyped — a retyped regex is exactly the kind of harness fault this
       sweep is told to guard against. */
    const coreSrc = require('fs').readFileSync(require('path').join(__dirname, '..', '..', '..', 'js', 'core.js'), 'utf8');
    const reSrc = /if\(\/([^/]+)\/i\.test\(e\.message\)\)/.exec(coreSrc);
    t.ok(!!reSrc, 'found js/core.js\'s own conflict test in the source', reSrc && reSrc[0]);
    t.note(`js/core.js decides "this was a version conflict" with /${reSrc && reSrc[1]}/i over the server's sentence`);
    const productRe = new RegExp(reSrc[1], 'i');
    const readsAsConflict = productRe.test(msg);
    t.ok(!readsAsConflict,
      'YARDSTICK — the executed refusal does NOT read to js/core.js as a version conflict',
      { sentence: msg, matchedBy: (msg.match(/conflict|version/i) || [])[0] || null });

    /* Now drive the REAL browser branch over the whole collision: A's stale
       save → conflict dialog → "Keep mine & save" → rebase → executed refusal.
       keepMine answers yes four times so a loop is visible but bounded. */
    const saver = makeSaver(A, {
      keepMine: n => n < 5,
      state: { view: 'contract', activeId: ID, contracts: [aHolds] },
    });
    const cA = aHolds; cA.value = 12345;
    await saver.saveContract(cA);

    t.note(`dialogs shown to A: ${saver.log.dialogs.length}`);
    t.note(`toasts shown to A: ${JSON.stringify(saver.log.toasts.map(x => x.msg))}`);
    t.ok(saver.log.dialogs.length === 1,
      'YARDSTICK — A is asked the overwrite question ONCE, not once per press',
      saver.log.dialogs.length);
    const toldExecuted = saver.log.toasts.some(x => /executed|amendment|signature/i.test(x.msg));
    t.ok(toldExecuted,
      'YARDSTICK — A is told the real reason ("it is executed — record an amendment")',
      saver.log.toasts.map(x => x.msg));

    const final = await A.json('/api/contracts/' + ID);
    t.ok(final.status === 'Signed' && final.value === signed.value,
      'the executed record is untouched by all of it',
      { status: final.status, value: final.value, version: final._v });

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
