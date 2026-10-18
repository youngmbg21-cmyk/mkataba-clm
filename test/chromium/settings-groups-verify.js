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
    await page.click('.st-face[data-st-tab="company"]');
    await page.waitForTimeout(500);
    await shot(page, 'settings-company');

    /* ============ 1. THE CARDS ARE PAINTED AND NAMED ============
       RE-POINTED 16 Oct 2026 (the Control Room built in full, the owner's
       "build"): a group is a SHORT card — two facts that are doors, and the
       rest of the area's settings as doors under them. Every claim below is
       the old claim asked of the cards: every panel drawn, once, under a
       painted name, and no card a wall. */
    const cards = await page.evaluate(() =>
      [...document.querySelectorAll('.st-cards > .st-card[data-st-card]')].filter(s => !['people', 'ladder'].includes(s.getAttribute('data-st-card'))).map(s => ({
        key: s.getAttribute('data-st-card'),
        name: (s.querySelector('.st-card-h')?.childNodes[0]?.textContent || '').trim(),
        facts: s.querySelectorAll('.st-fact').length,
        panels: [...s.querySelectorAll('[data-st-panel]')].map(b => b.getAttribute('data-st-panel')).filter(k => window.SET_PANELS[k]),
        h: s.querySelector('.st-card-h') ? Math.round(s.querySelector('.st-card-h').getBoundingClientRect().height) : 0
      })));
    const declared = await page.evaluate(() => {
      const P = window.SET_PANELS, G = (window.ST_GROUPS || []).filter(g => g.tab === 'platform' || g.tab === 'build');
      return G.map(g => Object.keys(P).filter(k => P[k].group === g.key && P[k].tab === g.tab && (!P[k].show || P[k].show())));
    });
    check('1a. the Company board draws every group it declares, each on one card',
      declared.length > 1 && declared.filter(ks => ks.length).every(ks => cards.some(c => ks.every(k => c.panels.includes(k)))),
      cards.map(c => `${c.name}(${c.panels.length})`).join(' · '));
    check('1b. every card\'s name is painted ink, not an empty box',
      cards.length > 3 && cards.every(c => c.name.length && c.h > 0), cards.map(c => c.h + 'px').join(' ') || 'no cards');
    check('1c. no card is a wall — two facts at most, the rest are doors',
      cards.length && cards.every(c => c.facts >= 1 && c.facts <= 2), cards.map(c => c.facts).join(' '));
    const all = await page.evaluate(() => {
      const P = window.SET_PANELS;
      return { want: Object.keys(P).filter(k => (P[k].tab === 'platform' || P[k].tab === 'build') && (!P[k].show || P[k].show())) };
    });
    const keys = cards.flatMap(c => c.panels);
    check('1d. every company panel is still there, once each',
      all.want.length > 0 && keys.length === all.want.length && new Set(keys).size === keys.length && all.want.every(k => keys.includes(k)),
      `${keys.length} doors for ${all.want.length} panels`);
    const spans = await page.evaluate(() => {
      const w = k => { const el = document.querySelector(`.st-cards > [data-st-card="${k}"], .st-board > [data-st-card="${k}"]`); return el ? el.getBoundingClientRect().width : 0; };
      return { people: w('people'), ladder: w('ladder'), one: w('signing') };
    });
    /* since round 25 ("Control room"): nine even cards, the ladder across the page under them */
    check('1e. People & access is one card like the rest; the ladder runs across the page',
      spans.one > 0 && Math.abs(spans.people - spans.one) < 2 && spans.ladder > spans.one * 2.5, JSON.stringify(spans));

    /* ============ 2. NO TAG; THE DOT IS THE STATE ============
       2b ("Required") and 2d (the dot legend) were retired with the rows they
       sat on: a card's fact carries the panel's dot beside its name. */
    const tags = await page.evaluate(() => {
      /* the area cards' facts (People & access states its counts in words, no dots) */
      const facts = [...document.querySelectorAll('.st-cards > .st-card:not([data-st-card="people"]) .st-fact[data-st-panel]')].filter(f => window.SET_PANELS[f.getAttribute('data-st-panel')]);
      const dots = facts.map(f => f.querySelector('.st-dot')).filter(Boolean).map(d => getComputedStyle(d).backgroundColor);
      return { facts: facts.length, painted: dots.filter(c => c && c !== 'rgba(0, 0, 0, 0)').length,
        optional: /\b(optional|valfri)\b/i.test(document.querySelector('.st-cards').textContent) };
    });
    check('2a. "Optional" is printed nowhere on the board', tags.facts >= 10 && !tags.optional, `${tags.facts} facts`);
    check('2c. every fact carries a painted status dot', tags.facts >= 10 && tags.painted === tags.facts, `${tags.painted} of ${tags.facts} dots painted`);

    /* ============ 3. NEEDS YOU LEADS, AND CROSSES AREAS ============ */
    const att = await page.evaluate(() => {
      const el = document.getElementById('st-att');
      if (!el) return { drawn: false };
      const rows = [...el.querySelectorAll('.st-need[data-st-need]')];
      return {
        drawn: true,
        h: Math.round(el.getBoundingClientRect().height),
        top: Math.round(el.getBoundingClientRect().top),
        rows: rows.map(r => r.getAttribute('data-st-need')),
        buttons: rows.filter(r => { const b = r.querySelector('.st-need-go'); return b && b.getBoundingClientRect().width > 0; }).length,
        firstCardTop: Math.round(document.querySelector('.st-cards > .st-card').getBoundingClientRect().top)
      };
    });
    check('3a. Needs you is drawn and painted', att.drawn && att.h > 0, (att.h || 0) + 'px');
    check('3b. it leads the board, above the first card',
      att.drawn && att.top < att.firstCardTop, `needs ${att.top} · first card ${att.firstCardTop}`);
    check('3c. every row carries the painted button that settles it',
      att.drawn && att.rows.length > 0 && att.buttons === att.rows.length, `${att.buttons} of ${(att.rows || []).length}`);
    const crossed = await page.evaluate(rows =>
      rows.some(k => /^panel:/.test(k) && window.SET_PANELS[k.slice(6)] && window.SET_PANELS[k.slice(6)].tab !== 'platform'), att.rows || []);
    check('3d. AND IT REACHES ACROSS AREAS — the plumbing as well as the agreement',
      crossed, (att.rows || []).join(' · '));

    /* ============ 4. ONE BOX OVER ALL OF THEM — the Menu's ============ */
    await page.click('[data-st-side="menu"]');
    await page.waitForTimeout(300);
    const box = await page.evaluate(PAINTED, '#st-q');
    check('4a. the search box is painted', box.ok, box.why);
    /* GUARDED so a build without the box REPORTS the rest as failures rather
       than throwing on the first click and hiding everything under it. */
    if (!box.ok) {
      for (const n of ['4b. typing narrows the list to real hits',
        '4c. and the groups stand down while a search is running',
        '4d. a hit from ANOTHER tab is found — nobody knows which tab a setting is on',
        '4e. the caret never leaves the box',
        '4f. AND THE PAGE HOLDS STILL while it narrows',
        '4g. a query that matches nothing says so',
        '4h. clearing it brings the groups back']) check(n, false, 'no search box on this build');
    } else {
    const before = await page.evaluate(() => ({
      y: document.getElementById('st-q').getBoundingClientRect().top,
      scroll: (document.getElementById('content-scroll') || document.scrollingElement).scrollTop
    }));
    await page.click('#st-q');
    await page.type('#st-q', 'email', { delay: 40 });
    await page.waitForTimeout(350);
    await shot(page, 'settings-search');
    const found = await page.evaluate(() => ({
      hits: [...document.querySelectorAll('#st-list .st-mrow')].map(r => r.getAttribute('data-st-panel') || r.getAttribute('data-st-you')),
      says: (document.querySelector('.st-found') || {}).textContent || '',
      groups: document.querySelectorAll('#st-list .st-mgrp').length,
      focused: document.activeElement && document.activeElement.id,
      y: document.getElementById('st-q').getBoundingClientRect().top
    }));
    check('4b. typing narrows the list to real hits', found.hits.length > 0 && found.hits.length < 17,
      found.hits.join(' · '));
    check('4c. and the groups stand down while a search is running', found.groups === 0, found.groups + ' groups');
    check('4d. a hit from ANOTHER tab is found — nobody knows which tab a setting is on',
      await page.evaluate(hits => hits.some(k => window.SET_PANELS[k] && window.SET_PANELS[k].tab === 'build'), found.hits),
      found.says.trim());
    check('4e. the caret never leaves the box', found.focused === 'st-q', 'focus ' + found.focused);
    check('4f. AND THE PAGE HOLDS STILL while it narrows',
      Math.abs(found.y - before.y) < 1, `box moved ${Math.round(Math.abs(found.y - before.y))}px`);
    /* A query nobody can match is a sentence, never an empty box. */
    await page.fill('#st-q', 'zzzznothing');
    await page.waitForTimeout(300);
    const none = await page.evaluate(PAINTED, '.st-none');
    check('4g. a query that matches nothing says so', none.ok, none.why);
    await page.fill('#st-q', '');
    await page.waitForTimeout(300);
    /* You, People, then every company group */
    check('4h. clearing it brings the groups back',
      (await page.evaluate(() => document.querySelectorAll('#st-list .st-mgrp').length))
        === (await page.evaluate(() => 2 + (window.ST_GROUPS || []).filter(g => g.tab === 'platform' || g.tab === 'build').length)));
    }

    /* ============ 5. THE DRAWER SAYS WHERE YOU ARE ============ */
    await page.click('.st-cards [data-st-panel="approvals"]');
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

    /* ============ 6. THE BUILD TAB GOT THE SAME TREATMENT ============ */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    /* the search left standing, then a tab press: the box comes back empty */
    await page.fill('#st-q', 'email'); await page.waitForTimeout(200);
    await page.click('.st-face[data-st-tab="you"]'); await page.waitForTimeout(400);
    await page.click('.st-face[data-st-tab="company"]');
    await page.waitForTimeout(500);
    const build = await page.evaluate(() => ({
      panels: [...document.querySelectorAll('.st-cards > [data-st-card="live"] [data-st-panel]')].map(b => b.getAttribute('data-st-panel'))
        .filter(k => window.SET_PANELS[k] && window.SET_PANELS[k].tab === 'build'),
      q: (document.getElementById('st-q') || {}).value
    }));
    /* RE-POINTED 16 Oct 2026: Going live and the plumbing are one card, as drawn */
    check('6a. Build & launch is on the board too, on its own card', build.panels.length > 0, build.panels.join(' · '));
    check('6b. and all seven of its panels are still drawn', new Set(build.panels).size === 7, build.panels.length + ' doors');
    /* `=== ''` rather than falsy: on a build with no box at all the value reads
       undefined, and "not truthy" would call that a pass. */
    check('6c. changing tab clears the search, so the tab press cannot look broken',
      build.q === '', JSON.stringify(build.q));

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
