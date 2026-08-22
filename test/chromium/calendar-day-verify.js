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

    /* Three days inside the month the calendar opens on. */
    const days = await page.evaluate(() => {
      const d = new Date(), y = d.getFullYear(), m = d.getMonth();
      const iso = n => `${y}-${String(m + 1).padStart(2, '0')}-${String(n).padStart(2, '0')}`;
      return { many: iso(12), one: iso(18), twice: iso(22) };
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
    }, days);
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1200);

    /* ---- the box is a door, and only where there is something behind it ---- */
    const cells = await page.evaluate(d => {
      const at = iso => document.querySelector(`[data-cal-day="${iso}"]`);
      const empty = Array.from(document.querySelectorAll('.cal-day:not(.cal-blank)'))
        .filter(el => !el.hasAttribute('data-cal-day'));
      return {
        many: !!at(d.many), one: !!at(d.one), twice: !!at(d.twice),
        manyTitle: at(d.many) ? at(d.many).getAttribute('title') : '',
        oneTitle: at(d.one) ? at(d.one).getAttribute('title') : '',
        twiceTitle: at(d.twice) ? at(d.twice).getAttribute('title') : '',
        manyRole: at(d.many) ? at(d.many).getAttribute('role') : '',
        emptyDays: empty.length,
      };
    }, days);
    check('a day carrying contracts is pressable', cells.many && cells.one && cells.twice);
    check('an empty day is not', cells.emptyDays > 0, `${cells.emptyDays} quiet days`);
    check('and it says which door it is before you press it',
      /Choose from the 3 contracts/.test(cells.manyTitle) && /^Open /.test(cells.oneTitle),
      cells.manyTitle);
    check('a screen reader is told it is a button', cells.manyRole === 'button');

    /* THE COUNT IS OF CONTRACTS, NOT MARKS. Two events, one agreement. */
    check('two marks from one contract is still one contract',
      /^Open /.test(cells.twiceTitle), cells.twiceTitle);

    /* ---- many → the register, narrowed to exactly those ---- */
    await page.evaluate(d => document.querySelector(`[data-cal-day="${d.many}"]`).click(), days);
    await page.waitForTimeout(1400);
    const reg = await page.evaluate(() => ({
      view: state.view,
      only: state.reg && state.reg.only ? state.reg.only.ids.slice().sort() : null,
      label: state.reg && state.reg.only ? state.reg.only.label : '',
      rows: Array.from(document.querySelectorAll('#reg-tbody tr')).length,
      ids: Array.from(document.querySelectorAll('#reg-tbody .reg-mk')).map(e => e.textContent.trim()).sort(),
      chip: !!document.getElementById('reg-only-chip'),
      chipText: (document.getElementById('reg-only-chip') || {}).textContent || '',
      canClear: !!document.getElementById('reg-only-clear'),
    }));
    check('pressing a day of several lands on the register', reg.view === 'register');
    check('narrowed to exactly the contracts that were on that day',
      reg.rows === 3 && JSON.stringify(reg.ids) === JSON.stringify(['CAL1', 'CAL2', 'CAL3']),
      `${reg.rows} row(s): ${reg.ids.join(', ')}`);
    check('the register says it has been narrowed, and why',
      reg.chip && /Due on/.test(reg.chipText.replace(/\s+/g, ' ')),
      reg.chipText.replace(/\s+/g, ' ').trim());
    check('and the way back is on the chip', reg.canClear);

    /* ---- the other filters still work INSIDE the set ---- */
    await page.evaluate(() => { const R = regState(); R.stage = 'Draft'; R.page = 1; renderRegister(); });
    await page.waitForTimeout(600);
    const inside = await page.evaluate(() => ({
      rows: Array.from(document.querySelectorAll('#reg-tbody .reg-mk')).length,
      chip: !!document.getElementById('reg-only-chip'),
    }));
    check('a filter on top of the set narrows within it rather than replacing it',
      inside.rows === 0 && inside.chip, `${inside.rows} row(s), chip still shown`);
    await page.evaluate(() => { const R = regState(); R.stage = 'all'; renderRegister(); });
    await page.waitForTimeout(500);

    /* ---- clearing gives the whole register back ---- */
    await page.evaluate(() => document.getElementById('reg-only-clear').click());
    await page.waitForTimeout(800);
    const cleared = await page.evaluate(() => ({
      only: state.reg.only,
      chip: !!document.getElementById('reg-only-chip'),
      rows: Array.from(document.querySelectorAll('#reg-tbody .reg-mk')).length,
    }));
    check('clearing it gives the whole register back',
      cleared.only == null && !cleared.chip && cleared.rows > 3, `${cleared.rows} rows`);

    /* ---- one contract opens straight into it ---- */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1000);
    await page.evaluate(d => document.querySelector(`[data-cal-day="${d.one}"]`).click(), days);
    await page.waitForTimeout(1400);
    const single = await page.evaluate(() => ({ view: state.view, id: state.activeId,
      only: state.reg && state.reg.only }));
    check('a day with one contract opens that contract instead',
      single.id === 'CAL4' && single.only == null, `${single.view} · ${single.id}`);

    /* ---- A CHIP INSIDE A DAY BOX IS NOT ITS OWN DOOR ANY MORE ----
       (owner-asked, 12 Aug 2026, reversing the 11 Aug decision this file used to
       assert.) The old claim was "a named contract inside the box still opens
       that contract, not the list", and the reasoning behind it was sound: a
       named thing should open the thing it names. What killed it is what the
       names actually look like at 9.5px in a 90px column — on the reported
       screen, 30 August carried nine contracts and its three visible chips all
       read "Mutual Non-Discl…". Pressing one is a guess between nine similarly
       named agreements; the register shows counterparty, status, value and
       expiry, which is what tells them apart.

       WHAT MUST STAY TRUE EITHER WAY, and is asserted below: pressing anything
       in a day box LANDS somewhere, and the landing says what it is narrowed to
       with the way back on the same chip. */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1000);
    const chipShape = await page.evaluate(d => {
      const cell = document.querySelector(`[data-cal-day="${d.many}"]`);
      const chips = Array.from(cell.querySelectorAll('.cal-chip'));
      const one = document.querySelector(`[data-cal-day="${d.one}"]`);
      return {
        n: chips.length,
        selectors: cell.querySelectorAll('[data-sel]').length,
        buttons: cell.querySelectorAll('button').length,
        focusable: cell.querySelectorAll('button,[tabindex],a[href],input').length,
        title: chips[0] ? chips[0].getAttribute('title') : 'MISSING',
        oneTitle: one.querySelector('.cal-chip')
          ? one.querySelector('.cal-chip').getAttribute('title') : 'MISSING',
        more: (cell.querySelector('.cal-more') || {}).textContent || '',
        cellTab: cell.getAttribute('tabindex'), cellRole: cell.getAttribute('role'),
      };
    }, days);
    /* ---- REVERSED IN PLACE, 22 Aug 2026 (the calendar took the mock-up) ----
       This asserted that all three chips draw and NOTHING is hidden. The cells
       had a fixed floor then; they FLEX now, so the month always shows its six
       weeks on any window and a cell cannot promise room for a third chip. The
       cap is 2, and past it the day shows one chip and says how many more —
       which is the same bargain the old "+N more" line struck, just reached
       sooner.
       WHAT THE CLAIM WAS REALLY FOR SURVIVES AND IS ASSERTED HERE: nothing is
       hidden SILENTLY. A day holding more than it can show says so, and the
       press still lands on all of them. */
    check('a day shows what fits and says how many more',
      chipShape.n >= 1 && chipShape.n <= 2 && /\+\s*\d+/.test(chipShape.more || ''),
      `${chipShape.n} chip(s), more line: ${JSON.stringify(chipShape.more)}`);
    check('but they are no longer doors of their own',
      chipShape.selectors === 0 && chipShape.buttons === 0,
      `${chipShape.selectors} data-sel, ${chipShape.buttons} button(s)`);
    check('and no keyboard stop inside the box leads nowhere new',
      chipShape.focusable === 0 && chipShape.cellTab === '0' && chipShape.cellRole === 'button',
      `${chipShape.focusable} focusable inside, cell tabindex=${chipShape.cellTab}`);
    check('a chip that no longer goes where its label points stops promising it',
      chipShape.title === null,
      'on a many-contract day the cell’s own tooltip is what the reader sees');
    check('and on a one-contract day it still names the event, because that is still where it goes',
      /^(Expiry|Renewal|Obligation)/i.test(chipShape.oneTitle || ''), chipShape.oneTitle);

    const chipGo = await page.evaluate(d => {
      const cell = document.querySelector(`[data-cal-day="${d.many}"]`);
      cell.querySelector('.cal-chip').click();
    }, days);
    await page.waitForTimeout(1400);
    const afterChip = await page.evaluate(() => ({ view: state.view,
      only: state.reg && state.reg.only ? state.reg.only.ids.slice().sort() : null,
      rows: Array.from(document.querySelectorAll('#reg-tbody .reg-mk')).map(e => e.textContent.trim()).sort(),
      chip: !!document.getElementById('reg-only-chip'),
      chipText: (document.getElementById('reg-only-chip') || {}).textContent || '',
      canClear: !!document.getElementById('reg-only-clear') }));
    check('pressing a chip on a many-contract day lands on the narrowed list',
      afterChip.view === 'register'
      && JSON.stringify(afterChip.rows) === JSON.stringify(['CAL1', 'CAL2', 'CAL3']),
      `${afterChip.view} · ${afterChip.rows.join(', ')}`);
    check('and that list still says what it is narrowed to, with the way back on it',
      afterChip.chip && /Due on/.test(afterChip.chipText.replace(/\s+/g, ' ')) && afterChip.canClear,
      afterChip.chipText.replace(/\s+/g, ' ').trim());

    /* ---- and a chip on a ONE-contract day lands exactly where it always did ---- */
    await page.evaluate(() => { document.getElementById('reg-only-clear')?.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1000);
    await page.evaluate(d => document.querySelector(`[data-cal-day="${d.one}"] .cal-chip`).click(), days);
    await page.waitForTimeout(1400);
    const chipOne = await page.evaluate(() => ({ id: state.activeId,
      only: state.reg && state.reg.only }));
    check('a chip on a one-contract day still opens that contract',
      chipOne.id === 'CAL4' && chipOne.only == null, `${chipOne.id}`);

    /* ---- a day marked TWICE by one contract is one contract, from the chip too ---- */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1000);
    await page.evaluate(d => document.querySelector(`[data-cal-day="${d.twice}"] .cal-chip`).click(), days);
    await page.waitForTimeout(1400);
    const chipTwice = await page.evaluate(() => ({ id: state.activeId,
      only: state.reg && state.reg.only }));
    check('a day marked twice by one contract still opens the contract',
      chipTwice.id === 'CAL5' && chipTwice.only == null,
      'the count is of contracts, not marks — from the chip as well as the cell');

    /* ---- THE AGENDA BESIDE THE CALENDAR IS NOT A DAY BOX ----
       It is a list of individual events, and a named row there is the one place
       on this screen where "open that contract" is the whole answer. The old
       chip handler was shared with it through [data-sel]; a change scoped to
       that selector rather than to the chips would have taken this out. */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1000);
    const agenda = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('[data-sel]'))
        .filter(el => !el.closest('[data-cal-day]'));
      if (!rows.length) return { none: true };
      const want = rows[0].getAttribute('data-sel');
      rows[0].click();
      return { want, n: rows.length };
    });
    await page.waitForTimeout(1200);
    const afterAgenda = await page.evaluate(() => ({ id: state.activeId,
      only: state.reg && state.reg.only }));
    check('the agenda list beside the calendar still opens its own named contract',
      !agenda.none && afterAgenda.id === agenda.want && afterAgenda.only == null,
      agenda.none ? 'no agenda rows to press' : `${afterAgenda.id} (wanted ${agenda.want}), ${agenda.n} row(s)`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
