/* Chromium verification: THE INSPECTOR ON FOUR MORE PAGES (Young chose it by
   name for each, 26 Sep 2026 — the Obligations page, the contract's
   Obligations tab, all three tabs of Our standards and the Requests page —
   and said yes to the three Requests rulings).
   ====================================================================
   f390 pins the readings. This file measures what a reader SEES and DOES on
   the real app: a press selects and the panel follows, the arrows move, a
   second press opens, the three standards tabs are linked, taking over a
   colleague's request asks first, the tracker link says "being worked on",
   removing a standard or an obligation asks first — and below the width line
   every page is exactly what it was.

   THE STAGE is a new workspace with the sample portfolio, obligations in
   every window across three contracts (one a payment chain whose second step
   is held back), HaTi's own rule-based standards check run on every live
   contract, and a queue of requests written straight into the database so
   their dates are real: one past its promise, three nobody holds, two held by
   colleagues, one finished this month.

   Every claim is GATED on the thing it measures being on the page, so a build
   without the feature REPORTS its failures rather than timing out. The
   CONTROLS pass on both sides by design and are named: the stage itself, the
   classic page below the width line on each page (5a–5c), and the page-error
   sweep. AT THE PARENT (afc2d0b) THE OTHER 25 OF 30 FAIL, measured — the four
   pages draw their old shapes, nothing selects, no tab counts, there is no
   Overdue view to press (the probe reads 0 against the sidebar door's 2),
   widening the window puts no Inspector back (5d), and the tracker says
   "Waiting to be picked up" over a request a colleague holds.

   Run: node test/chromium/four-inspectors-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { DatabaseSync } = require('node:sqlite');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'four-inspectors');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : ''}`);
};
const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const ago = days => new Date(Date.now() - days * 864e5).toISOString();

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
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go'); await page.waitForTimeout(3500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(800); }

    /* ---- THE STAGE ---- */
    const staged = await page.evaluate(async ({ D }) => {
      for (const [name, email, role] of [['Amina Otieno', 'amina@highland.co.ke', 'legal'], ['Wanjiru Kamau', 'wanjiru@highland.co.ke', 'legal'],
        ['Peter Mwangi', 'peter@highland.co.ke', 'viewer'], ['Faith Njeri', 'faith@highland.co.ke', 'viewer']]) {
        try { await api('users', 'POST', { name, email, role, password: 'memberpass123' }); } catch (e) {}
      }
      try { if (typeof loadBootstrap === 'function') await loadBootstrap(); } catch (e) {}
      const live = state.contracts.filter(c => c.status !== 'Declined' && !c.archived);
      const [c1, c2, c3] = live;
      for (const c of [c1, c2, c3]) { try { await ensureFull(c); } catch (e) {} }
      c1.obligations = [
        { id: 'o1', desc: 'Quarterly volume report to the buyer', due: D[-9], status: 'open', party: 'ours', assignee: 'Amina Otieno', quote: 'quarterly report' },
        { id: 'o2', desc: 'Pay the deposit on order', due: D[-30], status: 'done', completedAt: D[-31], completedBy: 'Young Mbagaya', party: 'ours', amount: 400000 },
        { id: 'o3', desc: 'Pay on delivery to site', due: D[-4], status: 'open', party: 'ours', amount: 300000, after: 'o4', assignee: 'Young Mbagaya' },
        { id: 'o4', desc: 'Commission the line', due: D[-6], status: 'open', party: 'ours', assignee: 'Wanjiru Kamau' },
      ];
      c2.obligations = [
        { id: 'p1', desc: 'Deliver the audited accounts', due: D[3], status: 'open', party: 'theirs', amount: 250000 },
        { id: 'p2', desc: 'Renew the insurance certificate', due: D[20], status: 'open', party: 'ours', assignee: 'Nobody At All' },
        { id: 'p3', desc: 'Annual price review', due: D[120], status: 'open', party: 'ours', assignee: 'Amina Otieno' },
        { id: 'p4', desc: 'Keep records on site', due: '', status: 'open', party: 'ours' },
      ];
      c3.obligations = [{ id: 'q1', desc: 'Send the rebate statement', due: D[5], status: 'open', party: 'ours', assignee: 'Young Mbagaya' }];
      [c1, c2, c3].forEach(c => persist(c));
      /* HaTi's own rule-based standards check on every live contract. */
      state.aiConfigured = false;
      let checked = 0;
      for (const c of live) {
        try { await ensureFull(c); } catch (e) {}
        try { const r = await runPlaybookReview(c, { quiet: true }); if (r && !r.error) { c.playbook = r; persist(c); checked++; } } catch (e) {}
      }
      try { await flushSaves(); } catch (e) {}
      return { c1: c1.id, c2: c2.id, c3: c3.id, checked, lib: clauseLibrary().length };
    }, { D: Object.fromEntries([-31, -30, -9, -6, -4, 3, 5, 20, 120].map(n => [n, day(n)])) });
    ok('0 · the stage: obligations on three contracts and a standards check on every live one',
      !!(staged && staged.checked >= 5), staged);

    /* The requests, straight into the database so their dates are real. */
    const db = (d => (d.exec('PRAGMA busy_timeout = 5000'), d))(new DatabaseSync(path.join(h.dataDir, 'hati.db')));
    const users = db.prepare('SELECT id, name FROM users').all();
    const U = n => users.find(x => x.name === n);
    const ins = db.prepare(`INSERT INTO intake_requests (id,title,need,counterparty,folder,status,by_id,by_name,contract_id,decided_by,decided_at,note,created_at,updated_at,assignee_id,assignee_name,promised_at,lane,track_token)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`);
    const tok = {};
    const REQS = [
      ['REQ-OVER01', 'Review the listing agreement', 'Peter Mwangi', 8, 'Young Mbagaya', day(-2), 'open'],
      ['REQ-HELD01', 'Distributor agreement for the west', 'Peter Mwangi', 4, 'Amina Otieno', day(4), 'open'],
      ['REQ-HELD02', 'Extra pallet space for December', 'Faith Njeri', 3, 'Wanjiru Kamau', day(6), 'open'],
      ['REQ-NOB001', 'Mutual NDA with a flavour house', 'Faith Njeri', 1, null, null, 'open'],
      ['REQ-NOB002', 'Route-planning software terms', 'Peter Mwangi', 2, null, null, 'open'],
      ['REQ-NOB003', 'Sponsorship letter of intent', 'Faith Njeri', 0, null, null, 'open'],
      ['REQ-DONE01', 'Extend the courier contract', 'Peter Mwangi', 2, 'Wanjiru Kamau', null, 'done'],
    ];
    for (const [id, title, by, age, holder, promised, status] of REQS) {
      const b = U(by), hd = holder ? U(holder) : null;
      tok[id] = require('crypto').randomBytes(16).toString('hex');
      ins.run(id, title, 'We need this for the season.', 'Nordkust', 'sales', status, b.id, b.name, status === 'done' ? staged.c1 : null,
        status === 'done' ? 'Wanjiru Kamau' : null, status === 'done' ? ago(1) : null, null, ago(age), status === 'done' ? ago(1) : ago(age),
        hd ? hd.id : null, hd ? hd.name : null, promised, null, tok[id]);
    }
    db.prepare("UPDATE users SET prefs='{}' WHERE email=?").run('peter@highland.co.ke');
    db.close();
    await page.reload({ waitUntil: 'networkidle' }); await page.waitForTimeout(3000);
    await page.keyboard.press('Escape').catch(() => {});

    /* RE-POINTED 16 Nov 2026 (#762): a panel's title is its h2, or the five parts' headline (.jov5-title) */
    const panelTitle = sel => page.evaluate(s => { const h2 = document.querySelector(s + ' h2, ' + s + ' .jov5-title, ' + s + ' .obn-lg-top b'); return h2 ? h2.textContent.trim() : null; }, sel);

    /* ================= 1 · THE OBLIGATIONS PAGE ================= */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the Obligations page is the PROJECT LIST (obnRender,
       CLAUDE.md OBLIGATIONS): pills Late · Tracked · Proposals ([data-obn-tab]), ONE table (.obn-table), twenty a page,
       a row press chooses and the panel follows, a double-click or Enter opens the duty on its contract's paper, the
       Obligations face, that row open (obOpenContract → pd2ObGo). Each claim asked of its new place. */
    await page.evaluate(() => setView('obligations')); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '1-obligations.png') });
    /* RE-POINTED 19 Nov 2026 (We owe · They owe, the owner's pick): a duty is a line in its column */
    const ROWS = '.obt-cols [data-ins-row]';
    const ob = await page.evaluate(R => ({
      ins: !!document.querySelector('.obn-page #ins-panel, .obn-page ~ #ins-panel') || (!!document.querySelector('.obn-table') && !!document.getElementById('ins-panel')),
      rows: document.querySelectorAll(R).length,
      head: ((document.getElementById('page-head-facts') || {}).textContent || '').replace(/\s+/g, ' ').trim(),
      pills: Object.fromEntries([...document.querySelectorAll('[data-obn-tab]')].map(b => [b.getAttribute('data-obn-tab'), (b.textContent.match(/\d+/) || [''])[0]])),
      word: (document.querySelector('#ins-panel [data-jl-word]') || {}).textContent || '' }), ROWS);
    ok('1a the page is a list and a panel, no word beside the tabs', ob.ins && ob.rows >= 7 && !ob.word, { rows: ob.rows, word: ob.word });
    /* RETIRED 16 Nov 2026 (#762): 1b "its groups are the weeks, in order" — old look only: the owner's project list
       (Late · Tracked · Proposals, twenty a page) replaced the week-by-week groups */
    /* RETIRED 16 Nov 2026 (#762): 1c0 "Outstanding does not list a step still waiting on an earlier one" — old look only
       (round 16's arithmetic, All = Outstanding + Waiting + Completed): Tracked is every duty still open, the held-back
       one too; that it is never called late is kept (1c) */
    /* every column shown in full; a held-back step stands on Next 30 days or Later, and a late line wears the late word */
    const allOn = async () => { await page.evaluate(() => document.querySelectorAll('[data-obt-more]').forEach(m => m.click())).catch(() => {}); await page.waitForTimeout(300); };
    await allOn();
    let tracked = await page.evaluate(R => [...document.querySelectorAll(R)].some(r => /Pay on delivery to site/.test(r.textContent)), ROWS);
    if (!tracked){ await page.click('[data-obn-tab="later"]').catch(() => {}); await page.waitForTimeout(400); await allOn();
      tracked = await page.evaluate(R => [...document.querySelectorAll(R)].some(r => /Pay on delivery to site/.test(r.textContent)), ROWS);
      await page.click('[data-obn-tab="open"]').catch(() => {}); await page.waitForTimeout(400); await allOn(); }
    const lateRows = await page.evaluate(R => [...document.querySelectorAll(R)].filter(r => r.querySelector('.obt-w.is-late')).map(r => r.textContent.replace(/\s+/g, ' ')), ROWS);
    ok('1c a held-back step is tracked, and never listed as Late', tracked && lateRows.length >= 1 && !lateRows.some(t => /Pay on delivery to site/.test(t)), { tracked, late: lateRows.length });
    const door = await page.evaluate(() => (typeof obligationsDoorCount === 'function') ? obligationsDoorCount() : -1);
    ok('1g the late lines are what the sidebar door counts', door >= 1 && lateRows.length === door, { door, late: lateRows.length });
    /* the head says how many of ours and of theirs are late: together the late lines */
    const hm = [...ob.head.matchAll(/(\d+) of (?:ours|theirs) late/g)].reduce((a, m) => a + Number(m[1]), 0);
    ok('1d the head says how many of ours and of theirs are late, together the late lines', hm === lateRows.length, { head: ob.head, late: lateRows.length });
    const rows = await page.$$(ROWS);
    if (rows.length > 2) {
      await rows[2].click(); await page.waitForTimeout(300);
      const t = await panelTitle('#ins-panel');
      const want = await rows[2].evaluate(r => r.textContent.replace(/\s+/g, ' '));
      const on = await rows[2].evaluate(r => r.classList.contains('is-sel'));
      ok('1e a press selects the row and the panel follows', !!t && on && want.includes(t.slice(0, 20)), { panel: t, row: want.slice(0, 80) });
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
      ok('1f the arrow moves the selection', (await panelTitle('#ins-panel')) !== t);
    } else { ok('1e a press selects the row and the panel follows', false, 'no rows'); ok('1f the arrow moves the selection', false); }
    if (!(await page.$('.obt-cols .obt-li.is-sel'))) { await page.click(ROWS).catch(() => {}); await page.waitForTimeout(300); }
    const sel = await page.evaluate(() => { const r = document.querySelector('.obt-cols .obt-li.is-sel'); return r ? r.getAttribute('data-ob-key') : null; });
    const selCid = sel ? sel.split('::')[0] : null;
    await page.focus('.obt-cols .obt-li.is-sel').catch(() => {});
    await page.keyboard.press('Enter');
    await page.waitForFunction(k => !!k && !!document.querySelector(`#ig-dock .pd-ob.is-open[data-pd-ob-key="${k}"]`), sel, { timeout: 8000 }).catch(() => {});
    const onHome = await page.evaluate(() => { const r = document.querySelector('#ig-dock .pd-ob.is-open[data-pd-ob-key]');
      return { view: state.view, id: (window.intel && intel.paper) ? String(intel.paper.id) : null, row: r ? r.getAttribute('data-pd-ob-key') : null }; });
    ok('1h Enter opens the duty on its contract\'s paper, the Obligations face, that row open', !!sel && onHome.view === 'dashboard'
      && onHome.id === selCid && onHome.row === sel, { ...onHome, sel });

    /* ================= 2 · THE CONTRACT'S OBLIGATIONS TAB ================= */
    /* RE-POINTED 16 Nov 2026 (#762): the contract's Obligations tab is its paper's Obligations face (pdObligHtml, THE
       FIVE PARTS): every duty a row (.pd-ob) in groups by when, Completed among them; a press on a row opens its acts */
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), staged.c1);
    await page.waitForFunction(id => window.intel && intel.paper && String(intel.paper.id) === id && !!document.querySelector('#ig-dock .pd-obm-tab .pd-ob[data-pd-ob-key]'), staged.c1, { timeout: 8000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, '2-tab.png') });
    const tab = await page.evaluate(() => ({ rows: document.querySelectorAll('#ig-dock .pd-obm-tab .pd-ob[data-pd-ob-key]').length,
      title: ((document.querySelector('#ig-dock .pd-obm-tab .jov5-title, #ig-dock .pd-obm-tab .pd-obm-t') || {}).textContent || '').trim(),
      done: document.querySelectorAll('#ig-dock .pd-obm-tab [data-pd-obg="done"] .pd-ob').length }));
    ok('2a the tab lists every duty as a row under its headline', tab.rows >= 3 && !!tab.title, tab);
    ok('2b what is completed is shown too, in its own group', tab.done === 1 && tab.rows === 4, tab);
    const before = await page.evaluate(id => getContract(id).obligations.length, staged.c1);
    await page.click('#ig-dock .pd-obm-tab .pd-ob[data-pd-ob-key] .pd-ob-hd').catch(() => {}); await page.waitForTimeout(400);
    const rm = await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .pd-ob.is-open .pd-ob-acts button')].find(x => /^Remove$/.test(x.textContent.trim())); if (b) { b.click(); return true; } return false; });
    await page.waitForTimeout(500);
    const gone = await page.evaluate(id => getContract(id).obligations.length, staged.c1);
    const undone = await page.evaluate(() => { const b = [...document.querySelectorAll('#toast-root [data-toast-act]')].pop(); if (b) { b.click(); return true; } return false; });
    await page.waitForTimeout(400);
    const after = await page.evaluate(id => getContract(id).obligations.length, staged.c1);
    ok('2c Remove goes at once, and its Undo puts it back', rm && gone === before - 1 && undone && after === before, { rm, before, gone, undone, after });

    /* ================= 3 · OUR STANDARDS ================= */
    /* RE-POINTED 17 Nov 2026 (the owner picked The Ladder): Our standards is no longer three lists in an Inspector but a
       page of its own, drawn as a ladder; it is measured by standards-page-verify. Asked here only: it draws. */
    await page.evaluate(() => setView('playbook')); await page.waitForTimeout(1000);
    ok('3 Our standards draws as its own page, the Ladder', await page.evaluate(() => !!document.querySelector('.ld-page .ld-list') && !!document.querySelector('.ld-page #ins-panel')));

    /* ================= 4 · REQUESTS ================= */
    await page.evaluate(() => setView('intake')); await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, '4-requests.png') });
    /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2 — the drawing is
       the target): one flat list, no heading row per pile, still in the
       piles' order — read off each row's own pile. */
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Requests is ONE table (.ikn-table, tr[data-ikn-row])
       beside Jambo's panel, the Ask button in its own head (#ik-new); whose a request is stands in its row ("With Amina") */
    /* RETIRED 17 Nov 2026 (#762, owner's ruling): "the longest wait first" — Requests' oldest-first order stays gone;
       the list-and-panel and the Ask button in its head are still asked */
    const ik = await page.evaluate(() => ({ ins: !!document.querySelector('.ikn-page') && !!document.getElementById('ins-panel'),
      rows: document.querySelectorAll('.ikn-table tbody [data-ikn-row]').length,
      ask: !!document.querySelector('.ikn-page .cun-head #ik-new') }));
    ok('4a the queue is a list and a panel',
      ik.ins && ik.rows > 1 && ik.ask, ik);
    await page.click('[data-ikn-row="REQ-HELD01"]').catch(() => {}); await page.waitForTimeout(300);
    const heldSays = await page.evaluate(() => ({ row: ((document.querySelector('[data-ikn-row="REQ-HELD01"]') || {}).textContent || '').replace(/\s+/g, ' '),
      panel: ((document.getElementById('ins-panel') || {}).innerText || '').replace(/\s+/g, ' ') }));
    /* RETIRED 17 Nov 2026 (#762, owner's ruling): "and its promise" — the promised-by date stays gone; the holder is still asked */
    ok('4b a request a colleague holds names its holder', /With Amina/.test(heldSays.row), heldSays);
    /* RETIRED 17 Nov 2026 (#762, owner's ruling): 4c taking over a colleague's request — that door stays gone */
    const trk = await (await fetch(h.base + '/track/' + tok['REQ-HELD01'])).text();
    ok('4d the tracker link says the same thing to the person who asked', /Being worked on/.test(trk));

    /* ---- the chair of somebody who only asks ---- */
    const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const p2 = await ctx2.newPage();
    p2.on('pageerror', e => errs.push('asker: ' + String(e).slice(0, 200)));
    await p2.goto(h.base + '/', { waitUntil: 'networkidle' });
    await p2.waitForSelector('#li-email', { timeout: 15000 });
    await p2.fill('#li-email', 'peter@highland.co.ke'); await p2.fill('#li-pass', 'memberpass123');
    await p2.click('#li-go'); await p2.waitForTimeout(3000); await p2.keyboard.press('Escape').catch(() => {});
    await p2.evaluate(() => setView('intake')); await p2.waitForTimeout(2200);
    await p2.screenshot({ path: path.join(OUT, '4e-asker.png') });
    const asker = await p2.evaluate(() => ({ ins: !!document.querySelector('.ik-ins'),
      rows: [...document.querySelectorAll('.ik-lt tbody [data-ins-row]')].map(r => r.getAttribute('data-ik-row')),
      chips: document.querySelectorAll('[data-ik-f]').length }));
    ok('4e the asker sees only their own requests, with no team filters', asker.ins && asker.rows.length >= 2
      && asker.rows.every(id => ['REQ-OVER01', 'REQ-HELD01', 'REQ-NOB002'].includes(id)) && asker.chips === 0, asker);
    await p2.click('#page-head-acts #ik-new').catch(() => {}); await p2.waitForTimeout(600);
    const lead = await p2.evaluate(() => { const l = document.getElementById('ik-lead'); const f = document.querySelector('#modal-root input, #modal-root textarea');
      return l && f ? !!(l.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) : null; });
    ok('4f the Ask window leads with the helping sentence', lead === true, lead);
    await ctx2.close();

    /* ================= 5 · BELOW THE WIDTH LINE, NOTHING CHANGED ================= */
    await page.setViewportSize({ width: 1000, height: 900 }); await page.waitForTimeout(900);
    for (const [k, view, sel, classic] of [['5a', 'obligations', '.obw-ins', '.obw-page'], ['5b', 'intake', '.ik-ins', '#ik-new'],
      /* Our standards left this list 17 Nov 2026: the Ladder has one shape at every width */]) {
      await page.evaluate(v => setView(v), view); await page.waitForTimeout(1000);
      const r = await page.evaluate(([s, c]) => ({ ins: !!document.querySelector(s), classic: !!document.querySelector(c) }), [sel, classic]);
      ok(`${k} [control] ${view} below the line draws its classic page`, !r.ins && r.classic, r);
    }
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(1000);
    ok('5d and widening the window puts the Inspector back without a navigation',
      /* RE-POINTED 17 Nov 2026 (#762): the last page is now Requests (main took Standards out of this list); the new look draws
         it as its own page with Jambo's panel beside the list (.ikn-page #ins-panel), not the old .ik-ins */
      await page.evaluate(() => !!document.querySelector('.ikn-page #ins-panel, .ik-ins')));

    ok('6 [control] the whole journey raised no page error', errs.length === 0, errs.join(' | ') || 'clean');
  } catch (e) {
    ok('RUN', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exit(1);
})();
