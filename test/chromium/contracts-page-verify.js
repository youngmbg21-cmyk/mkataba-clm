/* Chromium verification: THE CONTRACTS PAGE TAKES THE ENTERPRISE DESIGN.
   ====================================================================
   Owner-approved render, 24 Aug 2026, with one decision taken by the owner on
   the day: "drop the document type and go with 36px rows".

   WHY THIS IS A BROWSER FILE. Every claim here is a COMPUTED value or a
   geometry, and this page has been caught by exactly that before:
     · the 36px row does NOT fall out of the arithmetic — measured, 8px of
       padding above and below a 20px line still came back 38.2, because an
       inline-flex child sits on the baseline and the strut adds its descender
       space. Only the browser can say what the row really is;
     · "the stage is a dot, not a chip" is a rendered box, and a source read
       cannot tell a rule that draws from one that lost a cascade fight — this
       codebase's most repeated visual defect;
     · the page is ONE renderer shared with Negotiations, so the only honest
       check is to stand on both seats and measure each;
     · a column that is gone has to be gone as PIXELS, not merely absent from
       one builder.

   RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way" for
   every list page): the Contracts place's head is the list head's white card
   — its title row, the box to search or ask in, the views as tabs, "+ Filter"
   and its chips (a filter appears only once it is added), Sort, Display and
   the rest at the chip row's end — over the list's own card, whose foot is
   "1–40 of N · Show 40 more". Sections 3c, 5, 8, 10, 12, 13, 15, 15b, 16, 17
   and 18 asked the labelled boxes, the card head, the pager, the one search
   box and the Ref column the pick takes away; each now asks what it
   protected of the shape that replaced it, and says so where it stands.

   Run: node test/chromium/contracts-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'contracts-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const check = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* STEP 7 (the overnight work order): the Contracts page is Home's Contracts
   place; this check reads its List (regPlaceSet({ show: 'list' }) before
   setView('register'), which lands there). */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|404/i.test(m.text())) errors.push(m.text().slice(0, 140)); });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(3000);
    /* THE FULL TABLE IS STAGED (re-pointed in place 26 Sep 2026): from about
       a 1104 window the page draws the list Inspector — four columns, a panel
       beside them, a press that SELECTS — which inspector-verify measures.
       Everything here is about the FULL table (its columns, its row menu, its
       widths, its sorts), which the page still draws at every narrower
       window; insForce(false) is the page's own stage door onto it, held in
       memory for this sitting. The page loads once, so it holds for the file. */
    await page.evaluate(() => { if (window.insForce) insForce(false); });
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(1500);
    await page.screenshot({ path: path.join(OUT, '01-contracts.png') });

    /* ============ 1. THE ROW IS ONE LINE AND 36px ============ */
    const rows = await page.evaluate(() => {
      const tr = [...document.querySelectorAll('tr[data-row]')];
      if (!tr.length) return { err: 'no rows' };
      const r0 = tr[0];
      return {
        n: tr.length,
        h: +r0.getBoundingClientRect().height.toFixed(2),
        /* every row, so one tall cell cannot hide behind an average */
        all: tr.map(r => +r.getBoundingClientRect().height.toFixed(2)),
        lines: [...r0.children].map(td => +td.getBoundingClientRect().height.toFixed(1)),
      };
    });
    /* REVERSED IN PLACE (the redesign's second pass, 21 Sep 2026): the title
       is TWO LINES again — the kind and the round under the name, as the
       owner-approved reference draws it — so 36 is the row's FLOOR (the height
       is stated on the cell, where it is a minimum) and every row stands at
       one height above it. */
    check('1a the row stands on its 36px floor', rows.h >= 36, `${rows.h}px`);
    check('1b and EVERY row is one height, not just the first',
      rows.all.every(x => Math.abs(x - rows.h) < 1), JSON.stringify(rows.all));

    /* THE DOCUMENT TYPE IS GONE AS PIXELS — and its fact is still said. */
    /* RE-POINTED IN PLACE 21 Sep 2026: the hover moved with the fact. It read
       the TITLE SPAN's own `title`, and the title span is the counterparty now
       — the whole identity cell carries the hover, because it is the cell that
       holds both lines. The claim is unchanged: the kind is still SAID. */
    const kind = await page.evaluate(() => {
      const t = document.querySelector('tr[data-row] .reg-title');
      const td = document.querySelector('tr[data-row] td.reg-cell-title');
      return { kindEls: document.querySelectorAll('.reg-kind').length,
        title: td ? td.getAttribute('title') : null,
        lineH: t ? +t.getBoundingClientRect().height.toFixed(1) : null };
    });
    check('1c no row draws a document-type line', kind.kindEls === 0, `${kind.kindEls} found`);
    check('1d the title is a SINGLE line box', kind.lineH != null && kind.lineH <= 21, `${kind.lineH}px`);
    check('1e and the kind is still said, on the title\'s own hover',
      !!kind.title && /·/.test(kind.title), kind.title);

    /* ============ 2. THE STAGE IS A DOT AND A WORD, NOT A CHIP ============ */
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE, owner: "keep contracts … as designed"): on the Contracts place the
       stage is its word in its own tone in the grey line under the agreement, and the row's MARK in the same
       tone leads it — the mark is the dot's job now, its colour the meta's brighter shade */
    const stage = await page.evaluate(() => {
      const s = document.querySelector('tr[data-row] .reg-stg-w');
      if (!s) return { err: 'no .reg-stg-w' };
      const cs = getComputedStyle(s);
      const mark = s.closest('tr').querySelector('.reg-id .ls-mark');
      const dcs = mark ? getComputedStyle(mark) : null;
      return {
        word: s.textContent.trim(),
        ink: cs.color,
        dotW: dcs ? dcs.width : null,
        dotBg: dcs ? dcs.color : null,
        svg: !!(mark && mark.querySelector('svg')),
        /* the chip must be GONE from the row, not merely restyled */
        chips: document.querySelectorAll('tr[data-row] .badge').length,
        /* same tone family: the dominant channel of both is the same one */
        hueMatch: (() => {
          const rgb = c => (c.match(/\d+/g) || []).map(Number);
          const a = rgb(cs.color), b = rgb(dcs ? dcs.backgroundColor : '');
          if (a.length < 3 || b.length < 3) return false;
          const domi = v => v.indexOf(Math.max(...v));
          return domi(a) === domi(b);
        })(),
      };
    });
    check('2a the stage is a word, and a mark leads the row',
      !stage.err && stage.svg && stage.dotW === '22px',
      `${stage.err || ''} ${stage.dotW} ${stage.svg}`);
    check('2b the word carries the meaning ink, so colour is not the only carrier',
      !!stage.word && stage.ink !== 'rgb(0, 0, 0)', `"${stage.word}" ${stage.ink}`);
    /* THE DOT AND THE WORD ARE TWO SHADES OF ONE TONE, DELIBERATELY — the
       meta's brighter `dot` against its darker `fg`, which is what every chip
       in this product already does and what keeps a 14px word readable while
       an 8px circle still catches the eye. What matters is that BOTH come from
       the one meta, so they can never name different tones: asserted by their
       hues agreeing while their lightness differs. */
    check('2c the mark and the word are two shades of ONE tone',
      stage.dotBg !== stage.ink && stage.hueMatch,
      `${stage.dotBg} vs ${stage.ink}`);
    check('2d no filled chip is left in a row', stage.chips === 0, `${stage.chips} chips`);

    /* ============ 3. THE COLUMNS ARE THE DESIGN'S ============ */
    const cols = await page.evaluate(() => ({
      heads: [...document.querySelectorAll('.reg-table thead th')]
        .map(t => t.textContent.replace(/[▲▼↕⇅]/g, '').trim()),
      tick: !!document.querySelector('tr[data-row] .reg-tick'),
      /* RE-POINTED 21 Oct 2026 (Part 8): the Stream filter is a "+ Filter"
         choice now, its streams under its own heading */
      streamChip: (() => { const g = document.querySelector('[data-lh-seat="contracts"] select[data-lh-add] optgroup[label="Stream"]');
        const add = g && g.closest('.lh-add'); if (!g || !add) return null;
        const r = add.getBoundingClientRect(); return { w: Math.round(r.width), opts: g.querySelectorAll('option').length }; })(),
      linkCells: document.querySelectorAll('tr[data-row] .share-dot, tr[data-row] [data-share-dot]').length,
    }));
    /* ---- 3a–3c REVERSED IN PLACE 24 Sep 2026 (Young: "Remove the value
       stream column from both pages as well but not from the filter") ----
       They asserted the stream was a column of its own, written out on the
       row beside a 3px tick. The owner has taken the column off both seats and
       KEPT the filter, so the claims now say exactly that. */
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE): the stream is a column again on the Contracts place, a soft chip */
    check('3a the stream is a column again, a soft chip in every row that has one',
      cols.heads.some(x => /^stream$|^värdeflöde$/i.test(x)) && (await page.evaluate(() => document.querySelectorAll('tr[data-row] .ls-chip').length > 0)), cols.heads.join(' · '));
    check('3b and no row draws its stream tick', !cols.tick);
    check('3c CONTROL the Stream filter is still offered (under + Filter), with its streams to pick',
      !!cols.streamChip && cols.streamChip.w > 0 && cols.streamChip.opts >= 1, JSON.stringify(cols.streamChip));
    check('3d the LINK column is gone from this table',
      !cols.heads.some(x => /^link$|^länk$/i.test(x)), cols.heads.join(' · '));

    /* ============ 4. THE ROW VERB IS GONE, THE ⋯ STAYS AND WORKS ============ */
    const verbs = await page.evaluate(() => ({
      actlink: document.querySelectorAll('tr[data-row] .reg-actlink').length,
      dots: document.querySelectorAll('tr[data-row] [data-menu]').length,
    }));
    check('4a no row draws a text verb', verbs.actlink === 0, `${verbs.actlink} found`);
    check('4b every row keeps its ⋯', verbs.dots === rows.n, `${verbs.dots} of ${rows.n}`);
    /* IT MUST STILL OPEN — a menu that is drawn and dead is worse than none. */
    await page.evaluate(() => document.querySelector('tr[data-row] [data-menu]').click());
    await page.waitForTimeout(400);
    const menuOpen = await page.evaluate(() => {
      const p = document.querySelector('[data-menu-pop]');
      return p ? getComputedStyle(p).display !== 'none' : false;
    });
    check('4c and pressing it really opens the menu', menuOpen);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    /* ============ 5. A FILTER SAYS WHAT IT FILTERS ============
       RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): a
       filter is no longer a labelled box standing at rest — "+ Filter" offers
       each one under its own heading, and a chosen one stands as a chip,
       "Label value ×". The claims are the same ones: every filter says what
       it is, no label is a sentence, and the chosen ones sit on one row. */
    const filters = await page.evaluate(async () => {
      const head = document.querySelector('[data-lh-seat="contracts"]');
      const add = head && head.querySelector('select[data-lh-add]');
      const groups = add ? [...add.querySelectorAll('optgroup')].map(g => g.label) : [];
      /* two filters chosen through "+ Filter" itself: the first choice of the first two groups */
      const firstOf = i => { const g = add && add.querySelectorAll('optgroup')[i]; const o = g && g.querySelector('option'); return o ? o.value : null; };
      for (const i of [0, 1]){
        const sel = document.querySelector('[data-lh-seat="contracts"] select[data-lh-add]');
        const v = firstOf(i); if (!sel || !v) continue;
        sel.value = v; sel.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
      }
      const chips = [...document.querySelectorAll('[data-lh-seat="contracts"] .lh-chip')];
      const out = { n: groups.length, groups,
        labelled: groups.filter(g => g && g.trim()).length,
        widest: Math.max(0, ...groups.map(g => g.trim().length)),
        chips: chips.map(c => c.querySelector('label').textContent.replace(/\s+/g, ' ').trim()),
        oneRow: new Set(chips.map(c => Math.round(c.getBoundingClientRect().top))).size };
      chips.forEach(() => { const x = document.querySelector('[data-lh-seat="contracts"] .lh-chip [data-lh-x]'); if (x) x.click(); });
      await new Promise(r => setTimeout(r, 400));
      return out;
    });
    check('5a every filter "+ Filter" offers carries its label',
      filters.n >= 4 && filters.labelled === filters.n, `${filters.labelled}/${filters.n}: ${filters.groups.join(' | ')}`);
    /* The fault this guards: the quick-filter dropdown's own sentence — 57
       characters — used as a LABEL, which ran to 460px and pushed the bar off
       its row. The claim is about LENGTH, so it costs nothing when a label is
       renamed. */
    check('5b no label is a sentence — the long one stays a tooltip',
      filters.widest <= 24, `longest label ${filters.widest} chars`);
    check('5c and the chosen filters stand as chips on one row at 1440', filters.chips.length === 2 && filters.oneRow === 1,
      `${filters.oneRow} rows: ${filters.chips.join(' | ')}`);

    /* ============ 6. THE PAGE STILL WORKS ============ */
    /* A row press must still open the contract — the verb's whole job. */
    await page.evaluate(() => document.querySelector('tr[data-row]').click());
    await page.waitForTimeout(1600);
    const landed = await page.evaluate(() => window.state && state.view);
    /* RE-POINTED 11 Oct 2026 (owner): the list opens the contract on Home's Document */
    check('6a pressing a row still opens the contract, on Home\'s Document', landed === 'dashboard', String(landed));

    /* ============ 7. THE SAME TABLE ON THE OTHER SEAT ============ */
    /* Negotiations IS this renderer. With nothing live it draws its own empty
       card rather than a table, which is correct and is asserted as such —
       a check that silently found no table would pass on a broken page. */
    /* THE DOOR, NOT setView — a bare setView('redline') reads state.activeId,
       which still holds the contract step 6 just opened, so it would land on
       THAT contract's bench rather than the list. The nav press is the door
       this page documents, and it is what a reader actually does. */
    /* the left menu's place is the desk tabs' since 17 Oct 2026 (Round 2): the page is asked of Jambo's box */ await page.evaluate(w => { setView('counter'); counterAsk(w); }, 'negotiations');
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, '02-negotiations.png') });
    const neg = await page.evaluate(() => {
      const tbl = document.querySelector('.reg-table');
      const rs = [...document.querySelectorAll('tr[data-row]')];
      return {
        empty: !!document.querySelector('.ngl-empty'),
        table: !!tbl,
        rowH: rs[0] ? +rs[0].getBoundingClientRect().height.toFixed(2) : null,
        heads: tbl ? [...tbl.querySelectorAll('thead th')]
          .map(t => t.textContent.replace(/[▲▼↕⇅]/g, '').trim()) : [],
        move: document.querySelectorAll('.ngl-w').length,
      };
    });
    if (neg.table) {
      check('7a the negotiations table takes the same 36px row', neg.rowH === 36, `${neg.rowH}px`);
      check('7b and it keeps its own whose-move column',
        neg.heads.some(x => x && !/^$/.test(x)) && neg.move > 0, neg.heads.join(' · '));
    } else {
      check('7a with nothing live it draws its empty card, not a bare table', neg.empty);
    }

    /* ============ 8. THE FILTERS SIT ON THE LIST HEAD'S OWN CARD ============
       RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): the
       drawing puts the page's name, the box, the views and the filters in ONE
       white card — the list head — and the rows in a second card under it,
       the page's own gap between them. That reverses 26 Sep's "the filter bar
       is the list card's top row". What it protected stands: the tools that
       narrow the list sit together on one white card, the list's card follows
       at the page's own gap with no seam of its own, and the two cards share
       one edge, level with each other. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(1500);
    const band = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(), c = getComputedStyle(e);
        return { top: Math.round(r.top), bottom: Math.round(r.bottom),
          left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), bg: c.backgroundColor }; };
      const paint = v => { const d = document.createElement('div'); d.style.background = 'var(' + v + ')';
        document.body.appendChild(d); const c = getComputedStyle(d).backgroundColor; d.remove(); return c; };
      const gap = (() => { const d = document.createElement('div'); d.style.height = 'var(--s-3)'; document.body.appendChild(d);
        const h = Math.round(d.getBoundingClientRect().height); d.remove(); return h; })();
      const chips = document.querySelector('[data-lh-seat="contracts"] .lh-chips');
      const kids = chips ? [...chips.children].filter(e => e.getBoundingClientRect().width > 0) : [];
      return { head: box('[data-reg-home] .ct-head'), card: box('.reg-card'), chips: box('[data-lh-seat="contracts"] .lh-chips'),
        body: box('.reg-table'), gap,
        inHead: !!(chips && chips.closest('.ct-head')),
        surface: paint('--color-surface'), ground: paint('--color-bg'),
        box: !!document.querySelector('[data-lh-seat="contracts"] input[type="search"][data-lh-q]'),
        search: !!document.querySelector('#reg-search'),
        tops: kids.map(e => Math.round(e.getBoundingClientRect().top + e.getBoundingClientRect().height / 2)) };
    });
    check('8a the filters sit on the list head\'s own white card',
      !!band.head && !!band.chips && band.inHead && band.head.bg === band.surface,
      band.head ? `head ${band.head.bg} (surface ${band.surface}) · chips in the head ${band.inHead}` : 'no head');
    check('8b the page name, the box, its views and its filters sit on one white card',
      !!band.head && band.head.bg === band.surface && band.head.bg !== band.ground,
      `head ${band.head && band.head.bg} · surface ${band.surface} · ground ${band.ground}`);
    check('8c and the list\'s own card follows at the page\'s gap, its table at its top',
      !!band.head && !!band.card && !!band.body && Math.abs((band.card.top - band.head.bottom) - band.gap) <= 2 && band.body.top - band.card.top <= 2,
      band.card ? `head ends ${band.head.bottom}, card starts ${band.card.top} (gap ${band.gap}), table at ${band.body.top}` : 'missing');
    check('8d the two cards share one edge, level with each other',
      !!band.card && !!band.head && Math.abs(band.card.left - band.head.left) <= 1 && Math.abs(band.card.right - band.head.right) <= 1,
      `card ${band.card && band.card.left}–${band.card && band.card.right} · head ${band.head && band.head.left}–${band.head && band.head.right}`);
    /* ---- RE-POINTED AGAIN 21 Oct 2026 (Q1, "keep both boxes"): the page
       draws ONE box of its own again, under its title — the list head's, to
       search or ask in — and the shell bar keeps its own; the old full-text
       strip (#reg-search) does not come back. */
    check('8e one box under the title, the list head\'s; no full-text strip on the row',
      band.box && !band.search, JSON.stringify({ box: band.box, strip: band.search }));
    check('8f and "+ Filter" and the tools at its end share one row',
      band.tops.length > 0 && Math.max(...band.tops) - Math.min(...band.tops) <= 4, JSON.stringify(band.tops));

    /* ============ 9. THE BAND DOES NOT LEAK TO OTHER PAGES ============ */
    /* #page-head is the SHELL's element and is painted from this view's own
       stylesheet, which is injected with the view's markup. That is only safe
       if leaving really takes it away — so it is asked, not assumed.
       RE-POINTED 3 Oct 2026: Home is Explorer's page now and paints this
       head white ITSELF (Insights' own rule), so the page left to is one that
       paints nothing there — the Calendar. RE-POINTED 11 Oct 2026: the
       Calendar is Home's tab now (and paints it white), so the page left to is
       My notes, which paints nothing there. RE-POINTED 19 Oct 2026 (round 20
       as drawn): My notes is a white-band list page now (.sap-page, the
       Requests band), so the page left to is the Brain, which paints nothing
       there. */
    await page.evaluate(() => setView('brain'));
    await page.waitForTimeout(1500);
    const left = await page.evaluate(() => {
      const e = document.querySelector('#page-head');
      return { bg: e ? getComputedStyle(e).backgroundColor : null,
        rules: document.querySelectorAll('.reg-band').length };
    });
    check('9a leaving the page takes the white header with it',
      left.bg !== 'rgb(255, 255, 255)', left.bg);
    check('9b and the band is gone from the document', left.rules === 0, String(left.rules));

    /* ============ 10. THE COLUMNS DO NOT MOVE WHEN YOU TURN THE PAGE ============
       Owner-reported 24 Aug 2026: "when you click through the pages, the
       columns move which is not how i want it … there should be no scrolling
       from left to right to see the whole page."

       THE FIXTURE HAS TO BE RAGGED OR THE CHECK CANNOT FAIL. A seeded book of
       four similar contracts sizes the same on every page whatever the table
       layout is, so this stages 150 with deliberately uneven names and
       counterparties — short ones on the first pages, long ones on the last —
       which is what made the columns move on the owner's own register. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(1200);
    await page.evaluate(() => {
      const base = state.contracts[0];
      const NM = ['NDA', 'Warehousing and Transportation Services Agreement — AIT Worldwide Norway AS'];
      const CP = ['Juno', 'Naivas Supermarkets Kenya Limited'];
      for (let i = 0; i < 150; i++){
        const c = JSON.parse(JSON.stringify(base));
        c.id = 'MK-W' + i; c.name = NM[i < 75 ? 0 : 1]; c.counterparty = CP[i < 75 ? 0 : 1];
        c.value = i % 3 ? 12345678 * (i % 7 + 1) : 0; c.negotiation = null; c.audit = [];
        state.contracts.push(c);
      }
      regRepaint();
    });
    await page.waitForTimeout(1400);
    const READ = `(() => {
      const t = document.querySelector('.reg-table');
      const sc = document.getElementById('reg-scroll');
      if (!t || !sc) return null;
      return { w: [...t.querySelectorAll('thead th')].map(e => Math.round(e.getBoundingClientRect().width)),
        layout: getComputedStyle(t).tableLayout,
        fs: getComputedStyle(t).fontSize,
        sideways: sc.scrollWidth - sc.clientWidth,
        first: ((document.querySelector('#reg-tbody tr td') || {}).textContent || '').trim() };
    })()`;
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): the
       numbered pager is "Show 40 more" now, so the list does not turn, it
       GROWS — forty rows, eighty, a hundred and twenty, then the rest, the
       short names first and the long ones after. The claim is the owner's
       one: the columns never move while the rows change. */
    const pages = [];
    for (const n of [1, 2, 3, 4]){
      if (n > 1){
        await page.evaluate(() => { const b = document.querySelector('[data-lh-more="contracts"]'); b && b.click(); });
        await page.waitForTimeout(900);
      }
      pages.push(await page.evaluate(`(() => { const r = ${READ}; if (r) { r.rows = document.querySelectorAll('#reg-tbody tr[data-row]').length;
        r.last = ((document.querySelector('#reg-tbody tr[data-row]:last-child td') || {}).textContent || '').trim(); } return r; })()`));
    }
    check('10a the fixture really grows the list, the long names drawn by the end, so the claim can fail',
      new Set(pages.map(p => p.rows)).size === 4 && /Naivas Supermarkets Kenya Limited/.test(pages[3].last) && !/Naivas/.test(pages[0].last),
      pages.map(p => p.rows + ':' + p.last.slice(0, 24)).join(' · '));
    check('10b every column is the same width however many rows are drawn',
      pages.every(p => String(p.w) === String(pages[0].w)),
      pages.map(p => p.w.join(',')).join('  |  '));
    check('10c and it is a guarantee — the table lays out fixed',
      pages[0].layout === 'fixed', pages[0].layout);
    check('10d nothing scrolls left to right, on any page',
      pages.every(p => p.sideways === 0), pages.map(p => p.sideways).join(','));

    /* ---- 10e · AND IT HOLDS IN SWEDISH, WHICH IS WHAT WAS REPORTED ----
       WO-9's whole ask was "when I switch to swedish language, in all tables I
       should not have to scroll right to see the entire table". Every check
       above runs in English, where the words are shorter — measuring the fix
       only there is measuring the case that was never broken.
       SWITCHED BY CLICKING, never window.langSet: the lesson swedish-verify
       records, that driving the app through JavaScript proves the engine and
       not the button. And the column widths are asserted UNMOVED, because
       `table-layout:fixed` is what makes this true and a longer heading must
       not be able to push a column wider. */
    const svBtn = page.locator('[data-lang-set="sv"], [data-set-lang="sv"]').first();
    if (await svBtn.count()) await svBtn.click();
    else await page.evaluate(() => window.langSet('sv'));
    await page.waitForTimeout(1600);
    const sv = await page.evaluate(READ);
    check('10e the app really is in Swedish before the table is measured',
      (await page.evaluate(() => document.documentElement.lang)) === 'sv'
        && !!sv && sv.w.length === pages[0].w.length,
      await page.evaluate(() => document.documentElement.lang));
    check('10e and nothing scrolls left to right in Swedish either',
      sv && sv.sideways === 0, sv && String(sv.sideways));
    check('10e the columns are the same widths as in English — fixed means fixed',
      sv && String(sv.w) === String(pages[0].w),
      `${sv && sv.w.join(',')}  vs  ${pages[0].w.join(',')}`);
    /* AND A CELL TOO NARROW FOR ITS WORDS SAYS SO. Fixed columns without this
       is the honest half of the fault: nothing scrolls, and the text is cut
       mid-word with nothing to show it was. */
    const cut = await page.evaluate(() => {
      const g = e => getComputedStyle(e);
      /* EXCEPT THE CELL THAT HOSTS THE ROW MENU. It holds a button and an
         absolutely-positioned pop-up, not a name or free text, so the
         reference's own rule does not ask it to clip — and clipping it is what
         made the menu invisible (section 14). */
      const cells = [...document.querySelectorAll('.reg-table tbody td:not(.reg-cell-menu)')];
      const heads = [...document.querySelectorAll('.reg-table thead th')];
      const ok = e => g(e).textOverflow === 'ellipsis' && ['hidden', 'clip'].includes(g(e).overflowX);
      return { cells: cells.length, badCells: cells.filter(e => !ok(e)).length,
        heads: heads.length, badHeads: heads.filter(e => !ok(e)).length };
    });
    check('10e every cell and every header cuts with an ellipsis, not mid-word',
      cut.cells > 0 && cut.badCells === 0 && cut.heads > 0 && cut.badHeads === 0,
      JSON.stringify(cut));
    const svEn = page.locator('[data-lang-set="en"], [data-set-lang="en"]').first();
    if (await svEn.count()) await svEn.click();
    else await page.evaluate(() => window.langSet('en'));
    await page.waitForTimeout(1200);

    /* ---- 12 · THE FILTER OUTLINE IS THE REFERENCE'S (owner-asked 25 Aug 2026)
       RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): no
       filter stands at rest any more. What is at rest is "+ Filter" — the
       hairline, dashed, the accent ink, as drawn — and a filter chosen
       stands as a chip in the hairline with its value at the strong weight.
       Asked as RELATIONS against the tokens, as before. */
    const RESOLVE = tok => {
      const d = document.createElement('div');
      d.style.borderTop = '1px solid var(' + tok + ')';
      document.body.appendChild(d);
      const v = getComputedStyle(d).borderTopColor;
      d.remove(); return v;
    };
    const INK = tok => { const d = document.createElement('div'); d.style.color = 'var(' + tok + ')'; document.body.appendChild(d);
      const v = getComputedStyle(d).color; d.remove(); return v; };
    await page.evaluate(() => { const R = regState(); R.stage = 'all'; R.type = 'all'; R.view = null; regRepaint(); });
    await page.waitForTimeout(900);
    const ADD = () => { const a = document.querySelector('[data-lh-seat="contracts"] .lh-add'); if (!a) return null;
      const c = getComputedStyle(a); return { bc: c.borderTopColor, bs: c.borderTopStyle, fg: c.color, r: c.borderTopLeftRadius }; };
    const rest = await page.evaluate(ADD);
    const ruleStrong = await page.evaluate(RESOLVE, '--rule-strong');
    check('12a "+ Filter" at rest wears the hairline, dashed, as drawn',
      !!rest && rest.bc === ruleStrong && rest.bs === 'dashed', rest ? `${rest.bc} ${rest.bs} · token ${ruleStrong}` : 'no + Filter');
    check('12a2 …and the search box it used to walk is gone from the row',
      !(await page.evaluate(() => !!document.getElementById('reg-search'))), 'not drawn');
    const btnEdge = await page.evaluate(RESOLVE, '--btn-edge');
    const ctlRadius = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--radius').trim());
    check('12b and it wears the soft control corner, as the mockup draws it',
      !!rest && parseFloat(rest.r) === parseFloat(ctlRadius), `radius ${rest && rest.r} vs --radius ${ctlRadius}`);
    check('12c the button\'s own edge is a real colour',
      /^(rgba?|color)\(/.test(btnEdge), btnEdge);
    /* A FILTER IN FORCE SAYS SO: a chip, its value at the strong weight beside
       its label, its edge the chip's hairline */
    await page.evaluate(() => { LH_PAGES.contracts.apply({ stage: 'Signed' }); });
    await page.waitForTimeout(900);
    const act = await page.evaluate(() => { const c = document.querySelector('[data-lh-seat="contracts"] .lh-chip'); if (!c) return null;
      const l = c.querySelector('label'), b = l && l.querySelector('b'), cs = getComputedStyle(c);
      return { bc: cs.borderTopColor, lw: Number(getComputedStyle(l).fontWeight), bw: b ? Number(getComputedStyle(b).fontWeight) : null,
        lfg: getComputedStyle(l).color, bfg: b ? getComputedStyle(b).color : null }; });
    const actAdd = await page.evaluate(ADD);
    const chipEdge = await page.evaluate(RESOLVE, '--chip-edge');
    /* RE-POINTED 27 Oct 2026 (THE LEGORA WAY, the owner's pick: every word 12px and up is the ink; only the small print keeps the grey) */
    check('12d a filter in force stands as a chip, its value at a heavier weight than its label (both the ink)',
      !!act && act.bw > act.lw && act.bfg === act.lfg, JSON.stringify(act));
    check('12e and "+ Filter" beside it stays resting, so the narrowing is legible',
      !!actAdd && actAdd.bc === ruleStrong && actAdd.bs === 'dashed', actAdd && `${actAdd.bc} ${actAdd.bs}`);
    /* RE-POINTED 20 Oct 2026 (Chambers, no dark mode) and 21 Oct 2026 (Part 8) */
    const accentInk = await page.evaluate(INK, '--accent-ink');
    check('12f "+ Filter"\'s ink is the accent ink token, --accent-ink, as drawn',
      !!actAdd && actAdd.fg === accentInk, `+ Filter ${actAdd && actAdd.fg} · token ${accentInk}`);
    check('12f and the chip wears the hairline, --chip-edge reading --rule-strong',
      !!act && act.bc === chipEdge && chipEdge === ruleStrong, act && act.bc);
    const night = await page.evaluate(() => ({ dark: document.documentElement.classList.contains('dark'),
      fns: ['setTheme', 'setDark', 'toggleTheme', 'toggleDark'].filter(n => typeof window[n] === 'function') }));
    check('12g no night look is left to switch to', !night.dark && night.fns.length === 0, JSON.stringify(night));
    await page.evaluate(() => { const R = regState(); R.stage = 'all'; R.view = null; regRepaint(); });
    await page.waitForTimeout(1000);

    /* ---- 13 · EVERY FILTER IS ONE SHAPE (owner-asked 25 Aug 2026)
       RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"): a
       filter is a chip once it is added — "Label value ×", from ONE builder
       (lhChipHtml) — so the claims are asked of chips: the filters are all
       offered, the stages are a filter and never a tab row, every chip says
       its label before its value, and they share one row, one size and one
       ink. EVERY CLAIM IS A RELATION between them, never a number. */
    const six = await page.evaluate(async () => {
      const add = document.querySelector('[data-lh-seat="contracts"] select[data-lh-add]');
      const groups = add ? [...add.querySelectorAll('optgroup')].map(g => g.label) : [];
      /* three chosen: Stage, Stream and Category's first choices */
      for (const k of ['Stage', 'Stream', 'Category']){
        const sel = document.querySelector('[data-lh-seat="contracts"] select[data-lh-add]');
        const o = sel && sel.querySelector(`optgroup[label="${k}"] option`); if (!o) continue;
        sel.value = o.value; sel.dispatchEvent(new Event('change', { bubbles: true }));
        await new Promise(r => setTimeout(r, 400));
      }
      const chips = [...document.querySelectorAll('[data-lh-seat="contracts"] .lh-chip')].map(c => {
        const l = c.querySelector('label'), b = l && l.querySelector('b');
        const word = l ? [...l.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim() : '';
        const r = c.getBoundingClientRect(), g = l && getComputedStyle(l);
        return { word, value: b ? b.textContent.trim() : '', wordFirst: !!(l && b && l.textContent.indexOf(word) < l.textContent.indexOf(b.textContent)),
          top: Math.round(r.top), h: Math.round(r.height), size: g ? g.fontSize : null, color: g ? g.color : null };
      });
      return { groups, chips };
    });
    check('13a every filter is offered under + Filter, the stages among them, and no stage tab row',
      ['Stage', 'Stream', 'Category'].every(k => six.groups.includes(k)) && (await page.evaluate(() => !document.querySelector('[data-reg-home] [data-reg-stage]'))),
      six.groups.join(' · '));
    check('13a2 and the search box is not among them any more',
      !(await page.evaluate(() => !!document.getElementById('reg-search'))), 'not drawn');
    check('13b every chip says its label before its value',
      six.chips.length === 3 && six.chips.every(c => c.wordFirst), JSON.stringify(six.chips.map(c => c.word + ' ' + c.value)));
    check('13c every one of them SAYS what it is — no filter named only by a tooltip',
      six.chips.every(c => c.word && c.word.length > 1),
      six.chips.map(c => c.word).join(' · '));
    check('13d they share one row and one height — one treatment',
      six.chips.length > 0 && new Set(six.chips.map(c => c.top)).size === 1 && new Set(six.chips.map(c => c.h)).size === 1,
      `tops ${[...new Set(six.chips.map(c => c.top))].join('/')} · heights ${[...new Set(six.chips.map(c => c.h))].join('/')}`);
    check('13e and the labels are one size and one ink',
      new Set(six.chips.map(c => c.size)).size === 1 && new Set(six.chips.map(c => c.color)).size === 1,
      `${[...new Set(six.chips.map(c => c.size))].join('/')} · ${[...new Set(six.chips.map(c => c.color))].join('/')}`);
    await page.evaluate(() => { const R = regState(); R.stage = 'all'; R.type = 'all'; R.category = 'all'; regRepaint(); });
    await page.waitForTimeout(700);
    /* AND IT STILL SORTS — a control restyled into silence is the worse fault. */
    const sortWorks = await page.evaluate(async () => {
      const before = [...document.querySelectorAll('#reg-tbody tr[data-row]')]
        .slice(0, 4).map(r => r.getAttribute('data-row')).join(',');
      const sel = document.getElementById('reg-sort');
      sel.value = 'name';
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 900));
      return { before, state: regState().sort,
        after: [...document.querySelectorAll('#reg-tbody tr[data-row]')]
          .slice(0, 4).map(r => r.getAttribute('data-row')).join(',') };
    });
    check('13f pressing it still sorts the list — restyled, not silenced',
      sortWorks.state === 'name' && sortWorks.after !== sortWorks.before,
      `${sortWorks.before} -> ${sortWorks.after}`);
    /* SORT NEVER WEARS THE ACTIVE ACCENT, deliberately: on the other five that
       marks "this is narrowing your list", and sorting narrows nothing. */
    /* RE-POINTED 9 Oct 2026 (SAP benchmark): Sort is an icon on the list's
       own head, never a box among the filters — so it cannot be dressed as one. */
    /* RE-POINTED 21 Oct 2026 (Part 8): the list's own card head is gone; Sort
       stands at the list head's chip row's end, never a chip among the filters */
    const sortInk = await page.evaluate(() => {
      const s = document.getElementById('reg-sort');
      return { inChip: !!(s && s.closest('.lh-chip')), atEnd: !!(s && s.closest('[data-lh-seat="contracts"] .lh-chips .ngl-tools')) };
    });
    check('13g and Sort sits at the chip row\'s end, not among the filters',
      !sortInk.inChip && sortInk.atEnd, JSON.stringify(sortInk));
    await page.evaluate(() => { const R = regState(); R.sort = 'updated'; regRepaint(); });
    await page.waitForTimeout(700);

    /* ============ 11. AND THE NEGOTIATIONS TABLE READS THE SAME ============
       One builder draws both, so the two may not come to disagree about how big
       their type is or how their shared columns are cut. Six of the eight are
       identical by construction; the title and the last column differ, because
       the last holds a ⋯ here and a sentence about whose move it is there. */
    await page.evaluate(() => {
      state.contracts.filter(c => /^MK-W/.test(c.id)).slice(0, 40).forEach((c, i) => {
        negoInit(c);
        negoFileChange(c, { clauseId: (clauseSegment(negoBaseBody(c))[0] || {}).id || 'c1',
          kind: 'edit', authorSide: i % 2 ? 'counterparty' : 'owner', author: 'E L',
          before: 'thirty (30) days', after: 'sixty (60) days', why: 'why' });
      });
    });
    await page.waitForTimeout(2500);
    await page.evaluate(() => { const b = [...document.querySelectorAll('#side-nav .nav-item')]
      .find(x => /Negotiation/i.test(x.textContent)); b && b.click(); });
    await page.waitForTimeout(2500);
    const nego = await page.evaluate(READ);
    /* RE-POINTED IN PLACE 24 Sep 2026: seven since the owner took the value
       stream column off both seats — asked of the seat's own key list, never a
       typed count. */
    const negoCols = await page.evaluate(() => REG_COL_KEYS_NEGO.length);
    check('11a the negotiations list draws the same table', !!nego && nego.w.length === negoCols,
      nego && `${nego.w.join(',')} · ${negoCols} keys`);
    check('11b at the same type size as Contracts',
      nego && nego.fs === pages[0].fs, `${nego && nego.fs} vs ${pages[0].fs}`);
    check('11c its columns are fixed too, and it does not scroll sideways',
      nego && nego.layout === 'fixed' && nego.sideways === 0,
      nego && `${nego.layout} · ${nego.sideways}px`);
    /* ---- THE SIX SHARED COLUMNS — RE-POINTED IN PLACE 31 Aug 2026 (J-5.1) ----
       MK, counterparty, stream, value, expiry and status, and the CLAIM IS
       UNCHANGED: a reader moving between the two lists sees the same columns cut
       the same way, which is what one renderer drawing both pages is for.
       WHAT WAS A DESCRIPTION WAS THE INDEXING. `[0,2,3,4,5,6]` was true while
       both seats drew eight columns; Contracts draws nine now, so from the sixth
       onwards the two lists no longer name the same column — index 5 is Signed
       here and Expiry there. Paired BY KEY off the seat's own column list, so
       the next column added to either seat costs no edit. */
    /* FIVE SINCE 24 Sep 2026 (Young: "Remove the value stream column from both
       pages as well but not from the filter") — the stream column left both
       seats and its width went back to the counterparty on both. */
    /* 11d RETIRED 15 Oct 2026 (the overnight work order, step 7): "the five
       columns both tables share are cut identically" paired the Contracts
       page's table with the Negotiations page's, both drawn edge to edge in
       the same shell. Contracts is now Home's Contracts place — its List sits
       in Home's paper column beside Jambo's panel, with its own six columns
       (the drawing's: Ref, Counterparty and agreement, Stage, Owner, Ends,
       Value) — so the two tables no longer share a width to be cut alike.
       The pairing's subject is gone; 11a–11c still ask the Negotiations
       table's own size, type and fixed layout, and 10a–10e the List's. */

    /* ---- 14 · THE ROW MENU IS NOT CLIPPED AWAY (owner-reported 25 Aug 2026:
       "Previously, the 3 dots at the end were a filter where I had options to
       archive delete and so forth. What has happened to that feature?") ----
       WO-9 put overflow:hidden on every cell so a long name would cut with an
       ellipsis. The actions cell hosts the row menu as an absolutely-positioned
       pop-up, and overflow:hidden clips an absolute child to its clipping
       ancestor — so a 180x234 menu was cropped to a 35x36 cell. The button
       still worked and all seven rows were still in the DOM; the menu was
       simply invisible. MEASURED against the shipped code: 0 of 7 rows
       reachable, and 7 of 7 with the exemption.
       ASKED AS "IS IT PAINTED", NOT "DO THE BOXES OVERLAP": a clipped element
       still reports its full rectangle, so a geometry check passes on the
       broken page. document.elementFromPoint at each row's own centre is the
       only honest question, and it is one a browser alone can answer. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(1600);
    await page.click('#reg-tbody [data-menu]');
    await page.waitForTimeout(600);
    const menu = await page.evaluate(() => {
      const pop = document.querySelector('#reg-tbody [data-menu-pop]');
      if (!pop) return { absent: true };
      const items = [...pop.querySelectorAll('button,a')];
      const hit = items.map(b => {
        const r = b.getBoundingClientRect();
        const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { label: b.textContent.trim(),
          reachable: !!el && (el === b || b.contains(el) || pop.contains(el)) };
      });
      const cell = pop.closest('td');
      /* EVERY ROW has a menu cell, so "the others" means every cell that is not
         one — comparing against all cells counts the other 39 menu cells and
         reports the exemption as a leak. */
      const other = [...document.querySelectorAll('#reg-tbody tr[data-row] td:not(.reg-cell-menu)')];
      return { shown: pop.style.display === 'flex',
        items: items.length,
        reachable: hit.filter(h => h.reachable).length,
        unreachable: hit.filter(h => !h.reachable).map(h => h.label),
        labels: hit.map(h => h.label),
        cellOverflow: getComputedStyle(cell).overflow,
        othersClipped: other.every(td => getComputedStyle(td).overflow === 'hidden'),
        otherCount: other.length };
    });
    check('14a the menu opens', !menu.absent && menu.shown && menu.items > 0,
      menu.absent ? 'no menu in the row' : menu.items + ' rows');
    check('14b every row in it is actually painted, not clipped away',
      menu.reachable === menu.items,
      `${menu.reachable}/${menu.items} reachable · missing ${JSON.stringify(menu.unreachable)}`);
    check('14c and it still carries the acts the row menu is for',
      /* archive is an answer in End or pause since 15 Oct 2026 (owner picked "One question") */
      /end or pause/i.test(menu.labels.join(' ')) && /delete/i.test(menu.labels.join(' ')),
      menu.labels.join(' · '));
    /* THE EXEMPTION IS NARROW, which is the other half: WO-9's clip must still
       be doing its job on every cell that holds text. */
    check('14d the exemption is the menu cell alone — every text cell still clips',
      menu.cellOverflow === 'visible' && menu.othersClipped && menu.otherCount > 0,
      `menu cell ${menu.cellOverflow} · ${menu.otherCount} others clipped ${menu.othersClipped}`);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);


    /* ---- 15 · THE BAND IS ONE CARD AND IT REACHES THE SCREEN'S EDGE
       (owner-reported 25 Aug 2026, off two screenshots: "remove the separation
       strip in the top two cards and make it one card just like in the
       negotiations page", and "the top white cards should cover all the way to
       the end of the screen") ----
       ONE CAUSE, BOTH REPORTS. The shell's scroller reserved a scrollbar
       gutter permanently; #page-head sits OUTSIDE that scroller and the band
       inside it, so the two white boxes had different right edges — measured
       at 1440, the head ran to 1440 and the band stopped at 1430. That 10px
       step read as two cards, and the grey beside the band is what the second
       screenshot ringed.
       MEASURED AS PAINT, NOT AS BOXES. Two elements can share a right edge and
       still leave a seam, so this walks the last visible column of pixels from
       the top of the head to the bottom of the band and asks what colour is
       painted there — one answer, all the way down, is the claim. */
    const EDGE = () => {
      /* WHAT IS PAINTED AND WHAT IS PAINTING IT. The colour alone can be
         satisfied by anything laid over the page; the OWNER of the pixel is
         the claim — the top element at that point has to be the head or the
         band, or inside one of them. */
      const atPoint = (x, y) => { const top = document.elementFromPoint(x, y);
        let n = top, c = 'rgba(0, 0, 0, 0)';
        while (n && c === 'rgba(0, 0, 0, 0)'){ c = getComputedStyle(n).backgroundColor; n = n.parentElement; }
        const own = top && top.closest('#page-head, .ct-head, .reg-band');
        return { c, own: own ? (own.id ? '#' + own.id : '.reg-band') : 'OTHER' }; };
      const box = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect();
        return { right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
      const sc = document.getElementById('content-scroll');
      /* RE-POINTED 15 Oct 2026 (step 7): on Home's Contracts place the
         page's name sits in the place's own head (.ct-head, which IS the
         white band); Negotiations keeps the page head. */
      const head = box('.ct-head') || box('#page-head'), band = box('.reg-band');
      if (!band) return null;
      /* RE-POINTED IN PLACE 26 Sep 2026 (the list Inspector drawing): the
         page's name sits on the page ground now and the ONE card is the
         list's — its filter bar over its rows — so the column of pixels is
         walked just inside THAT card's right edge, from the top of the bar to
         the bottom of the column heads: one colour, the card's own surface,
         owned by the card all the way down, is the 25 Aug complaint ("a grey
         gap in the card") asked of the card that exists. */
      const card = document.querySelector('.reg-card');
      const thead = document.querySelector('.reg-table thead');
      const cr = card ? card.getBoundingClientRect() : null;
      const hb = thead ? thead.getBoundingClientRect().bottom : null;
      /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK, stage 2, the owner's drawing): the column heads stand on the
         drawing's own faint grey band; that band is the card's own (its heads), never the ground */
      const th = thead && thead.querySelector('th');
      const headBand = th ? getComputedStyle(th).backgroundColor : null;
      const cols = [], owners = [];
      /* RE-POINTED 23 Oct 2026 (THE LEGORA LOOK): the card's corners are rounded (--radius-lg), so the
         walk starts below the curve — the ground showing OUTSIDE a rounded corner is the corner, not a gap */
      const rTop = card ? Math.max(2, parseFloat(getComputedStyle(card).borderTopRightRadius) || 0) : 2;
      if (cr && hb) for (let y = cr.top + rTop; y < hb - 2; y += 2){   /* every 2px: the walk is shorter below the curve */
        const top = document.elementFromPoint(cr.right - 3, y);
        let n = top, c = 'rgba(0, 0, 0, 0)';
        while (n && c === 'rgba(0, 0, 0, 0)'){ c = getComputedStyle(n).backgroundColor; n = n.parentElement; }
        cols.push(c); owners.push(top && top.closest('.reg-card') ? '.reg-card' : 'OTHER');
      }
      const surface = card ? getComputedStyle(card).backgroundColor : null;
      /* What is painted behind the page's name, at the head's right. */
      const probe = document.createElement('div'); probe.style.background = 'var(--color-bg)';
      document.body.appendChild(probe); const ground = getComputedStyle(probe).backgroundColor; probe.remove();
      /* RE-POINTED 19 Oct 2026 (the picked drawings' head card, rounds 14-26):
         the head is a white card set in on the ground, so the grey shows at
         its edges by design; what is asked is what is painted behind the
         NAME itself — the card's white, not the ground and not the list's
         card. The name's own box, read at its middle. */
      const nm = document.querySelector('.ct-head .ct-h, #page-head h1, .ngl-head h2');
      const nr = nm ? nm.getBoundingClientRect() : null;
      const hp = nr && nr.width > 0 ? atPoint(Math.round(nr.right - 3), Math.round(nr.top + nr.height / 2))
        : (head ? atPoint(Math.min(head.right, innerWidth) - 3, head.top + 4) : null);
      const place = box('#ct-place');
      return { headRight: head && head.right, bandRight: band.right, win: innerWidth,
        placeRight: place ? place.right : null,
        headPaint: hp ? hp.c : null, ground,
        card: !!card, cardRight: cr ? Math.round(cr.right) : null, cardTop: cr ? Math.round(cr.top) : null,
        gutter: sc.offsetWidth - sc.clientWidth, surface,
        owners: [...new Set(owners)],
        colours: [...new Set(cols.map(c => (headBand && c === headBand) ? surface : c))], samples: cols.length, headBand };
    };
    for (const [name, go] of [['Contracts', () => (regPlaceSet({ show: 'list' }), setView('register'))],
                              ['Negotiations', () => openNegotiations({ list: true })]]){
      /* A CLEAN PAGE FIRST. Section 14 leaves a row menu behind; whatever it
         leaves layered over the page is what elementFromPoint would answer
         with, and every sample would agree — a pass for the wrong reason. */
      await page.keyboard.press('Escape');
      await page.evaluate(() => setView('dashboard'));
      await page.waitForTimeout(900);
      await page.evaluate(go);
      await page.waitForTimeout(1700);
      const e = await page.evaluate(EDGE);
      check(`15 ${name}: the list is one card, drawn inside the page (its filters and its rows)`,
        !!e && e.card && e.cardRight < e.win, e ? `card ends ${e.cardRight} of ${e.win}` : 'no band');
      /* RE-POINTED 9 Oct 2026 (SAP benchmark): the name sits on the page's
         white band, not on the grey ground and not on the list's card. */
      check(`15 ${name}: and the page's name sits on the page's white band`,
        !!e && !!e.headPaint && e.headPaint === e.surface && e.headPaint !== e.ground,
        e ? `behind the name ${e.headPaint} · ground ${e.ground} · card ${e.surface}` : '-');
      check(`15 ${name}: nothing but the card's own surface down its edge, from the filters to the column heads`,
        !!e && e.samples > 6 && e.colours.length === 1 && e.colours[0] === e.surface
          && !e.owners.includes('OTHER'),
        e ? `${e.samples} samples · ${e.colours.join(' | ')} vs surface ${e.surface}`
          + ` · painted by ${e.owners.join(', ')}` : '-');
      /* RE-POINTED 15 Oct 2026 (step 7): Contracts is no longer a page of its
         own in the shell's scroller — it is a place inside Home's paper
         column, whose scroller is Home's. What the 25 Aug report asked ("the
         top white cards should cover all the way to the end") is asked of the
         place: its band runs to the place's own right edge, with no step.
         Negotiations is still a page that owns its height, so it keeps the
         gutter claim. */
      /* RE-POINTED 21 Oct 2026 (Part 8): the place's head is the list head's
         card on the ground, like every list page's; what "no step" asks of it
         is that it and the list's card end at one edge */
      if (name === 'Contracts')
        check(`15 ${name}: and its head card and its list card end at one edge, with no step`,
          !!e && e.cardRight != null && Math.abs(e.bandRight - e.cardRight) <= 1,
          e ? `head card ends ${e.bandRight} · list card ends ${e.cardRight}` : '-');
      else
        check(`15 ${name}: because a page that cannot scroll reserves no gutter`,
          !!e && e.gutter === 0, e ? `${e.gutter}px reserved` : '-');
    }
    /* ---- 15b · AND THE TWO HALVES JOIN AT EVERY WINDOW HEIGHT
       (owner-reported 25 Aug 2026: "there is still a grey gap in the card that
       needs to be eliminated") ----
       The band bleeds to the view's edge by pulling the view's own padding
       back, and the wrapper TYPED 14px and 16px where the band reads
       --page-pad-t and --page-pad-x. The two only cancelled by luck, at the one
       window height where the token happens to be 16 — which is the height
       every check above runs at. The day --page-pad-t started tightening with
       the window the luck ran out: MEASURED at 1440x800 a 4px strip of page
       ground across the card, and 6px under 680.
       SO IT IS ASKED SHORT AS WELL AS TALL, and asked as PAINT: walk the rows
       between the head's bottom and the band's top and require every one of
       them to be owned by one or the other. */
    /* RE-POINTED IN PLACE 26 Sep 2026 (the list Inspector drawing): the head
       and the views sit on the page ground now, with the page's own gap
       between them by design, and the ONE card is the list's — its filter
       bar over its rows. So the join asked at every window height is the one
       that card has to keep: the filters and the column heads meet with no
       gap, and every row of pixels between them belongs to the card. */
    const JOIN = () => {
      const colAt = (x, y) => { const t = document.elementFromPoint(x, y);
        let n = t, c = 'rgba(0, 0, 0, 0)';
        while (n && c === 'rgba(0, 0, 0, 0)'){ c = getComputedStyle(n).backgroundColor; n = n.parentElement; }
        return { c, own: t && t.closest('.reg-card') ? '.reg-card' : 'OTHER' }; };
      const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
      /* RE-POINTED 21 Oct 2026 (Part 8): the filters are the head card's; the
         list's card opens on its column heads, so the join asked is the
         card's own top and its heads, with every row between them its own */
      const bar = r('.reg-card'), thead = r('.reg-table thead');
      if (!bar || !thead) return null;
      const rows = [];
      for (let y = Math.round(bar.top) + 1; y <= Math.round(thead.top) + 3; y++)
        rows.push(colAt(500, y));
      return { gap: Math.round((thead.top - bar.top - 1) * 10) / 10,
        padT: getComputedStyle(document.documentElement).getPropertyValue('--page-pad-t').trim(),
        strangers: rows.filter(x => x.own === 'OTHER').length, rows: rows.length };
    };
    for (const H of [1000, 800, 660]){
      await page.setViewportSize({ width: 1500, height: H });
      await page.waitForTimeout(400);
      await page.evaluate(() => setView('dashboard'));
      await page.waitForTimeout(700);
      await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
      await page.waitForTimeout(1500);
      const j = await page.evaluate(JOIN);
      check(`15b at ${H}px tall the list's card opens on its column heads with no gap`,
        !!j && j.gap <= 0.5 && j.strangers === 0,
        j ? `--page-pad-t ${j.padT} · gap ${j.gap}px · ${j.strangers} of ${j.rows} rows painted by neither`
          : 'nothing to measure');
    }
    await page.setViewportSize({ width: 1500, height: 1000 });
    await page.waitForTimeout(500);

    /* AND THE RULE GOES WITH THE PAGE. It lives in the register's own injected
       <style>, so the next view gets the shell's reserved gutter back — which
       is what stops content jolting sideways between a scrolling page and a
       fixed one. A rule that leaked would take that with it. */
    await page.evaluate(() => setView('dashboard'));
    await page.waitForTimeout(1500);
    const elsewhere = await page.evaluate(() => {
      const sc = document.getElementById('content-scroll');
      return { gutter: sc.offsetWidth - sc.clientWidth,
        rule: getComputedStyle(sc).scrollbarGutter };
    });
    check('15 and the next page gets its reserved gutter back',
      elsewhere.gutter > 0 || /stable/.test(elsewhere.rule || ''),
      `${elsewhere.gutter}px · ${elsewhere.rule}`);

    /* ============================================================
       16. ONE SEARCH BOX, AND IT IS THE SHELL'S (N-3, 31 Aug 2026)
       ============================================================
       *"remove the search open text field in the contracts page."* M-5 did the
       same on Negotiations; the owner has now named the other seat, so neither
       draws one. MEASURED AS PAINT rather than as markup, because a box that is
       in the DOM and merely hidden is still a box the next reader has to rule
       out — and because the shell bar's own box must be proved still there,
       which is the whole reason this one could go. */
    const boxes = await page.evaluate(() => {
      const shown = el => {
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && el.offsetParent !== null
          && getComputedStyle(el).visibility !== 'hidden';
      };
      const shell = document.querySelector('#cmd-search, #shell-search, header input[type="text"], header input:not([type])');
      return { own: !!document.getElementById('reg-search'),
        ownShown: shown(document.getElementById('reg-search')),
        head: shown(document.querySelector('[data-lh-seat="contracts"] input[data-lh-q]')),
        shell: shown(shell),
        shellPh: shell ? (shell.placeholder || '') : '' };
    });
    /* RE-POINTED 21 Oct 2026 (Part 8; Q1 answered "keep both boxes"): the
       place draws ONE box of its own again — the list head's, under its title
       — and the shell bar keeps its own; both say the one query. The old
       full-text box (#reg-search) stays gone. */
    check('16a the Contracts place draws one box of its own, the list head\'s, and no old full-text box',
      boxes.head === true && boxes.own === false && boxes.ownShown === false,
      JSON.stringify({ head: boxes.head, old: boxes.own }));
    /* RE-POINTED 29 Oct 2026 (round 1 "The Legora way", owner's yes): the bar's search left — one box per page, Jambo's */
    check('16b …and the shell bar carries none',
      boxes.shell === false, boxes.shell ? `"${boxes.shellPh.slice(0, 42)}"` : 'no box in the header');

    await page.evaluate(() => { if (window.regSetScope) regSetScope('negotiations');
      if (window.renderNegotiationsList) renderNegotiationsList(); else renderRegister(); });
    await page.waitForTimeout(500);
    const negBox = await page.evaluate(() => !!document.getElementById('reg-search'));
    check('16c and neither does Negotiations — one renderer, one answer',
      negBox === false, negBox ? 'still there' : 'not drawn');

    /* A QUERY NARROWS ON THE SEAT WITH A BOX, AND NOWHERE ELSE — REVERSED IN
       PLACE 10 Sep 2026 (owner: "the search feature is not working").
       This asserted that a stale query narrowed nothing ANYWHERE, on the
       reasoning that a page narrowed by a control nobody can see has nothing to
       press to widen it. That is right about the box N-3 removed and wrong
       about the shell bar's, which is on screen, says it searches contracts,
       and is the one the reader types into. The rule is unchanged and only its
       subject moved, so BOTH halves are pinned: the Negotiations seat draws no
       box on either shell and must still narrow nothing. */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick "The Legora way"):
       the computer's Negotiations page draws its own box now (the list
       head), so there the words narrow; the seat with no box is the PHONE's
       Negotiations screen, and there a query must still narrow nothing. */
    const staleNego = await page.evaluate(() => {
      if (window.regSetScope) regSetScope('negotiations');
      const keep = window.mPhone;
      try {
        window.mPhone = () => true;
        const before = regFiltered().length;
        regState().query = 'zzzz-no-such-contract';
        const phone = regFiltered().length;
        window.mPhone = () => false;
        const computer = regFiltered().length;
        return { before, phone, computer };
      } finally { regState().query = ''; window.mPhone = keep; }
    });
    check('16d a query narrows nothing on the seat with no box (the phone), and narrows the computer\'s, whose box says it',
      staleNego.before === staleNego.phone && staleNego.computer < staleNego.before,
      JSON.stringify(staleNego));

    /* ============ 17. THE SEARCH BOX ACTUALLY NARROWS THE TABLE ============
       DRIVEN WITH REAL KEYSTROKES, because this is the whole report and the
       markup looked perfectly correct throughout: the handler ran, the state
       took the value, and regFiltered had stopped reading it. Only pressing
       the box a reader presses and counting the rows that come back can say
       so. MEASURED before the fix: four rows, type "lease", four rows. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(700);
    /* RE-POINTED IN PLACE 21 Sep 2026: it took the first word of `.reg-title`,
       which is the COUNTERPARTY now — and a seeded book where every row shares
       one counterparty gives a query that narrows nothing, which is a fault in
       the instrument and not in the search. The term comes off the row's own
       sub-line (the contract's name) and the match is judged against the same
       line, so the two halves ask about one thing. */
    /* RE-POINTED 21 Oct 2026 (Part 8): the sub-line under the party is "kind ·
       ref" now and the contract's name rides the agreement cell's hover, so
       the term and the match are both read off that hover */
    const term = await page.evaluate(() => {
      const t = document.querySelector('tr[data-row] td.reg-cell-title');
      return t ? (String(t.title || '').trim().split(/\s+/)[0] || '') : '';
    });
    /* RE-POINTED 29 Oct 2026 (round 1): typed into the list's own box (the bar's search left) */
    const searched = await page.evaluate(async (q) => {
      const box = document.querySelector('[data-lh-seat="contracts"] input[data-lh-q]');
      const before = document.querySelectorAll('tr[data-row]').length;
      box.focus(); box.value = q;
      box.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      const rows = [...document.querySelectorAll('tr[data-row] td.reg-cell-title')].map(e => String(e.title || '').trim());
      const head = document.querySelector('[data-lh-seat="contracts"] input[data-lh-q]');
      return { before, after: rows.length, rows, headBox: head ? head.value : null };
    }, term);
    check('17a a real query narrows the table',
      searched.before > 0 && searched.after > 0 && searched.after < searched.before,
      `${searched.before} rows → ${searched.after} for "${term}"`);
    check('17b and every row that comes back really matches',
      searched.rows.every(r => r.toLowerCase().includes(term.toLowerCase())),
      JSON.stringify(searched.rows));
    /* THE WAY BACK IS ON THE PAGE, not only in the box: a narrowing that draws
       no Clear leaves a reader who cannot see the shell bar with nothing to
       press — the exact fault the retirement was reasoning about. */
    /* RE-POINTED 21 Oct 2026 (Part 8; Q1 "keep both boxes"): the page says
       it is narrowed in its own box — the list head's shows the words the bar
       typed — and that box is the way back, as the bar's is (no Clear is
       drawn on the place, as the pick draws none) */
    check('17c and the page says it is narrowed, in its own box under the title',
      searched.headBox === term, JSON.stringify({ term, headBox: searched.headBox }));

    /* EVERY DRIVEN HALF IS GUARDED, so a build without the fix REPORTS its
       failures rather than aborting on the first missing control — a probe
       that throws proves nothing about the checks after it. */
    const cleared = await page.evaluate(async () => {
      const b = document.querySelector('[data-lh-seat="contracts"] input[data-lh-q]');
      if (!b) return { err: 'no list head box to empty' };
      b.focus(); b.value = ''; b.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      return { rows: document.querySelectorAll('tr[data-row]').length,
        q: regState().query };
    });
    check('17d emptying the page\'s box widens the list',
      !cleared.err && cleared.rows === searched.before && cleared.q === '',
      JSON.stringify(cleared));

    /* 17e RETIRED 29 Oct 2026 (round 1 "The Legora way", owner's yes): it measured the bar's search typed from another
       seat; the bar's search left, and a list's box writes only its own seat's query */
    /* ============ 18. EVERY COLUMN THAT CAN BE ORDERED SORTS ============
       PRESSED, not read: the attribute and the handler are wired separately
       and either one alone leaves a dead control — this file's own recorded
       lesson. And the ORDER is read back off the page, because a head that
       toggles its arrow while the rows stay put is the same dead press wearing
       a tick. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(700);
    const heads = await page.evaluate(() => [...document.querySelectorAll('.reg-table thead th')]
      .map(th => ({ text: th.textContent.replace(/[▲▼↕]/g, '').trim(), sort: th.getAttribute('data-reg-sort') })));
    /* RE-POINTED IN PLACE 24 Sep 2026: the stream column is gone from both
       seats (the owner's word, filter kept), so its head is gone with it; the
       sort by stream is still offered in the Sort dropdown — 18c2 below
       picks it there. */
    /* RE-POINTED 21 Oct 2026 (Part 8, the owner's pick): the reference rides
       the agreement cell on the place, so it has no head of its own there; the
       sort by reference is offered in the Sort box, and asked there below */
    /* RE-POINTED 27 Oct 2026 (THE LIST LANGUAGE): the stream head is drawn again, and it sorts */
    check('18a the agreement head sorts, the reference is in the Sort box, and the stream head sorts',
      heads.some(h => h.sort === 'party') && heads.some(h => h.sort === 'stream')
        && (await page.evaluate(() => !!document.querySelector('#reg-sort option[value="ref"]'))),
      JSON.stringify(heads.map(h => h.sort)));
    check('18b and the last column, which has no heading, still does not',
      heads.length > 0 && heads[heads.length - 1].sort === null,
      JSON.stringify(heads[heads.length - 1] || null));

    /* THE TABLE PAGES AT 40, so ascending and descending show two different
       slices of the book rather than one list reversed — the claim is that
       each page is in the order its own head says, and that the two do not
       open on the same row. Judged IN THE PAGE so the comparison uses the same
       Intl the product does, and with its own natural-key reading rather than
       the product's, or this would be checking the sort against itself. */
    const pressed = await page.evaluate(async () => {
      const nat = s => { const m = /^(.*?)(\d+)\s*$/.exec(s.trim());
        return m ? [m[1].toLowerCase(), +m[2]] : [s.trim().toLowerCase(), -1]; };
      const cmpNat = (a, b) => { const A = nat(a), B = nat(b);
        return A[0] < B[0] ? -1 : A[0] > B[0] ? 1 : A[1] - B[1]; };
      const cmpTxt = (a, b) => a.localeCompare(b);
      /* RE-POINTED IN PLACE 21 Sep 2026, TWICE OVER.
         (1) THE COLUMN WAS PINNED BY ITS INDEX — party 2, stream 3 — and both
         moved the day the title column went. The index is derived from
         REG_COL_KEYS now, which is the one list the head and the row are both
         emitted from, so a column that moves again takes this with it.
         (2) A CELL MAY BE TWO LINES: the identity cell holds the counterparty
         over the contract's name, and textContent runs them together. Where a
         cell has a leading line, that line is what the column is ordered by
         and what is read back. */
      /* RE-POINTED 21 Oct 2026 (Part 8): the paint's own keys (regColKeys),
         and the reference read off its one dress in the agreement cell */
      const idx = k => (typeof regColKeys === 'function' ? regColKeys() : []).indexOf(k);
      const cell = i => [...document.querySelectorAll('tr[data-row]')]
        .map(r => { const td = r.children[i]; if (!td) return '';
          const lead = td.querySelector('.reg-title');
          return (lead || td).textContent.trim(); })
        .filter(x => x && x !== '—');
      const refs = () => [...document.querySelectorAll('tr[data-row] td.reg-cell-title .hati-ref')].map(e => e.textContent.trim()).filter(Boolean);
      const ordered = (xs, cmp, sign) => xs.every((_, i) => i === 0 || sign * cmp(xs[i - 1], xs[i]) <= 0);
      const out = {};
      /* the reference: picked in the Sort box (it opens ascending), and the
         other way through the state the box writes */
      {
        const sel = document.getElementById('reg-sort');
        if (!sel || ![...sel.options].some(o => o.value === 'ref')) out.ref = { err: 'the Sort box offers no reference', n: 0 };
        else {
          sel.value = 'ref'; sel.dispatchEvent(new Event('change', { bubbles: true }));
          await new Promise(r => setTimeout(r, 450));
          const asc = refs(); const aria = regState().dir === 1 ? 'ascending' : 'descending';
          regState().dir = -1; regRepaint();
          await new Promise(r => setTimeout(r, 450));
          const desc = refs();
          out.ref = { n: asc.length, aria, head: [asc[0], desc[0]], up: ordered(asc, cmpNat, 1), down: ordered(desc, cmpNat, -1) };
        }
      }
      for (const [key, i, cmp] of [['party', idx('counterparty'), cmpTxt]]){
        const head = () => document.querySelector(`[data-reg-sort="${key}"]`);
        if (!head()){ out[key] = { err: 'no head sorts ' + key, n: 0 }; continue; }
        head().click();
        await new Promise(r => setTimeout(r, 450));
        const asc = cell(i);
        const aria = head() ? head().getAttribute('aria-sort') : null;
        if (head()) head().click();
        await new Promise(r => setTimeout(r, 450));
        const desc = cell(i);
        out[key] = { n: asc.length, aria, head: [asc[0], desc[0]],
          up: ordered(asc, cmp, 1), down: ordered(desc, cmp, -1) };
      }
      return out;
    });
    for (const key of ['ref', 'party']){
      const p = pressed[key];
      check(`18c ${key}: a press really reorders the column`,
        !p.err && p.n > 1 && p.head[0] !== p.head[1] && p.aria === 'ascending',
        p.err || `${p.n} rows · first asc "${p.head[0]}" vs first desc "${p.head[1]}" · aria ${p.aria}`);
      check(`18d ${key}: and each direction is really in that order`,
        !p.err && p.up && p.down, p.err || `up ${p.up} · down ${p.down}`);
    }

    /* 18c2 — THE SORT BY STREAM SURVIVES THE COLUMN. Picked in the Sort
       dropdown, the way a reader now reaches it, and the painted rows read
       back in stream order: each row's stream is looked up off its own record
       (there is no cell to read), compared with this file's own comparator. */
    const byStream = await page.evaluate(async () => {
      const sel = document.getElementById('reg-sort');
      if (!sel || ![...sel.options].some(o => o.value === 'stream')) return { err: 'the dropdown offers no stream sort' };
      sel.value = 'stream'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 500));
      const names = [...document.querySelectorAll('tr[data-row]')]
        .map(r => { const c = getContract(r.getAttribute('data-row')); return c ? regStreamName(c) : ''; })
        .filter(Boolean);
      const sign = regState().dir;
      const ok = names.every((_, i) => i === 0 || sign * names[i - 1].localeCompare(names[i]) <= 0);
      sel.value = 'updated'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      await new Promise(r => setTimeout(r, 300));
      return { n: names.length, ok, first: names[0], last: names[names.length - 1] };
    });
    check('18c2 the sort by stream is still there, in the dropdown, and it orders the rows',
      !byStream.err && byStream.n > 1 && byStream.ok,
      byStream.err || `${byStream.n} rows · "${byStream.first}" … "${byStream.last}"`);

    /* THE HEAD ROW STILL HOLDS ONE LINE. Three carets are three more glyphs on
       a row of fixed percentage widths, and Swedish's words are longer. */
    for (const [lang, w] of [['en', 1440], ['sv', 1280]]){
      await page.setViewportSize({ width: w, height: 900 });
      await page.evaluate(l => { if (window.langSet) langSet(l); if (window.setView) (regPlaceSet({ show: 'list' }), setView('register')); }, lang);
      await page.waitForTimeout(800);
      const row = await page.evaluate(() => {
        const ths = [...document.querySelectorAll('.reg-table thead th')];
        const tr = document.querySelector('.reg-table thead tr');
        return { h: +tr.getBoundingClientRect().height.toFixed(1),
          cell: Math.max(...ths.map(t => +t.getBoundingClientRect().height.toFixed(1))),
          side: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      check(`18e the head row is one line at ${w}px in ${lang}`,
        row.cell <= row.h + 1, JSON.stringify(row));
      check(`18f and the page never scrolls sideways at ${w}px in ${lang}`,
        row.side <= 0, `${row.side}px`);
    }
    await page.evaluate(() => { if (window.langSet) langSet('en'); });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(400);

    /* ---- 19. COPILOT IS TOLD WHICH PAGE THIS IS ----
       (owner-asked 10 Sep 2026: "the copilot is not aware of what is on the
       page".)

       IT HAS TO BE ASKED ON A REAL SHELL. The reading is provable in node; what
       cannot be staged there is a reader who OPENS a contract and then WALKS
       BACK to the register, which is the whole of how state.activeId comes to
       name a contract on a page that shows none. Against the code of an hour
       before, the brief tells Copilot a contract is open on the Contracts page.

       AND THE CONTRACT'S OWN ROOM IS THE CONTROL: a page that really does show
       one must still name it, or "no contract is claimed" is satisfied by a
       brief that has simply stopped saying anything. */
    await page.evaluate(() => (regPlaceSet({ show: 'list' }), setView('register')));
    await page.waitForTimeout(400);
    const brief = await page.evaluate(() => {
      const out = {};
      const first = (state.contracts[0] || {}).id || null;
      /* Open one, then walk back — the journey that leaves the global set. */
      if (first) openWorkspace(first, { room: true });
      out.room = (() => { const c = aiChatContext();
        return { id: c.activeContractId || null, page: c.page ? c.page.name : null,
          tab: c.page ? c.page.tab || null : null }; })();
      (regPlaceSet({ show: 'list' }), setView('register'));
      out.list = (() => { const c = aiChatContext();
        return { id: c.activeContractId || null, page: c.page ? c.page.name : null,
          matching: c.page ? c.page.matching : null,
          says: (typeof aiPageSays === 'function' ? aiPageSays(c.page) : '') }; })();
      out.opened = first;
      return out;
    });
    check('19 THE CONTROL: a contract\'s own room names the contract on screen',
      brief.room.id === brief.opened && brief.room.page === 'a contract',
      JSON.stringify(brief.room));
    check('19a THE REPORTED FAULT: back on Contracts, no contract is claimed open',
      brief.list.id === null, JSON.stringify(brief.list));
    check('19b and the page names itself instead',
      brief.list.page === 'Contracts', JSON.stringify(brief.list));
    check('19c with the number of rows it is actually showing',
      typeof brief.list.matching === 'number' && brief.list.matching > 0,
      String(brief.list.matching));
    check('19d and the sentence Copilot reads says so',
      /on the Contracts page/.test(brief.list.says) && /rows? match/.test(brief.list.says),
      brief.list.says.slice(0, 200));

    check('the page threw nothing', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
