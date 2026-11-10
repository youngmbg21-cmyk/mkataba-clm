/* f997 — THE DOORS' NUMBERS ARE COUNTED ONCE A TURN
   (10 Nov 2026, off the owner's "why is the app slow" review.)

   WHAT WAS WRONG. Every number beside a page name — Parties, Requests,
   Obligations, Approvals, Jambo's work, Notes, Calendar, Import, Templates —
   is its own reading of the WHOLE book, and updateSidebarCounts asks for all
   of them. It is called from forty-seven places: every page move and after
   most acts. So a turn that repainted twice walked the book eighteen times,
   on every page, whether or not that page had anything to do with contracts.
   navCounts had already learnt this for three of the figures (its own note
   records 1,132 walks for one paint of Home, brought down to 3).

   WHAT THIS PINS, and the second is the one that matters most:
   1 · asked twice in one turn, the book is walked ONCE
   2 · asked again after the turn, it is walked AGAIN — the memo is cleared on
       a microtask, so it can never outlive the state it counted. A door whose
       number disagrees with the list behind it is the fault this codebase
       refuses hardest, and a cache is the usual way to cause it.
   3 · the figures are the same ones, unchanged
   4 · a counter that asks for the counts WHILE they are being counted gets an
       answer instead of recursing (the trap navCounts recorded falling into)
   5 · updateSidebarCounts reads them through this one door, so a tenth figure
       added later cannot quietly go back to counting on every call

   js/app.js is not loaded by the jsdom harness (test/world.js evaluates the
   modules app.js imports, not app.js), and browser checks run on GitHub, so
   the region is sliced out and run on its own with counted stand-ins. The
   slice is pinned by its own markers, which is what makes it a test of the
   code rather than a copy of it: edit the region and this file follows.

   RED AT THE PARENT: there is no doorCounts there at all, so the slice is not
   found and every check fails.

   Run: node --test --test-reporter=dot test/f997-the-doors-count-once-a-turn.test.js */
'use strict';
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'), 'utf8');

/* the region, by its own first and last line */
function slice() {
  const from = SRC.indexOf('let _doorCounts = null');
  assert.ok(from > 0, 'the doors-count-once region is in js/app.js');
  const end = SRC.indexOf('\n}\n', SRC.indexOf('function doorCounts(', from));
  assert.ok(end > from, 'and it closes');
  return SRC.slice(from, end + 3);
}

/* one sandbox, with a counter behind every figure the region reads */
function sandbox(extra) {
  const calls = {};
  const bump = k => { calls[k] = (calls[k] || 0) + 1; };
  const ctx = {
    calls,
    cuDoorCount: () => { bump('customers'); return 4; },
    requestsDoorCount: () => { bump('intake'); return 7; },
    intakeCount: () => 0,
    obligationsDoorCount: () => { bump('obligations'); return 11; },
    approvalsDoorCount: () => { bump('approvals'); return 34; },
    agentsDoorCount: () => { bump('agents'); return 2; },
    mineNotesDue: () => { bump('mynotes'); return [1, 2, 3]; },
    TEMPLATES: { a: 1, b: 2 },
    Promise, setTimeout, console,
  };
  ctx.window = {
    calendarDoorCount: () => { bump('calendar'); return 5; },
    customTemplates: () => { bump('templates'); return [{}]; },
    tplLibCount: () => 0,
  };
  /* the region reads these two off window, bare */
  ctx.calendarDoorCount = ctx.window.calendarDoorCount;
  ctx.customTemplates = ctx.window.customTemplates;
  ctx.tplLibCount = ctx.window.tplLibCount;
  Object.assign(ctx, extra || {});
  vm.createContext(ctx);
  vm.runInContext(slice(), ctx);
  return ctx;
}
const NC = { pipeline: 1, migration: 2, negotiations: 3 };

describe('f997 — the doors are counted once a turn', () => {
  test('1 · asked twice in one turn, the book is walked once', () => {
    const ctx = sandbox();
    const a = ctx.doorCounts(NC);
    const b = ctx.doorCounts(NC);
    assert.equal(ctx.calls.approvals, 1, 'Approvals counted its rows once, not twice');
    assert.equal(ctx.calls.obligations, 1, 'and so did Obligations');
    assert.equal(ctx.calls.customers, 1);
    assert.equal(a, b, 'both callers got the same reading');
  });

  test('2 · after the turn it counts again — the memo never outlives its turn', async () => {
    const ctx = sandbox();
    ctx.doorCounts(NC);
    assert.equal(ctx.calls.approvals, 1);
    await Promise.resolve();      // the microtask the region clears on
    await Promise.resolve();
    ctx.doorCounts(NC);
    assert.equal(ctx.calls.approvals, 2, 'the next turn is counted afresh, so a door can never show yesterday');
  });

  test('3 · the figures themselves are unchanged', () => {
    const ctx = sandbox();
    const c = ctx.doorCounts(NC);
    assert.equal(c.customers, 4);
    assert.equal(c.intake, 7);
    assert.equal(c.obligations, 11);
    assert.equal(c.approvals, 34);
    assert.equal(c.agents, 2);
    assert.equal(c.mynotes, 3, 'the notes due are a length, as before');
    assert.equal(c.calendar, 5);
    assert.equal(c.pipeline, 1, 'the three navCounts figures ride through untouched');
    assert.equal(c.migration, 2);
    assert.equal(c.negotiations, 3);
    assert.equal(c.templates, 3, 'two built in, one of the company\'s own');
  });

  test('4 · a counter that asks for the counts mid-count is answered, not recursed', () => {
    let inner = null, depth = 0;
    const ctx = sandbox();
    ctx.approvalsDoorCount = () => {
      depth++;
      assert.ok(depth < 5, 'it must not recurse');
      inner = ctx.doorCounts(NC);
      return 34;
    };
    const c = ctx.doorCounts(NC);
    assert.ok(inner, 'the inner caller got an answer');
    assert.equal(inner.approvals, 0, 'zeros while the count is still running, never a second walk');
    assert.equal(c.approvals, 34, 'and the outer caller still stored the real figure');
  });

  test('5 · updateSidebarCounts reads them through this one door', () => {
    const fn = SRC.slice(SRC.indexOf('function updateSidebarCounts()'));
    const body = fn.slice(0, fn.indexOf('\n}\n'));
    const noComments = body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.match(noComments, /const counts = doorCounts\(nc\)/, 'it asks the one door');
    for (const name of ['cuDoorCount', 'obligationsDoorCount', 'approvalsDoorCount', 'agentsDoorCount', 'mineNotesDue']) {
      assert.ok(!noComments.includes(name + '('), name + ' is counted inside doorCounts, never again here');
    }
  });
});
