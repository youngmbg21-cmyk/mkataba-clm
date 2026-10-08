/* ============================================================
   THE DEAL ON HOME'S PAPER (Young, 8 Oct 2026 — "build all the steps",
   step 3 of the Home-first build)
   ============================================================
   Driven where the reader looks, on Home's Paper side:
     1  a contract whose other side sent changes offers Clean | Redlined · N
        on the paper's strip; the Deal tab turns the paper Redlined, and the
        marks are the Negotiate page's own (struck and inserted words)
     2  the Deal tab sorts their changes: a change about months "needs a
        look"; a wording-only change "looks minor"; nothing is accepted here
     3  "Answer on Negotiate" opens the Negotiate page (wording changes stay
        there — Home first), and Clean puts the clean paper back
   AT THE PARENT every claim FAILS: there is no switch, no Deal sorting.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'deal-on-the-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const DOC = ['SUPPLY AGREEMENT', '', 'Article 1 Term', '', 'This Agreement runs for twelve (12) months.', '', 'Article 2 Notices', '', 'Notices shall be given in writing to the address above.', '', 'Article 3 Law', '', 'This Agreement is governed by the laws of Kenya.'].join('\n');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    await W.admin.json('/api/contracts/MK-DP1', { method: 'PUT', body: { contract: Object.assign(
      fixtureContract('MK-DP1', 'Supply Agreement', 'Kilima Foods Ltd', FOLDER_A, 900000, 'Under Review', DOC), { owner: { id: me.id, name: me.name } }), baseVersion: 0 } });

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c.id === 'MK-DP1'), null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();

    /* the other side's round: two changes, filed through the funnel as theirs */
    const filed = await page.evaluate(async () => {
      const c = getContract('MK-DP1');
      if (c._light && !c._loaded && typeof ensureFull === 'function') await ensureFull(c);
      const cls = negoClauseList(c);
      const one = cls.find(x => /twelve/.test(x.text || x.body || x.html || ''));
      const two = cls.find(x => /in writing/.test(x.text || x.body || x.html || ''));
      const body = x => String(x.bodyHtml || x.html || x.body || x.text || '');
      if (one) await negoEditClause(c, one.clauseId, body(one).replace('twelve (12) months', 'six (6) months'), { side: 'counterparty', author: 'Erik' });
      if (two) await negoEditClause(c, two.clauseId, body(two).replace('in writing to the address above', 'in writing or by email to the address above'), { side: 'counterparty', author: 'Erik' });
      window.__cls = cls.map(x => ({ id: x.clauseId, keys: Object.keys(x) }));
      if (typeof persist === 'function') await persist(c);
      return (c.changes || []).filter(x => x.status === 'pending' && x.authorSide === 'counterparty').length;
    });
    ok('0 their round is on the record (two open changes of theirs)', filed === 2, String(filed) + ' ' + JSON.stringify(await page.evaluate(() => window.__cls)));

    await page.evaluate(() => { setView('dashboard'); igWalk(['MK-DP1'], 0, {}); });
    await page.waitForFunction(() => window.intel && intel.paper && intel.paper.id === 'MK-DP1' && !!document.querySelector('#ig-strip .ig-red'), null, { timeout: 10000 }).catch(() => {});

    /* ===== 1. CLEAN | REDLINED, AND THE DEAL TAB TURNS IT ON ===== */
    const sw = await page.evaluate(() => [...document.querySelectorAll('#ig-strip .ig-red button')].map(b => b.textContent.trim() + (b.getAttribute('aria-pressed') === 'true' ? '*' : '')));
    ok('1a the strip offers Clean | Redline · 2, Clean at rest', sw.join('|') === 'Clean*|Redline · 2', JSON.stringify(sw));
    await page.click('#ig-dock [data-pd-tab="deal"]');
    await page.waitForFunction(() => !!document.querySelector('#ig-paper .ig-redpaper'), null, { timeout: 8000 }).catch(() => {});
    const red = await page.evaluate(() => {
      const cv = document.getElementById('ig-canvas'); const t = cv ? cv.innerText : '';
      return { paper: !!document.querySelector('#ig-paper .ig-redpaper'), lit: (document.querySelector('#ig-strip .ig-red [aria-pressed="true"]') || {}).textContent,
        both: /twelve/.test(t) && /six/.test(t), marks: cv ? cv.querySelectorAll('del, ins, .rl-del, .rl-ins, [class*="del"], [class*="ins"]').length : 0 };
    });
    ok('1b the Deal tab draws the paper Redlined: their words struck and inserted', red.paper && /Redline/.test(red.lit || '') && red.both && red.marks > 0, JSON.stringify(red));
    await page.screenshot({ path: path.join(OUT, '1-redlined.png') });

    /* ===== 2. THEIR CHANGES, SORTED ===== */
    const deal = await page.evaluate(() => (document.getElementById('pd-body') || {}).innerText || '');
    ok('2a "Needs a look" holds the change about months; "Looks minor" holds the wording-only one',
      /Looks minor · 1/i.test(deal) && /Needs a look · 1/i.test(deal), deal.slice(0, 600));
    const acts = await page.evaluate(() => [...document.querySelectorAll('#pd-body button')].map(b => b.textContent.trim()));
    ok('2b nothing is accepted here: each change answers on Negotiate', acts.filter(x => x === 'Answer on Negotiate').length === 2 && !acts.some(x => /^Accept/.test(x)), JSON.stringify(acts));

    /* ===== 3. ANSWER ON NEGOTIATE, AND BACK TO CLEAN ===== */
    await page.evaluate(() => document.querySelector('#ig-strip [data-ig-red="0"]').click());
    const clean = await page.evaluate(() => ({ red: !!document.querySelector('#ig-paper .ig-redpaper'), lit: (document.querySelector('#ig-strip .ig-red [aria-pressed="true"]') || {}).textContent }));
    ok('3a Clean puts the clean paper back', !clean.red && clean.lit === 'Clean', JSON.stringify(clean));
    const b = (await page.$$('#pd-body button')).find(async x => /Answer on Negotiate/.test(await x.textContent()));
    const answer = await page.$('xpath=//div[@id="pd-body"]//button[normalize-space(.)="Answer on Negotiate"]');
    if (answer) await answer.click(); else if (b) await b.click();
    const went = await page.waitForFunction(() => window.state && state.view === 'redline', null, { timeout: 10000 }).then(() => true, () => false);
    ok('3b Answer on Negotiate opens the Negotiate page', went, await page.evaluate(() => window.state && state.view));

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
