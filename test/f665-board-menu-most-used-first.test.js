/* f665 — THE BOARD CARD'S ⋯ LEADS WITH WHAT IS USED MOST (owner, 12 Oct
   2026): Make bigger and Full screen first; Remove from the board last, on
   its own, where a slip cannot reach it. Both builders: a chart card's
   (hbEdgeHtml) and a ready-made panel's (hbKindToolsHtml). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/homeboard.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const body = name => { const i = SRC.indexOf('function ' + name + '('); return SRC.slice(i, SRC.indexOf('\nfunction ', i + 10)); };

test('a chart card: Make bigger, Full screen, then the rest; Remove is the × beside it', () => {
  const b = body('hbEdgeHtml');
  const at = s => b.indexOf(s);
  assert.ok(at("'hb_p_big'") > 0 && at("'hb_full_screen'") > at("'hb_p_big'"), 'bigger then full screen');
  /* RE-POINTED 23 Oct 2026: the first reading row is Dig deeper (What could explain this? folded into it) */
  assert.ok(at("'hb_full_screen'") < at("'hb_dd_btn'"), 'both above the first reading row');
  /* RE-POINTED 27 Oct 2026 (owner: "Make all charts use the exit shown in image 1"): Remove is no longer a menu row —
     it is the × beside the ⋯ (hbCardXHtml), the opened chart's own exit */
  assert.equal(at("'hb_p_x'"), -1, 'no Remove row in the menu');
  assert.ok(/\$\{board \? hbCardXHtml\(gift\) : ''\}<\/span>`;/.test(b), 'the × closes the edge, after the ⋯');
});

test('a ready-made panel: Make bigger first; Remove is the × beside it', () => {
  const b = body('hbKindToolsHtml');
  assert.ok(b.indexOf("'hb_p_big'") < b.indexOf("'hb_dd_btn'"));
  assert.equal(b.indexOf("'hb_p_x'"), -1, 'RE-POINTED 27 Oct 2026: no Remove row; the × beside the ⋯');
  assert.ok(b.includes("hbCardXHtml(gift)"));
});
