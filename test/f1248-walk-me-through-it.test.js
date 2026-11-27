'use strict';
/* f1248 — WALK ME THROUGH IT (owner, 26 Nov 2026: "Build all the possible charts and lessons but tie them to access.
   If you are not allowed to see the money then it should give you a message stating as such"; "Yes and use count.
   Also use the charts in board to get ideas of charts to build as well").

   (1) THE PLAN IS CHECKED, BOTH HOSTS: walkPlanClean keeps a good plan and refuses a bad one with words that say
       what exists (an unknown drawing, a contract the reader may not see, a highlight with nothing before it, a name
       not on the drawing, a month not written YYYY-MM, a reveal on a drawing with no blocks, too few or too many steps).
   (2) ONLY A LESSON ABOUT ONE'S DATA IS ONE: walkAsked reads "walk me through my renewals", never "walk me through
       sending a contract", "why is X high?" or "change Y to 500".
   (3) ONE TOOL, TWO HOSTS: walk_through is in the server's COPILOT_TOOLS and the browser's LOCAL_AI_TOOLS, its rule
       in both instructions, its check in both chat routes and the browser-direct loop; the answer carries the plan.
   (4) THE AI NEVER WRITES A DRAWN NUMBER: the tool's input has no place for one; every figure is read by js/lesson.js
       from HaTi's own counting (the Board's hbBookData, the contract's own lists).
   (5) MONEY ONLY WITH MONEY RIGHTS: a money step for a reader without them is its count, marked nomoney, and the
       message and Ask an admin are drawn; with them the money is drawn.
   (6) EVERY WORD IN BOTH BOOKS: each ls_ key the lesson says exists in English and Swedish.
   AT THE PARENT (296072b) js/walkplan.js and js/lesson.js do not exist: every test here fails. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const W = require('../js/walkplan.js');
const SERVER = fs.readFileSync(path.join(ROOT, 'server/server.js'), 'utf8');
const AI = fs.readFileSync(path.join(ROOT, 'js/ai.js'), 'utf8');
const LESSON = fs.readFileSync(path.join(ROOT, 'js/lesson.js'), 'utf8');

const FACTS = { contract: id => (['MK-B2', 'mk-b2', 'Retail Supply — Coast'].includes(id) ? { id: 'MK-B2', name: 'Retail Supply — Coast' } : null),
  contracts: [{ id: 'MK-B2', name: 'Retail Supply — Coast' }, { id: 'MK-A1', name: 'Refined Sugar Supply' }], parties: ['Naivas Supermarkets', 'Bidco Africa'] };
const step = (say, what, more) => ({ say, show: Object.assign({ what }, more || {}) });

describe('f1248 (1) the plan is checked, and a refusal says what exists', () => {
  test('a good book plan is kept, highlight folded as an op', () => {
    const r = W.walkPlanClean({ title: 'Your contracts', steps: [step('Where they stand.', 'stages'), step('Two in review.', 'highlight', { names: ['In review'] }), step('By party.', 'parties')] }, FACTS);
    assert.ok(r.plan, r.error);
    assert.deepEqual(r.plan.steps.map(s => s.show ? s.show.what : s.op.what), ['stages', 'highlight', 'parties']);
    assert.equal(r.plan.contractId, undefined);
  });
  test('a contract plan names its contract; one the reader may not see is refused with contracts that exist', () => {
    const ok = W.walkPlanClean({ title: 'The negotiation', contractId: 'mk-b2', steps: [step('Six changes.', 'changes'), step('Two open.', 'reveal', { upto: 5 })] }, FACTS);
    assert.equal(ok.plan.contractId, 'MK-B2');
    const no = W.walkPlanClean({ title: 'x', contractId: 'MK-99', steps: [step('a', 'changes'), step('b', 'playbook')] }, FACTS);
    assert.match(no.error, /no contract MK-99/i); assert.match(no.error, /MK-A1 \(Refined Sugar Supply\)/);
    assert.match(W.walkPlanClean({ title: 'x', steps: [step('a', 'changes'), step('b', 'playbook')] }, FACTS).error, /contractId/);
  });
  test('an unknown drawing, a highlight first, a bad name, a bad month, a reveal on bars, too few and too many steps', () => {
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'pie_of_money'), step('b', 'stages')] }, FACTS).error, /not a drawing\. The drawings are: stages/);
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'highlight', { names: ['x'] }), step('b', 'stages')] }, FACTS).error, /first step must draw/);
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'stages'), step('b', 'highlight', { names: ['Pending'] })] }, FACTS).error, /It names: draft/);
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'parties'), step('b', 'highlight', { names: ['Acme'] })] }, FACTS).error, /Some that are: Naivas Supermarkets/);
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'ending_months'), step('b', 'highlight', { names: ['Dec'] })] }, FACTS).error, /YYYY-MM/);
    assert.ok(W.walkPlanClean({ title: 't', steps: [step('a', 'ending_months'), step('b', 'highlight', { names: ['2027-01'] })] }, FACTS).plan);
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'stages'), step('b', 'reveal', { upto: 2 })] }, FACTS).error, /not a blocks drawing/);
    assert.match(W.walkPlanClean({ title: 't', steps: [step('a', 'stages')] }, FACTS).error, /2 to 8 steps/);
    assert.match(W.walkPlanClean({ title: 't', steps: Array.from({ length: 9 }, () => step('a', 'stages')) }, FACTS).error, /2 to 8 steps/);
    assert.match(W.walkPlanClean({ steps: [step('a', 'stages'), step('b', 'stages')] }, FACTS).error, /title/);
  });
  test('a sentence is cut at the limit; the summary the conversation keeps names every step', () => {
    const r = W.walkPlanClean({ title: 'T', steps: [step('x'.repeat(900), 'stages'), step('Second.', 'risk')] }, FACTS);
    assert.equal(r.plan.steps[0].say.length, W.WALK_SAY_MAX);
    assert.match(W.walkSummary(r.plan), /^\[Walk-through shown: T\. 1\) x+ 2\) Second\.\]$/);
  });
});

describe('f1248 (2) only a lesson about one\'s data is one', () => {
  for (const q of ['Walk me through my renewals', 'walk me through my contracts', 'Teach me where our money is', 'explain this negotiation step by step', 'take me through my duties this month', 'gå igenom mina avtal'])
    test('a lesson: ' + q, () => assert.equal(W.walkAsked(q), true));
  for (const q of ['walk me through sending a contract', 'walk me through how to sign this', 'why is the Naivas value high?', 'change the payment days to 500', 'what ends this quarter?', 'teach me', "I'm new"])
    test('not a lesson: ' + q, () => assert.equal(W.walkAsked(q), false));
});

describe('f1248 (3) one tool, two hosts', () => {
  test('walk_through is in both tool lists, with the same shared schema', () => {
    const list = (src, from) => src.slice(src.indexOf(from), src.indexOf('\n];', src.indexOf(from)));
    assert.match(list(SERVER, 'const COPILOT_TOOLS = ['), /name: 'walk_through', description: WALK_TOOL_DESC, input_schema: WALK_TOOL_SCHEMA/);
    assert.match(list(AI, 'const LOCAL_AI_TOOLS=['), /name:'walk_through', description:\(typeof WALK_TOOL_DESC!=='undefined'\?WALK_TOOL_DESC:[^,]+\), input_schema:\(typeof WALK_TOOL_SCHEMA!=='undefined'\?WALK_TOOL_SCHEMA:/);
  });
  test('the rule rides both instructions; the check runs in both chat routes and the browser-direct loop', () => {
    assert.match(SERVER, /AI_BRIEF_OFF_RULE\}\n- \$\{AI_WALK_RULE\}\n- \$\{AI_NOTEBOOK_RULE\}/);
    assert.match(AI, /AI_BRIEF_OFF_RULE\} \$\{typeof AI_WALK_RULE!=='undefined'\?AI_WALK_RULE:''\} \$\{AI_NOTEBOOK_RULE\}/);
    assert.equal((SERVER.match(/const w = copilotWalkStep\(cx, toolUses, working\);/g) || []).length, 2, 'both /api/ai/chat and /api/ai/chat/stream');
    assert.equal((SERVER.match(/\.\.\.\(final\.lesson \? \{ lesson: final\.lesson \} : \{\}\)/g) || []).length, 2, 'both replies carry the plan');
    assert.match(AI, /const r=walkPlanClean\(walk\.input, aiWalkFacts\(\)\);/);
  });
  test('the server checks against what THIS reader may see (copilotRows), code-named and archived left out', () => {
    const f = SERVER.slice(SERVER.indexOf('function copilotWalkFacts'), SERVER.indexOf('function copilotWalkStep'));
    assert.match(f, /copilotRows\(cx\)\.filter\(c => c && !c\.archived && !c\._codeNamed\)/);
  });
});

describe('f1248 (4) the AI never writes a drawn number', () => {
  test('a step\'s show carries which drawing and what to narrow it to — never a value, count, figure or data', () => {
    const show = W.WALK_TOOL_SCHEMA.properties.steps.items.properties.show.properties;
    assert.deepEqual(Object.keys(show).sort(), ['names', 'period', 'upto', 'what', 'where']);
    assert.deepEqual(Object.keys(show.where.properties).sort(), ['party', 'stage', 'stream']);
    assert.deepEqual(Object.keys(show.period.properties).sort(), ['from', 'to']);
    assert.equal(show.what.enum.length, W.WALK_SHOWS.length + W.WALK_OPS.length);
  });
  test('every drawing has a reader in js/lesson.js; every money drawing has a count twin', () => {
    const ctx = lessonWorld({});
    for (const s of W.WALK_SHOWS){
      assert.equal(typeof ctx.LS_READ[s.k], 'function', s.k + ' has a reader');
      if (s.money) assert.ok(W.walkShowOf(s.twin) && !W.walkShowOf(s.twin).money, s.k + ' has a count twin');
    }
  });
});

/* js/lesson.js in a small world: HaTi's own readers stubbed with the Board's shapes */
/* the book: Draft 1 (6M), In review 3 (145M), Signed 6 (182M), one Declined; mktg holds 7 of them */
const BOOK = [
  { id: 'D1', name: 'Draft one', status: 'Draft', value: 6e6, folder: 'mktg', counterparty: 'Naivas' },
  { id: 'R1', name: 'Review one', status: 'Under Review', value: 45e6, folder: 'mktg', counterparty: 'naivas ' },
  { id: 'R2', name: 'Review two', status: 'Under Review', value: 50e6, folder: 'mktg', counterparty: 'Bidco' },
  { id: 'R3', name: 'Review three', status: 'Under Review', value: 50e6, folder: 'proc', counterparty: 'Bidco' },
  { id: 'S1', name: 'Signed one', status: 'Signed', value: 24e6, folder: 'mktg', counterparty: 'Scanad', expiry: '2099-03-01' },
  { id: 'S2', name: 'Signed two', status: 'Signed', value: 30e6, folder: 'mktg', counterparty: 'Saw Sawa' },
  { id: 'S3', name: 'Signed three', status: 'Signed', value: 28e6, folder: 'mktg', counterparty: 'Royal Media' },
  { id: 'S4', name: 'Signed four', status: 'Signed', value: 40e6, folder: 'proc', counterparty: 'Kabras', currency: 'XXX' },
  { id: 'S5', name: 'Signed five', status: 'Signed', value: 30e6, folder: 'proc', counterparty: 'Kabras' },
  { id: 'S6', name: 'Signed six', status: 'Signed', value: 30e6, folder: 'proc', counterparty: 'Twiga' },
  { id: 'X1', name: 'Declined one', status: 'Declined', value: 9e6, folder: 'mktg', counterparty: 'Naivas' },
];
function lessonWorld(o){
  const win = {};
  const book = o.book || BOOK;
  Object.assign(win, W, {
    window: win, i18t: (k, v) => k + (v && v.n != null ? ':' + v.n : ''), i18tn: (k, n) => k + ':' + n,
    canViewValues: () => o.money !== false, mayActOn: () => o.viewer !== true, isAdmin: () => false,
    hbBook: () => book.filter(c => !c.archived), getContract: id => book.find(c => c.id === id) || null,
    /* the Board's sum: a contract it cannot convert is LEFT OUT AND COUNTED */
    hbValueOf: cs => cs.reduce((r, c) => (c.currency === 'XXX' ? { v: r.v, left: r.left + 1 } : { v: r.v + c.value, left: r.left }), { v: 0, left: 0 }),
    FOLDERS: { mktg: { id: 'mktg', name: 'Marketing & Brand' }, proc: { id: 'proc', name: 'Procurement' } },
    signBlockers: c => (c && c.blockers) || [], hmStageTone: k => 'var(--' + k + ')',
  }, o.extra || {});
  vm.createContext(win);
  vm.runInContext(LESSON, win, { filename: 'js/lesson.js' });
  return win;
}
const J = x => JSON.parse(JSON.stringify(x));
describe('f1248 (5) money only with money rights; the count and the message for everyone else', () => {
  test('with money rights the value is drawn', () => {
    const ctx = lessonWorld({ money: true });
    const b = ctx.lessonBoard('stages_value');
    assert.equal(b.nomoney, undefined); assert.equal(b.money, true);
    assert.deepEqual(J(b.items.map(x => x.n)), [6e6, 145e6, 142e6]);
    assert.equal(b.left, 1, 'the contract in a currency with no rate is left out and counted');
  });
  test('without it: the count (the Board\'s own), marked nomoney, and the step says so with Ask an admin', () => {
    const ctx = lessonWorld({ money: false });
    const b = ctx.lessonBoard('stages_value');
    assert.equal(b.nomoney, true); assert.ok(!b.money);
    assert.deepEqual(J(b.items.map(x => x.n)), [1, 3, 6]);
    const L = { id: 'x', title: 'T', steps: [{ say: 'Money by stage.', board: b }] };
    const html = ctx.lessonStepHtml(L, { shown: 1, at: [0], still: true }, 0, 0);
    assert.match(html, /lsn-nomoney/); assert.match(html, /ls_nomoney/); assert.match(html, /data-lsn-act="askadmin"/);
    for (const k of ['parties_value', 'streams_value', 'ending_value']) assert.equal(ctx.lessonBoard(k).nomoney, true, k);
  });
  test('the drawing\'s figures are filled when the lesson arrives and kept on it (lessonFill)', () => {
    const ctx = lessonWorld({ money: true, book: [{ id: 'MK-1', name: 'One', status: 'Draft', blockers: [{ key: 'a', label: 'Name a signer' }] }] });
    const L = ctx.lessonFill({ title: 'T', contractId: 'MK-1', steps: [{ say: 'a', show: { what: 'before_sign' } }, { say: 'b', op: { what: 'highlight', names: ['signer'] } }] });
    assert.equal(L.cid, 'MK-1'); assert.equal(L.steps[0].board.rows[0].cells[0].t, 'Name a signer'); assert.deepEqual(JSON.parse(JSON.stringify(L.steps[1].op)), { what: 'highlight', names: ['signer'] });
  });
  test('a Viewer is told nothing waits on them, never shown work', () => {
    const ctx = lessonWorld({ viewer: true });
    for (const k of ['needs_you', 'waiting_us', 'approvals']) assert.equal(ctx.lessonBoard(k).lk, 'ls_viewer', k);
  });
  test('the negotiation\'s blocks count c.changes RAW: proposed, accepted, rejected, countered, still open', () => {
    const ch = s => ({ status: s });
    const ctx = lessonWorld({ book: [{ id: 'MK-2', changes: [ch('pending'), ch('pending'), ch('accepted'), ch('accepted'), ch('rejected'), ch('countered'), ch('superseded')] }] });
    const b = ctx.lessonBoard('changes', ctx.getContract('MK-2'));
    assert.deepEqual(JSON.parse(JSON.stringify(b.cols.map(c => [c.k, c.n]))), [['all', 6], ['accepted', 2], ['rejected', 1], ['countered', 1], ['pending', 2]]);
  });
});

describe('f1248 (6) every word the lesson says is in both books', () => {
  test('each ls_ key in js/lesson.js and js/handbook.js is in English and Swedish', () => {
    const { STRINGS } = require('../js/i18n.js');
    const keys = [...new Set([...LESSON.matchAll(/'(ls_[a-z_]+)'/g)].map(m => m[1]))];
    assert.ok(keys.length > 40, 'the keys were read');
    const plural = k => ['ls_days', 'ls_n_contracts', 'ls_left_out'].includes(k) ? [k + '_one', k + '_other'] : [k];
    for (const k of keys) for (const kk of plural(k)) for (const lang of ['en', 'sv']) assert.ok(STRINGS[lang][kk], `${lang}.${kk}`);
  });
});

/* (7) EVERY DRAWING IS A TABLE (owner, 27 Nov 2026: "The tables are not structured or in tables. This is very
   unprofessional"): a card with a head row naming its columns; Jambo's **bold** is drawn bold, never as stars.
   AT THE PARENT (14b45a7) the bars had no head and the stars were printed. */
describe('f1248 (7) every drawing is a table; bold is bold', () => {
  test('bars, ring, line and table each stand in a card with a head row naming their columns', () => {
    const ctx = lessonWorld({ money: true });
    const html = what => ctx.lessonBoardHtml(ctx.lessonBoard(what), 0, 1e9);
    const bars = html('stages_value');
    assert.match(bars, /class="lsn-bd lsn-card lsn-bars/);
    assert.match(bars, /<div class="lsn-thd"[^>]*><span>ls_h_stage<\/span><span><\/span><span class="is-r">ls_h_value<\/span><\/div>/);
    assert.match(bars, /--lsn-vw:\d+ch/, 'the figure column is one width, head and rows alike');
    assert.match(html('stages'), /ls_h_stage<\/span><span><\/span><span class="is-r">ls_h_contracts</);
    assert.match(html('book_figures'), /lsn-card lsn-tbl.*<thead>/);
    const ring = ctx.lessonBoardHtml({ type: 'ring', what: 'risk', mid: '3', parts: [{ k: 'low', lk: 'ls_low', n: 3, tone: 'Signed' }] }, 0, 1e9);
    assert.match(ring, /lsn-card lsn-ring.*lsn-thd is-lg.*ls_h_risk.*ls_h_contracts/);
    const line = ctx.lessonBoardHtml({ type: 'line', what: 'signed_months', pts: [{ k: '2026-10', m: '2026-10', n: 1 }, { k: '2026-11', m: '2026-11', n: 2 }] }, 0, 1e9);
    assert.match(line, /lsn-card lsn-line.*ls_h_month.*ls_h_contracts/);
  });
  test('a sentence\'s **bold** is drawn bold, its full stop stays with it, and no star is printed', () => {
    const ctx = lessonWorld({});
    const html = ctx.lessonStepHtml({ steps: [{ say: 'Holds **KES 333M** across **10 live contracts**. Done.' }] }, { shown: 1, at: [0], still: true }, 0, 0);
    assert.match(html, /<b>KES<\/b><\/span> <span[^>]*><b>333M<\/b>/);
    assert.match(html, /<b>contracts<\/b>\.<\/span>/);
    assert.doesNotMatch(html, /\*/);
  });
});

/* (8)–(13) THE RESULTS MUST BE PERFECT (owner, 27 Nov 2026: a lesson "for the marketing folder" drew the whole book —
   94 · 50 · 48 — under "You have 7 contracts in Marketing & Brand"; "where else might we have issues? The results must
   be perfect for the user"). AT THE PARENT (c61cdaf) none of where, period, contracts, lessonCheck or lessonSettle exists. */
const FACTS2 = { contract: () => null, contracts: [], parties: ['Naivas', 'Bidco', 'Kabras'], streams: [{ id: 'mktg', name: 'Marketing & Brand' }, { id: 'proc', name: 'proc' }] };
const live = (w) => BOOK.filter(c => c.status !== 'Declined' && (!w.stream || c.folder === w.stream) && (!w.party || c.counterparty.trim().toLowerCase() === w.party.toLowerCase()) && (!w.stage || c.status === w.stage));
describe('f1248 (8) a drawing counts exactly what the step is about, and says so in its head', () => {
  test('the owner\'s lesson: stages for the Marketing folder count Marketing only, and the head names it', () => {
    const ctx = lessonWorld({});
    const b = ctx.lessonBoard('stages', null, { what: 'stages', where: { stream: 'mktg' } });
    assert.deepEqual(J(b.items.map(x => [x.k, x.n])), [['Draft', 1], ['Under Review', 2], ['Signed', 3]]);
    assert.equal(b.scope.n, 6); assert.equal(b.scope.stream, 'mktg'); assert.equal(b.scope.whole, false);
    const head = ctx.lessonBoardHtml(b, 0, 1e9);
    assert.match(head, /<div class="lsn-scope">Marketing &amp; Brand · ls_n_contracts:6<\/div>/);
  });
  test('with no narrowing the head says it is the whole book, and counts it', () => {
    const b = lessonWorld({}).lessonBoard('stages', null, { what: 'stages' });
    assert.equal(b.scope.whole, true); assert.equal(b.scope.n, 10);
    assert.deepEqual(J(b.items.map(x => x.n)), [1, 3, 6]);
  });
  test('a counterparty is matched as the Customers page matches it (case and spaces), a stage exactly', () => {
    const ctx = lessonWorld({});
    assert.equal(ctx.lessonBoard('contracts', null, { what: 'contracts', where: { party: 'NAIVAS' } }).rows.length, 2);
    const signedMk = ctx.lessonBoard('contracts', null, { what: 'contracts', where: { stream: 'mktg', stage: 'Signed' } });
    assert.deepEqual(J(signedMk.rows.map(r => r.k)).sort(), ['S1', 'S2', 'S3']);
    const parties = ctx.lessonBoard('parties', null, { what: 'parties' });
    assert.equal(parties.items.find(x => x.k === 'naivas').n, 2, '"Naivas" and "naivas " are one party, as on the Customers page');
  });
  test('nothing in the narrowing is said, never drawn as the whole book', () => {
    const b = lessonWorld({}).lessonBoard('risk', null, { what: 'risk', where: { party: 'Nobody' } });
    assert.equal(b.type, 'say'); assert.equal(b.lk, 'ls_none_here');
  });
  test('a period draws its own months', () => {
    const ctx = lessonWorld({});
    const b = ctx.lessonBoard('ending_months', null, { what: 'ending_months', period: { from: '2099-01', to: '2099-04' } });
    assert.deepEqual(J(b.items.map(x => [x.m, x.n])), [['2099-01', 0], ['2099-02', 0], ['2099-03', 1], ['2099-04', 0]]);
    assert.deepEqual(J(b.scope.period), { from: '2099-01', to: '2099-04' });
  });
  test('the plan\'s check: a stream, a party and a stage must exist for this reader; the lesson\'s where reaches every book step', () => {
    const r = W.walkPlanClean({ title: 'T', where: { stream: 'Marketing & Brand' }, steps: [step('a', 'stages'), step('b', 'contracts', { where: { stage: 'executed' } }), step('c', 'pay_days')] }, FACTS2);
    assert.ok(r.plan, r.error);
    assert.deepEqual(J(r.plan.steps.map(x => x.show.where || null)), [{ stream: 'mktg' }, { stage: 'Signed' }, null]);
    assert.match(W.walkPlanClean({ title: 'T', where: { stream: 'Legal' }, steps: [step('a', 'stages'), step('b', 'risk')] }, FACTS2).error, /"Legal" is not a value stream.*mktg \(Marketing & Brand\)/);
    assert.match(W.walkPlanClean({ title: 'T', steps: [step('a', 'stages', { where: { party: 'Acme' } }), step('b', 'risk')] }, FACTS2).error, /not a counterparty.*Naivas/);
    assert.match(W.walkPlanClean({ title: 'T', steps: [step('a', 'pay_days', { where: { stream: 'mktg' } }), step('b', 'risk')] }, FACTS2).error, /cannot be narrowed/);
    assert.match(W.walkPlanClean({ title: 'T', steps: [step('a', 'risk', { period: { from: '2027-01', to: '2027-02' } }), step('b', 'stages')] }, FACTS2).error, /no months to choose/);
    assert.match(W.walkPlanClean({ title: 'T', steps: [step('a', 'ending_months', { period: { from: '2027-01', to: '2029-12' } }), step('b', 'stages')] }, FACTS2).error, /at most 24 months/);
  });
});
describe('f1248 (9) the same drawing twice in a row is refused', () => {
  test('stages then stages (the owner\'s second step) is sent back: light the first, or draw the contracts', () => {
    assert.match(W.walkPlanClean({ title: 'T', where: { stream: 'mktg' }, steps: [step('a', 'stages'), step('b', 'stages')] }, FACTS2).error, /draws again what an earlier step just drew/);
    assert.match(W.walkPlanClean({ title: 'T', steps: [step('a', 'stages'), step('b', 'highlight', { names: ['In review'] }), step('c', 'stages')] }, FACTS2).error, /draws again/);
    assert.ok(W.walkPlanClean({ title: 'T', steps: [step('a', 'stages'), step('b', 'stages', { where: { stream: 'mktg' } })] }, FACTS2).plan, 'a different narrowing is a different drawing');
  });
});
describe('f1248 (10) every number in a sentence is one the drawings show', () => {
  const ctx = lessonWorld({});
  const fill = (title, steps) => ctx.lessonFill({ title, steps });
  test('the owner\'s lesson is caught: "7" and "SEK 87M" over a drawing of the whole book', () => {
    const L = fill('T', [{ say: 'You have 7 contracts in Marketing & Brand — the total value is SEK 87M.', show: { what: 'stages' } },
      { say: 'Two are already signed.', show: { what: 'contracts', where: { stream: 'mktg' } } }]);
    const bad = J(ctx.lessonCheck(L));
    assert.deepEqual(bad.map(x => x.i), [0, 1]);
    assert.deepEqual(bad[0].said, ['7', 'SEK 87M']);
  });
  test('the same lesson narrowed and told truly passes: counts, totals, money within rounding, shares', () => {
    const L = fill('T', [{ say: 'You have **6 contracts** in Marketing & Brand: 1 drafting, 2 in review and three signed — half of them.', show: { what: 'stages', where: { stream: 'mktg' } } },
      { say: 'Together they are worth KES 183M; the signed ones KES 82M.', show: { what: 'stages_value', where: { stream: 'mktg' } } },
      { say: 'These three are signed.', show: { what: 'contracts', where: { stream: 'mktg', stage: 'Signed' } } }]);
    assert.deepEqual(J(ctx.lessonCheck(L)), []);
  });
  test('dates, years, references, sections and names are not figures', () => {
    const L = fill('T', [{ say: 'MK-103 under § 7 and clause 4.2 renews on 12 December 2027 (2027-12-12), in Q1, for the 3rd time.', show: { what: 'stages' } }, { say: 'Done.', show: { what: 'risk' } }]);
    assert.deepEqual(J(ctx.lessonCheck(L)), []);
  });
});
describe('f1248 (11) a lesson that fails goes back once; what still fails is said plainly, never with an unshown number', () => {
  const ctx = lessonWorld({});
  const bad = { lesson: { title: 'T', steps: [{ say: 'You have 7 contracts.', show: { what: 'stages' } }, { say: 'Risk.', show: { what: 'risk' } }] }, answer: 'x' };
  const good = { lesson: { title: 'T', steps: [{ say: 'You have 6 contracts in Marketing & Brand.', show: { what: 'stages', where: { stream: 'mktg' } } }, { say: 'Risk.', show: { what: 'risk' } }] }, answer: 'y' };
  test('sent back with what the drawings show; the corrected lesson is taken', async () => {
    let note = '';
    const r = await ctx.lessonSettle(bad, n => { note = n; return Promise.resolve(good); });
    assert.match(note, /Step 1 says 7, but its drawing shows: .*Draft.*1.*Under Review|Step 1 says 7, but its drawing shows: home_stage_drafting 1, home_stage_in_review 3, home_stage_executed 6 \(ls_all_contracts · ls_n_contracts:10\)/);
    assert.match(note, /Narrow the drawings to exactly what the person asked about/);
    assert.equal(r._lessonFilled.steps[0].say, 'You have 6 contracts in Marketing & Brand.');
    assert.deepEqual(J(ctx.lessonCheck(r._lessonFilled)), []);
  });
  test('still wrong after the one retry: the step is said in plain words built from its drawing', async () => {
    const r = await ctx.lessonSettle(bad, () => Promise.resolve(bad));
    const st = r._lessonFilled.steps[0];
    assert.equal(st.plain, true); assert.doesNotMatch(st.say, /\b7\b/);
    assert.deepEqual(J(ctx.lessonCheck(r._lessonFilled)), []);
  });
  test('a failed ask keeps the first lesson, said plainly where it fails', async () => {
    const r = await ctx.lessonSettle(bad, () => Promise.reject(new Error('down')));
    assert.equal(r._lessonFilled.steps[0].plain, true);
  });
});
describe('f1248 (12) the other readings tell the truth', () => {
  test('what Jambo found is counted only for the contract whose paper is on screen', () => {
    const c = { id: 'P1', status: 'Draft' };
    const off = lessonWorld({ book: [c] }).lessonBoard('findings', c, { what: 'findings' });
    assert.equal(off.lk, 'ls_open_clauses');
    const on = lessonWorld({ book: [c], extra: { intel: { paper: { mode: 'paper', id: 'P1' } }, stkLivePoints: () => [{ status: 'need' }, { status: 'look' }], stkCounts: L => ({ need: 1, look: 1, note: 0 }) } }).lessonBoard('findings', c, { what: 'findings' });
    assert.equal(on.type, 'bars');
  });
  test('waiting on us shows how many things wait (the list\'s own count), not a wait guessed from the last edit', () => {
    const ctx = lessonWorld({ extra: { hbWaitingOnUs: cs => cs.filter(x => x.id === 'R1'), negWhoseMove: () => ({ k: 'you', n: 3 }) } });
    const b = ctx.lessonBoard('waiting_us', null, { what: 'waiting_us' });
    assert.equal(J(b.head)[2], 'ls_h_waiting'); assert.equal(b.rows[0].cells[2].v, 3);
  });
  test('a money table without money rights is the contracts\' table, with the message', () => {
    const b = lessonWorld({ money: false }).lessonBoard('contracts_value', null, { what: 'contracts_value', where: { stream: 'mktg' } });
    assert.equal(b.nomoney, true); assert.doesNotMatch(JSON.stringify(b.rows), /money/);
  });
  test('what a card leaves out is said in it: more rows, and contracts with no rate', () => {
    const html = lessonWorld({}).lessonBoardHtml({ type: 'table', head: ['ls_h_agreement'], rows: [{ k: 'a', cells: [{ t: 'A' }] }], more: 4, left: 1 }, 0, 1e9);
    assert.match(html, /<div class="lsn-foot">ls_more:4 · ls_left_out:1<\/div>/);
  });
});
/* (13) THE QUESTION BANK — the ways people ask. Every lesson question reaches Jambo (no shortcut takes it to a page);
   every how-to and every ordinary question stays where it was; and for every narrowing a question can name, the drawing
   counts exactly the contracts a plain filter of the book finds. */
describe('f1248 (13) the question bank', () => {
  const lessons = ['Walk me through my contracts', 'walk me through the status of our contracts but for the marketing folder', 'Walk me through my renewals for next quarter',
    'take me through our duties this month', 'talk me through the negotiation with Naivas', 'run me through my approvals', 'teach me where our money is',
    'explain our book step by step', 'give me a tour of my portfolio', 'step by step, my risks please',
    'walk me through this contract', 'walk me through the changes on this agreement', 'explain this negotiation step by step', 'walk me through what needs me',
    'walk me through our signed contracts with Bidco', 'walk me through my contracts ending next year', 'walk us through the procurement stream', 'teach me my Board figures',
    'gå igenom mina avtal', 'gå igenom våra förnyelser', 'förklara våra risker steg för steg', 'lär mig var pengarna finns', 'take us through our approvals', 'walk me through my duties for Kabras'];
  const notLessons = ['walk me through sending a contract', 'walk me through how to sign this', 'walk me through adding a colleague', 'walk me through uploading a file',
    'teach me how to set up approvals', 'why is the Naivas value high?', 'change the payment days to 500', 'what ends this quarter?', 'open contracts', 'renewals',
    'show me the marketing folder', 'how many contracts do we have', 'teach me', "I'm new", 'hur skickar jag ett avtal', 'gå till inställningar',
    /* the Board's own chart questions: drawn on the Board's page, never a lesson (owner, 27 Nov 2026) */
    'explain my renewals', 'break down my contracts by stream', 'show value by stream', 'compare our streams by value', 'explain why our value is high', 'bryt ner mina avtal per värdeström', 'förklara våra risker'];
  for (const q of lessons) test('reaches Jambo as a lesson: ' + q, () => assert.equal(W.walkAsked(q), true));
  for (const q of notLessons) test('not a lesson: ' + q, () => assert.equal(W.walkAsked(q), false));
  const ctx = lessonWorld({});
  const wheres = [{}, { stream: 'mktg' }, { stream: 'proc' }, { party: 'Naivas' }, { party: 'Bidco' }, { party: 'Kabras' }, { stage: 'Signed' }, { stage: 'Under Review' },
    { stream: 'mktg', stage: 'Signed' }, { stream: 'proc', stage: 'Under Review' }, { stream: 'mktg', party: 'Naivas' }, { party: 'Kabras', stage: 'Signed' }];
  for (const w of wheres) test('counts exactly the narrowed book: ' + JSON.stringify(w), () => {
    const want = live(w);
    const st = ctx.lessonBoard('stages', null, { what: 'stages', where: Object.keys(w).length ? w : null });
    const n = st.type === 'say' ? 0 : st.items.reduce((a, x) => a + x.n, 0);
    assert.equal(n, want.length, 'stage bars add up to the narrowed book');
    const tb = ctx.lessonBoard('contracts', null, { what: 'contracts', where: Object.keys(w).length ? w : null });
    const shown = tb.type === 'say' ? [] : J(tb.rows.map(r => r.k));
    assert.ok(shown.every(id => want.some(c => c.id === id)), 'the contracts table lists only them');
    assert.equal(shown.length + (tb.more || 0), want.length, 'and says how many more it does not show');
    if (st.scope) assert.equal(st.scope.n, want.length, 'the head says how many');
  });
});

/* f1248 (14) ONE DECIDER FOR EVERY BOX (owner, 27 Nov 2026: "Board is for KPIs and charts … walk me through … from the
   side panel"): "Show me" a chart or a figure → the Board draws it; "Walk me through" → a lesson in Jambo's panel;
   a list or a page ("show me signed contracts", "show me the guide") opens its page as before; anything else is
   an ordinary answer. askRouteOf is the one reading every host asks (caAskAnywhere, intelAsk, aiSubmit). */
describe('f1248 (14) one decider: show me → the Board, walk me through → a lesson', () => {
  const board = ['show me value by stream', 'show me my renewals', 'show me what ends this quarter', 'show me our largest deals',
    'compare our streams by value', 'break down my contracts by stream', 'show me contracts by stage', 'show me value by counterparty',
    'chart my contracts by status', 'plot value over time', 'graph renewals month by month', 'draw a pie of our streams',
    'show me the pipeline', 'show me our KPIs', 'show me the key figures', 'show me our exposure', 'show me risks by stream',
    'show me duties due this month', 'show me our top 5 counterparties', 'show me the biggest contracts', 'display value per stream',
    'show the split of contracts by type', 'show me the distribution by stage', 'can you show me value by quarter', 'please show me the renewals',
    'show me our payment days', 'show me days to sign', 'top 10 suppliers by value', 'compare Naivas and Bidco by value', 'what is the share of value by stream',
    'show me contract value by month', 'show me expiring contracts by month', 'show me obligations by side', 'show me value for the marketing folder by stage',
    'chart contracts ending next year', 'show me a timeline of renewals', 'show me the trend of signed contracts', 'show me contracts per counterparty',
    'visa värde per värdeström', 'visa mig våra förnyelser', 'visa fördelning per motpart', 'jämför våra värdeströmmar', 'visa nyckeltal', 'rita avtal per månad',
    'visa mig våra största avtal', 'bryt ner mina avtal per värdeström'];
  const lesson = ['walk me through my contracts', 'walk me through value by counterparty', 'gå igenom mina avtal', 'take me through our duties this month',
    'walk me through my renewals for next quarter', 'teach me where our money is', 'step by step, my risks please', 'walk me through the status of our contracts',
    'talk me through the negotiation with Naivas', 'walk me through contracts by stage for Marketing & Brand', 'run me through my approvals', 'give me a tour of my portfolio'];
  const page = ['show me signed contracts', 'show me all imports', 'show me MK-BP2', 'show me the guide', 'show me overdue contracts', 'show me drafts',
    'show me negotiations', 'show me the risk lens', 'explain my renewals', 'teach me', 'walk me through sending a contract', 'walk me through the settings page',
    'how do I show value by stream?', 'where is the chart of renewals?', 'show me the marketing folder', 'open contracts', 'renewals', 'how many contracts do we have',
    'why is the Naivas value high?', 'change the payment days to 500', 'show me the settings', 'show me the handbook', 'hur gör jag ett diagram?', 'show me this page',
    'show me the Board', 'what ends this quarter?', "I'm new", 'gå till inställningar', 'visa mig handboken', 'show me MK-B2 by value', 'show me the risk lens by stream'];
  for (const q of board) test('the Board draws it: ' + q, () => assert.equal(W.askRouteOf(q), 'board'));
  for (const q of lesson) test('a lesson in the panel: ' + q, () => assert.equal(W.askRouteOf(q), 'lesson'));
  for (const q of page) test('neither (its page, or an ordinary answer): ' + q, () => assert.equal(W.askRouteOf(q), null));
  test('the decider reads only the person\'s words, never the page\'s description put in front (red at the parent: the Board\'s wrapper named MK-B2 and the chart became a lesson)', () => {
    const wrap = q => '[The reader is on the Home board. What the board shows now:\nYour book: 10 live contracts; Retail Supply — Coast MK-B2 waits.\nAnswer from these numbers when the question is about the board.]\n\n' + q;
    assert.equal(W.chartAsked(wrap('show me contracts by stage')), true);
    assert.equal(W.chartAsked(wrap('show me signed contracts')), false);
    assert.equal(W.askOwnWords(wrap('show me value by stream')), 'show me value by stream');
  });
  test('the two never overlap: a lesson is never a Board chart', () => {
    for (const q of [...board, ...lesson, ...page]) assert.ok(!(W.walkAsked(q) && W.chartAsked(q)), q);
  });
  test('every box asks the one decider before its own reading, and a chart there ends on the Board', () => {
    const CA = fs.readFileSync(path.join(ROOT, 'js/copilotacts.js'), 'utf8');
    const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
    assert.match(CA, /chartAsked\(t\)[\s\S]{0,700}boardShowGo\(t\)/, 'caAskAnywhere');
    assert.match(IG, /chartAsked\(q\)[\s\S]{0,500}boardShowGo\(q/, 'intelAsk');
    assert.match(AI, /chartAsked\(q\)[\s\S]{0,300}boardShowGo\(q\)/, 'the ✦ window');
    assert.match(IG, /function boardShowGo[\s\S]{0,900}igBoardTalkAsk\(q\)/, 'boardShowGo hands the Board its question');
  });
  test('a chart question is never offered the lesson tool, on either host (red at the parent: the Board\'s fallback answer became a lesson)', () => {
    assert.match(SERVER, /function copilotToolsFor\(context, question\)[\s\S]{0,300}chartAsked\(question\) \? copilotToolsNow\(\)\.filter\(t => t\.name !== 'walk_through'\)/);
    assert.equal((SERVER.match(/tools: copilotToolsFor\(context, typeof question === 'string' \? question : ''\)/g) || []).length, 2, 'both chat routes');
    assert.match(AI, /function localAiTools\(q\)\{[\s\S]{0,200}chartAsked\(q\)\)\?LOCAL_AI_TOOLS\.filter\(t=>t\.name!=='walk_through'\)/);
    assert.match(AI, /tools:localAiTools\(lastQ\)/);
  });
});

/* f1248 (15) THE BRIDGES: a Board card's ⋯ menu has Walk me through this (a lesson about that card, in the panel);
   a lesson's book drawing has Put on the Board (the same drawing asked as the Board's chart, the same narrowing). */
describe('f1248 (15) the bridges between the Board and a lesson', () => {
  const HB = fs.readFileSync(path.join(ROOT, 'js/views/homeboard.js'), 'utf8');
  const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
  test('both Board card menus carry Walk me through this, and it asks a lesson by name', () => {
    assert.equal((HB.match(/data-hb-walk="/g) || []).length, 2, 'chart cards and kind panels');
    assert.match(HB, /on\('\[data-hb-walk\]'\)[\s\S]{0,120}hbWalkThis/);
    assert.match(HB, /function hbWalkThis[\s\S]{0,400}intelWalkAsk\(i18t\('hb_walk_q'/);
    assert.match(IG, /function intelWalkAsk[\s\S]{0,600}intelChatAsk\(q\)/);
  });
  const EN = require('../js/i18n.js').STRINGS.en;
  const say = (k, v) => String(EN[k] == null ? k : EN[k]).replace(/\{(\w+)\}/g, (m, x) => (v && v[x] != null ? v[x] : m));
  const ctx = lessonWorld({ extra: { chartAsked: W.chartAsked, i18t: say } });
  test('a lesson\'s drawing is asked on the Board as the same chart with the same narrowing', () => {
    const b = ctx.lessonBoard('stages', null, { what: 'stages', where: { stream: 'mktg', stage: 'Signed' } });
    const q = ctx.lessonBoardAsk(b);
    assert.ok(q, 'a question'); assert.equal(W.askRouteOf(q), 'board', q);
    assert.match(q, /Marketing & Brand/);
  });
  test('a list of contracts is never offered to the Board', () => {
    const tb = ctx.lessonBoard('contracts', null, { what: 'contracts', where: { stream: 'mktg' } });
    assert.equal(ctx.lessonBoardAsk(tb), '');
  });
  test('the press goes through boardShowGo, never the phone', () => {
    assert.match(LESSON, /act === 'board'[\s\S]{0,240}boardShowGo\(q\)/);
    assert.match(LESSON, /!lsPhone\(\) && lessonBoardAsk\(s\.board\)/);
  });
});

/* f1248 (16) A "SHOW ME" THAT NAMES NO CHART ASKS WHICH (owner, 27 Nov 2026: "add 4 buttons in the jambo panel asking
   which one the user mean so they can press instead of build charts they may not want to see"): Jambo's panel asks
   with four buttons; nothing is drawn until one is pressed, and only that one is drawn on the Board, by HaTi (no AI). */
describe('f1248 (16) a vague "show me" gets four buttons, and only the pressed one is drawn', () => {
  const vague = ['show me', 'Show me.', 'show me a chart', 'show me how we are doing', 'show me something', 'show me the numbers', 'show me our charts',
    'show me everything', 'can you show me some charts', 'visa mig', 'visa mig hur det går', 'visa mig något'];
  const notVague = ['show me my contracts', 'show me the board', 'show me this page', 'show me how to create a new contract', 'show me value',
    'show me value by stream', 'show me signed contracts', 'show me the guide', 'show me MK-B2', 'walk me through my contracts'];
  for (const q of vague) test('asks which: ' + q, () => assert.equal(W.askRouteOf(q), 'choose'));
  for (const q of notVague) test('not asked which: ' + q, () => assert.notEqual(W.askRouteOf(q), 'choose'));
  const IG = fs.readFileSync(path.join(ROOT, 'js/views/intelligence.js'), 'utf8');
  test('the buttons are asked in the panel; nothing is drawn before a press; a press draws that one card with HaTi\'s own recipe', () => {
    assert.match(IG, /chartVague\(q\)\) return boardShowChoices\(q\);[\s\S]{0,400}return await igBoardTalkAsk\(q\);/, 'vague → the buttons, never the drawing model');
    const choices = IG.slice(IG.indexOf('function boardShowChoices('), IG.indexOf('function boardShowCard('));
    assert.doesNotMatch(choices, /hbAddCard|igBoardTalkAsk|intelGraphAsk|api\(/, 'asking draws nothing and calls nothing');
    assert.match(IG, /if\(c\.card\)\{ m\.choices=null;[^\n]*boardShowCard\(c\.card\)/, 'the press draws');
    assert.match(IG.slice(IG.indexOf('function boardShowCard(')), /^function boardShowCard[\s\S]{0,500}hbAddCard\(\{ all:true \}, c\.recipe, c\.title\)/);
  });
  test('four buttons; value only with money rights, else the count by stream', () => {
    const win = { state: { view: 'dashboard' } };
    const src = IG.slice(IG.indexOf('const BOARD_SHOW_CARDS='), IG.indexOf('function boardShowChoices('));
    for (const money of [true, false]){
      const f = new Function('window', 'canViewValues', src + '; return boardShowCardsFor();');
      const cards = f(Object.assign(win, { canViewValues: () => money }), () => money);
      assert.equal(cards.length, 4, 'four');
      assert.equal(cards.some(c => c.recipe.measure === 'value'), money, money ? 'value shown' : 'no value without money rights');
    }
  });
});
