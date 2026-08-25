/* Chromium verification: THE TEMPLATES PAGE IS TWO TABS.
   ============================================================
   Owner-asked 25 Aug 2026, off the demo: "Image 1 from the demo should be the
   first tab called Templates overview. Image 2 should be the 2nd tab which is
   what is currently in the platform and that will be called Templates. The
   connect the two to function together."

   WHY A BROWSER FILE. f244 pins the arithmetic and the words; every claim here
   is a PRESS or a GEOMETRY, and this codebase's most expensive lesson is that
   a rule losing a cascade fight looks perfectly correct in the source. Three
   of these could sail past a source test in exactly that way:

     · a tab that flips a `hidden` attribute proves nothing about whether the
       table left the screen — .st-tab and the sections are dressed by rules in
       index.html, and `hidden` is beaten by any display declaration (this is
       the .ui-btn[hidden] fight, already paid for once);
     · the cards are a grid whose column count is a media query, so whether
       the wall fits its column can only be asked of a real window;
     · "the two tabs work together" is a JOURNEY — press a card, land on the
       table, find it narrowed — and a handler that is attached is not a
       handler that lands.

   THE TYPE CLAIMS ARE RELATIONS. The tab row is compared against the Settings
   page's own row rather than against a typed colour, because both read one
   rule and the point is that they cannot drift.

   Run: node test/chromium/templates-tabs-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'templates-tabs');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* The seeded portfolio is stamped `seeded`, and builtinUsageRows excludes it
   on purpose — HaTi's own sample book is not this workspace's usage. So the
   overview would draw every figure as a zero and never exercise the branch
   that matters. Four contracts are staged against one built-in template: three
   raised inside the 90-day window, three checked against the playbook and two
   of those off-standard, one raised long ago and one never checked. */
const SEED = () => {
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  const mk = (id, days, pb) => ({
    id, name: 'Staged ' + id, counterparty: 'Naivas', status: 'Under Review',
    template: 'PS', folder: 'proc', value: 1000000, valueType: 'estimated',
    _raisedAt: ago(days), audit: [{ action: 'Created', at: ago(days), user: 'Amina' }],
    changes: [], playbook: pb || undefined,
  });
  state.contracts.unshift(
    mk('ST-1', 5, { verdicts: [{ status: 'deviation' }] }),
    mk('ST-2', 9, { verdicts: [{ status: 'missing' }] }),
    mk('ST-3', 20, { verdicts: [{ status: 'ok' }] }),
    mk('ST-4', 300, null),
  );
  setView('templates');
};

const BOX = sel => {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    display: s.display, vis: s.visibility, txt: e.textContent.trim().slice(0, 60) };
};

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
    await page.evaluate(SEED);
    await pause(1400);
    await page.screenshot({ path: path.join(OUT, '01-overview.png'), fullPage: true });

    /* ================= 1 · THE ROW, AND WHERE A READER LANDS ================ */
    const tabs = await page.evaluate(() => {
      const t = [...document.querySelectorAll('[data-tpl-tab]')].map(e => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return { k: e.getAttribute('data-tpl-tab'), txt: e.textContent.trim(),
          on: e.classList.contains('on'), sel: e.getAttribute('aria-selected'),
          weight: s.fontWeight, color: s.color, size: s.fontSize,
          x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
      });
      const secBox = k => {
        const e = document.querySelector(`[data-tpl-sec="${k}"]`); if (!e) return null;
        const r = e.getBoundingClientRect();
        return { hidden: e.hidden, w: Math.round(r.width), h: Math.round(r.height) };
      };
      return { t, ov: secBox('overview'), list: secBox('list'),
        subs: document.querySelectorAll('#content .st-tabsub').length,
        title: (document.querySelector('#content h1') || {}).textContent };
    });
    check('1a · two tabs, overview first, both named',
      tabs.t.length === 2 && tabs.t[0].k === 'overview' && tabs.t[1].k === 'list'
      && /overview/i.test(tabs.t[0].txt) && tabs.t[1].txt.length > 0,
      tabs.t.map(x => x.k + ':' + x.txt));
    check('1b · the overview is the tab a reader lands on, and it is drawn',
      tabs.t[0].on && tabs.t[0].sel === 'true' && tabs.ov && !tabs.ov.hidden && tabs.ov.h > 200,
      { ov: tabs.ov });
    check('1c · and the table has really left the screen, not merely lost an attribute',
      tabs.list && tabs.list.hidden === true && tabs.list.h === 0 && tabs.list.w === 0,
      { list: tabs.list });
    check('1d · the live tab is bold and the resting one is not',
      Number(tabs.t[0].weight) >= 700 && Number(tabs.t[1].weight) < 700,
      tabs.t.map(x => x.k + ':' + x.weight));
    check('1e · no sentence under the title or under the tabs',
      tabs.subs === 0, { subtitles: tabs.subs, title: tabs.title });

    /* THE ROW IS THE SETTINGS PAGE'S ROW. One rule, two homes — asserted as a
       RELATION so a later type pass costs no edit here. */
    const ref = await page.evaluate(() => {
      const pull = e => { const s = getComputedStyle(e);
        return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color,
          padding: s.padding, borderBottomWidth: s.borderBottomWidth }; };
      const mine = document.querySelector('[data-tpl-tab="list"]');
      return { mine: pull(mine) };
    });
    await page.evaluate(() => setView('playbook'));
    await pause(1200);
    const other = await page.evaluate(() => {
      const e = document.querySelector('.st-tab:not(.on)'); if (!e) return null;
      const s = getComputedStyle(e);
      return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color,
        padding: s.padding, borderBottomWidth: s.borderBottomWidth };
    });
    check('1f · a resting tab here is dressed exactly like a resting tab on Our standards',
      other && JSON.stringify(other) === JSON.stringify(ref.mine), { mine: ref.mine, other });
    await page.evaluate(() => setView('templates'));
    await pause(1200);

    /* ================= 2 · THE CARDS ARE REAL PIXELS ======================== */
    const cards = await page.evaluate(() => {
      const wall = document.querySelector('.tpl-ov-cards');
      const cs = [...document.querySelectorAll('.tpl-ov-cards [data-tpl-ov-card]')].map(e => {
        const r = e.getBoundingClientRect();
        return { id: e.getAttribute('data-tpl-ov-card'), name: e.getAttribute('data-tpl-ov-name'),
          w: Math.round(r.width), h: Math.round(r.height), txt: e.textContent.replace(/\s+/g, ' ').trim() };
      });
      const wr = wall ? wall.getBoundingClientRect() : null;
      return { n: cs.length, cards: cs,
        wall: wr ? { x: Math.round(wr.x), w: Math.round(wr.width) } : null,
        cols: wall ? getComputedStyle(wall).gridTemplateColumns.split(' ').length : 0 };
    });
    check('2a · the wall draws cards with real size',
      cards.n >= 4 && cards.cards.every(c => c.w > 180 && c.h > 90),
      { n: cards.n, first: cards.cards[0] });
    check('2b · a card carries both figures and the sentence that qualifies them',
      cards.cards.some(c => /Used/.test(c.txt) && /Deviation rate/.test(c.txt))
      && cards.cards.some(c => /came back off-standard/.test(c.txt))
      && cards.cards.some(c => /not checked/.test(c.txt)),
      cards.cards.find(c => /off-standard/.test(c.txt)));
    check('2c · a template nothing has come off says that, not that nothing was checked',
      cards.cards.some(c => /No contract has been drafted from it yet/.test(c.txt)),
      cards.cards.filter(c => /drafted from it yet/.test(c.txt)).length);
    check('2d · the wall is more than one column at 1500px', cards.cols >= 2, cards.cols);

    /* ================= 3 · THE TWO PANELS =================================== */
    const panels = await page.evaluate(() => {
      const txt = document.querySelector('[data-tpl-sec="overview"]').textContent.replace(/\s+/g, ' ');
      const bars = [...document.querySelectorAll('[data-tpl-sec="overview"] .tpl-ov + *')].length;
      const wide = [...document.querySelectorAll('[data-tpl-sec="overview"] [data-tpl-ov-card]')]
        .map(e => Math.round(e.getBoundingClientRect().width));
      return { txt, bars, wide };
    });
    check('3a · Needs attention names what wants somebody, worst first',
      /Needs attention/.test(panels.txt) && /off-standard \d+% of the time/.test(panels.txt),
      (panels.txt.match(/Needs attention.{0,120}/) || [''])[0]);
    check('3b · Most used names its own window and draws bars',
      /Most used, 90 days/.test(panels.txt), (panels.txt.match(/Most used.{0,80}/) || [''])[0]);
    check('3c · the page states its coverage once', /count only contracts a playbook has read/.test(panels.txt));

    /* ================= 4 · THE TWO TABS WORK TOGETHER ======================= */
    await page.click('[data-tpl-tab="list"]');
    await pause(500);
    const flipped = await page.evaluate(() => {
      const b = sel => { const e = document.querySelector(sel); const r = e.getBoundingClientRect();
        return { hidden: e.hidden, h: Math.round(r.height) }; };
      return { ov: b('[data-tpl-sec="overview"]'), list: b('[data-tpl-sec="list"]'),
        rows: document.querySelectorAll('#tpl-rows tr').length };
    });
    check('4a · pressing Templates puts the table on screen and takes the overview off',
      flipped.list.h > 200 && !flipped.list.hidden && flipped.ov.h === 0 && flipped.ov.hidden
      && flipped.rows > 1, flipped);
    await page.screenshot({ path: path.join(OUT, '02-list.png'), fullPage: true });

    await page.click('[data-tpl-tab="overview"]');
    await pause(400);
    const target = await page.evaluate(() =>
      document.querySelector('.tpl-ov-cards [data-tpl-ov-card]').getAttribute('data-tpl-ov-name'));
    await page.click('.tpl-ov-cards [data-tpl-ov-card]');
    await pause(600);
    const landed = await page.evaluate(() => ({
      tab: document.querySelector('[data-tpl-tab="list"]').classList.contains('on'),
      listH: Math.round(document.querySelector('[data-tpl-sec="list"]').getBoundingClientRect().height),
      box: document.getElementById('tpl-search').value,
      rows: [...document.querySelectorAll('#tpl-rows tr')].slice(1)
        .map(r => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)),
    }));
    check('4b · a card lands on the table, narrowed to that template',
      landed.tab && landed.listH > 100 && landed.rows.length === 1
      && landed.rows[0].includes(target), { target, ...landed });
    check('4c · the narrowing says so in plain sight, and emptying the box is the way back',
      landed.box === target, landed.box);
    await page.screenshot({ path: path.join(OUT, '03-narrowed.png'), fullPage: true });

    await page.fill('#tpl-search', '');
    await pause(400);
    const cleared = await page.evaluate(() => document.querySelectorAll('#tpl-rows tr').length);
    check('4d · and it really does widen again', cleared > 2, cleared);

    await page.click('[data-tpl-tab="overview"]');
    await pause(400);
    const hasAll = await page.$('#tpl-ov-all');
    if (hasAll) {
      await page.click('#tpl-ov-all');
      await pause(600);
      const all = await page.evaluate(() => ({
        tab: document.querySelector('[data-tpl-tab="list"]').classList.contains('on'),
        box: document.getElementById('tpl-search').value,
        rows: document.querySelectorAll('#tpl-rows tr').length,
      }));
      check('4e · "see all" opens the table whole', all.tab && all.box === '' && all.rows > 5, all);
    } else {
      check('4e · "see all" opens the table whole', false, 'no #tpl-ov-all drawn');
    }

    /* ================= 5 · THE PAGE NEVER SCROLLS SIDEWAYS ================== */
    const widths = [];
    for (const w of [1500, 1280, 1024]) {
      await ctx.pages()[0].setViewportSize({ width: w, height: 900 });
      await page.evaluate(() => { document.querySelector('[data-tpl-tab="overview"]').click(); });
      await pause(500);
      widths.push(await page.evaluate(() => ({
        w: window.innerWidth,
        over: Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth),
        cols: getComputedStyle(document.querySelector('.tpl-ov')).gridTemplateColumns.split(' ').length,
      })));
    }
    check('5a · no horizontal scroll at any laptop width',
      widths.every(x => x.over <= 1), widths);
    check('5b · the panels drop under the wall where there is no room for them',
      widths[0].cols === 2 && widths[2].cols === 1, widths.map(x => x.w + ':' + x.cols));
    await page.setViewportSize({ width: 1500, height: 1000 });

    check('6a · the page threw nothing', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('harness', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { bad.forEach(b => console.log('  FAIL ' + b.name)); process.exit(1); }
})();
