/* ============================================================
   f617 — the review gate names the change nobody was asked about
   (9 Oct 2026 review)
   ============================================================
   Measured: with the review gate on, Send all refused a brand-new,
   never-reviewed change with "These changes are with <reviewer> for internal
   review…" — the reviewer of an OLD request still open on another change — and
   gave no way forward. Now the unasked change is named ("#CHG-002 has not been
   reviewed — ask a colleague…"), a reviewer is named only for the changes
   actually with them, and the refusal carries the Review door.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
  + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';
const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@wanjiru.co.ke' };
const GATE_ON = { reviewGate: { on: true, when: 'always', value: 0 } };
const contract = () => ({ id: 'MK-R1', name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB',
  template: 'WH', status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [],
  versions: [], signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich' });

function world(user){
  const w = buildWorld({ user });
  w.win.state = { settings: GATE_ON, contracts: [] };
  w.win.getUsers = () => [ME, BOSS];
  w.win.userById = id => [ME, BOSS].find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
const mine = (win, c, num, body) => {
  const cl = win.negoClauseList(c).find(x => x.num === num);
  return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', author: ME.name, summary: 'our ask' });
};

test('f617 a new change beside an old open review is named, not passed off as the reviewer\'s', async () => {
  const { win } = world(ME);
  const c = contract(); win.negoInit(c);
  const old = await mine(win, c, '4', '<p>Undisputed invoices are payable within forty-five (45) days.</p>');
  win.reviewAsk(c, { reviewer: BOSS, ids: [old.id], by: ME.name });
  const fresh = await mine(win, c, '6', '<p>Liability is capped at twice the fees paid.</p>');
  const msg = win.reviewGateMessage(c);
  assert.match(msg, new RegExp('^#' + fresh.id + ' has not been reviewed — ask a colleague'), msg);
  assert.ok(!/These changes are with/.test(msg), 'the new change is not said to be with anybody');
  assert.match(msg, /The other change is with/, 'the old one is still said, as the other change');
  let opened = null;
  win.openReviewAskModal = (cc, o) => { opened = o; };
  const act = win.reviewGateAskAction(c);
  assert.ok(act && act.label, 'the refusal carries the Review door');
  act.onClick();
  assert.deepEqual(Array.from((opened && opened.ids) || []), [fresh.id], 'opened on the change nobody was asked about');
});

test('f617 with every change already with the reviewer, the old sentence stands and no door is offered', async () => {
  const { win } = world(ME);
  const c = contract(); win.negoInit(c);
  await mine(win, c, '4', '<p>Undisputed invoices are payable within forty-five (45) days.</p>');
  win.reviewAsk(c, { reviewer: BOSS, by: ME.name });
  assert.match(win.reviewGateMessage(c), /These changes are with/);
  win.openReviewAskModal = () => {};
  assert.equal(win.reviewGateAskAction(c), null);
});
