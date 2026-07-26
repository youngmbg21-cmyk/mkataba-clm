/* ============================================================
   F24 — "sent" has to mean sent
   ============================================================
   Pressing "Send updated version" refreshed the counterparty's link, told the
   owner "Updated version sent to Erik Lindqvist", and wrote the same sentence
   into the contract's history. No email was ever sent. From that round on the
   negotiation stalled with each side waiting for the other, and the record said
   something untrue about why.

   Two halves to the fix, and the second is the one that matters more:
     · refreshing an email share now actually sends the notification
     · every OTHER outcome — a copy-link share, a WhatsApp share, a workspace
       with no mail provider, a provider that refused the message — is reported
       for what it is, in the toast AND in the audit trail. "Published to their
       link but not sent" is a true sentence; "sent" was not. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const { loadViews, STUB_TEMPLATES, STUB_FOLDERS } = require('./dom');

const payloadFor = (id, text) => ({
  v: 1, kind: 'hati-share', org: 'Wanjiru Catering Ltd', sharedBy: 'Wanjiru Kamau',
  at: new Date().toISOString(), docHash: 'h1',
  contract: { id, name: 'Supply Agreement', counterparty: 'Nordkust Industri AB',
    template: 'RM', value: 4800000, valueType: 'estimated', fields: {},
    redlineText: text, format: 'text', docText: text, versions: [] },
});

describe('F24 — the server actually notifies on refresh', () => {
  let h, W;
  before(async () => {
    h = await startHati();                    // no mail key: messages queue to the outbox
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-RS', { method: 'PUT', body: {
      contract: fixtureContract('MK-RS', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 4800000, 'Under Review'),
      baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  const durable = () => W.admin.json('/api/shares', { method: 'POST', body: {
    payload: payloadFor('MK-RS', 'WORDING v1'), channel: 'email', durable: true,
    recipient: { name: 'Erik Lindqvist', email: 'erik@nordkust.se' }, expiryDays: 30 } });

  test('refreshing an email share queues a message to the counterparty', async () => {
    const made = await durable();
    const before = (await W.admin.json('/api/outbox')).items.length;
    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-RS', 'WORDING v2 — revised') } });

    const after = await W.admin.json('/api/outbox');
    assert.equal(after.items.length, before + 1, 'exactly one message must go out');
    const msg = after.items[0];
    assert.match(String(msg.to_addr), /erik@nordkust\.se/, 'it must go to the counterparty');
    assert.match(String(msg.subject), /Supply Agreement/);
    assert.match(String(msg.subject), /Updated/i, 'and say the contract has been updated');
    assert.match(String(msg.dev_hint || ''), new RegExp(made.token), 'carrying the link they already have');
    // the caller is told what happened, honestly
    assert.equal(r.emailConfigured, false, 'this server has no mail provider');
    assert.equal(r.emailSent, false, 'so nothing truly left — and the flag says so');
    assert.ok(r.link, 'the link comes back so the owner can send it another way');
  });

  test('a copy-link share sends nothing, and does not pretend otherwise', async () => {
    const made = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: payloadFor('MK-RS', 'WORDING v1'), channel: 'link', durable: true,
      recipient: { name: 'Erik Lindqvist' }, expiryDays: 30 } });
    const before = (await W.admin.json('/api/outbox')).items.length;
    const r = await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-RS', 'WORDING v2') } });
    const after = (await W.admin.json('/api/outbox')).items.length;
    assert.equal(after, before, 'there is nobody to email — so nothing is sent');
    assert.equal(r.emailSent, false);
    assert.equal(r.channel, 'link', 'the caller needs the channel to report the truth');
  });

  test('the refresh still does its original job', async () => {
    const made = await durable();
    await W.admin.json('/api/shares/' + made.token);                     // Erik opens it
    await W.admin.json('/api/shares/' + made.token + '/payload', { method: 'PUT',
      body: { payload: payloadFor('MK-RS', 'WORDING v2 — revised') } });
    const got = await W.admin.json('/api/shares/' + made.token);
    assert.match(got.payload.contract.docText, /WORDING v2 — revised/);
    assert.ok(got.prior, 'the "what changed since you last opened it" baseline still works');
  });
});

describe('F24 — the owner is told the truth', () => {
  function core(over = {}) {
    const s = loadViews(['js/richdoc.js', 'js/core.js', 'js/versioning.js'], {
      TEMPLATES: STUB_TEMPLATES, FOLDERS: STUB_FOLDERS });
    const me = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@x.co.ke' };
    s.REMOTE = { org: 'Wanjiru Catering Ltd', me, users: [me] };
    s.toast = () => {}; s.persist = () => {}; s.renderWorkspace = () => {};
    s.ensureFull = async () => {}; s.sha256 = async () => 'h'.repeat(64);
    s.captureVersion = () => ({ n: 2 }); s.buildSharePayload = () => ({ v: 1, kind: 'hati-share' });
    Object.assign(s, over);
    return s;
  }
  const contract = () => ({ id: 'MK-1', name: 'Supply Agreement', status: 'Under Review',
    audit: [], value: 1, valueType: 'estimated', fields: {}, rounds: [] });
  const shares = (over = {}) => [{ token: 'live1', recipientName: 'Erik Lindqvist',
    recipientEmail: 'erik@nordkust.se', channel: 'email', durable: true,
    createdAt: '2026-07-26T08:00:00.000Z', ...over }];

  test('a delivered email is recorded as emailed', async () => {
    const s = core({ api: async (p, m) => {
      if (/\/shares$/.test(p)) return { shares: shares() };
      if (/payload$/.test(p) && m === 'PUT') return { ok: true, emailSent: true, emailConfigured: true, channel: 'email', link: 'https://h/#share=t:live1' };
      return {};
    } });
    const c = contract();
    const out = await s.reshareToLastRecipient(c);
    assert.equal(out.delivered, true);
    assert.match(c.audit.map(e => e.detail).join(' '), /emailed to Erik Lindqvist/);
  });

  test('a workspace with no mail provider does NOT claim it was sent', async () => {
    const s = core({ api: async (p, m) => {
      if (/\/shares$/.test(p)) return { shares: shares() };
      if (/payload$/.test(p) && m === 'PUT') return { ok: true, emailSent: false, emailConfigured: false, channel: 'email', link: 'https://h/#share=t:live1' };
      return {};
    } });
    const c = contract();
    const out = await s.reshareToLastRecipient(c);
    assert.equal(out.delivered, false);
    const detail = c.audit.map(e => e.detail).join(' ');
    assert.match(detail, /NOT emailed/, 'the history must not say it was sent');
    assert.match(detail, /no mail provider/, 'and must say why');
    assert.ok(!/^Updated version emailed/.test(detail));
  });

  test('a provider refusal is recorded with its reason', async () => {
    const s = core({ api: async (p, m) => {
      if (/\/shares$/.test(p)) return { shares: shares() };
      if (/payload$/.test(p) && m === 'PUT') return { ok: true, emailSent: false, emailConfigured: true,
        emailError: 'recipient address rejected', channel: 'email', link: 'https://h/x' };
      return {};
    } });
    const c = contract();
    await s.reshareToLastRecipient(c);
    assert.match(c.audit.map(e => e.detail).join(' '), /recipient address rejected/);
  });

  test('a WhatsApp share says it must be sent by hand', async () => {
    const s = core({ api: async (p, m) => {
      if (/\/shares$/.test(p)) return { shares: shares({ channel: 'whatsapp', recipientEmail: null, recipientPhone: '+254712345678' }) };
      if (/payload$/.test(p) && m === 'PUT') return { ok: true, emailSent: false, emailConfigured: true, channel: 'whatsapp', link: 'https://h/x' };
      return {};
    } });
    const c = contract();
    const out = await s.reshareToLastRecipient(c);
    assert.equal(out.delivered, false);
    assert.equal(out.channel, 'whatsapp');
    assert.match(c.audit.map(e => e.detail).join(' '), /nothing was sent automatically/);
  });

  test('a copy-link share says the same', async () => {
    const s = core({ api: async (p, m) => {
      if (/\/shares$/.test(p)) return { shares: shares({ channel: 'link', recipientEmail: null }) };
      if (/payload$/.test(p) && m === 'PUT') return { ok: true, emailSent: false, emailConfigured: true, channel: 'link', link: 'https://h/x' };
      return {};
    } });
    const c = contract();
    await s.reshareToLastRecipient(c);
    assert.match(c.audit.map(e => e.detail).join(' '), /nothing was sent automatically/);
  });

  test('the link always comes back, so the owner can send it another way', async () => {
    const s = core({ api: async (p, m) => {
      if (/\/shares$/.test(p)) return { shares: shares() };
      if (/payload$/.test(p) && m === 'PUT') return { ok: true, emailSent: false, emailConfigured: false, channel: 'email', link: 'https://h/#share=t:live1' };
      return {};
    } });
    const out = await s.reshareToLastRecipient(contract());
    assert.match(out.link, /share=t:live1/);
  });

  test('a first-ever reshare (no durable link yet) still creates and reports one', async () => {
    const posted = [];
    const s = core({ api: async (p, m, body) => {
      if (/\/shares$/.test(p) && (!m || m === 'GET')) return { shares: shares({ durable: false }) };
      if (p === 'shares' && m === 'POST') { posted.push(body); return { token: 'new1', link: 'https://h/n', emailSent: true, emailConfigured: true }; }
      return {};
    } });
    const c = contract();
    const out = await s.reshareToLastRecipient(c);
    assert.equal(posted.length, 1, 'with no durable link to refresh, one is created');
    assert.equal(out.reused, false);
    assert.equal(out.delivered, true);
    assert.match(c.audit.map(e => e.detail).join(' '), /emailed to Erik Lindqvist/);
  });
});
