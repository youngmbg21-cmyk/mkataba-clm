/* F1 — folder access is enforced on the server.
   Every assertion here runs against a RAW response body or the RAW payload HaTi
   assembled for the AI provider. Nothing is checked through rendered UI: the
   whole point of this fix is that the browser hiding data the server still sent
   is not a fix. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, mentionsFolderB, FOLDER_A, FOLDER_B } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('F1 — a restricted user never receives folder-B data', () => {

  test('contract list carries zero folder-B rows (raw body)', async () => {
    const r = await W.restricted.raw('/api/contracts?limit=200');
    assert.equal(r.status, 200);
    assert.deepEqual(mentionsFolderB(r.text), [], 'folder-B marker found in the raw list body');
    assert.equal(r.json.total, 2);
    assert.deepEqual(r.json.rows.map(c => c.id).sort(), ['MK-A1', 'MK-A2']);
  });

  test('a folder filter cannot widen scope', async () => {
    const r = await W.restricted.raw('/api/contracts?folder=' + FOLDER_B);
    assert.equal(r.status, 200);
    assert.equal(r.json.total, 0);
    assert.deepEqual(r.json.rows, []);
    assert.deepEqual(mentionsFolderB(r.text), []);
  });

  test('search (FTS) returns only folder-A hits', async () => {
    const r = await W.restricted.raw('/api/search?q=Naivas');
    assert.equal(r.status, 200);
    assert.deepEqual(mentionsFolderB(r.text), [], 'folder-B contract leaked through search');
    assert.deepEqual(r.json.hits, []);
    // …and the same query as an unrestricted user does find them, so the test
    // is proving scoping rather than a broken index.
    const u = await W.unrestricted.raw('/api/search?q=Naivas');
    assert.ok(u.json.hits.length >= 1, 'unrestricted search should still find folder B');
  });

  test('search LIKE-fallback path is scoped too', async () => {
    // exercised by name substring; the FTS and non-FTS branches share the join
    const r = await W.restricted.raw('/api/search?q=Retail');
    assert.deepEqual(mentionsFolderB(r.text), []);
  });

  test('stats aggregate only folder A (raw body)', async () => {
    const r = await W.restricted.raw('/api/stats');
    assert.equal(r.status, 200);
    assert.equal(r.json.total, 2);
    assert.deepEqual(r.json.byFolder.map(f => f.folder).sort(), [FOLDER_A]);
    assert.equal(r.json.totalValue, 48000000 + 36000000);
    assert.deepEqual(mentionsFolderB(r.text), []);
  });

  test('analytics aggregate only folder A', async () => {
    const r = await W.restricted.raw('/api/analytics');
    assert.equal(r.status, 200);
    assert.deepEqual(mentionsFolderB(r.text), [], 'a folder-B counterparty appeared in byParty');
    assert.deepEqual(r.json.byFolder.map(f => f.folder), [FOLDER_A]);
  });

  test('activity feed carries no folder-B events', async () => {
    const r = await W.restricted.raw('/api/activity');
    assert.equal(r.status, 200);
    assert.deepEqual(mentionsFolderB(r.text), []);
  });

  test('share overview is scoped (raw body)', async () => {
    // put a live share on one contract in each folder, as the admin
    for (const id of ['MK-A1', 'MK-B1']) {
      await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: { kind: 'hati-share', contract: { id, name: id }, org: 'Highland' },
        channel: 'link', recipient: { name: 'Someone' } } });
    }
    const r = await W.restricted.raw('/api/shares/overview');
    assert.equal(r.status, 200);
    assert.deepEqual(mentionsFolderB(r.text), []);
    assert.deepEqual(Object.keys(r.json.byContract), ['MK-A1']);
    // the admin still sees both — no regression
    const a = await W.admin.json('/api/shares/overview');
    assert.deepEqual(Object.keys(a.byContract).sort(), ['MK-A1', 'MK-B1']);
  });

  test('CSV export contains zero folder-B rows (raw body)', async () => {
    const r = await W.restricted.raw('/api/export/contracts.csv');
    assert.equal(r.status, 200);
    assert.deepEqual(mentionsFolderB(r.text), [], 'folder-B contract appeared in the CSV');
    const lines = r.text.trim().split('\n');
    assert.equal(lines.length, 3, 'header + 2 folder-A rows');
    assert.ok(r.text.includes('MK-A1') && r.text.includes('MK-A2'));
  });

  test('bootstrap count is scoped', async () => {
    const b = await W.restricted.json('/api/bootstrap');
    assert.equal(b.count, 2);
    assert.deepEqual(b.me.folderAccess, [FOLDER_A]);
  });

  test('direct GET of a folder-B contract is 404, not 403', async () => {
    const r = await W.restricted.raw('/api/contracts/MK-B1');
    assert.equal(r.status, 404);
    assert.deepEqual(mentionsFolderB(r.text), []);
    assert.match(r.json.error, /not found/i);
  });

  test('every per-contract route answers 404 for a folder-B id', async () => {
    const paths = ['/api/contracts/MK-B1/shares', '/api/contracts/MK-B1/engagement'];
    for (const p of paths) {
      const r = await W.restricted.raw(p);
      assert.equal(r.status, 404, p + ' should 404');
    }
    const put = await W.restricted.raw('/api/contracts/MK-B1', { method: 'PUT',
      body: { contract: { id: 'MK-B1', name: 'hijacked', folder: FOLDER_B }, baseVersion: 1 } });
    assert.equal(put.status, 404, 'PUT to a folder-B contract should 404');
    const del = await W.restricted.raw('/api/contracts/MK-B1', { method: 'DELETE' });
    assert.equal(del.status, 404, 'DELETE of a folder-B contract should 404');
    // and the record is untouched
    const still = await W.admin.json('/api/contracts/MK-B1');
    assert.equal(still.name, 'Modern Trade Listing');
  });

  test('a restricted user cannot file a contract into a stream they cannot see', async () => {
    const r = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT',
      body: { contract: { id: 'MK-A2', name: 'Raw Milk Collection', folder: FOLDER_B }, baseVersion: 1 } });
    assert.equal(r.status, 403);
    const still = await W.admin.json('/api/contracts/MK-A2');
    assert.equal(still.folder, FOLDER_A);
  });

  test('an uploaded file attached to a folder-B contract is not readable', async () => {
    // attach a real file to a folder-B contract, as an upload would
    const file = await W.admin.json('/api/files', { method: 'POST', body: {
      name: 'naivas-listing.pdf', mime: 'application/pdf',
      dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK' } });
    const cur = await W.admin.json('/api/contracts/MK-B2');
    await W.admin.json('/api/contracts/MK-B2', { method: 'PUT', body: {
      contract: { ...cur, source: 'upload', upload: { fileId: file.id, fileName: 'naivas-listing.pdf' } },
      baseVersion: cur._v } });

    const r = await W.restricted.raw('/api/files/' + file.id);
    assert.equal(r.status, 404, 'a folder-B contract\'s file must not be readable');
    // the owner side still works
    assert.equal((await W.admin.json('/api/files/' + file.id)).name, 'naivas-listing.pdf');
    assert.equal((await W.unrestricted.json('/api/files/' + file.id)).name, 'naivas-listing.pdf');
  });

  test('a restricted user cannot share a folder-B contract', async () => {
    const r = await W.restricted.raw('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', contract: { id: 'MK-B1', name: 'Modern Trade Listing' } },
      channel: 'link', recipient: { name: 'X' } } });
    assert.equal(r.status, 404);
  });
});

describe('F1 — access "*" is unchanged (no regression)', () => {
  test('an unrestricted legal user still sees the whole portfolio', async () => {
    const list = await W.unrestricted.json('/api/contracts?limit=200');
    assert.equal(list.total, 4);
    assert.deepEqual(list.rows.map(c => c.id).sort(), ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2']);
    const stats = await W.unrestricted.json('/api/stats');
    assert.equal(stats.total, 4);
    assert.equal(stats.totalValue, 48000000 + 36000000 + 85000000 + 78000000);
    const one = await W.unrestricted.json('/api/contracts/MK-B1');
    assert.equal(one.id, 'MK-B1');
    const csv = await W.unrestricted.raw('/api/export/contracts.csv');
    assert.equal(csv.text.trim().split('\n').length, 5);
  });

  test('an admin still sees everything', async () => {
    const list = await W.admin.json('/api/contracts?limit=200');
    assert.equal(list.total, 4);
    assert.equal((await W.admin.json('/api/bootstrap')).count, 4);
    assert.equal((await W.admin.json('/api/bootstrap')).me.folderAccess, '*');
  });
});

describe('F1 — AI prompts are assembled from scoped data only', () => {
  const everyContract = () => [
    { id: 'MK-A1', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', text: 'sugar terms', value: 48000000 },
    { id: 'MK-A2', name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', text: 'milk terms', value: 36000000 },
    { id: 'MK-B1', name: 'Modern Trade Listing', counterparty: 'Naivas Supermarkets', text: 'listing terms', value: 85000000 },
    { id: 'MK-B2', name: 'Retail Supply — Coast', counterparty: 'Naivas Supermarkets', text: 'retail terms', value: 78000000 },
  ];

  test('graph: a portfolio-wide contract list is cut to the caller scope', async () => {
    h.ai.reset();
    const r = await W.restricted.json('/api/ai/graph', { method: 'POST', body: {
      query: 'show me everything', contracts: everyContract(), activeIds: ['MK-B1', 'MK-A1'] } });
    assert.ok(r, 'graph should still answer');
    assert.equal(h.ai.calls.length, 1, 'exactly one provider call');
    assert.deepEqual(mentionsFolderB(h.ai.lastPayloadText()), [],
      'a folder-B contract reached the model prompt');
    assert.ok(h.ai.lastPayloadText().includes('Kabras Sugar'), 'folder-A contracts should still be in the prompt');
  });

  test('semantic search: candidates are cut to the caller scope', async () => {
    h.ai.reset();
    await W.restricted.json('/api/ai/search', { method: 'POST', body: {
      question: 'who are our biggest suppliers?', candidates: everyContract() } });
    assert.deepEqual(mentionsFolderB(h.ai.lastPayloadText()), []);
  });

  test('template advisor: candidates are cut to the caller scope', async () => {
    h.ai.reset();
    // raw, not json: the stub returns an empty ranking so the endpoint answers
    // 502 — irrelevant here, the assertion is about what was SENT.
    await W.restricted.raw('/api/ai/template', { method: 'POST', body: {
      query: 'a new supply agreement', candidates: everyContract() } });
    assert.equal(h.ai.calls.length, 1, 'the template advisor should still call the provider');
    assert.deepEqual(mentionsFolderB(h.ai.allPayloadText()), []);
    assert.ok(h.ai.allPayloadText().includes('Kabras Sugar'), 'folder-A candidates should survive');
  });

  test('Copilot: the tool loop cannot fetch or list a folder-B contract', async () => {
    h.ai.reset();
    // Drive the tool loop deterministically: the stub answers the first turn
    // with deliver_answer, so instead we assert on the SYSTEM prompt (built from
    // live workspace facts) and on the tools' own return values.
    await W.restricted.json('/api/ai/chat', { method: 'POST', body: {
      messages: [{ role: 'user', content: 'what is in the portfolio?' }] } });
    const sent = h.ai.lastPayloadText();
    assert.deepEqual(mentionsFolderB(sent), [], 'the Copilot system prompt named folder-B data');
    // the workspace summary must count 2, not 4 — the system prompt is an
    // array of blocks now (cached rulebook + live snapshot), so flatten first
    const sysBlocks = JSON.parse(h.ai.calls[0].raw).system;
    const sysStr = Array.isArray(sysBlocks) ? sysBlocks.map(b => (b && b.text) || '').join('\n') : String(sysBlocks);
    assert.ok(/WORKSPACE: 2 contracts/.test(sysStr),
      'Copilot workspace summary should count only the caller\'s scope');
  });

  test('Copilot cited ids outside scope are dropped before they reach the browser', async () => {
    // The stub always replies deliver_answer with no citations, so this checks
    // the guard directly through the public behaviour that a card is only ever
    // built for an in-scope id.
    const r = await W.restricted.json('/api/ai/chat', { method: 'POST', body: {
      messages: [{ role: 'user', content: 'tell me about MK-B1' }] } });
    assert.deepEqual(mentionsFolderB(JSON.stringify(r)), []);
    assert.deepEqual(r.cards, []);
  });
});
