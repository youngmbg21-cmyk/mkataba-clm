/* ============================================================
   f460 — A REQUEST REACHES THE PEOPLE WHO DRAFT, THE LANES RUN ON THE
   SERVER, AND "DONE" MEANS SENT (4 Oct 2026, the process review's Requests
   stream)
   ============================================================
   Four faults, each driven against a real server:
   1 · raising a request told nobody who could draft it (a webhook only);
   2 · the lanes ran only in an editor's OPEN browser;
   3 · a request read "done" the moment a draft was MINTED, and the person who
       asked was mailed while the paper sat unsent in Drafting;
   4 · the request form asked two things, and the editor asked the rest by
       email — the answers ride the request now, cleaned on the way in. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace, FOLDER_A, FOLDER_B } = require('./helpers');

let h, W, mail;
const pause = ms => new Promise(r => setTimeout(r, ms));
const settle = async (pred, ms = 3000) => {
  const end = Date.now() + ms;
  while (Date.now() < end && !pred()) await pause(25);
  await pause(150);
};
const ASKER = 'everything@example.co.ke';
const newMails = () => mail.sent.filter(m => /^(New request|Ny förfrågan):/.test(String(m.subject)));

before(async () => {
  h = await startHatiWithMail();
  W = await seedWorkspace(h, { approvalRules: [] });
  mail = h.mail;
});
after(async () => { await h.stop(); });

describe('f460 (1) the people who draft are told a request was raised', () => {
  test('1a one mail to each colleague who could act on it — never to the person who asked', async () => {
    mail.reset();
    await W.unrestricted.json('/api/intake', { method: 'POST', body: {
      title: 'Cold store agreement', need: 'We need space for the new line.', folder: FOLDER_B } });
    await settle(() => newMails().length >= 2);
    const to = newMails().map(m => m.to).sort();
    assert.ok(to.includes('admin@example.co.ke'), 'the admin is told');
    assert.ok(to.includes('novalues@example.co.ke'), 'an editor whose streams include it is told');
    assert.ok(!to.includes(ASKER), 'nobody is told about their own act');
    assert.ok(!to.includes('restricted@example.co.ke'), 'a colleague who cannot see that stream is not told');
    assert.equal(to.length, new Set(to).size, 'one mail each');
    const m = newMails().find(x => x.to === 'admin@example.co.ke');
    assert.match(m.subject, /Cold store agreement/);
    assert.match(m.text, /space for the new line/, 'it carries what they need');
  });
  test('1b a colleague who switched these mails off is not written to', async () => {
    await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { notifyIntake: false } });
    mail.reset();
    await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'Haulage', need: 'Trucks.' } });
    await settle(() => newMails().length >= 1);
    assert.ok(!newMails().some(m => m.to === 'novalues@example.co.ke'));
    await W.novalues.json('/api/me/prefs', { method: 'PUT', body: { notifyIntake: true } });
  });
});

describe('f460 (4) the answers ride the request, cleaned', () => {
  test('4a what the form asks is kept, and nothing outside the list', async () => {
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: {
      title: 'Packaging supply', need: 'Bottles for Q1.', counterparty: 'Tetra Ltd', folder: FOLDER_A,
      answers: { party: 'Highland Foods Ltd', cpemail: 'legal@tetra.example', value: '2,500,000', side: 'customer',
        effDate: '2026-11-01', expiry: '2027-10-31', evil: '<script>', role: 'admin' } } });
    assert.deepEqual(r.request.answers, { party: 'Highland Foods Ltd', cpemail: 'legal@tetra.example',
      value: '2500000', side: 'customer', effDate: '2026-11-01', expiry: '2027-10-31' });
  });
  test('4b a bad email, an unknown side and a term that runs backwards are dropped, never guessed', async () => {
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: {
      title: 'Odd one', need: 'x', answers: { cpemail: 'not-an-address', side: 'both', value: '-4',
        effDate: '2027-01-01', expiry: '2026-01-01' } } });
    assert.deepEqual(r.request.answers, { effDate: '2027-01-01' });
  });
});

describe('f460 (2)(3) a lane drafts on the server, and the request closes when the draft is sent', () => {
  let req, cid;
  before(async () => {
    await W.admin.json('/api/settings', { method: 'PUT', body: {
      approvalRules: [],
      intakeLanes: [{ id: 'l1', on: true, name: 'Routine NDA', template: 'ND', words: 'nda', knownOnly: false }] } });
  });
  test('2a the request\'s own POST clears it — drafted, not done — and tells nobody it is waiting', async () => {
    mail.reset();
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: {
      title: 'An NDA for the depot visit', need: 'Standard NDA, nothing unusual.', counterparty: 'Juno Haulage',
      folder: FOLDER_B, answers: { cpemail: 'ops@juno.example', effDate: '2026-11-01' } } });
    req = r.request;
    assert.equal(req.status, 'drafted', 'a minted draft is not a finished request');
    assert.equal(req.lane, 'Routine NDA', 'the lane names itself on the record');
    assert.ok(req.contractId, 'and the request points at its contract');
    cid = req.contractId;
    await pause(400);
    assert.equal(newMails().length, 0, 'a request a rule drafted in the same breath is not waiting on anybody');
  });
  test('2b the draft is an ordinary Draft, from the lane\'s template, with the request\'s answers on it', async () => {
    const c = await W.admin.json('/api/contracts/' + cid);
    assert.equal(c.status, 'Draft');
    assert.equal(c.template, 'ND');
    assert.equal(c.counterparty, 'Juno Haulage');
    assert.equal(c.counterpartyEmail, 'ops@juno.example');
    assert.equal(c.fields.effDate, '2026-11-01');
    assert.equal(c.folder, FOLDER_B);
    assert.equal(c.valueType, 'none', 'an NDA carries no money');
    assert.equal(c.intakeRequestId, req.id);
    assert.ok((c.audit || []).some(a => a.action === 'Requested' && /Routine NDA/.test(a.detail)), 'the trail says which rule');
    assert.ok(!(c.signatures || []).length, 'a lane signs nothing');
  });
  test('2c once per request: nothing mints a second contract for it', async () => {
    await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'Another NDA', need: 'nda please' } });
    const list = await W.admin.json('/api/contracts?q=juno%20haulage&limit=200');
    assert.equal(list.total, 1, 'one contract for the request, however many sweeps ran');
    const again = await W.admin.json('/api/intake');
    assert.equal(again.requests.find(r => r.id === req.id).contractId, cid, 'and the request still points at the one it has');
  });
  test('2d their paper is never routine, on the server too', async () => {
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: {
      title: 'Their NDA', need: 'Their own NDA template arrived for review.' } });
    assert.equal(r.request.status, 'open');
    assert.equal(r.request.lane, null);
  });
  test('3a the tracker says "drafted, not yet sent"', async () => {
    const tok = req.trackToken;
    const res = await h.client('anon').raw('/track/' + tok);
    assert.match(res.text, /Drafted, not yet sent/);
  });
  test('3b the save that takes the contract out of Draft closes the request, and the person who asked is told then', async () => {
    mail.reset();
    const full = await W.admin.json('/api/contracts/' + cid);
    const v = full._v; delete full._v;
    full.status = 'Under Review';
    await W.admin.json('/api/contracts/' + cid, { method: 'PUT', body: { contract: full, baseVersion: v } });
    const list = await W.unrestricted.json('/api/intake?mine=1');
    const after = list.requests.find(r => r.id === req.id);
    assert.equal(after.status, 'done');
    await settle(() => mail.sent.some(m => m.to === ASKER));
    const got = mail.sent.filter(m => m.to === ASKER);
    assert.equal(got.length, 1, 'one notice, on the real close');
    assert.match(got[0].subject, /drafted and sent/);
  });
  test('3c a save that leaves it where it was closes nothing twice', async () => {
    mail.reset();
    const full = await W.admin.json('/api/contracts/' + cid);
    const v = full._v; delete full._v;
    await W.admin.json('/api/contracts/' + cid, { method: 'PUT', body: { contract: full, baseVersion: v } });
    await pause(500);
    assert.equal(mail.sent.filter(m => m.to === ASKER).length, 0);
  });
  test('3d marking a request drafted against a contract already sent makes it done', async () => {
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'Late link', need: 'x' } });
    const out = await W.admin.json('/api/intake/' + r.request.id, { method: 'PATCH', body: { status: 'drafted', contractId: cid } });
    assert.equal(out.request.status, 'done', 'drafted means not yet sent, and that would be false');
  });
  test('3e drafted names its contract', async () => {
    const r = await W.unrestricted.json('/api/intake', { method: 'POST', body: { title: 'No link', need: 'x' } });
    const res = await W.admin.raw('/api/intake/' + r.request.id, { method: 'PATCH', body: { status: 'drafted' } });
    assert.equal(res.status, 400);
  });
});
