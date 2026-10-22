/* ============================================================
   f859 — EVERY DOCUMENT THAT ARRIVES BY EMAIL HAS A PERSON
   (owner, 22 Oct 2026: "Documents email should always have a person assigned
   to them directly"; picked "A": the person who sent it, else a backup chosen
   in Settings)
   ============================================================
   Before: a mailroom draft had no owner at all (the bug log: "mailroom drafts
   (POST /api/mailroom) have no owner"), so it sat on nobody's list.
     1  sent by a member who can open its stream → theirs
     2  sent by a stranger → the backup named in Settings
     3  sent by a member who cannot open its stream → the backup, never them
     4  no backup named → the admin who set the Mailroom up (never nobody)
     5  a Viewer cannot be named as the backup (dropped, the default answers)
     6  the trail says who it went to and why
   Red at the parent: 1–6.
   ============================================================ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startHati, seedWorkspace } = require('./helpers');

const KEY = 'k'.repeat(32);
let h, W, viewer;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { approvalRules: [] });
  const v = await W.admin.json('/api/users', { method: 'POST', body: {
    name: 'Victor Viewer', email: 'viewer@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  viewer = v.user;
});
after(async () => { if (h) await h.stop(); });

const mailroom = async (body) => W.admin.json('/api/settings', { method: 'PUT', body: { mailroom: { key: KEY, ...body } } });
const arrive = async from => {
  const r = await h.client('mail').raw('/api/mailroom', { method: 'POST', headers: { 'x-hati-mailroom-key': KEY },
    body: { from, subject: 'Contract', attachments: [{ filename: 'nda.pdf', contentType: 'application/pdf',
      content: Buffer.from('%PDF-1.4 test').toString('base64') }] } });
  assert.equal(r.status, 200, r.text.slice(0, 160));
  const got = await W.admin.json('/api/contracts/' + r.json.ids[0]);
  return got.contract || got;
};
const settings = async () => { const b = await W.admin.json('/api/bootstrap'); return (b.settings || {}).mailroom || {}; };

describe('f859 — the Mailroom gives every document a person', () => {
  test('1 sent by a member who can open its stream: theirs', async () => {
    await mailroom({ folder: '', ownerId: W.users.unrestricted.id });
    const c = await arrive('Novalues Legal <NOVALUES@example.co.ke>');
    assert.deepEqual(c.owner, { id: W.users.novalues.id, name: 'No Values Legal' });
  });

  test('2 sent by a stranger: the backup named in Settings', async () => {
    const c = await arrive('someone@supplier.example');
    assert.deepEqual(c.owner, { id: W.users.unrestricted.id, name: 'Unrestricted Legal' });
  });

  test('3 sent by a member who cannot open its stream: the backup, never them', async () => {
    const c = await arrive('restricted@example.co.ke');
    assert.equal(c.owner && c.owner.id, W.users.unrestricted.id, JSON.stringify(c.owner));
  });

  test('4 no backup named: the admin who set the Mailroom up', async () => {
    await mailroom({ folder: '' });
    const c = await arrive('someone@supplier.example');
    assert.ok(c.owner && c.owner.id && c.owner.name === 'Amina Otieno', JSON.stringify(c.owner));
  });

  test('5 a Viewer cannot be the backup: dropped, and the default answers', async () => {
    await mailroom({ folder: '', ownerId: viewer.id });
    assert.equal((await settings()).ownerId, undefined, 'the stored setting names no Viewer');
    const c = await arrive('someone@supplier.example');
    assert.equal(c.owner && c.owner.name, 'Amina Otieno');
  });

  test('6 the trail says who it went to and why', async () => {
    await mailroom({ folder: '', ownerId: W.users.unrestricted.id });
    const c = await arrive('stranger@supplier.example');
    const line = (c.audit || []).find(a => a && a.action === 'Received');
    assert.match(String(line && line.detail), /Given to Unrestricted Legal — the Mailroom's named person\./);
    const c2 = await arrive('everything@example.co.ke');
    assert.match(String(((c2.audit || []).find(a => a && a.action === 'Received') || {}).detail), /Given to Unrestricted Legal — they sent it\./);
  });
});
