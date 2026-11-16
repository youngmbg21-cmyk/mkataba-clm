/* THE COVER (owner picked "Margin Notes", 16 Nov 2026; f1085). At the owner's three screens, in the new look:
     1 · a contract opened from the Contracts list lands on its Cover: the sheet with its parties, the headline, the six
         stages, ONE count, Lately and Coming up, Open the dossier the largest button, nothing scrolls sideways or past the
         window's foot
     2 · Open the dossier puts it away: the paper with its Dossier beside it, as before
     3 · a door to a job inside the contract (its Redlines face) skips the Cover
     4 · our "Where the deal stands" door opens the Cover (pd2StandsOpen)
   At the parent 1, 2 and 4 fail: there is no Cover.
   Run: node test/chromium/the-cover-verify.js   (pictures: COVER_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.COVER_SHOTS || '';
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + JSON.stringify(more) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  if (OUT) fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati(); await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [nm, W, H] of [['laptop-a', 1440, 780], ['laptop-b', 1536, 730], ['ipad', 1366, 950]]){
      const page = await browser.newPage({ viewport: { width: W, height: H } });
      page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 300)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      const ready = await until(page, () => typeof regOpenContract === 'function' && typeof currentUser === 'function' && !!currentUser() && (state.contracts || []).length > 2, null, 40000);
      check(`${nm} 0 signed in, the book loaded`, ready);
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
      const id = await page.evaluate(() => { const c = (state.contracts || []).find(x => x && x.status === 'Under Review') || state.contracts[0]; return c.id; });
      await page.evaluate(() => setView('register'));
      await page.evaluate(id => regOpenContract(id), id);
      const up = await until(page, id => !!document.querySelector(`#modal-root .cv-page[data-cv="${id}"]`), id, 15000);
      const m = await page.evaluate(() => {
        const pg = document.querySelector('.cv-page'); if (!pg) return null;
        const btn = pg.querySelector('.cv-open'), r = btn && btn.getBoundingClientRect();
        const body = pg.closest('.dlg-pg-body');
        const biggest = [...pg.querySelectorAll('button')].every(b => b === btn || b.getBoundingClientRect().height <= r.height);
        return { parties: pg.querySelectorAll('.cv-p').length, head: (pg.querySelector('.cv-h') || {}).textContent || '', stages: pg.querySelectorAll('.cv-st').length,
          counts: pg.querySelectorAll('.cv-count').length, more: pg.querySelectorAll('.cv-more .cv-lbl').length, notes: pg.querySelectorAll('.cv-note').length,
          btnIn: !!(r && r.bottom <= innerHeight && r.top >= 0), biggest, sideways: document.documentElement.scrollWidth - innerWidth,
          spill: body ? body.scrollHeight - body.clientHeight : null };
      });
      check(`${nm} 1 the contract opens on its Cover: parties, headline, six stages, ONE count, Lately and Coming up, the big button in sight, nothing spills`,
        up && m && m.parties >= 2 && m.head.length > 3 && m.stages === 6 && m.counts === 1 && m.more === 2 && m.notes <= 3 && m.btnIn && m.biggest && m.sideways <= 0 && m.spill <= 1, m);
      if (OUT) await page.screenshot({ path: path.join(OUT, `${nm}-cover.png`) });
      if (up) await page.click('.cv-open');
      const back = await until(page, id => !document.querySelector('.cv-page') && typeof pdContract === 'function' && pdContract() && pdContract().id === id && !!document.querySelector('#ig-dock'), id, 8000);
      check(`${nm} 2 Open the dossier: the paper with its Dossier beside it`, back);
      /* 3 · a job door: the contract's Redlines face */
      await page.evaluate(() => setView('register')); await page.waitForTimeout(400);
      await page.evaluate(id => pdRedOpen(id), id);
      await page.waitForTimeout(1500);
      const skipped = await page.evaluate(() => !document.querySelector('.cv-page'));
      check(`${nm} 3 a door to a job inside the contract skips the Cover`, skipped);
      /* 4 · Where the deal stands opens the Cover */
      const st = await page.evaluate(id => { try { return pd2StandsOpen(id); } catch (e){ return String(e); } }, id);
      const cov = await until(page, () => !!document.querySelector('.cv-page'), null, 6000);
      check(`${nm} 4 "Where the deal stands" opens the Cover`, st === true && cov, st);
      await page.close();
    }
  } finally { await browser.close(); await h.stop?.(); }
  console.log(fails ? `${fails} FAILED` : 'ALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
