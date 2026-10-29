/* Chromium verification: THE PAYMENT TERMS TAB, AND THE TILE THAT OPENS IT.
   ============================================================
   Owner-asked 2 Sep 2026, then ruled off three drawn options: build the
   cash-gap page (A) with the exception list (B) folded into it, give it a tab
   of its own after Obligations, and let the Home tile count BOTH sides.

   f267 pins the reading in jsdom. THIS file asks the questions jsdom cannot,
   because jsdom lays nothing out and buildWorld never loads the shell:

   RETIRED 29 Oct 2026: everything that measured the Payment terms TAB
   (sections 1-6, 8, 9, 10, 11f-11h, 14, 15) measured the Insights page, which
   the owner had deleted. What stays measures payment terms where it still
   lives:
   7   the phone's Portfolio tile counts both sides; the desktop Home has none
   11  the two targets on Settings — drawer, refusal, stored pair, Menu row
   12  payment terms on the map's Group by, on Home's Explorer
   13  payment terms under + Filter on Contracts, and its chip

   Screenshots go to test/chromium/shots/payment-terms/.
   Run: node test/chromium/payment-terms-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'payment-terms');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* A book with a known answer, written onto the REAL seeded contracts so the
   whole product path runs. Two customers over the standard, one supplier over
   it, one that nobody has read, and one lease that belongs on neither side. */
const BOOK = [
  { terms:'90 days from invoice',   category:'customer', value:9000000 },
  { terms:'30 days from invoice',   category:'customer', value:4000000 },
  { terms:'within sixty (60) days', category:'supplier', value:2000000 },
  { terms:'Net 30',                 category:'supplier', value:1000000 },
];
/* Never pressed, so they need no record on the server -- they exist to give
   the two honest counts something real to report. */
const EXTRA = [
  { id:'PT-NOTERMS', terms:'payment as agreed', category:'customer', value:500000 },
  { id:'PT-NOSIDE',  terms:'30 days',           category:'lease',    value:250000 },
];

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } });
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

    /* Write the book onto the real records. Everything else the reading needs
       -- the live filter, the playbook's standard, the money conversion -- is
       the product's own. */
    const seedBook = () => page.evaluate(([book, extra]) => {
      state.contracts = state.contracts.filter(c => !/^PT-/.test(c.id));
      const live = state.contracts.filter(c => c.status !== 'Declined' && !c.archived);
      book.forEach((b, i) => {
        const c = live[i];
        if (!c) return;
        c.metadata = Object.assign({}, c.metadata, {
          paymentTerms: b.terms, category: b.category, currency: 'KES' });
        c.value = b.value; c.valueType = 'fixed';
      });
      live.slice(book.length).forEach(c => {
        c.metadata = Object.assign({}, c.metadata, { paymentTerms: '' });
      });
      extra.forEach(e => state.contracts.push({ id:e.id, name:e.id, counterparty:e.id,
        status:'Signed', value:e.value, valueType:'fixed',
        metadata:{ paymentTerms:e.terms, category:e.category, currency:'KES' } }));
      return live.length;
    }, [BOOK, EXTRA]);
    /* One reading, asked fresh wherever the page has been re-rendered. */
    const reading = () => page.evaluate(() => {
      const x = payTermsData();
      const o = payOverStandard();
      return { overCust:o.customer, overSupp:o.supplier,
               cust:x.customer.avgDays, supp:x.supplier.avgDays, gap:x.gap,
               custN:x.customer.n, suppN:x.supplier.n, overN:x.overN,
               noTerms:x.noTerms.n, noSide:x.noSide.n, standard:x.standard,
               buckets:{ c:x.customer.buckets.map(b => b.n), s:x.supplier.buckets.map(b => b.n) },
               /* DEFENSIVE ON PURPOSE: run against a build without these
                  readings this must REPORT rather than throw — a probe that
                  crashes aborts the whole file and says nothing about the
                  claims it was written for. */
               drivers:(x.drivers || []).map(r => r.id),
               against:(x.against || []).map(r => ({ id:r.id, gapDays:r.gapDays, side:r.side, bucket:r.bucket })),
               rows:(x.rows || []).map(r => ({ id:r.id, gapDays:r.gapDays, side:r.side, bucket:r.bucket })),
               exceptions:x.exceptions.map(r => ({ id:r.id, days:r.days, side:r.side })) };
    });
    const seeded = await seedBook();
    check('0 the book is seeded on real records', seeded >= BOOK.length, `${seeded} live contracts`);

    /* ─── 1-6 · RETIRED 29 Oct 2026: measured the Insights page, which the owner had deleted ───
       The Payment terms tab itself: its place on the row, the press drawing
       it, the heroes, the chart against its reading, the "driving the gap"
       table and its door, and the honest counts printed on it. */

    /* ─── 7 · the Home tile ───
       RE-POINTED IN PLACE 24 Sep 2026 (Young, over "Executive Home Options":
       the Map took the four tiles' place on the desktop Home, then "Build
       it"). The tile's READING is unchanged and still offered — the phone's
       own Home draws the same catalogue entry when it is chosen — so 7a–7c
       are asked there, on a phone-width screen, of the very figures they
       asked of the desktop tile. 7d IS REVERSED: the desktop tile was the one
       door from Home onto this tab and it LEFT with the tiles, by the owner's
       word; the claim now measures that it is gone rather than pretending a
       door survived. (The phone draws no Insights, so its tile opens the
       register — recorded, not changed.) */
    await seedBook();
    const d2 = await reading();
    await page.evaluate(() => { setKpiSel(['payterms', 'approvals', 'negotiations', 'avgcycle']); setView('dashboard'); });
    await page.waitForTimeout(1200);
    const onDesk = await page.evaluate(() => ({
      tile: !!document.querySelector('[data-kpi-id="payterms"]'),
      map: !!document.getElementById('hm-map'),
      board: !!document.getElementById('hb-board') || !!document.getElementById('hb-head') }));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(700);
    /* RE-POINTED 24 Oct 2026 (Round 6, owner's yes): Home lost its tiles; the chosen ones live on Portfolio */
    await page.evaluate(() => { if (window.mGo) mGo('portfolio'); });
    await page.waitForTimeout(900);
    const tile = await page.evaluate(() => {
      const el = document.querySelector('.m-kpi[data-m-kpi="payterms"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { text: el.textContent.replace(/\s+/g, ' ').trim(), w: Math.round(r.width), h: Math.round(r.height) };
    });
    check('7a the tile draws on the phone\'s Portfolio, where the chosen tiles live', tile && tile.w > 100 && tile.h > 50,
      tile ? `${tile.w}x${tile.h}` : 'absent');
    check('7b it counts BOTH sides', tile && tile.text.includes(String(d2.overN)),
      tile ? `${tile.text} · reading says ${d2.overN}` : 'absent');
    /* The two halves are printed and they add up to the headline -- a single
       number with no split reads as all bad news, which is the whole reason
       the owner's ruling needed a sub-line. ASKED OF THE READING SINCE 24 SEP
       2026: the desktop tile printed this sub-line and left with the tiles;
       the phone's tile has only ever printed the count line, never the split
       (measured — pre-existing, recorded in BUGLOG, not changed here). The
       reading every tile draws from must still carry both halves. */
    const split = await page.evaluate(() => {
      const k = hmDashSlices().KPI_CATALOG.payterms;
      return k ? String(k.sub || '') : null;
    });
    check('7c and the reading still names the two halves apart',
      split != null && new RegExp(String(d2.overCust) + '\\D+' + String(d2.overSupp)).test(split),
      `${split} · wants ${d2.overCust} then ${d2.overSupp}`);
    await page.screenshot({ path: path.join(OUT, '02-tile.png'), fullPage: true });
    await page.setViewportSize({ width: 1500, height: 1100 });
    await page.waitForTimeout(700);
    /* RE-POINTED 11 Oct 2026: the Map in turn gave way to the Board (HOME —
       THE BOARD AND THE MAP: "Desktop Home IS Explorer's page"); the tile
       stays gone. */
    check('7d the desktop Home carries no tile — the Board is Home',
      !onDesk.tile && onDesk.board, `tile ${onDesk.tile} · board ${onDesk.board} · map ${onDesk.map}`);

    /* ─── 8, 9, 10 · RETIRED 29 Oct 2026: measured the Insights page, which the owner had deleted ───
       The tab's sideways scroll, its Swedish, and its chart filtering its
       table. */

    /* ─── 11 · TWO TARGETS, ONE PER SIDE (owner-ruled 2 Sep 2026) ───
       Typed into the real panel, saved through the real route, and the tab has
       to follow — the setting and the page reading the same number is the
       whole of what was asked for. */
    await seedBook();
    await page.evaluate(() => { setView('team'); });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { if (window.settingsGoTab) settingsGoTab('platform'); });
    await page.waitForTimeout(700);
    /* Since the Control Room was built in full (owner, 16 Oct 2026) a setting
       is a door on its group's card, not a row. */
    const rowThere = await page.evaluate(() => !!document.querySelector('[data-st-panel="paydays"]'));
    check('11a the targets have a row on Settings', rowThere, rowThere ? 'drawn' : 'missing');
    if (rowThere) {
      await page.click('[data-st-panel="paydays"]');
      await page.waitForTimeout(700);
      const boxes = await page.evaluate(() => {
        const a = document.getElementById('st-pay-in'), b = document.getElementById('st-pay-out');
        const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 20 && r.height > 10; };
        return { in: vis(a), out: vis(b), save: vis(document.getElementById('st-pay-save')) };
      });
      check('11b the drawer holds a box per side and a save', boxes.in && boxes.out && boxes.save,
        JSON.stringify(boxes));
      /* A REFUSAL FIRST: a number the reading would hand back as null must not
         be stored looking answered. */
      await page.fill('#st-pay-in', '900');
      await page.click('#st-pay-save');
      await page.waitForTimeout(500);
      const refused = await page.evaluate(() => ({
        said: !!Array.from(document.querySelectorAll('#st-drawer *')).find(el =>
          /1 to 365|1 till 365/.test(el.textContent || '')),
        stored: ((state.settings || {}).payTargets || {}).customer,
      }));
      check('11c an impossible target is refused in the drawer and not stored',
        refused.said && refused.stored == null, `said=${refused.said} stored=${refused.stored}`);
      await page.fill('#st-pay-in', '30');
      await page.fill('#st-pay-out', '75');
      await page.click('#st-pay-save');
      await page.waitForTimeout(1400);
      /* The board's door carries no state since the Control Room was built in
         full (owner, 16 Oct 2026): the Menu's row beside it says the setting's
         state, cut short, from the one reading every surface draws. */
      await page.evaluate(() => {
        /* the Menu opens from "/" in Jambo's box since rounds 24–26 as drawn (18 Oct 2026) */
        if (typeof stSideSet === 'function') stSideSet('menu');
        const q = document.getElementById('st-q');
        if (q) { q.value = 'payment'; q.dispatchEvent(new Event('input', { bubbles: true })); }
      });
      await page.waitForTimeout(500);
      const saved = await page.evaluate(() => ({
        t: Object.assign({}, payTargets()),
        row: (document.querySelector('#st-list .st-mrow[data-st-panel="paydays"] .st-mrow-s') || {}).textContent || '',
        reading: ((window.SET_PANELS && SET_PANELS.paydays) ? (SET_PANELS.paydays.state() || {}).text : '') || '',
      }));
      check('11d the pair is stored and each side reads its own',
        saved.t.customer === 30 && saved.t.supplier === 75, JSON.stringify(saved.t));
      check('11e the Menu row states it without the drawer, read off the one reading',
        /30/.test(saved.row) && /30/.test(saved.reading) && /75/.test(saved.reading), `${saved.row.trim()} | ${saved.reading}`);

      /* 11f-11h RETIRED 29 Oct 2026: measured the Insights page, which the owner had deleted — the tab
         measuring each side against its own target, two boundaries, two
         captions. */
      await page.evaluate(() => { if (window.stDrawerClose) stDrawerClose(); });
      await page.waitForTimeout(500);
    } else {
      ['11b','11c','11d','11e'].forEach(k => check(k + ' (skipped)', false, 'no panel row'));
    }

    /* ─── 12 · PAYMENT TERMS AS A GRAPH LENS (owner-asked 2 Sep 2026) ───
       "add the payment terms to the Group by in the contract graph." The option
       has to be on the control AND the graph has to regroup when it is chosen —
       an option that draws and regroups nothing looks identical in the markup. */
    /* RE-POINTED 29 Oct 2026: the map lives on Home's Explorer (the Insights
       page was deleted). */
    await page.evaluate(() => { hbOpenExplorer(); });
    await page.waitForTimeout(1600);
    const opt = await page.evaluate(() => {
      const sel = document.getElementById('ig-group');
      return sel ? Array.from(sel.options).map(o => ({ v:o.value, t:o.textContent.trim() })) : null;
    });
    check('12a payment terms is on the Group by control',
      opt && opt.some(o => o.v === 'payterms' && /payment/i.test(o.t)),
      opt ? opt.map(o => o.v).join(',') : 'no control');
    if (opt && opt.some(o => o.v === 'payterms')) {
      await page.selectOption('#ig-group', 'payterms');
      await page.waitForTimeout(1400);
      const grouped = await page.evaluate(() => {
        const labels = state.contracts.map(c => groupLabelOf(c, intel.groupBy, intel.groups));
        return { by: intel.groupBy, uniq: Array.from(new Set(labels)),
                 note: (document.getElementById('ig-note') || document.body).textContent || '' };
      });
      check('12b choosing it really regroups the graph', grouped.by === 'payterms', grouped.by);
      check('12c the groups are the payment terms bands, and an unread contract is its own',
        grouped.uniq.some(l => /days$/.test(l)) && grouped.uniq.includes('No payment terms'),
        grouped.uniq.join(' | '));
      check('12d the page says what it is grouped by', /payment terms/i.test(grouped.note),
        grouped.note.replace(/\s+/g, ' ').slice(0, 80));
      await page.screenshot({ path: path.join(OUT, '05-group-by-terms.png'), fullPage: true });
    } else {
      ['12b','12c','12d'].forEach(k => check(k + ' (skipped)', false, 'option absent'));
    }

    /* ─── 13 · PAYMENT TERMS IS A FILTER ON CONTRACTS (owner-ruled 2 Sep 2026) ───
       The tab answers "what is it costing us"; the filter answers "which
       contracts", and "not recorded" is the worklist that gets the rest of the
       book read. It lives behind Adapt filters, so it has to be turned on
       before it draws — and it must draw on its own the moment it is
       narrowing, which is this catalogue's own safety property. */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner picked "the Legora way" for
       the Contracts place): Adapt filters and the labelled boxes are not drawn
       there any more — every filter is a group under "+ Filter" and a chosen
       one is a chip with its x; the safety property is unchanged (a chip is
       drawn exactly while its filter narrows). */
    await seedBook();
    await page.evaluate(() => { window.langSet('en'); (regPlaceSet({ show: 'list' }), setView('register')); });
    await page.waitForTimeout(1200);
    const PT_CHIP = '[data-lh-seat="contracts"] [data-lh-chip="payterms"]';
    const offBar = await page.evaluate(C => !document.getElementById('reg-payterms') && !document.querySelector(C), PT_CHIP);
    check('13a it is NOT on the bar by default — the row still fits one line', offBar,
      offBar ? 'under + Filter' : 'drawn unasked');
    const inCat = await page.evaluate(() => {
      const add = document.querySelector('[data-lh-seat="contracts"] select[data-lh-add]');
      if (!add) return null;
      return [...add.querySelectorAll('optgroup')].map(g => ({ v: g.label, t: g.label }));
    });
    check('13b it is offered under + Filter',
      Array.isArray(inCat) && inCat.some(x => /payment terms/i.test(x.t)),
      Array.isArray(inCat) ? inCat.map(x => x.t.trim()).join(' | ').slice(0, 120) : 'no + Filter');

    /* THE SAFETY PROPERTY: turned on from the model, it must appear on the bar
       by itself rather than narrowing the book from behind a closed dialog. */
    await page.evaluate(() => { regState().payterms = 'none'; regRepaint(); });
    await page.waitForTimeout(900);
    const narrowed = await page.evaluate(C => ({
      drawn: !!document.querySelector(C),
      value: (document.querySelector(C + ' select[data-lh-f="payterms"]') || {}).value,
      shown: document.querySelectorAll('tr[data-row]').length,
      want: regFiltered().length,
      noTerms: state.contracts.filter(c => c.status !== 'Declined' && !c.archived &&
        (typeof payDays === 'function') && payDays(c) == null).length,
    }), PT_CHIP);
    check('13c a filter that is narrowing draws itself — it can never be quietly on',
      narrowed.drawn && narrowed.value === 'none', `drawn ${narrowed.drawn} · ${narrowed.value}`);
    check('13d "not recorded" really narrows the register',
      narrowed.want > 0 && narrowed.want < narrowed.noTerms + 1 && narrowed.shown === narrowed.want,
      `${narrowed.shown} rows on screen · reading says ${narrowed.want} · unread ${narrowed.noTerms}`);

    const band = await page.evaluate(() => {
      const first = state.contracts.map(c => (typeof payDays === 'function') ? payDays(c) : null).find(d => d != null);
      if (first == null) return null;
      const k = payBucketOf(first);
      regState().payterms = k; regRepaint();
      return { k, want: regFiltered().length };
    });
    await page.waitForTimeout(800);
    if (band) {
      const got = await page.evaluate(() => ({
        rows: document.querySelectorAll('tr[data-row]').length,
        every: regFiltered().every(c => payBucketOf(payDays(c)) === regState().payterms),
      }));
      check('13e a band narrows to exactly that band', got.rows === band.want && got.every,
        `${band.k}: ${got.rows} rows, all in band ${got.every}`);
    } else {
      check('13e a band narrows to exactly that band', false, 'no contract carries terms');
    }
    await page.evaluate(C => { const b = document.querySelector(C + ' [data-lh-x="payterms"]'); if (b) b.click(); }, PT_CHIP);
    await page.waitForTimeout(800);
    const cleared = await page.evaluate(C => ({ v: regState().payterms, gone: !document.getElementById('reg-payterms') && !document.querySelector(C) }), PT_CHIP);
    check('13f its chip\'s x puts it back and the control stands down again',
      cleared.v === 'all' && cleared.gone, `${cleared.v} · off the bar ${cleared.gone}`);
    await page.screenshot({ path: path.join(OUT, '06-contracts-filter.png'), fullPage: true });

    /* ─── 14, 15 · RETIRED 29 Oct 2026: measured the Insights page, which the owner had deleted ───
       The tab's long list scrolling in its card, and the tab fitting one
       screen. */

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
