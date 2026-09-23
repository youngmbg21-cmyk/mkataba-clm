/* ============================================================
   f375 — approval before signing (Young ruled 23 Sep 2026: "Implement
   scenario 2")
   ============================================================
   An admin marks a person whose contracts may not be signed until a named
   colleague approves them, whatever the value. The lead SENDS it for
   approval right before signing, the approver decides (a refusal says why),
   a real change afterwards lapses the approval, and nobody — not our signer,
   not the other side's link, not a paper copy — signs before it is given.

   Two halves:
     (1) the reading, js/signapproval.js, which BOTH hosts load — asked here
         directly, with no stage around it;
     (2) the server, driven over HTTP with real sessions: the person's fields,
         the transport, the merge that guards every request and decision, the
         wall at the first signature, the held signing link, the neutral
         refusal the other side sees, the notices and the reminders.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const SA = require('../js/signapproval.js');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

/* ---------------------------------------------------------------------------
   (1) THE READING
   --------------------------------------------------------------------------- */
const U = { id: 'u_d', name: 'David Kiptoo', role: 'legal' };
const A = { id: 'u_a', name: 'Amina Otieno', role: 'admin' };
const E = { id: 'u_e', name: 'Erik Lindqvist', role: 'admin' };
const W2 = { id: 'u_w', name: 'Wanjiku Kamau', role: 'legal' };
const people = (over = {}) => [{ ...U, overseerId: A.id, overseerOn: 'always', overseerBackupId: E.id, ...over }, A, E, W2];
const deal = (over = {}) => ({ id: 'MK-231', name: 'Pallet Wrap Supply', counterparty: 'Mto Packaging Ltd',
  party: 'Highland Corporate Ltd', value: 450000, valueType: 'standard', metadata: { currency: 'KES' },
  fields: { effDate: '2026-10-01' }, expiry: '2026-12-31', template: 'RM',
  redlineText: '<p>1.1 The Supplier <b>shall</b> supply stretch film.</p>', format: 'rich',
  owner: { id: U.id, name: U.name }, signatures: [],
  signerPlan: [{ id: 's1', party: 'internal', name: U.name, memberId: U.id, order: 1 },
    { id: 's2', party: 'counterparty', name: 'Grace Wanjiru', email: 'grace@mto.co.ke', order: 2 }], ...over });

describe('f375 (1) the rule lives on the person', () => {
  test('1a Always and Off are answers; an absent answer reads the old workspace switch', () => {
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y', overseerOn: 'always' }, false).on, true);
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y', overseerOn: 'off' }, true).on, false);
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y' }, true).on, true, 'nobody answered, the switch was on');
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y' }, false).on, false, 'nobody answered, the switch was off');
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y' }, true).answered, false);
  });
  test('1b nobody approves their own contracts, and a backup is somebody else', () => {
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'x', overseerOn: 'always' }).on, false);
    assert.equal(SA.saRuleOf({ id: 'x', overseerOn: 'always' }).on, false, 'no approver, no rule');
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y', overseerOn: 'always', overseerBackupId: 'y' }).backupId, '');
    assert.equal(SA.saRuleOf({ id: 'x', overseerId: 'y', overseerOn: 'always', overseerBackupId: 'x' }).backupId, '');
  });
  test('1c it bites when they lead, when they are named to sign, or both — absent is both', () => {
    assert.deepEqual(SA.saWhenOf(null), { lead: true, sign: true });
    assert.deepEqual(SA.saWhenOf('lead'), { lead: true, sign: false });
    assert.deepEqual(SA.saWhenOf('sign'), { lead: false, sign: true });
    assert.deepEqual(SA.saWhenOf('nonsense'), { lead: true, sign: true }, 'a rule that silently never bites is the fault');
  });
});

describe('f375 (2) who on a contract needs it', () => {
  test('2a the lead and the named signer, grouped by approver', () => {
    const n = SA.saNeeds(deal(), people(), false);
    assert.equal(n.length, 1);
    assert.equal(n[0].approverId, A.id);
    assert.equal(n[0].backupId, E.id);
    assert.deepEqual(n[0].people.map(p => p.id), [U.id]);
    assert.deepEqual(n[0].people[0].why, ['lead', 'sign']);
  });
  test('2b "lead only" does not bite on a contract they only sign', () => {
    const c = deal({ owner: { id: W2.id, name: W2.name } });
    assert.equal(SA.saNeeds(c, people({ overseerWhen: 'lead' }), false).length, 0);
    assert.equal(SA.saNeeds(c, people({ overseerWhen: 'sign' }), false).length, 1);
  });
  test('2c a route row with no member id is matched by an exact name, once', () => {
    const c = deal({ owner: null, signerPlan: [{ id: 's1', party: 'internal', name: 'david kiptoo' }] });
    assert.equal(SA.saNeeds(c, people(), false).length, 1);
    const twins = [...people(), { id: 'u_d2', name: 'David Kiptoo', role: 'legal' }];
    assert.equal(SA.saNeeds(c, twins, false).length, 0, 'two people called the same thing is a question, not an answer');
  });
  test('2d an approver who has left: the backup steps up; with nobody, an admin decides', () => {
    const noA = people().filter(u => u.id !== A.id);
    const n = SA.saNeeds(deal(), noA, false);
    assert.equal(n[0].approverId, E.id, 'the backup steps up');
    const none = people({ overseerBackupId: null }).filter(u => u.id !== A.id);
    const m = SA.saNeeds(deal(), none, false);
    assert.equal(m.length, 1, 'the rule does not leave with the approver');
    assert.equal(m[0].key, 'admin');
    assert.equal(m[0].approverId, '');
  });
  test('2e a contract nobody leads and nobody marked signs needs nothing', () => {
    assert.equal(SA.saNeeds(deal({ owner: null, signerPlan: [] }), people(), false).length, 0);
  });
});

describe('f375 (3) an approval is OF something', () => {
  test('3a formatting alone moves nothing', () => {
    const c = deal(), s = SA.saStamp(c);
    const bold = deal({ redlineText: '<p>1.1 The Supplier <i>shall</i> supply   stretch film.</p>' });
    assert.deepEqual(SA.saDrift(s, bold), []);
  });
  test('3b wording, value, currency, dates, parties and signers each move it, and are named', () => {
    const s = SA.saStamp(deal());
    assert.deepEqual(SA.saDrift(s, deal({ redlineText: '<p>1.1 The Supplier may supply stretch film.</p>' })), ['wording']);
    assert.deepEqual(SA.saDrift(s, deal({ value: 480000 })), ['value']);
    assert.deepEqual(SA.saDrift(s, deal({ metadata: { currency: 'USD' } })), ['currency']);
    assert.deepEqual(SA.saDrift(s, deal({ expiry: '2027-03-31' })), ['dates']);
    assert.deepEqual(SA.saDrift(s, deal({ counterparty: 'Other Ltd' })), ['parties']);
    assert.ok(SA.saDrift(s, deal({ signerPlan: [{ id: 's1', party: 'internal', name: 'Somebody Else', order: 1 }] })).includes('signers'));
  });
});

describe('f375 (4) where it stands', () => {
  const need = () => SA.saNeeds(deal(), people(), false);
  const req = (c, over = {}) => ({ id: 'sa_1', key: A.id, approverId: A.id, approverName: A.name, backupId: E.id,
    people: [{ id: U.id, name: U.name, why: ['lead', 'sign'] }], status: 'pending',
    askedBy: { id: U.id, name: U.name }, askedAt: new Date().toISOString(), stamp: SA.saStamp(c), ...over });
  test('4a unasked, then pending, then approved — and only approved is ok', () => {
    const c = deal();
    assert.equal(SA.saState(c, need()).rows[0].status, 'unasked');
    assert.equal(SA.saState(c, need()).ok, false);
    c.signApprovals = [req(c)];
    assert.equal(SA.saState(c, need()).rows[0].status, 'pending');
    c.signApprovals = [req(c, { status: 'approved', decidedAt: new Date().toISOString() })];
    assert.equal(SA.saState(c, need()).ok, true);
  });
  test('4b a real change lapses an approval, and a waiting request too', () => {
    const c = deal();
    c.signApprovals = [req(c, { status: 'approved', decidedAt: new Date().toISOString() })];
    c.value = 480000;
    const r = SA.saState(c, need()).rows[0];
    assert.equal(r.status, 'lapsed');
    assert.deepEqual(r.drift, ['value']);
    c.signApprovals = [req(deal())];
    assert.equal(SA.saState(c, need()).rows[0].status, 'lapsed', 'the approver would approve something nobody asked about');
  });
  test('4c an approval nobody used within SA_UNUSED_DAYS has lapsed', () => {
    const c = deal();
    const old = new Date(Date.now() - (SA.SA_UNUSED_DAYS + 1) * 86400000).toISOString();
    c.signApprovals = [req(c, { status: 'approved', decidedAt: old })];
    const r = SA.saState(c, need()).rows[0];
    assert.equal(r.status, 'lapsed');
    assert.equal(r.expired, true);
  });
  test('4d a withdrawn request leaves it unasked; a refusal is its own state', () => {
    const c = deal();
    c.signApprovals = [req(c, { status: 'withdrawn' })];
    assert.equal(SA.saState(c, need()).rows[0].status, 'unasked');
    c.signApprovals = [req(c, { status: 'refused', decision: 'Ask for 45 days' })];
    assert.equal(SA.saState(c, need()).rows[0].status, 'refused');
  });
  test('4e once signing has started, nothing here refuses the route in progress', () => {
    const c = deal({ signatures: [{ name: U.name }] });
    assert.equal(SA.saState(c, need()).ok, true);
    assert.equal(SA.saState(deal(), need(), { responded: true }).ok, true, 'their signed response counts too');
  });
});

describe('f375 (5) who may decide', () => {
  const r = { approverId: A.id, backupId: E.id, askedBy: { id: U.id }, people: [{ id: U.id }] };
  test('5a the approver, the backup, an admin — never the person who asked or the person it is about', () => {
    assert.equal(SA.saMayDecide(r, A), 'approver');
    assert.equal(SA.saMayDecide(r, E), 'backup');
    assert.equal(SA.saMayDecide({ ...r, backupId: '' }, E), 'admin');
    assert.equal(SA.saMayDecide(r, U), null);
    assert.equal(SA.saMayDecide({ ...r, askedBy: { id: W2.id } }, U), null, 'the person it is about cannot approve it');
    assert.equal(SA.saMayDecide(r, W2), null);
  });
  test('5b working days skip the weekend', () => {
    const fri = '2026-09-25T10:00:00';
    assert.equal(SA.saWorkdays(fri, Date.parse('2026-09-28T09:00:00')), 1, 'Friday to Monday is one working day');
    assert.equal(SA.saWorkdays(fri, Date.parse('2026-10-02T09:00:00')), 5);
  });
});

describe('f375 (6) the screens ask the one reading', () => {
  const AP = read('js/approvals.js');
  const CT = read('js/views/contract.js');
  test('6a the chain draws the personal step off the requests, never off the old chain', () => {
    assert.match(AP, /let sa=null; try\{ sa=signApprovalStateOf\(c\); \}catch\(_\)\{ sa=null; \}/);
    assert.ok(!/const ov=overseerFor\(c\);\s*\n\s*if\(ov\)\{/.test(AP), 'the old owner-only step is gone from the chain');
  });
  test('6b approve and refuse press one door whatever is waiting', () => {
    assert.match(AP, /const mine=signApprovalDecidable\(c\);\s*\n\s*if\(mine\.length\) return signApprovalDecide\(c, mine\[0\]\.req\.id, 'approved', comment\);/);
    assert.match(AP, /if\(mine\.length\) return signApprovalDecide\(c, mine\[0\]\.req\.id, 'refused', comment\);/);
  });
  test('6c the blocker list carries it, and the paper-final question asks that list without its own rows', () => {
    assert.match(CT, /add\('signapproval', signApprovalBlockLabel\(c,r\), i18t\('sa_block_short'\), \{ rowKey:r\.rowKey, sa:r \}\)/);
    assert.match(AP, /signBlockers\(c,\{ noSa:true \}\)/);
    assert.match(CT, /if\(!noSa\) try\{/);
  });
  test('6d the Sign button sends for approval only where that is all that is left', () => {
    assert.match(CT, /const saOnly=holdsN>0 && rd\.holds\.every\(r=>r\.kind==='signapproval'\);/);
    assert.match(CT, /else if\(saAsk && window\.openSignApprovalDialog\) openSignApprovalDialog\(c\);/);
  });
  test('6e a negotiation link is never stopped by it — only the signing link is held', () => {
    /* MEASURED, not pinned: the share dialog's readiness list is run with a
       chain whose rule steps have cleared and whose personal step is next,
       then refused, then lapsed. None of the three may put an approval line
       on the list a negotiation is sent from — a refusal usually says "ask
       them for 45 days", which is a round that has to go out. A refused RULE
       step still blocks, as it always did (the control). */
    const { loadViews } = require('./dom');
    const CORE = read('js/core.js');
    const readiness = (ap) => {
      const sb = loadViews(['js/obligations.js'], {
        state: { contracts: [], settings: {} }, approvalState: () => ap,
        isMonetary: x => x.valueType !== 'none', isUpload: () => false, docBody: () => '<p>ok</p>',
        readOnlyDocHtml: h => h, contractPlaceholders: () => [], SIGN_ROUTE_ON: false,
      });
      const body = CORE.slice(CORE.indexOf('function contractReadiness(c){'));
      require('node:vm').runInContext(body.slice(0, body.indexOf('\nconst readinessBlocks')), sb, { filename: 'core-readiness' });
      return sb.contractReadiness({ id: 'MK-9', name: 'Refined Sugar Supply', counterparty: 'Kabras Sugar', status: 'Under Review',
        value: 6000000, valueType: 'standard', template: 'RM', redlineText: 'Payment within thirty (30) days.', format: 'text',
        fields: {}, metadata: {}, audit: [], comments: [], signatures: [], obligations: [], rounds: [], versions: [], compliance: { consent: true } });
    };
    const said = list => list.filter(x => /approv/i.test(x.label)).map(x => `${x.severity}:${x.label}`).join(' | ');
    const rule = { name: 'Value ≥ KES 5M', status: 'approved' };
    const sa = st => ({ sa: true, name: 'David Kiptoo’s contracts', status: st });
    for (const st of ['pending', 'rejected', 'stale']) {
      const step = sa(st);
      const ap = { required: true, ok: false, chain: [rule, step], next: step, approverLabel: 'Amina Otieno',
        rejected: st === 'rejected' ? [step] : [], stale: st === 'stale' ? [step] : [] };
      assert.equal(said(readiness(ap)), '', `a personal approval ${st} put an approval line on the negotiation's list`);
    }
    const refusedRule = { name: 'Value ≥ KES 5M', status: 'rejected', by: 'Amina Otieno' };
    const ctl = readiness({ required: true, ok: false, chain: [refusedRule], next: refusedRule, rejected: [refusedRule], stale: [] });
    assert.match(said(ctl), /^block:.*refused/i, '[control] a refused RULE step still blocks');
    assert.match(CORE, /if\(saHeld\)\{ toast\(saHeld,'err'\); return false; \}/);
  });
  test('6f the workspace switch left the approvals panel; the person drawer holds the rule', () => {
    const SET = read('js/views/settings.js');
    assert.ok(!/id="ov-rule-on"/.test(SET));
    assert.match(SET, /data-sa-set="always"/);
    assert.match(SET, /id="tm-sa-backup"/);
    assert.match(SET, /id="tm-sa-lead"/);
    assert.match(SET, /id="tm-sa-sign"/);
  });
  test('6g every word is in both books', () => {
    const I = require('../js/i18n.js').STRINGS;
    const used = new Set();
    for (const f of ['js/approvals.js', 'js/views/contract.js', 'js/views/settings.js', 'js/views/approvalsview.js', 'js/app.js'])
      for (const m of read(f).matchAll(/'((?:sa|al_sa)_[a-z0-9_]+)'/g)) used.add(m[1]);
    for (const k of ['sa_mv_wording', 'sa_mv_currency', 'sa_mv_dates', 'sa_mv_parties', 'sa_mv_signers', 'sa_card_checks_open_one', 'sa_card_checks_open_other'])
      used.add(k);
    const missing = [...used].filter(k => !k.endsWith('_') && !(k in I.en || k + '_one' in I.en));
    assert.deepEqual(missing, [], 'English');
    const missingSv = [...used].filter(k => !k.endsWith('_') && !(k in I.sv || k + '_one' in I.sv));
    assert.deepEqual(missingSv, [], 'Swedish');
  });
});

/* ---------------------------------------------------------------------------
   (2) THE SERVER
   --------------------------------------------------------------------------- */
describe('f375 (7) the server is the wall', () => {
  let h, W, adminId, U1, R1, N1;
  const get = (cl, id) => cl.json('/api/contracts/' + id);
  const put = async (cl, c) => { const v = c._v; const body = { ...c }; delete body._v;
    return cl.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion: v } }); };
  const sigOf = u => ({ name: u.name, email: u.email, method: 'session-authenticated', at: new Date().toISOString(),
    identity: `session:${u.id}` });
  const payloadFor = id => ({ kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign', org: 'Highland Corporate Ltd',
    sharedBy: 'Unrestricted Legal', at: new Date().toISOString(), contract: { id, name: 'x', docText: 'Article 1' } });
  const mkSign = (cl, id) => cl.raw('/api/shares', { method: 'POST', body: { payload: payloadFor(id), channel: 'link',
    recipient: { name: 'Grace Wanjiru', email: 'grace@mto.co.ke' }, expiryDays: 30, durable: false, purpose: 'sign' } });
  const outbox = async () => ((await W.admin.json('/api/outbox')).items || []);

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h);
    adminId = (await W.admin.json('/api/bootstrap')).me.id;
    U1 = W.users.unrestricted; R1 = W.users.restricted; N1 = W.users.novalues;
    /* The lead and the named signer on two folder-A contracts. */
    for (const id of ['MK-A2']) {
      const c = await get(W.admin, id);
      c.owner = { id: U1.id, name: U1.name };
      c.signerPlan = [{ id: 'sg1', party: 'internal', name: U1.name, memberId: U1.id, email: U1.email, order: 1, signed: false },
        { id: 'sg2', party: 'counterparty', name: 'Grace Wanjiru', email: 'grace@mto.co.ke', order: 2, signed: false }];
      const r = await put(W.admin, c);
      assert.equal(r.status, 200, r.text);
    }
  });
  after(async () => { await h.stop(); });

  let token = null;
  test('7a a signing link made before the rule was on still carries nothing — and says only "not ready"', async () => {
    const r = await mkSign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 200, r.text);
    token = r.json.token;
    assert.ok(token);
  });

  test('7b an admin sets the rule on the person; the person may not; nonsense is refused', async () => {
    const self = await W.unrestricted.raw('/api/users/' + U1.id, { method: 'PATCH', body: { overseerOn: 'off' } });
    assert.equal(self.status, 403, 'somebody who could switch off their own approval is not overseen');
    const bad = await W.admin.raw('/api/users/' + U1.id, { method: 'PATCH', body: { overseerOn: 'always' } });
    assert.equal(bad.status, 400, 'on with nobody to approve');
    const r = await W.admin.json('/api/users/' + U1.id, { method: 'PATCH', body: { overseerId: R1.id } });
    assert.equal(r.user.overseerId, R1.id);
    const same = await W.admin.raw('/api/users/' + U1.id, { method: 'PATCH', body: { overseerOn: 'always', overseerBackupId: R1.id } });
    assert.equal(same.status, 400, 'the backup is somebody other than the approver');
    const when = await W.admin.raw('/api/users/' + U1.id, { method: 'PATCH', body: { overseerOn: 'always', overseerWhen: 'sometimes' } });
    assert.equal(when.status, 400);
    const ok = await W.admin.json('/api/users/' + U1.id, { method: 'PATCH',
      body: { overseerOn: 'always', overseerBackupId: N1.id, overseerWhen: 'sign,lead' } });
    assert.equal(ok.user.overseerOn, 'always');
    assert.equal(ok.user.overseerBackupId, N1.id);
    assert.equal(ok.user.overseerWhen, 'lead,sign', 'stored in one order');
  });

  test('7c the rule is an admin-only fact about the person; the need is a fact about the contract', async () => {
    const boot = await W.restricted.json('/api/bootstrap');
    const them = boot.users.find(u => u.id === U1.id);
    for (const k of ['overseerId', 'overseerOn', 'overseerBackupId', 'overseerWhen']) assert.ok(!(k in them), k);
    const c = await get(W.restricted, 'MK-A2');
    assert.ok(Array.isArray(c._signNeeds));
    assert.equal(c._signNeeds.length, 1);
    assert.equal(c._signNeeds[0].approverId, R1.id);
    const list = await W.restricted.json('/api/contracts?limit=50');
    assert.ok(list.rows.find(x => x.id === 'MK-A2')._signNeeds.length === 1, 'and the list carries it for Home and the bell');
  });

  test('7d nobody signs before the approval — in the app, on paper, or on their link', async () => {
    let c = await get(W.unrestricted, 'MK-A2');
    c.signatures = [sigOf(U1)];
    let r = await put(W.unrestricted, c);
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.signApproval, true);
    assert.match(r.json.error, /Restricted Legal/);
    c = await get(W.unrestricted, 'MK-A2');
    c.status = 'Signed'; c.execution = { method: 'paper', at: new Date().toISOString() };
    r = await put(W.unrestricted, c);
    assert.equal(r.status, 403, 'a signature on paper is still a signature');
    r = await mkSign(W.unrestricted, 'MK-A2');
    assert.equal(r.status, 409, 'no new signing link');
    assert.equal(r.json.signApproval, true);
    r = await h.client('them').raw('/api/shares/' + token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: 'MK-A2', action: 'sign', name: 'Grace Wanjiru', email: 'grace@mto.co.ke', at: new Date().toISOString() } });
    assert.equal(r.status, 409);
    assert.equal(r.json.notReady, true);
    assert.ok(!/Restricted|approv/i.test(r.json.error), 'the other side never learns an approval exists: ' + r.json.error);
  });

  test('7e a request is sent in your own name, to the approver the RULE names, and stamped by the server', async () => {
    let c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals = [{ id: 'sa_forged', key: R1.id, status: 'pending', askedBy: { id: adminId, name: 'Amina' } }];
    let r = await put(W.unrestricted, c);
    assert.equal(r.status, 403, 'not in somebody else\'s name');
    c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals = [{ id: 'sa_pre', key: R1.id, status: 'approved', askedBy: { id: U1.id } }];
    r = await put(W.unrestricted, c);
    assert.equal(r.status, 403, 'a request cannot arrive already approved');
    c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals = [{ id: 'sa_friend', key: adminId, status: 'pending', askedBy: { id: U1.id } }];
    r = await put(W.unrestricted, c);
    assert.equal(r.status, 403, 'not to a friendlier approver');
    c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals = [{ id: 'sa_t1', key: R1.id, approverId: adminId, status: 'pending', askedBy: { id: U1.id, name: U1.name },
      note: 'Standard terms.', stamp: { value: '1' } }];
    r = await put(W.unrestricted, c);
    assert.equal(r.status, 200, r.text);
    c = await get(W.admin, 'MK-A2');
    const q = c.signApprovals[0];
    assert.equal(q.approverId, R1.id, 'the rule\'s approver, whatever the request said');
    assert.equal(q.backupId, N1.id);
    assert.notEqual(q.stamp.value, '1', 'the server stamped what it is OF');
    assert.equal(q.stamp.value, '36000000');
    assert.equal(q.note, 'Standard terms.');
  });

  test('7f the notice goes to the address the record names, and "sent" means sent', async () => {
    const bad = await W.unrestricted.raw('/api/contracts/MK-A2/sign-approval-notify', { method: 'POST',
      body: { kind: 'ask', reqId: 'sa_t1', email: 'attacker@evil.test' } });
    assert.equal(bad.status, 400, 'no body address — the open-relay rule');
    const r = await W.unrestricted.json('/api/contracts/MK-A2/sign-approval-notify', { method: 'POST', body: { kind: 'ask', reqId: 'sa_t1' } });
    assert.equal(r.emailSent, false, 'no provider here');
    assert.equal(r.outbox, true, 'so it is in the outbox, and said to be');
    const mail = (await outbox()).find(m => m.to_addr === 'restricted@example.co.ke' && /Please approve/.test(m.subject));
    assert.ok(mail, 'the approver was written to');
    assert.match(mail.body, /Standard terms\./);
    await W.unrestricted.json('/api/contracts/MK-A2/sign-approval-notify', { method: 'POST', body: { kind: 'remind', reqId: 'sa_t1' } });
    const again = await W.unrestricted.raw('/api/contracts/MK-A2/sign-approval-notify', { method: 'POST', body: { kind: 'remind', reqId: 'sa_t1' } });
    assert.equal(again.status, 429, 'one reminder a day');
  });

  test('7g the person who asked cannot approve it; a refusal says why; an admin says why', async () => {
    const decide = async (cl, status, decision) => {
      const c = await get(cl, 'MK-A2');
      const me = (await cl.json('/api/bootstrap')).me;
      c.signApprovals = c.signApprovals.map(x => x.id === 'sa_t1'
        ? { ...x, status, decision, decidedBy: { id: me.id, name: me.name } } : x);
      return put(cl, c);
    };
    assert.equal((await decide(W.unrestricted, 'approved', '')).status, 403, 'you cannot approve your own request');
    assert.equal((await decide(W.restricted, 'refused', '')).status, 400, 'a refusal needs a reason');
    assert.equal((await decide(W.admin, 'approved', '')).status, 400, 'an admin in the approver\'s place says why');
    const r = await decide(W.restricted, 'refused', 'Ask Mto for 45 days to pay.');
    assert.equal(r.status, 200, r.text);
    const c = await get(W.admin, 'MK-A2');
    assert.equal(c.signApprovals[0].status, 'refused');
    assert.equal(c.signApprovals[0].decidedBy.id, R1.id, 'stamped by the server');
    const told = await W.restricted.json('/api/contracts/MK-A2/sign-approval-notify', { method: 'POST', body: { kind: 'decided', reqId: 'sa_t1' } });
    assert.equal(told.name, U1.name);
    const back = (await outbox()).find(m => m.to_addr === 'everything@example.co.ke' && /Approval refused/.test(m.subject));
    assert.ok(back);
    assert.match(back.body, /45 days/);
  });

  test('7h asked again and approved: signing opens, and a stale copy cannot take the approval back', async () => {
    let c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals.push({ id: 'sa_t2', key: R1.id, status: 'pending', askedBy: { id: U1.id, name: U1.name } });
    assert.equal((await put(W.unrestricted, c)).status, 200);
    const stale = await get(W.unrestricted, 'MK-A2');
    c = await get(W.restricted, 'MK-A2');
    c.signApprovals = c.signApprovals.map(x => x.id === 'sa_t2'
      ? { ...x, status: 'approved', decision: '', decidedBy: { id: R1.id, name: R1.name } } : x);
    assert.equal((await put(W.restricted, c)).status, 200);
    /* The lead's browser still holds the waiting copy. */
    const fresh = await get(W.unrestricted, 'MK-A2');
    stale._v = fresh._v;
    stale.lastAction = 'touched';
    assert.equal((await put(W.unrestricted, stale)).status, 200);
    c = await get(W.admin, 'MK-A2');
    assert.equal(c.signApprovals.find(x => x.id === 'sa_t2').status, 'approved', 'the stored decision stands');
    assert.equal((await mkSign(W.unrestricted, 'MK-A2')).status, 200, 'the signing link can be made now');
  });

  test('7i a real change lapses it — the signature is refused again until it is re-approved', async () => {
    let c = await get(W.admin, 'MK-A2');
    c.value = 38000000; c.metadata = { ...(c.metadata || {}), value: 38000000 };
    assert.equal((await put(W.admin, c)).status, 200);
    c = await get(W.unrestricted, 'MK-A2');
    c.signatures = [sigOf(U1)];
    const r = await put(W.unrestricted, c);
    assert.equal(r.status, 403);
    assert.match(r.json.error, /changed after/i);
  });

  test('7j the reminders nobody has to remember: two working days, then five', async () => {
    let c = await get(W.unrestricted, 'MK-A2');
    c.signApprovals.push({ id: 'sa_t3', key: R1.id, status: 'pending', askedBy: { id: U1.id, name: U1.name } });
    assert.equal((await put(W.unrestricted, c)).status, 200);
    /* Backdate the ask, as a week passing would. */
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const row = db.prepare("SELECT json FROM contracts WHERE id='MK-A2'").get();
    const j = JSON.parse(row.json);
    j.signApprovals.find(x => x.id === 'sa_t3').askedAt = new Date(Date.now() - 12 * 86400000).toISOString();
    db.prepare("UPDATE contracts SET json=? WHERE id='MK-A2'").run(JSON.stringify(j));
    db.close();
    const run = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(run.signApproval && run.signApproval.checked >= 1, JSON.stringify(run.signApproval));
    const mails = await outbox();
    assert.ok(mails.some(m => m.to_addr === 'restricted@example.co.ke' && /Reminder/.test(m.subject)), 'the approver is reminded');
    assert.ok(mails.some(m => m.to_addr === 'novalues@example.co.ke' && /waited/.test(m.subject)), 'and the backup is told');
    assert.ok(!mails.some(m => m.to_addr === 'novalues@example.co.ke' && /36,000,000|38,000,000/.test(m.body)),
      'a backup who may not see money is not sent it');
    const n = mails.length;
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.equal((await outbox()).length, n, 'once each, however many sweeps');
  });
});
