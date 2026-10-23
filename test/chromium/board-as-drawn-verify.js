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
   PASS 2 (the checker's review of 18 Oct 2026), on a book with a year of
   history whose payment days left their normal range last month:
     8 Today's insights: the head its own slim card, "N · what moved most
       since <month> · worked out this morning from your book", whole at
       every screen (never cut); the pictures their own cards, two to a row,
       each with Open · Keep · Ask why · Let it go; no Hide
     9 Value by counterparty: bars, each party's name and value, and one
       sentence under them
    10 Your book: no figure picker; today's figures in ink; a plain line with
       a dot, no shaded area
    11 the Board ends with the insights: no dashed box of words under them
    12 every figure lands on the list behind it: Live, Ending, Past and Value
       on the Contracts place narrowed to exactly what they count; Obligations
       overdue on the Obligations page's Overdue tab
   PASS 3 (the second review and the owner's answers 7 and 14, 18 Oct 2026):
     3  the Board KEEPS Jambo's work (under Your book) and draws no Needs you;
        hbOpenAgent lands on it, lit (landOn)
     5  Jambo says "What needs you is on Home: N things"; "what needs me"
        lands on Home's Needs you, lit
     8  the insights head counts the cards under it and keeps Hide (it folds
        them); each card: a headline, its picture with the axis named and the
        lit value printed on it, one sentence; no rank chip, no band
     9  Value by counterparty: five rows, value only, the first in the accent
    10  the figure picker stays on Your book
    12  each figure's door lands, lit, on what it counts
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

/* a year of history: four contracts signed each closed month, payment days
   steady at 30–32 until the last, when three are paid in 60 (the shelf's own
   stage, insights-shelf-verify); one obligation of ours is late */
const dayIn = (months, day) => { const d = new Date(); d.setDate(1); d.setMonth(d.getMonth() + months); d.setDate(day);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const DRIFT = [];
for (let m = 12; m >= 1; m--) for (let j = 0; j < 4; j++){
  const c = H.fixtureContract(`MK-P${m}-${j}`, `Supply ${m}-${j}`, ['Naivas Supermarkets', 'Kabras Sugar', 'Bidco Africa', 'Twiga Foods'][j], 'proc', 1e6 * (j + 1), 'Signed');
  c.signedAt = dayIn(-m, 10 + j); c.metadata = { ...c.metadata, paymentTerms: (m === 1 && j < 3 ? 60 : 30 + (m % 3)) + ' days' };
  DRIFT.push(c);
}
DRIFT[DRIFT.length - 1].obligations = [{ id: 'ob-late', desc: 'Deliver the quarterly report', due: dayIn(-1, 3), side: 'ours', status: 'open' }];
/* a promise of theirs gone late: Jambo's work has a chase ready (Late promises) */
DRIFT[0].obligations = [{ id: 'ob-theirs', desc: 'Send the insurance certificate', due: dayIn(-1, 5), party: 'theirs', status: 'open' }];
/* each raised on a day the trail records, so days to sign can be pictured (9–14 days, faster lately) */
DRIFT.forEach(c => { const m = Number(c.id.split('-')[1].slice(1)); const sd = new Date(c.signedAt + 'T10:00:00'); sd.setDate(sd.getDate() - (9 + Math.round((m - 1) * 5 / 11)));
  c.audit = [{ at: sd.toISOString(), action: 'Created', by: 'Seed' }]; });

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { contracts: H.FIXTURES.concat(DRIFT), approvalRules: [] });
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

    /* RE-POINTED 22 Oct 2026 (Round A, the one desk; reverses the owner's answer 14): the card under Your book
       is ALL of Needs you — Jambo's prepared pieces and your move — and the old Needs you card stays gone */
    console.log('\n3 · Needs you, whole, under Your book (Round A)');
    const gone = await page.evaluate(() => { const book = document.getElementById('hb-book'), work = document.getElementById('hm-agents'), ins = document.querySelector('#hb-board .hb-ins-head');
      return { old: !!document.querySelector('#hb-board #hb-needs, #hb-board .hb-ny'), work: !!work, nd: !!(work && work.classList.contains('nd-card')),
        order: !!(book && work && ins && (book.compareDocumentPosition(work) & Node.DOCUMENT_POSITION_FOLLOWING) && (work.compareDocumentPosition(ins) & Node.DOCUMENT_POSITION_FOLLOWING)),
        rows: work ? [...work.querySelectorAll('[data-nd-agent]')].map(r => r.getAttribute('data-nd-agent')) : [] }; });
    check('3a the old Needs you card is not drawn', !gone.old, JSON.stringify(gone));
    check('3b Needs you stands on the Board, under Your book, above Today\'s insights, Jambo\'s pieces among its rows', gone.work && gone.nd && gone.order && gone.rows.includes('late'), JSON.stringify(gone));
    await page.evaluate(() => { const b = document.getElementById('hb-board'); if (b) b.scrollTop = 0; hbOpenAgent(); });
    const lit = await until(() => { const w = document.getElementById('hm-agents'); if (!w || !w.classList.contains('is-landed')) return null;
      const r = w.getBoundingClientRect(); return { top: Math.round(r.top), inView: r.top >= 0 && r.top < innerHeight }; }, null, 8000);
    check('3c every door onto Jambo\'s work (hbOpenAgent) lands ON the card: in view and lit, through landOn', !!lit && lit.inView, JSON.stringify(lit));
    await shot(page, '17-board-jambos-work-landed-1440x780');
    await page.evaluate(() => { if (typeof landOff === 'function') landOff(); const b = document.getElementById('hb-board'); if (b) b.scrollTop = 0; });

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
    check('5d then where the owed work went: Home\'s own number, and "what needs me"',
      !!jb && new RegExp(`^What needs you is on Home: ${jb.n} things?(, Jambo’s work first)?\\.$`).test(jb.where) && JSON.stringify(jb.chip2) === JSON.stringify(['what needs me']), jb && (jb.where + ' / ' + jb.n));
    check('5e no row of chips above his box; his tab carries the Counter\'s number', !!jb && !jb.bottom && Number(jb.badge || 0) === jb.n, jb && JSON.stringify({ bottom: jb.bottom, badge: jb.badge, n: jb.n }));
    await shot(page, '17-board-as-drawn-1440x780');

    console.log('\n6 · "my saved views"');
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .hb-jb-hello [data-igsug]')].find(x => x.textContent.trim() === 'my saved views'); if (b) b.click(); });
    const said = await until(() => { const t = [...document.querySelectorAll('#igd-feed .ai-bub')].map(b => b.textContent.trim()).find(x => /^You have 1 saved view:/.test(x)); return t || null; }, null, 8000);
    check('6 asked, he lists the saved views with their counts and says where they are, free', !!said && /“Whole book” \d+\./.test(said) && /press one to open it on Explorer/.test(said) && /Free/.test(said), said);

    console.log('\n5f · "what needs me" lands on Home\'s Needs you');
    await page.evaluate(() => { if (typeof intel !== 'undefined') intel.history = []; renderIntelDock(); });
    await until(() => !!document.querySelector('#ig-dock .hb-jb-hello'), null, 6000);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#ig-dock .hb-jb-hello [data-igsug]')].find(x => x.textContent.trim() === 'what needs me'); if (b) b.click(); });
    const cn = await until(() => state.view === 'counter' && !!document.querySelector('#cn-needs.is-landed'), null, 8000);
    check('5f "what needs me" opens Home and lands on Needs you, lit (landOn)', !!cn);

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

    /* ================= PASS 2 ================= */
    await page.setViewportSize({ width: 1440, height: 780 });
    await toBoard();
    const shelf = await until(() => { const sh = document.querySelector('#hb-board .hb-shelf-cards'); const hd = document.querySelector('#hb-board .hb-ins-head');
      return sh && hd && hbS().ins && hbS().ins.list.length ? true : null; }, null, 12000);
    console.log('\n8 · Today\'s insights as drawn');
    const ins = await page.evaluate(() => { const hd = document.querySelector('#hb-board .hb-ins-head'), sh = document.querySelector('#hb-board .hb-shelf-cards');
      if (!hd || !sh) return null;
      const cards = [...sh.querySelectorAll(':scope > .hb-ins')];
      const tops = [...new Set(cards.map(c => Math.round(c.getBoundingClientRect().top)))];
      const cs = getComputedStyle(cards[0] || sh);
      return { head: hd.querySelector('.hb-ch').textContent.replace(/\s+/g, ' ').trim(), hide: !!hd.querySelector('[data-hb-ins-fold]'), headHasPics: !!hd.querySelector('.hb-ins'),
        n: cards.length, perRow: cards.filter(c => Math.round(c.getBoundingClientRect().top) === tops[0]).length, edge: cs.borderTopStyle + ' ' + cs.borderTopWidth,
        acts: cards.every(c => c.querySelector('[data-hb-ins="open"]') && c.querySelector('[data-hb-ins="keep"]') && c.querySelector('[data-hb-read-more]') && c.querySelector('[data-hb-ins="go"]')),
        month: hbThenWord(true) }; });
    check('8a the head is its own slim card: the count OF THE CARDS UNDER IT, "what moved most since <month> · worked out this morning from your book", and Hide',
      !!shelf && !!ins && new RegExp(`^Today’s insights\\s*${ins.n}\\s*what moved most since ${ins.month} · worked out this morning from your book\\s*Hide$`).test(ins.head) && ins.hide && !ins.headHasPics, JSON.stringify(ins));
    check('8b each picture its own card, two to a row, each with Open · Keep · Ask why · Let it go', !!ins && ins.n >= 2 && ins.n <= 4 && ins.perRow === 2 && ins.edge === 'solid 1px' && ins.acts, JSON.stringify(ins));
    /* 8b2 THE SYMMETRY RULE (owner, 22 Oct 2026: "These attached cards should
       be the same size"): two cards sharing a row stand the same height, their
       Open · Keep · Ask why · Let it go on one line. Red before: the row lined
       the cards up at the top, so each was only as tall as its own picture. */
    for (const [w, hh] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: hh });
      const pair = await until(() => { const cards = [...document.querySelectorAll('#hb-board .hb-shelf-cards > .hb-ins')];
        if (cards.length < 2) return null;
        const rows = new Map(); cards.forEach(c => { const t = Math.round(c.getBoundingClientRect().top); rows.set(t, (rows.get(t) || []).concat(c)); });
        return [...rows.values()].filter(r => r.length > 1).map(r => ({ h: r.map(c => Math.round(c.getBoundingClientRect().height)),
          foot: r.map(c => Math.round((c.querySelector('.hb-ins-acts') || c).getBoundingClientRect().bottom)) })); }, null, 6000);
      check(`8b2 ${w}x${hh}: cards sharing a row are the same height, their buttons on one line`, !!pair && pair.length >= 1
        && pair.every(r => Math.max(...r.h) - Math.min(...r.h) <= 1 && Math.max(...r.foot) - Math.min(...r.foot) <= 1), JSON.stringify(pair));
    }
    await page.setViewportSize({ width: 1440, height: 780 });
    await page.evaluate(() => { const b = document.querySelector('#hb-board [data-hb-ins-fold]'); if (b) b.click(); });
    const fold = await until(() => { const hd = document.querySelector('#hb-board .hb-ins-head'); return hd && hd.classList.contains('is-folded') && !document.querySelector('#hb-board .hb-shelf-cards')
      ? (hd.querySelector('[data-hb-ins-fold]') || {}).textContent : null; }, null, 6000);
    await page.evaluate(() => { const b = document.querySelector('#hb-board [data-hb-ins-fold]'); if (b) b.click(); });
    const unfold = await until(() => !!document.querySelector('#hb-board .hb-shelf-cards'), null, 6000);
    check('8a2 Hide folds the pictures, its head and count kept, and Show brings them back (the owner\'s answer 7)', fold === 'Show' && !!unfold, String(fold));
    const anat = await page.evaluate(() => [...document.querySelectorAll('#hb-board .hb-shelf-cards > .hb-ins')].map(c => {
      const pic = c.querySelector('.hb-ins-pic');
      return { id: c.getAttribute('data-hb-ins-card'), title: ((c.querySelector('.hb-ins-t') || {}).textContent || '').trim(),
        svg: !!pic.querySelector('svg.hb-ip'), xs: [...pic.querySelectorAll('.hb-ip-x')].map(e => e.textContent), vals: [...pic.querySelectorAll('.hb-ip-val')].map(e => e.textContent),
        lit: pic.querySelectorAll('.hb-ip-bar.is-lit, .hb-ip-dot').length, bars: pic.querySelectorAll('.hb-ip-br').length,
        litBar: pic.querySelector('.hb-ip-bar.is-lit') ? getComputedStyle(pic.querySelector('.hb-ip-bar.is-lit')).fillOpacity : null,
        rank: !!c.querySelector('.hb-chip'), band: !!pic.querySelector('.hb-sv-band, .hb-sv-today'), say: (c.querySelectorAll('.hb-ins-f').length === 1), why: !!c.querySelector('.hb-ins-why') }; }));
    const timed = anat.filter(x => x.svg);
    check('8d each card: a headline, its picture with the months or quarters named and the lit value printed on it, one sentence; no rank chip, no band',
      timed.length >= 1 && timed.every(x => x.title && (x.xs.length === 5 || x.xs.length === 6) && x.vals.length >= 1 && x.lit >= 1 && !x.rank && !x.band && x.say && !x.why)
      && anat.every(x => x.title && !x.rank && x.say), JSON.stringify(anat));
    check('8e days to sign is a line, its two ends said; a bar picture lights one bar in full', timed.some(x => x.id.startsWith('sign') && x.vals.length === 2) && timed.filter(x => x.litBar != null).every(x => x.litBar === '1'), JSON.stringify(timed.map(x => [x.id, x.vals, x.litBar])));

    console.log('\n9 · Value by counterparty');
    await page.evaluate(() => { const c = document.querySelector('[data-hb-ins-card="cp"]'); if (c) c.scrollIntoView({ block: 'center' }); });
    const cp = await page.evaluate(() => { const c = document.querySelector('[data-hb-ins-card="cp"]'); if (!c) return null;
      const bars = [...c.querySelectorAll('.hb-ins-pic .hb-ip-br')];
      return { bars: bars.map(b => { const i = b.querySelector('.hb-ip-bt > i'); return { name: (b.querySelector('.hb-ip-bn') || {}).textContent || '', val: (b.querySelector('.hb-ip-bv') || {}).textContent || '',
          lit: i.classList.contains('is-lit'), op: getComputedStyle(i).opacity }; }), blocks: !!c.querySelector('.hb-sv-block'), rest: /more groups/.test(c.textContent),
        say: (c.querySelector('.hb-ins-f') || {}).textContent || '', inCard: !!c.querySelector('.hb-ins-acts') && !document.querySelector('.hb-shelf-cards > .hb-ins-acts') }; });
    check('9 five rows, each party\'s name and its value only, the first lit and the rest pale, no row for the rest; one sentence under them',
      !!cp && cp.bars.length === 5 && cp.bars.every(b => b.name && /^\d[\d.,]*[KMB]?$/.test(b.val)) && cp.bars[0].lit && cp.bars[0].op === '1' && cp.bars.slice(1).every(b => !b.lit && Number(b.op) < 0.5) && !cp.rest && !cp.blocks
      && /^No party holds more than \d+% of the value: .+ holds the most\.$/.test(cp.say) && cp.inCard, JSON.stringify(cp));
    await shot(page, '17-board-insights-1440x780');

    console.log('\n10 · Your book as drawn');
    const book = await page.evaluate(() => { const b = document.getElementById('hb-book');
      const ink = getComputedStyle(b.querySelector('.hb-fig-lw .hb-fig-l') || b).color;
      return { picker: !!b.querySelector('[data-hb-figpick]'), area: !!b.querySelector('.hb-spark-a'), dot: !!b.querySelector('.hb-spark-e'),
        today: [...b.querySelectorAll('.hb-tn .hb-fig .hb-fig-n')].map(e => getComputedStyle(e).color), ink }; });
    check('10 the figure picker stays (the owner\'s answer 7); today\'s figures in ink; a plain line with a dot', book.picker && !book.area && book.dot && new Set(book.today).size === 1, JSON.stringify(book));
    if (await press('#hb-book [data-hb-figpick]', '10b the figure picker')) {
      const pk = await until(() => !!document.querySelector('#hb-book .hb-figpick[role="dialog"]'), null, 4000);
      await page.click('#hb-book [data-hb-figpick]');
      const pk2 = await until(() => !document.querySelector('#hb-book .hb-figpick[role="dialog"]'), null, 4000);
      check('10b pressed, the picker opens; pressed again, it closes', !!pk && !!pk2);
    }

    console.log('\n11 · the Board ends with its insights');
    const tail = await page.evaluate(() => ({ box: !!document.querySelector('#hb-board .hb-empty:not(.is-setup)'), words: /Each answer lands here/.test(document.getElementById('hb-board').innerText) }));
    check('11 no dashed box of words under the insights', !tail.box && !tail.words, JSON.stringify(tail));

    console.log('\n12 · where a figure\'s door lands');
    for (const k of ['live', 'ending', 'past', 'value']) {
      await toBoard();
      const want = await page.evaluate(k => { const F = hbBookData(hbS().lens || 'all').figs[k]; const b = document.querySelector(`#hb-book .hb-fig-main[data-hb-dig="f:${k}"]`);
        return { ids: F.ids.slice().sort(), off: !b || b.disabled }; }, k);
      if (want.off) { check(`12 ${k}: nothing behind it, so no door (greyed)`, !want.ids.length, JSON.stringify(want)); continue; }
      await page.click(`#hb-book .hb-fig-main[data-hb-dig="f:${k}"]`);
      const got = await until(() => { const o = typeof regState === 'function' ? regState().only : null; return o && document.getElementById('ct-place') ? o.ids.slice().sort() : null; }, null, 8000);
      const landed = await until(() => !!document.querySelector('#reg-only-chip.is-landed'), null, 6000);
      check(`12 ${k}: the Contracts place, narrowed to exactly what it counts, landed on its "N of M shown" (landOn)`, !!got && JSON.stringify(got) === JSON.stringify(want.ids) && !!landed, JSON.stringify({ got: got && got.length, want: want.ids.length, landed }));
      await shot(page, `17-board-figure-${k}-1440x780`);
      await page.evaluate(() => { regState().only = null; });
    }
    await toBoard();
    const late = await page.evaluate(() => { const b = document.querySelector('#hb-book .hb-fig-main[data-hb-dig="f:overdue"]'); return b && !b.disabled ? hbBookData('all').figs.overdue.n : 0; });
    if (late) {
      await page.click('#hb-book .hb-fig-main[data-hb-dig="f:overdue"]');
      const ob = await until(() => state.view === 'obligations' && document.querySelector('[data-obw-view="overdue"][aria-selected="true"], [data-obw-view="overdue"].on, [data-obw-view="overdue"].is-on') ? true : null, null, 8000);
      const obl = await until(() => !!document.querySelector('[data-obw-view="overdue"].is-landed'), null, 6000);
      check('12 Obligations overdue: the Obligations page, on its Overdue tab, landed on it (landOn)', !!ob && !!obl, JSON.stringify({ ob, obl }));
      await shot(page, '17-board-figure-overdue-1440x780');
    } else check('12 the stage carries a late obligation of ours, so the overdue door can be pressed', false, 'no overdue figure');

    console.log('\n8c · the insights head at the owner\'s three screens');
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await toBoard(); await page.waitForTimeout(400);
      await page.evaluate(() => { const hd = document.querySelector('#hb-board .hb-ins-head'); if (hd) hd.scrollIntoView({ block: 'start' }); });
      const fit = await page.evaluate(() => { const hd = document.querySelector('#hb-board .hb-ins-head .hb-cs'), sh = document.querySelector('#hb-board .hb-shelf-cards'), board = document.getElementById('hb-board').getBoundingClientRect();
        if (!hd || !sh) return null;
        const cut = hd.scrollWidth > hd.clientWidth + 1;
        const over = [...sh.querySelectorAll('*')].filter(e => { const q = e.getBoundingClientRect(); return q.width && q.right > board.right + 1; }).length;
        return { cut, over, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`8c ${w}×${ht}: the head's line whole (never cut), nothing past the board's edge, nothing sideways`, !!fit && !fit.cut && !fit.over && fit.side, JSON.stringify(fit));
      await shot(page, `17-board-insights-head-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
