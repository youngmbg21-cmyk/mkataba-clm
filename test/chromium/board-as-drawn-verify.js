/* THE BOARD AS DRAWN (round 17 of the redesign, "Then and now", the owner's
   "build all the gaps", 18 Oct 2026; js/views/homeboard.js hbBoardHeadHtml,
   hbSavedViewChipsHtml, hbBookHtml, hbValueSay, hbBoardHelloHtml)

   WHAT THIS PINS, driven in a real browser on a seeded workspace
     1 the Board's head is one card: "Board", "your book against six months
       ago", Live · counted <time>, and Summarise my board with its cost on
       the button ("1 Jambo call")
     2 the saved views are chips in the head, each with how many contracts it
       shows (the map's own reading); a press opens it on Explorer
     3 Needs you and Jambo's work are not on the Board (they live on the
       Counter)
     4 Your book is one card: its head says "each figure opens the list
       behind it", the value says what it counts ("in KES"), and the card
       draws its own edge
     5 Jambo's panel on the Board: "Board" beside his tab, his greeting says
       the book counted at the head's own time, three questions as chips under
       it, then "What needs you is on the Counter: N things" with N the
       Counter's own number and "what needs me", which opens the Counter; no
       row of chips stands above his box; his tab carries the same number
     6 "my saved views" asked of him lists them with their counts, free
     7 the owner's three screens: the head and the book in view, nothing
       sideways, nothing past the panel's edge
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/board-as-drawn-verify.js */
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
  await H.seedWorkspace(h, { approvalRules: [] });
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
    /* one saved view of the map, as Explorer's "save this view" keeps it */
    await page.evaluate(() => { localStorage.setItem('hati.v1.igViews', JSON.stringify([{ name: 'Whole book', recipe: { lenses: [], groupBy: 'folder', rv: 2 }, at: '2026-10-01' }])); });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const toBoard = async () => { await page.evaluate(() => { if (state.view === 'dashboard') hbSetFace('board'); else { hbS().face = 'board'; hbSave(); setView('dashboard'); } });
      return until(() => hbFace() === 'board' && !!document.querySelector('#hb-book .hb-tn .hb-fig') && !!document.querySelector('#ig-dock #igd-feed'), null, 12000); };
    await toBoard();

    console.log('\n1 · the head');
    const hd = await until(() => { const el = document.getElementById('hb-bhead'); if (!el) return null;
      const b = el.querySelector('.hb-bs-go');
      return { title: (el.querySelector('h2.hb-bh-t') || {}).textContent || '', sub: (el.querySelector('.hb-bh-s') || {}).textContent || '',
        live: !!el.querySelector('.hb-live'), at: (el.querySelector('.hb-bh-at') || {}).textContent || '',
        cost: b ? ((b.querySelector('.hb-bs-cost') || {}).textContent || '') : null, keyed: typeof copilotAvailable === 'function' && copilotAvailable(),
        note: !!el.querySelector('.hb-note'), first: document.getElementById('hb-board').firstElementChild === el }; }, null, 8000);
    check('1a the head says Board, what it is, and that it is live and when it was counted', !!hd && hd.title === 'Board' && hd.sub === 'your book against six months ago' && hd.live && /^· counted \d{1,2}[:.]\d{2}/.test(hd.at) && hd.first, JSON.stringify(hd));
    check('1b Summarise my board says its cost on the button where Jambo can be asked', !!hd && (hd.keyed ? hd.cost === '1 Jambo call' : hd.cost === ''), JSON.stringify(hd && { keyed: hd.keyed, cost: hd.cost }));

    console.log('\n2 · saved views as chips');
    const sv = await page.evaluate(() => { const L = [...document.querySelectorAll('#hb-bhead .hb-sv-chip')];
      return { label: (document.querySelector('#hb-bhead .hb-bh-l') || {}).textContent || '', chips: L.map(b => ({ name: (b.querySelector('.hb-sv-n') || {}).textContent || '', n: (b.querySelector('b') || {}).textContent || '' })),
        want: (typeof igRecipeShown === 'function' && igViewsRead().length) ? igRecipeShown(igViewsRead()[0].recipe) : null, menu: !!document.querySelector('[data-hb-tools-more="views|board"]') }; });
    check('2a "Saved views" and one chip per view, its count the map\'s own', sv.label === 'Saved views' && sv.chips.length === 1 && sv.chips[0].name === 'Whole book' && Number(sv.chips[0].n) === sv.want && !sv.menu, JSON.stringify(sv));
    if (await press('#hb-bhead .hb-sv-chip', '2b the chip')) {
      const ex = await until(() => typeof hbFace === 'function' && hbFace() === 'explorer', null, 8000);
      check('2b a press opens the view on Explorer', !!ex);
      await toBoard();
    }

    console.log('\n3 · the owed work is not on the Board');
    const gone = await page.evaluate(() => ({ needs: !!document.querySelector('#hb-board #hb-needs, #hb-board .hb-ny'), work: !!document.querySelector('#hb-board #hm-agents, #hb-board .hb-prep') }));
    check('3 no Needs you card and no Jambo\'s work card on the Board', !gone.needs && !gone.work, JSON.stringify(gone));

    console.log('\n4 · Your book is one card');
    const bk = await page.evaluate(() => { const card = document.getElementById('hb-book'); const cs = getComputedStyle(card);
      return { sub: (card.querySelector('.hb-ch .hb-cs') || {}).textContent || '', value: (card.querySelector('[data-hb-fig="value"] .hb-fig-left') || {}).textContent || '',
        edge: cs.borderTopStyle + ' ' + cs.borderTopWidth, bg: cs.backgroundColor, bars: !!card.querySelector('.hb-stagerows') }; });
    check('4a its head says every figure is a door', /· each figure opens the list behind it$/.test(bk.sub), bk.sub);
    check('4b the value says what it counts', /^in KES\b/.test(bk.value), bk.value);
    check('4c the book is one card with its own edge, the stage bars inside it', bk.edge === 'solid 1px' && bk.bg !== 'rgba(0, 0, 0, 0)' && bk.bars, JSON.stringify(bk));

    console.log('\n5 · Jambo on the Board');
    const jb = await until(() => { const dock = document.getElementById('ig-dock'); if (!dock) return null;
      const bubs = [...dock.querySelectorAll('#igd-feed .hb-jb-hello')]; if (bubs.length < 2) return null;
      return { word: (dock.querySelector('.igd-head-w') || {}).textContent || '', hello: bubs[0].querySelector('.ai-bub').textContent.trim(),
        chips: [...bubs[0].querySelectorAll('[data-igsug]')].map(b => b.textContent.trim()), where: bubs[1].querySelector('.ai-bub').textContent.trim(),
        chip2: [...bubs[1].querySelectorAll('[data-igsug]')].map(b => b.textContent.trim()), n: counterNeedsCount(),
        at: (document.querySelector('#hb-bhead .hb-bh-at') || {}).textContent || '', bottom: !!dock.querySelector('[data-ig-chips]'),
        badge: (dock.querySelector('[data-pd-tab="copilot"] .pd-tab-n') || {}).textContent || '', ending: hbBookData('all').figs.ending.n }; }, null, 10000);
    check('5a "Board" beside his tab', !!jb && jb.word === 'Board', jb && jb.word);
    check('5b his greeting says the book, counted at the head\'s own time, and the one press that spends',
      !!jb && jb.hello.startsWith('Here is your book, counted at ') && jb.at.includes(jb.hello.slice(30, 35)) && /Summarise my board is the one press here that uses a Jambo call, and it says so first\.$/.test(jb.hello), jb && (jb.hello + ' | ' + jb.at));
    check('5c three questions as chips under it — "which N end in 90 days?" only while any do',
      !!jb && JSON.stringify(jb.chips) === JSON.stringify([jb.ending ? `which ${jb.ending} end in 90 days?` : null, 'value by stream', 'my saved views'].filter(Boolean)), jb && JSON.stringify(jb.chips));
    check('5d then where the owed work went: the Counter\'s own number, and "what needs me"',
      !!jb && new RegExp(`^What needs you is on the Counter: ${jb.n} things?(, Jambo’s work first)?\\.$`).test(jb.where) && JSON.stringify(jb.chip2) === JSON.stringify(['what needs me']), jb && (jb.where + ' / ' + jb.n));
    check('5e no row of chips above his box; his tab carries the Counter\'s number', !!jb && !jb.bottom && Number(jb.badge || 0) === jb.n, jb && JSON.stringify({ bottom: jb.bottom, badge: jb.badge, n: jb.n }));
    await shot(page, '17-board-as-drawn-1440x780');

    console.log('\n6 · "my saved views"');
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .hb-jb-hello [data-igsug]')].find(x => x.textContent.trim() === 'my saved views'); if (b) b.click(); });
    const said = await until(() => { const t = [...document.querySelectorAll('#igd-feed .ai-bub')].map(b => b.textContent.trim()).find(x => /^You have 1 saved view:/.test(x)); return t || null; }, null, 8000);
    check('6 asked, he lists the saved views with their counts and says where they are, free', !!said && /“Whole book” \d+\./.test(said) && /press one to open it on Explorer/.test(said) && /Free/.test(said), said);

    console.log('\n5f · "what needs me" opens the Counter');
    await page.evaluate(() => { if (typeof intel !== 'undefined') intel.history = []; renderIntelDock(); });
    await until(() => !!document.querySelector('#ig-dock .hb-jb-hello'), null, 6000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .hb-jb-hello [data-igsug]')].find(x => x.textContent.trim() === 'what needs me'); if (b) b.click(); });
    const cn = await until(() => state.view === 'counter' && !!document.getElementById('cn-needs'), null, 8000);
    check('5f "what needs me" opens the Counter, where Needs you lives', !!cn);

    console.log('\n7 · the owner\'s three screens');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await toBoard(); await page.waitForTimeout(500);
      await page.evaluate(() => { const b = document.getElementById('hb-board'); if (b) b.scrollTop = 0; });
      const fit = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const head = r('#hb-bhead'), tbl = r('#hb-book .hb-tn'), dock = r('#ig-dock'), board = r('#hb-board');
        const over = [...document.querySelectorAll('#hb-bhead *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > board.right + 1; }).length;
        const wide = [...document.querySelectorAll('#ig-dock #igd-feed *')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > dock.right + 1; }).length;
        return { head: !!head && head.top >= 0 && head.bottom <= innerHeight, table: !!tbl && tbl.top < innerHeight, over, wide, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`7 ${w}×${ht}: the head and the book in view, nothing past an edge, nothing sideways`, fit.head && fit.table && !fit.over && !fit.wide && fit.side, JSON.stringify(fit));
      await shot(page, `17-board-as-drawn-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
