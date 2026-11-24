'use strict';
/* f1200 — THE DOSSIER AS DRAWN, ROUND C (owner, 24 Nov 2026: "you have to build as drawn"): the clause page — the open
   clause alone, its name large, ‹ Dossier · k of n · "Scroll or press ›" · ‹ ›, its badges and the paper's words, "Keep
   scrolling for <next>" with Next ›, "All N clauses" back to the list; one scroll anywhere over it steps; the head's arrows
   their own marker (a press never steps twice). THE READING LINE: once per read, a hairline across the paper's window,
   notes landing as it passes; less motion: none. The paper settles once with the card's rare arrival. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CT = strip(R('js/views/contract.js')), PD = strip(R('js/paperdesk.js')), H = R('index.html');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };

test('f1200 (1) the clause page', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');

});
test('f1200 (2) the reading line, once per read', () => {
  const L = fn(PD, 'pd2ReadLinePlay');
  assert.match(L, /prefers-reduced-motion: reduce/); assert.match(L, /line\.animate\(/); assert.doesNotMatch(L, /persist\(|api\(/);
  assert.match(R('js/views/breakdown.js'), /if \(!_bd\.err && typeof window\.pd2ReadLinePlay === 'function'\)/);
  assert.equal((PD.match(/pd2ReadLinePlay\(\);/g) || []).length, 0, 'the desk never plays it itself; the read does');
});
test('f1200 (3) the paper settles with the card\'s rare arrival only', () => {
  const P = fn(strip(R('js/components.js')), 'jovPlay');
  assert.match(P, /const cv = document\.getElementById\('ig-canvas'\);[\s\S]*cv\.animate\(/);
});
