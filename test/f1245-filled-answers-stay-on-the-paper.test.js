/* f1245 — WHAT YOU FILLED IN STAYS ON THE PAPER (owner, 26 Nov 2026: "When i fill in information on the paper, why cant
   i see the information entered on the paper afterwards?"). On a negotiated paper Fill in files our answers as our change;
   the clean paper shows the wording as it stands, so the spaces read empty again after Save. pd2NegoAnswersPaint writes
   each answer of ours into its space on the clean paper (screen only, nothing filed), marked as ours; a press on one opens
   Fill in on that space; Fill in marks it again as the space it stands for (so the front part's answers come back too). */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = rel => fs.readFileSync(path.join(__dirname, '..', rel), 'utf8');
const fnSrc = (src, name) => {
  const at = src.search(new RegExp('\\nfunction ' + name + '\\(')); assert.ok(at >= 0, name + ' exists');
  let i = src.indexOf('{', at), d = 0;
  for (; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) break; }
  return src.slice(at + 1, i + 1).replace(/\/\*[\s\S]*?\*\//g, '');
};
const P = read('js/paperdesk.js');

test('f1245 (1) the clean paper writes our answers into their spaces, before the notes are measured', () => {
  const N = fnSrc(P, 'pd2NotesPaint');
  const a = N.indexOf('pd2NegoAnswersPaint(c, cv)'), b = N.indexOf('pd2NotesOnPaper(');
  assert.ok(a > 0 && a < b, 'painted in pd2NotesPaint, before the notes are placed');
  const A = fnSrc(P, 'pd2NegoAnswersPaint');
  assert.match(A, /pd2FillOn\(c\.id\)\) return 0/, 'not while Fill in holds the paper');
  assert.match(A, /\.ig-redpaper\.is-clean/, 'the clean paper only (Redline shows the change as a change)');
  assert.match(A, /igTheirsOn/, 'never Their view');
  assert.match(A, /pd2NegoFillOf\(c, id\)/, 'our answers, sent or not');
  assert.doesNotMatch(A, /persist\(|negoFileFilledClause|negoEditClause|contractBlankSet/, 'screen only: nothing filed or saved');
});

test('f1245 (2) sent or not, one reading; still ours to change only while unsent', () => {
  assert.match(fnSrc(P, 'pd2NegoOwnFill'), /pd2NegoFillOf\(c, clauseId\)[\s\S]*r\.unsent/);
  assert.match(fnSrc(P, 'pd2NegoFillOf'), /return \{ id: x\.id, fill, unsent \}/);
});

test('f1245 (3) an answer on the paper is its space: counted, pressed, marked again by Fill in', () => {
  assert.match(fnSrc(P, 'pd2NegoSeq'), /data-pd2-nb-ans/, 'the walk counts an answer as its space');
  assert.match(fnSrc(P, 'pd2NegoMark'), /b\.el && b\.ans[\s\S]*b\.el\.textContent = b\.raw/, 'Fill in turns it back into its space');
  assert.match(P, /closest\('#ig-canvas \[data-pd2-nb-ans\]'\)[\s\S]{0,200}pd2FillFromPress\(null, \{[^}]*key: ans\.getAttribute\('data-pd2-nb-ans'\)/, 'a press opens Fill in there');
  assert.match(fnSrc(P, 'pd2PressOnPlaceholder'), /data-pd2-nb-ans/, 'a later space with the same words keeps its count');
});

test('f1245 (4) said in both books, dressed in tokens', () => {
  const I = read('js/i18n.js');
  assert.equal((I.match(/pd2_nb_ans_unsent:/g) || []).length, 2);
  assert.equal((I.match(/pd2_nb_ans_sent:/g) || []).length, 2);
  assert.match(read('index.html'), /#ig-canvas \.pd2-nb-ans\{border-bottom:1px solid var\(--st-green-dot\)/);
});
