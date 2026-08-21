/* J12 — both markets (Kenya / Sweden), at 1440.
   - Switch the market on Settings (admin only).
   - Prove currency / governing law / risk-pack facts change.
   - Prove the settings page HOLDS STILL when the market alone changes
     (patch in place, not a full re-render) — tested with the reader's
     language explicitly pinned first, so the market switch does NOT also
     move the language (the one documented case that IS a full redraw).
   - Prove "Swedish buttons over Kenyan contracts" — the contract's own
     currency/wording is unaffected by a market switch.
   - Prove months follow the READER'S LANGUAGE, numbers follow the MARKET:
     with an English reader and a Swedish market, the calendar's month header
     reads in English while a money figure's digit grouping is Swedish. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
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
  const h = await startHati();
  const W = await seedWorkspace(h);
  await nameASigner(W.admin, 'MK-A2');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await page.waitForTimeout(2200);

  // ---- 0. baseline: default market is Kenya, currency KES ----
  const jx0 = await page.evaluate(() => (window.jxId ? jxId() : null));
  check('default market is kenya', jx0 === 'kenya', jx0);

  // ---- 1. Key Terms value cell, in Kenya market ----
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(500);
  await page.click('tr[data-row="MK-A1"]');
  await page.waitForTimeout(700);
  await page.click('[data-ws-tab="terms"]').catch(() => {});
  await page.waitForTimeout(600);
  const valKe = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll('#doc-canvas, .kt-row, [data-kt]'));
    return document.body.innerText.match(/KES[\s ][\d.,\s ]+/)?.[0] || null;
  });
  check('MK-A1 Key Terms value shows KES with en-KE grouping (comma)', !!valKe && /KES[\s ]48,000,000/.test(valKe), valKe);
  await page.screenshot({ path: path.join(OUT, 'market-kenya-mka1-terms.png') });

  // ---- 2. Playbook screen shows Kenyan governing-law wording ----
  await page.evaluate(() => setView('playbook'));
  await page.waitForTimeout(700);
  const pbKe = await page.evaluate(() => document.body.innerText);
  check('Playbook (Kenya market) references Kenya governing law', /laws of Kenya/i.test(pbKe));
  await page.screenshot({ path: path.join(OUT, 'market-kenya-playbook.png') });

  // ---- 3. PIN the reader's language to English EXPLICITLY (top bar).
  //         Admin already defaults to English (it follows the Kenya market),
  //         so clicking the already-active "en" button is a documented no-op
  //         (wireLanguagePicker: "already there; do not repaint for nothing")
  //         and would NOT actually pin anything. Toggle away and back for a
  //         real langSet() call that writes me.lang explicitly. ----
  await page.click('#lang-switch [data-lang="sv"]');
  await page.waitForTimeout(500);
  await page.click('#lang-switch [data-lang="en"]');
  await page.waitForTimeout(500);
  const pinnedLang = await page.evaluate(() => (window.langId ? langId() : null));
  check('reader language explicitly pinned to English before the market switch', pinnedLang === 'en', pinnedLang);

  // ---- 4. Open Settings, platform tab, company panel ----
  await page.evaluate(() => { if (window.openSettingsAt) openSettingsAt('platform', 'company'); else setView('team'); });
  await page.waitForTimeout(700);
  const marketSelBefore = await page.evaluate(() => document.getElementById('set-market')?.value);
  check('market select shows kenya in the drawer', marketSelBefore === 'kenya', marketSelBefore);
  const factsBefore = await page.evaluate(() => document.getElementById('set-market-facts')?.textContent?.trim());
  await page.screenshot({ path: path.join(OUT, 'market-kenya-settings.png') });

  // ---- 5. THE SETTINGS PAGE HOLDS STILL: tag the #set-page node, switch
  //         market, and check the SAME node is still there (not a full
  //         re-render) — because the reader's language was already pinned
  //         to English above, so a Kenya→Sweden move keeps the language and
  //         must patch in place. ----
  await page.evaluate(() => { window.__j12probe = document.getElementById('set-page'); });
  const scrollBefore = await page.evaluate(() => document.getElementById('content-scroll')?.scrollTop);

  await page.selectOption('#set-market', 'sweden');
  await page.waitForTimeout(700);

  const langAfterMarket = await page.evaluate(() => (window.langId ? langId() : null));
  check('pinned English reader stays English after a market switch', langAfterMarket === 'en', langAfterMarket);

  const samePageNode = await page.evaluate(() => !!window.__j12probe && window.__j12probe === document.getElementById('set-page'));
  check('SETTINGS PAGE HOLDS STILL — #set-page is the SAME DOM node after the market switch (patch, not re-render)',
    samePageNode, samePageNode ? 'same node' : 'node replaced (full re-render)');

  const jx1 = await page.evaluate(() => (window.jxId ? jxId() : null));
  check('market switched to sweden', jx1 === 'sweden', jx1);
  const marketSelAfter = await page.evaluate(() => document.getElementById('set-market')?.value);
  check('market select reflects sweden after switch', marketSelAfter === 'sweden', marketSelAfter);
  const factsAfter = await page.evaluate(() => document.getElementById('set-market-facts')?.textContent?.trim());
  check('market facts line changed (currency/law facts updated)', factsAfter !== factsBefore, `before="${factsBefore}" after="${factsAfter}"`);
  check('market facts line now mentions SEK', /SEK/.test(factsAfter || ''), factsAfter);
  await page.screenshot({ path: path.join(OUT, 'market-sweden-settings.png') });

  // Close the drawer like a real reader would (Escape) before navigating —
  // the drawer's scrim is a real modal backdrop (position:fixed, inset:0,
  // z-index:70) and covers the whole viewport including the sidebar while
  // open, so leaving it open and navigating programmatically would leave a
  // dead click-catcher on screen. Confirmed separately (probe-scrim.js): a
  // real click elsewhere while the scrim is up is swallowed by the scrim's
  // own close handler rather than reaching what is underneath — ordinary
  // modal behaviour, not a defect, but worth the note in NOTES.md.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(400);

  // ---- 6. Existing contract's OWN currency is unaffected by the market
  //          switch — "Swedish buttons over Kenyan contracts is correct". ----
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(500);
  await page.click('tr[data-row="MK-A1"]');
  await page.waitForTimeout(700);
  await page.click('[data-ws-tab="terms"]').catch(() => {});
  await page.waitForTimeout(600);
  const valSe = await page.evaluate(() => document.body.innerText.match(/KES[\s ][\d.,\s ]+/)?.[0] || null);
  check('MK-A1 Key Terms value STILL shows KES (contract keeps its own currency under a Swedish market)',
    !!valSe && /^KES/.test(valSe), valSe);
  check('MK-A1 value digit grouping is now sv-SE (space) — English UI, Swedish market, KES currency, Swedish grouping',
    !!valSe && /48[\s ]000[\s ]000/.test(valSe), valSe);
  await page.screenshot({ path: path.join(OUT, 'market-sweden-mka1-terms-english-ui.png') });

  // Contract document body itself is still English/unedited under Sweden market.
  await page.click('[data-ws-tab="docs"]').catch(() => {});
  await page.waitForTimeout(600);
  const docTextSe = await page.evaluate(() => (document.querySelector('.doc-surface')?.innerText || '').trim());
  check('MK-A1 document wording unaffected by market switch', docTextSe.includes('Highland Corporate Ltd') && docTextSe.includes('Kabras Sugar'));

  // ---- 7. Playbook now shows Swedish governing-law wording ----
  await page.evaluate(() => setView('playbook'));
  await page.waitForTimeout(700);
  const pbSe = await page.evaluate(() => document.body.innerText);
  check('Playbook (Sweden market) references Sweden/Stockholm governing law', /Sweden|Stockholm/i.test(pbSe));
  check('Playbook (Sweden market) no longer references Kenya', !/laws of Kenya/i.test(pbSe));
  await page.screenshot({ path: path.join(OUT, 'market-sweden-playbook.png') });

  // ---- 8. MONTHS FOLLOW THE READER'S LANGUAGE, NUMBERS FOLLOW THE MARKET.
  //         English reader (pinned above), Swedish market: the calendar
  //         month header must read in ENGLISH words. ----
  await page.evaluate(() => setView('calendar'));
  await page.waitForTimeout(700);
  const calMonthEnSe = await page.evaluate(() => document.getElementById('cal-month')?.textContent?.trim());
  check('Calendar month header is ENGLISH words under an English reader + Swedish market',
    /^(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/.test(calMonthEnSe || ''),
    calMonthEnSe);
  await page.screenshot({ path: path.join(OUT, 'market-sweden-calendar-english-reader.png') });

  // Now flip the reader to Swedish (market stays Sweden) — the SAME month
  // should read in Swedish words, proving the split is real in both directions.
  await page.click('#lang-switch [data-lang="sv"]').catch(() => {});
  await page.waitForTimeout(600);
  await page.evaluate(() => setView('calendar'));
  await page.waitForTimeout(700);
  const calMonthSvSe = await page.evaluate(() => document.getElementById('cal-month')?.textContent?.trim());
  check('Calendar month header turns Swedish once the READER (not just the market) is Swedish',
    calMonthSvSe !== calMonthEnSe, `EN reader="${calMonthEnSe}" SV reader="${calMonthSvSe}"`);
  await page.screenshot({ path: path.join(OUT, 'market-sweden-calendar-swedish-reader.png') });

  await browser.close();
  await h.stop();

  console.log('\n--- page errors ---');
  errors.forEach(e => console.log(e));
  fs.writeFileSync(path.join(__dirname, '..', 'errors-03-markets.json'), JSON.stringify(errors, null, 2));

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, '..', 'results-03-markets.json'), JSON.stringify(results, null, 2));
  process.exit(results.every(r => r.pass) ? 0 : 1);
})();
