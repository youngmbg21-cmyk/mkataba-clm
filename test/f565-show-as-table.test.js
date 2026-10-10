/* f565 — SHOW AS TABLE TURNS EVERY CHART INTO A TABLE (work order "Home
   speed", Part 6, owner-asked 8 Oct 2026: "fix this highlighted button so
   that when you click, it turn the chart to a table")

   The table read each piece's label from an SVG <title> ELEMENT only. The bar
   and month-column charts carry the same "label: count" in a title ATTRIBUTE
   on the button, so they gave no rows: the chart stayed and the button's word
   flipped to "Show as chart" over it.
   (1) bars: one row per piece that has something behind it, in the chart's
       order, each row the piece's own door
   (2) columns (months): the same
   (3) an SVG chart still reads as before
   (4) the button is drawn only where there are rows, and says "Show as chart"
       only while a table is showing

   Run: node --test test/f565-show-as-table.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'homeboard.js'), 'utf8');
const code = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
function region(name){
  const at = code.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = code.indexOf('{', code.indexOf(')', at));
  let d = 0;
  for (let i = open; i < code.length; i++){ if (code[i] === '{') d++; else if (code[i] === '}' && !--d) return code.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}

function stage(){
  const dom = new JSDOM('<!doctype html><body></body>');
  const ctx = { document: dom.window.document,
    _hbE: s => String(s == null ? '' : s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch])),
    _hbN: n => String(n), _hbM: v => 'KES ' + v, i18t: k => k };
  vm.createContext(ctx);
  vm.runInContext(['_hbYAttr', 'hbChartBarsHtml', 'hbChartColsHtml', 'hbChartTableHtml'].map(region).join('\n')
    + '\nthis.bars = hbChartBarsHtml; this.cols = hbChartColsHtml; this.table = hbChartTableHtml;', ctx);
  return { ctx, dom };
}
const rowsOf = (dom, html) => {
  const box = dom.window.document.createElement('div'); box.innerHTML = html;
  return [...box.querySelectorAll('tbody tr')].map(tr => {
    const b = tr.querySelector('[data-hb-dig]');
    return { label: tr.children[0].textContent, val: tr.children[1].textContent, dig: b && b.getAttribute('data-hb-dig') };
  });
};

test('f565 (1) a bar chart becomes a table, one row per piece, each the same door', () => {
  const { ctx, dom } = stage();
  const html = ctx.bars([
    { label: 'Draft', n: 8, v: 0, say: '8', dig: 'qg:k:status:Draft' },
    { label: 'Under Review', n: 17, v: 0, say: '17', dig: 'qg:k:status:Under Review' },
    { label: 'Signed', n: 0, v: 0, say: '0', dig: 'qg:k:status:Signed' }], false);
  const rows = rowsOf(dom, ctx.table(html));
  assert.deepEqual(rows, [
    { label: 'Draft', val: '8', dig: 'qg:k:status:Draft' },
    { label: 'Under Review', val: '17', dig: 'qg:k:status:Under Review' }], 'the owner\'s "by stage" card; an empty bar is no row');
});

test('f565 (1b) a label with a colon of its own keeps it', () => {
  const { ctx, dom } = stage();
  const html = ctx.bars([{ label: 'MK-1 · Lease: Phase 2', n: 1, v: 5, say: 'KES 5', dig: 'c:MK-1' }], true);
  assert.deepEqual(rowsOf(dom, ctx.table(html))[0], { label: 'MK-1 · Lease: Phase 2', val: 'KES 5', dig: 'c:MK-1' });
});

test('f565 (2) a month-column chart becomes a table too', () => {
  const { ctx, dom } = stage();
  const html = ctx.cols([
    { label: 'Jul', n: 3, v: 0, say: '3', dig: 'qm:k:m:2026-07' },
    { label: 'Aug', n: 0, v: 0, say: '0', dig: 'qm:k:m:2026-08' },
    { label: 'Sep', n: 5, v: 0, say: '5', dig: 'qm:k:m:2026-09' }], false);
  assert.deepEqual(rowsOf(dom, ctx.table(html)).map(r => r.label + '=' + r.val), ['Jul=3', 'Sep=5'], 'in the chart\'s order');
});

test('f565 (3) an SVG chart still reads from its <title>', () => {
  const { ctx, dom } = stage();
  const svg = '<svg><g data-hb-dig="qg:a"><title>Draft: 2 contracts</title><rect/></g><g data-hb-dig="qg:b"><title>Signed: 4 contracts</title></g></svg>';
  assert.deepEqual(rowsOf(dom, ctx.table(svg)).map(r => r.label + '|' + r.val), ['Draft|2 contracts', 'Signed|4 contracts']);
  assert.equal(ctx.table('<div data-hb-dig="x" disabled></div>'), '', 'nothing behind it, no table');
});

test('f565 (4) the button never lies', () => {
  const body = region('hbChartHtml');
  assert.match(body, /const t = hbChartTableHtml\(R\.body\);/, 'the table is built before the button is drawn');
  assert.match(body, /const tab = !!t && _hbTableOn\.has\(at\.key\);/, '"Show as chart" only while a table is showing');
  assert.match(body, /\$\{t \? `<button type="button" class="hb-link" data-hb-table=/, 'no rows, no button');
});
