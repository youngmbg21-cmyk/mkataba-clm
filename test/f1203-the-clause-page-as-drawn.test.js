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
  const pg = fnSrc(CT, 'docThreadPageHtml');
  test('the three buttons, Redline black, and its line', () => {
    assert.match(pg, /data-th-pg="plain"[\s\S]*data-th-pg="dive"[\s\S]*ui-btn-primary doc-th-pgbtn" data-th-pg="redline"/);
    assert.match(pg, /th_pg_redline_say/);
  });
  test('What was found: kind, title, stake, the Playbook path', () => {
    assert.match(pg, /th_pg_found/); assert.match(pg, /pd2PointKind/); assert.match(pg, /\[i18t\('pd2_fd_k_pb'\), pbLabel, p\.cat\]/);
    assert.match(BD, /return \{ by: 'std', cat, status:/, 'a Playbook point carries its category');
  });
  test('the act row: Mark reviewed · Ask a colleague · Next ›', () => {
    assert.match(pg, /data-th-pg="review"[\s\S]*data-th-pg="ask"[\s\S]*data-th-nav-step="1"/);
  });
  test('every press is an existing door', () => {
    const i = CT.indexOf("closest('#pd-thread [data-th-pg]')"); assert.ok(i >= 0);
    /* RE-POINTED 24 Nov 2026 (the handler grew — Redline any clause, Mark reviewed by Jambo's point): the whole handler,
       to its closing `});`, not a fixed 1800 characters */
    const h = CT.slice(i, CT.indexOf('\n  });', i) + 6);
    assert.match(h, /press\('\[data-th-explain\]'\)/); assert.match(h, /press\('\[data-stk-dive\]'\)/);
    assert.match(h, /press\('\[data-stk-review-all\]'\) \|\| press\('\[data-stk-review\]'\)/);
    assert.match(h, /press\('\[data-stk-redline\]'\)/); assert.match(h, /openRedlineWorkbench\(c\.id, \{ from: 'clauses'/);
    assert.match(h, /rlNoteFromSelection\(c, \{ clauseId, quote: q \}, \{ side: 'owner' \}\)/);
    assert.doesNotMatch(h, /persist\(|api\(|negoFileChange|negoEditClause/);
  });
  test('the old cards stand down on the page only', () => {
    assert.match(H, /:is\(#pd-thread\.is-page, #pd-thread \.is-page\) \.doc-th-rows :is\(\.stk-card, \.stk-group, \.doc-th-ask\)\{display:none\}/);
  });
  test('words in both books', () => {
    for (const k of ['th_pg_redline', 'th_pg_redline_say', 'th_pg_found', 'th_pg_ask', 'pd2_g_checked_none', 'pd2_lg_left_one', 'pd2_lg_left_other'])
      assert.equal((I.match(new RegExp(`^    ${k}: `, 'gm')) || []).length, 2, k);
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
