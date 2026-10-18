'use strict';
/* SETTINGS ON A REAL DOM, THE BOUNDARY STUBBED — the stage lane F's checks
   share (f780–f789: Your settings, the Control room, Contract streams and
   Data & backup as drawn, rounds 24–26, 18 Oct 2026). The same stage f725
   and f727 draw, with the page head's two slots (PAGE_HEAD_PAINT fills them)
   and the readings the drawn parts ask: the keeping book, the downloads,
   everyone's stand-in, the business roles, the private streams.
   Not a test file: required by the tests that use it. */
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/views/settings.js'];
const SET = fs.readFileSync(path.join(ROOT, 'js/views/settings.js'), 'utf8');
const S = require('../js/i18n.js').STRINGS;

function settingsStage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="page-head"><div class="page-title-row"><h1>Settings</h1><div id="page-head-facts" class="page-facts"></div></div><span id="page-head-acts"></span></div><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const me = { id: 'u_me', name: 'Young Mbagaya', role: opts.role || 'admin', email: 'me@hati.test', title: 'Chief Executive', ...(opts.me || {}) };
  const other = { id: 'u_two', name: 'Asha Kimani', role: 'legal', email: 'asha@hati.test', title: '', ...(opts.otherIs || {}) };
  const log = { toasts: [], api: [], views: [], opened: [] };
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error, Intl,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise, Event: win.Event, URLSearchParams,
    KeyboardEvent: win.KeyboardEvent, MouseEvent: win.MouseEvent,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; },
    clearTimeout() {}, setInterval() { return 0; }, clearInterval() {},
    requestAnimationFrame: fn => { try { fn(); } catch (_) {} return 0; },
    document: win.document, localStorage: win.localStorage, FileReader: win.FileReader,
    MutationObserver: win.MutationObserver, location: win.location,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>',
    fval: id => (win.document.getElementById(id) || {}).value || '',
    validEmail: e => /.+@.+\..+/.test(String(e || '')),
    nowISO: () => '2026-10-16T00:00:00.000Z', fmtDT: v => String(v), todayISO: () => '2026-10-16',
    toast: (m, k) => log.toasts.push({ m: String(m), kind: k || 'ok' }),
    api: async (route, method, body) => { log.api.push({ route, method, body }); const r = opts.reply && opts.reply(route, method, body); if (r instanceof Error) throw r; return r || {}; },
    API_MODE: () => opts.api !== false,
    isAdmin: () => me.role === 'admin',
    currentUser: () => me,
    getUsers: () => sb.REMOTE.users,
    userById: id => sb.REMOTE.users.find(u => u.id === id) || null,
    saveUsers: u => { sb.REMOTE.users = u; },
    roleName: r => ({ admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }[r] || ''),
    saveSettings: async () => {},
    openModal() {}, closeModal() {}, setActiveNav() {},
    setView: v => { log.views.push(v); if (v === 'team') sb.renderTeam(); },
    regOpenContract: id => log.opened.push(id),
    confirmDialog: async o => { log.confirm = o; return opts.confirm !== false; }, promptDialog: async () => null,
    lsGet: () => null, lsSet() {},
    downloadFile() {}, clauseLibrary: () => [], getOrg: () => ({ name: 'Highland Corporate Ltd' }),
    LS: { org: 'o', users: 'u', session: 's', data: 'd', ui: 'i' }, uid: 100,
    approvalRules: () => [], saveApprovalRules() {}, approverLabelOf: () => '',
    playbook: () => ({}), CONTRACT_TYPES: {},
    copilotAvailable: () => !!opts.ai, emailOff: () => false,
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
    folderSeerCount: () => ({ n: 3 }),
    canAccessFolder: (fid, u) => { const p = ((sb.state.settings || {}).privateStreams || {})[fid]; return !(p && p.on) || (p.people || []).some(x => String(x.id) === String(u.id)); },
    agPointsTableHtml: () => '<table></table>', agPointsKeys: () => ['round', 'link'], agPointsMine: () => null,
    agentsStatus: () => opts.agents || null,
    jamboChipsOn: () => !((me.prefs || {}).jamboChips === false),
    contractOpensOn: () => (me.prefs || {}).opensOn || 'jambo', signCapSentence: () => 'sentence', signCapText: u => (typeof u.signCap === 'number' ? 'up to ' + u.signCap : 'No limit set'),
    fmtMoney: n => 'KES ' + Number(n).toLocaleString('en-US'),
    fmtMoneyShortIn: n => 'KES ' + (Number(n) / 1e6) + ' M',
    langLocale: () => 'en-GB',
    state: { contracts: [], settings: {}, view: 'team', aiCfg: {}, aiConfigured: !!opts.ai, ...(opts.state || {}) },
    REMOTE: { me, users: [me, other].concat(opts.more || []) },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  if (opts.before) opts.before(sb);
  sb.renderTeam();
  const $ = id => win.document.getElementById(id);
  const click = el => el.dispatchEvent(new win.Event('click', { bubbles: true }));
  const key = (el, k) => el.dispatchEvent(new win.KeyboardEvent('keydown', { key: k, bubbles: true }));
  const flush = () => new Promise(r => setImmediate(r));
  const q = sel => win.document.querySelector(sel);
  const qa = sel => [...win.document.querySelectorAll(sel)];
  const run = code => vm.runInContext(code, sb);
  return { win, sb, $, q, qa, log, me, other, click, key, flush, run, text: el => String((el && el.textContent) || '').replace(/\s+/g, ' ').trim() };
}
/* a function's own text, comments out, for the source-reading checks */
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };

module.exports = { settingsStage, fnBody, SET, S, ROOT };
