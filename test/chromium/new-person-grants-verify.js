/* NEW-PERSON-GRANTS — the access questions are asked when a person is added
   (owner, 20 Oct 2026: "when adding a new person, some of these access
   questions are not available until you add them which makes no sense").

   The Add member form now draws the four grants a member's drawer draws —
   Sees contract values, new paper, re-filing, holds — shown by the role
   chosen on the same form, and the save stores them on the new account.

     1  a Viewer (the form's first answer) is asked about values only
     2  an Editor is asked all four; a tick's words say which way it is set
     3  an Admin reads the "holds it by rank" sentences, no ticks
     4  saved as an Editor, the server holds exactly what was ticked
     5  the form fits at the owner's three screens

   Run: node test/chromium/new-person-grants-verify.js */
'use strict';
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
  const h = await H.startHati();
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const drawerOpen = () => until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? 'open' : null; });
    const drawerShut = () => until(() => { const d = document.getElementById('st-drawer'); return !d || !d.classList.contains('open'); });
    /* what the form shows: each grant's box drawn AND not hidden, and the
       admin sentences shown */
    const shown = () => page.evaluate(() => {
      const vis = el => !!el && !el.closest('[hidden]') && el.getBoundingClientRect().height > 0;
      const box = id => vis(document.getElementById(id));
      const notes = [...document.querySelectorAll('#st-dbody [data-tm-for="admin"]')].filter(vis).length;
      return { values: box('tm-values'), paper: box('tm-paper'), refile: box('tm-refile'), hold: box('tm-hold'), notes };
    });
    const pickRole = r => page.evaluate(k => { const el = document.querySelector(`[name="tm-role-r"][value="${k}"]`);
      if (el) { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); } return !!el; }, r);

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 20000 });

    const door = await until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const d = document.querySelector('[data-st-card="people"] [data-st-panel="person:new"]');
      return d && d.getBoundingClientRect().width > 0;
    }, null, 15000);
    check('0 Company › People & access carries Add member', !!door);
    if (!door) throw new Error('no Add member door');
    await page.locator('[data-st-card="people"] [data-st-panel="person:new"]').first().click();
    await drawerOpen();

    console.log('\n1 · a Viewer');
    const v = await until(() => document.getElementById('tm-values') ? true : null);
    check('1a the new-person form draws the values tick', !!v);
    const s1 = await shown();
    check('1b a Viewer is asked about values only', s1.values && !s1.paper && !s1.refile && !s1.hold && s1.notes === 0, JSON.stringify(s1));

    console.log('\n2 · an Editor');
    await pickRole('legal');
    const s2 = await shown();
    check('2a an Editor is asked all four', s2.values && s2.paper && s2.refile && s2.hold && s2.notes === 0, JSON.stringify(s2));
    const words = await page.evaluate(() => {
      const nm = id => (document.getElementById(id).closest('label').querySelector('.st-role-name') || {}).textContent;
      const before = nm('tm-paper');
      const b = document.getElementById('tm-paper'); b.click();
      return { before, after: nm('tm-paper'), checked: b.checked };
    });
    check('2b a tick\'s words follow the tick', words.before === 'May not create new paper' && words.after === 'May create new paper' && words.checked, JSON.stringify(words));
    await shot(page, 'new-person-editor');

    console.log('\n3 · an Admin');
    await pickRole('admin');
    const s3 = await shown();
    check('3a an Admin reads three sentences, no ticks', !s3.values && !s3.paper && !s3.refile && !s3.hold && s3.notes === 3, JSON.stringify(s3));

    console.log('\n4 · saved as an Editor');
    await pickRole('legal');
    const kept = await page.evaluate(() => document.getElementById('tm-paper').checked);
    check('4a switching role and back keeps the tick', kept === true);
    await page.evaluate(() => {
      const set = (id, on) => { const el = document.getElementById(id); if (el.checked !== on) el.click(); };
      set('tm-values', false); set('tm-hold', true); set('tm-refile', false);
    });
    await page.fill('#tm-name', 'Grace Wanjiru');
    await page.fill('#tm-email', 'grace@example.co.ke');
    await page.fill('#tm-pass', 'temporary-pass-1');
    await page.evaluate(() => { const a = document.getElementById('tm-access'); a.value = '*'; a.dispatchEvent(new Event('change', { bubbles: true })); });
    await page.locator('#st-dsave').click();
    await drawerShut();
    /* the server's own word: bootstrap read fresh, not the page's copy */
    const stored = await until(async () => {
      const j = await api('bootstrap').catch(() => null);
      const u = j && (j.users || []).find(x => x.email === 'grace@example.co.ke');
      return u ? { role: u.role, values: u.canViewValues, paper: !!u.newPaper, refile: !!u.reFile, hold: !!u.holdContracts } : null;
    }, null, 10000);
    const got = stored;
    check('4b the new account holds what was ticked (Editor, values hidden, new paper, hold, no re-filing)',
      !!got && got.role === 'legal' && got.values === false && got.paper && got.hold && !got.refile, JSON.stringify(stored));

    console.log('\n5 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => stDrawerOpen('person:new'));
      await drawerOpen();
      await pickRole('legal');
      const fit = await page.evaluate(() => { const b = document.getElementById('st-dbody'); return b ? b.scrollWidth - b.clientWidth : -1; });
      await page.evaluate(() => { const el = document.getElementById('tm-values'); if (el) el.scrollIntoView({ block: 'center' }); });
      /* the drawer slides in: photograph it once it has landed */
      const landed = await until(() => { const d = document.getElementById('st-drawer'); if (!d) return null;
        const r = d.getBoundingClientRect(); return r.width > 0 && r.right <= innerWidth + 1 ? true : null; });
      check(`5 ${vp.width}×${vp.height}: the drawer lands whole on the screen`, !!landed);
      await shot(page, `new-person-${vp.width}x${vp.height}`);
      check(`5 ${vp.width}×${vp.height}: the form fits, no sideways scroll`, fit === 0, String(fit));
      await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await drawerShut();
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
