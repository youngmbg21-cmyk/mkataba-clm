'use strict';
/* f1088 — LESS SAID TWICE; THE CLAUSE LIST SHOWS THE PAPER'S OWN NUMBERS AND TITLES; A TYPED NUMBER OPENS THE COVER
   (owner, 16 Nov 2026: "you overall keep adding so much information … the name of the other party is mentioned
   everywhere"; "the headers on the panels, make them 1 size smaller"; over a lease whose articles are numbered in Roman:
   "the roman letters in the side panel … are supposed to be the title for clause beneath as seen in the contract";
   "when you type a contract number the cover is the door to the contract")
   1 · The Dossier's card opens on its headline: no eyebrow (stage, party, number), no sentence under it.
   2 · Jambo's panel headlines are 20, not 24.
   3 · The clause list: the mark carries the reading's own cite (3.2, IV, X.1, B); a section's title is the paper's own
       heading; a clause that opens with a short title sentence is named by it alone.
   4 · A contract number typed alone opens the contract on purpose (its Cover); inside a question it goes to the paper.
   At the parent every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const fn = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? undefined : j); };

test('f1088 (1) the Dossier card opens on its headline', () => {
  const PD = strip(read('js/paperdesk.js'));
  const five = fn(PD, 'pd2CardFiveHtml');
  assert.doesNotMatch(five, /pd2-card-top|pd2-card-who/, 'no eyebrow');
  assert.match(five, /data-pd2-card>\s*<p class="pd2-next" data-pd2-next>/, 'the headline first');
  assert.match(fn(PD, 'pd2CardHtml'), /return pd2CardFiveHtml\(c, '', at, String\(N\.head \|\| ''\)\.replace\(\/\\\.\$\/, ''\), '', pd2StepsHtml/, 'no sentence under it');
});

test('f1088 (2) the panels\' headlines are one size smaller', () => {
  const CSS = strip(read('index.html'));
  assert.match(CSS, /\.jov5-title\{margin:0;font-family:var\(--font-title\);font-size:20px;line-height:1\.2;/);
  assert.match(CSS, /\.pd2-card\.is-five > \.pd2-next\{margin:0;font-family:var\(--font-title\);font-size:20px;/);
  assert.doesNotMatch(CSS, /font-family:var\(--font-title\);font-size:24px;line-height:(1\.18|28px)/);
});

test('f1088 (3) the clause list: the paper\'s own numbers and titles', () => {
  const C = strip(read('js/views/contract.js'));
  const row = C.slice(C.indexOf('function docThreadRowHtml('), C.indexOf('function docThreadRowHtml(') + 3000);
  assert.match(row, /if\(five&&cite&&cite\.length<=8&&lab\.indexOf\(cite\)===0\)\{ const m=lab\.slice\(cite\.length\)\.match\(\/\^\[\.:\)\]\?\\s\+\/\); if\(m\) num=\[cite\+m\[0\], cite\]; \}/);
  assert.match(row, /own=String\(\(x\.el&&x\.el\.textContent\)\|\|''\)/, 'a section\'s title is the paper\'s heading');
  /* the title sentence, run as written */
  const at = C.indexOf('function _xrLead('), src = C.slice(at, C.indexOf('\n}\n', at) + 3);
  const lead = new Function('XR_LEAD_WORDS', 'XR_TITLE_WORDS', src + '; return _xrLead;')(7, 6);
  assert.equal(lead('3.2 Maintenance and Repairs. Tenant shall keep the interior of the Premises clean.', '3.2'), 'Maintenance and Repairs');
  assert.equal(lead('2.1 The Supplier shall supply an estimated 5000 metric tonnes per annum.', '2.1'), 'The Supplier shall supply an estimated 5000…');
  assert.equal(lead('4 Fees, taxes and costs. Each party bears its own.', '4'), 'Fees, taxes and costs. Each party bears…', 'a list is not a title');
  const CSS = strip(read('index.html'));
  assert.match(CSS, /\.doc-th-bead\[data-n\]\{width:auto;min-width:26px;padding:0 6px;/, 'a long number keeps its mark');
  assert.match(CSS, /\.doc-th-lbl ~ \.doc-th-rows \.doc-th-sec\{padding:18px 0 8px;font-size:12px;font-weight:var\(--w-strong\)/);
});

test('f1088 (4) a number typed alone opens the Cover', () => {
  assert.match(fn(strip(read('js/copilotacts.js')), 'jamboRefGo'), /roomHomeLand\(R\.c\.id, R\.question \? undefined : \{ cover: true \}\)/);
});
