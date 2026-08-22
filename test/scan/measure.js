/* ============================================================
   Measuring HaTi's scanning path against paper it did not make
   ============================================================
   Until 22 August 2026 nothing had ever put a scan through this product. The
   OCR route had never been called by a test, `ocrDocument` had never been
   run, and the whole path was written from DESIGN-ocr.md and shipped
   unexercised. This is the measurement; the regression tests that run every
   time are test/f234-*.test.js and test/f235-*.test.js, which need neither a
   browser nor a vendored library.

   WHAT MAKES THIS DIFFERENT FROM THE PDF HARNESS NEXT DOOR. There, no answer
   key existed and two readers were compared. Here the paper is DRAWN from a
   page of text we wrote, so we know exactly what it says — and the question
   is not "did the words survive" alone but "did THESE EIGHT FACTS survive",
   because a transcription that is 95% right and has the expiry date wrong has
   failed at the one job the renewal reminders depend on.

   WHAT IS REAL: a real Chromium, HaTi served by a real server, the real
   `ocrDocument`, the real pdf.js rasterizer, and the real Tesseract — the
   offline recogniser, which is what every workspace with no Copilot key gets
   and what every workspace WITH one falls back to when a page fails.

   WHAT IS NOT MEASURED, said plainly: the Copilot vision tier. It needs a
   paid key, so this cannot score it, and the honest reading of every number
   below is that it is the FLOOR — the worst reader in the product, on the
   worst paper. f234 proves the vision route's own plumbing separately.

     node test/scan/fetch-libs.sh     # pdf.js and Tesseract — neither committed
     node test/scan/measure.js
     node test/scan/measure.js --keep # leave the page images in test/scan/out
*/
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { PAGE_BUILDERS } = require('./pagebuild');
const { LINES, MUST_SURVIVE, TEXT } = require('./contract-page');

const NM = path.join(__dirname, 'node_modules');
const OUT = path.join(__dirname, 'out');
const KEEP = process.argv.includes('--keep');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* The libraries are fetched, never committed — the same rule test/pdf keeps
   for pdf.js, and for the same reason: a measuring instrument is not a
   dependency. Say so loudly rather than failing with a module error. */
const NEED = {
  'pdfjs-dist/build/pdf.min.mjs': 'pdf.js (the rasterizer)',
  'tesseract.js/dist/tesseract.min.js': 'Tesseract (the offline recogniser)',
  'tesseract.js-core/tesseract-core-simd.wasm': 'the Tesseract engine',
  '@tesseract.js-data/eng/4.0.0/eng.traineddata.gz': 'the English language data',
};
const missing = Object.keys(NEED).filter(f => !fs.existsSync(path.join(NM, f)));
if (missing.length) {
  console.error('\nThis measurement needs two libraries that are not committed:\n');
  for (const m of missing) console.error('  missing — ' + NEED[m]);
  console.error('\n  sh test/scan/fetch-libs.sh\n');
  process.exit(2);
}

/* ---------- how a reading is scored ----------
   RECALL is the share of the paper's own words that came back, deliberately
   one-directional and forgiving about punctuation and order — the question is
   whether the words survived, not whether the layout did, because everything
   downstream of this is an AI reading prose. THE EIGHT FACTS are scored
   separately and are the figure that actually matters. */
const words = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean);
function recall(truth, got) {
  const want = words(truth), have = new Map();
  for (const w of words(got)) have.set(w, (have.get(w) || 0) + 1);
  let hit = 0;
  for (const w of want) { const n = have.get(w) || 0; if (n > 0) { hit++; have.set(w, n - 1); } }
  return want.length ? hit / want.length : 0;
}
const pct = n => (n * 100).toFixed(0) + '%';

const VARIANTS = [
  ['clean', 'a 200 DPI scan, the good case'],
  ['low',   '100 DPI at JPEG quality 0.30 — a cheap office scanner in a hurry'],
  ['fax',   'halved, blurred, thresholded to 1 bit, 1.2% of pixels flipped, fed crooked'],
  ['skew',  'a phone photo: 2.6° off square, out of focus, a window on one side'],
];

const serve = (route, file, type) => route.fulfill({ status: 200,
  headers: { 'content-type': type, 'access-control-allow-origin': '*' }, body: fs.readFileSync(file) });

(async () => {
  if (KEEP) fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1400, height: 900 } });

  /* The two CDN origins HaTi's own CSP names are answered from disk. The URLs
     the page asks for are unchanged — which is the point: the product is not
     reconfigured for the measurement, only the wire is. */
  await ctx.route('**/cdnjs.cloudflare.com/**/pdf.min.mjs', r => serve(r, NM + '/pdfjs-dist/build/pdf.min.mjs', 'text/javascript'));
  await ctx.route('**/cdnjs.cloudflare.com/**/pdf.worker.min.mjs', r => serve(r, NM + '/pdfjs-dist/build/pdf.worker.min.mjs', 'text/javascript'));
  await ctx.route('**/cdn.jsdelivr.net/npm/tesseract.js@**/tesseract.min.js', r => serve(r, NM + '/tesseract.js/dist/tesseract.min.js', 'text/javascript'));
  await ctx.route('**/cdn.jsdelivr.net/npm/tesseract.js@**/worker.min.js', r => serve(r, NM + '/tesseract.js/dist/worker.min.js', 'text/javascript'));
  await ctx.route('**/cdn.jsdelivr.net/npm/tesseract.js-core@**', r => {
    const f = r.request().url().split('/').pop();
    const p = NM + '/tesseract.js-core/' + f;
    return fs.existsSync(p) ? serve(r, p, f.endsWith('.wasm') ? 'application/wasm' : 'text/javascript') : r.abort();
  });
  await ctx.route('**/tessdata.projectnaptha.com/**', r =>
    serve(r, NM + '/@tesseract.js-data/eng/4.0.0/eng.traineddata.gz', 'application/gzip'));

  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.HATI_OCR_TESSERACT_OPTS = {
      workerPath: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/worker.min.js',
      corePath: 'https://cdn.jsdelivr.net/npm/tesseract.js-core@5.1.1/',
      langPath: 'https://tessdata.projectnaptha.com/4.0.0',
    };
  });
  await page.addInitScript(PAGE_BUILDERS);

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2500);

  const rows = [];
  for (const [kind, blurb] of VARIANTS) {
    const t0 = Date.now();
    const r = await page.evaluate(async ({ lines, kind }) => {
      const made = SCAN.make(lines, kind);
      /* 1. HaTi'S OWN READER MUST FIND NOTHING IN IT. This is not a
         formality: the file is a legal PDF with a real cross-reference table
         and a real image, and a reader that hallucinated text out of it would
         send a scan straight past the OCR path with an empty document. */
      const digital = String(await extractDocText(made.pdf, 'application/pdf') || '');
      const detected = ocrNeeded('application/pdf', digital);
      /* 2. The whole path, on the offline tier. */
      state.aiConfigured = false;
      const t = Date.now();
      const out = await ocrDocument(made.pdf, 'application/pdf', {});
      await ocrRelease();
      return { digitalChars: digital.trim().length, detected, out, ms: Date.now() - t,
        bytes: made.bytes, jpeg: made.jpeg };
    }, { lines: LINES, kind });

    if (KEEP) fs.writeFileSync(path.join(OUT, kind + '.jpg'),
      Buffer.from(r.jpeg.split(',')[1], 'base64'));

    const rec = recall(TEXT, r.out.text);
    /* MY OWN SCORER BUG, FOUND ON THE FIRST RUN and worth recording because it
       is the fourth of its family in this project: the counterparty read as
       MISSING on all four variants while word recall was 100%, and the reason
       was that "Nordkust Industri" straddles a line break IN THE SOURCE. The
       recogniser was right and the check was wrong. A line break is layout;
       the facts are checked against the words. */
    const flat = String(r.out.text || '').replace(/\s+/g, ' ');
    const facts = MUST_SURVIVE.map(f => ({ ...f, ok: f.find.test(flat) }));
    rows.push({ kind, blurb, ...r, rec, facts, seconds: ((Date.now() - t0) / 1000).toFixed(1) });
  }

  await browser.close();
  await h.stop();

  /* ---------- the report ---------- */
  console.log('\n  HaTi\'s scanning path — the OFFLINE recogniser, on paper it did not make');
  console.log('  ' + '='.repeat(72));
  console.log('\n  the page: ' + words(TEXT).length + ' words, ' + LINES.length + ' lines, a one-page supply agreement\n');
  console.log('  ' + 'variant'.padEnd(8) + 'detected'.padEnd(10) + 'recall'.padEnd(9)
    + 'facts'.padEnd(8) + 'size'.padEnd(9) + 'time');
  console.log('  ' + '-'.repeat(58));
  for (const r of rows) {
    const ok = r.facts.filter(f => f.ok).length;
    console.log('  ' + r.kind.padEnd(8)
      + (r.detected ? 'yes' : 'NO').padEnd(10)
      + pct(r.rec).padEnd(9)
      + (ok + '/' + r.facts.length).padEnd(8)
      + (Math.round(r.bytes / 1024) + 'k').padEnd(9)
      + r.seconds + 's');
  }

  console.log('\n  what each variant is');
  for (const r of rows) console.log('    ' + r.kind.padEnd(7) + r.blurb);

  console.log('\n  the eight facts, and what reads them');
  for (const f of MUST_SURVIVE) {
    const line = rows.map(r => (r.facts.find(x => x.what === f.what).ok ? '  ok ' : ' MISS')).join('');
    console.log('    ' + line + '   ' + f.what.padEnd(22) + f.why);
  }
  console.log('           ' + rows.map(r => r.kind.padEnd(4)).join('').slice(0, 40));

  const bad = rows.filter(r => !r.detected);
  if (bad.length) console.log('\n  NOT DETECTED AS A SCAN: ' + bad.map(r => r.kind).join(', ')
    + ' — these would be filed as empty contracts');
  const chars = rows.map(r => r.digitalChars);
  /* THE MISSES, IN THE RECOGNISER'S OWN WORDS. A fact scored MISS is useless
     without the line it came back as: "expiry date missing" and "expiry date
     read as 2020" are the same tick on the table and completely different
     problems. */
  if (process.argv.includes('--misses')) {
    console.log('\n  what the misses actually came back as');
    for (const r of rows) {
      const miss = r.facts.filter(f => !f.ok);
      if (!miss.length) continue;
      const flat = String(r.out.text || '').replace(/\s+/g, ' ');
      for (const f of miss) {
        const cue = f.what.split(' ').pop();
        const hint = { date: /(expiring[^.]{0,40})/i, value: /(total contract value[^.]{0,40})/i,
          counterparty: /(and Nordkust[^,]{0,30}|Industri[^,]{0,20})/i }[cue];
        const m = hint && hint.exec(flat);
        console.log('    ' + r.kind.padEnd(7) + f.what.padEnd(22)
          + (m ? '"' + m[1].trim() + '"' : '(nothing like it in the reading)'));
      }
    }
  }

  console.log('\n  HaTi\'s own PDF reader found ' + chars.join('/') + ' characters in the four files'
    + (chars.every(c => c === 0) ? ' — correct: there is no text in them' : ' — SOMETHING IS WRONG'));
  if (errors.length) console.log('\n  page errors: ' + errors.slice(0, 3).join(' | '));

  if (KEEP) console.log('\n  page images written to test/scan/out/');
  console.log('');

  /* Nothing here is a pass/fail gate — it is a measurement, and the exit code
     says only whether it ran. A threshold on a recogniser's accuracy would be
     a number nobody chose. */
  process.exit(rows.length === VARIANTS.length ? 0 : 1);
})().catch(e => { console.error('measurement failed:', e); process.exit(1); });
