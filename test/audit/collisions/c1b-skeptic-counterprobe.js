/* ============================================================
   SKEPTIC'S COUNTER-PROBE for finding C1b-poll
   ============================================================
   The claim under review: the negotiation workbench's 12s live poll replaces
   the in-memory contract wholesale and silently destroys the unsaved edit that
   core.js's own background-conflict toast has just promised is "kept".

   This file tries to REFUTE it. Five questions, each a possible fixture fault
   or a possible product guard the finding missed:

   R1 · Is the stale in-memory state a PRODUCT state or a probe invention?
        Built here ONLY through the real core.js save path — no hand-set _v,
        no hand-set object identity. The edit is made the way [data-kt] makes
        one (write the field, logAudit, persist) and nothing else.

   R2 · Does the poll REFUSE to run outside the workbench? If the toast's
        literal instruction ("Open it") lands the reader in the contract ROOM
        (state.view==='workspace'), the poll must clear its own interval and
        touch nothing. If it does, the finding's reachability is narrower than
        claimed and that must be said.

   R3 · Is the loss RECOVERABLE — does anything re-queue, retry, or hold the
        edit after the swap? (dirty map, object identity, a later flush.)

   R4 · Is the loss TOLD anywhere? Every toast the real code emits is
        collected; if any of them names the reader's own work, the finding is
        HANDLED_AND_SAID, not a HOLE.

   R5 · Is the SILENCE specific to the workbench? Standing in the room and
        saving again must reach the H-4 DIALOG (told). If it does, the product
        is only silent on the one surface — which is the finding, sharpened.

   Run:  node test/audit/collisions/c1b-skeptic-counterprobe.js
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('../../helpers');
const { makeSaver, harness, ROOT } = require('./savepath');

const ID = 'MK-A2';

function livePollSource() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'views', 'negotiation.js'), 'utf8');
  const a = src.indexOf('const RL_LIVE_MS');
  const b = src.indexOf('/* rlPaintPresence lived here');
  if (a < 0 || b < 0 || b <= a) throw new Error('negotiation.js markers moved');
  return src.slice(a, b);
}

/* A sandbox holding the REAL poll, sharing ONE state object with the caller —
   which is what a browser does. */
function makePoll(client, state) {
  let captured = null;
  const box = {
    console, JSON, Object, Array, Number, String, Boolean, Math, Date, Promise, Error, RegExp,
    setInterval: fn => { captured = fn; return 1; },
    clearInterval: () => { captured = null; },
    API_MODE: () => true,
    toasts: [], renders: 0,
    state,
  };
  box.window = box; box.globalThis = box;
  box.api = async (p, method = 'GET', body) => {
    const r = await client.raw('/api/' + p, { method, body });
    if (r.status >= 400) { const e = new Error((r.json && r.json.error) || 'fail'); e.status = r.status; throw e; }
    return r.json;
  };
  box.toast = m => box.toasts.push(String(m));
  box.renderRedline = () => { box.renders++; };
  box.getContract = id => (box.state.contracts || []).find(x => x && x.id === id) || null;
  vm.createContext(box);
  vm.runInContext(livePollSource(), box, { filename: 'negotiation.js[live-poll]' });
  return { box, arm: c => { box.rlStartLivePoll(c); return captured; }, tick: () => captured && captured() };
}

(async () => {
  const t = harness('C1b SKEPTIC counter-probe');
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-admin');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const B = w.unrestricted;

    /* ---------------------------------------------------------------
       R1 · BUILD THE STALE STATE THROUGH THE PRODUCT, NOTHING BY HAND
       --------------------------------------------------------------- */
    /* A opens MK-A2 the way ensureFull does: fetch the heavy record, mark it
       loaded. _v comes from the SERVER, never invented here. */
    const cA = await A.json('/api/contracts/' + ID);
    const vOpen = cA._v;
    cA._loaded = true; cA._light = false;
    t.ok(typeof vOpen === 'number' && vOpen >= 1,
      `ARMED R1: A holds a heavy record of ${ID} at the server's own version ${vOpen}`, { _v: vOpen });

    /* A is standing somewhere else — the background branch's precondition.
       state.activeId is another contract; the same shape redlineEvict and a
       navigate-away-mid-debounce both produce. */
    const state = { view: 'register', activeId: 'MK-A1', contracts: [cA] };
    const saver = makeSaver(A, { keepMine: true, state });

    /* The edit, exactly as [data-kt] value makes one (js/views/contract.js
       ~5235): write the field, stamp lastAction, append an audit line, persist. */
    const beforeAudit = (cA.audit || []).length;
    cA.value = 64000000;
    cA.lastAction = '15 Aug 2026';
    cA.audit = [...(cA.audit || []), { at: new Date().toISOString(), user: 'Admin', action: 'Edited', detail: 'Updated Contract value' }];
    saver.persist(cA);
    t.ok(saver.dirtyIds().includes(ID), 'ARMED R1: the edit is queued by the real persist()', saver.dirtyIds());

    /* B saves first. */
    const bBody = JSON.parse(JSON.stringify(cA));
    delete bBody._v; delete bBody._loaded; delete bBody._light;
    delete bBody._raisedBy; delete bBody._raisedAt; delete bBody._signedAt; delete bBody._lastAuditAt;
    bBody.value = 36000000; bBody.audit = (await A.json('/api/contracts/' + ID)).audit || [];
    bBody.metadata = { ...(bBody.metadata || {}), note: 'B moved something else' };
    const bRes = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bBody, baseVersion: vOpen } });
    t.ok(bRes.version === vOpen + 1, `ARMED R1: B is ahead, ${vOpen} → ${bRes.version}`, bRes);

    await saver.flushSaves();
    const warn = (saver.log.toasts[0] || {}).msg || '';
    t.ok(saver.log.dialogs.length === 0 && /kept but not yet saved/i.test(warn),
      'ARMED R1: the real code produced the background warning (no dialog)', { warn, dialogs: saver.log.dialogs.length });
    t.ok(cA.value === 64000000 && cA._v === vOpen && cA.audit.length === beforeAudit + 1,
      'ARMED R1: the stale record is a PRODUCT state — edit + audit line in memory, _v untouched by the failed save',
      { value: cA.value, _v: cA._v, auditGrew: cA.audit.length - beforeAudit });
    t.ok(saver.dirtyIds().length === 0, 'ARMED R1: nothing is queued to retry it', saver.dirtyIds());

    /* ---------------------------------------------------------------
       R2 · DOES THE POLL REFUSE TO RUN OUTSIDE THE WORKBENCH?
       The toast says "Open it". The contract ROOM is view 'workspace'.
       --------------------------------------------------------------- */
    const roomState = { view: 'workspace', activeId: ID, contracts: [cA] };
    const pollRoom = makePoll(A, roomState);
    pollRoom.arm({ id: ID });
    await pollRoom.tick();
    t.ok(roomState.contracts[0] === cA && roomState.contracts[0].value === 64000000,
      'REFUTATION R2 HOLDS PARTLY — in the contract ROOM the poll clears itself and the edit is untouched',
      { value: roomState.contracts[0].value, same: roomState.contracts[0] === cA, renders: pollRoom.box.renders });
    t.note('so the finding is reachable only where the reader lands on the NEGOTIATION workbench (view "redline"), not the room.');

    /* ---------------------------------------------------------------
       R3 / R4 · THE WORKBENCH. Same untouched record, same server.
       --------------------------------------------------------------- */
    const benchState = { view: 'redline', activeId: ID, contracts: [cA] };
    const poll = makePoll(A, benchState);
    poll.arm({ id: ID });
    t.ok(benchState.contracts[0].value === 64000000 && benchState.contracts[0]._v === vOpen,
      'ARMED R3: before the tick the bench is drawing from A\'s own record, edit intact, version stale',
      { value: benchState.contracts[0].value, _v: benchState.contracts[0]._v });

    await poll.tick();

    const now = benchState.contracts[0];
    t.ok(now.value === 64000000,
      'R3 — A\'s unsaved edit survives one poll tick', { after: now.value, wanted: 64000000 });
    t.ok(now.audit.length === beforeAudit + 1,
      'R3 — the audit line A\'s own edit wrote survives the tick',
      { after: now.audit.length, wanted: beforeAudit + 1 });
    t.ok(now === cA, 'R3 — the record object is not swapped out from under the screen', { same: now === cA });
    t.ok(saver.dirtyIds().length > 0,
      'R3 — something still holds the edit for a retry', saver.dirtyIds());
    t.note(`poll said: ${JSON.stringify(poll.box.toasts)}`);
    t.ok(poll.box.toasts.some(m => /unsaved|your edit|your change|discard|overwrit|lost|not saved/i.test(m)),
      'R4 — the poll NAMES what happened to A\'s work', poll.box.toasts);
    t.ok(saver.log.toasts.length > 1,
      'R4 — or a second toast from the save path names it', saver.log.toasts.map(x => x.msg));

    /* Is it recoverable at all? A re-save now sends the SWAPPED record. */
    const beforeReSave = await A.json('/api/contracts/' + ID);
    const saver2 = makeSaver(A, { keepMine: true, state: benchState });
    saver2.persist(benchState.contracts[0]);
    await saver2.flushSaves();
    const afterReSave = await A.json('/api/contracts/' + ID);
    t.ok(afterReSave.value === 64000000,
      'R3 — "save again", as the warning instructed, still lands A\'s figure',
      { serverBefore: beforeReSave.value, serverAfter: afterReSave.value, aTyped: 64000000 });
    t.note(`the server holds value=${afterReSave.value} after A obeys the warning on the bench`);

    /* ---------------------------------------------------------------
       R5 · IS THE SILENCE SPECIFIC TO THE WORKBENCH?
       Same collision, reader standing ON the contract — must reach H-4.
       --------------------------------------------------------------- */
    const cB = await A.json('/api/contracts/' + ID);
    const vB = cB._v; cB._loaded = true; cB._light = false;
    const roomState2 = { view: 'workspace', activeId: ID, contracts: [cB] };
    const saver3 = makeSaver(A, { keepMine: false, state: roomState2 });   // A presses "Load theirs"
    cB.value = 71000000;
    const bBody2 = JSON.parse(JSON.stringify(cB));
    delete bBody2._v; delete bBody2._loaded; delete bBody2._light;
    delete bBody2._raisedBy; delete bBody2._raisedAt; delete bBody2._signedAt; delete bBody2._lastAuditAt;
    bBody2.value = 12000000;
    const b2 = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bBody2, baseVersion: vB } });
    t.ok(b2.version === vB + 1, `ARMED R5: B is ahead again at ${b2.version}`, b2);
    saver3.persist(cB); await saver3.flushSaves();
    t.ok(saver3.log.dialogs.length === 1,
      'R5 CONFIRMED — with the reader ON the contract the same collision reaches the H-4 DIALOG (told)',
      saver3.log.dialogs.map(d => d.message));
    t.note(`the dialog said: "${(saver3.log.dialogs[0] || {}).message}"`);
    t.note('=> the product is silent about the lost edit on the NEGOTIATION WORKBENCH only.');

    t.done();
  } catch (e) {
    console.log('FAIL  counter-probe threw: ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
