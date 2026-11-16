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
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Settings is one list (.stn-page), what needs an admin
       is in Jambo's panel beside it (#ins-panel) */
    const company = () => until(() => { if (!document.getElementById('set-page') || document.querySelector('#set-page[data-st-sub]')) { try { settingsGoPage(''); } catch (_) {} setView('team'); return null; }
      return document.querySelector('.stn-page #ins-panel .jov5-title') ? true : null; }, null, 15000);
    return { until, press, company };
  };
  try {
    const page = await open('admin@example.co.ke', 'adminpassword1');
    const { until, press, company } = kit(page);
    await company();

    console.log('\n1 · Jambo counts what the list holds');
    /* RE-POINTED 16 Nov 2026 (#762): Jambo's panel beside the one list heads with the count ("N need an admin"); the
       number is the list behind it, every row drawn or the rest said */
    const said = await until(() => { const t = document.querySelector('#ins-panel .jov5-title'); if (!t) return null;
      const n = stNeedsAll().length, drawn = [...document.querySelectorAll('#ins-panel .jov5-sec')].filter(sec => /Needs an admin/i.test((sec.querySelector('.jov5-label') || {}).textContent || '')).reduce((k, sec) => k + sec.querySelectorAll('.jov5-row').length, 0);
      const more = /\d+ more/.exec(document.getElementById('ins-panel').textContent || '');
      return { n, title: t.textContent.trim(), drawn, more: more ? more[0] : '' }; });
    check('1a his headline is the list\'s count', !!said && said.n > 0 && new RegExp('^' + said.n + '\\b').test(said.title), said && `${said.title} / ${said.n}`);
    check('1b every need he counts is a row, or "N more" says the rest', !!said && (said.n <= said.drawn ? said.drawn === said.n : said.more === `${said.n - said.drawn} more`), said && `${said.more} (${said.n} − ${said.drawn})`);

    console.log('\n2 · a clash: since when, whose drawer, the limit lit, back to the role');
    /* RE-POINTED 16 Nov 2026 (#762): the clash is a row in Jambo's panel, the row itself the door to her drawer */
    const CLASH = '#ins-panel .jov5-row[data-st-panel^="person:"][data-st-focus]';
    const clash = await until(sel => { const r = document.querySelector(sel); if (!r) return null;
      const s = r.querySelector('.jov5-rt > span'); if (!s || !/since/.test(s.textContent)) return null;
      return { sub: s.textContent.trim(), t: (r.querySelector('.jov5-rt > b') || {}).textContent || '' }; }, CLASH, 10000);
    check('2a "a clash in who may do what · since <day>"', !!clash && /^a clash in who may do what · since \d{1,2} \w+/.test(clash.sub), clash && clash.sub);
    check('2b the row names her whole name and the approver\'s', !!clash && /Restricted Legal/.test(clash.t) && /Unrestricted Legal/.test(clash.t), clash && clash.t);
    if (await press(CLASH, '2c the clash\'s row')) {
      const dr = await until(() => { const say = document.querySelector('#st-dbody .st-clash-say'), cap = document.getElementById('tm-cap'), back = document.getElementById('tm-bz-back');
        if (!say || !cap || !back) return null;
        /* 19 Oct 2026: the lander lights it a beat after the drawer paints; on GitHub's
           runner the read came first — wait (bounded) for the light too */
        if (!cap.classList.contains('is-landed')) return null;
        /* re-pointed 19 Oct 2026 (LAND ON IT): lit by the one lander */
        return { lit: cap.classList.contains('is-landed'), say: say.textContent.trim(), back: back.textContent.trim(), shown: !back.hidden && back.getBoundingClientRect().width > 0,
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
    /* RETIRED 16 Nov 2026 (#762): 3a "the cards' doors (Jambo's agents · Housekeeping)" — the Company board's cards are
       the old look's; the one list has no cards */
    /* RE-POINTED 16 Nov 2026 (#762): Data & backup has no card door on the one list; it is reached by its name (the
       navigation map's own call for a Settings page, js/navmap.js) */
    if (await page.evaluate(() => { openSettingsAt('company'); settingsGoPage('data'); return true; })) {
      const dp = await until(() => { const on = document.querySelector('[data-st-pg="data"] [data-st-bk-tab].is-on'); if (!on) return null;
        return { tab: on.getAttribute('data-st-bk-tab'), head: getComputedStyle(document.getElementById('page-head')).display, tabs: !!document.querySelector('#set-page .st-facebar'),
          streams: ((document.querySelector('#st-tr-stream option[value="all"]') || {}).textContent || '').trim() }; });
      check('3b it lands on The trail, the page at its own name', !!dp && dp.tab === 'trail' && dp.head === 'none' && !dp.tabs, dp && JSON.stringify(dp));
      check('3c the Streams box says "All you can see"', !!dp && dp.streams === 'All you can see', dp && dp.streams);
      await press('[data-st-bk-tab="backup"]', '3d the Backup tab');
      const jb = await until(() => { const b = document.querySelector('#st-jb-feed [data-st-jb-hello]'); if (!b || !document.getElementById('bk-export')) return null;
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
      /* ASK FOR THE STATE (22 Oct 2026): the acts row is drawn while the keeping book is still being
         read, its Delete button only once it has been, so the wait asks for the button; on time-out
         the row as it stands reports */
      const actsNow = () => { const a = document.querySelector('#st-jb-feed .st-swp-acts'), f = document.getElementById('st-jb-feed'); if (!a || !f) return null;
        const ar = a.getBoundingClientRect(), fr = f.getBoundingClientRect(); return { inside: ar.bottom <= fr.bottom + 1 && ar.top >= fr.top - 1, del: !!a.querySelector('[data-st-swp-run]') }; };
      const acts = await until(() => document.querySelector('#st-jb-feed .st-swp-acts [data-st-swp-run]') ? true : null)
        .then(() => page.evaluate(actsNow));
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
      /* re-pointed 19 Oct 2026 (the gaps' third pass, LAND ON IT): the
         contract's Menu beside its paper, ON Release hold — where its hold
         is placed (End or pause) and released */
      /* RE-POINTED 21 Oct 2026 (the Dossier, 20 Oct): the Menu tab folded into the Dossier's All acts */
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the paper's acts are its More pop-up; Open lands
         there, on Release hold ([data-pd-acts-go="#ws-hold"]), lit, painted */
      const held = await until(() => { const r = document.querySelector('#pd-acts-pop[data-pd-acts-pop="MK-S3"] [data-pd-acts-go="#ws-hold"]') || document.querySelector('#ig-dock .pd-nx[data-pd-menu="MK-S3"] #ws-hold');
        return state.view === 'dashboard' && r && r.classList.contains('is-landed') ? r.textContent.trim() : null; }, null, 10000);
      check('4f a held contract\'s Open lands on Release hold, in its Menu', !!held, String(held));
    }

    /* RETIRED 16 Nov 2026 (#762): 5a/5b "a member's sheet: eight headings, the contents list follows the scrolling" —
       the member's sheet with its contents list is the old look's; a member now reads the one list */
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
