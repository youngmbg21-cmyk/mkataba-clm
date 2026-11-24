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
  const N = fn(CT, 'docThreadNavSync');
  assert.match(N, /card\.classList\.toggle\('is-page', !!\(_thPage && docThreadNavOn\(\)\)\)/);
  assert.match(N, /data-pd-tab="copilot"[\s\S]*th_step_of[\s\S]*th_page_hint[\s\S]*data-th-page-toggle/);
  /* RE-POINTED 24 Nov 2026 (Round E, as drawn): Next › stands in the page's act row, the foot keeps "Keep scrolling for …" */
  assert.match(N, /th_page_next/);
  assert.match(R('js/views/contract.js'), /data-th-pg="ask"[\s\S]{0,200}data-th-nav-step="1"/);
  assert.match(N, /window\.stkLivePoints\(thLiveContract\(\)\)/);
  assert.match(H, /#pd-thread\.is-page \.doc-th-rows > :not\(\.is-open\)\{display:none\}/);
  assert.match(CT, /closest\('#pd-thread \[data-th-nav-step\]'\)/);
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
