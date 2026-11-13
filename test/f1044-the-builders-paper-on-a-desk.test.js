/* f1044 — THE BUILDER'S PAPER LIES ON A DESK, AS THE CLAUSE EDITOR'S DOES (owner, 13 Nov 2026: "there should be a paper
   and the backdrop should resemble the back drop of the clause editor"). And FROM SCRATCH STANDS 16PX IN (same day:
   "too close to the edge of the screen"). Pins the rule's region in index.html, comments stripped; the painted page is
   GitHub's (white-sheet-verify, round6-new-look-verify 13). */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const css = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const rule = sel => { const i = css.indexOf(sel + '{'); return i < 0 ? '' : css.slice(i + sel.length + 1, css.indexOf('}', i)); };

test('f1044 (1) the builder\'s scroller is the grey ground, edge to edge, and the clause editor wears the same ground', () => {
  const r = rule('html.lg-new #tb-page #tb-scroll');
  assert.match(r, /background:var\(--color-bg\)/, 'the desk is the ground token the clause editor stands on');
  assert.match(r, /margin:0 calc\(-1 \* var\(--page-pad-x\)\) calc\(-1 \* var\(--page-pad-b\)\)/, 'it reaches the window\'s side, the panel and the foot');
  assert.doesNotMatch(r, /!important/);
});
test('f1044 (2) the paper stays white with no lift, and Branding is a card on the desk', () => {
  assert.match(rule('html.lg-new #tb-page #tb-paper'), /box-shadow:none/);
  const b = rule('html.lg-new #tb-page #tb-branding.tb-brand');
  assert.doesNotMatch(b, /transparent|border-radius:0/, 'Branding keeps its own edges on grey');
});
test('f1044 (3) the white-sheet check knows the builder\'s desk as a paper\'s canvas', () => {
  const src = fs.readFileSync(path.join(__dirname, 'chromium', 'white-sheet-verify.js'), 'utf8');
  assert.match(src, /const PAPER = '[^']*#tb-scroll/);
});
test('f1044 (4) From scratch: the list stands 16px in on every side', () => {
  assert.match(rule('html.lg-new .nsc-left'), /padding:var\(--s-4\)[;}]|padding:var\(--s-4\);/);
});
