/* ============================================================
   SKEPTIC COUNTER-PROBE for finding C1a
   ============================================================
   The original probe runs js/core.js's save path inside a vm sandbox. That is a
   rig, and a rig is where fixture faults hide. This file removes the rig
   entirely: two real cookie-keeping clients, plain HTTP, and the keep-mine
   branch reproduced BY HAND as the literal lines js/core.js performs.

   RESTAGED 15 Aug 2026, WHEN THE FIX LANDED, AND THE RESTAGING IS THE POINT.
   This file used to hand-type the OLD keep-mine —

       catch 409  →  fresh = GET /api/contracts/:id
                  →  c._v = fresh._v
                  →  PUT the SAME stale body again with baseVersion = fresh._v

   — which is a request HaTi no longer makes. A probe that goes on sending it is
   staging the broken behaviour by hand and then reporting it as a product
   fault, which is the fixture fault this whole sweep was told to guard against.
   It now types the CURRENT two lines instead:

       catch 409  →  PUT the same body back with baseVersion = THE VERSION IT
                     WAS TAKEN FROM, and rebase:true

   Still no rig and still no re-implementation: the merge itself is the
   server's, which is exactly what makes this the stronger of the two probes —
   it proves the fix holds for ANY client, not only for the browser that ships
   with it. Section 11 pins that js/core.js really does send this and really
   does not re-send at the winner's version, so the probe cannot quietly drift
   back to testing a request nobody makes.

   It also asks the three questions the skeptic pass owes the finding:
     · is the 409 the SERVER's own answer, or something the rig invented?
     · does the server preserve anything of B's (audit is merged — what else)?
     · is there ANY surface, anywhere, that would tell B?

   Run:  node test/audit/collisions/c1a-SKEPTIC-counter-probe.js
*/
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('../../helpers');

const ID = 'MK-A2';
let pass = 0, fail = 0;
const ok = (cond, msg, detail) => {
  if (cond) { pass++; console.log('PASS  ' + msg); }
  else { fail++; console.log('FAIL  ' + msg + (detail !== undefined ? '  →  ' + JSON.stringify(detail) : '')); }
  return !!cond;
};
const note = m => console.log('      · ' + m);

(async () => {
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-admin');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const B = w.unrestricted;

    /* ================= 1 · BOTH HOLD THE SAME VERSION ================= */
    const a0 = await A.json('/api/contracts/' + ID);
    const b0 = await B.json('/api/contracts/' + ID);
    ok(a0._v === b0._v, `ARMED: both readers hold version ${a0._v}`, { a: a0._v, b: b0._v });
    const v0 = a0._v;
    note(`before: counterparty="${a0.counterparty}" value=${a0.value} changes=${JSON.stringify((a0.changes || []).map(x => x.id))}`);

    /* ================= 2 · B WRITES — counterparty AND a tracked change =================
       Both payloads in one save, so one collision measures both losses. */
    const bBody = JSON.parse(JSON.stringify(b0)); delete bBody._v;
    bBody.counterparty = 'Nandi Dairy Co-operative PLC';
    bBody.changes = [{ id: 'CHG-001', seq: 1, clauseId: 'c3', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Unrestricted Legal', round: 1, hash: 'fp-001',
      body: 'Payment within forty-five (45) days.', at: new Date().toISOString() }];
    /* the REAL audit line negoFileChange writes (js/negotiation.js ~1316) */
    bBody.audit = (bBody.audit || []).concat([{ at: new Date().toISOString(), user: 'Unrestricted Legal',
      action: 'Negotiation', detail: '#CHG-001 proposed by Unrestricted Legal in round 1 — “payment days” on Clause 3 · fingerprint fp-001' }]);
    const bRes = await B.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: bBody, baseVersion: v0 } });
    ok(bRes.status === 200 && bRes.json && bRes.json.version === v0 + 1,
      `ARMED: B's save is accepted, version ${v0} → ${bRes.json && bRes.json.version}`, { status: bRes.status, body: bRes.json });

    /* ================= 3 · READ THE ARMED STATE BACK OFF THE SERVER ================= */
    const armed = await A.json('/api/contracts/' + ID);
    ok(armed.counterparty === 'Nandi Dairy Co-operative PLC', 'ARMED: stored counterparty is B\'s', armed.counterparty);
    ok((armed.changes || []).length === 1 && armed.changes[0].id === 'CHG-001',
      'ARMED: stored contract carries B\'s CHG-001', (armed.changes || []).map(x => x.id));
    ok((armed.audit || []).some(x => x.action === 'Negotiation' && /CHG-001 proposed/.test(x.detail || '')),
      'ARMED: the audit trail carries the real "proposed" line', (armed.audit || []).slice(-1));

    /* ================= 4 · A'S STALE SAVE — THE 409 IS THE SERVER'S OWN ================= */
    const cA = JSON.parse(JSON.stringify(a0));       // A's copy, taken BEFORE B wrote
    delete cA._v;
    cA.value = 42000000;
    cA.audit = (cA.audit || []).concat([{ at: new Date().toISOString(), user: 'Amina Otieno',
      action: 'Edited', detail: 'Updated contract value' }]);
    const r409 = await A.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: cA, baseVersion: v0 } });
    ok(r409.status === 409, 'the SERVER refuses the stale save with 409', { status: r409.status, body: r409.json });
    ok(/conflict|version/i.test((r409.json && r409.json.error) || ''),
      'the message matches js/core.js\'s /conflict|version/i test, so the H-4 branch is what runs',
      r409.json && r409.json.error);
    ok(r409.json && r409.json.version === v0 + 1, 'the 409 hands back the fresh version number', r409.json && r409.json.version);

    /* ================= 5 · "KEEP MINE & SAVE", BY HAND =================
       js/core.js:  if(keepMine) return await rebaseSave(c);
       which is:    PUT { contract: <the same body>, baseVersion: c._v, rebase:true }
       No rig, no sandbox: the same stale body, sent with the version it was
       taken from, and the server told to work out which parts of it are A's. */
    const fresh = await A.json('/api/contracts/' + ID);
    note(`the record is at version ${fresh._v}; A's copy was taken at version ${v0}`);
    const rKeep = await A.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: cA, baseVersion: v0, rebase: true } });
    ok(rKeep.status === 200, `"keep mine" is accepted, version ${fresh._v} → ${rKeep.json && rKeep.json.version}`,
      { status: rKeep.status, body: rKeep.json });

    const after = await A.json('/api/contracts/' + ID);
    note(`after: counterparty="${after.counterparty}" value=${after.value} changes=${JSON.stringify((after.changes || []).map(x => x.id))} v=${after._v}`);

    ok(after.value === 42000000, 'A\'s edit is on the record', after.value);
    const lostField = after.counterparty !== 'Nandi Dairy Co-operative PLC';
    const lostChange = (after.changes || []).length === 0;
    ok(!lostField, 'B\'s counterparty edit survives',
      { expected: 'Nandi Dairy Co-operative PLC', got: after.counterparty });
    ok(!lostChange, 'B\'s tracked change survives',
      { changes: (after.changes || []).map(x => x.id) });
    /* AND THE OLD REQUEST IS STILL REFUSED NOTHING — which is the honest half.
       A whole stale record sent at the CURRENT version is indistinguishable, on
       the wire, from somebody deliberately typing those values; the server
       cannot and must not guess. That is exactly why the browser now sends the
       version it read, and why section 11 checks that it does. */
    ok(rKeep.json && rKeep.json.rebased && rKeep.json.rebased.baseKnown === true,
      'the server had the before-picture and says so, so the merge was three-way and not a guess',
      rKeep.json && rKeep.json.rebased);

    /* ================= 6 · WHAT THE RECORD NOW SAYS vs WHAT IT HOLDS ================= */
    const saysProposed = (after.audit || []).some(x => /CHG-001 proposed/.test(x.detail || ''));
    ok(saysProposed, 'the audit trail STILL says CHG-001 was proposed', saysProposed);
    ok(!(saysProposed && lostChange),
      'no "CHG-001 was proposed" in the history with no CHG-001 in the contract',
      { historySays: saysProposed, onRecord: (after.changes || []).map(x => x.id) });

    const namesTheLoss = (after.audit || []).filter(x =>
      /overwrote|overwritten|replaced|conflict|discard|reverted|removed/i.test(String(x.action) + ' ' + String(x.detail)));
    ok(namesTheLoss.length > 0, 'an audit line NAMES the overwrite', namesTheLoss);

    /* ================= 7 · IS THERE ANY SURFACE THAT WOULD TELL B? =================
       B's own reading of the contract, and every server-side channel that exists
       for telling somebody something: the outbox (mail), the activity log. */
    const bSees = await B.json('/api/contracts/' + ID);
    ok(bSees.counterparty === 'Nandi Dairy Co-operative PLC',
      'B, on reloading, still sees their own counterparty edit', bSees.counterparty);
    ok((bSees.changes || []).length === 1, 'B, on reloading, still sees their own CHG-001', (bSees.changes || []).map(x => x.id));

    /* REVERSED IN PLACE, 15 Aug 2026, and the reason is the finding's own.
       This used to ask for a MESSAGE to B, because B's work had been destroyed
       and nothing anywhere would ever tell them. Under the rebase nothing of
       B's was touched — the two assertions immediately above are the proof —
       so a message to B would be a notification about an event that did not
       happen, which is its own kind of untruth. What is still owed is a RECORD
       of the collision, and that is asserted at 6 and again at 7b below, where
       a genuine same-field clash is staged so the claim keeps its teeth. */
    let outbox = null;
    try { outbox = await w.admin.json('/api/outbox'); } catch (e) { outbox = { error: String(e.message).slice(0, 80) }; }
    const mails = (outbox && (outbox.messages || outbox.outbox || outbox.rows)) || [];
    const toB = mails.filter(m => /everything@example/i.test(JSON.stringify(m)));
    ok(!lostField && !lostChange && toB.length === 0,
      'nothing was sent to B, and nothing needed to be — none of B\'s work was overwritten',
      { outboxSize: mails.length, toB: toB.length, lostField, lostChange });

    /* ================= 7b · A REAL CLASH — BOTH EDIT THE SAME FIELD =================
       The one case where somebody's work really is written over: A and B both
       move the value. A's answer wins, because A is the one being asked. What
       must not happen is silence — the audit line has to name the field AND
       whose save it landed on, or the loser has nothing to find. */
    const k0 = await A.json('/api/contracts/' + ID);
    const kv = k0._v;
    const bClash = JSON.parse(JSON.stringify(k0)); delete bClash._v;
    bClash.value = 11000000;
    bClash.audit = (bClash.audit || []).concat([{ at: new Date().toISOString(), user: 'Unrestricted Legal',
      action: 'Edited', detail: 'Updated contract value to 11,000,000' }]);
    await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bClash, baseVersion: kv } });
    const armedClash = await A.json('/api/contracts/' + ID);
    ok(armedClash.value === 11000000, 'ARMED (7b): B\'s value is on the record', armedClash.value);

    const aClash = JSON.parse(JSON.stringify(k0)); delete aClash._v;    // A's copy from BEFORE
    aClash.value = 23000000;
    const rClash = await A.raw('/api/contracts/' + ID, { method: 'PUT',
      body: { contract: aClash, baseVersion: kv, rebase: true } });
    const afterClash = await A.json('/api/contracts/' + ID);
    ok(rClash.status === 200 && afterClash.value === 23000000,
      'the person answering the question gets their way on the field they both moved',
      { status: rClash.status, value: afterClash.value });
    const clashLine = (afterClash.audit || []).find(x => /Save conflict/i.test(String(x.action)));
    ok(!!clashLine && /value/i.test(clashLine.detail || '') && /Unrestricted Legal/.test(clashLine.detail || ''),
      'the audit line NAMES the field that was overwritten and whose save it landed on',
      clashLine || null);
    ok(rClash.json && rClash.json.rebased && (rClash.json.rebased.overwrote || []).includes('value'),
      'and the answer says so on the wire, so the browser can put it on the screen',
      rClash.json && rClash.json.rebased);

    /* ================= 8 · THE CONTROL — is it really the STALENESS, not the rig? =================
       A re-reads first (what any honest client does), applies the same value
       edit, and saves. Both survive. If this passes, section 5's loss is caused
       by the stale body and by nothing else. */
    const c2 = await A.json('/api/contracts/' + ID);
    const v2 = c2._v;
    const bBody2 = JSON.parse(JSON.stringify(c2)); delete bBody2._v;
    bBody2.counterparty = 'Nandi Dairy Co-operative PLC';
    bBody2.changes = [{ id: 'CHG-009', seq: 9, clauseId: 'c3', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Unrestricted Legal', round: 1, hash: 'fp-009', body: 'x', at: new Date().toISOString() }];
    await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bBody2, baseVersion: v2 } });
    const c3 = await A.json('/api/contracts/' + ID);          // A RE-READS
    const c3body = JSON.parse(JSON.stringify(c3)); const v3 = c3._v; delete c3body._v;
    c3body.value = 77000000;
    await A.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: c3body, baseVersion: v3 } });
    const after2 = await A.json('/api/contracts/' + ID);
    ok(after2.value === 77000000 && after2.counterparty === 'Nandi Dairy Co-operative PLC'
      && (after2.changes || []).length === 1,
      'CONTROL: a re-read-then-save keeps BOTH — so the loss is the stale body, not the route',
      { value: after2.value, counterparty: after2.counterparty, changes: (after2.changes || []).map(x => x.id) });

    /* ================= 9 · DOES THE SERVER PRESERVE ANYTHING ELSE OF B'S? =================
       The route preserves audit (append-only), money fields for a values-hidden
       reader, and template provenance. Measured, not assumed: send a stale body
       that also drops `obligations` and `metadata` and see what comes back. */
    const c4 = await A.json('/api/contracts/' + ID);
    const v4 = c4._v;
    const bBody3 = JSON.parse(JSON.stringify(c4)); delete bBody3._v;
    bBody3.obligations = [{ id: 'OB-1', what: 'Quarterly report', due: '2026-10-01' }];
    bBody3.metadata = { ...(bBody3.metadata || {}), bNote: 'written by B' };
    await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bBody3, baseVersion: v4 } });
    const armed4 = await A.json('/api/contracts/' + ID);
    ok((armed4.obligations || []).length === 1 && armed4.metadata && armed4.metadata.bNote === 'written by B',
      'ARMED (9): B\'s obligation and metadata are on the record',
      { obligations: (armed4.obligations || []).length, bNote: armed4.metadata && armed4.metadata.bNote });

    const stale4 = JSON.parse(JSON.stringify(c4)); delete stale4._v;       // A's copy from BEFORE
    stale4.value = 88000000;
    await A.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: stale4, baseVersion: v4, rebase: true } });
    const after4 = await A.json('/api/contracts/' + ID);
    ok((after4.obligations || []).length === 1,
      'B\'s obligation survives A\'s keep-mine', { obligations: (after4.obligations || []).length });
    ok(after4.metadata && after4.metadata.bNote === 'written by B',
      'B\'s metadata note survives A\'s keep-mine', after4.metadata && after4.metadata.bNote);
    ok(after4.value === 88000000, 'and A\'s own edit still landed', after4.value);
    note(`only what A actually moved is written: obligations=${(after4.obligations || []).length} bNote=${after4.metadata && after4.metadata.bNote} value=${after4.value}`);

    /* ================= 10 · HOW FAR DOES THE HOLE REACH? THE EXECUTED BOUNDARY =================
       EXECUTED_IMMUTABLE (server ~2263) freezes counterparty, value, changes,
       rounds, negotiation, versions, metadata … on a signed contract, so a stale
       keep-mine that MOVED one of those is refused. `obligations` is deliberately
       NOT on that list ("a quarterly report starts mattering AFTER signature"),
       and `comments` is not either — so the collision survives execution on
       exactly the fields the rulebook keeps mutable. Measured, not assumed. */
    const e0 = await A.json('/api/contracts/' + ID);
    const exec = JSON.parse(JSON.stringify(e0)); const ev = exec._v; delete exec._v;
    exec.status = 'Signed';
    exec.hash = 'seal-' + Date.now();
    exec.execution = { at: new Date().toISOString(), html: '<p>frozen wording</p>' };
    exec.signatures = [{ name: 'Amina Otieno', email: 'admin@example.co.ke', at: new Date().toISOString(), method: 'session-authenticated' }];
    const eRes = await A.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: exec, baseVersion: ev } });
    const e1 = await A.json('/api/contracts/' + ID);
    ok(eRes.status === 200 && e1.status === 'Signed' && !!e1.hash,
      `ARMED (10): the contract is executed (status ${e1.status}, seal present, version ${e1._v})`,
      { status: eRes.status, s: e1.status, hash: !!e1.hash });

    const aStaleExec = JSON.parse(JSON.stringify(e1)); const av = e1._v; delete aStaleExec._v;   // A's copy, taken NOW
    /* B adds an obligation — mutable after signature by design */
    const bExec = JSON.parse(JSON.stringify(e1)); const bv = bExec._v; delete bExec._v;
    bExec.obligations = [{ id: 'OB-9', what: 'Quarterly report to the board', due: '2026-11-01' }];
    const bER = await B.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: bExec, baseVersion: bv } });
    const e2 = await A.json('/api/contracts/' + ID);
    ok(bER.status === 200 && (e2.obligations || []).length === 1,
      'ARMED (10): B\'s obligation is on the executed record', { status: bER.status, obligations: (e2.obligations || []).length });

    /* A, meanwhile, leaves an internal comment on their stale copy and saves */
    aStaleExec.comments = (aStaleExec.comments || []).concat([{ at: new Date().toISOString(), user: 'Amina Otieno', text: 'Filed for the board pack.' }]);
    const rExec = await A.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: aStaleExec, baseVersion: av, rebase: true } });
    const e3 = await A.json('/api/contracts/' + ID);
    ok(rExec.status === 200, 'a stale keep-mine on an EXECUTED contract that moves no frozen field is accepted',
      { status: rExec.status, body: rExec.json });
    ok((e3.obligations || []).length === 1,
      'B\'s obligation survives on the EXECUTED contract', { obligations: (e3.obligations || []).length });
    ok((e3.comments || []).some(x => /board pack/i.test(String(x.text || ''))),
      'and A\'s own note landed on it', (e3.comments || []).map(x => x.text));
    note(`executed boundary: frozen fields are refused, mutable ones (obligations, comments) are merged rather than replaced — obligations now ${(e3.obligations || []).length}`);

    /* ================= 11 · IS THIS THE REQUEST THE PRODUCT ACTUALLY MAKES? =================
       The whole worth of a hand-typed probe is that it types what the product
       types. Read js/core.js and check the two things that matter: keep-mine
       goes through rebaseSave, and rebaseSave sends the version the copy was
       taken from with rebase:true — never the winner's version, which is the
       line this file used to reproduce. */
    const core = fs.readFileSync(path.join(__dirname, '..', '..', '..', 'js', 'core.js'), 'utf8');
    ok(/if\(keepMine\)\s*return await rebaseSave\(c\);/.test(core),
      'js/core.js answers "keep mine" with a rebase', /if\(keepMine\)[^\n]*/.exec(core));
    ok(/rebaseSave[\s\S]{0,600}baseVersion:c\._v\|\|0,\s*rebase:true/.test(core),
      'and rebaseSave sends the version the copy was taken from, with rebase:true',
      /baseVersion:c\._v\|\|0,\s*rebase:true/.test(core));
    ok(!/if\(keepMine\)\{\s*if\(fresh\)\s*c\._v=fresh\._v/.test(core),
      'the old "stamp the winner\'s version onto my stale copy" line is gone', true);

    console.log(`\nC1a SKEPTIC counter-probe: ${pass} passed, ${fail} failed`);
    console.log('(5/6/7/9/10 = the fix holds with no browser in the picture at all; 8 = the route was always sound; 11 = this is the request HaTi makes.)');
  } catch (e) {
    console.log('FAIL  counter-probe threw: ' + (e && e.stack || e));
    process.exitCode = 1;
  } finally {
    await h.stop();
  }
})();
