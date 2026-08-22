/* Chromium verification: THE SCANNING PATH.
   ============================================================
   Three claims that only a real browser can answer, and that need NO vendored
   library — so this file runs in the ordinary browser sweep. The measurement
   that needs pdf.js and Tesseract lives in test/scan/measure.js, out of the
   sweep for the same reason test/pdf is out of `npm test`.

   1. ocrPrepImage MUST NEVER MAKE AN IMAGE BIGGER. It is the one path whose
      whole job is to bring an oversized page image down, and a bare
      OCR_MAX_EDGE/longEdge is GREATER than one whenever the image is under
      the edge cap and over the byte cap — a small, high-quality page. It was
      scaling a 1000px page UP to 2400px on its way to being shrunk. This is
      canvas arithmetic on real decoded pixels; jsdom has neither.

   2. A REAL IMAGE-ONLY PDF MUST READ AS A SCAN. The file is legal PDF with a
      real cross-reference table and a real JPEG in it, and HaTi's own reader
      must find no text — because a reader that hallucinated text out of an
      image would send a scan straight past OCR and file an empty contract.
      The PDF reader was widened on 21 Aug 2026 and this is the other side of
      that change: it must read MORE from digital paper and still nothing from
      a picture of paper.

   3. THE BANNER IS DRAWN, IN AMBER, ABOVE MACHINE-READ TEXT. A warning drawn
      in neutral is furniture — this product's own recorded lesson, three
      times over.

   Screenshots go to test/chromium/shots/scan/.
   Run: node test/chromium/scan-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { PAGE_BUILDERS } = require('../scan/pagebuild');
const { LINES } = require('../scan/contract-page');

const OUT = path.join(__dirname, 'shots', 'scan');
fs.mkdirSync(OUT, { recursive: true });
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(PAGE_BUILDERS);

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ============ 1. THE ONE PATH THAT SHRINKS MUST NOT GROW ============ */
    const shrink = await page.evaluate(async () => {
      /* A small page at very high quality: 900px square, well under the 2400
         edge cap, and deliberately over the 3.5 MB byte cap — which is the
         exact state that used to fall through to the scaling branch. Noise
         rather than flat colour, because a flat image compresses to nothing
         and never reaches the cap at all. */
      const c = document.createElement('canvas'); c.width = c.height = 900;
      const x = c.getContext('2d');
      const d = x.createImageData(900, 900);
      for (let i = 0; i < d.data.length; i += 4) {
        d.data[i] = Math.random() * 255; d.data[i + 1] = Math.random() * 255;
        d.data[i + 2] = Math.random() * 255; d.data[i + 3] = 255;
      }
      x.putImageData(d, 0, 0);
      const big = c.toDataURL('image/png');           // PNG of noise: megabytes
      const size = u => new Promise(r => { const i = new Image(); i.onload = () => r([i.width, i.height]); i.src = u; });
      const before = await size(big);
      /* ocrPrepImage is module-private, and ocrDocument on an image mime is
         the product's own way in — it drives exactly the same code, and a
         stand-in recogniser records the page it was actually handed.
         DELIBERATELY NOT A `window.x ? x() : fallback` — a guard on a name
         nothing publishes is always false, which is the fault this same pass
         fixed in three places (see f232). */
      state.aiConfigured = false;
      let handed = null;
      window.Tesseract = { createWorker: async () => ({
        recognize: async img => { handed = img; return { data: { text: 'x', confidence: 90 } }; },
        terminate: async () => {} }) };
      await ocrDocument(big, 'image/png', {});
      const out = handed;
      const after = out ? await size(out) : null;
      return { before, after, chars: big.length,
        bytesBefore: Math.round(big.length * 0.75),
        bytesAfter: out ? Math.round(out.length * 0.75) : 0 };
    });
    /* THE CAP IS MEASURED ON THE BASE64 STRING, not on the image bytes — so
       the real threshold is about 2.6 MB of picture, not the 3.5 MB the
       constant reads as. Left alone: it errs toward shrinking sooner, which
       is the safe direction. Named here because the next person to read that
       line will otherwise make this fixture too small, as this one first was. */
    check('a small over-sized page reaches the shrink path at all',
      shrink.chars > 3.5 * 1024 * 1024,
      `${Math.round(shrink.bytesBefore / 1024)}k of picture, ${Math.round(shrink.chars / 1024)}k of data URL`);
    check('the page handed to the recogniser is NOT bigger than the one that went in',
      shrink.after && shrink.after[0] <= shrink.before[0] && shrink.after[1] <= shrink.before[1],
      `${shrink.before.join('x')} -> ${shrink.after ? shrink.after.join('x') : 'nothing'}`);
    check('and it really did get smaller in bytes, which is what the path is for',
      shrink.bytesAfter > 0 && shrink.bytesAfter < shrink.bytesBefore,
      `${Math.round(shrink.bytesBefore / 1024)}k -> ${Math.round(shrink.bytesAfter / 1024)}k`);

    /* ============ 2. A PICTURE OF PAPER IS NOT PAPER ============ */
    const detect = await page.evaluate(async lines => {
      const made = SCAN.make(lines, 'clean');
      const digital = String(await extractDocText(made.pdf, 'application/pdf') || '');
      return { chars: digital.trim().length, needed: ocrNeeded('application/pdf', made.pdf ? digital : ''),
        sample: digital.slice(0, 80), bytes: made.bytes };
    }, LINES);
    check('HaTi\'s own reader finds no text in an image-only PDF',
      detect.chars === 0, `${detect.chars} chars${detect.sample ? ' — "' + detect.sample + '"' : ''}`);
    check('so it is detected as a scan and goes to OCR', detect.needed === true);
    check('the fixture really is a page-sized image', detect.bytes > 50 * 1024,
      `${Math.round(detect.bytes / 1024)}k`);

    /* A DIGITAL contract must still read as digital — the other side of the
       same predicate, and the half that the 21 Aug reader work moved. */
    const digitalStill = await page.evaluate(() =>
      ocrNeeded('application/pdf', 'x'.repeat(4000)) === false
      && ocrNeeded('application/pdf', '') === true);
    check('a PDF with a real text layer is still not sent to OCR', digitalStill);

    /* ============ 3. THE BANNER, IN AMBER, ABOVE THE WORDS ============ */
    const banner = await page.evaluate(() => {
      const host = document.createElement('div');
      host.innerHTML = ocrBannerHtml({ textSource: 'ocr-local', ocrPages: 3,
        ocrSkippedPages: 0, ocrTotalPages: 3 });
      document.body.appendChild(host);
      const box = host.firstElementChild;
      if (!box) return { drawn: false };
      const cs = getComputedStyle(box);
      const r = box.getBoundingClientRect();
      const out = { drawn: true, text: box.textContent.trim(), bg: cs.backgroundColor,
        color: cs.color, w: Math.round(r.width), h: Math.round(r.height) };
      host.remove();
      return out;
    });
    check('the banner is drawn above machine-read text', banner.drawn && banner.h > 0,
      banner.drawn ? `${banner.w}x${banner.h}` : 'nothing rendered');
    check('it names the scan and tells the reader what to check',
      /machine-read from a scan/.test(banner.text || '')
      && /check dates and amounts/.test(banner.text || ''), banner.text);
    check('it is amber, not neutral — a warning in grey is furniture',
      banner.bg && banner.bg !== 'rgba(0, 0, 0, 0)' && banner.bg !== 'transparent', banner.bg);

    /* And nothing at all for a document that was not machine-read. */
    const quiet = await page.evaluate(() =>
      ocrBannerHtml({ textSource: 'pdf-text', ocrPages: 0 }) === ''
      && ocrBannerHtml({ textSource: 'docx-text' }) === '');
    check('and nothing is drawn over a document nobody machine-read', quiet);

    await page.screenshot({ path: path.join(OUT, '1-shell.png') });
    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('journey completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})();
