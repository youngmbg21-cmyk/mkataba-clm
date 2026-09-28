/* f423 — THEIR SIGNING PAGE SHOWS THE WHOLE SIGNING ORDER
   (Young, 28 Sep 2026: "show the full planned order of signers")

   (1)  a SIGN link's GET carries `signingOrder`, read live off the STORED
        route: every step in order, who signs in it, for which side, their
        capacity, whether they have signed, and which row this link is — and
        never an address, a row id or a member id.
   (2)  it is live: a signature on the route since the link went out shows on
        the next open without a new link.
   (3)  a negotiate link carries none.
   (4)  their page draws it as the third stage: the steps in order, "Your turn"
        on their own row, the others waiting, a signed row with its day.
   (5)  a link with no order still says who has signed and "Your turn".
   (6)  every new word is in both books.
   Red at the parent (73e48f0): (1)–(4) and (6). */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { buildPortal, sharePayloadFor, supplyContract } = require('./portalworld');

const I18N = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';
const ROUTE = [
  { id: 'sg-cp-1', party: 'counterparty', order: 1, name: 'Grace Njeri', role: 'Director',
    email: 'grace@client.co.ke', signed: false },
  { id: 'sg-cp-2', party: 'counterparty', order: 2, name: 'Peter Kamau', role: 'CFO',
    email: 'peter@client.co.ke', signed: false },
  { id: 'sg-us-1', party: 'internal', order: 3, name: 'Amina Otieno', role: 'Director',
    email: 'admin@example.co.ke', memberId: 'u_admin', signed: false },
];

describe('f423 (1)–(3) — the server sends the order, and nothing else about the route', () => {
  let h, W, db;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    const { DatabaseSync } = require('node:sqlite');
    db = () => new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const c = fixtureContract('MK-SO1', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC);
    c.signerPlan = ROUTE.map(r => ({ ...r }));
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });
  const payload = purpose => ({ v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
    at: new Date().toISOString(), docHash: 'h1', purpose, purposeChosen: purpose,
    contract: { id: 'MK-SO1', name: 'Supply Agreement', counterparty: 'Juno Limited', fields: {},
      redlineText: DOC, format: 'text', docText: DOC, versions: [] } });
  const mint = (purpose, signerId, who) => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payload(purpose), channel: 'link', purpose, signerId,
    recipient: who || { name: 'Grace Njeri', email: 'grace@client.co.ke' } } });
  const open = async token => h.client('them-' + token.slice(0, 6)).json('/api/shares/' + token);

  test('(1) a sign link carries every step, in order, with who and for whom — and no address', async () => {
    const s = await mint('sign', 'sg-cp-1');
    const d = await open(s.token);
    const o = d.signingOrder;
    assert.ok(Array.isArray(o), JSON.stringify(d).slice(0, 200));
    assert.deepEqual(o.map(st => st.step), [1, 2, 3], 'three steps, numbered from one');
    assert.deepEqual(o.map(st => st.rows.map(r => r.name)), [['Grace Njeri'], ['Peter Kamau'], ['Amina Otieno']]);
    assert.deepEqual(o.map(st => st.rows[0].side), ['theirs', 'theirs', 'ours']);
    assert.equal(o[0].rows[0].party, 'Juno Limited', 'their row names the party it signs for');
    assert.equal(o[1].rows[0].title, 'CFO', 'and the capacity');
    assert.equal(o[0].rows[0].you, true, 'this link is the first row');
    assert.equal(o[1].rows[0].you, false);
    assert.ok(o.every(st => st.rows.every(r => r.signed === false)), 'nobody has signed');
    const raw = JSON.stringify(o);
    assert.ok(!/@/.test(raw), 'no address of anybody\'s: ' + raw);
    assert.ok(!/sg-|u_admin|memberId|email|"id"/.test(raw), 'no row id, member id or address key: ' + raw);
  });

  test('(2) a signature taken since shows on the next open, without a new link', async () => {
    const s = await mint('sign', 'sg-cp-2', { name: 'Peter Kamau', email: 'peter@client.co.ke' });
    const d = db();
    const row = d.prepare('SELECT json FROM contracts WHERE id=?').get('MK-SO1');
    const c = JSON.parse(row.json);
    c.signerPlan[0].signed = true; c.signerPlan[0].at = '2026-09-27T11:02:00.000Z';
    d.prepare('UPDATE contracts SET json=? WHERE id=?').run(JSON.stringify(c), 'MK-SO1');
    d.close();
    const o = (await open(s.token)).signingOrder;
    assert.equal(o[0].rows[0].signed, true, 'the first step reads signed');
    assert.equal(o[0].rows[0].at, '2026-09-27T11:02:00.000Z', 'with its day');
    assert.equal(o[1].rows[0].you, true, 'and this link is the second row');
    assert.equal(o[2].rows[0].signed, false);
  });

  test('(3) a negotiate link carries no order', async () => {
    const s = await mint('negotiate');
    const d = await open(s.token);
    assert.equal(d.signingOrder, null);
  });
});

/* ---------------------------------------------------------------- (4)(5) */
function signingPage(order){
  const p = buildPortal();
  const win = p.win;
  const c = win.migrateContract ? win.migrateContract(supplyContract()) : supplyContract();
  win.negoInit(c);
  c.signatures = [{ party: 'first', name: 'Wanjiru Kamau', title: 'Director', at: '2026-09-27T11:02:00.000Z' }];
  const payload = sharePayloadFor(p, c, {}, { purpose: 'sign' });
  payload.purpose = 'sign'; payload.purposeChosen = 'sign';
  p.open(payload, { purpose: 'sign', signingOrder: order,
    share: { recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordkust.se' } });
  return win.document;
}

test('f423 (4) their page draws the order as the third stage, with their own turn marked', () => {
  const d = signingPage([
    { step: 1, rows: [{ side: 'ours', party: 'Highland Corporate Ltd', name: 'Wanjiru Kamau', title: 'Director',
      signed: true, at: '2026-09-27T11:02:00.000Z', you: false }] },
    { step: 2, rows: [{ side: 'theirs', party: 'Nordkust Industri AB', name: 'Erik Lindqvist', title: 'CEO',
      signed: false, at: null, you: true }] },
    { step: 3, rows: [{ side: 'theirs', party: 'Nordkust Industri AB', name: 'Sara Berg', title: 'CFO',
      signed: false, at: null, you: false }] },
  ]);
  const stage = d.querySelectorAll('.ps-stages > .ps-stage')[2];
  assert.match(stage.querySelector('.ps-st').textContent, /Who signs, in order/);
  const steps = [...stage.querySelectorAll('.ps-ostep')];
  assert.equal(steps.length, 3, 'one line per step');
  assert.deepEqual(steps.map(s => s.querySelector('.ps-on').textContent), ['1', '2', '3']);
  assert.match(steps[0].textContent, /Wanjiru Kamau/);
  assert.match(steps[0].textContent, /Signed/);
  assert.match(steps[1].textContent, /Erik Lindqvist/);
  assert.match(steps[1].textContent, /\(you\)/);
  assert.match(steps[1].textContent, /Your turn/);
  assert.match(steps[1].textContent, /for Nordkust Industri AB/);
  assert.ok(steps[1].classList.contains('is-now'), 'the step in hand is marked');
  assert.match(steps[2].textContent, /Sara Berg/);
  assert.match(steps[2].textContent, /Waiting for the step before/);
  assert.ok(!stage.classList.contains('is-ok'), 'not settled while anybody is still to sign');
});

test('f423 (5) a link with no order still says who has signed and that it is their turn', () => {
  const d = signingPage(null);
  const stage = d.querySelectorAll('.ps-stages > .ps-stage')[2];
  assert.match(stage.querySelector('.ps-st').textContent, /Who has signed/);
  assert.match(stage.textContent, /Wanjiru Kamau/);
  assert.match(stage.textContent, /Your turn/);
  assert.equal(stage.querySelector('.ps-order'), null);
});

test('f423 (6) every new word is in both books', () => {
  for (const k of ['po_stage_order', 'po_stage_signing_now', 'po_stage_waiting', 'po_stage_you_mark',
    'po_stage_for', 'po_stage_step'])
    assert.ok(inBoth(k), k);
});
