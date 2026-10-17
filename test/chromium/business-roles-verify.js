/* BUSINESS ROLES — THE DRAWER AND THE ROLES PAGE (owner picked "A role at the
   top of the drawer — the SAP way", 17 Oct 2026; piece 6 of the sensitive
   contracts and governance plan)

   WHAT THIS PINS, driven in a real browser (the server's own claims — admin
   only, one shape, the record, only a name — are f700's)
     1 Company › People carries a door, Roles, onto a page that lists the
       business roles; New role makes one (Finance: Editor, sees values, signs
       up to 5M, two streams, checked before sending, may put on hold)
     2 a person's drawer opens with Business role at the top; choosing Finance
       fills the drawer's own controls with what Finance brings and lists it
       under "What Finance brings"; ticking one more right shows it as an
       Extra, live
     3 Save writes each right through the routes the drawer always used (the
       server holds Editor, the limit, the streams, the hold grant, the
       re-file extra) and puts the role's name on the person; the Team list
       has a Business role column saying Finance
     4 a change to Finance on the Roles page says who it reaches before Save
       ("Saving changes the rights of 1 person."), and Save moves only the
       rights the holder had from the role — the extra stays
     5 an admin's drawer says an admin holds every right by rank
     6 the owner's three screens: the drawer and the page fit
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/business-roles-verify.js */
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
  const W = await H.seedWorkspace(h, { approvalRules: [] });
  const target = W.users.unrestricted;   // "Unrestricted Legal", an Editor
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const drawerOpen = () => until(() => { const d = document.getElementById('st-drawer'); return d && d.classList.contains('open') ? (document.querySelector('#st-dhead .rvd-title') || {}).textContent || 'open' : null; });
    const drawerShut = () => until(() => { const d = document.getElementById('st-drawer'); return !d || !d.classList.contains('open'); });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 2, null, { timeout: 20000 });

    console.log('\n1 · the Roles page, and a role made');
    const door = await until(() => {
      if (!document.getElementById('set-page') || settingsTab() !== 'company') { setView('team'); settingsGoTab('company'); return null; }
      const d = document.querySelector('[data-st-card="people"] [data-st-page="roles"]');
      return d && d.getBoundingClientRect().width > 0 ? d.textContent.replace(/\s+/g, ' ').trim() : null; }, null, 15000);
    check('1a Company › People carries a door, Roles', /^Roles ›$/.test(door || ''), door);
    if (door) await press('[data-st-card="people"] [data-st-page="roles"]', '1a Roles');
    const empty = await until(() => { const p = document.querySelector('[data-st-pg="roles"]'); return p ? (p.querySelector('.st-bz-empty') || {}).textContent || 'listed' : null; });
    check('1b the page lands, saying no roles yet and what one is', /No business roles yet/.test(empty || ''), empty);
    await shot(page, 'roles-empty');
    if (await press('[data-st-pg="roles"] [data-st-panel="role:new"]', '1c New role')) {
      await drawerOpen();
      if (await page.locator('#bz-name').count()) await page.fill('#bz-name', 'Finance');
      await page.evaluate(() => {
        const set = (sel, on) => { const el = document.querySelector(sel); if (el && el.checked !== on) { el.checked = on; el.dispatchEvent(new Event('change', { bubbles: true })); } };
        set('input[name="bz-sys"][value="legal"]', true); set('#bz-values', true); set('#bz-checked', true); set('#bz-hold', true);
        const cap = document.getElementById('bz-cap'); cap.value = '5000000'; cap.dispatchEvent(new Event('input', { bubbles: true }));
        const st = document.getElementById('bz-streams'); st.value = 'pick'; st.dispatchEvent(new Event('change', { bubbles: true }));
        ['proc', 'sales'].forEach(f => set(`[data-bz-stream="${f}"]`, true));
      });
      await shot(page, 'role-drawer-new');
      await press('#st-dsave', '1c Save');
      await drawerShut();
    }
    const row = await until(() => { const tr = [...document.querySelectorAll('[data-st-pg="roles"] tr.st-person')].find(r => /Finance/.test(r.textContent));
      return tr ? tr.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('1c New role makes Finance, listed with what it brings and who holds it', /Finance Editor — redlines and signs · Sees contract values · Signs up to KES 5M · Streams: .+ · Checked before sending · May put contracts on hold 0 people/.test(row || ''), row);

    console.log('\n2 · the person\'s drawer opens with the role');
    await page.evaluate(id => stDrawerOpen('person:' + id), target.id);
    await drawerOpen();
    const top = await until(() => { const s = document.querySelector('#st-dbody .st-bz'); const first = document.querySelector('#st-dbody .st-sec');
      return s ? { first: first === s || (first && first.classList.contains('st-bz')) || (s.compareDocumentPosition(document.querySelector('#tm-name')) & 4) > 0, opts: [...s.querySelectorAll('#tm-bz option')].map(o => o.textContent.trim()).join(' | ') } : null; });
    check('2a Business role sits above Who, offering None and Finance', !!top && top.first && top.opts === 'None — rights set one by one | Finance', JSON.stringify(top));
    await page.evaluate(() => { const s = document.getElementById('tm-bz'); const o = s && [...s.options].find(x => x.textContent === 'Finance');
      if (o) { s.value = o.value; s.dispatchEvent(new Event('change', { bubbles: true })); } });
    const filled = await until(() => {
      const brings = [...document.querySelectorAll('#st-dbody .st-bz-brings li')].map(li => li.textContent.trim());
      if (!brings.length) return null;
      const role = (document.getElementById('tm-role') || {}).value, hold = document.getElementById('tm-hold'), cap = document.getElementById('tm-cap'),
        rv = document.getElementById('tm-rv-checked'), acc = document.getElementById('tm-access');
      const ticks = [...document.querySelectorAll('[data-tm-folder]')].filter(c => c.checked).map(c => c.getAttribute('data-tm-folder')).sort().join(',');
      return { brings: brings.length, role, hold: hold && hold.checked, cap: cap && cap.value, rv: rv && rv.checked, acc: acc && acc.value, ticks,
        exact: ((document.getElementById('tm-bz-extras') || {}).textContent || '').trim() };
    });
    check('2b choosing Finance fills the drawer: Editor, the hold grant, 5,000,000, checked, the two streams', !!filled && filled.role === 'legal' && filled.hold === true && filled.cap === '5000000' && filled.rv === true && filled.acc === 'pick' && filled.ticks === 'proc,sales', JSON.stringify(filled));
    check('2c …says what Finance brings, and that nothing is on top yet', !!filled && filled.brings === 6 && /holds exactly what Finance brings/.test(filled.exact), JSON.stringify(filled));
    await page.evaluate(() => { const r = document.getElementById('tm-refile'); if (r) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); } });
    const extra = await until(() => { const li = document.querySelector('#tm-bz-extras [data-bz-extra="refile"]'); return li ? li.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('2d ticking one more right shows it as an Extra, live', /^May re-file contracts ?Extra$/.test(extra || ''), extra);
    await shot(page, 'person-drawer-finance');

    console.log('\n3 · Save writes each right, and the role\'s name');
    await press('#st-dsave', '3 Save');
    await drawerShut();
    const boot = await W.admin.json('/api/bootstrap');
    const u = boot.users.find(x => x.id === target.id);
    const fa = (boot.settings.folderAccess || {})[target.id];
    /* checked before sending: the drawer writes it only where it differs from
       the reading, and an unanswered person reads as the company's default
       for new people (checked) — so null here IS checked */
    check('3a the server holds each right: Editor, limit 5,000,000, checked, hold, the re-file extra, two streams', u.role === 'legal' && Number(u.signCap) === 5000000 && u.reviewChecked !== false && u.holdContracts === true && u.reFile === true
      && JSON.stringify((fa || []).slice().sort()) === '["proc","sales"]', JSON.stringify({ role: u.role, signCap: u.signCap, reviewChecked: u.reviewChecked, hold: u.holdContracts, reFile: u.reFile, fa }));
    const bz = boot.bizRoles || { roles: [], of: {} };
    check('3b …and Finance\'s name is on the person', !!(bz.of || {})[target.id] && bz.of[target.id] === (bz.roles.find(r => r.name === 'Finance') || {}).id, JSON.stringify(bz.of));
    await page.evaluate(() => settingsGoPage('team'));
    const col = await until(id => { const c = document.querySelector(`[data-st-bz="${id}"]`); return c ? c.textContent.trim() : null; }, target.id);
    const head = await page.evaluate(() => [...document.querySelectorAll('.st-people-table thead th')].map(t => t.textContent.trim()).join(' | '));
    check('3c the Team list has a Business role column saying Finance', col === 'Finance' && /Business role/.test(head), col + ' / ' + head);
    await shot(page, 'team-business-role');

    console.log('\n4 · a change to the role says who it reaches, then moves only what came from it');
    await page.evaluate(() => settingsGoPage('roles'));
    const fin = await until(() => { const tr = [...document.querySelectorAll('[data-st-pg="roles"] tr.st-person')].find(r => /Finance/.test(r.textContent)); return tr ? tr.getAttribute('data-st-panel') : null; });
    if (fin) {
      await page.evaluate(k => stDrawerOpen(k), fin);
      await drawerOpen();
      await page.evaluate(() => { const c = document.getElementById('bz-cap'); if (c) { c.value = '8000000'; c.dispatchEvent(new Event('input', { bubbles: true })); }
        const r = document.getElementById('bz-refile'); if (r) { r.checked = false; r.dispatchEvent(new Event('change', { bubbles: true })); } });
      const says = await until(() => { const s = document.getElementById('bz-who-says'); return s && /Saving changes/.test(s.textContent) ? { says: s.textContent.trim(), li: ((document.querySelector('#bz-who [data-bz-holder]') || {}).textContent || '').replace(/\s+/g, ' ').trim() } : null; });
      check('4a before Save it says who it reaches: 1 person, 1 right moves', !!says && says.says === 'Saving changes the rights of 1 person.' && /Unrestricted Legal ?1 right moves/.test(says.li), JSON.stringify(says));
      await shot(page, 'role-drawer-change');
      await press('#st-dsave', '4b Save');
      await drawerShut();
      const b2 = await W.admin.json('/api/bootstrap');
      const u2 = b2.users.find(x => x.id === target.id);
      check('4b Save moved the limit to 8,000,000 and kept the re-file extra', Number(u2.signCap) === 8000000 && u2.reFile === true, JSON.stringify({ signCap: u2.signCap, reFile: u2.reFile }));
    } else check('4 the Finance row (nothing to open)', false);

    console.log('\n5 · an admin\'s drawer');
    const me = (await W.admin.json('/api/bootstrap')).me;
    await page.evaluate(id => stDrawerOpen('person:' + id), me.id);
    await drawerOpen();
    const adm = await until(() => { const s = document.querySelector('#st-dbody .st-bz'); return s ? s.textContent.replace(/\s+/g, ' ').trim() : null; });
    check('5 an admin\'s drawer says an admin holds every right by rank, and offers no role', /holds every right by rank/.test(adm || '') && !(await page.locator('#tm-bz').count()), adm);
    await page.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });

    console.log('\n6 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(id => stDrawerOpen('person:' + id), target.id);
      await drawerOpen();
      const fit = await page.evaluate(() => {
        const body = document.getElementById('st-dbody');
        const cut = [...document.querySelectorAll('#st-dbody .st-bz select, #st-dbody .st-bz-brings li, #st-dbody .st-bz-tag')].filter(x => x.scrollWidth > x.clientWidth + 1).length;
        return { side: body ? body.scrollWidth - body.clientWidth : -1, cut };
      });
      await shot(page, `person-drawer-${vp.width}x${vp.height}`);
      check(`6 ${vp.width}×${vp.height}: the role's part of the drawer fits`, fit.side <= 0 && fit.cut === 0, JSON.stringify(fit));
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
