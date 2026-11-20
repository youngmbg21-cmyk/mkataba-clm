/* ═══════════════════════════════════════════════════════════════════════════
   f1122 — A VIEWER READS THE REDLINES, AND ANSWERS NOTHING (owner, 20 Nov
   2026: "fix the Redlines page for viewers too")

   After f1121 took the work off a Viewer's Needs you, the Redlines page itself
   still drew Accept, Reject and Counter for them. And a Reader on a
   negotiation, though the page already held their hands, could still answer
   the other side's asks with a save of their own: the server stopped them
   touching OUR changes only.

   WHAT THIS PINS
     (1) rlOnlyReads: a company Viewer, never their own page, never a member
     (2) the page's one settings builder (rlBenchOpts — the Redlines page and
         Jambo's Redlines face both ask it) is read-only for a Viewer and says
         why, both books
     (3) the server: a Reader's save that accepts or rejects THEIR change is
         refused and writes nothing; the lead's passes; a Reader's save that
         leaves their asks alone still passes
   AT THE PARENT (5936302) 5 of 7 FAIL: no rlOnlyReads, the builder asks only
   the seal and the preview, and the Reader's accept and reject saved (200).
   2b and 3c pass there by design: they guard what must not move (both hosts
   ask the one builder; the lead and a Reader's plain save still go through).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, seedWorkspace } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = R('js/views/negotiation.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

describe('f1122 (1) who only reads', () => {
  const ask = (me, extra) => { const ctx = { currentUser: () => me, ...(extra || {}) }; ctx.window = ctx; vm.createContext(ctx);
    vm.runInContext(fnBody(NEGO, 'rlOnlyReads'), ctx); return ctx.rlOnlyReads(); };
  test('1a a company Viewer only reads; a member and an admin do not; their own page never', () => {
    assert.ok(fnBody(NEGO, 'rlOnlyReads'), 'rlOnlyReads exists');
    assert.equal(ask({ id: 'v', role: 'viewer' }), true);
    assert.equal(ask({ id: 'l', role: 'legal' }), false);
    assert.equal(ask({ id: 'a', role: 'admin' }), false);
    assert.equal(ask(null), false);
    assert.equal(ask({ id: 'v', role: 'viewer' }, { PORTAL_MODE: true }), false);
  });
});

describe('f1122 (2) the Redlines page, and Jambo\'s face, are read-only for a Viewer', () => {
  const b = strip(fnBody(NEGO, 'rlBenchOpts'));
  test('2a the one builder asks it, beside the seal', () => {
    assert.match(b, /const onlyReads = !previewing && rlOnlyReads\(\);/);
    assert.match(b, /readonly: previewing \|\| onlyReads \|\|/);
    assert.match(b, /onlyReads \? i18t\('rl_viewer_why'\)/);
  });
  test('2b both the page and the face are built by it', () => {
    assert.match(R('js/paperdesk.js'), /rlBenchOpts\(c, \{ side, hostId: 'pd-redface'/);
    assert.match(NEGO, /const opts = rlBenchOpts\(c, \{ side \}\);/);
  });
  test('2c the why is said, in both books', () => {
    assert.equal((I18N.match(/^\s+rl_viewer_why:/gm) || []).length, 2);
  });
});

describe('f1122 (3) the server: a Reader answers none of their asks', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });
  const put = (client, c, baseVersion) => client.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion } });
  const theirs = status => ({ id: 'CHG-T1', clauseId: 'cl_x', authorSide: 'counterparty', author: 'Them', status, hash: 'ttt', summary: 'their ask', at: '2026-08-02T09:00:00.000Z' });
  const withDesk = (id, lead) => ({ id, name: 'Desk Fixture', counterparty: 'Nordfrakt Logistik AB', status: 'Under Review', template: 'WH', folder: 'proc',
    value: 1000000, fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [theirs('pending')],
    desk: { by: lead.name, byId: lead.id, openedAt: '2026-08-01T09:00:00.000Z', leadId: lead.id, leadName: lead.name, leadSince: '2026-08-01T09:00:00.000Z', contributors: [], joinRequests: [], closedAt: null } });
  const setRule = on => W.admin.json('/api/settings', { method: 'PUT', body: { deskRule: { on } } });

  test('3a a Reader accepting their change is refused, and nothing is written', async () => {
    await setRule(true);
    const c = withDesk('MK-V1', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200, 'the fixture saves');
    const r = await put(W.restricted, { ...c, changes: [theirs('accepted')] }, 1);
    assert.equal(r.status, 403);
    assert.match(r.text, /not on this negotiation/);
    const stored = await W.admin.json('/api/contracts/MK-V1');
    assert.equal(stored.changes[0].status, 'pending');
  });
  test('3b rejecting it is refused too', async () => {
    await setRule(true);
    const c = withDesk('MK-V2', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200);
    assert.equal((await put(W.restricted, { ...c, changes: [theirs('rejected')] }, 1)).status, 403);
  });
  test('3c the lead answers; a Reader\'s save that leaves their asks alone passes', async () => {
    await setRule(true);
    const c = withDesk('MK-V3', W.users.unrestricted);
    assert.equal((await put(W.admin, c, 0)).status, 200);
    assert.equal((await put(W.restricted, { ...c, expiry: '2027-12-31' }, 1)).status, 200, 'reading is not working, but a date is not an answer');
    assert.equal((await put(W.unrestricted, { ...c, expiry: '2027-12-31', changes: [theirs('accepted')] }, 2)).status, 200, 'the lead answers');
  });
});
