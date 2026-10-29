/* Chromium verification: FOUR OFF FOUR SCREENSHOTS (Young, 19 Sep 2026).
   ======================================================================
   *"The highlighted selections are selected categories but the highlight is
   so faint you can barely notice it. shade should be darker and the words in
   white when selected. delete the templates overview page. insights should
   come after obligations. Exposure page is very bland and does not highlight
   where your eyes should focus on."*

   WHY A BROWSER FILE, item by item. Three of the four are invisible to a
   source test in exactly the way this codebase keeps paying for:

     · the lit filter row is a CASCADE FIGHT — two rules, both (0,2,0), and
       which one paints was decided by source order. The source read correct
       before the fix too: `.tpl-rail.on` set a background and
       `.tpl-rail-s.on` put the ink straight back to neutral;
     · the sidebar order is MARKUP order, and what a reader and the keyboard
       both follow is the painted top-to-bottom order, not the source;
     · "where your eyes should focus" is a question about PAINTED pixels —
       which row leads, which figure is largest, which ink a zero takes —
       and none of it can be read out of a template literal.

   THE COLOUR CLAIMS ARE RELATIONS. The lit row is asserted to be DARKER than
   the ground under it and its words LIGHTER than a resting row's, never a
   typed rgb, so a palette pass costs no edit here. 1d is the one absolute,
   and it is the industry's: 4.5:1.

   16 OF 31 ARE RED AT THE PARENT. The fifteen that pass there are CONTROLS
   and WALLS: 1a (a row really IS lit — the fault was the shade, not the
   absence), 1d (the OLD pale fill passes 4.5:1 too, so this is a wall on the
   new one rather than a fix), 1f, 2c, 2d, 3 (the stage earned the Insights
   door), 3b, 3d, 3e, 3f, 4e, 4j, 4l, 4m (THE ARITHMETIC WALL) and 9.

   RETIRED 29 Oct 2026: 3, 3a, 3e, 3f (the Insights menu door) and 4a-4l (the
   Exposure tab) measured the Insights page, which the owner had deleted.

   Run: node test/chromium/four-off-the-screenshots-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'four-off-screenshots');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* rgb(…) → 0–255 brightness, so "darker" and "lighter" are measurable
   without typing a colour. A transparent background answers null — a fill
   nobody can see is not a fill, and that is the whole of the owner's first
   report ("so faint you can barely notice it"). */
const lum = css => {
  const p = rgb(css);
  return p ? 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2] : null;
};
const rgb = css => {
  const m = String(css || '').match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const p = m[1].split(',').map(x => parseFloat(x));
  if (p.length > 3 && p[3] === 0) return null;
  return p;
};
/* WCAG relative luminance and contrast — the sRGB curve, not raw brightness.
   Written out because the whole ask was "the words in white when selected",
   and "is it readable" has one industry answer, which is this one. */
const rel = css => {
  const p = rgb(css); if (!p) return null;
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  return 0.2126 * f(p[0]) + 0.7152 * f(p[1]) + 0.0722 * f(p[2]);
};
const contrast = (a, b) => {
  const x = rel(a), y = rel(b); if (x == null || y == null) return null;
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

/* Contracts staged for the Exposure tab: one uncapped liability worth a great
   deal, one open price review worth much less, and three kinds nobody's paper
   trips at all — which is the owner's own screenshot, where three of six rows
   read zero and took as much of the page as the two that did not. */
const SEED = () => {
  const mk = (id, value, meta) => ({
    id, name: 'Staged ' + id, counterparty: 'Naivas ' + id, status: 'Signed',
    value, valueType: 'fixed', folder: 'proc', changes: [],
    metadata: Object.assign({ currency: 'KES' }, meta),
    audit: [{ action: 'Created', at: new Date().toISOString(), user: 'Amina' }],
  });
  /* AND THE INSIGHTS DOOR IS EARNED THROUGH THE PRODUCT'S OWN SWITCH. The
     nav's threshold reads `state.serverStats.total`, the SERVER's count, so
     rows unshifted into the browser's own list never open it however many
     there are — a first run of this file measured the order of a door that
     was display:none. "Show everything" is the reader's own control for
     exactly this, so the door is drawn for a reason a reader can reproduce. */
  try { navSetShowEverything(true); } catch (_) {}
  state.contracts.unshift(
    mk('EX-L1', 9000000, { liabilityCapped: 'uncapped' }),
    mk('EX-L2', 7000000, { liabilityCapped: 'uncapped' }),
    mk('EX-P1', 400000, { priceReview: 'open' }),
    mk('EX-OK', 100000, { liabilityCapped: 'capped', priceReview: 'nochange' }),
    mk('EX-OK2', 90000, { liabilityCapped: 'capped' }),
    mk('EX-OK3', 80000, { liabilityCapped: 'capped' }),
    /* AND ONE IN A CURRENCY NOBODY HAS A RATE FOR, so the asterisk really
       draws and 4k measures a sentence rather than passing on two absences.
       fxMissing's own rule: what is left out is counted and said. */
    mk('EX-FX', 5000000, { liabilityCapped: 'uncapped', currency: 'JPY' }),
  );
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    /* WAIT FOR THE SHELL, never a timer: `#app-shell` is display:none while
       body carries `pre-auth`, so a press against a tab inside it resolves to
       a real element that can never be clicked — which is a 30-second
       timeout and a harness failure that says nothing about the product. */
    await page.waitForFunction(() => !document.body.classList.contains('pre-auth'),
      null, { timeout: 25000 });
    await pause(1400);

    /* ============ 1 · A SELECTED ROW IS DARK, WITH WHITE WORDS ============
       *"the highlight is so faint you can barely notice it. shade should be
       darker and the words in white when selected."* MEASURED at the parent:
       the lit row was rgb(204,251,241) — pale mint on white — and its label
       was the same near-black as every row above it. */
    /* The book is seeded FIRST and the page left on Templates: section 3
       needs the Insights door drawn because it is EARNED, never because it is
       the view the reader is standing on (the nav's own escape). */
    await page.evaluate(SEED);
    /* RE-POINTED 9 Oct 2026 (SAP benchmark, batch 2): the rail with its lit row
       is the Templates page's NARROW shape now (where the inspector fits, the
       piles are the card's own tabs); section 1 holds that shape with the
       stage override and measures the rail there, then lets go. */
    await page.evaluate(() => { insForce(false); setView('templates'); });
    await pause(1400);

    const rail = await page.evaluate(() => {
      const pull = e => { const s = getComputedStyle(e);
        return { bg: s.backgroundColor, color: s.color, weight: s.fontWeight,
          txt: e.textContent.replace(/\s+/g, ' ').trim().slice(0, 30) }; };
      /* THE GROUND IS WHAT IS REALLY PAINTED UNDER THE ROW. `#content` is
         transparent, so reading it answers null and the claim passes on
         nothing — walk up until something paints. */
      const ground = e => { let n = e; while (n) { const c = getComputedStyle(n).backgroundColor;
        if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; n = n.parentElement; } return null; };
      const rows = [...document.querySelectorAll('.tpl-rail')];
      const on = rows.find(r => r.classList.contains('on'));
      const off = rows.find(r => !r.classList.contains('on'));
      const n = on ? on.querySelector('.tpl-rail-n') : null;
      return { page: on ? ground(on.parentElement) : null, on: on ? pull(on) : null, off: off ? pull(off) : null,
        count: n ? getComputedStyle(n).color : null, rows: rows.length };
    });
    const lOn = lum(rail.on && rail.on.bg), lOff = lum(rail.off && rail.off.bg);
    const cOn = lum(rail.on && rail.on.color), cOff = lum(rail.off && rail.off.color);
    check('1a · a row IS lit — the lit row has a fill a reader can see',
      rail.rows > 3 && lOn != null, { rows: rail.rows, on: rail.on });
    check('1b · and the fill is DARKER than the page, not a pale wash over it',
      lOn != null && lum(rail.page) != null && lOn < lum(rail.page) - 60,
      { lit: rail.on && rail.on.bg, page: rail.page, lum: [lOn, lum(rail.page)] });
    check('1c · the words are LIGHTER than the resting row’s, which is what "white" means here',
      cOn != null && cOff != null && cOn > cOff + 100,
      { on: rail.on && rail.on.color, off: rail.off && rail.off.color });
    check('1d · and the ink really reads against the fill — over 4.5:1',
      contrast(rail.on && rail.on.color, rail.on && rail.on.bg) >= 4.5,
      { ink: rail.on && rail.on.color, fill: rail.on && rail.on.bg,
        ratio: Math.round((contrast(rail.on && rail.on.color, rail.on && rail.on.bg) || 0) * 100) / 100 });
    check('1e · the COUNT goes white with its label — one row, one state',
      lum(rail.count) != null && lum(rail.count) > cOff + 100,
      { count: rail.count, resting: rail.off && rail.off.color });
    await page.evaluate(() => { insForce(null); });
    check('1f · a resting row is still transparent — nothing else on the rail moved',
      lOff === null, { off: rail.off });
    await page.screenshot({ path: path.join(OUT, '01-rail.png'), fullPage: false });

    /* ================= 2 · THE TEMPLATES OVERVIEW TAB IS GONE ===============
       Option (a) of the three the owner was offered: the tab goes and its four
       readings go with it. The READINGS THEMSELVES are kept built and
       unreferenced — every reading deleted outright in this codebase is a
       reading somebody rebuilds from scratch a month later, worse. */
    const tabs = await page.evaluate(() => ({
      keys: [...document.querySelectorAll('[data-tpl-tab]')].map(b => b.getAttribute('data-tpl-tab')),
      words: [...document.querySelectorAll('[data-tpl-tab]')].map(b => b.textContent.trim()),
      secs: [...document.querySelectorAll('[data-tpl-sec]')].map(s => s.getAttribute('data-tpl-sec')),
      healthRows: document.querySelectorAll('.tpl-h-row').length,
      built: typeof tplHealthHtml === 'function' && typeof tplHealthData === 'function'
        && typeof tplOverviewHtml === 'function',
    }));
    check('2a · two tabs, the book and the table — the overview is gone from the row',
      tabs.keys.length === 2 && tabs.keys[0] === 'book' && tabs.keys[1] === 'list'
      && !tabs.words.some(w => /overview/i.test(w)), tabs);
    check('2b · and gone from the page — no section, and no health rows anywhere',
      !tabs.secs.includes('overview') && tabs.healthRows === 0, tabs);
    check('2c · but the reading it drew is still BUILT — one line from coming back',
      tabs.built, tabs);
    check('2d · the book is where the reader goes instead, and it draws',
      await page.evaluate(async () => {
        document.querySelector('[data-tpl-tab="book"]').click();
        await new Promise(r => setTimeout(r, 400));
        const b = document.querySelector('[data-tpl-sec="book"]');
        return !!b && !b.hidden && b.getBoundingClientRect().height > 200;
      }));

    /* ================= 3 · INSIGHTS COMES AFTER OBLIGATIONS ================
       Markup order and nothing else — so the claim is the PAINTED order and
       the KEYBOARD order, which are the two things a reader actually follows.
       Every door keeps its own data-view, and the "New" badge travels inside
       the block it is in. */
    /* RE-POINTED 12 Oct 2026 (Young: Insights opens to the right with two
       folders, Insights and Jambo's agents): the Insights door is inside the
       fly-out now, so the fly-out is opened before the doors are read — it
       floats level with its opener, so the painted order still holds. */
    await page.evaluate(() => { const f = document.querySelector('.nav-fold[data-nav-fold="insights"]'); if (f && typeof navFoldOpen === 'function') navFoldOpen(f); });
    const nav = await page.evaluate(() => {
      const items = [...document.querySelectorAll('#side-nav .nav-item[data-view]')];
      return { order: items.map(b => b.getAttribute('data-view')),
        tops: items.map(b => Math.round(b.getBoundingClientRect().top)),
        disp: items.map(b => getComputedStyle(b).display),
      };
    });
    const iOb = nav.order.indexOf('obligations'), iTp = nav.order.indexOf('templates');
    /* RE-POINTED 17 Oct 2026 (the owner picked "Desk tabs", Round 2): on a computer the
       left menu is not drawn, so its doors are not painted; Insights is a place Jambo opens.
       The menu's order (3a, 3b) is still its source's. */
    /* 3 RETIRED 29 Oct 2026: measured the Insights page, which the owner had
       deleted ("Insights is a place Jambo opens, in his / list"). */
    /* RE-POINTED 20 Sep 2026 (DECIDE 4 of the redesign order): the rail is
       three groups — Work, Library, Company — so Insights (Company) is painted
       after Obligations (Work) as the 19 Sep ask wanted, but Requests
       (Library) now sits between them and Obligations leads Templates. The
       painted order is still the claim, read off the pixels. */
    /* RE-POINTED IN PLACE 27 Sep 2026 (Young: "move insights to below
       calendar"). These two had been red since 21 Sep, when Insights moved up
       to sit after Home; they described the 19-20 Sep place. Insights now
       closes the Work group below Calendar, so it is painted after Obligations
       and Calendar and BEFORE Library's Templates and Requests — the painted
       order is still the claim, read off the pixels. */
    /* RE-POINTED 11 Oct 2026 (WORKORDER-four-builds item 1): the Calendar is
       Home's second tab and has no rail door, so Insights closes Work
       directly after My notes */
    /* 3a RETIRED 29 Oct 2026: measured the Insights page, which the owner had
       deleted — where its menu door was painted. */
    check('3b · and Work leads Library — Obligations is painted before Templates',
      iTp >= 0 && iOb < iTp, nav.order.join(' · '));
    check('3c · the menu is not painted on a computer (its doors are Jambo\'s words)',
      await page.evaluate(() => getComputedStyle(document.getElementById('side-nav')).display === 'none'));
    check('3d · the keyboard walks it in the same order it is painted',
      await page.evaluate(async () => {
        const items = [...document.querySelectorAll('#side-nav .nav-item[data-view]')];
        items[items.findIndex(b => b.getAttribute('data-view') === 'obligations')].focus();
        document.activeElement.blur();
        /* Tab order IS document order for ordinary buttons with no tabindex;
           the claim is that none of them carries one, so the two cannot
           disagree. */
        return items.every(b => !b.hasAttribute('tabindex'));
      }));
    /* 3e, 3f RETIRED 29 Oct 2026: measured the Insights page, which the owner
       had deleted — the "New" badge and icon on its menu door. */

    /* ================= 4 · THE EXPOSURE COUNTING ============================
       4a-4l RETIRED 29 Oct 2026: measured the Insights page, which the owner
       had deleted — the Exposure tab's painted rows, bars and coverage line.
       4m is kept: exposureData still counts for the Board and Jambo. */
    /* THE WALL: this was an ORDERING AND WEIGHT change, never an arithmetic
       one. Every figure is the reading it was — asserted against the rows'
       own counts, which is the one thing a presentation pass may not move. */
    const arith = await page.evaluate(() => {
      const d = exposureData();
      const byKey = {}; d.rows.forEach(r => { byKey[r.k] = { n: r.n, value: r.value, ids: r.ids.slice().sort() }; });
      return { byKey, unread: d.unread.n, live: d.live };
    });
    check('4m · THE WALL — the counted figures are the record’s, unmoved',
      arith.byKey.liability && arith.byKey.liability.n === 3
      /* THREE contracts, TWO in the sum: EX-FX is counted as a contract and
         LEFT OUT of the money, which is fxMissing's rule and the reason the
         asterisk exists. A figure that quietly summed it at par would be the
         one thing this page may not do. */
      && arith.byKey.liability.value === 16000000
      && arith.byKey.price.n === 1 && arith.byKey.price.value === 400000
      && arith.byKey.indemnity.n === 0 && arith.byKey.autorenew.n === 0
      && arith.byKey.lockin.n === 0,
      arith.byKey);

    check('9 · no page errors in the whole run', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('harness', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  results.filter(r => !r.pass).forEach(r => console.log('  FAIL ' + r.name));
  process.exit(pass === results.length ? 0 : 1);
})();
