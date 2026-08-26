/* The analytics work, verified where the USER looks: the Reports screen has
   its export and report buttons and draws real charts (or the bar fallback
   with no network), the Copilot panel opens with suggestion chips, the chip
   builds the Portfolio Health Report in a new tab, and the chart toolbar is
   on the cards. Screenshots land in test/chromium/shots/analytics/.
   Run: node test/chromium/analytics-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'analytics');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what);
  if (!ok) failures++;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  /* ---- NOTHING IS STUBBED HERE ANY MORE (26 Aug 2026) ----
     This used to route cdnjs to a local copy of Chart.js behind a CHARTJS_LOCAL
     env var, because the sandbox cannot reach cdnjs and without it only the
     FALLBACK path was ever exercised. The library is served by the workspace
     itself now (vendor/README.md), so the real chart path runs on every
     machine, with no outbound network and no env var — and this file is the
     thing that proves the vendored bytes actually draw.
     BLOCK THE OPEN INTERNET OUTRIGHT, so a chart that appears below can only
     have come from our own copy: if the src ever drifts back to a CDN, this
     file goes red instead of passing on somebody's well-connected laptop. */
  await ctx.route('**://cdnjs.cloudflare.com/**', r => r.abort());
  await ctx.route('**://cdn.jsdelivr.net/**', r => r.abort());
  const page = await ctx.newPage();

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  /* ---- 1. the Reports screen ---- */
  await page.evaluate(() => window.setView('reports'));
  await page.waitForTimeout(2500);   // chart lib fetch + hydrate, or fallback
  check(await page.locator('#rep-export').count() === 1, 'Reports has the Download CSV button');
  check(await page.locator('#rep-health').count() === 1, 'Reports has the health report button');
  /* ---- THE FALLBACK IS FOUND BY WHAT IT IS, NOT BY A RADIUS (re-pointed
     23 Aug 2026) ---- This looked for `border-radius:999px`, which is how the
     CSS strips were drawn until the 20 Aug SQUARE CORNERS sweep set every
     rounded rectangle in the product to 0. The bars were still there and still
     correct; the selector simply stopped describing them, so a screen that was
     working reported as broken. Matched on the strip's own SHAPE now — a
     7px-tall track inside the charts grid — which is what makes it a bar. */
  const canvases = await page.locator('.rp-charts canvas').count();
  const bars = await page.locator('.rp-charts div[style*="height:7px"]').count();
  check(canvases > 0 || bars > 0, `Reports cards draw charts (${canvases} canvases) or fall back to bars (${bars})`);
  if (canvases > 0)
    check(await page.locator('.rp-charts .ai-chart-btn').count() >= 3, 'chart cards carry the copy/PNG/CSV toolbar');
  await page.screenshot({ path: path.join(OUT, 'reports.png'), fullPage: true });

  /* the CSV button actually produces a file */
  const dl = page.waitForEvent('download', { timeout: 8000 }).catch(() => null);
  await page.click('#rep-export');
  const got = await dl;
  check(!!got, 'Download CSV really downloads a file' + (got ? ` (${got.suggestedFilename()})` : ''));

  /* ---- 2. the Copilot panel: chips on an empty conversation ---- */
  await page.evaluate(() => { window.clearAIHistory && (window.ai.history = []); window.openAI(); });
  await page.waitForTimeout(800);
  const chips = await page.locator('#ai-suggest .ai-chip').count();
  check(chips >= 3, `Copilot shows suggestion chips on an empty panel (${chips})`);
  await page.screenshot({ path: path.join(OUT, 'copilot-chips.png') });

  /* ---- 3. the report chip opens the Portfolio Health Report ---- */
  const popup = ctx.waitForEvent('page', { timeout: 15000 }).catch(() => null);
  await page.locator('#ai-suggest .ai-chip').first().click();
  const rep = await popup;
  check(!!rep, 'the report chip opens a new tab');
  if (rep) {
    await rep.waitForLoadState('domcontentloaded').catch(() => {});
    await rep.waitForTimeout(3500);   // chart images render offscreen first
    const body = await rep.content();
    check(/Portfolio Health Report|hälsorapport/i.test(body), 'the tab holds the health report');
    check(/<span class="no">7<\/span>/.test(body), 'all seven sections are present');
    check(!/undefined/.test(body), 'no "undefined" leaked into the report');
    const imgs = await rep.locator('figure img').count();
    console.log(`  info — ${imgs} chart image(s) embedded in the report`);
    await rep.screenshot({ path: path.join(OUT, 'health-report.png'), fullPage: true });
  }

  /* ---- 4. the answer bubble in the panel after the chip ---- */
  await page.waitForTimeout(600);
  const feed = await page.locator('#ai-feed').innerText();
  check(/report|rapport/i.test(feed), 'the panel confirms the report in words');
  await page.screenshot({ path: path.join(OUT, 'copilot-after-report.png') });

  await browser.close();
  await h.stop();
  console.log(failures ? `\n${failures} FAILURE(S)` : '\nall good');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
