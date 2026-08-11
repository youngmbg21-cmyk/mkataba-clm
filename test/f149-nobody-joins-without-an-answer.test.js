/* ============================================================
   f149 — nobody joins the workspace without an answer on access

   Adding a person used to ask for a name, an email, a job title, a role and a
   password — and nothing at all about which value streams they may see. That
   is not a missing field, it is a missing DECISION: an account with no entry in
   the folderAccess map sees EVERY stream, so the fastest path through the form
   was also the widest possible grant, made silently and by omission. An admin
   who meant to restrict somebody had to remember, afterwards, to open a second
   editor on the row they had just created.

   What this file pins:

     · the add-member form asks the access question, and its first option
       carries no value — so "I said nothing" is not a grant
     · adding with the question unanswered is refused, and creates no account
     · "All streams" is a real answer: the account is created and no restriction
       is written (an absent key is what unrestricted MEANS here)
     · "only these streams" writes the restriction for the account that was just
       created, through the same dedicated endpoint the row editor uses — not
       the whole-settings blob, which a concurrent save can clobber
     · picking "only these streams" and then ticking none is refused
     · an admin is not asked: the role always carries every stream, so the
       control is disabled rather than collecting an answer that gets ignored
     · the three roles are explained on screen — "Viewer" says what it costs
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];

/* The team screen on a real DOM, so the form's own listeners run and a click
   goes through the product's guard rather than a paraphrase of it. */
function stage() {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;

  const me = { id: 'u_admin', name: 'Young Mbagaya', role: 'admin', email: 'admin@hati.test' };
  const log = { toasts: [], api: [] };

  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; },
    clearTimeout() {},
    document: win.document, localStorage: win.localStorage, FileReader: win.FileReader,
    // ---- the shell around the view ----
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>',
    fval: id => (win.document.getElementById(id) || {}).value || '',
    money: n => String(n),
    validEmail: e => /.+@.+\..+/.test(String(e || '')),
    newSalt: () => 'salt',
    hashPassword: async () => 'hash',
    nowISO: () => '2026-08-07T00:00:00.000Z',
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    api: async (route, method, body) => { log.api.push({ route, method, body }); return { user: { ...body, id: 'u_new' } }; },
    API_MODE: () => true,
    isAdmin: () => me.role === 'admin',
    currentUser: () => me,
    getUsers: () => sb.REMOTE.users,
    saveUsers: u => { sb.REMOTE.users = u; },
    canViewValues: () => true,
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    saveSettings: async () => {},
    openModal() {}, closeModal() {}, setActiveNav() {},
    confirmDialog: async () => false, promptDialog: async () => null,
    lsGet: () => null, lsSet() {}, downloadFile() {},
    clauseLibrary: () => [], getOrg: () => ({}), LS: {}, uid: 'u',
    approvalRules: () => [], playbook: () => ({}), CONTRACT_TYPES: {},
    i18tn: (k, n, v) => k,
    state: { contracts: [], settings: {}, view: 'team' },
    REMOTE: { me, users: [me] },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  sb.renderTeam();

  const $ = id => win.document.getElementById(id);
  const fill = (name, email, pass) => { $('tm-name').value = name; $('tm-email').value = email; $('tm-pass').value = pass; };
  const click = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  const change = el => el.dispatchEvent(new win.Event('change', { bubbles: true }));
  // the product rebinds REMOTE.users on a create, so member count is read
  // through the object the product writes, never through a captured array
  const memberCount = () => sb.REMOTE.users.length;
  return { win, sb, $, log, memberCount, me, fill, click, change };
}

/* The click handler is async (it awaits the create call), so a test that reads
   straight after dispatching would read the state before it. */
const settle = () => new Promise(r => setImmediate(r));

describe('f149 — the access question is part of adding somebody', () => {
  test('the form asks, and its first option carries no value', () => {
    const { $ } = stage();
    const sel = $('tm-access');
    assert.ok(sel, 'the add-member form has a folder access control');
    assert.equal(sel.options[0].value, '', 'the default option is not an answer');
    assert.equal(sel.value, '', 'nothing is pre-chosen');
    const values = [...sel.options].map(o => o.value);
    assert.deepEqual(Array.from(values), ['', '*', 'pick']);
    // and every stream in FOLDERS is offered to tick
    assert.ok($('tm-access-list').querySelectorAll('[data-tm-folder]').length >= 6);
  });

  /* ---- AND THE ROLE THE FORM OPENS ON ----
     Added 09 Aug 2026, reported the same way the access question was: the
     dropdown opened on "Editor — edit & sign", so an admin who typed a name and
     an email and never looked at it had handed over the right to redline and to
     SIGN. Same rule as the access control beside it — the quietest path through
     a form must not be the widest grant — but expressed differently, because a
     role is unavoidable in a way an access answer is not: there is a safe
     default here, so the form takes it. A skipped answer now costs a follow-up
     rather than an authority nobody meant to give. */
  test('the role opens on the SAFE one, not the powerful one', () => {
    const { $ } = stage();
    const sel = $('tm-role');
    assert.ok(sel, 'the add-member form has a role control');
    assert.equal(sel.value, 'viewer', 'a skipped answer must not grant edit and signature');
    assert.equal(sel.options[0].value, 'viewer', 'and it is what the closed control reads');
    assert.deepEqual(Array.from([...sel.options].map(o => o.value)), ['viewer', 'legal', 'admin'],
      'all three are still offered — this is a default, not a restriction');
  });

  test('adding without touching the role creates a viewer', async () => {
    const { $, log, fill, click, change } = stage();
    fill('John Wayne', 'john@hati.test', 'temp12345');
    $('tm-access').value = '*'; change($('tm-access'));
    click($('tm-add'));
    await settle();
    const create = log.api.filter(c => c.route === 'users');
    assert.equal(create.length, 1, 'the account was created');
    assert.equal(create[0].body.role, 'viewer', 'the role that travelled is the safe one');
  });

  test('unanswered is refused — no account is created', async () => {
    const { $, log, memberCount, fill, click } = stage();
    fill('John Wayne', 'john@hati.test', 'temp12345');
    click($('tm-add'));
    await settle();
    assert.equal(memberCount(), 1, 'nobody was added');
    assert.equal(log.api.filter(c => c.route === 'users').length, 0, 'no create call went out');
    assert.ok(log.toasts.some(t => t.kind === 'err'), 'the admin was told why');
  });

  test('"all streams" is a real answer — the account is created, unrestricted', async () => {
    const { $, log, memberCount, fill, click, change, sb } = stage();
    fill('John Wayne', 'john@hati.test', 'temp12345');
    $('tm-access').value = '*'; change($('tm-access'));
    click($('tm-add'));
    await settle();
    assert.equal(memberCount(), 2, 'the member was added');
    assert.equal(log.api.filter(c => c.route === 'settings/folder-access').length, 0,
      'unrestricted is the ABSENCE of an entry, not an entry listing everything');
    assert.deepEqual(Object.keys(sb.state.settings.folderAccess || {}), []);
  });

  test('"only these streams" restricts the account it just created', async () => {
    const { $, log, memberCount, fill, click, change, sb } = stage();
    fill('Simon Jordan', 'simon@hati.test', 'temp12345');
    $('tm-access').value = 'pick'; change($('tm-access'));
    const boxes = $('tm-access-list').querySelectorAll('[data-tm-folder]');
    boxes[0].checked = true; boxes[2].checked = true;
    const want = [boxes[0].getAttribute('data-tm-folder'), boxes[2].getAttribute('data-tm-folder')];
    click($('tm-add'));
    await settle();
    assert.equal(memberCount(), 2, 'the member was added');
    const fa = log.api.filter(c => c.route === 'settings/folder-access');
    assert.equal(fa.length, 1, 'the restriction went through the dedicated endpoint');
    assert.equal(fa[0].method, 'PUT');
    assert.equal(fa[0].body.userId, 'u_new', 'and it names the account that was just created');
    // the arrays are built inside the vm realm, so copy before comparing
    assert.deepEqual(Array.from(fa[0].body.folders), want);
    assert.deepEqual(Array.from(sb.state.settings.folderAccess.u_new), want);
  });

  test('"only these streams" with none ticked is refused', async () => {
    const { $, log, memberCount, fill, click, change } = stage();
    fill('Nobody Yet', 'nobody@hati.test', 'temp12345');
    $('tm-access').value = 'pick'; change($('tm-access'));
    click($('tm-add'));
    await settle();
    assert.equal(memberCount(), 1, 'nobody was added');
    assert.equal(log.api.filter(c => c.route === 'users').length, 0);
    assert.ok(log.toasts.some(t => t.kind === 'err'));
  });

  test('an admin is not asked — the role already carries every stream', async () => {
    const { $, log, memberCount, fill, click, change } = stage();
    fill('Another Admin', 'admin2@hati.test', 'temp12345');
    $('tm-role').value = 'admin'; change($('tm-role'));
    assert.equal($('tm-access').disabled, true, 'the control is off rather than silently ignored');
    assert.notEqual($('tm-access-note').style.display, 'none', 'and it says why');
    click($('tm-add'));
    await settle();
    assert.equal(memberCount(), 2, 'the admin was added with no access question');
    assert.equal(log.api.filter(c => c.route === 'settings/folder-access').length, 0);
  });

  test('the roles are explained where they are chosen', () => {
    const { win } = stage();
    const html = win.document.getElementById('content').innerHTML;
    const help = require('../js/i18n.js').STRINGS.en.set_role_help;
    assert.ok(/viewer/i.test(help) && /read/i.test(help),
      'the help text says what a Viewer can and cannot do');
    assert.ok(html.includes(help), 'and it is on the screen beside the role picker');
  });
});
