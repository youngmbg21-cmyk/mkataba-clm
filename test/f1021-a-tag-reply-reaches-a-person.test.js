'use strict';
/* f1021 — A TAG'S REPLY REACHES A PERSON (owner, 12 Nov 2026: "Fix 1"). A colleague who tags somebody on the other
   side in a note emails them (POST /api/contracts/:id/mention). That email set no reply address, so their Reply
   reached nobody — the one email to the other side f1020 left out. It now carries the colleague who tagged them;
   a colleague tagged inside gets no reply address (they answer in HaTi), and none is ever read off the body.
   At the parent the outside email carried no reply_to. */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHatiWithMail, seedWorkspace } = require('./helpers');

const contract = () => ({ id: 'MK-TG1', name: 'Warehousing Services Agreement', counterparty: 'Brut Africa Ltd',
  counterpartyName: 'Guliz Cetin', counterpartyEmail: 'guliz@brutafrica.example',
  folder: 'proc', template: 'WH', status: 'Under Review', format: 'text',
  redlineText: 'Article 1 Payment\n\nPayable within thirty (30) days.',
  fields: {}, metadata: {}, signatures: [], obligations: [], rounds: [], versions: [], comments: [], audit: [], changes: [] });

describe('f1021 — a reply to a tag reaches the colleague who tagged them', () => {
  let h, W;
  before(async () => {
    h = await startHatiWithMail();
    W = await seedWorkspace(h);
    await W.admin.json('/api/contracts/MK-TG1', { method: 'PUT', body: { contract: contract(), baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  test('1 the tag email to the other side carries the tagger as its reply address', async () => {
    h.mail.sent.length = 0;
    const r = await W.admin.json('/api/contracts/MK-TG1/mention', { method: 'POST', body: {
      people: [{ name: 'Guliz Cetin' }], note: 'Could you look at Article 1?', replyTo: 'someone@elsewhere.example' } });
    assert.equal((r.told || []).length, 1, JSON.stringify(r).slice(0, 300));
    const m = h.mail.sent.find(x => /guliz@brutafrica/.test(String(x.to)));
    assert.ok(m, 'the email went');
    assert.deepEqual(m.body.reply_to, ['admin@example.co.ke'], 'the tagger, never an address from the body');
  });
});
