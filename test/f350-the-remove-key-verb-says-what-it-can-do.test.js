/* ============================================================
   f350 — "I can save but i cannot delete"

   The owner moved the Anthropic key onto the server's own environment and
   then reported that Remove key no longer worked.

   MEASURED FIRST, against a real server, before a line moved: the press was
   never broken. With a key stored in the workspace it clears it, and the read
   afterwards answers exactly what it should. Sections (a) and (b) below are
   that measurement, kept as NAMED CONTROLS — they pass on both sides of this
   change and exist so that nobody later "fixes" a press that works.

   What was broken is that the SCREEN said nothing. Three things made a
   working button read as a dead one:

     1. With a key in the server's environment the button is a NO-OP, and it
        was drawn in full colour anyway. Press it and you get a confirm, a
        toast, and a status line that says "Configured" before and after. The
        app cannot delete the server's key and must not pretend to.
     2. With NO key anywhere the same button was still live, offering to
        remove nothing.
     3. The confirm named the wrong cost: it promised a fall back to the
        built-in interpreter even when a server key was waiting underneath
        and Copilot would carry straight on.

   So the verb says what it can do. ONE READING (stKeyRemovable) and ONE
   PAINTER (stPaintKeyClear), asked at every paint in BOTH homes — the
   local-mode panel and the server one — because this product draws the same
   control twice and a rule written twice drifts.

   Every claim below that is not marked CONTROL fails at the parent.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];

/* The real panel on a real DOM. The two functions under test are called the
   way the drawer calls them — build the body, then wire it — rather than the
   whole settings page being stood up, because the whole page is not what
   moved and staging it would put 60 lines of scaffolding between the claim
   and the thing it measures. */
function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const log = { toasts: [], confirms: [], api: [] };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; },
    clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: win.document, localStorage: win.localStorage, location: win.location,
    MutationObserver: win.MutationObserver, FileReader: win.FileReader,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s), PB_ATTR: s => String(s == null ? '' : s),
    icon: () => '<svg></svg>',
    API_MODE: () => opts.api !== false,
    isAdmin: () => true, currentUser: () => ({ id: 'u_me', name: 'Young', role: 'admin' }),
    getUsers: () => [], roleName: () => 'Admin',
    nowISO: () => '2026-09-21T00:00:00.000Z', fmtDT: v => String(v),
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    api: async (route) => { log.api.push(route); return opts.cfg || {}; },
    /* Records what the reader was actually asked, and answers NO — a test
       that confirmed would be measuring the clear, which (a) already does. */
    confirmDialog: async o => { log.confirms.push(o); return false; },
    promptDialog: async () => null,
    stDrawerRefuse() {}, stDrawerClearRefusal() {},
    lsGet: k => sb.__ls[k] || null,
    lsSet: (k, v) => { sb.__ls[k] = v; },
    __ls: opts.ls || {},
    renderSideUser() {}, updateAiBrainPill() {},
    downloadFile() {}, openModal() {}, closeModal() {},
    clauseLibrary: () => [], getOrg: () => ({ name: 'Highland Corporate Ltd' }),
    LS: { org: 'o', users: 'u', session: 's', data: 'd', ui: 'i' }, uid: 100,
    approvalRules: () => [], saveApprovalRules() {}, playbook: () => ({}), CONTRACT_TYPES: {},
    copilotAvailable: () => true, emailOff: () => false, signerPlan: () => [],
    navShowEverything: () => false, sha256IsReal: () => true,
    state: { contracts: [], settings: {}, view: 'team', aiCfg: {} },
    REMOTE: { me: { id: 'u_me', name: 'Young', role: 'admin' }, users: [] },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  win.document.getElementById('content').innerHTML = sb.stEngineBodyHtml();
  return { win, sb, log,
    btn: () => win.document.getElementById('ai-key-clear'),
    click: el => el.dispatchEvent(new win.Event('click', { bubbles: true })) };
}
const settle = async () => { for (let i = 0; i < 8; i++) await new Promise(r => setImmediate(r)); };

/* ============================================================
   (a) and (b) — THE MEASUREMENT. Both are CONTROLS: they pass at the parent
   and after, and they are what proves the press itself was never the fault.
   ============================================================ */
describe('f350 (a) CONTROL — the press does exactly what it always did', () => {
  let h, W;
  before(async () => { h = await startHati({ ANTHROPIC_API_KEY: 'sk-ant-env-AAAA' }); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('a stored key is cleared, and the server\'s own key takes over', async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { key: 'sk-ant-settings-BBBB' } });
    let c = await W.admin.json('/api/ai/config');
    assert.equal(c.source, 'settings', 'the stored key leads while it exists');
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { clear: true } });
    c = await W.admin.json('/api/ai/config');
    assert.equal(c.configured, true, 'Copilot keeps working');
    assert.equal(c.source, 'env', 'and it is now the server\'s key');
  });

  /* The field the screen needs and did not have. RED at the parent. */
  test('the read says whether the server\'s own environment holds a key', async () => {
    const c = await W.admin.json('/api/ai/config');
    assert.equal(c.envKey, true, 'envKey is a boolean fact, never the key itself');
    assert.ok(!JSON.stringify(c).includes('sk-ant-env-AAAA'), 'and the key never travels');
  });
});

describe('f350 (b) CONTROL — with nothing underneath, removing really does switch it off', () => {
  let h, W;
  before(async () => { h = await startHati({ ANTHROPIC_API_KEY: '' }); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  before(async () => {
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { key: 'sk-ant-settings-CCCC' } });
    await W.admin.json('/api/ai/config', { method: 'PUT', body: { clear: true } });
  });

  test('CONTROL — clearing the only key leaves Copilot unconfigured', async () => {
    const c = await W.admin.json('/api/ai/config');
    assert.equal(c.configured, false);
    assert.equal(c.source, null);
  });

  /* Its own claim, so the control above stays a control. RED at the parent. */
  test('and the read says the server holds none either, rather than leaving it unsaid', async () => {
    assert.equal((await W.admin.json('/api/ai/config')).envKey, false);
  });
});

/* ============================================================
   (c) THE ONE READING
   ============================================================ */
describe('f350 (c) — one reading of whether the verb can act', () => {
  test('a key stored in this workspace can be removed', () => {
    const { sb } = stage();
    assert.equal(sb.stKeyRemovable('settings').can, true);
    assert.equal(sb.stKeyRemovable('settings').why, '', 'nothing to explain when it works');
  });

  test('a key set on the server cannot be, and the reason says where it lives', () => {
    const { sb } = stage();
    const r = sb.stKeyRemovable('env');
    assert.equal(r.can, false);
    assert.ok(/server/i.test(r.why), 'names the server: ' + r.why);
  });

  test('no key at all is refused too — a verb with nothing to act on', () => {
    const { sb } = stage();
    assert.equal(sb.stKeyRemovable(null).can, false);
  });

  /* An absence is stated, never guessed: a read that has not landed, or one
     that failed, must not claim there is nothing stored. */
  test('"not known yet" is its own answer and is not "there is nothing to remove"', () => {
    const { sb } = stage();
    const unknown = sb.stKeyRemovable(undefined), none = sb.stKeyRemovable(null);
    assert.equal(unknown.can, false);
    assert.notEqual(unknown.why, none.why, 'two different silences, two different sentences');
  });
});

/* ============================================================
   (d) THE PANEL — measured on the real markup, both ways
   ============================================================ */
describe('f350 (d) — the button on the server panel says what it can do', () => {
  test('a key from the server\'s environment greys it, with the reason on it', async () => {
    const s = stage({ cfg: { configured: true, source: 'env', envKey: true, hint: '••••RwAA' } });
    s.sb.stWireEngine(); await settle();
    const b = s.btn();
    assert.equal(b.disabled, true, 'a no-op press is not offered');
    assert.ok(/server/i.test(b.title || ''), 'and it says why: ' + (b.title || '(nothing)'));
  });

  test('CONTROL — a key stored in the workspace leaves it live', async () => {
    const s = stage({ cfg: { configured: true, source: 'settings', envKey: false, hint: '••••BBBB' } });
    s.sb.stWireEngine(); await settle();
    assert.equal(s.btn().disabled, false, 'the press that works is still offered');
  });

  test('no key anywhere greys it too', async () => {
    const s = stage({ cfg: { configured: false, source: null, envKey: false, hint: '' } });
    s.sb.stWireEngine(); await settle();
    assert.equal(s.btn().disabled, true);
  });

  test('the confirm names the real cost when a server key is waiting underneath', async () => {
    const s = stage({ cfg: { configured: true, source: 'settings', envKey: true, hint: '••••BBBB' } });
    s.sb.stWireEngine(); await settle();
    s.click(s.btn()); await settle();
    const m = String((s.log.confirms[0] || {}).message || '');
    assert.ok(/server/i.test(m), 'says Copilot carries on with the server\'s key: ' + m);
    assert.ok(!/built-in interpreter/i.test(m), 'and does not promise a fall back that will not happen');
  });

  test('CONTROL — with nothing underneath, the confirm still names the fall back', async () => {
    const s = stage({ cfg: { configured: true, source: 'settings', envKey: false, hint: '••••BBBB' } });
    s.sb.stWireEngine(); await settle();
    s.click(s.btn()); await settle();
    assert.ok(/built-in interpreter/i.test(String((s.log.confirms[0] || {}).message || '')));
  });
});

/* ============================================================
   (e) THE SECOND HOME — the same control, drawn by the local-mode panel.
   Rule 1 of this codebase: a fix in one place is not a fix in both.
   ============================================================ */
describe('f350 (e) — the local-mode panel draws the same verb, under the same rule', () => {
  test('with no key in this browser the verb is refused', () => {
    const s = stage({ api: false, ls: {} });
    s.sb.stWireEngine();
    assert.equal(s.btn().disabled, true);
  });

  test('CONTROL — with a key in this browser it is live', () => {
    const s = stage({ api: false, ls: { 'hati.v1.aikey': 'sk-ant-local-DDDD' } });
    s.sb.stWireEngine();
    assert.equal(s.btn().disabled, false);
  });
});

/* ============================================================
   (f) A key removed from one book leaves a screen half-English.
   ============================================================ */
describe('f350 (f) — the new wording is in both books', () => {
  test('every new key exists in English and in Swedish', () => {
    const src = fs.readFileSync(path.join(ROOT, 'js/i18n.js'), 'utf8');
    for (const k of ['set_key_env_locked', 'set_key_none_to_remove',
      'set_key_remove_msg', 'set_key_remove_to_env']) {
      const n = (src.match(new RegExp('\\b' + k + ':', 'g')) || []).length;
      assert.equal(n, 2, `${k} appears ${n} time(s); both books need it`);
    }
  });
});
