/* f505 — ONE COPILOT EDITOR FOR BOTH DOORS (Young, 5 Oct 2026: the risk
   edit "should be exactly like the edit with copilot design", with a way to
   expand the suggested wording; picked "Fill the panel" and "yes to waiting
   for Apply")
   ============================================================================
   The browser half is one-copilot-editor-verify; this pins the source, fast.

     (A) THE WORDING WAITS FOR APPLY — riskEditorDraft never moves wording
         into the box; Copilot's answer is read by riskAnswerOf and drawn by
         the conversation's own ceTurnHtml/ceCardHtml (one card, one Apply);
     (B) ONE SET OF ROWS — the risk's quick asks are drawn in the rail's
         chips row (riskChipsHtml) and its typed ask goes through the rail's
         own box (ceAskHere); the Risks tab draws no ask box of its own;
     (C) FILL THE PANEL — every Suggested wording card carries Expand; the
         full view is one slot (#ce-full) with ONE way back, closed first by
         Escape, by Apply, by Ask for a change and by a tab change; the
         lane, chips and ask box step aside and the feet stay;
     (D) every new word is in both books.

   Run: node --test test/f505-one-copilot-editor.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = p => fs.readFileSync(path.join(__dirname, '..', p), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
const RK = strip(read('js/risks.js'));
const CE = strip(read('js/views/clauseeditor.js'));
const I18N = read('js/i18n.js');
const fn = (src, name) => {
  const m = src.match(new RegExp('(?:async )?function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}'));
  assert.ok(m, name + ' exists');
  return m[0];
};

describe('f505 (A) the wording waits for Apply', () => {
  test('riskEditorDraft keeps the words and moves nothing into the box', () => {
    const d = fn(RK, 'riskEditorDraft');
    assert.ok(!/ceApply\(/.test(d), 'no ceApply in the risk draft');
    assert.match(d, /_rk\.words\[key\] = words; _rk\.advice\[key\] =/, 'the words and Copilot\'s sentence are kept');
  });
  test('riskAnswerOf hands the editor the risk in front of the reader, not while writing', () => {
    const a = fn(RK, 'riskAnswerOf');
    assert.match(a, /_rk\.busy === w\.key\) return null/);
    assert.match(a, /\{ key: w\.key, words, advice:/);
  });
  test('the editor draws it with the conversation\'s own builder', () => {
    const h = fn(CE, 'ceRiskAnswerHtml');
    assert.match(h, /return ceTurnHtml\(\{ who: 'ai', text: a\.advice, read: ceReadList\(\), cards: \[_ceRiskCard\] \}, 'rk'\)/);
    assert.match(fn(CE, 'ceCardAt'), /parts\[0\] === 'rk'/, 'its Apply, votes and Expand resolve to that card');
    assert.match(fn(CE, 'ceRenderLane'), /riskLaneHtml\(_ceC\) : ''\) \+ ceRiskAnswerHtml\(\)/);
  });
});

describe('f505 (B) one set of rows', () => {
  test('the Risks tab draws no ask box of its own', () => {
    const l = fn(RK, 'riskLaneHtml');
    assert.ok(!/textarea|ce-rk-ask|rk-ce-ask/.test(l), 'no textarea in the lane');
    assert.ok(!/ce-rk-ask/.test(RK + CE), 'nothing reads the old box');
  });
  test('its quick asks are the chips row, its typed ask the rail\'s box', () => {
    assert.match(fn(CE, 'ceRenderChips'), /_ceTab === 'risks'\)\{ box\.innerHTML = \(window\.riskChipsHtml && _ceC\) \? riskChipsHtml\(_ceC\)/);
    assert.match(fn(RK, 'riskChipsHtml'), /data-ce-rk="ask-\$\{k\}"/);
    const here = fn(CE, 'ceAskHere');
    assert.match(here, /riskWalkPress\(_ceC, 'send', q\)/);
    assert.match(fn(RK, 'riskWalkPress'), /riskEditorDraft\(c, w\.key, said\)/);
    const tabs = fn(CE, 'ceRenderTabs');
    assert.match(tabs, /ask\.style\.display = \(_ceTab === 'chat' \|\| rk\)/);
    assert.match(tabs, /chips\.style\.display = \(_ceTab === 'chat' \|\| rk\)/);
  });
  test('both feet on every tab while a walk is on', () => {
    const tabs = fn(CE, 'ceRenderTabs');
    assert.match(tabs, /if \(rf\) rf\.hidden = false;/);
    assert.match(tabs, /if \(mf\) mf\.style\.display = '';/);
  });
});

describe('f505 (C) fill the panel', () => {
  test('every Suggested wording card carries Expand', () => {
    assert.match(fn(CE, 'ceCardHtml'), /card\.text \? `<button type="button" class="ce-x" data-ce-expand="\$\{i\}:\$\{j\}"/);
  });
  test('one slot, one way back, drawn by one function', () => {
    assert.equal(CE.split('id="ce-full"').length - 1, 1, 'one slot');
    const r = fn(CE, 'ceRenderFull');
    assert.match(r, /data-ce-act="full-close"/);
    assert.match(r, /rail\.classList\.add\('is-full'\)/);
    assert.match(r, /if \(!card \|\| !card\.text\)\{\n\s+_ceFull = '';/, 'a card that is gone closes it');
  });
  test('Escape, Apply, Ask for a change and a tab change close it', () => {
    assert.match(CE, /if \(document\.querySelector\('\[data-top-overlay\]'\)\) return;\n\s+if \(ceFullClose\(\)\) return;/, 'Escape closes the full view before the window');
    /* RE-POINTED 5 Oct 2026: a standard card's Apply takes its own line first */
    assert.match(CE, /ceFullClose\(\);\n\s+if \(card\.std\)\{ ceStdApply\(card\); return; \}\n\s+if \(card\.passage\) ceReplacePassage/, 'Apply');
    assert.match(CE, /if \(refine\)\{ ev\.preventDefault\(\);\n\s+ceFullClose\(\);/, 'Ask for a change');
    assert.match(CE, /_ceFull = '';\n\s+ceRenderTabs\(\); ceRenderLane\(\); ceRenderFull\(\); return; \}/, 'a tab change');
  });
  test('the lane, chips and ask box step aside; nothing else does', () => {
    const css = read('js/views/clauseeditor.js');
    assert.match(css, /\.ce-rail\.is-full > \.ce-lane, \.ce-rail\.is-full > #ce-scope,\n\s+\.ce-rail\.is-full > \.ce-chips, \.ce-rail\.is-full > \.ce-ask\{display:none\}/);
    assert.ok(!/is-full[^{]*ce-railfoot/.test(css), 'the feet stay');
    assert.ok(!/is-full[^{]*(ce-col|ce-left|ce-grid)/.test(css), 'the contract column is never touched');
  });
});

describe('f505 (D) both books', () => {
  test('every new word is in English and Swedish', () => {
    for (const k of ['ce_expand', 'ce_expand_title', 'ce_full_back']){
      assert.equal(I18N.split('\n    ' + k + ':').length - 1, 2, k + ' in both books');
    }
    assert.match(I18N, /rk_ce_wrote: 'Copilot suggested wording below/);
    assert.match(I18N, /rk_ce_wrote: 'Copilot föreslog en formulering nedan/);
  });
});

describe('f505 (E) the second pass', () => {
  test('a suggestion reads like the paper: the rl-us tokens, not bold, the paper\'s face', () => {
    const css = read('js/views/clauseeditor.js');
    assert.match(css, /\.ce-rail \.ce-card \.pv ins\.rl-us, \.ce-rail \.ce-full \.ce-full-body \.pv ins\.rl-us\{background:var\(--st-steel-bg\); color:var\(--accent-ink\);\n\s+font-weight:inherit; text-decoration:underline/);
    /* RE-POINTED 6 Oct 2026 (Panel Voice): the marks keep the paper's
       colours; the face is the panel's, nothing measured off the sheet. */
    assert.ok(!/function ceWordingFace\(/.test(CE), 'the sheet measurer is gone');
    assert.ok(!/ceWordingFace\(\);/.test(fn(CE, 'ceRenderFull')));
  });
  test('one row of small feet', () => {
    assert.equal(CE.split('<div class="ce-feet" id="ce-feet">').length - 1, 1);
    assert.match(read('js/views/clauseeditor.js'), /\.ce-railfoot button\{height:var\(--ctl-h-sm\)/);
    for (const [k, en] of [['ce_discard', 'Discard'], ['ce_file_as_change', 'File'], ['ce_save_to', 'Save']]){
      assert.match(I18N, new RegExp('\\n    ' + k + ": '" + en + "',"), k);
    }
    assert.equal(I18N.split('\n    ce_save_to_long:').length - 1, 2, 'the change is named on the hover, both books');
  });
  test('the ask box is one line and grows to CE_ASK_LINES', () => {
    assert.match(CE, /const CE_ASK_LINES = 5;/);
    assert.match(CE, /ask\.addEventListener\('input', \(\) => ceAskFit\(ask\)\);/);
    assert.match(read('js/views/clauseeditor.js'), /\.ce-ask textarea\{flex:1; min-width:0; height:var\(--ctl-h\)/);
  });
});

describe('f505 (F) the third pass', () => {
  /* RE-POINTED 6 Oct 2026 (Panel Voice, Young): the expanded view speaks the
     panel's type too, at the panel's body size; A-/A+ never reach it. */
  test('the small card and the expanded view both speak the panel\'s type', () => {
    const css = read('js/views/clauseeditor.js');
    assert.match(css, /\.ce-rail \.ce-card \.pv\{font-family:inherit; font-size:var\(--t-meta\); line-height:1\.6\}/);
    assert.match(css, /\.ce-rail \.ce-full \.ce-full-body \.pv\{font-family:var\(--font-body\);\n\s+font-size:var\(--t-body\); line-height:1\.6;/);
    assert.ok(!/--ce-wd-/.test(css), 'nothing measured off the sheet');
  });
  test('"Where it goes" is on the expanded view, from the Risks tab\'s own builder, and both stay in step', () => {
    assert.match(fn(CE, 'ceRenderFull'), /key\.startsWith\('rk:'\) && window\.riskWhereHtml && _ceC\) \? `<div class="ce-full-where">\$\{riskWhereHtml\(_ceC\)\}<\/div>`/);
    assert.match(fn(RK, 'riskWhereHtml'), /return _rkWhereHtml\(c\);/);
    assert.match(fn(CE, 'ceSetNewPlace'), /querySelectorAll\('#clause-editor \[data-ce-rk-where\]'\)\.forEach/);
  });
});
