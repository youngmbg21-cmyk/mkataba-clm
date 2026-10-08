'use strict';
/* ═══════════════════════════════════════════════════════════════════════════
   f562 — A PASS IS A HAND-OFF, AND THE SERVER KEEPS ITS RECORD (Young, 8 Oct
   2026: "fix the two broken rules")

   The nine flow rules' rule 3 — every hand-off is tracked until answered; an
   email alone is never a hand-off — and rule 8 — every act leaves a record
   the server writes. Copilot's "Send #MK to @Jane" was an email and nothing
   more, and its History line was written by the browser after the send.

   (1) The pass route opens a `look` question on the one ask record, to the
       colleague, by the sender, carrying the note and whether it was asked as
       a review — and writes the History line ITSELF, also when there is no
       email to send.
   (2) Only the colleague marks it done; the sender cannot answer their own;
       nobody files a `look` through an ordinary save.
   (3) Done: the server writes "Looked at it" and mails whoever asked.
   (4) Still open after SA_REMIND_WORKDAYS working days: reminded once.
   (5) The browser: the card writes nothing to the trail; the checklist, the
       bell and the phone read the one list (asksLookFor); Done is the one
       writer's answer.
   AT THE PARENT (85c0ad0) (1)(2)(3)(4) fail: no `look` kind, the browser wrote
   the trail, and nothing reached the colleague's list.
   ═══════════════════════════════════════════════════════════════════════════ */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('./helpers');
const R = f => { try { return fs.readFileSync(path.join(__dirname, '..', f), 'utf8'); } catch (_) { return ''; } };
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.';
const code = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');

describe('f562 (1)–(4) — the look question, on the server', () => {
  let h, W, db, mate, me;
  const sql = (q, ...a) => { const d = db(); try { return d.prepare(q).run(...a); } finally { d.close(); } };
  const stored = id => { const d = db(); try { return JSON.parse(d.prepare('SELECT json FROM contracts WHERE id=?').get(id).json); } finally { d.close(); } };
  const ver = id => { const d = db(); try { return d.prepare('SELECT version FROM contracts WHERE id=?').get(id).version; } finally { d.close(); } };
  const outbox = async () => (await W.admin.json('/api/outbox')).items || [];
  before(async () => {
    h = await startHati();
    W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
    mate = W.users.unrestricted;
    const { DatabaseSync: DS } = require('node:sqlite');
    db = () => (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DS(path.join(h.dataDir, 'hati.db')));
    { const d = db(); try { me = d.prepare("SELECT id, name FROM users WHERE email='admin@example.co.ke'").get(); } finally { d.close(); } }
    const { DatabaseSync } = require('node:sqlite');
    db = () => (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    const c = fixtureContract('MK-LK-1', 'Supply Agreement', 'Nordkust Industri AB', FOLDER_A, 480000, 'Under Review', DOC);
    await W.admin.json('/api/contracts/MK-LK-1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  });
  after(async () => { await h.stop(); });

  test('1a the pass opens a look question for the colleague, with the note and the review flag', async () => {
    const r = await W.admin.json('/api/contracts/MK-LK-1/pass', { method: 'POST', body: { memberId: mate.id, note: 'Check clause 1', review: true } });
    assert.equal(r.asked, true); assert.ok(r.askId);
    const a = (stored('MK-LK-1').asks || []).find(x => x.id === r.askId);
    assert.ok(a, 'on the stored record');
    assert.equal(a.kind, 'look'); assert.equal(a.state, 'open');
    assert.equal(String(a.to.id), String(mate.id)); assert.equal(a.note, 'Check clause 1');
    assert.equal(a.stamp && a.stamp.review, true);
    assert.ok(Array.isArray(r.asks) && r.asks.some(x => x.id === r.askId), 'the list rides back to the browser');
  });
  test('1b the SERVER wrote the History line', async () => {
    const line = (stored('MK-LK-1').audit || []).filter(x => x.action === 'Sent to a colleague').pop();
    assert.ok(line, 'a trail line');
    assert.match(line.detail, /Unrestricted Legal/); assert.match(line.detail, /for review/); assert.match(line.detail, /asked Copilot/);
  });
  test('1c no email address: still a hand-off, still on the trail', async () => {
    sql("UPDATE users SET email='' WHERE id=?", String(mate.id));
    try {
      const r = await W.admin.json('/api/contracts/MK-LK-1/pass', { method: 'POST', body: { memberId: mate.id } });
      assert.equal(r.told, false); assert.equal(r.asked, true);
      assert.match((stored('MK-LK-1').audit || []).pop().detail, /no email address on file/);
    } finally { sql("UPDATE users SET email='everything@example.co.ke' WHERE id=?", String(mate.id)); }
  });
  test('2a nobody files a look through an ordinary save', async () => {
    const c = stored('MK-LK-1');
    c.asks = (c.asks || []).concat([{ id: 'look:forged', kind: 'look', of: ['MK-LK-1'], by: { id: String(me.id), name: me.name },
      to: { id: String(mate.id), name: mate.name }, state: 'open', at: new Date().toISOString() }]);
    const r = await W.admin.raw('/api/contracts/MK-LK-1', { method: 'PUT', body: { contract: c, baseVersion: ver('MK-LK-1') } });
    assert.equal(r.status, 400, r.text);
  });
  test('2b the sender cannot mark their own done', async () => {
    const c = stored('MK-LK-1');
    const a = c.asks.find(x => x.kind === 'look' && x.state === 'open');
    Object.assign(a, { state: 'yes', answeredBy: { id: String(me.id), name: me.name }, answeredAt: new Date().toISOString() });
    const r = await W.admin.raw('/api/contracts/MK-LK-1', { method: 'PUT', body: { contract: c, baseVersion: ver('MK-LK-1') } });
    assert.equal(r.status, 403, r.text);
  });
  test('3 the colleague marks it done: the server writes the line and mails whoever asked', async () => {
    const c = stored('MK-LK-1');
    const open = c.asks.filter(x => x.kind === 'look' && x.state === 'open');
    assert.ok(open.length >= 1);
    for (const a of open) Object.assign(a, { state: 'yes', answeredBy: { id: String(mate.id), name: mate.name }, answeredAt: new Date().toISOString() });
    const r = await W.unrestricted.raw('/api/contracts/MK-LK-1', { method: 'PUT', body: { contract: c, baseVersion: ver('MK-LK-1') } });
    assert.equal(r.status, 200, r.text);
    const s = stored('MK-LK-1');
    assert.ok(s.asks.filter(x => x.kind === 'look').every(x => x.state === 'yes'));
    assert.ok((s.audit || []).some(x => x.action === 'Looked at it' && /Unrestricted Legal/.test(x.detail)));
    let m = null;
    for (let k = 0; k < 40 && !m; k++) {
      m = (await outbox()).find(x => (x.to_addr || x.to) === 'admin@example.co.ke' && /looked at/i.test(x.subject || ''));
      if (!m) await new Promise(r => setTimeout(r, 100));
    }
    assert.ok(m, 'the sender is told');
  });
  test('4 an open look is reminded once after the working days a named yes waits', async () => {
    const r = await W.admin.json('/api/contracts/MK-LK-1/pass', { method: 'POST', body: { memberId: mate.id, note: 'Old one' } });
    const c = stored('MK-LK-1');
    const a = c.asks.find(x => x.id === r.askId);
    a.at = new Date(Date.now() - 9 * 864e5).toISOString();
    sql('UPDATE contracts SET json=? WHERE id=?', JSON.stringify(c), 'MK-LK-1');
    const before = (await outbox()).filter(x => /Reminder:/.test(x.subject || '')).length;
    const run1 = await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    assert.ok(run1.signApproval && run1.signApproval.looks && run1.signApproval.looks.checked >= 1, JSON.stringify(run1.signApproval));
    await W.admin.json('/api/reminders/run', { method: 'POST', body: {} });
    const after = (await outbox()).filter(x => /Reminder:/.test(x.subject || '') && (x.to_addr || x.to) === 'everything@example.co.ke').length;
    assert.equal(after - before, 1, 'once, not on every sweep');
  });
});

describe('f562 (5) — the browser reads the one list and writes no trail', () => {
  const CA = code(R('js/copilotacts.js'));
  const HOME = code(R('js/views/home.js'));
  const APP = code(R('js/app.js'));
  const MOB = code(R('js/mobile-screens.js'));
  const ASKS = require('../js/asks.js');
  test('5a the card writes nothing to the trail; it sends the review flag and takes the server\'s list', () => {
    const press = CA.slice(CA.indexOf('async function caCardPress'), CA.indexOf('function caReadDraft'));
    assert.ok(!/logAudit\(/.test(press), 'the trail line is the server\'s');
    assert.match(press, /review:\s*!!a\.review/);
    assert.match(press, /asksTakeServer/);
  });
  test('5b the checklist, the bell and the phone read asksLookFor; Done answers through askAnswer', () => {
    assert.match(HOME, /kind:'look'/); assert.match(HOME, /asksLookFor\(c, me\)/);
    assert.match(HOME, /function lookDone[\s\S]*askAnswer\(c, a\.id, \{ state:'yes'/);
    /* RE-POINTED 9 Oct 2026: the phone's list is built from needsYouOf (the
       checklist's reading, kind look among them) and Done is on its sheet. */
    assert.match(APP, /push\('look'/); assert.match(MOB, /needsYouOf\(c\)/);
    assert.match(code(R('js/mobile-contract.js')), /asksLookFor\(c, me\)/);
  });
  test('5c the reading: a look waits on the person it names, and on nobody else', () => {
    const c = { id: 'X', asks: [] };
    const a = ASKS.askOpen(c, { kind: 'look', of: ['X'], by: { id: '1', name: 'A' }, to: { id: '2', name: 'B' } });
    assert.ok(a && a.kind === 'look');
    assert.equal(ASKS.asksLookFor(c, { id: '2', name: 'B' }).length, 1);
    assert.equal(ASKS.asksLookFor(c, { id: '1', name: 'A' }).length, 0);
    ASKS.askAnswer(c, a.id, { state: 'yes', by: { id: '2', name: 'B' } });
    assert.equal(ASKS.asksLookFor(c, { id: '2', name: 'B' }).length, 0, 'done is done');
  });
});
