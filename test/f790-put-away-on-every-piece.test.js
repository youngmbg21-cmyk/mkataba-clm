'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f790 — PUT AWAY ON EVERY PIECE (round 23's gaps, 18 Oct 2026: the owner's
   "build all the gaps" over the picked "Open in place", whose every prepared
   piece carries Look · its act · Put away; the word stays "Put away")
   (1) Every piece of Jambo's work can be put away — the acts list (agActsOf)
       ends with Put away on every kind, their round's answer and a request
       included, and for a reader who may not edit too.
   (2) TWO KEEPERS, ONE PRESS: a desk row (a notice, a renewal, a chase) is put
       away on the contract by an editor through the desk's one writer; any
       other piece, and any piece for a reader who may not edit, for this
       person only (agentAwaySet, their prefs). The reading drops it while it
       is still about the same thing (agAwaySubject) and brings it back when it
       is about something new. It never touches the work it is about.
   (3) Undo for a few seconds: the desk's undo goes through the same writer
       (one persist in the whole desk), and the house's log is told "thrown"
       only once Undo has passed.
   (4) The server is the wall: PUT /api/me/prefs keeps a person's put-away
       pieces in their prefs only — a key that is not a piece, a malformed
       entry or too many at once are refused, null takes one back out, and the
       newest AGENT_AWAY_MAX are kept.
   AT THE PARENT (8dc306a) every test here FAILS but 4c, the control (the
   parent ignores the key it does not know, so null "removes" nothing there).
   The browser half: test/chromium/counter-as-drawn-verify.js (4, 5).
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
const AG = R('js/views/agents.js');
const DESK = R('js/desknight.js');
const RUNS = R('js/agentruns.js');
const SRV = R('server/server.js');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
const fnBody = (src, name) => { const i = src.search(new RegExp('(async )?function ' + name + '\\(')); if (i < 0) return ''; return src.slice(i, src.indexOf('\n}', i) + 2); };
const J = a => Array.from(a || []).join(',');
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);

function staged(opts){
  const { buildWorld, supplyContract } = require('./world');
  const { win } = buildWorld({ negotiationView: true, copilotRead: true, desk: true, agents: true, ...(opts || {}) });
  const late = supplyContract({ id: 'MK-PA-1', counterparty: 'Kettle & Co', status: 'Signed', counterpartyEmail: 'ops@kettle.example',
    obligations: [{ id: 'ob1', desc: 'the insurance certificate', due: day(-5), party: 'theirs' }] });
  const bare = supplyContract({ id: 'MK-PA-2', counterparty: 'Nordvik Logistik',
    changes: [{ id: 'CHG-9', status: 'pending', authorSide: 'counterparty', clauseId: 'cl_x', clauseLabel: '3. Payment',
      summary: '“30” → “60”', newText: 'Payment within sixty (60) days.', createdAt: iso(-3) }] });
  const paper = supplyContract({ id: 'MK-PA-3', counterparty: 'Baltic Freight',
    triage: { at: iso(-1), by: 'Wanjiru Kamau', steps: { playbook: { ok: true, dev: 1, miss: 0, cats: ['Notice period'] }, oblig: { ok: true, found: [{ desc: 'x' }] } } } });
  const imp = ['A', 'B'].map(x => supplyContract({ id: 'MK-PA-I' + x, counterparty: 'Imported ' + x,
    migration: { batch: 'B-9', importedAt: iso(-1), importedBy: 'Wanjiru Kamau', needsReview: true, blocked: null } }));
  win.state.contracts = [late, bare, paper, ...imp];
  return { win, late, bare, paper };
}
/* agentsData is one reading per turn (dropped on a microtask): a fresh read after a change waits a turn */
const ready = win => { const D = win.agentsData(); return win.AG_KEYS.flatMap(k => D.agents[k].ready); };
const turn = () => new Promise(r => setImmediate(r));

describe('f790 (1) every piece can be put away', () => {
  test('1a Put away ends the acts of every kind the house prepares', () => {
    const { win } = staged();
    const its = ready(win);
    assert.ok(['answer', 'chase', 'read', 'import'].every(k => its.some(i => i.kind === k)), 'the stage: ' + J(its.map(i => i.kind)));
    for (const it of its){
      const acts = win.agActsOf(it).map(a => a.act);
      assert.equal(acts[acts.length - 1], 'away', it.kind + ' ends with Put away: ' + acts.join(','));
      assert.equal(acts.filter(a => a === 'away').length, 1, it.kind + ' carries it once');
    }
  });
  test('1b and for a reader who may not edit (it is then theirs alone)', () => {
    const { win } = staged({ canEdit: false });
    for (const it of ready(win)) assert.ok(win.agActsOf(it).some(a => a.act === 'away'), it.kind);
  });
  test('1c the panel draws it as the ladder\'s text button, as the desk rows always did', () => {
    const { win } = staged();
    const ans = ready(win).find(i => i.kind === 'answer');
    assert.match(win.agPanelActs(ans), /<button type="button" class="ui-link" data-ag-act="away">Put away<\/button>$/);
  });
});

describe('f790 (2) two keepers, one press', () => {
  test('2a a piece put away by this person leaves their list while it is about the same thing', async () => {
    const { win } = staged();
    const ans = ready(win).find(i => i.kind === 'answer');
    const me = win.currentUser();
    me.prefs = { agentAway: { [ans.key]: { on: win.agAwaySubject(ans), at: iso(0) } } };
    await turn();
    assert.ok(!ready(win).some(i => i.key === ans.key), 'gone from their list');
    me.prefs = { agentAway: { [ans.key]: { on: 'answer|something else', at: iso(0) } } };
    await turn();
    assert.ok(ready(win).some(i => i.key === ans.key), 'a piece about something new comes back');
  });
  test('2b a new ask of theirs is something new', async () => {
    const { win, bare } = staged();
    const ans = ready(win).find(i => i.cid === 'MK-PA-2');
    const was = win.agAwaySubject(ans);
    bare.changes.push({ id: 'CHG-10', status: 'pending', authorSide: 'counterparty', clauseId: 'cl_y', clauseLabel: '4. Term', newText: 'x', createdAt: iso(-1) });
    await turn();
    const now = win.agAwaySubject(ready(win).find(i => i.cid === 'MK-PA-2'));
    assert.notEqual(now, was);
  });
  test('2c the desk keeps its own rows on the contract, for an editor; the rest are the person\'s', () => {
    const put = strip(fnBody(AG, 'agPutAway'));
    assert.match(put, /const desk = agAwayOnDesk\(it\) && !!c;/);
    assert.match(put, /if \(desk\)\{ if \(!deskDismiss\(c, it\.deskKey\)\) return false; \}/);
    assert.match(put, /await agentAwaySet\(it\.key, agAwaySubject\(it\)\)/);
    assert.match(strip(fnBody(AG, 'agAwayOnDesk')), /it\.deskKey && it\.c && typeof deskDismiss === 'function' && !\(typeof canEdit === 'function' && !canEdit\(\)\)/);
    assert.match(strip(fnBody(AG, 'agRunAct')), /if \(act === 'away'\) return agPutAway\(it, said\);/);
  });
  test('2d putting a piece away never touches the work it is about', () => {
    const { win, bare } = staged();
    const before = JSON.stringify(bare);
    const ans = ready(win).find(i => i.cid === 'MK-PA-2');
    win.currentUser().prefs = { agentAway: { [ans.key]: { on: win.agAwaySubject(ans), at: iso(0) } } };
    ready(win);
    assert.equal(JSON.stringify(bare), before, 'the contract is byte-identical');
    assert.equal(win.negoNeedsYouIds(bare).length, 1, 'their ask still waits on you');
  });
  test('2e the person\'s writer is the agents\' one door to the server', () => {
    const w = strip(fnBody(RUNS, 'agentAwaySet'));
    assert.match(w, /api\('me\/prefs', 'PUT', \{ agentAway: \{ \[key\]: on != null \? \{ on: String\(on\) \} : null \} \}\)/);
    assert.ok(!/api\(|fetch\(/.test(strip(AG)), 'the agents page still never talks to the server itself');
  });
});

describe('f790 (3) Undo, and the trail after it', () => {
  test('3a the desk\'s undo is its one writer\'s, and the desk still writes in one place', () => {
    const d = strip(DESK);
    assert.equal((d.match(/persist\(/g) || []).length, 1, 'one persist in the whole desk');
    assert.match(strip(fnBody(DESK, 'deskDismiss')), /if\(undo\) delete c\.desk\[key\];/);
    assert.match(strip(fnBody(AG, 'agPutAway')), /if \(desk\) deskDismiss\(c, it\.deskKey, \{ undo: true \}\);/);
    assert.match(strip(fnBody(AG, 'agPutAway')), /agentAwaySet\(it\.key, null\)/);
  });
  test('3b the house is told "thrown" only once Undo has passed', () => {
    const put = strip(fnBody(AG, 'agPutAway'));
    assert.match(put, /setTimeout\(\(\) => \{ if \(!undone && typeof said === 'function'\) said\('thrown'\); \}, AG_AWAY_UNDO_MS\)/);
    assert.match(put, /undone = true; clearTimeout\(t\);/);
    assert.match(put, /toast\(_agT\(desk \? 'ag_put_away' : 'ag_put_away_mine'\), 'ok', \{ action: \{ label: _agT\('act_undo'\), onClick: undo \} \}\)/);
  });
  test('3c the desk\'s undo takes back only a stamp still in force', async () => {
    const { win, late } = staged();
    const it = ready(win).find(i => i.kind === 'chase');
    assert.equal(win.deskDismiss(late, it.deskKey, { undo: true }), false, 'nothing to take back yet');
    assert.equal(win.deskDismiss(late, it.deskKey), true);
    await turn();
    assert.ok(!ready(win).some(i => i.key === it.key));
    assert.equal(win.deskDismiss(late, it.deskKey, { undo: true }), true);
    await turn();
    assert.ok(ready(win).some(i => i.key === it.key), 'back');
  });
});

describe('f790 (4) the server is the wall', () => {
  const H = require('./helpers');
  let h, W;
  before(async () => { h = await H.startHati(); W = await H.seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  const put = (c, body) => c.json('/api/me/prefs', { method: 'PUT', body }).then(r => ({ ok: true, r }), e => ({ ok: false, status: e.status }));
  test('4a a person\'s piece is kept in their own prefs, with the server\'s day', async () => {
    const out = await put(W.admin, { agentAway: { 'answer:MK-A2': { on: 'answer|x' } } });
    assert.ok(out.ok);
    assert.equal(out.r.prefs.agentAway['answer:MK-A2'].on, 'answer|x');
    assert.match(out.r.prefs.agentAway['answer:MK-A2'].at, /^\d{4}-\d{2}-\d{2}T/);
    const theirs = await W.unrestricted.json('/api/bootstrap');
    assert.ok(!((theirs.me && theirs.me.prefs) || {}).agentAway, 'a colleague\'s prefs are untouched');
  });
  test('4b refused: a key that is not a piece, an entry with no subject, too many at once', async () => {
    assert.equal((await put(W.admin, { agentAway: { 'not a key': { on: 'x' } } })).status, 400);
    assert.equal((await put(W.admin, { agentAway: { 'answer:MK-A2': { at: 'x' } } })).status, 400);
    assert.equal((await put(W.admin, { agentAway: 'answer' })).status, 400);
    const many = Object.fromEntries(Array.from({ length: 21 }, (_, i) => ['read:MK-' + i, { on: 'r' }]));
    assert.equal((await put(W.admin, { agentAway: many })).status, 400);
  });
  test('4c null takes one back out (Undo)', async () => {
    const out = await put(W.admin, { agentAway: { 'answer:MK-A2': null } });
    assert.ok(out.ok);
    assert.ok(!(out.r.prefs.agentAway || {})['answer:MK-A2']);
  });
  test('4d the newest AGENT_AWAY_MAX are kept — a cap, said in the code', () => {
    const route = SRV.slice(SRV.indexOf("app.put('/api/me/prefs'"), SRV.indexOf('const AGENTS_LOOKS'));
    assert.match(route, /\.sort\(\(a, b\) => String\(b\[1\]\.at \|\| ''\)\.localeCompare\(String\(a\[1\]\.at \|\| ''\)\)\)\.slice\(0, AGENT_AWAY_MAX\)/);
    assert.match(SRV, /^const AGENT_AWAY_MAX = 300;$/m);
  });
});
