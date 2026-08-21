/* J9 — POST /api/daily-brief/run and /api/reminders/run must be admin-only. */
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('../../helpers');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  try {
    for (const [label, path] of [['daily-brief', '/api/daily-brief/run'], ['reminders', '/api/reminders/run']]) {
      const asAdmin = await W.admin.raw(path, { method: 'POST', body: {} });
      assert.equal(asAdmin.status, 200, label + ' admin should succeed');
      for (const [who, client] of [['restricted (legal, non-admin)', W.restricted], ['novalues (legal, non-admin)', W.novalues]]) {
        const r = await client.raw(path, { method: 'POST', body: {} });
        assert.equal(r.status, 403, `FAIL: ${label} via ${who} should be 403, got ${r.status}: ${r.text}`);
        console.log(`PASS: ${path} refuses ${who} with 403`);
      }
    }
    console.log('J9-03c ALL PASS');
  } finally { await h.stop(); }
})().catch(e => { console.error('J9-03c FAILED:', e); process.exit(1); });
