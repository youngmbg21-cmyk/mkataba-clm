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

test('a chart card: Make bigger, Full screen, then the rest; Remove last', () => {
  const b = body('hbEdgeHtml');
  const at = s => b.indexOf(s);
  assert.ok(at("'hb_p_big'") > 0 && at("'hb_full_screen'") > at("'hb_p_big'"), 'bigger then full screen');
  assert.ok(at("'hb_full_screen'") < at("'hb_cx_btn'"), 'both above the first reading row');
  assert.ok(at("'hb_p_x'") > at("'hb_wi_btn'") && at("'hb_p_x'") > at("'hb_ver_menu'"), 'Remove after every other row');
});

test('a ready-made panel: Make bigger first, Remove last', () => {
  const b = body('hbKindToolsHtml');
  assert.ok(b.indexOf("'hb_p_big'") < b.indexOf("'hb_cx_btn'"));
  assert.ok(b.indexOf("'hb_p_x'") > b.indexOf("'hb_p_give'"));
});
