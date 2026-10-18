'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f724 — JAMBO'S WORK, "OPEN IN PLACE" (round 23 of the redesign: the owner
   picked "Open in place" by name, 17 Oct 2026; levels "Each person chooses";
   the button word "Put away")
   (1) REVERSED 18 Oct 2026 (LAND ON IT; the owner: "when you click on jambos
       work, it should take you to the jambos work card in the board" and
       "remove the in-place list"): the Counter's first row of Needs you is one
       row with Open, and Open lands on the Board's Jambo's work card, lit
       (hbOpenAgent → landOn). The in-place list is gone.
   (2) Each person chooses: a person may step an agent DOWN for themselves
       (Ask me first · Leave it to me), never up — "Just do it" stays the
       admin's. One reading on each host (agLevelOf, agentLevelFor); the
       route refuses anything else; the link watch asks the owner's own.
   (3) The house's agent card carries the chooser ("For you"), offering only
       the company's level and the steps below it.
   (4) The words, in both books.
   AT THE PARENT (round 22's head) every test here FAILS.
   The browser half: test/chromium/open-in-place-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CN = R('js/views/counter.js');
const AG = R('js/views/agents.js');
const JH = R('js/views/jambohouse.js');
const RUNS = R('js/agentruns.js');
const SERVER = R('server/server.js');
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

function counter(){
  const ctx = {
    i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k] || k, v),
    jamboFaceHtml: () => '<i class="face"></i>',
  };
  vm.createContext(ctx);
  const src = ['_cnE', '_cnT', '_cnTn'].map(n => constLine(CN, n)).join('\n') + '\n'
    + fnBody(CN, 'cnFace') + fnBody(CN, 'cnJwRowHtml');
  vm.runInContext(src, ctx);
  return ctx;
}
const A = n => ({ ready: n, rows: [{ who: 'Nandi Dairy', items: Array.from({ length: n }, (_, i) => ({ key: 'k' + i })) }] });
const HB = R('js/views/homeboard.js');

describe('f724 (1) Jambo\'s work lands on the Board\'s card (LAND ON IT, reverses Open in place)', () => {
  test('1a one row with Open, and no list drawn in place', () => {
    const w = counter();
    const row = w.cnJwRowHtml(A(2));
    assert.match(row, /data-cn-jw>Open</);
    assert.doesNotMatch(row, /cn-jw-list|data-cn-ag-item|data-cn-look|aria-expanded/);
    assert.doesNotMatch(w.cnJwRowHtml(A(0)), /data-cn-jw/, 'no Open where Jambo has nothing prepared');
  });
  test('1b Open goes to the Board\'s card through the one opener', () => {
    const wire = CN.slice(CN.indexOf("if ((el = t.closest('[data-cn-jw]')))"), CN.indexOf("if ((el = t.closest('[data-cn-need]')))"));
    assert.match(wire, /hbOpenAgent\(\)/);
    assert.doesNotMatch(CN, /cnJwPiecesHtml|_cnJwOpen|data-cn-look|data-cn-house/, 'the in-place list is gone');
  });
  test('1c the opener lands on the card and lights it, saying so when there is nothing', () => {
    const f = fnBody(HB, 'hbOpenAgent');
    assert.match(f, /landOn\(target, \{ block: 'start', missing: i18t\('hb_land_no_work'\) \}\)/);
    assert.match(f, /getElementById\('hm-agents'\)/);
    assert.ok(BOOKS.en.hb_land_no_work && BOOKS.sv.hb_land_no_work, 'said in both books');
  });
});

describe('f724 (2) each person chooses — only down', () => {
  const browser = (co, mine) => {
    const ctx = { agentsStatus: () => ({ agents: { link: { level: co } } }), currentUser: () => ({ prefs: mine ? { agentLevels: { link: mine } } : {} }) };
    vm.createContext(ctx);
    vm.runInContext(constLine(AG, 'AG_PERSON_LEVELS') + fnBody(AG, 'agLevelCo') + fnBody(AG, 'agLevelMine') + fnBody(AG, 'agLevelOf'), ctx);
    return ctx.agLevelOf('link');
  };
  const server = (co, mine) => {
    const ctx = { agentCfg: () => ({ level: co }), userPrefs: u => u.p };
    vm.createContext(ctx);
    vm.runInContext(constLine(SERVER, 'AGENT_LEVELS') + constLine(SERVER, 'AGENT_AUTO_OK') + constLine(SERVER, 'AGENT_PERSON_LEVELS')
      + fnBody(SERVER, 'agentLevel') + fnBody(SERVER, 'agentLevelFor'), ctx);
    return ctx.agentLevelFor('link', { p: mine ? { agentLevels: { link: mine } } : {} });
  };
  const CASES = [
    ['auto', null, 'auto'], ['auto', 'ask', 'ask'], ['auto', 'mine', 'mine'],
    ['ask', null, 'ask'], ['ask', 'mine', 'mine'], ['mine', 'ask', 'mine'],
    ['ask', 'auto', 'ask'], ['mine', null, 'mine'],
  ];
  test('2a the browser and the server give the same answer, a step down only', () => {
    for (const [co, mine, want] of CASES){
      assert.equal(browser(co, mine), want, `browser ${co}/${mine}`);
      assert.equal(server(co, mine), want, `server ${co}/${mine}`);
    }
  });
  test('2b the route keeps the choice in the person\'s prefs and refuses anything else', () => {
    const route = SERVER.slice(SERVER.indexOf("app.put('/api/me/prefs'"), SERVER.indexOf('const AGENTS_LOOKS'));
    assert.match(route, /'agentLevels' in \(req\.body \|\| \{\}\)/);
    assert.match(route, /if \(!AGENT_KEYS\.includes\(k\)\) return res\.status\(400\)/);
    assert.match(route, /if \(!AGENT_PERSON_LEVELS\.includes\(x\)\) return res\.status\(400\)/);
    assert.match(route, /if \(x === null\) \{ delete mine\[k\]; continue; \}/, 'null takes it back to the company\'s');
    assert.match(constLine(SERVER, 'AGENT_PERSON_LEVELS'), /\['ask', 'mine'\]/, '"Just do it" is never a person\'s');
  });
  test('2c the link watch acts alone only where the owner left it so', () => {
    const run = fnBody(SERVER, 'runLinkWatch');
    assert.match(run, /agentLevelFor\('link', uOwn\) === 'auto'/);
  });
  test('2d the browser saves it through the module that talks to the server', () => {
    assert.match(fnBody(RUNS, 'agentLevelMineSet'), /api\('me\/prefs', 'PUT', \{ agentLevels: \{ \[k\]: v \|\| null \} \}\)/);
    assert.ok(!/api\(|fetch\(/.test(AG.replace(/\/\*[\s\S]*?\*\//g, '')), 'the agents page still never talks to the server itself');
  });
});

describe('f724 (3) the house\'s chooser', () => {
  const pick = (co, mine, k = 'link') => {
    const ctx = { AG_READINGS: ['approve', 'request', 'week', 'quiet'], agLevelCo: () => co, agLevelMine: () => mine, agentLevelMineSet: () => true,
      i18t: (key, v) => fill(BOOKS.en[key] || key, v) };
    vm.createContext(ctx);
    vm.runInContext("const _jhE = s => String(s == null ? '' : s).replace(/[&<>\"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\"': '&quot;' }[c]));\n" + constLine(JH, '_jhT') + fnBody(JH, 'jhLevelPickHtml'), ctx);
    return ctx.jhLevelPickHtml(k);
  };
  test('3a it offers the company\'s level and the steps below it, never Just do it', () => {
    const a = pick('auto', null);
    assert.match(a, new RegExp(BOOKS.en.ag_lv_for_you));
    assert.equal((a.match(/<option /g) || []).length, 3);
    assert.ok(a.includes('<option value="" selected>') && a.includes('(' + BOOKS.en.st_agents_lv_auto + ')</option>'), 'the company\'s level first, chosen');
    assert.doesNotMatch(a, /value="auto"/);
    const b = pick('ask', 'mine');
    assert.equal((b.match(/<option /g) || []).length, 2);
    assert.match(b, /<option value="mine" selected>/);
  });
  test('3b nothing below the company\'s, or a reading agent: no chooser', () => {
    assert.equal(pick('mine', null), '');
    assert.equal(pick('auto', null, 'week'), '');
  });
  test('3c it sits on the agent\'s card, and a change saves and repaints', () => {
    assert.match(fnBody(JH, 'jhScorecard'), /const pick = _jh\.sel \? jhLevelPickHtml\(_jh\.sel\) : '';/);
    assert.match(JH, /const lvk = e\.target && e\.target\.getAttribute && e\.target\.getAttribute\('data-jh-lv'\);[\s\S]{0,200}agentLevelMineSet\(lvk, v\)/);
  });
});

describe('f724 (4) the words', () => {
  test('4a in both books', () => {
    assert.equal(BOOKS.en.cn_close, 'Close');
    assert.equal(BOOKS.en.desk_discard, 'Put away');
    for (const k of ['cn_close', 'cn_jw_said', 'cn_jw_look', 'cn_jw_look_close', 'cn_jw_more', 'cn_jw_house', 'ag_lv_for_you', 'ag_lv_company', 'ag_lv_saved'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
});
