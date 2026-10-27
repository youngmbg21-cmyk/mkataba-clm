'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f793 — "JAMBO MAY CHANGE MY CALENDAR: ON HIS OWN · ASK ME FIRST · NEVER"
   (round 16 "Week by week", as drawn under "Your week" beside Obligations and
   the Calendar; lane A4)
   (1) The Calendar's own setting, three buttons in the drawing's order, the
       reader's choice pressed — drawn by one builder on both pages.
   (2) ONE writer (calLevelSet → mineSave('pref')), an unknown choice refused,
       nothing written when nothing changes; one listener armed once.
   (3) NEVER is honoured where it matters: the browser offers nothing to add
       and calPlanAdd refuses; the SERVER reads the person's own setting (never
       the body) and lets the planner only answer in words.
   (4) The server keeps 'never' in the person's pref row and refuses an
       unknown level.
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS but 4c, which
   pins what Ask me first already did (both tools) so Never cannot take it away.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { startHati, startScriptedAi, seedWorkspace } = require('./helpers');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CAL = R('js/views/calendar.js');
const SRV = R('server/server.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

const stage = (pref, saves) => {
  const ctx = {
    i18t: k => BOOKS.en[k] || k, _esc: s => String(s == null ? '' : s).replace(/</g, '&lt;'),
    minePref: () => Object.assign({ copilotLevel: 'ask', dayStart: 8, dayEnd: 17 }, pref.v),
    mineLoaded: () => true, mineLoad: async () => {},
    mineSave: async (kind, item) => { saves.push([kind, item.copilotLevel]); pref.v = item; return item; },
    toast: () => {}, window: { state: { view: 'calendar' } }, state: { view: 'calendar' }, Object, String,
  };
  vm.createContext(ctx);
  vm.runInContext(`const CAL_LEVELS = [['auto','cal_lv_auto'],['ask','cal_plan_ask'],['never','cal_lv_never']];\n`
    + ['calLevelOf', 'calLevelSegHtml', 'calLevelSet'].map(n => fnBody(CAL, n)).join('\n'), ctx);
  return ctx;
};

describe('f793 (1) three buttons, the drawing\'s order and words', () => {
  test('1a the words, both books', () => {
    for (const k of ['cal_lv_label', 'cal_lv_auto', 'cal_lv_never', 'cal_lv_never_note'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
    assert.equal(BOOKS.en.cal_lv_label, 'Jambo may change my calendar');
    assert.equal(BOOKS.en.cal_lv_auto, 'On his own');
    assert.equal(BOOKS.en.cal_lv_never, 'Never');
  });
  test('1b On his own · Ask me first · Never, the reader\'s own pressed', () => {
    assert.match(CAL, /const CAL_LEVELS = \[\['auto','cal_lv_auto'\],\['ask','cal_plan_ask'\],\['never','cal_lv_never'\]\];/);
    const pref = { v: { copilotLevel: 'never' } };
    const h = stage(pref, []).calLevelSegHtml();
    const btns = [...h.matchAll(/data-cal-lv="(\w+)" aria-pressed="(\w+)">([^<]+)</g)].map(m => m.slice(1).join('|'));
    assert.deepEqual(btns, ['auto|false|On his own', 'ask|false|Ask me first', 'never|true|Never']);
    assert.match(h, /Jambo may change my calendar/);
  });
});

describe('f793 (2) one writer', () => {
  test('2a a press writes the person\'s pref row, through mineSave', async () => {
    const saves = [], pref = { v: {} };
    const ctx = stage(pref, saves);
    assert.equal(await ctx.calLevelSet('never'), true);
    assert.equal(ctx.calLevelOf(), 'never');
    assert.equal(await ctx.calLevelSet('never'), false, 'nothing written when nothing changes');
    assert.equal(await ctx.calLevelSet('sometimes'), false, 'an unknown choice is refused');
    assert.deepEqual(JSON.parse(JSON.stringify(saves)), [['pref', 'never']]);
  });
  test('2b one listener, armed once, for every place it is drawn', () => {
    assert.match(CAL, /if\(typeof document!=='undefined'&&typeof window!=='undefined'&&!window\._calLvWired\)\{/);
    assert.match(CAL, /calLevelSet\(b\.getAttribute\('data-cal-lv'\)\)/);
    assert.ok(!/cal-plan-level/.test(CAL), 'the old dropdown is gone (a press opens no system picker)');
  });
});

describe('f793 (3) Never is honoured', () => {
  test('3a the browser offers nothing to add, and Add refuses', () => {
    assert.match(fnBody(CAL, 'calPlanHtml'), /const acts=never&&b\.st!=='added'\?''/);
    assert.match(fnBody(CAL, 'calPlanAdd'), /if\(calLevelOf\(\)==='never'\) return;/);
  });
  test('3b the server reads the person\'s own setting, never the body', () => {
    assert.match(fnBody(SRV, 'myCalLevel'), /SELECT json FROM my_items WHERE user_id=\? AND kind='pref'/);
    const route = SRV.slice(SRV.indexOf("app.post('/api/ai/plan'"), SRV.indexOf("app.post('/api/ai/plan'") + 9000);
    assert.match(route, /const never = myCalLevel\(req\.user\.id\) === 'never';/);
    assert.match(route, /tools: useTools/);
    assert.ok(!/b\.level|b\.never|req\.body\.level/.test(route), 'the body says nothing about it');
  });
});

let ai, h, W;
before(async () => {
  ai = await startScriptedAi();
  h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  W = await seedWorkspace(h);
});
after(async () => { if (h) await h.stop(); if (ai) await ai.stop(); });
const plan = () => W.admin.json('/api/ai/plan', { method: 'POST', body: { from: '2026-10-19', to: '2026-11-01', today: '2026-10-19', ask: 'plan my week', dayStart: 8, dayEnd: 17, dates: [], events: [] } });

describe('f793 (4) on the server', () => {
  test('4a the pref row keeps "never"; an unknown level is kept as "ask"', async () => {
    const a = await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'pref', item: { copilotLevel: 'never', dayStart: 8, dayEnd: 17 } } });
    assert.equal(a.item.copilotLevel, 'never');
    const b = await W.unrestricted.json('/api/me/items', { method: 'POST', body: { kind: 'pref', item: { copilotLevel: 'whenever', dayStart: 8, dayEnd: 17 } } });
    assert.equal(b.item.copilotLevel, 'ask');
  });
  test('4b Never: the planner may only answer, and is told why', async () => {
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_a', name: 'answer', input: { say: 'Tuesday afternoon is free; nothing is added.' } }]);
    const r = await plan();
    assert.equal(r.kind, 'answer');
    const body = ai.calls[0].body;
    assert.deepEqual(body.tools.map(t => t.name), ['answer', 'elsewhere'], 'RE-POINTED 27 Oct 2026: other words still go to the chat (f950)');
    assert.match(JSON.stringify(body.messages), /NEVER change their calendar/);
  });
  test('4c Ask me first: he may answer or propose blocks, as before', async () => {
    await W.admin.json('/api/me/items', { method: 'POST', body: { kind: 'pref', item: { copilotLevel: 'ask', dayStart: 8, dayEnd: 17 } } });
    ai.reset();
    ai.script([{ type: 'tool_use', id: 'tu_a', name: 'answer', input: { say: 'Free on Tuesday.' } }]);
    await plan();
    const body = ai.calls[0].body;
    assert.deepEqual(body.tools.map(t => t.name).sort(), ['answer', 'elsewhere', 'propose_blocks']);
    assert.ok(!/NEVER change their calendar/.test(JSON.stringify(body.messages)));
  });
});
