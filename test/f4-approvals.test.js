/* F4 — "Pending approvals" counts the reader's own queue, not the workspace's.

   The redesign took the per-row approvals panel off the dashboard; what remains
   there is the Pending approvals card. The guarantee is unchanged and is what
   this file still proves:
     · the figure counts only contracts the reader can act on (they are an
       eligible approver on a pending step) or raised themselves — never the
       whole workspace's queue;
     · no amount is printed with it, whatever the reader's can_view_values.

   The underlying contract list is already folder-scoped by the server (F1), so
   this is a narrowing of data the reader is entitled to see, not a new
   confidentiality boundary. The per-contract approval chain, with its rows and
   amounts, now lives only on the contract itself (see f79). */
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
  const start = html.indexOf('Pending approvals');
  assert.ok(start > 0, 'the Pending approvals card should render');
  // the card is one <button>; slice to its end so nothing else on the page
  // can satisfy an assertion about it
  const end = html.indexOf('</button>', start);
  return { html, card: html.slice(start, end) };
}

const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
const LEGAL = { id: 'u_legal', name: 'Wanjiku Kamau', role: 'legal' };
const OTHER = { id: 'u_other', name: 'Someone Else', role: 'legal' };

/* The card prints a count, so the queue is read off the figure. MK-3 is below
   the rule threshold and is in no approval chain at all, so it can never be
   counted for anybody — which is what keeps "2" and "1" below meaningful. */
const countOf = card => Number((card.match(/>(\d+)<\/span>/) || [])[1]);

describe('F4 — the queue is the reader\'s own', () => {
  test('an eligible approver is counted the contracts waiting on them', () => {
    // the rule sends ≥5M to an Admin, so both big deals wait on Amina
    const { card } = render(ADMIN);
    assert.equal(countOf(card), 2, 'both contracts waiting on this approver should be counted');
    assert.match(card, /2 waiting on you/, 'and they are named as hers to act on');
  });

  test('a non-approver is counted only the contracts they raised', () => {
    const { card } = render(LEGAL);
    assert.equal(countOf(card), 1, 'Wanjiku raised MK-2, so she should see it sitting in approval');
    assert.match(card, /0 waiting on you · 1 on others/,
      'it is hers to watch, not hers to approve, and the card says which');
  });

  test('someone with no stake sees an empty queue, not the workspace\'s', () => {
    const { card } = render(OTHER);
    assert.equal(countOf(card), 0,
      'a legal user who is neither approver nor author must not be counted the whole queue');
    assert.match(card, /All clear/);
  });

  test('the card says what the figure is', () => {
    const { card } = render(ADMIN);
    assert.ok(card.startsWith('Pending approvals'));
    assert.match(card, /Action required/, 'a non-zero queue has to read as work');
  });
});

describe('F4 — the count carries no amount, with or without the right', () => {
  test('with the right, the card still prints no figure', () => {
    const { card } = render(ADMIN, { money: true });
    assert.ok(!/KES/.test(card), 'the approvals card is a count, not a commercial total');
  });
  test('without it, nothing about the queue leaks an amount', () => {
    // same user, right withdrawn — the queue itself is unchanged
    const { card } = render({ ...ADMIN, role: 'legal', name: 'Amina Otieno' }, { money: false });
    assert.ok(!/KES/.test(card), 'an amount survived on the approvals card');
    assert.equal(countOf(card), 1, 'the contract she raised is still counted');
  });
});
