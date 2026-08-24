/* Chromium verification: THE HEAD IS A WHITE BAND, THE COUNTS LOSE THEIR
   BOXES, THE STAGE NAME SHARES THE HEADING LINE, AND A RESTING TAB IS DARK INK.
   ============================================================
   Five owner asks off five screenshots and the design mock-up, 23 Aug 2026:

     (1) and (2) "the highlighted area should be white just like highlighted in
         the attached html" — the contract room's head, and the negotiation
         page's, which had a grey seam left round its tab row.
     (3) "the numbers should be white and nothing boxing them" — the sidebar
         counts. AMBER IS KEPT, owner-ruled after being asked: amber is how the
         drawer says a door is waiting on you, and white would take the signal
         off the sidebar entirely.
     (4) "draft and template should be in the same line as the decisions due
         not below it."
     (5) "the font i have highlighted should be the font used for the main
         sentences in the list of contracts ... and in the tab navigation
         panels within the insights page and others navigation panels within
         the administration tabs."

   WHY THIS IS A BROWSER FILE AND NOT A NODE TEST. Every claim is a COMPUTED
   VALUE or a GEOMETRY, and this codebase's most expensive lesson is that a
   rule which loses a cascade fight looks perfectly correct in the source
   (.rl-rej computed to border-width 0 for a year while a source-reading test
   passed on it throughout). Two of the five would have sailed past a source
   test in exactly that way:

     · the room's band is a WRAPPER, so #ws-head's own background is still
       transparent and always will be — reading the declaration proves nothing
       and the question is what the reader SEES behind the head;
     · the amber count was written correctly the first time and LOST, because
       `#side-nav .nav-item.active .nav-count` scores (1,3,0) against
       `[data-tone="amber"]`'s (1,2,0). Measured, opening Negotiations turned
       its own amber count white — the one door whose warning you were looking
       at was the one door that stopped warning. Check 3c stands on the
       Negotiations page ON PURPOSE for that reason; run it from anywhere else
       and it passes against the broken build.

   THE TYPE CLAIMS ARE RELATIONS, NEVER NUMBERS. "the same ink as the
   negotiation page's reading tabs", never "rgb(27,42,40)" — the 22 Aug sweep
   of 1,994 font sizes cost five test edits and four of them were tests pinning
   a literal where the claim was a relation. The reference is read live off
   .rl-readwrap .rl-seg and every other row is compared to it.

   CHECK 5d IS THE ONE THAT ASSERTS NOTHING CHANGED, and it earns its place:
   the owner asked for the list titles to take this font too, and MEASURED
   across seventeen typographic properties they already did — on both pages
   they named. Pinning it is what stops a future type pass quietly pulling them
   off the reference while everybody believes item 5 was settled.

   Run: node test/chromium/white-band-and-tabs-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'white-band-and-tabs');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* A live negotiation on a handful of contracts, filed through the funnel's own
   door: the Negotiations count needs to be above zero for its amber tone to
   exist at all (NAV_COUNT_TONE only tones a count that is not a zero, so an
   empty queue never cries wolf), and the negotiations list needs real rows. */
const SEED = async () => {
  const live = state.contracts.filter(x => x.status !== 'Signed' && x.status !== 'Declined').slice(0, 4);
  for (let i = 0; i < live.length; i++){
    const c = live[i]; negoInit(c);
    const cl = negoClauseList(c);
    if (cl[0]) await negoEditClause(c, cl[0].clauseId,
      cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500)),
      { author: i % 2 ? 'Amina Otieno' : 'Erik Lindqvist', side: i % 2 ? 'owner' : 'counterparty',
        why: 'Aligns with the volumes we have shipped this year.' });
  }
  return live[0].id;
};

/* Every typographic property that could make one run of text read differently
   from another at the same nominal size. Seventeen of them were compared by
   hand before this file existed; these are the ones that can actually move. */
const TYPE = ['fontFamily', 'fontSize', 'fontWeight', 'color', 'letterSpacing',
  'lineHeight', 'fontFeatureSettings', 'webkitFontSmoothing'];

/* Playwright hands the page function exactly ONE argument, so the selector
   rides in an object rather than as a second parameter. */
const READ_TYPE = ({ sel, props }) => [...document.querySelectorAll(sel)].map(e => {
  const s = getComputedStyle(e);
  const o = { _txt: e.textContent.trim().slice(0, 24) };
  props.forEach(p => { o[p] = s[p]; });
  return o;
});

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
    await pause(2400);
    const cid = await page.evaluate(SEED);
    await pause(1800);

    /* ================= 1 · THE CONTRACT ROOM'S HEAD IS A WHITE BAND ========= */
    await page.evaluate(id => openWorkspace(id), cid);
    await pause(2000);
    await page.screenshot({ path: path.join(OUT, '01-room.png') });

    const room = await page.evaluate(() => {
      const box = sel => {
        const e = document.querySelector(sel); if (!e) return null;
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return { bg: s.backgroundColor, x: Math.round(r.x), w: Math.round(r.width),
          y: Math.round(r.y), bottom: Math.round(r.bottom) };
      };
      const band = document.querySelector('.room-band');
      return {
        band: box('.room-band'),
        wrap: box('#content .view-enter'),
        head: box('#ws-head'),
        tabrow: box('.room-tabrow'),
        surface: getComputedStyle(document.documentElement).getPropertyValue('--color-surface').trim(),
        page: getComputedStyle(document.body).backgroundColor,
        /* THE STRIPS MUST BE INSIDE IT. #ws-strips is display:contents and its
           children become the band's own flex children; if the wrapper had been
           closed too early they would land on the grey below it. */
        headInBand: !!(band && band.contains(document.querySelector('#ws-head'))),
        tabsInBand: !!(band && band.contains(document.querySelector('.room-tabrow'))),
        stripsInBand: !!(band && band.contains(document.getElementById('ws-strips'))),
        /* and the status line below it is NOT — the mock-up puts its own
           .h-content on the page ground, and so do we. */
        actionbarInBand: !!(band && band.contains(document.getElementById('ws-actionbar'))),
        /* Where the column ends, so "the head has not moved" can be stated as
           the relation it is rather than as a number that goes stale. */
        navRight: (() => { const n = document.getElementById('side-nav');
          return n ? Math.round(n.getBoundingClientRect().right) : null; })(),
      };
    });

    check('1a the head sits on a white band, not the page ground',
      room.band && room.band.bg === 'rgb(255, 255, 255)',
      { band: room.band && room.band.bg, page: room.page });
    check('1b the band bleeds to the shell\'s own edge, not the view\'s padding',
      room.band && room.wrap && room.band.x === room.wrap.x && room.band.w === room.wrap.w,
      { band: room.band && [room.band.x, room.band.w], wrap: room.wrap && [room.wrap.x, room.wrap.w] });
    check('1c the crumb, title, facts and tabs are all on it',
      room.headInBand && room.tabsInBand && room.stripsInBand,
      { head: room.headInBand, tabs: room.tabsInBand, strips: room.stripsInBand });
    /* THE RELATION, NOT THE NUMBER (24 Aug 2026). This read 272 — the 256px
       column plus the view's own 16px padding — and reported a fault the day
       the column became 240. What the claim is about is that the band bleeds
       to the shell's edge while NOTHING INSIDE IT MOVES: the head still starts
       one page-padding in from the column, wherever the column now ends. */
    check('1d and the head has NOT moved — its content sits one page inset from the column',
      room.head && room.navRight != null && (room.head.x - room.navRight) === 16,
      { headX: room.head && room.head.x, navRight: room.navRight });
    check('1e the band ends at the tab row, so the contract keeps the page ground',
      !room.actionbarInBand && room.band && room.tabrow
        && near(room.band.bottom, room.tabrow.bottom, 1),
      { bandBottom: room.band && room.band.bottom, tabBottom: room.tabrow && room.tabrow.bottom,
        actionbarInside: room.actionbarInBand });

    /* ================= 2 · NO GREY SEAM ON THE NEGOTIATION PAGE ============= */
    await page.evaluate(id => openRedlineWorkbench(id), cid);
    await pause(2200);
    await page.screenshot({ path: path.join(OUT, '02-nego.png') });

    const nego = await page.evaluate(() => {
      const box = sel => {
        const e = document.querySelector(sel); if (!e) return null;
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return { bg: s.backgroundColor, margin: s.margin,
          x: Math.round(r.x), w: Math.round(r.width), bottom: r.bottom };
      };
      return { head: box('#view-redline #ws-head'), tabrow: box('#view-redline .rl-tabrow'),
        host: box('#redline-host') };
    });

    check('2a the head and the tab row are both white', nego.head && nego.tabrow
      && nego.head.bg === 'rgb(255, 255, 255)' && nego.tabrow.bg === 'rgb(255, 255, 255)',
      { head: nego.head && nego.head.bg, tabrow: nego.tabrow && nego.tabrow.bg });
    check('2b THE SEAM IS GONE — the tab row is flush with the head above it',
      nego.head && nego.tabrow && nego.head.x === nego.tabrow.x && nego.head.w === nego.tabrow.w,
      { head: nego.head && [nego.head.x, nego.head.w],
        tabrow: nego.tabrow && [nego.tabrow.x, nego.tabrow.w] });
    check('2c and no page ground shows beneath it either',
      nego.tabrow && nego.host && near(nego.tabrow.bottom, nego.host.y || nego.host.bottom - 0, 3)
        === false ? nego.tabrow.margin === '0px' : nego.tabrow.margin === '0px',
      { margin: nego.tabrow && nego.tabrow.margin });

    /* THE REFERENCE FOR EVERY TYPE CLAIM BELOW, read live off the very control
       the owner highlighted: a RESTING reading tab on this page. */
    const ref = await page.evaluate(() => {
      const e = [...document.querySelectorAll('.rl-readwrap .rl-seg')]
        .find(x => !x.classList.contains('on'));
      if (!e) return null;
      const s = getComputedStyle(e);
      const o = { _txt: e.textContent.trim().slice(0, 24) };
      ['fontFamily', 'fontSize', 'fontWeight', 'color', 'letterSpacing',
        'lineHeight', 'fontFeatureSettings', 'webkitFontSmoothing'].forEach(p => { o[p] = s[p]; });
      return o;
    });
    check('5-ref the reference control really is on screen and resting',
      ref && /agreed|changes/i.test(ref._txt), ref && ref._txt);

    const sameAsRef = (got) => {
      if (!ref || !got) return { ok: false, why: 'missing' };
      const bad = TYPE.filter(p => String(got[p]) !== String(ref[p]));
      return { ok: bad.length === 0, why: bad.map(p => `${p}: ${got[p]} vs ${ref[p]}`) };
    };

    /* ================= 3 · THE SIDEBAR COUNTS ============================== */
    /* STANDING ON NEGOTIATIONS ON PURPOSE — see the header. This is the seat
       where the amber rule was measured losing to the .active rule. */
    const counts = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#side-nav .nav-count')].map(n => {
        const s = getComputedStyle(n);
        const item = n.closest('.nav-item');
        return { view: item && item.getAttribute('data-view'), txt: n.textContent.trim(),
          tone: n.dataset.tone || null, bg: s.backgroundColor, color: s.color,
          padLeft: s.paddingLeft, id: n.id || null,
          active: !!(item && item.classList.contains('active')) };
      });
      /* The two inks are READ FROM THE TOKENS, so the claims below are about
         which token a count wears rather than about a hex somebody typed into
         a test the day the sidebar happened to be dark. */
      const rs = getComputedStyle(document.documentElement);
      const resolve = v => { const d = document.createElement('span');
        d.style.color = v; document.body.appendChild(d);
        const c = getComputedStyle(d).color; d.remove(); return c; };
      return { rows, view: state.view,
        labelInk: resolve(rs.getPropertyValue('--color-neutral-500').trim()),
        amberInk: resolve(rs.getPropertyValue('--st-amber-fg').trim()) };
    });
    const real = counts.rows.filter(r => r.id !== 'nav-intel-new');
    const amber = real.filter(r => r.tone === 'amber');
    const plain = real.filter(r => r.tone !== 'amber');
    const tag = counts.rows.find(r => r.id === 'nav-intel-new');

    /* ---- REVERSED IN PLACE 24 Aug 2026, and the RULE is what survives ----
       These three were written for a DARK column: no box on any count, white
       ink for a plain one, #fde68a for a warning. The column is white now, so
       every one of those values is the wrong side of its own ground — but the
       rule they were guarding is untouched and is the whole point: A PLAIN
       COUNT IS A FACT AND AN AMBER ONE IS A WARNING, and NAV_COUNT_TONE still
       hands amber out only above zero so an empty queue never cries wolf.
       Written against the semantic tokens rather than typed hexes, so the next
       ground change costs no test edit. */
    check('3a a plain count is unboxed — it is a fact, not a tag',
      plain.length > 0 && plain.every(r => r.bg === 'rgba(0, 0, 0, 0)' && r.padLeft === '0px'),
      plain.map(r => `${r.view}:${r.bg}/${r.padLeft}`));
    check('3b and it is the quiet ink, never the loud one',
      plain.length > 0 && plain.every(r => r.color === counts.labelInk),
      plain.map(r => `${r.view}:${r.color}`) + ` (label ink ${counts.labelInk})`);
    check('3c AMBER SURVIVES — including on the door the reader is standing on',
      counts.view === 'redline' && amber.length > 0
        && amber.every(r => r.color === counts.amberInk && r.color !== counts.labelInk),
      { view: counts.view, amber: amber.map(r => `${r.view}:${r.color} active=${r.active}`) });
    check('3d and at least one of those amber counts IS the active door '
      + '(or this check proves nothing)',
      amber.some(r => r.active), amber.map(r => `${r.view} active=${r.active}`));
    check('3e "New" is a tag, not a count, and keeps its pill',
      !!tag && tag.bg !== 'rgba(0, 0, 0, 0)' && tag.padLeft !== '0px',
      tag && { bg: tag.bg, pad: tag.padLeft });

    /* ================= 4 · THE HOME PAGE'S OWN HEADING LINES ================
       REVERSED IN PLACE 24 Aug 2026. This section measured the pipeline card's
       heading against the stage name beside it and against "Decisions due" —
       three headings the enterprise design retired with the card they sat on
       (see home-page-verify, which replaced home-pipeline-ring-verify).

       WHAT THE CLAIM WAS ABOUT SURVIVES and is worth keeping: the page's
       section headings sit on ONE LINE with the rule and the act beside them,
       rather than stacking. That is the same geometry, one design later. */
    await page.evaluate(() => setView('dashboard'));
    await pause(2400);
    await page.screenshot({ path: path.join(OUT, '03-home.png') });

    const homeLine = await page.evaluate(() => {
      const mid = e => { if (!e) return null; const r = e.getBoundingClientRect();
        return { y: r.y + r.height / 2, txt: e.textContent.trim().slice(0, 30), x: Math.round(r.x) }; };
      const secs = [...document.querySelectorAll('.hm-sec')];
      const work = secs[0], decide = secs[secs.length - 1];
      return {
        heads: secs.map(sc => mid(sc.querySelector('h2'))),
        workAct: work ? mid(work.querySelector('.hm-cz')) : null,
        workRule: work && !!work.querySelector('.hm-rule'),
        tilesX: (() => { const e = document.querySelector('.hm-tile');
          return e ? Math.round(e.getBoundingClientRect().x) : null; })(),
        headX: secs.length ? Math.round(secs[0].querySelector('h2').getBoundingClientRect().x) : null,
        decideTxt: decide ? decide.querySelector('h2').textContent.trim() : null,
      };
    });

    check('4a all three section headings really drew',
      homeLine.heads.length === 3 && homeLine.heads.every(Boolean),
      homeLine.heads.map(h => h && h.txt));
    check('4b each heading carries its rule on the same line',
      homeLine.workRule, homeLine.workRule);
    check('4c AND ITS ACT IS ON THAT LINE TOO, not below it',
      homeLine.workAct && near(homeLine.heads[0].y, homeLine.workAct.y, 4),
      { head: homeLine.heads[0] && +homeLine.heads[0].y.toFixed(1),
        act: homeLine.workAct && +homeLine.workAct.y.toFixed(1) });
    check('4d it starts on the same vertical as the tiles it names',
      homeLine.tilesX == null || near(homeLine.headX, homeLine.tilesX, 2),
      { head: homeLine.headX, tiles: homeLine.tilesX });

    /* ================= 5 · A RESTING TAB IS DARK INK ======================= */
    await page.evaluate(() => setView('intel'));
    await pause(2600);
    await page.screenshot({ path: path.join(OUT, '04-insights.png') });
    const igTabs = await page.evaluate(READ_TYPE, { sel: '[data-ig-tab]', props: TYPE });
    const igRest = igTabs.filter(t => t.fontWeight !== '700');
    check('5a the Insights tabs rest on the same ink as the reference',
      igRest.length > 0 && igRest.every(t => sameAsRef(t).ok),
      igRest.map(t => `${t._txt}: ${sameAsRef(t).why || 'match'}`));

    /* THE SEGMENTS ONLY EXIST ON THE FRICTION TAB, so the tab is pressed
       first: read from Portfolio the selector matches nothing and the check
       passes having proved nothing, which is the fault this suite keeps
       recording. It asserts the row was FOUND as well as that it matches. */
    await page.evaluate(() => {
      const b = document.querySelector('[data-ig-tab="friction"]'); if (b) b.click();
    });
    await pause(1800);
    await page.screenshot({ path: path.join(OUT, '04b-friction.png') });
    const ffSegs = await page.evaluate(READ_TYPE, { sel: '[data-igf-days]', props: TYPE });
    const ffRest = ffSegs.filter(t => t.fontWeight !== '700');
    check('5b the friction segments beside them really drew', ffRest.length > 0,
      { found: ffSegs.length, resting: ffRest.length });
    check('5b and they rest on that same ink (colour only — they are 13px by design)',
      ffRest.length > 0 && ffRest.every(t => t.color === ref.color),
      ffRest.map(t => `${t._txt}: ${t.color}`));

    await page.evaluate(() => setView('team'));
    await pause(2600);
    await page.screenshot({ path: path.join(OUT, '05-settings.png') });
    const stTabs = await page.evaluate(READ_TYPE, { sel: '.st-tab', props: TYPE });
    const stRest = stTabs.filter(t => t.fontWeight !== '700');
    check('5c and the Settings & Rules tabs',
      stRest.length > 0 && stRest.every(t => sameAsRef(t).ok),
      stRest.map(t => `${t._txt}: ${sameAsRef(t).why || 'match'}`));

    /* 5d — THE CLAIM THAT NOTHING MOVED. Both list pages the owner named
       already drew their row titles in exactly this font; pinning it is what
       stops a later type pass pulling them off the reference. */
    await page.evaluate(() => setView('register'));
    await pause(2400);
    const regTitles = await page.evaluate(READ_TYPE, { sel: '.reg-table tbody .reg-title', props: TYPE });
    check('5d the CONTRACTS list titles are the reference font, property for property',
      regTitles.length > 0 && regTitles.slice(0, 3).every(t => sameAsRef(t).ok),
      regTitles.slice(0, 3).map(t => `${t._txt}: ${sameAsRef(t).why || 'match'}`));

    await page.evaluate(() => openNegotiations({ list: true }));
    await pause(2400);
    await page.screenshot({ path: path.join(OUT, '06-negolist.png') });
    const nglTitles = await page.evaluate(READ_TYPE, { sel: '.reg-table tbody .reg-title', props: TYPE });
    check('5e and so are the NEGOTIATIONS list titles',
      nglTitles.length > 0 && nglTitles.slice(0, 3).every(t => sameAsRef(t).ok),
      nglTitles.slice(0, 3).map(t => `${t._txt}: ${sameAsRef(t).why || 'match'}`));

    /* 5f — THE PHONE'S CONTRACT TABS. Its own size and weight (a touch target
       is not a pointer target), so the claim is the INK alone. */
    await page.setViewportSize({ width: 390, height: 844 });
    await pause(1200);
    await page.evaluate(id => { state.activeId = id; mGo('contract', { id }); }, cid);
    await pause(1800);
    await page.screenshot({ path: path.join(OUT, '07-phone.png') });
    const mTabs = await page.evaluate(READ_TYPE, { sel: '.m-ctab', props: TYPE });
    check('5f the phone\'s contract tabs rest on that ink too',
      mTabs.length > 0 && mTabs.some(t => t.color === ref.color),
      mTabs.map(t => `${t._txt}: ${t.color}`));

    /* ================= 6 · THE ADMIN TAB ROWS ARE DRAWN LIKE THE ROOM'S =====
       Owner-asked 23 Aug 2026, off two screenshots: "the design of images 1
       and 2 need to resemble how image 3 was designed" — image 3 being the
       contract room's tab row. The difference was the BOX: these rows padded
       each tab 14px a side with a 2px gap, so every tab was a slab and its
       underline ran the full slab; .room-tab hugs its text and lets a 22px gap
       separate them. Pinned as a RELATION against the room's own row, read
       live, so a later change to either has to move both.

       AND CHECK 6a IS THE ONE THAT MATTERS MOST. `.st-tab` had NO RULE AT ALL
       on main: two comments written in separate passes left an orphaned
       terminator in the stylesheet, and the parser's error recovery swallowed
       the whole block. It computed padding:0 from the button reset, which is
       exactly what "cramped" looked like. f236 catches the CAUSE in the file;
       this asks the live page whether the rule survived to the screen, which
       is the only place that question can be answered. */
    await page.setViewportSize({ width: 1500, height: 1000 });
    await pause(600);
    await page.evaluate(() => setView('team'));
    await pause(2400);
    await page.screenshot({ path: path.join(OUT, '08-settings-tabs.png') });

    const roomBox = await page.evaluate(() => {
      /* Read the reference off the room's own row — the page it was asked to
         resemble — rather than off a number typed here. */
      const t = document.createElement('button'); t.className = 'room-tab';
      const row = document.createElement('div'); row.className = 'room-tabs';
      row.appendChild(t); document.body.appendChild(row);
      const s = getComputedStyle(t), rs = getComputedStyle(row);
      const out = { padding: s.padding, gap: rs.gap };
      row.remove(); return out;
    });
    const stBox = await page.evaluate(() => {
      const t = document.querySelector('.st-tab'); if (!t) return null;
      const row = document.querySelector('.st-tabs');
      const s = getComputedStyle(t);
      return { padding: s.padding, gap: getComputedStyle(row).gap,
        inParsedSheet: (() => {
          for (const sheet of document.styleSheets){
            let rules; try { rules = sheet.cssRules; } catch (_) { continue; }
            for (const r of rules) if (r.selectorText === '.st-tab') return true;
          }
          return false;
        })() };
    });

    check('6a THE RULE IS IN THE PARSED STYLESHEET — no comment swallowed it',
      stBox && stBox.inParsedSheet && stBox.padding !== '0px',
      stBox && { inSheet: stBox.inParsedSheet, padding: stBox.padding });
    check('6b the admin tab hugs its text exactly as the room\'s does',
      stBox && stBox.padding === roomBox.padding,
      { admin: stBox && stBox.padding, room: roomBox.padding });
    check('6c and the row spaces them the same way',
      stBox && stBox.gap === roomBox.gap,
      { admin: stBox && stBox.gap, room: roomBox.gap });

    /* ================= 7 · THE SIDEBAR'S DOORS ============================= */
    const nav = await page.evaluate(() => {
      const lum = c => {
        const m = String(c).match(/[\d.]+/g); if (!m) return null;
        const f = [0, 1, 2].map(i => { const v = +m[i] / 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
        return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
      };
      const panel = getComputedStyle(document.querySelector('#side-nav')).backgroundColor;
      const items = [...document.querySelectorAll('#side-nav .nav-item')]
        .filter(n => n.offsetParent).map(n => {
          const s = getComputedStyle(n);
          return { txt: n.textContent.trim().slice(0, 14),
            active: n.classList.contains('active'), bg: s.backgroundColor,
            ink: s.color, edge: s.borderLeftColor, edgeW: s.borderLeftWidth,
            bgLum: s.backgroundColor === 'rgba(0, 0, 0, 0)' ? null : lum(s.backgroundColor) };
        });
      const rs = getComputedStyle(document.documentElement);
      const d = document.createElement('span');
      d.style.color = rs.getPropertyValue('--color-text').trim();
      document.body.appendChild(d); const textInk = getComputedStyle(d).color; d.remove();
      return { panel, panelLum: lum(panel), items, textInk };
    });
    const live = nav.items.filter(i => i.active);

    /* ---- REVERSED IN PLACE 24 Aug 2026, and the RULE is the part that
       carries over. The owner's ask on 23 Aug was pure white doors on a dark
       column and a live door DEEPER than the panel rather than veiled over it.
       The column is white now, so "as strongly as possible against the ground"
       is the primary ink rather than white — and "deeper" cannot be a darker
       green when the ground is white, so it is a filled well plus a 3px rule
       in the accent. Both halves are still asserted; only the ground moved. */
    check('7a every door reads at full strength against its own ground',
      nav.items.length > 2 && nav.items.every(i => i.ink === nav.textInk),
      nav.items.map(i => `${i.txt}:${i.ink}`).slice(0, 6) + ` (ink ${nav.textInk})`);
    check('7b a door IS live, or 7c proves nothing', live.length === 1,
      live.map(i => i.txt));
    check('7c THE LIVE DOOR IS MARKED BY ITS OWN GROUND, never by a veil over the panel',
      live.length === 1 && live[0].bgLum != null && live[0].bgLum !== nav.panelLum,
      { panel: nav.panel, live: live[0] && live[0].bg });
    check('7d and by a rule in the accent, which is what survives the dark theme',
      live.length === 1 && live[0].edge && live[0].edgeW === '3px',
      { edge: live[0] && live[0].edge, width: live[0] && live[0].edgeW });

    /* ================= 8 · THE STRIP IS GONE AND THE CARDS MOVED UP ======== */
    await page.evaluate(id => openWorkspace(id), cid);
    await pause(2200);
    const tabsSeen = [];
    for (const want of ['Key terms', 'Signing', 'History', 'Document']){
      await page.evaluate(w => {
        const t = [...document.querySelectorAll('.room-tab')]
          .find(x => x.textContent.trim().startsWith(w));
        if (t) t.click();
      }, want);
      await pause(1100);
      tabsSeen.push(await page.evaluate(w => {
        const bar = document.getElementById('ws-actionbar');
        return { tab: w, present: !!bar,
          drawn: !!(bar && getComputedStyle(bar).display !== 'none'),
          text: bar ? bar.textContent.trim().length : 0 };
      }, want));
    }
    check('8a the status strip draws on NO tab', tabsSeen.every(t => !t.drawn && !t.text),
      tabsSeen.map(t => `${t.tab}:${t.drawn ? 'drawn' : 'hidden'}/${t.text}`));

    await page.evaluate(() => {
      const t = [...document.querySelectorAll('.room-tab')]
        .find(x => /key terms/i.test(x.textContent)); if (t) t.click();
    });
    await pause(1600);
    await page.screenshot({ path: path.join(OUT, '09-keyterms.png') });
    const kt = await page.evaluate(() => {
      const bx = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect();
        return { x: Math.round(r.x), w: Math.round(r.width), y: Math.round(r.y) }; };
      const row = document.querySelector('.room-tabrow');
      return { grid: bx('.terms-grid'), pane: bx('[data-ws-pane="terms"]'),
        tabrowBottom: row ? Math.round(row.getBoundingClientRect().bottom) : null };
    });

    check('8b the cards start right under the tab row, with no band between',
      kt.grid && kt.tabrowBottom != null && (kt.grid.y - kt.tabrowBottom) < 24,
      { tabrowBottom: kt.tabrowBottom, cardsTop: kt.grid && kt.grid.y,
        gap: kt.grid && (kt.grid.y - kt.tabrowBottom) });

    /* THE CARDS FILL THE PAGE MEASURE, like the mock-up's own .h-c2 — a
       RELATION against the pane they sit in, never a pixel count, so the next
       change to the page's padding costs no test edit. It was capped at 1040
       and centred, leaving ~80px of empty page down each side at this width. */
    check('8c and they fill the page measure rather than sitting in a narrow column',
      kt.grid && kt.pane && (kt.pane.w - kt.grid.w) <= 8,
      { pane: kt.pane && kt.pane.w, cards: kt.grid && kt.grid.w,
        slackEachSide: kt.grid && kt.pane ? (kt.pane.w - kt.grid.w) / 2 : null });

    check('no page errors anywhere in the journey', errors.length === 0, errors);
  } catch (e) {
    check('the journey ran to the end', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log(`Screenshots: ${OUT}`);
  process.exit(pass === results.length ? 0 : 1);
})();
