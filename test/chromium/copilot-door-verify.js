/* Chromium verification: THE WAY BACK TO COPILOT IS A DOOR YOU CAN SEE
   (Young, 8 Oct 2026: "when in this view … there is no clear door to going to
   the view" with the Copilot panel open)
   ============================================================
   An enlarged Board card used to hide the whole Copilot panel, door and all,
   and the folded panel was a faint 9px sideways word. Now:

     1  folded, the panel is a tinted door that says "Ask Copilot", painted
        where a press lands
     2  an enlarged card FOLDS the panel to that door instead of hiding it
     3  pressing the door makes the card small again and opens the panel,
        ask box ready
     4  an open panel folds while a card is big and opens again when it is
        made small
*/
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'copilot-door');
const EXEC = process.env.CHROMIUM_BIN
  || ['/opt/pw-browsers/chromium', '/usr/bin/chromium', '/usr/bin/chromium-browser'].find(p => { try { return fs.existsSync(p); } catch (_) { return false; } });

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) pass++; else fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + String(detail).slice(0, 220) : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1600, height: 950 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = (fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true).catch(() => false);
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(() => !!window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => setView('dashboard'));
    await until(() => !!document.querySelector('#hb-board .hb-fig') && !!document.getElementById('ig-dock'));

    const door = () => page.evaluate(() => {
      const d = document.getElementById('ig-dock'); const b = document.getElementById('igd-expand');
      if (!d || !b) return { there: false, dock: d ? getComputedStyle(d).display : 'none' };
      const r = b.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(80, r.height / 2));
      return { there: true, dock: getComputedStyle(d).display, w: Math.round(d.getBoundingClientRect().width), h: Math.round(r.height),
        label: b.textContent.trim(), hit: !!(at && b.contains(at)), bg: getComputedStyle(b).backgroundColor,
        size: parseFloat(getComputedStyle(b.querySelector('.igd-door-w') || b).fontSize) };
    });

    /* ===== 1. FOLDED, IT IS A DOOR ===== */
    await page.evaluate(() => { intel.dockOpen = false; renderIntelDock(); igSyncDockWidth(); });
    await until(() => Math.round(document.getElementById('ig-dock').getBoundingClientRect().width) === 46, null, 4000);   // the dock slides
    const d1 = await door();
    check('1 folded, the panel is a door that says "Ask Copilot"', d1.there && d1.label === 'Ask Copilot', JSON.stringify(d1));
    check('1b painted where a press lands, tinted, words at a readable size', d1.hit && d1.bg !== 'rgba(0, 0, 0, 0)' && d1.size >= 12, JSON.stringify(d1));
    check('1c it keeps the folded width, so the board does not move', d1.w === 46, String(d1.w));

    /* ===== 2. AN ENLARGED CARD KEEPS THE DOOR ===== */
    await page.evaluate(() => { intel.dockOpen = true; renderIntelDock(); igSyncDockWidth(); });
    await page.click('#hb-board .hb-fig');
    await until(() => !!document.querySelector('#hb-focus .hb-bigbtn'));
    await page.click('#hb-focus .hb-bigbtn');
    await until(() => !!document.querySelector('.hb-dig-big') && Math.round(document.getElementById('ig-dock').getBoundingClientRect().width) === 46, null, 4000);
    const d2 = await door();
    check('2 a big card folds the panel to its door — it is not hidden', d2.there && d2.dock !== 'none' && d2.hit && d2.w === 46, JSON.stringify(d2));
    await page.screenshot({ path: path.join(OUT, '01-big-with-door.png') });

    /* ===== 3. THE DOOR OPENS THE PANEL BESIDE THE BOARD ===== */
    await page.click('#igd-expand');
    const opened = await until(() => !document.querySelector('.hb-dig-big') && intel.dockOpen && !!document.getElementById('igd-input'));
    check('3 pressed, the card is made small and the panel opens with its ask box', opened,
      JSON.stringify(await page.evaluate(() => ({ big: !!document.querySelector('.hb-dig-big'), open: intel.dockOpen }))));

    /* ===== 4. OPEN, BIG, SMALL ===== */
    await page.click('#hb-focus .hb-bigbtn');
    const folded = await until(() => !!document.querySelector('.hb-dig-big') && !intel.dockOpen && !!document.getElementById('igd-expand'));
    check('4 an open panel folds to its door while a card is big', folded);
    await page.click('#hb-focus .hb-bigbtn.is-big');
    const back = await until(() => !document.querySelector('.hb-dig-big') && intel.dockOpen);
    check('4b and opens again when the card is made small', back);
    check('9 no page errors', !errors.length, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass}/${pass + fail} passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
