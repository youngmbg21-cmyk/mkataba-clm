/* f1026 — ROOM FOR THE ANSWER, AND ONE MORE GO WHEN IT RUNS OUT (owner, 12 Nov 2026)
   ============================================================================
   Measured the same day: the stronger model thinks before it answers on some
   asks, unasked, and that thinking is spent from the step's own max_tokens, so
   a clause-editor draft could stop mid-word.
     (1) a step on the deep tier is given more room than a quick one;
     (2) a step the provider cut short is asked ONCE more, with the most room,
         and the whole answer is what the reader gets, with no "cut short";
     (3) cut twice, it stands as a fact (`truncated`) and is not asked a third time;
     (4) the browser-only path does the same.
   Run: node --test test/f1026-room-for-the-answer.test.js */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const WHOLE = [{ type: 'tool_use', id: 'tu_a', name: 'deliver_answer', input: { answer: 'The whole answer.', citations: [] } }];
const CUT = { content: [{ type: 'tool_use', id: 'tu_a', name: 'deliver_answer', input: { answer: 'Half an ans' } }], stopReason: 'max_tokens' };

let ai, h, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });
const ask = q => W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }], context: {} } });
const rooms = () => ai.calls.map(c => c.body.max_tokens);

describe('f1026 room for the answer', () => {
  test('(1) a question of judgement is given more room than a quick one', async () => {
    ai.reset(); ai.script(WHOLE);
    await ask('How many contracts do we have?');
    const quick = rooms()[0];
    ai.reset(); ai.script(WHOLE);
    await ask('Should we accept this liability cap, and what is the risk if we do?');
    const judged = rooms()[0];
    assert.ok(judged > quick, `judged ${judged} > quick ${quick}`);
  });
  test('(2) cut short once: asked once more with the most room, and the whole answer comes back unmarked', async () => {
    ai.reset(); ai.script(CUT); ai.script(WHOLE);
    const r = await ask('How many contracts do we have?');
    assert.equal(r.answer, 'The whole answer.');
    assert.equal(r.truncated, undefined, 'a whole answer carries no cut-short fact');
    assert.ok(!/cut short/i.test(String(r.notice || '')), 'and no cut-short sentence');
    const m = rooms();
    assert.equal(m.length, 2, 'two calls: the cut one and the one more go');
    assert.ok(m[1] > m[0], `the second go has more room (${m[1]} > ${m[0]})`);
  });
  test('(3) cut twice: said as a fact, and not asked a third time', async () => {
    ai.reset(); ai.script(CUT); ai.script(CUT); ai.script(WHOLE);
    const r = await ask('How many contracts do we have?');
    assert.equal(r.truncated, true);
    assert.match(String(r.notice || ''), /cut short/i);
    assert.equal(rooms().length, 2, 'no third call');
  });
  test('(4) both routes go through the one step call; the browser-only path asks once more too', () => {
    const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
    const SRV = strip(fs.readFileSync(path.join(__dirname, '..', 'server/server.js'), 'utf8'));
    assert.equal(SRV.split('await copilotStepCall(async room => await anthropicMessages').length - 1, 2);
    assert.ok(!/max_tokens: 4000, system, tools: copilotToolsFor/.test(SRV), 'no chat step with a fixed room left');
    const AI = strip(fs.readFileSync(path.join(__dirname, '..', 'js/ai.js'), 'utf8'));
    assert.match(AI, /stop_reason==='max_tokens'\)\{ let d2=null; try\{ d2=await call\(working, step===AI_CHAT_STEPS-1, AI_LOCAL_ROOM_AGAIN\)/);
  });
});
