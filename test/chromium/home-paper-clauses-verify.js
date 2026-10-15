/* ============================================================
   CLAUSES ON HOME'S PAPER (work order docs/WORKORDER-home-paper-clauses.md,
   owner's go 10 Oct 2026; the picture is the "Home Paper Clauses" artifact)
   ============================================================
   Driven where the reader looks:
     1  Home's Paper: the panel's Document tab IS the clause list — beads down
        the line, "N to review", no blanks, no copies; the Document symbol
        counts the list's own number
     2  a press on a clause glides Home's paper to it and opens its row
     3  no Signing tab; the six symbols are the artifact's marks
     4  the panel is plain white, under the greeting row, its symbol row level
        with the contract line (no lifted card)
     5  the Track keeps its place at every panel width — slim when the margin
        is tight — and the old strip is never drawn
     6  a row the scroll opens opens in one step (no animation) — on Home's
        Document since 11 Oct 2026 (the room's Document tab, its drawer and
        its ×, are gone, owner)
   RED AT THE PARENT: 1, 3, 4 (white), 5, 6 fail on main before this change.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'home-paper-clauses');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++; console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const DOC = ['WAREHOUSING AND TRANSPORTATION SERVICES AGREEMENT',
  '1. Services and Applicable Terms', 'AIT shall provide warehousing, transportation and related logistics services to the Customer in accordance with this Agreement. These terms are incorporated by reference.',
  '2. Term and Termination', 'This Agreement shall remain in force for an initial term of three (3) years from the Effective Date. Either party may terminate by six (6) months written notice.',
  '3. Pricing and Payment', 'Prices are set out in Appendix 1. Invoices are payable within thirty (30) days. Late payment carries interest of 8% per year.',
  '4. Independent Contractor', 'AIT is an independent contractor.',
  '5. Limitation of Liability', 'AIT liability is limited to the fees paid in the prior twelve months, except for gross negligence.',
  '6. Assignment', 'Neither party may assign without consent.',
  '7. Insurance', 'AIT shall maintain cargo insurance.',
  '8. Entire Agreement', 'This is the entire agreement.',
  '9. Counterparts and Electronic Signatures', 'This Agreement may be signed electronically.'].join('\n');
const SCAN = { at: 'today', on: '2026-10-05', dismissed: [], findings: [
  { id: 'w1', sev: 'med', title: 'Outside rulebooks apply', why: 'Two outside rulebooks govern.', quote: 'These terms are incorporated by reference' },
  { id: 'w2', sev: 'med', title: 'Late interest', why: 'Interest on late payment.', quote: 'Late payment carries interest of 8% per year' },
  { id: 'w3', sev: 'high', title: 'Liability cap is low', why: 'Capped at twelve months of fees.', quote: 'limited to the fees paid in the prior twelve months' }] };
const until = async (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    await put(Object.assign(fixtureContract('MK-HP1', 'Warehousing and Transportation Services Agreement', 'AIT Worldwide Logistics Norway AS', FOLDER_A, 900000, 'Under Review', DOC), { owner, scan: SCAN }));
    await put(Object.assign(fixtureContract('MK-HP2', 'Warehousing and Transportation Services', 'AIT Worldwide Logistics', FOLDER_A, 900000, 'Under Review', DOC),
      { owner, scan: SCAN, rounds: [{ n: 1, at: '2026-10-01T10:00:00Z', by: 'Amina', sent: true }] }));

    const ctx = await browser.newContext({ viewport: { width: 1366, height: 1024 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) { await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
    await until(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 2, null, 15000);
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => typeof pdOpenOnHome === 'function' && !!document.querySelector('[data-hb-face="board"]'));

    /* ===== 1. THE DOCUMENT TAB IS THE CLAUSE LIST ===== */
    await page.evaluate(() => pdOpenOnHome('MK-HP1', 'doc'));
    const listUp = await until(page, () => document.querySelectorAll('#pd-thread .doc-th-row').length >= 9);
    const one = await page.evaluate(() => {
      const t = document.getElementById('pd-thread'), txt = e => e ? e.textContent.replace(/\s+/g, ' ').trim() : '';
      const rows = t ? [...t.querySelectorAll('.doc-th-row')] : [];
      const badge = document.querySelector('#ig-dock [data-pd-tab="doc"] .pd-tab-n');
      return { up: !!t, rows: rows.length, beads: t ? t.querySelectorAll('.doc-th-bead').length : 0,
        amber: rows.filter(r => r.classList.contains('is-amber')).length, ruby: rows.filter(r => r.classList.contains('is-ruby')).length,
        sum: txt(t && t.querySelector('.doc-th-sum')), badge: badge ? +badge.textContent : 0, close: !!(t && t.querySelector('[data-th-close]')),
        body: (document.getElementById('pd-body') || {}).innerText || '' };
    });
    ok('1a Home\'s Document tab is the clause list, a bead per clause', listUp && one.rows === 9 && one.beads === 9, JSON.stringify({ rows: one.rows, beads: one.beads }));
    ok('1b the marked clauses wear their colour: two amber, one red', one.amber === 2 && one.ruby === 1, JSON.stringify({ amber: one.amber, ruby: one.ruby }));
    /* 1c re-pointed 13 Oct 2026: Home's list head is Stakes' (no "N to review" title row); the symbol still counts */
    ok('1c the Document symbol counts the three clauses to review', one.badge === 3, JSON.stringify({ sum: one.sum, badge: one.badge }));
    ok('1d what was there is gone: no blanks, no copies, no "left edge" line, no ×', !/still blank|Copies|left edge/i.test(one.body) && !one.close, one.body.slice(0, 120));
    await page.screenshot({ path: path.join(OUT, '1-home-document.png') });

    /* ===== 2. A PRESS GLIDES THE PAPER ===== */
    const before = await page.evaluate(() => document.getElementById('ig-paper-scroll').scrollTop);
    await page.click('#pd-thread [data-th-go="4"]');
    const glided = await until(page, b => document.getElementById('ig-paper-scroll').scrollTop > b + 100, before);
    const opened = await page.evaluate(() => { const r = document.querySelector('#pd-thread .doc-th-row.is-open .doc-th-name'); return r ? r.textContent.trim() : ''; });
    ok('2 a press on "5. Limitation of Liability" glides Home\'s paper there and opens its row', glided && /^5\. Limitation of Liability/.test(opened), opened);

    /* ===== 3. NO SIGNING TAB; THE ARTIFACT'S SYMBOLS ===== */
    const tabs = await page.evaluate(() => [...document.querySelectorAll('#ig-dock .igd-head .pd-tab')].map(b => ({ k: b.getAttribute('data-pd-tab'), g: b.querySelector('.pd-tab-g img.jambo-face') ? 'FACE' : ((b.querySelector('.pd-tab-g') || {}).textContent || '').replace('︎', '') })));
    /* RE-POINTED 11 Oct 2026 (owner: "delete the deal tab ... and also delete history") */
    /* RE-POINTED 13 Oct 2026 (owner: "delete the overview tab from document page") */
/* RE-POINTED 15 Oct 2026 (owner): the Menu tab ("Next up") stands beside Obligations */
    ok('3a no Overview, Signing, Deal or History tab: Copilot · Clauses · Obligations · Menu', tabs.map(t => t.k).join(',') === 'copilot,doc,oblig,menu', JSON.stringify(tabs.map(t => t.k)));
    ok('3b the symbols are the artifact\'s marks, Jambo\'s tab his face (owner, 12 Oct 2026)', tabs.map(t => t.g).join('') === 'FACE▢⚑☰', tabs.map(t => t.g).join(' '));

    /* ===== 4. WHITE, UNDER THE GREETING ROW ===== */
    const lay = await page.evaluate(() => { const R = e => e.getBoundingClientRect();
      const d = document.getElementById('ig-dock'), s = document.getElementById('ig-strip'), hd = document.querySelector('#ig-dock > .igd-head');
      return { bg: getComputedStyle(d).backgroundColor, before: getComputedStyle(d, '::before').content, top: Math.round(R(d).top), strip: Math.round(R(s).top),
        headB: Math.round(R(hd).bottom), stripB: Math.round(R(s).bottom), barB: Math.round(R(document.querySelector('header, #topbar, .app-bar') || document.body).bottom) }; });
    ok('4a the panel is plain white with no lifted card', lay.bg === 'rgb(255, 255, 255)' && (lay.before === 'none' || lay.before === 'normal'), JSON.stringify(lay));
    ok('4b it starts below the greeting row, its symbol row level with the contract line', lay.top === lay.strip && lay.headB === lay.stripB, JSON.stringify(lay));

    /* ===== 5. THE TRACK AT EVERY PANEL WIDTH ===== */
    const sizes = [];
    for (const w of [380, 560, 700]) {
      await page.evaluate(w => { localStorage.setItem('hati.v1.igDockW', String(w)); igSyncDockWidth(); if (typeof igFitSplit === 'function') igFitSplit(); }, w);
      await page.waitForTimeout(500);
      sizes.push(await page.evaluate(() => { const sp = document.getElementById('ig-spine');
        return { size: sp.dataset.trackSize, track: sp.classList.contains('is-track'), strip: !!sp.querySelector('.doc-xr-seg:not(.ig-trk-lab)'), labs: sp.querySelectorAll('.ig-trk-lab').length }; }));
    }
    ok('5 the Track at every panel width (slimmer when tight), never the old strip', sizes.every(s => s.track && !s.strip && s.labs === 3) && sizes.some(s => s.size === 'slim'), JSON.stringify(sizes));
    await page.screenshot({ path: path.join(OUT, '5-track-slim.png') });
    await page.evaluate(() => { localStorage.removeItem('hati.v1.igDockW'); igSyncDockWidth(); });

    /* ===== 6. THE STILL LIST =====
       6a (the room's Clauses door says "to review") and 6b (the drawer's x on
       its head's first line) RETIRED 11 Oct 2026: the Document tab is gone
       (owner), and its door and drawer with it; Home's list has neither (1d).
       6c is the Thread's own behaviour, so it is measured where the Thread
       lives now: Home's Document, Clauses tab, scrolling Home's paper. */
    await page.evaluate(() => pdOpenOnHome('MK-HP2', 'doc'));
    await until(page, () => !!document.querySelector('#pd-thread .doc-th-row.is-open .doc-th-body')
      && !!document.getElementById('ig-paper-scroll'));
    const pb = await page.evaluate(() => { const r = document.getElementById('ig-paper-scroll').getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) }; });
    await page.mouse.move(pb.x, pb.y);
    const still = [];
    for (let k = 0; k < 12; k++) {
      await page.mouse.wheel(0, 40); await page.waitForTimeout(40);
      still.push(await page.evaluate(() => { const c = document.getElementById('pd-thread'); const o = c.querySelector('.doc-th-row.is-open .doc-th-body');
        return c.classList.contains('th-still') ? (o ? getComputedStyle(o).transitionDuration : 'none') : 'idle'; }));
    }
    ok('6c while the paper scrolls, a row opens in one step — no animation', still.some(v => v === '0s') && !still.some(v => v !== '0s' && v !== 'idle' && v !== 'none'), still.join(' '));
    await page.screenshot({ path: path.join(OUT, '6-home-still.png') });

    /* ===== 8. HOME'S HEAD (was: the filter at the left, "Go to document" at the right) =====
       (owner, 10 Oct 2026: "move the highlighted buttons to the far left and
       then add a door to the document tab on the far right", drawn as
       "→ Go to document"). Measured as painted boxes against the head. */
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => typeof pdOpenOnHome === 'function' && !!document.querySelector('[data-hb-face="board"]'));
    await page.evaluate(() => pdOpenOnHome('MK-HP1', 'doc'));
    /* 8a/8b RE-POINTED 13 Oct 2026 (owner, Stakes as drawn: "This is how the
       panel should look like"): Home's head is Stakes' own — "The company
       view" — with no title row and no colour filter. */
    const headUp = await until(page, () => !!document.querySelector('#pd-thread .stk-head .stk-view'));
    ok('8a GATE — Home\'s clause list head is drawn, as Stakes\' company view', headUp);
    const hd = await page.evaluate(() => { const t = document.getElementById('pd-thread');
      return t ? { title: !!t.querySelector('.doc-th-hd'), chips: !!t.querySelector('.doc-th-chips'), x: !!t.querySelector('[data-th-close]') } : null; });
    ok('8b no title row and no colour filter on Home', !!hd && !hd.title && !hd.chips && !hd.x, JSON.stringify(hd));
    /* 8c ("→ Go to document" ends the row) and 8d (it opens the contract on
       its Document tab) RETIRED 11 Oct 2026: the Document tab is gone (owner);
       Home's Document IS the document, so the list drops the door. */
    await page.screenshot({ path: path.join(OUT, '8-home-head.png') });

    ok('7 no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
