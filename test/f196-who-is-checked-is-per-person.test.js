/* ============================================================
   f196 — who is checked is per person

   The internal-review gate was one workspace-wide answer: either everybody's
   wording was looked at before it travelled, or nobody's was. That is the wrong
   shape for why anybody turns it on — a firm checks the new joiner and the
   contractor, not the head of legal — and it made the switch an all-or-nothing
   decision most workspaces answered "off".

   It is now a MASTER SWITCH with a per-person flag under it, a per-person
   standing reviewer, and a "somebody joining starts checked" default.

   THE MIGRATION IS THE MOST IMPORTANT THING IN THIS FILE. The absence of the
   flag means CHECKED, both in the browser and on the server, so:

     · a workspace with the gate already ON behaves exactly as it did this
       morning, because every existing record is absent;
     · a workspace with it OFF is untouched either way;
     · turning somebody off is a decision an admin makes on purpose, one
       person at a time, and it is a GRANT — a person who could turn their own
       check off is not checked.

   And the question is asked ONCE, in the predicate, rather than forked into
   every enforcement point: reviewGate, the send block, the readiness list, the
   banners and the server's own reading all inherit it from reviewGateApplies.
   The counterparty still never learns a review exists — reviewSeatShowsReview
   is untouched and is asserted here as the wall it has always been.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const S = require('../js/i18n.js').STRINGS.en;

const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/review.js'];

/* A contract with one unsent ask of ours, which is what the gate is about. */
const contract = () => ({
  id: 'MK-1', name: 'Supply', value: 90000000, status: 'Under Review',
  changes: [{ id: 'CHG-1', side: 'owner', status: 'pending', author: 'Asha Kimani',
    clauseId: 'c1', clauseLabel: '1. Payment', summary: 'Thirty days', sent: false }],
  review: { requests: [] }, audit: [],
});

function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const admin = { id: 'u_admin', name: 'Young Mbagaya', role: 'admin', email: 'a@h.test' };
  const asha = { id: 'u_ed', name: 'Asha Kimani', role: 'legal', email: 'asha@h.test' };
  const boss = { id: 'u_boss', name: 'Grace Njeri', role: 'legal', email: 'grace@h.test' };
  if (opts.uncheck) asha.reviewChecked = false;
  if (opts.reviewer) asha.reviewerId = boss.id;
  const users = [admin, asha, boss];
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, Promise, setTimeout: fn => { try { fn(); } catch (_) {} return 0; }, clearTimeout() {},
    document: win.document, localStorage: win.localStorage,
    esc: s => String(s == null ? '' : s), icon: () => '', toast() {},
    currentUser: () => (opts.as === 'admin' ? admin : asha),
    getUsers: () => users, isAdmin: () => opts.as === 'admin',
    roleName: r => r, saveSettings() {}, nowISO: () => '2026-08-13T00:00:00.000Z',
    fmtDT: v => String(v), canEdit: () => true,
    negoUnsentAsks: (c, side) => (c.changes || []).filter(x => x.side === (side === 'owner' ? 'owner' : 'counterparty') && !x.sent),
    contractHasDeviation: () => true,
    state: { contracts: [], view: 'redline',
      settings: { reviewGate: { on: opts.gate !== false, when: 'always', value: 0 } } },
    REMOTE: { me: admin, users },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return { sb, win, users, admin, asha, boss };
}

describe('f196 — the absence of the flag is the migration', () => {
  test('a record that says nothing is CHECKED — in the browser and on the server', () => {
    const { sb } = stage();
    assert.equal(sb.reviewChecked({}), true, 'absent');
    assert.equal(sb.reviewChecked({ reviewChecked: null }), true, 'null');
    assert.equal(sb.reviewChecked(null), true, 'nobody named at all');
    assert.equal(sb.reviewChecked({ reviewChecked: false }), false, 'and only an explicit false is off');
    /* The server keeps its own copy and it has to answer the same way. */
    const srv = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
    assert.match(srv, /const rvChecked = u => !\(u && u\.review_checked === 0\)/,
      'NULL is checked on the server too, or a workspace changes behaviour on deploy');
  });

  test('with the gate ON and nobody touched, the gate applies exactly as it did', () => {
    const { sb, asha } = stage();
    assert.equal(sb.reviewGateApplies(contract(), asha), true);
    const g = sb.reviewGate(contract());
    assert.equal(g.required, true, 'today\'s behaviour, preserved');
    assert.equal(g.ok, false, 'and it still refuses an unreviewed change');
  });

  test('with the gate OFF, an unchecked person changes nothing — there was nothing to change', () => {
    const on = stage({ gate: false });
    assert.equal(on.sb.reviewGateApplies(contract(), on.asha), false);
    const off = stage({ gate: false, uncheck: true });
    assert.equal(off.sb.reviewGateApplies(contract(), off.asha), false);
  });
});

describe('f196 — the per-person flag', () => {
  test('taking one person off the check lets THEIR wording through, and nobody else\'s', () => {
    const { sb, asha, boss } = stage({ uncheck: true });
    assert.equal(sb.reviewGateApplies(contract(), asha), false, 'the person who was taken off');
    assert.equal(sb.reviewGateApplies(contract(), boss), true, 'their colleague is untouched');
  });

  test('and the gate the screens read follows, because the question is asked in the predicate', () => {
    /* NOT FORKED INTO EVERY ENFORCEMENT POINT. reviewGate is what the banners,
       the send block and the readiness list all read. */
    const off = stage({ uncheck: true });
    const g = off.sb.reviewGate(contract());
    assert.equal(g.required, false, 'nothing required of somebody who is not checked');
    assert.equal(g.ok, true, 'so nothing is held');
    assert.equal(off.sb.reviewGateMessage(contract()), null, 'and there is no refusal to print');
  });

  test('the question is asked ONCE, in reviewGateApplies', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/review.js'), 'utf8');
    const uses = (src.match(/reviewChecked\(/g) || []).length;
    /* Its own definition, plus the one reading inside the predicate. Anything
       more is a second place this rule is decided. */
    assert.ok(uses <= 3, `reviewChecked is read ${uses} times — the predicate is the one place`);
    assert.match(src.slice(src.indexOf('function reviewGateApplies')), /reviewChecked\(who\)/);
  });

  test('the counterparty still never learns a review exists', () => {
    /* The wall is unchanged and it is asserted rather than assumed. */
    const { sb } = stage();
    assert.equal(sb.reviewSeatShowsReview({ side: 'counterparty' }), false);
    assert.equal(sb.reviewSeatShowsReview({ readonly: true }), false);
  });
});

describe('f196 — the standing reviewer is a convenience, not a binding', () => {
  test('it resolves to the named member, and to nothing when nobody is named', () => {
    const named = stage({ reviewer: true });
    assert.equal(named.sb.reviewStandingReviewerFor(named.asha).id, named.boss.id);
    const bare = stage();
    assert.equal(bare.sb.reviewStandingReviewerFor(bare.asha), null);
  });

  test('the ask dialog opens with them filled in — and the box is still ordinary text', () => {
    const named = stage({ reviewer: true });
    const html = named.sb.reviewAskModalHtml(contract());
    assert.match(html, /Grace Njeri/, 'their reviewer is in the box');
    assert.match(html, /id="rv-who" type="text"/, 'and it is a box, not a lock');
    const bare = stage();
    assert.ok(!/Grace Njeri/.test(bare.sb.reviewAskModalHtml(contract())),
      'with nobody named it opens empty, as it always did');
  });

  test('the unchecked are NAMED for the admin, not counted at them', () => {
    const { sb } = stage({ uncheck: true });
    const off = sb.reviewUncheckedPeople();
    assert.deepEqual(Array.from(off.map(u => u.name)), ['Asha Kimani']);
  });

  test('"somebody joining starts checked" is on by default and survives a save', () => {
    const { sb } = stage();
    assert.equal(sb.reviewGateCfg().newChecked, true, 'the safe answer is the default');
    sb.saveReviewGateCfg({ on: true, when: 'always', value: 0, newChecked: false });
    assert.equal(sb.reviewGateCfg().newChecked, false);
    /* A save that does not mention it must not silently turn it back on. */
    sb.saveReviewGateCfg({ on: true, when: 'deviation', value: 0 });
    assert.equal(sb.reviewGateCfg().newChecked, false, 'an unmentioned setting is not a reset');
  });
});

/* ============================================================
   THE SERVER
   ============================================================ */
let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

describe('f196 — the server holds the same rule and the same grant', () => {
  test('the flag and the reviewer round-trip, and absent stays absent', async () => {
    const id = W.users.unrestricted.id;
    let r = await W.admin.json('/api/bootstrap');
    assert.equal(r.users.find(u => u.id === id).reviewChecked, null,
      'absent travels as absent — a server that filled in a default would be a second place this is decided');
    r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { reviewChecked: false } });
    assert.equal(r.user.reviewChecked, false);
    r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { reviewerId: W.users.restricted.id } });
    assert.equal(r.user.reviewerId, W.users.restricted.id);
    r = await W.admin.json('/api/users/' + id, { method: 'PATCH', body: { reviewChecked: null, reviewerId: null } });
    assert.equal(r.user.reviewChecked, null);
    assert.equal(r.user.reviewerId, null);
  });

  test('a member cannot take themselves off the check — a person who could is not checked', async () => {
    const r = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { reviewChecked: false } });
    assert.equal(r.status, 403);
    const smuggled = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { title: 'Fine', reviewChecked: false } });
    assert.equal(smuggled.status, 403, 'and not beside a job title either');
    const named = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id,
      { method: 'PATCH', body: { reviewerId: W.users.restricted.id } });
    assert.equal(named.status, 403, 'nor can they name their own reviewer');
  });

  test('a reviewer who is not a member, or is themselves, or is a Viewer, is refused', async () => {
    const id = W.users.unrestricted.id;
    const ghost = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { reviewerId: 'u_nobody' } });
    assert.equal(ghost.status, 400);
    const self = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { reviewerId: id } });
    assert.equal(self.status, 400, 'nobody reviews their own work');
    const viewer = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Reads Only', email: 'reads@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
    const asViewer = await W.admin.raw('/api/users/' + id, { method: 'PATCH', body: { reviewerId: viewer.user.id } });
    assert.equal(asViewer.status, 400, 'a Viewer cannot rule on a change');
  });

  test('the gate reading takes the sender, and a caller with nobody to name keeps the old answer', () => {
    const src = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
    assert.match(src, /function rvGateApplies\(c, u\)/, 'the predicate takes the person');
    assert.match(src, /if \(u !== undefined && !rvChecked\(u\)\)/,
      'undefined means "no particular person" and keeps the workspace-wide reading');
    assert.match(src, /rvUnreviewedIds\(rvStored, req\.user\)/, 'and the share route names the sender');
  });
});
