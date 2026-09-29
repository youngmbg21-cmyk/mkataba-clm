/* ============================================================
   F434 — INSIGHTS → PORTFOLIO FITS THE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026)
   ============================================================
   The owner picked the "Fit to Screen" layout by name and said build:
   "Make the pages fit with a page and for the cards to fit together without
   cards being taller than other cards and not covering spaces fully. The pages
   should look balanced and professional." Then: "Exclude money held too, keep
   Copilot's answers."

   What each claim below pins (f433 pins the shared grammar itself; this is
   Portfolio's use of it, and portfolio-frame-verify measures the real page):
     1  the grid: the page is ONE `.igx-fit` whose rows are the figures strip,
        then two rows of cards sharing the height 1.1 : 1 — the renewal runway
        (8 parts) beside Value by stage (4), then Where the value sits (6)
        beside the risk map (6); every card is an `.igx-card` whose body grows
     2  the four headline figures are the shared tile, one strip
     3  the amber "cannot be grouped yet" strip and the filter chips each take
        an `auto` row of their own above the figures — and only when they apply
     4  in a PROJECT workspace the workload runway, won and lost, money held
        back and promises still live are NOT drawn, while every one of them is
        still counted and served to Copilot exactly as before
     5  Value by stage carries a share bar under each stage row, in the stage's
        own colour, measured against the largest stage
     6  with no renewal runway the page keeps its two-row shape
     7  the charts are drawn at the height their card gives them
     8  the old page's own grid rules are retired, and the retired hint is
        inert in both books

   Red at the parent (616f3b30): every claim except those marked [wall], which
   pass on both sides by design. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const PF = strip(read('js/views/portfolio.js'));
const I18N = read('js/i18n.js');

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return iso(d); };
const rounds = n => Array.from({ length: n }, (_, k) => ({ n: k + 1, status: 'closed' }));

/* Standing agreements (they end, so the renewal runway has something to draw)
   and three pieces of PROJECT work — retention, a defects period, one lost —
   so every one of the four project panels has something to count. */
const BOOK = () => [
  { id: 'MK-S1', name: 'Supply', counterparty: 'Kabras', status: 'Signed', value: 9000000, rounds: rounds(3),
    expiry: day(40), metadata: { category: 'supply', renewalType: 'auto-renew' },
    scan: { findings: [{ id: 'h1', sev: 'high' }], dismissed: [] } },
  { id: 'MK-S2', name: 'Services', counterparty: 'Naivas', status: 'Under Review', value: 5000000, rounds: rounds(1),
    expiry: day(200), metadata: { category: 'services', renewalType: 'fixed' } },
  { id: 'MK-S3', name: 'Lease', counterparty: 'Britam', status: 'Draft', value: 2000000, rounds: [],
    expiry: day(300), metadata: { category: 'lease', renewalType: 'fixed' } },
  { id: 'MK-J1', name: 'Kilimani block', counterparty: 'Kilimani Homes', status: 'Signed', value: 6000000, rounds: rounds(2),
    expiry: day(-30), metadata: { category: 'works', effectiveDate: day(-200), expiryDate: day(-30),
      retentionPct: 10, retentionReleaseDays: 90, warrantyMonths: 12 } },
  { id: 'MK-J2', name: 'Runda court', counterparty: 'Runda Estates', status: 'Under Review', value: 4000000, rounds: [],
    expiry: day(120), metadata: { category: 'works', effectiveDate: day(-10), expiryDate: day(120),
      retentionPct: 5, warrantyMonths: 6 } },
  { id: 'MK-J3', name: 'Machakos villas', counterparty: 'Machakos Devs', status: 'Declined', value: 1500000, rounds: [],
    expiry: day(90), metadata: { category: 'works', effectiveDate: day(-20), expiryDate: day(90), retentionPct: 5 } },
];

function world(over = {}) {
  const shapes = over.shapes || ['standing', 'project'];
  const w = loadViews(
    ['js/negotiation.js', 'js/obligations.js', 'js/family.js', 'js/aichart.js', 'js/workshape.js',
     'js/views/portfolio.js'],
    Object.assign({
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      state: { contracts: over.book || BOOK(), settings: {}, view: 'intel', serverStats: null,
        shareOverview: {}, shareByContract: {}, aiFeed: [], pf: null },
      intel: { tab: 'frame' },
      cKind: () => 'Agreement',
      openFindings: c => (c && c.scan ? (c.scan.findings || []).filter(f => !(c.scan.dismissed || []).includes(f.id)) : []),
      canViewValues: () => true, allObligations: () => [],
      effectiveExpiry: c => c.expiry || null, metaOptLabel: k => k,
      STATUS_META: { 'Draft': { dot: 'var(--st-gray-dot)' }, 'Under Review': { dot: 'var(--st-amber-dot)' },
        'Signed': { dot: 'var(--st-green-dot)' } },
      statusLabel: s => ({ 'Draft': 'Drafting', 'Under Review': 'In Review', 'Signed': 'Executed' }[s] || s),
      getOrg: () => ({ workShape: { shapes, word: 'job' } }),
      fmtMoneyShort: n => 'KES ' + Math.round(n / 1e6) + 'M',
      daysUntil: s => { const t = Date.parse(String(s) + 'T00:00:00');
        return Number.isFinite(t) ? Math.round((t - new Date(new Date().setHours(0, 0, 0, 0))) / 86400000) : null; },
      regShowOnly: () => {},
    }, over.env || {}));
  w.renewalDecided = () => false;
  return w;
}

/* The page as a document, so the checks read its STRUCTURE rather than
   matching strings. The views' own world has a stand-in document that lays
   nothing out and parses nothing, so the drawn string is parsed by jsdom. */
const { JSDOM } = require('jsdom');
function page(w) {
  const doc = new JSDOM('<!doctype html><div id="ig-frame"></div>').window.document;
  const host = doc.getElementById('ig-frame');
  host.innerHTML = w.portfolioFrameHtml();
  return host;
}
const fit = host => host.querySelector('.igx-fit');
const rowsOf = host => [...(fit(host) ? fit(host).children : [])].filter(el => el.classList.contains('igx-row'));
const cardTitles = row => [...row.children].map(c => {
  const t = c.querySelector('span'); return t ? t.textContent.trim() : '';
});
const styleVar = (el, name) => {
  const m = new RegExp(name + ':([^;"]+)').exec(el.getAttribute('style') || '');
  return m ? m[1].trim() : null;
};

describe('F434 (1) — one grid: figures, then two rows of cards sharing the height', () => {
  test('the page is one .igx-fit whose rows are the figures and two card rows at 1.1 : 1', () => {
    const host = page(world());
    assert.ok(fit(host), 'the page wears the shared grid');
    assert.equal(styleVar(fit(host), '--igx-rows'), 'auto minmax(0,1.1fr) minmax(auto,1fr)');
    const kids = [...fit(host).children];
    assert.ok(kids[0].classList.contains('igx-figs'), 'the figures strip comes first');
    assert.equal(rowsOf(host).length, 2, 'then exactly two rows of cards');
  });
  test('row 1: the renewal runway (8 parts) beside Value by stage (4)', () => {
    const [r1] = rowsOf(page(world()));
    assert.equal(styleVar(r1, '--igx-cols'), 'minmax(0,8fr) minmax(0,4fr)');
    assert.deepEqual(cardTitles(r1), ['The renewal runway', 'Value by stage']);
  });
  test('row 2: Where the value sits (6) beside the risk map (6)', () => {
    const [, r2] = rowsOf(page(world()));
    assert.equal(styleVar(r2, '--igx-cols'), 'minmax(0,6fr) minmax(0,6fr)');
    assert.deepEqual(cardTitles(r2), ['Where the value sits', 'The risk map']);
  });
  test('every card fills its cell and its body is the part that grows', () => {
    const host = page(world());
    const cards = rowsOf(host).flatMap(r => [...r.children]);
    assert.equal(cards.length, 4);
    for (const c of cards) {
      assert.ok(c.classList.contains('igx-card'), 'a card wears .igx-card');
      assert.ok(c.querySelector(':scope > .igx-fill'), 'and grows through .igx-fill');
    }
  });
  test('the two row lists scroll inside their card rather than stretching the page', () => {
    const host = page(world());
    assert.ok(host.querySelector('[data-pf-cat]').closest('.igx-scroll'), 'the categories');
    assert.ok(host.querySelector('[data-pf-stage]').closest('.igx-scroll'), 'the stages');
  });
});

describe('F434 (2) — the headline figures are the shared tile', () => {
  test('one .igx-figs strip of .igx-fig tiles, the book first as the hero, every figure still a door', () => {
    const host = page(world());
    const figs = host.querySelector('.igx-figs');
    assert.ok(figs);
    const tiles = [...figs.children];
    assert.equal(styleVar(figs, '--igx-n'), String(tiles.length));
    assert.ok(tiles.every(t => t.classList.contains('igx-fig')));
    assert.ok(tiles[0].classList.contains('is-hero'));
    assert.deepEqual(tiles.map(t => t.getAttribute('data-pf-go')), ['book', 'soon', 'auto', 'past']);
    assert.ok(tiles.every(t => t.tagName === 'BUTTON'), 'a tile with a list behind it is a button');
  });
  test('the tone colours the figure only', () => {
    const host = page(world());
    const n = k => host.querySelector(`[data-pf-go="${k}"] .igx-fig-n`);
    assert.ok(n('soon').classList.contains('igx-warn'));
    assert.ok(n('past').classList.contains('igx-bad'));
  });
});

describe('F434 (3) — the amber strip and the chips each take a row of their own, only when they apply', () => {
  test('a book with every contract grouped draws no strip and no extra row', () => {
    const host = page(world());
    assert.ok(!host.querySelector('[data-pf-fixcats]'));
    assert.equal(styleVar(fit(host), '--igx-rows').split(' ').filter(x => x === 'auto').length, 1);
  });
  test('an uncategorised contract brings the strip back, above the figures, in an auto row', () => {
    const book = BOOK(); book[1].metadata.category = '';
    const host = page(world({ book }));
    const kids = [...fit(host).children];
    assert.ok(kids[0].querySelector('[data-pf-fixcats]'), 'the strip is the first row');
    assert.ok(kids[1].classList.contains('igx-figs'), 'the figures come under it');
    assert.match(kids[0].textContent, /cannot be grouped yet/);
    assert.equal(styleVar(fit(host), '--igx-rows'), 'auto auto minmax(0,1.1fr) minmax(auto,1fr)');
  });
  test('a focused page draws its chips in a row of their own too', () => {
    const w = world(); w.pfState().stage = 'Signed';
    const host = page(w);
    assert.ok([...fit(host).children][0].querySelector('[data-pf-unfilter="stage"]'));
    assert.equal(styleVar(fit(host), '--igx-rows'), 'auto auto minmax(0,1.1fr) minmax(auto,1fr)');
  });
});

describe('F434 (4) — the four project cards are not drawn; Copilot still answers about them', () => {
  const GONE = [['workload_runway', 'The workload runway'], ['won_and_lost', 'Jobs won and lost'],
    ['money_held_back', 'Money held back'], ['promises_live', 'Promises still live']];
  test('in a workspace that does project work, none of the four is on the page', () => {
    const w = world();
    assert.equal(w.wsHas('project'), true, 'the workspace does project work');
    const text = page(w).textContent;
    for (const [, title] of GONE) assert.ok(!text.includes(title), title + ' is still drawn');
  });
  test('[wall] every one of them is still counted, with something to say, for Copilot', () => {
    const w = world();
    for (const [k] of GONE) {
      const d = w.pfPanelData(k);
      assert.equal(d.found, true, k + ' is still served');
      assert.equal(d.drawn, true, k + ' still has something to say about this book');
    }
    assert.deepEqual([...w.pfPanelsForShape()].sort(),
      ['money_held_back', 'promises_live', 'renewal_runway', 'won_and_lost', 'workload_runway']);
    assert.deepEqual(Object.keys(w.pfPanelsData()).sort(),
      ['money_held_back', 'promises_live', 'renewal_runway', 'won_and_lost', 'workload_runway']);
  });
  test('the renderers are kept with no caller on the page', () => {
    const body = PF.slice(PF.indexOf('function portfolioFrameHtml'), PF.indexOf('function pfBindCp'));
    assert.ok(body.length > 200);
    for (const fn of ['pfWorkloadRunway', 'pfWonLost', 'pfMoneyHeld', 'pfPromisesLive'])
      assert.ok(!new RegExp('\\b' + fn + '\\(').test(body), fn + ' is still called by the page');
    const w = world();
    assert.match(w.pfWorkloadRunway(), /The workload runway/, 'and still draws what it drew');
  });
});

describe('F434 (5) — Value by stage carries a share bar under each stage', () => {
  test('one bar per stage, in the stage\'s own dot colour, measured against the largest stage', () => {
    const w = world();
    const host = page(w);
    const d = w.pfStageData();
    const max = Math.max(...d.rows.map(r => r.v));
    const rows = [...host.querySelectorAll('[data-pf-stage]')];
    assert.equal(rows.length, 3);
    rows.forEach(b => {
      const r = d.rows.find(x => x.k === b.getAttribute('data-pf-stage'));
      const bar = b.querySelector('.pf-track > span');
      assert.ok(bar, r.k + ' has a bar');
      const st = bar.getAttribute('style');
      assert.ok(st.includes('background:' + r.tone), r.k + ' wears its own colour');
      assert.ok(st.includes('width:' + Math.max(2, Math.round(r.v / max * 100)) + '%'), r.k + ' is measured against the largest');
    });
  });
  test('and says each stage\'s share of the book beside its count', () => {
    const host = page(world());
    const signed = host.querySelector('[data-pf-stage="Signed"]').textContent.replace(/\s+/g, ' ');
    assert.match(signed, /Executed · 2 contracts · \d+%/);
  });
});

describe('F434 (6) — with no renewal runway the page keeps its two-row shape', () => {
  test('a workspace that does only project work: Where the value sits takes the runway\'s place, the map the bottom row', () => {
    const host = page(world({ shapes: ['project'] }));
    const [r1, r2] = rowsOf(host);
    assert.equal(rowsOf(host).length, 2);
    assert.equal(styleVar(r1, '--igx-cols'), 'minmax(0,8fr) minmax(0,4fr)');
    assert.deepEqual(cardTitles(r1), ['Where the value sits', 'Value by stage']);
    assert.deepEqual(cardTitles(r2), ['The risk map']);
    assert.equal(styleVar(fit(host), '--igx-rows'), 'auto minmax(0,1.1fr) minmax(auto,1fr)');
  });
});

describe('F434 (7) — the charts take the height their card gives them', () => {
  test('the risk map is drawn at the height asked, never below its floor', () => {
    const w = world();
    const d = w.pfRiskData();
    const tall = w.pfRiskSvg(d, 600, 400);
    assert.match(tall, /height="400"/);
    assert.match(tall, /data-h="400"/);
    assert.match(w.pfRiskSvg(d, 600, 40), new RegExp(`height="${(PF.match(/PF_RISK_H_MIN = (\d+)/) || [])[1]}"`), 'a floor, so the axis words still read');
  });
  test('the map box and the runway grow only where the page fits the screen', () => {
    const css = (page(world()).querySelector('style') || {}).textContent || '';
    const wide = (css.match(/@media \(min-width:1080px\)\{([\s\S]*?)\n\s*\}/) || [])[1] || '';
    // the map's box never shrinks under the map's own floor, and its card asks the
    // row for that room (the row is minmax(auto,…)) — or the map draws over its key
    assert.match(wide, /#pf-risk-plot\{flex:1 1 0;min-height:140px\}/);
    assert.match(wide, /\.igx-card:has\(#pf-risk-plot\)\{min-height:min-content\}/);
    assert.match(wide, /\.pf-run\{flex:1 1 0;min-height:0;grid-template-rows:minmax\(0,1fr\) auto\}/);
    assert.match(PF, /getComputedStyle\(host\)\.flexBasis==='0px'/, 'the map asks its box whether it grows');
  });
});

describe('F434 (8) — the old grid rules are retired; the retired hint is inert', () => {
  test('.pf-grid, .pf-6-6, .pf-8-4, .pf-ov2, .pf-figs and .pf-kpi are gone from the page', () => {
    for (const re of [/pf-grid/, /pf-6-6/, /pf-8-4/, /pf-ov2/, /pf-figs/, /pf-kpi/])
      assert.ok(!re.test(PF), 'still in the code: ' + re);
  });
  test('"Press a row to focus the page on it" is no longer printed (each row says it on its hover)', () => {
    const host = page(world());
    assert.ok(!host.textContent.includes('Press a row to focus the page on it'));
    assert.match(host.querySelector('[data-pf-cat]').getAttribute('title'), /Focus the whole page on/i);
  });
  test('[wall] its words stay inert in BOTH books', () => {
    assert.equal((I18N.match(/\n {4}pf_ov_press_row:/g) || []).length, 2);
  });
});
