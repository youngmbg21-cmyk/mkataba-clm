/* f943 — THE BUG LOG, BATCH 3: A SERVED NOTICE IS THE DECISION, ON THE SERVER TOO (the overnight build,
   26 Oct 2026)

   BUGLOG's note: "the server's renewal sweeps (srvRenewalDecision) do not count a served notice; only the
   browser does." Serving a non-renewal notice is the answer to the renewal question (renewalDecisionOf,
   21 Sep 2026); the screen said so, while the server's 90/60/30-day warnings and the overnight renewal
   memo went on as if nothing had been decided. srvRenewalDecision now reads a served notice as "let it
   lapse", the browser's own reading:
     1 · a contract whose notice was served gets no expiry warning; the same contract without one does
     2 · the reading itself: served → lapse, with the day it was served

   Run: node --test test/f943-a-served-notice-is-the-decision.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const isoDay = off => {
  const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

describe('f943 (1) the sweep', () => {
  let h, W, mail;
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const about = id => mail.sent.filter(m => (m.subject + ' ' + m.text).includes(id));
  before(async () => { h = await startHatiWithMail(); W = await seedWorkspace(h); mail = h.mail; });
  after(async () => { await h.stop(); });
  const put = (id, extra) => W.admin.raw('/api/contracts/' + id, { method: 'PUT', body: { contract: Object.assign({
    id, name: 'Distribution — ' + id, counterparty: 'Savannah Consumer Goods Limited',
    status: 'Signed', folder: 'sales', fields: {}, metadata: {},
    audit: [], rounds: [], versions: [], signatures: [], comments: [], obligations: [],
  }, extra) } });

  test('a served notice stops the expiry warning; the control still gets one', async () => {
    const served = 'MK-N1', loud = 'MK-N2', exp = isoDay(30);
    const r1 = await put(served, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' },
      notice: { servedOn: isoDay(-2), way: 'post', ref: 'REF-1', by: { name: 'Amina Otieno' }, at: new Date().toISOString() } });
    assert.ok(r1.status < 300, 'saved');
    await put(loud, { expiry: exp, owner: { id: null, name: 'Unrestricted Legal' } });
    const stored = await W.admin.json('/api/contracts/' + served);
    assert.equal((stored.notice || {}).servedOn, isoDay(-2), 'the notice is on the record');
    await W.admin.raw('/api/reminders/run', { method: 'POST', body: {} });
    const end = Date.now() + 3000; while (Date.now() < end && !about(loud).length) await pause(25); await pause(200);
    assert.ok(about(loud).length > 0, 'the control is warned — otherwise this test proves nothing');
    assert.equal(about(served).length, 0, 'the letter has gone: an intended ending is not news');
  });
});

describe('f943 (2) the reading', () => {
  test('served → lapse, with the day it was served; no notice → the recorded answer as before', () => {
    const src = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
    const at = src.indexOf('function srvRenewalDecision(full, expiry)');
    const fn = new Function('RENEWAL_ANSWERS_SRV', src.slice(at, src.indexOf('\n}\n', at) + 2) + '\nreturn srvRenewalDecision;')(['renew', 'renegotiate', 'lapse']);
    const d = fn({ notice: { servedOn: '2026-10-01' }, metadata: {} }, '2026-12-01');
    assert.equal(d.answer, 'lapse'); assert.equal(d.served, true); assert.equal(d.servedOn, '2026-10-01');
    assert.equal(fn({ metadata: {} }, '2026-12-01'), null);
  });
});
