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
   let a reader hide an active filter would put that fault straight back. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (n, c, d) => { c ? pass++ : fail++; console.log((c ? '  ok   ' : '  FAIL ') + n + (d ? '  → ' + d : '')); };

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
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);

  const onBar = () => page.evaluate(() => ({
    stage:    !!document.getElementById('reg-stage-sel'),
    type:     !!document.getElementById('reg-type-sel'),
    view:     !!document.getElementById('reg-view-sel'),
    category: !!document.getElementById('reg-category'),
    renewal:  !!document.getElementById('reg-renewal'),
  }));
  /* MEASURING "ONE LINE" IS NOT COUNTING EDGES, AND THIS CHECK WAS WRONG
     TWICE BEFORE IT WAS RIGHT. The bar is align-items:flex-end, so counting
     TOPS reported 3 rows on the shipped default; counting BOTTOMS reported 2,
     because the Adapt link is a shorter control than a labelled select and
     its baseline sits a few pixels up. MEASURED: the bar is 1344x50 with
     every labelled filter at y=0 — one line.
     So the honest question is whether the bar is TALLER THAN ONE ROW OF ITS
     OWN CONTENT. If it wraps, its height is roughly a multiple of its tallest
     child; if it does not, the two are the same. */
  const barLines = () => page.evaluate(() => {
    const bar = document.querySelector('.reg-filterbar');
    if (!bar) return -1;
    const kids = [...bar.children]
      .map(c => c.getBoundingClientRect())
      .filter(r => r.width > 0 && r.height > 0);
    if (!kids.length) return -1;
    const tallest = Math.max(...kids.map(r => r.height));
    return Math.max(1, Math.round(bar.getBoundingClientRect().height / tallest));
  });

  console.log('\n1 · the default bar is exactly what shipped before');
  const d = await onBar();
  ok('stage, stream, saved view and category are on it',
     d.stage && d.type && d.view && d.category, JSON.stringify(d));
  ok('Renewal is NOT — the owner asked for that twice', d.renewal === false);
  ok('the bar is one line', (await barLines()) === 1, (await barLines()) + ' line(s)');
  ok('the door to the rest is drawn', await page.evaluate(() => !!document.getElementById('reg-adapt')));

  console.log('\n2 · the chooser');
  await page.click('#reg-adapt');
  await page.waitForTimeout(500);
  const dlg = await page.evaluate(() => {
    const m = document.querySelector('#modal-root [role="dialog"]');
    return { open: !!m, named: !!(m && m.getAttribute('aria-label')),
             boxes: document.querySelectorAll('[data-adapt]').length,
             locked: document.querySelectorAll('[data-adapt][disabled]').length };
  });
  ok('it opens through openModal, so it is a real dialog', dlg.open && dlg.named);
  /* ---- REVERSED IN PLACE 31 Aug 2026 (J-5.1) ---- It was five and is six:
     Signed joined the catalogue, deliberately outside the default four, so it
     costs the bar nothing until a reader asks for it. THE CLAIM IS PINNED AS A
     RELATION rather than a number — the chooser offers exactly what the
     catalogue holds — so the next filter costs no test edit, which is this
     rulebook's own rule. */
  const catalogue = await page.evaluate(() => REG_BAR_FILTERS.map(f => f.k));
  ok('it offers every filter the catalogue holds, and no more',
    dlg.boxes === catalogue.length, `${dlg.boxes} boxes for ${catalogue.length}: ${catalogue.join(', ')}`);
  ok('and Signed is one of them, off by default',
    catalogue.includes('signed') && !(await page.evaluate(() => REG_BAR_DEFAULT.includes('signed'))));
  ok('the two the register is always asked are locked on', dlg.locked === 2, dlg.locked + ' locked');

  await page.check('[data-adapt="renewal"]');
  await page.click('#reg-adapt-done');
  await page.waitForTimeout(700);
  ok('ticking Renewal puts it on the bar', (await onBar()).renewal === true);
  /* THIS PINNED THE COST — a sixth filter took a second line at 1440, which
     was the honest claim when it was written and is the very constraint WO-15
     was up against. It is REVERSED IN PLACE 26 Aug 2026, and by somebody
     else's change rather than by this file: the register's rows came down a
     rung (WO-16, owner-asked) and the bar's own controls with them, so six
     filters now fit at 1440 where five barely did.
     A COST THAT HAS GONE IS NOT A FAILURE, and pinning it would make the next
     type change look like a regression. WHAT THE CLAIM PROTECTS IS UNCHANGED
     and is asserted the other way up: whatever the reader chooses, the bar
     never hides a filter and never scrolls the page sideways — it wraps if it
     must. The DEFAULT staying on one line is section 1's claim and is the one
     that carries the owner's ruling. */
  const six = await page.evaluate(() => {
    const bar = document.querySelector('.reg-filterbar');
    const el  = document.getElementById('reg-renewal');
    if (!bar || !el) return null;
    const b = bar.getBoundingClientRect(), r = el.getBoundingClientRect();
    return { drawn: r.width > 0 && r.height > 0,
             inside: r.right <= b.right + 1 && r.bottom <= b.bottom + 1,
             wide: document.documentElement.scrollWidth <= window.innerWidth + 1,
             lines: 0 };
  });
  ok('the sixth filter the reader chose is drawn, whole, inside the bar',
     !!six && six.drawn && six.inside, JSON.stringify(six));
  ok('and choosing it never makes the page scroll sideways', !!six && six.wide);
  for (const w of [1760, 1366]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(500);
    const st = await page.evaluate(() => {
      const bar = document.querySelector('.reg-filterbar');
      const el  = document.getElementById('reg-renewal');
      if (!bar || !el) return null;
      const b = bar.getBoundingClientRect(), r = el.getBoundingClientRect();
      return { drawn: r.width > 0, inside: r.right <= b.right + 1 && r.bottom <= b.bottom + 1,
               wide: document.documentElement.scrollWidth <= window.innerWidth + 1 };
    });
    ok('and it still holds at ' + w, !!st && st.drawn && st.inside && st.wide, JSON.stringify(st));
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(400);

  console.log('\n3 · it is the reader\'s own, and it lasts');
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1600);
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(900);
  ok('remembered across a reload', (await onBar()).renewal === true);

  console.log('\n4 · a filter that is narrowing the list can never hide');
  /* Turn Renewal ON, then take it OFF the bar. It must still draw. */
  await page.evaluate(() => { const R = regState(); R.renewal = 'auto-renew'; R.page = 1; regRepaint(); });
  await page.waitForTimeout(600);
  await page.evaluate(() => { regBarSetChosen(['stage', 'type', 'view', 'category']); regRepaint(); });
  await page.waitForTimeout(600);
  ok('it is NOT in the reader\'s chosen set',
     await page.evaluate(() => !regBarChosen().includes('renewal')));
  ok('but it draws anyway, because it is cutting the book',
     (await onBar()).renewal === true);
  ok('and the reading agrees it is active',
     await page.evaluate(() => regFilterActive('renewal')));

  /* clear it, and now it may hide */
  await page.evaluate(() => { const R = regState(); R.renewal = 'all'; regRepaint(); });
  await page.waitForTimeout(600);
  ok('once it stops narrowing, it goes away again', (await onBar()).renewal === false);

  console.log('\n5 · reset');
  await page.click('#reg-adapt');
  await page.waitForTimeout(450);
  await page.click('#reg-adapt-reset');
  await page.waitForTimeout(700);
  const back = await onBar();
  ok('reset restores the shipped default',
     back.stage && back.type && back.view && back.category && !back.renewal, JSON.stringify(back));

  console.log('\n6 · nothing else moved');
  ok('no sideways scroll',
     await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth));
  ok('the table still draws its rows',
     (await page.evaluate(() => document.querySelectorAll('#reg-tbody [data-row]').length)) > 0);

  console.log('\n' + (errs.length ? 'PAGE ERRORS: ' + errs.join(' | ') : 'no page errors'));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS:', e.message); process.exit(2); });
