'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f761 — OUR STANDARDS ON ANY PAPER, AND THE MARKS UNDER A CLAUSE (round 21,
   "Paper first": the owner's yes to the marks — "build all the gaps", 18 Oct
   2026; js/views/templatebuilder.js tbCoverageOf / tbMarksOf / tbMarksHtml,
   js/views/library.js tplPfSaid)
   (1) ONE READING of which of Our standards a paper meets, over any list of
       sections — the builder's blocks (tbCoverage) and the book's sheet alike
       — and the builder's reading did not move.
   (2) The marks under each section: what it meets (the clause library's own
       name), what it breaks (its figure against ours), how often contracts
       drawn from it came back changed there; a changed standard with no
       clause on this paper is said, never pinned to the wrong one.
   (3) ONE BUILDER for the marks: never wording, never editable, and the
       "came back changed" mark is a door to the contracts it counts.
   (4) Jambo's words beside the book, from the record and nothing else:
       "… clause 2 Liability twice, clause 3 Payment once. It meets all N …"
   AT THE PARENT (gaps/A1, d2a4eb4) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const TB = R('js/views/templatebuilder.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const w = () => loadViews(['js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js'],
  { state: { settings: {} }, API_MODE: () => false, canEdit: () => true });
const plain = x => JSON.parse(JSON.stringify(x));
const PAPER = [
  { head: 'Services', text: 'The Supplier provides the Services described in each statement of work.', s: 0 },
  { head: 'Liability', text: "Each party's total liability is capped at the fees paid in the 12 months before the claim.", s: 1 },
  { head: 'Payment', text: 'Invoices are payable within 60 days of the invoice date.', s: 2 },
  { head: 'Governing law', text: 'This agreement is governed by the laws of Kenya.', s: 3 },
];

describe('f761 (1) one reading over any paper', () => {
  test('1a hit, deviation and open, each with its place on the paper', () => {
    const c = w().tbCoverageOf(PAPER, '_default');
    const by = k => c.rows.find(r => r.category === k);
    assert.equal(by('Governing law').state, 'hit'); assert.equal(by('Governing law').at, 3);
    assert.equal(by('Liability cap').state, 'hit'); assert.equal(by('Liability cap').at, 1);
    assert.equal(by('Payment terms').state, 'dev'); assert.equal(by('Payment terms').figure, 60); assert.equal(by('Payment terms').unit, 'days');
    assert.equal(by('Data protection').state, 'open'); assert.equal(by('Data protection').at, -1);
    assert.equal(c.met, 2, 'met is the hits only'); assert.equal(c.covered, 3, 'covered keeps its meaning: written, met or not');
  });
  test('1b the builder\'s reading is the same function over its blocks — same answer', () => {
    const win = w();
    const blocks = [{ blockType: 'heading', content: 'Payment', _k: 1 }, { blockType: 'field_group', content: 'Invoices are payable within 60 days.', _k: 2 }];
    const a = win.tbCoverage(blocks, 'other');
    const b = win.tbCoverageOf([{ head: 'Payment', text: 'Invoices are payable within 60 days.' }], '_default');
    assert.deepEqual(a.rows.map(r => [r.category, r.state]), b.rows.map(r => [r.category, r.state]));
    assert.equal(a.rows.find(r => r.category === 'Payment terms').where.head, 'Payment', 'where is still the builder\'s section');
    assert.match(fnBody(TB, 'tbCoverage'), /return tbCoverageOf\(tbSections\(bs\)\.map\(s => \(\{ head: s\.head, text: tbSectionText\(s, bs\), s \}\)\), tbPbKey\(category\)\);/);
  });
});

describe('f761 (2) the marks under each section', () => {
  test('2a met says our standard\'s own name; a deviation its figure; changed counts sit under their clause', () => {
    const win = w();
    const cov = win.tbCoverageOf(PAPER, '_default');
    const r = plain(win.tbMarksOf(PAPER, cov, [{ category: 'Liability cap', n: 3, ids: ['a', 'b', 'c'] }, { category: 'Payment terms', n: 2, ids: ['a', 'd'] }, { category: 'Data protection', n: 1, ids: ['e'] }]));
    assert.deepEqual(r.marks[0], [], 'a clause that meets nothing carries no mark');
    assert.deepEqual(r.marks[1].map(m => [m.kind, m.label || m.n]), [['met', 'Liability cap at 12 months fees'], ['changed', 3]]);
    assert.deepEqual(r.marks[2].map(m => [m.kind, m.figure, m.want]), [['dev', 60, 45], ['changed', undefined, undefined]]);
    assert.equal(r.marks[3][0].kind, 'met');
    assert.deepEqual(r.loose.map(c => c.category), ['Data protection'], 'a changed standard with no clause here is handed back, never pinned on another');
  });
});

describe('f761 (3) one builder for the marks', () => {
  test('3a never wording, never editable; a changed mark is a button carrying the contracts it counts', () => {
    const win = w();
    const html = win.tbMarksHtml([{ kind: 'met', category: 'Payment terms', label: 'Payment within 30 days' }, { kind: 'dev', category: 'Payment terms', label: 'Payment terms', figure: 60, want: 45, op: '<=', unit: 'days' }, { kind: 'changed', category: 'Liability cap', n: 3, ids: ['a', 'b', 'c'] }]);
    assert.match(html, /^<div class="tpl-mks" data-not-wording contenteditable="false">/);
    /* RE-POINTED 21 Oct 2026 (Chambers): every mark is a dot and its words (an <i>), no tick, no wash */
    assert.match(html, /<span class="tpl-mk" title="Meets Our standards: Payment terms"><i><\/i>Payment within 30 days<\/span>/);
    assert.match(html, /<span class="tpl-mk is-dev"[^>]*><i><\/i>Payment terms: 60 days · ours ≤ 45<\/span>/);
    assert.match(html, /<button type="button" class="tpl-mk is-changed" data-tpl-mk-changed="a,b,c" data-tpl-mk-cat="Liability cap"[^>]*><i><\/i>Came back changed 3 times<\/button>/);
    assert.equal(win.tbMarksHtml([]), '', 'no marks, no row');
  });
  test('3b the mark opens the Contracts list narrowed to its contracts, landing on the first (and leaves the builder through tbLeave)', () => {
    const LIB = R('js/views/library.js');
    assert.match(LIB, /const mk=t\.closest\('\[data-tpl-mk-changed\]'\);/);
    assert.match(LIB, /regShowOnly\(ids, i18t\('lib_pf_changed_list'/);
    assert.match(LIB, /if\(document\.getElementById\('tb-page'\)&&typeof tbLeave==='function'\) tbLeave\(go\); else go\(\);/);
    assert.match(R('index.html'), /\.tpl-mks\{[^}]*user-select:none/);
  });
});

describe('f761 (4) Jambo\'s words beside the book', () => {
  const LIB = R('js/views/library.js');
  const lib = () => loadViews(['js/clausemodel.js', 'js/playbook.js', 'js/views/templatebuilder.js', 'js/views/library.js'],
    { state: { settings: {}, contracts: [] }, API_MODE: () => false, canEdit: () => true, TEMPLATES: {}, FOLDERS: {}, tplLibAll: () => ({ list: [] }) });
  test('4a from the record, nothing spent: used, where it came back changed by clause, what it meets', () => {
    const win = lib();
    const card = { kind: 'cp', id: 'x', name: 'Master services agreement', version: 'v4' };
    const read = { st: { used: 14, changed: 5, byCat: [{ category: 'Liability cap', n: 3 }, { category: 'Payment terms', n: 2 }] },
      cov: { total: 6, met: 6, rows: [{ category: 'Liability cap', state: 'hit', at: 1 }, { category: 'Payment terms', state: 'hit', at: 2 }] },
      secs: [{ no: '1', head: 'Services' }, { no: '7', head: 'Liability' }, { no: '11', head: 'Payment' }], marks: [] };
    const lines = win.tplPfSaid(card, read);
    assert.equal(lines[0], '<b>Master services agreement v4</b>, from the record — nothing spent.');
    assert.equal(lines[1], 'Used 14 times in 12 months. 5 came back changed: clause 7 Liability 3 times, clause 11 Payment twice. It meets all 6 of Our standards.');
  });
  test('4b a template nobody drafted from, and one that meets only some, are said as they are', () => {
    const win = lib();
    const lines = win.tplPfSaid({ kind: 'cp', id: 'y', name: 'Reseller agreement' }, { st: { used: 0, changed: 0, byCat: [] },
      cov: { total: 4, met: 3, rows: [{ category: 'Governing law', state: 'hit' }, { category: 'Data protection', state: 'open' }] } });
    /* RE-POINTED (check #1, 19 Oct 2026): where the paper's set differs from
       the Our standards tab's count, the sentence says what it is read
       against — here every contract's baseline */
    assert.equal(lines[1], 'Nothing has been drafted from it in 12 months. It meets 3 of the 4 standards every contract is read against; still to meet: Data protection.');
  });
  test('4c Next steps are the template\'s own verbs; "where it came back changed" lands on the mark (LAND ON IT)', () => {
    const c = fnBody(LIB, 'tplPfChips');
    assert.match(c, /chip\('builder', i18t\('lib_pf_c_builder'\)\)/);
    assert.match(c, /chip\('draft', i18t\('lib_pf_c_draft'\)\)/);
    assert.match(c, /landOn\('\[data-tpl-sec="book"\] \.tpl-mk\.is-changed'/);
  });
});
