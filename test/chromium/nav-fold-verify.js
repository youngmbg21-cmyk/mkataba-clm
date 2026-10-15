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
   RE-POINTED AT STEP 7 OF THE OVERNIGHT WORK ORDER (15 Oct 2026): the fold
   keeps only Negotiations and Parties; its Contracts item went, and the
   opener — which keeps its name — is the Contracts door: a press opens Home's
   Contracts place and the fly-out (pressed again, the fly-out shuts). So 1,
   2a and 7 read two items and no Contracts item; 3c presses the opener; 5b is
   read on the place; the keyboard lands on Negotiations, ↓ on Parties.
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
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 1 && !!document.querySelector('[data-nav-fold-open="register"]'), null, { timeout: 20000 });
    await page.waitForTimeout(400);
  };
  const read = page => page.evaluate(VIS => { const vis = eval(VIS);
    const q = v => document.querySelector(`#side-nav .nav-item[data-view="${v}"]`);
    const head = document.querySelector('#side-nav [data-nav-fold-open="register"]');
    const dot = document.querySelector('#side-nav [data-fold-dot]');
    const n = document.querySelector('#side-nav [data-count="negotiations"]');
    const side = document.getElementById('side-nav'), ap = q('approvals');
    const tops = ['redline', 'customers'].map(v => vis(q(v)) ? q(v).getBoundingClientRect().top : null);
    return { head: vis(head), contracts: vis(q('register')), item: !!q('register'), nego: vis(q('redline')), parties: vis(q('customers')),
      items: [...document.querySelectorAll('#side-nav .nav-fold .nav-sub .nav-item')].filter(b => b.closest('.nav-fold').getAttribute('data-nav-fold') === 'register').map(b => b.getAttribute('data-view')),
      order: tops.every(t => t != null) ? tops[0] < tops[1] : null,
      right: vis(q('redline')) && side ? q('redline').getBoundingClientRect().left >= side.getBoundingClientRect().right - 1 : null,
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
    check('1. at rest the Contracts row is shown; Negotiations and Parties are not; the fold holds no Contracts item', rest.head && !rest.item && !rest.nego && !rest.parties && rest.items.join() === 'redline,customers', JSON.stringify(rest));
    check('4a. shut, the amber dot says a negotiation waits on you, as the count does', rest.owed && rest.dot, JSON.stringify({ dot: rest.dot, owed: rest.owed, n: rest.n }));
    await page.screenshot({ path: path.join(OUT, '1-rest.png'), clip: { x: 0, y: 0, width: 420, height: 600 } });
    await page.hover('[data-nav-fold-open="register"]');
    const hov = await until(() => document.querySelector('.nav-fold.is-hover') ? true : null).then(() => read(page));
    check('2a. the pointer on Contracts opens Negotiations, Parties in that order, and nothing else', !hov.item && hov.nego && hov.parties && hov.order === true, JSON.stringify(hov));
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
    await page.click('#side-nav [data-nav-fold-open="register"]');
    /* RE-POINTED 15 Oct 2026 (the checkers of step 7): a mouse press is the
       Contracts DOOR and nothing else — the fly-out it used to leave open
       covered the place's own head (its name, facts and stage tabs) */
    const reg = await until(() => state.view === 'dashboard' && document.querySelector('[data-reg-home]') ? true : null);
    await page.waitForTimeout(150);
    const pressed = await read(page);
    check('3c. a mouse press on the Contracts row opens Home\'s Contracts place, and the fly-out steps aside while the pointer rests there', !!reg && !pressed.nego && !pressed.parties,
      JSON.stringify({ reg: !!reg, nego: pressed.nego, parties: pressed.parties }));
    await away();
    await page.hover('[data-nav-fold-open="register"]');
    const back = await until(() => document.querySelector('.nav-fold.is-hover') ? true : null).then(() => read(page));
    check('3d. the pointer leaves and comes back: the fly-out opens on the hover again, and the place stays', back.nego && back.parties && await page.evaluate(() => !!document.querySelector('[data-reg-home]')), JSON.stringify(back));
    await away();
    const onReg = await read(page);
    check('5b. on the Contracts place too: "you are here" on the row, fly-out shut', onReg.current && !onReg.nego, JSON.stringify(onReg));
    /* THE CHECKERS' OWN WALK, on the 1536 laptop (the rail docked, the
       fly-out level with the place's tabs): from the Board, Contracts pressed
       with the mouse, then Drafting — the press lands on the tab, never on the
       fly-out's Parties */
    await page.setViewportSize({ width: 1536, height: 730 }); await page.waitForTimeout(400);
    await page.evaluate(() => document.querySelector('#side-nav .nav-item[data-view="dashboard"]').click());
    await until(() => state.view === 'dashboard' && window.hbFace && hbFace() === 'board' ? true : null);
    await page.click('#side-nav [data-nav-fold-open="register"]');
    await until(() => document.querySelector('[data-reg-home] [data-reg-stage="Draft"]') ? true : null);
    await page.click('[data-reg-home] [data-reg-stage="Draft"]', { timeout: 5000 }).catch(() => {});
    const drafted = await until(() => state.view === 'dashboard' && document.querySelector('[data-reg-home]') && (state.reg || {}).stage === 'Draft' ? { view: state.view, stage: state.reg.stage } : null, null, 4000)
      || await page.evaluate(() => ({ view: state.view, stage: (state.reg || {}).stage, place: !!document.querySelector('[data-reg-home]') }));
    check('3e. at 1536×730, Contracts then Drafting lands on the Drafting tab of the place, not on Parties', drafted.view === 'dashboard' && drafted.stage === 'Draft', JSON.stringify(drafted));
    await page.evaluate(() => regGoFiltered()); await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(400);
    /* the keyboard */
    await page.focus('#side-nav [data-nav-fold-open="register"]');
    await page.keyboard.press('Enter');
    const kb = await until(() => document.querySelector('.nav-fold.is-open') && (document.activeElement || {}).getAttribute && document.activeElement.getAttribute('data-view') ? document.activeElement.getAttribute('data-view') : null);
    check('6a. Enter opens it and puts the keyboard on its first door, Negotiations', kb === 'redline', String(kb));
    await page.keyboard.press('ArrowDown');
    const kb2 = await page.evaluate(() => (document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('data-view') : null);
    check('6b. ↓ moves to Parties', kb2 === 'customers', String(kb2));
    await page.keyboard.press('Escape');
    const kb3 = await until(() => !document.querySelector('.nav-fold.is-open') ? true : null);
    check('6c. Esc shuts it', !!kb3);

    const touch = await (await browser.newContext({ viewport: { width: 1280, height: 900 }, hasTouch: true, isMobile: true })).newPage();
    await login(touch);
    const t0 = await read(touch);
    await touch.tap('#side-nav [data-nav-fold-open="register"]').catch(() => touch.click('#side-nav [data-nav-fold-open="register"]'));
    await touch.waitForTimeout(400);
    const t1 = await read(touch);
    check('7. a screen with no hover: a tap on the row opens the fly-out', !t0.nego && t1.nego && t1.parties && !t1.item, JSON.stringify({ before: t0.nego, after: t1 }));
  } catch (e) {
    console.log('ERROR', e && e.stack || e); failures++;
  } finally {
    check('8. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
