/* "ADAPT FILTERS" — the filter bar shows a chosen subset (25 Aug 2026).
   SAP Fiori's pattern, and the answer to the problem this bar actually had:
   it would not fit on one line, and WO-15 solved that on 24 Aug by deleting
   the Renewal filter outright.

   THIS DOES NOT REVERSE THAT RULING — the default bar is exactly what shipped
   before, Renewal off it — and the test asserts that first, because a default
   that quietly changed would be reversing an owner's decision by accident.

   THE SAFETY PROPERTY IS THE POINT OF SECTION 4: a filter that is narrowing
   the list draws whether or not it was chosen. WO-15's own note says the
   control was removed "so the filter can never be quietly on"; a chooser that
   let a reader hide an active filter would put that fault straight back. 
   RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way" for the
   Contracts place): the labelled boxes and their chooser are not drawn on the
   place any more — "+ Filter" offers every filter of the catalogue and a
   chosen one is a chip. THE SAFETY PROPERTY STANDS, and is what this file
   still pins: a filter that is narrowing the list always draws (a chip is
   drawn exactly when its value is away from its rest), so it can never be
   quietly on; and Renewal, which the owner twice asked off the bar, is not
   drawn at rest — it is one of + Filter's groups. The full table outside
   Home (no computer reaches it now: setView('register') lands on Home) keeps
   the old chooser untouched. */

const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

const SEAT = '[data-reg-home] [data-lh-seat="contracts"]';
(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  const land = async () => {
    await page.waitForFunction(() => typeof setView === 'function' && window.state && state.contracts && state.contracts.length > 0, null, { timeout: 20000 });
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForFunction(S => !!document.querySelector(S) && !!document.querySelector('#reg-tbody [data-row]'), SEAT, { timeout: 10000 }).catch(() => {});
  };

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await land();

  /* what the head draws: the chips standing, + Filter's groups */
  const onHead = () => page.evaluate(S => {
    const head = document.querySelector(S);
    const add = head && head.querySelector('select[data-lh-add]');
    return {
      head: !!head,
      chips: head ? [...head.querySelectorAll('[data-lh-chip]')].map(c => c.getAttribute('data-lh-chip')) : [],
      groups: add ? [...add.querySelectorAll('optgroup')].map(g => {
        const o = g.querySelector('option'); return o ? JSON.parse(o.value)[0] : g.label; }) : [],
      adapt: !!document.getElementById('reg-adapt'),
      boxes: document.querySelectorAll('[data-reg-home] .reg-fb').length,
    };
  }, SEAT);
  /* a chip, whole, inside the chip row, and the page not wider than the window */
  const chipFits = k => page.evaluate(([S, k]) => {
    const row = document.querySelector(S + ' .lh-chips'), el = document.querySelector(`${S} [data-lh-chip="${k}"]`);
    if (!row || !el) return null;
    const b = row.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { drawn: r.width > 0 && r.height > 0, inside: r.right <= b.right + 1 && r.bottom <= b.bottom + 1 && r.left >= b.left - 1,
      wide: document.documentElement.scrollWidth <= window.innerWidth + 1 };
  }, [SEAT, k]);

  console.log('\n1 · at rest nothing narrows, so no filter is drawn');
  const d = await onHead();
  ok('the list head stands, with no chip and no labelled box', d.head && d.chips.length === 0 && d.boxes === 0, JSON.stringify(d));
  ok('Renewal is NOT drawn at rest — the owner asked for that twice', !d.chips.includes('renewal'));
  ok('the old chooser (Adapt filters) is not drawn: + Filter is the one door to every filter', !d.adapt);

  console.log('\n2 · + Filter is the catalogue');
  const catalogue = await page.evaluate(() => REG_CT_FILTERS.slice());
  ok('every group it offers is a filter of the catalogue', d.groups.length > 0 && d.groups.every(k => catalogue.includes(k)), d.groups.join(', ') + ' of ' + catalogue.join(', '));
  ok('and Stage and Stream, the two the register is always asked, are offered', d.groups.includes('stage') && d.groups.includes('type'), d.groups.join(', '));
  /* the filters' own counts, read when the list is standing — AND its filters can count (22 Oct 2026:
     on CI they were read once in the beat the book was swapped, "7 groups for 0"); bounded */
  await page.waitForFunction(() => regFiltered().length > 0
    && regCtFilters().some(f => (f.opts || []).some(o => o[2] == null || o[2] > 0)), null, { timeout: 8000 }).catch(() => {});
  const withRows = await page.evaluate(() => regCtFilters().filter(f => (f.opts || []).some(o => o[2] == null || o[2] > 0)).map(f => f.k));
  ok('it offers every filter that has a choice with rows, and no more', JSON.stringify(withRows.slice().sort()) === JSON.stringify(d.groups.slice().sort()),
    `${d.groups.length} groups for ${withRows.length}: ${withRows.join(', ')}`);

  console.log('\n3 · a filter the reader picks is a chip');
  /* Renewal first (the filter the owner asked off the bar), else the first
     other filter whose choice holds rows on this book */
  const pick = await page.evaluate(() => { const fs = regCtFilters();
    for (const k of ['renewal', 'signed', 'category', 'payterms', 'docs', 'hold']){
      const f = fs.find(x => x.k === k), o = f && f.opts.find(x => x[2] == null || x[2] > 0);
      if (o) return [k, String(o[0])]; }
    return null; });
  ok('the book has a filter beyond Stage and Stream with a choice to pick', !!pick, JSON.stringify(pick));
  if (pick) {
    await page.selectOption(SEAT + ' select[data-lh-add]', JSON.stringify(pick));
    await page.waitForFunction(([S, k]) => !!document.querySelector(`${S} [data-lh-chip="${k}"]`), [SEAT, pick[0]], { timeout: 5000 }).catch(() => {});
    const six = await chipFits(pick[0]);
    ok('it is drawn, whole, inside the chip row', !!six && six.drawn && six.inside, JSON.stringify(six));
    ok('and choosing it never makes the page scroll sideways', !!six && six.wide);
    for (const w of [1760, 1366]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForFunction(w => window.innerWidth === w, w, { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(([S, k]) => !!document.querySelector(`${S} [data-lh-chip="${k}"]`), [SEAT, pick[0]], { timeout: 5000 }).catch(() => {});
      const st = await chipFits(pick[0]);
      ok('and it still holds at ' + w, !!st && st.drawn && st.inside && st.wide, JSON.stringify(st));
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    console.log('\n4 · it is the reader\'s own, and it lasts');
    await page.reload({ waitUntil: 'networkidle' });
    await land();
    await page.waitForFunction(([S, k]) => !!document.querySelector(`${S} [data-lh-chip="${k}"]`), [SEAT, pick[0]], { timeout: 8000 }).catch(() => {});
    ok('remembered across a reload', (await onHead()).chips.includes(pick[0]), JSON.stringify((await onHead()).chips));

    console.log('\n5 · a filter that is narrowing the list can never hide');
    ok('the reading agrees it is active while its chip stands',
      await page.evaluate(k => regFilterActive(k), pick[0]));
    ok('and + Filter no longer offers it (one door per fact)', !(await onHead()).groups.includes(pick[0]));
    await page.click(`${SEAT} [data-lh-x="${pick[0]}"]`).catch(() => {});
    await page.waitForFunction(k => !regFilterActive(k), pick[0], { timeout: 5000 }).catch(() => {});
    const back = await onHead();
    ok('once it stops narrowing (its x), it goes away again, back under + Filter', !back.chips.includes(pick[0]) && back.groups.includes(pick[0]), JSON.stringify(back));
  }

  console.log('\n6 · nothing else moved');
  ok('no sideways scroll',
     await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  ok('the table still draws its rows',
     (await page.evaluate(() => document.querySelectorAll('#reg-tbody [data-row]').length)) > 0);

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
