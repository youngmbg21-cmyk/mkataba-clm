/* ============================================================
   C10 — THE FOLDER MOVE RACES WHAT READS THE FOLDER
   ============================================================
   Three blocks, every one two ALLOWED acts landing on one contract:

     BLOCK 1 — an admin re-files a contract into a stream a colleague cannot
               see, while that colleague has it open and mid-edit. What does
               their next save do, and are they told?
     BLOCK 2 — the move races an approval chain mid-walk. Rules are matched per
               read, so a move changes which steps exist. Does a recorded "yes"
               survive it?
     BLOCK 3 — the move races a share mint, and it lands on a link that is
               already live.

   WHAT IS REAL HERE: a real HaTi server (helpers.js), and the product's own
   code for everything under test — js/core.js's REAL save path (persist /
   flushSaves / saveContract and its H-4 conflict branch, sliced verbatim by
   savepath.js) and js/approvals.js ITSELF (approvalRules / ruleMatches /
   buildApprovalChain / approvalState / approveContract). toast and
   confirmDialog are RECORDERS.

   Run:  node test/audit/collisions/c10-folder-move-races.js
*/
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('../../helpers');
const { harness, makeSaver } = require('./savepath');

const ROOT = path.join(__dirname, '..', '..', '..');
const H = harness('C10 — the folder move races what reads the folder');
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- the approvals module on a real server ---------- */
function approvalsStage(client, boot) {
  const log = { toasts: [], audits: [], saves: [] };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; }, clearTimeout() {},
    esc: s => String(s == null ? '' : s), esc1: s => String(s == null ? '' : s),
    i18tn: (k) => k,
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    fmtMoneyShort: n => 'KES ' + String(n),
    nowISO: () => new Date().toISOString(),
    currentUser: () => sb.REMOTE.me,
    getUsers: () => sb.REMOTE.users,
    canEdit: () => true, isAdmin: () => sb.REMOTE.me.role === 'admin',
    ROLE_LABEL: { admin: 'Admin', legal: 'Editor', viewer: 'Viewer' },
    cKind: c => (c && c.kind) || '',
    contractOwnerName: c => (c && c.owner && c.owner.name) || null,
    deviationSummary: () => null,
    logAudit: (c, action, detail) => {
      (c.audit = c.audit || []).push({ at: new Date().toISOString(), user: sb.REMOTE.me.name, action, detail });
      log.audits.push({ action, detail });
    },
    renderSignButton() {}, renderAuditSection() {}, renderWorkspace() {},
    persist: (c) => { sb._pending = sb._pending.then(() => putContract(client, c, log)); },
    _pending: Promise.resolve(),
    async saveSettings() {
      const { folderAccess, signFolders, ...rest } = (sb.state.settings || {});
      await client.json('/api/settings', { method: 'PUT', body: rest });
    },
    state: { contracts: [], settings: JSON.parse(JSON.stringify(boot.settings || {})), view: 'contract' },
    REMOTE: { me: boot.me, users: boot.users.slice() },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of ['js/i18n.js', 'js/jurisdiction.js', 'js/approvals.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return { sb, log, settled: () => sb._pending };
}

async function putContract(client, c, log) {
  const payload = { ...c }; const bv = payload._v || 0;
  delete payload._v; delete payload._light; delete payload._loaded;
  const r = await client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: payload, baseVersion: bv } });
  log.saves.push({ id: c.id, status: r.status, body: r.text.slice(0, 120) });
  if (r.status === 200 && r.json) c._v = r.json.version;
  return r;
}

(async () => {
  const h = await startHati();
  try {
    const w = await seedWorkspace(h);
    const admin = w.admin, restricted = w.restricted;
    const boot = await admin.json('/api/bootstrap');

    /* ============================================================
       BLOCK 1 — A COLLEAGUE MID-EDIT, RE-FILED OUT FROM UNDER THEM
       ============================================================ */
    console.log('\n--- BLOCK 1 — the open contract, mid-edit ---');

    // ---- ARM ----
    const meR = await restricted.json('/api/me').catch(() => null);
    const scope = (await restricted.json('/api/bootstrap')).me.folderAccess;
    H.ok(Array.isArray(scope) && scope.length === 1 && scope[0] === FOLDER_A,
      'ARMED: the colleague can see exactly one value stream', scope);
    const held = await restricted.json('/api/contracts/MK-A2');
    H.ok(held && held.folder === FOLDER_A && held.id === 'MK-A2',
      'ARMED: they hold MK-A2, filed under the stream they can see',
      { id: held.id, folder: held.folder, _v: held._v });
    H.note(`colleague holds MK-A2 at version ${held._v}, folder="${held.folder}"`);

    // prove the door WORKED a second earlier, through the real save path
    const rig = makeSaver(restricted, { keepMine: true, state: { view: 'contract', activeId: 'MK-A2', contracts: [held] } });
    held.comments = [{ at: new Date().toISOString(), by: 'Restricted Legal', text: 'first note' }];
    await rig.saveContract(held);
    H.ok(rig.log.toasts.length === 0 && held._v > 0,
      'ARMED: the same save path succeeds for them a moment before the move',
      { toasts: rig.log.toasts, v: held._v });
    const vBefore = held._v;

    // ---- the colleague keeps typing (in memory only) ----
    held.comments.push({ at: new Date().toISOString(), by: 'Restricted Legal', text: 'the clause 3 cap should be 5%' });
    held.metadata = { ...(held.metadata || {}), note: 'mid-edit work' };

    // ---- the admin re-files it, exactly as the Key-terms row does ----
    const asAdmin = await admin.json('/api/contracts/MK-A2');
    const bvA = asAdmin._v; delete asAdmin._v;
    (asAdmin.audit = asAdmin.audit || []).push({ at: new Date().toISOString(), user: 'Amina Otieno',
      action: 'Re-filed', detail: `Moved from ${FOLDER_A} to ${FOLDER_B} by Amina Otieno` });
    asAdmin.folder = FOLDER_B;
    const moved = await admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: asAdmin, baseVersion: bvA } });
    H.ok(moved.status === 200, 'the admin move lands (admin-only, audited)', { status: moved.status });
    const nowRow = await admin.json('/api/contracts/MK-A2');
    H.ok(nowRow.folder === FOLDER_B, 'ARMED: MK-A2 is now filed where the colleague cannot see it',
      { folder: nowRow.folder });
    H.note(`MK-A2 moved ${FOLDER_A} → ${FOLDER_B} at version ${nowRow._v}; colleague still holds ${vBefore}`);

    // ---- MEASURE: the colleague's next save, through the product's own path ----
    rig.log.toasts.length = 0; rig.log.dialogs.length = 0;
    rig.persist(held);
    await sleep(700);                                   // the 400ms debounce plus slack
    await rig.flushSaves();

    const put = rig.log.api.filter(a => a.pathname === 'contracts/MK-A2' && a.method === 'PUT');
    H.ok(put.length >= 1, 'the save was attempted', put.length);
    const rawTry = await restricted.raw('/api/contracts/MK-A2', {
      method: 'PUT', body: { contract: { ...held, _v: undefined }, baseVersion: vBefore } });
    H.ok(rawTry.status === 404 && /not found/i.test(rawTry.text),
      'THE SERVER REFUSES WITH 404 — invisible therefore unwritable',
      { status: rawTry.status, body: rawTry.text.slice(0, 120) });
    H.note('server said: ' + rawTry.text.slice(0, 120));

    H.ok(rig.log.dialogs.length === 0,
      'no keep-mine / load-theirs dialog — this is not a version conflict and is not offered as one',
      rig.log.dialogs);
    const errs = rig.log.toasts.filter(t => t.kind === 'err');
    H.ok(errs.length >= 1, 'TOLD: a refusal reaches them as an error', rig.log.toasts);
    H.note('what they were told: ' + JSON.stringify(errs.map(t => t.msg)));
    H.ok(errs.some(t => /not found/i.test(t.msg)),
      'SILENT ON THE CAUSE: the sentence is "Contract not found" — it names neither the move nor the person who made it',
      errs.map(t => t.msg));
    H.ok(!errs.some(t => /stream|folder|re-?filed|moved|admin/i.test(t.msg)),
      'nothing in the sentence says an admin re-filed it, or who to ask', errs.map(t => t.msg));

    H.ok(rig.dirtyIds().length === 0,
      'AND THE WORK LEFT THE QUEUE: flushSaves clears `dirty` before it sends, so a refused save is never retried',
      rig.dirtyIds());
    const stored = await admin.json('/api/contracts/MK-A2');
    const kept = (stored.comments || []).map(x => x.text);
    H.ok(!kept.includes('the clause 3 cap should be 5%'),
      'HOLE-SHAPED LOSS: their mid-edit note is on no record anywhere but the tab they typed it in', kept);

    // and the contract simply vanishes from their world with no notice
    const listAfter = await restricted.json('/api/bootstrap');
    H.ok(!(listAfter.contracts || []).some(c => c.id === 'MK-A2'),
      'MK-A2 is gone from their register on the next load — with nothing said about where it went',
      (listAfter.contracts || []).map(c => c.id));
    const gone = await restricted.raw('/api/contracts/MK-A2');
    H.ok(gone.status === 404, 'and reading it answers 404 too', { status: gone.status });

    /* ============================================================
       BLOCK 2 — THE MOVE RACES AN APPROVAL CHAIN MID-WALK
       ============================================================ */
    console.log('\n--- BLOCK 2 — a recorded "yes" and a re-filing ---');

    const RULES = [
      { id: 'r-value', name: 'Value gate', order: 1,
        cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'role', role: 'admin' } },
      { id: 'r-proc', name: 'Procurement sign-off', order: 2,
        cond: { type: 'folder', value: FOLDER_A }, approver: { kind: 'role', role: 'admin' } },
      { id: 'r-sales', name: 'Sales sign-off', order: 3,
        cond: { type: 'folder', value: FOLDER_B }, approver: { kind: 'role', role: 'admin' } },
    ];
    await admin.json('/api/settings', { method: 'PUT', body: { approvalRules: RULES } });

    // put MK-A2 back where it started so the chain has somewhere to walk
    const back = await admin.json('/api/contracts/MK-A2');
    const bvB = back._v; delete back._v; back.folder = FOLDER_A; back.approvalChain = [];
    await admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: back, baseVersion: bvB } });

    const boot2 = await admin.json('/api/bootstrap');
    const st1 = approvalsStage(admin, boot2);
    let c = await admin.json('/api/contracts/MK-A2');
    let state0 = st1.sb.approvalState(c);
    H.ok(state0.required && state0.chain.length === 2
      && state0.chain.map(s => s.ruleId).join(',') === 'r-value,r-proc',
      'ARMED: in ' + FOLDER_A + ' the chain is two steps',
      state0.chain.map(s => s.ruleId + ':' + s.status));

    st1.sb.approveContract(c, 'value ok');
    await st1.settled();
    st1.sb.approveContract(c, 'procurement ok');
    await st1.settled();
    c = await admin.json('/api/contracts/MK-A2');
    const armedChain = (c.approvalChain || []).map(s => s.ruleId + ':' + s.status);
    const armedYeses = (c.audit || []).filter(a => a.action === 'Approved');
    H.ok(armedChain.join(',') === 'r-value:approved,r-proc:approved',
      'ARMED: BOTH steps are approved and stored', armedChain);
    H.ok(armedYeses.length === 2, 'ARMED: the audit trail holds two "Approved" lines',
      armedYeses.map(a => a.detail));
    H.ok(st1.sb.approvalState(c).ok === true, 'ARMED: approvals complete — signing unlocked');
    H.note('armed: chain=' + JSON.stringify(armedChain) + ' · audit yeses=' + armedYeses.length);

    // ---- THE MOVE ----
    const bvM = c._v; delete c._v;
    (c.audit = c.audit || []).push({ at: new Date().toISOString(), user: 'Amina Otieno',
      action: 'Re-filed', detail: `Moved from ${FOLDER_A} to ${FOLDER_B} by Amina Otieno` });
    c.folder = FOLDER_B;
    const mv = await admin.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c, baseVersion: bvM } });
    H.ok(mv.status === 200, 'the admin re-files the contract', { status: mv.status });

    c = await admin.json('/api/contracts/MK-A2');
    const afterMove = st1.sb.approvalState(c);
    H.ok(afterMove.chain.map(s => s.ruleId).join(',') === 'r-value,r-sales',
      'the chain rebuilds for the new stream — the procurement step is no longer in it',
      afterMove.chain.map(s => s.ruleId + ':' + s.status));
    H.ok(afterMove.ok === false && afterMove.next && afterMove.next.ruleId === 'r-sales',
      'A COMPLETED APPROVAL BECOMES INCOMPLETE, silently: signing was unlocked and now is not',
      { ok: afterMove.ok, next: afterMove.next && afterMove.next.ruleId });
    H.ok((c.approvalChain || []).some(s => s.ruleId === 'r-proc' && s.status === 'approved'),
      'the STORED record still carries the procurement yes at this point — it is merely not read',
      (c.approvalChain || []).map(s => s.ruleId + ':' + s.status));
    const said = (c.audit || []).filter(a => /approv/i.test(a.action) || /approv/i.test(a.detail || ''))
      .filter(a => /no longer|dropped|left the chain|re-?filed/i.test(a.detail || ''));
    H.ok(said.length === 0,
      'NOTHING NAMES THE LOSS: no audit line, no toast, no notice says an approval left the chain',
      (c.audit || []).slice(-3).map(a => a.action + ' — ' + a.detail));

    // ---- and the next approval ERASES it ----
    st1.sb.approveContract(c, 'sales ok');
    await st1.settled();
    c = await admin.json('/api/contracts/MK-A2');
    const finalChain = (c.approvalChain || []).map(s => s.ruleId + ':' + s.status);
    const finalYeses = (c.audit || []).filter(a => a.action === 'Approved');
    H.ok(!finalChain.some(x => x.startsWith('r-proc')),
      'HOLE: the next approval writes the REBUILT chain, and the procurement yes is erased from the record',
      finalChain);
    H.ok(finalYeses.length === 3 && finalChain.filter(x => x.endsWith(':approved')).length === 2,
      'THREE YESES IN THE HISTORY, TWO IN THE CONTRACT — the exact shape this sweep descends from',
      { audit: finalYeses.length, chain: finalChain });
    H.note('audit "Approved" lines: ' + finalYeses.length + ' · approved steps on the record: '
      + finalChain.filter(x => x.endsWith(':approved')).length + ' → ' + JSON.stringify(finalChain));

    // ---- and moving it back does not bring the yes home ----
    const bvR = c._v; delete c._v; c.folder = FOLDER_A;
    await admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c, baseVersion: bvR } });
    c = await admin.json('/api/contracts/MK-A2');
    const returned = st1.sb.approvalState(c);
    const procStep = returned.chain.find(s => s.ruleId === 'r-proc');
    H.ok(!!procStep && procStep.status === 'pending',
      'IRREVERSIBLE: filed back where it started, the step that WAS approved is pending again',
      returned.chain.map(s => s.ruleId + ':' + s.status));
    H.ok(returned.ok === false,
      'so the contract now needs an approval the trail says it already has', { ok: returned.ok });

    /* ============================================================
       BLOCK 3 — THE MOVE, A LIVE LINK AND A MINT
       ============================================================ */
    console.log('\n--- BLOCK 3 — the move races a share ---');

    // a link minted BEFORE the move
    const payload = { kind: 'hati-share', contract: { id: 'MK-A2', name: 'Raw Milk Collection',
      counterparty: 'Nandi Dairy', status: 'Under Review', value: 36000000 }, org: { name: 'Highland Corporate Ltd' } };
    const mint = await admin.json('/api/shares', { method: 'POST', body: {
      payload, channel: 'link', recipient: { name: 'Nandi Dairy', email: 'legal@nandi.co.ke' },
      durable: true, purpose: 'negotiate' } });
    H.ok(!!mint.token, 'ARMED: a live link exists on MK-A2 before the move', { token: !!mint.token });

    // colleague can still see MK-A2 (it went back to FOLDER_A above)
    const seeable = await restricted.raw('/api/contracts/MK-A2');
    H.ok(seeable.status === 200, 'ARMED: the colleague can see it again', { status: seeable.status });

    // move it away
    const c3 = await admin.json('/api/contracts/MK-A2');
    const bv3 = c3._v; delete c3._v; c3.folder = FOLDER_B;
    await admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c3, baseVersion: bv3 } });
    H.ok((await admin.json('/api/contracts/MK-A2')).folder === FOLDER_B, 'ARMED: moved again');

    const pub = await h.client('public').raw('/api/shares/' + mint.token);
    H.ok(pub.status === 200,
      'SOUND (deliberate): the already-live link is untouched — a share carries no folder',
      { status: pub.status });

    const mintAfter = await restricted.raw('/api/shares', { method: 'POST', body: {
      payload, channel: 'link', recipient: { name: 'Nandi Dairy', email: 'legal@nandi.co.ke' },
      durable: true, purpose: 'negotiate' } });
    H.ok(mintAfter.status === 404,
      'the colleague\'s mint is refused — idInScope answers before anything is written',
      { status: mintAfter.status, body: mintAfter.text.slice(0, 120) });
    H.note('mint refusal: ' + mintAfter.text.slice(0, 120));
    const sharesList = await restricted.raw('/api/contracts/MK-A2/shares');
    H.ok(sharesList.status === 404, 'and the share panel cannot be read either', { status: sharesList.status });
    H.note('the browser answers a mint refusal with `toast(e.message)` (js/core.js doSend catch), '
      + 'so the colleague reads "Contract not found" here too');

  } catch (e) {
    console.log('HARNESS ERROR: ' + (e && e.stack || e));
    process.exitCode = 1;
  } finally {
    await h.stop();
  }
  H.done();
})();
