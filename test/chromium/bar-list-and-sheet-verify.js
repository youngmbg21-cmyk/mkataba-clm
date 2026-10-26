/* Chromium verification: THE BAR'S LIST, THE NEW AGREEMENT SHEET, AND NO WORD BESIDE THE TABS.
   ============================================================
   Three asks of the owner's, 26 Oct 2026:
   - "while in the above page [New agreement], when you press on the highlighted filter [the page's
     name in the bar], the dropdown does not appear" — it opened BEHIND the sheet: the app's frame
     (#app-shell, position:fixed) is its own layer, so the list's z-index could never rise above a
     page drawn outside it. Claim 1: on Home, on New agreement and on the send letter the list is the
     element in front (elementFromPoint), not the page.
   - "The new agreement page is supposed to look like image 2 with the jambo panel but sometimes the
     image 1 appears" (the second time asked) — the sheet opens beside Jambo, but a move to another
     page (the Guide's rows, a typed page name) left it standing over that page, full width, no
     Jambo. Claim 2: from every way away the sheet is put away and the page arrives; with words typed
     it asks first, and "stay" keeps the sheet and its words.
   - "on the side panel next to the Jambo tab you have the name of the page … These are to be
     deleted." Claim 3: no word beside the tabs on Home's panel (with the sheet up), a list's panel
     (nothing chosen and a row chosen) and Settings' panel; the › fold stays.
   AT THE PARENT (origin/main 91c12b0) claims 1b, 1c, 2a–2d, 3c and 3d FAIL (measured); 3a and 3b held there
   already (Home's panel drew no word beside the sheet, and the list panel with nothing chosen was his one window).
   Run: node test/chromium/bar-list-and-sheet-verify.js */
/* global state, setView, openPanel, openNewAgreement, openShareModal, contractRef, pdOpenOnHome, closeModal, naSheetUp */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedNavWorld } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}

(async () => {
  const h = await startHati({});
  await seedNavWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1536, height: 730 } });
  const P = await ctx.newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && state.contracts && state.contracts.length && typeof openNewAgreement === 'function'), null, 20000);
    const home = async () => { await P.evaluate(() => { try { closeModal(); } catch (_){} setView('counter'); }); await until(P, () => state.view === 'counter'); };
    const sheet = async () => { await P.evaluate(() => openNewAgreement()); return until(P, () => !!document.querySelector('#na-root.na-one') && state.view === 'dashboard'); };

    /* ---- 1 the bar's list stands in front ---- */
    const listInFront = async () => {
      await P.click('#dk-page');
      const r = await until(P, () => { const m = document.getElementById('dk-recent'); if (!m || m.hidden) return null; const b = m.getBoundingClientRect(); if (b.height < 40) return null;
        const top = document.elementFromPoint(b.left + Math.min(b.width / 2, 120), b.top + Math.min(60, b.height / 2)); return { front: m.contains(top), by: top && (top.id || String(top.className).slice(0, 40)) }; });
      await P.keyboard.press('Escape'); await until(P, () => (document.getElementById('dk-recent') || { hidden: true }).hidden);
      return r;
    };
    await home();
    let r = await listInFront(); check('1a on Home the list opens in front', !!r && r.front, JSON.stringify(r));
    await sheet(); r = await listInFront(); check('1b on New agreement the list opens in front of the sheet', !!r && r.front, JSON.stringify(r));
    await home();
    await P.evaluate(() => { const c = state.contracts.find(x => contractRef(x) === 'MK-A1'); pdOpenOnHome(c.id, 'copilot'); });
    await until(P, () => !!document.getElementById('ig-dock'));
    await P.evaluate(() => { const c = state.contracts.find(x => contractRef(x) === 'MK-A1'); openShareModal(c); });
    await until(P, () => !!document.querySelector('#modal-root [data-dlg-page]'));
    r = await listInFront(); check('1c on the send letter the list opens in front of it', !!r && r.front, JSON.stringify(r));
    /* a row of the list still works where it now stands: Home */
    await P.click('#dk-page'); await until(P, () => !(document.getElementById('dk-recent') || { hidden: true }).hidden);
    const home1 = await P.$('#dk-recent [data-dk-counter], #dk-recent .dk-r-home');
    if (home1){ await home1.click(); } else { await P.keyboard.press('Escape'); }
    check('1d a press inside the list is a press of the list (Home row lands on Home)', !home1 || !!(await until(P, () => state.view === 'counter' ? true : null)), home1 ? '' : 'no Home row drawn');

    /* ---- 2 moving away puts the sheet away ---- */
    const away = [
      ['the Guide\'s Settings row', async () => { await P.evaluate(() => openPanel('guide')); await until(P, () => !!document.querySelector('[data-gd-go="settings"]')); await P.click('[data-gd-go="settings"]'); }],
      ['a page name typed in Jambo\'s box', async () => { const b = await P.$('#igd-input'); await b.fill('settings'); await b.press('Enter'); }],
      ['a page change by code', () => P.evaluate(() => setView('team'))],
    ];
    for (const [i, [how, go]] of away.entries()){
      await home(); await sheet();
      await go();
      const got = await until(P, () => (state.view === 'team' && !document.querySelector('#na-root')) ? { view: state.view } : null);
      check(`2${'abc'[i]} ${how}: the sheet is put away and Settings arrives`, !!got, JSON.stringify(await P.evaluate(() => ({ view: state.view, sheet: !!document.querySelector('#na-root') }))));
    }
    /* with words typed it asks first; staying keeps the sheet and its words */
    await home(); await sheet();
    const say = await P.$('#dr-say, #na-root textarea');
    if (say){ await say.fill('Two-year supply agreement with Nandi Dairy'); }
    await P.evaluate(() => setView('team'));
    const asked = await until(P, () => document.getElementById('cf-ok') ? true : null, null, 4000);
    check('2d with words typed it asks before putting the sheet away', !!asked);
    if (asked){
      await P.click('#cf-cancel, [data-cf-cancel]').catch(() => P.keyboard.press('Escape'));
      const kept = await until(P, () => !document.getElementById('cf-ok') && naSheetUp() ? { view: state.view, words: ((document.querySelector('#dr-say, #na-root textarea') || {}).value || '') } : null);
      check('2e "stay" keeps the sheet, its words and Home', !!kept && kept.view === 'dashboard' && /Nandi Dairy/.test(kept.words), JSON.stringify(kept));
    }

    /* ---- 3 no word beside the tabs ---- */
    const headWords = () => P.evaluate(() => {
      const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
      return [...document.querySelectorAll('.jl-word, [data-jl-word], .st-side-word, #st-side-word, .pd-head-word')].filter(vis).map(e => e.textContent.trim()).filter(Boolean);
    });
    const fold = () => until(P, () => !!document.querySelector('#ins-panel [data-jl-fold], #st-side [data-st-side-fold], #ig-dock #igd-collapse'), null, 4000);
    await P.evaluate(() => { try { closeModal(); } catch (_){} }); await home(); await sheet();
    let w = await headWords(); check('3a beside New agreement: Home\'s panel shows no word beside its tabs', !w.length, JSON.stringify(w));
    /* the sheet put away by its own close first (it may still hold the words typed in 2e, and moving away asks) */
    await P.evaluate(() => { try { closeModal(); } catch (_){} }); await until(P, () => !document.querySelector('#na-root'));
    await P.evaluate(() => setView('obligations')); await until(P, () => state.view === 'obligations');
    await until(P, () => !!document.querySelector('#ins-panel [data-jl-home]'));
    w = await headWords(); const f3b = await fold(); check('3b a list\'s panel, nothing chosen: no word beside the tabs, the › fold kept', !w.length && !!f3b, JSON.stringify({ w, fold: !!f3b }));
    await until(P, () => !!document.querySelector('tr[data-ob-key] td:nth-child(2)'));
    const row = await P.$('tr[data-ob-key] td:nth-child(2)');
    if (row){ await row.click(); await until(P, () => !!document.querySelector('#ins-panel[data-ins-id]')); }
    w = await headWords(); check('3c a list\'s panel, a row chosen: no word beside the tabs', !!row && !w.length, JSON.stringify({ w, row: !!row }));
    await P.evaluate(() => setView('team')); await until(P, () => !!document.getElementById('st-side-head'));
    w = await headWords(); const f3d = await fold(); check('3d Settings\' panel: no word beside the tabs, the › fold kept', !w.length && !!f3d, JSON.stringify({ w, fold: !!f3d }));

    check('4 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e){ console.error('HARNESS', e); failures++; }
  finally { await browser.close(); await h.stop(); }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
