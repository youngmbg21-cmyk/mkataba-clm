'use strict';
/* f1107 — SAP PAGE, LEGORA PANEL (owner's pick by name, 19 Nov 2026: "build SAP page, Legora panel").
   The line under a side panel's head ran from the divider to the window's edge, at another height from the page's
   own line. Now: the page's lines stay as they are (they already stop where the page's words stop, the SAP way);
   every panel head's line is pulled 16 in from both sides and fades at both ends (the Legora way).

   (1) ONE RULE, LAST in HaTi's sheet, covers every panel head: Jambo's dock, the list panel, Settings' side
       panel and the side drawer; its border goes clear (nothing moves) and the line is painted in that pixel row.
   (2) the line is the divider token, faded at both ends, 16 in from each side.
   (3) the side drawer's header no longer writes its own line on the element (an inline line beats any rule).
   (4) the page's lines are not touched: the list head still draws its solid divider. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CSS = stripCom(HTML);
const RULE = /html:not\(#_\):not\(#_\) :is\(([^)]*)\)\{([^}]*background-image:linear-gradient\(90deg, transparent, var\(--color-divider\)[^}]*)\}/;

test('f1107 (1) one rule, last in the sheet, covers every panel head', () => {
  const m = CSS.match(RULE);
  assert.ok(m, 'the panel-head line rule exists');
  for (const head of ['.jl-head', '#ig-dock > .igd-head', '#ai-panel > header', '.st-side-head'])
    assert.ok(m[1].split(',').map(s => s.trim()).includes(head), head + ' is covered');
  const sheetEnd = CSS.indexOf('</style>', CSS.indexOf(m[0]));
  const after = CSS.slice(CSS.indexOf(m[0]) + m[0].length, sheetEnd);
  assert.equal(after.trim(), '', 'the rule is the last in its sheet, so no head\'s own border rule wins');
  assert.match(m[2], /border-bottom-color:transparent/, 'the border goes clear, keeping its pixel');
  assert.match(m[2], /background-origin:border-box/, 'the line is painted in the border\'s own pixel row');
});

test('f1107 (2) the line is the divider, faded at both ends, 16 in from each side', () => {
  const m = CSS.match(RULE); assert.ok(m);
  assert.match(m[2], /linear-gradient\(90deg, transparent, var\(--color-divider\) \d+%, var\(--color-divider\) \d+%, transparent\)/);
  assert.match(m[2], /background-size:calc\(100% - 32px\) 1px/);
  assert.match(m[2], /background-position:16px 100%/);
  assert.match(m[2], /background-repeat:no-repeat/);
});

test('f1107 (3) the side drawer header writes no line of its own', () => {
  const head = HTML.match(/<section id="ai-panel"[^>]*>\s*<header([^>]*)>/);
  assert.ok(head, 'the side drawer header is found');
  assert.ok(!/border-bottom:1px solid var\(--color-divider\)/.test(head[1]), 'no inline divider line');
  assert.ok(!/style="background:/.test(head[1]), 'no background shorthand inline (it would wipe the painted line)');
});

test('f1107 (4) the page\'s own lines are untouched: the list head keeps its solid divider', () => {
  assert.match(CSS, /html\.lg-new \.apn-bar\{[^}]*border-bottom:1px solid var\(--color-divider\)/);
  const m = CSS.match(RULE); assert.ok(m);
  assert.ok(!/apn-bar|tpln5-box|sdd-find/.test(m[1]), 'no page line is in the panel rule');
});
