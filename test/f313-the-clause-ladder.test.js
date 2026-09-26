/* ============================================================
   f313 — THE CLAUSE LADDER (Young ruled 14 Sep 2026)
   ============================================================
   A clause that goes back and forth four times has four moves on it. The
   paper shows the last two; the ladder is how a reader reaches the rest.

   WHAT THIS FILE IS FOR, and what it is deliberately NOT for. Every claim
   here is about the RECORD and the READING over it — what a rung is, what it
   stands on, which side it belongs to, what a board row says. Nothing here
   can see a pixel. The geometry (does the chip run under the pencil, does
   the ladder draw one set of numbers or two, does every board column reach
   the screen) is measured in test/chromium/ladder-verify.js, because jsdom
   has no layout engine and every one of those three faults was invisible
   here and obvious there.

   THE WALLS ARE THE POINT OF SECTION 1. A reading drawn beside every clause
   on every paint that CREATED a negotiation would rewrite the book by being
   looked at — the READING MUST NOT WRITE rule, and the most expensive way to
   break it. */
const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'ladder.js'), 'utf8');
/* ---- A NET GREPS THE CODE, NOT THE PROSE ----
   The first two nets below failed on their first run against a file that
   does exactly what they ask, because js/ladder.js's own header NAMES the
   forbidden calls to explain why it avoids them — 'f313 greps this file for
   fetch/api/route names' matched '/api/' and the READING MUST NOT WRITE note
   matched 'negoInit'. A net that a file's documentation can trip is a net
   that will be silenced by deleting the documentation. Comments come off
   first; string literals stay, because a route written as a string IS the
   fault. */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');

/* A contract with a real argument on one clause: ours, theirs on top of it,
   ours on top of that — the three-move stack the feature exists for — plus a
   lone ask on a second clause and a settled round underneath. Built as the
   RECORD, not through the funnel: this file is about what the reading makes
   of a record, and the funnel has its own tests (f207, f207-D). */
function book(){
  const mk = (id, clauseId, side, oldText, newText, o) => Object.assign({
    id, clauseId, clauseLabel: 'Clause 4 — Limitation of liability',
    changeType: 'modify', oldText, newText, status: 'pending',
    authorSide: side, author: side === 'owner' ? 'Young' : 'Amina',
    createdAt: '2026-09-1' + (o && o.d || 0) + 'T09:00:00.000Z',
    seq: (o && o.seq) || 1, summary: (o && o.summary) || '', why: (o && o.why) || ''
  }, o || {});
  const A = 'The cap is twelve (12) months of fees.';
  const B = 'The cap is twenty-four (24) months of fees.';
  const C = 'The cap is six (6) months of fees.';
  const D = 'The cap is eighteen (18) months of fees.';
  return {
    id: 'MK-1', name: 'Supply', counterparty: 'Juno Limited',
    negotiation: {
      round: 2,
      rounds: [{ n: 1, at: '2026-09-05T09:00:00.000Z', baselineText: '', changes: [
        mk('CHG-900', 'cl_a', 'counterparty', 'Notice is 30 days.', 'Notice is 60 days.',
          { seq: 1, d: 1, status: 'accepted', clauseLabel: 'Clause 9 — Notice' })
      ] }]
    },
    changes: [
      mk('CHG-001', 'cl_4', 'owner', A, B, { seq: 2, d: 2, status: 'countered',
        counteredBy: 'CHG-002', summary: '12 → 24 months', why: 'A full season.' }),
      mk('CHG-002', 'cl_4', 'counterparty', B, C, { seq: 3, d: 3, status: 'countered',
        counterOf: 'CHG-001', counteredBy: 'CHG-003', summary: '24 → 6 months' }),
      mk('CHG-003', 'cl_4', 'owner', C, D, { seq: 4, d: 4, status: 'pending',
        counterOf: 'CHG-002', summary: '6 → 18 months' }),
      mk('CHG-010', 'cl_5', 'counterparty', 'Kept three (3) years.', 'Kept five (5) years.',
        { seq: 5, d: 5, status: 'pending', clauseLabel: 'Clause 5 — Confidentiality' })
    ]
  };
}

describe('f313 — the clause ladder', () => {

  /* ---------- 1 · THE WALLS ---------- */

  test('(1) it is a READING: no route, no store, no field', () => {
    for (const bad of ['fetch(', 'api(', 'XMLHttpRequest', '/api/', 'localStorage', 'sessionStorage']){
      assert.ok(!CODE.includes(bad), `js/ladder.js must not carry ${bad} — it is a reading`);
    }
  });

  test('(2) READING MUST NOT WRITE: it never calls a name that initialises', async () => {
    /* negoClauseList, negoChanges, negoAllChanges and negoRound all reach
       negoInit, which CREATES a negotiation and stamps clause ids into the
       stored body. This reading is asked beside every clause on every paint. */
    for (const bad of ['negoInit', 'negoClauseList', 'negoAllChanges', 'negoChanges(', 'negoRound(']){
      assert.ok(!CODE.includes(bad), `js/ladder.js must not call ${bad}`);
    }
  });

  test('(3) a contract with no negotiation is not given one by being read', async () => {
    const w = await buildWorld({ ladder: true });
    const c = { id: 'MK-9', changes: [] };
    const before = JSON.stringify(c);
    w.win.ladderRungs(c, 'cl_4');
    w.win.ladderChip(c, 'cl_4', 'owner');
    w.win.ladderBoard(c, 'owner');
    w.win.ladderStand(c, 'cl_4', 'owner');
    assert.equal(JSON.stringify(c), before, 'the record moved while it was being read');
    assert.ok(!c.negotiation, 'a negotiation was created by a reading');
  });

  /* ---------- 2 · THE RUNGS ---------- */

  test('(4) every move on one clause, oldest first, numbered from 1', async () => {
    const w = await buildWorld({ ladder: true });
    const r = w.win.ladderRungs(book(), 'cl_4');
    assert.deepEqual(r.map(x => x.id), ['CHG-001', 'CHG-002', 'CHG-003']);
    assert.deepEqual(r.map(x => x.n), [1, 2, 3]);
    assert.deepEqual(r.map(x => x.side), ['owner', 'counterparty', 'owner']);
  });

  test('(5) a CLOSED round is on the ladder too — that is the whole point', async () => {
    const w = await buildWorld({ ladder: true });
    const r = w.win.ladderRungs(book(), 'cl_a');
    assert.equal(r.length, 1, 'the move that settled in round 1 is not reachable');
    assert.equal(r[0].round, 1);
    assert.equal(r[0].status, 'accepted');
  });

  test('(6) what a rung stands on is READ off the record, never guessed', async () => {
    const w = await buildWorld({ ladder: true });
    const r = w.win.ladderRungs(book(), 'cl_4');
    assert.equal(w.win.ladderUnder(r, r[0]), null, 'the first move stands on R0');
    assert.equal(w.win.ladderUnder(r, r[1]).id, 'CHG-001');
    assert.equal(w.win.ladderUnder(r, r[2]).id, 'CHG-002');
  });

  test('(7) R0 is the first move\'s own starting point', async () => {
    const w = await buildWorld({ ladder: true });
    const r = w.win.ladderRungs(book(), 'cl_4');
    assert.equal(w.win.ladderBaseText(r), 'The cap is twelve (12) months of fees.');
    assert.equal(w.win.ladderBaseText([]), '', 'no rungs, nothing to say');
  });

  test('(8) a PARKED ask is not live, and is still on the ladder', async () => {
    const w = await buildWorld({ ladder: true });
    const r = w.win.ladderRungs(book(), 'cl_4');
    assert.equal(w.win.ladderLive(r).length, 1, 'only the top of the stack is live');
    assert.equal(w.win.ladderTop(r).id, 'CHG-003');
    assert.equal(r.length, 3, 'the parked asks left the ladder');
  });

  /* ---------- 3 · THE CHIP ---------- */

  test('(9) the chip says the round, whose move, and what it stands on', async () => {
    const w = await buildWorld({ ladder: true });
    const c = book();
    const ours = w.win.ladderChip(c, 'cl_4', 'owner');
    assert.match(ours.text, /R3/);
    assert.match(ours.text, /R2/, 'it does not say what it stands on');
    assert.equal(ours.cls, 'you');
  });

  test('(10) the SAME clause reads the other way round from the other seat', async () => {
    const w = await buildWorld({ ladder: true });
    const c = book();
    const a = w.win.ladderChip(c, 'cl_4', 'owner');
    const b = w.win.ladderChip(c, 'cl_4', 'counterparty');
    assert.equal(a.cls, 'you');
    assert.equal(b.cls, 'them', 'our move reads as theirs on their seat');
    assert.notEqual(a.text, b.text);
  });

  test('(11) a clause nobody has touched carries no chip', async () => {
    const w = await buildWorld({ ladder: true });
    assert.equal(w.win.ladderChip(book(), 'cl_never', 'owner'), null);
  });

  test('(12) a settled clause says so instead of naming a move', async () => {
    const w = await buildWorld({ ladder: true });
    const chip = w.win.ladderChip(book(), 'cl_a', 'owner');
    assert.equal(chip.cls, 'settled');
  });

  /* ---------- 4 · THE FIGURE, BORROWED ---------- */

  test('(13) the figure track reads the whole argument, in order', async () => {
    const w = await buildWorld({ ladder: true });
    const t = w.win.ladderTrack(book(), 'cl_4', 'owner');
    assert.ok(t, 'no track on a clause argued in months');
    assert.deepEqual(t.rows.map(x => x.n), [12, 24, 6, 18]);
    assert.deepEqual(t.rows.map(x => x.who), ['base', 'you', 'them', 'you']);
    assert.equal(t.unit, 'months');
  });

  test('(14) the figure reader is PRECEDENT\'S OWN, not a second table', () => {
    assert.ok(CODE.includes('precedentTopicOf'), 'it must ask precedent for the topic');
    assert.ok(!/PRECEDENT_NUMS|liabilityMonths *:|paymentDays *:/.test(CODE),
      'js/ladder.js has grown its own copy of the figure table');
  });

  test('(15) a clause that is not about a number has no track', async () => {
    const w = await buildWorld({ ladder: true });
    const c = book();
    c.changes = [Object.assign({}, c.changes[3], { clauseId: 'cl_law',
      clauseLabel: 'Clause 12 — Governing law',
      oldText: 'Kenyan law governs.', newText: 'Swedish law governs.' })];
    assert.equal(w.win.ladderTrack(c, 'cl_law', 'owner'), null);
  });

  /* ---------- 5 · THE BOARD ---------- */

  test('(16) one row per clause with a move on it, and no others', async () => {
    const w = await buildWorld({ ladder: true });
    const rows = w.win.ladderBoard(book(), 'owner');
    assert.deepEqual(rows.map(r => r.clauseId).sort(), ['cl_4', 'cl_5', 'cl_a']);
  });

  test('(17) a PARKED ask is still their stated position', async () => {
    /* The board asks where each side STANDS. The moment we counter them their
       ask stops being live, and reading only the live rungs made the board
       say "no ask yet" on the most argued clause on the page. */
    const w = await buildWorld({ ladder: true });
    const row = w.win.ladderStand(book(), 'cl_4', 'owner');
    assert.equal(row.theirs.id, 'CHG-002', 'their parked ask was dropped');
    assert.equal(row.theirFig, 6);
    assert.equal(row.ourFig, 18);
    assert.equal(row.dist, 12);
  });

  test('(18) with no move of our own, our figure is the drafted wording', async () => {
    const w = await buildWorld({ ladder: true });
    const row = w.win.ladderStand(book(), 'cl_5', 'owner');
    assert.equal(row.ours, null, 'we have not moved on this clause');
    assert.equal(row.ourFig, 3, 'so the figure is the one in the wording as it stands');
    assert.equal(row.theirFig, 5);
    assert.equal(row.dist, 2);
  });

  test('(19) the board sorts by how far apart the two sides are', async () => {
    const w = await buildWorld({ ladder: true });
    const rows = w.win.ladderBoard(book(), 'owner');
    assert.equal(rows[0].clauseId, 'cl_4', '12 months apart must outrank 2 years apart');
    assert.equal(rows[rows.length - 1].clauseId, 'cl_a', 'a settled clause sorts last');
  });

  test('(20) whose move it is, read from the record', async () => {
    const w = await buildWorld({ ladder: true });
    const mine = w.win.ladderBoard(book(), 'owner');
    const theirs = w.win.ladderBoard(book(), 'counterparty');
    const g = (rows, id) => rows.find(r => r.clauseId === id).state;
    assert.equal(g(mine, 'cl_4'), 'with', 'our own top ask is with them');
    assert.equal(g(theirs, 'cl_4'), 'awaiting', 'and awaits them on their seat');
    assert.equal(g(mine, 'cl_a'), 'settled');
  });

  /* ---------- 6 · WHAT IS CAPPED IS SAID ---------- */

  test('(21) a cap is a fact, never a silent trim', async () => {
    const w = await buildWorld({ ladder: true });
    const c = book();
    const base = c.changes[0];
    c.changes = [];
    for (let i = 0; i < w.win.LADDER_CAP + 5; i++){
      c.changes.push(Object.assign({}, base, { id: 'CHG-' + (100 + i), seq: 100 + i }));
    }
    assert.equal(w.win.ladderRungs(c, 'cl_4').length, w.win.LADDER_CAP);
    assert.equal(w.win.ladderOverflow(c, 'cl_4'), 5, 'what was left out is not counted');
  });

  /* ---------- 7 · THE VIEW'S OWN WALLS ---------- */

  test('(22) the ladder never adds a fourth reading to RL_READS', () => {
    /* RL_READS is how the DOCUMENT is drawn. A fourth value would fall
       through rlReadSideOf as an unknown mode and shut the pencil everywhere
       through rlReadOnlyReading. The board is a window, not a mode. */
    const v = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const m = v.match(/const RL_READS = \[[^\]]*\]/);
    assert.ok(m, 'RL_READS is gone');
    assert.equal(m[0], "const RL_READS = ['marks', 'agreed', 'proposed']");
  });

  test('(23) TWO DOORS, ONE ACT: both board doors carry the same attribute', () => {
    const v = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const doors = (v.match(/data-rl-board(?![-\w])/g) || []).length;
    assert.ok(doors >= 2, `the board should have two doors, found ${doors}`);
    assert.ok(v.includes("t.closest('[data-rl-board]')"),
      'one handler must answer both doors, or they will drift');
  });

  test('(24) the ladder decides nothing — it has no path into the record', () => {
    /* ONE DOOR. Every act the ladder offers is a READING or a press on a door
       the product already has. It drew an 'accept this earlier ask' verb for
       one draft and that verb was REMOVED, not fixed: writing a counter parks
       their ask, negoResolve refuses a decision on a parked ask by name, and
       a rival filing supersedes it instead — so there is no state in which
       the press could have worked, and it would have been refused every time
       it was offered. The rung points at the counter that answers it. */
    const v = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const start = v.indexOf('function rlLadderSectionHtml(');
    const block = v.slice(start, v.indexOf('function rlLadderTrackHtml('));
    assert.ok(start > 0, 'the ladder builder is gone');
    for (const bad of ['negoResolve(', 'negoFileChange(', 'negoEditClause(', 'persist(']){
      assert.ok(!block.includes(bad), `the ladder must not call ${bad}`);
    }
    assert.ok(!v.includes('data-rl-rung-accept'),
      'the accept-an-earlier-rung verb is back, and the model still refuses it');
  });

  test('(25) READ AS IT STOOD is per sitting and never reaches the record', () => {
    const v = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const block = v.slice(v.indexOf('let _rlReadAt ='), v.indexOf('function rlLadderChipHtml'));
    assert.ok(!/persist\(|localStorage|api\(/.test(block),
      'a reading of the paper must not be written anywhere');
  });

  test('(26) both dictionaries carry every ladder key', () => {
    const { STRINGS } = require('../js/i18n.js');
    const keys = Object.keys(STRINGS.en).filter(k => /^ng_(rung|ladder|board|legend)/.test(k));
    assert.ok(keys.length > 30, `expected the ladder's keys, found ${keys.length}`);
    for (const k of keys) assert.ok(STRINGS.sv[k], `sv is missing ${k}`);
  });

  /* ---------- 7 · THE ARTIFACT, BUILT AS DRAWN (Young ruled 14 Sep 2026) ---------- */

  test('(27) a lone mark wears its author\'s side: opts.who stamps ops that carry none', async () => {
    const w = await buildWorld({ ladder: true });
    const html = w.win.redlineOpsHtml([{ op: 'ins', text: 'a' }, { op: 'del', text: 'b', who: 'them' }], { who: 'us' });
    assert.match(html, /<ins class="[^"]*\brl-us\b/, 'the bare op takes the caller\'s side');
    assert.match(html, /<del class="[^"]*\brl-them\b/, 'an op with a side of its own keeps it');
    const bare = w.win.redlineOpsHtml([{ op: 'ins', text: 'a' }]);
    assert.ok(!/\brl-(us|them)\b/.test(bare), 'absent, byte-identical to before');
  });

  test('(28) UNSENT is read RAW off the hand-over stamp, and the record is untouched', async () => {
    const w = await buildWorld({ ladder: true });
    const c = book();
    const before = JSON.stringify(c);
    const r = w.win.ladderRungs(c, 'cl_4');
    const top = r[2];
    assert.equal(w.win.ladderUnsent(c, top, 'owner'), true, 'nothing handed over yet: our top move is unsent');
    assert.equal(w.win.ladderUnsent(c, r[1], 'owner'), false, 'theirs is never unsent on our record');
    c.negotiation.turnAt = '2026-09-15T00:00:00.000Z';
    assert.equal(w.win.ladderUnsent(c, top, 'owner'), false, 'filed before the hand-over: sent');
    c.negotiation.holdIds = [top.id];
    assert.equal(w.win.ladderUnsent(c, top, 'owner'), true, 'held back by a solo send: unsent again');
    delete c.negotiation.turnAt; delete c.negotiation.holdIds;
    assert.equal(JSON.stringify(c), before, 'the reading wrote nothing');
    assert.match(w.win.ladderChip(c, 'cl_4', 'owner').text, /not sent/i, 'and the chip says so');
  });

  test('(29) the line under a stacked clause names what the plain words are', async () => {
    const w = await buildWorld({ ladder: true });
    const c = book();
    const b = w.win.ladderBaseline(c, 'cl_4', 'owner');
    assert.ok(b, 'a three-move stack has a line');
    assert.equal(b.below.n, 1, 'the plain words are the wording the LOWER move was written on — R1');
    assert.equal(b.below.who, 'you');
    assert.equal(b.below.fig, 24);
    assert.equal(b.baseFig, 12, 'and the agreed figure is R0\'s');
    assert.equal(w.win.ladderBaseline(c, 'cl_5', 'owner'), null, 'a lone ask is drawn against the agreed text: nothing to say');
  });

  test('(30) a figure is written back into the wording in words and digits, and nothing else moves', async () => {
    const w = await buildWorld({ ladder: true });
    const f = w.win.ladderWriteFigure;
    assert.equal(f('pay within thirty (30) days of receipt.', 45, 'days'), 'pay within forty-five (45) days of receipt.');
    assert.equal(f('for twelve (12) months of fees', 1, 'months'), 'for one (1) month of fees', 'the plural follows the number');
    assert.equal(f('within thirty (30) business days', 60, 'days'), 'within sixty (60) business days', 'the qualifier is kept');
    assert.equal(f('within 30 days', 45, 'days'), 'within 45 days', 'a bare figure stays bare');
    assert.equal(f('no figure here', 45, 'days'), 'no figure here', 'unchanged where there is nothing to write');
    assert.equal(w.win.ladderWords(118), 'one hundred and eighteen');
  });

  test('(31) a topic whose own reader finds no figure in the clause is refused', async () => {
    const w = await buildWorld({ ladder: true });
    const mk = (label, text) => ({ id: 'X', clauseId: 'cl_x', clauseLabel: label, changeType: 'modify',
      oldText: text, newText: text + ' Amended.', status: 'pending', authorSide: 'owner', seq: 1 });
    const ins = { id: 'MK-2', changes: [mk('3. INSURANCE', 'The Supplier shall maintain product liability insurance.')] };
    assert.equal(w.win.ladderTopic(w.win.ladderRungs(ins, 'cl_x')), null,
      '"product liability insurance" read as the liability topic and drew the liability fallback beside an insurance clause');
    const liab = { id: 'MK-3', changes: [mk('4. Limitation of liability', 'The cap is twelve (12) months of fees.')] };
    const t = w.win.ladderTopic(w.win.ladderRungs(liab, 'cl_x'));
    assert.ok(t && t.key === 'liability', 'a clause that carries the figure keeps its topic');
  });

  test('(32) the standard is still the playbook\'s where the range reader misses the drafted figure', async () => {
    const w = await buildWorld({ ladder: true, playbook: true });
    /* playbookKeyFor opens by calling cKind and playbook() reads state bare —
       the stage answers both as test/world.js does for the playbook's own files. */
    w.win.state = w.win.state || { contracts: [], settings: {} };
    w.win.cKind = w.win.cKind || (() => 'Contract');
    const row = w.win.ladderStand(book(), 'cl_4', 'owner');
    assert.ok(row.standard, 'the range reader does not read "twelve (12) months of fees"; the topic key does');
    assert.equal(row.standard.key, 'liabilityMonths');
    assert.equal(row.standard.op, '>=');
    assert.equal(row.standard.value, 12);
  });

  test('(33) the fallback is the clause library\'s own, and "within" follows which way is worse', async () => {
    const w = await buildWorld({ ladder: true, playbook: true });
    w.win.state = w.win.state || { contracts: [], settings: {} };
    w.win.cKind = w.win.cKind || (() => 'Contract');
    const liab = w.win.precedentTopicByKey('liability'), pay = w.win.precedentTopicByKey('payment');
    const fb = w.win.ladderFallback(liab);
    assert.ok(fb && /capped/i.test(fb.text), 'the library\'s fallback wording');
    assert.equal(fb.figure, null, 'which holds no figure — and none is invented');
    assert.equal(w.win.ladderFallback(pay).figure, 45);
    assert.equal(w.win.ladderWithin(liab, 6, 12), false, 'a cap below the bound is worse');
    assert.equal(w.win.ladderWithin(liab, 18, 12), true);
    assert.equal(w.win.ladderWithin(pay, 60, 45), false, 'more days to pay is worse');
    assert.equal(w.win.ladderWithin(pay, 30, 45), true);
    assert.equal(w.win.ladderWithin(pay, null, 45), null, 'no figure, no answer');
  });

  test('(34) the deal board is a PAGE, our seat only, and a reading tab puts the paper back', () => {
    const v = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const open = v.slice(v.indexOf('function openDealBoard(){'), v.indexOf('\n}\n', v.indexOf('function openDealBoard(){')));
    assert.ok(!open.includes('openModal('), 'no window: it is a page');
    assert.ok(open.includes('rlBoardSet(true)') && open.includes('renderRedline()'), 'the flag and the repaint');
    assert.match(v, /opts\.side !== 'counterparty' && !opts\.preview && _rlBoardOpen\) \? rlBoardPageHtml\(c\)/,
      'drawn in the working area, never on their seat or a preview');
    const at = v.indexOf("rlSetReadMode(b.getAttribute('data-rl-read'));");
    assert.ok(at > 0, 'the reading press is still one handler');
    const read = v.slice(at, v.indexOf('rlRepaintFrom(b);', at));
    assert.ok(read.includes('rlBoardSet(false)'), 'a reading press takes the board down');
    assert.ok(/_rlBoardOpen \? ' rl-board-on' : ''/.test(v), 'and the page wears the flag so the grid steps aside');
    assert.ok(!/const RL_READS = \[[^\]]*board/.test(v), 'still not a fourth reading');
  });

  test('(35) the rail\'s ladder card is worked out, never asked for', () => {
    const v = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'clauseeditor.js'), 'utf8');
    const card = v.slice(v.indexOf('function ceLadderCardHtml(){'), v.indexOf('function ceLadderLaneHtml(){'));
    assert.ok(card.length > 200, 'the card builder is there');
    for (const bad of ['fetch(', 'api(', 'copilotPropose', 'anthropic', 'copilotAsk'])
      assert.ok(!card.includes(bad), `the card must not call ${bad}`);
    assert.ok(/data-ce-tab="ladder"/.test(v) && /data-ce-tab="figure"/.test(v), 'the two tabs');
    assert.match(v, /if \(!why && _ceHeldNote\) why = _ceHeldNote;/, 'a kept note rides the filing as its reason');
    assert.ok(!/typing: true/.test(v.slice(v.indexOf('function ceFigureWrite'), v.indexOf('function ceRenderTabs'))),
      'writing the figure never asks to type — Apply is the door');
  });

  test('(36) every paper passes whose mark it is', () => {
    const nego = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const ce = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'clauseeditor.js'), 'utf8');
    const portal = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'portal.js'), 'utf8');
    /* ---- RE-POINTED IN PLACE 15 Sep 2026 ----
       These pinned the three calls as LITERAL argument lists, and on 15 Sep
       every paper also began handing the clause's own shape in (the contract
       must not change shape from one screen to the next). THE CLAIM IS
       UNCHANGED — each paper still says whose mark it is — so it is asked of
       the `who` argument alone, with whatever else rides beside it. */
    assert.match(nego, /redlineOpsBlocksHtml\(ops, \{[^}]*who: rlSideWho\(ch, 'owner'\)/, 'the room\'s canvas');
    assert.match(nego, /redlineOpsBlocksHtml\(ops, \{ title: tip, who: whoM/, 'the negotiate page and the editor\'s canvas');
    assert.match(ce, /redlineOpsBlocksHtml\(ops, \{ who: 'us'/, 'the editor\'s own draft');
    assert.ok(portal.includes('redlineOpsHtml(ch.ops, { who: whoM })'), 'the counterparty\'s viewer, from their chair');
    assert.match(nego, /function rlSideWho\(ch, viewerSide\)\{/, 'one reading of whose side, from this chair');
  });

  test('(37) both dictionaries carry every key the artifact added', () => {
    const { STRINGS } = require('../js/i18n.js');
    const keys = Object.keys(STRINGS.en).filter(k => /^(ng_(pb|fig|notes|base)_|ce_lc_|ce_tab_(ladder|figure)|ng_rung_(not_sent|tag_draft|yours|theirs|on_word)|ng_row_ladder|ng_counter|ng_discard)/.test(k));
    assert.ok(keys.length > 60, `expected the artifact's keys, found ${keys.length}`);
    for (const k of keys) assert.ok(STRINGS.sv[k], `sv is missing ${k}`);
  });

  /* ---- (38) THE LADDER CHIP OPENS THE LADDER (Young reported it 15 Sep 2026:
     "when I click on ladder, I also get the highlighted area in the attached
     image. I thought you are only supposed to get the ladder") ----
     The chip called rlCpSetShown, which opens the WHOLE clause panel: the
     wording, the acts row, what is on the table, this round's history, and
     only then the ladder. ONE BUILD, TWO POSTURES — the narrowing is a class
     on the panel and a rule in the stylesheet, so the chip's panel and the
     pencil's can never drift. The pixels are ladder-verify's to measure; what
     is pinned here is that the posture exists, that it is additive (every
     older caller still means the whole panel), that it survives a repaint, and
     that the hidden set is named by class rather than by position. */
  test('(38) the ladder chip opens the panel narrowed, and the pencil does not', () => {
    const nego = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const css = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation-css.js'), 'utf8');

    assert.match(nego, /function rlCpSetShown\(scope, clauseId, opts = \{\}\)\{/,
      'the posture is an ADDITIVE third argument — every older caller means the whole panel');
    /* ---- AND ON OUR SEAT IT IS THE POSTURE, WHATEVER DOOR OPENED IT (Young,
       15 Sep 2026, of the sections above the ladder: "still appears here and
       there but I cannot trace what is making it appear. It should be
       deleted") ---- rlCpNarrowSeat is asked beside the caller's own answer,
       so the deal board's row press — which passed two arguments and opened
       the panel in full — and any door added later land on the same panel.
       The argument stays ADDITIVE: it is what the counterparty's seat and any
       window under 1024px still ride, where the panel is the only way wording
       is proposed. */
    assert.match(nego, /const ladderOnly = !!\(opts && opts\.ladder\) \|\| rlCpNarrowSeat\(\);/, 'read once');
    assert.match(nego, /function rlCpNarrowSeat\(\)\{[\s\S]*?rlEditorTakesIt\('owner', \{\}\)/,
      'and it is the SAME reading the pencil chooses its destination with, so the two cannot disagree');
    assert.match(nego.match(/function rlCpNarrowSeat\(\)\{[\s\S]*?\n\}/)[0], /PORTAL_MODE/,
      'their page is never narrowed, and it is asked first');
    assert.match(nego, /p\.classList\.toggle\('is-ladder', on && ladderOnly\);/,
      'the narrowing is a class flip on the panel, never a second build');
    assert.match(nego, /_rlCpLadder = on && !!\(opts && opts\.ladder\);/,
      'and what is REMEMBERED is the caller\'s own ask — the seat answers for itself on every read, '
      + 'so a window resized past 1024px is not held to what it was when the panel opened');

    /* THE TOGGLE IS THE CLAUSE, NEVER THE POSTURE. A press opens the ladder
       and a press shuts the panel — the owner's standing rule about a sliding
       panel, which a posture inside the toggle would have cost a press. */
    const h = nego.slice(nego.indexOf("const lad = t.closest('[data-rl-ladder]');"));
    const press = h.slice(0, h.indexOf('return;') + 7);
    assert.match(press, /rlCpSetShown\(lscope, rlCpOpenId\(\) === lid \? null : lid, \{ ladder: true \}\);/,
      'one press opens it narrowed, the next shuts it');
    assert.ok(!/rlCpLadderOnly\(\)/.test(press), 'the posture is not part of what the press toggles');

    /* THE PENCIL IS UNCHANGED — its door passes two arguments, so it opens
       the whole clause, which is the way back to the rest of it. */
    assert.ok(/rlCpSetShown\(scope, rlCpOpenId\(\) === id \? null : id\);/.test(nego),
      'the pencil door still asks for the whole panel');

    /* A REPAINT KEEPS THE POSTURE with the clause it belongs to. */
    assert.match(nego, /rlCpSetShown\(\(scope && scope\.querySelector\) \? scope : document, id, \{ ladder: rlCpLadderOnly\(\) \}\);/,
      'the repaint restore carries it');

    /* THE HIDDEN SET IS NAMED BY CLASS, never by position. */
    assert.ok(css.includes(".rl-cp.is-ladder .rl-cp-src > .rl-cp-sec:not(.rl-ladder-sec):not(.rl-pb-sec):not(.rl-fig-sec):not(.rl-notes-sec){display:none}"),
      'one rule, the four kept sections named');

    /* THE HEAD SAYS WHICH PANEL THIS IS, in both books. */
    const { STRINGS } = require('../js/i18n.js');
    assert.ok(STRINGS.en.ng_cp_ladder && STRINGS.sv.ng_cp_ladder, 'the narrowed panel has a name');
    assert.match(nego, /i18t\(on && ladderOnly \? 'ng_cp_ladder' : 'ng_cp_edit'\)/, 'painted on the open');
    assert.match(nego, /i18t\(lad \? 'ng_cp_ladder' : 'ng_cp_edit'\)/, 'and built into a fresh paint');

    /* PUBLISHED — the reading crosses a module boundary (f232's rule). */
    assert.match(nego, /rlCpNotesOn, rlCpSetNotes, rlCpLadderOnly,/, 'published');
  });

  /* ---- (39) FOUR THINGS OFF ONE SCREEN (Young ruled 15 Sep 2026) ----
     Three of them are this head's and the legend's; the fourth (the pin
     quoting only what moved) is f304's, beside the pin it belongs to. */
  test('(39) the legend states the fact and stops; the checks join the acts row', () => {
    const { STRINGS } = require('../js/i18n.js');
    /* THE WARNING HALF IS GONE, in BOTH books — "delete the 'not agreed text'
       bit". The key is SHORTENED rather than retired, because the first half
       is still drawn; a key removed from one book and not the other leaves a
       screen half-English. */
    for (const bk of ['en', 'sv'])
      assert.ok(STRINGS[bk].ng_legend_plain, `${bk} still has the line`);
    assert.ok(!/not the agreed text/i.test(STRINGS.en.ng_legend_plain), 'the inference is gone');
    assert.ok(!/överenskomna/i.test(STRINGS.sv.ng_legend_plain), 'and gone in Swedish too');
    assert.match(STRINGS.en.ng_legend_plain, /last wording exchanged/, 'the fact still stands');
    const nego = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    assert.match(nego, /item\('base', 'ng_legend_plain'\)/, 'drawn from the one key, still');

    /* ---- THE THREE CHECKS MOVED UP (Young: "move the highlighted buttons up
       and to the right of the more button") ---- */
    const ct = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    const acts = ct.slice(ct.indexOf('<div class="room-acts${opts.primaryFirst'), ct.indexOf('FOUR FACTS, EACH WITH ITS OWN LABEL'));
    assert.match(acts, /\$\{backC\?roomChecksHtml\(c\):''\}/, 'drawn in the acts row, on the workbench flag');
    const facts = ct.slice(ct.indexOf('function roomFactsHtml'), ct.indexOf('THE TITLE IS THE AGREEMENT'));
    assert.ok(!/roomChecksHtml/.test(facts), 'and no longer in the fact row');
    assert.ok(!/roomFactsHtml\(c,\{checks:/.test(ct), 'so the fact row is not passed a flag it ignores');

    /* THE CLOTHES: the row's own rung and gap, the workspace accent for an
       edge (green on teal, blue on navy — ONE token, never a second rule), and
       the glyph grows because the box may not pass the row's rung. */
    const idx = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const grp = idx.match(/\.room-checks\{[^}]*\}/)[0];
    const btn = idx.match(/\n  \.room-check\{[^}]*\}/)[0];
    /* RE-POINTED IN PLACE 26 Sep 2026 (the Compact ladder, Young picked it).
       Two literals moved onto the ladder: the gap is the one "between buttons
       in a group" (8), asked now as the RELATION the words always claimed —
       the same gap the acts row itself wears — and the glyph is the rung's own
       icon size (14 at the everyday rung) rather than a hand-set 18. The box
       is still the rung and still the row's; nothing else here moved. */
    const actsRow = idx.match(/\.room-head \.room-acts\{[^}]*\}/)[0];
    const gapOf = s => (s.match(/gap:([^;]+);/) || [])[1];
    assert.ok(gapOf(grp) && gapOf(grp) === gapOf(actsRow), 'the row\'s own gap: ' + gapOf(grp) + ' vs ' + gapOf(actsRow));
    assert.ok(!/margin-left:auto/.test(grp), 'the right wall it was pinned to is gone');
    assert.match(idx, /\.room-acts-lead > \.room-checks\{ order:4; \}/, 'after More, which is order 3');
    assert.match(btn, /var\(--ctl-h,28px\)/, 'one rung with every other button in the row');
    assert.match(btn, /border:1px solid var\(--btn-edge/, 'the accent edge .ui-btn defines');
    assert.match(idx, /\.room-check svg\{ width:var\(--btn-ic\); height:var\(--btn-ic\); \}/, 'the glyph is the rung\'s own icon size');
    /* AND THE WORKBENCH'S OWN ROW RULE MAY NOT STRETCH THEM: it pins every
       button to 11px of side padding, which is right for a word and turns a
       square into a lozenge. Named at that rule's weight plus one — by SCOPE,
       never !important. */
    const css = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation-css.js'), 'utf8');
    assert.match(css, /\.redline-page #ws-head \.room-acts button\.room-check\{padding:0;width:var\(--ctl-h,28px\);/);
    /* ---- AND THE MARK SITS IN THE MIDDLE OF THE BOX (Young reported it 15 Sep
       2026: "the signs are not in the middle of the boxes they sit in") ----
       MEASURED before it was touched: 1px of space to the mark's left and 9px
       to its right. .room-check states display:grid + place-items:center, and
       the row rule above states display:inline-flex + align-items:center with
       no justify-content at three classes to that rule's one — so the mark was
       centred down the box and packed against its left wall. The centring is
       RESTATED at the narrower scope rather than taken off the row, whose
       inline-flex is what keeps the rest of the row on one baseline. */
    const at = css.indexOf('.redline-page #ws-head .room-acts button.room-check{');
    const chk = css.slice(at, css.indexOf('}', css.indexOf('justify-content:center', at)) + 1);
    assert.match(chk, /justify-content:center/, 'across the box');
    assert.match(chk, /align-items:center/, 'and down it');
    assert.ok(!/room-check[^\n]*!important/.test(css), 'and not with !important');
  });

});
