'use strict';
/* f987 — HORIZON, THE SAP WAY (owner's pick by name, 10 Nov 2026), and the detail grey on Week and Month
   The colour comes from time left: each Horizon row wears calHzTone (red inside 30 days, amber to 90, green beyond),
   its bar takes that tone, the decision is a pill (amber while near or open, green once decided), the five boxes above
   wear their band's soft fill, and the detail lines are grey. At the parent the claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const CSS = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const CAL = fs.readFileSync(path.join(ROOT, 'js', 'views', 'calendar.js'), 'utf8');
const R = 'html\\.lg-new #app-shell \\.cal-hz-row\\.is-nl';

test('1 · the tone of a row is read off its days left, the ladder\'s own bands', () => {
  const src = /function calHzTone\(days\)\{[^\n]*\}/.exec(CAL);
  assert.ok(src, 'calHzTone is declared');
  const calHzTone = new Function(src[0] + '; return calHzTone;')();
  assert.equal(calHzTone(0), 't-ruby'); assert.equal(calHzTone(30), 't-ruby');
  assert.equal(calHzTone(31), 't-amber'); assert.equal(calHzTone(90), 't-amber');
  assert.equal(calHzTone(91), 't-green'); assert.equal(calHzTone(400), 't-green');
  assert.match(CAL, /'<div class="cal-hz-row is-nl '\+calHzTone\(r\.days\)/, 'the new-look row wears its tone');
  assert.match(CAL, /class="cal-lad cal-lad-\$\{b\.k\}"/, 'each box names its band');
});

test('2 · the bar takes the tone, the decision is a pill, the boxes their soft fill', () => {
  for (const [t, v] of [['ruby', 'ruby'], ['amber', 'amber'], ['green', 'green']])
    assert.match(CSS, new RegExp(R + '\\.t-' + t + ' \\.cal-hz-bar\\{background:var\\(--st-' + v + '-dot\\)\\}'), t + ' bar');
  assert.match(CSS, new RegExp(R + ' \\.cal-hz-dec b\\{display:inline-flex[^}]*border-radius:999px'), 'the decision is a pill');
  assert.match(CSS, new RegExp(R + ' \\.cal-hz-dec\\.is-done b\\{background:var\\(--st-green-bg\\)'), 'decided is green');
  assert.match(CSS, new RegExp(R + ' \\.cal-hz-dec\\.is-open b\\{background:var\\(--st-amber-bg\\)'), 'an open window is amber');
  assert.match(CSS, /\.cal-hz-card \.cal-lad\.cal-lad-d30\{background:var\(--st-ruby-bg\)\}/, 'the first box red');
  assert.match(CSS, /\.cal-hz-card :is\(\.cal-lad\.cal-lad-d180,\.cal-lad\.cal-lad-d365\)\{background:var\(--st-green-bg\)\}/, 'the far boxes green');
});

test('3 · the name and the figure ink, the detail grey: Horizon, Week and Month', () => {
  assert.match(CSS, new RegExp(R + ' \\.cal-hz-lab \\.m,' + R + ' \\.cal-hz-note,' + R + ' \\.cal-hz-dec small,[^{]*\\.cal-lad-v\\{color:var\\(--color-neutral-400\\)\\}'), 'Horizon\'s detail grey');
  assert.match(CSS, /html\.lg-new :is\(\.cal-wkm-lab span,\.cal-wkm-dn,\.cal-wk-t,\.cal-wk-lab\.is-this\)\{color:var\(--color-neutral-400\)\}/, 'Week and Month\'s detail grey');
});
