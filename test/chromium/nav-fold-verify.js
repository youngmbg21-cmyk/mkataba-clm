/* Chromium verification: NEGOTIATIONS AND PARTIES FOLD UNDER CONTRACTS
   ============================================================
   Owner, 10 Oct 2026: "when you hover over the contract tab in the nav panel,
   2 sub-folders will appear the 1st one being the negotiation folder and the
   second would be the customers folder but rename customers to "Parties".
   That means the two folders will then not be seen in the nav panel without
   hovering over the contracts folder" — and yes to an amber dot on Contracts
   while a negotiation waits on the reader.
   At 1440 x 900:
     1. at rest the two doors are not shown; Contracts is
     2. the pointer on Contracts shows Negotiations then Parties under it
     3. Customers reads Parties, on the door and on its page
     4. folded, the amber dot on Contracts says what the Negotiations count
        says; open, the dot steps aside
     5. on the Negotiations page the group stays open with the pointer away
     6. the keyboard on Contracts opens the group
     7. a screen with no hover shows the two doors always
     8. no page errors
   Waits ask for the state, bounded. Red at unmodified main (1, 2, 3, 4).
   Run: node test/chromium/nav-fold-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const { startHati, seedWorkspace } = H;
/* one negotiation waiting on us: their change, not yet answered */
const LIVE = { ...H.fixtureContract('MK-NF1', 'Raw Milk Collection', 'Nandi Dairy Co-operative', H.FOLDER_A, 36000000, 'Under Review'),
  negotiation: { round: 2, rounds: [{ n: 1, at: '2026-01-05' }] },
  changes: [{ id: 'CHG-1', clauseId: 'cl_a2', clauseLabel: 'Article 2 Price', changeType: 'edit', status: 'pending', authorSide: 'counterparty', summary: 'Price reviewed every month', createdAt: '2026-01-06', roundN: 2 }] };

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'nav-fold');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const VIS = `el => !!el && el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden'`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: [LIVE], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const login = async page => {
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 1 && !!document.querySelector('.nav-item[data-view="register"]'), null, { timeout: 20000 });
    await page.waitForTimeout(400);
  };
  const read = page => page.evaluate(VIS => { const vis = eval(VIS);
    const q = v => document.querySelector(`#side-nav .nav-item[data-view="${v}"]`);
    const dot = document.querySelector('#side-nav [data-fold-dot]');
    const n = document.querySelector('#side-nav [data-count="negotiations"]');
    return { contracts: vis(q('register')), nego: vis(q('redline')), parties: vis(q('customers')),
      order: vis(q('redline')) && vis(q('customers')) ? (q('register').getBoundingClientRect().top < q('redline').getBoundingClientRect().top && q('redline').getBoundingClientRect().top < q('customers').getBoundingClientRect().top) : null,
      word: ((q('customers') || {}).textContent || '').trim(), dot: vis(dot), owed: !!n && n.getAttribute('data-tone') === 'amber', n: n ? n.textContent : '' };
  }, VIS);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await login(page);
    await page.mouse.move(900, 500);
    await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); });
    const rest = await read(page);
    check('1. at rest Contracts is shown, Negotiations and Parties are not', rest.contracts && !rest.nego && !rest.parties, JSON.stringify(rest));
    check('4a. folded, the amber dot says a negotiation waits on you, as the count does', rest.owed && rest.dot, JSON.stringify({ dot: rest.dot, owed: rest.owed, n: rest.n }));
    await page.screenshot({ path: path.join(OUT, '1-rest.png'), clip: { x: 0, y: 0, width: 340, height: 600 } });
    await page.hover('#side-nav .nav-item[data-view="register"]');
    const hov = await read(page);
    check('2. the pointer on Contracts shows Negotiations, then Parties, under it', hov.nego && hov.parties && hov.order === true, JSON.stringify(hov));
    check('3a. the door reads Parties', /^Parties/.test(hov.word), hov.word);
    check('4b. open, the dot steps aside', !hov.dot);
    await page.screenshot({ path: path.join(OUT, '2-hover.png'), clip: { x: 0, y: 0, width: 340, height: 600 } });
    /* the pointer can travel down onto the doors and press one */
    await page.click('#side-nav .nav-item[data-view="customers"]');
    const title = await page.waitForFunction(() => state.view === 'customers' && ((document.getElementById('shell-title') || {}).textContent || '').trim(), null, { timeout: 8000 }).then(x => x.jsonValue()).catch(() => '');
    check('3b. the page is named Parties', /Parties/.test(title), title);
    await page.mouse.move(900, 500);
    await page.waitForTimeout(200);
    const onPage = await read(page);
    check('5a. on the Parties page the group stays open with the pointer away', onPage.nego && onPage.parties, JSON.stringify(onPage));
    await page.evaluate(() => setView('redline'));
    await page.waitForTimeout(500);
    const onNego = await read(page);
    check('5b. on the Negotiations page too', onNego.nego && onNego.parties, JSON.stringify(onNego));
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(500);
    await page.mouse.move(900, 500);
    const back = await read(page);
    check('5c. on Contracts itself the group folds again', !back.nego && !back.parties, JSON.stringify(back));
    /* the keyboard, not the mouse: Tab onto Contracts from the item above */
    await page.focus('#side-nav .nav-item[data-view="dashboard"]');
    await page.keyboard.press('Tab');
    const kb = await read(page);
    check('6. the keyboard on Contracts opens the group', kb.nego && kb.parties, JSON.stringify(kb));

    const touch = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: true })).newPage();
    await login(touch);
    const noHover = await touch.evaluate(() => matchMedia('(hover: none)').matches);
    const t = await read(touch);
    check('7. a screen with no hover shows both doors', !noHover || (t.nego && t.parties), JSON.stringify({ noHover, ...t }));
  } catch (e) {
    console.log('ERROR', e && e.stack || e); failures++;
  } finally {
    check('8. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
