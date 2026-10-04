/* ============================================================
   f461 — THE REQUESTS PAGE, THE BELL AND THE DRAFTING SCREEN READ THE NEW
   STATES (4 Oct 2026, the process review's Requests stream)
   ============================================================
   The browser half of f460: the shared lane rule answers the same on this
   page as on the server; "drafted, not yet sent" is its own pile and its own
   sentence; the bell names a request nobody holds to a reader who may draft;
   the form asks the essentials Create asks; Draft it opens the drafting
   screen with the request's answers and claims the contract it makes; and
   "nothing fits" arrives with a title as well as the sentence. */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world.js');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');
const IK = read('js/views/intake.js');
const APP = read('js/app.js');
const EN_SV = read('js/i18n.js');

function ikWorld(opts){
  const w = buildWorld({ intakeView: true, ...(opts || {}) });
  const win = w.win;
  win.state = Object.assign(win.state || {}, { contracts: [], settings: (win.state && win.state.settings) || {} });
  win.currentUser = () => ({ id: 'u1', name: 'Young Mbagaya', role: 'admin' });
  win.canEdit = () => true;
  return { w, win };
}
const REQ = o => Object.assign({ id: 'REQ-1', title: 'NDA', need: 'x', counterparty: '', folder: '', status: 'open',
  by: { id: 'u9', name: 'Faith Njeri' }, createdAt: new Date().toISOString() }, o || {});

describe('f461 (1) one lane rule, both hosts', () => {
  test('1a the page asks the shared reading, and it answers as the server does', () => {
    const { win } = ikWorld();
    assert.equal(typeof win.intakeLaneMatch, 'function', 'js/intakelanes.js is on the page');
    win.state.settings.intakeLanes = [{ on: true, name: 'NDA', template: 'ND', words: 'nda', knownOnly: false }];
    assert.equal(win.intakeLaneFor(REQ({ need: 'a routine nda' })).name, 'NDA');
    assert.equal(win.intakeLaneFor(REQ({ need: 'their own NDA arrived' })), null, 'their paper is never routine');
    assert.equal(win.intakeLaneFor(REQ({ need: 'nda', status: 'drafted' })), null, 'a drafted request is not cleared again');
  });
  test('1b a ceiling clears a stated value under it, and refuses one over it', () => {
    const { win } = ikWorld();
    win.state.settings.intakeLanes = [{ on: true, name: 'Small', template: 'PS', maxValue: 1000000, knownOnly: false }];
    assert.ok(win.intakeLaneFor(REQ({ answers: { value: '500000' } })));
    assert.equal(win.intakeLaneFor(REQ({ answers: { value: '5000000' } })), null);
    assert.equal(win.intakeLaneFor(REQ({ need: 'about KES 17.8M' })), null, 'money only in the words is still refused');
  });
  test('1c no browser runs a lane any more', () => {
    assert.ok(!/intakeRunLanes|createFromTemplate\(/.test(strip(IK)));
    assert.ok(/setInterval\(intakeRefresh/.test(IK), 'the page keeps only the beat that re-reads the queue');
  });
});

describe('f461 (2) drafted, not yet sent', () => {
  test('2a its own label, its own pile, and the clock keeps running', () => {
    const { win } = ikWorld();
    assert.ok(win.INTAKE_STATUS.drafted, 'a status of its own');
    const r = REQ({ status: 'drafted', contractId: 'MK-301' });
    assert.equal(win.intakeStage(r), 'drafted');
    assert.equal(win.intakeStoppedAt(r), null, 'not finished until it is sent');
    assert.ok(!win.IK_LIVE.includes('drafted'), 'nothing left to pick up');
  });
  test('2b the panel says which contract and that it has not gone', () => {
    const { win } = ikWorld();
    const say = win.ikStatusSay(REQ({ status: 'drafted', contractId: 'MK-301' }), false);
    assert.match(say.html, /MK-301/);
    assert.match(say.html, /not yet sent/);
  });
  test('2c its door opens the contract, on both chairs', () => {
    const { win } = ikWorld();
    const team = win.ikActs(REQ({ status: 'drafted', contractId: 'MK-301' }), false).acts.map(a => a.k);
    const asker = win.ikActs(REQ({ status: 'drafted', contractId: 'MK-301', by: { id: 'u1' } }), true).acts.map(a => a.k);
    assert.ok(team.includes('open') && asker.includes('open'));
  });
  test('2d contractLeavesDrafting tells the page, which writes nothing', () => {
    const { win } = ikWorld();
    win._intakeState.list = [REQ({ id: 'REQ-7', status: 'drafted', contractId: 'MK-301' })];
    assert.equal(win.intakeContractSent({ id: 'MK-301' }), true);
    assert.equal(win._intakeState.list[0].status, 'done');
    assert.equal(win.intakeContractSent({ id: 'MK-999' }), false, 'a contract no request drafted is nobody\'s business here');
    const core = read('js/core.js');
    const fn = core.slice(core.indexOf('function contractLeavesDrafting('), core.indexOf('async function reshareToLastRecipient'));
    assert.match(fn, /intakeContractSent\(c\)/, 'hooked on the ONE act that takes a contract out of Draft');
  });
});

describe('f461 (3) the bell names a request nobody holds, to somebody who may draft', () => {
  test('3a who it is for', () => {
    const { win } = ikWorld();
    win._intakeState.list = [
      REQ({ id: 'A', createdAt: '2026-10-02T09:00:00Z' }),
      REQ({ id: 'B', assignee: { id: 'u2', name: 'Amina' } }),
      REQ({ id: 'C', by: { id: 'u1', name: 'Young' } }),
      REQ({ id: 'D', status: 'drafted', contractId: 'MK-1' }),
      REQ({ id: 'E', createdAt: '2026-10-01T09:00:00Z' }),
    ];
    assert.deepEqual(Array.from(win.intakeAlertRows()).map(r => r.id), ['E', 'A'], 'open, unheld, a colleague\'s, oldest first');
    win.canEdit = () => false;
    assert.equal(win.intakeAlertRows().length, 0, 'nobody who may not draft');
  });
  test('3b a registered kind, ranked under approvals, and every row is a door', () => {
    const kinds = APP.slice(APP.indexOf('const ALERT_KINDS = ['), APP.indexOf('const alertRank'));
    const order = [...kinds.matchAll(/\{ k:'([a-z-]+)'/g)].map(m => m[1]);
    assert.equal(order.indexOf('request'), order.indexOf('approval') + 1);
    const body = APP.slice(APP.indexOf('function buildAlerts'), APP.indexOf('function alertCount'));
    assert.match(body, /push\('request',null,i18t\('al_request'/);
    assert.match(body, /intakeGoTo\(r\.id\)/, 'the press lands on that request');
  });
  test('3c the words exist in both books', () => {
    for (const k of ['al_request', 'al_request_by', 'ik_st_drafted', 'ik_g_drafted', 'ik_s_drafted_unsent',
      'ik_f_essentials', 'ik_bad_email', 'ik_bad_term', 'mail_ik_new_subject', 'mail_ik_new_lead',
      'mail_ik_new_need', 'mail_ik_new_where'])
      assert.equal((EN_SV.match(new RegExp('\\n    ' + k + ':', 'g')) || []).length, 2, k);
  });
});

describe('f461 (4) the form asks what Create asks, and Draft it opens the drafting screen', () => {
  test('4a the essentials, all optional, the request\'s own columns kept', () => {
    const { win } = ikWorld({ templateFields: true });
    const keys = Array.from(win.intakeFormFields()).map(f => f.key);
    for (const k of ['party', 'counterparty', 'cpemail', 'value', 'side', 'effDate', 'expiry', 'folder'])
      assert.ok(keys.includes(k), k);
    assert.equal(win.ikFieldId('counterparty'), 'ik-cp');
    assert.equal(win.ikFieldId('folder'), 'ik-folder');
    const form = IK.slice(IK.indexOf('function openIntakeForm'), IK.indexOf('function openIntakeTracker'));
    assert.match(form, /answers \}\);/, 'what they gave rides the request');
    assert.match(form, /if\(!g\('ik-title'\)\|\|!g\('ik-need'\)\)/, 'only the title and the need are required');
  });
  test('4b Draft it opens openNewAgreement with the request\'s answers and the suggestion lit', () => {
    const fn = IK.slice(IK.indexOf('async function intakeDraft('), IK.indexOf('function intakeContractSent('));
    assert.match(fn, /openNewAgreement\(\{ pick:/);
    assert.match(fn, /intakePrefillOf\(r\)/);
    assert.match(fn, /intakeHoldDraft\(r\.id\)/, 'the request is held for the contract the screen makes');
  });
  test('4c the contract the screen makes is claimed, once, and the request becomes drafted', async () => {
    const { w, win } = ikWorld();
    win._intakeState.list = [REQ({ id: 'REQ-9', title: 'NDA for the trial' })];
    win.intakeHoldDraft('REQ-9');
    const c = { id: 'MK-777', audit: [] };
    await win.intakeClaimDraft(c);
    assert.equal(c.intakeRequestId, 'REQ-9');
    const patch = w.log.api.find(x => x.pathname === 'intake/REQ-9' && x.method === 'PATCH');
    assert.ok(patch, 'the request is told');
    assert.equal(patch.body.status, 'drafted');
    assert.equal(patch.body.contractId, 'MK-777');
    const c2 = { id: 'MK-778', audit: [] };
    assert.equal(await win.intakeClaimDraft(c2), false, 'a hold is spent once');
    assert.equal(c2.intakeRequestId, undefined);
    const tri = read('js/triage.js');
    assert.match(tri.slice(tri.indexOf('function contractArrived('), tri.indexOf('function contractArrived(') + 2000),
      /intakeClaimDraft\(c\)/, 'claimed where every creation site registers');
  });
  test('4d the request\'s answers become the drafting screen\'s prefill', () => {
    const { win } = ikWorld();
    const p = win.intakePrefillOf(REQ({ counterparty: 'Tetra Ltd', folder: 'proc',
      answers: { cpemail: 'a@b.co', value: '100', side: 'supplier', effDate: '2026-11-01' } }));
    assert.deepEqual(JSON.parse(JSON.stringify(p)), { cpemail: 'a@b.co', value: '100', side: 'supplier',
      effDate: '2026-11-01', counterparty: 'Tetra Ltd', folder: 'proc' });
    const wz = read('js/wizard.js');
    assert.match(wz, /wzEmailHtml\(prefill&&prefill\.cpemail\)/, 'their email reaches the built-in form too');
  });
});

describe('f461 (5) "nothing fits" arrives with a title as well as the sentence', () => {
  test('5a a title cut from the sentence', () => {
    const { win } = ikWorld();
    assert.equal(win.intakeTitleFrom('A two-year NDA with Juno.'), 'A two-year NDA with Juno');
    const long = 'We need a supply agreement for refrigerated trucks covering the coast route and the lake route for two years';
    const t = win.intakeTitleFrom(long);
    assert.ok(t.length <= 81 && t.endsWith('…'), t);
    assert.equal(win.intakeTitleFrom(''), '');
  });
  test('5b the door passes it', () => {
    assert.match(read('js/draft.js'), /openIntakeForm\(\{ need:String\(sentence\|\|''\), title:\(typeof intakeTitleFrom==='function'\)\?intakeTitleFrom\(sentence\):'' \}\)/);
  });
});
