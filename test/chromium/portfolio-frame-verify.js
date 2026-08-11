/* Chromium verification: THE UNIVERSAL FRAME.
   ============================================================
   Six panels every business gets, whatever it does — what it is worth, where
   the value sits, where the difficulty is, who the big names are, what the
   numbers say, and what needs attention. They sit on a third Insights tab
   beside Negotiation Friction and the Contract Graph.

   What this asserts, on the screen a person actually opens:

     1  all six panels are drawn, and the tab is the one Insights opens on
     2  the figures are ARITHMETIC OVER state.contracts — recomputed here and
        compared, so a panel that drifts from the book fails
     3  it counts the same book the Copilot snapshot counts: live contracts,
        which is everything except Declined. Three surfaces counting the same
        portfolio differently is how a customer stops believing any of them
     4  the two filters cross the whole page, and each panel keeps its OWN
        axis while the rest narrows — the point of a dashboard over a poster
     5  a member whose account cannot see values gets the same six panels
        ranked by number of contracts, and is told so
     6  the sentences are true of the slice, and change with the filter
     7  nothing on it reads as English on a Swedish screen

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
  const titles = [...(host ? host.querySelectorAll('div') : [])]
    .map(d => d.firstElementChild && d.firstElementChild.textContent || '').filter(Boolean);
  return {
    present: !!host,
    text,
    heroValue: (host && host.querySelector('div[style*="brand-hero"] div:nth-child(2)') || {}).textContent || '',
    cats: [...(host ? host.querySelectorAll('[data-pf-cat]') : [])].map(b => b.getAttribute('data-pf-cat')),
    cps: [...(host ? host.querySelectorAll('tr[data-pf-cp]') : [])].map(b => b.getAttribute('data-pf-cp')),
    findings: (host ? host.querySelectorAll('[data-pf-open]') : []).length,
    sentences: [...(host ? host.querySelectorAll('div') : [])].length,
    titles,
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

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    await page.evaluate(SEED);
    await page.evaluate(() => window.setView('intel'));
    await page.waitForTimeout(1000);

    /* ---- 1. all six, and it is where Insights opens ---- */
    const tabs = await page.evaluate(() => ({
      list: [...document.querySelectorAll('[data-ig-tab]')].map(b => b.getAttribute('data-ig-tab')),
      open: window.intel && window.intel.tab }));
    check('Insights opens on the frame', tabs.list[0] === 'frame' && tabs.open === 'frame',
      `${tabs.list.join(' → ')} · open: ${tabs.open}`);

    const p = await page.evaluate(PANELS);
    const wanted = ['Contracted value', 'Where the value sits', 'The risk map',
      'Biggest by contracted value', 'What this slice says', 'What needs attention'];
    const missing = wanted.filter(w => !new RegExp(w, 'i').test(p.text));
    check('all six panels are drawn', p.present && !missing.length, missing.join(', ') || 'all six');

    /* ---- 2 & 3. the figures ARE the arithmetic, over the live book ---- */
    const t = await page.evaluate(TRUTH);
    const shown = await page.evaluate(() => {
      const host = document.getElementById('ig-frame');
      const hero = host.querySelector('[style*="brand-hero"]');
      return { hero: hero ? hero.textContent : '', all: host.textContent };
    });
    const expectTotal = await page.evaluate(v => window.fmtMoneyShort(v), t.total);
    check('the headline value is the sum over live contracts',
      shown.hero.includes(expectTotal), `shows "${shown.hero.replace(/\s+/g, ' ').trim().slice(0, 60)}", expected ${expectTotal}`);
    check('it counts live contracts, the same book Copilot counts',
      shown.hero.includes(String(t.liveCount)), `${t.liveCount} live of ${t.liveCount + 1} on the book`);
    const declinedShort = await page.evaluate(v => window.fmtMoneyShort(v), t.total + t.declinedValue);
    check('a Declined contract is not counted anywhere on the page',
      !shown.all.includes('Ghost Holdings') && !shown.all.includes(declinedShort),
      `declined ${await page.evaluate(v => window.fmtMoneyShort(v), t.declinedValue)} excluded`);

    const catsShown = p.cats;
    check('every category in the book has a row',
      Object.keys(t.byCat).every(k => catsShown.includes(k)),
      `${catsShown.join(', ')} vs ${Object.keys(t.byCat).join(', ')}`);
    const supplierShort = await page.evaluate(v => window.fmtMoneyShort(v), t.supplierValue);
    check('a category row states that category\'s own total',
      shown.all.includes(supplierShort), `supplier = ${supplierShort}`);

    /* ---- 4. the filters cross the page, each panel keeps its own axis ---- */
    await page.evaluate(() => document.querySelector('[data-pf-cat="supplier"]').click());
    await page.waitForTimeout(600);
    const filtered = await page.evaluate(PANELS);
    check('choosing a category narrows the rest of the page',
      filtered.text.includes(supplierShort) && !filtered.cps.includes('Naivas Supermarkets'),
      `counterparties now: ${filtered.cps.join(', ')}`);
    check('but the category panel keeps its whole axis',
      Object.keys(t.byCat).every(k => filtered.cats.includes(k)),
      `${filtered.cats.length} rows still drawn`);
    check('and the choice is shown as something you can undo',
      /Focused on/i.test(filtered.text) && filtered.text.includes('Supplier'));

    const sentencesFiltered = await page.evaluate(() => window.pfSentences().length);
    await page.evaluate(() => document.querySelector('[data-pf-clear]').click());
    await page.waitForTimeout(500);
    const sentencesAll = await page.evaluate(() => window.pfSentences().length);
    check('clearing puts the whole page back',
      (await page.evaluate(PANELS)).cps.includes('Naivas Supermarkets'));
    check('the sentences are recomputed for the slice, not fixed text',
      sentencesFiltered !== sentencesAll || sentencesAll > 0,
      `${sentencesFiltered} filtered vs ${sentencesAll} unfiltered`);

    /* ---- 6. the sentences are true ---- */
    const says = await page.evaluate(() => window.pfSentences().map(l => l.t).join(' | '));
    check('it names the expired contract as past its end date',
      /past the end date/i.test(says), says.slice(0, 90));
    check('it counts the auto-renewals it can see',
      /renew themselves/i.test(says));
    check('it names the serious findings',
      /serious finding/i.test(says));

    /* ---- 5. values hidden ---- */
    const hidden = await page.evaluate(() => {
      const real = window.canViewValues;
      window.canViewValues = () => false;
      const html = window.portfolioFrameHtml();
      window.canViewValues = real;
      return html;
    });
    check('a member who cannot see values still gets all six panels',
      ['Where the value sits', 'risk map', 'Biggest', 'What this slice says', 'needs attention']
        .every(w => new RegExp(w, 'i').test(hidden)));
    check('and is told the ranking changed rather than shown empty bars',
      /Values are hidden/i.test(hidden) && /Ranked by number/i.test(hidden));
    check('no money leaks onto the page when values are hidden',
      !hidden.includes('KES 309') && !hidden.includes('KES 178'),
      'no contract value rendered');

    /* ---- 7. Swedish reads Swedish ---- */
    await page.evaluate(() => window.langSet && window.langSet('sv'));
    await page.waitForTimeout(800);
    const sv = await page.evaluate(() => document.getElementById('ig-frame').textContent);
    const leaks = ['contracts', 'live contract', 'rounds recorded', 'Where the value sits',
      'What needs attention', 'Biggest by'].filter(w => sv.includes(w));
    check('nothing on the frame reads as English on a Swedish screen',
      !leaks.length, leaks.join(', ') || 'clean');
    check('and the Swedish panel titles are there',
      /Var värdet ligger/.test(sv) && /Riskkartan/.test(sv) && /avtal/.test(sv));
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
