/* ============================================================
   F214 — the Daily Brief: HaTi speaks first (WO-3, the gap-map order)
   ============================================================
   Once a day, per member, ONE email listing what needs THEM — and on a quiet
   day, nothing. The rules pinned here, each a decision:

   - PERSONAL means personal: a member's brief carries their own assigned
     commitments and the reviews waiting on their verdict; the portfolio
     dates (expiries, notice deadlines) and orphan overdue commitments go to
     ADMINS, who are the people who can re-route them.
   - QUIET DAYS SAY NOTHING — a member with no items gets no email, and no
     dedupe row is burned, so items arriving later the same day still brief.
   - ONCE A DAY, however many sweeps run.
   - THE SWITCH IS HONOURED: prefs.dailyBrief=false silences a member, and
     turning it back on the same day briefs them (nothing was burned while
     off).
   - SCOPE IS SCOPE: a folder the member cannot open never appears in their
     brief, whoever assigned them the duty inside it.
   - EACH READER'S OWN LANGUAGE, like every member mail since f185.
   - A REFUSING PROVIDER leaves the sweep alive and honest outbox rows.

   All sends land on the recording mail stub. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

const isoDay = off => {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('F214 — the Daily Brief', () => {
  let h, W, mail;
  const MEMBER = 'everything@example.co.ke';       // Unrestricted Legal
  const RESTRICTED = 'restricted@example.co.ke';   // folder A only
  const NOVALUES = 'novalues@example.co.ke';
  const ADMIN = 'admin@example.co.ke';

  const put = (id, over) => W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: {
    id, name: over.name || ('Daily brief fixture ' + id), counterparty: 'Savannah Consumer Goods Limited',
    folder: FOLDER_A, status: 'Draft', fields: {}, metadata: {}, obligations: [],
    audit: [], rounds: [], versions: [], signatures: [], comments: [], ...over } } });
  const run = () => W.admin.raw('/api/daily-brief/run', { method: 'POST', body: {} });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const settle = async (pred, ms = 2500) => {
    const end = Date.now() + ms;
    while (Date.now() < end && !pred()) await pause(25);
    await pause(200);
  };
  const briefsTo = addr => mail.sent.filter(m => m.to === addr && /HaTi|väntar på dig/i.test(m.subject));

  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    mail = h.mail;
    // the member reads Swedish — their brief must follow THEIR language
    await W.unrestricted.json('/api/me/lang', { method: 'PUT', body: { lang: 'sv' } });
    // the restricted member mutes the brief BEFORE anything is staged for them
    await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { dailyBrief: false } });

    // the member's own commitment, due in 3 days
    await put('MK-DB-OB', { obligations: [{ id: 'ob_1', desc: 'File the quarterly rebate statement',
      due: isoDay(3), status: 'open', assignee: 'Unrestricted Legal' }] });
    // a review waiting on the member's verdict
    await put('MK-DB-RV', {
      changes: [{ id: 'CHG-1', status: 'pending', side: 'owner', clause: 'c1',
        oldText: 'Thirty days.', newText: 'Forty-five days.', author: 'Amina Otieno' }],
      review: { requests: [{ id: 'REV-1', status: 'open', by: 'Amina Otieno',
        reviewer: { name: 'Unrestricted Legal' }, changeIds: ['CHG-1'], at: new Date().toISOString() }] } });
    // the admin's portfolio dates: expires in 20 days, 10 days' notice → decision in 10
    await put('MK-DB-EXP', { name: 'Cold store lease — Athi River',
      metadata: { expiryDate: isoDay(20), noticePeriodDays: 10 } });
    // an overdue commitment NOBODY owns — the admin's to re-route
    await put('MK-DB-ORPHAN', { obligations: [{ id: 'ob_2', desc: 'Renew the forklift insurance',
      due: isoDay(-2), status: 'open', assignee: 'Somebody Wholeft' }] });
    // a signing route whose next signer is the ADMIN, internally
    await put('MK-DB-SIGN', { name: 'Board services agreement',
      signerPlan: [
        { id: 'sg-us-1', party: 'internal', order: 1, name: 'Amina Otieno', email: ADMIN, role: 'Director', signed: false },
        { id: 'sg-cp-1', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@client.co.ke', role: 'Director', signed: false }] });
    // duties for the RESTRICTED member: one in their stream, one in the stream they cannot see
    await put('MK-DB-RA', { obligations: [{ id: 'ob_3', desc: 'Collect the weighbridge tickets',
      due: isoDay(2), status: 'open', assignee: 'Restricted Legal' }] });
    await put('MK-DB-RB', { folder: FOLDER_B, name: 'Naivas promo addendum',
      obligations: [{ id: 'ob_4', desc: 'Deliver the promo stock plan',
        due: isoDay(2), status: 'open', assignee: 'Restricted Legal' }] });
  });
  after(async () => { await h.stop(); });

  test('one morning, one email per person, each carrying only what needs THEM', async () => {
    mail.reset();
    const r = await run();
    assert.equal(r.status, 200);
    await settle(() => briefsTo(MEMBER).length >= 1 && briefsTo(ADMIN).length >= 1);

    const m = briefsTo(MEMBER);
    assert.equal(m.length, 1, 'the member gets exactly one brief');
    assert.match(m[0].subject, /väntar på dig .* \(2\)/i,
      'in their own Swedish, counting their two items');
    assert.ok(m[0].text.includes('File the quarterly rebate statement'), 'their commitment is in it');
    assert.ok(m[0].text.includes('#contract=MK-DB-OB'), 'with its link');
    assert.ok(/MK-DB-RV|1 ändring/.test(m[0].text), 'and the review waiting on them');
    assert.ok(!m[0].text.includes('Cold store lease'), 'portfolio dates are not theirs to chase');
    assert.ok(!m[0].text.includes('Renew the forklift insurance'), 'nor the orphan commitment');

    const a = briefsTo(ADMIN);
    assert.equal(a.length, 1, 'the admin gets exactly one brief');
    assert.match(a[0].subject, /What needs you at HaTi today/, 'in English — they never chose a language');
    assert.ok(a[0].text.includes('Cold store lease'), 'the expiry inside 30 days');
    assert.ok(/give notice by/.test(a[0].text), 'the renewal-notice deadline inside 14');
    assert.ok(a[0].text.includes('Renew the forklift insurance'), 'the commitment nobody owns');
    assert.ok(a[0].text.includes('Board services agreement'), 'and the signature that is theirs to give');
    assert.ok(!a[0].text.includes('File the quarterly rebate statement'),
      'an assigned commitment is its owner\'s, not the admin\'s');

    assert.equal(briefsTo(NOVALUES).length, 0, 'a quiet member hears nothing at all');
    assert.equal(briefsTo(RESTRICTED).length, 0, 'a muted member hears nothing, whatever is staged');
  });

  test('a second sweep the same day sends nobody a second brief', async () => {
    mail.reset();
    assert.equal((await run()).status, 200);
    await pause(600);
    assert.equal(briefsTo(MEMBER).length, 0);
    assert.equal(briefsTo(ADMIN).length, 0);
  });

  test('turning the switch back on briefs the muted member the same day — scoped to their streams', async () => {
    await W.restricted.json('/api/me/prefs', { method: 'PUT', body: { dailyBrief: true } });
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => briefsTo(RESTRICTED).length >= 1);
    const r = briefsTo(RESTRICTED);
    assert.equal(r.length, 1, 'nothing was burned while the switch was off');
    assert.ok(r[0].text.includes('Collect the weighbridge tickets'), 'their in-stream duty is there');
    assert.ok(!r[0].text.includes('Deliver the promo stock plan'),
      'the duty in the stream they cannot open is NOT — scope is scope');
    assert.ok(!r[0].text.includes('Naivas'), 'not even the contract\'s name leaks');
  });

  /* ============================================================
     DAILY, WEEKLY OR NOT AT ALL (owner-asked 19 Aug 2026)
     ============================================================
     The tick-box became a choice of three. The rules pinned here:
     - ABSENT MEANS DAILY, exactly as before, and an account still carrying
       the old dailyBrief:false reads 'off' — nobody's setting moves.
     - WEEKLY IS ONCE A WEEK, keyed on the week's Monday, so a second sweep
       the same week is silent and a server that was down on Monday still
       sends on the Tuesday.
     - THE WORDS SAY WHICH ONE IT IS: a weekly brief must not arrive saying
       "today".
     - A VALUE OUTSIDE THE THREE IS REFUSED rather than stored. */
  test('a value outside the three is refused, and nothing is stored', async () => {
    const r = await W.novalues.raw('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'hourly' } });
    assert.equal(r.status, 400, 'a preference nobody can read is worse than none');
    const ok = await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { notifyShareOpens: true } });
    assert.ok(!ok.prefs.briefEvery, 'and the refused value was never written');
  });

  test('weekly sends once, says "this week", and the second sweep that week is silent', async () => {
    await put('MK-DB-WK', { obligations: [{ id: 'ob_w', desc: 'Reconcile the weekly haulage log',
      due: isoDay(2), status: 'open', assignee: 'No Values Legal' }] });
    await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'weekly' } });
    mail.reset();
    assert.equal((await run()).status, 200);
    await settle(() => briefsTo(NOVALUES).length >= 1);
    const got = briefsTo(NOVALUES);
    assert.equal(got.length, 1, 'one brief');
    assert.match(got[0].subject, /this week/i, 'the subject says which brief this is');
    assert.match(got[0].text, /this week/i, 'and so does the lead line');
    assert.ok(!/today/i.test(got[0].subject), 'a weekly brief must never arrive saying "today"');
    assert.ok(got[0].text.includes('Reconcile the weekly haulage log'), 'with their own work in it');

    mail.reset();
    assert.equal((await run()).status, 200);
    await pause(700);
    assert.equal(briefsTo(NOVALUES).length, 0, 'once a week means once a week');
  });

  test('turning it off silences them, and daily brings them back the same day', async () => {
    await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'off' } });
    mail.reset();
    assert.equal((await run()).status, 200);
    await pause(700);
    assert.equal(briefsTo(NOVALUES).length, 0, 'off is off');
    // put them back where the rest of this file expects to find them
    await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { briefEvery: 'daily' } });
  });

  test('the three answers, and the words for them, exist in both languages', () => {
    const { STRINGS } = require('../js/i18n.js');
    for (const k of ['set_brief_how_often', 'set_brief_daily', 'set_brief_daily_sub',
      'set_brief_weekly', 'set_brief_weekly_sub', 'set_brief_off', 'set_brief_off_sub',
      'set_brief_saved_daily', 'set_brief_saved_weekly', 'set_brief_saved_off',
      'mail_wb_subject', 'mail_wb_lead', 'mail_wb_off']) {
      assert.ok(STRINGS.en[k], 'en ' + k);
      assert.ok(STRINGS.sv[k], 'sv ' + k);
    }
  });

  test('the account page offers three options and writes on change', () => {
    const fs = require('node:fs'), path = require('node:path');
    const src = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8');
    for (const v of ['daily', 'weekly', 'off'])
      assert.ok(src.includes("'" + v + "','set_brief_" + v + "'"), 'the ' + v + ' option is drawn');
    assert.ok(!src.includes('pref-daily-brief'),
      'the old tick-box is gone rather than left beside its replacement');
    const i = src.indexOf('[data-pref-brief]');
    assert.ok(src.slice(i, i + 600).includes("api('me/prefs','PUT',{ briefEvery:v })"),
      'a press writes immediately — a setting that needs a Save button is off when it matters');
    assert.match(src.slice(i, i + 900), /briefPaintCadence\(was\)/,
      'and a failed save puts the previous answer back');
    assert.match(src.slice(i, i + 900), /briefPaintCadence\(v\)/,
      'a save repaints EVERY copy of the control — this section is on screen twice');
  });

  test('the two hosts read the cadence by the same rule', () => {
    const fs = require('node:fs'), path = require('node:path');
    const srv = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const cli = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'settings.js'), 'utf8');
    for (const src of [srv, cli])
      assert.match(src, /dailyBrief === false \? 'off' : 'daily'|dailyBrief===false \? 'off' : 'daily'/,
        'absent means daily, and the old boolean still means off');
  });

  test('a refusing provider leaves the sweep alive and the attempt honestly recorded', async () => {
    await put('MK-DB-NV', { obligations: [{ id: 'ob_5', desc: 'Certify the cold-chain audit',
      due: isoDay(1), status: 'open', assignee: 'No Values Legal' }] });
    mail.setMode('refuse');
    const r = await run();
    assert.equal(r.status, 200, 'a dead provider must not take the sweep down');
    let rows = [];
    for (const end = Date.now() + 2500; Date.now() < end && !rows.length;) {
      rows = ((await W.admin.json('/api/outbox')).items || [])
        .filter(i => (i.subject + ' ' + (i.body || '')).includes('Certify the cold-chain audit'));
      if (!rows.length) await pause(50);
    }
    mail.setMode('ok');
    assert.ok(rows.length >= 1, 'the attempt is on the record');
    assert.ok(rows.every(i => !i.sent), 'and recorded as NOT sent');
  });
});
