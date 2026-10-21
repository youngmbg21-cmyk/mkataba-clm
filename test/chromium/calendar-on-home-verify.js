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
    /* RE-POINTED 17 Oct 2026 (the owner picked "Desk tabs", Round 2): Home's faces are
       no longer a pill in its head on a computer — each is a page Jambo opens and a
       tab on the desk — so the faces are read off Home's own list (HB_FACES) */
    await until(page, () => typeof HB_FACES !== 'undefined' && !document.body.classList.contains('pre-auth'), null, 10000);
    const tabs = await page.evaluate(() => HB_FACES.slice());
    ok('1 Home\'s faces are Board · Document · Calendar · Explorer', tabs.join(',') === 'board,paper,calendar,explorer', tabs.join(','));
    ok('2 the menu has no Calendar row', await page.evaluate(() => !document.querySelector('#side-nav [data-view="calendar"]')));

    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'calendar');
    const up = await until(page, () => !!document.querySelector('#hb-cal .cal-stage'));
    const at = await page.evaluate(() => {
      const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
      return { view: state.view, inStage: !!document.querySelector('#cal-stage #cal-plan'),
        inDock: vis(document.querySelector('#ig-dock #cal-plan')), panels: document.querySelectorAll('#cal-plan').length,
        homeCopilot: vis(document.getElementById('igd-feed')), cal: vis(document.getElementById('hb-cal')),
        board: vis(document.getElementById('hb-board')), head: !!document.querySelector('#hb-cal .cal-head'),
        more: !!document.querySelector('#hb-cal .cal-bar1 #cal-more'), moreHead: !!document.querySelector('#hb-cal .cal-head #cal-more'),
        nav: (document.querySelector('#side-nav .nav-item.active, #side-nav [aria-current="page"]') || {}).getAttribute?.('data-view') || null };
    });
    ok('3 the Calendar tab draws the calendar on Home', up && at.view === 'dashboard' && at.cal && !at.board, JSON.stringify(at));
    ok('4 ONE Copilot panel: the calendar\'s own, in Home\'s panel, none beside the calendar',
      at.inDock && !at.inStage && at.panels === 1 && !at.homeCopilot);
    /* RE-POINTED 18 Oct 2026 (lane A4, round 16 as drawn): Home's own head is
       not drawn on a computer (main's "‹ · HA · the page's name"), so the
       calendar draws its head — its name, its six weeks, the views, the scope,
       New event and the ⋯ — on Home too */
    ok('5 the calendar draws its one head on Home, and the ⋯ stands in it', at.head && at.moreHead, JSON.stringify(at));
    await page.screenshot({ path: path.join(OUT, '1-month.png') });

    /* the calendar's Copilot still answers in Home's panel: Ask me first, its chips */
    ok('6 the panel carries the calendar\'s own controls', await page.evaluate(() =>
      /* round 16 as drawn: "Jambo may change my calendar" is three buttons (was a dropdown) */
      document.querySelectorAll('#ig-dock [data-cal-lv]').length === 3 && !!document.querySelector('#ig-dock [data-cal-plan-q="week"]') && !!document.querySelector('#ig-dock #cal-plan-in')));

    await page.click('[data-cal-view="week"]');
    ok('7 Week works on the tab', await until(page, () => !!document.querySelector('#hb-cal .cal-wk-card')));
    await page.click('[data-cal-view="horizon"]');
    ok('8 Horizon works on the tab', await until(page, () => !!document.querySelector('#hb-cal .cal-stage.is-hz')));
    await page.click('[data-cal-view="month"]');

    /* every door that still names the page lands on the tab */
    /* RE-POINTED 15 Oct 2026 (the overnight work order, step 7): Contracts is
       Home's own place now, so the page left first is Obligations */
    await page.evaluate(() => setView('obligations'));
    await until(page, () => state.view === 'obligations');
    await page.evaluate(() => setView('calendar'));
    ok('9 setView(\'calendar\') lands on Home\'s Calendar tab', await until(page, () => state.view === 'dashboard' && hbFace() === 'calendar' && !!document.querySelector('#hb-cal .cal-stage')));

    /* the other tabs are untouched, and leave the calendar's panel behind */
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'board');
    ok('10 Board comes back, and the calendar and its panel step aside', await until(page, () =>
      !document.getElementById('hb-board').hidden && document.getElementById('hb-cal').hidden && !document.querySelector('#ig-dock #cal-plan')));

    /* a refresh lands where it was */
    await page.evaluate(f => { if (state.view === 'dashboard' && document.getElementById('hb-head')) hbSetFace(f); else { hbS().face = f; hbSave(); setView('dashboard'); } }, 'calendar');
    await until(page, () => !!document.querySelector('#hb-cal .cal-stage'));
    await page.click('[data-cal-view="week"]');
    await until(page, () => !!document.querySelector('#hb-cal .cal-wk-card'));
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    ok('11 a refresh comes back to the Calendar tab, on the view it was on', await until(page, () =>
      window.state && state.view === 'dashboard' && window.hbFace && hbFace() === 'calendar' && !!document.querySelector('#hb-cal .cal-wk-card'), null, 15000));
    /* 11b THE HOURS STAY WHOLE on the owner's shortest screen (21 Oct 2026: at 1536×730 the last hour was a sliver) */
    for (const [w, hh] of [[1536, 730], [1440, 780], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh }); await page.waitForTimeout(400);
      const fit = await page.evaluate(() => { const b = document.getElementById('cal-wk-body'); if (!b) return null;
        const last = [...b.querySelectorAll('.cal-wk-t')].pop(); const br = b.getBoundingClientRect(), lr = last && last.getBoundingClientRect();
        return { cut: b.scrollHeight - b.clientHeight, lastIn: !!lr && lr.bottom <= br.bottom + 1 && lr.height > 20, side: document.documentElement.scrollWidth > innerWidth + 1 }; });
      ok(`11b ${w}x${hh}: this week's hours are whole, the last one in view, nothing sideways`, !!fit && fit.cut <= 1 && fit.lastIn && !fit.side, JSON.stringify(fit));
    }
    ok('12 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
