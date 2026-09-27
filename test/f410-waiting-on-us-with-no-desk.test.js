/* f410 — "WAITING ON US" COUNTS A NEGOTIATION NOBODY ON OUR SIDE HAS PICKED UP
   (the owner's list, 27 Sep 2026)

   "'The other side is waiting on us' needs an open desk, and a desk opens only
   when somebody on our side files a change or claims it. A negotiation where
   only the other side has filed never counts as waiting on us — on Home, in
   the bell or in the checklist."

   The one reading all three ask is deskStaleInboxFor (js/desk.js). Where no
   desk is open it now reads THEIR pending asks off c.changes raw — on the same
   working-day clock and the same standard — and hands the reminder to the
   person the contract belongs to (contractOwnedBy) and to every admin, never
   to every editor. The line under it says nobody on our side has taken it yet
   (deskStaleSub), never "led by" with no name after it.

   Red at the parent (01bf6cc): (1)(2)(3)(4)(4b)(5). (6) and (7) are CONTROLS —
   a finished negotiation stays quiet, and an open desk keeps its own rule. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const BODY =
  '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
  + '<h2>Clause 2 · Delivery</h2><p>Weekly consignments to the mill gate.</p>'
  + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>';

const ME    = { id: 'u_wanjiru', name: 'Wanjiru Kamau',  role: 'legal', email: 'wanjiru@wanjiru.co.ke' };
const GRACE = { id: 'u_grace',   name: 'Grace Mwangi',   role: 'legal', email: 'grace@wanjiru.co.ke' };
const BOSS  = { id: 'u_boss',    name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
const EVERYONE = [ME, GRACE, BOSS];
const MON = '2026-08-03T09:00:00.000Z', NEXT_MON = '2026-08-10T09:00:00.000Z';

function contract(over = {}){
  return { id: 'MK-Q1', name: 'Cane Supply Agreement',
    counterparty: 'Nordfrakt Logistik AB', template: 'WH', status: 'Under Review',
    folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
    signatures: [], comments: [], value: 4800000, redlineText: BODY, format: 'rich',
    owner: { id: GRACE.id, name: GRACE.name }, ...over };
}
/* The product's own reading of whose a contract is (js/core.js), which this
   stage does not load — taken out of the source, never re-written here. */
const CORE = fs.readFileSync(path.join(__dirname, '..', 'js/core.js'), 'utf8');
const contractOwnedBy = new Function(/function contractOwnedBy\(c,u\)\{[\s\S]*?\n\}/.exec(CORE)[0] + '; return contractOwnedBy;')();
function world(){
  const w = buildWorld({ user: ME });
  w.win.contractOwnedBy = contractOwnedBy;
  w.win.state = { settings: { deskRule: { on: false, staleDays: 5 } }, contracts: [], activeId: null };
  w.win.getUsers = () => EVERYONE;
  w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
  w.win.saveSettings = () => {};
  return w;
}
/* Only THEIR ask is on the table: nobody on our side has filed, so no desk. */
async function onlyTheirs(over){
  const w = world();
  const c = contract(over);
  const cl = w.win.negoClauseList(c).find(x => String(x.num) === '2');
  await w.win.negoEditClause(c, cl.clauseId, '<p>Fortnightly consignments to the mill gate.</p>',
    { side: 'counterparty', author: 'Erik Lindqvist · Nordfrakt Logistik AB', summary: 'their ask', at: MON });
  return { w, c };
}
const count = (win, c, u) => win.deskStaleInboxFor([c], u, NEXT_MON).length;

describe('f410 — waiting on us, where no desk is open', () => {
  test('f410 (1) GATE and fault: only their ask is filed, no desk is open — and five working days is flagged', async () => {
    const { w, c } = await onlyTheirs();
    assert.equal(w.win.deskIsOpen(c), false, 'STAGE: nobody on our side has filed, so no desk');
    const s = w.win.deskStale(c, NEXT_MON);
    assert.ok(s, 'flagged');
    assert.equal(s.days, 5);
    assert.equal(s.n, 1);
    assert.equal(s.unclaimed, true);
    assert.equal(w.win.deskStale(c, '2026-08-07T09:00:00.000Z'), null, 'four working days: still quiet');
  });

  test('f410 (2) the contract\'s owner and an admin are told — a colleague it does not belong to is not', async () => {
    const { w, c } = await onlyTheirs();
    assert.equal(count(w.win, c, GRACE), 1, 'the owner');
    assert.equal(count(w.win, c, BOSS), 1, 'an admin sees the whole board');
    assert.equal(count(w.win, c, ME), 0, 'a reminder addressed to everybody is read by nobody');
  });

  test('f410 (3) with no owner on record, admins alone', async () => {
    const { w, c } = await onlyTheirs({ owner: undefined });
    assert.equal(count(w.win, c, BOSS), 1);
    assert.equal(count(w.win, c, GRACE), 0);
  });

  test('f410 (4) the line under it says nobody on our side has taken it — never "led by" with no name', async () => {
    const { w, c } = await onlyTheirs();
    assert.equal(typeof w.win.deskStaleSub, 'function', 'the one sentence');
    const line = w.win.deskStaleSub(w.win.deskStale(c, NEXT_MON));
    assert.match(line, /nobody on our side has taken it yet/);
    assert.ok(!/led by/.test(line), line);
    const HOME = fs.readFileSync(path.join(__dirname, '..', 'js/views/home.js'), 'utf8');
    const APP = fs.readFileSync(path.join(__dirname, '..', 'js/app.js'), 'utf8');
    assert.match(HOME, /meta:esc\(window\.deskStaleSub\?deskStaleSub\(x\.stale\)/, 'Home\'s card asks it');
    assert.match(APP, /st\.n\?\(window\.deskStaleSub\?deskStaleSub\(st\)/, 'and the bell');
    const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
    assert.equal((I18N.match(/dk_stale_sub_nolead_other:/g) || []).length, 2, 'in both books');
  });

  test('f410 (5) reading the book writes nothing: a record carrying only their asks gains no negotiation', () => {
    const w = world();
    const c = { id: 'MK-Q2', name: 'Lease', counterparty: 'Mombasa Properties', status: 'Under Review',
      owner: { id: GRACE.id, name: GRACE.name }, audit: [],
      changes: [{ id: 'CHG-001', authorSide: 'counterparty', status: 'pending', createdAt: MON, summary: 'their ask' }] };
    const before = JSON.stringify(c);
    assert.equal(count(w.win, c, GRACE), 1, 'counted');
    assert.equal(JSON.stringify(c), before, 'and the record is byte-identical afterwards');
  });

  test('f410 (6) CONTROL: signed, declined or on the shelf, nothing is waiting', async () => {
    for (const over of [{ status: 'Signed' }, { status: 'Declined' }, { archived: { at: MON, by: 'x' } }]) {
      const { w, c } = await onlyTheirs(over);
      assert.equal(count(w.win, c, BOSS), 0, JSON.stringify(over));
    }
  });

  test('f410 (7) CONTROL: once somebody on our side files, the desk\'s own rule answers — its lead, not the owner', async () => {
    const { w, c } = await onlyTheirs();
    const cl = w.win.negoClauseList(c).find(x => String(x.num) === '4');
    await w.win.negoEditClause(c, cl.clauseId, '<p>Undisputed invoices are payable within forty-five (45) days.</p>',
      { side: 'owner', summary: 'our ask' });
    assert.equal(w.win.deskIsOpen(c), true, 'STAGE: our filing opened a desk, led by the filer');
    assert.equal(count(w.win, c, ME), 1, 'the lead');
    assert.equal(count(w.win, c, BOSS), 1, 'an admin');
    assert.equal(count(w.win, c, GRACE), 0, 'the owner is not the lead once somebody leads it');
  });

  test('f410 (4b) and where somebody leads it, the same line names them', async () => {
    const { w, c } = await onlyTheirs();
    const cl = w.win.negoClauseList(c).find(x => String(x.num) === '4');
    await w.win.negoEditClause(c, cl.clauseId, '<p>Undisputed invoices are payable within forty-five (45) days.</p>',
      { side: 'owner', summary: 'our ask' });
    assert.equal(typeof w.win.deskStaleSub, 'function', 'the one sentence');
    assert.match(w.win.deskStaleSub(w.win.deskStale(c, NEXT_MON)), /led by Wanjiru Kamau/);
  });
});
