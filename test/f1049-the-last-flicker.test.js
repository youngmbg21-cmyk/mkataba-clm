'use strict';
/* f1049 — THE LAST FLICKER (owner, 14 Nov 2026: "create a plan to autonomously build all the remaining fixes", then
   "go"; docs/WORKORDER-the-last-flicker.md). Source-sliced: each part pins the region that carries the rule. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len = 2000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1049 (1) a chase row unticked stays unticked when the panel is drawn again', () => {
  const hb = read('js/views/homeboard.js');
  const build = region(hb, 'function hbChaseManyHtml', 1600);
  assert.match(build, /_hbChaseOff\.has\(it\.key\) \? '' : ' checked'/, 'the builder draws a row unticked when the reader unticked it');
  assert.match(build, /on = ok\.filter\(it => !_hbChaseOff\.has\(it\.key\)\)/, 'the button counts only the rows still ticked');
  const count = region(hb, 'function hbChaseManyCount', 600);
  assert.match(count, /_hbChaseOff\.delete\(k\)/); assert.match(count, /_hbChaseOff\.add\(k\)/);
  assert.match(hb, /if \(on\('\[data-hb-chase-key\]'\)\)\{ const bx = t\.closest\('\[data-hb-chase-many-box\]'\); hbChaseManyCount\(bx\);/,
    'the untick is kept at the press itself, before any redraw can come');
});

test('f1049 (2) the Board check waits for Jambo to be free and for this question\'s own turn', () => {
  const v = read('test/chromium/board-says-it-plain-verify.js');
  const ask = region(v, 'const ask = async (q, opts) => {', 1400);
  assert.match(ask, /await until\(page, \(\) => !\(window\.intel && intel\.busy\), null, 15000\);/);
  assert.match(ask, /m\.role === 'user' && m\.text === q/);
});

test('f1049 (3) the rebuild measure counts opening a contract as a move, and follows the list that was scrolled', () => {
  const m = read('test/chromium/_audit/rebuild-measure.js');
  assert.match(m, /a\.paper !== b\.paper \|\| a\.place !== b\.place/);
  assert.match(m, /const kept = sc\.el && sc\.el\.isConnected \? sc\.el : null;/);
  assert.match(m, /same: String\(p\.innerText \|\| ''\)/, 'a rebuilt part is compared with what it said before');
  assert.match(m, /if \(j\.waste\) T\.waste\+\+;/, 'a redraw for nothing is counted apart');
});
