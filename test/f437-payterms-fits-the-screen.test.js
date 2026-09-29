/* f437 — PAYMENT TERMS FITS THE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026)
   *"Make the pages fit with a page and for the cards to fit together without
   cards being taller than other cards and not covering spaces fully."* And for
   this tab: *"update fit to screen where the graph is above the what is driving
   the gap card."* The content stays as it was (owner-ruled); only the layout
   moves onto the shared grammar (f433, `.igx-*`):

     the headline figures as one strip of tiles, FIRST;
     "Where the terms sit" full width, ABOVE "What is driving the gap", full width;
     the table's rows scroll INSIDE its card, the head row held at the top;
     the honest limit kept, on one row under the table.

   The 2 Sep pager (ptFitTable / ptPagerHtml) is REVERSED — f267 (15)(19) are
   re-pointed in place. payment-terms-verify measures the real page. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HTML = read('index.html');
const IG = read('js/views/intelligence.js');
const I18N = read('js/i18n.js');
const code = src => src.replace(/\/\*[\s\S]*?\*\//g, '');

const con = (id, days, category, value) => ({
  id, name: id, status: 'Signed', value: value || 1000000, counterparty: id + ' Ltd',
  metadata: { paymentTerms: days + ' days', category, currency: 'KES' },
});
/* Twelve customers paid late and two on time, three suppliers: more rows against
   you than any page the old pager held, so a trim would show. */
const BOOK = [
  ...Array.from({ length: 12 }, (_, i) => con('LATE-' + (i + 1), 60 + i * 5, 'customer')),
  con('ONTIME-1', 20, 'customer'), con('ONTIME-2', 30, 'customer'),
  con('SUPP-SOON', 10, 'supplier'), con('SUPP-OK', 45, 'supplier'), con('SUPP-LATE', 90, 'supplier'),
];

function paint(contracts) {
  const w = buildWorld({ intelView: true });
  const win = w.win;
  win.state = Object.assign({}, win.state || {}, { contracts });
  win.intel.ptCut = { side: null, bucket: null };
  const doc = win.document;
  const host = doc.createElement('div');
  host.id = 'ig-pt-body';
  host.className = 'scroll-thin igx-host';
  host.innerHTML = win.intelPayTermsHtml();
  doc.body.appendChild(host);
  return { win, doc, host, fit: doc.getElementById('ig-pt'), d: win.payTermsData() };
}

test('1. the tab is ONE grid the height of the screen: figures, chart, table, the honest limit', () => {
  const { fit } = paint(BOOK);
  assert.ok(fit, 'the tab drew');
  assert.ok(fit.classList.contains('igx-fit'), 'the shared grid (.igx-fit), exactly the host\'s height');
  const rows = (fit.getAttribute('style') || '').match(/--igx-rows:([^;"]+)/);
  assert.ok(rows, 'it says how the height is shared');
  const tracks = rows[1].trim().split(/\s+(?![^(]*\))/);
  assert.equal(tracks.length, 4, rows[1]);
  assert.equal(tracks[0], 'auto', 'the figures take their own height');
  assert.match(tracks[1], /\.85fr\)$/, 'the chart about 0.85 of what is left');
  assert.match(tracks[1], /^minmax\(min-content,/, 'and never squeezed below its own drawing');
  assert.match(tracks[2], /^minmax\(0,1\.15fr\)$/, 'the table about 1.15, free to shrink because its rows scroll');
  assert.equal(tracks[3], 'auto', 'the honest limit takes its own height');
});

test('2. the headline figures come FIRST, as the grammar\'s tiles, and say what the reading counted', () => {
  const { fit, d, win } = paint(BOOK);
  const first = fit.children[0];
  assert.ok(first.classList.contains('igx-figs'), 'the strip leads the page');
  assert.match(first.getAttribute('style') || '', /--igx-n:4/);
  const tiles = Array.from(first.children);
  assert.equal(tiles.length, 4);
  tiles.forEach(t => assert.ok(t.classList.contains('igx-fig'), 'every figure is the one tile'));
  const txt = tiles.map(t => t.textContent.replace(/\s+/g, ' ').trim());
  assert.match(txt[0], new RegExp(win.i18t('pt_we_wait') + '.*\\b' + d.customer.avgDays + '\\b', 'i'));
  assert.match(txt[1], new RegExp(win.i18t('pt_we_pay') + '.*\\b' + d.supplier.avgDays + '\\b', 'i'));
  assert.match(txt[2], new RegExp(win.i18t('pt_the_gap') + '.*\\b' + Math.abs(d.gap) + '\\b', 'i'));
  assert.ok(tiles.slice(0, 3).every(t => t.tagName === 'DIV'), 'the three readings are figures, not doors');
});

test('3. the fourth figure is the table\'s OWN count, and the table\'s own door', () => {
  const { fit, d, doc } = paint(BOOK);
  const tile = fit.children[0] && fit.children[0].children[3];
  assert.ok(tile, 'there is a fourth figure');
  const n = (d.against || []).length;
  assert.ok(n > 6, 'the book puts more against you than a page once held');
  assert.equal(tile.tagName, 'BUTTON');
  assert.ok(tile.hasAttribute('data-pt-all'));
  assert.equal(tile.querySelector('.igx-fig-n').textContent.trim(), String(n), 'the figure is `against`');
  const chip = doc.getElementById('ig-pt-table').textContent;
  assert.ok(chip.includes(String(n)), 'the same number the table\'s own chip prints');
  /* A zero is not a door. */
  const calm = paint([con('OK-1', 20, 'customer'), con('OK-2', 60, 'supplier')]);
  const calmTile = calm.fit.children[0] && calm.fit.children[0].children[3];
  assert.ok(calmTile, 'the fourth figure is drawn on a calm book too');
  assert.equal((calm.d.against || []).length, 0);
  assert.equal(calmTile.tagName, 'DIV', 'with nothing against you it is a figure, not a button');
});

test('4. pressing it puts the whole list in front of the reader', () => {
  const { win, doc, d } = paint(BOOK);
  win.intel.ptCut = { side: 'supplier', bucket: null };
  win.ptRepaint();
  const narrowed = doc.querySelectorAll('#ig-pt-rows [data-pt-open]').length;
  assert.ok(narrowed < d.against.length, 'the control: a cut narrows the table');
  const door = doc.querySelector('[data-pt-all]');
  assert.ok(door, 'the figure is a door');
  door.click();
  assert.equal(win.intel.ptCut.side, null, 'the cut is cleared');
  assert.equal(doc.querySelectorAll('#ig-pt-rows [data-pt-open]').length, d.against.length, 'every row is back');
  assert.equal(doc.activeElement && doc.activeElement.getAttribute('data-pt-open'), d.against[0].id,
    'and the first row holds the focus');
});

test('5. the chart sits ABOVE the table, both full width, and the plot grows to fill its card', () => {
  const { fit } = paint(BOOK);
  const kids = Array.from(fit.children);
  const chart = kids.findIndex(k => k.id === 'ig-pt-chart');
  const table = kids.findIndex(k => k.id === 'ig-pt-table');
  assert.equal(chart, 1, 'the chart card follows the figures');
  assert.equal(table, 2, 'the table card follows the chart');
  [kids[chart], kids[table]].forEach(k => {
    assert.ok(k.classList.contains('igx-card'), k.id + ' is the grammar\'s card');
    assert.equal(k.parentNode, fit, k.id + ' is a cell of the one-column grid itself, never half a row');
  });
  assert.ok(!fit.querySelector('.igx-row'), 'no row splits the width');
  const img = kids[chart].querySelector('[role="img"]');
  assert.ok(img.classList.contains('igx-fill'), 'the drawing takes the card\'s spare height');
  const plot = img.firstElementChild;
  assert.ok(plot.classList.contains('pt-plot'), 'the plot is the part that grows');
  assert.doesNotMatch(plot.getAttribute('style') || '', /height:\s*\d/, 'no typed height on the plot');
  assert.equal(plot.querySelectorAll('[data-pt-bar]').length, 10, 'and every bar is still there');
});

test('6. the table\'s rows scroll INSIDE its card, the head row held at the top, nothing paged or trimmed', () => {
  const { doc, d } = paint(BOOK);
  const rows = doc.getElementById('ig-pt-rows');
  assert.ok(rows.classList.contains('igx-scroll'), 'the rows region is the card\'s scroller');
  assert.ok(rows.firstElementChild.classList.contains('pt-head'), 'the head row is INSIDE the scroller, first');
  assert.equal(rows.querySelectorAll('[data-pt-open]').length, d.against.length, 'every row drawn');
  assert.equal(doc.querySelectorAll('[data-pt-page]').length, 0, 'no pager');
  assert.match(doc.getElementById('ig-pt-table').textContent, /Each row opens its contract\./,
    'and the card still says what a row does');
});

test('7. the honest limit stays, every word of it, on one row under the table', () => {
  const { fit, win } = paint(BOOK);
  const last = fit.children[fit.children.length - 1];
  assert.equal(last.id, 'ig-pt-blind');
  const t = last.textContent;
  ['pt_blind_title', 'pt_blind_1', 'pt_blind_2', 'pt_method'].forEach(k =>
    assert.ok(t.includes(win.i18t(k).slice(0, 40)), k + ' is on the page'));
});

/* The region of HaTi's own sheet that carries this tab's additions — pinned by
   its heading, never a byte count. */
function ptCss() {
  const a = HTML.indexOf('INSIGHTS · PAYMENT TERMS FITS THE SCREEN');
  assert.ok(a > 0, 'the tab\'s own block is in the stylesheet');
  const b = HTML.indexOf('/* map graph (folder view) */', a);
  assert.ok(b > a);
  return code(HTML.slice(HTML.lastIndexOf('/*', a), b));
}

test('8. the scoped rules: the head sticks, the plot grows, a sentence wraps, the narrow window keeps 168px', () => {
  const css = ptCss();
  assert.match(css, /#ig-pt-body \.pt-head\{[^}]*position:sticky;top:0/);
  assert.match(css, /#ig-pt-body \.pt-head\{[^}]*background:var\(--color-surface\)/, 'rows pass UNDER it, not through it');
  assert.match(css, /#ig-pt-body \.pt-plot\{flex:1 1 \d+px;min-height:\d+px\}/);
  assert.match(css, /#ig-pt-body \.igx-fig-s\{white-space:normal\}/, 'a sub-line is never cut to an ellipsis');
  const narrow = css.match(/@media \(max-width:1079px\)\{([\s\S]*?)\n\s*\}/);
  assert.ok(narrow, 'the narrow window has its own lines');
  assert.match(narrow[1], /\.pt-plot\{flex-basis:168px\}/);
  assert.doesNotMatch(css, /!important/);
  assert.ok(css.split('\n').filter(l => /\{/.test(l)).every(l => /#ig-pt-body|@media/.test(l)),
    'every rule is scoped to this tab: the shared grammar is untouched');
});

test('9. the pager and its measuring are gone, not left behind', () => {
  const src = code(IG);
  ['ptFitTable', 'ptPagerHtml', 'PT_PAGE_MIN', '_ptPageSize', 'ptPage', 'data-pt-page']
    .forEach(k => assert.ok(!src.includes(k), k + ' is gone'));
  assert.match(src, /ptCut:\{ side:null, bucket:null \},\n/, 'the cut stays, per sitting and in memory');
});

test('10. the new words are in both books exactly once', () => {
  ['pt_fit_drive_t', 'pt_fit_drive_s_one', 'pt_fit_drive_s_other'].forEach(k => {
    const hits = [...I18N.matchAll(new RegExp('^\\s*' + k + ": '", 'gm'))];
    assert.equal(hits.length, 2, k);
  });
});
