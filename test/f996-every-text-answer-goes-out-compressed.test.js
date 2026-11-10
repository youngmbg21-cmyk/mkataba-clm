/* f996 — EVERY TEXT ANSWER GOES OUT COMPRESSED, AND THE LIVE FEED STILL DOES NOT
   (10 Nov 2026, off the owner's "why is the app slow" review).

   WHAT WAS WRONG. Nothing on this server had ever set Content-Encoding, so the
   136 ES modules the browser loads — about 20 MB of JavaScript — and
   index.html, whose stylesheet alone is 1.75 MB, all went out byte for byte.
   Text of that kind compresses by roughly four fifths.

   WHAT MUST NOT MOVE, and why each would be a fault:
   - THE LIVE FEEDS. An answer streaming in and the agent-run feed push one
     line at a time and the reader must see each as it lands. A compressor
     holds bytes back to find patterns, so a zipped event-stream is an answer
     that arrives all at once at the end — which reads as a hang. `text/`
     matches `text/event-stream`, so the exclusion is by name and this file
     drives a real stream to prove it.
   - A BROWSER THAT DID NOT ASK. No Accept-Encoding, no gzip, and the bytes are
     identical to the file on disk.
   - THE BYTES THEMSELVES. Un-zipped, every answer is exactly what it was.

   RED AT THE PARENT on 1, 2 and 4 (no Content-Encoding anywhere); 3 and 5 pass
   there, and are here so the fix cannot buy its speed by breaking them.

   Run: node --test --test-reporter=dot test/f996-every-text-answer-goes-out-compressed.test.js */
'use strict';
const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const zlib = require('node:zlib');
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace, startScriptedAi } = require('./helpers');

/* node's own fetch un-zips and then HIDES that it did, so the one thing this
   file is about would be invisible through it. Raw request, raw bytes. */
function raw(base, p, headers) {
  return new Promise((resolve, reject) => {
    const u = new URL(p, base);
    const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname + u.search, method: 'GET', headers: headers || {} },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      });
    req.on('error', reject);
    req.end();
  });
}
const GZIP = { 'Accept-Encoding': 'gzip' };

let ai, h, W;
describe('f996 — every text answer goes out compressed', () => {
  before(async () => {
    ai = await startScriptedAi();
    h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
    W = await seedWorkspace(h);
  });
  after(async () => { try { await h.stop(); } catch (_) {} try { await ai.stop(); } catch (_) {} });

  test('1 · a module goes out zipped, and un-zips to exactly the file on disk', async () => {
    const r = await raw(h.base, '/js/app.js', GZIP);
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], 'gzip', 'the module was compressed');
    assert.match(String(r.headers.vary || ''), /accept-encoding/i, 'and says so to any cache between us');
    assert.equal(r.headers['content-length'], undefined, 'the stored length is gone — it describes the un-zipped file');
    const out = zlib.gunzipSync(r.body);
    const disk = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'));
    assert.equal(out.length, disk.length, 'un-zipped, it is the same file');
    assert.ok(out.equals(disk), 'byte for byte');
    assert.ok(r.body.length * 2 < disk.length, 'and it crossed the wire at less than half the size');
  });

  test('2 · the page itself, whose stylesheet is the biggest single thing we send', async () => {
    const r = await raw(h.base, '/', GZIP);
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], 'gzip');
    const out = zlib.gunzipSync(r.body);
    const disk = fs.readFileSync(path.join(__dirname, '..', 'index.html'));
    assert.ok(out.equals(disk), 'un-zipped, index.html is untouched');
    assert.ok(r.body.length * 4 < disk.length, 'the page went out at under a quarter of its size');
  });

  test('3 · a browser that did not ask for gzip still gets the plain file', async () => {
    const r = await raw(h.base, '/js/app.js', { 'Accept-Encoding': 'identity' });
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], undefined, 'nothing was compressed');
    const disk = fs.readFileSync(path.join(__dirname, '..', 'js', 'app.js'));
    assert.ok(r.body.equals(disk), 'and the bytes are the file');
  });

  test('4 · an answer from the API is compressed too', async () => {
    const cookie = W.admin.cookie;
    const r = await raw(h.base, '/api/contracts?limit=50&offset=0', { ...GZIP, Cookie: cookie });
    assert.equal(r.status, 200);
    assert.equal(r.headers['content-encoding'], 'gzip', 'the contract list was compressed');
    const out = JSON.parse(zlib.gunzipSync(r.body).toString('utf8'));
    assert.ok(Array.isArray(out.rows), 'and un-zips to the same answer the app reads');
  });

  test('5 · THE LIVE FEED IS NEVER ZIPPED — a streamed answer still arrives line by line', async () => {
    ai.reset();
    ai.script({ content: [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer',
      input: { answer: 'Line by line, as it lands. '.repeat(30), citations: [] } }] });
    const u = new URL('/api/ai/chat/stream', h.base);
    const got = await new Promise((resolve, reject) => {
      const req = http.request({ hostname: u.hostname, port: u.port, path: u.pathname, method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: W.admin.cookie, 'Accept-Encoding': 'gzip' } },
      res => {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks) }));
      });
      req.on('error', reject);
      req.end(JSON.stringify({ messages: [{ role: 'user', content: 'f996: does the stream still stream?' }] }));
    });
    assert.equal(got.status, 200);
    assert.match(String(got.headers['content-type'] || ''), /text\/event-stream/, 'it is still a live feed');
    assert.equal(got.headers['content-encoding'], undefined, 'and it was NOT compressed');
    const text = got.body.toString('utf8');
    assert.match(text, /^(event|data|:)/m, 'the frames are plain text the browser can read as they land');
  });
});
