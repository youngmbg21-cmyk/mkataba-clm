/* f1244 — FILL IN FROM THE PAPER, AND OUT OF IT (owner, 26 Nov 2026, of MK-469):
   "in the top bar, add an exit button so you can go to the paper with the notes. It should also give you the pop up for
   save or discard if you have filled in anything"; "the ambers are not filled in but also in the panel there is nothing
   point to how i should fill those spaces because the triggers have been deleted"; "i want to be able to fill in by just
   placing my cursor on the paper as well" (REVERSES 13 Nov's "only Fill in the contract fills", f1042).
   (1) Exit on Fill in's bar: nothing typed → back to the paper; typed → the one Save · Discard question.
   (2) A press on a space starts Fill in with the caret in that space — a marked blank, or on a paper with redlines a
       placeholder's own words (its key read before anything moves).
   (3) A Fill in change saved before its answers were kept on it (MK-469's) is read back — by Fill in's own note, a
       company standard's field from its form, a placeholder from the words the change put there — without writing. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnSrc = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  let i = src.indexOf('{', at), d = 0; for (; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; } return strip(src.slice(at, i + 1)); };
const PD = read('js/paperdesk.js');

test('f1244 (1) Exit on the bar; typed asks Save · Discard, nothing typed goes straight back', () => {
  assert.match(fnSrc(PD, 'pd2FillPaint'), /data-pd2-fill-exit>\$\{E\(_pdT\('pd2_fh_exit'\)\)\}/);
  const x = fnSrc(PD, 'pd2FillExit');
  assert.match(x, /if \(!c \|\| !pd2FillChanged\(c\)\)\{ pd2FillStop\(\); return; \}/);
  assert.match(x, /pd2FillAsk\(c, 'pd2_fl_exit_sub'\)/);
  assert.match(fnSrc(PD, 'pd2FillLeaveCheck'), /pd2FillAsk\(c, 'pd2_fl_leave_sub'\)/, 'one question for leaving and for Exit');
  assert.match(fnSrc(PD, 'pd2FillAsk'), /alt: \{ label: _pdT\('pd2_fl_discard'\)/);
  assert.match(PD, /if \(t\.closest\('\[data-pd2-fill-exit\]'\)\)\{ e\.preventDefault\(\); pd2FillExit\(\); return; \}/);
  const I = read('js/i18n.js');
  for (const k of ['pd2_fh_exit', 'pd2_fl_exit_sub']) assert.equal((I.match(new RegExp('\\n\\s+' + k + ': ', 'g')) || []).length, 2, k);
});
test('f1244 (2) a press on a space starts Fill in there', () => {
  const p = fnSrc(PD, 'pd2FillFromPress');
  assert.match(p, /pd2FillStart\(full\.id, ''\)/, 'through Fill in\'s one way in');
  assert.match(p, /pd2Sealed\(full\)/); assert.match(p, /igTheirsOn/); assert.match(p, /mayActOn/);
  assert.match(p, /pd2FillGoTo\('b:' \+ k\)/, 'the caret in the space pressed');
  const ph = fnSrc(PD, 'pd2PressOnPlaceholder');
  assert.match(ph, /caretRangeFromPoint/); assert.match(ph, /upHits\(node\.data\)/);
  assert.match(ph, /closest\('del, \.ig-signpaper'\)/, 'never a deletion\'s words');
  assert.match(ph, /key: 'nb~' \+ clauseId \+ '~u:' \+ hit\.raw \+ '~' \+ n/, 'the key read before anything moves');
});
test('f1244 (3) an earlier Fill in change gives its answers back, read without writing', () => {
  const r = fnSrc(PD, 'pd2NegoFillRead');
  assert.match(PD, /const PD2_NB_NOTES = \['Filled in on the paper', 'Ifyllt på pappret'\];/);
  assert.match(r, /if \(!mine\.has\(note\)\) return null;/, 'only Fill in\'s own changes');
  assert.match(r, /c\.templateForm && c\.templateForm\.values/, 'a company standard\'s field from its form');
  assert.match(r, /re\.exec\(now\)/, 'a placeholder from the words the change put there');
  const o = fnSrc(PD, 'pd2NegoOwnFill');
  assert.doesNotMatch(o, /x\.fill = /, 'reading writes nothing on the record');
  assert.match(o, /return unsent \? \{ id: x\.id, fill \} : null;/);
});
