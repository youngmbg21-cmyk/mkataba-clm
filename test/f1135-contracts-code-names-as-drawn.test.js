'use strict';
/* f1135 — CODE NAMES ON THE CONTRACTS PAGE AS DRAWN (P-31, 21 Nov 2026): every new part of the page that names a contract
   or quotes its paper says only what the book holds for a code-named deal (its code name), never its paper's words:
   the row's quote line (regLsQuoteHtml) is empty for a code-named deal, the panels' readings skip code-named rows
   (regLsListPanelHtml, regFoldersLsPanelHtml), the Wall's chosen panel is never drawn for one (pdChosenHtml), and the
   real name never leaves the server for an outsider (cnMask, its own tests). Run on the source and in a sandbox. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const REG = strip(read('js/views/register.js'));
const PD = strip(read('js/paperdesk.js'));
const fnSrc = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists'); return src.slice(i, src.indexOf('\n}', i) + 2); };

test('f1135 (1) the row\'s quote line says nothing of a code-named deal\'s paper', () => {
  const sb = { esc: s => String(s), regLsEndOf: () => '2027-06-30', regSayEndQuote: () => ({ sec: '§ 2', quote: 'The real Falcon Holdings term ends on 30 June 2027.' }) };
  vm.createContext(sb); vm.runInContext(fnSrc(REG, 'regLsQuoteHtml'), sb);
  assert.equal(sb.regLsQuoteHtml({ id: 'FAL-1', name: 'Project Falcon', _codeNamed: true }), '', 'no words, no §');
  assert.match(sb.regLsQuoteHtml({ id: 'MK-1', name: 'Supply' }), /The real Falcon Holdings term/, 'a named contract keeps its line');
});
test('f1135 (2) the panels read no code-named row; the chosen paper\'s panel is never drawn for one', () => {
  assert.match(fnSrc(REG, 'regLsListPanelHtml'), /cs=cs\.filter\(c=>c&&!c\._codeNamed\)/);
  assert.match(fnSrc(REG, 'regFoldersLsPanelHtml'), /\.filter\(c=>c&&!c\._codeNamed\)/);
  assert.match(fnSrc(PD, 'pdChosenHtml'), /pd2On\(\) && !c\._codeNamed\) return/);
});
