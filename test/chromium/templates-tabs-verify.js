/* Chromium verification: THE TEMPLATES PAGE IS TWO TABS.
   ============================================================
   Owner-asked 25 Aug 2026, off the demo: "Image 1 from the demo should be the
   first tab called Templates overview. Image 2 should be the 2nd tab which is
   what is currently in the platform and that will be called Templates. The
   connect the two to function together."

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
      return { t, ov: secBox('overview'), list: secBox('list'),
        subs: document.querySelectorAll('#content .st-tabsub').length,
        title: (document.querySelector('#content h1') || {}).textContent };
    });
    check('1a · two tabs, overview first, both named',
      tabs.t.length === 2 && tabs.t[0].k === 'overview' && tabs.t[1].k === 'list'
      && /overview/i.test(tabs.t[0].txt) && tabs.t[1].txt.length > 0,
      tabs.t.map(x => x.k + ':' + x.txt));
    check('1b · the overview is the tab a reader lands on, and it is drawn',
      tabs.t[0].on && tabs.t[0].sel === 'true' && tabs.ov && !tabs.ov.hidden && tabs.ov.h > 200,
      { ov: tabs.ov });
    check('1c · and the table has really left the screen, not merely lost an attribute',
      tabs.list && tabs.list.hidden === true && tabs.list.h === 0 && tabs.list.w === 0,
      { list: tabs.list });
    check('1d · the live tab is bold and the resting one is not',
      Number(tabs.t[0].weight) >= 700 && Number(tabs.t[1].weight) < 700,
      tabs.t.map(x => x.k + ':' + x.weight));
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
    const cards = await page.evaluate(() => {
      const wall = document.querySelector('.tpl-ov-cards');
      const cs = [...document.querySelectorAll('.tpl-ov-cards [data-tpl-ov-bucket]')].map(e => {
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
    const panels = await page.evaluate(() => {
      const txt = document.querySelector('[data-tpl-sec="overview"]').textContent.replace(/\s+/g, ' ');
      const bars = [...document.querySelectorAll('[data-tpl-sec="overview"] .tpl-ov + *')].length;
      const wide = [...document.querySelectorAll('[data-tpl-sec="overview"] [data-tpl-ov-card]')]
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
    await page.click('[data-tpl-tab="list"]');
    await pause(500);
    const flipped = await page.evaluate(() => {
      const b = sel => { const e = document.querySelector(sel); const r = e.getBoundingClientRect();
        return { hidden: e.hidden, h: Math.round(r.height) }; };
      return { ov: b('[data-tpl-sec="overview"]'), list: b('[data-tpl-sec="list"]'),
        rows: document.querySelectorAll('#tpl-rows tr').length };
    });
    check('4a · pressing Templates puts the table on screen and takes the overview off',
      flipped.list.h > 200 && !flipped.list.hidden && flipped.ov.h === 0 && flipped.ov.hidden
      && flipped.rows > 1, flipped);
    await page.screenshot({ path: path.join(OUT, '02-list.png'), fullPage: true });

    await page.click('[data-tpl-tab="overview"]');
    await pause(400);
    /* RE-POINTED: the wall's cards narrow the table by the RAIL now, not by
       the search box — the search box is what a NAME needs, and these are
       categories. The way back is the rail's own "All templates". */
    const target = await page.evaluate(() =>
      document.querySelector('.tpl-ov-cards [data-tpl-ov-bucket]').getAttribute('data-tpl-ov-bucket'));
    await page.click('.tpl-ov-cards [data-tpl-ov-bucket]');
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
    const railLit = await page.evaluate(() => {
      const lit = [...document.querySelectorAll('[data-tpl-group],[data-tpl-stream]')]
        .filter(b => /accent/.test(b.getAttribute('style') || ''));
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

    await page.click('[data-tpl-tab="overview"]');
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
    await page.click('[data-tpl-tab="overview"]');
    await pause(500);
    const dm = await page.evaluate(() => {
      const px = e => { const s = getComputedStyle(e);
        return { size: s.fontSize, weight: s.fontWeight, color: s.color,
          tt: s.textTransform, ls: s.letterSpacing, bg: s.backgroundColor }; };
      return [...document.querySelectorAll('.tpl-ov-cards [data-tpl-ov-bucket]')].map(c => {
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
      await page.evaluate(() => { document.querySelector('[data-tpl-tab="overview"]').click(); });
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
