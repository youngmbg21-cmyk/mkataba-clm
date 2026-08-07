/* F4 — the approvals surface counts the reader's own stake, not the workspace's.

   The redesign replaced the dashboard's "Approvals waiting" list with the
   "Pending approvals" KPI card (see the note above the hero section in
   js/views/home.js): the queue itself lives on the contract's approval chain
   and in the register, and what the dashboard keeps is a count. The reads are
   unchanged — the card is fed by the same reader-scoped myApprovals filter the
   panel used (eligible approver on a pending step, or raised it yourself).

   Two things are being proved:
     · the count is derived only from contracts the reader can act on or
       raised themselves — a stranger's chains do not inflate it;
     · the card carries no contract ids and no amounts at all, with or without
       can_view_values — a count is the whole disclosure.

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
    ROLE_LABEL: { admin: 'Admin', legal: 'Editor', viewer: 'Viewer' },
    cKind: () => 'Contract',
    deviationSummary: () => null,
    openFindings: () => [],
    persist() {}, saveSettings() {}, logAudit() {}, renderSignButton() {}, renderAuditSection() {},
    state: { contracts, settings: { approvalRules: [RULE] }, view: 'dashboard',
      serverStats: { total: contracts.length }, shareOverview: {}, shareByContract: {} },
  });
  sb.renderDashboard();
  const html = sb.document.getElementById('content').innerHTML;
  /* The KPI card is a single <button data-kpi-id="approvals">…</button>, so the
     slice to its closing tag is exactly the card and nothing beside it. */
  const start = html.indexOf('data-kpi-id="approvals"');
  assert.ok(start > 0, 'the Pending approvals card should render');
  return { html, card: html.slice(start, html.indexOf('</button>', start)) };
}

const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
const LEGAL = { id: 'u_legal', name: 'Wanjiku Kamau', role: 'legal' };
const OTHER = { id: 'u_other', name: 'Someone Else', role: 'legal' };

describe('F4 — the count is the reader\'s own', () => {
  test('an eligible approver is counted for the contracts waiting on them', () => {
    // the rule sends ≥5M to an Admin, so both big deals wait on Amina —
    // and MK-3, below the threshold, is in no approval chain at all
    const { card } = render(ADMIN);
    assert.match(card, /2 waiting on you/, 'both big deals wait on this approver');
  });

  test('a non-approver is counted only for the contracts they raised', () => {
    // Wanjiku raised MK-2; it waits on an admin, so it is hers but not on her
    const { card } = render(LEGAL);
    assert.match(card, /0 waiting on you · 1 on others/,
      'her own raised contract counts, a stranger\'s does not');
  });

  test('someone with no stake sees zero, not the workspace\'s number', () => {
    const { card } = render(OTHER);
    assert.match(card, /All clear/, 'a legal user with no stake has nothing pending');
    assert.match(card, /no approval chain is open/);
  });

  test('the card says whose count it is', () => {
    const { card } = render(ADMIN);
    assert.match(card, /waiting on you/);
  });
});

describe('F4 — the card carries no figure and no record, right or no right', () => {
  test('with the right, still no amount and no contract id', () => {
    const { card } = render(ADMIN, { money: true });
    assert.ok(!/KES/.test(card), 'an amount reached the approvals card');
    assert.ok(!/MK-\d/.test(card), 'a contract id reached the approvals card');
  });
  test('without the right, the same', () => {
    const { card } = render({ ...ADMIN, role: 'legal', name: 'Amina Otieno' }, { money: false });
    assert.ok(!/KES/.test(card), 'an amount survived in the approvals card');
    assert.match(card, /1 on others/, 'the contract she raised is still counted');
  });
});
