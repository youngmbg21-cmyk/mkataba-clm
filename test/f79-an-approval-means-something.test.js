/* ============================================================
   F79 — an approval is a yes to a contract, not a yes for ever
   ============================================================
   Three faults in one gate, and they compound: together they meant the internal
   approval chain could be refused, ignored and outrun without anybody being
   shown a thing.

   ONE — A REJECTION LASTED ONE FUNCTION CALL. rejectApprovalStep writes
   status:'rejected' onto c.approvalChain. Every reader of that chain goes
   through approvalState → buildApprovalChain, which preserved 'approved' and
   rebuilt EVERYTHING ELSE as 'pending'. So the rejection was erased on the very
   next read. The panel has rose-coloured markup for a rejected step; no route
   through the code could reach it. An approver pressed Reject and the screen
   went back to "Waiting on an Admin", as though nobody had ruled.

   TWO — AND THEREFORE NO WAY BACK. A refusal the owner is never shown is a
   refusal they cannot answer. There was no resubmission verb at all — nothing
   that puts a revised contract back in front of the approver who refused it,
   and nothing in the audit trail that would read as "approved on the second
   ask".

   THREE — AND A SIGN-OFF OUTLIVED WHAT IT WAS GIVEN FOR. The chain recorded
   THAT a step was approved and never WHAT was approved. Approve a KES 6M deal,
   then type 60,000,000 into the key-terms panel: the rule still matches, the
   step is still green, the Sign button is still unlocked. js/versioning.js
   already holds the opposite view — it voids the chain when a negotiation round
   moves the value, "prior approvals are void" — but only on that one path.

   AND THE GATE ITSELF HAD A DOOR BESIDE IT. signDocument refuses to sign
   without approval. Sharing never asked. A link sent with purpose 'sign' puts
   the counterparty on a signature panel, and their signature executes the
   contract through applyResponse without the owner pressing Sign at all — so
   the whole chain was bypassable by pressing Share instead.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews } = require('./dom');

const THRESHOLD = 5000000;
const RULE = { id: 'r-spend', name: 'Value ≥ KES 5M', order: 1,
  cond: { type: 'value', op: '>=', value: THRESHOLD }, approver: { kind: 'role', role: 'admin' } };

const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
const LEGAL = { id: 'u_legal', name: 'Wanjiku Kamau', role: 'legal' };

function contract(over = {}) {
  return { id: 'MK-9', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar',
    folder: 'proc', status: 'Under Review', value: 6000000, valueType: 'standard',
    template: 'RM', redlineText: 'Payment within thirty (30) days.', format: 'text',
    fields: {}, metadata: {}, audit: [], comments: [], signatures: [], obligations: [],
    rounds: [], versions: [], approvalChain: null, compliance: { consent: true }, ...over };
}

/* The approvals module, loaded with the handful of globals it reaches for. */
function world(user = ADMIN, over = {}) {
  const audit = [];
  return loadViews(['js/approvals.js'], {
    currentUser: () => user,
    canEdit: () => user.role !== 'viewer',
    ROLE_LABEL: { admin: 'Admin', legal: 'Legal', viewer: 'Viewer' },
    cKind: () => 'Contract',
    deviationSummary: () => null,
    nowISO: () => '2026-07-28T09:00:00.000Z',
    fmtDT: iso => String(iso || ''),
    persist() {}, saveSettings() {}, renderSignButton() {}, renderAuditSection() {},
    logAudit: (_c, action, detail) => audit.push({ action, detail }),
    toast() {},
    state: { contracts: [], settings: { approvalRules: [RULE] } },
    _audit: audit,
    ...over });
}

describe('F79 — a rejection stays rejected', () => {
  test('the refusal survives the next read of the chain', () => {
    const w = world(ADMIN);
    const c = contract();
    w.rejectApprovalStep(c, 'The liability cap is below our floor.');
    const st = w.approvalState(c);
    assert.equal(st.chain[0].status, 'rejected',
      'the rejection was erased the moment anything looked at the chain');
    assert.equal(st.rejected.length, 1);
    assert.equal(st.ok, false, 'a refused contract is not approved');
  });

  test('the reason the approver gave is kept and shown to the owner', () => {
    const w = world(ADMIN);
    const c = contract();
    w.rejectApprovalStep(c, 'The liability cap is below our floor.');
    assert.equal(w.approvalState(c).chain[0].comment, 'The liability cap is below our floor.');
    const panel = w.approvalPanelHtml(c);
    assert.match(panel, /refused/i, 'the panel does not say the step was refused');
    assert.match(panel, /liability cap is below our floor/,
      'the reason was captured and then never shown to the person who has to act on it');
  });

  test('and the owner is given a way back', () => {
    const w = world(LEGAL);
    const c = contract();
    world(ADMIN).rejectApprovalStep(c, 'Cap too low.');
    assert.match(w.approvalPanelHtml(c), /send back for approval/i,
      'a refused contract is a dead end for its owner');
    assert.equal(w.resubmitApproval(c, 'Cap raised to KES 10M.'), true);
    const st = w.approvalState(c);
    assert.equal(st.chain[0].status, 'pending', 'resubmission puts it back in front of the approver');
    assert.equal(st.rejected.length, 0);
    assert.ok(w._audit.some(a => /resubmit/i.test(a.action)),
      'a resubmission that leaves no trace cannot be read back as "approved on the second ask"');
  });

  test('a viewer cannot resubmit', () => {
    const w = world({ id: 'u_v', name: 'Read Only', role: 'viewer' });
    const c = contract();
    world(ADMIN).rejectApprovalStep(c, 'no');
    assert.equal(w.resubmitApproval(c), false);
    assert.equal(w.approvalState(c).chain[0].status, 'rejected');
  });
});

describe('F79 — a sign-off covers the contract it was given for', () => {
  test('approving records what was approved', () => {
    const w = world(ADMIN);
    const c = contract();
    w.approveContract(c);
    const st = w.approvalState(c);
    assert.equal(st.ok, true);
    assert.ok(st.chain[0].stamp, 'an approval that records nothing cannot go stale');
    assert.equal(st.chain[0].stamp.value, 6000000);
  });

  test('moving the value after sign-off invalidates it', () => {
    const w = world(ADMIN);
    const c = contract();
    w.approveContract(c);
    c.value = 60000000;                        // what the key-terms field does
    const st = w.approvalState(c);
    assert.equal(st.ok, false,
      'a ten-fold increase kept its old approval and left signing unlocked');
    assert.equal(st.chain[0].status, 'stale');
    assert.match(st.stale[0].drift.join(' '), /value changed/);
  });

  test('rewriting the contract after sign-off invalidates it too', () => {
    const w = world(ADMIN);
    const c = contract();
    w.approveContract(c);
    c.redlineText = 'Payment within one hundred and eighty (180) days.';
    const st = w.approvalState(c);
    assert.equal(st.ok, false, 'the wording moved under an approval that stayed green');
    assert.match(st.stale[0].drift.join(' '), /wording changed/);
  });

  test('an untouched contract keeps its approval', () => {
    const w = world(ADMIN);
    const c = contract();
    w.approveContract(c);
    c.lastAction = '28 Jul 2026';              // bookkeeping is not a change of terms
    assert.equal(w.approvalState(c).ok, true,
      'the stamp is so tight that ordinary use re-opens approvals');
  });

  test('a contract approved before stamps existed is not invalidated retroactively', () => {
    const w = world(ADMIN);
    const c = contract({ approvalChain: [{ ruleId: 'r-spend', name: 'Value ≥ KES 5M',
      approver: RULE.approver, order: 1, status: 'approved', by: 'Amina Otieno',
      at: '2026-01-01T00:00:00.000Z', comment: null }] });
    assert.equal(w.approvalState(c).ok, true,
      'every historical approval in the workspace was voided by the upgrade');
  });

  test('re-approving after the change clears it', () => {
    const w = world(ADMIN);
    const c = contract();
    w.approveContract(c);
    c.value = 60000000;
    w.approveContract(c);
    assert.equal(w.approvalState(c).ok, true);
    assert.equal(w.approvalState(c).chain[0].stamp.value, 60000000);
  });
});

describe('F79 — the readiness list knows about approval', () => {
  /* contractReadiness lives in js/core.js and is what the share dialog draws
     its "Not ready to send" panel from. It listed the counterparty, the value
     and unfilled placeholders, and said nothing at all about approval. */
  function readiness(c, approval) {
    const sb = loadViews(['js/obligations.js'], {
      state: { contracts: [], settings: {} },
      approvalState: () => approval,
      isMonetary: x => x.valueType !== 'none',
      isUpload: () => false,
      docBody: () => '<p>ok</p>',
      readOnlyDocHtml: h => h,
      contractPlaceholders: () => [],
      SIGN_ROUTE_ON: false,
    });
    // contractReadiness is a pure read; lift it out of core.js without dragging
    // the whole module's boot sequence into the sandbox
    const src = require('node:fs').readFileSync(require('node:path')
      .join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const body = src.slice(src.indexOf('function contractReadiness(c){'));
    require('node:vm').runInContext(body.slice(0, body.indexOf('\nconst readinessBlocks')), sb,
      { filename: 'core-readiness' });
    return sb.contractReadiness(c);
  }
  const blocks = list => list.filter(x => x.severity === 'block').map(x => x.label).join(' | ');
  const all = list => list.map(x => x.label).join(' | ');

  test('an outstanding approval is named on the list', () => {
    const list = readiness(contract(), { required: true, ok: false, rejected: [], stale: [],
      next: { name: 'Value ≥ KES 5M' }, approverLabel: 'an Admin' });
    assert.match(all(list), /approval/i,
      'the share dialog told the sender nothing about the approval it was skipping');
  });

  test('but waiting on an approver does not block sending a draft to negotiate', () => {
    // approval running in parallel with a first round is the ordinary order of
    // events; an acknowledgement tick for it would teach people to tick them
    const list = readiness(contract(), { required: true, ok: false, rejected: [], stale: [],
      next: { name: 'Value ≥ KES 5M' }, approverLabel: 'an Admin' });
    assert.ok(!/approval/i.test(blocks(list)));
  });

  test('a refusal does block it, and is named as a refusal', () => {
    const list = readiness(contract(), { required: true, ok: false,
      rejected: [{ name: 'Value ≥ KES 5M', by: 'Amina Otieno' }], stale: [], next: null });
    assert.match(blocks(list), /refused/i,
      'a contract an approver has said no to went out with no acknowledgement asked for');
    assert.match(blocks(list), /Amina Otieno/);
  });

  test('so does a sign-off the contract has moved out from under', () => {
    const list = readiness(contract(), { required: true, ok: false, rejected: [],
      stale: [{ name: 'Value ≥ KES 5M', by: 'Amina Otieno' }], next: null });
    assert.match(blocks(list), /needs approving again/i);
  });

  test('a cleared chain says nothing about approval at all', () => {
    const list = readiness(contract(), { required: true, ok: true, rejected: [], stale: [], next: null });
    assert.ok(!/approval/i.test(all(list)), 'an approved contract was reported as not ready');
  });
});
