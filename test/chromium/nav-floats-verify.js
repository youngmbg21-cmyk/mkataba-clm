/* Chromium verification: BELOW THE LINE THE SIDEBAR FLOATS INSTEAD OF PUSHING.
   ============================================================
   Owner's ask, 13 Aug 2026, reported from a ThinkPad: "anytime I expand the
   nav panel the squeeze significantly impacts how the pages look like."

   THE WIDTHS AND THE COLUMN'S SIZE ARE READ FROM THE APP, NEVER TYPED HERE
   (24 Aug 2026). This file used to name 1280 / 1366 / 1440 as "below the line"
   and 256 as the open column. Both moved with the enterprise design — the line
   to 1280 and the column to 240 — and every one of those literals then
   reported a fault that did not exist. The claims were always RELATIONS: below
   the line it floats and the page does not move, above it the column pushes.
   They are written as relations now, so the next time either number moves this
   file costs nothing.

   It did. Expanding the sidebar cost the page 192px (256 against the 64px
   rail) and NOTHING adapted, because every layout rule in this product
   measures the WINDOW while the page gets the window minus the sidebar. So
   opening the nav shrank the page by a fifth and the layout carried on.

   Below the line the sidebar is a fixed 64px strip with a 64px track held
   under it, and opening it widens the strip OVER the page. Above it nothing
   changed: it is the reader's own remembered choice and it still pushes.

   WHY THIS IS A BROWSER FILE. Every claim here is a MEASUREMENT — the content
   box before and after a real press, the sidebar's resolved `position`, the
   chevron the reader is actually shown. jsdom resolves no media queries and no
   class rules, so it can answer none of them.

   Also in here: the two header buttons on Insights. They were disabled there,
   and the reason (two right-hand COLUMNS fighting for width) stopped being
   true when the panel became a layer. Same journey, same shell.

   Screenshots go to test/chromium/shots/nav/.
   Run: node test/chromium/nav-floats-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'nav');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* One reading, taken the same way every time. The content box is the claim:
   if it does not move, the page did not move. */
const READ = `(() => {
  const b = el => { if (!el) return null; const r = el.getBoundingClientRect();
    return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]; };
  const shell = document.getElementById('app-shell');
  const nav = document.getElementById('side-nav');
  return {
    cols: shell.style.gridTemplateColumns,
    nav: b(nav), navOpen: nav.classList.contains('open'),
    navPos: getComputedStyle(nav).position,
    content: b(document.getElementById('content-scroll')),
    scrim: !(document.getElementById('nav-scrim') || {}).hidden,
    chev: (document.querySelector('#cmd-rail .rail-chev') || {}).getAttribute
      ? document.querySelector('#cmd-rail .rail-chev').getAttribute('d') : '',
    /* NOTHING IN THE STRIP MAY PAINT OUTSIDE IT — the language toggle is
       posted in here below 900 and used to overflow it by 34px. */
    spill: nav.scrollWidth - nav.clientWidth,
    bellOff: document.getElementById('hdr-notify').disabled,
    panOff: document.getElementById('cmd-panel').disabled,
    dot: !(document.getElementById('hdr-notify-dot') || {}).hidden
  };
})()`;

const RAIL_KEY = 'hati.v1.railCollapsed';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    /* THE WIDTHS STRADDLE THE LINE, THEY DO NOT NAME IT. 800 is inside the old
       899 drawer breakpoint, where the language toggle moves into the sidebar;
       the rest are derived from NAV_DRAWER_W so this file follows the line
       rather than having to be edited whenever it moves. */
    const probe = await browser.newPage();
    await probe.goto(h.base + '/', { waitUntil: 'networkidle' });
    const LINE = await probe.evaluate(() => window.NAV_DRAWER_W);
    const NAVW = await probe.evaluate(() =>
      parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-w'), 10));
    await probe.close();
    console.log(`the line is ${LINE}px and the open column is ${NAVW}px`);
    for (const vp of [{ width: 800, height: 700 }, { width: LINE - 220, height: 800 },
                      { width: LINE - 120, height: 768 }, { width: LINE - 1, height: 900 },
                      { width: LINE + 32, height: 945 }, { width: 1920, height: 1080 }]) {
      const page = await (await browser.newContext({ viewport: vp })).newPage();
      page.on('pageerror', e => errors.push(`${vp.width}: ${e.message}`));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(400);
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await page.waitForTimeout(2400);

      const w = vp.width;
      console.log(`\n--- ${w} x ${vp.height} ---`);
      const rest = await page.evaluate(READ);
      const below = w < LINE;

      /* THE REST STATE SPLITS AT THE LINE (claim reversed in place, 20 Aug
         2026, owner-approved SAP treatment): ABOVE it the default is now the
         OPEN 256px column with its words — the render the owner approved —
         while BELOW it navDrawerActive() still wins and the strip rests as
         the 64px rail exactly as before. A stored choice still beats both. */
      check(`${w}: it rests as ${below ? 'the 64px rail' : 'the open ' + NAVW + 'px column'}`,
        rest.nav[2] === (below ? 64 : NAVW), `${rest.nav[2]}px`);
      check(`${w}: nothing in the strip paints outside it`, rest.spill === 0, `${rest.spill}px over`);

      if (below) {
        check(`${w}: below the line it is a floating layer, not a column`,
          rest.navPos === 'fixed', rest.navPos);
        /* ...AND A 64px TRACK IS STILL HELD UNDER IT, so the icons never lie
           over the page they are beside. */
        check(`${w}: with a 64px track held under it`,
          /^64px/.test(rest.cols) && rest.content[0] === 64, `${rest.cols} · page at x${rest.content[0]}`);

        await page.click('#cmd-rail');
        await page.waitForTimeout(450);
        const open = await page.evaluate(READ);
        check(`${w}: pressing the chevron widens it to the full ${NAVW}`,
          open.nav[2] === NAVW && open.navOpen, `${open.nav[2]}px`);
        /* THE CLAIM THE WHOLE THING EXISTS FOR. */
        check(`${w}: AND THE PAGE DOES NOT MOVE`,
          open.content.join() === rest.content.join(),
          `${rest.content.join(',')} → ${open.content.join(',')}`);
        check(`${w}: a scrim gives a way out that is not the button that opened it`, open.scrim);
        /* THE DOOR SAYS WHICH WAY IT GOES — it used to be painted off the
           rail's LOOK, which is on down here whatever happens, so it offered
           to show labels that were already showing. */
        check(`${w}: and its chevron now offers to close, not to open again`,
          /^M14\.5/.test(open.chev), open.chev);
        /* READ, NEVER WRITTEN: flipping a preference the width is not
           honouring would silently change what they get on a big screen. */
        const pref = await page.evaluate(k => localStorage.getItem(k), RAIL_KEY);
        check(`${w}: it leaves the stored preference alone`, pref === null, `stored ${JSON.stringify(pref)}`);

        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        const shut = await page.evaluate(READ);
        check(`${w}: Escape closes it and the page still has not moved`,
          !shut.navOpen && shut.content.join() === rest.content.join(), shut.content.join(','));
      } else {
        /* ABOVE THE LINE the column still pushes and still remembers — the
           mechanics are untouched; only the DEFAULT flipped to open (claims
           reversed in place, 20 Aug 2026). So the first press now COLLAPSES
           to the 64px rail, the page takes the width back, and the collapse
           is what gets stored. */
        check(`${w}: above the line it is still a column`, rest.navPos !== 'fixed', rest.navPos);
        await page.click('#cmd-rail');
        await page.waitForTimeout(450);
        const rail = await page.evaluate(READ);
        check(`${w}: collapsing it gives the 64px rail`, rail.nav[2] === 64, `${rail.nav[2]}px`);
        check(`${w}: and up here it PUSHES the page, exactly as it always did`,
          /* THE GAIN IS THE COLUMN MINUS THE RAIL, not a typed 192 — that
             number was 256-64 and stopped being true the day the column
             became 240. The relation is what the claim is about. */
          rail.content[0] === 64 && rail.content[2] === rest.content[2] + (NAVW - 64),
          `${rest.content.join(',')} → ${rail.content.join(',')}`);
        check(`${w}: no scrim — a column is not a layer`, !rail.scrim);
        const kept = await page.evaluate(k => localStorage.getItem(k), RAIL_KEY);
        check(`${w}: and the choice is remembered`, kept === '1', `stored ${JSON.stringify(kept)}`);
        await page.click('#cmd-rail');
        await page.waitForTimeout(450);
      }

      /* INSIGHTS WORKS LIKE EVERY OTHER PAGE. Reported in the same breath as
         the nav: both header buttons were disabled there, and the badge went
         with them, so a reader could not see what was waiting on them. */
      await page.evaluate(() => setView('intel'));
      await page.waitForTimeout(1400);
      const intel = await page.evaluate(READ);
      check(`${w}: on Insights both header buttons are live`,
        !intel.bellOff && !intel.panOff, `bell off=${intel.bellOff} activity off=${intel.panOff}`);
      const opened = await page.evaluate(async () => {
        document.getElementById('hdr-notify').click();
        await new Promise(r => setTimeout(r, 500));
        const el = document.getElementById('context-panel');
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), on: r.left < innerWidth && getComputedStyle(el).visibility !== 'hidden' };
      });
      check(`${w}: and the alerts panel opens over it`, opened.on, `at x${opened.x}`);

      if (w === 1366) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        /* ---- TWO OWNER REPORTS OF 19 Aug 2026, BOTH ABOUT WHERE THINGS SIT,
           and both only answerable with a laid-out page ----
           "Move requests to under Templates" (the door was under
           Administration, a fold that starts shut, while its own comment said
           it belonged in the everyday group), and "space is needed between the
           content and the edge of the page to look more professional" (the
           Requests page drew at padding:0, flush against the sidebar).

           The margin is measured AGAINST ANOTHER PAGE rather than against a
           number: what was wrong was that this page did not sit where every
           other page sits. */
        const doors = await page.evaluate(() => {
          const y = sel => { const b = document.querySelector(sel);
            return b ? Math.round(b.getBoundingClientRect().top) : null; };
          /* WHICH SECTION it is in is asked of the DOM, not of the geometry:
             the Administration fold starts shut, so everything inside it
             measures at y=0 and a position comparison would pass for the wrong
             reason. */
          const sec = document.querySelector('[data-view="intake"]')?.closest('.nav-section');
          return { templates: y('[data-view="templates"]'), intake: y('[data-view="intake"]'),
            people: y('[data-view="directory"]'),
            section: sec ? sec.getAttribute('data-section') : null };
        });
        check(`${w}: Requests sits under Templates, in the everyday group`,
          doors.section === 'work' && doors.intake != null && doors.templates != null
          && doors.templates < doors.intake && doors.intake < doors.people,
          JSON.stringify(doors));
        const edge = async view => {
          await page.evaluate(v => setView(v), view);
          await page.waitForTimeout(900);
          return page.evaluate(() => {
            const el = document.querySelector('#content .view-enter > *');
            return el ? Math.round(el.getBoundingClientRect().left) : null;
          });
        };
        const tplEdge = await edge('templates');
        const ikEdge = await edge('intake');
        check(`${w}: and its content starts where every other page's does`,
          ikEdge != null && tplEdge != null && Math.abs(ikEdge - tplEdge) <= 1,
          `Requests at x${ikEdge} · Templates at x${tplEdge}`);
        await page.screenshot({ path: path.join(OUT, 'requests-1366.png') });
        await page.evaluate(() => setView('dashboard'));
        await page.waitForTimeout(900);
        await page.screenshot({ path: path.join(OUT, 'rest-1366.png') });
        await page.click('#cmd-rail');
        await page.waitForTimeout(500);
        await page.screenshot({ path: path.join(OUT, 'open-1366.png') });
      }
      await page.close();
    }
    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  if (bad) process.exit(1);
})();
