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

   2  DOES THE PAGE SAY WHAT IT COUNTED? Every figure on screen is compared
      against the number intelObligationsData returned, so a tile that quietly
      disagreed with its own data fails here — and the hollow dots are the
      silent ones (RE-POINTED 28 Sep 2026 to the Reminder Line).

   3  IS THE COLOUR TELLABLE APART, IN BOTH THEMES? Will be reminded (a green
      dot) against will reach nobody (a hollow ruby ring) — a pair that has to
      survive the teal workspace, the navy one and the dark theme. Measured as
      COMPUTED values.

   4  DOES IT FIT A LAPTOP? Measured at three widths, with no sideways scroll.

   5  DOES EVERY DOOR LAND? A figure opens the Obligations list showing
      exactly what it counted; a dot opens its own obligation, picked.

   8  DOES IT FIT THE SCREEN? (owner-picked "Fit to Screen", 29 Sep 2026)
      At 1440x900 and 1920x1080 the tab does not scroll, the six tiles lead,
      the line's card reaches the bottom with no empty band under it, and
      nothing spills except inside the lanes' own scroller; with more lanes
      than fit, the lanes scroll INSIDE the card and the dates row stays put;
      below 1080px the page stacks and scrolls as a plain column.

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
      window.__seeded = state.contracts.slice();
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
      strong: getComputedStyle(document.documentElement).getPropertyValue('--w-strong').trim(),
    }));
    /* THE EXACT FAULT THE FIRST BUILD SHIPPED: the press registered, intel.tab
       moved, and renderIntel's own whitelist sent the page back to the frame.
       So it is not enough that the tab reads live — the BODY has to be there
       and the other two must have gone. */
    check('1d · pressing it draws the report', landed.body, JSON.stringify(landed));
    check('1e · and the other two surfaces have left the screen',
      !landed.friction && !landed.frame);
    /* RE-POINTED 21 Sep 2026: a live tab is at the product's STRONG rung, which
       the redesign made 600 (--w-strong); read off the root, never typed. */
    check('1f · the live tab is bold', Number(landed.live) >= Number(landed.strong) && Number(landed.strong) >= 600,
      `${landed.live} (strong rung ${landed.strong})`);

    /* ---- 2 · the page says what it counted ----
       RE-POINTED 28 Sep 2026 to the owner's pick, the Reminder Line: the hero,
       the six cards and the chase list became one line and six tiles. What
       this section asks is unchanged — every figure on screen is the number
       the counter returned — and it now asks it of the tiles and the dots. */
    const d = await page.evaluate(() => intelObligationsData());
    const seen = await page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      const txt = el => (el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '');
      const tile = k => txt(host.querySelector(`[data-ob-rl-door="${k}"]`) ||
        [...host.querySelectorAll('.igx-fig')].find(t => t.getAttribute('data-ob-rl-door') === k));
      return {
        all: txt(host),
        silent: tile('silent'), late: tile('late'), ahead: tile('ahead'), cover: tile('cover'),
        sections: host.querySelectorAll('section').length,
        /* RE-POINTED 29 Sep 2026 ("Fit to Screen"): the six tiles are the
           Insights figure strip's own tile now, .igx-fig. */
        tiles: host.querySelectorAll('.igx-figs > .igx-fig').length,
        group: (host.querySelector('.ob-rl-grid') || {}).getAttribute ? host.querySelector('.ob-rl-grid').getAttribute('aria-label') : null,
        dots: [...host.querySelectorAll('.ob-rl-dot')].map(e => ({ hollow: e.classList.contains('is-silent'), label: e.getAttribute('aria-label') })),
      };
    });
    check('2a · the "will reach nobody" tile prints the silent count it computed',
      new RegExp('(^|\\D)' + d.silent + '(\\D|$)').test(seen.silent), `${d.silent} · ${seen.silent}`);
    check('2b · the line and its six tiles drew', seen.sections === 1 && seen.tiles === 6,
      `${seen.sections} section · ${seen.tiles} tiles`);
    check('2c · the overdue total is on the Late tile',
      new RegExp('(^|\\D)' + d.overdue + '(\\D|$)').test(seen.late), `${d.overdue} · ${seen.late}`);
    check('2d · the coverage figures are on the page',
      seen.cover.includes(String(d.cover.none)) && seen.cover.includes(String(d.cover.noneSigned) + ' signed'),
      `${d.cover.none}/${d.cover.noneSigned} · ${seen.cover}`);
    check('2e · the next-90-days tile spells ours and theirs out',
      seen.ahead.includes('ours ' + d.aheadOurs) && seen.ahead.includes('theirs ' + d.aheadTheirs),
      `${d.aheadOurs}/${d.aheadTheirs} · ${seen.ahead}`);
    check('2f · the declined and archived book is nowhere on the page',
      !seen.all.includes('Should not count'));
    check('2g · the line names itself, and every dot says its own sentence',
      !!seen.group && seen.dots.length > 0 && seen.dots.every(x => x.label && x.label.length > 20),
      `${seen.dots.length} dots`);
    /* THE HOLLOW DOTS ARE THE HEADLINE — the one predicate's promise, read
       off the page: every silent obligation with a day on the line is drawn
       hollow, and nothing else is. */
    const onLine = [...d.lanes.ours, ...d.lanes.theirs].flatMap(L => L.dots);
    check('2h · the hollow dots are exactly the silent ones on the line',
      seen.dots.filter(x => x.hollow).length === onLine.filter(x => !x.told).length
        && seen.dots.length === onLine.length,
      `${seen.dots.filter(x => x.hollow).length} hollow of ${seen.dots.length}`);

    /* ---- 3 · told and not told are tellable apart, in both themes ----
       RE-POINTED 28 Sep 2026: the page's one colour question is now "will
       anybody be told" — a filled green dot against a hollow ruby ring — and
       it must survive the dark theme and the navy workspace. Measured as
       COMPUTED values. */
    const readPair = () => page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      const told = host.querySelector('.ob-rl-dot.is-told'), sil = host.querySelector('.ob-rl-dot.is-silent');
      return { dots: [told ? getComputedStyle(told).backgroundColor : '', sil ? getComputedStyle(sil).borderTopColor : ''],
        page: getComputedStyle(document.body).backgroundColor };
    });
    const light = await readPair();
    check('3a · light · told and not told are different colours',
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

    /* THE NAVY WORKSPACE MOVES THE ACCENT, and neither status colour may be
       the accent: green and ruby are fixed in every workspace. */
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

    /* ---- 8 · it fits the screen (owner-picked "Fit to Screen", 29 Sep 2026) ----
       Measured where the reader looks: the tab's own scroller, the card's
       bottom against the scroller's inner bottom, and every element outside
       the lanes' scroller against the window. */
    const fitRead = () => page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      const hr = host.getBoundingClientRect();
      const inner = hr.bottom - parseFloat(getComputedStyle(host).paddingBottom);
      const card = host.querySelector('section.igx-card');
      const figs = [...host.querySelectorAll('.igx-figs > .igx-fig')].map(f => f.getBoundingClientRect());
      const sc = document.getElementById('ob-rl-scroll');
      const spill = [...host.querySelectorAll('*')].filter(e => !e.closest('#ob-rl-scroll')
        && e.getBoundingClientRect().bottom > hr.bottom + 1).length;
      return { scrolls: host.scrollHeight > host.clientHeight + 1,
        gap: card ? Math.round(inner - card.getBoundingClientRect().bottom) : null,
        figsFirst: figs.length === 6 && card && figs.every(r => r.bottom <= card.getBoundingClientRect().top),
        oneHeight: figs.length === 6 && new Set(figs.map(r => Math.round(r.height))).size === 1,
        spill, lanes: sc ? [sc.scrollHeight, sc.clientHeight] : null };
    });
    for (const [w, hgt] of [[1440, 900], [1920, 1080]]) {
      await page.setViewportSize({ width: w, height: hgt });
      await page.waitForTimeout(500);
      const f = await fitRead();
      check(`8a · ${w}x${hgt} · the tab does not scroll`, !f.scrolls, JSON.stringify(f));
      check(`8b · ${w}x${hgt} · the six tiles lead, one height`, f.figsFirst && f.oneHeight);
      check(`8c · ${w}x${hgt} · the card reaches the bottom, no empty band`, f.gap != null && Math.abs(f.gap) <= 1, f.gap);
      check(`8d · ${w}x${hgt} · nothing spills outside the lanes' own scroller`, f.spill === 0, f.spill);
      await page.screenshot({ path: path.join(OUT, `fit-${w}.png`) });
    }
    /* MORE LANES THAN FIT: fourteen more people carrying one promise each.
       Their promises are taken off again before section 5 counts its doors. */
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.evaluate(() => {
      const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const c = state.contracts[1];
      window.__obKeep = c.obligations.slice();
      for (let i = 0; i < 14; i++) c.obligations.push({ id: 'ob_more_' + i, desc: 'Extra duty ' + i, due: day(-20 + i * 9),
        party: i < 8 ? 'ours' : 'theirs', assignee: 'Extra Person ' + i, status: 'open', recurring: 'none' });
      renderIntel();
    });
    await page.waitForTimeout(500);
    const many = await fitRead();
    const pinned = await page.evaluate(() => {
      const sc = document.getElementById('ob-rl-scroll');
      const head = sc && sc.querySelector('.ob-rl-row.is-head');
      if (!head) return null;
      sc.scrollTop = sc.scrollHeight;
      const hr = head.getBoundingClientRect();
      const hit = document.elementFromPoint(hr.left + hr.width / 2, hr.top + hr.height / 2);
      return { moved: sc.scrollTop, off: Math.round(hr.top - sc.getBoundingClientRect().top),
        painted: !!(hit && hit.closest('.ob-rl-row.is-head')) };
    });
    check('8e · with more lanes than fit, the tab still does not scroll', !many.scrolls && many.spill === 0, JSON.stringify(many));
    check('8f · the lanes scroll inside the card', !!many.lanes && many.lanes[0] > many.lanes[1] + 1, JSON.stringify(many.lanes));
    check('8g · and the dates row stays at the top of them, painted', !!pinned && pinned.moved > 0 && Math.abs(pinned.off) <= 1 && pinned.painted,
      JSON.stringify(pinned));
    await page.screenshot({ path: path.join(OUT, 'fit-many-lanes-1440.png') });
    await page.setViewportSize({ width: 1000, height: 800 });
    await page.waitForTimeout(500);
    const narrow = await page.evaluate(() => {
      const host = document.getElementById('ig-oblig');
      const figs = [...host.querySelectorAll('.igx-figs > .igx-fig')].map(f => Math.round(f.getBoundingClientRect().left));
      return { scrolls: host.scrollHeight > host.clientHeight + 1, columns: new Set(figs).size,
        bodySw: document.body.scrollWidth, bodyCw: document.body.clientWidth };
    });
    check('8h · at 1000px the page stacks and scrolls as a column, never sideways',
      narrow.scrolls && narrow.columns === 2 && narrow.bodySw <= narrow.bodyCw + 1, JSON.stringify(narrow));
    await page.evaluate(() => { state.contracts[1].obligations = window.__obKeep; renderIntel(); });
    await page.waitForTimeout(300);

    /* ---- 5 · every figure and dot is a door, and lands where it says ----
       RE-POINTED 28 Sep 2026: the chase list this section opened went with the
       owner's pick of the Reminder Line. What replaced it is a door on every
       figure and dot, so the press is DRIVEN and what arrives is read off the
       page: the list shows exactly the rows the figure counted, and a dot
       opens its own obligation, picked, on its contract's Obligations tab. */
    await page.setViewportSize({ width: 1500, height: 1000 });
    const waitFor = (fn, arg) => page.waitForFunction(fn, arg, { timeout: 10000 }).then(() => true, () => false);
    const nobody = d.silent;
    const tileLive = await page.evaluate(() => !!document.querySelector('#ig-oblig [data-ob-rl-door="silent"]'));
    check('5a · the "will reach nobody" figure is a door', tileLive);
    if (tileLive) {
      await page.click('#ig-oblig [data-ob-rl-door="silent"]');
      const landed5 = await waitFor(() => !!document.getElementById('obw-only'));
      const list = await page.evaluate(() => ({
        chip: ((document.getElementById('obw-only') || {}).textContent || '').trim(),
        rows: document.querySelectorAll('[data-ins-row],[data-obw-row]').length }));
      check('5b · it lands on the Obligations list showing exactly the ones it counted',
        landed5 && list.rows === nobody, `${list.rows} rows for ${nobody} · chip "${list.chip}"`);
      await page.screenshot({ path: path.join(OUT, 'door-list-1500.png') });
      await page.click('[data-obw-only-clear]');
      const cleared = await waitFor(() => !document.getElementById('obw-only'));
      check('5c · the chip is also the way out of the narrowing', cleared);
    }
    /* A DOT OPENS ITS OBLIGATION IN ITS OWN PLACE. The report above is drawn
       off records staged in the browser, which the server does not hold, so
       this half stages its two promises on a contract the server really has. */
    const real = await page.evaluate(() => {
      const me = currentUser();
      const day = off => { const x = new Date(); x.setDate(x.getDate() + off);
        return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`; };
      const c = (window.__seeded || []).find(x => x.status === 'Signed');
      if (!c) return null;
      c.obligations = [
        { id: 'rl-first', desc: 'A promise that sorts first', due: day(40), status: 'open', party: 'ours', assignee: me.name, recurring: 'none' },
        { id: 'rl-target', desc: 'The promise this dot is', due: day(5), status: 'open', party: 'ours', assignee: me.name, recurring: 'none' }];
      persist(c);
      state.contracts = [c];
      return c.id;
    });
    check('5d · a contract the server holds was staged', !!real, real);
    if (real) {
      await page.waitForTimeout(900);   // persist() is debounced at 400ms
      await page.evaluate(() => { intel.tab = 'obligations'; setView('intel'); });
      await waitFor(() => !!document.querySelector('#ig-oblig .ob-rl-dot'));
      const key = await page.evaluate(() => {
        const b = [...document.querySelectorAll('#ig-oblig .ob-rl-dot')].find(x => /The promise this dot is/.test(x.title || ''));
        if (!b) return null;
        const k = b.getAttribute('data-ob-rl-key'); b.click(); return k;
      });
      const picked = key ? await waitFor(k => !!document.querySelector(`[data-ob-key="${k}"].is-sel`), key) : false;
      check('5e · a dot opens its obligation, picked, on the contract’s Obligations tab', picked, key);
      await page.screenshot({ path: path.join(OUT, 'door-dot-1500.png') });
    }
    await page.evaluate(() => { intel.tab = 'obligations'; setView('intel'); });
    await page.waitForTimeout(400);

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
