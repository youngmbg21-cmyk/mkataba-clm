/* ============================================================
   f1182 — Approvals: "open the clause" opens the paper where it departs
   ============================================================
   Owner, 23 Nov 2026: on Approvals & signing, a departure's panel link
   "open the clause" took the reader into the clause editor; it should land
   where the row's "See it in the paper ›" lands — the paper, read-only, at
   the departing words (apnPeekOpen). Red at the parent: the link carried
   data-apn-pile-open (→ apnPileAct 'open' → the editor).
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const AP = fs.readFileSync(path.join(__dirname, '..', 'js/views/approvalsview.js'), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnBody = name => { const i = AP.indexOf('function ' + name + '('); return AP.slice(i, AP.indexOf('\n}', i) + 2); };

test('f1182 — the departure panel\'s "open the clause" is the paper look, and its press opens it', () => {
  const panel = strip(fnBody('apnPilePanel'));
  assert.match(panel, /data-apn-pile-peek="\$\{esc\(r\.key\)\}">\$\{esc\(i18t\('apn_l_clause'\)\)\}/, 'the link asks for the paper look');
  assert.doesNotMatch(panel, /data-apn-pile-open="\$\{esc\(r\.key\)\}">\$\{esc\(i18t\('apn_l_clause'\)\)\}/, 'not the clause editor');
  assert.match(strip(AP), /closest\('\[data-apn-pile-peek\]'\)[^\n]*apnPeekOpen\(b\.getAttribute\('data-apn-pile-peek'\)\)/, 'one press, the row\'s own opener');
});
