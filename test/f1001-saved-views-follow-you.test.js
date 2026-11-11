/* ═══════════════════════════════════════════════════════════════════════════
   f1001 — SAVED VIEWS FOLLOW YOU (owner, 10 Nov 2026, the questionnaire:
   "Should saved views follow you to other computers?" — "Yes, follow me";
   the overnight run, job 12)

   Explorer's saved views were kept in ONE browser. They are now one of the
   person's own preferences on the server (PUT /api/me/prefs { igViews }), so
   every computer they sign in on reads the same list.

   WHAT THIS PINS
     (1) the server keeps a person's saved views, gives them back on sign-in
         (the user record's prefs), and never shows them to anybody else
     (2) a list that breaks the rules is REFUSED in words, never trimmed: more
         than twelve, a nameless view, a view with no map; null clears it
     (3) the browser reads the server's list when there is one, sends every
         save there, and carries this browser's own views up on the first save
   AT THE PARENT every test here FAILS: the route ignored igViews and the
   browser only ever read localStorage.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
/* a function's text, up to the next top-level function (some here end on their own line's last brace) */
const fnBody = (src, name) => { const i = src.search(new RegExp('function ' + name + '\\(')); if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 1); return src.slice(i, j < 0 ? undefined : j); };

const VIEW = (name, at) => ({ name, recipe: { v: 1, groupBy: 'stream', lenses: [] }, at: at || '2026-11-10' });

describe('f1001 (1)(2) the server keeps them, for the person only, and refuses a bad list', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { try { await h.stop(); } catch (_){} });

  test('1a saved, they come back with the person on the next sign-in', async () => {
    const r = await W.admin.json('/api/me/prefs', { method: 'PUT', body: { igViews: [VIEW('Value by stream'), VIEW('Ending soon')] } });
    assert.deepEqual(r.prefs.igViews.map(v => v.name), ['Value by stream', 'Ending soon']);
    const b = await W.admin.json('/api/bootstrap');
    assert.deepEqual((b.me.prefs.igViews || []).map(v => v.name), ['Value by stream', 'Ending soon'], 'read back from the server, not the browser');
  });
  test('1b another person never sees them, an admin included', async () => {
    const b = await W.restricted.json('/api/bootstrap');
    assert.ok(!b.me.prefs.igViews, 'their own preferences carry no one else\'s views');
    const adminRow = (b.users || []).find(u => u.email === 'admin@example.co.ke');
    assert.ok(adminRow && !(adminRow.prefs || {}).igViews, 'nor the admin\'s row in their list');
    await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { igViews: [VIEW('Mine only')] } });
    const a = await W.admin.json('/api/bootstrap');
    const theirRow = (a.users || []).find(u => u.email === 'restricted@example.co.ke');
    assert.ok(theirRow && !(theirRow.prefs || {}).igViews, 'an admin\'s list does not carry a colleague\'s views');
  });
  test('2a more than twelve is refused, not trimmed, and nothing changes', async () => {
    const many = Array.from({ length: 13 }, (_, i) => VIEW('View ' + i));
    const r = await W.admin.raw('/api/me/prefs', { method: 'PUT', body: { igViews: many } });
    assert.equal(r.status, 400);
    const b = await W.admin.json('/api/bootstrap');
    assert.equal((b.me.prefs.igViews || []).length, 2, 'the kept list stands');
  });
  test('2b a nameless view and a view with no map are refused in words', async () => {
    for (const bad of [[{ name: '', recipe: {} }], [{ name: 'No map' }], 'not a list']){
      const r = await W.admin.raw('/api/me/prefs', { method: 'PUT', body: { igViews: bad } });
      assert.equal(r.status, 400);
      const b = r.json || {}; assert.ok(b.error && b.error.length > 10, 'said, not silent');
    }
  });
  test('2c null clears them', async () => {
    const r = await W.admin.json('/api/me/prefs', { method: 'PUT', body: { igViews: null } });
    assert.ok(!('igViews' in r.prefs));
  });
});

describe('f1001 (3) the browser reads the server\'s list and saves there', () => {
  const IG = R('js/views/intelligence.js');
  test('3a with a server, the list read is the person\'s own preference; without one, this browser\'s', () => {
    const f = fnBody(IG, 'igViewsRaw');
    assert.match(f, /igViewsOnServer\(\)/);
    assert.match(f, /currentUser\(\)\.prefs/);
    assert.match(f, /igViewsLocal\(\)/);
    assert.match(fnBody(IG, 'igViewsRead'), /igViewsRaw\(\)/, 'every reader goes through it');
  });
  test('3b every save goes to the server through the one preference writer, and a failed one is put back', () => {
    const f = fnBody(IG, 'igViewsWrite');
    assert.match(f, /stPrefSet\('igViews',L\)/);
    assert.match(f, /igViews:was/, 'a refused save puts the old list back');
    assert.match(f, /IG_VIEWS_CARRIED_KEY/, 'this browser\'s own views are carried up once');
  });
  test('3c reading never writes', () => {
    for (const n of ['igViewsRaw', 'igViewsRead', 'igViewsLocal']) assert.doesNotMatch(fnBody(IG, n).replace(/\/\*[\s\S]*?\*\//g, ''), /stPrefSet|setItem\(/, n);
  });
});
