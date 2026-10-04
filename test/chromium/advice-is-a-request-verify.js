/* ============================================================
   advice-is-a-request-verify — gap F of the process review (4 Oct 2026),
   driven in a real Chromium against a real server. Advice is a kind of
   request: the Advice desk's rail door is gone, and the desk is the Advice
   tab of Requests. A DOOR MERGE, NOT A DATA MERGE.
     1 · the rail has no Advice door, and the Requests door carries the total
         the two doors carried (contract requests + open advice requests);
     2 · Requests opens on the Contracts tab; each tab carries its own half,
         and the door is the sum of the two;
     3 · a press on Advice draws the Advice desk board, under the page's
         name, with Requests lit on the rail;
     4 · the tab row does not move between the two tabs, wide and narrow;
     5 · a refresh on the Advice tab comes back to the Advice tab;
     6 · the old view id still lands there from anywhere, and Contracts
         goes back;
     7 · a new advice request moves the door and the tab together, with no
         page change;
     8 · the public portal and its tracking page are untouched.
   Run: node test/chromium/advice-is-a-request-verify.js
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'advice-is-a-request');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
const until = async (page, fn, arg, ms = 8000) => {
  try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; }
};
/* What the page says right now: which view, which door is lit, the door's
   number, the two tabs and their numbers, the head's title, and where the
   tab row sits. Every half guarded, so a missing feature reports. */
const READ = () => {
  const door = document.querySelector('#side-nav .nav-item[data-view="intake"]');
  const n = el => (el && !el.hidden && el.textContent.trim()) ? Number(el.textContent.trim().replace(/\D/g, '')) : 0;
  const row = document.querySelector('#content .rq-kinds');
  const tab = k => document.querySelector(`#content [data-rq-kind="${k}"]`);
  return {
    view: state.view,
    lit: [...document.querySelectorAll('#side-nav .nav-item[aria-current="page"]')].map(b => b.getAttribute('data-view')),
    adviceDoor: !!document.querySelector('#side-nav [data-view="advice"]'),
    doorN: door ? n(door.querySelector('[data-count="intake"]')) : null,
    tabs: [...document.querySelectorAll('#content [data-rq-kind]')].map(b => b.getAttribute('data-rq-kind')),
    on: (document.querySelector('#content [data-rq-kind].on') || {}).getAttribute ? document.querySelector('#content [data-rq-kind].on').getAttribute('data-rq-kind') : null,
    nContracts: n(tab('contracts') && tab('contracts').querySelector('[data-rq-n]')),
    nAdvice: n(tab('advice') && tab('advice').querySelector('[data-rq-n]')),
    title: ((document.querySelector('#page-head h1') || {}).textContent || '').trim(),
    rowTop: row ? Math.round(row.getBoundingClientRect().top) : null,
    rowLeft: row ? Math.round(row.getBoundingClientRect().left) : null,
    board: document.querySelectorAll('#content [data-adv-drop]').length,
    cards: document.querySelectorAll('#content [data-adv-card]').length,
    ikPage: !!document.querySelector('#content [data-ins-page="intake"]'),
    intakeN: typeof intakeCount === 'function' ? intakeCount() : null,
    adviceN: typeof adviceActiveCount === 'function' ? adviceActiveCount() : null,
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Young Mbagaya');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

    /* THE BOOK: three customer advice requests through the PUBLIC route (one
       later delivered, so two are open), and two contract requests from a
       colleague. */
    const anon = h.client('customer');
    const tokens = [];
    for (const [i, svc] of [['1', 'review'], ['2', 'draft'], ['3', 'advice']]) {
      const r = await anon.json('/api/advice/requests', { method: 'POST', body: {
        service: svc, name: 'Customer ' + i, email: `c${i}@example.co.ke`, description: 'Please look at our supply agreement ' + i + '.' } });
      tokens.push(r.request);
    }
    await page.evaluate(async id => {
      try { await api('users', 'POST', { name: 'Faith Njeri', email: 'faith@highland.co.ke', role: 'viewer', password: 'memberpass123' }); } catch (e) {}
      await api('advice/requests/' + id, 'PUT', { status: 'Delivered' });
    }, tokens[2].id);
    const faith = h.client('faith');
    await faith.json('/api/login', { method: 'POST', body: { email: 'faith@highland.co.ke', password: 'memberpass123' } });
    await faith.json('/api/password/change', { method: 'POST', body: { current: 'memberpass123', password: 'faiths-own-pass-9' } });
    for (const t of ['Cold-chain storage for the coast', 'Courier services for Kisumu'])
      await faith.json('/api/intake', { method: 'POST', body: { title: t, need: t + ' — please draft it.' } });
    await page.evaluate(async () => { await loadAdviceRequests(); await intakeRefresh(); updateSidebarCounts(); });

    /* ---- 1 · THE RAIL ---- */
    await page.evaluate(() => setView('dashboard')); await page.waitForTimeout(900);
    let s = await page.evaluate(READ);
    ok('1a the rail has no Advice desk door', s.adviceDoor === false);
    ok('1b [control] the two books are real: two contract requests, two open advice requests',
      s.intakeN === 2 && s.adviceN === 2, { intake: s.intakeN, advice: s.adviceN });
    ok('1c the Requests door carries the total the two doors carried', s.doorN === s.intakeN + s.adviceN,
      { door: s.doorN, intake: s.intakeN, advice: s.adviceN });

    /* ---- 2 · REQUESTS OPENS ON CONTRACTS ---- */
    await page.click('#side-nav .nav-item[data-view="intake"]');
    await until(page, () => state.view === 'intake' && !!document.querySelector('#content .rq-kinds'));
    s = await page.evaluate(READ);
    ok('2a Requests draws the kind tabs, Contracts then Advice', s.tabs.join(',') === 'contracts,advice', s.tabs);
    ok('2b it opens on Contracts, with the queue under it', s.on === 'contracts' && s.ikPage, { on: s.on, ikPage: s.ikPage });
    ok('2c each tab carries its own half', s.nContracts === s.intakeN && s.nAdvice === s.adviceN,
      { contracts: s.nContracts, advice: s.nAdvice });
    ok('2d the door is the sum of the tabs it opens', s.doorN === s.nContracts + s.nAdvice,
      { door: s.doorN, tabs: s.nContracts + s.nAdvice });
    const wideContracts = s.rowTop, wideLeft = s.rowLeft;
    await page.screenshot({ path: path.join(OUT, '2-contracts.png') });

    /* ---- 3 · THE ADVICE TAB ---- */
    const adv = await page.$('#content [data-rq-kind="advice"]');
    if (adv) await adv.click();
    await until(page, () => state.view === 'advice' && document.querySelectorAll('#content [data-adv-drop]').length > 0);
    s = await page.evaluate(READ);
    ok('3a a press on Advice draws the Advice desk board — all five stages, every request',
      s.view === 'advice' && s.board === 5 && s.cards === 3, { view: s.view, columns: s.board, cards: s.cards });
    ok('3b the Advice tab is lit', s.on === 'advice', s.on);
    ok('3c the rail lights Requests, and only Requests', s.lit.join(',') === 'intake', s.lit);
    ok('3d the head carries the page\'s name', s.title === 'Requests', s.title);
    ok('3e the door still says the same total on this tab', s.doorN === s.nContracts + s.nAdvice, { door: s.doorN });
    await page.screenshot({ path: path.join(OUT, '3-advice.png') });

    /* ---- 4 · THE ROW HOLDS STILL, WIDE AND NARROW ---- */
    ok('4a wide: the tab row sits where it sat on Contracts', s.rowTop != null && s.rowTop === wideContracts && s.rowLeft === wideLeft,
      { contracts: [wideContracts, wideLeft], advice: [s.rowTop, s.rowLeft] });
    await page.setViewportSize({ width: 1000, height: 820 });
    await until(page, () => (document.querySelector('#content [data-ins-page="advice"]') || {}).getAttribute
      && document.querySelector('#content [data-ins-page="advice"]').getAttribute('data-ins') === '0', null, 4000);
    await page.waitForTimeout(400);
    const narrowAdvice = await page.evaluate(READ);
    await page.evaluate(() => setView('intake')); await page.waitForTimeout(900);
    const narrowContracts = await page.evaluate(READ);
    ok('4b narrow: the Requests page is its plain shape, and the tab row sits where the Advice tab\'s does',
      narrowContracts.rowTop != null && narrowContracts.rowTop === narrowAdvice.rowTop && narrowContracts.rowLeft === narrowAdvice.rowLeft,
      { contracts: [narrowContracts.rowTop, narrowContracts.rowLeft], advice: [narrowAdvice.rowTop, narrowAdvice.rowLeft] });
    await page.screenshot({ path: path.join(OUT, '4-narrow-contracts.png') });
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(600);

    /* ---- 5 · A REFRESH LANDS ON THE SAME TAB ---- */
    await page.evaluate(() => setView('advice')); await page.waitForTimeout(700);
    await page.reload({ waitUntil: 'networkidle' });
    await until(page, () => typeof state !== 'undefined' && state.view === 'advice' && !!document.querySelector('#content .rq-kinds'), null, 12000);
    await page.waitForTimeout(800);
    s = await page.evaluate(READ);
    ok('5a a refresh on the Advice tab comes back to the Advice tab', s.view === 'advice' && s.on === 'advice', { view: s.view, on: s.on });
    ok('5b with Requests lit and the board drawn', s.lit.join(',') === 'intake' && s.board === 5, { lit: s.lit, board: s.board });

    /* ---- 6 · THE OLD VIEW ID, AND THE WAY BACK ---- */
    await page.evaluate(() => setView('calendar')); await page.waitForTimeout(700);
    await page.evaluate(() => setView('advice')); await page.waitForTimeout(900);
    s = await page.evaluate(READ);
    ok('6a setView(\'advice\') from another page lands on the Advice tab of Requests',
      s.view === 'advice' && s.on === 'advice' && s.lit.join(',') === 'intake', { view: s.view, on: s.on, lit: s.lit });
    const back = await page.$('#content [data-rq-kind="contracts"]');
    if (back) await back.click();
    await until(page, () => state.view === 'intake' && !!document.querySelector('#content [data-ins-page="intake"]'));
    s = await page.evaluate(READ);
    ok('6b Contracts goes back to the contract requests', s.view === 'intake' && s.on === 'contracts' && s.lit.join(',') === 'intake',
      { view: s.view, on: s.on, lit: s.lit });

    /* ---- 7 · THE NUMBERS MOVE TOGETHER ---- */
    await page.evaluate(() => setView('advice')); await page.waitForTimeout(700);
    const before = await page.evaluate(READ);
    await anon.json('/api/advice/requests', { method: 'POST', body: {
      service: 'compliance', name: 'Customer 4', email: 'c4@example.co.ke', description: 'Check our labelling contract.' } });
    await page.evaluate(async () => { await refreshAdviceBoard(); });
    await page.waitForTimeout(500);
    const after = await page.evaluate(READ);
    ok('7 a new advice request moves the door and the Advice tab by one, together',
      after.nAdvice === before.nAdvice + 1 && after.doorN === before.doorN + 1 && after.doorN === after.nContracts + after.nAdvice,
      { before: [before.doorN, before.nAdvice], after: [after.doorN, after.nAdvice] });

    /* ---- 8 · THE PUBLIC PORTAL IS UNTOUCHED ---- */
    const pub = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    pub.on('pageerror', e => errs.push('portal: ' + String(e).slice(0, 200)));
    await pub.goto(h.base + '/#advice=new', { waitUntil: 'networkidle' });
    const intake = await until(pub, () => !!document.getElementById('ap-go') && !!document.getElementById('ap-desc'), null, 10000);
    ok('8a the public intake still draws its form', intake);
    await pub.goto(h.base + '/#advice=t:' + tokens[0].token, { waitUntil: 'networkidle' });
    await pub.reload({ waitUntil: 'networkidle' });
    const tracked = await until(pub, id => (document.body.textContent || '').includes(id) && !!document.getElementById('at-new'), tokens[0].id, 10000);
    ok('8b and the tracking page still shows the customer their request', tracked, tokens[0].id);
    await pub.screenshot({ path: path.join(OUT, '8-tracking.png') });
    await pub.close();

    ok('9 [control] the whole journey raised no page error', errs.length === 0, errs.length ? errs : 'clean');
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
