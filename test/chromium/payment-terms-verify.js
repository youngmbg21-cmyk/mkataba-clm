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
               /* DEFENSIVE ON PURPOSE: run against a build without these
                  readings this must REPORT rather than throw — a probe that
                  crashes aborts the whole file and says nothing about the
                  claims it was written for. */
               drivers:(x.drivers || []).map(r => r.id),
               rows:(x.rows || []).map(r => ({ id:r.id, gapDays:r.gapDays, side:r.side, bucket:r.bucket })),
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
        axis: Array.from(root.querySelectorAll('[role="img"] > div:nth-child(2) > span')).map(s => s.textContent.trim()),
        /* THE BOUNDARY IS A LINE PER SIDE NOW, and its caption is a sibling row
           under the axis rather than text hanging off the line. Read as PAINT:
           x, colour and the caption's own centre, because "is the caption on
           the line" is a geometry question and cannot be asked of markup. */
        lines: Array.from(plot.querySelectorAll('span')).filter(el =>
          getComputedStyle(el).borderLeftStyle === 'dashed').map(el => {
            const r = el.getBoundingClientRect();
            return { x: Math.round(r.left), ink: getComputedStyle(el).borderLeftColor };
          }),
        caps: Array.from(root.querySelectorAll('[role="img"] > div:nth-child(n+3) > span')).map(el => {
          const r = el.getBoundingClientRect();
          return { text: el.textContent.trim(), mid: Math.round(r.left + r.width / 2),
                   top: Math.round(r.top), ink: getComputedStyle(el).color };
        }),
        axisTop: Math.round(root.querySelector('[role="img"] > div:nth-child(2)').getBoundingClientRect().top),
        /* THE THING THE OWNER RINGED: a filled block running from the standard
           to the right edge. Measured as a painted box inside the plot rather
           than as a class, because a rule that lost a cascade fight would look
           perfectly correct in the source. */
        shaded: Array.from(plot.children).filter(el => {
          const st = getComputedStyle(el);
          const bg = st.backgroundColor;
          return el.children.length === 0 && bg && bg !== 'rgba(0, 0, 0, 0)' &&
                 el.getBoundingClientRect().width > 40;
        }).length,
        marks: Array.from(plot.querySelectorAll('[data-pt-n]')).map(el => ({
          text: el.textContent.trim(), ink: getComputedStyle(el).color })),
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
    /* 4f-4j REVERSED IN PLACE (owner-reported 2 Sep 2026: "i do not understand
       this chart", off a screenshot with the shaded right-hand side ringed).
       The claim was never "a rule is drawn" -- it was that a reader can see
       where the boundary is. It is a line per side now, captioned under the
       axis, and nothing at all is shaded. */
    check('4f nothing is shaded — the block the owner ringed is gone',
      chart && chart.shaded === 0, chart && `${chart.shaded} filled box(es) behind the bars`);
    check('4g a boundary line is drawn and sits inside the plot',
      chart && chart.lines.length >= 1 &&
        chart.lines.every(L => L.x >= chart.plotBox.x - 1 && L.x <= chart.plotBox.x + chart.plotBox.w + 1),
      chart && `${chart.lines.length} line(s) at ${chart.lines.map(L => L.x).join(', ')} in ${chart.plotBox.x}..${chart.plotBox.x + chart.plotBox.w}`);
    check('4h the caption names the number and sits UNDER the axis',
      chart && chart.caps.length === chart.lines.length && chart.caps.length > 0 &&
        chart.caps.some(c => c.text.includes(String(d.standard))) &&
        chart.caps.every(c => c.top > chart.axisTop),
      chart && chart.caps.map(c => `"${c.text}" @${c.top} (axis ${chart.axisTop})`).join(' · '));
    check('4i and it is centred ON its own line, not hanging beside it',
      chart && chart.caps.length > 0 &&
        chart.caps.every((c, i) => Math.abs(c.mid - chart.lines[i].x) <= 6),
      chart && chart.caps.map((c, i) => `cap ${c.mid} vs line ${chart.lines[i] && chart.lines[i].x}`).join(' · '));
    /* A BAND PAST THE LINE IS MARKED, AND NEVER IN A SIDE'S OWN COLOUR — amber
       is already the money-going-out side on this chart. */
    const rubyMarks = chart ? chart.marks.filter(m => /rgb\(190, 18, 60\)|rgb\(251, 113, 133\)/.test(m.ink)) : [];
    check('4j a band past its side\'s line is marked, in neither side colour',
      rubyMarks.length > 0 && rubyMarks.every(m => Number(m.text) > 0),
      chart && chart.marks.map(m => `${m.text}:${m.ink}`).join(' '));

    /* ─── 5 · ONE TABLE, AND IT IS A DOOR ───
       REVERSED IN PLACE 2 Sep 2026 (owner-asked: "make this one scrollable
       table with only 'What is driving the gap'. It should have columns for
       contract number, value stream, and value as well"). The two cards became
       one table; what this section was always about — a row per contract, as
       visible pixels, in the reading's own order, and pressing one opens that
       contract — is unchanged and is asked of the table. */
    const tbl = await page.evaluate(() => {
      const card = Array.from(document.querySelectorAll('#ig-pt > section')).find(sec =>
        /driving the gap|driver gapet/i.test(sec.textContent || ''));
      if (!card) return { card:false, rows:[], heads:[] };
      const scroller = card.querySelector('[style*="max-height"]');
      const rows = Array.from(card.querySelectorAll('[data-pt-open]')).map(b => {
        const r = b.getBoundingClientRect();
        return { id:b.getAttribute('data-pt-open'), text:(b.textContent || '').replace(/\s+/g, ' ').trim(),
                 cells:Array.from(b.children).map(c => (c.textContent || '').trim()),
                 w:Math.round(r.width), h:Math.round(r.height) };
      });
      const headRow = card.querySelector('div[style*="grid-template-columns"]');
      return { card:true, rows,
        heads: headRow ? Array.from(headRow.children).map(c => (c.textContent || '').trim()) : [],
        headCols: headRow ? getComputedStyle(headRow).gridTemplateColumns : '',
        rowCols: rows.length ? getComputedStyle(card.querySelector('[data-pt-open]')).gridTemplateColumns : '',
        scrolls: !!scroller && getComputedStyle(scroller).overflowY === 'auto',
        maxH: scroller ? Math.round(parseFloat(getComputedStyle(scroller).maxHeight)) : 0,
        /* STICKY INSIDE THE SCROLLER, not a sibling above it: a sibling is not
           the same width the moment the scroller grows a scrollbar, and then
           the head and the rows stop lining up. */
        headSticky: !!(scroller && headRow && scroller.contains(headRow) &&
                       getComputedStyle(headRow).position === 'sticky'),
      };
    });
    check('5a one table, one row per counted contract', tbl.card && tbl.rows.length === d.custN + d.suppN,
      `${tbl.rows.length} rows · reading counts ${d.custN + d.suppN}`);
    check('5b the second card is gone, not stacked below it',
      tbl.card && !(await page.evaluate(() => /outside your standard/i.test(
        (document.getElementById('ig-pt') || {}).textContent || ''))),
      'one list');
    check('5c every row is visible pixels', tbl.rows.length > 0 && tbl.rows.every(r => r.w > 100 && r.h > 10),
      tbl.rows.map(r => `${r.w}x${r.h}`).join(' '));
    check('5d the drivers lead, in the reading\'s own order',
      JSON.stringify(tbl.rows.map(r => r.id).slice(0, d.drivers.length)) === JSON.stringify(d.drivers),
      `${tbl.rows.map(r => r.id).join(',')} · drivers ${d.drivers.join(',')}`);
    check('5e it has the three columns the owner asked for, and they are labelled',
      tbl.heads.length === 7 && /contract/i.test(tbl.heads[0]) &&
        /value stream/i.test(tbl.heads[2]) && /value/i.test(tbl.heads[6]),
      tbl.heads.join(' | '));
    check('5f the head row and the data rows share ONE column template',
      tbl.headCols && tbl.headCols === tbl.rowCols, `${tbl.headCols} vs ${tbl.rowCols}`);
    check('5g every row carries its reference, its stream and its value',
      tbl.rows.length > 0 && tbl.rows.every(r => /^MK-|^PT-/.test(r.cells[0]) && r.cells[2] && r.cells[6]),
      tbl.rows[0] && tbl.rows[0].cells.join(' | '));
    check('5h each row names its side in words',
      tbl.rows.every(r => /customer|supplier|kund|leverant/i.test(r.text)),
      tbl.rows[0] && tbl.rows[0].text.slice(0, 70));
    check('5i it scrolls inside its own card, and the head row stays put',
      tbl.scrolls && tbl.maxH > 100 && tbl.headSticky,
      `scrolls ${tbl.scrolls} · maxHeight ${tbl.maxH} · head sticky ${tbl.headSticky}`);

    const target = tbl.rows[0] && tbl.rows[0].id;
    await page.click(`#ig-pt [data-pt-open="${target}"]`);
    await page.waitForTimeout(1400);
    const landed = await page.evaluate(() => ({ view: state.view, id: state.activeId }));
    check('5j pressing a row opens that contract',
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

    await page.evaluate(() => { window.langSet('en'); });

    /* ─── 10 · THE GRAPH FILTERS THE TABLE (owner-asked 2 Sep 2026) ───
       *"make the page interactive so that when you click on the graphs they
       filter the table accordingly."* A bar that draws and filters nothing
       looks identical in the markup, so every press here is DRIVEN and the
       table is counted off the page afterwards. */
    await seedBook();
    await page.evaluate(() => { intel.tab = 'payterms'; intel.ptCut = { side:null, bucket:null }; setView('intel'); });
    await page.waitForTimeout(900);
    const rowsNow = () => page.evaluate(() =>
      Array.from(document.querySelectorAll('#ig-pt [data-pt-open]')).map(b => b.getAttribute('data-pt-open')));
    const bars = await page.evaluate(() => Array.from(document.querySelectorAll('[data-pt-bar]')).map(b => ({
      k:b.getAttribute('data-pt-bar'), off:b.disabled, tag:b.tagName })));
    const d3 = await reading();
    check('10a every bar is a real button, so it is reachable without a mouse',
      bars.length === 10 && bars.every(b => b.tag === 'BUTTON'), `${bars.length} bars`);
    check('10b an empty bar is disabled — a press that could only empty the table is dead',
      bars.filter(b => b.off).length > 0 &&
        bars.every(b => b.off === !d3.rows.some(r => r.side + '|' + r.bucket === b.k)),
      bars.map(b => `${b.k}${b.off ? '·off' : ''}`).join(' '));

    const live = bars.find(b => !b.off);
    /* GUARDED, not optimistic: on a build whose bars are not controls there is
       nothing to press, and a click on a selector that cannot match times the
       whole file out instead of failing the four claims it was written for. */
    if (!live) {
      ['10c pressing a bar really narrows the table',
       '10d the narrowing SAYS so and carries the way back',
       '10e pressing the same bar again clears it — the way back is on what was pressed',
       '10f the legend narrows to one side',
       '10g Show all puts the whole table back'].forEach(k => check(k, false, 'no pressable bar'));
    } else {
      const want = d3.rows.filter(r => r.side + '|' + r.bucket === live.k).map(r => r.id);
      await page.click(`[data-pt-bar="${live.k}"]`);
      await page.waitForTimeout(700);
      const after = await rowsNow();
      check('10c pressing a bar really narrows the table',
        JSON.stringify(after) === JSON.stringify(want) && after.length < d3.rows.length,
        `${after.join(',')} · wanted ${want.join(',')} (of ${d3.rows.length})`);
      const said = await page.evaluate(() => {
        const el = Array.from(document.querySelectorAll('#ig-pt *')).find(x =>
          /showing \d+ of \d+/i.test(x.textContent || '') && x.children.length === 0);
        return { text: el ? el.textContent.trim() : '', back: !!document.querySelector('[data-pt-clear]') };
      });
      check('10d the narrowing SAYS so and carries the way back', !!said.text && said.back,
        `"${said.text}" · clear ${said.back}`);

      await page.click(`[data-pt-bar="${live.k}"]`);
      await page.waitForTimeout(700);
      check('10e pressing the same bar again clears it — the way back is on what was pressed',
        (await rowsNow()).length === d3.rows.length, `${(await rowsNow()).length} of ${d3.rows.length}`);

      const sideBtn = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('[data-pt-side]')).find(x => !x.disabled);
        return b ? b.getAttribute('data-pt-side') : null;
      });
      if (sideBtn) {
        await page.click(`[data-pt-side="${sideBtn}"]`);
        await page.waitForTimeout(700);
        const bySide = await rowsNow();
        check('10f the legend narrows to one side',
          JSON.stringify(bySide) === JSON.stringify(d3.rows.filter(r => r.side === sideBtn).map(r => r.id)),
          `${sideBtn}: ${bySide.join(',')}`);
        await page.click('[data-pt-clear]');
        await page.waitForTimeout(700);
        check('10g Show all puts the whole table back',
          (await rowsNow()).length === d3.rows.length, `${(await rowsNow()).length} of ${d3.rows.length}`);
      } else {
        check('10f the legend narrows to one side', false, 'no live legend chip');
        check('10g Show all puts the whole table back', false, 'no live legend chip');
      }
    }

    check('10h no page errors through the presses', errors.length === 0, errors.join(' | ') || 'clean');

    /* ─── 11 · TWO TARGETS, ONE PER SIDE (owner-ruled 2 Sep 2026) ───
       Typed into the real panel, saved through the real route, and the tab has
       to follow — the setting and the page reading the same number is the
       whole of what was asked for. */
    await seedBook();
    await page.evaluate(() => { setView('team'); });
    await page.waitForTimeout(1200);
    await page.evaluate(() => { if (window.settingsGoTab) settingsGoTab('platform'); });
    await page.waitForTimeout(700);
    const rowThere = await page.evaluate(() => !!document.querySelector('.st-row[data-st-panel="paydays"]'));
    check('11a the targets have a row on Settings', rowThere, rowThere ? 'drawn' : 'missing');
    if (rowThere) {
      await page.click('.st-row[data-st-panel="paydays"]');
      await page.waitForTimeout(700);
      const boxes = await page.evaluate(() => {
        const a = document.getElementById('st-pay-in'), b = document.getElementById('st-pay-out');
        const vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 20 && r.height > 10; };
        return { in: vis(a), out: vis(b), save: vis(document.getElementById('st-pay-save')) };
      });
      check('11b the drawer holds a box per side and a save', boxes.in && boxes.out && boxes.save,
        JSON.stringify(boxes));
      /* A REFUSAL FIRST: a number the reading would hand back as null must not
         be stored looking answered. */
      await page.fill('#st-pay-in', '900');
      await page.click('#st-pay-save');
      await page.waitForTimeout(500);
      const refused = await page.evaluate(() => ({
        said: !!Array.from(document.querySelectorAll('#st-drawer *')).find(el =>
          /1 to 365|1 till 365/.test(el.textContent || '')),
        stored: ((state.settings || {}).payTargets || {}).customer,
      }));
      check('11c an impossible target is refused in the drawer and not stored',
        refused.said && refused.stored == null, `said=${refused.said} stored=${refused.stored}`);
      await page.fill('#st-pay-in', '30');
      await page.fill('#st-pay-out', '75');
      await page.click('#st-pay-save');
      await page.waitForTimeout(1400);
      const saved = await page.evaluate(() => ({
        t: Object.assign({}, payTargets()),
        row: (document.querySelector('.st-row[data-st-panel="paydays"] .st-row-state') || {}).textContent || '',
      }));
      check('11d the pair is stored and each side reads its own',
        saved.t.customer === 30 && saved.t.supplier === 75, JSON.stringify(saved.t));
      check('11e the row behind the drawer states it without being opened',
        /30/.test(saved.row) && /75/.test(saved.row), saved.row.trim());

      await page.evaluate(() => { intel.tab = 'payterms'; setView('intel'); });
      await page.waitForTimeout(1100);
      const two = await page.evaluate(() => {
        const x = payTermsData();
        const root = document.getElementById('ig-pt');
        const plot = root && root.querySelector('[role="img"] > div');
        const lines = plot ? Array.from(plot.querySelectorAll('span')).filter(el =>
          getComputedStyle(el).borderLeftStyle === 'dashed').map(el => ({
            x: Math.round(el.getBoundingClientRect().left), ink: getComputedStyle(el).borderLeftColor })) : [];
        const caps = root ? Array.from(root.querySelectorAll('[role="img"] > div:nth-child(n+3) > span'))
          .map(el => el.textContent.trim()) : [];
        return { lines, caps, cs: x.customer.standard, ss: x.supplier.standard, drivers: x.drivers.length };
      });
      check('11f the tab measures each side against its own target',
        two.cs === 30 && two.ss === 75, `coming in ${two.cs}, going out ${two.ss}`);
      check('11g so the chart draws TWO boundaries, in the two side colours',
        two.lines.length === 2 && two.lines[0].ink !== two.lines[1].ink && two.lines[0].x !== two.lines[1].x,
        two.lines.map(L => `${L.x}:${L.ink}`).join(' · '));
      check('11h and each caption names its own side and number',
        two.caps.length === 2 && two.caps.join(' ').includes('30') && two.caps.join(' ').includes('75'),
        two.caps.join(' · '));
      /* SHUT THE DRAWER FIRST. A screenshot of the tab with the settings panel
         still over half of it documents nothing. */
      await page.evaluate(() => { if (window.stDrawerClose) stDrawerClose(); });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(OUT, '04-two-targets.png'), fullPage: true });
    } else {
      ['11b','11c','11d','11e','11f','11g','11h'].forEach(k => check(k + ' (skipped)', false, 'no panel row'));
    }

    /* ─── 12 · PAYMENT TERMS AS A GRAPH LENS (owner-asked 2 Sep 2026) ───
       "add the payment terms to the Group by in the contract graph." The option
       has to be on the control AND the graph has to regroup when it is chosen —
       an option that draws and regroups nothing looks identical in the markup. */
    await page.evaluate(() => { intel.tab = 'map'; setView('intel'); });
    await page.waitForTimeout(1600);
    const opt = await page.evaluate(() => {
      const sel = document.getElementById('ig-group');
      return sel ? Array.from(sel.options).map(o => ({ v:o.value, t:o.textContent.trim() })) : null;
    });
    check('12a payment terms is on the Group by control',
      opt && opt.some(o => o.v === 'payterms' && /payment/i.test(o.t)),
      opt ? opt.map(o => o.v).join(',') : 'no control');
    if (opt && opt.some(o => o.v === 'payterms')) {
      await page.selectOption('#ig-group', 'payterms');
      await page.waitForTimeout(1400);
      const grouped = await page.evaluate(() => {
        const labels = state.contracts.map(c => groupLabelOf(c, intel.groupBy, intel.groups));
        return { by: intel.groupBy, uniq: Array.from(new Set(labels)),
                 note: (document.getElementById('ig-note') || document.body).textContent || '' };
      });
      check('12b choosing it really regroups the graph', grouped.by === 'payterms', grouped.by);
      check('12c the groups are the payment terms bands, and an unread contract is its own',
        grouped.uniq.some(l => /days$/.test(l)) && grouped.uniq.includes('No payment terms'),
        grouped.uniq.join(' | '));
      check('12d the page says what it is grouped by', /payment terms/i.test(grouped.note),
        grouped.note.replace(/\s+/g, ' ').slice(0, 80));
      await page.screenshot({ path: path.join(OUT, '05-group-by-terms.png'), fullPage: true });
    } else {
      ['12b','12c','12d'].forEach(k => check(k + ' (skipped)', false, 'option absent'));
    }

    /* ─── 13 · PAYMENT TERMS IS A FILTER ON CONTRACTS (owner-ruled 2 Sep 2026) ───
       The tab answers "what is it costing us"; the filter answers "which
       contracts", and "not recorded" is the worklist that gets the rest of the
       book read. It lives behind Adapt filters, so it has to be turned on
       before it draws — and it must draw on its own the moment it is
       narrowing, which is this catalogue's own safety property. */
    await seedBook();
    await page.evaluate(() => { window.langSet('en'); setView('register'); });
    await page.waitForTimeout(1200);
    const offBar = await page.evaluate(() => !document.getElementById('reg-payterms'));
    check('13a it is NOT on the bar by default — the row still fits one line', offBar,
      offBar ? 'behind Adapt filters' : 'drawn unasked');
    const inCat = await page.evaluate(() => {
      const b = document.getElementById('reg-adapt');
      if (!b) return null;
      b.click();
      const box = Array.from(document.querySelectorAll('#modal-root input[type="checkbox"]'))
        .map(i => ({ v:i.value || (i.getAttribute('data-f') || ''), t:(i.closest('label') || {}).textContent || '' }));
      return box;
    });
    check('13b it is offered in Adapt filters',
      Array.isArray(inCat) && inCat.some(x => /payment terms/i.test(x.t)),
      Array.isArray(inCat) ? inCat.map(x => x.t.trim()).join(' | ').slice(0, 120) : 'no dialog');
    await page.evaluate(() => { const m = document.getElementById('modal-root'); if (m) m.innerHTML = ''; });

    /* THE SAFETY PROPERTY: turned on from the model, it must appear on the bar
       by itself rather than narrowing the book from behind a closed dialog. */
    await page.evaluate(() => { regState().payterms = 'none'; regRepaint(); });
    await page.waitForTimeout(900);
    const narrowed = await page.evaluate(() => ({
      drawn: !!document.getElementById('reg-payterms'),
      value: (document.getElementById('reg-payterms') || {}).value,
      shown: document.querySelectorAll('tr[data-row]').length,
      want: regFiltered().length,
      noTerms: state.contracts.filter(c => c.status !== 'Declined' && !c.archived &&
        (typeof payDays === 'function') && payDays(c) == null).length,
    }));
    check('13c a filter that is narrowing draws itself — it can never be quietly on',
      narrowed.drawn && narrowed.value === 'none', `drawn ${narrowed.drawn} · ${narrowed.value}`);
    check('13d "not recorded" really narrows the register',
      narrowed.want > 0 && narrowed.want < narrowed.noTerms + 1 && narrowed.shown === narrowed.want,
      `${narrowed.shown} rows on screen · reading says ${narrowed.want} · unread ${narrowed.noTerms}`);

    const band = await page.evaluate(() => {
      const first = state.contracts.map(c => (typeof payDays === 'function') ? payDays(c) : null).find(d => d != null);
      if (first == null) return null;
      const k = payBucketOf(first);
      regState().payterms = k; regRepaint();
      return { k, want: regFiltered().length };
    });
    await page.waitForTimeout(800);
    if (band) {
      const got = await page.evaluate(() => ({
        rows: document.querySelectorAll('tr[data-row]').length,
        every: regFiltered().every(c => payBucketOf(payDays(c)) === regState().payterms),
      }));
      check('13e a band narrows to exactly that band', got.rows === band.want && got.every,
        `${band.k}: ${got.rows} rows, all in band ${got.every}`);
    } else {
      check('13e a band narrows to exactly that band', false, 'no contract carries terms');
    }
    await page.evaluate(() => { const b = document.getElementById('reg-clear-filters'); if (b) b.click(); });
    await page.waitForTimeout(800);
    const cleared = await page.evaluate(() => ({ v: regState().payterms, gone: !document.getElementById('reg-payterms') }));
    check('13f Clear puts it back and the control stands down again',
      cleared.v === 'all' && cleared.gone, `${cleared.v} · off the bar ${cleared.gone}`);
    await page.screenshot({ path: path.join(OUT, '06-contracts-filter.png'), fullPage: true });

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
