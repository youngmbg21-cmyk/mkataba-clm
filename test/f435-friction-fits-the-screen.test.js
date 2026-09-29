/* f435 — NEGOTIATION FRICTION FITS THE SCREEN (owner-picked "Fit to Screen", 29 Sep 2026)

   The owner: "Make the pages fit with a page and for the cards to fit together
   without cards being taller than other cards and not covering spaces fully.
   The pages should look balanced and professional." Before this the details
   panel ran far below the window while the ranked list stopped halfway down it.

   What is pinned here — the structure; friction-fits-the-screen-verify measures
   the painted page:
     1  Copilot's read is still FIRST, drawn by the same function (its output
        lands on the page verbatim), in a card of its own.
     2  The six figures are the shared grammar's tiles (.igx-figs / .igx-fig),
        in the same order, with the same doors; a zero is still no door and the
        amber figure still switches to the waiting list.
     3  ONE row (.igx-row) of two cards split 7:5 — the list and its panel —
        both .igx-card, so they share one height. The list's table scrolls
        inside its card; the panel keeps its head, figures and "how the asks
        ended" fixed and scrolls its long lists inside itself.
     4  The page is one .igx-fit grid: Copilot, figures, then the row taking
        what is left; the ledger's own strip, figure, card and stacking rules
        the grammar replaced are retired, and nothing wins by !important.
     5  A press on a row keeps the list where the reader had it.

   MEASURED AT THE PARENT (616f3b30, the grammar without this tab's layout):
   15 of 16 RED. The one that passes is the [control] — Copilot's read lands on
   the page exactly as its own builder draws it, which must be true on both
   sides because the read was not to be touched. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadViews, STUB_FOLDERS } = require('./dom');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const INTEL = read('js/views/intelligence.js');
const HTML = read('index.html');
const noComments = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
/* PIN THE REGION: a function's body runs to the next top-level function. */
const fnBody = (src, name) => {
  const at = src.search(new RegExp('\\n(?:async )?function ' + name + '\\('));
  if (at < 0) return '';
  const rest = src.slice(at + 1);
  const end = rest.slice(9).search(/\n(?:async )?function \w+\(/);
  return end < 0 ? rest : rest.slice(0, end + 9);
};
/* The ledger's own stylesheet block: from its heading to the next block. */
const ledgerCss = () => {
  const a = HTML.indexOf('INSIGHTS, NEGOTIATION FRICTION: THE CLAUSE LEDGER');
  assert.ok(a > 0, 'the ledger block is in the stylesheet');
  const b = HTML.indexOf('The Insights caption is a whole sentence', a);
  assert.ok(b > a, 'and ends where the caption rules begin');
  /* Spacing around braces and semicolons is the author's, not the rule's. */
  return noComments(HTML.slice(a, HTML.lastIndexOf('/*', b))).replace(/\s*([{};])\s*/g, '$1');
};

const ago = d => new Date(Date.now() - d * 86400000).toISOString();
const CH = (clause, status, side, over = {}) => ({ clauseLabel: clause, status, authorSide: side,
  withdrawn: false, createdAt: ago(20), resolvedAt: ago(18), ...over });
const deal = (id, cp, round, changes, over = {}) => ({ id, name: id + ' agreement', counterparty: cp,
  status: 'Under Review', negotiation: { round, startedAt: ago(40), rounds: [] }, changes, ...over });
/* A small book with every door live: signed deals, a round-1 signing, open refusals. */
const book = () => [
  deal('MK-1', 'Naivas', 4, [CH('Payment Terms', 'rejected', 'owner'), CH('Liability', 'accepted', 'owner')]),
  deal('MK-2', 'Naivas', 3, [CH('Payment Terms', 'accepted', 'counterparty'), CH('Liability', 'rejected', 'owner')],
    { status: 'Signed', execution: { at: ago(10) } }),
  deal('MK-3', 'Copia', 1, [CH('Governing Law', 'accepted', 'owner')], { status: 'Signed', execution: { at: ago(30) } }),
  deal('MK-4', 'Copia', 1, [CH('Governing Law', 'rejected', 'counterparty')], { status: 'Signed', execution: { at: ago(25) } }),
];
function stage(contracts) {
  return loadViews(['js/clausemodel.js', 'js/views/intelligence.js'], {
    state: { contracts, settings: {}, view: 'intel' },
    negoAllChanges: c => [...(c.negotiation.rounds || []).flatMap(r => r.changes || []), ...(c.changes || [])],
    FOLDERS: STUB_FOLDERS, TEMPLATES: {},
    getContract: id => contracts.find(c => c.id === id),
  });
}
const setLens = (s, lens) => { s.intel.frictionLedger = { lens, sel: { clauses: null, cps: null, wait: null } }; };
/* The markup of the element whose opening tag carries `cls`, as a string: from
   its tag to the matching close, counted by <div / </div> (the only nesting
   element these cards use at their top level). */
const blockOf = (html, re) => {
  const m = re.exec(html); if (!m) return '';
  let i = m.index, depth = 0;
  const tag = /<(\/?)div\b[^>]*>/g; tag.lastIndex = i;
  let t;
  while ((t = tag.exec(html))) {
    depth += t[1] ? -1 : 1;
    if (depth === 0) return html.slice(i, tag.lastIndex);
  }
  return html.slice(i);
};

describe('f435 (1) — Copilot\'s read is first, and its own', () => {
  test('the page is one .igx-fit grid that opens on Copilot\'s card', () => {
    const s = stage(book());
    const html = s.intelFrictionHtml();
    assert.match(html, /^\s*<div class="igx-fit igf-led">\s*<div class="igx-card igf-led-cop">\s*<div id="igf-copilot"/,
      'the grid, then Copilot\'s card, then the read itself');
  });
  test('[control] the read is exactly what its own builder draws — the frame changed, the read did not', () => {
    const s = stage(book());
    const html = s.intelFrictionHtml();
    const cop = s.intelFrictionCopilotHtml(s.intelFrictionStats(null));
    assert.ok(cop.length > 100 && html.includes(cop), 'Copilot\'s strip lands on the page verbatim');
    for (const n of ['intelFrictionKey', 'intelFrictionCopilotHtml', 'intelFrictionWireAI', 'intelFrictionRepaintAI', 'intelFrictionAsk'])
      assert.ok(new RegExp('function ' + n + '\\(').test(INTEL), n + ' still stands');
    assert.doesNotMatch(noComments(fnBody(INTEL, 'intelFrictionCopilotHtml')), /igx-/,
      'the grammar dresses the frame, never the read');
  });
});

describe('f435 (2) — six figures, the grammar\'s tile, the same doors', () => {
  test('one .igx-figs strip of six .igx-fig tiles, in the owner\'s order', () => {
    const html = stage(book()).intelFrictionHtml();
    const strip = blockOf(html, /<div class="igx-figs"[^>]*>/g);
    assert.ok(strip, 'the strip is the grammar\'s');
    assert.match(strip, /--igx-n:6/, 'six across');
    const tiles = [...strip.matchAll(/<(button|div) class="igx-fig(?: on)?" data-igf-fig="(\w+)"/g)].map(m => m[2]);
    assert.equal(JSON.stringify(tiles), JSON.stringify(['deals', 'rounds', 'tosign', 'decide', 'round1', 'open']));
    assert.equal((strip.match(/class="igx-fig-t"/g) || []).length, 6, 'each has the label');
    assert.equal((strip.match(/class="igx-fig-n[^"]*"/g) || []).length, 6, 'the figure');
    assert.equal((strip.match(/class="igx-fig-s"/g) || []).length, 6, 'and the line under it');
  });
  test('a door is a <button class="igx-fig"> onto the same list as before; an average is a div', () => {
    const html = stage(book()).intelFrictionHtml();
    const tile = k => (new RegExp('<(button|div) class="igx-fig[^"]*" data-igf-fig="' + k + '"[^>]*>').exec(html) || [])[0] || '';
    const go = k => (/data-igf-go="(\w+)"/.exec(tile(k)) || [])[1] || null;
    assert.match(tile('deals'), /^<button/); assert.equal(go('deals'), 'deals');
    assert.match(tile('tosign'), /^<button/); assert.equal(go('tosign'), 'signed');
    assert.match(tile('round1'), /^<button/); assert.equal(go('round1'), 'round1');
    assert.match(tile('open'), /^<button/); assert.equal(go('open'), 'wait', 'the amber figure opens the waiting list');
    assert.match(tile('rounds'), /^<div/); assert.equal(go('rounds'), null);
    assert.match(tile('decide'), /^<div/); assert.equal(go('decide'), null);
  });
  test('the refused figure is amber in the grammar\'s own tone, and lit while the waiting list shows', () => {
    const s = stage(book());
    let html = s.intelFrictionHtml();
    assert.match(html, /data-igf-fig="open"[^>]*>[\s\S]*?<span class="igx-fig-n igx-warn">3<\/span>/);
    setLens(s, 'wait');
    html = s.intelFrictionHtml();
    assert.match(html, /<button class="igx-fig on" data-igf-fig="open"/);
    assert.match(ledgerCss(), /#ig-friction button\.igx-fig\.on\{/, 'the lit tile is dressed, scoped to this tab');
  });
  test('a zero is still no door', () => {
    const html = stage([deal('MK-9', 'Naivas', 2, [CH('Payment Terms', 'accepted', 'owner')])]).intelFrictionHtml();
    assert.match(html, /<div class="igx-fig" data-igf-fig="open"/);
    assert.match(html, /<div class="igx-fig" data-igf-fig="round1"/);
  });
});

describe('f435 (3) — one row, two cards of one height, the long parts scroll inside', () => {
  test('the list and its panel are the two .igx-card cells of one .igx-row, split 7:5', () => {
    const html = stage(book()).intelFrictionHtml();
    const row = blockOf(html, /<div class="igx-row igf-led-grid">/g);
    assert.ok(row, 'one row');
    const cards = [...row.matchAll(/<div class="igx-card (igf-led-\w+)"/g)].map(m => m[1]);
    assert.equal(JSON.stringify(cards), JSON.stringify(['igf-led-list', 'igf-led-detail']));
    assert.match(ledgerCss(), /\.igf-led-grid\{--igx-cols:minmax\(0,7fr\) minmax\(0,5fr\);\}/);
    assert.match(ledgerCss(), /\.igf-led-grid\.is-solo\{--igx-cols:minmax\(0,1fr\);\}/, 'with no panel the list takes the row');
  });
  test('every lens: the table scrolls inside the list card', () => {
    const s = stage(book());
    for (const lens of ['clauses', 'cps', 'wait']) {
      setLens(s, lens);
      const list = blockOf(s.intelFrictionHtml(), /<div class="igx-card igf-led-list">/g);
      assert.match(list, new RegExp('<div class="igx-scroll igf-led-scroll"><table class="igf-led-table" data-igf-list="' + lens + '"'),
        lens + ': the table is the scroller\'s only child');
    }
  });
  test('the rows fill the card, up to a height, and the heads stay while it scrolls', () => {
    const css = ledgerCss();
    assert.match(css, /\.igf-led-list \.igf-led-table\{height:min\(100%, calc\(var\(--igf-rows,0\) \* \d+px \+ \d+px\)\);\}/);
    assert.match(stage(book()).intelFrictionHtml(), /data-igf-list="clauses" style="--igf-rows:3"/, 'the table says how many rows it has');
    assert.match(css, /\.igf-led-list \.igf-led-table thead th\{position:sticky;/);
  });
  test('the clause panel: head, figures and how the asks ended stay put; the two lists scroll', () => {
    const s = stage(book());
    const det = blockOf(s.intelFrictionHtml(), /<div class="igx-card igf-led-detail"[^>]*>/g);
    const sc = det.indexOf('<div class="igx-scroll igf-led-dscroll">');
    assert.ok(sc > 0, 'the panel has its own scroller');
    for (const [name, re] of [['head', /igf-led-dname/], ['figures', /igf-led-dfigs/], ['how the asks ended', /igf-led-askrow/]])
      assert.ok(re.exec(det) && re.exec(det).index < sc, name + ' is above the scroller, fixed');
    const inside = det.slice(sc);
    assert.ok(/data-igf-open="MK-1"/.test(inside), 'refused and still open scrolls');
    assert.ok(/data-igf-cp="Naivas"/.test(inside), 'and so does who contested it');
    assert.ok(inside.indexOf('data-igf-open=') < inside.indexOf('data-igf-cp='), 'refused and still open first, as the picked picture draws it');
  });
  test('the other two panels scroll their lists too', () => {
    const s = stage(book());
    setLens(s, 'cps');
    let det = blockOf(s.intelFrictionHtml(), /<div class="igx-card igf-led-detail"[^>]*>/g);
    let sc = det.indexOf('<div class="igx-scroll igf-led-dscroll">');
    assert.ok(sc > det.indexOf('igf-led-dfigs'), 'counterparty: figures fixed, then the scroller');
    assert.ok(det.indexOf('data-igf-open=', sc) > sc, 'their negotiations scroll');
    setLens(s, 'wait');
    det = blockOf(s.intelFrictionHtml(), /<div class="igx-card igf-led-detail"[^>]*>/g);
    sc = det.indexOf('<div class="igx-scroll igf-led-dscroll">');
    assert.ok(sc > det.indexOf('igf-led-dfigs') && det.indexOf('igf-led-bytable') > sc, 'waiting: the by-clause table scrolls');
  });
  test('what stays put keeps its own height', () => {
    assert.match(ledgerCss(), /\.igf-led-list > :not\(\.igx-scroll\), \.igf-led-detail > :not\(\.igx-scroll\)\{flex:none;\}/);
  });
});

describe('f435 (4) — one grid the tab\'s height; the old layout retired', () => {
  test('Copilot, figures, then the row taking what is left; the ledger lends its children to the grid', () => {
    const css = ledgerCss();
    assert.match(css, /\.igx-fit\.igf-led\{--igx-rows:[^;]*auto minmax\(0,1fr\);\}/);
    assert.match(css, /#igf-ledger\{display:contents;\}/);
    const html = stage(book()).intelFrictionHtml();
    const ledger = blockOf(html, /<div id="igf-ledger">/g);
    assert.ok(ledger.indexOf('class="igx-figs"') > 0 && ledger.indexOf('class="igx-row') > ledger.indexOf('class="igx-figs"'),
      'figures, then the row');
  });
  test('Copilot\'s frame is only a frame, and a long read scrolls inside it', () => {
    assert.match(ledgerCss(), /\.igx-card\.igf-led-cop\{padding:0;overflow:auto;\}/);
  });
  test('the rules the grammar replaced are gone, and nothing draws them', () => {
    const css = ledgerCss();
    /* A rule of its own starts straight after the previous rule's brace. */
    for (const sel of ['.igf-led-strip{', '.igf-led-fig{', 'button.igf-led-fig', '.igf-led-card{', '.igf-led-grid{display:grid', '.igf-led-scroll{overflow-x', '.igf-led-detail{padding'])
      assert.ok(!css.includes('}' + sel), 'retired: ' + sel);
    assert.doesNotMatch(css, /@media \(max-width:1279px\)/, 'the old stacking line: the grammar\'s 1080 line decides');
    assert.doesNotMatch(css, /position:sticky;top:0;\}/, 'the panel no longer sticks inside a scrolling page');
    const code = noComments(INTEL);
    assert.doesNotMatch(code, /igf-led-(strip|fig|card)\b/, 'no builder names them');
    assert.doesNotMatch(css, /!important/);
  });
});

describe('f435 (5) — a press keeps the list where the reader had it', () => {
  test('the ledger\'s repaint reads the list\'s scroll before and puts it back after, for the same lens only', () => {
    const b = noComments(fnBody(INTEL, 'intelFrictionLedgerRepaint'));
    const before = b.indexOf('scrollTop'), paint = b.indexOf('host.innerHTML='), after = b.lastIndexOf('scrollTop=');
    assert.ok(before > 0 && paint > before && after > paint, 'read, repaint, put back');
    assert.match(b, /\[data-igf-list="\$\{kept\.lens\}"\]/, 'only onto the same list');
  });
});
