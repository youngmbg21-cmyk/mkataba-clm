/* THE NAV PANEL'S DOOR (owner, 29 Oct 2026: "on the top right of the screen next to the alerts sign, add a nav panel
   sign which when pressed you will open up the alerts panel but the landing would be the guide panel"):
     1 · the button stands just left of the bell, on the bar's line, at the three screens
     2 · a press opens the one panel on its Guide face; pressed again it closes
     3 · from Alerts (the bell) a press swaps the same panel to the Guide; the bell swaps it back
     4 · it says what it is ("Guide …") and whether the Guide is open (aria-expanded)
   At the parent (before this change) 1 fails: there is no #hdr-nav.
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
  navX: (document.getElementById('hdr-nav') || {}).getAttribute ? document.getElementById('hdr-nav').getAttribute('aria-expanded') : null });

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

      /* ---- 1 where it stands ---- */
      const at = await page.evaluate(() => { const n = document.getElementById('hdr-nav'), b = document.getElementById('hdr-notify'); if (!n || !b) return { nav: !!n };
        const r = e => e.getBoundingClientRect(), rn = r(n), rb = r(b);
        return { nav: true, left: rn.right <= rb.left + 1 && rb.left - rn.right < 16, line: Math.abs(rn.top - rb.top) < 3, next: n.nextElementSibling === b, w: Math.round(rn.width), sameSize: Math.round(rn.width) === Math.round(rb.width) && rn.width > 0, title: n.title }; });
      check(`${nm} 1 the nav panel's button stands just left of the bell, on its line`, at.nav && at.left && at.line && at.next && at.sameSize, at);
      if (!at.nav){ await page.close(); continue; }
      check(`${nm} 4 it says what it opens`, /^Guide/.test(at.title || ''), at.title);
      const bar = await page.$('#hdr-nav'); if (bar){ const box = await bar.boundingBox(); await page.screenshot({ path: path.join(OUT, `bar-${nm}.png`), clip: { x: Math.max(0, box.x - 260), y: 0, width: Math.min(W, 420), height: 52 } }); }

      if (nm === 'laptop-a'){
        /* ---- 2 opens on the Guide, closes on a second press ---- */
        await page.click('#hdr-nav');
        const open = await until(page, () => state.panelOpen && panelFace() === 'guide' && !!document.querySelector('#panel-body .gd'));
        const p1 = await page.evaluate(panelNow);
        check('2 a press opens the one panel on its Guide face, and says so', open && p1.navX === 'true', p1);
        await page.screenshot({ path: path.join(OUT, `guide-${nm}.png`) });
        await page.click('#hdr-nav');
        const shut = await until(page, () => !state.panelOpen);
        const p2 = await page.evaluate(panelNow);
        check('2b pressed again, it closes', shut && p2.navX === 'false', p2);

        /* ---- 3 from Alerts it swaps to the Guide ---- */
        await page.click('#hdr-notify');
        await until(page, () => state.panelOpen && panelFace() === 'alerts');
        await page.click('#hdr-nav');
        const swapped = await until(page, () => state.panelOpen && panelFace() === 'guide');
        check('3 from Alerts a press swaps the same panel to the Guide', swapped, await page.evaluate(panelNow));
        await page.click('#hdr-notify');
        const back = await until(page, () => state.panelOpen && panelFace() === 'alerts');
        const p3 = await page.evaluate(panelNow);
        check('3b the bell swaps it back to Alerts, and the nav button says the Guide is not showing', back && p3.navX === 'false', p3);
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
