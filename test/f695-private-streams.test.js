/* f695 — PRIVATE STREAMS: ONLY THE PEOPLE NAMED MAY OPEN THEM (owner picked
   "Stream page — the SAP way", 17 Oct 2026; piece 2 of the sensitive
   contracts and governance plan, decision 1: admins see a private stream
   only if named)

   Seven claims, each asked of the server, which is the wall:
     1 · a private stream shuts every reader it does not name — the list, the
         record, search, the start-up reply — an admin included; the person it
         names reads it whatever their own stream list says
     2 · the one writer refuses what would lock everybody out, a stranger on
         the list, and a member who is not an admin
     3 · an admin naming themself is recorded as its own act and told to the
         people already named, once, until they press it away
     4 · a stale whole-settings save cannot open a stream or drop a name, and
         a member is told only about streams that name them
     5 · nobody files a contract INTO a stream they cannot open
     6 · every open of a private contract is recorded, once per sitting
     7 · its money is left out of every total — the shared arithmetic both
         hosts run, the dashboard, Jambo's figures and the monthly letter —
         while the contract's own amount, which the gates measure, is untouched

   Run: node --test test/f695-private-streams.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { startHati, seedWorkspace, mentionsFolderB } = require('./helpers');
const J = require('../js/jurisdiction.js');

let h, W, ids;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  ids = { admin: (await W.admin.json('/api/bootstrap')).me.id, ...Object.fromEntries(Object.entries(W.users).map(([k, u]) => [k, u.id])) };
});
after(async () => { if (h) await h.stop(); });

const book = async client => {
  const r = await client.json('/api/contracts?limit=200&offset=0');
  return (r.rows || []).map(c => c.id).sort();
};
const status = async (client, url, opts) => { try { await client.json(url, opts); return 200; } catch (e) { const m = /→ (\d{3})/.exec(e.message); return m ? Number(m[1]) : 0; } };
const setPrivate = (on, who) => W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on, ids: who } });

describe('f695 (1) a private stream shuts every reader it does not name', () => {
  before(async () => { await setPrivate(true, [ids.restricted]); });
  test('the list: the admin and an unrestricted member lose it; the named member gains it', async () => {
    assert.deepEqual(await book(W.admin), ['MK-A1', 'MK-A2'], 'an admin is not named, so an admin does not see it');
    assert.deepEqual(await book(W.unrestricted), ['MK-A1', 'MK-A2']);
    assert.deepEqual(await book(W.restricted), ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2'],
      'restricted to proc by their own list, and named on sales: naming is the grant');
  });
  test('the record answers "not found", never "forbidden"', async () => {
    assert.equal(await status(W.admin, '/api/contracts/MK-B1'), 404);
    assert.equal(await status(W.unrestricted, '/api/contracts/MK-B2'), 404);
    assert.equal(await status(W.restricted, '/api/contracts/MK-B1'), 200);
  });
  test('search finds nothing of it outside the named', async () => {
    const r = await W.unrestricted.json('/api/search?q=' + encodeURIComponent('Naivas'));
    assert.deepEqual(mentionsFolderB(JSON.stringify(r)), []);
  });
  test('the start-up reply says "every stream but" for an unrestricted reader', async () => {
    const b = await W.unrestricted.json('/api/bootstrap');
    assert.deepEqual(b.me.folderAccess, { but: ['sales'] });
    assert.deepEqual(mentionsFolderB(JSON.stringify(b)), []);
  });
});

describe('f695 (2) the one writer refuses what it must', () => {
  test('a private stream with nobody named', async () => {
    assert.equal(await status(W.admin, '/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: [] } }), 400);
  });
  test('somebody who is not a member', async () => {
    assert.equal(await status(W.admin, '/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: ['u_nobody'] } }), 400);
  });
  test('a member who is not an admin, reading or writing', async () => {
    assert.equal(await status(W.restricted, '/api/private-streams/sales', { method: 'PUT', body: { on: false, ids: [] } }), 403);
    assert.equal(await status(W.restricted, '/api/private-streams'), 403);
  });
});

describe('f695 (3) an admin naming themself is recorded and told', () => {
  test('the act is "self", and the people already named are told once', async () => {
    const before = (await W.restricted.json('/api/bootstrap')).me.streamNews;
    assert.deepEqual(before, [], 'nothing to tell yet');
    await setPrivate(true, [ids.restricted, ids.admin]);
    const list = await W.admin.json('/api/private-streams');
    const acts = list.streams.sales.log.map(e => e.act);
    assert.ok(acts.includes('self'), 'recorded as its own act: ' + acts.join(','));
    assert.equal(list.streams.sales.people.find(p => p.id === ids.admin).self, true);
    const news = (await W.restricted.json('/api/bootstrap')).me.streamNews;
    assert.equal(news.length, 1);
    assert.equal(news[0].fid, 'sales');
    assert.equal(news[0].who.id, ids.admin);
    assert.deepEqual(await book(W.admin), ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2'], 'named now, so the admin reads it');
  });
  test('pressed away, it is gone; somebody not named cannot press it', async () => {
    assert.equal(await status(W.unrestricted, '/api/private-streams/sales/seen', { method: 'POST', body: {} }), 404);
    await W.restricted.json('/api/private-streams/sales/seen', { method: 'POST', body: {} });
    assert.deepEqual((await W.restricted.json('/api/bootstrap')).me.streamNews, []);
  });
  test('a removal is recorded too', async () => {
    await setPrivate(true, [ids.restricted]);
    const acts = (await W.admin.json('/api/private-streams')).streams.sales.log.map(e => e.act);
    assert.equal(acts[acts.length - 1], 'remove');
  });
});

describe('f695 (4) the list is written by its own route only, and told only to the named', () => {
  test('a stale whole-settings save keeps the stored list', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { privateStreams: {} } });
    const s = (await W.admin.json('/api/private-streams')).streams;
    assert.equal(s.sales && s.sales.on, true);
    assert.deepEqual(await book(W.unrestricted), ['MK-A1', 'MK-A2']);
  });
  test('a member hears only of a stream that names them', async () => {
    const out = (await W.unrestricted.json('/api/bootstrap')).settings.privateStreams;
    assert.deepEqual(out, {}, 'a stream that shuts them out is not described at all');
    const inn = (await W.restricted.json('/api/bootstrap')).settings.privateStreams;
    assert.deepEqual(Object.keys(inn), ['sales']);
    assert.deepEqual(inn.sales.ids, [ids.restricted]);
    assert.equal(inn.sales.log, undefined, 'the record of acts is the admin\'s');
  });
});

describe('f695 (5) nobody files a contract into a stream they cannot open', () => {
  test('a save that moves a contract into the private stream is refused', async () => {
    const full = await W.admin.json('/api/contracts/MK-A2');
    const baseVersion = full._v; delete full._v;
    full.folder = 'sales';
    assert.equal(await status(W.admin, '/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } }), 403);
  });
});

describe('f695 (6) every open of a private contract is recorded, once per sitting', () => {
  test('two opens in a minute are one line; an open contract is not recorded', async () => {
    await W.restricted.json('/api/contracts/MK-B1');
    await W.restricted.json('/api/contracts/MK-B1');
    await W.restricted.json('/api/contracts/MK-A1');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    try {
      const rows = db.prepare('SELECT contract_id, user_id FROM private_opens').all();
      assert.deepEqual(rows.map(r => r.contract_id), ['MK-B1']);
      assert.equal(rows[0].user_id, ids.restricted);
    } finally { db.close(); }
  });
});

describe('f695 (7) its money is left out of every total', () => {
  test('the shared arithmetic: added nowhere, its own amount untouched', () => {
    J.fxSetPrivateReader(() => ({ hr: { on: true, people: [{ id: 'u1' }] } }));
    try {
      const hr = { folder: 'hr', value: 900000, metadata: { currency: J.fxHomeCode() } };
      const open = { folder: 'proc', value: 100, metadata: { currency: J.fxHomeCode() } };
      assert.equal(J.fxPrivate(hr), true);
      assert.equal(J.fxHomeValue(hr), 0, 'nothing that adds reads it');
      assert.equal(J.fxCounted(hr).v, 0);
      assert.equal(J.fxHome(hr).v, 900000, 'the contract\'s own amount — what a signing limit or an approval rule measures — is unchanged');
      assert.equal(J.fxHomeValue(open), 100, 'every other folder adds as before');
      const usd = { folder: 'hr', value: 5, metadata: { currency: 'USD' } };
      assert.deepEqual(J.fxMissing([usd]), {}, 'and it is not reported as "no rate" either');
    } finally { J.fxSetPrivateReader(() => ({})); }
  });
  test('the dashboard of somebody it names leaves it out of the total and the folder line', async () => {
    const s = await W.restricted.json('/api/stats');
    assert.equal(s.totalValue, 48000000 + 36000000, 'proc only: MK-B1 and MK-B2 add nothing');
    const sales = (s.byFolder || []).find(r => r.folder === 'sales');
    assert.ok(!sales || !sales.val, 'the private folder\'s own line carries no money');
  });
  test('the monthly letter, which goes to several people, carries nothing of it', async () => {
    const r = await W.admin.json('/api/reports/monthly');
    assert.deepEqual(mentionsFolderB(JSON.stringify(r.preview)), []);
    assert.equal(r.preview.facts.totalValue, 48000000 + 36000000);
  });
  test('opened again for everyone given it, the figures come back', async () => {
    await setPrivate(false, [ids.restricted]);
    assert.deepEqual(await book(W.unrestricted), ['MK-A1', 'MK-A2', 'MK-B1', 'MK-B2']);
    const s = await W.admin.json('/api/stats');
    assert.equal(s.totalValue, 48000000 + 36000000 + 85000000 + 78000000);
  });
});

/* ---- WHO OPENED IT, IN ITS OWN TRAIL (owner picked "In the trail", 17 Oct
   2026): the record of opens reaches the contract's History as transport ---- */
describe('f695 (8) a private contract arrives with who opened it, as transport only', () => {
  before(async () => { await setPrivate(true, [ids.restricted]); });
  test('the named reader gets the opens and the folder\'s access record', async () => {
    const c = await W.restricted.json('/api/contracts/MK-B2');
    assert.ok(Array.isArray(c._opens) && c._opens.length >= 1, 'this very open is in it');
    assert.equal(c._opens[c._opens.length - 1].by.id, ids.restricted);
    assert.ok(Array.isArray(c._access) && c._access.some(a => a.act === 'add' && a.who.id === ids.restricted));
    assert.ok(c._access.every(a => ['self', 'add', 'remove', 'on', 'off'].includes(a.act)));
  });
  test('a contract outside a private folder carries none', async () => {
    const c = await W.restricted.json('/api/contracts/MK-A1');
    assert.equal(c._opens, undefined);
    assert.equal(c._access, undefined);
  });
  test('a save never stores it', async () => {
    const full = await W.restricted.json('/api/contracts/MK-B2');
    const baseVersion = full._v; delete full._v;
    await W.restricted.json('/api/contracts/MK-B2', { method: 'PUT', body: { contract: full, baseVersion } });
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    try {
      const j = JSON.parse(db.prepare('SELECT json FROM contracts WHERE id=?').get('MK-B2').json);
      assert.equal(j._opens, undefined); assert.equal(j._access, undefined);
    } finally { db.close(); }
  });
  test('past the cap, the oldest are left out and the number left out is said', async () => {
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    try {
      const ins = db.prepare('INSERT INTO private_opens (contract_id, folder, user_id, user_name, at) VALUES (?,?,?,?,?)');
      for (let i = 0; i < 1005; i++) ins.run('MK-B1', 'sales', ids.restricted, 'Restricted Legal', new Date(Date.UTC(2026, 0, 1, 0, i)).toISOString());
    } finally { db.close(); }
    const c = await W.restricted.json('/api/contracts/MK-B1');
    assert.equal(c._opens.length, 1000);
    assert.ok(c._opensCut >= 5, 'said, not silently trimmed: ' + c._opensCut);
    assert.ok(String(c._opens[0].at) <= String(c._opens[c._opens.length - 1].at), 'oldest first, as the trail reads');
  });
});
