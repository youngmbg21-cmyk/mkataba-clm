/* Chromium verification: THE WORKSPACE KEEPS ITS ONE LOOK ACROSS A REFRESH
   ============================================================
   RE-POINTED 20 Oct 2026 (Chambers). THE OWNER'S OWN WORDS: "Let's not
   implement the dark theme. Remove it from HaTi. Only dark theme will be on
   the explorer and brain as designed today." HaTi now has ONE appearance, so
   there is no Blue / Green and no light / dark left to keep. What this file
   used to prove (10 Sep 2026: "when i choose the blue theme and refresh the
   page, the theme goes back to green") is now the opposite promise: an old
   choice still sitting in a browser must NOT bring an old look back.

   IT IS STILL THE ONLY PLACE THIS CLAIM CAN BE MADE. The fault would live in
   the moment between one load and the next: the pre-paint script at the top
   of index.html clears the old keys ('hati-dark', 'hati-dark-guest',
   'hati-theme', 'hati-brand', 'hati-brand-blue-once') once, and only running
   one load after another shows whether a stored "dark" or "navy" is truly
   forgotten.

   THE STORED KEYS ARE READ BACK ON EVERY CHECK, because "the old look came
   back" and "the old key was never cleared" are different faults.

   AND THE COLOUR IS MEASURED AS PAINT, not as an attribute: the bar's own
   colour with old keys planted must be the colour of a fresh browser.

   Screenshots go to test/chromium/shots/brand-survives-refresh/.
   Run: node test/chromium/brand-survives-refresh-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'brand-survives-refresh');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();

  const signIn = async () => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
    }
    await page.waitForTimeout(2600);
  };
  const reload = async () => { await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(2800); };

  /* WHAT IS ON SCREEN, and what the browser holds. #top-header is the
     element the bar paints (white in Chambers, --bar-bg); its colour is
     measured as paint so a key that slipped through and repainted it shows. */
  const OLD_KEYS = ['hati-dark', 'hati-dark-guest', 'hati-theme', 'hati-brand', 'hati-brand-blue-once'];
  const look = () => page.evaluate(keys => {
    const root = document.documentElement;
    const bar = document.getElementById('top-header');
    const held = {}; keys.forEach(k => { const v = localStorage.getItem(k); if (v != null) held[k] = v; });
    return {
      brand: root.getAttribute('data-brand'),
      dark: root.classList.contains('dark'),
      navBg: bar ? getComputedStyle(bar).backgroundColor : '',
      green: (() => { const i = document.createElement('i'); i.style.background = 'var(--bar-green)'; document.body.appendChild(i); const g = getComputedStyle(i).backgroundColor; i.remove(); return g; })(),
      bodyBg: getComputedStyle(document.body).backgroundColor,
      held,
    };
  }, OLD_KEYS);

  try {
    await signIn();

    /* ============ 1. A FRESH BROWSER LANDS ON THE ONE LOOK ============ */
    const rest = await look();
    check('1a CONTROL — a fresh browser opens on the one look: no brand, no dark, no old key stored',
      rest.brand === null && rest.dark === false && Object.keys(rest.held).length === 0,
      `brand=${rest.brand} dark=${rest.dark} held=${JSON.stringify(rest.held)}`);
    /* RE-POINTED 24 Oct 2026 (THE BAR IN COLOUR, owner picked "The SAP way"): its deep green, --bar-green */
    check('1b and the bar is painted its deep green',
      !!rest.green && rest.navBg === rest.green, `${rest.navBg} vs --bar-green ${rest.green}`);
    const gone = await page.evaluate(() => ['setBrand', 'setDark', 'toggleDark', 'brandNow', 'darkNow', 'applyAppearance', 'setTheme', 'toggleTheme']
      .filter(n => typeof window[n] === 'function'));
    check('1c the old switches are gone — nothing left in the app that sets a brand or the dark',
      gone.length === 0, gone.join(', ') || 'none published');
    const btns = await page.evaluate(() => ['#theme-btn', '#brand-navy', '#brand-green', '[data-brand-pick]'].filter(sel => !!document.querySelector(sel)));
    check('1d and the bar draws no theme button and no brand swatch',
      btns.length === 0, btns.join(', ') || 'none drawn');
    await page.screenshot({ path: path.join(OUT, '01-one-look.png') });

    /* ============ 2. A BROWSER STILL HOLDING "BLUE, AT NIGHT" ============
       The combination the old switches could write: navy and dark together,
       plus the counterparty's own dark key and the one-time Blue marker. */
    await page.evaluate(() => {
      localStorage.setItem('hati-brand', 'navy');
      localStorage.setItem('hati-dark', '1');
      localStorage.setItem('hati-dark-guest', '1');
      localStorage.setItem('hati-brand-blue-once', '1');
    });
    await reload();
    const night = await look();
    check('2a an old stored "navy at night" lands on light — no dark class, no brand attribute',
      night.dark === false && night.brand === null, `brand=${night.brand} dark=${night.dark}`);
    check('2b the old keys were cleared on that load',
      Object.keys(night.held).length === 0, JSON.stringify(night.held));
    check('2c measured as paint: the bar and the page are the colour a fresh browser paints',
      night.navBg === rest.navBg && night.bodyBg === rest.bodyBg, `${rest.navBg}/${rest.bodyBg} → ${night.navBg}/${night.bodyBg}`);
    await page.screenshot({ path: path.join(OUT, '02-old-dark-lands-on-light.png') });

    /* ============ 3. AND IT STAYS LIGHT ON THE NEXT REFRESH ============ */
    await reload();
    const again = await look();
    check('3a a second refresh is still the one look',
      again.dark === false && again.brand === null && again.navBg === rest.navBg,
      `brand=${again.brand} dark=${again.dark} bar=${again.navBg}`);

    /* ============ 4. A BROWSER FROM BEFORE THE TWO AXES ============
       'dark' and 'navy' under the single legacy key are still in people's
       browsers; they are cleared the same way. */
    await page.evaluate(() => { localStorage.setItem('hati-theme', 'dark'); });
    await reload();
    const legacy = await look();
    check('4a a browser holding only the old single key ("dark") opens light',
      legacy.dark === false && legacy.brand === null, `brand=${legacy.brand} dark=${legacy.dark}`);
    check('4b and that key is cleared too',
      Object.keys(legacy.held).length === 0, JSON.stringify(legacy.held));
    check('4c measured as paint',
      legacy.navBg === rest.navBg && legacy.bodyBg === rest.bodyBg, `${legacy.navBg}/${legacy.bodyBg}`);
  } catch (e) {
    check('the journey ran', false, e.message);
  }

  await browser.close();
  await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} PASS`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(b => console.log('  - ' + b.name + ' — ' + b.detail)); }
  process.exit(bad.length ? 1 : 0);
})();
