/* Chromium verification: THE HOME PAGE AND THE SHELL AROUND IT.
   ============================================================
   The enterprise design, owner-approved render 24 Aug 2026. This file replaces
   home-pipeline-ring-verify.js, whose whole subject — the donut, the stage key
   and the third column listing that stage's contracts — is retired with the
   card it drew. (card-popout-verify and card-collapse-verify went the same way
   when their features did; a browser file outlives its feature by nothing.)

   WHY THIS IS A BROWSER FILE, and not more claims in f3. Almost everything
   this change is about is a computed value or a geometry:
     · "the column is white and the bar is dark" is two backgrounds, and the
       swap between them is the largest single change in the product;
     · "pure white with no shade of any kind" (owner-asked, in those words) can
       only be checked by asking the browser what it actually painted;
     · "a card counting zero is not a door" is a disabled attribute AND the
       absence of an arrow — jsdom will happily click a control a reader
       cannot press;
     · the number on a tile and the length of the list behind it have to
       AGREE, and that can only be proved by pressing the tile and counting
       what arrives;
     · the dark theme's accent ink has been the fault on this page before, so
       it is measured rather than eyeballed.

   Screenshots go to test/chromium/shots/home-page/.
   Run: node test/chromium/home-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'home-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Contrast, so a colour claim is a measurement rather than an opinion. */
const lum = c => { const [r, g, b] = c.match(/\d+/g).map(Number);
  const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const x = lum(a), y = lum(b);
  return +(((Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)).toFixed(2)); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  const signIn = async page => {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);
  };

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });
    await signIn(page);
    await page.screenshot({ path: path.join(OUT, '01-home.png') });

    /* ================= 1. THE SHELL SWAPPED ITS GROUNDS ================== */
    const shell = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(), c = getComputedStyle(e);
        return { w: Math.round(r.width), h: Math.round(r.height), bg: c.backgroundColor, ink: c.color }; };
      return { bar: box('#top-header'), nav: box('#side-nav'),
        title: (document.getElementById('shell-title') || {}).textContent || '' };
    });
    check('1 the bar is 44px and carries the dark ground',
      shell.bar.h === 44 && shell.bar.ink === 'rgb(255, 255, 255)',
      `${shell.bar.h}px · ${shell.bar.bg}`);
    /* REVISED 25 Aug 2026. This ran at 1440 and asserted the column rests OPEN
       at 240. That was true while the float line sat at 1280, which put 1440
       above it — and the owner reported the shove back on a ThinkPad, so the
       line moved to 1536 and every supported LAPTOP floats now. Below the line
       the column rests as the 64px rail, deliberately: a floating column that
       arrived open would cover the page it is floating over.
       WHAT THIS TEST IS REALLY ABOUT IS THE GROUND — the shell swapped a dark
       column for a white one — so the WHITE half is asserted at both widths,
       and the width is asserted as the RULE rather than as one number. */
    check('1 the column is WHITE, whichever width it rests at',
      shell.nav.bg === 'rgb(255, 255, 255)', shell.nav.bg);
    check('1 and below the float line it rests as the rail, not an open column',
      shell.nav.w === 64, `${shell.nav.w}px at 1440`);
    /* THE NUMBER ITSELF IS NOT PINNED HERE — it has moved three times in two
       days on real reports from real laptops, and a literal would cost a test
       edit every time. WHAT IS PINNED IS THE DRIFT: the line lives in TWO
       places, navDrawerActive()'s `<=` in js/app.js and a `max-width` block in
       index.html, and they have to be the same number. nav-floats-verify
       straddles the line and owns the behaviour; this owns the pair. */
    const wide = await page.evaluate(async () => {
      const line = typeof NAV_DRAWER_W === 'number' ? NAV_DRAWER_W : null;
      let css = null;
      for (const sh of Array.from(document.styleSheets)) {
        let rules = null;
        try { rules = sh.cssRules; } catch (e) { continue; }
        for (const r of Array.from(rules || [])) {
          if (!r.conditionText || !/max-width/.test(r.conditionText)) continue;
          const txt = Array.from(r.cssRules || []).map(x => x.cssText).join(' ');
          if (!/#side-nav\b/.test(txt) || !/position:\s*fixed/.test(txt)) continue;
          const m = /max-width:\s*(\d+)px/.exec(r.conditionText);
          if (m) css = parseInt(m[1], 10);
        }
      }
      return { line, css };
    });
    check('1 the float line and the stylesheet block are the same number',
      wide.line != null && wide.line === wide.css, `js ${wide.line} · css ${wide.css}`);
    /* The phrase the retired banner used to carry. It is the page's name now
       and it lives in the bar, so losing the banner did not lose it. */
    check('1 the bar names the page, and it is the banner\'s own phrase',
      /Contract Lifecycle Management/i.test(shell.title), shell.title);

    /* ================= 2. PURE WHITE, ASKED OF THE BROWSER =============== */
    /* Owner-asked in these words: "the white backgrounds have to be pure white
       with no shade of any kind". A near-white is the thing being refused, so
       an exact match is the only check that means anything. */
    const notWhite = await page.evaluate(() => {
      const bad = [];
      ['#side-nav', '.hm-tile', '.hm-rows'].forEach(sel =>
        document.querySelectorAll(sel).forEach(e => {
          const bg = getComputedStyle(e).backgroundColor;
          if (bg !== 'rgb(255, 255, 255)') bad.push(sel + ' → ' + bg);
        }));
      return bad;
    });
    check('2 every white surface is exactly #ffffff, not a shade of one',
      notWhite.length === 0, notWhite.slice(0, 3).join(' | ') || 'all pure');

    /* ================= 3. THE THREE SECTIONS AND THEIR TILES ============= */
    const shape = await page.evaluate(() => ({
      sections: [...document.querySelectorAll('.hm-sec h2')].map(e => e.textContent.trim()),
      work: document.querySelectorAll('.hm-tile.is-work').length,
      port: document.querySelectorAll('.hm-tile.is-port').length,
      workH: [...document.querySelectorAll('.hm-tile.is-work')].map(e => Math.round(e.getBoundingClientRect().height)),
      portH: [...document.querySelectorAll('.hm-tile.is-port')].map(e => Math.round(e.getBoundingClientRect().height)),
      banner: document.querySelectorAll('.hm-banner').length,
      ring: document.querySelectorAll('.hm-pipe-card, #hm-segs, #hm-ring-row').length,
    }));
    check('3 three sections, in the design\'s order',
      shape.sections.length === 3, shape.sections.join(' · '));
    check('3 four tiles you choose and four that are fixed',
      shape.work === 4 && shape.port === 4, `${shape.work} + ${shape.port}`);
    check('3 and each row is one height, not four',
      new Set(shape.workH).size === 1 && new Set(shape.portH).size === 1,
      `work ${shape.workH.join('/')} · portfolio ${shape.portH.join('/')}`);
    /* The two things the design replaced, proved ABSENT as pixels rather than
       merely unreferenced — a retired class that still draws is not retired. */
    check('3 the hero banner and the pipeline ring are gone',
      shape.banner === 0 && shape.ring === 0, `banner ${shape.banner} · ring ${shape.ring}`);

    /* ================= 4. THE FIGURES IN A ROW SIT ON ONE LINE =========== */
    /* A footnote that wraps to two lines pushes its own figure up, and then
       four figures in a row sit on four different lines. */
    const tops = await page.evaluate(() =>
      [...document.querySelectorAll('.hm-tile.is-port .hm-n')].map(e => Math.round(e.getBoundingClientRect().top)));
    check('4 the Portfolio figures share one baseline',
      Math.max(...tops) - Math.min(...tops) <= 1, tops.join(' / '));

    /* ================= 5. EVERY TILE IS A DOOR, AND A ZERO IS NOT ======== */
    const doors = await page.evaluate(() => {
      const t = [...document.querySelectorAll('.hm-tile')];
      return t.map(e => ({
        title: (e.querySelector('.hm-t') || {}).textContent || '',
        n: (e.querySelector('.hm-n') || {}).textContent || '',
        dead: e.classList.contains('is-dead'),
        life: e.classList.contains('is-life'),
        /* Refused EITHER WAY — see hmTile. A fixed tile is `disabled`; a
           My-work tile is aria-disabled instead, because it is also the drag
           handle for reordering and a disabled button fires no drag events. */
        refused: !!e.disabled || e.getAttribute('aria-disabled') === 'true',
        draggable: e.getAttribute('draggable') === 'true',
        arrow: !!e.querySelector('.hm-go'),
        dest: e.getAttribute('data-hm-go') || '',
        go: e.getAttribute('data-hm-go') || (e.getAttribute('data-kpi-id') ? 'kpi' : ''),
      }));
    });
    const live = doors.filter(d => !d.dead && !d.life);
    const dead = doors.filter(d => d.dead);
    check('5 every live tile carries a destination and an arrow',
      live.length > 0 && live.every(d => d.go && d.arrow),
      `${live.length} live: ` + live.map(d => d.title.trim()).join(', '));
    /* A DOOR ONTO NOTHING IS A DEAD PRESS. The zero still draws — it is true —
       and the tile is DISABLED rather than merely unpainted, so the browser
       refuses the press and a keyboard reader is told. */
    check('5 a tile counting zero is refused and loses its arrow',
      dead.length > 0 && dead.every(d => d.refused && !d.arrow && !d.dest),
      `${dead.length} dead: ` + dead.map(d => `${d.title.trim()}=${d.n.trim()}`).join(', '));
    /* …AND CAN STILL BE MOVED. Disabling a My-work tile would refuse the press
       and take drag-reorder with it, so a reader could never shift a zero card
       out of first place. */
    check('5 but a zero card in My work is still draggable',
      dead.filter(d => d.draggable).every(d => !d.disabled),
      dead.filter(d => d.draggable).map(d => d.title.trim()).join(', ') || 'none');

    /* ================= 6. THE NUMBER AND THE LIST MUST MATCH ============= */
    /* The whole rule in one press: Pending approvals says 2, so the list it
       opens has 2 rows in it. Worked out separately they drift, and then the
       card is lying. */
    const promised = await page.evaluate(() => {
      const t = [...document.querySelectorAll('.hm-tile.is-work')]
        .find(e => /approval/i.test((e.querySelector('.hm-t') || {}).textContent || ''));
      if (!t) return null;
      t.click();
      return Number(((t.querySelector('.hm-n') || {}).textContent || '').replace(/\D/g, ''));
    });
    await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => ({
      view: state.view,
      rows: document.querySelectorAll('#reg-body tr[data-row], tr[data-row]').length,
    }));
    check('6 pressing a tile opens the register',
      landed.view === 'register', landed.view);
    check('6 and the list is exactly as long as the number promised',
      promised != null && landed.rows === promised,
      `tile said ${promised} · list shows ${landed.rows}`);
    await page.screenshot({ path: path.join(OUT, '02-door-landed.png') });

    /* ================= 7. THE EMAIL WARNING MOVED TO THE BELL ============ */
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1200);
    const onPage = await page.locator('#email-setup-banner').count();
    check('7 the warning strip is off the page',
      onPage === 0, onPage ? 'still drawn' : 'gone');
    await page.click('#hdr-notify');
    await page.waitForTimeout(700);
    const inPanel = await page.evaluate(() => {
      const el = document.getElementById('context-panel');
      const txt = el ? el.innerText : '';
      /* It ranks LAST: every row above it is work with somebody's name on it,
         and this is a setting nobody is blocked on this minute. */
      const rows = [...document.querySelectorAll('[data-alert-i]')].map(r => r.innerText);
      return { has: /email/i.test(txt), last: rows.length ? /email/i.test(rows[rows.length - 1]) : false,
        n: rows.length };
    });
    check('7 and it is an alert row instead',
      inPanel.has, inPanel.has ? `${inPanel.n} rows` : 'not in the panel');
    check('7 sorted under every piece of real work',
      inPanel.last, inPanel.last ? 'last' : 'not last');
    await page.screenshot({ path: path.join(OUT, '03-alerts.png') });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);

    /* ================= 8. THE DARK THEME'S ACCENT INK ==================== */
    /* This page has been caught here before: the accent ramp has no dark
       answer, so anything reading it directly goes dim at night. */
    await page.click('#theme-btn');
    await page.waitForTimeout(1400);
    const dark = await page.evaluate(() => {
      const b = document.querySelector('.hm-primary'), c = getComputedStyle(b);
      return { bg: c.backgroundColor, ink: c.color, edge: c.borderTopColor,
        page: getComputedStyle(document.body).backgroundColor,
        tile: getComputedStyle(document.querySelector('.hm-tile')).backgroundColor };
    });
    check('8 the one act on the page stays legible at night',
      ratio(dark.ink, dark.bg) >= 4.5, `ink ${ratio(dark.ink, dark.bg)}:1`);
    check('8 and its outline stays visible',
      ratio(dark.edge, dark.bg) >= 3, `edge ${ratio(dark.edge, dark.bg)}:1`);
    check('8 the tiles take the dark surface, not the light one',
      dark.tile !== 'rgb(255, 255, 255)' && dark.tile !== dark.page, dark.tile);
    await page.screenshot({ path: path.join(OUT, '04-dark.png') });
    await page.click('#theme-btn');
    await page.waitForTimeout(1000);

    /* ================= 9. THE ROW STACKS RATHER THAN CRUSHING =========== */
    /* The reference answers nothing under desktop width. These are HaTi's own
       rules, and what they have to prove is that nothing ever scrolls the page
       sideways. */
    for (const w of [1280, 1100, 900]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => ({
        cols: getComputedStyle(document.querySelector('.hm-tiles.is-work')).gridTemplateColumns.split(' ').length,
        sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
      check(`9 ${w}: the tiles fit their row and the page never scrolls sideways`,
        !r.sideways && r.cols >= 1 && r.cols <= 4, `${r.cols} columns`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ============ 10. ONE BOARD, NOT TWO BANDS (owner-asked 26 Aug 2026) ====
       "Make the cards in the second line have the same height as the cards in
       the 1st line." They were 141 and 176, two numbers typed 35px apart.

       THE HEIGHT IS PINNED AS A RELATION, NEVER A NUMBER — "every tile is the
       same height as every other" — so the next time somebody re-measures this
       page it costs no test edit. That lesson has been paid for four times in
       this suite already.

       AND THE CLIP CHECK IS THE HALF THAT EARNS ITS PLACE. Matching the rows is
       one line of CSS; matching them WITHOUT cutting content off is the thing
       that is easy to get wrong, and the first attempt did — 141 clipped all
       four Portfolio tiles, including three that look identical to a My work
       tile. scrollHeight against clientHeight is how a browser answers it, and
       nothing but a browser can. */
    for (const w of [1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(600);
      const t = await page.evaluate(() => [...document.querySelectorAll('.hm-tile')].map(el => ({
        name: (el.querySelector('.hm-t') || {}).textContent || '?',
        h: Math.round(el.getBoundingClientRect().height),
        clipped: el.scrollHeight > el.clientHeight + 1,
      })));
      const heights = [...new Set(t.map(x => x.h))];
      check(`10 ${w}: both rows are one height`, heights.length === 1,
        heights.length === 1 ? `${heights[0]}px` : 'heights: ' + heights.join(', '));
      const clipped = t.filter(x => x.clipped).map(x => x.name.trim());
      check(`10 ${w}: and no tile has its content cut off`, clipped.length === 0,
        clipped.length ? 'clipped: ' + clipped.join(', ') : `${t.length} tiles clear`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

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
