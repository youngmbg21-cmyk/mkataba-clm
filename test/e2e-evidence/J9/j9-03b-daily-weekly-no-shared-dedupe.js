/* J9 claim 3 — daily and weekly briefs must not share a dedupe row: a member
   who gets today's DAILY brief and then, the SAME day, switches to WEEKLY
   must still get a weekly brief (proves the rkey prefixes are genuinely
   separate, not merely claimed to be). */
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A } = require('../../helpers');

(async () => {
  const h = await startHatiWithMail();
  const W = await seedWorkspace(h);
  const mail = h.mail;
  const run = () => W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const briefsTo = addr => mail.sent.filter(m => m.to === addr);

  try {
    const isoDay = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
    // give novalues something to brief about so a brief is actually sent
    await W.admin.json('/api/contracts/MK-DW-1', { method: 'PUT', body: { contract: {
      id: 'MK-DW-1', name: 'Dedupe fixture', counterparty: 'X', folder: FOLDER_A, status: 'Draft',
      fields: {}, metadata: {}, audit: [], rounds: [], versions: [], signatures: [], comments: [],
      obligations: [{ id: 'ob_1', desc: 'Dedupe test duty', due: isoDay(2), status: 'open', assignee: 'No Values Legal' }]
    } } });

    mail.reset();
    let r = await run();
    assert.equal(r.status, 200);
    await pause(1200);
    const daily1 = briefsTo('novalues@example.co.ke');
    assert.equal(daily1.length, 1, 'expected exactly one daily brief, got ' + daily1.length);
    console.log('PASS: daily brief #1 sent, subject=', daily1[0].subject);

    // second run same day: dedupe should hold (no second daily)
    mail.reset();
    await run();
    await pause(600);
    assert.equal(briefsTo('novalues@example.co.ke').length, 0, 'daily dedupe should hold on 2nd run');
    console.log('PASS: 2nd same-day daily run sent nothing (dedupe holds)');

    // now switch to weekly, SAME day, and run again
    await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'weekly' } });
    mail.reset();
    r = await run();
    assert.equal(r.status, 200);
    await pause(1200);
    const weekly1 = briefsTo('novalues@example.co.ke');
    assert.equal(weekly1.length, 1, 'FAIL if 0: weekly shares the daily dedupe row and was silently swallowed. got ' + weekly1.length);
    assert.match(weekly1[0].subject, /this week/i, 'this should genuinely be the weekly wording');
    console.log('PASS: switching to weekly the SAME day still sent a brief — daily and weekly do not share a dedupe row. subject=', weekly1[0].subject);

    console.log('J9-03b ALL PASS');
  } finally {
    await h.stop();
  }
})().catch(e => { console.error('J9-03b FAILED:', e); process.exit(1); });
