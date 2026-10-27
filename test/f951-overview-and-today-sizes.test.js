/* f951 — THE OVERVIEW'S FIRST WORDS AND THE BOARD'S TODAY COLUMN, AT THEIR NEIGHBOURS' SIZE (owner, 27 Oct 2026:
   "reduce the font size highlighted in the overview page across all the pages to be the same size as the font in the
   jambo panels"; "reduce the size of the today fonts as well to match its counter parts but keep it bold")
     1 · every Overview's head (ONE builder, jamboOverviewHtml → .jov-head) stands at the size of Jambo's own words (13px)
     2 · Your book's Today figure takes its row's size (inherits, as 27 April and Change do) and stays bold
   At the parent both fail (15px; var(--t-section)).
   Run: node --test test/f951-overview-and-today-sizes.test.js */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const rule = sel => { const i = HTML.indexOf('  ' + sel + '{'); assert.ok(i >= 0, sel); return HTML.slice(i, HTML.indexOf('}', i)); };

test('1 · the Overview head is the size of Jambo\'s words', () => {
  assert.match(rule('.jov-head'), /font-size:13px/);
});
test('2 · Today is its row\'s size, still bold', () => {
  const r = rule('.hb-book .hb-tn .hb-fig-n');
  assert.match(r, /font-size:inherit/);
  assert.doesNotMatch(r, /font-weight:\s*(400|normal)/, 'never made plain');
  assert.doesNotMatch(rule('.hb-tn .hb-fig-then'), /font-size/, 'its counterpart sets no size of its own: both inherit the row');
});
