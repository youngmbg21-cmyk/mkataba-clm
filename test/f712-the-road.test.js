'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f712 — BEFORE YOU SIGN, "THE ROAD" (round 10 of the redesign: the owner
   picked "The road" by name and said yes to the Sign button appearing only to
   the person whose turn it is, 17 Oct 2026)
   (1) The stops are a READING (signReadiness, signSteps, nextSigner): the
       checks, the yes where one is asked, each step of the route, sealed and
       sent; nothing held, written or decided here.
   (2) Whose turn: the next signer on our side, reserved for this person or
       for anyone — the signing act's own test (signDocument).
   (3) The column's body stands under the open stop; the Sign button only in
       the reader's own stop, drawn for nobody else.
   AT THE PARENT (769bb57) every test here FAILS.
   The browser half: test/chromium/the-road-verify.js.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PD = R('js/paperdesk.js');
const I18N = R('js/i18n.js');
const BOOKS = (() => {
  const en = {}, sv = {};
  for (const m of I18N.matchAll(/^\s+([a-z][a-z0-9_]*): '((?:[^'\\]|\\.)*)',?\s*$/gm)){
    if (!(m[1] in en)) en[m[1]] = m[2]; else if (!(m[1] in sv)) sv[m[1]] = m[2];
  }
  return { en, sv };
})();
function stage({ holds = [], rows = [], plan = [], me = 'u1', status = 'Under Review' } = {}){
  const c = { id: 'MK-1', counterparty: 'Helio', status, signerPlan: plan, obligations: [{ desc: 'Pay', status: 'open' }] };
  const steps = () => { const by = new Map(); plan.slice().sort((a, b) => a.order - b.order).forEach(s => { const k = s.step || s.order; if (!by.has(k)) by.set(k, []); by.get(k).push(s); });
    return [...by.keys()].sort((a, b) => a - b).map((k, i) => ({ n: i + 1, rows: by.get(k) })); };
  const ctx = {
    i18t: (k, v) => k + (v ? '[' + Object.values(v).join(',') + ']' : ''), i18tn: (k, n) => k + ':' + n,
    signReadiness: () => ({ holds, rows }), signSteps: steps,
    signStepNow: () => { const st = steps().find(x => !x.rows.every(r => r.signed)); return st ? st.n : 0; },
    nextSigner: () => plan.slice().sort((a, b) => a.order - b.order).find(s => !s.signed) || null,
    currentUser: () => ({ id: me }), contractParty: () => 'Lindqvist', negoExecuted: () => false,
    setTimeout: () => 0,
  };
  ctx.window = ctx;
  vm.createContext(ctx); vm.runInContext(PD, ctx);
  return { ctx, c };
}
const J = x => JSON.parse(JSON.stringify(x));
describe('f712 (1) the stops are a reading', () => {
  test('1a the checks, who signs (none yet), sealed and sent; the road at the first open stop', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'standards-read' }, { kind: 'signers' }] });
    const R0 = J(ctx.pdRoadStops(c));
    assert.deepEqual(R0.stops.map(x => x.k), ['ready', 'who', 'sealed']);
    /* RE-POINTED 18 Oct 2026 (the gaps, f752): the count is followed by the checks it names, as drawn */
    assert.equal(R0.stops[0].sub, 'sc_n_to_settle:1: pd_rd_ck_standards', 'the checks count leaves the signing holds out');
    assert.equal(R0.cur, 0);
    assert.equal(R0.mineAt, -1);
  });
  test('1b the yes stands where one is asked; each step is a stop named for its side', () => {
    const { ctx, c } = stage({ holds: [{ kind: 'signapproval', short: 'Jonas Berg has not said yes' }],
      plan: [{ id: 'a', party: 'counterparty', name: 'Henrik', order: 1 }, { id: 'b', party: 'internal', name: 'Maria', memberId: 'u1', order: 2 }] });
    const R0 = J(ctx.pdRoadStops(c));
    assert.deepEqual(R0.stops.map(x => x.k), ['ready', 'yes', 'step1', 'step2', 'sealed']);
    assert.equal(R0.stops[1].sub, 'Jonas Berg has not said yes');
    assert.equal(R0.stops[2].t, 'pd_rd_signs[Helio]');
    assert.equal(R0.stops[3].t, 'pd_rd_signs[Lindqvist]');
    assert.equal(R0.cur, 1, 'the checks are clear, the yes is where the road is');
  });
  test('1c reading writes nothing', () => {
    const { ctx, c } = stage({ plan: [{ id: 'b', party: 'internal', name: 'Maria', order: 1 }] });
    const before = JSON.stringify(c); ctx.pdRoadStops(c); assert.equal(JSON.stringify(c), before);
  });
});
describe('f712 (2) whose turn', () => {
  test('2a ours and reserved for me, or for anyone: mine; theirs, or reserved for another: not', () => {
    const P = (party, memberId) => [{ id: 'x', party, name: 'N', memberId, order: 1 }];
    assert.equal(stage({ plan: P('internal', 'u1') }).ctx.pdSignMine(stage({ plan: P('internal', 'u1') }).c), true);
    assert.equal(stage({ plan: P('internal') }).ctx.pdSignMine(stage({ plan: P('internal') }).c), true);
    assert.equal(stage({ plan: P('internal', 'u9') }).ctx.pdSignMine(stage({ plan: P('internal', 'u9') }).c), false);
    assert.equal(stage({ plan: P('counterparty') }).ctx.pdSignMine(stage({ plan: P('counterparty') }).c), false);
    assert.equal(stage({ plan: [] }).ctx.pdSignMine(stage({ plan: [] }).c), false, 'nobody named: nobody\'s turn');
  });
  test('2b the stop that is mine says so', () => {
    const { ctx, c } = stage({ plan: [{ id: 'b', party: 'internal', name: 'Maria', memberId: 'u1', order: 1 }] });
    const R0 = J(ctx.pdRoadStops(c));
    assert.equal(R0.mineAt, 1);
    assert.match(R0.stops[1].sub, /pd_rd_turn_you/);
  });
});
describe('f712 (3) where the body and the Sign button stand', () => {
  test('3a placed by order, the foot drawn only in the reader\'s own stop', () => {
    const f = PD.slice(PD.indexOf('function pdRoadPaint('), PD.indexOf('function pdSignFaceHtml('));
    /* RE-POINTED 18 Oct 2026 (the gaps, f752): while a named yes is framed the body folds behind Ready to sign's Show */
    assert.match(f, /body\.style\.order = String\(R\.fold \? 3 : 2 \* R\.cur \+ 3\);/);
    assert.match(f, /const show = R\.mineAt >= 0;/);
    /* the route's own link keeps the foot when it is not the reader's turn,
       the Sign button hidden in it (upload-blanks-verify's door, CI 18 Oct) */
    assert.match(f, /foot\.style\.display = \(show \|\| route\) \? '' : 'none';/);
    assert.match(f, /const btn = foot\.querySelector\('#sign-btn'\); if \(btn\) btn\.style\.display = show \? '' : 'none';/);
    assert.match(PD, /const next = host\.querySelector\('\[data-pd-sf-next\]'\); if \(next\) next\.innerHTML = pdSignNextHtml\(c\);\n\s+pdRoadPaint\(c\);/, 'drawn after every paint of the column');
  });
  test('3b the words, in both books', () => {
    for (const k of ['pd_rd_ready', 'pd_rd_ready_done', 'pd_rd_yes', 'pd_rd_yes_done', 'pd_rd_who', 'pd_rd_nobody', 'pd_rd_signs', 'pd_rd_us', 'pd_rd_signed', 'pd_rd_turn_you', 'pd_rd_turn', 'pd_rd_after', 'pd_rd_sealed', 'pd_rd_copies', 'pd_rd_obls_one', 'pd_rd_obls_other'])
      for (const l of ['en', 'sv']) assert.ok(BOOKS[l][k], k + ' ' + l);
  });
});
