/* ============================================================
   F626 — a dead link still says whose it was (overnight run, 8 Oct 2026)
   ============================================================
   The withdrawn / expired page named nobody ("Ask the sender to reshare").
   The 410 now carries the contract's title and the sender's name — and
   nothing else about the deal — and their page prints them under the title. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

describe('f626 — the 410 names the contract and the sender', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });
  test('a withdrawn link answers with the title and the sender, no wording', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', purpose: 'negotiate',
        contract: { id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', redlineText: 'SECRET WORDING' } },
      channel: 'link', recipient: { name: 'Grace', email: 'grace@nandi.example' }, purpose: 'negotiate' } });
    assert.ok(r.token, JSON.stringify(r));
    await W.admin.json('/api/shares/' + r.token + '/revoke', { method: 'POST', body: {} });
    const res = await fetch(h.base + '/api/shares/' + r.token);
    assert.equal(res.status, 410);
    const d = await res.json();
    assert.equal(d.gone, 'revoked');
    assert.equal(d.contractName, 'Raw Milk Collection');
    assert.equal(d.sender, 'Amina Otieno');
    assert.ok(!/SECRET WORDING|Nandi Dairy/.test(JSON.stringify(d)), 'nothing else about the deal');
  });
  test('their page prints them under the title', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/portal.js'), 'utf8');
    assert.match(src, /goneMsg:d&&d\.error, goneWho:d \}\); return 'gone';/);
    assert.match(src, /id="pt-gone-who"/);
  });
});
