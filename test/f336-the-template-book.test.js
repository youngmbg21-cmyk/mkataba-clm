/* f336 — THE TEMPLATE BOOK (Young ruled it 19 Sep 2026, off the artifact of
 * that name).
 *
 * The Templates page answered two questions in one tab and neither well. The
 * overview now answers HOW THE PAPER IS DOING (f334 (7), built 19 Sep); this
 * is the other one the old card wall was always really answering — WHAT HAVE
 * WE GOT — and it answers it in the product's own section grammar rather than
 * as eleven cards in one undifferentiated run.
 *
 * WHY IT IS A THIRD TAB AND NOT A REPLACEMENT. The owner asked for "how the
 * paper is doing" the day before and it is there; adding beside it is
 * reversible and taking it away is not. The artifact said as much twice ("in
 * case you want it back as a third tab") and this is that.
 *
 * THE GRAMMAR IS js/section.js, NOT A SECOND COPY OF IT. CLAUDE.md pins that
 * grammar to the contract room's first tab "and nothing else", and says a
 * second screen takes it ONLY on the owner's word — four pages were restyled
 * with it on 16 Sep and reverted the same day for want of that word. This is
 * the word, so the Templates page is the second screen, and what comes with
 * it is the whole rule set rather than the look.
 *
 * AND THREE THINGS IN THE ARTIFACT WERE DELIBERATELY NOT BUILT. Each is
 * pinned below as an ABSENCE, because an absence nobody wrote down is an
 * absence somebody fills in.
 */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_FOLDERS } = require('./dom');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js/views/library.js'), 'utf8');
const I18N = fs.readFileSync(path.join(__dirname, '..', 'js/i18n.js'), 'utf8');
const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const raised = d => [{ action: 'Created', at: ago(d) }];

/* PIN THE REGION, NOT A BOUNDARY THAT HAPPENS TO HOLD — and `async function`
   ends one too, which f213 and f334 have each paid for. */
const fnBody = name => {
  const at = SRC.indexOf('function ' + name + '(');
  if (at < 0) return '';
  const ends = [SRC.indexOf('\nfunction ', at + 1), SRC.indexOf('\nasync function ', at + 1),
    SRC.indexOf('\nconst ', at + 1)].filter(i => i > 0);
  return SRC.slice(at, ends.length ? Math.min(...ends) : SRC.length);
};
/* A CHECK ABOUT CODE MUST NOT READ COMMENTS. */
const noComments = src => src
  .replace(/\/\*[\s\S]*?\*\//g, ' ')
  .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

/* tpl_1 is company paper with four contracts off it — three checked, two of
   those off-standard. Procurement carries enough checked paper to earn a
   "worst" headline; sales carries one, which must never earn one. */
function stage(over = {}) {
  const T = {};
  for (const [id, kind] of Object.entries({ ND: 'NDA', PS: 'Professional Services', LE: 'Lease' }))
    T[id] = { id, kind, name: kind, blurb: kind + ' paper', folder: 'proc', valueType: 'estimated', ic: 'file' };
  const contracts = [
    { id: 'MK-1', name: 'A', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'deviation' }] }, audit: raised(5) },
    { id: 'MK-2', name: 'B', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'ok' }] }, audit: raised(10) },
    { id: 'MK-3', name: 'C', templateId: 'tpl_1', playbook: { verdicts: [{ status: 'missing' }] }, audit: raised(20) },
    { id: 'MK-4', name: 'D', templateId: 'tpl_1', audit: raised(3) },
    { id: 'MK-5', name: 'E', templateRef: 'ct1', audit: raised(1) },
  ];
  /* js/section.js is NOT listed: test/dom.js loads it for every stage by
     construction, and naming it again declares `_secOpen` twice. */
  return loadViews(['js/richdoc.js', 'js/views/reports.js', 'js/playbook.js', 'js/views/library.js'], {
    TEMPLATES: T, FOLDERS: STUB_FOLDERS, folderColor: () => '#2e9f80',
    templateFormat: () => 'plain', isRich: () => false,
    templateAllowedForRole: () => true, canEdit: () => true,
    currentUser: () => ({ name: 'Amina', role: 'admin' }),
    openModal() {}, closeModal() {}, setView() {}, setActiveNav() {},
    DLG_W: { s: '400px', m: '520px', l: '640px', xl: '760px' },
    state: { contracts, settings: { customTemplates: [
      { id: 'ct1', name: 'Naivas Supply Terms', folder: 'sales', at: ago(2), source: 'paste',
        text: 'x'.repeat(400), format: 'plain' } ] }, view: 'templates' },
    tplLibAll: () => ({ canManage: true, loaded: true, list: [
      { id: 'tpl_1', name: 'Wanjiru Standard MSA', status: 'published', publishedVersion: 4,
        category: 'services', contractsCreated: 38, lastUsedAt: ago(1) },
      { id: 'tpl_2', name: 'Warehousing Agreement', status: 'draft', publishedVersion: null,
        category: 'services', contractsCreated: 0 } ] }),
    TPLLIB_CATEGORIES: { services: 'Services' },
    API_MODE: () => false,
    ...over,
  });
}
const book = s => s.tplBookHtml(s.tplOverviewData());

/* ═══════════════ 1 · THE BOOK, AND THE LIST BESIDE IT ════════════════ */
/* RE-POINTED IN PLACE, the same day it was written (Young: *"delete the
   templates overview page"*, option (a) of three). This section pinned THREE
   tabs — overview, book, list — and the overview went within hours, because
   its headline (*Came back changed*) is the first line of the book's own
   glance, and two tabs leading with one number is the fault this product
   keeps paying for.

   WHAT THE SECTION PINS IS UNCHANGED and is the reason it was written: the
   book is a tab BESIDE the list, never a replacement for it, and the landing
   is still the list. What moved is how many tabs sit beside it. */
describe('f336 (1) — the book is a tab beside the list, never a replacement', () => {
  test('two tabs, the book and the list', () => {
    const s = stage();
    assert.deepEqual(s.TPL_PAGE_TABS, ['book', 'list']);
  });

  test('the overview tab is gone, and the health card has no caller', () => {
    const body = fnBody('renderTemplatesPage');
    assert.ok(!/data-tpl-sec="overview"/.test(body));
    assert.ok(!/tplHealthHtml\(/.test(body));
    assert.match(body, /data-tpl-sec="book"[^>]*>\$\{tplBookHtml\(ov\)\}/,
      'the book is what survives, and it is what the owner asked for by name');
  });

  test('and both retired readings are still built — neither was deleted', () => {
    const s = stage();
    assert.equal(typeof s.tplHealthHtml, 'function', 'the health card');
    assert.equal(typeof s.tplHealthData, 'function');
    assert.equal(typeof s.tplOverviewHtml, 'function', 'and the card wall before it');
  });

  /* ---- REVERSED IN PLACE, 20 Sep 2026 ----
     Young: "when you Navigate to the templates page, you should First Land in
     the first tab which in this case its The Book". It read: the landing is
     unchanged — a reader still arrives on the list. The 18 Sep argument that
     set that was about the OVERVIEW tab, which this very file's ruling
     deleted a day later; the book that replaced it carries doors, because
     every card presses tplGoBucket onto the narrowed table. */
  test('and the landing is the FIRST tab — which is the book this file added', () => {
    const s = stage();
    assert.equal(s.tplPageTab(), s.TPL_PAGE_TABS[0], 'the relation, not the word');
    assert.equal(s.tplPageTab(), 'book');
  });

  test('both sections are in the DOM, and only the live one is drawn', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    for (const k of ['book', 'list'])
      assert.ok(html.includes(`data-tpl-sec="${k}"`), `${k} must stay in the DOM`);
    assert.ok(!html.includes('data-tpl-sec="overview"'), 'and the third one is not');
    /* ---- WHICH ONE CARRIES `hidden` IS THE LANDING, AND IT MOVED (20 Sep
       2026) ---- It read: the list is the live tab, so the book carries
       `hidden`. The book is the landing now, so the LIST is the folded one.
       Asked as the RELATION — the live tab is drawn, the other is hidden —
       so this claim cannot drift from tplPageTab() again. */
    const live = s.tplPageTab(), other = s.TPL_PAGE_TABS.find(k => k !== live);
    assert.ok(!new RegExp(`data-tpl-sec="${live}" hidden`).test(html),
      'the tab you land on is drawn');
    assert.match(html, new RegExp(`data-tpl-sec="${other}" hidden`),
      'and the other one is in the DOM, folded');
    assert.equal(live, 'book', 'which on this row means the book is drawn');
  });

  test('ONE READING, taken once and never counted twice', () => {
    const body = fnBody('renderTemplatesPage');
    assert.match(body, /const ov=tplOverviewData\(\);/);
    assert.equal((body.match(/tplOverviewData\(\)/g) || []).length, 1,
      'the book takes the answer already in hand, never a second walk of the book');
  });
});

/* ═══════════ 2 · ONE CARD BUILDER, TWO SCREENS ═══════════════════════ */
describe('f336 (2) — the clothes follow the builder', () => {
  test('the card has exactly one definition', () => {
    assert.equal((SRC.match(/function tplOvCardHtml\(/g) || []).length, 1);
    assert.ok(!/const cardHtml\s*=/.test(SRC),
      'the closure it was lifted from is gone, not left beside it');
  });

  /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the owner's
     "go"; the drawing is the target): the book draws the SAME buckets as the
     rows of one table instead of a wall of cards, and its two small cards
     are its own. What these pinned survives: one population, one name per
     panel, one hook per door. */
  test('the wall still calls the card, and the book draws the same buckets as rows', () => {
    assert.match(fnBody('tplOverviewHtml'), /tplOvCardHtml/);
    assert.match(fnBody('tplBookHtml'), /d\.buckets\.filter\(b => b\.sec === cut/);
    /* the card's hook, and the book row's — two drawings of one door */
    assert.equal((SRC.match(/data-tpl-ov-bucket="\$\{/g) || []).length, 2);
  });

  test('the two panels keep ONE name each, whichever shape draws them', () => {
    assert.equal((SRC.match(/function tplOvPanelsHtml\(/g) || []).length, 1);
    assert.match(fnBody('tplOverviewHtml'), /tplOvPanelsHtml\(d\)/);
    assert.match(fnBody('tplBookHtml'), /TPL_OV_IDS\.used/);
    assert.match(fnBody('tplBookHtml'), /TPL_OV_IDS\.att/);
    assert.equal((SRC.match(/'tpl-ov-attention'/g) || []).length, 1);
    assert.equal((SRC.match(/'tpl-ov-mostused'/g) || []).length, 1);
    assert.equal((SRC.match(/id="tpl-ov-attention"/g) || []).length, 0);
  });

  test('and the rate’s ink is the attention rule’s own threshold, in one place', () => {
    assert.equal((SRC.match(/function tplOvRateInk\(/g) || []).length, 1);
    assert.match(fnBody('tplOvRateInk'), /c\.scanned>=TPL_DEV_MIN&&c\.rate>=0\.5/,
      'a red figure on a card and a row in Needs attention are the same finding');
  });

  test('the wall the book replaces still draws, byte for byte', () => {
    /* tplOverviewHtml is kept whole: it is the wall the first tab used to
       draw and is one line from returning. */
    const s = stage();
    const wall = s.tplOverviewHtml(s.tplOverviewData());
    assert.match(wall, /data-tpl-ov-bucket=/);
    assert.match(wall, /id="tpl-ov-attention"/);
  });
});

/* ═══════════ 3 · THE GLANCE ══════════════════════════════════════════ */
/* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the drawing is
   the target): the three figures are the PAGE's facts and sit in its white
   band over the tabs (tplBookGlanceHtml); the caveat rides on the rate's own
   figure, on its hover, and nowhere else; nothing checked reads "Not checked
   yet", never a rate. */
const glance = s => s.tplBookGlanceHtml(s.tplOverviewData());
describe('f336 (3) — the glance, and the caveat on what it qualifies', () => {
  test('three figures, each a label over a value', () => {
    const html = glance(stage());
    assert.equal((html.match(/class="tpl-gl"/g) || []).length, 3);
    for (const k of ['lib_bk_have', 'lib_bk_drafted', 'lib_bk_changed'])
      assert.match(fnBody('tplBookGlanceHtml'), new RegExp(k));
    assert.match(fnBody('renderTemplatesPage'), /tplBookGlanceHtml\(ov\)/, 'drawn once, in the page band');
  });

  test('the caveat sits on the RATE, and nowhere else', () => {
    const html = glance(stage());
    assert.equal((html.match(/Counted over the/g) || []).length, 1, 'said once');
    const fig = html.slice(html.lastIndexOf('<div class="tpl-gl"', html.indexOf('Counted over the')));
    assert.match(fig, /Came back changed/, 'on the rate\'s own figure');
  });

  test('IT IS NOT A BAND: no sentence is printed under the figures', () => {
    assert.ok(!/class="tpl-gl-n"/.test(glance(stage())));
  });

  test('nothing checked is NO rate, never a good one', () => {
    const s = stage({ state: { contracts: [], settings: { customTemplates: [] }, view: 'templates' } });
    const html = s.tplBookGlanceHtml(s.tplOverviewData());
    assert.match(html, /Not checked yet/);
    assert.match(html, /no rate to report/, 'its hover says why');
    assert.ok(!/\d+%/.test(html), 'and no percentage over an empty sample');
  });
});

/* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2): the section
   grammar left this tab (the 19 Sep owner word put it here; the drawing takes
   it out — js/section.js is untouched and still the Overview's). The book is
   ONE table of shelves with a Shelves | Value streams switch, each row a door
   onto the list, and the switch repaints the book, never the page. */
describe('f336 (4) — the shelves are a table, each row a door', () => {
  test('the book is one table, cut two ways by a switch', () => {
    const s = stage();
    const html = book(s);
    assert.match(html, /class="tpl-bk-table"/);
    assert.match(html, /data-tpl-book-cut="library"/);
    assert.match(html, /data-tpl-book-cut="stream"/);
    assert.deepEqual(s.TPL_BOOK_SECS, ['library', 'stream', 'wants']);
  });

  test('every shelf is a row and a door; an empty one says "none yet"', () => {
    const s = stage();
    const html = book(s);
    for (const k of ['company', 'cp', 'builtin', 'sample'])
      assert.ok(html.includes(`data-tpl-ov-bucket="${k}"`), k + ' is a row');
    assert.ok(!html.includes('data-tpl-ov-bucket="all"'), 'the whole book is the band\'s figure, not a shelf');
    const bare = stage({ tplLibAll: () => ({ canManage: true, loaded: true, list: [] }) });
    assert.match(book(bare), /none yet/, 'a shelf with nothing on it says so');
  });

  test('the switch and the rows are wired by the book\'s own wiring', () => {
    assert.match(fnBody('renderTemplatesPage'), /tplBookWire\(document\.querySelector\('\[data-tpl-sec="book"\]'\)\)/);
    assert.match(fnBody('tplBookWire'), /tplGoBucket/);
    assert.match(fnBody('tplBookWire'), /_tplBookCut=/);
  });

  test('AND A SWITCH REPAINTS THE BOOK, NEVER THE PAGE', () => {
    const body = fnBody('tplBookRepaint');
    assert.match(body, /host\.innerHTML=tplBookHtml/);
    assert.ok(!/renderTemplatesPage/.test(body));
    assert.match(body, /\[data-tpl-sec="book"\]/);
  });
});

/* ═══════════ 5 · WHAT WAS DELIBERATELY NOT BUILT ═════════════════════ */
describe('f336 (5) — three absences, each written down', () => {
  test('NO DRAWER on pressing a card — a second door onto an act that has one', () => {
    const body = noComments(fnBody('tplBookHtml') + fnBody('tplOvCardHtml'));
    for (const name of ['openSidePanel', 'drawer', 'openModal'])
      assert.ok(!body.includes(name), `the book must not open a ${name}`);
    /* the card's own door is the one it always had */
    assert.match(fnBody('tplOvCardHtml'), /data-tpl-ov-bucket=/);
  });

  test('NO BADGE on a library card — the section above already says which library', () => {
    const body = fnBody('tplOvCardHtml');
    assert.ok(!/tpl-ov-badge/.test(body),
      'the card is named "Company standard" and sits under "Your library": a badge is that fact a third time');
  });

  test('NO META LINE — the 29 Aug note still holds', () => {
    const body = fnBody('tplOvCardHtml');
    assert.equal((body.match(/tpl-ov-name/g) || []).length, 1);
    assert.ok(!/tpl-ov-meta/.test(body));
  });

  test('and the reasons are written beside the code, not only here', () => {
    const body = fnBody('tplBookHtml');
    assert.match(SRC.slice(0, SRC.indexOf('function tplBookHtml')) + body,
      /NOT BUILT|deliberately/i, 'an absence nobody wrote down is an absence somebody fills in');
  });
});

/* ═══════════ 6 · COUNTING IS NOT DRAWING, AND THE WORDS ═════════════ */
describe('f336 (6) — the book reads and works nothing out', () => {
  test('it borrows every figure and computes no population of its own', () => {
    const body = noComments(fnBody('tplBookHtml'));
    for (const name of ['tplPageRows(', 'templateUsage(', 'builtinUsageRows(', 'deviationSummary(', 'state.contracts'])
      assert.ok(!body.includes(name), `tplBookHtml must not reach for ${name}`);
  });

  test('no route, no model, no spend', () => {
    const body = noComments(fnBody('tplBookHtml') + fnBody('tplBookRepaint')).toLowerCase();
    for (const name of ['api(', 'fetch(', '/api/', 'anthropic', 'copilot'])
      assert.ok(!body.includes(name), `the book must not reach for ${name}`);
  });

  test('READING MUST NOT WRITE — proved by running it', () => {
    const s = stage();
    const before = JSON.stringify(s.state.contracts);
    s.tplBookHtml(s.tplOverviewData());
    s.tplBookHtml(s.tplOverviewData());
    assert.equal(JSON.stringify(s.state.contracts), before);
  });

  test('every key it prints is in both books', () => {
    const keys = [...new Set((I18N.match(/\blib_bk_[a-z_]+(?=:)/g) || []))].concat(['lib_tab_book']);
    assert.ok(keys.length >= 14, 'the book brought a real vocabulary');
    for (const k of keys)
      assert.equal((I18N.match(new RegExp('\\b' + k + ':', 'g')) || []).length, 2,
        k + ' must be in both books');
  });

  test('a plural under a figure that can be 1 is a real plural', () => {
    for (const k of ['lib_bk_u_tpl', 'lib_bk_streams_plain', 'lib_bk_wants_sum'])
      assert.ok(I18N.includes(k + '_one:') && I18N.includes(k + '_other:'), k);
  });
});
