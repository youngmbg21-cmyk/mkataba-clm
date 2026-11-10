'use strict';
/* f979 — A PRESS STAYS WHERE IT WAS PRESSED, AND AN ITALIC WORD IS NEVER CUT (owner, 9 Nov 2026, on Reads: "The column
   as highlighted is cutting off some of the words. Also, when i press on one of the lines, the page kicks me to the top
   of the page... I should remain on where I pressed").
   Measured at the parent in a browser: a read's table scrolled to 900 went to 0 on a row press; the list of reads 354 → 0;
   My notes 300 → 0; "Not found" (italic, in an ellipsis box) lost the lean of its last letter. Every one fails here at
   the parent. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

test('1 · a read\'s table drawn again keeps its scroll', () => {
  const fn = read('js/views/reads.js').match(/function rdTablePaint\(\)\{[\s\S]*?\n\}/)[0];
  assert.match(fn, /const was = document\.getElementById\('rd-scroll'\); const top = was \? was\.scrollTop : 0;[\s\S]*if \(top\)\{ const sc = document\.getElementById\('rd-scroll'\); if \(sc\) sc\.scrollTop = top; \}/);
});
test('2 · the list of reads and My notes keep their scroll while the same list is in view', () => {
  const rd = read('js/views/reads.js');
  /* RE-POINTED 10 Nov 2026 (the overnight run, job 7): renderReads carries the rows-only option down; the rule is unchanged */
  assert.match(rd, /function renderReads\(o?\)\{\s*const mode = _rd\.table \? 't:' \+ _rd\.table\.key : 'list';[\s\S]*?renderReadsDraw\(o?\);[\s\S]*?sc\.scrollTop = top0;/);
  const mn = read('js/views/mynotes.js');
  assert.match(mn, /function renderMyNotes\(\)\{[\s\S]*?renderMyNotesDraw\(\);[\s\S]*?sc\.scrollTop = top0;/);
});
test('3 · an italic "Not found" keeps room for its last letter wherever it is cut with "…"', () => {
  assert.match(read('index.html'), /:is\(#ig-dock, html\) \.ac-ans\.tone-none > :is\(span, b\)\{padding-right:\.2em\}/);
  assert.match(read('js/views/reads.js'), /\.rdt-w\{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;padding-right:\.2em\}/);
});
