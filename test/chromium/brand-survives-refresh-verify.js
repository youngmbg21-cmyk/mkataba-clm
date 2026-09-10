/* Chromium verification: THE WORKSPACE KEEPS ITS COLOUR (Job 5)
   ============================================================
   THE OWNER'S OWN WORDS (10 Sep 2026): "when i choose the blue theme and
   refresh the page, the theme goes back to green."

   IT IS THE ONLY PLACE THIS CLAIM CAN BE MADE. The fault lives entirely in the
   moment between one load and the next: the appearance became TWO AXES on
   24 Aug 2026 — the brand belongs to the workspace, light/dark to the person —
   and setBrand/setDark write 'hati-brand' and 'hati-dark', while the pre-paint
   script at the top of index.html went on reading only the single legacy
   'hati-theme', which neither setter touches. So the choice was stored and
   painted, and the very next load ignored it. No source check can see that: the
   two readings look perfectly correct in their own files, and only running one
   after the other shows they disagree.

   THE STORED KEYS ARE READ BACK ON EVERY CHECK, because "the theme came back"
   and "the theme was never saved" are different faults with different fixes,
   and only the keys tell them apart. MEASURED before the fix: hati-brand was
   still 'navy' in the browser while data-brand was gone — the reader's choice
   was never forgotten, it was never read.

   AND THE COLOUR IS MEASURED AS PAINT, not as an attribute. An attribute that
   is set while a rule fails to reach it is a workspace that is still green.

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

  /* WHAT IS ON SCREEN, and what the browser holds.
     #top-header AND NOT #side-nav, and that was MEASURED rather than assumed:
     the shell's 24 Aug 2026 rebuild made the nav COLUMN white and moved the
     brand ground to the 44px bar above it, so a probe on the column reports
     rgb(255,255,255) in green AND in navy — a check that passes on a product
     with no brand at all. #top-header is the element that carries --nav-bg. */
  const look = () => page.evaluate(() => {
    const root = document.documentElement;
    const bar = document.getElementById('top-header');
    return {
      brand: root.getAttribute('data-brand'),
      dark: root.classList.contains('dark'),
      navBg: bar ? getComputedStyle(bar).backgroundColor : '',
      keys: {
        brand: localStorage.getItem('hati-brand'),
        dark: localStorage.getItem('hati-dark'),
        legacy: localStorage.getItem('hati-theme'),
      },
    };
  });

  try {
    await signIn();

    /* ============ 1. CONTROL — green is what a fresh browser gets ============
       If it were not, everything below would be measuring a product that was
       always navy rather than one that remembers a choice. */
    const rest = await look();
    check('1a CONTROL — a fresh browser opens green, with nothing stored',
      rest.brand === null && rest.dark === false && rest.keys.brand === null,
      `brand=${rest.brand} dark=${rest.dark} stored=${JSON.stringify(rest.keys)}`);
    const greenNav = rest.navBg;

    /* ============ 2. THE OWNER'S REPORT, DRIVEN ============ */
    await page.evaluate(() => setBrand('navy'));
    await page.waitForTimeout(1000);
    const chosen = await look();
    check('2a pressing navy paints navy and stores it',
      chosen.brand === 'navy' && chosen.keys.brand === 'navy',
      `painted=${chosen.brand} stored=${chosen.keys.brand}`);
    check('2b and the shell bar really changes colour — measured as paint',
      chosen.navBg !== greenNav, `${greenNav} → ${chosen.navBg}`);
    const navyNav = chosen.navBg;
    await page.screenshot({ path: path.join(OUT, '01-navy-chosen.png') });

    await reload();
    const after = await look();
    check('2c THE CHOICE WAS NEVER FORGOTTEN — it is still in the browser',
      after.keys.brand === 'navy', `hati-brand=${after.keys.brand}`);
    check('2d and after a refresh the workspace is STILL navy — the owner\'s report',
      after.brand === 'navy', `data-brand=${after.brand}`);
    check('2e measured as paint, not as an attribute',
      after.navBg === navyNav, `${navyNav} → ${after.navBg}`);
    await page.screenshot({ path: path.join(OUT, '02-navy-after-refresh.png') });

    /* ============ 3. LIGHT AND DARK IS THE SAME FAULT, AND WAS LOST TOO ============
       setDark writes the other half of the same pair and the pre-paint script
       ignored that one as well, so this was never only about the brand. */
    await page.evaluate(() => setDark(true));
    await page.waitForTimeout(1000);
    const night = await look();
    check('3a turning the lights off paints dark and stores it',
      night.dark === true && night.keys.dark === '1',
      `painted=${night.dark} stored=${night.keys.dark}`);
    const darkNav = night.navBg;

    await reload();
    const nightBack = await look();
    check('3b and dark survives a refresh too', nightBack.dark === true,
      `dark=${nightBack.dark}`);

    /* ============ 4. NAVY AT NIGHT — THE COMBINATION THE `else if` COULD NOT PAINT ============
       The pre-paint script asked `if dark … else if navy`, so a dark workspace
       could never also be navy however the keys were written. That is the
       three-states-not-two-axes model the app itself left behind in August and
       this script was never told about. */
    check('4a the two axes survive TOGETHER — navy at night',
      nightBack.brand === 'navy' && nightBack.dark === true,
      `brand=${nightBack.brand} dark=${nightBack.dark}`);
    check('4b and it is painted, not merely stamped',
      nightBack.navBg === darkNav, `${darkNav} → ${nightBack.navBg}`);
    await page.screenshot({ path: path.join(OUT, '03-navy-at-night.png') });

    /* ============ 5. AND IT GOES BACK ============
       A choice that could not be undone would be a worse fault than the one
       being fixed. */
    await page.evaluate(() => { setBrand('green'); setDark(false); });
    await page.waitForTimeout(1000);
    await reload();
    const home = await look();
    check('5a choosing green again comes back green after a refresh',
      home.brand === null && home.dark === false,
      `brand=${home.brand} dark=${home.dark}`);
    check('5b and the shell bar is the colour it started at',
      home.navBg === greenNav, `${greenNav} → ${home.navBg}`);

    /* ============ 6. A BROWSER FROM BEFORE THE TWO AXES IS NOT RESET ============
       'navy' and 'dark' under the single legacy key are still in people's
       browsers. Reading them was the whole promise the two-axis change made,
       and the pre-paint script has to keep it too. */
    await page.evaluate(() => {
      localStorage.removeItem('hati-brand');
      localStorage.removeItem('hati-dark');
      localStorage.setItem('hati-theme', 'navy');
    });
    await reload();
    const legacy = await look();
    check('6a a browser holding only the old key still opens navy',
      legacy.brand === 'navy', `data-brand=${legacy.brand}`);
    check('6b and the app agrees with the page about it',
      await page.evaluate(() => brandNow() === 'navy' && !darkNow()),
      await page.evaluate(() => `brandNow=${brandNow()} darkNow=${darkNow()}`));
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
