/* f650 — THE OVERVIEW'S TERM CELL READS THE END AS AMENDED (overnight run,
   stream S, 9 Oct 2026).

   B13 made the Overview's Expiry cell read the date a SIGNED amendment set and
   name the document ("as amended by MK-201"). The 8 Oct redesign then drew
   only eight terms at rest, and the expiry moved INTO the Term cell — which
   read the record's own c.expiry, so the amended date and its note fell off
   the resting card. The term cell now carries both, and a known end date with
   no start date is drawn alone rather than as a dash.

   Run: node --test test/f650-term-cell-reads-the-amended-end.test.js */
const { test } = require('node:test');
const assert = require('node:assert');
const { buildWorld } = require('./world.js');

const world = amended => {
  const w = buildWorld({ contractView: true, metadata: true });
  w.win.isMonetary = () => true;
  w.win.fmtMoneyOf = () => 'KES 1';
  w.win.effectiveExpiryFrom = () => amended ? { date: '2029-03-31', from: { id: 'MK-201' } } : null;
  w.win.contractRef = c => c.id;
  return w.win;
};
const master = effDate => ({ id: 'MK-200', name: 'Supply', status: 'Signed', value: 1,
  audit: [], obligations: [], comments: [], expiry: '2027-06-30',
  fields: effDate ? { effDate } : {}, metadata: {} });

test('an amended end moves the term cell and names the amendment', () => {
  const win = world(true);
  const cell = win.ktFieldCell(master('2025-01-01'), 'term', false, null);
  assert.ok(/2029/.test(cell[1]) && !/2027/.test(cell[1]), 'the amended end, not the record\'s: ' + cell[1]);
  assert.match(String(cell[2]), /MK-201/);
});

test('with no start date the amended end is drawn alone, never a dash', () => {
  const win = world(true);
  const cell = win.ktFieldCell(master(''), 'term', false, null);
  assert.ok(/2029/.test(cell[1]), 'end date drawn: ' + cell[1]);
  assert.match(String(cell[2]), /MK-201/);
});

test('an unamended contract reads its own dates, with no note', () => {
  const win = world(false);
  const cell = win.ktFieldCell(master('2025-01-01'), 'term', false, null);
  assert.ok(/2027/.test(cell[1]), cell[1]);
  assert.ok(!cell[2], 'no as-amended note');
});
