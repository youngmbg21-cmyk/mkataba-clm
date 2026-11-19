'use strict';
/* f1101 — THE PLAYBOOK FACT IS A SCORE RING (owner picked "Score Ring" by name, 19 Nov 2026, from three drawings on the
   real Dossier: "actually more like KPIs indicator that has color").

   (1) THE ROW: the Dossier's Playbook fact (pd2Facts) draws a small ring of the share of positions met, coloured by the
       WORST it found — missing → red, only differing → amber, all met → green — "9 of 12 met" beside it, what is off
       under that in the ring's colour, and keeps its one door, Open (data-pd-ds-std → pd2StdGo).
   (2) THE WORDS: the old "N of M differ or are missing" line is gone from both books; the ring's words stand in both.
   (3) THE LOOK: the ring's colours are HaTi's own tokens, never a typed colour. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const region = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 10); return strip(src.slice(i, j < 0 ? undefined : j)); };

describe('f1101 (1) the Playbook fact is a score ring', () => {
  const F = region(R('js/paperdesk.js'), 'pd2Facts');
  test('the ring is drawn, coloured by the worst found', () => {
    assert.match(F, /pd2-ring/);
    assert.match(F, /sd\.miss \? 'is-miss' : sd\.dev \? 'is-dev' : 'is-met'/);
    assert.match(F, /pd2_std_met/);
    assert.match(F, /pd2_std_miss/);
    assert.match(F, /pd2_std_dev/);
  });
  test('the old sentence is not drawn, and Open stays the one door', () => {
    assert.doesNotMatch(F, /pd2_std_off/);
    assert.match(F, /k: 'std', cls: 'is-ring'[^\n]*go: 'data-pd-ds-std'/);
  });
});

describe('f1101 (2) the words, both books', () => {
  const I = R('js/i18n.js');
  test('the ring\'s words stand in English and Swedish, the old line is gone', () => {
    for (const k of ['pd2_std_met', 'pd2_std_miss_one', 'pd2_std_miss_other', 'pd2_std_dev_one', 'pd2_std_dev_other'])
      assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
    assert.doesNotMatch(I, /^    pd2_std_off_(one|other): /m);
    assert.match(I, /^    pd2_std_met: '\{met\} of \{total\} met',$/m);
  });
});

describe('f1101 (3) the ring wears HaTi\'s tokens', () => {
  const H = R('index.html');
  test('each tone is a token', () => {
    assert.match(H, /\.pd2-ring\.is-miss \.pd2-ring-fg\{stroke:var\(--danger\)\}/);
    assert.match(H, /\.pd2-ring\.is-dev \.pd2-ring-fg\{stroke:var\(--st-amber-dot\)\}/);
    assert.match(H, /\.pd2-ring\.is-met \.pd2-ring-fg\{stroke:var\(--st-green-dot\)\}/);
  });
});
