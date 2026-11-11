'use strict';
/* f1012 — FILL IN ON THE PAPER, THE LEGORA WAY (owner picked "The Legora Way" by name, 11 Nov 2026: "Build fill in on
   the paper the Legora way"; then "Open the paper", "Yes, print them", "Back to the Dossier").

   (1) THE BLACK BUTTON OPENS THE PAPER: the Dossier's [data-pd-ds-fill] goes through pdFillGo, which fills on the
       paper in the new look (pd2FillStart) and keeps the form for a detail with no place there.
   (2) A TEMPLATE'S BLANKS ARE FOUND: the paper's own marks include our template's fields (span.field-frozen
       [data-field]) — before this the mode looked only for an upload's marks and a drafted contract got no boxes.
   (3) ENTER WALKS THE SPACES: Enter moves to the next space still to fill (pd2FillNext over pd2FillWalk); none left
       saves (pd2FillSave) — the last Enter goes back to the Dossier.
   (4) ONE WRITER EACH: blanks through contractBlankSet, signers through saveSignerPlan only (nothing in the block
       assigns c.signerPlan itself); a refused route is said and the filling stays open on the line.
   (5) THE PEOPLE WHO WILL SIGN ARE PRINTED: pagesSignRows fills a line nobody has signed with the route's names,
       `planned` (never a mark); a signed line keeps its signature; no route leaves the lines empty.
   (6) EVERY WORD IN BOTH BOOKS: each key the block says exists in English and Swedish.
   (7) THE MAP KNOWS IT: the flow map's fill step says the paper, the Handbook's chapter says Enter and the signers. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildPortal } = require('./portalworld');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const PD = read('js/paperdesk.js');
/* THE REGION: the fill block, from its head to the read that follows it */
const BLOCK = (() => { const a = PD.indexOf('/* ---- FILL IN ON THE PAPER, THE LEGORA WAY'), b = PD.indexOf('/* ---- THE READ, WATCHED');
  assert.ok(a > 0 && b > a, 'the fill block is found'); return PD.slice(a, b); })();
const CODE = stripCom(BLOCK);

test('f1012 (1) the black button opens the paper; a detail with no place there keeps the form', () => {
  const h = stripCom(PD).match(/const dsf = t\.closest\('\[data-pd-ds-fill\]'\);[\s\S]{0,260}/);
  assert.ok(h, 'the Dossier\'s fill door is found');
  assert.match(h[0], /pdFillGo\(cc\.id, key\)/, 'it goes through pdFillGo');
  assert.doesNotMatch(h[0], /pdFillOpen\(/, 'not straight to the form');
  const go = CODE.match(/function pdFillGo\(id, key\)\{[\s\S]*?\n\}/);
  assert.ok(go, 'pdFillGo is defined in the block');
  assert.match(go[0], /pd2On\(\)[\s\S]*pd2FillStart\(id, key \|\| ''\)/, 'the new look fills on the paper');
  assert.match(go[0], /return pdFillOpen\(id/, 'and falls back to the form');
  assert.match(PD, /Object\.assign\(window, \{[^}]*\bpdFillGo\b/, 'published');
});

test('f1012 (2) a template\'s own blanks are found on the paper', () => {
  const m = CODE.match(/const PD2_BL_SEL = '([^']+)'/);
  assert.ok(m, 'one selector names the marks');
  assert.match(m[1], /span\.field-frozen\[data-field\]/, 'our template\'s fields');
  assert.match(m[1], /\[data-upblank\]/, 'an upload\'s placeholders');
  assert.match(CODE, /cv\.querySelectorAll\(PD2_BL_SEL\)/, 'the paint reads the one selector');
});

test('f1012 (3) Enter walks to the next space; none left saves and goes back', () => {
  const next = CODE.match(/function pd2FillNext\(\)\{[\s\S]*?\n\}/);
  assert.ok(next, 'pd2FillNext');
  assert.match(next[0], /pd2FillDone/, 'skips what is filled');
  assert.match(next[0], /pd2FillSave\(\)/, 'nothing left: save');
  assert.match(CODE, /e\.key === 'Enter'[\s\S]{0,900}pd2FillNext\(\)/, 'Enter moves on');
  const save = CODE.match(/function pd2FillSave\(\)\{[\s\S]*?\n\}/);
  assert.match(save[0], /pd2FillStop\(\)/, 'a save stops the filling (back to the Dossier)');
});

test('f1012 (4) one writer for a blank, one authority for who signs', () => {
  assert.match(CODE, /contractBlankSet\(c, x\.b\.key, x\.v, i === moved\.length - 1 \? \{\} : \{ hold: true \}\)/, 'blanks through their writer, held, the last one saving');
  assert.match(CODE, /why = saveSignerPlan\(c, rows\)/, 'signers through saveSignerPlan');
  assert.doesNotMatch(CODE, /c\.signerPlan\s*=(?!=)/, 'the block never assigns the route itself');
  assert.match(CODE, /if \(why\)\{[\s\S]{0,400}_pd2Fill\.sigWhy = why/, 'a refusal is kept and said');
});

test('f1012 (5) the route\'s names print on the lines nobody has signed', () => {
  const win = buildPortal().win;
  const c = { party: 'Highland', counterparty: 'Juno Limited', signerPlan: [
    { id: 's1', party: 'internal', name: 'Amina Otieno', role: 'Director' },
    { id: 's2', party: 'counterparty', name: 'Wanjiru Otieno', email: 'w@juno.co.ke' }] };
  const rows = win.pagesSignRows(c, []);
  assert.equal(rows.length, 2);
  assert.ok(rows[0] && rows[0].planned && rows[0].name === 'Amina Otieno' && rows[0].title === 'Director', 'ours planned, with title');
  assert.ok(rows[1] && rows[1].planned && rows[1].name === 'Wanjiru Otieno', 'theirs planned');
  const signed = win.pagesSignRows(c, [{ party: 'first', name: 'Amina Otieno', title: 'Director' }]);
  assert.ok(signed[0] && !signed[0].planned, 'a signature wins over the plan');
  assert.ok(signed[1] && signed[1].planned, 'the unsigned line still names its signer');
  assert.equal(JSON.stringify(win.pagesSignRows({ party: 'Highland', counterparty: 'Juno Limited' }, [])), '[null,null]', 'no route, no names');
  /* the painter writes the name under the line and no mark on the rule */
  const d = win.document, host = d.createElement('div');
  host.innerHTML = '<div class="rl-paper-foot"><div class="rl-sigline"><span class="rl-sigrule"></span><span class="rl-sigfor">For Highland</span></div><div class="rl-sigline"><span class="rl-sigrule"></span><span class="rl-sigfor">For Juno</span></div></div>';
  win.pagesSignMarks(host, rows);
  const lines = host.querySelectorAll('.rl-sigline');
  assert.match(lines[0].querySelector('.rl-sigplan').textContent, /Amina Otieno, Director/);
  assert.equal(lines[0].querySelectorAll('.rl-sigmark').length, 0, 'no mark for a planned signer');
  assert.ok(!lines[0].classList.contains('pg-signed'), 'not drawn as signed');
});

test('f1012 (6) every word the block says is in both books', () => {
  const I = read('js/i18n.js');
  const keys = [...new Set([...CODE.matchAll(/_pdTn?\('((?:pd2_fp|pd2_ps|pd2_and)[a-z_]*)'/g)].map(m => m[1]))];
  assert.ok(keys.length >= 25, 'the block says its words through the books: ' + keys.length);
  const missing = [];
  for (const k of keys){
    const plain = new RegExp('^\\s{4}' + k + ':', 'gm'), one = new RegExp('^\\s{4}' + k + '_one:', 'gm');
    const n = (I.match(plain) || []).length || (I.match(one) || []).length;
    if (n < 2) missing.push(k + ' (' + n + ')');
  }
  assert.deepEqual(missing, [], 'in English and Swedish');
});

test('f1012 (7) the flow map and the Handbook say the paper', () => {
  const F = read('js/flowmap.js');
  assert.match(F, /k: 'fill'[^\n]*typed on the paper where they stand/, 'the flow map\'s fill step');
  assert.match(F, /Enter → the next space; the last saves and goes back to the Dossier/);
  const H = read('js/handbook.js'); const a = H.indexOf("{ k: '2.3'"), ch = H.slice(a, H.indexOf("{ k: '2.4'"));
  assert.match(ch, /Enter takes you to the next space/, 'the chapter says Enter');
  assert.match(ch, /signature line/, 'and the signers');
  assert.match(ch, /\{ui:pd2_fp_rest_go\}/, 'and the form for the rest');
});
