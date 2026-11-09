/* Chromium verification: SETTINGS' LEFT MENU OPENS WHAT IT NAMES (owner, 9 Nov 2026).
   =====================================================================
   The owner, over a picture of Settings' left menu: "a lot of the buttons highlighted here are not functioning or
   opening the respecting links. Also when I press the page moves me down the page."
   MEASURED AT THE PARENT (4dc5b71, the new look, 1440×780): 9 of 13 items only landed on their row — the page (the one
   scroller since #603) jumped and carried the menu away; nothing opened. People & roles, Streams & categories and Trail
   opened pages still drawn as cards on grey.
   Driven in a real browser, the sample book, the new look on, every item pressed on a fresh page:
     1  an item whose row has a door presses THAT door (the drawer opens, or Jambo's agents' page), never a second door
     2  an item whose row has no door (Alerts on your phone: a switch) lands on its row and flips nothing
     3  the item pressed is marked; the menu stays on screen while the page moves
     4  People & roles, Streams & categories and Trail open their pages, one white sheet (no corner, no well)
   Run: node test/chromium/settings-menu-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'settings-menu');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

/* what a press should do, by the item's attribute: 'drawer' (the row's door opens Settings' drawer), 'view:<v>' (the door
   goes to another page), 'land' (no door: the row is shown), 'page' (a Settings page in the older frame) */
const EXPECT = { 'data-stn-to=name': 'drawer', 'data-stn-to=twostep': 'drawer', 'data-stn-to=push': 'land', 'data-stn-to=agents': 'view:jambo',
  'data-st-page=team': 'page', 'data-st-page=streams': 'page', 'data-stn-to=approvals': 'drawer', 'data-stn-to=review': 'drawer',
  'data-stn-to=signcap': 'drawer', 'data-stn-to=rates': 'drawer', 'data-stn-to=mail': 'drawer', 'data-st-panel=lessons': 'drawer', 'data-st-panel=trail': 'page' };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 180)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForSelector('#su-org', { timeout: 15000 });
    await page.fill('#su-org', 'Highland Corporate Ltd'); await page.fill('#su-name', 'Amina Otieno');
    await page.fill('#su-email', 'admin@example.co.ke'); await page.fill('#su-pass', 'adminpassword1');
    const sample = await page.$('#su-sample'); if (sample && !(await sample.isChecked())) await sample.check();
    await page.click('#su-go');
    await waitFor(page, () => !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
    const open = async () => { await page.reload({ waitUntil: 'networkidle' }); await waitFor(page, () => typeof openSettingsAt === 'function' && !!(window.state && Array.isArray(state.contracts) && state.contracts.length) && typeof currentUser === 'function' && !!currentUser(), null, 20000); await page.keyboard.press('Escape').catch(() => {});
      if (!(await page.evaluate(() => document.documentElement.classList.contains('lg-new')))) await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
      await page.evaluate(() => openSettingsAt('you')); return waitFor(page, () => document.querySelectorAll('.stn-menu .stn-mi').length >= 10, null, 10000); };
    const first = await open(); if (!first) { await page.screenshot({ path: path.join(OUT, 'no-menu.png') }); console.log('DEBUG', JSON.stringify(await page.evaluate(() => ({ view: window.state && state.view, lg: document.documentElement.classList.contains('lg-new'), stn: typeof stnOn === 'function' ? stnOn() : 'none', pref: window.state && state.prefs && state.prefs.newLook, n: document.querySelectorAll('.stn-mi').length, title: (document.querySelector('h1, .stn-title') || {}).textContent })))); }
    check('0 Settings draws its menu, the new look on', first);
    const items = await page.evaluate(() => [...document.querySelectorAll('.stn-menu .stn-mi')].map(b => { const a = [...b.attributes].find(x => /^data-st/.test(x.name)); return { label: b.textContent.trim(), attr: a ? a.name + '=' + a.value : '' }; }));
    check('0 every item is one the check knows', items.length === Object.keys(EXPECT).length && items.every(i => EXPECT[i.attr]), JSON.stringify(items.map(i => i.attr)));
    for (const it of items) {
      const want = EXPECT[it.attr]; if (!want) continue;
      if (!(await open())) { check(`${it.label}: Settings opened`, false); continue; }
      const sel = '.stn-menu [' + it.attr.replace('=', '="') + '"]';
      const pushWas = await page.evaluate(() => { const s = document.querySelector('#stn-push [role="switch"], #stn-push input[type="checkbox"]'); return s ? (s.getAttribute('aria-checked') || String(s.checked)) : null; });
      await page.click(sel);
      if (want === 'drawer') {
        const ok = await waitFor(page, () => { const sc = document.getElementById('st-scrim'); return !!sc && getComputedStyle(sc).display !== 'none' && sc.getBoundingClientRect().width > 0; });
        check(`1 ${it.label}: opens what its row opens`, ok);
      } else if (want.startsWith('view:')) {
        const v = want.slice(5);
        check(`1 ${it.label}: opens what its row opens (${v})`, await waitFor(page, x => window.state && state.view === x, v));
      } else if (want === 'page') {
        const ok = await waitFor(page, () => !document.querySelector('.stn-menu') && !!document.querySelector('#set-page.st-cr'));
        const flat = ok && await page.evaluate(() => { const cs = getComputedStyle(document.getElementById('content-scroll'));
          const cards = [...document.querySelectorAll('#set-page.st-cr :is(.st-people-card, .st-pg-card, .st-card)')];
          return cs.backgroundColor === 'rgb(255, 255, 255)' && cards.length > 0 && cards.every(c => parseFloat(getComputedStyle(c).borderTopLeftRadius) === 0 && getComputedStyle(c).boxShadow === 'none'); });
        check(`4 ${it.label}: opens its page, one white sheet`, ok && flat, JSON.stringify({ opened: ok, flat }));
      } else if (want === 'land') {
        const ok = await waitFor(page, () => { const r = document.getElementById('stn-push'); if (!r) return false; const b = r.getBoundingClientRect(); return b.top >= 48 && b.bottom <= innerHeight; });
        const pushNow = await page.evaluate(() => { const s = document.querySelector('#stn-push [role="switch"], #stn-push input[type="checkbox"]'); return s ? (s.getAttribute('aria-checked') || String(s.checked)) : null; });
        const scrim = await page.evaluate(() => { const sc = document.getElementById('st-scrim'); return !!sc && getComputedStyle(sc).display !== 'none' && sc.getBoundingClientRect().width > 0; });
        check(`2 ${it.label}: its row is shown, nothing flipped, nothing opened`, ok && pushNow === pushWas && !scrim, JSON.stringify({ shown: ok, was: pushWas, now: pushNow, scrim }));
      }
      if (it.attr.startsWith('data-stn-to') && want !== 'view:jambo') {
        await page.keyboard.press('Escape').catch(() => {});
        const m = await page.evaluate(s => { const b = document.querySelector(s); if (!b) return null; const r = b.getBoundingClientRect(); return { on: b.classList.contains('is-on'), top: Math.round(r.top), bottom: Math.round(r.bottom) }; }, sel);
        check(`3 ${it.label}: the item is marked and stays on screen`, !!m && m.on && m.top >= 48 && m.bottom <= 780, JSON.stringify(m));
      }
      if (it.attr === 'data-stn-to=push') await page.screenshot({ path: path.join(OUT, 'alerts-landed-1440x780.png') });
      if (it.attr === 'data-st-page=team') await page.screenshot({ path: path.join(OUT, 'people-1440x780.png') });
    }
    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed — shots in ${OUT}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
