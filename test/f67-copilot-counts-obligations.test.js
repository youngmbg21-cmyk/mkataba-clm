/* ============================================================
   F67 — Copilot must not report finished work as outstanding
   ============================================================
   The portfolio snapshot is the paragraph the model answers every
   whole-portfolio question from. Two lines of it were counting the wrong
   things, and both produce a confident, wrong sentence in front of a customer.

   DONE OBLIGATIONS COUNTED AS OPEN. The snapshot filters with `!o.done`. No
   obligation anywhere in the product has a `done` property — completion is
   `o.status === 'done'`, which is what obState(), the workspace list and the
   overdue count all read. So `!o.done` is true for every obligation ever
   recorded, and a customer who has ticked off nine of their ten obligations is
   told by Copilot that ten are open.

   AND OVERDUE ONES COUNTED AS FINE. The overdue test runs `daysUntil` on the
   raw due date, so an obligation dated "31 March 2027" — the shape a Copilot
   scan and a migration spreadsheet both produce — gives NaN, NaN < 0 is false,
   and the one line whose whole job is to raise the alarm reports nothing wrong.
   The same fault F64 fixed on the calendar, on the surface that speaks.
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

const contract = obligations => ({
  id: 'MK-OBS', name: 'Distribution agreement', counterparty: 'Tamu Beverages Ltd',
  folder: 'proc', status: 'Under Review', value: 3200000, valueType: 'standard',
  metadata: {}, expiry: null, audit: [], comments: [], signatures: [], obligations });

function snapshotOf(obligations) {
  const sb = loadViews(['js/obligations.js', 'js/family.js', 'js/ai.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    state: { contracts: [contract(obligations)], settings: {}, view: 'dashboard',
      serverStats: null, shareOverview: {}, shareByContract: {}, aiFeed: [] },
    openFindings: () => [], canViewValues: () => true,
  });
  return sb.aiPortfolioSnapshot();
}
const obligationsLine = s => (s.split('\n').find(l => /^Open obligations/.test(l)) || '');

describe('F67 — the portfolio snapshot counts obligations the way the product does', () => {
  test('an obligation that has been completed is not open', () => {
    const line = obligationsLine(snapshotOf([
      { id: 'a', desc: 'Pay Q1', due: isoDay(30), status: 'done' },
      { id: 'b', desc: 'Pay Q2', due: isoDay(120), status: 'open' },
    ]));
    assert.match(line, /Open obligations: 1\b/,
      'nine of ten ticked off and Copilot still says ten — `!o.done` is true for '
      + 'every obligation this product has ever written');
  });

  test('all of them done means none open, said plainly', () => {
    assert.match(obligationsLine(snapshotOf([
      { id: 'a', desc: 'Pay Q1', due: isoDay(-5), status: 'done' },
    ])), /Open obligations: none recorded\./);
  });

  test('an overdue obligation is reported overdue however its date was typed', () => {
    const line = obligationsLine(snapshotOf([
      { id: 'a', desc: 'Pay Q1', due: humanDay(-40), status: 'open' },
      { id: 'b', desc: 'Pay Q2', due: isoDay(-10), status: 'open' },
    ]));
    assert.match(line, /Open obligations: 2, of which 2 OVERDUE/,
      'the one line whose whole job is to raise the alarm must not go quiet '
      + 'because somebody typed "31 March 2027"');
  });

  test('an obligation with no usable date is open, and not claimed to be overdue', () => {
    /* The line carries an ours/theirs split as well now — see F83, where the
       two became different answers to "what is outstanding". What this test is
       about is unchanged: one open, and the word OVERDUE nowhere near it. */
    const line = obligationsLine(snapshotOf([
      { id: 'a', desc: 'Review on completion', due: 'on completion of Phase 2', status: 'open' },
    ]));
    assert.match(line, /Open obligations: 1\b/);
    assert.ok(!/OVERDUE/.test(line),
      'a date nobody can read is not a deadline anybody has missed');
  });

  test('and the line says which side is outstanding', () => {
    const line = obligationsLine(snapshotOf([
      { id: 'a', desc: 'Pay Q1', due: isoDay(9), status: 'open' },
      { id: 'b', desc: 'Deliver tonnage', due: isoDay(9), status: 'open', party: 'theirs' },
    ]));
    assert.match(line, /1 ours to do, 1 theirs to chase/,
      'a count that mixes our work with theirs is a number nobody can act on');
  });
});

/* The same two mistakes again, on the surface that is hardest to argue with.
   The chart is drawn from live state precisely so the model cannot invent it —
   which means whatever it miscounts is presented to the customer as fact. */
function charts(obligations) {
  const sb = loadViews(['js/obligations.js', 'js/family.js', 'js/aichart.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
    state: { contracts: [contract(obligations)], settings: {}, view: 'dashboard',
      serverStats: null, shareOverview: {}, shareByContract: {} },
  });
  return sb;
}
/* [Overdue, then six months ahead] */
const dueBars = sb => sb.AI_CHART_RECIPES.obligationsDue();

describe('F67 — the obligations chart draws what the workspace shows', () => {
  test('a completed obligation is not drawn as an open one', () => {
    const cfg = dueBars(charts([
      { id: 'a', desc: 'Pay Q1', due: isoDay(20), status: 'done' },
      { id: 'b', desc: 'Pay Q2', due: isoDay(20), status: 'open' },
    ]));
    const total = cfg.data.datasets[0].data.reduce((s, v) => s + v, 0);
    assert.equal(total, 1, 'one is done — a chart that counts it is a chart that lies');
  });

  test('every obligation done means there is nothing to draw, not a full chart', () => {
    assert.equal(dueBars(charts([{ id: 'a', desc: 'Pay Q1', due: isoDay(20), status: 'done' }])), null,
      'null is "there is nothing to draw", which the caller turns into a sentence');
  });

  test('an overdue obligation lands in the Overdue bar however its date was typed', () => {
    const cfg = dueBars(charts([{ id: 'a', desc: 'Pay Q1', due: humanDay(-15), status: 'open' }]));
    assert.equal(cfg.data.labels[0], 'Overdue');
    assert.equal(cfg.data.datasets[0].data[0], 1,
      'daysUntil on "31 March 2027" is NaN, so this bar was empty on a portfolio '
      + 'with overdue obligations in it');
  });

  test('and a hand-typed future date lands in its own month', () => {
    const cfg = dueBars(charts([{ id: 'a', desc: 'Pay Q2', due: humanDay(20), status: 'open' }]));
    assert.equal(cfg.data.datasets[0].data.slice(1).reduce((s, v) => s + v, 0), 1);
    assert.equal(cfg.data.datasets[0].data[0], 0, 'and not in the overdue bar');
  });
});
