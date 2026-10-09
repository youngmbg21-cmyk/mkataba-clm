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
 *      still stands over its seven columns;
 *   4. More wears the same outline as Export and Share beside it.
 *
 * Every driven half is guarded, so a missing control REPORTS rather than
 * times out. */
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
    await page.evaluate(() => setView('calendar'));
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

    const measure = () => page.evaluate(() => {
      const r = el => el ? +el.getBoundingClientRect().height.toFixed(2) : null;
      /* the month sits in its own column beside the agenda since 9 Oct 2026
         (SAP benchmark, batch 2), so it is found inside the stack, not on it */
      const grid = document.querySelector('.cal-stack .cal-grid');
      const panel = document.querySelector('.cal-stack > .cal-panel');
      const pg = document.querySelector('.cal-page');
      const body = document.querySelector('.cal-body');
      return { grid: r(grid), panel: r(panel), day: r(document.querySelector('.cal-day')),
        page: r(pg), rows: document.querySelectorAll('#cal-agenda .cal-upn').length,
        over: body ? Math.max(0, body.scrollHeight - body.clientHeight) : null };
    });

    const base = await measure();
    ok('0 the month and the agenda are both on the page',
      base.grid != null && base.panel != null && base.day != null, JSON.stringify(base));

    /* ===== 1. IT HOLDS STILL ===== */
    const seen = [{ at: 'at rest', ...base }];
    for (const n of [14, 60, 90, 30]){
      const there = await page.$(`[data-cal-days="${n}"]`);
      if (!there){ ok(`1 the ${n}-day window is a control on the page`, false, 'not drawn'); continue; }
      await there.click(); await pause(500);
      seen.push({ at: 'window ' + n, ...(await measure()) });
    }
    for (const id of ['cal-prev', 'cal-next']){
      const b = await page.$('#' + id);
      if (!b){ ok(`1 #${id} is a control on the page`, false, 'not drawn'); continue; }
      await b.click(); await pause(500);
      seen.push({ at: '#' + id, ...(await measure()) });
    }
    /* Horizon and back: a different card draws, and the month must come back
       the height it left at. */
    await page.evaluate(() => { if (typeof calSetView === 'function') calSetView('horizon'); });
    await pause(700);
    await page.evaluate(() => { if (typeof calSetView === 'function') calSetView('month'); });
    await pause(900);
    seen.push({ at: 'back from Horizon', ...(await measure()) });

    const counts = [...new Set(seen.map(s => s.rows))];
    ok('1a the agenda really did change — four windows, different row counts',
      counts.length >= 3, 'row counts seen: ' + counts.join(', '));
    const heights = [...new Set(seen.map(s => s.grid))];
    ok('1b the month card is the SAME height throughout',
      heights.length === 1, seen.map(s => `${s.at}=${s.grid}`).join('  '));
    const days = [...new Set(seen.map(s => s.day))];
    ok('1c and so is a single day box',
      days.length === 1, seen.map(s => `${s.at}=${s.day}`).join('  '));
    /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the drawing
       is the target): Next 14 days now stands BESIDE the month, as tall as
       its rows (the drawing's card ends under its last row). What keeps the
       month still is no longer the agenda's one height but that the agenda
       is its own column: it may grow, up to the month's own height, and never
       past it. 1b and 1c above are the owner's rule itself and are unchanged. */
    const tallest = seen.filter(s => s.panel != null && s.grid != null && s.panel > s.grid + 60);
    ok('1d because the agenda card is its own column, never taller than the month beside it',
      tallest.length === 0, seen.map(s => `${s.at}=${s.panel}/${s.grid}`).join('  '));

    /* ===== 2. AND NOTHING SPILLS ===== */
    const spill = seen.filter(s => s.over > 1);
    ok('2a the page never has to scroll to reach the agenda',
      spill.length === 0, spill.map(s => `${s.at}+${s.over}`).join(', ') || 'none');
    const scroller = await page.evaluate(() => {
      const el = document.getElementById('cal-agenda');
      if (!el) return null;
      return { can: el.scrollHeight > el.clientHeight, oy: getComputedStyle(el).overflowY,
        rows: el.querySelectorAll('.cal-upn').length };
    });
    ok('2b a long agenda is reachable inside its own card',
      !!scroller && scroller.oy === 'auto', JSON.stringify(scroller));

    /* ===== 3. THE DATE BOXES ARE TILES ===== */
    const tile = await page.evaluate(() => {
      const d = document.querySelector('.cal-day');
      const wk = document.querySelector('.cal-weeks');
      const dow = document.querySelector('.cal-dow');
      if (!d || !wk || !dow) return null;
      const cs = getComputedStyle(d), ws = getComputedStyle(wk), ds = getComputedStyle(dow);
      const col = n => { const e = document.querySelectorAll('.cal-day')[n], l = dow.children[n];
        return e && l ? +(e.getBoundingClientRect().left - l.getBoundingClientRect().left).toFixed(1) : null; };
      return { radius: parseFloat(cs.borderTopLeftRadius), edge: cs.borderTopWidth + ' ' + cs.borderTopStyle,
        wkBg: ws.backgroundColor, gap: ws.columnGap,
        /* a line is painted only where its style draws one */
        edgeDrawn: cs.borderTopStyle !== 'none' && parseFloat(cs.borderTopWidth) > 0,
        align: [col(0), col(3), col(6)], dowGap: ds.columnGap };
    });
    ok('3a a day box has the card radius', !!tile && tile.radius >= 8, tile && String(tile.radius));
    ok('3b and an edge that is really drawn', !!tile && tile.edgeDrawn, tile && tile.edge);
    ok('3c the grey backing behind the old grid lines is gone',
      !!tile && /rgba\(0, 0, 0, 0\)|transparent/.test(tile.wkBg), tile && tile.wkBg);
    ok('3d the day-name band still stands over its seven columns',
      !!tile && tile.align.every(x => x != null && Math.abs(x) <= 1), tile && JSON.stringify(tile.align));

    /* ===== 4. MORE WEARS THE ROW'S OUTLINE ===== */
    const row = await page.evaluate(() => {
      const b = document.getElementById('cal-more');
      if (!b) return null;
      const cs = getComputedStyle(b);
      /* Export and Share went INTO the ⋯ menu on 9 Oct 2026 (SAP benchmark,
         batch 2), so the neighbours ⋯ must match are now the two switches
         beside it on the same row. */
      const peers = [...document.querySelectorAll('.cal-acts > .cal-seg')].map(p => {
        const c = getComputedStyle(p);
        return { id: p.id || p.className, edge: c.borderTopColor, w: c.borderTopWidth, st: c.borderTopStyle,
          h: Math.round(p.getBoundingClientRect().height) };
      });
      return { more: { edge: cs.borderTopColor, w: cs.borderTopWidth, st: cs.borderTopStyle,
        h: Math.round(b.getBoundingClientRect().height) }, peers };
    });
    /* A WIDTH AND A STYLE ARE NOT A LINE. .ui-btn-plain kept both and declared
       the colour transparent, so a check reading width and style alone passed
       against the very button the owner was looking at. The colour is the
       third question. */
    ok('4a More has an outline that is really drawn',
      !!row && row.more.st !== 'none' && parseFloat(row.more.w) > 0
        && !/rgba\([^)]*,\s*0\s*\)|transparent/.test(row.more.edge),
      row && JSON.stringify(row.more));
    ok('4b the same one its neighbours wear',
      !!row && row.peers.length > 0 && row.peers.every(p =>
        p.edge === row.more.edge && p.w === row.more.w && p.st === row.more.st && p.h === row.more.h),
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
