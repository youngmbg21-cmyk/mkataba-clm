/* f588 — A CHASE SAYS WHAT IS TRUE ON THE DAY IT GOES (B11, 8 Oct 2026).
   ============================================================
   The 9 Oct review: Chase on an obligation not yet due said "which was due on
   <a future date>", and a second chase from the tab repeated the first text
   word for word. Chasing early stays allowed (nothing is greyed):
     (1) before the due date the message says "is due on";
     (2) a second chase is the firmer one wherever it is pressed.
   Run: node --test test/f588-a-chase-says-what-is-true.test.js */
const { describe, test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');

const iso = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

describe('f588 — the route', () => {
  let h, W;
  before(async () => {
    h = await startHati(); W = await seedWorkspace(h, { approvalRules: [] });
    const c = fixtureContract('MK-CH1', 'Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Signed', 'Words.');
    c.counterpartyEmail = 'ops@juno.example';
    c.obligations = [
      { id: 'ob-soon', desc: 'Deliver the insurance certificate', due: iso(20), party: 'theirs', status: 'open' },
      { id: 'ob-late', desc: 'Return the signed annex', due: iso(-5), party: 'theirs', status: 'open', chasedAt: iso(-2) }];
    await W.admin.json('/api/contracts/MK-CH1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });
  const mails = async desc => ((await W.admin.json('/api/outbox')).items || []).filter(m => m.to_addr === 'ops@juno.example' && m.body.includes(desc));

  test('(1) before the due date it is "is due on", never "was due on"', async () => {
    const r = await W.admin.json('/api/contracts/MK-CH1/chase', { method: 'POST', body: { obligationId: 'ob-soon' } });
    assert.equal(r.ok, true);
    const m = await mails('insurance certificate');
    assert.equal(m.length, 1);
    assert.match(m[0].body, /which is due on/);
    assert.doesNotMatch(m[0].body, /was due on/);
  });
  test('[control] after the due date it is still "was due on"', async () => {
    await W.admin.json('/api/contracts/MK-CH1/chase', { method: 'POST', body: { obligationId: 'ob-late' } });
    assert.match((await mails('signed annex'))[0].body, /which was due on/);
  });
  test('(2) the firmer one quotes the first and says what is true about the date', async () => {
    await W.admin.json('/api/contracts/MK-CH1/chase', { method: 'POST', body: { obligationId: 'ob-soon', firm: true } });
    const m = await mails('insurance certificate');
    assert.equal(m.length, 2);
    const firm = m.find(x => /We wrote to you on/.test(x.body));
    assert.ok(firm, 'the firmer message went');
    assert.match(firm.body, /We wrote to you on .* which is due on/s);
  });
});

test('f588 (2) the tab\'s Chase on an obligation already chased sends the firmer one', () => {
  const OB = fs.readFileSync(path.join(__dirname, '..', 'js', 'obligations.js'), 'utf8');
  const body = OB.slice(OB.indexOf('async function obligationChase('), OB.indexOf('\n}\n', OB.indexOf('async function obligationChase(')));
  assert.match(body, /const firm = !!o\.chasedAt;/);
  assert.match(body, /firm \? \{ obligationId: obId, firm: true \}/);
});
