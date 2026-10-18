/* f725 — SETTINGS → YOU AS "ONE SHEET" (round 24 of the redesign: the owner
   picked "One sheet" by name, 17 Oct 2026)

   What is pinned here:
     (1) You is one sheet: a contents list beside it, away first, each part a
         section of plain rows (label · value · its act) that still answers to
         data-st-you-card="<key>"
     (2) a switch or a choice changes IN ITS ROW — Jambo's suggestions, where
         a contract opens, the brief, the sidebar, the language — through the
         ONE writer its drawer uses too, with a passing 'ok'
     (3) the forms that need several boxes keep their one door, the drawer
     (4) the contents list lights where it jumps; Jambo readies a setting in
         its row
     (5) the words, in both books
   AT THE PARENT (round 23's head) every test here FAILS but (3), which pins
   what the sheet keeps and passes there too.
   The browser half: test/chromium/one-sheet-verify.js.
   Run: node --test test/f725-settings-one-sheet.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];
const S = require('../js/i18n.js').STRINGS;
const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };

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


const youSecs = win => [...win.document.querySelectorAll('#set-page [data-st-you-card]')];

describe('f725 (1) You is one sheet', () => {
  test('1a a contents list beside the sheet, away first, one entry per section', () => {
    const { win, sb } = stage();
    const toc = [...win.document.querySelectorAll('#set-page .st-toc [data-st-toc]')].map(b => b.getAttribute('data-st-toc'));
    const secs = youSecs(win).map(x => x.getAttribute('data-st-you-card'));
    assert.ok(toc.length >= 6, 'a contents list: ' + toc);
    assert.deepEqual(toc, secs, 'one entry per section, in the sheet\'s order');
    assert.equal(secs[0], 'away', 'away comes first');
    assert.deepEqual(secs.slice(0, 6), ['away', 'who', 'safety', 'lang', 'told', 'work']);
    assert.equal(win.document.querySelector('.st-toc [aria-current="true"]').getAttribute('data-st-toc'), 'away');
    assert.ok(!sb.stYouSheetItems().some(it => it.key === 'password'), 'the password is a row of Sign-in, not a section');
  });
  test('1b each section is rows: a label, a value, its act', () => {
    const { win } = stage();
    for (const sec of youSecs(win)) {
      const rows = sec.querySelectorAll('.st-sr');
      assert.ok(rows.length >= 1, sec.getAttribute('data-st-you-card') + ' has rows');
      for (const r of rows) if (!r.classList.contains('is-full')) assert.ok(r.querySelector('.st-sl') && r.querySelector('.st-sv') && r.querySelector('.st-sa'));
    }
    const who = win.document.querySelector('[data-st-you-card="who"]').textContent;
    assert.ok(who.includes('Young Mbagaya') && who.includes('me@hati.test') && who.includes('Chief Executive'));
  });
});

describe('f725 (2) a switch or a choice changes in its row', () => {
  test('2a the controls are in the rows: language, the brief, the two flags, the sidebar', () => {
    const { win } = stage();
    const q = s => win.document.querySelector(s);
    assert.deepEqual([...win.document.querySelectorAll('[data-st-you-card="lang"] [data-st-lang]')].map(b => b.getAttribute('data-st-lang')), ['en', 'sv']);
    assert.equal(q('[data-st-lang="en"]').getAttribute('aria-pressed'), 'true');
    assert.deepEqual([...q('[data-st-you-card="told"] select[data-st-brief]').options].map(o => o.value), ['daily', 'weekly', 'off']);
    assert.equal(q('[data-st-you-card="work"] [data-st-sw="chips"]').getAttribute('role'), 'switch');
    assert.equal(q('[data-st-sw="chips"]').getAttribute('aria-checked'), 'true');
    assert.equal(q('[data-st-you-card="work"] select[data-st-opens]').value, 'jambo');
    assert.ok(q('[data-st-you-card="work"] [data-st-sw="navall"]'));
    assert.ok(!q('[data-st-you-card="work"] [data-st-panel="me:work"]') && !q('[data-st-you-card="told"] [data-st-panel="me:told"]'), 'no drawer for a single choice');
  });
  test('2b each writes as it changes, through the person\'s own route, with a passing ok', async () => {
    const { win, sb, log, click, flush } = stage({ reply: (r, m, b) => r === 'me/prefs' ? { prefs: { ...(sb.currentUser().prefs || {}), ...b } } : null });
    click(win.document.querySelector('[data-st-sw="chips"]')); await flush(); await flush();
    const brief = win.document.querySelector('select[data-st-brief]'); brief.value = 'weekly';
    brief.dispatchEvent(new win.Event('change', { bubbles: true })); await flush(); await flush();
    const opens = win.document.querySelector('select[data-st-opens]'); opens.value = 'red';
    opens.dispatchEvent(new win.Event('change', { bubbles: true })); await flush(); await flush();
    const puts = log.api.filter(a => a.route === 'me/prefs').map(a => JSON.parse(JSON.stringify(a.body)));
    assert.deepEqual(puts, [{ jamboChips: false }, { briefEvery: 'weekly' }, { opensOn: 'red' }]);
    assert.ok(log.toasts.length >= 3 && log.toasts.slice(-3).every(t => t.kind === 'ok'), JSON.stringify(log.toasts));
    assert.equal(win.document.querySelector('[data-st-sw="chips"]').getAttribute('aria-checked'), 'false', 'the row says what was saved');
    assert.equal(win.document.querySelector('select[data-st-opens]').value, 'red');
  });
  test('2c a language button switches through the bar\'s own writer', () => {
    const { win, sb, click } = stage();
    const went = []; sb.langSet = id => { went.push(id); return true; };
    click(win.document.querySelector('[data-st-lang="sv"]'));
    click(win.document.querySelector('[data-st-lang="en"]'));
    assert.deepEqual(went, ['sv'], 'the language already in use is not set again');
  });
  test('2d ONE writer each: the drawer\'s controls and the rows call the same functions', () => {
    const wire = fnBody(SET, 'stAccountWire');
    for (const w of ['stNavAllSet(', 'stBriefSet(', 'stChipsSet(', 'stOpensSet(']) assert.ok(wire.includes(w), 'the drawer uses ' + w);
    assert.equal((SET.match(/api\('me\/prefs','PUT',\{ briefEvery:v \}\)/g) || []).length, 1, 'one place writes the brief');
    assert.match(fnBody(SET, 'briefPaintCadence'), /\[data-st-brief\][\s\S]*el\.value=v/, 'every copy of the brief says the same');
  });
});

describe('f725 (3) the forms that need several boxes keep their drawer', () => {
  test('3a job title, password, two-step, devices, away, the points table, the download', () => {
    const { win } = stage();
    const has = (k, sel) => !!win.document.querySelector(`[data-st-you-card="${k}"] ${sel}`);
    assert.ok(has('who', '[data-st-panel="me:who"]'));
    assert.ok(has('safety', '[data-st-panel="me:password"]') && has('safety', '[data-st-panel="me:safety"]'));
    assert.ok(has('safety', '[data-st-panel="me:safety"][data-st-focus="#sessions-list"]'), 'devices open on the list');
    assert.ok(has('away', '[data-st-panel="me:away"]'));
    assert.ok(has('points', '[data-st-panel="me:points"]'));
    assert.ok(has('data', '[data-st-backup]'));
  });
});

describe('f725 (4) where the reader ends up', () => {
  test('4a the contents list lights the section it jumps to', () => {
    const { win, click } = stage();
    click(win.document.querySelector('[data-st-toc="told"]'));
    assert.equal(win.document.querySelector('.st-toc [aria-current="true"]').getAttribute('data-st-toc'), 'told');
    assert.ok(win.document.getElementById('st-you-told').classList.contains('st-lit'));
  });
  test('4b Jambo readies your own setting in its row', () => {
    const stg = fnBody(SET, 'stJbYouStage');
    assert.match(stg, /key:'told', focus:'\[data-st-brief\]'/);
    assert.match(stg, /key:'lang', focus:`\[data-st-lang="\$\{lang\.id\}"\]`/);
    assert.match(stg, /key:'work', focus:'\[data-st-opens\]'/);
    assert.match(stg, /key:'work', focus:'\[data-st-sw="chips"\]'/);
  });
});

describe('f725 (5) the words', () => {
  test('5a in both books', () => {
    for (const k of ['st_you_toc', 'st_you_none', 'st_you_role', 'st_you_password_row', 'st_you_manage', 'st_you_devices_row', 'st_you_see_them', 'st_you_lang_money', 'st_you_bell_row', 'st_you_points_row', 'st_you_lang_saved'])
      for (const lang of ['en', 'sv']) assert.ok(S[lang][k], k + ' ' + lang);
  });
});
