'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f740 — THE CONTRACTS WALL, AS DRAWN (round 13 of the redesign, "Wall of
   papers"; the gaps the owner said "build all" to, 18 Oct 2026)
   (1) A press on a paper CHOOSES it; a second press on it OPENS it (igAnalyze,
       the one door); a press on another paper moves the choice; Let go clears
       it. The choice is a sitting's, carried by the refresh pair, never a
       record. Enter opens; the short list's rows still open at once.
   (2) Twelve papers at a time: the foot says "Showing 12 of N" with Show more
       for the next twelve; a new narrowing starts at twelve again; a choice
       the wall no longer draws is let go.
   (3) The count line: at rest the book's number ("48 contracts"), any
       narrowing "k of n"; the order after it ("newest first").
   (4) Both books carry the new words.
   (5) PASS 3 (the checker's differences, 18 Oct 2026): the wall counts in the
       head's unit — an agreement, an amendment counted with it — so "N live",
       "N contracts" and "Showing 12 of N" are one number (the closed among
       them said); twelve AGREEMENTS at a time, an amendment riding with the
       papers round it; the choice lives on the wall that made it: the List
       in front says none, and a press that redraws the place is heard on the
       way down.
   AT THE PARENT (8dc306a) every test here FAILS.
   The browser half: test/chromium/home-held-contract-verify.js (section 1).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const IG = R('js/views/intelligence.js');
const I18N = R('js/i18n.js');
const fnBody = (src, name) => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const lineOf = (src, start) => { const i = src.indexOf(start); if (i < 0) return ''; return src.slice(i, src.indexOf('\n', i) + 1); };
const BOOKS = (() => {
  const en = {}, sv = {};
  /* a value in either quote, the other quote allowed inside it ("Home's") */
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): (?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'),?\s*$/gm)){
    const v = m[2] != null ? m[2] : m[3];
    if (!(m[1] in en)) en[m[1]] = v; else if (!(m[1] in sv)) sv[m[1]] = v;
  }
  return { en, sv };
})();
const WALL_FNS = ['igWallLeadOf', 'igWallCountWords', 'igWallKeyOf', 'igWallShown', 'igWallMoreReset', 'igWallShowMore', 'igWallOrderWords', 'igWallBodyHtml',
  'igWallPlace', 'igWallPlacePut', 'igWallChosenId', 'igWallChosen', 'igWallChosenPaint', 'igWallChoose', 'igWallLetGo', 'igWallOpen', 'igWallPress'];
/* the wall's own functions in a small world: a book, Home's Document face, the
   one door (igAnalyze) and the panel's paint counted, nothing else */
function world(n){
  const book = Array.from({ length: n || 30 }, (_, i) => ({ id: 'MK-' + (i + 1), name: 'Agreement ' + (i + 1) }));
  const ctx = {
    Array, JSON, Math, Number, String, Set, Object,
    state: { reg: { sort: 'updated', dir: -1, stage: 'all' }, view: 'dashboard' },
    intel: { paper: null, dockOpen: true },
    getContract: id => book.find(c => c.id === String(id)) || null,
    i18t: (k, v) => k + (v ? JSON.stringify(v) : ''),
    i18tn: (k, n) => `${k}#${n}`,
    igEsc: s => String(s),
    igWallNeed: () => new Set(),
    igWallCardHtml: c => `<card ${c.id}${ctx.igWallChosenId() === String(c.id) ? ' chosen' : ''}>`,
    igHomePaperFace: () => ctx._face,
    igSyncDockWidth: () => {},
    REG_SORTS: [{ k: 'updated', label: 'Recently updated' }, { k: 'value', label: 'Value (high → low)' }],
    CSS: { escape: s => s },
    document: { querySelector: () => null, querySelectorAll: () => [] },
    opened: [], painted: 0, saved: 0, repainted: 0,
    _face: true,
  };
  ctx.igAnalyze = id => ctx.opened.push(String(id));
  ctx.renderIntelDock = () => { ctx.painted++; };
  ctx.regRepaint = () => { ctx.repainted++; };
  ctx.regPlacePut = () => {};
  ctx.placeSave = () => { ctx.saved++; };
  ctx.window = ctx;
  vm.createContext(ctx);
  const src = [lineOf(IG, 'const IG_WALL_STEP='), lineOf(IG, 'let _igWallMore=0'), 'let _igWallNeed=null;', lineOf(IG, 'let _igChosen=null;'),
    lineOf(IG, 'const IG_WALL_SCROLL_NEAR='), lineOf(IG, 'let _igWallScrollAsked=')]
    .concat(WALL_FNS.map(f => fnBody(IG, f))).concat([fnBody(IG, 'igWallScrollNear')]).join('\n');
  vm.runInContext(src + '\nthis.__peek=()=>({ chosen:_igChosen, more:_igWallMore });', ctx);
  ctx.book = book;
  return ctx;
}

describe('f740 (1) a press chooses, a second opens', () => {
  test('1a every part of the choice is a function on the page', () => {
    for (const f of WALL_FNS) assert.ok(fnBody(IG, f), f + ' is defined');
    assert.match(IG, /const IG_WALL_STEP=12;/);
  });
  test('1b the first press chooses (nothing opens, the panel is drawn again); the second opens it through the one door', () => {
    const w = world();
    w.igWallPress('MK-3');
    assert.equal(w.igWallChosenId(), 'MK-3');
    assert.deepEqual(w.opened, [], 'nothing opened on the first press');
    assert.ok(w.painted >= 1, 'Jambo\'s panel is drawn again to say the contract');
    assert.equal(w.igWallChosen().id, 'MK-3', 'the panel\'s contract');
    w.igWallPress('MK-3');
    assert.deepEqual(w.opened, ['MK-3'], 'the second press opens it');
    assert.equal(w.igWallChosenId(), null, 'and the choice is spent');
  });
  test('1c a press on another paper moves the choice; Let go clears it; Open the paper opens', () => {
    const w = world();
    w.igWallPress('MK-1'); w.igWallPress('MK-2');
    assert.equal(w.igWallChosenId(), 'MK-2'); assert.deepEqual(w.opened, []);
    assert.equal(w.igWallLetGo(), true); assert.equal(w.igWallChosenId(), null);
    assert.equal(w.igWallLetGo(), false, 'nothing to let go');
    w.igWallChoose('MK-5'); w.igWallOpen('MK-5');
    assert.deepEqual(w.opened, ['MK-5']); assert.equal(w.igWallChosenId(), null);
  });
  test('1d the panel says the choice only while the wall it was chosen on is what Home shows', () => {
    const w = world();
    w.igWallChoose('MK-4');
    w._face = false; assert.equal(w.igWallChosen(), null, 'the Board in front');
    w._face = true; w.intel.paper = { id: 'MK-9' }; assert.equal(w.igWallChosen(), null, 'a paper up');
    w.intel.paper = null; assert.equal(w.igWallChosen().id, 'MK-4');
    assert.equal(w.igWallChoose('MK-404'), false, 'a contract the book does not hold is not chosen');
  });
  test('1e a refresh brings the choice and how far the wall was opened back; anything else is nothing', () => {
    const w = world();
    w.igWallChoose('MK-7'); w.igWallShowMore();
    const kept = JSON.parse(JSON.stringify(w.igWallPlace()));
    assert.equal(kept.chosen, 'MK-7'); assert.equal(kept.more, 1);
    const v = world(); v.igWallPlacePut(kept);
    assert.deepEqual(JSON.parse(JSON.stringify(v.__peek())), { chosen: 'MK-7', more: 1 });
    for (const junk of [{ chosen: 7, more: -1 }, { chosen: 'MK-404', more: 'x' }, { chosen: '', more: 1e9 }]){
      v.igWallPlacePut(junk); assert.deepEqual(JSON.parse(JSON.stringify(v.__peek())), { chosen: null, more: 0 }, JSON.stringify(junk));
    }
  });
  test('1f the wall\'s press: a paper chooses first, the short list\'s row opens at once; Enter opens', () => {
    const wire = fnBody(IG, 'igPickWire');
    assert.match(wire, /if\(b\.classList\.contains\('igw-card'\)\)\{ igWallPress\(b\.getAttribute\('data-ig-pick'\)\); return; \}\n\s+igAnalyze\(b\.getAttribute\('data-ig-pick'\)\);/);
    assert.match(wire, /if\(e\.key!=='Enter'\) return;[\s\S]*?igWallOpen\(b\.getAttribute\('data-ig-pick'\)\)/);
    assert.match(wire, /\[data-ig-wall-more\][\s\S]*?igWallShowMore\(\)/);
  });
  test('1g a press elsewhere or Esc lets it go, armed once; a press on a paper or in the panel keeps it', () => {
    const i = IG.indexOf('document._igWallChoiceWired'), seg = IG.slice(i, IG.indexOf('\n}\n', i));
    assert.ok(i > 0, 'armed once at load');
    assert.match(seg, /if\(t\.closest\('#ig-wall \.igw-card, #ig-dock, \[data-ig-wall-more\]/);
    assert.match(seg, /e\.key!=='Escape'\|\|!_igChosen\|\|!igWallChosen\(\)/);
    assert.match(seg, /igWallLetGo\(\);/);
  });
});

describe('f740 (2) twelve papers at a time', () => {
  test('2a twelve drawn, the foot says how many of all, Show more for the next twelve', () => {
    const w = world();
    const html = w.igWallBodyHtml(w.book, { base: w.book });
    assert.equal((html.match(/<card /g) || []).length, 12);
    assert.match(html, /<span class="igw-shown"[^>]*>igw_shown\{"k":12,"n":30\}<\/span><button type="button" class="ui-btn ui-btn-sm" data-ig-wall-more>igw_more<\/button>/);
    w.igWallShowMore(); assert.equal(w.repainted, 1, 'the place is drawn again');
    const h2 = w.igWallBodyHtml(w.book, { base: w.book });
    assert.equal((h2.match(/<card /g) || []).length, 24);
    w.igWallShowMore();
    const h3 = w.igWallBodyHtml(w.book, { base: w.book });
    assert.equal((h3.match(/<card /g) || []).length, 30, 'never more than the list holds');
    assert.match(h3, /igw_shown\{"k":30,"n":30\}<\/span><\/div>/, 'all shown: no Show more');
  });
  test('2b twelve or fewer: no foot at all (nothing is left out)', () => {
    const w = world(12);
    assert.doesNotMatch(w.igWallBodyHtml(w.book, { base: w.book }), /igw-foot|igw-shown/);
  });
  test('2c a new narrowing starts at twelve again', () => {
    const w = world();
    w.igWallBodyHtml(w.book, { base: w.book }); w.igWallShowMore();
    assert.equal((w.igWallBodyHtml(w.book, { base: w.book }).match(/<card /g) || []).length, 24);
    w.state.reg.stage = 'Signed';
    assert.equal((w.igWallBodyHtml(w.book, { base: w.book }).match(/<card /g) || []).length, 12);
  });
  test('2d a choice the wall no longer draws is let go; one it draws is lit', () => {
    const w = world();
    w.igWallChoose('MK-2');
    assert.match(w.igWallBodyHtml(w.book, { base: w.book }), /<card MK-2 chosen>/);
    w.igWallChoose('MK-20');
    w.igWallBodyHtml(w.book, { base: w.book });
    assert.equal(w.igWallChosenId(), null, 'paper 20 is past the first twelve');
  });
  test('2e the chosen paper is lit on the wall and says so to a screen reader', () => {
    const card = fnBody(IG, 'igWallCardHtml');
    assert.match(card, /const chosen=igWallChosenId\(\)===String\(c\.id\);/);
    assert.match(card, /\$\{chosen\?' is-chosen':''\}/);
    assert.match(card, /\$\{chosen\?' aria-current="true"':''\}/);
  });
});

describe('f740 (3) the count line and its order', () => {
  test('3a at rest the book\'s own number; narrowed, k of n; a party\'s shelf still counts as its row', () => {
    const w = world();
    assert.equal(w.igWallCountWords(w.book, { base: w.book }), 'igw_count_all#30');
    assert.equal(w.igWallCountWords(w.book.slice(0, 5), { base: w.book }), 'igw_count{"k":5,"n":30}');
    assert.equal(w.igWallCountWords(w.book.slice(0, 2), { base: w.book.slice(0, 2), only: { ids: ['MK-1', 'MK-2'] } }), 'igw_count{"k":2,"n":2}', 'a set sent here is counted as the door that sent it');
  });
  test('3b the order after it: "newest first" for the book\'s own order, else the Sort box\'s words', () => {
    const w = world();
    assert.equal(w.igWallOrderWords(), 'igw_order_newest');
    w.state.reg.sort = 'value'; assert.equal(w.igWallOrderWords(), 'Value (high → low)');
    assert.match(w.igWallBodyHtml(w.book, { base: w.book, tools: '<sort>' }), /<span class="igw-count"[^>]*>igw_count_all#30<\/span><span class="igw-order">Value \(high → low\)<\/span><sort><\/div>/);
  });
});

describe('f740 (5) pass 3: one number on every door, the choice on its own wall', () => {
  /* a book of 28 agreements and 2 amendments, each amendment beside its agreement, newest first */
  const fam = () => { const b = Array.from({ length: 28 }, (_, i) => ({ id: 'MK-' + (i + 1), name: 'Agreement ' + (i + 1) }));
    b.splice(3, 0, { id: 'MK-3-A1', parentId: 'MK-3' }); b.splice(15, 0, { id: 'MK-14-A1', parentId: 'MK-14' }); return b; };
  /* RE-POINTED (pass 4, round 13 as drawn: "48 contracts  newest first"):
     the line says the agreements and nothing more — no "· N amendments", no
     "· K closed" */
  test('5a at rest the head\'s unit: "28 contracts", and nothing added', () => {
    const w = world(); const b = fam();
    assert.equal(w.igWallCountWords(b, { base: b }), 'igw_count_all#28');
    const c = b.map((x, i) => i === 5 || i === 6 ? { ...x, status: 'Declined' } : x);
    assert.equal(w.igWallCountWords(c, { base: c }), 'igw_count_all#28', 'the closed are among the 28; nothing is added to the line');
    assert.equal(w.igWallCountWords(b.slice(0, 5), { base: b }), 'igw_count{"k":4,"n":28}', 'narrowed: k of n in the same unit');
    assert.equal(w.igWallCountWords(b.slice(0, 5), { base: b.slice(0, 5), only: { ids: [] } }), 'igw_count{"k":5,"n":5}', 'a door\'s set: whole, the number on the door');
  });
  test('5b twelve agreements drawn, an amendment riding with them; the foot counts agreements', () => {
    const w = world(); const b = fam();
    const html = w.igWallBodyHtml(b, { base: b });
    assert.equal((html.match(/<card /g) || []).length, 13, 'twelve agreements and the amendment among them');
    assert.match(html, /<card MK-3-A1>/);
    assert.match(html, /igw_shown\{"k":12,"n":28\}<\/span><button[^>]*data-ig-wall-more>/);
    w.igWallShowMore();
    const h2 = w.igWallBodyHtml(b, { base: b });
    assert.equal((h2.match(/<card /g) || []).length, 26); assert.match(h2, /igw_shown\{"k":24,"n":28\}/);
    w.igWallShowMore();
    assert.match(w.igWallBodyHtml(b, { base: b }), /igw_shown\{"k":28,"n":28\}<\/span><\/div>/, 'all drawn: no Show more');
  });
  test('5c the List in front: the panel says no paper; the press that turned it is heard on the way down', () => {
    const w = world();
    w.igWallChoose('MK-4'); assert.equal(w.igWallChosen().id, 'MK-4');
    w.state.reg.show = 'list'; assert.equal(w.igWallChosen(), null, 'no row is marked on the List, so the panel says none');
    const i = IG.indexOf('document._igWallChoiceWired'), seg = IG.slice(i, IG.indexOf('\n}\n', i));
    assert.match(seg, /igWallLetGo\(\);\n\s+\},true\);/, 'heard on the way down, before the place redraws its own button away');
  });
});

describe('f740 (4) both books', () => {
  test('4a every new word in English and Svenska', () => {
    for (const k of ['igw_count_all_one', 'igw_count_all_other', 'igw_order_newest', 'igw_shown', 'igw_more', 'igw_count_closed_one', 'igw_count_closed_other']){
      assert.ok(BOOKS.en[k], 'en ' + k); assert.ok(BOOKS.sv[k], 'sv ' + k);
    }
    assert.equal(BOOKS.en.igw_shown, 'Showing {k} of {n}');
    assert.equal(BOOKS.en.igw_more, 'Show more');
    assert.equal(BOOKS.en.igw_order_newest, 'newest first');
  });
});

/* ═══════════════════════════════════════════════════════════════════════════
   (6) PASS 4 (the checker's differences, 18 Oct 2026, after main moved on):
   the next papers follow as you scroll (a reader's scroll to the foot asks
   once per paint, the button stays); his tab carries ONE number on Home —
   the Counter's own — beside a chosen paper, a page, its History and the
   wall at rest; the chosen panel's two doors stay whole under Needs you.
   AT THE LANE'S PREVIOUS COMMIT (dfe908f) every test here FAILS.
   ═══════════════════════════════════════════════════════════════════════════ */
const PD = R('js/paperdesk.js');
describe('f740 (6) pass 4: as you scroll, one number, the doors whole', () => {
  test('6a a scroll that reaches the foot brings the next twelve — once per paint; far from it, nothing', () => {
    const w = world();
    assert.ok(fnBody(IG, 'igWallScrollNear'), 'the reading');
    const html = w.igWallBodyHtml(w.book, { base: w.book });
    assert.match(html, /data-ig-wall-more/);
    let top = 900;
    const foot = { getBoundingClientRect: () => ({ top }) };
    w.document = { querySelector: s => (s === '#ig-wall [data-ig-wall-more]' ? foot : null), scrollingElement: null };
    const sc = { contains: () => true, getBoundingClientRect: () => ({ bottom: 700 }) };
    assert.equal(w.igWallScrollNear(sc), false, 'the foot is far below: nothing');
    assert.equal(w.repainted, 0);
    top = 760;
    assert.equal(w.igWallScrollNear(sc), true, 'near the foot: the next twelve');
    assert.equal(w.__peek().more, 1); assert.equal(w.repainted, 1);
    assert.equal(w.igWallScrollNear(sc), false, 'one foot asks once');
    w.igWallBodyHtml(w.book, { base: w.book });
    assert.equal(w.igWallScrollNear(sc), true, 'the next paint\'s foot may ask again');
    /* the wall's own box is the scroller on the desk (the browser check found the box around it never scrolls): heard there too */
    assert.match(IG, /document\.addEventListener\('scroll',e=>\{[^\n]*\n\s+if\(sc&&\(sc\.id==='ig-wall'\|\|\(sc\.querySelector&&sc\.querySelector\('#ig-wall'\)\)\)\) igWallScrollNear\(sc\); \},true\);/, 'a reader\'s scroll, heard on the wall\'s own box and on its way down');
  });
  /* RE-POINTED AT THE INTEGRATION (19 Oct 2026): this pinned the Board at rest
     carrying its own Needs you card's number (hbNeedsCount). Round 17 as drawn
     (lane B2, the owner's yes) took that card off the Board — Needs you lives on
     Home — so the Board at rest carries Home's own number too, as everywhere. */
  test('6b his tab: the Counter\'s own number beside a chosen paper, a page, its History, the wall at rest and the Board at rest', () => {
    const ctx = { Array, Number, String, Object, state: { view: 'dashboard' }, face: 'board', holds: '', contract: null, paper: false,
      counterNeedsCount: () => 16, hbNeedsCount: () => 14 };
    ctx.window = ctx;
    ctx.hbFace = () => ctx.face; ctx.pdHolds = () => ctx.holds; ctx.pdContract = () => ctx.contract; ctx.igHomePaperFace = () => (ctx.face === 'paper' ? true : null);
    vm.createContext(ctx); vm.runInContext(fnBody(PD, 'pdTabCount'), ctx);
    const n = () => { const r = ctx.pdTabCount('copilot', null); return r ? r.n : 0; };
    assert.equal(n(), 16, 'the Board at rest: Home\'s own number (round 17: the card left the Board)');
    ctx.holds = 'card'; assert.equal(n(), 16, 'a page brought up');
    ctx.holds = 'hist'; assert.equal(n(), 16, 'its History');
    ctx.face = 'paper'; ctx.holds = 'chosen'; assert.equal(n(), 16, 'a paper chosen on the wall');
    ctx.holds = ''; assert.equal(n(), 16, 'the wall at rest');
  });
  test('6c the chosen panel\'s two doors hold to its foot, whole, above the ask box', () => {
    assert.match(R('index.html'), /#ig-dock \.pd-ch-acts\{display:flex;flex-wrap:wrap;gap:8px;position:sticky;bottom:0;z-index:1;padding:8px 0 4px;background:var\(--color-surface\)\}/);
  });
});
