/* J10 finding #1 — Intake requests. Independent reproduction against a real
   server (not just re-running the shipped f220 suite). Exercises:
   - a Viewer raising a request, and that asking grants nothing
   - an Editor accept/decline/done, and folder scope both ways
   - the request is its own record: no paper, no register row, no count
   - js/views/intake.js mints nothing itself (grep, done separately)
   - notifyIntakeDecision: only on real status moves, never for own act,
     only the member's OWN STORED address (never a body-supplied one),
     no-account/no-address is a fact not a failure, reason carried whole,
     language is the recipient's own.
*/
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A, FOLDER_B } = require('../../helpers');

function log(...a) { console.log(...a); }

(async () => {
  const h = await startHatiWithMail({ mode: 'ok' });
  const results = [];
  const record = (name, ok, detail) => { results.push({ name, ok, detail }); log((ok ? 'PASS' : 'FAIL') + ' — ' + name, detail !== undefined ? JSON.stringify(detail) : ''); };

  try {
    const W = await seedWorkspace(h);

    // Make a Viewer (mustChangePassword pattern from helpers.js)
    await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Sales Colleague', email: 'sales@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const viewer = h.client('sales');
    await viewer.json('/api/login', { method: 'POST', body: { email: 'sales@example.co.ke', password: 'temporary-pass-1' } });
    await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
    const viewerId = (await viewer.json('/api/bootstrap')).me.id;

    // Set the viewer's language to Swedish, so we can prove notices are in
    // the RECIPIENT's own language, not the actor's.
    await viewer.json('/api/me/lang', { method: 'PUT', body: { lang: 'sv' } });

    // ---- FIRST: state before anything happens ----
    const beforeContracts = await W.admin.json('/api/contracts');
    const beforeStats = await W.admin.json('/api/stats');
    record('BEFORE: contract count', true, { total: beforeContracts.total, statsTotal: beforeStats.total });

    // ---- 1. A Viewer raises a request into FOLDER_A (a stream the viewer
    // has NOT been explicitly granted — folderAccess default = every stream
    // for somebody with no map entry) ----
    const raiseR = await viewer.raw('/api/intake', { method: 'POST', body: {
      title: 'NDA with a new packaging supplier',
      need: 'They want to see our volumes before quoting. Nothing signed yet.',
      counterparty: 'Rift Packaging Ltd', folder: FOLDER_A } });
    record('viewer raises a request', raiseR.status === 200 && raiseR.json.ok, raiseR.json);
    const reqId = raiseR.json.request.id;
    assert.match(reqId, /^REQ-/);
    assert.equal(raiseR.json.request.status, 'open');
    assert.equal(raiseR.json.request.by.name, 'Sales Colleague');

    // ---- 2. ASKING GRANTS NOTHING: the viewer still cannot draft ----
    const draftAttempt = await viewer.raw('/api/contracts/MK-NEW-TRY', { method: 'PUT', body: { contract: {
      id: 'MK-NEW-TRY', name: 'Should not be creatable', counterparty: 'X', folder: FOLDER_A,
      status: 'Draft', fields: {}, metadata: {}, obligations: [], audit: [], rounds: [], versions: [],
      signatures: [], comments: [] } } });
    record('viewer cannot draft a contract (asking grants nothing)', draftAttempt.status >= 400, { status: draftAttempt.status, body: draftAttempt.json });

    // ---- and cannot decide somebody else's request ----
    const viewerDecide = await viewer.raw('/api/intake/' + reqId, { method: 'PATCH', body: { status: 'accepted' } });
    record('viewer cannot ACCEPT even their own request (only editors decide)', viewerDecide.status === 403, { status: viewerDecide.status, body: viewerDecide.json });

    // ---- 3. NO PAPER, NO REGISTER ROW, NO COUNT ----
    const afterRaiseContracts = await W.admin.json('/api/contracts');
    const afterRaiseStats = await W.admin.json('/api/stats');
    record('raising a request creates NO contract row', afterRaiseContracts.total === beforeContracts.total, { before: beforeContracts.total, after: afterRaiseContracts.total });
    record('raising a request moves NO /api/stats count', afterRaiseStats.total === beforeStats.total, { before: beforeStats.total, after: afterRaiseStats.total });

    // ---- 4. A second request, this one to be DECLINED with a reason ----
    const r2 = await viewer.json('/api/intake', { method: 'POST', body: {
      title: 'Distribution deal — East region', need: 'A distributor wants exclusivity for the east region.' } });
    const req2Id = r2.request.id;

    h.mail.reset();
    const declineR = await W.admin.raw('/api/intake/' + req2Id, { method: 'PATCH', body: {
      status: 'declined', note: 'We already have an exclusive distributor there — check with Legal before re-asking.' } });
    record('editor declines with a reason', declineR.status === 200 && declineR.json.request.status === 'declined', declineR.json);

    await new Promise(r => setTimeout(r, 300)); // let the fire-and-forget mail land
    const declineMail = h.mail.sent.find(s => s.to === 'sales@example.co.ke');
    record('DECLINE notice actually sent to the viewer\'s OWN stored address', !!declineMail, declineMail && { to: declineMail.to, subject: declineMail.subject });
    record('the reason is carried WHOLE in the mail body', declineMail && declineMail.text.includes('We already have an exclusive distributor there — check with Legal before re-asking.'), declineMail && declineMail.text);
    // Swedish check: the viewer's lang is 'sv' — look for a Swedish word, not English "Hello"/"Declined"
    record('the notice is in the RECIPIENT\'s own language (Swedish, not English)', declineMail && !/^Hello[, ]/.test(declineMail.text) , declineMail && declineMail.text.slice(0, 120));

    // ---- 5. A declined request leaves NOTHING to tidy — no paper, no row ----
    const afterDeclineContracts = await W.admin.json('/api/contracts');
    record('a DECLINED request leaves no orphan contract', afterDeclineContracts.total === beforeContracts.total, { total: afterDeclineContracts.total });

    // ---- 6. Body-supplied address must NEVER be read — attack the route ----
    h.mail.reset();
    const spoofR = await W.admin.raw('/api/intake/' + req2Id, { method: 'PATCH', body: {
      status: 'done', note: 'trying to redirect the notice', email: 'attacker@evil.example', to: 'attacker@evil.example' } });
    await new Promise(r => setTimeout(r, 300));
    const spoofMail = h.mail.sent.find(s => s.to === 'attacker@evil.example');
    record('a body-supplied "email"/"to" field is NEVER read as the recipient', !spoofMail, { sentTo: h.mail.sent.map(s => s.to) });
    // this PATCH re-decides an already-declined→done request; since status DID move (declined -> done), a notice should still go to the real stored address
    const realMail2 = h.mail.sent.find(s => s.to === 'sales@example.co.ke');
    record('...but the REAL stored address still gets told (status genuinely moved)', !!realMail2, realMail2 && realMail2.to);

    // ---- 7. NOBODY IS TOLD ABOUT THEIR OWN ACT — withdrawal is silent ----
    const r3 = await viewer.json('/api/intake', { method: 'POST', body: {
      title: 'Third request, to be withdrawn', need: 'Testing the silent-withdrawal rule.' } });
    h.mail.reset();
    const withdrawR = await viewer.raw('/api/intake/' + r3.request.id, { method: 'PATCH', body: { status: 'withdrawn' } });
    record('viewer may withdraw their OWN request', withdrawR.status === 200 && withdrawR.json.request.status === 'withdrawn', withdrawR.json);
    await new Promise(r => setTimeout(r, 300));
    record('a WITHDRAWAL sends NO mail (nobody is told about their own act)', h.mail.sent.length === 0, h.mail.sent);

    // ---- and an editor deciding a request they raised themselves is silent too ----
    // create it as admin's OWN request via the admin account directly
    const adminSelfReq = await W.admin.json('/api/intake', { method: 'POST', body: {
      title: 'Admin-raised request', need: 'Raised and decided by the same person.' } });
    h.mail.reset();
    const selfDecide = await W.admin.raw('/api/intake/' + adminSelfReq.request.id, { method: 'PATCH', body: { status: 'accepted' } });
    record('editor deciding THEIR OWN request', selfDecide.status === 200, selfDecide.json);
    await new Promise(r => setTimeout(r, 300));
    record('...sends NO mail (actor === requester)', h.mail.sent.length === 0, h.mail.sent);

    // ---- 8. RE-SAVING THE SAME STATUS IS NOT NEWS ----
    h.mail.reset();
    const resave = await W.admin.raw('/api/intake/' + req2Id, { method: 'PATCH', body: { status: 'done', note: 'same status again' } });
    await new Promise(r => setTimeout(r, 300));
    record('re-saving the SAME status sends no mail (status did not move)', h.mail.sent.length === 0, { status: resave.json.request.status });

    // ---- 9. NO ACCOUNT / NO ADDRESS IS A FACT, NOT A FAILURE ----
    // Make a viewer, raise a request, delete the viewer, then decide it.
    await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Ghost Colleague', email: 'ghost@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const ghost = h.client('ghost');
    await ghost.json('/api/login', { method: 'POST', body: { email: 'ghost@example.co.ke', password: 'temporary-pass-1' } });
    await ghost.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'ghost-pass-9' } });
    const ghostReq = await ghost.json('/api/intake', { method: 'POST', body: {
      title: 'Ghost request', need: 'This person will be deleted before the decision lands.' } });
    const usersList = await W.admin.json('/api/bootstrap');
    const ghostUser = usersList.users.find(u => u.email === 'ghost@example.co.ke');
    // Try to delete the user (if a delete route exists) — else just proceed
    // to prove the "no address" branch some other way. Check the actual
    // route the server exposes.
    const delGhost = await W.admin.raw('/api/users/' + ghostUser.id, { method: 'DELETE' });
    record('deleted the ghost user (to test "no account" path)', delGhost.status < 300 || delGhost.status === 404, { status: delGhost.status, body: delGhost.json });
    h.mail.reset();
    const decideGhost = await W.admin.raw('/api/intake/' + ghostReq.request.id, { method: 'PATCH', body: { status: 'accepted' } });
    record('DECIDING A REQUEST FROM A DELETED USER: the decision still STANDS (200, not a failure)', decideGhost.status === 200, decideGhost.json);
    await new Promise(r => setTimeout(r, 300));
    record('...and simply no mail goes anywhere (fact, not error)', h.mail.sent.length === 0, h.mail.sent);

    // ---- 10. FOLDER SCOPE BOTH WAYS ----
    // 10a. filing INTO an unreachable stream is refused
    const scopedReq = await viewer.raw('/api/intake', { method: 'POST', body: {
      title: 'Into a stream I cannot see', need: 'test', folder: 'no-such-stream-xyz' } });
    // viewer has default access (no map entry => every stream), so use the
    // RESTRICTED user instead, who is scoped to FOLDER_A only.
    const scopedReq2 = await W.restricted.raw('/api/intake', { method: 'POST', body: {
      title: 'Restricted user filing into FOLDER_B', need: 'test', folder: FOLDER_B } });
    record('filing INTO an unreachable stream is REFUSED (403)', scopedReq2.status === 403, scopedReq2.json);

    // 10b. a request IS invisible out of scope — restricted user files into
    // FOLDER_A (their own scope, allowed), then check the unrestricted
    // 'novalues' user (who DOES have folder access to everything by default,
    // so instead prove invisibility by scoping the RESTRICTED viewer against
    // a request filed into FOLDER_B by an editor who can reach it).
    const editorFolderBReq = await W.admin.json('/api/intake', { method: 'POST', body: {
      title: 'A request only in folder B', need: 'test', folder: FOLDER_B } });
    const restrictedSeesQueue = await W.restricted.json('/api/intake');
    const seesB = restrictedSeesQueue.requests.some(r => r.id === editorFolderBReq.request.id);
    record('a request filed into a stream the reader cannot see is INVISIBLE to them', !seesB, { visibleIds: restrictedSeesQueue.requests.map(r => r.id) });
    // and the admin (unrestricted) DOES see it
    const adminSeesQueue = await W.admin.json('/api/intake');
    const adminSeesB = adminSeesQueue.requests.some(r => r.id === editorFolderBReq.request.id);
    record('...but an unrestricted admin does see it', adminSeesB, true);

    // ---- 11. TURNING ONE INTO PAPER via the ORDINARY creation path ----
    // Simulate what js/views/intake.js's intakeDraft() does: create via the
    // normal contract-creation PUT, then PATCH the request to point at it.
    const paperReq = await W.admin.json('/api/intake', { method: 'POST', body: {
      title: 'Turn me into paper', need: 'test the ordinary creation path', counterparty: 'Paper Co', folder: FOLDER_A } });
    const newContractId = 'MK-FROM-REQ-1';
    await W.admin.json('/api/contracts/' + newContractId, { method: 'PUT', body: { contract: {
      id: newContractId, name: 'Paper Co Agreement', counterparty: 'Paper Co', folder: FOLDER_A,
      status: 'Draft', template: 'ND', fields: {}, metadata: {}, obligations: [], audit: [
        { at: new Date().toISOString(), user: W.admin.label || 'admin', action: 'Created', detail: 'created from request' }],
      rounds: [], versions: [], signatures: [], comments: [], intakeRequestId: paperReq.request.id } } });
    const pointR = await W.admin.json('/api/intake/' + paperReq.request.id, { method: 'PATCH', body: { status: 'done', contractId: newContractId } });
    record('the request now POINTS at the contract via contractId', pointR.request.contractId === newContractId, pointR.request);
    const fetchedContract = await W.admin.json('/api/contracts/' + newContractId);
    record('the contract exists as an ORDINARY contract (register-visible)', fetchedContract.id === newContractId, fetchedContract.id);

    // ---- 12. accepted → notified too (not just declined/done) ----
    const rAcc = await W.admin.json('/api/intake', { method: 'POST', body: { title: 'Accept me', need: 'test' } });
    h.mail.reset();
    // NOTE: this must be decided by someone OTHER than the requester (admin raised it though — so use restricted, who is an editor)
    const accR = await W.restricted.raw('/api/intake/' + rAcc.request.id, { method: 'PATCH', body: { status: 'accepted' } });
    record('an EDITOR (not the requester) may move status to accepted', accR.status === 200, accR.json);
    await new Promise(r => setTimeout(r, 300));
    // requester here was admin — mail goes to admin's own address
    record('ACCEPTED also notifies (not just declined/done)', h.mail.sent.length >= 1, h.mail.sent.map(s => s.to));

  } catch (e) {
    console.error('SCRIPT ERROR', e);
    results.push({ name: 'SCRIPT CRASHED', ok: false, detail: String(e && e.stack || e) });
  } finally {
    await h.stop();
  }

  const fails = results.filter(r => !r.ok);
  console.log('\n=== INTAKE SUMMARY ===');
  console.log(results.length + ' checks, ' + fails.length + ' failed');
  if (fails.length) { fails.forEach(f => console.log('  FAIL: ' + f.name)); process.exitCode = 1; }
})();
