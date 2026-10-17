/* f697 — JAMBO BEHIND THE WALL: A PRIVATE FOLDER'S CONTRACT IS READ ONLY ON A
   PRESS (owner picked "One press — the SAP way", 17 Oct 2026; piece 3 of the
   sensitive contracts and governance plan, decision 2)

   The browser's half (no reading on arrival, on leaving drafting, on
   reopening or on opening Clauses; the one press on the panel) is asked in a
   real browser by jambo-behind-the-wall-verify. This file asks the server's:
     1 · the night helpers pass a private folder's contracts by — renewal
         preparation, standards preparation and the book reading — and say
         how many they passed by
     2 · the book reading's drawer counts only what it may read, so an admin
         the folder does not name learns nothing of it there
     3 · a reply draft is never started on a private contract's answer
     4 · opened again for everyone, the helpers read it as before

   Run: node --test test/f697-jambo-behind-the-wall.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const { startHati, startAiStub, seedWorkspace, fixtureContract, FIXTURES } = require('./helpers');

const UPLOAD_B3 = { ...fixtureContract('MK-B3', 'Uploaded Listing Terms', 'Carrefour Kenya', 'sales', 5000000, 'Under Review',
  'LISTING TERMS\n\nPayment is due within thirty days of invoice.'), source: 'upload', template: null };

let h, W, ai, adminId;
before(async () => {
  ai = await startAiStub();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h, { contracts: FIXTURES.concat([UPLOAD_B3]), approvalRules: [] });
  adminId = (await W.admin.json('/api/bootstrap')).me.id;
  /* the admin names themself, so the folder is private and still theirs to open */
  await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: true, ids: [adminId] } });
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });

const bookRows = () => {
  const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
  try { return db.prepare('SELECT contract_id FROM book_readings').all().map(r => r.contract_id); } finally { db.close(); }
};

describe('f697 (1) the night helpers pass a private folder by', () => {
  test('renewal preparation says how many it passed by', async () => {
    const r = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal((r.skipped || {}).private, 3, 'MK-B1, MK-B2 and MK-B3 sit in the private folder');
  });
  test('standards preparation passes the private upload by', async () => {
    const r = await W.admin.json('/api/playbook-prep/run', { method: 'POST' });
    assert.equal((r.skipped || {}).private, 1, 'MK-B3 is the one upload in it');
  });
  test('the book reading passes them by and keeps nothing of them', async () => {
    ai.reset();
    const r = await W.admin.json('/api/board/reading/run', { method: 'POST' });
    assert.equal((r.skipped || {}).private, 3);
    const kept = bookRows();
    assert.ok(!kept.some(id => /^MK-B/.test(id)), 'no reading of a private contract is kept: ' + kept.join(','));
    assert.ok(!/Naivas|Carrefour/.test(ai.allPayloadText()), 'and none of their words reached the model');
  });
});

describe('f697 (2) the book reading\'s drawer counts only what it may read', () => {
  test('the private folder is not in the book it counts', async () => {
    const st = await W.admin.json('/api/board/reading');
    assert.equal(st.total, 2, 'MK-A1 and MK-A2 only');
  });
});

describe('f697 (3) a reply draft is never started on a private contract', () => {
  test('both doors into the reply drafts ask the folder first', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const kick = src.slice(src.indexOf('function roundPrepKick('), src.indexOf('function roundPrepKick(') + 700);
    assert.match(kick, /psFolderPrivate\(r\.folder\)\) return;/, 'the event that starts a draft');
    const one = src.slice(src.indexOf('async function runRoundPrep('), src.indexOf('async function runRoundPrep(') + 900);
    assert.match(one, /if \(psFolderPrivate\(c\.folder\)\) \{ bump\('private'\); return out; \}/, 'and the draft itself');
    const all = src.slice(src.indexOf('async function runRoundPrepAll('), src.indexOf('async function runRoundPrepAll(') + 900);
    assert.match(all, /psFolderPrivate\(c\.folder\)/, 'and the sweep over every deal');
  });
});

describe('f697 (4) opened again for everyone, the helpers read it as before', () => {
  test('nothing is passed by once the folder is not private', async () => {
    await W.admin.json('/api/private-streams/sales', { method: 'PUT', body: { on: false, ids: [adminId] } });
    const r = await W.admin.json('/api/renewal-prep/run', { method: 'POST' });
    assert.equal((r.skipped || {}).private, undefined);
    assert.equal((await W.admin.json('/api/board/reading')).total, 5);
  });
});
