/* ============================================================================
   KEEPS YOUR PLACE — a filter or a pager may not throw the reader to the top
   ============================================================================
   Owner-reported 28 Aug 2026, off a screenshot of Insights → Portfolio with the
   pager under "What needs attention" ringed: *"when i click on the highlighted
   button the page jumps me to the top of the screen. Fix and make a rule that
   and in any other area where this is an issue."*

   ONLY A BROWSER CAN ANSWER THIS. jsdom lays nothing out, has no scroll height
   and no animation frame, so a node test passes whether the fix is in or not.
   What is measured here is the reader's own offset, read back off the element
   that actually scrolls, after a real press.

   AND THE ELEMENT THAT ACTUALLY SCROLLS IS THE POINT. keepScroll used to read
   #content-scroll alone — but Insights is on VIEW_OWNS_HEIGHT, so it builds its
   own scroller inside #content (#ig-frame) and the shell's never moves. Wired
   up as it stood, the fix would have shipped and the jump would have stayed.

   RETIRED 29 Oct 2026: the Insights half below measured the Insights page,
   which the owner had deleted; what is left measures the templates book.

   RUN IT AGAINST THE PARENT COMMIT AND IT REPORTS THE JUMP — that is the
   condition on trusting it, and it is this rulebook's own rule about a browser
   file being a description otherwise.  */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'keeps-your-place');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({});
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* THE INSIGHTS HALF RETIRED 29 Oct 2026: measured the Insights page, which
       the owner had deleted — its own scroller, the stage and category
       filters on Portfolio keeping the reader's place, and its tabs starting
       at the top. keepScroll itself is still wired on other pages (the
       obligations list); this file no longer drives it. */

    /* ---- AND THE PAGE FILLS THE SCREEN IT IS ON (owner-ruled 29 Aug 2026) ----
       Measured, not read: what a page shows now depends on the window, so the
       only honest check is to change the window and watch the count follow.
       This file already drives a real book on a real server, so it is where
       that belongs rather than in a third harness. */
    /* REVERSED IN PLACE 29 Aug 2026. This measured that the templates wall
       showed MORE of forty-seven template cards on a taller screen — the fill-
       the-monitor ask. The wall draws CATEGORIES now (five libraries and one
       per value stream), a bounded handful that always draws in full, so there
       is nothing left to fit and the claim becomes the stronger one: the
       reader is shown the whole of it whatever the window, and the page never
       withholds a category behind a screen size. */
    await page.setViewportSize({ width: 2000, height: 1030 });
    await page.evaluate(() => setView('templates'));
    await page.waitForTimeout(1600);
    /* RE-POINTED 11 Oct 2026: SAP BENCHMARK, BATCH 2 — the book is a shelves
       TABLE (tplBookHtml, #tpl-bk-library), one row per shelf, and the two
       halves are a segmented switch (Shelves · Value streams) rather than two
       headings. The claims stand: every shelf whatever the window, no "see
       all", two halves, and the card reaches down a tall screen. */
    /* RE-POINTED 18 Oct 2026 (round 21, "Paper first"): the book is an index
       of templates and the chosen one's paper — every template whatever the
       window, the two halves are the index and the paper, and the book still
       reaches down a tall screen. */
    const tall = await page.evaluate(() => ({
      cards: document.querySelectorAll('.tpl-pf-idx [data-tpl-pf]').length,
      bands: document.querySelectorAll('.tpl-pf > .tpl-pf-idx, .tpl-pf > .tpl-pf-paper').length,
      seeAll: !!document.getElementById('tpl-ov-all'),
      bottom: Math.round((document.querySelector('.tpl-pf') || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom) }));
    await page.setViewportSize({ width: 2000, height: 700 });
    await page.evaluate(() => renderTemplatesPage());
    await page.waitForTimeout(1600);
    const short = await page.evaluate(() =>
      document.querySelectorAll('.tpl-pf-idx [data-tpl-pf]').length);
    check('the templates book shows every template, whatever the window',
      tall.cards > 0 && tall.cards === short, `${tall.cards} at 1030, ${short} at 700`);
    check('and nothing is held back behind a "see all"', !tall.seeAll, tall.seeAll);
    check('the book is in its two halves — the index and the paper',
      tall.bands === 2, `${tall.bands} halves`);
    check('the book reaches down the tall screen rather than stopping short',
      tall.bottom > 700, tall.bottom + 'px of 1030');
    await page.setViewportSize({ width: 2000, height: 1030 });

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
