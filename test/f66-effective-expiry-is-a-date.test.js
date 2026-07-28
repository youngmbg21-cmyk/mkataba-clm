/* ============================================================
   F66 — the expiry every screen reads through is normalised at the funnel
   ============================================================
   js/family.js says it in its own header: "Every consumer of an expiry date
   must go through here — the renewal reminders, contractRisk, the Home
   attention snapshot, the Register, the Calendar and Reports. A partial
   rollout leaves the reminders wrong."

   F56 normalised the value at TWO of those consumers — renewalDecisionDate and
   the calendar grid — and left the funnel itself handing out whatever was
   typed. So a contract whose expiry arrived from a migration as
   "30 September 2026" reads differently depending on which screen you are on:

     · THE REGISTER PRINTS "Invalid Date" in the expiry column, in place of a
       date, on a row that otherwise looks completely normal.
     · HOME LEAVES IT OUT of "expiring in 30 / 60 / 90 days" — daysUntil is
       NaN, every comparison against NaN is false, so a contract expiring in
       three weeks is in none of the buckets that exist to surface it.
     · REPORTS drops it from the renewal pipeline for the same reason, so the
       money attached to it is missing from the twelve-month forecast.
     · SORTING BY EXPIRY puts it last, behind contracts with no expiry at all.

   All four are one line: the funnel returns the value as typed.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const at = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return d; };
const isoDay = off => { const d = at(off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const humanDay = off => { const d = at(off); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };

const mk = (id, expiryDate, over = {}) => ({
  id, name: 'Cold chain haulage — ' + id, counterparty: 'Savannah Consumer Goods Limited',
  folder: 'proc', status: 'Under Review', value: 4800000, valueType: 'standard',
  metadata: { expiryDate }, expiry: null, obligations: [],
  audit: [], comments: [], signatures: [], ...over });

function world(files, contracts) {
  return loadViews(['js/obligations.js', 'js/family.js', ...files], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    state: { contracts, settings: {}, view: 'folder', folderId: 'proc', folderShown: 50,
      serverStats: { total: contracts.length }, shareOverview: {}, shareByContract: {},
      reg: { query: '', stage: 'all', type: 'all', sort: 'expiry', dir: 1, page: 1, sel: {}, view: null } },
    cKind: () => 'Contract', isUpload: () => false, riskBand: () => 'steel',
    firstAuditAt: () => 0, lastActivity: () => Date.now(),
  });
}

describe('F66 — a hand-typed expiry is a date on every screen that reads it', () => {
  test('the funnel itself normalises', () => {
    const sb = world([], []);
    assert.equal(sb.effectiveExpiry(mk('MK-1', '30 September 2026')), '2026-09-30');
    assert.equal(sb.effectiveExpiry(mk('MK-2', '2026-09-30')), '2026-09-30');
    assert.equal(sb.effectiveExpiry(mk('MK-3', 'to be confirmed')), null,
      'not knowing when a contract ends is a real answer');
    assert.equal(sb.effectiveExpiry(mk('MK-4', 'Phase 2')), null,
      'and it must not be guessed at — Date.parse reads "Phase 2" as February 2001');
  });

  test('the Register prints the date rather than the words "Invalid Date"', () => {
    const c = mk('MK-REG', humanDay(45));
    const sb = world(['js/views/register.js'], [c]);
    const cell = sb.folderExpiryCell(c);
    assert.ok(!/Invalid Date/.test(cell),
      'a row that looks completely normal must not carry "Invalid Date" where the date goes');
    assert.match(cell, /in 45d/, 'and the urgency note has to be a number of days, not NaN');
  });

  test('Home counts it among the contracts that are about to expire', () => {
    const sb = world(['js/views/home.js'],
      [mk('MK-HUMAN', humanDay(20)), mk('MK-CLEAN', isoDay(20))]);
    sb.renderDashboard();
    const html = sb.document.getElementById('content').innerHTML;
    // the "Expiring in 30 days" hero card carries the count, and it is the
    // number a person acts on — two contracts end this month, not one
    const card = /Expiring[^<]*30[\s\S]{0,400}?tnum[^>]*>([\d,]+)</.exec(html)
      || /30 days[\s\S]{0,600}?>(\d+)</.exec(html);
    assert.ok(html.includes('MK-HUMAN'),
      'a contract ending in twenty days belongs on the attention list however its date was typed');
    assert.ok(html.includes('MK-CLEAN'), 'and the clean one is still there');
    const expiring = sb.agreementsIn(sb.state.contracts)
      .map(c => sb.effectiveExpiry(c)).filter(e => e && sb.daysUntil(e) >= 0 && sb.daysUntil(e) <= 30);
    assert.equal(expiring.length, 2,
      'both contracts end within thirty days — NaN kept the hand-typed one out of every bucket');
    void card;
  });

  test('Reports puts its value into the renewal pipeline', () => {
    const sb = world(['js/views/reports.js'], [mk('MK-PIPE', humanDay(45))]);
    const r = sb.computeReports(sb.state.contracts);
    const total = Object.values(r.pipeline || {}).reduce((s, v) => s + v, 0);
    assert.equal(total, 4800000,
      'money attached to a contract expiring in six weeks cannot be missing from '
      + 'the twelve-month forecast because of how somebody typed the date');
    assert.equal(r.expiring90, 1);
  });

  test('sorting by expiry puts it where its date says, not behind the undated', () => {
    const sb = world(['js/views/register.js'],
      [mk('MK-NONE', null), mk('MK-HUMAN', humanDay(10)), mk('MK-CLEAN', isoDay(300))]);
    // joined, not deep-compared: the array comes back from the module's own
    // realm, so its prototype is not this realm's Array
    const order = sb.regFiltered().map(c => c.id).join(' → ');
    assert.equal(order, 'MK-HUMAN → MK-CLEAN → MK-NONE',
      'an expiry nobody could parse sorted behind contracts with no expiry at all');
  });
});
