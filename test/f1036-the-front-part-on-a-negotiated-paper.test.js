/* f1036 — THE FRONT PART IS FILLED ON A NEGOTIATED PAPER TOO (owner, 13 Nov 2026, of MK-469: "the top part brings me
   to the other middle page to fill in while the below part allows me to fill on paper"; picked option 1). The parties'
   names and addresses above the first heading are the reserved front section ('front'); the negotiated fill walks it
   like a clause (its head and the words under it, one count), unless a change is open on it, and Save files the
   answers as our tracked change on 'front' through the same funnel. Red at the parent: only section.rl-clause walked. */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const P = fs.readFileSync(path.join(__dirname, '..', 'js', 'paperdesk.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const slice = (a, b) => P.slice(P.indexOf(a), P.indexOf(b, P.indexOf(a) + a.length));

test('the marks walk the front part: its head and the words under it, unless a change is open there', () => {
  const m = slice('function pd2NegoMark(c){', '\nfunction ');
  assert.match(m, /cv\.querySelector\('header\.rl-paper-head\[data-clause\]'\)/);
  assert.match(m, /classList\.contains\('rl-recital'\)/);
  assert.match(m, /argued\.has\(String\(id\)\) \|\| changed/);
  assert.match(m, /pd2NegoSeq\(roots\)/);
});

test('one walk over several pieces, one count', () => {
  const s = slice('function pd2NegoSeq(root){', '\nfunction ');
  assert.match(s, /const roots = Array\.isArray\(root\) \? root\.filter\(Boolean\) : \[root\];/);
  assert.match(s, /for \(const r of roots\)\{/);
});

test('Save files the front part through the same door as a clause', () => {
  const f = slice('async function pd2NegoFile(c, items){', '\nfunction ');
  assert.match(f, /negoClauseNowById\(c, clauseId\)/);
  assert.match(f, /negoFileFilledClause\(c, clauseId,/);
});
