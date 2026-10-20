/* CHARTS-USE-THEIR-ROOM — Make bigger always makes it bigger, and a chart
   stands in the middle of its room (owner, 20 Oct 2026, four screenshots:
   "for many many times I have asked that the highlighted feature be fixed …
   When you press to expand or make smaller the frequently do not work
   accordingly. Also … some graphs do not go in the middle or do not use the
   space wisely and waste the space. In … a full screen, at least bring the
   chart in the middle of the page as opposed to leaving blank space.")

     1  a chart with long slanted names starts beside its axis — no blank
        strip on the left (the room was the LONGEST name's, wherever it stood)
     2  on the board, Make bigger makes a card TALLER, even one already the
        row's width (alone on its row); Make smaller puts it back
     3  opened, Make bigger makes the chart taller; Make smaller puts it back
     4  full screen offers no Make bigger (it is the biggest there is);
        Back to opened is there and works
     5  full screen: the funnel and a list of bars stand in the middle of the
        window, the spare height shared above and below
     6  the owner's three screens: full screen fits, photographed; no errors

   Run: node test/chromium/charts-use-their-room-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
/* a book like the owner's: one big group, long counterparty names */
const NAMES = ['Juno Limited', 'Young Mbagaya', 'AIT Worldwide Logistics Norway AS', 'Saw Sawa LLC', 'Young Mbgaya', 'Juno LLC',
  'APEX LOGISTICS & WAREHOUSING KENYA LIMITED', 'Bull', 'Gulic LLC'];
const STAGES = ['Drafting', 'In Review', 'Executed', 'Signed'];
const BOOK = FIXTURES.slice(); let n = 0;
[30, 14, 8, 6, 5, 4, 3, 3, 3, 3].forEach((k, i) => { for (let j = 0; j < k; j++)
  BOOK.push(fixtureContract('MK-W' + (n++), 'Deal ' + n, i === 0 ? '' : NAMES[i - 1], 'proc', 1e6, STAGES[j % 4])); });
const STACK = { which: 'all', pic: 'stack', split: { by: 'counterparty' }, split2: { by: 'status' }, measure: 'count' };
const FUNNEL = { which: 'all', pic: 'funnel', measure: 'count' };
const BARS = { which: 'all', pic: 'bars', split: { by: 'counterparty' }, measure: 'count' };

let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    /* a chart's svg, once drawn at the width it is shown at */
    const svgAt = sel => until(s => { const svg = document.querySelector(s); if (!svg) return null;
      const r = svg.getBoundingClientRect(), vb = Number((svg.getAttribute('viewBox') || '').split(/\s+/)[2]);
      return Math.abs(vb - r.width) <= 8 ? { w: Math.round(r.width), h: Math.round(r.height), left: r.left } : null; }, sel, 10000);
    /* the board as set: these cards and nothing opened */
    const board = (panels, pathKey) => page.evaluate(({ panels, pathKey }) => {
      const s = hbS(); s.face = 'board'; s.prep = 'closed'; s.digBig = false; s.path = pathKey ? [pathKey] : [];
      panels.forEach(p => hbCardSet(p.key, JSON.parse(JSON.stringify(p.recipe)), { seed: true }));
      s.panels = panels.map(p => ({ id: p.id, kind: 'view', key: p.key, title: p.title, recipe: JSON.parse(JSON.stringify(p.recipe)), split: false, big: false }));
      hbSave(); if (state.view !== 'dashboard') setView('dashboard'); hbPaintBoard(); }, { panels, pathKey });
    const menu = async (scope, item) => {
      await page.locator(scope + ' [data-hb-tools-more]').first().click();
      const there = await until(s => !!document.querySelector(s), scope + ' ' + item, 3000);
      if (!there) return false;
      await page.locator(scope + ' ' + item).first().click(); return true; };

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(k => window.state && state.contracts && state.contracts.length >= k, BOOK.length, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    console.log('\n1 · long slanted names leave no blank strip');
    await board([{ id: 'pst', key: 'q:contracts by counterparty then stage', title: 'By counterparty', recipe: STACK }]);
    const stSel = '[data-hb-pid="pst"] svg.hb-svg';
    const st = await svgAt(stSel);
    const axisAt = await page.evaluate(s => { const svg = document.querySelector(s); const ln = svg && svg.querySelector('line.hb-sv-axis');
      return ln ? Math.round(Number(ln.getAttribute('x1'))) : null; }, stSel);
    const slanted = await page.evaluate(s => document.querySelectorAll(s + ' text.hb-sv-angled').length, stSel);
    check('1a the names are slanted (the case being measured)', slanted > 3, slanted);
    check('1b the chart starts beside its axis words (≤ 80px in)', axisAt != null && axisAt <= 80, axisAt);
    const firstName = await page.evaluate(s => { const svg = document.querySelector(s), t = svg && svg.querySelector('text.hb-sv-angled');
      if (!t) return null; const r = t.getBoundingClientRect(), b = svg.getBoundingClientRect(); return Math.round(r.left - b.left); }, stSel);
    check('1c and the first name is still whole inside the chart', firstName != null && firstName >= 0, firstName);
    await shot(page, '1-long-names');

    console.log('\n2 · on the board, Make bigger makes it taller');
    const h0 = st && st.h;
    check('2a the card stands alone on its row (already its full width)', await page.evaluate(() => {
      const c = document.querySelector('[data-hb-pid="pst"]'); return !!c && c.classList.contains('is-lone'); }));
    await menu('[data-hb-pid="pst"]', '[data-hb-act="big"]');
    const h1 = await until(({ s, h0 }) => { const svg = document.querySelector(s); const c = svg && svg.closest('.hb-card');
      return svg && c && c.classList.contains('is-big') && svg.getBoundingClientRect().height > h0 + 40 ? Math.round(svg.getBoundingClientRect().height) : null; }, { s: stSel, h0 }, 8000);
    check('2b Make bigger: the chart is clearly taller', !!h1, `${h0} → ${h1}`);
    const word = await page.evaluate(() => { const b = document.querySelector('[data-hb-pid="pst"] [data-hb-tools-more]'); b.click(); return null; })
      .then(() => until(() => { const it = document.querySelector('[data-hb-pid="pst"] [data-hb-act="big"]'); return it ? it.textContent.trim() : null; }, null, 3000));
    check('2c the menu now says Make smaller', /Make smaller/.test(word || ''), word);
    if (word) await page.locator('[data-hb-pid="pst"] [data-hb-act="big"]').first().click();
    const h2 = await until(({ s, h0 }) => { const svg = document.querySelector(s); return svg && Math.abs(svg.getBoundingClientRect().height - h0) <= 2 ? Math.round(svg.getBoundingClientRect().height) : null; }, { s: stSel, h0 }, 8000);
    check('2d Make smaller: back to its size', !!h2, `${h0} → ${h2}`);

    console.log('\n3 · opened, Make bigger makes it taller');
    const FN_KEY = 'q:contracts as a funnel', BARS_KEY = 'q:contracts by counterparty';
    await board([{ id: 'pbr', key: BARS_KEY, title: 'By counterparty', recipe: BARS }, { id: 'pst', key: 'q:contracts by counterparty then stage', title: 'By counterparty', recipe: STACK }], 'q:contracts by counterparty then stage');
    const fSel = '#hb-focus svg.hb-svg';
    const o0 = await svgAt(fSel);
    check('3a the chart opens', !!o0, o0 && o0.h);
    const grew = await menu('#hb-focus', '[data-hb-digbig]');
    const o1 = await until(({ s, h }) => { const svg = document.querySelector(s); const r = svg && svg.getBoundingClientRect();
      return r && r.height > h + 40 && Math.abs(Number((svg.getAttribute('viewBox') || '').split(/\s+/)[2]) - r.width) <= 8 ? Math.round(r.height) : null; }, { s: fSel, h: o0 ? o0.h : 1e9 }, 8000);
    check('3b Make bigger: the opened chart is clearly taller', grew && !!o1, `${o0 && o0.h} → ${o1}`);
    await menu('#hb-focus', '[data-hb-digbig]');
    const o2 = await until(({ s, h }) => { const svg = document.querySelector(s); return svg && Math.abs(svg.getBoundingClientRect().height - h) <= 2; }, { s: fSel, h: o0 ? o0.h : -1 }, 8000);
    check('3c Make smaller: back to its size', !!o2);

    console.log('\n4 · full screen is the biggest there is');
    await menu('#hb-focus', '[data-hb-full]');
    await until(() => !!document.querySelector('#hb-focus .hb-dig.is-full svg[data-hb-step="full"]'));
    await page.locator('#hb-focus [data-hb-tools-more]').first().click();
    const items = await until(() => { const m = document.querySelector('#hb-focus .hb-tools-menu'); return m ? [...m.querySelectorAll('button')].map(b => b.textContent.trim()) : null; }, null, 3000);
    check('4a the full-screen menu offers no Make bigger', !!items && !items.some(t => /Make bigger|Make smaller/.test(t)), items && items.slice(0, 3).join(' | '));
    check('4b … and offers Back to opened', !!items && items.some(t => /Back to opened/.test(t)));
    check('4c no Make bigger button in its head either', !(await page.locator('#hb-focus .hb-dig.is-full .hb-ch [data-hb-digbig]').count()));
    if (await page.locator('#hb-focus [data-hb-full]').count()) await page.locator('#hb-focus [data-hb-full]').first().click();
    check('4d Back to opened works', !!(await until(() => !document.querySelector('.hb-dig.is-full') && !!document.querySelector('#hb-focus svg[data-hb-step="open"]'))));

    console.log('\n5 · full screen stands in the middle');
    await board([], FN_KEY); await page.evaluate(k => { hbCardSet(k, { which: 'all', pic: 'funnel', measure: 'count' }, { seed: true }); hbPaintBoard(); }, FN_KEY);
    await svgAt(fSel);
    await menu('#hb-focus', '[data-hb-full]');
    await until(() => !!document.querySelector('#hb-focus .hb-dig.is-full svg[data-hb-step="full"]'));
    await svgAt(fSel);
    const fn = await page.evaluate(() => { const svg = document.querySelector('#hb-focus .hb-dig.is-full svg.hb-fn'); if (!svg) return null;
      const b = svg.getBoundingClientRect(); let y0 = 1e9, y1 = -1e9;
      svg.querySelectorAll('rect:not([fill="transparent"]),text').forEach(e => { const q = e.getBoundingClientRect(); if (!q.height) return; y0 = Math.min(y0, q.top); y1 = Math.max(y1, q.bottom); });
      return { top: Math.round(y0 - b.top), bottom: Math.round(b.bottom - y1), h: Math.round(b.height) }; });
    check('5a the funnel stands in the middle of its full-screen room', !!fn && Math.abs(fn.top - fn.bottom) <= 40 && fn.top > 40, JSON.stringify(fn));
    await shot(page, '5-funnel-full');
    await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
    await board([], BARS_KEY); await page.evaluate(k => { hbCardSet(k, { which: 'all', pic: 'bars', split: { by: 'counterparty' }, measure: 'count' }, { seed: true }); hbPaintBoard(); }, BARS_KEY);
    await until(() => !!document.querySelector('#hb-focus [data-hb-tools-more]'));
    await menu('#hb-focus', '[data-hb-full]');
    await until(() => !!document.querySelector('#hb-focus .hb-dig.is-full'));
    const bars = await until(() => { const card = document.querySelector('.hb-dig.is-full'); if (!card) return null;
      const cb = card.querySelector('.hb-cb'), kids = [...cb.children].filter(e => e.getBoundingClientRect().height > 0);
      if (!kids.length) return null; const cr = cb.getBoundingClientRect();
      return { above: Math.round(kids[0].getBoundingClientRect().top - cr.top), below: Math.round(cr.bottom - kids[kids.length - 1].getBoundingClientRect().bottom), room: Math.round(cr.height) }; });
    check('5b a list of bars shares the spare height above and below', !!bars && bars.above > 30 && Math.abs(bars.above - bars.below) <= 40, JSON.stringify(bars));
    await shot(page, '5-bars-full');

    console.log('\n6 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      const fit = await until(() => { const c = document.querySelector('.hb-dig.is-full'); if (!c) return null; const r = c.getBoundingClientRect();
        return r.right <= innerWidth + 1 && r.bottom <= innerHeight + 1 ? { w: Math.round(r.width), h: Math.round(r.height) } : null; });
      check(`6 ${vp.width}×${vp.height}: full screen fits the window`, !!fit, JSON.stringify(fit));
      await shot(page, `6-bars-full-${vp.width}x${vp.height}`);
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
