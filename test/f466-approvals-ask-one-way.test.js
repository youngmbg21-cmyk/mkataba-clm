'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f466 — APPROVALS AND SETTINGS, FROM THE PROCESS REVIEW (4 Oct 2026, owner
   approved the stream)

   1  Approve and Refuse on the Approvals page itself, through the room's own
      verbs (approvalDecideAsk → approveContract / rejectApprovalStep /
      signApprovalDecide), the page still writing nothing itself.
   3  ONE SET OF RULES FOR ASKING A COLLEAGUE: a rule step is refused with a
      reason (browser and server); its approver is mailed when their step falls
      due; when the last step clears the owner and the held internal signer are
      told; the rule steps ride the named yes's reminder sweep.
   5  SIGN_STAGE_OF knows the keys signBlockers really produces.
   6  "Decline & close" on a Contracts row really declines (contractDecline).
   The settings half (2, 4) is f467.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

/* ---------------------------------------------------------------- browser */
const RULE = { id: 'r-spend', name: 'Value ≥ KES 5M', order: 1,
  cond: { type: 'value', op: '>=', value: 5000000 }, approver: { kind: 'role', role: 'admin' } };
const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
const LEGAL = { id: 'u_legal', name: 'Wanjiku Kamau', role: 'legal' };
const contract = (over = {}) => ({ id: 'MK-9', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar',
  folder: 'proc', status: 'Under Review', value: 6000000, valueType: 'standard', template: 'RM',
  redlineText: 'Payment within thirty (30) days.', format: 'text', fields: {}, metadata: {}, audit: [],
  comments: [], signatures: [], obligations: [], rounds: [], versions: [], approvalChain: null, ...over });

function world(user = ADMIN, prompts = []) {
  const toasts = [];
  return loadViews(['js/approvals.js'], {
    currentUser: () => user, canEdit: () => user.role !== 'viewer',
    ROLE_LABEL: { admin: 'Admin', legal: 'Editor', viewer: 'Viewer' },
    cKind: () => 'Contract', deviationSummary: () => null,
    nowISO: () => '2026-10-04T09:00:00.000Z', fmtDT: iso => String(iso || ''),
    persist() {}, saveSettings() {}, renderSignButton() {}, renderAuditSection() {}, logAudit() {},
    ensureFull: async () => {},
    toast: (m, k) => toasts.push({ m, k }),
    promptDialog: async () => prompts.shift(),
    state: { contracts: [], settings: { approvalRules: [RULE] } },
    _toasts: toasts });
}

describe('f466 (1)(3) one way to decide, and a refusal says why — the browser half', () => {
  test('a rule step refused with no reason is not refused, and says so', () => {
    const w = world(ADMIN);
    const c = contract();
    w.rejectApprovalStep(c, '   ');
    assert.notEqual(w.approvalState(c).chain[0].status, 'rejected');
    assert.ok(w._toasts.some(t => t.k === 'warn'), 'the refusal is said in words, as a warning');
  });

  test('approvalDecidableNow names what this reader may decide — the approver, never anybody else', () => {
    const c = contract();
    assert.equal(world(ADMIN).approvalDecidableNow(c).kind, 'rule');
    assert.equal(world(LEGAL).approvalDecidableNow(c), null);
    assert.equal(world(ADMIN).approvalDecidableNow(contract({ value: 10 })), null, 'no rule, nothing to decide');
  });

  test('Refuse from the page asks the reason; an empty answer refuses nothing; a reason refuses', async () => {
    const c = contract();
    let w = world(ADMIN, ['']);
    assert.equal(await w.approvalDecideAsk(c, 'refused'), false);
    assert.notEqual(w.approvalState(c).chain[0].status, 'rejected');
    w = world(ADMIN, ['The cap is below our floor.']);
    assert.equal(await w.approvalDecideAsk(c, 'refused'), true);
    const step = w.approvalState(c).chain[0];
    assert.equal(step.status, 'rejected');
    assert.equal(step.comment, 'The cap is below our floor.');
  });

  test('Approve from the page is the room\'s approval, and clears the rules', async () => {
    const w = world(ADMIN);
    const c = contract();
    assert.equal(w.approvalRulesCleared(c), false);
    assert.equal(await w.approvalDecideAsk(c, 'approved'), true);
    assert.equal(w.approvalState(c).ok, true);
    assert.equal(w.approvalRulesCleared(c), true, 'every rule step given');
    assert.equal(w.approvalRulesCleared(contract({ value: 10 })), false, 'nothing asked, nothing cleared');
  });

  test('the room\'s own Refuse asks through the same required asker', () => {
    const A = strip(R('js/approvals.js'));
    const wire = A.slice(A.indexOf('function wireApprovalPanel('), A.indexOf("getElementById('ap-resubmit')"));
    assert.match(wire, /approvalRefuseWhy\(\)/);
    assert.ok(!/optional:true/.test(wire), 'the reason is no longer optional');
  });
});

describe('f466 (1) the Approvals page decides through the room\'s verbs and still writes nothing', () => {
  const V = strip(R('js/views/approvalsview.js'));
  test('Approve and Refuse press approvalDecideAsk, only on a row this reader may decide', () => {
    assert.match(V, /function apMayDecide\(r\)\{[\s\S]*?r\.mine[\s\S]*?approvalDecidableNow\(r\.c\)/);
    assert.match(V, /const ok=await approvalDecideAsk\(c, verdict\);/);
    assert.match(V, /k:'approve'[\s\S]*?apDecide\(c\.id,'approved'\)/);
    assert.match(V, /k:'refuse'[\s\S]*?apDecide\(c\.id,'refused'\)/);
    assert.match(V, /data-ap-approve=/, 'the narrow table carries them too');
    assert.match(V, /k:'gate'[\s\S]*?apOpenSigning/, 'opening the Signing tab stays');
  });
  test('the page itself calls no act and writes nothing', () => {
    for (const act of ['approveContract(', 'rejectApprovalStep(', 'signApprovalDecide(', 'signDocument(', 'persist(', 'api('])
      assert.ok(!V.includes(act), act + ' is called from the page');
  });
  test('the panel draws the verbs when the reading says so, and not otherwise', () => {
    const w = loadViews(['js/views/approvalsview.js'], { approvalDecidableNow: c => (c.id === 'A' ? { kind: 'rule' } : null) });
    const keys = r => w.apInsActs('approvals', r).map(a => a.k);
    assert.equal(keys({ c: { id: 'A' }, mine: true }).slice(0, 2).join(','), 'approve,refuse');
    assert.ok(!keys({ c: { id: 'B' }, mine: true }).includes('approve'));
    assert.ok(!keys({ c: { id: 'A' }, mine: false }).includes('approve'), 'a row raised by the reader is watched, not decided');
  });
});

describe('f466 (5) SIGN_STAGE_OF knows the keys signBlockers produces', () => {
  test('signcap and signfolder are people, hold is paper; the old keys stay harmless', () => {
    const w = loadViews(['js/signcheck.js'], {});
    assert.equal(w.signStageOf('signcap'), 'people');
    assert.equal(w.signStageOf('signfolder'), 'people');
    assert.equal(w.signStageOf('hold'), 'paper');
    assert.equal(w.signStageOf('cap'), 'people');
    assert.equal(w.signStageOf('folder'), 'people');
  });
});

describe('f466 (6) "Decline & close" declines', () => {
  const CORE = strip(R('js/core.js'));
  const REG = strip(R('js/views/register.js'));
  test('the row presses the one act through a required reason, and is not drawn where it cannot work', () => {
    assert.match(REG, /else if\(act==='decline'\) regDeclineAsk\(c\);/);
    assert.match(REG, /function regDeclineAsk\(c\)\{[\s\S]*?multiline:true[\s\S]*?contractDecline\(c, why\)/);
    assert.match(REG, /\{k:'decline'[\s\S]*?when:c=>c\.status!=='Signed'&&c\.status!=='Declined'/);
  });
  test('contractDecline: a reason, never on signed paper, Declined plus an audit line', async () => {
    const fn = /async function contractDecline\(c,why\)\{[\s\S]*?\n\}/.exec(CORE)[0];
    const toasts = [], audit = [];
    const env = { canEdit: () => true, toast: (m, k) => toasts.push(k), i18t: k => k, HOLD_WHY_MAX: 240,
      ensureFull: async () => {}, todayStr: () => '4 Oct 2026', currentUser: () => ({ name: 'Amina' }),
      logAudit: (c, a, d) => audit.push({ a, d }), persist() {}, window: {} };
    const decline = new Function(...Object.keys(env), fn + '; return contractDecline;')(...Object.values(env));
    const c = { status: 'Under Review', signatures: [], signerPlan: [] };
    assert.equal(await decline(c, ''), false, 'no reason, nothing written');
    assert.equal(c.status, 'Under Review');
    assert.equal(await decline({ status: 'Signed' }, 'x'), false);
    assert.equal(await decline({ status: 'Under Review', signerPlan: [{ signed: true }] }, 'x'), false, 'a first signature closes the door');
    assert.equal(await decline(c, 'They chose another supplier.'), true);
    assert.equal(c.status, 'Declined');
    assert.ok(audit.some(x => x.a === 'Declined' && /another supplier/.test(x.d)));
    assert.equal(toasts[toasts.length - 1], 'ok');
  });
});

/* ----------------------------------------------------------------- server */
const RULES = [
  { id: 'r-fin', name: 'Finance director', order: 1, cond: { type: 'value', op: '>=', value: 1000000 }, approver: { kind: 'role', role: 'admin' } },
  { id: 'r-legal', name: 'Legal review', order: 2, cond: { type: 'folder', value: FOLDER_A }, approver: { kind: 'role', role: 'legal' } },
];
const stampOf = new Function(/function approvalStamp\(c\)\{[\s\S]*?\n\}/.exec(R('js/approvals.js'))[0] + '; return approvalStamp;')();

describe('f466 (3) the rule steps tell people — the server half', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: RULES }); });
  after(async () => { await h.stop(); });

  const save = async (cl, id, patch) => {
    const cur = await W.admin.json('/api/contracts/' + id);
    const v = cur._v; delete cur._v;
    return cl.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: patch(cur), baseVersion: v } });
  };
  const decide = (by, ruleId, status, comment) => c => {
    const rule = RULES.find(r => r.id === ruleId);
    const chain = (c.approvalChain || []).filter(s => s.ruleId !== ruleId);
    chain.push({ ruleId, name: rule.name, approver: rule.approver, order: rule.order, status, by,
      at: new Date().toISOString(), stamp: status === 'approved' ? stampOf(c) : null, comment: comment || null });
    return { ...c, approvalChain: chain };
  };
  const outbox = async () => ((await W.admin.json('/api/outbox')).items || []);
  /* the mail is sent after the save answers — waited for, bounded */
  const mailTo = async (to, re, n = 1) => {
    for (let i = 0; i < 40; i++) {
      const hits = (await outbox()).filter(m => m.to_addr === to && re.test(m.subject));
      if (hits.length >= n) return hits;
      await new Promise(r => setTimeout(r, 50));
    }
    return (await outbox()).filter(m => m.to_addr === to && re.test(m.subject));
  };

  test('a rule step is refused with a reason or not at all', async () => {
    const id = 'MK-466-1';
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
      id, name: 'Wall test', counterparty: 'Nordkust', folder: FOLDER_A, status: 'Under Review', value: 6000000,
      valueType: 'estimated', template: 'RM', fields: {}, metadata: {}, comments: [], audit: [], signatures: [] } } });
    let r = await save(W.admin, id, decide('Amina Otieno', 'r-fin', 'rejected', ''));
    assert.equal(r.status, 403, JSON.stringify(r.json));
    assert.match(r.json.error, /says why/);
    r = await save(W.admin, id, decide('Amina Otieno', 'r-fin', 'rejected', 'The cap is below our floor.'));
    assert.equal(r.status, 200, JSON.stringify(r.json));
  });

  test('the approver is mailed when their step falls due — not while it is a draft — and the owner and signer when the last clears', async () => {
    const id = 'MK-466-2';
    const admin = (await W.admin.json('/api/bootstrap')).me;
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { baseVersion: 0, contract: {
      id, name: 'Steel Supply', counterparty: 'Nordkust', folder: FOLDER_A, status: 'Draft', value: 6000000,
      valueType: 'estimated', template: 'RM', fields: {}, metadata: {}, comments: [], audit: [], signatures: [],
      owner: { id: W.users.restricted.id, name: W.users.restricted.name },
      signerPlan: [
        { id: 'sg-us-1', party: 'internal', order: 1, name: 'Amina Otieno', email: 'admin@example.co.ke', memberId: admin.id, signed: false },
        { id: 'sg-cp-1', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false },
      ] } } });
    /* still drafting: a save mails nobody */
    let r = await save(W.unrestricted, id, c => ({ ...c, lastAction: 'x' }));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    await new Promise(res => setTimeout(res, 150));
    assert.equal((await mailTo('admin@example.co.ke', /Steel Supply/, 0)).filter(m => /approval is needed/.test(m.subject)).length, 0);
    /* it leaves Draft: the first step's approver (the admins) is told */
    r = await save(W.unrestricted, id, c => ({ ...c, status: 'Under Review' }));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const first = await mailTo('admin@example.co.ke', /approval is needed.*Steel Supply/);
    assert.equal(first.length, 1, 'the finance step is the admins\'');
    assert.match(first[0].body, /Finance director/);
    /* the admin approves: the legal step falls due, and legal is told */
    r = await save(W.admin, id, decide('Amina Otieno', 'r-fin', 'approved'));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const second = await mailTo('everything@example.co.ke', /approval is needed.*Steel Supply/);
    assert.equal(second.length, 1);
    assert.match(second[0].body, /Legal review/);
    /* nobody is told the same step twice by a save that leaves it where it was */
    await save(W.admin, id, c => ({ ...c, lastAction: 'y' }));
    await new Promise(res => setTimeout(res, 150));
    assert.equal((await mailTo('everything@example.co.ke', /approval is needed.*Steel Supply/)).length, 1);
    /* legal approves the last step: the owner and the held signer are told */
    r = await save(W.unrestricted, id, decide(W.users.unrestricted.name, 'r-legal', 'approved'));
    assert.equal(r.status, 200, JSON.stringify(r.json));
    const owner = await mailTo('restricted@example.co.ke', /can go for signature/);
    assert.equal(owner.length, 1, 'the owner hears every step is given');
    const signer = await mailTo('admin@example.co.ke', /signature is needed/);
    assert.ok(signer.length >= 1, 'and the internal signer whose turn notice was held');
  });

  test('the rule steps ride the reminder sweep, and a fresh step is not chased', async () => {
    const run = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(run.signApproval && run.signApproval.ruleSteps, JSON.stringify(run.signApproval));
    assert.ok(run.signApproval.ruleSteps.checked >= 1, 'the open step is looked at');
    assert.equal(run.signApproval.ruleSteps.sent, 0, 'not yet two working days');
  });
});
