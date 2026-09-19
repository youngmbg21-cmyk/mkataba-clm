/* ============================================================
   f338 — FOUR OFF FOUR SCREENSHOTS (Young, 19 Sep 2026)
   ============================================================
   *"The highlighted selections are selected categories but the highlight is
   so faint you can barely notice it. shade should be darker and the words in
   white when selected. delete the templates overview page. insights should
   come after obligations. Exposure page is very bland and does not highlight
   where your eyes should focus on."*

   WHAT IS PINNED HERE AND WHAT IS NOT. Three of the four are about PAINTED
   PIXELS and are measured in four-off-the-screenshots-verify — a cascade
   fight, a nav's painted order and "where your eyes should focus" cannot be
   read out of a source file, and this codebase has paid for that lesson in
   every costume there is. What lives here is the half a browser cannot show:
   that the wall a reading rests on is still there, that a retired reading was
   KEPT rather than deleted, that the fx-missing rule still counts what it
   leaves out, and that this was a presentation pass and not an arithmetic
   one.

   THE ONE ARITHMETIC CHANGE IS AN ORDERING, and section 4 is the wall that
   says so: the same contracts, the same ids, the same sums, in a new order.

   THE DEPARTURE FROM THE WORK ORDER IS STATED IN 4g and is deliberate: the
   order asked for a ruby bar above a threshold and an amber one below it,
   and THERE IS NO SUCH THRESHOLD IN THIS PRODUCT. Inventing one would be the
   score this page exists to refuse, coming back through a side door.

   22 OF 36 ARE RED AT THE PARENT. The fourteen that pass there are NAMED
   WALLS, and every one of them is a thing this change must not have moved:
   section 7 entire (the same ids, the same sums, still no score, and the
   renderer still computing nothing); 1e (a resting rail row); 2c and 2e (the
   retired readings are still built, the landing is still the table); 3b–3e
   (Templates still leads, the badge is still inside its door, every door
   keeps its data-view, the svg rules still name the attribute); 4d (the sort
   is stable); 5b and 5c (the unread door survives, and its reading did not
   move by a field). */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const HTML = R('index.html');
const LIB = R('js/views/library.js');
const INTEL = R('js/views/intelligence.js');
const I18N = R('js/i18n.js');
/* Comments stripped: a claim that matches its own note is a description. */
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const INTEL_C = code(INTEL);

/* ═════════════ 1 · A SELECTED ROW IS DARK, WITH WHITE WORDS ═════════════ */
describe('f338 (1) — the lit filter row, and the rule that used to undo it', () => {
  test('1a the lit row takes the filled accent and white words', () => {
    assert.match(HTML, /\.tpl-rail\.on,\.tpl-rail\.on:hover\{background:var\(--accent-fill\);color:#fff/,
      'one declaration, and hover may not undo it');
  });
  test('1b the pale mint is DEMOTED to hover — it is what the fault was', () => {
    assert.match(HTML, /\.tpl-rail:hover\{background:var\(--color-accent-100\)/);
    assert.ok(!/\.tpl-rail\.on\{background:var\(--color-accent-100\)/.test(HTML),
      'rgb(204,251,241) on white is the shade the owner could barely notice');
  });
  test('1c the count goes white WITH its label — one row, one state', () => {
    assert.match(HTML, /\.tpl-rail\.on \.tpl-rail-n\{color:#fff/);
  });
  /* THE FAULT WAS A CASCADE FIGHT AND NOT A MISSING RULE. `.tpl-rail.on` set
     a background all along; `.tpl-rail-s.on` — the value-stream rows' own —
     set `color:var(--color-neutral-700)` at the SAME weight and later in the
     sheet, so the words stayed dark and the fill was the only signal. */
  test('1d and the rule that put the ink back to neutral is GONE', () => {
    assert.ok(!/\.tpl-rail-s\.on\{color:var\(--color-neutral-700\)/.test(HTML),
      'two rules at (0,2,0) — the second one won, and it undid the first');
  });
  test('1e a resting row is still transparent — nothing else on the rail moved', () => {
    const rule = (HTML.match(/\.tpl-rail\{[^}]*\}/) || [''])[0];
    assert.ok(!/background:(?!\s*(none|transparent))/.test(rule),
      'the base rail rule states no fill: ' + rule);
  });
});

/* ═════════════ 2 · THE TEMPLATES OVERVIEW TAB IS GONE ══════════════════ */
describe('f338 (2) — option (a): the tab goes, the reading is kept', () => {
  test('2a two tabs, and the overview is not one of them', () => {
    assert.match(LIB, /const TPL_PAGE_TABS=\['book','list'\];/);
  });
  test('2b nothing on the page draws the health card any more', () => {
    const body = LIB.slice(LIB.indexOf('function renderTemplatesPage'));
    assert.ok(!/data-tpl-sec="overview"/.test(body));
    assert.ok(!/data-tpl-tab="overview"/.test(body));
    assert.ok(!/tplHealthHtml\(/.test(body));
  });
  /* EVERY READING DELETED OUTRIGHT IN THIS CODEBASE IS A READING SOMEBODY
     REBUILDS FROM SCRATCH A MONTH LATER, WORSE. Both retired ones are kept
     whole and published, the way tplOverviewHtml has been since 19 Sep. */
  test('2c BOTH retired readings are still built and still published', () => {
    for (const n of ['tplHealthData', 'tplHealthHtml', 'tplOverviewHtml'])
      assert.match(LIB, new RegExp('function ' + n + '\\('), n + ' was deleted');
    assert.match(LIB, /tplHealthData,tplHealthHtml,/);
    assert.match(LIB, /tplOverviewHtml,/);
  });
  test('2d and the source SAYS why an unreferenced reading was kept', () => {
    assert.match(LIB, /AND IT HAS NO CALLER SINCE 19 SEP 2026/);
  });
  test('2e the landing is unchanged — a reader still arrives on the table', () => {
    assert.match(LIB, /function tplPageTab\(\)\{ return TPL_PAGE_TABS\.includes\(_tplPageTab\)\?_tplPageTab:'list'; \}/);
  });
  /* A KEY IS RETIRED BY NOT CALLING IT, never by taking it out of one book:
     a key removed from one dictionary and not the other leaves a screen
     half-English. */
  test('2f lib_tab_overview is inert on the face and live in BOTH books', () => {
    assert.ok(!/i18t\('lib_tab_overview'\)/.test(LIB), 'no caller');
    assert.equal((I18N.match(/\n\s*lib_tab_overview:/g) || []).length, 2);
  });
});

/* ═════════════ 3 · INSIGHTS COMES AFTER OBLIGATIONS ════════════════════ */
describe('f338 (3) — markup order, and nothing else', () => {
  const nav = HTML.slice(HTML.indexOf('data-view="dashboard"'), HTML.indexOf('data-view="directory"'));
  const at = v => nav.indexOf('data-view="' + v + '"');
  test('3a Insights sits after Obligations and before Requests', () => {
    assert.ok(at('obligations') > 0 && at('intel') > at('obligations'),
      'Insights leads Obligations in the markup');
    assert.ok(at('intake') > at('intel'), 'and Requests still follows it');
  });
  test('3b Templates still leads Obligations — the everyday run is unbroken', () => {
    assert.ok(at('templates') > 0 && at('templates') < at('obligations'));
  });
  /* THE BADGE TRAVELS INSIDE THE BLOCK. `#nav-intel-new` is markup inside the
     Insights button, so moving the button moves it — asserted rather than
     assumed, because a badge left behind would sit on whatever door happened
     to be there. */
  test('3c the "New" badge is inside the Insights door it moved with', () => {
    const btn = nav.slice(at('intel'), nav.indexOf('</button>', at('intel')));
    assert.match(btn, /id="nav-intel-new"/);
  });
  /* IT IS ORDER AND NOTHING ELSE. Every door keeps its own data-view, so the
     handler, the route, the state and the count are untouched; and the four
     svg colour rules are keyed on the ATTRIBUTE rather than on a position, so
     they follow the block wherever it is written. */
  test('3d every door still carries its own data-view — no handler moved', () => {
    for (const v of ['dashboard', 'register', 'redline', 'calendar', 'templates',
      'obligations', 'intel', 'intake'])
      assert.ok(at(v) >= 0, v + ' lost its door');
  });
  test('3e the svg rules name the attribute, never a position', () => {
    assert.match(HTML, /\.nav-item\[data-view="intel"\] svg\{/);
    assert.ok(!/nav-item:nth-child\(\d\) svg/.test(HTML),
      'a rule keyed on place would dress whatever moved into it');
  });
  test('3f and the move is recorded where the markup is', () => {
    assert.match(HTML, /INSIGHTS SITS AFTER OBLIGATIONS \(owner-asked 19 Sep 2026/);
    assert.match(HTML, /THIS IS MARKUP ORDER AND NOTHING ELSE/);
  });
});

/* ═════════════ 4 · THE EXPOSURE PAGE SAYS WHERE TO LOOK ════════════════ */
const C = (id, value, meta, extra) => Object.assign({
  id, name: id, counterparty: 'Co ' + id, status: 'Executed', value,
  folder: 'proc', metadata: Object.assign({ currency: 'KES' }, meta || {}),
  obligations: [], audit: [], comments: [], signatures: [], fields: {},
}, extra || {});
function world(cs) {
  const w = buildWorld({ intelView: true, homeView: true });
  w.win.state = Object.assign(w.win.state || {}, { contracts: cs });
  return w.win;
}
/* THE BOOK IS BUILT TO DEFEAT THE KINDS' OWN ORDER, in both directions:
   EXPOSURE_KINDS runs liability · price · indemnity · autorenew · lockin, so
   the SMALLEST exposure here is written first, the LARGEST third, and a ZERO
   one (price) is written SECOND — above two rows that are not. Ranked by
   nothing, this book draws a zero in the middle of the table, which is the
   owner's own screenshot. */
const BOOK = () => [
  C('L1', 10, { liabilityCapped: 'uncapped' }, { scan: { at: 'x' } }),
  C('I1', 900, { indemnityCapped: 'uncapped' }, { scan: { at: 'x' } }),
  C('I2', 800, { indemnityCapped: 'uncapped' }, { scan: { at: 'x' } }),
  C('X1', 400, { exclusivity: 'exclusive', terminateForConvenience: 'no' }, { scan: { at: 'x' } }),
  C('Z1', 50, { liabilityCapped: 'capped' }, { scan: { at: 'x' } }),
];

describe('f338 (4) — worst first, and it is worked out where the counting is', () => {
  test('4a the rows come back ranked by what they are worth', () => {
    const d = world(BOOK()).exposureData();
    assert.deepEqual(d.rows.map(r => r.k).slice(0, 3), ['indemnity', 'lockin', 'liability'],
      'indemnity is written THIRD in EXPOSURE_KINDS and leads on value; '
      + 'liability is written FIRST and sinks to third on 10');
    assert.deepEqual(d.rows.map(r => r.value), [1700, 400, 10, 0, 0],
      'and the values run downwards');
  });
  test('4b where money is hidden it ranks by COUNT, not by a value nobody sees', () => {
    const w = world(BOOK()); w.canViewValues = () => false;
    const d = w.exposureData();
    assert.equal(d.money, false);
    assert.equal(d.rows[0].k, 'indemnity', 'two contracts beats one');
    assert.deepEqual(d.rows.map(r => r.n), [2, 1, 1, 0, 0]);
    assert.deepEqual(d.rows.map(r => r.k), ['indemnity', 'liability', 'lockin', 'price', 'autorenew'],
      'and the two ones keep the kinds\u2019 own order behind it');
  });
  /* AT THE PARENT `price` reads zero and is written SECOND, so this book
     draws a zero above two rows that are not — the whole of the owner's
     report. */
  test('4c a zero row sinks by construction — never hidden, only last', () => {
    const d = world(BOOK()).exposureData();
    assert.equal(d.rows.length, 5, 'all five kinds are still drawn');
    const firstZero = d.rows.findIndex(r => !r.n);
    assert.ok(firstZero > 0 && d.rows.slice(firstZero).every(r => !r.n),
      'every zero is below every non-zero');
  });
  test('4d ties keep the kinds’ own order — the sort is stable', () => {
    const d = world([C('A1', 0, { liabilityCapped: 'uncapped' }, { scan: { at: 'x' } }),
      C('B1', 0, { indemnityCapped: 'uncapped' }, { scan: { at: 'x' } })]).exposureData();
    assert.ok(d.rows.map(r => r.k).indexOf('liability') < d.rows.map(r => r.k).indexOf('indemnity'),
      'both worth nothing, and liability is written first');
  });
  test('4e the LEADING row is named in the data, never chosen in the renderer', () => {
    assert.equal(world(BOOK()).exposureData().lead, 'indemnity');
    assert.match(INTEL_C, /const lead = \(rows\[0\] && rows\[0\]\.n\) \? rows\[0\]\.k : null;/);
  });
  test('4f a book with nothing in it leads with NOTHING — no bar over a zero', () => {
    const d = world([C('Z1', 10, { liabilityCapped: 'capped' }, { scan: { at: 'x' } })]).exposureData();
    /* STRICT: `assert.equal` is `==`, and an ABSENT `lead` would pass against
       null while meaning the reading does not exist. */
    assert.strictEqual(d.lead, null, 'a bar over an absence would be an alarm about nothing');
    assert.ok('lead' in d, 'and the key is there to be read');
  });
  /* THE DEPARTURE, STATED. One tone and it is ruby; there is no threshold in
     this product to split ruby from amber on, and inventing one is the score
     coming back through a side door. */
  test('4g ONE tone, and the source says why there is not a second', () => {
    const html = INTEL.slice(INTEL.indexOf('function exposureHtml'));
    assert.match(html, /d\.lead===k\?'var\(--st-ruby-fg\)':'transparent'/);
    assert.ok(!/--st-amber-fg'\s*:\s*'var\(--st-ruby-fg\)/.test(html));
    assert.match(INTEL, /THERE IS NO\s+SUCH THRESHOLD IN THIS PRODUCT/);
  });
});

describe('f338 (5) — the unread row leaves the table, and keeps its door', () => {
  test('5a it is not drawn as a sixth row', () => {
    const html = INTEL.slice(INTEL.indexOf('function exposureHtml'), INTEL.indexOf('function exposureWire'));
    assert.ok(!/unreadRow/.test(html), 'it was a row object passed through the row builder');
    assert.match(html, /<tbody>\$\{d\.rows\.map\(row\)\.join\(''\)\}<\/tbody>/,
      'the table is exactly the five exposures');
  });
  test('5b the door survives, so the wire needs no branch', () => {
    /* AND IT IS DRAWN ONLY WHERE IT WOULD WORK — a press that opens nothing
       is not drawn, which is the rule every other row on this page obeys. */
    const w = world(BOOK().concat([C('N9', 5, { liabilityCapped: 'uncapped' })]));
    assert.ok(w.exposureHtml().includes('data-exp-go="unread"'));
    assert.ok(!world(BOOK()).exposureHtml().includes('data-exp-go="unread"'),
      'nothing unread, no door');
    assert.match(INTEL_C, /\(k==='unread'\)\s*\?\s*\{ ids:d\.unread\.ids/);
  });
  /* AND THE FOOT NO LONGER NAMES A ROW THAT IS NOT THERE. It read "is in the
     LAST ROW, not in one of the others" — a page contradicting itself twelve
     pixels apart, which is this codebase's most expensive fault class. */
  test('5b2 the foot says where that contract really is now', () => {
    const html = world(BOOK()).exposureHtml();
    assert.ok(!/last row/i.test(html), 'there is no last row any more');
    assert.match(html, /line under the table/);
    assert.equal((I18N.match(/\n\s*int_exp_foot:/g) || []).length, 2);
    assert.ok(!/sista raden/.test(I18N), 'and the Swedish moved with it');
  });

  test('5c and the reading itself did not move by a field', () => {
    const d = world(BOOK()).exposureData();
    assert.equal(d.unread.n, 0, 'every contract in BOOK carries a scan');
    const d2 = world(BOOK().concat([C('N9', 5, { liabilityCapped: 'uncapped' })])).exposureData();
    assert.deepEqual(d2.unread.ids, ['N9']);
    assert.equal(d2.unread.value, 5);
  });
});

describe('f338 (6) — the asterisk earns a word, and it counts CONTRACTS', () => {
  const FX = () => BOOK().concat([
    C('F1', 700, { liabilityCapped: 'uncapped', currency: 'JPY' }, { scan: { at: 'x' } }),
  ]);
  test('6a fxLeft counts the contracts no figure above could carry', () => {
    const d = world(FX()).exposureData();
    assert.equal(d.fxLeft, 1);
  });
  /* IT IS A SET, NOT A TALLY. A contract can sit in two exposure rows; the
     line under the table says how many CONTRACTS were left out, and counting
     appearances would print two for one record. */
  test('6b a contract in TWO rows is left out ONCE', () => {
    const two = BOOK().concat([C('F2', 700,
      { liabilityCapped: 'uncapped', indemnityCapped: 'uncapped', currency: 'JPY' },
      { scan: { at: 'x' } })]);
    const d = world(two).exposureData();
    assert.equal(d.fxLeft, 1, 'one record, one sentence');
    assert.equal(d.rows.find(r => r.k === 'liability').left, 1);
    assert.equal(d.rows.find(r => r.k === 'indemnity').left, 1);
  });
  test('6c nothing left out draws no line', () => {
    /* THE SENTENCE, not the key: a key name never appears in the output
       either way, so asserting its absence is asserting nothing. */
    const said = 'no exchange rate for';
    assert.ok(world(FX()).exposureHtml().includes(said), 'the control — it draws when it should');
    assert.equal(world(BOOK()).exposureData().fxLeft, 0);
    assert.ok(!world(BOOK()).exposureHtml().includes(said));
  });
  test('6d and where the reader is shown no money there is nothing to leave out', () => {
    const w = world(FX()); w.canViewValues = () => false;
    assert.equal(w.exposureData().fxLeft, 0);
  });
  test('6e the sentence is answered in BOTH books, singular and plural', () => {
    for (const k of ['int_exp_fx_line_one', 'int_exp_fx_line_other'])
      assert.equal((I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f338 (7) — THE WALL: this was presentation, never arithmetic', () => {
  /* Every figure on that page stays exactly the reading it was. The ORDER is
     the whole of the change, so the same book must come back with the same
     ids and the same sums whichever way the rows are sorted. */
  test('7a the same book gives the same ids and the same sums', () => {
    const d = world(BOOK()).exposureData();
    const by = {}; d.rows.forEach(r => { by[r.k] = { n: r.n, v: r.value, ids: r.ids.slice().sort() }; });
    assert.deepEqual(by.liability, { n: 1, v: 10, ids: ['L1'] });
    assert.deepEqual(by.indemnity, { n: 2, v: 1700, ids: ['I1', 'I2'] });
    assert.deepEqual(by.lockin, { n: 1, v: 400, ids: ['X1'] });
    assert.deepEqual(by.autorenew, { n: 0, v: 0, ids: [] });
    assert.deepEqual(by.price, { n: 0, v: 0, ids: [] });
    assert.equal(d.live, 5);
  });
  test('7b a missing rate is still LEFT OUT and counted, never summed at par', () => {
    const cs = BOOK(); cs.find(c => c.id === 'I1').metadata.currency = 'EUR';
    const r = world(cs).exposureData().rows.find(x => x.k === 'indemnity');
    assert.equal(r.n, 2, 'the contract is still counted');
    assert.equal(r.value, 800, 'and its money is not');
    assert.equal(r.left, 1);
  });
  test('7c there is still no score, and nothing computes one', () => {
    const html = world(BOOK()).exposureHtml();
    assert.ok(!/score|rating|out of 100/i.test(html));
    const fn = INTEL_C.slice(INTEL_C.indexOf('function exposureData'),
      INTEL_C.indexOf('function exposureWire'));
    assert.ok(!/score|weight\s*\*|\/\s*100\b/i.test(fn));
  });
  test('7d and the renderer still computes nothing but the drawing', () => {
    const html = INTEL_C.slice(INTEL_C.indexOf('function exposureHtml'),
      INTEL_C.indexOf('function exposureWire'));
    assert.equal((html.match(/exposureData\(\)/g) || []).length, 1,
      'one reading, taken once');
    assert.ok(!/\.filter\(c\s*=>/.test(html), 'no second walk of the book in the draw');
  });
});
