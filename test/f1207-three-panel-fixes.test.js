/* f1207 — THREE PANEL FIXES (owner, 24 Nov 2026, drawn first, artifact 2sQDGQ6BnRfKoTAFo7AC7U; "build the three panel fixes"):
   1. the Editor tab: "the editing bar should always be at the top of the page and the back drop color needs to be like
      the other pages with paper" — ceTabBarPlace no longer reads the live clause; the ground is --desk-ground.
   2. the Clauses tab: "delete the highlighted area including the links but only for this tab … when you scroll on this tab,
      the scroll should not move you to the next clause … leave the ability to scroll on paper" — no foot line, no links
      line (both rows), the panel's wheel steps nothing; the hint says "Press › for the next".
   3. the Redlines tab: "delete the notes page from the tab" — the switch is Changes · Ladder; the "notes" link opens the
      bar's Notes panel (Redlines' notes are the bar's, f1087). Red at the parent. */
'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs'), path = require('path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\nfunction ', i + 9); return src.slice(i, j < 0 ? undefined : j); };
const CE = strip(R('js/views/clauseeditor.js')), CT = strip(R('js/views/contract.js')), H = R('index.html');

test('f1207 (1) the editing bar stands at the top; the paper pages\' ground', () => {
  const b = fnOf(CE, 'ceTabBarPlace');
  assert.doesNotMatch(b, /rl-clause-live/, 'the bar no longer rides the clause being edited');
  /* RE-POINTED 25 Nov 2026 (f1229): the bar stands at the top of the page, full width, in the band .ce-left keeps */
  assert.match(b, /if \(head\.style\.transform\) head\.style\.transform = '';/);
  /* RE-POINTED 24 Nov 2026 (scoped under html.lg-new) */
  assert.match(H, /html\.lg-new #clause-editor\.is-tabbed,html\.lg-new #clause-editor\.is-tabbed \.ce-left,html\.lg-new #clause-editor\.is-tabbed #ce-doc\{background:var\(--desk-ground\)\}/);
});
test('f1207 (2) the Clauses tab keeps its room, and its panel scrolls without stepping', () => {
  const N = fnOf(CT, 'docThreadNavSync');
  assert.doesNotMatch(N, /th_page_next/); assert.match(N, /if \(foot\) foot\.remove\(\);/);
  assert.doesNotMatch(CT, /addEventListener\('wheel'[\s\S]{0,200}#pd-thread/, 'no wheel stepping over the clause page');
  assert.doesNotMatch(CT, /TH_STEP_DELTA|_thStepAcc/);
  assert.match(R('js/components.js'), /window\.pdTab\(\) === 'doc'\) return \{ k: 'doc', doors: \[\] \};/);
  assert.match(R('js/views/intelligence.js'), /!igOnClausesTab\(\)&&!igFindingsShows\(\)/);
  const I = R('js/i18n.js');
  assert.match(I, /th_page_hint: "Press › for the next"/); assert.match(I, /th_page_hint: "Tryck › för nästa"/);
});
test('f1207 (3) Redlines: Changes · Ladder; the notes link opens the bar\'s Notes', () => {
  const N = R('js/views/negotiation.js');
  assert.match(N, /<span class="rl-seg" role="group">\$\{five\.seg\}\$\{''\/\* NO NOTES IN THE SWITCH[^`]*?\*\/\}\$\{rlHeadLadderHtml\(c, opts\)\}<\/span>/);
  const A = R('js/copilotacts.js');
  assert.match(fnOf(A, 'caNextRun'), /if \(k === 'rl_notes' && typeof openPanel === 'function'\)\{\s*openPanel\('notes'\); return true; \}/);
  assert.doesNotMatch(A, /rl_notes: \(\) => '#ig-dock \[data-rl-notes-all\]'/);
});
