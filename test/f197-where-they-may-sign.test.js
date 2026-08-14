/* ============================================================
   f197 — which folders may this person sign in

   Seeing a stream and being allowed to put your name at the bottom of its
   paper are different rights. Until now the product had one map for the first
   and nothing at all for the second, so anybody who could open a contract
   could execute it.

   This is the second right, and it is a SEPARATE list on purpose — its own
   key, its own route, its own guard. Overloading folderAccess with two
   meanings is how a reader who was only ever meant to look ends up signing.

   The three properties that make it safe:

     1. IT ONLY EVER NARROWS. A folder somebody cannot SEE has already been
        refused by the scope check, so this list can take a right away and can
        never hand one out.
     2. NOTHING LOCKS ON DEPLOY. Absent means "every folder they can see", and
        the enforcement sits behind its own switch, off by default.
     3. AN EMPTY PICK IS NEVER STORED. The browser reads [] as "nothing said"
        and the server reads it as "deny all"; the route refuses to create one
        rather than leaving the two stores disagreeing about a restriction.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/approvals.js'];

function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://hati.test/' });
  const win = dom.window;
  const admin = { id: 'u_admin', name: 'Young', role: 'admin' };
  const ed = { id: 'u_ed', name: 'Asha', role: 'legal' };
  const settings = { signFolders: { on: !!opts.on, by: opts.by || {} } };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, Promise, setTimeout: fn => { fn(); return 0; }, clearTimeout() {},
    document: win.document, localStorage: win.localStorage,
    esc: s => String(s == null ? '' : s), icon: () => '', toast() {},
    currentUser: () => (opts.as === 'admin' ? admin : ed),
    getUsers: () => [admin, ed], isAdmin: () => opts.as === 'admin',
    roleName: r => r, saveSettings() {}, nowISO: () => 'now', fmtDT: v => v,
    api: async (route, method, body) => { sb.__api.push({ route, method, body }); return {}; },
    API_MODE: () => true, __api: [],
    logAudit() {}, persist() {}, canEdit: () => true, fmtMoneyShort: n => String(n),
    isMonetary: () => true,
    state: { contracts: [], settings, view: 'workspace' },
    REMOTE: { me: admin, users: [admin, ed] },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return { sb, admin, ed };
}
const inProc = { id: 'MK-1', name: 'Sugar', folder: 'proc', value: 1000 };
const inMktg = { id: 'MK-2', name: 'Agency', folder: 'mktg', value: 1000 };

describe('f197 — it is a separate list, and it only narrows', () => {
  test('absent means every folder they can see', () => {
    const { sb, ed } = stage({ on: true });
    assert.equal(sb.signFolderAccess(ed), '*');
    assert.equal(sb.signFolderBlocker(inMktg, ed), null, 'nothing locked on deploy');
  });

  test('it is stored under its OWN key, never folderAccess', () => {
    const { sb } = stage({ on: true });
    sb.state.settings.folderAccess = { u_ed: ['proc'] };
    /* Seeing Procurement and being allowed to SIGN Procurement are two
       questions, and the second one has not been answered here. */
    assert.equal(sb.signFolderAccess({ id: 'u_ed', role: 'legal' }), '*',
      'a folderAccess entry must not silently become a signing right');
    const src = fs.readFileSync(path.join(ROOT, 'js/approvals.js'), 'utf8');
    const fn = src.slice(src.indexOf('function signFolderAccess'), src.indexOf('const maySignFolder'));
    assert.ok(!/folderAccess/.test(fn), 'and the reading never looks at the other map');
  });

  test('a narrowing refuses in words outside it and passes inside it', () => {
    const { sb, ed } = stage({ on: true, by: { u_ed: ['proc'] } });
    assert.equal(sb.signFolderBlocker(inProc, ed), null, 'inside');
    const b = sb.signFolderBlocker(inMktg, ed);
    assert.ok(b, 'outside');
    assert.match(b.label, /Marketing/, 'and it names the folder, not an id');
    assert.ok(b.short && b.short.length < 60);
  });

  test('with the switch off, the same narrowing refuses nothing', () => {
    const { sb, ed } = stage({ on: false, by: { u_ed: ['proc'] } });
    assert.equal(sb.signFolderEnforced(), false, 'off is the default');
    assert.equal(sb.signFolderBlocker(inMktg, ed), null);
  });

  test('an admin holds every folder', () => {
    const { sb, admin } = stage({ on: true, by: { u_admin: ['proc'] } });
    assert.equal(sb.signFolderAccess(admin), '*');
    assert.equal(sb.signFolderBlocker(inMktg, admin), null);
  });

  test('an empty pick is refused rather than written', async () => {
    const { sb } = stage({ on: true });
    await assert.rejects(() => sb.saveSignFolders('u_ed', []), /.+/,
      'the two stores read [] differently, so it must never be sent');
    assert.deepEqual(Array.from(sb.__api), [], 'and nothing left the browser');
  });

  test('a real pick goes through its own dedicated route', async () => {
    const { sb } = stage({ on: true });
    await sb.saveSignFolders('u_ed', ['proc', 'corp']);
    const call = sb.__api[sb.__api.length - 1];
    assert.equal(call.route, 'settings/sign-folders', 'never settings/folder-access');
    assert.equal(call.method, 'PUT');
    assert.deepEqual(Array.from(call.body.folders), ['proc', 'corp']);
    await sb.saveSignFolders('u_ed', null);
    assert.equal(sb.__api[sb.__api.length - 1].body.folders, null, 'and null clears it');
  });

  test('it joins the ONE list of signing blockers', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/views/contract.js'), 'utf8');
    const fn = src.slice(src.indexOf('function signBlockers(c)'), src.indexOf('function signBlockMessage'));
    assert.match(fn, /signFolderBlocker/);
  });
});

/* ============================================================
   THE SERVER
   ============================================================ */
let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

async function trySign(client, id) {
  const full = await client.json('/api/contracts/' + id);
  const baseVersion = full._v; delete full._v;
  full.signatures = (full.signatures || []).concat([{
    party: 'internal-planned', name: 'Restricted Legal', email: 'restricted@example.co.ke',
    at: new Date().toISOString() + Math.random(), method: 'session-authenticated', form: 'typed',
  }]);
  return client.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: full, baseVersion } });
}

describe('f197 — the server keeps its own list and its own guard', () => {
  test('the route is admin-only and refuses an empty pick', async () => {
    const asMember = await W.unrestricted.raw('/api/settings/sign-folders', { method: 'PUT',
      body: { userId: W.users.restricted.id, folders: ['proc'] } });
    assert.equal(asMember.status, 403, 'a member cannot widen or narrow anybody');
    const empty = await W.admin.raw('/api/settings/sign-folders', { method: 'PUT',
      body: { userId: W.users.restricted.id, folders: [] } });
    assert.equal(empty.status, 400, 'and an empty array is never stored');
  });

  test('with the switch off, a narrowing refuses nothing', async () => {
    await W.admin.json('/api/settings/sign-folders', { method: 'PUT',
      body: { userId: W.users.restricted.id, folders: ['sales'] } });
    /* MK-A1 is in `proc`, which is NOT on their signing list — and the switch
       is off, so it does not matter yet. */
    const r = await trySign(W.restricted, 'MK-A2');
    assert.equal(r.status, 200, 'nothing locked on deploy');
  });

  test('with the switch on, the same signature is refused, naming the folder', async () => {
    /* THE SWITCH RIDES THE BLOB, THE MAP DOES NOT — the same H-3 split
       folderAccess already has, so a stale general save cannot revert a
       restriction. The map was written through its own route above. */
    await W.admin.json('/api/settings', { method: 'PUT', body: { signFolders: { on: true } } });
    const r = await trySign(W.restricted, 'MK-A2');
    assert.equal(r.status, 403);
    assert.match(r.json.error, /may not sign/i);
    assert.equal(r.json.signFolder, 'proc');
  });

  test('and an ordinary save on the same contract still goes through', async () => {
    /* ASKED AS A DIFFERENCE. A member editing key terms is not signing. */
    const full = await W.restricted.json('/api/contracts/MK-A2');
    const baseVersion = full._v; delete full._v;
    full.counterparty = 'Nandi Dairy Co-op';
    const r = await W.restricted.raw('/api/contracts/MK-A2', { method: 'PUT', body: { contract: full, baseVersion } });
    assert.equal(r.status, 200);
  });

  test('and a general settings save does NOT wipe the map (H-3, again)', async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: { signFolders: { on: true }, somethingElse: 1 } });
    const r = await trySign(W.restricted, 'MK-A2');
    assert.equal(r.status, 403, 'the restriction survived a blob save that did not mention it');
  });

  test('clearing the narrowing lets them sign again', async () => {
    await W.admin.json('/api/settings/sign-folders', { method: 'PUT',
      body: { userId: W.users.restricted.id, folders: null } });
    const r = await trySign(W.restricted, 'MK-A2');
    assert.equal(r.status, 200);
  });

  test('IT ONLY EVER NARROWS — a folder they cannot see is still refused, by the scope check', async () => {
    await W.admin.json('/api/settings/sign-folders', { method: 'PUT',
      body: { userId: W.users.restricted.id, folders: ['sales', 'proc'] } });
    /* MK-B1 lives in `sales`, which is now on their SIGNING list — and they
       have never been able to see it. The scope check answers first, and it
       answers 404, because a contract outside the caller's scope is invisible
       and therefore unwritable. */
    const r = await W.restricted.raw('/api/contracts/MK-B1');
    assert.equal(r.status, 404, 'a signing right can never hand out a reading right');
  });
});
