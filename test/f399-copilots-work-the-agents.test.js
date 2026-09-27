'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f399 — COPILOT'S WORK: THE AGENTS (Young ruled 27 Sep 2026: "Build the
   agents idea", over the "Work Board Options" artifact, option 2)

   Five named jobs HaTi already does, each with what is ready for a person to
   look at: their round came back, renewals, new paper, late promises, archive
   import. The page is a READING over the product's own readings — the
   negotiation's needs-you list and the redline co-pilot's plan, the overnight
   desk, auto-triage, the renewal decision, the import record — and every act
   on it is one those readings' own homes already press.

   The claims below are walls first (no route, no store, no spend, no second
   door onto a decision, no initialiser), then the registration a new page owes
   every list a view must be on, then the readings driven on a real stage.
   AT THE PARENT (231b9fc) every claim FAILS: the file, the door and the
   readings do not exist there. The walls in section 1 are written so they
   cannot pass vacuously — each first asserts the page it reads is there.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const R = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const VIEW = R('js/views/agents.js');
const APP = R('js/app.js');
const CORE = R('js/core.js');
const AI = R('js/ai.js');
const HTML = R('index.html');
const I18N = R('js/i18n.js');
/* Code, not prose: a wall that read the comments would be satisfied by the
   sentence that explains why a name is NOT called. */
const CODE = VIEW.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');

describe('f399 (1) — the walls', () => {
  test('1a the page exists and is published', () => {
    assert.ok(VIEW.length > 1000, 'js/views/agents.js is on the floor');
    const pub = (VIEW.match(/Object\.assign\(window, \{([\s\S]*?)\}\);\s*$/) || [])[1] || '';
    for (const name of ['renderAgentsPage', 'agentsDoorCount', 'agentsData', 'agPaintHead'])
      assert.match(pub, new RegExp('\\b' + name + '\\b'), name + ' is published for the shell');
  });
  test('1b it is a reading: no route, no store, no spend', () => {
    assert.ok(CODE.length > 1000);
    for (const bad of ['api(', 'fetch(', '/api/', 'persist(', 'localStorage', 'lsSet(', 'sessionStorage', 'anthropic', 'copilotAsk('])
      assert.ok(!CODE.includes(bad), bad + ' — the page reads what the product already holds and spends nothing');
  });
  test('1c it decides nothing on a negotiation — that act has one door, the negotiation page', () => {
    assert.ok(CODE.length > 1000);
    for (const bad of ['negoResolve(', 'negoFileChange(', 'negoEditClause(', 'negoInsertClause(', 'negoDeleteClause(',
      'negoFileProposal(', 'changes.push', 'negoAdvanceRound(', 'approveContract(', 'signDocument('])
      assert.ok(!CODE.includes(bad), bad + ' is called from the page');
  });
  test('1d READING MUST NOT WRITE — no initialiser, no queue created by being looked at', () => {
    assert.ok(CODE.length > 1000);
    for (const bad of ['negoInit(', 'negoChanges(', 'negoAllChanges(', 'negoRound(', 'negoClauseList(', 'negoPending(', 'migState('])
      assert.ok(!CODE.includes(bad), bad + ' — a page that initialised a negotiation by being looked at would stamp the whole book');
    assert.match(CODE, /if \(!c \|\| !c\.negotiation \|\| typeof c\.negotiation !== 'object'/,
      'the not-sent count (whose reading passes through the initialiser) is asked only where a negotiation already exists');
    assert.match(CODE, /state\.mig\)/, 'the running import is read raw off state.mig');
  });
  test('1e every count is BORROWED from the reading that owns it', () => {
    assert.match(CODE, /negoNeedsYouIds\(c\)/, 'the rail\'s own Negotiations reading');
    assert.match(CODE, /redlinePlan\(c\)/, 'the redline co-pilot\'s answer per ask');
    assert.match(CODE, /deskItems\(cs\)/, 'the overnight desk — all of it, not deskShown\'s one of each');
    assert.ok(!/deskShown\(/.test(CODE), 'this page is the door onto the REST of the desk');
    assert.match(CODE, /triageCards\(cs\)/, 'the arrival strip\'s own population');
    assert.match(CODE, /triageBusy\(c\)/, 'a reading still running is in flight, not ready');
    assert.match(CODE, /renewalDecisionOf\(c\)/, 'the renewal card\'s own "is this decided"');
    assert.match(CODE, /rlUnsentCount\(c, \{ side: 'owner' \}\)/, 'the "Send all · N not sent" number');
  });
  test('1f every act is the product\'s own function, pressed from here', () => {
    for (const act of ['openRedlineWorkbench(', 'openNoticeDialog(', 'obligationChase(', 'deskDismiss(', 'triageAck(',
      'openCheckPanel(', 'roomGoTab(', 'openWorkspace('])
      assert.ok(CODE.includes(act), act + ' — the act\'s own home is what the panel presses');
    assert.ok(!/confirmDialog\(/.test(CODE), 'the chase asks for itself — obligationChase carries its own question');
  });
});

describe('f399 (2) — registered everywhere a view must be', () => {
  test('2a the rail door, the import, the branch, the title, the label, the restore list, Copilot\'s page name', () => {
    assert.match(HTML, /<button data-view="agents" class="nav-item"[^>]*data-i18n-title="nav_agents_title">/);
    assert.match(HTML, /data-i18n="nav_agents">Copilot&rsquo;s work<\/span><span class="nav-count" data-count="agents">/);
    assert.match(APP, /import '\.\/views\/agents\.js';/);
    assert.match(APP, /else if\(view==='agents'\) renderAgentsPage\(\);/);
    assert.match(APP, /case 'agents':\s*return \[i18t\('nav_agents'\), ''\];/);
    assert.match(APP, /agents:"Copilot's work"/, 'VIEW_LABEL names it');
    assert.match(CORE, /'redline','agents'\]\.includes\(state\.view\)/, 'a refresh lands back on it');
    assert.match(AI, /agents: "Copilot's work"/, 'Copilot knows the page');
  });
  test('2b the header facts are painted by the page\'s own painter', () => {
    assert.match(APP, /const PAGE_HEAD_PAINT = \{[^}]*agents:'agPaintHead'[^}]*\}/);
    assert.match(VIEW, /\nfunction agPaintHead\(\)\{/);
  });
  test('2c THE NUMBER ON THE DOOR IS THE NUMBER ON THE PAGE: both are agentsData().ready', () => {
    assert.match(APP, /agents: \(typeof agentsDoorCount==='function'\)\?agentsDoorCount\(\):0,/);
    assert.match(APP, /approvals:'amber',agents:'amber'\}/, 'amber: it is work waiting on a person');
    assert.match(VIEW, /function agentsDoorCount\(\)\{\s*try \{ return agentsData\(\)\.ready; \}/);
    assert.match(VIEW, /D\.ready \? _agTn\('ag_head_ready', D\.ready/, 'and the head prints the same D.ready');
  });
  test('2d the door sits in the Work group, directly after Home (Young, 27 Sep 2026: "move it to be after the home page")', () => {
    const work = HTML.slice(HTML.indexOf('data-section="work"'), HTML.indexOf('data-section="library"'));
    assert.ok(work.includes('data-view="agents"'), 'Copilot\'s work is a Work door');
    const doors = [...work.matchAll(/data-view="([a-z]+)" class="nav-item/g)].map(m => m[1]);
    assert.equal(doors[doors.indexOf('dashboard') + 1], 'agents', doors.join(' · '));
  });
  test('2e and Insights sits below Calendar ("then move insights to below calendar")', () => {
    const work = HTML.slice(HTML.indexOf('data-section="work"'), HTML.indexOf('data-section="library"'));
    const doors = [...work.matchAll(/data-view="([a-z]+)" class="nav-item/g)].map(m => m[1]);
    assert.equal(doors[doors.indexOf('calendar') + 1], 'intel', doors.join(' · '));
  });
});

describe('f399 (3) — both books carry every word the page prints', () => {
  test('3a every literal ag_ key is in English and in Swedish', () => {
    const keys = [...new Set((VIEW.match(/'ag_[a-z_]+'/g) || []).map(s => s.slice(1, -1)))]
      .filter(k => !/_$/.test(k));
    assert.ok(keys.length > 60, 'the page names its words');
    const en = I18N.slice(0, I18N.indexOf("ag_round: 'Deras runda kom tillbaka'"));
    const sv = I18N.slice(I18N.indexOf("ag_round: 'Deras runda kom tillbaka'"));
    const has = (book, k) => new RegExp('\\n\\s*' + k + '(_one|_other)?\\s*:').test(book);
    const missing = keys.filter(k => !has(en, k) || !has(sv, k));
    assert.deepEqual(missing, [], 'a key missing from one book leaves a screen half in the other language');
  });
  test('3b every agent has its name, what it does, when it runs, who reviews, who pays and its idle line', () => {
    for (const k of ['round', 'renew', 'paper', 'late', 'import'])
      for (const s of ['', '_does', '_runs', '_who', '_pays', '_idle'])
        assert.match(I18N, new RegExp('\\n\\s*ag_' + k + s + ':'), 'ag_' + k + s);
  });
});

/* ---- THE READINGS, ON A REAL STAGE ----
   A list born inside the stage carries that realm's Array.prototype, so two
   identical lists fail deepStrictEqual across the boundary — they are
   compared as joined strings (the performance audit's own note). */
const J = a => Array.from(a || []).join(',');
function world(){
  const { buildWorld, supplyContract } = require('./world');
  const { win } = buildWorld({ negotiationView: true, copilotRead: true, desk: true, agents: true });
  return { win, supplyContract };
}
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);
async function staged(){
  const { win, supplyContract } = world();
  const c = supplyContract();
  win.state.contracts = [c];
  win.negoInit(c);
  await win.negoFileProposal(c, win.negoBaseText(c).replace('thirty (30) days', 'sixty (60) days'),
    { side: 'counterparty', author: 'Amina Wanjiru' });
  /* A contract carrying their ask and NO negotiation object — the shape the
     light list delivers — so the page reading it can be caught writing. */
  const bare = supplyContract({ id: 'MK-SUP-2', counterparty: 'Nordic Grain AB',
    changes: [{ id: 'CHG-9', status: 'pending', authorSide: 'counterparty', clauseId: 'cl_x', clauseLabel: '3. Payment',
      summary: '“30” → “90”', newText: 'Payment within ninety (90) days.', createdAt: iso(-3) }] });
  /* A late promise of theirs, and one we already chased last week. */
  const late = supplyContract({ id: 'MK-SUP-3', counterparty: 'Kabras Sugar', status: 'Signed', counterpartyEmail: 'ops@kabras.example',
    obligations: [{ id: 'ob1', desc: 'Deliver the Q3 stock report', due: day(-6), party: 'theirs' },
                  { id: 'ob2', desc: 'Send the insurance certificate', due: day(-20), party: 'theirs', chasedAt: day(-2), chasedBy: 'Young Mbagaya' }] });
  /* Paper HaTi read and nobody acknowledged; and one read and already seen. */
  const paper = supplyContract({ id: 'MK-SUP-4', counterparty: 'PwC Kenya',
    triage: { at: iso(-2), by: 'Young Mbagaya', steps: { playbook: { ok: true, dev: 2, miss: 1, cats: ['Payment'] }, oblig: { ok: true, found: [{ desc: 'x' }] } } } });
  const seen = supplyContract({ id: 'MK-SUP-5', counterparty: 'SAP East Africa',
    triage: { at: iso(-4), by: 'Young Mbagaya', seenAt: iso(-1), steps: { playbook: { ok: true, dev: 0, miss: 0 } } } });
  /* An import batch with two to check and one that could not be read, and a
     batch everybody has already checked. */
  const imp = ['A', 'B', 'C'].map((x, i) => supplyContract({ id: 'MK-IMP-' + x, counterparty: 'Imported ' + x,
    migration: { batch: 'B-7', importedAt: iso(-1), importedBy: 'Young Mbagaya', needsReview: i < 2, blocked: i === 0 ? 'no-text' : null } }));
  const done = ['D', 'E'].map(x => supplyContract({ id: 'MK-IMP-' + x, counterparty: 'Imported ' + x,
    migration: { batch: 'B-6', importedAt: iso(-3), importedBy: 'Young Mbagaya', needsReview: false, blocked: null } }));
  win.state.contracts.push(bare, late, paper, seen, ...imp, ...done);
  return { win, c, bare, late, paper, seen };
}

describe('f399 (4) — the readings', () => {
  test('4a their round is ready, with the co-pilot\'s answer per ask and how long it has waited', async () => {
    const { win } = await staged();
    const r = win.agentsData().agents.round.ready;
    assert.equal(J(r.map(x => x.cid).sort()), 'MK-SUP-1,MK-SUP-2');
    const sup = r.find(x => x.cid === 'MK-SUP-1');
    assert.equal(sup.n, 1, 'one ask of theirs waits');
    assert.equal(sup.plan.length, 1, 'and redlinePlan answered it');
    const total = Object.values(sup.tally).reduce((a, b) => a + b, 0);
    assert.equal(total, 1, 'the tally counts exactly the asks that wait');
    assert.equal(r[0].cid, 'MK-SUP-2', 'the ask that has waited longest leads');
    assert.equal(r[0].days, 3);
  });
  test('4b READING MUST NOT WRITE: the page leaves a contract with no negotiation byte-identical', async () => {
    const { win, bare } = await staged();
    const before = JSON.stringify(bare);
    win.agentsData(); win.agentsDoorCount();
    assert.equal(JSON.stringify(bare), before);
    assert.equal(bare.negotiation, undefined, 'no negotiation was created by looking');
  });
  test('4c a late promise is ready under Late promises; the one chased last week is done', async () => {
    const { win } = await staged();
    const L = win.agentsData().agents.late;
    assert.equal(J(L.ready.map(x => x.ob.id)), 'ob1');
    assert.equal(L.ready[0].days, 6);
    assert.equal(J(L.done.map(x => x.ob.id)), 'ob2', 'chasedAt within the window is what finished');
  });
  test('4d paper read and not acknowledged is ready; acknowledged is done; a reading in flight is working', async () => {
    const { win, paper } = await staged();
    const P = win.agentsData().agents.paper;
    assert.equal(J(P.ready.map(x => x.cid)), 'MK-SUP-4');
    assert.equal(P.ready[0].look, 3, 'deviations plus missing — the arrival strip\'s own "to look at"');
    assert.equal(J(P.done.map(x => x.cid)), 'MK-SUP-5');
    paper._triaging = true;
    const P2 = win.agentsData(win.state.contracts).agents.paper;
    assert.equal(J(P2.working.map(x => x.cid)), 'MK-SUP-4', 'triageBusy — it is still reading');
    assert.equal(P2.ready.length, 0, 'and a reading in flight is not ready');
  });
  test('4e an import batch with contracts to check is ready, by BATCH; a checked batch is done', async () => {
    const { win } = await staged();
    const I = win.agentsData().agents.import;
    assert.equal(I.ready.length, 1);
    assert.equal(I.ready[0].batch, 'B-7');
    assert.equal(I.ready[0].n, 3); assert.equal(I.ready[0].review, 2); assert.equal(I.ready[0].blocked, 1);
    assert.equal(J(I.done.map(x => x.batch)), 'B-6');
  });
  test('4f THE DOOR COUNT IS THE READY TOTAL, across every agent', async () => {
    const { win } = await staged();
    const D = win.agentsData();
    const sum = win.AG_KEYS.reduce((n, k) => n + D.agents[k].ready.length, 0);
    assert.equal(D.ready, sum);
    assert.equal(win.agentsDoorCount(), sum);
  });
  test('4g a renewal the desk prepared lands under Renewals — the desk\'s rows, all of them', async () => {
    const { win, supplyContract } = world();
    const me = win.currentUser ? win.currentUser() : { id: 'u', name: 'U' };
    const mk = (id, days) => supplyContract({ id, status: 'Signed', counterparty: 'Renew ' + id,
      owner: { id: me.id, name: me.name }, expiry: day(days), metadata: { expiryDate: day(days), noticePeriodDays: 30 } });
    win.state.contracts = [mk('MK-R1', 64), mk('MK-R2', 80)];
    const desk = win.deskItems(win.state.contracts).filter(x => x.kind === 'renewal' || x.kind === 'notice');
    assert.equal(desk.length, 2, 'the stage: the desk reads two renewals');
    const rn = win.agentsData(win.state.contracts).agents.renew.ready;
    assert.equal(J(rn.map(x => x.cid).sort()), 'MK-R1,MK-R2', 'both, where Home draws one of each kind');
    assert.ok(rn.every(x => x.deskKey), 'each carries the desk\'s own dismissal key');
  });
  test('4h putting one away writes the desk\'s own stamp, and it leaves the page', async () => {
    const { win } = await staged();
    const L = win.agentsData().agents.late.ready[0];
    assert.equal(win.deskDismiss(L.c, L.deskKey), true);
    assert.equal(win.agentsData(win.state.contracts).agents.late.ready.length, 0);
    assert.equal(win.deskItems(win.state.contracts).filter(x => x.kind === 'chase').length, 0, 'and off Home\'s desk too — one stamp');
  });
});

describe('f399 (5) — the page, drawn', () => {
  test('5a five agents, the page opens on the first with work ready, cards are doors', async () => {
    const { win } = await staged();
    const doc = win.document;
    let host = doc.getElementById('content');
    if (!host){ host = doc.createElement('div'); host.id = 'content'; doc.body.appendChild(host); }
    win.renderAgentsPage();
    assert.equal(host.querySelectorAll('[data-ag-agent]').length, 5);
    const on = host.querySelector('.ag-row.on');
    assert.equal(on && on.getAttribute('data-ag-agent'), 'round', 'the first agent with something ready');
    assert.ok(host.querySelectorAll('#ag-main [data-ag-open]').length >= 2, 'every ready item is a press');
    assert.match(host.querySelector('.ag-flow').textContent, /Your review/, 'the steps name where a person looks');
  });
  test('5b a reading in flight is drawn but is not a door', async () => {
    const { win, paper } = await staged();
    paper._triaging = true;
    const doc = win.document;
    let host = doc.getElementById('content');
    if (!host){ host = doc.createElement('div'); host.id = 'content'; doc.body.appendChild(host); }
    win.agSetSel('paper');
    win.renderAgentsPage();
    const w = host.querySelector('.ag-item.is-working');
    assert.ok(w, 'the working card is drawn');
    assert.equal(w.tagName, 'DIV', 'and it is not a button — there is nothing to review yet');
    assert.equal(w.hasAttribute('data-ag-open'), false);
  });
  test('5c the round\'s panel says what each ask is and offers ONE door: the negotiation', async () => {
    const { win } = await staged();
    const it = win.agentsData().agents.round.ready.find(x => x.cid === 'MK-SUP-1');
    const body = win.agPanelBody(it);
    assert.match(body, /ag-chg/, 'one row per ask');
    assert.match(body, /ag-tag is-(green|amber|ruby|steel)/, 'with the co-pilot\'s verdict');
    const acts = win.agPanelActs(it);
    assert.match(acts, /data-ag-act="nego"/, 'answering is on the negotiation page');
    assert.ok(!/accept|reject|counter/i.test(acts.replace(/data-ag-act="[a-z]+"/g, '')), 'no decision is taken here');
  });
});
