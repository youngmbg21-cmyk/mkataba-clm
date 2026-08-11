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

    /* ---- a chip inside a day still opens its own contract, once ---- */
    await page.evaluate(() => setView('calendar'));
    await page.waitForTimeout(1000);
    const chipGo = await page.evaluate(d => {
      const cell = document.querySelector(`[data-cal-day="${d.many}"]`);
      const chip = cell.querySelector('[data-sel]');
      const want = chip.getAttribute('data-sel');
      chip.click();
      return { want };
    }, days);
    await page.waitForTimeout(1200);
    const afterChip = await page.evaluate(() => ({ view: state.view, id: state.activeId,
      only: state.reg && state.reg.only }));
    check('a named contract inside the box still opens that contract, not the list',
      afterChip.id === chipGo.want && afterChip.only == null,
      `${afterChip.view} · ${afterChip.id} (wanted ${chipGo.want})`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
