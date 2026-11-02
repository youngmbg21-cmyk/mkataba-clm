'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f974 — ASK FOR A NEW LINK (round 8 of the new look; the owner's yes, 1 Nov 2026)
   The expired page's one press: the holder of a link that has run out asks its sender for a new one.
   (1) An expired link asks: the ask is kept on the contract with a line in its history, the sender is emailed (the
       app's address, never a token), and the answer carries nothing from the agreement. One ask per link.
   (2) A live link, a withdrawn one and an unknown token cannot ask (404); nothing is written.
   (3) An ordinary save cannot write or drop the asks (the stored list wins).
   (4) A new link to the same address answers the ask: it leaves the record.
   (5) Every answer of the share route says whether the company shows people outside the new look; so does /api/status.
   AT THE PARENT every test here FAILS: the route does not exist.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

let h, w;
const share = (email, name) => w.admin.json('/api/shares', { method: 'POST', body: {
  payload: { v: 1, kind: 'hati-share', org: 'Highland Corporate Ltd', sharedBy: 'Amina Otieno', at: new Date().toISOString(), docHash: 'x', purpose: 'negotiate',
    contract: { id: 'MK-A1', name: 'Supply Agreement', counterparty: 'Kabras Sugar', value: 1, valueType: 'standard' } },
  channel: 'email', recipient: { name, email }, expiryDays: 30 } });
const expire = token => { const db = new DatabaseSync(path.join(h.dataDir, 'hati.db')); db.exec('PRAGMA busy_timeout = 5000');
  db.prepare('UPDATE shares SET expires_at=? WHERE token=?').run(new Date(Date.now() - 864e5).toISOString(), token); db.close(); };
const stored = async () => w.admin.json('/api/contracts/MK-A1');
const save = async c => { const v = c._v; const x = { ...c }; delete x._v; return w.admin.raw('/api/contracts/MK-A1', { method: 'PUT', body: { contract: x, baseVersion: v } }); };
const ask = token => fetch(h.base + '/api/shares/' + encodeURIComponent(token) + '/ask-new', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
  .then(async r => ({ status: r.status, json: await r.json().catch(() => ({})) }));

before(async () => { h = await startHatiWithMail(); w = await seedWorkspace(h, { approvalRules: [] }); });
after(async () => { if (h) await h.stop(); });

describe('f974 ask for a new link', () => {
  let tok;
  test('1 an expired link asks: kept on the contract with a line in its history; the sender is emailed; one ask per link', async () => {
    const s = await share('erik@parcelway.example', 'Erik Lindqvist'); tok = s.token; expire(tok);
    h.mail.reset();
    const r = await ask(tok);
    assert.equal(r.status, 200); assert.equal(r.json.ok, true); assert.equal(r.json.emailSent, true);
    assert.ok(!JSON.stringify(r.json).includes('Supply Agreement'), 'nothing from the agreement goes back');
    const c = await stored();
    assert.equal((c.linkAsks || []).length, 1); assert.equal(c.linkAsks[0].who, 'Erik Lindqvist');
    assert.ok((c.audit || []).some(a => a.action === 'Link asked' && /Erik Lindqvist asked for a new link/.test(a.detail)));
    assert.equal(h.mail.sent.length, 1); assert.equal(h.mail.lastTo(), 'admin@example.co.ke');
    const body = JSON.stringify(h.mail.sent[0]);
    assert.ok(/asked for a new link/i.test(body)); assert.ok(!body.includes(tok), 'the email carries the app\'s address, never the token');
    const again = await ask(tok);
    assert.equal(again.json.already, true); assert.equal(((await stored()).linkAsks || []).length, 1);
    const gone = await fetch(h.base + '/api/shares/' + tok).then(x => x.json());
    assert.equal(gone.gone, 'expired'); assert.equal(gone.linkAsked, true); assert.ok(gone.expiredAt);
  });
  test('2 a live link, a withdrawn one and an unknown token cannot ask; nothing is written', async () => {
    const live = await share('live@parcelway.example', 'Live One');
    assert.equal((await ask(live.token)).status, 404);
    const gone = await share('gone@parcelway.example', 'Gone One');
    await w.admin.raw('/api/shares/' + gone.token + '/revoke', { method: 'POST', body: {} });
    expire(gone.token);
    assert.equal((await ask(gone.token)).status, 404);
    assert.equal((await ask('no-such-token')).status, 404);
    assert.equal(((await stored()).linkAsks || []).length, 1);
  });
  test('3 an ordinary save neither writes nor drops the asks', async () => {
    const c = await stored();
    assert.equal((await save({ ...c, linkAsks: [] })).status, 200);
    assert.equal(((await stored()).linkAsks || []).length, 1, 'dropping them is refused');
    const c2 = await stored();
    assert.equal((await save({ ...c2, linkAsks: c2.linkAsks.concat([{ token: 'x', who: 'Mallory', by: 'u' }]) })).status, 200);
    assert.equal(((await stored()).linkAsks || []).length, 1, 'adding one is refused');
  });
  test('4 a new link to the same address answers the ask', async () => {
    await share('erik@parcelway.example', 'Erik Lindqvist');
    assert.equal(((await stored()).linkAsks || []).length, 0);
  });
  test('5 the share route and /api/status say whether outsiders see the new look', async () => {
    const st = await fetch(h.base + '/api/status').then(x => x.json());
    assert.equal(st.outsideLook, false);
    const live = await share('look@parcelway.example', 'Look One');
    const got = await fetch(h.base + '/api/shares/' + live.token).then(x => x.json());
    assert.equal(got.outsideLook, false);
  });
});
