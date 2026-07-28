/* ============================================================
   F80 — a contract whose term has ended stops reading as live
   ============================================================
   Every stage in this product is something a person did. Somebody drafted it,
   somebody sent it for review, somebody signed it, somebody closed it. One
   stage is not: a contract's term ends because a date went past, with nobody
   pressing anything — and there was no stage for it anywhere.

   WHAT THAT LOOKED LIKE. A supply agreement executed in 2022 for twelve months
   still showed the emerald "Executed" chip in 2026, on the register, on the
   dashboard and at the top of its own workspace. Its full face value was still
   inside the "Active value" figure — the number on the dashboard that answers
   "what is this portfolio worth". And it appeared in none of the expiring
   cards, because "Expiring < 30 / 60 / 90 days" are all `days >= 0`: a contract
   fell out of every one of them on the morning its term ended, which is the day
   somebody most needed to see it. There was no filter, no count and no badge
   anywhere in the product that would surface it.

   The parts were all there. dateOnly normalises a badly typed expiry;
   effectiveExpiry knows that a later amendment moves the term; the register's
   date column already prints "412d ago" in red. Nothing joined them up into a
   stage, so nothing else in the product could read it.

   WHAT IT MUST NOT DO. A draft whose stated end date has passed is a drafting
   problem, not an expired agreement, and labelling it "Expired" would bury live
   work under a word that reads as finished. An expiry that is not a date is
   "we do not know when this ends", which is not a claim that it has ended.
*/
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const vm = require('node:vm');
const { loadViews } = require('./dom');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const day = n => {
  const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function contract(over = {}) {
  return { id: 'MK-1', name: 'Raw Material Supply', counterparty: 'Kabras Sugar',
    folder: 'proc', status: 'Signed', value: 48000000, valueType: 'standard', template: 'RM',
    lastAction: '10 Jul 2026', expiry: day(-400), fields: {}, metadata: {}, audit: [],
    comments: [], signatures: [], obligations: [], rounds: [], versions: [], ...over };
}

/* The derived stage lives in js/core.js beside STATUS_META. It is lifted out
   rather than booted, because core.js builds a whole sample portfolio at load
   time and this is a pure read of one contract. */
function stageWorld(over = {}) {
  const sb = loadViews(['js/obligations.js'], {
    state: { contracts: [], settings: {} },
    effectiveExpiry: c => c.expiry || null,
    daysUntil: iso => Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000),
    STATUS_META: { 'Draft': { label: 'Drafting', bg: '#eceae6', tx: '#5d5d60' },
      'Under Review': { label: 'In Review', bg: '#fbf4e3', tx: '#7d5a14' },
      'Signed': { label: 'Executed', bg: '#e8f4ee', tx: '#1e6b4d' },
      'Declined': { label: 'Closed', bg: '#fdece9', tx: '#8f322b' } },
    ...over });
  const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
  const from = src.indexOf('function contractExpired(c){');
  const to = src.indexOf('\n// ---- Share dispatch traffic lights ----');
  /* `const` at the top of a script is a lexical binding, not a property of the
     global object — the same trap js/core.js documents for canEdit. The module
     itself publishes these through Object.assign(window, …) at the bottom of
     the file; this slice does the equivalent for the part of it under test. */
  vm.runInContext(src.slice(from, to > from ? to : from + 2000)
    + '\nObject.assign(globalThis,{contractStage,contractStatusChip,statusChip});',
    sb, { filename: 'core-stage' });
  return sb;
}

describe('F80 — the badge', () => {
  test('an executed contract whose term has run out reads as Expired', () => {
    const w = stageWorld();
    assert.equal(w.contractExpired(contract()), true);
    assert.equal(w.contractStage(contract()), 'Expired');
    assert.match(w.contractStatusChip(contract()), /Expired/);
  });

  test('one whose term is still running does not', () => {
    const w = stageWorld();
    const live = contract({ expiry: day(30) });
    assert.equal(w.contractExpired(live), false);
    assert.match(w.contractStatusChip(live), /Executed/);
  });

  test('a draft with a stale date is a drafting problem, not an expired deal', () => {
    const w = stageWorld();
    assert.equal(w.contractExpired(contract({ status: 'Draft' })), false);
    assert.equal(w.contractExpired(contract({ status: 'Under Review' })), false);
  });

  test('no recorded term is not a claim that the term ended', () => {
    const w = stageWorld();
    assert.equal(w.contractExpired(contract({ expiry: null })), false);
    assert.equal(w.contractExpired(contract({ expiry: 'Phase 2' })), false,
      'a value that is no kind of date was read as a date twenty-five years ago');
  });

  test('a badly typed expiry is still read as the day it means', () => {
    const w = stageWorld();
    const d = new Date(); d.setFullYear(d.getFullYear() - 2);
    const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
      'August', 'September', 'October', 'November', 'December'];
    const typed = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    assert.equal(w.contractExpired(contract({ expiry: typed })), true,
      `"${typed}" is a perfectly ordinary thing to find in that column`);
  });

  test('an amendment that extended the term keeps the master live', () => {
    // effectiveExpiry is family-aware; the stage has to read it, not c.expiry
    const w = stageWorld({ effectiveExpiry: c => (c.id === 'MK-1' ? day(200) : c.expiry) });
    assert.equal(w.contractExpired(contract()), false,
      'a master agreement extended by an addendum was reported as expired');
  });
});

describe('F80 — the money', () => {
  /* metrics() is what the dashboard's "Active value" card reads. */
  function money(contracts) {
    const sb = loadViews(['js/obligations.js'], {
      state: { contracts, settings: {} },
      effectiveExpiry: c => c.expiry || null,
      daysUntil: iso => Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000),
    });
    const core = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const from = core.indexOf('function contractExpired(c){');
    vm.runInContext(core.slice(from, core.indexOf('\n// ---- Share dispatch traffic lights ----')), sb, { filename: 'core-stage' });
    sb.window.contractExpired = sb.contractExpired;
    const portal = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'portal.js'), 'utf8');
    const mf = portal.indexOf('function metrics(){');
    vm.runInContext(portal.slice(mf, portal.indexOf('\nasync function refreshStats')), sb, { filename: 'portal-metrics' });
    return sb.metrics();
  }

  test('an expired contract is not active value', () => {
    const m = money([
      contract({ id: 'MK-1', value: 48000000, expiry: day(-400) }),
      contract({ id: 'MK-2', value: 36000000, expiry: day(120) }),
    ]);
    assert.equal(m.totalValue, 36000000,
      'a contract that ended over a year ago was still being counted as active value');
    assert.equal(m.expired, 1);
    assert.equal(m.expiredValue, 48000000);
  });

  test('nothing expired leaves the figure exactly as it was', () => {
    const m = money([contract({ value: 48000000, expiry: day(120) })]);
    assert.equal(m.totalValue, 48000000);
    assert.equal(m.expired, 0);
  });
});

describe('F80 — the portfolio figure the server sends', () => {
  let h, W;
  test('the server takes lapsed contracts out of active value and counts them', async () => {
    h = await startHati();
    try {
      const live = fixtureContract('MK-L', 'Live Supply', 'Kabras Sugar', FOLDER_A, 10000000, 'Signed');
      const gone = fixtureContract('MK-G', 'Lapsed Supply', 'Nandi Dairy', FOLDER_A, 25000000, 'Signed');
      const draft = fixtureContract('MK-D', 'Draft Supply', 'Statpack', FOLDER_A, 5000000, 'Draft');
      live.expiry = day(200); gone.expiry = day(-30); draft.expiry = day(-30);
      W = await seedWorkspace(h, { contracts: [live, gone, draft] });
      const stats = await W.admin.json('/api/stats');
      assert.equal(stats.expired, 1, 'the server has no count of lapsed agreements');
      assert.equal(stats.expiredValue, 25000000);
      assert.equal(stats.totalValue, 10000000 + 5000000,
        'a lapsed contract kept its whole value in the portfolio headline figure');
    } finally { await h.stop(); }
  });
});

/* ------------------------------------------------------------------
   The calendar agenda — the screen somebody opens to ask "what is due this
   month". An obligation row named the CONTRACT and repeated its id, and said
   neither what was due nor whose deliverable it was. The workspace panel has
   printed the owner under every obligation all along.
   ------------------------------------------------------------------ */
describe('F80 — the agenda says what is due, and whose it is', () => {
  function agenda(obligations) {
    const sb = loadViews(['js/obligations.js', 'js/views/calendar.js'], {
      state: { contracts: [{ id: 'MK-2', name: 'Nandi Dairy Collection',
        counterparty: 'Nandi Dairy', status: 'Signed', expiry: day(300), obligations }] },
      effectiveExpiry: c => c.expiry || null,
      daysUntil: iso => Math.ceil((new Date(iso + 'T00:00:00') - Date.now()) / 86400000),
      renewalDecisionDate: () => null,
      selectContract() {}, setView() {}, setActiveNav() {},
    });
    sb.renderCalendar();
    const html = sb.document.getElementById('content').innerHTML;
    return html.slice(html.indexOf('Next 60 days'));
  }

  test('an obligation row names the obligation, not just the contract', () => {
    const rows = agenda([{ desc: 'Quarterly volume report', due: day(12),
      assignee: 'Wanjiku Kamau', status: 'open' }]);
    assert.match(rows, /Quarterly volume report/,
      'the agenda listed "Obligation · MK-2" and never said what was due');
  });

  test('and says who owns it', () => {
    const rows = agenda([{ desc: 'Quarterly volume report', due: day(12),
      assignee: 'Wanjiku Kamau', status: 'open' }]);
    assert.match(rows, /Wanjiku Kamau/, 'nothing on the calendar said whose deliverable it was');
  });

  test('an unowned obligation says so rather than saying nothing', () => {
    const rows = agenda([{ desc: 'Insurance certificate', due: day(5), status: 'open' }]);
    assert.match(rows, /unassigned/i,
      '"nobody owns this" is the actionable fact, and it was left blank');
  });
});
