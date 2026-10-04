/* ============================================================
   F478 — ONE "it is your turn" email per hand-over (4 Oct 2026)
   ============================================================
   REVERSES f93's "one email per negotiation". Every round after the first
   refreshed the counterparty's standing link with notify:false, so a round
   handed to them sat behind a URL nobody told them to open again.

   Now a round send that HANDS THE TURN TO THEM asks for notify:'turn': one
   email naming who sent it, one line of what moved ("3 changes and 1 note"),
   and the same link, reported with mailReport's three outcomes. A send that
   hands nothing over stays notify:false; a decision stays a silent refresh;
   a link that is not email sends nothing. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, startHatiWithMail, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const payloadFor = (id, text) => ({
  v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Logistics Agreement', counterparty: 'Nordfrakt Logistik AB',
    template: 'RM', fields: {}, redlineText: text, format: 'text', docText: text, versions: [] },
});

async function seeded(h){
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/contracts/MK-1E', { method: 'PUT', body: {
    contract: fixtureContract('MK-1E', 'Logistics Agreement', 'Nordfrakt Logistik AB', FOLDER_A, 900000, 'Under Review'),
    baseVersion: 0 } });
  return W;
}
const mint = (W, channel = 'email') => W.admin.json('/api/shares', { method: 'POST', body: {
  payload: payloadFor('MK-1E', 'ROUND 1 wording'), channel, durable: true,
  recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' }, expiryDays: 30 } });

describe('F478 — the server sends one turn email, and says how it went', () => {
  let h, W;
  before(async () => { h = await startHatiWithMail(); W = await seeded(h); });
  after(async () => { await h.stop(); });

  test('(1) notify:"turn" emails them once: who sent it, what moved, the same link', async () => {
    const made = await mint(W);
    h.mail.reset();
    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 2'), notify: 'turn',
        turn: { changes: 3, notes: 1, by: 'Mallory Impostor' } } });
    assert.equal(h.mail.sent.length, 1, 'exactly one email');
    const m = h.mail.sent[0];
    assert.equal(m.to, 'erik@nordfrakt.se');
    assert.match(m.subject, /Your turn/);
    assert.match(m.text, /Amina Otieno/, 'names the signed-in sender');
    assert.ok(!/Mallory/.test(m.text), 'never a name from the body');
    assert.match(m.text, /3 changes and 1 note/, 'one line of what moved');
    assert.match(m.text, new RegExp(made.token), 'the same link they already hold');
    assert.equal(r.turnMail, true);
    assert.equal(r.emailSent, true);
    assert.equal(r.notifySkipped, false);
  });

  test('(2) a refused send is reported as refused, with the reason', async () => {
    const made = await mint(W);
    h.mail.setMode('refuse', { status: 403, message: 'The hati.test domain is not verified.' });
    try {
      const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
        body: { payload: payloadFor('MK-1E', 'ROUND 2'), notify: 'turn', turn: { changes: 1 } } });
      assert.equal(r.turnMail, true);
      assert.equal(r.emailSent, false);
      assert.equal(r.outbox, false, 'a refusal is not the outbox');
      assert.match(String(r.emailError || ''), /not verified/);
    } finally { h.mail.setMode('ok'); }
  });

  test('(3) notify:false still sends nothing — a send that hands nothing over', async () => {
    const made = await mint(W);
    h.mail.reset();
    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 2'), notify: false } });
    assert.equal(h.mail.sent.length, 0);
    assert.equal(r.turnMail, false);
    assert.equal(r.notifySkipped, true);
  });

  test('(4) a link that is not email sends nothing, and says it did not try', async () => {
    const made = await mint(W, 'link');
    h.mail.reset();
    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 2'), notify: 'turn', turn: { changes: 2 } } });
    assert.equal(h.mail.sent.length, 0);
    assert.equal(r.turnMail, false);
  });
});

describe('F478 — with no provider, the turn email is in the outbox, said as such', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seeded(h); });
  after(async () => { await h.stop(); });
  test('(5) outbox: turnMail true, outbox true, not sent', async () => {
    const made = await mint(W);
    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-1E', 'ROUND 2'), notify: 'turn', turn: { changes: 1 } } });
    assert.equal(r.turnMail, true);
    assert.equal(r.outbox, true);
    assert.equal(r.emailSent, false);
    const items = (await W.admin.json('/api/outbox')).items;
    assert.match(String(items[0].subject || ''), /Your turn/);
  });
});

/* ------------------------------------------------------------------ client */
function core(){
  const s = loadViews(['js/richdoc.js', 'js/versioning.js', 'js/core.js'], {
    TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
  const me = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@x.co.ke' };
  s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
  s.toast = () => {};
  s.renderAuditSection = () => {}; s.renderSharesSection = () => {}; s.refreshShareOverview = () => {};
  s.renderWorkspace = () => {}; s.setView = () => {}; s.refreshStats = () => {};
  return s;
}
const contract = over => ({ id: 'MK-1E', name: 'Logistics Agreement',
  counterparty: 'Nordfrakt Logistik AB', template: 'RM', status: 'Under Review',
  folder: 'dist', fields: {}, metadata: {}, audit: [], rounds: [], versions: [],
  signatures: [], comments: [], redlineText: 'ROUND 2 wording', format: 'text', ...over });
const durableShare = () => ({ token: 'tok_live', durable: true, revokedAt: null,
  recipientName: 'Erik Lindqvist', recipientEmail: 'erik@nordfrakt.se',
  recipientPhone: null, channel: 'email', createdAt: '2026-07-26T08:00:00.000Z', state: 'opened' });

describe('F478 — the client asks for the turn email only on a hand-over', () => {
  test('(6) a round send that hands the turn over asks notify:"turn" with what moved', async () => {
    const s = core();
    const calls = [];
    s.api = async (p, method, body) => { calls.push({ p, method, body });
      return { ok: true, link: 'x', turnMail: true, emailSent: true, emailConfigured: true }; };
    const c = contract({
      negotiation: { turn: 'owner', turnAt: '2026-01-01T00:00:00.000Z' },
      changes: [{ id: 'CHG-1', authorSide: 'counterparty', status: 'accepted', resolvedAt: '2026-01-02T00:00:00.000Z' },
        { id: 'CHG-0', authorSide: 'counterparty', status: 'accepted', resolvedAt: '2025-12-30T00:00:00.000Z' }],
      thread: [{ side: 'owner', visibility: 'shared', at: '2026-01-03T00:00:00.000Z', text: 'see clause 4' },
        { side: 'owner', visibility: 'internal', at: '2026-01-03T00:00:00.000Z', text: 'between us' }] });
    const out = await s.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [durableShare()], handOver: true });
    const put = calls.find(x => x.method === 'PUT');
    assert.equal(put.body.notify, 'turn');
    assert.equal(put.body.turn.changes, 1, 'only the decision since the last hand-over');
    assert.equal(put.body.turn.notes, 1, 'only the shared note; an internal one never counts');
    assert.equal(out.turnMail, true);
    assert.equal(out.delivered, true);
    assert.match(c.audit.map(e => e.detail).join(' | '), /it is your turn" emailed/);
  });

  test('(7) the turn already theirs with nothing unsent: no hand-over, so notify:false', async () => {
    const s = core();
    const calls = [];
    s.api = async (p, method, body) => { calls.push({ p, method, body });
      return { ok: true, link: 'x', notifySkipped: true, emailSent: false, emailConfigured: true }; };
    const c = contract({ negotiation: { turn: 'counterparty', turnAt: '2026-01-01T00:00:00.000Z' }, changes: [] });
    await s.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [durableShare()], handOver: true });
    assert.equal(calls.find(x => x.method === 'PUT').body.notify, false);
  });

  test('(8) a caller that is not a round send (no handOver) stays quiet', async () => {
    const s = core();
    const calls = [];
    s.api = async (p, method, body) => { calls.push({ p, method, body }); return { ok: true, notifySkipped: true }; };
    await s.reshareToLastRecipient(contract(), { purpose: 'negotiate', shares: [durableShare()] });
    assert.equal(calls.find(x => x.method === 'PUT').body.notify, false);
  });

  test('(9) both round-send doors pass handOver; the decision path still refreshes silently', () => {
    const neg = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'negotiation.js'), 'utf8');
    const con = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'contract.js'), 'utf8');
    const core = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    assert.match(neg, /reshareToLastRecipient\(c, \{ purpose: 'negotiate',\s*handOver:/);
    assert.match(con, /reshareToLastRecipient\(c,\{ purpose:'negotiate', handOver:true \}\)/);
    assert.match(core, /reshareToLastRecipient\(c, \{ \.\.\.opts, purpose:'negotiate', handOver:true \}\)/);
    for (const k of ['ng_turn_emailed', 'ng_turn_mail_outbox', 'ng_turn_mail_failed'])
      assert.match(neg, new RegExp(k), k + ' is said on the negotiation page');
  });
});
