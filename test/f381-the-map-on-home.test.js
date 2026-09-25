/* F381 — THE MAP ON HOME (Young ruled 24 Sep 2026).

   *"give me an idea of how the homepage should look like. It should be
   executive high level view and not too dense"* — three options drawn, the Map
   picked by name; *"it is heavy on the cash side. make it so you have a toggle
   for review in cash or in quantity as in number of contracts"*; *"instead of
   needs your decision, delete it and replace with prepared for you"*; then
   *"Build it and merge to main"*. The drawing is the artifact "Executive Home
   Options".

   WHAT IS PINNED, and each half fails at the parent:
     1. the desktop Home is the greeting, the Map and Prepared for you — no
        tiles, no "Choose tiles", no "Needs your decision", no rail;
     2. the Map's figures are BORROWED readings, and the piles are the
        renewal card's own (renewalWindow);
     3. money obeys canViewValues by construction — no Value half, no KES;
     4. the switch is the reader's own, remembered per person, Count at rest;
     5. every figure is a door and a zero is not one;
     6. the two reminders that lived only on the removed card ride the bell;
     7. the words are in both books, and nothing still names the card that
        left.
   WALLS (pass on both sides by design, named so): the phone's readings stay
   published (KPI_META, currentKpiSel, KPI_MAX) and the Prepared for you card
   is still drawn. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews } = require('./dom');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HOME = read('js/views/home.js');
const APP = read('js/app.js');
const CSS = read('index.html');
const i18n = require('../js/i18n.js');

const FILES = ['js/obligations.js', 'js/desknight.js', 'js/views/home.js'];
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const book = () => ([
  { id: 'MK-1', name: 'Warehouse', counterparty: 'Siginon', status: 'Signed', value: 10e6, expiry: day(40),
    metadata: { expiryDate: day(40), noticePeriodDays: 30 }, audit: [] },
  { id: 'MK-2', name: 'Distribution', counterparty: 'Sendy', status: 'Signed', value: 20e6, expiry: day(200),
    metadata: { expiryDate: day(200), noticePeriodDays: 30 }, audit: [] },
  { id: 'MK-3', name: 'Packaging', counterparty: 'Bidco', status: 'Draft', value: 5e6, audit: [] },
  { id: 'MK-4', name: 'Retail', counterparty: 'Naivas', status: 'Under Review', value: 7e6, audit: [] },
  { id: 'MK-5', name: 'Closed one', counterparty: 'Tuskys', status: 'Declined', value: 9e6, audit: [] },
]);
function world({ money = true, contracts = book(), stored = null } = {}) {
  const sb = loadViews(FILES, { canViewValues: () => money,
    state: { contracts, settings: {}, view: 'dashboard', serverStats: { total: contracts.length } } });
  if (stored) sb.localStorage.setItem('hati.v1.homeMeasure.u_test', stored);
  sb.renderDashboard();
  return { sb, html: sb.document.getElementById('content').innerHTML };
}
/* The body of one named top-level function — PIN THE REGION, never a byte
   count: from its declaration to the next top-level declaration. */
const fnBody = (src, name) => {
  const at = src.search(new RegExp('\\nfunction ' + name + '\\('));
  assert.ok(at >= 0, name + ' is declared');
  const rest = src.slice(at + 1);
  const next = rest.slice(1).search(/\n(function |const |let |Object\.assign)/);
  return next < 0 ? rest : rest.slice(0, next + 1);
};

describe('F381 (1) — Home is the greeting, the Map and Prepared for you', () => {
  /* HALF REVERSED IN PLACE 25 Sep 2026 (Young: "below prepared for you card,
     add bring back the needs your attention card but only have 2 lines and
     nothing more"). The tiles and "Choose tiles" stay gone; the decisions
     card is BACK, under the Map, with its rows — and its line of time is
     still gone, which is the half of the old claim that holds. f382 pins the
     two rows. */
  test('the Map is drawn, the tiles and Choose tiles are not, and the decisions card is back without its rail', () => {
    const { html } = world();
    assert.ok(html.includes('id="hm-map"'), 'the Map is on the page');
    assert.ok(html.includes('hm-card hm-map'), 'in the card shell every Home card wears');
    assert.ok(!html.includes('data-kpi-id'), 'no KPI tile is drawn on the desktop');
    assert.ok(!html.includes('kpi-grid'), 'and no tile row');
    assert.ok(!html.includes('kpi-customize'), '"Choose tiles" left with the tiles it chose');
    assert.ok(html.includes('Needs your decision'), 'the decisions card is back on the page');
    assert.ok(html.indexOf('id="hm-map"') < html.indexOf('Needs your decision'), 'under the Map');
    assert.ok(html.includes('hm-dd-rows'), 'with its rows');
    assert.ok(!html.includes('hm-rw'), 'and without its rail');
  });
  test('the desktop picker is deleted, not left as a door onto nothing', () => {
    assert.ok(!/function openKpiCustomizer\(/.test(HOME), 'the popover has no button to open it');
    assert.ok(!/function kpiApply\(/.test(HOME));
    assert.ok(!/function hmFitDecisions\(/.test(HOME), 'the fitted list it filled is gone');
  });
  test('[wall] the phone\'s own readings are still published', () => {
    const { sb } = world();
    for (const k of ['KPI_META', 'currentKpiSel', 'setKpiSel', 'kpiCatalogOrder', 'KPI_MAX', 'kpiAtMax', 'hmMySignings', 'hmDashSlices'])
      assert.ok(sb[k] != null, k + ' is still published');
  });
  test('[wall] Prepared for you is still drawn, below the Map', () => {
    const late = book();
    late[0].obligations = [{ id: 'ob1', desc: 'Pay the August invoice', party: 'them', due: day(-6), status: 'open', amount: 2e6 }];
    const { html } = world({ contracts: late });
    const map = html.indexOf('id="hm-map"'), desk = html.indexOf('Prepared for you');
    assert.ok(desk > 0, 'the desk card is drawn');
    assert.ok(map > 0 && map < desk, 'under the Map');
  });
});

describe('F381 (2) — every figure on the Map is a reading HaTi already makes', () => {
  test('the three stages ARE the live book, so they add up to the head', () => {
    const { sb } = world();
    const d = sb.hmMapData();
    /* Joined, not deepEqual'd: an array born inside the sandbox has that realm's
       Array.prototype (the performance audit's recorded trap). */
    assert.equal(d.stages.map(s => s.k).join('|'), 'Draft|Under Review|Signed');
    assert.equal(d.total.n, d.stages.reduce((a, s) => a + s.n, 0));
    assert.equal(d.total.n, 4, 'Declined is not live');
  });
  test('a contract lands on the month its term ends, in the renewal card\'s own pile', () => {
    const cs = book();
    const q = { expiry: cs[0].expiry, notice: '30' };
    cs[1].renewalDecision = { answer: 'renew', expiry: cs[1].expiry, notice: '30', decideBy: day(170) };
    const { sb } = world({ contracts: cs });
    const d = sb.hmMapData();
    assert.equal(d.months.length, 12);
    const flat = k => d.months.reduce((a, M) => a.concat(M[k].ids), []);
    assert.deepEqual(flat('due'), ['MK-1'], 'forty days out, decision inside the window: due');
    assert.deepEqual(flat('made'), ['MK-2'], 'answered on the card: made');
    assert.equal(d.win.ids.join(','), 'MK-1', 'the ninety-day window counts by days, exactly');
    assert.ok(q && d.months.every(M => M.n === M.made.n + M.due.n + M.later.n), 'every month is its three piles');
  });
  test('the piles are asked of renewalWindow, never a second copy of the rule', () => {
    const body = fnBody(HOME, 'hmMapData');
    assert.match(body, /renewalWindow\(c\)/);
    assert.match(body, /w\.decided\?'made':\(w\.inWindow\?'due':'later'\)/);
    assert.ok(!/renewalDecisionDate\(|noticePeriodDays/.test(body), 'no decision arithmetic of its own');
  });
  test('the busiest stretch is asked in each measure and starts after the window', () => {
    const body = fnBody(HOME, 'hmMapData');
    assert.match(body, /for\(let i=win\.to\.i\+1;i<HM_MAP_MONTHS-1;i\+\+\)/);
    assert.match(body, /peak=\{ count:busiest\('count'\), value:money\?busiest\('value'\):null \}/);
  });
  test('owed is ONE reading: the phone\'s tile and the Map both ask hmOwed', () => {
    assert.match(HOME, /\nfunction hmOwed\(cs, money\)\{/);
    assert.match(fnBody(HOME, 'hmDashSlices'), /const owedW=hmOwed\(cs, money\);/);
    assert.match(fnBody(HOME, 'hmDashSlices'), /const \{ canMoney, sum, n, late, left \} = owedW;/);
    assert.match(fnBody(HOME, 'hmMapData'), /S\.owedW/);
  });
  test('turnaround opens exactly the contracts its average is made of', () => {
    const cs = book();
    const { sb } = world({ contracts: cs });
    const S = sb.hmDashSlices();
    assert.equal(S.cycleIds.length, S.cycles.length, 'one id per figure in the average');
  });
  test('what could hurt you is the Exposure register\'s leading row', () => {
    const body = fnBody(HOME, 'hmMapData');
    assert.match(body, /exposureData\(\)/);
    assert.match(body, /x\.k===e\.lead/, 'the row that page puts first, not a second ranking');
  });
});

describe('F381 (3) — money obeys canViewValues by construction', () => {
  test('without the right: no Value half, no money, even with Value stored', () => {
    const { sb, html } = world({ money: false, stored: 'value' });
    const d = sb.hmMapData();
    assert.equal(d.money, false);
    assert.equal(d.total.v, null, 'the reading carries no figure');
    assert.ok(d.stages.every(s => s.v === null));
    assert.ok(!html.includes('data-hm-measure="value"'), 'the switch offers no Value half');
    assert.ok(!/KES/.test(html), 'no money anywhere on the page');
  });
  test('with the right and Value chosen, the head states the book in money', () => {
    const { html } = world({ money: true, stored: 'value' });
    assert.match(html, /data-hm-measure="value" aria-pressed="true"/);
    assert.match(html, /KES [0-9.]+M across 4 active contracts/);
  });
});

describe('F381 (4) — the switch is the reader\'s own, Count at rest', () => {
  test('count is the answer where nothing is stored', () => {
    const { sb, html } = world();
    assert.equal(sb.hmMeasure(true), 'count');
    assert.match(html, /data-hm-measure="count" aria-pressed="true"/);
    assert.match(html, /4 active contracts/);
    assert.ok(!/across/.test(html.slice(html.indexOf('hm-map-sub'), html.indexOf('hm-map-sub') + 200)), 'no money in the head at rest');
  });
  test('it is stored per person, and a reader without money is always on Count', () => {
    const { sb } = world();
    sb.hmSetMeasure('value');
    assert.equal(sb.localStorage.getItem('hati.v1.homeMeasure.u_test'), 'value');
    assert.equal(sb.hmMeasure(true), 'value');
    assert.equal(sb.hmMeasure(false), 'count');
  });
  test('it is the Document tab\'s own control, and it repaints the card only', () => {
    const { html } = world();
    assert.match(html, /class="doc-read-seg hm-map-seg" role="group"/);
    const wire = fnBody(HOME, 'hmMapWire');
    assert.match(wire, /el\.innerHTML=hmMapInnerHtml\(d,m\)/, 'the card\'s inside, never the page');
    assert.ok(!/renderDashboard\(/.test(wire), 'a press does not rebuild Home');
  });
});

describe('F381 (5) — every figure is a door, and a zero is not one', () => {
  test('a month with contracts opens exactly them; an empty month is not a door', () => {
    const { sb, html } = world();
    const d = sb.hmMapData();
    for (const M of d.months) {
      if (M.n) assert.ok(html.includes(`data-hm-map="month:${M.i}"`), 'month ' + M.i + ' is a door');
      else assert.ok(!html.includes(`data-hm-map="month:${M.i}"`), 'month ' + M.i + ' is empty and is not');
    }
    assert.match(fnBody(HOME, 'hmMapWire'), /only\(M\.ids,/, 'the door hands over the ids it counted');
  });
  test('the window\'s label is its door, and the box behind it takes no press', () => {
    const { html } = world();
    assert.match(html, /class="hm-map-wl" data-hm-map="window"/);
    assert.match(CSS, /\.hm-map-win\{[^}]*pointer-events:none/);
  });
  test('a stage door opens the Contracts seat on that stage, whatever page came before', () => {
    /* The count is the whole live book's, so the door may not write into the
       Negotiations seat's filters or keep an earlier named set narrowing the
       list — asked of the handler's own region, the stage branch alone. */
    const b = fnBody(HOME, 'hmMapWire');
    const stage = b.slice(b.indexOf("if(kind==='stage')"), b.indexOf("if(kind==='month')"));
    assert.ok(stage.length > 20, 'the stage branch is found');
    assert.match(stage, /regSetScope\(null\)[\s\S]*regState\(\)/, 'the seat is put back BEFORE the state is read');
    assert.match(stage, /\.only=null/, 'an earlier named set is let go');
  });
  test('a stage with nothing in it is drawn and is not a door', () => {
    const cs = book().filter(c => c.status !== 'Draft');
    const { html } = world({ contracts: cs });
    const legend = html.slice(html.indexOf('hm-map-legend'));
    assert.ok(legend.includes('disabled'), 'Drafting reads 0 and refuses the press');
    assert.ok(!html.includes('data-hm-map="stage:Draft"'));
  });
});

/* The card they lived on came back on 25 Sep 2026 (two rows); the bell rows
   stay, because the bell says everything owed to you and the card only the
   first two decisions. The claims below are unchanged. */
describe('F381 (6) — the two reminders that lived only on the removed card ride the bell', () => {
  const kinds = () => {
    const m = APP.match(/const ALERT_KINDS = \[([\s\S]*?)\n\];/);
    assert.ok(m, 'ALERT_KINDS is found');
    return [...m[1].matchAll(/\{ k:'([a-z-]+)'/g)].map(x => x[1]);
  };
  test('they are registered kinds, ranked where their work sits', () => {
    const k = kinds();
    assert.ok(k.includes('desk-quiet') && k.includes('desk-join'));
    assert.equal(k.indexOf('desk-quiet'), k.indexOf('negotiation') + 1, 'the quiet desk beside the negotiation');
    assert.equal(k.indexOf('desk-join'), k.indexOf('review-mine') + 1, 'the join beside the other colleague waiting');
  });
  test('the bell reads the same two sources the card read, and nothing new', () => {
    const b = fnBody(APP, 'buildAlerts');
    assert.match(b, /\(D\.myStaleDesks\|\|\[\]\)\.forEach\(x=>\{[\s\S]*?push\('desk-quiet'/);
    assert.match(b, /\(D\.myJoinAsks\|\|\[\]\)\.forEach\(x=>\{[\s\S]*?push\('desk-join'/);
  });
  test('a quiet desk still says how long it has sat — the card\'s own tag leads its sub-line', () => {
    const b = fnBody(APP, 'buildAlerts');
    assert.match(b, /i18t\('dk_stale_tag',\{n:st\.days\}\)/,
      'the age the card printed as its tag rides the bell row');
  });
});

describe('F381 (7) — the words', () => {
  test('every home_map_ key the card asks for is in both books', () => {
    const asked = new Set([...HOME.matchAll(/'(home_map_[a-z_]+)'/g)].map(m => m[1]));
    assert.ok(asked.size > 20, 'the card asks for its words by key');
    for (const lang of ['en', 'sv']) for (const k of asked) {
      const S = i18n.STRINGS[lang];
      assert.ok(S[k] || S[k + '_one'], lang + ' is missing ' + k);
    }
  });
  test('"Put all away" no longer promises a card that left', () => {
    assert.ok(!/Needs your decision/.test(i18n.STRINGS.en.desk_discard_msg));
    assert.ok(!/Beslut att fatta/.test(i18n.STRINGS.sv.desk_discard_msg));
  });
  /* RE-POINTED IN PLACE 25 Sep 2026 (Young: "The color code of the drafting,
     review and executed should match the color coding in the contracts list
     page"). The stages left the card's own accent tokens for STATUS_META's
     dots (f382 pins that), so "amber means one thing on this card" is no
     longer true and is not asked. What still holds: the renewal piles are
     tokens on the card, and the one that follows the accent has a night
     answer. */
  test('the card\'s own colours are tokens with a night answer', () => {
    assert.match(CSS, /\.hm-map\{ --map-made:var\(--color-accent-600\)/);
    assert.match(CSS, /html\.dark \.hm-map\{ --map-made:/);
    assert.match(CSS, /--map-due:var\(--st-amber-dot\)/, 'a decision due is amber');
    assert.ok(!/--map-s[123]/.test(CSS), 'and the stages carry no accent tokens of their own any more');
  });
});
