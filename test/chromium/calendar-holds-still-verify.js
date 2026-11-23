/* THE CALENDAR HOLDS STILL — and its date boxes are tiles.
 *
 * Young, 4 Oct 2026, three things about one page:
 *
 *   "In the calendar tab, the height of the calendar changes when you navigate
 *   around the buttons in the page. This should not happen. Also, the date
 *   boxes should have rounded corners like the cards across the platform."
 *   … and then: "More button in the calendar page does not have an outline."
 *
 * WHY IT MOVED. The month grid and the agenda beside it are one column: the
 * grid took what was left (flex:1 1 auto, floored at 440px) and the agenda
 * took whatever its rows needed (flex:none). So pressing 14 · 30 · 60 · 90 —
 * the one control on that card a reader touches four times a sitting —
 * resized the month above it. MEASURED HERE before the fix, at 1500x1000 on a
 * book with fourteen dates spread over ninety days:
 *
 *     window   agenda rows   month card   a day box
 *       14          4          480.64px     74.03px
 *       60          9          440.00px     67.27px   (its floor)
 *       90         14          440.00px     67.27px   (and the page overflowed:
 *                                                      the panel reached 814px)
 *
 * The panel now declares one height and the agenda scrolls inside it, so the
 * month is the same height on every window, every month and both views.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. the month card and a single day box keep the SAME height through every
 *      window, both steppers and the Month/Horizon switch;
 *   2. nothing overflows the page while doing it, and a long agenda is
 *      reachable by scrolling inside its own card rather than by pushing the
 *      month off;
 *   3. a day box is a rounded tile with an edge, and the day-name band above
 *      still stands over its five columns (Monday to Friday since round 16);
 *   4. More wears the same outline as Export and Share beside it.
 *
 * Every driven half is guarded, so a missing control REPORTS rather than
 * times out.
 *
 * RE-POINTED 11 Oct 2026 — ONE CARD, CALENDAR + COPILOT (Young: "build it
 * exactly as designed"; Next 14 days removed by Young's choice). The owner's
 * rule is unchanged and is what 1b/1c still ask: the month keeps one height.
 * What used to move it (the agenda's 14 · 30 · 60 · 90) is gone; what a reader
 * now touches beside it is the three layers and Copilot, whose answer grows a
 * conversation of cards — so those are driven instead, and Copilot's answer
 * scrolls inside its own panel rather than pushing the month. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'calendar-holds-still');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* DAY-RELATIVE, so no answer depends on the day it runs: the agenda is
   "the next N days" from today, and a fixture pinned to a date would draw a
   different number of rows every week. Fourteen dates spread 3..88 days out,
   so 14 · 30 · 60 · 90 really do give four different row counts. */
const OFFSETS = [3, 6, 9, 12, 20, 26, 35, 44, 52, 61, 70, 78, 85, 88];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const pause = ms => new Promise(r => setTimeout(r, ms));
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0,
      null, { timeout: 15000 }).catch(() => {});
    /* RE-POINTED 11 Oct 2026 (Calendar is Home's tab): the server's own list
       lands first, so the start-up's "back to where you were" (hbPlacePut)
       has run before the Calendar tab is asked for — a person cannot press it
       sooner either */
    await page.waitForFunction(() => state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(600);
    /* the calendar opens on this week and five more since round 16 (18 Oct 2026); this check is about the month, so it asks for it */
    await page.evaluate(() => { setView('calendar'); calSetView('month'); });
    await pause(1200);
    /* SEEDED ON THE PAGE, after it has drawn once: the bootstrap's own fetch
       lands late and replaces state.contracts, so a book written before the
       first paint is the book that gets thrown away. */
    await page.evaluate(offs => {
      const iso = o => { const t = new Date(); t.setDate(t.getDate() + o);
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
      state.contracts = offs.map((o, i) => ({ id: 'CH-' + i, contractNo: 'CH-' + i, name: 'Holds still ' + i,
        counterparty: 'Counterparty ' + i, folder: 'proc', value: 1000000, status: 'Signed',
        expiry: iso(o), metadata: { expiryDate: iso(o) },
        rounds: [], audit: [], changes: [], obligations: [], scan: null }));
      renderCalendar();
    }, OFFSETS);
    await pause(900);

    /* RE-POINTED 23 Nov 2026 (P-14, owner's "Build P-14": the Calendar the Legora + Stripe way on all four tabs): the
       month is ONE soft seven-day frame (#cal-grid.cls-mg, day cells .cls-d, weekday heads .cls-mh) in the page's one
       scroller (#cal-ls-body); the three layer switches are gone (chips narrow instead) and a press on a day CHOOSES it,
       the panel saying that day. The owner's rule is unchanged and is what 1b/1c ask: the month keeps one height whatever
       is pressed beside it — a day chosen, a chip, Copilot answering in his own panel. */
    const measure = () => page.evaluate(() => {
      const r = el => el ? +el.getBoundingClientRect().height.toFixed(2) : null;
      const grid = document.querySelector('.cal-page.is-ls #cal-grid.cls-mg');
      const panel = document.getElementById('cal-plan');   /* Copilot, beside every view since 11 Oct 2026 */
      const pg = document.querySelector('.cal-page');
      const body = document.getElementById('cal-ls-body');
      return { grid: r(grid), panel: r(panel), day: r(document.querySelector('.cal-page.is-ls #cal-grid .cls-d')),
        page: r(pg), rows: document.querySelectorAll('#cal-plan .cal-prop').length,
        over: body ? Math.max(0, body.scrollHeight - body.clientHeight) : null };
    });

    const base = await measure();
    ok('0 the month and Copilot are both on the page',
      base.grid != null && base.panel != null && base.day != null, JSON.stringify(base));

    /* ===== 1. IT HOLDS STILL ===== */
    const seen = [{ at: 'at rest', ...base }];
    /* three days chosen, one after another (the press a reader makes on the month) */
    const picks = await page.evaluate(() => [...document.querySelectorAll('.cal-page.is-ls #cal-grid .cls-d:not(.is-out)')].filter((_, i) => i % 9 === 4).slice(0, 3).map(d => d.getAttribute('data-cal-pick')));
    if (picks.length < 3) ok('1 three days of the month to choose', false, JSON.stringify(picks));
    for (const k of picks){
      await page.click(`.cal-page.is-ls #cal-grid .cls-d[data-cal-pick="${k}"]`).catch(() => {});
      await page.waitForFunction(k => !!document.querySelector(`.cal-page.is-ls #cal-grid .cls-d.is-chosen[data-cal-pick="${k}"]`), k, { timeout: 3000 }).catch(() => {});
      seen.push({ at: 'day ' + k, ...(await measure()) });
    }
    const allChip = await page.$('.cal-page.is-ls [data-cal-ls-show="all"]');
    if (!allChip) ok('1 the All chip is a control on the page', false, 'not drawn');
    else { await allChip.click(); await pause(400); seen.push({ at: 'All chip', ...(await measure()) }); }
    /* Copilot answers (the route stubbed in the page): eight suggestions, so
       its conversation is longer than its panel. Asked in his box at the panel's foot, the month's own way in. */
    await page.evaluate(() => {
      const iso = o => { const t = new Date(); t.setDate(t.getDate() + o);
        return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
      const real = window.api;
      window.api = async (p, m, b) => p === 'ai/plan' ? { say: 'Eight blocks before your dates.', dropped: 0,
        blocks: Array.from({ length: 8 }, (_, i) => ({ date: iso(3 + i), start: '10:00', end: '11:00', title: 'Prepare CH-' + i, why: 'Its date is close and you are free.' })) } : real(p, m, b);
    });
    const box = await page.$('#cal-plan-in');
    if (box){ await box.fill('Plan my week'); await box.press('Enter');
      await page.waitForFunction(() => document.querySelectorAll('#cal-plan .cal-prop').length >= 8, null, { timeout: 6000 }).catch(() => {});
      seen.push({ at: 'Jambo answered', ...(await measure()) }); }
    else ok('1 Copilot\'s box is on the page', false, 'not drawn');
    /* Horizon and back: a different card draws, and the month must come back
       the height it left at. */
    await page.evaluate(() => { if (typeof calSetView === 'function') calSetView('horizon'); });
    await pause(700);
    await page.evaluate(() => { if (typeof calSetView === 'function') calSetView('month'); });
    await page.waitForFunction(() => !!document.querySelector('.cal-page.is-ls #cal-grid .cls-d'), null, { timeout: 4000 }).catch(() => {});
    seen.push({ at: 'back from Horizon', ...(await measure()) });

    const counts = [...new Set(seen.map(s => s.rows))];
    ok('1a Copilot really did answer beside it — its cards came and the month was measured either side',
      counts.length >= 2 && Math.max(...counts) === 8, 'cards seen: ' + counts.join(', '));
    const heights = [...new Set(seen.map(s => s.grid))];
    ok('1b the month card is the SAME height throughout',
      heights.length === 1 && heights[0] != null, seen.map(s => `${s.at}=${s.grid}`).join('  '));
    const days = [...new Set(seen.map(s => s.day))];
    ok('1c and so is a single day box',
      days.length === 1 && days[0] != null, seen.map(s => `${s.at}=${s.day}`).join('  '));
    const tallest = seen.filter(s => s.panel != null && s.grid != null && s.panel > s.page);
    ok('1d because Copilot is its own column, never taller than the page it sits on',
      tallest.length === 0, seen.map(s => `${s.at}=${s.panel}/${s.page}`).join('  '));

    /* ===== 2. AND NOTHING SPILLS ===== */
    const spill = seen.filter(s => s.over > 1);
    ok('2a the page never has to scroll to reach Copilot',
      spill.length === 0, spill.map(s => `${s.at}+${s.over}`).join(', ') || 'none');
    const scroller = await page.evaluate(() => {
      const el = document.getElementById('cal-plan-body');
      if (!el) return null;
      return { can: el.scrollHeight > el.clientHeight, oy: getComputedStyle(el).overflowY,
        rows: el.querySelectorAll('.cal-prop').length };
    });
    ok('2b a long answer is reachable inside Copilot\'s own panel',
      !!scroller && scroller.oy === 'auto' && scroller.can, JSON.stringify(scroller));

    /* ===== 3. THE MONTH IS ONE SOFT FRAME =====
       RE-POINTED 23 Nov 2026 (P-14, as drawn: "the month in one soft frame", reverses the tiles of 4 Oct 2026): the frame
       wears a rounded corner and an edge really drawn, no grey backing behind its days, and the weekday heads stand over
       their seven columns */
    const tile = await page.evaluate(() => {
      const g = document.querySelector('.cal-page.is-ls #cal-grid.cls-mg');
      const heads = [...document.querySelectorAll('.cal-page.is-ls #cal-grid .cls-mh')];
      const cells = [...document.querySelectorAll('.cal-page.is-ls #cal-grid .cls-d')];
      if (!g || heads.length !== 7 || cells.length < 7) return null;
      const cs = getComputedStyle(g);
      const col = n => +(cells[n].getBoundingClientRect().left - heads[n].getBoundingClientRect().left).toFixed(1);
      return { radius: parseFloat(cs.borderTopLeftRadius), edge: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
        edgeDrawn: cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0 && !/rgba\([^)]*,\s*0\s*\)|transparent/.test(cs.borderTopColor),
        clip: cs.overflow, gridBg: cs.backgroundColor, align: [col(0), col(2), col(4), col(6)] };
    });
    ok('3a the month is one frame with a rounded corner that clips its days', !!tile && tile.radius > 0 && /hidden|clip/.test(tile.clip),
      tile && tile.radius + ' · ' + tile.clip);
    ok('3b and an edge that is really drawn', !!tile && tile.edgeDrawn, tile && tile.edge);
    ok('3c no grey backing behind the days',
      !!tile && /rgba\(0, 0, 0, 0\)|transparent|rgb\(255, 255, 255\)/.test(tile.gridBg), tile && tile.gridBg);
    ok('3d the day-name band stands over its seven columns, Monday to Sunday',
      !!tile && tile.align.every(x => x != null && Math.abs(x) <= 1), tile && JSON.stringify(tile.align));

    /* ===== 4. MORE WEARS THE ROW'S OUTLINE ===== */
    const row = await page.evaluate(() => {
      const b = document.getElementById('cal-more');
      if (!b) return null;
      const cs = getComputedStyle(b);
      /* Export and Share went INTO the ⋯ menu on 9 Oct 2026 (SAP benchmark,
         batch 2), so the neighbours ⋯ must match are now the two switches
         beside it on the same row. */
      /* ⋯ stands alone in the page head since 11 Oct 2026; its neighbours are
         the calendar card's own buttons, and what must match is the OUTLINE */
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the old head's buttons are still in the markup,
         hidden; the neighbours a reader sees are the drawn ones */
      const peers = [...document.querySelectorAll('#cal-today, #cal-new')].filter(p => p.getBoundingClientRect().height > 0).map(p => {
        const c = getComputedStyle(p);
        return { id: p.id || p.className, edge: c.borderTopColor, w: c.borderTopWidth, st: c.borderTopStyle, bg: c.backgroundColor,
          h: Math.round(p.getBoundingClientRect().height) };
      });
      return { more: { edge: cs.borderTopColor, w: cs.borderTopWidth, st: cs.borderTopStyle, bg: cs.backgroundColor,
        h: Math.round(b.getBoundingClientRect().height) }, peers };
    });
    /* A WIDTH AND A STYLE ARE NOT A LINE. .ui-btn-plain kept both and declared
       the colour transparent, so a check reading width and style alone passed
       against the very button the owner was looking at. The colour is the
       third question. */
    /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): a button is a grey pill with NO edge, product-wide;
       "really drawn" is now its FILL (a transparent fill would be the bare word this caught before),
       and it is the same face its neighbours wear — fill and edge alike. */
    ok('4a More is really drawn as a button — a filled face, not a bare word',
      !!row && !/rgba\([^)]*,\s*0\s*\)|transparent/.test(row.more.bg),
      row && JSON.stringify(row.more));
    ok('4b the same face its neighbours wear',
      /* the edge compared as PAINTED (THE LEGORA LOOK: no edge on a button): a line is drawn only with a width, a style
         and a colour that is not clear — a 0px line and a clear 1px line are the same nothing */
      !!row && row.peers.length > 0 && row.peers.every(p => { const line = x => (parseFloat(x.w) > 0 && x.st !== 'none' && !/rgba\([^)]*,\s*0\s*\)|transparent/.test(x.edge)) ? x.w + ' ' + x.st + ' ' + x.edge : 'none';
        return line(p) === line(row.more) && p.bg === row.more.bg; }),
      row && JSON.stringify(row));

    await page.screenshot({ path: path.join(OUT, '1-month.png') });
    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
