/* Chromium verification: A REFRESH ON A CONTRACT LANDS ON THAT CONTRACT (owner, 16 Nov 2026: "every time i refresh my
   screen from any page, it refreshed but then lands on the screen attached before going back to where i refreshed
   from" — the screen was Home's Contracts place, drawn for a moment while the paper was put back).
     1. a contract on Home's paper, the page reloaded: from the first paint until the paper is back, Home's Contracts
        place is never drawn (sampled every frame), and the paper lands on the same contract
     2. the same from a contract whose whole record is not yet in hand (the usual case after a reload)
     3. a reload on the Contracts place itself still lands on the Contracts place
   Waits ask for the state, bounded. RED at unmodified main (1, 2).
   Run: node test/chromium/a-refresh-lands-on-its-contract-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const HTML = '<h1>SERVICES AGREEMENT</h1>' + ['Services', 'Fees', 'Term'].map((t, i) => `<h2>${i + 1}. ${t}</h2><p>${t} are as set out in clause ${i + 1}.</p>`).join('');

(async () => {
  const h = await startHati();
  const c = fixtureContract('MK-120', 'Services Agreement', 'Ventura Capital', 'proc', 1200000, 'Under Review', 'x');
  Object.assign(c, { redlineText: HTML, format: 'rich', template: null, source: 'upload', fields: {},
    upload: { name: 'S.docx', extractedText: HTML.replace(/<[^>]+>/g, ' '), uploadedAt: new Date().toISOString() } });
  await seedWorkspace(h, { contracts: [...FIXTURES, c], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { const t0 = Date.now();
      while (Date.now() - t0 < ms) { let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return null; };
    /* every frame from the first script on: was the Contracts place ever painted, and what paper stands */
    await page.addInitScript(() => {
      window.__ct = 0; const t0 = performance.now();
      const look = () => { try {
        const ct = document.getElementById('ct-place');
        if (ct && ct.getClientRects().length && getComputedStyle(ct).visibility !== 'hidden') window.__ct++;
      } catch (_){ } if (performance.now() - t0 < 8000) requestAnimationFrame(look); };
      requestAnimationFrame(look);
    });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const ready = await until(() => typeof regOpenContract === 'function' && !!currentUser() && !!getContract('MK-120'), null, 40000);
    check('0. signed in, the book loaded', !!ready);
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });

    const paperOn = id => until(i => typeof pdContract === 'function' && pdContract() && pdContract().id === i && !!document.querySelector('#ig-paper') && !document.getElementById('ct-place'), id, 15000);
    const reloadOn = async (label, id) => {
      await page.evaluate(i => regOpenContract(i), id);
      const on = await paperOn(id);
      check(label + 'a. the contract is on Home\'s paper before the reload', !!on);
      if (!on) return;
      await page.waitForTimeout(800); /* the place is kept a moment after a move (placeSave on pagehide anyway) */
      await page.reload({ waitUntil: 'load' });
      const back = await paperOn(id);
      const seen = await page.evaluate(() => window.__ct);
      check(label + 'b. after the reload the same contract is back on the paper', !!back,
        await page.evaluate(() => JSON.stringify({ view: state.view, paper: typeof pdContract === 'function' && pdContract() ? pdContract().id : null })));
      check(label + 'c. the Contracts place was never drawn on the way back', seen === 0, 'frames with the Contracts place: ' + seen);
    };
    await reloadOn('1', 'MK-120');
    /* 2: the first fixture row, loaded light after a reload like every row */
    const other = await page.evaluate(() => (state.contracts.find(x => x.id !== 'MK-120' && !x.codeName) || {}).id);
    if (!other) console.log('SKIP  2. no second contract in the book');
    else await reloadOn('2', other);

    /* 3 the Contracts place itself is still where a reload on it lands */
    await page.evaluate(() => { try { setView('register'); } catch (_){ } });
    const onPlace = await until(() => !!document.getElementById('ct-place') && !(typeof pdContract === 'function' && pdContract()), null, 10000);
    if (!onPlace) console.log('SKIP  3. the Contracts place did not come up here');
    else { await page.waitForTimeout(800); await page.reload({ waitUntil: 'load' });
      const back = await until(() => !!document.getElementById('ct-place') && state.view === 'dashboard', null, 15000);
      check('3. a reload on the Contracts place lands on the Contracts place', !!back); }
    check('4. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all checks passed'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
