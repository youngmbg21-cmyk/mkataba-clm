/* SETTINGS AS DRAWN (rounds 24 "One sheet", 25 "Control room" and 26 "The
   SAP way", scenes a Stream and b Data & backup; the gaps of 18 Oct 2026;
   js/views/settings.js, server /api/me/email, /api/me/copy, account_acts)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 an admin's head says "Settings · <the company>"; You · Company are
       underlined tabs (a painted line under the chosen one), Company counting
       Needs your attention; Jambo's head says "Company settings"
     2 the panel folds to the right edge and his face brings him back; "/" in
       his box opens the Menu, "‹ Jambo" goes back
     3 Contract streams: a press on Sales shows it in the side panel — its
       facts, Due now, legal hold; Delete these N asks once more, then the
       keeping run deletes them on the server (the held one stays)
     4 Data & backup: the downloads table has its Acts column, a number
     5 a member's head: "Your settings · yours alone — nobody else sees
       them" and Ask an admin; Name · Change opens IN its row and saves on the
       server; Email · Change refuses a wrong password in the row, then saves;
       Your data · Download hands over a file and the trail records it
     6 the owner's three screens: no sideways scroll, the form in its row
       inside the page's column
     7 no page errors
   At the parent (8dc306a) every check fails but Data & backup's fit at the
   three screens and no page errors (both held here as walls).
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/settings-as-drawn-verify.js */
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
  await w.admin.json('/api/keeping/sales', { method: 'PUT', body: { years: 10, then: 'delete' } });
  await w.admin.raw('/api/trail/export?from=2026-07-01&to=2026-09-30&as=csv');
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  const open = async (email, pass, W = 1440, HH = 780) => {
    const ctx = await browser.newContext({ viewport: { width: W, height: HH }, acceptDownloads: true });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', email); await page.fill('#li-pass', pass); await page.click('#li-go');
    await page.waitForFunction(() => window.state && Array.isArray(state.contracts), null, { timeout: 20000 });
    return page;
  };
  try {
    const page = await open('admin@example.co.ke', 'adminpassword1');
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): Settings is one list, Jambo's panel beside it */
    await until(() => { if (!document.querySelector('.stn-page')) { setView('team'); return null; } return document.querySelector('#ins-panel #jl-q') ? true : null; }, null, 15000);

    /* RETIRED 16 Nov 2026 (#762): 1a–1d (the head card naming the company, You · Company tabs as pills counting Needs your
       attention, the side panel's own tab beside Jambo's) and 2a–2b (the side panel folds to the right edge) — the old
       look's Settings frame; the one list has no head card, no tabs and no fold. The count the Company tab carried is
       Jambo's headline beside the list (settings-as-drawn-2 1a). */
    console.log('\n2 · "/" in his box');
    /* RE-POINTED 16 Nov 2026 (#762): his box is the panel's own box at its foot (#jl-q) */
    await page.locator('#ins-panel #jl-q').click(); await page.keyboard.type('/');
    const slash = await until(() => { const l = document.getElementById('ca-slash'); return l && l.querySelectorAll('.ca-opt').length ? l.querySelectorAll('.ca-opt').length : null; }, null, 3000);
    check('2c "/" lists the places, as in every box', !!slash && !!(await page.evaluate(() => !!document.querySelector('.stn-page #ins-panel #jl-q'))), String(slash));
    await page.keyboard.press('Backspace');
    check('2d and goes when the "/" does', !!(await until(() => !document.getElementById('ca-slash') ? true : null, null, 3000)));

    console.log('\n3 · a stream beside its list');
    await page.evaluate(() => settingsGoPage('streams'));
    await until(() => document.querySelector('.st-sw-row[data-st-sw-pick="sales"]') ? true : null, null, 10000);
    if (await press('.st-sw-row[data-st-sw-pick="sales"]', '3a the Sales row')) {
      /* A WAIT ASKS FOR THE STATE (21 Oct 2026, red on GitHub only): the panel is drawn at once and its
         keeping figures arrive after (/api/keeping) — read them once Due now is drawn, bounded */
      const side = await until(() => { const p = document.querySelector('#st-jb-feed .st-swp'); if (!p) return null;
        const facts = {}; p.querySelectorAll('.st-swp-f').forEach(f => { facts[f.querySelector('dt').textContent.trim()] = f.querySelector('dd').textContent.replace(/\s+/g, ' ').trim(); });
        if (!facts['Due now'] && !p.querySelector('[data-st-swp-run]')) return null;
        return { word: (document.getElementById('st-side-word') || { textContent: '' }).textContent.trim(), facts, due: p.querySelectorAll('.st-swp-tb tbody tr').length, held: p.querySelectorAll('.st-swp-held').length,
          del: ((p.querySelector('[data-st-swp-run]') || {}).textContent || '').trim() }; }, null, 8000);
      /* RE-POINTED 26 Oct 2026 (owner: "the name of the page next to the Jambos which looks like an additional tab. These are to be deleted."): no word beside the tabs */
      check('3a the stream\'s panel, no word beside the tabs', !!side && side.word === '', side && side.word);
      check('3b its facts: Due now 2, On legal hold 1', !!side && /^2 contracts/.test(side.facts['Due now'] || '') && /^1 · held back$/.test(side.facts['On legal hold'] || ''), JSON.stringify(side && side.facts));
      check('3c the Due now table and the held row', !!side && side.due === 2 && side.held === 1, side && (side.due + ' · ' + side.held));
      await shot(page, 'settings-as-drawn-stream-1440x780');
      if (side && side.del === 'Delete these 2' && await press('#st-jb-feed [data-st-swp-run="sales"]', '3d Delete these 2')) {
        const asked = await until(() => document.getElementById('cf-ok') ? true : null, null, 4000);
        check('3d asked once more', !!asked);
        if (asked) await page.click('#cf-ok');
        const gone = await until(async () => { try { const r = await fetch('api/keeping', { credentials: 'same-origin' }).then(x => x.json()); const s = (r.streams || {}).sales || {}; return (s.due || []).length === 0 ? { held: (s.held || []).length } : null; } catch (_) { return null; } }, null, 8000);
        const list = await w.admin.json('/api/contracts?limit=200').catch(() => null);
        const ids = ((list && list.rows) || []).map(c => c.id);
        check('3e the keeping run deleted them on the server; the held one stays', !!gone && gone.held === 1 && !ids.includes('MK-S1') && !ids.includes('MK-S2') && ids.includes('MK-S3'), JSON.stringify({ gone, has: ids.filter(i => /^MK-S/.test(i)) }));
      } else check('3d Delete these 2', false, side && side.del);
    }

    console.log('\n4 · Data & backup');
    await page.evaluate(() => stDrawerOpen('trail'));
    const past = await until(() => { const t = document.querySelector('#st-tr-past .st-tr-tb'); if (!t) return null;
      return { cols: [...t.querySelectorAll('thead th')].map(x => x.textContent.trim()), first: [...t.querySelectorAll('tbody tr:first-child td')].map(x => x.textContent.trim()) }; }, null, 8000);
    check('4a the downloads: When · Who · Period · As · Acts', !!past && past.cols.join('|') === 'When|Who|Period|As|Acts', JSON.stringify(past && past.cols));
    check('4b a download says how many acts it carried', !!past && /^\d[\d,\s  .]*$/.test(past.first[4] || '') && past.first[3] === 'CSV', JSON.stringify(past && past.first));
    await shot(page, 'settings-as-drawn-data-1440x780');

    console.log('\n5 · a member\'s own settings');
    const m = await open('everything@example.co.ke', 'their-own-pass-9');
    const mu = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await m.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await m.waitForTimeout(120); }
      return v; };
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): a member reads the one list too — their own rows,
       Ask an admin in Jambo's panel beside it; a row's Change opens its drawer (the round-24 in-row form is the old look's) */
    await mu(() => { if (!document.querySelector('.stn-page')) { setView('team'); return null; } return document.querySelector('#stn-name') ? true : null; }, null, 15000);
    const mh = await mu(() => { const p = document.getElementById('ins-panel'); if (!p || !document.querySelector('.stn-page')) return null;
      return { ask: !!p.querySelector('[data-st-ask-head]'), company: !!document.querySelector('#stn-main [data-stn-row="approvals"], #stn-main [data-stn-row="rates"]') }; });
    check('5a a member\'s own settings, no company rows, and Ask an admin', !!mh && mh.ask && !mh.company, JSON.stringify(mh));
    const pressM = async (sel, what) => { if (!(await m.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await m.locator(sel).first().click(); return true; };
    if (await pressM('#stn-name [data-st-panel="me:name"]', '5b Name · Change')) {
      const inRow = await mu(() => { const d = document.getElementById('st-drawer');
        return d && d.classList.contains('open') && document.getElementById('st-me-name') ? { drawer: true } : null; }, null, 4000);
      check('5b its Change opens the name\'s form', !!inRow, JSON.stringify(inRow));
      await m.fill('#st-me-name', 'Wanjiru Kamau');
      await pressM('#st-dsave', '5c Save');
      const saved = await mu(() => /Wanjiru Kamau/.test((document.querySelector('#stn-name') || {}).textContent || '') ? true : null, null, 6000);
      const nb = await w.unrestricted.json('/api/bootstrap');
      check('5c saved on the server, said in the row', !!saved && nb.me.name === 'Wanjiru Kamau', nb.me.name);
    }
    /* RE-POINTED 16 Nov 2026 (#762): Your email is a row on the one list; its Change opens the email drawer */
    if (await pressM('#stn-email [data-st-panel="me:email"]', '5d Email · Change')) {
      await mu(() => document.getElementById('st-me-email') ? true : null, null, 4000);
      await m.fill('#st-me-email', 'wanjiru@example.co.ke'); await m.fill('#st-me-email-pw', 'not-my-password');
      await pressM('#st-dsave', '5d Save');
      const refused = await mu(() => { const r = document.getElementById('st-drawer-refusal'); return r && !r.hidden && r.textContent.trim() ? r.textContent.trim() : null; }, null, 6000);
      check('5d a wrong password is refused in its form', !!refused, refused);
      await m.fill('#st-me-email-pw', 'their-own-pass-9');
      await pressM('#st-dsave', '5e Save');
      const ok = await mu(() => { const d = document.getElementById('st-drawer'); return !(d && d.classList.contains('open')) ? true : null; }, null, 6000);
      const eb = await w.unrestricted.json('/api/bootstrap');
      check('5e with the password: saved on the server', !!ok && eb.me.email === 'wanjiru@example.co.ke', eb.me.email);
    }
    await shot(m, 'settings-as-drawn-you-1440x780');
    if (await m.locator('[data-st-mycopy]').count()) {
      const [dl] = await Promise.all([m.waitForEvent('download', { timeout: 10000 }).catch(() => null), m.locator('[data-st-mycopy]').first().click()]);
      check('5f Your data · Download hands over one file', !!dl && /^hati-my-copy-\d{4}-\d\d-\d\d\.json$/.test(dl.suggestedFilename()), dl && dl.suggestedFilename());
      const csv = String((await w.admin.raw('/api/trail/export?from=2026-01-01&to=2099-12-31&as=csv')).text || '');
      check('5g the trail records it', /Took a copy of what they can see/.test(csv) && /Name changed/.test(csv) && /Email changed/.test(csv));
    } else check('5f Your data · Download (nothing to press)', false);

    console.log('\n6 · the owner\'s three screens');
    for (const [W, HH] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await m.setViewportSize({ width: W, height: HH });
      /* RE-POINTED 16 Nov 2026 (#762): the name's form is its drawer; it stands inside the window, the list never sideways */
      await m.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await m.locator('#stn-name [data-st-panel="me:name"]').first().click().catch(() => null);
      const fit = await mu(() => { const f = document.getElementById('st-me-name'), d = document.getElementById('st-drawer'), sc = document.getElementById('content-scroll');
        if (!f || !d || !d.classList.contains('open') || d.getAnimations({ subtree: true }).some(x => x.playState === 'running')) return null; const a = f.getBoundingClientRect(), b = d.getBoundingClientRect();
        return { a: [a.left, a.right].map(Math.round), b: [b.left, b.right].map(Math.round), w: innerWidth, inside: a.left >= b.left - 1 && a.right <= b.right + 1 && b.right <= innerWidth + 1, sideways: document.documentElement.scrollWidth > innerWidth + 1 || !!(sc && sc.scrollWidth > sc.clientWidth + 1) }; }, null, 4000);
      check(`6 ${W}×${HH}: the form inside its drawer in the window, no sideways scroll`, !!fit && fit.inside && !fit.sideways, JSON.stringify(fit));
      await m.evaluate(() => { if (typeof stDrawerClose === 'function') stDrawerClose(); });
      await page.setViewportSize({ width: W, height: HH });
      const pfit = await until(() => { const sc = document.getElementById('content-scroll'); return { sideways: document.documentElement.scrollWidth > innerWidth + 1 || !!(sc && sc.scrollWidth > sc.clientWidth + 1) }; });
      check(`6 ${W}×${HH}: Data & backup, no sideways scroll`, !!pfit && !pfit.sideways, JSON.stringify(pfit));
    }
  } catch (e) { check('the run', false, e.message); }
  finally {
    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(`\n${failures ? failures + ' FAILED' : 'ALL PASS'}`);
    process.exit(failures ? 1 : 0);
  }
})();
