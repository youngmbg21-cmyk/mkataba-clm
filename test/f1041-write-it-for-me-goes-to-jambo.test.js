'use strict';
/* f1041 — "WRITE IT FOR ME" GOES TO JAMBO, NEVER THE TYPING READER (owner, 13 Nov 2026, a screenshot: "this
   highlighted is still happening" — the panel said "No note came back… The letter for MK-382, ready to read").
   The press asked through the panel's box as if TYPED, so the free readers read it first: "Write the note to Young
   for this SEND" was taken as the act Send (nav_go_act_send) and answered by opening the send screen — Jambo was
   never asked, and the draft card said no note came back. A press (and every steer chip) is now readied as the ask
   (igAskBrain → _igReadyAsk), which intelAsk sends straight to the chat. At the parent tests 1 and 3 fail; 2 pins the route they rely on. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = R('js/views/intelligence.js'), CORE = R('js/core.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(?:async )?function ' + name + '\\(')); assert.ok(i >= 0, name + ' exists');
  const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j > 0 ? j : undefined); };

describe('f1041 — the press goes straight to Jambo', () => {
  test('4 a draft always comes with HaTi\'s sentence, never the model\'s words about it', () => {
    const ctx = { i18t: k => k, aiSendNoteClean: v => String(v || '').trim(), shareScreenSays: () => ({ contractId: 'MK-382', noteMax: 1000, goes: [] }) };
    ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext(['igNoteClauses', 'igNoteTagOf', 'igNoteSentences', 'igNoteOf'].map(n => fnBody(IG, n)).join('\n'), ctx);
    const n = ctx.igNoteOf({ answer: 'press the button to drop it into the note box.</answer>', note: 'Thanks for accepting our change.' });
    assert.equal(n.say, 'sh_nl_here');
    const I = R('js/i18n.js');
    assert.equal((I.match(/\n    sh_nl_q_with: '\{ask\} /g) || []).length, 2, 'both books');
  });
  test('1 igAskBrain readies the words as the ask before asking, so intelAsk reads them as readied', () => {
    const seen = [];
    const ctx = { intelAsk: (q, o) => seen.push({ q, readied: ctx.ready() === q, typed: !!(o && o.typed) }) };
    vm.createContext(ctx);
    vm.runInContext("let _igReadyAsk=''; function ready(){ return _igReadyAsk; }\n" + fnBody(IG, 'igAskBrain'), ctx);
    assert.equal(ctx.igAskBrain('Write the note to Young for this send, from my answers.'), true);
    assert.deepEqual(JSON.parse(JSON.stringify(seen)), [{ q: 'Write the note to Young for this send, from my answers.', readied: true, typed: true }]);
    assert.equal(ctx.igAskBrain('   '), false, 'nothing asked for no words');
  });
  test('2 readied words go to the chat before every free reader in intelAsk', () => {
    const f = fnBody(IG, 'intelAsk');
    const at = k => { const i = f.indexOf(k); assert.ok(i > 0, k); return i; };
    assert.ok(at('const readied=!!_igReadyAsk && q===_igReadyAsk;') < at('if(readied){'), 'read first');
    assert.match(f.slice(at('if(readied){'), at('if(readied){') + 300), /await intelChatAsk\(q, readyNote\?\{ note:true \}:undefined\);/, 'the brain, nothing else');
    for (const k of ['jamboPageGo(q)', 'igBoardTalkAsk(q)', 'igPageTalkAsk(q)']) assert.match(f, new RegExp('if\\(!readied&&opts&&opts\\.typed&&[^\\n]*' + k.replace(/[()]/g, '\\$&')), k + ' stands down for a readied ask');
  });
  test('3 the letter\'s press and every steer use it', () => {
    const press = CORE.slice(CORE.indexOf("e.target.closest('[data-sh-nl-write]')"), CORE.indexOf("e.target.closest('[data-sh-nl-write]')") + 900);
    assert.match(press, /if\(typeof window\.igAskBrain==='function'\) igAskBrain\(i18t\('sh_nl_write_q', \{ who \}\), \{ note:true \}\);/);
    assert.match(fnBody(IG, 'igNoteAsk'), /return igAskBrain\(i18t\('sh_nl_q_with', \{ ask:words, note:d\.words \}\), \{ note:true \}\);/, 'the steer carries the draft as it stands');
    assert.match(IG, /Object\.assign\(window,\{IG,IG_SUGGESTIONS,[^}]*,igAskBrain\}\)/, 'published for the letter');
  });
});
