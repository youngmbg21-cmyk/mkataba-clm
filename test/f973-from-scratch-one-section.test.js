'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f973 — FROM SCRATCH: JAMBO WRITES ONE SECTION, ONE CALL (the new look, round 6;
   the owner's pick 1 Nov 2026: "build new agreement" — its From scratch tab, for the
   new-paper grant only)
   (1) An editor asks for one section: one call is made, the wording comes back, the
       heading and the company's standards ride in the prompt, nothing is filed.
   (2) A viewer is refused (the server is the wall), and nothing is spent.
   (3) A sentence and a heading are both required; a refusal spends nothing.
   AT THE PARENT every test here FAILS: the route does not exist.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, w, viewer;
before(async () => {
  h = await startHati();
  w = await seedWorkspace(h);
  await w.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  viewer = h.client('viewer');
  await viewer.json('/api/login', { method: 'POST', body: { email: 'viewer@example.co.ke', password: 'temporary-pass-1' } });
  await viewer.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } });
});
after(async () => { if (h) await h.stop(); });

const BODY = { sentence: 'a two-year supply agreement with Nandi Dairy for raw milk', heading: 'Quality & Rejection',
  intent: 'How goods are checked and what happens to goods that fail.', standards: [{ category: 'Payment terms', rule: 'within 45 days, prefer 30' }] };

describe('f973 one section of a new paper', () => {
  test('1 an editor gets the wording in one call; the heading and the standards are in the prompt; nothing is filed', async () => {
    const cnt = r => (Array.isArray(r) ? r : (r.contracts || r.items || r.list || [])).length;
    const n0 = cnt(await w.admin.json('/api/contracts'));
    h.ai.reset();
    const r = await w.admin.json('/api/ai/section', { method: 'POST', body: BODY });
    assert.ok(String(r.text || '').length > 10, 'wording came back');
    assert.equal(h.ai.calls.length, 1, 'one call');
    const sent = h.ai.lastPayloadText();
    assert.ok(sent.includes('Quality & Rejection'), 'the heading is asked for');
    assert.ok(sent.includes('within 45 days'), 'the company standard rides in');
    assert.ok(/bracketed/i.test(sent), 'a missing fact is left as a blank, never invented');
    const n1 = cnt(await w.admin.json('/api/contracts'));
    assert.equal(n1, n0, 'nothing is filed');
  });
  test('2 a viewer is refused and nothing is spent', async () => {
    h.ai.reset();
    const r = await viewer.raw('/api/ai/section', { method: 'POST', body: BODY });
    assert.equal(r.status, 403);
    assert.equal(h.ai.calls.length, 0);
  });
  test('3 a sentence and a heading are required; a refusal spends nothing', async () => {
    h.ai.reset();
    for (const body of [{ ...BODY, heading: '' }, { ...BODY, sentence: '' }]){
      const r = await w.admin.raw('/api/ai/section', { method: 'POST', body });
      assert.equal(r.status, 400);
    }
    assert.equal(h.ai.calls.length, 0);
  });
});
