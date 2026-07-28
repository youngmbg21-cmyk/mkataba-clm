/* ============================================================
   F70 — the counterparty's copy is the contract, not the front door
   ============================================================
   When a contract is fully executed, HaTi emails every party their copy for
   safe keeping. The email carried one line for everybody:

       Open it in HaTi:
       https://hati-clm.onrender.com/

   That is the platform's own front door — the owner's workspace, its login
   screen, its whole register. It went to the counterparty, who has no account
   and never should: an external party at the end of one deal was sent into the
   product that holds every other deal in the workspace. They cannot get in, so
   nothing leaked; what they got was an invitation that reads like one, and a
   sign-in wall in place of the document they were promised.

   The email is otherwise careful about exactly this. A PART-signed contract
   deliberately carries no seal and no link, because a half-executed contract
   is not a document anybody should file as their record. The fully-executed
   copy simply pointed everyone at the same URL.

   What a counterparty should get is the thing the message is about: their own
   link to the signed contract, which is the same read-only door they have been
   using all along. Where no such link exists, they get the seal and no link at
   all — which is honest, and is what the part-signed notice already does.

   The owner's own people, who do have accounts, still get the platform link.
*/
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A } = require('./helpers');

const APP = 'https://hati-clm.example/';

describe('F70 — an executed copy sends each party to the door that is theirs', () => {
  let h, W;
  const signed = id => ({
    id, name: 'WH — ' + id, counterparty: 'Nordfrakt Logistik AB', folder: FOLDER_A,
    status: 'Signed', hash: 'a'.repeat(64), fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], comments: [],
    signatures: [
      { party: 'first', name: 'Wanjiru Kamau', email: 'admin@example.co.ke', at: new Date().toISOString() },
      { party: 'counterparty', name: 'Erik Lindqvist', email: 'erik@nordfrakt.se', at: new Date().toISOString() },
    ],
  });
  const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c } });
  const distribute = (id, recipients) => W.admin.json('/api/contracts/' + id + '/distribute',
    { method: 'POST', body: { recipients, appUrl: APP } });
  const mailTo = async addr => {
    const items = (await W.admin.json('/api/outbox')).items || [];
    return items.find(i => i.to_addr === addr) || null;
  };
  const bothParties = [
    { name: 'Wanjiru Kamau', email: 'admin@example.co.ke', party: 'first' },
    { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se', party: 'counterparty' },
  ];

  before(async () => { h = await startHati(); W = await seedWorkspace(h); });
  after(async () => { await h.stop(); });

  test('the counterparty is not sent to the platform front door', async () => {
    const c = signed('MK-D1');
    await put(c);
    await distribute(c.id, bothParties);
    const mail = await mailTo('erik@nordfrakt.se');
    assert.ok(mail, 'they must still get their copy');
    assert.match(mail.subject, /^Fully executed/);
    assert.ok(!new RegExp('Open it in HaTi:\\s*' + APP + '\\s*$', 'm').test(mail.body),
      'an external party must not be handed the workspace’s own front door');
    assert.match(mail.body, /Document seal \(SHA-256\)/,
      'the seal is what lets them verify the copy, and it stays');
  });

  test('they get their own link to the signed contract when they have one', async () => {
    const c = signed('MK-D2');
    await put(c);
    const s = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Wanjiru Kamau',
        at: new Date().toISOString(), docHash: 'h', purpose: 'sign',
        contract: { id: c.id, name: c.name, counterparty: c.counterparty, fields: {}, docText: 'x', versions: [] } },
      contractId: c.id, durable: true, channel: 'email',
      recipient: { name: 'Erik Lindqvist', email: 'erik@nordfrakt.se' } } });
    await distribute(c.id, bothParties);
    const mail = await mailTo('erik@nordfrakt.se');
    assert.ok(mail.body.includes('#share=' + s.token),
      'the link in a message about a signed contract should open the signed contract');
  });

  test('with no link of their own they get the seal and no link at all', async () => {
    const c = signed('MK-D3');
    await put(c);
    await distribute(c.id, [{ name: 'Ana Silva', email: 'ana@othercorp.se', party: 'counterparty' }]);
    const mail = await mailTo('ana@othercorp.se');
    assert.ok(!mail.body.includes(APP),
      'no door at all beats the wrong door — the part-signed notice already works this way');
    assert.match(mail.body, /Document seal/);
  });

  test('our own people still get the platform link, because they have accounts', async () => {
    const mail = await mailTo('admin@example.co.ke');
    assert.ok(mail, 'the first party gets their copy too');
    assert.ok(mail.body.includes(APP),
      'somebody with a login is exactly who that link is for');
  });

  test('the records archive is internal, and keeps its link', async () => {
    const c = signed('MK-D4');
    await put(c);
    await distribute(c.id, [{ name: 'Records archive', email: 'records@example.co.ke', party: 'cc' }]);
    const mail = await mailTo('records@example.co.ke');
    assert.ok(mail.body.includes(APP));
  });
});
