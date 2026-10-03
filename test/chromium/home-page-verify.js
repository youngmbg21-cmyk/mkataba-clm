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
  /* No approval rules (re-pointed 27 Sep 2026): this stage marks a fixture over
     5,000,000 signed in the browser, and the server now holds that behind the
     legacy default rule — the rulebook's line for a stage not about approvals. */
  await seedWorkspace(h, { approvalRules: [] });
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
    /* RE-POINTED 20 Sep 2026 (the redesign, DECIDE 4): the dark 44px bar is
       gone. The bar is 48px, LIGHT — the surface token, with the primary ink on
       it — and the brand ground moved onto the mark at the top of the column.
       ---- REVERSED IN PLACE 21 Sep 2026 (Young: "make it the color of the
       color mode the user chooses, Green on blue") ---- the height and the
       white COLUMN half of DECIDE 4 stand; the bar's own white half does not.
       AND THE CLAIM IS NOW A RELATION, never a colour: the bar is painted in
       --nav-bg, the workspace's own brand ground, so it FOLLOWS the brand
       rather than naming one — asserted by resolving that token live and
       requiring the bar to equal it, which is what stops a later palette pass
       moving one and not the other. The ink is white over it. */
    const barGround = await page.evaluate(() => {
      const probe = document.createElement('span');
      probe.style.cssText = 'position:absolute;left:-9999px;background:var(--nav-bg)';
      document.body.appendChild(probe);
      const bg = getComputedStyle(probe).backgroundColor;
      probe.remove();
      return bg;
    });
    check('1 the bar is 48px and carries the WORKSPACE\'S OWN brand ground',
      shell.bar.h === 48 && shell.bar.bg === barGround && shell.bar.ink === 'rgb(255, 255, 255)',
      `${shell.bar.h}px · bar ${shell.bar.bg} · --nav-bg ${barGround} · ink ${shell.bar.ink}`);
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
       an exact match is the only check that means anything.
       RE-POINTED IN PLACE 3 Oct 2026 (Young: Home is the board and the map):
       the board is the screen's own Dark or Light by the owner's ruling, so
       its cards are not white surfaces; the column and the head row are. */
    const notWhite = await page.evaluate(() => {
      const bad = [];
      ['#side-nav', '#hb-head'].forEach(sel =>
        document.querySelectorAll(sel).forEach(e => {
          const bg = getComputedStyle(e).backgroundColor;
          if (bg !== 'rgb(255, 255, 255)') bad.push(sel + ' → ' + bg);
        }));
      return bad;
    });
    check('2 every white surface is exactly #ffffff, not a shade of one',
      notWhite.length === 0, notWhite.slice(0, 3).join(' | ') || 'all pure');

    /* ================= 3. THE BOARD TOOK THE MAP'S PLACE =================
       REVERSED IN PLACE 3 Oct 2026 (Young, over the "HaTi Live Board"
       artifact: "this home page becomes your full insights page and explorer
       page", Prepared by Copilot "below your book card", then "Go ahead and
       build"). What stood here pinned the Map — its height, its twelve months,
       its three facts and its Count · Value switch — and every one of those
       went with it (the story is in docs/MAP-HISTORY.md). The page is the
       board: Your book leads, Prepared by Copilot under it when something is
       prepared. The retired banner, ring and tiles stay proved absent. */
    const shape = await page.evaluate(() => {
      const book = document.getElementById('hb-book'), board = document.getElementById('hb-board');
      return {
        cards: [...document.querySelectorAll('#hb-board > .hb-card > .hb-ch .hb-ct')].map(e => e.textContent.trim()),
        book: i18t('hb_book'), agents: i18t('hm_ag_title'),
        tiles: document.querySelectorAll('.hm-tile').length,
        choose: !!document.getElementById('kpi-customize'),
        map: !!document.getElementById('hm-map'),
        bookW: book ? Math.round(book.getBoundingClientRect().width) : 0,
        boardW: board ? Math.round(board.clientWidth - parseFloat(getComputedStyle(board).paddingLeft) - parseFloat(getComputedStyle(board).paddingRight)) : -1,
        banner: document.querySelectorAll('.hm-banner').length,
        ring: document.querySelectorAll('.hm-pipe-card, #hm-segs, #hm-ring-row').length,
      };
    });
    check('3 Your book leads, Prepared by Copilot is the only card under it',
      shape.cards[0] === shape.book && shape.cards.length <= 2
        && (shape.cards.length === 1 || shape.cards[1] === shape.agents),
      shape.cards.join(' · '));
    check('3 no tiles, no "Choose tiles" and no Map — the board took their place',
      shape.tiles === 0 && !shape.choose && !shape.map, `${shape.tiles} tiles · choose ${shape.choose} · map ${shape.map}`);
    check('3 and Your book is the whole width of the board',
      shape.bookW > 600 && Math.abs(shape.bookW - shape.boardW) <= 1, `book ${shape.bookW} · board ${shape.boardW}`);
    check('3 the hero banner and the pipeline ring are gone',
      shape.banner === 0 && shape.ring === 0, `banner ${shape.banner} · ring ${shape.ring}`);

    /* 3b RETIRED 3 Oct 2026 with the Map whose height it measured. What it
       guarded — that nothing the reader needs was cut to make room — is asked
       of the board: six figures and three stages, all drawn. */
    const drawn = await page.evaluate(() => ({ figs: document.querySelectorAll('#hb-book .hb-fig').length,
      stages: document.querySelectorAll('#hb-book .hb-stagekey button').length }));
    check('3b Your book draws all six figures and all three stages',
      drawn.figs === 6 && drawn.stages === 3, JSON.stringify(drawn));

    /* ======= 3c. THE STAGES WEAR THE CONTRACTS LIST'S OWN COLOURS ========
       "The color code of the drafting, review and executed should match the
       color coding in the contracts list page." Measured on BOTH pages, the
       way a reader compares them: one contract is staged into each stage so
       all three draw, the board's bar and squares are read, then the Contracts
       page is opened and its stage dots read, stage by stage. */
    const mapTones = await page.evaluate(() => {
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined');
      window.__s3c = live.slice(0, 3).map(c => ({ c, status: c.status }));
      ['Draft', 'Under Review', 'Signed'].forEach((st, i) => { if (live[i]) live[i].status = st; });
      renderDashboard();
      const bg = e => e ? getComputedStyle(e).backgroundColor : null;
      const out = {};
      for (const k of ['Draft', 'Under Review', 'Signed']) {
        const seg = document.querySelector(`#hb-book .hb-stagebar [data-hb-dig="st:${k}"]`);
        const leg = document.querySelector(`#hb-book .hb-stagekey [data-hb-dig="st:${k}"] i`);
        out[k] = { bar: bg(seg), square: bg(leg) };
      }
      return out;
    });
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1200);
    const listTones = await page.evaluate(() => {
      const out = {};
      document.querySelectorAll('tr[data-row]').forEach(tr => {
        const c = state.contracts.find(x => x.id === tr.getAttribute('data-row'));
        const dot = tr.querySelector('.reg-stg i');
        if (c && dot && !out[c.status]) out[c.status] = getComputedStyle(dot).backgroundColor;
      });
      return out;
    });
    await page.evaluate(() => { (window.__s3c || []).forEach(({ c, status }) => { c.status = status; });
      delete window.__s3c; setView('dashboard'); });
    await page.waitForTimeout(1000);
    const toneRows = ['Draft', 'Under Review', 'Signed'].map(k => ({ k, list: listTones[k] || null,
      bar: mapTones[k] && mapTones[k].bar, square: mapTones[k] && mapTones[k].square }));
    check('3c each stage on Your book is the colour the Contracts list gives it — the bar and the square',
      toneRows.every(r => r.list && r.bar === r.list && r.square === r.list),
      toneRows.map(r => `${r.k}: list ${r.list} · bar ${r.bar} · square ${r.square}`).join(' | '));

    /* ================= 4. THE FIGURES SIT ON ONE LINE ====================
       RE-POINTED IN PLACE 3 Oct 2026: the six figures of Your book. The
       picker's half stands: the phone's sheet still offers the readings. */
    const tops = await page.evaluate(() =>
      [...document.querySelectorAll('#hb-book .hb-fig .hb-fig-n')].map(e => Math.round(e.getBoundingClientRect().top)));
    check('4 the six figures share one baseline',
      tops.length === 6 && Math.max(...tops) - Math.min(...tops) <= 1, tops.join(' / '));
    const offered = await page.evaluate(() => (window.kpiCatalogOrder ? kpiCatalogOrder() : []));
    const want = ['lifecycle', 'compliance', 'importq', 'coverage'];
    check('4 the phone\'s picker still offers the four Portfolio readings',
      want.every(id => offered.includes(id)),
      `missing ${want.filter(id => !offered.includes(id)).join(',') || 'none'}`);

    /* ================= 5. EVERY FIGURE IS A DOOR, AND A ZERO IS NOT ======
       RE-POINTED IN PLACE 3 Oct 2026 to Your book. The rule is unchanged: a
       figure with something behind it is a door, and a zero still draws — it
       is true — but refuses the press. */
    const doors = await page.evaluate(() => [...document.querySelectorAll('#hb-book .hb-fig-main, #hb-book .hb-stagekey button')].map(e => ({
      label: (e.textContent || '').replace(/\s+/g, ' ').trim(),
      zero: /^0\b|\b0$/.test((e.querySelector('.hb-fig-n, b') || {}).textContent || ''),
      refused: !!e.disabled, dest: e.getAttribute('data-hb-dig') || '' })));
    const liveD = doors.filter(d => !d.refused), deadD = doors.filter(d => d.refused);
    check('5 every figure with something behind it is a door',
      liveD.length > 0 && liveD.every(d => d.dest && !d.zero), `${liveD.length} live: ` + liveD.map(d => d.label).join(', '));
    check('5 a zero is refused and goes nowhere',
      deadD.every(d => !d.dest && d.zero) && doors.filter(d => d.zero).every(d => d.refused),
      `${deadD.length} refused: ` + deadD.map(d => d.label).join(', '));
    check('5 and nothing on Home is a drag handle any more',
      (await page.evaluate(() => document.querySelectorAll('#content [draggable="true"]').length)) === 0);

    /* ================= 6. THE NUMBER AND THE LIST MUST MATCH ============= */
    /* The whole rule in one press, on Your book: three contracts staged to end
       next month, "Ending in 90 days" says so, its dig-in lists them, and
       "Open these" opens a Contracts list exactly as long.
       RE-POINTED IN PLACE 3 Oct 2026 from the Map's month column. */
    const promised = await page.evaluate(() => {
      const day = (m, d) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + m, d);
        return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined').slice(0, 3);
      window.__s6 = live.map(c => ({ c, had: Object.fromEntries(['status', 'parentId', 'expiry', 'metadata']
        .map(k => [k, Object.prototype.hasOwnProperty.call(c, k) ? { v: c[k] } : null])) }));
      live.forEach(c => { c.status = 'Signed'; c.parentId = null; c.expiry = day(1, 15);
        c.metadata = Object.assign({}, c.metadata, { expiryDate: c.expiry, noticePeriodDays: 30 }); });
      renderDashboard();
      const fig = document.querySelector('#hb-book .hb-fig-main[data-hb-dig="f:ending"]');
      if (!fig) return null;
      const n = hbBookData('all').figs.ending.n;
      fig.click();
      return { n, printed: Number(fig.querySelector('.hb-fig-n').textContent.replace(/\D/g, '')) };
    });
    await page.waitForTimeout(600);
    /* CHART FIRST (3 Oct 2026): the dig-in opens as a chart; the rows are on
       the List switch, which is where the reader counts them */
    await page.click('#hb-focus [data-hb-digview="list"]').catch(() => {});
    await page.waitForTimeout(300);
    const listed = await page.evaluate(() => document.querySelectorAll('#hb-board .hb-dig .hb-rows [data-hb-dig^="c:"]').length);
    await page.click('#hb-board .hb-dig [data-hb-open]').catch(() => {});
    await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => ({
      view: state.view,
      rows: document.querySelectorAll('#reg-body tr[data-row], tr[data-row]').length,
    }));
    check('6 the figure, its dig-in and the list it opens all say the same number',
      !!promised && promised.n >= 3 && promised.printed === promised.n && listed === promised.n,
      `figure ${promised && promised.printed} · reading ${promised && promised.n} · dig-in ${listed}`);
    check('6 "Open these" opens the register, exactly as long',
      landed.view === 'register' && !!promised && landed.rows === promised.n,
      `${landed.view} · list shows ${landed.rows}`);
    await page.screenshot({ path: path.join(OUT, '02-door-landed.png') });
    await page.evaluate(() => {
      (window.__s6 || []).forEach(({ c, had }) => Object.entries(had).forEach(([k, w]) => {
        if (w) c[k] = w.v; else delete c[k];
      }));
      delete window.__s6;
      if (window.regState) regState().only = null;
    });

    /* ---- 6b. A STAGE DOOR, PRESSED AFTER THE NEGOTIATIONS PAGE ----
       The Negotiations list is the Contracts table on its own seat, with its
       own filters, and the seat stays set when the reader leaves. A stage door
       that reads the filters without putting the seat back writes the stage
       into the Negotiations seat's state and opens a Contracts list that never
       heard of it. RE-POINTED IN PLACE 3 Oct 2026: on the board a stage digs
       in, and its "Open these" is the door onto Contracts on that stage. */
    await page.evaluate(() => { if (window.regSetScope) regSetScope('negotiations');
      const R = regState(); R.stage = 'all'; setView('dashboard'); });
    await page.waitForTimeout(900);
    const stageDoor = await page.evaluate(async () => {
      const b = document.querySelector('#hb-book .hb-stagekey [data-hb-dig^="st:"]');
      if (!b) return null;
      const k = b.getAttribute('data-hb-dig').split(':')[1];
      const want = hbBookData('all').stages.find(s => s.k === k).n;
      b.click();
      await new Promise(r => setTimeout(r, 400));
      const open = document.querySelector(`#hb-board .hb-dig [data-hb-stage="${k}"]`);
      if (!open) return { k, want, open: false };
      open.click();
      await new Promise(r => setTimeout(r, 900));
      return { k, want, view: state.view, scope: window.regScope ? regScope() : null,
        stage: regState().stage, got: window.regFiltered ? regFiltered().length : -1 };
    });
    check('6b a stage door opens the Contracts seat on that stage, whatever page came before',
      !!stageDoor && stageDoor.view === 'register' && !stageDoor.scope && stageDoor.stage === stageDoor.k,
      JSON.stringify(stageDoor));
    check('6b and the list holds exactly the number on the door',
      !!stageDoor && stageDoor.got === stageDoor.want,
      stageDoor ? `door said ${stageDoor.want} · list holds ${stageDoor.got}` : 'no stage door');
    await page.evaluate(() => { const R = regState(); R.stage = 'all'; });

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
        /* RE-POINTED 3 Oct 2026: the head row is the platform's surface on
           Home (the board below it is the screen's own Dark | Light). */
        tile: getComputedStyle(document.getElementById('hb-head')).backgroundColor };
    });
    check('8 the one act on the page stays legible at night',
      ratio(dark.ink, dark.bg) >= 4.5, `ink ${ratio(dark.ink, dark.bg)}:1`);
    /* REVERSED IN PLACE (21 Sep 2026): the act is FILLED now, so its edge is
       its fill and the claim is the fill against the page. */
    check('8 and its fill stands off the page',
      ratio(dark.bg, dark.page) >= 3, `fill ${ratio(dark.bg, dark.page)}:1`);
    check('8 the head row takes the dark surface, not the light one',
      dark.tile !== 'rgb(255, 255, 255)' && dark.tile !== dark.page, dark.tile);
    await page.screenshot({ path: path.join(OUT, '04-dark.png') });
    await page.click('#theme-btn');
    await page.waitForTimeout(1000);

    /* ================= 9. THE BOARD NEVER SCROLLS SIDEWAYS ==============
       RE-POINTED IN PLACE 3 Oct 2026 from the Map's body to the board: what
       it has to prove is unchanged — nothing ever scrolls the page sideways,
       and Your book keeps all six figures in reach at every width. */
    for (const w of [1280, 1100, 900]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => {
        const board = document.getElementById('hb-board'), br = board.getBoundingClientRect();
        const figs = [...document.querySelectorAll('#hb-book .hb-fig')];
        return { sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth || board.scrollWidth > board.clientWidth + 1,
          inside: figs.length === 6 && figs.every(f => { const x = f.getBoundingClientRect(); return x.left >= br.left - 1 && x.right <= br.right + 1; }) };
      });
      check(`9 ${w}: the board fits and the page never scrolls sideways`, !r.sideways && r.inside, JSON.stringify(r));
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ============ 10. NOTHING ON YOUR BOOK IS CUT OFF ====================
       RE-POINTED IN PLACE 3 Oct 2026 from the Map. None of the figures or the
       stage key has its content cut off, at four real widths. */
    for (const w of [1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(600);
      const t = await page.evaluate(() => [...document.querySelectorAll('#hb-book .hb-fig-main, #hb-book .hb-stagekey button')].map(el => ({
        name: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        clipped: el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1,
      })));
      const clipped = t.filter(x => x.clipped).map(x => x.name);
      check(`10 ${w}: nothing on Your book has its content cut off`, t.length === 9 && clipped.length === 0,
        clipped.length ? 'clipped: ' + clipped.join(', ') : `${t.length} figures clear`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ============ 11–12. THE DESK AND THE DECISIONS CARD LEFT HOME ==========
       RETIRED 28 Sep 2026 (Young: "lets add just this part to the home page
       and discard the current 2 cards"). What stood here drove the overnight
       desk (three kinds, Discard, the cap, the one-door eviction) and Needs
       your decision (two rows, See all, the empty line, the owner question) as
       pixels on Home. Both cards are gone; the desk's rows are on Copilot's
       work (agents-page-verify drives them) and the checklist keeps the five
       decision kinds (inspector-checklist-verify). The new card is driven by
       home-prepared-by-copilot-verify. What is asked here is that neither old
       card is painted, whatever the seeded book holds. */
    const gone = await page.evaluate(() => ({
      desk: !!document.getElementById('hm-desk-rows'), dd: !!document.getElementById('hm-dd-rows'),
      seeAll: !!document.querySelector('[data-hm-go="needsyou"]'),
      heads: [...document.querySelectorAll('.hm-sec h2')].map(h => h.textContent.trim()) }));
    check('11 neither Prepared for you nor Needs your decision is painted on Home',
      !gone.desk && !gone.dd && !gone.seeAll && !gone.heads.some(t => /Prepared for you|Needs your decision/i.test(t)),
      JSON.stringify(gone));

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
