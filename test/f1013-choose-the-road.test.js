'use strict';
/* f1013 — CHOOSE THE ROAD (owner picked "The Legora Way" by name, 11 Nov 2026: "Build The Legora Way"; drawn for their
   paper, our paper, and our paper with notes).

   (1) WHEN IT STANDS: the road card only once nothing is left to fill, nothing has gone to them (pdNeverShared), no
       change waits to go and no ask of theirs waits; never a viewer's, a signed, declined, executed or signed-outside one.
   (2) THE RULE IS ONE: anything open on the paper (riskOpenOf) makes fixing it the recommended road (the one black
       button: Negotiate on their paper, Redline it on ours); nothing open, sending is.
   (3) ITS DOORS ARE THE ONES THERE: Negotiate and Redline it land on the Redlines face's risks (data-pd-gl-risks), a
       send opens the one Send screen with what they can do chosen (openShareModal, purpose sign or negotiate);
       the card stores nothing and sends nothing.
   (4) THE CARD READS IT FIRST: pd2CardHtml asks pd2RoadOf before its own next step.
   (5) EVERY WORD IN BOTH BOOKS.
   (6) THE MAP KNOWS IT: the flow map and the Handbook name the road. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const PD = read('js/paperdesk.js');
const BLOCK = (() => { const a = PD.indexOf('/* ---- CHOOSE THE ROAD'), b = PD.indexOf('function pd2CardHtml(c, D){');
  assert.ok(a > 0 && b > a, 'the road block stands before the card'); return PD.slice(a, b); })();
const CODE = stripCom(BLOCK);
const fn = name => { const m = CODE.match(new RegExp('function ' + name + '\\([^)]*\\)\\{[\\s\\S]*?\\n\\}')); assert.ok(m, name + ' is defined'); return m[0]; };

test('f1013 (1) the road stands only once filled in and before anything has gone', () => {
  const of = fn('pd2RoadOf');
  assert.match(of, /canEdit\(\)/, 'a viewer gets no road');
  assert.match(of, /'Signed'[\s\S]*'Declined'/, 'nor a signed or declined one');
  assert.match(of, /negoExecuted\(c\)/, 'nor an executed one');
  assert.match(of, /signRouteOf\(c\) === 'outside'/, 'nor one signed outside');
  assert.match(of, /if \(!pdNeverShared\(c\)\) return null;/, 'nothing has gone to them');
  assert.match(of, /x\.k === 'fill'[\s\S]*if \(fill && fill\.n\) return null;/, 'nothing left to fill');
  assert.match(of, /r\.kind === 'share' \|\| r\.kind === 'ask' \|\| r\.kind === 'signer'/, 'no change waiting, no ask of theirs, someone named to sign');
});

test('f1013 (2) one rule: something open makes fixing it the black button, nothing open makes sending it', () => {
  const h = fn('pd2RoadHtml');
  assert.match(h, /R\.paper === 'theirs'/, 'their paper has its own two rows');
  assert.match(h, /n \? black\('data-pd-gl-risks', _pdT\('pd2_rd_nego_go'\)\)/, 'their paper with risks: Negotiate is black');
  assert.match(h, /n \? link\('data-pd2-road="sign"', _pdT\('pd2_rd_asis_go'\)\) : black\('data-pd2-road="sign"'/, 'nothing open: Send as it is is black');
  assert.match(h, /row\('fix', _pdT\('pd2_rd_fix'\)[\s\S]*black\('data-pd-gl-risks', _pdT\('pd2_rd_fix_go'\)\)/, 'our paper with notes: Redline it first is black');
  assert.match(h, /black\('data-pd2-road="markup"', _pdT\('pd2_rd_markup_go'/, 'our clean paper: their mark-up is black');
  assert.equal((h.match(/black\('/g) || []).length, 4, 'four places draw the black button: their paper either way, our paper with notes, our clean paper');
  assert.match(h, /PD2_RD_QUOTES/, 'the open notes are quoted, the rest counted');
  assert.match(h, /pd2_rd_more/, 'a "+ N more" link for the rest (a cap is a fact)');
  assert.match(fn('pd2RoadPaper'), /c\.upload \|\| c\.source === 'upload'/, 'their paper is the one that came as a file');
});

test('f1013 (3) the presses end in doors that are there; the card stores and sends nothing', () => {
  const go = fn('pd2RoadGo');
  assert.match(go, /k === 'nego'\) return pdRedOpen\(c\.id\)/, 'Negotiate with nothing open: the Redlines face');
  assert.match(go, /k === 'sign' \? 'sign' : k === 'markup' \? 'negotiate'/, 'a send chooses what they can do');
  assert.match(go, /openShareModal\(c, \{ purpose \}\)/, 'through the one Send screen');
  assert.doesNotMatch(CODE, /persist\(|\.push\(\{[^}]*changes|negoFileChange|api\(/, 'nothing written, nothing sent');
  assert.match(stripCom(PD), /const rdg = t\.closest\('\[data-pd2-road\]'\);[\s\S]{0,200}pd2RoadGo\(/, 'the panel wires a road\'s press to it');
  assert.match(stripCom(PD), /t\.closest\('\[data-pd-gl-risks\]'\)[\s\S]{0,200}landOn\('#ig-dock #rl-risks'/, 'the risks door lands on the Redlines face\'s list');
});

test('f1013 (4) the card asks for the road before its own next step', () => {
  const m = stripCom(PD).match(/function pd2CardHtml\(c, D\)\{[\s\S]{0,400}/);
  assert.ok(m);
  assert.match(m[0], /const RD = pd2RoadOf\(c, D\);\s*if \(RD\) return pd2RoadCardHtml\(c, D, RD\);/);
  assert.match(PD, /Object\.assign\(window, \{[^}]*\bpd2RoadOf\b[^}]*\bpd2RoadGo\b/, 'published');
});

test('f1013 (5) every word the road says is in both books', () => {
  const I = read('js/i18n.js');
  const keys = [...new Set((BLOCK + PD.slice(PD.indexOf('function pd2RoadCardHtml'), PD.indexOf('function pd2CardHtml(c, D){'))).match(/'pd2_rd_[a-z_]+'/g).map(k => k.slice(1, -1)))];
  assert.ok(keys.length >= 15, 'the words are found');
  for (const k of keys){
    const plural = !new RegExp('\\b' + k + ':').test(I);
    const names = plural ? [k + '_one', k + '_other'] : [k];
    for (const n of names) assert.equal((I.match(new RegExp('\\n\\s+' + n + ':', 'g')) || []).length, 2, n + ' in English and Swedish');
  }
});

test('f1013 (6) the flow map and the Handbook name the road', () => {
  assert.match(read('js/flowmap.js'), /Choose the road/, 'the flow map');
  assert.match(read('js/handbook.js'), /Choose the road/, 'the Handbook');
});
