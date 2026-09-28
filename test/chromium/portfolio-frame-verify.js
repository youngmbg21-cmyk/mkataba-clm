/* Chromium verification: INSIGHTS → PORTFOLIO, THE OVERVIEW.
   ============================================================
   RE-POINTED IN PLACE 28 Sep 2026 to the owner's ruling. Young picked the
   "Overview" design by name and asked to "kill the bottom 3 cards": What this
   slice says, What needs attention and the grey note under them are gone, and
   the page is headline figures, then one card per question, each opening with
   its answer. This file used to pin "all six panels" (Biggest had already gone
   on 19 Sep, which is why it sat on KNOWN_RED); it pins the Overview now, and
   every half that did not depend on the removed cards is kept as it was.

   What this asserts, on the screen a person actually opens:

     1  the Overview's cards are drawn and the three removed ones are not, and
        the tab is the one Insights opens on
     2  the figures are ARITHMETIC OVER state.contracts — recomputed here and
        compared, so a card that drifts from the book fails
     3  it counts the same book the Copilot snapshot counts: live contracts,
        which is everything except Declined
     4  the filters cross the whole page, and each card keeps its OWN axis
        while the rest narrows — the category, and the stage (new)
     5  a member whose account cannot see values gets the same cards ranked by
        number of contracts, and is told so
     6  the headline figures are DOORS onto exactly the contracts that make
        them, and "past its end date" is one of them; a month on the runway is
        a door too
     7  the risk map is coloured by what Copilot found, hollow where unread,
        and drawn at its card's own width
     8  nothing on it reads as English on a Swedish screen

   Run: node test/chromium/portfolio-frame-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* A book with enough shape to exercise every panel: categories, findings,
   negotiation rounds, an expired term, an auto-renewal, and one Declined
   contract that must NOT be counted. */
const SEED = () => {
  const cats = { 'MK-A1': 'supplier', 'MK-A2': 'supplier', 'MK-B1': 'customer', 'MK-B2': 'customer' };
  state.contracts.forEach((c, i) => {
    if (cats[c.id]) c.metadata = Object.assign({}, c.metadata, { category: cats[c.id] });
    c.rounds = Array.from({ length: [3, 1, 0, 2][i % 4] }, (_, n) => ({ n: n + 1, status: 'closed' }));
  });
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const f = (id, title, sev) => ({ id, title, sev });
  const add = (id, name, cp, value, status, category, rounds, expDays, scan, renewal) => {
    state.contracts.push({ id, name, counterparty: cp, folder: 'proc', value, status,
      expiry: day(expDays), rounds: Array.from({ length: rounds }, (_, n) => ({ n: n + 1, status: 'closed' })),
      metadata: { category, expiryDate: day(expDays), renewalType: renewal || 'fixed' },
      audit: [], changes: [], scan });
  };
  add('MK-C1', 'Industrial Area warehouse', 'Kilifi Properties', 18000000, 'Signed', 'lease', 1, 45,
    { findings: [f('x1', 'Rent may be revised with no ceiling', 'high'), f('x2', 'No break option', 'med')], dismissed: [] });
  add('MK-C2', 'Cold chain haulage', 'Rift Valley Logistics', 24600000, 'Signed', 'supplier', 4, 20,
    { findings: [f('x3', 'Liability is uncapped', 'high')], dismissed: [] }, 'auto-renew');
  add('MK-C3', 'Depot cleaning', 'Bidco Services', 2400000, 'Signed', 'supplier', 1, -30, { findings: [], dismissed: [] });
  add('MK-C4', 'HR software licence', 'Juris HR Suite', 1800000, 'Signed', 'licence', 2, 200,
    { findings: [f('x4', 'Renews itself with 90 days notice', 'med')], dismissed: [] }, 'auto-renew');
  /* Declined: on the book, but not live. Nothing in the frame may count it. */
  add('MK-C9', 'Abandoned depot deal', 'Ghost Holdings', 99000000, 'Declined', 'supplier', 1, 300, null);
  return { total: state.contracts.length };
};

/* The same figures, worked out independently in the page, to compare against
   what the panels drew. */
const TRUTH = () => {
  const live = state.contracts.filter(c => c.status !== 'Declined');
  const val = c => Number(c.value || 0);
  const cat = c => (c.metadata && c.metadata.category) || '';
  const per = {};
  live.forEach(c => { per[cat(c)] = (per[cat(c)] || 0) + val(c); });
  return {
    liveCount: live.length,
    total: live.reduce((a, c) => a + val(c), 0),
    declinedValue: state.contracts.filter(c => c.status === 'Declined').reduce((a, c) => a + val(c), 0),
    byCat: per,
    supplier: live.filter(c => cat(c) === 'supplier').length,
    supplierValue: live.filter(c => cat(c) === 'supplier').reduce((a, c) => a + val(c), 0),
    findings: live.reduce((a, c) => a + ((c.scan && typeof openFindings === 'function') ? openFindings(c).length : 0), 0),
  };
};

const PANELS = () => {
  const host = document.getElementById('ig-frame');
  const text = host ? host.textContent : '';
  return {
    present: !!host,
    text,
    cats: [...(host ? host.querySelectorAll('[data-pf-cat]') : [])].map(b => b.getAttribute('data-pf-cat')),
    stages: [...(host ? host.querySelectorAll('[data-pf-stage]') : [])].map(b => b.getAttribute('data-pf-stage')),
    cps: [...new Set([...(host ? host.querySelectorAll('g[data-pf-cp]') : [])].map(b => b.getAttribute('data-pf-cp')))],
    doors: [...(host ? host.querySelectorAll('[data-pf-go]') : [])].map(b => b.getAttribute('data-pf-go')),
  };
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const openFrame = async () => {
    await page.evaluate(() => { if (window.intel) intel.tab = 'frame'; window.setView('intel'); });
    await page.waitForTimeout(900);
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    await page.evaluate(SEED);
    /* The standing shape draws the renewal runway; a workspace's shape is a
       company setting, so the stage states it rather than inheriting one. */
    await page.evaluate(() => { if (window.wsSet) wsSet(['standing'], 'job'); window.setView('intel'); });
    await page.waitForTimeout(1000);

    /* ---- 1. the Overview, and it is where Insights opens ---- */
    const tabs = await page.evaluate(() => ({
      list: [...document.querySelectorAll('[data-ig-tab]')].map(b => b.getAttribute('data-ig-tab')),
      open: window.intel && window.intel.tab }));
    check('Insights opens on the Portfolio frame', tabs.list[0] === 'frame' && tabs.open === 'frame',
      `${tabs.list.join(' → ')} · open: ${tabs.open}`);

    const p = await page.evaluate(PANELS);
    const wanted = ['Contracted value', 'The renewal runway', 'Where the value sits', 'Value by stage', 'The risk map'];
    const missing = wanted.filter(w => !new RegExp(w, 'i').test(p.text));
    check('1 the Overview\'s cards are drawn', p.present && !missing.length, missing.join(', ') || wanted.join(' · '));
    const gone = ['What this slice says', 'What needs attention', 'Biggest by contracted value',
      'Every figure on this page is arithmetic'].filter(w => p.text.includes(w));
    check('1 and the three bottom cards are gone, the grey note with them', !gone.length, gone.join(', ') || 'none drawn');

    /* ---- 2 & 3. the figures ARE the arithmetic, over the live book ---- */
    const t = await page.evaluate(TRUTH);
    const shown = await page.evaluate(() => {
      const host = document.getElementById('ig-frame');
      const hero = host.querySelector('[style*="brand-hero"]');
      return { hero: hero ? hero.textContent : '', all: host.textContent };
    });
    const expectTotal = await page.evaluate(v => window.fmtMoneyShort(v), t.total);
    check('2 the headline value is the sum over live contracts',
      shown.hero.includes(expectTotal), `shows "${shown.hero.replace(/\s+/g, ' ').trim().slice(0, 60)}", expected ${expectTotal}`);
    check('3 it counts live contracts, the same book Copilot counts',
      shown.hero.includes(String(t.liveCount)), `${t.liveCount} live of ${t.liveCount + 1} on the book`);
    const declinedShort = await page.evaluate(v => window.fmtMoneyShort(v), t.total + t.declinedValue);
    check('3 a Declined contract is not counted anywhere on the page',
      !shown.all.includes('Ghost Holdings') && !shown.all.includes(declinedShort),
      `declined ${await page.evaluate(v => window.fmtMoneyShort(v), t.declinedValue)} excluded`);

    check('2 every category in the book has a row',
      Object.keys(t.byCat).every(k => p.cats.includes(k)),
      `${p.cats.join(', ')} vs ${Object.keys(t.byCat).join(', ')}`);
    const supplierShort = await page.evaluate(v => window.fmtMoneyShort(v), t.supplierValue);
    check('2 a category row states that category\'s own total',
      shown.all.includes(supplierShort), `supplier = ${supplierShort}`);

    /* ---- 4. the filters cross the page, each card keeps its own axis ---- */
    await page.evaluate(() => document.querySelector('[data-pf-cat="supplier"]').click());
    await page.waitForTimeout(600);
    const filtered = await page.evaluate(PANELS);
    check('4 choosing a category narrows the rest of the page',
      filtered.text.includes(supplierShort) && !filtered.cps.includes('Kilifi Properties'),
      `counterparties on the map now: ${filtered.cps.join(', ')}`);
    check('4 but the category card keeps its whole axis',
      Object.keys(t.byCat).every(k => filtered.cats.includes(k)), `${filtered.cats.length} rows still drawn`);
    check('4 and the choice is shown as something you can undo',
      /Focused on/i.test(filtered.text) && filtered.text.includes('Supplier'));
    await page.evaluate(() => document.querySelector('[data-pf-clear]').click());
    await page.waitForTimeout(500);
    check('4 clearing puts the whole page back',
      (await page.evaluate(PANELS)).cps.includes('Kilifi Properties'));

    /* THE STAGE IS A THIRD FILTER (new with the Overview). */
    const stagesBefore = (await page.evaluate(PANELS)).stages;
    /* GUARDED: a build without the stage filter REPORTS rather than throws. */
    await page.evaluate(() => { const b = document.querySelector('[data-pf-stage="Signed"]'); if (b) b.click(); });
    await page.waitForTimeout(600);
    const byStage = await page.evaluate(() => ({ rows: window.pfRows(null).map(c => c.status),
      chip: !!document.querySelector('[data-pf-unfilter="stage"]'),
      stages: [...document.querySelectorAll('[data-pf-stage]')].map(b => b.getAttribute('data-pf-stage')) }));
    check('4 pressing a stage narrows the page to that stage',
      byStage.rows.length > 0 && byStage.rows.every(s => s === 'Signed') && byStage.chip,
      `${byStage.rows.length} rows, chip ${byStage.chip}`);
    check('4 and Value by stage keeps its whole axis',
      stagesBefore.length > 1 && byStage.stages.join('|') === stagesBefore.join('|'), byStage.stages.join(' · '));
    if (byStage.chip) await page.evaluate(() => document.querySelector('[data-pf-unfilter="stage"]').click());
    await page.waitForTimeout(500);

    /* ---- 5. values hidden ---- */
    const hidden = await page.evaluate(() => {
      const real = window.canViewValues;
      window.canViewValues = () => false;
      const html = window.portfolioFrameHtml();
      window.canViewValues = real;
      return html;
    });
    check('5 a member who cannot see values still gets the same cards',
      ['Where the value sits', 'Value by stage', 'risk map'].every(w => new RegExp(w, 'i').test(hidden)));
    check('5 and is told the ranking changed rather than shown empty bars',
      /Values are hidden/i.test(hidden) && /Ranked by number/i.test(hidden));
    check('5 no money leaks onto the page when values are hidden',
      !/KES \d/.test(hidden), 'no contract value rendered');

    /* ---- 6. every figure is a door onto the list that makes it ---- */
    await openFrame();
    const d6 = await page.evaluate(() => ({ doors: [...document.querySelectorAll('[data-pf-go]')].map(b => b.getAttribute('data-pf-go')),
      past: window.pfHeadlineData ? window.pfHeadlineData().past.ids.slice() : [],
      pastText: (document.querySelector('[data-pf-go="past"]') || {}).textContent || '' }));
    check('6 the headline figures are doors — the book, ends within 90 days, renews itself, past its end date',
      ['book', 'soon', 'auto', 'past'].every(k => d6.doors.includes(k)), d6.doors.join(', ') || 'no doors');
    check('6 past its end date is the saved fact, and counts the expired contract',
      /Past its end date/.test(d6.pastText) && d6.past.includes('MK-C3'), d6.past.join(', ') || 'none');
    if (d6.doors.includes('past')) {
      await page.evaluate(() => document.querySelector('[data-pf-go="past"]').click());
      await page.waitForTimeout(900);
      const landed = await page.evaluate(() => ({ view: state.view,
        only: (regState().only && regState().only.ids) ? regState().only.ids.slice() : [] }));
      check('6 pressing it opens Contracts narrowed to EXACTLY those contracts',
        landed.view === 'register' && landed.only.join('|') === d6.past.join('|'), JSON.stringify(landed));
      await page.evaluate(() => { regState().only = null; });
      await openFrame();
    } else check('6 pressing it opens Contracts narrowed to EXACTLY those contracts', false, 'no door to press');
    const month = await page.evaluate(() => {
      const b = document.querySelector('[data-pf-go^="m"]'); if (!b) return null;
      const k = b.getAttribute('data-pf-go');
      const d = window.pfRenewalRunwayData({ ids: true });
      return { k, ids: (d.buckets[+k.slice(1)].ids || []).slice(), empty: document.querySelectorAll('.pf-col:not(button)').length };
    });
    check('6 a month on the runway with contracts in it is a door, an empty month is not',
      !!month && month.ids.length > 0 && month.empty > 0,
      month ? `${month.k}: ${month.ids.length}, ${month.empty} empty months drawn flat` : 'no month door');
    if (month) {
      await page.evaluate(k => document.querySelector(`[data-pf-go="${k}"]`).click(), month.k);
      await page.waitForTimeout(900);
      const got = await page.evaluate(() => (regState().only && regState().only.ids) ? regState().only.ids.slice() : []);
      check('6 and pressing the month lands on exactly its contracts', got.join('|') === month.ids.join('|'), got.join(', '));
      await page.evaluate(() => { regState().only = null; });
      await openFrame();
    }

    /* ---- 7. the risk map is coloured by what Copilot found ---- */
    const map = await page.evaluate(() => {
      const plot = document.getElementById('pf-risk-plot');
      const svg = plot && plot.querySelector('svg');
      const dot = cp => { const g = plot && plot.querySelector(`g[data-pf-cp="${cp}"] circle`);
        return g ? { fill: g.getAttribute('fill'), stroke: g.getAttribute('stroke') } : null; };
      const card = plot && plot.closest('.pf-card');
      return { w: plot ? plot.clientWidth : 0, drawn: svg ? +svg.getAttribute('data-w') : 0,
        high: dot('Kilifi Properties'), none: dot('Bidco Services'),
        hollow: plot ? [...plot.querySelectorAll('g[data-pf-cp] circle')].filter(c => c.getAttribute('fill') === 'var(--color-surface)').length : -1,
        say: ((card && card.querySelector('.pf-say')) || {}).textContent || '' };
    });
    check('7 a contract with a high finding open is ruby', !!map.high && map.high.fill === 'var(--st-ruby-dot)', JSON.stringify(map.high));
    check('7 one read with nothing open is green', !!map.none && map.none.fill === 'var(--st-green-dot)', JSON.stringify(map.none));
    check('7 a contract not read yet is hollow, not green', map.hollow > 0, `${map.hollow} hollow`);
    check('7 the card opens with its answer', /carr(y|ies) a high finding/.test(map.say), map.say.trim() || '(no answer line)');
    check('7 the map is drawn at its card\'s own width', map.w > 200 && Math.abs(map.w - map.drawn) <= 8,
      `card ${map.w}px · drawn ${map.drawn}px`);

    /* ---- 8. Swedish reads Swedish ---- */
    await page.evaluate(() => window.langSet && window.langSet('sv'));
    await page.waitForTimeout(800);
    await openFrame();
    const sv = await page.evaluate(() => document.getElementById('ig-frame').textContent);
    const leaks = ['contracts', 'live contract', 'Where the value sits', 'Value by stage',
      'Past its end date', 'negotiation rounds', 'Not read yet'].filter(w => sv.includes(w));
    check('8 nothing on the frame reads as English on a Swedish screen', !leaks.length, leaks.join(', ') || 'clean');
    check('8 and the Swedish card titles are there',
      /Var värdet ligger/.test(sv) && /Riskkartan/.test(sv) && /Värde per skede/.test(sv) && /avtal/.test(sv));
    await page.evaluate(() => window.langSet && window.langSet('en'));

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
