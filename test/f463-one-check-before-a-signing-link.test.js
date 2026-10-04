/* ============================================================
   f463 — ONE CHECK BEFORE A SIGNING LINK LEAVES, AND THE WALL AGREES
   ============================================================
   The process review's signing-links stream (4 Oct 2026). Four findings:
     1. A signing link was minted by four doors and each asked its own subset
        of the checks. Now every door asks signLinkRefusal (js/core.js).
     2. POST /api/shares did not ask the desk, the hold or the check before
        signing, so a link could be issued and refused at signing a day later.
     3. The counterparty's respond route read OUR sign-check reason out to
        them (which standard we departed from, who accepted it). Now it says
        the approval wall's neutral sentence and the reason goes on our trail.
     4. On the default gate (advise) the browser and the server disagreed. One
        rule now, in js/signgate.js, loaded by both hosts:
          · the contract is held by an escalated departure not accepted by the
            colleague it went to (or an admin), or accepted against wording
            that has since moved;
          · our in-app signer is held by a brief that stands for this wording
            and that they have not read.
   Every server claim below is driven against a running server; each was red
   against the parent (no sgDepartures, no wall at /api/shares, the detailed
   reason at respond).
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildWorld } = require('./world');
const { startHati, seedWorkspace, nameASigner } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const SG = require('../js/signgate.js');
const CORE = strip(read('js/core.js'));
const SERVER = strip(read('server/server.js'));

const day = n => new Date(Date.now() + n * 86400000).toISOString();
const verdicts = () => ([
  { category: 'Payment terms', status: 'deviation', escalate: true, escalation: { to: { id: 'u-fd', name: 'FD' } } },
  { category: 'Liability cap', status: 'deviation' },
  { category: 'Governing law', status: 'missing', escalate: true,
    accepted: { at: day(-1), by: 'Nobody', byId: 'u-x', why: 'ok' } },
  { category: 'Notice', status: 'deviation', escalate: true, escalation: { to: { id: 'u-fd' } },
    accepted: { at: day(-1), by: 'FD', byId: 'u-fd', why: 'traded', staleQuote: true } },
  { category: 'Term', status: 'deviation', escalate: true, escalation: { to: { id: 'u-fd' } },
    accepted: { at: day(-1), by: 'FD', byId: 'u-fd', why: 'traded' } },
  { category: 'Audit', status: 'aligned' },
]);

describe('f463 (1) the shared reading', () => {
  test('1a which departures hold, per gate', () => {
    const c = { playbook: { verdicts: verdicts() } };
    const holding = g => SG.sgDepartures(c, { gate: g }).filter(r => r.holds).map(r => r.category);
    assert.deepEqual(holding('off'), []);
    assert.deepEqual(holding('advise'), ['Payment terms', 'Governing law', 'Notice'],
      'escalated and unaccepted, accepted by the wrong person, accepted against moved wording');
    assert.deepEqual(holding('require'), ['Payment terms', 'Liability cap', 'Governing law', 'Notice']);
    const why = Object.fromEntries(SG.sgDepartures(c, { gate: 'require' }).map(r => [r.category, r.why]));
    assert.deepEqual(why, { 'Payment terms': 'escalated', 'Liability cap': 'unaccepted',
      'Governing law': 'wrong-person', Notice: 'stale' });
  });
  test('1b an admin acceptance counts, by stamped role or by the roster', () => {
    const v = { category: 'X', status: 'deviation', escalate: true, accepted: { at: day(-1), byId: 'u-adm' } };
    assert.equal(SG.sgAcceptedProperly(v), false, '[control] an unknown id is not an admin');
    assert.equal(SG.sgAcceptedProperly(v, id => id === 'u-adm'), true, 'the roster says admin');
    assert.equal(SG.sgAcceptedProperly({ ...v, accepted: { ...v.accepted, role: 'admin' } }), true);
  });
  test('1c the brief: stands, is read by THIS signer, lapses when wording moves', () => {
    const brief = { at: day(-2), truncated: false };
    const c = { changes: [{ id: 'CHG-1', createdAt: day(-3) }] };
    assert.equal(SG.sgBriefStands(c, brief), true);
    assert.equal(SG.sgBriefReadOwed(c, brief, 'u1', 'advise'), true, 'not read yet');
    c.briefRead = { u1: { at: day(0), key: SG.sgBriefKey(c, brief) } };
    assert.equal(SG.sgBriefReadOwed(c, brief, 'u1', 'advise'), false, 'read');
    assert.equal(SG.sgBriefReadOwed(c, brief, 'u2', 'advise'), true, 'each signer their own');
    assert.equal(SG.sgBriefReadOwed(c, brief, 'u2', 'off'), false, 'off is off');
    c.changes.push({ id: 'CHG-2', createdAt: day(-1) });
    assert.equal(SG.sgBriefStands(c, brief), false, 'wording moved after the brief: the brief row asks instead');
    assert.equal(SG.sgBriefReadOwed(c, { at: day(0) }, 'u1', 'advise'), true, 'a new brief: the old stamp lapses');
    assert.equal(SG.sgBriefStands(c, { at: day(0), truncated: true }), false, 'a cut-short brief stands for nothing');
  });
});

describe('f463 (2) both hosts give the same answer', () => {
  function bench(gate){
    const w = buildWorld({ signcheck: true, contractView: true });
    const { win } = w;
    win.state = Object.assign({}, win.state, { settings: { signCheckGate: gate }, contracts: [] });
    win.canViewValues = () => true;
    win.getUsers = () => [{ id: 'u-adm', role: 'admin', name: 'Adm' }];
    return win;
  }
  test('2a the card and the wall hold the same departures on every gate', () => {
    for (const gate of ['off', 'advise', 'require']) {
      const win = bench(gate);
      const vs = verdicts().concat([{ category: 'Roster admin', status: 'deviation', escalate: true,
        accepted: { at: day(-1), byId: 'u-adm', why: 'admin said so' } }]);
      const c = { id: 'MK-463', name: 'x', status: 'Under Review', counterparty: 'Y', fields: {}, metadata: {},
        changes: [], audit: [], playbook: { label: 'D', verdicts: vs },
        upload: { extractedText: 'Payment within thirty days.' }, source: 'upload' };
      win.state.contracts = [c];
      const card = win.signCheckRows(c).filter(r => r.kind === 'standard' && r.holds).map(r => r.category);
      const wall = SG.sgDepartures(c, { gate, isAdmin: id => id === 'u-adm' }).filter(r => r.holds).map(r => r.category);
      assert.ok(win.signCheckRows(c).some(r => r.kind === 'standard'), `[control] the card drew the standards on ${gate}`);
      if (gate !== 'off') assert.ok(wall.length, '[control] something holds');
      assert.deepEqual([...card], [...wall], `gate ${gate}`);
      assert.deepEqual([...win.signCheckLinkHolds(c).map(r => r.category)], [...wall], `the issuing check reads the wall's list on ${gate}`);
    }
  });
  test('2b the brief-read key the card stamps is the key the wall reads', () => {
    const win = bench('advise');
    const c = { id: 'MK-463', changes: [{ id: 'CHG-1', createdAt: day(-3) }], _brief: { at: day(-1) } };
    assert.equal(win.briefReadKey(c), SG.sgBriefKey(c, c._brief));
    assert.equal(win.signCheckBriefAt(c), SG.sgLastProposedAt(c), 'one date walk');
  });
  test('2c the server asks the shared file, not a copy of it', () => {
    assert.match(SERVER, /require\('\.\.\/js\/signgate\.js'\)/);
    assert.match(SERVER, /function srvSignCheckOpen\(c, opts\)\{[\s\S]{0,700}sgDepartures\(c, \{ gate, isAdmin: scIsAdminId \}\)/);
    assert.ok(!/function scAcceptedProperly/.test(SERVER), 'the server\'s own acceptance arithmetic is gone');
    assert.match(read('js/app.js'), /import '\.\/signgate\.js';[^\n]*\n(?:[^\n]*\n)?import '\.\/signcheck\.js';/, 'loaded before the card');
  });
});

describe('f463 (3) one issuing check, every door', () => {
  test('3a every door that mints a signing link asks signLinkRefusal', () => {
    assert.match(CORE, /function signLinkRefusal\(c, opts=\{\}\)\{/);
    assert.match(CORE, /async function issueSigningRouteLinks\(c\)\{[\s\S]{0,300}signLinkRefusal\(c\)/, 'the route links');
    assert.match(CORE, /if\(purposeSel==='sign'\)\{\s*const no=signLinkRefusal\(c,\{ signerId:signerSel, email \}\);/, 'the send screen');
    assert.match(CORE, /if\(payload && payload\.purpose==='sign'\)\{\s*const no=signLinkRefusal\(c\);\s*if\(no\) throw/, 'the resend that reads as sign');
    const CV = strip(read('js/views/contract.js'));
    assert.match(CV, /async function issueSigningAct\(c\)\{[\s\S]{0,600}signLinkRefusal\(c\)/, 'the room head, Negotiate, agents, phone');
    const AP = strip(read('js/approvals.js'));
    assert.match(AP, /sendNo=no\?no\.why:null;/, 'the route card asks the list');
    assert.match(AP, /\$\{sendNo\?` disabled aria-disabled="true" title="\$\{esc1\(sendNo\)\}"`:''\}/, 'and greys with its sentence');
    assert.match(strip(read('js/mobile-contract.js')), /s\.share==='sign' && window\.signLinkRefusal/, 'the phone\'s own sheet');
  });
  test('3b the one list, driven: hold, desk, review, approvals, check, address', () => {
    const { loadViews } = require('./dom');
    const src = read('js/core.js');
    const body = src.slice(src.indexOf('function signLinkRefusal(c, opts={}){'));
    const fn = body.slice(0, body.indexOf('\nasync function issueSigningRouteLinks'));
    const env = (o = {}) => {
      const sb = loadViews([], { i18t: (k, v) => k + (v ? JSON.stringify(v) : ''), i18tn: (k, n) => k + ':' + n,
        signerPlan: () => [{ id: 's1', email: 'grace@x.co' }], ...o });
      require('node:vm').runInContext(fn + '\nthis.signLinkRefusal=signLinkRefusal;', sb, { filename: 'core-slr' });
      return sb.signLinkRefusal;
    };
    const c = { id: 'MK-1', status: 'Under Review' };
    assert.equal(env()(c), null, '[control] nothing holds');
    assert.equal(env({ contractOnHold: () => true })(c).kind, 'hold');
    assert.equal(env({ deskSendBlock: () => 'lead only' })(c).kind, 'desk');
    assert.equal(env({ deskSendBlock: () => 'lead only', saStarted: () => true })(c), null, 'the desk never gates the route carrying itself');
    assert.equal(env({ reviewGateMessage: () => 'held' })(c).kind, 'review');
    assert.equal(env({ signApprovalHoldsLinks: () => 'waiting on FD' })(c).why, 'waiting on FD');
    assert.equal(env({ approvalState: () => ({ required: true, ok: false, rejected: [1], stale: [] }) })(c).kind, 'approval');
    assert.equal(env({ signCheckLinkHolds: () => [{ category: 'Payment terms' }] })(c).kind, 'signcheck');
    assert.equal(env()(c, { signerId: 's1', email: 'other@x.co' }).kind, 'address');
    assert.equal(env()(c, { signerId: 's1', email: 'Grace@x.co' }), null, 'the same address in another case');
    assert.equal(env({ contractOnHold: () => true })({ ...c, status: 'Signed' }), null, 'an executed copy still travels');
  });
  test('3c every new word is in both books', () => {
    const I = require('../js/i18n.js').STRINGS;
    const keys = ['sl_on_hold', 'sl_appr_refused', 'sl_appr_stale', 'sl_appr_waiting', 'sl_approval_word', 'sl_an_approver',
      'sl_check_holds_one', 'sl_check_holds_other', 'srv_not_ready_to_sign'];
    for (const k of keys) { assert.ok(I.en[k], 'en ' + k); assert.ok(I.sv[k], 'sv ' + k); }
  });
});

describe('f463 (4) the server is the wall', () => {
  let h, W, lead, token;
  const ID = 'MK-A2';
  const get = (cl, id) => cl.json('/api/contracts/' + id);
  const put = async (cl, c) => { const v = c._v; const body = { ...c }; delete body._v;
    return cl.raw('/api/contracts/' + c.id, { method: 'PUT', body: { contract: body, baseVersion: v } }); };
  const patch = async (o, id = ID) => { const c = await get(W.admin, id); const r = await put(W.admin, { ...c, ...o });
    assert.equal(r.status, 200, r.text); };
  const mkSign = cl => cl.raw('/api/shares', { method: 'POST', body: {
    payload: { kind: 'hati-share', purpose: 'sign', purposeChosen: 'sign', org: 'Highland Corporate Ltd',
      at: new Date().toISOString(), contract: { id: ID, name: 'x', docText: 'Article 1' } },
    channel: 'link', recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' }, expiryDays: 30, durable: false, purpose: 'sign' } });
  /* PUT /api/settings writes the WHOLE blob, so every call carries the rest. */
  const S = { approvalRules: [], signCheckGate: 'advise', deskRule: { on: false } };
  const settings = o => { Object.assign(S, o); return W.admin.json('/api/settings', { method: 'PUT', body: { ...S } }); };
  const gate = v => settings({ signCheckGate: v });

  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });

    lead = W.users.unrestricted;
    await nameASigner(W.admin, ID);
    await gate('advise');
    /* A link issued while nothing held — the counterparty's door is asked below. */
    const r = await mkSign(W.admin);
    assert.equal(r.status, 200, r.text);
    token = r.json.token;
  });
  after(async () => { await h.stop(); });

  test('4a an escalated departure holds the link, in our words', async () => {
    await patch({ playbook: { label: 'D', verdicts: [{ category: 'Payment terms', status: 'deviation', escalate: true,
      escalation: { to: { id: lead.id, name: lead.name } } }] } });
    const r = await mkSign(W.admin);
    assert.equal(r.status, 409, r.text);
    assert.equal(r.json.signCheck, true);
    assert.match(r.json.error, /Payment terms/, 'our side is told which standard');
  });

  test('4b the counterparty is told only that it is not ready — the reason goes on our trail', async () => {
    const r = await h.client('them').raw('/api/shares/' + token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: ID, action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', at: new Date().toISOString() } });
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.notReady, true);
    assert.equal(r.json.error, 'This contract is not ready to be signed yet. The sender will let you know when it is — '
      + 'you can still read it and comment in the meantime.', 'the approval wall\'s own sentence');
    assert.ok(!/Payment|departure|escalat|standard|check/i.test(r.json.error), 'nothing internal: ' + r.json.error);
    const c = await get(W.admin, ID);
    const line = (c.audit || []).find(a => a && a.action === 'Signature held');
    assert.ok(line, 'our side has the reason');
    assert.match(line.detail, /Payment terms/);
    const again = await h.client('them').raw('/api/shares/' + token + '/respond', { method: 'POST',
      body: { kind: 'hati-response', id: ID, action: 'sign', name: 'Grace Njeri', email: 'grace@client.co.ke', at: new Date().toISOString() } });
    assert.equal(again.status, 403);
    const c2 = await get(W.admin, ID);
    assert.equal((c2.audit || []).filter(a => a && a.action === 'Signature held').length, 1, 'one line, not one per press');
  });

  test('4c accepted by the colleague it went to: the link goes; against moved wording: held again', async () => {
    const acc = { at: new Date().toISOString(), by: lead.name, byId: lead.id, why: 'Traded in round 2.' };
    const v = { category: 'Payment terms', status: 'deviation', escalate: true, escalation: { to: { id: lead.id, name: lead.name } } };
    await patch({ playbook: { label: 'D', verdicts: [{ ...v, accepted: acc }] } });
    let r = await mkSign(W.admin);
    assert.equal(r.status, 200, r.text);
    await patch({ playbook: { label: 'D', verdicts: [{ ...v, accepted: { ...acc, staleQuote: true } }] } });
    r = await mkSign(W.admin);
    assert.equal(r.status, 409, 'the card holds a stale acceptance, and now so does the wall');
    await gate('off');
    r = await mkSign(W.admin);
    assert.equal(r.status, 200, 'off is off');
    await gate('advise');
    await patch({ playbook: { label: 'D', verdicts: [{ ...v, accepted: acc }] } });
  });

  test('4d the desk: reaching them is the lead\'s act, an admin included', async () => {
    await settings({ deskRule: { on: true } });
    await patch({ desk: { leadId: lead.id, leadName: lead.name, contributors: [], at: new Date().toISOString() } });
    let r = await mkSign(W.admin);
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.desk, 'not-the-lead');
    r = await mkSign(W.unrestricted);
    assert.equal(r.status, 200, r.text);
    await settings({ deskRule: { on: false } });
  });

  test('4e a contract on hold gets no signing link', async () => {
    await patch({ hold: { at: new Date().toISOString(), why: 'Invoice dispute', by: 'Amina Otieno' } });
    const r = await mkSign(W.admin);
    assert.equal(r.status, 409, r.text);
    assert.equal(r.json.heldFreeze, true);
  });
});

describe('f463 (5) our signer reads the brief, at the wall too', () => {
  let h, W, me;
  const ID = 'MK-463B';
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { approvalRules: [] });
    me = (await W.admin.json('/api/bootstrap')).me;
    await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
      id: ID, name: 'Brief wall fixture', counterparty: 'Nordkust Industri AB', folder: 'proc', status: 'Under Review',
      fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
      obligations: [], value: 100000, valueType: 'estimated' } } });
    await W.admin.json('/api/settings', { method: 'PUT', body: { approvalRules: [], signCheckGate: 'advise' } });
  });
  after(async () => { await h.stop(); });
  const sig = () => [{ name: me.name, email: me.email, at: new Date().toISOString(), method: 'session-authenticated' }];
  const putC = async o => { const seen = await W.admin.json('/api/contracts/' + ID);
    return W.admin.raw('/api/contracts/' + ID, { method: 'PUT', body: { contract: { ...seen, ...o }, baseVersion: seen._v } }); };

  test('5a [control] with no brief on file nothing is owed', async () => {
    const r = await putC({ signatures: sig() });
    assert.equal(r.status, 200, r.text);
    const back = await putC({ signatures: [] });
    assert.equal(back.status, 200, back.text);
  });

  test('5b a brief that stands and is unread holds the in-app signature; the stamp lets it go', async () => {
    const at = new Date(Date.now() - 60000).toISOString();
    const { DatabaseSync } = require('node:sqlite');
    const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    db.prepare('INSERT OR REPLACE INTO briefs (contract_id, json, created_at) VALUES (?,?,?)')
      .run(ID, JSON.stringify({ v: 1, at, by: 'Copilot', truncated: false, data: {} }), at);
    db.close();
    const seen = await W.admin.json('/api/contracts/' + ID);
    assert.equal(seen._brief && seen._brief.at, at, '[control] the brief rides the GET');
    let r = await putC({ signatures: sig() });
    assert.equal(r.status, 403, r.text);
    assert.equal(r.json.signCheck, true);
    assert.match(r.json.error, /brief/);
    r = await putC({ signatures: sig(), briefRead: { [me.id]: { at: new Date().toISOString(), by: me.name, key: SG.sgBriefKey(seen, { at }) } } });
    assert.equal(r.status, 200, r.text);
  });
});
