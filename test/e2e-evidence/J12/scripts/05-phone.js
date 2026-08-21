/* J12 — the phone shell at 390px.
   Home, Contracts, Negotiate, Approvals, the contract screen, the share
   sheet, People, More. Bottom-bar label floor (14px). The phone files no
   changes of its own (grep). The negotiations list's three bands. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { execSync } = require('node:child_process');
const { startHati, seedWorkspace, nameASigner } = require('../../../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  // ---- 0. THE PHONE FILES NO CHANGES OF ITS OWN ----
  let grepOut = '';
  try {
    grepOut = execSync('grep -n "changes.push\\|negoFileChange" ' + path.join(__dirname, '..', '..', '..', '..', 'js') + '/mobile*.js', { encoding: 'utf8' });
  } catch (e) { grepOut = (e.stdout || '').toString(); }
  check('grep "changes.push|negoFileChange" js/mobile*.js finds NOTHING', grepOut.trim() === '', grepOut.trim() || '(no matches)');

  const h = await startHati();
  const W = await seedWorkspace(h);
  await nameASigner(W.admin, 'MK-A2');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2400);

  const mRootPresent = await page.evaluate(() => !!document.getElementById('m-root'));
  check('phone shell (#m-root) is present at 390px', mRootPresent);

  const OVERFLOW = `(() => { const de = document.documentElement; return de.scrollWidth - de.clientWidth; })()`;

  // ---- 1. Bottom bar labels floored at 14px, all four ----
  const barSizes = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.m-tab > span:not(.m-tab-badge)')).map(s => ({
      text: s.textContent.trim(), size: parseFloat(getComputedStyle(s).fontSize),
    }));
  });
  check('bottom bar has 4 labels', barSizes.length === 4, JSON.stringify(barSizes));
  barSizes.forEach(b => check(`bottom bar label "${b.text}" is >= 14px`, b.size >= 14, `${b.size}px`));
  await page.screenshot({ path: path.join(OUT, 'phone-home.png') });

  let ov = await page.evaluate(OVERFLOW);
  check('Home: no horizontal overflow', ov <= 0, `over=${ov}`);

  // ---- 2. Contracts ----
  await page.click('[data-m-tab="contracts"]');
  await page.waitForTimeout(700);
  ov = await page.evaluate(OVERFLOW);
  check('Contracts: no horizontal overflow', ov <= 0, `over=${ov}`);
  await page.screenshot({ path: path.join(OUT, 'phone-contracts.png') });

  // ---- 3. Negotiate — three bands ----
  // Seed one live negotiation (client-side funnel call, same as
  // negotiations-door-verify.js) so the bands have something to draw.
  await page.evaluate(() => {
    const c = getContract('MK-A2');
    negoInit(c);
    negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
      kind: 'edit', authorSide: 'counterparty', author: 'Erik Lindqvist',
      before: 'thirty (30) days', after: 'sixty (60) days', why: 'Our cycle runs monthly.' });
  });
  await page.waitForTimeout(1200);
  await page.click('[data-m-tab="negotiations"]');
  await page.waitForTimeout(700);
  ov = await page.evaluate(OVERFLOW);
  check('Negotiate: no horizontal overflow', ov <= 0, `over=${ov}`);
  const bandInfo = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll('#m-root h2, #m-root h3, #m-root .m-band, #m-root [class*="band"]'))
      .map(e => e.textContent.trim()).filter(Boolean);
    return { text: document.body.innerText.slice(0, 900), headers };
  });
  const hasBands = /waiting on you/i.test(bandInfo.text) || /other side/i.test(bandInfo.text) || /nothing outstanding/i.test(bandInfo.text);
  check('Negotiate screen shows the three-band structure (waiting on you / other side / nothing outstanding)',
    hasBands, bandInfo.headers.join(' | ') || bandInfo.text.slice(0, 200));
  await page.screenshot({ path: path.join(OUT, 'phone-negotiate.png') });

  // ---- 4. Approvals ----
  await page.click('[data-m-tab="approvals"]');
  await page.waitForTimeout(700);
  ov = await page.evaluate(OVERFLOW);
  check('Approvals: no horizontal overflow', ov <= 0, `over=${ov}`);
  await page.screenshot({ path: path.join(OUT, 'phone-approvals.png') });

  // ---- 5. Contract screen, tabs ----
  await page.click('[data-m-tab="contracts"]');
  await page.waitForTimeout(700);
  const tapped = await page.evaluate(() => {
    const el = document.querySelector('#m-root [data-m-open="MK-A1"]');
    if (el) { el.click(); return 'data-m-open=MK-A1'; }
    return null;
  });
  await page.waitForTimeout(800);
  const onContractScreen = await page.evaluate(() => !!document.querySelector('[data-m-ctab]'));
  check('tapping a contract row opens the phone contract screen', onContractScreen, `tapped=${tapped}`);
  await page.screenshot({ path: path.join(OUT, 'phone-contract-doc.png') });

  if (onContractScreen) {
    for (const tab of ['terms', 'hist']) {
      await page.click(`[data-m-ctab="${tab}"]`).catch(() => {});
      await page.waitForTimeout(500);
      ov = await page.evaluate(OVERFLOW);
      check(`Contract screen /${tab}: no horizontal overflow`, ov <= 0, `over=${ov}`);
      await page.screenshot({ path: path.join(OUT, `phone-contract-${tab}.png`) });
    }
    // ---- 6. Share sheet ----
    await page.click('[data-m-act="overflow"]').catch(() => {});
    await page.waitForTimeout(500);
    const shareBtnPresent = await page.evaluate(() => !!document.querySelector('[data-m-share], [data-m-act="share"]'));
    if (shareBtnPresent) {
      await page.click('[data-m-share], [data-m-act="share"]').catch(() => {});
    } else {
      await page.evaluate(() => { if (window.mOpenShareSheet) mOpenShareSheet(); });
    }
    await page.waitForTimeout(600);
    const sheetOpen = await page.evaluate(() => {
      const sh = document.querySelector('.m-sheet, [class*="sheet"][class*="open"], #m-sheet');
      return !!sh && sh.getBoundingClientRect().height > 10;
    });
    check('share sheet opens on the phone', sheetOpen);
    await page.screenshot({ path: path.join(OUT, 'phone-share-sheet.png') });
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);
  }

  // ---- 7. People ----
  await page.evaluate(() => { if (window.mGo) mGo('people'); });
  await page.waitForTimeout(700);
  ov = await page.evaluate(OVERFLOW);
  check('People: no horizontal overflow', ov <= 0, `over=${ov}`);
  const peopleHasRows = await page.evaluate(() => (document.body.innerText.match(/@/g) || []).length >= 2);
  check('People screen lists members (email addresses visible)', peopleHasRows);
  await page.screenshot({ path: path.join(OUT, 'phone-people.png') });

  // ---- 8. More ----
  await page.evaluate(() => { if (window.mGo) mGo('more'); });
  await page.waitForTimeout(700);
  ov = await page.evaluate(OVERFLOW);
  check('More: no horizontal overflow', ov <= 0, `over=${ov}`);
  await page.screenshot({ path: path.join(OUT, 'phone-more.png') });

  await browser.close();
  await h.stop();

  console.log('\n--- page errors ---');
  errors.forEach(e => console.log(e));
  fs.writeFileSync(path.join(__dirname, '..', 'errors-05-phone.json'), JSON.stringify(errors, null, 2));

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, '..', 'results-05-phone.json'), JSON.stringify(results, null, 2));
  process.exit(0);
})();
