/* ============================================================
   f202 — a staff directory everybody can read

   Settings & Rules became admin-only in August 2026, so a colleague could no
   longer sit and read the roster in one place. This gives that back.

   IT IS A SCREEN, NOT A PERMISSION CHANGE, and that is the whole reason it is
   two hours' work rather than two days. What the admin-only page took away was
   a PAGE, not the information: every signed-in member already receives the
   full roster at sign-in — name, email, role, job title — because the reviewer
   picker, the desk contributor picker and the approval rules all have to name
   colleagues. So this page adds NO route and asks the server nothing new.

   THE HALF THIS FILE EXISTS FOR IS THE ABSENCE. Who can see which folders is
   deliberately not in a non-admin's browser: stripped from the settings blob
   AND stripped from every colleague's user record, because handing the same
   map back one record at a time was the same disclosure more slowly. Signing
   limits, who checks whose work, per-folder signing rights and the approval
   rules are the same. This page cannot leak them by accident — the data is not
   there — but a future change that put it back would silently widen it. So the
   absence is ASSERTED, twice: once against a real server's bootstrap for a
   restricted member, and once against the rendered page built from exactly
   what that bootstrap contained.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* The real view on a real DOM, over whatever roster it is handed — so the
   "what is on the page" questions can be asked of a page built from a REAL
   server's answer rather than from a fixture somebody invented. */
function stage(users, me) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map,
    document: win.document, localStorage: win.localStorage,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    i18t: (k, v) => String(k) + (v ? ' ' + JSON.stringify(v) : ''),
    i18tn: (k, n) => `${k}:${n}`,
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    getUsers: () => users,
    currentUser: () => me || users[0],
    isAdmin: () => !!(me && me.role === 'admin'),
    openSettingsAt() {},
    state: { settings: {} },
  };
  sb.window = sb;
  vm.createContext(sb);
  vm.runInContext(read('js/views/directory.js'), sb, { filename: 'directory.js' });
  sb.renderDirectory();
  return { sb, doc: win.document, html: win.document.getElementById('content').innerHTML };
}

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { await h.stop(); });

/* ============================================================
   THE PAGE, BUILT FROM WHAT A RESTRICTED MEMBER'S BROWSER ACTUALLY HOLDS
   ============================================================ */
describe('f202 — a restricted member sees every colleague', () => {
  let boot, page;
  before(async () => {
    boot = await W.restricted.json('/api/bootstrap');
    page = stage(boot.users, boot.me);
  });

  test('the roster really does reach them — this is the premise, not an assumption', () => {
    assert.ok(boot.users.length >= 4, `${boot.users.length} people in their own bootstrap`);
    assert.ok(boot.users.some(u => u.name === 'Amina Otieno'), 'including the admin');
  });

  test('and every one of them is on the page, with their role and their address', () => {
    for (const u of boot.users) {
      assert.ok(page.html.includes(u.name), `${u.name} is listed`);
      if (u.email) assert.ok(page.html.includes(u.email), `${u.email} is listed`);
    }
    assert.equal(page.doc.querySelectorAll('[data-dir-row]').length, boot.users.length);
  });

  test('D-2: who is an admin is stated — knowing who to ask is the point', () => {
    const rows = [...page.doc.querySelectorAll('[data-dir-row]')];
    const admin = rows.find(r => /Amina Otieno/.test(r.textContent));
    assert.match(admin.querySelector('.dir-role').textContent, /Admin/);
  });

  test('D-1: the address is a link, because a directory you cannot act on is a list', () => {
    const a = page.doc.querySelector('.dir-mail a');
    assert.ok(a && a.getAttribute('href').startsWith('mailto:'), 'mailto');
  });

  test('admins are listed first, then everybody by name', () => {
    const names = [...page.doc.querySelectorAll('.dir-name')].map(n => n.textContent.trim());
    assert.match(names[0], /Amina Otieno/, 'the admin');
    const rest = names.slice(1).map(s => s.toLowerCase());
    assert.deepEqual(Array.from(rest), Array.from(rest.slice().sort()), 'and the rest alphabetically');
  });

  test('nothing on it is a button that changes something', () => {
    /* One press on the whole page and it is a mailto, which leaves the app. A
       non-admin has nowhere to be sent, so they are offered nothing. */
    assert.equal(page.doc.querySelectorAll('#dir-page button').length, 0);
  });
});

/* ============================================================
   WHAT MUST NOT APPEAR ON IT — asserted, not trusted
   ============================================================ */
describe('f202 — the page carries nothing that was closed on purpose', () => {
  let boot, page;
  before(async () => {
    boot = await W.restricted.json('/api/bootstrap');
    page = stage(boot.users, boot.me);
  });

  test('THE DATA IS NOT THERE: folder access is absent from every colleague\'s record', () => {
    /* The M-3 fix, done in two halves — stripped from the settings blob, then
       stripped from the per-user records. This is the FIRST half of the proof:
       whatever the page draws, it cannot draw what it was never given. */
    const mine = boot.users.find(u => u.id === boot.me.id);
    assert.deepEqual(Array.from(mine.folderAccess || []), ['proc'], 'they get their OWN scope');
    const others = boot.users.filter(u => u.id !== boot.me.id);
    assert.ok(others.length >= 3);
    for (const u of others)
      assert.equal(u.folderAccess, undefined, `${u.name}'s scope is not sent`);
    assert.equal(((boot.settings || {}).folderAccess), undefined,
      'and the workspace-wide map is not in their settings blob either');
  });

  test('and GET /api/settings does not exist for them at all', async () => {
    const r = await W.restricted.raw('/api/settings');
    assert.equal(r.status, 404);
  });

  test('THE PAGE DOES NOT NAME ANY OF IT — folders, limits, review, approvals', () => {
    /* The SECOND half. A future change that put the data back into the
       bootstrap must not silently widen this page, so what the renderer asks
       for is pinned as well as what it receives. */
    const src = read('js/views/directory.js');
    for (const forbidden of ['folderAccess', 'userFolderAccess', 'canAccessFolder', 'visibleFolders',
      'signCap', 'signFolder', 'reviewChecked', 'reviewerId', 'overseerId', 'approvalRules'])
      assert.ok(!new RegExp(forbidden).test(src),
        `the directory reads ${forbidden} — that is an admin-only fact and it is not this page's`);
  });

  test('and none of it is on the rendered page either', () => {
    const words = page.html.toLowerCase();
    for (const w of ['folderaccess', 'signcap', 'reviewchecked', 'overseer', 'proc"', 'value stream'])
      assert.ok(!words.includes(w), `"${w}" appears on the directory`);
  });

  test('the page adds no route — it reads the roster the browser already holds', () => {
    const src = read('js/views/directory.js');
    assert.ok(!/\bapi\(/.test(src), 'no call to the server');
    assert.match(src, /getUsers\(\)/, 'the bootstrap roster, and nothing else');
  });
});

/* ============================================================
   D-3 — A VIEWER SEES IT, AND AN ADMIN SEES ONE EXTRA LINE
   ============================================================ */
describe('f202 — every role', () => {
  const roster = [
    { id: 'a', name: 'Amina Otieno', role: 'admin', email: 'a@x.test', title: 'CEO' },
    { id: 'v', name: 'Vera Reader', role: 'viewer', email: 'v@x.test', title: '' },
  ];

  test('D-3: a Viewer gets the whole list — reading who is here is their level of access', () => {
    const p = stage(roster, roster[1]);
    assert.equal(p.doc.querySelectorAll('[data-dir-row]').length, 2);
    assert.match(p.html, /Amina Otieno/);
    assert.match(p.html, /a@x\.test/);
  });

  test('a Viewer is offered no door to Settings, because they have none', () => {
    const p = stage(roster, roster[1]);
    assert.equal(p.doc.querySelector('#dir-manage'), null);
  });

  test('an admin IS pointed at Settings → People, so the two screens are not confused', () => {
    const p = stage(roster, roster[0]);
    assert.ok(p.doc.querySelector('#dir-manage'), 'one line, and it is a real door');
  });

  test('the reader is marked on their own row', () => {
    const p = stage(roster, roster[1]);
    const mine = [...p.doc.querySelectorAll('[data-dir-row]')].find(r => r.getAttribute('data-dir-row') === 'v');
    assert.ok(mine.querySelector('.dir-you'));
  });

  test('a missing job title and a missing address each say so rather than going blank', () => {
    const p = stage([{ id: 'x', name: 'No Details', role: 'legal', email: '', title: '' }], { id: 'x', role: 'legal' });
    assert.match(p.html, /dir_no_title/);
    assert.match(p.html, /dir_no_email/);
  });
});

/* ============================================================
   THE DOOR, THE ROUTE AND THE PHONE
   ============================================================ */
describe('f202 — it has a door on both shells', () => {
  test('the nav item is in the EVERYDAY group, not under Administration', () => {
    const html = read('index.html');
    const work = html.slice(html.indexOf('<div class="nav-section open" data-section="work">'),
      html.indexOf('<div class="nav-section" data-section="settings">'));
    assert.match(work, /data-view="directory"/,
      'reading who is in the workspace is not an administrative act');
    assert.match(work, /data-i18n="nav_people"/);
  });

  test('and it is NOT hidden for anybody — unlike Settings & Rules', () => {
    /* setActiveNav hides the team door for a non-admin. Nothing does that to
       this one, and the test names the mechanism so a future gate has to be a
       deliberate act rather than a copy-paste. */
    const app = read('js/app.js');
    assert.match(app, /nav-item\[data-view="team"\]/, 'the team door is gated');
    assert.ok(!/nav-item\[data-view="directory"\]/.test(app), 'this one is not');
  });

  test('the view routes, and survives a session restore', () => {
    const app = read('js/app.js');
    assert.match(app, /view==='directory'\) renderDirectory\(\)/);
    assert.match(app, /directory:'People'/, 'and it has a name for the failure toast');
    const core = read('js/core.js');
    assert.match(core, /'team','directory'/,
      'a view missing from the restore whitelist lands the reader on the dashboard instead');
  });

  test('the phone draws the SAME list rather than handing it off to a computer', () => {
    const m = read('js/mobile.js');
    assert.match(m, /function mPeopleHtml/);
    assert.match(m, /dirPeople\(\)/, 'the desktop\'s ordering — the two shells cannot disagree');
    assert.match(m, /s\.screen==='people'\)\s*body = mPeopleHtml\(\)/);
    /* And it is genuinely not on the handoff list, which is what would make it
       a row promising a page and delivering a refusal. */
    const desk = m.slice(m.indexOf('const M_DESK = ['), m.indexOf('const M_CSS'));
    assert.ok(!/directory|'people'/.test(desk));
  });

  test('the phone\'s back goes to More, which is where it was reached from', () => {
    const m = read('js/mobile.js');
    assert.match(m, /s\.screen==='people'\)\{ mGo\('more'\); return; \}/);
  });

  test('and the two shells agree about which screen the view is', () => {
    const m = read('js/mobile.js');
    assert.match(m, /directory:'people'/);
    assert.match(m, /people:'directory'/);
  });
});

describe('f202 — both languages', () => {
  test('every new word is in en and sv', () => {
    const i18n = read('js/i18n.js');
    for (const k of ['nav_people', 'nav_people_title', 'pg_people_sub', 'dir_no_title',
      'dir_no_email', 'dir_manage', 'dir_empty', 'dir_note']) {
      const hits = i18n.match(new RegExp(`\\b${k}:`, 'g')) || [];
      assert.equal(hits.length, 2, `${k} appears ${hits.length} times, expected en + sv`);
    }
    for (const k of ['dir_count_one', 'dir_count_other'])
      assert.equal((i18n.match(new RegExp(`\\b${k}:`, 'g')) || []).length, 2, k);
  });
});

/* ============================================================
   AND SETTINGS → PEOPLE IS UNCHANGED
   ============================================================ */
describe('f202 — the editable roster did not move', () => {
  test('Settings still owns editing, and is still admin-only', () => {
    const set = read('js/views/settings.js');
    assert.match(set, /function stPeopleHtml/, 'the editable list is where it was');
    assert.match(set, /data-st-panel="person:/, 'and its rows still open the person drawer');
    const fn = set.slice(set.indexOf('function renderTeam'), set.indexOf('function renderTeam') + 700);
    assert.match(fn, /!isAdmin\(\)/);
  });

  test('and the directory opens nobody\'s drawer', () => {
    const src = read('js/views/directory.js');
    assert.ok(!/settingsPersonDrawer|data-st-panel/.test(src));
  });
});
