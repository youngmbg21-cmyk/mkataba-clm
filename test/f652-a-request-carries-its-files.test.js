/* ============================================================
   f652 — A REQUEST CARRIES ITS FILES (SAP benchmark, batch 2, 9 Oct 2026)
   ============================================================
   The owner asked for the Requests page to be built the SAP way, and the
   drawing's side panel lists the files a request came with. So the Ask form
   takes attachments, the server keeps them beside the request, the list
   says their names and sizes (never the bytes), and one file comes back at
   a time — only to somebody who may see the request (its asker, or an
   editor within its stream: the list route's own rule).

   WHAT THIS FILE PINS (driven against a real server)
     (1) a request raised with a file lists it by name and size, no bytes
     (2) an editor in its stream gets the very bytes back, as an attachment
     (3) an editor OUTSIDE its stream is told it does not exist
     (4) the caps are the server's: too many files, or one too big, is
         refused with a sentence, and nothing is stored
     (5) the browser holds the same caps and names the route in the Brain

   Run: node --test test/f652-a-request-carries-its-files.test.js */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');

const IK = fs.readFileSync(path.join(__dirname, '..', 'js', 'views', 'intake.js'), 'utf8');
const BRAIN = fs.readFileSync(path.join(__dirname, '..', 'js', 'brainmap.js'), 'utf8');

const dataUrl = (text, mime = 'text/plain') => `data:${mime};base64,` + Buffer.from(text).toString('base64');

let h, W, made;
before(async () => {
  h = await startHati();
  W = await seedWorkspace(h);
  made = await W.admin.json('/api/intake', { method: 'POST', body: {
    title: 'NDA for a new packaging supplier', need: 'Mutual NDA, two years, Kenyan law please.',
    folder: 'sales', files: [{ name: 'Polyflex profile.txt', mime: 'text/plain', dataUrl: dataUrl('our specs, page one') }] } });
});
after(async () => { await h.stop(); });

describe('f652 (1)–(3) the file travels with the request, and only to who may see it', () => {
  test('1 the request lists its file by name and size, and never the bytes', async () => {
    const r = made.request;
    assert.equal(r.files.length, 1);
    assert.equal(r.files[0].name, 'Polyflex profile.txt');
    assert.equal(r.files[0].size, Buffer.from('our specs, page one').length);
    const list = await W.unrestricted.json('/api/intake');
    const row = list.requests.find(x => x.id === r.id);
    assert.ok(row && row.files.length === 1, 'the list carries it too');
    assert.ok(!('data' in row.files[0]), 'names and sizes only');
  });
  test('2 an editor in its stream gets the very bytes back, as an attachment', async () => {
    const f = made.request.files[0];
    const got = await W.unrestricted.raw(`/api/intake/${made.request.id}/files/${f.id}`);
    assert.equal(got.status, 200);
    assert.equal(got.text, 'our specs, page one');
    assert.match(got.headers.get('content-disposition') || '', /^attachment;/);
  });
  test('3 an editor outside its stream is told it does not exist', async () => {
    const f = made.request.files[0];
    const got = await W.restricted.raw(`/api/intake/${made.request.id}/files/${f.id}`);
    assert.equal(got.status, 404);
    const stranger = await W.unrestricted.raw(`/api/intake/${made.request.id}/files/IKF-nothing`);
    assert.equal(stranger.status, 404, 'and a file id that is not this request\'s is not found');
  });
});

describe('f652 (4) the caps are the server\'s', () => {
  test('4a four files are refused, and nothing is stored', async () => {
    const before = (await W.admin.json('/api/intake')).requests.length;
    const r = await W.admin.raw('/api/intake', { method: 'POST', body: { title: 'Too many', need: 'x',
      files: [1, 2, 3, 4].map(i => ({ name: i + '.txt', dataUrl: dataUrl('x') })) } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /at most 3 files/);
    assert.equal((await W.admin.json('/api/intake')).requests.length, before);
  });
  test('4b a file over the size cap is refused', async () => {
    const big = 'x'.repeat(5 * 1024 * 1024 + 1);
    const r = await W.admin.raw('/api/intake', { method: 'POST', body: { title: 'Too big', need: 'x',
      files: [{ name: 'big.txt', dataUrl: dataUrl(big) }] } });
    assert.equal(r.status, 400);
    assert.match(r.json.error, /at most 5 MB/);
  });
});

describe('f652 (5) the browser holds the same caps, and the Brain knows the route', () => {
  test('5a the form checks the same numbers before it sends', () => {
    assert.match(IK, /const IK_FILES_MAX = 3, IK_FILE_MAX_MB = 5;/);
    assert.match(IK, /answers, files \}\);/, 'the files ride the request');
  });
  test('5b the route is a Brain part in the request flow', () => {
    assert.match(BRAIN, /\['reqfiles', 'GET \/api\/intake\/:id\/files\/:fid', 'in', 2\]/);
    assert.match(BRAIN, /\['request', 'kinds', 'intake', 'mailroom', 'reqfiles'\]/);
  });
});
