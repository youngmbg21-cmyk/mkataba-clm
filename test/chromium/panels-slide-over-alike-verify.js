/* Chromium verification: EVERY PANEL STARTS TO SLIDE OVER WHERE PEOPLE'S DOES (owner, 28 Oct 2026)
   ============================================================
   The owner: "where side panels begin to overlap the page when you drag the side panel from right to left. They
   need to all be the same as the contacts page", then "make Customers and Settings match contacts". MEASURED at the
   parent (a5deb6a): People, the lists and Home began to slide over with the panel's edge at about 880px from the
   page's left; Customers at 965 (its fixed columns held the page wider) and Settings at about 911 (its board starts
   inside the page's padding, and the grid's gap stands before the panel). On each page, at the owner's three
   screens, the panel's grip is dragged left in 4px steps until it says it lies over the page (data-over):
     1  the seam (where the page holds) then stands within 6px of People's
   AT THE PARENT 1 fails for Customers and Settings at all three screens.
   Run: node test/chromium/panels-slide-over-alike-verify.js   (HATI_OVER_ONLY=customers,settings to run some) */
/* global state, setView, hbSetFace, closeModal, closeAI */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { navContracts } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}
/* People first: it is the measure the others are held to */
const PAGES = [
  ['people', "setView('directory')"], ['customers', "setView('customers')"], ['approvals', "setView('approvals')"],
  ['obligations', "setView('obligations')"], ['requests', "setView('intake')"], ['import', "setView('migration')"],
  ['mynotes', "setView('mynotes')"], ['standards', "setView('playbook')"], ['templates', "setView('templates')"],
  ['board', "setView('dashboard'); hbSetFace('board')"], ['contracts', "setView('register')"], ['calendar', "setView('calendar')"],
  ['settings', "setView('team')"],
];
const GRIPS = ['#jl-resizer', '#ig-resizer', '#st-resizer'];
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

async function onset(P, sel){
  await P.dblclick(sel).catch(() => {}); await P.waitForTimeout(250);
  const g = await P.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, sel);
  await P.mouse.move(g.x, g.y); await P.mouse.down();
  let hit = null;
  for (let x = g.x - 4; x > 40; x -= 4){
    await P.mouse.move(x, g.y);
    /* the seam is the grip's left edge; past the mark it stands `over` px inside where the page holds */
    const o = await P.evaluate(s => { const e = document.querySelector(s);
      return { over: Number(e.getAttribute('data-over') || 0), seam: Math.round(e.getBoundingClientRect().left) }; }, sel);
    if (o.over > 0){ hit = o.seam + o.over; break; }
  }
  await P.mouse.up(); await P.dblclick(sel).catch(() => {}); await P.waitForTimeout(150);
  return hit;
}

(async () => {
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: navContracts(), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const ONLY = process.env.HATI_OVER_ONLY ? process.env.HATI_OVER_ONLY.split(',') : null;
  try {
    for (const [W, H] of SCREENS){
      const P = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
      P.on('pageerror', e => errors.push(String(e && e.message || e)));
      await P.goto(h.base + '/', { waitUntil: 'networkidle' });
      await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
      await until(P, () => !!(window.state && state.contracts && state.contracts.length > 5), null, 20000);
      await P.waitForTimeout(1000);
      console.log(`\n· ${W}×${H}`);
      let people = null;
      for (const [key, go] of PAGES){
        if (ONLY && key !== 'people' && !ONLY.includes(key)) continue;
        await P.evaluate(() => { try { closeModal(); } catch (_){} try { if (window.ai && ai.open) closeAI(); } catch (_){} });
        await P.evaluate(g => { eval(g); }, go);
        const sel = await until(P, gs => gs.find(s => { const e = document.querySelector(s); return e && !e.hidden && e.getBoundingClientRect().width > 0; }) || null, GRIPS, 8000);
        if (!sel){ check(`${W}×${H} ${key}: its panel has a grip to drag`, false); continue; }
        await P.waitForTimeout(400);
        const at = await onset(P, sel);
        if (key === 'people'){ people = at; check(`${W}×${H} people: the panel starts to slide over (the measure)`, at != null, `at ${at}px`); continue; }
        check(`1 ${W}×${H} ${key}: starts to slide over where People's does`, at != null && people != null && Math.abs(at - people) <= 6, `at ${at}px, People ${people}px`);
      }
      await P.context().close();
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
