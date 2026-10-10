'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f659 — THE BRAIN SHOWS ITS STACK (owner-approved 10 Oct 2026, work order
   "The Brain's fifth view: Stack", the Journey design)

   The Stack view tells a non-developer what HaTi is built from. Its counts are
   READ from the code by GET /api/brain → stack, never typed in; its fixed
   facts (Render, Resend, Anthropic, SQLite, scrypt, WAL…) stay as wording,
   and each one is checked here against the code, so a change that makes the
   page untrue turns this file red.

   (1) the route's counts are the code's own: tables, routes and test files
       counted here the same way must match (the relation, not a number);
   (2) no secret travels: no environment value longer than 8 characters
       appears in the answer, and the keys are only true/false;
   (3) every fixed fact the wording states is still true in the code;
   (4) every brn_stk_* word the view asks for is in both books;
   (5) the view is the Brain's fifth, and remembers its place on a refresh.
   AT THE PARENT (eec0ebd) (1), (2), (4) and (5) fail: no stack, no words.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const R = f => { try { return fs.readFileSync(path.join(ROOT, f), 'utf8'); } catch (_) { return ''; } };
const SERVER = R('server/server.js');
const VIEW = R('js/views/brain.js');
const I18N = R('js/i18n.js');
const APP = R('js/app.js');

describe('f659 (1)(2) — GET /api/brain answers the stack, read from the code', () => {
  test('the counts are the code\'s own, and nothing secret travels', { timeout: 120000 }, async () => {
    const { startHati, Client } = require('./helpers');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'hati-stack-'));
    const h = await startHati({ HATI_DATA: dir, RESEND_API_KEY: 're_test_secret_value_123456', ANTHROPIC_API_KEY: 'sk-ant-test-secret-987654321' });
    try {
      const admin = new Client(h.base, 'admin');
      await admin.json('/api/setup', { method: 'POST', body: { org: 'Highland Corporate Ltd', name: 'Amina Otieno', email: 'admin@example.co.ke', password: 'adminpassword1', data: { uid: 200, contracts: [], settings: {} } } });
      const r = await admin.json('/api/brain');
      const st = r.stack;
      assert.ok(st && typeof st === 'object', 'the brain answers a stack');
      const tables = new Set([...SERVER.matchAll(/CREATE TABLE IF NOT EXISTS\s+([A-Za-z_]\w*)/g)].map(m => m[1])).size;
      assert.equal(st.tables, tables, 'tables: every distinct CREATE TABLE in the server');
      assert.equal(st.routes, (SERVER.match(/\bapp\.(get|post|put|patch|delete)\(/g) || []).length, 'routes: every app.<method>( in the server');
      assert.equal(st.tests.node, fs.readdirSync(path.join(ROOT, 'test')).filter(n => n.endsWith('.test.js')).length, 'node test files');
      assert.equal(st.tests.browser, fs.readdirSync(path.join(ROOT, 'test', 'chromium')).filter(n => n.endsWith('.js')).length, 'browser check files');
      const pkg = JSON.parse(R('package.json'));
      assert.deepEqual(st.deps, pkg.dependencies, 'the packages HaTi runs on, from package.json');
      assert.equal(st.node.engines, pkg.engines.node);
      assert.equal(st.node.running, process.version, 'the Node actually running');
      assert.deepEqual(st.host, { runtime: 'node', plan: 'starter', diskGB: 1, mount: '/var/data', health: '/api/status' }, 'the host, read off render.yaml');
      assert.ok(st.lines > 100000, 'lines are counted across server, js and index.html');
      assert.ok(st.models.includes('claude-opus-5') && !st.models.includes('default'), 'the price list\'s model keys');
      assert.deepEqual(st.languages.map(l => l.en), ['English', 'Swedish']);
      assert.deepEqual(st.keys, { mail: true, ai: true }, 'whether each key is set — never the key');
      /* no string from the environment longer than 8 characters is in the stack — the two keys handed to this server included */
      const json = JSON.stringify(st);
      const env = { ...process.env, RESEND_API_KEY: 're_test_secret_value_123456', ANTHROPIC_API_KEY: 'sk-ant-test-secret-987654321' };
      assert.deepEqual(Object.entries(env).filter(([, v]) => typeof v === 'string' && v.length > 8 && json.includes(v)).map(([k]) => k), []);
    } finally { await h.stop(); }
  });
  test('a fact this host cannot read is null, never guessed', () => {
    assert.match(SERVER, /host: ry \? \{/, 'no render.yaml → host null');
    assert.match(SERVER, /tables: tables \|\| null/);
    assert.match(VIEW, /brn_stk_missing/, 'the page says "not found on this server"');
  });
});

describe('f659 (3) — every fixed fact the wording states is still true', () => {
  const CI = R('.github/workflows/tests.yml'), YAML = R('render.yaml');
  test('3a the storage, the passwords, the services', () => {
    assert.match(SERVER, /require\('node:sqlite'\)/, 'SQLite through node:sqlite');
    assert.match(SERVER, /scryptSync/, 'passwords scrambled with scrypt');
    assert.match(SERVER, /api\.anthropic\.com/, 'Claude through the Anthropic API');
    assert.match(SERVER, /api\.resend\.com/, 'email through Resend');
    assert.match(SERVER, /journal_mode = WAL/, 'WAL mode');
    assert.match(SERVER, /otpauth/, 'two-step sign-in with an authenticator app');
    assert.match(SERVER, /HttpOnly; Path=\/; Max-Age=\$\{60\*60\*24\*30\}; SameSite=Lax/, 'the sign-in cookie: HttpOnly, 30 days, SameSite=Lax');
    assert.match(SERVER, /Strict-Transport-Security/); assert.match(SERVER, /Content-Security-Policy/);
    assert.match(SERVER, /text\/event-stream/, 'answers stream as server-sent events');
    assert.match(SERVER, /keep-alive\\n\\n'\); \} catch \(_\) \{\} \}, 15000\)/, 'a heartbeat every 15 seconds');
    assert.match(SERVER, /intSetting\('aiDocChars', 'AI_DOC_CHARS', 200000\)/, 'about 200,000 characters of a contract');
  });
  test('3b the four clocks match the wording: 5 minutes, 1 hour, 12 hours, 6 hours', () => {
    assert.match(SERVER, /setInterval\(agentScheduleTick, 5 \* 60 \* 1000\)/);
    assert.match(SERVER, /setInterval\(bookSnapshotTick, 60 \* 60 \* 1000\)/);
    assert.match(SERVER, /setInterval\(reminderSweep, 12 \* 60 \* 60 \* 1000\)/);
    assert.match(SERVER, /setInterval\(monthlyReportSweep, 6 \* 60 \* 60 \* 1000\)/);
    for (const t of ['agent_runs', 'book_snapshots']) assert.match(SERVER, new RegExp('CREATE TABLE IF NOT EXISTS ' + t), t);
  });
  test('3c the host and the robots', () => {
    assert.match(YAML, /^\s*runtime: node$/m, 'render.yaml says runtime: node');
    assert.doesNotMatch(YAML, /^\s*plan: free$/m, 'a paid plan: the wording says HaTi never sleeps');
    assert.match(YAML, /NODE_ENV[\s\S]{0,40}production/);
    assert.match(YAML, /buildCommand: npm install/); assert.match(YAML, /startCommand: npm start/);
    assert.match(CI, /shard: \[1, 2, 3, 4\]/, 'browser checks split over 4 machines');
    assert.match(CI, /eslint|npm run lint/, 'a proofreader for the code');
    assert.ok(fs.existsSync(path.join(ROOT, 'vendor', 'chart.umd.min.js')), 'Chart.js served by HaTi itself');
    assert.doesNotMatch(R('index.html'), /fonts\.googleapis\.com/, 'fonts served by HaTi itself');
  });
});

describe('f659 (4) — the words are in both books', () => {
  const inBoth = k => (I18N.match(new RegExp('\\n    ' + k + ': ', 'g')) || []).length === 2;
  test('4a every brn_stk_* key appears in English and Swedish', () => {
    const keys = [...new Set([...I18N.matchAll(/\n    (brn_stk_[a-z0-9_]+): /g)].map(m => m[1]))];
    assert.ok(keys.length > 300, 'the trips, the glance and the words: ' + keys.length);
    assert.deepEqual(keys.filter(k => !inBoth(k)), []);
  });
  test('4b every key the view asks for exists: each stop\'s six lines and its "tell me more" rows', () => {
    const trips = [...VIEW.matchAll(/\{ id: '(\w+)', path: '[^']+',\s*stops: \[([^\n]+)\] \}/g)];
    assert.equal(trips.length, 4, 'four trips');
    const want = ['brn_view_stack', 'brn_ov_stack', 'brn_hint_stack', 'brn_stk_missing', 'brn_stk_loading', 'brn_stk_say', 'brn_stk_like', 'brn_stk_more'];
    for (const [, id, stops] of trips){
      const rows = [...stops.matchAll(/\[\d+, \d+, '\w+', '[^']+', (\d+)\]/g)].map(m => +m[1]);
      assert.equal(rows.length, 6, id + ': six stops');
      want.push('brn_stk_' + id, 'brn_stk_' + id + '_sub');
      rows.forEach((n, i) => { for (const f of ['n', 's', 't', 'p', 'like', 'say']) want.push(`brn_stk_${id}_${i + 1}_${f}`);
        for (let k = 1; k <= n; k++) want.push(`brn_stk_${id}_${i + 1}_f${k}l`, `brn_stk_${id}_${i + 1}_f${k}`);
        assert.ok(!inBoth(`brn_stk_${id}_${i + 1}_f${n + 1}`), `${id} stop ${i + 1} has exactly ${n} rows`); });
    }
    assert.deepEqual(want.filter(k => !inBoth(k)), []);
  });
  test('4c every glossary word marked in a sentence has its meaning', () => {
    const STK = I18N.split('\n').filter(l => /^    brn_stk_/.test(l)).join('\n');
    const ids = new Set([...STK.matchAll(/\[\[([a-z]+)[|\]]/g)].map(m => m[1]));
    assert.ok(ids.size > 10);
    assert.deepEqual([...ids].filter(i => !inBoth('brn_stk_w_' + i) || !inBoth('brn_stk_wd_' + i)), []);
  });
});

describe('f659 (5) — the fifth view, and its place', () => {
  test('5a Stack is the fifth view, after the lanes, and draws in SVG over the stage', () => {
    assert.match(VIEW, /const BRAIN_STACK_VIEW = 4;/);
    assert.match(VIEW, /const BR_VIEW_KEYS = BRAIN_VIEWS\.concat\('lanes', 'stack'\);/);
    assert.match(VIEW, /\.br-root\.is-stack \.br-stage canvas/);
    assert.match(VIEW, /<svg class="br-sk"/);
  });
  test('5b a refresh on Stack comes back to Stack, its trip and its stop', () => {
    assert.match(APP, /brain:\['brPlace','brPlacePut'\]/);
    assert.match(VIEW, /function brPlace\(\)\{ return brStackOn\(\) \? \{ view: 'stack', trip: _brStk\.trip, stop: _brStk\.cur \} : null; \}/);
  });
  test('5c the Brain names its new parts (rule 9)', () => {
    const B = require('../js/brainmap.js');
    for (const id of ['stackview', 'brainread']){
      assert.ok(B.BRAIN_PARTS.some(p => p.id === id), id);
      assert.ok(B.BRAIN_FLOWS.some(f => f.steps.some(s => s.includes(id))), id + ' in a flow');
      assert.ok(B.brainLaneOf(id), id + ' in a lane');
    }
  });
});
