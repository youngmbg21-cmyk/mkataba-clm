'use strict';
/* f1219 — THE EDITOR PANEL AS DRAWN, THE TAB STRIP IN THE MIDDLE, NO SKID MARKS (owner, 24 Nov 2026: "When I press on
   editor the panel is not consistent … the content of the tab as well is very very poor"; "put the whole strip of the
   buttons at the center of the panel"; "Build it as drawn"; "the all notes button is leaving skid marks"):
   (1) the tab strip in the middle on the Dossier's row and the editor's, the fold arrow at the end of both;
   (2) the editor's row: ‹ Clauses · ‹ k of n › · All n clauses ▾; the clause as one line with the list's badge;
   (3) sections: To fix (rows, one black button, no "You came from", no Not now), Your ladder (Open › to the Ladder), Your
       change (Undo there); the foot: Next: <clause> and its one button, then notes · their view · history; no chips;
   (4) the paper's pinned controls are HELD by the window (fixed), never carried by a transform a frame late;
   (5) the words, both books. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CE = strip(R('js/views/clauseeditor.js')), PD = strip(R('js/paperdesk.js')), H = R('index.html'), I = R('js/i18n.js');
const fn = (S, name) => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name); return S.slice(i, S.indexOf('\n}', i) + 2); };
const E = 'html.lg-new #clause-editor.is-tabbed';

test('f1219 (1) the strip in the middle, the fold arrow at the end', () => {
  assert.ok(H.includes('html.lg-new #app-shell #ig-dock > .igd-head.igd-head[data-pd-head="paper"]:has(> .pd-tab + .pd-tab){justify-content:center;position:relative}'));
  assert.ok(H.includes('#igd-collapse#igd-collapse{position:absolute;right:16px;'));
  const p = fn(CE, 'ceTabPaint');
  assert.match(p, /<div class="ce-drow"><div class="ce-dtabs" role="tablist">\$\{tabs\}<\/div><button type="button" class="ce-dfold" data-ce-dfold/);
  assert.ok(H.includes(E + ' .ce-drow{position:relative;display:flex;justify-content:center;'));
  assert.match(CE, /if \(t\.closest\('\[data-ce-dfold\]'\)\)\{ e\.preventDefault\(\);\s*ceLeaveGuard\(/);
});
test('f1219 (2) the Clauses row and the clause as one line', () => {
  const p = fn(CE, 'ceTabPaint');
  assert.match(p, /<button type="button" class="ce-tback" data-ce-dtab="doc">/);
  assert.match(p, /data-ce-tstep="-1"[\s\S]*ce_tab_k_of_n[\s\S]*data-ce-tstep="1"[\s\S]*class="ce-tall" data-ce-tlist/);
  assert.match(p, /const st = pts\.some\(p => p\.s === 'need'\) \? 'need' : pts\.length \? 'look' : '';/);
  /* RE-POINTED 25 Nov 2026 (L+S as drawn): § over the name, one badge */
  assert.match(p, /<div class="ce-thd is-ls">/);
  assert.doesNotMatch(p, /ce_tab_redlining|ce_tab_keep|class="ce-tpick"/);
});
test('f1219 (3) the sections and the foot', () => {
  const pts = fn(CE, 'cePointsHtml');
  assert.match(pts, /if \(ceTabbed\(\)\)\{[\s\S]*ce_tab_fix_h[\s\S]*class="ce-tdraft" data-ce-act="pts-draft"[\s\S]*\}/);
  const tabPart = pts.slice(pts.indexOf('if (ceTabbed()){'), pts.indexOf('return `<div class="ce-ai ce-pts"'));
  assert.doesNotMatch(tabPart, /pts-off|ce_pts_say/);
  /* RE-POINTED 25 Nov 2026 (L+S as drawn): the ladder's lines become Before you answer, only those that say something */
  assert.match(fn(CE, 'ceLadderCardHtml'), /if \(ceTabbed\(\)\)\{[\s\S]*return ceTabBeforeHtml\(lines\)/);
  const p = fn(CE, 'ceTabPaint');
  assert.match(p, /ce_tab_change_h[\s\S]*data-ce-act="undo"/);
  assert.match(p, /\['notes', 'theirs', 'history'\]\.map/);
  /* RE-POINTED 25 Nov 2026 (owner: "Remove the green links and the grey wordings below save counter"): the foot is Save · Undo, or Next › */
  assert.doesNotMatch(p, /ce_tab_next_to/);
  assert.match(p, /const fh = btn \? `<div class="ce-tfrow is-ls">\$\{btn\}<\/div>` : '';/);
  assert.ok(H.includes(E + ' :is(#ce-chips, #ce-railfoot){display:none}'));
});
test('f1219 (4) held, not carried', () => {
  const A = fn(PD, 'pd2CtlApply');
  assert.match(A, /if \(pin\) pd2CtlHold\(el, sc, st\); else pd2CtlLetGo\(el\);/);
  assert.doesNotMatch(A, /translateY/);
  assert.match(fn(PD, 'pd2CtlHold'), /position: 'fixed', top: Math\.round\(r\.top \+ st\) \+ 'px'/);
});
test('f1219 (5) the words, both books', () => {
  for (const k of ['ce_tab_all_one', 'ce_tab_all_other', 'ce_tab_sub2', 'ce_tab_sub2_x', 'ce_tab_next_to', 'ce_tab_change_h', 'ce_tab_change_wait', 'ce_tab_change_none', 'ce_tab_fix_h', 'ce_tab_fix_go', 'ce_tab_lad_h', 'ce_tab_lad_open', 'ce_tab_lad_pos', 'ce_tab_lad_before'])
    assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k);
});
