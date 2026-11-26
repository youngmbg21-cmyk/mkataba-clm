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
  test('a step\'s show carries what, names and upto only: no value, count, figure or data', () => {
    const show = W.WALK_TOOL_SCHEMA.properties.steps.items.properties.show.properties;
    assert.deepEqual(Object.keys(show).sort(), ['names', 'upto', 'what']);
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
function lessonWorld(o){
  const win = {};
  const stages = [{ k: 'Draft', word: 'home_stage_drafting', n: 1, v: 6e6 }, { k: 'Under Review', word: 'home_stage_in_review', n: 3, v: 145e6 }, { k: 'Signed', word: 'home_stage_executed', n: 6, v: 182e6 }];
  Object.assign(win, W, {
    window: win, i18t: (k, v) => k + (v && v.n != null ? ':' + v.n : ''), i18tn: (k, n) => k + ':' + n,
    canViewValues: () => o.money !== false, mayActOn: () => o.viewer !== true, isAdmin: () => false,
    hbBookData: () => ({ stages, figs: { live: { n: 10 }, ending: { n: 2 }, past: { n: 0 }, overdue: { n: 1 }, us: { n: 0 } } }),
    hbBook: () => o.book || [], getContract: id => (o.book || []).find(c => c.id === id) || null,
    signBlockers: c => (c && c.blockers) || [], hmStageTone: k => 'var(--' + k + ')',
  });
  vm.createContext(win);
  vm.runInContext(LESSON, win, { filename: 'js/lesson.js' });
  return win;
}
describe('f1248 (5) money only with money rights; the count and the message for everyone else', () => {
  test('with money rights the value is drawn', () => {
    const ctx = lessonWorld({ money: true });
    const b = ctx.lessonBoard('stages_value');
    assert.equal(b.nomoney, undefined); assert.equal(b.money, true);
    assert.deepEqual([...b.items.map(x => x.n)], [6e6, 145e6, 182e6]);
  });
  test('without it: the count (the Board\'s own), marked nomoney, and the step says so with Ask an admin', () => {
    const ctx = lessonWorld({ money: false });
    const b = ctx.lessonBoard('stages_value');
    assert.equal(b.nomoney, true); assert.ok(!b.money);
    assert.deepEqual([...b.items.map(x => x.n)], [1, 3, 6]);
    const L = { id: 'x', title: 'T', steps: [{ say: 'Money by stage.', board: b }] };
    const html = ctx.lessonStepHtml(L, { shown: 1, at: [0], still: true }, 0, 0);
    assert.match(html, /lsn-nomoney/); assert.match(html, /ls_nomoney/); assert.match(html, /data-lsn-act="askadmin"/);
    for (const k of ['parties_value', 'streams_value', 'ending_value']) assert.equal(ctx.lessonBoard(k).nomoney, true, k);
  });
  test('the drawing\'s figures are filled when the lesson arrives and kept on it (lessonFill)', () => {
    const ctx = lessonWorld({ money: true, book: [{ id: 'MK-1', name: 'One', blockers: [{ key: 'a', label: 'Name a signer' }] }] });
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
    const plural = k => k === 'ls_days' ? ['ls_days_one', 'ls_days_other'] : [k];
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
