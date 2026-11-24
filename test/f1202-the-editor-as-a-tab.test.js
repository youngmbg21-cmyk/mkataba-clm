'use strict';
/* f1202 — THE EDITOR AS A TAB (owner, 24 Nov 2026: "build it", the drawing "Editor as a Tab").

   (1) The Dossier carries a fifth tab, Editor, beside Redlines, only where the reader may still redline the paper (our
       seat, the new look, a wide window, not sealed); its press opens the ONE editor through openRedlineWorkbench.
   (2) The editor, on our seat in the new look, wears the Dossier's tabs with Editor lit; another tab leaves through the
       ONE guard (ceLeaveGuard) and then presses that tab.
   (3) The panel says the clause: ‹ name ▾ k of n ›, "Redlining <clause>", the sentence for the other side; the foot
       "Keep scrolling to edit <next>" · Next ›; File · next › files then opens the paper's next clause, its points with it.
   (4) The writing bar rides above the clause by transform only and never under the side panel; no note is asked. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CE = strip(R('js/views/clauseeditor.js')), PD = strip(R('js/paperdesk.js')), H = R('index.html'), I = R('js/i18n.js');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

describe('f1202 (1) the Dossier\'s Editor tab', () => {
  test('only where the reader may still redline the paper', () => {
    const on = fnSrc(PD, 'pdEdTabOn');
    assert.match(on, /newLookOn\(\)/); assert.match(on, /innerWidth < 1024/); assert.match(on, /pd2Sealed\(c\)/);
    assert.match(on, /mayActOn\(c\)/); assert.match(on, /negoMayStart\(c\)\.ok/);
    assert.match(PD, /\(c && tabs\.includes\('red'\) && pdEdTabOn\(c\) \? pdEdTabBtnHtml\(false\) : ''\)/, 'beside Redlines in the Dossier\'s row');
  });
  test('its press opens the one editor through the workbench\'s landing', () => {
    assert.match(fnSrc(PD, 'pdEdOpen'), /window\.ceTabOpenFor\(c, pdEdPointOf\(c\)\)/);
    assert.match(fnSrc(CE, 'ceTabOpenFor'), /window\.openRedlineWorkbench\(c\.id, \{ from: 'editor', land \}\)/);
    assert.doesNotMatch(fnSrc(PD, 'pdEdOpen') + fnSrc(PD, 'pdEdPointOf'), /negoClauseList|persist\(|api\(/, 'the desk still only reads');
  });
});

describe('f1202 (2) the editor wears the tabs', () => {
  test('our seat, the new look, a wide window', () => {
    const on = fnSrc(CE, 'ceTabOn');
    assert.match(on, /newLookOn\(\)/); assert.match(on, /ceSide\(\) === 'counterparty' \|\| window\.PORTAL_MODE === true/); assert.match(on, /innerWidth < 1024/);
    assert.match(CE, /if \(ceTabOn\(\)\) page\.classList\.add\('is-tabbed'\)/);
    assert.match(fnSrc(PD, 'pdEdTabsHtml'), /pd2TabsShownFor\(c\)[\s\S]*pdEdTabBtnHtml\(true\)/, 'the Dossier\'s own tabs, Editor last and lit');
  });
  test('another tab leaves through the one guard, then presses that tab', () => {
    assert.match(CE, /if \(k === 'ed'\) return;[\s\S]{0,300}?ceLeaveGuard\(\(\) => \{ rlCloseClauseEditor\(\); try \{ if \(typeof window\.pdEdTabLeave === 'function'\) window\.pdEdTabLeave\(k\);/);
    assert.match(fnSrc(PD, 'pdEdTabLeave'), /#ig-dock \[data-pd-tab="\$\{k\}"\][\s\S]*b\.click\(\)/);
  });
});

describe('f1202 (3) the panel says the clause; File · next › moves on', () => {
  test('the picker, the heading, the sentence and the foot', () => {
    const p = fnSrc(CE, 'ceTabPaint');
    for (const k of ['ce_tab_k_of_n', 'ce_tab_sub2', 'ce_tab_next_to', 'ce_tab_next', 'ce_tab_undo'] /* RE-POINTED 24 Nov 2026 (f1219, the panel as drawn): the serif "Redlining …" heading and "Keep scrolling …" are gone (ce_tab_redlining, ce_tab_sub, ce_tab_keep kept, unused) */){ /* RE-POINTED 24 Nov 2026 (f1215): the bar's "Editing …" tag is gone (ce_tab_editing kept, unused); (f1217) "Nothing changed yet" is gone (ce_tab_nothing kept, unused) */
      assert.match(p, new RegExp(`_cet\\('${k}'`), k + ' drawn');
      assert.equal((I.match(new RegExp(`^    ${k}: `, 'gm')) || []).length, 2, k + ' in both books');
    }
    assert.equal((I.match(/^    pd_tab_editor: /gm) || []).length, 2);
  });
  test('filing opens the paper\'s next clause, with its points; the button says so', () => {
    assert.match(CE, /const nextTab = \(!w \|\| !\(w\.ids \|\| w\.asks\)\) && ceTabbed\(\) \? ceTabNextId\(\) : '';/);
    assert.match(CE, /if \(ch && nextTab && clauseEditorOpen\(\)\)\{ ceTabGo\(nextTab\); return ch; \}/);
    assert.match(CE, /\(wNext \|\| \(ceTabbed\(\) && ceTabNextId\(\)\)\)/);
    assert.match(fnSrc(CE, 'ceTabGo'), /ceGoClause\(clauseId,[\s\S]*ceOfferPoints\(pts\)/);
  });
});

describe('f1202 (4) the writing bar above the clause', () => {
  test('moved by transform only, kept inside the paper\'s width', () => {
    const b = fnSrc(CE, 'ceTabBarPlace');
    assert.match(b, /head\.style\.transform = `translate\(/);
    assert.doesNotMatch(b, /style\.(left|top|height) =/); /* RE-POINTED 24 Nov 2026 (f1218): the bar is set to the sheet's width once (never animated); it still MOVES by transform only */
    assert.match(b, /if \(hw && x \+ hw > lr\.width - 16\) x = Math\.max\(8, lr\.width - hw - 16\);/);
    assert.match(H, /#clause-editor\.is-tabbed \.ce-head\{position:absolute;/);
    assert.match(H, /#clause-editor\.is-tabbed #ce-doc \.rl-clause-live::before\{/);
  });
});
