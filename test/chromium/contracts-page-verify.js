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
    await page.evaluate(() => setView('register'));
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
    check('1a the row is exactly 36px', rows.h === 36, `${rows.h}px`);
    check('1b and EVERY row is, not just the first',
      rows.all.every(x => x === 36), JSON.stringify(rows.all));

    /* THE DOCUMENT TYPE IS GONE AS PIXELS — and its fact is still said. */
    const kind = await page.evaluate(() => {
      const t = document.querySelector('tr[data-row] .reg-title');
      return { kindEls: document.querySelectorAll('.reg-kind').length,
        title: t ? t.getAttribute('title') : null,
        lineH: t ? +t.getBoundingClientRect().height.toFixed(1) : null };
    });
    check('1c no row draws a document-type line', kind.kindEls === 0, `${kind.kindEls} found`);
    check('1d the title is a SINGLE line box', kind.lineH != null && kind.lineH <= 21, `${kind.lineH}px`);
    check('1e and the kind is still said, on the title\'s own hover',
      !!kind.title && /·/.test(kind.title), kind.title);

    /* ============ 2. THE STAGE IS A DOT AND A WORD, NOT A CHIP ============ */
    const stage = await page.evaluate(() => {
      const s = document.querySelector('tr[data-row] .reg-stg');
      if (!s) return { err: 'no .reg-stg' };
      const cs = getComputedStyle(s);
      const dot = s.querySelector('i');
      const dcs = dot ? getComputedStyle(dot) : null;
      return {
        word: s.textContent.trim(),
        ink: cs.color,
        dotW: dcs ? dcs.width : null,
        dotBg: dcs ? dcs.backgroundColor : null,
        radius: dcs ? dcs.borderRadius : null,
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
    check('2a the stage draws a dot beside a word',
      !stage.err && stage.dotW === '8px' && /50%/.test(stage.radius || ''),
      `${stage.dotW} ${stage.radius}`);
    check('2b the word carries the meaning ink, so colour is not the only carrier',
      !!stage.word && stage.ink !== 'rgb(0, 0, 0)', `"${stage.word}" ${stage.ink}`);
    /* THE DOT AND THE WORD ARE TWO SHADES OF ONE TONE, DELIBERATELY — the
       meta's brighter `dot` against its darker `fg`, which is what every chip
       in this product already does and what keeps a 14px word readable while
       an 8px circle still catches the eye. What matters is that BOTH come from
       the one meta, so they can never name different tones: asserted by their
       hues agreeing while their lightness differs. */
    check('2c the dot and the word are two shades of ONE tone',
      stage.dotBg !== stage.ink && stage.hueMatch,
      `${stage.dotBg} vs ${stage.ink}`);
    check('2d no filled chip is left in a row', stage.chips === 0, `${stage.chips} chips`);

    /* ============ 3. THE COLUMNS ARE THE DESIGN'S ============ */
    const cols = await page.evaluate(() => ({
      heads: [...document.querySelectorAll('.reg-table thead th')]
        .map(t => t.textContent.replace(/[▲▼↕⇅]/g, '').trim()),
      streamCell: (() => { const td = document.querySelectorAll('tr[data-row] td')[3];
        return td ? td.textContent.trim() : null; })(),
      tick: !!document.querySelector('tr[data-row] .reg-tick'),
      linkCells: document.querySelectorAll('tr[data-row] .share-dot, tr[data-row] [data-share-dot]').length,
    }));
    check('3a the value stream is a column of its own',
      cols.heads.some(x => /value stream|affärsområde/i.test(x)), cols.heads.join(' · '));
    check('3b and it is written out on the row, not only ticked',
      !!cols.streamCell && cols.streamCell !== '—', cols.streamCell);
    check('3c the 3px tick survives beside the title', cols.tick);
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

    /* ============ 5. A FILTER SAYS WHAT IT FILTERS ============ */
    const filters = await page.evaluate(() => {
      const ls = [...document.querySelectorAll('.reg-f')];
      return {
        n: ls.length,
        labelled: ls.filter(l => (l.querySelector('.reg-f-l') || {}).textContent).length,
        /* THE LABEL'S TEXT, not any box. Two drafts measured boxes and both
           reported the SEARCH filter's legitimate 300px column: .reg-f is the
           control's width, and .reg-f-l is a block that FILLS it. A claim about
           a label being a sentence is a claim about its words. */
        widest: Math.max(...ls.map(l => {
          const t = l.querySelector('.reg-f-l');
          return t ? t.textContent.trim().length : 0; })),
        texts: ls.map(l => (l.querySelector('.reg-f-l') || {}).textContent),
        /* the bar must not have been pushed onto a second row by a long label */
        oneRow: new Set(ls.map(l => Math.round(l.getBoundingClientRect().top))).size,
      };
    });
    check('5a every filter carries a visible label',
      filters.n >= 5 && filters.labelled === filters.n, `${filters.labelled}/${filters.n}`);
    /* The fault this guards: "Saved views — expiry, auto-renewal and
       obligation presets" (57 characters) used as a LABEL, which ran to 460px
       and pushed the bar off its row. The sentence is the tooltip now. */
    check('5b no label is a sentence — the long one stays a tooltip',
      filters.widest <= 24, `longest label ${filters.widest} chars`);
    check('5c and they sit on one row at 1440', filters.oneRow === 1,
      `${filters.oneRow} rows: ${filters.texts.join(' | ')}`);

    /* ============ 6. THE PAGE STILL WORKS ============ */
    /* A row press must still open the contract — the verb's whole job. */
    await page.evaluate(() => document.querySelector('tr[data-row]').click());
    await page.waitForTimeout(1600);
    const landed = await page.evaluate(() => window.state && state.view);
    check('6a pressing a row still opens the contract', landed === 'workspace', String(landed));

    /* ============ 7. THE SAME TABLE ON THE OTHER SEAT ============ */
    /* Negotiations IS this renderer. With nothing live it draws its own empty
       card rather than a table, which is correct and is asserted as such —
       a check that silently found no table would pass on a broken page. */
    /* THE DOOR, NOT setView — a bare setView('redline') reads state.activeId,
       which still holds the contract step 6 just opened, so it would land on
       THAT contract's bench rather than the list. The nav press is the door
       this page documents, and it is what a reader actually does. */
    await page.click('.nav-item[data-view="redline"]');
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

    /* ============ 8. THE FILTER AREA IS ONE WHITE BAND ============ */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(1500);
    const band = await page.evaluate(() => {
      const box = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(), c = getComputedStyle(e);
        return { top: Math.round(r.top), bottom: Math.round(r.bottom),
          left: Math.round(r.left), w: Math.round(r.width), bg: c.backgroundColor }; };
      const f = [...document.querySelectorAll('.reg-f')];
      return { head: box('#page-head'), band: box('.reg-band'), body: box('.reg-table'),
        first: f.length ? (f[0].querySelector('.reg-f-l') || {}).textContent : null,
        tops: f.map(x => Math.round(x.getBoundingClientRect().top)),
        search: !!document.querySelector('.reg-f #reg-search') };
    });
    check('8a the filter area is a WHITE band, not the page ground',
      band.band && band.band.bg === 'rgb(255, 255, 255)', band.band && band.band.bg);
    check('8b the page name sits on that same band',
      band.head && band.head.bg === 'rgb(255, 255, 255)', band.head && band.head.bg);
    /* NO GREY BETWEEN THEM — two white boxes with a gap is two bands, which is
       exactly what the design does not draw. */
    check('8c and there is no grey seam between the two',
      band.band.top <= band.head.bottom, `head ends ${band.head.bottom}, band starts ${band.band.top}`);
    check('8d the band bleeds to the page edge, like the room head does',
      band.band.left === band.head.left, `${band.band.left} vs ${band.head.left}`);

    /* SEARCH IS A FILTER, AND THE FIRST ONE — the design's own order. */
    check('8e search is a labelled filter, not a strip of its own',
      band.search && /search|sök/i.test(band.first || ''), band.first);
    check('8f and every filter shares one row',
      new Set(band.tops).size === 1, JSON.stringify(band.tops));

    /* ============ 9. THE BAND DOES NOT LEAK TO OTHER PAGES ============ */
    /* #page-head is the SHELL's element and is painted from this view's own
       stylesheet, which is injected with the view's markup. That is only safe
       if leaving really takes it away — so it is asked, not assumed. */
    await page.evaluate(() => setView('dashboard'));
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
    await page.evaluate(() => setView('register'));
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
      renderRegister();
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
    const pages = [];
    for (const n of [1, 2, 3, 4]){
      if (n > 1){
        await page.evaluate(k => { const b = [...document.querySelectorAll('#reg-pager button')]
          .find(x => x.textContent.trim() === String(k)); b && b.click(); }, n);
        await page.waitForTimeout(900);
      }
      pages.push(await page.evaluate(READ));
    }
    check('10a the fixture really turns the page, so the claim can fail',
      new Set(pages.map(p => p.first)).size === 4, pages.map(p => p.first).join(' · '));
    check('10b every column is the same width on every page',
      pages.every(p => String(p.w) === String(pages[0].w)),
      pages.map(p => p.w.join(',')).join('  |  '));
    check('10c and it is a guarantee — the table lays out fixed',
      pages[0].layout === 'fixed', pages[0].layout);
    check('10d nothing scrolls left to right, on any page',
      pages.every(p => p.sideways === 0), pages.map(p => p.sideways).join(','));

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
    check('11a the negotiations list draws the same table', !!nego && nego.w.length === 8,
      nego && nego.w.join(','));
    check('11b at the same type size as Contracts',
      nego && nego.fs === pages[0].fs, `${nego && nego.fs} vs ${pages[0].fs}`);
    check('11c its columns are fixed too, and it does not scroll sideways',
      nego && nego.layout === 'fixed' && nego.sideways === 0,
      nego && `${nego.layout} · ${nego.sideways}px`);
    /* THE SIX SHARED COLUMNS — MK, counterparty, stream, value, expiry, status */
    const SHARED = [0, 2, 3, 4, 5, 6];
    check('11d and the six columns both tables share are cut identically',
      nego && SHARED.every(i => nego.w[i] === pages[0].w[i]),
      nego && SHARED.map(i => `${pages[0].w[i]}/${nego.w[i]}`).join(' '));

    check('the page threw nothing', errors.length === 0, errors.join(' | '));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
