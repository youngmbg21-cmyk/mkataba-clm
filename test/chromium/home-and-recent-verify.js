/* HOME AND RECENT (the owner picked "Front desk", with Jambo's work first
   in line, 17 Oct 2026; and "The SAP way" with the name Home, 18 Oct 2026,
   which replaced the desk tabs; js/views/counter.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 signing in on a computer lands on Home: Jambo's box, no left menu, no
       row of tabs; the bar reads ‹ · Ha · "Home"
     2 Needs you: Jambo's work is the first row; each contract's owed item is
       a row (the Board's own reading) whose button opens its door; an admin
       has one row onto Settings; the number is the rows that owe something
     3 the box: a place opens and the bar names it; "/" lists every page and
       leaves out the words that need an open contract; anything else is
       asked of Jambo beside the page
     4 Recent: the page's name opens it — Home first, then the last six pages
       newest first, the page in front ticked; the seventh drops the oldest;
       pressed again, Esc or a press outside closes it; a row brings its page
       back; × takes one off now (the page in front goes to the one used
       last); ‹ goes back one page, grey with its reason when there is none;
       the Ha mark is Home; a refresh keeps the page and Recent
     5 the paper starts under the bar: Home draws no head row; Present is
       Recent's last row on Home's faces only; the Board's Light | Dark is on
       its first line and Explorer's Group by in the map's corner
     6 the phone keeps its own screens: no Home, no bar buttons
     7 it fits the owner's three screens, Recent included, and in Svenska
       Home is Hem
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   AT THE PARENT (the desk tabs) 1c, 1d, 3b, 3c, 4a–4j, 5a–5e, 6 and 7's
   Recent fail: there is no page name in the bar and no Recent.
   Run: node test/chromium/home-and-recent-verify.js */
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
const CONTRACTS = [
  H.fixtureContract('MK-CN1', 'Raw milk supply', 'Nandi Dairy', H.FOLDER_A, 12e6, 'Signed'),
  H.fixtureContract('MK-CN2', 'Cold chain logistics', 'Siginon Group', H.FOLDER_A, 8e6, 'Under Review'),
  H.fixtureContract('MK-CN3', 'Office lease', 'Britam Properties', H.FOLDER_B, 4e6, 'Signed'),
  H.fixtureContract('MK-CN4', 'Packaging services', 'Nampak Kenya', H.FOLDER_B, 3e6, 'Draft'),
];

(async () => {
  const h = await H.startHati();
  await H.seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const press = async (sel, what) => { if (!(await page.locator(sel).count())) { check(what + ' (nothing to press: ' + sel + ')', false); return false; } await page.locator(sel).first().click(); return true; };
    const ask = async word => { await page.fill('#cn-q', word); await page.press('#cn-q', 'Enter'); };
    const toCounter = async () => { await page.evaluate(() => setView('counter')); return until(() => !!document.getElementById('cn-q')); };
    const menuOpen = () => page.evaluate(() => { const m = document.getElementById('dk-recent'); return !!m && !m.hidden && m.getBoundingClientRect().height > 0; });
    const openRecent = async () => { if (await menuOpen()) return true; if (!(await press('#dk-page', 'the page\'s name'))) return false; return !!await until(() => { const m = document.getElementById('dk-recent'); return m && !m.hidden && m.querySelector('.dk-r'); }); };
    const noRow = () => page.evaluate(() => !document.getElementById('dk-row') && !document.getElementById('dk-home') && !document.querySelector('.dk-tab, .dk-tabs'));
    const kept = () => page.evaluate(() => { try { const all = JSON.parse(localStorage.getItem(DK_KEY) || '{}'); return (all[String(currentUser().id)] || []).map(t => t.k); } catch (_) { return []; } });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 4, null, { timeout: 20000 });

    console.log('\n1 · signing in lands on Home');
    const land = await until(() => state.view === 'counter' && document.getElementById('cn-q') && ({
      menu: getComputedStyle(document.getElementById('side-nav')).display,
      mark: !document.getElementById('dk-mark').hidden && document.getElementById('dk-mark').getBoundingClientRect().width > 0,
      markTip: document.getElementById('dk-mark').title,
      order: ['dk-back', 'dk-mark', 'dk-page'].map(id => { const e = document.getElementById(id); return e ? Math.round(e.getBoundingClientRect().left) : -1; }),
      name: (document.getElementById('dk-page') || {}).textContent, titleShown: document.getElementById('shell-title').getBoundingClientRect().width > 0,
      greet: (document.querySelector('.cn-ask h1') || {}).textContent || '' }), null, 15000);
    check('1a the first screen is Home, with Jambo\'s box', !!land, JSON.stringify(land));
    check('1b the left menu is not drawn', !!land && land.menu === 'none', land && land.menu);
    check('1c the bar reads ‹ · Ha · the page\'s name, and the page is Home', !!land && land.mark && land.markTip === 'Home' && land.order.every((x, i, a) => x >= 0 && (i === 0 || x > a[i - 1]))
      && String(land.name).trim() === 'Home' && !land.titleShown, land && JSON.stringify({ order: land.order, name: land.name, tip: land.markTip, title: land.titleShown }));
    check('1d no row of tabs anywhere', await noRow());
    check('1e the box greets the person by name', !!land && /^What do you need, \S+\?$/.test(land.greet), land && land.greet);
    await shot(page, 'home-1440x780');

    console.log('\n2 · Needs you');
    const needs = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#cn-needs .cn-r')];
      const L = hbNeedsList();
      return { first: rows[0] ? rows[0].classList.contains('cn-jw') : false, jwText: rows[0] ? rows[0].innerText.replace(/\s+/g, ' ') : '',
        cnt: Number((document.querySelector('#cn-needs .cn-cnt') || {}).textContent), needRows: document.querySelectorAll('#cn-needs [data-cn-need]').length,
        book: L.length, ready: hbAgentsData(null).ready, co: document.querySelectorAll('#cn-needs [data-cn-co]').length, company: stNeedsAll().length, rowsMax: CN_ROWS,
        owed: L.map(x => x.c.id + ':' + x.it.kind) };
    });
    check('2a Jambo\'s work is the first row', needs.first, needs.jwText);
    check('2b every owed item of the book is a row', needs.book > 0 && needs.needRows === Math.min(needs.book, needs.rowsMax), JSON.stringify(needs.owed));
    check('2c the admin has one row onto Settings', needs.company > 0 ? needs.co === 1 : needs.co === 0, `${needs.company} things in Settings`);
    check('2d the number is the rows that owe something', needs.cnt === (needs.ready ? 1 : 0) + needs.book + (needs.company ? 1 : 0), JSON.stringify(needs));
    if (await press('#cn-needs [data-cn-need="details"]', '2e a details row')) {
      const fill = await until(() => state.view === 'dashboard' && !!document.getElementById('pd-fillface') && pdContract() && pdContract().id);
      check('2e a details row opens Fill in beside its paper', !!fill, String(fill));
      await toCounter();
    }
    if (await press('#cn-needs [data-cn-co]', '2f the company row')) {
      const st = await until(() => state.view === 'team' && typeof settingsTab === 'function' && settingsTab() === 'company');
      check('2f the company row opens Settings on the company\'s list', !!st);
      await toCounter();
    }

    console.log('\n3 · the box');
    await ask('contracts');
    const place = await until(() => state.view === 'dashboard' && hbFace() === 'paper' && !pdContract() && !!document.getElementById('ct-place'));
    check('3a "contracts" opens the Contracts place', !!place);
    const t1 = await until(() => { const b = document.getElementById('dk-page'); return b && b.textContent.trim() === 'Contracts' && b.textContent.trim(); });
    check('3b the bar names it', t1 === 'Contracts', t1);
    await toCounter(); await ask('approvals');
    const ap = await until(() => { if (state.view !== 'approvals') return null; const b = document.getElementById('dk-page'), bar = document.getElementById('top-header').getBoundingClientRect(),
      first = [...document.querySelectorAll('#page-head, #content > *')].find(e => e.getBoundingClientRect().height > 0);
      return b.textContent.trim() === 'Approvals & signing' && first ? { name: b.textContent.trim(), gap: Math.round(first.getBoundingClientRect().top - bar.bottom) } : null; });
    check('3c "approvals" opens its page, named in the bar, nothing between the bar and the page', !!ap && ap.gap <= 1 && await noRow(), JSON.stringify(ap));
    await toCounter();
    await page.locator('#cn-q').click(); await page.keyboard.press('/');
    const slash = await until(() => { const w = [...document.querySelectorAll('#cn-pop [data-cn-pop] b')].map(b => b.textContent); return w.length ? w : null; });
    const want = ['/approvals', '/parties', '/people', '/requests', '/our-paper', '/settings', '/negotiations', '/my-notes', '/import', '/insights'];
    check('3d "/" lists every page the menu held', !!slash && want.every(w => slash.includes(w)), slash && slash.join(' '));
    check('3e and leaves out the words that need an open contract', !!slash && !['/redline', '/sign', '/share', '/fill-in'].some(w => slash.includes(w)));
    await page.keyboard.press('Escape');
    check('3f Esc closes the list', await page.evaluate(() => document.getElementById('cn-pop').hidden));
    await ask('which contracts end this year');
    const q = await until(() => state.view === 'dashboard' && hbFace() === 'board' && /which contracts end this year/.test((document.getElementById('ig-dock') || {}).innerText || ''));
    check('3g a question is asked of Jambo beside the Board', !!q);

    console.log('\n4 · Recent');
    await toCounter();
    const order = ['contracts', 'approvals', 'obligations', 'parties', 'people', 'requests', 'my notes', 'our paper'];
    for (const w of order) { await ask(w); await page.waitForTimeout(450); await toCounter(); }
    await ask('board'); await until(() => state.view === 'dashboard' && hbFace() === 'board'); await page.waitForTimeout(450);
    const all = await kept();
    check('4a Recent keeps the last six pages: the seventh dropped the oldest', all.length === 6 && all.includes('home:board') && all.includes('v:templates')
      && !all.includes('home:contracts') && !all.includes('v:approvals') && !all.includes('v:obligations'), all.join(' '));
    const open = await openRecent();
    const m = open && await page.evaluate(() => { const r = [...document.querySelectorAll('#dk-recent .dk-r')];
      return { home: r[0] && r[0].querySelector('[data-dk-counter]') ? r[0].textContent.replace(/\s+/g, ' ').trim() : null,
        keys: [...document.querySelectorAll('#dk-recent [data-dk-go]')].map(x => x.getAttribute('data-dk-go')),
        on: (document.querySelector('#dk-recent .dk-r.is-on [data-dk-go]') || { getAttribute: () => '' }).getAttribute('data-dk-go'),
        tick: !!document.querySelector('#dk-recent .dk-r.is-on .dk-r-tick svg'), xs: document.querySelectorAll('#dk-recent [data-dk-x]').length,
        head: (document.querySelector('#dk-recent .dk-r-h') || {}).textContent, present: !!document.querySelector('#dk-recent [data-dk-present]') }; });
    check('4b the page\'s name opens Recent: Home first, then the pages, newest first', !!m && /^Home/.test(m.home || '') && m.keys[0] === 'home:board'
      && JSON.stringify(m.keys.slice(1)) === JSON.stringify(['v:templates', 'v:mynotes', 'v:intake', 'v:directory', 'v:customers']) && m.head === 'Recent · your last 6 pages', JSON.stringify(m));
    check('4c the page in front is ticked, and every page has its ×', !!m && m.on === 'home:board' && m.tick && m.xs === m.keys.length, m && `${m.on} · ${m.xs} ×`);
    await press('#dk-page', '4d the name again');
    check('4d pressed again, it closes', !await menuOpen());
    await openRecent(); await page.keyboard.press('Escape');
    check('4e Esc closes it', !await menuOpen() && await page.evaluate(() => document.activeElement && document.activeElement.id === 'dk-page'));
    await openRecent(); await page.mouse.click(700, 400);
    check('4f a press outside closes it', !!await until(() => { const m = document.getElementById('dk-recent'); return m && m.hidden; }));
    await openRecent();
    if (await press('#dk-recent [data-dk-go="v:directory"]', '4g a row')) {
      check('4g a row brings its page back, named in the bar, Recent closed', !!await until(() => deskKeyNow() === 'v:directory' && document.getElementById('dk-recent').hidden
        && document.getElementById('dk-page').textContent.trim() === deskTabLabel('v:directory')));
    }
    await page.waitForTimeout(450);
    await openRecent();
    if (await press('#dk-recent [data-dk-x="v:intake"]', '4h × on another row')) {
      const after = await until(() => deskKeyNow() === 'v:directory' && !document.querySelector('#dk-recent [data-dk-x="v:intake"]') && !document.getElementById('dk-recent').hidden, null, 4000);
      check('4h × takes another page off now; the page stays and so does Recent', !!after && !(await kept()).includes('v:intake'), (await kept()).join(' '));
    }
    const lastUsed = await page.evaluate(() => { const all = JSON.parse(localStorage.getItem(DK_KEY) || '{}')[String(currentUser().id)] || [];
      return all.filter(t => t.k !== deskKeyNow()).sort((a, b) => b.at - a.at)[0].k; });
    if (await press('#dk-recent [data-dk-x="v:directory"]', '4i × on the page in front')) {
      const moved = await until(k => deskKeyNow() !== k && deskKeyNow(), 'v:directory', 6000);
      check('4i × on the page in front goes to the page used last', moved === lastUsed, `${moved} (wanted ${lastUsed})`);
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(450);
    /* ‹ walks this sitting's pages */
    await page.evaluate(() => setView('approvals')); await until(() => state.view === 'approvals'); await page.waitForTimeout(450);
    await page.evaluate(() => setView('obligations')); await until(() => state.view === 'obligations'); await page.waitForTimeout(450);
    if (await press('#dk-back', '4j ‹')) {
      const b1 = await until(() => state.view === 'approvals' && deskKeyNow());
      await page.waitForTimeout(450); await press('#dk-back', '4j ‹ again');
      const b2 = await until(k => deskKeyNow() !== k && deskKeyNow(), 'v:approvals');
      check('4j ‹ goes back one page, then the one before', b1 === 'v:approvals' && !!b2 && b2 !== 'v:obligations', `${b1} then ${b2}`);
    }
    await page.waitForTimeout(450);
    const before = await kept(), viewBefore = await page.evaluate(() => deskKeyNow());
    await page.reload({ waitUntil: 'networkidle' });
    const back = await until(() => window.state && state.contracts && state.contracts.length === 4 && deskKeyNow(), null, 15000);
    await page.waitForTimeout(500);
    check('4k a refresh keeps the page and Recent', back === viewBefore && JSON.stringify((await kept()).slice().sort()) === JSON.stringify(before.slice().sort()), `${back} · ${(await kept()).length} pages`);
    const grey = await page.evaluate(() => { const b = document.getElementById('dk-back'); return b ? { off: b.disabled, tip: b.title } : { off: false, tip: 'no ‹ in the bar' }; });
    check('4l with nothing to go back to in this sitting, ‹ is grey and says why', grey.off && grey.tip === 'Nothing to go back to yet', JSON.stringify(grey));
    if (await press('#dk-mark', '4m the Ha mark')) check('4m the Ha mark goes Home', !!await until(() => state.view === 'counter' && !!document.getElementById('cn-q')));
    check('4n and ‹ is there to come back', await page.evaluate(() => { const b = document.getElementById('dk-back'); return !!b && !b.disabled; }));

    console.log('\n5 · the paper starts under the bar');
    await page.evaluate(() => pdOpenOnHome('MK-CN2', 'copilot'));
    const pap = await until(() => {
      const hd = document.getElementById('hb-head'), bar = document.getElementById('top-header').getBoundingClientRect();
      if (!hd || !pdContract() || document.getElementById('dk-page').textContent.trim() !== 'Siginon Group · MK-CN2') return null;
      const line = document.elementFromPoint(300, Math.round(bar.bottom) + 6);
      return { headShown: hd.getBoundingClientRect().height > 0, line: line ? (line.closest('#ig-page') ? 'page' : line.tagName) : null, lineText: line ? (line.closest('[class]') || line).textContent.slice(0, 80) : '' };
    }, null, 10000);
    check('5a on the paper Home draws no head row: the paper\'s own line is right under the bar', !!pap && !pap.headShown && pap.line === 'page' && /MK-CN2/.test(pap.lineText), JSON.stringify(pap));
    await shot(page, 'paper-1440x780');
    await openRecent();
    if (await press('#dk-recent [data-dk-present]', '5b Present this page')) {
      check('5b Present this page is Recent\'s last row on Home, and presses Present', !!await until(() => document.getElementById('dk-recent').hidden && !!document.querySelector('.hb-presenting')));
      await page.evaluate(() => hbPresent(false));
      /* leaving full screen is asynchronous: until it has, #content covers the bar */
      await until(() => !document.fullscreenElement && !document.querySelector('.hb-presenting'), null, 5000);
    }
    await page.evaluate(() => setView('approvals')); await until(() => state.view === 'approvals'); await openRecent();
    check('5c and not on a page that has nothing to present', await page.evaluate(() => !document.querySelector('#dk-recent [data-dk-present]')));
    await page.keyboard.press('Escape');
    await page.evaluate(() => deskTabOpen('home:board')); await until(() => state.view === 'dashboard' && hbFace() === 'board' && document.querySelector('#hb-board .hb-note'));
    const scr = await page.evaluate(() => { const n = document.querySelector('#hb-board .hb-note .hb-scr'); return { onLine: !!n, inHead: !!document.querySelector('#hb-head .hb-scr'),
      shown: !!n && n.getBoundingClientRect().height > 0 }; });
    if (scr.onLine) await page.locator('#hb-board .hb-note [data-hb-screen="dark"]').click();
    const dark = await until(() => hbS().screen === 'dark' && document.querySelector('#hb-board .hb-note [data-hb-screen="dark"]').getAttribute('aria-pressed') === 'true');
    check('5d the Board\'s Light | Dark stands on its own first line, and works', scr.onLine && scr.shown && !scr.inHead && !!dark, JSON.stringify(scr));
    await page.locator('#hb-board .hb-note [data-hb-screen="light"]').click().catch(() => {});
    await page.evaluate(() => hbOpenExplorer());
    /* RE-POINTED 19 Oct 2026 (owner: the corner's Group by was redundant): Group by
       is the head line's own dropdown, in the map's top-left corner; the corner box is gone */
    const gb = await until(() => { const s = document.getElementById('ig-group'), g = document.getElementById('ig-gwrap'); if (!s || !g || hbFace() !== 'explorer') return null;
      const a = s.getBoundingClientRect(), b = g.getBoundingClientRect();
      return { shown: a.height > 0, inLine: !!s.closest('#ig-note'), inMap: a.top >= b.top && a.left >= b.left && a.top - b.top < 40 && a.left - b.left < 160,
        corner: !!document.getElementById('hb-groupby'), one: document.querySelectorAll('#ig-group').length, head: document.getElementById('hb-head').getBoundingClientRect().height }; });
    check('5e Explorer\'s Group by is the head line\'s own dropdown in the map\'s top-left corner; no corner box, no head row', !!gb && gb.shown && gb.inLine && gb.inMap && !gb.corner && gb.one === 1 && gb.head === 0, JSON.stringify(gb));
    await shot(page, 'explorer-1440x780');

    console.log('\n6 · the phone keeps its own screens');
    const phone = await (await browser.newContext({ viewport: { width: 400, height: 800 }, hasTouch: true, isMobile: true })).newPage();
    phone.on('pageerror', e => errors.push('phone: ' + e.message));
    await phone.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await phone.locator('#li-email').count()) { await phone.fill('#li-email', 'admin@example.co.ke'); await phone.fill('#li-pass', 'adminpassword1'); await phone.click('#li-go'); }
    await phone.waitForFunction(() => window.state && state.contracts && state.contracts.length === 4, null, { timeout: 20000 });
    await phone.waitForTimeout(1200);
    const ph = await phone.evaluate(() => ({ view: state.view, shell: deskShellOn(), bar: ['dk-back', 'dk-mark', 'dk-pg-w'].filter(id => { const e = document.getElementById(id); return e && e.getBoundingClientRect().width > 0; }), side: document.documentElement.scrollWidth - innerWidth }));
    check('6 no Home and no bar buttons on the phone', ph.view !== 'counter' && !ph.shell && !ph.bar.length && ph.side <= 0, JSON.stringify(ph));
    await phone.close();

    console.log('\n7 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await toCounter(); await page.waitForTimeout(200);
      const fit = await page.evaluate(() => {
        const box = document.querySelector('#cn-page .jb-card') /* RE-POINTED 20 Oct 2026: Home's box is the two-row card */.getBoundingClientRect(), card = document.getElementById('cn-needs').getBoundingClientRect();
        const btns = [...document.querySelectorAll('#cn-needs .cn-r .ui-btn')];
        const cut = btns.filter(b => { const r = document.createRange(); r.selectNodeContents(b); return r.getBoundingClientRect().width > b.getBoundingClientRect().width + 1; }).length;
        return { boxIn: box.top >= 0 && box.bottom <= innerHeight, needsTop: Math.round(card.top), needsIn: card.top < innerHeight, cut, side: document.documentElement.scrollWidth - innerWidth };
      });
      await shot(page, `home-${vp.width}x${vp.height}`);
      check(`7 ${vp.width}×${vp.height}: the box and Needs you are in view, nothing cut, no sideways scroll`, fit.boxIn && fit.needsIn && fit.cut === 0 && fit.side <= 0, JSON.stringify(fit));
      await page.evaluate(() => pdOpenOnHome('MK-CN2', 'copilot')); await until(() => { const b = document.getElementById('dk-page'); return pdContract() && (!b || b.textContent.trim() !== 'Home'); });
      await openRecent();
      const rf = await page.evaluate(() => { const mm = document.getElementById('dk-recent'), b = document.getElementById('dk-page'), w = b && b.querySelector('.dk-page-w');
        if (!mm || mm.hidden || !w) return { inView: false, nameWhole: false, side: 0, missing: 'no Recent under a page name in the bar' };
        const m = mm.getBoundingClientRect();
        return { inView: m.top >= 0 && m.bottom <= innerHeight && m.left >= 0 && m.right <= innerWidth, nameWhole: w.scrollWidth <= w.clientWidth + 1, side: document.documentElement.scrollWidth - innerWidth }; });
      await shot(page, `recent-${vp.width}x${vp.height}`);
      check(`7 ${vp.width}×${vp.height}: Recent opens in view, the page's name whole, no sideways scroll`, rf.inView && rf.nameWhole && rf.side <= 0, JSON.stringify(rf));
      await page.keyboard.press('Escape');
    }
    await page.evaluate(() => langSet('sv'));
    await toCounter();
    const sv = await until(() => { const b = document.getElementById('dk-page'), mk = document.getElementById('dk-mark'); return b && mk && b.textContent.trim() === 'Hem' && mk.title === 'Hem' && 'Hem'; });
    check('7 in Svenska, Home is Hem', sv === 'Hem', String(sv));
    await page.evaluate(() => langSet('en'));
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
