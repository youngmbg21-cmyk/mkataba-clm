/* A QUESTION OF JUDGEMENT IS WEIGHED BY THE STRONGER MODEL, AND SAYS WHAT IT COST
   (owner, 23 Oct 2026: "yes" to moving Jambo's judgement questions to the
   stronger model, the cost shown)
   ============================================================
   The chat ran every question on the fast tier and stepped up only after
   compare_contracts. Now a question asking for advice, risk, meaning, drafting
   or a comparison runs on the deep tier from its first step
   (copilotNeedsJudgement, read WITHOUT AI); finding, counting and opening stay
   fast. The answer carries `deep` — the turn's own booked dollars to an admin
   only — and the browser draws one quiet line under it (aiDeepLineHtml).
   Where one model is pinned for both tiers there is no step up and no line. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const SERVER_SRC = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const AI_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
const IG_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intelligence.js'), 'utf8');
const I18N_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'i18n.js'), 'utf8');
const FAST_MODEL = 'claude-haiku-4-5-20251001';
const DEEP_MODEL = 'claude-sonnet-5';

/* the reader itself, lifted out of the server as written */
const needsJudgement = (() => {
  const a = SERVER_SRC.indexOf('const COPILOT_JUDGE_RE'), b = SERVER_SRC.indexOf('/* the step up is real');
  assert.ok(a > 0 && b > a, 'the judgement reader is in the server');
  return new Function(SERVER_SRC.slice(a, b) + ';return copilotNeedsJudgement;')();
})();

describe('the reader: judgement steps up, a lookup stays fast', () => {
  const DEEP = ['is this indemnity fair to us?', 'what happens if they terminate early?', 'should we sign MK-12?',
    'explain clause 7 of MK-3', 'compare MK-1 and MK-2', 'what are the risks in MK-3', 'draft a counter to their liability cap',
    'is the limitation of liability reasonable', 'why is MK-4 late', 'what does force majeure mean here',
    'vad betyder klausul 4', 'borde vi skriva på', 'vilka risker finns i MK-3', 'förklara ansvarsbegränsningen'];
  const FAST = ['who is the counterparty on MK-2', 'show me my drafts', 'how many contracts expire this year', 'open MK-2',
    'list contracts with Acme', 'when does MK-5 expire', 'what is the value of MK-1', 'which contracts are missing a signer',
    'vilka avtal löper ut i år', 'öppna MK-2'];
  for (const q of DEEP) test(`deep: "${q}"`, () => assert.equal(needsJudgement(q), true));
  for (const q of FAST) test(`fast: "${q}"`, () => assert.equal(needsJudgement(q), false));
});

const deliver = input => [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input }];
const toolCall = (name, input) => [{ type: 'tool_use', id: 'tu_t', name, input }];

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const ask = (client, q) => client.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });
const askStream = (client, q) => client.raw('/api/ai/chat/stream', { method: 'POST', body: { messages: [{ role: 'user', content: q }] } });
const finalOf = text => {
  for (const frame of String(text).split('\n\n')) {
    if (!/^event: final$/m.test(frame)) continue;
    const line = frame.split('\n').find(l => l.startsWith('data:'));
    return JSON.parse(line.slice(5).trim());
  }
  return null;
};

describe('the chat routes', () => {
  test('a judgement question runs deep from its first step, and an admin is told what it cost', async () => {
    ai.reset();
    ai.script(toolCall('get_contract', { id: 'MK-A1' }), deliver({ answer: 'It leans their way.', citations: [{ id: 'MK-A1' }] }));
    const r = await ask(W.admin, 'is the liability cap in MK-A1 fair to us?');
    assert.equal(ai.calls[0].body.model, DEEP_MODEL, 'the first step is already the stronger model');
    assert.equal(ai.calls[1].body.model, DEEP_MODEL);
    assert.ok(r.deep, 'the answer says the stronger model weighed it');
    assert.equal(r.deep.model, DEEP_MODEL);
    assert.equal(typeof r.deep.cost, 'number', 'an admin sees the dollars');
    assert.ok(r.deep.cost > 0, 'the turn\'s own booked spend, not a guess');
  });

  test('a person who is not an admin is told it was weighed, never the dollars', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Yes, within range.', citations: [] }));
    const r = await ask(W.unrestricted, 'should we accept their payment terms?');
    assert.equal(ai.calls[0].body.model, DEEP_MODEL);
    assert.ok(r.deep);
    assert.equal('cost' in r.deep, false, 'money is the company\'s: the cost goes to admins only');
  });

  test('a lookup stays on the fast model and carries no line', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'Three.', citations: [] }));
    const r = await ask(W.admin, 'how many contracts expire this year');
    assert.equal(ai.calls[0].body.model, FAST_MODEL);
    assert.equal(r.deep, undefined);
  });

  test('the stream route weighs a judgement question the same way', async () => {
    ai.reset();
    ai.script(deliver({ answer: 'It means an event beyond control.', citations: [] }));
    const res = await askStream(W.admin, 'what does force majeure mean in MK-A1?');
    const fin = finalOf(res.text);
    assert.equal(ai.calls[0].body.model, DEEP_MODEL);
    assert.ok(fin && fin.deep && typeof fin.deep.cost === 'number');
  });

  test('one model pinned for both tiers: nothing stronger to step up to, nothing said', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { model: 'claude-sonnet-5' } });
    try {
      ai.reset();
      ai.script(deliver({ answer: 'Fair enough.', citations: [] }));
      const r = await ask(W.admin, 'is the indemnity fair?');
      assert.equal(r.deep, undefined, 'no "stronger model" line where both tiers are the same model');
    } finally {
      await W.admin.json('/api/ai/config', { method: 'PUT', body: { model: '' } });
    }
  });
});

describe('the line under the answer, one builder', () => {
  test('aiDeepLineHtml is published and drawn by both chat renderers', () => {
    assert.match(AI_SRC, /function aiDeepLineHtml\(res\)/);
    assert.match(AI_SRC, /aiRenderServerAnswer,aiDeepLineHtml,/, 'published');
    const render = AI_SRC.slice(AI_SRC.indexOf('function aiRenderServerAnswer('), AI_SRC.indexOf('function aiRenderServerAnswer(') + 900);
    assert.match(render, /aiDeepLineHtml\(res\)/, 'the side panel and the window draw it');
    const push = IG_SRC.slice(IG_SRC.indexOf('function intelPushChatResult('), IG_SRC.indexOf('function intelPushChatResult(') + 800);
    assert.match(push, /aiDeepLineHtml\(res\)/, 'Home\'s panel draws it');
  });
  test('both books carry its words', () => {
    assert.equal((I18N_SRC.match(/ai_deep_line: '/g) || []).length, 2);
    assert.equal((I18N_SRC.match(/ai_deep_line_cost: '[^']*\{cost\}/g) || []).length, 2);
  });
});
