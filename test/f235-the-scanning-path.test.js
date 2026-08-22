/* ============================================================
   F235 — the scanning path, driven for the first time
   ============================================================
   DESIGN-ocr.md describes a three-part pipeline: DETECT that a document is a
   scan, RASTERIZE each page in the browser, RECOGNISE each page. f234 covers
   the recognition ROUTE. This file covers the part that decides how many
   pages there are, which recogniser reads them, what happens when one of
   them fails, and — the part everything downstream depends on — WHAT THE
   RECORD IS THEN ALLOWED TO SAY ABOUT WHERE THE WORDS CAME FROM.

   None of it had ever run. `ocrDocument` is the function every scanned
   contract in this product passes through, and no test had called it.

   HOW THE STAGE WORKS. ocr.js reaches pdf.js through a dynamic import of a
   CDN URL, which a node context cannot do, and rasterizes onto a canvas,
   which jsdom has not got. Neither is under test here — they are a library
   and a browser. So `ocrLoadPdfjs` and `ocrRenderPage` are replaced ON THE
   WINDOW, which is the same shared global scope the product itself runs in
   (ocr.js says so in its own header), and everything between them — the cap,
   the loop, the tier, the fallback, the provenance — is the real code.

   WHAT THIS FILE FOUND, all four fixed in the pass that wrote it:
     · the progress counter ran the whole document TWICE, because every page
       was rasterized before any was read
     · a page the transcriber ran out of room on was joined into the wording
       silently, so the contract simply lacked the bottom of a page
     · "Pages 21-50 were not read (page limit)" on a document whose unread
       pages were 31-60 — counted from what came back rather than from the
       total, and wrong in the direction that understates
     · ocrRelease, which hands back the offline recogniser's tens of
       megabytes, had NOT ONE CALLER anywhere in the product */
'use strict';
const { test, describe, before, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { buildWorld } = require('./world');
const { runFileInContext } = require('./vmcache');
const path = require('node:path');

let W;
before(async () => {
  const w = await buildWorld({ ocr: true });
  W = w.win;
  /* The migration view joins this stage for the last block only. It is the
     one screen that files a scan with NOBODY LOOKING AT IT — the upload popup
     puts the extracted fields in front of a person before anything is saved,
     and a batch of two hundred does not. */
  runFileInContext(path.join(__dirname, '..', 'js', 'views', 'migration.js'),
    w.dom.getInternalVMContext(), 'js/views/migration.js');
});

/* ---------- the stage ----------
   A fake document of N pages, a fake renderer, and a recogniser of each tier
   that records what it was handed. Everything is installed on the window,
   which is where the real ones live once ocr.js has run. */
function stage({ pages = 3, aiKey = true, ai, tess, renderFails = [] } = {}) {
  const log = { rendered: [], ai: [], tess: [], progress: [] };
  /* `state` is the application shell's, and this stage does not load core.js
     — so it is supplied as a window property, which is exactly how ocr.js
     reads it (a bare reference resolving on the shared global). */
  W.state = { aiConfigured: !!aiKey, aiCfg: { limits: {} } };

  W.ocrLoadPdfjs = async () => ({
    getDocument: () => ({ promise: Promise.resolve({ numPages: pages, destroy: async () => { log.destroyed = true; } }) }),
  });
  W.ocrRenderPage = async (doc, n) => {
    if (renderFails.includes(n)) throw new Error('page ' + n + ' would not render');
    log.rendered.push(n);
    return 'data:image/jpeg;base64,PAGE' + n;
  };
  W.ocrPageWithAi = async (img, o) => {
    log.ai.push({ img, first: !!o.first });
    if (ai) return ai(img, o, log);
    return { text: 'AI ' + img.slice(-6), illegible: 0, confidence: 'high', truncated: false };
  };
  W.ocrPageWithTesseract = async (img) => {
    log.tess.push({ img });
    if (tess) return tess(img, log);
    return { text: 'LOCAL ' + img.slice(-6), illegible: 0, confidence: 'low', truncated: false };
  };
  return log;
}
const run = (opts = {}, log) => W.ocrDocument('data:application/pdf;base64,JVBERi0=', 'application/pdf',
  { onProgress: (d, t, tier) => log.progress.push([d, t, tier]), ...opts });

describe('F235 — detecting a scan', () => {

  test('f235-1 an image is always a scan; a PDF is one only when it yields no words', () => {
    assert.equal(W.ocrNeeded('image/jpeg', ''), true);
    assert.equal(W.ocrNeeded('image/png', 'x'.repeat(9999)), true, 'a photo is a scan whatever it decodes to');
    assert.equal(W.ocrNeeded('application/pdf', ''), true);
    assert.equal(W.ocrNeeded('application/pdf', 'x'.repeat(199)), true);
    assert.equal(W.ocrNeeded('application/pdf', 'x'.repeat(200)), false);
    assert.equal(W.ocrNeeded('text/plain', ''), false, 'a text file with nothing in it is not a scan');
    assert.equal(W.ocrNeeded('application/vnd.openxmlformats-officedocument.wordprocessingml.document', ''), false);
  });

  test('f235-2 whitespace is not a text layer', () => {
    assert.equal(W.ocrNeeded('application/pdf', '   \n\n\t  '), true);
  });

  test('f235-3 THE READER IS WHAT DECIDES THIS, so a reader that reads more sends fewer scans', () => {
    /* Not a rule about ocrNeeded — a consequence of it, and the reason the
       PDF work of 21 Aug 2026 mattered more than its own numbers. Every
       LibreOffice PDF returned an empty document before that fix, so this
       predicate called each of them a scan: an ordinary digital contract was
       rasterized, sent page by page to a paid transcriber, filed with an
       amber "machine-read from a scan" banner and CAPPED AT MEDIUM
       CONFIDENCE for ever. Slow, costly, and untrue about the document. */
    const libreOfficeBefore = '';                       // what the old reader returned
    const libreOfficeAfter = 'x'.repeat(4000);          // what it returns now
    assert.equal(W.ocrNeeded('application/pdf', libreOfficeBefore), true);
    assert.equal(W.ocrNeeded('application/pdf', libreOfficeAfter), false);
  });
});

describe('F235 — reading the pages', () => {

  test('f235-4 the progress counter runs the document ONCE', async () => {
    /* The defect this file was written to find. Every page was rasterized
       into an array before any was recognised, and both loops reported
       progress — so the strip counted 1..12 while rendering and then 1..12
       again while reading, and a reader watched the same counter fill, reset
       and fill again on one document. */
    const log = stage({ pages: 6 });
    await run({}, log);
    assert.equal(log.progress.length, 6, 'progress was reported ' + log.progress.length + ' times for 6 pages');
    assert.deepEqual(log.progress.map(p => p[0]), [0, 1, 2, 3, 4, 5]);
    assert.ok(log.progress.every(p => p[1] === 6), 'the total must not change mid-document');
  });

  test('f235-5 a page is rendered, then read, then the next one', async () => {
    /* One loop, not two. It is what makes the counter honest, and it is also
       what stops thirty page images — a couple of hundred kilobytes each by
       this file's own estimate — being alive at the same time. */
    const order = [];
    const log = stage({ pages: 4 });
    const render = W.ocrRenderPage, read = W.ocrPageWithAi;
    W.ocrRenderPage = async (d, n) => { order.push('render' + n); return render(d, n); };
    W.ocrPageWithAi = async (i, o) => { order.push('read'); return read(i, o); };
    await run({}, log);
    assert.deepEqual(order, ['render1', 'read', 'render2', 'read', 'render3', 'read', 'render4', 'read']);
  });

  test('f235-6 the page limit reads the first N and says which were left', async () => {
    /* DESIGN-ocr.md: a document longer than the cap is NOT refused. "Refusing
       a 60-page scan because the cap is 30 would hand the customer's problem
       back to them again." */
    const log = stage({ pages: 60 });
    const r = await run({ maxPages: 30 }, log);
    assert.equal(r.pages, 30);
    assert.equal(r.totalPages, 60);
    assert.equal(r.skippedPages, 30);
    assert.equal(log.rendered.length, 30, 'pages past the cap must not even be rasterized');
  });

  test('f235-7 the pdf.js document is always released, even when a page throws', async () => {
    let log = stage({ pages: 2 });
    await run({}, log);
    assert.equal(log.destroyed, true);
    log = stage({ pages: 2, ai: async () => { throw new Error('boom'); }, tess: async () => { throw new Error('boom'); } });
    await run({}, log);
    assert.equal(log.destroyed, true, 'a document abandoned mid-read still holds its buffers');
  });

  test('f235-8 one page that will not render does not lose the others', async () => {
    const log = stage({ pages: 5, renderFails: [3] });
    const r = await run({}, log);
    assert.equal(r.pages, 4, 'four pages were readable and must reach the record');
    assert.equal(r.failedPages, 1);
    assert.ok(r.text.includes('PAGE5'.slice(-6)) || /PAGE5|AGE5/.test(r.text), 'the pages after the bad one were dropped');
  });

  test('f235-9 stopping the batch keeps the pages already read', async () => {
    let seen = 0;
    const log = stage({ pages: 10 });
    const r = await run({ shouldContinue: () => ++seen <= 3 }, log);
    assert.equal(r.pages, 3);
    assert.ok(r.text.length > 0, 'a stopped batch must keep what it had — the design says so');
    assert.equal(r.textSource, 'ocr-ai');
  });
});

describe('F235 — which recogniser read it, and saying so', () => {

  test('f235-10 with a key the transcriber reads it; the first page books the request', async () => {
    const log = stage({ pages: 3 });
    const r = await run({}, log);
    assert.equal(r.textSource, 'ocr-ai');
    assert.equal(r.tier, 'ai');
    assert.deepEqual(log.ai.map(c => c.first), [true, false, false],
      'the request counter books one per DOCUMENT, not one per page');
    assert.equal(log.tess.length, 0);
  });

  test('f235-11 with no key the offline recogniser reads it, and the record says which', async () => {
    const log = stage({ pages: 2, aiKey: false });
    const r = await run({}, log);
    assert.equal(r.textSource, 'ocr-local');
    assert.equal(log.ai.length, 0, 'nothing may be sent to a provider that is not configured');
    assert.ok(log.progress.every(p => p[2] === 'local'), 'the strip must name the slower recogniser');
  });

  test('f235-12 THE WEAKEST TIER USED DECIDES THE PROVENANCE', async () => {
    /* The load-bearing honesty rule. If the transcriber dies on page 3 —
       budget gone, rate limit, provider error — the rest is read offline
       rather than abandoned, and the DOCUMENT must not then claim to be a
       Copilot transcription. A record that overstates how it was read is
       worse than one that was never made. */
    let n = 0;
    const log = stage({ pages: 5, ai: async () => {
      if (++n >= 3) throw new Error('daily spend limit reached');
      return { text: 'AI page', illegible: 0, confidence: 'high', truncated: false };
    } });
    const r = await run({}, log);
    assert.equal(r.pages, 5, 'the document must be finished, not abandoned');
    assert.equal(r.textSource, 'ocr-local', 'a part-read document claimed the stronger tier');
    assert.equal(r.tier, 'local');
    assert.match(W.ocrProvenanceLine({ ...rec(r) }), /Tesseract/);
  });

  test('f235-13 a document nothing could read claims nothing', async () => {
    const log = stage({ pages: 2, aiKey: false, tess: async () => { throw new Error('script blocked'); } });
    const r = await run({}, log);
    assert.equal(r.textSource, 'none');
    assert.equal(r.text, '');
    assert.match(r.error, /script blocked/);
    assert.equal(W.ocrProvenanceLine(rec(r)), '', 'nothing was read, so there is nothing to say it was');
  });

  test('f235-14 pages that come back blank leave no provenance to claim', async () => {
    const log = stage({ pages: 3, ai: async () => ({ text: '', illegible: 0, confidence: 'low', truncated: false }) });
    const r = await run({}, log);
    assert.equal(r.text, '');
    assert.equal(r.textSource, 'none', 'an empty document must not be filed as a machine-read one');
  });

  test('f235-15 partial success is success — the error stands down once words arrive', async () => {
    let n = 0;
    const log = stage({ pages: 4, ai: async () => {
      if (++n === 2) throw new Error('rate limited');
      return { text: 'page ' + n, illegible: 0, confidence: 'high', truncated: false };
    } });
    const r = await run({}, log);
    assert.ok(r.text);
    assert.equal(r.error, null, 'text arrived, so the document is not an error');
  });
});

/* The record the three callers write, in the shape ocrProvenanceLine reads. */
const rec = r => ({ textSource: r.textSource, ocrPages: r.pages, ocrSkippedPages: r.skippedPages,
  ocrTotalPages: r.totalPages, ocrPartialPages: r.partialPages });

describe('F235 — what the record is allowed to say', () => {

  test('f235-16 a page cut short is counted, and the provenance line says so', async () => {
    /* Without this the sentence claims a page was read when half of it was
       not — and that sentence is what the viewer banner, the audit detail and
       the clause-review warning all print. */
    const log = stage({ pages: 3, ai: async (img) => ({ text: 'half a page', illegible: 0,
      confidence: 'medium', truncated: /PAGE2/.test(img) }) });
    const r = await run({}, log);
    assert.equal(r.partialPages, 1);
    assert.match(W.ocrProvenanceLine(rec(r)), /1 page was cut short and is incomplete/);
  });

  test('f235-17 the unread pages are the LAST ones, not the ones after what came back', async () => {
    /* 60 pages, capped at 30, of which the recogniser managed 20. It used to
       say "Pages 21–50 were not read (page limit)" — wrong at both ends.
       Pages 21–30 were attempted and failed, which is a different fact with a
       different remedy; pages 51–60 went unmentioned entirely. */
    const line = W.ocrProvenanceLine({ textSource: 'ocr-ai', ocrPages: 20, ocrSkippedPages: 30, ocrTotalPages: 60 });
    assert.match(line, /Pages 31–60 were not read \(page limit\)/);
    assert.doesNotMatch(line, /Pages 21–50/);
  });

  test('f235-18 nothing skipped, nothing said about skipping', async () => {
    const log = stage({ pages: 2 });
    const r = await run({}, log);
    const line = W.ocrProvenanceLine(rec(r));
    assert.doesNotMatch(line, /page limit/);
    assert.doesNotMatch(line, /cut short/);
    assert.match(line, /check dates and amounts against the original/,
      'the one warning that must never come off');
  });

  test('f235-19 an OCR read never leaves a field at high confidence', async () => {
    /* DESIGN-ocr.md calls this the load-bearing rule: "OCR misreads dates and
       amounts — 3 for 8, 2026 for 2028 — and those are exactly the fields the
       90/60/30 day renewal reminders fire on." */
    const meta = W.capConfidenceForOcr({ counterparty: 'Acme', expiryDate: '2026-12-31',
      confidence: { counterparty: 'high', expiryDate: 'high', value: 'low' } });
    assert.equal(meta.confidence.counterparty, 'medium');
    assert.equal(meta.confidence.expiryDate, 'medium');
    assert.equal(meta.confidence.value, 'low', 'a low answer must not be promoted on the way past');
    assert.equal(meta._ocrCapped, true);
  });

  test('f235-20 the banner is drawn for a scan and for nothing else', () => {
    assert.equal(W.ocrBannerHtml({ textSource: 'pdf-text', ocrPages: 3 }), '');
    assert.equal(W.ocrBannerHtml({ textSource: 'docx-text' }), '');
    const b = W.ocrBannerHtml({ textSource: 'ocr-local', ocrPages: 3 });
    assert.match(b, /machine-read from a scan/);
    assert.match(b, /--st-amber/, 'a warning drawn in neutral is furniture');
  });
});

describe('F235 — the honest label has to have teeth', () => {

  /* THE DEFECT THIS WHOLE MEASUREMENT EXISTED TO FIND, and it was invisible
     from the code: every piece of the honesty chain was present and correct,
     and the chain did not connect.

     DESIGN-ocr.md argues the case in its own words — "A machine-read scan
     that LOOKS like a confirmed record is worse than no record at all,
     because the renewal reminders depend on the dates", and "OCR misreads
     dates and amounts — 3 for 8, 2026 for 2028". Both true. Both enforced by
     capConfidenceForOcr, which honestly knocks every `high` down to `medium`.
     And the batch's review gate only ever tripped on `low`.

     So the flagship journey — a drawer of scans imported in one batch —
     filed every one of them as complete, with dates nobody had read.

     MEASURED before it was touched (test/scan/measure.js, a real Chromium, a
     real recogniser, a page drawn from known text): a 100 DPI scan read "28
     February 2028" as "26 February 2028"; a phone photo of the same page read
     it as "28 February 2025". Word recall on the first was 100%. */

  const ocrMeta = () => W.capConfidenceForOcr({
    counterparty: 'Nordkust Industri AB', contractType: 'Supply',
    effectiveDate: '2026-03-01', expiryDate: '2025-02-28', value: 4800000,
    confidence: { counterparty: 'high', contractType: 'high', effectiveDate: 'high',
      expiryDate: 'high', value: 'high' } });

  test('f235-21 the cap turns high into medium — and medium is not low', () => {
    /* The two halves that did not meet. Asserted together so the next reader
       can see why neither one was wrong on its own. */
    const m = ocrMeta();
    assert.equal(m.confidence.expiryDate, 'medium');
    assert.notEqual(m.confidence.expiryDate, 'low',
      'if this ever becomes low, the gate below is passing for the wrong reason');
  });

  test('f235-22 a batch-imported scan is held for a human, every time', async () => {
    const c = { valueType: 'estimated', upload: { textSource: 'ocr-local' } };
    assert.equal(W.migNeedsReview(ocrMeta(), c), true,
      'a scan was filed as complete with a date nobody had read');
    c.upload.textSource = 'ocr-ai';
    assert.equal(W.migNeedsReview(ocrMeta(), c), true, 'the transcriber misreads dates too');
  });

  test('f235-23 a DIGITAL contract is not held — nothing else got noisier', () => {
    /* The other half of the fix, and the one that decides whether it was worth
       making. A rule that flags everything is a rule nobody reads. */
    const clean = { counterparty: 'Nordkust Industri AB', contractType: 'Supply',
      effectiveDate: '2026-03-01', expiryDate: '2028-02-28', value: 4800000,
      confidence: { counterparty: 'high', contractType: 'high', effectiveDate: 'high',
        expiryDate: 'high', value: 'high' } };
    assert.equal(W.migNeedsReview(clean, { valueType: 'estimated', upload: { textSource: 'pdf-text' } }), false);
    assert.equal(W.migNeedsReview(clean, { valueType: 'estimated', upload: { textSource: 'docx-text' } }), false);
    /* And a digital contract with a genuinely doubtful field is held exactly
       as it always was — the old rule is intact underneath the new one. */
    const doubtful = { ...clean, confidence: { ...clean.confidence, expiryDate: 'low' } };
    assert.equal(W.migNeedsReview(doubtful, { valueType: 'estimated', upload: { textSource: 'pdf-text' } }), true);
  });

  test('f235-24 it says a human must look ONCE, not for ever', () => {
    /* applyReviewedMeta clears the flag outright when somebody confirms the
       fields. If this stopped being true, every scanned contract in the
       workspace would sit amber for the rest of its life and the flag would
       stop meaning anything. */
    const src = W.applyReviewedMeta.toString();
    assert.match(src, /needsReview\s*=\s*false/,
      'the way out of the review flag is gone — an amber that cannot be cleared is furniture');
  });

  test('f235-25 the provenance reaches the record the gate reads', () => {
    /* The gate asks the CONTRACT, not meta._ocrCapped — the underscore is
       transport and does not survive a save, so a recompute would forget. */
    /* Comments stripped, the house idiom: this function's own comment NAMES
       the field it deliberately does not use, and a grep that reads prose as
       code fails on the explanation of why it passes. */
    const src = W.migNeedsReview.toString()
      .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
    assert.match(src, /textSource/, 'the gate no longer asks how the words were read');
    assert.doesNotMatch(src, /_ocrCapped/, 'a transport field must not be what a durable gate hangs on');
  });
});
