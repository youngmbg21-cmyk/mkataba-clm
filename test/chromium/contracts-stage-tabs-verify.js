/* THE CONTRACTS TABS ARE THE STAGES (owner-asked 9 Oct 2026: "contracts page
   needs to resemble the negotiations page so add tabs in contracts that
   navigate through the stages (all, draft, review etc)").

   The owner then picked where the old quick-filter tabs go: "Into a box" — one
   labelled box on the band holding the shortcuts and the saved views.

   RE-POINTED 16 Oct 2026 (owner: "take the status choices and put them in a
   dropdown as well. You will then have 4 dropdown filters above the card",
   quick filters last): on the Contracts place the stages are the Stage box,
   the first of four on the row under the name — Stage · Stream · Category ·
   Quick filters — and the tab row is gone. Each option prints the count the
   tab printed, and a stage holding nothing is not offered.

   RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way" for the
   Contracts place, which reverses the four boxes above the card): the views
   are TABS in the shared list head — All · Needs you · In negotiation ·
   Ending in 90 days · Drafts, then the saved views and "+ Save this view" in
   the same row — and the stage is a group under "+ Filter", each choice
   printing the rows it shows; a chosen stage is a chip. No labelled box is
   drawn on the place.

   RE-POINTED 22 Oct 2026 (the owner's answer to question 2, "B": "Move those
   four under + Filter — exactly the five drawn tabs"): Term already ended,
   Auto-renewing soon, Overdue obligations and Details to fill are no longer
   tabs where they hold rows; they are one "Quick filters" group under
   + Filter (legora-lists-verify C8 drives it). So 1e asks that none of the
   four is a tab, and 3a presses one of the five drawn views.

   WHAT THIS PINS, driven in a real browser
     1 the stages are a group under + Filter, each printing its number; the
       views are the tab row, under the name row; no labelled box, no stage tabs
     2 each stage's number is the list behind it, and a pick narrows to it,
       drawn as a chip; its x takes it off
     3 the views are tabs (Needs you and In negotiation among them); a press
       narrows and lights the tab
     4 a saved view is a tab of its own in the same row, and applies its stage
     5 Negotiations keeps its own tabs and draws no stage tabs

   Run: node test/chromium/contracts-stage-tabs-verify.js */
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
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof setView === 'function' && state && state.contracts && state.contracts.length > 0, null, { timeout: 15000 });
    await page.evaluate(() => { try { localStorage.removeItem('hati.v1.regSavedViews'); } catch (_) {} (regPlaceSet({ show: 'list' }), setView('register')); });
    await page.waitForSelector('#reg-tbody [data-row]', { timeout: 10000 }).catch(() => {});

    const SEAT = '[data-reg-home] [data-lh-seat="contracts"]';
    const read = () => page.evaluate(SEAT => {
      const head = document.querySelector(SEAT);
      /* + Filter's Stage group: each stage, the count it prints */
      const add = head && head.querySelector('select[data-lh-add]');
      const grp = add ? [...add.querySelectorAll('optgroup')].find(g => g.label === i18t('reg_chip_stage')) : null;
      const stages = grp ? [...grp.querySelectorAll('option')].map(o => { const [k, v] = JSON.parse(o.value);
        return { k: v, f: k, n: Number((/\((\d+)\)\s*$/.exec(o.textContent) || [0, 0])[1]) }; }) : [];
      const tabs = head ? [...head.querySelectorAll('.reg-views [data-reg-view]')].map(b => ({ k: b.getAttribute('data-reg-view'),
        on: b.getAttribute('aria-selected') === 'true', n: Number((b.querySelector('.n') || {}).textContent || 0) })) : [];
      const nameRow = head && head.querySelector('.ct-top'), tRow = head && head.querySelector('.reg-views');
      const chip = head && head.querySelector('[data-lh-chip="stage"]');
      return { stages, tabs, head: !!head, chip: chip ? chip.textContent.replace(/\s+/g, ' ').trim() : null,
        boxes: document.querySelectorAll('[data-reg-home] .reg-fb').length,
        stageSel: !!document.querySelector('[data-reg-home] #reg-stage-sel, [data-reg-home] #reg-view-sel'),
        stageTabs: document.querySelectorAll('[data-reg-home] [data-reg-stage]').length,
        under: !!(nameRow && tRow && tRow.getBoundingClientRect().top >= nameRow.getBoundingClientRect().bottom - 1),
        saved: head ? [...head.querySelectorAll('[data-lh-saved]')].map(b => b.getAttribute('data-lh-saved')) : [],
        rows: regFiltered().length, stage: regState().stage, view: regState().view, book: state.contracts.length };
    }, SEAT);

    console.log('\n1 · the stages are under + Filter; the views are the tabs');
    const r0 = await read();
    ok('1a + Filter offers a Stage group, and the tab row starts at All, chosen', r0.head && r0.stages.length >= 2 && r0.tabs.length >= 1 && r0.tabs[0].k === '' && r0.tabs[0].on,
      r0.stages.map(t => t.k + ':' + t.n).join(' · ') + ' | ' + r0.tabs.map(t => (t.k || 'all') + (t.on ? '*' : '')).join(' · '));
    /* the stages the list at rest actually holds — each must be offered, with its number */
    const held = await page.evaluate(() => { const n = {}; regFiltered().forEach(c => { n[c.status] = (n[c.status] || 0) + 1; }); return n; });
    ok('1b every stage the list holds is a choice, printing its number',
      ['Draft', 'Under Review', 'Signed', 'Declined'].every(k => !held[k] || (r0.stages.find(t => t.k === k) || {}).n === held[k]),
      JSON.stringify(held) + ' · ' + r0.stages.map(t => t.k + ':' + t.n).join(','));
    ok('1c no stage tabs on the place — one door per fact', r0.stageTabs === 0, String(r0.stageTabs));
    ok('1d no labelled filter box and no Stage or Quick filters box on the place', r0.boxes === 0 && !r0.stageSel, `${r0.boxes} boxes · select ${r0.stageSel}`);
    ok('1e the views are tabs in the drawing\'s order, each one that is drawn holding rows, and only the five drawn',
      (() => { const order = ['', 'needs', 'nego', 'expiring90', 'drafts']; const ks = r0.tabs.map(t => t.k).filter(k => order.includes(k));
        return JSON.stringify(ks) === JSON.stringify(order.filter(k => ks.includes(k))) && r0.tabs.every(t => t.k === '' || t.on || t.n > 0)
          && r0.tabs.every(t => order.includes(t.k)); })(),
      r0.tabs.map(t => (t.k || 'all') + ':' + t.n).join(' · '));
    ok('1f the tab row sits under the name row', r0.under);
    ok('1g a stage that holds nothing is not offered', r0.stages.every(t => t.n > 0), JSON.stringify(r0.stages));

    console.log('\n2 · a stage narrows to the number it prints');
    const withRows = r0.stages.filter(t => t.n > 0);
    ok('2a the seeded book has at least two stages to pick', withRows.length >= 2, withRows.map(t => t.k).join(','));
    for (const t of withRows.slice(0, 3)) {
      await page.selectOption(SEAT + ' select[data-lh-add]', JSON.stringify(['stage', t.k]));
      await page.waitForFunction(k => regState().stage === k, t.k, { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(S => !!document.querySelector(S + ' [data-lh-chip="stage"]'), SEAT, { timeout: 5000 }).catch(() => {});
      const r = await read();
      ok(`2b "${t.k}" narrows to its own ${t.n}, and stands as a chip`, r.stage === t.k && r.rows === t.n && !!r.chip,
        `stage ${r.stage} · rows ${r.rows} · chip ${r.chip}`);
      await page.click(SEAT + ' [data-lh-x="stage"]').catch(() => {});
      await page.waitForFunction(() => regState().stage === 'all', null, { timeout: 5000 }).catch(() => {});
    }
    const rX = await read();
    ok('2c the chip\'s x takes the stage off, and the whole list is back', rX.stage === 'all' && !rX.chip && rX.rows === r0.rows, `stage ${rX.stage} · ${rX.rows} rows`);
    /* the drawing's All prints the whole list's number ("All 189"), as every
       list head's All does — the old box's All printed none */
    ok('2d All prints the number of the whole list', r0.tabs[0].n === r0.rows && r0.rows > 0, `All ${r0.tabs[0].n} · ${r0.rows} rows`);

    console.log('\n3 · the views are tabs');
    const tabWith = k => (r0.tabs.find(t => t.k === k) || {}).n || 0;
    const pick = ['nego', 'expiring90', 'drafts', 'needs'].find(k => tabWith(k) > 0);
    ok('3a a view with rows is a tab to press', !!pick, r0.tabs.map(t => t.k).join(','));
    if (pick) {
      await page.click(`${SEAT} [data-reg-view="${pick}"]`);
      await page.waitForFunction(k => regState().view === k, pick, { timeout: 5000 }).catch(() => {});
      const r3 = await read();
      const lit = r3.tabs.find(t => t.on);
      ok(`3b a press puts "${pick}" in force, lights its tab, and the rows are its number`, r3.view === pick && lit && lit.k === pick && r3.rows === tabWith(pick),
        `view ${r3.view} · lit ${lit && lit.k} · rows ${r3.rows} vs ${tabWith(pick)}`);
      await page.click(`${SEAT} [data-reg-view=""]`);
      await page.waitForFunction(() => !regState().view, null, { timeout: 5000 }).catch(() => {});
      ok('3c All takes it off again', !(await read()).view);
    }
    ok('3d the archive is its own button beside List | Wall, not a tab',
      !r0.tabs.some(t => t.k === 'archived') && await page.evaluate(() => !!document.querySelector('[data-reg-home] [data-ct-archive]')));

    console.log('\n4 · a saved view is a tab of its own');
    await page.evaluate(() => { regState().stage = 'Signed'; regRepaint(); });
    await page.waitForFunction(() => regState().stage === 'Signed', null, { timeout: 5000 }).catch(() => {});
    const saved = await page.evaluate(() => regSaveView('Signed book'));
    await page.evaluate(() => { regState().stage = 'all'; regRepaint(); });
    await page.waitForFunction(S => !!document.querySelector(S + ' [data-lh-saved="Signed book"]'), SEAT, { timeout: 5000 }).catch(() => {});
    const r4a = await read();
    ok('4a the saved view stands in the tab row', saved && r4a.saved.includes('Signed book'), r4a.saved.join(','));
    if (r4a.saved.includes('Signed book')) {
      await page.click(`${SEAT} [data-lh-saved="Signed book"]`);
      await page.waitForFunction(() => regState().stage === 'Signed', null, { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(S => !!document.querySelector(S + ' [data-lh-chip="stage"]'), SEAT, { timeout: 5000 }).catch(() => {});
      const r4 = await read();
      const on = await page.evaluate(S => { const t = document.querySelector(S + ' [data-lh-saved="Signed book"]'); const w = t && t.closest('.reg-vtab'); return !!(w && w.classList.contains('on')); }, SEAT);
      ok('4b pressing it puts its stage back, its tab lit, and the Stage chip says so', r4.stage === 'Signed' && on && !!r4.chip, `stage ${r4.stage} · lit ${on} · chip ${r4.chip}`);
      ok('4c and its tab carries the x that forgets it', await page.evaluate(S => !!document.querySelector(S + ' [data-lh-saved-x="Signed book"]'), SEAT));
    }

    console.log('\n5 · Negotiations keeps its own');
    await page.evaluate(() => { regState().stage = 'all'; setView('negotiations'); });
    await page.waitForTimeout(900);
    const neg = await page.evaluate(() => ({ stageTabs: document.querySelectorAll('.reg-stage-tabs').length,
      viewBox: !!document.getElementById('reg-view-sel') }));
    ok('5a no stage tabs and no quick-filters box on Negotiations', neg.stageTabs === 0 && !neg.viewBox, JSON.stringify(neg));
  } catch (e) {
    fail++; console.log('  FAIL harness — ' + e.message);
  }
  ok('no page errors', errs.length === 0, errs.join(' | '));
  console.log(pass + ' passed, ' + fail + ' failed');
  await b.close();
  await h.stop();
  process.exit(fail ? 1 : 0);
})();
