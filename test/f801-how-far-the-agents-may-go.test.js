'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f801 — HOW FAR THE AGENTS MAY GO, IN ONE LINE (round 23's gaps, 18 Oct 2026:
   under the pieces, "All seven agents: Ask me first · set by Sara for
   everyone" with "Ask an admin")
   (1) WHO SET IT is a fact the server writes: PUT /api/agents/:k/settings
       stamps the caller (looked up, never the body) and the day — only when
       the level MOVES; GET /api/agents/status gives every member the name.
   (2) The reading (agLevelsSaid): the seven that act, grouped by the
       company's level, who set it, and each agent this person chose their
       own level for; null while the status has not come (nothing guessed).
   (3) The line (cnJwLevelsHtml): "All seven agents: <level> · set by <first
       name> for everyone"; groups by name or count where levels differ; "the
       default, for everyone" where nobody moved it; "you chose …" where the
       person chose their own; Ask an admin for a member (the tracked ask,
       stAskFrom('agents')), Change for an admin (where it is set).
   AT THE PARENT (8dc306a) every test here FAILS but 1a and 1c, the controls
   (no name is written there at all, so none is wrongly written either).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const AG = R('js/views/agents.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const constLine = (src, name) => { const m = src.match(new RegExp('^(const|let) ' + name + '\\b[^\\n]*$', 'm')); return m ? m[0] : ''; };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const fill = (s, v) => String(s || '').replace(/\{(\w+)\}/g, (_, k) => (v && k in v) ? v[k] : '{' + k + '}');

describe('f801 (1) who set it is the server\'s fact', () => {
  const H = require('./helpers');
  let h, W;
  before(async () => { h = await H.startHati(); W = await H.seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  test('1a nobody has moved it: no name', async () => {
    const s = await W.unrestricted.json('/api/agents/status');
    assert.equal(s.agents.renew.levelBy, undefined);
  });
  test('1b an admin moves it: their name, looked up, and the day — every member reads the name', async () => {
    await W.admin.json('/api/agents/renew/settings', { method: 'PUT', body: { level: 'mine', levelBy: { id: 'x', name: 'Somebody Else' } } });
    const s = await W.unrestricted.json('/api/agents/status');
    assert.equal(s.agents.renew.levelBy, 'Amina Otieno', 'the caller, never the body');
    assert.match(String(s.agents.renew.levelAt), /^\d{4}-\d{2}-\d{2}T/);
  });
  test('1c a Save that leaves the level where it was names nobody new', async () => {
    const was = (await W.admin.json('/api/agents/status')).agents.renew.levelAt;
    await new Promise(r => setTimeout(r, 15));
    await W.admin.json('/api/agents/renew/settings', { method: 'PUT', body: { level: 'mine', at: 4 } });
    assert.equal((await W.admin.json('/api/agents/status')).agents.renew.levelAt, was);
  });
});

function reading(st, mine, apiMode = true){
  const ctx = { agentsStatus: () => st, API_MODE: () => apiMode, currentUser: () => ({ id: 'u_me', prefs: mine ? { agentLevels: mine } : {} }) };
  vm.createContext(ctx);
  vm.runInContext(constLine(AG, 'AG_KEYS') + '\n' + constLine(AG, 'AG_READINGS') + '\n' + constLine(AG, 'AG_PERSON_LEVELS') + '\n' + constLine(AG, 'AG_ACTING')
    + fnBody(AG, 'agLevelCo') + fnBody(AG, 'agLevelMine') + fnBody(AG, 'agLevelOf') + fnBody(AG, 'agLevelsSaid'), ctx);
  return ctx.agLevelsSaid();
}
const ST = (o, by) => ({ agents: Object.fromEntries(['round', 'link', 'renew', 'paper', 'late', 'ours', 'import'].map(k => [k, { level: (o && o[k]) || 'ask', ...(by && by[k] ? by[k] : {}) }])) });

describe('f801 (2) the reading', () => {
  test('2a the seven that act, one group while they agree', () => {
    const L = reading(ST());
    assert.equal(L.n, 7);
    assert.equal(L.groups.length, 1);
    assert.equal(L.groups[0].lv, 'ask');
    assert.equal(L.groups[0].keys.length, 7);
  });
  test('2b groups by level, largest first; who set it; what this person chose', () => {
    const L = reading(ST({ link: 'auto' }, { link: { levelBy: 'Sara Lind', levelById: 'u_sara' } }), { late: 'mine' });
    assert.equal(L.groups.map(g => g.lv + ':' + g.keys.length).join(','), 'ask:6,auto:1', 'across the realm, compared as one string');
    assert.equal(L.by.length, 1); assert.equal(L.by[0].name, 'Sara Lind'); assert.equal(L.by[0].you, false);
    assert.equal(L.mine.length, 1); assert.equal(L.mine[0].k, 'late'); assert.equal(L.mine[0].lv, 'mine');
  });
  test('2c nothing guessed: no status yet, no line', () => {
    assert.equal(reading(null), null);
  });
});

function line(L, admin){
  const ctx = { i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k, { n, ...(v || {}) }),
    agLevelsSaid: () => L, isAdmin: () => !!admin };
  vm.createContext(ctx);
  vm.runInContext(['_cnE', '_cnT', '_cnTn', '_cnFirst'].map(n => constLine(CN, n)).join('\n') + fnBody(CN, 'cnJwLevelsHtml'), ctx);
  return ctx.cnJwLevelsHtml();
}
const text = h => h.replace(/<[^>]+>/g, '');
describe('f801 (3) the line', () => {
  const seven = (lv, by) => ({ n: 7, groups: [{ lv, keys: ['round', 'link', 'renew', 'paper', 'late', 'ours', 'import'] }], by: by || [], mine: [] });
  test('3a as drawn, for a member: "All seven agents: Ask me first · set by Sara for everyone" · Ask an admin', () => {
    const h = line(seven('ask', [{ name: 'Sara Lind', you: false }]), false);
    assert.equal(text(h), 'All seven agents: Ask me first · set by Sara for everyoneAsk an admin');
    assert.match(h, /<b>Ask me first<\/b>/);
    assert.match(h, /data-cn-lv-ask>Ask an admin</);
    assert.doesNotMatch(h, /data-cn-lv-change/);
  });
  test('3b for an admin: Change, where it is set; "set by you" when it was them', () => {
    const h = line(seven('ask', [{ name: 'Amina Otieno', you: true }]), true);
    assert.equal(text(h), 'All seven agents: Ask me first · set by you for everyoneChange');
  });
  test('3c nobody moved it: the default, for everyone', () => {
    assert.match(text(line(seven('ask'), false)), /^All seven agents: Ask me first · the default, for everyone/);
  });
  test('3d levels that differ, by name or count; the person\'s own choice said', () => {
    const L = { n: 7, groups: [{ lv: 'ask', keys: ['round', 'link', 'renew', 'paper', 'late', 'ours'] }, { lv: 'mine', keys: ['import'] }],
      by: [{ name: 'Sara Lind', you: false }], mine: [{ k: 'late', lv: 'mine' }] };
    assert.equal(text(line(L, false)), '6 agents: Ask me first · ' + BOOKS.en.ag_import + ': Leave it to me · set by Sara for everyone · you chose Leave it to me for ' + BOOKS.en.ag_late + 'Ask an admin');
  });
  test('3e no reading, no line', () => { assert.equal(line(null, false), ''); });
  test('3f the doors: the tracked ask about the agents, or the agents\' own settings', () => {
    assert.match(CN, /if \(t\.closest\('\[data-cn-lv-ask\]'\)\)\{ if \(typeof stAskFrom === 'function'\) stAskFrom\('agents', _cnT\('cn_lv_ask_words'\)\); return; \}/);
    assert.match(CN, /if \(t\.closest\('\[data-cn-lv-change\]'\)\)\{ if \(typeof openSettingsAt === 'function'\) openSettingsAt\('company', 'agents'\); return; \}/);
  });
  test('3g the words, in both books', () => {
    for (const k of ['cn_lv_all7', 'cn_lv_all', 'cn_lv_one', 'cn_lv_n_one', 'cn_lv_n_other', 'cn_lv_you', 'cn_lv_start', 'cn_lv_by', 'cn_lv_mine_k', 'cn_lv_mine_one', 'cn_lv_mine_other', 'cn_lv_ask', 'cn_lv_change', 'cn_lv_ask_words'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
