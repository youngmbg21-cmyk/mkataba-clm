/* Chromium verification of THE APP READ IN SWEDISH, AT REAL WIDTHS.
   ============================================================
   Two things the Node suite cannot check, because both need a real browser
   laying out real text:

     1  SWEDISH RUNS LONGER. Roughly 10–15% longer than English as a rule, and
        much worse in places — "Genomsnittlig handläggningstid" is 30
        characters against "Avg turnaround time"'s 19. HaTi's screens are dense
        with narrow columns and small buttons, so the question is not whether
        the words are right but whether they still FIT. This walks every screen
        at the two most common laptop sizes and the phone, in Swedish, and
        fails on anything cut off or spilling off the side.

     2  THE SWITCH WORKS FROM EVERY SCREEN, with content loaded — not just from
        the dashboard where it happens to be easy.

   It also pins the thing the whole language layer rests on: switching language
   must not move the MARKET. The market decides what the contracts say and is
   the company's; the language is the person's.

   Run: node test/chromium/swedish-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const SIZES = [
  { name: '1080p @150% (ThinkPad)', w: 1280, h: 590, dpr: 1.5 },
  { name: '1366x768',               w: 1366, h: 638, dpr: 1 },
  /* THE GAP BETWEEN THE TWO SHELLS. Above 900 the toggle is in the header;
     below 768 the phone shell draws instead and carries its own rows. Between
     them the desktop shell survives with a header too cramped to hold the
     toggle, so it relocates into the nav drawer — a third arrangement, with
     its own CSS, that neither of the other sizes touches. */
  { name: 'narrow desktop 800 (drawer)', w: 800, h: 700, dpr: 2 },
  { name: 'phone 390',              w: 390,  h: 780, dpr: 3 },
];
const VIEWS = ['dashboard', 'register', 'calendar', 'intel', 'templates', 'team',
  'advice', 'reports', 'queue', 'migration', 'playbook'];

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Same exemptions as laptops-verify: a deliberately clipped decorative glow,
   the visually-hidden turn banner, and the scrollers that are meant to scroll. */
const PROBE = () => {
  const out = { cut: [], spill: [] };
  const lab = el => el.tagName.toLowerCase() + (el.id ? '#' + el.id : '')
    + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/)[0] : '');
  const EXEMPT = /hm-hero|rl-turnwrap|nego-turn|live-dot/;
  const seen = new Set();
  document.querySelectorAll('#app-shell *, #m-root *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) return;
    const cs = getComputedStyle(el);
    const k = lab(el);
    if (EXEMPT.test(k)) return;
    /* CUT SIDEWAYS is the Swedish-specific failure: a label longer than its
       box, with the box hiding the overflow and no way to scroll to it. */
    if (el.scrollWidth > el.clientWidth + 2 && ['hidden', 'clip'].includes(cs.overflowX)
        && cs.textOverflow !== 'ellipsis') {
      if (!seen.has('w' + k)) { seen.add('w' + k); out.cut.push({ el: k, over: el.scrollWidth - el.clientWidth }); }
    }
  });
  /* Nothing may push the PAGE sideways — a horizontal scrollbar on the body is
     the visible form of "the translation did not fit". */
  const de = document.documentElement;
  if (de.scrollWidth > de.clientWidth + 2) out.spill.push(de.scrollWidth - de.clientWidth);
  return out;
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  for (const S of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: S.w, height: S.h }, deviceScaleFactor: S.dpr });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(`${S.name}: ${e.message}`));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    // ---- the market before we touch anything ----
    const marketBefore = await page.evaluate(() => window.jxId());

    /* ---- SWITCH TO SWEDISH BY CLICKING THE CONTROL ----
       Not window.langSet(). Every earlier version of this test called the
       function directly, which is why it stayed green while the picker itself
       was invisible: the search bar was painted on top of it, so the switch
       worked and nobody could reach it. A test that drives the app through
       JavaScript proves the engine, not the button. */
    /* TWO SHELLS, TWO CONTROLS. Below 768 the desktop shell is hidden outright
       and js/mobile*.js draws the app, so the header toggle does not exist
       there at all — the phone carries its own language rows in the account
       sheet. Between 768 and 900 the desktop shell survives but its header has
       no room, and the toggle relocates into the nav drawer.

       Every one of these paths is CLICKED. Reaching in with window.langSet is
       what let an invisible control pass for a working one. */
    const onPhone = await page.evaluate(() =>
      getComputedStyle(document.getElementById('app-shell')).display === 'none');

    const pick = async lang => {
      if (onPhone) {
        /* Close anything already open first. A second sheet opened over a
           closing one leaves two in the DOM, and the older one takes the tap —
           which is a real fault worth failing on, so it is asserted rather
           than worked around. */
        /* THE SCRIM, NOT THE BUTTON AT THE BOTTOM. The sheet scrolls (it holds
           the whole account surface since the Aug 2026 redesign — job title,
           sidebar, sessions, the email statement), so its Close button can sit
           below the fold and a press at its coordinates lands on nothing. The
           scrim is what a thumb taps to dismiss a sheet and it is always in the
           same place. Same real pointer press, same claim. */
        const stale = await page.$('.m-scrim');
        const staleBox = stale ? await stale.boundingBox() : null;   // null once detached
        if (staleBox) {
          await page.mouse.click(staleBox.x + staleBox.width / 2, staleBox.y + 24);
          await page.waitForTimeout(450);
        }
        await page.click('[data-m-act="account"]');
        await page.waitForTimeout(650);          // the sheet slides in
        const sheets = await page.evaluate(() => document.querySelectorAll('.m-sheet').length);
        check(`${S.name}: one sheet at a time`, sheets === 1, `${sheets} open`);
        /* A REAL POINTER PRESS AT REAL COORDINATES. Playwright's element click
           refuses when any other node covers the centre point, and inside a
           sheet that is still settling that is a fight about hit-testing
           rather than about the product. Pressing the row's own centre is what
           a thumb does: whatever is topmost there receives it and it bubbles
           to the row's handler. It still proves reachability — a control that
           is off-screen or covered has no centre to press. */
        const box = await (await page.$(`[data-m-lang="${lang}"]`)).boundingBox();
        if (!box) throw new Error(`the ${lang} row has no box — it is not on screen`);
        await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
        await page.waitForTimeout(700);
        const closer = await page.$('.m-btn[data-m-act="close-sheet"]');
        const cb = closer ? await closer.boundingBox() : null;
        if (cb) { await page.mouse.click(cb.x + cb.width / 2, cb.y + cb.height / 2); await page.waitForTimeout(350); }
        return;
      }
      if (!await pressable()) { await page.click('#nav-toggle'); await page.waitForTimeout(450); }
      const box = await (await page.$(`#lang-switch [data-lang="${lang}"]`)).boundingBox();
      if (!box) throw new Error(`the ${lang} button has no box — it is not on screen`);
      await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(600);
      await closeNav();
    };

    /* REACHABLE MEANS A THUMB LANDS ON IT — not that a selector finds it.
       Two ways this has already lied. The picker the whole rewrite was
       prompted by existed in the DOM the entire time while the search bar was
       painted on top of it. Then this very check passed at 800px on a button
       parked at x = -240: it sits in the CLOSED nav drawer, so it has a real
       box and real size and is off the side of the window, and both
       "width > 0" and Playwright's own visibility test call that visible.

       So the question asked is the only one that matters: is the centre of
       the button inside the window, and is the button what is painted there? */
    const pressable = () => page.evaluate(() => {
      const b = document.querySelector('#lang-switch [data-lang="sv"]');
      if (!b) return false;
      const r = b.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      const x = r.x + r.width / 2, y = r.y + r.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return false;   // parked off-screen
      const hit = document.elementFromPoint(x, y);
      return !!hit && b.contains(hit);                                          // or covered over
    });
    const closeNav = async () => {
      if (await page.evaluate(() => window.navDrawerActive && navDrawerActive()
          && document.getElementById('side-nav')?.classList.contains('open'))) {
        await page.evaluate(() => window.closeNavDrawer && closeNavDrawer());
        await page.waitForTimeout(350);
      }
    };

    /* WHERE it is allowed to be depends on the width, and each place has to be
       reachable on its own terms: in the header outright, or one press of the
       nav toggle away, or the phone's account sheet. */
    let where = null;
    if (onPhone) {
      where = await page.$('[data-m-act="account"]') ? 'phone: account sheet' : null;
    } else if (await pressable()) {
      where = 'desktop: header toggle';
    } else if (await page.$('#nav-toggle')) {
      await page.click('#nav-toggle');
      await page.waitForTimeout(450);
      where = await pressable() ? 'desktop: nav drawer, one press away' : null;
      await closeNav();
    }
    check(`${S.name}: there is a language control a user can actually reach`,
      !!where, where || 'nothing a person could press');
    await pick('sv');

    const sv = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || '',
      contracts: (document.querySelector('[data-i18n="nav_contracts"]') || {}).textContent || '',
      market: window.jxId(),
      currency: window.jxCurrency(),
    }));
    check(`${S.name}: the app is actually in Swedish`,
      sv.lang === 'sv' && sv.nav === 'Hem' && sv.contracts === 'Avtal',
      `lang=${sv.lang} nav=${sv.nav}/${sv.contracts}`);
    check(`${S.name}: the MARKET did not move with the language`,
      sv.market === marketBefore && sv.currency === 'KES',
      `market=${sv.market} currency=${sv.currency}`);

    // ---- every screen, in Swedish, at this size ----
    const bad = [];
    for (const v of VIEWS) {
      await page.evaluate(x => window.setView(x), v);
      await page.waitForTimeout(300);
      const m = await page.evaluate(PROBE);
      m.cut.forEach(c => bad.push(`${v}: ${c.el} cut by ${c.over}px`));
      m.spill.forEach(px => bad.push(`${v}: the page scrolls sideways by ${px}px`));
    }
    check(`${S.name}: no Swedish label is cut off, and nothing pushes the page sideways`,
      bad.length === 0, bad.slice(0, 4).join(' | '));

    // ---- a contract open, then the workbench ----
    await page.evaluate(() => window.openWorkspace(window.state.contracts[0].id));
    await page.waitForTimeout(700);
    const room = await page.evaluate(PROBE);
    const roomTabs = await page.evaluate(() =>
      [...document.querySelectorAll('#ws-tabs .room-tab')].map(b => b.textContent.trim()));
    check(`${S.name}: the contract room reads in Swedish`,
      roomTabs.some(t => /Nyckelvillkor|Dokument|Historik/.test(t)),
      roomTabs.join(' · ') || '(no tabs at this width)');
    check(`${S.name}: the contract room fits`,
      room.cut.length === 0 && room.spill.length === 0,
      [...room.cut.map(c => `${c.el} cut ${c.over}px`), ...room.spill.map(p => `page +${p}px`)].slice(0, 3).join(' | '));

    // ---- switching BACK, from a screen that is not the dashboard ----
    await pick('en');
    const back = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || '',
    }));
    check(`${S.name}: it switches back from inside a contract`,
      back.lang === 'en' && back.nav === 'Home', `lang=${back.lang} nav=${back.nav}`);

    // ---- and the choice survives a reload ----
    await pick('sv');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    const afterReload = await page.evaluate(() => ({
      lang: document.documentElement.lang,
      nav: (document.querySelector('[data-i18n="nav_home"]') || {}).textContent || '',
    }));
    check(`${S.name}: the language survives a reload`,
      afterReload.lang === 'sv' && afterReload.nav === 'Hem',
      `lang=${afterReload.lang} nav=${afterReload.nav}`);

    await ctx.close();
  }

  check('no page errors in either language', errors.length === 0, errors.slice(0, 3).join(' | '));

  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
