'use strict';
/* f1249 — "WALK ME THROUGH …", "SHOW ME HOW TO …", "GUIDE ME THROUGH …" A TASK IN HaTi OPEN THE GUIDED STEPS (owner,
   27 Nov 2026: "Yes, build both"). Said about something to DO in HaTi, the sentence starts the same walk as Walk me
   through it (teachStepTurn, step 1) — read by the Handbook's own how-to reader; said about one's own contracts
   ("walk me through my renewals") it stays the lesson's (walkAsked). Red at the parent: teachGuideOf did not exist,
   and "walk me through sending a contract" found no chapter. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
global.window = global;
Object.assign(global, require('../js/handbook.js'), require('../js/navmap.js'), require('../js/walkplan.js'));
const T = require('../js/teach.js');

test('f1249 (1) a task in HaTi, said three ways and in Swedish, finds its chapter', () => {
  const want = {
    'walk me through sending a contract': '3.3', 'show me how to send a contract': '3.3', 'guide me through signing': '4.2',
    'walk me through uploading a contract': '2.2', 'Can you walk me through drafting a new agreement?': '2.1',
    'visa mig hur man skickar ett avtal': '3.3', 'guida mig genom att ladda upp ett avtal': '2.2' };
  for (const [q, k] of Object.entries(want)) assert.equal(T.teachGuideOf(q), k, q);
});
test('f1249 (2) one\'s own contracts stay a lesson; a move stays a move; a deal question is not a task', () => {
  for (const q of ['walk me through my renewals', 'guide me through my renewals']){
    assert.equal(T.teachGuideOf(q), null, q); assert.equal(walkAsked(q), true, q + ' is a lesson'); }
  assert.equal(T.teachGuideOf('show me how to get to the calendar'), null);
  assert.equal(T.teachGuideOf('walk me through the liability cap in this contract'), null);
  assert.equal(T.teachGuideOf('how do I send a contract'), null, 'a plain how-to keeps its steps list (teachHowTurn)');
});
test('f1249 (3) the box answers with the walk\'s first step, and every box asks it first', () => {
  const fs = require('node:fs'), src = fs.readFileSync(require('node:path').join(__dirname, '..', 'js/teach.js'), 'utf8');
  const say = src.slice(src.indexOf('function teachSay('), src.indexOf('function teachTakes('));
  assert.match(say, /teachGuideOf\(q\), gw = g \? teachStepTurn\(g, 1\)/);
  assert.ok(say.indexOf('walkAsked') < say.indexOf('teachGuideOf'), 'the lesson is asked first');
  assert.match(src, /function teachTakes\(q\)\{[^\n]*teachGuideOf\(q\)/);
  const t = T.teachStepTurn('3.3', 1);
  assert.ok(t && /data-teach-step="3\.3:1"/.test(t.html), 'step 1 of the chapter');
});
