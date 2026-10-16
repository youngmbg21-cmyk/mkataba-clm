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

   WHAT THIS PINS, driven in a real browser
     1 the stages are the Stage box, first of the four on the filter row,
       which sits under the name row; no stage tabs on the place
     2 each option's number is the list behind it, and a pick narrows to it
     3 the quick filters are a box (In negotiation among them); a pick
       narrows and lights the box
     4 a saved view is kept and applied from the box
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

    const read = () => page.evaluate(() => {
      const sel = document.getElementById('reg-stage-sel');
      /* the Stage box's options: each stage, the count it prints */
      const tabs = sel ? [...sel.options].map(o => ({ k: o.value, on: o.selected,
        n: Number((/\((\d+)\)\s*$/.exec(o.textContent) || [0, 0])[1]) })) : [];
      const book = state.contracts.length;
      const place = document.querySelector('[data-reg-home] .ct-head');
      const boxes = place ? [...place.querySelectorAll('.ct-filters .reg-fb select')].map(x => x.id) : [];
      const nameRow = place && place.querySelector('.ct-top'), fRow = place && place.querySelector('.ct-filters');
      return { tabs, stageBox: !!sel, boxes, stageTabs: document.querySelectorAll('[data-reg-home] [data-reg-stage]').length,
        under: !!(nameRow && fRow && fRow.getBoundingClientRect().top >= nameRow.getBoundingClientRect().bottom - 1),
        viewBox: !!document.getElementById('reg-view-sel'),
        oldViewTabs: document.querySelectorAll('.reg-views [data-reg-view]').length,
        rows: regFiltered().length, stage: regState().stage, view: regState().view, book };
    });

    console.log('\n1 · the stages are the Stage box, first of the four above the card');
    const r0 = await read();
    ok('1a the place draws the Stage box, All chosen first', r0.stageBox && r0.tabs.length >= 3 && r0.tabs[0].k === 'all' && r0.tabs[0].on,
      r0.tabs.map(t => t.k + (t.on ? '*' : '')).join(' · '));
    /* the stages the list at rest actually holds — each must be offered, with its number */
    const held = await page.evaluate(() => { const n = {}; regFiltered().forEach(c => { n[c.status] = (n[c.status] || 0) + 1; }); return n; });
    ok('1b every stage the list holds is a choice, printing its number',
      ['Draft', 'Under Review', 'Signed', 'Declined'].every(k => !held[k] || (r0.tabs.find(t => t.k === k) || {}).n === held[k]),
      JSON.stringify(held) + ' · ' + r0.tabs.map(t => t.k + ':' + t.n).join(','));
    ok('1c no stage tabs on the place — one door per fact', r0.stageTabs === 0, String(r0.stageTabs));
    ok('1d the old quick-filter tab row is gone', r0.oldViewTabs === 0, String(r0.oldViewTabs));
    ok('1e the four boxes in the owner\'s order: Stage · Stream · Category · Quick filters',
      JSON.stringify(r0.boxes) === JSON.stringify(['reg-stage-sel', 'reg-type-sel', 'reg-category', 'reg-view-sel']), r0.boxes.join(' · '));
    ok('1f the filter row sits under the name row, just above the card', r0.under);
    ok('1g a stage that holds nothing is not offered', r0.tabs.every(t => t.k === 'all' || t.on || t.n > 0), JSON.stringify(r0.tabs));

    console.log('\n2 · a stage narrows to the number it prints');
    const withRows = r0.tabs.filter(t => t.k !== 'all' && t.n > 0);
    ok('2a the seeded book has at least two stages to pick', withRows.length >= 2, withRows.map(t => t.k).join(','));
    for (const t of withRows.slice(0, 3)) {
      await page.selectOption('#reg-stage-sel', t.k);
      await page.waitForFunction(k => regState().stage === k, t.k, { timeout: 5000 }).catch(() => {});
      const r = await read();
      const lit = r.tabs.find(x => x.on);
      const chip = await page.evaluate(() => { const s = document.getElementById('reg-stage-sel'); const c = s && s.closest('.reg-chip'); return !!(c && c.classList.contains('on')); });
      ok(`2b "${t.k}" narrows to its own ${t.n}, is the one chosen, and lights the box`, r.stage === t.k && r.rows === t.n && lit && lit.k === t.k && chip,
        `stage ${r.stage} · rows ${r.rows} · chosen ${lit && lit.k}`);
    }
    ok('2c All prints no number (the list\'s own count line names the whole), as the Quick filters box\'s All does', r0.tabs[0].n === 0 && r0.rows > 0,
      `${r0.rows} rows`);
    await page.selectOption('#reg-stage-sel', 'all');
    await page.waitForFunction(() => regState().stage === 'all', null, { timeout: 5000 }).catch(() => {});

    console.log('\n3 · the quick filters are a box');
    const r3 = await read();
    ok('3a the box is on the band', r3.viewBox);
    if (r3.viewBox) {
      const opts = await page.$$eval('#reg-view-sel option', o => o.map(x => x.value));
      ok('3b it holds All, the shortcuts (In negotiation among them) and the save act',
        opts[0] === '' && ['expiring90', 'expired', 'autosoon', 'nego', 'overdueob', 'archived'].every(k => opts.includes(k)) && opts.includes('act:save'),
        opts.join(','));
      await page.selectOption('#reg-view-sel', 'archived');
      await page.waitForFunction(() => regState().view === 'archived', null, { timeout: 5000 }).catch(() => {});
      const lit = await page.evaluate(() => { const s = document.getElementById('reg-view-sel'); const c = s && s.closest('.reg-chip'); return { on: !!(c && c.classList.contains('on')), v: s && s.value }; });
      ok('3c a pick puts the shortcut in force and lights the box', (await read()).view === 'archived' && lit.on && lit.v === 'archived', JSON.stringify(lit));
      await page.selectOption('#reg-view-sel', '');
      await page.waitForFunction(() => !regState().view, null, { timeout: 5000 }).catch(() => {});
      ok('3d All takes it off again', !(await read()).view);

      console.log('\n4 · a saved view lives in the box');
      await page.selectOption('#reg-stage-sel', 'Signed');
      await page.waitForFunction(() => regState().stage === 'Signed', null, { timeout: 5000 }).catch(() => {});
      const saved = await page.evaluate(() => regSaveView('Signed book'));
      await page.evaluate(() => { regState().stage = 'all'; regRepaint(); });
      await page.waitForTimeout(300);
      const has = await page.$$eval('#reg-view-sel option', o => o.map(x => x.value));
      ok('4a the saved view is offered under the box', saved && has.includes('saved:Signed book'), has.join(','));
      if (has.includes('saved:Signed book')) {
        await page.selectOption('#reg-view-sel', 'saved:Signed book');
        await page.waitForFunction(() => regState().stage === 'Signed', null, { timeout: 5000 }).catch(() => {});
        const r4 = await read();
        ok('4b choosing it puts its stage back, and the Stage box says so', r4.stage === 'Signed' && (r4.tabs.find(t => t.on) || {}).k === 'Signed',
          `stage ${r4.stage}`);
        const forget = await page.$$eval('#reg-view-sel option', o => o.map(x => x.value));
        ok('4c and while it is in force the box offers to forget it', forget.includes('act:forget:Signed book'), forget.join(','));
      }
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
