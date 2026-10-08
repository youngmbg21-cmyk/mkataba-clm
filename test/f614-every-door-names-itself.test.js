/* ============================================================
   f614 — every door on the reading strip names what it does (9 Oct 2026)
   ============================================================
   Measured: a failed Standards check drew its "try again" door with the hover
   "Open the obligations" — ktTriageStripHtml's title fell through to the
   obligations key for every door it did not name. The retry door now says
   "Run this reading again", and no door borrows another's words.
   ============================================================ */
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');

const TEXT = 'SUPPLY AGREEMENT\n1. Scope\nThe Supplier shall deliver the goods.\n2. Payment\nInvoices are payable within 30 days.\n';

test('f614 the retry door says "Run this reading again"; the obligations door keeps its own words', () => {
  const { win } = buildWorld({ triage: true, contractView: true });
  win.FOLDERS = { proc: { name: 'Supply & Logistics' } };
  const c = { id: 'MK-614', name: 'N', counterparty: 'Nordkust', status: 'Under Review',
    source: 'upload', folder: 'proc', owner: { id: 'u1', name: 'Wanjiru Kamau' },
    audit: [], obligations: [], comments: [],
    upload: { name: 's.docx', extractedText: TEXT },
    triage: { at: '2026-09-17T00:00:00.000Z', seenAt: null,
      steps: { playbook: { ok: false, why: 'offline' },
        oblig: { ok: true, found: [{ desc: 'Deliver the goods' }] } } } };
  win.state.contracts = [c];
  const box = win.document.createElement('div');
  box.innerHTML = win.ktTriageStripHtml(c);
  const retry = box.querySelector('[data-kt-tri-go="retry"]');
  assert.ok(retry, 'the failed reading draws its retry door');
  assert.equal(retry.getAttribute('title'), 'Run this reading again');
  const oblig = box.querySelector('[data-kt-tri-go="oblig"]');
  assert.ok(oblig, 'the obligations door is drawn too');
  assert.equal(oblig.getAttribute('title'), 'Open the obligations');
  for (const b of box.querySelectorAll('[data-kt-tri-go]')){
    const kind = b.getAttribute('data-kt-tri-go'), t = b.getAttribute('title');
    if (kind !== 'oblig') assert.notEqual(t, 'Open the obligations', kind + ' does not borrow the obligations door\'s words');
    if (kind === 'retry') assert.equal(t, 'Run this reading again');
  }
});
