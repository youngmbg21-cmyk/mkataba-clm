'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f467 — ONE RULES PAGE, AND EVERY SIGNING RULE BY ITS OWN NAME (4 Oct 2026,
   the process review; owner approved the stream)

   2  "Who must say yes before signing": a read-only Settings row at the top
      of "The agreement", listing every gate in signBlockers' order with its
      on/off, one sentence and a door to where it is set.
   4  The signing limit, the folder rule and the default signing route each
      have their own row (a new group, "Before anyone signs"); the old
      workspace overseer switch is read only as the default for a person with
      no setting of their own, and the rules page says so; a person's summary
      reads the switches and names their sign folders when that rule is on.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const FILES = ['js/i18n.js', 'js/jurisdiction.js', 'js/templates.js', 'js/asks.js', 'js/signapproval.js', 'js/signcheck.js',
  'js/approvals.js', 'js/views/settings.js'];

function stage(opts = {}) {
  const dom = new JSDOM('<!doctype html><html><body><div id="content"></div></body></html>',
    { runScripts: 'outside-only', url: 'https://hati.test/' });
  const win = dom.window;
  const me = { id: 'u_me', name: 'Young Mbagaya', role: 'admin', email: 'me@hati.test' };
  const users = opts.users || [me,
    { id: 'u_ed', name: 'Asha Kimani', role: 'legal', email: 'asha@hati.test', signCap: 4000000, overseerId: 'u_me' },
    { id: 'u_ed2', name: 'Otto Berg', role: 'legal', email: 'otto@hati.test', overseerId: 'u_me', overseerOn: 'off' }];
  const sb = {
    console, Date, Math, JSON, Number, String, Object, Array, Boolean, RegExp, Set, Map, Error,
    isNaN, parseInt, parseFloat, encodeURIComponent, decodeURIComponent, Promise,
    setTimeout: fn => { try { fn(); } catch (_) {} return 0; }, clearTimeout() {},
    document: win.document, localStorage: win.localStorage, location: win.location,
    MutationObserver: win.MutationObserver,
    esc: s => String(s == null ? '' : s).replace(/[&<>]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[ch])),
    PB_ESC: s => String(s == null ? '' : s), PB_ATTR: s => String(s == null ? '' : s).replace(/"/g, '&quot;'),
    icon: () => '<svg></svg>', toast() {}, api: async () => ({}), API_MODE: () => false, isAdmin: () => true,
    currentUser: () => me, getUsers: () => users, saveUsers() {}, userById: id => users.find(u => u.id === id),
    roleName: r => r, saveSettings: async () => {}, openModal() {}, closeModal() {}, setActiveNav() {}, setView() {},
    confirmDialog: async () => true, promptDialog: async () => null, lsGet: () => null, lsSet() {},
    getOrg: () => ({ name: 'Highland' }), LS: {}, uid: 1, clauseLibrary: () => [], playbook: () => ({}), CONTRACT_TYPES: {},
    copilotAvailable: () => false, emailOff: () => false,
    reviewGateCfg: () => ({ on: !!opts.review }), deskCfg: () => ({ on: false }),
    fmtMoneyShort: n => 'KES ' + Number(n).toLocaleString('en'), isMonetary: () => true,
    logAudit() {}, persist() {}, nowISO: () => '2026-10-04T00:00:00.000Z', fmtDT: v => String(v),
    state: { contracts: [], view: 'team', aiCfg: {}, settings: { approvalRules: opts.rules || [], ...(opts.settings || {}) } },
  };
  sb.window = sb; sb.globalThis = sb;
  vm.createContext(sb);
  for (const f of FILES) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f });
  return { sb, $: id => win.document.getElementById(id) };
}

describe('f467 (2) one page says every rule before a signature', () => {
  test('a row of its own, at the top of "The agreement", in a group of four', () => {
    const { sb } = stage();
    const P = sb.SET_PANELS;
    const agreement = Object.keys(P).filter(k => P[k].tab === 'platform' && P[k].group === 'agreement');
    assert.equal(agreement[0], 'rules', 'the rules page leads its group');
    assert.equal(agreement.join(','), 'rules,approvals,review,desk');
    const signing = Object.keys(P).filter(k => P[k].tab === 'platform' && P[k].group === 'signing');
    assert.equal(signing.join(','), 'signcheck,signcap,signfolder,signroute');
    const groups = [...sb.ST_GROUPS].filter(g => g.tab === 'platform').map(g => g.key);
    assert.equal(groups.indexOf('signing'), groups.indexOf('agreement') + 1);
    for (const g of groups) assert.ok(Object.keys(P).filter(k => P[k].tab === 'platform' && P[k].group === g).length <= 4, g + ' is a wall');
  });

  test('the rows follow signBlockers\' order, say on or off off each rule\'s own reading, and point at where it is set', () => {
    const { sb } = stage({ rules: [{ id: 'r1', name: 'Big', cond: { type: 'value', op: '>=', value: 1 }, approver: { kind: 'role', role: 'admin' } }],
      settings: { signCap: { on: true }, signCheckGate: 'off' } });
    const rows = sb.stRulesRows();
    assert.equal(rows.map(r => r.k).join(','), 'hold,approval,signapproval,signcap,signfolder,signcheck,brief,review,desk');
    const by = k => rows.find(r => r.k === k);
    assert.equal(by('approval').on, true);
    assert.equal(by('signcap').on, true);
    assert.equal(by('signfolder').on, false);
    assert.equal(by('signcheck').on, false);
    assert.equal(by('brief').on, false, 'the brief stands down with the check');
    assert.equal(by('review').holds, false, 'review never holds a signature, and is listed as such');
    assert.equal(by('desk').holds, false);
    assert.equal(by('signcap').go.join(':'), 'platform:signcap');
    assert.ok(rows.every(r => r.name && r.says && Array.isArray(r.go)), 'every row names itself, says one sentence and has a door');
  });

  test('the drawer paints every row with its door, and writes nothing', () => {
    const { sb, $ } = stage();
    sb.renderTeam(); sb.settingsGoTab('platform'); sb.stDrawerOpen('rules');
    const host = $('st-rules-list');
    assert.ok(host, 'the drawer is drawn');
    assert.equal(host.querySelectorAll('[data-st-rule]').length, 9);
    assert.equal(host.querySelectorAll('[data-st-rule-go]').length, 9);
    assert.ok(!host.querySelector('input'), 'read-only: no switch on the rules page');
  });

  test('the old overseer switch is said as the DEFAULT, and only a person with no setting follows it', () => {
    let rows = stage({ settings: { overseer: { on: true } } }).sb.stRulesRows();
    const sa = rows.find(r => r.k === 'signapproval');
    assert.match(sa.extra, /default/i);
    assert.match(sa.extra, /\bon\b/i);
    assert.match(sa.extra, /1 person follows/, 'Asha has no answer of her own; Otto said off');
    rows = stage().sb.stRulesRows();
    assert.match(rows.find(r => r.k === 'signapproval').extra, /off/i);
  });
});

describe('f467 (4) every signing rule by its own name', () => {
  test('the limit and the folder rule have their own rows and switches; the approvals drawer keeps the rules', () => {
    const { sb, $ } = stage();
    sb.renderTeam(); sb.settingsGoTab('platform');
    sb.stDrawerOpen('approvals');
    assert.ok(!$('sc-rule-on') && !$('sf-rule-on'), 'the two switches left the approval rules\' drawer');
    sb.stDrawerOpen('signcap');
    assert.ok($('sc-rule-on') && $('sc-ladder'));
    sb.stDrawerOpen('signfolder');
    assert.ok($('sf-rule-on') && $('sf-people'));
    sb.stDrawerOpen('signcheck');
    assert.ok(!$('ho-route-panel'), 'the default route left the check\'s drawer');
    sb.stDrawerOpen('signroute');
    assert.ok($('ho-route-panel'));
  });

  test('a person\'s summary reads the switches', () => {
    const asha = { id: 'u_ed', name: 'Asha Kimani', role: 'legal', signCap: 4000000 };
    let says = stage().sb.stPersonSays(asha).join(' ');
    assert.match(says, /not enforced/i, 'a limit with the switch off is a record');
    assert.ok(!/checked/i.test(says), 'review lines only while the review gate is on');
    says = stage({ settings: { signCap: { on: true }, signFolders: { on: true, by: { u_ed: ['proc'] } } }, review: true })
      .sb.stPersonSays(asha).join(' ');
    assert.match(says, /Can sign up to/);
    assert.match(says, /1 value stream only/);
    assert.match(says, /checked/i);
  });
});
