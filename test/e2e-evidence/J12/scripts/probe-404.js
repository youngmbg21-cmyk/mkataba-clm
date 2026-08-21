const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../../../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await ctx.newPage();
  page.on('response', r => { if (r.status() >= 400) console.log('RESP', r.status(), r.url()); });
  page.on('requestfailed', r => console.log('FAILED', r.url(), r.failure()?.errorText));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2500);
  for (const v of ['dashboard','register','redline','intel','team','directory']) {
    await page.evaluate(vv => setView(vv), v);
    await page.waitForTimeout(600);
  }
  await browser.close();
  await h.stop();
})();
