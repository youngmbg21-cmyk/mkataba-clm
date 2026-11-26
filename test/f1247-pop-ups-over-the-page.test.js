/* f1247 — POP-UPS STAY OVER THE PAGE, WEAR THE RIBBON, AND THEIR LISTS ARE NEVER CUT (owner, 26 Nov 2026, three photos:
   "when i highlight a clause in the contract and ask to add to notes, it pushes me to the notes page. The pop up should
   appear but on top of the paper"; "the pop up has no waves on it" (Internal review); "the drop down disappears inside
   the pop up instead of being out so you can see the list" (the desk's Add someone) — "Fix this and anywhere else it may be").
   (1) a note started on another page opens its sheet over that page, never moves the reader, and saving keeps them there;
   (2) the review pop-ups' white head band no longer paints over the ribbon;
   (3) the one people picker (the desk's and the review's) floats its list over everything under the box (popListFloat). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fn = (src, name) => { const i = src.indexOf('\nfunction ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return strip(src.slice(i, j + 2)); };
const MN = read('js/views/mynotes.js');

test('f1247 (1) a note from another page opens over it and keeps the reader there', () => {
  assert.match(fn(MN, 'mnSheetAway'), /state\.view !== 'mynotes' && typeof window\.newLookOn === 'function' && newLookOn\(\) && typeof window\.lgpOpen === 'function'/);
  const n = fn(MN, 'myNotesNew');
  assert.match(n, /const away = mnSheetAway\(\);/);
  assert.ok(n.indexOf("if (away){ mnSheetPaint(true); return; }") >= 0 && n.indexOf("if (away){ mnSheetPaint(true); return; }") < n.indexOf("setView('mynotes')"), 'never sent to My notes');
  assert.match(MN, /if \(state\.view === 'mynotes'\)\{ if \(typeof insSelect === 'function'\) insSelect\('mynotes', it\.id\); renderMyNotes\(\); \}/, 'saved over another page: that page stays');
});

test('f1247 (2) the review pop-ups let the ribbon show', () => {
  assert.match(read('index.html'), /html\.lg-new \.has-pop-wave > \.rvd-head\{background:transparent;padding-top:22px\}/);
  assert.match(read('js/components.js'), /var POP_WAVE_TITLE = '[^']*\.rvd-title/, 'its title is the ribbon\'s measure');
});

test('f1247 (3) a pop-up\'s list floats over everything, under its box', () => {
  const C = read('js/components.js');
  const f = fn(C, 'popListFloat');
  assert.match(f, /S\.position = 'fixed'; S\.zIndex = String\(POP_LIST_Z\);/);
  assert.match(f, /S\.width = Math\.round\(a\.width\) \+ 'px'/);
  assert.match(f, /window\.addEventListener\('scroll'/, 'follows the box while the pop-up scrolls');
  assert.match(C, /var POP_LIST_Z = 90;/);
  assert.match(read('js/review.js'), /if \(open && typeof window\.popListFloat === 'function'\) window\.popListFloat\(list, box\.closest\('\.lgp-v'\) \|\| box\.parentElement \|\| box\);/, 'the one picker, the desk\'s and the review\'s');
  assert.match(read('js/desk.js'), /reviewWirePicker\(c, \{ prefix: 'dk'/, 'the desk uses the review\'s picker');
});

/* (4) ONE NUMBERING, BOTH PAPERS (owner, 26 Nov 2026: "the notes are numbered differently between clean and redline"):
   the redlined paper's notes are grouped and named by the paper's own numbered row, as the clean paper's are */
test('f1247 (4) redline notes take the clean paper\'s numbered rows and names', () => {
  const P = read('js/paperdesk.js');
  const r = fn(P, 'pd2RedBlocks');
  assert.match(r, /docXrayRows\(c, cv\)/, 'the same rows as pd2Groups');
  assert.match(r, /const key = k >= 0 \? 'row:' \+ k :/, 'grouped by the row');
  assert.match(r, /if \(k >= 0 && typeof docXrayLabel === 'function'\) label = docXrayLabel\(rows\[k\]\);/, 'named as the clean paper names it');
  assert.match(fn(P, 'pd2Groups'), /docXrayLabel\(rows\[at\]\)/, 'the clean paper\'s own naming');
});
