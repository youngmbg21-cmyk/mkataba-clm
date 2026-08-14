/* Chromium verification: THE SHAPED FILL, AND THE WEEKLY REVIEW.
   ============================================================
   Three things ship together here and only make sense together:

   THE SETTING. A business says which shapes of agreement it has and what it
   calls a piece of work. Company-wide and admin-only, like the market, because
   it changes what every member sees.

   THE SHAPED PANELS. Beside the universal six: a workload runway, money held
   back, promises still live and work won and lost for businesses with jobs; a
   renewal runway for businesses with standing agreements. A panel appears
   because the shape is present, not because the industry was guessed.

   THE WEEKLY REVIEW. Five slots that never grow, three sizes, and no model
   anywhere near it.

   The assertions that matter most are the ones about what is NOT drawn:
     · turning a shape off removes its panels, and turning it on brings them
       back — otherwise the setting is decoration
     · the word on the panels is the business's own word
     · slot 3 of the review never lists more than three things, and says how
       many it left out
     · slot 5 is printed even when everything else is quiet
     · a LOST piece of work is a Declined contract, which the live book
       excludes — so conversion is computed over the whole book or it can only
       ever say 100%

   Run: node test/chromium/shaped-and-weekly-verify.js */
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

/* A roofing book: jobs that started and finished, retention held, warranties
   still running, one job lost, plus the seeded standing agreements. */
const SEED = () => {
  const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  const job = (id, name, cp, value, status, start, end, ret, relDays, warr) =>
    state.contracts.push({ id, name, counterparty: cp, folder: 'proc', value, status,
      expiry: day(end), rounds: [{ n: 1, status: 'closed' }], audit: [], changes: [], scan: null,
      metadata: { category: 'customer', effectiveDate: day(start), expiryDate: day(end),
        retentionPct: ret || 0, retentionReleaseDays: relDays || 0, warrantyMonths: warr || 0,
        renewalType: 'fixed' } });
  job('J1', 'Riverside Gardens Phase 2', 'Riverside Ltd', 8400000, 'Signed', -30, 60, 10, 90, 12);
  job('J2', 'Kileleshwa Villas', 'Kileleshwa Devs', 6200000, 'Signed', -60, 30, 10, 60, 12);
  job('J3', 'Karen Ridge Homes', 'Karen Ridge', 5100000, 'Signed', -260, -140, 10, 60, 12);
  job('J4', 'Lavington Townhouses', 'Lavington Homes', 3600000, 'Signed', -400, -300, 10, 30, 12);
  job('J5', 'Runda Court', 'Runda Estates', 4800000, 'Under Review', 10, 120, 5, 120, 12);
  job('J6', 'Machakos Villas', 'Machakos Devs', 1900000, 'Declined', -20, 70, 0, 0, 0);
  job('J7', 'Athi River Duplexes', 'Athi Devs', 1600000, 'Declined', -25, 65, 0, 0, 0);
  state.contracts.forEach(c => { if (!c.metadata) c.metadata = {}; });
  return state.contracts.length;
};

const FRAME = () => {
  const h = document.getElementById('ig-frame');
  return h ? h.textContent : '';
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

    /* ---- 1. THE SETTING ---- */
    await page.evaluate(() => window.setView('team'));
    await page.waitForTimeout(900);
    /* The work-shape setting is a row on "Platform settings" and opens in the
       drawer since the Aug 2026 redesign. Staged through the page's own door. */
    await page.evaluate(() => { settingsGoTab('platform'); stDrawerOpen('workshape'); });
    await page.waitForTimeout(700);
    const card = await page.evaluate(() => ({
      shapes: [...document.querySelectorAll('[data-ws-shape]')].map(b => b.getAttribute('data-ws-shape')),
      words: [...(document.getElementById('set-work-word') || { options: [] }).options].map(o => o.value),
      detect: window.wsDetect(),
    }));
    check('Settings offers both shapes and the vocabulary',
      card.shapes.length === 2 && card.words.length === 6, `${card.shapes.join(',')} · ${card.words.join(',')}`);
    check('and it can see the jobs in the book without being told',
      card.detect.project >= 5, `detected ${card.detect.project} project, ${card.detect.standing} standing, ${card.detect.unknown} unknown`);

    const saved = await page.evaluate(() => { window.wsSet(['standing', 'project'], 'job'); return window.wsCfg(); });
    check('the choice sticks and carries the word', saved.word === 'job' && saved.shapes.length === 2);
    const onServer = await page.evaluate(async () => (await (await fetch('/api/bootstrap')).json()).org.workShape);
    check('and reaches the server, so every member sees the same answer',
      onServer && onServer.word === 'job', JSON.stringify(onServer));

    /* ---- 2. THE SHAPED PANELS ---- */
    await page.evaluate(() => window.setView('intel'));
    await page.waitForTimeout(1200);
    const both = await page.evaluate(FRAME);
    const wants = ['The workload runway', 'Money held back', 'Promises still live', 'Jobs won and lost', 'The renewal runway'];
    check('all five shaped panels are drawn when both shapes are present',
      wants.every(w => both.includes(w)), wants.filter(w => !both.includes(w)).join(', ') || 'all five');
    check('and they use the business\'s own word, not ours',
      both.includes('Jobs won and lost') && /each job actually runs/.test(both));

    /* the panel that must look past the live book */
    const wl = await page.evaluate(() => {
      const jobs = state.contracts.filter(c => window.wsIsProject(c));
      return { lost: jobs.filter(c => c.status === 'Declined').length,
        html: window.pfWonLost() };
    });
    check('a lost job is counted, though the live book excludes it',
      wl.lost === 2 && !/>0 jobs</.test(wl.html.replace(/\s+/g, '')) && /Lost/.test(wl.html),
      `${wl.lost} declined jobs seeded`);
    const pct = await page.evaluate(() => {
      const m = window.pfWonLost().match(/won (\d+)% of decided/); return m ? Number(m[1]) : null; });
    check('so the conversion rate is not stuck at 100%', pct !== null && pct < 100, `${pct}% by count`);

    /* ---- 3. TURNING A SHAPE OFF ---- */
    await page.evaluate(() => { window.wsSet(['standing'], 'job'); window.renderIntel(); });
    await page.waitForTimeout(700);
    const standingOnly = await page.evaluate(FRAME);
    check('turning the job shape off removes its four panels',
      !['The workload runway', 'Money held back', 'Promises still live', 'Jobs won and lost']
        .some(w => standingOnly.includes(w)));
    check('and leaves the renewal runway and the universal six standing',
      standingOnly.includes('The renewal runway') && standingOnly.includes('Where the value sits'));

    await page.evaluate(() => { window.wsSet(['project'], 'matter'); window.renderIntel(); });
    await page.waitForTimeout(700);
    const projectOnly = await page.evaluate(FRAME);
    check('turning standing off removes the renewal runway',
      !projectOnly.includes('The renewal runway') && projectOnly.includes('The workload runway'));
    check('and changing the word changes every panel that names it',
      projectOnly.includes('Matters won and lost') && /each matter actually runs/.test(projectOnly),
      'the same panels now read "matter"');
    await page.evaluate(() => { window.wsSet(['standing', 'project'], 'job'); window.renderIntel(); });
    await page.waitForTimeout(600);

    /* ---- 4. THE CATCH-UP ROUTE ---- */
    const nudge = await page.evaluate(() => {
      const n = state.contracts.filter(c => c.status !== 'Declined' && !((c.metadata || {}).category)).length;
      return { n, shown: !!document.querySelector('[data-pf-fixcats]'), text: FRAMEHACK() };
      function FRAMEHACK(){ const h = document.getElementById('ig-frame'); return h ? h.textContent : ''; }
    });
    check('the uncountable pile is surfaced with a way to fix it',
      nudge.n > 0 ? (nudge.shown && /cannot be grouped yet/.test(nudge.text)) : !nudge.shown,
      `${nudge.n} without a category`);

    /* ---- 5. THE WEEKLY REVIEW ---- */
    const wk = await page.evaluate(() => {
      window.wkSetTier('tower');
      const d = window.weeklyData();
      return { html: window.buildWeeklyHtml(d), actions: d.actions.length, tier: d.tier };
    });
    const slots = ['Where things stand', 'Dates that matter', 'Worth an hour', 'What got better', 'What we did not look at'];
    check('the review prints all five slots, in order',
      slots.every(s => wk.html.includes(s))
      && slots.map(s => wk.html.indexOf(s)).every((v, i, a) => i === 0 || v > a[i - 1]),
      slots.filter(s => !wk.html.includes(s)).join(', ') || 'five, in order');
    const listed = (wk.html.match(/class="act"/g) || []).length;
    check('slot 3 never lists more than three things',
      listed <= 3, `${listed} listed of ${wk.actions} ranked`);
    check('and says how many it left out rather than hiding them',
      wk.actions <= 3 || /are not listed/.test(wk.html), `${wk.actions} ranked`);
    check('slot 5 is printed whatever else the week held',
      /read for risk|no category|invoiced or paid/.test(wk.html));
    check('nothing in it claims to know about money moving or delivery',
      /HaTi reads contracts, not accounts/.test(wk.html) && /records a delivery/.test(wk.html));
    check('the control tower size adds a page after the five, not inside them',
      wk.html.includes('What the book is exposed to')
      && wk.html.indexOf('What we did not look at') < wk.html.indexOf('What the book is exposed to'));

    const sizes = await page.evaluate(() => {
      const out = {};
      ['skinny', 'tower', 'full'].forEach(t => { window.wkSetTier(t);
        const h = window.buildWeeklyHtml(window.weeklyData());
        out[t] = { exposure: h.includes('What the book is exposed to'),
          nego: h.includes('How negotiation is going'), len: h.length }; });
      window.wkSetTier('tower');
      return out;
    });
    check('skinny is the five slots and nothing else',
      !sizes.skinny.exposure && !sizes.skinny.nego);
    check('control tower adds exposure only',
      sizes.tower.exposure && !sizes.tower.nego);
    check('360 adds negotiation and the portfolio shape',
      sizes.full.exposure && sizes.full.nego && sizes.full.len > sizes.tower.len);

    /* ---- 6. SWEDISH ---- */
    await page.evaluate(() => window.langSet && window.langSet('sv'));
    await page.waitForTimeout(800);
    const svFrame = await page.evaluate(FRAME);
    const svLeaks = ['The workload runway', 'Money held back', 'Promises still live',
      'won and lost', 'The renewal runway', 'contracts'].filter(w => svFrame.includes(w));
    check('the shaped panels read Swedish on a Swedish screen',
      !svLeaks.length, svLeaks.join(', ') || 'clean');
    const svWk = await page.evaluate(() => window.buildWeeklyHtml(window.weeklyData()));
    const svWkLeaks = ['Where things stand', 'Worth an hour', 'What we did not look at']
      .filter(w => svWk.includes(w));
    check('and so does the weekly review', !svWkLeaks.length, svWkLeaks.join(', ') || 'clean');
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
