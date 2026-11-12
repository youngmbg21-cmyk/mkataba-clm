'use strict';
/* f1018 — A REPLY REACHES A PERSON (owner, 12 Nov 2026: "Fix both")
   Every email to the other side goes out from HaTi's own address. It set no reply address, so pressing Reply in
   their mail app reached neither the sender nor HaTi — while the Word-file letter and the handover mails promised
   "Replies to this email reach {sender} directly". Each email to the other side now carries the person behind it
   as its reply address (`mailReplyFor`): the one who pressed, else the member who made the link, else the
   contract's owner — read from our own records, never from the request body.
   At the parent every claim here fails: no email carried a reply address. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const SRV = fs.readFileSync(path.join(__dirname, '..', 'server', 'server.js'), 'utf8');
const contract = () => ({ id: 'MK-RT1', name: 'Warehousing Services Agreement', counterparty: 'Brut Africa Ltd',
  folder: 'proc', template: 'WH', status: 'Under Review', format: 'text',
  redlineText: 'Article 1 Payment\n\nPayable within thirty (30) days.',
  fields: {}, metadata: {}, signatures: [], obligations: [], rounds: [], versions: [], comments: [], audit: [], changes: [] });

describe('f1018 — a reply to HaTi\'s email reaches the person who sent it', () => {
  let h, W;
  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-RT1', { method: 'PUT', body: { contract: contract(), baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  test('1 the email to the other side carries the sender as its reply address', async () => {
    h.mail.sent.length = 0;
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', contract: contract() }, channel: 'email', purpose: 'negotiate',
      recipient: { name: 'Guliz Cetin', email: 'guliz@brutafrica.example' } } });
    const m = h.mail.sent.find(x => /guliz@brutafrica/.test(String(x.to)));
    assert.ok(m, 'the email went');
    assert.deepEqual(m.body.reply_to, ['admin@example.co.ke']);
  });

  test('2 an address in the request body is never the reply address (the server is the wall)', async () => {
    h.mail.sent.length = 0;
    await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', contract: contract() }, channel: 'email', purpose: 'negotiate',
      replyTo: 'someone@elsewhere.example', reply_to: ['someone@elsewhere.example'],
      recipient: { name: 'Guliz Cetin', email: 'guliz2@brutafrica.example' } } });
    const m = h.mail.sent.find(x => /guliz2@brutafrica/.test(String(x.to)));
    assert.ok(m, 'the email went');
    assert.deepEqual(m.body.reply_to, ['admin@example.co.ke']);
  });

  test('3 every email to the other side asks for a reply address, the ones that promise it above all', () => {
    const calls = [];
    const re = /sendEmail\(/g; let mm;
    while ((mm = re.exec(SRV))) {
      if (/function sendEmail\($/.test(SRV.slice(Math.max(0, mm.index - 15), mm.index + 10))) continue;
      calls.push(SRV.slice(mm.index, mm.index + 520));
    }
    const outside = /`share letter:|`share link:|`share as word:|`share resend:|'share nudge'|`sign turn \(external\)|`handover: |`handover chase:|`handover \$\{both|`chase: \$\{c\.name|`OTP for signing|`executed copy:|'your turn' : 'share refresh'/;
    const hits = calls.filter(t => outside.test(t.slice(0, 420)));
    assert.ok(hits.length >= 14, `found ${hits.length} emails to the other side`);
    for (const t of hits) assert.match(t.slice(0, 520), /replyTo: /, t.slice(0, 160));
    assert.match(SRV, /\.\.\.\(mailReplyAddr\(opts\.replyTo\) \? \{ reply_to: \[mailReplyAddr\(opts\.replyTo\)\] \} : \{\}\)/, 'the provider is handed it');
    const fn = SRV.slice(SRV.indexOf('function mailReplyFor('), SRV.indexOf('function mailReplyFor(') + 400);
    assert.match(fn, /req && req\.user && req\.user\.email/);
    assert.doesNotMatch(fn, /req\.body/, 'never read off the request body');
  });
});

/* f1018 (2) — A PARKED ASK DOES NOT TELL OF A HELD COUNTER (owner, 12 Nov 2026: "Fix both"). An ask of theirs we
   answered with a counter is parked ("countered", counteredBy the counter). While the counter is held back for our
   own review it is not on their copy, and the ask must travel as it stood before: its status from the counter's
   bundle (else pending) and no counteredBy — or the copy's data tells them a counter exists they cannot see, a review
   they must never learn of. Both hosts: the server's wall (srvLinkStrip) and the browser's copy (buildSharePayload).
   At the parent the ask travelled "countered" with the held counter's id. */
describe('f1018 (2) — a held counter leaves no trace on their copy', () => {
  let h, W;
  const ASK = { id: 'CHG-001', clauseId: 'c11', clauseLabel: 'Clause 11 · Payment terms', type: 'edit', authorSide: 'counterparty',
    author: 'Guliz Cetin', status: 'countered', counteredBy: 'CHG-002', oldText: 'thirty (30) days', newText: 'sixty (60) days', createdAt: '2026-11-10T08:00:00.000Z' };
  const OURS = { id: 'CHG-002', clauseId: 'c11', clauseLabel: 'Clause 11 · Payment terms', type: 'edit', authorSide: 'owner',
    author: 'Amina Otieno', status: 'pending', counterOf: 'CHG-001', bundle: [{ id: 'CHG-001', was: 'pending', counteredBy: null }],
    review: { verdict: 'held', by: 'Achieng', at: '2026-11-11T08:00:00.000Z' },
    oldText: 'thirty (30) days', newText: 'forty-five (45) days', createdAt: '2026-11-11T07:00:00.000Z' };
  const withChanges = () => Object.assign(contract(), { id: 'MK-RT2', changes: [ASK, OURS].map(x => JSON.parse(JSON.stringify(x))) });
  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-RT2', { method: 'PUT', body: { contract: withChanges(), baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  test('the server: the held counter stays behind, and the ask it parked travels as it stood before', async () => {
    const r = await W.admin.json('/api/shares', { method: 'POST', body: {
      payload: { kind: 'hati-share', org: 'Highland Corporate Ltd', contract: withChanges() }, channel: 'link', purpose: 'negotiate',
      recipient: { name: 'Guliz Cetin', email: 'guliz3@brutafrica.example' } } });
    const token = r.token || String(r.link || '').split('t:')[1];
    assert.ok(token, JSON.stringify(r).slice(0, 200));
    const t = await h.client('them').json('/api/shares/' + token);
    const chs = ((t.payload || t).contract || {}).changes || [];
    assert.ok(!chs.some(x => x.id === 'CHG-002'), 'the held counter never travels');
    const ask = chs.find(x => x.id === 'CHG-001');
    assert.ok(ask, 'their ask travels'); assert.equal(ask.status, 'pending'); assert.equal(ask.counteredBy || null, null);
  });

  test('the browser builds its copy the same way (the twin in buildSharePayload)', () => {
    const CORE = fs.readFileSync(path.join(__dirname, '..', 'js', 'core.js'), 'utf8');
    const fn = CORE.slice(CORE.indexOf('function buildSharePayload('), CORE.indexOf('function buildSharePayload(') + 40000);
    assert.match(fn, /if\(x\.status!=='countered' \|\| !x\.counteredBy \|\| onCopy\.has\(String\(x\.counteredBy\)\)\) continue;/);
    assert.match(fn, /x\.status=\(b && b\.was && b\.was!=='countered'\) \? b\.was : 'pending'; x\.counteredBy=null;/);
    const strip = SRV.slice(SRV.indexOf('function srvLinkStrip('), SRV.indexOf('function srvLinkStrip(') + 4000);
    assert.match(strip, /x\.status = \(b && b\.was && b\.was !== 'countered'\) \? b\.was : 'pending'; x\.counteredBy = null;/);
  });
});
