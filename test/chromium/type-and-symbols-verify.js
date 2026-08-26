/* Chromium verification: ONE FACE, ONE SYMBOL SET, AND ONE FEWER DOOR
   ============================================================
   Owner-asked, 22 Aug 2026, in one message: "let's use Inter everywhere. Also,
   implement the new symbols from the html and remove the view full register
   option."

   WHY THESE THREE CLAIMS NEED A BROWSER. Every one of them is a question jsdom
   answers wrongly or not at all:

   1. THE FACE. `getComputedStyle().fontFamily` returns the STACK, not the face
      that won — so a stylesheet naming Inter reads identically whether the font
      loaded or the reader fell through to Arial. The only honest test is
      `document.fonts.check()`, which asks whether the face is really available,
      plus a measured width difference between Inter and the fallback. jsdom
      loads no fonts at all and would pass a page with none.

      This is not a hypothetical: fonts/fonts.css spent its life carrying a
      header comment promising "no screen ever falls back silently to a system
      sans", and F85 exists because /fonts once 404'd on the deployed server and
      every screen rendered in whatever the operating system had. Nothing
      reported it. A stylesheet that fails to load throws no error.

   2. THE SYMBOLS. A <use href="#i-home"> that points at nothing renders an
      EMPTY BOX — no error, no warning, a button with a hole in it. jsdom builds
      no shadow tree for <use> and cannot tell a resolved reference from a dead
      one. The only proof is a painted bounding box with a real size, so that is
      what this measures, on every icon in the shell.

   3. THE REMOVED LINK. Cheap to assert, and worth asserting beside the other
      two because the way it was removed matters: the register has to stay
      reachable from this card, or a tidy-up became a dead end.

   Screenshots go to test/chromium/shots/type/.
   Run: node test/chromium/type-and-symbols-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'type');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  if (ok) { pass++; console.log('  ok    ' + name); }
  else { fail++; console.log('  FAIL  ' + name + (detail ? '  — ' + detail : '')); }
};

/* Every icon in the shell, by the button that owns it and the symbol it must
   resolve to. Named rather than swept, so a button that quietly loses its icon
   fails here instead of shrinking the sweep by one. */
const SHELL_ICONS = [
  /* #brand-mark is RETIRED with the 44px shell bar (24 Aug 2026): a 40px tile
     does not fit, and the wordmark stays as live text. */
  ['.cmd-search',                'i-search'],
  ['#cmd-ai',                    'i-spark'],
  ['#hdr-notify',                'i-bell'],
  ['#cmd-panel',                 'i-panel'],
  ['#side-logout',               'i-out'],
  ['[data-view="dashboard"]',    'i-home'],
  ['[data-view="register"]',     'i-folder'],
  ['[data-view="redline"]',      'i-nego'],
  ['[data-view="calendar"]',     'i-cal'],
  ['[data-view="intel"]',        'i-insight'],
  ['[data-view="templates"]',    'i-tpl'],
  ['[data-view="intake"]',       'i-req'],
  ['[data-view="directory"]',    'i-people'],
  ['[data-view="team"]',         'i-cog'],
  ['[data-view="playbook"]',     'i-shield'],
  ['[data-view="advice"]',       'i-chat'],
  ['[data-view="migration"]',    'i-import'],
  ['#side-copilot',              'i-spark'],
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({
      viewport: { width: 1600, height: 950 }, deviceScaleFactor: 2 })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2600);

    /* ---- 1. THE FACE IS INTER, AND IT REALLY LOADED ---- */
    console.log('\n--- 1. one face, and it is really there ---');
    const face = await page.evaluate(async () => {
      await document.fonts.ready;
      const mk = (fam) => {
        const s = document.createElement('span');
        s.textContent = 'Warehousing and Transportation 0123456789';
        s.style.cssText = `position:absolute;visibility:hidden;font-size:40px;font-family:${fam}`;
        document.body.appendChild(s);
        const w = s.getBoundingClientRect().width;
        s.remove(); return w;
      };
      const body = getComputedStyle(document.body).fontFamily;
      const heading = getComputedStyle(document.documentElement)
        .getPropertyValue('--font-heading').trim();
      return {
        loaded400: document.fonts.check("400 16px 'IBM Plex Sans'"),
        loaded500: document.fonts.check("500 16px 'IBM Plex Sans'"),
        loaded600: document.fonts.check("600 16px 'IBM Plex Sans'"),
        loaded700: document.fonts.check("700 16px 'IBM Plex Sans'"),
        headingToken: heading,
        bodyStack: body,
        widthFace: mk("'IBM Plex Sans'"),
        widthFallback: mk('Arial'),
        /* If the face failed to load it and the fallback measure the same,
           because the face would BE the fallback. */
      };
    });
    /* CLAIM REVERSED IN PLACE 25 Aug 2026: the platform face is IBM Plex Sans;
       it was Inter from 22 Aug and "72" before that. The token is written with
       quotes because the family name has spaces, so the test allows for them. */
    check('the stylesheet asks for IBM Plex Sans first',
      /^'?IBM Plex Sans'?/.test(face.headingToken), face.headingToken);
    check('and "72" is nowhere in the platform stack',
      !/72/.test(face.headingToken + ' ' + face.bodyStack), face.headingToken);
    /* ---- THE RANGE NARROWED WITH THE FACE, AND THE LIST FOLLOWS IT ----
       This asked for 300 through 800 because Inter is variable across exactly
       that. IBM Plex Sans is variable 400-700, so 300 and 800 are no longer
       real and asking for them would be asserting a fiction. NOTHING IN THE
       PRODUCT ASKS FOR 300 OR BELOW; one declaration asks for 800 — the
       bold-corporate document style's h1 — and a browser clamps it to 700,
       which is recorded at that declaration rather than hidden here. */
    for (const w of [400, 500, 600, 700]) {
      check(`weight ${w} is really available`, face['loaded' + w] === true);
    }
    check('the face is different from the fallback, so it genuinely loaded',
      Math.abs(face.widthFace - face.widthFallback) > 1,
      `IBM Plex Sans ${face.widthFace.toFixed(1)}px vs Arial ${face.widthFallback.toFixed(1)}px`);

    /* THE FIGURE FACE IS THE PLATFORM FACE. --font-mono is used ~160 times for
       ids, dates, counts and money — data, not code — and the columns line up
       on tabular-nums rather than on a typewriter face. If that token ever
       drifts back to a monospace the money columns change width overnight. */
    const mono = await page.evaluate(() => getComputedStyle(document.documentElement)
      .getPropertyValue('--font-mono').trim());
    check('the figure token follows the platform face',
      /^'?IBM Plex Sans'?/.test(mono), mono);

    /* ---- 2. EVERY SHELL SYMBOL RESOLVES TO PAINTED PIXELS ---- */
    console.log('\n--- 2. every symbol in the shell resolves ---');
    const defined = await page.evaluate(() =>
      [...document.querySelectorAll('symbol[id^="i-"]')].map(s => s.id));
    check('the sprite is in the document', defined.length >= 18, `${defined.length} symbols`);

    /* THE ADMINISTRATION FOLD STARTS SHUT, and four of the twelve nav icons
       live inside it — a display:none ancestor gives an empty bbox, so
       measuring them closed would have failed five checks about code that is
       perfectly correct. Open it the way a reader does, then measure. */
    await page.evaluate(() => {
      const t = document.querySelector('[data-section-toggle="settings"]');
      if (t) t.click();
    });
    await page.waitForTimeout(400);

    let painted = 0, unpainted = [];
    for (const [sel, sym] of SHELL_ICONS) {
      const r = await page.evaluate(([sel, sym]) => {
        const host = document.querySelector(sel);
        if (!host) return { err: 'no such element' };
        const u = host.querySelector(`use[href="#${sym}"]`);
        if (!u) return { err: 'no <use> pointing at #' + sym };
        const svg = u.closest('svg');
        const b = svg.getBoundingClientRect();
        /* getBBox on the <use> reads the SHADOW TREE — it is non-zero only if
           the reference actually resolved to a symbol with geometry in it. A
           dead href leaves the <svg> box intact and the bbox empty, which is
           exactly the failure that renders as a hole nobody notices. */
        let bb = null;
        try { const g = u.getBBox(); bb = { w: g.width, h: g.height }; } catch (_) {}
        /* A button the APP itself hides — Insights is gated on the portfolio
           being big enough to say anything — is not a broken icon. Tell the two
           apart rather than calling both a pass or both a failure. */
        const shown = host.offsetParent !== null;
        return { w: b.width, h: b.height, bb, shown,
                 defined: !!document.getElementById(sym) };
      }, [sel, sym]);

      if (r.err) { check(`${sel} draws #${sym}`, false, r.err); continue; }
      if (r.shown) {
        painted++;
        check(`${sel} draws #${sym}`,
          r.w > 8 && r.h > 8 && r.bb && r.bb.w > 2 && r.bb.h > 2,
          `box ${r.w}x${r.h}, geometry ${r.bb ? r.bb.w.toFixed(1) + 'x' + r.bb.h.toFixed(1) : 'none'}`);
      } else {
        unpainted.push(sel);
        /* Not painted in this workspace, so there are no pixels to measure —
           but the reference must still be sound, or the icon is a hole waiting
           for the day the door appears. */
        check(`${sel} points at a real #${sym} (the app hides this door here)`,
          r.defined === true);
      }
    }
    /* A sweep that silently shrinks is the failure mode of a sweep. Say how
       many were actually measured, so nobody reads 19 oks as 19 pictures. */
    console.log(`  note  ${painted} icons measured as pixels; ` +
      `${unpainted.length} not painted in this workspace (${unpainted.join(', ') || 'none'})`);
    check('most of the shell was measured, not merely referenced', painted >= 14,
      `${painted} painted`);

    /* Every <use> anywhere in the shell must point at a symbol that exists —
       the named list above proves the ones we meant to change; this catches a
       reference typed somewhere else. */
    const dead = await page.evaluate(() => {
      const ids = new Set([...document.querySelectorAll('symbol[id]')].map(s => s.id));
      return [...document.querySelectorAll('use[href^="#"]')]
        .map(u => u.getAttribute('href').slice(1))
        .filter(id => !ids.has(id));
    });
    check('no <use> points at a symbol that does not exist', dead.length === 0, dead.join(', '));

    /* THE SIDEBAR IS ONE SET NOW. The column used to mix solid glyphs at a 24
       box with 1.8-weight outlines; the whole case for the swap is that it
       reads as one family. Every nav icon should therefore share a box. */
    const boxes = await page.evaluate(() =>
      [...document.querySelectorAll('#side-nav .nav-item')]
        .filter(b => b.offsetParent !== null)
        .map(b => (b.querySelector(':scope > svg') || {}).getBoundingClientRect
          ? b.querySelector(':scope > svg').getBoundingClientRect().width : 0));
    check('every sidebar icon on screen is the same size',
      boxes.length >= 10 && new Set(boxes.map(Math.round)).size === 1,
      `${boxes.length} icons, sizes ${[...new Set(boxes.map(Math.round))].join('/')}`);

    await page.screenshot({ path: path.join(OUT, '01-shell.png') });
    const nav = await page.$('#side-nav');
    if (nav) await nav.screenshot({ path: path.join(OUT, '02-sidebar.png') });
    const hdr = await page.$('header');
    if (hdr) await hdr.screenshot({ path: path.join(OUT, '03-topbar.png') });

    /* ---- 3. THE LIFECYCLE TILE, AND ITS THREE DOORS ----
       REVERSED IN PLACE 24 Aug 2026. This block measured the pipeline card's
       head — a heading, a retired "View full register" link and the stage
       buttons beside it. The card is gone; the three blocks of the Contract
       lifecycle tile are what carries the stages now, and the claim that
       matters is unchanged: the register is still reachable from this tile,
       and pressing a stage really goes there rather than merely carrying an
       attribute. */
    console.log('\n--- 3. the lifecycle tile, and its three doors ---');
    const head = await page.evaluate(() => {
      const tile = document.querySelector('.hm-tile.is-life');
      if (!tile) return { err: 'no lifecycle tile' };
      return {
        link: !!tile.querySelector('[data-open-register]'),
        text: /view full register|visa hela registret/i.test(tile.textContent),
        stages: tile.querySelectorAll('.hm-stg').length,
        live: tile.querySelectorAll('.hm-stg[data-hm-go]').length,
        heading: (tile.querySelector('.hm-t') || {}).textContent || '',
      };
    });
    check('the lifecycle tile exists', !head.err, head.err);
    check('the "View full register" button is still gone', head.link === false);
    check('and its words are gone with it', head.text === false);
    check('the heading names the thing', /lifecycle|livscykel/i.test(head.heading), head.heading);
    check('all three stages are drawn', head.stages === 3, `${head.stages} blocks`);
    check('the register is still reachable from the tile', head.live > 0,
      `${head.live} of ${head.stages} are doors`);

    /* It has to actually GO there, not merely carry the attribute. */
    await page.evaluate(() => document.querySelector('.hm-stg[data-hm-go]').click());
    await page.waitForTimeout(900);
    const landed = await page.evaluate(() => ({
      view: window.state && window.state.view,
      rows: document.querySelectorAll('[data-row]').length,
    }));
    check('pressing a stage still opens the register', landed.view === 'register', landed.view);
    check('and the register has rows in it', landed.rows > 0, String(landed.rows));

    await page.screenshot({ path: path.join(OUT, '04-register.png') });
    check('the page threw nothing', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
