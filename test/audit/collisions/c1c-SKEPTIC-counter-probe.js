/* ============================================================
   C1c — SKEPTIC COUNTER-PROBE
   ============================================================
   The finding claims: a permanent "this contract is executed" refusal is
   misread by js/core.js as a transient version clash, because the frozen-field
   list in the server's own sentence contains the word `sealVersion`. The reader
   is offered "Keep mine & save" over and over and never hears the real reason.

   A finding of this shape has three ways to be the HARNESS'S fault, and this
   file tries all three before it agrees with anything:

   1. THE LOOP MIGHT BE THE SAVER'S, NOT THE PRODUCT'S. If the vm-sliced save
      path re-offered the dialog on ANY refusal, the "loop" would be an artifact.
      So this probe runs the CONTROL FIRST, on a contract that is NOT executed:
      an ordinary stale save, keep-mine, and the save must land after exactly ONE
      dialog. If the control loops, the finding is void.
   2. THE MESSAGE MIGHT NOT BE WHAT THE REAL BROWSER SEES. js/api.js sets
      err.message = data.error — the server's own sentence — so this probe reads
      the sentence off a RAW http response and re-tests it, independent of the
      saver.
   3. THE ARMED STATE MIGHT BE FAKE. The executed record is read back off the
      server field by field, and the diff the guard names is checked against
      what js/views/contract.js's signDocument actually writes (sealVersion=2).

   Two further questions the finding did not settle, asked here:
   · does it need an exotic edit? — the edit here is a NOTE on the metadata,
     the smallest realistic Key-terms keystroke, not a value change.
   · did the browser HAVE the information to get it right? — e.status and
     e.data.immutable are asserted present on the thrown Error.

   Run:  node test/audit/collisions/c1c-SKEPTIC-counter-probe.js
*/
const { startHati, seedWorkspace } = require('../../helpers');
const { makeSaver, harness } = require('./savepath');

/* MK-A1 is seeded 'Signed' and is therefore already an executed row — the
   control has to be one that is NOT, or the control tests the same thing as the
   experiment. MK-B2 is seeded 'Under Review'. (Caught by this file failing on
   its first run with "MK-A1 is executed — metadata cannot be changed": the
   exact shape of fixture fault this sweep is told to guard against.) */
const CTRL = 'MK-B2';   // control — not executed
const EXEC = 'MK-A2';   // the collision — B executes it

(async () => {
  const t = harness('C1c SKEPTIC — is the loop the product or the harness?');
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const A = h.client('A-admin');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    const B = w.unrestricted;

    /* ============ CONTROL — an ORDINARY conflict, same saver ============ */
    const c0 = await A.json('/api/contracts/' + CTRL);
    const aCtrl = JSON.parse(JSON.stringify(c0)); aCtrl._loaded = true; aCtrl._light = false;

    const bCtrl = JSON.parse(JSON.stringify(c0)); delete bCtrl._v;
    bCtrl.metadata = { ...(bCtrl.metadata || {}), bNote: 'B was here' };
    const bR = await B.json('/api/contracts/' + CTRL, { method: 'PUT', body: { contract: bCtrl, baseVersion: c0._v } });
    t.ok(bR.version === c0._v + 1, `ARMED (control): B moved ${CTRL} ${c0._v} → ${bR.version}`, bR);
    t.ok((await A.json('/api/contracts/' + CTRL)).status !== 'Signed',
      'ARMED (control): the control contract is NOT executed', (await A.json('/api/contracts/' + CTRL)).status);

    const ctrlSaver = makeSaver(A, { keepMine: () => true, state: { view: 'contract', activeId: CTRL, contracts: [aCtrl] } });
    aCtrl.metadata = { ...(aCtrl.metadata || {}), aNote: 'A was here' };
    await ctrlSaver.saveContract(aCtrl);
    t.ok(ctrlSaver.log.dialogs.length === 1,
      'CONTROL — an ordinary conflict asks the overwrite question exactly ONCE (so the saver does not loop by itself)',
      ctrlSaver.log.dialogs.length);
    const ctrlAfter = await A.json('/api/contracts/' + CTRL);
    t.ok(ctrlAfter.metadata && ctrlAfter.metadata.aNote === 'A was here',
      'CONTROL — and "Keep mine & save" actually lands on the server', ctrlAfter.metadata);
    t.note('the control proves the saver, the dialog and the rebase all work — anything that loops after this is the product');

    /* ============ ARM — B executes MK-A2 exactly as signDocument does ============ */
    const c1 = await A.json('/api/contracts/' + EXEC);
    const v1 = c1._v;
    const aHolds = JSON.parse(JSON.stringify(c1));   // A's open copy, pre-signature
    aHolds._v = v1; aHolds._loaded = true; aHolds._light = false;
    t.ok(aHolds.status !== 'Signed' && !aHolds.hash && aHolds.sealVersion == null,
      `ARMED: A holds a PRE-SIGNATURE copy of ${EXEC} at version ${v1}`,
      { status: aHolds.status, hash: aHolds.hash || null, sealVersion: aHolds.sealVersion ?? null });

    const at = new Date().toISOString();
    const sign = JSON.parse(JSON.stringify(c1)); delete sign._v;
    sign.status = 'Signed';
    sign.signatures = [{ party: 'first', name: 'Unrestricted Legal', email: 'everything@example.co.ke',
      title: 'Director', at, method: 'session-authenticated' }];
    sign.execution = { at, method: 'session-authenticated', consent: true, firstParty: 'HaTi' };
    sign.sealVersion = 2;                       // js/views/contract.js:5988
    sign.hash = 'b'.repeat(64);                 // js/views/contract.js:5989
    sign.signedAt = '15 Aug 2026 09:00 EAT';    // js/views/contract.js:5973
    const signR = await B.json('/api/contracts/' + EXEC, { method: 'PUT', body: { contract: sign, baseVersion: v1 } });
    const stored = await A.json('/api/contracts/' + EXEC);
    t.ok(stored.status === 'Signed' && stored.sealVersion === 2 && stored.hash === 'b'.repeat(64)
      && (stored.signatures || []).length === 1 && stored._v === signR.version,
      `ARMED: ${EXEC} is executed on the server at version ${signR.version}`,
      { status: stored.status, sealVersion: stored.sealVersion, sigs: (stored.signatures || []).length, v: stored._v });
    /* the seal fields are the ones signDocument writes — checked against source
       so the fixture cannot drift away from what the product does */
    const cvSrc = require('fs').readFileSync(require('path').join(__dirname, '..', '..', '..', 'js', 'views', 'contract.js'), 'utf8');
    t.ok(/c\.sealVersion\s*=\s*2/.test(cvSrc),
      'ARMED: signDocument really writes sealVersion (so this diff is the real one, not the fixture\'s invention)',
      (cvSrc.match(/c\.sealVersion\s*=\s*2[^\n]*/) || [])[0]);

    /* ============ THE SENTENCE, read off a RAW response ============ */
    const rebased = JSON.parse(JSON.stringify(aHolds)); delete rebased._v;
    rebased.metadata = { ...(rebased.metadata || {}), aNote: 'A typed a note on Key terms' };
    const raw = await A.raw('/api/contracts/' + EXEC, { method: 'PUT', body: { contract: rebased, baseVersion: stored._v } });
    t.ok(raw.status === 409, `the executed refusal is a 409 (got ${raw.status})`, raw.status);
    const sentence = String((raw.json && raw.json.error) || '');
    t.note(`sentence: ${sentence}`);
    t.note(`immutable: ${JSON.stringify(raw.json && raw.json.immutable)}`);
    t.ok(Array.isArray(raw.json && raw.json.immutable) && raw.json.immutable.includes('sealVersion'),
      'the frozen-field list names sealVersion — so the sentence carries the word "Version"',
      raw.json && raw.json.immutable);
    t.ok(/conflict|version/i.test(sentence),
      'MISREAD CONFIRMED off a raw response: js/core.js\'s /conflict|version/i matches the EXECUTED sentence',
      { matched: (sentence.match(/conflict|version/i) || [])[0] });
    /* and the smallest possible realistic edit still trips it */
    t.ok(raw.json.immutable.includes('status') && raw.json.immutable.includes('hash'),
      'a NOTE was the only edit — the list is A\'s missing signature, not A\'s typing',
      raw.json.immutable);

    /* the structured answer the browser ignores IS on the Error js/api.js builds */
    let caught = null;
    try {
      await makeSaver(A, { state: { view: 'x', activeId: null, contracts: [] } })
        .sandbox.api('contracts/' + EXEC, 'PUT', { contract: rebased, baseVersion: stored._v });
    } catch (e) { caught = e; }
    t.ok(caught && caught.status === 409 && caught.data && Array.isArray(caught.data.immutable),
      'the browser HAD the right answer on the Error all along (status 409 + data.immutable) and reads the prose instead',
      caught && { status: caught.status, immutable: caught.data && caught.data.immutable });

    /* ============ THE LOOP, on the real save path ============ */
    const saver = makeSaver(A, {
      keepMine: n => n < 4,                    // three presses of "Keep mine", then give up
      state: { view: 'contract', activeId: EXEC, contracts: [aHolds] },
    });
    aHolds.metadata = { ...(aHolds.metadata || {}), aNote: 'A typed a note on Key terms' };
    await saver.saveContract(aHolds);
    t.note(`dialogs: ${saver.log.dialogs.length}`);
    t.note(`toasts: ${JSON.stringify(saver.log.toasts.map(x => x.msg))}`);
    t.note(`dialog text (all identical? ${new Set(saver.log.dialogs.map(d => d.message)).size === 1}): ${saver.log.dialogs[0] && saver.log.dialogs[0].message}`);
    t.ok(saver.log.dialogs.length === 4 && ctrlSaver.log.dialogs.length === 1,
      'THE LOOP IS THE PRODUCT\'S: 1 dialog on an ordinary conflict, one PER PRESS on the executed one',
      { control: ctrlSaver.log.dialogs.length, executed: saver.log.dialogs.length });
    t.ok(saver.log.dialogs.every(d => /Keep mine/.test(d.confirmLabel)),
      'every one of them offers "Keep mine & save" — an overwrite the server will never perform',
      saver.log.dialogs.map(d => d.confirmLabel));
    const heardIt = saver.log.toasts.some(x => /executed|amendment/i.test(x.msg));
    t.ok(!heardIt,
      'YARDSTICK (failing) — "is executed … Record an amendment instead" never reaches the reader',
      saver.log.toasts.map(x => x.msg));

    /* ============ WHAT THE READER DOES END UP WITH ============ */
    const final = await A.json('/api/contracts/' + EXEC);
    t.ok(final.status === 'Signed' && final.sealVersion === 2 && !(final.metadata || {}).aNote,
      'NOT A HOLE — the executed record is untouched and nothing was forged',
      { status: final.status, v: final._v, aNote: (final.metadata || {}).aNote ?? null });
    t.ok(aHolds.status === 'Signed' && saver.log.renders >= 1,
      'and "Load theirs" does converge: A\'s copy becomes the signed one and the screen repaints',
      { status: aHolds.status, renders: saver.log.renders });
    t.note('so the reader DOES eventually see a Signed contract — but is never told that is why the save was refused, and pressed a dead button ' + (saver.log.dialogs.length - 1) + ' times first');

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + (e && e.stack || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
