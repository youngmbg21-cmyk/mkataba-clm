'use strict';
/* f1222 — ONE PAPER TYPE, THE LEGORA + STRIPE WAY (owner's pick, 24 Nov 2026: "Build all rounds in one go").
   (1) A heading's own number stands in its own span (rlHeadNumHtml), the space kept inside it, so the heading's
       text reads exactly as before; a heading with no number, or a word first, is left alone.
   (2) Every plain heading the paper draws goes through it, the clause being typed too (its number not typable).
   (3) The screen's one closing block: wording one size, the same gap after every clause, the number column in
       the plain font, grey, figures lined up; tables line their figures up; never the signing copy (.pg-sign).
   (4) The editor panel's clause name is the plain font, not the paper's.
   At the parent all four fail: the number was part of the heading's text and the paper's type mixed. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEG = read('js/views/negotiation.js'), CE = read('js/views/clauseeditor.js'), H = read('index.html');

function helper(){
  const at = NEG.indexOf('const RL_HNUM_RE'); assert.ok(at > 0, 'the number reader exists');
  const end = NEG.indexOf('\n}', NEG.indexOf('function rlHeadNumHtml(', at)) + 2;
  return new Function(NEG.slice(at, end) + '\nreturn rlHeadNumHtml;')();
}

test('f1222 (1) the number stands in its own span; the heading\'s text is unchanged', () => {
  const f = helper();
  assert.equal(f('4. Governing law'), '<span class="rl-hnum">4. </span>Governing law');
  assert.equal(f('12.3 Fees'), '<span class="rl-hnum">12.3 </span>Fees');
  assert.equal(f('IV. Term'), '<span class="rl-hnum">IV. </span>Term');
  assert.equal(f('B. Schedule'), '<span class="rl-hnum">B. </span>Schedule');
  for (const s of ['Governing law', 'Article 5 Fees', '2025 Pricing', '30 days notice', '']) {
    if (/^\d+ [a-z]/.test(s)) continue; assert.equal(f(s), s, 'left alone: ' + s); }
  const strip = x => x.replace(/<[^>]+>/g, '');
  for (const s of ['4. Governing law', '12.3 Fees', 'IV. Term']) assert.equal(strip(f(s)), s, 'reads as before');
});

test('f1222 (2) every plain heading on the paper wears it, the typed one too', () => {
  const hits = (NEG.match(/<h4 class="rl-clause-h">\$\{rlHeadNumHtml\(_ne\(/g) || []).length;
  assert.ok(hits >= 6, 'the paper\'s plain headings: ' + hits);
  assert.doesNotMatch(NEG, /<h4 class="rl-clause-h">\$\{_ne\(/, 'no plain heading left without it');
  assert.equal((CE.match(/<h4 class="rl-clause-h">\$\{hn\(_cee\(/g) || []).length, 3, 'the editor\'s reading heading');
  assert.match(CE, /rlHeadNumHtml\(_cee\(_ceHead\)\)[^`]*contenteditable="false"/, 'the typed heading: its number is not typable');
});

test('f1222 (3) one closing block: one size, even gaps, a quiet number column, never the signing copy', () => {
  const B = H.slice(H.indexOf('ONE PAPER TYPE, THE LEGORA + STRIPE WAY'));
  assert.ok(B.length > 100, 'the block exists');
  const P = 'html.lg-new article.nego-doc.rl-paper:not(.pg-sign)';
  const rule = sel => { const i = B.indexOf(P + sel + '{'); assert.ok(i >= 0, sel); return B.slice(i, B.indexOf('}', i)); };
  const size = rule('').match(/font-size:([\d.]+px)/)[1];
  assert.ok(rule(' .rl-clause-h').includes('font-size:' + size), 'headings the wording\'s size');
  assert.match(rule(' .nego-clause.rl-clause'), /margin:0;padding-top:(\d+)px;padding-bottom:\1px/, 'the same gap after every clause');
  assert.match(rule(' .rl-hnum'), /margin-left:-(\d+)px[\s\S]*font-family:var\(--font-body\)[\s\S]*tabular-nums[\s\S]*color:var\(--color-neutral-400\)/);
  assert.match(B, /:is\(table, \.hati-doc table\)\{font-variant-numeric:tabular-nums\}/, 'tables line their figures up');
  assert.match(B, /#ce-doc article\.nego-doc :is\(\.rl-hnum, \.rl-paper-sub, \.rl-sigfor, \.rl-sigrow\)\{font-family:var\(--font-body\)\}/, 'the editor too');
});

test('f1222 (4) the editor panel\'s clause name is the plain font', () => {
  assert.match(H, /#clause-editor\.is-tabbed \.ce-thd\.is-ls \.ce-th\{[^}]*font-family:var\(--font-body\)/);
});
