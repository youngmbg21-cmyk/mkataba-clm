'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f799 — ROUND 20'S SHARED PARTS (Requests and My notes as drawn, built on
   the owner's yes of 18 Oct 2026)
   (1) caDraftShared: which words a request shares with a paper — the SAME
       reading as caDraftScore, said in the paper's own spelling.
   (2) Jambo's shared list panel (js/views/inspector.js): an item head may
       carry several pills in one row, and its ⋯ at that row's end
       (moreBesidePills) — ONE ⋯ builder, insMoreHtml; My notes repaints when
       the width crosses the line (INS_PAGE_REPAINT).
   (3) A day with its weekday reads "Tue 20 Oct", no comma, in either market.
   (4) The lane's mark is a drawn icon (ICONS.lane); Start the draft LANDS on
       the paper it chose (landOn, the one lander).
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const CA = R('js/copilotacts.js');
const IK = R('js/views/intake.js');
const INS = R('js/views/inspector.js');
const COMP = R('js/components.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const decl = (src, name) => {
  const m = new RegExp('^(?:async )?(?:function ' + name + '\\(|const ' + name + ' =)', 'm').exec(src);
  if (!m) return '';
  const i = m.index;
  const end = src.slice(i, i + 3).startsWith('con') ? src.indexOf(';\n', i) + 2 : src.indexOf('\n}', i) + 2;
  return src.slice(i, end);
};

describe('f799 (1) the words a request shares with a paper', () => {
  const ctx = {};
  vm.createContext(ctx);
  vm.runInContext(['caDraftWords', 'caDraftScore', 'caDraftShared'].map(n => decl(CA, n)).join('\n') + '\nthis.caDraftScore=caDraftScore; this.caDraftShared=caDraftShared;', ctx);
  test('1a the same reading as the score, each word once, in the paper\'s spelling', () => {
    const nda = { name: 'NDA', blurb: 'Confidentiality for NPD & vendor onboarding.' };
    const ask = 'Mutual NDA with Naivas\nThey asked for a mutual nda and confidentiality first.';
    assert.deepEqual(Array.from(ctx.caDraftShared(ask, nda)), ['NDA', 'Confidentiality']);
    assert.equal(ctx.caDraftScore(ask, nda), 2);
    assert.deepEqual(Array.from(ctx.caDraftShared('a lease for the depot', nda)), [], 'none shared is none');
    assert.equal(ctx.caDraftScore('a lease for the depot', nda), 0);
  });
  test('1b "the", "agreement" and short words never count', () => {
    assert.deepEqual(Array.from(ctx.caDraftShared('the agreement for us', { name: 'The Agreement', blurb: 'for us' })), []);
  });
});

describe('f799 (2) Jambo\'s shared panel: pills in a row, the ⋯ at its end, one ⋯ builder', () => {
  const w = buildWorld({ registerView: true });
  const win = w.win;
  test('2a an item head draws several pills in one row; with moreBesidePills the ⋯ ends that row, not the verbs\' row', () => {
    const head = win.insItemHeadHtml({ eyebrow: 'REQ-1', title: 'A request', pills: '<span class="a">Routine</span><span class="b">With you</span>', moreBesidePills: true,
      acts: [{ k: 'draft', kind: 'accent', label: 'Start the draft' }], menuHtml: '<button data-act="pick">Put it down</button>', moreAria: 'More' });
    const d = win.document.createElement('div'); d.innerHTML = head;
    const row = d.querySelector('.ins-pill-row.jl-pills');
    assert.ok(row && row.querySelector('.a') && row.querySelector('.b'), 'one row of pills');
    assert.ok(row.querySelector(':scope > .ins-more-wrap [data-ins-more]'), 'the ⋯ ends it');
    assert.ok(!d.querySelector('.ins-acts [data-ins-more]'), 'and is not drawn twice');
    const plain = win.document.createElement('div');
    plain.innerHTML = win.insItemHeadHtml({ title: 'x', acts: [{ k: 'a', label: 'A' }], menuHtml: '<button data-act="z">Z</button>' });
    assert.ok(plain.querySelector('.ins-acts [data-ins-more]'), '[control] without it the ⋯ ends the verbs as before');
  });
  test('2b ONE ⋯ builder (insMoreHtml), asked by both places', () => {
    assert.match(strip(decl(INS, 'insActsHtml')), /const more = insMoreHtml\(menuHtml, moreAria\);/);
    assert.equal((strip(INS).match(/data-ins-more aria-haspopup/g) || []).length, 1);
  });
  test('2c My notes repaints when the width crosses the line', () => {
    assert.match(INS, /\n\s+mynotes: 'renderMyNotes',/);
  });
});

describe('f799 (3) a day with its weekday', () => {
  test('3a "Tue 20 Oct": the weekday, then the day, no comma — in a market whose own format has one', () => {
    const ctx = { langLocale: () => 'en-KE' };
    vm.createContext(ctx);
    vm.runInContext(decl(IK, 'ikDay') + '\nthis.ikDay=ikDay;', ctx);
    const yr = new Date().getFullYear();
    assert.equal(ctx.ikDay(`${yr}-10-20`, { weekday: true }), new Date(`${yr}-10-20T00:00:00`).toLocaleDateString('en-KE', { weekday: 'short' }) + ' 20 Oct');
    assert.doesNotMatch(ctx.ikDay(`${yr}-10-20`, { weekday: true }), /,/);
    assert.equal(ctx.ikDay(`${yr}-10-20`), '20 Oct', '[control] without the weekday, as before');
  });
});

describe('f799 (4) the lane\'s mark, and the landing', () => {
  test('4a ICONS.lane is drawn', () => {
    assert.match(COMP, /\n\s+lane:'<path d="[^"]+"\/>',/);
  });
  test('4b Start the draft lands on the paper it chose (landOn), and only when it chose one', () => {
    assert.match(strip(decl(IK, 'intakeDraft')), /if\(pick&&typeof landOn==='function'\) landOn\('#na-root \.na-pick\.on', \{ block:'nearest' \}\);/);
  });
});
