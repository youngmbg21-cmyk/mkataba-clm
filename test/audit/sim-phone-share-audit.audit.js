/* AUDIT REPRO: a share created from the phone leaves no line in the audit trail.
   The phone's mShareCreate (js/mobile-contract.js) POSTs /api/shares and stops.
   The desktop share dialog additionally calls logAudit('Shared', …) + persist.
   The server does NOT append a 'Shared' line on POST /api/shares. So a
   phone-originated send is invisible in c.audit AND in negoTimeline (whose
   'link' beat is read from c.audit). This script proves the SERVER half:
   POST /api/shares changes nothing in the contract's audit trail. */
const assert = require('node:assert');
const { startHati, seedWorkspace } = require('../helpers.js');

(async () => {
  const h = await startHati();
  try {
    const ws = await seedWorkspace(h);
    const admin = ws.admin;
    const id = 'MK-A2';                       // an Under-Review contract in a visible folder

    const before = await admin.json('/api/contracts/' + id);
    const auditBefore = (before.audit || []).slice();
    const sharedBefore = auditBefore.filter(a => a.action === 'Shared').length;

    // --- what the PHONE does: build a payload and POST it. Nothing else. ---
    const payload = { kind: 'hati-share', purpose: 'negotiate',
      contract: { id, name: before.name, changes: [] }, org: 'Highland Corporate Ltd',
      sharedBy: 'Amina Otieno', at: new Date().toISOString() };
    const r = await admin.json('/api/shares', { method: 'POST', body: {
      payload, channel: 'email', recipient: { email: 'grace@client.co.ke' },
      expiryDays: 14, durable: true, purpose: 'negotiate' } });
    assert.ok(r && (r.token || r.link || r.id), 'the share was actually created: ' + JSON.stringify(r).slice(0,200));

    const after = await admin.json('/api/contracts/' + id);
    const auditAfter = (after.audit || []);
    const sharedAfter = auditAfter.filter(a => a.action === 'Shared').length;

    console.log('audit entries before:', auditBefore.length, '| after:', auditAfter.length);
    console.log("'Shared' entries before:", sharedBefore, '| after:', sharedAfter);

    // THE FINDING: the send happened, but the trail did not grow a 'Shared' line.
    assert.strictEqual(sharedAfter, sharedBefore,
      'server recorded a Shared line by itself (would mean the phone gap is covered)');
    assert.strictEqual(auditAfter.length, auditBefore.length,
      'server appended SOMETHING to the audit trail on POST /api/shares');

    // And prove the share really exists on the wire (so this is a recorded gap,
    // not a failed send): the shares overview lists it.
    const ov = await admin.json('/api/shares/overview');
    const listed = JSON.stringify(ov).includes(id);
    console.log('share visible in /api/shares/overview for', id, ':', listed);

    console.log('\nCONFIRMED: POST /api/shares creates the link but writes NO audit line.');
    console.log('A phone send (POST-only) is therefore absent from c.audit and from the History timeline.');
  } finally {
    await h.stop();
  }
})().catch(e => { console.error('REPRO ERROR:', e && e.message); process.exit(1); });
