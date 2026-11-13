'use strict';
/* f1026 — A BLANK ON A NEGOTIATED PAPER IS FILLED AS A TRACKED CHANGE (owner, 13 Nov 2026: "what is best practice?",
   then "yes, build option 2", then "Done straight away" for a company standard's owed list).
   (1) the gate: our seat, an editor, the negotiated paper in front, wording not frozen, a desk that may redline;
   (2) a clause with a change open on it (either side's) offers no blank — read RAW, never negoInit;
   (3) the fill walk takes the marks on a negotiated paper and nothing else of it (pd2BlOff);
   (4) Save files each clause's answers through THE ONE DOOR, negoEditClause, side owner, quiet, a note — never
       contractBlankSet, never a quiet write of the wording; refused when the blank is not found again;
   (5) a company standard's answer goes into its form through its one writer, the wording then said to carry it;
   (6) both books, the Handbook's step. Browser: negotiated-blanks-verify. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const region = (src, name) => { const m = new RegExp('(?:async )?function ' + name + '\\(').exec(src); assert.ok(m, name + ' is found');
  const b = src.indexOf('\nfunction ', m.index + 10), b2 = src.indexOf('\nasync function ', m.index + 10);
  const end = [b, b2].filter(x => x > 0).sort((x, y) => x - y)[0]; return src.slice(m.index, end); };
const P = stripCom(read('js/paperdesk.js'));

test('f1026 (1) the gate', () => {
  const g = region(P, 'pd2NegoFillOn');
  for (const re of [/PORTAL_MODE\)\) return false/, /!canEdit\(\)\) return false/, /String\(p\.id\) !== String\(c\.id\)\) return false/,
    /!cv\.closest\('\.ig-redpaper'\) \|\| cv\.closest\('\.ig-signpaper'\)\) return false/, /igTheirsOn\(c\)\) return false/,
    /negoWordingFrozen\(c\)\) return false/, /!deskMayRedline\(c\)\) return false/]) assert.match(g, re);
});
test('f1026 (2) a clause with a change open on it offers no blank, read RAW', () => {
  const a = region(P, 'pd2NegoArgued');
  assert.match(a, /x\.status === 'pending' \|\| x\.status === 'countered'/);
  assert.doesNotMatch(a, /negoInit|negoChanges|negoClauseList/);
  const m = region(P, 'pd2NegoMark');
  assert.match(m, /argued\.has\(String\(id\)\) \|\| sec\.classList\.contains\('is-changed'\)\) return;/);
  assert.doesNotMatch(region(P, 'pd2NegoRead'), /negoInit|negoClauseNowById|pd2NegoMark/, 'reading paints and writes nothing');
});
test('f1026 (3) the fill walk takes the negotiated paper\'s marks and nothing else of it', () => {
  assert.match(P, /const PD2_BL_SEL = '\[data-upblank\], \.hati-field\[data-field-key\], span\.field-frozen\[data-field\], \[data-pd2-nb\]';/);
  assert.match(P, /const pd2BlOff = sp => !!\(sp\.closest\('\.ig-signpaper'\) \|\| \(sp\.closest\('\.ig-redpaper'\) && !sp\.hasAttribute\('data-pd2-nb'\)\)\);/);
  assert.match(region(P, 'pd2FillWalk'), /pd2BlOff\(sp\)/);
  assert.match(region(P, 'pd2FillPaint'), /pd2NegoMark\(c\);[\s\S]*pd2BlOff\(sp\)/);
  assert.match(region(P, 'pd2FillBlanks'), /\.concat\(pd2NegoRead\(c\)\)/);
  assert.match(region(P, 'pd2FillStart'), /if \(first\) pd2NegoMark\(c\);\n\s*if \(first\)\{ const was/);
});
test('f1026 (4) Save files through the one door as our change, never quietly', () => {
  const save = region(P, 'pd2FillSave');
  assert.match(save, /const nego = moved\.filter\(x => x\.b\.kind === 'nego' && x\.v\);/);
  assert.ok(save.indexOf('pd2FillSaveNego(c, nego, rest)') < save.indexOf('contractBlankSet('), 'handed on before any blank is written');
  const f = region(P, 'pd2NegoFile');
  assert.match(f, /await negoFileFilledClause\(c, clauseId, host\.innerHTML, _pdT\('pd2_nb_note'\)\)/);
  /* the door and the save live in the negotiation's own file: the desk never saves (f563) */
  const N = stripCom(read('js/negotiation.js'));
  assert.match(region(N, 'negoFileFilledClause'), /await negoEditClause\(c, clauseId, bodyHtml, \{ side: 'owner', quiet: true, note \}\);\n\s*if \(ch && window\.persist\) persist\(c\);/);
  assert.match(f, /const cl = negoClauseNowById\(c, clauseId\);/, 'from the clause as it stands');
  assert.match(f, /if \(!cl \|\| hits\.some\(h => !h\.at\)\) why = _pdT\('pd2_nb_moved'\);/, 'a blank not found again refuses the clause');
  assert.doesNotMatch(f, /contractBlankSet|redlineText\s*=|\.bodyHtml\s*=|persist\(/, 'nothing written but through the door');
  assert.match(f, /sp\.className = 'hati-field-done'; sp\.setAttribute\('data-field-key', at\.fk\); sp\.textContent = x\.v;/, 'an answer is text, never markup');
});
test('f1026 (4b) when the filling stops, a negotiated paper is drawn whole, its marks and boxes gone', () => {
  assert.match(region(P, 'pd2FillStop'), /if \(host && host\.querySelector\('\[' \+ PD2_NB_ATTR \+ '\]'\)\) delete host\.dataset\.for;\n\s*if \(typeof igPaperRefresh === 'function'\)/);
});
test('f1026 (5) a company standard\'s answer is its form\'s too, through its one writer', () => {
  const f = region(P, 'pd2NegoFile');
  assert.match(f, /tplFormCommit\(c, i, x\.v\)/);
  assert.match(f, /if \(n && !owed && typeof tplFormSig === 'function'\) form\.filledSig = tplFormSig\(form\);/, 'never hides an answer already owed');
});
test('f1026 (6) both books, and the Handbook says it', () => {
  const L = read('js/i18n.js');
  for (const k of ['pd2_nb_note', 'pd2_nb_blank', 'pd2_nb_from_form', 'pd2_nb_moved', 'pd2_nb_saved_one', 'pd2_nb_saved_other', 'pd2_nb_refused'])
    assert.equal((L.match(new RegExp('\\n\\s+' + k + ': ', 'g')) || []).length, 2, k);
  const H = read('js/handbook.js');
  assert.match(H, /On a contract being negotiated, its blanks are typed on the paper too, except in a clause with a change still open on it\./);
  assert.match(H, /På ett avtal som förhandlas skrivs luckorna också på pappret/);
});
