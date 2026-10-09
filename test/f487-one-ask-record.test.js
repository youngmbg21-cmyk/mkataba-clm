/* ============================================================
   f487 — ONE ASK RECORD (4 Oct 2026, the process review's last gap: B)
   ============================================================
   Four kinds of "a colleague must say yes" were stored in four places: the
   approval rule chain (c.approvalChain), a named person's yes
   (c.signApprovals), the internal review (c.review + ch.review) and a
   contributor's suggestion (ch.suggested). The rules for reasons, reminders
   and the "cleared" notice were made one on 4 Oct; the STORAGE was not.

   js/asks.js is now the one record — `c.asks`, one row per question — with
   ONE writer every flow writes through, ONE reading, ONE lapse rule, loaded
   by both hosts. The old fields are MIRRORS the writer keeps in step, so every
   existing reading and every wall keeps working (the address book's pattern).

   WHAT THIS FILE WATCHES:
     (1) one file, both hosts, every stage that runs the four flows
     (2) the writer is the only hand on the old fields' state
     (3) an older record is READ as if it had a list, and nothing is written
     (4) the writer writes the list and the mirror in one breath
     (5) the four flows, driven for real, leave the two in step
     (6) one lapse rule, each kind's own stamp — and it fails CLOSED
     (7) the list never travels to the other side
   ============================================================ */
const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { JSDOM } = require('jsdom');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');
const { buildWorld } = require('./world');
const AK = require('../js/asks.js');
const SA = require('../js/signapproval.js');

const ROOT = path.join(__dirname, '..');
const R = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const strip = s => String(s).replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const plain = x => JSON.parse(JSON.stringify(x));

/* ---------------------------------------------------------------------------
   (1) ONE FILE, BOTH HOSTS
   --------------------------------------------------------------------------- */
describe('f487 (1) one file, loaded by both hosts and every stage', () => {
  test('the browser imports it before the four flows that write through it', () => {
    const app = R('js/app.js');
    const at = f => app.indexOf(`import './${f}';`);
    assert.ok(at('asks.js') > 0, 'js/app.js imports it');
    for (const f of ['signapproval.js', 'approvals.js', 'review.js', 'desk.js', 'versioning.js', 'core.js'])
      assert.ok(at('asks.js') < at(f), `before ${f}`);
  });
  test('the server requires the same file', () => {
    assert.match(R('server/server.js'), /require\('\.\.\/js\/asks\.js'\)/);
    assert.equal(typeof AK.askOpen, 'function');
    assert.equal(typeof AK.asksOf, 'function');
  });
  test('every stage that runs a flow carries it — a missing lapse rule fails closed, so a stage without it lies', () => {
    assert.match(R('test/world.js'), /'js\/asks\.js',\s*\n\s*'js\/negotiation\.js'/);
    assert.match(R('test/dom.js'), /'js\/section\.js', 'js\/asks\.js'\]/);
    assert.match(R('test/portalworld.js'), /'js\/asks\.js'/);
    for (const f of ['parity.html', 'redline.html', 'timeline.html', 'room-shots.html'])
      assert.match(R('test/chromium/' + f), /<script src="\.\.\/\.\.\/js\/asks\.js"><\/script>/, f);
  });
  test('it spends nothing, calls no route and paints nothing', () => {
    const src = strip(R('js/asks.js'));
    assert.ok(!/\bapi\(|fetch\(|innerHTML|document\./.test(src));
  });
});

/* ---------------------------------------------------------------------------
   (2) THE WRITER IS THE ONLY HAND ON THE OLD FIELDS' STATE
   --------------------------------------------------------------------------- */
describe('f487 (2) every flow writes through the one writer', () => {
  const AP = strip(R('js/approvals.js'));
  const RV = strip(R('js/review.js'));
  const DK = strip(R('js/desk.js'));
  const SRV = strip(R('server/server.js'));
  test('the rule steps: answered and sent back through it, never by hand', () => {
    /* B3 (8 Oct 2026): the decision is written by a `write(x)` the stale-tab
       retry can apply to the newer record — still through the one writer. */
    assert.match(AP, /askRuleFor\(x, step\.ruleId, \{ approver:step\.approver, keepStep:true \}\);\s*askAnswer\(x, ask\.id, \{ state:'yes'/);
    assert.match(AP, /askAnswer\(x, ask\.id, \{ state:'no', by:u, why:comment\|\|null \}\)/);
    assert.match(AP, /back\.forEach\(s=>askRuleFor\(c, s\.ruleId, \{ approver:s\.approver \}\)\)/);
    assert.ok(!/status:'approved', by:u\.name|status:'rejected', by:u\.name|status:'pending', by:null, at:null/.test(AP),
      'no step is decided or reset by hand any more');
  });
  test('the named yes: asked, decided and withdrawn through it', () => {
    assert.match(AP, /askOpen\(c, \{ kind:'named'/);
    assert.match(AP, /askAnswer\(x, reqId, \{ state:verdict==='approved'\?'yes':'no'/);
    assert.match(AP, /askAnswer\(c, reqId, \{ state:'withdrawn', by:me \}\)/);
    assert.ok(!/live\.status=|live\.decidedBy=|list\.push\(req\)/.test(AP));
  });
  test('the internal review: asked, ruled on, handed back and cancelled through it', () => {
    assert.match(RV, /window\.askOpen\(c, \{\s*kind: 'review'/);
    assert.match(RV, /window\.askAnswer\(c, rv\.id, \{ part: live\.id/);
    assert.match(RV, /window\.askAnswer\(c, rv\.id, \{ state: 'returned'/);
    assert.match(RV, /window\.askAnswer\(c, rv\.id, \{ state: 'withdrawn'/);
    assert.ok(!/rv\.status = 'returned'|rv\.status = 'cancelled'|live\.review = \{|c\.review\.requests\.push\(/.test(RV));
  });
  test('a suggestion: stamped, adopted and handed back through it', () => {
    assert.match(DK, /window\.askOpen\(c, \{ kind: 'suggest'/);
    assert.match(DK, /window\.askAnswer\(c, 'sg:' \+ ch\.id, \{ state: 'yes'/);
    assert.match(DK, /window\.askAnswer\(c, 'sg:' \+ ch\.id, \{ state: 'returned'/);
    assert.ok(!/ch\.suggested = \{|g\.adoptedAt =|g\.returnedAt = _dkNow/.test(DK));
  });
  test('and the server\'s own writer — the handover reopen — goes through it too', () => {
    const from = SRV.indexOf("if (act === 'reopen')");
    const reopen = SRV.slice(from, SRV.indexOf("return res.status(400).json({ error: 'Which act on the handover?' })", from));
    assert.match(reopen, /askAnswer\(c, id, \{ state: 'withdrawn'/);
    assert.match(reopen, /askAnswer\(c, last\.id, \{ state: 'withdrawn'/);
    assert.ok(!/r\.status = 'withdrawn'|status: 'pending', by: null/.test(reopen));
  });
});

/* ---------------------------------------------------------------------------
   (3) AN OLDER RECORD IS READ AS IF IT HAD A LIST
   --------------------------------------------------------------------------- */
const OLD = () => ({
  id: 'MK-OLD', status: 'Under Review', value: 6000000,
  approvalChain: [{ ruleId: 'r1', name: 'Finance', approver: { kind: 'role', role: 'admin' }, order: 1,
    status: 'rejected', by: 'Amina Otieno', at: '2026-10-01T09:00:00.000Z', comment: 'Cap too low.', stamp: null }],
  signApprovals: [
    { id: 'sa_a', key: 'u_boss', approverId: 'u_boss', approverName: 'Grace Njeri', status: 'approved',
      askedBy: { id: 'u_lead', name: 'Asha Kimani' }, askedAt: '2026-10-01T08:00:00.000Z', stamp: { v: 1 },
      decidedBy: { id: 'u_boss', name: 'Grace Njeri', role: 'legal' }, decidedAt: '2026-10-02T08:00:00.000Z', decision: null },
    { id: 'sa_b', key: 'u_boss', approverId: 'u_boss', approverName: 'Grace Njeri', status: 'withdrawn',
      askedBy: { id: 'u_lead', name: 'Asha Kimani' }, askedAt: '2026-10-03T08:00:00.000Z', withdrawnBy: 'reopen',
      withdrawnAt: '2026-10-03T09:00:00.000Z', decidedBy: { id: 'u_boss', name: 'Grace Njeri' }, decidedAt: '2026-10-03T08:30:00.000Z' }],
  review: { requests: [{ id: 'REV-1', at: '2026-10-01', by: 'Asha Kimani', byId: 'u_lead',
    reviewer: { id: 'u_rev', name: 'Daniel Kiptoo', email: null }, note: 'Look at 6', due: '2026-10-09',
    changeIds: ['CHG-001'], status: 'open', returnedAt: null, returnedBy: null, returnedNote: null }] },
  changes: [
    { id: 'CHG-001', status: 'pending', hash: 'h1', review: { verdict: 'held', note: 'No', by: 'Daniel Kiptoo', byId: 'u_rev', at: '2026-10-02', hash: 'h1', reviewId: 'REV-1' } },
    { id: 'CHG-002', status: 'pending', hash: 'h2', suggested: { by: 'Grace Mwangi', byId: 'u_grace', at: '2026-10-02', why: 'Too soft', returnedAt: '2026-10-03', returnedBy: 'Wanjiru Kamau' } }],
});
describe('f487 (3) migration is additive and read-time', () => {
  test('all four kinds are read off their mirrors, with who, the answer, when and what about', () => {
    const c = OLD();
    const rows = AK.asksOf(c);
    const by = id => rows.find(a => a.id === id);
    assert.deepEqual(rows.map(a => a.kind).sort(), ['named', 'named', 'review', 'rule', 'suggest']);
    assert.equal(by('ar:r1:1').state, 'no');
    assert.equal(by('ar:r1:1').why, 'Cap too low.');
    assert.equal(by('ar:r1:1').by, null, 'a rule step is asked by the rule');
    assert.deepEqual(by('ar:r1:1').to, { role: 'admin' });
    assert.equal(by('sa_a').state, 'yes');
    assert.deepEqual(by('sa_a').by, { id: 'u_lead', name: 'Asha Kimani' });
    assert.deepEqual(by('sa_a').answeredBy, { id: 'u_boss', name: 'Grace Njeri' });
    assert.equal(by('sa_a').answeredAt, '2026-10-02T08:00:00.000Z');
    assert.equal(by('sa_b').state, 'withdrawn');
    assert.equal(by('sa_b').answeredBy, null, 'a withdrawn question is nobody\'s answer — not the earlier decision\'s');
    assert.equal(by('sa_b').answeredAt, '2026-10-03T09:00:00.000Z');
    assert.equal(by('REV-1').state, 'open');
    assert.deepEqual(by('REV-1').of, ['CHG-001']);
    assert.equal(by('REV-1').due, '2026-10-09');
    assert.deepEqual(by('REV-1').parts.map(p => [p.of, p.answer]), [['CHG-001', 'held']]);
    assert.equal(by('sg:CHG-002').state, 'returned');
    assert.equal(by('sg:CHG-002').why, 'Too soft');
    assert.deepEqual(by('sg:CHG-002').to, { role: 'lead' });
  });
  test('reading writes nothing — the record is byte-for-byte what it was', () => {
    const c = OLD();
    const before = JSON.stringify(c);
    AK.asksOf(c); AK.askOpenFor(c, 'review', 'CHG-001'); AK.askById(c, 'sa_a'); AK.asksLatestFor(c, 'rule', 'r1');
    assert.equal(JSON.stringify(c), before);
    assert.equal(c.asks, undefined);
  });
  test('adoption writes the list once, additively, and is idempotent', () => {
    const c = OLD();
    const mirrors = JSON.stringify({ a: c.approvalChain, s: c.signApprovals, r: c.review, ch: c.changes });
    AK.asksAdopt(c);
    const once = JSON.stringify(c.asks);
    AK.asksAdopt(c);
    assert.equal(JSON.stringify(c.asks), once, 'twice is once');
    assert.equal(JSON.stringify({ a: c.approvalChain, s: c.signApprovals, r: c.review, ch: c.changes }), mirrors,
      'and not a byte of a mirror moved');
  });
  test('a list that disagrees with its mirror takes the mirror — the mirror is what the walls read', () => {
    const c = OLD();
    AK.asksAdopt(c);
    c.asks.find(a => a.id === 'sa_a').state = 'no';
    assert.equal(AK.askById(c, 'sa_a').state, 'yes');
  });
});

/* ---------------------------------------------------------------------------
   (4) THE WRITER WRITES BOTH
   --------------------------------------------------------------------------- */
describe('f487 (4) one writer, the list and its mirror in one breath', () => {
  const ME = { id: 'u_lead', name: 'Asha Kimani', role: 'legal' };
  const BOSS = { id: 'u_boss', name: 'Grace Njeri', role: 'legal' };
  test('a named yes: the request and its row, then the decision on both', () => {
    const c = { id: 'MK-1' };
    const a = AK.askOpen(c, { kind: 'named', id: 'sa_x', of: ['u_boss'], by: ME, to: { id: 'u_boss', name: BOSS.name },
      stamp: { v: 1 }, note: 'Please', mirror: { key: 'u_boss', approverId: 'u_boss', approverName: BOSS.name, people: [], shows: { round: 1 }, note: 'Please' } });
    assert.equal(a.state, 'open');
    const row = c.signApprovals[0];
    assert.equal(row.id, 'sa_x');
    assert.equal(row.status, 'pending');
    assert.deepEqual(row.askedBy, { id: 'u_lead', name: 'Asha Kimani' });
    assert.equal(row.askedAt, a.at);
    AK.askAnswer(c, 'sa_x', { state: 'yes', by: BOSS, role: 'legal', as: 'approver', at: '2026-10-04T10:00:00.000Z' });
    assert.equal(row.status, 'approved');
    assert.deepEqual(row.decidedBy, { id: 'u_boss', name: BOSS.name, role: 'legal' });
    assert.equal(row.decidedAt, '2026-10-04T10:00:00.000Z');
    assert.equal(row.as, 'approver');
    assert.equal(c.asks[0].answeredAt, row.decidedAt, 'one time, written twice');
  });
  test('a named yes withdrawn by a reopen: the request says so as it always did, the list says withdrawn', () => {
    const c = { id: 'MK-1b', signApprovals: [{ id: 'sa_y', key: 'u_boss', approverId: 'u_boss', status: 'approved',
      askedBy: { id: 'u_lead', name: 'Asha Kimani' }, askedAt: '2026-10-01', decidedBy: { id: 'u_boss', name: BOSS.name }, decidedAt: '2026-10-02' }] };
    AK.askAnswer(c, 'sa_y', { state: 'withdrawn', at: '2026-10-04', by: null, mirror: { withdrawnBy: 'reopen', withdrawnAt: '2026-10-04' } });
    const row = c.signApprovals[0];
    assert.deepEqual([row.status, row.withdrawnBy, row.withdrawnAt], ['withdrawn', 'reopen', '2026-10-04']);
    assert.deepEqual(row.decidedBy, { id: 'u_boss', name: BOSS.name }, 'what was decided stays on the request');
    const a = AK.askById(c, 'sa_y');
    assert.equal(a.state, 'withdrawn');
    assert.equal(a.answeredBy, null);
  });
  test('a rule step: answered on the step; a stale yes kept as history; sent back resets the step', () => {
    const c = { id: 'MK-2', approvalChain: [{ ruleId: 'r1', name: 'Finance', approver: { kind: 'role', role: 'admin' }, order: 1, status: 'pending', by: null, at: null, comment: null, stamp: null }] };
    let a = AK.askRuleFor(c, 'r1', { approver: { kind: 'role', role: 'admin' }, keepStep: true });
    AK.askAnswer(c, a.id, { state: 'yes', by: BOSS, at: '2026-10-04T10:00:00.000Z', stamp: { value: 1, doc: 'x' } });
    assert.deepEqual(plain(c.approvalChain[0]), { ruleId: 'r1', name: 'Finance', approver: { kind: 'role', role: 'admin' },
      order: 1, status: 'approved', by: BOSS.name, at: '2026-10-04T10:00:00.000Z', comment: null, stamp: { value: 1, doc: 'x' } });
    /* the contract moved: the chain reads the step stale; approving again keeps the old yes on its own row */
    c.approvalChain[0].status = 'stale';
    a = AK.askRuleFor(c, 'r1', { keepStep: true });
    assert.equal(a.id, 'ar:r1:2');
    assert.equal(c.asks.find(x => x.id === 'ar:r1:1').state, 'lapsed');
    /* sent back: a new question, and the step is reset exactly as resubmitApproval reset it */
    c.approvalChain[0].status = 'rejected';
    c.asks.find(x => x.id === 'ar:r1:2').state = 'no';
    const b = AK.askRuleFor(c, 'r1', {});
    assert.equal(b.state, 'open');
    assert.equal(c.approvalChain[0].status, 'pending');
    assert.equal(c.approvalChain[0].by, null);
    assert.equal(c.approvalChain[0].stamp, null);
  });
  test('a review: the request, each verdict on its change, the hand-back', () => {
    const ch = { id: 'CHG-1', hash: 'h1', status: 'pending' };
    const c = { id: 'MK-3', changes: [ch] };
    AK.askOpen(c, { kind: 'review', id: 'REV-1', of: ['CHG-1'], by: ME, to: { id: 'u_boss', name: BOSS.name },
      due: '2026-10-09', note: 'Look', mirror: { by: ME.name, byId: ME.id, reviewer: { id: 'u_boss', name: BOSS.name, email: 'g@x' }, changeIds: ['CHG-1'] } });
    const rv = c.review.requests[0];
    assert.deepEqual(Object.keys(rv), ['id', 'at', 'by', 'byId', 'reviewer', 'note', 'due', 'changeIds', 'status', 'returnedAt', 'returnedBy', 'returnedNote'],
      'the shape the server\'s review guards compare, key for key');
    AK.askAnswer(c, 'REV-1', { part: 'CHG-1', answer: 'cleared', by: BOSS, stamp: 'h1', at: '2026-10-04T10:00:00.000Z',
      mirror: { by: BOSS.name, byId: BOSS.id } });
    assert.deepEqual(plain(ch.review), { verdict: 'cleared', note: null, by: BOSS.name, byId: BOSS.id, at: '2026-10-04T10:00:00.000Z', hash: 'h1', reviewId: 'REV-1' });
    AK.askAnswer(c, 'REV-1', { state: 'returned', by: BOSS, why: 'Fine', mirror: { tally: { cleared: 1, held: 0, advised: 0 } } });
    assert.equal(rv.status, 'returned');
    assert.equal(rv.returnedBy, BOSS.name);
    assert.equal(rv.returnedNote, 'Fine');
    assert.deepEqual(rv.tally, { cleared: 1, held: 0, advised: 0 });
    assert.equal(c.asks[0].state, 'returned');
    assert.equal(c.asks[0].parts[0].answer, 'cleared');
  });
  test('a suggestion: stamped on the change handed in, then handed back, then adopted', () => {
    const ch = { id: 'CHG-9', hash: 'h9', status: 'pending' };
    const c = { id: 'MK-4', changes: [] };
    AK.askOpen(c, { kind: 'suggest', of: ['CHG-9'], by: { id: 'u_grace', name: 'Grace Mwangi' }, to: { role: 'lead' }, target: ch, mirror: { byId: 'u_grace' } });
    assert.deepEqual(Object.keys(ch.suggested), ['by', 'byId', 'at']);
    c.changes.push(ch);
    AK.askAnswer(c, 'sg:CHG-9', { state: 'returned', by: ME, why: 'Too soft' });
    assert.equal(ch.suggested.why, 'Too soft');
    assert.equal(ch.suggested.returnedBy, ME.name);
    AK.askAnswer(c, 'sg:CHG-9', { state: 'yes', by: ME });
    assert.ok(ch.suggested.adoptedAt);
    assert.equal(ch.suggested.returnedAt, null);
    assert.equal(c.asks[0].state, 'yes');
  });
  test('a change handed in is stamped even where its question is already on the list — fail closed', () => {
    const ch = { id: 'CHG-5', status: 'pending' };
    const c = { id: 'MK-5', asks: [{ id: 'sg:CHG-5', kind: 'suggest', of: ['CHG-5'], by: { id: 'u_g', name: 'G' }, at: 'x', state: 'open' }] };
    AK.askOpen(c, { kind: 'suggest', of: ['CHG-5'], by: { id: 'u_g', name: 'G' }, target: ch });
    assert.ok(ch.suggested, 'a suggestion never travels because its row was written first');
  });
  test('bounded, and a question still waiting is never the one dropped', () => {
    const list = Array.from({ length: AK.ASK_KEEP + 5 }, (_, i) => ({ id: 'x' + i, kind: 'named', state: i < 3 ? 'open' : 'yes' }));
    const kept = AK.asksBound(list);
    assert.equal(kept.length, AK.ASK_KEEP);
    assert.ok(['x0', 'x1', 'x2'].every(id => kept.some(a => a.id === id)));
  });
});

/* ---------------------------------------------------------------------------
   (5) THE FOUR FLOWS, DRIVEN FOR REAL
   --------------------------------------------------------------------------- */
const RULE = { id: 'r-spend', name: 'Value ≥ KES 5M', order: 1,
  cond: { type: 'value', op: '>=', value: 5000000 }, approver: { kind: 'role', role: 'admin' } };
const ADMIN = { id: 'u_admin', name: 'Amina Otieno', role: 'admin' };
const LEGAL = { id: 'u_legal', name: 'Wanjiku Kamau', role: 'legal' };
const OVER = { id: 'u_over', name: 'Grace Njeri', role: 'legal' };
const LEAD = { id: 'u_lead', name: 'Asha Kimani', role: 'legal', overseerId: 'u_over', overseerOn: 'always' };
function apWorld(user, over = {}) {
  return loadViews(['js/signapproval.js', 'js/approvals.js'], {
    currentUser: () => user, canEdit: () => user.role !== 'viewer', getUsers: () => [ADMIN, LEGAL, OVER, LEAD],
    ROLE_LABEL: { admin: 'Admin', legal: 'Editor', viewer: 'Viewer' }, cKind: () => 'Contract',
    deviationSummary: () => null, fmtDT: iso => String(iso || ''), API_MODE: () => false, nowISO: () => new Date().toISOString(),
    persist() {}, saveSettings() {}, renderSignButton() {}, renderAuditSection() {}, logAudit() {}, toast() {},
    state: { contracts: [], settings: { approvalRules: [RULE] } }, ...over });
}
const deal = (over = {}) => ({ id: 'MK-9', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', folder: 'proc',
  status: 'Under Review', value: 6000000, valueType: 'standard', template: 'RM', redlineText: 'Payment within thirty (30) days.',
  format: 'text', fields: {}, metadata: {}, audit: [], comments: [], signatures: [], obligations: [], rounds: [], versions: [],
  approvalChain: null, ...over });

describe('f487 (5) the four flows leave the list and the mirrors in step', () => {
  test('a rule step refused, sent back, approved — three questions, each answered once', () => {
    const c = deal();
    apWorld(ADMIN).rejectApprovalStep(c, 'The cap is too low.');
    let rows = AK.asksOf(c, 'rule');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].state, 'no');
    assert.deepEqual(rows[0].answeredBy, { id: ADMIN.id, name: ADMIN.name }, 'with the id the chain never kept');
    assert.equal(rows[0].why, 'The cap is too low.');
    assert.equal(c.approvalChain[0].status, 'rejected');
    assert.equal(c.approvalChain[0].comment, 'The cap is too low.');
    assert.equal(apWorld(LEGAL).resubmitApproval(c, 'Raised the cap.'), true);
    rows = AK.asksOf(c, 'rule');
    assert.deepEqual(rows.map(a => a.state), ['no', 'open'], 'the refusal stays; a new question opens');
    assert.equal(c.approvalChain[0].status, 'pending');
    apWorld(ADMIN).approveContract(c);
    rows = AK.asksOf(c, 'rule');
    assert.deepEqual(rows.map(a => a.state), ['no', 'yes']);
    assert.equal(rows[1].answeredAt, c.approvalChain[0].at);
    assert.deepEqual(plain(rows[1].stamp), plain(c.approvalChain[0].stamp), 'what the yes was given for, on both');
    assert.equal(apWorld(ADMIN).approvalState(c).ok, true, 'and the chain reads approved, as it always did');
  });
  test('a voided chain lapses the rule\'s yes on the list', () => {
    const c = deal();
    apWorld(ADMIN).approveContract(c);
    c.approvalChain = null;
    assert.equal(AK.asksOf(c, 'rule')[0].state, 'lapsed');
  });
  test('a named yes asked and approved through the room\'s own verbs', async () => {
    const c = deal({ owner: { id: LEAD.id, name: LEAD.name }, value: 100 });
    const lead = apWorld(LEAD, { state: { contracts: [], settings: { approvalRules: [] } } });
    assert.equal(await lead.signApprovalRequest(c, 'Please look'), true);
    const ask = AK.asksOf(c, 'named')[0];
    assert.equal(ask.state, 'open');
    assert.deepEqual(ask.by, { id: LEAD.id, name: LEAD.name });
    assert.deepEqual(ask.to, { id: OVER.id, name: OVER.name });
    assert.equal(ask.id, c.signApprovals[0].id);
    assert.deepEqual(plain(ask.stamp), plain(c.signApprovals[0].stamp));
    const over = apWorld(OVER, { state: { contracts: [], settings: { approvalRules: [] } } });
    assert.equal(await over.signApprovalDecide(c, ask.id, 'approved', ''), true);
    const done = AK.askById(c, ask.id);
    assert.equal(done.state, 'yes');
    assert.equal(c.signApprovals[0].status, 'approved');
    assert.equal(done.answeredAt, c.signApprovals[0].decidedAt);
    /* the contract moves; asking again lapses the old question on the list */
    c.value = 200;
    assert.equal(over.signApprovalStateOf(c).rows[0].status, 'lapsed');
    assert.equal(await lead.signApprovalRequest(c, 'Again'), true);
    const named = AK.asksOf(c, 'named');
    assert.deepEqual(named.map(a => a.state), ['lapsed', 'open']);
  });

  const BODY = '<h1>Cane Supply Agreement</h1><p>Between Wanjiru Catering Ltd and Nordfrakt Logistik AB</p>'
    + '<h2>Clause 4 · Payment Terms</h2><p>Undisputed invoices are payable within thirty (30) days.</p>'
    + '<h2>Clause 6 · Liability</h2><p>Liability is capped at the fees paid in the preceding twelve months.</p>';
  const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal', email: 'wanjiru@wanjiru.co.ke' };
  const GRACE = { id: 'u_grace', name: 'Grace Mwangi', role: 'legal', email: 'grace@wanjiru.co.ke' };
  const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin', email: 'achieng@wanjiru.co.ke' };
  const EVERYONE = [ME, GRACE, BOSS];
  const contract = () => ({ id: 'MK-D3', name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB', template: 'WH',
    status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [],
    comments: [], value: 4800000, redlineText: BODY, format: 'rich' });
  const world = (user, settings = {}) => {
    const w = buildWorld({ user });
    w.win.state = { settings, contracts: [], activeId: 'MK-D3' };
    w.win.getUsers = () => EVERYONE;
    w.win.userById = id => EVERYONE.find(u => u.id === id) || null;
    w.win.saveSettings = () => {};
    return w;
  };
  const edit = (win, c, num, body, over = {}) => {
    const cl = win.negoClauseList(c).find(x => String(x.num) === String(num));
    return win.negoEditClause(c, cl.clauseId, body, { side: 'owner', summary: 'an ask', ...over });
  };
  test('an internal review asked, ruled on and handed back', async () => {
    const asMe = world(ME);
    const c = contract(); asMe.win.negoInit(c);
    const ch = await edit(asMe.win, c, 4, '<p>Payable within forty-five (45) days.</p>', { author: ME.name });
    const rv = asMe.win.reviewAsk(c, { reviewer: BOSS, note: 'Is 45 days defensible?', due: '2026-10-12' });
    let a = AK.askById(c, rv.id);
    assert.equal(a.kind, 'review');
    assert.equal(a.state, 'open');
    assert.deepEqual(a.of, [ch.id]);
    assert.deepEqual(a.by, { id: ME.id, name: ME.name });
    assert.deepEqual(a.to, { id: BOSS.id, name: BOSS.name });
    assert.equal(a.due, '2026-10-12');
    assert.equal(rv.reviewer.email, BOSS.email, 'the mirror keeps what only it holds');
    const asBoss = world(BOSS);
    assert.ok(asBoss.win.reviewMark(c, ch.id, 'held', { note: 'Keep 30' }));
    a = AK.askById(c, rv.id);
    assert.deepEqual(a.parts.map(p => [p.of, p.answer, p.why]), [[ch.id, 'held', 'Keep 30']]);
    assert.equal(c.changes.find(x => x.id === ch.id).review.verdict, 'held');
    assert.ok(asBoss.win.reviewReturn(c, { note: 'One held.' }));
    a = AK.askById(c, rv.id);
    assert.equal(a.state, 'returned');
    assert.equal(a.why, 'One held.');
    assert.deepEqual(a.answeredBy, { id: BOSS.id, name: BOSS.name });
    assert.equal(rv.status, 'returned');
    assert.deepEqual(plain(rv.tally), { cleared: 0, held: 1, advised: 0 });
  });
  test('a review taken back by the person who asked is withdrawn', async () => {
    const asMe = world(ME);
    const c = contract(); asMe.win.negoInit(c);
    await edit(asMe.win, c, 4, '<p>Payable within forty-five (45) days.</p>', { author: ME.name });
    const rv = asMe.win.reviewAsk(c, { reviewer: BOSS });
    assert.ok(asMe.win.reviewCancel(c, { reviewId: rv.id }));
    assert.equal(rv.status, 'cancelled');
    assert.equal(AK.askById(c, rv.id).state, 'withdrawn');
  });
  test('a contributor\'s suggestion: stamped in the funnel, handed back, adopted', async () => {
    const on = { deskRule: { on: true } };
    const asMe = world(ME, on);
    const c = contract(); asMe.win.negoInit(c);
    await edit(asMe.win, c, 4, '<p>Payable within forty-five (45) days.</p>', { author: ME.name });
    asMe.win.deskAddContributor(c, GRACE);
    const asGrace = world(GRACE, on);
    const ch = await edit(asGrace.win, c, 6, '<p>Liability is capped at 150% of the fees.</p>', { author: GRACE.name });
    assert.ok(ch.suggested, 'stamped');
    let a = AK.askById(c, 'sg:' + ch.id);
    assert.equal(a.state, 'open');
    assert.deepEqual(a.by, { id: GRACE.id, name: GRACE.name });
    assert.deepEqual(a.to, { role: 'lead' });
    assert.ok(asMe.win.deskReturnSuggestion(c, ch.id, 'Keep the cap at 100%.'));
    a = AK.askById(c, 'sg:' + ch.id);
    assert.equal(a.state, 'returned');
    assert.equal(a.why, 'Keep the cap at 100%.');
    assert.deepEqual(a.answeredBy, { id: ME.id, name: ME.name });
    assert.ok(asMe.win.deskAdoptSuggestion(c, ch.id));
    a = AK.askById(c, 'sg:' + ch.id);
    assert.equal(a.state, 'yes');
    assert.ok(ch.suggested.adoptedAt);
    assert.equal(ch.suggested.adoptedBy, ME.name);
  });
});

/* ---------------------------------------------------------------------------
   (6) ONE LAPSE RULE
   --------------------------------------------------------------------------- */
describe('f487 (6) one lapse rule, each kind\'s own stamp — and it fails closed', () => {
  test('what moved lapses an open question and a yes — never a refusal', () => {
    const moved = { drift: () => ['wording'] };
    assert.deepEqual(AK.askLapsed({ state: 'open' }, moved), { lapsed: true, drift: ['wording'], expired: false });
    assert.equal(AK.askLapsed({ state: 'yes' }, moved).lapsed, true);
    for (const s of ['no', 'returned', 'withdrawn', 'lapsed']) assert.equal(AK.askLapsed({ state: s }, moved).lapsed, false, s);
    assert.equal(AK.askLapsed({ state: 'yes' }, { drift: [] }).lapsed, false);
  });
  test('a yes nobody used lapses after the kind\'s own days; once signing started nothing lapses', () => {
    const old = new Date(Date.now() - 31 * 86400000).toISOString();
    assert.deepEqual(AK.askLapsed({ state: 'yes', answeredAt: old }, { unusedDays: 30 }), { lapsed: true, drift: [], expired: true });
    assert.equal(AK.askLapsed({ state: 'open', answeredAt: old }, { unusedDays: 30 }).lapsed, false, 'only a yes expires');
    assert.equal(AK.askLapsed({ state: 'yes' }, { drift: ['value'], started: true }).lapsed, false);
  });
  test('every kind asks it, on both hosts', () => {
    assert.match(strip(R('js/signapproval.js')), /_saLapsed\(\)\(\{ state: status === 'approved' \? 'yes' : 'open'/);
    assert.match(strip(R('js/approvals.js')), /askLapsed\(\{ state:'yes' \},\{ drift:\(\)=>approvalDrift\(step, c\) \}\)/);
    assert.match(strip(R('js/approvals.js')), /askLapsed\(\{ state:'yes' \},\{ drift:\(\)=>approvalDrift\(s,c\) \}\)\.lapsed/);
    assert.match(strip(R('js/review.js')), /rule\(\{ state: 'yes' \}, \{ drift: \(\) => String\(v\.hash\) !== String\(ch\.hash\)/);
    const SRV = strip(R('server/server.js'));
    assert.match(SRV, /const rvStale = ch => \{[\s\S]{0,200}askLapsed\(/);
    assert.match(SRV, /function srvRuleYesLapsed\(step, now\) \{[\s\S]{0,200}askLapsed\(/);
    assert.ok(!/String\(st\.doc \|\| ''\) !== now\.doc\)\) open\.push/.test(SRV), 'no second copy of the rule step\'s lapse');
  });
  test('each kind behaves as it did: the named yes', () => {
    const c = { id: 'MK-1', value: 100, redlineText: 'x', owner: { id: 'u_lead' } };
    const need = [{ key: 'u_over', approverId: 'u_over', people: [] }];
    const req = over => ({ id: 'sa_1', key: 'u_over', approverId: 'u_over', status: 'approved', askedBy: { id: 'u_lead' },
      askedAt: new Date().toISOString(), decidedAt: new Date().toISOString(), stamp: SA.saStamp(c), ...over });
    c.signApprovals = [req()];
    assert.equal(SA.saState(c, need).rows[0].status, 'approved');
    c.signApprovals = [req({ decidedAt: new Date(Date.now() - (SA.SA_UNUSED_DAYS + 1) * 86400000).toISOString() })];
    assert.deepEqual([SA.saState(c, need).rows[0].status, SA.saState(c, need).rows[0].expired], ['lapsed', true]);
    c.signApprovals = [req({ stamp: SA.saStamp({ ...c, value: 5 }) })];
    assert.deepEqual(SA.saState(c, need).rows[0].drift, ['value']);
    assert.equal(SA.saState({ ...c, signatures: [{ name: 'x' }] }, need).rows[0].status, 'approved', 'started: nothing lapses');
  });
  test('without the rule loaded, a named yes reads lapsed and a clear reads moved — closed, not open', () => {
    const sb = { console, Date, Math, JSON, String, Number, Object, Array, Set, Map, Boolean, RegExp, Error };
    sb.window = sb;
    vm.createContext(sb);
    vm.runInContext(R('js/signapproval.js'), sb, { filename: 'js/signapproval.js' });
    const c = { id: 'MK-1', value: 100, redlineText: 'x' };
    c.signApprovals = [{ id: 'sa_1', key: 'k', approverId: 'a', status: 'approved', askedBy: { id: 'l' },
      decidedAt: new Date().toISOString(), stamp: sb.saStamp(c) }];
    assert.equal(sb.saState(c, [{ key: 'k', approverId: 'a', people: [] }]).rows[0].status, 'lapsed',
      'a stage without js/asks.js holds the signature rather than letting it through');
    const rv = { console, Date, Math, JSON, String, Number, Object, Array, Set, Map, Boolean, RegExp, Error, i18t: k => k, i18tn: k => k };
    rv.window = rv;
    vm.createContext(rv);
    vm.runInContext(R('js/review.js'), rv, { filename: 'js/review.js' });
    assert.equal(rv.reviewStale({ hash: 'h1', review: { verdict: 'cleared', hash: 'h1' } }), true,
      'a clear is a question again; a hold, which never reads this, stays a hold');
  });
});

/* ---------------------------------------------------------------------------
   (7) IT NEVER TRAVELS
   --------------------------------------------------------------------------- */
describe('f487 (7) the list never reaches the other side', () => {
  test('the real share payload carries no asks, and no name from one', async () => {
    const W = new JSDOM('<!doctype html><body></body>', { url: 'https://hati.test/' }).window;
    const s = loadViews(['js/richdoc.js', 'js/redline.js', 'js/clausemodel.js', 'js/negotiation.js', 'js/review.js', 'js/core.js'],
      { TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS, document: W.document, crypto: W.crypto, NodeFilter: W.NodeFilter,
        Node: W.Node, DOMParser: W.DOMParser });
    const ME = { id: 'u_wanjiru', name: 'Wanjiru Kamau', role: 'legal' };
    const BOSS = { id: 'u_boss', name: 'Achieng Otieno', role: 'admin' };
    s.currentUser = () => ME; s.getUsers = () => [ME, BOSS];
    s.state = { settings: {}, contracts: [] };
    s.logAudit = (c, action, detail) => { (c.audit = c.audit || []).push({ action, detail }); };
    s.persist = () => {}; s.toast = () => {};
    const c = { id: 'MK-R1', name: 'Cane Supply Agreement', counterparty: 'Nordfrakt Logistik AB', template: 'WH',
      status: 'Under Review', folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [],
      comments: [], value: 4800000, format: 'rich',
      redlineText: '<h1>Cane</h1><h2>Clause 4 · Payment Terms</h2><p>Payable within thirty (30) days.</p>' };
    s.negoInit(c);
    const cl = s.negoClauseList(c).find(x => x.num === '4');
    await s.negoEditClause(c, cl.clauseId, '<p>Payable within forty-five (45) days.</p>', { side: 'owner', author: ME.name, summary: 'net-45' });
    s.reviewAsk(c, { reviewer: BOSS });
    assert.ok(Array.isArray(c.asks) && c.asks.length, 'the record has a list to leak');
    const raw = JSON.stringify(s.buildSharePayload(c, 'hash', { org: 'Wanjiru Catering Ltd', sharedBy: ME.name }));
    assert.ok(!/"asks":/.test(raw), 'buildSharePayload is an allow-list, and asks is not on it');
    assert.ok(!/Achieng Otieno/.test(raw), 'nor the name of anybody asked');
  });
});
