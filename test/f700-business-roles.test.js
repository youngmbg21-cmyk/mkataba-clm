/* f700 — BUSINESS ROLES (owner picked "A role at the top of the drawer — the
   SAP way", 17 Oct 2026; piece 6 of the sensitive contracts and governance
   plan)

   The drawer's half (choosing a role fills the person's drawer, the extras,
   the Roles page saying who a change reaches) is asked in a real browser by
   business-roles-verify. This file asks the server:
     1 · only an admin reads or writes roles, and only an admin's bootstrap
         carries them — the settings every member receives never do
     2 · a role is cleaned to one shape: a Viewer role brings no editing
         grants, a name is needed and never used twice, a cap of thirty
     3 · a person's role is put on and taken off, never on an admin, and every
         change is recorded — and is an act in the trail export
     4 · a role taken away leaves its holders their rights, only the name
         comes off (recorded)
     5 · a role is only a name: holding one changes no right on the server

   Run: node --test test/f700-business-roles.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { approvalRules: [] });
});
after(async () => { if (h) await h.stop(); });

const FINANCE = { id: 'fin', name: 'Finance', sys: 'legal', values: true, cap: 5000000, streams: ['proc', 'sales'], checked: true, paper: false, refile: false, hold: true };
const today = () => new Date().toISOString().slice(0, 10);

describe('f700 (1) an admin\'s alone', () => {
  test('a member is refused every route', async () => {
    assert.equal((await W.unrestricted.raw('/api/business-roles')).status, 403);
    assert.equal((await W.unrestricted.raw('/api/business-roles', { method: 'PUT', body: { roles: [] } })).status, 403);
    assert.equal((await W.unrestricted.raw('/api/business-roles/holder', { method: 'PUT', body: { userId: W.users.unrestricted.id, roleId: null } })).status, 403);
  });
  test('only an admin\'s bootstrap carries them, and never inside the settings everyone receives', async () => {
    await W.admin.json('/api/business-roles', { method: 'PUT', body: { roles: [FINANCE] } });
    const a = await W.admin.json('/api/bootstrap');
    assert.equal(a.bizRoles.roles[0].name, 'Finance');
    const m = await W.unrestricted.json('/api/bootstrap');
    assert.equal(m.bizRoles, undefined);
    assert.equal(JSON.stringify(m.settings).includes('Finance'), false);
  });
});

describe('f700 (2) one shape', () => {
  test('a Viewer role brings no editing grant, whatever was sent', async () => {
    const r = await W.admin.json('/api/business-roles', { method: 'PUT', body: { roles: [FINANCE,
      { id: 'aud', name: '  Auditors ', sys: 'viewer', values: false, cap: 9, streams: [], checked: true, paper: true, refile: true, hold: true, junk: 1 }] } });
    const aud = r.roles.find(x => x.id === 'aud');
    assert.deepEqual(aud, { id: 'aud', name: 'Auditors', sys: 'viewer', values: false, cap: null, streams: 'all', checked: false, paper: false, refile: false, hold: false });
    assert.deepEqual(r.roles.find(x => x.id === 'fin').streams, ['proc', 'sales']);
  });
  test('no name, the same name twice, or a thirty-first role is refused', async () => {
    const put = roles => W.admin.raw('/api/business-roles', { method: 'PUT', body: { roles } });
    assert.equal((await put([{ id: 'x', name: '' }])).status, 400);
    assert.equal((await put([FINANCE, { ...FINANCE, id: 'fin2', name: 'finance' }])).status, 400);
    assert.equal((await put(Array.from({ length: 31 }, (_, i) => ({ id: 'r' + i, name: 'Role ' + i })))).status, 400);
    assert.equal((await W.admin.json('/api/business-roles')).roles.length, 2, 'a refusal changes nothing');
  });
});

describe('f700 (3) a person\'s role, recorded', () => {
  test('put on, never on an admin, never a role that does not exist', async () => {
    const r = await W.admin.json('/api/business-roles/holder', { method: 'PUT', body: { userId: W.users.unrestricted.id, roleId: 'fin' } });
    assert.equal(r.of[W.users.unrestricted.id], 'fin');
    const me = (await W.admin.json('/api/bootstrap')).me;
    assert.equal((await W.admin.raw('/api/business-roles/holder', { method: 'PUT', body: { userId: me.id, roleId: 'fin' } })).status, 400);
    assert.equal((await W.admin.raw('/api/business-roles/holder', { method: 'PUT', body: { userId: W.users.restricted.id, roleId: 'nope' } })).status, 400);
    assert.equal((await W.admin.raw('/api/business-roles/holder', { method: 'PUT', body: { userId: 'u_nobody', roleId: 'fin' } })).status, 404);
  });
  test('every change is an act in the trail', async () => {
    const t = await W.admin.raw(`/api/trail/export?from=${today()}&to=${today()}&as=csv`);
    assert.match(t.text, /"Amina Otieno","Business role changed","Unrestricted Legal: none to Finance"/);
  });
});

describe('f700 (4) a role taken away', () => {
  test('its holders keep their rights; only the name comes off, recorded', async () => {
    const before = (await W.admin.json('/api/bootstrap')).users.find(u => u.id === W.users.unrestricted.id);
    const r = await W.admin.json('/api/business-roles', { method: 'PUT', body: { roles: [] } });
    assert.deepEqual(r.of, {});
    const after = (await W.admin.json('/api/bootstrap')).users.find(u => u.id === W.users.unrestricted.id);
    assert.deepEqual(after, before, 'not one right moved');
    const t = await W.admin.raw(`/api/trail/export?from=${today()}&to=${today()}&as=csv`);
    assert.match(t.text, /"Unrestricted Legal: Finance to none"/);
  });
});

describe('f700 (5) only a name', () => {
  test('holding a role changes no right on the server', async () => {
    await W.admin.json('/api/business-roles', { method: 'PUT', body: { roles: [FINANCE] } });
    const was = (await W.admin.json('/api/bootstrap')).users.find(u => u.id === W.users.restricted.id);
    await W.admin.json('/api/business-roles/holder', { method: 'PUT', body: { userId: W.users.restricted.id, roleId: 'fin' } });
    const now = (await W.admin.json('/api/bootstrap')).users.find(u => u.id === W.users.restricted.id);
    assert.deepEqual(now, was, 'the rights are written by the drawer, right by right, never by the name');
  });
});
