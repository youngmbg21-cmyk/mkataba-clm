/* ============================================================
   F429 — INSIGHTS → PORTFOLIO IS THE OVERVIEW (Young ruled it 28 Sep 2026)
   ============================================================
   Picked BY NAME off the design-options page ("Overview"), with the owner's
   own asks: "kill the bottom 3 cards" — What this slice says, What needs
   attention and the grey note under them — then "build".

   What the Overview is, and what each claim below pins:
     1  the three cards are GONE — not stubbed, not published, not drawn;
        their words stay inert in both books (the product's way of retiring
        a sentence)
     2  headline figures, each a DOOR onto exactly the contracts that make it,
        drawn only where it is not zero — and "past its end date", the one
        fact worth saving from the removed cards, is one of them, read
        through the product's own `contractExpired`
     3  a new card, Value by stage, plain counting off the records, and the
        stage as a third filter across the page (each card keeps its own axis)
     4  the risk map is coloured by what Copilot FOUND on record — ruby, amber,
        green — and HOLLOW where the contract has not been read, never by the
        old risk score
     5  the renewal runway opens with its answer and every month with
        something in it is a door; Copilot's copy of the panel carries no id
        lists (it rides with every message)
     6  every new word is in both books

   Red at the parent: every claim except the ones marked [wall]/[control],
   which pass on both sides by design. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const PF_SRC = read('js/views/portfolio.js');
const PF = strip(PF_SRC);
const I18N = read('js/i18n.js');

const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off); return iso(d); };
const rounds = n => Array.from({ length: n }, (_, k) => ({ n: k + 1, status: 'closed' }));
const F = (id, sev) => ({ id, sev, title: 'Finding ' + id });

/* A book with every case the Overview draws differently: an expired signed
   contract, two ending within ninety days (one decided), an auto-renewal,
   three stages, and the four states a risk-map dot can be in. */
const BOOK = () => [
  { id: 'MK-HI', name: 'Supply', counterparty: 'Kabras', status: 'Signed', value: 9000000, rounds: rounds(3),
    expiry: day(30), metadata: { category: 'supply', renewalType: 'auto-renew' },
    scan: { findings: [F('h1', 'high'), F('m1', 'med')], dismissed: [] } },
  { id: 'MK-SOME', name: 'Services', counterparty: 'Naivas', status: 'Under Review', value: 5000000, rounds: rounds(1),
    expiry: day(60), metadata: { category: 'services' },
    scan: { findings: [F('m2', 'med')], dismissed: [] } },
  { id: 'MK-OK', name: 'Lease', counterparty: 'Britam', status: 'Signed', value: 4000000, rounds: rounds(2),
    expiry: day(400), metadata: { category: 'lease' }, scan: { findings: [], dismissed: [] } },
  { id: 'MK-NEW', name: 'Works', counterparty: 'KenGen', status: 'Draft', value: 3000000, rounds: [],
    expiry: day(500), metadata: { category: 'works' } },
  { id: 'MK-OLD', name: 'Old cleaning', counterparty: 'Bidco', status: 'Signed', value: 2000000, rounds: rounds(1),
    expiry: day(-30), metadata: { category: 'services' }, scan: { findings: [], dismissed: [] } },
  { id: 'MK-NDA', name: 'NDA', counterparty: 'Twiga', status: 'Signed', value: 0, valueType: 'none', rounds: [],
    expiry: day(700), metadata: { category: 'nda' } },
  { id: 'MK-GONE', name: 'Declined', counterparty: 'Ghost', status: 'Declined', value: 99000000, rounds: [],
    expiry: day(40), metadata: { category: 'supply' } },
];

function world(over = {}) {
  const calls = { door: [] };
  const w = loadViews(
    ['js/negotiation.js', 'js/obligations.js', 'js/family.js', 'js/aichart.js', 'js/workshape.js',
     'js/views/portfolio.js'],
    Object.assign({
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS,
      state: { contracts: BOOK(), settings: {}, view: 'intel', serverStats: null,
        shareOverview: {}, shareByContract: {}, aiFeed: [], pf: null },
      intel: { tab: 'frame' },
      cKind: () => 'Agreement',
      /* the risk scan's own reading, as js/ai.js writes it */
      openFindings: c => (c && c.scan ? (c.scan.findings || []).filter(f => !(c.scan.dismissed || []).includes(f.id)) : []),
      canViewValues: () => true, allObligations: () => [],
      effectiveExpiry: c => c.expiry || null, metaOptLabel: k => k,
      STATUS_META: { 'Draft': { dot: 'var(--st-gray-dot)' }, 'Under Review': { dot: 'var(--st-amber-dot)' },
        'Signed': { dot: 'var(--st-green-dot)' } },
      statusLabel: s => ({ 'Draft': 'Drafting', 'Under Review': 'In Review', 'Signed': 'Executed' }[s] || s),
      getOrg: () => ({ workShape: { shapes: ['standing'], word: 'job' } }),
      fmtMoneyShort: n => 'KES ' + Math.round(n / 1e6) + 'M',
      daysUntil: s => { const t = Date.parse(String(s) + 'T00:00:00');
        return Number.isFinite(t) ? Math.round((t - new Date(new Date().setHours(0, 0, 0, 0))) / 86400000) : null; },
      regShowOnly: (ids, label) => calls.door.push({ ids: ids.slice(), label }),
    }, over));
  /* js/obligations.js declares the real renewalDecided as it loads, so the
     stand-in is put in place AFTER, where the bare call finds it. */
  w.renewalDecided = over.renewalDecided || (c => c.id === 'MK-SOME');
  w.__calls = calls;
  return w;
}

describe('F429 (1) — the three bottom cards are gone', () => {
  test('What this slice says, What needs attention and the note are not in the code', () => {
    for (const re of [/function pfReadout\b/, /function pfFindings\(/, /function pfSentences\b/,
      /function pfFindingsFoot\b/, /PF_FINDINGS_PAGE/, /data-pf-find-page/, /pf_honesty_note/,
      /i18t\('pf_says'\)/, /i18t\('pf_needs_attention'\)/])
      assert.ok(!re.test(PF), 'still in the code: ' + re);
  });
  test('and not published, so no window key reads as available and throws', () => {
    const w = world();
    for (const k of ['pfReadout', 'pfFindings', 'pfSentences', 'pfFindingsFoot', 'PF_FINDINGS_PAGE'])
      assert.equal(typeof w[k], 'undefined', k + ' is still published');
  });
  test('and the drawn page says none of their words', () => {
    const w = world();
    const html = w.portfolioFrameHtml();
    for (const k of ['pf_says', 'pf_needs_attention', 'pf_honesty_note', 'pf_says_foot', 'pf_findings_foot']) {
      const en = (I18N.match(new RegExp('\\n    ' + k + ": '([^']*)'")) || [])[1];
      assert.ok(en && !html.includes(en), k + ' is still drawn');
    }
  });
  test('[wall] their words stay inert in BOTH books — retired, never deleted', () => {
    for (const k of ['pf_says', 'pf_needs_attention', 'pf_honesty_note', 'pf_findings_range'])
      assert.equal((I18N.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k + ' must stay in both books');
  });
});

describe('F429 (2) — headline figures, each a door', () => {
  test('four tiles: the book, what ends within 90 days, what renews itself, what is past its end date', () => {
    const w = world();
    const html = w.pfFigures();
    for (const k of ['book', 'soon', 'auto', 'past'])
      assert.match(html, new RegExp(`data-pf-go="${k}"`), k + ' is a door');
    assert.match(html, /Past its end date/);
  });
  test('"past its end date" is the product\'s own derived stage — contractExpired — not a second rule', () => {
    const w = world({ contractExpired: c => c.id === 'MK-OK' });
    const d = w.pfHeadlineData();
    assert.deepEqual([...d.past.ids], ['MK-OK'], 'the tile counts exactly what contractExpired says');
  });
  test('each door opens Contracts narrowed to EXACTLY the contracts that make the figure', () => {
    const w = world();
    w.pfFigures();
    assert.equal(w.pfGoDoor('past'), true);
    assert.deepEqual(w.__calls.door[0].ids, ['MK-OLD'], 'the one signed contract whose end date has gone');
    w.pfGoDoor('soon');
    assert.deepEqual(w.__calls.door[1].ids.slice().sort(), ['MK-HI', 'MK-SOME'], 'the two that end within 90 days');
    w.pfGoDoor('book');
    assert.ok(!w.__calls.door[2].ids.includes('MK-GONE'), 'a Declined contract is not in the book');
  });
  test('a zero is not a door — the tile is not drawn at all', () => {
    const w = world({ contractExpired: () => false });
    const html = w.pfFigures();
    assert.ok(!/data-pf-go="past"/.test(html) && !/Past its end date/.test(html));
    assert.equal(w.pfGoDoor('past'), false, 'nothing recorded, nothing opens');
  });
  test('what ends soon says whether anybody has decided', () => {
    const w = world();
    const d = w.pfHeadlineData();
    assert.equal(d.soon.open, 1, 'one of the two has a decision on record');
    assert.match(w.pfSoonSay(d), /nothing filed on 1/);
    const all = world({ renewalDecided: () => true });
    assert.match(all.pfSoonSay(all.pfHeadlineData()), /all decided/);
  });
});

describe('F429 (3) — Value by stage, and the stage crosses the page', () => {
  test('a card of its own, the stages in lifecycle order in the list\'s own words and dots', () => {
    const w = world();
    const html = w.pfValueByStage();
    assert.match(html, /Value by stage/);
    const order = [...html.matchAll(/data-pf-stage="([^"]+)"/g)].map(m => m[1]);
    assert.deepEqual(order, ['Draft', 'Under Review', 'Signed']);
    assert.match(html, /Drafting[\s\S]*In Review[\s\S]*Executed/);
    assert.match(html, /var\(--st-green-dot\)/, 'Executed wears the list\'s own green');
  });
  test('pressing a stage narrows the rest of the page and the stage card keeps its axis', () => {
    const w = world();
    w.pfState().stage = 'Signed';
    assert.ok(w.pfRows(null).every(c => c.status === 'Signed'), 'the page narrows');
    /* joined: an array born inside the stage has that realm's prototype */
    assert.equal(w.pfStageData().rows.map(r => r.k).join('|'), 'Draft|Under Review|Signed', 'its own axis is whole');
    assert.match(w.portfolioFrameHtml(), /data-pf-unfilter="stage"/, 'and the choice is a chip you can undo');
  });
  /* RE-POINTED IN PLACE 29 Sep 2026 (Fit to Screen, owner-picked by name): the
     three question cards no longer share one row — Value by stage sits beside
     the renewal runway and Where the value sits beside the risk map. f434 pins
     the grid itself; this keeps the claim that all three are drawn, in the
     picture's reading order. */
  test('the frame draws Value by stage, Where the value sits and the risk map, in the picture\'s order', () => {
    const w = world();
    const html = w.portfolioFrameHtml();
    const at = s => html.indexOf(s);
    assert.ok(at('Value by stage') > -1 && at('Where the value sits') > at('Value by stage')
      && at('The risk map') > at('Where the value sits'));
  });
});

describe('F429 (4) — the risk map is coloured by what Copilot found, never by a score', () => {
  test('four states off the scan on record', () => {
    const w = world();
    const by = id => w.pfFindState(w.state.contracts.find(c => c.id === id));
    assert.equal(by('MK-HI'), 'high');
    assert.equal(by('MK-SOME'), 'some');
    assert.equal(by('MK-OK'), 'none');
    assert.equal(by('MK-NEW'), null, 'no scan on record is NOT READ, not safe');
  });
  test('each dot wears its state; an unread one is hollow', () => {
    const w = world();
    const svg = w.pfRiskSvg(w.pfRiskData(), 600);
    const dot = cp => (svg.match(new RegExp(`data-pf-cp="${cp}"[\\s\\S]*?<circle[^>]*>`)) || [''])[0];
    assert.match(dot('Kabras'), /fill="var\(--st-ruby-dot\)"/);
    assert.match(dot('Naivas'), /fill="var\(--st-amber-dot\)"/);
    assert.match(dot('Britam'), /fill="var\(--st-green-dot\)"/);
    assert.match(dot('KenGen'), /fill="var\(--color-surface\)" stroke="var\(--color-neutral-400\)"/);
  });
  test('the old risk band is not asked', () => {
    const body = PF.slice(PF.indexOf('function pfFindState'), PF.indexOf('function pfRiskMap'));
    assert.ok(body.length > 100 && !/contractRisk|riskBand|riskPal/.test(body));
  });
  test('it opens with its answer, keys the four colours, and counts what it could not place', () => {
    const w = world();
    const html = w.pfRiskMap();
    assert.match(html, /1 contract<\/b> carries a high finding/);
    assert.match(html, /1 not read yet/);
    for (const s of ['A high finding open', 'Findings open', 'Read, nothing open', 'Not read yet'])
      assert.ok(html.includes(s), 'key: ' + s);
    assert.match(html, /1 contract with no value is not on the map/, 'the NDA is counted, not silently dropped');
  });
  test('[control] every dot is still the counterparty filter', () => {
    assert.match(PF_SRC, /data-pf-cp="\$\{pfEsc\(p\.c\.counterparty/);
  });
});

describe('F429 (5) — the renewal runway answers, and every month is a door', () => {
  test('the card opens with its answer, in one sentence', () => {
    const w = world();
    const html = w.pfRenewalRunway();
    assert.match(html, /class="pf-say"[^>]*>[\s\S]*ends in the next six months across/);
  });
  test('a month with something in it is a door onto exactly those contracts; an empty month is not', () => {
    const w = world();
    const d = w.pfRenewalRunwayData({ ids: true });
    const html = w.pfRenewalRunway();
    const doors = [...html.matchAll(/data-pf-go="m(\d+)"/g)].map(m => +m[1]);
    const full = d.buckets.filter(b => b.contracts > 0).map(b => b.offset);
    assert.equal(doors.join(','), full.join(','), 'one door per month that has contracts, none for an empty month');
    assert.ok(full.length >= 2);
    w.pfGoDoor('m' + full[0]);
    assert.equal(w.__calls.door[0].ids.join(','), d.buckets[full[0]].ids.join(','));
  });
  test('Copilot\'s copy carries no id lists — the panel rides with every message', () => {
    const w = world();
    const d = w.pfPanelData('renewal_runway');
    assert.ok(d.buckets.every(b => !('ids' in b)));
    assert.ok(d.totals.sixMonths && typeof d.totals.sixMonths.contracts === 'number', 'the answer is counted in the data');
  });
  test('[wall] the Copilot panel keys are unchanged', () => {
    const w = world();
    assert.deepEqual([...w.PF_PANEL_NAMES], ['workload_runway', 'money_held_back', 'promises_live', 'won_and_lost', 'renewal_runway']);
  });
});

describe('F429 (6) — every new word is in both books', () => {
  test('each pf_ov_ key the page asks for is defined in English and in Svenska', () => {
    const used = [...new Set(PF.match(/pf_ov_[a-z_]+/g) || [])];
    assert.ok(used.length > 20, 'the Overview speaks through its own keys');
    for (const k of used) {
      const n = (I18N.match(new RegExp('\\n    ' + k + '(_one|_other)?:', 'g')) || []).length;
      assert.ok(n >= 2 && n % 2 === 0, k + ' must be in both books');
    }
  });
});
