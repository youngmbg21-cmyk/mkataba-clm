/* ============================================================
   f160 — a restricted member's own browser knows it is restricted
   ============================================================
   Reported from the field (Young, 09 Aug 2026): "I assign someone one stream,
   then I log in as them and I can still see the whole platform's streams."

   The data was never at risk — F1 pins that the server filters every query and
   masks every response, and it still does. What was wrong was the SCREEN, and
   the reason is worth writing down because it is the kind of fault that looks
   like nothing:

     · the workspace's folderAccess map is the admin's editing surface, and the
       server deliberately strips it from the bootstrap of anyone who is not an
       admin — it discloses who is fenced off from what
     · js/core.js's userFolderAccess() read ONLY that map
     · so on a restricted member's own screen it read undefined and answered
       "every stream"

   Every cosmetic consequence followed from that one answer: the register's
   stream tabs, the command palette, the phone's stream chips and every "file
   under" picker all ask the same function. The server kept the rows out, so the
   member saw eight streams and their own two contracts — which reads as a
   broken product at best and as an unenforced restriction at worst.

   The server has always sent each person their own scope on their user record.
   This file pins that the browser now reads it, that the map still wins where
   it exists, that a workspace with no server behaves exactly as before, and
   that the four stream lists are filtered.

   AND THE OTHER HALF OF THE DISCLOSURE. Stripping the map from `settings` did
   nothing while the users list handed the same map back one record at a time.
   Pinned here against the real server.
   ============================================================ */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

const ROOT = path.join(__dirname, '..');

/* The real modules, in the order index.html loads them. core.js declares its
   shell as `const`, so nothing here substitutes it — the snippets below run
   INSIDE the context and reach the product's own bindings. */
function stage(){
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const ctx = dom.getInternalVMContext();
  for (const rel of ['js/i18n.js', 'js/components.js', 'js/templates.js', 'js/jurisdiction.js', 'js/core.js'])
    vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel });
  const run = src => vm.runInContext(src, ctx);
  run('state.settings = state.settings || {}; state.settings.folderAccess = {};');
  return { win: dom.window, run };
}
const ACCESS = 'userFolderAccess';

/* ============================================================
   1 — THE ANSWER ITSELF
   ============================================================ */
describe('f160 · what the browser believes about its own access', () => {

  test('the server’s answer is read when the map is absent — the reported bug', () => {
    const { run } = stage();
    /* Exactly the shape a restricted member's bootstrap arrives in: no entry in
       the map (the server removed it), their own scope on their user record. */
    const got = run(`${ACCESS}({ id:'u1', role:'legal', folderAccess:['proc'] })`);
    assert.deepEqual([...got], ['proc'],
      'a restricted member whose browser answers "*" is shown the whole workspace');
  });

  test('and with nothing recorded anywhere it is still every stream', () => {
    const { run } = stage();
    assert.equal(run(`${ACCESS}({ id:'u1', role:'legal' })`), '*',
      'absence has always meant unrestricted; a workspace with no server must not change');
  });

  test('the map wins where it has an entry, so an admin sees their edit at once', () => {
    const { run } = stage();
    run(`state.settings.folderAccess.u1 = ['corp'];`);
    const got = run(`${ACCESS}({ id:'u1', role:'legal', folderAccess:['proc'] })`);
    assert.deepEqual([...got], ['corp'], 'the record is the fallback, not the override');
  });

  test('an admin is unrestricted whatever either source says', () => {
    const { run } = stage();
    run(`state.settings.folderAccess.a1 = ['corp'];`);
    assert.equal(run(`${ACCESS}({ id:'a1', role:'admin', folderAccess:['proc'] })`), '*');
  });

  test('an empty list in the MAP is still "nothing said", as it always was', () => {
    const { run } = stage();
    run(`state.settings.folderAccess.u1 = [];`);
    assert.equal(run(`${ACCESS}({ id:'u1', role:'legal' })`), '*',
      'an admin who ticks nothing has not locked somebody out of the workspace');
  });

  test('an empty list from the SERVER is a deliberate deny-all', () => {
    const { run } = stage();
    /* folderScopeFor draws the same distinction, and is already filtering on
       it. A screen that answered "*" here would offer streams whose rows never
       arrive. */
    const got = run(`${ACCESS}({ id:'u1', role:'legal', folderAccess:[] })`);
    assert.deepEqual([...got], [], 'deny-all must be expressible');
    assert.equal(run(`canAccessFolder('corp', { id:'u1', role:'legal', folderAccess:[] })`), false);
  });

  test('canAccessFolder follows it', () => {
    const { run } = stage();
    const u = `{ id:'u1', role:'legal', folderAccess:['proc'] }`;
    assert.equal(run(`canAccessFolder('proc', ${u})`), true);
    assert.equal(run(`canAccessFolder('corp', ${u})`), false);
  });
});

/* ============================================================
   2 — THE FOUR LISTS THAT ASK IT
   ============================================================
   A restricted member offered a stream they cannot open gets a door that
   answers "no access" — and learns the name of a stream that was fenced off
   from them. On a "file under" picker it is worse than cosmetic: the contract
   is filed somewhere they will never see it again. */
describe('f160 · every stream list is the reader’s own', () => {

  /* Sign somebody in the way the product does. core.js declares currentUser as
     a `const`, so assigning window.currentUser reaches nothing — REMOTE is the
     seat. (The same lexical-binding trap js/review.js hit; it is worth being
     caught by it in a test rather than in anger.) */
  const signIn = (run, u) => run(`window.REMOTE = { org:{}, me:${JSON.stringify(u)}, users:[${JSON.stringify(u)}] };`);
  const restrict = run => {
    run(`state.settings.folderAccess.u1 = ['corp'];`);
    signIn(run, { id: 'u1', role: 'legal', name: 'Restricted', email: 'r@t.test' });
  };

  test('the shared "file under" picker offers only what they may reach', () => {
    const { run } = stage();
    restrict(run);
    const html = run(`folderOptionsHtml('corp')`);
    assert.match(html, /value="corp"/, 'their own stream is offered');
    assert.ok(!/value="proc"/.test(html), 'a stream they cannot open must not be a filing choice');
    /* Unrestricted is unchanged. */
    signIn(run, { id: 'u2', role: 'legal', name: 'Everything', email: 'e@t.test' });
    assert.match(run(`folderOptionsHtml('corp')`), /value="proc"/);
  });

  test('a record already filed out of reach keeps its own stream on the list', () => {
    const { run } = stage();
    restrict(run);
    /* Otherwise reopening that record silently re-files it under whatever
       happened to be first in the list. */
    assert.match(run(`folderOptionsHtml('proc')`), /value="proc"[^>]*selected/);
  });

  test('the stream legend is filtered too', () => {
    const { run } = stage();
    restrict(run);
    const html = run(`folderLegendHtml()`);
    assert.ok(!/Procurement/i.test(html), 'the legend named every stream in the workspace');
  });

  test('visibleFolders is the one place the question is asked', () => {
    const { run } = stage();
    restrict(run);
    /* Spread: the array is built inside the jsdom realm, and a cross-realm one
       is never deep-strict-equal to a literal built out here. */
    assert.deepEqual([...run(`visibleFolders().map(f => f.id)`)], ['corp']);
    signIn(run, { id: 'u2', role: 'legal', name: 'Everything', email: 'e@t.test' });
    assert.ok(run(`visibleFolders().length`) > 1, 'an unrestricted reader still sees them all');
  });
});

/* ============================================================
   3 — AND THE MAP DOES NOT TRAVEL
   ============================================================ */
describe('f160 · one member’s scope is not another member’s business', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a non-admin receives their OWN scope', async () => {
    const boot = await W.restricted.json('/api/bootstrap');
    assert.deepEqual(boot.me.folderAccess.map(String), [FOLDER_A],
      'without this the browser cannot know it is restricted at all');
  });

  test('…and nobody else’s, through either door', async () => {
    const boot = await W.restricted.json('/api/bootstrap');
    assert.equal(boot.settings.folderAccess, undefined, 'the map is not in the settings blob');
    const others = boot.users.filter(u => u.id !== boot.me.id);
    assert.ok(others.length, 'there are other members to leak');
    const leaked = others.filter(u => 'folderAccess' in u);
    assert.deepEqual(leaked.map(u => u.email), [],
      'stripping the settings blob achieves nothing while the users list carries the same map');
  });

  test('an admin still gets the whole map, because they edit it', async () => {
    const boot = await W.admin.json('/api/bootstrap');
    assert.ok(boot.settings.folderAccess, 'the access editor reads this');
    assert.deepEqual(boot.settings.folderAccess[W.users.restricted.id].map(String), [FOLDER_A]);
    assert.ok(boot.users.every(u => 'folderAccess' in u), 'and the row-by-row answer too');
  });

  test('the restriction is still enforced where it counts', async () => {
    /* F1 owns this in full; asserted once here so a change to the client-side
       answer can never be mistaken for the enforcement. */
    const r = await W.restricted.raw('/api/contracts?folder=' + FOLDER_B);
    assert.equal(r.json.total, 0);
  });
});
