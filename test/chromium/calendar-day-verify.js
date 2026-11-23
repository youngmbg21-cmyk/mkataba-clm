/* Chromium verification: A CALENDAR DAY IS A DOOR, AND IT KNOWS WHICH ONE.
   ============================================================
   Asked for directly (Young, 11 Aug 2026), against a screenshot of 31 January
   2027 carrying two contracts: "when I click on a calendar box and there are
   more than one contracts, it should take me to the repository so I can select
   which contract is of interest to me."

   The box was scenery. Only the name chips inside it did anything, "+2 more"
   did nothing at all, and a day whose chips were clipped had no way in.

   WHICH DOOR DEPENDS ON HOW MANY CONTRACTS, and it is contracts rather than
   events: one contract can put two marks on one day, because a renewal
   decision falls on the expiry itself when no notice period is known, and
   sending a reader to a list to choose between two rows about the same
   agreement would be a choice with one answer.

   And the register has to SAY it has been narrowed and offer the way back. A
   list silently showing two of a hundred and thirty-nine is indistinguishable
   from a broken register — the rule the origin filter on the negotiation
   column already obeys.

   AND THE CHIPS FOLLOW THE SAME RULE NOW (owner-asked, 12 Aug 2026). They were
   the one exception: their own buttons, opening their own contract however many
   the day held. On the reported screen 30 August carried nine contracts and its
   three visible chips all read "Mutual Non-Discl…" — pressing one is a guess
   between nine. This file used to assert the exception; it asserts the rule,
   and keeps every claim the exception was protecting: a press inside a day box
   always lands somewhere, the landing says what it is narrowed to with the way
   back on the same chip, a one-contract day still opens its contract, and the
   agenda list beside the calendar — which shares nothing with a day box but a
   selector — still opens its own named contract.

   ---- REVERSED 11 Oct 2026 BY THE OWNER'S DESIGN ("build it exactly as
   designed", the HaTi Proposals artifact Part 3: "Press a day in Month to open
   its week ... Pressing a contract anywhere opens that contract") ----
   A day box is now the door to its WEEK, every day, a real tab stop; a chip
   is the door to its own CONTRACT — chips name the reference and the
   agreement now ("Ends · MK-A6 Flour…"), which is what made nine identical
   "Mutual Non-Discl…" chips a guess on 12 Aug. A busy day shows what fits,
   says how many more, and its week's All-day row lists every one of them,
   each its own door. The register narrowed to a day (data-cal-day) is STALE.

   Run: node test/chromium/calendar-day-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
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

    /* Three days inside the month the calendar opens on — and a FOURTH date
       that is always in the future.

       ---- A FIXTURE WHOSE ANSWER DEPENDS ON THE DAY IT RUNS (found 23 Aug
       2026) ---- The three grid days are pinned to the 12th, 18th and 22nd of
       the CURRENT month, which is fine for the month grid: it draws the whole
       month whether a day is past or future, so every day-cell check here
       passes on any date. The panel beside it does not. "Next 30 days" is
       calUpcoming, which keeps `daysUntil(e.date) >= 0`, so on the 23rd all
       three fixture dates were 11, 5 and 1 days in the PAST, the panel drew its
       empty state, and the agenda check reported "no agenda rows to press".
       MEASURED on 23 Aug 2026: daysUntil came back -11 and -5.

       It would have passed on the 1st to the 11th of any month and failed for
       the rest of it — the exact shape this suite already records for f183,
       whose fixture counted days from today and was broken on 264 days of 730.
       A red run nobody can trust teaches the reader to discount red runs.

       So the agenda gets a date of its OWN, offset from today rather than
       pinned to a day number, which is inside the 30-day window on every date
       there is. It steps past the three grid days if it lands on one: a sixth
       mark on the 12th would turn the "three contracts share a day" check into
       four. It may fall in next month, which is correct and deliberate — the
       panel is not month-scoped, only the grid is. */
    const days = await page.evaluate(() => {
      const d = new Date(), y = d.getFullYear(), m = d.getMonth();
      const iso = n => `${y}-${String(m + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      /* WEEKDAYS (11 Oct 2026): a day opens its Monday-to-Friday week, so the
         fixture's days are a Wednesday on or after the 8th, the Thursday after
         it and the Wednesday a week on — all inside this month on any date. */
      let w = 8; while (new Date(y, m, w).getDay() !== 3) w++;
      const grid = { many: iso(w), one: iso(w + 1), twice: iso(w + 7) };
      const pinned = [grid.many, grid.one, grid.twice];
      let soon = null;
      for (let off = 4; off <= 10 && !soon; off++){
        const t = new Date(); t.setDate(t.getDate() + off);
        const c = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}`
          + `-${String(t.getDate()).padStart(2, '0')}`;
        if (!pinned.includes(c)) soon = c;
      }
      return { ...grid, soon };
    });
    /* Three contracts sharing one day, one alone on another, and a fifth that
       puts TWO marks on its own day — the expiry plus the renewal decision,
       which falls on the expiry itself when no notice period is known. That
       last one is the case the count has to get right. */
    await page.evaluate(d => {
      const mk = (id, name, cp, exp, meta) => ({
        id, name, counterparty: cp, folder: 'proc', value: 1000000, status: 'Signed',
        expiry: exp, metadata: meta || { expiryDate: exp },
        rounds: [], audit: [], changes: [], obligations: [], scan: null });
      state.contracts.push(mk('CAL1', 'Freight & Distribution — EAC', 'Lori Systems', d.many));
      state.contracts.push(mk('CAL2', 'PET Bottle & Preform Supply', 'Alpha Packaging', d.many));
      state.contracts.push(mk('CAL3', 'Cold-Chain Storage', 'Africa Logistics', d.many));
      state.contracts.push(mk('CAL4', 'Marketing Retainer', 'Ogilvy EA', d.one));
      state.contracts.push(mk('CAL5', 'Raw Milk Collection', 'Nandi Dairy', d.twice,
        { expiryDate: d.twice, noticePeriodDays: 0 }));
      /* THE PANEL'S OWN ROW — see the note on `soon` above. Nothing in the grid
         checks depends on it, and the register check it shares a page with
         counts a RELATION ("more than 3 rows"), not a literal, so a sixth
         contract costs nothing there. */
      state.contracts.push(mk('CAL6', 'Depot Lease — Mombasa', 'Kilindini Holdings', d.soon));
    }, days);
    /* the calendar opens on this week and five more since round 16 (18 Oct 2026); this check is about the month, so it asks for it */
    await page.evaluate(() => { setView('calendar'); calSetView('month'); });
    await page.waitForTimeout(1200);

    /* RE-POINTED 23 Nov 2026 (P-14, Calendar the Legora + Stripe way on all four tabs, owner: "Build P-14"): the Month
       is one soft grid whose day boxes CHOOSE (data-cal-pick) — a press lights the day and the side panel says it,
       every date of it a row with its own act (calLsDaySide → calLsAct, the existing doors); the dates in a box are
       quiet marks, not doors. What the 11 Aug ask protected still stands and is asked here: a press on a busy day
       lands somewhere that names EVERY contract of the day, each one its own door, nothing hidden; a day says which
       day it is before you press it; the keyboard reaches it. The "opens its week" reading (11 Oct) is STALE. */
    const onMonth = async () => {
      await page.evaluate(() => { setView('calendar'); calSetView('month'); });
      return page.waitForFunction(() => !!document.querySelector('.cal-page.is-ls #cal-grid .cls-d[data-cal-pick]'), null, { timeout: 10000 }).then(() => true, () => false);
    };
    const sideFor = iso => page.waitForFunction(k => { const s = document.querySelector('#cal-plan .cal-ls-side'); const d = document.querySelector(`#cal-grid [data-cal-pick="${k}"]`);
      return !!s && !!d && d.classList.contains('is-chosen') && !!s.querySelector('.cls-big'); }, iso, { timeout: 8000 }).then(() => true, () => false);
    await onMonth();
    /* ---- every day box is a door: a button, a tab stop ---- */
    const cells = await page.evaluate(d => {
      const at = iso => document.querySelector(`#cal-grid .cls-d[data-cal-pick="${iso}"]`);
      const all = Array.from(document.querySelectorAll('#cal-grid .cls-d:not(.is-out)'));
      const many = at(d.many);
      return {
        allDoors: all.length >= 28 && all.length <= 31 && all.every(el => el.hasAttribute('data-cal-pick') && el.getAttribute('role') === 'gridcell' && el.getAttribute('tabindex') === '0'),
        n: all.length,
        title: many ? many.getAttribute('title') : '',
        day: new Date(d.many + 'T00:00:00').getDate(),
        evs: many ? many.querySelectorAll('.cls-ev').length : 0,
        more: many ? ((many.querySelector('.cls-more') || {}).textContent || '') : '',
        focusable: many ? many.querySelectorAll('button,[tabindex],a[href],input').length : -1,
      };
    }, days);
    check('every day of the month is a door: a cell of the month grid, a tab stop', cells.allDoors, `${cells.n} days`);
    check('and it says which day it is before you press it', new RegExp('\\b' + cells.day + '\\b').test(cells.title || ''), cells.title);
    check('a busy day shows what fits and says how many more',
      cells.evs >= 1 && cells.evs <= 2 && /\+\s*\d+/.test(cells.more), `${cells.evs} mark(s), ${JSON.stringify(cells.more)}`);
    check('no keyboard stop inside the box leads anywhere else', cells.focusable === 0, `${cells.focusable} focusable inside`);

    /* ---- pressing the day chooses it: the panel names every contract it carried, each its own door ---- */
    await page.click(`#cal-grid .cls-d[data-cal-pick="${days.many}"] .cls-n`);
    const chose = await sideFor(days.many);
    const side = await page.evaluate(() => {
      const s = document.querySelector('#cal-plan .cal-ls-side');
      const acts = s ? Array.from(s.querySelectorAll('button[data-cal-ct]')) : [];
      return { view: calView(), ids: acts.map(b => b.getAttribute('data-cal-ct')).filter((v, i, a) => a.indexOf(v) === i).sort() };
    });
    check('pressing a day chooses it and opens nothing', chose && side.view === 'month', `${side.view} · chosen ${chose}`);
    check('and the panel names every contract the day carried — nothing hidden, each its own door',
      JSON.stringify(side.ids) === JSON.stringify(['CAL1', 'CAL2', 'CAL3']), side.ids.join(', '));
    if (side.ids.includes('CAL2')) await page.evaluate(() => document.querySelector('#cal-plan .cal-ls-side button[data-cal-ct="CAL2"]').click());
    const opened2 = await page.waitForFunction(() => state.activeId === 'CAL2', null, { timeout: 8000 }).then(() => true, () => false);
    check('each of them opens its own contract', opened2, String(await page.evaluate(() => state.activeId)));

    /* ---- the keyboard chooses a day too ---- */
    await onMonth();
    await page.focus(`#cal-grid .cls-d[data-cal-pick="${days.one}"]`);
    await page.keyboard.press('Enter');
    check('Enter on a day chooses it as well', await sideFor(days.one));

    /* ---- the one contract of a day opens from the panel ---- */
    const one = await page.evaluate(() => Array.from(document.querySelectorAll('#cal-plan .cal-ls-side button[data-cal-ct]')).map(c => c.getAttribute('data-cal-ct')));
    if (one.length) await page.evaluate(() => document.querySelector('#cal-plan .cal-ls-side button[data-cal-ct]').click());
    const single = one.length ? await page.waitForFunction(() => state.activeId === 'CAL4', null, { timeout: 8000 }).then(() => true, () => false) : false;
    check('a contract of a one-contract day opens that contract', single && one.every(x => x === 'CAL4'), one.join(', '));

    /* THE COUNT IS OF CONTRACTS, NOT MARKS — two marks of one agreement, every door the one contract. */
    await onMonth();
    await page.click(`#cal-grid .cls-d[data-cal-pick="${days.twice}"] .cls-n`);
    await sideFor(days.twice);
    const twice = await page.evaluate(() => Array.from(document.querySelectorAll('#cal-plan .cal-ls-side button[data-cal-ct]')).map(c => c.getAttribute('data-cal-ct')));
    if (twice.length) await page.evaluate(() => document.querySelector('#cal-plan .cal-ls-side button[data-cal-ct]').click());
    const opened5 = twice.length ? await page.waitForFunction(() => state.activeId === 'CAL5', null, { timeout: 8000 }).then(() => true, () => false) : false;
    check('a day marked twice by one contract: every door is that one contract’s',
      twice.length >= 1 && twice.every(x => x === 'CAL5') && opened5, twice.join(', '));
    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
