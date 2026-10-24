'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f872 — A TAB IS A PILL, NOT A BALL; THE LANDING TAB IS NEVER CUT
   (owner, 24 Oct 2026, over the Board on the iPad: "the pills for the headers
   are big and almost round which is not the theme of the platform. The pills
   should be like a pill not round. Also, in the side panel, the overview pill
   is cut short.")
   MEASURED at 1366×950 before the fix (main 75b460f): the chosen tab stood
   the full height of its bar — 40px on every list head (.sap-page .sap-band
   .reg-vtab), 43 on the Board's Needs you (.nd-tab), 38 on Settings' You ·
   Company (.st-face); the side panel's first tab was capped at 96px, so
   "Overview 99+" (about 112) was cut. After: every chosen tab 30px on twenty
   screens; Overview 99+ whole. The pixels are a browser's; this pins the
   RULES, in HaTi's own sheet, after the rules they answer.
   AT THE PARENT every test here fails: the rules are not there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const at = s => HTML.indexOf(s);

test('1 every chosen tab is one slim pill: the list heads, the Board\'s Needs you, Settings\' You · Company', () => {
  const lists = at('#app-shell .reg-vtab{height:30px}');
  const board = at('#app-shell .nd-tab{height:30px;align-self:center;display:inline-flex;align-items:center;gap:.3em;padding:0 12px}');
  const set = at('#app-shell .st-cr .st-face{height:30px;align-self:center;display:inline-flex;align-items:center;justify-content:center;gap:.3em;');
  assert.ok(lists > 0 && board > 0 && set > 0, 'the three rules are in HaTi\'s sheet');
  assert.ok(lists > at('.sap-page .sap-band .reg-vtab'), 'the list head\'s rule comes after the band\'s 40px');
  assert.ok(at('#app-shell .nd-tabs{align-self:center}') > 0, 'the Board\'s tab row no longer stretches its pills');
});
test('2 a tab\'s word and its count keep their space (a flex pill drops the space between them)', () => {
  assert.match(HTML, /#app-shell \.nd-tab\{[^}]*gap:\.3em/);
  assert.match(HTML, /#app-shell \.st-cr \.st-face\{[^}]*gap:\.3em/);
});
test('3 the side panel\'s first tab (Overview, or Dossier beside a paper) is never capped nor shrunk', () => {
  /* RE-POINTED 24 Oct 2026 (main's glitch audit, "A PANEL TAB IS AS WIDE AS ITS WORDS"): the cap is gone for every
     tab; the first one still never shrinks */
  const cap = at('#app-shell .pd-tab{border-radius:999px;height:30px;align-self:center;padding:0 8px;max-width:none;');
  const free = at('#app-shell :is(.igd-head, .jl-head) > .pd-tab:first-child{max-width:none;flex-shrink:0}');
  assert.ok(cap > 0, 'no tab is capped');
  assert.ok(free > cap, 'the first tab never shrinks, later in the sheet');
});
