/* ═══════════════════════════════════════════════════════════════════════════
   f1121 — WORK GOES ONLY TO WHO CAN DO IT (owner, 20 Nov 2026: "shouldnt the
   updates only go to people who can change the contract?")

   A Viewer signed in and found "1 change is waiting on your answer" on the
   Board's Needs you, with Jambo's drafted answer and its Accept, Counter and
   "Change the suggestion" — work they may not do (the server refuses a
   Viewer's writes). Needs you is for who can act; who can only read hears it
   as news, under the bell's News tab.

   WHAT THIS PINS
     (1) negoMayAnswer: a company Viewer never; an admin always; a desk Reader
         not where the desk rule seats the negotiation; nobody signed in and
         their own page keep the old reading
     (2) Jambo's prepared answers to their round, and his "they wrote and
         nobody answered", are not prepared for who may not answer
     (3) the Board prepares a company Viewer no work at all
     (4) the bell: their changes are NEWS for who may not answer ("The other
         side sent N changes"), never counted; the checklist's quiet row asks
         the same check; both books
   AT THE PARENT (5a76fd8) every test here FAILS: there is no negoMayAnswer,
   Jambo's round and the Board hand a Viewer the work, and the bell has no
   nego-news.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const NEGO = R('js/views/negotiation.js');
const AG = R('js/views/agents.js');
const CN = R('js/views/counter.js');
const APP = R('js/app.js');
const HOME = R('js/views/home.js');
const I18N = R('js/i18n.js');

const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

function run(src, ctx){
  ctx.window = ctx;
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx;
}

describe('f1121 (1) who may answer the other side', () => {
  const body = fnBody(NEGO, 'negoMayAnswer');
  const ask = (me, extra) => run(body, { currentUser: () => me, ...(extra || {}) }).negoMayAnswer({ id: 'MK-1' });
  test('1a there is one check, and it is published', () => {
    assert.ok(body, 'negoMayAnswer exists');
    assert.match(NEGO, /negoNeedsYouIds, negoMayAnswer,/);
  });
  test('1b a company Viewer never; an admin always', () => {
    assert.equal(ask({ id: 'v', role: 'viewer' }), false);
    assert.equal(ask({ id: 'a', role: 'admin' }, { deskMayRedline: () => false }), true);
  });
  test('1c a member answers unless the desk seats them as a Reader', () => {
    assert.equal(ask({ id: 'l', role: 'legal' }), true);
    assert.equal(ask({ id: 'l', role: 'legal' }, { deskMayRedline: () => true }), true);
    assert.equal(ask({ id: 'l', role: 'legal' }, { deskMayRedline: () => false }), false);
  });
  test('1e a desk Contributor answers nothing: only the seat that may send (the server refuses theirs)', () => {
    assert.equal(ask({ id: 'c', role: 'legal' }, { deskMayRedline: () => true, deskMaySend: () => false }), false);
    assert.equal(ask({ id: 'l', role: 'legal' }, { deskMayRedline: () => true, deskMaySend: () => true }), true);
  });
  test('1d nobody signed in, and their own page, keep the old reading', () => {
    assert.equal(ask(null), true);
    assert.equal(ask({ id: 'v', role: 'viewer' }, { PORTAL_MODE: true }), true);
  });
});

describe('f1121 (2) Jambo prepares no answer for who may not give it', () => {
  const C = { id: 'MK-1', changes: [{ id: 'x1', status: 'pending', authorSide: 'counterparty', createdAt: '2026-11-01' }],
    thread: [{ at: '2026-10-01', side: 'counterparty', text: 'Any news?' }] };
  const world = may => run(fnBody(AG, 'agRoundItems') + '\n' + fnBody(AG, 'agQuietItems'), {
    AG_PREP_PLAN: {}, AG_QUIET_DAYS: 3, _agDaysSince: () => 20, negoNeedsYouIds: () => ['x1'], negoMayAnswer: () => may });
  test('2a their round: a piece for who may answer, none for who may not', () => {
    assert.equal(world(true).agRoundItems([C]).length, 1);
    assert.equal(world(false).agRoundItems([C]).length, 0);
  });
  test('2b they wrote and nobody answered: the same', () => {
    assert.equal(world(true).agQuietItems([C]).length, 1);
    assert.equal(world(false).agQuietItems([C]).length, 0);
  });
});

describe('f1121 (3) the Board prepares a company Viewer no work', () => {
  const pieces = [{ key: 'answer:MK-1', kind: 'answer', cid: 'MK-1' }];
  const world = me => run(fnBody(CN, 'ndPieces'), { currentUser: () => me, AG_KEYS: ['round'], HB_OFF_BOARD: [],
    agentsData: () => ({ agents: { round: { ready: pieces } } }) });
  test('3a a Viewer: nothing; a member: the piece', () => {
    assert.equal(world({ id: 'v', role: 'viewer' }).ndPieces().length, 0);
    assert.equal(world({ id: 'l', role: 'legal' }).ndPieces().length, 1);
  });
});

describe('f1121 (4) the bell tells, and the checklist asks the same check', () => {
  test('4a their changes are news for who may not answer, and news is never counted', () => {
    const f = strip(fnBody(APP, 'buildAlerts'));
    const i = f.indexOf("push('nego-news'"), j = f.indexOf("push('negotiation'");
    assert.ok(i > 0 && j > i, 'the news row is decided before the work row');
    assert.match(f.slice(i - 200, i), /negoMayAnswer\(c\)/);
    assert.match(APP, /\{ k:'nego-news',\s+tone:'gray'/);
    assert.match(CN, /const ND_NEWS = \[[^\]]*'nego-news'/);
  });
  test('4b the checklist\'s quiet row asks negoMayAnswer', () => {
    assert.match(strip(fnBody(HOME, 'needsYouOf')), /deskStaleInboxFor&&!\(window\.negoMayAnswer&&!negoMayAnswer\(c, me\)\)/);
  });
  test('4c both books say it', () => {
    for (const k of ['al_nego_news_one', 'al_nego_news_other'])
      assert.equal((I18N.match(new RegExp('^\\s+' + k + ':', 'gm')) || []).length, 2, k + ' in both books');
    assert.match(I18N, /al_nego_news_other: 'The other side sent \{n\} changes'/);
    assert.match(I18N, /al_nego_news_other: 'Motparten skickade \{n\} ändringar'/);
  });
});
