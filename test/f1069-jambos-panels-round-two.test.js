'use strict';
/* f1069 — JAMBO'S PANELS, THE FIVE PARTS, ROUND 2 (owner, 15 Nov 2026: "push and start round 2"): the four panels that
   stopped halfway — Calendar, Our paper (a chosen paper), People (a chosen person), Jambo's agents.
   (1) the builder draws the three new parts the round needs: `week` (seven days, today dark, a dot on a day that
       holds a date), `avatar` (initials beside the headline) and `crew` (round marks, each in the colour the page
       hands in, a word under each).
   (2) each panel says the five parts in the new look and is drawn as before in the old one: calOverviewFive behind
       newLookOn in Calendar's panel; tplnPanelFive, dirnPanelFive, jhnPanelFive the same in theirs.
   (3) each keeps the page's own presses: Calendar's Plan my week / Find time are data-cal-plan-q; People's rows are
       data-dirn-mail / data-dirn-contracts; the agents' rows are data-jhn-board / data-jh-tab="agents" /
       data-jh-points; the agents' colours are JH_LOOK's (no new hand-typed colour, f965).
   (4) every jov5_ word of the round is in both books.
   AT THE PARENT every test here fails: none of these builders, parts or words exist. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, start, end) => { const i = src.indexOf(start); assert.ok(i >= 0, start + ' is there'); const j = end ? src.indexOf(end, i + start.length) : -1; return strip(src.slice(i, j > i ? j : i + 6000)); };

test('f1069 (1) the builder draws the week, the face and the crew', () => {
  const W = buildWorld().win;
  const d = W.document.createElement('div');
  d.innerHTML = W.jamboOverviewHtml({ title: 'A clear week.', avatar: 'AO',
    week: [{ d: 'Sun', n: 15, today: true }, { d: 'Mon', n: 16, k: 2, title: 'Two dates' }].concat([17, 18, 19, 20, 21].map(n => ({ d: 'x', n }))),
    crew: [{ label: 'Post', color: 'var(--accent-solid)' }, { label: 'Clock', color: 'var(--accent-ink)' }] }, 'f1069');
  assert.equal(d.querySelectorAll('.jov5-day').length, 7, 'seven days');
  assert.equal(d.querySelectorAll('.jov5-day.is-today').length, 1, 'today is one dark day');
  assert.equal(d.querySelectorAll('.jov5-day.has-dates').length, 1, 'a dot only where a date is');
  assert.equal(d.querySelector('.jov5-who .jov5-ava').textContent, 'AO', 'the initials beside the headline');
  assert.equal(d.querySelectorAll('.jov5-cm').length, 2, 'a mark per member');
  assert.match(d.querySelector('.jov5-cm span').getAttribute('style'), /background:var\(--accent-solid\)/, 'the colour the page hands in');
});

test('f1069 (2) the four panels say the five parts in the new look, as before in the old', () => {
  const cal = read('js/views/calendar.js');
  assert.match(strip(cal), /jamboOverviewHtml\(\(typeof window\.newLookOn==='function'&&newLookOn\(\)\)\?calOverviewFive\(off\):\{/, "Calendar's panel");
  const lib = region(read('js/views/library.js'), 'function tplnPanelHtml(card, opts){', 'if (typeof document'); /* RE-POINTED 17 Nov 2026 (Shelves, then the Legora way): the panel takes opts (Open the paper while the list is up) */
  /* RE-POINTED (P-34, owner's pick 20 Nov 2026): the panel wears its page's class (no cards) */
  assert.match(lib, /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\)\s*return `<div class="jl-words is-ov tpln6-p">\$\{jamboOverviewHtml\(tplnPanelFive\(/, "Our paper's panel");
  const dir = region(read('js/views/directory.js'), 'function dirnPanelHtml(p){', 'if (typeof document');
  assert.match(dir, /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\)\{[\s\S]*dirnPanelFive\(p, sub, w, away\)/, "People's panel");
  const jh = region(read('js/views/jambohouse.js'), 'function jhnPanelHtml(){', 'async function jhnMaySet');
  assert.match(jh, /newLookOn\(\) && typeof jamboOverviewHtml === 'function'\) return `<div class="jl-words is-ov">\$\{jamboOverviewHtml\(jhnPanelFive\(open, keys\)/, "the agents' panel");
});

test('f1069 (3) each panel keeps the page\'s own presses and colours', () => {
  const cal = region(read('js/views/calendar.js'), 'function calOverviewFive(off){', 'function calEventsOnce(){');
  assert.match(cal, /attr:`data-cal-plan-q="week"\$\{off\}`/, 'Plan my week is the planner\'s own press');
  assert.match(cal, /attr:`data-cal-plan-q="due"\$\{off\}`/, 'Find time is the planner\'s own press');
  assert.match(cal, /calEventsOnce\(\)/, 'the week is counted from the page\'s own list');
  const dir = region(read('js/views/directory.js'), 'function dirnPanelFive(', 'function dirnPanelHtml(');
  assert.match(dir, /attr:`data-dirn-mail=/); assert.match(dir, /attr:`data-dirn-contracts=/);
  const jh = region(read('js/views/jambohouse.js'), 'function jhnPanelFive(', 'function jhnPanelHtml(');
  assert.match(jh, /attr:'data-jhn-board'/); assert.match(jh, /attr:'data-jh-tab="agents"'/); assert.match(jh, /attr:'data-jh-points'/);
  assert.match(jh, /color:\(JH_LOOK\[k\] \|\| \[\]\)\[0\]/, 'the agents\' colours are the house\'s own');
  assert.doesNotMatch(jh, /#[0-9a-fA-F]{3,6}\b/, 'no colour typed by hand');
  const lib = region(read('js/views/library.js'), 'function tplnPanelFive(', 'function tplnPanelHtml(');
  assert.match(lib, /data-tpln-changed/, 'came back changed opens the page\'s own reading');
  assert.match(lib, /verbs\.findIndex\(a => a\.k === 'draft'\)/, 'Draft from it is the paper\'s own verb');
});

test('f1069 (4) every word of the round is in both books', () => {
  const W = buildWorld().win;
  const S = W.eval('typeof STRINGS !== "undefined" ? STRINGS : null'); assert.ok(S && S.en && S.sv);
  const keys = new Set();
  for (const f of ['js/views/calendar.js', 'js/views/library.js', 'js/views/directory.js', 'js/views/jambohouse.js'])
    for (const m of read(f).matchAll(/['"](jov5_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  /* RE-POINTED 21 Nov 2026 (P-26, as drawn): People's panel no longer says "Named on, most recent", "Reach them" or "Read
     from the record" (the drawing draws none of them), so its own words (dirn_…) are asked of both books here too */
  for (const m of read('js/views/directory.js').matchAll(/['"](dirn_[a-z0-9_]+)['"]/g)) keys.add(m[1]);
  assert.ok(keys.size >= 25, 'the round\'s words are found');
  const has = (b, k) => b[k] != null || b[k + '_one'] != null;
  assert.deepEqual([...keys].filter(k => !has(S.en, k) || !has(S.sv, k)), []);
});
