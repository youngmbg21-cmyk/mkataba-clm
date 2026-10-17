/* THE COUNTER AND THE DESK TABS (the owner picked "Front desk", with Jambo's
   work first in line, and "Desk tabs", 17 Oct 2026; js/views/counter.js)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 signing in on a computer lands on the Counter: Jambo's box, no left
       menu, the Ha mark in the bar as the way back, the workspace's name
     2 Needs you: Jambo's work is the first row; each contract's owed item is
       a row (the Board's own reading) whose button opens its door; an admin
       has one row onto Settings; the number is the rows that owe something
     3 the box: a place opens on the desk as a tab; "/" lists every page and
       leaves out the words that need an open contract; anything else is
       asked of Jambo beside the page
     4 the tabs: a tab brings its page back, × puts one away (the page in
       front goes to the tab used last), "‹ The counter" goes home, past six
       the rest wait behind "+N more" (pressed again it closes), and a
       refresh keeps the tabs and the page
     5 the paper does not move down: on Home the tabs take the greeting's
       and faces' row, one line, no taller than the row's own controls
     6 the phone keeps its own screens: no Counter, no tabs
     7 it fits the owner's three screens
   Waits ask for the state, bounded; a press on a part that may not exist
   reports instead of waiting out the clock.
   Run: node test/chromium/counter-and-desk-tabs-verify.js */
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
    const tabs = () => page.evaluate(() => [...document.querySelectorAll('.dk-tabs [data-dk-x]')].map(x => x.getAttribute('data-dk-x')));
    const current = () => page.evaluate(() => { const t = document.querySelector('.dk-tab.is-on [data-dk-go]'); return t ? t.getAttribute('data-dk-go') : null; });
    const kept = () => page.evaluate(() => { try { const all = JSON.parse(localStorage.getItem(DK_KEY) || '{}'); return (all[String(currentUser().id)] || []).map(t => t.k); } catch (_) { return []; } });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length === 4, null, { timeout: 20000 });

    console.log('\n1 · signing in lands on the Counter');
    const land = await until(() => state.view === 'counter' && document.getElementById('cn-q') && ({
      menu: getComputedStyle(document.getElementById('side-nav')).display,
      mark: !document.getElementById('dk-mark').hidden && document.getElementById('dk-mark').getBoundingClientRect().width > 0,
      title: document.getElementById('shell-title').textContent.trim(), org: String(window.FIRST_PARTY || ''),
      greet: (document.querySelector('.cn-ask h1') || {}).textContent || '' }), null, 15000);
    check('1a the first screen is the Counter, with Jambo\'s box', !!land, JSON.stringify(land));
    check('1b the left menu is not drawn', !!land && land.menu === 'none', land && land.menu);
    check('1c the Ha mark is in the bar, the way back to the Counter', !!land && land.mark);
    check('1d the bar names the workspace', !!land && !!land.org && land.title === land.org, land && land.title);
    check('1e the box greets the person by name', !!land && /^What do you need, \S+\?$/.test(land.greet), land && land.greet);
    await shot(page, 'counter-1440x780');

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
    const t1 = await until(() => { const t = document.querySelector('#dk-home .dk-tab.is-on [data-dk-go]'); return t && t.getAttribute('data-dk-go'); });
    check('3b it is the tab in front, in Home\'s head row', t1 === 'home:contracts', t1);
    await toCounter(); await ask('approvals');
    const ap = await until(() => state.view === 'approvals' && !document.getElementById('dk-row').hidden && document.querySelector('#dk-row .dk-tab.is-on [data-dk-go]')
      && document.querySelector('#dk-row .dk-tab.is-on [data-dk-go]').getAttribute('data-dk-go'));
    check('3c "approvals" opens its page, the tabs drawn above it', ap === 'v:approvals', ap);
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

    console.log('\n4 · the tabs');
    await toCounter();
    for (const w of ['contracts', 'approvals', 'obligations', 'parties', 'people', 'requests', 'my notes', 'our paper']) {
      await ask(w); await page.waitForTimeout(450); await toCounter();
    }
    await ask('board'); await until(() => state.view === 'dashboard' && hbFace() === 'board'); await page.waitForTimeout(450);
    const all = await kept();
    check('4a every page opened is kept as a tab', ['home:contracts', 'v:approvals', 'v:obligations', 'v:customers', 'v:directory', 'v:intake', 'v:mynotes', 'v:templates', 'home:board'].every(k => all.includes(k)), all.join(' '));
    const sight = await tabs();
    check('4b six in sight with the page in front, the rest behind "+N more"', sight.length <= 7 && await page.locator('#dk-home [data-dk-more]').count() === 1
      && (await page.locator('#dk-home [data-dk-more]').textContent()).trim() === `+${all.length - sight.length} more`, `${sight.length} in sight of ${all.length}`);
    await press('#dk-home [data-dk-more]', '4c "+N more"');
    const menu = await until(() => document.querySelectorAll('#dk-home .dk-menu [data-dk-go]').length);
    check('4c "+N more" opens the rest', menu === all.length - sight.length, String(menu));
    await press('#dk-home [data-dk-more]', '4d "+N more" again');
    check('4d pressed again, it closes', await until(() => !document.querySelector('#dk-home .dk-menu')));
    /* a page tab in sight (not a face of Home) */
    const pick = (await tabs()).find(k => /^v:/.test(k));
    if (pick && await press(`#dk-home [data-dk-go="${pick}"]`, '4e a page tab')) {
      check('4e a tab brings its page back', !!await until(k => deskKeyNow() === k && !document.getElementById('dk-row').hidden
        && (document.querySelector('#dk-row .dk-tab.is-on [data-dk-go]') || { getAttribute: () => '' }).getAttribute('data-dk-go') === k, pick), pick);
    } else check('4e a page tab in sight', false, (await tabs()).join(' '));
    await page.waitForTimeout(450);
    const notFront = (await tabs()).find(k => k !== pick);
    if (notFront && await press(`#dk-row [data-dk-x="${notFront}"]`, '4f × on another tab')) {
      const after = await until(([nf, k]) => deskKeyNow() === k && ![...document.querySelectorAll('[data-dk-x]')].some(x => x.getAttribute('data-dk-x') === nf), [notFront, pick], 4000);
      check('4f × puts another tab away and the page stays', !!after && !(await kept()).includes(notFront), notFront);
    }
    const lastUsed = await page.evaluate(() => { const all = JSON.parse(localStorage.getItem(DK_KEY) || '{}')[String(currentUser().id)] || [];
      return all.filter(t => t.k !== deskKeyNow()).sort((a, b) => b.at - a.at)[0].k; });
    if (await press(`#dk-row [data-dk-x="${pick}"]`, '4g × on the tab in front')) {
      const moved = await until(k => deskKeyNow() !== k && deskKeyNow(), pick, 6000);
      check('4g × on the tab in front goes to the tab used last', moved === lastUsed, `${moved} (wanted ${lastUsed})`);
    }
    await page.waitForTimeout(450);
    const before = await kept(), viewBefore = await page.evaluate(() => deskKeyNow());
    await page.reload({ waitUntil: 'networkidle' });
    const back = await until(() => window.state && state.contracts && state.contracts.length === 4 && deskKeyNow(), null, 15000);
    check('4h a refresh keeps the page and the tabs', back === viewBefore && JSON.stringify(await kept()) === JSON.stringify(before), `${back} · ${(await kept()).length} tabs`);
    if (await press('[data-dk-counter]', '4i "‹ The counter"')) check('4i "‹ The counter" goes back to the Counter', !!await until(() => state.view === 'counter' && !!document.getElementById('cn-q')));

    console.log('\n5 · the paper does not move down');
    await page.evaluate(() => pdOpenOnHome('MK-CN2', 'copilot'));
    const head = await until(() => {
      const hd = document.getElementById('hb-head'), tb = [...document.querySelectorAll('#dk-home .dk-tab, #dk-home .dk-back')], pr = document.getElementById('hb-present');
      if (!hd || !tb.length || !pr || !pdContract()) return null;
      const tops = new Set(tb.map(t => Math.round(t.getBoundingClientRect().top)));
      return { oneLine: tops.size === 1, tallest: Math.max(...tb.map(t => Math.round(t.getBoundingClientRect().height))),
        button: Math.round(pr.getBoundingClientRect().height), head: Math.round(hd.getBoundingClientRect().height),
        faces: !!document.querySelector('#hb-head .hb-faces'), hello: !!document.querySelector('#hb-head .hb-hello') };
    }, null, 10000);
    check('5a on Home the tabs take the greeting\'s and the faces\' place', !!head && !head.faces && !head.hello, JSON.stringify(head));
    check('5b one line, no taller than the row\'s own buttons', !!head && head.oneLine && head.tallest <= head.button, JSON.stringify(head));
    await shot(page, 'desk-tabs-paper-1440x780');

    console.log('\n6 · the phone keeps its own screens');
    const phone = await (await browser.newContext({ viewport: { width: 400, height: 800 }, hasTouch: true, isMobile: true })).newPage();
    phone.on('pageerror', e => errors.push('phone: ' + e.message));
    await phone.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await phone.locator('#li-email').count()) { await phone.fill('#li-email', 'admin@example.co.ke'); await phone.fill('#li-pass', 'adminpassword1'); await phone.click('#li-go'); }
    await phone.waitForFunction(() => window.state && state.contracts && state.contracts.length === 4, null, { timeout: 20000 });
    await phone.waitForTimeout(1200);
    const ph = await phone.evaluate(() => ({ view: state.view, shell: deskShellOn(), rowShown: !document.getElementById('dk-row').hidden, side: document.documentElement.scrollWidth - innerWidth }));
    check('6 no Counter and no tabs on the phone', ph.view !== 'counter' && !ph.shell && !ph.rowShown && ph.side <= 0, JSON.stringify(ph));
    await phone.close();

    console.log('\n7 · the owner\'s three screens');
    for (const vp of [{ width: 1440, height: 780 }, { width: 1536, height: 730 }, { width: 1366, height: 950 }]) {
      await page.setViewportSize(vp);
      await toCounter(); await page.waitForTimeout(200);
      const fit = await page.evaluate(() => {
        const box = document.querySelector('.cn-box').getBoundingClientRect(), card = document.getElementById('cn-needs').getBoundingClientRect();
        const btns = [...document.querySelectorAll('#cn-needs .cn-r .ui-btn')];
        const cut = btns.filter(b => { const r = document.createRange(); r.selectNodeContents(b); return r.getBoundingClientRect().width > b.getBoundingClientRect().width + 1; }).length;
        return { boxIn: box.top >= 0 && box.bottom <= innerHeight, needsTop: Math.round(card.top), needsIn: card.top < innerHeight, cut, side: document.documentElement.scrollWidth - innerWidth };
      });
      await shot(page, `counter-${vp.width}x${vp.height}`);
      check(`7 ${vp.width}×${vp.height}: the box and Needs you are in view, nothing cut, no sideways scroll`, fit.boxIn && fit.needsIn && fit.cut === 0 && fit.side <= 0, JSON.stringify(fit));
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
