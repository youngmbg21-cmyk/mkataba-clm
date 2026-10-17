/* f699 — THE TRAIL, AS A FILE (owner picked "Export drawer — the SAP way",
   17 Oct 2026; piece 5 of the sensitive contracts and governance plan)

   The drawer's half (the tab, the count, the press, the downloads so far) is
   asked in a real browser by trail-export-verify. This file asks the server:
     1 · only an admin asks; a bad period is refused, never guessed
     2 · the count is the acts in the period: every contract's audit lines
         inside the days asked, narrowed to a stream when one is asked
     3 · the spreadsheet: one line per act, oldest first, the stream named,
         a cell that would run as a formula is defused
     4 · the PDF: a real PDF carrying the spreadsheet's SHA-256 as its seal
     5 · each download is recorded before the file leaves, listed, and is
         itself an act in the next trail that covers its day
     6 · the wall stands: a private stream that does not name this admin is
         neither exported nor counted, only said as a number left out; one
         that names them brings its opens into the trail

   Run: node --test test/f699-trail-export.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A, FOLDER_B } = require('./helpers');

const act = (at, user, action, detail) => ({ at, user, action, detail });
const C1 = { ...fixtureContract('TR-1', 'Refined Sugar Supply', 'Kabras Sugar', FOLDER_A, 48e6, 'Signed'),
  audit: [act('2026-06-30T23:59:00.000Z', 'Amina Otieno', 'Created', 'before the period'),
    act('2026-07-02T09:15:00.000Z', 'Amina Otieno', 'Sent', 'to Kabras Sugar'),
    act('2026-08-11T14:00:00.000Z', 'Grace Wanjiru', 'Signed', '=HYPERLINK("http://x")'),
    act('2026-10-01T00:00:01.000Z', 'Amina Otieno', 'Renewal noted', 'after the period')] };
const C2 = { ...fixtureContract('TR-2', 'Route-to-market distribution', 'Naivas Supermarkets', FOLDER_B, 12e6, 'Signed'),
  audit: [act('2026-09-30T23:00:00.000Z', 'Peter Kariuki', 'Approved', 'Sales lead')] };
const Q3 = 'from=2026-07-01&to=2026-09-30';
const NAMES = encodeURIComponent(JSON.stringify({ [FOLDER_A]: 'Procurement & Raw Materials', [FOLDER_B]: 'Sales & Route-to-Market' }));
const today = () => new Date().toISOString().slice(0, 10);

let h, W;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h, { contracts: [C1, C2], approvalRules: [] });
});
after(async () => { if (h) await h.stop(); });

describe('f699 (1) who may ask, and what is asked', () => {
  test('a member is refused every route', async () => {
    for (const p of ['/api/trail/summary?' + Q3, '/api/trail/exports', '/api/trail/export?' + Q3])
      assert.equal((await W.unrestricted.raw(p)).status, 403, p);
  });
  test('a period that is not two real days in order is refused', async () => {
    assert.equal((await W.admin.raw('/api/trail/summary?from=2026-07-01')).status, 400);
    assert.equal((await W.admin.raw('/api/trail/summary?from=2026-02-30&to=2026-03-01')).status, 400, 'not a day');
    assert.equal((await W.admin.raw('/api/trail/summary?from=2026-09-30&to=2026-07-01')).status, 400, 'the end before the start');
  });
});

describe('f699 (2) the count', () => {
  test('the third quarter holds three acts, by three people, in two streams', async () => {
    const s = await W.admin.json('/api/trail/summary?' + Q3);
    assert.equal(s.acts, 3, 'the act a minute before and the act a second after the period are out');
    assert.equal(s.people, 3);
    assert.equal(s.streams, 2);
    assert.equal(s.contracts, 2);
    assert.equal(s.leftOut, 0);
  });
  test('one stream asked: only its acts', async () => {
    const s = await W.admin.json(`/api/trail/summary?${Q3}&streams=${FOLDER_B}`);
    assert.equal(s.acts, 1);
    assert.equal(s.streams, 1);
  });
});

let csvText = '';
describe('f699 (3) the spreadsheet', () => {
  test('one line per act, oldest first, the stream named, a formula defused', async () => {
    const r = await W.admin.raw(`/api/trail/export?${Q3}&as=csv&names=${NAMES}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /text\/csv/);
    assert.match(r.headers.get('content-disposition') || '', /hati-trail-2026-07-01-to-2026-09-30\.csv/);
    csvText = r.text.replace(/^﻿/, '');
    const lines = csvText.trim().split('\r\n');
    assert.equal(lines[0], '"When (UTC)","Who","What","Detail","Contract","Name","Counterparty","Stream"');
    assert.equal(lines.length, 4, 'a head and three acts');
    assert.match(lines[1], /^"2026-07-02T09:15:00\.000Z","Amina Otieno","Sent","to Kabras Sugar","TR-1","Refined Sugar Supply","Kabras Sugar","Procurement & Raw Materials"$/);
    assert.match(lines[2], /"'=HYPERLINK\(""http:\/\/x""\)"/, 'a cell starting with = is not a formula');
    assert.match(lines[3], /"Sales & Route-to-Market"$/);
  });
});

describe('f699 (4) the PDF', () => {
  test('a real PDF, sealed with the spreadsheet\'s SHA-256', async () => {
    const r = await W.admin.raw(`/api/trail/export?${Q3}&as=pdf&names=${NAMES}`);
    assert.equal(r.status, 200);
    assert.match(r.headers.get('content-type') || '', /application\/pdf/);
    assert.match(r.text.slice(0, 8), /^%PDF-1\./);
    const seal = crypto.createHash('sha256').update(csvText, 'utf8').digest('hex');
    assert.ok(r.text.includes(seal), 'the seal printed is the fingerprint of the same rows');
    assert.ok(r.text.includes('Grace Wanjiru'), 'the acts are in it');
  });
});

describe('f699 (5) each download is on the record', () => {
  test('both downloads are listed, newest first, with who and what', async () => {
    const r = await W.admin.json('/api/trail/exports');
    assert.equal(r.total, 2);
    assert.deepEqual(r.exports.map(x => x.as), ['pdf', 'csv']);
    assert.equal(r.exports[0].who, 'Amina Otieno');
    assert.equal(r.exports[0].from, '2026-07-01');
    assert.equal(r.exports[0].acts, 3);
  });
  test('…and a trail that covers today carries them as acts', async () => {
    const r = await W.admin.raw(`/api/trail/export?from=2026-07-01&to=${today()}&as=csv`);
    const rows = r.text.trim().split('\r\n').filter(l => /"Exported the trail"/.test(l));
    assert.equal(rows.length, 2, 'the two earlier downloads; this one is recorded, not carried by itself');
    assert.match(rows[0], /"2026-07-01 to 2026-09-30 · CSV · 3 acts"/);
  });
});

describe('f699 (6) the private stream wall', () => {
  test('a private stream that does not name the admin is out of the file and the count, said as a number', async () => {
    await W.admin.json(`/api/private-streams/${FOLDER_B}`, { method: 'PUT', body: { on: true, ids: [W.users.unrestricted.id] } });
    const s = await W.admin.json('/api/trail/summary?' + Q3);
    assert.equal(s.acts, 2, 'Sales\'s act is gone');
    assert.equal(s.leftOut, 1);
    const r = await W.admin.raw(`/api/trail/export?${Q3}&as=csv`);
    assert.doesNotMatch(r.text, /Naivas|TR-2|Peter Kariuki/, 'not even a name of it');
  });
  test('named, the admin sees it again, and an open of its contract is an act', async () => {
    const me = (await W.admin.json('/api/bootstrap')).me;
    await W.admin.json(`/api/private-streams/${FOLDER_B}`, { method: 'PUT', body: { on: true, ids: [W.users.unrestricted.id, me.id] } });
    await W.unrestricted.json('/api/contracts/TR-2');
    const r = await W.admin.raw(`/api/trail/export?from=2026-07-01&to=${today()}&as=csv`);
    assert.match(r.text, /"Unrestricted Legal","Opened","A private stream's contract","TR-2"/);
    const s = await W.admin.json('/api/trail/summary?' + Q3);
    assert.equal(s.leftOut, 0);
  });
});
