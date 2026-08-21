/* J9 claim 4 — the family term arithmetic (effExpiryReader) is genuinely
   SHARED between runReminders and runDailyBriefs: a SIGNED amendment moves
   the date the REMINDER sweep (90/60/30-day milestones) fires on, and a
   DRAFT amendment does not. Reproduced against a real server. */
const assert = require('node:assert/strict');
const { startHati, seedWorkspace, FOLDER_A } = require('../../helpers');

const isoDay = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: over.name || ('Family fixture ' + id), counterparty: 'Nandi Dairy',
    folder: FOLDER_A, status: over.status || 'Signed', fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], ...over } } });
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  const subjects = async () => ((await W.admin.json('/api/outbox')).items || []).map(i => i.subject);

  try {
    // ---- SIGNED amendment moves the reminder date ----
    // Parent's OWN stated expiry is 200 days out (no milestone).
    await put('MK-FAM-P', { metadata: { expiryDate: isoDay(200) } });
    // Signed amendment sets the term to 60 days out (a milestone).
    await put('MK-FAM-A', { parentId: 'MK-FAM-P', relation: 'amendment', status: 'Signed',
      metadata: { expiryDate: isoDay(60), effectiveDate: isoDay(-1) } });
    let r = await run();
    assert.equal(r.status, 200);
    let subs = await subjects();
    const fired60 = subs.some(s => /Renewal in 60 days: .*MK-FAM-P/.test(s));
    const fired200noise = subs.some(s => /Renewal in \d+ days: .*MK-FAM-P/.test(s) && !/Renewal in 60 days/.test(s));
    assert.ok(fired60, 'FAIL: the signed amendment\'s expiry (60d) did not move the reminder — got: ' + JSON.stringify(subs.filter(s=>s.includes('MK-FAM-P'))));
    console.log('PASS 4a: a SIGNED amendment moves the reminder-sweep date. subjects:', subs.filter(s=>s.includes('MK-FAM')));

    // ---- DRAFT amendment must NOT move the reminder date ----
    await put('MK-FAM-P2', { metadata: { expiryDate: isoDay(210) } }); // no milestone
    await put('MK-FAM-B', { parentId: 'MK-FAM-P2', relation: 'amendment', status: 'Draft',
      metadata: { expiryDate: isoDay(30), effectiveDate: isoDay(-1) } }); // would be a milestone if honoured
    r = await run();
    assert.equal(r.status, 200);
    subs = await subjects();
    const wronglyFired30 = subs.some(s => /Renewal in 30 days: .*MK-FAM-P2/.test(s));
    assert.ok(!wronglyFired30, 'FAIL: a DRAFT amendment moved the reminder-sweep date — got: ' + JSON.stringify(subs.filter(s=>s.includes('MK-FAM-P2'))));
    console.log('PASS 4b: a DRAFT amendment does NOT move the reminder-sweep date. subjects touching MK-FAM-P2:', subs.filter(s=>s.includes('MK-FAM-P2')));

    console.log('J9-04 ALL PASS');
  } finally {
    await h.stop();
  }
})().catch(e => { console.error('J9-04 FAILED:', e); process.exit(1); });
