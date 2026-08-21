const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../../../helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, '..', 'shots');
(async () => {
  const h = await startHati();
  await seedWorkspace(h);
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

  const tokens = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      accent100: cs.getPropertyValue('--color-accent-100').trim(),
      accent800: cs.getPropertyValue('--color-accent-800').trim(),
      accent900: cs.getPropertyValue('--color-accent-900').trim(),
      neutral600: cs.getPropertyValue('--color-neutral-600').trim(),
      bg: cs.getPropertyValue('--color-bg').trim(),
      surface: cs.getPropertyValue('--color-surface').trim(),
    };
  });
  console.log('DARK THEME TOKENS:', tokens);

  await page.evaluate(() => setView('team'));
  await page.waitForTimeout(700);
  const tabInfo = await page.evaluate(() => {
    const t = document.querySelector('.st-tab.on');
    if (!t) return null;
    const cs = getComputedStyle(t);
    return { text: t.textContent.trim(), color: cs.color, bg: cs.backgroundColor };
  });
  console.log('ACTIVE SETTINGS TAB in dark:', tabInfo);
  await page.screenshot({ path: path.join(OUT, 'probe-dark-settings-tabs.png') });

  // .field on a document with unfilled blanks — open the Templates library
  // and start a new draft to look at an unfilled template field chip.
  await page.evaluate(() => setView('templates'));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, 'probe-dark-templates.png') });

  await browser.close();
  await h.stop();
})();
