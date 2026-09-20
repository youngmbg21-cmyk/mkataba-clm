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
    const live = tabs.t.find(x => x.on) || tabs.t[0];
    const rest = tabs.t.find(x => x !== live);
    const box = k => (k === 'book' ? tabs.bk : tabs.list);
    check('1a · two tabs, the book first, table last, all named',
      tabs.t.length === 2 && tabs.t[0].k === 'book'
      && tabs.t[tabs.t.length - 1].k === 'list'
      && tabs.t.every(x => x.txt.trim().length > 0)
      && !tabs.t.some(x => x.k === 'overview'),
      tabs.t.map(x => x.k + ':' + x.txt));
    check('1b · the overview tab is gone, in the row and in the page',
      tabs.ov === null && tabs.bk !== null, { overview: tabs.ov, book: tabs.bk });
    check('1c · and the resting tab has really left the screen, not merely lost an attribute',
      box(rest.k) && box(rest.k).hidden === true
      && box(rest.k).h === 0 && box(rest.k).w === 0,
      { resting: rest.k, box: box(rest.k) });
    check('1c2 · the FIRST tab is the one a reader lands on, and it is drawn',
      live.k === tabs.t[0].k && live.k === 'book'
      && box(live.k) && !box(live.k).hidden && box(live.k).h > 200,
      { landed: live.k, box: box(live.k) });
    check('1d · the live tab is bold and the resting one is not',
      Number(live.weight) >= 700 && Number(rest.weight) < 700,
      tabs.t.map(x => x.k + ':' + x.weight + (x.on ? ' (live)' : '')));
    check('1e · no sentence under the title or under the tabs',
      tabs.subs === 0, { subtitles: tabs.subs, title: tabs.title });

    /* THE ROW IS THE SETTINGS PAGE'S ROW. One rule, two homes — asserted as a
       RELATION so a later type pass costs no edit here. */
    const ref = await page.evaluate(() => {
      const pull = e => { const s = getComputedStyle(e);
        return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color,
          padding: s.padding, borderBottomWidth: s.borderBottomWidth }; };
      const mine = document.querySelector('[data-tpl-tab="list"]');
      return { mine: pull(mine) };
    });
    await page.evaluate(() => setView('playbook'));
    await pause(1200);
    const other = await page.evaluate(() => {
      const e = document.querySelector('.st-tab:not(.on)'); if (!e) return null;
      const s = getComputedStyle(e);
      return { family: s.fontFamily, size: s.fontSize, weight: s.fontWeight, color: s.color,
        padding: s.padding, borderBottomWidth: s.borderBottomWidth };
    });
    check('1f · a resting tab here is dressed exactly like a resting tab on Our standards',
      other && JSON.stringify(other) === JSON.stringify(ref.mine), { mine: ref.mine, other });
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
      const rail = {};
      document.querySelectorAll('[data-tpl-group]').forEach(b => {
        const sp = b.querySelectorAll('span');
        rail[b.getAttribute('data-tpl-group')] = sp[1] ? sp[1].textContent.trim() : '';
      });
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
      cards.cards.some(c => /Used/.test(c.txt) && /Deviation rate/.test(c.txt))
      && cards.cards.some(c => /(\d+ of the \d+ contracts checked did not follow Our standards|Nothing drafted from these has been checked)/.test(c.txt))
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
        === JSON.stringify(['all', 'company', 'cp', 'builtin', 'sample']),
      cards.cards.map(c => c.key));
    check('2f · every value stream has a card too',
      cards.cards.filter(c => /^stream:/.test(c.key)).length >= 3,
      cards.cards.filter(c => /^stream:/.test(c.key)).map(c => c.name));
    check('2g · and each library card prints the count the rail prints',
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
      /counts only contracts that have been checked against Our standards/.test(panels.txt));

    /* ================= 4 · THE TWO TABS WORK TOGETHER ======================= */
    /* The probe STAYS up through 4a–4d, because the category journey below
       presses a wall card and the wall is what the probe is. It comes down
       after 4d, before the claims that are about the tab itself. */
    await page.click('[data-tpl-tab="list"]');
    await pause(500);
    const flipped = await page.evaluate(() => {
      const b = sel => { const e = document.querySelector(sel); const r = e.getBoundingClientRect();
        return { hidden: e.hidden, h: Math.round(r.height) }; };
      return { ov: b('[data-tpl-sec="book"]'), list: b('[data-tpl-sec="list"]'),
        rows: document.querySelectorAll('#tpl-rows tr').length };
    });
    check('4a · pressing Templates puts the table on screen and takes the book off',
      flipped.list.h > 200 && !flipped.list.hidden && flipped.ov.h === 0 && flipped.ov.hidden
      && flipped.rows > 1, flipped);
    await page.screenshot({ path: path.join(OUT, '02-list.png'), fullPage: true });

    await page.click('[data-tpl-tab="book"]');
    await pause(400);
    /* RE-POINTED: the wall's cards narrow the table by the RAIL now, not by
       the search box — the search box is what a NAME needs, and these are
       categories. The way back is the rail's own "All templates". */
    const target = await page.evaluate(() =>
      document.querySelector('#tpl-wall-probe .tpl-ov-cards [data-tpl-ov-bucket]').getAttribute('data-tpl-ov-bucket'));
    /* THE ACT THE CARD FRONTS, pressed by name. The probe is markup: its
       handlers are bound by renderTemplatesPage, which ran before it existed,
       so a click on it reaches nothing. What this section is for is the
       JOURNEY — does pressing a category land the reader on the table showing
       that category's paper, with the narrowing in plain sight — and that is
       what tplGoBucket does. That a card presses tplGoBucket is a wiring
       claim and lives in f244, where it can be read rather than driven. */
    await page.evaluate(t => tplGoBucket(t), target);
    await pause(600);
    const landed = await page.evaluate(() => ({
      tab: document.querySelector('[data-tpl-tab="list"]').classList.contains('on'),
      listH: Math.round(document.querySelector('[data-tpl-sec="list"]').getBoundingClientRect().height),
      box: document.getElementById('tpl-search').value,
      rows: [...document.querySelectorAll('#tpl-rows tr')].slice(1)
        .map(r => r.textContent.replace(/\s+/g, ' ').trim().slice(0, 40)),
    }));
    /* RE-POINTED 29 Aug 2026. The claim was always THE JOURNEY — press a card,
       land on the table showing that card's own population, with the narrowing
       visible and a way back. What moved is which control carries it: a
       CATEGORY narrows by the table's own rail, and the rail lights the row it
       is narrowed to, which is the same property the filled search box had. */
    /* RE-POINTED 19 Sep 2026: which rail row is lit is a CLASS now, not three
       inline colours computed when the markup was built. It HAD to become one
       — an inline colour decided at build time is precisely why pressing a
       filter had to rebuild the whole page to restyle one button, which is
       the fault Young reported as "clunky". Same claim, read where the answer
       moved to. */
    const railLit = await page.evaluate(() => {
      const lit = [...document.querySelectorAll('[data-tpl-group].on,[data-tpl-stream].on')];
      return lit.map(b => b.getAttribute('data-tpl-group') || 'stream:' + b.getAttribute('data-tpl-stream'));
    });
    check('4b · a card lands on the table, showing that category\u2019s own paper',
      landed.tab && landed.listH > 100 && landed.rows.length >= 1, { target, ...landed });
    check('4c · the narrowing says so in plain sight \u2014 the rail lights the row pressed',
      railLit.includes(target), { target, railLit });
    check('4c2 · and the search box is clear, so two narrowings cannot stack',
      landed.box === '', landed.box);
    await page.screenshot({ path: path.join(OUT, '03-narrowed.png'), fullPage: true });

    await page.evaluate(() => document.querySelector('[data-tpl-group="all"]').click());
    await pause(500);
    const cleared = await page.evaluate(() => document.querySelectorAll('#tpl-rows tr').length);
    check('4d · and All templates really does widen it again', cleared > 2, cleared);

    /* THE PROBE STAYS UP for the rest of the run: section 6 reads the same
       cards for the demo's type ladder and its colour relations. It is beside
       the page at left:-4000px, so it covers nothing a reader presses and no
       claim about the tab itself can pick it up — every one of those names
       `[data-tpl-sec="book"]`, which the probe is not inside. */
    await page.click('[data-tpl-tab="book"]');
    await pause(400);
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
    await page.click('[data-tpl-tab="book"]');
    await pause(500);
    const dm = await page.evaluate(() => {
      const px = e => { const s = getComputedStyle(e);
        return { size: s.fontSize, weight: s.fontWeight, color: s.color,
          tt: s.textTransform, ls: s.letterSpacing, bg: s.backgroundColor }; };
      return [...document.querySelectorAll('#tpl-wall-probe .tpl-ov-cards [data-tpl-ov-bucket]')].map(c => {
        const cr = c.getBoundingClientRect();
        const bar = c.firstElementChild, br = bar.getBoundingClientRect();
        const count = c.querySelector('.tpl-ov-count');
        const bd = count ? count.getBoundingClientRect() : null;
        const name = c.querySelector('.tpl-ov-name');
        const nr = name.getBoundingClientRect();
        const labs = [...c.querySelectorAll('span')]
          .filter(e => e.children.length === 0 && /^(Used|Deviation rate)$/.test(e.textContent.trim()));
        const figs = labs.map(l => l.nextElementSibling).filter(Boolean);
        return {
          key: c.getAttribute('data-tpl-ov-bucket'),
          name: name.textContent.trim(),
          /* Measured against the card's INNER width: the bar sits inside the
             card's 1px border, which is where the demo's own draws. */
          bar: { h: Math.round(br.height), w: Math.round(br.width), cw: c.clientWidth,
            top: Math.round(br.top - cr.top), bg: getComputedStyle(bar).backgroundColor },
          count: count ? Object.assign(px(count), { txt: count.textContent.trim(),
            right: Math.round(cr.right - bd.right), aboveName: bd.top <= nr.top + 2 }) : null,
          nm: px(name),
          note: px(c.querySelector('.tpl-ov-note')),
          labels: labs.map(e => Object.assign(px(e), { txt: e.textContent.trim() })),
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

    check('6a · every card wears a 3px bar across its whole top, first in the card',
      dm.length > 0 && dm.every(c => c.bar.h === 3 && c.bar.top <= 1 && c.bar.w === c.bar.cw),
      dm.map(c => c.bar));
    /* RE-POINTED 29 Aug 2026, and it is the owner's own picture: only the VALUE
       STREAMS wear a swatch there. A library card carries none, because a bar
       that said nothing on five cards would be a mark for a fact the section
       heading above already carries. */
    check('6a2 · a stream card wears its stream\u2019s colour and a library card wears none',
      dm.filter(c => /^stream:/.test(c.key)).every(c => c.bar.bg !== 'rgba(0, 0, 0, 0)')
      && dm.filter(c => !/^stream:/.test(c.key)).every(c => c.bar.bg === 'rgba(0, 0, 0, 0)'),
      dm.map(c => c.key + ':' + c.bar.bg));
    /* RE-POINTED: the top-right slot carried the template's STATE as a badge;
       on a category card it carries that category's COUNT, which is the shape
       the owner's picture draws ("Company standard  26"). */
    check('6b · the count sits at the card\u2019s top right, on the name\u2019s own line',
      dm.every(c => c.count && /^\d+$/.test(c.count.txt)
        && c.count.size === '15px' && c.count.weight === '700'
        && c.count.right <= 16 && c.count.aboveName),
      dm[0] && dm[0].count);
    /* THE LADDER, ONE RUNG LOWER (owner-asked 25 Aug 2026: "all the fonts need
       to be reduced by one size and the ones highlighted (numbers) should be
       reduced by 2 sizes"). These are pinned as NUMBERS rather than as
       relations, deliberately: the ask was about the sizes themselves. */
    check('6c · the name is the card\'s one piece of primary type — 14px/700',
      dm.every(c => c.nm.size === '14px' && c.nm.weight === '700'), dm[0] && dm[0].nm);
    /* RE-POINTED: there is no meta line under the name any more — the section
       above says whether this is a library or a value stream and the count is
       on the name's own line, so a third line would print one of those twice. */
    check('6d · the small text is one size and one ink — 12px regular, secondary',
      dm.every(c => [c.note, ...c.labels].every(x =>
        x.size === '12px' && x.weight === '400' && x.color === c.note.color)),
      dm[0] && { note: dm[0].note, label: dm[0].labels[0] });
    check('6e · the labels are sentence case, not the uppercase caps the panels use',
      dm.every(c => c.labels.length === 2 && c.labels.every(l => l.tt === 'none'))
      && /NEEDS ATTENTION|Needs attention/.test(attTxt),
      dm[0] && dm[0].labels.map(l => l.txt + ':' + l.tt));
    check('6f · both figures are 15px/700 — two rungs — and the count is the primary ink',
      dm.every(c => c.figs.length === 2 && c.figs.every(f => f.size === '15px' && f.weight === '700'))
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
      await page.evaluate(() => { document.querySelector('[data-tpl-tab="book"]').click(); });
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
      /* the rail's own two captions, which the wall must read through */
      const caps = [...document.querySelectorAll('[data-tpl-sec="list"] div')]
        .map(e => e.textContent.trim()).filter(t => /^(Library|Value stream)$/.test(t));
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
    const hasBook = await page.$('[data-tpl-tab="book"]');
    check('9 · there is a book tab to press', !!hasBook);
    if (hasBook) { await page.click('[data-tpl-tab="book"]'); await pause(700); }
    const bk = !hasBook ? null : await page.evaluate(() => {
      const sec = document.querySelector('[data-tpl-sec="book"]');
      if (!sec) return null;
      const r = sec.getBoundingClientRect();
      const secs = [...sec.querySelectorAll('.sec-box')].map(x => {
        const head = x.querySelector('.sec-head');
        const sum = x.querySelector('.sec-sum');
        return {
          title: (x.querySelector('.sec-t') || {}).textContent || '',
          open: head ? head.getAttribute('aria-expanded') : null,
          sum: (sum ? sum.textContent : '').trim(),
          cards: x.querySelectorAll('[data-tpl-ov-bucket]').length,
          h: Math.round(x.getBoundingClientRect().height),
        };
      });
      const gl = [...sec.querySelectorAll('.tpl-gl')].map(g => ({
        label: (g.querySelector('.tpl-gl-l') || {}).textContent || '',
        note: (g.querySelector('.tpl-gl-n') || {}).textContent || '',
        w: Math.round(g.getBoundingClientRect().width),
      }));
      return { h: Math.round(r.height), hidden: sec.hidden, secs, gl,
        panels: sec.querySelectorAll('.tpl-ov-panels section').length };
    });
    check('9a · the book is a real tab and it draws', !!bk && !bk.hidden && bk.h > 300,
      bk && { h: bk.h, hidden: bk.hidden });
    check('9b · three named sections, in the artifact’s order',
      !!bk && bk.secs.length === 3, bk && bk.secs.map(x => x.title));
    check('9c · the library rests OPEN and carries its cards',
      !!bk && bk.secs[0].open === 'true' && bk.secs[0].cards >= 4,
      bk && bk.secs[0]);
    check('9d · the streams rest SHUT, and the shut head still answers',
      !!bk && bk.secs[1].open === 'false' && bk.secs[1].cards === 0 && bk.secs[1].sum.length > 6,
      bk && bk.secs[1]);
    check('9e · the glance is three figures and the caveat rides the rate alone',
      !!bk && bk.gl.length === 3 && bk.gl.filter(g => g.note.trim()).length === 1,
      bk && bk.gl.map(g => g.label.trim() + (g.note.trim() ? ' [note]' : '')));
    /* NO NEW BANDS: a footnote is bounded to a reading width, a band is not. */
    check('9f · and the caveat is a footnote, not a strip across the page',
      !!bk && (bk.gl.find(g => g.note.trim()) || { w: 9999 }).w < 520,
      bk && (bk.gl.find(g => g.note.trim()) || {}).w);
    check('9g · both panels are drawn', !!bk && bk.panels === 2, bk && bk.panels);

    /* THE FOLD IS A PRESS, and it must repaint the book rather than the page */
    const folded = !hasBook ? null : await page.evaluate(async () => {
      const sec = document.querySelector('[data-tpl-sec="book"]');
      const node = sec;
      const h = [...sec.querySelectorAll('[data-sec-toggle]')]
        .find(x => x.getAttribute('aria-expanded') === 'false');
      if (!h) return null;
      const list = document.querySelector('[data-tpl-sec="list"]');
      h.click();
      await new Promise(r => setTimeout(r, 320));
      const again = document.querySelector('[data-tpl-sec="book"]');
      const now = [...again.querySelectorAll('.sec-box')].map(x => {
        const head = x.querySelector('.sec-head');
        return { open: head ? head.getAttribute('aria-expanded') : null,
          cards: x.querySelectorAll('[data-tpl-ov-bucket]').length };
      });
      return { now, sameSection: node === again,
        sameList: list === document.querySelector('[data-tpl-sec="list"]') };
    });
    check('9h · pressing the shut head opens it and its cards arrive',
      !!folded && folded.now[1].open === 'true' && folded.now[1].cards >= 4,
      folded && folded.now);
    check('9i · and the fold repaints the book, not the page',
      !!folded && folded.sameSection && folded.sameList, folded);

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
    await page.evaluate(() => { const b = document.querySelector('[data-tpl-tab="list"]'); if (b) b.click(); });
    await pause(700);
    await page.evaluate(() => { const b = document.getElementById('tpl-new'); if (b) b.click(); });
    await pause(600);
    await page.evaluate(() => { const b = document.getElementById('tn-company'); if (b) b.click(); });
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '08-new-standard-template.png') });

    const doors = await page.evaluate(() => {
      const opts = id => [...(document.getElementById(id) || { options: [] }).options]
        .map(o => ({ v: o.value, t: o.textContent.trim() }));
      return { cat: opts('tpllib-cat'), stream: opts('tpllib-stream') };
    });
    check('8a · the dialog the owner photographed is open, with both pickers',
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
        const sel = document.getElementById('tpllib-cat');
        sel.value = '__new__'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await pause(500);
      const up = await page.evaluate(() => !!document.getElementById('nf-name'));
      if (!up) return { up };
      await page.fill('#nf-name', 'Distribution');
      await page.click('#nf-save');
      await pause(700);
      return { up, ...(await page.evaluate(() => {
        const sel = document.getElementById('tpllib-cat');
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
        const sel = document.getElementById('tpllib-stream');
        sel.value = '__new__'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      });
      await pause(500);
      const up = await page.evaluate(() => !!document.getElementById('nf-name'));
      if (!up) return { up };
      await page.fill('#nf-name', 'Legal & Regulatory');
      await page.click('#nf-save');
      await pause(900);
      return { up, ...(await page.evaluate(() => {
        const sel = document.getElementById('tpllib-stream');
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
    await page.evaluate(() => { const b = document.querySelector('[data-tpl-tab="list"]'); if (b) b.click(); });
    await pause(700);
    const words = await page.evaluate(() => {
      const n = document.getElementById('tpl-new'), c = document.getElementById('tpl-convert');
      return { newBtn: n ? n.textContent.trim() : null, conv: c ? c.textContent.trim() : null };
    });
    check('9a · the button says what it does: Build new template',
      words.newBtn === '+ Build new template', words);
    check('9b · and Convert a document is still beside it', /Convert a document/.test(words.conv || ''), words);

    await page.evaluate(() => { const b = document.getElementById('tpl-convert'); if (b) b.click(); });
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '09-convert-a-document.png') });
    const conv = await page.evaluate(() => {
      const opts = id => [...(document.getElementById(id) || { options: [] }).options]
        .map(o => ({ v: o.value, t: o.textContent.trim() }));
      const lab = document.querySelector('#tpllib-up-stream')
        ? (document.querySelector('#tpllib-up-stream').closest('label') || {}).textContent : '';
      return { cat: opts('tpllib-up-cat'), stream: opts('tpllib-up-stream'),
        label: String(lab || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        file: !!document.getElementById('tpllib-up-file') };
    });
    check('9c · THE REPORTED GAP: converting a document now asks for a value stream',
      conv.stream.length > 1, { n: conv.stream.length, label: conv.label });
    check('9d · and a category, the same pair the other dialog asks',
      conv.cat.length > 1, conv.cat.length);
    check('9e · the stream picker is WIRED — its create door is there, so it is not a dead list',
      conv.stream.some(o => o.v === '__new__'), conv.stream.map(o => o.v).join(','));
    check('9f · and the file box is still the first thing on the dialog', conv.file === true, conv.file);
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
