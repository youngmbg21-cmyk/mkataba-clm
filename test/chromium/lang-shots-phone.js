/* THE PHONE, IN EACH LANGUAGE.
   The desktop shots (lang-shots.js) cannot show this: below 768px the desktop
   shell is display:none and js/mobile*.js draws the app instead. It is a second
   shell, so it is a second set of pictures.

   The language is switched by TAPPING the row in the account sheet, which is
   the only language control a phone has — not by calling langSet, which would
   photograph an app in Swedish without proving anyone could get it there.

   Shots land in test/chromium/shots/lang-phone/.
   Run: node test/chromium/lang-shots-phone.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'lang-phone');
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);
  await page.addStyleTag({ content:
    '*,*::before,*::after{animation:none!important;transition:none!important}' });

  /* A REAL PRESS AT REAL COORDINATES. Playwright's element click refuses when
     anything covers the centre point, and inside a sheet that is still settling
     that is an argument about hit-testing rather than about the product. */
  const tap = async sel => {
    const el = await page.$(sel);
    if (!el) throw new Error('not on screen: ' + sel);
    const b = await el.boundingBox();
    if (!b) throw new Error('no box, so nothing to press: ' + sel);
    await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
  };
  /* The scrim shares data-m-act="close-sheet" with the real button and covers
     the screen, so the button has to be named exactly. */
  const closeSheet = async () => {
    const el = await page.$('.m-btn[data-m-act="close-sheet"]');
    const b = el ? await el.boundingBox() : null;
    if (b) { await page.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await page.waitForTimeout(400); }
  };

  const shots = [];
  const shoot = async name => {
    const f = path.join(OUT, name + '.png');
    await page.screenshot({ path: f });
    shots.push(f);
  };

  for (const lang of ['en', 'sv']) {
    await closeSheet();
    await tap('[data-m-act="account"]');
    await page.waitForTimeout(700);
    if (lang === 'sv') await shoot('account-sheet--picking-sv');   // the control itself
    await tap(`[data-m-lang="${lang}"]`);
    await page.waitForTimeout(800);
    await closeSheet();

    await page.evaluate(() => window.mGo && mGo('home'));
    await page.waitForTimeout(600); await shoot(`home--${lang}`);

    await page.evaluate(() => window.mGo && mGo('contracts'));
    await page.waitForTimeout(600); await shoot(`contracts--${lang}`);

    await page.evaluate(() => window.mGo && mGo('approvals'));
    await page.waitForTimeout(600); await shoot(`approvals--${lang}`);

    /* A contract open, which is where most of the words live. Set the active
       contract the way the row's own handler does, then move — there is no
       single "open this contract" entry point on the phone. */
    await page.evaluate(() => {
      const id = window.state.contracts[0].id;
      window.state.activeId = id; window.state.selId = id;
      mGo('contract', { tab:'doc' });
    });
    await page.waitForTimeout(900); await shoot(`contract--${lang}`);

    await tap('[data-m-act="account"]');
    await page.waitForTimeout(700); await shoot(`account--${lang}`);
  }

  await browser.close();
  await h.stop();
  console.log(shots.map(s => path.basename(s)).join('\n'));
  console.log('\n→ ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
