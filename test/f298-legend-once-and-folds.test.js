/* f298 — THE GRAPH'S LEGEND: A LENS IS ADDED ONCE, THE PAPER SENTENCE IS GONE,
   AND THE LEGEND FOLDS (owner-asked 11 Sep 2026, off two screenshots: the
   legend's "What the paper says, not what was invoiced." ringed, and a dock
   carrying seven identical "Drafting · 77" chips after pressing the legend
   seven times). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
const I18N = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

function world() {
  const w = buildWorld({ intelView: true });
  /* This world carries no core.js, so `state` is set on the window the way
     f247 and f291 set it — the view reads it as a bare global. */
  w.win.state = { contracts: [
    { id: 'MK-1', name: 'A', status: 'Draft', counterparty: 'X', folder: 'proc', value: 10 },
    { id: 'MK-2', name: 'B', status: 'Draft', counterparty: 'Y', folder: 'proc', value: 20 },
    { id: 'MK-3', name: 'C', status: 'Signed', counterparty: 'Z', folder: 'sales', value: 30 },
  ] };
  w.win.eval('intel.lenses=[]; intel.legendFolded=false;');
  return w.win;
}

test('f298 (1) the same cut added three times is ONE lens — same action, label and ids', () => {
  const win = world();
  const lens = () => ({ label: 'Drafting', ids: ['MK-1', 'MK-2'], action: 'filter' });
  win.addLens(lens()); win.addLens(lens()); win.addLens(lens());
  assert.equal(win.eval('intel.lenses.length'), 1);
  assert.equal(win.eval('intel.lenses[0].label'), 'Drafting');
  // the ids' ORDER does not make a different cut
  win.addLens({ label: 'Drafting', ids: ['MK-2', 'MK-1'], action: 'filter' });
  assert.equal(win.eval('intel.lenses.length'), 1, 'reordered ids are the same set');
});

test('f298 (2) a second press turns a switched-off lens back on rather than stacking a twin', () => {
  const win = world();
  win.addLens({ label: 'Drafting', ids: ['MK-1', 'MK-2'] });
  win.eval('intel.lenses[0].on=false');
  win.addLens({ label: 'Drafting', ids: ['MK-1', 'MK-2'] });
  assert.equal(win.eval('intel.lenses.length'), 1);
  assert.equal(win.eval('intel.lenses[0].on'), true);
});

test('f298 (3) CONTROL — a different cut is still a second lens: another label, another set, or another action', () => {
  const win = world();
  win.addLens({ label: 'Drafting', ids: ['MK-1', 'MK-2'] });
  win.addLens({ label: 'Executed', ids: ['MK-3'] });
  win.addLens({ label: 'Drafting', ids: ['MK-1'] });
  win.addLens({ label: 'Drafting', ids: ['MK-1', 'MK-2'], action: 'highlight' });
  assert.equal(win.eval('intel.lenses.length'), 4);
});

test('f298 (4) the rule lives in addLens, the one funnel — the legend press does not dedupe for itself', () => {
  const body = IG.slice(IG.indexOf('function addLens('), IG.indexOf('function parseHorizonDays('));
  assert.match(body, /intel\.lenses\.find\(/, 'the dedupe is inside addLens');
  const legend = IG.slice(IG.indexOf('function renderIntelLegend('), IG.indexOf('const IG_SUGGESTIONS'));
  assert.match(legend, /addLens\(\{label:statusLabel\(s\)/, 'the legend still goes through addLens');
  assert.ok(!/lenses\.find|lenses\.some/.test(legend), 'and carries no dedupe of its own');
});

test('f298 (5) the legend no longer draws the paper sentence, and the key is inert in BOTH books', () => {
  const legend = IG.slice(IG.indexOf('function renderIntelLegend('), IG.indexOf('const IG_SUGGESTIONS'));
  assert.ok(!/int_flow_paper_note/.test(legend), 'the legend does not draw it');
  assert.equal((I18N.match(/^\s*int_flow_paper_note:/mg) || []).length, 2, 'the key stays in both books, inert');
  assert.ok(!/i18t\('int_flow_paper_note'\)/.test(IG), 'nothing else in the file draws it either');
  // the fact is not lost: the hub itself still says "on paper"
  const lines = IG.slice(IG.indexOf('function graphStreamLines('), IG.indexOf('function graphStreamLines(') + 1500);
  assert.match(lines, /int_flow_on_paper/);
});

test('f298 (6) the legend folds to its head: a class flip, per sitting, with the sheet hiding the rest', () => {
  const win = world();
  const d = win.document;
  const host = d.createElement('div'); host.id = 'ig-legend'; d.body.appendChild(host);
  win.renderIntelLegend({ flow: null, edgeKinds: [] });
  const btn = host.querySelector('[data-ig-legend-fold]');
  assert.ok(btn, 'the head carries the fold control');
  assert.equal(btn.getAttribute('aria-expanded'), 'true');
  assert.ok(host.querySelector('[data-igstatus="Draft"]'), 'the rows are there');
  assert.equal(host.classList.contains('is-folded'), false);
  btn.click();
  assert.equal(win.eval('intel.legendFolded'), true, 'per-sitting flag');
  assert.equal(host.classList.contains('is-folded'), true, 'the class is the fold');
  assert.equal(host.querySelector('[data-ig-legend-fold]').getAttribute('aria-expanded'), 'false');
  assert.ok(host.querySelector('[data-ig-legend-head]'), 'the head is still drawn as the way back');
  host.querySelector('[data-ig-legend-fold]').click();
  assert.equal(host.classList.contains('is-folded'), false);
  // the sheet does the hiding — the rows stay in the markup either way
  assert.match(HTML, /#ig-legend\.is-folded > :not\(\[data-ig-legend-head\]\)\{display:none\}/);
  assert.ok(!/legendFolded/.test(fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8')), 'nothing stores it');
  assert.ok(!/localStorage[^\n]*legendFolded|legendFolded[^\n]*localStorage/.test(IG), 'nothing stores it');
});

test('f298 (7) the legend\'s words are in both languages', () => {
  ['int_legend', 'int_legend_hide', 'int_legend_show'].forEach(k =>
    assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'mg')) || []).length, 2, k));
});
