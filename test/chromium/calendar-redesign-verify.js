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
    await page.evaluate(() => setView('calendar'));
    await pause(1400);
    await page.screenshot({ path: path.join(OUT, '01-month.png') });

    /* ---- 1. THE MOCK-UP'S OWN SHAPE ---- */
    const shape = await page.evaluate(() => {
      const seen = s => { const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
        return { w: Math.round(r.width), h: Math.round(r.height), y: Math.round(r.y),
          on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' }; };
      return { head: seen('.cal-head'), bar: seen('.cal-bar'),
        grid: seen('.cal-grid'), panel: seen('.cal-panel'),
        title: (document.querySelector('.cal-head .ttl') || {}).textContent || '',
        stat: (document.querySelector('.cal-stat') || {}).textContent || '',
        pageHead: (document.getElementById('page-head') || {}).innerHTML || '',
        tabs: [...document.querySelectorAll('[data-cal-view]')].map(a => a.textContent.replace(/\s+/g, ' ').trim()),
        scope: [...document.querySelectorAll('[data-cal-scope]')].map(a => a.textContent.trim()),
        acts: [...document.querySelectorAll('.cal-acts > button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()),
        legend: [...document.querySelectorAll('.cal-legend span')].map(s => s.textContent.trim()),
        dow: [...document.querySelectorAll('.cal-grid .cal-dow span')].map(s => s.textContent.trim()) };
    });
    check('1 the head is one band and the bar sits under it',
      shape.head && shape.head.on && shape.bar && shape.bar.on && shape.bar.y > shape.head.y,
      { head: shape.head, bar: shape.bar });
    check('1 and the shell draws no second head above it',
      shape.pageHead.trim() === '', shape.pageHead.slice(0, 60));
    check('1 the title is the nav\'s own word, not a second name for the page',
      shape.title.trim() === 'Calendar', shape.title);
    check('1 it says how many decisions fall this week', /decision|Nothing to decide/i.test(shape.stat), shape.stat);
    check('1 two views, and the live one carries a count',
      shape.tabs.length === 2 && /Month\s*\d+/.test(shape.tabs[0]), shape.tabs);
    /* ---- ONE WHITE BAND, NOT TWO (owner-reported 24 Aug 2026: "remove the
           line in the highlighted area") ----
       The head and the control bar are two elements, both white and touching,
       and each carried its own bottom hairline — so a band meant to read as one
       card was ruled across the middle. The rule under the TABS stays; the one
       between the title and the tabs goes. Written as a relation: the head must
       draw no bottom edge of any kind, and the bar must still draw one. */
    const band = await page.evaluate(() => {
      const edge = el => { const cs = getComputedStyle(el);
        return { sh: cs.boxShadow, bb: cs.borderBottomWidth, bg: cs.backgroundColor,
          y: Math.round(el.getBoundingClientRect().y),
          bottom: Math.round(el.getBoundingClientRect().bottom) }; };
      const h = document.querySelector('.cal-head'), b = document.querySelector('.cal-bar');
      return h && b ? { head: edge(h), bar: edge(b) } : null;
    });
    check('1 the head draws no rule between itself and the tabs',
      band && band.head.sh === 'none' && band.head.bb === '0px',
      band && { shadow: band.head.sh, border: band.head.bb });
    check('1 and the tab row still closes the band with one',
      band && band.bar.sh !== 'none', band && band.bar.sh);
    check('1 both halves are the same white, and they touch',
      band && band.head.bg === band.bar.bg && band.head.bottom === band.bar.y,
      band && { head: band.head.bg, bar: band.bar.bg, gap: band && band.bar.y - band.head.bottom });
    check('1 the scope is two options, not two states', shape.scope.length === 2, shape.scope);
    check('1 the month grid and a panel beside it',
      shape.grid && shape.panel && shape.panel.w >= 300 && shape.grid.w > shape.panel.w,
      { grid: shape.grid && shape.grid.w, panel: shape.panel && shape.panel.w });
    check('1 the week starts on Monday', shape.dow[0] && /^M/i.test(shape.dow[0]), shape.dow);
    check('1 four tones in the legend', shape.legend.length === 4, shape.legend);

    /* ---- 2. THE OWNER'S ONE CONSTRAINT ---- */
    for (const [w, hh, name] of [[1500, 900, 'a desk'], [1440, 900, 'MacBook'],
      [1366, 768, 'ThinkPad'], [1280, 720, 'a short window']]) {
      await page.setViewportSize({ width: w, height: hh });
      await pause(300);
      await page.evaluate(() => renderCalendar());
      await pause(400);
      const fit = await page.evaluate(() => {
        const sc = document.getElementById('content-scroll');
        const g = document.getElementById('cal-grid');
        const cells = g ? [...g.children] : [];
        const gr = g && g.getBoundingClientRect();
        return { pageScroll: sc ? sc.scrollHeight - sc.clientHeight : null,
          gridScroll: g ? g.scrollHeight - g.clientHeight : null,
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
    const tones = await page.evaluate(() =>
      [...document.querySelectorAll('.cal-legend i')].map(i => getComputedStyle(i).backgroundColor));
    let worst = 999, pair = '';
    for (let i = 0; i < tones.length; i++) for (let j = i + 1; j < tones.length; j++) {
      const d = (function (a, b) { const p = (a.match(/\d+/g) || []).slice(0, 3).map(Number),
        q = (b.match(/\d+/g) || []).slice(0, 3).map(Number);
        return Math.round(Math.sqrt(p.reduce((s, v, k) => s + (v - q[k]) ** 2, 0))); })(tones[i], tones[j]);
      if (d < worst) { worst = d; pair = `${tones[i]} vs ${tones[j]}`; }
    }
    check('3 no two legend tones are the same colour', worst > 60, `closest pair ${worst}: ${pair}`);

    /* ---- 4. THE THREE VIEWS ----
       REWRITTEN 24 Aug 2026 (owner-ruled: build Horizon and Obligations, retire
       Quarter and List). Quarter drew the month grid three times and answered
       no question Month does not; List printed every date in order, which the
       agenda beside the month already does for the window a reader can act on.
       What replaces them each answers something nothing in HaTi did — when the
       book runs out, and what is owed. The claims below are the same SHAPE as
       the ones they replace: the view draws its own thing, and it fits. */
    await page.click('[data-cal-view="horizon"]');
    await pause(900);
    await page.screenshot({ path: path.join(OUT, '02-horizon.png') });
    const hz = await page.evaluate(() => {
      const sc = document.getElementById('content-scroll');
      const bars = [...document.querySelectorAll('.cal-hz-bar')];
      return { rows: document.querySelectorAll('.cal-hz-row').length,
        months: document.querySelectorAll('.cal-hz-months span').length,
        bands: document.querySelectorAll('.cal-lad').length,
        /* a bar is time remaining, so a nearer expiry must be a SHORTER bar */
        widths: bars.map(b => Math.round(b.getBoundingClientRect().width)),
        ends: document.querySelectorAll('.cal-hz-end').length,
        scroll: sc ? sc.scrollHeight - sc.clientHeight : null };
    });
    check('4 Horizon draws twelve months and a row per contract',
      hz.months === 12 && hz.rows > 0, `${hz.rows} rows · ${hz.months} months`);
    check('4 every row carries a bar and an end marker',
      hz.ends === hz.rows && hz.widths.length === hz.rows, hz);
    /* THE BAR IS TIME REMAINING — the rows are sorted soonest-first, so the
       widths must not decrease. This is the claim the view exists for. */
    check('4 and the bars grow with the time left, soonest first',
      hz.widths.every((w, i) => i === 0 || w >= hz.widths[i - 1] - 1), hz.widths);
    check('4 the expiry ladder shows its five bands', hz.bands === 5, String(hz.bands));
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
      const rows = [...document.querySelectorAll('.cal-hz-row')];
      const over = [];
      let n = 0;
      for (const r of rows){
        const bar = r.querySelector('.cal-hz-bar');
        const note = r.querySelector('.cal-hz-note');
        if (!bar || !note) continue;
        n++;
        const b = bar.getBoundingClientRect(), t = note.getBoundingClientRect();
        const hit = t.left < b.right - 1 && t.right > b.left + 1
          && t.top < b.bottom - 1 && t.bottom > b.top + 1;
        if (hit) over.push(r.querySelector('.cal-hz-lab') ? r.querySelector('.cal-hz-lab').textContent.trim() : '?');
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
      tabs: [...document.querySelectorAll('[data-cal-view]')].map(e => e.getAttribute('data-cal-view')) }));
    check('4 Quarter, List and Obligations are retired, control and markup alike',
      !retired.q && !retired.l && !retired.o && !retired.qm && !retired.lr && !retired.ot,
      JSON.stringify(retired));
    check('4 and the tab row is exactly Month and Horizon',
      String(retired.tabs) === String(['month', 'horizon']), retired.tabs);

    /* ---- 5. ALL DATES / MINE ---- */
    await page.click('[data-cal-view="month"]');
    await pause(700);
    const before = await page.evaluate(() => document.querySelectorAll('.cal-chip').length);
    await page.click('[data-cal-scope="mine"]');
    await pause(700);
    const after = await page.evaluate(() => ({
      chips: document.querySelectorAll('.cal-chip').length,
      on: (document.querySelector('[data-cal-scope="mine"]') || {}).className }));
    check('5 Mine narrows the calendar and marks itself live',
      after.chips < before && /on/.test(after.on || ''), { before, after });
    await page.click('[data-cal-scope="all"]');
    await pause(700);
    check('5 and All dates gives them back',
      (await page.evaluate(() => document.querySelectorAll('.cal-chip').length)) === before);

    /* ---- 6. "ADD KEY DATE" WAS RULED OUT AND IS NOT DRAWN ---- */
    const noAdd = await page.evaluate(() => {
      const t = (document.querySelector('.cal-page') || document.body).innerText;
      return { text: /add key date/i.test(t),
        btn: !!document.querySelector('[data-cal-act="add"],#cal-add-key,#cal-add') };
    });
    check('6 the ruled-out button is not drawn, as text or as a control',
      !noAdd.text && !noAdd.btn, noAdd);

    /* ---- 7. EXPORT REALLY PRODUCES A CALENDAR FILE ---- */
    const dl = page.waitForEvent('download', { timeout: 9000 });
    await page.click('#cal-export');
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
    await page.click('#cal-share');
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
    await page.fill('#cal-share-note', 'Here is what is coming up.');
    await page.click('#cal-share-go');
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

    /* ---- 9. DARK ---- */
    await page.evaluate(() => { document.documentElement.classList.add('dark'); renderCalendar(); });
    await pause(700);
    await page.screenshot({ path: path.join(OUT, '05-dark.png') });
    const dark = await page.evaluate(() => {
      const g = e => e ? getComputedStyle(e) : null;
      const seg = document.querySelector('.cal-seg span.on');
      const tab = document.querySelector('.cal-bar .views a.on');
      const chip = document.querySelector('.cal-chip');
      const legend = [...document.querySelectorAll('.cal-legend i')].map(i => g(i).backgroundColor);
      return { segBg: g(seg).backgroundColor, segFg: g(seg).color, tabFg: g(tab).color,
        chip: chip ? { bg: g(chip).backgroundColor, fg: g(chip).color } : null, legend };
    });
    /* The live tab was the one caught out on the negotiation page: dark does
       not redefine the accent ramp, so accent-800 on an almost-black panel is
       all but invisible. -300 is the step that reads. */
    check('9 dark: the live tab is a light accent, not the dark step',
      /(94, 234, 212|\d{3}, \d{3}, \d{3})/.test(dark.tabFg) && dist(dark.tabFg, 'rgb(15,118,110)') > 60,
      dark.tabFg);
    check('9 dark: the chips still draw', !!dark.chip, dark.chip);
    check('9 dark: the four tones are still tellable apart',
      (() => { let w = 999;
        for (let i = 0; i < dark.legend.length; i++) for (let j = i + 1; j < dark.legend.length; j++)
          w = Math.min(w, dist(dark.legend[i], dark.legend[j]));
        return w > 60; })(), dark.legend);

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
