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
    /* HALF REVERSED IN PLACE 25 Sep 2026 (Young: "below prepared for you
       card, add bring back the needs your attention card but only have 2
       lines and nothing more"). The decisions card is BACK and closes the
       page; the Portfolio row stays gone. */
    /* REVERSED 28 Sep 2026 (Young: "lets add just this part to the home page
       and discard the current 2 cards"): Prepared for you and Needs your
       decision are off Home; the one card under the Map is Prepared by
       Copilot, drawn only where an agent has work ready. */
    const agentsTitle = await page.evaluate(() => i18t('hm_ag_title'));
    check('3 the Map leads, Prepared by Copilot is the only card under it, and no Portfolio row is left',
      shape.sections[0] === shape.title && !shape.sections.includes(shape.decide)
        && !shape.sections.some(t => /Prepared for you/i.test(t))
        && !shape.sections.includes(shape.portfolio) && shape.sections.length <= 2
        && (shape.sections.length === 1 || shape.sections[1] === agentsTitle),
      shape.sections.join(' · '));
    check('3 no tiles and no "Choose tiles" — the Map took their place',
      shape.tiles === 0 && !shape.choose, `${shape.tiles} tiles · choose ${shape.choose}`);
    check('3 and the Map is the whole width of the page, like every Home card',
      shape.mapW > 600 && Math.abs(shape.mapW - shape.greetW) <= 1, `map ${shape.mapW} · page ${shape.greetW}`);
    check('3 the hero banner and the pipeline ring are gone',
      shape.banner === 0 && shape.ring === 0, `banner ${shape.banner} · ring ${shape.ring}`);

    /* ============ 3b. A QUARTER SHORTER (Young ruled 25 Sep 2026) ==========
       "reduce the where your contracts stand card by 25% as it is dominating
       the screen too much and taking over the whole screen." THE BASELINE IS
       A MEASUREMENT, NOT A TARGET TYPED FROM NOWHERE: the parent drew the card
       544.9px tall at every desktop width and 671.4 where the facts stack
       under the charts (1100px), read off a real page before a line moved.
       And the height may only come out of the AIR — every figure, door and
       the switch are counted as still drawn, in the same breath. */
    const PARENT_MAP_H = { desk: 544.9, stacked: 671.4 };
    const tall = async () => page.evaluate(() => {
      const m = document.getElementById('hm-map');
      return { h: m ? +m.getBoundingClientRect().height.toFixed(1) : 0,
        legend: m ? m.querySelectorAll('.hm-map-legend button').length : 0,
        months: m ? m.querySelectorAll('.hm-map-col').length : 0,
        facts: m ? m.querySelectorAll('.hm-map-fact').length : 0,
        bar: m ? m.querySelectorAll('.hm-map-stages [data-hm-map^="stage:"]').length : 0,
        sw: m ? m.querySelectorAll('[data-hm-measure]').length : 0 };
    });
    const t1440 = await tall();
    await page.setViewportSize({ width: 1100, height: 800 });
    await page.waitForTimeout(600);
    const t1100 = await tall();
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);
    check('3b the Map is a quarter shorter on a desktop screen',
      t1440.h > 0 && t1440.h <= 0.75 * PARENT_MAP_H.desk,
      `${t1440.h}px against ${PARENT_MAP_H.desk} — ${((1 - t1440.h / PARENT_MAP_H.desk) * 100).toFixed(1)}% less`);
    check('3b and where the facts stack under the charts',
      t1100.h > 0 && t1100.h <= 0.75 * PARENT_MAP_H.stacked,
      `${t1100.h}px against ${PARENT_MAP_H.stacked} — ${((1 - t1100.h / PARENT_MAP_H.stacked) * 100).toFixed(1)}% less`);
    /* [wall] — true at the parent too, by design: it is what the height may
       NOT be bought with. */
    check('3b (wall) and nothing on it went — three stages, twelve months, three facts, the switch',
      t1440.legend === 3 && t1440.months === 12 && t1440.facts === 3 && t1440.bar >= 1 && t1440.sw === 2,
      JSON.stringify(t1440));

    /* ======= 3c. THE STAGES WEAR THE CONTRACTS LIST'S OWN COLOURS ========
       "The color code of the drafting, review and executed should match the
       color coding in the contracts list page." Measured on BOTH pages, the
       way a reader compares them: one contract is staged into each stage so
       all three draw, the Map's bar and squares are read, then the Contracts
       page is opened and its stage dots read, stage by stage. */
    const mapTones = await page.evaluate(() => {
      const live = state.contracts.filter(c => !c.archived && c.status !== 'Declined');
      window.__s3c = live.slice(0, 3).map(c => ({ c, status: c.status }));
      ['Draft', 'Under Review', 'Signed'].forEach((st, i) => { if (live[i]) live[i].status = st; });
      renderDashboard();
      const bg = e => e ? getComputedStyle(e).backgroundColor : null;
      const out = {};
      for (const k of ['Draft', 'Under Review', 'Signed']) {
        const seg = document.querySelector(`#hm-map .hm-map-stages [data-hm-map="stage:${k}"]`);
        const leg = document.querySelector(`#hm-map .hm-map-legend [data-hm-map="stage:${k}"] .hm-map-sw`);
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
    check('3c each stage on the Map is the colour the Contracts list gives it — the bar and the square',
      toneRows.every(r => r.list && r.bar === r.list && r.square === r.list),
      toneRows.map(r => `${r.k}: list ${r.list} · bar ${r.bar} · square ${r.square}`).join(' | '));

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
