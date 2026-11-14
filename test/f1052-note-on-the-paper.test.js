/* f1052 — THE NOTE LIES ON THE PAPER HOWEVER IT GOES (owner, 14 Nov 2026: "review how the email is squeezed in").
   By email the note was bare and as tall as its words; by WhatsApp or a Word file it stayed a three-row field that
   scrolled. One flag (`onPaper` = letter, WhatsApp or file) now dresses the box, its label and its fit alike.
   Pins the painter's region and the fitter, comments stripped; the painted screen is GitHub's
   (send-note-on-the-paper-verify). Red at the parent: both keyed on `L.letter` / `is-letter` only. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const S = fs.readFileSync(path.join(__dirname, '..', 'js/core.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const fn = name => { const i = S.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' is there'); const j = S.indexOf('\nfunction ', i + 10); return S.slice(i, j < 0 ? undefined : j); };

test('f1052 (1) one flag says the note is on the paper: the letter, WhatsApp or a Word file', () => {
  const p = fn('shareLetterPaint');
  assert.match(p, /const onPaper=!!\(L\.letter \|\| L\.wa \|\| L\.file\);/);
  assert.match(p, /host\.classList\.toggle\('is-note-paper', onPaper\)/);
});
test('f1052 (2) the box, its frame and its label go bare on that flag, never on the letter alone', () => {
  const p = fn('shareLetterPaint');
  assert.match(p, /if\(onPaper && !ta\.dataset\.shLtBare\)/);
  assert.match(p, /if\(fr\) fr\.style\.display=onPaper\?/);
  assert.match(p, /if\(onPaper && !nl\.dataset\.shLtBare\)/);
  assert.match(p, /if\(nl && onPaper\)\{/);
  assert.doesNotMatch(p, /if\(L\.letter && !(ta|nl)\.dataset\.shLtBare\)/);
});
test('f1052 (3) the fitter sizes the box wherever it lies on the paper', () => {
  const f = fn('shareLetterNoteFit');
  assert.match(f, /classList\.contains\('is-note-paper'\)/);
  assert.doesNotMatch(f, /contains\('is-letter'\)/);
});
test('f1052 (4) on a Word file the note\'s label names it, so the file\'s heading does not repeat it under the note', () => {
  assert.match(fn('shareLetterPaint'), /mh\.classList\.toggle\('hidden', !!L\.none \|\| !!L\.wa \|\| !!L\.letter \|\| !!L\.file\);/);
});
