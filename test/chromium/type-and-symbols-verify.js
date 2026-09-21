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
  ['#cmd-panel',                 'i-clock'],   /* DECIDE 2, 20 Sep 2026: Recent activity is behind the clock */
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

    /* THE FIGURE FACE WAS THE PLATFORM FACE from 22 Aug to 20 Sep 2026:
       --font-mono is used ~160 times for ids, dates, counts and money, and the
       columns lined up on tabular-nums rather than on a typewriter face.
       REVERSED IN PLACE 20 Sep 2026 (the redesign order, DECIDE 1 of its
       tokens step): the owner-approved reference sets every figure in
       JetBrains Mono, self-hosted in fonts/ under the SAME token name, so the
       ~160 readers moved together and the money columns changed width ONCE,
       on purpose. The claim now is that the token names that face AND that
       the face genuinely loaded — a name with no file behind it would fall
       back to the system's own monospace in silence. */
    const mono = await page.evaluate(() => {
      const v = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim();
      const probe = t => { const s = document.createElement('span'); s.textContent = 'MK-2041 · KES 571.8M · 30.06.2027';
        s.style.cssText = 'position:absolute;visibility:hidden;font-size:40px;font-family:' + t; document.body.appendChild(s);
        const w = s.getBoundingClientRect().width; s.remove(); return w; };
      return { v, wFace: probe("'JetBrains Mono'"), wFallback: probe('monospace'), loaded: document.fonts.check("12px 'JetBrains Mono'") };
    });
    check('the figure token names the reference\'s own face',
      /^'?JetBrains Mono'?/.test(mono.v), mono.v);
    check('and that face genuinely loaded from fonts/, not a silent fallback',
      mono.loaded && Math.abs(mono.wFace - mono.wFallback) > 1,
      `loaded ${mono.loaded} · JetBrains Mono ${mono.wFace.toFixed(1)}px vs monospace ${mono.wFallback.toFixed(1)}px`);

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
      /* Since 20 Sep 2026 the group starts OPEN; pressing it would shut it. */
      if (t && t.getAttribute('aria-expanded') !== 'true') t.click();
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
    /* SINCE 20 Sep 2026 (DECIDE 2 of the redesign order) the Portfolio row is
       gone and the lifecycle tile is one a reader CHOOSES in the picker, so it
       is staged the way a reader would put it on the page — through the
       product's own setKpiSel — and the default four are put back after the
       register has been reached, so the later Home measurements in this file
       see the page as it ships. */
    await page.evaluate(() => {
      const cur = (window.currentKpiSel && currentKpiSel()) || [];
      if (!cur.includes('lifecycle')) setKpiSel([...cur.slice(0, 3), 'lifecycle']);
      renderDashboard();
    });
    await page.waitForTimeout(400);
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
    await page.evaluate(() => { if (window.DEFAULT_KPI_SEL) setKpiSel(DEFAULT_KPI_SEL.slice()); });

    await page.screenshot({ path: path.join(OUT, '04-register.png') });

    /* ---- 4. THE REDLINE ROW'S MARKS (Young ruled 17 Sep 2026, "option C") ----
       The row's verbs took the shell's own symbols beside their words. THIS IS
       THE ONLY PLACE THAT CAN SAY THEY PAINT. f246 pins the table, the
       injection and the rendered markup; redline-verify measures the geometry
       — but the negotiate page's own harness, like every test/chromium/*.html,
       builds its own script list and carries none of index.html's <defs>, so a
       <use> there resolves to NOTHING and reserves a 15px hole with no error
       and no warning. That is this file's founding claim (item 2 above) in a
       second place, so it is asked here, on the real app, with getBBox. */
    console.log('\n--- 4. the redline row wears the sprite ---');
    const marks = await page.evaluate(() => {
      /* A contract with one ask from each side, so BOTH shapes of the row are
         measured: their live ask (Accept · Reject · Counter · Ladder) and our
         own draft (Edit · Send · … · Discard). */
      const c = { id: 'MK-902', name: 'Symbol bench', counterparty: 'Nordkust Industri AB',
        status: 'Under Review', folder: 'proc', value: 1, valueType: 'estimated',
        template: null, fields: {}, metadata: {}, obligations: [], audit: [], rounds: [],
        versions: [], signatures: [], comments: [], owner: { id: 'u1', name: 'Young' },
        _loaded: true,
        body: '<h1>Bench</h1><h2>1. Payment</h2><p>Pay within thirty (30) days.</p>'
            + '<h2>2. Notices</h2><p>Notices shall be given by hand.</p>',
        changes: [
          { id: 'CHG-001', clauseId: 'cl_2', changeType: 'modify', authorSide: 'counterparty',
            status: 'pending', round: 1, summary: '30 to 45 days', by: 'Amina',
            oldText: 'Pay within thirty (30) days.',
            newText: 'Pay within forty-five (45) days.', at: new Date().toISOString() },
          { id: 'CHG-002', clauseId: 'cl_4', changeType: 'modify', authorSide: 'owner',
            status: 'pending', round: 1, summary: 'by hand to by courier', by: 'Young',
            oldText: 'Notices shall be given by hand.',
            newText: 'Notices shall be given by courier.', at: new Date().toISOString() }] };
      state.contracts.unshift(c);
      if (window.openRedlineWorkbench) openRedlineWorkbench(c.id);
      return c.id;
    });
    await page.waitForTimeout(1600);
    const rowMarks = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('#view-redline .rl-card-d .rl-card-face button')];
      return btns.map(b => {
        const i = b.querySelector('.rl-verb-i');
        const u = i && i.querySelector('use');
        let bb = null;
        try { const g = u.getBBox(); bb = { w: g.width, h: g.height }; } catch (_) {}
        const r = i ? i.getBoundingClientRect() : null;
        return { word: (b.textContent || '').trim(),
          href: u ? (u.getAttribute('href') || '') : null,
          box: r ? { w: Math.round(r.width), h: Math.round(r.height) } : null,
          bb, ink: getComputedStyle(b).color,
          /* THE MARK TAKES THE VERB'S OWN INK, which is the whole reason it is
             drawn in currentColor and the half Young asked for by name. */
          markInk: i ? getComputedStyle(i).color : null };
      });
    });
    check('the redline row is on screen with verbs on it', rowMarks.length >= 4,
      `${rowMarks.length} verbs`);
    const hollow = rowMarks.filter(m => !m.bb || m.bb.w < 2 || m.bb.h < 2);
    check('every mark on the row resolves to a real symbol — not an empty box',
      rowMarks.length > 0 && hollow.length === 0,
      hollow.length ? hollow.map(d => `${d.word} -> ${d.href}`).join(', ')
        : rowMarks.map(m => `${m.word} ${m.href} ${m.bb.w.toFixed(0)}x${m.bb.h.toFixed(0)}`).join(' · '));
    check('and each one is painted at the size the sheet asks for',
      rowMarks.every(m => m.box && m.box.w === 15 && m.box.h === 15),
      rowMarks.map(m => m.box && m.box.w + 'x' + m.box.h).join(' · '));
    check('the mark takes its verb\'s own ink, so no colour was moved to add it',
      rowMarks.every(m => m.markInk === m.ink),
      rowMarks.map(m => `${m.word} ${m.ink}`).join(' · '));
    /* THE TWO Young NAMED, by their real inks rather than "different from each
       other": Edit keeps the colour it has today and Discard is red. */
    const edit = rowMarks.find(m => /^(Edit|Counter|Redigera|Motbud)/i.test(m.word));
    const disc = rowMarks.find(m => /Discard|F.rkasta|Sl.ng/i.test(m.word));
    /* THE RED IS THE TOKEN'S, NOT A NUMBER TYPED HERE (re-pointed 20 Sep 2026
       when the redesign order moved the ruby from #BE123C to the reference's
       #B3261E and this line went red for the wrong reason): --st-ruby-fg is
       resolved in the page and Discard has to wear exactly that. */
    const ruby = await page.evaluate(() => { const e = document.createElement('i');
      e.style.color = 'var(--st-ruby-fg)'; document.body.appendChild(e);
      const c = getComputedStyle(e).color; e.remove(); return c; });
    check('Discard is red — the ruby token\'s own ink', !!disc && disc.ink === ruby,
      disc ? `${disc.ink} vs --st-ruby-fg ${ruby}` : 'no Discard on these rows');
    check('and the edit door keeps the ink it had before the marks',
      !!edit && edit.ink !== ruby, edit ? `${edit.word} ${edit.ink}` : 'no edit door');
    await page.screenshot({ path: path.join(OUT, '05-redline-marks.png') });

    check('the page threw nothing', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
