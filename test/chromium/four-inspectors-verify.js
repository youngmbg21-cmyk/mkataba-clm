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
    const db = new DatabaseSync(path.join(h.dataDir, 'hati.db'));
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

    const panelTitle = sel => page.evaluate(s => { const h2 = document.querySelector(s + ' h2'); return h2 ? h2.textContent.trim() : null; }, sel);

    /* ================= 1 · THE OBLIGATIONS PAGE ================= */
    await page.evaluate(() => setView('obligations')); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '1-obligations.png') });
    const ob = await page.evaluate(() => ({
      ins: !!document.querySelector('.obw-ins'),
      rows: document.querySelectorAll('.ob-lt tbody [data-ins-row]').length,
      groups: [...document.querySelectorAll('.ob-lt tr.ins-grp')].map(g => g.getAttribute('data-ob-win')),
      order: (window.OB_WINDOWS || []).map(w => w[0]),
      head: (document.getElementById('page-head-facts') || {}).textContent || '',
      title: (document.querySelector('#ins-panel h2') || {}).textContent || '' }));
    ok('1a the page is a list and a panel', ob.ins && ob.rows >= 8 && !!ob.title, { rows: ob.rows, title: ob.title });
    ok('1b its groups are the seven windows, in the drawing\'s order',
      ob.groups.length >= 5 && ob.groups.every((g, i) => i === 0 || ob.order.indexOf(g) > ob.order.indexOf(ob.groups[i - 1])), ob.groups);
    ok('1c a held-back step sits under Waiting on an earlier step, never under Overdue',
      await page.evaluate(() => { const r = [...document.querySelectorAll('.ob-lt tbody tr')]; let w = '';
        for (const t of r) { if (t.classList.contains('ins-grp')) w = t.getAttribute('data-ob-win'); else if (/Pay on delivery to site/.test(t.textContent)) return w === 'waiting'; }
        return false; }));
    ok('1d the head says what is on the page', /\d/.test(ob.head), ob.head);
    const rows = await page.$$('.ob-lt tbody [data-ins-row]');
    if (rows.length > 2) {
      await rows[2].click(); await page.waitForTimeout(300);
      const t = await panelTitle('#ins-panel');
      /* The row's own words carry the obligation's name (its second column),
         so the claim is that the panel's title is one of them. */
      const want = await rows[2].evaluate(r => r.textContent.replace(/\s+/g, ' '));
      const on = await rows[2].evaluate(r => r.classList.contains('is-sel'));
      ok('1e a press selects the row and the panel follows', !!t && on && want.includes(t.slice(0, 20)), { panel: t, row: want.slice(0, 80) });
      await page.keyboard.press('ArrowDown'); await page.waitForTimeout(300);
      ok('1f the arrow moves the selection', (await panelTitle('#ins-panel')) !== t);
    } else { ok('1e a press selects the row and the panel follows', false, 'no rows'); ok('1f the arrow moves the selection', false); }
    const door = await page.evaluate(() => (typeof obligationsDoorCount === 'function') ? obligationsDoorCount() : -1);
    await page.click('[data-obw-view="overdue"]').catch(() => {}); await page.waitForTimeout(400);
    const overdueN = await page.evaluate(() => document.querySelectorAll('.ob-lt tbody [data-ins-row]').length);
    ok('1g the Overdue view lists what the sidebar door counts', door >= 1 && overdueN === door, { door, overdueN });
    await page.click('[data-obw-view="open"]').catch(() => {}); await page.waitForTimeout(400);
    const sel = await page.$('#ins-panel');
    await page.focus('.ob-lt tbody tr.is-sel').catch(() => {});
    await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
    const landed = await page.evaluate(() => ({ view: state.view, tab: (document.querySelector('.room-tab.on, .room-tab[aria-selected="true"]') || {}).getAttribute ? document.querySelector('.room-tab.on, .room-tab[aria-selected="true"]').getAttribute('data-ws-tab') : null,
      pane: !!document.querySelector('#ws-obligations-pane:not([hidden])') }));
    ok('1h Enter opens the contract on its Obligations tab', !!sel && landed.view === 'workspace' && landed.pane, landed);

    /* ================= 2 · THE CONTRACT'S OBLIGATIONS TAB ================= */
    await page.evaluate(id => { openWorkspace(id); }, staged.c1); await page.waitForTimeout(1200);
    await page.evaluate(id => roomGoTab(getContract(id), 'oblig'), staged.c1); await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, '2-tab.png') });
    const tab = await page.evaluate(() => ({ ins: !!document.querySelector('#ws-obligations-pane.is-ins'),
      rows: document.querySelectorAll('#ws-obligations-pane [data-ins-row]').length,
      line: (document.querySelector('.obt-line') || {}).textContent || '', title: (document.querySelector('#obt-panel h2') || {}).textContent || '' }));
    ok('2a the tab is a list and a panel on the same builder', tab.ins && tab.rows >= 3 && !!tab.title, tab);
    await page.click('[data-obt-view="all"]').catch(() => {}); await page.waitForTimeout(400);
    const allN = await page.evaluate(() => document.querySelectorAll('#ws-obligations-pane [data-ins-row]').length);
    ok('2b the switch shows what is completed too', allN === tab.rows + 1, { outstanding: tab.rows, all: allN });
    const before = await page.evaluate(id => getContract(id).obligations.length, staged.c1);
    await page.click('#obt-panel [data-ins-more]').catch(() => {}); await page.waitForTimeout(200);
    await page.click('#obt-panel [data-act="remove"]').catch(() => {}); await page.waitForTimeout(500);
    const asked = await page.evaluate(() => { const d = [...document.querySelectorAll('[data-top-overlay], [role="alertdialog"], [role="dialog"]')].pop();
      return d ? d.textContent.replace(/\s+/g, ' ').slice(0, 160) : ''; });
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    const after = await page.evaluate(id => getContract(id).obligations.length, staged.c1);
    ok('2c Remove asks first, and a cancel removes nothing', !!asked && before === after, { asked, before, after });

    /* ================= 3 · OUR STANDARDS, THREE TABS ================= */
    await page.evaluate(() => setView('playbook')); await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, '3-standards.png') });
    const sd = await page.evaluate(() => ({ ins: !!document.querySelector('.sd-ins'),
      tabs: [...document.querySelectorAll('[data-pb-tab]')].map(b => ({ k: b.getAttribute('data-pb-tab'), n: (b.querySelector('.st-tab-n') || {}).textContent || null })),
      rows: document.querySelectorAll('[data-pb-sec="clauses"] tbody [data-ins-row]').length, lib: clauseLibrary().length,
      title: (document.querySelector('#sd-panel-clauses h2') || {}).textContent || '' }));
    ok('3a three tabs, each carrying its count, and every standard is a row', sd.ins && sd.tabs.length === 3
      && sd.tabs.every(t => t.n != null) && sd.rows === sd.lib && !!sd.title, sd);
    await page.evaluate(() => { const r = document.querySelector('.sd-ins'); if (r) r._probe = 1; });
    await page.click('[data-pb-tab="playbook"]'); await page.waitForTimeout(400);
    ok('3b a tab press flips the tab — the page is not rebuilt under the reader',
      await page.evaluate(() => { const r = document.querySelector('.sd-ins'); return !!(r && r._probe === 1)
        && !document.querySelector('[data-pb-sec="playbook"]').hidden && document.querySelector('[data-pb-sec="clauses"]').hidden; }));
    await page.click('[data-sd-book="supply"]').catch(() => {}); await page.waitForTimeout(300);
    const caps = await page.evaluate(() => [...document.querySelectorAll('#sd-panel-books .ins-stdl li b')].filter(b => /^Liability cap/.test(b.textContent)).length);
    ok('3c a book lists each standard once — Liability cap is one line on the supply book', caps === 1, caps);
    await page.click('[data-pb-tab="clauses"]'); await page.waitForTimeout(300);
    await page.click('[data-sd-row="cl-pay"]').catch(() => {}); await page.waitForTimeout(300);
    await page.click('#sd-panel-clauses [data-ins-act="pos"]').catch(() => {}); await page.waitForTimeout(400);
    const pos = await page.evaluate(() => ({ tab: (document.querySelector('[data-pb-tab].on') || {}).getAttribute ? document.querySelector('[data-pb-tab].on').getAttribute('data-pb-tab') : null,
      book: (document.querySelector('#sd-panel-books h2') || {}).textContent || '' }));
    ok('3d "Change the position" lands on the book that holds it', pos.tab === 'playbook' && /baseline/i.test(pos.book), pos);
    await page.click('[data-pb-tab="clauses"]'); await page.waitForTimeout(300);
    const godev = await page.$('#sd-panel-clauses [data-sd-godev]');
    let gd = null;
    if (godev) {
      const cid = await godev.getAttribute('data-sd-godev');
      await godev.click(); await page.waitForTimeout(500);
      gd = await page.evaluate(id => ({ tab: document.querySelector('[data-pb-tab].on').getAttribute('data-pb-tab'),
        sel: (document.querySelector('[data-pb-sec="deviations"] tr.is-sel') || {}).getAttribute ? document.querySelector('[data-pb-sec="deviations"] tr.is-sel').getAttribute('data-sd-dev') : null, want: id }), cid);
    }
    ok('3e a departure in a standard\'s panel lands on that contract under Portfolio deviations', !!gd && gd.tab === 'deviations' && gd.sel === gd.want, gd);
    await page.screenshot({ path: path.join(OUT, '3e-deviations.png') });
    const see = await page.$('#sd-panel-dev [data-sd-gostd]');
    let sw = null;
    if (see) {
      const clid = await see.getAttribute('data-sd-gostd');
      await see.click(); await page.waitForTimeout(500);
      sw = await page.evaluate(id => ({ tab: document.querySelector('[data-pb-tab].on').getAttribute('data-pb-tab'),
        sel: (document.querySelector('[data-pb-sec="clauses"] tr.is-sel') || {}).getAttribute ? document.querySelector('[data-pb-sec="clauses"] tr.is-sel').getAttribute('data-sd-row') : null, want: id }), clid);
    }
    ok('3f "See the standard" lands on the standard it misses', !!sw && sw.tab === 'clauses' && sw.sel === sw.want, sw);
    const libBefore = await page.evaluate(() => clauseLibrary().length);
    await page.click('#sd-panel-clauses [data-ins-more]').catch(() => {}); await page.waitForTimeout(200);
    await page.click('#sd-panel-clauses [data-act="remove"]').catch(() => {}); await page.waitForTimeout(500);
    const askedStd = await page.evaluate(() => { const d = [...document.querySelectorAll('[data-top-overlay], [role="alertdialog"], [role="dialog"]')].pop();
      return d ? d.textContent.replace(/\s+/g, ' ').slice(0, 160) : ''; });
    await page.keyboard.press('Escape'); await page.waitForTimeout(400);
    ok('3g removing a standard asks first, and a cancel removes nothing',
      !!askedStd && (await page.evaluate(() => clauseLibrary().length)) === libBefore, askedStd);

    /* ================= 4 · REQUESTS ================= */
    await page.evaluate(() => setView('intake')); await page.waitForTimeout(2200);
    await page.screenshot({ path: path.join(OUT, '4-requests.png') });
    const ik = await page.evaluate(() => ({ ins: !!document.querySelector('.ik-ins'),
      groups: [...document.querySelectorAll('.ik-lt tr.ins-grp')].map(g => g.getAttribute('data-ik-grp')),
      head: (document.getElementById('page-head-facts') || {}).textContent || '',
      ask: !!document.querySelector('#page-head-acts #ik-new') }));
    ok('4a the queue is a list and a panel, grouped past its promise → nobody → being worked on',
      ik.ins && ik.groups.join(',').startsWith('over,nobody,held') && ik.ask, ik);
    await page.click('[data-ik-row="REQ-HELD01"]').catch(() => {}); await page.waitForTimeout(300);
    const heldSays = await page.evaluate(() => (document.querySelector('#ins-panel .ins-st') || {}).textContent || '');
    ok('4b a request a colleague holds reads as being worked on', /working on it/i.test(heldSays), heldSays);
    await page.click('#ins-panel [data-ins-act="pick"]').catch(() => {}); await page.waitForTimeout(500);
    const takeAsk = await page.evaluate(() => { const d = [...document.querySelectorAll('[data-top-overlay], [role="alertdialog"], [role="dialog"]')].pop();
      return d ? d.textContent.replace(/\s+/g, ' ').slice(0, 200) : ''; });
    await page.keyboard.press('Escape'); await page.waitForTimeout(500);
    const still = await page.evaluate(() => { const r = (_intakeState.list || []).find(x => x.id === 'REQ-HELD01'); return r && r.assignee ? r.assignee.name : null; });
    ok('4c taking it over asks first, and a cancel leaves it with its holder', /Amina/.test(takeAsk) && still === 'Amina Otieno', { takeAsk, still });
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
      ['5c', 'playbook', '.sd-ins', '#clause-lib']]) {
      await page.evaluate(v => setView(v), view); await page.waitForTimeout(1000);
      const r = await page.evaluate(([s, c]) => ({ ins: !!document.querySelector(s), classic: !!document.querySelector(c) }), [sel, classic]);
      ok(`${k} [control] ${view} below the line draws its classic page`, !r.ins && r.classic, r);
    }
    await page.setViewportSize({ width: 1440, height: 900 }); await page.waitForTimeout(1000);
    ok('5d and widening the window puts the Inspector back without a navigation',
      await page.evaluate(() => !!document.querySelector('.sd-ins')));

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
