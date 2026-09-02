/* Chromium verification: WHERE OBLIGATIONS GO QUIET
   ============================================================
   The fourth Insights surface, between Negotiation friction and Contract
   graph. f247 pins the SHAPE and the RULES in jsdom; this file asks the four
   questions jsdom cannot answer at all:

   1  IS THE TAB REACHABLE, AND DOES PRESSING IT LAND? The first build drew a
      perfectly good button that sent every press back to the Portfolio
      overview — renderIntel carried its own whitelist of tab names, written
      out separately from the row. Nothing failed, nothing logged, and the
      source of either half looked correct. So the press is DRIVEN and what
      arrives is read off the page.

   2  DOES THE PAGE SAY WHAT IT COUNTED? Every headline figure on screen is
      compared against the number intelObligationsData returned, so a panel
      that quietly disagreed with its own data fails here.

   3  IS THE COLOUR TELLABLE APART, IN BOTH THEMES? Ours is the workspace
      accent and theirs is amber — a pair that has to survive the teal
      workspace, the navy one and the dark theme, which is exactly where this
      product has been caught before. Measured as COMPUTED values.

   4  DOES IT FIT A LAPTOP? Measured at three widths, with no sideways scroll.

   Screenshots go to test/chromium/shots/obligations-report/.
   Run: node test/chromium/obligations-report-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'obligations-report');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
/* Two colours are tellable apart when no channel pair is within a whisker of
   each other. Read as COMPUTED rgb, because the accent is a token that answers
   differently per workspace and per theme — a literal would prove nothing. */
const rgb = s => (String(s).match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const apart = (a, b) => { const x = rgb(a), y = rgb(b);
  return Math.max(...x.map((v, i) => Math.abs(v - y[i]))); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({});
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- a book with one of every reason an obligation goes quiet ----
       Dates are OFFSETS from today, never day numbers: a fixture that pins the
       12th is green for the first eleven days of a month and red for the rest,
       which this codebase has already paid for once (f183). */
    await page.evaluate(() => {
      const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const ob = o => Object.assign({ id: 'ob_' + Math.random().toString(36).slice(2, 8),
        desc: 'A duty', due: '', recurring: 'none', assignee: '', status: 'open', quote: '' }, o);
      const mk = o => Object.assign({ valueType: 'standard', audit: [], folder: 'proc',
        rounds: [], obligations: [] }, o);
      state.contracts = [
        mk({ id: 'MK-O1', name: 'Supply agreement', counterparty: 'Naivas', status: 'Signed',
          value: 9000000, expiry: day(300), obligations: [
            ob({ desc: 'Quarterly volume report', due: day(12), recurring: 'quarterly', assignee: 'Amina Otieno' }),
            ob({ desc: 'Insurance certificate', due: day(40), party: 'theirs' }),
            ob({ desc: 'Pay within 30 days', due: day(-2), assignee: 'Amina Otieno' }),
            ob({ desc: 'Rebate reconciliation', due: day(-12), assignee: 'Amina Otieno' }),
            ob({ desc: 'Serve notice', due: '', assignee: 'Amina Otieno' }),
            ob({ desc: 'Handover on completion', due: 'on completion', assignee: 'Amina Otieno' }),
            ob({ desc: 'Audit access', due: day(-45), party: 'theirs' }),
            ob({ desc: 'Old monthly return', due: day(-200), recurring: 'monthly',
              assignee: 'Amina Otieno', status: 'done' }),
            ob({ desc: 'Old quarterly return', due: day(-300), recurring: 'quarterly',
              assignee: 'Amina Otieno', status: 'done' }),
          ] }),
        mk({ id: 'MK-O2', name: 'Distribution deal', counterparty: 'Siginon', status: 'Signed',
          value: 5000000, expiry: day(200), obligations: [
            ob({ desc: 'Monthly uptime statement', due: day(20), party: 'theirs' }),
            ob({ desc: 'Minimum volume evidence', due: day(55), party: 'theirs' }),
            ob({ desc: 'Send forecast', due: day(70), assignee: 'Someone Who Left' }),
            ob({ desc: 'Annual audit', due: day(-400), recurring: 'annual',
              assignee: 'Amina Otieno', status: 'done' }),
          ] }),
        mk({ id: 'MK-O3', name: 'Facilities contract', counterparty: 'Britam', status: 'Signed',
          value: 3000000, expiry: day(320) }),
        mk({ id: 'MK-O4', name: 'Draft services deal', counterparty: 'Zamara', status: 'Draft', value: 800000 }),
        mk({ id: 'MK-O5', name: 'Under review lease', counterparty: 'Kwezi', status: 'Under Review',
          value: 2000000, expiry: day(90) }),
        mk({ id: 'MK-O6', name: 'Closed bid', counterparty: 'Gone Ltd', status: 'Declined',
          value: 1000000, obligations: [ob({ desc: 'Should not count', due: day(5) })] }),
      ];
      setView('intel');
    });
    await page.waitForTimeout(1200);

    /* ---- 1 · the tab is on the row, in its place, and the press LANDS ---- */
    const tabs = await page.evaluate(() =>
      [...document.querySelectorAll('[data-ig-tab]')].map(b => ({
        k: b.getAttribute('data-ig-tab'), t: (b.textContent || '').trim(),
        x: Math.round(b.getBoundingClientRect().left), w: Math.round(b.getBoundingClientRect().width) })));
    const keys = tabs.map(t => t.k);
    /* REVERSED IN PLACE 2 Sep 2026, when payment terms became the fifth tab.
       This pinned the whole row as a LITERAL where its claim is this tab's own
       PLACE -- which 1c already measures as pixels. Pin the relation, or every
       later tab is a test edit rather than a decision. */
    check('1a · obligations sits directly after friction on the row',
      keys.indexOf('obligations') === keys.indexOf('friction') + 1
        && keys.indexOf('map') > keys.indexOf('obligations'), keys.join(','));
    const ob = tabs.find(t => t.k === 'obligations');
    check('1b · the tab is painted, with its own word', ob && ob.w > 20 && /\w/.test(ob.t),
      ob ? `${ob.t} @${ob.x} w${ob.w}` : 'absent');
    check('1c · it is in reading order between its neighbours',
      ob && ob.x > tabs.find(t => t.k === 'friction').x && ob.x < tabs.find(t => t.k === 'map').x);

    await page.click('[data-ig-tab="obligations"]');
    await page.waitForTimeout(900);
    const landed = await page.evaluate(() => ({
      body: !!document.getElementById('ig-oblig'),
      friction: !!document.getElementById('ig-friction'),
      frame: !!document.getElementById('ig-frame'),
      live: (document.querySelector('[data-ig-tab="obligations"]') || {}).style
        ? getComputedStyle(document.querySelector('[data-ig-tab="obligations"]')).fontWeight : null,
      tab: window.intel && intel.tab,
    }));
    /* THE EXACT FAULT THE FIRST BUILD SHIPPED: the press registered, intel.tab
       moved, and renderIntel's own whitelist sent the page back to the frame.
       So it is not enough that the tab reads live — the BODY has to be there
       and the other two must have gone. */
    check('1d · pressing it draws the report', landed.body, JSON.stringify(landed));
    check('1e · and the other two surfaces have left the screen',
      !landed.friction && !landed.frame);
    check('1f · the live tab is bold', String(landed.live) === '700', landed.live);

    /* ---- 2 · the page says what it counted ---- */
    const d = await page.evaluate(() => intelObligationsData());
    const seen = await page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      const txt = el => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');
      const nums = sel => [...host.querySelectorAll(sel)].map(e => txt(e));
      return {
        all: txt(host),
        hero: txt(host.querySelector('section')),
        panels: [...host.querySelectorAll('section')].length,
        charts: [...host.querySelectorAll('[role="img"]')].map(e => e.getAttribute('aria-label')),
        nums: nums('div'),
      };
    });
    check('2a · the hero prints the silent count it computed',
      new RegExp('(^|\\D)' + d.silent + '(\\D|$)').test(seen.hero), `${d.silent} · ${seen.hero.slice(0, 90)}`);
    check('2b · every panel drew', seen.panels >= 7, seen.panels + ' sections');
    check('2c · the overdue total is on the page',
      seen.all.includes(String(d.overdue) + ' overdue'), d.overdue);
    check('2d · the coverage split is on the page',
      seen.all.includes(String(d.cover.withOb)) && seen.all.includes(String(d.cover.none)),
      `${d.cover.withOb}/${d.cover.none}`);
    check('2e · the ours/theirs legend spells its own counts out',
      seen.all.includes('— ' + d.aheadOurs) && seen.all.includes('— ' + d.aheadTheirs),
      `${d.aheadOurs}/${d.aheadTheirs}`);
    check('2f · the declined and archived book is nowhere on the page',
      !seen.all.includes('Should not count'));
    check('2g · every chart names itself for a reader who cannot see it',
      seen.charts.length >= 4 && seen.charts.every(a => a && a.length > 10),
      seen.charts.length + ' labelled');

    /* THE ROWS ADD UP TO MORE THAN THE HEADLINE, AND THE PAGE SAYS SO. This is
       the one number on the report that looks like an arithmetic error and is
       not: an obligation can fail two tests at once and the headline counts it
       once. */
    check('2h · the overlap between reasons is stated, not hidden',
      d.silentOverlap === 0 || seen.all.includes('not ' + d.silent),
      `sum ${d.reasonSum} vs ${d.silent}`);

    /* ---- 3 · ours and theirs are tellable apart, in both themes ---- */
    const readPair = () => page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      const dots = [...host.querySelectorAll('i')].map(e => getComputedStyle(e).backgroundColor);
      const bars = [...host.querySelectorAll('span')]
        .map(e => getComputedStyle(e).backgroundColor)
        .filter(c => c && c !== 'rgba(0, 0, 0, 0)');
      return { dots, bars, page: getComputedStyle(document.body).backgroundColor };
    });
    const light = await readPair();
    check('3a · light · ours and theirs are different colours',
      light.dots.length >= 2 && apart(light.dots[0], light.dots[1]) > 40,
      `${light.dots[0]} vs ${light.dots[1]} — ${apart(light.dots[0], light.dots[1])}`);
    await page.screenshot({ path: path.join(OUT, 'report-light-1500.png'), fullPage: true });

    await page.evaluate(() => { setDark(true); });
    await page.waitForTimeout(700);
    const dark = await readPair();
    check('3b · dark · the pair survives the theme',
      dark.dots.length >= 2 && apart(dark.dots[0], dark.dots[1]) > 40,
      `${dark.dots[0]} vs ${dark.dots[1]} — ${apart(dark.dots[0], dark.dots[1])}`);
    check('3c · dark · neither is the page it is drawn on',
      apart(dark.dots[0], dark.page) > 40 && apart(dark.dots[1], dark.page) > 40,
      `page ${dark.page}`);
    await page.screenshot({ path: path.join(OUT, 'report-dark-1500.png'), fullPage: true });

    /* THE NAVY WORKSPACE MOVES THE ACCENT AND NOT THE AMBER, which is the whole
       reason the pair is accent + amber rather than two accent-ish hues: the
       calendar's own legend answered "green" twice for exactly this. */
    await page.evaluate(() => { setDark(false); setBrand('navy'); });
    await page.waitForTimeout(700);
    const navy = await readPair();
    check('3d · navy workspace · the pair still reads as two colours',
      navy.dots.length >= 2 && apart(navy.dots[0], navy.dots[1]) > 40,
      `${navy.dots[0]} vs ${navy.dots[1]} — ${apart(navy.dots[0], navy.dots[1])}`);
    await page.screenshot({ path: path.join(OUT, 'report-navy-1500.png'), fullPage: true });
    await page.evaluate(() => { setBrand('teal'); });
    await page.waitForTimeout(600);

    /* ---- 4 · it fits a laptop ---- */
    for (const w of [1500, 1440, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(500);
      const fit = await page.evaluate(() => {
        const host = document.getElementById('ig-oblig');
        return { sw: host.scrollWidth, cw: host.clientWidth,
          bodySw: document.body.scrollWidth, bodyCw: document.body.clientWidth };
      });
      check(`4 · ${w} · nothing scrolls sideways`,
        fit.sw <= fit.cw + 1 && fit.bodySw <= fit.bodyCw + 1, JSON.stringify(fit));
    }
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'report-1280.png'), fullPage: true });

    /* ---- 5 · the chase list opens, and caps honestly ---- */
    await page.setViewportSize({ width: 1500, height: 1000 });
    await page.waitForTimeout(400);
    const chase = await page.evaluate(() => {
      const s = document.querySelector('#ig-oblig details summary');
      if (!s) return null;
      s.click();
      const rows = [...s.parentElement.querySelectorAll('tr')];
      return { open: s.parentElement.open, rows: rows.length,
        text: rows.map(r => (r.textContent || '').replace(/\s+/g, ' ').trim()) };
    });
    check('5a · the chase list opens on a press', chase && chase.open, chase && chase.rows);
    check('5b · it carries a header row so the figures are named',
      chase && /Counterparty/i.test(chase.text[0] || ''), chase && chase.text[0]);
    check('5c · it names the counterparties it counted',
      chase && chase.text.join(' ').includes(d.chase[0].name), d.chase[0] && d.chase[0].name);

    /* ---- 6 · an empty book says so rather than drawing six empty panels ---- */
    await page.evaluate(() => { state.contracts = []; renderIntel(); });
    await page.waitForTimeout(600);
    const empty = await page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      return { panels: host.querySelectorAll('section').length,
        text: (host.textContent || '').replace(/\s+/g, ' ').trim() };
    });
    check('6a · an empty book draws no panels', empty.panels === 0, empty.panels);
    check('6b · and says why in words', empty.text.length > 30 && /\w/.test(empty.text),
      empty.text.slice(0, 70));

    check('7 · no page errors throughout', errors.length === 0, errors.join(' | '));
  } catch (e) {
    check('harness completed', false, e && e.message);
  } finally {
    await browser.close();
    if (h && typeof h.stop === 'function') await h.stop();
  }

  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})();
