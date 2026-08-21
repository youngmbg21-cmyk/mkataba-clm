/* Is the 94px-instead-of-120px drag a REGRESSION, or the right column hitting
   its stated minimum on a page the nav default made 192px narrower? Measure. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
(async () => {
  const h = await startHati(); await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  await page.goto(h.base + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(600);
  await page.fill('#li-email','admin@example.co.ke'); await page.fill('#li-pass','adminpassword1'); await page.click('#li-go');
  await page.waitForTimeout(2400);
  const cid = await page.evaluate(() => { const c = state.contracts.find(x => x.status!=='Signed'&&x.status!=='Declined');
    negoInit(c); negoFileChange(c, { clauseId:(clauseSegment(negoBaseBody(c))[0]||{}).id||'c1', kind:'edit',
      authorSide:'counterparty', author:'Erik', before:'thirty (30) days', after:'sixty (60) days', why:'x' }); return c.id; });
  await page.waitForTimeout(1200);
  await page.evaluate(id => openRedlineWorkbench(id), cid);
  await page.waitForTimeout(1800);

  const out = await page.evaluate(async () => {
    const nav = document.querySelector('#side-nav');
    const grid = document.querySelector('.rl-grid');
    const rez = document.querySelector('#rl-resizer');
    const doc = document.querySelector('#rl-doc'), side = document.querySelector('#rl-side');
    const b = { navW: Math.round(nav.getBoundingClientRect().width),
      gridW: Math.round(grid.getBoundingClientRect().width),
      doc: Math.round(doc.getBoundingClientRect().width),
      side: Math.round(side.getBoundingClientRect().width),
      LEFT_MIN: window.RL_LEFT_MIN, RIGHT_MIN: window.RL_RIGHT_MIN };
    const r = rez.getBoundingClientRect(); const x0 = r.left + r.width/2, y0 = r.top + 40;
    rez.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,clientX:x0,clientY:y0}));
    window.dispatchEvent(new PointerEvent('pointermove',{bubbles:true,clientX:x0+120,clientY:y0}));
    window.dispatchEvent(new PointerEvent('pointerup',{bubbles:true,clientX:x0+120,clientY:y0}));
    await new Promise(z=>setTimeout(z,200));
    const a = { doc: Math.round(doc.getBoundingClientRect().width),
      side: Math.round(side.getBoundingClientRect().width),
      atLimit: !!document.querySelector('#rl-resizer.is-limit, #rl-resizer[data-limit]') };
    return { before: b, after: a };
  });
  console.log(JSON.stringify(out, null, 2));
  console.log('\nRIGHT column after the drag :', out.after.side, 'px');
  console.log('RL_RIGHT_MIN                :', out.before.RIGHT_MIN);
  console.log('=> the drag stopped because :', out.after.side <= (out.before.RIGHT_MIN || 300) + 4
    ? 'THE RIGHT COLUMN HIT ITS STATED MINIMUM (the limit working as designed)'
    : 'something else — investigate');
  console.log('sidebar width               :', out.before.navW, '(256 = the open column, the 20 Aug default)');
  await browser.close(); await h.stop();
})();
