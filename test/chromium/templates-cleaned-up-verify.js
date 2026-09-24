/* Chromium verification: THE TEMPLATES PAGE, CLEANED UP (19 Sep 2026).
   ====================================================================
   Eight reports off five screenshots. f334 pins the machinery; every claim
   here is a GEOMETRY, a PAINT or a PRESS, because that is the only instrument
   that can answer the four that matter most:

     · "where does this row's first button start" is a resolved x-position,
       and the fault was three different ones down one column — invisible in
       the source, where every row is built by the same function;
     · "does this menu look like a list of buttons" is computed style on a
       painted row, not markup;
     · "is this a sheet" is a background, a shadow and a width the browser
       resolved from four tokens;
     · "does a press throw me to the top" can only be asked of a real
       scroller after a real click.

   AND THE REGRESSION THIS FILE EXISTS TO CATCH. Fix 1 removed an `opacity:0`
   rule; a source test can only prove the rule is gone from the sheet, never
   that some later rule does the same thing again. This measures the PAINTED
   opacity with the pointer parked off the table.

   Run: node test/chromium/templates-cleaned-up-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'templates-cleaned-up');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* A MIXED BOOK IS THE POINT OF SECTION 2. The alignment fault only appears
   where the kinds differ, because each kind draws a different set of verbs —
   measured at the parent: saved templates x=1236, HaTi's own x=1195, samples
   x=1316. One kind of row lines up with itself no matter what. */
const SEED = () => {
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  const V = (category, status) => ({ category, status, quote: '', position: '', redline: '', escalate: false });
  const mk = (id, tpl, days, vs) => ({
    id, name: 'Staged ' + id, counterparty: 'Naivas', status: 'Under Review',
    template: tpl, folder: 'proc', value: 1000000, valueType: 'estimated',
    _raisedAt: ago(days), audit: [{ action: 'Created', at: ago(days), user: 'Amina' }],
    changes: [], playbook: vs ? { verdicts: vs } : undefined,
  });
  state.contracts.unshift(
    mk('H1', 'PS', 5, [V('Liability cap', 'deviation'), V('Payment terms', 'deviation')]),
    mk('H2', 'PS', 9, [V('Liability cap', 'deviation')]),
    mk('H3', 'PS', 20, [V('Liability cap', 'ok')]),
    mk('H4', 'PS', 300, null),
    mk('H5', 'RM', 4, [V('Payment terms', 'missing')]),
    mk('H6', 'RM', 6, [V('Payment terms', 'ok')]),
    mk('H7', 'RM', 8, [V('Governing law', 'ok')]),
    mk('H8', 'LE', 3, [V('Confidentiality', 'ok')]),
    mk('H9', 'LE', 7, [V('Confidentiality', 'ok')]),
  );
  const saved = [];
  for (let i = 0; i < 3; i++) saved.push({
    id: 'CT-' + i, name: 'Saved template ' + i, folder: 'proc', at: ago(20 + i),
    source: 'paste', format: 'plain', text: 'x'.repeat(400),
    fields: i % 2 ? [{ key: 'party', label: 'Party' }] : [],
  });
  try { saveCustomTemplates(saved); } catch (e) { state.settings.customTemplates = saved; }
  setView('templates');
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  /* 520 high on purpose: at 1000 the table fits the window and nothing
     scrolls, so section 5 could not fail even if the fix were reverted. */
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 520 } });
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
    await page.evaluate(SEED);
    await pause(1600);

    /* ============ 1 · EVERY VERB IS PAINTED, WITH NO POINTER ON IT ======== */
    /* The pointer is parked in the top-left corner before anything is read —
       Playwright's mouse persists between actions, and a hover left sitting
       on row one would show exactly what this is here to catch. */
    await page.mouse.move(2, 2);
    await page.evaluate(() => { tplGoBucket('all'); });
    await pause(700);
    await page.evaluate(() => { const b = document.getElementById('tpl-showall'); if (b) b.click(); });
    await pause(700);
    await page.mouse.move(2, 2);
    await pause(200);

    const verbs = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#tpl-rows tr')].slice(1);
      return rows.map(tr => {
        const bs = [...tr.querySelectorAll('button')];
        return {
          name: (tr.querySelector('td') || { textContent: '' }).textContent.trim().split('\n')[0].slice(0, 26),
          n: bs.length,
          firstX: bs[0] ? Math.round(bs[0].getBoundingClientRect().x) : null,
          /* EFFECTIVE opacity, walked to the root and multiplied. Opacity is
             not inherited: it is a rendering effect on the ancestor, so
             getComputedStyle(button).opacity reads 1 while an `opacity:0`
             wrapper hides it — measured at the parent, .tpl-rest read 0 and
             every button inside it read 1. */
          opacities: [...new Set(bs.map(b => {
            let o = 1, el = b;
            while (el && el !== document.documentElement) {
              o *= Number(getComputedStyle(el).opacity);
              el = el.parentElement;
            }
            return String(o);
          }))],
          widths: bs.map(b => Math.round(b.getBoundingClientRect().width)),
          filled: bs.filter(b => b.classList.contains('ui-btn-primary')).length,
        };
      });
    });
    check('1a · the table draws rows of more than one kind, or nothing below can fail',
      verbs.length >= 12 && new Set(verbs.map(v => v.n)).size > 1,
      { rows: verbs.length, verbCounts: [...new Set(verbs.map(v => v.n))] });
    /* The default headless pointer DOES hover — verified — but if a later
       runner changed that, the parent's `@media (hover:none)` branch would
       draw every verb at 1 and 1b would pass on the build it exists to
       catch. So the stage states its own capability. */
    check('1b0 · the stage really has a hovering pointer, or 1b proves nothing',
      await page.evaluate(() => matchMedia('(hover: hover)').matches),
      { hover: await page.evaluate(() => matchMedia('(hover: hover)').matches) });
    check('1b · every verb on every row is painted at full opacity, pointer parked off the table',
      verbs.length > 0 && verbs.every(v => v.opacities.length && v.opacities.every(o => Number(o) === 1)),
      verbs.filter(v => v.opacities.some(o => Number(o) !== 1)).slice(0, 3));
    check('1c · and no verb has been given zero width instead',
      verbs.every(v => v.widths.every(w => w > 20)),
      verbs.filter(v => v.widths.some(w => w <= 20)).slice(0, 3));
    check('1d · the hover wrapper is nowhere in the page',
      await page.evaluate(() => document.querySelectorAll('.tpl-rest').length) === 0);

    /* ============ 2 · ONE STRAIGHT COLUMN ================================= */
    const xs = [...new Set(verbs.map(v => v.firstX))];
    check('2a · every row’s first verb starts on ONE line, whatever kind of row it is',
      xs.length === 1, { distinctLeftEdges: xs, measuredAtParent: [1195, 1236, 1316] });
    check('2b · and it is the same line for a row with one verb as for a row with three',
      new Set(verbs.filter(v => v.n === 1).map(v => v.firstX)).size <= 1
      && (verbs.find(v => v.n === 1) || {}).firstX === (verbs.find(v => v.n === 3) || {}).firstX,
      { oneVerb: (verbs.find(v => v.n === 1) || {}).firstX, threeVerbs: (verbs.find(v => v.n === 3) || {}).firstX });
    check('2c · at most one filled button per row — the row is scanned by weight, not by count',
      verbs.every(v => v.filled <= 1), verbs.filter(v => v.filled > 1).slice(0, 3));

    await page.screenshot({ path: path.join(OUT, '01-table.png'), fullPage: true });

    /* ============ 3 · THE MENU LOOKS LIKE A MENU ========================== */
    await page.evaluate(() => { tplRowMoreMenu('cp:CT-1'); });
    await pause(600);
    const menu = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('.tpl-m-row')];
      return {
        rows: rows.map(r => {
          const s = getComputedStyle(r);
          const sym = r.querySelector('svg');
          const box = sym && sym.getBBox ? sym.getBBox() : null;
          return {
            text: r.textContent.trim().replace(/\s+/g, ' '),
            title: (r.getAttribute('title') || '').length,
            h: Math.round(r.getBoundingClientRect().height),
            symPainted: !!(box && box.width > 0 && box.height > 0),
            ink: s.color,
          };
        }),
        seps: document.querySelectorAll('.tpl-m-sep').length,
        /* the frame's own width, from the ladder, not the backdrop's */
        frameW: (() => {
          const r = document.querySelector('.tpl-m-list');
          let el = r; while (el && !/^\d/.test('')) { el = el.parentElement;
            if (!el || el.id === 'modal-root') break; }
          const f = document.querySelector('#modal-root [style*="max-width"]');
          return f ? Math.round(f.getBoundingClientRect().width) : null;
        })(),
      };
    });
    check('3a · the menu draws several rows, each a real control with its symbol PAINTED',
      menu.rows.length >= 4 && menu.rows.every(r => r.symPainted),
      { n: menu.rows.length, unpainted: menu.rows.filter(r => !r.symPainted).map(r => r.text) });
    /* `[].every()` is TRUE, so a vacuous pass is a description — at the parent
       there is no `.tpl-m-row` in the page at all and both of these read green
       on the build they exist to catch. The length is asserted first. */
    check('3b · every row is one line tall — the 54px two-line paragraph is gone',
      menu.rows.length >= 4 && menu.rows.every(r => r.h > 24 && r.h <= 44), menu.rows.map(r => r.h));
    check('3c · and the sentence it used to print is on the hover instead',
      menu.rows.length >= 4 && menu.rows.every(r => r.title > 10), menu.rows.map(r => r.title));
    check('3d · the destructive row is ruby, and sits under a divider',
      menu.seps === 1 && menu.rows.length > 1
      && menu.rows[menu.rows.length - 1].ink !== menu.rows[0].ink,
      { seps: menu.seps, last: menu.rows[menu.rows.length - 1] || null, first: (menu.rows[0] || {}).ink || null });
    check('3e · the frame is the ladder’s small rung, not the 490 measured at the parent',
      menu.frameW != null && menu.frameW <= 420, { frameW: menu.frameW });
    await page.screenshot({ path: path.join(OUT, '02-menu.png') });
    await page.evaluate(() => { try { closeModal(); } catch (e) {} });
    await pause(400);

    /* ============ 4 · HOW THE PAPER IS DOING, AND WHERE IT WENT ==========
       ════ RE-POINTED IN PLACE, 19 Sep 2026 ═══════════════════════════════
       This section drove the FIRST TAB, and hours after it was written the
       owner said *"delete the templates overview page"* (option (a) of the
       three he was offered): the book's own glance already opens with this
       card's headline, *Came back changed*, and two tabs leading with one
       number is the fault this product keeps paying for.

       EVERY MEASUREMENT THE SECTION EXISTS FOR SURVIVES, because the reading
       does: tplHealthData / tplHealthHtml are kept whole and unreferenced,
       the way tplOverviewHtml beside them is kept. So the card is MOUNTED
       off-screen at a real width and measured there — the bars are still
       compared down a column, the segments still have to fill them, and the
       words still have to lead with the right figure. It is torn down again
       before section 5 measures the page as a reader has it.

       WHAT REALLY MOVED is the pair of DOOR claims. Those doors are drawn by
       the two panels, and the panels are on THE BOOK now — so 4f and 4g are
       measured there, on the page, with a real press. */
    const gone = await page.evaluate(() => ({
      sec: !!document.querySelector('[data-tpl-sec="overview"]'),
      tab: !!document.querySelector('[data-tpl-tab="overview"]'),
      rows: document.querySelectorAll('.tpl-h-row').length,
      built: typeof tplHealthHtml === 'function' && typeof tplHealthData === 'function',
    }));
    check('4a · the tab is gone from the page, and the reading is on the shelf',
      !gone.sec && !gone.tab && gone.rows === 0 && gone.built, gone);

    const health = await page.evaluate(() => {
      const host = document.createElement('div');
      host.id = 'tpl-health-probe';
      /* BESIDE the page, never over it — templates-tabs-verify's own probe
         and its own reason: at left:0 it covers the tab row and Playwright's
         clicks time out against it. Off-screen still reports real widths,
         which is all this section asks. */
      host.style.cssText = 'position:absolute;left:-4000px;top:0;width:1218px';
      host.innerHTML = tplHealthHtml(tplHealthData());
      document.body.appendChild(host);
      const sec = host;
      const bars = [...sec.querySelectorAll('.tpl-h-row')].map(r => {
        const seg = [...r.querySelectorAll('i')].map(i => Math.round(i.getBoundingClientRect().width));
        const tr = r.querySelector('div[style*="height:7px"]');
        return { w: tr ? Math.round(tr.getBoundingClientRect().width) : null, seg };
      }).filter(b => b.w);
      return {
        rows: sec.querySelectorAll('.tpl-h-row').length,
        doors: sec.querySelectorAll('[data-tpl-ov-card]').length,
        buckets: sec.querySelectorAll('[data-tpl-ov-bucket]').length,
        bars,
        text: sec.textContent.replace(/\s+/g, ' ').trim(),
        h: Math.round(sec.getBoundingClientRect().height),
      };
    });
    check('4a2 · the shelved reading still draws, and is not the category wall',
      health.h > 200 && health.buckets === 0 && health.rows >= 3,
      { h: health.h, buckets: health.buckets, rows: health.rows });
    check('4b · it leads with how much of our paper comes back changed',
      /% of our paper comes back changed/.test(health.text)
      || /of our paper comes back changed/.test(health.text), health.text.slice(0, 120));
    check('4c · what nobody has checked is its own figure, never folded into the good half',
      /drafted but never checked/.test(health.text) && /counted as unknown/.test(health.text));
    /* A BAR IS A MEASURE. Two bars a reader compares down a column must be the
       same length, or the longer row's bar reads as the bigger number. */
    check('4d · every bar is the same length, so the segments are the only difference',
      health.bars.length >= 2 && new Set(health.bars.map(b => b.w)).size === 1,
      { widths: [...new Set(health.bars.map(b => b.w))] });
    check('4e · and a bar’s segments fill it — nothing is dropped off the end',
      health.bars.every(b => Math.abs(b.seg.reduce((n, x) => n + x, 0) - b.w) <= 2),
      health.bars.slice(0, 3));
    await page.evaluate(() => { const h = document.getElementById('tpl-health-probe'); if (h) h.remove(); });

    /* THE NAME DOOR IS ON THE BOOK NOW — the two panels moved there with the
       card wall, and there the handler renderTemplatesPage bound really fires.
       A press on the probe above would reach nothing: it is markup mounted
       after the wiring ran. */
    await page.evaluate(() => tplPageSetTab('book'));
    await pause(700);
    const bk = await page.evaluate(() => ({
      doors: document.querySelectorAll('[data-tpl-sec="book"] [data-tpl-ov-card]').length,
      h: Math.round(document.querySelector('[data-tpl-sec="book"]').getBoundingClientRect().height),
    }));
    check('4f · the book draws the name door, and it is drawn in real pixels',
      bk.doors >= 1 && bk.h > 200, bk);
    await page.screenshot({ path: path.join(OUT, '03-health.png'), fullPage: true });

    /* pressing one lands on the table, narrowed */
    const landed = await page.evaluate(async () => {
      const b = document.querySelector('[data-tpl-sec="book"] [data-tpl-ov-card]');
      const name = b.getAttribute('data-tpl-ov-name');
      b.click();
      await new Promise(r => setTimeout(r, 400));
      return { name, tab: tplPageTab(), q: (document.getElementById('tpl-search') || {}).value };
    });
    check('4g · and pressing it lands on the table, narrowed to that template',
      landed.tab === 'list' && landed.q === landed.name, landed);

    /* ============ 5 · A FILTER KEEPS THE READER'S PLACE =================== */
    await page.evaluate(() => { tplGoBucket('all'); });
    await pause(600);
    await page.evaluate(() => { const b = document.getElementById('tpl-showall'); if (b) b.click(); });
    await pause(600);
    const kept = await page.evaluate(async () => {
      const el = () => document.getElementById('content-scroll') || document.scrollingElement;
      el().scrollTop = 420;
      await new Promise(r => setTimeout(r, 200));
      const before = el().scrollTop;
      const node = document.getElementById('tpl-rows');
      const search = document.getElementById('tpl-search');
      const btn = [...document.querySelectorAll('[data-tpl-group]')]
        .find(b => b.getAttribute('data-tpl-group') === 'ready');
      const t = performance.now();
      btn.click();
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const after = el().scrollTop;
      const max = el().scrollHeight - el().clientHeight;
      return {
        before, after, max, ms: +(performance.now() - t).toFixed(1),
        sameTable: node === document.getElementById('tpl-rows'),
        sameSearch: search === document.getElementById('tpl-search'),
        lit: [...document.querySelectorAll('[data-tpl-group].on')].map(b => b.getAttribute('data-tpl-group')),
      };
    });
    check('5a · the stage really scrolls, or this section proves nothing',
      kept.before > 100, { scrollReached: kept.before });
    /* AND A CORRECTION. This section first claimed the parent threw the reader
       to the top (420 → 0). Driven across four presses on both builds, the
       scroll lands on the SAME number either way — the browser clamps it to
       what the new page can hold, and the handler's own `showAll=false` is
       what shortens the page. So the scroll is asserted as a floor (it is
       never worse than the clamp) and the claim that carries this fix is 5c:
       the table the reader was looking at survives the press. */
    check('5b · the reader\u2019s place is never worse than what the new page can hold',
      kept.after === kept.before || kept.after === kept.max,
      { before: kept.before, after: kept.after, pageMax: kept.max,
        note: 'true at the parent too — 5c and 5d are what this fix moves' });
    check('5c · the table they were reading is the SAME NODE afterwards (false at the parent)',
      kept.sameTable, { sameTable: kept.sameTable });
    check('5d · and so are the rail and the search box — nothing was rebuilt',
      kept.sameSearch && kept.lit.length === 1 && kept.lit[0] === 'ready', kept.lit);

    /* ============ 6 · THE WORDING SITS ON PAPER ========================== */
    /* RE-POINTED IN PLACE, 24 Sep 2026 (one door to standards): "Make it
       ours" is a shortcut INTO the one door now — it opens "From a template
       you have" on HaTi's own tab with this template already chosen — so the
       copy is made by the press a reader makes there, not by the shortcut. */
    await page.evaluate(() => { if (typeof tplMakeItOurs === 'function') tplMakeItOurs('PS'); });
    await pause(700);
    await page.evaluate(() => { const b = document.getElementById('ns-go'); if (b && !b.disabled) b.click(); });
    await pause(3500);
    await page.evaluate(() => { try { closeModal(); } catch (e) {} });
    await pause(400);
    const opened = await page.evaluate(async () => {
      const all = (typeof tplLibAll === 'function') ? tplLibAll() : { list: [] };
      const t = (all.list || [])[0];
      if (!t) return null;
      openTemplateLibDetail(t.id);
      return t.id;
    });
    await pause(2600);
    const sheet = await page.evaluate(() => {
      const el = document.querySelector('.blueprint');
      if (!el) return null;
      const r = el.getBoundingClientRect(), s = getComputedStyle(el);
      const host = el.parentElement.getBoundingClientRect();
      const doc = el.querySelector('.hati-doc');
      const art = el.querySelector('article.doc-surface');
      return {
        w: Math.round(r.width), bg: s.backgroundColor, shadow: s.boxShadow !== 'none',
        border: s.borderTopWidth, radius: s.borderTopLeftRadius,
        leftGap: Math.round(r.left - host.left), rightGap: Math.round(host.right - r.right),
        pairing: !!(art && doc && art.contains(doc)),
        clipped: !!document.querySelector('[style*="max-height:420px"]'),
        docH: doc ? Math.round(doc.getBoundingClientRect().height) : 0,
      };
    });
    check('6a · a template’s wording is on a sheet at all', !!opened && !!sheet, { opened });
    check('6b · warm ground and a real shadow — measured transparent and none at the parent',
      sheet && sheet.bg !== 'rgba(0, 0, 0, 0)' && sheet.shadow,
      sheet && { bg: sheet.bg, shadow: sheet.shadow });
    check('6c · a reading width, not the whole monitor (1194px at the parent)',
      sheet && sheet.w > 400 && sheet.w <= 900, sheet && { w: sheet.w });
    check('6d · and it is centred in its column',
      sheet && Math.abs(sheet.leftGap - sheet.rightGap) <= 2,
      sheet && { left: sheet.leftGap, right: sheet.rightGap });
    check('6e · THE CONTRACT STAYS SQUARE — the platform’s 2px corner is not on the paper',
      sheet && sheet.radius === '0px', sheet && { radius: sheet.radius });
    check('6f · the article/div pairing is what carries the design’s face',
      sheet && sheet.pairing);
    check('6g · the 420px clip is gone and the wording is as long as it is',
      sheet && !sheet.clipped && sheet.docH > 420,
      sheet && { clipped: sheet.clipped, docH: sheet.docH });
    await page.screenshot({ path: path.join(OUT, '04-sheet.png'), fullPage: true });

    check('7 · no page errors anywhere in the run', errors.length === 0, errors.slice(0, 5));
  } catch (e) {
    check('run completed', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})();
