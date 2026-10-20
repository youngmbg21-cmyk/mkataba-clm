'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f745 — THE BOARD AS DRAWN (round 17 of the redesign, "Then and now"; the
   owner's "build all the gaps", 18 Oct 2026)
   (1) The Board's head is ONE card (hbBoardHeadHtml): "Board", "your book
       against six months ago", Live · counted <time>, Make a pack where a
       view is kept, and Summarise my board with its cost on the button
       ("1 Jambo call", hbBoardSumHtml) where Jambo can be asked. Its first
       row keeps .hb-note, the line every Board check waits for.
   (2) The saved views are CHIPS in that head, newest first, each with how
       many contracts it shows (igRecipeShown — the map head line's own
       reading, intelActive + igShownOf, never a second count); none saved,
       no row. The old ⋯ menu is gone.
   (3) Needs you LEFT THE BOARD (the owner's yes: it lives on Home, once the
       Counter): the Board draws no Needs you card, its builder is gone, and
       "needs me" lands on Home's Needs you (hbNeedsOpen → deskGoCounter →
       landOn). PASS 3: THE BOARD KEEPS JAMBO'S WORK (the owner's answer (14),
       18 Oct 2026): hbPrepHtml is drawn under Your book, and hbOpenAgent lands
       on it (#hm-agents) through the one lander.
   (4) Jambo on the Board (hbBoardHelloHtml): the book counted at the head's
       own time, every figure a door, the one press that spends; chips
       "which N end in 90 days?" (only while any do) · "value by stream" ·
       "my saved views" (only while one is saved); then "What needs you is on
       Home: N things[, Jambo's work first]." with Home's own number and
       "what needs me". "Board" beside his tab (hbHeadWord).
   (5) "my saved views" asked of him lists them with their counts, free.
   (6) The words, in both books.
   AT THE PARENT (8dc306a) every test here FAILS but 1b, a guard (no key,
   no cost said) that holds there too: none of these builders exist, the
   Board draws the Needs you and work cards, and "needs me" opens the
   Board. The browser half: test/chromium/board-as-drawn-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const I18N = read('js/i18n.js');
const HB = read('js/views/homeboard.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): ["']((?:[^"'\\]|\\.)*)["'],?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

function world({ views = [], need = 3, ready = 0, keyed = true } = {}){
  const w = buildWorld({ intelView: true }).win;
  const mk = (id, status, start, end) => ({ id, name: 'Agreement ' + id, counterparty: 'Party ' + id, status, value: 100000, valueType: 'estimated',
    folder: 'f1', fields: {}, metadata: { startDate: start }, expiry: end || '', createdAt: start + 'T09:00:00Z', comments: [], audit: [], signatures: [] });
  w.state = { contracts: [mk('A', 'Signed', ago(400)), mk('B', 'Under Review', ago(300)), mk('C', 'Draft', ago(30))], settings: {}, view: 'dashboard' };
  w.FOLDERS = { f1: { id: 'f1', name: 'Stream' } };
  w.currentUser = () => ({ id: 'u_f745', name: 'Maria Lind', role: 'admin' });
  w.localStorage.setItem('hati.v1.igViews', JSON.stringify(views));
  w.eval(read('js/views/homeboard.js'));
  const pressed = [];
  w.counterNeedsCount = () => need;
  w.copilotAvailable = () => keyed;
  w.deskGoCounter = () => pressed.push('counter');
  w.hbAgentsData = () => ({ ready, rows: [], done: [] });
  w.hbS().face = 'board';
  return { w, pressed };
}

describe('f745 (1) the Board\'s head is one card', () => {
  test('1a Board, what it is, Live · counted, the summary with its cost', () => {
    const { w } = world();
    const bs = w.hbBoardSumHtml();
    const html = w.hbBoardHeadHtml('08:02', '', bs, '');
    assert.match(html, /^<section class="hb-card hb-bhead" id="hb-bhead"><div class="hb-note hb-bh-r"><h2 class="hb-bh-t">Board<\/h2>/);
    assert.ok(html.includes(`<span class="hb-bh-s">${BOOKS.en.hb_bh_sub}</span>`), 'your book against six months ago');
    assert.match(html, /<span class="hb-live"><i><\/i>Live<\/span><span class="hb-bh-at">· counted 08:02<\/span>/);
    assert.match(html, /class="hb-btn is-sm hb-bs-go"[\s\S]*<span class="hb-bs-cost">1 Jambo call<\/span><\/button>/, 'its cost on the button');
    assert.ok(!/data-hb-pack-dl/.test(html), 'no Make a pack while no view is kept');
    assert.match(w.hbBoardHeadHtml('08:02', 'Juno', bs, '<button type="button" class="hb-btn is-sm" data-hb-pack-dl>Make a pack</button>'), /· counted 08:02 · Juno<\/span>[\s\S]*data-hb-pack-dl/, 'a set is named; a kept view brings Make a pack');
  });
  test('1b no key, no cost said: the button is grey and says why', () => {
    const { w } = world({ keyed: false });
    const b = w.hbBoardSumHtml().btn;
    assert.match(b, / disabled title="/);
    assert.ok(!/hb-bs-cost/.test(b));
  });
  test('1c the Board opens on it; the counted time is the one the greeting reads', () => {
    const body = code(HB.slice(HB.indexOf('function hbBoardHtml('), HB.indexOf('function hbSetupLeft(')));
    assert.match(body, /const time = hbCountedAt\(true\);/);
    assert.match(body, /const pack = s\.panels\.some\(p => p\.kind === 'view'\) \? `<button type="button" class="hb-btn is-sm" data-hb-pack-dl>/);
    /* (deskScr, the Board's Light | Dark, left with dark mode: Chambers, 20 Oct 2026) */
    assert.match(body, /return `\$\{hbBoardHeadHtml\(time, cut, bs, pack, deskBits\)\}\s*\$\{bs\.box\}\s*\$\{hbBookHtml\(d, moved, base && base\.at\)\}\s*\$\{hbPrepHtml\(A, base && base\.at\)\}/);
  });
});

describe('f745 (2) saved views are chips with their counts', () => {
  const V = (name, lenses) => ({ name, recipe: { lenses, groupBy: 'folder', rv: 2 }, at: '2026-10-01' });
  test('2a newest first, each with the map\'s own count; none saved, no row', () => {
    const { w } = world({ views: [V('Old', []), V('Two of them', [{ id: 'l1', on: true, action: 'filter', label: 'x', ids: ['A', 'B'] }])] });
    const html = w.hbSavedViewChipsHtml();
    const chips = [...html.matchAll(/data-hb-sview="([^"]+)"[^>]*><span class="hb-sv-n">[^<]+<\/span><b>(\d+)<\/b>/g)].map(m => [m[1], Number(m[2])]);
    assert.deepEqual(chips, [['Two of them', 2], ['Old', 3]]);
    assert.match(html, /^<div class="hb-bh-views" role="group" aria-label="Saved views"><span class="hb-bh-l">Saved views<\/span>/);
    assert.equal(world().w.hbSavedViewChipsHtml(), '');
  });
  test('2b igRecipeShown is the head line\'s own reading: filter lenses intersect, a highlight or an off lens shows the book', () => {
    const { w } = world();
    const L = (on, action, ids) => ({ id: 'l', on, action, label: 'x', ids });
    assert.equal(w.igRecipeShown({ lenses: [L(true, 'filter', ['A', 'B']), L(true, 'filter', ['B', 'C'])] }), 1);
    assert.equal(w.igRecipeShown({ lenses: [L(true, 'highlight', ['A'])] }), 3, 'the whole book');
    assert.equal(w.igRecipeShown({ lenses: [L(false, 'filter', ['A'])] }), 3);
    assert.equal(w.igRecipeShown(null), 3);
    const IG = code(read('js/views/intelligence.js'));
    assert.match(IG, /const shown=igShownOf\(act\);/, 'the map\'s head line reads the same number');
  });
  test('2c the old menu of views is gone; a chip presses the one door', () => {
    assert.ok(!/function hbSavedViewsHtml\(|views\|board/.test(code(HB)));
    assert.match(code(HB), /if \(\(el = on\('\[data-hb-sview\]'\)\)\)\{ hbOpenSavedView\(el\.getAttribute\('data-hb-sview'\)\); return; \}/);
  });
});

describe('f745 (3) Needs you left the Board; Jambo\'s work stays on it', () => {
  test('3a no Needs you card on the Board, its builder gone', () => {
    const { w } = world();
    assert.equal(typeof w.hbNeedsHtml, 'undefined');
    const body = code(HB.slice(HB.indexOf('function hbBoardHtml('), HB.indexOf('function hbSetupLeft(')));
    assert.ok(!/hbNeedsHtml|hb-needs|hb-ny/.test(body));
  });
  test('3b (pass 3) the Board keeps Jambo\'s work (the owner\'s answer 14): drawn under Your book, with its fold, its x and its way back', () => {
    const { w } = world();
    assert.equal(typeof w.hbPrepHtml, 'function');
    const A = { ready: 1, rows: [{ k: 'late', n: 1, pill: 1, who: 'Naivas', sum: 'Send the certificate', urg: '', tone: 'ruby', items: [] }], done: [] };
    const html = w.hbPrepHtml(A, null);
    assert.match(html, /^<section class="hb-card hb-prep" id="hm-agents">/);
    assert.match(html, /data-hm-agent-row="late"/);
    assert.match(html, /data-hb-prep="closed"/);
    w.hbS().prep = 'closed';
    assert.ok(!/id="hm-agents"/.test(w.hbPrepHtml(A, null)), 'closed, it stands down');
    assert.match(w.hbBookHtml(w.hbBookData('all'), null, null), /data-hb-prep="open"/, 'and Your book\'s head carries the way back');
  });
  test('3c (pass 3) Home\'s "Jambo\'s work" row lands ON the card, lit, through the one lander', () => {
    const { w } = world();
    const landed = []; w.landOn = (t, o) => { landed.push([typeof t, o && o.block]); return Promise.resolve(null); };
    w.setView = () => {};
    w.hbS().prep = 'closed';
    w.hbOpenAgent();
    assert.deepEqual(landed, [['function', 'start']]);
    assert.equal(w.hbS().prep, 'open', 'a closed card opens to be landed on');
    assert.match(code(HB.slice(HB.indexOf('function hbOpenAgent('), HB.indexOf('function hbWatchFormHtml('))), /document\.getElementById\('hm-agents'\)/);
  });
  test('3d "needs me" lands on Home\'s Needs you', () => {
    const { w, pressed } = world();
    const landed = []; w.landOn = (t, o) => { landed.push(t); return Promise.resolve(null); };
    w.hbNeedsOpen();
    assert.deepEqual(pressed, ['counter']);
    assert.deepEqual(landed, ['#cn-needs']);
  });
});

describe('f745 (4) Jambo on the Board', () => {
  test('4a two bubbles: the book, then where the owed work went', () => {
    const { w } = world({ views: [{ name: 'V', recipe: { lenses: [] } }], need: 7, ready: 2 });
    w.hbCountedAt(true);
    const html = w.hbBoardHelloHtml();
    const bubs = [...html.matchAll(/<div class="ai-bub[^"]*">([\s\S]*?)<\/div>(?:<div class="hb-jb-chips">([\s\S]*?)<\/div>)?<\/div><\/div>/g)];
    assert.equal(bubs.length, 2);
    const hello = bubs[0][1].replace(/<[^>]+>/g, '');
    assert.equal(hello, BOOKS.en.hb_jb_hello.replace('{time}', w.hbCountedAt()));
    assert.match(bubs[0][1], /<b>Summarise my board<\/b>/, 'the press named, as drawn');
    const chips = c => [...String(c || '').matchAll(/data-igsug="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(chips(bubs[0][2]), ['value by stream', 'my saved views'], 'none ending in 90 days: that chip is not offered');
    assert.equal(bubs[1][1], 'What needs you is on Home: 7 things, Jambo’s work first.');
    assert.deepEqual(chips(bubs[1][2]), ['what needs me']);
  });
  test('4b the number is the Counter\'s; nothing owed, no chip; no view saved, no views chip', () => {
    const { w } = world({ need: 0 });
    const html = w.hbBoardHelloHtml();
    assert.match(html, /Nothing needs you on Home\./);
    assert.ok(!/what needs me/.test(html) && !/my saved views/.test(html));
    const one = world({ need: 1 }).w.hbBoardHelloHtml();
    assert.match(one, /What needs you is on Home: 1 thing\./);
  });
  test('4c "which N end in 90 days?" leads while any do', () => {
    const { w } = world();
    w.state.contracts.push({ id: 'E', name: 'Ending', counterparty: 'P', status: 'Signed', value: 1, folder: 'f1', fields: {}, metadata: { startDate: ago(200) },
      expiry: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(), createdAt: ago(200) + 'T09:00:00Z', comments: [], audit: [], signatures: [] });
    assert.match(w.hbBoardHelloHtml(), /data-igsug="which 1 ends in 90 days\?"/);
  });
  test('4d "Board" beside his tab on the Board only; his chips ride his words, not a row above the box', () => {
    const { w } = world();
    assert.equal(w.hbHeadWord(), 'Board');
    w.hbS().face = 'explorer';
    assert.equal(w.hbHeadWord(), '');
    assert.equal(w.hbBoardHelloHtml(), '');
    const IG = read('js/views/intelligence.js');
    assert.match(IG, /const w=\(typeof window\.hbHeadWord==='function'\)\?hbHeadWord\(\):''; return w\?`<span class="igd-head-w"/);
    assert.match(IG, /&&!\(state\.view==='dashboard'&&typeof window\.hbBoardHelloOn==='function'&&hbBoardHelloOn\(\)\)\?`\s*<div class="px-3\.5 pb-2 shrink-0 flex flex-wrap gap-1\.5" data-ig-chips>/);
    assert.match(read('js/paperdesk.js'), /return \(typeof hbBoardHelloHtml === 'function'\) \? hbBoardHelloHtml\(\) : '';/, 'his tab opens on it on the Board');
  });
  test('4e his tab carries the Counter\'s number on the Board', () => {
    const PD = code(read('js/paperdesk.js'));
    assert.match(PD, /const n = !onBoard \? 0 : \(typeof counterNeedsCount === 'function'\) \? counterNeedsCount\(\)/);
  });
});

describe('f745 (5) "my saved views", asked', () => {
  test('5a he lists them with their counts and says where they are, free', () => {
    const { w } = world({ views: [{ name: 'Ending this quarter', recipe: { lenses: [{ id: 'l', on: true, action: 'filter', label: 'x', ids: ['A'] }] } }] });
    const said = w.hbAsk('my saved views');
    assert.match(said, /^You have 1 saved view: “Ending this quarter” 1\. Each is a chip in the Board’s head; press one to open it on Explorer\.<div class="hb-cost">/);
    assert.match(world().w.hbAsk('Saved views?'), /^No view is saved yet\./);
  });
  test('5b the words it reads, and the ones it leaves to the map', () => {
    const { w } = world();
    for (const q of ['my saved views', 'saved views', 'show my saved views', 'the saved views?', 'mina sparade vyer']) assert.ok(w.HB_VIEWS_ASK_RE.test(q), q);
    for (const q of ['save this view', 'open view Whole book', 'value by stream']) assert.ok(!w.HB_VIEWS_ASK_RE.test(q), q);
  });
});

describe('f745 (6) the words, in both books', () => {
  const KEYS = ['hb_bh_sub', 'hb_bh_counted', 'hb_bh_counted_plain', 'hb_bs_cost', 'hb_jb_hello', 'hb_jb_ending_one', 'hb_jb_ending_other', 'hb_jb_by_stream', 'hb_jb_views',
    'hb_jb_counter_one', 'hb_jb_counter_other', 'hb_jb_counter_work_one', 'hb_jb_counter_work_other', 'hb_jb_counter_none', 'hb_jb_needs_chip',
    'hb_jb_views_say_one', 'hb_jb_views_say_other', 'hb_jb_views_where', 'hb_jb_views_none',
    /* pass 3: each card's headline and its one sentence */
    'hb_num_words', 'hb_ins_h_pay_up', 'hb_ins_h_pay_down', 'hb_ins_h_pay_flat', 'hb_ins_h_sign_up', 'hb_ins_h_sign_down', 'hb_ins_h_sign_flat',
    'hb_ins_h_rounds_up', 'hb_ins_h_rounds_down', 'hb_ins_h_rounds_flat', 'hb_ins_s_pay_up', 'hb_ins_s_pay_down', 'hb_ins_s_pay_flat',
    'hb_ins_s_sign_up', 'hb_ins_s_sign_down', 'hb_ins_s_sign_flat', 'hb_ins_s_rounds_up', 'hb_ins_s_rounds_down', 'hb_ins_s_rounds_flat',
    'hb_ins_h_ren_now_one', 'hb_ins_h_ren_now_other', 'hb_ins_h_ren_q_one', 'hb_ins_h_ren_q_other', 'hb_ins_s_ren_open_one', 'hb_ins_s_ren_open_other',
    'hb_ins_s_ren_done', 'hb_ins_s_ren_none', 'hb_ins_s_ren_one_open', 'hb_ins_s_ren_one_done'];
  for (const k of KEYS) test(k, () => {
    assert.ok(BOOKS.en[k] && BOOKS.sv[k], k + ' in both books');
    assert.notEqual(BOOKS.en[k], BOOKS.sv[k], k + ' is said in Svenska');
  });
});

/* ═══ PASS 2 (the checker's review of 18 Oct 2026, built to the drawing) ═══
   (7) TODAY'S INSIGHTS: the head is its own slim card — the title, the count,
       "what moved most since <month> · worked out this morning from your
       book" for every reader whose shelf found something (whoever's pictures
       they are; each card says whose on its own chip), no Hide; the pictures
       are their own cards, two to a row, up to four (HB_INS_MAX); an odd last
       card takes the row. Value by counterparty is BARS with each party's
       name and value, the first five and the rest in one row, and one
       sentence under them; a picture of buttons is drawn as spans inside the
       picture's own button.
   (8) YOUR BOOK: the head is the title and its line only (no figure picker);
       today's figures in ink (only Change carries colour); the six-month line
       is a plain line with a dot at its end (no shaded area).
   (9) THE BOARD ENDS WITH ITS INSIGHTS: no dashed box of words under them; a
       brand-new workspace keeps its one door.
   (10) A FIGURE'S DOOR LANDS ON THE LIST BEHIND IT: contract figures open the
       Contracts place narrowed to exactly what they count (regShowOnly);
       Obligations overdue opens the Obligations page on Overdue
       (obwGoFiltered). A picked extra figure keeps the side list.
   PASS 3 (the second review, 18 Oct 2026, and the owner's answers 7 and 14):
       Hide and the figure picker stay; the pill counts the cards; each card
       draws its own picture (hbInsPicHtml) with a headline (hbInsCandidate),
       its axis named and the lit value printed; the doors land (landOn).
   AT THE PARENT every test below FAILS: the head shares its card with Hide
   and the pictures, three across; the picture is blocks; the book's head has
   the picker and its line a shaded area; the dashed box is drawn; every
   figure opens the side list. */
const CSS = read('index.html');
function shelfWorld(scope){
  const { w } = world();
  w.hbS().ins = { scope, day: 'x', list: [] };
  const fake = (shape, title) => ({ shape, id: shape, mine: scope === 'mine', C: { R: { body: '<svg class="hb-svg"><title>t</title><rect data-hb-dig="x"/></svg>' } }, title, say: 'S ' + title, tone: 'warn', rank: '' });
  return { w, I: [fake('pay', 'Payment days are getting longer'), fake('sign', 'Signing got faster')] };
}
describe('f745 (7) Today\'s insights as drawn', () => {
  /* RE-POINTED (pass 3): Hide is back (the owner's answer 7), and the pill
     counts the cards under it, so the number on the head is what is behind it */
  test('7a one slim head for every reader: the count of the cards and "what moved most since …"; Hide folds them', () => {
    for (const scope of ['mine', 'few', 'co']){
      const { w, I } = shelfWorld(scope);
      const html = w.hbInsCardHtml(I);
      const want = BOOKS.en.hb_ins_sub_moved.replace('{m}', w.hbThenWord(true));
      const n = (html.match(/<article class="hb-ins/g) || []).length;
      assert.ok(n >= 2, String(n));
      assert.ok(html.startsWith('<section class="hb-card hb-inscard hb-ins-head"><header class="hb-ch"><span class="hb-ct">Today’s insights</span><span class="hb-pill hb-ins-n">' + n + '</span><span class="hb-cs">' + want + '</span><span class="hb-grow"></span><button type="button" class="hb-edge-b" data-hb-ins-fold aria-expanded="true">Hide</button></header></section><div class="hb-shelf hb-shelf-cards"'), scope + ': ' + html.slice(0, 360));
      assert.equal(n, w.hbShelfCards(I).length, 'the pill is the cards drawn');
      w.hbS().insFold = true;
      const f = w.hbInsCardHtml(I);
      assert.match(f, /hb-ins-head is-folded[\s\S]*<span class="hb-pill hb-ins-n">\d+<\/span>[\s\S]*aria-expanded="false">Show<\/button>/);
      assert.ok(!/<article class="hb-ins/.test(f), 'folded: the pictures are not drawn');
    }
    assert.match(code(HB), /if \(on\('\[data-hb-ins-fold\]'\)\)\{ const st = hbS\(\); st\.insFold = !st\.insFold; hbSave\(\); hbPaintBoard\(\); return; \}/, 'kept for the person');
  });
  test('7b each picture its own card, up to four, two to a row; an odd last card takes the row', () => {
    assert.equal(world().w.HB_INS_MAX, 4);
    assert.match(CSS, /\.hb-board \.hb-shelf\.hb-shelf-cards\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\);gap:12px;/);
    assert.match(CSS, /\.hb-board \.hb-shelf\.hb-shelf-cards>\.hb-ins:last-child:nth-child\(odd\)\{grid-column:1\/-1\}/);
    assert.match(CSS, /\.hb-board \.hb-shelf-cards>\.hb-ins\{background:var\(--hb-card\);border:1px solid/);
    assert.match(CSS, /\.hb-board \.hb-ins-head>\.hb-ch \.hb-cs\{flex:1 1 auto;white-space:normal;overflow:visible;text-overflow:clip;/, 'the head\'s line wraps before it is ever cut (the iPad)');
    const { w, I } = shelfWorld('co');
    const cards = w.hbInsCardHtml(I).match(/<article class="hb-ins/g) || [];
    assert.ok(cards.length >= 2 && cards.length <= 4, String(cards.length));
    assert.match(w.hbInsCardHtml(I), /data-hb-ins="open"[\s\S]*data-hb-ins="keep"[\s\S]*data-hb-read-more[\s\S]*data-hb-ins="go"/, 'Open · Keep · Ask why · Let it go on each');
  });
  test('7c value by counterparty: bars, its old blocks seeded again; the card draws five, value only, the first lit, no rest row', () => {
    const { w } = world();
    assert.deepEqual(JSON.parse(JSON.stringify(w.HB_INS.cp.recipe)), { pic: 'bars', measure: 'value', split: { by: 'counterparty' }, top: 5 });
    const key = w.hbInsKey('cp'); const s = w.hbS(); s.recipe = s.recipe || {};
    s.recipe[key] = w.hbCardClean({ pic: 'blocks', measure: 'value', split: { by: 'counterparty' } });
    w.hbInsRecipeOn('cp');
    assert.equal(s.recipe[key].pic, 'bars', 'a picture seeded under the old drawing is seeded again');
    s.recipe[key] = w.hbCardClean({ pic: 'ring', measure: 'value', split: { by: 'counterparty' } });
    w.hbInsRecipeOn('cp');
    assert.equal(s.recipe[key].pic, 'ring', 'one the reader changed is theirs');
    const rows = ['Fjällmejeriet AB', 'Hemköp Norr', 'Helio Energy AB', 'Brightwater Foods', 'Lund Pack AB', 'Sixth AB'].map((label, i) => ({ label, v: (13 - i) * 1e6, n: 3 }))
      .concat([{ rest: true, label: '8 more groups', v: 4e6, n: 8 }]);
    const html = w.hbInsPicHtml({ shape: 'cp', C: { R: { rows } } });
    const got = [...html.matchAll(/<span class="hb-ip-bn">([^<]+)<\/span><span class="hb-ip-bt"><i class="([^"]*)"[^>]*><\/i><\/span><span class="hb-ip-bv">([^<]+)<\/span>/g)].map(m => [m[1], m[2], m[3]]);
    assert.equal(got.length, 5, 'five rows, the rest not drawn');
    assert.deepEqual(got[0], ['Fjällmejeriet AB', 'is-lit', '13M'], 'the first lit; its value only — no count, no currency');
    assert.ok(got.slice(1).every(r => r[1] === '' && !/·/.test(r[2])), 'the others pale, value only');
    assert.ok(!/8 more groups|<button/.test(html));
    assert.match(CSS, /\.hb-ins-pic \.hb-ip-bt>i\{display:block;height:100%;border-radius:2px;background:var\(--hb-glow\);opacity:\.18\}/);
    assert.match(CSS, /\.hb-ins-pic \.hb-ip-bt>i\.is-lit\{opacity:1\}/);
    const t = w.hbInsThumb({ body: '<div class="hb-chart hb-chart-bars"><button type="button" class="hb-cbar" data-hb-dig="q">A</button><button type="button" disabled>B</button></div>' });
    assert.equal(t, '<div class="hb-chart hb-chart-bars"><span class="hb-cbar">A</span><span>B</span></div>');
    assert.equal(BOOKS.en.hb_ins_s_cp_plain, 'No party holds more than {pct}% of the value: {who} holds the most.');
  });
  /* PASS 3 — EACH CARD'S ANATOMY AS DRAWN: a headline title, the picture with
     its axis named, the lit bar's (or the line's two ends') value printed on
     it, one sentence; no rank chip, no normal band, no Today marker */
  const MONTHS = (w, n, ys) => { const now = w.hbBucketOf(w.hbToday(), 'm'); const out = [];
    for (let i = n; i >= 1; i--){ const b = w.hbBucketMove(now, 'm', -i); out.push({ b, y: ys[n - i], n: 4, k: 4, sofar: false }); }
    out.push({ b: now, y: 1, n: 1, k: 1, sofar: true }); return { cols: out, unit: 'm', nowB: now, m: 'payDays' }; };
  test('7d months: the last six finished months named, pale bars, the lit one in ink with its value', () => {
    const { w } = world();
    const R = MONTHS(w, 8, [30, 31, 30, 32, 33, 36, 40, 45]);
    const html = w.hbInsPicHtml({ shape: 'pay', C: { R } });
    const xs = [...html.matchAll(/class="hb-ip-x">([^<]+)</g)].map(m => m[1]);
    assert.equal(xs.length, 6);
    assert.equal(xs[5], w.hbBucketLabel(R.cols[7].b, 'm', true), 'ends at the last finished month, never the month in progress');
    assert.equal((html.match(/class="hb-ip-bar is-lit"/g) || []).length, 1);
    assert.equal((html.match(/class="hb-ip-bar"/g) || []).length, 5);
    assert.deepEqual([...html.matchAll(/class="hb-ip-val">([^<]+)</g)].map(m => m[1]), ['45 days'], 'the lit bar\'s value, printed over it');
    assert.ok(!/hb-sv-band|hb-sv-today|hb-sv-odd/.test(html), 'no band, no Today marker');
    assert.match(CSS, /\.hb-ins-pic \.hb-ip-bar\{fill:var\(--hb-glow\);fill-opacity:\.14\}/);
    assert.match(CSS, /\.hb-ins-pic \.hb-ip-bar\.is-lit\{fill-opacity:1\}/);
  });
  test('7e quarters: this quarter and the four after it, "Q4 26"; a line for days to sign, its two ends said', () => {
    const { w } = world();
    const now = w.hbBucketOf(w.hbToday(), 'q');
    const q = [now, w.hbBucketNext(now, 'q'), w.hbBucketNext(w.hbBucketNext(now, 'q'), 'q')];
    const R = { unit: 'q', nowB: now, m: 'count', cols: [{ b: q[0], y: 4, n: 4, k: 4 }, { b: q[2], y: 6, n: 6, k: 6 }] };
    const html = w.hbInsPicHtml({ shape: 'ren', C: { R } });
    const xs = [...html.matchAll(/class="hb-ip-x">([^<]+)</g)].map(m => m[1]);
    assert.equal(xs.length, 5);
    assert.equal(xs[0], now.slice(5) + ' ' + now.slice(2, 4));
    assert.deepEqual([...html.matchAll(/class="hb-ip-val">([^<]+)</g)].map(m => m[1]), ['4'], 'this quarter lit while any end in it');
    const L = MONTHS(w, 6, [14, 13, 12, 11, 10, 9]); L.m = 'daysToSign';
    const line = w.hbInsPicHtml({ shape: 'sign', C: { R: L } });
    assert.match(line, /<polyline points="[^"]+" class="hb-ip-line"\/>/);
    assert.equal((line.match(/class="hb-ip-dot"/g) || []).length, 2);
    assert.deepEqual([...line.matchAll(/class="hb-ip-val">([^<]+)</g)].map(m => m[1]), ['14 days', '9 days']);
  });
  test('7f the card: headline, picture, one sentence, the four acts; no rank chip; the why only where your own are measured', () => {
    const { w } = world();
    w.hbS().ins = { scope: 'co', day: 'x', list: [] };
    const R = MONTHS(w, 8, [30, 31, 30, 32, 33, 36, 40, 45]);
    const x = { shape: 'pay', id: 'pay', mine: false, C: { R }, lit: R.cols[7].b, title: 'Payment days are above normal', say: '45 days in Sept · normal 30–33 days', tone: 'warn', rank: 'Highest of 12 months counted' };
    const html = w.hbShelfHtml([x]);
    const card = html.slice(html.indexOf('<article'), html.indexOf('</article>'));
    assert.ok(!/Highest of 12 months|hb-chip/.test(card), 'no rank chip above the headline');
    assert.ok(!/hb-ins-why/.test(card), 'one sentence');
    assert.match(card, /<div class="hb-ins-t">Payment days are above normal<\/div>\s*<button type="button" class="hb-ins-pic"[^>]*><svg class="hb-ip"/);
    assert.match(card, /<div class="hb-ins-f">45 days in Sept · normal 30–33 days<\/div>/);
    w.hbS().ins.scope = 'mine';
    assert.match(w.hbShelfHtml([x]), /hb-ins-why/, 'where yours are measured, the reason it is the company\'s is said');
  });
  test('7g the usual pictures say what they show as a headline, read off the columns they draw', () => {
    const { w } = world();
    const R = MONTHS(w, 8, [30, 31, 30, 32, 33, 36, 40, 45]);
    w.hbInsChart = () => ({ R: Object.assign(R, { trend: { y0: 30, y1: 45, span: 6, unit: 'm' } }), cs: [] });
    const c = w.hbInsCandidate('pay');
    assert.equal(c.title, 'Payment days are getting longer');
    let may = ''; try { may = new Date(R.cols[2].b + '-01T00:00:00').toLocaleDateString(w.langLocale(), { month: 'long' }); } catch (_){ may = R.cols[2].b; }
    assert.equal(c.say, `New contracts give the other side 45 days to pay on average, up from 30 in ${may}.`);
    assert.equal(c.lit, R.cols[7].b);
  });
  test('7h this quarter\'s ends, and the decisions still owed, in words', () => {
    const { w } = world();
    const now = w.hbBucketOf(w.hbToday(), 'q');
    const ends = ['E1', 'E2', 'E3', 'E4'].map(id => ({ id }));
    w.hbDateOf = () => now.slice(0, 4) + '-' + String((Number(now.slice(6)) - 1) * 3 + 2).padStart(2, '0') + '-15';
    w.hbInsChart = () => ({ R: { unit: 'q', nowB: now, m: 'count', cols: [{ b: now, y: 4, n: 4, k: 4 }] }, cs: ends });
    w.hbEndingDecided = ids => (ids.length === 4 ? 2 : 0);
    const c = w.hbInsCandidate('ren');
    assert.equal(c.title, '4 contracts end this quarter');
    assert.equal(c.say, 'Two of the four have no renewal decision filed yet.');
    w.hbEndingDecided = () => 0;
    assert.equal(w.hbInsCandidate('ren').say, 'None of the four has a renewal decision filed yet.');
    w.hbEndingDecided = () => 4;
    assert.equal(w.hbInsCandidate('ren').say, 'All four have a renewal decision filed.');
  });
});
describe('f745 (8) Your book as drawn', () => {
  /* RE-POINTED (pass 3): the figure picker stays on Your book (the owner's answer 7) */
  test('8a the head is the title, its line and the figure picker; today in ink; a plain line with a dot', () => {
    const { w } = world();
    const html = w.hbBookHtml(w.hbBookData('all'), null, null);
    assert.match(html, /<header class="hb-ch"><span class="hb-ct">Your book<\/span><span class="hb-cs">[^<]*<\/span>[\s\S]*<span class="hb-figpick-w"><button type="button" class="hb-ib hb-figs-set" data-hb-figpick aria-haspopup="dialog" aria-expanded="false"/);
    assert.match(HB, /\$\{_hbFigPick \? hbFigPickHtml\(d\.money\) : ''\}<\/span><\/header>/, 'pressed, it opens the picker in place');
    assert.match(w.hbFigPickHtml(true), /^<div class="hb-figpick" role="dialog"/);
    assert.match(code(HB), /if \(on\('\[data-hb-figpick\]'\)\)\{ _hbFigPick = !_hbFigPick; hbPaintBoard\(\); return; \}/, 'pressed again it closes');
    assert.ok(!/hb-spark-a/.test(HB.slice(HB.indexOf('function hbSparkHtml('), HB.indexOf('function hbMoved('))), 'no shaded area');
    assert.match(HB, /<path d="M\$\{e\[0\]\.toFixed\(1\)\} \$\{e\[1\]\.toFixed\(1\)\}h0" class="hb-spark-e"\/>/);
    assert.match(CSS, /\.hb-spark-e\{fill:none;stroke:var\(--hb-glow\);stroke-width:5;stroke-linecap:round;vector-effect:non-scaling-stroke\}/, 'round however the line is stretched');
    assert.match(CSS, /\.hb-board \.hb-book \.hb-tn \.hb-fig \.hb-fig-n\{color:var\(--hb-ink\)\}/, 'today\'s figures in ink');
  });
});
describe('f745 (9) the Board ends with its insights', () => {
  test('9a no box of words under them; a brand-new workspace keeps its one door', () => {
    const { w } = world();
    assert.equal(w.hbEmptyHtml(), '', 'a book with contracts: nothing');
    assert.ok(!/class="hb-empty"/.test(w.hbBoardHtml()) && !w.hbBoardHtml().includes(BOOKS.en.hb_empty));
    w.hbSetupDoorHtml = () => '<button data-hb-setup>Finish</button>';
    w.eval('hbSetupDoorHtml = window.hbSetupDoorHtml');
    assert.match(w.hbEmptyHtml(), /^<div class="hb-grid"><div class="hb-empty is-setup"><button data-hb-setup>/);
  });
});
describe('f745 (10) a figure\'s door lands on the list behind it', () => {
  test('10a contract figures: the Contracts place narrowed to what they count; overdue: the Obligations page on Overdue', () => {
    const { w } = world();
    const went = [];
    w.regShowOnly = (ids, label) => went.push(['reg', ids.slice().sort().join(','), label]);
    w.obwGoFiltered = p => went.push(['obl', p.state]);
    const landed = []; w.landOn = (t, o) => { landed.push([t, o && o.focus]); return Promise.resolve(null); };
    const d = w.hbBookData('all');
    assert.equal(w.hbFigDoor('f:live'), true);
    assert.deepEqual(went[0], ['reg', d.figs.live.ids.slice().sort().join(','), 'Live contracts']);
    assert.equal(w.hbFigDoor('f:overdue'), true);
    assert.deepEqual(went[1], ['obl', 'overdue']);
    /* LAND ON IT (pass 3): on the thing that says what it counts, pressing nothing */
    assert.deepEqual(landed, [['#reg-only-chip', false], ['[data-obw-view="overdue"]', false]]);
    assert.equal(w.hbFigDoor('f:paygap'), false, 'a picked extra figure keeps the side list');
    assert.equal(w.hbFigDoor('st:Draft'), false);
    assert.deepEqual(JSON.parse(JSON.stringify(w.HB_FIG_TO_CONTRACTS)), ['live', 'value', 'ending', 'past']);
  });
  test('10b the press asks it before the side list', () => {
    const at = HB.indexOf("if ((el = on('#hb-book .hb-fig-main[data-hb-dig]')) && !el.disabled && hbFigDoor(el.getAttribute('data-hb-dig'))) return;");
    assert.ok(at > 0 && at < HB.indexOf('const sk = hbSheetKeyOf(el)'), 'the figure\'s own door first');
  });
});
