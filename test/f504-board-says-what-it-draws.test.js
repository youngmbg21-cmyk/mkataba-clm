/* f504 — THE BOARD DRAWS WHAT IT SAYS (the owner's two screenshots, 5 Oct
   2026: "Fix these disconnects")

     A. "payment terms in a pie" is a ring of the PAYMENT TERMS themselves
        (the payment-terms tab's bands, payBucketOf), counted — and the
        answer says what is drawn;
     B. a ring or blocks never claim an average they cannot draw: the planner
        draws bars, and the Picture menu greys Ring and Blocks with the reason;
     C. "show them in graph" redraws the OPEN chart as bars — the same
        contracts, the same split, no new card (Young picked it);
     D. "Showing n of N": N is the book the board counts — archived contracts
        left out, as the board leaves them out;
     E. the server's cleaner knows the new split word. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { bookContracts, mon } = require('./board-precision');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const HB_SRC = read('js/views/homeboard.js');
const strip = src => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: bookContracts(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = c => ({ supplier: 'supplier', customer: 'customer' })[(c.metadata && c.metadata.category) || ''] || null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.isMonetary = () => true;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(HB_SRC);
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}
const J = v => JSON.parse(JSON.stringify(v));
const openPlan = w => { const s = w.hbS(); const key = s.path.slice(-1)[0]; return { key, P: J(w.hbPlan(w.hbDigData(key, s.lens))) }; };

describe('F504 (A) — payment terms in a pie', () => {
  test('the slices are the payment terms, counted, and the answer says so', () => {
    const w = world();
    const said = w.hbAsk('Show me the payment terms in pie chart');
    assert.ok(said, 'read free');
    const { P } = openPlan(w);
    assert.deepEqual(P.split, { by: 'payterms' });
    assert.equal(P.pic, 'ring');
    assert.equal(P.measure, 'count');
    assert.match(String(said.text || said), /by payment terms/, 'the answer names what is drawn');
  });
  test('the groups are the payment-terms tab\'s own bands, in their order, and no terms is its own slice', () => {
    const w = world();
    w.PAY_BUCKETS = [{ k: '0–30', max: 30 }, { k: '31–45', max: 45 }, { k: '46–60', max: 60 }, { k: '61–90', max: 90 }, { k: '90+', max: Infinity }];
    w.payBucketOf = d => (w.PAY_BUCKETS.find(b => d <= b.max) || w.PAY_BUCKETS[4]).k;
    const rows = w.hbGroupsOf(w.state.contracts.filter(c => !c.archived), 'payterms', false);
    assert.deepEqual(J(rows.map(r => r.g)), ['0–30', '46–60', ''], 'band order, none last');
    assert.equal(rows[0].label, '0–30 days');
    assert.equal(rows[2].label, 'No payment terms read');
  });
  test('"by payment terms" is a split in the Split menu', () => {
    const w = world();
    assert.ok(Array.from(w.HB_SPLIT_GROUPS).includes('payterms'));
    w.hbAsk('contracts by payment terms');
    assert.deepEqual(openPlan(w).P.split, { by: 'payterms' });
  });
});

describe('F504 (B) — a ring never claims an average', () => {
  test('ring + average payment days draws bars', () => {
    const w = world();
    w.hbAsk('payment terms by stage as a pie');
    const { P } = openPlan(w);
    assert.equal(P.measure, 'payDays');
    assert.equal(P.pic, 'bars');
  });
  test('the Picture menu greys Ring and Blocks with the reason while the measure is an average', () => {
    const w = world();
    w.hbAsk('payment terms by stage as a pie');
    const s = w.hbS(); const D = w.hbDigData(s.path.slice(-1)[0], s.lens);
    const opts = J(w.hbRcOptions('pic', w.hbPlan(D), D));
    for (const p of ['ring', 'blocks']){
      const o = opts.find(x => x.v === p);
      assert.equal(o.on, false, p + ' greyed');
      assert.match(o.why, /average/);
    }
    assert.equal(opts.find(x => x.v === 'bars').on, true);
  });
});

describe('F504 (C) — "show them in graph" is the open chart', () => {
  test('the same card, the same split, drawn as bars', () => {
    const w = world();
    w.hbAsk('contracts by counterparty');
    const before = openPlan(w);
    const said = w.hbAsk('Show them in graph');
    assert.ok(said, 'read free, not handed to Copilot');
    const after = openPlan(w);
    assert.equal(after.key, before.key, 'no new card');
    assert.deepEqual(after.P.split, { by: 'counterparty' });
    assert.equal(after.P.pic, 'bars');
  });
});

describe('F504 (D, E) — one book, one word', () => {
  test('"Showing n of N" counts the book without archived contracts', () => {
    const src = strip(read('js/views/intelligence.js'));
    assert.match(src, /const igBookTotal = \(\) => \(state\.contracts\|\|\[\]\)\.filter\(c=>c&&!c\.archived\)\.length;/);
    assert.ok(!/t:\(state\.contracts\|\|\[\]\)\.length/.test(src) && !/const total=\(state\.contracts\|\|\[\]\)\.length/.test(src), 'no "of N" counts the archived');
  });
  test('the server cleaner reads split "payterms"', () => {
    const SERVER = read('server/server.js');
    assert.match(SERVER, /const GRAPH_CHART_SPLITS = \[[^\]]*'payterms'/);
    assert.match(SERVER, /const GRAPH_CHART_GROUP_OF = \{[^}]*payterms: 'payterms'/);
  });
});
