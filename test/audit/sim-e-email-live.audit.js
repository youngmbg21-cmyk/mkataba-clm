/* AUDIT SIMULATION E — EMAIL, WITH A PROVIDER ACTUALLY ATTACHED.
 *
 * The first audit said out loud that it had NOT covered "real outbound email
 * with a live provider". This is that gap. Nothing here fires at anybody's
 * inbox: RESEND_BASE_URL is overridable exactly as ANTHROPIC_BASE_URL is, so
 * the whole live path runs for real against a stand-in that records what it was
 * handed and can be told to refuse.
 *
 * That distinction is the whole point. Every existing test runs with email OFF,
 * so the outbox branch is the only branch any of them has ever taken — the code
 * that talks to a provider, reads its refusal and reports what it said has
 * never been executed by a test.
 *
 * Run: node test/audit/sim-e-email-live.audit.js
 */
const { startHatiWithMail, seedWorkspace, nameASigner } = require('../helpers');

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const note = s => console.log('\n· ' + s);

/* The share payload the browser builds, in the shape the route validates. */
const mkPayload = (id, extra = {}) => ({ kind: 'hati-share', purpose: 'negotiate',
  contract: { id, name: 'Logistics Services Agreement', changes: [] },
  org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno',
  at: new Date().toISOString(), ...extra });

(async () => {
  const h = await startHatiWithMail();
  const mail = h.mail;
  try {
    const W = await seedWorkspace(h);

    note('A provider is attached. Does the workspace know?');
    const boot = await W.admin.json('/api/bootstrap');
    check('E: the workspace reports email as configured',
      boot.emailConfigured === true, `emailConfigured=${boot.emailConfigured}`);

    note('A share link, sent by email.');
    await nameASigner(W.admin, 'MK-A2');
    mail.reset();
    const share = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-A2'), channel: 'email',
      recipient: { email: 'grace@client.co.ke', name: 'Grace Wanjiru' },
      expiryDays: 14, durable: true, purpose: 'negotiate',
      message: 'Please have a look at clause 7.' } });
    check('E: the share route reports the email as sent',
      share.emailSent === true || share.emailSent === 1, JSON.stringify({ emailSent: share.emailSent, emailError: share.emailError || null }));
    check('E: and the provider was actually handed one message',
      mail.sent.length === 1, `${mail.sent.length} message(s)`);
    const m0 = mail.sent[0] || {};
    check('E: addressed to the person it was sent to',
      m0.to === 'grace@client.co.ke', String(m0.to));
    check('E: sent from the workspace’s own configured address',
      /hati\.test/.test(String(m0.from)), String(m0.from));
    check('E: and the mail carries a working link to the contract',
      /https?:\/\/\S+/.test(String(m0.text)), (String(m0.text).match(/https?:\/\/\S+/) || [''])[0].slice(0, 60));
    check('E: the sender’s covering note travels in the EMAIL (which is where it belongs)',
      /clause 7/.test(String(m0.text)), /clause 7/.test(String(m0.text)) ? 'present' : 'MISSING');

    note('The outbox is the record. Does a delivered message land in it correctly?');
    const ob = await W.admin.json('/api/outbox');
    const row = (ob.items || []).find(r => (r.to_addr || r.to) === 'grace@client.co.ke');
    check('E: the delivered message is recorded as sent, by the real provider',
      !!row && (row.sent === 1 || row.sent === true) && /resend/.test(String(row.provider || '')),
      row ? `sent=${row.sent} provider=${row.provider}` : 'no outbox row');

    /* ---------------- THE PROVIDER REFUSES ---------------- */
    note('Now the provider starts refusing — the commonest real failure, an unverified sending domain.');
    mail.setMode('refuse', { status: 403, message: 'The hati.test domain is not verified. Please verify it.' });
    mail.reset();
    const share2 = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-A2'), channel: 'email',
      recipient: { email: 'grace@client.co.ke', name: 'Grace Wanjiru' },
      expiryDays: 14, durable: true, purpose: 'negotiate' } });
    check('E: a refused send is reported as NOT sent',
      !share2.emailSent, `emailSent=${share2.emailSent}`);
    check('E: and the reason the provider gave is handed back, not swallowed',
      /not verified/i.test(String(share2.emailError || '')),
      String(share2.emailError || 'NO REASON RETURNED').slice(0, 120));

    const ob2 = await W.admin.json('/api/outbox');
    const rows2 = (ob2.items || []).filter(r => (r.to_addr || r.to) === 'grace@client.co.ke');
    const failed = rows2.find(r => !(r.sent === 1 || r.sent === true));
    check('E: the failed send is in the outbox as a failure, with the reason on it',
      !!failed && /not verified/i.test(String(failed.detail || '')),
      failed ? `provider=${failed.provider} detail=${String(failed.detail).slice(0, 80)}` : 'no failed row');

    check('E: THE LINK STILL EXISTS after a failed send — the work is not lost',
      !!share2.token || !!share2.url || !!(share2.share && share2.share.token),
      share2.token ? 'token issued' : JSON.stringify(Object.keys(share2)));

    /* ---------------- THE PROVIDER IS UNREACHABLE ---------------- */
    note('And now the provider cannot be reached at all — the other real failure.');
    mail.setMode('dead');
    const share3 = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-A2'), channel: 'email',
      recipient: { email: 'grace@client.co.ke', name: 'Grace Wanjiru' },
      expiryDays: 14, durable: true, purpose: 'negotiate' } });
    check('E: an unreachable provider does not take the request down with it',
      !!share3 && !share3.error, JSON.stringify(share3 && share3.error || 'no error'));
    check('E: it is reported as not sent, with a reason',
      !share3.emailSent && String(share3.emailError || '').length > 0,
      String(share3.emailError || 'NO REASON').slice(0, 100));

    /* ---------------- A PASSWORD RESET ---------------- */
    note('A password reset is the one email a locked-out person cannot work around.');
    mail.setMode('ok'); mail.reset();
    await W.admin.json('/api/password/reset-request', { method: 'POST', body: {
      email: 'restricted@example.co.ke' } });
    check('E: a reset request with a live provider actually sends the mail',
      mail.sent.length === 1 && mail.lastTo() === 'restricted@example.co.ke',
      `${mail.sent.length} message(s) to ${mail.lastTo()}`);
    const resetBody = (mail.sent[0] || {}).text || '';
    check('E: and the reset link is in the message, not in the HTTP response',
      /#reset=/.test(resetBody), (resetBody.match(/#reset=\S+/) || [''])[0].slice(0, 40));

    note('An address nobody has must look identical — or the route is an account oracle.');
    mail.reset();
    const a = await W.admin.raw('/api/password/reset-request', { method: 'POST', body: { email: 'nobody@nowhere.test' } });
    const b = await W.admin.raw('/api/password/reset-request', { method: 'POST', body: { email: 'restricted@example.co.ke' } });
    check('E: the reply is identical whether or not the address is on file',
      a.status === b.status && a.text === b.text,
      `${a.status} ${a.text} vs ${b.status} ${b.text}`);
    check('E: and only the real address actually generated a message',
      mail.sent.length === 1 && mail.lastTo() === 'restricted@example.co.ke',
      mail.toAddresses().join(',') || 'none');

    /* ---------------- "SENT" MUST MEAN SENT ---------------- */
    note('The three routes that tell somebody an email is on its way. Provider refusing.');
    mail.setMode('refuse', { status: 403, message: 'The hati.test domain is not verified.' });

    mail.reset();
    const added = await W.admin.json('/api/users', { method: 'POST', body: {
      name: 'Late Arrival', email: 'late@example.co.ke', role: 'legal', password: 'temporary-pass-1' } });
    check('E: adding a colleague — the refused welcome email is NOT reported as sent',
      added.emailSent !== true, `emailSent=${added.emailSent}`);
    check('E: …and the admin is told why, so they can pass the password another way',
      String(added.emailError || '').length > 0, String(added.emailError || 'NOTHING SAID'));

    const sh = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-A2'), channel: 'email',
      recipient: { email: 'grace@client.co.ke', name: 'Grace Wanjiru' },
      expiryDays: 14, durable: true, purpose: 'sign' } });
    const tok = sh.token || (sh.share && sh.share.token);
    mail.reset();
    const otp = await W.admin.json('/api/shares/' + tok + '/otp', { method: 'POST', body: {} });
    check('E: the signing code — a refused send is NOT reported as sent',
      otp.emailSent !== true, `emailSent=${otp.emailSent}`);
    check('E: …and the signer is told it did not arrive rather than told to wait for it',
      String(otp.emailError || otp.error || '').length > 0,
      String(otp.emailError || 'NOTHING SAID'));

    note('The password reset must stay silent about WHO exists — but not about whether the mail works.');
    const r1 = await W.admin.raw('/api/password/reset-request', { method: 'POST', body: { email: 'restricted@example.co.ke' } });
    const r2 = await W.admin.raw('/api/password/reset-request', { method: 'POST', body: { email: 'nobody@nowhere.test' } });
    check('E: the reset reply is STILL identical for a real and an unknown address',
      r1.status === r2.status && r1.text === r2.text,
      `${r1.status} ${r1.text} vs ${r2.status} ${r2.text}`);

    note('And the workspace’s own health reading must not say "fine" while nothing is arriving.');
    const health = await W.admin.json('/api/outbox');
    check('E: the outbox route reports the delivery health, not just the configuration',
      health.health && typeof health.health.failing !== 'undefined',
      JSON.stringify(health.health || 'NO HEALTH READING'));
    check('E: and it says mail is failing, because it is',
      health.health && health.health.failing === true,
      JSON.stringify(health.health || {}));

    /* ---------------- WHO SENT IT ---------------- */
    note('Every message leaves under one identity. Is it the right one?');
    mail.reset(); mail.setMode('ok');
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: mkPayload('MK-A2'), channel: 'email',
      recipient: { email: 'grace@client.co.ke', name: 'Grace Wanjiru' },
      expiryDays: 14, durable: true, purpose: 'negotiate' } });
    const froms = new Set(mail.sent.map(s => s.from));
    check('E: one configured sending identity, not a per-message guess',
      froms.size === 1 && /hati\.test/.test([...froms][0] || ''), [...froms].join(' · '));

  } catch (e) {
    check('E: the simulation ran to the end', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  if (pass !== results.length) {
    console.log('\nFAILED:');
    results.filter(r => !r.pass).forEach(r => console.log('  · ' + r.name + (r.detail ? ' — ' + r.detail : '')));
  }
  process.exit(pass === results.length ? 0 : 1);
})();
