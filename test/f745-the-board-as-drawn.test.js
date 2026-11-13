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
  w.eval(read('js/components.js'));
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
    /* RE-POINTED 29 Oct 2026 (owner: "the jambo count next to summarise my board disappears"): the cost is said in its hover, not on its face */
    /* RE-POINTED (owner, 8 Nov 2026: "remove all information related to jambo calls"): no cost is said */ 
    assert.doesNotMatch(html, /Jambo call/, 'no cost said, not even on the hover');
    assert.ok(!/hb-bs-cost/.test(html), 'no cost segment on the button');
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
    /* RE-POINTED (owner, 10 Nov 2026: the head greets you and says the latest): what moved and since when ride along */
    assert.match(body, /return `\$\{hbBoardHeadHtml\(time, cut, bs, pack, deskBits, \{ moved, since: base && base\.at \}\)\}\s*\$\{bs\.box\}\s*\$\{hbBookHtml\(d, moved, base && base\.at\)\}\s*\$\{hbPrepHtml\(A, base && base\.at\)\}/);
  });
});

/* RE-POINTED (owner, 10 Nov 2026, off a screenshot: "the saved views to appear on the highlighted area in the jambo
   panel and not on the board"; "like the green underlined links but in blue"; "you should be able to edit the name
   when saving"): the chips left the Board's head; the views are links under Your day in Jambo's panel on Explorer
   (igSavedViewsHtml), and saving opens a name box there. AT THE PARENT 2a, 2c, 2d and section (7) fail. */
describe('f745 (2) saved views are links in Jambo\'s panel on Explorer, never on the Board', () => {
  const V = (name, lenses) => ({ name, recipe: { lenses, groupBy: 'folder', rv: 2 }, at: '2026-10-01' });
  test('2a newest first, each with the map\'s own count; none saved says so; the Board\'s head draws none', () => {
    const { w } = world({ views: [V('Old', []), V('Two of them', [{ id: 'l1', on: true, action: 'filter', label: 'x', ids: ['A', 'B'] }])] });
    const html = w.igSavedViewsHtml();
    const links = [...html.matchAll(/class="ig-sv-a" data-ig-sv="([^"]+)"[^>]*><span class="ig-sv-n">[^<]+<\/span><b>(\d+)<\/b>/g)].map(m => [m[1], Number(m[2])]);
    assert.deepEqual(links, [['Two of them', 2], ['Old', 3]]);
    assert.match(html, /^<div class="ig-sv" id="ig-sv"><div class="ig-sv-hd"><span class="ig-sv-l">Saved views<\/span><button type="button" class="ig-sv-new" data-ig-sv-new>\+ Save this view<\/button>/);
    const none = world().w.igSavedViewsHtml();
    assert.ok(none.includes(BOOKS.en.int_sv_none) && !/ig-sv-a/.test(none), 'an absence is said');
    assert.ok(!/sview|hb-sv-chip|hb-bh-views/.test(w.hbBoardHeadHtml('08:02', '', w.hbBoardSumHtml(), '')), 'no chip in the Board\'s head');
    assert.ok(!/hbSavedViewChipsHtml|hb-sv-chip|data-hb-sview/.test(code(HB)), 'the chips\' builder and press are gone');
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
  test('2c the name is yours when saving: a box filled with the view\'s own name; Save keeps what was typed', () => {
    const IG = code(read('js/views/intelligence.js'));
    const body = IG.slice(IG.indexOf('function igSavedViewsHtml('), IG.indexOf('function igSaveViewDoor('));
    assert.match(body, /<input type="text" id="ig-sv-name" class="ig-sv-in"[^`]*value="\$\{igEsc\(nm\)\}"/, 'the box opens holding igViewName()');
    assert.match(body, /let nm=''; try\{ nm=igViewName\(\); \}/);
    assert.match(body, /const n=igViewSave\(typed\);/, 'the one writer, with the typed name');
    assert.match(body, /igRecipePush\(\); igRecipeSet\(v\.recipe\);/, 'a link lays the view over the map, one step back on Undo');
    assert.match(IG, /<span class="ig-day-src">\$\{igEsc\(i18t\('int_day_src'\)\)\}<\/span>\s*\$\{igSavedViewsHtml\(\)\}/, 'drawn under Your day');
    assert.match(IG, /getElementById\('ig-save'\)\?\.addEventListener\('click',\(\)=>\{ igSaveViewDoor\(\); \}\)/, 'the map\'s Save view is the same door');
  });
  test('2d the links are blue (the steel token) and underlined; "saved views" typed lands on them', () => {
    const CSS = read('index.html');
    assert.match(CSS, /\.ig-sv-a\{[^}]*color:var\(--st-steel-fg\)/);
    assert.match(CSS, /\.ig-sv-n\{[^}]*text-decoration:underline[^}]*text-decoration-color:var\(--st-steel-line\)/);
    const NAV = code(read('js/navmap.js'));
    const door = NAV.slice(NAV.indexOf("if (k === 'savedviews'){"), NAV.indexOf("if (k === 'archived'){"));
    assert.match(door, /caHomeFace\('explorer'\)/); assert.match(door, /querySelector\('#ig-sv'\)/); assert.match(door, /igBriefStart\(\)/);
  });
});

describe('f745 (3) the Board\'s card is all of Needs you (Round A, 22 Oct 2026)', () => {
  test('3a no Needs you card on the Board, its builder gone', () => {
    const { w } = world();
    assert.equal(typeof w.hbNeedsHtml, 'undefined');
    const body = code(HB.slice(HB.indexOf('function hbBoardHtml('), HB.indexOf('function hbSetupLeft(')));
    assert.ok(!/hbNeedsHtml|hb-needs|hb-ny/.test(body));
  });
  /* RE-POINTED 22 Oct 2026 (Round A, the one desk; the owner: "Why don't you just move them to board?" and
     "the card still has to go below the KPIs card"): the card under Your book is ALL of Needs you, drawn by
     the one desk (ndBoardHtml, js/views/counter.js) with the Board's parts (hbNdOpts); it never folds or closes */
  test('3b the card under Your book is the one desk\'s, with no fold, no x and no way back', () => {
    const { w } = world();
    assert.equal(typeof w.hbPrepHtml, 'function');
    const A = { ready: 1, rows: [], done: [] };
    let got = null;
    w.ndBoardHtml = o => { got = o; return '<section class="hb-card nd-card" id="hm-agents"></section>'; };
    w.ndPieces = () => [];
    const html = w.hbPrepHtml(A, null);
    assert.match(html, /^<section class="hb-card nd-card" id="hm-agents">/);
    assert.equal(typeof got.look, 'function', 'a piece opens in place');
    assert.match(got.foot, /data-hb-agents-page/, 'the house\'s door at its foot');
    w.hbS().prep = 'closed';
    assert.match(w.hbPrepHtml(A, null), /id="hm-agents"/, 'nothing closes it');
    assert.ok(!/data-hb-prep/.test(w.hbPrepHtml(A, null) + w.hbBookHtml(w.hbBookData('all'), null, null)), 'no fold, no x, no way back');
  });
  test('3c every door onto Jambo\'s work lands ON the card, through the one lander', () => {
    const { w } = world();
    const landed = []; w.landOn = (t, o) => { landed.push([typeof t, o && o.block]); return Promise.resolve(null); };
    w.setView = () => {};
    w.hbOpenAgent();
    assert.deepEqual(landed, [['function', 'start']]);
    const f = code(HB.slice(HB.indexOf('function hbOpenAgent('), HB.indexOf('function hbWatchFormHtml(')));
    assert.match(f, /document\.getElementById\('hm-agents'\)/);
    assert.match(f, /\[data-nd-agent="\$\{CSS\.escape\(k\)\}"\]/, 'an agent named: its first row');
  });
  /* RE-POINTED (owner, 10 Nov 2026: Home deleted): the Board's own card, through the bar's home door (now the Board) */
  test('3d "needs me" lands on the Board\'s Needs you', () => {
    const { w, pressed } = world();
    const landed = []; w.landOn = (t, o) => { landed.push(t); return Promise.resolve(null); };
    w.hbNeedsOpen();
    assert.deepEqual(pressed, ['counter']);
    assert.deepEqual(landed, ['#hm-agents']);
  });
});

describe('f745 (4) Jambo on the Board', () => {
  /* RE-POINTED 26 Oct 2026 (owner: "Build Jambo's Overview tab The Legora Way", the drawing they picked; "we will
     have an overview tab side panel in each page followed by the jambo tab"): the Board's two bubbles became its
     Overview (jamboOverviewHtml) — one head sentence, the facts Needs you and Your book with their doors, the
     counted time under them, his chips under "Ask me" — and his greeting is the Jambo tab's */
  test('4a the Overview: the head, Needs you counted, the counted time, his chips under "Ask me"', () => {
    const { w } = world({ views: [{ name: 'V', recipe: { lenses: [] } }], need: 7, ready: 2 });
    w.hbCountedAt(true);
    const html = w.hbBoardHelloHtml();
    assert.match(html, /class="jov"/, 'drawn by the one builder');
    assert.ok(!/ai-bub|data-jb-hello/.test(html), 'no bubble, no greeting');
    /* RE-POINTED 13 Nov 2026 (owner picked "Brain welcome"): the head sentence and the facts list gave way to his
       one line, the count under it and the day's three numbers; the counted time is the page head's alone */
    assert.ok(html.includes('<h3 class="hbw-say">I have 2 things ready for you.</h3>'), 'his one line: what he has ready');
    assert.ok(html.includes('<p class="hbw-sub">7 need you in all.</p>'), 'the Counter\'s number under it');
    assert.ok(!/jov-head|jov-fact|data-hb-jb-at/.test(html), 'no head sentence, no facts list, no second counted time');
    const chips = [...html.matchAll(/data-igsug="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(chips, ['value by stream', 'my saved views', 'what needs me'], 'none ending in 90 days: that chip is not offered');
  });
  test('4b the number is the Counter\'s; nothing owed, no chip; no view saved, no views chip', () => {
    const { w } = world({ need: 0 });
    const html = w.hbBoardHelloHtml();
    assert.match(html, /Nothing needs you right now\./);
    assert.ok(!/what needs me/.test(html) && !/my saved views/.test(html));
    const one = world({ need: 1 }).w.hbBoardHelloHtml();
    assert.ok(one.includes('<h3 class="hbw-say">1 thing needs you today.</h3>'), 'RE-POINTED 13 Nov 2026: nothing prepared, the Counter\'s number is his line');
  });
  test('4c "which N end in 90 days?" leads while any do', () => {
    const { w } = world();
    w.state.contracts.push({ id: 'E', name: 'Ending', counterparty: 'P', status: 'Signed', value: 1, folder: 'f1', fields: {}, metadata: { startDate: ago(200) },
      expiry: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); })(), createdAt: ago(200) + 'T09:00:00Z', comments: [], audit: [], signatures: [] });
    assert.match(w.hbBoardHelloHtml(), /data-igsug="which 1 ends in 90 days\?"/);
  });
  test('4d the Board\'s name is never in the panel head (the bar names the page); his chips ride his words, not a row above the box', () => {
    const { w } = world();
    /* RE-POINTED 26 Oct 2026: the Board got its two tabs (owner: a first page with a link to press needs a second
       tab for Jambo) and the "Board" word stayed out (owner, 24 Oct 2026: "the name board which looks like another
       tab but it is nothing behind it"). hbHeadWord still reads the Board; the panel head no longer draws it. */
    assert.equal(w.hbHeadWord(), 'Board');
    w.hbS().face = 'explorer';
    assert.equal(w.hbHeadWord(), '');
    assert.equal(w.hbBoardHelloHtml(), '');
    const IG = read('js/views/intelligence.js');
    assert.doesNotMatch(IG, /hbHeadWord\(\):''; return w\?`<span class="igd-head-w"/, 'the Board word is not drawn in the head');
    assert.match(IG, /&&!\(state\.view==='dashboard'&&typeof window\.hbBoardHelloOn==='function'&&hbBoardHelloOn\(\)\)\?`\s*<div class="px-3\.5 pb-2 shrink-0 flex flex-wrap gap-1\.5" data-ig-chips>/);
    assert.match(read('js/paperdesk.js'), /return \(typeof hbBoardHelloHtml === 'function'\) \? hbBoardHelloHtml\(\) : '';/, 'his tab opens on it on the Board');
  });
  /* RE-POINTED 26 Oct 2026 (the Board's two tabs): behind Overview stands his greeting, not the list, so the tab
     carries no number (the number on a door matches the list behind it); his words and the Needs you card say it */
  test('4e on the Board the Overview tab carries no number', () => {
    const PD = code(read('js/paperdesk.js'));
    assert.doesNotMatch(PD, /const n = !onBoard \? 0 : \(typeof counterNeedsCount === 'function'\) \? counterNeedsCount\(\)/);
  });
});

describe('f745 (5) "my saved views", asked', () => {
  test('5a he lists them with their counts and says where they are, free', () => {
    const { w } = world({ views: [{ name: 'Ending this quarter', recipe: { lenses: [{ id: 'l', on: true, action: 'filter', label: 'x', ids: ['A'] }] } }] });
    const said = w.hbAsk('my saved views');
    assert.match(said, /^You have 1 saved view: “Ending this quarter” 1\. They are links in my panel on Explorer, under Your day; press one to open it on the map\.<div class="hb-cost">/);
    assert.match(world().w.hbAsk('Saved views?'), /^No view is saved yet\./);
  });
  test('5b the words it reads, and the ones it leaves to the map', () => {
    const { w } = world();
    for (const q of ['my saved views', 'saved views', 'show my saved views', 'the saved views?', 'mina sparade vyer']) assert.ok(w.HB_VIEWS_ASK_RE.test(q), q);
    for (const q of ['save this view', 'open view Whole book', 'value by stream']) assert.ok(!w.HB_VIEWS_ASK_RE.test(q), q);
  });
});

describe('f745 (6) the words, in both books', () => {
  const KEYS = ['hb_bh_sub', 'hb_bh_counted', 'hb_bh_counted_plain', 'hb_jb_hello', 'hb_jb_ending_one', 'hb_jb_ending_other', 'hb_jb_by_stream', 'hb_jb_views',
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
      assert.ok(html.startsWith('<section class="hb-card hb-inscard hb-ins-head"><header class="hb-ch"><span class="hb-ct">Today’s insights</span><span class="hb-pill hb-ins-n">' + n + '</span><span class="hb-cs">' + want + '</span><span class="hb-grow"></span><button type="button" class="hb-btn is-sm" data-hb-ins-fold aria-expanded="true">Hide</button></header></section><div class="hb-shelf hb-shelf-cards"'), scope + ': ' + html.slice(0, 360));
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
    /* the head is the Needs you head (owner, 26 Oct 2026): one line, never wrapped, the Board's own padding and 40px floor */
    assert.match(CSS, /\.hb-board \.hb-ins-head>\.hb-ch\{border-bottom:0;padding:10px 12px 10px var\(--s-4\);min-height:40px\}/, 'the head line is padded and floored like the Needs you head');
    assert.match(CSS, /\.hb-board \.hb-ins-head>\.hb-ch \.hb-cs\{flex:1 1 auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis\}/, 'the head\'s line never wraps');
    assert.ok(!/#app-shell \.hb-board \.hb-inscard\{padding:16px\}/.test(CSS), 'no second padding on the head card');
    for (const k of ['hb_ins_sub_moved', 'hb_ins_sub_quiet', 'hb_ins_sub_young']) for (const b of ['en', 'sv']) assert.ok(BOOKS[b][k].replace('{m}', 'September').length <= 40, b + ' ' + k + ' is short enough never to wrap');
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
    /* RE-POINTED 27 Oct 2026 (owner: "give insights the × too"): the headline shares its row with the × that lets it go */
    assert.match(card, /<div class="hb-ins-h"><div class="hb-ins-t">Payment days are above normal<\/div><button type="button" class="hb-ib hb-x hb-ins-x" data-hb-ins="go"[^>]*>[\s\S]*?<\/button><\/div>\s*<button type="button" class="hb-ins-pic"[^>]*><svg class="hb-ip"/);
    assert.ok(!/hb-ins-go/.test(card), 'no "Let it go" at the foot');
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
    /* RE-POINTED 8 Nov 2026 (the owner: "when you press, you get a choice for two options"): the figure's menu, then its own door, before the side list */
    const at = HB.indexOf("if ((el = on('#hb-book .hb-fig-main[data-hb-dig]')) && !el.disabled && (hbFigMenuOpen(el) || hbFigDoor(el.getAttribute('data-hb-dig')))) return;");
    assert.ok(at > 0 && at < HB.indexOf('const sk = hbSheetKeyOf(el)'), 'the figure\'s own door first');
  });
});


/* ═══ (7) THE BOARD IS WHERE YOU LAND, AND ITS HEAD GREETS YOU (owner picked "The Legora Way", 10 Nov 2026) ═══ */
describe('f745 (7) the Board greets you and says the latest', () => {
  const greetWorld = (nd) => { const x = world(); x.w.newLookOn = () => true; x.w.cn2Greet = () => 'Good morning, Maria.';
    x.w.ndRead = () => nd; x.w.ndOnBoard = D => ({ jambo: D.jambo, you: D.you, n: D.jambo.length + D.you.length }); return x.w; };
  const M = (d) => ({ d, added: [], gone: [] });
  /* RE-POINTED 10 Nov 2026 (owner picked "The Legora Way" for the board's brief): the counted sentence left the
     greeting and opens "Your board, in brief" at the card's own size; the greeting goes straight to the pills */
  /* RE-POINTED 11 Nov 2026 (owner: "nothing written … only once you press"; picked "Card Inside" by name): before
     Summarise the brief draws NOTHING; once pressed it stands inside the greeting, right under the buttons */
  /* RE-POINTED AGAIN 11 Nov 2026 (owner: "move the summary back to having its own card like in image 2 but with an exit
     (x) button on the top right … It should also only appear once you have pressed summarize my board"; reverses Card
     Inside): the greeting holds no brief; the brief is its own card under it (hbBoardHtml), with a × (hbBriefShut) */
  test('7a the greeting, then the pills and Live; nothing under them until Summarise; pressed, the brief is its own card with a ×', () => {
    const w = greetWorld({ late: 2, oldest: 36, jambo: [{}, {}, {}], you: [{}] });
    const latest = { moved: { past: M(5), value: M(1000000) }, since: ago(1) };
    const since = w.hbGreetSayHtml(latest.moved, latest.since);
    assert.equal(w.hbBoardSumHtml(since).box, '', 'before Summarise is pressed nothing is written');
    const html = w.hbBoardHeadHtml('08:02', '', w.hbBoardSumHtml(), '', '', latest);
    assert.match(html, /^<section class="hb-card hb-bhead is-greet" id="hb-bhead"><h2 class="hb-bh-t">Good morning, Maria\.<\/h2><div class="hb-note hb-bh-r">/);
    assert.ok(!/hb-gr-say|hb-gr-a|class="hb-why/.test(html), 'nothing under the buttons before the press');
    const box = '<div class="hb-why"><div class="hb-why-h">x</div><p class="hb-why-b hb-why-since" id="hb-gr-say">' + since + '</p></div>';
    const inside = w.hbBoardHeadHtml('08:02', '', { btn: '', box }, '', '', latest);
    assert.ok(!inside.includes('class="hb-why') && inside.endsWith('</div></section>'), 'pressed, the greeting still holds no brief: it is its own card');
    assert.match(code(HB), /<span class="hb-read-src">\$\{_hbE\(i18t\('hb_cx_when', \{ at: kept\.at \}\)\)\}<\/span>\$\{x\}<\/div>/, 'the kept brief carries the × at its head\'s right end');
    assert.match(code(HB), /const x = `<button type="button" class="hb-ib hb-x hb-why-x" data-hb-bs-x /, 'the × is the board\'s own close button');
    assert.match(code(HB), /if \(\(el = on\('\[data-hb-bs-x\]'\)\)\)\{ hbBriefShut\(\); return; \}/, 'pressing it shuts the brief');
    assert.match(read('index.html'), /html\.lg-new #ig-page\[data-hb-side="board"\] #hb-bhead\.is-greet:has\(\+ \.hb-why\)::after\{display:none\}/, 'under the greeting, the Board\'s own gap, as between its cards');
    assert.match(code(HB), /else if \(kept\) box = [^\n]*\n\s*\$\{lead\}<div class="hb-why-b">\$\{who\}/, 'the kept summary carries the counted sentence first, Jambo marked');
    assert.ok(!/is-since/.test(code(HB)), 'no card before the press');
    const say = since;
    assert.match(say, /Since [^:<]+: <button type="button" class="hb-gr-a" data-hb-dig="mv:past">5 more contracts passed their end date<\/button> and <button type="button" class="hb-gr-a" data-hb-dig="mv:value">[^<]+ came under contract<\/button>\./);
    assert.match(say, /<button type="button" class="hb-gr-a is-late" data-hb-gr="all">2 things are late<\/button>, the oldest has waited 36 days and <button type="button" class="hb-gr-a" data-hb-gr="jambo">I prepared 3 for you<\/button>\.$/);
    assert.match(html, /<div class="hb-note hb-bh-r">[\s\S]*data-hb-explorer[\s\S]*<span class="hb-grow"><\/span><span class="hb-bh-day">[^<]+<\/span><span class="hb-live"><i><\/i>Live<\/span><span class="hb-bh-at">· counted 08:02<\/span>/, 'the pills, then the day, Live and when it was counted; .hb-note stays');
    assert.ok(!/hb-bh-s"/.test(html), 'no "your book against six months ago" in the greeting');
  });
  test('7a2 the × lets the brief go: nothing is written until Summarise is pressed again', () => {
    const w = greetWorld({ late: 0, oldest: 0, jambo: [], you: [] });
    const S = w.hbS(); S.why = S.why || {};
    S.why[w.HB_BOARD_KEY] = { day: 'x', sig: 'y', text: 'Your book holds 3.', dropped: 0, at: '11:38', notice: '' };
    w.hbBriefShut();
    assert.equal(w.hbS().why[w.HB_BOARD_KEY], undefined, 'the kept brief is gone');
    assert.equal(w.hbBoardSumHtml('').box, '', 'and nothing is written');
  });
  test('7b a fact at nought is not said; things waiting are never "nothing"; nothing waiting says so', () => {
    const say = (nd, latest) => { const w = greetWorld(nd); return w.hbGreetSayHtml(latest && latest.moved, latest && latest.since).replace(/<[^>]+>/g, ''); };
    assert.equal(say({ late: 0, oldest: 0, jambo: [], you: [{}, {}, {}] }, { moved: { past: M(0), value: M(0) }, since: ago(1) }), '3 wait on you.');
    assert.equal(say({ late: 0, oldest: 0, jambo: [], you: [] }), BOOKS.en.cn2_s_none);
    assert.equal(say({ late: 0, oldest: 0, jambo: [{}], you: [] }), 'I prepared 1 for you.');
    assert.match(say({ late: 1, oldest: 4, jambo: [], you: [] }, { moved: { past: M(1), value: M(-5) }, since: ago(1) }), /^Since [^:]+: 1 more contract passed its end date\. 1 thing is late, the oldest has waited 4 days\.$/);
  });
  test('7c a link in the sentence opens Needs you on its tab; signing in lands on the Board', () => {
    assert.match(code(HB), /if \(\(el = on\('\[data-hb-gr\]'\)\)\)\{ if \(typeof window\.ndOpenBoard === 'function'\) ndOpenBoard\(el\.getAttribute\('data-hb-gr'\)\); return; \}/);
    const CORE = code(read('js/core.js'));
    assert.match(CORE, /const _landBoard=!!\(window\._cnSignedIn && window\.deskShellOn && deskShellOn\(\)\);\s*if\(_landBoard\)\{ state\.view='dashboard'; try\{ if\(typeof window\.hbS==='function'\)\{ hbS\(\)\.face='board';/);
    assert.ok(!/_cnSignedIn && window\.deskShellOn && deskShellOn\(\)\) state\.view='counter'/.test(CORE), 'no longer the Counter');
    assert.match(CORE, /const _place=\(!_landBoard&&window\.placeResume\)\?placeResume\(\):null;/);
  });
  test('7d the words, in both books', () => {
    for (const k of ['hb_gr_since', 'hb_gr_past_one', 'hb_gr_past_other', 'hb_gr_value', 'int_sv_new', 'int_sv_name', 'int_sv_save', 'int_sv_cancel', 'int_sv_none'])
      assert.ok(BOOKS.en[k] && BOOKS.sv[k], k + ' in both books');
  });
});
