'use strict';
/* f981 — THE NEW LOOK IN INTER; HOME AND CONTRACTS: THE NAME INK, THE DETAIL GREY; CONTRACTS: THE SAP WAY MARK
   (owner, 9 Nov 2026: picked Inter by number from six unnamed faces; "make sure the font applies across the platform
   along with the black and grey font dynamic which is simply common sense"; "start with the home page and the contracts
   page first so we can review"; "the circle marks will only apply to the contracts page not home")
   1 · Inter ships as HaTi's own files (three subsets, its licence beside them), linked by index.html, every file the
       stylesheet names on disk; :root keeps Geist (f377) and the new look points the screen tokens at --font-new
   2 · Home and Contracts: the name keeps the ink; the line under a name, the date, what waits, the sentence under the
       greeting, the foot and the Contracts panel's explanatory lines wear the detail grey (--color-neutral-400)
   3 · Contracts leads each row with the SAP way mark (regSapMarkHtml): a filled circle in a status colour, a white
       drawn glyph; Home keeps the other side's initials; the glyphs are drawn icons, the colours named tokens
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = strip(HTML);
const CN = strip(fs.readFileSync(path.join(ROOT, 'js/views/counter.js'), 'utf8'));
const REG = strip(fs.readFileSync(path.join(ROOT, 'js/views/register.js'), 'utf8'));
const COMP = fs.readFileSync(path.join(ROOT, 'js/components.js'), 'utf8');
const rule = sel => { const i = CSS.indexOf(sel + '{'); if (i < 0) return ''; return CSS.slice(i, CSS.indexOf('}', i) + 1); };
const exists = f => fs.existsSync(path.join(ROOT, f));

test('1 · Inter ships as HaTi\'s own files and is the new look\'s screen face; the old look keeps Geist', () => {
  assert.match(HTML, /<link rel="stylesheet" href="fonts\/inter\.css">/);
  assert.ok(exists('fonts/inter.css'), 'fonts/inter.css');
  const css = fs.readFileSync(path.join(ROOT, 'fonts/inter.css'), 'utf8');
  assert.match(css, /font-family:'Inter'/);
  const files = [...new Set([...css.matchAll(/url\(([^)]+\.woff2)\)/g)].map(m => m[1]))];
  assert.ok(files.length >= 2, 'Latin and more');
  for (const f of files) assert.ok(exists('fonts/' + f), f + ' is named and on disk');
  assert.match(css, /U\+0000-00FF/, 'Latin');
  assert.match(fs.readFileSync(path.join(ROOT, 'fonts/inter-OFL.txt'), 'utf8'), /SIL Open Font License/);
  assert.match(HTML, /--font-new:'Inter',/);
  assert.match(HTML, /--font-body:'Geist',/, ':root (the old look) keeps Geist');
  assert.match(CSS, /html\.lg-new\{--font-body:var\(--font-new\);--font-heading:var\(--font-new\);--font-mono:var\(--font-new\)\}/, 'the new look\'s screen tokens');
  assert.match(rule('html.lg-new body'), /font-family:var\(--font-new\)/);
});

test('2 · Home and Contracts: the name ink, the detail grey', () => {
  for (const sel of ['.cn2-ln', '.cn2-fx', '.cn2-say', '.cn2-foot'])
    assert.match(rule('html.lg-new #cn2-page ' + sel), /color:var\(--color-neutral-400\)/, 'Home ' + sel);
  assert.match(rule('html.lg-new #cn2-page .cn2-nm'), /color:var\(--color-text\)/, 'Home\'s name stays the ink');
  assert.match(CSS, /html\.lg-new #ct-place \.reg-sub,html\.lg-new #ct-place \.reg-sub \.hati-ref\{color:var\(--color-neutral-400\)\}/, 'the line under a contract\'s name');
  assert.match(REG, /regNl\(\)\?'var\(--color-neutral-400\)':'var\(--color-neutral-700\)'/, 'a contract\'s date is grey in the new look');
  assert.match(CSS, /#ig-page:has\(#ct-place\) #ig-dock :is\(\.jov-head,\.jov-v:not\(\.is-need\),\.ac-meta,\.ac-disc-m\)/, 'the Contracts panel\'s explanatory lines');
  assert.match(HTML, /--color-neutral-400:#6A6A6F/, 'the detail grey (5.3 to 1 on white)');
});

test('3 · Contracts leads each row with the SAP way mark; Home keeps its initials', () => {
  assert.match(REG, /placeRows\?\(regNl\(\)\?regSapMarkHtml\(c\):regStageMarkHtml\(c\)\)/);
  const mk = REG.slice(REG.indexOf('const REG_SAP_MARK'), REG.indexOf('function regSapMarkHtml'));
  for (const [k, tone, g] of [['done', 'green', 'mkTick'], ['ended', 'ruby', 'mkCross'], ['draft', 'gray', 'mkDash'], ['you', 'amber', 'mkBang'], ['them', 'steel', 'mkInfo']])
    assert.match(mk, new RegExp(k + ":\\['" + tone + "','" + g + "'\\]"), k);
  assert.match(REG, /icon\(m\[1\],'reg-mk-g'/, 'a drawn icon, never a typed character');
  for (const g of ['mkTick', 'mkBang', 'mkInfo', 'mkCross', 'mkDash', 'mkStar']) assert.match(COMP, new RegExp('\\n  ' + g + ":'<"), g + ' is drawn');
  const base = rule('html.lg-new #ct-place .reg-mk');
  assert.match(base, /border-radius:50%/); assert.match(base, /color:var\(--color-surface\)/);
  for (const t of ['green', 'amber', 'steel', 'ruby']) assert.match(rule('html.lg-new #ct-place .reg-mk.is-' + t), new RegExp('background:var\\(--st-' + t + '-dot\\)'), t);
  const row = CN.slice(CN.indexOf('function cn2RowHtml'), CN.indexOf('function cn2GroupedHtml'));
  assert.match(row, /ndAvHtml\(r, P\)/, 'Home keeps the other side\'s initials');
});
