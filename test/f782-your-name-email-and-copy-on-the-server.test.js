'use strict';
/* f782 — YOUR NAME, YOUR EMAIL AND YOUR COPY, ON THE SERVER (round 24 "One
   sheet" as drawn, the gaps of 18 Oct 2026: Name · Change, Email · Change,
   "Your data · A copy of everything you can see · The download is
   recorded"). THE SERVER IS THE WALL.
     (1) a member changes their OWN name (unique), never anybody else's, and
         never their own role; the change is in the trail
     (2) POST /api/me/email: the person by their session, their current
         password (a wrong one is a wrong guess), a real address, nobody
         else's; they sign in with the new one; the change is in the trail
     (3) GET /api/me/copy: what this person may read and nothing more — their
         stream wall, their money — recorded in the trail before it leaves
   AT THE PARENT (8dc306a) every test here fails but 1b: the wall that keeps a
   colleague's name and your own role out of reach was already there.
   Run: node --test test/f782-your-name-email-and-copy-on-the-server.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let h, w;
before(async () => { h = await H.startHati(); w = await H.seedWorkspace(h, { approvalRules: [] }); });
after(async () => { if (h) await h.stop(); });

const trail = async () => {
  const r = await w.admin.raw('/api/trail/export?from=2026-01-01&to=2099-12-31&as=csv');
  return String(r.text || '');
};

describe('f782 (1) a member changes their own name', () => {
  test('1a their own: saved, unique, recorded', async () => {
    const id = w.users.unrestricted.id;
    const r = await w.unrestricted.json('/api/users/' + id, { method: 'PATCH', body: { name: 'Wanjiku Unrestricted' } });
    assert.equal(r.user.name, 'Wanjiku Unrestricted');
    const clash = await w.unrestricted.raw('/api/users/' + id, { method: 'PATCH', body: { name: 'Amina Otieno' } });
    assert.equal(clash.status, 409, 'another member\'s name is refused');
    const csv = await trail();
    assert.match(csv, /Name changed[^\n]*Unrestricted Legal to Wanjiku Unrestricted/);
  });
  test('1b never a colleague\'s name, never their own role', async () => {
    const other = await w.unrestricted.raw('/api/users/' + w.users.restricted.id, { method: 'PATCH', body: { name: 'Not Mine' } });
    assert.equal(other.status, 403);
    const role = await w.unrestricted.raw('/api/users/' + w.users.unrestricted.id, { method: 'PATCH', body: { name: 'X Y', role: 'admin' } });
    assert.equal(role.status, 403);
  });
});

describe('f782 (2) POST /api/me/email', () => {
  test('2a a wrong password is refused, and nothing moves', async () => {
    const r = await w.novalues.raw('/api/me/email', { method: 'POST', body: { email: 'nv@example.co.ke', current: 'not-the-password' } });
    assert.equal(r.status, 400);
    const boot = await w.novalues.json('/api/bootstrap');
    assert.equal(boot.me.email, 'novalues@example.co.ke');
  });
  test('2b not an address, or another member\'s, is refused', async () => {
    const bad = await w.novalues.raw('/api/me/email', { method: 'POST', body: { email: 'nope', current: 'their-own-pass-9' } });
    assert.equal(bad.status, 400);
    const taken = await w.novalues.raw('/api/me/email', { method: 'POST', body: { email: 'ADMIN@example.co.ke', current: 'their-own-pass-9' } });
    assert.equal(taken.status, 409);
  });
  test('2c with the password: changed, signs in with the new one, recorded; the body cannot name somebody else', async () => {
    const r = await w.novalues.json('/api/me/email', { method: 'POST', body: { email: 'NV.New@Example.co.ke', current: 'their-own-pass-9', id: w.users.restricted.id } });
    assert.equal(r.user.email, 'nv.new@example.co.ke');
    assert.equal(r.user.id, w.users.novalues.id, 'the person is the session\'s, never the body\'s');
    const c = h.client('nv-again');
    const ok = await c.raw('/api/login', { method: 'POST', body: { email: 'nv.new@example.co.ke', password: 'their-own-pass-9' } });
    assert.equal(ok.status, 200);
    const old = await h.client('nv-old').raw('/api/login', { method: 'POST', body: { email: 'novalues@example.co.ke', password: 'their-own-pass-9' } });
    assert.equal(old.status, 401);
    assert.match(await trail(), /Email changed[^\n]*novalues@example\.co\.ke to nv\.new@example\.co\.ke/);
  });
});

describe('f782 (3) GET /api/me/copy', () => {
  test('3a inside the stream wall: the restricted member gets their stream only; recorded first', async () => {
    const r = await w.restricted.raw('/api/me/copy');
    assert.equal(r.status, 200);
    assert.match(String(r.headers.get('content-disposition') || ''), /attachment; filename="hati-my-copy-/);
    const body = JSON.parse(r.text);
    assert.equal(body.kind, 'hati-copy');
    const ids = body.contracts.map(c => c.id).sort();
    assert.deepEqual(ids, ['MK-A1', 'MK-A2']);
    assert.deepEqual(H.mentionsFolderB(r.text), [], 'nothing of the stream they may not open');
    assert.match(await trail(), /Took a copy of what they can see[^\n]*2 contracts/);
  });
  test('3b a member without the money gets no money', async () => {
    const r = await w.novalues.raw('/api/me/copy');
    const body = JSON.parse(r.text);
    assert.ok(body.contracts.length >= 1);
    assert.ok(body.contracts.every(c => c.value == null || c.value === 0 || c._valuesHidden), 'values hidden');
  });
});

/* ---- THE SECOND PASS (18 Oct 2026), owner's answer 12: HaTi records the
   day each clash in who may do what is first seen, on the server, and forgets
   it when the clash goes away. AT THE PARENT (8dc306a) every test below fails. ---- */
describe('f782 (4) POST /api/clashes/seen — the day a clash was first seen', () => {
  const today = () => new Date().toISOString().slice(0, 10);
  test('4a an admin\'s: a member is refused, and the bootstrap carries the days to admins only', async () => {
    let refused = null;
    try { await w.restricted.json('/api/clashes/seen', { method: 'POST', body: { keys: ['clash:cap:u_1'] } }); } catch (e) { refused = e; }
    assert.equal(refused && refused.status, 403, 'a member may not write it');
    const mine = await w.restricted.json('/api/bootstrap');
    assert.equal(mine.clashSeen, undefined, 'nor read it');
  });
  test('4b a new clash is stamped with the server\'s day; one still there keeps it; one gone is forgotten; nonsense is not kept', async () => {
    const a = await w.admin.json('/api/clashes/seen', { method: 'POST', body: { keys: ['clash:cap:u_1', 'clash:each:u_1|u_2', 'not a clash', '<b>'] } });
    assert.deepEqual(Object.keys(a.seen).sort(), ['clash:cap:u_1', 'clash:each:u_1|u_2']);
    /* the server's day: never a stale one, and a run across midnight still holds */
    const d = a.seen['clash:cap:u_1'];
    assert.match(d, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(Math.abs(Date.parse(d + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) <= 864e5, 'today, as the server counts it');
    const b = await w.admin.json('/api/clashes/seen', { method: 'POST', body: { keys: ['clash:cap:u_1'] } });
    assert.deepEqual(b.seen, { 'clash:cap:u_1': a.seen['clash:cap:u_1'] }, 'kept its day; the other forgotten');
    const boot = await w.admin.json('/api/bootstrap');
    assert.deepEqual(boot.clashSeen, b.seen, 'the admin\'s bootstrap carries it');
  });
  test('4c a list, and not an endless one', async () => {
    let bad = null;
    try { await w.admin.json('/api/clashes/seen', { method: 'POST', body: { keys: 'clash:cap:u_1' } }); } catch (e) { bad = e; }
    assert.equal(bad && bad.status, 400, 'not a list: refused, by the route');
    let many = null;
    try { await w.admin.json('/api/clashes/seen', { method: 'POST', body: { keys: Array.from({ length: 201 }, (_, i) => 'clash:cap:u_' + i) } }); } catch (e) { many = e; }
    assert.equal(many && many.status, 400, 'more than 200: refused, by the route');
  });
});
