/* Chromium verification: THE SETTINGS LIST IS GROUPED, SEARCHED AND LED BY
   WHAT IS OWED  (owner-approved 18 Sep 2026, off the "HaTi — Design Direction"
   canvas)
   ============================================================
   f193 proves the shape in jsdom, which resolves no class rules at all — so a
   group heading that is on the page and invisible passes it. This file opens
   the real shell and asks the questions only a browser can answer: are the
   headings PAINTED, does the search really narrow, does the attention block
   really cross tabs, and does the drawer really walk you to the next panel.

   AND IT MEASURES THE ONE THING THE WHOLE PAGE WAS REBUILT FOR: typing must
   not move the page (THE SETTINGS PAGE HOLDS STILL).

   AGAINST THE PARENT: 30 of 33 fail. The three that pass are NAMED CONTROLS,
   and they are the point of naming them — 2c (every row already carried a
   status dot), 5d (the drawer already said in one line what a panel decides)
   and the page-errors sweep. They prove this change kept what was working
   rather than rebuilding it, which is the half of a redesign nobody tests.

   RE-POINTED IN PLACE 16 Oct 2026 (the Control Room, the owner's pick): the
   platform and build tabs became ONE Company board, every group a CARD of
   the same rows, and the one search box moved into the side panel's Menu.
   Every claim below is the claim it was, asked where it now stands.

   Run: node test/chromium/settings-groups-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
/* Screenshots go where the runner may write. */
const SHOTS = process.env.HATI_SHOT_DIR || '';

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const shot = async (page, name) => {
  if (!SHOTS) return;
  try { await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false }); } catch (e) {}
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

/* PAINTED, not merely present: a real box, through every ancestor. */
const PAINTED = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden') || cs.display === 'none' || cs.visibility === 'hidden')
      return { ok: false, why: (n.id || n.className || n.tagName) + ' is hidden' };
    n = n.parentElement;
  }
  const r = el.getBoundingClientRect();
  return { ok: r.width > 0 && r.height > 0, why: `${Math.round(r.width)}x${Math.round(r.height)}` };
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'admin@example.co.ke', 'adminpassword1');
    await page.evaluate(() => setView('team'));
    await page.waitForTimeout(1000);
    await page.waitForFunction(() => !!document.querySelector('.stn-page #stn-main .sdd-row'), null, { timeout: 10000 }).catch(() => {});
    await shot(page, 'settings-company');

    /* RETIRED 16 Nov 2026 (#762): 1a–1e (the Company board's cards: painted names, no card a wall, every panel once,
       People & the ladder), 2a/2c (the cards' facts and their dots), 3a–3d (Needs you leading the board), 4a–4h (the
       Menu's search box narrowing the groups) and 6a–6c (Build & launch's card, the Menu's seven, a tab press clearing
       the search) — the Company board, its Menu and the You · Company tabs are the old look's. Settings is one list by
       area (settings-menu-verify); what needs an admin is Jambo's panel beside it. Section 5, the drawer, stands. */

    /* ============ 5. THE DRAWER SAYS WHERE YOU ARE ============ */
    /* RE-POINTED 16 Nov 2026 (#762): the approvals door is its row on the one list */
    await page.click('.stn-page #stn-main [data-st-panel="approvals"]');
    await page.waitForTimeout(600);
    await shot(page, 'settings-drawer');
    const crumb = await page.evaluate(PAINTED, '.st-dcrumb');
    check('5a. the drawer carries a painted crumb', crumb.ok, crumb.why);
    const crumbText = await page.evaluate(() => ({
      g: (document.querySelector('.st-dcrumb-g') || {}).textContent || '',
      n: (document.querySelector('.st-dcrumb-n') || {}).textContent || '',
      title: (document.querySelector('#st-drawer-title') || {}).textContent || '',
      sub: (document.querySelector('.rvd-sub') || {}).textContent || ''
    }));
    check('5b. it names the group this panel governs', /agreement|avtalet/i.test(crumbText.g), crumbText.g);
    check('5c. and where in the group you are', /\d+\s*(of|av)\s*\d+/i.test(crumbText.n), crumbText.n);
    check('5d. the panel still says in one line what it decides',
      crumbText.sub.trim().length > 0, crumbText.sub.trim().slice(0, 60));
    const next = await page.evaluate(PAINTED, '.st-dnext');
    check('5e. the foot offers the next panel in the group', next.ok, next.why);
    const nextLabel = await page.evaluate(() => (document.querySelector('.st-dnext') || {}).textContent || '');
    const nextKey = await page.evaluate(() => (document.querySelector('.st-dnext') || {}).getAttribute
      ? document.querySelector('.st-dnext').getAttribute('data-st-panel') : '');
    check('5f. and it names it rather than saying "next"', /:/.test(nextLabel), nextLabel.trim());
    /* PRESS IT FOR REAL — a link that looks right and does nothing is the
       fault this codebase has paid for three times. Guarded, so a build
       without it reports rather than throws. */
    if (!next.ok) {
      check('5g. PRESSING IT really moves the drawer to that panel', false, 'no next door on this build');
      check('5h. and the position counts up with it', false, 'no next door on this build');
    } else {
      await page.click('.st-dnext');
      await page.waitForTimeout(600);
      const landed = await page.evaluate(() => ({
        title: (document.querySelector('#st-drawer-title') || {}).textContent || '',
        n: (document.querySelector('.st-dcrumb-n') || {}).textContent || ''
      }));
      check('5g. PRESSING IT really moves the drawer to that panel',
        landed.title.trim().length > 0 && landed.title.trim() !== crumbText.title.trim(),
        `${crumbText.title.trim()} -> ${landed.title.trim()} (${nextKey})`);
      /* RE-POINTED 4 Oct 2026: this read "2 of", which held only while the
         approval rules led their group — the rules page leads it now. PIN THE
         RELATION: the position counts up by one from where the drawer was. */
      const at = t => Number((/(\d+)\s*(of|av)/i.exec(t) || [])[1]);
      check('5h. and the position counts up with it', at(landed.n) === at(crumbText.n) + 1, `${crumbText.n} -> ${landed.n}`);
    }

    await page.keyboard.press('Escape');

    check('no page errors anywhere', errors.length === 0, errors.slice(0, 3).join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e && e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} passed`);
  process.exit(pass === results.length ? 0 : 1);
})();
