/* ============================================================
   f590 — "SENT" MUST MEAN SENT, AT EVERY SEND DOOR (owner decision D1,
   9 Oct 2026)
   ============================================================
   The functional review of 9 Oct found that with no email provider (the real
   first-week state of every workspace, and the state every test runs in) the
   send screen still said "Sent ✓", moved the contract from Drafting to Under
   Review, handed the turn over and wrote "Sent to X via email" — and the
   server wrote "link sent to X by email" before it had tried to send at all.

   The owner's answer (D1): the button and the history say "Queued — email
   isn't set up", and the contract does NOT move and the turn is NOT handed
   over until it really goes. A send the person CHOSE to deliver themselves
   (Copy link) is a hand-over, and so is their own "Copy link — I'll send it
   myself" press on the queued result.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildPortal } = require('./portalworld');
const { startHati, startHatiWithMail, seedWorkspace } = require('./helpers');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

const draft = (over = {}) => ({
  id: 'MK-590', name: 'Mutual Non-Disclosure Agreement', counterparty: 'Juno Limited',
  template: 'NDA', status: 'Draft', folder: 'corp', fields: {}, metadata: {},
  audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 0, valueType: 'none', format: 'rich',
  redlineText: '<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1><h2>1. Purpose</h2><p>The parties share information.</p>',
  ...over });

/* The owner's dialog, opened for real against a stubbed server that answers
   the POST the way the real route does for the given mail outcome. */
async function shareDialog(c, reply) {
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  const posted = [];
  const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.API_MODE = () => true;
  win.api = async (pathname, method, body) => {
    if (/\/shares$/.test(String(pathname)) && String(method || 'GET') === 'GET') return { shares: [] };
    if (String(pathname) === 'shares' && method === 'POST') {
      posted.push(body);
      return { ok: true, token: 'tok_590', link: 'https://hati.test/#share=t:tok_590',
        expiresAt: '2026-11-01T00:00:00.000Z', ...reply };
    }
    return {};
  };
  win.persist = () => {}; win.renderAuditSection = () => {};
  win.renderSharesSection = () => {}; win.refreshShareOverview = () => {};
  win.confirmDialog = async () => true;
  win.navigator.clipboard = { writeText: async () => {} };
  await win.openShareModal(c, { purpose: 'negotiate' });
  /* The portal world runs every timer at once; the button's re-arm after its
     beat would then hide what the press printed. Held here instead. */
  win.setTimeout = () => 0;
  const root = win.document.getElementById('modal-root');
  const $ = sel => root.querySelector(sel);
  const settle = async () => { for (let i = 0; i < 20; i++) await Promise.resolve();
    await new Promise(r => setImmediate(r)); await new Promise(r => setImmediate(r)); };
  return {
    win, $, posted, settle,
    pick(sel) { const b = root.querySelector(sel); assert.ok(b, sel); b.dispatchEvent(new win.Event('click', { bubbles: true })); },
    async send(email = 'erik@juno.example', name = '') {
      $('#sh-email').value = email;
      if ($('#sh-name')) $('#sh-name').value = name;
      $('#share-send').dispatchEvent(new win.Event('click', { bubbles: true }));
      await settle();
    },
  };
}
const shared = c => (c.audit || []).filter(a => a && a.action === 'Shared').map(a => a.detail);

describe('f590 (1) — the send screen, email channel', () => {
  test('email not set up: queued on the button and the trail; nothing moves', async () => {
    const c = draft();
    const d = await shareDialog(c, { emailSent: false, emailConfigured: false,
      emailError: 'Email is not configured on this server — the message is in the outbox.' });
    await d.send();
    assert.equal(d.posted.length, 1, 'the link row was made');
    assert.equal(d.$('#sh-send-lbl').textContent, d.win.i18t('co_send_queued_btn'),
      'the button says Queued — never "Sent ✓"');
    assert.equal(c.status, 'Draft', 'the contract stays a draft');
    assert.ok(!(c.negotiation && c.negotiation.turn === 'counterparty'), 'and the move stays ours');
    const line = shared(c).pop() || '';
    assert.match(line, /NOT sent/, 'the trail says it did not go');
    assert.doesNotMatch(line, /^Sent to/, 'and never "Sent to"');
    assert.ok(d.$('#share-by-hand'), 'the way forward is the person’s own press, in the result box');
  });

  test('"Copy link — I’ll send it myself" IS the hand-over', async () => {
    const c = draft();
    const d = await shareDialog(c, { emailSent: false, emailConfigured: false });
    await d.send();
    d.pick('#share-by-hand');
    await d.settle();
    assert.equal(c.status, 'Under Review', 'now it has left the building — by their hand');
    assert.equal(c.negotiation && c.negotiation.turn, 'counterparty', 'and it is their move');
    assert.match(shared(c).pop() || '', /copied the link to send to .* themselves/);
  });

  test('a provider refusal says "Not sent" and moves nothing either', async () => {
    const c = draft();
    const d = await shareDialog(c, { emailSent: false, emailConfigured: true,
      emailError: 'The from address is not verified.' });
    await d.send();
    assert.equal(d.$('#sh-send-lbl').textContent, d.win.i18t('co_send_failed_btn'));
    assert.equal(c.status, 'Draft');
    assert.match(shared(c).pop() || '', /NOT sent — The from address is not verified/);
  });

  test('delivered: Sent, it leaves Draft, the turn moves — and the address is said once', async () => {
    const c = draft();
    const d = await shareDialog(c, { emailSent: true, emailConfigured: true });
    await d.send('erik@juno.example', '');
    assert.equal(d.$('#sh-send-lbl').textContent, 'Sent ✓');
    assert.equal(c.status, 'Under Review');
    assert.equal(c.negotiation && c.negotiation.turn, 'counterparty');
    const line = shared(c).pop() || '';
    assert.match(line, /^Sent to erik@juno\.example via email/);
    assert.doesNotMatch(line, /erik@juno\.example to erik@juno\.example/,
      'C8: no "Sent to X to X" when the name box is blank');
  });

  test('a link the sender chose to deliver themselves is a hand-over', async () => {
    const c = draft();
    const d = await shareDialog(c, { emailSent: false, emailConfigured: false });
    d.pick('[data-share-ch="link"]');
    d.$('#share-send').dispatchEvent(new d.win.Event('click', { bubbles: true }));
    await d.settle();
    assert.equal(c.status, 'Under Review', 'Copy link is their act of delivery');
  });
});

describe('f590 (2) — the round send (reshareToLastRecipient) reports `reached`', () => {
  function world(reply, shares) {
    const p = buildPortal({ url: 'http://localhost/hati/' });
    const win = p.win;
    const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
    win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
    win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
    win.API_MODE = () => true;
    win.api = async () => ({ ok: true, link: 'https://hati.test/#share=t:x', ...reply });
    win.persist = () => {};
    win.navigator.clipboard = { writeText: async () => {} };
    return { win, shares };
  }
  const contact = { token: 'tok_a', recipientEmail: 'erik@juno.example', recipientName: 'Erik',
    channel: 'email', purpose: 'negotiate', createdAt: '2026-10-01T00:00:00Z' };

  test('a first link queued in the outbox reached nobody: still a draft', async () => {
    const { win } = world({ emailSent: false, emailConfigured: false, outbox: true });
    const c = draft();
    const out = await win.reshareToLastRecipient(c, { purpose: 'negotiate',
      shares: [{ ...contact, revokedAt: '2026-10-02T00:00:00Z' }] });
    assert.equal(out.reached, false);
    assert.equal(c.status, 'Draft');
    assert.ok(await win.roundReachedByHand(c, out, { say: false }), 'the person’s own hand-over');
    assert.equal(c.status, 'Under Review');
    assert.equal(c.negotiation && c.negotiation.turn, 'counterparty');
  });

  test('resendRoundFresh moves the turn only once the round reached them', async () => {
    const { win } = world({ emailSent: false, emailConfigured: false, outbox: true });
    const c = draft();
    await win.resendRoundFresh(c, { shares: [{ ...contact, revokedAt: '2026-10-02T00:00:00Z' }] });
    assert.ok(!(c.negotiation && c.negotiation.turn === 'counterparty'));
  });
});

describe('f590 (3) — the server writes the trail after delivery, saying what happened', () => {
  const payloadFor = id => ({ kind: 'hati-share', org: 'Highland Corporate Ltd',
    sharedBy: 'Amina Otieno', at: new Date().toISOString(), purpose: 'negotiate',
    contract: { id, name: 'Raw Milk Collection', counterparty: 'Nandi Dairy', fields: {}, docText: 'x' } });
  const trailOf = async (W, id) => {
    const r = await W.admin.json('/api/contracts/' + id);
    const c = r.contract || r;
    return (c.audit || []).filter(a => a && a.action === 'Shared').map(a => a.detail);
  };

  describe('email off', () => {
    let h, W;
    before(async () => { h = await startHati(); W = await seedWorkspace(h); });
    after(async () => { await h.stop(); });
    test('the line says NOT sent, never "sent by email"', async () => {
      await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('MK-A2'), channel: 'email', durable: true,
        recipient: { name: 'Priya Nair', email: 'priya@nandi.example' } } });
      const t = await trailOf(W, 'MK-A2');
      assert.ok(t.some(x => /NOT sent by email — email is not set up/.test(x)), t.join(' | '));
      assert.ok(!t.some(x => /link sent to Priya Nair by email/.test(x)));
    });
    test('a Word file: the share row keeps no attachment names as its error', async () => {
      const r = await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('MK-A2'), channel: 'word', durable: false,
        recipient: { name: 'Priya Nair', email: 'file@nandi.example' },
        file: { filename: 'MK-A2-redline.docx', content: Buffer.from('PK').toString('base64') } } });
      assert.doesNotMatch(String(r.emailError || ''), /attachments:/, 'C11');
      const list = await W.admin.json('/api/contracts/MK-A2/shares');
      const row = (list.shares || []).find(s => s.token === r.token);
      assert.ok(row);
      assert.doesNotMatch(String(row.sendError || ''), /attachments:/);
      const ob = await W.admin.json('/api/outbox');
      const mail = (ob.items || []).find(m => String(m.to_addr) === 'file@nandi.example');
      assert.match(String(mail.detail || ''), /attachments: MK-A2-redline\.docx/, 'the outbox row keeps the names');
      assert.match(String(mail.body), /send the file back to Amina Otieno/, 'C14 / D5');
      assert.doesNotMatch(String(mail.body), /straight back into HaTi/);
    });
  });

  describe('email on (stubbed provider)', () => {
    let h, W;
    before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); });
    after(async () => { await h.stop(); });
    test('the line says sent by email', async () => {
      await W.admin.json('/api/shares', { method: 'POST', body: {
        payload: payloadFor('MK-A2'), channel: 'email', durable: true,
        recipient: { name: 'Priya Nair', email: 'priya@nandi.example' } } });
      const t = await trailOf(W, 'MK-A2');
      assert.ok(t.some(x => /link sent to Priya Nair by email/.test(x)), t.join(' | '));
    });
  });
});

describe('f590 (4) — the review request reads its tick-box before the dialog closes', () => {
  test('wantMail is read before closeModal', () => {
    const src = read('js/review.js');
    const at = src.indexOf("document.getElementById('rv-send')?.addEventListener");
    const region = src.slice(at, src.indexOf('reviewNoteDelivery(c, rv, out)', at));
    const want = region.indexOf("getElementById('rv-email')");
    const close = region.indexOf('window.closeModal()');
    assert.ok(want > 0 && close > 0 && want < close,
      'the tick-box is read while it still exists');
  });
});
