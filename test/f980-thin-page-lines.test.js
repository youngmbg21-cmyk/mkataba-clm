'use strict';
/* f980 — THIN PAGE LINES WHERE A PERSON TYPES (owner, 9 Nov 2026: "go with option 2, thin page lines").
   The clause editor and the template builder keep ONE sheet (a page break that pushes wording would move the words
   under the caret); a faint dashed line marks where each A4 page would end, "Page N" in the left margin. Measured in a
   browser: the clause editor's 720px sheet carries "Page 2" at 1018px and "Page 3" at 2037px, the builder's 860px sheet
   "Page 2" at 1216px; nothing on the sheet moved. At the parent every test here fails: there is no pagesLines. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

test('1 · one builder draws the lines over the sheet and pushes nothing', () => {
  const P = read('js/pages.js');
  const fn = strip(P.match(/function pagesLines\(sheet\)\{[\s\S]*?\n\}/)[0]);
  assert.doesNotMatch(fn, /marginTop|data-pg-push|style\.margin/, 'no wording is pushed');
  assert.match(fn, /const H = W \* PG_A4/, 'an A4 page of the sheet\'s own width');
  assert.match(fn, /layer\.setAttribute\('aria-hidden', 'true'\)/);
  assert.match(fn, /data-l="\$\{_pgAttr\(_pgLineLabel\(k \+ 1\)\)\}"><\/div>/, 'the label is an attribute, never a text node');
  assert.match(P, /pagesPrintPageRule, pagesLines \}\);/, 'published');
});
test('2 · the clause editor and the template builder draw them after every paint of their sheet', () => {
  assert.match(read('js/views/clauseeditor.js'), /ceApplyZoom\(\);[\s\S]{0,300}const sh = host\.querySelector\('\.rl-paper'\); if \(sh && typeof window\.pagesLines === 'function'\) pagesLines\(sh\);/);
  assert.match(read('js/views/templatebuilder.js'), /function tbPaintPaper\(\) \{[^\n]*\n[^\n]*\n\s*try \{ const p = document\.getElementById\('tb-paper'\); if \(p && typeof window\.pagesLines === 'function'\) pagesLines\(p\);/);
  /* and the real pages still never reach the editor */
  assert.match(read('js/views/negotiation.js'), /if \(sheet\.closest\('\.ce-paperwrap'\)\) return;/);
});
test('3 · faint, in the margin, pointer-free; both books say it', () => {
  const css = read('index.html');
  assert.match(css, /\.pg-lines\{position:absolute;left:0;top:0;right:0;height:0;z-index:2;pointer-events:none\}/);
  assert.match(css, /\.pg-line\{position:absolute;left:0;right:0;height:0;border-top:1px dashed var\(--color-neutral-400\);opacity:\.55\}/);
  assert.match(css, /\.pg-line::after\{content:attr\(data-l\);position:absolute;left:6px;/);
  const I = read('js/i18n.js');
  assert.match(I, /pg_line_page: 'Page \{n\}',/); assert.match(I, /pg_line_page: 'Sida \{n\}',/);
});
