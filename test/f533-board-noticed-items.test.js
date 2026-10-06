/* f533 — THE NOTICED ITEMS, FIXED (Young, 6 Oct 2026: "Fix the items you
   noticed … Also, in dark mode, these buttons … are not visible")
     (1) A PERIOD STILL RUNNING is held against the same days before it AND
         the whole of the period before is said: early in a quarter "this
         quarter vs last quarter" no longer reads empty;
     (2) "top ten counterparties", "the 10 biggest counterparties": a ranking
         with no measure named ranks by the money; a measure said wins;
     (3) a span with both ends is named with its year ("Q2 2026",
         "1 November 2025 to 28 February 2026");
     (4) an average with nothing on one side says "no figure to compare",
         never "new", and names no "biggest move" it cannot measure;
     (5) the next questions on the board's own screen wear the screen's
         tokens (board-next-chips-verify measures them in a browser);
     (6) a top N of contracts arrives on the board CHART FIRST (the owner's
         rule, 3 Oct 2026), its list in ranked order.
   Run: node --test test/f533-board-noticed-items.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { bookContracts, mon } = require('./board-precision');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const J = x => JSON.parse(JSON.stringify(x));
const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function world(contracts){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: contracts || bookContracts(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.isMonetary = () => true;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}
function drawn(q, w){
  w = w || world();
  const said = w.hbAsk(q); if (!said) return null;
  const s = w.hbS(), key = (s.path || []).slice(-1)[0];
  const D = key ? w.hbDigData(key, s.lens) : null; if (!D || D.kind !== 'list') return { said, D };
  return { said, D, P: J(w.hbPlan(D)), w, key };
}
const textOf = h => String(h || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

describe('f533 (1) a period still running', () => {
  test('nothing yet this quarter: the card reads, and says the whole of the quarter before', () => {
    /* signed only in the WHOLE previous quarter, after the day this quarter has reached */
    const t = new Date(); const q0 = new Date(t.getFullYear(), Math.floor(t.getMonth() / 3) * 3, 1);
    const prevEnd = new Date(q0); prevEnd.setDate(0);
    const cs = [1, 2, 3].map(k => ({ id: 'P' + k, name: 'P' + k, counterparty: 'Juno AB', folder: 'proc', status: 'Signed', value: 1e6 * k, signedAt: iso(prevEnd) + 'T10:00:00.000Z', _raisedAt: '2020-01-01', audit: [], metadata: {} }));
    const r = drawn('this quarter vs last quarter', world(cs));
    assert.ok(r && r.P, 'answered free'); assert.equal(r.P.compare, 'prev');
    const src = r.w.hbReadSrc(r.key);
    assert.ok(src && src.reading, 'the card reads — it is not empty');
    const said = textOf(src.reading.lines.join(' '));
    /* on the last days of a quarter the same days before reach its end, and
       the whole is then the same figure — said once, not twice */
    const Z = r.w.hbWinOf(r.P);
    if (Z.prev.to < iso(prevEnd)) assert.match(said, /The whole of the period before: 3\./, said);
    else assert.ok(!/The whole of/.test(said) && /against 3 the period before/.test(said), said);
  });
});

describe('f533 (2) a ranking of groups ranks by the money', () => {
  for (const q of ['top ten counterparties', 'the 10 biggest counterparties', 'top 5 customers', 'top 3 streams'])
    test(q, () => { const P = drawn(q).P; assert.equal(P.measure, 'value', JSON.stringify(P)); assert.ok(P.top >= 3); });
  test('a measure said after it wins', () => {
    assert.equal(drawn('top 5 counterparties by risk exposure').P.measure, 'exposure');
    assert.equal(drawn('rank streams by number of contracts').P.measure, 'count');
  });
});

describe('f533 (3) a span is named with its year', () => {
  test('whole quarters by name, other spans by their two days with years', () => {
    const w = world();
    assert.equal(w.hbWinWord({ from: '2026-04-01', to: '2026-06-30' }), 'Q2 2026');
    assert.match(w.hbWinWord({ from: '2025-11-01', to: '2026-02-28' }), /2025.*2026/);
    assert.ok(!/\d{4}/.test(w.hbWinWord({ last: 12, unit: 'm' })), 'a rolling period stays in words');
  });
});

describe('f533 (4) an average with nothing to compare', () => {
  test('"no figure to compare", never "new"; no biggest move it cannot measure', () => {
    const w = world();
    assert.equal(w.hbCmpChange(30, null), 'no figure to compare');
    assert.equal(w.hbCmpChange(null, 30), 'no figure to compare');
    assert.equal(w.hbCmpChange(5, 0), 'new', 'a total that grew from nothing is new');
    assert.equal(w.hbCmpY('daysToSign', { y: null }), null);
    assert.equal(w.hbCmpY('count', { y: null }), 0);
    const r = drawn('average time to sign this year compared with last year');
    const said = textOf(r.w.hbReadSrc(r.key).reading.lines.join(' '));
    assert.ok(!/— new\b|\(new\)/.test(said), said);
    assert.equal((read('js/i18n.js').match(/\bhb_cmp_none:/g) || []).length, 2);
    assert.equal((read('js/i18n.js').match(/\bhb_read_cmp_whole:/g) || []).length, 2);
  });
});

describe('f533 (5) the next questions on the board\'s screen', () => {
  test('scoped to the board, in the screen\'s tokens, the Copilot panel left alone', () => {
    const H = read('index.html');
    assert.match(H, /#hb-board \.hb-nx-q\{border-color:var\(--hb-glow\);color:var\(--hb-glow\)\}/);
    assert.match(H, /#hb-board \.hb-nx-l\{color:var\(--hb-mute\)\}/);
    assert.match(H, /\.hb-nx-q\{height:var\(--ctl-h-sm\);[^}]*color:var\(--accent-ink,var\(--color-accent-700\)\)/, 'the platform\'s rule stays for the panel');
  });
});

describe('f533 (6) a top N of contracts is a chart first', () => {
  test('the map forces no List picture; the list arrives ranked', () => {
    const I = read('js/views/intelligence.js');
    assert.ok(!/listChart=\{ pic:'list'/.test(I));
    const w = world();
    const big = J(w.igTopIds(3, 'value', null, null));
    const vals = big.map(id => w.igHomeValue(w.getContract(id)));
    assert.deepEqual(vals, vals.slice().sort((a, b) => b - a));
  });
});
