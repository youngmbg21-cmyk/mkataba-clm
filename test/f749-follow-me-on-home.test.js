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
   PASS 2 (the checker's review of 18 Oct 2026):
   (6) A PAPER DRAWN WITHOUT CLAUSE SECTIONS — the signing copy beside Before
       you sign — has its headings marked with their clause ids after the
       paint (igPaperClauseMarks, matched IN ORDER against the negotiation's
       baseline, read RAW); the reader's place is the last marked heading at
       or above the centre; the walk finds a marked heading too. A Home paper
       with no clause marks at all keeps the faces as faces: a button there
       would be dead (presenceCanWalk asks for the marks).
   (7) THE WORDS, AS DRAWN: the hover names the clause the colleague is on —
       "Lina Ek is reading clause 11 now. Press to follow: the paper goes
       where Lina reads." — and a press says once what it did: "Following
       Lina Ek: the paper goes to clause 11 and moves when they do. Press the
       face again to stop."; the press that stops says "You stopped following
       Lina Ek." The walk itself stays silent. The clause is read RAW off the
       baseline (never negoClauseList).
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
function stage({ home = true, page = false, up = true, hit = null, marks = true } = {}){
  const rect = (top, h) => ({ top, bottom: top + h, left: 100, right: 900, width: 800, height: h });
  const clauses = [['c1', 120, 100], ['c2', 260, 120], ['c3', 420, 80]].map(([id, top, h]) => ({
    getAttribute: k => (k === 'data-clause' ? id : null), getBoundingClientRect: () => rect(top, h), closest: () => null }));
  clauses.forEach(k => { k.closest = sel => (sel === '[data-clause]' ? k : null); });
  const scroller = { getBoundingClientRect: () => rect(100, 600), querySelectorAll: sel => (sel === '[data-clause]' && marks ? clauses : []),
    querySelector: sel => (marks && /\[data-clause\]/.test(sel) ? clauses[0] : null) };
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
  test('3a2 (pass 2) Home\'s paper up with no clause marks to walk to: no — a button there would be dead', () => {
    assert.equal(stage({ marks: false }).ctx.presenceCanWalk(), false);
    const can = MOD.slice(MOD.indexOf('function presenceCanWalk('), MOD.indexOf('/* ---- THE ROW ----'));
    assert.match(can, /sc\.querySelector\('\[data-clause\], \[data-pz-clause\]'\)/);
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
  /* RE-POINTED (pass 3, LAND ON IT, owner 18 Oct 2026): the clause is brought
     into view and lit by the ONE lander (landOn), never a glow of its own */
  test('4a found: landed on — in view and lit by the one lander, pressing nothing — nothing written', () => {
    const w = home(false);
    const landed = []; w.landOn = (t, o) => { landed.push([t, o]); return Promise.resolve(null); };
    const el = w.igPaperGoClause('cl_7');
    assert.ok(el && el.getAttribute('data-clause') === 'cl_7');
    assert.equal(landed.length, 1);
    assert.equal(landed[0][0], el);
    assert.deepEqual(JSON.parse(JSON.stringify(landed[0][1])), { block: 'center', focus: false });
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
    assert.match(fn, /landOn\(el,\{ block:'center', focus:false \}\)/, 'the one lander');
    assert.ok(!/ig-arrived|igArrive/.test(R('index.html') + fn), 'no glow of its own (STALE: .ig-arrived)');
  });
});

/* ---- PASS 2 ---- */
/* the shape a negotiation stamps its baseline in (negoStampContract) */
const CLAUSE_DOC = '<h1>MASTER SERVICES AGREEMENT</h1><h2 data-clause-id="cl_1">1. Parties</h2><p>a</p><h2 data-clause-id="cl_7">7. Limitation of liability</h2><p>b</p><h2 data-clause-id="cl_11">11. Payment terms</h2><p>c</p>';
/* the test world's sanitiser drops the stamp the app's keeps, so the
   splitter's answer for this baseline is given as the app's splitter gives
   it (the browser check reads the real one) */
const SPLIT = [{ clauseId: 'cl_1', num: '1', title: 'Parties', headingText: '1. Parties' }, { clauseId: 'cl_7', num: '7', title: 'Limitation of liability', headingText: '7. Limitation of liability' },
  { clauseId: 'cl_11', num: '11', title: 'Payment terms', headingText: '11. Payment terms' }];
const splitOf = html => (html === CLAUSE_DOC ? SPLIT.map(k => Object.assign({}, k)) : []);
describe('f749 (6) a paper drawn without clause sections: its headings marked, walked to and read', () => {
  function signing(){
    const w = buildWorld({ intelView: true }).win;
    const d = w.document;
    /* the signing copy's own shape: headings and paragraphs, no ids */
    d.body.insertAdjacentHTML('beforeend', '<div id="ig-paper"><div id="ig-paper-scroll"><article id="ig-canvas"><div class="hati-doc"><h1>MASTER SERVICES AGREEMENT</h1><h2>1. Parties</h2><p>a</p><h2>7.  Limitation of liability</h2><p>b</p><p>7. Limitation of liability</p><h2>11. Payment terms</h2><p>c</p></div></article></div></div>');
    const c = { id: 'MK-1', negotiation: { baselineBody: CLAUSE_DOC } };
    w.clauseSegment = splitOf;
    return { w, d, c };
  }
  test('6a each clause heading takes its clause id, in order; nothing else is marked; the record is untouched', () => {
    const { w, d, c } = signing();
    const before = JSON.stringify(c);
    assert.equal(w.igPaperClauseMarks(c), 3);
    assert.deepEqual([...d.querySelectorAll('[data-pz-clause]')].map(e => e.tagName + ':' + e.getAttribute('data-pz-clause')), ['H2:cl_1', 'H2:cl_7', 'H2:cl_11']);
    assert.equal(JSON.stringify(c), before);
  });
  test('6b the walk finds a marked heading; a paper with the redline\'s sections, or never negotiated, is left alone', () => {
    const { w, c } = signing(); w.igPaperClauseMarks(c);
    const el = w.igPaperGoClause('cl_11');
    assert.ok(el && el.getAttribute('data-pz-clause') === 'cl_11');
    const none = signing(); assert.equal(none.w.igPaperClauseMarks({ id: 'MK-2' }), 0, 'no baseline, nothing to match');
    const red = signing(); red.d.getElementById('ig-canvas').insertAdjacentHTML('beforeend', '<section data-clause="cl_1"></section>');
    assert.equal(red.w.igPaperClauseMarks(red.c), 0, 'the redline paper carries its own sections');
  });
  test('6c read RAW, and marked again once the signing copy is laid out into pages', () => {
    const IG = R('js/views/intelligence.js');
    const fn = IG.slice(IG.indexOf('function igPaperClauseMarks('), IG.indexOf('/* ---- the strip ---- */'));
    assert.match(fn, /c\.negotiation&&c\.negotiation\.baselineBody/);
    assert.ok(!/negoClauseList\(|negoInit\(|persist\(/.test(fn));
    assert.match(R('js/paperdesk.js'), /const fit = \(\) => \{[\s\S]{0,700}igPaperClauseMarks\(c\)/);
    assert.match(IG, /if\(igPaperClauseMarks\(c\)&&homePaper===true&&typeof window\.presencePaint==='function'\)/, 'and the faces drawn again once they can be pressed');
  });
  test('6e laid out into pages while following, the walk goes again (the pages moved every clause); the press walks at once from the last beat', () => {
    assert.match(R('js/paperdesk.js'), /const fit = \(\) => \{[\s\S]{0,700}presenceReWalk\(\)/);
    const fn = MOD.slice(MOD.indexOf('function presenceReWalk('), MOD.indexOf('/* where the walk can work'));
    assert.match(fn, /if \(!_pzFollow \|\| !_pzCid\) return false;[\s\S]*_pzWent = null;\s*return presenceWalk\(rows\);/);
    const press = MOD.slice(MOD.indexOf('function presenceFollow('), MOD.indexOf('function presenceRowOf('));
    assert.match(press, /if \(rows\.some\(r => String\(r\.id\) === _pzFollow\)\) presenceWalk\(rows\);\s*presenceSay\(_pzCid\);/);
  });
  test('6d the reader\'s place on such a paper: the last marked heading at or above the centre', () => {
    const rect = (top, h) => ({ top, bottom: top + h, left: 100, right: 900, width: 800, height: h });
    const heads = [['cl_1', 120], ['cl_7', 350], ['cl_11', 520]].map(([id, top]) => ({ getAttribute: k => (k === 'data-pz-clause' ? id : null), getBoundingClientRect: () => rect(top, 20), closest: () => null }));
    const scroller = { getBoundingClientRect: () => rect(100, 600), querySelectorAll: sel => (sel === '[data-pz-clause]' ? heads : []), querySelector: sel => (/pz-clause/.test(sel) ? heads[0] : null) };
    const document = { hidden: false, getElementById: id => id === 'ig-paper' ? { hidden: false } : id === 'ig-paper-scroll' ? scroller : null, querySelector: () => null, elementFromPoint: () => ({ closest: () => null }), addEventListener: () => {} };
    const ctx = { document, innerHeight: 900, igPaperUp: () => true, igPaperGoClause: () => ({}), setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {} };
    ctx.window = ctx; ctx.addEventListener = () => {};
    vm.createContext(ctx); vm.runInContext(MOD, ctx);
    assert.equal(ctx.presenceSpotNow(), 'cl_7', 'the centre line is at 400: the heading at 350 is the last one above it');
    assert.equal(ctx.presenceCanWalk(), true);
  });
});

describe('f749 (7) the words, as drawn', () => {
  const I18N = R('js/i18n.js');
  const BOOKS = (() => { const en = {}, sv = {};
    for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){ const v = m[2].replace(/\\u201c/g, '\u201c').replace(/\\u201d/g, '\u201d');
      if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v; }
    return { en, sv }; })();
  const fill = (t, v) => String(t).replace(/\{(\w+)\}/g, (m, k) => (v && k in v) ? v[k] : m);
  function talk(spot = 'cl_11'){
    const toasts = [], calls = [];
    const c = { id: 'MK-1', negotiation: { baselineBody: CLAUSE_DOC } };
    const w = buildWorld({}).win;
    const ctx = { document: { hidden: false, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], addEventListener: () => {} },
      innerHeight: 900, i18t: (k, v) => fill(BOOKS.en[k] || k, v), i18tn: (k, n, v) => fill(BOOKS.en[k + (n === 1 ? '_one' : '_other')] || k, Object.assign({ n }, v || {})),
      clauseSegmentFind: (html, id) => splitOf(html).find(k => k.clauseId === id) || null, clauseParseHeading: w.clauseParseHeading,
      getContract: id => (id === c.id ? c : null), toast: (m, k) => toasts.push([m, k]),
      API_MODE: () => true, currentUser: () => ({ id: 'me', name: 'Amina Otieno' }),
      igPaperGoClause: id => { calls.push(id); return {}; },
      setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {}, fetch: () => new Promise(() => {}) };
    ctx.window = ctx; ctx.addEventListener = () => {};
    vm.createContext(ctx); vm.runInContext(MOD, ctx);
    return { ctx, c, toasts, calls, row: { id: 'u2', name: 'Lina Ek', spot } };
  }
  test('7a the hover names where they are reading, by the clause\'s number', () => {
    const { ctx, c, row } = talk();
    assert.equal(ctx.presenceClauseWord(c, 'cl_11'), 'clause 11');
    assert.equal(ctx.presenceFollowWords(row, 'pz_follow', c), 'Lina Ek is reading clause 11 now. Press to follow: the paper goes where Lina reads.');
    assert.equal(ctx.presenceFollowWords(row, 'pz_following', c), 'Lina Ek is reading clause 11 now. Press to stop following.');
    assert.equal(ctx.presenceFollowWords(Object.assign({}, row, { spot: '' }), 'pz_follow', c), 'Lina Ek has this contract open now. Press to follow: the paper goes where Lina reads.');
  });
  test('7b the press says once what it did; the press that stops says so; kind ok', () => {
    const src = MOD.slice(MOD.indexOf('function presenceFollow('), MOD.indexOf('/* ---- AND THE WALK ----'));
    assert.match(src, /presenceFollowSay\(_pzFollow \|\| was, !!_pzFollow\);/);
    const fs2 = MOD.slice(MOD.indexOf('function presenceFollowSay('), MOD.indexOf('/* ---- AND THE WALK ----'));
    assert.match(fs2, /window\.toast\(on \? presenceFollowWords\(r, 'pz_follow_said'\) : i18t\('pz_follow_stopped', \{ who: r\.name \|\| '' \}\), 'ok'\)/);
    const { ctx, c, toasts, row } = talk();
    assert.equal(ctx.presenceFollowWords(row, 'pz_follow_said', c), 'Following Lina Ek: the paper goes to clause 11 and moves when they do. Press the face again to stop.');
    assert.equal(BOOKS.en.pz_follow_stopped, 'You stopped following {who}.');
    assert.equal(toasts.length, 0, 'drawing the words says nothing by itself');
  });
  test('7c the walk itself is silent', () => {
    const walk = MOD.slice(MOD.indexOf('function presenceWalk('), MOD.indexOf('/* where the walk can work'));
    assert.ok(!/toast\(|presenceFollowSay/.test(walk));
  });
  test('7d read RAW, and both books', () => {
    const fn = MOD.slice(MOD.indexOf('function presenceClauseWord('), MOD.indexOf('function presenceFirstName('));
    assert.match(fn, /c\.negotiation && c\.negotiation\.baselineBody/);
    assert.ok(!/negoClauseList\(|negoInit\(|negoClauseNowById\(/.test(fn));
    for (const k of ['pz_follow', 'pz_follow_open', 'pz_following', 'pz_following_open', 'pz_follow_said', 'pz_follow_said_open', 'pz_follow_stopped', 'pz_clause_n', 'pz_clause_named'])
      assert.ok(BOOKS.en[k] && BOOKS.sv[k] && BOOKS.en[k] !== BOOKS.sv[k], k);
  });
});
