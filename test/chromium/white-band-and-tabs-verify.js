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

   ---- 5d AND 5e RE-POINTED IN PLACE 21 Sep 2026 (Young: the four pages must
   look exactly like the artifact, and "there is a lot of faint grey that makes
   reading a bit hard") ---- the seventeen-property match stopped being true
   when the redesign gave a RESTING tab its own quiet ink and label weight. It
   was right to pin it while a resting tab and a row title were the same thing;
   they are not the same thing. A resting tab is FURNITURE and may be quiet; a
   row title is the row's IDENTITY and is the first thing a reader looks for.
   The artifact draws its own list title at .tbl td .t{font-weight:500;
   color:var(--ink)} — full ink — so the relation to pin is that the title
   wears the PAGE'S OWN PRIMARY INK, read live off a heading on that same page
   and never typed, and is never the quiet ink furniture wears. The family,
   tracking, cv11 and smoothing half of the old claim is KEPT against the
   reference, because nothing about the redesign touched those.

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
  /* _on: the LIVE tab, read off its own class — since 20 Sep 2026 the live
     weight is 600 (the reference's), so "not 700" no longer tells them apart */
  const o = { _txt: e.textContent.trim().slice(0, 24), _on: e.classList.contains('on') || e.getAttribute('aria-selected') === 'true' };
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
        workAct: work ? mid(work.querySelector('.hm-cz, .hm-sec-sub, .hm-desk-sub')) : null,
        workRule: work && !!work.querySelector('.hm-rule'),
        /* the card's own head rules itself off from its rows */
        cardRule: (() => { const c = document.querySelector('.hm-card .hm-sec');
          return !!c && getComputedStyle(c).borderBottomWidth !== '0px'; })(),
        decide: (typeof i18t === 'function') ? i18t('home_needs_decision') : null,
        mapTitle: (typeof i18t === 'function') ? i18t('home_map_title') : null,
        tilesX: (() => { const e = document.querySelector('.hm-tile');
          return e ? Math.round(e.getBoundingClientRect().x) : null; })(),
        headX: secs.length ? Math.round(secs[0].querySelector('h2').getBoundingClientRect().x) : null,
        decideTxt: decide ? decide.querySelector('h2').textContent.trim() : null,
      };
    });

    /* TWO OR THREE since 20 Sep 2026 (DECIDE 2 of the redesign order): the
       Portfolio row went into the picker, and Prepared for you is drawn only
       while something is prepared. My work leads and Needs your decision
       closes; every heading that is drawn is painted. */
    /* ---- RE-POINTED IN PLACE 21 Sep 2026 (Young: Home must look exactly
       like the artifact) ---- the reference draws no label over the four
       tiles and makes the two sections below into CARDS: the heading is the
       card's own head, over a hairline, with its sub and its act on that same
       line. So "My work first" cannot be asked (it is gone, deliberately) and
       the rule is the card's border rather than a span. The three things
       these claims were really about — every heading painted, its act on the
       heading's own line, and the heading starting on the page's own left
       margin — are asked here unchanged. */
    /* ---- RE-POINTED IN PLACE 24 Sep 2026 (Young, over "Executive Home
       Options": "instead of needs your decision, delete it and replace with
       prepared for you", then "Build it") ---- Needs your decision no longer
       closes the page: it LEFT HOME, and the Map leads it. What 4a is about is
       unchanged — every heading that is drawn is painted — and it now also
       measures the order the owner chose: the Map first, and no heading left
       for the card that went. */
    check('4a every section heading really drew, the Map leads, and Needs your decision is gone',
      homeLine.heads.length >= 1 && homeLine.heads.length <= 2
        && homeLine.heads.every(Boolean) && homeLine.heads[0].txt === homeLine.mapTitle
        && !homeLine.heads.some(h => h && h.txt === homeLine.decide),
      homeLine.heads.map(h => h && h.txt));
    check('4b each heading sits in a card head that rules itself off',
      homeLine.cardRule, { rule: homeLine.cardRule, span: homeLine.workRule });
    check('4c AND ITS ACT IS ON THAT LINE TOO, not below it',
      homeLine.workAct && near(homeLine.heads[0].y, homeLine.workAct.y, 4),
      { head: homeLine.heads[0] && +homeLine.heads[0].y.toFixed(1),
        act: homeLine.workAct && +homeLine.workAct.y.toFixed(1) });
    check('4d it starts on the page\'s own margin, like the tiles above it',
      homeLine.tilesX == null || near(homeLine.headX, homeLine.tilesX, 18),
      { head: homeLine.headX, tiles: homeLine.tilesX });

    /* ================= 5 · A RESTING TAB IS DARK INK ======================= */
    await page.evaluate(() => setView('intel'));
    await pause(2600);
    await page.screenshot({ path: path.join(OUT, '04-insights.png') });
    const igTabs = await page.evaluate(READ_TYPE, { sel: '[data-ig-tab]', props: TYPE });
    const igRest = igTabs.filter(t => !t._on);
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
    const ffRest = ffSegs.filter(t => !t._on);
    check('5b the friction segments beside them really drew', ffRest.length > 0,
      { found: ffSegs.length, resting: ffRest.length });
    check('5b and they rest on that same ink (colour only — they are 13px by design)',
      ffRest.length > 0 && ffRest.every(t => t.color === ref.color),
      ffRest.map(t => `${t._txt}: ${t.color}`));

    await page.evaluate(() => setView('team'));
    await pause(2600);
    await page.screenshot({ path: path.join(OUT, '05-settings.png') });
    const stTabs = await page.evaluate(READ_TYPE, { sel: '.st-tab', props: TYPE });
    const stRest = stTabs.filter(t => !t._on);
    check('5c and the Settings & Rules tabs',
      stRest.length > 0 && stRest.every(t => sameAsRef(t).ok),
      stRest.map(t => `${t._txt}: ${sameAsRef(t).why || 'match'}`));

    /* 5d — THE CLAIM THAT NOTHING MOVED, REVERSED ON ONE PROPERTY 24 Aug 2026
       (WO-16, owner-asked: "reduce the font by a size in the contracts and
       negotiations lists"). The rows really are one rung down from the
       reference now, deliberately and by name. EVERY OTHER PROPERTY IS STILL
       PINNED — family, weight, ink, tracking, cv11, smoothing — so a later
       type pass still cannot pull these titles off the reference in any way
       nobody asked for; and the SIZE is pinned as the RELATION the owner
       asked for (one rung down) rather than left unpinned, which would be the
       claim quietly disappearing. */
    /* The properties a row title still shares with a resting tab. INK, WEIGHT
       and LEADING came off this list 21 Sep 2026 and are asked of the page's
       own heading instead (see the note at the top of this file): a resting
       tab is deliberately quiet now and a row title deliberately is not. */
    const TYPE_SHARED = TYPE.filter(p => !['fontSize', 'color', 'fontWeight', 'lineHeight'].includes(p));
    const sameButSize = (got) => {
      if (!ref || !got) return { ok: false, why: 'missing' };
      const bad = TYPE_SHARED.filter(p => String(got[p]) !== String(ref[p]));
      return { ok: bad.length === 0, why: bad.map(p => `${p}: ${got[p]} vs ${ref[p]}`) };
    };
    /* The page's own primary ink, measured off the heading that names the page
       — a RELATION, so a later palette pass moves both together or neither. */
    const PAGE_INK = () => {
      const h = document.querySelector('#page-head h1, #page-head .pg-title, #content h1');
      return h ? getComputedStyle(h).color : null;
    };
    const oneRungDown = (got) => ref && got
      && parseFloat(got.fontSize) < parseFloat(ref.fontSize)
      && parseFloat(got.fontSize) >= parseFloat(ref.fontSize) - 2;
    await page.evaluate(() => setView('register'));
    await pause(2400);
    const regTitles = await page.evaluate(READ_TYPE, { sel: '.reg-table tbody .reg-title', props: TYPE });
    check('5d the CONTRACTS list titles share the reference\'s family and tracking',
      regTitles.length > 0 && regTitles.slice(0, 3).every(t => sameButSize(t).ok),
      regTitles.slice(0, 3).map(t => `${t._txt}: ${sameButSize(t).why || 'match'}`));
    const regInk = await page.evaluate(PAGE_INK);
    check('5d and the title is the PAGE\'S OWN INK, never the quiet ink a resting tab wears',
      !!regInk && regTitles.length > 0
        && regTitles.slice(0, 3).every(t => t.color === regInk)
        && regInk !== (ref && ref.color),
      { title: regTitles[0] && regTitles[0].color, pageHeading: regInk, restingTab: ref && ref.color });
    /* ---- REVERSED IN PLACE 21 Sep 2026 (Young: "contracts need to look
       exactly like the artifact") ---- WO-16's "one rung down" was 14 to
       THIRTEEN, written as a token that the redesign's own ladder later made
       12 — so the row had quietly gone one rung further than anybody ruled.
       Thirteen is the artifact's own row size and the owner's own number, and
       it happens to equal this reference element's, so the relation to pin is
       that the row is NOT SMALLER than it was ruled to be. */
    check('5d and their size is the row\'s own ruled rung, never below it',
      regTitles.length > 0 && regTitles.slice(0, 3).every(t => ref
        && parseFloat(t.fontSize) === parseFloat(ref.fontSize)),
      regTitles.slice(0, 1).map(t => `${t.fontSize} vs ref ${ref && ref.fontSize}`));

    await page.evaluate(() => openNegotiations({ list: true }));
    await pause(2400);
    await page.screenshot({ path: path.join(OUT, '06-negolist.png') });
    const nglTitles = await page.evaluate(READ_TYPE, { sel: '.reg-table tbody .reg-title', props: TYPE });
    check('5e and so are the NEGOTIATIONS list titles — one table, one answer',
      nglTitles.length > 0 && nglTitles.slice(0, 3).every(t => sameButSize(t).ok),
      nglTitles.slice(0, 3).map(t => `${t._txt}: ${sameButSize(t).why || 'match'}`));
    check('5e and they are the same ink as the Contracts list — one table, one ink',
      nglTitles.length > 0 && regTitles.length > 0
        && nglTitles.slice(0, 3).every(t => t.color === regTitles[0].color),
      { nego: nglTitles[0] && nglTitles[0].color, contracts: regTitles[0] && regTitles[0].color });
    check('5e and they are the same rung as the Contracts list, never a third size',
      nglTitles.length > 0 && regTitles.length > 0
        && nglTitles[0].fontSize === regTitles[0].fontSize,
      `${nglTitles[0] && nglTitles[0].fontSize} vs ${regTitles[0] && regTitles[0].fontSize}`);

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

    /* ---- 6d-6g THE ROW STAYS WHILE THE PAGE SCROLLS (Young ruled it 18 Sep
       2026: "for the team & settings page, make that when you scroll, you do
       not lose the tabs. The body scrolls up behind the tabs line") ----
       MEASURED at the parent, 1440x620 on Platform settings: the row rests at
       y=84 and 600px down it is at y=-516, off the scroller entirely.

       IT IS A BROWSER FILE FOR THE USUAL REASON. position:sticky dies in
       silence inside an overflow:hidden ancestor and the declaration goes on
       looking perfectly correct, so the source cannot answer whether the row
       stayed. And a rect is not a painted pixel — 6e asks elementFromPoint
       over the live tab's own word, which is the instrument the ladder's hover
       card was clipped away behind. */
    const SHORT = { width: 1440, height: 620 };
    await page.setViewportSize(SHORT);
    await pause(500);
    await page.evaluate(() => window.settingsGoTab('platform'));
    await pause(900);

    const readRow = () => page.evaluate(() => {
      const row = document.querySelector('.st-tabs'), sc = document.getElementById('content-scroll');
      if (!row || !sc) return null;
      const r = row.getBoundingClientRect(), s = sc.getBoundingClientRect();
      const first = document.querySelector('.st-tab');
      const live = document.querySelector('.st-tab.on') || first;
      const lr = live.getBoundingClientRect();
      const hit = document.elementFromPoint(Math.round(lr.left + lr.width / 2), Math.round(lr.top + lr.height / 2));
      return { glyph: Math.round(first.getBoundingClientRect().top - s.top),
        rowTop: Math.round(r.top - s.top), leftGap: Math.round(r.left - s.left),
        bg: getComputedStyle(row).backgroundColor,
        painted: !!(hit && hit.closest && hit.closest('.st-tab')),
        scrollTop: sc.scrollTop, canScroll: sc.scrollHeight - sc.clientHeight };
    });

    const pinRest = await readRow();
    await page.evaluate(() => { document.getElementById('content-scroll').scrollTop = 900; });
    await pause(350);
    const stScrolled = await readRow();
    await page.screenshot({ path: path.join(OUT, '08b-settings-tabs-pinned.png') });

    check('6d there is more settings than one screen, so the question is real',
      pinRest && pinRest.canScroll > 300, pinRest && { overflow: pinRest.canScroll });
    check('6e the tab row is still on screen after scrolling, and really painted',
      stScrolled && stScrolled.rowTop === 0 && stScrolled.painted && stScrolled.scrollTop > 0,
      stScrolled && { rowTop: stScrolled.rowTop, scrolledBy: stScrolled.scrollTop,
        wordUnderThePointer: stScrolled.painted });
    /* THE FIRST PAINTED GLYPH DOES NOT MOVE — "ONE HEADER TOP", and the row
       pays for its own pinned air by cancelling the page's top padding and
       putting it back inside itself. A RELATION against the token, never a
       number typed here. */
    const padT = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-pad-t')) || 0);
    check('6f and the first glyph sits where it always sat, pinned or not',
      pinRest && stScrolled && pinRest.glyph === stScrolled.glyph
        && Math.abs(pinRest.glyph - padT) <= 1,
      { rest: pinRest && pinRest.glyph, scrolled: stScrolled && stScrolled.glyph, pageTopToken: padT });
    /* A PINNED ROW HAS TO BE OPAQUE ACROSS THE WHOLE WIDTH or the body shows
       through the gutters beside it. */
    check('6f2 it is opaque and reaches the page\'s own left edge',
      stScrolled && stScrolled.leftGap === 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(stScrolled.bg),
      stScrolled && { leftGap: stScrolled.leftGap, background: stScrolled.bg });

    /* AND A TAB PRESSED FROM THE BOTTOM LANDS AT THE TOP. Until the row was
       pinned this came for free: reaching a tab meant being at the top already.
       A press that NAVIGATES may land at the top, and this one is four
       different pages of settings. */
    /* DISPATCHED IN THE PAGE, NOT CLICKED. Playwright scrolls an element into
       view before clicking it, which would put the scroller back near the top
       by itself and make this check pass against a build that does nothing —
       measured, it did. The press has to land while the reader is still at the
       bottom, which is the whole case. */
    const pressed = await page.evaluate(() => {
      const sc = document.getElementById('content-scroll');
      sc.scrollTop = 900;
      const was = sc.scrollTop;
      const tab = document.querySelector('[data-st-tab="people"]');
      const onScreen = tab.getBoundingClientRect().top >= sc.getBoundingClientRect().top - 1;
      tab.click();
      return { was, onScreen };
    });
    await pause(800);
    const landed = await readRow();
    check('6g a tab pressed from the bottom of the list lands at the top',
      pressed && pressed.was > 0 && pressed.onScreen && landed && landed.scrollTop === 0,
      { pressedFrom: pressed && pressed.was, tabWasReachable: pressed && pressed.onScreen,
        landedAt: landed && landed.scrollTop });

    await page.setViewportSize({ width: 1500, height: 1000 });
    await pause(500);

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
    /* RE-POINTED 20 Sep 2026 (DECIDE 4 of the redesign order): the reference
       draws a resting door in the SECONDARY ink at label weight (`.nav a{color:
       var(--ink-2);font-weight:500}`) and the live one in the accent's ink on
       a tint of the accent. "As strongly as possible" was the white column's
       answer to a dark one; the claim now is that every resting door wears
       exactly the reference's ink, resolved from the token. */
    const doorInk = await page.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--color-neutral-600)';
      document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    check('7a every resting door reads in the reference\'s own secondary ink',
      nav.items.length > 2 && nav.items.filter(i => !i.active).every(i => i.ink === doorInk),
      nav.items.filter(i => !i.active).map(i => `${i.txt}:${i.ink}`).slice(0, 6) + ` (door ink ${doorInk})`);
    check('7b a door IS live, or 7c proves nothing', live.length === 1,
      live.map(i => i.txt));
    check('7c THE LIVE DOOR IS MARKED BY ITS OWN GROUND, never by a veil over the panel',
      live.length === 1 && live[0].bgLum != null && live[0].bgLum !== nav.panelLum,
      { panel: nav.panel, live: live[0] && live[0].bg });
    /* RE-POINTED 20 Sep 2026: the 3px rule went with the dark bar; the live
       door is the accent's ink on the accent's tint, which is what survives
       the dark theme (--accent-ink has a night answer). */
    const accentInk = await page.evaluate(() => { const d = document.createElement('i'); d.style.color = 'var(--accent-ink)';
      document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; });
    check('7d and in the accent\'s own ink, which is what survives the dark theme',
      live.length === 1 && live[0].ink === accentInk,
      { ink: live[0] && live[0].ink, accentInk });

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
      /* The first tab is the Overview since 16 Sep 2026; its KEY is still
         'terms', which is what this reaches for rather than a word. */
      const t = document.querySelector('.room-tab[data-room-tab="terms"]'); if (t) t.click();
    });
    await pause(1600);
    await page.screenshot({ path: path.join(OUT, '09-keyterms.png') });
    const kt = await page.evaluate(() => {
      const bx = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect();
        return { x: Math.round(r.x), w: Math.round(r.width), y: Math.round(r.y) }; };
      const row = document.querySelector('.room-tabrow');
      return { grid: bx('.ov-stack'), pane: bx('[data-ws-pane="terms"]'),
        tabrowBottom: row ? Math.round(row.getBoundingClientRect().bottom) : null };
    });

    /* `.terms-grid` became `.ov-stack` on 16 Sep 2026 — one column of named
       sections in place of two cards and a divider. Both claims are unchanged:
       nothing sits between the tab row and the first thing the tab draws, and
       what it draws fills the page measure. */
    check('8b the sections start right under the tab row, with no band between',
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
