/* f691 — THE CONTROL ROOM (owner picked it by name off "Settings, Three Ways",
   16 Oct 2026, then: "there should be a settings for the admin and a settings
   for the individual ... a tab at the top just like in the home page and first
   one is for the individual and second for the admin. If you are not admin,
   this tab is invisible.")

   What is pinned here:
     · two tabs, You first and where the page opens; Company carries the
       Needs-you count, and the number is the length of the list behind it
     · a non-admin is drawn You with no tab row at all — not a greyed tab, not
       a note about a page they cannot see
     · every old door name still lands (people / platform / build → Company)
     · the governance ladder invents nothing: each gate's "on" is that panel's
       own dot, and "next" is the first gate that is off
     · Jambo finds, explains and READIES — and never writes: no route is
       called, nothing is saved, and the limit he readies sits in the drawer's
       box until the person presses Save
     · a non-admin's Jambo and Menu know their own settings and nobody else
     · both books carry every new sentence

   Run: node --test test/f691-the-control-room.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];
const S = require('../js/i18n.js').STRINGS;

/* The real view on a real DOM, the boundary stubbed (f193's stage, with the
   signing-limit readings the person drawer and Jambo read). */
function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const me = { id: 'u_me', name: 'Young Mbagaya', role: opts.role || 'admin', email: 'me@hati.test', title: 'Chief Executive' };
  const other = { id: 'u_two', name: 'Asha Kimani', role: 'legal', email: 'asha@hati.test', title: '', ...(opts.otherIs || {}) };
  const log = { toasts: [], api: [] };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise, Event: win.Event,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; },
    clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    document: win.document, localStorage: win.localStorage, FileReader: win.FileReader,
    MutationObserver: win.MutationObserver, location: win.location,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>',
    fval: id => (win.document.getElementById(id) || {}).value || '',
    validEmail: e => /.+@.+\..+/.test(String(e || '')),
    nowISO: () => '2026-10-16T00:00:00.000Z', fmtDT: v => String(v),
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    api: async (route, method, body) => { log.api.push({ route, method, body }); return (opts.reply && opts.reply(route, method, body)) || {}; },
    API_MODE: () => true,
    isAdmin: () => me.role === 'admin',
    currentUser: () => me,
    getUsers: () => sb.REMOTE.users,
    userById: id => sb.REMOTE.users.find(u => u.id === id) || null,
    saveUsers: u => { sb.REMOTE.users = u; },
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    saveSettings: async () => {},
    openModal() {}, closeModal() {}, setActiveNav() {}, setView: v => { if (v === 'team') sb.renderTeam(); },
    confirmDialog: async () => true, promptDialog: async () => null,
    lsGet: () => null, lsSet() {},
    downloadFile() {}, clauseLibrary: () => [], getOrg: () => ({ name: 'Highland Corporate Ltd' }),
    LS: { org: 'o', users: 'u', session: 's', data: 'd', ui: 'i' }, uid: 100,
    approvalRules: () => [], saveApprovalRules() {}, approverLabelOf: () => '',
    playbook: () => ({}), CONTRACT_TYPES: {},
    copilotAvailable: () => false, emailOff: () => false,
    reviewGateCfg: () => ({ on: !!opts.reviewOn, when: 'deviation', value: 0 }),
    deskCfg: () => ({ on: false, staleDays: 5 }),
    saveReviewGateCfg() {}, saveDeskCfg() {},
    wsCfg: () => ({ shapes: ['project'], word: 'project' }),
    wsDetect: () => ({ total: 0, project: 0, standing: 0, unknown: 0, suggests: ['project'] }),
    wsSet() {}, wsWord: () => 'project', wsShapes: () => ['project'], WS_WORDS: ['project', 'matter'],
    signerPlan: () => [], navShowEverything: () => false, navSetShowEverything() {},
    openDesignStep() {}, docDesignById: () => null, sha256IsReal: () => true, ensureFull: async () => {},
    signCapOf: u => ({ answered: u.signCap != null, limit: typeof u.signCap === 'number' ? u.signCap : null }),
    signCapEnforced: () => !!opts.capOn,
    signApprovalLegacyOn: () => false,
    saRuleOf: u => ({ on: !!u.overseerId, approverId: u.overseerId || '', backupId: u.overseerBackupId || '' }),
    OPENS_ON: ['jambo', 'fill', 'red', 'clauses', 'signing'],
    jamboChipsOn: () => !((me.prefs || {}).jamboChips === false),
    contractOpensOn: () => (me.prefs || {}).opensOn || 'jambo', signCapSentence: () => 'sentence', signCapText: u => (typeof u.signCap === 'number' ? 'up to ' + u.signCap : 'No limit set'),
    fmtMoney: n => 'KES ' + Number(n).toLocaleString('en-US'),
    state: { contracts: [], settings: {}, view: 'team', aiCfg: {}, aiConfigured: !!opts.ai },
    REMOTE: { me, users: [me, other].concat(opts.more || []) },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  sb.renderTeam();
  const $ = id => win.document.getElementById(id);
  const click = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  const flush = () => new Promise(r => setImmediate(r));
  const ask = q => { sb.stJbAsk(q); const t = [...win.document.querySelectorAll('.st-jb-turn')].pop(); return t; };
  return { win, sb, $, log, me, other, click, ask, flush, text: () => $('content').textContent };
}

describe('f691 — two tabs, like Home\'s', () => {
  test('You first and where the page opens; Company second', () => {
    const { win } = stage();
    const faces = [...win.document.querySelectorAll('#set-page .st-face')].map(b => b.getAttribute('data-st-tab'));
    assert.deepEqual(faces, ['you', 'company'], 'exactly two, in the owner\'s order');
    assert.equal(win.document.querySelector('.st-face[aria-selected="true"]').getAttribute('data-st-tab'), 'you', 'the first tab is where the page opens');
    assert.equal(win.document.getElementById('set-page').getAttribute('data-st-face'), 'you');
    assert.ok(win.document.querySelector('[data-st-you-card="who"]'), 'You draws the person\'s own settings');
  });
  test('the number on Company is the length of the Needs-you list behind it', () => {
    const { sb, win } = stage({ capOn: true });
    const n = sb.stNeedsAll().length;
    assert.ok(n >= 1, 'this fixture owes something (Asha can sign any amount)');
    const shown = win.document.querySelector('.st-face[data-st-tab="company"] .st-face-n').textContent.trim();
    assert.equal(shown, String(n), 'the count is the list\'s own length');
    sb.settingsGoTab('company');
    const rows = win.document.querySelectorAll('#st-att .st-need[data-st-need]').length;
    assert.equal(rows, Math.min(n, sb.ST_ATTENTION_MAX), 'and the list behind the door shows it (counting past the cap)');
    assert.equal(win.document.querySelector('#st-att .st-needs-n').textContent.trim(), String(n));
  });
  test('a non-admin is drawn You with no tab row at all', () => {
    const { sb, win, text } = stage({ role: 'legal' });
    assert.equal(win.document.querySelectorAll('.st-faces, .st-face, [data-st-tab]').length, 0, 'no tab row, not even greyed');
    assert.ok(!text().includes(S.en.st_admin_only_page), 'and no note about a page they cannot see');
    assert.ok(!text().includes('Asha Kimani'), 'no colleague is named anywhere on the page');
    assert.ok(!win.document.querySelector('[data-st-card="people"], #st-gov, #st-att, #st-people-sec, #st-sheet-card'), 'no company board');
    sb.settingsGoTab('company');
    assert.equal(sb.settingsTab(), 'you', 'and asking for Company by name still draws You');
    assert.ok(!win.document.querySelector('[data-st-card="people"]'), 'nothing of the Company side appears');
  });
  test('every old door name still lands where it meant', () => {
    const { sb, win } = stage();
    for (const old of ['people', 'platform', 'build']) {
      sb.settingsGoTab('you'); sb.settingsGoTab(old);
      assert.equal(win.document.getElementById('set-page').getAttribute('data-st-face'), 'company', `${old} lands on Company`);
    }
    sb.settingsGoTab('people');
    assert.ok(win.document.querySelector('[data-st-pg="team"]'), 'People\'s old name lands on the Team page');
    sb.settingsPlacePut({ tab: 'build' }); assert.equal(sb.settingsPlace().tab, 'company', 'a refresh\'s old stored place maps too');
    sb.settingsPlacePut({ tab: 'you' }); assert.equal(sb.settingsPlace().tab, 'you');
    sb.settingsPlacePut({ tab: 'you', side: 'menu' }); sb.renderTeam();
    assert.equal(sb.settingsPlace().side, 'menu', 'a refresh keeps the panel\'s face too');
    assert.ok(!win.document.getElementById('st-side-menu').hidden && win.document.getElementById('st-side-jambo').hidden, 'and draws it');
    sb.stSideSet('jambo');
    sb.openSettingsAt('build', 'engine');
    assert.ok(!win.document.getElementById('st-drawer').hasAttribute('hidden'), 'a named panel still opens its drawer');
  });
});

describe('f691 — the Company board, as drawn', () => {
  test('a short card per area, People first and the ladder last; every panel is on one, once', () => {
    const { sb, win } = stage();
    sb.settingsGoTab('company');
    const cards = [...win.document.querySelectorAll('.st-cards > [data-st-card]')].map(c => c.getAttribute('data-st-card'));
    /* since round 25 ("Control room") the nine cards are even and the ladder is drawn across the page under them */
    assert.equal(cards[0], 'people'); assert.equal(cards.length, 9); assert.ok(!cards.includes('ladder'));
    const ladder = win.document.querySelector('.st-board > [data-st-card="ladder"]');
    assert.ok(ladder && ladder.previousElementSibling.classList.contains('st-cards'), 'the ladder last, after the cards');
    const panels = [...win.document.querySelectorAll('.st-cards > [data-st-card]:not([data-st-card="people"]):not([data-st-card="ladder"]) [data-st-panel]')]
      .map(b => b.getAttribute('data-st-panel')).filter(k => sb.SET_PANELS[k]);
    const expected = Object.keys(sb.SET_PANELS).filter(k => ['platform', 'build'].includes(sb.SET_PANELS[k].tab) && (!sb.SET_PANELS[k].show || sb.SET_PANELS[k].show()));
    assert.deepEqual(panels.slice().sort(), expected.slice().sort(), 'every company panel is a fact or a door on its card');
    assert.equal(panels.length, expected.length, 'and each one once');
    for (const card of win.document.querySelectorAll('.st-cards > [data-st-card]:not([data-st-card="people"]):not([data-st-card="ladder"])'))
      assert.ok(card.querySelectorAll('.st-fact').length <= 2, `${card.getAttribute('data-st-card')}: two facts at most`);
    assert.ok(win.document.getElementById('st-sheet-card'), 'and the access sheet under them');
  });
  test('the people with gaps lead the access sheet; an amber cell opens what fills it', () => {
    const { sb, win } = stage({ capOn: true, more: [{ id: 'u_three', name: 'Wanjiru Otieno', role: 'legal', email: 'w@hati.test', signCap: 9000 }] });
    sb.settingsGoTab('company');
    const first = win.document.querySelector('#st-sheet-card .st-sh-row');
    assert.match(first.getAttribute('data-st-panel'), /u_two/, 'Asha (any amount) leads');
    assert.ok(first.querySelector('.st-amber-btn[data-st-panel="limits"]'), 'and her amber cell opens everyone\'s limits');
  });
  test('Team and Who holds what are pages inside the board, with the way back', () => {
    const { sb, win, click } = stage();
    sb.settingsGoTab('company');
    sb.settingsGoPage('team');
    assert.ok(win.document.querySelector('[data-st-pg="team"] tr.st-person'), 'Team is the People table');
    assert.equal(sb.settingsPlace().page, 'team', 'and a refresh comes back to it');
    sb.settingsGoPage('sheet');
    const rows = win.document.querySelectorAll('[data-st-pg="sheet"] .st-sh-row').length;
    assert.equal(rows, sb.REMOTE.users.length, 'Who holds what lists everyone');
    click(win.document.querySelector('.st-pg-back'));
    assert.ok(win.document.querySelector('.st-cards'), '‹ Settings goes back to the board');
    assert.equal(sb.settingsPlace().page, null);
  });
});

describe('f691 — Needs you: each row carries what settles it', () => {
  test('any amount, no backup, not signed in — read off the record, each with its button', () => {
    const { sb, win } = stage({ capOn: true,
      otherIs: { overseerId: 'u_me' },
      more: [{ id: 'u_new', name: 'Lena Strom', role: 'viewer', email: 'lena@hati.test', createdAt: '2026-10-09T08:00:00Z', prefs: { mustChangePassword: true } }] });
    sb.settingsGoTab('company');
    /* past four the list counts; the count opens the rest in place */
    const more = win.document.querySelector('[data-st-needs-all]'); if (more) more.dispatchEvent(new win.Event('click', { bubbles: true }));
    const row = k => win.document.querySelector(`#st-att .st-need[data-st-need="${k}"]`);
    assert.ok(row('limits').querySelector('[data-st-panel="limits"]'), 'any amount → everyone\'s limits');
    assert.match(row('limits').textContent, /Asha Kimani/);
    const b = row('backup').querySelector('button');
    assert.equal(b.getAttribute('data-st-panel'), 'person:u_two'); assert.equal(b.getAttribute('data-st-focus'), '#tm-sa-backup', 'the backup box, in her drawer');
    assert.equal(row('invite').querySelector('button').getAttribute('data-st-resend'), 'u_new', 'not signed in → Resend');
  });
  test('Resend is the server\'s send, said by its answer; past four the list counts and folds back', async () => {
    const { sb, win, log, click, flush } = stage({ capOn: true, otherIs: { overseerId: 'u_me' },
      more: [{ id: 'u_new', name: 'Lena Strom', role: 'viewer', email: 'lena@hati.test', prefs: { mustChangePassword: true } }],
      reply: (r) => r === 'users/u_new/invite' ? { ok: true, emailSent: true } : null });
    sb.settingsGoTab('company');
    const n = sb.stNeedsAll().length;
    const more = win.document.querySelector('[data-st-needs-all]');
    assert.equal(!!more, n > sb.ST_ATTENTION_MAX, 'past four the list counts');
    if (more) { click(more); assert.equal(win.document.querySelectorAll('#st-att .st-need[data-st-need]').length, n, 'the count opens the rest');
      click(win.document.querySelector('[data-st-needs-all]')); assert.equal(win.document.querySelectorAll('#st-att .st-need[data-st-need]').length, sb.ST_ATTENTION_MAX, 'pressed again, it folds back');
      click(win.document.querySelector('[data-st-needs-all]')); }
    click(win.document.querySelector('[data-st-resend="u_new"]')); await flush();
    assert.ok(log.api.some(a => a.route === 'users/u_new/invite' && a.method === 'POST'), 'the welcome goes again through the route');
    assert.ok(log.toasts.some(t => t.kind === 'ok' && /Lena Strom/.test(t.m)), 'and "sent" is said only because the server said sent');
  });
});

describe('f691 — the board\'s drawers', () => {
  test('everyone\'s limits: signers only; Save writes only what changed, through the person route', async () => {
    const { sb, $, log, flush } = stage({ capOn: true, more: [{ id: 'u_v', name: 'Vic Viewer', role: 'viewer', email: 'v@hati.test' }] });
    sb.settingsGoTab('company');
    sb.stDrawerOpen('limits');
    const rows = [...$('st-dbody').querySelectorAll('[data-st-lim-row]')].map(r => r.getAttribute('data-st-lim-row'));
    assert.deepEqual(rows, ['u_two'], 'no admin, no viewer');
    $('st-lim-u_two').value = '-5';
    $('st-dsave').dispatchEvent(new sb.document.defaultView.Event('click')); await flush();
    assert.ok(!$('st-drawer-refusal').hasAttribute('hidden'), 'a nonsense limit is refused in words');
    assert.equal(log.api.filter(a => a.method === 'PATCH').length, 0, 'and nothing is written');
    $('st-lim-u_two').value = '5000000';
    $('st-dsave').dispatchEvent(new sb.document.defaultView.Event('click')); await flush();
    const p = log.api.filter(a => a.method === 'PATCH');
    assert.equal(p.length, 1); assert.equal(p[0].route, 'users/u_two'); assert.deepEqual(JSON.parse(JSON.stringify(p[0].body)), { signCap: 5000000 });
  });
  test('turn a gate on lists the ladder\'s rules still off and opens each one\'s own drawer', () => {
    const { sb, $ } = stage();
    sb.stDrawerOpen('gates');
    const doors = [...$('st-dbody').querySelectorAll('[data-st-panel]')].map(b => b.getAttribute('data-st-panel'));
    const off = Array.from(sb.stGovRungs().flatMap(r => r.gates).filter(g => !g.on).map(g => g.key));
    assert.deepEqual(doors, off, 'in the ladder\'s order, each a door to its own drawer');
  });
});

describe('f691 — the governance ladder reads the gates, it decides nothing', () => {
  test('each gate is a real panel, and "on" is that panel\'s own dot', () => {
    for (const reviewOn of [false, true]) {
      const { sb } = stage({ reviewOn });
      for (const r of sb.stGovRungs()) for (const g of r.gates) {
        assert.ok(sb.SET_PANELS[g.key], `${g.key} is a panel this page already has`);
        assert.equal(g.on, sb.SET_PANELS[g.key].state().dot === 'ok', `${g.key}'s rung reads its own dot`);
      }
      const review = sb.stGovRungs().flatMap(r => r.gates).find(g => g.key === 'review');
      assert.equal(review.on, reviewOn, 'turning the review gate on moves the ladder, and nothing else does');
    }
  });
  test('"next" is the first gate that is off, in rung order, or nothing', () => {
    const { sb } = stage();
    const off = sb.stGovRungs().flatMap(r => r.gates).find(g => !g.on);
    assert.equal(sb.stGovNext(), off ? off.key : null);
  });
});

describe('f691 — one search, in plain words', () => {
  test('the words people use find the setting, and say why', () => {
    const { sb } = stage();
    const hits = sb.stFind('salary');
    const keys = hits.map(h => h.panel).filter(Boolean);
    assert.ok(keys.includes('signcap') && keys.includes('folders'), '"salary" finds the signing limits and the streams');
    assert.ok(hits.find(h => h.panel === 'signcap').why.includes('salary'), 'and says it was found by that word');
    assert.equal(sb.stFind('where do I change the logo')[0].panel, 'design', 'filler words are dropped; "logo" is the design');
    assert.ok(sb.stFind('asha').some(h => h.person === 'u_two'), 'a name finds the colleague');
    assert.equal(sb.stFind('the and of').length, 0, 'nothing asked, nothing found');
  });
  test('a non-admin finds their own settings and nothing of the company\'s', () => {
    const { sb } = stage({ role: 'legal' });
    assert.ok(sb.stFind('salary').every(h => h.you), 'no panel, no person');
    assert.ok(sb.stFind('password').some(h => h.you === 'password'), 'their own is found');
  });
  test('one finder behind three boxes: the Menu\'s, ⌘K, and the bar\'s on Settings', () => {
    const { win, $ } = stage();
    const box = $('st-q'); box.value = 'logo'; box.dispatchEvent(new win.Event('input', { bubbles: true }));
    assert.ok(win.document.querySelector('#st-list .st-mrow[data-st-panel="design"]'), 'the Menu finds by plain words');
    const APP = fs.readFileSync(path.join(ROOT, 'js/app.js'), 'utf8');
    assert.match(APP, /stFindRows\(q\)/, '⌘K asks the same finder');
    assert.match(APP, /state\.view==='team'\)\{ const typed=search\.value; search\.value=''; openCommandPalette\(typed\)/, 'on Settings the bar\'s box IS the ⌘K box');
    assert.match(APP, /view==='team'\?'st_find_ph':'sh_search_ph'/, 'and says so');
  });
});

describe('f691 — the You board, as drawn', () => {
  test('a short card per part of you; each door opens the drawer with that control in it', () => {
    const { sb, win, $ } = stage();
    for (const it of sb.stYouItems().filter(i => i.key !== 'password'))
      assert.ok(win.document.querySelector(`[data-st-you-card="${it.key}"]`), `${it.key} has a card`);
    for (const [door, ids] of [['me:who', ['acct-title']], ['me:safety', ['ts-toggle', 'sessions-list']], ['me:work', ['pref-jb-chips', 'pref-opens-on']], ['me:told', []], ['me:password', ['pw-cur', 'pw-new', 'pw-again']]]) {
      sb.stDrawerOpen(door);
      for (const id of ids) assert.ok($(id), `${door} holds #${id}`);
    }
    sb.stDrawerOpen('me:told');
    assert.equal($('st-dbody').querySelectorAll('[data-pref-brief]').length, 3, 'the brief, three answers');
    sb.openMyAccount();
    assert.ok($('acct-title') && $('pref-jb-chips'), 'the avatar\'s drawer is the same builder, every section');
  });
  test('the two new flags are written as they change, through the person\'s own route', async () => {
    const { sb, $, log, flush } = stage({ reply: (r, m, b) => r === 'me/prefs' ? { prefs: b } : null });
    sb.stDrawerOpen('me:work');
    $('pref-jb-chips').checked = false; $('pref-jb-chips').dispatchEvent(new sb.document.defaultView.Event('change')); await flush();
    $('pref-opens-on').value = 'red'; $('pref-opens-on').dispatchEvent(new sb.document.defaultView.Event('change')); await flush();
    const puts = log.api.filter(a => a.route === 'me/prefs').map(a => JSON.parse(JSON.stringify(a.body)));
    assert.deepEqual(puts, [{ jamboChips: false }, { opensOn: 'red' }]);
  });
  test('the password is changed only when the boxes agree', async () => {
    const { sb, $, log, flush } = stage();
    sb.stDrawerOpen('me:password');
    const save = () => $('st-dsave').dispatchEvent(new sb.document.defaultView.Event('click'));
    $('pw-cur').value = 'old-pass-1'; $('pw-new').value = 'short'; $('pw-again').value = 'short'; save(); await flush();
    assert.equal(log.api.filter(a => a.route === 'password/change').length, 0, 'too short: refused before the server');
    $('pw-new').value = 'a-new-pass-9'; $('pw-again').value = 'another-9'; save(); await flush();
    assert.equal(log.api.filter(a => a.route === 'password/change').length, 0, 'different: refused');
    $('pw-again').value = 'a-new-pass-9'; save(); await flush();
    const c = log.api.find(a => a.route === 'password/change');
    assert.ok(c && c.method === 'POST' && c.body.current === 'old-pass-1' && c.body.password === 'a-new-pass-9', 'the route the first sign-in uses');
  });
  test('Jambo\'s suggestions off: no chips beside Settings either', () => {
    const { win } = stage({ });
    assert.ok(win.document.querySelectorAll('.st-jb-chip').length >= 3);
    const off = stage();
    off.me.prefs = { jamboChips: false }; off.sb.renderTeam();
    assert.equal(off.win.document.querySelectorAll('.st-jb-chip').length, 0, 'the person turned them off');
  });
});

describe('f691 — Jambo finds, explains and readies; the AI only on a press', () => {
  test('amounts are read the way people say them', () => {
    const { sb } = stage();
    const cases = [['Set her limit to 5M', 5e6], ['KES 5,000,000', 5e6], ['500k', 5e5], ['5.5M', 5.5e6],
      ['two at 2 million', 2e6], ['5 miljoner', 5e6], ['no number here', null]];
    for (const [q, want] of cases) assert.equal(sb.stJbAmount(q), want, q);
  });
  test('"who may sign" is answered with the people and their limits, and nothing loose under it', () => {
    const { sb, ask } = stage();
    sb.settingsGoTab('company');
    const t = ask(S.en.st_jb_c_whosign);
    const heads = [...t.querySelectorAll('.st-jb-ch')].map(h => h.textContent.trim());
    assert.deepEqual(heads, [S.en.st_jb_whosign_h], 'one card: who may sign');
    assert.ok(t.textContent.includes('Asha Kimani') && t.textContent.includes('No limit set'), 'each name with the ONE reading of their limit');
  });
  test('a named colleague and an amount: the limit is readied, never saved', () => {
    const { sb, $, log, ask, click } = stage();
    const sent = log.api.length;
    const t = ask('Set Asha\'s signing limit to KES 5M');
    const go = t.querySelector('[data-st-stage]');
    assert.ok(go, 'the readied card leads');
    assert.equal(go.getAttribute('data-st-stage'), 'u_two|5000000');
    click(go);
    assert.equal($('tm-cap').value, '5000000', 'the box holds what was asked for');
    assert.ok($('st-dsave'), 'and Save is still the person\'s press');
    assert.equal(log.api.length, sent, 'nothing left the browser');
  });
  test('your own setting, got ready: what it will be and what it is, nothing saved', () => {
    const { log, ask } = stage();
    const sent = log.api.length;
    const t = ask(S.en.st_jb_c_brief);
    const go = t.querySelector('[data-st-you="told"]');
    assert.ok(go, 'the brief card');
    /* since round 24 (One sheet) the brief changes in its row: the readied card lights the row's choice */
    assert.equal(go.getAttribute('data-st-you-focus'), '[data-st-brief]', 'with the brief\'s choice lit in its row');
    assert.ok(t.textContent.includes(S.en.st_you_brief_weekly) && t.textContent.includes(S.en.st_you_brief_daily), 'it says what it will be and what it is');
    assert.equal(log.api.length, sent, 'nothing was sent');
  });
  test('a "why" is offered to the AI with its cost first; the press is the spend', async () => {
    const { log, ask, click, flush } = stage({ ai: true,
      reply: r => r === 'ai/settings-why' ? { title: 'Two things stop her', say: 'Her limit is lower than the value.', points: ['5M against 7.2M'], doors: [{ panel: 'signcap' }], read: ['the rules'] } : null });
    const t = ask('Why can\'t Asha sign the Mombasa lease?');
    const go = t.querySelector('[data-st-jb-why]');
    assert.ok(go, 'the AI card is offered');
    assert.ok(t.textContent.includes(S.en.st_jb_why_cost), 'with the cost said before the press');
    assert.equal(log.api.filter(a => a.route === 'ai/settings-why').length, 0, 'nothing spent yet');
    click(go); await flush(); await flush();
    const w = log.api.filter(a => a.route === 'ai/settings-why');
    assert.equal(w.length, 1); assert.equal(w[0].body.q, 'Why can\'t Asha sign the Mombasa lease?');
    const after = [...sbDoc(t).querySelectorAll('.st-jb-turn')].pop();
    assert.ok(after.textContent.includes('Two things stop her') && after.querySelector('[data-st-panel="signcap"]'), 'the answer, with the rule\'s own door');
  });
  test('no engine: the AI card says so — never a silent nothing', () => {
    const { ask } = stage({ ai: false });
    const t = ask('Why can\'t Asha sign?');
    assert.ok(t.textContent.includes(S.en.st_jb_why_noai));
    assert.ok(!t.querySelector('[data-st-jb-why]'));
  });
  test('a non-admin\'s Jambo knows their own settings and nobody else, and asks an admin for them', async () => {
    const { ask, log, click, flush } = stage({ role: 'legal', reply: r => r === 'settings-asks' ? { ok: true, ask: { id: 'ASK-1', status: 'open', createdAt: '2026-10-16T09:00:00Z' } } : null });
    for (const q of ['Who can open Procurement?', 'Set Asha\'s limit to 5M', 'Who may sign, and for how much?'])
      assert.ok(!ask(q).textContent.includes('Asha Kimani'), `"${q}" names no colleague`);
    const t = ask('Turn on internal review');
    assert.equal(t.querySelector('.st-jb-ch').textContent.trim(), S.en.st_ask_h, 'a company rule is said to be an admin\'s');
    const go = t.querySelector('[data-st-ask-admin]');
    assert.ok(go, 'and Jambo offers to ask one');
    t.querySelector('textarea').value = 'HR offers go out unchecked';
    const sent = log.api.length;
    click(go); await flush();
    const a = log.api.slice(sent).find(x => x.route === 'settings-asks' && x.method === 'POST');
    assert.ok(a, 'the ask is the server\'s record, not an email');
    assert.equal(a.body.what, 'Turn on internal review'); assert.equal(a.body.why, 'HR offers go out unchecked'); assert.equal(a.body.panel, 'review');
  });
  test('the chips are asks the finder answers, in both languages', () => {
    for (const lang of ['en', 'sv']) for (const role of ['admin', 'legal']) {
      const { sb, ask } = stage({ role, capOn: true });
      sb.langSet(lang, { quiet: true }); sb.renderTeam();
      if (role === 'admin') { sb.settingsGoTab('company'); }
      const chips = [...sb.document.querySelectorAll('.st-jb-chip')];
      assert.ok(chips.length >= 3, `${lang}/${role}: chips are offered`);
      if (lang === 'sv') assert.ok(chips.some(c => c.textContent === S.sv[role === 'admin' ? 'st_jb_c_next' : 'st_jb_c_brief']), 'in the reader\'s language');
      for (const c of chips) {
        const t = ask(c.getAttribute('data-st-jb-ask'));
        assert.ok(t.querySelector('.st-jb-card'), `${lang}/${role}: "${c.textContent}" finds something`);
      }
    }
  });
});

describe('f691 — an admin answers an ask', () => {
  test('it is a Needs-you row and a drawer; the answer is the server\'s, and "no" needs a reason', async () => {
    const asks = [{ id: 'ASK-9', by: { id: 'u_two', name: 'Asha Kimani' }, what: 'turn on internal review', why: 'HR', panel: 'review', status: 'open', createdAt: '2026-10-16T09:00:00Z' }];
    const { sb, win, $, log, click, flush } = stage({ reply: (r, m) => r === 'settings-asks' && m === undefined ? { asks } : r.startsWith('settings-asks/') ? { ok: true } : null });
    await sb.stAsksLoad(); await flush();
    sb.settingsGoTab('company');
    const row = win.document.querySelector('#st-att .st-need[data-st-need="ask:ASK-9"]');
    assert.ok(row && row.textContent.includes('Asha Kimani'), 'the ask is the first thing owed');
    click(row.querySelector('[data-st-panel="ask:ASK-9"]'));
    assert.ok($('st-dbody').textContent.includes('turn on internal review'), 'the drawer says it in their words');
    assert.ok($('st-dbody').querySelector('[data-st-panel="review"]'), 'with the rule\'s own door');
    click($('st-dbody').querySelector('[data-st-ask-to="done"]')); await flush();
    const p = log.api.find(a => a.route === 'settings-asks/ASK-9');
    assert.ok(p && p.method === 'PATCH' && p.body.status === 'done', 'done is recorded on the server');
  });
});

describe('f691 — one Jambo on the screen, and both books', () => {
  test('the top bar\'s Jambo goes to the panel while it is on screen', () => {
    const AI = fs.readFileSync(path.join(ROOT, 'js/ai.js'), 'utf8');
    assert.match(AI, /getElementById\('st-side'\)[\s\S]{0,260}return 'settings'/, 'aiEmbeddedHere knows the settings panel');
    assert.match(AI, /here === 'settings' && typeof window\.stJamboFocus === 'function'/, 'and aiGoEmbedded goes there');
    const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
    assert.match(SET, /Object\.assign\(window,\{[\s\S]*?\bstJamboFocus\b/, 'published, because ai.js reads it through window');
  });
  test('every new sentence is in both books', () => {
    const re = /^st_(face|faces|cr|gov|jb|side|need|needs|pc|pg|sh|lim|gates|card|you|opens|find|syn|ask|pw|pref)_|^sc_(rule|ask)_|^al_settings_|^mail_ska_|^co_share_asks_code$/;
    const keys = Object.keys(S.en).filter(k => re.test(k));
    assert.ok(keys.length > 200);
    for (const k of keys) assert.ok(S.sv[k], `sv has ${k}`);
  });
  test('the finder and its cards write nothing; only two presses reach a route', () => {
    const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
    const a = SET.indexOf('JAMBO ON SETTINGS'), b = SET.indexOf('ASK AN ADMIN, ON THE PAGE');
    assert.ok(a > 0 && b > a);
    const finder = SET.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.doesNotMatch(finder, /\bapi\(|saveSettings|saveUsers|settingsSavePerson|fetch\(/, 'finding and readying never write');
    const c = SET.indexOf('THE SIDE PANEL: JAMBO');
    const routes = [...SET.slice(b, c).matchAll(/\bapi\('([^']+)'/g)].map(m => m[1]);
    assert.ok(routes.includes('ai/settings-why') && routes.some(r => r.startsWith('settings-asks')), 'the AI answer and the ask are the two');
    for (const r of routes) assert.ok(/^(ai\/settings-why|settings-asks)/.test(r), `${r} is one of the two presses`);
  });
});
const sbDoc = el => el.ownerDocument;
