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
    await page.evaluate(() => setView('templates'));
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
    const nav = await page.evaluate(() => {
      const items = [...document.querySelectorAll('#side-nav .nav-item[data-view]')];
      return { order: items.map(b => b.getAttribute('data-view')),
        tops: items.map(b => Math.round(b.getBoundingClientRect().top)),
        disp: items.map(b => getComputedStyle(b).display),
        badgeInside: (() => { const n = document.getElementById('nav-intel-new');
          return n ? n.closest('.nav-item[data-view]').getAttribute('data-view') : 'absent'; })(),
        svg: (() => { const b = document.querySelector('.nav-item[data-view="intel"]');
          return b ? getComputedStyle(b.querySelector('svg')).color : null; })(),
      };
    });
    const iOb = nav.order.indexOf('obligations'), iIn = nav.order.indexOf('intel');
    const iTp = nav.order.indexOf('templates'), iRq = nav.order.indexOf('intake');
    check('3 · the Insights door is drawn at all — the stage earned it',
      nav.tops[iIn] > 0 && nav.disp[iIn] !== 'none',
      { top: nav.tops[iIn], display: nav.disp[iIn] });
    /* RE-POINTED 20 Sep 2026 (DECIDE 4 of the redesign order): the rail is
       three groups — Work, Library, Company — so Insights (Company) is painted
       after Obligations (Work) as the 19 Sep ask wanted, but Requests
       (Library) now sits between them and Obligations leads Templates. The
       painted order is still the claim, read off the pixels. */
    check('3a · Insights is painted after Obligations, with Requests (Library) between them',
      iOb >= 0 && iIn > iOb && iRq > iOb && iRq < iIn, nav.order.join(' · '));
    check('3b · and Work leads Library — Obligations is painted before Templates',
      iTp >= 0 && iOb < iTp, nav.order.join(' · '));
    check('3c · painted top-to-bottom in that order, never merely in the source',
      nav.tops[iOb] < nav.tops[iTp] && nav.tops[iTp] < nav.tops[iRq]
      && nav.tops[iRq] < nav.tops[iIn],
      [iOb, iTp, iRq, iIn].map(i => nav.order[i] + '@' + nav.tops[i]));
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
    check('3e · the "New" badge travelled inside the block it lives in',
      nav.badgeInside === 'intel', nav.badgeInside);
    check('3f · the svg colour rule still reaches it — keyed on the attribute, not the place',
      lum(nav.svg) != null, nav.svg);

    /* ================= 4 · THE EXPOSURE PAGE SAYS WHERE TO LOOK ============ */
    await page.evaluate(() => setView('intel'));
    await pause(1500);
    await page.click('[data-ig-tab="exposure"]');
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '02-exposure.png'), fullPage: true });

    const exp = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-exp-fig]')].map(td => {
        const tr = td.closest('tr');
        const first = tr.children[0], s = getComputedStyle(first);
        const fs_ = getComputedStyle(td);
        const title = first.firstElementChild;
        return {
          k: td.getAttribute('data-exp-fig'),
          n: Number(tr.children[1].textContent.trim()),
          figSize: parseFloat(fs_.fontSize),
          figInk: fs_.color,
          titleInk: getComputedStyle(title).color,
          bar: s.borderLeftColor, barW: parseFloat(s.borderLeftWidth),
          verb: !!tr.querySelector('[data-exp-go]'),
          top: Math.round(tr.getBoundingClientRect().top),
          left: Math.round(title.getBoundingClientRect().left),
        };
      });
      const cov = document.querySelector('[data-exp-go="unread"]');
      const tbl = document.querySelector('#ig-exp-body table');
      const host = document.getElementById('ig-exp-body');
      return { rows, host: !!host,
        inTable: cov ? !!cov.closest('table') : null,
        covBelow: (cov && tbl) ? cov.getBoundingClientRect().top > tbl.getBoundingClientRect().bottom : null,
        fxLine: !!host && host.textContent.replace(/\s+/g, ' ').includes('no exchange rate'),
        data: (typeof exposureData === 'function') ? (() => { const d = exposureData();
          return { lead: d.lead, order: d.rows.map(r => r.k),
            vals: d.rows.map(r => r.value), ns: d.rows.map(r => r.n),
            unread: d.unread.n }; })() : null,
      };
    });
    const nonZero = exp.rows.filter(r => r.n > 0);
    const zero = exp.rows.filter(r => !r.n);
    check('4a · the rows are painted worst-first, biggest value at the top',
      exp.rows.length >= 5
      && exp.rows.every((r, i) => i === 0 || exp.rows[i - 1].top < r.top)
      && exp.data && exp.data.vals.every((v, i) => i === 0 || exp.data.vals[i - 1] >= v),
      exp.data && exp.data.order.map((k, i) => k + ':' + exp.data.vals[i]));
    check('4b · a zero row sinks by construction — every zero is below every non-zero',
      nonZero.length && zero.length
      && Math.max(...nonZero.map(r => r.top)) < Math.min(...zero.map(r => r.top)),
      { nonZero: nonZero.map(r => r.k), zero: zero.map(r => r.k) });
    check('4c · a zero row stands down — its figures take a lighter ink than a live row’s',
      zero.length && nonZero.length
      && lum(zero[0].titleInk) > lum(nonZero[0].titleInk) + 40,
      { zero: zero[0] && zero[0].titleInk, live: nonZero[0] && nonZero[0].titleInk });
    check('4d · and it is NOT hidden — "no contract has this" is a fact worth reading',
      zero.length >= 2, zero.map(r => r.k));
    check('4e · a zero row draws no verb, because See all over nothing opens nothing',
      zero.every(r => !r.verb) && nonZero.every(r => r.verb),
      exp.rows.map(r => r.k + ':' + (r.verb ? 'verb' : '-')));
    check('4f · EXACTLY ONE row carries a painted bar, and it is the leading one',
      exp.rows.filter(r => lum(r.bar) != null && r.barW >= 3).length === 1
      && lum(exp.rows[0].bar) != null && exp.rows[0].barW >= 3,
      exp.rows.map(r => r.k + ':' + r.bar + '/' + r.barW));
    check('4g · the bar is RESERVED on every row, so no row’s words shift under it',
      new Set(exp.rows.map(r => r.left)).size === 1 && exp.rows.every(r => r.barW >= 3),
      exp.rows.map(r => r.k + '@' + r.left));
    check('4h · EXACTLY ONE figure on the page is drawn at the leading rung',
      exp.rows.filter(r => r.figSize > Math.min(...exp.rows.map(x => x.figSize))).length === 1
      && exp.rows[0].figSize > exp.rows[1].figSize,
      exp.rows.map(r => r.k + ':' + r.figSize));
    check('4i · the unread row has LEFT the table — it is coverage, not an exposure',
      exp.inTable === false && exp.covBelow === true
      && !exp.rows.some(r => r.k === 'unread'),
      { inTable: exp.inTable, below: exp.covBelow });
    check('4j · and it kept its door, so nothing behind it was lost',
      exp.data && exp.data.unread >= 0
      && await page.evaluate(() => !!document.querySelector('[data-exp-go="unread"]')));
    const fx = await page.evaluate(() => {
      const d = exposureData();
      const h = document.getElementById('ig-exp-body');
      return { left: d.fxLeft, rowLeft: d.rows.map(r => r.left),
        star: !!h && /\*/.test(h.textContent),
        line: !!h && h.textContent.replace(/\s+/g, ' ').includes('no exchange rate') };
    });
    check('4k · the asterisk earns a sentence — what was left out is counted and SAID',
      fx.left > 0 && fx.star && fx.line && exp.fxLine, fx);
    /* THE HOST IS `#ig-exp-body`, NEVER document.body — a first run read the
       whole document, matched the word "scores" inside a source comment about
       CSS specificity, and reported the product as carrying a rating. A check
       reading the wrong element is a description. */
    check('4l · and the tab still carries no score, no rating, no chart',
      exp.host && await page.evaluate(() => {
        const h = document.getElementById('ig-exp-body');
        return !!h && !/score|rating|out of 100/i.test(h.textContent)
          && !h.querySelector('canvas');
      }), { host: exp.host });

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
