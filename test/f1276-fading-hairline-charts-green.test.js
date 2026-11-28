/* f1276 — ONE FADING HAIRLINE ABOVE JAMBO'S BOX, AND A LIGHTER GREEN CHARTS (owner, 28 Nov 2026: "Build the fading
   hairline. Then the charts button should be a lighter green shade. Also, make sure it never appears on the panel if
   you are not in the board page"): every foot row of every Jambo panel draws its top line as a hairline 16px in from
   each side that fades at both ends; a row that gives way has border-top-width 0 (a clear colour would still draw the
   image); the Charts pill is pale green with green words; the remote stays the Board's alone. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const H = read('index.html'), C = read('js/components.js');

test('f1276 (1) every foot row draws the fading hairline', () => {
  assert.match(H, /html\.lg-new :is\(#ig-dock \.igd-foot, #app-shell \.jl-foot, \.st-cr \.st-jb-ask, \.jb-ways\.is-above-foot, #ig-dock \[data-ig-chips\]:not\(:empty\), #ai-panel\.is-popped > footer\)\{border-image:linear-gradient\(90deg, transparent 16px, var\(--color-divider\) calc\(16px \+ 18%\), var\(--color-divider\) calc\(100% - 16px - 18%\), transparent calc\(100% - 16px\)\) 1\}/);
});
test('f1276 (2) a row that gives way has no top border at all', () => {
  assert.match(H, /\.jb-ways\.is-above-foot \+ :is\(\.igd-foot, \.jl-foot, \.st-jb-ask\)\{border-top-color:transparent;border-top-width:0\}/);
  assert.match(H, /\[data-ig-chips\]:has\(\[data-ca-chip\]\) \+ \.igd-foot\{border-top-color:transparent;border-top-width:0\}/);
  assert.match(H, /:has\(\+ \* \.jb-door:not\(\[hidden\]\)\) \+ :is\(\.igd-foot, \.jl-foot, \.st-jb-ask\)\{border-top-color:var\(--color-divider\);border-top-width:1px\}/);
});
test('f1276 (3) Charts is a pale green pill with green words', () => {
  assert.match(H, /\.jb-way\.jb-rm\{[^}]*background:color-mix\(in srgb, var\(--accent-ink\) 9%, var\(--color-surface\)\);color:var\(--accent-ink\)/);
  assert.doesNotMatch(H, /\.jb-way\.jb-rm\{[^}]*background:var\(--surface-2\)/);
});
test('f1276 (4) the remote is the Board overview\'s alone', () => {
  assert.match(C, /const remote = k === 'board' && typeof window\.hbBoardHelloOn === 'function' && window\.hbBoardHelloOn\(\)\s*&& !\(typeof window\.jamboTalkUp === 'function' && window\.jamboTalkUp\(\)\);/);
});
