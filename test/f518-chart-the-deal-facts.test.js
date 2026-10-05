/* f518 — CHART THE DEAL FACTS (work order "the board that answers right",
   Part 8, 5 Oct 2026)

     A. five new splits under "Deal facts": whose move, negotiation rounds,
        overdue duties, renewal decision, risks found — every group read off
        what the LIGHT list carries (no audit, no upload text), and a fact
        HaTi cannot read is a group of its own, never a guess;
     B. "which stalled deals are waiting on us, by counterparty" reads free;
        "negotiations by stage" offers the negotiation round (Part 2's choice);
     C. READING MUST NOT WRITE: counting creates no negotiation (source sweep
        and a run);
     D. the brief's concerns ride the light list as `_briefLite` (the risks
        split counts in production), and are stripped on save — both hosts. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract } = require('./helpers');
const { read, strip, J, boardWorld, openPlan, text } = require('./board-world');

const CONTRACT_SRC = read('js/views/contract.js');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); const j = src.indexOf('\n}\n', i); return src.slice(i, j + 3); };

/* a contract as the LIGHT list hands it over: no audit, no comments */
const light = (id, o) => Object.assign({ id, name: 'Deal ' + id, counterparty: o.cp || 'Juno AB', status: o.status || 'Under Review',
  value: 1e6, folder: 'proc', metadata: {}, _light: true, audit: undefined, comments: undefined }, o.extra || {});

function dealWorld(contracts){
  return boardWorld({ contracts, before: w => {
    /* whose move is the Negotiations page's own reading; here it reads the
       server's `_reach` word the way negWhoseMove does in production */
    w.negWhoseMove = c => (c && c._reach && c._reach.move) ? { k: c._reach.move } : null;
    w.graphNodeFacts = c => ({ overdue: (c.obligations || []).filter(o => o.due && o.due < '2000-01-01' && !o.done).length });
    w.graphDecisionOf = c => ({ label: (c.metadata && c.metadata.decisionQ) || '' });
    w.eval(fnSrc(CONTRACT_SRC, 'docXrayBriefWatch'));
    w.eval(fnSrc(CONTRACT_SRC, 'docXrayBriefOdd'));
    w.eval(read('js/risks.js'));
  } });
}
const BOOK = () => [
  light('D1', { cp: 'Juno AB', extra: { _reach: { move: 'you' }, negotiation: { rounds: [{}, {}] }, changes: [{ id: 'x1' }] } }),
  light('D2', { cp: 'Naivas', extra: { _reach: { move: 'you' }, negotiation: { rounds: [{}, {}, {}, {}, {}] }, changes: [{ id: 'x2' }] } }),
  light('D3', { cp: 'Bidco', extra: { _reach: { move: 'them' }, negotiation: { rounds: [{}] }, changes: [{ id: 'x3' }] } }),
  light('D4', { cp: 'Juno AB', status: 'Signed', extra: { obligations: [{ id: 'o1', due: '1999-01-01' }], metadata: { decisionQ: 'Q3 2027' } } }),
  light('D5', { cp: 'Kabras', status: 'Signed', extra: { metadata: { decisionQ: 'Q3 2027' },
    _briefLite: { data: { watchouts: [{ point: 'No liability cap', quote: '', why: '', wording: true }, { point: 'Auto renews', quote: '', why: '', wording: true }, { point: 'Call them', quote: '', why: '', wording: false }], unusual: [] } } } }),
  light('D6', { cp: 'Kabras', status: 'Draft', extra: { scan: { findings: [] } } }),
];
/* the card's own groups: its set, each contract labelled by the card's split */
const countOf = w => { const { D, P } = openPlan(w); const out = {};
  for (const id of D.ids){ const c = w.getContract(id); const l = w.hbGroupLabel(P.split.by, w.hbGroupOf(c, P.split.by)); out[l] = (out[l] || 0) + 1; }
  return out; };
const groupsOf = (w, by) => { w.hbS().path = []; w.hbAsk('contracts by ' + by); return countOf(w); };

describe('F518 (A) — every deal fact is read off the light list', () => {
  test('whose move: us · them · nothing open', () => {
    const g = groupsOf(dealWorld(BOOK()), 'whose move');
    assert.deepEqual(g, { 'Waiting on us': 2, 'Waiting on them': 1, 'Nothing open': 3 });
  });
  test('negotiation rounds, read RAW (4+ is one group)', () => {
    const g = groupsOf(dealWorld(BOOK()), 'negotiation rounds');
    assert.deepEqual(g, { 'No rounds yet': 3, '1 round': 1, '2 rounds': 1, '4+ rounds': 1 });
  });
  test('overdue duties, and the renewal decision', () => {
    const w = dealWorld(BOOK());
    assert.deepEqual(groupsOf(w, 'overdue duties'), { 'Has overdue duties': 1, 'Nothing overdue': 5 });
    const d = groupsOf(w, 'renewal decision');
    assert.equal(d['Q3 2027'], 2);
    assert.equal(d['Not known'], 4, 'no decision is a group of its own, never a guess');
  });
  test('risks found: the brief\'s concerns from the light list count; never read is "not read yet"', () => {
    const g = groupsOf(dealWorld(BOOK()), 'open risks');
    assert.equal(g['1-2 open risks'], 1, 'D5: two needing wording, the third is advice (' + JSON.stringify(g) + ')');
    assert.equal(g['No open risks'], 1, 'D6 was scanned and is clean');
    assert.equal(g['Not read yet'], 4, 'never read by the scan nor the brief: we do not know');
  });
  test('the Split menu shows them under a "Deal facts" heading', () => {
    const w = dealWorld(BOOK());
    w.hbAsk('contracts by stage');
    const { D, P } = openPlan(w);
    const opts = J(w.hbRcOptions('split', P, D));
    const head = opts.findIndex(o => o.head);
    assert.ok(head > 0, 'a heading: ' + JSON.stringify(opts.map(o => o.v)));
    assert.equal(opts[head].head, 'Deal facts');
    assert.deepEqual(opts.slice(head, head + 5).map(o => o.v), ['g:move', 'g:rounds', 'g:overdue', 'g:decision', 'g:risks']);
    assert.ok(opts.slice(head, head + 5).every(o => o.on), 'each one can be pressed');
  });
});

describe('F518 (B) — the deal questions read free', () => {
  test('"which stalled deals are waiting on us, by counterparty"', () => {
    const w = dealWorld(BOOK());
    const said = w.hbAsk('which stalled deals are waiting on us, by counterparty');
    assert.ok(said, 'read free');
    const { D, P } = openPlan(w);
    assert.equal(P.split.by, 'counterparty');
    assert.match(D.setLabel, /waiting on us/);
    assert.deepEqual(countOf(w), { 'Juno AB': 1, Naivas: 1 });
  });
  test('"negotiations by stage" counts the deals that have one, and offers the round', () => {
    const w = dealWorld(BOOK());
    w.hbAsk('negotiations by stage');
    const meta = J(w.hbTakeMeta()) || {};
    const { D, P } = openPlan(w);
    assert.match(D.setLabel, /in negotiation/); assert.equal(D.ids.length, 3); assert.equal(P.split.by, 'status');
    assert.equal((meta.choices || [])[0].label, 'By negotiation round');
    w.hbChoicePress(meta.choices[0]);
    assert.equal(openPlan(w).P.split.by, 'rounds');
  });
});

describe('F518 (C) — reading must not write', () => {
  test('the deal-fact reader calls nothing that creates a negotiation', () => {
    const src = strip(read('js/views/homeboard.js'));
    const body = fnSrc(src, 'hbDealGroupOf');
    assert.ok(body.length > 200, 'found');
    assert.doesNotMatch(body, /\bnego(?:Init|Changes|AllChanges|Round|ClauseList)\s*\(/);
    const ig = strip(read('js/views/intelligence.js'));
    const at = ig.indexOf("'in negotiation'"); assert.ok(at > 0);
    assert.doesNotMatch(ig.slice(at, at + 300), /\bnego(?:Init|Changes|AllChanges|Round|ClauseList)\s*\(/);
  });
  test('counting every split leaves the contracts exactly as they were', () => {
    const w = dealWorld(BOOK());
    const before = JSON.stringify(w.state.contracts);
    for (const by of ['whose move', 'negotiation rounds', 'overdue duties', 'renewal decision', 'open risks']) groupsOf(w, by);
    w.hbAsk('negotiations by stage');
    assert.equal(JSON.stringify(w.state.contracts), before);
    assert.ok(!w.state.contracts.find(c => c.id === 'D4').negotiation, 'no negotiation was started');
  });
});

describe('F518 (D) — the brief\'s concerns ride the light list, and never the record', () => {
  let h, W, db;
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [fixtureContract('MK-BL1', 'Supply', 'Juno AB', 'proc', 1000, 'Under Review')] });
    const { DatabaseSync } = require('node:sqlite');
    db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    db.prepare('INSERT OR REPLACE INTO briefs (contract_id, json, created_at) VALUES (?,?,?)').run('MK-BL1', JSON.stringify({ data: {
      summary: 'A long memo that never rides the list.',
      watchouts: [{ point: 'No liability cap', quote: 'x'.repeat(600), why: 'Unlimited exposure.', wording: true }],
      unusual: ['A bare old-style sentence'] } }), new Date().toISOString());
  });
  after(async () => { try { db.close(); } catch (_){} await h.stop(); });
  test('the list carries the concerns, short, and not the memo', async () => {
    const row = (await W.admin.json('/api/contracts?limit=50')).rows.find(x => x.id === 'MK-BL1');
    assert.equal(row._hasBrief, true);
    assert.ok(row._briefLite && row._briefLite.data, JSON.stringify(row).slice(0, 300));
    const w0 = row._briefLite.data.watchouts[0];
    assert.equal(w0.point, 'No liability cap'); assert.equal(w0.wording, true); assert.equal(w0.quote.length, 240);
    assert.equal(row._briefLite.data.unusual[0].point, 'A bare old-style sentence');
    assert.ok(!('summary' in row._briefLite.data), 'never the memo');
  });
  test('a save that echoes it back does not store it', async () => {
    const full = await W.admin.json('/api/contracts/MK-BL1');
    const baseVersion = full._v; delete full._v;
    full._briefLite = { data: { watchouts: [{ point: 'planted' }] } };
    await W.admin.json('/api/contracts/MK-BL1', { method: 'PUT', body: { contract: full, baseVersion } });
    const stored = JSON.parse(db.prepare('SELECT json FROM contracts WHERE id=?').get('MK-BL1').json);
    assert.ok(!('_briefLite' in stored));
  });
  test('the browser strips it on save too, and the readers fall back to it', () => {
    assert.match(read('js/core.js'), /delete payload\._briefLite;/);
    for (const n of ['docXrayBriefWatch', 'docXrayBriefOdd'])
      assert.match(fnSrc(CONTRACT_SRC, n), /c\._briefLite&&c\._briefLite\.data/);
  });
});
