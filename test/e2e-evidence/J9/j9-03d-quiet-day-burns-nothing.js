/* J9 — a quiet day sends nothing AND burns no dedupe row, so an item landing
   later the SAME day still briefs. */
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A } = require('../../helpers');

const isoDay = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };

(async () => {
  const h = await startHatiWithMail();
  const W = await seedWorkspace(h);
  const mail = h.mail;
  const run = () => W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const briefsTo = addr => mail.sent.filter(m => m.to === addr);

  try {
    // Run #1: novalues has NOTHING staged yet — a quiet day.
    mail.reset();
    let r = await run();
    assert.equal(r.status, 200);
    await pause(700);
    assert.equal(briefsTo('novalues@example.co.ke').length, 0, 'quiet day: nothing sent');
    console.log('PASS: quiet run #1 sent nothing to novalues');

    // Now stage something for them, SAME day, and run again.
    await W.admin.json('/api/contracts/MK-QUIET-1', { method: 'PUT', body: { contract: {
      id: 'MK-QUIET-1', name: 'Quiet-day fixture', counterparty: 'Someone', folder: FOLDER_A, status: 'Draft',
      fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
      obligations: [{ id: 'ob_q', desc: 'A duty that appeared later the same day', due: isoDay(3), status: 'open', assignee: 'No Values Legal' }]
    } } });
    mail.reset();
    r = await run();
    assert.equal(r.status, 200);
    await pause(1200);
    const got = briefsTo('novalues@example.co.ke');
    assert.equal(got.length, 1, 'FAIL if 0: a quiet run must not have burned the dedupe row — item landing later the same day must still brief. got ' + got.length);
    assert.ok(got[0].text.includes('A duty that appeared later the same day'));
    console.log('PASS: an item landing later the SAME day still triggers a brief — the quiet run burned nothing.');

    console.log('J9-03d ALL PASS');
  } finally { await h.stop(); }
})().catch(e => { console.error('J9-03d FAILED:', e); process.exit(1); });
