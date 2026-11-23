/* ============================================================
   f1183 — the jump window has an × in its top right corner
   ============================================================
   Owner, 23 Nov 2026 (photo of the jump window, the corner circled): "Add an
   (x) exit button on the top right corner." It closes the same way Esc and a
   press outside do (the window's own close). Red at the parent: no ×.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const APP = R('js/app.js'), HTML = R('index.html');
const fnBody = name => { const i = APP.indexOf('function ' + name + '('); return APP.slice(i, APP.indexOf('\n}', i) + 2); };

test('f1183 — an × at the top right, named in both books, closing the window', () => {
  const f = fnBody('openCommandPalette');
  assert.match(f, /<button type="button" class="lp-x" id="lp-x" aria-label="\$\{esc\(i18t\('act_close'\)\)\}"/, 'the button, named');
  assert.match(f, /querySelector\('#lp-x'\)[^\n]*addEventListener\('click',e=>\{ e\.preventDefault\(\); close\(\); \}\)/, 'it presses the window\'s own close');
  assert.ok(f.indexOf("'#lp-x'") > f.indexOf('const close=()=>'), 'wired after close is made');
  assert.match(HTML, /#cmd-palette \.lp-x\{position:absolute;top:var\(--s-3\);right:var\(--s-3\)/, 'in the top right corner');
});
