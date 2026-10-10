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
    /* RE-POINTED 6 Oct 2026: the turn also carries Copilot's two plain parts
       (explain) and is marked as Copilot's (ai: the check line under it) */
    assert.match(h, /return ceTurnHtml\(\{ who: 'ai', ai: true, text: a\.advice, explain: a\.explain \|\| null, read: ceReadList\(\), cards: \[_ceRiskCard\] \}, 'rk'\)/);
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
  /* RE-POINTED 10 Oct 2026 (Young, "one Copilot panel"): ONE foot on every
     tab — ‹ k of n › and Save; the walk's own row is retired and hidden. */
  test('one foot on every tab', () => {
    const tabs = fn(CE, 'ceRenderTabs');
    assert.match(tabs, /if \(rf\) rf\.hidden = true;/);
    assert.match(tabs, /if \(mf\) mf\.style\.display = '';/);
  });
});

/* RE-POINTED 7 Oct 2026 (Young, "Copilot Panel Tidy-up" — Sticky bar,
   reversing 5 Oct "Fill the panel"): the suggestion is printed whole in the
   panel's one scroll, so Expand, #ce-full and its machinery are retired.
   test/chromium/panel-tidy-and-risk-footer-verify.js measures it in a browser. */
describe('f505 (C) fill the panel is retired', () => {
  test('no Suggested wording card carries Expand', () => {
    assert.ok(!/data-ce-expand/.test(CE), 'no Expand press');
    assert.ok(!/function ceFullOpen\(/.test(CE), 'no way into a full view');
    assert.match(fn(CE, 'ceCardHtml'), /<div class="ce-card ce-sug">/);
  });
  test('no slot and nothing drawn in its place', () => {
    assert.equal(CE.split('id="ce-full"').length - 1, 0, 'no slot');
    assert.match(CE, /function ceRenderFull\(\)\{\}/);
    assert.match(CE, /function ceFullClose\(\)\{ return false; \}/);
  });
  test('the wording is not a window: no max-height, no scroll of its own; its buttons stick', () => {
    const css = read('js/views/clauseeditor.js');
    assert.match(css, /\.ce-rail \.ce-card\.ce-sug \.pv\{max-height:none; overflow:visible;/);
    assert.match(css, /\.ce-card\.ce-sug > \.av\{position:sticky;/);
    assert.ok(!/is-full[^{]*\{display:none\}/.test(css), 'nothing steps aside any more');
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
    /* RE-POINTED 7 Oct 2026: the expanded view is retired; the card keeps the rule */
    assert.match(css, /\.ce-rail \.ce-card \.pv ins\.rl-us\{background:var\(--st-steel-bg\); color:var\(--accent-ink\);\n\s+font-weight:inherit; text-decoration:underline/);
    /* RE-POINTED 6 Oct 2026 (Panel Voice): the marks keep the paper's
       colours; the face is the panel's, nothing measured off the sheet. */
    assert.ok(!/function ceWordingFace\(/.test(CE), 'the sheet measurer is gone');
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
    /* RE-POINTED 6 Oct 2026: the box is .ce-askbox (it holds the tag that
       replaced the Selected card); the textarea inside it is one line high */
    /* RE-POINTED 7 Oct 2026 (Header line): the tag has its own line, so the
       textarea takes the box's whole width */
    assert.match(read('js/views/clauseeditor.js'), /\.ce-ask textarea\{flex:none; width:100%; min-width:0; height:calc\(var\(--ctl-h\) - 2px\)/);
  });
});

describe('f505 (F) the third pass', () => {
  /* RE-POINTED 6 Oct 2026 (Panel Voice, Young): the expanded view speaks the
     panel's type too, at the panel's body size; A-/A+ never reach it. */
  /* RE-POINTED 7 Oct 2026: the expanded view is retired (Sticky bar) */
  test('the suggestion speaks the panel\'s type', () => {
    const css = read('js/views/clauseeditor.js');
    assert.match(css, /\.ce-rail \.ce-card \.pv\{font-family:inherit; font-size:var\(--t-meta\); line-height:1\.6\}/);
    assert.ok(!/--ce-wd-/.test(css), 'nothing measured off the sheet');
  });
  /* RE-POINTED 7 Oct 2026: "Where it goes" lives in the Risks tab's lane
     alone now that the expanded view is retired */
  test('"Where it goes" is drawn by the Risks tab\'s own builder, and stays in step', () => {
    assert.match(fn(RK, 'riskLaneHtml'), /\$\{_rkWhereHtml\(c\)\}/);
    assert.match(fn(RK, 'riskWhereHtml'), /return _rkWhereHtml\(c\);/);
    assert.match(fn(CE, 'ceSetNewPlace'), /querySelectorAll\('#clause-editor \[data-ce-rk-where\]'\)\.forEach/);
  });
});
