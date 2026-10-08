/* f587 — A SERVED "LET IT LAPSE" READS BACK LIKE A RECORDED ONE (B10, 8 Oct 2026).
   ============================================================
   The 9 Oct review: a served non-renewal notice read back "Decided by a
   colleague … Decide-by was <the day it was served>" — renewalDecisionOf
   returned `by` as a bare string where the card reads `by.name`, and put the
   service day where the card prints the decide-by. Same shape now: `by` is a
   person, `decideBy` the decide-by date, the service day `servedOn`.
   Run: node --test test/f587-a-served-notice-reads-back-right.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

test('the served reading: by is a person, decideBy the decide-by date, servedOn the day it was served', () => {
  const { win } = buildWorld({ obligations: true, templates: true, templateFields: true, desk: true });
  win.noticeServed = c => (c && c.notice && c.notice.servedOn) ? c.notice : null;
  const c = { id: 'MK-N1', name: 'Distributor Agreement', counterparty: 'Savannah', status: 'Signed',
    execution: { at: new Date().toISOString() }, expiry: isoDay(150), fields: {},
    metadata: { expiryDate: isoDay(150), noticePeriodDays: 90, renewalType: 'auto-renew' },
    notice: { servedOn: isoDay(-1), way: 'email', at: new Date().toISOString(), by: 'Amina Otieno' },
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [] };
  const d = win.renewalDecisionOf(c);
  assert.equal(d.answer, 'lapse');
  assert.deepEqual({ ...d.by }, { name: 'Amina Otieno' }, 'a person, the shape the card reads (by.name)');
  assert.equal(d.decideBy, isoDay(60), 'the decide-by date: expiry less the notice period');
  assert.equal(d.servedOn, isoDay(-1), 'the day it was served is its own fact');
  assert.equal(d.served, true);
  assert.equal(JSON.stringify(c.notice.by), '"Amina Otieno"', 'reading wrote nothing');
});
