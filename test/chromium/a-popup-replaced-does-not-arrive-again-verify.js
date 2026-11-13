/* Chromium verification: ONE POP-UP TAKING ANOTHER'S PLACE DOES NOT ARRIVE AGAIN (owner, 13 Nov 2026, the flash survey)
   ============================================================
   "a press that should only change the words rebuilds the whole page instead." The History timeline rebuilt itself
   on every filter change, and each rebuild replayed the pop-up's arriving animation and threw the reader to the top.
   At 1440 x 780, the new look on:
     1. a first open arrives as it always has (the animation plays)
     2. the same pop-up drawn again (a filter changed) does NOT animate in
     3. and it keeps the reader's place where the screen can scroll
     4. a DIFFERENT pop-up taking its place does not animate in either, and starts at its own top
     5. closed and opened fresh, it arrives again (nothing was switched off for good)
     6. no page errors
   Waits ask for the state, bounded. RED at unmodified main (2, 3, 4).
   Run: node test/chromium/a-popup-replaced-does-not-arrive-again-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { const t0 = Date.now();
      while (Date.now() - t0 < ms) { let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return null; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const ready = await until(() => typeof openModal === 'function' && !!currentUser() && !!(state.contracts || []).length, null, 40000);
    check('0. signed in, the book loaded', !!ready);
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    await page.waitForTimeout(800);

    /* a tall named screen of our own, opened through the ONE opener, so the check does not lean on any page's data */
    const tall = n => `<div id="pk-screen" style="padding:20px"><h2>Screen ${n}</h2>${Array.from({ length: 60 }, (_, i) => `<p>Line ${i + 1} of screen ${n}</p>`).join('')}</div>`;
    const anim = () => page.evaluate(() => { const p = document.querySelector('#modal-root [role="dialog"]'); if (!p) return null;
      return { kept: p.hasAttribute('data-dlg-kept'), name: getComputedStyle(p).animationName, top: p.scrollTop, words: (p.querySelector('h2') || {}).textContent || '' }; });

    console.log('\n1 · a first open arrives');
    await page.evaluate(html => { closeModal(); openModal(html, { label: 'Probe' }); }, tall(1));
    const a1 = await anim();
    check('1a. the pop-up is open', !!a1 && /Screen 1/.test(a1.words));
    check('1b. and it arrives as it always has (animated, not marked kept)', !!a1 && !a1.kept && a1.name !== 'none', JSON.stringify(a1));

    console.log('\n2-3 · the same screen drawn again');
    await page.evaluate(() => { document.querySelector('#modal-root [role="dialog"]').scrollTop = 300; });
    await page.evaluate(html => openModal(html, { label: 'Probe' }), tall(2));
    const a2 = await anim();
    check('2a. the new words are on screen', !!a2 && /Screen 2/.test(a2.words), JSON.stringify(a2));
    check('2b. it does NOT animate in again', !!a2 && a2.kept && a2.name === 'none', JSON.stringify(a2));
    check('3. and the reader is where they were', !!a2 && Math.abs(a2.top - 300) <= 2, 'top=' + (a2 && a2.top));

    console.log('\n4 · a different pop-up takes its place');
    await page.evaluate(() => openModal('<div id="pk-other" style="padding:20px"><h2>Other</h2>' + Array.from({ length: 60 }, (_, i) => '<p>Other ' + i + '</p>').join('') + '</div>', { label: 'Another' }));
    const a4 = await anim();
    check('4a. it does not animate in either (the frame was standing)', !!a4 && a4.kept && a4.name === 'none', JSON.stringify(a4));
    check('4b. and it starts at its own top', !!a4 && a4.top === 0, 'top=' + (a4 && a4.top));

    console.log('\n5 · closed, then opened fresh');
    await page.evaluate(html => { closeModal(); openModal(html, { label: 'Probe' }); }, tall(3));
    const a5 = await anim();
    check('5. it arrives again', !!a5 && !a5.kept && a5.name !== 'none', JSON.stringify(a5));

    console.log('\n· the History timeline itself');
    const hist = await page.evaluate(() => { closeModal(); const c = (state.contracts || [])[0]; if (!c || typeof openHistoryTimeline !== 'function') return null;
      openHistoryTimeline(c); const sel = document.querySelector('#history-timeline [data-ht-filter]'); if (!sel) return { noFilter: true };
      const opt = [...sel.options].find(o => o.value); if (!opt) return { noFilter: true };
      sel.value = opt.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
      const p = document.querySelector('#modal-root [role="dialog"]'); return { kept: !!(p && p.hasAttribute('data-dlg-kept')), there: !!document.getElementById('history-timeline') }; });
    if (hist && hist.noFilter) console.log('  (this book\'s first contract offers no filter to change: the timeline case is not driven)');
    else check('H. a filter changed: the timeline is drawn in the standing frame', !!hist && hist.kept && hist.there, JSON.stringify(hist));

    await page.evaluate(() => closeModal());
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${failures ? failures + ' FAILED' : 'all checks passed'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
