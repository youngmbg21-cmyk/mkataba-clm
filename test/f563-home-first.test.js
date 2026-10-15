'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f563 — HOME FIRST (Young, 8 Oct 2026: "Yes to all decisions, build them")
   The Paper's desk is a reading over the contract's own readings, its acts
   the product's own; Review on approvals, renewals and late promises opens
   the Paper on the tab that holds the act. Browser: home-first-verify.
   AT THE PARENT every claim FAILS: js/paperdesk.js and the hooks do not exist.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const DESK = R('js/paperdesk.js');
const HB = R('js/views/homeboard.js');
const IG = R('js/views/intelligence.js');
const CODE = DESK.replace(/\/\*[\s\S]*?\*\//g, '');

const stage = over => {
  const c = Object.assign({ id: 'MK-1', status: 'Under Review', counterparty: 'Kabras', obligations: [] }, over && over.c);
  const ctx = { intel: { paper: { id: 'MK-1' } }, document: undefined, window: undefined };
  Object.assign(ctx, { getContract: id => (id === c.id ? c : null), i18t: (k, v) => k + (v && v.n != null ? ':' + v.n : ''), i18tn: (k, n) => k + ':' + n, setTimeout: () => 0 }, (over && over.g) || {});
  vm.createContext(ctx); vm.runInContext(DESK.replace(/^Object\.assign\(window[\s\S]*$/m, ''), ctx);
  return { ctx, c };
};

describe('f563 (1) — the desk reads, it does not write', () => {
  test('1a no route, no store, no initialiser', () => {
    assert.ok(CODE.length > 2000);
    for (const bad of ['api(', 'fetch(', 'persist(', 'localStorage', 'negoInit(', 'negoChanges(', 'negoClauseList(', 'changes.push'])
      assert.ok(!CODE.includes(bad), bad);
  });
  test('1b each tab is the room\'s own reading', () => {
    /* RE-POINTED 10 Oct 2026: Signing left the Paper; the Document tab is the room's own clause list */
    for (const r of ['ktFactReads(c)', 'obPanelActs(o, c, i, \'tab\')', 'roomHistoryEvents(c)', 'standsHtml(c', 'id="pd-thread"'])
      assert.ok(DESK.includes(r), r);
  });
});

/* RE-POINTED 10 Oct 2026 (owner: "delete signing tab"): the Paper has no
   Signing tab; an approval waiting on you opens on the Approvals & signing
   page with its row chosen, the page that decides it. */
describe('f563 (2) — no Signing tab; an approval opens where it is decided', () => {
  test('2a the tabs, and their symbols are the artifact\'s', () => {
    const { ctx } = stage();
    const v = n => vm.runInContext(n, ctx);
    /* no Deal and no History tab (owner, 11 Oct 2026) */
    /* RE-POINTED 13 Oct 2026: the Overview tab is gone from Home's panel (owner); its old doors land on Jambo */
    /* the Menu tab, drawn as "Next up", stands beside Obligations (owner, 15 Oct 2026) */
    assert.deepEqual([...v('PD_TABS')], ['copilot', 'doc', 'oblig', 'menu']);
    assert.equal(v('PD_TAB_NAME').doc, 'pd_tab_clauses', 'the Document tab is called Clauses');
    assert.ok(!('sign' in v('PD_BODY')));
    assert.deepEqual(Object.values(v('PD_TAB_GLYPH')), ['\u2726', '\u25A6', '\u25A2', '\u2691', '\u25F7', '\u21C4', '\u2630']);
  });
  test('2b an approval opens the Approvals page with its row chosen', () => {
    const seen = [];
    const { ctx, c } = stage({ g: { apSetTab: t => seen.push('tab:' + t), insSelect: (s, id) => seen.push('sel:' + s + ':' + id), setView: v => seen.push('view:' + v), igWalk: () => seen.push('paper') } });
    ctx.window = { innerWidth: 1440 };
    assert.equal(ctx.pdOpenOnHome(c.id, 'sign'), true);
    assert.deepEqual(seen, ['tab:approvals', 'sel:approvals:MK-1', 'view:approvals']);
  });
  test('2c the Document symbol counts the list\'s own "to review"', () => {
    const { ctx, c } = stage({ g: { docThreadHomeMarks: () => 3 } });
    assert.deepEqual({ ...ctx.pdTabCount('doc', c) }, { n: 3, tone: 'warn' });
    const none = stage({ g: { docThreadHomeMarks: () => 0 } });
    assert.equal(none.ctx.pdTabCount('doc', none.c), null);
  });
});

describe('f563 (3) — history: the cap is said', () => {
  test('3a more than PD_HIST_MAX events: the latest are drawn and the rest counted', () => {
    const ev = Array.from({ length: 50 }, (_, i) => ({ at: '2026-10-0' + (1 + (i % 8)), text: 'e' + i }));
    const { ctx, c } = stage({ g: { roomHistoryEvents: () => ev } });
    const h = ctx.pdHistHtml(c);
    assert.equal((h.match(/class="pd-ev"/g) || []).length, 40);
    assert.match(h, /pd_hist_more/);
  });
});

describe('f563 (4) — the doors onto Home', () => {
  test('4a Review on renewals and late promises opens the Paper on its tab (approvals left the Board, rule 6)', () => {
    assert.match(HB, /const HB_REVIEW_ON_PAPER = \{ renew: 'facts', late: 'oblig'/);
    /* RE-POINTED 11 Oct 2026: the walk starts at the row's own contract when it names one */
    assert.match(HB, /igWalk\(ids, Math\.max\(0, cid \? ids\.indexOf\(cid\) : 0\), \{ title: i18t\('ag_' \+ k\), tab \}\)/);
  });
  test('4b an answer on Home leads with the Paper and the Board; off Home it keeps the Contracts page', () => {
    const fn = IG.slice(IG.indexOf('function igAnswerIds'), IG.indexOf('/* WALK A SET ON THE PAPER'));
    const ctx = { state: { view: 'dashboard' }, window: null, getContract: id => ({ id }), contractRef: c => c.id,
      igEsc: s => String(s), i18t: (k, v) => k + (v && v.ref ? ':' + v.ref : ''), i18tn: k => k };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fn + '\nthis.igDoorsHtml = igDoorsHtml;', ctx);
    const many = ctx.igDoorsHtml({ role: 'assistant', listIds: ['A', 'B'] }, 3);
    assert.ok(many.indexOf('data-ig-paper-go="3"') < many.indexOf('data-ig-board-go="3"'));
    assert.ok(many.indexOf('data-ig-board-go') < many.indexOf('data-ig-list="3"'), 'the Contracts page comes last');
    assert.match(ctx.igDoorsHtml({ role: 'assistant', cardIds: ['A'] }, 1), /int_open_on_paper:A/);
    ctx.state.view = 'register';
    assert.doesNotMatch(ctx.igDoorsHtml({ role: 'assistant', listIds: ['A', 'B'] }, 3), /data-ig-paper-go/);
  });
  /* NO DOOR TO WHERE YOU ARE (owner, 15 Oct 2026): the one contract already
     on Home's paper is said, not offered as a button */
  test('4c an answer about the contract already open says so, with no button', () => {
    const fn = IG.slice(IG.indexOf('function igAnswerIds'), IG.indexOf('/* WALK A SET ON THE PAPER'));
    const ctx = { state: { view: 'dashboard' }, window: null, getContract: id => ({ id }), contractRef: c => c.id,
      igEsc: s => String(s), i18t: (k, v) => k + (v && v.ref ? ':' + v.ref : ''), i18tn: k => k,
      igHomePaperFace: () => true, intel: { paper: { id: 'A' } } };
    ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fn + '\nthis.igDoorsHtml = igDoorsHtml;', ctx);
    const here = ctx.igDoorsHtml({ role: 'assistant', cardIds: ['A'] }, 1);
    assert.doesNotMatch(here, /data-ig-paper-go/); assert.match(here, /int_already_on_paper:A/);
    assert.match(ctx.igDoorsHtml({ role: 'assistant', cardIds: ['B'] }, 1), /data-ig-paper-go="1"/, 'another contract keeps its door');
  });
});
