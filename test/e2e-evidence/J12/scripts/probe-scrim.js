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

  await page.evaluate(() => openSettingsAt('platform', 'company'));
  await page.waitForTimeout(700);
  // Explicitly pin English (two real toggles to defeat the no-op guard).
  await page.click('#lang-switch [data-lang="sv"]');
  await page.waitForTimeout(400);
  await page.click('#lang-switch [data-lang="en"]');
  await page.waitForTimeout(400);
  await page.evaluate(() => openSettingsAt('platform', 'company'));
  await page.waitForTimeout(600);

  console.log('drawer open before switch:', await page.evaluate(() => document.getElementById('st-drawer')?.classList.contains('open')));
  await page.selectOption('#set-market', 'sweden');
  await page.waitForTimeout(700);
  console.log('lang after switch:', await page.evaluate(() => langId()));
  console.log('drawer open after switch:', await page.evaluate(() => document.getElementById('st-drawer')?.classList.contains('open')));
  console.log('scrim open after switch:', await page.evaluate(() => document.getElementById('st-scrim')?.classList.contains('open')));

  await page.screenshot({ path: path.join(OUT, 'probe-scrim-before-click.png') });

  // Now try a REAL click on the sidebar's Contracts nav item.
  console.log('view before click:', await page.evaluate(() => state.view));
  await page.click('[data-view="register"]', { timeout: 5000 }).catch(e => console.log('click 1 error:', e.message.split('\n')[0]));
  await page.waitForTimeout(500);
  console.log('view after FIRST click on Contracts nav item:', await page.evaluate(() => state.view));
  console.log('scrim open after first click:', await page.evaluate(() => document.getElementById('st-scrim')?.classList.contains('open')));
  await page.screenshot({ path: path.join(OUT, 'probe-scrim-after-click1.png') });

  await page.click('[data-view="register"]', { timeout: 5000 }).catch(e => console.log('click 2 error:', e.message.split('\n')[0]));
  await page.waitForTimeout(500);
  console.log('view after SECOND click on Contracts nav item:', await page.evaluate(() => state.view));

  await browser.close();
  await h.stop();
})();
