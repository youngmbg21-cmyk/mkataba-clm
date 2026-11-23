'use strict';
/* f1195 — PLAN THE READ (the Dossier L+S, step 2; owner, 23 Nov 2026: "adding a plan should be a pop up where you add a
   summary of what you would like to get out of the contract in the read then jambo can then break that down to a plan";
   "the read should change to apply"; plans "Offer it again").

   (1) THE SERVER: POST /api/ai/readplan turns the reader's words into at most READ_PLAN_MAX plain lines (a press, editor,
       nothing written); the read (POST /api/ai/breakdown) takes `plan`, asks each line to be answered by a point carrying
       its number (`plan`), keeps only numbers in range, and hands the plan back.
   (2) THE PAGE: c.readPlan is written only by Apply; the read carries it (bdRun → plan); a line is Found by the read's own
       point, Not in the contract where that point is missing, Nothing found where none came back; a plan changed after
       the read is unread (Read again) — never guessed.
   (3) THE TAB stands while a plan stands or nothing is read yet, between Dossier and Clauses; the card's foot offers
       Plan the read before the read.
   (4) The brain names the route and the door; the words stand in both books. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const SRV = R('server/server.js'), PD = R('js/paperdesk.js'), BD = R('js/views/breakdown.js');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };

describe('f1195 (1) the server', () => {
  test('readPlanClean keeps plain lines, at most READ_PLAN_MAX', () => {
    const ctx = {}; vm.createContext(ctx);
    vm.runInContext('const READ_PLAN_MAX = 8;\n' + fnSrc(SRV, 'readPlanClean') + '\nthis.f = readPlanClean;', ctx);
    assert.equal(JSON.stringify(ctx.f(['  a  b ', '', null, 'c'])), JSON.stringify(['a b', 'c']));
    assert.equal(ctx.f(Array.from({ length: 12 }, (_, i) => 'x' + i)).length, 8);
    assert.equal(ctx.f('not a list').length, 0);
  });
  test('the plan route: a press by an editor, the fast model, nothing written', () => {
    const i = SRV.indexOf("app.post('/api/ai/readplan', auth, editor, rlAiLight"); assert.ok(i >= 0, 'the route stands behind auth and editor');
    const body = SRV.slice(i, SRV.indexOf('\n});', i));
    assert.match(body, /anthropicMessages\(key, 'fast'/);
    assert.doesNotMatch(body, /db\.prepare|UPDATE contracts|INSERT/);
    assert.match(body, /readPlanClean\(block && block\.input && block\.input\.items\)/);
  });
  test('the read takes the plan, keeps a point\'s plan number only in range, and hands the plan back', () => {
    const i = SRV.indexOf("app.post('/api/ai/breakdown',"); const body = SRV.slice(i, SRV.indexOf('\n});', i));
    assert.match(body, /const plan = readPlanClean\(req\.body && req\.body\.plan\)/);
    assert.match(body, /plan: \{ type: 'number'/);
    assert.match(body, /Math\.round\(Number\(p\.plan\)\) >= 1 && Math\.round\(Number\(p\.plan\)\) <= plan\.length \? \{ plan:/);
    assert.match(body, /lang: readLangOf\(req\), plan,/);
  });
});

describe('f1195 (2) the page', () => {
  function ctx(b){
    const c = { _pdE: s => String(s), stkOf: () => b, window: {} };
    c.window = c; vm.createContext(c);
    vm.runInContext('const PD2_PLAN_MAX = 8;\n' + fnSrc(PD, 'pd2PlanItems') + fnSrc(PD, 'pd2PlanAnswers'), c);
    return c;
  }
  const plan = ['Leave early?', 'Rent rise?', 'Repairs?'];
  test('found, not in the contract, nothing found — each from the read\'s own point', () => {
    const b = { plan, points: [{ plan: 2, title: 'Rent only goes up', quote: 'rises' }, { plan: 1, missing: true, title: 'No break clause' }] };
    const A = ctx(b).pd2PlanAnswers({ readPlan: { items: plan } });
    assert.equal(A.read, true); assert.equal(A.same, true);
    assert.deepEqual(A.items.map(x => x.state), ['missing', 'found', 'none']);
  });
  test('a plan changed after the read is unread, never answered by the old read', () => {
    const b = { plan: ['Leave early?'], points: [{ plan: 1, title: 'x' }] };
    const A = ctx(b).pd2PlanAnswers({ readPlan: { items: plan } });
    assert.equal(A.same, false); assert.ok(A.items.every(x => x.state === 'unread'));
  });
  test('nothing read: the lines stand alone', () => {
    const A = ctx(null).pd2PlanAnswers({ readPlan: { items: plan } });
    assert.equal(A.read, false); assert.equal(A.items.length, 3);
  });
  test('only Apply writes the plan; the read carries it', () => {
    assert.equal((PD.match(/\.readPlan = /g) || []).length, 0, 'the desk never writes the plan');
    assert.equal((BD.match(/c\.readPlan = \{/g) || []).length, 1, 'one writer');
    assert.match(strip(fnSrc(PD, 'pd2PlanApply')), /window\.readPlanSet\(c, \{ ask: P\.ask, items: P\.items\.slice\(\)/);
    assert.match(strip(fnSrc(BD, 'bdRun')), /api\('ai\/breakdown', 'POST', plan\.length \? \{ text, plan \} : \{ text \}/);
    assert.match(strip(fnSrc(BD, 'bdRun')), /plan: Array\.isArray\(r\.plan\) \? r\.plan : \[\]/);
  });
  test('the pop-up is the one Legora sheet, and offers a kept plan without applying it', () => {
    const O = strip(fnSrc(PD, 'pd2PlanOpen')); assert.match(O, /lgpOpen\(/); assert.match(O, /offer: items\.length \? null : pd2PlanOffer\(c\)/);
    assert.match(PD, /\[data-pd2-plan-reuse\]'\)\)\{ e\.preventDefault\(\); const P = _pd2Plan; if \(!P\.offer\) return; P\.items = P\.offer\.items\.slice\(\);/);
  });
});

describe('f1195 (3) the tab and the card', () => {
  test('Plan stands between Dossier and Clauses while a plan stands or nothing is read', () => {
    assert.match(strip(fnSrc(PD, 'pd2TabsShownFor')), /\['copilot', 'plan'\]\.concat\(PD_TABS_SHOWN\.filter/);
    const on = strip(fnSrc(PD, 'pd2PlanTabOn'));
    assert.match(on, /if \(pd2PlanItems\(c\)\.length\) return true;/);
    assert.match(on, /return !read && pd2PlanMay\(c\);/);
    assert.match(PD, /const PD_TABS = \['copilot', 'plan', 'doc', 'oblig', 'form'\];/);
    assert.match(PD, /pd2TabsShownFor\(pdContract\(\)\)/);
  });
  test('the card offers Plan the read before the read', () => {
    assert.match(strip(fnSrc(PD, 'pd2CardHtml')), /planHere \? `<button type="button" class="ui-link" data-pd2-plan-open>/);
  });
});

describe('f1195 (4) the brain and the words', () => {
  test('the route and the door are on the brain', () => {
    const B = R('js/brainmap.js');
    assert.match(B, /\['readplan', 'POST \/api\/ai\/readplan', 'ai', 2\]/);
    assert.match(B, /\['planread', 'pd2PlanOpen', 'see', 0\]/);
  });
  test('the words stand in both books', () => {
    const I = R('js/i18n.js');
    for (const k of ['pd_tab_plan', 'pd2_plan_open', 'pd2_plan_break', 'pd2_plan_apply', 'pd2_plan_found', 'pd2_plan_missing', 'pd2_plan_nothing', 'pd2_plan_read', 'pd2_plan_read_again', 'pd2_plan_noplan', 'pd2_plan_use', 'pd2_plan_h_one', 'pd2_plan_h_other'])
      assert.equal((I.match(new RegExp('^    ' + k + ': ', 'gm')) || []).length, 2, k + ' in both books');
  });
});
