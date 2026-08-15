/* ============================================================
   C1b — DOES EVERY WRITER REACH A PERSON, AND WHAT EATS THE ONES THAT DON'T
   ============================================================
   Three sections.

   S1 · THE CENSUS. How many doors write a contract to the server, and what
        decides whether a refusal becomes a dialog or a toast. Asserted against
        the real sources, not described.

   S2 · THE AWAY-FROM-THE-CONTRACT BRANCH, on a real server. A background flush
        that collides gets a toast instead of the dialog — the rulebook's own
        decision, and correct. What is measured here is what happens to the
        edit afterwards: whether anything is left holding it, and whether the
        next attempt can ever succeed on its own.

   S3 · THE LIVE POLL. js/views/negotiation.js's rlStartLivePoll replaces the
        in-memory contract WHOLESALE (`state.contracts[i] = fresh`) whenever the
        server's version has moved. It is the real function, sliced verbatim and
        run with a captured setInterval so one tick can be fired by hand. The
        question is what it does to an edit that has not been saved yet — the
        exact state the H-4 toast branch promises to keep.

   Run:  node test/audit/collisions/c1b-write-doors-and-the-poll.js
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('../../helpers');
const { makeSaver, coreSaveSource, harness, ROOT } = require('./savepath');

const ID = 'MK-A2';

/* the real live poll, sliced out of js/views/negotiation.js */
function livePollSource() {
  const src = fs.readFileSync(path.join(ROOT, 'js', 'views', 'negotiation.js'), 'utf8');
  const a = src.indexOf('const RL_LIVE_MS');
  const b = src.indexOf('/* rlPaintPresence lived here');
  if (a < 0 || b < 0 || b <= a) throw new Error('js/views/negotiation.js markers moved');
  return src.slice(a, b);
}

(async () => {
  const t = harness('C1b write doors and the live poll');
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-admin');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const B = w.unrestricted;

    /* ================= S1 · THE CENSUS ================= */
    const jsFiles = [];
    (function walk(dir) {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name);
        if (f.isDirectory()) walk(p); else if (/\.js$/.test(f.name)) jsFiles.push(p);
      }
    })(path.join(ROOT, 'js'));

    const putDoors = [];
    for (const f of jsFiles) {
      const src = fs.readFileSync(f, 'utf8');
      const re = /api\(\s*'contracts\/'\s*\+\s*[^,]+,\s*'PUT'/g;
      let m; while ((m = re.exec(src))) putDoors.push(path.relative(ROOT, f) + ':' + src.slice(0, m.index).split('\n').length);
    }
    t.ok(putDoors.length === 1, 'exactly ONE door writes a contract to the server', putDoors);
    t.note(`the door is ${putDoors[0]} (saveContract)`);

    const core = coreSaveSource();
    t.ok(/state\.activeId\s*===\s*c\.id/.test(core),
      'the H-4 dialog is gated on the contract being the OPEN one; everything else gets a toast');
    t.ok(/const items=\[\.\.\.dirty\.values\(\)\];\s*dirty\.clear\(\);/.test(core),
      'flushSaves empties the queue BEFORE it awaits any save — a failed save is not re-queued');
    t.ok(/saveTimer=setTimeout\(flushSaves,\s*400\)/.test(core),
      'persist schedules the flush on a timer and nobody awaits the promise (fire-and-forget by construction)');

    let persistCalls = 0, awaited = 0;
    for (const f of jsFiles) {
      const src = fs.readFileSync(f, 'utf8');
      persistCalls += (src.match(/[^a-zA-Z_.]persist\(/g) || []).length;
      awaited += (src.match(/await\s+persist\(/g) || []).length;
    }
    t.note(`persist() is called ${persistCalls} times across js/; ${awaited} of those are awaited.`);
    t.ok(awaited === 0, 'no caller of persist() awaits it — every write is fire-and-forget', awaited);

    /* ================= S2 · THE AWAY-FROM-THE-CONTRACT BRANCH ================= */
    const a0 = await A.json('/api/contracts/' + ID);
    const v0 = a0._v;
    const bSave = JSON.parse(JSON.stringify(a0)); delete bSave._v;
    bSave.counterparty = 'Nandi Dairy Co-operative PLC';
    const bRes = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave, baseVersion: v0 } });
    t.ok(bRes.version === v0 + 1, `ARMED: B moved ${ID} to version ${bRes.version}`, bRes);

    const cA = JSON.parse(JSON.stringify(a0));
    cA._v = v0; cA._loaded = true; cA._light = false;
    cA.value = 51000000;
    const saver = makeSaver(A, { keepMine: true,
      /* the reader is standing on a DIFFERENT contract — a background flush */
      state: { view: 'contract', activeId: 'MK-A1', contracts: [cA] } });

    saver.persist(cA);
    t.ok(saver.dirtyIds().includes(ID), `ARMED: ${ID} is queued for the flush`, saver.dirtyIds());
    await saver.flushSaves();

    t.ok(saver.log.dialogs.length === 0, 'no modal is thrown over unrelated work (rulebook: correct)', saver.log.dialogs.length);
    t.ok(saver.log.toasts.length === 1, 'A is warned exactly once', saver.log.toasts.map(x => x.msg));
    t.note(`the warning: "${(saver.log.toasts[0] || {}).msg}"`);
    t.ok(/kept but not yet saved/i.test((saver.log.toasts[0] || {}).msg || ''),
      'the warning promises the edit is KEPT', (saver.log.toasts[0] || {}).msg);

    t.ok(saver.dirtyIds().length === 0,
      'YARDSTICK — after the refusal nothing is queued to retry the edit', saver.dirtyIds());
    t.ok(cA.value === 51000000 && cA._v === v0,
      'the edit survives in memory, still on the stale version', { value: cA.value, _v: cA._v });

    const again = makeSaver(A, { keepMine: true, state: { view: 'contract', activeId: 'MK-A1', contracts: [cA] } });
    again.persist(cA); await again.flushSaves();
    t.ok(again.log.toasts.length === 1 && /kept but not yet saved/i.test(again.log.toasts[0].msg),
      'every later background save collides identically — the edit can never land on its own',
      again.log.toasts.map(x => x.msg));
    const still = await A.json('/api/contracts/' + ID);
    t.ok(still.value !== 51000000, 'and the server never receives it', still.value);

    /* ================= S3 · THE LIVE POLL EATS AN UNSAVED EDIT ================= */
    /* Stage: A is standing on the negotiation workbench for this contract with
       an edit that has not been saved (inside the 400ms debounce, or held by
       the S2 branch above). B saves. The poll ticks. */
    let captured = null;
    const pollBox = {
      console, JSON, Object, Array, Number, String, Boolean, Math, Date, Promise, Error, RegExp,
      setInterval: (fn) => { captured = fn; return 1; },
      clearInterval: () => { captured = null; },
      RL_LIVE_POLL: true,
      API_MODE: () => true,
      toasts: [],
      renders: 0,
    };
    pollBox.window = pollBox; pollBox.globalThis = pollBox;
    pollBox.api = async (pathname, method = 'GET', body) => {
      const r = await A.raw('/api/' + pathname, { method, body });
      if (r.status >= 400) { const e = new Error((r.json && r.json.error) || 'fail'); e.status = r.status; throw e; }
      return r.json;
    };
    pollBox.toast = (m) => pollBox.toasts.push(String(m));
    pollBox.renderRedline = () => { pollBox.renders++; };
    pollBox.getContract = id => (pollBox.state.contracts || []).find(x => x && x.id === id) || null;

    const cA2 = await A.json('/api/contracts/' + ID);
    const v2 = cA2._v;
    cA2._loaded = true; cA2._light = false;
    cA2.value = 77000000;                                   // A's UNSAVED edit
    cA2.__aWasTyping = 'a clause A is mid-way through';
    pollBox.state = { view: 'redline', activeId: ID, contracts: [cA2] };
    vm.createContext(pollBox);
    vm.runInContext(livePollSource(), pollBox, { filename: 'js/views/negotiation.js[live-poll-slice]' });

    pollBox.rlStartLivePoll({ id: ID });
    t.ok(typeof captured === 'function', 'ARMED: the real poll armed its interval', typeof captured);

    const bSave2 = JSON.parse(JSON.stringify(cA2));
    delete bSave2._v; delete bSave2._loaded; delete bSave2._light; delete bSave2.__aWasTyping;
    bSave2.value = cA2.value;   // keep A's figure OUT of it — B is editing something else
    bSave2.value = 36000000;
    bSave2.metadata = { ...(bSave2.metadata || {}), note: 'B moved something else' };
    const b2 = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave2, baseVersion: v2 } });
    t.ok(b2.version === v2 + 1, `ARMED: B moved the record again, ${v2} → ${b2.version}`, b2);
    t.ok(pollBox.state.contracts[0].value === 77000000,
      'ARMED: A\'s unsaved edit is still the one in memory before the tick', pollBox.state.contracts[0].value);

    await captured();          // one poll tick, the real function body

    const held = pollBox.state.contracts[0];
    t.ok(pollBox.renders === 1, 'the poll repainted the workbench', pollBox.renders);
    t.note(`the poll said: ${JSON.stringify(pollBox.toasts)}`);
    t.ok(held.value === 77000000,
      'YARDSTICK — A\'s unsaved edit survives the live poll', { inMemoryNow: held.value, aHadTyped: 77000000 });
    t.ok(held.__aWasTyping !== undefined,
      'YARDSTICK — A\'s in-flight work is still on the record the screen is drawing from', held.__aWasTyping);
    t.ok(pollBox.toasts.some(m => /unsaved|your (change|edit)|discard|lost/i.test(m)),
      'YARDSTICK — if it does discard the edit, the toast says so', pollBox.toasts);
    t.ok(held === cA2,
      'the object A\'s editor holds is still the object on state.contracts (no silent swap)',
      { same: held === cA2 });

    /* ================= S4 · THE POLL TICKS WHILE THE H-4 DIALOG IS OPEN =================
       Nothing exotic: reading a conflict dialog takes longer than twelve
       seconds often enough. The dialog and the poll share ONE state object here
       because they share one in a browser. */
    const cS = await A.json('/api/contracts/' + ID);
    const v3 = cS._v;
    cS._loaded = true; cS._light = false;
    cS.value = 88000000;                                    // A's edit, about to be saved
    const shared = { view: 'redline', activeId: ID, contracts: [cS] };
    pollBox.state = shared;

    const bSave3 = JSON.parse(JSON.stringify(cS));
    delete bSave3._v; delete bSave3._loaded; delete bSave3._light;
    bSave3.value = 36000000;
    bSave3.counterparty = 'Nandi Dairy Holdings Ltd';
    const b3 = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave3, baseVersion: v3 } });
    t.ok(b3.version === v3 + 1, `ARMED (S4): B is ahead again at version ${b3.version}`, b3);

    let release = null;
    const deferred = new Promise(r => { release = r; });
    const saver4 = makeSaver(A, { keepMine: () => deferred, state: shared });
    const saving = saver4.saveContract(cS);                  // NOT awaited: the dialog is up
    for (let i = 0; i < 50 && saver4.log.dialogs.length === 0; i++) await new Promise(r => setTimeout(r, 20));
    t.ok(saver4.log.dialogs.length === 1, 'ARMED (S4): the H-4 dialog is open and waiting on A', saver4.log.dialogs.length);

    pollBox.rlStartLivePoll({ id: ID });
    await captured();                                        // one tick while A reads the dialog
    t.ok(shared.contracts[0] !== cS, 'ARMED (S4): the poll swapped the record under the open dialog',
      { swapped: shared.contracts[0] !== cS, onScreenValue: shared.contracts[0].value });

    release(true);                                           // A presses "Keep mine & save"
    await saving;

    const server4 = await A.json('/api/contracts/' + ID);
    const screen4 = shared.contracts[0];
    t.note(`server now: value=${server4.value} counterparty="${server4.counterparty}" version=${server4._v}`);
    t.note(`screen now: value=${screen4.value} counterparty="${screen4.counterparty}" version=${screen4._v}`);
    t.ok(server4.value === screen4.value && server4.counterparty === screen4.counterparty,
      'YARDSTICK — after "Keep mine & save" the screen shows what the server holds',
      { server: { value: server4.value, counterparty: server4.counterparty },
        screen: { value: screen4.value, counterparty: screen4.counterparty } });
    t.ok(saver4.log.toasts.length > 0 || false,
      'YARDSTICK — A is told that the copy under the dialog had already moved on',
      saver4.log.toasts.map(x => x.msg));

    /* Does the screen catch up by itself? Measured rather than assumed — it
       decides whether the divergence above is permanent or twelve seconds. */
    await captured();
    const screen5 = shared.contracts[0];
    t.ok(screen5.value === server4.value,
      'the NEXT poll tick converges the screen back onto the server copy (the divergence is transient)',
      { screen: screen5.value, server: server4.value });
    t.note(`after a second tick the screen reads value=${screen5.value} counterparty="${screen5.counterparty}" version=${screen5._v}`);

    /* ================= S5 · THE TWO HALVES CHAINED, WHICH IS THE REACHABLE ROUTE =================
       S2 ends with "your edit is kept but not yet saved. Open it and save
       again." A does exactly that — opens the contract's negotiation, which is
       where redlining is done — and the poll is what greets them. */
    const c5 = await A.json('/api/contracts/' + ID);
    const v5 = c5._v;
    c5._loaded = true; c5._light = false;
    const state5 = { view: 'contract', activeId: 'MK-A1', contracts: [c5] };
    const saver5 = makeSaver(A, { keepMine: true, state: state5 });
    c5.value = 64000000;                                     // A's edit
    const bSave5 = JSON.parse(JSON.stringify(c5));
    delete bSave5._v; delete bSave5._loaded; delete bSave5._light;
    bSave5.value = 36000000; bSave5.metadata = { ...(bSave5.metadata || {}), note: 'B again' };
    const b5 = await B.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: bSave5, baseVersion: v5 } });
    t.ok(b5.version === v5 + 1, `ARMED (S5): B is ahead at version ${b5.version}`, b5);

    saver5.persist(c5); await saver5.flushSaves();
    t.ok(/kept but not yet saved/i.test((saver5.log.toasts[0] || {}).msg || ''),
      'ARMED (S5): A got the "your edit is kept" warning', (saver5.log.toasts[0] || {}).msg);
    t.ok(state5.contracts[0].value === 64000000, 'ARMED (S5): the edit really is still in memory', state5.contracts[0].value);

    state5.view = 'redline'; state5.activeId = ID;            // A does what the warning told them to
    pollBox.state = state5;
    pollBox.toasts.length = 0;
    pollBox.rlStartLivePoll({ id: ID });
    await captured();

    t.ok(state5.contracts[0].value === 64000000,
      'YARDSTICK — the edit the warning promised was KEPT is still there after A opens the contract',
      { promised: 64000000, actual: state5.contracts[0].value, pollSaid: pollBox.toasts });

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
