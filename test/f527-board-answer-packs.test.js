/* f527 — CHARTS THAT EXPLAIN, PARTS 3, 5 AND 6: ANSWER PACKS, HOW HATI WORKED IT OUT, SUMMARISE MY BOARD
   (Young, 5 Oct 2026, "HaTi Board: Charts That Explain", recommendation 1:
   "risk exposure (risk score × value), share of total, running total, average
   and median, 'act by' date (end date minus notice period), and 'not checked'
   as its own group")
   ============================================================================
     (1) RISK EXPOSURE — value × the weight of the worst open risk (high 1,
         medium ½, low ¼); a contract nobody has read is left out and said;
     (2) AVERAGE AND MEDIAN VALUE — never added up, never a ring;
     (3) OUR STANDARDS — off, met, NOT CHECKED, each its own group;
     (4) RUNNING TOTAL and SHARE OF TOTAL — only of a measure that adds up;
     (5) ACT BY — "act by", "give notice" read as the renewal decision date;
     (6) ONE LANGUAGE — the server's lists equal the board's; money measures
         obey canViewValues; both books.
   Run: node --test test/f525-board-new-measures.test.js */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const pad = n => String(n).padStart(2, '0');
const mon = (off, d = 15) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + off, d); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()); };

function world(opts = {}){
  const cs = []; let i = 0;
  const add = o => cs.push(Object.assign({ id: 'MK-' + (100 + i), name: 'A ' + i, status: 'Signed', value: 1e6, expiry: mon(6 + (i % 9)), audit: [], metadata: {}, _raisedAt: mon(-30) }, o, { id: 'MK-' + (100 + i++) }));
  /* Juno: read, one high risk each, 4M; Naivas: read, one low risk, 2M; Baltic: never read */
  for (let k = 0; k < 3; k++) add({ counterparty: 'Juno AB', folder: 'proc', value: 4e6, scan: { findings: [] }, _rk: 'high',
    playbook: { verdicts: [{ category: 'Payment terms', status: 'deviation' }] } });
  for (let k = 0; k < 2; k++) add({ counterparty: 'Naivas', folder: 'sales', value: 2e6, scan: { findings: [] }, _rk: 'low',
    playbook: { verdicts: [{ category: 'Payment terms', status: 'aligned' }] } });
  for (let k = 0; k < 4; k++) add({ counterparty: 'Baltic Oy', folder: 'sales', value: 1e6 });
  cs[0].metadata = { renewalType: 'auto-renew', noticePeriodDays: 60 }; cs[0].expiry = mon(3);
  const w = buildWorld({ intelView: true }).win;
  w.state = { contracts: cs, settings: {}, view: 'dashboard' };
  w.FOLDERS = { proc: { id: 'proc', name: 'Procurement' }, sales: { id: 'sales', name: 'Sales' } };
  w.cKind = () => 'Contract';
  w.getContract = id => w.state.contracts.find(c => c.id === id) || null;
  w.payDays = () => null; w.paySide = () => null; w.contractExpired = () => false;
  w.currentUser = () => ({ id: 'u1', name: 'Amina', role: 'legal' });
  w.riskOpenOf = c => c && c._rk ? [{ sev: c._rk === 'high' ? 'high' : 'low' }] : [];
  if (opts.noMoney) w.canViewValues = () => false;
  w.eval(read('js/views/homeboard.js'));
  w.eval('intel.lenses=[]; intel.groups=null; intel.groupBy="folder"; intel.history=[];');
  w.hbPaintBoard = () => {};
  const s = w.hbS(); s.recipe = {}; s.path = []; s.panels = []; s.digBig = false; s.face = 'board';
  return { w, cs };
}


const Q = { risks: 'Show me our top risk contracts', ending: 'Which month and year will the most value come to an end?',
  standards: 'Which contracts violate our company standards?', next12: 'What should concern me most over the next 12 months?' };

describe('f527 (1) the four questions go to their packs, free', () => {
  test('each question, its pack', () => {
    const { w } = world();
    for (const [k, q] of Object.entries(Q)) assert.equal(w.hbPackOfQ(q), k, q);
    assert.equal(w.hbPackOfQ('value by stream'), null, 'an ordinary chart question keeps its road');
    assert.equal(w.hbPackOfQ('contracts ending next month'), null);
  });
  test('asking opens the pack on the board, said free', () => {
    const { w } = world();
    const html = w.hbAsk(Q.risks);
    assert.ok(html && /Top risks/.test(html));
    assert.equal(w.hbS().path.slice(-1)[0], 'pk:risks');
    assert.match(html, /Free|free/);
  });
});

describe('f527 (2) top risks', () => {
  test('ranked by exposure, each with its reason, the unread said', () => {
    const { w } = world();
    const P = w.hbPackData('risks', 'all');
    assert.equal(P.rows.length, 5);
    assert.equal(P.rows[0].c.counterparty, 'Juno AB', 'the high risks lead');
    const txt = P.lines.join(' ').replace(/<[^>]+>/g, '');
    assert.match(txt, /5 contracts carry open risks/);
    assert.match(txt, /4 live contracts have not had their risks read/);
    assert.ok(P.cards.length >= 2);
    const D = w.hbDigData('pk:risks.c1', 'all');
    assert.equal(D.kind, 'list'); assert.equal(D.chart.measure, 'exposure');
  });
  test('drawn: cards, a ranked table, how it was worked out, next questions, the summary press', () => {
    const { w } = world();
    const html = w.hbPackHtml(w.hbDigData('pk:risks', 'all'), 'all', false);
    assert.match(html, /class="hb-pack-card"/);
    assert.match(html, /class="hb-pk-t"/);
    assert.match(html, /data-hb-dig="c:MK-100"/, 'each row a door to its contract');
    assert.match(html, /class="hb-how"/); assert.match(html, /How HaTi worked this out/);
    assert.match(html, /data-hb-next=/);
    assert.match(html, /data-hb-why="pk:risks"/, 'the summary is a press');
  });
});

describe('f527 (3) money ending, standards, the next 12 months', () => {
  test('money ending names the peak and its notice dates', () => {
    const { w } = world();
    const P = w.hbPackData('ending', 'all');
    assert.ok(P.lines.length >= 1);
    assert.match(P.lines[0].replace(/<[^>]+>/g, ''), /is the peak/);
    assert.ok(P.cards.some(k => k.chart.split.date === 'decision'), 'a card by act-by month');
  });
  test('standards counts what was checked and what never was', () => {
    const { w } = world();
    const P = w.hbPackData('standards', 'all');
    const txt = P.lines.join(' ').replace(/<[^>]+>/g, '');
    assert.match(txt, /5 of the 9 contracts have been checked/);
    assert.match(txt, /3 contracts are off standard/);
    assert.match(txt, /Payment terms/);
    assert.match(txt, /4 contracts have never been checked/);
    assert.ok(P.lists.off && P.lists.unchecked, 'each number a door');
  });
  test('the next 12 months ranks its concerns', () => {
    const { w } = world();
    const P = w.hbPackData('next12', 'all');
    assert.ok(Array.isArray(P.concerns));
    for (let i = 1; i < P.concerns.length; i++) assert.ok(P.concerns[i - 1].v >= P.concerns[i].v);
  });
});

describe('f527 (4) the pack\'s summary is written from its fact sheet', () => {
  test('the sheet holds the ranked facts and the coverage', async () => {
    const { w } = world();
    let sent = '';
    w.copilotAvailable = () => true;
    w.copilotAsk = async m => { sent = m[0].content; return { answer: 'Juno AB leads the risk. Fix it first.' }; };
    await w.hbWhyAsk('pk:risks');
    assert.match(sent, /^FACT SHEET — Top risks/);
    assert.match(sent, /Ranked by risk exposure/);
    assert.match(sent, /- Coverage: /);
    assert.ok(w.hbS().why['pk:risks']);
  });
});

describe('f527 (5) summarise my board', () => {
  test('one press for the whole board, checked like every summary', async () => {
    const { w } = world();
    const { btn } = w.hbBoardSumHtml();
    assert.match(btn, /data-hb-why="board:all"/);
    assert.match(btn, /Summarise my board/);
    let sent = '';
    w.copilotAvailable = () => true;
    w.copilotAsk = async m => { sent = m[0].content; return { answer: 'You have 9 contracts. Prices rose 37% last year.' }; };
    await w.hbWhyAsk('board:all');
    assert.match(sent, /^FACT SHEET — /);
    assert.match(sent, /morning/);
    const kept = w.hbS().why['board:all'];
    assert.ok(kept && /You have 9 contracts\./.test(kept.text) && !/37%/.test(kept.text));
  });
});

describe('f527 (7) a reason is said once', () => {
  test('a finding that already says "no liability cap" is not joined by the reading saying it again', () => {
    const { w, cs } = world();
    cs[0]._book = { terms: { liabilityCap: { state: 'uncapped' } } };
    cs[1]._book = { terms: { liabilityCap: { state: 'uncapped' } } };
    w.riskOpenOf = c => c === cs[0] ? [{ sev: 'high', title: 'No liability cap' }] : c && c._rk ? [{ sev: c._rk === 'high' ? 'high' : 'low', title: 'Short warranty' }] : [];
    const P = w.hbPackData('risks', 'all');
    const r0 = P.rows.find(r => r.c === cs[0]), r1 = P.rows.find(r => r.c === cs[1]);
    assert.equal((r0.why.match(/liability cap/gi) || []).length, 1, r0.why);
    assert.match(r1.why, /Short warranty · no liability cap/, 'the reading adds what no finding said');
  });
});
