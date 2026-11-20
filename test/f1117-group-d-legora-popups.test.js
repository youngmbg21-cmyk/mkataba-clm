'use strict';
/* f1117 — SIGNING, APPROVALS, INTERNAL REVIEW AND THE HANDOVER ON THE ONE EDIT POP-UP (owner, "Fix all batches": every
   old edit pop-up on the one Legora sheet; group D).
   1 · Ask for approval to sign (openSignApprovalDialog): lgpOpen, each fact a line, the note a line, the one black
       button keeps its id.
   2 · Ask for / hand back / note an internal review (reviewAskModalHtml + openReviewAskModal, openReviewReturnModal,
       openReviewNoteModal): built by hand on the sheet's parts (the file runs on stages without js/components.js); the
       changes the ask covers are one line, the tick list its next screen.
   3 · Hand over for signing, send again, read their copy (openHandoverWindow, openOutsideSendAgain, _hoFileDialog):
       the one sheet, lines with no boxes, Cancel last.
   4 · Check and file the signed copy (_hoFilingScreen): the copy on the left, the sheet on the right in two steps.
   No pop-up keeps the old hand-made frame (`class="field"`, `p-6`, the 22px padded div, the rvd head). Behaviour is
   not asserted here; the area's own tests hold it. At the parent none of these hold, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };
const OLD = /class="field"|class="p-6"|padding:22px var\(--s-6\)|reviewDialogHeadHtml\(|class="rvd-(?:body|foot)"|font-family:var\(--font-heading\)/;

test('f1117 (1) asking for approval to sign is the one sheet', () => {
  const f = strip(fnBody(read('js/approvals.js'), 'openSignApprovalDialog'));
  assert.match(f, /lgpOpen\(\{ id:'sa-dlg'/);
  assert.match(f, /id:'sa-ask-note', type:'area', max:SA_NOTE_MAX/, 'the note is a line, its limit kept');
  assert.match(f, /primary:\{ label:i18t\('sa_dlg_go'\), attr:'id="sa-ask-go"' \}/, 'the black button keeps its id');
  assert.match(f, /cancelAttr:'data-dlg-cancel id="sa-ask-cancel"'/);
  assert.doesNotMatch(f, /class="sa-dlg"|sa-foot|openModal\(/);
  assert.doesNotMatch(f, OLD);
});

test('f1117 (2) the internal review asks, hand-backs and notes are the one sheet', () => {
  const RV = read('js/review.js');
  const ask = strip(fnBody(RV, 'reviewAskModalHtml'));
  assert.match(ask, /<form class="lgp rv-ask" id="rv-ask-form" novalidate>/);
  assert.match(ask, /<input id="rv-who" type="text" class="lgp-in"/);
  assert.match(ask, /id="rv-pick-screen" hidden/, 'the tick list is the next screen, not a scroll');
  assert.match(ask, /<button type="button" id="rv-send" class="ui-btn ui-btn-primary lgp-go"/, 'Send is type="button": Enter sends nothing');
  assert.match(ask, /<button type="button" data-dlg-cancel id="rv-cancel-modal" class="ui-btn">[^<]*<\/button>\s*<\/div><\/form>/, 'Cancel last');
  assert.doesNotMatch(ask, OLD); assert.doesNotMatch(ask, /RV_FLD|sap-body|sap-f"/);
  const open = strip(fnBody(RV, 'openReviewAskModal'));
  assert.match(open, /ownFrame: true/);
  assert.match(open, /getElementById\('rv-pick-open'\)\?\.addEventListener\('click', \(\) => pickScreen\(true\)\)/);
  for (const [name, form, ok] of [['openReviewReturnModal', 'rv-return-form', 'rv-rok'], ['openReviewNoteModal', 'rv-cnote-form', 'rv-cok']]){
    const f = strip(fnBody(RV, name));
    assert.match(f, new RegExp(`<form class="lgp [a-z-]+" id="${form}" novalidate>`), name);
    assert.match(f, new RegExp(`<button type="button" id="${ok}" class="ui-btn ui-btn-primary lgp-go"`), name + ' keeps its black button');
    assert.match(f, /class="lgp-in is-area"/, name + ' writes on a line');
    assert.match(f, /ownFrame: true/);
    assert.doesNotMatch(f, OLD); assert.doesNotMatch(f, /RV_FLD/);
  }
});

test('f1117 (3) handing over, sending again and reading their copy are the one sheet', () => {
  const HO = read('js/views/handover.js');
  const w = strip(fnBody(HO, 'openHandoverWindow'));
  assert.match(w, /<form class="lgp ho-win" id="ho-win" novalidate>/);
  assert.match(w, /<input id="ho-to-email" type="email" class="lgp-in"/);
  assert.match(w, /<button id="ho-go" type="button" class="ui-btn ui-btn-primary lgp-go">/, 'type="button": Enter hands nothing over');
  assert.match(w, /class="lgp-chip is-on" data-ho-ch="email"/);
  assert.doesNotMatch(w, OLD); assert.doesNotMatch(w, /const FLD|ho-grid/);
  const sa = strip(fnBody(HO, 'openOutsideSendAgain'));
  assert.match(sa, /lgpOpen\(\{ id: 'ho-sa-form'/);
  assert.match(sa, /id: 'ho-sa-email', type: 'email'/);
  assert.match(sa, /attr: 'id="ho-sa-go"'/);
  assert.doesNotMatch(sa, OLD); assert.doesNotMatch(sa, /const FLD/);
  const fd = strip(fnBody(HO, '_hoFileDialog'));
  assert.match(fd, /lgpOpen\(\{ id: 'ho-fd-form'/);
  assert.match(fd, /<input id="ho-fd-file" type="file"/);
  assert.match(fd, /attr: 'id="ho-fd-go"'/);
  assert.doesNotMatch(fd, OLD);
});

test('f1117 (4) checking and filing the signed copy: the sheet beside the copy, in two steps', () => {
  const f = strip(fnBody(read('js/views/handover.js'), '_hoFilingScreen'));
  assert.match(f, /<form class="lgp ho-file-r" id="ho-f-form" novalidate/);
  assert.match(f, /<div id="ho-f-step-2" hidden>/, 'the filing lines are the second step');
  assert.match(f, /<select id="ho-via" class="lgp-in">/);
  assert.match(f, /<input id="ho-d-signed" type="date" class="lgp-in"/);
  assert.match(f, /<span id="ho-f-acts" hidden><\/span>\s*<button data-dlg-cancel id="ho-f-cancel"/, 'the acts, then Cancel last');
  assert.match(f, /getElementById\('ho-f-next'\)\?\.addEventListener\('click', \(\) => fStep\(2\)\)/);
  assert.doesNotMatch(f, OLD); assert.doesNotMatch(f, /const FLD|ho-file-foot/);
});

test('f1117 (5) every new word is in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['rv_changes_k', 'rv_pick_of', 'rv_pick_open', 'ho_note_k', 'ho_copy_k', 'ho_step_copy', 'ho_step_filing'])
    assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});

test('f1117 (6) the hand-over is two steps, never a scroll: the agreement, then sending it; the black button on both', () => {
  const src = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'js', 'views', 'handover.js'), 'utf8');
  const i = src.indexOf('async function openHandoverWindow('), w = src.slice(i, src.indexOf('\n}', i));
  assert.ok(w.indexOf('<div id="ho-s1">') > 0 && w.indexOf('<div id="ho-s2" hidden>') > w.indexOf('<div id="ho-s1">'));
  assert.ok(w.indexOf('id="ho-email-box"') > w.indexOf('<div id="ho-s2" hidden>'), 'to whom and the message are step 2');
  assert.match(w, /return err\(i18t\('ho_need_email'\), 2\);/, 'a missing address brings step 2 back');
  assert.match(w, /return err\(i18t\('ho_how_need_day'\), 1\);/, 'a missing day brings step 1 back');
});
