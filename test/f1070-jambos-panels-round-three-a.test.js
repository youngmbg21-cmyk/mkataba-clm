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
  /* RE-POINTED 21 Nov 2026 (P-39, owner: the panel NEVER REPEATS THE PAGE — no three mixed tiles): a ring and ONE bar of what waits, its legend the doors (data-hbw), then Jambo's prepared pieces */
  assert.match(hb, /mid: ringBar/); assert.match(hb, /data-hbw="\$\{k === 'jambo' \? 'jambo'/); assert.doesNotMatch(hb, /glance:/);
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
  /* RE-POINTED 19 Nov 2026 (owner's yes on the Parties drawings): the party's panel is its own facts, its contacts, three
     agreements and all of them on Contracts — no ring, no Open party, no web search. RETIRED: data-cun-open, data-cun-web,
     ring: pct || null in cunPanelHtml */
  const cu = region(read('js/views/customers.js'), 'function cunPanelFiveHtml(r){', "if (typeof document !== 'undefined' && !document._cunPanel5Wired)");
  assert.match(cu, /data-cu-pr-edit=/); assert.match(cu, /data-cun-ppl=/); assert.match(cu, /data-cun-cts=/); assert.match(cu, /data-cun-add-ct=/);
  /* RE-POINTED (P-25, owner's pick 20 Nov 2026: Parties the Legora + Stripe way, "L+S and ring"): the panel draws a ring
     again — the share of the party's agreements signed (cunRingSvg), never money; Open party and the web search stay gone */
  /* RE-POINTED 21 Nov 2026 (P-25, as drawn): the ring counts the party's agreements not put away (total) */
  assert.match(cu, /cunRingSvg\(n\.signed, total, 44\)/); /* RE-POINTED 22 Nov 2026 (P-25 review): 44, the drawing's ring, so the panel's Contacts stand in view at 1536×730 */
  assert.doesNotMatch(cu, /data-cun-web|data-cun-open/);
  /* RE-POINTED (P-11, 17 Nov 2026): Settings' panel is the Dossier card (sddCardHtml); its need rows keep their own press */
  const st = region(read('js/views/settings.js'), 'function sddCardHtml(admin, ctx){', '/* ---- presses:');
  assert.match(st, /attr:x\.btn\|\|''/); assert.match(st, /attr:'data-st-ask-head=""'/);
  const hk = region(read('js/views/handbook.js'), 'function hbknPanelHtml(){', 'function hbknRender(');
  assert.match(hk, /attr: `data-hbkn-ch="\$\{E\(c\.k\)\}"`/);
});

test('f1070 (3) the Contracts list keeps no "Ask me", and Discover above its rows', () => {
  const pd = read('js/paperdesk.js');
  const ov = region(pd, 'function pdWallOverview(){', 'function pdDropInner(){');
  assert.match(ov, /groups, src: _pdT\('jl_src_list'\), asks: \[\] \};/, 'no Ask me in the new look either');
  assert.match(region(pd, 'function pdWallHtml(disc){', 'function pdDropInput('), /if \(o\.title\) return `<div class="pd-wall">\$\{ov\(Object\.assign\(\{\}, o, \{ mid: \(o\.mid \|\| ''\) \+ \(disc \|\| ''\) \}\)/);   /* RE-POINTED (P-31): the list's own bar and dots, then Discover */
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
  /* RE-POINTED 21 Nov 2026 (P-39): the Board's tiles left, and with them three of the round's words */
  /* RE-POINTED 22 Nov 2026 (P-43 review): Settings' "Read from the settings" left its panel, as drawn */
  /* RE-POINTED 22 Nov 2026 (Your day, L+S): the tiles' Clear and duties-timeline words left with the tiles, as drawn */
  assert.ok(keys.size >= 14, 'the round\'s words are found');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  assert.deepEqual([...keys].filter(k => !has(S.en, k) || !has(S.sv, k)), []);
});
