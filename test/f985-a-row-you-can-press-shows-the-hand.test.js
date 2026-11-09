'use strict';
/* f985 — A ROW YOU CAN PRESS SHOWS THE HAND (owner, 9 Nov 2026: "when you hover of the reads rows the cursor does not turn
   into a small hand to indicate you can press it"). A browser sweep of every list in the new look found three whose rows
   select on a press but kept the arrow: Reads, Parties and People. Home, the Board's Needs you and the Calendar's rows are
   not pressed as rows (their buttons are), so they keep the arrow. At the parent the claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const CSS = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('Reads, Parties and People rows show the hand, and each is pressed as a row', () => {
  assert.match(CSS, /html\.lg-new :is\(tr\[data-rd-row\],tr\[data-cu-cust\],tr\[data-dir-row\]\)\{cursor:pointer\}/);
  assert.match(read('js/views/reads.js'), /closest\('\[data-rd-row\]'\)/, 'a Reads row is pressed');
  assert.match(read('js/views/customers.js'), /closest\('\[data-cu-cust\]'\)/, 'a Parties row is pressed');
  assert.match(read('js/views/directory.js'), /closest\('\[data-dir-row\]'\)/, 'a People row is pressed');
});
