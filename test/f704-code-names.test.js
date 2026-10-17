/* f704 — CODE NAMES FOR CONFIDENTIAL DEALS (owner picked "A code name field —
   the SAP way", 17 Oct 2026; piece 11 of the sensitive contracts and
   governance plan)

   A deal's Details carry a code name and who knows the real name; everyone
   else sees the code name and may not open it. THE REAL NAME NEVER LEAVES THE
   SERVER for anyone outside the list. The Details row and the stand-in on the
   lists are asked in a real browser by code-names-verify. This file asks the
   server, as somebody outside the list and as somebody on it:
     1 · one writer: the deal's owner or an admin; the owner and the setter are
         always on the list; a code name is not the real name; what is filed
         under the deal follows it
     2 · the front door: a request about the deal, or what is filed under it,
         is refused in words that name only the code
     3 · every answer: the list, the changes feed, search and the activity
         feed carry a stand-in — the code name, never the real name or party
     4 · what is not an answer: the register file, the trail file, the
         workspace download and every email
     5 · Jambo: what reaches the model about the deal is its stand-in
     6 · on the list: the real name, and who knows it
     7 · the trail, and the code name taken away

   Run: node --test test/f704-code-names.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, startAiStub, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

const REAL = 'Exclusive Distribution — Carrefour Kenya', PARTY = 'Carrefour Kenya';
const soon = n => { const t = new Date(); t.setDate(t.getDate() + n); return t.toISOString().slice(0, 10); };
const utcToday = () => new Date().toISOString().slice(0, 10);
let h, W, ai, U, N;
before(async () => {
  ai = await startAiStub();
  h = await startHatiWithMail({}, { ANTHROPIC_API_KEY: 'sk-stub', ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    { ...fixtureContract('FAL-1', REAL, PARTY, FOLDER_B, 9e8, 'Under Review'), owner: null },
    { ...fixtureContract('FAL-1A', 'Amendment 1 to ' + REAL, PARTY, FOLDER_B, 0, 'Draft'), parentId: 'FAL-1', relation: 'amendment' },
    fixtureContract('OTH-1', 'Shelf placement — Quickmart', 'Quickmart', FOLDER_A, 2e6, 'Signed'),
  ] });
  U = W.users.unrestricted; N = W.users.novalues;
  const c = await W.admin.json('/api/contracts/FAL-1'); const v = c._v; delete c._v;
  c.owner = { id: U.id, name: U.name };
  await W.admin.json('/api/contracts/FAL-1', { method: 'PUT', body: { contract: c, baseVersion: v } });
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
const leaks = t => [REAL, PARTY].filter(x => String(t).includes(x));

describe('f704 (1) one writer', () => {
  test('only the owner or an admin; a code name is not the real name; what is filed under it follows', async () => {
    assert.equal((await W.novalues.raw('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [] } })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: REAL, ids: [] } })).status, 400);
    assert.equal((await W.unrestricted.raw('/api/contracts/FAL-1A/code-name', { method: 'PUT', body: { code: 'Falcon annex', ids: [] } })).status, 400);
    const r = await W.unrestricted.json('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [N.id] } });
    assert.equal(r.codeName.code, 'Project Falcon');
    assert.deepEqual(r.codeName.people.map(p => p.name).sort(), ['No Values Legal', 'Unrestricted Legal'], 'the owner is always on it');
  });
});

describe('f704 (2) the front door', () => {
  test('the deal, and what is filed under it, refused in words that name only the code', async () => {
    for (const id of ['FAL-1', 'FAL-1A']) {
      const r = await W.admin.raw('/api/contracts/' + id);
      assert.equal(r.status, 403, id);
      assert.equal(r.json.codeName, true);
      assert.equal(r.json.error, 'Project Falcon is a confidential deal: only the people named on it may open it.');
    }
    const c = { id: 'FAL-1', name: 'x' };
    assert.equal((await W.admin.raw('/api/contracts/FAL-1', { method: 'PUT', body: { contract: c, baseVersion: 1 } })).status, 403);
    assert.equal((await W.restricted.raw('/api/ai/brief', { method: 'POST', body: { id: 'FAL-1' } })).status, 403, 'an ask about it, by id');
    assert.equal((await W.admin.raw('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: '', ids: [] } })).status, 403, 'nor can an admin outside the list take it off');
  });
});

describe('f704 (3) every answer', () => {
  test('the list: a stand-in with the code name, its stage and stream, nothing more', async () => {
    const r = await W.admin.raw('/api/contracts?limit=50');
    assert.deepEqual(leaks(r.text), []);
    const row = r.json.rows.find(x => x.id === 'FAL-1');
    assert.deepEqual(row, { id: 'FAL-1', name: 'Project Falcon', counterparty: '', folder: FOLDER_B, status: 'Under Review', _codeNamed: true, _light: true });
    assert.equal(r.json.rows.find(x => x.id === 'FAL-1A').name, 'Project Falcon', 'what is filed under it too');
    assert.equal(r.json.rows.find(x => x.id === 'OTH-1').name, 'Shelf placement — Quickmart', 'everything else as it was');
  });
  test('search, the changes feed, the activity feed', async () => {
    for (const path of ['/api/search?q=Carrefour', '/api/search?q=Exclusive', '/api/contracts/changed', '/api/activity']) {
      const r = await W.admin.raw(path);
      assert.equal(r.status, 200, path);
      assert.deepEqual(leaks(r.text), [], path);
    }
  });
});

describe('f704 (4) what is not an answer', () => {
  test('the register file and the trail file', async () => {
    const csv = (await W.admin.raw('/api/export/contracts.csv')).text;
    assert.deepEqual(leaks(csv), []);
    assert.match(csv, /"FAL-1","Project Falcon","",/);
    const t = (await W.admin.raw(`/api/trail/export?from=${utcToday()}&to=${utcToday()}&as=csv`)).text;
    assert.deepEqual(leaks(t), []);
    assert.match(t, /"Unrestricted Legal","Code name","Code name Project Falcon given · 2 people know the real name: No Values Legal, Unrestricted Legal","FAL-1","Project Falcon",""/);
  });
  test('the workspace download leaves it out', async () => {
    /* the download is compressed: its contracts file is opened and read */
    const res = await fetch(h.base + '/api/export/workspace.zip', { headers: { Cookie: W.admin.cookie } });
    assert.equal(res.status, 200);
    const buf = Buffer.from(await res.arrayBuffer()), files = {};
    for (let i = 0; i + 30 <= buf.length && buf.readUInt32LE(i) === 0x04034b50;) {
      const size = buf.readUInt32LE(i + 18), nl = buf.readUInt16LE(i + 26), xl = buf.readUInt16LE(i + 28);
      const name = buf.slice(i + 30, i + 30 + nl).toString('utf8'), start = i + 30 + nl + xl;
      files[name] = require('node:zlib').inflateRawSync(buf.slice(start, start + size)).toString('utf8');
      i = start + size;
    }
    assert.ok(files['contracts.json'], 'the contracts file is in it');
    assert.deepEqual(leaks(files['contracts.json']), []);
    assert.ok(!JSON.parse(files['contracts.json']).some(c => c.id === 'FAL-1' || c.id === 'FAL-1A'), 'the deal and what is filed under it are left out');
    assert.ok(JSON.parse(files['contracts.json']).some(c => c.id === 'OTH-1'), 'everything else is in it');
  });
  test('an email to somebody outside the list names the code, never the deal or its party', async () => {
    const c = await W.unrestricted.json('/api/contracts/FAL-1'); const v = c._v; delete c._v;
    delete c._codeName;
    c.expiry = soon(10); c.status = 'Signed';
    assert.equal((await W.unrestricted.raw('/api/contracts/FAL-1', { method: 'PUT', body: { contract: c, baseVersion: v } })).status, 200);
    await W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} });
    const end = Date.now() + 3000; let mine = [];
    while (Date.now() < end) { mine = h.mail.sent.filter(m => m.to === 'admin@example.co.ke'); if (mine.some(m => /Project Falcon/.test(m.text || m.body || ''))) break; await new Promise(r => setTimeout(r, 50)); }
    const text = mine.map(m => [m.subject, m.text, m.body, m.html].join('\n')).join('\n');
    assert.match(text, /Project Falcon/, 'the brief names it by its code');
    assert.deepEqual(leaks(text), []);
  });
});

describe('f704 (5) Jambo', () => {
  test('what reaches the model about it is the stand-in', async () => {
    ai.reset();
    await W.admin.raw('/api/ai/graph', { method: 'POST', body: { query: 'which deals end soon', contracts: [{ id: 'FAL-1', name: REAL, counterparty: PARTY }, { id: 'OTH-1', name: 'Shelf placement — Quickmart' }] } });
    const sent = ai.allPayloadText();
    assert.ok(sent.length > 0, 'the model was asked');
    assert.deepEqual(leaks(sent), []);
    assert.match(sent, /Project Falcon/);
  });
});

describe('f704 (6) on the list', () => {
  test('the real name, and who knows it', async () => {
    const r = await W.novalues.raw('/api/contracts?limit=50');
    assert.equal(r.json.rows.find(x => x.id === 'FAL-1').name, REAL);
    const c = await W.novalues.json('/api/contracts/FAL-1');
    assert.equal(c.name, REAL);
    assert.equal(c._codeName.code, 'Project Falcon');
    assert.deepEqual(c._codeName.people.map(p => p.name).sort(), ['No Values Legal', 'Unrestricted Legal']);
  });
});

describe('f704 (7) the trail, and the code name taken away', () => {
  test('changing who knows is recorded; taking it away opens it again', async () => {
    await W.unrestricted.json('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: 'Project Falcon', ids: [N.id, (await W.admin.json('/api/bootstrap')).me.id] } });
    assert.equal((await W.admin.raw('/api/contracts/FAL-1')).status, 200, 'the admin now knows');
    await W.unrestricted.json('/api/contracts/FAL-1/code-name', { method: 'PUT', body: { code: '', ids: [] } });
    assert.equal((await W.restricted.raw('/api/contracts?limit=50')).status, 200);
    const t = (await W.admin.raw(`/api/trail/export?from=${utcToday()}&to=${utcToday()}&as=csv`)).text;
    assert.match(t, /"Code name","Who knows the real name of Project Falcon: added Amina Otieno"/);
    assert.match(t, /"Code name","Code name Project Falcon removed — everyone who may open it sees its real name"/);
  });
});
