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
       an exact match is the only check that means anything. */
    const notWhite = await page.evaluate(() => {
      const bad = [];
      /* RE-POINTED IN PLACE 21 Sep 2026: the rows are inside .hm-card now (the
         reference's own card), so the card is the white surface and the list
         inside it paints nothing of its own. The claim is unchanged — every
         white surface on this page is exactly #ffffff. */
      ['#side-nav', '.hm-tile', '.hm-card'].forEach(sel =>
        document.querySelectorAll(sel).forEach(e => {
          const bg = getComputedStyle(e).backgroundColor;
          if (bg !== 'rgb(255, 255, 255)') bad.push(sel + ' → ' + bg);
        }));
      return bad;
    });
    check('2 every white surface is exactly #ffffff, not a shade of one',
      notWhite.length === 0, notWhite.slice(0, 3).join(' | ') || 'all pure');

    /* ================= 3. THE MAP TOOK THE TILES' PLACE =================
       REVERSED IN PLACE 24 Sep 2026 (Young, over the drawing "Executive Home
       Options": the Map picked by name, a Count · Value switch, then "instead
       of needs your decision, delete it and replace with prepared for you",
       then "Build it"). What stood here pinned four tiles you choose, one row
       height and "Needs your decision" closing the page; every one of those
       went with the tiles. The page is the greeting, the Map, and Prepared for
       you when something is prepared. The retired banner and ring stay proved
       absent as pixels. */
    const shape = await page.evaluate(() => {
      const map = document.getElementById('hm-map'), greet = document.querySelector('.hm-greet');
      return {
        sections: [...document.querySelectorAll('.hm-sec h2')].map(e => e.textContent.trim()),
        title: i18t('home_map_title'), portfolio: i18t('home_portfolio_sec'), decide: i18t('home_needs_decision'),
        tiles: document.querySelectorAll('.hm-tile').length,
        choose: !!document.getElementById('kpi-customize'),
        mapW: map ? Math.round(map.getBoundingClientRect().width) : 0,
        greetW: greet ? Math.round(greet.getBoundingClientRect().width) : -1,
        banner: document.querySelectorAll('.hm-banner').length,
        ring: document.querySelectorAll('.hm-pipe-card, #hm-segs, #hm-ring-row').length,
      };
    });
    check('3 the Map leads, and no decisions card or Portfolio row is left',
      shape.sections[0] === shape.title && !shape.sections.includes(shape.decide)
        && !shape.sections.includes(shape.portfolio) && shape.sections.length <= 2,
      shape.sections.join(' · '));
    check('3 no tiles and no "Choose tiles" — the Map took their place',
      shape.tiles === 0 && !shape.choose, `${shape.tiles} tiles · choose ${shape.choose}`);
    check('3 and the Map is the whole width of the page, like every Home card',
      shape.mapW > 600 && Math.abs(shape.mapW - shape.greetW) <= 1, `map ${shape.mapW} · page ${shape.greetW}`);
    check('3 the hero banner and the pipeline ring are gone',
      shape.banner === 0 && shape.ring === 0, `banner ${shape.banner} · ring ${shape.ring}`);

    /* ================= 4. THE FIGURES SIT ON ONE LINE ====================
       RE-POINTED IN PLACE 24 Sep 2026: the tiles' figures are the Map's stage
       figures now, and the same rule holds — three figures in a row sit on
       one line. THE PICKER'S HALF IS REVERSED: the desktop picker left with
       the tiles it chose, and the readings it offered are still offered by the
       phone's own sheet, off the same catalogue — asked here so nothing a
       person could choose yesterday is unreachable today. */
    const tops = await page.evaluate(() =>
      [...document.querySelectorAll('.hm-map-lv')].map(e => Math.round(e.getBoundingClientRect().top)));
    check('4 the stage figures share one baseline',
      tops.length === 3 && Math.max(...tops) - Math.min(...tops) <= 1, tops.join(' / '));
    const offered = await page.evaluate(() => (window.kpiCatalogOrder ? kpiCatalogOrder() : []));
    const want = ['lifecycle', 'compliance', 'importq', 'coverage'];
    check('4 the phone\'s picker still offers the four Portfolio readings',
      want.every(id => offered.includes(id)),
      `missing ${want.filter(id => !offered.includes(id)).join(',') || 'none'}`);

    /* ================= 5. EVERY FIGURE IS A DOOR, AND A ZERO IS NOT ======
       RE-POINTED IN PLACE 24 Sep 2026 to the Map's own figures. The rule is
       unchanged: a figure with something behind it is a door with an arrow,
       and a zero still draws — it is true — but refuses the press. */
    const doors = await page.evaluate(() => [...document.querySelectorAll('.hm-map-fact')].map(e => ({
      label: ((e.querySelector('.hm-map-fl') || {}).textContent || '').trim(),
      n: ((e.querySelector('.hm-map-ff') || {}).textContent || '').trim(),
      refused: !!e.disabled, arrow: !!e.querySelector('.hm-map-go'),
      dest: e.getAttribute('data-hm-map') || '' })));
    const liveD = doors.filter(d => !d.refused), deadD = doors.filter(d => d.refused);
    check('5 every side figure with something behind it carries a destination and an arrow',
      liveD.every(d => d.dest && d.arrow), `${liveD.length} live: ` + liveD.map(d => d.label).join(', '));
    check('5 a zero is refused and loses its arrow',
      deadD.every(d => !d.arrow && !d.dest) && doors.length === 3,
      `${deadD.length} refused: ` + deadD.map(d => `${d.label}=${d.n}`).join(', '));
    check('5 and nothing on Home is a drag handle any more',
      (await page.evaluate(() => document.querySelectorAll('#content [draggable="true"]').length)) === 0);

    /* ================= 6. THE NUMBER AND THE LIST MUST MATCH ============= */
    /* The whole rule in one press, on the Map: three contracts staged to end
       in one month, the column says three, and the list it opens has three
       rows in it. Worked out separately they drift, and then the card lies. */
    const promised = await page.evaluate(() => {
      const day = (m, d) => { const t = new Date(); const x = new Date(t.getFullYear(), t.getMonth() + m, d);
        return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); };
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined').slice(0, 3);
      /* KEPT, AND PUT BACK AFTER THE PRESS. Four months out with thirty days'
         notice is inside the renewal window, so these three would otherwise
         put a renewal on the overnight desk and section 11's CONTROL — an
         empty desk draws nothing — would be measuring this section's stage. */
      window.__s6 = live.map(c => ({ c, had: Object.fromEntries(['status', 'parentId', 'expiry', 'metadata']
        .map(k => [k, Object.prototype.hasOwnProperty.call(c, k) ? { v: c[k] } : null])) }));
      live.forEach(c => { c.status = 'Signed'; c.parentId = null; c.expiry = day(4, 15);
        c.metadata = Object.assign({}, c.metadata, { expiryDate: c.expiry, noticePeriodDays: 30 }); });
      renderDashboard();
      const col = document.querySelector('[data-hm-map="month:4"]');
      if (!col) return null;
      const n = hmMapData().months[4].n;
      col.click();
      return n;
    });
    await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => ({
      view: state.view,
      rows: document.querySelectorAll('#reg-body tr[data-row], tr[data-row]').length,
    }));
    check('6 pressing a month opens the register',
      landed.view === 'register', landed.view);
    check('6 and the list is exactly as long as the number promised',
      promised != null && promised > 0 && landed.rows === promised,
      `column said ${promised} · list shows ${landed.rows}`);
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
       heard of it — the fault regShowOnly and the shell's search box were both
       fixed for. The number on the door is the whole book's, so the list it
       opens must hold exactly that many. */
    await page.evaluate(() => { if (window.regSetScope) regSetScope('negotiations');
      const R = regState(); R.stage = 'all'; setView('dashboard'); });
    await page.waitForTimeout(900);
    const stageDoor = await page.evaluate(async () => {
      const b = document.querySelector('#hm-map .hm-map-legend [data-hm-map^="stage:"]');
      if (!b) return null;
      const k = b.getAttribute('data-hm-map').split(':')[1];
      const want = hmMapData().stages.find(s => s.k === k).n;
      b.click();
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
        /* RE-POINTED 24 Sep 2026: the tiles left; the Map is the card. */
        tile: getComputedStyle(document.getElementById('hm-map')).backgroundColor };
    });
    check('8 the one act on the page stays legible at night',
      ratio(dark.ink, dark.bg) >= 4.5, `ink ${ratio(dark.ink, dark.bg)}:1`);
    /* REVERSED IN PLACE (21 Sep 2026): the act is FILLED now, so its edge is
       its fill and the claim is the fill against the page. */
    check('8 and its fill stands off the page',
      ratio(dark.bg, dark.page) >= 3, `fill ${ratio(dark.bg, dark.page)}:1`);
    check('8 the Map takes the dark surface, not the light one',
      dark.tile !== 'rgb(255, 255, 255)' && dark.tile !== dark.page, dark.tile);
    await page.screenshot({ path: path.join(OUT, '04-dark.png') });
    await page.click('#theme-btn');
    await page.waitForTimeout(1000);

    /* ================= 9. THE MAP STACKS RATHER THAN CRUSHING =========== */
    /* RE-POINTED IN PLACE 24 Sep 2026: the tile row became the Map's body —
       the charts beside the three facts, and the facts under the charts below
       1100px. What it has to prove is unchanged: nothing ever scrolls the
       page sideways. */
    for (const w of [1280, 1100, 900]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(700);
      const r = await page.evaluate(() => ({
        cols: getComputedStyle(document.querySelector('.hm-map-body')).gridTemplateColumns.split(' ').length,
        sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      }));
      check(`9 ${w}: the Map fits and the page never scrolls sideways`,
        !r.sideways && (w > 1100 ? r.cols === 2 : r.cols === 1), `${r.cols} columns`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ============ 10. NOTHING ON THE MAP IS CUT OFF =====================
       RE-POINTED IN PLACE 24 Sep 2026. The claim this carried — one height
       for every tile, and no tile clipping its content — is asked of the Map:
       none of its figures or labels is cut off, at four real widths. The
       clip check is still the half that earns its place: scrollHeight against
       clientHeight is how a browser answers it, and nothing else can. */
    for (const w of [1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 860 });
      await page.waitForTimeout(600);
      const t = await page.evaluate(() => [...document.querySelectorAll('.hm-map-fact, .hm-map-legend button')].map(el => ({
        name: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 30),
        clipped: el.scrollHeight > el.clientHeight + 1,
      })));
      const clipped = t.filter(x => x.clipped).map(x => x.name);
      check(`10 ${w}: nothing on the Map has its content cut off`, t.length === 6 && clipped.length === 0,
        clipped.length ? 'clipped: ' + clipped.join(', ') : `${t.length} figures clear`);
    }
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ============ 11. THE OVERNIGHT DESK (idea 19, three kinds) =========
       WHY THIS IS A BROWSER FILE. Four of the claims below cannot be asked
       anywhere else: whether the section is VISIBLE PIXELS rather than markup
       behind something, whether it sits ABOVE the reader's own list, whether a
       real press really puts a row away, and — the one the owner's own question
       found — whether a contract on the desk is listed ONCE on this page. A
       source check sees the filter and cannot see the page.

       THE CONTROL COMES FIRST: the seeded book prepares nothing, so an empty
       desk must draw no heading at all. Without that, "the section appears"
       would be satisfied by a section that is always there. */
    const deskBefore = await page.evaluate(() =>
      ({ rows: document.querySelectorAll('#hm-desk-rows .hm-row').length,
         heads: [...document.querySelectorAll('.hm-sec h2')].map(h => h.textContent.trim()) }));
    check('11a nothing prepared draws no desk at all',
      deskBefore.rows === 0 && !deskBefore.heads.some(t => /Prepared for you/i.test(t)),
      `${deskBefore.rows} rows · ${deskBefore.heads.join(' / ')}`);

    /* THE THREE STATES, STAGED ON REAL RECORDS in the reader's own book — a
       counterparty obligation past its date, an upload whose standards pass
       found something and that nobody has opened, and an agreement in force
       inside its renewal window. Nothing here invents a flag the product does
       not store. */
    const staged = await page.evaluate(() => {
      const day = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined');
      const [a, b, cc, dd2] = live;
      if (!a || !b || !cc || !dd2) return null;
      /* A SECOND RENEWAL, further out, so the cap holds it back. Young reported
         the fault it proves: the desk draws one renewal and used to strike
         EVERY qualifying renewal out of the list below, so the rest were on
         neither list. Its decision date is inside the 90-day window, so it
         belongs in "Needs your decision" and must still be there. */
      dd2.status = 'Signed'; dd2.parentId = null; dd2.archived = null;
      dd2.expiry = day(85);
      dd2.metadata = Object.assign({}, dd2.metadata, { expiryDate: day(85), noticePeriodDays: 30 });
      a.status = 'Signed'; a.counterparty = a.counterparty || 'Nordkust';
      a.counterpartyEmail = 'ops@nordkust.example';
      a.obligations = [{ id: 'ob-desk', desc: 'Quarterly volume report', due: day(-4),
        party: 'theirs', status: 'open' }];
      b.source = 'upload'; b.counterparty = b.counterparty || 'Kibo Traders';
      b.triage = { at: day(-1), seenAt: null,
        steps: { playbook: { ok: true, dev: 2, miss: 1, cats: ['Payment terms', 'Liability'] } } };
      cc.status = 'Signed'; cc.parentId = null; cc.expiry = day(40);
      cc.metadata = Object.assign({}, cc.metadata, { expiryDate: day(40), noticePeriodDays: 30 });
      renderDashboard();
      return { chase: a.id, dev: b.id, ren: cc.id, ren2: dd2.id };
    });
    check('11b the three states could be staged on real records', !!staged,
      staged ? `${staged.chase} / ${staged.dev} / ${staged.ren}` : 'fewer than three live contracts');

    await page.screenshot({ path: path.join(OUT, '11-desk.png') });

    /* VISIBLE PIXELS, not markup: a row inside a collapsed or hidden container
       measures zero and would pass every attribute check ever written. */
    const desk = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#hm-desk-rows .hm-row')];
      const r0 = rows[0] ? rows[0].getBoundingClientRect() : null;
      const dd = document.querySelector('#hm-dd-rows .hm-row');
      const sec = [...document.querySelectorAll('.hm-sec')]
        .find(x => /Prepared for you/i.test((x.querySelector('h2') || {}).textContent || ''));
      return {
        n: rows.length,
        painted: rows.filter(el => { const r = el.getBoundingClientRect();
          return r.width > 40 && r.height > 20 && getComputedStyle(el).display !== 'none'; }).length,
        top: r0 ? Math.round(r0.top) : null,
        /* THE HEADINGS, NOT THE ROWS. "Needs your decision" draws its own empty
           state when nothing is waiting, so a row there is not something this
           claim may depend on — and the claim is about where the SECTION sits. */
        secTop: (() => { const h = [...document.querySelectorAll('.hm-sec')]
          .find(x => /Prepared for you/i.test((x.querySelector('h2') || {}).textContent || ''));
          return h ? Math.round(h.getBoundingClientRect().top) : null; })(),
        mapTop: (() => { const m = document.getElementById('hm-map');
          return m ? Math.round(m.getBoundingClientRect().top) : null; })(),
        ddTop: dd ? Math.round(dd.getBoundingClientRect().top) : null,
        sub: sec ? ((sec.querySelector('.hm-desk-sub') || {}).textContent || '').trim() : '',
        acts: rows.map(el => [...el.querySelectorAll('[data-desk-act]')]
          .map(b => b.getAttribute('data-desk-act')).join('+')),
        kinds: rows.map(el => (el.querySelector('[data-desk-kind]') || {}).getAttribute
          ? el.querySelector('[data-desk-kind]').getAttribute('data-desk-kind') : ''),
      };
    });
    /* ---- PIN THE RELATION, NOT THE THREE NAMES (re-pointed 16 Sep 2026) ----
       This asserted the literal 'chase,deviations,renewal', so the day the desk
       grew a fourth kind (the notice, S6) it failed on a claim that was never
       about which kinds exist. What it is for is THE CEILING AND THE SPREAD:
       three rows, no kind twice, and in DESK_KINDS' own order — which is
       exactly what stops one noisy kind taking the whole desk. Read off the
       product's own list rather than typed here, so the next kind added costs
       this file nothing. */
    const order = await page.evaluate(() => (window.DESK_KINDS || []).slice());
    check('11c three rows draw, no kind twice, in the desk\'s own order',
      desk.n === 3
      && new Set(desk.kinds).size === desk.kinds.length
      && desk.kinds.every((k, i) => i === 0 || order.indexOf(k) > order.indexOf(desk.kinds[i - 1])),
      `${desk.n} · ${desk.kinds.join(', ')} · order ${order.join(', ')}`);
    check('11d and every one of them is visible pixels',
      desk.painted === desk.n && desk.n > 0, `${desk.painted} of ${desk.n} painted`);
    /* REVERSED IN PLACE 24 Sep 2026: the reader's own list left the page, and
       the owner's drawing puts prepared work UNDER the Map. */
    check('11e the desk sits BELOW the Map',
      desk.secTop != null && desk.mapTop != null && desk.secTop > desk.mapTop,
      `map ${desk.mapTop}px · desk ${desk.secTop}px`);
    /* THE PROMISE THE WHOLE DESK RESTS ON, and no clock time — HaTi does not
       yet work while nobody is watching, so "finished 05:40" would be the page
       inventing a night shift. */
    check('11f the sub-line promises what is true and claims no night shift',
      /nothing was sent or filed/i.test(desk.sub) && !/\d\d:\d\d/.test(desk.sub), desk.sub);
    /* ---- AND IT NAMES NOTHING THE READER CANNOT REACH (Young, 9 Sep 2026) ----
       "keep it as it is but remove the '2 out of 9' because i have no ability
       to see the rest of the 9." It read "9 things … showing 2 of 9" and there
       is no door onto the other seven, so the count is the rows being drawn.
       Asserted as the RELATION — the number in the line equals the number of
       rows — so the claim holds on any book rather than on this fixture. */
    const subN = await page.evaluate(() => {
      const sub = (document.querySelector('.hm-desk-sub') || {}).textContent || '';
      const m = /(\d+)/.exec(sub);
      return { n: m ? Number(m[1]) : null, rows: document.querySelectorAll('#hm-desk-rows .hm-row').length,
        sub: sub.replace(/\s+/g, ' ').trim() };
    });
    check('11f2 the count is the rows on screen, not a population with no door onto it',
      subN.n !== null && subN.n === subN.rows, `"${subN.sub}" over ${subN.rows} rows`);
    check('11f3 …and it no longer says "showing N of M"',
      !/showing|\bof\b\s*\d/i.test(subN.sub), subN.sub);
    /* `every` ON AN EMPTY LIST IS TRUE, so the count is asserted with it — the
       claim is that THREE rows each carry one, not that none of nought does. */
    check('11g every row carries a way to put it away',
      desk.acts.length === 3 && desk.acts.every(a => a.includes('discard')),
      `${desk.acts.length} rows · ${desk.acts.join(' | ')}`);

    /* ---- ONE DOOR: the owner's own question, end to end ---- */
    const once = await page.evaluate(id => {
      const inDesk = [...document.querySelectorAll('#hm-desk-rows [data-desk-cid]')]
        .some(b => b.getAttribute('data-desk-cid') === id);
      const inDd = [...document.querySelectorAll('#hm-dd-rows [data-sel]')]
        .some(b => b.getAttribute('data-sel') === id);
      return { inDesk, inDd };
    }, staged ? staged.ren : '');
    /* RE-POINTED IN PLACE 24 Sep 2026: the one-door rule was that a contract
       is LISTED once on this page. The decisions list left, so the desk is the
       only list; the Map counts and lists nothing. */
    check('11h a renewal the desk prepared is listed once — the desk is the only list',
      once.inDesk && !once.inDd && !(await page.evaluate(() => !!document.getElementById('hm-dd-rows'))),
      `desk ${once.inDesk} · another list ${once.inDd}`);
    /* ---- AND ONE THE CAP HELD BACK IS STILL SOMEWHERE (Young, 9 Sep 2026) ----
       "it says 2 of 9 but does it mean copilot prepared 9 in total and if so,
       where is the rest of the 9?" — and the answer was that the renewals among
       them were nowhere at all. Only the row being DRAWN may evict anything. */
    const held = await page.evaluate(id => {
      const inDesk = [...document.querySelectorAll('#hm-desk-rows [data-desk-cid]')]
        .some(b => b.getAttribute('data-desk-cid') === id);
      const inDd = [...document.querySelectorAll('#hm-dd-rows [data-sel]')]
        .some(b => b.getAttribute('data-sel') === id);
      /* EITHER KIND. Since 16 Sep a contract inside its notice window is on
         the desk as a NOTICE rather than as a renewal — the sharper form of
         the same decision, and the two are deliberately mutually exclusive per
         contract. What this check is for is that the fixture really is
         something the desk would draw. */
      const qualifies = (window.deskItems ? deskItems(state.contracts) : [])
        .some(x => (x.kind === 'renewal' || x.kind === 'notice') && x.cid === id);
      return { inDesk, inDd, qualifies };
    }, staged ? staged.ren2 : '');
    check('11h2 a second renewal decision really does qualify for the desk', held.qualifies);
    check('11h3 …the cap keeps it off the desk',
      !held.inDesk, `on the desk: ${held.inDesk}`);
    /* RE-POINTED IN PLACE 24 Sep 2026: "not lost" is now the Map — the
       contract the cap held back is still COUNTED in the month it ends. */
    const heldOnMap = await page.evaluate(id => hmMapData().months.some(M => M.ids.includes(id)), staged ? staged.ren2 : '');
    check('11h4 …and it is still on the Map, in its month, not lost',
      heldOnMap, `counted on the Map: ${heldOnMap}`);
    /* AND THE CONTROL THAT MAKES THAT CLAIM MEAN SOMETHING. On a quiet book
       "Needs your decision" can be empty, and then "not in the list" is true of
       every contract there is. 11l below dismisses the desk's renewal and
       proves the SAME contract then appears in that list — so the filter was
       really doing something, rather than the list being empty. */

    /* ---- A VERB THAT CANNOT WORK IS NOT DRAWN ---- */
    const noAddr = await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      c.counterpartyEmail = '';
      renderDashboard();
      const row = [...document.querySelectorAll('#hm-desk-rows .hm-row')]
        .find(el => (el.querySelector('[data-desk-cid]') || {}).getAttribute
          && el.querySelector('[data-desk-cid]').getAttribute('data-desk-cid') === id);
      if (!row) return null;
      return { send: !!row.querySelector('[data-desk-act="send"]'),
        says: /no address/i.test(row.textContent) };
    }, staged ? staged.chase : '');
    check('11i with no address on file, Send is not drawn and the row says why',
      noAddr && !noAddr.send && noAddr.says,
      noAddr ? `send drawn ${noAddr.send} · says ${noAddr.says}` : 'row not found');

    /* ---- A REAL PRESS PUTS A ROW AWAY, AND IT STAYS AWAY ---- */
    const away = await page.evaluate(async id => {
      const btn = [...document.querySelectorAll('#hm-desk-rows [data-desk-act="discard"]')]
        .find(b => b.getAttribute('data-desk-cid') === id);
      if (!btn) return null;
      const before = document.querySelectorAll('#hm-desk-rows .hm-row').length;
      btn.click();
      await new Promise(r => setTimeout(r, 400));
      const c = state.contracts.find(x => x.id === id);
      const cids = [...document.querySelectorAll('#hm-desk-rows [data-desk-cid]')]
        .map(b => b.getAttribute('data-desk-cid'));
      return { before, after: document.querySelectorAll('#hm-desk-rows .hm-row').length,
        /* THE STAMP IS THE ROW'S OWN KEY, whichever kind was on screen — it
           asked for `desk.renewal` by name, which stopped being the row about
           this contract's renewal decision the day the notice took its place.
           deskKeyOf's own shape, read rather than typed. */
        stamped: !!(c && c.desk && Object.keys(c.desk).length),
        stampedKeys: c && c.desk ? Object.keys(c.desk) : [],
        stillThere: cids.includes(id), cids };
    }, staged ? staged.ren : '');
    /* THE CLAIM IS THAT THIS ROW GOES, NOT THAT THE COUNT DROPS. With a second
       renewal held back by the cap, discarding the one on screen PROMOTES it
       into the free slot — which is the cap working — so the count stays at
       three and only the contract changes. Pinned as the count this went red
       the moment the fixture grew a second renewal, which is the same
       pin-the-relation lesson this suite keeps paying for. */
    check('11j pressing Discard really takes that row off the page',
      away && !away.stillThere, away ? away.cids.join(' | ') : 'button not found');
    check('11j2 …and the renewal the cap was holding back steps into its place',
      away && staged && away.cids.includes(staged.ren2),
      away ? away.cids.join(' | ') : 'no rows');
    check('11k and the record carries the stamp, so it does not come back',
      away && away.stamped, away ? (away.stampedKeys || []).join(' | ') : '—');

    /* RE-POINTED IN PLACE 24 Sep 2026: put away from the desk, it is still
       counted on the Map — putting a row away hides the proposal, never the
       contract. */
    const moved = await page.evaluate(id => hmMapData().months.some(M => M.ids.includes(id)), staged ? staged.ren : '');
    check('11l …and it is still counted on the Map — putting a row away hides nothing else',
      moved === true, `counted on the Map: ${moved}`);

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
