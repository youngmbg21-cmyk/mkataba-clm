/* f868 — AI FIRST, NEVER A DEAD END (Jambo works like Copilot, stage 3; docs/PLAN-jambo-copilot.md)

   Measured through the server's chat loop with a scripted model, on both
   routes (/api/ai/chat and its stream):
     1 · a reply with no words and no tool is asked once more for its answer
     2 · the last step must deliver; a turn that still has no answer says WHY and
         offers the nearest things the one search found, as doors, and Ask again
     3 · "which did you mean?": the model's 2-4 choices pass the wall, fewer are no question
     4 · the rules, word for word on both hosts
   AT THE PARENT (1)-(3) fail: an empty reply printed "I couldn't finish…", eight
   steps printed "I wasn't able to finish that", and there were no choices.

   Run: node --test test/f868-never-a-dead-end.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace, mentionsFolderB } = require('./helpers');

let h, W, ai;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const look = [{ type: 'tool_use', id: 'tu_s', name: 'search_contracts', input: { query: 'x' } }];
const ask = (client, q) => client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });
/* the stream route's final event */
async function askStream(client, q) {
  const r = await client.raw('/api/ai/chat/stream', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });
  const text = String(r.text || '');
  const m = [...text.matchAll(/event: final\ndata: (.*)\n/g)].pop();
  return m ? JSON.parse(m[1]) : null;
}

describe('f868 (1) an empty reply is asked once more', () => {
  test('no words and no tool → the model is asked to deliver, and its answer is the answer', async () => {
    ai.reset();
    ai.script([{ type: 'text', text: '' }], deliver({ answer: 'KES 48,000,000.', citations: [{ id: 'MK-A1' }] }));
    const r = await ask(W.admin, 'how much is the Kabras deal worth');
    assert.equal(r.answer, 'KES 48,000,000.');
    assert.equal(r.empty, undefined);
    const nudge = JSON.stringify(ai.calls[1].body.messages.slice(-1));
    assert.match(nudge, /Call deliver_answer now/);
  });
});

describe('f868 (2) the last step delivers; no answer says why and offers the way on', () => {
  test('the eighth call must call deliver_answer', async () => {
    ai.reset();
    for (let i = 0; i < 7; i++) ai.script(look);
    ai.script(deliver({ answer: 'done' }));
    await ask(W.admin, 'anything');
    assert.equal(ai.calls.length, 8);
    assert.deepEqual(ai.calls[7].body.tool_choice, { type: 'tool', name: 'deliver_answer' });
    assert.deepEqual(ai.calls[6].body.tool_choice, { type: 'any' }, 'every other step uses some tool');
  });
  test('two empty replies: the reason, choices the one search found (walled for the reader), Ask again', async () => {
    ai.reset();
    ai.script([{ type: 'text', text: '' }], [{ type: 'text', text: '' }]);
    const r = await ask(W.admin, 'keep the terms confidential');
    assert.match(r.answer, /^No answer came back for that one\./);
    assert.equal(r.empty, true);
    assert.equal(r.retry, true);
    assert.ok(r.choices.length >= 1 && r.choices.length <= 4, JSON.stringify(r.choices));
    assert.ok(r.choices.some(c => c.door.contractId === 'MK-A1'), 'the passage that says it');
    assert.doesNotMatch(r.answer, /wasn.t able to finish|couldn.t finish/);
    ai.reset();
    ai.script([{ type: 'text', text: '' }], [{ type: 'text', text: '' }]);
    const s = await ask(W.restricted, 'Naivas listing retail');
    assert.deepEqual(mentionsFolderB(JSON.stringify(s)), [], 'the way on stays inside the reader\'s walls');
  });
  test('the stream says the same', async () => {
    ai.reset();
    ai.script([{ type: 'text', text: '' }], [{ type: 'text', text: '' }]);
    const r = await askStream(W.admin, 'keep the terms confidential');
    assert.ok(r, 'a final event');
    assert.equal(r.retry, true);
    assert.ok(Array.isArray(r.choices) && r.choices.length >= 1);
  });
});

describe('f868 (3) "which did you mean?"', () => {
  test('two to four choices, each a door the reader may stand at', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Which Naivas contract?', choices: [
      { label: 'Modern Trade Listing', door: { kind: 'contract', contractId: 'MK-B1' } },
      { label: 'Retail Supply — Coast', door: { kind: 'contract', contractId: 'MK-B2' } }] }));
    const r = await ask(W.admin, 'the Naivas one');
    assert.deepEqual(r.choices.map(c => c.door.contractId), ['MK-B1', 'MK-B2']);
  });
  test('a choice the reader cannot open is dropped, and one left is no question', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Which one?', choices: [
      { label: 'Refined Sugar Supply', door: { kind: 'contract', contractId: 'MK-A1' } },
      { label: 'Modern Trade Listing', door: { kind: 'contract', contractId: 'MK-B1' } }] }));
    const r = await ask(W.restricted, 'the one');
    assert.equal(r.choices, undefined);
    assert.deepEqual(mentionsFolderB(JSON.stringify(r)), []);
  });
});

describe('f868 (4) the rules, both hosts', () => {
  const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  test('the clarifying rule and the nudge are word for word', () => {
    const srv = R('server/server.js'), web = R('js/ai.js');
    const one = (src, re) => { const m = src.match(re); assert.ok(m, String(re)); return m[1].replace(/\\'/g, "'"); };
    assert.equal(one(web, /const AI_CLARIFY_RULE="([^"]*)";/), one(srv, /const AI_CLARIFY_RULE = '((?:[^'\\]|\\.)*)';/));
    assert.equal(one(web, /const AI_NUDGE='((?:[^'\\]|\\.)*)';/), one(srv, /const COPILOT_NUDGE = '((?:[^'\\]|\\.)*)';/));
  });
  test('the model is told both', async () => {
    ai.reset(); ai.script(deliver({ answer: 'ok' }));
    await ask(W.admin, 'hi');
    const call = ai.calls.find(c => (c.body.tools || []).some(t => t.name === 'deliver_answer'));
    assert.ok(call, ai.calls.map(c => c.url).join(','));
    assert.match(call.body.system.map(b => b.text).join('\n'), /UNSURE WHICH ONE/);
    assert.ok(call.body.tools.find(t => t.name === 'deliver_answer').input_schema.properties.choices);
  });
});

describe('f868 (5) the quote opens its clause; markup typed into an answer is read back', () => {
  test('"where does it say…" with one verified quote opens the passage it stands in', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Article 3.', citations: [{ id: 'MK-A1', quote: 'Each party shall keep the terms of this agreement confidential.' }] }));
    const r = await ask(W.admin, 'where does the sugar deal say the terms are secret');
    assert.equal(r.goto && r.goto.door.kind, 'clause');
    assert.equal(r.goto.door.contractId, 'MK-A1');
    assert.match(r.goto.door.head, /Confidentiality/);
  });
  test('a plain question is answered where it was asked; a quote that is not in the contract opens nothing', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Thirty days.', citations: [{ id: 'MK-A1', quote: 'The total contract value is KES 48,000,000 payable within thirty days.' }] }));
    assert.equal((await ask(W.admin, 'how fast do we pay Kabras')).goto, null);
    ai.reset();
    ai.script(deliver({ answer: 'There.', citations: [{ id: 'MK-A1', quote: 'Words this contract never had in it at all, anywhere.' }] }));
    assert.equal((await ask(W.admin, 'show me the bit about penalties')).goto, null);
  });
  test('fields typed as text inside the answer are read back into their places', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'In Article 1 of MK-A1.",\n<parameter name="citations">[{"id":"MK-A1"}]</parameter>' }));
    const r = await ask(W.admin, 'what are the payment terms of MK-A1');
    assert.equal(r.answer, 'In Article 1 of MK-A1.');
    assert.deepEqual(r.cards.map(c => c.id), ['MK-A1']);
  });
});
