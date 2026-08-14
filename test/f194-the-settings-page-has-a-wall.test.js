/* ============================================================
   f194 — the settings page is admin-only, and the WALL is the server

   Settings & Rules became admin-only in the browser: the nav item is hidden,
   the avatar goes somewhere else, and renderTeam draws a non-admin their own
   account page. Every one of those is a decision about PIXELS. A colleague
   with a browser console, or an old tab left open on the page before the
   change, reaches the routes directly.

   So this file does not open a page. It signs in as an ordinary member — the
   'legal' role, the most powerful non-admin there is — and posts, puts and
   deletes at every route the settings page writes to, one at a time, asking
   the server itself.

   AND IT ASKS THE OTHER HALF TOO, because a wall that refuses everybody is not
   a wall, it is an outage: the things a non-admin is SUPPOSED to be able to do
   from their new account surface — their own job title, their own sessions —
   must still work, and must still be scoped to them.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

/* Every route the page writes to that must belong to an admin alone. Written
   as the request a person would actually make, so a refusal here is a refusal
   of the real thing rather than of a malformed body. */
const ADMIN_ONLY = () => ([
  { name: 'the whole settings blob',        path: '/api/settings',                 method: 'PUT',  body: { folderAccess: {} } },
  { name: 'per-member folder access',       path: '/api/settings/folder-access',   method: 'PUT',  body: { userId: W.users.restricted.id, folders: null } },
  { name: 'the market',                     path: '/api/org/jurisdiction',         method: 'PUT',  body: { id: 'sweden' } },
  { name: 'how the work is shaped',         path: '/api/org/workshape',            method: 'PUT',  body: { shapes: ['project'], word: 'project' } },
  { name: 'creating a member',              path: '/api/users',                    method: 'POST', body: { name: 'Sneak In', email: 'sneak@example.co.ke', role: 'admin', password: 'longenough1' } },
  { name: 'removing a member',              path: '/api/users/' + W.users.novalues.id, method: 'DELETE' },
  { name: 'the Copilot key and its limits', path: '/api/ai/config',                method: 'PUT',  body: { dailySpendLimit: 999 } },
  { name: 'the onboarding allowance',       path: '/api/ai/allowance',             method: 'PUT',  body: { open: true, budget: 50 } },
  { name: 'the outbox',                     path: '/api/outbox',                   method: 'GET' },
  { name: 'running the renewal sweep',      path: '/api/reminders/run',            method: 'POST', body: {} },
  { name: 'the activation funnel',          path: '/api/activation',               method: 'GET' },
  { name: 'the monthly report',             path: '/api/reports/monthly',          method: 'GET' },
  { name: 'the monthly report switch',      path: '/api/reports/monthly/settings', method: 'PUT',  body: { enabled: true } },
  { name: 'sending the monthly report now', path: '/api/reports/monthly/run',      method: 'POST', body: {} },
  { name: 'the whole-workspace export',     path: '/api/export/workspace.zip',     method: 'GET' },
]);

describe('f194 — an ordinary member is refused at every settings route', () => {
  test('every admin-only route answers 403 to a signed-in Editor', async () => {
    const refused = [];
    for (const r of ADMIN_ONLY()) {
      const res = await W.unrestricted.raw(r.path, { method: r.method, body: r.body });
      refused.push({ name: r.name, status: res.status });
    }
    const wrong = refused.filter(r => r.status !== 403);
    assert.deepEqual(Array.from(wrong), [],
      'a route that is not 403 here is a route the browser gate is the only thing holding');
  });

  test('and the refusals changed nothing — the workspace is as it was', async () => {
    /* The point of asking again as the admin: a 403 that had already written
       is not a refusal, it is a message. */
    const boot = await W.admin.json('/api/bootstrap');
    assert.ok(!boot.users.some(u => u.email === 'sneak@example.co.ke'), 'no account was created');
    assert.ok(boot.users.some(u => u.id === W.users.novalues.id), 'nobody was removed');
    const jx = await W.admin.json('/api/status');
    assert.ok(jx, 'the workspace is still answering');
  });

  test('a member cannot promote themselves, or anybody else', async () => {
    const self = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { role: 'admin' } });
    assert.equal(self.status, 403, 'not through their own record');
    const other = await W.unrestricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { role: 'admin' } });
    assert.equal(other.status, 403, 'and not through somebody else\'s');
    const boot = await W.admin.json('/api/bootstrap');
    assert.equal(boot.users.find(u => u.id === W.users.unrestricted.id).role, 'legal');
    assert.equal(boot.users.find(u => u.id === W.users.restricted.id).role, 'legal');
  });

  test('a member cannot widen their own folder access, or hide values from a colleague', async () => {
    const wide = await W.restricted.raw('/api/settings/folder-access', { method: 'PUT',
      body: { userId: W.users.restricted.id, folders: null } });
    assert.equal(wide.status, 403);
    const hide = await W.unrestricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { canViewValues: false } });
    assert.equal(hide.status, 403);
    const me = await W.restricted.json('/api/bootstrap');
    assert.deepEqual(Array.from(me.me.folderAccess || []), ['proc'],
      'their scope is exactly what the admin gave them');
  });
});

describe('f194 — and the account surface still works, scoped to the caller', () => {
  test('a member may set their OWN job title, and only that', async () => {
    const ok = await W.unrestricted.json('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { title: 'Head of Legal' } });
    assert.equal(ok.user.title, 'Head of Legal', 'their own capacity is a fact about them, not a permission');
    const notMine = await W.unrestricted.raw('/api/users/' + W.users.restricted.id, { method: 'PATCH', body: { title: 'Whatever' } });
    assert.equal(notMine.status, 403, 'but not somebody else\'s');
    const smuggled = await W.unrestricted.raw('/api/users/' + W.users.unrestricted.id, { method: 'PATCH', body: { title: 'Fine', role: 'admin' } });
    assert.equal(smuggled.status, 403, 'and a role riding along with a title is still refused');
  });

  test('a member sees their OWN sessions and nobody else\'s, and may revoke one', async () => {
    /* A second sign-in for the same person, so there is something to revoke
       that is not the session doing the revoking. */
    const second = h.client('everything-2');
    await second.json('/api/login', { method: 'POST', body: { email: 'everything@example.co.ke', password: 'their-own-pass-9' } });
    const mine = await W.unrestricted.json('/api/sessions');
    assert.ok(mine.sessions.length >= 2, 'both of their sittings are listed');
    assert.equal(mine.sessions.filter(s => s.current).length, 1, 'exactly one is this device');
    const admins = await W.admin.json('/api/sessions');
    /* THERE IS NO ALL-USERS SESSION VIEW, not even for an admin — the route is
       scoped to the caller, which is why this panel is on the account surface
       rather than on a roster. */
    const overlap = admins.sessions.filter(s => mine.sessions.some(m => m.id === s.id));
    assert.deepEqual(Array.from(overlap), [], 'an admin reads their own sittings, not the workspace\'s');
    const victim = mine.sessions.find(s => !s.current);
    await W.unrestricted.json('/api/sessions/' + victim.id, { method: 'DELETE' });
    const after = await W.unrestricted.json('/api/sessions');
    assert.ok(!after.sessions.some(s => s.id === victim.id), 'and the revoke took');
  });

  test('an Editor keeps the company-design door the old page gave them', async () => {
    /* #brand-edit was gated admin-OR-legal on the old page. The page is
       admin-only now, so the door moved to their account surface — and the
       SERVER has to agree, or the door leads to a refusal.

       THE PAYLOAD CHANGED ON 14 Aug 2026 and the CLAIM did not. This used to
       send companyName and registrationNumber, because at the time the design
       and the company's legal identity shared one route. They no longer share a
       screen — the identity moved to Company & market, which is admin-only —
       so the identity half is closed to an Editor (see below, and
       SET_CLOSURES['legal-identity']). What this test has always been about is
       the DESIGN: the logo, the accent colour and the layout, which is what the
       permission was for and which is untouched. */
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT',
      body: { logoPosition: 'top-left', accentColor: '#1a7f6b', accentSource: 'manual' } });
    assert.notEqual(r.status, 403, 'an Editor may still change the company design');
    const values = await W.unrestricted.raw('/api/org/profile-values', { method: 'PUT', body: { values: { town: 'Nairobi' } } });
    assert.notEqual(values.status, 403);
  });

  test('but the company\'s LEGAL IDENTITY is closed to them — a named closure', async () => {
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT',
      body: { companyName: 'Something Else Ltd' } });
    assert.equal(r.status, 403, 'this is the name that appears on executed paper');
    assert.match(r.json.error, /admin/i, 'and the refusal says who can');
    /* A CLOSURE IS NAMED, NOT SILENT — the same rule the August 2026 settings
       closures follow. */
    const src = fs.readFileSync(path.join(__dirname, '..', 'js/views/settings.js'), 'utf8');
    const list = src.slice(src.indexOf('const SET_CLOSURES'), src.indexOf('WHICH TAB IS UP'));
    assert.match(list, /legal-identity/);
  });

  test('and their ordinary design save is not refused just for carrying the identity along', async () => {
    /* THE DIFFERENCE, not the field. A client that sends the identity back
       UNCHANGED has moved nothing and must pass — otherwise every stale tab
       becomes a refusal, and the guard stops being about the act. */
    const now = await W.admin.json('/api/org/branding');
    const r = await W.unrestricted.raw('/api/org/branding', { method: 'PUT', body: {
      companyName: (now.branding || {}).companyName || '', logoPosition: 'top-right' } });
    assert.notEqual(r.status, 403, 'nothing moved, so nothing is refused');
  });

  test('a member may export the contracts they can see, and only those', async () => {
    /* The backup export on the account surface is built in the browser out of
       the caller's own bootstrap, so the scoping question is the bootstrap's. */
    const boot = await W.restricted.json('/api/bootstrap');
    const list = await W.restricted.json('/api/contracts');
    const folders = new Set(list.rows.map(c => c.folder));
    assert.deepEqual(Array.from(folders), ['proc'], 'a restricted member exports one stream');
    assert.ok(boot.count <= 2, 'and the count they are shown is their own');
  });
});
