'use strict';
/* f988 — THE AGENDA IS QUICK AGAIN (owner, 10 Nov 2026: "the agenda page seems to be slow")
   1 · Jambo's finds are counted once per contract (obwFindN): the count is kept while the reading, the duties, their
       words and the review's answers are the same, and counted again the moment any of them moves.
   2 · a repaint asked because the book moved (hbRender → renderCalendar({ifMoved:true})) draws nothing when the page
       would come out the same.
   At the parent the claim fails. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = path.join(__dirname, '..');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const OB = fs.readFileSync(path.join(ROOT, 'js', 'obligations.js'), 'utf8');
const CAL = strip(fs.readFileSync(path.join(ROOT, 'js', 'views', 'calendar.js'), 'utf8'));
const HB = strip(fs.readFileSync(path.join(ROOT, 'js', 'views', 'homeboard.js'), 'utf8'));

function memoUnderTest(){
  const a = OB.indexOf('const _obwFindMemo'), b = OB.indexOf('\n}\n', OB.indexOf('function obwFindN')) + 2;
  assert.ok(a > 0 && b > a, 'obwFindN and its memo are declared');
  const calls = { n: 0 };
  const window = { triageOf: c => c._t };
  const obReviewWaiting = c => { calls.n++; return c._t.steps.oblig.found.filter(f => !(c.obligations || []).some(o => o.desc === f.desc)); };
  const fn = new Function('window', 'obReviewWaiting', OB.slice(a, b) + '; return obwFindN;')(window, obReviewWaiting);
  return { fn, calls };
}

test('1 · the finds are counted once, and again only when something under them moves', () => {
  const { fn, calls } = memoUnderTest();
  const c = { id: 'A', _v: 3, obligations: [{ desc: 'Pay rent' }], _t: { steps: { oblig: { ok: true, found: [{ desc: 'Pay rent' }, { desc: 'Insure stock' }, { desc: 'Audit yearly' }] } } } };
  assert.equal(fn(c), 2); assert.equal(calls.n, 1);
  assert.equal(fn(c), 2); assert.equal(fn(c), 2); assert.equal(calls.n, 1, 'kept while nothing moved');
  c.obligations.push({ desc: 'Insure stock' });
  assert.equal(fn(c), 1); assert.equal(calls.n, 2, 'a duty added counts again');
  c.obligations[1] = { desc: 'Insure the stock' };
  assert.equal(fn(c), 2); assert.equal(calls.n, 3, 'a duty\'s words changed counts again');
  c.obReview = { hash: 'h', added: ['x'], skipped: [] };
  fn(c); assert.equal(calls.n, 4, 'a review answer counts again');
  c._v = 4; fn(c); assert.equal(calls.n, 5, 'a new version counts again');
  c._t = { steps: { oblig: { ok: true, found: [{ desc: 'Audit yearly' }] } } };
  assert.equal(fn(c), 1); assert.equal(calls.n, 6, 'a new reading counts again');
  assert.equal(fn({ id: 'B', _t: null }), 0, 'no reading, nothing to count');
  assert.match(OB, /\.map\(c => \(\{ c, n: obwFindN\(c\) \}\)\)/, 'obwFinds reads the kept count');
});

test('2 · a quiet repaint that changes nothing draws nothing', () => {
  assert.match(CAL, /function renderCalendar\(opts\)\{/);
  assert.match(CAL, /const same=!!\(opts&&opts\.ifMoved\)&&host\._calHtml===html&&!!host\.querySelector\('\.cal-page'\);/);
  assert.match(CAL, /host\.innerHTML=html; host\._calHtml=html;/);
  assert.match(HB, /s\.face === 'calendar' && typeof window\.renderCalendar === 'function'\) try \{ renderCalendar\(\{ ifMoved: true \}\); \}/, 'the book moving asks a quiet repaint');
});
