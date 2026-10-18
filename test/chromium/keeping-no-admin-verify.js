/* KEEPING: A PRIVATE STREAM NO ADMIN CAN SEE (the owner's yes, 18 Oct 2026, to
   round 26's open question; js/views/settings.js stKpNeedRows, server kpUnseen)

   WHAT THIS PINS, driven in a real browser (the server's half is f729)
     1 Needs your attention says "No admin can see it · <stream>" — and nothing
       of its contracts — for a private stream with contracts past their
       keeping period that names no admin
     2 its button opens that stream's page, where people are named
     3 the admin names themselves and saves: the row goes at once, and the
       page's next paint brings the stream's contracts into the admin's own
       "Ready to delete"
   At the parent (main before this change) 1–3 fail.
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/keeping-no-admin-verify.js */
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
const yearsAgo = y => { const t = new Date(); t.setFullYear(t.getFullYear() - y);
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; };
const K = (id, name, end) => ({ ...H.fixtureContract(id, name, 'Board Counsel LLP', H.FOLDER_B, 1e6, 'Signed'), expiry: end, metadata: { value: 1e6, currency: 'KES' } });

(async () => {
  const h = await H.startHati();
  const W = await H.seedWorkspace(h, { approvalRules: [], contracts: [K('BD-1', 'Board minutes retainer (2012)', yearsAgo(12))] });
  /* this quarter's access review is done: its ask is not what this check reads */
  for (const u of Object.values(W.users)) await W.admin.json('/api/access-review/mark', { method: 'POST', body: { userId: u.id, verdict: 'keep' } });
  await W.admin.json('/api/access-review/done', { method: 'POST', body: {} });
  await W.admin.json('/api/keeping/' + H.FOLDER_B, { method: 'PUT', body: { years: 10, then: 'delete' } });
  await W.admin.json('/api/private-streams/' + H.FOLDER_B, { method: 'PUT', body: { on: true, ids: [W.users.unrestricted.id] } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    const toCompany = () => until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      return document.querySelector('#st-board .st-cards') ? true : null; }, null, 15000);
    await toCompany();

    console.log('\n1 · Needs your attention');
    const key = 'keep-unseen:' + 'sales';
    const row = await until(k => { const r = document.querySelector(`#st-att [data-st-need="${k}"]`);
      return r ? { text: r.textContent.replace(/\s+/g, ' ').trim(), att: (document.getElementById('st-att') || {}).textContent || '' } : null; }, key, 6000);
    check('1a "No admin can see it · <stream>", saying it names no admin', !!row && /^No admin can see it · Sales/.test(row.text) && /names no admin/.test(row.text), row && row.text);
    check('1b nothing of its contracts is said', !!row && !/Board minutes|BD-1|Board Counsel/.test(row.att), row ? 'clean' : 'no row');
    await shot(page, 'keeping-no-admin-needs');

    console.log('\n2 · its door');
    if (await press(`#st-att [data-st-need="${key}"] [data-st-panel]`, '2 the row\'s button')) {
      const pg = await until(() => { const p = document.getElementById('st-ps'); return p && p.querySelector('[data-st-ps-add]') ? true : null; }, null, 6000);
      check('2 it opens the stream\'s page, where people are named', !!pg);

      console.log('\n3 · name an admin');
      const me = await page.evaluate(() => String(currentUser().id));
      if (await press(`#st-ps [data-st-ps-add="${me}"]`, '3 Add me') && await press('#st-dsave', '3 Save')) {
        /* the row goes at once (stSyncAttention takes rows out, never adds one
           under the reader's hand); the page's next paint adds Ready to delete */
        const gone = await until(k => !document.querySelector(`#st-att [data-st-need="${k}"]`) && state.keeping && !(state.keeping.unseen || []).length ? true : null, key, 10000);
        check('3a the row goes as soon as the stream names an admin', !!gone);
        await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); settingsGoPage(''); });
        const after = await until(() => { const r = document.querySelector('#st-att [data-st-need="keep:sales"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 8000);
        check('3b and the stream\'s contracts come into this admin\'s own Ready to delete', !!after && /Ready to delete · Sales/.test(after), String(after));
      }
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
