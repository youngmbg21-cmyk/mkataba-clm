'use strict';
/* f783 — THE FACTS THE DRAWINGS SAY, KEPT BY THE SERVER (rounds 24, 25 and
   26 as drawn, the gaps of 18 Oct 2026)
     (1) when a password last changed ("Changed 2 Aug 2026") and who set a
         person's role ("— set by Sara"): kept from now on, the person's own
         and an admin's, never a colleague's
     (2) the person's own business role's name rides their own record
         ("Legal counsel · Editor")
     (3) everyone's stand-in, for an admin only (Who holds what: "away until
         Fri · Maria answers")
     (4) a held contract carries its party and the day it ended (the
         stream's side panel: "Ended 30 Nov 2015 · on legal hold since …")
     (5) every trail download says how many acts it carried
   AT THE PARENT (8dc306a) (1a), (1b), (2)–(4) fail; (1c) the colleague's wall
   and (5) the count the server already kept pass, held here as walls.
   Run: node --test test/f783-the-facts-the-drawings-say.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const H = require('./helpers');

let h, w, adminId;
const old = (id, name, cp, extra) => ({ ...H.fixtureContract(id, name, cp, 'sales', 1200000, 'Signed'), ...extra });
before(async () => {
  h = await H.startHati();
  w = await H.seedWorkspace(h, { approvalRules: [], contracts: H.FIXTURES.concat([
    old('MK-S3', 'Settlement agreement', 'Vastkust Retail Ltd', { expiry: '2014-11-30', hold: { at: '2026-09-02T09:00:00.000Z', by: 'Amina Otieno', why: 'A dispute' } }),
  ]) });
  adminId = (await w.admin.json('/api/bootstrap')).me.id;
});
after(async () => { if (h) await h.stop(); });

describe('f783 (1) the password\'s day and who set the role', () => {
  test('1a a password changed now is dated; the member\'s own record says so', async () => {
    const boot = await w.restricted.json('/api/bootstrap');
    assert.match(String(boot.me.pwAt || ''), /^\d{4}-\d\d-\d\dT/, 'seedWorkspace changed it on first sign-in');
  });
  test('1b who set the role: the admin who made the account, and who changed it', async () => {
    const boot = await w.restricted.json('/api/bootstrap');
    assert.equal(boot.me.roleBy, 'Amina Otieno');
    await w.admin.json('/api/users/' + w.users.novalues.id, { method: 'PATCH', body: { role: 'viewer' } });
    const nv = (await w.admin.json('/api/bootstrap')).users.find(u => u.id === w.users.novalues.id);
    assert.equal(nv.roleBy, 'Amina Otieno');
  });
  test('1c a colleague never reads either', async () => {
    const boot = await w.restricted.json('/api/bootstrap');
    const col = boot.users.find(u => u.id === w.users.unrestricted.id);
    assert.ok(!('pwAt' in col) && !('roleBy' in col), JSON.stringify(Object.keys(col)));
  });
});

describe('f783 (2) the person\'s own business role, on their own record', () => {
  test('2a "Legal counsel" rides their bootstrap, never a colleague\'s', async () => {
    await w.admin.json('/api/business-roles', { method: 'PUT', body: { roles: [{ id: 'counsel', name: 'Legal counsel', sys: 'legal' }] } });
    await w.admin.json('/api/business-roles/holder', { method: 'PUT', body: { userId: w.users.unrestricted.id, roleId: 'counsel' } });
    const mine = await w.unrestricted.json('/api/bootstrap');
    assert.equal(mine.me.bizRole, 'Legal counsel');
    const theirs = await w.restricted.json('/api/bootstrap');
    assert.equal(theirs.me.bizRole, null);
    assert.equal(theirs.bizRoles, undefined, 'the book stays an admin\'s');
  });
});

describe('f783 (3) everyone\'s stand-in, for an admin only', () => {
  test('3a an admin reads everyone\'s; a member reads their own and whom they cover', async () => {
    const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
    await w.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: adminId, from: day(0), to: day(4) } });
    const a = await w.admin.json('/api/bootstrap');
    assert.ok(Array.isArray(a.away.everyone) && a.away.everyone.some(r => r.userId === w.users.unrestricted.id && r.deputyId === adminId));
    const m = await w.restricted.json('/api/bootstrap');
    assert.equal(m.away.everyone, undefined);
  });
});

describe('f783 (4) a held contract says its party and when it ended', () => {
  test('4a the keeping book\'s held row', async () => {
    const k = await w.admin.json('/api/keeping');
    const held = ((k.streams.sales || {}).held || []).find(x => x.id === 'MK-S3');
    assert.ok(held, 'held');
    assert.equal(held.counterparty, 'Vastkust Retail Ltd');
    assert.equal(held.ended, '2014-11-30');
    assert.equal(held.by, 'Amina Otieno');
  });
});

describe('f783 (5) a trail download says how many acts it carried', () => {
  test('5a recorded with the download, listed with it', async () => {
    await w.admin.raw('/api/trail/export?from=2026-01-01&to=2099-12-31&as=csv');
    const l = await w.admin.json('/api/trail/exports');
    assert.equal(typeof l.exports[0].acts, 'number');
    assert.ok(l.exports[0].acts > 0);
  });
});
