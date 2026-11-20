'use strict';
/* f1115 — THE NEGOTIATION POP-UPS ON THE ONE LEGORA SHEET (owner, 19 Nov 2026: "Fix all batches")
   1 · Importing their reply (the code, or the marked-up Word file): two chips, one line each way, Import, Cancel last.
   2 · The link was updated but not sent: the link on one read-only line, Copy link, Close last.
   3 · Sending the negotiation memo to a colleague: who and what to say as two lines, a refusal said in the sheet.
   4 · Giving a note to a colleague: who and by when as two lines, Take it back on the left when given.
   Every id the wiring and the browser checks press is kept. At the parent each was a hand-made pop-up, so every
   claim fails there. (reviewProposedRound stays a full-size page: a whole document's changes, decided one by one.) */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const CORE = read('js/core.js');
const NEG = read('js/views/negotiation.js');
const oldLook = f => { assert.doesNotMatch(f, /class="p-6"|class="field|rvd-head|rvd-foot|class="sap-f"|class="imp-tabs"/, 'no hand-made pop-up left'); };

test('f1115 (1) importing their reply is the one sheet, both ways kept', () => {
  const f = strip(fnBody(CORE, 'openImportModal'));
  assert.match(f, /lgpOpen\(\{ id:'imp-form'/);
  assert.doesNotMatch(f, /openModal\(/);
  oldLook(f);
  for (const id of ['data-imp-tab=', 'data-imp-pane="code"', 'data-imp-pane="word" hidden', "id:'imp-code'", 'id="imp-docx-go"', 'id="imp-docx"', 'id="imp-docx-note"', 'id="imp-go"', 'id="imp-cancel"'])
    assert.ok(f.includes(id), id);
  assert.match(f, /class="lgp-chips" role="tablist"/, 'the two ways in are chips');
  assert.match(f, /go\.hidden=k!=='code'/, 'Import stands down on the Word way');
  assert.match(f, /applyResponse\(c, b64d\(fval\('imp-code'\)\)\)/, 'the code is read as before');
});

test('f1115 (2) the link that was not sent is on one read-only line, Copy link the one act', () => {
  const f = strip(fnBody(CORE, 'reshareNotSentModal'));
  assert.match(f, /lgpOpen\(\{ id:'rs-form'/);
  assert.doesNotMatch(f, /openModal\(/);
  oldLook(f);
  assert.match(f, /<textarea id="rs-link" class="lgp-in is-area" readonly/);
  assert.match(f, /primary:\{ label:i18t\('co_copy_link'\), attr:'id="rs-copy"' \}/);
  assert.match(f, /cancelLabel:i18t\('act_close'\), cancelAttr:'id="rs-close"'/);
  assert.match(f, /roundReachedByHand\(c, out/, 'copying is still the hand-over');
});

test('f1115 (3) the memo goes to a colleague from the one sheet; a refusal is said in it', () => {
  const f = strip(fnBody(NEG, 'openNegoMemoShare'));
  assert.match(f, /lgpOpen\(\{ id: 'ng-memo-form'/);
  assert.doesNotMatch(f, /openModal\(/);
  oldLook(f);
  assert.match(f, /id: 'ng-memo-who', type: 'select'/);
  assert.match(f, /id: 'ng-memo-note', type: 'area'/);
  assert.match(f, /<p class="lgp-err" id="ng-memo-err" role="alert" hidden><\/p>/);
  assert.match(f, /attr: 'id="ng-memo-go"'/);
  assert.match(f, /onClose: typeof o\.back === 'function'/, 'closing still goes back to the memo');
});

test('f1115 (4) a note is given from the one sheet; Take it back on the left only when given', () => {
  const f = strip(fnBody(NEG, 'rlNpGivePick'));
  assert.match(f, /lgpOpen\(\{ id: 'npg-form'/);
  assert.doesNotMatch(f, /openModal\(/);
  oldLook(f);
  assert.match(f, /id: 'npg-who', type: 'select', value: \(now && now\.name\)/);
  assert.match(f, /<input class="lgp-in" id="npg-due" type="date" min="/, 'no day before today');
  assert.match(f, /left: now \? \{ label: i18t\('ng_np_give_off'\), attr: 'id="npg-off"' \} : null/);
  assert.match(f, /attr: 'id="npg-go"'/);
  assert.match(f, /cancelAttr: 'data-dlg-cancel id="npg-cancel"'/);
});
