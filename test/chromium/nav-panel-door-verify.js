/* THE ONE PANEL BUTTON (owner picked "The SAP Way", 9 Nov 2026: "the bell symbol is obsolete because when you press it
   you get multiple options like guide, alerts, notes and activity"; RE-POINTED from the nav panel's door of 29 Oct 2026):
     1 · ONE button on the bar opens the side panel: the question mark and the clock are gone; it wears the panel's
         mark (#i-panel), not a bell, and says what it opens ("Side panel: …"), at the three screens
     2 · with something waiting it opens on Alerts and says so (aria-expanded); pressed again it closes
     3 · the panel's own tabs choose the face (Guide), and the button closes it from any face
   At the parent 1 fails: three buttons, a bell.
   Run: node test/chromium/nav-panel-door-verify.js   (pictures: NAV_DOOR_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.NAV_DOOR_SHOTS || path.join(__dirname, 'shots', 'nav-door');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const panelNow = () => ({ open: !!(window.state && state.panelOpen), face: typeof panelFace === 'function' ? panelFace() : null,
  navX: (document.getElementById('hdr-notify') || {}).getAttribute ? document.getElementById('hdr-notify').getAttribute('aria-expanded') : null });

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => { console.log('PAGE ERROR', String(e)); fails++; });
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 4 && typeof openPanel === 'function', null, 40000);
      await until(page, () => state.view === 'counter' || state.view === 'dashboard', null, 15000);
      /* the bar is drawn once the shell stands: wait for the bell to have its size */
      await until(page, () => { const b = document.getElementById('hdr-notify'); return !!b && b.getBoundingClientRect().width > 0; }, null, 15000);

      /* ---- 1 one button, the panel's mark ---- */
      /* the count is painted on a quiet moment (updateAlertBadge): wait for it to agree with what waits */
      await until(page, () => (alertCount() > 0) === !document.getElementById('hdr-notify-dot').hidden, null, 8000);
      const at = await page.evaluate(() => { const b = document.getElementById('hdr-notify'); if (!b) return { btn: false };
        const use = b.querySelector('svg use'); return { btn: true, gone: !document.getElementById('hdr-nav') && !document.getElementById('cmd-panel'),
          mark: use && use.getAttribute('href'), title: b.title || '', w: Math.round(b.getBoundingClientRect().width), n: alertCount(),
          dot: !document.getElementById('hdr-notify-dot').hidden }; });
      check(`${nm} 1 one panel button on the bar, the panel's mark, no question mark and no clock`, at.btn && at.gone && at.mark === '#i-panel' && at.w > 0, at);
      check(`${nm} 1b it says what it opens, and wears the count`, /^Side panel/.test(at.title) && (at.n > 0) === at.dot, at);
      const bar = await page.$('#hdr-notify'); if (bar){ const box = await bar.boundingBox(); await page.screenshot({ path: path.join(OUT, `bar-${nm}.png`), clip: { x: Math.max(0, box.x - 260), y: 0, width: Math.min(W, 420), height: 52 } }); }

      if (nm === 'laptop-a'){
        /* ---- 2 opens on Alerts with something waiting; closes on a second press ---- */
        await page.click('#hdr-notify');
        const open = await until(page, () => state.panelOpen && panelFace() === 'alerts');
        const p1 = await page.evaluate(panelNow);
        check('2 with something waiting, a press opens the panel on Alerts, and says so', open && p1.navX === 'true', p1);
        await page.screenshot({ path: path.join(OUT, `alerts-${nm}.png`) });
        await page.click('#hdr-notify');
        const shut = await until(page, () => !state.panelOpen);
        const p2 = await page.evaluate(panelNow);
        check('2b pressed again, it closes', shut && p2.navX === 'false', p2);

        /* ---- 3 the tabs choose; the button closes from any face ---- */
        await page.click('#hdr-notify');
        await until(page, () => state.panelOpen);
        await page.click('#context-panel [data-pt-face="guide"]');
        const guide = await until(page, () => state.panelOpen && panelFace() === 'guide' && !!document.querySelector('#panel-body .gd'));
        check('3 the panel\'s Guide tab turns it to the Guide', guide, await page.evaluate(panelNow));
        await page.click('#hdr-notify');
        const shut2 = await until(page, () => !state.panelOpen);
        check('3b the button closes it from the Guide too', shut2, await page.evaluate(panelNow));
      }
      await page.close();
    }
  } finally {
    await browser.close();
    if (h.stop) await h.stop();
  }
  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
