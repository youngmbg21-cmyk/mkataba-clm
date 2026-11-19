/* Chromium verification: SETTINGS, DOOR TO DOOR (P-11; the owner picked "Six doors", then "build it with the Dossier
   card", 17 Nov 2026). Replaces settings-menu-verify (the twelve-row list it drove is gone).
   =====================================================================
   Driven in a real browser, the sample book, the new look on, at the owner's three screens:
     0  the landing: "Settings", the find box, the six areas in order, one row each; the count by the title is the
        areas' counts added up, and the same number heads Jambo's card
     1  an area: one press chooses it (the panel names it), a second goes in; "‹ Settings" comes back
     2  every area: every row has a name, a sentence and its own door or switch; nothing spills, nothing slides sideways
     3  Jambo: the daily budget says its figure; chosen, the card says it; a second press opens today's engine drawer
     4  the find box: "budget" finds Daily budget; its press lands in Jambo with that row chosen
     5  Company › People & roles: the page, its tabs, "‹ Company" back onto the row that opened it
     6  Set-up and records › Trail & backup: the page, "‹ Set-up and records"
     7  an inner page's panel is the Dossier card, not the Menu door
     8  a refresh lands on the same area and the same chosen row
   Run: node test/chromium/settings-door-to-door-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'settings-door-to-door');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)).slice(0, 400) : ''}`); };
const waitFor = async (page, fn, arg, ms = 8000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const AREAS = ['you', 'company', 'rules', 'jambo', 'mail', 'setup'];
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ HATI_AGENTS_AUTO: 'off' });
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
    const land = async () => {
      await page.reload({ waitUntil: 'networkidle' });
      await waitFor(page, () => typeof openSettingsAt === 'function' && !!(window.state && Array.isArray(state.contracts) && state.contracts.length), null, 20000);
      if (!(await page.evaluate(() => document.documentElement.classList.contains('lg-new')))) await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); });
      await page.evaluate(() => openSettingsAt('you'));
      return waitFor(page, () => document.querySelectorAll('#stn-main [data-sdd-home]').length >= 6, null, 10000);
    };
    const up = await land();
    check('0 Settings draws the six areas, the new look on', up);
    if (!up) throw new Error('no landing');
    /* the readings that land late (the engine's limits, colleagues' asks) settle first */
    await waitFor(page, () => window.state && !!state.aiCfg, null, 6000); await page.waitForTimeout(400);

    /* 0 · the landing */
    const L = await page.evaluate(() => {
      const areas = [...document.querySelectorAll('#stn-main [data-sdd-home]')].map(r => r.getAttribute('data-sdd-home'));
      const per = [...document.querySelectorAll('#stn-main [data-sdd-home] .sdd-v')].map(v => { const m = /^(\d+) need/.exec(v.textContent.trim()); return m ? +m[1] : 0; });
      const cnt = (document.querySelector('.sdd-cnt') || {}).textContent || '', n = +(/(\d+)/.exec(cnt) || [0, 0])[1];
      const card = ((document.querySelector('#ins-panel .jov5-title') || {}).textContent || '').trim();
      return { title: (document.querySelector('.sdd-title') || {}).childNodes[0].textContent.trim(), find: !!document.getElementById('sdd-q'), areas, per, n, card };
    });
    check('0a the title, the find box, the six areas in order', L.title === 'Settings' && L.find && JSON.stringify(L.areas) === JSON.stringify(AREAS), L);
    check('0b the count by the title is the areas\' counts added up, and heads Jambo\'s card', L.n === L.per.reduce((a, b) => a + b, 0) && (L.n ? new RegExp('^' + L.n + ' things? needs? you').test(L.card) : /Nothing here needs you/.test(L.card)), L);
    await page.screenshot({ path: path.join(OUT, 'landing-1440x780.png') });

    /* 1 · an area: chosen, then in, then back */
    await page.click('#sdd-area-rules');
    const ch = await page.evaluate(() => ({ pressed: document.getElementById('sdd-area-rules').getAttribute('aria-pressed'), eb: ((document.querySelector('#ins-panel .jov5-eb') || {}).textContent || '') }));
    check('1a one press chooses an area; the panel names it', ch.pressed === 'true' && /^Rules/.test(ch.eb), ch);
    await page.click('#sdd-area-rules');
    check('1b a second press goes in', await waitFor(page, () => !!document.querySelector('.sdd-page[data-sdd-area="rules"] #sdd-review'), null, 5000));
    await page.click('[data-sdd-back]');
    check('1c ‹ Settings comes back to the six areas', await waitFor(page, () => document.querySelectorAll('#stn-main [data-sdd-home]').length === 6, null, 5000));

    /* 2 · every area, every row */
    for (const [w, hgt] of SCREENS) {
      await page.setViewportSize({ width: w, height: hgt });
      for (const a of AREAS) {
        await page.evaluate(x => sddGo(x), a); await waitFor(page, x => !!document.querySelector(`.sdd-page[data-sdd-area="${x}"]`), a, 4000);
        const R = await page.evaluate(() => { const m = document.getElementById('stn-main'), right = m.getBoundingClientRect().right;
          const rows = [...m.querySelectorAll('.sdd-row')];
          return { n: rows.length,
            /* the phone-alerts row says this browser's state and has no switch where alerts cannot be had (an unusable switch is not drawn) */
            bare: rows.filter(r => r.id !== 'sdd-push').filter(r => !r.querySelector('.sdd-k') || !(r.querySelector('.sdd-s') || {}).textContent || !r.querySelector('.sdd-a :is([data-sdd-go], [data-st-sw], .st-yseg)')).map(r => r.id),
            spill: rows.filter(r => [...r.querySelectorAll('*')].some(e => { const b = e.getBoundingClientRect(); return b.width && b.right > right + 1; })).map(r => r.id),
            sideways: m.scrollWidth > m.clientWidth + 1 || document.getElementById('set-page').scrollWidth > document.getElementById('set-page').clientWidth + 1 }; });
        check(`2 ${a} at ${w}×${hgt}: every row named, said and with its door; nothing spills or slides`, R.n > 0 && !R.bare.length && !R.spill.length && !R.sideways, R);
        if (w === 1440) await page.screenshot({ path: path.join(OUT, `${a}-1440x780.png`) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 3 · Jambo's daily budget */
    await page.evaluate(() => sddGo('jambo'));
    const B = await page.evaluate(() => (document.querySelector('#sdd-budget .sdd-s') || {}).textContent || '');
    check('3a the daily budget says its figure', /\$10\.00 a day/.test(B), B);
    await page.click('#sdd-budget');
    const C = await page.evaluate(() => ({ chosen: document.getElementById('sdd-budget').classList.contains('is-chosen'), card: (document.querySelector('#ins-panel .jov5') || {}).innerText || '' }));
    check('3b chosen, Jambo\'s card says it and who may change it', C.chosen && /\$10\.00 a day for the whole company/.test(C.card) && /Admins/.test(C.card), C);
    await page.click('#sdd-budget');
    check('3c a second press opens today\'s engine drawer', await waitFor(page, () => { const t = document.getElementById('st-drawer-title'); return !!t && t.getBoundingClientRect().width > 0 && /Jambo engine/.test(t.textContent); }, null, 5000));
    await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });

    /* 4 · the find box */
    await page.evaluate(() => sddGo(null));
    await page.fill('#sdd-q', 'budget');
    const F = await waitFor(page, () => !!document.querySelector('#stn-main [data-sdd-row="budget"][data-sdd-found]'), null, 4000);
    check('4a "budget" finds Daily budget', F);
    if (F) { await page.click('#stn-main [data-sdd-row="budget"][data-sdd-found] .sdd-t');
      check('4b its press lands in Jambo with that row chosen', await waitFor(page, () => !!document.querySelector('.sdd-page[data-sdd-area="jambo"] #sdd-budget.is-chosen'), null, 4000)); }

    /* 5 · People & roles */
    await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); sddGo('company'); });
    await waitFor(page, () => !document.querySelector('#st-drawer.open') && !!document.querySelector('#sdd-people [data-sdd-go]'), null, 5000);
    await page.locator('#sdd-people [data-sdd-go]').scrollIntoViewIfNeeded().catch(() => {});
    await page.click('#sdd-people [data-sdd-go]');
    const P = await waitFor(page, () => !!document.querySelector('.sdd-ptabs') && !!document.querySelector('.sdd-pgback'), null, 5000);
    const PT = P ? await page.evaluate(() => ({ back: document.querySelector('.sdd-pgback').textContent.trim(), tabs: [...document.querySelectorAll('.sdd-ptab')].map(b => b.textContent.trim()), panel: !!document.querySelector('#st-side .jov5'), menu: !!document.querySelector('#st-side [data-st-jb-menu-door]') })) : null;
    check('5a People & roles opens with its tabs and "‹ Company"', !!PT && PT.back === '‹ Company' && PT.tabs[0] === 'People' && PT.tabs.includes('Who holds what'), PT);
    check('7 an inner page\'s panel is the Dossier card, not the Menu door', !!PT && PT.panel && !PT.menu, PT);
    if (P) { await page.screenshot({ path: path.join(OUT, 'people-1440x780.png') }); await page.click('.sdd-pgback');
      check('5b ‹ Company comes back onto the row that opened it', await waitFor(page, () => !!document.querySelector('.sdd-page[data-sdd-area="company"] #sdd-people.is-chosen'), null, 5000)); }

    /* 6 · Trail & backup */
    await page.evaluate(() => sddGo('setup'));
    await page.click('#sdd-trail [data-sdd-go]');
    check('6 Trail & backup opens its page with "‹ Set-up and records"', await waitFor(page, () => /Set-up and records/.test((document.querySelector('.sdd-pgback') || {}).textContent || '') && !!document.querySelector('[data-st-bk-tab]'), null, 5000));

    /* 8 · a refresh lands where you were */
    await page.evaluate(() => { sddGo('mail'); sddPickSet('mailroom'); });
    await page.waitForTimeout(400);
    await page.reload({ waitUntil: 'networkidle' });
    check('8 a refresh lands on the same area and the same chosen row', await waitFor(page, () => !!document.querySelector('.sdd-page[data-sdd-area="mail"] #sdd-mailroom.is-chosen'), null, 15000));

    check('no page errors', errors.length === 0, errors.join(' | ') || undefined);
  } catch (e) { check('the walk', false, String(e).slice(0, 300)); }
  finally { await browser.close(); await h.stop(); }
  console.log(`\n${pass} passed, ${fail} failed — shots in ${OUT}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
