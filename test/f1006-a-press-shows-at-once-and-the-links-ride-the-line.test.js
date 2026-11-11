/* f1006 — A PRESS SHOWS AT ONCE, AND THE PAGE LINKS RIDE THE LINE ABOVE JAMBO'S BOX
   ================================================================================
   The owner, 11 Nov 2026, off a screenshot of the Calendar's Jambo panel: "review why when i try to press between
   the buttons there is a delay. Review this and other similar buttons in the jambo page. Also why the panel stutters
   flashing the green links to other pages that are supposed to be above the jumbo entry field which are currently
   missing from the reads page, obligations page and possibly more." Then: "yes, fix both".

   THE DELAY: "Jambo may change my calendar" (On his own · Ask me first · Never) and the agents' own levels waited for
   the server, then repainted, before the pressed button lit. Now the choice is taken at once and drawn; a refusal
   puts the old one back and says why.
   THE LINKS: once "Jambo ›" stood above the box, the sync took the row of page links away and had nowhere on that
   line to put them (no spacer), so they vanished; and every panel repaint drew the row and the sync removed it a beat
   later — the flash. Now "Jambo ›" carries the links as the way back does, and the row above the box is hidden by
   the sheet while a line is shown, never removed after a repaint.

   Run: node --test test/f1006-a-press-shows-at-once-and-the-links-ride-the-line.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const read = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const strip = t => t.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const fnBody = (src, name) => {
  const at = src.search(new RegExp('(?:async\\s+)?function\\s+' + name + '\\s*\\('));
  if (at < 0) return '';
  const open = src.indexOf('{', at); let d = 0;
  for (let i = open; i < src.length; i++){ if (src[i] === '{') d++; else if (src[i] === '}' && --d === 0) return src.slice(at, i + 1); }
  return '';
};
const CAL = read('js/views/calendar.js'), MINE = read('js/mine.js'), RUNS = read('js/agentruns.js'), COMP = read('js/components.js'), HTML = read('index.html');
const later = () => { let ok, no; const p = new Promise((a, b) => { ok = a; no = b; }); return { p, ok, no }; };

describe('f1006 (1) a press shows at once', () => {
  test('1a "Jambo may change my calendar": the pressed button lights and the level reads the new one before the server answers', async () => {
    const answer = later(), btns = ['auto', 'ask', 'never'].map(k => ({ k, p: k === 'ask' ? 'true' : 'false',
      getAttribute(a){ return a === 'data-cal-lv' ? this.k : this.p; }, setAttribute(a, v){ if (a === 'aria-pressed') this.p = v; } }));
    let pref = { copilotLevel: 'ask' };
    const ctx = { i18t: k => k, _esc: String, toast: () => {}, window: { state: { view: 'calendar' } }, state: { view: 'calendar' },
      document: { querySelectorAll: () => btns }, minePref: () => pref, mineLoaded: () => true, mineLoad: async () => {},
      mineSave: (kind, item) => { pref = item; return answer.p; }, Object, String };
    vm.createContext(ctx);
    vm.runInContext(`const CAL_LEVELS = [['auto','cal_lv_auto'],['ask','cal_plan_ask'],['never','cal_lv_never']];\n`
      + ['calLevelOf', 'calLevelLight', 'calLevelSet'].map(n => fnBody(CAL, n)).join('\n'), ctx);
    const going = ctx.calLevelSet('never');
    assert.deepEqual(btns.map(b => b.p), ['false', 'false', 'true'], 'lit before the server has answered');
    answer.ok({}); assert.equal(await going, true);
  });
  test('1b a refused setting puts the old button back', async () => {
    const answer = later(), btns = ['auto', 'ask', 'never'].map(k => ({ k, p: k === 'ask' ? 'true' : 'false',
      getAttribute(a){ return a === 'data-cal-lv' ? this.k : this.p; }, setAttribute(a, v){ if (a === 'aria-pressed') this.p = v; } }));
    let pref = { copilotLevel: 'ask' }; const said = [];
    const ctx = { i18t: k => k, _esc: String, toast: (m, k) => said.push(k), window: { state: { view: 'calendar' } }, state: { view: 'calendar' },
      document: { querySelectorAll: () => btns }, minePref: () => pref, mineLoaded: () => true, mineLoad: async () => {},
      mineSave: () => answer.p, Object, String };
    vm.createContext(ctx);
    vm.runInContext(`const CAL_LEVELS = [['auto','cal_lv_auto'],['ask','cal_plan_ask'],['never','cal_lv_never']];\n`
      + ['calLevelOf', 'calLevelLight', 'calLevelSet'].map(n => fnBody(CAL, n)).join('\n'), ctx);
    const going = ctx.calLevelSet('auto');
    answer.no(new Error('refused'));
    assert.equal(await going, false);
    assert.deepEqual(btns.map(b => b.p), ['false', 'true', 'false'], 'the old one lit again');
    assert.deepEqual(said, ['err'], 'and the refusal is said');
  });
  test('1c the one store takes a person\'s pref before the server answers, and puts it back on a refusal', () => {
    const b = strip(fnBody(MINE, 'mineSave'));
    assert.match(b, /if \(kind === 'pref' && mineServer\(\)\)\{ _mine\.pref = \{ \.\.\.\(_mine\.pref \|\| \{\}\), \.\.\.item \}; mineChanged\(\); \}/);
    assert.match(b, /catch \(e\)\{ if \(kind === 'pref'\)\{ _mine\.pref = prefWas; mineChanged\(\); \} throw e; \}/);
  });
  test('1d the agents\' own level: taken before the server answers, the old one back on a refusal', async () => {
    const answer = later(); const u = { prefs: { agentLevels: {} } };
    const ctx = { currentUser: () => u, API_MODE: () => true, api: () => answer.p, Object };
    vm.createContext(ctx); vm.runInContext(fnBody(RUNS, 'agentLevelMineSet'), ctx);
    const going = ctx.agentLevelMineSet('renewals', 'mine');
    assert.equal(u.prefs.agentLevels.renewals, 'mine', 'held at once');
    answer.no(new Error('refused'));
    await assert.rejects(going);
    assert.equal(u.prefs.agentLevels.renewals, undefined, 'put back');
  });
});

describe('f1006 (2) the page links ride the line above Jambo\'s box', () => {
  test('2a "Jambo ›" carries the page links, at its right end, as the way back does', () => {
    const ctx = { i18t: k => k, window: { jamboWaysHtml: (h, cls) => `<nav class="jb-ways ${cls}">${h.doors.join(',')}</nav>`, jamboWaysHere: () => ({ k: 'reads', doors: ['contracts', 'board'] }) } };
    vm.createContext(ctx); vm.runInContext(fnBody(COMP, 'jamboFwdHtml'), ctx);
    const h = ctx.jamboFwdHtml({ on: true, host: 'list' });
    assert.match(h, /data-jb-fwd="list"[\s\S]*<\/button><span class="jb-door-sp"><\/span><nav class="jb-ways is-in-door">contracts,board<\/nav><\/div>$/);
  });
  test('2b the sync never takes the row above the box away after a repaint while a line is shown', () => {
    const b = strip(fnBody(COMP, 'jamboWaysSync'));
    const at = b.indexOf('if (door){');
    assert.ok(at > 0);
    assert.ok(!/if \(old\) old\.remove\(\)/.test(b.slice(at, b.indexOf('return;', at))), 'not removed in the line\'s branch');
  });
  test('2c the sheet hides the row while a line stands above the box, and the foot keeps its top line', () => {
    assert.match(HTML, /\.jb-ways\.is-above-foot:has\(\+ \* \.jb-door:not\(\[hidden\]\)\)\{display:none\}/);
    assert.match(HTML, /html\.lg-new \.jb-ways\.is-above-foot:has\(\+ \* \.jb-door:not\(\[hidden\]\)\) \+ :is\(\.igd-foot, \.jl-foot, \.st-jb-ask\)\{border-top-color:var\(--color-divider\)\}/);
  });
});
