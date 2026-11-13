/* f1029 — A COMPANY STANDARD'S OWN FIELDS ARE FILLED ON THE PAPER (owner, 12 Nov 2026: "Fix all company-standard
   contracts so fields can be filled on the paper"). At the parent a contract made from a standard with its own field
   list had no lines on the paper (contractBlanks answers none for a templateForm), the panel said its fields "have no
   place on the paper", and a press on one opened the form. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const pd = strip(fs.readFileSync(path.join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8'));
const ct = strip(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8'));
const bd = strip(fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'breakdown.js'), 'utf8'));
const slice = (src, a, b) => src.slice(src.indexOf(a), src.indexOf(b, src.indexOf(a) + a.length));

test('the walk reads a standard\'s own fields first; signatures, files and stamps stay off it', () => {
  const fb = slice(pd, 'function pd2FillBlanks(c){', '\n}');
  assert.match(fb, /pd2FillTplBlanks\(c\)/);
  const tb = slice(pd, 'function pd2FillTplBlanks(c){', '\nfunction ');
  assert.match(tb, /kind: 'tplform'/);
  assert.match(pd, /PD2_TPL_SKIP = new Set\(\['signature_name_title', 'stamp_image', 'file_attachment'\]\)/);
  assert.match(tb, /c\.status === 'Signed'/, 'a signed record has nothing to fill');
});

test('saved through the form\'s one answer writer, then the wording filled once', () => {
  const sv = slice(pd, 'function pd2FillSave(){', '\nfunction ');
  assert.match(sv, /tplFormCommit\(c, i, x\.v\)/);
  assert.match(sv, /if \(n\) tplFormApply\(c\)/);
});

test('a choice is a list of the standard\'s options, and a pick from HaTi\'s list lands', () => {
  const pt = slice(pd, 'function pd2FillPaint(c){', '\nfunction ');
  assert.match(pt, /typ\[k\] === 'select'/);
  assert.match(pd, /matches\('#ig-canvas select\[data-pd2-bl\]'\)/);
});

test('a press inside a line on the paper types, never opens the form', () => {
  const h = slice(ct, "document._homeAnswerWired = true;", '\n}');
  assert.match(h, /closest\('\[data-pd2-bl\], \[data-pd2-ps-name\], \[data-pd2-ps-mail\]'\)\) return/);
});

test('the Clauses tab\'s preamble card keeps to the paper\'s own blanks', () => {
  assert.match(bd, /x\.kind !== 'tplform'/);
});
