/* Chromium verification: THE BOARD WALK-THROUGH'S FIXES (owner, 15 Oct 2026)
   ============================================================
   From the analyst walk and the iPad walk, and the owner's iPad screenshot
   where the side list sat cut off behind Jambo's panel. On an iPad-sized
   page with touch presses:
     1  the side list is drawn outside the board, lies on top of Jambo's
        panel and the page head, and the tile that opened it puts it away
     2  "Our promises" opens eight, and Show more brings the rest
     3  the Week ahead pill counts its dates, not its one card
     4  the value tile names the currency it leaves out, on the tile
     5  the bell says each heading once
     6  the five tiles wrap 3 + 2 on a narrowed board, never 4 + 1
     7  an obligation the other side owes carries no "nobody owns this"
     8  late duties, one job each (owner, 16 Oct 2026): Our promises off the
        Board, the overdue figure says ours · theirs, Jambo opens its list
   AT THE PARENT 1, 2, 3, 4, 5, 6 and 7 FAIL. Waits ask for the state, bounded.
   Run: node test/chromium/board-walkthrough-fixes-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'board-walkthrough-fixes');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const check = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = (page, fn, ms = 8000, arg) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

/* twenty signed contracts, each with one late promise of ours and one of
   theirs; four in dollars (no rate set) */
const BOOK = FIXTURES.concat(Array.from({ length: 20 }, (_, i) => {
  const c = fixtureContract('MK-V' + i, 'Supply ' + i, 'Party ' + i, i % 2 ? 'proc' : 'sales', (i + 1) * 1e6, 'Signed');
  c.expiry = day(30 + i * 20);
  if (i % 5 === 0) c.metadata = { value: c.value, currency: 'USD' };
  c.obligations = [
    { id: 'ou' + i, desc: 'Monthly report', due: day(-3 - i), status: 'open', party: 'ours' },
    { id: 'ot' + i, desc: 'Pay invoice', due: day(-5 - i), status: 'open', party: 'theirs' },
    { id: 'ow' + i, desc: 'Site visit', due: day(1 + (i % 6)), status: 'open', party: 'ours' }];
  return c;
}));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1366, height: 950 }, hasTouch: true });
    const page = await ctx.newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, n => window.state && state.contracts && state.contracts.length >= n, 20000, BOOK.length);
    await page.evaluate(() => { setView('dashboard'); hbSetFace('board'); });
    await waitFor(page, () => !!document.querySelector('#hb-board [data-hb-dig="f:live"]'), 10000);

    /* 1 the side list */
    const tile = page.locator('#hb-board [data-hb-dig="f:live"]').first();
    await tile.tap();
    const opened = await waitFor(page, () => !!document.querySelector('.hb-sheet'), 6000);
    const geo = opened ? await page.evaluate(() => {
      const s = document.querySelector('.hb-sheet'), d = document.getElementById('ig-dock').getBoundingClientRect();
      const at = (x, y) => { const e = document.elementFromPoint(x, y); return !!(e && e.closest('.hb-sheet')); };
      return { outside: !s.closest('#hb-board'), overDock: at(d.left + 120, 320), overHead: at(innerWidth - 60, 70) };
    }) : null;
    check('1a the side list opens outside the board\'s scroller', !!geo && geo.outside, JSON.stringify(geo));
    check('1b it lies on top of Jambo\'s panel and the page head', !!geo && geo.overDock && geo.overHead, JSON.stringify(geo));
    await page.screenshot({ path: path.join(OUT, '1-side-list.png') });
    await tile.tap();
    check('1c the tile that opened it puts it away', await waitFor(page, () => !document.querySelector('.hb-sheet'), 4000));

    /* 3 the week's pill, 4 the value tile */
    const fig = await page.evaluate(() => ({
      week: (document.querySelector('[data-hm-agent-row="week"] .hb-pill') || {}).textContent || null,
      left: (document.querySelector('#hb-board .hb-fig-left') || {}).textContent || null }));
    check('3 the Week ahead pill counts its dates', fig.week != null && Number(fig.week) > 1, JSON.stringify(fig));
    check('4 the value tile names the currency it leaves out', /USD/.test(fig.left || ''), JSON.stringify(fig));

    /* 8 the late duties, one job each (owner, 16 Oct 2026) */
    const late = await page.evaluate(() => ({ ours: !!document.querySelector('[data-hm-agent-row="ours"]'),
      split: (document.querySelector('#hb-board .hb-fig-left.is-split') || {}).textContent || null }));
    check('8a Our promises is no longer a row on the Board', !late.ours, JSON.stringify(late));
    check('8b the Obligations overdue figure says how it splits, ours and theirs', /^\s*20 ours · 20 theirs\s*$/.test(late.split || ''), JSON.stringify(late));

    /* 2 a long agent list: eight, then the rest (Late promises, since Our promises left the Board) */
    await page.locator('#hb-board [data-hm-agent-row="late"] .hb-ag-w').first().tap();
    await waitFor(page, () => document.querySelectorAll('#hb-focus .hb-ag-work').length > 0, 8000);
    const before = await page.evaluate(() => document.querySelectorAll('#hb-focus .hb-ag-work').length);
    const more = page.locator('#hb-focus [data-hb-ag-more]');
    let after = before;
    if (await more.count()){ await more.first().tap(); await waitFor(page, n => document.querySelectorAll('#hb-focus .hb-ag-work').length > n, 6000, before);
      after = await page.evaluate(() => document.querySelectorAll('#hb-focus .hb-ag-work').length); }
    check('2 Late promises opens eight and Show more brings the rest', before === 8 && after > 8, `${before} → ${after}`);

    /* 8c asking Jambo for late duties opens the figure's own list, no second panel */
    const panelsBefore = await page.evaluate(() => (hbS().panels || []).length);
    const box = page.locator('[placeholder*="Ask for a number"]').first();
    await box.tap(); await box.fill('Which obligations are overdue?'); await page.keyboard.press('Enter');
    await waitFor(page, () => (hbS().path || []).slice(-1)[0] === 'f:overdue', 8000);
    const ask = await page.evaluate(() => ({ path: (hbS().path || []).slice(-1)[0], panels: (hbS().panels || []).length }));
    check('8c "Which obligations are overdue?" opens the Obligations overdue list, not a second panel', ask.path === 'f:overdue' && ask.panels === panelsBefore, JSON.stringify({ ask, panelsBefore }));

    /* 7 theirs carries no "nobody owns this" */
    await page.evaluate(() => { document.querySelector('#hb-board').scrollTop = 0; });
    await page.locator('#hb-board [data-hb-dig="f:overdue"]').first().tap();
    await waitFor(page, () => !!document.querySelector('#hb-focus .hb-row'), 8000);
    const rows = await page.evaluate(() => [...document.querySelectorAll('#hb-focus .hb-row')].map(r => r.innerText.replace(/\s+/g, ' ')));
    const theirs = rows.filter(r => /Pay invoice/.test(r)), ours = rows.filter(r => /Monthly report/.test(r));
    check('7 an obligation they owe carries no "nobody owns this" — ours still does',
      theirs.length > 0 && theirs.every(r => !/nobody owns this/i.test(r)) && ours.some(r => /nobody owns this/i.test(r)), JSON.stringify(rows.slice(0, 3)));

    /* 5 the bell */
    await page.evaluate(() => { if (typeof openPanel === 'function') openPanel('alerts'); });
    await waitFor(page, () => document.querySelectorAll('[data-alert-i]').length > 0, 6000);
    const texts = await page.evaluate(() => [...document.querySelectorAll('[data-al-grp] > div:first-child .al-t')].map(e => e.textContent.trim()));
    check('5 the bell says each heading once', texts.length > 0 && new Set(texts).size === texts.length, JSON.stringify(texts));
    await page.keyboard.press('Escape');

    /* 6 the tiles wrap 3 + 2 on a narrowed board */
    await page.evaluate(() => { const d = document.getElementById('ig-dock'); d.style.transition = 'none'; d.style.width = '640px'; });
    await page.waitForTimeout(300);
    const wrap = await page.evaluate(() => { const f = document.querySelector('#hb-board .hb-figs');
      const tops = [...f.children].map(k => Math.round(k.getBoundingClientRect().top)); const rows = [...new Set(tops)];
      return { w: f.clientWidth, perRow: rows.map(t => tops.filter(x => x === t).length) }; });
    check('6 the five tiles wrap 3 + 2 on a narrowed board, never 4 + 1', wrap.perRow.join('+') === '3+2', JSON.stringify(wrap));
    await page.screenshot({ path: path.join(OUT, '6-tiles-wrap.png') });

    check('no page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  } catch (e){ fail++; console.log('FAIL  the run threw — ' + (e && e.message)); }
  finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
