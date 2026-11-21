/* SET-HOW-FIRM — how firm a standard is, set on the standard itself.
   RE-WRITTEN 17 Nov 2026 (the owner picked The Ladder: Standards is a page of its own; "Set how firm we are" and the
   old book editor are gone — How firm is the first choice on the standard's own edit page). Asked here:
     1  a standard chosen in the list draws as a ladder, its firmness beside its name
     2  Edit the standard opens its edit page with that firmness chosen and its words in the boxes
     3  a numeric one (Payment terms) and one another book holds firmer (Confidentiality) open the same way
     4  a firmness pressed changes the sentence that says what it means; Cancel leaves the standard as it was
     5  Send for approval asks why, and the change waits (nothing is changed on the ladder yet)
     6  a viewer sees the ladder and no Edit the standard
   Run: node test/chromium/set-how-firm-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

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
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/users', { method: 'POST', body: { name: 'Vera Viewer', email: 'vera@example.co.ke', role: 'viewer', password: 'temporary-pass-1' } });
  { const v = h.client('vera@example.co.ke');
    await v.json('/api/login', { method: 'POST', body: { email: 'vera@example.co.ke', password: 'temporary-pass-1' } });
    await v.json('/api/password/change', { method: 'POST', body: { current: 'temporary-pass-1', password: 'their-own-pass-9' } }); }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const signIn = async (email, pass) => {
      const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
      await page.waitForFunction(() => !!document.getElementById('igd-input'), null, { timeout: 20000 });
      return page;
    };
    const until = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    /* the standard chosen by its topic in the list; the ladder it draws */
    const choose = async (page, topic) => {
      await page.evaluate(() => { if (state.view !== 'playbook') setView('playbook'); });
      const it = await until(page, t => { const b = [...document.querySelectorAll('.ld-list [data-ld-pick]')].find(x => x.textContent.includes(t)); if (!b) return null; b.click(); return true; }, topic);
      if (!it) return null;
      /* RE-POINTED (P-35, owner's pick 20 Nov 2026: Playbook the Legora + Stripe way): how firm is a soft badge over the name
         (.ld6-eb .apn-st), the ladder a timeline of marked rungs (.ld6-rungs .ld6-rung) */
      return until(page, () => { const t = document.querySelector('.ld-main .ld-title'); const f = document.querySelector('.ld-main .ld6-eb .apn-st');
        return t && f ? { name: t.textContent.trim(), firm: f.textContent.trim(), rungs: document.querySelectorAll('.ld-main .ld6-rungs .ld6-rung').length, edit: !!document.querySelector('[data-ld-edit]') } : null; });
    };
    const openEdit = async page => {
      await page.evaluate(() => document.querySelector('[data-ld-edit]')?.click());
      return until(page, () => { const e = document.querySelector('.ld-edit'); if (!e) return null;
        const on = e.querySelector('.ld-seg.is-on'); const ask = e.querySelector('[data-ld-f="ask"]');
        return { firm: on ? on.textContent.trim() : '', ask: ask ? ask.value : '', says: (e.querySelector('.ld-firm-says') || {}).textContent || '' }; });
    };
    const cancel = page => page.evaluate(() => document.querySelector('[data-ld-cancel]')?.click());

    let page = await signIn('admin@example.co.ke', 'adminpassword1');
    console.log('\n1 · a standard the baseline names');
    let L = await choose(page, 'Governing law');
    check('1 Governing law draws as a ladder, Must have beside its name', !!L && /Must have/.test(L.firm) && L.rungs >= 1, JSON.stringify(L));
    console.log('\n2 · its edit page');
    let E = await openEdit(page);
    check('2 Edit the standard opens on its own page: Must have chosen, its words in the box', !!E && /Must have/.test(E.firm) && /Kenya/.test(E.ask), JSON.stringify(E));
    await shot(page, 'set-how-firm-edit');
    await cancel(page);
    console.log('\n3 · a numeric one, and one another book holds');
    L = await choose(page, 'Payment terms'); E = L ? await openEdit(page) : null;
    check('3a Payment terms opens the same way, its firmness chosen', !!E && !!E.firm && /30/.test(E.ask), JSON.stringify({ L, E }));
    await cancel(page);
    L = await choose(page, 'Confidentiality'); E = L ? await openEdit(page) : null;
    check('3b Confidentiality: the firmness is the strictest any book holds (Must have)', !!L && /Must have/.test(L.firm) && !!E && /Must have/.test(E.firm), JSON.stringify({ L, E }));
    console.log('\n4 · a firmness pressed');
    const said = await page.evaluate(() => { document.querySelector('.ld-edit [data-ld-firm="nice"]')?.click(); return true; })
      && await until(page, () => { const e = document.querySelector('.ld-edit'); const on = e && e.querySelector('.ld-seg.is-on'); return on && /Nice to have/.test(on.textContent) ? (e.querySelector('.ld-firm-says') || {}).textContent : null; });
    check('4a Nice to have pressed: chosen, and its sentence says what it means', !!said && /give it up freely/i.test(said), said);
    await cancel(page);
    L = await choose(page, 'Confidentiality');
    check('4b Cancel leaves the standard as it was', !!L && /Must have/.test(L.firm), JSON.stringify(L));
    console.log('\n5 · Send for approval');
    E = await openEdit(page);
    await page.evaluate(() => { document.querySelector('.ld-edit [data-ld-firm="push"]')?.click(); });
    await page.evaluate(() => document.querySelector('[data-ld-send]')?.click());
    const dlg = await until(page, () => !!document.getElementById('ld-why'));
    if (dlg) { await page.fill('#ld-why', 'Two years is enough for confidentiality.'); await page.evaluate(() => document.getElementById('ld-send-go')?.click()); }
    const waits = await until(page, () => { const c = (state.settings && state.settings.standardChanges) || []; return c.some(x => x.state === 'waiting' && /Confidential/i.test(x.draft.name || x.draft.category)) ? { n: c.length } : null; });
    L = await choose(page, 'Confidentiality');
    check('5 the change waits; the ladder still says Must have until another admin says yes', !!dlg && !!waits && !!L && /Must have/.test(L.firm), JSON.stringify({ dlg, waits, L }));
    await page.context().close();

    console.log('\n6 · a viewer');
    page = await signIn('vera@example.co.ke', 'their-own-pass-9');
    L = await choose(page, 'Governing law');
    check('6 a viewer sees the ladder, and no Edit the standard', !!L && L.rungs >= 1 && !L.edit, JSON.stringify(L));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
