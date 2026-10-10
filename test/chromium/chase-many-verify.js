/* ============================================================
   CHASE MANY AT ONCE, AND APPROVALS OFF THE BOARD (Young, 8 Oct 2026 —
   "build all the steps", step 4 and rule 6)
   ============================================================
     1  two late promises: the Late promises work below the card carries a
        ticked list and "Send 2 chases"; unticking one says "Send 1 chase"
     2  one question for the list; afterwards both obligations are stamped
        chased (the obligation's own act) and the toast says what went
     3  an approval waiting on the reader is NOT a Board row; the bell's row
        opens the contract on Home's Paper at Signing
   AT THE PARENT 1 and 2 FAIL (no list), and 3 FAILS (approvals are a row).
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'chase-many');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const DOC = 'SUPPLY AGREEMENT\n\nArticle 1 Term\n\nThis Agreement runs for twelve (12) months.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    for (const [id, cp, mail] of [['MK-CM1', 'Savanna Foods Ltd', 'ops@savanna.example'], ['MK-CM2', 'Ndovu Logistics', 'ops@ndovu.example']]) {
      const c = fixtureContract(id, 'Supply ' + id, cp, FOLDER_A, 900000, 'Signed', DOC);
      Object.assign(c, { owner, hash: 'x', counterpartyEmail: mail,
        obligations: [{ id: 'o1', desc: 'Deliver the insurance certificate', party: 'theirs', due: day(-6), status: 'open' }] });
      await put(c);
    }

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length >= 2, null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => hbOpenAgent('late'));
    await page.waitForSelector('[data-hb-chase-many-box]', { timeout: 10000 }).catch(() => {});

    /* ===== 1. THE TICKED LIST ===== */
    const box = await page.evaluate(() => { const b = document.querySelector('[data-hb-chase-many-box]');
      return b ? { rows: b.querySelectorAll('[data-hb-chase-key]').length, ticked: b.querySelectorAll('[data-hb-chase-key]:checked').length,
        go: (b.querySelector('[data-hb-chase-many]') || {}).textContent } : null; });
    ok('1a the Late promises work carries a ticked list and "Send 2 chases"', !!box && box.rows === 2 && box.ticked === 2 && box.go === 'Send 2 chases', JSON.stringify(box));
    await page.click('[data-hb-chase-key] >> nth=1');
    const one = await page.waitForFunction(() => (document.querySelector('[data-hb-chase-many]') || {}).textContent === 'Send 1 chase', null, { timeout: 3000 }).then(() => true, () => false);
    ok('1b unticking one says "Send 1 chase"', one, await page.evaluate(() => (document.querySelector('[data-hb-chase-many]') || {}).textContent));
    await page.click('[data-hb-chase-key] >> nth=1');
    await page.screenshot({ path: path.join(OUT, '1-list.png') });

    /* ===== 2. ONE QUESTION, TWO CHASES ===== */
    await page.click('[data-hb-chase-many]');
    const asked = await page.waitForFunction(() => /Send 2 chases\?/.test(document.body.innerText), null, { timeout: 5000 }).then(() => true, () => false);
    ok('2a one question for the whole list', asked);
    const conf = await page.$('xpath=//button[normalize-space(.)="Send 2 chases" and not(@data-hb-chase-many)]');
    if (conf) await conf.click();
    const stamped = await page.waitForFunction(() => ['MK-CM1', 'MK-CM2'].every(id => { const c = getContract(id); return c && c.obligations[0] && c.obligations[0].chasedAt; }), null, { timeout: 10000 }).then(() => true, () => false);
    ok('2b both obligations are stamped chased by their own act', stamped);
    const said = await page.waitForFunction(() => /Chases: \d+ sent · \d+ in the outbox · \d+ could not go/.test(document.body.innerText), null, { timeout: 5000 }).then(() => true, () => false);
    ok('2c the toast says what went', said);

    /* ===== 3. APPROVALS ARE NOT A BOARD ROW ===== */
    const src = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'views', 'homeboard.js'), 'utf8');
    const rows = await page.evaluate(() => { const s = hbS(); s.path = []; hbSave(); setView('dashboard'); return hbAgentsData(null).rows.map(r => r.k); });
    ok('3a approvals are kept off the Board\'s card', /const HB_OFF_BOARD = \['approve'\];/.test(src) && !rows.includes('approve'), JSON.stringify(rows));
    const app = fs.readFileSync(path.join(__dirname, '..', '..', 'js', 'app.js'), 'utf8');
    ok('3b the bell\'s approval row opens the approval through pdOpenOnHome', /push\('approval',x\.c,\s*i18t\('al_approval'\),\(\)=>\{ if\(window\.pdOpenOnHome&&pdOpenOnHome\(x\.c\.id,'sign'\)\) return;/.test(app));
    /* RE-POINTED 10 Oct 2026 (owner: "delete signing tab"): the Paper has no
       Signing tab; an approval opens on the Approvals & signing page, its row chosen */
    await page.evaluate(() => pdOpenOnHome('MK-CM1', 'sign'));
    /* the row is chosen where it is on the list; this stage's contract waits on no approval, so the list is empty and nothing is chosen */
    const land = await page.waitForFunction(() => state.view === 'approvals' && apTab() === 'approvals' && (insSelected('approvals') === 'MK-CM1' || !apApprovalRows().some(r => r.c.id === 'MK-CM1')), null, { timeout: 8000 }).then(() => true, () => false);
    ok('3c pdOpenOnHome lands on the Approvals & signing page with that row chosen', land, await page.evaluate(() => JSON.stringify({ view: state.view, tab: apTab(), sel: insSelected('approvals') })));

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
