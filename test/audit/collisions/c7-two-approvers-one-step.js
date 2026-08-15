/* ============================================================
   C7 — TWO APPROVERS, ONE STEP
   ============================================================
   Three collisions, all of them between two ALLOWED acts:

     BLOCK 1 — two admins who both satisfy one approval step press Approve at
               the same moment.
     BLOCK 2 — one refuses the step while the other approves it. One question,
               two answers.
     BLOCK 3 — an approval races an edit to the approval RULES: the step that
               was approved stops existing, and then comes back wearing a
               different question with the same rule id.

   WHAT IS REAL HERE: a real HaTi server; js/approvals.js ITSELF
   (buildApprovalChain / approvalState / approveContract / rejectApprovalStep);
   js/core.js ITSELF for persist / flushSaves / saveContract and its conflict
   dialog; and the real PUT /api/settings for the rule edit. The DOM, the toast
   bar and the confirm dialog are recorders.

   Run:  node test/audit/collisions/c7-two-approvers-one-step.js
*/
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('../../helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('../../dom');
const { harness } = require('./savepath');

const sleep = ms => new Promise(r => setTimeout(r, ms));

function browserFor(client, who, log) {
  const w = loadViews(['js/core.js', 'js/approvals.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    crypto: require('node:crypto').webcrypto, TextEncoder, TextDecoder,
    API_MODE: () => true,
    docBody: () => '<p>doc</p>', captureVersion: () => null, docFormat: f => f,
    updateSidebarCounts() {}, renderWorkspace() {}, setView() {}, renderSignButton() {},
    refreshStats() {}, renderAuditSection() {}, renderSharesSection() {},
    async api(pathname, method = 'GET', body) {
      log.api.push({ who, pathname, method: method || 'GET' });
      const r = await client.raw('/api/' + pathname, { method: method || 'GET', body });
      if (r.status >= 400) {
        const e = new Error((r.json && r.json.error) || ('Request failed (' + r.status + ')'));
        e.status = r.status; e.data = r.json || null; throw e;
      }
      return r.json;
    },
  });
  w.toast = (msg, kind) => { log.toasts.push({ who, msg: String(msg), kind: kind || 'ok' }); };
  w.confirmDialog = async (o) => {
    log.dialogs.push({ who, message: (o && o.message) || '', confirmLabel: (o && o.confirmLabel) || '' });
    return true;                                  // "Keep mine & save"
  };
  w.renderWorkspace = () => {}; w.refreshShareOverview = () => {};
  w.renderSignButton = () => {}; w.renderAuditSection = () => {};
  return w;
}

async function seat(client, who, log, settings, contract, activeId) {
  const w = browserFor(client, who, log);
  const st = vm.runInContext('state', w);
  st.settings = JSON.parse(JSON.stringify(settings));
  st.contracts = [contract]; st.activeId = activeId; st.view = 'workspace';
  return { w, st };
}

(async () => {
  const t = harness('C7 two approvers, one step');
  const h = await startHati();
  const log = { toasts: [], dialogs: [], api: [] };
  try {
    const W = await seedWorkspace(h);
    const A = h.client('A-amina');
    await A.json('/api/login', { method: 'POST', body: { email: 'admin@example.co.ke', password: 'adminpassword1' } });
    await A.json('/api/users', { method: 'POST', body: {
      name: 'Daniel Mwangi', email: 'daniel@example.co.ke', role: 'admin', password: 'temporary-pass-1' } });
    const D = h.client('D-daniel');
    await D.json('/api/login', { method: 'POST', body: { email: 'daniel@example.co.ke', password: 'temporary-pass-1' } });
    await D.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'daniels-own-pass-9' } });

    /* ONE RULE, WHICH BOTH ADMINS SATISFY. Written through the real settings
       route so both browsers read the same workspace rule. */
    const RULE = { id: 'r-big', name: 'Value ≥ 5,000,000', order: 1,
      cond: { type: 'value', op: '>=', value: 5000000 }, approver: { kind: 'role', role: 'admin' } };
    await A.json('/api/settings', { method: 'PUT', body: { approvalRules: [RULE] } });
    const bootA = await A.json('/api/bootstrap');
    t.ok(Array.isArray(bootA.settings.approvalRules) && bootA.settings.approvalRules[0].id === 'r-big',
      'ARMED: one approval rule is in force, satisfied by any admin',
      bootA.settings.approvalRules);

    const meA = { id: bootA.me.id, name: 'Amina Otieno', email: 'admin@example.co.ke', role: 'admin' };
    const bootD = await D.json('/api/bootstrap');
    const meD = { id: bootD.me.id, name: 'Daniel Mwangi', email: 'daniel@example.co.ke', role: 'admin' };

    /* ================= BLOCK 1 — both approve at once ================= */
    const ID1 = 'MK-A2';
    const a0 = await A.json('/api/contracts/' + ID1);
    const d0 = await D.json('/api/contracts/' + ID1);
    t.ok(a0._v === d0._v && Number(a0.value) >= 5000000,
      `ARMED: both admins hold ${ID1} (value ${a0.value}) at version ${a0._v}, with no decision on it`,
      { v: a0._v, value: a0.value, chain: a0.approvalChain || null });

    const sA = await seat(A, 'Amina', log, bootA.settings, { ...a0, _loaded: true, _light: false }, ID1);
    sA.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const sD = await seat(D, 'Daniel', log, bootD.settings, { ...d0, _loaded: true, _light: false }, ID1);
    sD.w.REMOTE = { org: bootD.org, me: meD, users: [meA, meD] };

    const stA = sA.w.approvalState(sA.st.contracts[0]);
    const stD = sD.w.approvalState(sD.st.contracts[0]);
    t.ok(stA.required && stA.canApproveNext && stD.required && stD.canApproveNext,
      'ARMED: both browsers say this step is theirs to decide (canApproveNext true on both)',
      { amina: { required: stA.required, can: stA.canApproveNext, next: stA.next && stA.next.ruleId },
        daniel: { required: stD.required, can: stD.canApproveNext, next: stD.next && stD.next.ruleId } });

    sA.w.approveContract(sA.st.contracts[0], 'looks fine to me');
    await sleep(700);
    const afterA = await A.json('/api/contracts/' + ID1);
    t.ok(afterA.approvalChain && afterA.approvalChain[0] && afterA.approvalChain[0].status === 'approved'
      && afterA.approvalChain[0].by === 'Amina Otieno',
      `ARMED: Amina's approval is on the record at version ${afterA._v}`,
      afterA.approvalChain);

    const dialogsBefore = log.dialogs.length, toastsBefore = log.toasts.length;
    sD.w.approveContract(sD.st.contracts[0], 'agreed');
    await sleep(700);
    const bothIn = await A.json('/api/contracts/' + ID1);
    t.note(`chain after both: ${JSON.stringify(bothIn.approvalChain)}`);
    t.note(`dialogs during Daniel's save: ${JSON.stringify(log.dialogs.slice(dialogsBefore))}`);
    t.note(`toasts: ${JSON.stringify(log.toasts.slice(toastsBefore).map(x => x.who + ': ' + x.msg))}`);

    t.ok((bothIn.approvalChain || []).length === 1,
      'YARDSTICK one question one answer — the step carries ONE decision, not two',
      (bothIn.approvalChain || []).map(s => `${s.ruleId}:${s.status}:${s.by}`));
    const approvedLines = (bothIn.audit || []).filter(a => /^Approved$/i.test(a.action || ''));
    t.note(`"Approved" lines in the trail: ${JSON.stringify(approvedLines.map(a => a.user))}`);
    const chainBy = (bothIn.approvalChain || [])[0] && bothIn.approvalChain[0].by;
    t.ok(!(approvedLines.length > 1 && approvedLines.some(a => a.user !== chainBy)),
      'YARDSTICK every recorded yes is in the outcome — the trail does not name an approver the record dropped',
      { trail: approvedLines.map(a => a.user), record: chainBy });
    const saidAfterD = log.toasts.slice(toastsBefore);
    t.ok(!saidAfterD.some(x => /All approvals complete/i.test(x.msg) && x.who === 'Daniel')
      || chainBy === 'Daniel Mwangi',
      'the approver who lost the race is not told their approval completed the chain when it did not',
      saidAfterD.map(x => x.who + ': ' + x.msg));

    /* ================= BLOCK 2 — one refuses while the other approves ================= */
    const ID2 = 'MK-B2';
    const a2 = await A.json('/api/contracts/' + ID2);
    const d2 = await D.json('/api/contracts/' + ID2);
    t.ok(a2._v === d2._v && Number(a2.value) >= 5000000,
      `ARMED: both hold ${ID2} (value ${a2.value}) at version ${a2._v}, undecided`,
      { v: a2._v, value: a2.value });

    const rA = await seat(A, 'Amina', log, bootA.settings, { ...a2, _loaded: true, _light: false }, ID2);
    rA.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const rD = await seat(D, 'Daniel', log, bootD.settings, { ...d2, _loaded: true, _light: false }, ID2);
    rD.w.REMOTE = { org: bootD.org, me: meD, users: [meA, meD] };

    /* Amina REFUSES it, in words, and the contract goes back to its owner. */
    rA.w.rejectApprovalStep(rA.st.contracts[0], 'the indemnity cap is outside our insurance cover');
    await sleep(700);
    const refused = await A.json('/api/contracts/' + ID2);
    t.ok(refused.approvalChain && refused.approvalChain[0].status === 'rejected'
      && refused.approvalChain[0].by === 'Amina Otieno',
      `ARMED: Amina's refusal is on the record at version ${refused._v}`,
      refused.approvalChain);

    /* Daniel, from the copy he had before that, approves it. */
    const before2 = log.toasts.length;
    rD.w.approveContract(rD.st.contracts[0], 'fine by me');
    await sleep(700);
    const final2 = await A.json('/api/contracts/' + ID2);
    t.note(`chain after the refusal collided with the approval: ${JSON.stringify(final2.approvalChain)}`);
    t.note(`trail: ${JSON.stringify((final2.audit || []).map(a => a.user + ':' + a.action))}`);
    t.note(`toasts: ${JSON.stringify(log.toasts.slice(before2).map(x => x.who + ': ' + x.msg))}`);

    const rejectedLine = (final2.audit || []).some(a => /Approval rejected/i.test(a.action || ''));
    const nowApproved = (final2.approvalChain || [])[0] && final2.approvalChain[0].status === 'approved';
    if (rejectedLine && nowApproved)
      t.note('SHAPE OF THE BUG: the trail records a refusal and the record reads approved — signing is unlocked');
    t.ok(!(rejectedLine && nowApproved),
      'YARDSTICK one question one answer — a refusal is not silently replaced by an approval',
      { trailHasRefusal: rejectedLine, recordStatus: (final2.approvalChain || [])[0] });

    /* Does the gate agree? Read the real predicate from a fresh browser. */
    const fresh = await seat(A, 'Amina', log, bootA.settings, { ...final2, _loaded: true, _light: false }, ID2);
    fresh.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const gate = fresh.w.approvalState(fresh.st.contracts[0]);
    t.note(`approvalState now: required=${gate.required} ok=${gate.ok} rejected=${gate.rejected.length}`);
    t.ok(!(rejectedLine && gate.ok),
      'YARDSTICK every recorded yes is in the outcome — a recorded NO is in it too: the gate still holds',
      { ok: gate.ok, rejected: gate.rejected.map(s => s.by) });

    /* ================= BLOCK 3 — the approval races a rule edit ================= */
    const ID3 = 'MK-A1';                       // signed fixture — approvals still read on it
    const c3 = await A.json('/api/contracts/' + ID3);
    const s3 = await seat(A, 'Amina', log, bootA.settings, { ...c3, _loaded: true, _light: false }, ID3);
    s3.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const st3 = s3.w.approvalState(s3.st.contracts[0]);
    t.ok(st3.required && st3.canApproveNext,
      `ARMED: ${ID3} needs the same step and Amina may decide it`,
      { required: st3.required, next: st3.next && st3.next.ruleId });
    /* Approve it in memory only — the contract is executed and the save route
       rightly refuses to write to it; the collision under test is about what
       the chain READS after the rules move, and the chain is what is in hand. */
    s3.w.approveContract(s3.st.contracts[0], 'approved on the old rule');
    const approvedChain = s3.st.contracts[0].approvalChain;
    t.ok(approvedChain[0].status === 'approved' && approvedChain[0].ruleId === 'r-big',
      'ARMED: the step is approved under rule r-big',
      approvedChain.map(s => `${s.ruleId}:${s.status}:${s.by}`));

    /* THE ADMIN EDITS THE RULES — an allowed act, through the real route. */
    await A.json('/api/settings', { method: 'PUT', body: { approvalRules: [] } });
    const bootGone = await A.json('/api/bootstrap');
    t.ok((bootGone.settings.approvalRules || []).length === 0,
      'ARMED: the rule has been deleted from the workspace', bootGone.settings.approvalRules);

    const s3b = await seat(A, 'Amina', log, bootGone.settings,
      JSON.parse(JSON.stringify(s3.st.contracts[0])), ID3);
    s3b.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const gone = s3b.w.approvalState(s3b.st.contracts[0]);
    t.note(`after the rule is deleted: required=${gone.required} ok=${gone.ok} chain=${JSON.stringify(gone.chain)}`);
    t.note(`the stored chain still holds: ${JSON.stringify((s3b.st.contracts[0].approvalChain || []).map(x => x.ruleId + ':' + x.status + ':' + x.by))}`);
    t.ok(gone.chain.length === 0 && gone.ok,
      'the deleted rule takes its step off the chain (the decision is not shown as pending)',
      gone.chain);
    t.ok(!( (s3b.st.contracts[0].approvalChain || []).length && !gone.chain.length ),
      'YARDSTICK every press lands — a decision on the record is still visible somewhere on the screen it was given on',
      { stored: (s3b.st.contracts[0].approvalChain || []).length, drawn: gone.chain.length });

    /* AND IT COMES BACK. The rule is restored — the admin changed their mind,
       or the contract was re-filed into a folder the rule names again. Nothing
       re-asks the approver. */
    await A.json('/api/settings', { method: 'PUT', body: { approvalRules: [RULE] } });
    const bootBack = await A.json('/api/bootstrap');
    const s3r = await seat(A, 'Amina', log, bootBack.settings,
      JSON.parse(JSON.stringify(s3.st.contracts[0])), ID3);
    s3r.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const back = s3r.w.approvalState(s3r.st.contracts[0]);
    t.note(`after the rule is restored: ${JSON.stringify(back.chain)} ok=${back.ok}`);
    t.ok(back.chain.length === 1 && back.chain[0].status === 'approved' && back.ok,
      'the approval survives the rule leaving and returning (kept by ruleId — deliberate, and it is the resurrection risk)',
      back.chain);

    /* THE SAME ID, A DIFFERENT QUESTION. An admin rewrites the rule keeping its
       id — the ordinary way a rule is edited on the settings page (the editor
       deep-copies the rule and rewrites cond/approver/name, keeping `id`). */
    const REWRITTEN = { id: 'r-big', name: 'Foreign governing law', order: 1,
      cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'member', name: 'Daniel Mwangi' } };
    await A.json('/api/settings', { method: 'PUT', body: { approvalRules: [REWRITTEN] } });
    const bootNew = await A.json('/api/bootstrap');
    const s3c = await seat(A, 'Amina', log, bootNew.settings,
      JSON.parse(JSON.stringify(s3.st.contracts[0])), ID3);
    s3c.w.REMOTE = { org: bootA.org, me: meA, users: [meA, meD] };
    const rebuilt = s3c.w.approvalState(s3c.st.contracts[0]);
    t.note(`after the rule is REWRITTEN under the same id: ${JSON.stringify(rebuilt.chain)}`);
    const step = rebuilt.chain[0];
    const survived = step && step.status === 'approved' && step.by === 'Amina Otieno'
      && step.name === 'Foreign governing law' && step.approver && step.approver.name === 'Daniel Mwangi';
    if (survived)
      t.note('SHAPE OF THE BUG: a yes given to "Value ≥ 5,000,000" now reads as a yes to "Foreign governing law", '
        + 'on a step whose named approver is somebody else entirely');
    t.ok(!survived,
      'YARDSTICK one question one answer — an approval does not transfer to a rule it was never given for',
      { step: step || null });
    t.ok(!(survived && rebuilt.ok),
      'YARDSTICK — and the gate does not open on the transferred approval',
      { ok: rebuilt.ok });

    t.done();
  } catch (e) {
    console.log('FAIL  probe threw: ' + ((e && e.stack) || e));
    process.exit(1);
  } finally {
    await h.stop();
  }
})();
