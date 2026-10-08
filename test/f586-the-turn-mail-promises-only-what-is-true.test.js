/* f586 — THE SIGNING-TURN MAIL PROMISES ONLY WHAT IS TRUE (B9, 8 Oct 2026).
   ============================================================
   The mail that carries a counterparty signer's own link said "A one-time
   code will be emailed to this address" on a server that cannot send mail —
   where signing is in fact allowed WITHOUT a code (the respond route asks for
   one exactly when EMAIL_ON()). It now says the code only where it is true.
   Run: node --test test/f586-the-turn-mail-promises-only-what-is-true.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

describe('f586 — email is not set up here', () => {
  let h, W;
  before(async () => { h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] }); });
  after(async () => { await h.stop(); });
  test('their turn mail promises no code, and still asks them not to forward it', async () => {
    const c = fixtureContract('MK-TM1', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', 'Words.');
    c.signerPlan = [
      { id: 'cp', party: 'counterparty', order: 1, name: 'Grace Njeri', email: 'grace@client.co.ke', signed: false },
      { id: 'us', party: 'internal', order: 2, name: 'Amina Otieno', email: 'admin@example.co.ke', signed: false }];
    await W.admin.json('/api/contracts/MK-TM1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(),
        docHash: 'h', purpose: 'sign', purposeChosen: 'sign', contract: { id: 'MK-TM1', name: 'Supply Agreement', fields: {}, versions: [] } },
      channel: 'email', purpose: 'sign', signerId: 'cp', expiryDays: 30, recipient: { name: 'Grace Njeri', email: 'grace@client.co.ke' } } });
    const m = ((await W.admin.json('/api/outbox')).items || []).filter(x => x.to_addr === 'grace@client.co.ke');
    assert.ok(m.length, '[control] their link was mailed (to the outbox)');
    const body = m.map(x => x.body).join('\n');
    assert.doesNotMatch(body, /one-time code/i, 'no code can be sent from here, so none is promised');
    assert.match(body, /issued to you personally — please do not forward it/);
  });
  test('where mail works, the code line is the one that goes', () => {
    const S = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    assert.match(S, /tFor\(L, EMAIL_ON\(\) \? 'mail_code_note' : 'mail_link_personal'\)/);
  });
});
