'use strict';
/* f1203 — THE CLAUSE PAGE, AS DRAWN (Round E, owner 24 Nov 2026: "you did not build these features", the Dossier L+S
   drawing's step 4 "A clause").
   (1) Plain English · Deep dive · Redline (black) with the line saying what Redline does; every press is an existing door.
   (2) "What was found N": each point under its kind, its stake, the Playbook's path.
   (3) Mark reviewed · Ask a colleague (a note on this clause with @) · Next ›; the foot keeps "Keep scrolling for …".
   (4) The count line under the paper and "Checked · nothing found" beside a clause with nothing on it, both read off the
       same points the margin draws. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CT = strip(R('js/views/contract.js')), PD = strip(R('js/paperdesk.js')), BD = strip(R('js/views/breakdown.js')), I = R('js/i18n.js'), H = R('index.html');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

describe('f1203 (1)-(3) the page body', () => {
  test('retired: the one-clause page is gone', () => {
  /* RETIRED 24 Nov 2026 (f1217; owner: "delete the one at a time feature and only leave the list version"): the one-clause
     page is deleted, its parts with it; the list alone stands */
  const S = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js/views/contract.js'), 'utf8');
  assert.ok(!S.includes('function docThreadPageHtml('), 'the clause page is gone');
  assert.ok(S.includes('const _thPage = false;'), 'the list alone');
  });
});

describe('f1203 (4) the count line and Checked · nothing found', () => {
  test('nothing found only on Clauses, once read, never on a section title', () => {
    const g = fnSrc(PD, 'pd2Groups');
    /* RE-POINTED 24 Nov 2026 (the ticks follow where the notes are drawn: the caller says so, the Approvals preview never) */
    assert.match(g, /readDone = !!\(opts && opts\.checked\) && typeof window\.stkLivePoints === 'function' && !!window\.stkLivePoints\(c\)/);
    assert.match(PD, /pd2Groups\(c, cv, notes, \{ checked: onClauses \}\)/);
    assert.match(g, /window\.docThreadIsSec\(r\)/);
  });
  test('the count line reads the margin\'s own groups', () => {
    const l = fnSrc(PD, 'pd2LegendPaint');
    assert.match(l, /groups\.forEach\(g => \{ if \(g\.ok\) return;/); assert.match(l, /pd2_lg_left/);
    assert.match(PD, /pd2LegendPaint\(onClauses \? groups : null\)/);
    assert.doesNotMatch(l, /persist\(|api\(/);
  });
});
