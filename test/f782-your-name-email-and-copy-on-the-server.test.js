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
  /* RE-POINTED (the gaps' third pass, 19 Oct 2026): the server FINDS the
     clashes itself (js/clashkeys.js's clashFind, the page's own reading) after
     any write that could make or end one — so a clash made while no admin
     looks is stamped the day it is made; a list a browser sends is no longer
     the source (the server is the wall) */
  const seenNow = async () => (await w.admin.json('/api/bootstrap')).clashSeen || {};
  const until = async (ok, ms = 5000) => { const end = Date.now() + ms; let v; while (Date.now() < end){ v = await seenNow(); if (ok(v)) return v; await new Promise(r => setTimeout(r, 150)); } return v; };
  test('4b a clash made by a write is stamped with the server\'s day, with no page open; mended, it is forgotten', async () => {
    const R = w.users.restricted.id, U = w.users.unrestricted.id, key = 'clash:cap:' + R;
    const boot = await w.admin.json('/api/bootstrap');
    await w.admin.json('/api/settings', { method: 'PUT', body: { ...(boot.settings || {}), signCap: { on: true } } });
    await w.admin.json('/api/users/' + U, { method: 'PATCH', body: { signCap: 5000000 } });
    await w.admin.json('/api/users/' + R, { method: 'PATCH', body: { signCap: 10000000, overseerOn: 'always', overseerId: U } });
    const a = await until(v => !!v[key]);
    assert.ok(a[key], 'stamped without anybody asking: ' + JSON.stringify(a));
    assert.ok(Math.abs(Date.parse(a[key] + 'T12:00:00Z') - Date.parse(today() + 'T12:00:00Z')) <= 864e5, 'today, as the server counts it');
    /* a page that asks keeps the day */
    const b = await w.admin.json('/api/clashes/seen', { method: 'POST', body: {} });
    assert.equal(b.seen[key], a[key], 'kept its day');
    await w.admin.json('/api/users/' + R, { method: 'PATCH', body: { signCap: 5000000 } });
    const c = await until(v => !v[key]);
    assert.equal(c[key], undefined, 'mended: forgotten');
  });
  test('4c a list a browser sends is not kept: the server reads for itself', async () => {
    const r = await w.admin.json('/api/clashes/seen', { method: 'POST', body: { keys: ['clash:cap:u_1', 'clash:each:u_1|u_2', '<b>'] } });
    assert.equal(r.seen['clash:cap:u_1'], undefined);
    assert.equal(r.seen['clash:each:u_1|u_2'], undefined);
    assert.equal(r.seen['<b>'], undefined);
  });
});
