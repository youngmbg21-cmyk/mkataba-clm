/* ROW DENSITY — two heights on one axis (25 Aug 2026; the third rung, condensed,
   was DELETED on the owner's word 21 Sep 2026 and this file reversed in place).
   See UI-UX-AUDIT-AND-ROADMAP.md §5 Phase 4, and REG_DENSITY in
   js/views/register.js for why the middle rung is 36 rather than Fiori's 32.

   TWO CHECKS IN THE FIRST DRAFT OF THIS FILE PASSED WITHOUT PROVING ANYTHING,
   and they are corrected here rather than deleted, because the shape is the
   one this project has been caught by before (f183):
     - "condensed shows more rows" read 4 -> 4 on a seeded book of four
       contracts. A row COUNT cannot move when the book is shorter than the
       page. It measures the tbody's HEIGHT now, which is deterministic at any
       book size: the same rows must occupy less room.
     - "the Negotiations list inherits it" found no table at all and passed on
       the absence. It now asserts the structural claim instead — ONE renderer
       emits .reg-table, and it always carries the mode — and says so when the
       page legitimately draws no table. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(1600);
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  await page.waitForTimeout(900);
  /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Contracts opens on its Folders; its List is pressed */
  await page.evaluate(() => { const b = document.querySelector('[data-ctf-show="list"]'); if (b) b.click(); });
  await page.waitForTimeout(900);

  const rowH  = () => page.evaluate(() => { const td = document.querySelector('.reg-table tbody td');
                                            return td ? Math.round(td.getBoundingClientRect().height) : 0; });
  /* RETIRED 17 Nov 2026 (#762, owner's ruling): the helpers that pressed and read the row-height control (bodyH, rows, live, set) went with it */

  console.log('\n1 · the control');
  /* RETIRED 17 Nov 2026 (#762, owner's ruling): the row-height choice (the Display menu's compact · comfortable) is gone from the new look's Contracts list; 'drawn', 'offers exactly the rungs', 'defaults to compact' and 'does not claim to be narrowing the list' asked of that control */

  console.log('\n2 · the two rungs');
  /* ---- CONDENSED IS GONE (Young ruled 21 Sep 2026: "Delete condensed"), AND
     THIS SECTION IS REVERSED IN PLACE ----
     It was the one rung that took the kind and the round off the title, so it
     drew a DIFFERENT row rather than the same row closer together. Every claim
     that drove it now drives COMPACT, and the ladder's own length is a claim of
     its own: a rung that is deleted must not come back as a dead button.
     RE-POINTED 21 Sep 2026 (the redesign's second pass): the title is two lines
     on compact, so the row stands ABOVE its 36px floor and under 44. */
  /* RE-POINTED 19 Nov 2026 (the Contracts list as drawn, owner's "the new design for contracts lists page": the same
     spacing as Parties): Contracts' rows stand about 66px — 13px above and below a two-line cell — not compact's 36–44 */
  ok('the Contracts row stands about 66px, as Parties\' (19 Nov 2026)', (await rowH()) >= 58 && (await rowH()) <= 76, (await rowH()) + 'px');
  /* RETIRED 17 Nov 2026 (#762, owner's ruling): the row-height choice (the Display menu's compact · comfortable) is gone from the new look's Contracts list; 'comfortable 44px' and 'the ladder offers two rungs' pressed that control; the rows' own geometry is still pinned here */
  ok('padding travels with the height', (await page.evaluate(() =>
     getComputedStyle(document.querySelector('.reg-table tbody td')).paddingLeft)) === '12px');
  /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way"): the
     Contracts place has no Ref column now, so the row's first cell is the
     identity cell, which keeps its own two-line leading; the row's leading is
     read off a plain cell (Stage), as the Ref cell gave it before */
  ok('leading travels with it too', (await page.evaluate(() =>
     getComputedStyle(document.querySelector('.reg-table tbody td:not(.reg-cell-title)')).lineHeight)) === '20px');

  console.log('\n3 · it buys what it claims to buy');
  /* HEIGHT, NOT COUNT — a count cannot move on a book shorter than the page. */
  /* RETIRED 17 Nov 2026 (#762, owner's ruling): the row-height choice (the Display menu's compact · comfortable) is gone from the new look's Contracts list; 'the same rows take measurably less room' compared the two rungs */

  console.log('\n4 · it is remembered, and it is the reader\'s own');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): Contracts opens on its Folders; its List is pressed */
  await page.evaluate(() => { const b = document.querySelector('[data-ctf-show="list"]'); if (b) b.click(); });
  await page.waitForTimeout(900);
  /* RETIRED 17 Nov 2026 (#762, owner's ruling): the row-height choice (the Display menu's compact · comfortable) is gone from the new look's Contracts list; 'survives a reload' read the control's pressed rung */
  /* RE-POINTED 19 Nov 2026: after a reload the rows keep the drawn spacing */
  ok('and after a reload the rows keep the drawn spacing', (await rowH()) >= 58 && (await rowH()) <= 76, (await rowH()) + 'px');
  /* RETIRED 17 Nov 2026 (#762, owner's ruling): the row-height choice (the Display menu's compact · comfortable) is gone from the new look's Contracts list; 'a browser that remembers condensed simply reads compact' read the control's pressed rung */

  console.log('\n5 · one renderer, both pages');
  /* THE STRUCTURAL CLAIM, because the Negotiations page draws no table when
     nothing is live — and passing on that absence is what the first draft did. */
  const srcOne = await page.evaluate(() => document.querySelectorAll('.reg-table').length <= 1);
  ok('at most one .reg-table is ever mounted', srcOne);
  ok('the mounted table carries the mode on itself', await page.evaluate(() => {
    const t = document.querySelector('.reg-table');
    return !!t && t.getAttribute('data-reg-density') === 'compact'
        && t.style.getPropertyValue('--reg-row-h') === '36px';
  }));
  /* the left menu's place is the desk tabs' since 17 Oct 2026 (Round 2): the page is asked of Jambo's box */ await page.evaluate(w => { setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })(w); }, 'negotiations');
  await page.waitForTimeout(1000);
  const neg = await page.evaluate(() => {
    const t = document.querySelector('.reg-table');
    if (!t) return { drawn: false };
    const td = t.querySelector('tbody td');
    return { drawn: true, mode: t.getAttribute('data-reg-density'),
             h: td ? Math.round(td.getBoundingClientRect().height) : 0 };
  });
  if (neg.drawn) ok('Negotiations inherits the mode', neg.mode === 'compact' && neg.h >= 36 && neg.h < 44, JSON.stringify(neg));
  else           console.log('  note  Negotiations drew no table (nothing live in this fixture) — ' +
                             'the structural claim above is what covers it');

  console.log('\n6 · nothing else moved');
  await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
  /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762): Contracts opens on its Folders; its List is pressed */
  await page.evaluate(() => { const b = document.querySelector('[data-ctf-show="list"]'); if (b) b.click(); });
  await page.waitForTimeout(700);
  ok('no sideways scroll at any density',
     await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  ok('no head cell clips', await page.evaluate(() =>
     ![...document.querySelectorAll('.reg-table th')].some(c => c.scrollWidth > c.clientWidth + 1)));

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
