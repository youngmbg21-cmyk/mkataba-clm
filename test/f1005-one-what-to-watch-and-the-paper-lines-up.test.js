/* ============================================================
   f1005 — ONE "WHAT TO WATCH" PER CLAUSE; THE PAPER AND THE PANEL LINE UP; THE PAPER STAYS WHITE
   (owner, 11 Nov 2026: picked "One list", "Drop it", and "build One list with the scrolling fix")
   ============================================================
   1. A clause with two or more points to watch drew a card each with its own three links. In the new look they
      are ONE card: "What to watch · N points", a line each, one row of links (Start redlining · Deep dive · Mark
      all reviewed). Blanks keep their own card; one point keeps its own card; the old look is untouched.
   2. The panel opened the first clause that needs you while the paper stayed put, and a paper scrolled on the
      Dossier tab came back to Clauses with the old clause open. Now the first open glides the paper there
      (docThreadGoTo), and a paint after the paper moved opens the clause at the paper's line.
   3. The open clause's words are no longer washed amber on the paper (pd2-cl-on is gone).
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const BD = read('js/views/breakdown.js'), CT = read('js/views/contract.js'), PD = read('js/paperdesk.js'), IX = read('index.html'), I18N = read('js/i18n.js');
function fnSrc(src, name){ const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name); let j = src.indexOf('{', i), d = 0;
  for (let k = j; k < src.length; k++){ if (src[k] === '{') d++; else if (src[k] === '}' && --d === 0) return src.slice(i, k + 1); } throw new Error(name); }

function sandbox(newLook){
  const ctx = { _stk: { marking: {} }, STK_RANK: { need: 3, look: 2, note: 1, fine: 0 },
    _bdE: s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
    i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n) => k + ':' + n,
    stkNewLookOn: () => newLook, stkReviewWhy: () => '', stkCardHtml: (c, p, i) => `<card ${i}>` };
  vm.createContext(ctx);
  vm.runInContext(fnSrc(BD, 'stkRowCardsHtml') + '\n' + fnSrc(BD, 'stkGroupHtml'), ctx);
  return ctx;
}
const pts = [
  { key: 'a', status: 'look', stake: 'No cap on increases.' },
  { key: 'b', status: 'need', stake: 'Any new tax lands on us.' },
  { key: 'c', status: 'look', stake: 'No set-off.', done: { name: 'Amina Otieno' } },
  { key: 'd', status: 'need', blank: true, title: 'Address left blank' } ];

describe('f1005 (1) one "What to watch" per clause', () => {
  test('two or more points to watch are ONE card with one row of links; a blank keeps its own card', () => {
    const s = sandbox(true);
    const html = s.stkRowCardsHtml({}, [0, 1, 2, 3], pts, '');
    assert.equal((html.match(/class="stk-line stk-card is-mq stk-group/g) || []).length, 1, 'one card');
    assert.match(html, /stk_watch_h<\/b> · stk_watch_n:3/, '"What to watch · 3 points"');
    assert.equal((html.match(/class="stk-gi /g) || []).length, 3, 'a line per point');
    assert.equal((html.match(/data-stk-redline=/g) || []).length, 1, 'ONE Start redlining');
    assert.equal((html.match(/data-stk-dive=/g) || []).length, 1, 'ONE Deep dive');
    assert.match(html, /data-stk-dive="0"/, 'Deep dive opens the first open point (the dive walks the rest)');
    assert.match(html, /data-stk-review-all="0,1"/, 'Mark all reviewed covers the open points only');
    assert.match(html, /stk-group is-need/, 'the card wears its worst open verdict');
    assert.match(html, /<card 3>$/, 'the blank keeps its own card (Fill it in)');
  });
  test('every point reviewed: "All reviewed" with one Undo for all', () => {
    const s = sandbox(true);
    const done = pts.slice(0, 2).map(p => ({ ...p, done: { name: 'Y' } }));
    const html = s.stkRowCardsHtml({}, [0, 1], done, '');
    assert.match(html, /stk_all_reviewed/); assert.match(html, /data-stk-unreview-all="0,1"/);
  });
  test('one point, or the old look, draws the cards as before', () => {
    assert.equal(sandbox(true).stkRowCardsHtml({}, [0], pts, ''), '<card 0>');
    assert.equal(sandbox(false).stkRowCardsHtml({}, [0, 1], pts, ''), '<card 0><card 1>');
  });
  test('the decorator draws through it, and Mark all reviewed is each point\'s own record in turn', () => {
    assert.match(strip(BD), /h\.insertAdjacentHTML\('afterend', stkRowCardsHtml\(c, byRow\[at\] \|\| \[\], shown, redWhy\)\)/);
    const click = strip(BD).slice(strip(BD).indexOf("t.closest('[data-stk-review-all], [data-stk-unreview-all]')"));
    assert.match(click.slice(0, 900), /await stkMarkReviewed\(cur, p, undo\)/);
    for (const k of ['stk_watch_h', 'stk_watch_n_one', 'stk_watch_n_other', 'stk_mark_all', 'stk_all_reviewed'])
      assert.equal((I18N.match(new RegExp('\\n\\s+' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  });
});

describe('f1005 (2) the paper and the panel line up', () => {
  test('the first open glides the paper to the clause (docThreadGoTo), never opens it in place', () => {
    const src = strip(BD);
    assert.match(src, /window\.docThreadGoTo\(c, at\)/);
    assert.doesNotMatch(src, /window\.docThreadOpen\(c, at\)/);
  });
  test('a paint after the paper moved opens the clause at the line; the open row records where the paper stood', () => {
    const paint = strip(fnSrc(CT, 'docThreadPaint'));
    assert.match(paint, /else if\(_docThreadGlide<0&&_docThreadSyncTop>=0\)\{ const sc=thEl\('scroll'\);\s*if\(sc&&Math\.abs\(sc\.scrollTop-_docThreadSyncTop\)>4\) _docThreadOn=docThreadNearest\(rows,docThreadAtLine\(\)\); \}/);
    assert.match(strip(fnSrc(CT, 'docThreadOpen')), /^function docThreadOpen\(c,i,opts\)\{\s*\{ const sc=thEl\('scroll'\); _docThreadSyncTop=sc\?sc\.scrollTop:-1; \}/);
  });
});

describe('f1005 (3) the paper stays white', () => {
  test('no amber wash on the open clause: the class is never set and its rule is gone', () => {
    assert.doesNotMatch(strip(PD), /classList\.add\('pd2-cl-on'\)/);
    assert.doesNotMatch(IX, /\.pd2-cl-on\{/);
  });
});
