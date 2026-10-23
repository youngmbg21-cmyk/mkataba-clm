/* THE METER PRICES A DATED MODEL AS ITS MODEL (owner, 23 Oct 2026: "yes" to fixing it)
   ============================================================
   The fast tier's default model is `claude-haiku-4-5-20251001`; the price table
   names `claude-haiku-4-5`. The lookup was exact-only, so every fast call fell
   through to the 'default' row ($10/$50 per million) and was booked at about
   ten times its price, on the spend page and against the daily cap. Now an exact
   row still wins, else the id without its date (aiRateFor; the browser's
   import estimate, migAiRate, the same). */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

const MIG_SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'migration.js'), 'utf8');
const FAST_MODEL = 'claude-haiku-4-5-20251001';
/* the scripted provider answers every call with 10 tokens in and 5 out */
const HAIKU_CALL = (10 * 1 + 5 * 5) / 1e6;
const DEFAULT_CALL = (10 * 10 + 5 * 50) / 1e6;

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { await h.stop(); await ai.stop(); });

const chatCost = async () => {
  const s = await W.admin.json('/api/ai/spend');
  const row = (s.byFeature || []).find(r => r.feature === 'chat');
  return row ? row.cost : 0;
};
const askFast = async () => {
  ai.reset();
  ai.script([{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer', input: { answer: 'Three.', citations: [] } }]);
  await W.admin.json('/api/ai/chat', { method: 'POST', body: { messages: [{ role: 'user', content: 'how many contracts expire this year' }] } });
  assert.equal(ai.calls[0].body.model, FAST_MODEL, 'the call ran on the fast tier\'s dated id');
};
const near = (a, b) => Math.abs(a - b) < 1e-9;

describe('the spend ledger', () => {
  test('a fast call is booked at the fast model\'s own price, not the unknown-model price', async () => {
    const before = await chatCost();
    await askFast();
    const spent = (await chatCost()) - before;
    assert.ok(near(spent, HAIKU_CALL), `booked ${spent}, the model's price is ${HAIKU_CALL} (the unknown-model price was ${DEFAULT_CALL})`);
  });

  test('an admin\'s row for the exact dated id still wins', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { rates: { [FAST_MODEL]: { in: 2, out: 2 } } } });
    try {
      const before = await chatCost();
      await askFast();
      const spent = (await chatCost()) - before;
      assert.ok(near(spent, (10 * 2 + 5 * 2) / 1e6), `booked ${spent}`);
    } finally {
      await W.admin.json('/api/ai/config', { method: 'PUT', body: { rates: {} } });
    }
  });
});

describe('the import estimate, in the browser', () => {
  test('migAiRate prices a dated id as its model too', () => {
    const a = MIG_SRC.indexOf('function migAiRate('), b = MIG_SRC.indexOf('\n}', a);
    const migAiRate = new Function('state', MIG_SRC.slice(a, b + 2) + ';return migAiRate;');
    const rates = { 'claude-haiku-4-5': { in: 1, out: 5 }, default: { in: 10, out: 50 } };
    const r = migAiRate({ aiCfg: { models: { fast: FAST_MODEL }, rates } })('fast');
    assert.deepEqual(r, { in: 1, out: 5 });
  });
});
