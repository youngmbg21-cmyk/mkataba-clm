/* f668 — THE COMPANY VIEW IN TWO STEPS (owner, 13 Oct 2026: "the loading is
   taking too long and ruining the user experience"; picked "Two steps")

   1. Opening Clauses asks Jambo only for the LIST — the sections and, per
      point, its title, severity, section, one line and its key words — on the
      FAST model, with a small answer allowance. None of the deep dive's
      sections is asked for there.
   2. A point's deep dive is its own small read, POST /api/ai/breakdown/point,
      on the press of Deep dive: it names the one point, and answers only the
      dive's sections.

   Read off what the stand-in RECEIVED — the only honest record of what the
   model was asked. Run: node --test test/f668-the-company-view-in-two-steps.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace, FIXTURES } = require('./helpers');

const TEXT = '1. Term. This agreement runs for two years. '.repeat(8)
  + '2. Liability. Liability is capped at the fees paid in the last three months. '.repeat(6);

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h, { contracts: FIXTURES });
});
after(async () => { await h.stop(); await ai.stop(); });

describe('f668 (1) — the list read is quick', () => {
  test('it asks the fast model for the list only, with a small allowance', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu', name: 'break_down', input: {
      regions: [{ name: 'Risk', status: 'need', items: [{ ref: '2' }] }],
      points: [{ clause: '2', region: 1, status: 'need', title: 'Their liability is capped at three months', stake: 'A failure could cost us far more than the cap.',
        quote: 'Liability is capped at the fees paid in the last three months.' }] } }]);
    const r = await W.admin.json('/api/ai/breakdown', { method: 'POST', body: { text: TEXT } });
    assert.equal(r.regions.length, 1, 'the sections come back');
    assert.equal(r.points.length, 1, 'and the point');
    assert.equal(r.points[0].stake, 'A failure could cost us far more than the cap.');
    const sent = ai.calls[ai.calls.length - 1].body;
    const tool = (sent.tools || []).find(t => t.name === 'break_down');
    const pt = tool.input_schema.properties.points.items.properties;
    for (const gone of ['what', 'theirs', 'usual', 'figure', 'how', 'push', 'edge', 'trade', 'ask'])
      assert.ok(!(gone in pt), `the list does not ask for the dive's "${gone}"`);
    const rg = tool.input_schema.properties.regions.items.properties;
    for (const gone of ['sentence', 'meaning', 'fix', 'quotes'])
      assert.ok(!(gone in rg), `nor for a section's "${gone}"`);
    assert.ok(sent.max_tokens <= 6000, 'a small answer allowance, not ' + sent.max_tokens);
    assert.ok(/haiku/i.test(sent.model), 'the fast model, not ' + sent.model);
  });
});

describe('f668 (2) — a point\'s deep dive is its own read', () => {
  test('it names the one point and answers only the dive', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu', name: 'dive_point', input: {
      what: 'A single failure could cost us far more than the cap.', theirs: 'Three months of fees.', usual: 'Twelve months of fees.',
      figure: '', how: 'No figure in the wording.', push: 'They will say the fees are small.', edge: ['Ask for a mutual cap.'],
      trade: [{ give: 'Accept twelve months', get: 'Data breach outside the cap' }], ask: 'Liability shall not exceed twelve months of fees.' } }]);
    const r = await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT,
      point: { title: 'Their liability is capped at three months', clause: '2', stake: 'A failure could cost us far more than the cap.', quote: 'Liability is capped' } } });
    assert.equal(r.usual, 'Twelve months of fees.');
    assert.deepEqual(r.edge, ['Ask for a mutual cap.']);
    assert.equal(r.trade.length, 1);
    const sent = ai.calls[ai.calls.length - 1].body;
    const prompt = JSON.stringify(sent.messages);
    assert.match(prompt, /POINT: Their liability is capped at three months/, 'the one point is named');
    assert.match(prompt, /CLAUSE: 2/);
    assert.ok(sent.max_tokens <= 2000, 'a small answer allowance');
  });
  test('a press without a point is refused, and spends nothing', async () => {
    ai.reset();
    const r = await W.admin.json('/api/ai/breakdown/point', { method: 'POST', body: { text: TEXT } }).catch(e => e);
    assert.equal(ai.calls.length, 0, 'nothing was asked of the model');
    assert.ok(r && (r.error || r.status === 400 || /point is required/.test(String(r.message || ''))), 'refused: ' + JSON.stringify(r));
  });
});
