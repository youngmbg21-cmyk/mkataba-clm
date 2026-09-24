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

   SINCE 24 SEP 2026 THE DESKTOP HOME DRAWS NO RIBBON (the Map took its
   place, owner-ruled), so every claim below about the picker is asked of the
   one picker left — the phone's sheet — and section 1 measures the reversal.

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

    /* ================= 1. THE DESKTOP HOME HOLDS NO RIBBON ================
       REVERSED IN PLACE 24 Sep 2026 (Young, over the drawing "Executive Home
       Options": the Map, a Count · Value switch, then "Build it"). The four
       tiles and the popover that chose them LEFT THE DESKTOP HOME — the Map
       took their place — so the ceiling this file exists for is now the rule
       of ONE picker: the phone's sheet, which reads the same preference
       through the same functions (currentKpiSel, KPI_MAX, kpiAtMax). What
       sections 1–4 asked of the popover — a locked row LOOKS locked, the
       chosen four stay pressable, the swap survives the repaint, an old
       preference of six draws four — is asked of the sheet below, press for
       press. What is left here is the reversal itself, measured on the page:
       no ribbon, no gear, and the Map in their place. */
    const desk = await page.evaluate(() => ({
      tiles: document.querySelectorAll('#kpi-grid > *, .hm-tile').length,
      gear: !!document.getElementById('kpi-customize'),
      map: !!document.getElementById('hm-map'),
      cap: typeof KPI_MAX === 'number' ? KPI_MAX : null,
    }));
    await page.screenshot({ path: path.join(OUT, '01-desktop-map.png') });
    check('1 the desktop Home draws no tiles and no picker',
      desk.tiles === 0 && !desk.gear, `${desk.tiles} tiles · gear ${desk.gear}`);
    check('1 the Map is drawn in their place', desk.map, desk.map ? 'drawn' : 'absent');
    check('1 and the ceiling is still ONE published number the phone reads', desk.cap === 4, String(desk.cap));

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

    /* ---- 2–4, RE-POINTED ONTO THE SHEET (24 Sep 2026) ---- */
    const SHEET = `(() => {
      const rows = [...document.querySelectorAll('[data-m-kpi-toggle]')].map(b => ({
        id: b.getAttribute('data-m-kpi-toggle'), dim: Number(getComputedStyle(b).opacity) < 0.7 }));
      const sel = currentKpiSel(), sheet = document.querySelector('.m-sheet');
      return { open: !!sheet, sel, rows, dimmed: rows.filter(r => r.dim).length,
        chosenDim: rows.filter(r => sel.includes(r.id) && r.dim).length,
        text: (sheet || { textContent: '' }).textContent.replace(/\\s+/g, ' ') };
    })()`;
    const rest = await mp.evaluate(SHEET);
    check('2 the four that ARE chosen stay bright — turning one off is the way forward',
      rest.sel.length === 4 && rest.chosenDim === 0, `${rest.chosenDim} of the chosen dimmed`);
    await mp.evaluate(() => document.querySelector('[data-m-kpi-toggle="expiring90"]').click());
    await mp.waitForTimeout(600);
    const three = await mp.evaluate(SHEET);
    check('3 THE SHEET SURVIVES THE PRESS — still open on the same screen',
      three.open, three.open ? 'open' : 'closed — a swap would take two round trips');
    check('3 turning one off frees the rest immediately',
      three.sel.length === 3 && three.dimmed === 0 && /3 of 4/.test(three.text),
      `${three.sel.length} chosen · ${three.dimmed} dimmed · ${(three.text.match(/\d+ of \d+/) || ['?'])[0]}`);
    await mp.screenshot({ path: path.join(OUT, '05-phone-room-for-one.png') });
    await mp.evaluate(() => document.querySelector('[data-m-kpi-toggle="compliance"]').click());
    await mp.waitForTimeout(600);
    const swapped = await mp.evaluate(SHEET);
    check('3 and the new metric goes on, back to four',
      swapped.sel.length === 4 && swapped.sel.includes('compliance') && !swapped.sel.includes('expiring90'),
      swapped.sel.join(', '));
    check('3 which dims the rest again — the rule holds after a swap, not only at rest',
      swapped.dimmed === swapped.rows.length - 4, `${swapped.dimmed} dimmed of ${swapped.rows.length}`);
    const legacy = await mp.evaluate(async () => {
      /* Saved before the rule existed, or on another device. */
      setKpiSel(['under_mgmt', 'avgcycle', 'approvals', 'compliance', 'awaiting', 'highrisk']);
      mCloseSheet(); mGo('home');
      await new Promise(r => setTimeout(r, 600));
      return { shown: currentKpiSel(), tiles: document.querySelectorAll('.m-kpi').length };
    });
    check('4 a preference of six draws four on the phone, and the first four it named',
      legacy.tiles === 4 && legacy.shown.length === 4
      && legacy.shown[0] === 'under_mgmt' && legacy.shown[3] === 'compliance',
      `${legacy.tiles} cards — ${legacy.shown.join(', ')}`);
    await mp.evaluate(() => { if (window.setKpiSel && window.DEFAULT_KPI_SEL) setKpiSel(DEFAULT_KPI_SEL.slice()); });
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
