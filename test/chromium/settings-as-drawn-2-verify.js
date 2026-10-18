/* SETTINGS AS DRAWN, THE SECOND PASS (rounds 24, 25 and 26; the checker's
   differences against the owner's picked drawings, built 18 Oct 2026;
   js/views/settings.js, server POST /api/clashes/seen)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 Company: Jambo's first words count what the list holds — the same
       number as Needs your attention's tag and the Company tab — and "N more"
       is the rows the list holds and does not draw
     2 a clash in who may do what: "· since <day>" (the day the server kept),
       "Open <the whole name>"; her drawer lights the limit that clashes, says
       the clash and its two ways forward, and "Back to <name>'s role" beside
       Save puts the role's limit back without writing anything
     3 the cards' doors as drawn: Jambo's agents is his house; Housekeeping's
       Data & backup lands on The trail; on Backup, Jambo still says the
       trail's count
     4 Contract streams starts at its own name — no Settings head, no tabs —
       the note right after the count, no dots, HaTi's dropdown clothes; the
       stream's acts stay in reach in the side panel; + New stream opens its
       own form; a held contract's Open lands on its Details
     5 a member's sheet: eight headings, and the contents list follows the
       scrolling
     6 the owner's three screens: no sideways scroll on Company, Contract
       streams and Data & backup; the stream panel's acts inside the panel
     7 no page errors
   At the parent (8dc306a) every check fails but 7 (no page errors) and the
   no-sideways-scroll half of 6 (walls, held here).
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/settings-as-drawn-2-verify.js */
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
  const old = (id, name, cp, extra) => ({ ...H.fixtureContract(id, name, cp, 'sales', 1200000, 'Signed'), ...extra });
  const w = await H.seedWorkspace(h, { approvalRules: [], contracts: H.FIXTURES.concat([
    old('MK-S1', 'Distribution agreement', 'Skane Retail Ltd', { expiry: '2015-03-31' }),
    old('MK-S2', 'Agency agreement', 'Norrland Trade Ltd', { expiry: '2015-06-30' }),
    old('MK-S3', 'Settlement agreement', 'Vastkust Retail Ltd', { expiry: '2014-11-30', hold: { at: '2026-09-02T09:00:00.000Z', by: 'Amina Otieno', why: 'A dispute' } }),
  ]) });
  await w.admin.json('/api/keeping/sales', { method: 'PUT', body: { years: 10, then: 'delete' } }).catch(() => null);
  const boot = await w.admin.json('/api/bootstrap');
  const adminId = boot.me.id, R = w.users.restricted.id, U = w.users.unrestricted.id, N = w.users.novalues.id;
  /* a clash: Restricted may sign up to 10 M, the approver Unrestricted only 5 M; her role gives 5 M */
  await w.admin.json('/api/settings', { method: 'PUT', body: { ...(boot.settings || {}), signCap: { on: true } } });
  await w.admin.json('/api/users/' + R, { method: 'PATCH', body: { signCap: 10000000, overseerOn: 'always', overseerId: U, overseerBackupId: adminId } });
  await w.admin.json('/api/users/' + U, { method: 'PATCH', body: { signCap: 5000000 } });
  await w.admin.json('/api/users/' + N, { method: 'PATCH', body: { signCap: 2000000 } });
  await w.admin.json('/api/business-roles', { method: 'PUT', body: { roles: [{ id: 'salesrole', name: 'Sales', sys: 'legal', cap: 5000000 }] } }).catch(() => null);
  await w.admin.json('/api/business-roles/holder', { method: 'PUT', body: { userId: R, roleId: 'salesrole' } }).catch(() => null);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass, W = 1440, HH = 780) => {
    const ctx = await browser.newContext({ viewport: { width: W, height: HH } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    return page;
  };
  const kit = page => {
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const company = () => until(() => { if (!document.getElementById('set-page')) { setView('team'); return null; } if (window._stPageNow !== undefined) return null;
      if (settingsTab() !== 'company' || document.querySelector('#set-page[data-st-sub]')) { settingsGoTab('company'); try { settingsGoPage(''); } catch (_) {} return null; }
      return document.querySelector('#st-board .st-cards') ? true : null; }, null, 15000);
    return { until, press, company };
  };
  try {
    const page = await open('admin@example.co.ke', 'adminpassword1');
    const { until, press, company } = kit(page);
    await company();

    console.log('\n1 · Jambo counts what the list holds');
    const said = await until(() => { const b = document.querySelector('#st-jb-feed [data-st-jb-hello] .st-jb-bub'), tag = document.querySelector('#st-att .st-needs-n');
      const tab = document.querySelector('#set-page .st-face[data-st-tab="company"] .st-face-n'); if (!b || !tag) return null;
      const words = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
      const n = Number(tag.textContent), drawn = document.querySelectorAll('#st-att .st-need[data-st-need]').length, more = document.querySelector('#st-att .st-need-more');
      return { n, tab: tab && tab.textContent.trim(), hello: b.textContent, first: (b.textContent.split(' ')[0]), want: words[n] || String(n), drawn, more: more ? more.textContent.trim() : '' }; });
    check('1a his first word is the list\'s count', !!said && said.first === said.want && said.tab === String(said.n), said && `${said.first} / tag ${said.n} / tab ${said.tab}`);
    check('1b "N more" is the rows the list holds and does not draw', !!said && (said.n <= said.drawn ? !said.more : said.more === `${said.n - said.drawn} more`), said && `${said.more} (${said.n} − ${said.drawn})`);

    console.log('\n2 · a clash: since when, whose drawer, the limit lit, back to the role');
    const clash = await until(() => { const r = document.querySelector('#st-att .st-need[data-st-need^="clash:cap:"]'); if (!r) return null;
      const s = r.querySelector('.st-need-s'); if (!s || !/since/.test(s.textContent)) return null;
      return { sub: s.textContent.trim(), go: r.querySelector('.st-need-go').textContent.trim(), chip: (document.querySelector('#st-jb-feed .st-jb-chip') || {}).textContent }; }, null, 10000);
    check('2a "a clash in who may do what · since <day>"', !!clash && /^a clash in who may do what · since \d{1,2} \w+/.test(clash.sub), clash && clash.sub);
    check('2b "Open <the whole name>", and his first chip says it', !!clash && clash.go === 'Open Restricted Legal' && clash.chip === 'open Restricted Legal', clash && `${clash.go} · ${clash.chip}`);
    if (await press('#st-att .st-need[data-st-need^="clash:cap:"] .st-need-go', '2c the clash\'s button')) {
      const dr = await until(() => { const say = document.querySelector('#st-dbody .st-clash-say'), cap = document.getElementById('tm-cap'), back = document.getElementById('tm-bz-back');
        if (!say || !cap || !back) return null;
        return { lit: cap.classList.contains('st-lit'), say: say.textContent.trim(), back: back.textContent.trim(), shown: !back.hidden && back.getBoundingClientRect().width > 0,
          order: [...document.querySelectorAll('#st-dfoot .st-dfoot-acts > button')].map(b => b.id || (b.hasAttribute('data-st-dclose') ? 'cancel' : '?')) }; });
      check('2c the limit that clashes is lit', !!dr && dr.lit);
      check('2d the clash and its two ways forward, said under the limit', !!dr && /^A clash: Restricted may sign more than the person who approves first, Unrestricted Legal\. Lower the limit to the role’s KES 5M, or name an approver who signs up to KES 10M\.$/.test(dr.say), dr && dr.say);
      check('2e "Back to Restricted’s role" beside Save, Cancel last', !!dr && dr.shown && dr.back === 'Back to Restricted’s role' && dr.order.join() === 'st-dsave,tm-bz-back,cancel', dr && `${dr.back} · ${dr.order}`);
      const writes = [];
      page.on('request', r => { if (r.method() !== 'GET' && /\/api\/users\//.test(r.url())) writes.push(r.url()); });
      await press('#tm-bz-back', '2f Back to the role');
      const after = await until(() => { const c = document.getElementById('tm-cap'), b = document.getElementById('tm-bz-back'); return c && c.value === '5000000' ? { hidden: !b || b.hidden } : null; });
      check('2f the role\'s limit is back in the drawer, nothing written', !!after && after.hidden && !writes.length, JSON.stringify(after) + ' writes ' + writes.length);
      await shot(page, '25-clash-drawer-1440x780');
      await press('#st-dfoot [data-st-dclose]', 'close the drawer');
      await until(() => !document.querySelector('#st-drawer.open'));
    }

    console.log('\n3 · the cards\' doors; Data & backup on The trail; Jambo counts on Backup');
    const doors = await until(() => { const c = document.querySelector('[data-st-card="copilot"] .st-door'), h2 = [...document.querySelectorAll('[data-st-card="house"] .st-door')];
      return c && h2.length ? { agents: c.getAttribute('data-st-view') + ' ' + c.textContent.trim(), house: h2.map(d => d.textContent.trim().replace(/ ›$/, '')).join(' | ') } : null; });
    check('3a Jambo\'s agents is his house; Housekeeping: The trail · Data & backup · Monthly report', !!doors && doors.agents === 'jambo Jambo’s agents ›' && doors.house === 'The trail | Data & backup | Monthly report', doors && JSON.stringify(doors));
    if (await press('[data-st-card="house"] .st-door[data-st-page="data"]', '3b Data & backup ›')) {
      const dp = await until(() => { const on = document.querySelector('[data-st-pg="data"] [data-st-bk-tab].is-on'); if (!on) return null;
        return { tab: on.getAttribute('data-st-bk-tab'), head: getComputedStyle(document.getElementById('page-head')).display, tabs: !!document.querySelector('#set-page .st-facebar'),
          streams: ((document.querySelector('#st-tr-stream option[value="all"]') || {}).textContent || '').trim() }; });
      check('3b it lands on The trail, the page at its own name', !!dp && dp.tab === 'trail' && dp.head === 'none' && !dp.tabs, dp && JSON.stringify(dp));
      check('3c the Streams box says "All you can see"', !!dp && dp.streams === 'All you can see', dp && dp.streams);
      await press('[data-st-bk-tab="backup"]', '3d the Backup tab');
      const jb = await until(() => { const b = document.querySelector('#st-jb-feed [data-st-jb-hello] .st-jb-bub'); if (!b || !document.getElementById('bk-export')) return null;
        return /^The trail for /.test(b.textContent) && !/counting/.test(b.textContent) ? b.textContent : null; }, null, 8000);
      check('3d on Backup, Jambo says the trail\'s count', !!jb, jb || 'still counting, or nothing said');
    }

    console.log('\n4 · Contract streams as drawn');
    await page.evaluate(() => settingsGoPage('streams'));
    const sw = await until(() => { const ht = document.querySelector('.st-sw-card .st-card-ht'); if (!ht || !document.querySelector('.st-sw-row')) return null;
      const n = ht.querySelector('#st-sw-n'), note = ht.querySelector('.st-card-sub-l'), sel = document.querySelector('[data-st-sw-f]');
      return { head: getComputedStyle(document.getElementById('page-head')).display, tabs: !!document.querySelector('#set-page .st-facebar'),
        gap: n && note ? Math.round(note.getBoundingClientRect().left - n.getBoundingClientRect().right) : null, dots: document.querySelectorAll('.st-sw-row .st-fdot').length,
        face: sel ? getComputedStyle(sel).appearance : '', name: ((document.querySelector('#set-page .st-pg-t') || {}).textContent || '').trim(), top: Math.round(document.querySelector('#set-page .st-pg').getBoundingClientRect().top) }; });
    check('4a the page starts at its own name: no Settings head, no tabs', !!sw && sw.head === 'none' && !sw.tabs && /^Contract streams/.test(sw.name), sw && JSON.stringify({ head: sw.head, tabs: sw.tabs, name: sw.name, top: sw.top }));
    check('4b the note right after the count; no dot before a name', !!sw && sw.gap != null && sw.gap >= 0 && sw.gap < 24 && sw.dots === 0, sw && `gap ${sw.gap} · dots ${sw.dots}`);
    check('4c the closed filter boxes wear HaTi\'s clothes', !!sw && sw.face === 'none', sw && sw.face);
    if (await press('.st-sw-row[data-st-sw-pick="sales"]', '4d Sales')) {
      const acts = await until(() => { const a = document.querySelector('#st-jb-feed .st-swp-acts'), f = document.getElementById('st-jb-feed'); if (!a || !f) return null;
        const ar = a.getBoundingClientRect(), fr = f.getBoundingClientRect(); return { inside: ar.bottom <= fr.bottom + 1 && ar.top >= fr.top - 1, del: !!a.querySelector('[data-st-swp-run]') }; });
      check('4d the stream\'s acts in reach inside the panel', !!acts && acts.inside && acts.del, acts && JSON.stringify(acts));
      await shot(page, '26-streams-sales-1440x780');
    }
    if (await press('.st-pg-head [data-st-panel="stream:new"]', '4e + New stream')) {
      await until(() => document.getElementById('st-stream-name'));
      await page.fill('#st-stream-name', 'Legal Ops');
      await press('#st-dsave', '4e Save');
      const made = await until(() => { const t = document.querySelector('#st-drawer .st-dtitle, #st-drawer h2'); const ps = document.querySelector('#st-ps[data-st-ps]');
        return ps && t && /Legal Ops/.test(t.textContent) ? { fid: ps.getAttribute('data-st-ps'), back: (document.querySelector('#st-drawer .st-dback') || {}).textContent } : null; });
      check('4e + New stream: its own form, then the new stream\'s page; back says Contract streams', !!made && /Contract streams/.test(made.back || ''), made && JSON.stringify(made));
      await press('#st-drawer .st-dback', 'back'); await until(() => !document.querySelector('#st-drawer.open'));
    }
    await until(() => { if (!document.querySelector('#st-jb-feed [data-st-swp-open]')) { const r = document.querySelector('.st-sw-row[data-st-sw-pick="sales"]'); if (r && !r.classList.contains('is-picked')) r.click(); return null; } return true; });
    if (await press('#st-jb-feed [data-st-swp-open]', '4f the held contract\'s Open')) {
      const held = await until(() => { const s = (typeof hbS === 'function') && (hbS().strips || [])[0];
        return state.view === 'dashboard' && s && s.id === 'MK-S3' ? s.page : null; }, null, 10000);
      check('4f a held contract\'s Open lands on its Details', held === 'details', String(held));
    }

    console.log('\n5 · a member\'s sheet');
    const mem = await open('everything@example.co.ke', 'their-own-pass-9');
    const mk = kit(mem);
    const toc = await mk.until(() => { if (!document.getElementById('set-page')) { setView('team'); return null; }
      const t = [...document.querySelectorAll('#set-page [data-st-toc]')]; return t.length ? t.map(b => b.textContent.trim()) : null; }, null, 15000);
    check('5a eight headings, as drawn', !!toc && toc.length === 8 && !toc.includes('Company design'), toc && toc.join(' | '));
    const lit = await mk.until(async () => { const sc = document.getElementById('content-scroll'); sc.scrollTop = Math.round(sc.scrollHeight / 2);
      await new Promise(r => setTimeout(r, 250)); const a = document.querySelector('#set-page [data-st-toc][aria-current="true"]'); return a ? a.textContent.trim() : null; });
    check('5b the contents list follows the scrolling', !!lit && lit !== (toc || [])[0], lit);

    console.log('\n6 · the owner\'s three screens');
    for (const [W, HH] of [[1440, 780], [1536, 730], [1366, 950]]) {
      const p = await open('admin@example.co.ke', 'adminpassword1', W, HH); const k = kit(p);
      await k.company();
      const side = async () => p.evaluate(() => { const sc = document.getElementById('content-scroll'); return document.documentElement.scrollWidth > innerWidth + 1 || (sc && sc.scrollWidth > sc.clientWidth + 1); });
      const c1 = await side();
      await p.evaluate(() => settingsGoPage('streams'));
      await k.until(() => document.querySelector('.st-sw-row[data-st-sw-pick="sales"]'));
      await p.locator('.st-sw-row[data-st-sw-pick="sales"]').first().click();
      const fit = await k.until(() => { const a = document.querySelector('#st-jb-feed .st-swp-acts'), f = document.getElementById('st-jb-feed'); if (!a || !f) return null;
        const ar = a.getBoundingClientRect(), fr = f.getBoundingClientRect(); return { inside: ar.bottom <= fr.bottom + 1 && ar.bottom <= innerHeight }; });
      const c2 = await side();
      await p.evaluate(() => settingsGoPage('data'));
      await k.until(() => document.querySelector('[data-st-pg="data"]'));
      const c3 = await side();
      check(`6 ${W}×${HH}: no sideways scroll on Company, Contract streams, Data & backup`, !c1 && !c2 && !c3, `${c1} ${c2} ${c3}`);
      check(`6 ${W}×${HH}: the stream's acts inside its panel`, !!fit && fit.inside, fit && JSON.stringify(fit));
      await p.context().close();
    }
  } catch (e) { check('the run itself', false, e.stack); }
  finally {
    console.log('\n7 · no page errors');
    check('7 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${failures ? failures + ' FAILED' : 'ALL PASS'}`);
    process.exit(failures ? 1 : 0);
  }
})();
