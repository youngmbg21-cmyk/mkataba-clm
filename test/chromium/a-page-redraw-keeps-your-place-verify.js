/* Chromium verification: A REDRAW KEEPS YOUR PLACE AND YOUR WORDS (owner, 13 Nov 2026, the flash survey)
   ============================================================
   The rebuild measure (run 43461225946) found, on the pages: a long list thrown to its top when its page redrew,
   and a half-typed question lost from the list pages' own ask box and Settings' Jambo box on any repaint.
   At 1440 x 780, the new look on, a book long enough to scroll:
     1. the Pulse board: scrolled down, a different ranking pressed — the reader is where they were
     2. a list page: scrolled down, the same page chosen again — its list is where it was
     3. a list page: half a question typed in the panel's box, the page redrawn — the words stand
     4. Settings: half a question typed in Jambo's box, the page redrawn — the words stand
     5. no page errors
   A part the page does not offer here (nothing to scroll, no box) is SAID and not counted, never passed blind.
   Waits ask for the state, bounded. RED at unmodified main (1-4 where driven).
   Run: node test/chromium/a-page-redraw-keeps-your-place-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const WORDS = 'which of these renew before june';
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const skip = (name, why) => console.log(`SKIP  ${name} — ${why}`);
function book(){ const out = []; const st = ['Under Review', 'Signed', 'Draft'];
  for (let i = 0; i < 70; i++){ const f = JSON.parse(JSON.stringify(FIXTURES[i % FIXTURES.length])); f.id = 'MK-P' + (1000 + i); f.name = f.name + ' ' + (i + 1); f.status = st[i % 3]; out.push(f); }
  return out; }

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: book(), approvalRules: [] });
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
    const ready = await until(() => typeof caGo === 'function' && !!currentUser() && (state.contracts || []).length > 20, null, 40000);
    check('0. signed in, the book loaded', !!ready);
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    await page.waitForTimeout(900);
    const go = async place => { await page.evaluate(p => { try { caGo({ kind: 'go', place: p }); } catch (_){ } }, place); await page.waitForTimeout(1100); };
    /* the biggest thing on the page that can scroll: scrolled, and named so it can be found again */
    const scrollDown = () => page.evaluate(() => {
      const c = [document.getElementById('content-scroll'), ...document.querySelectorAll('#content [id]')].filter(el => el && el.scrollHeight > el.clientHeight + 200 && el.clientHeight > 120
        && /auto|scroll/.test(getComputedStyle(el).overflowY)).sort((a, b) => b.clientHeight * b.clientWidth - a.clientHeight * a.clientWidth)[0];
      if (!c) return null; c.scrollTop = 180; return { id: c.id, top: c.scrollTop }; });
    const topOf = id => page.evaluate(id => { const el = document.getElementById(id); return el ? el.scrollTop : null; }, id);

    console.log('\n1 · the Pulse board, ranked another way');
    await go('pulse');
    const s1 = await scrollDown();
    const crit = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-pu-crit]')].find(x => x.getAttribute('aria-pressed') !== 'true' && !x.classList.contains('on') && !x.disabled); if (!b) return false; b.click(); return true; });
    await page.waitForTimeout(700);
    if (!s1 || s1.top < 100) skip('1', 'the Pulse board has nothing to scroll in this book');
    else if (!crit) skip('1', 'no other ranking to press');
    else check('1. the reader is where they were', Math.abs((await topOf(s1.id)) - s1.top) <= 4, `${s1.id}: ${s1.top} -> ${await topOf(s1.id)}`);

    console.log('\n2 · a list page, chosen again');
    await go('oblig');
    let s2 = await scrollDown(); let where = 'oblig';
    if (!s2 || s2.top < 100){ await go('approvals'); s2 = await scrollDown(); where = 'approvals'; }
    if (!s2 || s2.top < 100) skip('2', 'neither Obligations nor Approvals has a list long enough to scroll here');
    else { await page.evaluate(p => { try { caGo({ kind: 'go', place: p }); } catch (_){ } }, where); await page.waitForTimeout(900);
      check(`2. ${where}: its list is where it was`, Math.abs((await topOf(s2.id)) - s2.top) <= 4, `${s2.id}: ${s2.top} -> ${await topOf(s2.id)}`); }

    console.log('\n3 · the list panel\'s own ask box');
    await go('approvals');
    const has3 = await until(() => { const b = document.getElementById('jl-q'); return !!(b && b.getClientRects().length); }, null, 5000);
    if (!has3) skip('3', 'the panel beside the list is not open at this width');
    else { await page.click('#jl-q'); await page.type('#jl-q', WORDS, { delay: 6 });
      await page.evaluate(() => { try { setView(state.view); } catch (_){ } }); await page.waitForTimeout(900);
      const v = await page.evaluate(() => { const b = document.getElementById('jl-q'); return b ? b.value : null; });
      check('3. the words stand after the page is drawn again', v === WORDS, JSON.stringify(v)); }

    console.log('\n4 · Settings\' Jambo box');
    await go('settings');
    const has4 = await until(() => { const b = document.getElementById('st-jb-q'); return !!(b && b.getClientRects().length); }, null, 5000);
    if (!has4) skip('4', 'Settings\' Jambo box is not on screen here');
    else { await page.click('#st-jb-q'); await page.type('#st-jb-q', WORDS, { delay: 6 });
      await page.evaluate(() => { try { renderTeam(); } catch (_){ } }); await page.waitForTimeout(900);
      const v = await page.evaluate(() => { const b = document.getElementById('st-jb-q'); return b ? b.value : null; });
      check('4. the words stand after Settings is drawn again', v === WORDS, JSON.stringify(v)); }

    check('5. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${failures ? failures + ' FAILED' : 'all checks passed'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
