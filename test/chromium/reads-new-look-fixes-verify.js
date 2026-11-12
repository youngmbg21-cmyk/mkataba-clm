/* READS IN THE NEW LOOK: TWO FAULTS THE OWNER MET (6 Nov 2026)
     1 · "Read N more" lands on the Contracts LIST and the read starts there. The new look's Contracts opens on its
         folders, where the list the read waits for never appeared, so the press did nothing but change the page
         (regFoldersShut, called by every door that asks for the list)
     2 · Folding Jambo's panel gives the page the room back: the page keeps only the folded strip's 46px, no grey gap
   At the parent both fail. Run: node test/chromium/reads-new-look-fixes-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedRound6, R6_IN_PAGE } = require('../round6-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati(); await seedRound6(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
  page.on('pageerror', e => console.log('PAGE ERROR', String(e).slice(0, 200)));
  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
  await until(page, () => typeof caGo === 'function' && typeof currentUser === 'function' && !!currentUser() && !!getContract('MK-A1'), null, 40000);
  await page.evaluate(R6_IN_PAGE).catch(e => console.log('world', String(e).slice(0, 200)));
  await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); caGo({ kind: 'go', place: 'reads' }); });

  /* 2 first (on Reads): fold the panel */
  try {
    const up = await until(page, () => !!document.querySelector('#ins-panel [data-rd-act="next"]') && !!document.querySelector('#ins-panel [data-jl-fold]'), null, 20000);
    const before = up ? await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('content-scroll')).marginRight)) : null;
    if (up) await page.click('#ins-panel [data-jl-fold]');
    const folded = await until(page, () => !!document.querySelector('#ins-panel.is-folded'), null, 8000);
    await page.waitForTimeout(300);
    const S = await page.evaluate(() => ({ mr: parseFloat(getComputedStyle(document.getElementById('content-scroll')).marginRight), w: document.getElementById('rd-page').getBoundingClientRect().width, vw: innerWidth }));
    check('2 folding Jambo gives the page the room back: only the folded strip is kept', up && folded && before > 300 && S.mr === 46 && S.w >= S.vw - 46 - 1, { before, ...S });
    await page.click('#ins-panel [data-jl-fold], #ins-panel .jl-door').catch(() => {});
  } catch (e) { check('2 fold', false, String(e).slice(0, 200)); }

  /* 1 · Read N more */
  try {
    await page.evaluate(() => caGo({ kind: 'go', place: 'reads' }));
    /* RE-POINTED (owner, 8 Nov 2026, the Reads & Contracts drawing): Read the other N is the chosen question's, in the panel */
    /* the press waits for the Discover page itself: while the panel is folded the window is too narrow for list and
       panel, and the old Reads page (whose Read N more goes to Contracts) stands for a moment */
    await until(page, () => !!document.querySelector('#rd-page.dsc-page #ins-panel:not(.is-folded) [data-rd-act="next"]'), null, 15000);
    await page.click('#rd-page.dsc-page #ins-panel [data-rd-act="next"]');
    /* RE-POINTED (owner, 12 Nov 2026, Discover): the read runs on this page, never by way of Contracts */
    const read = await until(page, () => !!document.querySelector('#rd-page.dsc-page tr.is-live') || !document.querySelector('#ins-panel [data-rd-act="next"]'), null, 15000);
    const list = await page.evaluate(() => state.view === 'reads' && !!document.querySelector('#rd-page.dsc-page'));
    check('1 Read N more reads here, on the Discover page (the page never leaves for Contracts)', list && read, { list, read });
  } catch (e) { check('1 read more', false, String(e).slice(0, 200)); }

  await browser.close(); await h.stop();
  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
