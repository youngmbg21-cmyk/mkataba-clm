'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f1051 — THE NEW AGREEMENT SHEET'S ASK BOX ACTS JUST LIKE JAMBO'S (owner,
   14 Nov 2026: "remove the green outline from the entry field. It should act
   just like the jambo entry field")

   Measured in a browser: clicked, the words (#dr-say) wore the page-wide
   :focus-visible ring (box-shadow var(--focus)), a green rectangle inside the
   green pill. Jambo's box (.jb-card) takes it off its words and lays a soft
   glow on the pill instead.
   (1) the words wear no ring of their own;
   (2) the pill takes Jambo's edge and his glow while typed in.

   AT THE PARENT both claims FAIL.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ruleOf = sel => { const m = new RegExp(esc(sel) + '\\{([^}]*)\\}').exec(HTML); return m ? m[1] : null; };

test('f1051 (1) the words wear no ring of their own', () => {
  const r = ruleOf('html.lg-new #na-root.na-one .na-askbox .na-say:is(:focus, :focus-visible)');
  assert.ok(r, 'no rule takes the ring off the box\'s words');
  assert.match(r, /box-shadow:none/);
  assert.match(r, /outline:none/);
});
test('f1051 (2) the pill takes Jambo\'s edge and his glow while typed in', () => {
  const jb = ruleOf('.jb-card:focus-within{border-color:var(--accent-ink);box-shadow:0 0 0 3px rgba(10,124,107,.12)'.split('{')[0]);
  assert.ok(jb, 'Jambo\'s own glow is where it was');
  const na = ruleOf('html.lg-new #na-root.na-one .na-askbox:focus-within');
  assert.ok(na, 'the pill has no glow of its own');
  assert.match(na, /box-shadow:0 0 0 3px rgba\(10,124,107,\.12\)/);
  assert.match(ruleOf('html.lg-new #na-root.na-one .na-askbox') || '', /border-color:var\(--accent-ink\)/);
  assert.match(HTML, /html\.lg-new #na-root\.na-one \.na-askbox\{border-width:1\.5px\}/, 'Jambo\'s 1.5px edge');
});
