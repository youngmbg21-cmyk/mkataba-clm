/* ============================================================
   f440 — the negotiator follows the signing on the link they know
   ============================================================
   Young, 30 Sep 2026, agreeing that "the negotiator is not always the
   signer" and asking for the small fix: a signing link still goes to each
   named signer and still retires the negotiation link — but that link is no
   longer shut with "a newer version was sent to you". It says signing has
   started, and its Signing tab follows the order, live.

     (1) the server sends the order to a negotiation link that signing
         retired — names, sides, capacities, signed or not, the day each of
         their side's signing links went out — and no address;
     (2) which row is THEM is asked by the link's own stored address; a
         negotiator who does not sign is no row;
     (3) a negotiation link signing has not retired still carries no order;
     (4) their page: no "older copy" banner, the read-only line says signing
         has started, the bell's row is a door onto the Signing tab, and the
         Signing tab draws the order with "Signing link sent" and their turn
         pointing at their own signing link. Nothing can be signed there. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildPortal, sharePayloadFor } = require('./portalworld');

const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const ROUTE = [
  { id: 'sg-us-1', party: 'internal', order: 1, name: 'Amina Otieno', role: 'Director',
    email: 'admin@example.co.ke', memberId: 'u_admin', signed: false },
  { id: 'sg-cp-1', party: 'counterparty', order: 2, name: 'Grace Njeri', role: 'Director',
    email: 'grace@client.co.ke', signed: false },
];

describe('f440 (1)–(3) — the server', () => {
  let h, W;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    const c = fixtureContract('MK-SF1', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC);
    c.signerPlan = ROUTE.map(r => ({ ...r }));
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });
  const payload = purpose => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
    at: new Date().toISOString(), docHash: 'h1', purpose, purposeChosen: purpose,
    contract: { id: 'MK-SF1', name: 'Supply Agreement', counterparty: 'Juno Limited', fields: {},
      redlineText: DOC, format: 'text', docText: DOC, versions: [] } });
  const mint = (purpose, who, signerId) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payload(purpose), channel: 'link', purpose, signerId, recipient: who } });
  const open = async token => h.client('them-' + token.slice(0, 6)).json('/api/shares/' + token);
  let negoSigner, negoLawyer;

  test('(3) before any signing link, a negotiation link carries no order', async () => {
    negoSigner = await mint('negotiate', { name: 'Grace Njeri', email: 'Grace@Client.co.ke' });
    negoLawyer = await mint('negotiate', { name: 'Peter Law', email: 'peter@lawfirm.co.ke' });
    const d = await open(negoSigner.token);
    assert.equal(d.signingOrder, null);
    assert.equal(d.superseded, null);
  });
  test('(1) once a signing link goes out, the negotiation link follows the order — with no address', async () => {
    await new Promise(r => setTimeout(r, 1100));      // created_at is to the second
    await mint('sign', { name: 'Grace Njeri', email: 'grace@client.co.ke' }, 'sg-cp-1');
    const d = await open(negoSigner.token);
    assert.equal(d.superseded && d.superseded.reason, 'signing-link-issued');
    const o = d.signingOrder;
    assert.ok(Array.isArray(o), JSON.stringify(d).slice(0, 200));
    assert.deepEqual(o.map(st => st.rows.map(r => r.name)), [['Amina Otieno'], ['Grace Njeri']]);
    assert.ok(o[1].rows[0].linkAt, 'their row says when its signing link went out');
    assert.equal(o[0].rows[0].linkAt, null, 'our own signer is not given a link date');
    const raw = JSON.stringify(o);
    assert.ok(!/@/.test(raw), 'no address: ' + raw);
    assert.ok(!/sg-|u_admin|memberId|email|"id"/.test(raw), 'no ids or address keys: ' + raw);
  });
  test('(2) the row that is THEM is found by the link\'s own address; a negotiator who does not sign is no row', async () => {
    const mine = (await open(negoSigner.token)).signingOrder.flatMap(st => st.rows);
    assert.deepEqual(mine.map(r => r.you), [false, true], 'the negotiator is Grace, who signs');
    const law = (await open(negoLawyer.token)).signingOrder.flatMap(st => st.rows);
    assert.deepEqual(law.map(r => r.you), [false, false], 'Peter negotiated and does not sign');
  });
});

/* ---------------------------------------------------------------- (4) */
const CHANGE = {
  id: 'CHG-001', clauseId: 'c1', clauseLabel: 'Clause 1 · Payment', changeType: 'modify', type: 'modify',
  status: 'accepted', oldText: 'Payable within thirty (30) days.', newText: 'Payable within sixty (60) days.',
  ops: [{ op: 'del', text: 'thirty (30)' }, { op: 'ins', text: 'sixty (60)' }], authorSide: 'owner', author: 'Young Mbagaya',
};
function theirPage(order) {
  const p = buildPortal();
  const c = { id: 'MK-500', name: 'Supply Agreement', counterparty: 'Nordkust Industri AB', template: 'RM',
    status: 'Under Review', folder: 'proc', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], format: 'text', redlineText: 'Clause 1\n\nPayable within sixty (60) days.', changes: [CHANGE] };
  const payload = sharePayloadFor(p, c);
  payload.purpose = 'negotiate'; payload.purposeChosen = 'negotiate';
  p.win.renderSharePortal(payload, { token: 't', share: { recipientName: 'Erik Lindqvist' },
    superseded: { at: '2026-09-30T08:00:00.000Z', reason: 'signing-link-issued' }, signingOrder: order });
  const d = p.win.document;
  return { p, win: p.win, d, $: s => d.querySelector(s) };
}
const ORDER = you => [
  { step: 1, rows: [{ side: 'ours', party: 'Highland Corporate Ltd', name: 'Wanjiru Kamau', title: 'Director',
    signed: true, at: '2026-09-30T09:00:00.000Z', you: false, linkAt: null }] },
  { step: 2, rows: [{ side: 'theirs', party: 'Nordkust Industri AB', name: 'Erik Lindqvist', title: 'CEO',
    signed: false, at: null, you, linkAt: '2026-09-30T08:00:00.000Z' }] },
];
const press = async (v, sel) => { v.$(sel).dispatchEvent(new v.win.Event('click', { bubbles: true }));
  for (let i = 0; i < 12; i++) await Promise.resolve(); };

describe('f440 (4) — their page follows the signing', () => {
  test('no "older copy" banner; the read-only line says signing has started', () => {
    const v = theirPage(ORDER(false));
    assert.equal(v.$('#pt-superseded'), null, 'no "a newer version was sent to you"');
    assert.doesNotMatch(v.d.body.textContent, /newer (version|link) was sent to you/);
    assert.match(v.d.body.textContent, /signing has started/i);
  });
  test('the bell\'s row is a door onto the Signing tab', async () => {
    const v = theirPage(ORDER(false));
    const row = v.$('#pt-alerts-body [data-pt-kind="closed"]');
    assert.ok(row && row.tagName === 'BUTTON', 'a door, not a fact');
    assert.match(row.textContent, /signing has started/i);
  });
  test('the Signing tab draws the order and when each of their links went out', async () => {
    const v = theirPage(ORDER(false));
    await press(v, '#pt-tab-signing');
    const pane = v.$('#pt-sign-pane');
    assert.equal(pane.hidden, false);
    assert.equal(pane.querySelectorAll('.ps-ostep').length, 2, 'both steps');
    assert.match(pane.textContent, /Wanjiru Kamau/);
    assert.match(pane.textContent, /Signing link sent/);
    assert.match(pane.textContent, /Signing for your side: Erik Lindqvist/);
    assert.ok(!pane.querySelector('button#pt-sign, [data-pt-sign]'), 'nothing to sign on this page');
  });
  test('where the negotiator IS the signer, their turn points at their own signing link', async () => {
    const v = theirPage(ORDER(true));
    await press(v, '#pt-tab-signing');
    const pane = v.$('#pt-sign-pane');
    assert.match(pane.textContent, /Your turn — sign on the signing link that was emailed to you/);
    assert.match(pane.textContent, /nothing can be signed on this page/);
  });
  test('Where we are: the wording is agreed and signing is under way', () => {
    const v = theirPage(ORDER(false));
    const steps = [...v.d.querySelectorAll('#pt-where-pane .pw-jst')];
    assert.ok(steps[2].classList.contains('is-done'), 'wording agreed');
    assert.match(steps[3].textContent, /Under way/);
    assert.ok(v.$('#pt-where-pane button.pw-wrow'), 'and the door onto the Signing tab is listed');
  });
});
