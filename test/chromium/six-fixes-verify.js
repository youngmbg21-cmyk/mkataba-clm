/* Chromium verification of the owner's six fixes of 26 Aug 2026.
   ============================================================================
   FIVE OF THE SIX ARE CLAIMS A NODE TEST CANNOT MAKE, which is why they are
   here: a computed font size, a painted symbol, a card's measured height, and
   what is on screen after a real browser reload. jsdom resolves no cascade, has
   no layout engine, builds no shadow tree for <use>, and does not reload.

   L-3 is NOT in this file. Its claim — one press of Edit opens the clause panel
   on the clause the card names — belongs beside the seat comparison it is
   about, and is asserted for BOTH seats in parity-verify.

   WHAT IS MEASURED, and why each one:
     1  the ⋯ menu: one size, no bold, no wrap, a symbol on every row
     2  the narrowed-column band is gone, and the control says it instead
     3  Home: both card rows one height, and no reserved hole inside a card
     4  a refresh leaves you on the page you were on
     5  a nav press with Edit with Copilot open really changes the page

   Screenshots go to test/chromium/shots/six-fixes/. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'six-fixes');
/* THE LADDER, NOT ONE MACHINE'S PATH: an override, then the sandbox's copy IF
   IT EXISTS, then whatever playwright installed. f227 exists to keep every
   harness in this directory runnable on a laptop that has never heard of
   /opt/pw-browsers, and it caught this file on its first run. */
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BOOK = [];
for (let i = 1; i <= 12; i++)
  BOOK.push(fixtureContract('MK-S' + i, 'Contract number ' + i, 'Counterparty ' + i,
    i % 2 ? 'sales' : 'ops', 1000000 * i,
    i % 3 === 0 ? 'Signed' : (i % 3 === 1 ? 'Draft' : 'Under Review')));

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);

    /* ============================================================
       3 · HOME — ONE HEIGHT, AND NO RESERVED HOLE
       ============================================================ */
    await page.evaluate(() => setView('dashboard'));
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '01-home.png') });

    const cards = await page.evaluate(() => {
      const out = [];
      for (const grid of document.querySelectorAll('.hm-tiles')){
        const kind = grid.classList.contains('is-port') ? 'port' : 'work';
        for (const t of grid.querySelectorAll('.hm-tile')){
          const box = t.getBoundingClientRect();
          const R = el => el ? el.getBoundingClientRect() : null;
          /* THE GAPS BETWEEN THE REGIONS, measured as painted pixels. A card
             "looks empty" when one of these opens up, so the claim is about
             the gaps and not about the height. */
          const head = R(t.querySelector('.hm-head'));
          const fig = R(t.querySelector('.hm-big') || t.querySelector('.hm-life'));
          const foot = R(t.querySelector('.hm-foot'));
          out.push({ kind, title: (t.querySelector('.hm-t') || {}).textContent || '',
            h: Math.round(box.height),
            gapHeadToFig: head && fig ? Math.round(fig.top - head.bottom) : null,
            gapFigToFoot: fig && foot ? Math.round(foot.top - fig.bottom) : null,
            spacer: !!t.querySelector('.hm-sp'),
            footReserve: foot ? Math.round(foot.height) : null });
        }
      }
      return out;
    });
    const heights = [...new Set(cards.map(c => c.h))];
    check('3a every card on Home is the same height, top row and bottom',
      heights.length === 1 && cards.length === 8,
      `${cards.length} cards, heights: ${heights.join(', ')}`);
    check('3b the spacer that became the hole is gone from every card',
      cards.every(c => !c.spacer), `spacer found on ${cards.filter(c => c.spacer).length}`);
    /* THE NUMBER IS NOT THE POINT — the RELATION is: no gap between two
       regions may be bigger than the card's own padding, or it reads as a
       band rather than as air. Written this way it costs nothing at the next
       spacing pass. */
    /* WHAT "LOOKS EMPTY" MEANS, as a relation rather than a number: no gap
       between two regions may be as tall as a line of the card's own text. A
       gap smaller than a line reads as air; one bigger than a line reads as a
       missing line — which is exactly what the 25px band was. Written this way
       it costs nothing at the next spacing or type pass. */
    const lineH = await page.evaluate(() => {
      const f = document.querySelector('.hm-foot');
      return Math.round(parseFloat(getComputedStyle(f).lineHeight) || 16);
    });
    const worst = cards.reduce((m, c) =>
      Math.max(m, c.gapHeadToFig || 0, c.gapFigToFoot || 0), 0);
    check('3c no gap inside a card is as tall as a line of its own text',
      worst < lineH, `worst gap ${worst}px against a ${lineH}px line`);
    const feet = [...new Set(cards.map(c => c.footReserve))];
    check('3d and no footer holds empty lines open — they measure alike',
      feet.length === 1, `footer heights: ${feet.join(', ')}`);

    /* ============================================================
       4 · A REFRESH LEAVES YOU WHERE YOU WERE
       ------------------------------------------------------------
       THE TABLE THE WORK ORDER ASKED FOR. Every page, because "it goes home"
       was true of all of them and a check on one would have passed on a fix
       that reached one.
       ============================================================ */
    const PAGES = ['register', 'templates', 'playbook', 'intel', 'calendar', 'reports',
      'migration', 'team', 'directory', 'intake', 'redline', 'workspace'];
    const lost = [];
    for (const v of PAGES){
      await page.evaluate(async v => {
        if (v === 'workspace' || v === 'redline'){
          const c = state.contracts[0];
          state.activeId = c.id;
          if (v === 'workspace') await ensureFull(c);
        }
        setView(v);
      }, v);
      await pause(400);
      await page.reload({ waitUntil: 'networkidle' });
      await pause(2000);
      const after = await page.evaluate(() => state.view);
      if (after !== v) lost.push(`${v}→${after}`);
    }
    check('4a a refresh returns you to the page you were on, on every page',
      lost.length === 0, lost.length ? lost.join(' · ') : `${PAGES.length} pages, none lost`);
    /* THE CAUSE, pinned so the shadow cannot come back through another door:
       what setView stores has to be readable by the pair that reads it. */
    const stored = await page.evaluate(() => {
      setView('calendar');
      return { raw: localStorage.getItem(LS.ui), parsed: lsGet(LS.ui) };
    });
    check('4b and what it stores is readable, not the text "[object Object]"',
      stored.parsed && stored.parsed.view === 'calendar',
      `raw: ${String(stored.raw).slice(0, 40)}`);

    /* ============================================================
       1 · THE ⋯ MENU ON A TRACKED CHANGE
       ============================================================ */
    const staged = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status !== 'Signed' && x.status !== 'Declined');
      await ensureFull(c);
      negoInit(c);
      const cl = negoClauseList(c);
      for (let i = 0; i < 2 && i < cl.length; i++)
        await negoEditClause(c, cl[i].clauseId,
          cl[i].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(+String(m).replace(/,/g, '') + 90)),
          { author: 'Amina Otieno', side: 'owner', why: 'volumes' });
      persist(c); await flushSaves();
      return c.id;
    });
    await page.evaluate(id => openRedlineWorkbench(id), staged);
    await pause(2200);
    await page.evaluate(() => { const b = document.querySelector('[data-rl-more]'); if (b) b.click(); });
    await pause(400);
    await page.screenshot({ path: path.join(OUT, '02-more-menu.png') });

    const menu = await page.evaluate(() => {
      const m = document.querySelector('.rl-more-menu:not([hidden])');
      if (!m) return { error: 'no open menu' };
      const face = document.querySelector('.rl-card-d .rl-card-verbs button');
      const fs_ = face ? getComputedStyle(face) : null;
      const rows = [...m.querySelectorAll('button')].map(b => {
        const s = getComputedStyle(b);
        const r = b.getBoundingClientRect();
        /* HOW MANY LINES THE TEXT REALLY TOOK. The button's own height carries
           its padding, so height/line-height reports two lines for every
           comfortably-padded single line — measured, it called all four rows
           wrapped on a menu where none was. The padding comes off first. */
        const lh = parseFloat(s.lineHeight) || 16;
        const inner = r.height - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
        const icon = b.querySelector('svg.rl-more-i');
        /* getBBox is non-zero only if the <use> really resolved — an empty
           box is what a dead sprite reference paints. */
        let painted = false;
        try { const bb = icon && icon.getBBox(); painted = !!(bb && bb.width > 0 && bb.height > 0); }
        catch (_) { painted = false; }
        return { text: b.textContent.replace(/\s+/g, ' ').trim(),
          size: s.fontSize, weight: s.fontWeight, wrap: s.whiteSpace,
          lines: Math.max(1, Math.round(inner / lh)), hasIcon: !!icon, painted };
      });
      return { rows, faceSize: fs_ ? fs_.fontSize : null,
        visible: m.getBoundingClientRect().width > 0 };
    });
    if (menu.error){
      check('1 the ⋯ menu opens', false, menu.error);
    } else {
      check('1a the menu really opened as pixels', menu.visible && menu.rows.length > 0,
        `${menu.rows.length} rows`);
      check('1b every row is the same size as Edit and Send on the card face',
        menu.rows.every(r => r.size === menu.faceSize),
        `face ${menu.faceSize} · rows ${[...new Set(menu.rows.map(r => r.size))].join(', ')}`);
      check('1c nothing in the menu is bold',
        menu.rows.every(r => Number(r.weight) < 600),
        [...new Set(menu.rows.map(r => r.weight))].join(', '));
      check('1d no row wraps to a second line',
        menu.rows.every(r => r.wrap === 'nowrap' && r.lines <= 1),
        menu.rows.filter(r => r.lines > 1).map(r => r.text).join(' | ') || 'all one line');
      check('1e every row carries a symbol, and every symbol really paints',
        menu.rows.every(r => r.hasIcon && r.painted),
        menu.rows.filter(r => !r.painted).map(r => r.text).join(' | ') || 'all painted');
      check('1f and the long label was shortened, not shrunk',
        !menu.rows.some(r => /Open in the clause panel/i.test(r.text)),
        menu.rows.map(r => r.text).join(' | '));
    }

    /* ============================================================
       2 · THE NARROWED BAND IS GONE, AND THE CONTROL SAYS IT
       ============================================================ */
    const filt = await page.evaluate(() => {
      rlSetCardFilter('mine');
      const host = document.querySelector('.redline-page');
      if (host && host._rlRerender) host._rlRerender(); else renderRedline();
      return null;
    });
    await pause(900);
    const band = await page.evaluate(() => {
      const sel = document.querySelector('#rl-cardfilter');
      const live = sel ? sel.options[sel.selectedIndex] : null;
      const lab = document.querySelector('.rl-idx-fk');
      const b = document.querySelector('.rl-idx-narrowed');
      return { band: !!b, value: sel ? sel.value : null,
        liveText: live ? live.textContent.trim() : null,
        label: lab ? lab.textContent.trim() : null,
        selSeen: !!(sel && sel.getBoundingClientRect().width > 0) };
    });
    check('2a the "showing one side only" band is gone from the page',
      band.band === false, `band present: ${band.band}`);
    /* REVERSED IN PLACE 26 Aug 2026 (owner-asked: "delete the whose ask
       feature"). When the amber band went, the safety property it carried
       moved to the CONTROL — labelled, naming the live cut and printing its
       count. The control is now deleted too, and the property has nothing left
       to be true of because nothing narrows: the piles SORT by the same reading
       instead of hiding, and the front edge of every row is coloured by whose
       ask it is. So the claim becomes the strongest form of the original —
       there is no band AND no way to narrow the column at all. */
    check('2b and there is no control left to narrow it either',
      !band.selSeen && !band.label, `select ${band.selSeen}, label ${band.label}`);

    /* ============================================================
       5 · A NAV PRESS WITH EDIT WITH COPILOT OPEN
       ============================================================ */
    await page.evaluate(() => setView('redline'));
    await pause(1200);
    const opened = await page.evaluate(() => {
      const c = getContract(redlineHeldId());
      const cl = negoClauseList(c)[0];
      return !!(window.rlOpenClauseEditor && rlOpenClauseEditor(c, cl.clauseId, {}));
    });
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '03-clause-editor.png') });
    check('5a the clause editor is open', opened
      && await page.evaluate(() => !!document.getElementById('clause-editor')));

    /* CLEAN — nothing typed — so the press must go straight through. */
    await page.evaluate(() => { const b = document.querySelector('#side-nav [data-view="register"]'); if (b) b.click(); });
    await pause(1400);
    const afterNav = await page.evaluate(() => ({
      view: state.view,
      editorStillUp: !!document.getElementById('clause-editor'),
      /* WHAT THE READER CAN SEE, not what the app believes: the whole bug was
         that these two disagreed. */
      registerOnScreen: !!(document.querySelector('.reg-table')
        && document.querySelector('.reg-table').getBoundingClientRect().height > 0),
    }));
    await page.screenshot({ path: path.join(OUT, '04-after-nav.png') });
    check('5b the nav press really changes the page, and the layer comes down',
      afterNav.view === 'register' && !afterNav.editorStillUp && afterNav.registerOnScreen,
      JSON.stringify(afterNav));

    /* AND WITH WORDING IN THE BOX IT ASKS FIRST. */
    await page.evaluate(() => setView('redline'));
    await pause(1200);
    await page.evaluate(() => {
      const c = getContract(redlineHeldId());
      const cl = negoClauseList(c)[0];
      rlOpenClauseEditor(c, cl.clauseId, {});
    });
    await pause(800);
    await page.evaluate(() => ceApply('A wholly different wording, typed by the reader.', 'typed'));
    await pause(400);
    const dirty = await page.evaluate(() => clauseEditorDirty());
    check('5c staged: the editor is holding unfiled wording', dirty === true, dirty);
    await page.evaluate(() => { const b = document.querySelector('#side-nav [data-view="register"]'); if (b) b.click(); });
    await pause(900);
    const guard = await page.evaluate(() => ({
      asked: !!document.getElementById('confirm-overlay'),
      view: state.view,
      editorStillUp: !!document.getElementById('clause-editor'),
    }));
    check('5d it asks before throwing away wording, and stays put until answered',
      guard.asked && guard.view === 'redline' && guard.editorStillUp, JSON.stringify(guard));
    await page.screenshot({ path: path.join(OUT, '05-leave-guard.png') });
    /* Answering it lets the press through — a guard that cannot be got past is
       a wall, not a question. */
    await page.evaluate(() => {
      const ov = document.getElementById('confirm-overlay');
      const btns = ov ? [...ov.querySelectorAll('button')] : [];
      const go = btns.find(b => /leave/i.test(b.textContent)) || btns[btns.length - 1];
      if (go) go.click();
    });
    await pause(1400);
    const done = await page.evaluate(() => ({ view: state.view,
      editorStillUp: !!document.getElementById('clause-editor') }));
    check('5e and answering it completes the press that was interrupted',
      done.view === 'register' && !done.editorStillUp, JSON.stringify(done));

    check('no page errors during the run', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }

  const pass = results.filter(r => r.pass).length;
  console.log(`\n${pass}/${results.length} checks passed`);
  console.log('screenshots → test/chromium/shots/six-fixes');
  if (pass !== results.length) process.exitCode = 1;
})();
