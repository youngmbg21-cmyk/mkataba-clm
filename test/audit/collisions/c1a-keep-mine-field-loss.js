/* ============================================================
   C1a — FIELD-LEVEL LOSS INSIDE A RECORD-LEVEL ANSWER
   ============================================================
   Two colleagues, one contract, both allowed. A edits the VALUE; B edits the
   COUNTERPARTY; both autosaves land on the same baseVersion. A is refused,
   gets the H-4 dialog, and presses "Keep mine & save".

   The question is not whether the refusal is handled — it is. The question is
   what "keep mine" costs, because saveContract re-sends A's WHOLE stale record
   under B's fresh version number.

   ARMED STATE IS ASSERTED FIRST: B's write is read back off the server (value,
   version, audit line) before A is allowed to collide with it.

   Run:  node test/audit/collisions/c1a-keep-mine-field-loss.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { makeSaver, harness } = require('./savepath');

const ID = 'MK-A2';

(async () => {
  const t = harness('C1a keep-mine field loss');
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-admin');            // signed in as the admin
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const B = w.unrestricted;                 // an ordinary Editor, same streams

    /* ---------- POSITIVE CONTROL ----------
       Before anything is judged, prove the rig can save NORMALLY: the sliced
       js/core.js save path, through a real HTTP client, on an uncontested
       contract. If this fails, every failure below is the harness, not HaTi. */
    {
      const ctl = await A.json('/api/contracts/' + ID);
      const cCtl = JSON.parse(JSON.stringify(ctl)); cCtl._v = ctl._v; cCtl._loaded = true; cCtl._light = false;
      cCtl.metadata = { ...(cCtl.metadata || {}), probe: 'positive-control' };
      const s = makeSaver(A, { keepMine: false, state: { view: 'contract', activeId: ID, contracts: [cCtl] } });
      await s.saveContract(cCtl);
      const back = await A.json('/api/contracts/' + ID);
      t.ok(back._v === ctl._v + 1 && back.metadata.probe === 'positive-control'
        && s.log.dialogs.length === 0 && s.log.toasts.length === 0,
        'CONTROL: the real save path writes normally through this rig',
        { version: back._v, dialogs: s.log.dialogs.length, toasts: s.log.toasts.map(x => x.msg) });
    }

    /* ---------- 0. both hold the same version ---------- */
    const a0 = await A.json('/api/contracts/' + ID);
    const b0 = await B.json('/api/contracts/' + ID);
    t.ok(a0._v === b0._v, `both readers hold version ${a0._v}`, { a: a0._v, b: b0._v });
    const v0 = a0._v;
    const cpBefore = a0.counterparty, valBefore = a0.value;
    t.note(`stored before: counterparty="${cpBefore}" value=${valBefore} auditLines=${(a0.audit || []).length}`);

    /* ---------- 1. B edits the counterparty, exactly as wireKeyTerms does ----------
       (js/views/contract.js ~5223 sets c.counterparty, then logAudit
       'Edited / Updated counterparty', then persist) */
    const bSave = JSON.parse(JSON.stringify(b0)); delete bSave._v;
    bSave.counterparty = 'Nandi Dairy Co-operative PLC';
    bSave.lastAction = '15 Aug 2026';
    bSave.audit = (bSave.audit || []).concat([{ at: new Date().toISOString(),
      user: 'Unrestricted Legal', action: 'Edited', detail: 'Updated counterparty' }]);
    const bRes = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave, baseVersion: v0 } });
    t.ok(bRes && bRes.ok === true && bRes.version === v0 + 1, `B's save landed at version ${bRes && bRes.version}`, bRes);

    /* ---------- 2. ARMED-STATE ASSERTION — read the collision back off the server ---------- */
    const armed = await A.json('/api/contracts/' + ID);
    const armedOk =
      t.ok(armed.counterparty === 'Nandi Dairy Co-operative PLC', 'ARMED: stored counterparty is B\'s', armed.counterparty)
      & t.ok(armed._v === v0 + 1, `ARMED: stored version moved ${v0} → ${armed._v}`, armed._v)
      & t.ok((armed.audit || []).some(x => x.detail === 'Updated counterparty' && x.user === 'Unrestricted Legal'),
        'ARMED: B\'s audit line is on the record', (armed.audit || []).slice(-2));
    if (!armedOk) { t.note('collision NOT armed — everything below would be meaningless'); t.done(); }

    /* ---------- 3. A's browser, holding the STALE copy, edits the value ---------- */
    const cA = JSON.parse(JSON.stringify(a0));      // A's in-memory record: version v0
    cA._v = v0; cA._loaded = true; cA._light = false;
    cA.value = 42000000;
    cA.lastAction = '15 Aug 2026';
    cA.audit = (cA.audit || []).concat([{ at: new Date().toISOString(),
      user: 'Amina Otieno', action: 'Edited', detail: 'Updated contract value' }]);
    t.ok(cA.counterparty === cpBefore, `A's in-memory copy still carries the OLD counterparty "${cA.counterparty}"`, cA.counterparty);

    /* ---------- 4. A saves. The real saveContract runs. Dialog answers "Keep mine & save". ---------- */
    const saver = makeSaver(A, { keepMine: true, state: { view: 'contract', activeId: ID, contracts: [cA] } });
    await saver.saveContract(cA);

    t.ok(saver.log.dialogs.length === 1, 'A was shown the H-4 conflict dialog exactly once', saver.log.dialogs.length);
    const dlg = saver.log.dialogs[0] || {};
    t.note(`dialog said: "${dlg.message}"`);
    t.ok(/Keep mine/i.test(dlg.confirmLabel || ''), 'the dialog offered "Keep mine & save"', dlg.confirmLabel);

    /* ---------- 5. WHAT SURVIVED ---------- */
    const after = await A.json('/api/contracts/' + ID);
    t.note(`stored after:  counterparty="${after.counterparty}" value=${after.value} version=${after._v}`);

    t.ok(after.value === 42000000, 'A\'s value edit is on the record (A kept theirs)', after.value);

    const bLost = after.counterparty !== 'Nandi Dairy Co-operative PLC';
    t.ok(!bLost, 'YARDSTICK — B\'s counterparty edit survives A\'s record-level "keep mine"',
      { expected: 'Nandi Dairy Co-operative PLC', got: after.counterparty });

    /* ---------- 6. THE HISTORY vs THE RECORD ----------
       "Every recorded yes is in the outcome." The server's append-only audit
       guard keeps B's line whatever A sends — so if the field is gone the
       record now says a thing was done that the contract does not show. */
    const keptBLine = (after.audit || []).some(x => x.detail === 'Updated counterparty' && x.user === 'Unrestricted Legal');
    const keptALine = (after.audit || []).some(x => x.detail === 'Updated contract value' && x.user === 'Amina Otieno');
    t.ok(keptBLine, 'the audit trail still says B updated the counterparty', keptBLine);
    t.ok(keptALine, 'the audit trail says A updated the value', keptALine);
    t.ok(!(keptBLine && bLost),
      'YARDSTICK — no "yes" in the history without the matching fact in the contract',
      { historySaysBEdited: keptBLine, contractHoldsBsEdit: !bLost, storedCounterparty: after.counterparty });

    /* ---------- 7. WAS ANYBODY TOLD WHAT WAS LOST? ---------- */
    const namesAField = /counterparty|value|field/i.test(dlg.message || '');
    t.ok(namesAField, 'YARDSTICK — the dialog names WHAT would be overwritten', dlg.message);

    const overwriteLine = (after.audit || []).filter(x =>
      /overwrote|overwritten|replaced|conflict|discard/i.test(String(x.action) + ' ' + String(x.detail)));
    t.ok(overwriteLine.length > 0,
      'YARDSTICK — an audit line NAMES the overwrite, so the loser can find it', overwriteLine);

    t.note(`toasts A saw: ${JSON.stringify(saver.log.toasts.map(x => x.msg))}`);
    t.note('B (the loser) received nothing at all: no route, no notice, no mail — B\'s browser still shows its own edit until it next reloads.');

    /* ---------- 8. THE OTHER BRANCH — "Load theirs" ----------
       Same collision, opposite answer. Measures whether Object.assign(c,fresh)
       really discards A's work, and whether a key A invented survives it. */
    const c2 = await A.json('/api/contracts/' + ID);
    const v2 = c2._v;
    const bSave2 = JSON.parse(JSON.stringify(c2)); delete bSave2._v;
    bSave2.counterparty = 'Nandi Dairy Co-operative PLC';   // B re-applies its edit
    await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave2, baseVersion: v2 } });
    const armed2 = await A.json('/api/contracts/' + ID);
    t.ok(armed2._v === v2 + 1 && armed2.counterparty === 'Nandi Dairy Co-operative PLC',
      `ARMED (branch 2): B is on the record again at version ${armed2._v}`, armed2.counterparty);

    const cA2 = JSON.parse(JSON.stringify(c2));
    cA2._v = v2; cA2._loaded = true; cA2._light = false;
    cA2.value = 99000000;
    cA2.__ghostKeyOnlyAHas = 'a-local-invention';
    const saver2 = makeSaver(A, { keepMine: false, state: { view: 'contract', activeId: ID, contracts: [cA2] } });
    await saver2.saveContract(cA2);
    t.ok(cA2.value === armed2.value, '"Load theirs" replaced A\'s value in memory with the server\'s',
      { inMemory: cA2.value, server: armed2.value });
    t.ok(cA2.counterparty === 'Nandi Dairy Co-operative PLC', '"Load theirs" brought B\'s counterparty into A\'s copy', cA2.counterparty);
    t.ok(saver2.log.toasts.length > 0, '"Load theirs" told A out loud', saver2.log.toasts.map(x => x.msg));
    t.ok(cA2.__ghostKeyOnlyAHas === undefined,
      'a key only A\'s copy carried is gone after "load theirs" (Object.assign merges, it does not replace)',
      cA2.__ghostKeyOnlyAHas);
    const afterLoadTheirs = await A.json('/api/contracts/' + ID);
    t.ok(afterLoadTheirs.value === armed2.value && afterLoadTheirs._v === armed2._v,
      '"Load theirs" wrote nothing to the server', { value: afterLoadTheirs.value, version: afterLoadTheirs._v });

    /* ---------- 9. THE SAME MECHANISM ON A TRACKED CHANGE ----------
       A field is one thing; a filed redline is the product's most expensive
       payload. Same collision, same answer, measured on c.changes. */
    const c3 = await A.json('/api/contracts/' + ID);
    const v3 = c3._v;
    const aStale = JSON.parse(JSON.stringify(c3));           // A's copy, before B files anything
    aStale._v = v3; aStale._loaded = true; aStale._light = false;
    t.ok((aStale.changes || []).length === 0, 'ARMED (9): A\'s copy carries no tracked change', (aStale.changes || []).length);

    const bFiles = JSON.parse(JSON.stringify(c3)); delete bFiles._v;
    bFiles.changes = [{ id: 'CHG-001', seq: 1, clauseId: 'c3', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Unrestricted Legal', round: 1,
      body: 'Payment shall be made within forty-five (45) days of a valid invoice.',
      at: new Date().toISOString() }];
    bFiles.audit = (bFiles.audit || []).concat([{ at: new Date().toISOString(), user: 'Unrestricted Legal',
      action: 'Change filed', detail: 'CHG-001 proposed on clause 3 (payment days)' }]);
    const bRes3 = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bFiles, baseVersion: v3 } });
    const armed3 = await A.json('/api/contracts/' + ID);
    t.ok((armed3.changes || []).length === 1 && armed3.changes[0].id === 'CHG-001',
      `ARMED (9): B's tracked change is on the record at version ${bRes3.version}`,
      (armed3.changes || []).map(x => x.id));

    aStale.value = 55000000;
    const saver3 = makeSaver(A, { keepMine: true, state: { view: 'contract', activeId: ID, contracts: [aStale] } });
    await saver3.saveContract(aStale);
    const after3 = await A.json('/api/contracts/' + ID);
    t.ok((after3.changes || []).length === 1,
      'YARDSTICK — B\'s tracked change survives A\'s "keep mine"', {
        changesNow: (after3.changes || []).map(x => x.id), value: after3.value, version: after3._v });
    const filedLine = (after3.audit || []).some(x => x.action === 'Change filed');
    t.ok(!(filedLine && (after3.changes || []).length === 0),
      'YARDSTICK — no "CHG-001 was filed" in the history with no CHG-001 in the contract',
      { historySaysFiled: filedLine, changesOnRecord: (after3.changes || []).length });
    t.note(`toasts A saw on the redline collision: ${JSON.stringify(saver3.log.toasts.map(x => x.msg))}`);

    /* ---------- 10. IS ANY GUARD WATCHING? THE DESK, TURNED ON ----------
       ourChangesTouched compares OUR changes as a set, so deleting one IS
       touching them. It is behind two switches — the desk rule (off by
       default) and an actual claim — so it covers this only where a workspace
       has turned it on. Measured rather than assumed. */
    await w.admin.json('/api/settings', { method: 'PUT', body: { deskRule: { on: true } } });
    const c4 = await A.json('/api/contracts/' + ID);
    const v4 = c4._v;
    const withDesk = JSON.parse(JSON.stringify(c4)); delete withDesk._v;
    withDesk.desk = { leadId: w.users.unrestricted.id, leadName: 'Unrestricted Legal', contributors: [] };
    withDesk.changes = [{ id: 'CHG-002', seq: 2, clauseId: 'c4', kind: 'modify', status: 'pending',
      authorSide: 'owner', author: 'Unrestricted Legal', round: 1, hash: 'h2',
      body: 'Liability is capped at the sums paid in the preceding six months.', at: new Date().toISOString() }];
    const bRes4 = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: withDesk, baseVersion: v4 } });
    const armed4 = await A.json('/api/contracts/' + ID);
    t.ok(armed4.desk && armed4.desk.leadId === w.users.unrestricted.id && (armed4.changes || []).length === 1,
      `ARMED (10): the desk is claimed by B and carries CHG-002 (version ${bRes4.version})`,
      { lead: armed4.desk && armed4.desk.leadName, changes: (armed4.changes || []).map(x => x.id) });

    const aStale4 = JSON.parse(JSON.stringify(c4));           // A's copy: no desk, no change
    aStale4._v = v4; aStale4._loaded = true; aStale4._light = false;
    aStale4.value = 60000000;
    const saver4 = makeSaver(A, { keepMine: n => n < 3, state: { view: 'contract', activeId: ID, contracts: [aStale4] } });
    await saver4.saveContract(aStale4);
    const after4 = await A.json('/api/contracts/' + ID);
    t.ok((after4.changes || []).length === 1,
      'with the desk rule ON, the server refuses the save that would have deleted B\'s change',
      { changes: (after4.changes || []).map(x => x.id), value: after4.value, version: after4._v });
    t.note(`with the desk on, A was told: ${JSON.stringify(saver4.log.toasts.map(x => x.msg))}`);
    t.note(`dialogs A saw with the desk on: ${saver4.log.dialogs.length}`);

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
