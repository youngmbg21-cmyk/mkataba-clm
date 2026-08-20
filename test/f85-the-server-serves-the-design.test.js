/* ============================================================
   F85 — every asset index.html asks for is actually served
   ============================================================
   A silent, total, design-wide regression, and one that no test in this suite
   could have caught.

   The design's two typefaces — "72" for the platform, Inter for
   headings — are carried in fonts/fonts.css, which index.html links. But
   server.js served exactly two static trees, /js and /sample-contracts, and
   /fonts was not among them. So on the deployed platform that link 404'd, no
   @font-face ever registered, and EVERY SCREEN rendered in whatever sans the
   reader's operating system happened to default to.

   Nothing reported it. There is no console error for a stylesheet that fails
   to load, the page still renders, and the fallback is a perfectly ordinary
   sans — so the platform simply stopped looking like the design, everywhere,
   with no symptom other than someone saying "that is not the same font".

   WHY IT SURVIVED SO LONG. Every browser check in this repo drives a
   throwaway static server rooted at the repo directory, which serves fonts/ by
   accident. The fault existed only in the one server that matters — the one
   `npm start` runs and Render deploys. So the fix is pinned here, against the
   REAL server, by asking it for the files the way a browser does.

   The other half of the property is that widening the static roots did not
   widen them too far: server/data holds the SQLite database, and the reason
   server.js names its trees one by one instead of serving the repo root is to
   keep that off the network. Both halves are asserted below. */
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { startHati } = require('./helpers');

let h;
before(async () => { h = await startHati(); });
after(async () => { await h.stop(); });

const get = p => fetch(h.base + p);

describe('F85 — the design\'s assets reach the browser', () => {
  test('index.html is served', async () => {
    const r = await get('/index.html');
    assert.equal(r.status, 200);
  });

  test('the stylesheet index.html links for its fonts is served', async () => {
    /* Read the link out of the served HTML rather than hardcoding the path, so
       renaming the file cannot quietly pass this test while breaking the page. */
    const html = await (await get('/index.html')).text();
    const m = /<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/.exec(html)
           || /<link[^>]+href="([^"]+\.css)"/.exec(html);
    assert.ok(m, 'index.html no longer links a stylesheet — has the font wiring moved?');
    const r = await get('/' + m[1].replace(/^\//, ''));
    assert.equal(r.status, 200,
      `index.html asks for ${m[1]} and the server answered ${r.status} — every screen falls back to a system font`);
    assert.match(r.headers.get('content-type') || '', /text\/css/);
  });

  test('and it actually carries both of the design\'s faces', async () => {
    /* CLAIM RE-POINTED 20 Aug 2026 (the SAP treatment): the design's two
       faces are now "72" (the platform) and Inter (the document face,
       --font-doc). Plus Jakarta Sans retired with the old design. */
    const css = await (await get('/fonts/fonts.css')).text();
    assert.match(css, /font-family:\s*'72'/,
      'the platform face is missing from the served stylesheet');
    assert.match(css, /font-family:\s*'Inter'/,
      'the document face is missing from the served stylesheet');
    // The faces are inlined as data URIs; a stylesheet of @font-face rules
    // pointing at files the server does not have would pass the check above
    // and still render nothing.
    assert.match(css, /src:\s*url\(data:font\/woff2;base64,/,
      'the faces must be inlined, not linked to files that are not served');
  });

  test('the ES module entry point is served', async () => {
    const r = await get('/js/app.js');
    assert.equal(r.status, 200);
  });
});

describe('F85 — and nothing beyond them', () => {
  /* Widening the static roots must not widen them to the repo. */
  for (const p of ['/server/server.js', '/package.json', '/server/data/hati.db', '/test/helpers.js']) {
    test(`${p} is not reachable`, async () => {
      const r = await get(p);
      assert.ok(r.status >= 400, `${p} answered ${r.status} — the repo root is exposed`);
    });
  }

  test('the fonts route cannot be walked out of', async () => {
    // express.static resolves traversal itself; this pins that we did not
    // hand-roll a path join that could be escaped.
    for (const p of ['/fonts/../server/server.js', '/fonts/../../etc/passwd']) {
      const r = await get(p);
      assert.ok(r.status >= 400 || !(await r.text()).includes('express'),
        `${p} escaped the fonts directory`);
    }
  });
});

describe('F85 — the checked-in font file is the one being served', () => {
  test('fonts/fonts.css exists in the repo and is not a stub', () => {
    const f = path.join(__dirname, '..', 'fonts', 'fonts.css');
    assert.ok(fs.existsSync(f), 'fonts/fonts.css is missing from the repo');
    // Two variable families with italics inline as base64 run to hundreds of
    // kilobytes; anything tiny means the faces were dropped from the file.
    assert.ok(fs.statSync(f).size > 100_000,
      'fonts/fonts.css is too small to contain the inlined faces');
  });
});
