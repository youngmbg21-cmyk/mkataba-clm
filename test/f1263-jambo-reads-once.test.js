'use strict';
/* f1263 — JAMBO READS A CONTRACT ONCE (owner's yes to the drawing "Read once", 27 Nov 2026: "I do not want jambo to read
   a contract twice when i load it … when you upload a new contract or when you create a new agreement, the [notes] do not
   appear until the contract is read … add a plan if you want or not then it reads"; "plan should appear for every
   contract"; "Fold the playbook check into one read").

   (1) NOTHING IS READ ON ARRIVAL: contractArrived starts no reading and no facts read; the upload's tick box is gone.
   (2) ONE READ: readOnce runs the arrival reading FIRST (its fill step may move the wording), then the facts and the
       clause read with the plan — the clause read only where owed; opening Clauses starts nothing; the playbook check
       never runs on its own on an unread contract.
   (3) IT OPENS ON PLAN: a deliberate open, a new agreement and an upload land on the Plan tab while unread; the notes
       beside the clean paper wait for the read; the Plan tab's faces: before (a suggested plan, Read with this plan ·
       Change it · Read without a plan), reading (one bar, five parts, the plan waiting), read (today's answers).
   (4) every new word in both books. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const TR = R('js/triage.js'), BD = R('js/views/breakdown.js'), PD = R('js/paperdesk.js'), CT = R('js/views/contract.js'), PB = R('js/playbook.js'), I18N = R('js/i18n.js');
const fnSrc = (src, name) => { let i = src.indexOf('async function ' + name + '('); if (i < 0) i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

describe('f1263 (1) nothing is read on arrival', () => {
  test('contractArrived stops before any reading, behind one switch that is off', () => {
    assert.match(TR, /const TRIAGE_ON_ARRIVAL = false;/);
    const f = fnSrc(TR, 'contractArrived');
    const stop = f.indexOf('if (!TRIAGE_ON_ARRIVAL) return false;');
    assert.ok(stop > 0, 'the stop stands');
    assert.ok(stop < f.indexOf('askColFactsArrive') && stop < f.indexOf('triageAndPaint(c'), 'before the facts and the reading');
    assert.ok(f.indexOf('participantsClaim') < stop && f.indexOf('contactAdopt') < stop, 'what costs nothing still happens');
  });
  test('a contract that arrives is marked as waiting for its one read, before its first landing', () => {
    assert.match(TR, /const TRIAGE_READ_FIRST = true;/);
    assert.match(fnSrc(TR, 'contractArrived'), /if \(TRIAGE_READ_FIRST && !o\.elsewhere && !c\.readFirst\)\{ c\.readFirst = true;/);
    assert.match(fnSrc(CT, 'roomOpenOnTerms'), /if\(c&&!c\.readFirst&&!\(c\.triage&&c\.triage\.at\)\) c\.readFirst=true;/);
  });
  test('the upload pop-up no longer offers a reading it would not start', () => {
    assert.match(fnSrc(CT, 'triageOptInHtml'), /if\(typeof window!=='undefined'&&window\.STK_READ_ONCE\) return '';/);
  });
});

describe('f1263 (2) one read', () => {
  function world(o){
    const order = [];
    const c = { id: 'A', readPlan: o.plan ? { items: o.plan } : null };
    const ctx = { Promise, Map, String, Array, setInterval: () => 1, clearInterval: () => {}, i18t: k => k, toast: () => {},
      _bd: { busy: false }, _bdBusyFor: () => false, stkOf: () => o.kept || null,
      getContract: () => c, readOnceRepaint: () => {},
      stkRun: async () => { order.push('clauses'); },
      window: { triageAndPaint: async () => { await null; order.push('arrival'); }, askColFactsArrive: async () => { order.push('facts'); }, mayActOn: () => o.may !== false } };
    vm.createContext(ctx);
    vm.runInContext('const _ro = new Map();\n' + fnSrc(BD, 'readOnce') + '\nthis.readOnce = readOnce;', ctx);
    return { ctx, c, order };
  }
  test('the arrival reading first, then the facts and the clauses — the clause read taken over the finished wording', async () => {
    const W = world({});
    await W.ctx.readOnce(W.c);
    assert.equal(W.order[0], 'arrival');
    assert.ok(W.order.includes('facts') && W.order.includes('clauses'));
  });
  test('a second press while it runs is the same read', async () => {
    const W = world({});
    const a = W.ctx.readOnce(W.c), b = W.ctx.readOnce(W.c);
    await Promise.all([a, b]);
    assert.equal(W.order.filter(x => x === 'clauses').length, 1);
  });
  test('the clause read only where owed: read with this plan already, it is not read again', async () => {
    const W = world({ plan: ['Leave early?'], kept: { plan: ['Leave early?'], points: [] } });
    await W.ctx.readOnce(W.c);
    assert.ok(!W.order.includes('clauses'));
    const W2 = world({ plan: ['Leave early?', 'Rent?'], kept: { plan: ['Leave early?'], points: [] } });
    await W2.ctx.readOnce(W2.c);
    assert.ok(W2.order.includes('clauses'), 'a changed plan is read');
  });
  test('a Viewer starts nothing', async () => {
    const W = world({ may: false });
    assert.equal(await W.ctx.readOnce(W.c), null);
    assert.equal(W.order.length, 0);
  });
  test('opening Clauses starts nothing; Read the clauses is the one read; the playbook check waits for it', () => {
    assert.match(BD, /const STK_READ_ONCE = true;/);
    assert.match(fnSrc(BD, 'stkAutoRun'), /if \(STK_READ_ONCE && c && c\.readFirst\) return;/);
    assert.match(BD, /if \(t\.closest\('\[data-stk-run\]'\)\)\{ readOnce\(c\); return; \}/);
    assert.match(fnSrc(BD, 'stkRun'), /if \(!\(o && o\.quiet\)\) try \{ if \(typeof window\.pd2WalkWithRead === 'function'\)/, 'no reading line over an unread paper');
    assert.match(fnSrc(PB, 'pbOpenCheckMay'), /if \(c\.readFirst && !\(c\.triage && c\.triage\.at\) && !\(typeof window !== 'undefined' && typeof window\.stkOf === 'function' && window\.stkOf\(c\)\)\) return false;/);
  });
  test('every door to a read is the one read: Plan, the Dossier\'s Read it', () => {
    assert.match(fnSrc(PD, 'pd2PlanRead'), /\(typeof window\.readOnce === 'function'\) \? window\.readOnce\(c\)/);
    assert.match(PD, /\(typeof window\.readOnce === 'function'\) \? window\.readOnce\(getContract\(cc\.id\) \|\| cc\)/);
  });
});

describe('f1263 (3) it opens on Plan, and the notes wait', () => {
  test('an open, a new agreement and an upload land on Plan while unread', () => {
    assert.match(fnSrc(PD, 'pdOpenTabOf'), /if \(v === 'jambo' && pd2PlanFirst\(c\)\) return 'plan';/);
    assert.match(PD, /function pdLandOnDossier\(on\)\{[^\n]*window\.STK_READ_ONCE \? 'plan' : 'copilot'/);
    assert.match(fnSrc(CT, 'roomHomeLand'), /opts&&opts\.arrived&&typeof window\.pd2PlanFirst==='function'&&window\.pd2PlanFirst\(c\)\)\{[^\n]*pdSetTab\('plan'\)/);
  });
  test('the clean paper stands alone until the read has landed', () => {
    const f = fnSrc(PD, 'pd2NotesPaint');
    assert.match(f, /if \(!red && !walking && pd2ReadOwed\(c\)\)\{ pd2NotesOff\(\); return; \}/);
    const ctx = { window: { STK_READ_ONCE: true, readOnceBusy: () => false, stkOf: () => null }, pd2PlanMay: () => true };
    ctx.window.window = ctx.window; vm.createContext(ctx);
    const line = n => PD.split('\n').find(l => l.startsWith('function ' + n + '('));
    vm.runInContext(['pd2ReadDone', 'pd2ReadBusy', 'pd2ReadOwed'].map(line).join('\n') + '\nthis.owed = pd2ReadOwed;', ctx);
    assert.equal(ctx.owed({ id: 'A', readFirst: true }), true, 'arrived unread: the notes wait');
    assert.equal(ctx.owed({ id: 'A', readFirst: true, triage: { at: 'x' } }), false, 'read: they stand');
    assert.equal(ctx.owed({ id: 'A', readFirst: true, triage: { at: 'x' }, _triaging: true }), true, 'still reading: they wait');
    assert.equal(ctx.owed({ id: 'A' }), false, 'a contract that arrived before this keeps its notes');
  });
  test('the Plan tab: reading face while the read runs, the before face while unread with no plan', () => {
    const f = fnSrc(PD, 'pd2PlanTabHtml');
    assert.match(f, /if \(pd2ReadBusy\(c\)\) return pd2PlanReadingHtml\(c, items\);/);
    assert.match(f, /if \(!items\.length && window\.STK_READ_ONCE && c\.readFirst && !pd2ReadDone\(c\)\) return pd2PlanBeforeHtml\(c\);/);
    const b = fnSrc(PD, 'pd2PlanBeforeHtml');
    for (const k of ['data-pd2-plan-usesug', 'data-pd2-plan-open="sug"', 'data-pd2-plan-read']) assert.ok(b.includes(k), k);
  });
  test('the suggested plan: HaTi\'s usual questions by kind, no AI', () => {
    const ctx = { _pdT: k => k, pd2PlanKind: c => c.kind };
    vm.createContext(ctx);
    const src = PD.slice(PD.indexOf('const PD2_PLAN_USUAL'), PD.indexOf('function pd2PlanSuggest('));
    vm.runInContext(src + '\nthis.u = pd2PlanUsual;', ctx);
    assert.equal(ctx.u({ kind: 'Raw Material Supply' }).k, 'supply');
    assert.equal(ctx.u({ kind: 'Mutual Non-Disclosure Agreement' }).k, 'nda');
    assert.equal(ctx.u({ kind: '', name: 'Office Lease' }).k, 'lease');
    assert.equal(ctx.u({ kind: 'Something else' }).k, 'any');
    assert.equal(ctx.u({ kind: 'Raw Material Supply' }).items.length, 4);
  });
});

describe('f1263 (4) words', () => {
  test('every new word in both books', () => {
    const keys = ['pd2_ro_before_h', 'pd2_ro_before_s', 'pd2_ro_nothing_yet', 'pd2_ro_use', 'pd2_ro_change', 'pd2_ro_sug_from', 'pd2_ro_sug_usual',
      'pd2_ro_reading_h', 'pd2_ro_reading_s', 'pd2_ro_your_plan', 'pd2_ro_waiting', 'pd2_ro_brief', 'pd2_ro_oblig', 'pd2_ro_clauses', 'pd2_ro_risk', 'pd2_ro_playbook']
      .concat(...['nda', 'supply', 'sales', 'employ', 'lease', 'service', 'any'].map(k => ['_w', '_1', '_2', '_3', '_4'].map(s => 'pd2_pu_' + k + s)));
    for (const k of keys) assert.equal((I18N.match(new RegExp('\\n\\s*' + k + ':', 'g')) || []).length, 2, k + ' in both books');
  });
});
