'use strict';
/* f1047 — A REDRAW KEEPS YOUR PLACE AND YOUR WORDS (owner, 13 Nov 2026, the flash survey; "i am adamant i want
   everything done tonight"). The rebuild measure found, on the pages: a long list thrown to its top when the page
   redrew (Approvals, Obligations, Our paper, the Pulse board, Jambo's house), and a half-typed question lost from
   the list pages' own ask box and from Settings' Jambo box on any repaint.
   Source-sliced: comments stripped, each check pinned to its function's own region.
   The browser half is test/chromium/a-page-redraw-keeps-your-place-verify.js. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const read = f => strip(fs.readFileSync(path.join(__dirname, '..', f), 'utf8'));
const region = (src, start, len = 4000) => { const i = src.indexOf(start); assert.ok(i >= 0, 'missing: ' + start); return src.slice(i, i + len); };

test('f1047 (1) a same-page redraw keeps the scrollers INSIDE the page, not only the page', () => {
  const s = read('js/app.js');
  const v = region(s, 'function setView(view){', 30000);
  assert.match(v, /const _keepIn = \[\];/, 'read before the redraw');
  assert.match(v, /if\(_sameView\)\{[\s\S]{0,260}_keepIn\.push\(\[el\.id, el\.scrollTop\]\)/, 'only for the page already on screen, every scroller with an id');
  assert.match(v, /_putIn\(\);[\s\S]{0,260}requestAnimationFrame\(\(\)=>\{ sc\.scrollTop=_keepTop; _putIn\(\); \}\)/, 'put back at once and again after the frame');
  assert.match(v, /else sc\.scrollTo\(\{top:0\}\)/, 'a different page still starts at the top');
});

test('f1047 (2) the Pulse board is ranked again where the reader stands, redrawing its table and head only', () => {
  const s = read('js/views/pulse.js');
  assert.match(region(s, 'function puCritSet', 500), /puRedrawInPlace\(\)/);
  assert.match(region(s, 'function puHold', 300), /puRedrawInPlace\(\)/);
  const r = region(s, 'function puRedrawInPlace', 500);
  assert.match(r, /_pu\.sig = null; puRepaint\(\)/, 'the ticker\'s own redraw, its "nothing moved" lifted so the lit chip moves');
  assert.match(r, /keepScroll\(\(\) => renderPulse\(\)\)/, 'the whole page only where the table is not drawn yet');
});

test('f1047 (3) the other ask boxes have a draft of their own, by seat', () => {
  const s = read('js/components.js');
  const j = region(s, 'function boxDraftJoin', 700);
  assert.match(j, /dataset\.boxDraft/, 'wired once');
  assert.match(j, /if \(v && !box\.value\)/, 'put back only where the box comes back EMPTY');
  assert.match(s, /Object\.assign\(window,\s*\{[^}]*boxDraftJoin[^}]*\}\)/s, 'published');
  assert.doesNotMatch(region(s, 'function boxDraft(', 900), /lsSet|localStorage|fetch\(/, 'in memory only');
});

test('f1047 (4) the list panel\'s box joins on every paint and is emptied only where its words are used', () => {
  const s = read('js/views/inspector.js');
  assert.match(s, /const inp = host\.querySelector\('#jl-q'\);\s*if \(inp && typeof boxDraftJoin === 'function'\) boxDraftJoin\(inp, 'list'\)/);
  assert.match(s, /if \(jlAsk\(v, \{ typed: true \}\) !== false\)\{ q\.value = ''; if \(typeof boxDraftClear === 'function'\) boxDraftClear\('list'\); \}/, 'asking empties it; a busy Jambo that refused the words does not');
  assert.equal((s.match(/boxDraftClear\('list'\)/g) || []).length, 2, 'the two asking paths, and nowhere else');
});

test('f1047 (5) Settings\' Jambo box the same', () => {
  const s = read('js/views/settings.js');
  assert.match(region(s, 'function stJbTalkPaint', 400), /boxDraftJoin\(_b,'settings'\)/);
  assert.match(s, /box\.value=''; if\(typeof boxDraftClear==='function'\) boxDraftClear\('settings'\)/, 'asking empties it');
  assert.match(region(s, 'function stJamboFocus', 400), /boxDraftSet\('settings', box\.value\)/, 'words PUT in the box tell its home');
});
