/* f426 — THEIR PAGE HAS AN EDIT BUTTON, THE EDITOR KEEPS THEIR REDLINES
   COLUMN, AND DONE IS A SAVE SYMBOL ON BOTH SEATS
   (Young, 28 Sep 2026: "the landing page should come with a button at the top
   that says edit but you can not edit on the landing page until you click
   edit"; "there should be no outline around the clause … If you attempt to
   click elsewhere you get pop up alerting you to save"; "okay we will go with
   symbol … build it both in the counterparty and owner page")

   (1)  their header carries Edit, only on the workbench, only where the link
        can be answered and the editor fits; their paper draws no pencil.
   (2)  Edit opens the editor through the column's own door, not typing.
   (3)  on their page the editor is fitted beside the live Redlines column,
        its foot pinned under it, the header stood down while it is open.
   (4)  a press on their column while a draft is unfiled asks the page's own
        "Leave this clause?" and, on leaving, drops only what was not filed.
   (5)  the Done pill is a drawn disk named Save with no word; it hides until
        something is typed; Ctrl/⌘+S files through the same checked save;
        a tick marks it saved.
   (6)  every new word is in both books.
   Behaviour in a browser: their-edit-page-verify; clause-editor-verify 11b,
   11f, 11g, 32c, 32d2; ladder-verify 21b.
   Red at the parent (b258635): every claim. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PT = R('js/views/portal.js'), CE = R('js/views/clauseeditor.js'), NG = R('js/views/negotiation.js'),
  NCSS = R('js/views/negotiation-css.js'), I18N = R('js/i18n.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function region(src, name){
  const at = src.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = src.indexOf('{', src.indexOf(')', at));
  let d = 0;
  for (let i = open; i < src.length; i++){
    if (src[i] === '{') d++;
    else if (src[i] === '}' && !--d) return src.slice(at, i + 1);
  }
  throw new Error('unbalanced ' + name);
}

test('f426 (1) Edit is in their header, guarded three ways, and their paper draws no pencil', () => {
  const e = code(region(PT, 'portalEditHtml'));
  assert.match(e, /if\(!PORTAL_FOOT_COMPACT \|\| portalReadOnly\(\)\) return '';/);
  assert.match(e, /clauseEditorFits\(\)/);
  assert.match(e, /id="pt-edit"[^>]*data-pt-edit/);
  assert.match(code(region(PT, 'portalNegoFootHtml')), /\$\{portalEditHtml\(\)\}/);
  assert.match(PT, /noPaperPencil:true,/);
  assert.match(NG, /\(opts\.noPaperPencil && !opts\.pill\) \? '' : rlClauseEditPillHtml\(/,
    'the editor\'s own paper (which names its pill) still draws the save symbol');
});

test('f426 (2) Edit opens the editor through the column\'s own door, not typing', () => {
  const o = code(region(PT, 'portalOpenEditor'));
  assert.match(o, /host\._rlOpenEditor\(id, \{ typing:false \}\)/);
  assert.match(o, /:not\(\[data-clause="front"\]\)/);
  assert.match(NG, /host\._rlOpenEditor = openEditor;/);
});

test('f426 (3) on their page the editor sits beside the live column, the foot under it', () => {
  const open = code(region(CE, 'rlOpenClauseEditor'));
  assert.match(open, /page\.classList\.toggle\('is-theirs', theirs\);/);
  assert.match(open, /document\.body\.classList\.toggle\('pw-editing', theirs\);/);
  const fit = code(region(CE, 'ceFitToTheirs'));
  assert.match(fit, /sr\.left - CE_THEIRS_GAP - hr\.left/, 'the page stops short of their column');
  assert.match(fit, /wr\.bottom \+ CE_THEIRS_GAP/, 'and starts under the wall line');
  assert.match(fit, /rail\.style\.left = Math\.round\(sr\.left\)/, 'the foot is pinned under the column');
  assert.match(fit, /setProperty\('--pw-edit-foot'/);
  assert.match(code(region(CE, 'ceFitToShell')), /is-theirs'\)\)\{ ceFitToTheirs\(page\); return; \}/);
  const close = code(region(CE, 'rlCloseClauseEditor'));
  assert.match(close, /classList\.remove\('pw-editing'\)/);
  assert.match(close, /page\._ceRo\) page\._ceRo\.disconnect\(\)/, 'the observer goes with the page');
  assert.match(PT, /body\.pw-editing \.pw-id\{display:none;\}/);
  assert.match(PT, /body\.pw-editing #pt-nego #rl-side\{padding-bottom:var\(--pw-edit-foot,0px\)/);
});

test('f426 (4) their column asks before it throws a draft away, and drops only the unfiled words', () => {
  const src = code(CE);
  assert.match(src, /closest\('#pt-nego #rl-side button[\s\S]{0,300}?clauseEditorDirty\(\)[\s\S]{0,200}?ceLeaveGuard\(\(\) => \{ ceForgetUnfiled\(\);/);
  assert.match(src, /document\.addEventListener\('click', ev => \{\s*if \(_ceTheirPass\) return;[\s\S]*?\}, true\);/,
    'captured, so the column\'s own handler never sees the first press');
  const f = code(region(CE, 'ceForgetUnfiled'));
  assert.match(f, /ceSeedDraft\(_ceLead && _ceLead\.id\)/, 're-seeded off the record, not stepped back to as it stands');
  assert.doesNotMatch(f, /ceDiscard\(/);
});

test('f426 (5) the save symbol: a disk with no word, hidden until typing, Ctrl/⌘+S, a tick', () => {
  const pill = code(region(NG, 'rlClauseEditPillHtml'));
  assert.match(pill, /pill\.icon === 'save'/);
  assert.match(pill, /rl-cp-pill-save/);
  assert.match(pill, /data-tip=/);
  assert.match(NCSS, /#clause-editor:not\(\.ce-typed\) \.redline-page \.rl-cp-pill\.rl-cp-pill-save\{visibility:hidden\}/);
  assert.match(CE, /page\.classList\.add\('ce-typed'\);/);
  const s = code(region(CE, 'ceSaveFromSymbol'));
  assert.match(s, /Promise\.resolve\(ceSaveChecked\(\)\)/, 'the one checked save, spelling and all');
  assert.match(s, /ce-saved-tick/);
  assert.match(s, /CE_SAVED_TICK_MS/);
  const w = code(region(CE, 'ceWirePage'));
  assert.match(w, /\(ev\.ctrlKey \|\| ev\.metaKey\)[\s\S]{0,200}?'s'\) return;\s*ev\.preventDefault\(\);/);
  assert.match(w, /ceSaveFromSymbol\(page\.querySelector\('\.rl-cp-pill-save'\)\)/);
  for (const fn of ['ceDiscard', 'ceFiled'])
    assert.match(code(region(CE, fn)), /classList\.remove\('ce-typed'\)/, fn + ' takes the mark off');
});

test('f426 (6) every new word is in both books', () => {
  for (const k of ['ce_save_symbol', 'ce_save_symbol_tip', 'ce_save_symbol_tip_mac', 'ce_saved_tick', 'po_edit', 'po_edit_title'])
    assert.equal((I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length, 2, k);
});
