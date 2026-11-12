'use strict';
/* f1017 — THE READ PLAYS ON ARRIVAL, AND THE × SITS IN ITS CIRCLE (owner, 12 Nov 2026, over two pictures: "the x sign is
   not in the middle of the shaded area"; "when you upload … it immediately begins to read the contract, the notes should
   also appear as it reads"; picked "Read plays by itself", REVERSING "nothing plays until it is pressed").
   (1) pd2WalkArrive opens the walk AND plays it, asking again (bounded) until the arrived paper is in front;
   (2) Jambo's words no longer tell the reader to press; both books; (3) the round icon buttons centre their icon;
   (4) the Handbook says so. Browser: the-read-bar-and-notes-verify 4 · 5. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const stripCom = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

test('f1017 (1) an arrival plays the read, asked again until the paper is in front', () => {
  const m = stripCom(read('js/paperdesk.js')).match(/function pd2WalkArrive\(id\)\{[\s\S]*?\n  setTimeout\(go, 0\); return true; \}/);
  assert.ok(m, 'pd2WalkArrive is found');
  assert.match(m[0], /pd2WalkOpen\(id\)\)\{ pd2WalkPlay\(\); return; \}/);
  assert.match(m[0], /\+\+n < PD2_WALK_ARRIVE_TRIES\) setTimeout\(go, 150\)/, 'bounded');
  assert.match(m[0], /if \(pd2WalkOn\(id\)\) return;/, 'never twice');
});
test('f1017 (2) Jambo no longer says to press, in both books', () => {
  const I = read('js/i18n.js');
  assert.doesNotMatch(I, /Press Watch the read and I read it/);
  assert.doesNotMatch(I, /Tryck på Se läsningen så läser jag/);
  assert.equal((I.match(/\n\s+pd2_wk_say: /g) || []).length, 2);
});
test('f1017 (3) the round icon buttons centre their icon', () => {
  const H = stripCom(read('index.html'));
  assert.match(H, /\.pd2-wk-x\{flex:none;display:inline-flex;align-items:center;justify-content:center;padding:0;/);
  assert.match(H, /\.sh-to-x\{ flex:none; display:inline-flex; align-items:center; justify-content:center; padding:0;/);
});
test('f1017 (4) the Handbook says the read plays by itself', () => {
  const B = read('js/handbook.js');
  assert.match(B, /The read plays before your eyes, clause by clause/);
  assert.match(B, /Läsningen spelas upp framför dig/);
});
