/* Chromium verification: THE REPORTS DOOR IS BACK
   ============================================================
   The Reports screen (cycle time, the weekly review, the reports CSV, the
   health-report button) was finished and routable but its sidebar door was
   retired — which left it reachable by nobody on a mouse. The owner asked for
   the door back (15 Aug 2026). This file pins it as VISIBLE PIXELS, because a
   node test cannot see a door that is present and display:none:

     · the door sits in the Administration fold and draws once the fold opens
     · it draws for an ORDINARY member, not only an admin (Reports reads the
       caller's own scoped book — it was never an admin page)
     · pressing it lands on the Reports page with its own buttons on screen
       (Download CSV · Weekly review · Portfolio health report)
     · the door highlights as the active nav item while the page is up
     · in Svenska the door reads "Rapporter" — the label follows the reader
     · the QUEUE door stays retired: no nav item reaches the pipeline view

   Run: node test/chromium/reports-door-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const VISIBLE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { ok: false, why: 'not in the document' };
  let n = el;
  while (n && n.nodeType === 1) {
    const cs = getComputedStyle(n);
    if (n.hasAttribute('hidden')) return { ok: false, why: (n.id || n.className || n.tagName) + ' is [hidden]' };
    if (cs.display === 'none') return { ok: false, why: (n.id || n.className || n.tagName) + ' is display:none' };
    if (cs.visibility === 'hidden') return { ok: false, why: (n.id || n.className || n.tagName) + ' is visibility:hidden' };
    n = n.parentElement;
  }
  const b = el.getBoundingClientRect();
  if (b.width < 2 || b.height < 2) return { ok: false, why: 'measures ' + Math.round(b.width) + 'x' + Math.round(b.height) };
  return { ok: true, why: Math.round(b.width) + 'x' + Math.round(b.height) };
};

const signIn = async (page, base, email, pass) => {
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h);

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];

  try {
    /* ============ AN ORDINARY MEMBER, NOT AN ADMIN ============ */
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await signIn(page, h.base, 'restricted@example.co.ke', 'their-own-pass-9');

    /* The fold starts shut, so the door must be inside it and drawn on open. */
    const inFold = await page.evaluate(() =>
      !!document.querySelector('.nav-section[data-section="settings"] .nav-item[data-view="reports"]'));
    check('the Reports door lives in the Administration fold', inFold);

    await page.click('[data-section-toggle="settings"]');
    await page.waitForTimeout(400);
    const door = await page.evaluate(VISIBLE, '.nav-item[data-view="reports"]');
    check('opening the fold puts the door on screen for an ordinary member', door.ok, door.why);

    /* PRESSED, not called. */
    await page.click('.nav-item[data-view="reports"]');
    await page.waitForTimeout(1500);

    const head = await page.evaluate(() => {
      const t = document.querySelector('#page-head h1');
      return t ? t.textContent.trim() : '(no page header)';
    });
    check('pressing it lands on the Reports page', /Reports|Rapporter/.test(head), head.slice(0, 60));

    for (const [id, label] of [['rep-export', 'Download CSV'], ['rep-weekly', 'Weekly review'],
                               ['rep-health', 'Portfolio health report']]) {
      const v = await page.evaluate(VISIBLE, '#' + id);
      check(`the page's own "${label}" button is visible pixels`, v.ok, v.why);
    }

    const active = await page.evaluate(() =>
      (document.querySelector('.nav-item[data-view="reports"]') || {}).className || '');
    check('the door highlights while the page is up', /\bactive\b/.test(active), active);

    /* ============ THE LABEL FOLLOWS THE READER ============ */
    /* The header's own toggle is PRESSED, exactly as a reader switches. */
    await page.click('[data-lang="sv"]');
    await page.waitForTimeout(1200);
    const sv = await page.evaluate(() => {
      const b = document.querySelector('.nav-item[data-view="reports"]');
      return b ? { word: b.textContent.trim(), tip: b.getAttribute('title') || '' } : null;
    });
    check('in Svenska the door reads "Rapporter"', sv && /Rapporter/.test(sv.word), sv && sv.word);
    check('and its hover sentence is Swedish too', sv && /ledtid|flaskhalsar/i.test(sv.tip), sv && sv.tip.slice(0, 60));
    await page.click('[data-lang="en"]');
    await page.waitForTimeout(600);

    /* ============ THE QUEUE DOOR STAYS RETIRED ============ */
    const queue = await page.evaluate(() =>
      !!document.querySelector('.nav-item[data-view="pipeline"]'));
    check('the Queue door stays retired — no nav item reaches the pipeline view', !queue);

    check('no page errors while any of this ran', errors.length === 0, errors.join(' | ').slice(0, 200));
    await ctx.close();
  } finally {
    await browser.close();
    await h.stop();
  }

  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} checks passed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
