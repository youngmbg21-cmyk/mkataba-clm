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
  /* RE-POINTED 21 Oct 2026 (Part 8, the Legora way): on Requests the tab row
     stands in the list head, drawn from the same one reading (ikTabViews) as
     the board's own row (.rq-kinds); a tab of a view of the list carries
     data-ik-view, the asker's page change data-rq-kind="advice" */
  /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Requests is
     drawn by iknRender — its tabs are the bar's pills (.ikn-page .apn-bar
     [data-ikn-tab], the lit one .is-on: Open · Mine · Drafted · Advice) and
     its rows [data-ikn-row] (an advice row carries the advice request's own id).
     The Advice board (setView('advice')) still draws its .rq-kinds row, read as
     before. The head's name is the page's .ctf-h. */
  const row = document.querySelector('#content .ikn-page .apn-bar, #content .rq-kinds, #content [data-lh-seat="intake"] [role="tablist"]');
  const tabEls = row ? [...row.querySelectorAll('[data-ikn-tab], [role="tab"]')] : [];
  const advIds = new Set(((window.state && state.advice) || []).map(a => String(a.id)));
  const iknRows = [...document.querySelectorAll('#content .ikn-page [data-ikn-row]')];
  const tabN = b => { const el = b && (b.querySelector('.n') || b.querySelector('span')); return n(el); };
  const tabOf = k => row && row.querySelector(`[data-ikn-tab="${k}"], [data-ik-view="${k}"]`);
  return {
    view: state.view,
    lit: [...document.querySelectorAll('#side-nav .nav-item[aria-current="page"]')].map(b => b.getAttribute('data-view')),
    adviceDoor: !!document.querySelector('#side-nav [data-view="advice"]'),
    doorN: door ? n(door.querySelector('[data-count="intake"]')) : null,
    tabs: tabEls.map(b => b.getAttribute('data-rq-kind') || ((b.hasAttribute('data-ik-view') || b.hasAttribute('data-ikn-tab')) ? 'contracts' : null)),
    views: tabEls.map(b => b.getAttribute('data-ikn-tab') || b.getAttribute('data-ik-view')),
    tabNs: tabEls.map(tabN),
    on: (() => { const b = row && row.querySelector('.on, .is-on'); return b ? (b.getAttribute('data-ikn-tab') || b.getAttribute('data-ik-view') || b.getAttribute('data-rq-kind')) : null; })(),
    advRows: document.querySelectorAll('#content [data-ik-row^="adv:"]').length + iknRows.filter(r => advIds.has(String(r.getAttribute('data-ikn-row')))).length,
    ikRows: document.querySelectorAll('#content [data-ik-row]:not([data-ik-row^="adv:"])').length + iknRows.filter(r => !advIds.has(String(r.getAttribute('data-ikn-row')))).length,
    nContracts: tabN(tabOf('open')),
    nAdvice: (() => { const b = row && row.querySelector('[data-rq-n="advice"]'); return b ? n(b) : tabN(tabOf('advice')); })(),
    title: ((document.querySelector('#page-head h1') || document.querySelector('#content .ikn-page .ctf-h') || {}).textContent || '').trim(),
    rowTop: row ? Math.round(row.getBoundingClientRect().top) : null,
    rowLeft: row ? Math.round(row.getBoundingClientRect().left) : null,
    board: document.querySelectorAll('#content [data-adv-drop]').length,
    cards: document.querySelectorAll('#content [data-adv-card]').length,
    ikPage: !!document.querySelector('#content [data-ins-page="intake"]'),
    intakeN: typeof intakeCount === 'function' ? intakeCount() : null,
    adviceN: typeof adviceActiveCount === 'function' ? adviceActiveCount() : null,
    adviceAll: ((window.state && state.advice) || []).length,
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
    /* the left menu's place is the desk tabs' since 17 Oct 2026 (Round 2): the page is asked of Jambo's box */ await page.evaluate(w => { setView('counter'); ((t) => { const a = typeof jamboPageWordOf === 'function' && jamboPageWordOf(t); return a ? caGo(a) : caAskAnywhere(t, { all: true }); })(w); }, 'requests');
    await until(page, () => state.view === 'intake' && !!document.querySelector('#content [data-lh-seat="intake"] [role="tablist"], #content .ikn-page [data-ikn-tab]'));
    s = await page.evaluate(READ);
    /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the drawing is
       the target): ONE row, Open · Mine · Advice · Finished this month · All;
       Advice is still its own view, the other four the contracts queue. */
    /* RE-POINTED 9 Oct 2026 (the owner: build it the SAP way): advice
       requests are listed in the same table, and Advice is a cut of it. */
    /* RE-POINTED 21 Oct 2026 (Part 8, the Legora way): a view with no rows is
       left out unless lit or All — the admin asked for nothing, so no Mine */
    /* RE-POINTED 16 Nov 2026 (#762): the new look's row is Open · Mine · Drafted · Advice — no All */
    const ORDER = ['open', 'mine', 'drafted', 'advice', 'fin', 'all'];
    ok('2a Requests draws one tab row of views in their order, Advice among them, each with rows', s.tabs.length >= 2 && s.tabs.every(k => k === 'contracts')
      && s.views.every((v, i) => i === 0 || ORDER.indexOf(v) > ORDER.indexOf(s.views[i - 1])) && ['open', 'advice'].every(v => s.views.includes(v))
      && s.views.every((v, i) => v === 'all' || v === s.on || s.tabNs[i] > 0), { views: s.views, n: s.tabNs });
    /* RETIRED 17 Nov 2026 (#762, owner's ruling 3): 2b "Open holds both kinds", 2c "Open counts both kinds" and
       2d "the door is the Open list" — Open now holds contract requests only and advice lives under its own Advice
       tab (the round-6 drawing); the door's total is still pinned against the two books in 1c and 3e */
    const wideLeft = s.rowLeft, wideViews = JSON.stringify(s.views);
    await page.screenshot({ path: path.join(OUT, '2-contracts.png') });

    /* ---- 3 · THE ADVICE TAB ---- */
    const adv = await page.$('#content [data-ik-view="advice"], #content [data-ikn-tab="advice"]');
    if (adv) await adv.click();
    await until(page, () => !!document.querySelector('#content [data-ik-view="advice"].on, #content [data-ikn-tab="advice"].is-on'));
    s = await page.evaluate(READ);
    /* RE-POINTED 17 Nov 2026 (the new look is the only look, #762; owner's ruling 3): the Advice tab is advice's own
       home — advice rows only, every advice request the book holds (finished ones too, as the new tab draws them),
       and the tab's number is the rows it shows */
    ok('3 the Advice tab is a cut of the list: advice rows only, on Requests', s.view === 'intake' && s.on === 'advice'
      && s.advRows === s.adviceAll && s.advRows === s.nAdvice && s.adviceAll >= s.adviceN && s.ikRows === 0,
      { view: s.view, on: s.on, advice: s.advRows, tab: s.nAdvice, book: s.adviceAll, contract: s.ikRows });
    /* RETIRED 17 Nov 2026 (#762, owner's pick on the drawings: "6 The tab alone"): 3a — the advice row's "Advice board" door
       and the board's five stages; the board is gone, Requests' Advice tab is advice's one home (3b–3e read it) */
    ok('3b the Advice tab is lit', s.on === 'advice', s.on);
    ok('3c the rail lights Requests, and only Requests', s.lit.join(',') === 'intake', s.lit);
    ok('3d the head carries the page\'s name', s.title === 'Requests', s.title);
    /* RE-POINTED 16 Nov 2026 (#762): the new look's Advice tab counts every advice request, finished too, so the
       door's total is checked against the two books (contract requests + OPEN advice), the promise unchanged */
    ok('3e the door still says the same total on this tab', s.doorN === s.intakeN + s.adviceN, { door: s.doorN });
    await page.screenshot({ path: path.join(OUT, '3-advice.png') });

    /* ---- 4 · THE ROW HOLDS STILL, WIDE AND NARROW ---- */
    /* RE-POINTED 21 Oct 2026 (Part 8, the Legora way): on Requests the tabs
       stand under the list head's box, so the board's row (which draws the
       tabs alone) is no longer at the same height; it starts at the same
       edge and carries the same tabs, from the one reading */
    /* RETIRED 17 Nov 2026 (#762, owner's pick "6 The tab alone"): 4a, 4b — the board's tab row standing where Requests'
       does, wide and narrow; there is no board to stand beside */
    await page.screenshot({ path: path.join(OUT, '4-narrow-contracts.png') });

    /* ---- 5 · A REFRESH LANDS ON THE SAME TAB ---- */
    await page.evaluate(() => setView('advice')); await page.waitForTimeout(700);
    await page.reload({ waitUntil: 'networkidle' });
    /* RE-POINTED 17 Nov 2026 (#762, owner's pick "6 The tab alone"): the old view id lands on Requests' Advice tab */
    await until(page, () => typeof state !== 'undefined' && state.view === 'intake' && !!document.querySelector('#content [data-ikn-tab="advice"].is-on'), null, 12000);
    await page.waitForTimeout(800);
    s = await page.evaluate(READ);
    ok('5a a refresh on the Advice tab comes back to the Advice tab', s.view === 'intake' && s.on === 'advice', { view: s.view, on: s.on });
    /* RETIRED (#762, "6 The tab alone"): "and the board drawn"; Requests stays the one lit */
    ok('5b with Requests lit', s.lit.join(',') === 'intake', { lit: s.lit });

    /* ---- 6 · THE OLD VIEW ID, AND THE WAY BACK ---- */
    await page.evaluate(() => setView('calendar')); await page.waitForTimeout(700);
    await page.evaluate(() => setView('advice')); await page.waitForTimeout(900);
    s = await page.evaluate(READ);
    ok('6a setView(\'advice\') from another page lands on the Advice tab of Requests',
      s.view === 'intake' && s.on === 'advice' && s.lit.join(',') === 'intake', { view: s.view, on: s.on, lit: s.lit });
    const back = await page.$('#content [data-rq-kind="contracts"], #content [data-ikn-tab="open"]');
    if (back) await back.click();
    await until(page, () => state.view === 'intake' && !!document.querySelector('#content [data-ikn-tab="open"].is-on'));
    s = await page.evaluate(READ);
    ok('6b Open goes back to the Requests list', s.view === 'intake' && s.on === 'open' && s.lit.join(',') === 'intake',
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
      /* RE-POINTED 17 Nov 2026 (#762): the door's total is the two books' OPEN ones, as 3e reads it (the tab counts finished advice too) */
      after.nAdvice === before.nAdvice + 1 && after.doorN === before.doorN + 1 && after.doorN === after.intakeN + after.adviceN,
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
