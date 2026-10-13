'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f667 — JAMBO'S AGENTS AND HIS POINTS (Young, 12 Oct 2026: the agents page
   behind Insights, per-agent points in Settings, and "if there is a new agent
   added they should automatically be added to the house and settings")

   (1) ONE LIST OF AGENTS: the page's AG_KEYS, the server's AGENT_POINT_KEYS,
       the points' launch list and starting minutes name the same agents, and
       every agent has its words in both books — so an agent added to the list
       cannot reach the house or Settings half-described.
   (2) THE RECORD IS WALLED: a piece on a contract outside the reader's streams
       is not sent to them, and they cannot say what became of it.
   (3) A SECOND PRESS IS NOT A SECOND SCORE: the same outcome on the same work
       the same day is one piece.
   (4) THE COMPANY'S VALUES are an admin's: validated whole, reset, "save the
       new agents", each change logged with who.
   (5) A PERSON'S OWN VALUES ride their prefs, validated alike, and come off.
   (6) THE RECORD SPEAKS FOR ITSELF: Our promises' reminder is a waiting piece,
       and marking the promise done on the contract makes it "used".
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const H = require('./helpers');
const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const listOf = (src, name) => { const m = new RegExp('const ' + name + "\\s*=\\s*\\[([^\\]]*)\\]").exec(src); assert.ok(m, name + ' is written as a list'); return [...m[1].matchAll(/'([a-z]+)'/g)].map(x => x[1]); };

describe('f667 (1) — one list of agents', () => {
  const AG = listOf(read('js/views/agents.js'), 'AG_KEYS');
  const SRV = listOf(read('server/server.js'), 'AGENT_POINT_KEYS');
  const JH = read('js/views/jambohouse.js');
  const LAUNCH = listOf(JH, 'AG_POINTS_LAUNCH');
  test('the server\'s list and the page\'s list are the same agents', () => {
    assert.deepEqual(SRV.slice().sort(), AG.slice().sort());
  });
  test('the agents the ledger began with are all on the list', () => {
    for (const k of LAUNCH) assert.ok(AG.includes(k), k);
  });
  test('every launch agent has starting minutes', () => {
    const m = /const AG_POINTS_START_MINS = \{([^}]*)\}/.exec(JH); assert.ok(m);
    for (const k of LAUNCH) assert.match(m[1], new RegExp('\\b' + k + ':\\s*\\d+'), k);
  });
  test('every agent has its words in both books', () => {
    const I = require('../js/i18n.js');
    const S = I.STRINGS || I.I18N_STRINGS || (I.I18N_API && I.I18N_API.STRINGS);
    assert.ok(S && S.en && S.sv, 'the dictionary loads');
    const words = k => ['ag_' + k, 'ag_' + k + '_does', 'ag_' + k + '_runs', 'jh_room_' + k, 'jh_unit_' + k, 'jh_act_' + k, 'jh_act1_' + k, 'jh_used_' + k];
    for (const k of AG) for (const w of words(k)) for (const L of ['en', 'sv'])
      assert.ok(typeof S[L][w] === 'string' && S[L][w].trim(), `${L}.${w}`);
  });
  test('the house, the cards and both points tables walk the list (no list of their own)', () => {
    assert.match(JH, /function agPointsKeys\(\)\{\s*const list = \(typeof AG_KEYS/);
    assert.ok((JH.match(/agPointsKeys\(\)/g) || []).length >= 4, 'the house, the band, the tables and the Jobs tab all read it');
  });
});

describe('f667 (2–6) — the record and the points', () => {
  let h, W;
  const day = off => { const t = new Date(); t.setDate(t.getDate() + off); return t.toISOString().slice(0, 10); };
  before(async () => { h = await H.startHati(); W = await H.seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { if (h) await h.stop(); });

  test('(2) a piece on a contract outside the reader\'s streams is not theirs', async () => {
    await W.admin.json('/api/agents/outcome', { method: 'POST', body: { agent: 'paper', contractId: 'MK-A1', outcome: 'used', ref: 'x' } });
    await W.admin.json('/api/agents/outcome', { method: 'POST', body: { agent: 'paper', contractId: 'MK-B1', outcome: 'used', ref: 'y' } });
    const mine = await W.restricted.json('/api/agents/pieces?days=30');
    assert.ok(mine.pieces.some(p => p.cid === 'MK-A1'), 'their stream\'s piece is there');
    assert.ok(!mine.pieces.some(p => p.cid === 'MK-B1'), 'the other stream\'s is not');
    assert.ok(!('MK-B1' in mine.contracts), 'nor its name');
    const r = await W.restricted.raw('/api/agents/outcome', { method: 'POST', body: { agent: 'paper', contractId: 'MK-B1', outcome: 'used' } });
    assert.equal(r.status, 404);
    const all = await W.admin.json('/api/agents/pieces?days=30');
    assert.ok(all.pieces.some(p => p.cid === 'MK-B1'), 'an admin sees both');
  });
  test('(3) the same press twice the same day is one piece', async () => {
    const say = () => W.admin.json('/api/agents/outcome', { method: 'POST', body: { agent: 'approve', contractId: 'MK-A1', outcome: 'used', ref: 'twice' } });
    const a = await say(), b = await say();
    assert.equal(a.id, b.id);
    const all = await W.admin.json('/api/agents/pieces?days=30');
    assert.equal(all.pieces.filter(p => p.agent === 'approve').length, 1);
  });
  test('(4) the company\'s values: an admin\'s, validated, reset, saved, logged', async () => {
    const r1 = await W.admin.json('/api/settings/agent-points', { method: 'PUT', body: { agent: 'paper', mins: 30, used: 100, changed: 50, thrown: 40, cap: 300 } });
    assert.deepEqual(r1.agentPoints.paper, { mins: 30, used: 100, changed: 50, thrown: 40, cap: 300 });
    assert.equal(r1.agentPointsLog.slice(-1)[0].by, 'Amina Otieno');
    const no = await W.restricted.raw('/api/settings/agent-points', { method: 'PUT', body: { agent: 'paper', mins: 1, used: 1, changed: 1, thrown: 1, cap: 1 } });
    assert.equal(no.status, 403, 'not a member\'s to change');
    const bad = await W.admin.raw('/api/settings/agent-points', { method: 'PUT', body: { agent: 'paper', mins: -1, used: 100, changed: 60, thrown: 50, cap: 480 } });
    assert.equal(bad.status, 400);
    const half = await W.admin.raw('/api/settings/agent-points', { method: 'PUT', body: { agent: 'paper', mins: 3.5, used: 100, changed: 60, thrown: 50, cap: 480 } });
    assert.equal(half.status, 400, 'whole numbers only');
    const who = await W.admin.raw('/api/settings/agent-points', { method: 'PUT', body: { agent: 'nobody', mins: 1, used: 1, changed: 1, thrown: 1, cap: 1 } });
    assert.equal(who.status, 404);
    const r2 = await W.admin.json('/api/settings/agent-points', { method: 'PUT', body: { agent: 'paper', reset: true } });
    assert.ok(!r2.agentPoints.paper, 'back to the starting values');
    const r3 = await W.admin.json('/api/settings/agent-points', { method: 'PUT', body: { saveAll: true } });
    assert.ok(Array.isArray(r3.agentPoints._seen) && r3.agentPoints._seen.includes('import'));
    /* a whole-blob settings save from a browser holding an older copy keeps them */
    await W.admin.json('/api/settings/agent-points', { method: 'PUT', body: { agent: 'late', mins: 9, used: 100, changed: 60, thrown: 50, cap: 480 } });
    await W.admin.json('/api/settings', { method: 'PUT', body: { agentPoints: { late: { mins: 1, used: 1, changed: 1, thrown: 1, cap: 1 } } } });
    const r4 = await W.admin.json('/api/settings/agent-points', { method: 'PUT', body: { saveAll: true } });
    assert.equal(r4.agentPoints.late.mins, 9, 'the settings save did not put an older value back');
  });
  test('(5) a person\'s own values ride their prefs and come off', async () => {
    const r1 = await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { agentPoints: { round: { mins: 50, used: 100, changed: 70, thrown: 30, cap: 480 } } } });
    assert.equal(r1.prefs.agentPoints.round.mins, 50);
    const bad = await W.restricted.raw('/api/me/prefs', { method: 'PUT', body: { agentPoints: { round: { mins: 'lots' } } } });
    assert.equal(bad.status, 400);
    const r2 = await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { agentPoints: { round: null } } });
    assert.ok(!r2.prefs.agentPoints, 'one agent off leaves none');
    const st = await W.admin.json('/api/settings/agent-points', { method: 'PUT', body: { saveAll: true } });
    assert.ok(!st.agentPoints.round, 'and the company\'s values never moved');
  });
  test('(5b) the house\'s look is a person\'s own default: one of two, or null', async () => {
    const r1 = await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { agentsLook: 'drawing' } });
    assert.equal(r1.prefs.agentsLook, 'drawing');
    const bad = await W.restricted.raw('/api/me/prefs', { method: 'PUT', body: { agentsLook: 'tower' } });
    assert.equal(bad.status, 400);
    const other = await W.admin.json('/api/bootstrap');
    assert.ok(!(other.me.prefs || {}).agentsLook, 'one person\'s look is not another\'s');
    const r2 = await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { agentsLook: null } });
    assert.ok(!r2.prefs.agentsLook);
  });
  test('(6) Our promises: the reminder waits, and marking the promise done uses it', async () => {
    const boot = await W.admin.json('/api/bootstrap');
    const uid = boot.me.id;
    const full = await W.admin.json('/api/contracts/MK-A1');
    const v = full._v; delete full._v;
    full.owner = { id: uid, name: 'Amina Otieno' };
    full.obligations = [{ id: 'ob-f667', desc: 'Pay the first instalment', due: day(7), party: 'ours', status: 'open' }];
    await W.admin.json('/api/contracts/MK-A1', { method: 'PUT', body: { contract: full, baseVersion: v } });
    await W.admin.json('/api/agents/ours/run', { method: 'POST', body: {} });
    const p1 = (await W.admin.json('/api/agents/pieces?days=30')).pieces.filter(p => p.agent === 'ours');
    assert.equal(p1.length, 1, 'one waiting piece for the promise');
    assert.equal(p1[0].outcome, null, 'it waits on a person');
    await W.admin.json('/api/agents/ours/run', { method: 'POST', body: {} });
    assert.equal((await W.admin.json('/api/agents/pieces?days=30')).pieces.filter(p => p.agent === 'ours').length, 1, 'a second run is not a second piece');
    const again = await W.admin.json('/api/contracts/MK-A1');
    const v2 = again._v; delete again._v;
    again.obligations = again.obligations.map(o => o.id === 'ob-f667' ? { ...o, status: 'done', doneAt: day(0) } : o);
    await W.admin.json('/api/contracts/MK-A1', { method: 'PUT', body: { contract: again, baseVersion: v2 } });
    const p2 = (await W.admin.json('/api/agents/pieces?days=30')).pieces.filter(p => p.agent === 'ours');
    assert.equal(p2[0].outcome, 'used');
  });
});
