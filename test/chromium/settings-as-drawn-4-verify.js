/* SETTINGS AS DRAWN, THE FOURTH PASS (rounds 24, 25 and 26 after main was
   brought in again, 19 Oct 2026; js/views/settings.js, server
   srvClashAdminSees)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 EVERY DOOR TO A COMPANY PANEL IS ITS PAGE (round 25: "every door opens
       a page with ‹ Settings"): a Menu row for a panel that has no door on
       any card, a ⌘K row and Jambo's Open each open the panel as a page in
       the left column (the one drawer, docked; no dimmed page behind it),
       with ‹ Settings; ‹ Settings goes back and lands on the Menu row that
       was pressed. Needs your attention's own button still opens the drawer
       (as drawn: "Open Lina Ek" opens her drawer). At the owner's three
       screens: nothing sideways, the page's foot in the window
     2 WHEN YOU'RE AWAY, "Open it" on what waits for the stand-in opens
       Approvals & signing ON that approval's row, lit (LAND ON IT), pressing
       nothing
     3 the four Settings pages photographed at the three screens (You,
       Company, Contract streams, Data & backup), no sideways scroll
     4 no page errors
   At the parent (019b635) 1a–1e fail (a Menu row, ⌘K and Jambo's Open drew
   the drawer over the page); 1f, 2 and 3 describe what the third pass built
   and hold there too (the walls this pass keeps).
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/settings-as-drawn-4-verify.js */
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
const day = n => { const d = new Date(); d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const w = await H.seedWorkspace(h, { approvalRules: [], contracts: H.FIXTURES.concat([
    { ...H.fixtureContract('MK-W1', 'Route-to-market distribution', 'Naivas Supermarkets', H.FOLDER_B, 3e6, 'Under Review') },
  ]) });
  const boot = await w.admin.json('/api/bootstrap');
  const adminId = boot.me.id, U = w.users.unrestricted, R = w.users.restricted.id;
  /* a rule that names Unrestricted Legal on Sales: MK-W1 waits on them */
  await w.admin.json('/api/settings', { method: 'PUT', body: { ...(boot.settings || {}), signCap: { on: true },
    approvalRules: [{ id: 'r-sales', name: 'Sales sign-off', order: 1, cond: { type: 'folder', value: H.FOLDER_B }, approver: { kind: 'member', id: U.id, name: U.name } }] } });
  await w.admin.json('/api/users/' + U.id, { method: 'PATCH', body: { signCap: 5000000 } });
  /* a clash in Needs your attention: Restricted may sign more than their approver */
  await w.admin.json('/api/users/' + R, { method: 'PATCH', body: { signCap: 10000000, overseerOn: 'always', overseerId: U.id } });
  /* Unrestricted is away; the admin answers for them */
  await w.unrestricted.json('/api/me/away', { method: 'PUT', body: { deputyId: adminId, from: day(0), to: day(5) } }).catch(e => check('the away rule is saved', false, e.message));

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (W = 1440, HH = 780) => {
    const ctx = await browser.newContext({ viewport: { width: W, height: HH } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.length > 0, null, { timeout: 20000 });
    return page;
  };
  const kit = page => {
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; }
      try { await page.locator(sel).first().click({ timeout: 4000 }); } catch (e) { check(what + ' (could not be pressed: ' + sel + ')', false, e.message.split('\n')[0]); return false; } return true; };
    const company = () => until(() => { if (!document.getElementById('set-page')) { setView('team'); return null; }
      if (settingsTab() !== 'company' || document.querySelector('#set-page[data-st-sub]')) { settingsGoTab('company'); try { settingsGoPage(''); } catch (_) {} return null; }
      return document.querySelector('#st-board .st-cards') && document.querySelector('#st-att') ? true : null; }, null, 15000);
    return { until, press, company };
  };
  /* the docked page, read: the drawer in the page's column, no dimmed page,
     ‹ Settings, nothing sideways, its foot in the window */
  const dockRead = page => page.evaluate(() => {
    const dr = document.querySelector('#st-dock > #st-drawer'), sc = document.getElementById('content-scroll');
    const scrim = document.getElementById('st-scrim');
    const foot = document.getElementById('st-dfoot');
    const fr = foot && foot.getBoundingClientRect();
    return { docked: !!(dr && dr.classList.contains('is-docked') && dr.classList.contains('open') && !dr.hidden),
      sub: (document.getElementById('set-page') || {}).getAttribute ? document.getElementById('set-page').getAttribute('data-st-sub') : null,
      key: dr ? (document.querySelector('[data-st-pg="panel"]') || {}).getAttribute && document.querySelector('[data-st-pg="panel"]').getAttribute('data-st-dock-key') : null,
      dim: !!(scrim && !scrim.hidden && scrim.classList.contains('open')),
      back: ((document.querySelector('#set-page .st-pg-back') || {}).textContent || '').trim(),
      title: ((document.querySelector('#st-dock .rvd-title') || {}).textContent || '').trim(),
      sideways: document.documentElement.scrollWidth > innerWidth + 1 || !!(sc && sc.scrollWidth > sc.clientWidth + 1),
      footIn: !!fr && fr.width > 0 };
  });
  try {
    console.log('\n1 · every door to a company panel is its page');
    for (const [W, HH] of [[1440, 780], [1536, 730], [1366, 950]]) {
      const page = await open(W, HH); const { until, press, company } = kit(page);
      await company();
      /* a panel no card has a door to, from the Menu beside the board */
      const k = await until(() => { stSideSet('menu');
        const onCards = new Set([...document.querySelectorAll('#set-page [data-st-card] [data-st-panel]')].map(d => d.getAttribute('data-st-panel')));
        const r = [...document.querySelectorAll('#set-page .st-mrow[data-st-panel]')].find(x => { const k = x.getAttribute('data-st-panel'); return !onCards.has(k) && SET_PANELS[k] && !['trail', 'backup'].includes(k) && x.getBoundingClientRect().height > 0; });
        return r ? r.getAttribute('data-st-panel') : null; });
      if (!k) { check(`1a ${W}×${HH}: a Menu row for a panel with no card door`, false, 'none drawn'); await page.context().close(); continue; }
      await page.locator(`#set-page .st-mrow[data-st-panel="${k}"]`).first().scrollIntoViewIfNeeded().catch(() => {});
      if (await press(`#set-page .st-mrow[data-st-panel="${k}"]`, `1a ${W}×${HH} the Menu row`)) {
        const d = await until(() => { const dr = document.querySelector('#st-dock > #st-drawer.is-docked.open'); return dr ? true : (document.querySelector('body > #st-drawer.open') ? 'drawer' : null); });
        const r = await dockRead(page);
        check(`1a ${W}×${HH}: the Menu's "${k}" opens its page, not the drawer over a dimmed page`, d === true && r.docked && r.sub === 'panel' && !r.dim && /^‹ /.test(r.back) && !!r.title,
          JSON.stringify({ d, ...r }));
        check(`1b ${W}×${HH}: nothing sideways, its foot drawn`, !r.sideways && r.footIn, JSON.stringify({ sideways: r.sideways, foot: r.footIn }));
        await shot(page, `main-25-menu-panel-page-${W}x${HH}`);
        if (W === 1440) {
          await press('#set-page .st-pg-back', '1c ‹ Settings');
          const back = await until(sel => { const l = document.querySelector('.is-landed'); return !document.querySelector('#set-page[data-st-sub]') && l ? { k: l.getAttribute('data-st-panel'), row: l.classList.contains('st-mrow') } : null; }, null, 6000);
          check('1c ‹ Settings goes back and lands on the Menu row that was pressed', !!back && back.k === k && back.row, JSON.stringify(back));
        }
      }
      if (W === 1440) {
        /* ⌘K: a setting's row */
        await company();
        await page.keyboard.press('Control+k');
        const cp = await until(() => !!document.getElementById('cp-input'));
        if (cp) {
          await page.fill('#cp-input', 'Monthly report');
          const row = await until(() => { const r = [...document.querySelectorAll('#cmd-palette [data-kind="setting"], #cmd-palette .cp-row, #cmd-palette [role="option"]')].find(x => /Monthly report/i.test(x.textContent)); return r ? true : null; });
          if (row) { await page.keyboard.press('Enter'); }
          const r = await until(() => { const dr = document.querySelector('#st-dock > #st-drawer.is-docked.open'); return dr ? document.querySelector('[data-st-pg="panel"]').getAttribute('data-st-dock-key') : (document.querySelector('body > #st-drawer.open') ? 'drawer' : null); });
          check('1d ⌘K\'s "Monthly report" row opens its page with ‹ Settings', r === 'report', String(r));
        } else check('1d ⌘K opens', false, 'no palette');
        /* Jambo's Open on a setting he found (a drawer left over the page by a
           build without this pass is shut first, so each half reports alone) */
        const shut = () => page.evaluate(() => { try { if (document.querySelector('body > #st-drawer.open')) stDrawerClose(); } catch (_) {} });
        await shut(); await company();
        await page.evaluate(() => stSideSet('jambo'));
        await page.fill('#st-jb-q', 'events out'); await page.keyboard.press('Enter');
        const found = await until(() => !!document.querySelector('#st-jb-feed [data-st-jb-turn] .st-jb-card [data-st-panel="webhooks"]'));
        if (found && await press('#st-jb-feed [data-st-jb-turn] .st-jb-card [data-st-panel="webhooks"]', '1e Jambo\'s Open')) {
          const r = await until(() => document.querySelector('#st-dock > #st-drawer.is-docked.open') ? document.querySelector('[data-st-pg="panel"]').getAttribute('data-st-dock-key') : (document.querySelector('body > #st-drawer.open') ? 'drawer' : null));
          check('1e Jambo\'s Open on "Events out" opens its page', r === 'webhooks', String(r));
        } else if (!found) check('1e Jambo found "Events out"', false, await page.evaluate(() => (document.getElementById('st-jb-feed') || {}).textContent.slice(-160)));
        /* Needs your attention's own button keeps the drawer, as drawn */
        await shut(); await company();
        if (await press('#st-att .st-need[data-st-need^="clash:cap:"] .st-need-go', '1f the clash row\'s Open')) {
          const r = await until(() => { const dr = document.getElementById('st-drawer'); return dr && dr.classList.contains('open') ? { docked: dr.classList.contains('is-docked'), onBody: dr.parentElement === document.body } : null; });
          check('1f Needs your attention\'s "Open …" still opens the person\'s drawer (as drawn)', !!r && !r.docked && r.onBody, JSON.stringify(r));
          await page.keyboard.press('Escape');
        }
      }
      await page.context().close();
    }

    console.log('\n2 · "Open it" on what waits for the stand-in');
    {
      const page = await open(); const { until, press } = kit(page);
      const card = await until(() => { if (!document.getElementById('set-page') || settingsTab() !== 'you') { setView('team'); settingsGoTab('you'); return null; }
        const b = document.querySelector('[data-st-you-card="away"] [data-st-away-open]'); return b ? { id: b.getAttribute('data-st-away-open'), line: b.closest('.st-aw-cover').textContent.replace(/\s+/g, ' ').trim() } : null; }, null, 15000);
      check('2a the away card says whom you answer for, what waits, and Open it', !!card && /^MK-[WB]\d$/.test(card.id) && /You answer for Unrestricted Legal/.test(card.line) && /\b\d+ waits? now\b/.test(card.line), JSON.stringify(card));
      await shot(page, 'main-24-away-open-it-1440x780');
      if (card && await press('[data-st-you-card="away"] [data-st-away-open]', '2b Open it')) {
        const lit = await until(id => { const r = document.querySelector(`[data-ap-row="${id}"][data-ap-kind="approval"]`);
          return state.view === 'approvals' && r && r.classList.contains('is-landed') ? { lit: true, inView: (() => { const q = r.getBoundingClientRect(); return q.top >= 0 && q.bottom <= innerHeight; })(),
            decided: !!(getContract(id).approvalChain || []).some(s => s.status === 'approved') } : null; }, card.id, 10000);
        check('2b Open it lands ON the approval\'s row in Approvals & signing, lit and in view, pressing nothing', !!lit && lit.lit && lit.inView && !lit.decided, JSON.stringify(lit));
        await shot(page, 'main-24-away-landed-1440x780');
      }
      await page.context().close();
    }

    console.log('\n3 · the four pages at the owner\'s three screens');
    for (const [W, HH] of [[1440, 780], [1536, 730], [1366, 950]]) {
      const page = await open(W, HH); const { until, company } = kit(page);
      const you = await until(() => { if (!document.getElementById('set-page') || settingsTab() !== 'you') { setView('team'); settingsGoTab('you'); return null; } return !!document.querySelector('[data-st-you-card="away"]'); }, null, 15000);
      const side = () => page.evaluate(() => { const sc = document.getElementById('content-scroll'); return document.documentElement.scrollWidth > innerWidth + 1 || !!(sc && sc.scrollWidth > sc.clientWidth + 1); });
      check(`3a ${W}×${HH}: You, nothing sideways`, !!you && !(await side()));
      await shot(page, `main-24-you-${W}x${HH}`);
      await company(); await page.waitForTimeout(300);
      check(`3b ${W}×${HH}: Company, nothing sideways`, !(await side()));
      await shot(page, `main-25-company-${W}x${HH}`);
      const st = await until(() => { settingsGoPage('streams'); return document.querySelector('[data-st-pg="streams"]') ? true : null; });
      await page.waitForTimeout(400);
      check(`3c ${W}×${HH}: Contract streams, nothing sideways`, !!st && !(await side()));
      await shot(page, `main-26-streams-${W}x${HH}`);
      const dt = await until(() => { settingsGoPage('data'); return document.querySelector('[data-st-pg="data"]') ? true : null; });
      await page.waitForTimeout(400);
      check(`3d ${W}×${HH}: Data & backup, nothing sideways`, !!dt && !(await side()));
      await shot(page, `main-26-data-${W}x${HH}`);
      await page.context().close();
    }

    console.log('\n4 · the page');
    check('4 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the check ran to its end', false, e && e.stack ? e.stack.split('\n').slice(0, 3).join(' ') : String(e));
  } finally {
    await browser.close().catch(() => {});
    await h.stop();
  }
  console.log(`\n${failures ? failures + ' FAILED' : 'all passed'}`);
  process.exit(failures ? 1 : 0);
})();
