/* ============================================================
   f1173 — Settings' Jambo reads the levels in plain words
   ============================================================
   Bug log, 20 Nov 2026: Jambo called an Editor "legal (viewer) permissions —
   cannot edit". The chat was given plain levels in Round A (whoAsksSays); the
   Settings "why" route (POST /api/ai/settings-why) still handed him the raw
   role code for every person and for the asker. Red at the parent: the prompt
   read "(legal)".
   ============================================================ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');

let h, ai, W;
before(async () => { ai = await startScriptedAi(); h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' }); W = await seedWorkspace(h); });
after(async () => { await h.stop(); await ai.stop(); });
const promptOf = c => String((((c.body || {}).messages || [])[0] || {}).content || '');

describe('f1173 — the levels are Admin, Editor or Viewer, never the code', () => {
  test('(1) the people list and the asker carry the plain level and what it allows', async () => {
    ai.reset(); ai.script([{ type: 'tool_use', id: 'tu_a', name: 'answer', input: { say: 'ok' } }]);
    await W.admin.json('/api/ai/settings-why', { method: 'POST', body: { q: 'What can Restricted Legal do?' } });
    const p = promptOf(ai.calls.slice(-1)[0]);
    assert.doesNotMatch(p, /\((legal|viewer|admin)\)/, 'no raw role code in brackets');
    assert.match(p, /Restricted Legal \(Editor: may edit/);
    assert.match(p, /\(Admin\)\. When you describe anyone's access, use only the words Admin, Editor or Viewer/);
  });
});
