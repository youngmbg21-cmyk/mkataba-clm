/* f531 — THE ANALYST'S PHRASEBOOK (Young, 6 Oct 2026: "think like an analyst
   … all the formats and ways an analyst would ask questions when it comes to
   analysing numbers … teach HaTi. Be expansive as possible so that questions
   are answered seamlessly")
   ============================================================================
     (1) THE OWNER'S TWO QUESTIONS — "compare the value of our contracts
         between last 2 quarters" and "what is the trend growth of our
         contracts the last 12 months?" are answered free, and right;
     (2) THE SHORTHAND — QoQ, YoY, MoM, TTM, QTD, YTD, "since January",
         "breakdown of", "concentration", "deal size", rankings, Swedish —
         each said back in the board's own words;
     (3) THE DATE — a comparison or a growth question with no date of its own
         reads the SIGNING date; unsigned contracts move by the day they were
         raised; a date the question names wins;
     (4) THE PERIOD — "last quarter" is the whole quarter before this one;
         "Q2 2026", "H1", "January to March" are exact ranges; a whole quarter
         is compared with the whole quarter before it;
     (5) A CARD'S NAME is never rewritten; Copilot is given the words as
         typed;
     (6) THE BOOK — the analyst's questions are in the precision book (f502
         holds them at 100).
   Run: node --test test/f531-board-analyst-phrasebook.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { readBook, bookContracts, mon } = require('./board-precision');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
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
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.digBig = false;
  return w;
}
/* what the board draws for a question: the plan and its set, or null */
function drawn(q){
  const w = world();
  const said = w.hbAsk(q); if (!said) return null;
  const s = w.hbS(), key = (s.path || []).slice(-1)[0];
  const D = key ? w.hbDigData(key, s.lens) : null; if (!D || D.kind !== 'list') return { said, D };
  return { said, D, P: JSON.parse(JSON.stringify(w.hbPlan(D))), w, key };
}
const pad = n => String(n).padStart(2, '0');
const lastDay = (y, m) => new Date(Date.UTC(y, m, 0)).getUTCDate();

describe('f531 (1) the owner\'s two questions', () => {
  test('"compare the value of our contracts between last 2 quarters": the last whole quarter against the one before, by value, said as a change', () => {
    const r = drawn('compare the value of our contracts between last 2 quarters');
    assert.ok(r && r.P, 'answered free');
    assert.equal(r.P.measure, 'value');
    assert.equal(r.P.compare, 'prev');
    assert.equal(r.P.window.date, 'signed', 'the value signed in each quarter');
    const t = new Date(); let q = Math.ceil((t.getMonth() + 1) / 3) - 1, y = t.getFullYear(); if (q < 1){ q = 4; y--; }
    assert.equal(r.P.window.from, `${y}-${pad(q * 3 - 2)}-01`);
    assert.equal(r.P.window.to, `${y}-${pad(q * 3)}-${lastDay(y, q * 3)}`);
    const Z = r.w.hbWinOf(r.P);
    let pq = q - 1, py = y; if (pq < 1){ pq = 4; py--; }
    assert.equal(Z.prev.from, `${py}-${pad(pq * 3 - 2)}-01`, 'held against the WHOLE quarter before');
    assert.equal(Z.prev.to, `${py}-${pad(pq * 3)}-${lastDay(py, pq * 3)}`);
    const src = r.w.hbReadSrc(r.key);
    assert.ok(src && src.reading && /against .* the period before — (up|down|no change)/.test(src.reading.lines.join(' ').replace(/<[^>]+>/g, '')), 'the reading states the change');
  });
  test('"what is the trend growth of our contracts the last 12 months?": signings by month over 12 months with the trend line', () => {
    const r = drawn('what is the trend growth of our contracts the last 12 months?');
    assert.ok(r && r.P, 'answered free');
    assert.deepEqual(r.P.split, { by: 'date', unit: 'm', date: 'signed' });
    assert.equal(r.P.trend, true);
    assert.equal(r.P.window.last, 12);
    assert.equal(r.P.window.date, 'signed', 'the period and the columns read the same date');
  });
});

describe('f531 (2) the shorthand', () => {
  const cases = [
    ['QoQ contract value', P => P.compare === 'prev' && P.measure === 'value'],
    ['YoY value', P => P.compare === 'year' && P.window.last === 1 && P.window.unit === 'y'],
    ['MoM contracts signed', P => P.compare === 'prev' && P.measure === 'count'],
    ['TTM contract value', P => P.window.last === 12 && P.window.unit === 'm' && P.window.date === 'signed'],
    ['quarter to date value', P => P.window.last === 1 && P.window.unit === 'q'],
    ['since January', P => P.window.last === 1 && P.window.unit === 'y'],
    ['contracts signed in the last 90 days', P => P.window.last === 3 && P.window.unit === 'm'],
    ['breakdown of value by stream', P => P.split.by === 'folder' && P.measure === 'value'],
    ['how is our value split across streams', P => P.split.by === 'folder' && P.measure === 'value'],
    ['distribution of contract values', P => P.split.by === 'valueBand'],
    ['how concentrated is our value', P => P.split.by === 'counterparty' && P.show === 'share'],
    ['what percent of value sits with the top 5 counterparties', P => P.top === 5 && P.show === 'share'],
    ['average deal size by stream', P => P.measure === 'avgValue' && P.split.by === 'folder'],
    ['typical contract size', P => P.measure === 'medianValue'],
    ['who are our biggest suppliers', P => P.split.by === 'counterparty' && P.top === 10 && P.measure === 'value'],
    ['rank streams by number of contracts', P => P.split.by === 'folder' && P.measure === 'count'],
    ['cumulative contract value', P => P.show === 'running' && P.split.by === 'date'],
    ['which stream signs fastest', P => P.measure === 'daysToSign' && P.split.by === 'folder'],
    ['are contracts getting bigger', P => P.measure === 'avgValue' && P.trend],
    ['heatmap of stage by stream', P => P.pic === 'heat'],
    ['jämför värdet i år med förra året', P => P.compare === 'year' && P.measure === 'value'],
    ['tillväxt i antal avtal senaste 12 månaderna', P => P.trend && P.window.last === 12],
  ];
  for (const [q, ok] of cases) test(q, () => { const r = drawn(q); assert.ok(r && r.P && ok(r.P), JSON.stringify(r && r.P)); });
});

describe('f531 (3) the date', () => {
  test('a comparison with no date reads the signing date; a named date wins; unsigned moves by the day raised', () => {
    const w = world();
    assert.match(w.hbAnalystWords('YoY value'), /\bsigned this year compared with last year\b/);
    assert.ok(!/signed/.test(w.hbAnalystWords('contracts ending YoY')), 'the date the question names wins');
    assert.equal(drawn('how is the pipeline trending').P.split.date, 'created');
  });
});

describe('f531 (4) the period', () => {
  test('"last quarter" is the whole quarter before this one', () => {
    const r = drawn('what did we sign last quarter');
    const t = new Date(); let q = Math.ceil((t.getMonth() + 1) / 3) - 1, y = t.getFullYear(); if (q < 1){ q = 4; y--; }
    assert.equal(r.P.window.from, `${y}-${pad(q * 3 - 2)}-01`);
  });
  test('named quarters, halves and months are exact ranges', () => {
    assert.deepEqual(['from', 'to'].map(k => drawn('contracts signed in Q2 2026').P.window[k]), ['2026-04-01', '2026-06-30']);
    assert.deepEqual(['from', 'to'].map(k => drawn('value signed in H1 2026').P.window[k]), ['2026-01-01', '2026-06-30']);
    assert.deepEqual(['from', 'to'].map(k => drawn('contracts signed between January and March 2026').P.window[k]), ['2026-01-01', '2026-03-31']);
    assert.deepEqual(['from', 'to'].map(k => drawn('value from November 2025 to February 2026').P.window[k]), ['2025-11-01', '2026-02-28']);
    const q = drawn('Q4 2025 vs Q1 2026 value').P;
    assert.deepEqual([q.split.unit, q.window.from, q.window.to], ['q', '2025-10-01', '2026-03-31'], 'two named quarters, side by side');
  });
  test('the reader takes an exact range in its own words', () => {
    const w = world();
    const R = w.hbRecipeRead('value signed by month from 2026-01-01 to 2026-03-31');
    assert.deepEqual([R.window.from, R.window.to], ['2026-01-01', '2026-03-31']);
  });
});

describe('f531 (5) names and Copilot', () => {
  test('a card\'s name is never rewritten', () => {
    const w = world();
    assert.match(w.hbAnalystWords('contracts by stage called Pipeline'), /called Pipeline$/);
  });
  test('the phrasebook is read on the board only; Copilot is given the words as typed', () => {
    const hb = read('js/views/homeboard.js');
    assert.match(hb, /const q = hbAnalystWords\(hbWordsApply\(raw\)\);/);
    const intel = read('js/views/intelligence.js');
    assert.ok(!/hbAnalystWords/.test(intel), 'the Copilot request carries the question as typed');
  });
});

describe('f531 (6) the book', () => {
  test('the analyst\'s questions are in the precision book', () => {
    const mine = readBook().requests.filter(r => r.src === 'analyst');
    assert.ok(mine.length >= 55, String(mine.length));
    assert.ok(mine.some(r => /between last 2 quarters/.test(r.q)) && mine.some(r => /trend growth/.test(r.q)), 'the owner\'s two questions');
    assert.ok(mine.some(r => /[åäö]/.test(r.q)), 'in Swedish too');
  });
});
