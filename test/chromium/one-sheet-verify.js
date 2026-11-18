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
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): You is the one list's "You" area (Name, Language,
       Two-step, Alerts…); how you work (Jambo's suggestions, the brief, where a contract opens) and the password are in
       the avatar's account drawer. The round-24 sheet — its contents list, its sections, the forms in their rows — is
       the old look's. */
    const toYou = async () => { await page.evaluate(() => { if (typeof stDrawerClose === 'function') try { stDrawerClose(); } catch (_) {} setView('team'); });
      return until(() => !!document.querySelector('.stn-page #stn-sec-you') && !!document.querySelector('#stn-name')); };
    const toAccount = async () => { await page.evaluate(() => { if (typeof openMyAccount === 'function') openMyAccount(); }); return until(() => !!document.getElementById('pref-jb-chips')); };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && Array.isArray(state.contracts), null, { timeout: 20000 });
    await toYou();

    /* RETIRED 16 Nov 2026 (#762): 1a–1c (a contents list beside the sheet, away first, each part rows), 2c (the chips
       beside the page go at once — the old side feed), 5a–5c (the contents list jumps and marks where you are) — the
       round-24 sheet is the old look's */
    await shot(page, 'one-sheet-1440x780');

    console.log('\n2 · a switch changes where it stands');
    await page.click('#rail-avatar').catch(() => null);
    if (!(await toAccount())) await toAccount();
    if (await press('#pref-jb-chips', '2 the suggestions switch')) {
      const saved = await until(() => currentUser().prefs && currentUser().prefs.jamboChips === false && document.getElementById('pref-jb-chips').checked === false ? true : null, null, 5000);
      check('2a Jambo\'s suggestions off, the switch says so', !!saved);
      const told = await until(() => { const t = (document.getElementById('toast-root') || {}).textContent || ''; return /Saved/.test(t) ? t.replace(/\s+/g, ' ').trim() : null; }, null, 4000);
      check('2b a passing "Saved"', !!told, told);
    }

    console.log('\n3 · a choice changes where it stands');
    await page.locator('[data-pref-brief="weekly"]').first().check().catch(() => null);
    await page.selectOption('#pref-opens-on', 'fill').catch(() => null);
    const choices = await until(() => { const p = currentUser().prefs || {}; return p.briefEvery === 'weekly' && p.opensOn === 'fill' ? JSON.stringify({ briefEvery: p.briefEvery, opensOn: p.opensOn }) : null; }, null, 5000);
    check('3a the brief and where a contract opens are saved as they change', !!choices, choices);
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    await toAccount();
    const kept = await until(() => { const p = currentUser().prefs || {};
      const sw = document.getElementById('pref-jb-chips'), b = document.querySelector('[data-pref-brief]:checked'), o = document.getElementById('pref-opens-on');
      return sw && b && o ? { chips: p.jamboChips, sw: sw.checked, brief: b.getAttribute('data-pref-brief'), opens: o.value } : null; }, null, 8000);
    check('3b a fresh load still has all three, and the drawer says them', !!kept && kept.chips === false && kept.sw === false && kept.brief === 'weekly' && kept.opens === 'fill', JSON.stringify(kept));

    console.log('\n4 · the language buttons');
    await toYou();
    if (await press('#stn-lang [data-st-lang="sv"]', '4 Svenska')) {
      const sv = await until(() => langId() === 'sv' && /^Du$/.test(((document.querySelector('#set-page #stn-sec-you') || {}).textContent || '').trim()) ? document.querySelector('#set-page #stn-sec-you').textContent : null, null, 6000);
      check('4a the page turns Swedish, the list with it', !!sv, String(sv));
      await page.evaluate(() => { const b = document.querySelector('#stn-lang [data-st-lang="en"]'); if (b) b.click(); });
      const en = await until(() => langId() === 'en' ? 'en' : null, null, 6000);
      check('4b and back', en === 'en', String(en));
    }

    console.log('\n6 · a form with several boxes');
    await toAccount();
    if (await press('#st-drawer [data-st-panel="me:password"]', '6 Change password')) {
      const d = await until(() => document.getElementById('pw-cur') && document.getElementById('pw-again') ? true : null, null, 5000);
      check('6 Change password opens its boxes', !!d);
      await page.keyboard.press('Escape');
    }

    console.log('\n7 · the owner\'s three screens');
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await toYou(); await page.waitForTimeout(300);
      const fit = await page.evaluate(() => {
        const card = document.querySelector('.stn-card'); const R = card.getBoundingClientRect();
        const past = [...document.querySelectorAll('#stn-main .stn-row *')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > R.right + 1; }).length;
        const panel = document.getElementById('ins-panel'); const pr = panel ? panel.getBoundingClientRect() : null;
        return { sx: document.scrollingElement.scrollWidth > innerWidth, past, panel: !!pr && pr.width > 100 && pr.left >= R.right - 1 };
      });
      check(`7 at ${w}×${hh}: no sideways scroll, nothing past the list's edge, Jambo's panel beside`, !fit.sx && fit.past === 0 && fit.panel, JSON.stringify(fit));
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
