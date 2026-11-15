'use strict';
/* f1070 — JAMBO'S PANELS, THE FIVE PARTS, ROUND 3a (owner, 15 Nov 2026: "push and start round 3"): the Board, Contracts
   (the folders and the list), Explorer's Your day and Guide, Parties, Settings, the Handbook page and the side
   panel's Guide.
   (1) the builder draws the round's three new parts: `tag` (a word beside the headline), `ring` (a share as a ring
       beside it) and `mid` (a page's own drawing under the tiles).
   (2) each panel says the five parts in the new look only, behind newLookOn, and keeps the page's own presses: the
       Board's tiles are data-hbw (hbWelcomeGo, which now opens live → the book's Live figure, next → the Calendar);
       Contracts' rows data-rfp-only / data-rfp-rate; Your day's data-ig-day and data-ig-day-pin; the Guide's data-ig-gd;
       Parties' data-cun-open / data-cun-web / data-cu-pr-edit; Settings' need rows their own press and
       data-st-ask-head; the Handbook's data-hbkn-ch.
   (3) the Contracts list keeps NO "Ask me" (owner, 28 Oct 2026) and Discover stays above its rows (pdWallHtml `mid`).
   (4) the side panel's Guide keeps its own rows, words, counts and doors, in soft groups (.gdn.is-five).
   (5) every word of the round in both books.
   AT THE PARENT every test here fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, start, end) => { const i = src.indexOf(start); assert.ok(i >= 0, start + ' is there'); const j = end ? src.indexOf(end, i + start.length) : -1; return strip(src.slice(i, j > i ? j : i + 8000)); };

test('f1070 (1) the builder draws a tag, a ring and a page\'s own middle', () => {
  const W = buildWorld().win; const d = W.document.createElement('div');
  d.innerHTML = W.jamboOverviewHtml({ title: 'Siginon Group', ring: 25, tag: { text: 'All signed', tone: 'green' }, glance: [{ n: 1, l: 'a' }], mid: '<i class="f1070-mid"></i>', midLabel: 'Where the money is' }, 'f1070');
  assert.equal(d.querySelector('.jov5-tag.is-green').textContent, 'All signed');
  assert.equal(d.querySelector('.jov5-ring b').textContent, '25%');
  assert.match(d.querySelector('.jov5-rf').getAttribute('style'), /stroke-dashoffset:160\.2/, 'a quarter of the ring drawn');
  const mid = d.querySelector('.f1070-mid'); assert.ok(mid, 'the page\'s own drawing');
  const parts = [...d.querySelector('.jov5').children]; const gi = parts.findIndex(e => e.classList.contains('jov5-glance')), mi = parts.findIndex(e => e.contains(mid));
  assert.ok(gi >= 0 && mi > gi, 'the middle stands under the tiles');
});

test('f1070 (2) each panel says the five parts in the new look, by the page\'s own presses', () => {
  const hb = region(read('js/views/homeboard.js'), 'function hbBoardHelloHtml(){', 'function hbWelcomeGo(k){');
  assert.match(hb, /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\)\{/);
  assert.match(hb, /attr: n \? 'data-hbw="all"'/); assert.match(hb, /'data-hbw="live"'/); assert.match(hb, /'data-hbw="next"'/);
  const go = region(read('js/views/homeboard.js'), 'function hbWelcomeGo(k){', '}\n');
  assert.match(read('js/views/homeboard.js'), /if \(k === 'live'\) return \(typeof hbFigDoor === 'function'\) \? hbFigDoor\('f:live'\)/);
  assert.match(read('js/views/homeboard.js'), /if \(k === 'next'\) return \(typeof caGo === 'function'\) \? caGo\(\{ kind: 'go', place: 'calendar' \}\)/);
  void go;
  const rf = region(read('js/views/register.js'), 'function regFoldersGlanceHtml(', 'function regFoldersPanelHtml(');
  assert.match(rf, /newLookOn\(\)&&typeof jamboOverviewHtml==='function'\)\{/); assert.match(rf, /data-rfp-only=/); assert.match(rf, /attr:'data-rfp-rate'/);
  const day = region(read('js/views/intelligence.js'), 'function igDayHtml(){', 'let _igSvForm');
  assert.match(day, /attr:may\(t\)\?`data-ig-day="\$\{t\.k\}"`/); assert.match(day, /attr:`data-ig-day-pin aria-pressed=/); assert.match(day, /after:igSavedViewsHtml\(\)/);
  const gd = region(read('js/views/intelligence.js'), 'function igGuideHtml(){', 'function igGuideRepaint(');
  assert.match(gd, /attr:`data-ig-gd="\$\{igEsc\(r\.q\)\}"/);
  const cu = region(read('js/views/customers.js'), 'function cunPanelHtml(r){', "if (typeof document !== 'undefined' && !document._cunPanelWired)");
  assert.match(cu, /data-cun-open=/); assert.match(cu, /data-cun-web=/); assert.match(cu, /data-cu-pr-edit=/); assert.match(cu, /ring: pct \|\| null/);
  const st = region(read('js/views/settings.js'), 'function stnPanelHtml(admin){', 'function stnPanelPaint(');
  assert.match(st, /attr:r\.btn\|\|''/); assert.match(st, /attr:'data-st-ask-head=""'/);
  const hk = region(read('js/views/handbook.js'), 'function hbknPanelHtml(){', 'function hbknRender(');
  assert.match(hk, /attr: `data-hbkn-ch="\$\{E\(c\.k\)\}"`/);
});

test('f1070 (3) the Contracts list keeps no "Ask me", and Discover above its rows', () => {
  const pd = read('js/paperdesk.js');
  const ov = region(pd, 'function pdWallOverview(){', 'function pdDropInner(){');
  assert.match(ov, /groups, src: _pdT\('jl_src_list'\), asks: \[\] \};/, 'no Ask me in the new look either');
  assert.match(region(pd, 'function pdWallHtml(disc){', 'function pdDropInput('), /if \(o\.title\) return `<div class="pd-wall">\$\{ov\(Object\.assign\(\{\}, o, \{ mid: disc \|\| '' \}\)/);
});

test('f1070 (4) the side panel\'s Guide keeps its own rows, in soft groups', () => {
  const g = region(read('js/app.js'), 'function guidePanelNlHtml(){', '/* THE SYMBOL STRIP');
  assert.match(g, /const five=typeof newLookOn==='function'&&newLookOn\(\), g=h=>five\?`<div class="gdn-g">\$\{h\}<\/div>`:h;/);
  assert.match(g, /guideNlRowHtml\(r,here,st\.tone\)/, 'the Guide\'s own rows');
  assert.match(read('index.html'), /\.gdn\.is-five \.gdn-h\{text-transform:none;/, 'headings in sentence case');
});

test('f1070 (5) every word of the round is in both books', () => {
  const W = buildWorld().win; const S = W.eval('typeof STRINGS !== "undefined" ? STRINGS : null'); assert.ok(S && S.en && S.sv);
  const keys = new Set();
  for (const f of ['js/views/homeboard.js', 'js/views/register.js', 'js/paperdesk.js', 'js/views/intelligence.js', 'js/views/customers.js', 'js/views/settings.js', 'js/views/handbook.js'])
    for (const m of read(f).matchAll(/['"](jov5_(?:hb|ct|day|gd|pt|st|hbk)_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 20, 'the round\'s words are found');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  assert.deepEqual([...keys].filter(k => !has(S.en, k) || !has(S.sv, k)), []);
});
