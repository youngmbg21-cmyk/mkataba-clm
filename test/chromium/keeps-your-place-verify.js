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

    /* Enough contracts that the findings list pages and the page is long
       enough to scroll — the reported state needs both. */
    await page.evaluate(() => {
      const day = off => { const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()+off);
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
      /* EACH CARRIES A SCAN WITH FINDINGS, because the findings card is what
         the pager belongs to and pfFindingsOf reads c.scan — without one the
         card draws its empty state and the reported button is not on the page
         at all. Three findings apiece past the page size of ten. */
      const scan = i => ({ dismissed: [], findings: [
        { id: 'f' + i + 'a', sev: 'high', clause: 'c1', title: 'Liability uncapped',
          detail: 'No cap on the supplier\u2019s liability.' },
        { id: 'f' + i + 'b', sev: 'med', clause: 'c2', title: 'Payment terms long',
          detail: 'Ninety days against a standard of thirty.' },
        { id: 'f' + i + 'c', sev: 'low', clause: 'c3', title: 'No governing law',
          detail: 'The agreement names no forum.' } ] });
      const mk = i => ({ id: 'MK-J' + i, name: 'Works package ' + i, counterparty: 'Naivas',
        status: i % 3 ? 'Under Review' : 'Signed', value: 1000000 + i * 90000,
        expiry: day(30 + i * 5), valueType: 'standard', audit: [], rounds: [], folder: 'proc',
        scan: scan(i),
        /* TWO CATEGORIES, so pressing a category chip is a real narrowing —
           with one, the chip filters to the whole book and proves nothing. */
        metadata: { category: i % 2 ? 'works' : 'services', retentionPct: 10, warrantyMonths: 12 } });
      state.contracts = Array.from({ length: 40 }, (_, i) => mk(i + 1));
      setView('intel');
    });
    await page.waitForTimeout(1800);

    /* WHICH ELEMENT SCROLLS IS ASKED, NOT ASSUMED — the whole defect was a
       helper that measured the wrong one. */
    const scroller = await page.evaluate(() => {
      const ids = ['ig-frame', 'ig-friction', 'ig-oblig', 'content-scroll'];
      for (const id of ids){
        const el = document.getElementById(id);
        if (el && el.scrollHeight > el.clientHeight + 40) return id;
      }
      return null;
    });
    check('the Insights page scrolls inside its own element, not the shell',
      scroller && scroller !== 'content-scroll', String(scroller));

    const scrollTo = async y => page.evaluate(([id, top]) => {
      const el = document.getElementById(id); el.scrollTop = top; return el.scrollTop;
    }, [scroller, y]);
    const at = () => page.evaluate(id => document.getElementById(id) ? document.getElementById(id).scrollTop : -1, scroller);

    const parked = await scrollTo(600);
    check('the reader can be parked partway down it', parked > 100, parked + 'px');
    await page.screenshot({ path: path.join(OUT, '01-parked.png') });

    /* ---- THE REPORTED PRESS ---- */
    /* PRESSED IN THE PAGE, NOT THROUGH THE DRIVER, AND THAT IS NOT A SHORTCUT.
       Playwright scrolls an element into view before it clicks it — so on a
       control above the fold the DRIVER moves the scroller and the check then
       measures its own actionability rather than the product's behaviour. It
       cost an hour: the category chip reported 461 → 0 with the fix working
       perfectly. A dispatched click runs the same delegated handler a mouse
       does and touches nothing else.

       THE NEXT ARROW, not the first button in the row — the previous one is
       disabled on page 1. */
    const hasPager = await page.evaluate(() =>
      !!document.querySelector('[data-pf-find-page="next"]:not([disabled])'));
    check('the pager the owner ringed is on the page', hasPager);
    if (hasPager){
      await page.evaluate(() =>
        document.querySelector('[data-pf-find-page="next"]:not([disabled])').click());
      await page.waitForTimeout(700);
      const after = await at();
      await page.screenshot({ path: path.join(OUT, '02-after-pager.png') });
      check('THE PAGER DOES NOT THROW THE READER TO THE TOP',
        after > parked - 60, `${parked} → ${after}`);
    }

    /* ---- AND IT IS NOT ONE BUTTON: every filter on that page is the same
       funnel, which is why the fix is at again() rather than at the press. ---- */
    await scrollTo(600);
    const hasCat = await page.evaluate(() => !!document.querySelector('[data-pf-cat]'));
    if (hasCat){
      const before = await at();
      await page.evaluate(() => document.querySelector('[data-pf-cat]').click());
      await page.waitForTimeout(700);
      /* A FILTER MAKES THE PAGE SHORTER, so "kept the place" can only mean as
         far as the new page allows: the honest claim is that the reader is
         where they were, or at the new bottom, and never thrown to the top of a
         page that still has room to hold them. */
      const room = await page.evaluate(id => { const el = document.getElementById(id);
        return el ? Math.max(0, el.scrollHeight - el.clientHeight) : 0; }, scroller);
      const after = await at();
      check('nor does the category filter beside it',
        after >= Math.min(before, room) - 60, `${before} → ${after} (room ${room})`);
    } else check('nor does the category filter beside it', true, 'no category filter in this book');

    /* ---- A TAB MAY LAND AT THE TOP, and that is the rule rather than a miss.
       Different content arrives, so a remembered offset would drop the reader
       at an arbitrary point in it. ---- */
    await scrollTo(600);
    const hasTab = await page.evaluate(() => !!document.querySelector('[data-ig-tab="friction"]'));
    if (hasTab){
      await page.evaluate(() => document.querySelector('[data-ig-tab="friction"]').click());
      await page.waitForTimeout(1200);
      const nowScroller = await page.evaluate(() => {
        const el = document.getElementById('ig-friction');
        return el ? el.scrollTop : -1;
      });
      check('a TAB is navigation and may start at the top', nowScroller <= 40, String(nowScroller));
    } else check("a TAB is navigation and may start at the top", true, 'no friction tab in this book');

    /* ---- AND THE PAGE FILLS THE SCREEN IT IS ON (owner-ruled 29 Aug 2026) ----
       Measured, not read: what a page shows now depends on the window, so the
       only honest check is to change the window and watch the count follow.
       This file already drives a real book on a real server, so it is where
       that belongs rather than in a third harness. */
    await page.setViewportSize({ width: 2000, height: 1030 });
    await page.evaluate(() => setView('templates'));
    await page.waitForTimeout(1600);
    const tall = await page.evaluate(() => ({
      cards: document.querySelectorAll('#tpl-ov-cards > *').length,
      bottom: Math.round(document.getElementById('tpl-ov-cards').getBoundingClientRect().bottom) }));
    await page.setViewportSize({ width: 2000, height: 700 });
    await page.evaluate(() => renderTemplatesPage());
    await page.waitForTimeout(1600);
    const short = await page.evaluate(() =>
      document.querySelectorAll('#tpl-ov-cards > *').length);
    check('the templates wall shows MORE on a taller screen',
      tall.cards > short, `${tall.cards} at 1030 vs ${short} at 700`);
    check('and it was more than the old fixed eight', tall.cards > 8, String(tall.cards));
    check('the wall reaches down the tall screen rather than stopping a third of the way',
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
