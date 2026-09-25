/* F382 — A SHORTER MAP, THE LIST'S OWN COLOURS, AND TWO DECISIONS (Young ruled
   25 Sep 2026).

   *"reduce the where your contracts stand card by 25% as it is dominating the
   screen too much and taking over the whole screen. The color code of the
   drafting, review and executed should match the color coding in the contracts
   list page. And below prepared for you card, add bring back the needs your
   attention card but only have 2 lines and nothing more."*

   WHAT IS PINNED HERE, and each half fails at the parent unless it is named a
   [wall] (true on both sides by design — what a change like this must NOT
   move):
     1. a stage wears STATUS_META's own `dot` — the table the Contracts list
        draws its stage dots from — on the bar and on the legend's square, and
        the literal a stage without js/core.js falls back on is that table's;
     2. nothing on the Map went: every figure, door and the switch are still
        drawn and the figures keep their type sizes [walls]; the legend's
        figure and unit share one line. THE HEIGHT ITSELF IS A GEOMETRY and is
        measured in a real browser (home-page-verify 3c), never here;
     3. "Needs your decision" is back under Prepared for you: TWO rows, the
        first two of its one reading (hmDecisionItems), a head that counts the
        whole list, "See all" only where more wait than show, one line when
        there is nothing, and no rail;
     4. the words are in both books and the dictionary no longer calls them
        stale. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HOME = read('js/views/home.js');
const HOME_CODE = HOME.replace(/\/\*[\s\S]*?\*\//g, '');
const CORE = read('js/core.js');
const CSS = read('index.html');
const I18N = read('js/i18n.js');
const i18n = require('../js/i18n.js');

const FILES = ['js/obligations.js', 'js/desknight.js', 'js/views/home.js'];
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
/* Contracts sitting in review, each idle a different number of days — the
   "Waiting on review" source, which takes every one, longest first. */
const inReview = n => Array.from({ length: n }, (_, i) => ({
  id: 'MK-' + (i + 1), name: 'Review ' + (i + 1), counterparty: 'Party ' + (i + 1),
  status: 'Under Review', value: 1e6, lastAction: day(-(10 + i * 7)), audit: [] }));
const signedOne = () => ({ id: 'MK-S', name: 'Signed one', counterparty: 'Siginon', status: 'Signed',
  value: 5e6, expiry: day(300), metadata: { expiryDate: day(300) }, audit: [] });
function world({ contracts = inReview(5), extra = {} } = {}) {
  const sb = loadViews(FILES, { canViewValues: () => true,
    state: { contracts, settings: {}, view: 'dashboard', serverStats: { total: contracts.length } }, ...extra });
  sb.renderDashboard();
  return { sb, html: sb.document.getElementById('content').innerHTML };
}
/* The Needs your decision card's own markup, from its heading to the end of
   the page — PIN THE REGION, not a byte count. */
const ddCard = html => {
  const at = html.indexOf('Needs your decision');
  assert.ok(at > 0, 'the card is drawn');
  return html.slice(html.lastIndexOf('<section', at));
};
/* core.js's own STATUS_META dots, read off the source — the node stage does
   not load core.js (it builds a sample book at load). */
const coreDot = k => {
  const m = CORE.match(new RegExp("'" + k + "':\\s*_stMeta\\('[a-z_]+',\\s*'[^']*',\\s*'([^']+)'"));
  assert.ok(m, k + ' is in STATUS_META');
  return m[1];
};

describe('F382 (1) — a stage wears the Contracts list\'s own colour', () => {
  test('the Map asks STATUS_META for each stage — a stand-in table is followed exactly', () => {
    const table = { 'Draft': { dot: 'rgb(1, 2, 3)' }, 'Under Review': { dot: 'rgb(4, 5, 6)' },
      'Signed': { dot: 'rgb(7, 8, 9)' }, 'Declined': { dot: 'rgb(0, 0, 0)' } };
    const { sb } = world({ contracts: [signedOne()], extra: { STATUS_META: table } });
    const d = sb.hmMapData();
    assert.equal(d.stages.length, 3);
    for (const s of d.stages) assert.equal(s.tone, table[s.k].dot, s.k + ' wears the table\'s dot');
  });
  test('where no table is on the stage, the fallback IS the table — no drift', () => {
    const { sb } = world({ contracts: [signedOne()] });
    for (const s of sb.hmMapData().stages) assert.equal(s.tone, coreDot(s.k), s.k + ' falls back to core.js\'s own dot');
    assert.equal(coreDot('Draft'), 'var(--st-gray-dot)', 'drafting is grey in the list');
    assert.equal(coreDot('Under Review'), 'var(--st-amber-dot)', 'review is amber in the list');
    assert.equal(coreDot('Signed'), 'var(--st-green-dot)', 'executed is green in the list');
  });
  test('the bar and the legend\'s square are painted with that colour, and no accent class is drawn', () => {
    const cs = [signedOne(), ...inReview(1), { id: 'MK-D', name: 'Draft', counterparty: 'X', status: 'Draft', value: 1e6, audit: [] }];
    const { html } = world({ contracts: cs });
    const bar = html.slice(html.indexOf('hm-map-stages'), html.indexOf('hm-map-legend'));
    const legend = html.slice(html.indexOf('hm-map-legend'), html.indexOf('hm-map-rn'));
    for (const k of ['Draft', 'Under Review', 'Signed']) {
      const tone = coreDot(k);
      assert.match(bar, new RegExp('background:' + tone.replace(/[()]/g, '\\$&') + '" data-hm-map="stage:' + k),
        k + '\'s segment wears the list\'s dot');
      assert.ok(legend.includes('class="hm-map-sw" style="background:' + tone + '"'), k + '\'s square too');
    }
    assert.ok(!/is-s[123]/.test(html), 'no accent stage class is drawn any more');
  });
  test('the stylesheet paints no stage from the accent ladder, and says why', () => {
    assert.ok(!/--map-s[123]/.test(CSS), 'the three accent stage tokens are gone');
    assert.ok(!/\.hm-map \.is-s1\{/.test(CSS), 'and the rules that painted with them');
    assert.match(CSS, /THE STAGES ARE NOT AMONG THEM SINCE 25 SEP 2026/, 'the reversal is written beside the rule');
  });
});

describe('F382 (2) — a quarter shorter, and nothing on it went', () => {
  test('[wall] every figure, door and the switch are still drawn', () => {
    const { sb, html } = world({ contracts: [signedOne(), ...inReview(2)] });
    assert.equal((html.match(/<button type="button" (?:data-hm-map="stage:[^"]+"|disabled)>\s*<span class="hm-map-ln">/g) || []).length, 3,
      'three legend entries');
    assert.equal((html.match(/class="hm-map-col"/g) || []).length, 12, 'twelve months');
    assert.ok(html.includes('class="hm-map-wl"'), 'the window\'s label');
    /* What could hurt you is the Exposure register's leading row and is
       absent where the Insights module is not on the stage — the node stage
       is one — so the count is asked of the reading, not typed. */
    assert.equal((html.match(/class="hm-map-fact"/g) || []).length, sb.hmMapData().hurt ? 3 : 2, 'every side fact');
    assert.ok(html.includes('data-hm-measure="count"') && html.includes('data-hm-measure="value"'), 'the switch');
  });
  test('[wall] the figures keep their type sizes — the height came out of the air, never the numbers', () => {
    assert.match(CSS, /\.hm-map-lv\{ font-family:var\(--font-mono\); font-size:18px;/);
    assert.match(CSS, /\.hm-map-ff\{ font-family:var\(--font-mono\); font-size:26px;/);
  });
  test('the legend\'s figure and its unit share one line, and the unit wraps rather than being cut', () => {
    const { html } = world({ contracts: [signedOne()] });
    assert.match(html, /<span class="hm-map-lf"><span class="hm-map-lv">[^<]*<\/span>\s*<span class="hm-map-lc">/);
    assert.match(CSS, /\.hm-map-lf\{ display:flex; flex-wrap:wrap; align-items:baseline;/);
  });
  test('the note says what came out, measured', () => {
    assert.match(CSS, /A QUARTER SHORTER \(Young ruled 25 Sep 2026/);
    assert.match(CSS, /MEASURED at the parent: 545px tall/);
  });
});

describe('F382 (3) — Needs your decision is back, two rows and nothing more', () => {
  test('one reading, published, and the row count is two', () => {
    const { sb } = world();
    assert.equal(typeof sb.hmDecisionItems, 'function', 'hmDecisionItems is published');
    assert.equal(sb.HM_DD_ROWS, 2);
    assert.equal(sb.hmDecisionItems().length, 5, 'five contracts in review are five items');
  });
  test('exactly two rows are drawn, and they are the list\'s first two, in order', () => {
    const { sb, html } = world();
    const card = ddCard(html);
    const rows = [...card.matchAll(/class="hm-row [^"]*" data-sel="([^"]+)"/g)].map(m => m[1]);
    assert.equal(rows.length, 2, 'two rows');
    /* Joined, not deepEqual: an array born inside the vm stage carries that
       realm's prototype, and two identical lists would compare unequal. */
    assert.equal(rows.join(','), sb.hmDecisionItems().slice(0, 2).map(x => x.cid).join(','), 'the first two, in the list\'s order');
  });
  test('the head counts the whole list, and See all opens the rest', () => {
    const card = ddCard(world().html);
    assert.match(card, /<span class="hm-sec-sub">5 items · sorted by what closes first<\/span>/, 'the head counts all five');
    assert.match(card, /data-hm-go="needsyou">See all 5/, 'and See all carries the same number');
  });
  test('with exactly two, See all is not drawn — it would open the list already on screen', () => {
    const card = ddCard(world({ contracts: inReview(2) }).html);
    assert.equal((card.match(/class="hm-row /g) || []).length, 2);
    assert.ok(!card.includes('data-hm-go="needsyou"'));
  });
  test('with nothing to decide, it says so in one line — no rows, no See all', () => {
    const card = ddCard(world({ contracts: [signedOne()] }).html);
    assert.ok(card.includes('class="hm-empty"'), 'the one line');
    assert.ok(!card.includes('hm-dd-rows') && !card.includes('data-hm-go="needsyou"'));
    assert.match(CSS, /\.hm-card \.hm-empty\{background:none;border:0;\}/,
      'and inside the card the line draws no frame of its own — the card is the frame');
  });
  test('it sits under the Map and under Prepared for you', () => {
    /* A late promise of theirs on an agreement in force is what the desk
       chases — the same stage f381 uses for its own wall. */
    const late = signedOne();
    late.obligations = [{ id: 'ob1', desc: 'Pay the August invoice', party: 'theirs', due: day(-6), status: 'open', amount: 2e6 }];
    const cs = [late, ...inReview(3)];
    const { html } = world({ contracts: cs });
    const map = html.indexOf('id="hm-map"'), desk = html.indexOf('Prepared for you'), dd = html.indexOf('Needs your decision');
    assert.ok(map > 0 && desk > map && dd > desk, 'the Map, then prepared work, then the reader\'s own list');
  });
  test('nothing more: no line of time, no fitted slice, no triage row', () => {
    const card = ddCard(world().html);
    assert.ok(!card.includes('hm-rw'), 'no rail');
    assert.ok(!/hmFitDecisions|rowsThatFit\(/.test(HOME_CODE), 'no fit');
    assert.ok(!/it\.kind==='triage'\?triageRowHtml/.test(HOME_CODE), 'no triage branch on the rows');
  });
  test('a row escapes a name once', () => {
    const cs = inReview(1); cs[0].name = 'Smith & Co';
    const card = ddCard(world({ contracts: cs }).html);
    assert.ok(card.includes('Smith &amp; Co') && !card.includes('&amp;amp;'));
  });
});

describe('F382 (4) — the words', () => {
  /* [wall] — the keys were left inert in both books when the card went for a
     day (the retirement rule), so this passes at the parent too; it is here
     so the day somebody tidies them out, the card is not left half-English. */
  test('[wall] every word the card asks for is in both books', () => {
    for (const lang of ['en', 'sv']) for (const k of ['home_needs_decision', 'home_dd_sorted', 'home_see_all', 'home_nothing_to_decide']) {
      assert.ok(i18n.STRINGS[lang][k], lang + ' is missing ' + k);
    }
    for (const lang of ['en', 'sv']) assert.ok(i18n.STRINGS[lang].home_dd_items_one && i18n.STRINGS[lang].home_dd_items_other);
  });
  test('the dictionary no longer calls the card\'s own name stale', () => {
    assert.ok(!/home_needs_decision above is STALE ON THE FACE/.test(I18N));
  });
});
