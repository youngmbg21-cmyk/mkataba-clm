'use strict';
/* f981 — HOME IN INTER (owner, 9 Nov 2026: picked by number from six unnamed faces; "only build the home page … then I
   will review and see whether that is the font I want", then "leave home as it is but only change the font")
   1 · Inter ships as HaTi's own files (three subsets, its licence beside them), linked by index.html, every file the
       stylesheet names on disk; the app-wide faces are untouched (--font-body stays Geist, f377)
   2 · Home, and only Home, reads Inter: #cn2-page points the screen tokens at --font-home, behind html.lg-new
   3 · nothing else on Home moved: the detail keeps the ink, the rows keep the other side's initials
   At the parent (1) and (2) fail: no Inter, no --font-home. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = strip(HTML);
const CN = strip(fs.readFileSync(path.join(ROOT, 'js/views/counter.js'), 'utf8'));
const rule = sel => { const i = CSS.indexOf(sel + '{'); if (i < 0) return ''; return CSS.slice(i, CSS.indexOf('}', i) + 1); };

test('1 · Inter ships as HaTi\'s own files, linked, licensed; the app-wide faces stay', () => {
  assert.match(HTML, /<link rel="stylesheet" href="fonts\/inter\.css">/);
  const css = fs.readFileSync(path.join(ROOT, 'fonts/inter.css'), 'utf8');
  assert.match(css, /font-family:'Inter'/);
  const files = [...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]);
  assert.ok(new Set(files).size >= 2, 'Latin and more');
  for (const f of new Set(files)) assert.ok(fs.existsSync(path.join(ROOT, 'fonts', f)), f + ' is named and on disk');
  assert.match(css, /U\+0000-00FF/, 'Latin');
  assert.match(fs.readFileSync(path.join(ROOT, 'fonts/inter-OFL.txt'), 'utf8'), /SIL Open Font License/);
  assert.match(HTML, /--font-home:'Inter',/);
  assert.match(HTML, /--font-body:'Geist',/, 'the rest of HaTi keeps Geist');
});

test('2 · Home, and only Home, reads Inter, behind the new look', () => {
  const r = rule('html.lg-new #cn2-page');
  assert.match(r, /--font-body:var\(--font-home\)/);
  assert.match(r, /font-family:var\(--font-home\)/);
  const uses = [...CSS.matchAll(/([^{}\n]*)\{[^{}]*var\(--font-home\)/g)].map(m => m[1].trim());
  assert.ok(uses.length && uses.every(s => s === 'html.lg-new #cn2-page'), 'Inter is asked for on Home only: ' + uses.join(' | '));
});

test('3 · nothing else on Home moved: the detail keeps the ink, the rows keep their initials', () => {
  for (const sel of ['.cn2-ln', '.cn2-fx', '.cn2-say', '.cn2-foot'])
    assert.match(rule('html.lg-new #cn2-page ' + sel), /color:var\(--color-text\)/, sel + ' is the ink');
  const row = CN.slice(CN.indexOf('function cn2RowHtml'), CN.indexOf('function cn2GroupedHtml'));
  assert.match(row, /ndAvHtml\(r, P\)/, 'the other side\'s initials');
});
