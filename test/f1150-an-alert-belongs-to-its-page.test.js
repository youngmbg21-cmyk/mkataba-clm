/* f1150 — AN ALERT BELONGS TO THE PAGE IT WAS RAISED ON (owner, 22 Nov 2026).
   The owner's report: the alerts at the bottom centre "do not seem to be coordinated with what is happening or are
   simply incorrect". Seven faults, fixed in the one alert maker (js/core.js toast) and the one request maker
   (js/api.js api), so every caller has them:
   1 an alert goes when the reader leaves its page (one raised just before the move rides along; one with a button stays)
   2 news about a contract that is not in front leads with its number; a decline is a heads-up in both languages
   3 one limit is said once   4 a wait stops turning when its result lands
   5 a dropped connection is said in plain words   6 a heads-up with nothing to press reads as fast as a refusal
   7 the refusals that were silent speak.
   Red at the parent: toastWhere / toastAbout do not exist, toast returns nothing, api throws the browser's words. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CORE = read('js/core.js'), API = read('js/api.js'), I18N = read('js/i18n.js');
const bare = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');

function stage(){
  const src = CORE.slice(CORE.indexOf('const TOAST_KINDS'), CORE.indexOf('/* SHA-256, with an honest failure mode.'));
  assert.ok(src.length > 500, 'the toast block is still where this test reads it');
  const dom = new JSDOM('<div id="toast-root"></div>', { runScripts: 'outside-only' });
  const win = dom.window;
  const T = { now: 1000000, tick: null, waits: [] };
  win.Date.now = () => T.now;
  win.setInterval = fn => { T.tick = fn; return 1; };
  win.clearInterval = () => { T.tick = null; };
  win.setTimeout = (fn, ms) => { T.waits.push(ms); return 1; };
  win.eval('var state={view:"board"};function icon(){ return "<svg></svg>"; }'
    + 'function esc(s){ return String(s == null ? "" : s); }' + src
    + ';window.toast=toast;window.toastAbout=toastAbout;window.toastWhere=toastWhere;window.TOAST_RIDE_MS=TOAST_RIDE_MS;window.TOAST_LIMIT_MS=TOAST_LIMIT_MS;window.TOAST_BUSY_MS=TOAST_BUSY_MS;');
  const root = win.document.getElementById('toast-root');
  return { win, root, T, said: () => [...root.children].map(e => e.textContent) };
}

describe('f1150 — an alert belongs to its page', () => {
  test('1 · it goes when the reader leaves; a fresh one rides along; one with a button stays', () => {
    const { win, root, T, said } = stage();
    win.toast('Old refusal', 'err');
    win.toast('Open it', 'warn', { action: { label: 'Open', onClick(){} } });
    T.now += win.TOAST_RIDE_MS + 500;
    win.toast('Deleted', 'ok');                 /* the move's own confirmation */
    assert.ok(T.tick, 'the sweep runs while an alert is up');
    T.tick(); assert.equal(root.children.length, 3, 'nothing goes while the reader stays');
    win.eval('state.view="contracts"'); T.tick();
    assert.deepEqual(said(), ['Open itOpen', 'Deleted']);
    T.now += win.TOAST_RIDE_MS + 500; T.tick();
    assert.equal(root.children.length, 2, 'the one that rode along now belongs to the new page');
    win.eval('state.view="calendar"'); T.tick();
    assert.deepEqual(said(), ['Open itOpen']);
  });
  test('1b · the contract in front is part of where the reader is', () => {
    const { win } = stage();
    win.eval('state.view="dashboard";window.hbS=()=>({face:"paper"});window.pdContract=()=>({id:"C-1"})');
    const a = win.toastWhere();
    win.eval('window.pdContract=()=>({id:"C-2"})');
    assert.notEqual(a, win.toastWhere());
  });
  test('2 · news about a contract that is not in front leads with its number', () => {
    const { win } = stage();
    win.eval('window.contractRef=c=>c.no;function contractOnScreen(c){return c.on;}function contractOnHome(){return false;}');
    assert.equal(win.eval('toastAbout({id:"x",no:"HT-7",on:false},"Asha has signed")'), 'HT-7: Asha has signed');
    assert.equal(win.eval('toastAbout({id:"x",no:"HT-7",on:true},"Asha has signed")'), 'Asha has signed');
    assert.equal(win.eval('toastAbout({id:"x",no:"HT-7",on:false},"HT-7 was sealed")'), 'HT-7 was sealed', 'never twice');
    const code = bare(CORE), from = code.indexOf('async function applyResponse(');
    const fn = code.slice(from, code.indexOf('async function pollPendingResponses('));
    for (const k of ['co_arr_signed', 'co_arr_accepted', 'co_arr_ready', 'co_arr_changes', 'co_arr_declined', 'co_doc_changed_after'])
      assert.match(fn, new RegExp("toast\\(toastAbout\\(c,[^;]*" + k), k + ' names its contract');
    assert.ok(!/declined the agreement`/.test(fn), 'the decline is no longer English only');
    assert.match(fn, /co_arr_declined[^;]*'warn'\)/, 'and it is a heads-up, not a failure');
    assert.equal((I18N.match(/^\s*co_arr_declined:/gm) || []).length, 2, 'both books');
  });
  test('3 · one limit is said once', () => {
    const { win, T, said } = stage();
    win.toast('Jambo is at today\'s limit.', 'err', { limit: true });
    win.toast('Review unavailable', 'err');
    assert.deepEqual(said(), ['Jambo is at today\'s limit.']);
    T.now += win.TOAST_LIMIT_MS + 100;
    win.toast('Another refusal', 'err');
    assert.equal(said().length, 2, 'a later refusal is its own news');
    assert.match(bare(API), /res\.status===429[^;]*\{limit:true\}/);
  });
  test('4 · a wait stops turning when its result lands, and outlasts short work', () => {
    const { win, T, said } = stage();
    win.toast('Scanning…', 'ok', { busy: true });
    assert.equal(T.waits.at(-1), win.TOAST_BUSY_MS);
    win.toast('Scan complete', 'ok');
    assert.deepEqual(said(), ['Scan complete']);
    win.toast('Uploading…', 'ok', { busy: true, dwell: 600000 });
    win.toast('Something else', 'ok');
    assert.equal(said().length, 3, 'a wait with its own clock is its caller\'s to end');
  });
  test('5 · a dropped connection is said in plain words', async () => {
    const from = API.indexOf('async function api('), to = API.indexOf('async function apiStream(');
    const run = async fetch => {
      const ctx = vm.createContext({ fetch, window: {}, toast(){} });
      vm.runInContext(API.slice(from, to) + '\nthis.api=api;', ctx);
      try { await ctx.api('x'); } catch (e) { return e; }
    };
    const down = await run(async () => { throw new TypeError('Failed to fetch'); });
    assert.match(down.message, /could not be reached/); assert.equal(down.network, true);
    const gw = await run(async () => ({ ok: false, status: 502, json: async () => { throw new Error('html'); } }));
    assert.match(gw.message, /could not be reached/); assert.equal(gw.status, 502);
    const boom = await run(async () => ({ ok: false, status: 500, json: async () => { throw new Error('html'); } }));
    assert.match(boom.message, /could not do that just now \(500\)/);
    const said = await run(async () => ({ ok: false, status: 409, json: async () => ({ error: 'It is on hold.' }) }));
    assert.equal(said.message, 'It is on hold.', 'the server\'s own sentence is kept as written');
    for (const k of ['net_unreachable', 'net_srv_fail'])
      assert.equal((I18N.match(new RegExp('^\\s*' + k + ':', 'gm')) || []).length, 2, k + ' in both books');
    assert.match(read('js/views/portal.js'), /e&&e\.network/, 'their page still says what was kept');
  });
  test('6 · a heads-up with nothing to press reads as fast as a refusal', () => {
    const { win, T } = stage();
    win.toast('No', 'err'); const err = T.waits.at(-1);
    win.toast('Say why', 'warn'); assert.equal(T.waits.at(-1), err);
    win.toast('Not emailed', 'warn', { action: { label: 'Copy link', onClick(){} } });
    assert.ok(T.waits.at(-1) > err, 'one that carries its act stays to be pressed');
  });
  test('7 · the refusals that were silent speak', () => {
    const has = (f, re) => assert.match(bare(read(f)), re, f + ' ' + re);
    has('js/negotiation.js', /ng_draft_superseded'[^;]*'warn'\)/);
    has('js/views/negotiation.js', /No changes from the other side are pending',\s*'warn'\)/);
    has('js/views/negotiation.js', /ng_nothing_pending'\),\s*'warn'\)/);
    has('js/views/negotiation.js', /r\.ok\?undefined:'err'\)/);
    has('js/views/contract.js', /res&&!res\.emailSent&&res\.to\?'warn':undefined\)/);
    has('js/views/migration.js', /missed\?'warn':undefined\)/);
  });
});
