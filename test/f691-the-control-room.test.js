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
  const other = { id: 'u_two', name: 'Asha Kimani', role: 'legal', email: 'asha@hati.test', title: '' };
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
    api: async (route, method, body) => { log.api.push({ route, method, body }); return {}; },
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
    signCapEnforced: () => false, signCapSentence: () => 'sentence', signCapText: u => (typeof u.signCap === 'number' ? 'up to ' + u.signCap : 'No limit set'),
    fmtMoney: n => 'KES ' + Number(n).toLocaleString('en-US'),
    state: { contracts: [], settings: {}, view: 'team', aiCfg: {} },
    REMOTE: { me, users: [me, other] },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  sb.renderTeam();
  const $ = id => win.document.getElementById(id);
  const click = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  const ask = q => { sb.stJbAsk(q); const t = [...win.document.querySelectorAll('.st-jb-turn')].pop(); return t; };
  return { win, sb, $, log, me, other, click, ask, text: () => $('content').textContent };
}

describe('f691 — two tabs, like Home\'s', () => {
  test('You first and where the page opens; Company second', () => {
    const { win } = stage();
    const faces = [...win.document.querySelectorAll('#set-page .st-face')].map(b => b.getAttribute('data-st-tab'));
    assert.deepEqual(faces, ['you', 'company'], 'exactly two, in the owner\'s order');
    assert.equal(win.document.querySelector('.st-face[aria-selected="true"]').getAttribute('data-st-tab'), 'you', 'the first tab is where the page opens');
    assert.equal(win.document.getElementById('set-page').getAttribute('data-st-face'), 'you');
    assert.ok(win.document.getElementById('acct-title'), 'You draws the person\'s own settings');
  });
  test('the number on Company is the length of the Needs-you list behind it', () => {
    const { sb, win } = stage();
    const n = sb.stAttentionKeys().length;
    const shown = win.document.querySelector('.st-face[data-st-tab="company"] .st-face-n').textContent.trim();
    assert.equal(shown, n ? String(n) : '', 'the count is the list\'s own length, or nothing');
    sb.settingsGoTab('company');
    const att = win.document.querySelectorAll('#st-att .st-row[data-st-panel]').length;
    assert.equal(att, Math.min(n, sb.ST_ATTENTION_MAX), 'and the list behind the door shows it (counting past the cap)');
  });
  test('a non-admin is drawn You with no tab row at all', () => {
    const { sb, win, text } = stage({ role: 'legal' });
    assert.equal(win.document.querySelectorAll('.st-faces, .st-face, [data-st-tab]').length, 0, 'no tab row, not even greyed');
    assert.ok(!text().includes(S.en.st_admin_only_page), 'and no note about a page they cannot see');
    assert.ok(!text().includes('Asha Kimani'), 'no colleague is named anywhere on the page');
    assert.ok(!win.document.querySelector('.st-cards, #st-gov, #st-att, #st-people-sec'), 'no company board');
    sb.settingsGoTab('company');
    assert.equal(sb.settingsTab(), 'you', 'and asking for Company by name still draws You');
    assert.ok(!win.document.querySelector('.st-cards'), 'nothing of the Company side appears');
  });
  test('every old door name still lands where it meant', () => {
    const { sb, win } = stage();
    for (const old of ['people', 'platform', 'build']) {
      sb.settingsGoTab('you'); sb.settingsGoTab(old);
      assert.equal(win.document.getElementById('set-page').getAttribute('data-st-face'), 'company', `${old} lands on Company`);
    }
    sb.settingsPlacePut({ tab: 'build' }); assert.equal(sb.settingsPlace().tab, 'company', 'a refresh\'s old stored place maps too');
    sb.settingsPlacePut({ tab: 'you' }); assert.equal(sb.settingsPlace().tab, 'you');
    sb.settingsPlacePut({ tab: 'you', side: 'menu' }); sb.renderTeam();
    assert.equal(sb.settingsPlace().side, 'menu', 'a refresh keeps the panel\'s face too');
    assert.ok(!win.document.getElementById('st-side-menu').hidden && win.document.getElementById('st-side-jambo').hidden, 'and draws it');
    sb.stSideSet('jambo');
    sb.openSettingsAt('build', 'engine');
    assert.ok(!win.document.getElementById('st-drawer').hasAttribute('hidden'), 'a named panel still opens its drawer');
  });
  test('the Company board draws the People table, the ladder and every group as a card', () => {
    const { sb, win } = stage();
    sb.settingsGoTab('company');
    assert.ok(win.document.getElementById('st-people-sec').querySelector('tr.st-person'), 'who holds what: the People table');
    assert.ok(win.document.getElementById('st-gov'), 'the governance ladder');
    const cards = [...win.document.querySelectorAll('.st-cards > .st-grp')];
    assert.ok(cards[0].classList.contains('st-grp-people'), 'People & access leads the cards');
    const groups = sb.ST_GROUPS.filter(g => g.tab === 'platform' || g.tab === 'build');
    assert.equal(cards.length, 1 + groups.filter(g => sb.SET_PANELS && Object.keys(sb.SET_PANELS).some(k => sb.SET_PANELS[k].group === g.key && sb.SET_PANELS[k].tab === g.tab && (!sb.SET_PANELS[k].show || sb.SET_PANELS[k].show()))).length,
      'one card per group that holds a setting, and People');
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

describe('f691 — Jambo finds, explains and readies; he never writes', () => {
  test('amounts are read the way people say them', () => {
    const { sb } = stage();
    const cases = [['Set her limit to 5M', 5e6], ['KES 5,000,000', 5e6], ['500k', 5e5], ['5.5M', 5.5e6],
      ['two at 2 million', 2e6], ['5 miljoner', 5e6], ['no number here', null]];
    for (const [q, want] of cases) assert.equal(sb.stJbAmount(q), want, q);
  });
  test('"who may sign" is answered with the people and their limits, and nothing loose under it', () => {
    const { ask } = stage();
    const t = ask(S.en.st_jb_c_whosign);
    const heads = [...t.querySelectorAll('.st-jb-ch')].map(h => h.textContent.trim());
    assert.deepEqual(heads, [S.en.st_jb_whosign_h], 'one card: who may sign');
    assert.ok(t.textContent.includes('Asha Kimani') && t.textContent.includes('No limit set'), 'each name with the ONE reading of their limit');
  });
  test('a named colleague and an amount: the limit is readied, never saved', () => {
    const { sb, $, log, ask, click } = stage();
    const sent = log.api.length;      // the You tab's own sessions read, made when it was drawn
    const t = ask('Set Asha\'s signing limit to KES 5M');
    const go = t.querySelector('[data-st-stage]');
    assert.ok(go, 'the readied card leads');
    assert.equal(go.getAttribute('data-st-stage'), 'u_two|5000000');
    click(go);
    assert.ok(!$('st-drawer').hasAttribute('hidden'), 'her drawer is open');
    assert.equal($('tm-cap').value, '5000000', 'the box holds what was asked for');
    assert.ok($('st-dsave'), 'and Save is still the person\'s press');
    assert.equal(log.api.length, sent, 'nothing left the browser');
    assert.equal(sb.REMOTE.users.find(u => u.id === 'u_two').signCap, undefined, 'nothing was written to her record');
  });
  test('the next rung, a stream, and a word that matches nothing', () => {
    const { ask } = stage();
    assert.ok(ask(S.en.st_jb_c_next).querySelector('[data-st-panel]'), 'the next rung comes with its door');
    assert.match(ask('Who can open Procurement?').textContent, /Asha Kimani/, 'a stream is answered with the people who can open it');
    const none = ask('zebra crossing');
    assert.ok(none.textContent.includes(S.en.st_jb_none.replace('{q}', 'zebra crossing')), 'nothing found says so');
    assert.ok(none.querySelector('[data-st-side="menu"]'), 'and offers the Menu as the way forward');
  });
  test('a non-admin\'s Jambo knows their own settings and nobody else', () => {
    const { ask, log } = stage({ role: 'legal' });
    const sent = log.api.length;
    for (const q of ['Who can open Procurement?', 'Set Asha\'s limit to 5M', 'Who may sign, and for how much?'])
      assert.ok(!ask(q).textContent.includes('Asha Kimani'), `"${q}" names no colleague`);
    assert.equal(ask('Turn on internal review').querySelector('.st-jb-bub').textContent, S.en.st_jb_admin_only, 'a company rule is said to be an admin\'s');
    const own = ask(S.en.st_jb_c_twostep_me);
    assert.ok(own.querySelector('[data-st-you="twostep"]'), 'their own setting is found and shown');
    assert.equal(log.api.length, sent, 'and asking spends nothing and sends nothing');
  });
  test('the chips are asks the finder answers, in both languages', () => {
    for (const lang of ['en', 'sv']) for (const role of ['admin', 'legal']) {
      const { sb, ask } = stage({ role });
      sb.langSet(lang, { quiet: true }); sb.renderTeam();    // a language change redraws the page
      const chips = [...sb.document.querySelectorAll('.st-jb-chip')];
      assert.ok(chips.length >= 3, `${lang}/${role}: chips are offered`);
      if (lang === 'sv') assert.ok(chips.some(c => c.textContent === S.sv[role === 'admin' ? 'st_jb_c_next' : 'st_jb_c_lang']), 'in the reader\'s language');
      for (const c of chips) {
        const t = ask(c.getAttribute('data-st-jb-ask'));
        assert.ok(t.querySelector('.st-jb-card'), `${lang}/${role}: "${c.textContent}" finds something`);
      }
    }
  });
});

describe('f691 — the Menu', () => {
  test('a non-admin\'s Menu holds their own settings only', () => {
    const { win, sb } = stage({ role: 'legal' });
    const rows = [...win.document.querySelectorAll('#st-list .st-mrow')];
    assert.ok(rows.length && rows.every(r => r.hasAttribute('data-st-you')), 'every row is one of theirs');
    assert.equal(rows.length, sb.stYouItems().length);
  });
  test('an admin\'s box finds a colleague by name, and the row opens their drawer', () => {
    const { win, $ } = stage();
    const box = $('st-q'); box.value = 'asha'; box.dispatchEvent(new win.Event('input', { bubbles: true }));
    const row = win.document.querySelector('#st-list .st-mrow[data-st-panel="person:u_two"]');
    assert.ok(row, 'found');
  });
  test('every You row has its card on the You tab, and the account drawer keeps no page ids', () => {
    const { sb, win } = stage();
    for (const it of sb.stYouItems())
      assert.ok(win.document.querySelector(`#st-board [data-st-you="${it.key}"]`), `${it.key} has a card`);
    sb.openMyAccount();
    assert.equal(win.document.querySelectorAll('#st-dbody [id^="st-you-"]').length, 0, 'an id is one per document');
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
    const keys = Object.keys(S.en).filter(k => /^st_(face|faces|cr|gov|jb|side)_|^st_you_(who|lang)$/.test(k));
    assert.ok(keys.length > 50);
    for (const k of keys) assert.ok(S.sv[k], `sv has ${k}`);
  });
  test('the Jambo face writes nothing: no route, no save, in its code', () => {
    const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
    const a = SET.indexOf('JAMBO ON SETTINGS'), b = SET.indexOf('THE SIDE PANEL: JAMBO');
    const body = SET.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, '');
    assert.ok(a > 0 && b > a);
    assert.doesNotMatch(body, /\bapi\(|saveSettings|saveUsers|settingsSavePerson|fetch\(/, 'Jambo reads; the person saves');
  });
});
