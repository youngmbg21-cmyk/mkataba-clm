'use strict';
/* f1042 — A NOTE ASKED FOR IS A NOTE SENT (owner, 13 Nov 2026, a screenshot: "still not fixed" — "Write the note for
   this send again, asking them to reply" reached Jambo, who answered without the note, so the card said "No note came
   back this time"). A press on the send screen (Write it for me, every steer) marks its ask (`noteAsk`); an answer
   without a note is asked ONCE more for it, on the server's two chat loops and the browser-only path alike.
   At the parent every test fails: there is no noteAsk, no nudge. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const SRV = R('server/server.js'), AI = R('js/ai.js'), IG = R('js/views/intelligence.js'), CORE = R('js/core.js');
const strOf = (src, name) => { const m = new RegExp('const ' + name + ' *= *("(?:[^"\\\\]|\\\\.)*");').exec(src); assert.ok(m, name); return JSON.parse(m[1]); };

describe('f1042 — a note asked for is a note sent', () => {
  test('1 the server asks once more when a note ask comes back with no note', () => {
    const ctx = {}; vm.createContext(ctx);
    const i = SRV.indexOf('const copilotNoteMissing'); assert.ok(i > 0, 'copilotNoteMissing exists');
    vm.runInContext(SRV.slice(i, SRV.indexOf('\n', i)) + '\nthis.f = copilotNoteMissing;', ctx);
    assert.equal(ctx.f({ noteAsk: true }, ''), true, 'no note → asked again');
    assert.equal(ctx.f({ noteAsk: true }, 'Thanks for your answers.'), false, 'a note → stands');
    assert.equal(ctx.f({}, ''), false, 'an ordinary question is never nudged for a note');
    /* both chat loops (the plain one and the streamed one) ask, each in all three of its answer shapes */
    assert.equal((SRV.match(/askedNote = false;/g) || []).length, 2);
    assert.equal((SRV.match(/copilotNoteMissing\(context, said\.note\)/g) || []).length, 2, 'the deliver_answer call');
    assert.equal((SRV.match(/copilotNoteMissing\(context, w\.note\)/g) || []).length, 2, 'a call typed as text');
    assert.equal((SRV.match(/copilotNoteMissing\(context, ''\)/g) || []).length, 2, 'plain words');
  });
  test('2 the browser-only path asks once more with the same words', () => {
    assert.equal(strOf(AI, 'AI_NOTE_NUDGE'), strOf(SRV, 'COPILOT_NOTE_NUDGE'));
    const f = AI.slice(AI.indexOf('async function aiLocalClaude'), AI.indexOf('\nasync function ', AI.indexOf('async function aiLocalClaude') + 10));
    assert.match(f, /askedNote=false/);
    assert.equal((f.match(/context\.noteAsk===true/g) || []).length, 2, 'plain words and the deliver call');
  });
  test('3 Write it for me and every steer mark the ask as a note, and only on the send screen', () => {
    assert.match(CORE, /igAskBrain\(i18t\('sh_nl_write_q', \{ who \}\), \{ note:true \}\)/);
    assert.match(IG, /igAskBrain\(i18t\('sh_nl_q_with', \{ ask:words, note:d\.words \}\), \{ note:true \}\)/);
    assert.match(IG, /intelChatAsk\(q, readyNote\?\{ note:true \}:undefined\)/);
    assert.match(IG, /if\(opts&&opts\.note&&ctx&&ctx\.page&&ctx\.page\.sending\) ctx\.noteAsk=true;/);
  });
});
