/* ============================================================
   f1177 — an AI provider failure is said as one
   ============================================================
   Bug log: only the graph and chat routes tagged a provider failure
   `kind: 'provider'`; every other AI route answered 502 with no kind, so the
   browser's stand-in (aiFailWhy, triageWhy) read it as "could not be
   reached". Every "Jambo provider error" reply now carries the kind. Red at
   the parent: no kind on the breakdown route, and 22 replies without it.
   ============================================================ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
const SRV = fs.readFileSync(path.join(__dirname, '..', 'server/server.js'), 'utf8');

let h, ai, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });

describe('f1177 — the provider\'s refusal is named as the provider\'s', () => {
  test('(1) the breakdown route says kind: provider', async () => {
    ai.reset(); ai.script(400, 400);
    const r = await W.admin.raw('/api/ai/breakdown', { method: 'POST', body: { text: '1. Term. This agreement runs for one year.' } });
    assert.equal(r.status, 502);
    assert.equal(JSON.parse(r.text).kind, 'provider');
  });
  test('(2) every reply that says "Jambo provider error" to the browser carries the kind', () => {
    const bare = SRV.split('\n').filter(l => /res\.status\(502\)\.json\(\{ error: 'Jambo provider error \(/.test(l) && !/kind: 'provider'/.test(l));
    assert.deepEqual(bare, []);
  });
});
