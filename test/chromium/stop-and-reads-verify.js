/* STOP MEANS STOP, AND "reads" IS A PAGE (the owner, 28 Oct 2026: "when it is running and I press stop it does not
   work"; "when I type reads it goes to AI brain"). On 40 contracts with the stand-in slowed to 1.5 s a contract:
     1 · "reads" typed in Home's box opens the Reads page, and no Jambo call is made
     2 · Stop pressed mid-read: the card says it stopped within a second, the cells that were spinning say
         "not read yet" at once, and no further contract reaches the stand-in after the press (the few already
         with it finish on the server and are kept)
     3 · Carry on reads only the rest: what was with Jambo at the press costs nothing again
   At the parent (before this change) 1 fails (the brain answers) and 2 fails (Stopping… until the ten finish). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');
const OUT = process.env.STOP_SHOTS || path.join(__dirname, 'shots', 'stop-and-reads');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 15000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const BODY = p => `SUPPLY AGREEMENT\n\nThis Supply Agreement is made between Highland Corporate Ltd and ${p}.\n\n9. Termination\nEither party may end this agreement on thirty days' written notice to the other.`;
const book = n => Array.from({ length: n }, (_, i) => fixtureContract(`HC-${3001 + i}`, 'Supply Agreement', ['Kabras Sugar', 'Nandi Dairy', 'Juno Logistics'][i % 3], 'proc', 12000000, 'Signed', BODY('Kabras Sugar')));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ AI_RATE_DEEP: '200' });
  await seedWorkspace(h, { contracts: book(40) });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    const errors = []; page.on('pageerror', e => errors.push(String(e && e.message || e)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length >= 40 && typeof window.askColOpen === 'function', null, 40000);
    await page.waitForTimeout(1000);

    /* ---- 1 "reads" typed ---- */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Reads page is the new Discover (#rd-page, dsnRender) */
    await page.evaluate(() => setView('counter'));
    const box = await until(page, () => !!document.querySelector('#igd-input'), null, 10000);
    const c0 = h.ai.calls.length;
    if (box){ await page.fill('#igd-input', 'reads'); await page.press('#igd-input', 'Enter'); }
    const onReads = await until(page, () => state.view === 'reads' && !!document.querySelector('#rd-page'), null, 8000);
    check('1 "reads" typed in Home\'s box opens the Reads page, and no Jambo call is made', box && onReads && h.ai.calls.length === c0,
      await page.evaluate(() => ({ view: state.view })));

    /* ---- 2 Stop ---- */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; THE NEW DISCOVER, owner 15 Nov 2026): a read is asked
       from Discover's New read (#dsc-q, every contract chosen, #dsc-go) and stands on its own screen with Stop (#dsc-stop);
       stopped, the same place offers the rest ("Read the N left", #dsc-carry). No column card on Contracts any more. */
    await until(page, () => !!document.getElementById('dsn-new'), null, 10000);
    await page.click('#dsn-new');
    await until(page, () => !!document.getElementById('dsc-q') && !!document.querySelector('#rd-page [data-dsn-pick="all"]'), null, 8000);
    await page.click('#rd-page [data-dsn-pick="all"]');
    await page.fill('#dsc-q', 'How much notice does each side need to end the contract?');
    await until(page, () => /^Read 40 contracts$/.test(((document.getElementById('dsc-go') || {}).innerText || '').trim()), null, 5000);
    h.ai.slow(1500);
    await page.click('#dsc-go');
    const going = await until(page, () => !!AC.busy && AC.busy.done >= 1 && !!document.getElementById('dsc-stop'), null, 20000);
    const t0 = Date.now();
    await page.click('#dsc-stop');
    const stopped = await until(page, () => !document.getElementById('dsc-stop') && !!document.getElementById('dsc-carry'), null, 20000);
    const took = Date.now() - t0;
    /* WHAT WAS WITH JAMBO AT THE PRESS is counted once the server has heard it (a beat after the screen): the few already
       handed to Jambo finish and are kept. A server that ignored the Stop starts another four within 1.5 s, which the 4 s
       wait below still catches. */
    await page.waitForTimeout(300);
    const atPress = h.ai.calls.length;
    await page.screenshot({ path: path.join(OUT, 'stopped-1440x780.png') });
    check('2 Stop: the read says it stopped within a second', going && stopped && took < 1000, { took });
    /* RETIRED 16 Nov 2026 (#762): 2a "the cells that were spinning say not read yet at once" — the column's cells on
       Contracts are not drawn in the new look; a read in progress is its own screen, with no cells */
    await page.waitForTimeout(4000);
    check('2b no further contract reaches the stand-in after the press', h.ai.calls.length === atPress, { atPress, after: h.ai.calls.length });
    const said = await page.evaluate(() => { const k = Object.keys(AC.ans || {}).pop(); return { carry: ((document.getElementById('dsc-carry') || {}).innerText || '').trim(), read: k ? Object.keys(AC.ans[k] || {}).length : 0 }; });
    const m = /^Read the (\d+) left$/.exec(said.carry);
    check('2c it says what is left of the 40, and the rest is kept', !!m && said.read > 0 && said.read < 40 && Number(m[1]) === 40 - said.read, said);

    /* ---- 3 Carry on ---- */
    h.ai.slow(0);
    const before = h.ai.calls.length;
    await page.click('#dsc-carry');
    const done = await until(page, () => !AC.busy && !document.getElementById('dsc-carry') && !document.getElementById('dsc-stop'), null, 60000);
    const ans = await page.evaluate(() => { const k = Object.keys(AC.ans || {}).pop(); return k ? Object.keys(AC.ans[k] || {}).length : 0; });
    check('3 Carry on reads only the rest: every contract answered, the rest read once each', done && ans === 40 && (h.ai.calls.length - before) === 40 - atPress,
      { ans, readAfter: h.ai.calls.length - before, kept: said.read, atPress });
    check('no page errors', !errors.length, errors.join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${fails ? fails + ' FAILED' : 'ALL PASS'}`);
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
