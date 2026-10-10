/* f448 — THE RECIPE: A BOARD QUESTION IS READ IN FOUR PARTS AND A SWITCH
   (Young, 4 Oct 2026: "The chart family is still not working well. My prompts
   are still not creating the outputs I desire … when I ask for a timeline by
   month the charts do not come out as I asked." → the render → "Build it".)

   Measured before the change: of 20 chart questions in the owner's style only
   3 drew a chart and none drew the chart asked for. "By month", "as a pie",
   "timeline" and "trend" were never read; "by stream" regrouped the hidden map.

     1. THE PHRASE BOOK — the pass mark: each question, the set it counts, the
        split, the picture, the measure and the trend it must draw. A question
        that is not a chart question keeps its old road.
     2. the plan a card draws: defaults, a press on a dropdown on top, made
        drawable (a dead option is greyed and says why);
     3. month columns: buckets on the date asked, a door per column, Earlier /
        Later past the window, a column for no date;
     4. trends: a straight line through months with enough contracts, the
        sentence worked out by HaTi; too little history says so, never a line;
     5. live contracts each month read the monthly picture of the book;
     6. a chart of the whole book is not a count. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pad = n => String(n).padStart(2, '0');
/* a day in the month `off` months from now — mid-month, so the answer never
   depends on the day the test runs */
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };
const bucket = off => mon(off).slice(0, 7);

function book(){
  const cs = [
    { id: 'MK-1', name: 'Warehouse Lease', counterparty: 'Siginon', status: 'Signed', value: 10e6, expiry: mon(2), folder: 'proc', metadata: { category: 'supplier', paymentTerms: '30 days' } },
    { id: 'MK-2', name: 'Distribution', counterparty: 'Sendy', status: 'Signed', value: 20e6, expiry: mon(7), folder: 'sales', metadata: { category: 'customer', paymentTerms: '60 days' } },
    { id: 'MK-3', name: 'Packaging', counterparty: 'Bidco', status: 'Draft', value: 5e6, folder: 'proc' },
    { id: 'MK-4', name: 'Retail', counterparty: 'Naivas', status: 'Under Review', value: 7e6, expiry: mon(14), folder: 'sales', metadata: { category: 'customer' } },
    { id: 'MK-5', name: 'Closed one', counterparty: 'Tuskys', status: 'Declined', value: 9e6 },
    { id: 'MK-6', name: 'Old Fleet', counterparty: 'Coast Motors', status: 'Signed', value: 3e6, expiry: mon(-1), metadata: { category: 'supplier' } },
    { id: 'MK-7', name: 'Freight', counterparty: 'Juno Logistics Ltd', status: 'Signed', value: 12e6, expiry: mon(3), folder: 'proc', owner: { name: 'Amina' } },
    { id: 'MK-8', name: 'Fresh supply', counterparty: 'Juno Fresh AB', status: 'Under Review', value: 4e6, expiry: mon(3), folder: 'proc' },
    { id: 'MK-9', name: 'Listing', counterparty: 'Juno Fresh AB', status: 'Draft', value: 2e6, folder: 'sales' },
  ];
  /* eight past months of signings, three a month, each a little faster:
     40, 38, 36 … days from first draft to signature */
  for (let k = 0; k < 8; k++){
    const off = k - 8;
    for (let j = 0; j < 3; j++){
      const days = 40 - 2 * k + j - 1, signed = mon(off, 10 + j), raised = new Date(Date.parse(signed + 'T00:00:00') - days * 864e5);
      cs.push({ id: 'MK-S' + k + j, name: 'Signed ' + k + j, counterparty: 'Kevian Kenya Ltd', status: 'Signed', value: 1e6 * (k + 1), expiry: mon(off + 12, 10 + j),
        signedAt: signed, _raisedAt: raised.toISOString(), folder: 'proc', negotiation: { rounds: Array.from({ length: 1 + (k % 3) }, () => ({})) } });
    }
  }
  return cs.map(c => ({ audit: [], metadata: {}, ...c }));
}
function world(){
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: book(), settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement & Raw Materials' }, sales: { id: 'sales', name: 'Sales & Route-to-Market' } };
  w.cKind = c => c.kind || 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = c => { const m = String((c.metadata && c.metadata.paymentTerms) || '').match(/(\d+)/); return m ? Number(m[1]) : null; };
  w.paySide = c => ({ supplier: 'supplier', customer: 'customer' })[(c.metadata && c.metadata.category) || ''] || null;
  w.contractExpired = c => c.status === 'Signed' && !!c.expiry && c.expiry < mon(0, 1);
  w.contractOwnerName = c => (c.owner && c.owner.name) || null;
  w.currentUser = () => ({ id: 'u_test', name: 'Test User', role: 'legal' });
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  return w;
}
const planOf = (w, q) => { const D = w.hbDigData('q:' + q, 'all'); assert.ok(D, 'a card for ' + JSON.stringify(q)); return { D, P: w.hbPlan(D) }; };
const D_ = (u, d) => ({ by: 'date', unit: u, date: d });

describe('F448 (1) — the phrase book: the picture each question must draw', () => {
  /* [question, split, picture, measure, trend, the set (labels, or 'all')] */
  const BOOK = [
    ['Show Juno contracts by month', D_('m', 'end'), 'cols', 'count', false, 'Juno'],
    ['timeline of Juno contracts', null, 'gantt', 'count', false, 'Juno'],
    ['Juno contracts timeline by month', D_('m', 'end'), 'cols', 'count', false, 'Juno'],
    ['show me a timeline by month', D_('m', 'end'), 'cols', 'count', false, 'all'],
    ['timeline of contracts by month', D_('m', 'end'), 'cols', 'count', false, 'all'],
    ['contracts ending by month', D_('m', 'end'), 'cols', 'count', false, 'all'],
    ['show expiries by month as a timeline', D_('m', 'end'), 'cols', 'count', false, 'all'],
    ['when do the Juno contracts end', D_('m', 'end'), 'cols', 'count', false, 'Juno'],
    ['Juno contracts as a pie chart', { by: 'status' }, 'ring', 'count', false, 'Juno'],
    ['Juno contracts as a bar chart', { by: 'status' }, 'bars', 'count', false, 'Juno'],
    ['show Juno contracts by counterparty', { by: 'counterparty' }, 'ring', 'count', false, 'Juno'],
    ['signed contracts by value stream', { by: 'folder' }, 'ring', 'count', false, 'Executed|Signed'],
    ['contracts by stage', { by: 'status' }, 'ring', 'count', false, 'all'],
    ['value by stream', { by: 'folder' }, 'blocks', 'value', false, 'all'],
    ['show contracts by owner', { by: 'owner' }, 'ring', 'count', false, 'all'],
    ['Juno contracts by value', { by: 'valueBand' }, 'bars', 'count', false, 'Juno'],
    ['chart the contracts that end this year by month', D_('m', 'end'), 'cols', 'count', false, 'expiring this year'],
    ['renewals by quarter', D_('q', 'decision'), 'cols', 'count', false, 'all'],
    ['Is time to sign getting faster?', D_('m', 'signed'), 'cols', 'daysToSign', true, 'all'],
    ['How many live contracts did we have each month?', D_('m', 'end'), 'cols', 'live', false, 'all'],
    ['signed contracts by month', D_('m', 'signed'), 'cols', 'count', false, 'Executed|Signed'],
    ['contracts signed per quarter', D_('q', 'signed'), 'cols', 'count', false, 'Executed|Signed'],
    ['value signed per month', D_('m', 'signed'), 'cols', 'value', false, 'Executed|Signed'],
    ['trend of contracts signed by month', D_('m', 'signed'), 'cols', 'count', true, 'Executed|Signed'],
    ['are we signing more contracts over time', D_('m', 'signed'), 'cols', 'count', true, 'all'],
    ['payment terms by month', D_('m', 'signed'), 'cols', 'payDays', false, 'all'],
    ['payment terms trend', D_('m', 'signed'), 'cols', 'payDays', true, 'all'],
    ['negotiation rounds by quarter', D_('q', 'signed'), 'cols', 'rounds', false, 'all'],
    ['Naivas contracts by stage as bars', { by: 'status' }, 'bars', 'count', false, 'Naivas'],
    ['Siginon and Sendy by month', D_('m', 'end'), 'cols', 'count', false, 'Siginon · Sendy'],
    ['expired contracts by month', D_('m', 'end'), 'cols', 'count', false, 'expired'],
    ['contracts ending in the next 6 months by month', D_('m', 'end'), 'cols', 'count', false, 'ending in the next 6 months'],
    ['show Juno contracts as a list', null, 'list', 'count', false, 'Juno'],
    ['drafts by owner', { by: 'owner' }, 'ring', 'count', false, 'Drafting|Draft'],
    ['contracts by type', { by: 'kind' }, 'ring', 'count', false, 'all'],
    ['start dates by month', D_('m', 'start'), 'cols', 'count', false, 'all'],
    ['new contracts by month', D_('m', 'created'), 'cols', 'count', false, 'all'],
    ['Juno avtal per månad', D_('m', 'end'), 'cols', 'count', false, 'Juno'],
    ['avtal per kvartal som tidslinje', D_('q', 'end'), 'cols', 'count', false, 'all'],
    ['Juno contracts as a bubble chart', null, 'bubbles', 'count', false, 'Juno'],
    ['value by stream as a treemap', { by: 'folder' }, 'blocks', 'value', false, 'all'],
  ];
  for (const [q, split, pic, measure, trend, set] of BOOK) test(JSON.stringify(q), () => {
    const w = world();
    assert.deepEqual({ ...(w.hbParse(q) || {}) }, { act: 'dig', key: 'q:' + q }, 'HaTi reads it free, as a card on the board');
    const { D, P } = planOf(w, q);
    assert.deepEqual(P.split ? { ...P.split } : null, split, 'split');
    assert.equal(P.pic, pic, 'picture'); assert.equal(P.measure, measure, 'measure'); assert.equal(!!P.trend, trend, 'trend');
    if (set === 'all') assert.ok(D.whole, 'the whole book');
    else { assert.ok(!D.whole, 'a set, not the whole book'); assert.match(D.setLabel, new RegExp(set.replace(/[.*+?^${}()[\]\\]/g, '\\$&'), 'i')); }
  });
  /* a question with no chart words keeps its old road */
  const KEEP = [
    ['Show me all Juno contracts', { act: 'dig', key: 'q:Show me all Juno contracts' }],
    ['show expired contracts', { act: 'dig', key: 'f:past' }],
    ['which contracts are overdue', { act: 'panel', kind: 'obl', lens: null }],
    ['renewals', { act: 'panel', kind: 'ren', lens: null }],
    ['payment terms', { act: 'panel', kind: 'pay', lens: null }],
    ['payment terms suppliers vs customers', { act: 'split', kind: 'pay' }],
    ['contracts between 2 million and 80 million', { act: 'dig', key: 'q:contracts between 2 million and 80 million' }],
  ];
  for (const [q, want] of KEEP) test('keeps its road: ' + JSON.stringify(q), () => {
    const w = world();
    assert.equal(w.hbRecipeRead(q), null, 'no chart words read');
    assert.deepEqual({ ...(w.hbParse(q) || {}) }, want);
  });
  test('a chart question with words neither reader knows goes on to Copilot, its picture already read', () => {
    const w = world();
    const R = w.hbRecipeRead('top 10 contracts by value as bars');
    assert.ok(R && R.left, 'something left for Copilot'); assert.equal(R.pic, 'bars');
    assert.equal(w.hbParse('top 10 contracts by value as bars'), null);
  });
});

describe('F448 (2) — the dropdowns: a press is kept per card, a dead option says why', () => {
  test('a press changes the picture, the split and the measure, and is remembered', () => {
    const w = world(); const key = 'q:Show Juno contracts by month';
    let { D, P } = planOf(w, 'Show Juno contracts by month');
    assert.equal(P.pic, 'cols');
    w.hbRecipeSet(key, 'pic', 'gantt'); assert.equal(w.hbPlan(D).pic, 'gantt');
    w.hbRecipeSet(key, 'split', 'g:folder'); ({ P } = planOf(w, 'Show Juno contracts by month'));
    assert.deepEqual({ ...P.split }, { by: 'folder' });
    w.hbRecipeSet(key, 'split', 'd:q:signed'); ({ P } = planOf(w, 'Show Juno contracts by month'));
    assert.equal(P.pic, 'cols', 'a time split draws columns'); assert.deepEqual({ ...P.split }, D_('q', 'signed'));
    w.hbRecipeSet(key, 'measure', 'value'); w.hbRecipeSet(key, 'trend', true);
    ({ P } = planOf(w, 'Show Juno contracts by month'));
    assert.equal(P.measure, 'value'); assert.equal(P.trend, true);
    const kept = w.hbRecipeClean(JSON.parse(JSON.stringify(w.hbS().recipe)));
    assert.deepEqual(JSON.parse(JSON.stringify(kept[key])), { pic: 'cols', measure: 'value', trend: true, split: D_('q', 'signed') }, 'what is kept survives a reload');
  });
  test('the whole book on the Contracts dropdown, and back', () => {
    const w = world(); const key = 'q:Show Juno contracts by month';
    const n = planOf(w, 'Show Juno contracts by month').D.ids.length;
    w.hbRecipeSet(key, 'which', 'all');
    const D = w.hbDigData(key, 'all'); assert.ok(D.whole); assert.ok(D.ids.length > n);
    w.hbRecipeSet(key, 'which', 'set'); assert.equal(w.hbDigData(key, 'all').ids.length, n);
  });
  test('options that cannot draw are greyed with the reason; the trend needs time', () => {
    const w = world();
    const { D, P } = planOf(w, 'contracts by stage');
    const row = w.hbRecipeRowHtml(D, P);
    assert.match(row, /data-hb-rc="split"/); assert.match(row, /data-hb-rc="pic"/); assert.match(row, /data-hb-rc="measure"/);
    /* RE-POINTED 10 Oct 2026 (owner: a switch that cannot be used is hidden) */
    assert.ok(!/data-hb-rtrend/.test(row), 'no trend switch without time');
    const ms = w.hbRcOptions('measure', P, D);
    assert.ok(ms.filter(x => x.v !== 'count').every(x => !x.on && x.why), 'a ring has its own measure, said');
    w.canViewValues = () => false;
    const pics = w.hbRcOptions('pic', P, D);
    assert.ok(pics.find(x => x.v === 'blocks' && !x.on && x.why), 'blocks need values');
    assert.equal(w.hbPlan({ key: 'q:z', chart: { pic: 'blocks', split: { by: 'folder' }, measure: 'value' } }).pic, 'ring', 'a reader without values never sees money');
    delete w.canViewValues;
  });
  test('the menus draw only the choices that work, keep the one in use, and bring one back when it works (owner, 10 Oct 2026)', () => {
    const w = world();
    const { D, P } = planOf(w, 'contracts by stage');
    const all = w.hbRcOptions('measure', P, D), shown = w.hbRcShown('measure', P, D);
    assert.ok(all.some(x => !x.on), 'the reading still knows the dead ones');
    assert.ok(shown.length && shown.every(x => x.on), 'the menu lists none of them');
    assert.equal(shown.length, all.filter(x => x.on).length);
    const P2 = Object.assign({}, P, { pic: 'list', split2: { by: 'folder' } });
    const one = w.hbRcShown('pic', P2, D).map(x => x.v);
    assert.ok(!one.includes('ring') && !one.includes('bars'), 'a one-split picture is not offered under Then by');
    assert.ok(one.includes('list'), 'the one in use stays');
    const P3 = Object.assign({}, P2, { split2: null });
    assert.ok(w.hbRcShown('pic', P3, D).map(x => x.v).includes('bars'), 'and comes back when Then by is cleared');
    const stuck = Object.assign({}, P, { pic: 'blocks' });
    w.canViewValues = () => false;
    const kept = w.hbRcShown('pic', stuck, D).find(x => x.v === 'blocks');
    delete w.canViewValues;
    assert.ok(kept && kept.on && !kept.why, 'the choice in use is kept, pressable, without a reason');
    const row = w.hbRecipeRowHtml(D, P);
    assert.ok(!/<small>/.test(row), 'no grey reason anywhere on the row');
  });
});

describe('F448 (3) — month columns', () => {
  test('a column per month on the date asked, each a door, a column for no date', () => {
    const w = world();
    const { D, P } = planOf(w, 'show me a timeline by month');
    const cs = D.ids.map(id => w.getContract(id));
    const R = w.hbColsSvg(D, cs, P);
    assert.match(R.body, /class="hb-svg hb-cols"/);
    assert.match(R.body, new RegExp('data-hb-dig="qm:q:show me a timeline by month§m§' + bucket(3) + '§end"'), 'a month is a door');
    assert.match(R.body, /data-hb-dig="qm:[^"]*§m§none§end"/, 'the drafts with no end date have their own column');
    assert.match(R.body, /hb-sv-today/, 'today is marked on an end-date chart');
    const M = w.hbDigData('qm:q:show me a timeline by month§m§' + bucket(3) + '§end', 'all');
    assert.deepEqual([...M.ids].sort(), ['MK-7', 'MK-8'], 'the door opens that month\'s contracts');
  });
  test('quarters and years bucket the same contracts; a long span folds into Earlier and Later', () => {
    const w = world();
    assert.equal(w.hbBucketOf('2026-11-03', 'q'), '2026-Q4'); assert.equal(w.hbBucketOf('2026-11-03', 'y'), '2026');
    const c = { expiry: '2026-11-03' };
    assert.ok(w.hbInBucket(c, 'q', 'end', '2026-Q4')); assert.ok(w.hbInBucket(c, 'm', 'end', 'lt:2027-01')); assert.ok(!w.hbInBucket(c, 'm', 'end', 'gt:2026-11'));
    w.state.contracts.push({ id: 'MK-FAR', name: 'Far', counterparty: 'Far Ltd', status: 'Signed', value: 1, expiry: mon(60), audit: [], metadata: {} });
    const { D, P } = planOf(w, 'contracts ending by month');
    const R = w.hbColsSvg(D, D.ids.map(id => w.getContract(id)), P);
    assert.match(R.body, /data-hb-dig="qm:[^"]*§m§gt:\d{4}-\d{2}§end"/, 'what lies past the window is one Later column, a door');
    assert.ok((R.body.match(/class="hb-sv-cbox/g) || []).length <= w.HB_COLS_MAX + 3, 'never more than the window and its edges');
  });
});

describe('F448 (4) — trends: a line through enough history, or the plain reason why not', () => {
  test('time to sign: a falling line, the sentence worked out by HaTi, the unfinished month left out', () => {
    const w = world();
    const { D, P } = planOf(w, 'Is time to sign getting faster?');
    const cs = D.ids.map(id => w.getContract(id));
    const R = w.hbColsSvg(D, cs, P);
    assert.match(R.body, /class="hb-sv-trend"/, 'the line is drawn');
    assert.match(R.say, /^Trend line, average days to sign per month: about \d+ days → about \d+ days over \d+ months · getting faster$/);
    const [from, to] = (R.say.match(/(\d+) days → about (\d+) days/) || []).slice(1).map(Number);
    assert.ok(from > to, 'from ' + from + ' to ' + to);
    assert.match(R.note, /\d+ contracts not signed yet \(KES [\d.]+M\) are not drawn\./, 'what is not signed yet is said apart, with its money, not drawn as "no date"');
    /* SIGNED IS THE STAGE, NOT THE DATE (4 Oct 2026): an executed contract with
       no signing date on record stands in the "No date" column — never among
       the not signed yet */
    assert.equal(R.none, cs.filter(c => c.status === 'Signed' && !c.signedAt).length, 'the undated executed ones are the No date column');
    assert.equal(R.unsigned, cs.filter(c => c.status !== 'Signed').length, 'only the not-yet-signed are said apart');
  });
  test('fewer than six months with three contracts each: no line, the reason in words', () => {
    const w = world();
    w.state.contracts = w.state.contracts.filter(c => !/^MK-S[0-4]/.test(c.id));
    const { D, P } = planOf(w, 'Is time to sign getting faster?');
    const R = w.hbColsSvg(D, D.ids.map(id => w.getContract(id)), P);
    assert.doesNotMatch(R.body, /hb-sv-trend"/, 'never a line from too little');
    assert.equal(R.say, '');
    assert.match(R.note, /Not enough history yet for a trend\. It needs 6 months with at least 3 contracts each; there are 3\./);
  });
  test('a month with fewer than three contracts is hollow and left out of the line', () => {
    const w = world();
    w.state.contracts = w.state.contracts.filter(c => c.id !== 'MK-S30' && c.id !== 'MK-S31');
    const { D, P } = planOf(w, 'Is time to sign getting faster?');
    const R = w.hbColsSvg(D, D.ids.map(id => w.getContract(id)), P);
    assert.match(R.body, /hb-sv-colhollow/); assert.match(R.note, /Hollow columns have fewer than 3 contracts/);
    assert.match(R.say, /over \d+ months/, 'still enough months for a line');
  });
  test('the line is least squares, and steady within five per cent', () => {
    const w = world();
    const T = w.hbTrendOf([0, 1, 2, 3, 4, 5].map(i => ({ i, y: 10 + 2 * i })));
    assert.equal(Math.round(T.y0), 10); assert.equal(Math.round(T.y1), 20);
    assert.equal(w.hbTrendOf([0, 1, 2, 3, 4].map(i => ({ i, y: i }))), null, 'five points are not a trend');
    const flat = w.hbTrendOf([0, 1, 2, 3, 4, 5].map(i => ({ i, y: 100 + (i % 2) })));
    assert.match(w.hbTrendDir('count', flat), /steady/);
  });
  test('a count never trends below nothing (bug log, 10 Oct 2026)', () => {
    const w = world();
    const T = w.hbTrendOf([20, 12, 3, 0, 0, 0].map((y, i) => ({ i, y })));
    assert.ok(T.y1 >= 0, 'the line ends at or above zero: ' + T.y1);
    assert.match(w.hbTrendDir('count', T), /down|fall/i, 'and still says it fell');
  });
});

describe('F448 (5) — live contracts each month read the monthly picture of the book', () => {
  test('no pictures yet: said in words, with a way forward that works now', () => {
    const w = world();
    w.hbSnapsSet([]);
    const { D, P } = planOf(w, 'How many live contracts did we have each month?');
    const R = w.hbLiveSvg(D, P);
    assert.match(R.body, /has not taken a monthly picture of the book yet/);
    assert.match(R.body, /data-hb-rinstead/, 'the way forward: contracts signed per month');
  });
  test('one picture: the point, where the line starts, and when', () => {
    const w = world();
    w.hbSnapsSet([{ month: bucket(0), live: 150 }]);
    const { D, P } = planOf(w, 'How many live contracts did we have each month?');
    const R = w.hbLiveSvg(D, P);
    assert.doesNotMatch(R.body, /hb-sv-trend"/);
    assert.match(R.note, /Not enough history yet for a trend\. HaTi took its first monthly picture of the book in .+\. With 6 monthly pictures the line starts, in .+\./);
  });
  test('six pictures: the line', () => {
    const w = world();
    const snaps = [0, 1, 2, 3, 4, 5].map(i => ({ month: bucket(i - 5), live: 120 + 6 * i }));
    w.hbSnapsSet(snaps);
    const { D, P } = planOf(w, 'How many live contracts did we have each month?');
    const R = w.hbLiveSvg(D, P);
    assert.match(R.body, /class="hb-sv-trend"/); assert.match(R.say, /^Trend line, live contracts per month: about 120 → about 150 over 6 months · rising$/);
  });
});

describe('F448 (7) — read it with me: one contract\'s paper, asked for in words (Young, 4 Oct 2026)', () => {
  const ASK = [
    ['let me ask questions about MK-7', 'MK-7'],
    ['Can I ask some questions about MK-8?', 'MK-8'],
    ['analyze MK-7', 'MK-7'],
    ['analyse MK-9 please', 'MK-9'],
    ['read MK-7 with me', 'MK-7'],
    ['open the Freight contract and read it with me', 'MK-7'],
    ['go through the Warehouse Lease with me', 'MK-1'],
    ['questions about Packaging', 'MK-3'],
    ['analysera MK-7', 'MK-7'],
    ['låt mig ställa frågor om MK-8', 'MK-8'],
    ['läs avtalet MK-9 med mig', 'MK-9'],
  ];
  for (const [q, id] of ASK) test(JSON.stringify(q), () => {
    const w = world();
    assert.deepEqual({ ...(w.hbParse(q) || {}) }, { act: 'analyze', id });
  });
  test('"bring up" still opens the card, and a reading question with no one contract is not a guess', () => {
    const w = world();
    assert.deepEqual({ ...(w.hbParse('bring up MK-7') || {}) }, { act: 'card', id: 'MK-7' });
    const r = w.hbParse('analyze my portfolio');
    assert.ok(!r || r.act !== 'analyze', JSON.stringify(r));
    const j = w.hbParse('let me ask questions about Juno');   /* three Juno contracts: not a guess */
    assert.ok(!j || j.act !== 'analyze', JSON.stringify(j));
  });
  test('the card\'s own button is the same door (data-hb-analyze, the map\'s own words)', () => {
    const src = read('js/views/homeboard.js');
    const card = src.slice(src.indexOf('function hbCardHtml('), src.indexOf('function hbCardHtml(') + 4000);
    assert.match(card, /data-hb-analyze="\$\{_hbE\(K\.id\)\}"/);
    assert.match(card, /i18t\('int_analyze'\)/, 'one label for one act: the map card says "Analyze contract" too');
    assert.match(src, /function hbAnalyze\(id\)\{[\s\S]*?igAnalyze\(id\)/, 'Explorer\'s igAnalyze stays the one door');
  });
});

describe('F448 (6) — a chart of the whole book is not a count', () => {
  test('the six figures follow a set, never the whole book read back as one', () => {
    const w = world();
    const whole = w.hbBookData('all').figs.live.n;
    w.hbS().path = ['q:show me a timeline by month']; w.hbSave();
    assert.equal(w.hbCountIds('all'), null); assert.equal(w.hbBookData('all').figs.live.n, whole);
    w.hbS().path = ['q:Show Juno contracts by month']; w.hbSave();
    assert.ok(w.hbBookData('all').figs.live.n < whole, 'a set is counted');
  });
  test('a card pressed while counting Juno opens WITHIN Juno, and the six stay on Juno', () => {
    const w = world();
    const whole = w.hbBookData('all').figs.live.n;
    w.hbS().path = ['q:Show me all Juno contracts']; w.hbSave();
    const juno = w.hbBookData('all').figs.live.n;
    assert.equal(juno, 3); assert.ok(juno < whole);
    for (const key of ['f:live', 'st:Signed', 'cp:Juno Fresh AB', 'f:ending']){
      try { w.hbDig(key, false, true); } catch (_){ /* the paint needs a page; the trail is what is asked */ }
      assert.deepEqual([...w.hbS().path], ['q:Show me all Juno contracts', key], key + ' nests under the count');
      assert.equal(w.hbBookData('all').figs.live.n, juno, key + ': the six stay on Juno');
      const D = w.hbDigData(key, 'all');
      assert.ok(D.ids.every(id => /^MK-[789]$/.test(id)), key + ': the list is Juno\'s only');
    }
    assert.equal(w.hbDigData('st:Signed', 'all').stage, null, 'Open these opens the counted list, never every Signed contract');
    /* a typed question still starts afresh; with no count a press starts afresh too */
    try { w.hbDig('q:Naivas contracts', false); } catch (_){}
    assert.deepEqual([...w.hbS().path], ['q:Naivas contracts']);
    w.hbS().path = []; w.hbSave();
    try { w.hbDig('f:live', false, true); } catch (_){}
    assert.deepEqual([...w.hbS().path], ['f:live']); assert.equal(w.hbBookData('all').figs.live.n, whole);
  });
  test('every word the recipe prints is in both books', () => {
    const src = read('js/views/homeboard.js');
    const reg = src.slice(src.indexOf('/* ---------------- THE RECIPE'), src.indexOf('function hbDigBodyHtml('));
    const keys = [...new Set((reg.match(/'hb_(?:rc|sp|dt|pic|ms|why|tr|snap|c)_[a-zA-Z_]+'/g) || []).map(k => k.slice(1, -1)))];
    const i18n = read('js/i18n.js');
    const literal = keys.filter(k => !/_$/.test(k));
    for (const k of literal){
      const n = (i18n.match(new RegExp('^\\s*' + k + '(?:_one|_other)?:', 'mg')) || []).length;
      assert.ok(n >= 2, k + ' in both books');
    }
  });
});

describe('F448 (7) — the monthly picture on the server: one a month, behind the stream wall', () => {
  const { startHati, seedWorkspace } = require('./helpers');
  let h, w;
  const { before, after } = require('node:test');
  before(async () => { h = await startHati(); w = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });
  test('this month\'s picture, counted for the streams each person may open; money for those who may see it', async () => {
    const month = mon(0).slice(0, 7);
    const a = await w.admin.json('/api/book/snapshots');
    assert.deepEqual(a.snapshots.map(x => [x.month, x.live]), [[month, 4]], 'the four live fixtures');
    assert.ok(a.snapshots[0].value > 0, 'the admin sees the value');
    const r = await w.restricted.json('/api/book/snapshots');
    assert.deepEqual(r.snapshots.map(x => x.live), [2], 'a member limited to one stream counts only that stream');
    const n = await w.novalues.json('/api/book/snapshots');
    assert.equal(n.snapshots[0].live, 4); assert.ok(!('value' in n.snapshots[0]), 'no value for a reader who may not see values');
    const again = await w.admin.json('/api/book/snapshots');
    assert.equal(again.snapshots.length, 1, 'one picture a month, never retaken');
  });
});

describe('F448 (8) — Copilot may name the picture; the words HaTi read win', () => {
  test('the server keeps only a picture in the board\'s own words, never a number', () => {
    const src = read('server/server.js');
    /* the cleaner with its word lists (one recipe language, 4 Oct 2026: the
       lists sit beside it) */
    const body = src.slice(src.indexOf('const GRAPH_CHART_PICS'), src.indexOf("app.post('/api/ai/graph'"));
    const clean = new Function(body + '\nreturn graphChartClean;')();
    assert.deepEqual(clean({ pic: 'cols', split: 'quarter', date: 'signed', measure: 'value', trend: true, total: 99 }),
      { pic: 'cols', measure: 'value', trend: true, split: { by: 'date', unit: 'q', date: 'signed' } });
    assert.deepEqual(clean({ pic: 'ring', split: 'stream' }), { pic: 'ring', split: { by: 'folder' } });
    assert.equal(clean({ pic: 'pie3d', split: 'galaxy' }), null, 'a word it does not know is dropped');
    assert.equal(clean('bars'), null);
    /* on the board the answer is the board's actions instead (work order Part 2) */
    assert.match(src, /chart: (?:onBoard \? null : )?graphChartClean\(out\.chart\)/, 'the route answers with the cleaned picture');
  });
  test('a list Copilot found is drawn with the picture the question asked for', () => {
    const w = world();
    w.hbAsk('top 10 contracts by value as bars');            // Copilot's to answer: the words are kept
    w.hbShowFound(['MK-1', 'MK-2', 'MK-7'], 'Top 10 by value', { pic: 'ring', split: { by: 'date', unit: 'm', date: 'end' }, measure: 'value' });
    const D = w.hbDigData('ls', 'all');
    const P = w.hbPlan(D);
    assert.equal(P.pic, 'bars', 'the typed word "bars" wins over the model');
    assert.equal(P.measure, 'value', 'the model fills what the words did not say');
    w.hbShowFound(['MK-1', 'MK-2'], 'Two', null);
    assert.equal(w.hbPlan(w.hbDigData('ls', 'all')).pic, 'ring', 'a list with no picture named keeps the default');
  });
});
