'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f749 — FOLLOW ME ON HOME (round 6 of the redesign, "One line", as drawn;
   the owner's "build all the gaps", 18 Oct 2026)
   (1) Home's paper is where a contract is read now, so presence reads it:
       a reader there sends the clause at the centre of Home's paper
       (presenceHomePaper → presenceSpotNow); a centre that falls between two
       clauses, or below the last one a paper cannot scroll past, is the
       nearest clause — never nowhere.
   (2) The walk has ONE door (presenceGo): Home's paper where it is up
       (igPaperGoClause), else the Negotiate page's (rlJumpToClause).
   (3) The faces on the paper's line are buttons where the walk can work
       (presenceCanWalk): the Negotiate page, or Home's paper.
   (4) igPaperGoClause brings the clause up on Home's paper and lights it; it
       moves the page and writes nothing; null where the paper is not up.
   (5) Still one at a time, pressed again it stops, nothing stored (f456's
       own rules, unchanged).
   AT THE PARENT (8dc306a) every test here FAILS: presenceHomePaper,
   presenceGo, presenceCanWalk and igPaperGoClause do not exist; the spot is
   read only off the Negotiate page and the faces on Home are not buttons.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildWorld } = require('./world');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const MOD = R('js/presence.js');

/* a Home paper of clauses laid out top to bottom, and a page with or without the Negotiate page */
function stage({ home = true, page = false, up = true, hit = null } = {}){
  const rect = (top, h) => ({ top, bottom: top + h, left: 100, right: 900, width: 800, height: h });
  const clauses = [['c1', 120, 100], ['c2', 260, 120], ['c3', 420, 80]].map(([id, top, h]) => ({
    getAttribute: k => (k === 'data-clause' ? id : null), getBoundingClientRect: () => rect(top, h), closest: () => null }));
  clauses.forEach(k => { k.closest = sel => (sel === '[data-clause]' ? k : null); });
  const scroller = { getBoundingClientRect: () => rect(100, 600), querySelectorAll: sel => (sel === '[data-clause]' ? clauses : []) };
  const host = { hidden: !home, querySelector: () => null };
  const gap = { closest: () => null };
  const calls = [];
  const document = {
    hidden: false,
    getElementById: id => id === 'ig-paper' ? (home ? host : null) : id === 'ig-paper-scroll' ? (home ? scroller : null) : id === 'view-redline' ? (page ? {} : null) : null,
    querySelector: () => null,
    elementFromPoint: () => (hit ? clauses.find(k => k.getAttribute('data-clause') === hit) : gap),
    addEventListener: () => {},
  };
  const ctx = { document, innerHeight: 900, igPaperUp: () => up,
    igPaperGoClause: id => { calls.push(['home', id]); return { id }; }, rlJumpToClause: id => { calls.push(['page', id]); return { id }; },
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {} };
  ctx.window = ctx; ctx.addEventListener = () => {};
  vm.createContext(ctx); vm.runInContext(MOD, ctx);
  return { ctx, calls };
}

describe('f749 (1) a reader on Home\'s paper says where they are', () => {
  test('1a the clause at the centre of Home\'s paper', () => {
    assert.equal(stage({ hit: 'c2' }).ctx.presenceSpotNow(), 'c2');
  });
  test('1b a centre between clauses, or past the last, is the nearest clause', () => {
    /* the centre line is at 100 + 600/2 = 400: c2 ends at 380, c3 starts at 420 → c2 is nearer */
    assert.equal(stage({ hit: null }).ctx.presenceSpotNow(), 'c2');
  });
  test('1c no paper up, no Home paper drawn: nothing is sent', () => {
    assert.equal(stage({ up: false }).ctx.presenceHomePaper(), null);
    assert.equal(stage({ home: false }).ctx.presenceSpotNow(), null);
  });
  test('1d still asked of the screen, and still no scroll position travels', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceSpotNow'), MOD.indexOf('let _pzFollow'));
    assert.match(fn, /const box = doc \|\| presenceHomePaper\(\) \|\| document\.getElementById\('doc-scroll'\);/);
    assert.match(fn, /elementFromPoint\(x, y\)/);
    assert.ok(!/scrollTop|getSelection/.test(fn));
  });
});

describe('f749 (2) the walk\'s one door', () => {
  test('2a on Home\'s paper the walk goes through igPaperGoClause', () => {
    const { ctx, calls } = stage();
    ctx.presenceGo('c3');
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['home', 'c3']]);
  });
  test('2b on the Negotiate page through rlJumpToClause', () => {
    const { ctx, calls } = stage({ home: false, page: true });
    ctx.presenceGo('c3');
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['page', 'c3']]);
  });
  test('2c presenceWalk moves only when the leader moved, through that door', () => {
    const { ctx, calls } = stage();
    ctx.presenceFollow('u2');
    ctx.presenceWalk([{ id: 'u2', name: 'Lina', spot: 'c1' }]);
    ctx.presenceWalk([{ id: 'u2', name: 'Lina', spot: 'c1' }]);
    ctx.presenceWalk([{ id: 'u2', name: 'Lina', spot: 'c3' }]);
    assert.deepEqual(JSON.parse(JSON.stringify(calls)), [['home', 'c1'], ['home', 'c3']]);
    ctx.presenceFollow('u2');
    assert.equal(ctx.presenceFollowing(), null, 'pressed again, it stops');
    ctx.presenceWalk([{ id: 'u2', name: 'Lina', spot: 'c2' }]);
    assert.equal(calls.length, 2, 'and the page stops moving');
  });
});

describe('f749 (3) the faces are buttons where the walk can work', () => {
  test('3a Home\'s paper up: yes; the Negotiate page: yes; neither: no', () => {
    assert.equal(stage().ctx.presenceCanWalk(), true);
    assert.equal(stage({ home: false, page: true }).ctx.presenceCanWalk(), true);
    assert.equal(stage({ home: false }).ctx.presenceCanWalk(), false);
    assert.equal(stage({ up: false }).ctx.presenceCanWalk(), false);
  });
  test('3b the row asks that one reading', () => {
    assert.match(MOD.slice(MOD.indexOf('const canWalk ='), MOD.indexOf('return `<span class="pz-row"')), /const canWalk = presenceCanWalk\(\);/);
  });
});

describe('f749 (4) igPaperGoClause: the clause up on Home\'s paper, lit', () => {
  function home(hidden){
    const w = buildWorld({ intelView: true }).win;
    const d = w.document;
    d.body.insertAdjacentHTML('beforeend', `<div id="ig-paper"${hidden ? ' hidden' : ''}><div id="ig-paper-scroll"><div id="ig-canvas"><section data-clause="cl_7"><h3>7. Limitation</h3><p>x</p></section></div></div></div>`);
    return w;
  }
  test('4a found: scrolled to and lit, nothing written', () => {
    const w = home(false);
    const el = w.igPaperGoClause('cl_7');
    assert.ok(el && el.classList.contains('ig-arrived'));
    assert.equal(w.document.querySelectorAll('[data-clause="cl_7"]').length, 1);
  });
  test('4b not on the paper, or the paper not up: null', () => {
    assert.equal(home(false).igPaperGoClause('cl_9'), null);
    assert.equal(home(true).igPaperGoClause('cl_7'), null);
    assert.equal(home(false).igPaperGoClause(''), null);
  });
  test('4c it moves the page and nothing else', () => {
    const IG = R('js/views/intelligence.js');
    const fn = IG.slice(IG.indexOf('function igPaperGoClause('), IG.indexOf('/* ---- the strip ---- */'));
    assert.ok(!/persist\(|api\(|intel\.paper\.|renderIntelDock|pdOpen/.test(fn), 'no record, no face, no panel');
    assert.match(R('index.html'), /#ig-paper \[data-clause\]\.ig-arrived\{animation:igArrive/, 'the light, its own keyframes, not the Negotiate page\'s');
  });
});
