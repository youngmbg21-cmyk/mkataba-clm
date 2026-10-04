/* f403 — A DELETED CONTRACT TAKES ITS SHARING RECORDS WITH IT
   (the owner's list, 27 Sep 2026)

   "Deleting a contract still leaves some of its sharing records behind: the
   other side's messages, signer notices, responses and earlier versions of
   what was shared."

   Each of those is its own table, keyed on the contract or on one of its
   links, and the delete route removed only the readings. forgetContractRecords
   (server/server.js) is now the ONE list, asked by both doors that delete a
   contract — the delete route and the sample clear-out, which left the
   readings behind as well.

   THE LINK ROW ITSELF STAYS, REVOKED AND EMPTY: somebody still holding the
   link must be told it was withdrawn, not that it never existed.

   Measured against a real server and read straight off its database.
   Red at the parent (3ee647b): (1)(2)(4). (3) and (5) are CONTROLS. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n5. Payment shall be made within thirty (30) days.';
const payloadFor = (id, text) => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: text, format: 'text', docText: text, versions: [] },
});

describe('f403 — what goes with a deleted contract', () => {
  let h, W, db;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    const { DatabaseSync } = require('node:sqlite');
    db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
  });
  after(async () => { try { db.close(); } catch (_) {} await h.stop(); });

  const count = (sql, ...args) => Number(db.prepare(sql).get(...args).n);
  const TABLES_BY_CONTRACT = ['share_messages', 'signer_notices', 'engagement', 'briefs', 'renewal_advice', 'clause_readings', 'clause_reading_rows'];
  const TABLES_BY_TOKEN = ['share_responses', 'share_payload_history', 'share_otp'];

  /* One contract with every kind of record a sharing round leaves: a durable
     negotiation link that was opened (engagement), a question from their side
     (share_messages), an answer (share_responses), a refreshed copy
     (share_payload_history), a signing code (share_otp), an internal signer's
     notice (signer_notices) and the three cached readings. The first four go
     through the product's own routes; the rest are written the way their own
     routes write them. */
  async function contractWithHistory(id, over = {}) {
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: {
      contract: { ...fixtureContract(id, 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'), ...over },
      baseVersion: 0 } });
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor(id, DOC), durable: true, channel: 'link', purpose: 'negotiate',
      message: 'Here is our draft — call me with questions.',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' } } });
    const token = r.token;
    assert.ok(token, 'STAGE: a link was minted — ' + JSON.stringify(r).slice(0, 200));
    const anon = h.client('erik-' + id);
    await anon.json('/api/shares/' + token);                                   // opened
    await anon.json('/api/shares/' + token + '/messages', { method: 'POST', body: {
      author: 'Erik Lindqvist', topic: 'general', body: 'Would you take Net-45?' } });
    await anon.json('/api/shares/' + token + '/respond', { method: 'POST', body: {
      kind: 'hati-response', action: 'changes', name: 'Erik Lindqvist', proposals: [] } }).catch(() => null);
    const at = new Date().toISOString();
    db.prepare('INSERT INTO share_payload_history (token, at, doc_text) VALUES (?,?,?)').run(token, at, DOC);
    db.prepare('INSERT OR REPLACE INTO share_otp (token, email, code_hash, verify, verified, expires) VALUES (?,?,?,?,?,?)')
      .run(token, 'erik@nordkust.se', 'x', 'y', 0, Date.now() + 60000);
    db.prepare('INSERT INTO share_responses (token, response, at, applied) VALUES (?,?,?,0)')
      .run(token, JSON.stringify({ kind: 'hati-response', action: 'changes', at }), at);
    db.prepare("INSERT INTO signer_notices (id, contract_id, signer_id, email, sent, created_at) VALUES (?,?,?,?,1,?)")
      .run('sn_' + id, id, 's_1', 'amina@example.co.ke', at);
    db.prepare('INSERT OR REPLACE INTO briefs (contract_id, json, created_at) VALUES (?,?,?)').run(id, '{}', at);
    db.prepare('INSERT OR REPLACE INTO renewal_advice (contract_id, json, created_at) VALUES (?,?,?)').run(id, '{}', at);
    db.prepare('INSERT OR REPLACE INTO clause_readings (contract_id, json, created_at) VALUES (?,?,?)').run(id, '{}', at);
    db.prepare('INSERT OR REPLACE INTO clause_reading_rows (contract_id, hash, json, created_at) VALUES (?,?,?,?)').run(id, 'h', '{}', at);
    /* THE STAGE MUST HOLD BEFORE ANYTHING IS DELETED, or "none left" is true of
       a stage that never wrote them. */
    for (const t of TABLES_BY_CONTRACT)
      assert.ok(count(`SELECT COUNT(*) n FROM ${t} WHERE contract_id=?`, id) > 0, 'STAGE: ' + t + ' holds a row for ' + id);
    for (const t of TABLES_BY_TOKEN)
      assert.ok(count(`SELECT COUNT(*) n FROM ${t} WHERE token=?`, token) > 0, 'STAGE: ' + t + ' holds a row for the link');
    return token;
  }

  test('f403 (1) the delete route takes every sharing record and every reading with the contract', async () => {
    const token = await contractWithHistory('MK-DEL-1');
    const del = await W.admin.json('/api/contracts/MK-DEL-1', { method: 'DELETE' });
    assert.equal(del.ok, true);
    const left = {};
    for (const t of TABLES_BY_CONTRACT) left[t] = count(`SELECT COUNT(*) n FROM ${t} WHERE contract_id=?`, 'MK-DEL-1');
    for (const t of TABLES_BY_TOKEN) left[t] = count(`SELECT COUNT(*) n FROM ${t} WHERE token=?`, token);
    assert.deepEqual(Object.entries(left).filter(([, n]) => n > 0), [], 'left behind: ' + JSON.stringify(left));
  });

  test('f403 (2) the link row stays, revoked — and carries nothing it was sent with', async () => {
    const token = await contractWithHistory('MK-DEL-2');
    await W.admin.json('/api/contracts/MK-DEL-2', { method: 'DELETE' });
    const row = db.prepare('SELECT * FROM shares WHERE token=?').get(token);
    assert.ok(row, 'the row is kept so the link can say it was withdrawn');
    assert.ok(row.revoked_at, 'revoked');
    assert.equal(row.payload, '{}', 'the copy of the contract is gone');
    assert.equal(row.response, null, 'their answer is gone');
    assert.equal(row.message, null, 'the sender’s note is gone');
    const got = await h.client('late-reader').raw('/api/shares/' + token);
    assert.equal(got.status, 410, 'a reader holding the link is told it was withdrawn, not that it never existed');
  });

  test('f403 (3) CONTROL: another contract’s records are untouched', async () => {
    const keep = await contractWithHistory('MK-KEEP-1');
    await contractWithHistory('MK-DEL-3');
    await W.admin.json('/api/contracts/MK-DEL-3', { method: 'DELETE' });
    for (const t of TABLES_BY_CONTRACT)
      assert.ok(count(`SELECT COUNT(*) n FROM ${t} WHERE contract_id=?`, 'MK-KEEP-1') > 0, t + ' of the other contract survives');
    for (const t of TABLES_BY_TOKEN)
      assert.ok(count(`SELECT COUNT(*) n FROM ${t} WHERE token=?`, keep) > 0, t + ' of the other link survives');
    const row = db.prepare('SELECT revoked_at, payload FROM shares WHERE token=?').get(keep);
    assert.equal(row.revoked_at, null);
    assert.notEqual(row.payload, '{}');
  });

  test('f403 (4) clearing the samples takes the same records', async () => {
    const token = await contractWithHistory('MK-SEED-1', { seeded: true });
    const r = await W.admin.json('/api/demo/clear', { method: 'POST', body: {} });
    assert.ok((r.removed || []).includes('MK-SEED-1'), 'STAGE: the sample was cleared — ' + JSON.stringify(r));
    const left = {};
    for (const t of TABLES_BY_CONTRACT) left[t] = count(`SELECT COUNT(*) n FROM ${t} WHERE contract_id=?`, 'MK-SEED-1');
    for (const t of TABLES_BY_TOKEN) left[t] = count(`SELECT COUNT(*) n FROM ${t} WHERE token=?`, token);
    assert.deepEqual(Object.entries(left).filter(([, n]) => n > 0), [], 'left behind: ' + JSON.stringify(left));
  });

  test('f403 (5) CONTROL: an executed contract still cannot be deleted, and keeps everything', async () => {
    await W.admin.json('/api/contracts/MK-EXEC-1', { method: 'PUT', body: {
      contract: { ...fixtureContract('MK-EXEC-1', 'Executed Agreement', 'Nordkust Industri AB', FOLDER_A, 100, 'Signed') },
      baseVersion: 0 } });
    db.prepare("INSERT INTO signer_notices (id, contract_id, signer_id, email, sent, created_at) VALUES (?,?,?,?,1,?)")
      .run('sn_exec', 'MK-EXEC-1', 's_1', 'amina@example.co.ke', new Date().toISOString());
    const del = await W.admin.raw('/api/contracts/MK-EXEC-1', { method: 'DELETE' });
    assert.equal(del.status, 409);
    assert.equal(count('SELECT COUNT(*) n FROM signer_notices WHERE contract_id=?', 'MK-EXEC-1'), 1);
  });
});
