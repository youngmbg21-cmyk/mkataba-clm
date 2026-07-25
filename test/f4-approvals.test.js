/* F4 — "Approvals waiting" shows the reader's own queue, not the workspace's.

   Two things are being proved:
     · the list contains only contracts the reader can act on (they are an
       eligible approver on a pending step) or raised themselves;
     · amounts appear only for a reader with can_view_values.

   The underlying contract list is already folder-scoped by the server (F1), so
   this is a narrowing of data the reader is entitled to see, not a new
   confidentiality boundary. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews } = require('./dom');

const THRESHOLD = 5000000;
const RULE = { id: 'r-spend', name: 'Value ≥ KES 5M', order: 1,
  cond: { type: 'value', op: '>=', value: THRESHOLD }, approver: { kind: 'role', role: 'admin' } };

function contract(id, name, counterparty, value, createdBy) {
  return { id, name, counterparty, folder: 'proc', status: 'Under Review',
    value, valueType: 'standard', template: 'RM', lastAction: '01 Jul 2026', expiry: '2027-06-30',
    audit: [{ at: '2026-07-01T08:00:00.000Z', user: createdBy, action: 'Created', detail: 'x' }],
    approvalChain: null, signatures: [], comments: [], fields: {} };
}

const CONTRACTS = [
  contract('MK-1', 'Big Sugar Deal', 'Kabras Sugar', 40000000, 'Amina Otieno'),
  contract('MK-2', 'Big Milk Deal', 'Nandi Dairy', 30000000, 'Wanjiku Kamau'),
  contract('MK-3', 'Small Carton Order', 'Statpack', 100000, 'Wanjiku Kamau'),
];

function render(user, { money = true, contracts = CONTRACTS } = {}) {
  const sb = loadViews(['js/approvals.js', 'js/views/home.js'], {
    currentUser: () => user,
    canViewValues: () => money,
    ROLE_LABEL: { admin: 'Admin', legal: 'Legal', viewer: 'Viewer' },
    cKind: () => 'Contract',
    deviationSummary: () => null,
    openFindings: () => [],
    persist() {}, saveSettings() {}, logAudit() {}, renderSignButton() {}, renderAuditSection() {},
    state: { contracts, settings: { approvalRules: [RULE] }, view: 'dashboard',
      serverStats: { total: contracts.length }, shareOverview: {}, shareByContract: {} },
  });
  sb.renderDashboard();
  const html = sb.document.getElementById('content').innerHTML;
  const start = html.indexOf('Approvals waiting');
  assert.ok(start > 0, 'the approvals panel should render');
  return { html, panel: html.slice(start) };
}

const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
const LEGAL = { id: 'u_legal', name: 'Wanjiku Kamau', role: 'legal' };
const OTHER = { id: 'u_other', name: 'Someone Else', role: 'legal' };

describe('F4 — the queue is the reader\'s own', () => {
  test('an eligible approver sees the contracts waiting on them', () => {
    // the rule sends ≥5M to an Admin, so both big deals wait on Amina
    const { panel } = render(ADMIN);
    assert.ok(panel.includes('MK-1'), 'a contract waiting on this approver should be listed');
    assert.ok(panel.includes('MK-2'), 'and so should the other one');
    assert.ok(!panel.includes('MK-3'), 'a contract below the rule threshold is not in approval at all');
  });

  test('a non-approver sees only the contracts they raised', () => {
    const { panel } = render(LEGAL);
    assert.ok(panel.includes('MK-2'), 'Wanjiku raised MK-2, so she should see it sitting in approval');
    assert.ok(!panel.includes('MK-1'), 'MK-1 is neither hers nor waiting on her');
  });

  test('someone with no stake sees an empty queue, not the workspace\'s', () => {
    const { panel } = render(OTHER);
    assert.ok(!panel.includes('MK-1') && !panel.includes('MK-2') && !panel.includes('MK-3'),
      'a legal user who is neither approver nor author must not see the whole queue');
    assert.match(panel, /Nothing is waiting on you/);
  });

  test('the panel says whose queue it is', () => {
    const { panel } = render(ADMIN);
    assert.ok(panel.startsWith('Approvals waiting on you'));
  });
});

describe('F4 — amounts follow can_view_values', () => {
  test('with the right, the amount is shown', () => {
    const { panel } = render(ADMIN, { money: true });
    assert.match(panel, /KES 40M/);
  });
  test('without it, the row is there but the amount is not', () => {
    // same user, right withdrawn — the queue itself is unchanged
    const { panel } = render({ ...ADMIN, role: 'legal', name: 'Amina Otieno' }, { money: false });
    assert.ok(!/KES/.test(panel), 'an amount survived in the approvals panel');
    assert.ok(panel.includes('MK-1'), 'the contract she raised is still listed');
  });
});
