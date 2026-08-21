/* J12 — "the same product in every window": widths sweep.
   Widths: 1920, 1500, 1440, 1366, 1280, 1024.
   Screens per width: Home, Contracts (register), a contract room (all four
   tabs), Negotiations, Insights, Settings, People.
   Checks: horizontal overflow, nav float vs push at the 1500 line, page
   errors, screenshots. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, nameASigner } = require('../../../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const WIDTHS = [1920, 1500, 1440, 1366, 1280, 1024];

const OVERFLOW = `(() => {
  const de = document.documentElement;
  return { scrollW: de.scrollWidth, clientW: de.clientWidth, over: de.scrollWidth - de.clientWidth };
})()`;

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  await nameASigner(W.admin, 'MK-A2');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  for (const w of WIDTHS) {
    const height = 1000;
    const ctx = await browser.newContext({ viewport: { width: w, height } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${w}: pageerror: ${e.message}`));
    page.on('console', m => { if (m.type() === 'error') errors.push(`${w}: console.error: ${m.text().slice(0, 200)}`); });
    page.on('requestfailed', r => errors.push(`${w}: requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`));
    page.on('response', r => { if (r.status() >= 400) errors.push(`${w}: response ${r.status()}: ${r.url()}`); });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    console.log(`\n=== width ${w} ===`);

    // ---- Home ----
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(500);
    let ov = await page.evaluate(OVERFLOW);
    check(`${w}: Home — no horizontal overflow`, ov.over <= 0, `scrollW${ov.scrollW} clientW${ov.clientW}`);
    await page.screenshot({ path: path.join(OUT, `w${w}-01-home.png`) });

    // ---- Contracts / register ----
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(500);
    ov = await page.evaluate(OVERFLOW);
    check(`${w}: Contracts — no horizontal overflow`, ov.over <= 0, `over=${ov.over}`);
    await page.screenshot({ path: path.join(OUT, `w${w}-02-contracts.png`) });

    // ---- Contract room, all four tabs ----
    await page.click('tr[data-row="MK-A2"]');
    await page.waitForTimeout(700);
    for (const tab of ['terms', 'docs', 'sign', 'history']) {
      await page.click(`[data-ws-tab="${tab}"]`).catch(() => {});
      await page.waitForTimeout(500);
      ov = await page.evaluate(OVERFLOW);
      check(`${w}: Room/${tab} — no horizontal overflow`, ov.over <= 0, `over=${ov.over}`);
      await page.screenshot({ path: path.join(OUT, `w${w}-03-room-${tab}.png`) });
    }

    // ---- Negotiations ----
    await page.evaluate(() => setView('redline'));
    await page.waitForTimeout(700);
    ov = await page.evaluate(OVERFLOW);
    check(`${w}: Negotiations — no horizontal overflow`, ov.over <= 0, `over=${ov.over}`);
    await page.screenshot({ path: path.join(OUT, `w${w}-04-negotiations.png`) });

    // ---- Insights ----
    await page.evaluate(() => setView('intel'));
    await page.waitForTimeout(700);
    ov = await page.evaluate(OVERFLOW);
    check(`${w}: Insights — no horizontal overflow`, ov.over <= 0, `over=${ov.over}`);
    await page.screenshot({ path: path.join(OUT, `w${w}-05-insights.png`) });

    // ---- Settings ----
    await page.evaluate(() => setView('team'));
    await page.waitForTimeout(700);
    ov = await page.evaluate(OVERFLOW);
    check(`${w}: Settings — no horizontal overflow`, ov.over <= 0, `over=${ov.over}`);
    await page.screenshot({ path: path.join(OUT, `w${w}-06-settings.png`) });

    // ---- People ----
    await page.evaluate(() => setView('directory'));
    await page.waitForTimeout(700);
    ov = await page.evaluate(OVERFLOW);
    check(`${w}: People — no horizontal overflow`, ov.over <= 0, `over=${ov.over}`);
    await page.screenshot({ path: path.join(OUT, `w${w}-07-people.png`) });

    // ---- nav float / push check below/above 1500 ----
    if (w < 1500) {
      const before = await page.evaluate(() => {
        const r = document.getElementById('content-scroll').getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
      });
      await page.click('#cmd-rail').catch(() => {});
      await page.waitForTimeout(500);
      const during = await page.evaluate(() => {
        const r = document.getElementById('content-scroll').getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
      });
      const navPos = await page.evaluate(() => getComputedStyle(document.getElementById('side-nav')).position);
      await page.screenshot({ path: path.join(OUT, `w${w}-08-nav-open.png`) });
      await page.click('#cmd-rail').catch(() => {});
      await page.waitForTimeout(500);
      const after = await page.evaluate(() => {
        const r = document.getElementById('content-scroll').getBoundingClientRect();
        return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)];
      });
      check(`${w}: sidebar is fixed (floats) below 1500`, navPos === 'fixed', navPos);
      check(`${w}: page content box unchanged open vs before`, before.join() === during.join(), `${before.join(',')} vs ${during.join(',')}`);
      check(`${w}: page content box unchanged after close`, before.join() === after.join(), `${before.join(',')} vs ${after.join(',')}`);
    } else {
      const navW = await page.evaluate(() => document.getElementById('side-nav').getBoundingClientRect().width);
      check(`${w}: nav rests at open 256px column above the line`, Math.round(navW) === 256, `${navW}px`);
    }

    await ctx.close();
  }

  await browser.close();
  await h.stop();

  console.log('\n--- page errors collected ---');
  errors.forEach(e => console.log(e));
  fs.writeFileSync(path.join(__dirname, '..', 'errors-01-widths.json'), JSON.stringify(errors, null, 2));

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, '..', 'results-01-widths.json'), JSON.stringify(results, null, 2));
  process.exit(results.every(r => r.pass) ? 0 : 1);
})();
