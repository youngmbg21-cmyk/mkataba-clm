'use strict';
/* f1106 — A CONTRACT NEVER CHECKED AGAINST THE PLAYBOOK IS CHECKED THE FIRST TIME SOMEONE OPENS IT (owner picked "B",
   19 Nov 2026, after the score ring: "why couldn't it just have an automatic check … then I do not have to press
   anything"). New contracts were already checked on arrival and when an agreed change moved the wording; this reaches
   the ones that road never did (older contracts, bulk imports, an unticked upload).

   (1) THE WALLS: never a contract already checked, a private stream, their page, a viewer, with no AI key, or while the
       arrival reading runs.
   (2) ONCE: one check per contract per sitting; its answer stored as the Check press stores it (c.playbook, the audit
       line, persist); a check that lands after one was kept by another door does not overwrite it.
   (3) SAID WHERE THE READER LOOKS: while it runs the Dossier's Playbook fact says so; a refusal is said there with
       Check as its way forward (pbOpenCheckState → pd2Facts), both books.
   (4) THE THREE DOORS: the computer's (pdOpenOnHome), the room's (openWorkspace) and the phone's row press call it. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const PB = R('js/playbook.js');

function world(over = {}){
  const i = PB.indexOf('const _pbOpenTried'), j = PB.indexOf('\nfunction deviationSummary(');
  const k = PB.indexOf('\n/* ---- workspace playbook review panel', j);
  assert.ok(i > 0 && j > i && k > j, 'the region exists');
  const contracts = {};
  const calls = { review: 0, audit: 0, persist: 0, paint: 0 };
  const ctx = {
    window: { PORTAL_MODE: false }, state: { aiConfigured: true, activeId: null },
    API_MODE: () => true, canEdit: () => true, jamboOnPress: () => false,
    getContract: id => contracts[id] || null,
    i18t: k2 => k2, setTimeout: fn => fn(),
    logAudit: () => { calls.audit++; }, persist: () => { calls.persist++; },
    pbReviewComplete: () => true,
    runPlaybookReview: async () => { calls.review++; return over.answer || { label: 'Ours', verdicts: [{ status: 'aligned' }, { status: 'missing' }] }; },
    ...over.ctx,
  };
  ctx.window.pdContract = () => null; ctx.window.mS = () => null;
  vm.createContext(ctx);
  vm.runInContext(PB.slice(i, k) + '\nthis.pbCheckOnOpen = pbCheckOnOpen; this.pbOpenCheckMay = pbOpenCheckMay; this.pbOpenCheckState = pbOpenCheckState;', ctx);
  return { ctx, contracts, calls };
}

describe('f1106 (1) the walls', () => {
  test('a contract already checked, a viewer, a private stream, their page, no key, a reading running: never', () => {
    const cases = [
      [{ playbook: { verdicts: [] } }, {}],
      [{}, { canEdit: () => false }],
      [{}, { jamboOnPress: () => true }],
      [{}, { state: { aiConfigured: false } }],
      [{}, { API_MODE: () => false }],
      [{ _triaging: true }, {}],
    ];
    for (const [extra, ctx] of cases){
      const W = world({ ctx });
      W.contracts.A = { id: 'A', ...extra };
      assert.equal(W.ctx.pbCheckOnOpen('A'), null, JSON.stringify(extra) + ' ' + Object.keys(ctx).join());
      assert.equal(W.calls.review, 0);
    }
    const W = world(); W.ctx.window.PORTAL_MODE = true; W.contracts.A = { id: 'A' };
    assert.equal(W.ctx.pbCheckOnOpen('A'), null, 'their page');
  });
});

describe('f1106 (2) once, stored as the Check press stores it', () => {
  test('the first open checks and keeps it; the second open in the sitting does nothing', async () => {
    const W = world(); W.contracts.A = { id: 'A' };
    await W.ctx.pbCheckOnOpen('A');
    assert.equal(W.calls.review, 1);
    assert.equal(W.contracts.A.playbook.label, 'Ours');
    assert.equal(W.calls.audit, 1); assert.equal(W.calls.persist, 1);
    delete W.contracts.A.playbook;
    assert.equal(W.ctx.pbCheckOnOpen('A'), null, 'once a sitting');
    assert.equal(W.calls.review, 1);
  });
  test('a check kept meanwhile by another door is not overwritten', async () => {
    const W = world(); W.contracts.A = { id: 'A' };
    const p = W.ctx.pbCheckOnOpen('A');
    W.contracts.A.playbook = { label: 'kept by the press', verdicts: [] };
    await p;
    assert.equal(W.contracts.A.playbook.label, 'kept by the press');
    assert.equal(W.calls.persist, 0);
  });
});

describe('f1106 (3) said where the reader looks', () => {
  test('running, then a refusal with its reason', async () => {
    const W = world({ answer: { error: 'No readable clause text' } }); W.contracts.A = { id: 'A' };
    const p = W.ctx.pbCheckOnOpen('A');
    assert.ok(W.ctx.pbOpenCheckState(W.contracts.A).run, 'running');
    await p;
    assert.equal(W.ctx.pbOpenCheckState(W.contracts.A).why, 'No readable clause text');
    assert.equal(W.contracts.A.playbook, undefined, 'a refusal is never stored as a check');
  });
  test('the Dossier fact draws both states, with Check as the way forward', () => {
    const P = R('js/paperdesk.js'); const i = P.indexOf('function pd2Facts('); const F = P.slice(i, P.indexOf('\nfunction ', i + 10));
    assert.match(F, /pbOpenCheckState/);
    assert.match(F, /pd2_std_checking/);
    assert.match(F, /pd2_std_failed[^\n]*\$\{chk\}/);
    const I = R('js/i18n.js');
    for (const k of ['pd2_std_checking', 'pd2_std_failed', 'brn_p_pbopen', 'brn_pd_pbopen'])
      assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
  });
});

describe('f1106 (4) the three doors', () => {
  test('the computer, the room and the phone call it', () => {
    const P = R('js/paperdesk.js'); const i = P.indexOf('function pdOpenOnHome('); assert.match(P.slice(i, i + 900), /pbCheckOnOpen\(id\)/);
    assert.match(R('js/app.js'), /function openWorkspace\(id, opts\)\{[^\n]*pbCheckOnOpen\(id\)/);
    assert.match(R('js/mobile-screens.js'), /data-m-open'\);\n\s*state\.activeId = id; state\.selId = id;\n[^\n]*\n\s*if\(window\.pbCheckOnOpen\)/);
    assert.match(PB, /Object\.assign\(window,\{pbOpenCheckMay,pbOpenCheckState,pbCheckOnOpen,/);
  });
});

/* (5) OPEN SAYS WHAT THE CHECK FOUND, NOT WHAT IS DRAWN (owner-reported 19 Nov 2026, a screenshot: the ring said "1 of 6
   met · 2 missing · 3 differ" and Open said "Every position is met on this wording"). The notes beside the paper had been
   put away (Show notes), Open found no note and fell back to the green line. */
describe('f1106 (5) Open never says every position is met when the check says otherwise', () => {
  const P = R('js/paperdesk.js'); const i = P.indexOf('function pd2StdGo('); const F = P.slice(i, P.indexOf('\nfunction ', i + 10)).replace(/\/\*[\s\S]*?\*\//g, '');
  test('the put-away notes are brought back when something is off', () => {
    assert.match(F, /deviationSummary\(live\)/);
    assert.match(F, /if \(off && pd2NotesHiddenGet\(\)\) pd2NotesHiddenSet\(false\);\s*try \{ pd2NotesPaint\(live\)/);
  });
  test('the green line only when nothing is off; otherwise a warning that counts them', () => {
    assert.match(F, /if \(!off\) toast\(_pdT\('pd2_std_all_met'\), 'ok'\);/);
    assert.match(F, /else toast\(_pdTn\('pd2_std_not_shown', off, \{ n: off \}\), 'warn'\);/);
    assert.doesNotMatch(F, /if \(has\(live\) && typeof toast === 'function'\) toast\(_pdT\('pd2_std_all_met'\)/);
    const I = R('js/i18n.js');
    for (const k of ['pd2_std_not_shown_one', 'pd2_std_not_shown_other'])
      assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
  });
});
