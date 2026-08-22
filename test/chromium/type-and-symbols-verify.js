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
  ['#brand-mark',                'i-file'],
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
        loaded300: document.fonts.check('300 16px Inter'),
        loaded400: document.fonts.check('400 16px Inter'),
        loaded600: document.fonts.check('600 16px Inter'),
        loaded700: document.fonts.check('700 16px Inter'),
        /* 500 and 800 are the two weights "72" never carried — the old rule was
           that they resolved to a neighbour. Inter is variable, 300-800, so
           both are real now and this records that the swap actually bought it. */
        loaded500: document.fonts.check('500 16px Inter'),
        loaded800: document.fonts.check('800 16px Inter'),
        headingToken: heading,
        bodyStack: body,
        widthInter: mk('Inter'),
        widthFallback: mk('Arial'),
        /* If Inter failed to load, "Inter" and the fallback measure the same,
           because "Inter" would BE the fallback. */
      };
    });
    check('the stylesheet asks for Inter first',
      /^Inter\b/.test(face.headingToken), face.headingToken);
    check('and "72" is nowhere in the platform stack',
      !/72/.test(face.headingToken + ' ' + face.bodyStack), face.headingToken);
    for (const w of [300, 400, 500, 600, 700, 800]) {
      check(`weight ${w} is really available`, face['loaded' + w] === true);
    }
    check('Inter is a different face from the fallback, so it genuinely loaded',
      Math.abs(face.widthInter - face.widthFallback) > 1,
      `Inter ${face.widthInter.toFixed(1)}px vs Arial ${face.widthFallback.toFixed(1)}px`);

    /* THE FIGURE FACE IS THE PLATFORM FACE. --font-mono is used ~160 times for
       ids, dates, counts and money — data, not code — and the columns line up
       on tabular-nums rather than on a typewriter face. If that token ever
       drifts back to a monospace the money columns change width overnight. */
    const mono = await page.evaluate(() => getComputedStyle(document.documentElement)
      .getPropertyValue('--font-mono').trim());
    check('the figure token follows the platform face', /^Inter\b/.test(mono), mono);

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

    /* ---- 3. THE PIPELINE HEAD LOST ITS LINK AND KEPT ITS WAYS OUT ---- */
    console.log('\n--- 3. one fewer door, and nothing stranded ---');
    const head = await page.evaluate(() => {
      const card = document.querySelector('.hm-pipe-card');
      if (!card) return { err: 'no pipeline card' };
      return {
        link: !!card.querySelector('[data-open-register]'),
        text: /view full register|visa hela registret/i.test(card.textContent),
        stages: card.querySelectorAll('[data-stage]').length,
        heading: (card.querySelector('h4') || {}).textContent || '',
      };
    });
    check('the pipeline card exists', !head.err, head.err);
    check('the "View full register" button is gone', head.link === false);
    check('and its words are gone with it', head.text === false);
    check('the heading is still there', /pipeline/i.test(head.heading), head.heading);
    check('the register is still reachable from the card', head.stages > 0,
      `${head.stages} stage doors`);

    /* It has to actually GO there, not merely carry the attribute. */
    await page.evaluate(() => document.querySelector('.hm-pipe-card [data-stage]').click());
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
