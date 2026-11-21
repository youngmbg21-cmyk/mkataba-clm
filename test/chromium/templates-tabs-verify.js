/* Chromium verification: THE TEMPLATES PAGE IS TWO TABS.
   ============================================================
   Owner-asked 25 Aug 2026, off the demo: "Image 1 from the demo should be the
   first tab called Templates overview. Image 2 should be the 2nd tab which is
   what is currently in the platform and that will be called Templates. The
   connect the two to function together."

   RE-POINTED 19 Sep 2026, TWICE IN ONE DAY. "The book" joined the row in the
   morning and *"delete the templates overview page"* took the overview out of
   it in the afternoon. THE TABS ARE TWO AGAIN and the first one is the book,
   which draws the card wall this file has always measured — so nearly every
   press here moved one name and no claim moved at all.

   RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): the page has NO tab row now — the book is
   three steps (Shelves › a folder's list › the paper) and the table has no door in the new look. Sections 1, 4, 9
   and the New standard section ask their promises of the steps and of the one door (New agreement › From scratch);
   each says what moved where it stands.

   WHY A BROWSER FILE. f244 pins the arithmetic and the words; every claim here
   is a PRESS or a GEOMETRY, and this codebase's most expensive lesson is that
   a rule losing a cascade fight looks perfectly correct in the source. Three
   of these could sail past a source test in exactly that way:

     · a tab that flips a `hidden` attribute proves nothing about whether the
       table left the screen — .st-tab and the sections are dressed by rules in
       index.html, and `hidden` is beaten by any display declaration (this is
       the .ui-btn[hidden] fight, already paid for once);
     · the cards are a grid whose column count is a media query, so whether
       the wall fits its column can only be asked of a real window;
     · "the two tabs work together" is a JOURNEY — press a card, land on the
       table, find it narrowed — and a handler that is attached is not a
       handler that lands.

   THE TYPE CLAIMS ARE RELATIONS. The tab row is compared against the Settings
   page's own row rather than against a typed colour, because both read one
   rule and the point is that they cannot drift.

   Run: node test/chromium/templates-tabs-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'templates-tabs');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* The seeded portfolio is stamped `seeded`, and builtinUsageRows excludes it
   on purpose — HaTi's own sample book is not this workspace's usage. So the
   overview would draw every figure as a zero and never exercise the branch
   that matters. Four contracts are staged against one built-in template: three
   raised inside the 90-day window, three checked against the playbook and two
   of those off-standard, one raised long ago and one never checked. */
const SEED = () => {
  const ago = d => new Date(Date.now() - d * 86400000).toISOString();
  const mk = (id, tpl, days, pb) => ({
    id, name: 'Staged ' + id, counterparty: 'Naivas', status: 'Under Review',
    template: tpl, folder: 'proc', value: 1000000, valueType: 'estimated',
    _raisedAt: ago(days), audit: [{ action: 'Created', at: ago(days), user: 'Amina' }],
    changes: [], playbook: pb || undefined,
  });
  const dev = { verdicts: [{ status: 'deviation' }] };
  const ok = { verdicts: [{ status: 'ok' }] };
  const rows = [
    /* HIGH — two of three checked off-standard, and one never checked. This is
       the card every honesty claim below is read off, and the rate that must
       draw ruby AND raise a row in Needs attention. */
    mk('ST-1', 'PS', 5, dev), mk('ST-2', 'PS', 9, dev), mk('ST-3', 'PS', 20, ok), mk('ST-4', 'PS', 300, null),
    /* MIDDLING — one of four, 25%, the first rung of amber. */
    mk('ST-5', 'RM', 4, dev), mk('ST-6', 'RM', 6, ok), mk('ST-7', 'RM', 8, ok), mk('ST-8', 'RM', 11, ok),
    /* CLEAN — nothing off-standard, which is the demo card's own green. */
    mk('ST-9', 'LE', 3, ok), mk('ST-10', 'LE', 7, ok), mk('ST-11', 'LE', 12, ok),
  ];
  state.contracts.unshift(...rows);
  setView('templates');
};

const BOX = sel => {
  const e = document.querySelector(sel); if (!e) return null;
  const r = e.getBoundingClientRect(), s = getComputedStyle(e);
  return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height),
    display: s.display, vis: s.visibility, txt: e.textContent.trim().slice(0, 60) };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
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
    await page.evaluate(SEED);
    await pause(1400);
    await page.screenshot({ path: path.join(OUT, '01-overview.png'), fullPage: true });

    /* ================= 1 · THE ROW, AND WHERE A READER LANDS ================ */
    const tabs = await page.evaluate(() => {
      const t = [...document.querySelectorAll('[data-tpl-tab]')].map(e => {
        const s = getComputedStyle(e), r = e.getBoundingClientRect();
        return { k: e.getAttribute('data-tpl-tab'), txt: e.textContent.trim(),
          on: e.classList.contains('on'), sel: e.getAttribute('aria-selected'),
          weight: s.fontWeight, color: s.color, size: s.fontSize,
          x: Math.round(r.x), w: Math.round(r.width), h: Math.round(r.height) };
      });
      const secBox = k => {
        const e = document.querySelector(`[data-tpl-sec="${k}"]`); if (!e) return null;
        const r = e.getBoundingClientRect();
        return { hidden: e.hidden, w: Math.round(r.width), h: Math.round(r.height) };
      };
      return { t, ov: secBox('overview'), bk: secBox('book'), list: secBox('list'),
        subs: document.querySelectorAll('#content .st-tabsub').length,
        title: (document.querySelector('#content h1') || {}).textContent };
    });
    /* —— RE-POINTED THREE TIMES, and the claims never changed once. A third
       tab joined the row on 19 Sep and the overview left it the same
       afternoon; 18 Sep moved the LANDING onto the table; 20 SEP MOVED IT BACK
       TO THE FIRST TAB, which is now the book (Young: "you should First Land
       in the first tab which in this case its The Book").

       Every claim is what it always was — the row is named, it has a fixed
       order, the table is last, the tab NOT showing is gone in PIXELS rather
       than merely missing an attribute, and the live tab is the bold one. What
       keeps moving is which tab is which, so the three that care are asked of
       the page's OWN answer (`live` / `rest`) rather than of a tab named here,
       and a fourth ruling on the landing will not touch them. */
    /* RETIRED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): 1a "two tabs, the book first, table last",
       1c "the resting tab has really left the screen", 1d "the live tab is bold" and the tab row's Settings twin. The
       owner's pick draws no tab row on Our paper: the book is three steps (Shelves › a folder's list › the paper) and
       the Templates table has no door in the new look (tplPageSetTab('list') opens the list step). What the row's
       claims protected that still exists is asked here:
       RE-POINTED 17 Nov 2026 (#762): 1a — the reader lands on the book's FIRST step, Shelves, and it is drawn; the
       table's section is off the screen in pixels, not merely by an attribute (1c's promise, kept); 1e as before. */
    const landedOn = await page.evaluate(() => ({ view: tplPlace().view, tab: tplPageTab(), shelves: !!document.querySelector('[data-tpl-sec="book"] .tpln5.is-shelves'), row: document.querySelectorAll('[data-tpl-tab]').length }));
    check('1a · the reader lands on the book\u2019s first step, Shelves, and no tab row is drawn',
      landedOn.view === 'shelves' && landedOn.tab === 'book' && landedOn.shelves && tabs.bk && !tabs.bk.hidden && tabs.bk.h > 200 && landedOn.row === 0, landedOn);
    check('1b · the overview tab is gone, in the row and in the page',
      tabs.ov === null && tabs.bk !== null, { overview: tabs.ov, book: tabs.bk });
    check('1c · and the table\u2019s section has really left the screen, not merely lost an attribute',
      !tabs.list || (tabs.list.hidden === true && tabs.list.h === 0 && tabs.list.w === 0), { list: tabs.list });
    check('1e · no sentence under the title or under the tabs',
      tabs.subs === 0, { subtitles: tabs.subs, title: tabs.title });

    /* RE-POINTED 17 Nov 2026 (the Ladder; the owner answered "Remove it"): Our standards is a page of its own with no
       tab row of Our paper's, so there is no second home to dress alike; asked instead: it carries no Our paper switch */
    await page.evaluate(() => setView('playbook'));
    await pause(1200);
    const other = await page.evaluate(() => ({ seg: !!document.querySelector('.paper-seg, [data-paper-tab]'), ladder: !!document.querySelector('.ld-page') }));
    check('1f · Standards is its own page: no Our paper switch on it', other.ladder && !other.seg, other);
    await page.evaluate(() => setView('templates'));
    await pause(1200);

    /* ================= 2 · THE CARDS ARE THE CATEGORIES ===================
       RE-POINTED 29 Aug 2026 (owner-asked: *"The cards should represent the
       categories in the attached so that you have a card for all templates and
       the respective metrics. You have a card for standard contracts, a card
       for warehousing etc."*). The wall was a card per TEMPLATE; it is a card
       per BUCKET now — the table's own five library rows and one per value
       stream. Everything this section was really pinning survives: the cards
       are real pixels, they carry both figures and the sentence that qualifies
       them, and nothing has come off says so in its own words. */
    /* ════ RE-POINTED IN PLACE, 19 Sep 2026 — THE WALL IS BUILT, AND THE BOOK
       ════ IS WHAT DRAWS ITS CARDS ══════════════════════════════
       In the morning the first tab drew tplHealthHtml; that tab is gone (the
       owner: *"delete the templates overview page"*), and `tplOverviewHtml`
       is kept whole and unreferenced. THE BOOK draws the same cards through
       the same builder, tplOvCardHtml — so what this probe measures is what a
       reader really sees, one builder away.

       SO THE WALL IS MOUNTED AND MEASURED. Not read out of the page — read
       out of the page it would be a source test wearing a browser's clothes,
       and sections 2a and 2d are the only two places in this suite that ask
       whether a card is real pixels and whether the grid is more than one
       column, which is exactly what a source test cannot answer. It is torn
       down again below so section 4 measures the page as a reader has it.

       templates-cleaned-up-verify measures the tab's own content. */
    const cards = await page.evaluate(() => {
      const host = document.createElement('div');
      host.id = 'tpl-wall-probe';
      /* BESIDE the page, never over it: at left:0;top:0 inside the overview
         section the probe covered the tab row and Playwright's own clicks
         timed out against it. Off-screen still reports real width, height and
         grid columns — which is all sections 2 and 3 ask of it. */
      host.style.cssText = 'position:absolute;left:-4000px;top:0;width:1218px';
      host.innerHTML = tplOverviewHtml(tplOverviewData());
      document.body.appendChild(host);
      const wall = document.querySelector('#tpl-wall-probe .tpl-ov-cards');
      const cs = [...document.querySelectorAll('#tpl-wall-probe .tpl-ov-cards [data-tpl-ov-bucket]')].map(e => {
        const r = e.getBoundingClientRect();
        return { key: e.getAttribute('data-tpl-ov-bucket'),
          name: (e.querySelector('.tpl-ov-name') || {}).textContent,
          n: (e.querySelector('.tpl-ov-count') || {}).textContent,
          w: Math.round(r.width), h: Math.round(r.height), txt: e.textContent.replace(/\s+/g, ' ').trim() };
      });
      const wr = wall ? wall.getBoundingClientRect() : null;
      /* RE-POINTED 9 Oct 2026 (SAP benchmark, batch 2): the rail is the narrow
         shape's only; the list's own count of each kind is read off the rows
         the list draws, which is the number the rail printed. */
      const rail = {};
      const rows = tplOverviewData().cards;   /* one per row the list draws (tplPageRows, read through the published reading) */
      for (const k of ['company', 'cp', 'builtin', 'sample']) rail[k] = String(rows.filter(r => r.kind === k).length);
      rail.all = String(rows.length);
      return { n: cs.length, cards: cs, rail,
        wall: wr ? { x: Math.round(wr.x), w: Math.round(wr.width) } : null,
        cols: wall ? getComputedStyle(wall).gridTemplateColumns.split(' ').length : 0 };
    });
    check('2a · the wall draws cards with real size',
      cards.n >= 4 && cards.cards.every(c => c.w > 180 && c.h > 90),
      { n: cards.n, first: cards.cards[0] });
    /* THE SENTENCE'S ONE JOB IS SAYING WHAT THE PERCENTAGE ABOVE IT WAS WORKED
       OUT FROM (owner-reported 25 Aug 2026: "i do not understand what the
       highlighted area means"). It has to name the sample, name the standards
       the reader can go and look at, and give "not checked" an object. */
    check('2b · a card carries both figures and the sentence that qualifies them',
      cards.cards.some(c => /Used/.test(c.txt) && /Deviation/.test(c.txt)) /* the label is 'Deviation' since 21 Sep 2026 — the artifact's own word */
      && cards.cards.some(c => /(\d+ of the \d+ contracts checked did not follow Our playbook|Nothing drafted from these has been checked)/.test(c.txt))
      && !cards.cards.some(c => /off-standard/.test(c.txt)),
      cards.cards[0]);
    check('2c · a category nothing has come off says that, in its own words',
      cards.cards.some(c => /Nothing has been drafted from these yet/.test(c.txt))
      && !cards.cards.some(c => /drafted from this template/.test(c.txt)),
      cards.cards.filter(c => /Nothing has been drafted/.test(c.txt)).length);
    check('2d · the wall is more than one column at 1500px', cards.cols >= 2, cards.cols);
    /* THE CARD IS A CATEGORY: the rail's five libraries and one per stream, and
       the count on each is the number the table's own rail prints. */
    check('2e · the five library cards are the rail\u2019s five, in its order',
      JSON.stringify(cards.cards.filter(c => !/^stream:/.test(c.key)).map(c => c.key))
        === JSON.stringify(['company', 'cp', 'builtin', 'sample', 'all']) /* All templates LAST since 21 Sep 2026 — the artifact's row */,
      cards.cards.map(c => c.key));
    check('2f · every value stream has a card too',
      cards.cards.filter(c => /^stream:/.test(c.key)).length >= 3,
      cards.cards.filter(c => /^stream:/.test(c.key)).map(c => c.name));
    check('2g · and each library card prints the count the list holds of that kind',
      ['all', 'company', 'cp', 'builtin', 'sample'].every(k => {
        const c = cards.cards.find(x => x.key === k);
        return c && String(c.n).trim() === String(cards.rail[k]).trim(); }),
      { wall: cards.cards.filter(c => !/^stream:/.test(c.key)).map(c => `${c.key}:${c.n}`),
        rail: cards.rail });

    /* ================= 3 · THE TWO PANELS =================================== */
    /* The two panels ride the same mounted wall — re-pointed with it, for the
       same reason, and the probe is torn down afterwards so section 4 sees the
       page exactly as a reader has it. */
    const panels = await page.evaluate(() => {
      const probe = document.getElementById('tpl-wall-probe');
      const txt = probe.textContent.replace(/\s+/g, ' ');
      const bars = [...probe.querySelectorAll('.tpl-ov + *')].length;
      const wide = [...probe.querySelectorAll('[data-tpl-ov-card]')]
        .map(e => Math.round(e.getBoundingClientRect().width));
      return { txt, bars, wide };
    });
    check('3a · Needs attention names what wants somebody, worst first',
      /Needs attention/.test(panels.txt) && /\d+% of the contracts checked did not follow/.test(panels.txt),
      (panels.txt.match(/Needs attention.{0,120}/) || [''])[0]);
    check('3b · Most used names its own window and draws bars',
      /Most used, 90 days/.test(panels.txt), (panels.txt.match(/Most used.{0,80}/) || [''])[0]);
    check('3c · the page states its coverage once',
      /counts only contracts that have been checked against Our playbook/.test(panels.txt));

    /* ================= 4 · THE TWO TABS WORK TOGETHER ======================= */
    /* The probe STAYS up through 4a–4d, because the category journey below
       presses a wall card and the wall is what the probe is. It comes down
       after 4d, before the claims that are about the tab itself. */
    /* RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): the Templates TABLE has no door in the
       new look — its doors (tplPageSetTab('list'), tplGoList, tplGoBucket) open the book's LIST step. The journey this
       section was always about stands, asked of the steps: All puts the list on screen in place of the Shelves; a
       folder pressed lands on that folder's own papers with the narrowing in plain sight (its name the head, its chip
       lit) and the find box clear; ‹ goes back and All widens it again. */
    await page.click('[data-tpl-sec="book"] [data-tpln-view="list"]');
    await pause(500);
    const flipped = await page.evaluate(() => ({ view: tplPlace().view, shelves: !!document.querySelector('[data-tpl-sec="book"] .tpln5.is-shelves'),
      rows: [...document.querySelectorAll('[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden).length }));
    check('4a · pressing All puts the list on screen and takes the shelves off',
      flipped.view === 'list' && !flipped.shelves && flipped.rows > 1, flipped);
    await page.screenshot({ path: path.join(OUT, '02-list.png'), fullPage: true });
    await page.click('[data-tpln-back]');
    await pause(400);
    /* RE-POINTED 18 Nov 2026 (main: Folder Cards replace Cover flow): a folder is a card (.tpln5-fc), its count of papers
       said on it ("N papers · …"); pressing the card opens the folder's list */
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* a shelf is a calm card (.tpln6-fc[data-tpln-pickshelf]) saying "N papers · N drafted"; a press CHOOSES it (outlined),
       a second press opens its list; on the shelf's list the shelves are chips, the chosen one set */
    const target = await page.evaluate(() => { const r = [...document.querySelectorAll('[data-tpl-sec="book"] .tpln6-fc[data-tpln-pickshelf]')].find(x => (parseInt((x.querySelector('.tpln6-fcs') || {}).textContent, 10) || 0) > 0);
      return r ? { fid: r.getAttribute('data-tpln-pickshelf'), name: (r.querySelector('.tpln6-fch b') || {}).textContent, n: parseInt((r.querySelector('.tpln6-fcs') || {}).textContent, 10) } : null; });
    if (target) { await page.click(`[data-tpl-sec="book"] .tpln6-fc[data-tpln-pickshelf="${target.fid}"] .tpln6-fch`); await pause(400);
      if (await page.evaluate(() => tplPlace().view === 'shelves')) await page.click(`[data-tpl-sec="book"] .tpln6-fc[data-tpln-pickshelf="${target.fid}"] .tpln6-fch`); }
    await pause(600);
    const landed = await page.evaluate(() => ({ view: tplPlace().view, ls: tplPlace().ls,
      head: ((document.querySelector('.tpln5-h1') || {}).textContent || '').trim(),
      lit: [...document.querySelectorAll('[data-tpln-shelfchip].is-on')].map(b => b.getAttribute('data-tpln-shelfchip')),
      box: ((document.querySelector('[data-tpln-q]') || {}).value) || '',
      rows: [...document.querySelectorAll('[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden).map(r => r.getAttribute('data-tpln-stream')) }));
    check('4b · a folder lands on the list, showing that folder\u2019s own paper',
      !!target && landed.view === 'list' && landed.ls === target.fid && landed.rows.length === target.n && landed.rows.every(f => f === target.fid), { target, ...landed });
    check('4c · the narrowing says so in plain sight \u2014 the folder is the head and its chip is lit',
      !!target && landed.head === target.name && landed.lit.includes(target.fid), { target, head: landed.head, lit: landed.lit });
    check('4c2 · and the search box is clear, so two narrowings cannot stack',
      landed.box === '', landed.box);
    await page.screenshot({ path: path.join(OUT, '03-narrowed.png'), fullPage: true });

    await page.click('[data-tpln-back]');
    await pause(400);
    await page.click('[data-tpl-sec="book"] [data-tpln-view="list"]');
    await pause(500);
    const cleared = await page.evaluate(() => [...document.querySelectorAll('[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden).length);
    check('4d · and All really does widen it again', cleared > ((target && target.n) || 0) && cleared > 2, cleared);
    await page.click('[data-tpln-back]');
    await pause(400);

    /* THE PROBE STAYS UP for the rest of the run: section 6 reads the same
       cards for the demo's type ladder and its colour relations. It is beside
       the page at left:-4000px, so it covers nothing a reader presses and no
       claim about the tab itself can pick it up — every one of those names
       `[data-tpl-sec="book"]`, which the probe is not inside. */
    /* RE-POINTED 17 Nov 2026 (#762): section 4 ends back on the Shelves; there is no tab to press */
    await pause(200);
    /* THERE IS NO "SEE ALL" ANY MORE, and its absence is the claim: the wall
       withholds nothing, so a door onto "the rest" would open onto nothing. */
    const hasAll = await page.$('#tpl-ov-all');
    check('4e · no "see all", because the wall holds nothing back', !hasAll, !!hasAll);
    if (hasAll) {
      await page.click('#tpl-ov-all');
      await pause(600);
      const all = await page.evaluate(() => ({
        tab: document.querySelector('[data-tpl-tab="list"]').classList.contains('on'),
        box: document.getElementById('tpl-search').value,
        rows: document.querySelectorAll('#tpl-rows tr').length,
      }));
      check('4e2 · and if one is ever drawn again it opens the table whole',
        all.tab && all.box === '' && all.rows > 5, all);
    }

    /* ================= 6 · THE CARD IS THE DEMO'S CARD =====================
       Owner-asked 25 Aug 2026, off a picture of one: "ensure the hati cards
       resemble it exactly. The color coding, the design how the card is color
       coded at the top … add the font sizes as well."

       EVERY CLAIM IS A COMPUTED VALUE, and the colour ones are RELATIONS —
       "the rate at 67% is not the colour of the rate at 0%", never a typed
       rgb — so a palette pass costs no edit here. What is pinned as a number
       is the type ladder, because that is exactly what the ask was about. */
    /* RE-POINTED 16 Nov 2026 (#762): the book draws no switch of its own in the new look, so it is pressed only from the
       Templates table (section 4 already came back to the book) */
    if (await page.evaluate(() => tplPageTab()) !== 'book') await page.locator('[data-tpl-tab="book"]:visible').first().click();
    await pause(500);
    const dm = await page.evaluate(() => {
      const px = e => { const s = getComputedStyle(e);
        return { size: s.fontSize, weight: s.fontWeight, color: s.color,
          tt: s.textTransform, ls: s.letterSpacing, bg: s.backgroundColor }; };
      return [...document.querySelectorAll('#tpl-wall-probe .tpl-ov-cards [data-tpl-ov-bucket]')].map(c => {
        const cr = c.getBoundingClientRect();
        /* 21 Sep 2026: the bar is the card's own TOP EDGE (the reference's
           .tcard border-top), measured off the card itself. */
        const ccs = getComputedStyle(c);
        const count = c.querySelector('.tpl-ov-count');
        const bd = count ? count.getBoundingClientRect() : null;
        const name = c.querySelector('.tpl-ov-name');
        const nr = name.getBoundingClientRect();
        /* the label is the span's own text; the figure is the <b> inside it */
        const labs = [...c.querySelectorAll('.tpl-tcard-m > span')]
          .filter(e => /^(Used|Deviation)$/.test((e.firstChild && e.firstChild.textContent || '').trim()));
        const figs = labs.map(l => l.querySelector('b')).filter(Boolean);
        return {
          key: c.getAttribute('data-tpl-ov-bucket'),
          name: name.textContent.trim(),
          /* Measured against the card's INNER width: the bar sits inside the
             card's 1px border, which is where the demo's own draws. */
          bar: { h: Math.round(parseFloat(ccs.borderTopWidth)), w: Math.round(cr.width), cw: Math.round(cr.width),
            top: 0, bg: ccs.borderTopColor },
          count: count ? Object.assign(px(count), { txt: count.textContent.trim(),
            right: Math.round(cr.right - bd.right), aboveName: bd.top <= nr.top + 2 }) : null,
          nm: px(name),
          note: px(c.querySelector('.tpl-ov-note')),
          labels: labs.map(e => Object.assign(px(e), { txt: (e.firstChild && e.firstChild.textContent || '').trim() })),
          figs: figs.map(e => Object.assign(px(e), { txt: e.textContent.trim() })),
        };
      });
    });
    /* THE PANEL'S OWN TEXT, not the whole overview's. Read off the section the
       cards are in too, "Commercial Property Lease … came back off-standard"
       matches across two cards' worth of words and the check reports a clean
       template as accused. */
    const attTxt = await page.evaluate(() =>
      document.getElementById('tpl-ov-attention').textContent.replace(/\s+/g, ' '));

    /* THE LADDER IS READ OFF THE ROOT (21 Sep 2026, the redesign): the card's
       type is --t-body / --t-card at --w-title, and those moved (14→13, 15→14,
       700→600). The 25 Aug ask was "one size down", and it still holds as the
       RELATION — figures one rung above the name — which is what these pin now. */
    const tok = await page.evaluate(() => { const r = getComputedStyle(document.documentElement);
      /* the card's weight is --w-strong (600) since the 21 Sep redesign — the
         note above names the move "700→600"; read off the token, never typed */
      const g = k => r.getPropertyValue(k).trim(); return { card: g('--t-card'), body: g('--t-body'), title: g('--w-strong') || g('--w-title') }; });
    check('6a · every card wears a 3px bar across its whole top, first in the card',
      dm.length > 0 && dm.every(c => c.bar.h === 3 && c.bar.top <= 1 && c.bar.w === c.bar.cw),
      dm.map(c => c.bar));
    /* RE-POINTED 29 Aug 2026, and it is the owner's own picture: only the VALUE
       STREAMS wear a swatch there. A library card carries none, because a bar
       that said nothing on five cards would be a mark for a fact the section
       heading above already carries. */
    /* RE-POINTED 21 Sep 2026 (the redesign, LIB_TONE): a library card wears its
       SHELF's colour now — the reference draws every card with a coloured bar —
       so the claim is that no card is bare and a stream card is its stream's. */
    check('6a2 · a stream card wears its stream\u2019s colour and a library card its shelf\u2019s',
      dm.filter(c => /^stream:/.test(c.key)).every(c => c.bar.bg !== 'rgba(0, 0, 0, 0)')
      && dm.filter(c => !/^stream:/.test(c.key)).every(c => c.bar.bg !== 'rgba(0, 0, 0, 0)'),
      dm.map(c => c.key + ':' + c.bar.bg));
    /* RE-POINTED: the top-right slot carried the template's STATE as a badge;
       on a category card it carries that category's COUNT, which is the shape
       the owner's picture draws ("Company standard  26"). */
    check('6b · the count sits at the card\u2019s top right, on the name\u2019s own line',
      /* RE-POINTED 21 Sep 2026: the count is the reference's mono figure —
         meta size, label weight, the secondary ink — on the name's own line. */
      dm.every(c => c.count && /^\d+$/.test(c.count.txt)
        && c.count.size === '12px' && c.count.weight === '500'
        && c.count.right <= 16 && c.count.aboveName),
      dm[0] && dm[0].count);
    /* THE LADDER, ONE RUNG LOWER (owner-asked 25 Aug 2026: "all the fonts need
       to be reduced by one size and the ones highlighted (numbers) should be
       reduced by 2 sizes"). These are pinned as NUMBERS rather than as
       relations, deliberately: the ask was about the sizes themselves. */
    check('6c · the name is the card\'s one piece of primary type — --t-body at --w-strong',
      dm.every(c => c.nm.size === tok.body && c.nm.weight === tok.title), dm[0] && { nm: dm[0].nm, tok });
    /* RE-POINTED: there is no meta line under the name any more — the section
       above says whether this is a library or a value stream and the count is
       on the name's own line, so a third line would print one of those twice. */
    /* RE-POINTED 21 Sep 2026: the labels are 12px regular; the note is the
       reference's micro line (11px) — both in a secondary ink, never the name's. */
    /* RE-POINTED 27 Oct 2026 (THE LEGORA WAY, the owner's pick: every word 12px and up is the ink; only the small print keeps the grey) */
    check('6d · the small text is regular — labels 12px in the ink, the note micro in the quiet grey',
      dm.every(c => c.labels.every(x => x.size === '12px' && x.weight === '400' && x.color === c.nm.color)
        && c.note.size === '11px' && c.note.weight === '400' && c.note.color !== c.nm.color),
      dm[0] && { note: dm[0].note, label: dm[0].labels[0] });
    check('6e · the labels are sentence case, not the uppercase caps the panels use',
      dm.every(c => c.labels.length === 2 && c.labels.every(l => l.tt === 'none'))
      && /NEEDS ATTENTION|Needs attention/.test(attTxt),
      dm[0] && dm[0].labels.map(l => l.txt + ':' + l.tt));
    check('6f · both figures are --t-body at --w-strong, in mono — and the first is the primary ink',
      /* RE-POINTED 21 Sep 2026: the figure is the reference's mono at BODY
         size and strong weight — the same rung as the name, told apart by face. */
      dm.every(c => c.figs.length === 2 && c.figs.every(f => f.size === tok.body && f.weight === tok.title))
      && dm.every(c => c.figs[0].color === c.nm.color),
      dm[0] && dm[0].figs);

    /* THE COLOUR CODING, AS A RELATION — RE-POINTED 29 Aug 2026.
       This staged three TEMPLATES carrying a high, a middling and a clean rate
       and read three different inks off the wall. The wall shows CATEGORIES
       now, and a rolled-up rate flattens those extremes by construction: a
       library holding one bad template and eleven good ones is a middling
       library, which is the honest reading and the reason for rolling up at
       all. So what is pinned here is what the wall can still be asked, and the
       ruby threshold moves to the panel it shares — a red figure and a row in
       Needs attention are one finding or the page argues with itself. */
    const rated = dm.filter(c => /%$/.test(c.figs[1].txt));
    const unrated = dm.filter(c => c.figs[1].txt === '\u2014');
    check('6g · a category with a rate and one without are different inks',
      rated.length >= 1 && unrated.length >= 1
      && rated[0].figs[1].color !== unrated[0].figs[1].color,
      { rated: rated.map(c => c.figs[1].txt + ' ' + c.figs[1].color),
        none: unrated[0] && unrated[0].figs[1].color });
    check('6h · and none of them is the ink the count wears',
      dm.every(c => c.figs[1].color !== c.figs[0].color),
      dm.map(c => c.figs[1].txt + ':' + (c.figs[1].color === c.figs[0].color ? 'same' : 'own')));
    /* NEEDS ATTENTION IS UNCHANGED AND STILL NAMES SINGLE TEMPLATES — it is
       the one place on this page that does, now that the wall is categories,
       and that is what makes the two worth having side by side. */
    check('6i · Needs attention still names a TEMPLATE, not a category',
      /Needs attention/.test(attTxt)
      && !dm.some(c => attTxt.includes('\n' + c.name)),
      (attTxt.match(/Needs attention.{0,90}/) || [''])[0]);
    check('6j · and a category nobody has checked draws an em-dash, never an accusation',
      unrated.every(c => c.figs[1].txt === '\u2014'
        && /Nothing/.test(c.note ? '' : '') === false),
      unrated.map(c => c.name + ' ' + c.figs[1].txt));

    /* ================= 5 · THE PAGE NEVER SCROLLS SIDEWAYS ================== */
    const widths = [];
    for (const w of [1500, 1280, 1024]) {
      await ctx.pages()[0].setViewportSize({ width: w, height: 900 });
      /* RE-POINTED 17 Nov 2026 (#762): no tab row to press; the book is put on its first step, Shelves */
      await page.evaluate(() => { tplPageSetTab('book'); renderTemplatesPage(); });
      await pause(500);
      widths.push(await page.evaluate(() => ({
        w: window.innerWidth,
        over: Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth),
        cols: getComputedStyle(document.querySelector('.tpl-ov')).gridTemplateColumns.split(' ').length,
      })));
    }
    check('5a · no horizontal scroll at any laptop width',
      widths.every(x => x.over <= 1), widths);
    check('5b · the panels drop under the wall where there is no room for them',
      widths[0].cols === 2 && widths[2].cols === 1, widths.map(x => x.w + ':' + x.cols));
    await page.setViewportSize({ width: 1500, height: 1000 });

    /* ============ 7 · THE WALL'S TWO SECTIONS (owner-asked 29 Aug 2026) =====
       REVERSED IN PLACE, and this is the same morning's block corrected. It
       was written when the answer to "segmented by library" was the TEMPLATE
       cards grouped under a heading per library, each heading carrying that
       library's count. The owner's picture is the table's rail and what it
       asks for is a card per CATEGORY — so the counts moved onto the cards
       (2e-2g above) and the headings became the rail's own two captions. */
    await page.setViewportSize({ width: 1500, height: 1000 });
    await page.evaluate(() => setView('templates'));
    await pause(1400);
    const segs = await page.evaluate(() => {
      const wall = document.getElementById('tpl-ov-cards');
      if (!wall) return null;
      const out = []; let cur = null;
      for (const k of wall.children) {
        if (k.classList.contains('tpl-ov-band')) {
          const s = getComputedStyle(k);
          cur = { txt: k.textContent.trim().replace(/\s+/g, ' '), cards: 0,
            span: s.gridColumnStart + '/' + s.gridColumnEnd,
            w: Math.round(k.getBoundingClientRect().width) };
          out.push(cur);
        } else if (cur) cur.cards++; else out.push({ txt: '(loose card)', cards: 1 });
      }
      /* the two captions the wall reads through, one key each (tplOverviewHtml
         SECTIONS: lib_library, lib_value_stream) — the list's rail that once
         drew them became an inspector (SAP batch 2), so the keys themselves
         are the reference now */
      const caps = [i18t('lib_library'), i18t('lib_value_stream')];
      return { out, caps, wallW: Math.round(wall.getBoundingClientRect().width),
        cards: wall.querySelectorAll('[data-tpl-ov-bucket]').length };
    });
    check('7a · the wall is drawn under headings, not as one flat run',
      !!segs && segs.out.length === 2 && !segs.out.some(g => g.txt === '(loose card)'),
      segs && segs.out.map(g => `${g.txt}:${g.cards}`));
    check('7b · the two headings are Library and Value stream, in that order',
      !!segs && JSON.stringify(segs.out.map(g => g.txt)) === JSON.stringify(['Library', 'Value stream']),
      segs && segs.out.map(g => g.txt));
    check('7c · \u2026and they are the rail\u2019s own two captions, read through one key each',
      !!segs && segs.out.every(g => segs.caps.includes(g.txt)),
      segs && { wall: segs.out.map(g => g.txt), rail: segs.caps });
    check('7d · a heading spans the wall, so the cards keep one width',
      !!segs && segs.out.every(g => g.span === '1/-1' && Math.abs(g.w - segs.wallW) < 2),
      segs && segs.out.map(g => `${g.span} ${g.w}/${segs.wallW}`));
    check('7e · and every card sits under one of them',
      !!segs && segs.cards === segs.out.reduce((n, g) => n + g.cards, 0),
      segs && `${segs.cards} cards, ${segs.out.reduce((n, g) => n + g.cards, 0)} under headings`);

    /* ================= 9 · THE BOOK, THE THIRD TAB ========================
       Young ruled it 19 Sep 2026 off "The Template Book" artifact. Every
       claim here is a PRESS or a GEOMETRY: whether a section really folds,
       whether a shut one still answers, and whether the overview beside it
       was left alone. f336 pins the machinery. */
    /* A PROBE THAT THROWS PROVES NOTHING. Run against a build with no book
       tab, page.click waits thirty seconds for a locator that will never
       exist and then ends the whole file — so the section it is here to
       measure reports nothing, and neither does anything written after it.
       The tab's presence is its own claim, and the rest stands down. */
    /* RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): there is no book TAB any more — the
       book is the page (no tab row). "9 · there is a book tab to press" asks instead that the book's section is there
       and is the one on show. 9a/9b/9h/9i keep their promises on the steps: the book draws (a row per folder, each
       with its papers), every template is on it and the list's chips lead with All; a paper pressed on a shelf brings
       up that template's own paper, and the press repaints the book, not the page. */
    await page.evaluate(() => { tplPageSetTab('book'); });
    await pause(400);
    const hasBook = await page.$('[data-tpl-sec="book"]:not([hidden])');
    check('9 · the book is the page, on show', !!hasBook);
    const bk = !hasBook ? null : await page.evaluate(() => {
      const sec = document.querySelector('[data-tpl-sec="book"]');
      if (!sec) return null;
      /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */ /* a shelf is a calm card (.tpln6-fc), its papers used most each a press (.tpln6-fp) */
      const shelves = [...sec.querySelectorAll('.tpln5.is-shelves .tpln6-fc[data-tpln-pickshelf]')];
      return { h: Math.round(sec.scrollHeight), hidden: sec.hidden, n: sec.querySelectorAll('.tpln6-fp[data-tpln-open]').length, shelves: shelves.length,
        rowH: shelves.length ? Math.round(shelves[0].getBoundingClientRect().height) : 0,
        papered: shelves.length > 0 && shelves.every(r => r.querySelectorAll('.tpln6-fp').length > 0) };
    });
    check('9a · the book draws: a row per folder, each with its papers', !!bk && !bk.hidden && bk.h > 250 && bk.rowH > 30 && bk.shelves >= 2 && bk.papered,
      bk && { h: bk.h, hidden: bk.hidden, rowH: bk.rowH, shelves: bk.shelves, papered: bk.papered });
    await page.click('[data-tpl-sec="book"] [data-tpln-view="list"]');
    await pause(500);
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */ /* the list's chips: Shelves · All with their counts, "+ Shelf" a small menu of every shelf (the stream chips went) */
    const chips = await page.evaluate(() => ({ tabs: [...document.querySelectorAll('[data-tpl-sec="book"] .apn-bar .apn-tab.is-chip[data-tpln-view]')].map(g => g.textContent.trim()),
      shelves: document.querySelectorAll('[data-tpl-sec="book"] .apn-rule-menu [data-tpln-shelfchip]').length }));
    await page.click('[data-tpln-back]');
    await pause(400);
    check('9b · every template on the shelves; the list\u2019s chips Shelves · All, every shelf under + Shelf',
      !!bk && bk.n >= 12 && chips.tabs.length === 2 && /^Shelves\b/.test(chips.tabs[0] || '') && /^All\b/.test(chips.tabs[1] || '') && chips.shelves >= 2, bk && { n: bk.n, chips });
    /* RE-POINTED 19 Oct 2026 (round 21 as drawn, lane D): the book's facts
       are ONE line beside the page's name — "N contracts drafted from them in
       12 months · N came back changed" — where the three figures stood */
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
    /* no facts beside the title and no figure cards: the numbers are said ONCE, in Jambo's panel (its "Came back changed"
       sentence); the three figures stay gone */
    await page.waitForFunction(() => !!document.querySelector('#ins-panel [data-jov5-sec="changed"]'), null, { timeout: 6000 }).catch(() => {});
    const facts = await page.evaluate(() => { const ch = document.querySelector('#ins-panel [data-jov5-sec="changed"]'); return ch ? { sub: !!document.querySelector('[data-tpl-hd-sub], .tpln5-hrow .tpl-hd-n'), gl: document.querySelectorAll('[data-tpl-head="book"] .tpl-gl, .tpln5-figs, .tpln5-fig').length,
      said: ch.textContent.replace(/\s+/g, ' ').trim() } : null; });
    check('9e · no facts line beside the page\'s name, no figures; the panel says what came back changed, once',
      !!facts && !facts.sub && facts.gl === 0 && /drafts? (came|did not come) back changed|not made an agreement|came back changed/i.test(facts.said), facts);

    const cut = !hasBook ? null : await page.evaluate(async () => {
      const sec = document.querySelector('[data-tpl-sec="book"]');
      const list = document.querySelector('[data-tpl-sec="list"]');
      const btn = sec.querySelectorAll('.tpln6-fp[data-tpln-open]')[1]; /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way) */
      if (!btn) return null;
      const want = btn.getAttribute('data-tpln-open');
      btn.click();
      await new Promise(r => setTimeout(r, 320));
      const again = document.querySelector('[data-tpl-sec="book"]');
      return { on: tplPlace().pick, view: tplPlace().view, want,
        title: ((document.querySelector('.tpln5-h1') || {}).textContent || '').trim(), paper: !!again.querySelector('.tpln5.is-paper .tpl-pf-sheet'),
        sameSection: sec === again, sameList: list === document.querySelector('[data-tpl-sec="list"]') };
    });
    check('9h · pressing a template on its shelf brings up its paper',
      !!cut && cut.on === cut.want && cut.view === 'paper' && cut.paper && !!cut.title, cut);
    check('9i · and the press repaints the book, not the page',
      !!cut && cut.sameSection && cut.sameList, cut);
    await page.click('[data-tpln-back]'); await pause(300);
    await page.click('[data-tpln-back]'); await pause(400);

    /* REVERSED IN PLACE, the same day it was written. This read *"THE OVERVIEW
       WAS LEFT ALONE. The day-before ruling stands."* and hours later the
       owner said *"delete the templates overview page"*. The reading it drew
       is KEPT WHOLE AND UNREFERENCED (tplHealthData / tplHealthHtml, the way
       tplOverviewHtml beside it is kept), so what this claim asks now is that
       the tab is gone from the PAGE and the reading is still on the shelf —
       one press from coming back. */
    const ovGone = await page.evaluate(() => ({
      sec: !!document.querySelector('[data-tpl-sec="overview"]'),
      tab: !!document.querySelector('[data-tpl-tab="overview"]'),
      rows: document.querySelectorAll('.tpl-h-row').length,
      builtHtml: typeof tplHealthHtml === 'function' && typeof tplHealthData === 'function',
      builtWall: typeof tplOverviewHtml === 'function',
      shelved: (() => { try { return /comes back changed/i
        .test(tplHealthHtml(tplHealthData()).replace(/<[^>]+>/g, ' ')); }
        catch (_) { return false; } })(),
    }));
    check('9j · the overview tab is gone from the page — no section, no tab, no rows',
      !ovGone.sec && !ovGone.tab && ovGone.rows === 0, ovGone);
    check('9j2 · and BOTH retired readings are still built, one line from coming back',
      ovGone.builtHtml && ovGone.builtWall && ovGone.shelved, ovGone);

    await page.screenshot({ path: path.join(OUT, '05-book.png'), fullPage: true });

    /* ===== 8 · CREATING A CATEGORY AND A VALUE STREAM (Young, 17 Sep 2026) =====
       *"it is not clear how you create category and value stream but also how
       you delete them."* DRIVEN, because the whole complaint is about what a
       reader can SEE and PRESS on that dialog: the options are read off the
       painted selects, the create door is picked with a real change event, the
       name box is typed into and its button pressed, and the answer is read
       back OFF THE SERVER rather than off the screen that just drew it. */
    /* RE-POINTED IN PLACE, 24 Sep 2026 (Young's go on "One Door to
       Standards", decision 5). The "New standard template" form this section
       photographed has no door any more: the name, category and value stream
       are chips at the top of the builder, and each opens the Template
       details box — the SAME pair of pickers, wired by the same
       tplLibWireCatStream. So the dialog is reached the way a reader reaches
       it now: a template in the builder, and a press on its Category chip. */
    const tb8 = await page.evaluate(async () => {
      const d = await api('templates', 'POST', { name: 'Filing probe', category: 'other', description: '' });
      const t = await api('templates/' + d.template.id);
      return { tid: d.template.id, vid: t.versions.find(v => v.status === 'draft').id };
    });
    await page.evaluate(i => openTemplateBuilder(i.tid, i.vid), tb8);
    await pause(1200);
    await page.evaluate(() => { const b = document.querySelector('[data-tb-meta="category"]'); if (b) b.click(); });
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '08-template-details.png') });

    const doors = await page.evaluate(() => {
      const opts = id => [...(document.getElementById(id) || { options: [] }).options]
        .map(o => ({ v: o.value, t: o.textContent.trim() }));
      return { cat: opts('tpllib-m-cat'), stream: opts('tpllib-m-stream') };
    });
    check('8a · the Template details box is open, with both pickers',
      doors.cat.length > 1 && doors.stream.length > 1,
      { cat: doors.cat.length, stream: doors.stream.length });
    check('8b · THE REPORTED FAULT: the category picker now says how one is made',
      doors.cat.some(o => o.v === '__new__'),
      doors.cat.map(o => o.v).join(','));
    check('8c · and so does the value stream picker',
      doors.stream.some(o => o.v === '__new__'),
      doors.stream.map(o => o.v).join(','));
    check('8d · the create door is LAST on both, so it never takes the default\u2019s place',
      doors.cat[doors.cat.length - 1].v === '__new__'
      && doors.stream[doors.stream.length - 1].v === '__new__',
      { cat: doors.cat[doors.cat.length - 1].v, stream: doors.stream[doors.stream.length - 1].v });

    /* A REAL PICK, A REAL NAME, A REAL PRESS. */
    const madeCat = await (async () => {
      await page.evaluate(() => {
        const sel = document.getElementById('tpllib-m-cat');
        sel.value = '__new__'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await pause(500);
      const up = await page.evaluate(() => !!document.getElementById('nf-name'));
      if (!up) return { up };
      await page.fill('#nf-name', 'Distribution');
      await page.click('#nf-save');
      await pause(700);
      return { up, ...(await page.evaluate(() => {
        const sel = document.getElementById('tpllib-m-cat');
        return { value: sel.value, text: (sel.selectedOptions[0] || {}).textContent,
          has: [...sel.options].some(o => o.textContent.trim() === 'Distribution') };
      })) };
    })();
    check('8e · picking it opens the name box', madeCat.up === true, madeCat);
    check('8f · and the category is made AND chosen, so the reader ends up where they were going',
      madeCat.has === true && /Distribution/.test(madeCat.text || '') && madeCat.value !== '__new__',
      madeCat);

    const madeStream = await (async () => {
      await page.evaluate(() => {
        const sel = document.getElementById('tpllib-m-stream');
        sel.value = '__new__'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await pause(500);
      const up = await page.evaluate(() => !!document.getElementById('nf-name'));
      if (!up) return { up };
      await page.fill('#nf-name', 'Legal & Regulatory');
      await page.click('#nf-save');
      await pause(900);
      return { up, ...(await page.evaluate(() => {
        const sel = document.getElementById('tpllib-m-stream');
        return { value: sel.value, text: (sel.selectedOptions[0] || {}).textContent,
          inFolders: !!Object.values(FOLDERS).find(f => f.name === 'Legal & Regulatory') };
      })) };
    })();
    check('8g · the same door works for a value stream', madeStream.up === true, madeStream);
    check('8h · it is chosen, and it joined FOLDERS \u2014 the map every other picker reads',
      /Legal/.test(madeStream.text || '') && madeStream.value !== '__new__' && madeStream.inFolders === true,
      madeStream);

    /* THE POINT OF THE WHOLE CHANGE: a colleague can see it. Read back off the
       SERVER, not off the page that just drew it. */
    await pause(600);
    const onServer = await page.evaluate(async () => {
      const b = await api('bootstrap');
      const s = (b && b.settings) || {};
      return { streams: (s.valueStreams || []).map(x => x.name),
        cats: (s.templateCategories || []).map(x => x.name) };
    });
    check('8i · THE REAL FAULT: the value stream is on the SERVER, not in one browser',
      onServer.streams.includes('Legal & Regulatory'), onServer);
    check('8j · and so is the category, which could not be created at all before',
      onServer.cats.includes('Distribution'), onServer);

    /* ===== 9 · THE BUTTON'S WORDS, AND A CONVERTED DOCUMENT IS FILED
       (Young ruled 18 Sep 2026) =====
       *"Highlighted button should be named '+ Build new template'. As for the
       converting a document option, there should have an option to categorize
       it into a Value Stream."* Both read off the PAINTED page, and the second
       one is driven: the dialog is opened with a real press and its pickers are
       read off the DOM, because a select nobody wired is a dead option and that
       is exactly the drift these two dialogs have had before. */
    /* RE-POINTED IN PLACE, 24 Sep 2026 (Young's go on "One Door to
       Standards"). Decision 4 named the button "+ New standard contract", and
       "Convert a document" went from beside it: converting a document is one
       of the three starts behind it ("From a template you have" → Upload a
       file), where the document is COPIED rather than re-typed. The 18 Sep ask
       — a converted document is filed in a value stream — is kept, where
       decision 5 put it: the start asks nothing about filing, and the builder
       opens with the Stream chip at its head, amber until it is chosen, one
       press from the stream picker and its create door. */
    await page.evaluate(() => { try { closeModal(); } catch (_) {} setView('templates'); });
    await pause(900);
    /* RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): "no New standard here any more: From
       scratch starts on the New agreement page, the one door" (MAP; owner, 14 Nov 2026: "the only door is the new
       agreement page. From there you have 3 choices, or two if you do not have access to build from scratch"). The
       claims are asked of that door: the New agreement sheet's third tab says what it does (From scratch), Our paper
       carries no New standard of its own and no Convert a document beside anything; its four starts lead to "From a
       template you have", whose first thing is the find box with the file chooser in it, and which asks nothing about
       filing. The copy then opens in the builder, as before (9d, 9e). */
    await page.evaluate(() => { tplPageSetTab('book'); });
    await pause(500);
    const onPaper = await page.evaluate(() => ({ newHere: !!document.querySelector('#tpl-new, [data-tpln-new]'), conv: !!document.getElementById('tpl-convert') }));
    await page.evaluate(() => openNewAgreement({}));
    for (let i = 0; i < 20 && !(await page.evaluate(() => !!document.querySelector('[data-na-newpaper]'))); i++) await pause(250);
    const words = await page.evaluate(() => {
      const n = document.querySelector('[data-na-newpaper]'), tabs = [...document.querySelectorAll('.na-ptab')].map(b => b.textContent.trim());
      return { newBtn: n ? n.textContent.trim() : null, tabs };
    });
    Object.assign(words, onPaper);
    check('9a · the one door says what it does: the New agreement sheet\u2019s third tab, From scratch',
      words.newBtn === 'From scratch' && words.tabs[words.tabs.length - 1] === 'From scratch', words);
    /* RE-POINTED (P-34, owner's pick 20 Nov 2026: Our paper the Legora + Stripe way): the picked head draws "New standard"
       (black) beside Our playbook › on Our paper — the pick is the owner's yes to that door; it opens the same act as
       From scratch (#tpl-new → openNewStandard), never a second way of its own. No Convert a document beside it. */
    check('9b · Our paper\'s head carries New standard (the owner\'s pick, the same act as From scratch), no Convert a document beside it', words.newHere && !words.conv, words);

    await page.click('[data-na-newpaper]');
    await pause(500);
    await page.evaluate(() => { const r = document.querySelector('#na-np input[name="na-np"][value="template"]'); if (r){ r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
      const go = document.getElementById('na-np-go'); if (go) go.click(); });
    for (let i = 0; i < 20 && !(await page.evaluate(() => !!document.getElementById('nsl-file'))); i++) await pause(250);
    await page.screenshot({ path: path.join(OUT, '09-from-a-template.png') });
    const conv = await page.evaluate(() => {
      const box = document.querySelector('.nsl [data-nsl-drop]');
      const first = box && box.querySelector('input');
      const host = document.querySelector('.nsl');
      return { firstIsFind: !!first && first.id === 'nsl-q', file: !!(box && box.querySelector('#nsl-file')),
        pickers: host ? host.querySelectorAll('select').length : -1 };
    });
    check('9f · the find box leads, and the file chooser is in it',
      conv.firstIsFind && conv.file, conv);
    check('9c · the start asks nothing about filing — no category or stream picker on it (decision 5)',
      conv.pickers === 0, conv);

    await page.setInputFiles('#nsl-file', { name: 'Carrier terms.txt', mimeType: 'text/plain',
      buffer: Buffer.from('CARRIER AGREEMENT\n\n1. Services\n\nThe Carrier shall collect and deliver the goods.\n\n2. Fees\n\nThe Customer shall pay the fees in the order.\n') });
    for (let i = 0; i < 20; i++) { await pause(300); if (await page.evaluate(() => !!document.querySelector('[data-nsl-go="__file"]'))) break; }
    await page.evaluate(() => { const b = document.querySelector('[data-nsl-go="__file"]'); if (b && !b.disabled) b.click(); });
    for (let i = 0; i < 20; i++) { await pause(400); if (await page.evaluate(() => !!document.querySelector('[data-tb-meta="stream"]'))) break; }
    await pause(800);
    const chip = await page.evaluate(() => {
      const b = document.querySelector('[data-tb-meta="stream"]');
      /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the head's chips are words on the white band, no
         box — an empty one says it by its word's amber ink (index.html .tb-fchip.empty .v), set against a filed chip's ink */
      const v = e => e && e.querySelector('.v') ? getComputedStyle(e.querySelector('.v')).color : '';
      const filed = [...document.querySelectorAll('.tb-fchip[data-tb-meta]:not(.empty)')][0];
      return b ? { empty: b.classList.contains('empty'), ink: v(b), filedInk: v(filed), text: b.textContent.replace(/\s+/g, ' ').trim() } : null;
    });
    await page.screenshot({ path: path.join(OUT, '09-copied-head.png') });
    check('9d · THE REPORTED GAP, WHERE IT LIVES NOW: the copy opens with a Stream chip that is plainly not filed yet',
      !!chip && chip.empty && !!chip.ink && !!chip.filedInk && chip.ink !== chip.filedInk && /choose/i.test(chip.text), chip);
    await page.evaluate(() => { const b = document.querySelector('[data-tb-meta="stream"]'); if (b) b.click(); });
    await pause(700);
    const streamBox = await page.evaluate(() => {
      const sel = document.getElementById('tpllib-m-stream');
      return { focused: document.activeElement && document.activeElement.id,
        opts: sel ? [...sel.options].map(o => o.value) : [] };
    });
    check('9e · one press opens the stream picker with the caret in it, and its create door is there — not a dead list',
      streamBox.focused === 'tpllib-m-stream' && streamBox.opts.length > 1 && streamBox.opts.includes('__new__'), streamBox);
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    await pause(300);

    check('6a · the page threw nothing', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('harness', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { bad.forEach(b => console.log('  FAIL ' + b.name)); process.exit(1); }
})();
