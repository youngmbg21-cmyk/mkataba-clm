/* f726 — SETTINGS → COMPANY, "CONTROL ROOM" (round 25 of the redesign: the
   owner picked "Control room" by name, 17 Oct 2026 — today's page, tidied)

   What is pinned here:
     (1) Needs your attention: each row two lines — what it is, then its
         kind or state and since when — its own button on the right; the
         head says what the buttons do; a clash names itself as one
     (2) nine even cards, People & access one of them; the ladder is drawn
         across the page under them, then the access sheet
     (3) a card's line wraps rather than being cut short
     (4) the words, in both books
   AT THE PARENT (round 24's head) every test here FAILS.
   The browser half: test/chromium/company-control-room-verify.js.
   Run: node --test test/f726-settings-control-room.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];
const S = require('../js/i18n.js').STRINGS;
const CSS = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

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
    agPointsTableHtml: () => '<table></table>', agPointsKeys: () => ['round', 'link'], agPointsMine: () => null,
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



describe('f726 (1) Needs your attention, two lines a row', () => {
  test('1a a row: what it is, then its second line on its own, the button beside', () => {
    const { sb, win } = stage();
    const host = win.document.createElement('div');
    host.innerHTML = sb.stNeedRowHtml({ key: 'x', dot: 'warn', text: 'Quarterly access review · Q4 2026', sub: '0 of 3 reviewed', btn: 'data-st-panel="sheet"', verb: 'Review' });
    const w = host.querySelector('.st-need .st-need-w');
    assert.ok(w, 'the two lines sit together');
    assert.equal(w.querySelector('.st-need-t').textContent, 'Quarterly access review · Q4 2026');
    assert.equal(w.querySelector('.st-need-s').textContent, '0 of 3 reviewed', 'the second line, without a "·" run-on');
    assert.ok(!w.querySelector('.st-need-t .st-need-s'), 'not inside the first');
    assert.equal(host.querySelector('.st-need > .st-need-go').textContent, 'Review');
  });
  test('1b the head says what the buttons do', () => {
    const { sb, win } = stage();
    sb.settingsGoTab('company');
    const h = win.document.getElementById('st-needs-h');
    assert.ok(h && h.querySelector('.st-needs-sub') && h.querySelector('.st-needs-sub').textContent === S.en.st_needs_sub);
  });
  test('1c a clash says what kind of thing it is', () => {
    const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
    assert.match(SET, /stClashes\(\)\.forEach\(r=>out\.push\(\(r\.sub\|\|r\.subHtml\)\?r:\{ \.\.\.r, sub:i18t\('st_need_kind_clash'\) \}\)\)/);
  });
});

describe('f726 (2) nine even cards, the ladder under them', () => {
  test('2a nine cards, People first; no card spans two', () => {
    const { sb, win } = stage();
    sb.settingsGoTab('company');
    const cards = [...win.document.querySelectorAll('.st-cards > [data-st-card]')].map(c => c.getAttribute('data-st-card'));
    assert.equal(cards.length, 9, cards.join());
    assert.equal(cards[0], 'people');
    assert.ok(!/\.st-cards > \[data-st-card="people"\][^{]*\{ grid-column:span 2/.test(CSS), 'People is not stretched');
    assert.ok(!win.document.querySelector('[data-st-card="people"] .st-card-two'), 'its facts read down one column');
  });
  test('2b the ladder across the page after the cards, then the access sheet', () => {
    const { sb, win } = stage();
    sb.settingsGoTab('company');
    const ladder = win.document.querySelector('#st-board > [data-st-card="ladder"]');
    assert.ok(ladder, 'the ladder is the board\'s own row');
    assert.ok(ladder.previousElementSibling.classList.contains('st-cards'));
    assert.equal(ladder.nextElementSibling && ladder.nextElementSibling.id, 'st-sheet-card');
  });
});

describe('f726 (3) a line wraps rather than being cut', () => {
  test('3a a fact\'s name and state carry no ellipsis', () => {
    const rule = sel => { const m = CSS.match(new RegExp(sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
    for (const sel of ['.st-cr .st-fact-n', '.st-cr .st-fact-s']) {
      const r = rule(sel);
      assert.ok(r, sel + ' has a rule');
      assert.doesNotMatch(r, /text-overflow:ellipsis|white-space:nowrap/, sel + ' wraps');
    }
  });
});

describe('f726 (4) the words', () => {
  test('4a in both books', () => {
    for (const k of ['st_needs_sub', 'st_need_kind_clash']) for (const lang of ['en', 'sv']) assert.ok(S[lang][k], k + ' ' + lang);
  });
});
