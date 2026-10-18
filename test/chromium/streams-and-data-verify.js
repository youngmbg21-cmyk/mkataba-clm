/* CONTRACT STREAMS AND DATA & BACKUP, "THE SAP WAY" (round 26 of the
   redesign: the owner picked "The SAP way" by name, 17 Oct 2026;
   js/views/settings.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 Your standards' door opens Contract streams: labelled filters, a table
       of every stream (who may open, contracts, kept, due now, on hold)
     2 a filter narrows the table and the count says so; find by name
     3 a row opens that stream's own page (the drawer it always had)
     4 + New stream opens the Contract folders drawer at its add box
     5 Housekeeping's Data & backup lands on the page; The trail's asks are
       labelled boxes in one row with its count; the Backup tab holds the
       backup; ‹ Settings goes back
     6 a refresh keeps the page
     7 it fits the owner's three screens
   At the parent (round 25's head) every check fails but the console.
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/streams-and-data-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const toCompany = () => until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      if (document.querySelector('[data-st-pg]')) { settingsGoPage(''); return null; }
      return document.querySelector('#st-board .st-cards') ? true : null; }, null, 15000);
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    await toCompany();

    console.log('\n1 · Contract streams');
    if (await press('[data-st-card="standards"] [data-st-page="streams"]', '1 the door')) {
      const pg = await until(() => { const p = document.querySelector('[data-st-pg="streams"]'); if (!p) return null;
        return { filters: [...p.querySelectorAll('.st-sw-band .st-sw-f > span')].map(x => x.textContent.trim()),
          cols: [...p.querySelectorAll('.st-sw-tb thead th')].map(x => x.textContent.trim()),
          rows: p.querySelectorAll('.st-sw-row').length, streams: Object.keys(FOLDERS).length }; });
      check('1a labelled filters: Who may open · Keeping · Find', !!pg && pg.filters.join('|') === 'Who may open|Keeping|Find', JSON.stringify(pg && pg.filters));
      check('1b a table of every stream, six columns', !!pg && pg.cols.length === 6 && pg.rows === pg.streams && pg.rows > 0, JSON.stringify(pg));
      await shot(page, 'streams-1440x780');
    }

    console.log('\n2 · the filters');
    await page.fill('#st-sw-q', 'sales').catch(() => null);
    const found = await until(() => { const rows = [...document.querySelectorAll('.st-sw-row')]; return rows.length >= 1 && rows.every(r => /sales/i.test(r.textContent)) ? rows.length : null; }, null, 3000);
    const said = await page.evaluate(() => (document.getElementById('st-sw-n') || {}).textContent || '');
    /* the count is the head's small tag since round 26 as drawn (18 Oct 2026) */
    check('2a find narrows the table to matching names, and the count says so', !!found && said.trim() === String(found), found + ' · ' + said);
    await page.fill('#st-sw-q', '').catch(() => null);
    await page.selectOption('[data-st-sw-f="keep"]', 'set').catch(() => null);
    const none = await until(() => document.querySelectorAll('.st-sw-row').length === 0 && /No stream matches/.test((document.querySelector('.st-sw-tb tbody') || {}).textContent || '') ? true : null, null, 3000);
    check('2b a filter with nothing behind it says so in the table', !!none);
    await page.selectOption('[data-st-sw-f="keep"]', 'any').catch(() => null);

    /* RE-POINTED 18 Oct 2026 (round 26 as drawn): a press shows the stream in
       the side panel (settings-as-drawn-verify); Enter or a double press opens
       its own page, the one door it always had */
    console.log('\n3 · a row opens its stream');
    const first = await page.evaluate(() => { const r = document.querySelector('.st-sw-row'); return r ? { fid: r.getAttribute('data-st-sw-pick'), name: r.querySelector('b').textContent } : null; });
    if (first && await page.locator('.st-sw-row').first().dblclick().then(() => true, () => false)) {
      const d = await until(() => { const dw = document.getElementById('st-drawer'); return dw && dw.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent : null; }, null, 4000);
      check('3 the row opens that stream\'s own page', d === first.name, d);
      await page.evaluate(() => stDrawerClose());
    }

    console.log('\n4 · + New stream');
    if (await press('[data-st-pg="streams"] .st-pg-head [data-st-panel="folders"]', '4 + New stream')) {
      const add = await until(() => { const dw = document.getElementById('st-drawer'); return dw && dw.classList.contains('open') && document.getElementById('st-folder-new') ? true : null; }, null, 4000);
      check('4 it opens Contract folders with its add box', !!add);
      await page.evaluate(() => stDrawerClose());
    }

    console.log('\n5 · Data & backup');
    await toCompany();
    if (await press('[data-st-card="house"] [data-st-panel="backup"]', '5 the door')) {
      const dp = await until(() => { const p = document.querySelector('[data-st-pg="data"]'); const dw = document.getElementById('st-drawer');
        return p ? { title: (p.querySelector('.st-pg-t') || {}).textContent, tabs: [...p.querySelectorAll('[data-st-bk-tab]')].map(b => b.textContent.trim() + (b.classList.contains('is-on') ? '*' : '')).join(' | '),
          drawer: !!(dw && dw.classList.contains('open')), backup: !!document.getElementById('bk-export') } : null; }, null, 6000);
      check('5a the door lands on the page, Backup in front, no drawer', !!dp && /Data/.test(dp.title) && dp.tabs === 'The trail | Backup*' && !dp.drawer && dp.backup, JSON.stringify(dp));
      await press('[data-st-pg="data"] [data-st-bk-tab="trail"]', '5b The trail');
      const band = await until(() => { const b = document.querySelector('.st-tr-band'); if (!b) return null;
        const boxes = [...b.querySelectorAll('.st-sw-f')]; const tops = new Set(boxes.map(x => Math.round(x.getBoundingClientRect().top)));
        const fig = (document.querySelector('.st-tr-band .st-tr-fig b') || {}).textContent || '';
        return fig ? { labels: boxes.map(x => x.querySelector('span').textContent.trim()).join('|'), oneRow: tops.size === 1, fig } : null; }, null, 6000);
      check('5b the trail\'s asks are labelled boxes in one row, with its count', !!band && band.labels === 'From|To|Streams|As' && band.oneRow && /act/.test(band.fig), JSON.stringify(band));
      await shot(page, 'data-trail-1440x780');
      if (await press('[data-st-pg="data"] .st-pg-back', '5c ‹ Settings')) {
        const back = await until(() => !document.querySelector('[data-st-pg]') && document.querySelector('#st-board .st-cards') ? true : null, null, 4000);
        check('5c ‹ Settings goes back to the board', !!back);
      }
    }

    console.log('\n6 · a refresh keeps the page');
    await page.evaluate(() => settingsGoPage('streams'));
    await until(() => !!document.querySelector('[data-st-pg="streams"]'));
    await page.reload({ waitUntil: 'networkidle' });
    const kept = await until(() => { if (document.querySelector('[data-st-pg="streams"]')) return true;
      if (state.view !== 'team') setView('team'); return null; }, null, 15000);
    check('6 Contract streams after a refresh', !!kept);

    console.log('\n7 · the owner\'s three screens');
    for (const pgk of ['streams', 'data']) for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      await page.evaluate(k => { if (k === 'data') stDrawerOpen('trail'); else settingsGoPage(k); }, pgk);
      await until(k => !!document.querySelector(`[data-st-pg="${k}"]`), pgk);
      await page.waitForTimeout(300);
      const fit = await page.evaluate(k => { const p = document.querySelector(`[data-st-pg="${k}"]`); const R = p.getBoundingClientRect();
        const past = [...p.querySelectorAll('*')].filter(e => { const r = e.getBoundingClientRect(); return r.width && r.right > R.right + 1; }).length;
        const cut = [...p.querySelectorAll('td, th, .st-sw-f > span, .st-dp-tab, #st-tr-download')].filter(e => e.scrollWidth > e.clientWidth + 1).length;
        return { sx: document.scrollingElement.scrollWidth > innerWidth, past, cut }; }, pgk);
      check(`7 ${pgk} at ${w}×${hh}: nothing past the page's edge, nothing cut, no sideways scroll`, !fit.sx && fit.past === 0 && fit.cut === 0, JSON.stringify(fit));
      await shot(page, `${pgk}-${w}x${hh}`);
    }

    check('no console errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
