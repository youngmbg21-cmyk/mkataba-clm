'use strict';
/* f1196 — THE CLAUSES TAB, THE LEGORA + STRIPE WAY (the Dossier L+S, step 3; owner, 23 Nov 2026).

   (1) ONE CLAUSE AT A TIME: one scroll gesture over Home's clause list steps to the next shown clause (or back), the
       paper gliding with it (docThreadGoTo); ‹ k of n › do the same; a clause taller than the list is read first.
   (2) THE FOUR KINDS (owner's pick "Use the drawing's four"): plan · Playbook · needs you · worth a look, one colour each,
       the same beside the paper, in What was found and in the list.
   (3) THE CONTROLS COME BACK (owner's pick "Comes back"): pinned on the way up by transform only, a pill while away.
   (4) APPROVED ONCE FOR THE WHOLE TEMPLATE (owner's pick "Yes, once per template"): one key — template, version,
       category, the position's own words — read by both hosts; a new version or a changed position lapses it; an
       upload never qualifies; one writer, for who decides on the Playbook, with a reason, on the trail. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
const CT = R('js/views/contract.js'), PD = R('js/paperdesk.js'), SRV = R('server/server.js'), H = R('index.html');
const fnSrc = (src, name) => { const i = src.indexOf('function ' + name + '('); assert.ok(i >= 0, name + ' exists'); const j = src.indexOf('\n}', i); return src.slice(i, j + 2); };
const SG = require('../js/signgate.js');

describe('f1196 (1) one clause at a time', () => {
  test('a step goes to the next shown clause, never past the ends', () => {
    const went = [];
    const ctx = { thLiveContract: () => ({ id: 'X' }), docThreadVisible: rows => rows.map((r, i) => r ? i : -1).filter(i => i >= 0), docThreadGoTo: (c, i) => went.push(i) };
    vm.createContext(ctx);
    vm.runInContext('let _docThreadOn = 2; let _docThreadCache = { rows: [1, 0, 1, 1, 0, 1] };\n' + fnSrc(CT, 'docThreadStep') + '\nthis.step = docThreadStep; this.set = n => { _docThreadOn = n; };', ctx);
    assert.equal(ctx.step(1), true); assert.deepEqual(went, [3]);
    ctx.set(3); ctx.step(1); assert.deepEqual(went, [3, 5], 'a hidden row is skipped');
    ctx.set(5); assert.equal(ctx.step(1), false, 'the last clause goes nowhere');
    ctx.set(0); assert.equal(ctx.step(-1), false, 'nor the first');
  });
  test('one gesture, one step; a tall clause is read first; arrows and count drawn', () => {
    const W = strip(CT.slice(CT.indexOf("document.addEventListener('wheel'"), CT.indexOf('}, { passive: false });')));
    assert.match(W, /closest\('#pd-thread \.doc-th-rows'\)/); assert.match(W, /list\.scrollHeight > list\.clientHeight \+ 4/);
    assert.match(W, /if \(_thStepLocked\) return;/);
    assert.match(W, /open\.offsetHeight > list\.clientHeight - 8/);
    assert.match(W, /docThreadStep\(d\)/);
    assert.match(strip(fnSrc(CT, 'docThreadNavSync')), /data-th-nav-step="-1"[\s\S]*th_step_of[\s\S]*data-th-nav-step="1"/);
  });
});

describe('f1196 (2) the four kinds', () => {
  const ctx = {}; vm.createContext(ctx); vm.runInContext(fnSrc(PD, 'pd2PointKind') + '\nthis.k = pd2PointKind;', ctx);
  test('plan first, then the Playbook, then what it asks of the reader', () => {
    assert.equal(ctx.k({ plan: 2, by: 'std', status: 'need' }), 'plan');
    assert.equal(ctx.k({ by: 'std', status: 'need' }), 'pb');
    assert.equal(ctx.k({ by: 'jambo', bys: ['jambo', 'std'], status: 'look' }), 'pb');
    assert.equal(ctx.k({ by: 'jambo', status: 'need' }), 'need');
    assert.equal(ctx.k({ by: 'jambo', status: 'look' }), 'look');
  });
  test('one colour each, the same in the three places', () => {
    for (const [k, tok] of [['need', '--st-ruby-dot'], ['look', '--st-amber-dot'], ['pb', '--st-steel-dot']]){
      assert.match(H, new RegExp(`\\.pd2-mg-i\\.k-${k} \\.pd2-mn-dot\\{background:var\\(${tok}\\)\\}`));
      assert.match(H, new RegExp(`\\.pd2-fd-bar i\\.is-${k},[^{]*\\{background:var\\(${tok}\\)\\}`));
    }
    assert.match(H, /\.pd2-mg-i\.k-plan \.pd2-mn-dot\{background:var\(--color-text\)\}/);
    assert.match(H, /\.doc-th-row\.stk-b-need \.doc-th-bead,[^{]*\{background:var\(--st-ruby-dot\)\}/);
  });
});

describe('f1196 (3) the controls come back', () => {
  test('pinned by transform only, a pill while away, nothing written', () => {
    const A = strip(fnSrc(PD, 'pd2CtlApply'));
    assert.match(A, /el\.style\.transform = pin \? `translateY\(\$\{st\}px\)` : ''/);
    assert.match(A, /pd2CtlPill\(!pin && st > PD2_CTL_TOP/);
    const arm = strip(fnSrc(PD, 'pd2CtlArm'));
    assert.match(arm, /else if \(d < -2\) _pd2Ctl\.pinned = true; else if \(d > 2\) _pd2Ctl\.pinned = false;/);
    assert.doesNotMatch(arm + A, /persist\(|api\(/);
    assert.match(H, /@keyframes pd2CtlFade\{from\{opacity:0\}to\{opacity:1\}\}/);
  });
});

describe('f1196 (4) approved once for the whole template', () => {
  const v = { category: 'Liability', position: 'Capped at six months of rent', status: 'deviation', escalate: true };
  const c = { template: 'LEASE', templateVersion: '3', playbook: { verdicts: [v] } };
  test('the key: template, version, category and the position\'s words; an upload never', () => {
    const k = SG.sgTplKey(c, v); assert.ok(k.startsWith('LEASE|3|liability|'));
    assert.equal(SG.sgTplKey({ ...c, source: 'upload' }, v), '');
    assert.equal(SG.sgTplKey({ ...c, template: '' }, v), '');
  });
  test('it settles the departure on both hosts\' reading; a new version or a changed position lapses it', () => {
    const list = [{ key: SG.sgTplKey(c, v), by: 'Amina' }];
    assert.equal(SG.sgDepartures(c, { gate: 'advise' }).length, 1);
    assert.equal(SG.sgDepartures(c, { gate: 'advise', tplApprovals: list }).length, 0);
    assert.equal(SG.sgDepartures({ ...c, templateVersion: '4' }, { gate: 'advise', tplApprovals: list }).length, 1, 'new version asks again');
    const moved = { ...v, position: 'Capped at three months of rent' };
    assert.equal(SG.sgDepartures({ ...c, playbook: { verdicts: [moved] } }, { gate: 'advise', tplApprovals: list }).length, 1, 'changed position asks again');
  });
  test('the server: the wall reads it; one writer, for who decides, with a reason, on the trail', () => {
    assert.match(SRV, /sgDepartures\(c, \{ gate, isAdmin: scIsAdminId, tplApprovals: getSetting\('tplApprovals'\) \|\| \[\] \}\)/);
    const i = SRV.indexOf("app.post('/api/templates/departure-approvals', auth, editor"); assert.ok(i >= 0);
    const body = SRV.slice(i, SRV.indexOf('\n});', i));
    assert.match(body, /if \(!stdDecides\(req\.user\)\) return res\.status\(403\)/);
    assert.match(body, /if \(!undo && !why\) return res\.status\(400\)/);
    assert.match(body, /setSetting\('tplApprovals', list\)/);
    assert.match(body, /approved for every contract from/);
    assert.equal((SRV.match(/setSetting\('tplApprovals'/g) || []).length, 1, 'one writer');
    assert.match(SRV, /tplApprovals: getSetting\('tplApprovals'\) \|\| \[\],/);
  });
  test('the browser: its own check settles by the same key; the door only for who decides, on our template', () => {
    assert.match(R('js/signcheck.js'), /sgTplApproval\(c, v, state\.tplApprovals\)/);
    assert.match(R('js/api.js'), /state\.tplApprovals=Array\.isArray\(b\.tplApprovals\)\?b\.tplApprovals:\[\]/);
    const A = R('js/views/approvalsview.js');
    assert.match(A, /const tplMay=may&&typeof window\.sgTplKey==='function'&&!!window\.sgTplKey\(c, r\.v\)&&typeof window\.mayDecideStandards==='function'/);
    assert.match(R('js/views/ladder.js'), /api\('templates\/departure-approvals', 'POST', \{ contractId: c\.id, index: i, reason: why \}\)/);
  });
});
