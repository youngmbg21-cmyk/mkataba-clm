'use strict';
/* f1016 — TWO FIXES THE OWNER SAID YES TO (12 Nov 2026: "for 3 it's yes"):
   (1) BUGLOG 21762 — a code-named deal's real name is swapped for its code name as a WHOLE NAME only (cnMask, as the
       email's cnMailMask already did): "Ace" is no longer changed inside "Grace" or "place", while "Ace's", "(Ace)" and
       a name that ends in a full stop ("Acme Ltd.") are still hidden.
   (2) BUGLOG 20921 — the plain text Jambo reads keeps a heading apart from its first sentence (contractPlainText puts
       a break after every block); the wording hash's path ({ marks:true }) is left as it was, so no stamp on file moves.
       Jambo's kept answers keyed on the old text are read again once, on their next press (the owner's yes). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('f1016 (1) the mask swaps whole names only, and still hides a name that ends in punctuation', () => {
  const S = stripCom(read('server/server.js'));
  const m = S.match(/function cnMask\(body, out\) \{[\s\S]*?\n\}/);
  assert.ok(m, 'cnMask is found');
  assert.doesNotMatch(m[0], /\.split\(n\)\.join\(c\)/, 'no plain substring swap');
  assert.match(m[0], /new RegExp\('\(\?<!\[\\\\p\{L\}\\\\p\{N\}\]\)' \+ esc\(n\) \+ '\(\?!\[\\\\p\{L\}\\\\p\{N\}\]\)', 'gu'\)/, 'the whole-name pattern, as the email mask');
  /* the same pattern, run */
  const esc = x => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const swap = (n, c, t) => t.replace(new RegExp('(?<![\\p{L}\\p{N}])' + esc(n) + '(?![\\p{L}\\p{N}])', 'gu'), () => c);
  assert.equal(swap('Ace', 'ORCA', 'Grace and Ace place. Ace\'s, (Ace)'), 'Grace and ORCA place. ORCA\'s, (ORCA)');
  assert.equal(swap('Acme Ltd.', 'ORCA', 'Acme Ltd. signs.'), 'ORCA signs.');
  assert.equal(swap('Nordfrakt', 'ORCA', 'Nordfrakt, and Nordfrakt.'), 'ORCA, and ORCA.');
});

test('f1016 (2) a heading is not glued to its first sentence; the wording hash path is untouched', () => {
  const I = stripCom(read('js/views/intelligence.js'));
  const m = I.match(/function contractPlainText\(c, opts\)\{[\s\S]*?\n\}/);
  assert.ok(m, 'contractPlainText is found');
  assert.match(m[0], /if\(!\(opts&&opts\.marks\)\) host\.querySelectorAll\('p,h1,h2,h3,h4,h5,h6,li,div,br,[^']*'\)\.forEach\(b=>b\.after\(document\.createTextNode\(' '\)\)\);/);
  /* what it does, in a document the test builds */
  const { JSDOM } = require('jsdom');
  const doc = new JSDOM('<div id="h"><h2>Duration of confidentiality</h2><p>The obligations survive.</p></div>').window.document;
  const host = doc.getElementById('h');
  const before = host.textContent.replace(/\s+/g, ' ').trim();
  host.querySelectorAll('p,h1,h2,h3,h4,h5,h6,li,div,br').forEach(b => b.after(doc.createTextNode(' ')));
  const after = host.textContent.replace(/\s+/g, ' ').trim();
  assert.equal(before, 'Duration of confidentialityThe obligations survive.', 'the fault, as it was');
  assert.equal(after, 'Duration of confidentiality The obligations survive.', 'fixed');
});
