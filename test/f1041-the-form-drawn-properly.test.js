'use strict';
/* f1041 — THE FILL IN FORM, THE LEGORA WAY, DRAWN PROPERLY (owner, 13 Nov 2026: "this page is a very ugly page";
   docs/WORKORDER-fill-in-form-legora.md). (1) a paper's Title Case placeholder is shown as a sentence, a shouted heading
   quietly; (2) the sentence round a blank is read off the paper's own markup, never invented, and what is typed shows inside
   it (drawing only); (3) one row shape: a grid, one answer width, no drag corner, the tick; (4) All · Needed · On record,
   the head says "on record", the foot says once that nothing is saved; (5) both books and the Handbook.
   Browser: form-the-legora-way-verify 1b. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const SRC = read('js/paperdesk.js'), P = stripCom(SRC);
const fn = name => { const m = SRC.match(new RegExp('\\nfunction ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}')); assert.ok(m, name + ' is in the desk'); return m[0]; };

test('f1041 (1) the name in sentence case, the heading said quietly', () => {
  const nameShown = new Function(fn('pd2FormNameShown') + '\nreturn pd2FormNameShown;')();
  assert.equal(nameShown('Landlord Principal Place of Business Address'), 'Landlord principal place of business address');
  assert.equal(nameShown('Tenant Name'), 'Tenant name');
  assert.equal(nameShown('Company VAT Number'), 'Company VAT number', 'a word in capitals is kept');
  assert.equal(nameShown('Registered address'), 'Registered address', 'already a sentence: left');
  assert.equal(nameShown('Address of the branch office'), 'Address of the branch office', 'not title case: left as written');
  assert.equal(nameShown('Counterparty'), 'Counterparty');
  const secShown = new Function(fn('pd2FormSecShown') + '\nreturn pd2FormSecShown;')();
  assert.equal(secShown('ARTICLE I: PREMISES AND LEASE TERM'), 'Article I: premises and lease term');
  assert.equal(secShown('COMMERCIAL LEASE AGREEMENT'), 'Commercial lease agreement');
  assert.equal(secShown('Premises and Term'), 'Premises and Term', 'a heading with small letters is the paper\'s own');
});
test('f1041 (2) the sentence is read off the paper, never invented; typing shows inside it', () => {
  const Q = fn('pd2BlankQuote');
  assert.match(Q, /docBody\(c\)/, 'off the paper\'s own markup');
  assert.match(Q, /\[data-field="\$\{q\}"\],\[data-sync="\$\{q\}"\],\[data-field-key="\$\{q\}"\],\[data-upblank="\$\{q\}"\]/, 'the same four spots contractFieldPeer finds');
  assert.match(Q, /if \(!\/\[A-Za-z\\u00C0-\\u024F\]\/\.test\(raw\)\) return null;/, 'a bare ruled line is never matched to a sentence');
  assert.doesNotMatch(stripCom(Q), /api\(|aiFill|fetch\(/, 'no AI, no route');
  const D = fn('pd2FormRowDress');
  assert.match(D, /if \(!Q\)\{ if \(sec\) src\.appendChild\(document\.createTextNode\(' ' \+ sec\)\); return; \}/, 'no sentence: the section, no quote');
  assert.match(D, /<span class="pd2-fm-gap" data-pd2-gap="\$\{E\(key\)\}"><\/span>/);
  const G = fn('pd2FormGapSync');
  assert.doesNotMatch(stripCom(G), /persist|tplFormCommit|contractBlankSet|dispatchEvent/, 'drawing only');
  assert.match(P, /try \{ pd2FormGapSync\(e\.target\.closest\('tr'\)\); \} catch \(_\)\{\}/);
});
test('f1041 (3) one row shape', () => {
  const H = stripCom(read('index.html'));
  assert.match(H, /\.pd2-fm-mid \.pd2-fm-list > tr\{display:grid;grid-template-columns:minmax\(0,1fr\) 300px 16px;grid-template-rows:auto 1fr;/);
  assert.match(H, /\.pd2-fm-mid td\.pd-og-v textarea\{[^}]*resize:none;[^}]*white-space:nowrap\}/, 'an address is one line, no drag corner');
  assert.match(H, /\.pd2-fm-mid \.pd2-fm-list > tr:is\(\.is-has, :not\(\[data-pd2-owed\]\)\)::after\{visibility:visible\}/);
  assert.doesNotMatch(H, /\.pd2-fm-mid td\.pd-og-v :is\(input:not\(\[type=checkbox\]\),select,textarea\)\{[^}]*max-width:260px/);
});
test('f1041 (4) the chips, the head and the foot', () => {
  assert.match(P, /\['rec', 'pd2_fm_chip_rec'\]/);
  assert.doesNotMatch(P, /\['paper', 'pd2_fm_chip_paper'\]/);
  assert.match(stripCom(read('index.html')), /table\[data-pd2-fm-show="rec"\] tr:is\(\[data-pd2-owed\], \.pd2-fm-sep\)\{display:none\}/);
  assert.match(P, /_pdT\('pd2_fm_foot', \{ k, n \}\) \+ ' · ' \+ _pdT\('pd2_fm_how'\)/);
  assert.equal((P.match(/_pdT\('pd2_fm_how'\)/g) || []).length, 1, 'said once, in the foot');
  assert.match(P, /sep\.className = 'pd2-fm-sep'/);
});
test('f1041 (5) both books; the Handbook says it', () => {
  const I = read('js/i18n.js');
  ['pd2_fm_chip_rec', 'pd2_fm_onrec', 'pd2_fm_rec_head'].forEach(k => assert.equal((I.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k));
  assert.match(read('js/handbook.js'), /what you type shows inside that sentence/);
});
