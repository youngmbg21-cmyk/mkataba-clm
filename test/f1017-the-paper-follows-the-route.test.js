'use strict';
/* f1017 — THE SIGNATURE LINES FOLLOW THE ROUTE, AND AN EXTRA SPACE CAN GO (owner, 12 Nov 2026: "the signing in image
   one is not tied to image 2. I cant delete the extra signing spaces on the paper").

   Measured on the owner's screen: the signing route named both signers, the paper being filled still said "Who signs
   for … · owed" with empty spaces on the lines, and every press of "+ Another signer" left a space nothing took away.

   (1) A LINE THE ROUTE NAMES SOMEBODY ON IS FILLED: pd2FillDone reads the route (pd2FillSigNamed), not only what was
       typed in this sitting.
   (2) THE ROUTE'S SAVE REACHES THE PAPER: the one signer door, pressed while filling, calls pd2FillRouteSync, which
       drops the empty spaces and the names typed twice, draws every line again, and WRITES NOTHING.
   (3) A SPACE YOU DO NOT NEED IS TAKEN AWAY: a × per space (pd2FillSigDrop), Backspace in an empty one; a line's only
       space stays (pd2FillSigMayDrop).
   (4) THE WORDS ARE IN BOTH BOOKS, the Handbook's chapter says it.
   (5) THE NAMES TYPED ON THE PAPER ARE IN THE ROUTE WINDOW (owner, 12 Nov 2026: "show names typed on the paper in
       the route window too"): the door hands pd2FillSigTyped to openSignerPlanEditor (opts.typed); nothing saved
       until Save route. Red at its parent (35fc267): the window read the saved route only.
   RED AT THE PARENT: none of the three functions, the × or the word exists. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const PD = read('js/paperdesk.js');
const CODE = (() => { const a = PD.indexOf('/* ---- FILL IN ON THE PAPER, THE LEGORA WAY'), b = PD.indexOf('/* ---- THE READ, WATCHED');
  assert.ok(a > 0 && b > a, 'the fill block is found'); return stripCom(PD.slice(a, b)); })();
const fn = name => { const m = CODE.match(new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}')); assert.ok(m, name + ' is defined in the fill block'); return m[0]; };

test('f1017 (1) a line the route names somebody on is filled', () => {
  const d = fn('pd2FillDone');
  assert.match(d, /pd2FillSigNamed\(c, ln, lines\)\.length/, 'the route is read');
});

test('f1017 (2) the route saved while filling reaches the paper, and writes nothing', () => {
  const door = stripCom(PD).match(/openSignerPlanEditor\(c, \{ typed, onDone\(\)\{[\s\S]{0,400}/);
  assert.ok(door, 'the one signer door is found');
  assert.match(door[0], /pd2FillRouteSync\(c\)/, 'its Save tells the paper being filled');
  const s = fn('pd2FillRouteSync');
  assert.match(s, /pd2FillOn\(c\.id\)/, 'only while this contract is being filled');
  assert.match(s, /String\(x\.name \|\| ''\)\.trim\(\) && !named\.some\(s => pd2FillSigSame\(s, x\)\)/, 'empty spaces and names typed twice go; other typed names stay');
  assert.match(s, /pd2FillSigPaint\(c, cv\)/, 'every line is drawn again');
  assert.doesNotMatch(s, /saveSignerPlan|persist\(|c\.signerPlan\s*=(?!=)/, 'it writes nothing');
});

test('f1017 (3) a space is taken away by its × or Backspace; a line\'s only space stays', () => {
  const may = fn('pd2FillSigMayDrop'), drop = fn('pd2FillSigDrop'), paint = fn('pd2FillSigPaint');
  assert.match(may, /pd2FillSigNamed\(c, L, lines\)\.length \+ held\.length > 1/, 'never the only space');
  assert.match(drop, /!pd2FillSigMayDrop\(c, i\)\) return false/, 'the drop asks first');
  assert.doesNotMatch(drop, /saveSignerPlan|persist\(/, 'and writes nothing');
  assert.match(paint, /mayDrop = named\.length \+ held\.length > 1/, 'the × is drawn only where it works');
  assert.match(paint, /data-pd2-ps-rm=/, 'the × carries its space');
  assert.match(CODE, /closest\('#ig-canvas \[data-pd2-ps-rm\]'\)[\s\S]{0,160}pd2FillSigDrop\(/, 'the press');
  assert.match(CODE, /e\.key === 'Backspace' && nm && !nm\.value[\s\S]{0,260}pd2FillSigDrop\(id\)/, 'Backspace in an empty space');
  assert.match(read('index.html'), /#ig-canvas \.pd2-ps-rm\{/, 'it is dressed');
});

test('f1017 (4) the word is in both books and the Handbook says it', () => {
  const I = read('js/i18n.js');
  assert.equal((I.match(/^\s{4}pd2_ps_rm:/gm) || []).length, 2, 'English and Swedish');
  const H = read('js/handbook.js'); const a = H.indexOf("{ k: '2.3'"), ch = H.slice(a, H.indexOf("{ k: '2.4'"));
  assert.match(ch, /A space you do not need goes with the ×/, 'the chapter says how a space goes');
  assert.match(ch, /the lines follow the signing route/, 'and that the lines follow the route');
});

test('f1017 (5) the names typed on the paper are shown in the route window, saved only by its Save', () => {
  const typed = fn('pd2FillSigTyped');
  assert.doesNotMatch(typed, /saveSignerPlan|persist\(|c\.signerPlan\s*=(?!=)/, 'the reading writes nothing');
  assert.match(fn('pd2FillSave'), /const add = pd2FillSigTyped\(c\)/, 'Save adds the same rows the window is shown');
  const door = stripCom(PD).match(/const typed = \(!inForm[\s\S]{0,200}openSignerPlanEditor\(c, \{ typed, onDone/);
  assert.ok(door, 'the door hands the typed names to the window, only while the paper is being filled');
  const A = stripCom(read('js/approvals.js'));
  const ed = A.slice(A.indexOf('function openSignerPlanEditor('), A.indexOf('function signerRouteWindow('));
  assert.match(ed, /opts\.typed/, 'the window takes them');
  assert.match(ed, /if\(plan\.some\(p=>sameSigner\(p,s\)\)\) return;/, 'never twice');
  assert.match(ed, /if\(!hasUs\) plan\.unshift\(/, 'an empty route still offers our slot when nobody of ours was typed');
  assert.match(ed, /if\(!hasThem\) plan\.push\(/, 'and theirs');
  assert.doesNotMatch(ed, /saveSignerPlan\(/, 'opening saves nothing');
});
