/* f657 — THE BOARD UPGRADE: CHART QUALITY G1–G10 (owner's "Build", 10 Oct 2026,
   over the "Board Upgrade Proposals" page; the owner picked "All chart ideas")
   (G1) a press is a soft highlight, never an outline: no hover/press rule
        strokes a piece in ink; the piece lights and the rest step back
   (G2) sharp edges: grid lines are crisp hairlines; a fitted column sits on
        whole pixels
   (G3) labels never cut silently: a fitted name ends in "…", a legend that
        runs out of room says what it left out, a bar's name wraps
   (G4) the hover card: share, change and the contracts behind a piece, its
        door the piece's own (the number on it is the list behind it)
   (G5) reference lines: average, the same time last year, a target — the
        reader's own switches, kept with the board; a typed figure is read or
        refused, never guessed
   (G6) a redrawn chart glides instead of blanking, except for a reader who
        asked for less motion
   (G7) the piece the headline is about keeps the colour; the rest calm
   (G8) four new pictures — waterfall, funnel, small multiples, spread — each
        piece a door onto exactly its own contracts; the waterfall adds up
   (G9) copy as image / copy table, offered only once the chart is opened
   (G10) one lonely bar is said as a number, with the views that would draw
        a real picture
   Run: node --test test/f657-board-upgrade.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const SRC = read('js/views/homeboard.js');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '');
const INDEX = read('index.html');
const pad = n => String(n).padStart(2, '0');
/* a day `off` months from now, mid-month: no answer depends on the day the test runs */
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function book(){
  const cs = [];
  const add = (id, cp, status, value, folder, o) => cs.push(Object.assign({ id, name: 'Agreement ' + id, counterparty: cp, status, value, folder, kind: id.charCodeAt(4) % 2 ? 'Supply' : 'Lease', expiry: mon(10), audit: [], metadata: {} }, o || {}));
  const cps = ['Juno AB', 'Juno AB', 'Naivas', 'Juno AB', 'Bidco', 'Naivas', 'Sendy', 'Kevian', 'Tuskys', 'Coast Motors', 'Siginon', 'Juno AB'];
  for (let k = 0; k < 24; k++){
    const off = -1 - (k % 20);
    add('MK-' + (100 + k), cps[k % cps.length], 'Signed', 1e6 * (1 + (k % 5)), k % 3 ? 'proc' : 'sales',
      { signedAt: mon(off, 10) + 'T10:00:00.000Z', _raisedAt: mon(off - 1, 5) + 'T10:00:00.000Z', expiry: k % 4 ? mon(14 - (k % 9)) : mon(-2) });
  }
  add('MK-200', 'Juno AB', 'Draft', 5e6, 'sales', { _raisedAt: mon(-2, 5) + 'T10:00:00.000Z' });
  add('MK-201', 'Bidco', 'Under Review', 7e6, 'proc', { _raisedAt: mon(-3, 5) + 'T10:00:00.000Z' });
  add('MK-202', 'Naivas', 'Draft', 2e6, 'proc', { _raisedAt: mon(-4, 5) + 'T10:00:00.000Z' });
  add('MK-204', 'Kevian', 'Declined', 1e6, 'proc', { _raisedAt: mon(-4, 5) + 'T10:00:00.000Z' });
  add('MK-203', 'Sendy', 'Signed', 3e6, 'sales');                               /* executed, no signing date */
  return cs;
}
function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  return w;
}
function card(w, recipe, q = 'contracts by stream'){
  const key = 'q:' + q;
  w.hbS().recipe = {}; w.hbCardSet(key, recipe);
  const D = w.hbDigData(key, 'all'); assert.ok(D, 'a card for ' + q);
  return { key, D, P: w.hbPlan(D), cs: w.hbListOf(D.ids, 'all') };
}
const un = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
function doors(html){
  const out = []; const re = /data-hb-dig="([^"]+)"[^>]*><title>([^<]*)<\/title/g; let m;
  while ((m = re.exec(html))) out.push({ key: un(m[1]), title: un(m[2]) });
  return out;
}
function region(name){
  const at = CODE.indexOf('function ' + name + '(');
  assert.ok(at > -1, 'no function ' + name);
  const open = CODE.indexOf('{', CODE.indexOf(')', at));
  let d = 0;
  for (let i = open; i < CODE.length; i++){ if (CODE[i] === '{') d++; else if (CODE[i] === '}' && !--d) return CODE.slice(at, i + 1); }
  throw new Error('unbalanced ' + name);
}
const sheet = INDEX.slice(INDEX.indexOf('THE CHART FAMILY: SVG that scales'), INDEX.indexOf('.hb-snap-empty{'));

describe('f657 (G1) a soft highlight, never an outline', () => {
  test('no hover, press or focus rule strokes a chart piece in ink', () => {
    const rules = INDEX.split('\n').filter(l => /\.hb-svg|\.hb-sv-cbox|\.hb-cbar|\.hb-ccol/.test(l) && /:(?:hover|active|focus-visible)/.test(l));
    assert.ok(rules.length > 6, 'the board\'s piece rules are read: ' + rules.length);
    for (const r of rules) assert.doesNotMatch(r, /stroke:var\(--hb-ink\)/, 'a dark line on a press: ' + r.slice(0, 120));
    for (const r of rules.filter(x => /\.hb-cbar|\.hb-ccol/.test(x))) assert.doesNotMatch(r, /outline:2px solid/, 'bars ring with a line: ' + r.slice(0, 120));
  });
  test('the piece lights, the rest step back, a press brightens; the keyboard gets the glow too', () => {
    assert.match(sheet, /\.hb-svg\.hb-dim \[data-hb-dig\]:not\(\.is-lit\)>\*\{opacity:/);
    assert.match(sheet, /\[data-hb-dig\]\.is-lit>:is\(path,rect,circle\)[^{]*\{filter:drop-shadow/);
    assert.match(sheet, /\[data-hb-dig\]:active>:is\(path,rect,circle\)[^{]*\{filter:[^}]*brightness/);
    assert.match(sheet, /\[data-hb-dig\]:focus-visible>:is\(path,rect,circle\)[^{]*\{filter:drop-shadow/);
    assert.match(INDEX, /\.hb-cbar:focus-visible,\.hb-ccol:focus-visible\{outline:none;box-shadow:0 0 0 3px/);
  });
  test('one door lights everywhere it is drawn: a slice and its legend row together', () => {
    const w = world(); const doc = w.document;
    doc.body.innerHTML = '<svg class="hb-svg"><g data-hb-dig="a" class="x"><path d="M0 0"/></g><g data-hb-dig="b"><path d="M0 0"/></g><g data-hb-dig="a" class="row"><rect/></g></svg>';
    w.hbLitSet(doc.querySelector('[data-hb-dig="a"]'));
    assert.equal(doc.querySelectorAll('.is-lit').length, 2, 'both pieces of door a');
    assert.ok(doc.querySelector('svg').classList.contains('hb-dim'));
    w.hbLitClear();
    assert.equal(doc.querySelectorAll('.is-lit, .hb-dim').length, 0);
  });
  test('wired once, on the document, at load', () => {
    assert.match(CODE, /if \(typeof document !== 'undefined' && !document\._hbTipWired\)\{\s*document\._hbTipWired = true;/);
    assert.equal((CODE.match(/document\.addEventListener\('click'/g) || []).length, 1, 'still one click listener for the board');
  });
});

describe('f657 (G2) sharp at every size', () => {
  test('grid lines are one crisp pixel, digits line up', () => {
    assert.match(INDEX, /\.hb-svg :is\(\.hb-sv-grid,\.hb-sv-axis\)\{stroke-width:1;shape-rendering:crispEdges;vector-effect:non-scaling-stroke\}/);
    assert.match(INDEX, /\.hb-svg text\{font-variant-numeric:tabular-nums\}/);
  });
  test('a fitted chart puts its edges on whole pixels (measured in the browser by board-upgrade-verify)', () => {
    assert.match(region('_hbSnap'), /_hbFit \? Math\.round\(v\)/, 'on a card, an edge is a whole pixel');
    assert.match(region('hbColsSvg'), /const x0 = _hbSnap\(x - cw \/ 2\), x1 = _hbSnap\(x \+ cw \/ 2\); y = _hbSnap\(y\);/);
    assert.match(region('hbStackSvg'), /x="\$\{_hbSnap\(cx - cw \/ 2\)\}"/);
  });
});

describe('f657 (G3) labels never collide or get cut silently', () => {
  test('a name too long for its room ends in "…"; one that fits is left alone', () => {
    const w = world();
    assert.equal(w._hbFitText('Juno', 100, 12), 'Juno');
    const cut = w._hbFitText('Kenya Power and Lighting Company Limited', 80, 12);
    assert.match(cut, /…$/); assert.ok(w._hbTextW(cut, 12) <= 80 + 12, 'fits its room');
    assert.ok(w._hbEvery(['Jan', 'Feb', 'Mar'], 10, 12, 1) > 1, 'labels wider than their slot skip so they never touch');
  });
  test('a legend that runs out of room wraps once, then says how many it left out', () => {
    const st = region('hbStackSvg');
    assert.match(st, /if \(lx \+ w > W - R && ly < 20 && lx > L\)\{ lx = L; ly \+= 17; \}/, 'a second line first');
    assert.match(st, /if \(lx \+ w > W - R\)\{ lostS\+\+; return; \}/);
    assert.match(st, /hb_legend_more/, 'what the legend left out is said');
    assert.doesNotMatch(st, /String\(x\.col\.label\)\.slice\(/, 'a name is never cut without its "…"');
  });
  test('a bar\'s name wraps onto a second line instead of ending in "…"', () => {
    assert.match(INDEX, /\.hb-cbar-t\{[^}]*-webkit-line-clamp:2[^}]*\}/);
    assert.match(INDEX, /\.hb-cbar\{all:unset;[^}]*min-height:36px/);
  });
});

describe('f657 (G4) the hover card', () => {
  test('share, change and the contracts behind a piece; the door is the piece\'s own', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, pic: 'cols' });
    const { R } = w.hbChartRun(D, cs, P);
    const doc = w.document; doc.body.innerHTML = R.body;
    const pieces = [...doc.querySelectorAll('[data-hb-part]')];
    assert.ok(pieces.length >= 6);
    const el = pieces.find(p => p.hasAttribute('data-hb-py'));
    assert.ok(el, 'a column in a run knows the one before it');
    const T = w.hbTipData(el);
    assert.ok(T.share != null && T.share > 0 && T.share <= 100, 'its share of the whole: ' + T.share);
    assert.ok(T.change && T.change.was, 'the change from the column before');
    const Dd = w.hbDigData(el.getAttribute('data-hb-dig'), 'all');
    assert.equal(T.n, Dd.n, 'the card\'s "Open these N" is the list the piece opens');
    const html = w.hbTipHtml(T);
    assert.match(html, new RegExp('data-hb-dig="' + el.getAttribute('data-hb-dig').replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"'));
    assert.match(html, /data-hb-tip-ask/);
  });
  test('an average has no share, and Ask about this only fills the box', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, pic: 'cols', measure: 'daysToSign' });
    const { R } = w.hbChartRun(D, cs, P);
    w.document.body.innerHTML = R.body;
    const el = w.document.querySelector('[data-hb-part]');
    assert.equal(w.hbTipData(el).share, null, 'a share of an average is never said');
    const ask = region('hbTipAsk');
    assert.match(ask, /box\.value = /); assert.doesNotMatch(ask, /intelAsk|hbAsk\(|api\(/, 'nothing is asked or spent until the reader presses Ask');
  });
  test('the browser\'s own tooltip is held back while the card shows, and given back', () => {
    const w = world(); const doc = w.document;
    doc.body.innerHTML = '<svg class="hb-svg"><g data-hb-dig="a"><title>March: 4</title><path d="M0 0"/></g></svg>';
    const g = doc.querySelector('g');
    w._hbTipHold(g); assert.equal(g.querySelector('title').textContent, '');
    w._hbTipGive(); assert.equal(g.querySelector('title').textContent, 'March: 4');
  });
});

describe('f657 (G5) reference lines', () => {
  test('average and target drawn when switched on; last year faint behind', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'date', unit: 'm', date: 'signed' }, pic: 'cols' });
    let { R } = w.hbChartRun(D, cs, P);
    assert.doesNotMatch(R.body, /hb-sv-ref-avg|hb-sv-ghost|hb-sv-ref-tgt/, 'nothing drawn until the reader asks');
    w.hbRefsSet(D.key, 'avg'); w.hbRefsSet(D.key, 'ly'); w.hbRefsSet(D.key, 'tgt', 3e6);
    ({ R } = w.hbChartRun(D, cs, P));
    assert.match(R.body, /class="hb-sv-ref-avg"/); assert.match(R.body, /class="hb-sv-ref-tgt"/); assert.match(R.body, /class="hb-sv-ghost"/);
    w._hbS = null;
    assert.deepEqual(JSON.parse(JSON.stringify(w.hbS().refs[D.key])), { avg: true, ly: true, tgt: 3e6 }, 'kept with the board');
  });
  test('last year needs months or quarters; a running total takes no ghost', () => {
    const w = world();
    const { D, P } = card(w, { split: { by: 'date', unit: 'y', date: 'signed' }, pic: 'cols' });
    w.hbRefsSet(D.key, 'ly');
    assert.equal(w.hbRefsOf(D.key, P).ly, false);
  });
  test('a typed figure is read, or refused — never guessed', () => {
    const w = world();
    assert.equal(w.hbNumIn('3M'), 3e6); assert.equal(w.hbNumIn('750k'), 750000); assert.equal(w.hbNumIn('2,5 M'), 2.5e6);
    assert.equal(w.hbNumIn('3 000 000'), 3e6); assert.equal(w.hbNumIn('1,250,000'), 1250000); assert.equal(w.hbNumIn('40'), 40);
    assert.equal(w.hbNumIn('lots'), null); assert.equal(w.hbNumIn(''), null);
    assert.match(SRC, /hb_ref_tgt_bad/, 'a refusal says why');
  });
});

describe('f657 (G6) a redrawn chart glides', () => {
  test('taken before the morph, played after; never for less motion or a new width', () => {
    const paint = region('hbPaintBoard');
    assert.match(paint, /const glide = hbGlideTake\(host\);\s*hbMorph\(host, hbBoardHtml\(\)\);\s*hbGlidePlay\(host, glide\);/);
    assert.match(region('hbGlideTake'), /_hbGlideOff\(\)/);
    assert.match(region('_hbGlideOff'), /prefers-reduced-motion: reduce/);
    assert.match(region('hbGlidePlay'), /W0\.w !== svg\.getAttribute\('data-hb-w'\)/, 'a resize is not animated');
    assert.match(region('hbGlidePlay'), /g\.style\.animation = 'none'/, 'a gliding piece does not also fade in again');
  });
});

describe('f657 (G7) the point in colour', () => {
  test('the headline\'s piece keeps the colour; the chart is calmed', () => {
    const w = world();
    const body = '<svg class="hb-svg hb-cols"><g data-hb-dig="qm:a" data-hb-y="3" data-hb-part><title>Mar: 3</title><path class="hb-sv-col"/></g><g data-hb-dig="qm:b" data-hb-y="9" data-hb-part><title>Apr: 9</title><path class="hb-sv-col"/></g></svg>';
    const out = w.hbLeadMark(body, 'Most in <button class="hb-read-n" data-hb-dig="qm:b">April</button>');
    assert.match(out, /<svg class="hb-svg hb-calm/); assert.match(out, /data-hb-dig="qm:b" data-hb-lead/);
    assert.equal(w.hbLeadMark(body, 'In total <b>12</b>'), body, 'a headline about the whole card changes nothing');
    assert.equal(w.hbLeadMark(body, '<button data-hb-dig="qg:other">x</button>'), body, 'nor one about something not drawn');
  });
  test('only the one-colour pieces are calmed; status colours are never touched', () => {
    assert.match(INDEX, /\.hb-svg\.hb-calm \.hb-sv-cbox:not\(\[data-hb-lead\]\)>path\.hb-sv-col\{fill-opacity:\.38\}/);
    assert.match(region('hbChartHtml'), /\['cols', 'bars'\]\.includes\(P\.pic\) && !P\.split2 && !P\.compare\) R\.body = hbLeadMark/);
  });
});

describe('f657 (G8) the four new pictures', () => {
  test('one picture list on both hosts, and the words that ask for each', () => {
    const w = world();
    ['waterfall', 'funnel', 'multi', 'spread'].forEach(p => assert.ok(w.HB_PICS.includes(p), p));
    assert.match(read('server/server.js'), /const GRAPH_CHART_PICS = \[[^\]]*'waterfall', 'funnel', 'multi', 'spread'[^\]]*\]/);
    const pic = q => { const R = w.hbRecipeRead(q); return R && R.pic; };
    assert.equal(pic('contract value as a waterfall'), 'waterfall');
    assert.equal(pic('contracts as a funnel'), 'funnel');
    assert.equal(pic('days to sign by type as a box plot'), 'spread');
  });
  test('the waterfall adds up, and every step opens exactly its own contracts', () => {
    const w = world();
    const { D, P, cs } = card(w, { pic: 'waterfall', measure: 'count', window: { last: 12, unit: 'm' } });
    assert.equal(P.split, null, 'the waterfall draws the book, not a split');
    const X = w.hbExtraSets('wf', P, cs);
    const [s0, add, gone, end] = X.parts.map(p => p.list.length);
    assert.equal(s0 + add - gone, end, `start ${s0} + signed ${add} − ended ${gone} = end ${end}`);
    assert.ok(add > 0 && s0 > 0, 'the book moved');
    const { R } = w.hbChartRun(D, cs, P);
    const ds = doors(R.body).filter(d => /^qx:/.test(d.key));
    assert.equal(ds.length, 4);
    ds.forEach((d, i) => { const Dd = w.hbDigData(d.key, 'all'); assert.ok(Dd, d.key); assert.equal(Dd.n, X.parts[i].list.length, d.title); });
    assert.match(R.note, /no signing date/, 'the executed contract with no signing date is said');
    const read1 = w.hbReadingOf(D, cs, P, R);
    assert.ok(read1 && read1.lines.length >= 1, 'it says its reading');
  });
  test('the funnel narrows, says the declined, and opens its stages', () => {
    const w = world();
    const { D, P, cs } = card(w, { pic: 'funnel' });
    const X = w.hbExtraSets('fn', P, cs);
    const n = X.parts.map(p => p.list.length);
    assert.ok(n[0] >= n[1] && n[1] >= n[2], 'each stage holds no more than the one before: ' + n);
    assert.equal(X.declined, cs.filter(c => c.status === 'Declined').length, 'the declined are counted and said');
    const Xd = w.hbExtraSets('fn', P, w.state.contracts);
    assert.equal(Xd.declined, 1); assert.equal(Xd.parts[0].list.length, w.state.contracts.length, 'a declined one is still raised');
    const { R } = w.hbChartRun(D, cs, P);
    doors(R.body).filter(d => /^qx:/.test(d.key)).forEach((d, i) => assert.equal(w.hbDigData(d.key, 'all').n, n[i]));
  });
  test('the spread is days to sign by a group, and each row opens the contracts it measured', () => {
    const w = world();
    const { D, P, cs } = card(w, { pic: 'spread', split: { by: 'kind' } });
    assert.equal(P.measure, 'medianDaysToSign', 'the spread always measures days to sign');
    const X = w.hbExtraSets('sp', P, cs);
    assert.ok(X.parts.length >= 2);
    X.parts.forEach(p => { assert.ok(p.min <= p.q1 && p.q1 <= p.med && p.med <= p.q3 && p.q3 <= p.max, p.word); });
    const { R } = w.hbChartRun(D, cs, P);
    doors(R.body).filter(d => /^qx:/.test(d.key)).forEach(d => { const p = X.parts.find(x => d.key.endsWith('|' + x.k) || d.key.endsWith(x.k)); assert.equal(w.hbDigData(d.key, 'all').n, p.n); });
  });
  test('small multiples: one panel per group on one scale, every column a door onto its cell', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'date', unit: 'q', date: 'signed' }, split2: { by: 'folder' }, pic: 'multi' });
    assert.equal(P.pic, 'multi');
    const { R } = w.hbChartRun(D, cs, P);
    assert.equal((R.body.match(/class="hb-sv-panel"/g) || []).length, 2, 'one panel per stream');
    const ds = doors(R.body).filter(d => /^q2:/.test(d.key));
    assert.ok(ds.length >= 4);
    ds.forEach(d => { const k = Number(/(\d+)\s*$/.exec(d.title)[1]); assert.equal(w.hbDigData(d.key, 'all').n, k, d.title); });
    const { P: P1 } = card(w, { split: { by: 'folder' }, pic: 'multi' });
    assert.equal(P1.pic, 'bars', 'without a second split it draws the one split');
  });
  test('the dropdowns grey what a picture cannot take, and say why', () => {
    const w = world();
    const { D, P } = card(w, { pic: 'spread', split: { by: 'kind' } });
    const ms = w.hbRcOptions('measure', P, D);
    assert.equal(ms.find(o => o.v === 'count').on, false);
    assert.equal(ms.find(o => o.v === 'medianDaysToSign').on, true);
    assert.equal(ms.find(o => o.v === 'daysToSign').on, false, 'the box\'s middle is the median, so the measure is the median');
    const { D: D2, P: P2 } = card(w, { pic: 'waterfall' });
    const ms2 = w.hbRcOptions('measure', P2, D2);
    assert.equal(ms2.find(o => o.v === 'value').on, true); assert.equal(ms2.find(o => o.v === 'daysToSign').on, false);
  });
});

describe('f657 (G9) copy as image, copy table', () => {
  test('offered only once opened, beside Show as table and Full screen', () => {
    const html = region('hbChartHtml');
    assert.match(html, /if \(at\.step !== 'board' && \/data-hb-dig=\/\.test\(R\.body\)\)\{[\s\S]*data-hb-table=[\s\S]*data-hb-full[\s\S]*hbLinesMenuHtml\(D, P\)[\s\S]*data-hb-copy-img[\s\S]*data-hb-copy-tab/);
    assert.match(html, /data-hb-copy-n="\$\{cs\.length\}"/, 'the picture says how many contracts it counts');
    assert.match(html, /P\.pic === 'cols' && P\.measure !== 'live' && !P\.compare && !tab \? hbLinesMenuHtml/, 'lines only where a column chart can carry them');
  });
  test('a picture leaving HaTi carries literal colours, its title and the date of the data', () => {
    assert.match(region('_hbSvgLiteral'), /getComputedStyle\(el\)/);
    assert.match(region('_hbSvgLiteral'), /removeAttribute\('class'\)/, 'no class leans on a sheet the picture does not carry');
    assert.match(region('hbChartPngOf'), /hb_copy_foot/);
    assert.match(region('hbCopyChartImage'), /hb_copy_img_saved/, 'where copying a picture is refused, it is saved and said');
    assert.match(region('hbCopyChartTable'), /'text\/plain'[\s\S]*'text\/html'/);
  });
});

describe('f657 (G10) one value, said plainly', () => {
  test('a single bar becomes its number, named, with the views that would draw more', () => {
    const w = world();
    const { D, P, cs } = card(w, { split: { by: 'folder' }, pic: 'bars' }, 'Siginon contracts');
    assert.ok(cs.length >= 1 && cs.every(c => c.counterparty === 'Siginon'));
    const html = w.hbChartHtml(D, cs, false);
    if (P.split && new Set(cs.map(c => c.folder)).size === 1){
      assert.match(html, /class="hb-small"/);
      assert.match(html, /data-hb-rkey="[^"]+"[^>]*>[\s\S]*data-hb-rset="split:d:m:/, 'the views that would draw more, each a recipe press');
      assert.match(html, /class="hb-small-figs" data-hb-dig=/, 'the number is still a door');
    }
  });
  test('two values stay a chart', () => {
    const w = world();
    const { D, cs } = card(w, { split: { by: 'folder' }, pic: 'bars' });
    assert.doesNotMatch(w.hbChartHtml(D, cs, false), /class="hb-small"/);
  });
});

describe('f657 every new word is in both books', () => {
  test('English and Swedish', () => {
    const I = read('js/i18n.js');
    const keys = [...new Set([...SRC.matchAll(/i18tn?\('((?:hb_(?:tip|ref|wf|fn|spr|copy|small|multi|legend|by_waterfall|by_funnel|by_spread|why_cmp_pic|why_spread_measure|read_wf|read_fn|read_sp|pic_waterfall|pic_funnel|pic_multi|pic_spread))[a-z_]*)'/g)].map(m => m[1]).filter(k => !/_$/.test(k)))];
    assert.ok(keys.length > 30, 'keys read: ' + keys.length);
    for (const k of keys){
      const n = (I.match(new RegExp('^\\s+' + k + '(?:_one|_other)?:', 'gm')) || []).length;
      assert.ok(n >= 2, k + ' is in both books');
    }
  });
});
