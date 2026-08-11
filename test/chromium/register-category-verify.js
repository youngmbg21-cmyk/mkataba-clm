/* Chromium verification: THE REGISTER FILTERS BY CATEGORY, ON BOTH SHELLS.
   ============================================================
   Category is the field every portfolio figure groups by, so the register has
   to be able to stand on it: show me the supplier agreements, show me the
   leases. The filter sits beside the renewal one it most resembles.

   Two things this has to get right beyond "the dropdown works".

   THE PILE WITH NO CATEGORY. A book that has been running for years has
   contracts nobody has filed properly yet. Under any category filter they
   simply vanish, and with no way back to them there is no way to finish the
   job. "No category yet" is therefore a choice in the list, and it is the
   worklist for making a portfolio countable.

   TWO SHELLS DRAW THIS SCREEN. The desktop register has a dropdown; below
   768px the phone draws its own chips. They share regState() and regFiltered(),
   so the FILTERING is one implementation — but the controls are not, and a
   desktop-only fix leaves the two screens disagreeing about what can be asked.
   The phone shows a category chip only for categories the book actually
   contains, and only when there is more than one, because a chip that selects
   everything is not a filter.

   Run: node test/chromium/register-category-verify.js */
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

/* Give the seeded book categories, and leave one without so the "no category
   yet" pile is a real pile and not a theory. */
const CATEGORISE = () => {
  const want = { 'MK-A1': 'supplier', 'MK-A2': 'supplier', 'MK-B1': 'customer' };
  let done = 0;
  window.state.contracts.forEach(c => {
    if (want[c.id]) { c.metadata = Object.assign({}, c.metadata, { category: want[c.id] }); done++; }
  });
  return { done, total: window.state.contracts.length };
};

const COUNT = () => window.regFiltered().length;
const IDS = () => window.regFiltered().map(c => c.id).sort();

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
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

    const seeded = await page.evaluate(CATEGORISE);
    await page.evaluate(() => window.setView('register'));
    await page.waitForTimeout(900);

    /* ---- the control exists, beside the one it resembles ---- */
    const bar = await page.evaluate(() => {
      const sel = document.getElementById('reg-category');
      if (!sel) return null;
      const bar = sel.closest('div');
      const order = [...bar.querySelectorAll('select')].map(s => s.id);
      return { opts: [...sel.options].map(o => o.value), labels: [...sel.options].map(o => o.textContent.trim()),
        order, beforeRenewal: order.indexOf('reg-category') < order.indexOf('reg-renewal') };
    });
    check('the register offers a category filter', !!bar, bar ? bar.opts.join(', ') : 'no #reg-category');
    check('it lists every category the metadata records',
      bar && ['customer', 'supplier', 'employment', 'lease', 'licence', 'partner', 'funding', 'other']
        .every(k => bar.opts.includes(k)));
    check('and a way back to the ones with no category yet',
      bar && bar.opts.includes('none') && bar.labels.some(l => /No category yet/i.test(l)));
    check('it sits beside the renewal filter', bar && bar.beforeRenewal, bar ? bar.order.join(' → ') : '');

    /* ---- it actually filters ---- */
    const all = await page.evaluate(COUNT);
    await page.selectOption('#reg-category', 'supplier');
    await page.waitForTimeout(500);
    const suppliers = await page.evaluate(IDS);
    check('choosing a category narrows the register',
      suppliers.length === 2 && suppliers.join(',') === 'MK-A1,MK-A2',
      `${suppliers.length} of ${all}: ${suppliers.join(', ')}`);

    await page.selectOption('#reg-category', 'none');
    await page.waitForTimeout(500);
    const uncat = await page.evaluate(IDS);
    check('"no category yet" finds exactly the ones nobody has filed',
      uncat.length === seeded.total - seeded.done && !uncat.includes('MK-A1'),
      `${uncat.length} of ${seeded.total}: ${uncat.join(', ')}`);

    /* ---- clearing clears it ---- */
    const clearedByButton = await page.evaluate(() => {
      const b = document.getElementById('reg-clear-filters');
      if (!b) return 'no clear button offered while a category is chosen';
      b.click();
      return null;
    });
    await page.waitForTimeout(500);
    const afterClear = await page.evaluate(() => ({ cat: window.regState().category, n: window.regFiltered().length }));
    check('Clear puts the category back with the other filters',
      !clearedByButton && afterClear.cat === 'all' && afterClear.n === all,
      clearedByButton || `category=${afterClear.cat}, ${afterClear.n} rows`);

    /* ---- the empty state's own clear button resets it too ---- */
    await page.evaluate(() => { const R = window.regState(); R.category = 'funding'; window.renderRegister(); });
    await page.waitForTimeout(500);
    const emptyState = await page.evaluate(() => {
      const b = document.getElementById('reg-empty-clear');
      if (!b) return { shown: false };
      b.click();
      return { shown: true };
    });
    await page.waitForTimeout(400);
    const afterEmpty = await page.evaluate(() => window.regState().category);
    check('the empty state offers a way out of a category with nothing in it',
      emptyState.shown && afterEmpty === 'all', `shown=${emptyState.shown}, category=${afterEmpty}`);

    /* ---- the phone draws its own controls ---- */
    await page.setViewportSize({ width: 400, height: 860 });
    await page.waitForTimeout(900);
    await page.evaluate(() => { const R = window.regState(); R.category = 'all'; });
    const phone = await page.evaluate(() => {
      const html = typeof window.mContractsHtml === 'function' ? window.mContractsHtml() : '';
      const chips = [...html.matchAll(/data-m-cat="([a-z]+)"/g)].map(m => m[1]);
      return { chips, hasWords: /Supplier|Leverantör/.test(html) };
    });
    check('the phone shows a chip per category the book contains',
      phone.chips.length === 2 && phone.chips.includes('supplier') && phone.chips.includes('customer'),
      phone.chips.join(', ') || 'none drawn');
    check('and no chip for a category nothing is filed under',
      !phone.chips.includes('lease') && !phone.chips.includes('funding'));
    check('the chips read in words, not stored keys', phone.hasWords);

    const phoneFilter = await page.evaluate(() => {
      const R = window.regState(); R.category = 'customer';
      return window.regFiltered().map(c => c.id);
    });
    check('a chip filters the same list the desktop filters',
      phoneFilter.length === 1 && phoneFilter[0] === 'MK-B1', phoneFilter.join(', '));

    /* one category is not a choice — the group should not appear at all */
    const single = await page.evaluate(() => {
      window.state.contracts.forEach(c => { if (c.metadata) delete c.metadata.category; });
      const c0 = window.state.contracts[0];
      c0.metadata = Object.assign({}, c0.metadata, { category: 'supplier' });
      const R = window.regState(); R.category = 'all';
      return [...(window.mContractsHtml().matchAll(/data-m-cat="([a-z]+)"/g))].map(m => m[1]);
    });
    check('one category is no choice, so the phone draws no chips at all',
      single.length === 0, single.join(', ') || 'none — correct');

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
