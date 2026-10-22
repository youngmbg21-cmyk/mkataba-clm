/* ============================================================
   f863 — JAMBO'S JOURNEY, ROUND 2 (22 Oct 2026; docs/PLAN-jambo-journey.md)
   ============================================================
   (1) "I'D TAKE IT", WHERE THE PLAYBOOK IS SILENT: rlpJudge falls back to how
       you answered this kind of ask before (rlpPastJudge) — with them where
       they asked PRECEDENT_MIN times, else with everybody; two in three
       decides it, less says both, fewer than PRECEDENT_MIN is nothing.
   (2) HIS READ ON THEIR ROW (rlRowReadHtml): only their pending asks, only
       our seat; the verdict, its first reason and "Why?" (one call, said).
   (3) AFTER THE SIGNATURE (signedTurnOf): a contract signed in the last
       SIGNED_TURN_DAYS; the Calendar's own dates for it ahead, by date; the
       duties held in the wording; the standards page's proposal on a topic
       this contract settled, for those who may change standards.
   (4) THE TURNS: dates listed with the cap said, one filled button in the
       panel; the standards turn when there is a proposal.
   (5) ONCE, AND NEVER OVER ANYTHING: said once per contract in this browser,
       not while an answer is on its way, not over an open face, not to a
       viewer.
   (6) EACH ANSWER IS AN EXISTING DOOR (js/jambopress.js, beside his other
       prepared presses; the arrival reader never opens a dialog, f273): the calendar file is calIcsFor over
       exactly those dates; Show my calendar, Review the duties
       (runFindObligations), Show me the proposal (Our standards, that
       standard), Not yet (kept quiet for that figure).
   (7) THE WIRING: the panel says his words after the talk settles and looks
       again; the row carries the read.
   AT THE PARENT every part fails: none of these names exist.
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');

const ROOT = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const bare = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const plain = x => JSON.parse(JSON.stringify(x));
const said = s => String(s).replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&quot;/g, '"');
const fnOf = (src, head) => { const i = src.indexOf(head); assert.ok(i >= 0, head + ' is there');
  const ends = ['\nfunction ', '\nasync function ', '\nObject.assign(', '\nconst ', '\nif (typeof document'].map(e => src.indexOf(e, i + head.length)).filter(j => j > 0);
  return src.slice(i, ends.length ? Math.min(...ends) : undefined); };

/* ---- the verdict's world: the real plan and precedent, a payment ask with no playbook range ---- */
function judgeWorld(prec){
  const { win } = buildWorld({ copilotRead: true, negotiationView: true });
  win.precedentTopicOf = () => ({ key: 'payment', category: 'Payment terms', unit: 'days', num: () => 90 });
  win.resolvePlaybook = () => ({ positions: [], ranges: [] });
  win.playbookKeyFor = () => '_default';
  win.precedentForChange = () => prec;
  return win;
}
const row = (a, r, who) => ({ counterparty: who, theirs: { accepted: a, refused: r }, ours: { accepted: 0, refused: 0 }, numbers: { theirsAccepted: [], oursAccepted: [] } });
const ASK = { id: 'L1', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'counterparty', newText: 'within ninety (90) days' };

describe('f863 (1) — where the playbook is silent, how you answered before', () => {
  test('with them, two in three agreed: take it; turned down: push back; both: read it', () => {
    let w = judgeWorld({ category: 'Payment terms', withThem: row(3, 0, 'Nordkust'), everyone: row(3, 0) });
    let j = w.rlpJudge({ id: 'X' }, ASK);
    assert.equal(j.verdict, 'accept'); assert.equal(j.past, true);
    assert.match(j.why[0], /agreed to this kind of ask from Nordkust 3 of 3 times/);
    w = judgeWorld({ category: 'Payment terms', withThem: row(0, 3, 'Nordkust'), everyone: row(0, 3) });
    j = w.rlpJudge({ id: 'X' }, ASK);
    assert.equal(j.verdict, 'push'); assert.match(j.why[0], /turned this kind of ask from Nordkust down 3 of 3/);
    w = judgeWorld({ category: 'Payment terms', withThem: null, everyone: row(2, 2) });
    j = w.rlpJudge({ id: 'X' }, ASK);
    assert.equal(j.verdict, 'review'); assert.match(j.why[0], /both ways on this before: 2 yes, 2 no/);
  });
  test('fewer than three answers is nothing to compare; with them too few, everybody counts', () => {
    let w = judgeWorld({ category: 'Payment terms', withThem: row(2, 0, 'Nordkust'), everyone: row(2, 0) });
    let j = w.rlpJudge({ id: 'X' }, ASK);
    assert.equal(j.verdict, 'review'); assert.ok(!j.past, 'nothing to compare'); assert.match(j.why[0], /nothing to measure/);
    w = judgeWorld({ category: 'Payment terms', withThem: row(1, 0, 'Nordkust'), everyone: row(4, 1) });
    j = w.rlpJudge({ id: 'X' }, ASK);
    assert.equal(j.verdict, 'accept'); assert.match(j.why[0], /agreed to this kind of ask 4 of 5 times/);
  });
  test('the playbook\'s range still decides first', () => {
    const w = judgeWorld({ category: 'Payment terms', withThem: row(3, 0, 'Nordkust'), everyone: row(3, 0) });
    w.resolvePlaybook = () => ({ positions: [], ranges: [{ key: 'paymentDays', label: 'Payment terms', op: '<=', value: 45 }] });
    const j = w.rlpJudge({ id: 'X' }, ASK);
    assert.equal(j.verdict, 'push'); assert.ok(!j.past);
  });
});

describe('f863 (2) — his read on their row, our seat only', () => {
  const w = judgeWorld({ category: 'Payment terms', withThem: row(3, 0, 'Nordkust'), everyone: row(3, 0) });
  const c = { id: 'X', changes: [ASK] };
  test('their pending ask: the verdict, its reason and Why? with its cost', () => {
    const h = said(w.rlRowReadHtml(c, ASK, 'owner'));
    assert.match(h, /data-rl-row-read="accept"/);
    assert.match(h, /Take it/);
    assert.match(h, /agreed to this kind of ask from Nordkust 3 of 3 times/);
    assert.match(h, /data-rl-read-why="L1"[^>]*title="Ask Jambo why · 1 Jambo call"/);
  });
  test('never on their seat, never on our own change, never on a settled one', () => {
    assert.equal(w.rlRowReadHtml(c, ASK, 'counterparty'), '');
    assert.equal(w.rlRowReadHtml(c, Object.assign({}, ASK, { authorSide: 'owner' }), 'owner'), '');
    assert.equal(w.rlRowReadHtml(c, Object.assign({}, ASK, { status: 'accepted' }), 'owner'), '');
    assert.equal(w.rlRowReadHtml(c, Object.assign({}, ASK, { superseded: true }), 'owner'), '');
  });
});

/* ---- the after-signature world: the real turn, the Calendar's reading a double ---- */
const TODAY = '2026-10-22';
function signedWorld(o = {}){
  const { win } = buildWorld({ triage: true });
  /* the after-signature turn lives with Jambo's prepared presses (js/jambopress.js), which the world does not carry */
  if (typeof win.signedTurnOf !== 'function') win.eval(read('js/jambopress.js'));
  win.state = win.state || {}; win.state.contracts = [];
  win.todayISO = () => TODAY;
  win.negoExecuted = c => c.status === 'Signed';
  win.contractSignedAt = c => c.signedAt || null;
  win.calendarEvents = () => (o.evs || [
    { date: '2027-10-22', type: 'expiry', cid: 'S1' },
    { date: '2026-12-01', type: 'obligation', cid: 'S1', note: 'Pay the first invoice', theirs: true },
    { date: '2026-11-01', type: 'obligation', cid: 'S1', note: 'Deliver the first shipment', theirs: false },
    { date: '2026-10-01', type: 'obligation', cid: 'S1', note: 'Gone by', theirs: false },
    { date: '2026-11-05', type: 'obligation', cid: 'S1', note: 'Done already', done: true },
    { date: '2026-11-03', type: 'obligation', cid: 'OTHER', note: 'Another contract' }]);
  win.triageHeldObligations = () => o.held || [];
  win.precedentTopicOf = ch => ch && /pay/i.test(ch.clauseLabel || '') ? { key: 'payment' } : null;
  win.stdLearned = () => ({ proposals: o.proposals || [] });
  win.isAdmin = () => o.admin !== false;
  win.currentUser = () => ({ id: 'u1', name: 'Amina', role: o.role || 'admin' });
  win.canEdit = () => o.canEdit !== false;
  win.intel = { history: [], busy: false };
  try { win.localStorage.removeItem('hati.v1.jbSigned'); } catch (_){}
  return win;
}
const SIGNED = { id: 'S1', name: 'Cane Supply', status: 'Signed', signedAt: TODAY,
  changes: [{ id: 'c1', clauseLabel: '2. PAYMENT', status: 'accepted' }] };
const PROPOSAL = { key: 'payment', category: 'Payment terms', clause: 'cl-pay', figure: 60, unit: 'days', seen: 4, settled: 4, preferredFigure: 30, fallbackFigure: 45 };

describe('f863 (3) — after the signature, the one reading', () => {
  test('signed today: the dates ahead for this contract, by date; held duties; the proposal', () => {
    const w = signedWorld({ held: [{}, {}], proposals: [PROPOSAL] });
    const R = w.signedTurnOf(SIGNED);
    assert.deepEqual(plain(R.dates.map(e => e.date)), ['2026-11-01', '2026-12-01', '2027-10-22'], 'ahead, not done, this contract, by date');
    assert.equal(R.held, 2);
    assert.equal(R.learn.figure, 60);
  });
  test('not signed, or signed too long ago: nothing', () => {
    const w = signedWorld({});
    assert.equal(w.signedTurnOf(Object.assign({}, SIGNED, { status: 'Draft' })), null);
    assert.equal(w.signedTurnOf(Object.assign({}, SIGNED, { signedAt: '2026-09-01' })), null);
    assert.equal(w.signedTurnOf(Object.assign({}, SIGNED, { signedAt: null })), null);
  });
  test('the proposal only on a topic this contract settled, and only for those who may change standards', () => {
    let w = signedWorld({ proposals: [Object.assign({}, PROPOSAL, { key: 'liability' })] });
    assert.equal(w.signedTurnOf(SIGNED).learn, null, 'a topic this contract did not settle');
    w = signedWorld({ proposals: [PROPOSAL], admin: false, role: 'member' });
    assert.equal(w.signedTurnOf(SIGNED).learn, null, 'not theirs to change');
    w = signedWorld({ proposals: [PROPOSAL], admin: false, role: 'legal' });
    assert.equal(w.signedTurnOf(SIGNED).learn.figure, 60, 'legal may');
  });
});

describe('f863 (4) — the turns, in his words', () => {
  test('the duties by date, each side named; the standards turn; one filled button', () => {
    const w = signedWorld({ proposals: [PROPOSAL] });
    const T = w.signedTurnTurns(SIGNED);
    assert.equal(T.length, 2);
    const t0 = said(T[0].text).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    assert.match(t0, /Signed\. Here's what it now asks of each side:/);
    assert.match(t0, /You: Deliver the first shipment .* They: Pay the first invoice .* It ends/);
    assert.match(t0, /already on your HaTi calendar/);
    assert.deepEqual(plain(T[0].choices.map(c => c.fr)), ['ics', 'cal']);
    assert.match(said(T[1].text), /Next time I'd start Payment terms at 60 days: you've settled there 4 of your last 4 rounds\. Your standard still says 30 days\./);
    assert.deepEqual(plain(T[1].choices.map(c => c.fr)), ['learn', 'later']);
    const filled = T.flatMap(t => t.choices || []).filter(c => c.lead);
    assert.equal(filled.length, 1, 'one filled button in the panel');
  });
  test('held duties lead; no dates says so; the list is capped and the cap said', () => {
    let w = signedWorld({ held: [{}], evs: [] });
    let T = w.signedTurnTurns(SIGNED);
    assert.match(said(T[0].text), /No dated duties are on it yet/);
    assert.match(said(T[0].text), /I found 1 duty in the wording that isn't on the record yet/);
    assert.deepEqual(plain(T[0].choices.map(c => [c.fr, !!c.lead])), [['oblig', true]]);
    const evs = Array.from({ length: 8 }, (_, i) => ({ date: '2026-11-0' + (i + 1), type: 'obligation', cid: 'S1', note: 'Step ' + i }));
    w = signedWorld({ evs });
    T = w.signedTurnTurns(SIGNED);
    assert.equal((T[0].text.match(/<li>/g) || []).length, 5);
    assert.match(T[0].text, /And 3 more\./);
  });
});

describe('f863 (5) — once, and never over anything', () => {
  function onPaper(w, c, o = {}){
    w.pdOnPaper = () => true; w.pdContract = () => c;
    w.pdFaceNow = () => o.face || ''; w.pdTab = () => o.tab || 'copilot';
  }
  test('said once beside the Dossier, stamped in this browser', () => {
    const w = signedWorld({}); onPaper(w, SIGNED);
    assert.equal(w.signedTurnDue(), true);
    const n = w.intel.history.length; assert.ok(n >= 1);
    assert.equal(w.signedTurnDue(), false); assert.equal(w.intel.history.length, n, 'once');
  });
  test('not while an answer is on its way, not over a face or another tab, not to a viewer', () => {
    let w = signedWorld({}); onPaper(w, SIGNED); w.intel.busy = true;
    assert.equal(w.signedTurnDue(), false);
    w = signedWorld({}); onPaper(w, SIGNED, { face: 'signing' }); assert.equal(w.signedTurnDue(), false, 'never over the receipt');
    w = signedWorld({}); onPaper(w, SIGNED, { tab: 'doc' }); assert.equal(w.signedTurnDue(), false, 'only beside the Dossier');
    w = signedWorld({ canEdit: false }); onPaper(w, SIGNED); assert.equal(w.signedTurnDue(), false, 'not to a viewer');
    assert.equal(w.intel.history.length, 0);
  });
  test('round 1\'s first words wait for a pending answer too', () => {
    const w = signedWorld({});
    const c = { id: 'U1', source: 'upload', upload: { extractedText: 'x' }, counterparty: 'N', triage: { sayOwed: true, steps: {} } };
    w.isUpload = x => x.source === 'upload'; w.riskOpenOf = () => []; w.stdDepartures = () => [];
    w.pdOnPaper = () => true; w.pdContract = () => c; w.intel.busy = true;
    assert.equal(w.firstReadDue(), false);
    w.intel.busy = false; assert.equal(w.firstReadDue(), true);
  });
});

describe('f863 (6) — each answer is an existing door', () => {
  test('the calendar file is exactly those dates; the other doors are the old ones', () => {
    const w = signedWorld({ proposals: [PROPOSAL] });
    w.getContract = () => SIGNED; w.contractRef = c => c.id;
    const files = []; w.downloadFile = (name, body, type) => files.push({ name, body, type });
    w.calIcsFor = evs => 'ICS:' + evs.map(e => e.date).join(',');
    const toasts = []; w.toast = (m, k) => toasts.push([m, k]);
    const went = []; w.CA_GO = { calendar: () => went.push('cal') };
    w.runFindObligations = c => went.push('oblig:' + c.id);
    w.setView = v => went.push('view:' + v); w.sdGoClause = id => went.push('std:' + id);
    w.firstReadPress({ fr: 'ics', cid: 'S1' }, {});
    assert.deepEqual(plain(files), [{ name: 'hati-S1.ics', body: 'ICS:2026-11-01,2026-12-01,2027-10-22', type: 'text/calendar' }]);
    assert.deepEqual(plain(toasts), [['Downloaded 3 dates', 'ok']]);
    w.firstReadPress({ fr: 'cal', cid: 'S1' }, {});
    w.firstReadPress({ fr: 'oblig', cid: 'S1' }, { choices: [{ fr: 'oblig' }, { fr: 'ics' }] });
    const m = { choices: [1] };
    w.firstReadPress({ fr: 'learn', cid: 'S1', clause: 'cl-pay' }, m);
    assert.equal(m.choices, null);
    assert.deepEqual(plain(went), ['cal', 'oblig:S1', 'view:playbook', 'std:cl-pay']);
  });
  test('Not yet keeps that figure quiet', () => {
    const w = signedWorld({ proposals: [PROPOSAL] });
    w.getContract = () => SIGNED;
    assert.ok(w.signedTurnOf(SIGNED).learn);
    w.firstReadPress({ fr: 'later', cid: 'S1', key: 'payment', figure: 60 }, {});
    assert.equal(w.signedTurnOf(SIGNED).learn, null);
    assert.match(said(w.intel.history.at(-1).text), /won't bring that one up again/);
  });
});

describe('f863 (7) — the wiring', () => {
  test('the panel says his words after the talk settles, then looks again; the row carries the read', () => {
    const ig = bare(read('js/views/intelligence.js'));
    const dock = fnOf(ig, 'function renderIntelDock(');
    const talk = dock.indexOf('pdTalkSync(dock)'), due = dock.indexOf('signedTurnDue()'), again = dock.indexOf('pdTalkSync(dock)', due);
    assert.ok(talk > 0 && due > talk && again > due);
    const nv = bare(read('js/views/negotiation.js'));
    assert.match(nv, /read = rlRowReadHtml\(c, ch, side\);\s*return \(why \|\| keeps \|\| lock \|\| read\) \? `<div class="rl-card-sumw">\$\{line\}\$\{why\}\$\{read\}/);
  });
  test('nothing written to the signed record, no route called', () => {
    const tri = bare(read('js/jambopress.js'));
    const a = tri.indexOf('const SIGNED_TURN_DAYS'), b = tri.indexOf('Object.assign(window, { SIGNED_TURN_DAYS');
    assert.ok(a > 0 && b > a, 'the after-signature turn is there');
    const body = tri.slice(a, b);
    assert.doesNotMatch(body, /\bpersist\(|\bapi\(|fetch\(|negoFileChange|changes\.push/);
  });
});
