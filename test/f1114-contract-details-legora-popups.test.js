'use strict';
/* f1114 — THE CONTRACT DETAILS POP-UPS ON THE ONE EDIT POP-UP (owner, "Fix all batches": every old edit pop-up moves
   onto the one Legora sheet, lgpOpen / lgpHtml / class="lgp" in js/components.js)
   1 · Ask a colleague about a sign-check finding (signCheckEscalate): who and a note, two lines, through lgpOpen.
   2 · Check the details read from a document (openMetaReview): the sheet, the facts shown a group at a time —
       Parties · Dates · Money · Trade terms · Risk — at most six lines a step (metaStepGroups); Confirm on every step.
   3 · The essentials of a new draft (openContractEssentials): its own dialog is the sheet, in two steps (the
       parties, then term and money); the paper still beside it where it fits; a host still gets the grid.
   4 · Upload a contract and confirm what was read (openUploadModal, uploadConfirmHtml): the sheet; the file, then
       what was read a few lines at a time; File contract, Next, Back / Another file and Cancel in the one foot,
       wired once when the sheet opens.
   None carries the old hand-made frame (class="p-6", class="field", the boxed grid). At the parent none of this
   holds, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const OLD = /class="p-6|class="field[ "]|rounded-lg border/;
const CT = read('js/views/contract.js');

test('f1114 (1) asking a colleague about a finding is the one sheet: who, a note', () => {
  const f = strip(fnBody(CT, 'signCheckEscalate'));
  assert.match(f, /lgpOpen\(\{ id:'sc-esc-form'/);
  assert.match(f, /id:'sc-esc-who', type:'select'/);
  assert.match(f, /id:'sc-esc-note', type:'area'/);
  assert.match(f, /primary:\{ label:i18t\('sc_esc_go'\), attr:'id="sc-esc-go"' \}/);
  assert.match(f, /cancelAttr:'data-dlg-cancel id="sc-esc-cancel"'/, 'Cancel keeps its own wiring (it answers false)');
  assert.doesNotMatch(f, OLD); assert.doesNotMatch(f, /HATI_FLD|openModal\(/);
});

test('f1114 (2) the review of what was read is the sheet, a group of at most six a step', () => {
  const ME = read('js/metadata.js');
  const f = strip(fnBody(ME, 'openMetaReview'));
  assert.match(f, /<form class="lgp" id="mr-form" novalidate>/);
  assert.match(f, /metaStepGroups\(META_FIELDS\.filter/);
  assert.match(f, /data-mr-pane="\$\{i\}"/);
  for (const id of ['id="mr-save"', 'id="mr-next"', 'id="mr-back"', 'id="mr-cancel"', 'id="mr-stop"']) assert.ok(f.includes(id), id);
  assert.match(f, /class="lgp-in"/);
  assert.doesNotMatch(f, OLD); assert.doesNotMatch(f, /grid grid-cols-2|max-height:min\(52vh/, 'no scroll of boxes');
  assert.match(ME, /Object\.assign\(window,\{[^}]*\bmetaStepGroups\b/, 'published');
  /* the groups: every field once, none past six */
  const g = strip(fnBody(ME, 'metaStepGroups'));
  assert.match(g, /i\+=META_STEP_MAX/);
  assert.match(ME, /const META_STEP_MAX = 6;/);
});

test('f1114 (3) the essentials of a new draft open the sheet in two steps; a host keeps the grid', () => {
  const TF = read('js/templatefields.js');
  const f = strip(fnBody(TF, 'openContractEssentials'));
  assert.match(f, /<form class="lgp" id="ce-form" novalidate>/);
  assert.match(f, /data-ce-pane="\$\{i\}"/);
  assert.match(f, /const CE_STEP_ONE = \['party','counterparty','cpemail','side'\];/);
  assert.match(f, /<button type="submit" id="ce-create"/);
  assert.match(f, /<p class="lgp-err" id="ce-err" role="alert"><\/p>/);
  assert.match(f, /class="lgp-in/);
  assert.match(f, /if\(o\.host\)\{\s*o\.host\.innerHTML = gridHtml \+ errHtml;/, 'the New agreement sheet still gets the grid');
  const dlg = f.slice(f.indexOf('const formHtml'));
  assert.doesNotMatch(dlg, /\$\{gridHtml\}|style="\$\{ST\}"/, 'the dialog draws no boxes');
});

test('f1114 (4) the upload is the sheet: the file, then what was read, a step at a time, one foot wired once', () => {
  const o = strip(fnBody(CT, 'openUploadModal'));
  assert.match(o, /<form class="lgp" id="up-form" novalidate>/);
  assert.match(o, /<div class="lgp-ft">[\s\S]*id="up-back"[\s\S]*id="up-go"[\s\S]*id="up-next"[\s\S]*id="up-cancel"/, 'File contract, Next, then Cancel last');
  assert.match(o, /getElementById\('up-go'\)\.addEventListener\('click',e=>\{ e\.preventDefault\(\); submitUpload\(\); \}\);/);
  assert.doesNotMatch(o, OLD);
  const card = strip(fnBody(CT, 'uploadConfirmHtml'));
  assert.match(card, /data-up-pane="\$\{i\}"/);
  assert.match(card, /class="lgp-row"/);
  assert.doesNotMatch(card, OLD); assert.doesNotMatch(card, /up-grid|<details|id="up-go"/);
  const run = strip(fnBody(CT, 'runUploadPipeline'));
  assert.match(run, /uploadStepShow\(1\);/);
  assert.doesNotMatch(run, /getElementById\('up-go'\)\.addEventListener/, 'never wired per drawing');
});
