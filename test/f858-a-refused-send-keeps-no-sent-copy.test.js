/* ============================================================
   f858 — A REFUSED SEND KEEPS NO "SENT TO YOU" COPY
   (22 Oct 2026, the bug log: "reshareToLastRecipient saves a version before
   building the payload, so a refused sign resend can leave a 'Sent to you'
   version")
   ============================================================
   The round send takes its "Sent to you" copy BEFORE the payload, because
   the payload carries it (their page compares the last two sends). Before,
   a send refused after that point — the signing list saying no, or the
   server refusing the copy — left the copy on the record, saying "sent"
   about a send that never left.
     1  the signing list refuses: the send throws, the version list is as it was
     2  the server refuses the copy: the same
     3  a send that goes keeps its "Sent to you" copy (unchanged)
   Red at the parent: 1 and 2.
   ============================================================ */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { buildPortal } = require('./portalworld');

const draft = (over = {}) => ({
  id: 'MK-858', name: 'Mutual Non-Disclosure Agreement', counterparty: 'Juno Limited',
  template: 'NDA', status: 'Under Review', folder: 'corp', fields: {}, metadata: {},
  audit: [], rounds: [], versions: [], signatures: [], comments: [],
  value: 0, valueType: 'none', format: 'rich',
  redlineText: '<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1><h2>1. Purpose</h2><p>The parties share information.</p>',
  ...over });
const contact = { token: 'tok_a', recipientEmail: 'erik@juno.example', recipientName: 'Erik',
  channel: 'link', purpose: 'negotiate', durable: true, createdAt: '2026-10-01T00:00:00Z' };

function world(api){
  const p = buildPortal({ url: 'http://localhost/hati/' });
  const win = p.win;
  const user = { id: 'u_w', name: 'Wanjiru Kamau', role: 'legal', email: 'w@co.ke' };
  win.localStorage.setItem('hati.v1.users', JSON.stringify([user]));
  win.localStorage.setItem('hati.v1.session', JSON.stringify({ userId: user.id }));
  win.API_MODE = () => true;
  win.api = api || (async () => ({ ok: true, link: 'https://hati.test/#share=t:x' }));
  win.persist = () => {};
  return win;
}
const sentCopies = c => (c.versions || []).filter(v => v && v.label === 'Sent to you').length;

test('1 the signing list refuses: no "Sent to you" copy is left behind', async () => {
  const win = world();
  win.signLinkRefusal = () => ({ why: 'Name a signer on each side first.' });
  const c = draft();
  await assert.rejects(() => win.reshareToLastRecipient(c, { purpose: 'sign', shares: [contact] }), /Name a signer/);
  assert.equal(sentCopies(c), 0, JSON.stringify((c.versions || []).map(v => v.label)));
});

test('2 the server refuses the copy: no "Sent to you" copy is left behind', async () => {
  const win = world(async (p, m) => { if (m === 'PUT' || m === 'POST') { const e = new Error('This link was revoked'); e.status = 409; throw e; } return {}; });
  const c = draft({ versions: [{ n: 1, at: '2026-10-01T08:00:00.000Z', by: 'Wanjiru Kamau', label: 'Round 1', text: 'OLD WORDING', listed: true }] });
  const before = JSON.stringify(c.versions);
  await assert.rejects(() => win.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [contact] }), /revoked/);
  assert.equal(JSON.stringify(c.versions), before, 'the version list is exactly as it was');
});

test('3 a send that goes keeps its "Sent to you" copy', async () => {
  const win = world();
  const c = draft();
  await win.reshareToLastRecipient(c, { purpose: 'negotiate', shares: [contact] });
  assert.equal(sentCopies(c), 1);
});
