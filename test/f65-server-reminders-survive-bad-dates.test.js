/* ============================================================
   F65 — one badly typed expiry must not switch the reminders off
   ============================================================
   The same fault as F56, on the other side of the wire, and worse there.

   F56 fixed `renewalDecisionDate` in the browser: an expiry typed
   "30 September 2026" made `new Date(expiry + 'T00:00:00')` an Invalid Date,
   and `toISOString()` on an Invalid Date THROWS. The server keeps its own copy
   of that arithmetic — runReminders() computes the renewal-decision deadline as
   expiry minus the notice period — and it was never given the same treatment.

   WHAT A CUSTOMER SEES. Two things, and the second is the one that costs them.

   An admin pressing "run reminders" gets a bare 500 with no explanation of
   which record is wrong or that anything is wrong at all.

   And the sweep runs itself twice a day inside
   `setInterval(() => { try { runReminders(); } catch (e) {} }, …)`. So one
   contract carrying one hand-typed expiry throws, the catch swallows it, and
   EVERY renewal reminder for EVERY contract in the workspace stops going out —
   silently, permanently, with nothing on any screen to say so. The feature the
   product is bought for turns itself off over one field on one record, and the
   first anybody hears of it is a contract that auto-renewed.

   AND THE SILENT HALF. `daysTo` on the same value is NaN rather than a throw,
   and NaN matches no milestone, so the 90/60/30-day expiry warnings for that
   contract were already being skipped without a sound. Obligation due dates go
   down the identical path: an obligation due "31 March 2027" never fires its
   overdue notice, however long ago it fell due.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

/* A day expressed the two ways a portfolio really holds it: the way a date
   picker writes it, and the way a person or a metadata extraction writes it. */
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const isoDay = off => { const d = day(off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const humanDay = off => { const d = day(off); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

describe('F65 — the reminder sweep survives a date a person typed', () => {
  let h, W;
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: 'Cold chain haulage — ' + id, counterparty: 'Savannah Consumer Goods Limited',
    folder: FOLDER_A, status: 'Under Review', fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], ...over } } });
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  const subjects = async () => ((await W.admin.json('/api/outbox')).items || []).map(i => i.subject);

  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a malformed expiry does not take the whole sweep down', async () => {
    await put('MK-BAD', { metadata: { expiryDate: '30 September 2026', noticePeriodDays: 60 } });
    const r = await run();
    assert.equal(r.status, 200,
      'one hand-typed expiry on one contract must not 500 the endpoint — in the '
      + 'twice-daily sweep the same throw is swallowed and every reminder in the '
      + 'workspace stops for good');
  });

  test('and the contracts after it in the portfolio still get theirs', async () => {
    /* Ordered so the malformed record is reached first: the throw escaped the
       loop, so everything behind it was never even looked at. */
    await put('MK-ZZ', { metadata: { expiryDate: isoDay(90), noticePeriodDays: 30 } });
    const r = await run();
    assert.equal(r.status, 200);
    assert.ok((await subjects()).some(s => /Renewal in 90 days: .*MK-ZZ/.test(s)),
      'a contract expiring in exactly 90 days is due its warning whatever another record says');
  });

  test('a hand-typed expiry earns its own milestone rather than being skipped', async () => {
    await put('MK-HUMAN', { metadata: { expiryDate: humanDay(60) } });
    assert.equal((await run()).status, 200);
    assert.ok((await subjects()).some(s => /Renewal in 60 days: .*MK-HUMAN/.test(s)),
      'daysTo returned NaN and NaN matches no milestone, so this warning was '
      + 'silently never sent');
  });

  test('and so does its renewal-decision deadline', async () => {
    // expiry 44 days out, 30 days' notice → the decision is due in 14 days
    await put('MK-DECIDE', { metadata: { expiryDate: humanDay(44), noticePeriodDays: 30 } });
    assert.equal((await run()).status, 200);
    assert.ok((await subjects()).some(s => /Renewal decision due in 14 days: .*MK-DECIDE/.test(s)));
  });

  test('an obligation whose due date a person typed still goes overdue', async () => {
    await put('MK-OBL', { obligations: [{ id: 'ob_1', desc: 'Pay the quarterly minimum',
      due: humanDay(-1), status: 'open' }] });
    assert.equal((await run()).status, 200);
    assert.ok((await subjects()).some(s => /Obligation overdue: .*MK-OBL/.test(s)),
      'the notice that something has been missed is the whole point of tracking it');
  });

  test('a value that is no kind of date is simply not a date — no reminder, no crash', async () => {
    await put('MK-TBC', { metadata: { expiryDate: 'to be confirmed', noticePeriodDays: 30 },
      obligations: [{ id: 'ob_2', desc: 'Review on completion', due: 'on completion of Phase 2', status: 'open' }] });
    const r = await run();
    assert.equal(r.status, 200);
    assert.ok(!(await subjects()).some(s => /MK-TBC/.test(s)),
      'and nothing is invented about a contract whose dates we do not know');
  });
});
