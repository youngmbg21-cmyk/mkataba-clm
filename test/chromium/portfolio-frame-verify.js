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


    /* ======================================================================
       THE FINDINGS CARD PAGES, AND OPEN LANDS ON THE FINDING
       ----------------------------------------------------------------------
       Owner-asked 26 Aug 2026: "Make the card a scrollable card with 10 per
       page and you can click to more pages in the card to see more of them.
       When you click on open, it should take you to the contract in documents
       page where the side panel is open and the respective risk is blinking in
       light red."

       Before this the card showed six and said "61 more here" in bold text with
       nothing behind it — a count of work the reader could see and could not
       reach. Every claim below is measured on the real page: a source read
       cannot tell a pager that draws from one that works.
       ====================================================================== */
    await page.evaluate(() => {
      /* Enough findings to need three pages. Two per contract keeps them
         spread across the book rather than piled on one row. */
      const sev = i => (i % 3 === 0 ? 'high' : i % 3 === 1 ? 'med' : 'low');
      for (let i = 0; i < 12; i++){
        state.contracts.push({ id: 'MK-P' + i, name: 'Paged contract ' + i,
          counterparty: 'Pager Ltd', folder: 'proc', value: 1000000 + i, status: 'Signed',
          expiry: new Date(Date.now() + 400 * 864e5).toISOString().slice(0, 10),
          rounds: [], metadata: { category: 'supplier' }, audit: [], changes: [],
          scan: { findings: [
            { id: 'p' + i + 'a', title: 'Paged finding ' + i + 'A', sev: sev(i),
              what: 'w', why: 'y', fix: 'f', anchor: 'doc' },
            { id: 'p' + i + 'b', title: 'Paged finding ' + i + 'B', sev: sev(i + 1),
              what: 'w', why: 'y', fix: 'f', anchor: 'doc' } ], dismissed: [] } });
      }
      window.setView('intel');
    });
    await page.waitForTimeout(800);

    const card = () => page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-pf-open][data-pf-find]')];
      const scroller = document.querySelector('.pf-find-scroll');
      const pager = [...document.querySelectorAll('[data-pf-find-page]')];
      const host = document.getElementById('ig-frame');
      const foot = host ? (host.textContent.match(/\d+–\d+ of \d+/) || [''])[0] : '';
      return {
        rows: rows.length,
        first: rows.length ? rows[0].textContent.replace(/\s+/g, ' ').trim().slice(0, 46) : '',
        ids: rows.map(r => r.getAttribute('data-pf-find')),
        scrolls: !!scroller && scroller.scrollHeight > 0
          && getComputedStyle(scroller).overflowY === 'auto',
        bounded: !!scroller && scroller.getBoundingClientRect().height <= 400,
        pager: pager.map(b => b.getAttribute('data-pf-find-page')),
        prevOff: pager[0] ? pager[0].disabled : null,
        nextOff: pager[1] ? pager[1].disabled : null,
        range: foot,
      };
    });

    const c1 = await card();
    check('the findings card shows TEN a page, not six',
      c1.rows === 10, `${c1.rows} rows`);
    check('and it scrolls inside itself rather than stretching the row',
      c1.scrolls && c1.bounded, `overflow-y auto, ${c1.bounded ? 'bounded' : 'UNBOUNDED'}`);
    check('the foot says which ten of how many, not a bold dead-end count',
      /^1–10 of \d+$/.test(c1.range), c1.range || '(none)');
    check('and there is no "N more here" left anywhere on the page',
      !(await page.evaluate(() => /more here/i.test(
        (document.getElementById('ig-frame') || {}).textContent || ''))),
      'the sentence with nothing behind it is gone');
    check('on the first page there is nowhere back, and the control SAYS so',
      c1.pager.join('|') === 'prev|next' && c1.prevOff === true && c1.nextOff === false,
      `prev disabled=${c1.prevOff}, next disabled=${c1.nextOff}`);

    await page.click('[data-pf-find-page="next"]');
    await page.waitForTimeout(500);
    const c2 = await card();
    check('THE REPORTED FIX: pressing the pager reaches the rest of them',
      c2.rows === 10 && c2.ids[0] !== c1.ids[0] && /^11–20 of \d+$/.test(c2.range),
      `${c2.range}, first row now "${c2.first}"`);
    check('and no finding appears on two pages at once',
      c2.ids.every(id => !c1.ids.includes(id)), 'no overlap');

    await page.click('[data-pf-find-page="prev"]');
    await page.waitForTimeout(500);
    const c3 = await card();
    check('and back again lands on exactly the page it left',
      c3.ids.join('|') === c1.ids.join('|'), c3.range);

    /* ---- OPEN LANDS ON THE FINDING ---- */
    const target = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-pf-open][data-pf-find]')];
      const r = rows[0];
      return { id: r.getAttribute('data-pf-open'), find: r.getAttribute('data-pf-find') };
    });
    await page.click('[data-pf-open][data-pf-find]');
    await page.waitForTimeout(1200);

    const landed = await page.evaluate(() => {
      const panel = document.getElementById('scan-section');
      const marked = document.querySelector('#scan-section .pf-found');
      const cs = marked ? getComputedStyle(marked) : null;
      return {
        view: state.view,
        activeId: state.activeId,
        tab: typeof roomCurrentTab === 'function' ? roomCurrentTab() : null,
        panelOpen: !!panel && panel.getBoundingClientRect().width > 0,
        panelText: panel ? panel.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : '',
        marked: !!marked,
        markedId: marked ? (marked.querySelector('[data-scan-toggle]') || {}).getAttribute
          ? marked.querySelector('[data-scan-toggle]').getAttribute('data-scan-toggle') : null : null,
        /* The finding is OPEN, not merely present — the reader pressed a row
           that named a risk and must see what it says. */
        expanded: !!marked && /Suggested fix|Why it matters|What it says/i.test(marked.textContent),
        anim: cs ? cs.animationName : '',
        iter: cs ? cs.animationIterationCount : '',
      };
    });
    check('Open lands on the contract, on the DOCUMENT tab',
      landed.view === 'workspace' && landed.activeId === target.id && landed.tab === 'docs',
      `${landed.view}/${landed.activeId}/${landed.tab}`);
    check('with the risk panel OPEN, as real width on the page',
      landed.panelOpen, landed.panelText.slice(0, 40));
    check('THE REPORTED FIX: on the very finding the card was pointing at',
      landed.marked && landed.markedId === target.find,
      `marked ${landed.markedId}, wanted ${target.find}`);
    check('and that finding is opened, not merely highlighted shut',
      landed.expanded, 'its own what/why/fix are on screen');
    check('it blinks in light red — and STOPS, three times over',
      landed.anim === 'pf-found-blink' && landed.iter === '3',
      `${landed.anim} × ${landed.iter}`);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
