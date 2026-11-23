'use strict';
/* f1153 — THE DOSSIER AND AMEND, THE LEGORA + STRIPE WAY (the owner's "Build Dossier L+S and Amend L+S", 22 Nov 2026).

   (1) THE FIGURES COME WITH THE CLAUSE: a paper drawn from the record holds its figures in form boxes; the one reader both
       amendment paths use (amendParentHtml → amendBoxesAsWords) reads each box as its words — 85,000,000, never "KES , based"
       (BUGLOG 17 Nov 2026) — and an empty box as a ruled line the amendment's own fill-in turns into a box.
   (2) THE SMALLEST TRUE SENTENCE: amendPinpoint names only a true swap of words, each found ONCE in the signed clause;
       an insertion, a phrase found twice or more than three changes keep the whole-clause replacement.
   (3) WHAT A CHANGE DOES is read off the two wordings, never guessed: a new term in years moves the end date, a new figure
       is a value, new days are days; nothing is a fact until a press (the amendment's own suggestion).
   (4) ONE DOOR: the Dossier card's Amend presses the family's own act ('create'); Continue and the family rows press the
       rows' own door; the links above Jambo's box leave "amend" on the new look's Dossier; the paper's line carries the
       family's tag from one reading (famStateOf).
   (5) NO MONEY IN A SIDE PANEL: the Amend panel draws no figure; the value lives in the table's own column. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const FAM = R('js/family.js'), PD = R('js/paperdesk.js'), VS = R('js/versioning.js');
const fnOf = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists');
  let d = 0, j = src.indexOf('{', i); for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}'){ d--; if (!d) return src.slice(i, k + 1); } } return src.slice(i); };
const famEsc = 'const _famEsc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\\"": "&quot;" }[c]));';
const tokenize = fnOf(VS, 'tokenize'), wordDiff = fnOf(VS, 'wordDiff');
const L = new Function('window', `${famEsc}\n${tokenize}\n${wordDiff}\nwindow.wordDiff = wordDiff;\n${fnOf(FAM, 'amendBoxesAsWords')}\n${fnOf(FAM, 'amendPinpoint')}\nreturn { amendBoxesAsWords, amendPinpoint };`)({});

test('f1153 (1) the figures come with the clause', () => {
  const out = L.amendBoxesAsWords('<p>value is KES <input type="number" value="85000000" data-field="v" class="field"/>, within <input type="number" value="30"/> days, made on <input type="date" value=""/>.</p>');
  assert.match(out, /KES 85,000,000, within 30 days/, 'the boxes read as their figures');
  assert.match(out, /made on ____________\./, 'an empty box is a ruled line to fill');
  assert.doesNotMatch(out, /<input/i);
  assert.equal(L.amendBoxesAsWords('<select><option>a</option><option selected>Nairobi</option></select>'), 'Nairobi');
  assert.match(fnOf(FAM, 'amendParentHtml'), /amendBoxesAsWords\(_amendParentHtmlRaw\(parent\)\)/, 'the one reader both paths use');
  assert.match(fnOf(PD, 'pdAmendClauseOf'), /input, select, textarea/, 'a clause pressed on the paper reads its boxes too');
});

test('f1153 (2) the smallest true sentence, and when it must not be used', () => {
  const T = 'The term is three (3) years from the effective date, and renews.';
  assert.deepEqual(L.amendPinpoint(T, T.replace('three (3)', 'four (4)')), [{ was: 'is three (3) years', now: 'is four (4) years' }]);
  const P = 'value is KES 85,000,000, based on pricing; invoices fall due within 30 days of receipt.';
  const two = L.amendPinpoint(P, P.replace('85,000,000', '92,000,000').replace('within 30', 'within 45'));
  assert.equal(two.length, 2, 'two changes, each named');
  assert.equal(L.amendPinpoint('continues until 31 December 2026.', 'This Agreement continues until 31 December 2026.'), null, 'an insertion keeps the whole clause');
  assert.equal(L.amendPinpoint('pay 30 days. pay 30 days.', 'pay 45 days. pay 30 days.'), null, 'a phrase found twice keeps the whole clause');
  assert.deepEqual(L.amendPinpoint('pay 30 days, then 30 days', 'pay 45 days, then 30 days'), [{ was: 'pay 30 days,', now: 'pay 45 days,' }], 'the words either side make it found once');
  assert.equal(L.amendPinpoint('a b c d e f g h', 'A b C d E f G h'), null, 'more than three changes keep the whole clause');
  assert.match(fnOf(FAM, 'amendmentItemHtml'), /amendPinpoint\([\s\S]*is deleted and replaced with/, 'the whole-clause sentence stays the fallback');
});

test('f1153 (3) what a change does is read off the wording, a fact only by a press', () => {
  const src = ['pd2AmxIso', 'pd2AmxDates', 'pd2AmxMoney', 'pd2AmxYears', 'pd2AmxDays', 'pd2AmxEffectOf'].map(n => fnOf(PD, n)).join('\n');
  const F = new Function('effectiveExpiry', `const PD2_AMX_MONTHS = ['january','february','march','april','may','june','july','august','september','october','november','december'];\n${src}\nreturn pd2AmxEffectOf;`)(c => c.expiry);
  const c = { expiry: '2027-06-30' };
  assert.deepEqual(F(c, { signed: 'The term is three (3) years.', amended: 'The term is four (4) years.' }), { k: 'end', iso: '2028-06-30', from: '2027-06-30' });
  assert.equal(F(c, { signed: 'KES 85,000,000 a year', amended: 'KES 92,000,000 a year' }).v, 92000000);
  assert.deepEqual(F(c, { signed: 'within 30 days', amended: 'within 45 days' }), { k: 'days', from: 30, to: 45 });
  assert.equal(F(c, { signed: 'ends on 30 June 2027', amended: 'ends on 30 June 2028' }).iso, '2028-06-30');
  assert.equal(F(c, { signed: 'same words', amended: 'same words' }).k, 'same');
  /* a suggestion becomes the amendment's own fact only on its press; the signed agreement is never written */
  assert.match(PD, /if \(k === 'expiry'\) _pdAm\.expiry = v; else if \(k === 'value'\) _pdAm\.value = v;/);
  assert.match(fnOf(PD, 'pdAmendCreate'), /createAmendment\(c, \{[^}]*kind: _pdAm\.kind/);
});

test('f1153 (4) one door: Amend, Continue, the family rows and the tag', () => {
  const card = fnOf(PD, 'pd2AmendCardOf');
  assert.match(card, /data-pd-ds-famact="create"/, 'Amend presses the family\'s own act');
  assert.match(R('js/family.js'), /if\(k==='create'\)\{ if\(amendmentShutWhy\(c\)\) return false; if\(typeof window\.pdAmendOpen==='function'&&window\.pdAmendOpen\(c\.id\)\) return true;/, 'that act opens the Amend page, as the chip does');
  assert.match(card, /data-fam-go=/, 'Continue presses the row\'s own door');
  assert.match(fnOf(PD, 'pd2FamCardHtml'), /data-pd-ds-fam=/, 'each family row is its paper\'s door');
  assert.match(fnOf(PD, 'pd2FamCardHtml'), /a\.k !== 'create'/, 'Create is the card\'s, not a second door in the family card');
  assert.match(R('js/copilotacts.js'), /amendHere \? \['amend', 'history'\] : \['history'\]/ /* RE-POINTED 23 Nov 2026 ("Duties, end to end"): obligations left the links */, 'amend leaves the links on the new look\'s Dossier');
  assert.match(R('js/views/intelligence.js'), /famTagHtml\(c\)/, 'the paper\'s line carries the family\'s tag');
  assert.match(fnOf(FAM, 'famTagHtml'), /famStateOf\(c\)/, 'from the one reading');
});

test('f1153 (5) no money in the Amend panel; the value is the table\'s own column', () => {
  const panel = fnOf(PD, 'pd2AmFaceHtml');
  assert.doesNotMatch(panel, /fmtMoney/, 'the panel draws no figure');
  assert.match(fnOf(PD, 'pd2AmxTableHtml'), /canViewValues/, 'the column is gone without money rights');
});

test('f1153 (6) start from today\'s deal: the Amend paths read the agreement as already amended', () => {
  /* the Amend page, Jambo and the dialog read amendParentClauses / amendParentText, which fold every signed amendment in */
  const today = fnOf(FAM, 'amendParentClauses');
  assert.match(today, /asAmendedItems\(parent\)/, 'the signed amendments, in signed order');
  assert.match(today, /amendOriginalClauses\(parent\)/, 'over the paper as signed');
  assert.match(today, /amendedBy/, 'each changed clause says who changed it');
  assert.match(fnOf(FAM, 'amendParentText'), /amendParentClauses\(parent\)/, 'Jambo reads today\'s words');
  /* the As amended view still draws each amendment over the paper AS SIGNED (never twice) */
  assert.match(fnOf(FAM, 'asAmendedHtml'), /amendOriginalClauses\(c\)/);
  /* the new paper names what it builds on */
  assert.match(FAM, /const amendedBy=priorWords\.length\?`, as amended by /);
  assert.match(FAM, /\$\{dated\}\$\{amendedBy\} \(the &ldquo;Agreement&rdquo;\)/);
  /* the signed paper shows today's words under a clause an earlier amendment changed — painted, never stored */
  assert.match(fnOf(PD, 'pdAmendPaperPaint'), /pd-am-today/);
});
