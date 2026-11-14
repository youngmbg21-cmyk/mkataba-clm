/* Chromium verification: THE GUARD — NOTHING IS THROWN AWAY THAT ONLY NEEDED A WORD CHANGED (owner, 13–14 Nov 2026)
   ============================================================
   The flash survey's last round. The rebuild measure finds; this CHECKS, on a short fixed list of presses, that a
   press which leaves the reader where they are keeps what they typed and where they had scrolled. A press named in
   test/thrown-away-known.json is expected to fail today (with its reason); that list may only shrink — a known press
   that starts passing fails this check until it is taken off. A press this book cannot drive is SAID, never passed.
     1. Home: words in Jambo's box survive Collapse panel and opening again
     2. Home: words in Jambo's box survive the ✦ window opening and closing
     3. the Calendar: words in its ask box survive the ✦ window opening and closing
     4. a list page: words in the panel's ask box survive the page being drawn again
     5. Settings: words in Jambo's box survive the page being drawn again
     6. the Handbook: a chapter pressed low in the chapter list keeps the list where it was
     6b. the Handbook: the chapter being read keeps its place when the page is drawn again (Jambo's panel buttons, a
         Recent ×, an alert opened all redraw it; 14 Nov 2026, the measure after round 3)
     6c. the Handbook: the side panel is the same panel after the page is drawn again — not thrown away and built again
         with the same words (14 Nov 2026, the last flicker)
     7. Our paper: a standard pressed low in the list keeps the list where it was
     8. Jambo's house: words in the contract picker (KNOWN: the picker writes the chosen name back)
     9. no page errors
   Waits ask for the state, bounded. Run: node test/chromium/nothing-is-thrown-away-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const KNOWN = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'thrown-away-known.json'), 'utf8'));
const WORDS = 'which of these renew before june';
let failures = 0;
const say = (k, name, pass, detail) => {
  const known = Object.prototype.hasOwnProperty.call(KNOWN, k);
  if (known && pass){ console.log(`FAIL  ${name} — it now passes: take "${k}" off test/thrown-away-known.json`); failures++; return; }
  if (known){ console.log(`KNOWN ${name} — ${KNOWN[k]}`); return; }
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
const skip = (name, why) => console.log(`SKIP  ${name} — ${why}`);
function book(){ const out = []; const st = ['Under Review', 'Signed', 'Draft'];
  for (let i = 0; i < 60; i++){ const f = JSON.parse(JSON.stringify(FIXTURES[i % FIXTURES.length])); f.id = 'MK-G' + (1000 + i); f.name = f.name + ' ' + (i + 1); f.status = st[i % 3]; out.push(f); }
  return out; }

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: book(), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    /* THE WINDOW IN THE PAGE IS WHAT THIS FILE PRESSES THE ✦ FOR (14 Nov 2026): where the browser keeps a window on top the ✦ opens Jambo popped out (ai.js aiStarPress, f1049), so this page is a browser without one, as Safari and Firefox are */
    await page.addInitScript(() => { try { Object.defineProperty(window, 'documentPictureInPicture', { configurable: true, writable: true, value: undefined }); } catch (_) {} });
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 10000) => { const t0 = Date.now();
      while (Date.now() - t0 < ms) { let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return null; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    const ready = await until(() => typeof caGo === 'function' && !!currentUser() && (state.contracts || []).length > 20, null, 40000);
    console.log(ready ? 'PASS  0. signed in, the book loaded' : 'FAIL  0. signed in, the book loaded'); if (!ready) failures++;
    await page.evaluate(async () => { try { await stPrefSet('newLook', true); } catch (_){ } try { newLookApply(); } catch (_){ } });
    await page.waitForTimeout(800);
    const go = async place => { await page.evaluate(p => { try { caGo({ kind: 'go', place: p }); } catch (_){ } }, place); await page.waitForTimeout(1100); };
    const seen = sel => page.evaluate(s => { const b = document.querySelector(s); return !!(b && b.getClientRects().length && !b.disabled); }, sel);
    const valueOf = sel => page.evaluate(s => { const b = document.querySelector(s); return b ? b.value : null; }, sel);
    /* a person types: a trusted click and real key presses */
    const typeIn = async sel => { if (!await seen(sel)) return false; await page.click(sel); await page.fill(sel, ''); await page.type(sel, WORDS, { delay: 5 }); await page.waitForTimeout(120); return (await valueOf(sel)) === WORDS; };
    const press = async sel => { const ok = await page.evaluate(s => { const b = document.querySelector(s); if (!b) return false; b.click(); return true; }, sel); await page.waitForTimeout(600); return ok; };
    const openDock = () => page.evaluate(() => { try { if (window.intel && !intel.dockOpen){ intel.dockOpen = true; renderIntelDock(); } } catch (_){ } });
    /* the biggest scroller inside a host that matches, scrolled, and the row to press inside it low down */
    const scrollAndPick = (host, rowSel) => page.evaluate(({ host, rowSel }) => {
      const H = document.querySelector(host); if (!H) return { why: 'no ' + host };
      const rows = [...H.querySelectorAll(rowSel)].filter(r => r.getClientRects().length); if (rows.length < 4) return { why: 'only ' + rows.length + ' rows' };
      let sc = rows[rows.length - 1].parentElement;
      while (sc && sc !== document.body && !(sc.scrollHeight > sc.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(sc).overflowY))) sc = sc.parentElement;
      if (!sc || sc === document.body) return { why: 'the list does not scroll at this size' };
      sc.scrollTop = Math.min(sc.scrollHeight - sc.clientHeight, 220); if (sc.scrollTop < 60) return { why: 'the list is too short to scroll far' };
      sc.setAttribute('data-guard-sc', host);
      const low = rows.filter(r => { const a = r.getBoundingClientRect(), b = sc.getBoundingClientRect(); return a.top >= b.top && a.bottom <= b.bottom; }).pop();
      if (!low) return { why: 'no row in sight' };
      const top = sc.scrollTop, label = (low.textContent || '').trim().slice(0, 40); low.click();
      return { top, label }; }, { host, rowSel });
    /* the same scroller after the press: by its mark, looked for in the WHOLE page (a list's scroller can stand
       AROUND the part that is drawn again — GitHub's first two runs looked only inside it, found nothing, and read
       0), else the biggest scroller in the host again */
    const scrollAfter = host => page.evaluate(host => { const H = document.querySelector(host); if (!H) return null;
      const m = [...document.querySelectorAll('[data-guard-sc]')].find(x => x.getAttribute('data-guard-sc') === host);
      if (m) return { top: m.scrollTop, max: m.scrollHeight - m.clientHeight };
      const all = [...H.querySelectorAll('*')].filter(el => el.scrollHeight > el.clientHeight + 40 && /auto|scroll/.test(getComputedStyle(el).overflowY));
      all.sort((a, b) => b.scrollTop - a.scrollTop); return all.length ? { top: all[0].scrollTop, max: all[0].scrollHeight - all[0].clientHeight } : { top: 0, max: 0 }; }, host);
    /* KEPT means where it was, or as far down as the list now goes: a page an inch shorter after the press holds a
       list that stood at its bottom at its NEW bottom (GitHub's third run: 104 -> 86, with 86 the furthest it went) */
    const kept = (was, now) => !!now && Math.abs(now.top - Math.min(was, now.max)) <= 6;
    const said = (was, now) => now ? `${was} -> ${now.top} (the furthest it goes now: ${now.max})` : 'the list is gone';

    console.log('\n1-2 · Home, Jambo\'s box');
    await go('board'); await openDock();
    if (!await typeIn('#igd-input')) skip('1-2', 'Jambo\'s box is not on screen');
    else { await press('#igd-collapse'); await openDock(); await page.waitForTimeout(300);
      say('home-collapse', '1. words survive Collapse panel', (await valueOf('#igd-input')) === WORDS, JSON.stringify(await valueOf('#igd-input')));
      await typeIn('#igd-input'); await press('#cmd-ai'); await press('#ai-close'); await openDock(); await page.waitForTimeout(300);
      say('home-window', '2. words survive the ✦ window', (await valueOf('#igd-input')) === WORDS, JSON.stringify(await valueOf('#igd-input'))); }

    console.log('\n3 · the Calendar');
    await go('calendar'); await openDock(); await page.waitForTimeout(500);
    const calBox = (await seen('#igd-input')) ? '#igd-input' : (await seen('#cal-plan-in')) ? '#cal-plan-in' : null;
    if (!calBox || !await typeIn(calBox)) skip('3', 'no ask box on the Calendar at this size');
    else { await press('#cmd-ai'); await press('#ai-close'); await page.waitForTimeout(400);
      const box = (await seen(calBox)) ? calBox : ((await seen('#igd-input')) ? '#igd-input' : '#cal-plan-in');
      say('calendar-window', `3. the Calendar's box (${calBox}) keeps the words through the ✦ window`, (await valueOf(box)) === WORDS, JSON.stringify(await valueOf(box))); }

    console.log('\n4 · a list page\'s ask box');
    await go('approvals');
    if (!await typeIn('#jl-q')) skip('4', 'the panel beside the list is not open at this width');
    else { await page.evaluate(() => { try { setView(state.view); } catch (_){ } }); await page.waitForTimeout(900);
      say('list-redraw', '4. the list panel\'s words survive the page drawn again', (await valueOf('#jl-q')) === WORDS, JSON.stringify(await valueOf('#jl-q'))); }

    console.log('\n5 · Settings');
    await go('settings'); await page.waitForTimeout(500);
    if (!await typeIn('#st-jb-q')) skip('5', 'Settings\' Jambo box is not on screen');
    else { await page.evaluate(() => { try { setView('team'); } catch (_){ } }); await page.waitForTimeout(900);
      say('settings-redraw', '5. Settings\' words survive the page drawn again', (await valueOf('#st-jb-q')) === WORDS, JSON.stringify(await valueOf('#st-jb-q'))); }

    console.log('\n6 · the Handbook\'s chapter list');
    await go('handbook'); await page.waitForTimeout(500);
    const h6 = await scrollAndPick('#hbk-page', '[data-hbkn-ch], [data-hbk-part]');
    if (!h6 || h6.why) skip('6', (h6 && h6.why) || 'no Handbook');
    else { await page.waitForTimeout(700); const now = await scrollAfter('#hbk-page');
      say('handbook-list', `6. pressing "${h6.label}" keeps the chapter list where it was`, kept(h6.top, now), said(h6.top, now)); }

    console.log('\n6b · the Handbook\'s chapter, drawn again');
    { const was = await page.evaluate(() => { const sc = document.getElementById('hbk-body'); if (!sc) return { why: 'no chapter on screen' };
        if (sc.scrollHeight - sc.clientHeight < 120) return { why: 'the chapter is too short to scroll' };
        sc.scrollTop = Math.min(300, sc.scrollHeight - sc.clientHeight); return { top: sc.scrollTop }; });
      if (was.why) skip('6b', was.why);
      else { await page.evaluate(() => { try { renderHandbook(); } catch (_){ } }); await page.waitForTimeout(500);
        const now = await page.evaluate(() => { const sc = document.getElementById('hbk-body'); return sc ? { top: sc.scrollTop, max: sc.scrollHeight - sc.clientHeight } : null; });
        say('handbook-chapter', '6b. the chapter being read keeps its place when the page is drawn again', kept(was.top, now), said(was.top, now)); } }

    console.log('\n6c · the Handbook\'s side panel, drawn again');
    { const had = await page.evaluate(() => { const p = document.getElementById('ins-panel'); if (!p) return false; p.__keep6c = 1; return true; });
      if (!had) skip('6c', 'no side panel on the Handbook at this width');
      else { await page.evaluate(() => { try { renderHandbook(); } catch (_){ } }); await page.waitForTimeout(400);
        const same = await page.evaluate(() => { const p = document.getElementById('ins-panel'); return !!(p && p.__keep6c === 1); });
        say('handbook-panel', '6c. the Handbook\'s side panel is kept when the page is drawn again', same, same ? null : 'a new panel was built'); } }

    console.log('\n7 · Our paper\'s list');
    await go('ourpaper'); await page.waitForTimeout(600);
    const h7 = await scrollAndPick('[data-tpl-sec="book"]', '[data-tpl-pf]');
    if (!h7 || h7.why) skip('7', (h7 && h7.why) || 'no Our paper');
    else { await page.waitForTimeout(700); const now = await scrollAfter('[data-tpl-sec="book"]');
      say('ourpaper-list', `7. pressing "${h7.label}" keeps the list where it was`, kept(h7.top, now), said(h7.top, now)); }

    console.log('\n8 · Jambo\'s house');
    await go('house'); await page.waitForTimeout(600);
    if (!await typeIn('#jh-one')) skip('8', 'the contract picker is not on screen');
    else { await page.evaluate(() => { try { setView(state.view); } catch (_){ } }); await page.waitForTimeout(900);
      say('house-contract-picker', '8. the contract picker keeps a half-typed word', (await valueOf('#jh-one')) === WORDS, JSON.stringify(await valueOf('#jh-one'))); }

    const errs = errors.filter(e => !/ResizeObserver/.test(e));
    console.log(errs.length ? `FAIL  9. no page errors — ${errs.slice(0, 3).join(' | ')}` : 'PASS  9. no page errors'); if (errs.length) failures++;
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${failures ? failures + ' FAILED' : 'all checks passed'}`);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
