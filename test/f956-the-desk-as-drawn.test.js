/* THE READING DESK AS DRAWN, AND THE SHORTER FORM (round 2 of the review, 28 Oct 2026; the owner's drawing, artifact
   C83usssBsvJMimRMC4xZWy). The browser says the column's name before the read (askColNameOf); the server keeps the
   name by the same rule (colNameOf). The two must never differ, or the form promises one name and the list shows
   another. At the parent (before this change) there is no askColNameOf. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

const slice = (src, start, end) => { const a = src.indexOf(start); assert.ok(a >= 0, 'missing ' + start); const b = src.indexOf(end, a); assert.ok(b > a, 'missing end ' + end); return src.slice(a, b); };
const QS = ['Does this contract mention a rebate?', 'How much notice does each side need to end the contract?', 'Is our liability capped, and at what?',
  'Which law governs the contract?', 'Can either side end it without cause?', 'Does this agreement name a court or an arbitrator for disputes?',
  'What is the payment term?', 'Rebate', '', 'Who owns the intellectual property?'];

test('1 · the browser and the server name a column the same way', () => {
  const web = slice(read('js/views/askcolumn.js'), 'const AC_NAME_LEAD', '\nfunction askColPackAskIds');
  const srv = slice(read('server/server.js'), 'const COLUMN_NAME_LEAD', 'function colAskKeep');
  const a = Function(web + '; return askColNameOf;')(), b = Function(srv + '; return colNameOf;')();
  for (const q of QS) assert.equal(a(q), b(q), 'differs on ' + JSON.stringify(q));
  assert.equal(a('Does this contract mention a rebate?'), 'Rebate');
  assert.equal(a('How much notice does each side need to end the contract?'), 'Notice');
  assert.equal(a('Is our liability capped, and at what?'), 'Liability capped');
});

/* RETIRED 22 Nov 2026 (owner: "There is not asking a column again only the features related to discovery"): test 2 — Ask a column's form, its grey reading card and its stopped card are deleted; Discover's
   reading screen is pinned by f1057 and stop-and-reads-verify */