/* CALENDAR IS HOME'S SECOND TAB (owner, 11 Oct 2026,
   docs/WORKORDER-four-builds.md item 1: "bring the calendar as the fourth tab
   in the home page"; the order Board · Calendar · Paper · Explorer; "you would
   remove the calendar from the menu, two copilot panels would become one").

   Asked where the reader looks: the tab order, no menu row, the calendar
   drawn on Home with its Copilot in Home's ONE panel (none beside the
   calendar), every old door landing on the tab, the other tabs untouched, and
   a refresh coming back to it. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'calendar-on-home');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, 15000);
    await until(page, () => document.querySelectorAll('[data-hb-face]').length > 0, null, 10000);

    const tabs = await page.evaluate(() => [...document.querySelectorAll('[data-hb-face]')].map(b => b.getAttribute('data-hb-face')));
    /* RE-POINTED 11 Oct 2026 (owner, the sliding pill): Board · Document · Breakdown · Calendar · Explorer */
    /* re-pointed 13 Oct 2026: the owner deleted the Breakdown face */
    ok('1 Home\'s tabs read Board · Document · Calendar · Explorer', tabs.join(',') === 'board,paper,calendar,explorer', tabs.join(','));
    ok('2 the menu has no Calendar row', await page.evaluate(() => !document.querySelector('#side-nav [data-view="calendar"]')));

    await page.click('[data-hb-face="calendar"]');
    const up = await until(page, () => !!document.querySelector('#hb-cal .cal-stage'));
    const at = await page.evaluate(() => {
      const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      return { view: state.view, inStage: !!document.querySelector('#cal-stage #cal-plan'),
        inDock: vis(document.querySelector('#ig-dock #cal-plan')), panels: document.querySelectorAll('#cal-plan').length,
        homeCopilot: vis(document.getElementById('igd-feed')), cal: vis(document.getElementById('hb-cal')),
        board: vis(document.getElementById('hb-board')), head: !!document.querySelector('#hb-cal .cal-head'),
        more: !!document.querySelector('#hb-cal .cal-bar1 #cal-more'),
        nav: (document.querySelector('#side-nav .nav-item.active, #side-nav [aria-current="page"]') || {}).getAttribute?.('data-view') || null };
    });
    ok('3 the Calendar tab draws the calendar on Home', up && at.view === 'dashboard' && at.cal && !at.board, JSON.stringify(at));
    ok('4 ONE Copilot panel: the calendar\'s own, in Home\'s panel, none beside the calendar',
      at.inDock && !at.inStage && at.panels === 1 && !at.homeCopilot);
    ok('5 Home\'s head is the page head (no second one), and the ⋯ stands on the calendar\'s bar', !at.head && at.more);
    await page.screenshot({ path: path.join(OUT, '1-month.png') });

    /* the calendar's Copilot still answers in Home's panel: Ask me first, its chips */
    ok('6 the panel carries the calendar\'s own controls', await page.evaluate(() =>
      !!document.querySelector('#ig-dock #cal-plan-level') && !!document.querySelector('#ig-dock [data-cal-plan-q="week"]') && !!document.querySelector('#ig-dock #cal-plan-in')));

    await page.click('[data-cal-view="week"]');
    ok('7 Week works on the tab', await until(page, () => !!document.querySelector('#hb-cal .cal-wk-card')));
    await page.click('[data-cal-view="horizon"]');
    ok('8 Horizon works on the tab', await until(page, () => !!document.querySelector('#hb-cal .cal-stage.is-hz')));
    await page.click('[data-cal-view="month"]');

    /* every door that still names the page lands on the tab */
    await page.evaluate(() => setView('register'));
    await until(page, () => state.view === 'register');
    await page.evaluate(() => setView('calendar'));
    ok('9 setView(\'calendar\') lands on Home\'s Calendar tab', await until(page, () => state.view === 'dashboard' && hbFace() === 'calendar' && !!document.querySelector('#hb-cal .cal-stage')));

    /* the other tabs are untouched, and leave the calendar's panel behind */
    await page.click('[data-hb-face="board"]');
    ok('10 Board comes back, and the calendar and its panel step aside', await until(page, () =>
      !document.getElementById('hb-board').hidden && document.getElementById('hb-cal').hidden && !document.querySelector('#ig-dock #cal-plan')));

    /* a refresh lands where it was */
    await page.click('[data-hb-face="calendar"]');
    await until(page, () => !!document.querySelector('#hb-cal .cal-stage'));
    await page.click('[data-cal-view="week"]');
    await until(page, () => !!document.querySelector('#hb-cal .cal-wk-card'));
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    ok('11 a refresh comes back to the Calendar tab, on the view it was on', await until(page, () =>
      window.state && state.view === 'dashboard' && window.hbFace && hbFace() === 'calendar' && !!document.querySelector('#hb-cal .cal-wk-card'), null, 15000));
    ok('12 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
