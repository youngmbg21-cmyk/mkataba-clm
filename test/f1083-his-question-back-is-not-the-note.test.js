'use strict';
/* f1083 — HIS QUESTION BACK IS NOT THE NOTE (owner, 16 Nov 2026: "fix the note bug too"). On the Send screen the
   letter's note held Jambo's own question to the sender ("I need you to tell me what the note should say. What message
   do you want to send with this round…"): f1043 takes his written answer as the note when the slot is empty, and took
   it even when the answer was talk ABOUT the note. Now such an answer is never the draft; it is shown as his answer on
   both surfaces (the ✦ window, Home's panel), to be answered. Red at the parent: (1) returned the question. */
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const AI = fs.readFileSync(path.join(__dirname, '..', 'js/ai.js'), 'utf8');
const IG = fs.readFileSync(path.join(__dirname, '..', 'js/views/intelligence.js'), 'utf8');
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j > 0 ? j : undefined); };
function world(){
  const ctx = { AI_EMPTY_ANSWER: 'I couldn\'t finish an answer to that one.' }; ctx.window = ctx; ctx._shNlWrite = 'MK-382'; vm.createContext(ctx);
  vm.runInContext(fnBody(AI, 'aiSendNoteClean') + '\n' + fnBody(AI, 'aiSendNoteAsksBack') + '\n' + fnBody(AI, 'aiSendNoteFrom') + '\nthis.back=aiSendNoteAsksBack; this.from=aiSendNoteFrom;', ctx);
  return ctx;
}
const ASK = 'I need you to tell me what the note should say. What message do you want to send with this round of changes to the other side?';
const NOTE = 'Thank you for accepting our change to Clause 2. We have filed our answers on the rest. Could you confirm by Friday?';

test('f1083 (1) his question about the note is never the draft', () => {
  const w = world();
  assert.equal(w.from({ answer: ASK }), '');
  assert.equal(w.from({ answer: 'Happy to help. Let me know what tone you want and I will draft the note.' }), '');
  assert.equal(w.from({ answer: 'Berätta vad du vill säga till motparten så skriver jag meddelandet åt dig direkt här.' }), '');
});

test('f1083 (2) a real note is still taken, a question to the other side included; a slot note always wins', () => {
  const w = world();
  assert.equal(w.from({ answer: NOTE }), NOTE, 'a note that asks the other side for a reply is a note');
  assert.equal(w.from({ note: NOTE, answer: ASK }), NOTE);
  assert.equal(w.back({ note: NOTE, answer: ASK }), false);
});

test('f1083 (3) both surfaces show his question instead of "no note came back"', () => {
  assert.match(fnBody(AI, 'aiSendNoteSaid'), /if\(!aiSendNoteHtml\.placed&&aiSendNoteAsksBack\(res\)\) return res\.answer;/, 'the ✦ window');
  assert.match(fnBody(IG, 'igNoteOf'), /if\(!words && pressed && S && typeof window\.aiSendNoteAsksBack==='function' && aiSendNoteAsksBack\(res\)\) return null;/, 'Home\'s panel');
  assert.match(AI, /Object\.assign\(window,\{[^}]*\baiSendNoteAsksBack\b/, 'published');
});
