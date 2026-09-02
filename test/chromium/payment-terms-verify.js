/* Chromium verification: THE PAYMENT TERMS TAB, AND THE TILE THAT OPENS IT.
   ============================================================
   Owner-asked 2 Sep 2026, then ruled off three drawn options: build the
   cash-gap page (A) with the exception list (B) folded into it, give it a tab
   of its own after Obligations, and let the Home tile count BOTH sides.

   f267 pins the reading in jsdom. THIS file asks the questions jsdom cannot,
   because jsdom lays nothing out and buildWorld never loads the shell:

   1  IS THE TAB REALLY THERE, in fifth place, and does pressing it DRAW?
      A new tab that draws, registers its press and then redraws the OVERVIEW
      is this page's own recorded defect — nothing failed and nothing logged,
      and it was found by looking. So the press is driven and what arrives is
      read off the page.
   2  DOES THE CHART AGREE WITH ITS OWN DATA? Every bar's printed figure is
      checked against the number payTermsData counted, and the bars are
      measured as PAINT — a chart that quietly disagreed with the reading
      behind it would pass every source check ever written.
   3  IS THE EXCEPTION LIST A DOOR? Pressed for real, and the contract it
      names has to arrive.
   4  DOES THE TILE LAND HERE? The destination is the tab rather than the
      register, and a tile that opened the wrong page looks identical in the
      markup.
   5  NOTHING SCROLLS SIDEWAYS at any laptop width.

   Screenshots go to test/chromium/shots/payment-terms/.
   Run: node test/chromium/payment-terms-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'payment-terms');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* A book with a known answer, written onto the REAL seeded contracts so the
   whole product path runs. Two customers over the standard, one supplier over
   it, one that nobody has read, and one lease that belongs on neither side. */
const BOOK = [
  { terms:'90 days from invoice',   category:'customer', value:9000000 },
  { terms:'30 days from invoice',   category:'customer', value:4000000 },
  { terms:'within sixty (60) days', category:'supplier', value:2000000 },
  { terms:'Net 30',                 category:'supplier', value:1000000 },
];
/* Never pressed, so they need no record on the server -- they exist to give
   the two honest counts something real to report. */
const EXTRA = [
  { id:'PT-NOTERMS', terms:'payment as agreed', category:'customer', value:500000 },
  { id:'PT-NOSIDE',  terms:'30 days',           category:'lease',    value:250000 },
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } });
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

    /* Write the book onto the real records. Everything else the reading needs
       -- the live filter, the playbook's standard, the money conversion -- is
       the product's own. */
    const seedBook = () => page.evaluate(([book, extra]) => {
      state.contracts = state.contracts.filter(c => !/^PT-/.test(c.id));
      const live = state.contracts.filter(c => c.status !== 'Declined' && !c.archived);
      book.forEach((b, i) => {
        const c = live[i];
        if (!c) return;
        c.metadata = Object.assign({}, c.metadata, {
          paymentTerms: b.terms, category: b.category, currency: 'KES' });
        c.value = b.value; c.valueType = 'fixed';
      });
      live.slice(book.length).forEach(c => {
        c.metadata = Object.assign({}, c.metadata, { paymentTerms: '' });
      });
      extra.forEach(e => state.contracts.push({ id:e.id, name:e.id, counterparty:e.id,
        status:'Signed', value:e.value, valueType:'fixed',
        metadata:{ paymentTerms:e.terms, category:e.category, currency:'KES' } }));
      return live.length;
    }, [BOOK, EXTRA]);
    /* One reading, asked fresh wherever the page has been re-rendered. */
    const reading = () => page.evaluate(() => {
      const x = payTermsData();
      const o = payOverStandard();
      return { overCust:o.customer, overSupp:o.supplier,
               cust:x.customer.avgDays, supp:x.supplier.avgDays, gap:x.gap,
               custN:x.customer.n, suppN:x.supplier.n, overN:x.overN,
               noTerms:x.noTerms.n, noSide:x.noSide.n, standard:x.standard,
               buckets:{ c:x.customer.buckets.map(b => b.n), s:x.supplier.buckets.map(b => b.n) },
               exceptions:x.exceptions.map(r => ({ id:r.id, days:r.days, side:r.side })) };
    });
    const seeded = await seedBook();
    check('0 the book is seeded on real records', seeded >= BOOK.length, `${seeded} live contracts`);

    /* ─── 1 · the tab is on the row, fifth, after Obligations ─── */
    await page.evaluate(() => { if (window.intel) intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(900);

    const row = await page.evaluate(() => Array.from(document.querySelectorAll('[data-ig-tab]'))
      .map(b => ({ k: b.getAttribute('data-ig-tab'), text: b.textContent.trim(),
                   w: b.getBoundingClientRect().width, x: Math.round(b.getBoundingClientRect().left) })));
    check('1a the row draws five tabs', row.length === 5, row.map(r => r.k).join(' · '));
    check('1b payment terms sits after obligations',
      row[3] && row[3].k === 'payterms' && row[2] && row[2].k === 'obligations',
      row.map(r => r.k).join(' > '));
    check('1c and before the contract graph', row[4] && row[4].k === 'map', row[4] && row[4].k);
    check('1d it is painted, not merely present',
      row[3] && row[3].w > 40, row[3] && `${Math.round(row[3].w)}px wide at x=${row[3].x}`);
    check('1e it is translated, not a raw key',
      row[3] && !/^pt_/.test(row[3].text) && row[3].text.length > 2, row[3] && row[3].text);

    /* ─── 2 · the press DRAWS this page, not the overview ─── */
    await page.click('[data-ig-tab="payterms"]');
    await page.waitForTimeout(900);
    const arrived = await page.evaluate(() => ({
      tab: window.intel && intel.tab,
      body: !!document.getElementById('ig-pt-body'),
      inner: !!document.getElementById('ig-pt'),
      /* the overview's own host, which is what a dead press would redraw */
      frame: !!document.getElementById('ig-frame'),
      live: (document.querySelector('[data-ig-tab="payterms"]') || {}).style
        ? getComputedStyle(document.querySelector('[data-ig-tab="payterms"]')).fontWeight : '',
    }));
    check('2a the press moves the page to this tab', arrived.tab === 'payterms', arrived.tab);
    check('2b the tab body really drew', arrived.body && arrived.inner,
      `body ${arrived.body} · inner ${arrived.inner}`);
    check('2c it did NOT redraw the overview', !arrived.frame,
      arrived.frame ? 'the portfolio frame is on screen' : 'the frame is gone');
    check('2d the live tab is bold', Number(arrived.live) >= 600, arrived.live);
    await page.screenshot({ path: path.join(OUT, '01-tab.png'), fullPage: true });

    /* ─── 3 · the heroes, against the reading behind them ─── */
    const d = await reading();
    const heroText = await page.evaluate(() => (document.getElementById('ig-pt') || {}).textContent || '');
    check('3a both sides are counted and printed',
      d.cust != null && d.supp != null && heroText.includes(String(d.cust)) && heroText.includes(String(d.supp)),
      `wait ${d.cust}d across ${d.custN} · pay ${d.supp}d across ${d.suppN}`);
    check('3b the gap is the difference between them',
      d.gap === d.cust - d.supp && heroText.includes(String(Math.abs(d.gap))),
      `${d.cust} - ${d.supp} = ${d.gap}`);

    /* ─── 4 · the chart agrees with its own data ─── */
    const chart = await page.evaluate(() => {
      const root = document.getElementById('ig-pt');
      const plot = root && root.querySelector('[role="img"] > div');
      if (!plot) return null;
      const cols = Array.from(plot.children).filter(el => el.tagName === 'SPAN' && el.children.length === 2);
      return {
        cols: cols.length,
        bars: cols.map(col => Array.from(col.children).map(b => {
          const r = b.getBoundingClientRect();
          return { h: Math.round(r.height), w: Math.round(r.width),
                   label: (b.textContent || '').trim(), bg: getComputedStyle(b).backgroundColor };
        })),
        axis: Array.from(root.querySelectorAll('[role="img"] > div + div > span')).map(s => s.textContent.trim()),
        std: (() => {
          const s = Array.from(root.querySelectorAll('span')).find(el =>
            getComputedStyle(el).borderLeftStyle === 'dashed');
          return s ? { x: Math.round(s.getBoundingClientRect().left), text: s.textContent.trim() } : null;
        })(),
        plotBox: { x: Math.round(plot.getBoundingClientRect().left), w: Math.round(plot.getBoundingClientRect().width) },
      };
    });
    check('4a the chart drew a column per bucket', chart && chart.cols === 5, chart && chart.cols);
    const labelsMatch = chart && chart.bars.every((col, i) =>
      Number(col[0].label) === d.buckets.c[i] && Number(col[1].label) === d.buckets.s[i]);
    check('4b every printed figure is the figure the reading counted', labelsMatch,
      chart ? chart.bars.map((c, i) => `${c[0].label}/${c[1].label}`).join(' ') +
        ' vs ' + d.buckets.c.map((n, i) => `${n}/${d.buckets.s[i]}`).join(' ') : 'no chart');
    /* A TALLER BAR IS A BIGGER NUMBER. A chart whose heights did not follow its
       own counts would still print the right labels. */
    const heightsFollow = chart && chart.bars.every((col, i) => chart.bars.every((other, j) =>
      d.buckets.c[i] <= d.buckets.c[j] ? col[0].h <= other[0].h + 1 : true));
    check('4c a taller bar is a bigger count', heightsFollow,
      chart && chart.bars.map((c, i) => `${d.buckets.c[i]}=${c[0].h}px`).join(' '));
    check('4d the two sides are tellable apart as colour',
      chart && chart.bars[0] && chart.bars[0][0].bg !== chart.bars[0][1].bg,
      chart && chart.bars[0] && `${chart.bars[0][0].bg} vs ${chart.bars[0][1].bg}`);
    check('4e the axis names every bucket', chart && chart.axis.length === 5, chart && chart.axis.join(' '));
    check('4f the standard rule is drawn and names its number',
      chart && chart.std && chart.std.text.includes(String(d.standard)),
      chart && chart.std && chart.std.text);
    /* The rule sits on a bucket boundary inside the plot, never off the end. */
    check('4g and it sits inside the plot',
      chart && chart.std && chart.std.x > chart.plotBox.x && chart.std.x < chart.plotBox.x + chart.plotBox.w,
      chart && chart.std && `rule at ${chart.std.x}, plot ${chart.plotBox.x}..${chart.plotBox.x + chart.plotBox.w}`);

    /* ─── 5 · the exception list is a door ─── */
    const exc = await page.evaluate(() => Array.from(document.querySelectorAll('[data-pt-open]'))
      .map(b => { const r = b.getBoundingClientRect();
        return { id:b.getAttribute('data-pt-open'), text:b.textContent.replace(/\s+/g, ' ').trim(),
                 w:Math.round(r.width), h:Math.round(r.height) }; }));
    check('5a a row per contract over the standard', exc.length === d.overN,
      `${exc.length} rows · reading says ${d.overN}`);
    check('5b every row is visible pixels', exc.length > 0 && exc.every(r => r.w > 100 && r.h > 10),
      exc.map(r => `${r.id} ${r.w}x${r.h}`).join(' · '));
    check('5c the biggest is first', exc.length > 1 && exc[0].id === d.exceptions[0].id,
      exc.map(r => r.id).join(' > '));
    check('5d each row names its side in words',
      exc.every(r => /customer|supplier|kund|leverant/i.test(r.text)),
      exc[0] && exc[0].text);

    const target = exc[0] && exc[0].id;
    await page.click(`[data-pt-open="${target}"]`);
    await page.waitForTimeout(1400);
    const landed = await page.evaluate(() => ({ view: state.view, id: state.activeId }));
    check('5e pressing a row opens that contract',
      landed.view === 'workspace' && landed.id === target,
      `${landed.view} · ${landed.id} (wanted ${target})`);

    /* ─── 6 · nothing is folded away ─── */
    await page.evaluate(() => { intel.tab = 'payterms'; setView('intel'); });
    await page.waitForTimeout(900);
    const honest = await page.evaluate(() => (document.getElementById('ig-pt') || {}).textContent || '');
    check('6a what could not be read is counted out AND named',
      d.noTerms === 0 || honest.includes(String(d.noTerms)),
      `${d.noTerms} with no terms on file`);
    check('6b a contract on neither side says so',
      d.noSide === 0 || honest.includes(String(d.noSide)), `${d.noSide} with no category`);
    check('6c the honest limit is on the page',
      /bank|accounting/i.test(honest), 'it says what it cannot see');

    /* ─── 7 · the Home tile ─── */
    await seedBook();
    const d2 = await reading();
    await page.evaluate(() => { setKpiSel(['payterms', 'approvals', 'negotiations', 'avgcycle']); setView('dashboard'); });
    await page.waitForTimeout(1200);
    const tile = await page.evaluate(() => {
      const el = document.querySelector('[data-kpi-id="payterms"]');
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { text: el.textContent.replace(/\s+/g, ' ').trim(), w: Math.round(r.width), h: Math.round(r.height),
               dead: el.classList.contains('is-dead') };
    });
    check('7a the tile draws on Home', tile && tile.w > 100 && tile.h > 60,
      tile ? `${tile.w}x${tile.h}` : 'absent');
    check('7b it counts BOTH sides', tile && tile.text.includes(String(d2.overN)),
      tile ? `${tile.text} · reading says ${d2.overN}` : 'absent');
    /* The two halves are printed and they add up to the headline -- a single
       number with no split reads as all bad news, which is the whole reason
       the owner's ruling needed a sub-line. */
    check('7c and names the two halves apart',
      tile && new RegExp(String(d2.overCust) + '\\D+' + String(d2.overSupp)).test(tile.text),
      tile ? `${tile.text} · wants ${d2.overCust} then ${d2.overSupp}` : 'absent');
    await page.screenshot({ path: path.join(OUT, '02-tile.png'), fullPage: true });

    if (tile && !tile.dead) {
      await page.click('[data-kpi-id="payterms"]');
      await page.waitForTimeout(1400);
      const went = await page.evaluate(() => ({ view: state.view, tab: window.intel && intel.tab,
        body: !!document.getElementById('ig-pt-body') }));
      check('7d pressing it lands on THIS tab, not the register',
        went.view === 'intel' && went.tab === 'payterms' && went.body,
        `${went.view} · ${went.tab} · body ${went.body}`);
    } else {
      check('7d pressing it lands on THIS tab, not the register', false, 'the tile drew dead');
    }

    /* ─── 8 · no page scrolls sideways ─── */
    await page.evaluate(() => { intel.tab = 'payterms'; setView('intel'); });
    for (const w of [1280, 1366, 1440, 1920]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(500);
      const over = await page.evaluate(() => {
        const el = document.getElementById('ig-pt-body');
        return el ? { sw: el.scrollWidth, cw: el.clientWidth, body: document.body.scrollWidth <= window.innerWidth + 1 } : null;
      });
      check(`8 no sideways scroll at ${w}`,
        over && over.sw <= over.cw + 1 && over.body,
        over ? `${over.sw} in ${over.cw}` : 'no body');
    }
    await page.setViewportSize({ width: 1500, height: 1100 });

    /* ─── 9 · both languages ─── */
    await page.evaluate(() => { window.langSet('sv'); intel.tab = 'payterms'; setView('intel'); });
    await page.waitForTimeout(1000);
    const sv = await page.evaluate(() => ({
      tab: (document.querySelector('[data-ig-tab="payterms"]') || {}).textContent || '',
      body: (document.getElementById('ig-pt') || {}).textContent || '',
    }));
    check('9a the tab turns over into Swedish', /Betalningsvillkor/.test(sv.tab), sv.tab.trim());
    check('9b and so does the page', /Vi v.ntar|Gapet/.test(sv.body), sv.body.slice(0, 60).replace(/\s+/g, ' '));
    check('9c no key leaked through untranslated', !/\bpt_[a-z_]+/.test(sv.body),
      (sv.body.match(/\bpt_[a-z_]+/g) || []).slice(0, 3).join(' ') || 'clean');
    await page.screenshot({ path: path.join(OUT, '03-swedish.png'), fullPage: true });

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
