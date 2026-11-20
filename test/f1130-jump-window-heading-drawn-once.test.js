'use strict';
/* f1130 — THE JUMP WINDOW'S HEADING IS DRAWN ONCE (owner, 20 Nov 2026: "The header words seem to be blurry")
   The box's own hint is hidden so the two-tone line (lpWhereHtml) is the only copy; the field rule that greys every
   hint must leave .lp-in out, or the grey hint is painted under the line and the words look doubled.
   At the parent the grey rule caught .lp-in, so this fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

test('f1130 the jump window hides its own hint and no later rule paints it', () => {
  assert.match(H, /#cmd-palette \.lp-in::placeholder\{color:transparent\}/);
  const greys = H.split('\n').filter(l => /:is\(input[^,]*, textarea\)::placeholder\{color:/.test(l));
  assert.ok(greys.length > 0, 'the field rule is there');
  for (const l of greys) assert.match(l, /input:not\(\.lp-in\)/, 'a grey hint rule still reaches the jump window: ' + l.trim().slice(0, 90));
});
