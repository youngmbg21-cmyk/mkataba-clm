/* Chromium verification: "THE LARGEST" IS MEASURED IN ONE CURRENCY (bug log, 27 Oct 2026)
   ============================================================
   Three contracts: KES 25M, USD 1M (a rate of 130 is on file, so about KES 130M) and ZAR 50M (no rate on
   file). Every place that names the biggest ranks what each is worth here (fxRankValue, the one reading,
   js/jurisdiction.js), and a value with no rate is never ranked as if it were shillings:
     1  the one comparator: USD 100k first, KES 1M second, ZAR (no rate) last
     2  Explorer's "Largest:" line names the USD contract
     3  Jambo's free "highest value" answer leads with the USD contract, and the ZAR one is not above it
     4  "compare the two biggest" picks the USD and KES contracts, never the unrated one
     5  the comparison's "larger" verdict names the USD contract; with the unrated one in the pair, no
        "larger" verdict is said at all
   Run: node test/chromium/largest-in-one-currency-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-B2'), null, { timeout: 20000 });
    /* the book on this screen: three priced contracts, the rest without a value; nothing is saved */
    await page.evaluate(() => {
      state.settings = { ...(state.settings || {}), fxRates: { USD: { rate: 130, at: '2026-10-01' } } };
      for (const c of state.contracts){ c.value = 0; }
      const set = (id, name, v, cur) => { const c = getContract(id); c.name = name; c.value = v; c.valueType = 'standard';
        c.metadata = { ...(c.metadata || {}), value: v, currency: cur }; c.status = 'Under Review'; c.archived = false; };
      set('MK-A2', 'Shilling Supply', 25000000, 'KES');
      set('MK-B2', 'Dollar Licence', 1000000, 'USD');
      set('MK-B1', 'Rand Distribution', 50000000, 'ZAR');
    });

    /* 1 — the one comparator */
    const order = await page.evaluate(() => ['MK-B1', 'MK-A2', 'MK-B2'].map(getContract).sort(window.fxRankDesc||((a,b)=>Number(b.value||0)-Number(a.value||0))).map(c => c.id));
    check('1  ranked in one currency: USD 1M, KES 25M, then the unrated ZAR', JSON.stringify(order) === '["MK-B2","MK-A2","MK-B1"]', JSON.stringify(order));

    /* 2 — Explorer's "Largest:" line */
    const ex = await page.evaluate(() => { const r = graphInterpret('show me the biggest contracts'); return r ? JSON.stringify(r) : ''; });
    check('2  Explorer\'s "Largest:" names the USD contract', /Largest: Dollar Licence/.test(String(ex || '')), String(ex || '').slice(0, 200));

    /* 3 — Jambo's free "highest value" answer */
    const hi = await page.evaluate(() => { const r = aiAnswer('which is our largest contract'); return r && r.text; });
    check('3  the highest-value answer leads with the USD contract', /highest-value agreement is <strong>Dollar Licence/.test(String(hi || '')), String(hi || '').slice(0, 160));

    /* 4 — "compare the two biggest" */
    const two = await page.evaluate(() => { const r = aiAnswer('compare the two biggest contracts side by side'); return r && JSON.stringify(r).match(/MK-[AB]\d/g); });
    const picked = [...new Set(two || [])].sort();
    check('4  the two biggest are the USD and KES contracts', JSON.stringify(picked) === '["MK-A2","MK-B2"]', JSON.stringify(picked));

    /* 5 — the comparison's verdict */
    const v = await page.evaluate(() => { const d = localCompareData(['MK-A2', 'MK-B2']); return d && (d.verdict || ''); });
    check('5  "larger" names the USD contract', /Dollar Licence|MK-B2/.test(String(v)) && /larger|större/i.test(String(v)), String(v).slice(0, 200));
    const vz = await page.evaluate(() => { const d = localCompareData(['MK-A2', 'MK-B1']); return d && (d.verdict || ''); });
    check('5  with the unrated contract in the pair, no "larger" verdict', !/larger|större/i.test(String(vz)), String(vz).slice(0, 200));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    check('no page errors', errors.length === 0, errors.join(' | '));
    await browser.close();
    await h.stop();
  }
  console.log(failures ? `\n${failures} failed` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
