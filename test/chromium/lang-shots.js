/* Screenshots of the real app, the same screens in each language.
   Not a test — a look. Shots land in test/chromium/shots/lang/.
   Run: node test/chromium/lang-shots.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'lang');
fs.mkdirSync(OUT, { recursive: true });

const SCREENS = [
  { id: 'dashboard', view: 'dashboard' },
  { id: 'register',  view: 'register'  },
  { id: 'calendar',  view: 'calendar'  },
  { id: 'settings',  view: 'team'      },
];

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);
  /* Animations off, so two shots of the same screen differ only by language. */
  await page.addStyleTag({ content:
    '*,*::before,*::after{animation:none!important;transition:none!important}' });

  const shots = [];

  /* CLICKED, NOT CALLED. These shots exist to show the owner the control, so
     the shots have to be taken the way a person would take them — press the
     button. Calling window.langSet would photograph an app in Swedish without
     ever proving the button that got it there is on the screen. */
  const press = async lang => {
    await page.click(`#lang-switch [data-lang="${lang}"]`);
    await page.waitForTimeout(700);
  };

  /* The toggle on its own, big, so it is legible in a message. */
  for (const lang of ['en', 'sv']) {
    if (lang !== 'en') await press(lang);
    const f = path.join(OUT, `toggle--${lang}.png`);
    await page.locator('#lang-switch').screenshot({ path: f });
    shots.push(f);
  }
  await press('en');

  for (const lang of ['en', 'sv']) {
    if (lang !== 'en') await press(lang);

    for (const s of SCREENS) {
      await page.evaluate(v => window.setView(v), s.view);
      await page.waitForTimeout(500);
      const f = path.join(OUT, `${s.id}--${lang}.png`);
      await page.screenshot({ path: f });
      shots.push(f);

      /* The market card, which is where the thing the flags used to do now
         lives. It is admin-only and sits down the Settings page, so it needs
         scrolling to and is worth a shot of its own — the whole point of
         moving it was that it stops being a header ornament and starts being
         a company setting with a sentence explaining it. */
      if (s.view === 'team') {
        const card = page.locator('#set-market').locator('xpath=ancestor::section[1]');
        if (await card.count()) {
          await card.first().scrollIntoViewIfNeeded();
          await page.waitForTimeout(250);
          const m = path.join(OUT, `market-card--${lang}.png`);
          await card.first().screenshot({ path: m });
          shots.push(m);
        }
      }
    }

    // and a contract open, which is where most of the words live
    await page.evaluate(() => window.openWorkspace(window.state.contracts[1].id));
    await page.waitForTimeout(900);
    const f = path.join(OUT, `contract--${lang}.png`);
    await page.screenshot({ path: f });
    shots.push(f);
  }

  await browser.close();
  await h.stop();
  console.log(shots.map(s => path.basename(s)).join('\n'));
  console.log('\n→ ' + OUT);
})().catch(e => { console.error(e); process.exit(1); });
