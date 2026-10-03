/* Chromium verification: A REFRESH LANDS AT THE SAME SPOT
   ============================================================
   Young, 28 Sep 2026: "New rule. If you are on a specific page and you
   refresh the page, you should land at the same exact spot you were in when
   you refreshed or reloaded the page."

   keeps-your-page-verify already holds the PAGE. This file holds everything
   inside it: the tab, the list's filters, the Explorer's picture, the reading
   on the Document tab, and where the reader had scrolled — each set by the
   page's own presses or a real scroll, then a REAL reload, then read off the
   running app. Waits ask for the state, bounded.

   Red at 5448c132 (the parent): every page came back, and every claim below
   failed except 7a (what a press to another page did then, and must still do)
   and 9a — the tab went back to the first one, the scroll to the top, the
   Negotiations list lost its search, the Explorer went back to the brain.

   Screenshots go to test/chromium/shots/refresh-keeps-your-spot/.
   Run: node test/chromium/refresh-keeps-your-spot-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'refresh-keeps-your-spot');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
/* enough contracts that every list scrolls */
const BOOK = FIXTURES.concat(Array.from({ length: 70 }, (_, i) => {
  const c = fixtureContract('MK-R' + i, ['Packaging Film Supply', 'Cold Chain Logistics', 'Distributor Agreement', 'Office Lease'][i % 4], ['Naivas', 'Bidco', 'Kenafric', 'Twiga'][i % 4],
    ['proc', 'sales', 'mfg', 'dist', 'mktg'][i % 5], ((i * 37) % 90 + 5) * 1e6, ['Draft', 'Under Review', 'Signed', 'Signed', 'Declined'][i % 5]);
  c.expiry = ['2026-12-31', '2027-03-31', '2027-09-30', '2028-06-30'][i % 4];
  return c;
}));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  const top = id => page.evaluate(k => { const e = document.getElementById(k); return e ? Math.round(e.scrollTop) : null; }, id);
  /* scroll a scroller the way a wheel does, and wait for it to hold */
  const scrollTo = async (id, y) => { await page.evaluate(([k, v]) => { const e = document.getElementById(k); if (e) e.scrollTop = v; }, [id, y]); await page.waitForTimeout(500); return top(id); };
  const reload = async () => { await page.reload({ waitUntil: 'networkidle' });
    await until(() => window.state && state.contracts && state.contracts.length > 60 && document.getElementById('content') && document.getElementById('content').children.length > 0); };
  /* the scroll is re-asserted while the page fills in: wait for it, bounded */
  const cameBack = async (id, y) => (await until(([k, v]) => { const e = document.getElementById(k); return e && Math.abs(e.scrollTop - v) <= 2 ? Math.round(e.scrollTop) : null; }, [id, y])) || await top(id);
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-R7'), null, { timeout: 15000 });

    /* ================= 1. THE CONTRACTS LIST, AND THE NEGOTIATIONS LIST ====== */
    await page.evaluate(() => setView('register'));
    await until(() => document.getElementById('reg-scroll'));
    const r0 = await scrollTo('reg-scroll', 700);
    await reload();
    const r1 = await cameBack('reg-scroll', r0);
    check('1a the Contracts list comes back scrolled to where the reader was', r0 >= 600 && r1 === r0, JSON.stringify({ r0, r1 }));
    /* a list needs live negotiations to be a list: one change filed on each of five, through the funnel, saved */
    await page.evaluate(async () => { for (const id of ['MK-R1', 'MK-R6', 'MK-R11', 'MK-R16', 'MK-R21']) { const c = getContract(id); if (window.ensureFull) await ensureFull(c); negoInit(c); const cl = negoClauseList(c)[1] || negoClauseList(c)[0]; negoEditClause(c, cl.clauseId, String(cl.bodyHtml || '<p>' + cl.text + '</p>').replace(/<\/p>$/, ' promptly.</p>')); persist(c); } });
    await page.waitForTimeout(800);
    await page.evaluate(() => openNegotiations({ list: true }));
    await until(() => window.regScope && regScope() === 'negotiations' && document.getElementById('reg-scroll'));
    await page.evaluate(() => { regState().query = 'Bidco'; regRepaint(); });
    await page.waitForTimeout(500);
    await reload();
    const n1 = await until(() => window.regScope && state.view === 'redline' && regScope() === 'negotiations' ? { view: state.view, scope: regScope(), q: regState().query } : null);
    check('1b the Negotiations list comes back as the list, still searched for "Bidco"', !!n1 && n1.q === 'Bidco', JSON.stringify(n1));

    /* ================= 2. A CONTRACT: THE TAB, THE READING, THE SCROLL ======= */
    await page.evaluate(() => openWorkspace('MK-R3'));
    await until(() => state.view === 'workspace' && document.getElementById('doc-scroll'));
    await page.evaluate(() => roomGoTab(getContract('MK-R3'), 'docs'));
    await until(() => { const e = document.getElementById('doc-scroll'); return e && e.scrollHeight > e.clientHeight + 1000; });
    const d0 = await scrollTo('doc-scroll', 900);
    await reload();
    const d1 = await cameBack('doc-scroll', d0);
    check('2a the Document tab comes back on the same contract, scrolled to the same line', d0 >= 800 && d1 === d0 && (await page.evaluate(() => state.activeId)) === 'MK-R3', JSON.stringify({ d0, d1 }));
    await page.screenshot({ path: path.join(OUT, '2a-document-kept.png') });
    await page.evaluate(() => docViewSet('plain'));
    await page.waitForTimeout(300);
    await reload();
    const pm = await until(() => window.docViewMode ? docViewMode() : null);
    check('2b the Plain English reading the reader had up survives the reload (a reload is not an arrival)', pm === 'plain', pm);
    await page.evaluate(() => docViewSet('paper'));
    await page.evaluate(() => roomGoTab(getContract('MK-R3'), 'history'));
    await page.waitForTimeout(400);
    await reload();
    const ht = await until(() => { const p = document.querySelector('[data-ws-pane~="history"]'); return window.roomCurrentTab && roomCurrentTab() === 'history' && p && getComputedStyle(p).display !== 'none' ? roomCurrentTab() : null; });
    check('2c the History tab comes back as History', ht === 'history', JSON.stringify({ ht, now: await page.evaluate(() => [window.roomCurrentTab && roomCurrentTab(), state.view, state.activeId]) }));

    /* ================= 3. INSIGHTS: THE TAB, AND THE EXPLORER'S PICTURE ====== */
    await page.evaluate(() => { intel.tab = 'friction'; setView('intel'); });
    await page.waitForTimeout(800);
    await reload();
    const it = await until(() => window.intel && intel.tab === 'friction' && document.querySelector('[data-ig-tab="friction"].on') ? intel.tab : null);
    check('3a the Insights tab comes back on Negotiation friction, not Portfolio', it === 'friction', it);
    await page.evaluate(() => { intel.tab = 'map'; setView('intel'); });
    await until(() => window.IG && IG.hubs && IG.hubs.length >= 3);
    await page.evaluate(() => { igRecipeSet({ ...igRecipeNow(), floorsBy: 'owner', view: 2 }); rebuildIntelGraph(); });
    await until(() => intel.cam.w[2] > 0.95);
    /* held Still, so the angle is the reader's and the choice itself must come back too */
    await page.evaluate(() => { igSetSpin(false); intel.cam.rotL = 0.7; });
    await page.waitForTimeout(300);
    await reload();
    /* RE-POINTED IN PLACE 3 Oct 2026: Explorer lives on Home's Explorer side */
    const ex = await until(() => window.intel && state.view === 'dashboard' && window.hbS && hbS().face === 'explorer' && window.IG && IG.floors ? { floorsBy: intel.floorsBy, view: intel.cam.view, rotL: Math.round(intel.cam.rotL * 100) / 100, spin: igbSpinning(), floors: IG.floors.length } : null);
    check('3b the Explorer comes back on the Floors, floors by owner, turned the way it was, still Still', !!ex && ex.floorsBy === 'owner' && ex.view === 2 && ex.rotL === 0.7 && ex.spin === false, JSON.stringify(ex));
    await page.screenshot({ path: path.join(OUT, '3b-explorer-kept.png') });

    /* ================= 4. SETTINGS, TEMPLATES, CALENDAR ====================== */
    await page.evaluate(() => { setView('team'); settingsGoTab(ST_TABS[1]); });
    await page.waitForTimeout(600);
    const s0 = await scrollTo('content-scroll', 500);
    await reload();
    const st = await until(() => document.querySelector('[data-st-tab].on, [data-st-tab][aria-selected="true"]') ? document.querySelector('[data-st-tab].on, [data-st-tab][aria-selected="true"]').getAttribute('data-st-tab') : null);
    const s1 = await cameBack('content-scroll', s0);
    check('4a Settings comes back on the tab the reader was on, at the same place down it', st === (await page.evaluate(() => ST_TABS[1])) && s0 >= 400 && s1 === s0, JSON.stringify({ st, s0, s1 }));
    await page.evaluate(() => setView('templates'));
    await page.waitForTimeout(600);
    await page.evaluate(() => { const want = TPL_PAGE_TABS[1]; const b = document.querySelector(`[data-tpl-page-tab="${want}"],[data-tpl-tab="${want}"]`); if (b) b.click(); });
    await until(() => window.tplPageTab && tplPageTab() === TPL_PAGE_TABS[1]);
    await reload();
    const tp = await until(() => window.tplPageTab && tplPageTab() === TPL_PAGE_TABS[1] ? tplPageTab() : null);
    check('4b Templates comes back on its second tab', tp === (await page.evaluate(() => TPL_PAGE_TABS[1])), tp);
    await page.evaluate(() => { calState.view = 'horizon'; setView('calendar'); });
    await page.waitForTimeout(500);
    await reload();
    const cv = await until(() => window.calState && calState.view === 'horizon' ? calState.view : null);
    check('4c the Calendar comes back on Horizon', cv === 'horizon', cv);

    /* ================= 5. THE NEGOTIATE PAGE ================================= */
    await page.evaluate(() => openRedlineWorkbench('MK-R1'));
    await until(() => state.view === 'redline' && document.getElementById('nego-scroll-work'));
    await until(() => { const e = document.getElementById('nego-scroll-work'); return e && e.scrollHeight > e.clientHeight + 600; });
    const w0 = await scrollTo('nego-scroll-work', 500);
    await reload();
    const w1 = await cameBack('nego-scroll-work', w0);
    check('5a the Negotiate page comes back on the same contract, scrolled to the same clause', w0 >= 400 && w1 === w0 && (await page.evaluate(() => state.activeId)) === 'MK-R1', JSON.stringify({ w0, w1 }));

    /* ================= 6. THE READER'S HAND WINS ============================= */
    await page.evaluate(() => setView('register'));
    await until(() => document.getElementById('reg-scroll'));
    const h0 = await scrollTo('reg-scroll', 900);
    await reload();
    const hb = await cameBack('reg-scroll', h0);
    const box = await page.evaluate(() => { const r = document.getElementById('reg-scroll').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
    await page.mouse.move(box.x, box.y); await page.mouse.wheel(0, -400);
    await page.waitForTimeout(1500);
    const h1 = await top('reg-scroll');
    check('6a the place is put back, and a scroll the reader makes straight after the reload is never pulled back to it', h0 >= 800 && hb === h0 && h1 <= h0 - 300, JSON.stringify({ h0, hb, h1 }));

    /* ================= 7. GOING SOMEWHERE ELSE IS NOT A REFRESH ============== */
    await page.evaluate(() => setView('obligations'));
    await page.waitForTimeout(400);
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(600);
    const g1 = await top('reg-scroll');
    check('7a a press that goes to another page and back still lands at the top, as before', g1 === 0 || g1 === null, g1);
    check('9a no page errors', errors.length === 0, JSON.stringify(errors.slice(0, 3)));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop?.();
    const bad = results.filter(r => !r.pass);
    console.log(`\n${results.length - bad.length}/${results.length} passed`);
    if (bad.length) { console.log('FAILED:'); bad.forEach(r => console.log('  - ' + r.name)); }
    process.exit(bad.length ? 1 : 0);
  }
})();
