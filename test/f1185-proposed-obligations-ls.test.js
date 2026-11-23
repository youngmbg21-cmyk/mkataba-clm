'use strict';
/* f1185 — PROPOSED OBLIGATIONS, THE LEGORA + STRIPE WAY — REVERSED 23 Nov 2026 by f1187 (owner: "something is not right with
   the obligations … it should be mandatory to go through adding or skipping the pop up as you add a duty therefore no mass
   additions"; "build it", the drawing "Duties, end to end"). The morning's desk — whose answered in the row, Add in the row,
   ticks and "Add all N ready" — is gone; every door lands on the contract's Duties page (f1187). What stays pinned here is
   only that the reversed parts are gone. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const OB = strip(fs.readFileSync(path.join(__dirname, '..', 'js/obligations.js'), 'utf8'));

test('f1185 (R) the morning\'s desk is gone: no row Add, no whose pills in the row, no Add all ready', () => {
  for (const name of ['lsRowHtml', 'lsListHtml', 'lsFaceHtml', 'lsReadyLeft']) assert.ok(!OB.includes('const ' + name + ' ='), name + ' is gone');
  assert.doesNotMatch(OB, /data-obd-radd|data-obd-rw/, 'no Add or whose answered in a row');
  assert.match(OB, /if\(!place\) return openDutiesPage\(c, found,/, 'the review lands on the Duties page');
});
