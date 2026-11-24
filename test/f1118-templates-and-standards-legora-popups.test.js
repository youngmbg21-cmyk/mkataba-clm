'use strict';
/* f1118 — THE TEMPLATES AND STANDARDS POP-UPS ON THE ONE EDIT SHEET (owner, 19 Nov 2026: "Fix all batches" — every
   old-style edit pop-up moves onto the one Legora sheet, lgpOpen / lgpHtml in js/components.js)
   Group E: the saved-template fill (its short pop-up form; the page with the paper beside it keeps its layout), Save
   as template, the blanks editor, the template editor, Create in bulk, the builder's field editor and its "How
   should it look?", Template details, New standard's four starts, and the Playbook's Send for approval.
   Each is the one sheet: a serif head, lines with the label beside the words and no boxes, ONE black button, Cancel
   last; more than seven lines is a NEXT STEP (Next ›, ‹ Back), never a scroll; every id the wiring reads is kept.
   At the parent none of these hold, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const LIB = read('js/views/library.js');
const TB = read('js/views/templatebuilder.js');
const noBoxes = (f, name) => {
  assert.doesNotMatch(f, /--fld-edge|class="field"|class="p-6"|field-grid/, name + ' draws no boxes');
};

test('f1118 (1) the saved-template fill: the short form is the one sheet, in steps past seven lines; the page keeps its layout', () => {
  const f = strip(fnBody(LIB, 'openTemplateFillModal'));
  const sheet = f.slice(f.indexOf('const tfLgpHtml=()=>{'), f.indexOf('openModal(!_pv ? tfLgpHtml()'));
  assert.ok(sheet.length > 200, 'the sheet is built in its own place');
  assert.match(sheet, /<form class="lgp" id="tf-form" novalidate>/);
  for (const id of ['id="tf-party"', 'id="tf-cpemail"', 'id="tf-folder"', 'id="tf-create"', 'id="tf-skip"', 'id="tf-cancel"', 'id="tf-err"', "payWhoHtml('tf-side'"])
    assert.ok(sheet.includes(id), 'keeps ' + id);
  noBoxes(sheet, 'the fill sheet');
  assert.match(sheet, /if\(all\.length<=7\) groups\.push/, 'seven lines or fewer is one step');
  assert.match(sheet, /i18t\('tf_step_agreement'\)/, 'more is a next step: the agreement first, then the blanks');
  assert.match(f, /if\(stepTo\) stepTo\(errAt\); return false;/, 'a refused answer brings its own step back');
  assert.match(f, /: \{ maxWidth: window\.LGP_W\|\|'480px', ownFrame:true, label:t\.name \}\);/, 'at the sheet\'s width, its own frame');
  assert.match(f, /\{ page:\{ acts:\['tf-create','tf-skip','tf-cancel'\]/, 'the page with the paper beside it is untouched');
  assert.match(f, /getElementById\('tf-create'\)\.addEventListener\('click',create\)/, 'the one press');
});

test('f1118 (2) Save as template and Create in bulk open through lgpOpen, ids kept', () => {
  const s = strip(fnBody(LIB, 'saveContractAsTemplate'));
  assert.match(s, /lgpOpen\(\{ id:'tpl-sat'/); assert.match(s, /id:'tpl-name', value:defName/);
  assert.match(s, /<select id="tpl-folder" class="lgp-in">/); assert.match(s, /attr:'id="tpl-save"'/);
  noBoxes(s, 'Save as template');
  const b = strip(fnBody(LIB, 'openBulkCreateModal'));
  assert.match(b, /lgpOpen\(\{ id:'bk-form'/);
  assert.match(b, /attr:'id="bk-go" disabled/, 'Create drafts asleep until every row is valid');
  assert.match(b, /cancelAttr:'id="bk-cancel"', cancelLabel:i18t\('act_close'\)/);
  for (const id of ['id="bk-csv"', 'id="bk-file"', 'id="bk-out"']) assert.ok(b.includes(id), id);
  assert.doesNotMatch(b, /padding:20px 22px|maxWidth:'700px'/);
});

test('f1118 (3) the blanks editor and the template editor are the one sheet, in steps, their lists paged', () => {
  const be = strip(fnBody(LIB, 'openBlanksEditor'));
  assert.match(be, /<form class="lgp" id="be-form" novalidate>/);
  assert.ok(be.indexOf('<div id="be-step-2" hidden>') > be.indexOf('<div id="be-step-1">'), 'the paper, then the blanks');
  assert.match(be, /id="be-next" class="ui-btn ui-btn-primary lgp-go"/); assert.match(be, /id="be-save" class="ui-btn ui-btn-primary lgp-go" hidden/);
  assert.match(be, /data-be-page=/, 'more than six blanks is a next page, never a scroll');
  noBoxes(be, 'the blanks editor');
  const te = strip(fnBody(LIB, 'openTemplateEditor'));
  assert.match(te, /<form class="lgp" id="te-form" novalidate>/);
  for (const n of [1, 2, 3]) assert.ok(te.includes(`data-te-step="${n}"`), 'step ' + n);
  assert.match(te, /if\(!nm\)\{ teStep\(1\);/, 'a missing name shows the name step');
  assert.match(te, /id="te-delete" class="lgp-left is-danger"/, 'the ending act on the left, in danger ink');
  assert.match(te, /data-te-page=/);
  assert.doesNotMatch(te, /window\.HATI_FLD/);
  noBoxes(te, 'the template editor');
});

test('f1118 (4) the builder: the field editor in two steps, the look question as quiet choice lines', () => {
  const f = strip(fnBody(TB, 'tbFieldModal'));
  assert.match(f, /<form class="lgp" id="tbf-form" novalidate>/);
  assert.ok(f.indexOf('id="tbf-default"') > f.indexOf('<div id="tbf-step-2" hidden>'), 'default and help are the second step');
  assert.ok(f.indexOf('id="tbf-label"') < f.indexOf('<div id="tbf-step-2" hidden>'));
  assert.match(f, /if \(!label\) \{ step\(1\);/);
  assert.match(f, /maxWidth: window\.LGP_W \|\| '480px', ownFrame: true/);
  noBoxes(f, 'the field editor');
  /* RE-POINTED 23 Nov 2026 (Publish is one pop-up in three steps): the look question is step 2 of the one lgp sheet */
  assert.match(strip(fnBody(TB, 'tbLookAsk')), /lgpRepaint\(o\); else lgpOpen\(o\)/);
  const l = strip(fnBody(TB, 'tbPubOpts'));
  assert.match(l, /id: 'tb-pub', steps, title: i18t\('tb_look_title'/);
  assert.match(l, /<label class="lgp-tick is-radio/); assert.doesNotMatch(l, /sap-li|sap-list/);
  assert.match(l, /attr: 'id="tb-look-go"'/);
});

test('f1118 (5) Template details, New standard and Send for approval open through lgpOpen', () => {
  const m = strip(fnBody(read('js/views/templatelib.js'), 'tplLibMetaModal'));
  assert.match(m, /lgpOpen\(\{ id: 'tpllib-m'/); noBoxes(m, 'Template details');
  assert.match(m, /attr: 'id="tpllib-m-save"'/);
  const n = strip(fnBody(read('js/views/newstandard.js'), 'openNewStandard'));
  assert.match(n, /lgpOpen\(\{ id: 'ns-form'/); assert.match(n, /class="lgp-tick is-radio/); assert.doesNotMatch(n, /sap-li/);
  assert.match(n, /cancelAttr: 'data-dlg-cancel id="ns-close"'/);
  const d = strip(fnBody(read('js/views/ladder.js'), 'ldSendOpen'));
  assert.match(d, /lgpOpen\(\{ id: 'ld-send'/);
  assert.match(d, /lgpRowHtml\(\{ k: i18t\('ld_dlg_why'\), id: 'ld-why', type: 'area'/);
  assert.match(d, /attr: 'id="ld-send-go"'/); assert.doesNotMatch(d, /ld-dlg|ld-box/);
});

test('f1118 (6) drawn: Template details is four lines with no box, New standard four choice lines and one black button', () => {
  let cap = null;
  const w = loadViews(['js/components.js', 'js/views/templatelib.js', 'js/views/newstandard.js'], {
    state: { contracts: [], settings: {}, view: 'templates' },
    openModal: (html, opts) => { cap = { html, opts: opts || {} }; }, closeModal() {},
    tplStreamOpts: () => '<option value="proc">Procurement</option>', api: async () => ({}),
  });
  w.tplLibMetaModal({ id: 't1', name: 'N', category: 'nda', folder: 'proc', description: '' });
  assert.match(cap.html, /^<form class="lgp" id="tpllib-m"/);
  assert.equal((cap.html.match(/class="lgp-row/g) || []).length, 4, 'name, category, stream, description');
  assert.equal(cap.opts.maxWidth, '480px'); assert.equal(cap.opts.ownFrame, true);
  w.openNewStandard();
  assert.equal((cap.html.match(/class="lgp-tick is-radio/g) || []).length, 4);
  assert.equal((cap.html.match(/ui-btn-primary/g) || []).length, 1, 'one black button');
  assert.ok(cap.html.indexOf('id="ns-continue"') < cap.html.indexOf('id="ns-close"'), 'Cancel last');
});

test('f1118 (7) every new step name is in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['tbf_step_question', 'tbf_step_more', 'tf_step_agreement', 'tf_step_blanks', 'tf_step_blanks_n', 'te_step_name', 'bk_row_sheet', 'bk_row_filled'])
    assert.equal((I.match(new RegExp('^    ' + k + ':', 'gm')) || []).length, 2, k + ' in English and Swedish');
});
