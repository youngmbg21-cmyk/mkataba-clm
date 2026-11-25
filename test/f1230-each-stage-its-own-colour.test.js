'use strict';
/* f1230 — EACH STAGE ITS OWN COLOUR (owner, 25 Nov 2026, with a screenshot of the Board's "Where all 192 stand":
   "drafting and in review are the same color").
   hmStageTone gave every stage chart its colours, and in the new look it borrowed the Contracts list's three buckets
   (regLsToneOfStatus: everything not signed or closed is "review"), so Drafting wore In review's amber on the bar and
   its key, Home's map, the portfolio and Explorer's status colours. Now each stage wears its own status dot, the one its
   badge wears everywhere (STATUS_META): Drafting grey, In review amber, Executed green.
   Run with the new look ON, as the live page is. At the parent Drafting and In review answer the same amber. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };

function toneWorld(){
  const HOME = read('js/views/home.js'), CORE = read('js/core.js'), REG = read('js/views/register.js');
  const meta = CORE.slice(CORE.indexOf('const STATUS_META = {'), CORE.indexOf('};', CORE.indexOf('const STATUS_META = {')) + 2);
  const lsTone = REG.match(/(?:const|var) REG_LS_TONE\s*=\s*\{[^}]*\};/);
  assert.ok(lsTone, 'the Contracts list keeps its three buckets');
  const window = {};
  const ctx = { window };
  vm.createContext(ctx);
  vm.runInContext([
    "function _stMeta(k, label, dot, bg, fg, line){ return { label, dot, bg, fg, line }; }",
    meta, 'window.STATUS_META = STATUS_META;',
    lsTone[0], fnBody(REG, 'regLsToneOfStatus'), 'window.regLsToneOfStatus = regLsToneOfStatus;',
    "window.newLookOn = () => true;",
    HOME.match(/const HM_STAGE_TONE_FALLBACK = \{[^}]*\};/)[0],
    fnBody(HOME, 'hmStageTone'), 'this.hmStageTone = hmStageTone;',
  ].join('\n'), ctx);
  return ctx;
}

test('f1230 (1) in the new look, Drafting and In review are two colours, each its badge\'s own dot', () => {
  const { hmStageTone, window } = toneWorld();
  const d = hmStageTone('Draft'), r = hmStageTone('Under Review'), s = hmStageTone('Signed');
  assert.notEqual(d, r, 'Drafting is not In review\'s amber');
  assert.equal(d, window.STATUS_META['Draft'].dot);
  assert.equal(r, window.STATUS_META['Under Review'].dot);
  assert.equal(s, window.STATUS_META['Signed'].dot);
  assert.equal(new Set([d, r, s]).size, 3, 'three stages, three colours');
});

test('f1230 (2) every stage chart reads the one picker', () => {
  const HB = read('js/views/homeboard.js');
  assert.match(fnBody(HB, 'hbBookData'), /hmStageTone\(s\.k\)/, 'Where all N stand: its bar and key');
  assert.match(fnBody(read('js/views/home.js'), 'hmMapData'), /hmStageTone\(d\.k\)/, 'Home\'s map');
  assert.match(read('js/views/portfolio.js'), /pfStageTone = k => \(typeof window\.hmStageTone==='function'\) \? hmStageTone\(k\)/, 'the portfolio');
});
