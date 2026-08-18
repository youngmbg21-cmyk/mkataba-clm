/* ============================================================
   F212 — the nudge reaches the person responsible (WO-1, the gap-map order)
   ============================================================
   Obligations have carried an `assignee` since the finder shipped, and the
   sweep ignored it: every overdue notice went to EVERY ADMIN, once, the day
   AFTER the date. The person who owed the quarterly report never heard, the
   admin became a human message-router, and nothing at all fired before the
   deadline — on the best-documented SME loss there is (missed dates).

   The rule now: where the assignee RESOLVES to a member record (email match
   first, then name), THAT member is told — 7 days before the date, on it,
   and the day after — in their own language, with the contract's link; the
   admins are brought in only when the duty is STILL open three days later.
   Where nothing resolves, the old admin day-after mail runs byte-identical
   (f65 pins its wording), so nothing is quieter than it was. Only a MEMBER'S
   own address is ever written to — free text that merely looks like an
   outside address gets no mail (the open-relay rule the notify-signer route
   learned, f185).

   Every send here lands on a recording mail stub — nothing fires at a real
   inbox — and the dedupe is proved by running the sweep twice. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('F212 — obligation nudges route to the assignee', () => {
  let h, W, mail;
  const MEMBER_NAME = 'Unrestricted Legal';
  const MEMBER_EMAIL = 'everything@example.co.ke';
  const ADMIN_EMAIL = 'admin@example.co.ke';

  const put = (id, obligations) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: 'Facilities services — ' + id, counterparty: 'Savannah Consumer Goods Limited',
    status: 'Signed', fields: {}, metadata: {}, obligations,
    audit: [], rounds: [], versions: [], signatures: [], comments: [] } } });
  const run = () => W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
  // The seeded portfolio and share nudges can mail too on any run — every
  // assertion filters to its own obligation's wording rather than counting.
  const about = desc => mail.sent.filter(m => (m.subject + ' ' + m.text).includes(desc));
  /* The sweep's sends are fire-and-forget BY DESIGN (a reminder must not hold
     the route), so the stub is read after a settle: wait for the expected
     arrival, then a beat longer so an unexpected second mail has had time to
     land before "exactly one" is asserted. */
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const settle = async (pred, ms = 2000) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !pred()) await pause(25);
    await pause(150);
  };

  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    mail = h.mail;
    // the assignee reads Swedish — the nudge must follow THEIR language
    await W.unrestricted.json('/api/me/lang', { method: 'PUT', body: { lang: 'sv' } });
  });
  after(async () => { await h.stop(); });

  test('7 days before the date, the assignee hears — in their own language', async () => {
    await put('MK-OB-SOON', [{ id: 'ob_s', desc: 'File the Q3 compliance report',
      due: isoDay(7), status: 'open', assignee: MEMBER_NAME }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('File the Q3 compliance report').length >= 1);
    const got = about('File the Q3 compliance report');
    assert.equal(got.length, 1, 'exactly one nudge, to one person — not one per admin');
    assert.equal(got[0].to, MEMBER_EMAIL, 'the nudge goes to the member the name resolves to');
    assert.ok(/Förfaller om 7 dagar/.test(got[0].subject),
      'the member chose Swedish, so the subject is the Swedish one');
    assert.ok(got[0].text.includes('#contract=MK-OB-SOON'),
      'the mail carries the contract link — a nudge with nowhere to press is a chore');
  });

  test('on the day itself, a second nudge — and the admins still hear nothing', async () => {
    await put('MK-OB-TODAY', [{ id: 'ob_t', desc: 'Deliver the insurance certificate',
      due: isoDay(0), status: 'open', assignee: MEMBER_NAME }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Deliver the insurance certificate').length >= 1);
    const got = about('Deliver the insurance certificate');
    assert.equal(got.length, 1);
    assert.equal(got[0].to, MEMBER_EMAIL);
    assert.ok(!got.some(m => m.to === ADMIN_EMAIL),
      'before escalation the admin inbox stays quiet — that is the whole feature');
  });

  test('the day after, overdue goes to the assignee, not the admins', async () => {
    await put('MK-OB-OVER', [{ id: 'ob_o', desc: 'Pay the licence renewal fee',
      due: isoDay(-1), status: 'open', assignee: MEMBER_NAME }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Pay the licence renewal fee').length >= 1);
    const got = about('Pay the licence renewal fee');
    assert.equal(got.length, 1);
    assert.equal(got[0].to, MEMBER_EMAIL);
    assert.ok(/Försenat/.test(got[0].subject), 'overdue, in the member\'s Swedish');
  });

  test('still open three days later, the admins are brought in by name', async () => {
    await put('MK-OB-ESC', [{ id: 'ob_e', desc: 'Return the signed inspection log',
      due: isoDay(-4), status: 'open', assignee: MEMBER_NAME }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Return the signed inspection log').some(m => m.to === ADMIN_EMAIL));
    const got = about('Return the signed inspection log');
    assert.ok(got.length >= 1, 'the escalation fires');
    assert.ok(got.every(m => m.to === ADMIN_EMAIL || m.to !== MEMBER_EMAIL),
      'escalation is the admins\' mail — the assignee already had three');
    assert.ok(got.some(m => m.to === ADMIN_EMAIL), 'and the admin is among them');
    const admin = got.find(m => m.to === ADMIN_EMAIL);
    assert.ok(/Still open 4 days/.test(admin.subject),
      'the admin never chose a language, so their copy is English');
    assert.ok(admin.text.includes(MEMBER_NAME),
      'the escalation NAMES who was reminded — an alarm with nobody\'s name on it cannot be acted on');
  });

  test('running the sweep again re-sends nothing', async () => {
    mail.reset();
    assert.equal((await run()).status, 200);
    await pause(500);
    for (const desc of ['File the Q3 compliance report', 'Deliver the insurance certificate',
      'Pay the licence renewal fee', 'Return the signed inspection log'])
      assert.equal(about(desc).length, 0, `"${desc}" must not fire twice`);
  });

  test('an assignee written as an email address resolves the same member', async () => {
    await put('MK-OB-MAIL', [{ id: 'ob_m', desc: 'Submit the annual usage statement',
      due: isoDay(7), status: 'open', assignee: MEMBER_EMAIL }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Submit the annual usage statement').length >= 1);
    const got = about('Submit the annual usage statement');
    assert.equal(got.length, 1);
    assert.equal(got[0].to, MEMBER_EMAIL);
  });

  test('a name that matches nobody keeps the old admin mail, unchanged', async () => {
    await put('MK-OB-NONE', [{ id: 'ob_n', desc: 'Arrange the site handover',
      due: isoDay(-1), status: 'open', assignee: 'Somebody Wholeft' }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => about('Arrange the site handover').some(m => m.to === ADMIN_EMAIL));
    const got = about('Arrange the site handover');
    assert.ok(got.length >= 1 && got.every(m => m.to !== MEMBER_EMAIL));
    assert.ok(got.some(m => m.to === ADMIN_EMAIL));
    assert.ok(/^Obligation overdue: /.test(got[0].subject),
      'the legacy wording f65 pins — nothing is quieter than it was');
  });

  test('an OUTSIDE address in the assignee box is never mailed (open-relay rule)', async () => {
    await put('MK-OB-EXT', [{ id: 'ob_x', desc: 'Confirm the customs clearance',
      due: isoDay(7), status: 'open', assignee: 'stranger@elsewhere.example' }]);
    mail.reset();
    assert.equal((await run()).status, 200);
    await pause(500);
    assert.ok(!mail.sent.some(m => m.to === 'stranger@elsewhere.example'),
      'free text that looks like an address is not a member — HaTi must not be an open relay');
    // and at 7 days out with nobody resolved there is nothing to send at all
    assert.equal(about('Confirm the customs clearance').length, 0);
  });

  test('a refusing provider leaves the sweep alive and the outbox honest', async () => {
    await put('MK-OB-REF', [{ id: 'ob_r', desc: 'Lodge the performance bond',
      due: isoDay(0), status: 'open', assignee: MEMBER_NAME }]);
    mail.setMode('refuse');
    const r = await run();
    assert.equal(r.status, 200, 'a dead mail provider must not take the sweep down');
    /* the send is still in flight when the route returns — the provider must
       stay refusing until the attempt lands, or the retry hits a healthy stub
       and this test proves nothing */
    let rows = [];
    for (const end = Date.now() + 2000; Date.now() < end && !rows.length;) {
      rows = ((await W.admin.json('/api/outbox')).items || [])
        .filter(i => (i.subject + ' ' + (i.body || '')).includes('Lodge the performance bond'));
      if (!rows.length) await pause(50);
    }
    mail.setMode('ok');
    assert.ok(rows.length >= 1, 'the attempt is on the record');
    assert.ok(rows.every(i => !i.sent),
      'and recorded as NOT sent — "sent" must mean sent. rows: '
      + JSON.stringify(rows.map(i => ({ to: i.to_addr, sent: i.sent, provider: i.provider }))));
  });
});
