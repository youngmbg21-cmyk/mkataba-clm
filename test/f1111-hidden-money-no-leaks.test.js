/* f1111 — HIDDEN MONEY DOES NOT LEAK BY ANOTHER ROAD (owner, 19 Nov 2026: "A and B" — the two real leaks)
   1 · A duty's amount (a payment owed) never reaches a reader without money rights, and their save never wipes it.
   2 · Search never confirms a hidden figure: typing a contract's amount finds nothing for them, in the old search
       and the one search (Jambo's too) — an admin still finds it.
   At the parent the amount is in the raw body and both searches answer, so every claim fails. Raw bodies only. */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

test('f1111 (1) a duty\'s amount stays on the server, and survives their save', async () => {
  const c = await W.admin.json('/api/contracts/MK-B1');
  c.obligations = [{ id: 'ob_pay1', desc: 'First instalment', due: '2027-01-31', status: 'open', party: 'theirs', amount: 4123456 }];
  await W.admin.json('/api/contracts/MK-B1', { method: 'PUT', body: { contract: c, baseVersion: c._v } });

  const r = await W.novalues.raw('/api/contracts/MK-B1');
  assert.equal(r.status, 200);
  assert.ok(!r.text.includes('4123456'), 'the duty\'s amount reached a reader without money rights');
  assert.equal(r.json.obligations[0].desc, 'First instalment', 'the duty itself still comes');
  const list = await W.novalues.raw('/api/contracts?limit=200');
  assert.ok(!list.text.includes('4123456'), 'the list rows carry the amount');

  await W.novalues.json('/api/contracts/MK-B1', { method: 'PUT', body: {
    contract: { ...r.json, obligations: r.json.obligations.map(o => ({ ...o, desc: 'First instalment (invoiced)', amount: 1 })) }, baseVersion: r.json._v } });
  const back = await W.admin.json('/api/contracts/MK-B1');
  assert.equal(back.obligations[0].desc, 'First instalment (invoiced)', 'their edit was saved');
  assert.equal(back.obligations[0].amount, 4123456, 'the amount they could not see stands, neither wiped nor set');
});

test('f1111 (2) typing a contract\'s amount finds nothing for them; an admin still finds it', async () => {
  const ids = j => (j.hits || []).map(x => x.id || x.contractId);
  assert.ok(ids(await W.admin.json('/api/search?q=85000000')).includes('MK-B1'), 'an admin finds a contract by its amount');
  assert.ok(!ids(await W.novalues.json('/api/search?q=85000000')).includes('MK-B1'), 'search confirmed the hidden figure');
  assert.ok(ids(await W.novalues.json('/api/search?q=Naivas')).includes('MK-B1'), 'their search by name still works');

  assert.ok(ids(await W.admin.json('/api/hati-search?q=85000000')).includes('MK-B1'), 'an admin finds it in the one search');
  assert.ok(!ids(await W.novalues.json('/api/hati-search?q=85000000')).includes('MK-B1'), 'the one search confirmed the hidden figure');
  assert.ok(ids(await W.novalues.json('/api/hati-search?q=Naivas')).includes('MK-B1'), 'the one search by name still works');
});
