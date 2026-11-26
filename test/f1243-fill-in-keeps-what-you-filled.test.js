/* f1243 — FILL IN KEEPS WHAT YOU FILLED, TOP TO BOTTOM (owner, 26 Nov 2026, with three photos of a lease with redlines):
   "the top bar remove the buttons for save and stop"; "the options should be save and discard"; "i should be able to
   press and fill in on the paper. Also, the sequence of the fill on the side panel should be from top to bottom. It also
   seems when i save the saved information disappears and i then cannot revert and fill in the same space."
   Measured: on a paper with redlines, Save filed the clause's answers as one tracked change of ours; the next Fill in
   passed over every clause with a change, so all its spaces went — the filled ones and the ones still open (15 → 10),
   and a second save would have made a second change. And after a filed save HaTi also said "Nothing changed". */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const fnSrc = (src, name) => { const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  let i = src.indexOf('{', at), d = 0; for (; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; } return strip(src.slice(at, i + 1)); };
const PD = read('js/paperdesk.js');

test('f1243 (1) no Save or Stop on Fill in\'s bar', () => {
  const p = fnSrc(PD, 'pd2FillPaint');
  assert.doesNotMatch(p, /data-pd2-fill-save/); assert.doesNotMatch(p, /data-pd2-fill-discard/);
  assert.match(p, /<b class="pd2-fh-t">/, 'the bar still names the contract and where you are');
});
test('f1243 (2) the question on leaving says Save · Discard, in both books', () => {
  const I = read('js/i18n.js');
  assert.equal((I.match(/\n\s+pd2_fl_discard: /g) || []).length, 2);
  assert.match(I, /pd2_fl_discard: 'Discard'/); assert.match(I, /Discard leaves the paper as it was/);
});
test('f1243 (3) the side panel lists every space in the paper\'s order, filled ones too', () => {
  const w = fnSrc(PD, 'pd2FillWalk');
  assert.match(w, /const all = new Set\(pd2FillBlanks\(c\)\.map\(b => String\(b\.key\)\)\)/);
  assert.doesNotMatch(w, /!String\(b\.value \|\| ''\)\.trim\(\)/, 'no longer only the owed ones');
  assert.match(fnSrc(PD, 'pd2FillNext'), /pd2FillDone/, 'Enter still goes to the next one left to fill');
});
test('f1243 (4) on a paper with redlines, our own Fill in change gives its spaces back with their answers', () => {
  /* RE-POINTED 26 Nov 2026 (f1245): the reading lives in pd2NegoFillOf; pd2NegoOwnFill keeps the unsent */
  assert.match(fnSrc(PD, 'pd2NegoOwnFill'), /r && r\.unsent/);
  const o = fnSrc(PD, 'pd2NegoFillOf');
  /* RE-POINTED 26 Nov 2026 (f1244): an unstamped Fill in change is read back too (pd2NegoFillRead) */
  assert.match(o, /L\.length !== 1/, 'the clause\'s only open change'); assert.match(o, /x\.authorSide !== 'owner'/); assert.match(o, /pd2NegoFillRead\(c, x, clauseId\)/);
  assert.match(o, /turnAt/, 'not yet sent');
  const m = fnSrc(PD, 'pd2NegoMark');
  assert.match(m, /own = pd2NegoOwnFill\(c, id\); if \(!own\) return;/, 'any other changed clause is still passed over');
  assert.match(m, /negoClauseNowById\(c, id\)/, 'the clause as it stands');
  assert.match(m, /data-pd2-nb-val/, 'the answer goes back into its space');
  assert.match(fnSrc(PD, 'pd2NegoRead'), /value: el\.getAttribute\('data-pd2-nb-val'\) \|\| ''/);
});
test('f1243 (5) a save files the clause again with every answer, so our one change is replaced, never a second', () => {
  const f = fnSrc(PD, 'pd2NegoFile');
  assert.match(f, /fill = Object\.assign\(\{\}, own \? own\.fill : \{\}\)/, 'our earlier answers');
  assert.match(f, /else delete fill\[k\]/, 'a cleared answer goes back to its space');
  assert.match(f, /negoFileFilledClause\(c, clauseId, host\.innerHTML, _pdT\('pd2_nb_note'\), fill\)/, 'the answers ride our change');
  assert.match(fnSrc(read('js/negotiation.js'), 'negoFileFilledClause'), /live\.fill = Object\.assign\(\{\}, fill\)/, 'stamped by the door, before it saves');
  assert.match(fnSrc(PD, 'pd2FillSave'), /x\.b\.kind === 'nego' && \(x\.v \|\| String\(_pd2Fill\.was\[x\.b\.key\] \|\| ''\)\.trim\(\)\)/, 'a cleared answer counts as a change');
});
test('f1243 (6) after a filed save, no "Nothing changed"', () => {
  assert.match(fnSrc(PD, 'pd2FillSaveNego'), /pd2FillSave\(\{ afterFiled: true \}\)/);
  assert.match(fnSrc(PD, 'pd2FillSave'), /total \|\| !\(opts && opts\.afterFiled\)/);
});
