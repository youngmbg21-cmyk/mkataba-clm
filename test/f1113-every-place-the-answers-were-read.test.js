'use strict';
/* f1113 — EVERY PLACE THE ANSWERS WERE READ (owner, 19 Nov 2026, over a photo of a Due diligence read: "there are 4 places
   in the contract where there confirmation of the discovery ask but only one quote or clause is on the paper. All 4
   should be there").

   (1) a read of several questions draws EVERY found answer's words on one paper, in the paper's own order; quotes in
       one paragraph share one place; the paragraph before a place (its heading) is in ink; each place names the
       questions it answers; places far apart are parted; the heading's number is never printed twice
   (2) a quote the wording no longer holds word for word is still shown, as quoted
   (3) an answer pressed marks its place (data-dsc-focus); a one-question read is the one-question paper as before
   (4) the results page draws it for the chosen row, an answer's cell is pressable and lands on its place (landOn)
   Fails at the parent: dscPaperAllHtml and dscLocate do not exist; the panel reads r.askIds[0] only. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/reads.js'), 'utf8');
const RD = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
const slice = (from, to) => { const a = SRC.indexOf(from), b = SRC.indexOf(to, a + 1); assert.ok(a > 0 && b > a, from + ' found'); return SRC.slice(a, b); };

const TEXT = ['SUPPLY AGREEMENT', '4. Price', 'The price is fixed for the first year and reviewed yearly after that.',
  '5. Termination', 'Either party may terminate on ninety (90) days written notice. Liability for any claim is capped at the fees paid in the twelve months before it.',
  '6. Confidentiality', 'Each party keeps the other party\'s information secret.', '7. Assignment', 'Neither party may assign without consent.',
  '8. Governing law', 'This Agreement is governed by the laws of Sweden.'].join('\n');

function build(answers, names){
  const src = slice('function dscLocate(text, quote){', 'function dscSlice(text, quote){')
    + slice('function dscPaperAllHtml(askIds, cid, focus){', '/* ONE ANSWER, ONE LINE');
  const AC = { asks: Object.fromEntries(Object.keys(names).map(k => [k, { name: names[k] }])), ans: Object.fromEntries(Object.entries(answers).map(([k, a]) => [k, { C1: a }])) };
  const deps = { DSC_SLICE: 280, AC, _dscAC: () => AC, getContract: id => id === 'C1' ? { id: 'C1', name: 'Supply Agreement', counterparty: 'Juno LLC' } : null,
    dscTextOf: () => TEXT, _rdE: x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'),
    _rdT: k => k, askColClauseNo: a => a.clause || '', cKind: () => '', _rdRef: c => c.id, dscPaperHtml: (k, cid) => `ONE:${k}:${cid}` };
  return new Function(...Object.keys(deps), src + '\nreturn dscPaperAllHtml;')(...Object.values(deps));
}
const NAMES = { q1: 'Notice to terminate', q2: 'Liability cap', q3: 'Governing law', q4: 'Personal data' };
const ANS = { q1: { found: true, quote: 'terminate on ninety (90) days written notice' }, q2: { found: true, quote: 'Liability for any claim is capped at the fees paid' },
  q3: { found: true, quote: 'governed by the laws of Sweden' }, q4: { found: true, quote: 'Personal data is processed only on written instructions', clause: '9' } };

test('f1113 (1) every found answer on one paper, in the paper\'s order; one paragraph shared; heading in ink, never doubled', () => {
  const html = build(ANS, NAMES)(['q3', 'q1', 'q2', 'q4'], 'C1', null);
  const places = html.split('class="dsc-place').length - 1;
  assert.equal(places, 3, 'Termination (two answers), Governing law, and the loose quote');
  const marks = [...html.matchAll(/data-dsc-mark="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(marks, ['q1', 'q2', 'q3', 'q4'], 'in the paper\'s own order, whatever the order of the questions');
  assert.match(html, /<div class="dsc-q">Notice to terminate · Liability cap<\/div><p class="dsc-head">5\. Termination<\/p>/, 'one place names both; its heading in ink');
  assert.match(html, /<div class="dsc-q">Governing law<\/div><p class="dsc-head">8\. Governing law<\/p>/);
  assert.equal((html.match(/class="dsc-gap"/g) || []).length, 2, 'far places are parted');
  assert.doesNotMatch(html, /dsc-sec[^<]*<\/b> ?Either party|<b class="dsc-sec">5<\/b>/, 'the heading\'s number is not printed again');
  assert.doesNotMatch(html, /Confidentiality|Assignment|4\. Price/, 'nothing between the places is drawn');
});

test('f1113 (2) a quote the wording does not hold word for word is still shown, as quoted', () => {
  const html = build(ANS, NAMES)(['q1', 'q4'], 'C1', null);
  assert.match(html, /<div class="dsc-q">Personal data<\/div><p><b class="dsc-sec">9<\/b> <mark data-dsc-mark="q4">Personal data is processed only on written instructions<\/mark><\/p>/);
});

test('f1113 (3) an answer pressed marks its place; one question is the one-question paper as before', () => {
  const html = build(ANS, NAMES)(['q1', 'q2', 'q3'], 'C1', 'q3');
  assert.equal((html.match(/data-dsc-focus/g) || []).length, 1);
  assert.match(html, /class="dsc-place is-focus" data-dsc-place="q3" data-dsc-focus/);
  assert.equal(build(ANS, NAMES)(['q1'], 'C1', null), 'ONE:q1:C1');
  const none = build({ q1: { found: false }, q2: null }, NAMES)(['q1', 'q2'], 'C1', null);
  assert.match(none, /dsc_paper_nowords/, 'nothing found says so on the paper');
});

test('f1113 (4) the results page draws it for the chosen row; an answer pressed lands on its place', () => {
  /* RE-POINTED 22 Nov 2026 (P-42 review, as drawn): the result's own panel (dsnResultPanelHtml) holds every place, under
     "Every place the answers were read" */
  assert.match(RD, /body: dsnResultPanelHtml\(r, _dsn\.cid, focus\)/); assert.match(RD, /pack \? dscPaperAllHtml\(r\.askIds, cid, focus\) : dscPaperHtml\(k, cid\)/);
  assert.match(RD, /landOn\('\[data-dsc-paper\] \[data-dsc-focus\]', \{ focus: false, block: 'center'/);
  assert.match(RD, /data-dsn-q="\$\{_rdE\(r\.askIds\[i\]\)\}"/, 'a found answer\'s cell carries its question');
  assert.match(RD, /const q = t\.closest\('\[data-dsn-q\]'\), f = q \? q\.getAttribute\('data-dsn-q'\) : null;/);
  assert.match(RD, /_dsn\.cid = id; _dsn\.focusAsk = f; renderReads\(\);/);
  const CSS = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(CSS, /\.dsc-sheet \.dsc-head\{font-weight:var\(--w-strong\);color:var\(--color-text\)\}/, 'the heading in ink');
});

/* (5) THE NUMBER ONCE (owner, 19 Nov 2026: "fix the doubled clause number too"): the one-question paper printed the
   heading "5. Termination" and then a bold "5" before the paragraph; the number is added only where nothing says it */
function buildOne(answer, text){
  const src = slice('function dscLocate(text, quote){', 'function dscPaperAllHtml(');
  const AC = { ans: { q1: { C1: answer } } };
  const deps = { DSC_SLICE: 280, _dscAC: () => AC, getContract: () => ({ id: 'C1', name: 'Supply Agreement' }), dscTextOf: () => text,
    _rdE: x => String(x == null ? '' : x).replace(/&/g, '&amp;').replace(/</g, '&lt;'), _rdT: k => k, askColClauseNo: a => a.clause || '',
    cKind: () => '', _rdRef: c => c.id };
  return new Function(...Object.keys(deps), src + '\nreturn dscPaperHtml;')(...Object.values(deps));
}
test('f1113 (5) the one-question paper prints the clause number once', () => {
  const a = { found: true, quote: 'Either party may terminate on ninety (90) days written notice', clause: '5' };
  const withHead = buildOne(a, TEXT)('q1', 'C1');
  assert.match(withHead, /5\. Termination/, 'the heading stands');
  assert.doesNotMatch(withHead, /<b class="dsc-sec">5<\/b>/, 'no second "5" before the paragraph');
  const bare = buildOne(a, 'Either party may terminate on ninety (90) days written notice and pay what is owed.')('q1', 'C1');
  assert.match(bare, /<b class="dsc-sec">5<\/b> /, 'where nothing says the number, it is still given');
});
