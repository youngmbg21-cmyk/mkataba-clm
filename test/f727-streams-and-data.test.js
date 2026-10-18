/* f727 — CONTRACT STREAMS AND DATA & BACKUP, "THE SAP WAY" (round 26 of the
   redesign: the owner picked "The SAP way" by name, 17 Oct 2026)

   What is pinned here:
     (1) Contract streams is a page of Settings: labelled filters (who may
         open, keeping, find), then a table — stream, who may open,
         contracts, kept after they end, due now, on legal hold — read from
         the stream's own readings; a row opens the stream's own page, the
         one door; + New stream opens the Contract folders drawer's add box
     (2) the Your standards card carries the page's door
     (3) Data & backup is a page: every door that named its drawer lands on
         it, on the tab it asked for; the trail's asks are labelled boxes in
         one row, with the drawer's own ids and wiring
     (4) the words, in both books
   AT THE PARENT (round 25's head) every test here FAILS.
   The browser half: test/chromium/streams-and-data-verify.js.
   Run: node --test test/f727-streams-and-data.test.js */
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
    folderSeerCount: () => ({ n: 3 }), URLSearchParams,
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



const fids = sb => Object.keys(vm.runInContext('FOLDERS', sb));

describe('f727 (1) Contract streams is a page', () => {
  test('1a the page: labelled filters, a six-column table, a row per stream', () => {
    const { sb, win } = stage();
    sb.settingsGoPage('streams');
    const pg = win.document.querySelector('[data-st-pg="streams"]');
    assert.ok(pg, 'the page is drawn');
    assert.deepEqual([...pg.querySelectorAll('.st-sw-band .st-sw-f > span')].map(x => x.textContent), [S.en.st_sw_f_who, S.en.st_sw_f_keep, S.en.st_sw_f_find]);
    assert.deepEqual([...pg.querySelectorAll('.st-sw-tb thead th')].map(x => x.textContent),
      /* re-pointed 18 Oct 2026 (round 26 as drawn): the last column says "On hold" */
      ['st_sw_c_stream', 'st_sw_c_who', 'st_sw_c_contracts', 'st_sw_c_kept', 'st_sw_c_due', 'st_sw_c_onhold'].map(k => S.en[k]));
    const rows = [...pg.querySelectorAll('.st-sw-row')];
    assert.equal(rows.length, fids(sb).length);
    /* re-pointed 18 Oct 2026 (round 26 as drawn): a press SHOWS the stream in
       the side panel; Enter or a double press opens its page (f781) */
    assert.ok(rows.every(r => fids(sb).includes(r.getAttribute('data-st-sw-pick'))), 'a row shows its stream beside the list');
    /* re-pointed 18 Oct 2026 (round 26 as drawn: "a new stream opens its
       form"): its own form, the hand in its name */
    const add = pg.querySelector('.st-pg-head [data-st-panel="stream:new"]');
    assert.ok(add && add.getAttribute('data-st-focus') === '#st-stream-name', '+ New stream opens its form');
  });
  test('1b the row reads the stream\'s own readings: private, keeping, due, held', () => {
    const { sb } = stage();
    const [a, b] = fids(sb);
    vm.runInContext(`state.settings.privateStreams = { ${JSON.stringify(a)}: { on: true, people: [{ id: 'u_two' }] } };
      _stKp.data = { rules: { ${JSON.stringify(b)}: { years: 7, then: 'delete' } }, streams: { ${JSON.stringify(b)}: { contracts: 3, held: [{ id: 'x' }], due: [{ id: 'y' }, { id: 'z' }] } } };`, sb);
    const rows = sb.stSwRows();
    const ra = rows.find(r => r.id === a), rb = rows.find(r => r.id === b);
    assert.equal(ra.priv, true); assert.equal(ra.named, 1); assert.equal(ra.mine, false, 'the admin is not named');
    assert.equal(rb.years, 7); assert.equal(rb.due, 2); assert.equal(rb.held, 1);
    assert.equal(rows.find(r => r.id !== a && r.id !== b).held, 0, 'the book was read: none held, not unknown');
  });
  test('1c the filters narrow the table; find matches the name', () => {
    const { sb } = stage();
    const [a, b] = fids(sb);
    vm.runInContext(`state.settings.privateStreams = { ${JSON.stringify(a)}: { on: true, people: [] } };
      _stKp.data = { rules: { ${JSON.stringify(b)}: { years: 5, then: 'archive' } }, streams: {} };`, sb);
    const all = sb.stSwRows();
    const run = (who, keep, q) => { vm.runInContext(`_stSw.who=${JSON.stringify(who)};_stSw.keep=${JSON.stringify(keep)};_stSw.q=${JSON.stringify(q)};`, sb); return sb.stSwShown(all).map(r => r.id); };
    assert.deepEqual(run('named', 'any', ''), [a]);
    assert.equal(run('all', 'any', '').length, all.length - 1);
    assert.deepEqual(run('any', 'set', ''), [b]);
    const name = all.find(r => r.id === b).name;
    assert.deepEqual(run('any', 'any', name.slice(0, 5).toLowerCase()).includes(b), true);
    run('any', 'any', '');
  });
});

describe('f727 (2) the door', () => {
  test('2a Your standards carries Contract streams', () => {
    const { sb, win } = stage();
    sb.settingsGoTab('company');
    assert.ok(win.document.querySelector('[data-st-card="standards"] [data-st-page="streams"]'));
  });
});

describe('f727 (3) Data & backup is a page', () => {
  test('3a the drawer\'s doors land on the page, on the tab asked for', () => {
    const { sb, win } = stage();
    assert.equal(sb.SET_PANELS.backup.page, 'data');
    sb.stDrawerOpen('backup');
    const pg = win.document.querySelector('[data-st-pg="data"]');
    assert.ok(pg, 'the page is drawn');
    const dw = win.document.getElementById('st-drawer');
    assert.ok(!(dw && dw.classList.contains('open')), 'no drawer');
    assert.ok(win.document.getElementById('bk-export'), 'Backup holds the backup');
    sb.stDrawerOpen('trail');
    assert.equal(win.document.querySelector('[data-st-pg="data"] [data-st-bk-tab].is-on').getAttribute('data-st-bk-tab'), 'trail');
    const band = win.document.querySelector('.st-tr-band');
    assert.ok(band, 'the trail\'s asks are one band');
    for (const id of ['st-tr-from', 'st-tr-to', 'st-tr-stream', 'st-tr-as-sel', 'st-tr-go']) assert.ok(band.querySelector('#' + id), id + ' in the band');
    assert.deepEqual([...band.querySelectorAll('#st-tr-as-sel option')].map(o => o.value), ['csv', 'pdf']);
    assert.ok(win.document.getElementById('st-tr-past'), 'the downloads under it');
  });
});

describe('f727 (4) the words', () => {
  test('4a in both books', () => {
    for (const k of ['st_sw_title', 'st_sw_new', 'st_sw_any', 'st_sw_f_who', 'st_sw_f_keep', 'st_sw_f_find', 'st_sw_who_all', 'st_sw_who_named', 'st_sw_keep_set', 'st_sw_list', 'st_sw_list_sub', 'st_sw_c_stream', 'st_sw_c_who', 'st_sw_c_contracts', 'st_sw_c_kept', 'st_sw_c_due', 'st_sw_c_held', 'st_sw_everyone_one', 'st_sw_everyone_other', 'st_sw_not_you', 'st_sw_none'])
      for (const lang of ['en', 'sv']) assert.ok(S[lang][k], k + ' ' + lang);
  });
});
