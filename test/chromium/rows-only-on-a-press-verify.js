/* A PRESS THAT ONLY CHANGES WHICH ROWS SHOW REDRAWS ONLY THE ROWS
   (10 Nov 2026, off the owner's "why is the app slow" review, which named
   Obligations and whose screenshots came from Approvals & signing.)

   WHAT WAS WRONG. Both pages drew the WHOLE of #content on every call: the
   frame, the title, the search box, the tabs, the table and the panel, then
   wired them again. The typed box called it ON EVERY LETTER — and because the
   box was thrown away with everything else, each page had to put the focus and
   the caret back by hand afterwards, which is the tell that the wrong thing was
   being replaced. Swapping #content also makes the browser read 11,837 style
   rules against the new tree, 164 of them `:has()` anchored at the shell while
   looking inside #content, so the cost does not fall with the number of rows.

   WHAT THIS PINS, on both pages, at the owner's three screens:
   1 · a TAB press keeps the frame, the box and the panel standing, and still
       changes the rows, lights the right tab and recounts every tab
   2 · TYPING keeps the box itself — so the focus never leaves it and the caret
       never moves — and every letter reaches it while the rows narrow
   3 · the page is still whole: the heads, the foot's own line, and no error

   AND THE ONE THAT CAUGHT A REAL FAULT (3 on Approvals). "What it rests on"
   steps out of the table the moment it reads the same on every row, and that
   happens WHILE SOMEBODY IS TYPING. A first draft refused the rows paint
   whenever the column count moved and fell back to the whole page — which
   replaced the box mid-word, so "carton" arrived as "ca" and the focus was
   lost. The table's whole inside is rewritten inside its own node now, so the
   heads can change without the frame going. Test 2 reads the WHOLE typed word
   back out of the box, which is what makes that regression impossible to miss.

   RED AT THE PARENT on 1 and 2 for both pages: there the frame, the box and
   the panel are all replaced by every press.

   Run on GitHub (run-all.js). Here only by name, and only for pictures:
     node test/chromium/rows-only-on-a-press-verify.js   (pictures: ROWS_SHOTS=<dir>) */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const { r5Contracts, R5_RULES, iso } = require('../round5-world');

const OUT = process.env.ROWS_SHOTS || path.join(__dirname, 'shots', 'rows-only-on-a-press');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

/* enough approvals that the list is a list, and each one waits a different number of days */
const NAMES = [['E-commerce Distribution Agreement', 'Copia Global'], ['Digital & Influencer Campaign', 'Aleph Group'],
  ['Last-Mile Distribution — Western Region', 'Wasoko'], ['Corrugated Carton Supply', 'Statpack Industries Ltd'],
  ['Trade Activation & Field Marketing', 'Ogilvy Kenya'], ['Raw Material Supply — Juno', 'Juno Limited'],
  ['Cold Chain Warehousing', 'Bidco'], ['Packaging Film Supply', 'Polyflex'], ['Fleet Leasing', 'Rift Haulage'],
  ['Security Services', 'KK Guards'], ['Sugar Haulage', 'Mumias Movers'], ['Shelf Space Rental', 'Quickmart']];

/* THE MARKS ARE THE WHOLE METHOD: stamp the frame, the box and the panel, press
   something, then ask whether those same elements are still the ones on screen.
   A redraw of the whole page mints new ones and the stamps go with the old. */
const MARK = ([pg, bx]) => {
  const put = (sel, k) => { const el = document.querySelector(sel); if (el) el.dataset.rowsMark = k; return !!el; };
  return { page: put(pg, 'page'), box: put(bx, 'box'), panel: put('#ins-panel', 'panel') };
};

const PAGES = [
  { k: 'approvals', view: 'approvals', rowSel: '.apn-table [data-ap-row]', tabSel: '[data-apn-tab]', tabKey: 'data-apn-tab',
    box: '#apn-q', home: 'mine', word: 'carton', wholeSel: '.apn-table thead th', pageSel: '.apn-page' },
  { k: 'obligations', view: 'obligations', rowSel: '#obn-body [data-ins-row]', tabSel: '[data-obn-tab]', tabKey: 'data-obn-tab',
    box: '#obn-q', home: 'open', word: 'pallets', wholeSel: '.obn-table.is-two-line thead th', pageSel: '.obn-page' },
  /* the overnight run, job 6 (10 Nov 2026): People. Every tab draws the one table (they only pick which people) */
  { k: 'people', view: 'directory', rowSel: '#dir-tbody [data-dir-row]', tabSel: '[data-dirn-tab]', tabKey: 'data-dirn-tab',
    box: '#dirn-q', home: 'all', word: 'amina', wholeSel: '#dir-page .apn-table.cun-table thead th', pageSel: '#dir-page', facts: '#dir-page .ctf-hf' },
  /* job 7: Reads. Its three tabs draw the one table; All's pack lines are rows inside the same body */
  /* job 8: Requests. Its four tabs draw the one table; a tab at 0 steps out */
  { k: 'requests', view: 'intake', rowSel: '.ikn-page .ikn-table tbody tr', tabSel: '[data-ikn-tab]', tabKey: 'data-ikn-tab',
    box: '#ikn-q', home: 'open', word: 'supply', wholeSel: '.ikn-page .ikn-table thead th', pageSel: '.ikn-page', facts: '.ikn-page .cun-head .ctf-hf' },
  /* job 9: Import. Its three tabs draw the one table */
  { k: 'import', view: 'migration', rowSel: '.mign-page .mign-table tbody tr', tabSel: '[data-mign-tab]', tabKey: 'data-mign-tab',
    box: '#mign-q', home: 'all', word: 'supply', wholeSel: '.mign-page .mign-table thead th', pageSel: '.mign-page', facts: '.mign-page .cun-head .ctf-hf' },
  /* job 10: My notes. Its tabs draw the one table; the foot comes and goes with the rows */
  { k: 'mynotes', view: 'mynotes', rowSel: '#mn-page .mnn-table tbody tr', tabSel: '[data-mnn-tab]', tabKey: 'data-mnn-tab',
    box: '#mnn-q', home: 'all', word: 'call', wholeSel: '#mn-page .mnn-table thead th', pageSel: '#mn-page.mnn-page', facts: '#mn-page .cun-head .ctf-hf' },
  /* job 11: Parties. Folders draws CARDS and hides the table, so it is a whole-page press by name: the generic tab
     step leaves it out, and step 4 below presses it and asks for the cards */
  { k: 'parties', view: 'customers', rowSel: '[data-cu-screen="list"] #cu-tbody tr', tabSel: '[data-cun-tab]', tabKey: 'data-cun-tab', skip: ['folders'],
    box: '#cun-q', home: 'all', word: 'kabras', wholeSel: '[data-cu-screen="list"] .apn-table.cun-table thead th', pageSel: '.cun-page[data-cu-screen="list"]',
    facts: '[data-cu-screen="list"] .cun-head .ctf-hf', folders: true },
  { k: 'reads', view: 'reads', rowSel: '#rd-page.rdn-page .rdn-table tbody tr', tabSel: '[data-rdn-tab]', tabKey: 'data-rdn-tab',
    box: '#rdn-q', home: 'all', word: 'notice', wholeSel: '#rd-page .rdn-table thead th', pageSel: '#rd-page.rdn-page', facts: '#rd-page .rdn-head .ctf-hf' },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const extra = NAMES.map((n, i) => Object.assign(
    fixtureContract('MK-1' + (10 + i), n[0], n[1], 'proc', 21000000 + i * 1300000, 'Under Review'),
    { lastAction: iso(-(116 - i * 3)) },
    /* job 9: three of them came in through Import, so its page is drawn (one still needs a look) */
    i < 3 ? { upload: { fileName: n[0] + '.pdf' }, migration: { importedAt: iso(-3), batch: 'b-rows', needsReview: i === 0 } } : {}));
  await seedWorkspace(h, { contracts: r5Contracts().concat(extra), approvalRules: R5_RULES });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });

  for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
    const page = await browser.newPage({ viewport: { width: w, height: hh } });
    const errs = [];
    page.on('pageerror', e => errs.push(String(e).slice(0, 160)));
    const at = `${w}×${hh}`;
    try {
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      const up = await until(page, () => typeof setView === 'function' && typeof currentUser === 'function' && !!currentUser()
        && typeof getContract === 'function' && !!getContract('MK-110'), null, 40000);
      if (!up) { check(`${at} signed in`, false); await page.close(); continue; }
      await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });

      for (const P of PAGES) {
        /* job 10: an empty My notes hides its box and tabs on purpose (nothing to filter), so the page is given three
           notes first — one late, one reviewed, one with no day — once for the whole run (they are the person's own) */
        if (P.k === 'mynotes') {
          const seeded = await page.evaluate(async () => {
            if (typeof mineLoad === 'function') await mineLoad(true);
            if ((mineList('note') || []).length) return 'kept';
            const past = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
            await mineSave('note', { title: 'Call the supplier about pallets', body: 'Call the supplier about pallets', reviewBy: past });
            await mineSave('note', { title: 'Check the notice period', body: 'Check the notice period', reviewedAt: new Date().toISOString() });
            await mineSave('note', { title: 'Read the annex again', body: 'Read the annex again' });
            return (mineList('note') || []).length;
          });
          if (!seeded) { check(`${at} mynotes: three notes to filter`, false); continue; }
        }
        await page.evaluate(v => setView(v), P.view);
        const drawn = await until(page, s => !!document.querySelector(s), P.rowSel, 15000);
        if (!drawn) { check(`${at} ${P.k}: the list is drawn`, false); continue; }
        await page.waitForTimeout(400);
        await page.screenshot({ path: path.join(OUT, `${w}-${P.k}-1-arrive.png`) });

        /* a row chosen, so the panel has something to lose */
        const row = await page.$(P.rowSel);
        if (row) { await row.click(); await page.waitForTimeout(350); }
        await page.evaluate(MARK, [P.pageSel, P.box]);
        const rows0 = await page.evaluate(s => document.querySelectorAll(s).length, P.rowSel);

        /* 1 · a tab */
        const pressed = await page.evaluate(([sel, key, skip]) => {
          /* Proposed is left out on purpose: it stands a different thing where the
             list stands and brings its own panel, so it is a whole-page press by
             design, not a rows one. */
          /* a page whose other tabs are at 0 shows only its lit one (a 0 tab steps out): pressing that is still a
             rows-only press, and the frame, box and panel must still stand */
          const all = [...document.querySelectorAll(sel)].filter(x => !['proposed', 'prop'].concat(skip || []).includes(x.getAttribute(key)));
          const b = all.find(x => !/is-on/.test(x.className)) || all.find(x => /is-on/.test(x.className));
          if (!b) return null;
          const k = b.getAttribute(key);
          b.click();
          return k;
        }, [P.tabSel, P.tabKey, P.skip]);
        await page.waitForTimeout(500);
        const tab = await page.evaluate(([sel, key, rs, pg, bx]) => ({
          rows: document.querySelectorAll(rs).length,
          live: [...document.querySelectorAll(sel)].filter(b => /is-on/.test(b.className)).map(b => b.getAttribute(key)),
          /* a pill's count sits in its own span (Approvals) or inside its words (Obligations, "Late 3") */
          counts: [...document.querySelectorAll(sel)].map(b => ((b.querySelector('span') || b).textContent || '').replace(/[^0-9]/g, '')),
          page: (document.querySelector(pg) || {}).dataset.rowsMark === 'page',
          box: (document.querySelector(bx) || {}).dataset.rowsMark === 'box',
          panel: (document.getElementById('ins-panel') || {}).dataset.rowsMark === 'panel',
        }), [P.tabSel, P.tabKey, P.rowSel, P.pageSel, P.box]);
        await page.screenshot({ path: path.join(OUT, `${w}-${P.k}-2-tab.png`) });
        check(`${at} ${P.k} 1 · a tab press keeps the frame, the box and the panel, and still moves the rows`,
          !!pressed && tab.page && tab.box && tab.panel && tab.live.length === 1 && tab.live[0] === pressed
          && tab.counts.every(c => /^\d+$/.test(String(c).trim())),
          Object.assign({ pressed, rows0 }, tab));

        /* 2 · typing: the whole word reaches the box, which is never replaced */
        await page.evaluate(([sel, key, home]) => {
          const b = [...document.querySelectorAll(sel)].find(x => x.getAttribute(key) === home);
          if (b) b.click();
        }, [P.tabSel, P.tabKey, P.home]);
        await page.waitForTimeout(400);
        await page.evaluate(MARK, [P.pageSel, P.box]);
        await page.click(P.box);
        await page.type(P.box, P.word, { delay: 55 });
        await page.waitForTimeout(450);
        const typed = await page.evaluate(([bx, rs, pg]) => {
          const el = document.querySelector(bx);
          return {
            value: el ? el.value : '', focused: !!el && document.activeElement === el, caret: el ? el.selectionStart : -1,
            rows: document.querySelectorAll(rs).length,
            page: (document.querySelector(pg) || {}).dataset.rowsMark === 'page',
            box: (document.querySelector(bx) || {}).dataset.rowsMark === 'box',
          };
        }, [P.box, P.rowSel, P.pageSel]);
        await page.screenshot({ path: path.join(OUT, `${w}-${P.k}-3-typed.png`) });
        check(`${at} ${P.k} 2 · every letter reaches the box, which is never redrawn under the caret`,
          typed.value === P.word && typed.focused && typed.caret === P.word.length && typed.box && typed.page,
          typed);

        /* 3 · the page is still whole */
        const whole = await page.evaluate(([ws, fs]) => ({ marks: document.querySelectorAll(ws).length,
          facts: ((document.querySelector(fs) || {}).textContent || '').trim() }), [P.wholeSel, P.facts || '#page-head-facts']);
        check(`${at} ${P.k} 3 · the page is still whole after both presses — its column heads or group lines, and the head's facts`,
          whole.marks > 0 && whole.facts.length > 0, whole);

        /* 4 · THE TAB THAT DRAWS ANOTHER SHAPE (Parties' Folders): pressed, the cards are drawn and the table hides;
           pressed back to the list, the table returns and the cards go. The first attempt left the cards stale. */
        if (P.folders){
          await page.evaluate(bx => { const el = document.querySelector(bx); if (el){ el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } }, P.box);
          await page.waitForTimeout(250);
          await page.evaluate(() => { const b = document.querySelector('[data-cun-tab="folders"]'); if (b) b.click(); });
          const drew = await until(page, () => document.querySelectorAll('.cunf-grid > *').length > 0, null, 5000);
          const F = await page.evaluate(() => { const sc = document.querySelector('#cu-tbody') && document.querySelector('#cu-tbody').closest('.cu-scroll');
            return { cards: document.querySelectorAll('.cunf-grid > *').length, tableHidden: !!(sc && sc.hidden),
              lit: [...document.querySelectorAll('[data-cun-tab].is-on')].map(b => b.getAttribute('data-cun-tab')) }; });
          await page.screenshot({ path: path.join(OUT, `${w}-${P.k}-4-folders.png`) });
          check(`${at} ${P.k} 4a · Folders draws its cards and hides the table`, drew && F.cards > 0 && F.tableHidden && F.lit.join() === 'folders', F);
          await page.evaluate(() => { const b = document.querySelector('[data-cun-tab="all"]'); if (b) b.click(); });
          const back = await until(page, () => !document.querySelector('.cunf-grid') && document.querySelectorAll('#cu-tbody [data-cu-cust]').length > 0, null, 5000);
          check(`${at} ${P.k} 4b · back on the list, the table is drawn and the cards are gone`, back);
        }

        /* put the box back for the next page */
        await page.evaluate(bx => { const el = document.querySelector(bx); if (el){ el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); } }, P.box);
        await page.waitForTimeout(250);
      }
      check(`${at} no page errors`, errs.length === 0, errs.slice(0, 3));
    } catch (e) { check(`${at} ran`, false, String(e).slice(0, 220)); }
    await page.close();
  }
  await browser.close();
  try { await h.stop(); } catch (_) {}
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
