/* AUDIT REPRO — REVERSED IN PLACE 14 Aug 2026, when the finding was fixed.
   ============================================================
   THE FINDING IT WAS WRITTEN FOR: a share created from the phone left no line
   in the audit trail. The phone's mShareCreate (js/mobile-contract.js) POSTs
   /api/shares and stops; the desktop share dialog additionally called
   logAudit('Shared', …) + persist; and the server appended nothing. So a
   phone-originated send was invisible in c.audit AND in negoTimeline (whose
   'link' beat is read from c.audit), while the link itself worked perfectly.

   THE FIX put the line on the SERVER, at POST /api/shares — the one route every
   send passes through — rather than copying the missing call into the phone, so
   any future route in is recorded by construction.

   So this script now asserts the OPPOSITE of what it first asserted, and it is
   the same claim either way: a send is in the record. It reproduces the phone
   exactly — build a payload, POST it, do nothing else — and requires the trail
   to have grown. Fails against the old server. */
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

    // THE CLAIM: a send made the way the PHONE makes it is in the record.
    assert.strictEqual(sharedAfter, sharedBefore + 1,
      'POST /api/shares must record exactly one Shared line — a phone send left no trace before this');
    const line = auditAfter.find(a => a.action === 'Shared');
    assert.ok(/link sent to/i.test(line.detail || ''),
      'and the line says what was sent, to whom and by which channel: ' + JSON.stringify(line));
    assert.ok(line.user, 'and who sent it');
    console.log('the line reads:', line.detail, '—', line.user);

    // And prove the share really exists on the wire (so this is a recorded gap,
    // not a failed send): the shares overview lists it.
    const ov = await admin.json('/api/shares/overview');
    const listed = JSON.stringify(ov).includes(id);
    console.log('share visible in /api/shares/overview for', id, ':', listed);

    console.log('\nFIXED: POST /api/shares creates the link AND writes the audit line.');
    console.log('A phone send is now in c.audit and therefore in the History timeline.');
  } finally {
    await h.stop();
  }
})().catch(e => { console.error('REPRO ERROR:', e && e.message); process.exit(1); });
