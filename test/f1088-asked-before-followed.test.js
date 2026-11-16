'use strict';
/* f1088 — ASKED BEFORE FOLLOWED, AND THE SAME CLAUSE ON TWO PAPERS (owner, 16 Nov 2026: "I press on the
   other colleague's label, they then have to approve on the other side, then the process begins. Build this
   plus the fix you suggested"; picks: the small pop-up, and the one followed can stop it).

   (1) THE SERVER carries the ask on the beat that was already going: whom a reader asks to follow (`want`),
       whom they allowed or said Not now to (`allow`, `deny`), and the clause's heading as their paper shows it
       (`spotName`) — each clamped, so none becomes a notice board — and hands them back on the others' rows.
   (2) THE ASK: a press asks and moves nothing; their Allow starts the follow; Not now, silence past
       PRESENCE_ASK_WAIT_MS, or their leaving ends the ask, said once each; their taking the Allow back stops it.
   (3) THE ONE ASKED: the small pop-up (Allow · Not now) opens for an ask still unanswered; Allow rides the
       beat; their face then carries a ring and its press asks whether to stop it; Stop takes the Allow back.
   (4) THE FIX: before a contract's clause labels are saved, each screen labels its clauses for itself, so the
       leader's label was not on the follower's paper and the page never moved. The beat now says the clause's
       heading too, and the follower finds its own clause by the same words, else the same number.
   AT THE PARENT every test here FAILS: the route drops want/allow/deny/spotName, and presenceAnswers,
   presenceAllow, presenceDeny, presenceStopFollower and presenceLocalSpot do not exist. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const { startHati, seedWorkspace } = require('./helpers');

describe('f1088 (1) the server carries the ask, clamped', () => {
  let h, w;
  const CID = 'MK-A2';
  before(async () => { h = await startHati(); w = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });

  test('want, allow, deny and the heading come back on the others\' rows', async () => {
    const me = w.users.unrestricted.id;
    await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST',
      body: { spot: 'cl_ab12', spotName: '12. Entire <b>Agreement</b>', want: 'u_lead', allow: ['u_x', 'bad id!'], deny: ['u_y'] } });
    const r = await w.admin.json(`/api/contracts/${CID}/here`, { method: 'POST', body: {} });
    const row = r.here.find(x => String(x.id) === String(me));
    assert.ok(row, 'the asker is in the room');
    assert.equal(row.want, 'u_lead');
    assert.deepEqual(row.allow, ['u_x'], 'only id-shaped entries');
    assert.deepEqual(row.deny, ['u_y']);
    assert.equal(row.spotName, '12. Entire  b Agreement /b'.replace(/\s+/g, ' '), 'no markup, one line');
    assert.ok(!('email' in row) && !('role' in row), 'still no address and no role');
  });
  test('nothing sent, nothing kept; a heading without a spot is dropped; asking to follow yourself is dropped', async () => {
    const me = w.users.unrestricted.id;
    await w.unrestricted.json(`/api/contracts/${CID}/here`, { method: 'POST', body: { spotName: 'Lonely heading', want: me } });
    const r = await w.admin.json(`/api/contracts/${CID}/here`, { method: 'POST', body: {} });
    const row = r.here.find(x => String(x.id) === String(me));
    assert.equal(row.spotName, null);
    assert.equal(row.want, null);
    assert.deepEqual(row.allow, []);
    assert.deepEqual(row.deny, []);
  });
});

describe('f1088 (2)-(4) the browser: ask, allow, stop, and the same clause on two papers', () => {
  let W, dom, toasts, calls;
  const ME = { id: 'u_me', name: 'Amina Otieno' };
  const flush = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setImmediate(r)); };
  before(() => {
    dom = new JSDOM(`<!doctype html><body><div id="rl-doc">
      <div data-clause="cl_mine11"><div class="rl-clause-h">11. Assignment</div><p>x</p></div>
      <div data-clause="cl_mine12"><div class="rl-clause-h">12. Entire Agreement</div><p>y</p></div>
      <div data-clause="cl_mine13"><div class="rl-clause-h">13. Governing Law</div><p>z</p></div>
    </div><span data-pz-slot="redlines"></span></body>`);
    global.window = W = dom.window; global.document = dom.window.document;
    toasts = []; calls = [];
    W.API_MODE = () => true;
    W.currentUser = () => ME;
    W.getContract = id => ({ id, _v: 1 });
    W.i18t = global.i18t = (k, v) => k + (v && v.who ? ':' + v.who : '');
    W.toast = (m, k) => toasts.push([m, k]);
    W.rlJumpToClause = id => { calls.push(id); return { id }; };
    W.api = () => Promise.resolve({ here: [] });
    delete require.cache[require.resolve('../js/presence.js')];
    require('../js/presence.js');
  });
  after(() => { try { W.presenceStop(); } catch (_) {} delete global.window; delete global.document; delete global.i18t; });

  test('(2) a press asks and moves nothing; their Allow starts it; the start is said once', () => {
    toasts.length = 0;
    W.presenceFollow('u_lead');
    assert.equal(W.presenceAsking(), 'u_lead');
    assert.equal(W.presenceFollowing(), null, 'nothing follows before they allow it');
    assert.equal(W.presenceBeatBody(null).want, 'u_lead', 'the ask rides the beat');
    W.presenceAnswers([{ id: 'u_lead', name: 'Brian Kamau', spot: 'cl_x' }]);
    assert.equal(W.presenceFollowing(), null, 'no answer yet');
    W.presenceAnswers([{ id: 'u_lead', name: 'Brian Kamau', spot: 'cl_x', allow: ['u_me'] }]);
    assert.equal(W.presenceFollowing(), 'u_lead');
    assert.equal(W.presenceAsking(), null);
    assert.ok(toasts.some(([m]) => /^pz_follow_said/.test(m)), 'said once when it starts');
  });
  test('(2) their taking the Allow back stops it, said once; the same press stops it from this side', () => {
    toasts.length = 0;
    W.presenceAnswers([{ id: 'u_lead', name: 'Brian Kamau', spot: 'cl_x', deny: ['u_me'] }]);
    assert.equal(W.presenceFollowing(), null);
    assert.deepEqual(toasts.map(t => t[0]), ['pz_follow_ended:Brian Kamau']);
  });
  test('(2) Not now, their leaving, and silence each end the ask, said once', () => {
    toasts.length = 0;
    W.presenceFollow('u_lead');
    W.presenceAnswers([{ id: 'u_lead', name: 'Brian Kamau', deny: ['u_me'] }]);
    assert.equal(W.presenceAsking(), null);
    W.presenceFollow('u_lead');
    W.presenceAnswers([]);
    assert.equal(W.presenceAsking(), null);
    W.presenceFollow('u_lead');
    const real = Date.now; Date.now = () => real() + W.PRESENCE_ASK_WAIT_MS + 1000;
    try { W.presenceAnswers([{ id: 'u_lead', name: 'Brian Kamau' }]); } finally { Date.now = real; }
    assert.equal(W.presenceAsking(), null);
    assert.equal(toasts.filter(t => /^pz_ask_(no|gone|lapsed)/.test(t[0])).length, 3);
  });
  test('(2) pressed again while waiting, the ask is taken back', () => {
    W.presenceFollow('u_lead');
    W.presenceFollow('u_lead');
    assert.equal(W.presenceAsking(), null);
    assert.equal(W.presenceBeatBody(null).want, undefined);
  });
  test('(3) the one asked: the pop-up opens; Allow rides the beat; Stop takes it back', () => {
    const asker = { id: 'u_f', name: 'Grace Wanjiru', want: 'u_me' };
    W.presenceAnswers([asker]);
    const pop = document.getElementById('pz-ask');
    assert.ok(pop, 'the small pop-up');
    assert.ok(pop.querySelector('[data-pz-allow="u_f"]') && pop.querySelector('[data-pz-deny="u_f"]'), 'Allow · Not now');
    assert.equal(pop.querySelectorAll('.ui-btn-primary').length, 1, 'one black button');
    pop.querySelector('[data-pz-allow="u_f"]').click();
    assert.equal(document.getElementById('pz-ask'), null, 'answered, it closes');
    assert.deepEqual(W.presenceAllowed(), ['u_f']);
    assert.deepEqual(W.presenceBeatBody(null).allow, ['u_f'], 'the Allow rides the beat');
    W.presenceAnswers([asker]);
    assert.equal(document.getElementById('pz-ask'), null, 'an ask already answered asks nothing again');
    W.presenceStopFollower('u_f');
    assert.deepEqual(W.presenceAllowed(), []);
    assert.deepEqual(W.presenceBeatBody(null).deny, ['u_f'], 'taken back: their screen stops');
    W.presenceAnswers([{ id: 'u_f', name: 'Grace Wanjiru' }]);
    assert.equal(W.presenceBeatBody(null).deny, undefined, 'once they stop asking, the Not now is dropped');
  });
  test('(3) Esc answers Not now', () => {
    W.presenceAnswers([{ id: 'u_g', name: 'Peter Mwangi', want: 'u_me' }]);
    assert.ok(document.getElementById('pz-ask'));
    document.dispatchEvent(new W.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(document.getElementById('pz-ask'), null);
    assert.deepEqual(W.presenceBeatBody(null).deny, ['u_g']);
  });
  test('(4) a label not on this paper: found by the same heading, else the same number', () => {
    assert.equal(W.presenceLocalSpot('cl_mine12', '12. Entire Agreement'), 'cl_mine12', 'on this paper: kept');
    assert.equal(W.presenceLocalSpot('cl_theirs', '12. Entire Agreement'), 'cl_mine12', 'by the words');
    assert.equal(W.presenceLocalSpot('cl_theirs', '13. Governing law (as amended)'), 'cl_mine13', 'by the number');
    assert.equal(W.presenceLocalSpot('cl_theirs', ''), 'cl_theirs', 'nothing to go by: as sent');
    assert.equal(W.presenceSpotHeading('cl_mine11'), '11. Assignment', 'and this paper says its own heading');
  });
  test('(4) the walk goes to this paper\'s own clause', async () => {
    calls.length = 0;
    W.presenceFollow('u_lead');
    W.presenceAnswers([{ id: 'u_lead', name: 'Brian Kamau', allow: ['u_me'] }]);
    W.presenceWalk([{ id: 'u_lead', name: 'Brian Kamau', spot: 'cl_their12', spotName: '12. Entire Agreement', allow: ['u_me'] }]);
    await flush();
    assert.deepEqual(calls, ['cl_mine12']);
  });
});
