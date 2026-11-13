'use strict';
/* f1043 — HIS WORDS ARE THE NOTE WHEN THE SLOT IS EMPTY (owner, 13 Nov 2026: "why is it if i ask jambo the AI works
   but in write me it is a hard time? this should be a simple fix"). After a press on the send screen, a reply whose
   note slot is empty but whose answer is written is taken as the draft — both hosts of the answer (Home's panel,
   the ✦ window) read it through ONE helper, aiSendNoteFrom. At the parent every test fails: the helper is absent. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AI = R('js/ai.js'), IG = R('js/views/intelligence.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j > 0 ? j : undefined); };

function world(pressed){
  const ctx = { AI_EMPTY_ANSWER: 'I couldn\'t finish an answer to that one.' };
  ctx.window = ctx; ctx._shNlWrite = pressed ? 'MK-382' : null; vm.createContext(ctx);
  vm.runInContext(fnBody(AI, 'aiSendNoteClean') + '\n' + fnBody(AI, 'aiSendNoteFrom'), ctx);
  return ctx;
}
const NOTE = 'Thank you for accepting our change to Clause 2. We have filed our answers on the rest and would be grateful for your reply by Friday.';

describe('f1043 — his words are the note when the slot is empty', () => {
  test('1 a note in its slot always wins', () => {
    assert.equal(world(true).aiSendNoteFrom({ note: NOTE, answer: 'Here it is.' }), NOTE);
  });
  test('2 after a press, a written answer with an empty slot is the note, its lead-in and markup taken off', () => {
    const w = world(true);
    assert.equal(w.aiSendNoteFrom({ note: '', answer: 'Here is a version asking them to reply:\n\n' + NOTE }), NOTE);
    assert.equal(w.aiSendNoteFrom({ answer: '<p>"' + NOTE + '"</p></answer>' }), NOTE);
    assert.equal(w.aiSendNoteFrom({ answer: '**' + NOTE + '**' }), NOTE);
  });
  test('3 never on an ordinary question, a failed answer or a few words', () => {
    assert.equal(world(false).aiSendNoteFrom({ answer: NOTE }), '', 'no press, no note');
    const w = world(true);
    assert.equal(w.aiSendNoteFrom({ answer: w.AI_EMPTY_ANSWER }), '');
    assert.equal(w.aiSendNoteFrom({ answer: NOTE, empty: true }), '');
    assert.equal(w.aiSendNoteFrom({ answer: NOTE, unfinished: true }), '');
    assert.equal(w.aiSendNoteFrom({ answer: 'Done.' }), '');
  });
  test('4 both hosts read the note through the one helper', () => {
    assert.match(AI, /extra\+=aiSendNoteHtml\(aiSendNoteFrom\(res\)\);/, 'the ✦ window');
    assert.match(fnBody(IG, 'igNoteOf'), /aiSendNoteFrom\(res\)/, 'Home\'s panel');
    assert.match(AI, /Object\.assign\(window,\{[^}]*\baiSendNoteFrom\b/, 'published');
  });
});
