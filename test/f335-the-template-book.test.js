/* f335 — THE TEMPLATE BOOK (Young ruled it 19 Sep 2026, off the artifact of
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
const SEC = fs.readFileSync(path.join(__dirname, '..', 'js/section.js'), 'utf8');
const HTML = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
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

/* ═══════════ 1 · A THIRD TAB, AND THE OTHER TWO ARE UNTOUCHED ═════════ */
describe('f335 (1) — the book is a third tab, never a replacement', () => {
  test('three tabs, the book between the overview and the list', () => {
    const s = stage();
    assert.deepEqual(s.TPL_PAGE_TABS, ['overview', 'book', 'list']);
  });

  test('the overview still draws the health reading — the day-before ruling stands', () => {
    /* The owner asked for "how the paper is doing" on 19 Sep and it is there.
       Adding beside it is reversible; taking it away is not. */
    const body = fnBody('renderTemplatesPage');
    assert.match(body, /data-tpl-sec="overview"[^>]*>\$\{tplHealthHtml\(tplHealthData\(\)\)\}/);
    assert.match(body, /data-tpl-sec="book"[^>]*>\$\{tplBookHtml\(ov\)\}/);
  });

  test('and the landing is unchanged — a reader still arrives on the list', () => {
    assert.equal(stage().tplPageTab(), 'list');
  });

  test('all three sections are in the DOM, and only the live one is drawn', () => {
    const s = stage(); s.renderTemplatesPage();
    const html = s.document.getElementById('content').innerHTML;
    for (const k of ['overview', 'book', 'list'])
      assert.ok(html.includes(`data-tpl-sec="${k}"`), `${k} must stay in the DOM`);
    /* the list is the live tab, so the other two carry `hidden` */
    assert.match(html, /data-tpl-sec="overview" hidden/);
    assert.match(html, /data-tpl-sec="book" hidden/);
  });

  test('ONE READING, drawn twice and never counted twice', () => {
    const body = fnBody('renderTemplatesPage');
    assert.match(body, /const ov=tplOverviewData\(\);/);
    assert.equal((body.match(/tplOverviewData\(\)/g) || []).length, 1,
      'the book takes the answer already in hand, never a second walk of the book');
  });
});

/* ═══════════ 2 · ONE CARD BUILDER, TWO SCREENS ═══════════════════════ */
describe('f335 (2) — the clothes follow the builder', () => {
  test('the card has exactly one definition', () => {
    assert.equal((SRC.match(/function tplOvCardHtml\(/g) || []).length, 1);
    assert.ok(!/const cardHtml\s*=/.test(SRC),
      'the closure it was lifted from is gone, not left beside it');
  });

  test('and both screens call it rather than each drawing their own', () => {
    assert.match(fnBody('tplOverviewHtml'), /tplOvCardHtml/);
    assert.match(fnBody('tplBookHtml'), /tplOvCardHtml/);
    /* the markup itself lives in one place: nobody else emits the card's
       own hook */
    assert.equal((SRC.match(/data-tpl-ov-bucket="\$\{/g) || []).length, 1);
  });

  test('the two panels are one builder too', () => {
    assert.equal((SRC.match(/function tplOvPanelsHtml\(/g) || []).length, 1);
    assert.match(fnBody('tplOverviewHtml'), /tplOvPanelsHtml\(d\)/);
    assert.match(fnBody('tplBookHtml'), /tplOvPanelsHtml\(d\)/);
    assert.equal((SRC.match(/id="tpl-ov-attention"/g) || []).length, 1);
    assert.equal((SRC.match(/id="tpl-ov-mostused"/g) || []).length, 1);
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
describe('f335 (3) — the glance, and the caveat under what it qualifies', () => {
  test('three figures, each a label over a value', () => {
    const html = book(stage());
    assert.equal((html.match(/class="tpl-gl"/g) || []).length, 3);
    for (const k of ['lib_bk_have', 'lib_bk_drafted', 'lib_bk_changed'])
      assert.match(fnBody('tplBookHtml'), new RegExp(k));
  });

  test('the caveat sits under the RATE, and nowhere else', () => {
    const html = book(stage());
    const at = html.indexOf('Counted over the');
    assert.ok(at > 0, 'the caveat is drawn');
    const rateAt = html.indexOf('Came back changed');
    assert.ok(rateAt > 0 && rateAt < at, 'and it comes after the figure it qualifies');
    assert.equal((html.match(/Counted over the/g) || []).length, 1, 'said once');
  });

  test('IT IS NOT A BAND, and the sheet cannot make it one', () => {
    /* NO NEW BANDS ON THE PAGE. A strip across the page is an alarm; this is
       a footnote, so it takes no fill, no edge and no full width. */
    const rule = HTML.slice(HTML.indexOf('.tpl-gl-n{'), HTML.indexOf('.tpl-gl-n{') + 200);
    assert.ok(!/background:/.test(rule), 'no fill');
    assert.ok(!/border:/.test(rule), 'no edge');
    assert.match(rule, /max-width:/, 'and it is bounded to a reading width');
  });

  test('nothing checked is NO rate, never a good one', () => {
    const s = stage({ state: { contracts: [], settings: { customTemplates: [] }, view: 'templates' } });
    const html = s.tplBookHtml(s.tplOverviewData());
    assert.match(html, /—/, 'an em-dash for silence, this product’s own');
    assert.match(html, /no rate to report/);
    assert.ok(!/Counted over the/.test(html), 'and no sample sentence over an empty sample');
  });
});

/* ═══════════ 4 · THE SECTION GRAMMAR, BORROWED NOT REBUILT ═══════════ */
describe('f335 (4) — HaTi’s own section grammar, on the owner’s word', () => {
  test('the book composes itself out of sectionHtml', () => {
    const body = fnBody('tplBookHtml');
    assert.equal((body.match(/sectionHtml\(\{/g) || []).length, 3,
      'three named sections, each built by the grammar');
    assert.ok(!/class="sec-box/.test(body),
      'and none of them hand-writes the grammar’s own markup');
  });

  test('every section is NAMED and every one carries a key', () => {
    const body = fnBody('tplBookHtml');
    for (const k of ['tpl.book.library', 'tpl.book.stream', 'tpl.book.wants'])
      assert.ok(body.includes(k), k + ' must be a section key');
    assert.deepEqual(stage().TPL_BOOK_SECS, ['library', 'stream', 'wants']);
  });

  test('RULE 3 — open what is acted on, reference opens shut', () => {
    const body = fnBody('tplBookHtml');
    const streams = body.slice(body.indexOf("tpl.book.stream"));
    assert.match(streams.slice(0, 400), /open: false/,
      'the streams are the same templates cut a second way, so they rest closed');
    const lib = body.slice(body.indexOf('tpl.book.library'), body.indexOf('tpl.book.stream'));
    assert.ok(!/open: false/.test(lib), 'the library is what a reader came for');
  });

  test('RULE 2 — A SHUT GROUP STILL ANSWERS', () => {
    const s = stage();
    const html = s.tplBookHtml(s.tplOverviewData());
    /* the grammar prints a summary only while a foldable section is SHUT, so
       the streams' head is where this has to show */
    assert.match(html, /class="sec-sum">[^<]*stream/i,
      'the shut section names what it holds without being opened');
  });

  test('a worst is only named where the sample earns it', () => {
    /* TPL_DEV_MIN is the attention list's own floor. Without it a stream with
       ONE contract checked and that one changed is announced on the head as
       the worst in the book at 100% — a headline over a sample of one. */
    const body = fnBody('tplBookHtml');
    assert.match(body, /b\.scanned >= TPL_DEV_MIN/);
    const s = stage();
    const d = s.tplOverviewData();
    const thin = d.buckets.filter(b => b.sec === 'stream' && b.rate != null && b.scanned < 3);
    const html = s.tplBookHtml(d);
    for (const t of thin)
      assert.ok(!html.includes('sec-sum">' + s.bucketStreamName(t)),
        s.bucketStreamName(t) + ' has too thin a sample to head the section');
  });

  test('the fold is wired to the grammar’s one listener, with this page’s own painter', () => {
    assert.match(fnBody('renderTemplatesPage'),
      /sectionWire\(document\.querySelector\('\[data-tpl-sec="book"\]'\), tplBookRepaint\)/);
    assert.match(SEC, /function sectionWire\(root, repaint\)/,
      'the grammar does not guess at a painter; the caller hands it one');
  });

  test('AND A FOLD REPAINTS THE BOOK, NEVER THE PAGE', () => {
    /* 19 Sep's own lesson in a second costume: a press that FOLDS may not
       rebuild what the reader is looking at. */
    const body = fnBody('tplBookRepaint');
    assert.match(body, /host\.innerHTML=tplBookHtml/);
    assert.ok(!/renderTemplatesPage/.test(body));
    assert.match(body, /\[data-tpl-sec="book"\]/,
      'the section element itself survives, or sectionWire’s listener goes with it');
  });
});

/* ═══════════ 5 · WHAT WAS DELIBERATELY NOT BUILT ═════════════════════ */
describe('f335 (5) — three absences, each written down', () => {
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
describe('f335 (6) — the book reads and works nothing out', () => {
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
