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
   (3) The line, UNDER THE BOARD'S JAMBO'S WORK CARD (hbAgLevelsHtml —
       RE-POINTED 18 Oct 2026 from the Counter's in-place list, which LAND ON
       IT took away: the pieces live on the Board's card, and so does the line
       that says how far the agents may go): "All seven agents: <level> · set
       by <first name> for everyone"; groups by name or count where levels
       differ; "the default, for everyone" where nobody moved it; "you chose
       …" where the person chose their own; Ask an admin for a member, Change
       for an admin (where it is set).
   (4) AS DRAWN ("Ask an admin sends Sara your question as a request she
       answers; it waits in her Needs you until she does" — from where it is
       pressed, never a trip to Settings): the press sends the tracked ask
       (stAskDirect: POST /api/settings-asks, the same record Settings makes,
       the admin's Needs you and bell), and the line says "Asked Sara ·
       waiting for an answer" where the button stood while it is open
       (stAskOpenOn). (5) The card asks for the agents' status once, when it is
       on the Board and the status has not come (hbAgLevelsWanted).
   AT THE PARENT (8dc306a) every test here FAILS but 1a and 1c, the controls
   (no name is written there at all, so none is wrongly written either).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HB = R('js/views/homeboard.js');
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

function line(L, admin, open){
  const ctx = { i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || BOOKS.en[k] || k, { n, ...(v || {}) }),
    agLevelsSaid: () => L, isAdmin: () => !!admin, stAskOpenOn: p => (open && p === 'agents') ? open : null, stAdminsSaid: () => 'Sara Lind' };
  vm.createContext(ctx);
  vm.runInContext("const _hbE = s => String(s == null ? '' : s);\nlet _hbLvAsking = false, _hbLvWanted = false;\n" + fnBody(HB, 'hbLvAskState') + fnBody(HB, 'hbAgLevelsHtml'), ctx);
  return ctx.hbAgLevelsHtml();
}
const text = h => h.replace(/<[^>]+>/g, '');
describe('f801 (3) the line', () => {
  const seven = (lv, by) => ({ n: 7, groups: [{ lv, keys: ['round', 'link', 'renew', 'paper', 'late', 'ours', 'import'] }], by: by || [], mine: [] });
  test('3a as drawn, for a member: "All seven agents: Ask me first · set by Sara for everyone" · Ask an admin', () => {
    const h = line(seven('ask', [{ name: 'Sara Lind', you: false }]), false);
    assert.equal(text(h), 'All seven agents: Ask me first · set by Sara for everyoneAsk an admin');
    assert.match(h, /<b>Ask me first<\/b>/);
    assert.match(h, /data-hb-lv-ask>Ask an admin</);
    assert.doesNotMatch(h, /data-hb-lv-change/);
    assert.match(h, /^<div class="hb-ag-lv">/, 'one line of its own under the agents\' rows');
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
    /* RE-POINTED 18 Oct 2026 (LAND ON IT): the Board's own click listener */
    assert.match(HB, /if \(on\('\[data-hb-lv-ask\]'\)\)\{ hbLvAsk\(\); return; \}/);
    assert.match(HB, /if \(on\('\[data-hb-lv-change\]'\)\)\{ if \(typeof openSettingsAt === 'function'\) openSettingsAt\('company', 'agents'\); return; \}/);
  });
  test('3h it is drawn under the agents\' rows on the Board\'s card (none folded, none without rows), and no longer on Home', () => {
    const prep = fnBody(HB, 'hbPrepHtml');
    assert.match(prep, /\$\{rows \? `<div class="hb-ags">\$\{rows\}<\/div>\$\{hbAgLevelsHtml\(\)\}` : ''\}<\/section>/, 'under the rows; none on a folded card (rows are none there)');
    assert.match(prep, /const rows = folded \? '' :/);
    const CN = R('js/views/counter.js');
    assert.doesNotMatch(CN, /cnJwLevelsHtml|data-cn-lv-|cnLvAsk/, 'Home draws no list of pieces, so no line under one');
  });
  test('3g the words, in both books', () => {
    for (const k of ['cn_lv_all7', 'cn_lv_all', 'cn_lv_agent', 'cn_lv_n_one', 'cn_lv_n_other', 'cn_lv_you', 'cn_lv_start', 'cn_lv_by', 'cn_lv_mine_k', 'cn_lv_mine_one', 'cn_lv_mine_other', 'cn_lv_ask', 'cn_lv_change', 'cn_lv_ask_words'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f801 (4) Ask an admin, sent from the Board\'s card', () => {
  const seven = { n: 7, groups: [{ lv: 'ask', keys: ['round', 'link', 'renew', 'paper', 'late', 'ours', 'import'] }], by: [{ name: 'Sara Lind', you: false }], mine: [] };
  test('4a once asked, the line says so where the button stood', () => {
    const h = line(seven, false, { id: 'ASK-1', status: 'open', panel: 'agents' });
    assert.equal(text(h), 'All seven agents: Ask me first · set by Sara for everyoneAsked Sara Lind · waiting for an answer');
    assert.doesNotMatch(h, /data-hb-lv-ask>/);
  });
  test('4b the press sends the ask from here: no trip to Settings', () => {
    const f = fnBody(HB, 'hbLvAsk');
    assert.match(f, /await stAskDirect\('agents', words, ''\);/);
    assert.match(f, /const words = i18t\('cn_lv_ask_words'\);/);
    assert.doesNotMatch(f.slice(f.indexOf('_hbLvAsking = true')), /setView|openSettingsAt|stAskFrom/);
    assert.match(f, /toast\(\(e && e\.message\) \|\| i18t\('cn_lv_ask_failed'\), 'err'\)/, 'a failure says so');
  });
  test('4c the one sender is Settings\' own record: POST /api/settings-asks, the toast, the list read again', () => {
    const ST = R('js/views/settings.js');
    const f = fnBody(ST, 'stAskDirect');
    assert.match(f, /api\('settings-asks','POST',\{ what:/);
    assert.match(f, /toast\(i18t\('st_ask_toast',\{who:stAdminsSaid\(\)\}\),'ok'\)/);
    assert.match(f, /await stAsksLoad\(\)/);
    assert.match(ST, /const stAskOpenOn=panel=>stAsksMine\(\)\.find\(a=>a&&a\.status==='open'&&a\.panel===panel\)\|\|null;/);
    assert.match(ST, /stAskFrom,stAskDirect,stAskOpenOn,stAdminsSaid,/, 'published');
  });
  test('4d the words, in both books', () => {
    for (const k of ['cn_lv_asking', 'cn_lv_asked', 'cn_lv_asked_any', 'cn_lv_ask_failed', 'cn_lv_agent'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});

describe('f801 (5) the status is asked once, where the line is drawn', () => {
  test('5a once a sitting, the latch raised before the promise, the Board drawn again when it comes', () => {
    const f = fnBody(HB, 'hbAgLevelsWanted');
    assert.match(f, /if \(_hbLvWanted \|\| typeof agentsStatus !== 'function' \|\| agentsStatus\(\)/);
    assert.ok(f.indexOf('_hbLvWanted = true') < f.indexOf('agentsStatusLoad()'), 'A LATCH MAY NOT BE ITS OWN PROMISE');
    assert.match(f, /getElementById\('hm-agents'\)/, 'only while the card is on the Board');
    assert.match(fnBody(HB, 'hbPaintBoard'), /hbAgLevelsWanted\(\);/);
  });
});
