/* SCROLLING THE TRACKED CHANGES DOES NOT COLLAPSE THE PAGE.
   ============================================================
   Owner-reported 26 Aug 2026: "fix scrolling in the tracked changes area so
   that when you scroll down the page does not collapse ... It should only
   happen in the contracts section."

   WHAT "COLLAPSE" TURNED OUT TO BE, and it is the whole reason this file
   exists in a real browser rather than as a rule read out of a stylesheet: the
   contract room's header FOLDS ITS FACT ROW once the reader has scrolled about
   as far as folding would save. That fold is driven by a scroll LISTENER on
   document, in the capture phase, which accepted any scroller inside the
   shell's main column — and the tracked-changes column is one. MEASURED before
   it was touched: scrolling the cards took the head from 120px to 95px, and
   scrolling them back up put it to 120 again. The page expanding and
   collapsing under a gesture that has nothing to do with the contract.

   A FIRST PASS AIMED AT THE WRONG MECHANISM. overscroll-behavior:contain stops
   a scroll CHAINING to the scroller behind it; that is a different thing from a
   scroll EVENT some listener acts on, and no amount of it was ever going to fix
   this. The rule is right and stays. Only DRIVING the page told the two apart,
   which is why both halves are measured here:

     1  scrolling the cards leaves the head exactly where it was
     2  and the contract still folds it, so the feature is scoped, not removed
     3  the cards still scroll inside themselves, and do not chain to the page

   THE HEIGHT IS READ, NEVER TYPED: what is asserted is that the number does not
   MOVE, so a later type or spacing pass costs no edit in this file. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'tracked-scroll');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, {
    contracts: [fixtureContract('MK-S1', 'Retail Supply', 'Saw Sawa LLC',
      'sales', 5000000, 'Under Review')] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 700 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    await page.evaluate(() => openRedlineWorkbench('MK-S1'));
    await pause(1800);

    /* THE COLUMN HAS TO OVERFLOW OR THERE IS NOTHING TO SCROLL — a fixture
       whose cards fit would pass this file whatever the listener did. */
    const seeded = await page.evaluate(async () => {
      const c = getContract('MK-S1');
      const list = negoClauseList(c);
      for (let i = 0; i < list.length; i++)
        await negoEditClause(c, list[i].clauseId,
          '<p>Revised wording number ' + i + ' for this clause, at some length '
          + 'so the row is a real one rather than a stub.</p>',
          { side: i % 2 ? 'counterparty' : 'owner', author: 'A B' });
      renderRedline();
      return c.changes.length;
    });
    await pause(900);

    const m = await page.evaluate(async () => {
      const cards = document.getElementById('nego-cards');
      const head = document.getElementById('ws-head');
      const facts = document.getElementById('ws-facts');
      const doc = document.querySelector('.rl-doc .nego-scroll') || document.querySelector('.rl-doc');
      const page = document.getElementById('content-scroll');
      const H = () => (head ? Math.round(head.getBoundingClientRect().height) : null);
      const fire = el => el.dispatchEvent(new window.Event('scroll', { bubbles: true }));

      if (!cards || !head) return { missing: true };
      cards.scrollTop = 0; fire(cards);
      await new Promise(r => setTimeout(r, 300));
      const rest = { h: H(), folded: facts ? facts.classList.contains('is-folded') : null };

      /* 1 — the cards, all the way down */
      cards.scrollTop = cards.scrollHeight; fire(cards);
      await new Promise(r => setTimeout(r, 350));
      const afterCards = { h: H(), folded: facts ? facts.classList.contains('is-folded') : null };

      /* 3 — and the gesture does not chain to the page behind it */
      const pageTop = page ? page.scrollTop : 0;
      const r = cards.getBoundingClientRect();
      for (let i = 0; i < 4; i++)
        cards.dispatchEvent(new window.WheelEvent('wheel', { deltaY: 400,
          bubbles: true, cancelable: true,
          clientX: r.left + r.width / 2, clientY: r.top + r.height - 8 }));
      await new Promise(r2 => setTimeout(r2, 250));
      const chained = page ? page.scrollTop !== pageTop : false;

      /* 2 — the contract, which SHOULD fold it */
      let afterDoc = null;
      if (doc){
        doc.scrollTop = doc.scrollHeight; fire(doc);
        await new Promise(r2 => setTimeout(r2, 350));
        afterDoc = { h: H(), folded: facts ? facts.classList.contains('is-folded') : null,
          scrollable: doc.scrollHeight > doc.clientHeight + 1 };
      }
      return { rest, afterCards, afterDoc, chained,
        cardsScrollable: cards.scrollHeight > cards.clientHeight + 1,
        contain: getComputedStyle(cards).overscrollBehaviorY };
    });

    await page.screenshot({ path: path.join(OUT, '01-column.png') });

    check('the fixture really overflows the column — there is something to scroll',
      seeded > 0 && m.cardsScrollable, `${seeded} changes, scrollable ${m.cardsScrollable}`);
    check('1 scrolling the cards leaves the head exactly where it was',
      m.rest && m.afterCards && m.afterCards.h === m.rest.h && !m.afterCards.folded,
      m.rest ? `${m.rest.h}px → ${m.afterCards.h}px` : 'no head');
    check('2 and the contract still folds it — scoped, not removed',
      m.afterDoc && m.afterDoc.scrollable && m.afterDoc.folded && m.afterDoc.h < m.rest.h,
      m.afterDoc ? `${m.rest.h}px → ${m.afterDoc.h}px` : 'no document pane');
    check('3 the cards scroll inside themselves and do not chain to the page',
      m.chained === false && m.contain === 'contain',
      `page moved: ${m.chained} · overscroll ${m.contain}`);
    check('no page error', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
