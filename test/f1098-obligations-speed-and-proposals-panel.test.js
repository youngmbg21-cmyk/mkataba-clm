'use strict';
/* f1098 — OBLIGATIONS: THE PAGE NO LONGER DRAGS, AND PROPOSALS' PANEL AS DRAWN (owner, 19 Nov 2026: "the page seems to be
   slow and dragging so fix that first … For proposal, when you land on the page it should be five parts. When you press
   a row it should be legora way … delete the found column … it should be us and theirs button. Do not name the other
   side to the button because names can be long").
   (1) SPEED: every decision, tally and row asked obReviewOf, and each read the whole contract's text and hashed it —
       about 500 times a paint with 45 agreements, 0.7 s a press. Now nothing kept = the wording is not read at all, and a
       count reads it once per contract.
   (2) FOUND IS GONE from Proposals' columns; the duty rows span the five that stay.
   (3) LANDED: the five parts (obnFiveOf). (4) A ROW PRESSED: the Legora way (obnLgHtml) — quoted, a time limit marked,
       answered in the row with Us · Theirs · Both sides, never the other side's name; every whose-job button alike.
   AT THE PARENT every test here fails: the hash is read per duty, Found stands, obnFiveOf / obnLgHtml / obWhoseBtn do
   not exist, and the buttons carry the counterparty's name. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');

const FOUND = [
  { desc: 'Keep the warehouse insured', quote: 'The Supplier shall maintain all-risks insurance over the goods.', clause: '4.2', party: 'them' },
  { desc: 'Report damaged goods within 48 hours', quote: 'The Customer shall notify any damage within forty-eight (48) hours of delivery.', clause: '5.1', party: 'us' },
  { desc: 'Pay storage fees monthly', quote: 'The Customer shall pay the storage fees monthly in arrears.', clause: '6.1', party: 'us' }];
function world(){
  const W = buildWorld({ obligations: true }).win;
  const c = { id: 'MK-T1', name: 'Warehousing Services', counterparty: 'Juno Logistics International Holdings Limited', folder: 'proc', status: 'Signed',
    obligations: [], metadata: {}, triage: { steps: { oblig: { ok: true, found: FOUND.map(o => Object.assign({}, o)) } } } };
  const st = W.eval('typeof state !== "undefined" ? state : (window.state = { contracts: [], settings: {} })'); (st.contracts = st.contracts || []).push(c);
  /* the arrival read's held list, where this world does not load js/triage.js: the found duties not yet on the contract */
  if (typeof W.triageHeldObligations !== 'function') W.triageHeldObligations = x => ((x.triage && x.triage.steps.oblig.found) || []).filter(o => !W.obligationAlreadyOn(x, o));
  W.canAccessFolder = () => true;
  return { W, c };
}

test('f1098 (1) nothing kept, the wording is not read; something kept, a count reads it once per contract', () => {
  const { W, c } = world();
  let reads = 0; W.triageWordingHash = () => { reads++; return 'H1'; };
  W.obReviewTally(c, FOUND);
  W.obnProjects();
  assert.equal(reads, 0, 'no decision on file: nothing to measure against, so nothing read');
  c.obReview = { hash: 'H1', added: [], skipped: ['pay storage fees monthly'] };
  reads = 0; W.obReviewTally(c, FOUND);
  assert.equal(reads, 1, 'a tally reads the wording once, not once a duty');
  reads = 0; W.obnProjects();
  assert.ok(reads <= 2, 'the project list reads it once for the tally and once for the answers, never per duty: ' + reads);
  assert.equal(W.obReviewTally(c, FOUND).skipped, 1, 'a kept skip still counts');
  W.triageWordingHash = () => 'H2';
  assert.equal(W.obReviewTally(c, FOUND).skipped, 0, 'a moved wording still starts fresh');
  /* a mark stamps the wording it was made on */
  W.triageWordingHash = () => 'H3'; W.obReviewMark(c, FOUND[0], 'skipped');
  assert.equal(c.obReview.hash, 'H3');
});

test('f1098 (2) Proposals has no Found column, and a duty row spans the columns that stay', () => {
  const src = strip(read('js/obligations.js'));
  const i = src.indexOf('function obnCols('); assert.ok(i >= 0);
  const cols = src.slice(i, src.indexOf('const seat', i));
  assert.doesNotMatch(cols, /'found'|obn_col_found/, 'Found is gone');
  assert.match(cols, /k: 'side'.*k: 'prog'.*k: 'status'.*k: 'acts'/s);
  const duty = src.slice(src.indexOf('function obnDutyHtml('), src.indexOf('function obnProjRowHtml('));
  assert.match(duty, /colspan="2"[\s\S]*colspan="2"/, 'two and two and one: the five columns, never six');
  assert.doesNotMatch(src.slice(src.indexOf('function obnProjRowHtml('), src.indexOf('let _obnPick')), /obn-age/, 'no age cell');
});

test('f1098 (3) landed on Proposals: the five parts', () => {
  const { W } = world();
  const rows = W.obnProjects();
  const o = W.obnFiveOf(rows);
  assert.match(o.title, /3 duties wait for your yes, on 1 agreement/);
  assert.equal(o.glance.length, 3);
  assert.equal(o.groups[0].rows[0].attr, 'data-obn-pick="MK-T1"', 'a row chooses its agreement');
  assert.match(o.act.attr, /data-obn-pickopen="MK-T1"/, 'the black button chooses and opens the oldest');
  assert.match(W.obnFiveOf([]).title, /Nothing is waiting/, 'never empty');
});

test('f1098 (4) a row pressed: the Legora way, answered in the row, Us · Theirs · Both sides, never the name', () => {
  const { W, c } = world();
  const rows = W.obnProjects();
  const h = W.obnLgHtml(rows[0], rows);
  const d = W.document.createElement('div'); d.innerHTML = h;
  const its = [...d.querySelectorAll('.obn-lg-it:not(.is-next)')];
  assert.equal(its.length, 3);
  assert.ok(its.every(i => i.querySelector('.obn-lg-q')), 'each duty in its own quoted words');
  assert.match(d.querySelector('.obn-lg-q mark') && d.innerHTML, /<mark>forty-eight \(48\) hours<\/mark>/, 'the time limit marked');
  const words = [...d.querySelectorAll('[data-obn-whose]')].map(b => b.textContent);
  assert.deepEqual([...new Set(words)], ['Us', 'Theirs', 'Both sides']);
  assert.ok(![...d.querySelectorAll('button')].some(b => b.textContent.includes(c.counterparty)), 'no button carries the other side\'s name');
  assert.ok(d.querySelector('[data-obn-skip]') && d.querySelector('[data-obn-addall="MK-T1"]') && d.querySelector('[data-obn-ask="MK-T1"]'));
  /* every whose-job button reads the one word-giver */
  const src = strip(read('js/obligations.js'));
  assert.equal((src.match(/obWhoseBtn\(/g) || []).length >= 5, true, 'the desk, the list, the panel and its word');
  assert.doesNotMatch(src, />\$\{_obEsc\(obWhoseWord\(c, k\)\)\}<\/button>/, 'no button reads the name-giver');
});

test('f1098 (5) both books carry the words', () => {
  const src = read('js/i18n.js');
  for (const k of ['obn5_t_other', 'obn5_start', 'obn5_look', 'obn_lg_todo', 'obn_lg_next', 'obn_lg_ask', 'obn_lg_ask_q', 'obd_theirs_btn', 'obn_p_prop_word'])
    assert.equal((src.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2, k + ' in both books');
});

test('f1098 (6) Open chooses too: opening an agreement makes it the panel\'s subject, the Legora way', () => {
  const src = strip(read('js/obligations.js'));
  const i = src.indexOf("const op = t.closest('[data-obn-open]');"); assert.ok(i >= 0);
  const h = src.slice(i, src.indexOf('return; }', i) + 9);
  assert.match(h, /_obnOpenAg === id && _obnPick !== id\)\{ _obnPick = id;/);
});

test('f1098 (7) a tile that holds words takes the smaller size and wraps inside its card (owner: "Every month" ran out of its tile)', () => {
  const { W } = world();
  if (typeof W.jamboOverviewHtml !== 'function') return;
  const h = W.jamboOverviewHtml({ title: 'T', glance: [{ n: 2, l: 'days late' }, { n: 'None', l: 'reminder' }, { n: 'Every month', l: 'repeats' }] }, 't');
  const d = W.document.createElement('div'); d.innerHTML = h;
  const g = [...d.querySelectorAll('.jov5-g')].map(x => x.classList.contains('is-word'));
  assert.deepEqual(g, [false, false, true], 'only the words tile');
  assert.match(read('index.html'), /\.jov5-g\.is-word b\{font-size:15px;[^}]*white-space:normal/);
});
