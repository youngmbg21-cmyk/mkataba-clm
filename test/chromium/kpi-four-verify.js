/* Chromium verification: THE KPI RIBBON HOLDS FOUR.
   ============================================================
   Owner-asked, 13 Aug 2026: "For the 4 main KPI cards, make it so that you
   cannot have more than 4 — therefore you are limited to selecting only 4."

   The catalogue had a floor (keep at least one) and no ceiling: eleven metrics,
   all tickable, and the row across the top of Home became a list wearing card
   clothes.

   WHY THIS IS A BROWSER FILE. The rule itself is arithmetic and is pinned in
   f3. What cannot be pinned there is the half that decides whether the rule is
   USABLE:
     · a disabled checkbox and a dimmed row are computed styles — jsdom
       resolves no class rules and will happily click a control the reader
       cannot press;
     · "the panel stays open" is a claim about a popover surviving a repaint,
       and the popover lives inside the node the repaint rebuilds;
     · with a ceiling, every change is a SWAP, so the journey that matters is
       four presses long and has to be driven end to end.

   Screenshots go to test/chromium/shots/kpi-four/.
   Run: node test/chromium/kpi-four-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'kpi-four');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* The panel as a reader meets it: what is ticked, what cannot be pressed, and
   whether a row LOOKS unavailable rather than merely being unavailable. */
const PANEL = `(() => {
  const pop = document.getElementById('kpi-cust-pop');
  const rows = [...document.querySelectorAll('[data-kpi-toggle]')].map(b => {
    const label = b.closest('label');
    const cs = label ? getComputedStyle(label) : null;
    return { id: b.getAttribute('data-kpi-toggle'), on: b.checked, disabled: b.disabled,
      dim: cs ? Number(cs.opacity) < 0.7 : null, cursor: cs ? cs.cursor : null };
  });
  return {
    open: !!pop,
    count: (document.getElementById('kpi-cust-count') || {}).textContent,
    foot: pop ? (pop.lastElementChild.textContent || '').replace(/\\s+/g, ' ').trim() : '',
    rows,
    on: rows.filter(r => r.on).map(r => r.id),
    lockedOff: rows.filter(r => !r.on && r.disabled).length,
    liveOff: rows.filter(r => !r.on && !r.disabled).length,
    tiles: document.querySelectorAll('#kpi-grid > *').length,
    sel: window.currentKpiSel ? currentKpiSel() : null,
  };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
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
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1200);

    /* ================= 1. THE RIBBON AND THE PANEL AT FOUR ================ */
    await page.click('#kpi-customize');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, '01-at-four.png') });
    const full = await page.evaluate(PANEL);

    check('the ribbon draws four cards', full.tiles === 4, `${full.tiles} cards`);
    check('and the panel says so before anything is pressed — "4 of 4"',
      /4/.test(full.count || '') && (full.count || '').split(/\D+/).filter(Boolean).join('/') === '4/4',
      full.count);
    check('EVERY UNCHOSEN METRIC IS LOCKED — the ceiling is visible, not discovered',
      full.lockedOff === full.rows.length - 4 && full.liveOff === 0,
      `${full.lockedOff} locked · ${full.liveOff} still pressable`);
    /* Not just disabled: a control that is dead and looks alive is worse than
       one that refuses, because the reader blames themselves. */
    check('and a locked row LOOKS locked — dimmed, and not pointing',
      full.rows.filter(r => !r.on).every(r => r.dim && r.cursor !== 'pointer'),
      full.rows.filter(r => !r.on).map(r => `${r.id}:${r.dim ? 'dim' : 'BRIGHT'}/${r.cursor}`).slice(0, 3).join(' · '));
    check('the four that ARE chosen stay pressable — turning one off is the way forward',
      full.rows.filter(r => r.on).every(r => !r.disabled && r.cursor === 'pointer'),
      full.on.join(', '));
    check('and the foot says what to do instead of only refusing',
      /turn one off/i.test(full.foot), full.foot.slice(0, 70));

    /* ================= 2. A FIFTH CANNOT BE ADDED ========================= */
    const tried = await page.evaluate(() => {
      const b = document.querySelector('[data-kpi-toggle="expiring90"]');
      b.click();                                   // a real press on a locked row
      return { checked: b.checked };
    });
    await page.waitForTimeout(800);
    const after = await page.evaluate(PANEL);
    check('2 pressing a locked metric does nothing at all',
      !tried.checked && after.tiles === 4 && after.sel.length === 4,
      `checked ${tried.checked} · ${after.tiles} cards · ${after.sel.length} chosen`);
    check('2 and the four on the ribbon are the four that were there',
      JSON.stringify(after.on) === JSON.stringify(full.on), after.on.join(', '));

    /* ================= 3. THE SWAP, WHICH IS NOW THE ONLY MOVE ============ */
    /* With a ceiling, adding is swapping. The panel used to be destroyed by the
       repaint behind every tick, which made a swap untick → reopen → tick. */
    await page.evaluate(() => document.querySelector('[data-kpi-toggle="compliance"]').click());
    await page.waitForTimeout(800);
    const three = await page.evaluate(PANEL);
    check('3 THE PANEL SURVIVES THE PRESS — it is still open on the same screen',
      three.open, three.open ? 'open' : 'closed — a swap would take two round trips');
    check('3 turning one off frees the rest immediately',
      three.sel.length === 3 && three.lockedOff === 0 && /3/.test(three.count || ''),
      `${three.sel.length} chosen · ${three.lockedOff} locked · count "${three.count}"`);
    await page.screenshot({ path: path.join(OUT, '02-room-for-one.png') });

    await page.evaluate(() => document.querySelector('[data-kpi-toggle="expiring90"]').click());
    await page.waitForTimeout(800);
    const swapped = await page.evaluate(PANEL);
    check('3 and the new metric goes on, back to four',
      swapped.sel.length === 4 && swapped.sel.includes('expiring90')
      && !swapped.sel.includes('compliance') && swapped.tiles === 4,
      swapped.sel.join(', '));
    check('3 which locks the rest again — the rule holds after a swap, not only at rest',
      swapped.lockedOff === swapped.rows.length - 4 && swapped.liveOff === 0,
      `${swapped.lockedOff} locked`);
    await page.screenshot({ path: path.join(OUT, '03-swapped.png') });

    /* ================= 4. AN OLD PREFERENCE OF SIX ======================== */
    const legacy = await page.evaluate(() => {
      /* Saved before the rule existed, or on another device. */
      setKpiSel(['under_mgmt', 'avgcycle', 'approvals', 'compliance', 'awaiting', 'highrisk']);
      renderDashboard();
      return { shown: currentKpiSel(), tiles: document.querySelectorAll('#kpi-grid > *').length };
    });
    check('4 a preference of six draws four, and the first four it named',
      legacy.tiles === 4 && legacy.shown.length === 4
      && legacy.shown[0] === 'under_mgmt' && legacy.shown[3] === 'compliance',
      `${legacy.tiles} cards — ${legacy.shown.join(', ')}`);

    /* ================= 5. THE PHONE SAYS THE SAME THING =================== */
    const phone = await browser.newContext({ viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const mp = await phone.newPage();
    mp.on('pageerror', e => errors.push('phone: ' + e.message));
    await mp.goto(h.base + '/', { waitUntil: 'networkidle' });
    await mp.waitForTimeout(700);
    await mp.fill('#li-email', 'admin@example.co.ke');
    await mp.fill('#li-pass', 'adminpassword1');
    await mp.click('#li-go');
    await mp.waitForTimeout(3000);
    await mp.evaluate(() => { if (window.setKpiSel && window.DEFAULT_KPI_SEL) setKpiSel(DEFAULT_KPI_SEL.slice()); mGo('home'); });
    await mp.waitForTimeout(1200);
    await mp.evaluate(() => mOpenSheet('kpis'));
    await mp.waitForTimeout(900);
    await mp.screenshot({ path: path.join(OUT, '04-phone-sheet.png') });
    const sheet = await mp.evaluate(`(() => {
      const rows = [...document.querySelectorAll('[data-m-kpi-toggle]')].map(b => ({
        id: b.getAttribute('data-m-kpi-toggle'),
        dim: Number(getComputedStyle(b).opacity) < 0.7 }));
      const sel = currentKpiSel();
      /* The SHEET's own text, not the page's — the phone home screen carries
         its own "N of M" further down, and reading the body would let this
         check pass on somebody else's sentence. */
      const sheet = document.querySelector('.m-sheet');
      return { rows, sel, dimmed: rows.filter(r => r.dim).length,
        sheetFound: !!sheet,
        text: (sheet || { textContent: '' }).textContent.replace(/\\s+/g, ' ') };
    })()`);
    check('5 the phone sheet is on four as well', sheet.sel.length === 4, sheet.sel.join(', '));
    check('5 and it counts the choice where a thumb can read it',
      sheet.sheetFound && /4 of 4/.test(sheet.text),
      sheet.sheetFound ? (sheet.text.match(/\d+ of \d+/) || ['not said'])[0] : 'no sheet on screen');
    check('5 and the sheet says the rule in words too',
      /Four is the most|turn one off/i.test(sheet.text),
      (sheet.text.match(/Four is the most[^A-Z]*/) || ['not said'])[0].slice(0, 60));
    check('5 the metrics it cannot add are dimmed, not bright and refusing',
      sheet.dimmed === sheet.rows.length - 4, `${sheet.dimmed} dimmed of ${sheet.rows.length}`);
    const tapped = await mp.evaluate(async () => {
      const before = currentKpiSel().length;
      document.querySelector('[data-m-kpi-toggle="highrisk"]').click();
      await new Promise(r => setTimeout(r, 500));
      return { before, after: currentKpiSel().length };
    });
    check('5 and tapping one changes nothing',
      tapped.before === 4 && tapped.after === 4, `${tapped.before} → ${tapped.after}`);
    await phone.close();

    check('no page errors', errors.length === 0, errors.slice(0, 2).join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  console.log('screenshots → ' + path.relative(process.cwd(), OUT));
  process.exit(passed === results.length ? 0 : 1);
})();
