/* Chromium verification of THE SIZES CUSTOMERS ACTUALLY HAVE.
   ============================================================
   THIS FILE EXISTS BECAUSE THE RESPONSIVE PASS TESTED ONE HEIGHT.

   That pass walked nine widths — 2560 down to 390 — and declared the app
   clean. Every one of those walks used a 900px-tall window. Almost no laptop
   has 900px of page.

   A 1920x1080 ThinkPad at the Windows-RECOMMENDED 150% display scaling reports
   1280x720 CSS pixels to the browser, and once the tab strip, address bar and
   bookmarks bar are taken off, the page gets about 590. A 1366x768 laptop gets
   about 638. Those are the two most common machines a customer will first open
   HaTi on, and what they saw was:

     · the calendar's last week cut off inside its card — the 30th and 31st
       were drawn and then clipped, so a month did not show its month
     · the negotiation's change list given 83px of height for a 110px card,
       which reads as the bulk buttons sitting on top of a decision
     · the members table forced into a horizontal scrollbar and a cut-off
       column, on a screen where it would otherwise have fitted

   None of that is visible at 900px tall. So this walks the real matrix — width
   AND height together, at the real device pixel ratios — and asserts the three
   things that actually matter on a laptop:

     1  nothing is CUT: no element hides content behind its own edge with no
        way to scroll to it
     2  nothing is STARVED: no scrolling list is given less height than one of
        its own rows
     3  the calendar shows all six weeks, because that is the specific defect
        that was reported from a real machine

   Run: node test/chromium/laptops-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

/* physical      scaling  CSS viewport  minus browser chrome -> page */
const LAPTOPS = [
  { name: '1080p @150% (ThinkPad)', w: 1280, h: 590, dpr: 1.5 },
  { name: '1366x768',               w: 1366, h: 638, dpr: 1 },
  { name: '1080p @125%',            w: 1536, h: 734, dpr: 1.25 },
  { name: 'MacBook 1440',           w: 1440, h: 790, dpr: 2 },
  { name: '1080p @100%',            w: 1920, h: 950, dpr: 1 },
];
const VIEWS = ['dashboard', 'register', 'calendar', 'intel', 'templates', 'team',
  'advice', 'reports', 'queue', 'migration', 'playbook', 'pipeline'];

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Deliberately NOT flagged, and each for a stated reason:
   · the dashboard hero's glow is a 240px circle offset -70px and clipped by
     its parent on purpose — that is how the effect is drawn
   · .rl-turnwrap is the standard 1x1 visually-hidden clip round the turn
     banner, and #nego-turn is the banner inside it
   · overflow:visible spills but never hides, so it is not a cut
   · the page and document scrollers are meant to scroll */
const PROBE = () => {
  const de = document.documentElement;
  const out = { cut: [], starved: [] };
  const lab = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
    + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const EXEMPT = /hm-hero|rl-turnwrap|nego-turn|live-dot/;
  const SCROLLERS = /content-scroll|doc-scroll|nego-scroll|cal-grid|reg-scroll/;
  const seen = new Set();
  document.querySelectorAll('#app-shell *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const cs = getComputedStyle(el);
    const k = lab(el);
    if (EXEMPT.test(k)) return;
    // CUT: content taller than the box, and the box hides it
    if (el.scrollHeight > el.clientHeight + 2 && ['hidden', 'clip'].includes(cs.overflowY)) {
      if (!seen.has('c' + k)) { seen.add('c' + k); out.cut.push({ el: k, need: el.scrollHeight, got: el.clientHeight }); }
    }
    // STARVED: a scrolling list with less room than one of its own rows
    if (['auto', 'scroll'].includes(cs.overflowY) && el.scrollHeight > el.clientHeight + 2 && !SCROLLERS.test(k)) {
      const first = el.firstElementChild;
      const rowH = first ? first.getBoundingClientRect().height : 0;
      if (rowH > 8 && el.clientHeight < rowH) {
        if (!seen.has('s' + k)) { seen.add('s' + k); out.starved.push({ el: k, got: Math.round(el.clientHeight), row: Math.round(rowH) }); }
      }
    }
  });
  return out;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  for (const L of LAPTOPS) {
    const ctx = await browser.newContext({ viewport: { width: L.w, height: L.h }, deviceScaleFactor: L.dpr });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${L.name}: ${e.message}`));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    const bad = [];
    for (const v of VIEWS) {
      await page.evaluate(x => window.setView(x), v);
      await page.waitForTimeout(280);
      const m = await page.evaluate(PROBE);
      m.cut.forEach(c => bad.push(`${v}: ${c.el} hides ${c.need - c.got}px`));
      m.starved.forEach(c => bad.push(`${v}: ${c.el} has ${c.got}px for a ${c.row}px row`));
    }
    await page.evaluate(() => window.openWorkspace(window.state.contracts[0].id));
    await page.waitForTimeout(500);
    await page.evaluate(() => window.setView('redline'));
    await page.waitForTimeout(800);
    const rl = await page.evaluate(PROBE);
    rl.cut.forEach(c => bad.push(`redline: ${c.el} hides ${c.need - c.got}px`));
    rl.starved.forEach(c => bad.push(`redline: ${c.el} has ${c.got}px for a ${c.row}px row`));

    check(`${L.name} (${L.w}x${L.h}): nothing is cut off or starved of height`,
      bad.length === 0, bad.slice(0, 4).join(' | '));

    /* THE REPORTED DEFECT, BY NAME. A month that does not show its last week
       is the thing a customer photographed and sent in. */
    await page.evaluate(() => window.setView('calendar'));
    await page.waitForTimeout(600);
    const cal = await page.evaluate(() => {
      const g = document.getElementById('cal-grid');
      if (!g) return null;
      const cells = Array.from(g.children);
      const last = cells[cells.length - 1];
      const gr = g.getBoundingClientRect();
      // every cell fully inside the grid's own box, and the grid not scrolling
      const hidden = cells.filter(c => c.getBoundingClientRect().bottom > gr.bottom + 1).length;
      return { hidden, scrolls: g.scrollHeight > g.clientHeight + 1, rows: cells.length / 7,
        lastBottom: Math.round(last.getBoundingClientRect().bottom), gridBottom: Math.round(gr.bottom) };
    });
    check(`${L.name}: the calendar shows all six weeks without scrolling`,
      cal && cal.hidden === 0 && !cal.scrolls,
      cal ? `${cal.hidden} cells past the edge, scrolls=${cal.scrolls}` : 'no grid');

    /* And the change list has room for a change. */
    await page.evaluate(() => window.openWorkspace(window.state.contracts[0].id));
    await page.waitForTimeout(400);
    await page.evaluate(() => window.setView('redline'));
    await page.waitForTimeout(800);
    const cards = await page.evaluate(() => {
      const c = document.getElementById('nego-cards');
      return c ? Math.round(c.getBoundingClientRect().height) : null;
    });
    check(`${L.name}: the change list has room to show a decision`,
      cards != null && cards >= 130, `${cards}px`);

    await ctx.close();
  }

  check('no page errors on any laptop', errors.length === 0, errors.slice(0, 3).join(' | '));

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  await browser.close();
  await h.stop();
  process.exit(pass === results.length ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
