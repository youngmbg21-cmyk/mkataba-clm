/* F2 — can_view_values is enforced by the server.
   Again: every assertion is on a RAW response body or the RAW payload sent to
   the AI provider. The distinctive amounts in the fixtures (48000000 etc.) are
   searched for as bare substrings, so a value leaking through any field —
   c.value, c.fields.value, c.metadata.value, an aggregate — fails the test. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

/* Every monetary figure in the fixture set, as it would appear in JSON or CSV. */
const AMOUNTS = ['48000000', '36000000', '85000000', '78000000'];
const leaks = text => AMOUNTS.filter(a => String(text || '').includes(a));

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('F2 — a no-values user receives no monetary amounts', () => {

  test('the permission is reported on the user record', async () => {
    const b = await W.novalues.json('/api/bootstrap');
    assert.equal(b.me.canViewValues, false);
    assert.equal((await W.admin.json('/api/bootstrap')).me.canViewValues, true);
    assert.equal((await W.unrestricted.json('/api/bootstrap')).me.canViewValues, true,
      'the default for an existing member must be true — this deploy changes nothing until an admin acts');
  });

  test('contract list rows carry no amounts (raw body)', async () => {
    const r = await W.novalues.raw('/api/contracts?limit=200');
    assert.equal(r.status, 200);
    assert.equal(r.json.total, 4, 'folder scope is unaffected — this user sees every folder');
    assert.deepEqual(leaks(r.text), [], 'an amount survived in the raw list body');
    for (const c of r.json.rows) {
      assert.equal(c.value, undefined);
      assert.equal(c.valueType, undefined);
      assert.equal((c.fields || {}).value, undefined, 'a money-mapped template blank leaked');
      assert.equal((c.metadata || {}).value, undefined, 'extracted metadata leaked the value');
    }
  });

  test('a full single-contract GET carries no amounts (raw body)', async () => {
    const r = await W.novalues.raw('/api/contracts/MK-B1');
    assert.equal(r.status, 200);
    assert.equal(r.json.id, 'MK-B1');
    assert.deepEqual(leaks(r.text), []);
    assert.equal(r.json._valuesHidden, true, 'the client needs to know the record is masked');
  });

  test('search results carry no amounts', async () => {
    const r = await W.novalues.raw('/api/search?q=Naivas');
    assert.equal(r.status, 200);
    assert.ok(r.json.hits.length >= 1, 'search itself still works');
    assert.deepEqual(leaks(r.text), []);
  });

  test('stats returns no monetary aggregate', async () => {
    const r = await W.novalues.raw('/api/stats');
    assert.equal(r.status, 200);
    assert.equal(r.json.total, 4, 'the counts are still there');
    assert.equal(r.json.totalValue, undefined, 'the portfolio total must not be sent');
    assert.equal(r.json.valuesHidden, true);
    for (const f of r.json.byFolder) assert.equal(f.val, undefined, 'a per-folder total leaked');
    assert.deepEqual(leaks(r.text), []);
  });

  test('analytics returns no monetary aggregate, but keeps the counts', async () => {
    const r = await W.novalues.raw('/api/analytics');
    assert.equal(r.status, 200);
    assert.equal(r.json.pipeline, undefined, 'the renewal pipeline must not carry amounts');
    assert.ok(r.json.pipelineCount && Object.keys(r.json.pipelineCount).length >= 1,
      'the pipeline should still say HOW MANY contracts expire when');
    for (const row of [...r.json.byStatus, ...r.json.byFolder, ...r.json.byParty])
      assert.equal(row.val, undefined);
    assert.deepEqual(leaks(r.text), []);
  });

  test('CSV export emits the Value column empty, not missing', async () => {
    const r = await W.novalues.raw('/api/export/contracts.csv');
    assert.equal(r.status, 200);
    assert.deepEqual(leaks(r.text), [], 'an amount appeared in the CSV');
    const lines = r.text.trim().split('\n');
    assert.equal(lines.length, 5, 'header + 4 rows — the rows are still there');
    assert.ok(lines[0].includes('Value (KES)'), 'the column header stays so column positions do not shift');
    for (const line of lines.slice(1)) {
      const cells = line.split('","');
      assert.equal(cells[4], '', 'the value cell should be empty');
    }
  });

  test('the workspace-wide activity feed carries no amounts', async () => {
    const r = await W.novalues.raw('/api/activity');
    assert.deepEqual(leaks(r.text), []);
  });
});

describe('F2 — an admin sees values everywhere, unchanged', () => {
  test('every route still carries the amounts for an admin', async () => {
    const list = await W.admin.raw('/api/contracts?limit=200');
    assert.equal(list.json.rows.find(c => c.id === 'MK-B1').value, 85000000);
    const one = await W.admin.json('/api/contracts/MK-B1');
    assert.equal(one.value, 85000000);
    assert.equal(one.fields.value, '85000000');
    assert.equal(one.metadata.value, 85000000);
    assert.equal(one._valuesHidden, undefined);
    const stats = await W.admin.json('/api/stats');
    assert.equal(stats.totalValue, 48000000 + 36000000 + 85000000 + 78000000);
    const an = await W.admin.json('/api/analytics');
    assert.ok(Object.values(an.pipeline).some(v => v > 0));
    const csv = await W.admin.raw('/api/export/contracts.csv');
    assert.ok(csv.text.includes('85000000'));
  });

  test('an unrestricted legal user with the right still sees values (no regression)', async () => {
    const one = await W.unrestricted.json('/api/contracts/MK-B1');
    assert.equal(one.value, 85000000);
  });
});

describe('F2 — AI prompt assembly omits value figures', () => {
  const portfolio = () => [
    { id: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', value: 48000000, valueType: 'standard', text: 'sugar' },
    { id: 'MK-B1', name: 'Modern Trade Listing', counterparty: 'Naivas Supermarkets', value: 85000000, valueType: 'standard', text: 'listing' },
  ];

  test('graph: no amount reaches the model', async () => {
    h.ai.reset();
    await W.novalues.json('/api/ai/graph', { method: 'POST', body: { query: 'highest value deals', contracts: portfolio() } });
    assert.equal(h.ai.calls.length, 1);
    assert.deepEqual(leaks(h.ai.lastPayloadText()), [], 'an amount reached the AI prompt');
    assert.ok(h.ai.lastPayloadText().includes('Naivas'), 'the contracts themselves are still in the prompt');
  });

  test('semantic search: no amount reaches the model', async () => {
    h.ai.reset();
    await W.novalues.json('/api/ai/search', { method: 'POST', body: { question: 'biggest deal?', candidates: portfolio() } });
    assert.deepEqual(leaks(h.ai.lastPayloadText()), []);
  });

  test('Copilot: no amount reaches the model, and the value tools go quiet', async () => {
    h.ai.reset();
    await W.novalues.json('/api/ai/chat', { method: 'POST', body: {
      messages: [{ role: 'user', content: 'what is our biggest contract?' }] } });
    assert.deepEqual(leaks(h.ai.lastPayloadText()), []);
  });

  test('an admin asking the same thing DOES get the figures in the prompt', async () => {
    h.ai.reset();
    await W.admin.json('/api/ai/graph', { method: 'POST', body: { query: 'highest value deals', contracts: portfolio() } });
    assert.ok(leaks(h.ai.lastPayloadText()).length >= 2, 'an admin\'s prompt should still carry values');
  });
});

describe('F2 — saving from a masked record does not destroy the stored value', () => {
  test('a no-values user editing a contract leaves the amount intact', async () => {
    const seen = await W.novalues.json('/api/contracts/MK-A2');
    assert.equal(seen.value, undefined);
    // they change something they CAN see, and send back what they were given
    await W.novalues.json('/api/contracts/MK-A2', { method: 'PUT', body: {
      contract: { ...seen, counterparty: 'Nandi Dairy Co-operative Union' }, baseVersion: seen._v } });
    const admin = await W.admin.json('/api/contracts/MK-A2');
    assert.equal(admin.counterparty, 'Nandi Dairy Co-operative Union', 'their edit was saved');
    assert.equal(admin.value, 36000000, 'the value they could not see must survive their save');
    assert.equal(admin.valueType, 'standard');
    assert.equal(admin.fields.value, '36000000');
    assert.equal(admin.metadata.value, 36000000);
  });
});

describe('F2 — the permission is admin-editable and guarded', () => {
  test('an admin can turn it off and on again', async () => {
    const id = W.users.unrestricted.id;
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { canViewValues: false } });
    assert.equal((await W.unrestricted.json('/api/bootstrap')).me.canViewValues, false);
    assert.equal((await W.unrestricted.json('/api/contracts/MK-B1')).value, undefined);
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { canViewValues: true } });
    assert.equal((await W.unrestricted.json('/api/contracts/MK-B1')).value, 85000000);
  });

  test('a non-admin cannot grant themselves the right', async () => {
    const r = await W.novalues.raw('/api/users/' + W.users.novalues.id, { method: 'PATCH', body: { canViewValues: true } });
    assert.equal(r.status, 403);
    assert.equal((await W.novalues.json('/api/bootstrap')).me.canViewValues, false);
  });

  test('an admin cannot be left without value access', async () => {
    const id = W.users.unrestricted.id;
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { role: 'admin' } });
    const r = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { canViewValues: false } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /Admins always see/);
    await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { role: 'legal' } });
  });
});

describe('F2 — folder scope and value masking compose', () => {
  test('a user restricted to folder A AND denied values gets neither', async () => {
    await W.admin.json('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { canViewValues: false } });
    const r = await W.restricted.raw('/api/contracts?limit=200');
    assert.equal(r.json.total, 2);
    assert.deepEqual(leaks(r.text), []);
    assert.ok(!r.text.includes('Naivas'));
    const csv = await W.restricted.raw('/api/export/contracts.csv');
    assert.equal(csv.text.trim().split('\n').length, 3);
    assert.deepEqual(leaks(csv.text), []);
    const stats = await W.restricted.json('/api/stats');
    assert.equal(stats.total, 2);
    assert.equal(stats.totalValue, undefined);
    // restore for any later test in this file
    await W.admin.json('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { canViewValues: true } });
  });
});
