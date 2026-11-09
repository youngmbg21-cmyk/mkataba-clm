/* Chromium verification: HISTORY AND PAY IN THE MIDDLE, THE STRIP GONE (owner, 9 Nov 2026: "delete this page").
   =====================================================================
   The Lifeline strip — a contract's card brought up on the Board — is gone. What it alone hosted on a computer
   moved to the middle beside the paper, like Where we are: History (pd2HistOpen, the one builder roomPaintHistory)
   and the pay editor (pd2PayOpen, bsPaintPay). Driven in a real browser, the sample book, the new look on:
     1  the Dossier's History row opens History in the middle: the trail is there, "‹ Paper" is the way back,
        the Board draws no card and nothing scrolls sideways
     2  hbStripBring(id, 'hist') — the old door every caller presses — lands there too; pressed again it closes
     3  payEditOpen opens the pay editor in the middle with its table and boxes; Cancel leaves the table at rest;
        "‹ Paper" closes it
     4  the Board is the Board: no strip, no card, the Board's own cards only
     5  the owner's three screens: the middle page level with the panel, nothing sideways
   RED AT THE PARENT (3ef3596): pd2HistOpen and pd2PayOpen did not exist; History and pay opened on the strip.
   Run: node test/chromium/history-and-pay-in-the-middle-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'history-and-pay-in-the-middle');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, arg, ms = 10000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(async () => { if (typeof stPrefSet === 'function') await stPrefSet('newLook', true); if (typeof newLookApply === 'function') newLookApply(); });
    await page.waitForTimeout(600);
    const id = await page.evaluate(() => { const c = state.contracts.find(c => c.status === 'Under Review') || state.contracts[0]; return c.id; });
    const onPaper = async () => { await page.evaluate(x => pdOpenOnHome(x, 'copilot'), id); return waitFor(page, () => !!document.getElementById('ig-paper') && !!document.getElementById('pd-glance')); };
    const sideways = () => page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1 || [...document.querySelectorAll('#content, #modal-root [data-dlg-page]')].some(el => el.scrollWidth > el.clientWidth + 1));

    /* 1 — the Dossier's History row */
    check('1 (stage) the paper with its Dossier is up', await onPaper());
    /* the Dossier's History door: the new look's "history" chip under the panel, else the Dossier row */
    const row = await page.evaluateHandle(() => [...document.querySelectorAll('#ig-dock [data-ca-chip], #ig-dock [data-ig-chips] button, #ig-dock [data-ig-chips] a')].find(b => /^(history|historik)$/i.test((b.textContent || '').trim())) || document.querySelector('#ig-dock [data-pd-ds-page="hist"]'));
    const hasRow = await row.evaluate(el => !!el);
    check('1a the Dossier carries its History door', hasRow);
    if (hasRow) { await row.asElement().click(); }
    const up = await waitFor(page, () => !!document.querySelector('#pd2-hist .hist-trail, #pd2-hist .hist-tools, #pd2-hist table'), 12000);
    check('1b History opens in the middle with the trail drawn', up, JSON.stringify(await page.evaluate(() => ({ hist: !!document.getElementById('pd2-hist'), mid: (document.querySelector('[data-pd-mid]') || {}).getAttribute && document.querySelector('[data-pd-mid]').getAttribute('data-pd-mid') }))));
    check('1c the Board draws no strip and no card', await page.evaluate(() => !document.querySelector('.bs-strip, #hb-board [data-bs-id]')));
    check('1d nothing scrolls sideways', !(await sideways()));
    await page.screenshot({ path: path.join(OUT, 'history-1440x780.png') });
    const back = await page.$('#modal-root [data-pd-mid-back]');
    check('1e "‹ Paper" is the way back', !!back);
    if (back) await back.click();
    check('1f pressed, the middle gives the paper back', await waitFor(page, () => !document.getElementById('pd2-hist') && !!document.getElementById('ig-paper')));

    /* 2 — the old door */
    const r2 = await page.evaluate(x => hbStripBring(x, 'hist'), id);
    check('2a hbStripBring(id, "hist") answers true', r2 === true, String(r2));
    check('2b …and History stands in the middle', await waitFor(page, () => !!document.querySelector('#pd2-hist .hist-trail, #pd2-hist table, #pd2-hist .hist-tools'), 12000));
    await page.evaluate(x => hbStripBring(x, 'hist'), id);
    check('2c pressed again, it closes', await waitFor(page, () => !document.getElementById('pd2-hist')));

    /* 3 — pay */
    const may = await page.evaluate(x => { const c = getContract(x); return typeof bsPayMay === 'function' && bsPayMay(c); }, id);
    if (may) {
      const r3 = await page.evaluate(x => payEditOpen(x), id);
      check('3a payEditOpen answers true', r3 === true, String(r3));
      check('3b the pay editor stands in the middle with its boxes', await waitFor(page, () => !!document.querySelector('.pd2-pay .bs-pay-ed [data-bs-pay-f="amount"]'), 12000));
      check('3c its amount box takes the focus', await waitFor(page, () => !!document.activeElement && document.activeElement.getAttribute('data-bs-pay-f') === 'amount', null, 3000));
      await pause(600); /* the page's fade-in has ended: the picture is the page, not its arrival */
      await page.screenshot({ path: path.join(OUT, 'pay-1440x780.png') });
      const cancel = await page.$('.pd2-pay [data-bs-pay-cancel]'); if (cancel) await cancel.click();
      check('3d Cancel leaves the table at rest, the page still up', await waitFor(page, () => !!document.querySelector('.pd2-pay') && !document.querySelector('.pd2-pay .bs-pay-ed') && !!document.querySelector('.pd2-pay [data-bs-pay-edit], .pd2-pay .bs-pay-say, .pd2-pay .bs-pay-t')));
      const back3 = await page.$('#modal-root [data-pd-mid-back]'); if (back3) await back3.click();
      check('3e "‹ Paper" closes it', await waitFor(page, () => !document.querySelector('.pd2-pay')));
    } else check('3 (skipped) this contract\'s pay may not be edited', true);

    /* 4 — the Board */
    await page.evaluate(() => { setView('dashboard'); if (typeof hbSetFace === 'function') hbSetFace('board'); });
    await waitFor(page, () => !!document.querySelector('#hb-board .hb-card'));
    await pause(500);
    check('4 the Board is the Board: its own cards, no strip', await page.evaluate(() => !!document.querySelector('#hb-board .hb-card') && !document.querySelector('.bs-strip, .bs-strips, [data-bs-id]')));

    /* 5 — three screens */
    for (const [w, hh] of SCREENS) {
      await page.setViewportSize({ width: w, height: hh });
      await onPaper(); await page.evaluate(x => hbStripBring(x, 'hist'), id);
      const ok = await waitFor(page, () => !!document.querySelector('#pd2-hist .hist-trail, #pd2-hist table, #pd2-hist .hist-tools'), 12000);
      await pause(400);
      const m = await page.evaluate(() => { const pg = document.querySelector('#modal-root [data-dlg-page]'), dock = document.getElementById('ig-dock');
        if (!pg || !dock) return null; const a = pg.getBoundingClientRect(), b = dock.getBoundingClientRect(); return { top: Math.round(a.top - b.top), right: Math.round(b.left - a.right), h: Math.round(a.height) }; });
      check(`5 ${w}×${hh}: History in the middle, level with the panel, nothing sideways`, ok && m && Math.abs(m.top) <= 2 && m.right >= -1 && m.right <= 24 && !(await sideways()), JSON.stringify(m));
      await page.screenshot({ path: path.join(OUT, `history-${w}x${hh}.png`) });
      await page.evaluate(x => hbStripBring(x, 'hist'), id); await pause(200);
    }
    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed — shots in ${OUT}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
