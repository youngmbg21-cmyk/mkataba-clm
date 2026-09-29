/* ============================================================
   f438 — THE EXPOSURE TAB FITS THE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026)
   ============================================================
   The owner: "Make the pages fit with a page and for the cards to fit
   together without cards being taller than other cards and not covering
   spaces fully. The pages should look balanced and professional."

   Exposure takes the shared grammar (f433, index.html "INSIGHTS FITS THE
   SCREEN"): the headline figures as four `.igx-fig` tiles in one strip —
   the three it always had, each keeping its door, and the LEADING EXPOSURE
   (exposureData's own `lead`, a door that picks the lead row, NEVER a score)
   — then ONE `.igx-row` split 8:4: the grid's card, whose rows grow to fill
   it, beside the list's card, whose rows scroll inside it with the door to
   Contracts staying at its foot.

   What may not move under the new frame is the owner's standing rule for
   this page (f432): five readings, NO SCORE, ranked rows, a zero row stands
   down, ONE ruby lead bar, money obeying canViewValues. Those are asked again
   here of the tiles, which are the new thing on the page.

   A Chromium measurement of the real page is the other half; this pins the
   structure. Red at the parent (616f3b30): 16 of 18 — every claim that asks
   for a tile, the row, the fill, the scroller or the retired rules; the two
   marked [wall] pass on both sides by design. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const INTEL = R('js/views/intelligence.js');
const CORE = R('js/core.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
const INTEL_C = code(INTEL);

/* The f432 fixture: twelve contracts over two categories, three streams and
   three owners; nothing is locked in (the zero row). */
const C = (id, value, cat, folder, owner, marks, read, extra) => {
  const m = marks || [];
  return Object.assign({
    id, name: 'Paper ' + id, counterparty: 'Co ' + id, status: 'Executed', value, folder,
    owner: owner ? { name: owner } : undefined,
    metadata: {
      currency: 'KES', category: cat || undefined,
      liabilityCapped: m.includes('liab') ? 'uncapped' : 'capped',
      priceReview: m.includes('price') ? 'open' : 'nochange',
      indemnityCapped: m.includes('indem') ? 'uncapped' : 'capped',
      renewalType: m.includes('auto') ? 'auto-renew' : 'fixed', noticePeriodDays: m.includes('auto') ? 14 : 90,
      exclusivity: m.includes('lock') ? 'exclusive' : 'none', terminateForConvenience: m.includes('lock') ? 'no' : 'yes',
    },
    obligations: [], audit: [], comments: [], signatures: [], fields: {},
  }, read ? { scan: { at: 'x' } } : {}, extra || {});
};
const BOOK = () => [
  C('S1', 900, 'supplier', 'proc', 'Grace', ['price', 'liab'], true),
  C('S2', 700, 'supplier', 'proc', 'Grace', ['price'], true),
  C('S3', 500, 'supplier', 'mfg', 'Peter', ['price', 'indem'], false),
  C('S4', 300, 'supplier', 'mfg', 'Peter', ['liab'], true),
  C('S5', 100, 'supplier', 'sales', 'Brian', [], true),
  C('K1', 800, 'customer', 'sales', 'Brian', ['price'], true),
  C('K2', 600, 'customer', 'sales', 'Brian', ['auto'], false),
  C('K3', 400, 'customer', 'proc', 'Grace', ['indem', 'auto'], true),
  C('K4', 200, 'customer', 'mfg', 'Peter', [], false),
  C('N1', 50, '', 'proc', null, ['price'], true),
];

function world(cs, opts) {
  const o = opts || {};
  const w = buildWorld({ intelView: true, homeView: true, templates: true, metadata: true }).win;
  const src = CORE.match(/function contractOwnerName\(c\)\{[\s\S]*?\n\}/);
  if (src) w.eval(src[0] + '\nwindow.contractOwnerName=contractOwnerName;');
  w.state = Object.assign(w.state || {}, { contracts: cs });
  if (o.money === false) w.canViewValues = () => false;
  w.__shown = [];
  w.regShowOnly = (ids, label) => { w.__shown.push({ ids: ids.slice().sort(), label }); };
  w.selectContract = () => {};
  if (typeof w.exposureGridSet === 'function') w.exposureGridSet({ by: 'cat', m: 'n', k: null, g: null });
  return w;
}
function mount(w) {
  const host = w.document.createElement('div');
  host.id = 'ig-exp-body';
  host.className = 'scroll-thin igx-host';
  w.document.body.appendChild(host);
  host.innerHTML = w.exposureHtml();
  w.exposureWire();
  return host;
}
const tiles = host => [...host.querySelectorAll('.igx-figs > .igx-fig')];

describe('f438 (1) the frame is the shared grammar', () => {
  test('1a the page is one .igx-fit: the figure strip first, then ONE row', () => {
    const host = mount(world(BOOK()));
    const fit = host.querySelector(':scope > .igx-fit');
    assert.ok(fit, 'the section is the grid exactly the host\'s height');
    const kids = [...fit.children];
    assert.equal(kids.length, 2, 'a strip and a row, nothing else in the frame');
    assert.ok(kids[0].classList.contains('igx-figs'), 'the figures come first');
    assert.ok(kids[1].classList.contains('igx-row'), 'then the row of cards');
    assert.equal(host.querySelectorAll('.igx-row').length, 1, 'ONE row');
  });
  test('1b the row is split 8:4 and holds exactly two cards: the grid, then the list', () => {
    const host = mount(world(BOOK()));
    const row = host.querySelector('.igx-row');
    assert.match(row.getAttribute('style') || '', /--igx-cols:\s*minmax\(0,\s*8fr\)\s+minmax\(0,\s*4fr\)/);
    const cards = [...row.children];
    assert.equal(cards.length, 2);
    assert.ok(cards.every(c => c.classList.contains('igx-card')), 'both are the shared card');
    assert.ok(cards[0].querySelector('.exp-pg-mx'), 'the grid sits in the first (8 parts)');
    assert.ok(cards[1].matches('aside.exp-pg-side'), 'the list sits in the second (4 parts)');
  });
});

describe('f438 (2) four figure tiles, each a door, the lead one NOT a score', () => {
  test('2a four tiles in order: at least one · two or more · not read · leading exposure', () => {
    const cs = BOOK().concat([C('U1', 5, 'customer', 'sales', 'Brian', ['liab'], false)]);
    const w = world(cs);
    const host = mount(w);
    const strip = host.querySelector('.igx-figs');
    assert.match(strip.getAttribute('style') || '', /--igx-n:\s*4/);
    const t = tiles(host);
    assert.equal(t.length, 4);
    assert.equal(t[0].getAttribute('data-exp-cell'), 'any');
    assert.equal(t[1].getAttribute('data-exp-go'), 'two');
    assert.equal(t[2].getAttribute('data-exp-cell'), 'unread');
    assert.equal(t[3].getAttribute('data-exp-lead'), '1');
    for (const x of t) {
      assert.equal(x.tagName, 'BUTTON', 'a figure with a list behind it is a door');
      assert.ok(x.querySelector('.igx-fig-t') && x.querySelector('.igx-fig-n') && x.querySelector('.igx-fig-s'), 'the shared tile\'s three lines');
    }
    assert.equal(t[3].querySelector('.igx-fig-t').textContent, w.i18t('exp_fit_lead_t'));
  });
  test('2b the old in-card fact line is gone — the figures are said once, in the strip', () => {
    const host = mount(world(BOOK()));
    assert.equal(host.querySelectorAll('.exp-pg-fact, .exp-pg-facts').length, 0);
    assert.equal(host.querySelectorAll('[data-exp-go="two"]').length, 1, 'one door onto two-or-more');
  });
  test('2c the figures are the readings: any, two, unread off the grid, lead off exposureData', () => {
    const w = world(BOOK());
    const host = mount(w);
    const d = w.exposureData(), G = w.exposureGridData('cat', d);
    const n = el => el.querySelector('.igx-fig-n').textContent;
    const t = tiles(host);
    assert.equal(n(t[0]), String(G.any.n));
    assert.equal(n(t[1]), String(G.two.n));
    assert.equal(n(t[2]), String(G.unread.n));
    const lead = d.rows.find(r => r.k === d.lead);
    assert.ok(lead && lead.n, 'the fixture has a lead');
    assert.equal(n(t[3]), String(lead.n), 'the lead row\'s own count');
    assert.equal(t[3].getAttribute('data-exp-cell'), d.lead);
    assert.ok(t[3].querySelector('.igx-fig-s').textContent.startsWith(lead.title), 'and it names the row');
  });
  test('2d the lead tile is not a score: no tone, no ruby, no score word, and ruby stays the bar alone', () => {
    const w = world(BOOK());
    const host = mount(w);
    const strip = host.querySelector('.igx-figs');
    assert.equal(strip.querySelectorAll('.igx-bad, .igx-warn, .igx-good').length, 0, 'no tile wears a verdict');
    assert.ok(!/--st-ruby/.test(strip.innerHTML), 'ruby on this page is the lead\'s bar alone');
    assert.ok(!/score|rating|grade|risk level|index|out of 100/i.test(strip.outerHTML));
    const ruby = [...host.querySelectorAll('.exp-pg-rl')].filter(el => /--st-ruby-fg/.test(el.getAttribute('style')));
    assert.equal(ruby.length, 1, 'still exactly one ruby bar');
    const why = w.i18t('exp_fit_lead_why_v') + ' ' + w.i18t('exp_fit_lead_why_n');
    assert.ok(!/score|rating|grade|worst|risk/i.test(why), 'the hover says which row leads, not how bad');
  });
  test('2e each tile keeps its door: at least one and unread pick their row; two or more opens Contracts', () => {
    const w = world(BOOK().concat([C('U1', 5, 'customer', 'sales', 'Brian', ['liab'], false)]));
    const host = mount(w);
    tiles(host)[0].click();
    assert.equal(host.querySelector('.exp-pg-sel-t').textContent, w.i18t('exp_pg_any'));
    tiles(host)[2].click();
    assert.equal(host.querySelector('.exp-pg-sel-t').textContent, w.i18t('int_exp_unread'));
    tiles(host)[1].click();
    assert.deepEqual(w.__shown[0].ids, ['K3', 'S1', 'S3'], 'two or more of the five, into Contracts');
  });
  test('2f the lead tile is a door that picks the lead row', () => {
    const w = world(BOOK());
    const host = mount(w);
    host.querySelector('[data-exp-cell="autorenew"][data-exp-g="c:customer"]').click();
    assert.notEqual(host.querySelector('.exp-pg-sel-t').textContent, w.exposureData().rows[0].title, 'the fixture moved the pick');
    tiles(host)[3].click();
    const d = w.exposureData();
    assert.equal(host.querySelector('.exp-pg-sel-t').textContent, d.rows.find(r => r.k === d.lead).title);
    assert.equal(host.querySelector('.exp-pg-lbl').textContent, w.i18t('exp_pg_every'), 'every group of it');
    assert.equal(w.__shown.length, 0, 'it picks in the page; it does not leave it');
  });
  test('2g nothing carried: no door onto nothing, and the lead tile says so without a figure', () => {
    const w = world([C('Z1', 5, 'supplier', 'proc', 'Grace', [], true)]);
    const host = mount(w);
    const t = tiles(host);
    assert.equal(t.length, 4, 'the strip keeps its four places');
    assert.ok(t.every(x => x.tagName !== 'BUTTON'), 'a zero is never a door');
    assert.equal(t[3].querySelector('.igx-fig-n').textContent, '—', 'an absence is a dash, never a zero lead');
    assert.equal(w.exposureData().lead, null);
  });
  test('2h money obeys canViewValues on the tiles too', () => {
    const shown = mount(world(BOOK()));
    assert.match(shown.querySelector('.igx-figs').textContent, /KES/, '[control] shown where values are');
    const hidden = mount(world(BOOK(), { money: false }));
    assert.ok(!/KES/.test(hidden.querySelector('.igx-figs').textContent), 'no money on a tile for a reader without values');
    assert.equal(hidden.querySelector('[data-exp-lead]').getAttribute('title'), world(BOOK(), { money: false }).i18t('exp_fit_lead_why_n'),
      'and the lead is explained by count, as it is ranked');
  });
});

describe('f438 (3) the grid fills its card; the list scrolls inside its', () => {
  test('3a the grid sits in .igx-fill and its rows share the height: the five and the two under the rule stretch, the head and the rule do not', () => {
    const w = world(BOOK());
    const host = mount(w);
    const fill = host.querySelector('.exp-pg-main > .igx-fill');
    assert.ok(fill && fill.querySelector(':scope > .exp-pg-mx'), 'the grid grows into the card');
    const rows = host.querySelector('.exp-pg-mx').getAttribute('style');
    const m = rows.match(/grid-template-rows:\s*auto\s+repeat\((\d+),\s*minmax\([^,]+,\s*1fr\)\)\s+auto\s+repeat\(2,\s*minmax\([^,]+,\s*1fr\)\)/);
    assert.ok(m, 'head · the five · the rule · at least one and not read: ' + rows);
    assert.equal(Number(m[1]), w.exposureData().rows.length);
  });
  test('3b the cells stretch to their row — no fixed height left to open a gap', () => {
    const css = code(HTML);
    const cell = css.match(/\n\s*\.exp-pg-cell\{([^}]*)\}/);
    assert.ok(cell);
    assert.ok(!/(^|;)height:\d/.test(cell[1]), 'no fixed square height');
    assert.match(cell[1], /align-self:stretch/);
    const tot = css.match(/\n\s*\.exp-pg-tot\{([^}]*)\}/);
    assert.match(tot[1], /align-self:stretch/);
    assert.ok(!/button\.exp-pg-tot\{[^}]*height:/.test(css), 'the total is as tall as its row');
    assert.match(css, /\.exp-pg-mx\{flex:1 0 auto/);
  });
  test('3c the side list is an .igx-scroll between a fixed head and the door, which stays at the foot', () => {
    const host = mount(world(BOOK()));
    const side = host.querySelector('aside.exp-pg-side');
    const kids = [...side.children];
    const sc = side.querySelector(':scope > .igx-scroll');
    assert.ok(sc, 'the list scrolls inside its card');
    assert.equal(sc.id, 'exp-pg-list', 'a scroller carries an id');
    assert.ok(sc.querySelector('[data-exp-one]'), 'the rows are inside the scroller');
    const door = side.querySelector(':scope > [data-exp-open]');
    assert.ok(door, 'the door is the card\'s own, not the scroller\'s');
    assert.equal(kids[kids.length - 1], door, 'and it is last — at the foot');
    assert.ok(kids.indexOf(sc) < kids.indexOf(door));
    assert.match(code(HTML), /\.exp-pg-list\{[^}]*align-content:start/, 'a short list sits at the top, rows never stretched');
  });
  test('3d the list draws a long page now that it scrolls, and a cap is still said', () => {
    const many = [];
    for (let i = 0; i < 14; i++) many.push(C('P' + i, 100 + i, 'supplier', 'proc', 'Grace', ['price'], true));
    const w = world(many);
    const host = mount(w);
    assert.equal(host.querySelectorAll('#exp-pg-list [data-exp-one]').length, 14, 'more than the old eight');
    assert.ok(!host.querySelector('.exp-pg-more'), 'nothing left out, nothing said');
    assert.ok(w.EXP_PG_LIST >= 14);
    const lots = [];
    for (let i = 0; i < w.EXP_PG_LIST + 3; i++) lots.push(C('Q' + i, 100 + i, 'supplier', 'proc', 'Grace', ['price'], true));
    const w2 = world(lots);
    const h2 = mount(w2);
    const more = h2.querySelector('#exp-pg-list .exp-pg-more');
    assert.ok(more, 'past the cap the rest are counted inside the scroller');
    assert.match(more.textContent, /3/);
  });
});

describe('f438 (4) the old frame is retired, and nothing wins by force', () => {
  test('4a the rules the grammar replaced are gone', () => {
    const css = code(HTML);
    for (const re of [/\.exp-pg\{container:/, /\.exp-pg-cols\{/, /@container exp-pg/, /\.exp-pg-card\{/, /\.exp-pg-facts\{/, /\.exp-pg-fact\{/])
      assert.ok(!re.test(css), String(re));
    assert.ok(!/exp-pg-card\b/.test(INTEL_C), 'and nothing draws the old card class');
  });
  test('4b [wall] the Exposure block carries no !important', () => {
    const a = HTML.indexOf('Insights → Exposure: THE PATTERN GRID');
    assert.ok(a > 0);
    const b = HTML.indexOf('.exp-pg-empty', a);
    assert.ok(!/!important/.test(HTML.slice(a, b + 200)));
  });
  test('4c [wall] the renderer still counts nothing (f432 7c, f321 7a hold)', () => {
    const draw = INTEL_C.slice(INTEL_C.indexOf('function exposureHtml'), INTEL_C.indexOf('function exposureWire'));
    assert.equal((draw.match(/exposureData\(\)/g) || []).length, 1);
    assert.ok(!/\.filter\(|\.reduce\(|fxHome\(/.test(draw));
  });
  test('4d every exp_fit_ key is in both books', () => {
    const keys = [...new Set(INTEL.match(/exp_fit_[a-z_]+/g) || [])];
    assert.ok(keys.length >= 9, keys.join());
    for (const k of keys) assert.equal((I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k);
  });
});
