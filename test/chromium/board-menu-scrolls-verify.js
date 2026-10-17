/* A SHORT ROOM SCROLLS INSIDE THE CARD (owner, 12 Oct 2026, a screenshot of a
   Board card's ⋯ menu whose last choices — Make smaller, Full screen, Remove
   from the board — hung below the menu's white card). hbMenuPlaceOne caps a
   menu's height to the room it has; the menu must then scroll inside its card.
   A short window (560px) makes the cap bite. */
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');
(async () => {
  const h = await startHati(); await seedWorkspace(h, { contracts: FIXTURES, approvalRules: [] });
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_BIN || (require('node:fs').existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined), args: ['--no-sandbox'] });
  const page = await (await b.newContext({ viewport: { width: 1280, height: 560 } })).newPage();
  await page.goto(h.base + '/'); await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1'); await page.click('#li-go');
  /* signing in lands on the Counter since 17 Oct 2026 (Round 1): the Board is opened */
  await page.waitForFunction(() => typeof hbS === 'function' && !document.body.classList.contains('pre-auth'), null, { timeout: 15000 });
  await page.evaluate(() => hbOpenHome());
  await page.waitForFunction(() => !!document.getElementById('hb-head'), null, { timeout: 15000 });
  const R0 = { which: 'all', pic: 'cols', split: { by: 'stage' }, measure: 'count' };
  await page.evaluate((R0) => { const s = hbS(); s.face='board'; s.prep='closed'; s.path=[];
    s.panels=[{ id:'p1', kind:'view', key:'q:by stage', title:'By stage', recipe:R0, split:false, big:true }]; hbSave(); hbCardSet('q:by stage', R0, { seed:true }); hbPaintBoard(); }, R0);
  await page.waitForSelector('[data-hb-pid="p1"] [data-hb-tools-more]', { timeout: 8000 });
  await page.click('[data-hb-pid="p1"] [data-hb-tools-more]');
  await page.waitForSelector('[data-hb-pid="p1"] .hb-tools-menu', { timeout: 4000 });
  const r = await page.evaluate(() => { const m = document.querySelector('[data-hb-pid="p1"] .hb-tools-menu'); const mb = m.getBoundingClientRect();
    const last = [...m.children].filter(e => e.tagName !== 'HR').pop(); const lb = last.getBoundingClientRect();
    return { up: m.classList.contains('is-up'), mh: m.style.maxHeight, ov: getComputedStyle(m).overflowY, menu: [Math.round(mb.top), Math.round(mb.bottom)], lastBottom: Math.round(lb.bottom), sh: m.scrollHeight, ch: m.clientHeight, spill: lb.bottom > mb.bottom + 1 && getComputedStyle(m).overflowY === 'visible' }; });
  const fits = r.ov !== 'visible' && r.sh > r.ch;
  console.log(`${fits ? 'PASS' : 'FAIL'}  1 a capped ⋯ menu scrolls inside its card, no choice spills past its edge — ${JSON.stringify(r)}`);
  await b.close(); if (h.stop) await h.stop();
  process.exit(fits ? 0 : 1);
})().catch(e => { console.log('FAIL  the run finished — ' + (e && e.message)); process.exit(1); });
