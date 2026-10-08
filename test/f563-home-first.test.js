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
    for (const r of ['ktFactReads(c)', 'obPanelActs(o, c, i, \'tab\')', 'signBlockers(c)', 'roomHistoryEvents(c)', 'standsHtml(c'])
      assert.ok(DESK.includes(r), r);
  });
});

describe('f563 (2) — signing: the Sign button\'s list, acts in place', () => {
  test('2a an approval the reader may decide is Approve / Refuse here; Send stays grey while anything is open', () => {
    const { ctx, c } = stage({ g: { signBlockers: () => [{ key: 'approval', label: 'Approval outstanding' }],
      approvalDecidableNow: () => ({ kind: 'rule' }), approvalDecideAsk: () => true, openShareModal: () => {}, signerPlan: () => [] } });
    const h = ctx.pdSignHtml(c);
    assert.match(h, /pd_approve/); assert.match(h, /pd_refuse/);
    assert.match(h, /<button[^>]*disabled[^>]*>pd_send_sign</);
  });
  test('2b nothing open: Send for signing is the filled button', () => {
    const { ctx, c } = stage({ g: { signBlockers: () => [], openShareModal: () => {}, signerPlan: () => [] } });
    assert.match(ctx.pdSignHtml(c), /ui-btn-primary" data-pd-act="a\d+">pd_send_sign/);
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
    assert.match(HB, /igWalk\(ids, 0, \{ title: i18t\('ag_' \+ k\), tab \}\)/);
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
});
