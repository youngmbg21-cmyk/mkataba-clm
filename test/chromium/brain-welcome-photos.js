/* BRAIN WELCOME — THE THREE SCREENS (CLAUDE.md: every visual change is photographed at 1440×780, 1536×730 and
   1366×950 in the new look, a fit check at each). Not a test: it lands on the Board, waits for the brain card in
   Jambo's Overview, measures that nothing in his panel scrolls sideways or pokes out of the card, and saves one
   picture per screen to BRAIN_SHOTS (default test/chromium/shots/brain-welcome). Exits 1 when a fit check fails.
   Run: node test/chromium/brain-welcome-photos.js */
/* global state, stPrefSet, newLookApply, setView, hbSetFace */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedDiscoverWorld } = require('../discover-world');

const OUT = process.env.BRAIN_SHOTS || path.join(__dirname, 'shots', 'brain-welcome');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
const until = async (page, fn, arg, ms = 10000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedDiscoverWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  let bad = 0;
  try {
    for (const [wd, ht] of SCREENS) {
      const page = await browser.newPage({ viewport: { width: wd, height: ht }, deviceScaleFactor: 2 });
      const errs = []; page.on('pageerror', e => errs.push(String(e)));
      const tag = `${wd}x${ht}`;
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 11 && typeof window.hbSetFace === 'function', null, 20000);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); setView('dashboard'); hbSetFace('board'); });
      const up = await until(page, () => { const cv = document.querySelector('#ig-dock canvas[data-hb-brain-cv]'); return !!(cv && cv._igDrawn && cv.width > 0); });
      const m = await page.evaluate(() => {
        const dock = document.querySelector('#ig-dock'), w = document.querySelector('#ig-dock .hb-jb-hello'), card = document.querySelector('#ig-dock .hbw-brain');
        if (!dock || !w || !card) return null;
        const cr = card.getBoundingClientRect(), wr = w.getBoundingClientRect();
        const out = [...w.querySelectorAll('.hbw-n, .hbw-acts > *, .jov-lnk, .hbw-ctl')].filter(e => { const r = e.getBoundingClientRect(); return r.right > wr.right + 1 || r.left < wr.left - 1; }).length;
        return { side: dock.scrollWidth - dock.clientWidth, page: document.documentElement.scrollWidth - window.innerWidth, cardW: Math.round(cr.width), cardH: Math.round(cr.height), out,
          say: (w.querySelector('.hbw-say') || {}).textContent || '' };
      });
      const ok = up && m && m.side <= 1 && m.page <= 0 && m.out === 0 && !errs.length;
      if (!ok) bad++;
      console.log(`${ok ? 'FITS' : 'FAILS'}  ${tag}  ${JSON.stringify(m)}  ${errs.join(' | ')}`);
      await page.screenshot({ path: path.join(OUT, `${tag}-board.png`) });
      const dock = await page.$('#ig-dock'); if (dock) await dock.screenshot({ path: path.join(OUT, `${tag}-panel.png`) });
      await page.close();
    }
  } finally { await browser.close(); await h.stop(); }
  process.exit(bad ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
