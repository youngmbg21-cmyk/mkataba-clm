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
    await page.click('.st-tab[data-st-tab="platform"]');
    await page.waitForTimeout(500);
    await shot(page, 'settings-platform');

    /* ============ 1. THE GROUPS ARE PAINTED AND NAMED ============ */
    const groups = await page.evaluate(() =>
      [...document.querySelectorAll('#st-list .st-grp')].map(s => ({
        name: (s.querySelector('.st-grp-h')?.childNodes[0]?.textContent || '').trim(),
        sub: (s.querySelector('.st-grp-sub')?.textContent || '').trim(),
        rows: s.querySelectorAll('.st-row').length,
        h: Math.round(s.querySelector('.st-grp-h').getBoundingClientRect().height)
      })));
    check('1a. the platform tab draws five named groups, not one list',
      groups.length === 5, groups.map(g => `${g.name}(${g.rows})`).join(' · '));
    /* The length test is not decoration: `[].every()` is true, so without it
       this passed against a page that draws no groups at all. */
    check('1b. every heading is painted ink, not an empty box',
      groups.length === 5 && groups.every(g => g.name.length && g.h > 0),
      groups.map(g => g.h + 'px').join(' ') || 'no groups');
    check('1c. no group is a wall — the largest holds four rows',
      groups.length && Math.max(...groups.map(g => g.rows)) <= 4,
      'largest ' + Math.max(...groups.map(g => g.rows)));
    check('1d. the seventeen are all still there, once each',
      groups.reduce((n, g) => n + g.rows, 0) === 17,
      groups.reduce((n, g) => n + g.rows, 0) + ' rows');
    check('1e. exactly the two groups whose name needs one carry a caption',
      groups.filter(g => g.sub.length).length === 2,
      groups.filter(g => g.sub.length).map(g => g.name).join(' · ') || 'none');

    /* ============ 2. THE TAG IS GONE, THE DOT IS THE STATE ============ */
    /* ASKED OF EVERY ROW ON THE PAGE, not of the rows inside a group. Scoped to
       .st-grp these two passed against the parent — where there are no groups,
       so the selector found nothing and "no row says Optional" was true of an
       empty set. A check that passes because it matched nothing is a
       description. The row count is asserted FIRST for the same reason. */
    const tags = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.st-row[data-st-panel]')];
      const txt = rows.map(r => (r.querySelector('.st-row-tag') || {}).textContent || '')
        .map(s => s.trim()).filter(Boolean);
      const dots = rows.map(r => r.querySelector('.st-dot'))
        .filter(Boolean).map(d => getComputedStyle(d).backgroundColor);
      return { rows: rows.length, txt, painted: dots.filter(c => c && c !== 'rgba(0, 0, 0, 0)').length };
    });
    check('2a. "Optional" is printed on no row at all',
      tags.rows >= 17 && !tags.txt.some(t => /optional|valfri/i.test(t)),
      `${tags.rows} rows · tags: ${tags.txt.join(' · ') || 'none'}`);
    check('2b. any tag left is the narrowed "Required"',
      tags.rows >= 17 && tags.txt.every(t => /required|krävs/i.test(t)),
      tags.txt.join(' · ') || 'none');
    check('2c. every row carries a painted status dot instead',
      tags.rows >= 17 && tags.painted === tags.rows,
      `${tags.painted} of ${tags.rows} dots painted`);
    const legend = await page.evaluate(PAINTED, '.st-legend');
    check('2d. and the three dots are explained once, under the list', legend.ok, legend.why);

    /* ============ 3. THE ATTENTION BLOCK CROSSES TABS ============ */
    const att = await page.evaluate(() => {
      const el = document.getElementById('st-att');
      if (!el) return { drawn: false };
      return {
        drawn: true,
        h: Math.round(el.getBoundingClientRect().height),
        top: Math.round(el.getBoundingClientRect().top),
        rows: [...el.querySelectorAll('.st-row')].map(r => r.getAttribute('data-st-panel')),
        wheres: [...el.querySelectorAll('.st-row-where')].map(w => w.textContent.trim()),
        firstGroupTop: Math.round(document.querySelector('#st-list .st-grp').getBoundingClientRect().top)
      };
    });
    check('3a. the block is drawn and painted', att.drawn && att.h > 0, (att.h || 0) + 'px');
    check('3b. it leads the list, above the first group',
      att.drawn && att.top < att.firstGroupTop, `block ${att.top} · first group ${att.firstGroupTop}`);
    check('3c. every row in it names which tab it lives on',
      att.drawn && att.wheres.length === att.rows.length, (att.wheres || []).join(' · ') || 'no block');
    const crossed = await page.evaluate(rows =>
      rows.some(k => window.SET_PANELS[k] && window.SET_PANELS[k].tab !== 'platform'), att.rows || []);
    check('3d. AND IT REACHES THE OTHER TAB — the whole point of the block',
      crossed, (att.rows || []).join(' · '));

    /* ============ 4. ONE BOX OVER ALL OF THEM ============ */
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
      hits: [...document.querySelectorAll('#st-list .st-row')].map(r => r.getAttribute('data-st-panel')),
      says: (document.querySelector('.st-found') || {}).textContent || '',
      groups: document.querySelectorAll('#st-list .st-grp').length,
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
    check('4h. clearing it brings the groups back',
      (await page.evaluate(() => document.querySelectorAll('#st-list .st-grp').length)) === 5);
    }

    /* ============ 5. THE DRAWER SAYS WHERE YOU ARE ============ */
    await page.click('.st-row[data-st-panel="approvals"]');
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
      check('5h. and the position counts up with it', /2\s*(of|av)/i.test(landed.n), landed.n);
    }

    /* ============ 6. THE BUILD TAB GOT THE SAME TREATMENT ============ */
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    await page.click('.st-tab[data-st-tab="build"]');
    await page.waitForTimeout(500);
    const build = await page.evaluate(() => ({
      groups: [...document.querySelectorAll('#st-list .st-grp')].map(s =>
        ({ n: (s.querySelector('.st-grp-h')?.childNodes[0]?.textContent || '').trim(), r: s.querySelectorAll('.st-row').length })),
      q: (document.getElementById('st-q') || {}).value
    }));
    check('6a. Build & launch is grouped too, not left as the old flat list',
      build.groups.length >= 2, build.groups.map(g => `${g.n}(${g.r})`).join(' · '));
    check('6b. and all seven of its panels are still drawn',
      build.groups.reduce((n, g) => n + g.r, 0) === 7, build.groups.reduce((n, g) => n + g.r, 0) + ' rows');
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
