'use strict';
/* f1101 — THE LAST FOUR PANEL EDITS ON THE ONE EDIT POP-UP (owner, 19 Nov 2026: "Build 1", the drawing "The last five
   edits, today and the Legora way")
   1 · Naming a saved view: the panel draws no box; "+ Save this view" opens the one sheet with one name line,
       holding the view's own name; Save keeps what was typed (igViewSave).
   2 · A new note: in the new look beside Jambo's panel it is a sheet over My notes (the panel stays), the note, a
       title, the contract it is about and Remind me as chips; saved through the one writer (myNoteSave).
   3 · A duty: the one form in two steps, The duty then Money and proof, both in the form so Save reads every field;
       an Edit line on the duty's own panel opens it (the contract tab's own edit act).
   4 · The signing route: the route as quiet lines, nothing open by itself; one signer at a time on its own screen,
       ‹ Route back; the window is the sheet's width.
   At the parent none of these hold, so every claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name); return src.slice(i, src.indexOf('\n}', i) + 2); };

test('f1101 (1) a saved view is named in the one sheet, never in a box in the panel', () => {
  const IG = read('js/views/intelligence.js');
  assert.doesNotMatch(strip(fnBody(IG, 'igSavedViewsHtml')), /<form|<input/);
  const f = strip(fnBody(IG, 'igSavedViewForm'));
  assert.match(f, /lgpOpen\(\{ id:'ig-sv-form'/);
  assert.match(f, /id:'ig-sv-name', value:nm/, 'the line holds the view\'s own name');
  assert.match(strip(fnBody(IG, 'igSaveViewDoor')), /return igSavedViewForm\(true\);/, 'the map\'s Save view is the same door');
});

test('f1101 (2) a new note is a sheet over My notes in the new look; the one writer saves it', () => {
  const MN = read('js/views/mynotes.js');
  const n = strip(fnBody(MN, 'myNotesNew'));
  /* RE-POINTED 26 Nov 2026 (f1247): from another page the sheet opens over that page */
  assert.match(n, /const sheet = away \|\| mnSheetOn\(\);/); assert.match(n, /if \(!sheet\) _mn\.mode = 'new';/, 'the panel stays as it was');
  assert.match(n, /if \(sheet\) mnSheetPaint\(true\);/);
  assert.match(strip(fnBody(MN, 'mnSheetOn')), /newLookOn\(\) && [^;]*insFits\(\)/);
  const o = strip(fnBody(MN, 'mnSheetOpts'));
  for (const id of ["id:'mn-body'", "id:'mn-title'", 'id="mn-ct"', 'data-mn-when=', "attr:`id=\"mn-save\""]) assert.ok(o.includes(id), id);
  assert.match(strip(fnBody(MN, 'myNoteSave')), /getElementById\('mn-sheet'\) && typeof closeModal === 'function'\) closeModal\(\);/);
});

test('f1101 (3) a duty is edited in two steps, and its panel carries Edit', () => {
  const OB = read('js/obligations.js');
  const f = fnBody(OB, 'openObligationForm');
  assert.ok(f.indexOf('<div id="of-step-1">') > 0 && f.indexOf('<div id="of-step-2" hidden>') > f.indexOf('<div id="of-step-1">'));
  assert.ok(f.indexOf('id="of-amount"') > f.indexOf('<div id="of-step-2"'), 'the amount is step 2');
  assert.match(f, /<form class="lgp" id="of-form"/, 'the one sheet\'s look');
  assert.match(f, /of_need_desc/, 'Next asks for the one field step 1 must have');
  const p = strip(fnBody(OB, 'obPanelFive'));
  assert.match(p, /obPanelActs\(o, c, i, 'tab'\)\.some\(a => a && a\.k === 'edit'\)\) facts\.push\(\{ mark: 'pencil', t: i18t\('ob_edit_line'\)/);
  assert.match(OB, /querySelector\('\[data-obp-edit\]'\)\?\.addEventListener\('click'/);
});

test('f1101 (4) the signing route: quiet lines first, one signer on its own screen, the sheet\'s width', () => {
  const W = fnBody(read('js/approvals.js'), 'signerRouteWindow');
  assert.match(W, /const open=new Set\(\);/, 'nothing opens by itself');
  assert.match(W, /if\(one\) return card\(one\);/, 'a signer replaces the route');
  assert.match(W, /<div class="lgp sr-win" id="sr-win">/);
  assert.match(W, /maxWidth: window\.LGP_W \|\| '480px'/);
  assert.match(W, /id="sp-back" hidden>‹ /);
  assert.doesNotMatch(W, /style="\$\{FLD\}/, 'no boxed fields');
  const css = read('index.html');
  assert.match(css, /\.lgp\.sr-win \.sr-step,\.lgp\.sr-win \.sr-misses:not\(:empty\)\{border:0;/);
});

test('f1101 (5) the new words are in both books', () => {
  const I = read('js/i18n.js');
  for (const k of ['int_sv_head', 'int_sv_sub', 'int_sv_mine', 'mn_f_remind', 'mn_f_title_ph', 'mn_ct_change', 'of_step_duty', 'of_step_money',
    'of_next', 'of_need_desc', 'of_theirs_note', 'ob_edit_line', 'ob_edit_line_s', 'ap_sr_route', 'ap_sr_signer'])
    assert.equal((I.match(new RegExp('\\n\\s*' + k + ': ', 'g')) || []).length, 2, k);
});
