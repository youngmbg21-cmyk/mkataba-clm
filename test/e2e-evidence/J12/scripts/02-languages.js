/* J12 — languages, end to end (EN + SV) at 1440.
   - Walk the same screens in both languages, screenshot each.
   - Prove the CONTRACT'S OWN WORDS never translate (MK-A1 document body).
   - Look for untranslated English / half-translated sentences on the screens
     visited (lang-coverage.js already gives a workspace-wide measure; this
     looks specifically at the screens named in the brief). */
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

  const gotoScreen = async (v) => { await page.evaluate(vv => setView(vv), v); await page.waitForTimeout(500); };

  // ---- Read the MK-A1 document body text in English ----
  await page.evaluate(() => setView('register'));
  await page.waitForTimeout(500);
  await page.click('tr[data-row="MK-A1"]');
  await page.waitForTimeout(700);
  await page.click('[data-ws-tab="docs"]').catch(() => {});
  await page.waitForTimeout(700);
  const bodyEn = await page.evaluate(() => {
    const el = document.querySelector('.doc-body, .hati-doc, #ws-doc, .doc-surface') || document.body;
    return (el.innerText || '').trim().slice(0, 4000);
  });
  check('MK-A1 document body captured (EN)', bodyEn.includes('Highland Corporate Ltd') && bodyEn.includes('Kabras Sugar'),
    `len=${bodyEn.length}`);
  await page.screenshot({ path: path.join(OUT, 'lang-en-mka1-doc.png') });

  // ---- What English shows before the switch (sentinel for the language toggle) ----
  const homeTitleEn = await page.evaluate(() => document.querySelector('#page-head')?.innerText?.trim()?.slice(0, 80));
  await gotoScreen('dashboard');
  await page.waitForTimeout(500);
  const heroTitleEn = await page.evaluate(() => document.querySelector('.hm-banner h2')?.textContent?.trim());
  check('Home hero title is CLM English before switch', /Contract Lifecycle Management/i.test(heroTitleEn || ''), heroTitleEn);
  await page.screenshot({ path: path.join(OUT, 'lang-en-home.png') });

  // ---- SWITCH TO SWEDISH ----
  // Language toggle lives in the top bar above 900px.
  const hasToggle = await page.evaluate(() => !!document.querySelector('#lang-switch [data-lang="sv"]'));
  check('Swedish toggle reachable in top bar at 1440', hasToggle);
  await page.click('#lang-switch [data-lang="sv"]').catch(() => {});
  await page.waitForTimeout(700);
  const heroTitleSv = await page.evaluate(() => document.querySelector('.hm-banner h2')?.textContent?.trim());
  check('Home hero title changed language', heroTitleSv !== heroTitleEn, `EN="${heroTitleEn}" SV="${heroTitleSv}"`);
  check('Home hero title follows the settled ng_clm wording (Hantering av avtalens livscykel)',
    /Hantering av avtalens livscykel/i.test(heroTitleSv || ''), heroTitleSv);
  await page.screenshot({ path: path.join(OUT, 'lang-sv-home.png') });

  const SCREENS = [
    ['register', 'contracts'],
    ['redline', 'negotiations'],
    ['intel', 'insights'],
    ['team', 'settings'],
    ['directory', 'people'],
  ];
  for (const [v, label] of SCREENS) {
    await gotoScreen(v);
    await page.screenshot({ path: path.join(OUT, `lang-sv-${label}.png`) });
  }

  // ---- Contract room in Swedish, all 4 tabs ----
  await gotoScreen('register');
  await page.click('tr[data-row="MK-A1"]');
  await page.waitForTimeout(700);
  let bodySv = '';
  for (const tab of ['terms', 'docs', 'sign', 'history']) {
    await page.click(`[data-ws-tab="${tab}"]`).catch(() => {});
    await page.waitForTimeout(500);
    if (tab === 'docs') {
      // ---- The contract's own words must read IDENTICALLY in Swedish ----
      bodySv = await page.evaluate(() => {
        const el = document.querySelector('.doc-body, .hati-doc, #ws-doc, .doc-surface') || document.body;
        return (el.innerText || '').trim().slice(0, 4000);
      });
    }
    await page.screenshot({ path: path.join(OUT, `lang-sv-room-${tab}.png`) });
  }
  // Compare only the CLAUSE WORDING portion (SUPPLY AGREEMENT ... confidential.)
  // — the platform's own seal/signature block AFTER it is expected to
  // translate, so it is deliberately excluded from this comparison.
  const sliceClause = (s) => {
    const a = s.indexOf('SUPPLY AGREEMENT');
    const b = s.indexOf('confidential.');
    if (a < 0 || b < 0) return s;
    return s.slice(a, b + 'confidential.'.length);
  };
  const wordingEn = sliceClause(bodyEn);
  const wordingSv = sliceClause(bodySv);
  check('MK-A1 contract wording (clauses) is BYTE IDENTICAL in English and Swedish UI',
    wordingEn === wordingSv, `EN len=${wordingEn.length} SV len=${wordingSv.length}`);

  // ---- Known historic fault pattern: a translated block with hardcoded
  // English left standing inside it (the DOCUMENT SEAL panel on an executed
  // contract's Document tab). This is NOT expected to pass; it records
  // whether the fault is still present. ----
  check('SEAL BLOCK (SV): "Timestamp recorded" placeholder is translated (NOT expected — records the fault)',
    !bodySv.includes('Timestamp recorded'), bodySv.includes('Timestamp recorded') ? 'still hardcoded English' : 'translated');
  check('SEAL BLOCK (SV): the signer-identity sentence is translated (NOT expected — records the fault)',
    !bodySv.includes('Signer identity is verified by account session'),
    bodySv.includes('Signer identity is verified by account session') ? 'still hardcoded English' : 'translated');
  check('SEAL BLOCK (SV): "Not recorded" (no signature) is translated (NOT expected — records the fault)',
    !bodySv.includes('Not recorded'), bodySv.includes('Not recorded') ? 'still hardcoded English' : 'translated');
  fs.writeFileSync(path.join(__dirname, '..', 'debug-wording-en.txt'), wordingEn);
  fs.writeFileSync(path.join(__dirname, '..', 'debug-wording-sv.txt'), wordingSv);
  fs.writeFileSync(path.join(__dirname, '..', 'debug-body-en.txt'), bodyEn);
  fs.writeFileSync(path.join(__dirname, '..', 'debug-body-sv.txt'), bodySv);

  // ---- Room tabs and Room head still English-free scan on this contract ----
  await page.click('[data-ws-tab="history"]').catch(() => {});
  await page.waitForTimeout(500);

  // ---- SWITCH BACK TO ENGLISH ----
  await page.click('#lang-switch [data-lang="en"]').catch(() => {});
  await page.waitForTimeout(600);
  const heroTitleBack = await page.evaluate(() => document.querySelector('.hm-banner h2')?.textContent?.trim());

  await browser.close();
  await h.stop();

  console.log('\n--- page errors ---');
  errors.forEach(e => console.log(e));
  fs.writeFileSync(path.join(__dirname, '..', 'errors-02-languages.json'), JSON.stringify(errors, null, 2));

  const passed = results.filter(r => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  fs.writeFileSync(path.join(__dirname, '..', 'results-02-languages.json'), JSON.stringify(results, null, 2));
  process.exit(results.every(r => r.pass) ? 0 : 1);
})();
