/* ============================================================
   f603 — the market is the company's, the language is the person's
   (overnight run 9 Oct 2026, stream D: D9, D14, plus D7, D11, D13 pins).

   D9  Picking Sweden as the market turned the whole screen Swedish for a
       reader who had never picked a language. jxSet now keeps the language
       they are reading as theirs before the market moves.
   D14 The setup form's market picker wrote PUT /api/org/jurisdiction before
       any session existed (a 401 in the console). Not before sign-in now.
   D7  The engine row and the go-live ceiling are read when the page opens.
   D11 The page is called one thing: the rail's "Settings & Rules".
   D13 A sign-in or setup that worked clears the refusals the failed tries
       left on screen.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..');
const JX_SRC = fs.readFileSync(path.join(ROOT, 'js/jurisdiction.js'), 'utf8');
const SETTINGS = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const CORE = fs.readFileSync(path.join(ROOT, 'js/core.js'), 'utf8');
const BOOKS = require('../js/i18n.js').STRINGS;

/* A browser in miniature: the language falls back to the market's exactly as
   langId does (me.lang → the stored choice → the market's language). */
function world({ signedIn = true, chosen = null } = {}) {
  const store = {};
  if (chosen) store['hati.v1.lang'] = chosen;
  const me = signedIn ? { id: 'u1', lang: null } : null;
  const calls = [];
  const w = {};
  Object.assign(w, {
    lsGet: k => store[k] ?? null, lsSet: (k, v) => { store[k] = v; },
    currentUser: () => me,
    getOrg: () => null,
    API_MODE: () => true,
    api: (p, m, b) => { calls.push([p, m, b]); return Promise.resolve({}); },
    I18N_LS: 'hati.v1.lang',
    langId: () => (me && me.lang) || store['hati.v1.lang'] || (store['hati.v1.jx'] === 'sweden' ? 'sv' : 'en'),
    langSet: (id) => { store['hati.v1.lang'] = id; if (me) me.lang = id; calls.push(['me/lang', 'PUT', { lang: id }]); return true; },
  });
  const ctx = vm.createContext({ window: w, console, ...w });
  vm.runInContext(JX_SRC.replace(/const JX_LS = [^;]+;/, "const JX_LS = 'hati.v1.jx';"), ctx);
  return { w, ctx, me, store, calls, jxSet: id => vm.runInContext(`jxSet(${JSON.stringify(id)})`, ctx) };
}

describe('f603 (D9) — moving the market keeps the reader\'s language', () => {
  test('a reader who never chose reads English, and still does after Sweden', () => {
    const W = world();
    assert.equal(W.w.langId(), 'en');
    assert.equal(W.jxSet('sweden'), true);
    assert.equal(W.w.langId(), 'en', 'the screen did not turn Swedish');
    assert.equal(W.me.lang, 'en', 'their language is now theirs, on their record');
  });
  test('a reader who chose Swedish keeps Swedish when the market moves home', () => {
    const W = world({ chosen: 'sv' });
    W.jxSet('kenya');
    assert.equal(W.w.langId(), 'sv');
  });
  test('the market itself still moves', () => {
    const W = world();
    W.jxSet('sweden');
    assert.equal(W.store['hati.v1.jx'], 'sweden');
  });
});

describe('f603 (D14) — no server write before anybody is signed in', () => {
  test('the setup form picks a market: nothing goes to the server', () => {
    const W = world({ signedIn: false });
    W.jxSet('sweden');
    assert.equal(W.calls.filter(c => c[0] === 'org/jurisdiction').length, 0);
    assert.equal(W.calls.filter(c => c[0] === 'me/lang').length, 0, 'and no language write either');
    assert.equal(W.store['hati.v1.lang'], 'en', 'the language is kept in this browser instead');
  });
  test('signed in, the market reaches the server as before', () => {
    const W = world();
    W.jxSet('sweden');
    assert.equal(JSON.stringify(W.calls.find(c => c[0] === 'org/jurisdiction')), JSON.stringify(['org/jurisdiction', 'PUT', { jurisdiction: 'sweden' }]));
  });
});

describe('f603 (D7) — the engine row is read when the page opens', () => {
  test('renderTeam asks once; the engine drawer\'s read repaints both rows', () => {
    assert.match(SETTINGS, /stWireList\(\);\n  stLoadAiCfgOnce\(\);/);
    assert.match(SETTINGS, /async function stLoadAiCfgOnce\(\)\{[\s\S]{0,400}api\('ai\/config'\)[\s\S]{0,200}stRepaintRow\('engine'\); stRepaintRow\('golive'\);/);
    assert.match(SETTINGS, /state\.aiCfg=c;[^\n]*\n[\s\S]{0,200}stRepaintRow\('engine'\); stRepaintRow\('golive'\);/);
  });
});

describe('f603 (D11) — one name for the page', () => {
  test('the page title is the rail\'s word, in both books', () => {
    assert.equal(BOOKS.en.pg_team, BOOKS.en.nav_settings_rules);
    assert.equal(BOOKS.sv.pg_team, BOOKS.sv.nav_settings_rules);
  });
  test('no sentence sends anybody to "Team & Settings" any more', () => {
    for (const lang of ['en', 'sv']) for (const [k, v] of Object.entries(BOOKS[lang]))
      assert.doesNotMatch(String(v), /Team (&|&amp;) [Ss]ettings|Team och inställningar/, `${lang}.${k}`);
  });
});

describe('f603 (D13) — a good sign-in clears what the bad tries left', () => {
  test('every successful start clears the toasts first', () => {
    assert.match(CORE, /function toastsClear\(\)\{/);
    const n = (CORE.match(/toastsClear\(\); startApp\(\);/g) || []).length;
    assert.equal(n, 5, 'setup (server and local), sign-in (server and local), the two-step code');
  });
});
