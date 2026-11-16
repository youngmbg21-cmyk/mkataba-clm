/* f1075 · A CLOSE NEVER SWITCHES THE FOLLOW OFF (owner, 16 Nov 2026: "It should always be the case that when I am
   scrolling in the paper, the clauses side panel follows and they open one by one as the paper clauses get to the
   top of the page. It works now but if you close one of the clauses in the panel, the feature switches off").
   (1) closing keeps WHICH clause was at the line; the close holds only while the line stays on it
   (2) the paper's scroll: another clause at the line lets the close go and opens that clause
   (3) a repaint does the same — holds on the closed clause, lets go once the paper has moved on
   AT THE PARENT every test here fails (the latch held until the next press, whatever the paper did). */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CODE = fs.readFileSync(path.join(__dirname, '..', 'js/views/contract.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = name => { const at = CODE.search(new RegExp('\\nfunction ' + name + '\\(')); assert.ok(at >= 0, name); const nx = CODE.slice(at + 10).search(/\nfunction /); return CODE.slice(at, nx < 0 ? undefined : at + 10 + nx); };

test('f1075 (1) the close remembers its clause, and holds only on it', () => {
  assert.match(fnBody('docThreadShut'), /_docThreadShut=String\(cur\.id\); _docThreadShutAt=docThreadLineRow\(\);/);
  assert.match(CODE, /const docThreadShutHolds = row => row===_docThreadShutAt;/);
  assert.match(CODE, /const docThreadShutClear = \(\) => \{ _docThreadShut=''; _docThreadShutAt=-1; \};/, 'letting go forgets the clause too');
});

test('f1075 (2) scrolling to another clause lets the close go and opens it', () => {
  const arm = fnBody('docThreadFollowArm');
  assert.match(arm, /const row=docThreadLineRow\(\);\s*if\(docThreadShutOn\(c\)\)\{ if\(docThreadShutHolds\(row\)\) return; docThreadShutClear\(\); \}\s*docThreadOpen\(c,row,\{follow:true\}\);/);
  assert.doesNotMatch(arm, /!docThreadShutOn\(c\)\) docThreadOpen/, 'the close no longer stops the follow outright');
});

test('f1075 (3) a repaint holds on the closed clause and lets go once the paper moved on', () => {
  const paint = fnBody('docThreadPaint');
  assert.match(paint, /else if\(docThreadShutOn\(c\)&&docThreadShutHolds\(docThreadNearest\(rows,docThreadAtLine\(\)\)\)\) _docThreadOn=-1;\s*else if\(docThreadShutOn\(c\)\)\{ docThreadShutClear\(\); _docThreadOn=docThreadNearest\(rows,docThreadAtLine\(\)\); \}/);
});
