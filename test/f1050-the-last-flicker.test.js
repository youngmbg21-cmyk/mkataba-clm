'use strict';
/* f1050 — THE LAST FLICKER (owner, 14 Nov 2026: "create a plan to autonomously build all the remaining fixes", then
   "go"; docs/WORKORDER-the-last-flicker.md). Source-sliced: each part pins the region that carries the rule. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len = 2000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1050 (1) a chase row unticked stays unticked when the panel is drawn again', () => {
  const hb = read('js/views/homeboard.js');
  const build = region(hb, 'function hbChaseManyHtml', 1600);
  assert.match(build, /_hbChaseOff\.has\(it\.key\) \? '' : ' checked'/, 'the builder draws a row unticked when the reader unticked it');
  assert.match(build, /on = ok\.filter\(it => !_hbChaseOff\.has\(it\.key\)\)/, 'the button counts only the rows still ticked');
  const count = region(hb, 'function hbChaseManyCount', 600);
  assert.match(count, /_hbChaseOff\.delete\(k\)/); assert.match(count, /_hbChaseOff\.add\(k\)/);
  assert.match(hb, /if \(on\('\[data-hb-chase-key\]'\)\)\{ const bx = t\.closest\('\[data-hb-chase-many-box\]'\); hbChaseManyCount\(bx\);/,
    'the untick is kept at the press itself, before any redraw can come');
});

test('f1050 (2) the Board check waits for Jambo to be free and for this question\'s own turn', () => {
  const v = read('test/chromium/board-says-it-plain-verify.js');
  const ask = region(v, 'const ask = async (q, opts) => {', 1400);
  assert.match(ask, /await until\(page, \(\) => !\(window\.intel && intel\.busy\), null, 15000\);/);
  assert.match(ask, /m\.role === 'user' && m\.text === q/);
});

test('f1050 (3) the rebuild measure counts opening a contract as a move, and follows the list that was scrolled', () => {
  const m = read('test/chromium/_audit/rebuild-measure.js');
  assert.match(m, /a\.paper !== b\.paper \|\| a\.place !== b\.place/);
  assert.match(m, /const kept = sc\.el && sc\.el\.isConnected \? sc\.el : null;/);
  assert.match(m, /same: String\(p\.innerText \|\| ''\)/, 'a rebuilt part is compared with what it said before');
  assert.match(m, /if \(j\.waste\) T\.waste\+\+;/, 'a redraw for nothing is counted apart');
});

test('f1050 (4) the same page drawn again keeps its side panel, and writes only what changed in it', () => {
  const ins = read('js/views/inspector.js');
  const paint = region(ins, 'function insPaintPanel', 2600);
  assert.match(paint, /was\._insSeat === opt\.seat/, 'only the SAME page takes its panel back');
  assert.match(paint, /host\.parentNode\.replaceChild\(was, host\)/);
  assert.match(paint, /body\._insHtml === html && body\.firstChild && body\.innerHTML === body\._insSer/, 'nothing changed, nothing written; any outside write = written');
  const ik = read('js/views/intake.js');
  assert.match(ik, /if\(b\._ikBound\) return; b\._ikBound=1;/, 'Requests binds its panel buttons once, so a kept panel never fires twice');
});

test('f1050 (5) the Calendar\'s Mine | All keeps the reader where they were', () => {
  const cal = read('js/views/calendar.js');
  assert.match(region(cal, 'function calSetScope', 400), /keepScrollIn\(host, \(\)=>renderCalendar\(\{ keepPanel:true \}\)\)/);
});
