/* Chromium verification: THE CALENDAR TAKES THE MOCK-UP.
   ============================================================
   Owner-approved render, 22 Aug 2026, with one constraint stated in the ask:
   "the calendar should fit with the page and not a need to scroll within the
   page." The render's day boxes are a fixed 104px and six rows of those plus
   the head, the bar and the legend need more height than a laptop has — so the
   rows FLEX and the cells give up height rather than the month giving up a
   week. Section 2 is that constraint, measured at four window sizes including
   two that the old grid's clamp could not serve.

   WHY THIS IS A BROWSER FILE. Every claim is a computed value, a geometry or a
   journey, and jsdom can answer none of them:

     · "it fits the page" is a measurement of a scroll container against its
       content, at real window sizes;
     · the four legend tones must be TELLABLE APART, and the one that was wrong
       was wrong because --st-steel-dot resolves to the workspace accent — a
       fact you can only get from a browser resolving a custom property. That
       is the pipeline card's recorded trap, met again;
     · Export really downloads a file, and what is in it is checked;
     · Share really posts, and the mail really lands in the outbox with the
       dates the reader was looking at.

   "Add key date" is on the render and was ruled out by the owner the same day
   (every date here comes off a contract). Section 6 asserts its ABSENCE — a
   button ruled out is the kind that comes back by accident.

   Run: node test/chromium/calendar-redesign-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'calendar-redesign');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* Dates spread across the month being looked at, so every tone and both lists
   have something to draw: expiries, a notice period (which mints the renewal
   decision), obligations open and done, and a closed negotiation round. */
const SEED = () => {
  const D = ['2026-08-25', '2026-08-28', '2026-09-10', '2026-09-02'];
  /* ---- A LONG BAR, OR SECTION 4a CANNOT FAIL ----
     Every seeded expiry below is weeks away, so every horizon bar is short and
     its date hangs OUTSIDE the bar whatever the rule says. The fault reported
     on 24 Aug 2026 was a date written on top of a LONG bar, so the fixture has
     to carry one. It is given no notice period and no obligations, and its
     expiry falls outside the month on screen, so it adds an event to nothing
     but the horizon. */
  const far = state.contracts[0] && JSON.parse(JSON.stringify(state.contracts[0]));
  state.contracts.forEach((c, i) => {
    c.expiry = D[i % D.length];
    c.metadata = Object.assign({}, c.metadata, { expiryDate: D[i % D.length], noticePeriodDays: 7 });
    c.obligations = [
      { id: 'ob' + i + 'a', desc: 'Insurance certificate', due: '2026-08-' + String(24 + i).padStart(2, '0'),
        status: 'open', assignee: 'Amina Otieno' },
      { id: 'ob' + i + 'b', desc: 'Quarterly volume report', due: '2026-08-' + String(10 + i).padStart(2, '0'),
        status: i === 0 ? 'done' : 'open', assignee: 'Bull' },
      /* ---- THE ONE THAT MADE THE REPORT (owner, 24 Aug 2026) ----
         A real obligation is whatever Copilot read out of the wording, and that
         is regularly a whole drafted sentence. With only the two short descs
         above, the table looked fine and a check written against it would have
         passed on the congested build. It shares ob-a's DATE on purpose, so the
         month grid's per-day contract counts are not disturbed by adding it. */
      { id: 'ob' + i + 'c', status: 'open', assignee: 'Amina Otieno',
        due: '2026-08-' + String(24 + i).padStart(2, '0'),
        desc: 'The Supplier shall maintain in force throughout the Term product '
          + 'liability insurance with a reputable insurer for not less than KES '
          + '50,000,000 per occurrence and shall furnish a certificate of currency '
          + 'to the Buyer on each anniversary of the Effective Date.' }];
    c.negotiation = Object.assign({ round: 2, turnAt: '2026-08-12T09:00:00.000Z' }, c.negotiation,
      { rounds: [{ n: 1, at: '2026-08-04T09:00:00.000Z', changes: [] }] });
  });
  if (far){
    /* Ten months out, counted from TODAY rather than typed, so this fixture
       cannot go stale the way a pinned calendar date does. */
    const d = new Date(); d.setMonth(d.getMonth() + 10);
    const iso = d.toISOString().slice(0, 10);
    far.id = 'MK-HZ1'; far.name = 'Long-dated supply agreement';
    far.expiry = iso;
    far.metadata = { expiryDate: iso };
    far.obligations = []; far.negotiation = null; far.audit = [];
    state.contracts.push(far);
  }
};

/* Two colours are tellable apart when they differ by more than a shade. Plain
   Euclidean distance in sRGB is crude and is enough for the question actually
   being asked — "are these the same colour?" — which is what went wrong when
   the fourth tone resolved to the workspace accent. */
const RGB = s => (String(s).match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);
const dist = (a, b) => { const [x, y, z] = RGB(a), [p, q, r] = RGB(b);
  return Math.round(Math.sqrt((x - p) ** 2 + (y - q) ** 2 + (z - r) ** 2)); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  /* THE PAGE'S TODAY IS THE DAY THE SEED WAS WRITTEN (bug log: sections 5, 7
     and 8 went red once the real month left August 2026 — a test whose
     answer depends on the day it runs). The seed's dates are relative to 22
     Aug 2026, so the browser is told that is today; timers still run. */
  await page.clock.setFixedTime(new Date('2026-08-22T09:00:00'));
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
    /* the calendar opens on this week and five more since round 16 (18 Oct 2026); this check is about the month, so it asks for it */
    await page.evaluate(() => { setView('calendar'); calSetView('month'); });
    await pause(1400);
    await page.screenshot({ path: path.join(OUT, '01-month.png') });

    /* ---- 1. THE MOCK-UP'S OWN SHAPE ---- */
    const shape = await page.evaluate(() => {
      const seen = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y), x: Math.round(r.x),
          on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }; };
      /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): ONE page (.cal-page.is-ls) — head .cls-head (Calendar · the one switch · + New event · ⋯), the ask box,
         the chips, and the month (#cal-grid, a soft seven-day grid, .cls-mh heads, .cls-d days); Jambo's panel beside it */
      return { head: seen('.cls-head'), bar: seen('.cls-chips'),
        grid: seen('#cal-grid'), panel: seen('#cal-plan'), stage: seen('.cal-page.is-ls'),
        title: (document.querySelector('.cal-head .ttl') || {}).textContent || '',
        stat: (document.querySelector('.cal-stat') || {}).textContent || '',
        pageHead: (document.getElementById('page-head') || {}).innerHTML || '',
        /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762): the new head draws its own tabs and scope; the
           old segmented controls are still in the markup, hidden — what a reader sees is what is counted */
        tabs: [...document.querySelectorAll('[data-cal-view]')].filter(a => a.getBoundingClientRect().height > 0).map(a => a.textContent.replace(/\s+/g, ' ').trim()),
        /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): All dates | Mine is the Whose chip (calLsWhosePass: all · mine · ours · theirs) */
        scope: [...document.querySelectorAll('[data-cal-ls-chip="whose"]')].filter(a => a.getBoundingClientRect().height > 0).map(a => a.textContent.trim()),
        scopeChoices: calLsChoices('whose', calLsBase('month')),
        acts: [...document.querySelectorAll('.cal-acts > button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): no key on the drawing — a day's pill wears its kind's tone (CAL_LS_TONE) and the Kind chip names the kinds */
        legend: [...new Set([...document.querySelectorAll('#cal-grid .cls-ev')].map(e => [...e.classList].find(k => /^is-/.test(k))))],
        kindTones: calLsChoices('kind', calLsBase('month')).filter(k => k !== 'all').map(k => 'is-' + (CAL_LS_TONE[k] || 'gray')),
        kindChip: !!document.querySelector('[data-cal-ls-chip="kind"]'),
        kindsOnMonth: new Set(calVisible(calendarEvents()).filter(e => calInPeriod(e, calPeriod())).map(e => e.type)).size,
        dow: [...document.querySelectorAll('#cal-grid .cls-mh')].map(s => s.textContent.trim()),
        weekend: (() => { const d = [...document.querySelectorAll('#cal-grid .cls-d')];
          return d.length === 42 && d.every((x, i) => x.classList.contains('is-we') === (i % 7 >= 5)); })() };
    });
    /* ---- RE-POINTED IN PLACE 21 Sep 2026 (Young: the calendar must look
       exactly like the artifact) ---- the reference draws ONE head: the title
       over its own sub-line on the left, and every control on the right. The
       tab row under it is gone, so .cal-bar is stale and the claim that a bar
       sits under the head cannot be asked. What it was really pinning — one
       white band carrying the page's controls, with no second head above it —
       is what is asked here and in the three claims below. */
    /* ---- RE-POINTED 11 Oct 2026 (WORKORDER-four-builds item 1: Calendar is
       Home's second tab) ---- the calendar draws no head of its own on Home:
       Home's head (the greeting and the tabs) is the page's ONE head, the
       Calendar tab is lit in it, and the calendar's ⋯ stands at the end of
       its first bar. */
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the one head is .cls-head, its ⋯ at its end */
    const homeHead = await page.evaluate(() => ({ calHead: !!document.querySelector('#hb-cal .cls-head'),
      /* the lit tab is the desk's since 17 Oct 2026 (Round 2): Home's face in front */
      tab: (typeof deskKeyNow === 'function' && deskKeyNow() === 'home:calendar') ? 'calendar' : null,
      more: !!document.querySelector('#hb-cal .cal-bar1 #cal-more'), moreHead: !!document.querySelector('#hb-cal .cls-head #cal-more') }));
    /* RE-POINTED 18 Oct 2026 (lane A4, round 16 as drawn): Home's own head is
       not drawn on a computer since main's "‹ · HA · the page's name", so the
       calendar draws its ONE head on Home — and the ⋯ stands at its end */
    check('1 on Home the calendar draws its one head; Home\'s Calendar face is the one in front',
      homeHead.calHead && homeHead.tab === 'calendar', JSON.stringify(homeHead));
    check('1 and its ⋯ stands at the end of that head', homeHead.moreHead);
    check('1 the head prints no decisions line (the drawing has none)', shape.stat === '', shape.stat);
    /* RE-POINTED 10 Oct 2026 (Young: "one calendar" — Month · Week · Horizon) */
    /* RE-POINTED 28 Oct 2026 (round 12): the Agenda leads the tabs */
    check('1 four views, plain words, no count on the live one',
      shape.tabs.length === 4 && shape.tabs.join(' ') === 'Agenda Month Week Horizon', shape.tabs);
    /* ---- ONE WHITE BAND, NOT TWO (owner-reported 24 Aug 2026: "remove the
           line in the highlighted area") ----
       The head and the control bar are two elements, both white and touching,
       and each carried its own bottom hairline — so a band meant to read as one
       card was ruled across the middle. The rule under the TABS stays; the one
       between the title and the tabs goes. Written as a relation: the head must
       draw no bottom edge of any kind, and the bar must still draw one. */
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the old two-option scope is ONE Whose chip whose choices still include everything and Mine */
    check('1 the scope is the Whose chip, offering all and Mine', shape.scope.length === 1
      && shape.scopeChoices.includes('all') && shape.scopeChoices.includes('mine'), { scope: shape.scope, choices: shape.scopeChoices });
    /* RE-POINTED IN PLACE 21 Sep 2026: the reference stacks them — the month
       across the whole page, the key under it, Next 14 days as a card below
       that. The panel was a 304px column beside the grid, which made the
       month's own cells the narrowest thing on the page. Both still draw, and
       now they measure the SAME width, which is the stack. */
    /* RE-POINTED AGAIN 9 Oct 2026 (SAP benchmark, batch 2): the drawing puts
       Next 14 days BESIDE the month, a narrower card on the right whose top
       sits level with the month's. */
    /* RE-POINTED 11 Oct 2026 (Young: "build it exactly as designed"): Next 14
       days is gone and Copilot stands beside the calendar, a narrower column
       on the right of ONE card whose top it shares. */
    /* RE-POINTED 11 Oct 2026: on Home its Copilot is Home's one panel, on
       the right of the whole page, beside the calendar card */
    check('1 the month runs the page, with Copilot beside it on the right, in Home\'s panel',
      shape.grid && shape.panel && shape.stage && shape.panel.w < shape.grid.w
        && shape.panel.x > shape.grid.x + shape.grid.w - 1
        && !!(await page.evaluate(() => !!document.querySelector('#ig-dock #cal-plan'))),
      { grid: shape.grid && shape.grid.w, panel: shape.panel && shape.panel.w,
        stageY: shape.stage && shape.stage.y, panelY: shape.panel && shape.panel.y });
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the picked drawing's month is a soft SEVEN-day grid (reverses round 16's Monday to Friday on the month):
       it still starts on Monday, and Saturday and Sunday are the quieter two columns */
    check('1 the week starts on Monday; Saturday and Sunday are the quiet two columns', shape.dow[0] && /^M/i.test(shape.dow[0]) && shape.dow.length === 7 && /^F/i.test(shape.dow[4]) && shape.weekend, { dow: shape.dow, weekend: shape.weekend });
    /* RE-POINTED IN PLACE 9 Oct 2026 (SAP benchmark, batch 2): the drawing's
       key names only the kinds that month carries. A relation, so it holds on
       whatever day this runs: one key entry per kind on the month, no more. */
    /* RE-POINTED 18 Oct 2026 (lane A4, round 16 as drawn): the key is the
       drawing's five — Ours · Theirs · Contract date · Mine · Jambo's plan —
       and its three parts are the layers' switches, so it is always drawn whole */
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the drawing has no key; every tone a day's pill wears is a kind's, and the Kind chip offers those kinds by name */
    check('1 every colour on the month is a kind the Kind chip names', shape.legend.length > 0 && shape.kindChip
      && shape.legend.every(t => shape.kindTones.includes(t)), { legend: shape.legend, kinds: shape.kindTones, chip: shape.kindChip });

    /* ---- 2. THE OWNER'S ONE CONSTRAINT ---- */
    for (const [w, hh, name] of [[1500, 900, 'a desk'], [1440, 900, 'MacBook'],
      [1366, 768, 'ThinkPad'], [1280, 720, 'a short window']]) {
      await page.setViewportSize({ width: w, height: hh });
      await pause(300);
      await page.evaluate(() => renderCalendar());
      await pause(400);
      const fit = await page.evaluate(() => {
        const sc = document.getElementById('content-scroll');
        /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the month's days are .cls-d, seven a week, in the page's one scroller #cal-ls-body: all six weeks
           stand in it whole and it does not scroll */
        const g = document.getElementById('cal-grid'), body = document.getElementById('cal-ls-body');
        const cells = g ? [...g.querySelectorAll('.cls-d')] : [];
        const gr = body && body.getBoundingClientRect();
        return { pageScroll: sc ? sc.scrollHeight - sc.clientHeight : null,
          gridScroll: body ? body.scrollHeight - body.clientHeight : null,
          rows: cells.length / 7,
          hidden: gr ? cells.filter(c => c.getBoundingClientRect().bottom > gr.bottom + 1).length : null,
          lastNumber: cells.length ? (cells[cells.length - 1].textContent || '').trim().slice(0, 2) : null };
      });
      check(`2 ${name} (${w}x${hh}): the page does not scroll`, fit.pageScroll === 0, fit);
      check(`2 ${name}: all six weeks, none hidden, and the grid itself does not scroll`,
        fit.rows === 6 && fit.hidden === 0 && fit.gridScroll === 0, fit);
    }
    await page.setViewportSize({ width: 1500, height: 900 });
    await pause(300);
    await page.evaluate(() => renderCalendar());
    await pause(500);

    /* ---- 3. FOUR TONES A READER CAN TELL APART ----
       The one that was wrong was --st-steel-dot, which resolves to
       var(--color-accent-500) — so in the teal workspace negotiation activity
       and obligations drew as two shades of one colour and the legend answered
       "green" twice. It is only visible once a browser resolves the property. */
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the strong tones are the time-left bars' (.cls-bk i: ruby · amber · steel · gray, the -dot tokens the old key's
       dots were); each is resolved by the browser on the page itself, so a token resolving to the accent shows */
    const BAR_TONES = () => { const pg = document.querySelector('.cal-page.is-ls'); if (!pg) return [];
      return ['ruby', 'amber', 'steel', 'gray'].map(k => { const b = document.createElement('span'); b.className = 'cls-bk';
        b.innerHTML = '<i class="is-' + k + '" style="width:50%"></i>'; pg.appendChild(b);
        const c = getComputedStyle(b.firstChild).backgroundColor; b.remove(); return c; }); };
    const tones = await page.evaluate(BAR_TONES);
    let worst = 999, pair = '';
    for (let i = 0; i < tones.length; i++) for (let j = i + 1; j < tones.length; j++) {
      const d = (function (a, b) { const p = (a.match(/\d+/g) || []).slice(0, 3).map(Number),
        q = (b.match(/\d+/g) || []).slice(0, 3).map(Number);
        return Math.round(Math.sqrt(p.reduce((s, v, k) => s + (v - q[k]) ** 2, 0))); })(tones[i], tones[j]);
      if (d < worst) { worst = d; pair = `${tones[i]} vs ${tones[j]}`; }
    }
    check('3 no two tones are the same colour', tones.length === 4 && worst > 60, `closest pair ${worst}: ${pair}`);

    /* ---- 4. THE THREE VIEWS ----
       REWRITTEN 24 Aug 2026 (owner-ruled: build Horizon and Obligations, retire
       Quarter and List). Quarter drew the month grid three times and answered
       no question Month does not; List printed every date in order, which the
       agenda beside the month already does for the window a reader can act on.
       What replaces them each answers something nothing in HaTi did — when the
       book runs out, and what is owed. The claims below are the same SHAPE as
       the ones they replace: the view draws its own thing, and it fits. */
    await page.click('.cal-nl-tabs [data-cal-view="horizon"]');
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '02-horizon.png') });
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): Horizon is one calm table, a row per agreement (.cls-t.is-hz .cls-r): its renewal words, the time left as a
       slim bar measured on one year (.cls-bk i, width = days / 365), the decision as a soft badge (.cls-dec .cls-b) and the
       end date with its notice day in its own column (.cls-end) — no ruler of months, no ladder */
    const hz = await page.evaluate(() => {
      const sc = document.getElementById('content-scroll');
      const rowEls = [...document.querySelectorAll('.cls-t.is-hz tbody .cls-r')];
      const bars = rowEls.map(r => r.querySelector('.cls-bk i')).filter(Boolean);
      const H = calLsHzRead();
      const want = H.rows.map(r => Math.max(2, Math.min(100, r.days / 365 * 100)));
      return { rows: rowEls.length, data: H.rows.length,
        year: bars.length === want.length && bars.every((b, i) => Math.abs(parseFloat(b.style.width) - want[i]) < 0.1),
        bands: rowEls.filter(r => r.querySelector('.cls-dec .cls-b')).length,
        widths: bars.map(b => Math.round(b.getBoundingClientRect().width)),
        ends: rowEls.filter(r => { const e = r.querySelector('.cls-end'); return e && e.textContent.trim(); }).length,
        scroll: sc ? sc.scrollHeight - sc.clientHeight : null };
    });
    check('4 Horizon draws a row per contract, its bar the time left on a one-year scale',
      hz.rows > 0 && hz.rows === hz.data && hz.year, `${hz.rows} rows of ${hz.data} · year scale ${hz.year}`);
    check('4 every row carries a bar and an end marker',
      hz.ends === hz.rows && hz.widths.length === hz.rows, hz);
    /* THE BAR IS TIME REMAINING — the rows are sorted soonest-first, so the
       widths must not decrease. This is the claim the view exists for. */
    check('4 and the bars grow with the time left, soonest first',
      hz.widths.every((w, i) => i === 0 || w >= hz.widths[i - 1] - 1), hz.widths);
    check('4 every row says its renewal decision as a soft badge', hz.rows > 0 && hz.bands === hz.rows, String(hz.bands));
    check('4 and Horizon fits the page', hz.scroll === 0, String(hz.scroll));

    /* ---- 4a. NO DATE IS EVER WRITTEN ON A BAR (owner-reported 24 Aug 2026:
           "you keep using fonts that are invisible") ----
       The notice date used to be placed INSIDE the bar whenever the bar was
       long enough to hold it, which put grey text on a saturated teal fill —
       and the longer the bar, the worse it read. The design puts it below the
       bar every time. THE CLAIM IS GEOMETRY, not a colour name: no note may
       overlap the bar it belongs to, on any row, whatever the bar's length.
       Written as a sweep over every row on purpose — the old rule was a BRANCH,
       so a check on one row could pass while the long rows were unreadable. */
    const notes = await page.evaluate(() => {
      /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the notice day is written in the row's end column (.cls-end .cls-ts), never on the bar */
      const rows = [...document.querySelectorAll('.cls-t.is-hz tbody .cls-r')];
      const over = [];
      let n = 0;
      for (const r of rows){
        const bar = r.querySelector('.cls-bk');
        const note = r.querySelector('.cls-end .cls-ts');
        if (!bar || !note) continue;
        n++;
        const b = bar.getBoundingClientRect(), t = note.getBoundingClientRect();
        const hit = t.left < b.right - 1 && t.right > b.left + 1
          && t.top < b.bottom - 1 && t.bottom > b.top + 1;
        if (hit) over.push(r.querySelector('.cls-what .cls-t') ? r.querySelector('.cls-what .cls-t').textContent.trim() : '?');
      }
      return { n, over };
    });
    check('4a every notice date sits clear of its bar, on the card',
      notes.n > 0 && notes.over.length === 0, notes);

    /* ---- THE RETIRED VIEWS ARE GONE, as controls and as markup ----
       Quarter and List went on 24 Aug 2026 when Horizon and Obligations
       replaced them; OBLIGATIONS went the same evening, owner-ruled off a
       screenshot ("delete the obligations page"). Its rows are not lost — an
       obligation is still an event on the month grid and in the agenda beside
       it, which is where it sits next to the date it falls on. What went is the
       third tab and the whole-book table behind it. */
    const retired = await page.evaluate(() => ({
      q: document.querySelectorAll('[data-cal-view="quarter"]').length,
      l: document.querySelectorAll('[data-cal-view="list"]').length,
      o: document.querySelectorAll('[data-cal-view="obligations"]').length,
      qm: document.querySelectorAll('.cal-q-m').length,
      lr: document.querySelectorAll('.cal-list-row').length,
      ot: document.querySelectorAll('.cal-obt,.cal-obwrap,.cal-obfoot').length,
      /* and the tab row is exactly the two that are left */
      tabs: [...document.querySelectorAll('[data-cal-view]')].filter(e => e.getBoundingClientRect().height > 0).map(e => e.getAttribute('data-cal-view')) }));
    check('4 Quarter, List and Obligations are retired, control and markup alike',
      !retired.q && !retired.l && !retired.o && !retired.qm && !retired.lr && !retired.ot,
      JSON.stringify(retired));
    check('4 and the tab row is exactly Agenda, Month, Week and Horizon (the Agenda since 28 Oct 2026)',
      String(retired.tabs) === String(['agenda', 'month', 'week', 'horizon']), retired.tabs);

    /* ---- 5. ALL DATES / MINE ---- */
    await page.click('.cal-nl-tabs [data-cal-view="month"]');
    await pause(700);
    /* RE-POINTED IN PLACE 28 Sep 2026: the seeded contracts now record who
       owns them, and the sign-in that seeds them owns them all, so "Mine"
       rightly equals "All". Every other contract is handed to a colleague on
       the page (a reading, never saved) so the cut has something to leave out. */
    await page.evaluate(() => { state.contracts.forEach((c, i) => { if (i % 2) c.owner = { id: 'u-someone-else', name: 'Someone Else' }; }); renderCalendar(); });
    await pause(500);
    /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): All dates | Mine is the Whose chip — each press steps it (all → mine → ours → theirs → all); the count
       is the All chip's own number, the dates the month draws */
    const count = () => page.evaluate(() => { const b = document.querySelector('[data-cal-ls-show="all"] b'); return b ? Number(b.textContent) : -1; });
    const whose = () => page.evaluate(() => calLsF().whose);
    const before = await count();
    if (await page.$('[data-cal-ls-chip="whose"]')) await page.click('[data-cal-ls-chip="whose"]', { timeout: 5000 }).catch(() => {});
    await page.waitForFunction(() => calLsF().whose === 'mine', null, { timeout: 4000 }).catch(() => {});
    const after = { chips: await count(), whose: await whose(),
      on: await page.evaluate(() => (document.querySelector('[data-cal-ls-chip="whose"]') || {}).className || '') };
    check('5 Mine narrows the calendar and marks itself live',
      after.whose === 'mine' && after.chips >= 0 && after.chips < before && /is-on/.test(after.on), { before, after });
    for (let i = 0; i < 4 && (await whose()) !== 'all'; i++){
      await page.click('[data-cal-ls-chip="whose"]', { timeout: 5000 }).catch(() => {});
      await page.waitForFunction(w => calLsF().whose !== w, after.whose, { timeout: 3000 }).catch(() => {}); }
    check('5 and All dates gives them back', (await whose()) === 'all' && (await count()) === before);

    /* ---- 6. "ADD KEY DATE" WAS RULED OUT AND IS NOT DRAWN ---- */
    const noAdd = await page.evaluate(() => {
      const t = (document.querySelector('.cal-page') || document.body).innerText;
      return { text: /add key date/i.test(t),
        btn: !!document.querySelector('[data-cal-act="add"],#cal-add-key,#cal-add') };
    });
    check('6 the ruled-out button is not drawn, as text or as a control',
      !noAdd.text && !noAdd.btn, noAdd);

    /* ---- 7. EXPORT REALLY PRODUCES A CALENDAR FILE ---- */
    /* Export and Share live in the ⋯ menu now (SAP benchmark, batch 2), so
       the reader opens it first, as a reader would. */
    /* a door that is not drawn REPORTS, never times out (the catch is fastened at once) */
    const dl = page.waitForEvent('download', { timeout: 9000 }).catch(() => null);
    const moreUp = await page.click('#cal-more', { timeout: 5000 }).then(() => true, () => false);
    check('7 the ⋯ (Export, Share) is drawn and pressable', moreUp);
    if (moreUp) await page.click('#cal-export', { timeout: 5000 }).catch(() => {});
    const file = await dl.catch(() => null);
    check('7 Export downloads a file', !!file, file && file.suggestedFilename());
    if (file) {
      const fp = path.join(OUT, file.suggestedFilename());
      await file.saveAs(fp);
      const t = fs.readFileSync(fp, 'utf8');
      const n = (t.match(/BEGIN:VEVENT/g) || []).length;
      check('7 and it is a calendar file a reader can import',
        t.startsWith('BEGIN:VCALENDAR') && t.trim().endsWith('END:VCALENDAR') && n > 0, `${n} events`);
      check('7 every event is all-day, with a stable id and a summary',
        (t.match(/DTSTART;VALUE=DATE:\d{8}/g) || []).length === n
        && (t.match(/^UID:/gm) || []).length === n
        && (t.match(/^SUMMARY:/gm) || []).length === n);
      check('7 and it carries the period on screen and nothing else',
        /DTSTART;VALUE=DATE:202608/.test(t) && !/DTSTART;VALUE=DATE:2026(07|09|10)/.test(t));
    }

    /* ---- 8. SHARE REALLY REACHES A COLLEAGUE ---- */
    await page.click('#cal-more', { timeout: 5000 }).catch(() => {});
    await page.click('#cal-share', { timeout: 5000 }).catch(() => {});
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '04-share.png') });
    const who = await page.evaluate(() => {
      const s = document.getElementById('cal-share-who');
      const me = window.currentUser ? currentUser() : null;
      return s ? { opts: [...s.options].map(o => o.textContent.trim()), me: me && me.name } : null;
    });
    check('8 the dialog names colleagues, with the address it will write to',
      who && who.opts.length >= 1 && /@/.test(who.opts[0]), who && who.opts);
    check('8 and never offers the sender themselves',
      who && !who.opts.some(o => o.includes(who.me)), who && who.me);
    await page.fill('#cal-share-note', 'Here is what is coming up.', { timeout: 5000 }).catch(() => {});
    await page.click('#cal-share-go', { timeout: 5000 }).catch(() => {});
    await pause(2200);
    const outcome = await page.evaluate(async () => {
      const stillOpen = !!document.querySelector('#modal-root #cal-share-go');
      let rows = [];
      try { const r = await api('outbox'); rows = r.items || r.rows || (Array.isArray(r) ? r : []); } catch (e) {}
      const mine = rows.filter(x => /shared the contract calendar/i.test(x.subject || ''));
      return { stillOpen, found: mine.length, to: mine.map(x => x.to_addr),
        body: (mine[0] && mine[0].body) || '' };
    });
    check('8 the dialog closes when it has gone', !outcome.stillOpen);
    check('8 exactly one message, to the colleague\'s own address on file',
      outcome.found === 1 && /@/.test(outcome.to[0] || ''), outcome.to);
    check('8 carrying the dates the reader was looking at',
      /2026-08-2\d/.test(outcome.body), outcome.body.slice(0, 90));
    check('8 and the note the sender typed', /coming up/i.test(outcome.body));

    /* ---- 9. ONE LOOK ----
       RE-POINTED 21 Oct 2026 (Chambers): dark mode is gone from HaTi (only
       Explorer's map and the Brain keep their dark stage). The old night pass
       becomes the absence it now is: the class that once turned the calendar
       dark repaints nothing, and the chips and the four tones still draw. */
    const look = async () => Object.assign(await page.evaluate(() => {
      const g = e => e ? getComputedStyle(e) : null;
      /* RE-POINTED 23 Nov 2026 (P-14, "Calendar, the Legora + Stripe way, on all four tabs", owner: Build P-14): the chosen chip, the lit view in the one switch, a day's pill and the bars' tones */
      const seg = document.querySelector('.cal-page.is-ls .cls-chip.is-on');
      const tab = document.querySelector('.cls-seg a.on');
      const chip = document.querySelector('#cal-grid .cls-ev');
      return { segBg: seg ? g(seg).backgroundColor : null, segFg: seg ? g(seg).color : null, tabFg: tab ? g(tab).color : null,
        page: g(document.body).backgroundColor,
        chip: chip ? { bg: g(chip).backgroundColor, fg: g(chip).color } : null };
    }), { legend: await page.evaluate(BAR_TONES) });
    const day = await look();
    await page.evaluate(() => { document.documentElement.classList.add('dark'); renderCalendar(); });
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '05-one-look.png') });
    const night = await look();
    await page.evaluate(() => { document.documentElement.classList.remove('dark'); renderCalendar(); });
    check('9 one look: the old dark class repaints nothing',
      !!day.tabFg && JSON.stringify(day) === JSON.stringify(night), JSON.stringify({ day: day.tabFg + ' ' + day.page, night: night.tabFg + ' ' + night.page }));
    check('9 the chips still draw', !!day.chip, day.chip);
    check('9 the four tones are still tellable apart',
      (() => { let w = 999;
        for (let i = 0; i < day.legend.length; i++) for (let j = i + 1; j < day.legend.length; j++)
          w = Math.min(w, dist(day.legend[i], day.legend[j]));
        return day.legend.length >= 2 && w > 60; })(), day.legend);

    check('no page errors anywhere in the journey', errors.length === 0, errors.slice(0, 3));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  console.log(`Screenshots: ${OUT}`);
  process.exit(bad.length ? 1 : 0);
})();
