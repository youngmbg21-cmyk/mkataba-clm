/* Chromium verification: CONTRACTS OPENS TO THE RIGHT
   ============================================================
   Owner, 10 Oct 2026: "the subfolders are supposed to protrude outward on the
   right not below just like in the image attached" (the Windows menu), and
   "add one folder to hover like the other 2 that says Contracts also which is
   where the contracts page will be". Earlier the same day: Customers is named
   Parties, and an amber dot on Contracts while a negotiation waits on you.
   At 1440 x 900, and the wide menu at 1680:
     1. at rest the Contracts row is shown; Contracts, Negotiations and
        Parties are not
     2. the pointer on the row opens a fly-out to the RIGHT of the menu with
        Contracts, Negotiations, Parties in that order, and nothing below the
        row moves
     3. Parties reads Parties, on the door and on its page; the fly-out's
        Contracts opens the Contracts page
     4. shut, the amber dot says what the Negotiations count says; open, it
        steps aside
     5. on any of the three pages the row wears "you are here" and the
        fly-out stays shut once the pointer leaves
     6. the keyboard opens it (Enter), moves in it, and Esc shuts it
     7. a screen with no hover opens it with a tap on the row
     8. no page errors
   Waits ask for the state, bounded. Red at unmodified main (2, 3b, 5, 6, 7).
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
    const head = document.querySelector('#side-nav [data-nav-fold-open="register"]');
    const dot = document.querySelector('#side-nav [data-fold-dot]');
    const n = document.querySelector('#side-nav [data-count="negotiations"]');
    const side = document.getElementById('side-nav'), ap = q('approvals');
    const tops = ['register', 'redline', 'customers'].map(v => vis(q(v)) ? q(v).getBoundingClientRect().top : null);
    return { head: vis(head), contracts: vis(q('register')), nego: vis(q('redline')), parties: vis(q('customers')),
      order: tops.every(t => t != null) ? tops[0] < tops[1] && tops[1] < tops[2] : null,
      right: vis(q('register')) && side ? q('register').getBoundingClientRect().left >= side.getBoundingClientRect().right - 1 : null,
      apTop: ap ? Math.round(ap.getBoundingClientRect().top) : null,
      current: !!(head && head.classList.contains('is-current')),
      word: ((q('customers') || {}).textContent || '').trim(), dot: vis(dot), owed: !!n && n.getAttribute('data-tone') === 'amber', n: n ? n.textContent : '' };
  }, VIS);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await login(page);
    const until = async (fn, arg, ms = 6000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(100); }
      return v; };
    const away = async () => { await page.mouse.move(900, 500); await page.evaluate(() => { if (document.activeElement) document.activeElement.blur(); }); await page.waitForTimeout(450); };
    await away();
    const rest = await read(page);
    check('1. at rest the Contracts row is shown; Contracts, Negotiations and Parties are not', rest.head && !rest.contracts && !rest.nego && !rest.parties, JSON.stringify(rest));
    check('4a. shut, the amber dot says a negotiation waits on you, as the count does', rest.owed && rest.dot, JSON.stringify({ dot: rest.dot, owed: rest.owed, n: rest.n }));
    await page.screenshot({ path: path.join(OUT, '1-rest.png'), clip: { x: 0, y: 0, width: 420, height: 600 } });
    await page.hover('[data-nav-fold-open="register"]');
    const hov = await until(() => document.querySelector('.nav-fold.is-hover') ? true : null).then(() => read(page));
    check('2a. the pointer on Contracts opens Contracts, Negotiations, Parties in that order', hov.contracts && hov.nego && hov.parties && hov.order === true, JSON.stringify(hov));
    check('2b. …to the RIGHT of the menu, not below it', hov.right === true, JSON.stringify(hov));
    check('2c. nothing below the row moves', hov.apTop === rest.apTop, `${rest.apTop} → ${hov.apTop}`);
    check('3a. the door reads Parties', /^Parties/.test(hov.word), hov.word);
    check('4b. open, the dot steps aside', !hov.dot);
    await page.screenshot({ path: path.join(OUT, '2-hover.png'), clip: { x: 0, y: 0, width: 420, height: 600 } });
    /* the pointer travels across the gap onto the fly-out and presses */
    await page.click('#side-nav .nav-item[data-view="customers"]');
    const title = await page.waitForFunction(() => state.view === 'customers' && ((document.getElementById('shell-title') || {}).textContent || '').trim(), null, { timeout: 8000 }).then(x => x.jsonValue()).catch(() => '');
    check('3b. the page is named Parties', /Parties/.test(title), title);
    await away();
    const onPage = await read(page);
    check('5a. on the Parties page the row wears "you are here", and the fly-out is shut', onPage.current && !onPage.parties && !onPage.nego, JSON.stringify(onPage));
    await page.hover('[data-nav-fold-open="register"]');
    await until(() => document.querySelector('.nav-fold.is-hover') ? true : null);
    await page.click('#side-nav .nav-item[data-view="register"]');
    const reg = await until(() => state.view === 'register' ? true : null);
    check('3c. the fly-out\'s Contracts opens the Contracts page', !!reg);
    await away();
    const onReg = await read(page);
    check('5b. on Contracts too: "you are here" on the row, fly-out shut', onReg.current && !onReg.contracts, JSON.stringify(onReg));
    /* the keyboard */
    await page.focus('#side-nav [data-nav-fold-open="register"]');
    await page.keyboard.press('Enter');
    const kb = await until(() => document.querySelector('.nav-fold.is-open') && (document.activeElement || {}).getAttribute && document.activeElement.getAttribute('data-view') ? document.activeElement.getAttribute('data-view') : null);
    check('6a. Enter opens it and puts the keyboard on Contracts', kb === 'register', String(kb));
    await page.keyboard.press('ArrowDown');
    const kb2 = await page.evaluate(() => (document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('data-view') : null);
    check('6b. ↓ moves to Negotiations', kb2 === 'redline', String(kb2));
    await page.keyboard.press('Escape');
    const kb3 = await until(() => !document.querySelector('.nav-fold.is-open') ? true : null);
    check('6c. Esc shuts it', !!kb3);

    const touch = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: true })).newPage();
    await login(touch);
    const t0 = await read(touch);
    await touch.tap('#side-nav [data-nav-fold-open="register"]').catch(() => touch.click('#side-nav [data-nav-fold-open="register"]'));
    await touch.waitForTimeout(400);
    const t1 = await read(touch);
    check('7. a screen with no hover: a tap on the row opens the fly-out', !t0.nego && t1.contracts && t1.nego && t1.parties, JSON.stringify({ before: t0.nego, after: t1 }));
  } catch (e) {
    console.log('ERROR', e && e.stack || e); failures++;
  } finally {
    check('8. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
