/* f703 — HOW LONG CONTRACTS ARE KEPT, AND LEGAL HOLD (owner picked "Keeping
   on each stream — the SAP way", 17 Oct 2026; piece 10 of the sensitive
   contracts and governance plan)

   Each stream says how many years its contracts are kept after they end, and
   what then — listed for an admin to delete, or kept archived. The stream's
   Keeping tab, its due list and Needs your attention are asked in a real
   browser by keeping-verify. This file asks the server:
     1 · an admin's alone: every route, and only an admin's bootstrap
     2 · a period from the list; what is due is read from the stored book —
         counted from the day a contract ended AS AMENDED; an agreement goes
         with its family; one on legal hold, or with a family member on hold,
         is held back; a contract with no end is never due
     3 · the admin's yes deletes only what is due now, family and all, and
         says what it refused
     4 · nothing on legal hold is deleted or archived, by any door
     5 · a stream whose contracts are kept archived: the yes archives them
     6 · the trail: the period set, and every deletion with what it was

   Run: node --test test/f703-keeping-and-legal-hold.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

/* days counted from today, so the answer never depends on the day it runs */
const yearsAgo = (y, d = 0) => { const t = new Date(); t.setFullYear(t.getFullYear() - y); t.setDate(t.getDate() - d);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const utcToday = () => new Date().toISOString().slice(0, 10);
const K = (id, name, folder, end, over = {}) => ({ ...fixtureContract(id, name, 'Rift Valley Distributors', folder, 2e6, 'Signed'),
  expiry: end, metadata: { value: 2e6, currency: 'KES' }, ...over });
const HOLD = { at: '2026-09-02T09:00:00.000Z', by: 'Amina Otieno', why: 'Dispute with the distributor' };

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    K('KP-1', 'Distributor Agreement — Nyanza', FOLDER_B, yearsAgo(12)),
    K('KP-2', 'Shelf placement — Quickmart', FOLDER_B, yearsAgo(3)),
    K('KP-3', 'Settlement Agreement — Rift Valley', FOLDER_B, yearsAgo(12), { hold: HOLD }),
    K('KP-4', 'Open-ended licence', FOLDER_B, null),
    K('KP-5', 'Retail supply — renewed', FOLDER_B, yearsAgo(12)),
    K('KP-5A', 'Retail supply — renewal', FOLDER_B, yearsAgo(2), { parentId: 'KP-5', relation: 'renewal', hash: 'h' }),
    K('KP-6', 'Cold-chain storage', FOLDER_B, yearsAgo(11)),
    K('KP-6X', 'Cold-chain storage — annex', FOLDER_B, null, { parentId: 'KP-6', relation: 'annex' }),
    K('KP-8', 'Media buying', FOLDER_B, yearsAgo(12)),
    K('KP-8X', 'Media buying — side letter', FOLDER_B, null, { parentId: 'KP-8', relation: 'annex', hold: HOLD }),
    K('KP-7', 'Packaging supply (2014)', FOLDER_A, yearsAgo(12)),
  ] });
});
after(async () => { if (h) await h.stop(); });

const book = () => W.admin.json('/api/keeping');

describe('f703 (1) an admin\'s alone', () => {
  test('a member is refused every route; only an admin\'s bootstrap carries it', async () => {
    assert.equal((await W.unrestricted.raw('/api/keeping')).status, 403);
    assert.equal((await W.unrestricted.raw('/api/keeping/' + FOLDER_B, { method: 'PUT', body: { years: 10 } })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/keeping/' + FOLDER_B + '/run', { method: 'POST', body: { act: 'delete', ids: ['KP-1'] } })).status, 403);
    assert.equal((await W.unrestricted.json('/api/bootstrap')).keeping, undefined);
    assert.deepEqual((await W.admin.json('/api/bootstrap')).keeping, { rules: {}, due: {} });
  });
});

describe('f703 (2) a period, and what it makes due', () => {
  test('only a period from the list', async () => {
    assert.equal((await W.admin.raw('/api/keeping/' + FOLDER_B, { method: 'PUT', body: { years: 11 } })).status, 400);
    assert.equal((await W.admin.raw('/api/keeping/nowhere', { method: 'PUT', body: { years: 10 } })).status, 200, 'a stream id is the company\'s list; an unknown one names nothing due');
    await W.admin.json('/api/keeping/nowhere', { method: 'PUT', body: { years: null } });
  });
  test('ten years, then listed for deletion: due is read off the stored book', async () => {
    const r = await W.admin.json('/api/keeping/' + FOLDER_B, { method: 'PUT', body: { years: 10, then: 'delete' } });
    assert.deepEqual(r.rules[FOLDER_B], { years: 10, then: 'delete' });
    const s = (await book()).streams[FOLDER_B];
    assert.deepEqual(s.due.map(d => d.id).sort(), ['KP-1', 'KP-6'], 'ended more than ten years ago, not on hold');
    assert.deepEqual(s.due.find(d => d.id === 'KP-6').family, ['KP-6X'], 'an agreement goes with what is filed under it');
    assert.deepEqual(s.held.map(x => x.id).sort(), ['KP-3', 'KP-8X'], 'what is on legal hold is listed');
    assert.equal(s.heldDue, 2, 'held back: one on hold, one whose side letter is');
    assert.equal(s.rule.years, 10);
    const boot = (await W.admin.json('/api/bootstrap')).keeping;
    assert.deepEqual(boot.due[FOLDER_B], { n: 2, then: 'delete' }, 'what Needs you reads');
  });
  test('the end as amended, and no end at all, are never due', async () => {
    const ids = (await book()).streams[FOLDER_B].due.map(d => d.id);
    assert.ok(!ids.includes('KP-5'), 'renewed two years ago: it ended two years ago');
    assert.ok(!ids.includes('KP-4') && !ids.includes('KP-2'));
  });
});

describe('f703 (3) the admin\'s yes', () => {
  test('only the act the stream keeps', async () => {
    const r = await W.admin.raw('/api/keeping/' + FOLDER_B + '/run', { method: 'POST', body: { act: 'archive', ids: ['KP-1'] } });
    assert.equal(r.status, 400);
  });
  test('deletes what is due, family and all, and refuses the rest', async () => {
    const r = await W.admin.json('/api/keeping/' + FOLDER_B + '/run', { method: 'POST', body: { act: 'delete', ids: ['KP-1', 'KP-6', 'KP-2', 'KP-3'] } });
    assert.deepEqual(r.done.sort(), ['KP-1', 'KP-6']);
    assert.deepEqual(r.refused.map(x => x.id).sort(), ['KP-2', 'KP-3']);
    for (const id of ['KP-1', 'KP-6', 'KP-6X']) assert.equal((await W.admin.raw('/api/contracts/' + id)).status, 404, id + ' is gone');
    for (const id of ['KP-2', 'KP-3', 'KP-8', 'KP-8X']) assert.equal((await W.admin.raw('/api/contracts/' + id)).status, 200, id + ' stays');
    assert.deepEqual(r.streams[FOLDER_B].due, [], 'nothing more is due');
  });
});

describe('f703 (4) nothing on legal hold is deleted or archived', () => {
  test('not by the delete door', async () => {
    const r = await W.admin.raw('/api/contracts/KP-3', { method: 'DELETE' });
    assert.equal(r.status, 409);
    assert.equal(r.json.legalHold, true);
  });
  test('not by a save that shelves it', async () => {
    const c = await W.admin.json('/api/contracts/KP-3');
    const v = c._v; delete c._v;
    c.archived = { at: new Date().toISOString(), by: 'Amina Otieno' };
    const r = await W.admin.raw('/api/contracts/KP-3', { method: 'PUT', body: { contract: c, baseVersion: v } });
    assert.equal(r.status, 409, r.text);
    assert.match(r.json.error, /legal hold/);
  });
});

describe('f703 (5) a stream kept archived', () => {
  test('the yes archives what is due, and it stays searchable on the shelf', async () => {
    await W.admin.json('/api/keeping/' + FOLDER_A, { method: 'PUT', body: { years: 10, then: 'archive' } });
    assert.deepEqual((await book()).streams[FOLDER_A].due.map(d => d.id), ['KP-7']);
    const r = await W.admin.json('/api/keeping/' + FOLDER_A + '/run', { method: 'POST', body: { act: 'archive', ids: ['KP-7'] } });
    assert.deepEqual(r.done, ['KP-7']);
    const c = await W.admin.json('/api/contracts/KP-7');
    assert.equal(c.archived.why, 'keeping');
    assert.match(c.audit[c.audit.length - 1].detail, /Past its keeping period \(10 years after it ended on/);
    assert.deepEqual(r.streams[FOLDER_A].due, [], 'archived is not due again');
  });
});

describe('f703 (6) the trail', () => {
  test('the period set, and every deletion with what it was', async () => {
    const t = (await W.admin.raw(`/api/trail/export?from=${utcToday()}&to=${utcToday()}&as=csv`)).text;
    assert.match(t, /"Amina Otieno","Keeping period set","sales: 10 years, then listed for an admin to delete"/);
    assert.match(t, /"Amina Otieno","Deleted after its keeping period","ended \d{4}-\d{2}-\d{2} · kept 10 years after it ended","KP-1","Distributor Agreement — Nyanza","Rift Valley Distributors","sales"/);
    assert.match(t, /"Deleted after its keeping period","ended [^"]+ · kept 10 years after it ended; with 1 filed under it","KP-6"/);
    assert.match(t, /"Amina Otieno","Archived","Past its keeping period/);
  });
});
