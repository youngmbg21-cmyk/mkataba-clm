/* ============================================================
   NEW AGREEMENT STANDS BESIDE JAMBO, AND HIS OWN TWO ROWS
   (owner, 22 Oct 2026: "what is this screen that does not have jambo.
   I had requested to draft a contract"; "test the questions shown in the
   panel and see where it takes you")
   ============================================================
   Driven in a real browser, with presses:
     1  started from Settings, New agreement opens on Home with Jambo's
        panel beside it (the page ends at the panel); Cancel lands back on
        Settings
     2  the same from Our paper and from Requests (RE-POINTED 24 Oct 2026, the
        one door: the sheet carries no crumb; the bar names "New agreement"
        and Cancel goes back where it was started)
     3  Create from a form started in Settings lands on the new contract,
        not back on Settings
     4  "take me to my settings for jambo" lands on How you like to work;
        "take me to jambo points" on Jambo's points; without his name
        "the language settings" stays Language
   Red at the parent: 1 opens over the whole window with no panel; 4 lands
   on Language and asks "Which contract?".
     node test/chromium/draft-beside-jambo-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'draft-beside-jambo');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await pause(100); } return null; };
const ID = 'MK-DBJ1';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const put = await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: fixtureContract(ID, 'Supply Agreement', 'Nandi Dairy Ltd', 'proc', 1200000, 'Under Review',
    'SUPPLY AGREEMENT\n\n1. Supply\n\nThe Supplier supplies milk.'), baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* where the form stands and whether Jambo's panel is beside it */
  const formAt = () => page.evaluate(() => {
    const pg = document.querySelector('#modal-root [data-dlg-page]'), f = pg && pg.parentElement, d = document.getElementById('ig-dock');
    if (!f || !document.getElementById('na-root')) return null;
    const fr = f.getBoundingClientRect(), dr = d && d.getClientRects().length ? d.getBoundingClientRect() : null;
    return { view: state.view, right: Math.round(fr.right), dockLeft: dr ? Math.round(dr.left) : null, dockW: dr ? Math.round(dr.width) : 0,
      crumb: (document.querySelector('.dlg-pg-crumb') || {}).textContent || '', bar: ((document.getElementById('dk-page') || {}).textContent || '').trim() };
  });
  const goPlace = (place, view) => page.evaluate(([p, v]) => { try { closeModal(); } catch (_){}
    if (p) caGo({ kind: 'go', place: p }); else setView(v); }, [place, view]);
  try {
    check('0 the contract is staged', !!(put && put.ok));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, id => window.state && state.contracts && state.contracts.some(x => x.id === id), 15000, ID);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });

    console.log('\n1 · from Settings');
    await goPlace(null, 'team');
    await waitFor(page, () => state.view === 'team', 6000);
    await page.evaluate(() => openNewAgreement({ door: true }));
    const A = await waitFor(page, () => { const f = document.getElementById('na-root'), d = document.getElementById('ig-dock');
      return f && d && d.getClientRects().length ? true : null; }, 6000) && await formAt();
    check('1a started from Settings, the form stands on Home with Jambo\'s panel beside it (the page ends at the panel)',
      !!A && A.view === 'dashboard' && A.dockW > 300 && Math.abs(A.right - A.dockLeft) <= 2, JSON.stringify(A));
    await page.screenshot({ path: path.join(OUT, 'from-settings-1440x780.png') });
    if (A) await page.click('#wz-pick-cancel');
    const back1 = await waitFor(page, () => !document.getElementById('na-root') && state.view === 'team' ? true : null, 6000);
    check('1b Cancel lands back on Settings', !!back1, await page.evaluate(() => state.view));

    console.log('\n2 · from Our paper and Requests');
    for (const [place, view, crumb] of [['ourpaper', 'templates', /New agreement/], ['requests', 'intake', /New agreement/]]){
      await goPlace(place);
      await waitFor(page, v => state.view === v, 6000, view);
      await page.evaluate(() => openNewAgreement({ door: true }));
      const B = await waitFor(page, () => { const d = document.getElementById('ig-dock'); return document.getElementById('na-root') && d && d.getClientRects().length ? true : null; }, 6000) && await formAt();
      check(`2 ${place}: beside Jambo, the bar names New agreement`, !!B && B.dockW > 300 && crumb.test(B.bar), JSON.stringify(B));
      if (B) await page.click('#wz-pick-cancel');
      const back = await waitFor(page, v => !document.getElementById('na-root') && state.view === v ? true : null, 6000, view);
      check(`2 ${place}: Cancel lands back there`, !!back, await page.evaluate(() => state.view));
    }

    console.log('\n3 · Create from a form started in Settings');
    await goPlace(null, 'team');
    await waitFor(page, () => state.view === 'team', 6000);
    await page.evaluate(() => openNewAgreement({ door: true }));
    /* RE-POINTED 24 Oct 2026: the one door opens on the three most used */
    await waitFor(page, () => !!document.querySelector('#na-closest .na-pick'), 6000);
    await page.click('#na-closest .na-pick');
    await waitFor(page, () => !!document.querySelector('#na-root input[placeholder="Full registered name"]'), 6000);
    await page.fill('#na-root input[placeholder="Full registered name"]', 'Brookside Dairy Ltd');
    await page.evaluate(() => { const s = document.querySelector('#na-root select[data-na-stream], #na-root select'); const o = s && [...s.options].find(x => x.value);
      if (o){ s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    const n0 = await page.evaluate(() => state.contracts.length);
    await waitFor(page, () => { const b = document.getElementById('na-create'); return b && !b.disabled ? true : null; }, 4000);
    await page.click('#na-create');
    const made = await waitFor(page, n => !document.getElementById('na-root') && state.contracts.length > n
      ? { view: state.view, page: (document.getElementById('dk-page') || {}).textContent } : null, 12000, n0);
    check('3 Create lands on the new contract on Home, not back on Settings', !!made && made.view === 'dashboard' && /Brookside Dairy Ltd/.test(made.page || ''), JSON.stringify(made));

    console.log('\n4 · Jambo\'s own two rows');
    const ask = async q => {
      await goPlace('contracts');
      await waitFor(page, () => !!document.querySelector('#ig-dock textarea'), 6000);
      /* RE-PINNED 27 Oct 2026 (owner: "roll out the jambo capabilities from the board's jambo to all the jambos"): typed on
         Jambo's tab the words go to the AI; these are the free readers, so they type under Overview */
      await page.evaluate(() => { if (typeof pdTalkShows === 'function' && pdTalkShows()) { const t = document.querySelector('#ig-dock [data-pd-talk]'); if (t) t.click(); } });
      await page.fill('#ig-dock textarea', q); await page.press('#ig-dock textarea', 'Enter');
      return waitFor(page, () => { const l = document.querySelector('.is-landed'); return state.view === 'team' && l ? l.id : null; }, 6000);
    };
    const r1 = await ask('take me to my settings for jambo');
    check('4a "take me to my settings for jambo" lands on How you like to work', r1 === 'st-you-work', String(r1));
    await page.screenshot({ path: path.join(OUT, 'jambo-settings-1440x780.png') });
    const r2 = await ask('take me to jambo points');
    check('4b "take me to jambo points" lands on Jambo\'s points', r2 === 'st-you-points', String(r2));
    const r3 = await ask('take me to the language settings');
    check('4c without his name, "the language settings" stays Language', r3 === 'st-you-lang', String(r3));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
