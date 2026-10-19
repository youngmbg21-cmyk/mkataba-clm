/* SETTINGS → YOU AS "ONE SHEET" (round 24 of the redesign: the owner picked
   "One sheet" by name, 17 Oct 2026; js/views/settings.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 You opens on one sheet: a contents list beside it, away first, each
       part a section of rows
     2 a switch changes in its row: Jambo's suggestions off, saved on the
       server (a fresh load still has it), a passing "Saved", and the chips
       beside the page go at once
     3 a choice changes in its row: the brief and where a contract opens
     4 the language buttons switch the whole page, through the bar's writer
     5 the contents list jumps: the section comes into view under the tab
       band and is lit; the list itself stays in view while the page scrolls
     6 a form that needs several boxes keeps its door: Change password opens
       the drawer with its boxes
     7 it fits the owner's three screens
   At the parent (round 23's head) every check fails but 6, which pins what
   the sheet keeps, and the console.
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/one-sheet-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const toYou = async () => { await page.evaluate(() => { setView('team'); }); await until(() => !!document.getElementById('set-page'));
      await page.evaluate(() => settingsGoTab('you')); return until(() => !!document.querySelector('#set-page [data-st-you-card="who"]')); };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && Array.isArray(state.contracts), null, { timeout: 20000 });
    await toYou();

    console.log('\n1 · one sheet');
    const sheet = await page.evaluate(() => ({
      toc: [...document.querySelectorAll('#set-page .st-toc [data-st-toc]')].map(b => b.getAttribute('data-st-toc')),
      secs: [...document.querySelectorAll('#set-page [data-st-you-card]')].map(x => x.getAttribute('data-st-you-card')),
      rows: document.querySelectorAll('#set-page [data-st-you-card] .st-sr').length }));
    check('1a a contents list beside the sheet, one entry per section', sheet.toc.length >= 6 && sheet.toc.join() === sheet.secs.join(), JSON.stringify(sheet));
    check('1b away comes first', sheet.secs[0] === 'away', sheet.secs[0]);
    check('1c each part is rows', sheet.rows >= sheet.secs.length * 1.5, String(sheet.rows));
    await shot(page, 'one-sheet-1440x780');

    console.log('\n2 · a switch changes in its row');
    const chipsBefore = await page.evaluate(() => document.querySelectorAll('#st-side .st-jb-chip').length);
    if (await press('[data-st-sw="chips"]', '2 the suggestions switch')) {
      const saved = await until(() => currentUser().prefs && currentUser().prefs.jamboChips === false
        && document.querySelector('[data-st-sw="chips"]').getAttribute('aria-checked') === 'false' ? true : null, null, 5000);
      check('2a Jambo\'s suggestions off, the row says so', !!saved);
      const told = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /Saved/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; }, null, 4000);
      check('2b a passing "Saved"', !!told, told);
      const chipsAfter = await until(() => document.querySelectorAll('#st-side .st-jb-chip').length === 0 ? 'none' : null, null, 3000);
      check('2c the chips beside the page go at once', chipsBefore > 0 && chipsAfter === 'none', chipsBefore + ' → ' + chipsAfter);
    }

    console.log('\n3 · a choice changes in its row');
    await page.selectOption('[data-st-brief]', 'weekly').catch(() => null);
    await page.selectOption('[data-st-opens]', 'fill').catch(() => null);
    const choices = await until(() => { const p = currentUser().prefs || {}; return p.briefEvery === 'weekly' && p.opensOn === 'fill' ? JSON.stringify({ briefEvery: p.briefEvery, opensOn: p.opensOn }) : null; }, null, 5000);
    check('3a the brief and where a contract opens are saved as they change', !!choices, choices);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    await toYou();
    const kept = await until(() => { const p = currentUser().prefs || {};
      const sw = document.querySelector('[data-st-sw="chips"]'), b = document.querySelector('[data-st-brief]'), o = document.querySelector('[data-st-opens]');
      return sw && b && o ? { chips: p.jamboChips, sw: sw.getAttribute('aria-checked'), brief: b.value, opens: o.value } : null; }, null, 8000);
    check('3b a fresh load still has all three, and the rows say them', !!kept && kept.chips === false && kept.sw === 'false' && kept.brief === 'weekly' && kept.opens === 'fill', JSON.stringify(kept));

    console.log('\n4 · the language buttons');
    if (await press('[data-st-lang="sv"]', '4 Svenska')) {
      const sv = await until(() => langId() === 'sv' && /Språk|språk/.test((document.querySelector('#set-page [data-st-toc="lang"]') || {}).textContent || '') ? (document.querySelector('#set-page [data-st-toc="lang"]') || {}).textContent : null, null, 6000);
      check('4a the page turns Swedish, the sheet with it', !!sv, String(sv));
      await page.evaluate(() => { const b = document.querySelector('[data-st-lang="en"]'); if (b) b.click(); });
      const en = await until(() => langId() === 'en' ? 'en' : null, null, 6000);
      check('4b and back', en === 'en', String(en));
    }

    console.log('\n5 · the contents list');
    await toYou();
    if (await press('[data-st-toc="data"]', '5 Your data')) {
      const at = await until(() => { const s = document.getElementById('st-you-data'); if (!s) return null; const r = s.getBoundingClientRect();
        const band = (document.querySelector('.st-tabs-pin') || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom;
        const toc = document.querySelector('#set-page .st-toc').getBoundingClientRect();
        /* re-pointed 19 Oct 2026 (LAND ON IT, main's rule): lit by the one lander;
           the tabs are the head card's now, so the band is only where one pins */
        return r.top >= band - 1 && r.bottom <= innerHeight + 1 && s.classList.contains('is-landed') ? { top: Math.round(r.top), band: Math.round(band), tocTop: Math.round(toc.top), tocBottom: Math.round(toc.bottom) } : null; }, null, 5000);
      check('5a the section comes into view, lit', !!at, JSON.stringify(at));
      check('5b the list stays in view under the tab band', !!at && at.tocTop >= at.band - 1 && at.tocBottom <= 780, JSON.stringify(at));
      const cur = await page.evaluate(() => (document.querySelector('#set-page .st-toc [aria-current="true"]') || {}).getAttribute && document.querySelector('#set-page .st-toc [aria-current="true"]').getAttribute('data-st-toc'));
      check('5c and marks where you are', cur === 'data', String(cur));
    }

    /* RE-POINTED 18 Oct 2026 (the gaps, round 24 as drawn: "Opens in place"):
       the form opens IN ITS ROW, the same boxes the drawer had */
    console.log('\n6 · a form with several boxes opens in its row');
    await toYou();
    if (await press('[data-st-you-card="safety"] [data-st-rform="me:password"]', '6 Change password')) {
      const d = await until(() => { const f = document.getElementById('st-rform'); const dr = document.getElementById('st-drawer');
        return f && f.closest('[data-st-you-card="safety"]') && document.getElementById('pw-cur') && document.getElementById('pw-again') && !(dr && dr.classList.contains('open')) ? true : null; }, null, 5000);
      check('6 Change password opens its boxes in its row', !!d);
      await page.evaluate(() => stRowFormClose());
    }

    console.log('\n7 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await toYou(); await page.waitForTimeout(300);
      const fit = await page.evaluate(() => {
        const secs = [...document.querySelectorAll('#set-page [data-st-you-card]')];
        const past = secs.flatMap(s => { const R = s.getBoundingClientRect(); return [...s.querySelectorAll('.st-sr *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > R.right + 1; }); }).length;
        const toc = document.querySelector('#set-page .st-toc'); const tr = toc ? toc.getBoundingClientRect() : null;
        return { sx: document.scrollingElement.scrollWidth > innerWidth, past, toc: !!tr && tr.width > 100 && tr.right < secs[0].getBoundingClientRect().left };
      });
      check(`7 at ${w}×${hh}: no sideways scroll, nothing past a section's edge, the contents list beside`, !fit.sx && fit.past === 0 && fit.toc, JSON.stringify(fit));
      await shot(page, `one-sheet-${w}x${hh}`);
    }
    await page.evaluate(() => { stPrefSet('jamboChips', true); stPrefSet('opensOn', 'jambo'); });

    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
