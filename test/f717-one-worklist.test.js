'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f717 — APPROVALS & SIGNING, "ONE WORKLIST" (round 15 of the redesign: the
   owner picked "One worklist" by name, 17 Oct 2026)
   (1) One list, no tabs: approvals and signatures drawn together with a Kind
       column, a "Why it waits" and a "Whose turn"; the words in both books.
   (2) Grouped by who owes the next step (apWorkRows, ONE reading): "Yours to
       answer" (an approval asked of you, your signature, one you raised and
       never sent, one you already answered) first, then "Waiting on others".
   (3) Whose turn says it (apTurnText): "You", "You sign", "You, to ask", else
       who the approval waits on.
   (4) The panel beside the list reads each row's own kind (apRowTab): a
       signature's panel is what stands before signing, an approval's carries
       Approve and Refuse; a group's name spans the whole list.
   AT THE PARENT (fdf0ec03) every test here FAILS.
   The browser half: test/chromium/one-worklist-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AP = R('js/views/approvalsview.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();

describe('f717 (1) one list, no tabs', () => {
  test('1a the words, in both books', () => {
    assert.equal(BOOKS.en.ap_wl_yours, 'Yours to answer');
    assert.equal(BOOKS.en.ap_wl_others, 'Waiting on others');
    assert.equal(BOOKS.en.ap_wl_kind, 'Kind');
    assert.equal(BOOKS.en.ap_wl_why, 'Why it waits');
    assert.equal(BOOKS.en.ap_wl_turn, 'Whose turn');
    for (const k of ['ap_wl_title', 'ap_wl_kind_appr', 'ap_wl_kind_sig', 'ap_wl_you', 'ap_wl_you_sign', 'ap_wl_you_send', 'ap_wl_none',
      'ap_wl_n_yours_one', 'ap_wl_n_yours_other', 'ap_wl_n_others_one', 'ap_wl_n_others_other'])
      for (const lang of ['en', 'sv']) assert.ok(BOOKS[lang][k], k + ' ' + lang);
  });
  test('1b the page draws no tab row; the columns are Kind · Why it waits · Whose turn', () => {
    const page = fnBody(AP, 'renderApprovalsPage');
    assert.ok(page, 'renderApprovalsPage is there');
    assert.doesNotMatch(page, /data-ap-tab/, 'no tab row on the page');
    assert.match(page, /i18t\('ap_wl_kind'\)[\s\S]*i18t\('ap_wl_why'\)[\s\S]*i18t\('ap_wl_turn'\)/);
  });
});

describe('f717 (2) grouped by who owes the next step', () => {
  const stage = (ap, sg) => { const ctx = { apApprovalRows: () => ap, apRowsShown: x => x, apSignatureRows: () => sg };
    vm.createContext(ctx); vm.runInContext(fnBody(AP, 'apWorkRows'), ctx); return ctx; };
  test('2a yours first (asked of you, your signature, raised and unsent, answered), then the rest', () => {
    const ap = [{ c: { id: 'A' }, mine: true }, { c: { id: 'B' } }, { c: { id: 'C' }, own: true, notAsked: true }, { c: { id: 'D' }, done: true }, { c: { id: 'E' }, own: true }];
    const sg = [{ c: { id: 'S' }, kind: 'sign' }];
    const W = JSON.parse(JSON.stringify(stage(ap, sg).apWorkRows()));
    assert.deepEqual(W.yours.map(r => r.c.id), ['A', 'C', 'D', 'S']);
    assert.deepEqual(W.others.map(r => r.c.id), ['B', 'E']);
    assert.deepEqual(W.rows.map(r => r.c.id), ['A', 'C', 'D', 'S', 'B', 'E'], 'one list, yours on top');
    assert.deepEqual(W.rows.map(r => r.type), ['approval', 'approval', 'approval', 'signature', 'approval', 'approval']);
  });
  test('2b the band counts the same two groups the list draws', () => {
    const page = fnBody(AP, 'renderApprovalsPage');
    assert.match(page, /const W=apWorkRows\(\)/);
    assert.match(page, /i18tn\('ap_wl_n_yours',W\.yours\.length/);
    assert.match(page, /i18tn\('ap_wl_n_others',W\.others\.length/);
    assert.match(page, /band\('yours',i18t\('ap_wl_yours'\),W\.yours\)\}\$\{band\('others',i18t\('ap_wl_others'\),W\.others\)/);
  });
});

describe('f717 (3) whose turn', () => {
  const ctx = { i18t: k => k }; vm.createContext(ctx); vm.runInContext(fnBody(AP, 'apTurnText'), ctx);
  test('3a You · You sign · You, to ask · who it waits on', () => {
    assert.equal(ctx.apTurnText({ type: 'signature', kind: 'sign' }), 'ap_wl_you_sign');
    assert.equal(ctx.apTurnText({ type: 'approval', mine: true }), 'ap_wl_you');
    assert.equal(ctx.apTurnText({ type: 'approval', notAsked: true }), 'ap_wl_you_send');
    assert.equal(ctx.apTurnText({ type: 'approval', waitsOn: 'Lina Ek' }), 'Lina Ek');
    assert.equal(ctx.apTurnText({ type: 'approval' }), '—');
  });
});

describe('f717 (4) each row its own panel; a group spans the list', () => {
  test('4a the panel reads the row\'s own kind', () => {
    const ctx = {}; vm.createContext(ctx); vm.runInContext(fnBody(AP, 'apRowTab'), ctx);
    assert.equal(ctx.apRowTab({ type: 'signature' }), 'signatures');
    assert.equal(ctx.apRowTab({ type: 'approval' }), 'approvals');
    const paint = fnBody(AP, 'apInsPaint');
    assert.match(paint, /^function apInsPaint\(rows\)/, 'one list in, no tab');
    assert.match(paint, /const tab=apRowTab\(r\)/);
  });
  test('4b a group\'s row spans every column, under its own name (not the page band\'s)', () => {
    const page = fnBody(AP, 'renderApprovalsPage');
    assert.match(page, /<tr class="ap-grp is-\$\{k\}"><td colspan="\$\{cols\}">/);
    const css = R('index.html');
    assert.match(css, /\.ap-table tr\.ap-grp td\{/);
    assert.doesNotMatch(css, /\.ap-table tr\.ap-band/, 'the table rows never wear the page band\'s name');
  });
});
