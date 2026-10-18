/* f729 — KEEPING: A PRIVATE STREAM NO ADMIN CAN SEE (the owner's yes, 18 Oct
   2026, to round 26's open question)

   A private stream's contracts are read only by the people it names, admins
   too. Where no admin is named, its contracts past their keeping period were
   never listed for anybody. Now an admin is told — Needs your attention — that
   such a stream has contracts due and names no admin, and nothing of them:
     1 · the stream is named in the admin's bootstrap and in GET /api/keeping
         (`unseen`), with no count and no contract's id, name or party
     2 · a stream with nothing due, or with no keeping rule, is not named
     3 · naming an admin on the stream ends it: the stream leaves `unseen`
         and its contracts come into that admin's own Ready to delete
     4 · a member is still refused the keeping route
   AT THE PARENT (main before this change) 1, 2 and 3 FAIL.
   Run: node --test test/f729-keeping-the-stream-no-admin-sees.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

/* days counted from today, so the answer never depends on the day it runs */
const yearsAgo = y => { const t = new Date(); t.setFullYear(t.getFullYear() - y);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const K = (id, name, folder, end) => ({ ...fixtureContract(id, name, 'Board Counsel LLP', folder, 1e6, 'Signed'), expiry: end, metadata: { value: 1e6, currency: 'KES' } });

let h, W, ids;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { approvalRules: [], contracts: [
    K('BD-1', 'Board minutes retainer (2012)', FOLDER_B, yearsAgo(12)),
    K('BD-2', 'Board advisory (recent)', FOLDER_B, yearsAgo(1)),
    K('OP-1', 'Packaging supply (2013)', FOLDER_A, yearsAgo(12)),
  ] });
  ids = { admin: (await W.admin.json('/api/bootstrap')).me.id, ...Object.fromEntries(Object.entries(W.users).map(([k, u]) => [k, u.id])) };
  /* the rules are set while the streams are open, then both are closed to one
     member: FOLDER_B has a contract due, FOLDER_A (kept fifteen years) none */
  await W.admin.json('/api/keeping/' + FOLDER_B, { method: 'PUT', body: { years: 10, then: 'delete' } });
  await W.admin.json('/api/keeping/' + FOLDER_A, { method: 'PUT', body: { years: 15, then: 'delete' } });
  await W.admin.json('/api/private-streams/' + FOLDER_B, { method: 'PUT', body: { on: true, ids: [ids.unrestricted] } });
  await W.admin.json('/api/private-streams/' + FOLDER_A, { method: 'PUT', body: { on: true, ids: [ids.unrestricted] } });
});
after(async () => { if (h) await h.stop(); });

describe('f729 (1) the admin is told, and told nothing of the contracts', () => {
  test('bootstrap and the keeping route name the stream', async () => {
    const boot = (await W.admin.json('/api/bootstrap')).keeping;
    assert.deepEqual(boot.unseen, [FOLDER_B]);
    assert.equal(boot.due[FOLDER_B], undefined, 'the admin cannot see its contracts, so none is listed as theirs to decide');
    const k = await W.admin.json('/api/keeping');
    assert.deepEqual(k.unseen, [FOLDER_B]);
    const said = JSON.stringify({ boot, k });
    for (const leak of ['BD-1', 'BD-2', 'OP-1', 'Board minutes', 'Board advisory', 'Packaging supply', 'Board Counsel'])
      assert.ok(!said.includes(leak), leak + ' never leaves the server');
  });
});

describe('f729 (2) only a stream with something due and a rule', () => {
  test('a private stream that names no admin but has nothing due: not named', async () => {
    const k = await W.admin.json('/api/keeping');
    assert.ok(!k.unseen.includes(FOLDER_A), 'ended twelve years ago, kept fifteen: nothing due');
  });
});

describe('f729 (3) naming an admin ends it', () => {
  test('the stream leaves unseen and comes into the admin\'s own Ready to delete', async () => {
    await W.admin.json('/api/private-streams/' + FOLDER_B, { method: 'PUT', body: { on: true, ids: [ids.unrestricted, ids.admin] } });
    const boot = (await W.admin.json('/api/bootstrap')).keeping;
    assert.deepEqual(boot.unseen, []);
    assert.deepEqual(boot.due[FOLDER_B], { n: 1, then: 'delete' });
  });
});

describe('f729 (4) still an admin\'s alone', () => {
  test('a member is refused', async () => {
    assert.equal((await W.unrestricted.raw('/api/keeping')).status, 403);
    assert.equal((await W.unrestricted.json('/api/bootstrap')).keeping, undefined);
  });
});
