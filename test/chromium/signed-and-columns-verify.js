/* Chromium verification: THE SIGNED COLUMN, THE SIGNED FILTER, AND COLUMNS
   YOU CAN DRAG (J-5.1, owner-asked 31 Aug 2026).
   ====================================================================
   WHY THIS IS A BROWSER FILE, and none of it can be asked anywhere else:
     · "a ninth column is on screen" is PAINT. A source read cannot tell a
       column that draws from one whose rule lost a cascade fight — this
       codebase's most repeated visual defect;
     · "the widths still sum to 100" only means anything as MEASURED boxes at
       a real window size, and the reported fault it guards against was a
       table that scrolled sideways;
     · "you can drag it like a spreadsheet" needs a REAL POINTER. A synthetic
       event fires no pointer capture and would pass against a control nobody
       can take hold of — the lesson clause-door-verify paid for the selection
       strip;
     · and a press on the grip must NOT sort, which is only observable by
       pressing it and reading the order back.

   It names f258, which pins the arithmetic and the wiring in node.
   Run: node test/chromium/signed-and-columns-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'signed-and-columns');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);

    /* A signed contract with a real execution stamp, so the column has
       something true to print — and one with nothing, so the em-dash does. */
    await page.evaluate(() => {
      const cs = state.contracts;
      if (cs[0]) { cs[0].status = 'Signed';
        cs[0].execution = { at: '2021-03-14T09:00:00.000Z', tzOffsetMin: 180, by: 'Test' };
        delete cs[0].signedAt; }
      if (cs[1]) { cs[1].status = 'Signed'; cs[1].signedAt = '12 Aug 2026, 10:00 EAT'; }
      if (cs[2]) { cs[2].status = 'Draft'; delete cs[2].execution; delete cs[2].signedAt; }
    });
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });

    /* ============ 1. THE COLUMN IS ON SCREEN, BEFORE EXPIRY ============ */
    const head = await page.evaluate(() => {
      const th = [...document.querySelectorAll('.reg-table thead th')];
      return { n: th.length, text: th.map(t => t.textContent.replace(/[↕▲▼]/g, '').trim()),
        widths: th.map(t => Math.round(t.getBoundingClientRect().width)),
        tableW: Math.round(document.querySelector('.reg-table').getBoundingClientRect().width) };
    });
    check('the Contracts head draws nine columns', head.n === 9, JSON.stringify(head.text));
    const iSig = head.text.findIndex(t => /^Signed$/i.test(t));
    const iExp = head.text.findIndex(t => /Expiry/i.test(t));
    check('Signed is drawn, and immediately before Expiry',
      iSig >= 0 && iExp === iSig + 1, `signed@${iSig} expiry@${iExp}`);
    check('and it is a painted box, not merely present',
      head.widths[iSig] > 40, head.widths[iSig] + 'px');

    /* ============ 2. THE CELLS: A DATE, AND AN EM-DASH ============ */
    const cells = await page.evaluate(i => {
      const out = [];
      for (const tr of [...document.querySelectorAll('tr[data-row]')].slice(0, 12)) {
        const td = tr.children[i];
        if (td) out.push(td.textContent.trim());
      }
      return out;
    }, iSig);
    check('a signed contract prints a dotted date',
      cells.some(t => /^\d{2}\.\d{2}\.\d{4}$/.test(t)), JSON.stringify(cells.slice(0, 4)));
    check('and one that is not signed prints an em-dash, never an empty cell',
      cells.some(t => t === '—'), JSON.stringify(cells.slice(0, 4)));
    check('the legacy display string reads as a real date too',
      cells.includes('12.08.2026'), JSON.stringify(cells.slice(0, 4)));

    /* ============ 3. NO SIDEWAYS SCROLL, AT EVERY LAPTOP WIDTH ============ */
    for (const wpx of [1280, 1366, 1440, 1500]) {
      await page.setViewportSize({ width: wpx, height: 900 });
      await page.waitForTimeout(400);
      const m = await page.evaluate(() => {
        const t = document.querySelector('.reg-table');
        const pane = t.parentElement;
        return { over: Math.round(pane.scrollWidth - pane.clientWidth),
          doc: Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth) };
      });
      check(`no sideways scroll at ${wpx}`, m.over <= 1 && m.doc <= 1, JSON.stringify(m));
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);

    /* ============ 4. SORTING BY IT ============ */
    const sorted = await page.evaluate(() => {
      document.querySelector('[data-reg-sort="signed"]').click();
      return true;
    });
    await page.waitForTimeout(700);
    const order = await page.evaluate(i => [...document.querySelectorAll('tr[data-row]')]
      .slice(0, 30).map(tr => (tr.children[i] || {}).textContent || ''), iSig);
    const dated = order.filter(t => /\d{2}\.\d{2}\.\d{4}/.test(t.trim()));
    const dashAfter = order.findIndex(t => t.trim() === '—');
    const lastDated = order.map(t => /\d{2}\.\d{2}\.\d{4}/.test(t.trim())).lastIndexOf(true);
    check('a column head press orders the book by signature',
      sorted && dated.length >= 2, `${dated.length} dated rows`);
    check('AND A CONTRACT WITH NO SIGNATURE SORTS LAST',
      dashAfter === -1 || dashAfter > lastDated, `first dash@${dashAfter} last date@${lastDated}`);

    /* ============ 5. THE FILTER: OFF BY DEFAULT, ON WHEN NARROWING ======== */
    const bar0 = await page.evaluate(() => !!document.getElementById('reg-signed'));
    check('the Signed filter is ABSENT from a bar nobody has adapted', !bar0);
    const narrowed = await page.evaluate(() => {
      /* Turned on the way a reader turns it on — through the catalogue the
         Adapt door writes to — then set to a year, and the page repainted. */
      regBarSetChosen(regBarChosen().concat('signed'));
      const R = regState(); R.signed = '2021'; R.page = 1;
      renderRegister({ nav: 'register' });
      return {
        drawn: !!document.getElementById('reg-signed'),
        value: (document.getElementById('reg-signed') || {}).value,
        years: [...document.querySelectorAll('#reg-signed option')].map(o => o.value),
        rows: [...document.querySelectorAll('tr[data-row]')].length,
      };
    });
    await page.waitForTimeout(500);
    check('once it is narrowing, the control is on screen and set to the cut',
      narrowed.drawn && narrowed.value === '2021', JSON.stringify(narrowed.value));
    check('the year list offers only years this book was signed in',
      narrowed.years.every(y => ['all', 'this', 'last'].includes(y) || /^\d{4}$/.test(y))
      && narrowed.years.includes('2021'), JSON.stringify(narrowed.years));
    const agree = await page.evaluate(i => {
      const cells = [...document.querySelectorAll('tr[data-row]')].map(tr => (tr.children[i] || {}).textContent.trim());
      return { n: cells.length, all2021: cells.every(t => /\.2021$/.test(t)), cells };
    }, iSig);
    check('THE COLUMN AND THE FILTER AGREE — every row shown says that year',
      agree.n >= 1 && agree.all2021, JSON.stringify(agree.cells.slice(0, 5)));
    await page.screenshot({ path: path.join(OUT, '02-filtered.png') });

    /* A CUT THAT HAS LEFT THE BOOK IS STILL ON THE LIST. The years come off the
       book, so a chosen year can stop being offered under a reader who chose
       it — and a <select> whose value matches no option silently falls back to
       its first, so the control would read "Any" over a narrowed, empty table.
       ASKED IN A BROWSER because that fallback is the BROWSER's behaviour: the
       markup would look perfectly correct either way. */
    const stranded = await page.evaluate(() => {
      const R = regState(); R.signed = '2019'; R.page = 1;   // nothing in this book
      renderRegister({ nav: 'register' });
      const el = document.getElementById('reg-signed');
      return { value: el && el.value,
               offered: [...document.querySelectorAll('#reg-signed option')].map(o => o.value),
               rows: [...document.querySelectorAll('tr[data-row]')].length };
    });
    await page.waitForTimeout(400);
    check('a year that has left the book is still offered, so the control cannot lie',
      stranded.value === '2019' && stranded.offered.includes('2019'),
      JSON.stringify(stranded));
    check('and the table is honestly empty rather than quietly whole',
      stranded.rows === 0, stranded.rows + ' rows');

    await page.evaluate(() => { const R = regState(); R.signed = 'all'; renderRegister({ nav: 'register' }); });
    await page.waitForTimeout(500);

    /* ============ 6. THE GRIP, DRAGGED WITH A REAL MOUSE ============ */
    const before = await page.evaluate(() => [...document.querySelectorAll('.reg-table thead th')]
      .map(t => Math.round(t.getBoundingClientRect().width)));
    const gripBox = await page.evaluate(() => {
      const g = document.querySelector('[data-reg-grip="1"]');
      if (!g) return null;
      const r = g.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: Math.round(r.width) };
    });
    check('every column but the last carries a grip', !!gripBox && gripBox.w >= 5,
      gripBox ? gripBox.w + 'px wide' : 'none');
    if (gripBox) {
      await page.mouse.move(gripBox.x, gripBox.y);
      await page.mouse.down();
      /* Several moves, because one jump is not a drag and would pass against a
         handler that only reads the final position. */
      for (const dx of [20, 50, 90, 120]) { await page.mouse.move(gripBox.x + dx, gripBox.y); await page.waitForTimeout(30); }
      await page.mouse.up();
      await page.waitForTimeout(300);
    }
    const after = await page.evaluate(() => [...document.querySelectorAll('.reg-table thead th')]
      .map(t => Math.round(t.getBoundingClientRect().width)));
    check('DRAGGING WIDENS THE COLUMN', after[1] > before[1] + 40, `${before[1]} → ${after[1]}`);
    check('and the column to its right gives up exactly what it gained',
      Math.abs((after[1] - before[1]) + (after[2] - before[2])) <= 2,
      `${before[2]} → ${after[2]}`);
    check('every other column is untouched',
      [0, 3, 4, 5, 6, 7, 8].every(i => Math.abs(after[i] - before[i]) <= 2),
      JSON.stringify(after));
    const totals = await page.evaluate(() => {
      const t = document.querySelector('.reg-table');
      const sum = [...t.querySelectorAll('thead th')].reduce((a, x) => a + x.getBoundingClientRect().width, 0);
      const pane = t.parentElement;
      return { drift: Math.round(sum - t.getBoundingClientRect().width),
        over: Math.round(pane.scrollWidth - pane.clientWidth) };
    });
    check('the table is still exactly its pane after a drag',
      Math.abs(totals.drift) <= 2 && totals.over <= 1, JSON.stringify(totals));
    await page.screenshot({ path: path.join(OUT, '03-dragged.png') });

    /* ============ 7. A DRAG IS NOT A SORT ============ */
    const sortState = await page.evaluate(() => {
      const R = regState(); return { sort: R.sort, dir: R.dir };
    });
    const gb2 = await page.evaluate(() => {
      const g = document.querySelector('[data-reg-grip="3"]');
      const r = g.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.move(gb2.x, gb2.y);
    await page.mouse.down(); await page.mouse.move(gb2.x + 30, gb2.y); await page.mouse.up();
    await page.waitForTimeout(300);
    const sortAfter = await page.evaluate(() => { const R = regState(); return { sort: R.sort, dir: R.dir }; });
    check('A PRESS ON THE GRIP IS A DRAG AND NEVER A SORT',
      sortAfter.sort === sortState.sort && sortAfter.dir === sortState.dir,
      `${sortState.sort}/${sortState.dir} → ${sortAfter.sort}/${sortAfter.dir}`);

    /* ============ 8. IT IS REMEMBERED, AND DOUBLE-CLICK PUTS IT BACK ==== */
    const remembered = await page.evaluate(() => {
      const stored = JSON.parse(localStorage.getItem('hati.v1.regCols') || 'null');
      renderRegister({ nav: 'register' });
      const w = [...document.querySelectorAll('.reg-table thead th')].map(t => Math.round(t.getBoundingClientRect().width));
      return { stored: !!stored, sum: stored ? Math.round(stored.reduce((a, b) => a + b, 0)) : null, w };
    });
    await page.waitForTimeout(400);
    check('the split is remembered across a repaint, and still sums to 100',
      remembered.stored && remembered.sum === 100, JSON.stringify(remembered.sum));
    const gb3 = await page.evaluate(() => {
      const g = document.querySelector('[data-reg-grip="1"]');
      const r = g.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
    await page.mouse.dblclick(gb3.x, gb3.y);
    await page.waitForTimeout(300);
    const reset = await page.evaluate(() => ({
      stored: localStorage.getItem('hati.v1.regCols'),
      w: [...document.querySelectorAll('.reg-table thead th')].map(t => Math.round(t.getBoundingClientRect().width)),
    }));
    check('DOUBLE-CLICK PUTS IT BACK, and "reset" means nobody has chosen',
      reset.stored === null, String(reset.stored).slice(0, 30));
    check('and the columns really returned to their defaults',
      Math.abs(reset.w[1] - before[1]) <= 3, `${after[1]} → ${reset.w[1]} (was ${before[1]})`);

    /* ============ 9. THE NEGOTIATIONS SEAT ============ */
    /* THE PAGE DRAWS A TABLE ONLY WHERE THERE IS A LIVE NEGOTIATION — with
       none it draws its own empty card, which is correct and would have made
       this a check that passes against a page with no columns at all. One ask
       is filed first, so the seat being measured is the one a reader meets. */
    await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      negoInit(c);
      negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
        kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
        before: 'thirty (30) days', after: 'sixty (60) days' });
    });
    await page.waitForTimeout(1600);
    await page.evaluate(() => openNegotiations({ list: true }));
    await page.waitForTimeout(1400);
    const neg = await page.evaluate(() => {
      const th = [...document.querySelectorAll('.reg-table thead th')];
      return { n: th.length, text: th.map(t => t.textContent.replace(/[↕▲▼]/g, '').trim()),
        filter: !!document.getElementById('reg-signed'),
        grips: document.querySelectorAll('[data-reg-grip]').length };
    });
    if (neg.n) {
      check('the Negotiations seat draws EIGHT columns and no Signed',
        neg.n === 8 && !neg.text.some(t => /^Signed$/i.test(t)), JSON.stringify(neg.text));
      check('and no Signed filter either', !neg.filter);
      check('but its columns are draggable too', neg.grips === 7, String(neg.grips));
    } else {
      check('the Negotiations seat could not be reached — reported, not skipped', false, 'no table');
    }
    await page.screenshot({ path: path.join(OUT, '04-negotiations.png') });

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run completed', false, String(e).slice(0, 200));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
