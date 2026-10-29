/* f962 — WHAT JAMBO COULD NOT PLACE BECOMES A LESSON (round 8 "The SAP way", owner's yes 29 Oct 2026: "No names",
   "90 days")

   The server's half, each wall asked from both sides:
     · POST /api/jambo/unplaced keeps the words, the page, the contract's reference and where the person went — and
       NO PERSON: the row has no id, name or address of who typed it
     · only an admin reads the rows (GET) or lets one go (DELETE)
     · a row older than 90 days is gone the next time the table is touched
     · PUT /api/jambo/lessons (admin only) teaches a phrase its page; every reader can GET the lessons; a taught
       phrase is not kept again, and its waiting rows are cleared
   The browser's half (jamboLessonOf, jamboUnplacedNext, the Settings table) is source-read here and driven in
   test/chromium/jambo-lessons-verify.js.

   Run: node --test test/f962-what-jambo-could-not-place.test.js */
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

let h, W;
before(async () => { h = await startHati(); W = await seedWorkspace(h); });
after(async () => { if (h) await h.stop(); });
const read = f => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

describe('f962 (1) a sentence is kept with no person on it', () => {
  test('kept by anyone signed in; the row holds the words, page, reference and next page only', async () => {
    const r = await W.unrestricted.json('/api/jambo/unplaced', { method: 'POST', body: { text: 'renewals coming up', page: 'counter', ref: 'MK-A2', next: 'obligations' } });
    assert.ok(r.ok && r.id, JSON.stringify(r));
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const cols = db.prepare('PRAGMA table_info(jambo_unplaced)').all().map(c => c.name);
    db.close();
    assert.deepEqual(cols.sort(), ['at', 'id', 'next', 'page', 'phrase', 'ref', 'text'], 'no column can hold who typed it');
    assert.equal((await W.unrestricted.raw('/api/jambo/unplaced', { method: 'POST', body: { text: '   ' } })).status, 400, 'nothing to keep');
  });
  test('only an admin reads them, and lets one go', async () => {
    assert.equal((await W.unrestricted.raw('/api/jambo/unplaced')).status, 403);
    const L = await W.admin.json('/api/jambo/unplaced');
    const row = L.rows.find(x => x.text === 'renewals coming up');
    assert.ok(row, 'the admin sees it');
    assert.deepEqual(Object.keys(row).sort(), ['at', 'id', 'next', 'page', 'ref', 'text']);
    assert.equal(row.page, 'counter'); assert.equal(row.next, 'obligations'); assert.equal(row.ref, 'MK-A2');
    assert.equal(L.days, 90);
    assert.equal((await W.unrestricted.raw('/api/jambo/unplaced/' + row.id, { method: 'DELETE' })).status, 403);
    await W.admin.json('/api/jambo/unplaced/' + row.id, { method: 'DELETE' });
    assert.ok(!(await W.admin.json('/api/jambo/unplaced')).rows.some(x => x.id === row.id), 'Fine: the row is gone');
  });
});

describe('f962 (2) kept 90 days', () => {
  test('a row older than 90 days is gone the next time the table is touched', async () => {
    const { DatabaseSync } = require('node:sqlite');
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
    const old = new Date(Date.now() - 91 * 864e5).toISOString(), young = new Date(Date.now() - 89 * 864e5).toISOString();
    db.prepare('INSERT INTO jambo_unplaced (id,text,phrase,page,ref,next,at) VALUES (?,?,?,?,?,?,?)').run('JU-OLD', 'old words', 'old words', 'counter', '', '', old);
    db.prepare('INSERT INTO jambo_unplaced (id,text,phrase,page,ref,next,at) VALUES (?,?,?,?,?,?,?)').run('JU-YOUNG', 'young words', 'young words', 'counter', '', '', young);
    db.close();
    const L = await W.admin.json('/api/jambo/unplaced');
    assert.ok(!L.rows.some(x => x.id === 'JU-OLD'), 'past 90 days: gone');
    assert.ok(L.rows.some(x => x.id === 'JU-YOUNG'), 'inside 90 days: kept');
  });
});

describe('f962 (3) teaching', () => {
  test('only an admin teaches; every reader reads the lessons; a taught phrase clears its rows and is not kept again', async () => {
    await W.unrestricted.json('/api/jambo/unplaced', { method: 'POST', body: { text: 'Send to legal?', page: 'register', next: 'approvals' } });
    await W.unrestricted.json('/api/jambo/unplaced', { method: 'POST', body: { text: 'send to legal', page: 'counter', next: 'approvals' } });
    assert.equal((await W.unrestricted.raw('/api/jambo/lessons', { method: 'PUT', body: { phrase: 'send to legal', place: 'approvals' } })).status, 403);
    assert.equal((await W.admin.raw('/api/jambo/lessons', { method: 'PUT', body: { phrase: 'send to legal', place: '' } })).status, 400, 'a page is chosen');
    const t = await W.admin.json('/api/jambo/lessons', { method: 'PUT', body: { phrase: 'Send to legal?', place: 'approvals' } });
    assert.equal(t.phrase, 'send to legal', 'the phrase is read as every box reads it: lower case, no closing ?');
    assert.equal(t.cleared, 2, 'both waiting rows of that phrase are cleared');
    const g = await W.unrestricted.json('/api/jambo/lessons');
    assert.equal(g.lessons['send to legal'], 'approvals');
    assert.equal(g.list, undefined, 'who taught it is for admins');
    const again = await W.unrestricted.json('/api/jambo/unplaced', { method: 'POST', body: { text: 'send to legal', page: 'counter', next: 'approvals' } });
    assert.equal(again.taught, true, 'a taught phrase is placed: nothing kept');
    await W.admin.json('/api/jambo/lessons', { method: 'PUT', body: { phrase: 'send to legal', remove: true } });
    assert.ok(!('send to legal' in (await W.unrestricted.json('/api/jambo/lessons')).lessons), 'forgotten');
  });
});

describe('f962 (4) the browser reads one phrase the way the server does, and moves free', () => {
  const CA = read('js/copilotacts.js');
  test('a taught phrase is asked with the page\'s name, before any reader that costs', () => {
    assert.match(CA, /const a = jamboPageWordOf\(q\) \|\| jamboLessonOf\(q\);/);
    assert.match(CA, /if \(!a\)\{ const r = jamboRefGo\(q\); if \(!r\) jamboUnplacedNote\(q\); return r; \}/);
  });
  test('the person\'s own next page, not Jambo\'s move, sends it; within a minute', () => {
    assert.match(CA, /const JB_UNPLACED_NEXT_MS = 60000;/);
    assert.match(CA, /if \(Date\.now\(\) - _jbMovedAt < JB_OWN_MOVE_MS\) return false;/);
    assert.match(read('js/app.js'), /if\(window\.jamboUnplacedNext\) jamboUnplacedNext\(view\);/);
    assert.match(read('js/navmap.js'), /window\.jamboMovedNow\(\);/);
  });
});
