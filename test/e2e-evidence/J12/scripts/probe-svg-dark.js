const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../../../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, '..', 'shots');
(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  await nameASigner(W.admin, 'MK-A2');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2200);
  await page.evaluate(() => setTheme('dark'));
  await page.waitForTimeout(500);
  await page.evaluate(() => setView('intel'));
  await page.waitForTimeout(1000);
  const svgInfo = await page.evaluate(() => {
    const svgs = Array.from(document.querySelectorAll('svg'));
    return {
      count: svgs.length,
      texts: Array.from(document.querySelectorAll('svg text')).slice(0, 15).map(t => ({
        content: t.textContent.trim().slice(0, 20),
        fill: t.getAttribute('fill') || getComputedStyle(t).fill,
      })),
    };
  });
  console.log(JSON.stringify(svgInfo, null, 2));
  await page.screenshot({ path: path.join(OUT, 'probe-dark-insights-svg.png'), fullPage: false });
  await browser.close();
  await h.stop();
})();
