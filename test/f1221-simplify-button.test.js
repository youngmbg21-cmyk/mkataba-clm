'use strict';
/* f1221 — THE PLAIN ENGLISH PRESS SAYS "SIMPLIFY" (owner, 24 Nov 2026: one short word for the press; picked Simplify,
   the clause editor's chip too). The Clauses button (both its forms) and the editor's chip read Simplify / Förenkla.
   At the parent they read Plain / Plain English / Enkel svenska / Klarspråk. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const src = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
const all = k => [...src.matchAll(new RegExp(`^\\s*${k}: '([^']*)',`, 'gm'))].map(m => m[1]);

test('f1221 the press for plain English reads Simplify in English and Förenkla in Swedish', () => {
  for (const k of ['th_plain', 'th_plain_en', 'ce_inline_plain']) assert.deepEqual(all(k), ['Simplify', 'Förenkla'], k);
});
