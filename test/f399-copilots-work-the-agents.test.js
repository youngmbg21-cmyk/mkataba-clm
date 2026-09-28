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
    /* RE-POINTED 27 Sep 2026: the sixth agent's fresh link ASKS FIRST, by the
       owner's word ("asks first, showing who it goes to") — the acts it presses
       do not ask. The chase still asks for itself: no question is written
       anywhere but that one press. */
    /* AND RUN NOW (27 Sep 2026, f413): an admin's press that spends Copilot
       money asks first and says who pays — the only other question here. */
    const asks = CODE.split('confirmDialog(').length - 1;
    const fresh = CODE.slice(CODE.indexOf('async function agFreshLink('));
    const runNow = CODE.slice(CODE.indexOf('async function agRunNowPress('), CODE.indexOf('\n}', CODE.indexOf('async function agRunNowPress(')));
    assert.equal(asks, (fresh.split('confirmDialog(').length - 1) + (runNow.split('confirmDialog(').length - 1),
      'every question on the page is the fresh link\'s or Run now\'s');
    assert.ok(asks >= 2, 'and both ask');
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
    for (const k of ['round', 'link', 'renew', 'paper', 'late', 'import'])
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
  /* TWO FAULTS THIS PAGE INHERITED FROM THE DESK IT READS (Young, 27 Sep
     2026: "fix the two problems you found"). Both are RED at the parent
     (a0f7cae); f274 section 10 pins the reading, these pin the page. */
  test('4i a late step held back by an earlier payment-chain step is not ready under Late promises', async () => {
    const { win, late } = await staged();
    late.obligations.push({ id: 'ob0', desc: 'Pay the stock deposit', due: day(-12), party: 'ours' },
      { id: 'ob3', desc: 'Deliver the Q4 stock', due: day(-5), party: 'theirs', after: 'ob0' });
    assert.equal(win.obligationBlocked(late.obligations[3], late), true, 'the stage: their step waits on ours');
    const L = win.agentsData(win.state.contracts).agents.late;
    assert.equal(J(L.ready.map(x => x.ob.id)), 'ob1', 'nobody could have delivered yet, so there is nobody to chase');
  });
  test('4j putting the letter away takes the contract off Renewals — no renewal row stands in its place', async () => {
    const { buildWorld, supplyContract } = require('./world');
    const { win } = buildWorld({ negotiationView: true, copilotRead: true, desk: true, agents: true, notice: true });
    const c = supplyContract({ id: 'MK-N1', status: 'Signed', counterparty: 'Naivas Supermarkets',
      audit: [{ at: '2024-01-01T00:00:00.000Z', user: 'x', action: 'Created' }],
      expiry: day(40), metadata: { expiryDate: day(40), noticePeriodDays: 30, renewalType: 'auto-renew' } });
    win.state.contracts = [c];
    const rn = win.agentsData(win.state.contracts).agents.renew.ready;
    assert.equal(J(rn.map(x => x.kind)), 'notice', 'the stage: the letter is ready and leads');
    assert.equal(win.deskDismiss(c, rn[0].deskKey), true);
    assert.equal(win.agentsData(win.state.contracts).agents.renew.ready.length, 0,
      'the reader cleared this contract — a plain renewal row may not take the letter\'s place');
  });
  /* A PUT-AWAY BELONGS TO THE SUBJECT IT PUT AWAY (Young, 27 Sep 2026:
     "Once you put an item away on 'Prepared for you', it never comes back,
     even for the same contract's renewal next year"). RED at the parent
     (8f330c7); f274 section 11 pins the reading, this pins the page. */
  test('4k a renewal put away last year is ready again on Renewals when this year\'s comes round', async () => {
    const { win, supplyContract } = world();
    const me = win.currentUser ? win.currentUser() : { id: 'u', name: 'U' };
    const c = supplyContract({ id: 'MK-R3', status: 'Signed', counterparty: 'Renew MK-R3',
      owner: { id: me.id, name: me.name }, expiry: day(64 - 365), metadata: { expiryDate: day(64 - 365), noticePeriodDays: 30 } });
    win.state.contracts = [c];
    const last = win.agentsData(win.state.contracts).agents.renew.ready;
    assert.equal(J(last.map(x => x.cid)), 'MK-R3', 'the stage: last year\'s renewal was ready');
    assert.equal(win.deskDismiss(c, last[0].deskKey), true, 'and was put away');
    assert.equal(win.agentsData(win.state.contracts).agents.renew.ready.length, 0, 'and stayed away');
    c.expiry = day(64); c.metadata = { expiryDate: day(64), noticePeriodDays: 30 };
    assert.equal(J(win.agentsData(win.state.contracts).agents.renew.ready.map(x => x.cid)), 'MK-R3',
      'the contract ran on, and this year\'s renewal is a different decision');
  });
});

describe('f399 (5) — the page, drawn', () => {
  /* SIX since 27 Sep 2026: "No link to sign" sits second (f412). */
  /* Seven since 27 Sep 2026: Our promises joined the list. */
  test('5a seven agents, the page opens on the first with work ready, cards are doors', async () => {
    const { win } = await staged();
    const doc = win.document;
    let host = doc.getElementById('content');
    if (!host){ host = doc.createElement('div'); host.id = 'content'; doc.body.appendChild(host); }
    win.renderAgentsPage();
    assert.equal(host.querySelectorAll('[data-ag-agent]').length, 7);
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

/* ═══════════════════════════════════════════════════════════════════════════
   f399 (6) — THE FULLER CARDS AND PANELS, AND THE BRIEF THAT OPENED EMPTY
   (Young, 27 Sep 2026: "for many cards in there when i click on read brief,
   the panel comes up but it has no brief in it but when i go through the
   overview door the brief works. Also, the copilot cards are not
   comprehensive or detailed compared to the mock up in the artifact.")
   Every claim is RED at the parent (faa8f95): the foot, the titles, the
   letter, the message, the opened readings and the loader do not exist there.
   ═══════════════════════════════════════════════════════════════════════════ */
const SRV = R('server/server.js');
const CT = R('js/views/contract.js');
const OB = R('js/obligations.js');
describe('f399 (6) — the cards and panels are as full as the drawing, off the record', () => {
  test('6a every card says who it is for and when, off the record — and nobody named is nobody printed', async () => {
    const { win, paper, late } = await staged();
    assert.equal(typeof win.agFootHtml, 'function', 'the card has a foot');
    paper.triage.by = 'Young Mbagaya';
    const P = win.agentsData(win.state.contracts).agents.paper.ready[0];
    const foot = win.agFootHtml(P);
    assert.match(foot, /class="ag-av"[^>]*>YM</, 'the initials of whoever filed it');
    assert.match(foot, /For Young/, 'and who it is for, by first name');
    assert.match(foot, /Read /, 'and the day HaTi read it');
    assert.equal(win.agCardParts(P).urg, '', 'the day is said once — on the foot, never twice on one card');
    late.owner = undefined;
    const L = win.agentsData(win.state.contracts).agents.late.ready[0];
    const lf = win.agFootHtml(L);
    assert.ok(!/ag-av/.test(lf), 'a contract with no owner names nobody');
    assert.match(lf, /Was due /, 'and still says when the promise was due');
    assert.ok(!/\$|KES|cost/i.test(foot + lf), 'no cost: HaTi books spend per person and per day, never per item');
  });
  test('6b the panel says what the work IS', async () => {
    const { win } = world();
    assert.equal(win.agPanelTitle({ kind: 'notice', noticeKind: 'non-renewal' }), 'Non-renewal notice');
    assert.equal(win.agPanelTitle({ kind: 'notice', noticeKind: 'termination' }), 'Termination notice');
    assert.equal(win.agPanelTitle({ kind: 'answer', round: 3 }), 'Suggested answers to round 3');
    assert.equal(win.agPanelTitle({ kind: 'chase' }), 'Chase a late promise');
  });
  test('6c a notice\'s panel carries THE LETTER — noticeDraft\'s own text, written from the record', () => {
    const { buildWorld, supplyContract } = require('./world');
    const { win } = buildWorld({ negotiationView: true, copilotRead: true, desk: true, agents: true, notice: true });
    const c = supplyContract({ id: 'MK-N2', status: 'Signed', counterparty: 'Naivas Supermarkets',
      audit: [{ at: '2024-01-01T00:00:00.000Z', user: 'x', action: 'Created' }],
      expiry: day(40), metadata: { expiryDate: day(40), noticePeriodDays: 30, renewalType: 'auto-renew' } });
    win.state.contracts = [c];
    const it = win.agentsData(win.state.contracts).agents.renew.ready.find(x => x.kind === 'notice');
    assert.ok(it, 'the stage: the letter is ready');
    const body = win.agPanelBody(it);
    const d = win.noticeDraft(c);
    assert.ok(d && d.ok && d.text, 'the stage: the letter can be written');
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    assert.match(body, /class="ag-letter"/, 'the letter is on the panel');
    assert.ok(body.includes(esc(d.text.split('\n')[0])), 'and it is the draft\'s own words, not a second composition');
    assert.match(body, /Why this notice/, 'with why');
    assert.match(body, /renews by itself unless Naivas Supermarkets has your notice/, 'said from the record');
  });
  test('6d a chase\'s panel carries THE MESSAGE — the chase route\'s own keys, facts and language rule', async () => {
    const { win } = await staged();
    const L = win.agentsData(win.state.contracts).agents.late.ready[0];
    const m = win.agChaseMail(L.c, L.ob);
    assert.equal(m.to, 'ops@kabras.example');
    assert.equal(m.subject, 'A reminder about Deliver the Q3 stock report');
    assert.ok(m.body.startsWith('Hello,'), 'the route\'s greeting');
    assert.match(m.body, /This is a reminder about "Deliver the Q3 stock report" under our agreement ".+" \(MK-SUP-3\), which was due on \d{4}-\d{2}-\d{2}\./,
      'the route\'s line, with the due date AS STORED — which is what the route writes');
    assert.match(m.body, /automated notice from HaTi CLM\.$/);
    /* THE RELATION, NOT THE WORDS: the route composes from these keys and these
       facts, so a change to either side has to be made to both. */
    /* RE-POINTED 27 Sep 2026: the route's message is srvChaseSend, lifted out
       so the firmer chase is the same message with its own keys. */
    const at = SRV.indexOf('async function srvChaseSend(');
    const route = SRV.slice(at, SRV.indexOf('\napp.', at + 10));
    for (const k of ['mail_ob_chase_subject', 'mail_ob_chase_line', 'mail_ob_chase_line_nodate', 'mail_hello', 'mail_automated_notice'])
      assert.ok(route.includes(k), k + ' is the route\'s own key');
    /* Re-pointed in place 28 Sep 2026: the due date is written in the letter's
       language as words (dueWords), not the stored ISO day. */
    assert.match(route, /name: c\.name \|\| contractRef\(c\), id: contractRef\(c\), due: dueWords/);
    assert.match(route, /langForEmail\(to\)/);
    assert.match(CODE, /vars = \{ desc: \(o && o\.desc\) \|\| '', name: c\.name \|\| ref, id: ref, due: \(o && o\.due\) \|\| '' \}/, 'the page\'s facts mirror them');
    const body = win.agPanelBody(L);
    assert.match(body, /class="ag-mail"/);
    assert.match(body, /Whose promise/);
  });
  test('6e new paper\'s panel OPENS the readings: the brief, the departures, the obligations found', async () => {
    const { win, paper } = await staged();
    paper.playbook = { verdicts: [
      { category: 'Liability cap', status: 'deviation', escalate: true, quote: 'Neither party\'s liability is limited.', position: '≥ 12 months\' fees.' },
      { category: 'Data protection', status: 'missing', position: 'A data protection clause.' },
      { category: 'Governing law', status: 'aligned', quote: 'The laws of Kenya.', position: 'Kenya' }] };
    paper.triage.steps.oblig = { ok: true, found: [{ desc: 'Deliver the audit plan', party: 'theirs' }, { desc: 'Pay the first fee part', party: 'ours' }] };
    paper._brief = { at: iso(-1), data: { overview: 'An audit engagement for FY2026.', watchouts: [{ point: 'Fees rise with scope', why: 'No cap on extra work.' }] } };
    const it = win.agentsData(win.state.contracts).agents.paper.ready[0];
    const body = win.agPanelBody(it);
    assert.match(body, /An audit engagement for FY2026\./, 'the brief as it was written');
    assert.match(body, /Fees rise with scope/, 'and what is worth watching');
    assert.match(body, /Why it matters/, 'and why');
    assert.equal((body.match(/class="ag-dep"/g) || []).length, 2, 'the two open standards, each drawn — the met one is not');
    assert.match(body, /Their words[\s\S]*Neither party(&#39;|')s liability is limited\./, 'their words, quoted');
    assert.match(body, /Your standard[\s\S]*12 months/, 'beside your standard');
    assert.match(body, /Needs Legal/, 'escalated where the review said so');
    assert.match(body, /1 other standard is met\./, 'a met standard is counted, never listed');
    assert.match(body, /Deliver the audit plan[\s\S]*Theirs/, 'the obligations found, whose each is');
    const acts = win.agPanelActs(it);
    assert.match(acts, /data-ag-act="obs"[^>]*>Review 2 obligations</, 'with the one door onto adding them');
    assert.match(CODE, /if \(act === 'obs'\)[\s\S]*?runFindObligations\(c\)/, 'which is runFindObligations — the review dialog, where each is ticked');
  });
  test('6f a renewal\'s panel carries how it went and Copilot\'s stored memo — never a new call', async () => {
    const { win, supplyContract } = world();
    const me = win.currentUser();
    const c = supplyContract({ id: 'MK-R9', status: 'Signed', counterparty: 'Krones East Africa', owner: { id: me.id, name: me.name },
      expiry: day(64), metadata: { expiryDate: day(64), noticePeriodDays: 30 },
      obligations: [
        { id: 'a', desc: 'Service visit Q1', due: day(-60), party: 'theirs', status: 'done', completedAt: day(-61) },
        { id: 'b', desc: 'Service visit Q2', due: day(-30), party: 'theirs', status: 'done', completedAt: day(-20) },
        { id: 'c', desc: 'Pay the Q3 fee', due: day(-3), party: 'ours', status: 'open' }] });
    c._renewalAdvice = { at: iso(-1), overnight: true, data: { verdict: 'renegotiate', headline: 'Renew, and ask for faster repairs.',
      because: ['Three breakdowns this year.'], pushOn: ['A repair time of 24 hours.'], watchIf: 'Repairs get faster.' } };
    win.state.contracts = [c];
    const it = win.agentsData(win.state.contracts).agents.renew.ready.find(x => x.cid === 'MK-R9');
    assert.ok(it, 'the stage: the renewal is ready');
    const body = win.agPanelBody(it);
    assert.match(body, /Renews by itself/);
    assert.match(body, /1 of 2 obligations were met on their date\./, 'how it went, off the obligations\' own readings');
    assert.match(body, /1 obligation is overdue now\./);
    assert.match(body, /Renew, and ask for faster repairs\./, 'the memo\'s headline');
    assert.match(body, /Three breakdowns this year\./, 'its reasons');
    assert.match(body, /A repair time of 24 hours\./, 'what to push on');
    assert.match(body, /Written overnight/, 'and who wrote it');
    assert.ok(!/copilotAsk\(|\/api\/ai/.test(CODE), 'the memo is read, never asked for');
  });
  test('6g an import\'s panel NAMES the file that could not be read and the ones to check — and says the count once', async () => {
    const { win } = await staged();
    const it = win.agentsData(win.state.contracts).agents.import.ready[0];
    const body = win.agPanelBody(it);
    assert.match(body, /Could not be read[\s\S]*Imported A/, 'the unreadable one, by name');
    assert.match(body, /Read, and waiting for you to check[\s\S]*Imported B/, 'the one waiting, by name');
    assert.equal((body.match(/Could not be read/g) || []).length, 1, 'said once, not as a count beside the list');
  });
  test('6h "Read the brief" loads the whole record BEFORE it opens the panel — one shared flight', async () => {
    assert.match(CODE, /if \(act === 'brief'\)\{[\s\S]*?const load = agLoadWhole\(c\);[\s\S]*?await load;[\s\S]*?selectContract\(c\.id\)/,
      'the brief rides only the single record\'s read, so it is fetched first');
    const { win } = world();
    let calls = 0;
    win.restoreHeavyFields = async c => { calls++; c._loaded = true; c._light = false; c._brief = { data: { overview: 'X' } }; };
    const c = { id: 'MK-L1', _light: true };
    const p1 = win.agLoadWhole(c), p2 = win.agLoadWhole(c);
    assert.ok(p1 && p1 === p2, 'the panel and the brief door share one flight');
    await p1;
    assert.equal(calls, 1);
    assert.equal(c._brief.data.overview, 'X');
    assert.equal(win.agLoadWhole(c), null, 'a record already whole is not asked again');
    assert.match(CODE, /restoreHeavyFields/, 'the Inspector\'s loader, which copies nothing over what is on screen');
    assert.ok(!/ensureFull\(/.test(CODE), 'never ensureFull');
  });
  test('6i every door onto the brief panel gets it: the panel\'s own funnel loads a light record first', () => {
    const at = CT.indexOf('function openCheckPanel(c,kind){');
    const fn = CT.slice(at, CT.indexOf('\nfunction ', at + 10));
    assert.match(fn, /kind==='brief' && !c\._brief && c\._light && !c\._loaded && typeof restoreHeavyFields==='function'/);
    assert.match(fn, /restoreHeavyFields\(c\)[\s\S]*renderBriefSection\(c\)[\s\S]*backstop\(\)/, 'then draws the brief, and only then the "nothing briefed" line');
    assert.match(fn, /ct_loading_contract/, 'saying it is loading meanwhile');
  });
  test('6j a chase sent or an obligation added anywhere reaches this page', () => {
    const at = OB.indexOf('function obligationSurfacesChanged(){');
    const fn = OB.slice(at, OB.indexOf('\nfunction ', at + 10));
    assert.match(fn, /state\.view==='agents' && window\.agRepaint\) agRepaint\(\)/);
  });
});
