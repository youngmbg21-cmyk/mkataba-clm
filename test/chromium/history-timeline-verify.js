/* Chromium verification: THE HISTORY TAB READS AS A LINE OF TIME
   (Young ruled 24 Sep 2026, over a picture of the "HaTi — Production Polish"
   canvas: "Implement the highlighted designs in the picture in the history
   tab. The way the history is chronicled, the line attaching the history and
   rounds. Also the sentences above the names should be in black font.")

   WHAT THE PICTURE HIGHLIGHTED, AND WHAT IS MEASURED HERE:
     1  newest first — the canvas says "N events · newest first";
     2  the day over the time ("Today" / "22 Sept", then "09:40"), the year
        only where it is not this year;
     3  a RING in the kind's own tone, not a solid dot;
     4  ONE thin line joining the rings, starting at the first ring and ending
        at the last, and no rule across the page between entries;
     5  the round as "R1" at the right wall, the long name on the hover, and
        a dash where an entry belongs to no round;
     6  the sentence above the names in the page's own ink at the label weight.

   WHY A BROWSER FILE: every claim is a painted fact — a pseudo-element's
   position, a stacked line, a computed weight. jsdom resolves none of them.

   A TEST WHOSE ANSWER DEPENDS ON THE DAY IT RUNS IS WORSE THAN NO TEST: the
   expected day is worked out IN THE PAGE by an independent reading of the
   same rule (today → the word; another year → the year), never typed.

   CONTROLS pass on both sides by design: the five filters are still in the
   open, "Show the wording" still prints a proposal's redline, and the
   sentence was already in the page's own ink by day and by night (6a, 8a) —
   what made it read grey was its weight, and that is 6b.

   Run: node test/chromium/history-timeline-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'history-timeline');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Everything the page is asked, in one probe, so the light and dark readings
   are the same measurement. Returns null parts rather than throwing on a build
   without the design, so each claim REPORTS instead of timing out. */
/* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
   History tab went home — its twin is the Board's History view, drawn by the
   room's own painter (roomPaintHistory) into #hb-cv-body[data-hb-cv="hist"]
   with the same inner markup; the room's #ws-history-pane is gone. */
/* RE-POINTED 15 Oct 2026 (owner: the contract's views went; "History is in
   the board contract card"): the same painter draws the trail on the strip's
   History page (#bs-strips [data-bs-host="hist"]) */
const HP = '#bs-strips [data-bs-host="hist"]';
const PROBE = `(() => {
  const pane = document.querySelector(${JSON.stringify(HP)}) || document.getElementById('ws-history-pane');
  if (!pane) return { mounted: false };
  const tok = v => { const s = document.createElement('span');
    s.style.color = 'var(' + v + ')'; pane.appendChild(s);
    const c = getComputedStyle(s).color; s.remove(); return c; };
  const bg = v => { const s = document.createElement('span');
    s.style.backgroundColor = 'var(' + v + ')'; pane.appendChild(s);
    const c = getComputedStyle(s).backgroundColor; s.remove(); return c; };
  const wt = v => { const s = document.createElement('span');
    s.style.fontWeight = 'var(' + v + ')'; pane.appendChild(s);
    const w = getComputedStyle(s).fontWeight; s.remove(); return w; };
  const rows = [...pane.querySelectorAll('.hist-ev')];
  const px = v => parseFloat(v) || 0;
  const out = rows.map(r => {
    const rr = r.getBoundingClientRect();
    const dot = r.querySelector('.hist-dot');
    const dr = dot ? dot.getBoundingClientRect() : null;
    const dcs = dot ? getComputedStyle(dot) : null;
    const b = getComputedStyle(r, '::before');
    const drawn = b.content && b.content !== 'none' && b.position === 'absolute' && b.display !== 'none';
    const lineX = drawn ? rr.left + px(b.left) + px(b.width) / 2 : null;
    const lineTop = drawn ? rr.top + px(b.top) : null;
    const lineBot = drawn ? rr.bottom - px(b.bottom) : null;
    const day = r.querySelector('.hist-day'), time = r.querySelector('.hist-time');
    /* RE-POINTED 9 Oct 2026 (SAP batch 3): the round is a chip on the
       event's line, and the day is a heading over its entries. */
    const text = r.querySelector('.hist-text'), rnd = r.querySelector('.hist-rchip');
    let hd = r.previousElementSibling; while (hd && !hd.classList.contains('hist-day-h')) hd = hd.previousElementSibling;
    const tcs = text ? getComputedStyle(text) : null;
    return {
      text: text ? text.textContent.trim() : '',
      at: r.getAttribute('data-hist-at'),
      when: (r.querySelector('.hist-when') || {}).textContent || '',
      head: hd ? hd.textContent.replace(/\s+/g, ' ').trim() : null,
      headTip: hd ? (hd.getAttribute('title') || '') : null,
      sep: !!r.querySelector('.hist-top .hist-sep'),
      bubBg: (() => { const b = r.querySelector('.hist-bub'); return b ? getComputedStyle(b).backgroundColor : null; })(),
      whenTip: (r.querySelector('.hist-when') || { getAttribute: () => '' }).getAttribute('title') || '',
      pill: (() => { const p = r.querySelector('.hist-pill'); return p ? { cls: p.className, bg: getComputedStyle(p).backgroundColor } : null; })(),
      day: day ? day.textContent.trim() : null,
      time: time ? time.textContent.trim() : null,
      stacked: day && time ? time.getBoundingClientRect().top >= day.getBoundingClientRect().bottom - 1 : null,
      dot: dr ? { w: Math.round(dr.width), cx: dr.left + dr.width / 2, cy: dr.top + dr.height / 2,
        fill: dcs.backgroundColor, ring: dcs.borderTopColor, ringW: px(dcs.borderTopWidth) } : null,
      line: drawn ? { x: lineX, top: lineTop, bot: lineBot, w: px(b.width), color: b.backgroundColor } : null,
      rowTop: rr.top, rowBot: rr.bottom, rule: px(getComputedStyle(r).borderBottomWidth),
      edge: px(getComputedStyle(r.querySelector('.hist-bub, .hist-inside') || r).borderTopWidth),
      lane: r.getAttribute('data-hist-lane'),
      title: tcs ? { color: tcs.color, weight: tcs.fontWeight } : null,
      round: rnd ? { text: rnd.textContent.trim(), hover: rnd.getAttribute('title') || '',
        weight: getComputedStyle(rnd).fontWeight } : null,
    };
  });
  /* The tones a kind can wear, resolved live — HIST_KIND and HIST_OUTCOME_TONE
     are the one table, and a ring in any colour NOT on it is a ring nobody
     chose (the Tailwind preflight's own grey, for instance). */
  const tones = {};
  /* RE-POINTED 27 Sep 2026 (the owner's list, h8): a proposal's ring wears the
     accent's INK, which lightens after dark — the table's own entry changed. */
  for (const v of ['--accent-ink', '--st-green-dot', '--st-ruby-dot', '--st-amber-dot',
    '--st-steel-dot', '--color-neutral-400']) tones[v] = bg(v);
  const trail = pane.querySelector('.hist-trail'), tb = trail ? getComputedStyle(trail, '::before') : null, trr = trail ? trail.getBoundingClientRect() : null;
  const spine = tb && tb.content && tb.content !== 'none' && tb.display !== 'none' && tb.position === 'absolute'
    ? { x: trr.left + px(tb.left) + px(tb.width) / 2, mid: trr.left + trr.width / 2, w: px(tb.width) } : null;
  return { mounted: true, rows: out, spine,
    cap: (pane.querySelector('.hist-cap') || {}).textContent || '',
    filters: [...pane.querySelectorAll('.hist-f select')].filter(s => s.getBoundingClientRect().width > 0).length,
    ink: tok('--color-text'), surface: bg('--color-surface'), rule: bg('--rule'),
    label: wt('--w-label'), strong: wt('--w-strong'), tones };
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2600);

    /* ---- A RECORD WITH A ROUND AND WITH DAYS APART ----
       Two changes filed through the funnel (they carry round 1 and a time),
       one of them refused. */
    const id = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.status === 'Under Review') || state.contracts[0];
      negoInit(c);
      const cl = negoClauseList(c);
      await negoEditClause(c, cl[0].clauseId, '<p>Payment falls due within thirty (30) days.</p>',
        { side: 'owner', author: 'Wanjiru Kamau', summary: 'Net-30' });
      await negoEditClause(c, cl[1].clauseId, '<p>Either party may end this on ninety (90) days notice.</p>',
        { side: 'counterparty', author: 'Erik Lindqvist', summary: 'Notice to 90' });
      const chs = negoChanges(c);
      negoResolve(c, chs[1].id, 'rejected', { by: 'Wanjiru Kamau' });
      persist(c);
      return c.id;
    });
    await page.evaluate(i => window.openWorkspace(i, { room: true }), id);
    await page.waitForTimeout(1200);
    /* RE-POINTED 14 Oct 2026 (stage 5): the room has no History tab to press;
       the door that named it (roomOpenAt / roomGoTab 'history') opens the
       Board's History view for this contract, which may first show "Reading…"
       while the whole record loads — so the wait asks for the trail itself. */
    await page.evaluate(i => roomOpenAt(i, 'history'), id);
    await page.waitForFunction(sel => !!document.querySelector(sel + ' .hist-ev'), HP, { timeout: 10000 }).catch(() => {});

    /* Three system entries on known days, written straight onto the record the
       tab is drawing and repainted through the tab's own painter. Built from
       the page's own clock, so the claims below hold on any day. */
    await page.evaluate(i => {
      const c = getContract(i);
      const now = new Date();
      const at = d => d.toISOString();
      const earlier = new Date(now.getTime() - 3 * 86400000); earlier.setHours(10, 2, 0, 0);
      const lastYear = new Date(now.getFullYear() - 1, 2, 5, 14, 20, 0, 0);
      const today = new Date(now.getTime() - 5 * 60000);
      c.audit = (c.audit || []).concat([
        { at: at(lastYear), user: 'Amina Otieno', action: 'Staged', detail: 'a year ago' },
        { at: at(earlier), user: 'Amina Otieno', action: 'Staged', detail: 'three days ago' },
        { at: at(today), user: 'Amina Otieno', action: 'Staged', detail: 'today' },
      ]);
      /* RE-POINTED 14 Oct 2026 (stage 5): the painter, into the Board's host */
      const host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      if (host) roomPaintHistory(c, host._histF || {}, host); else roomPaintHistory(c);
    }, id);
    await page.waitForTimeout(400);
    /* The pane is looked up afresh for every photograph: a theme change
       repaints the room and a handle taken earlier would point at nothing. */
    const shot = async name => { const el = await page.$(HP) || await page.$('#ws-history-pane');
      if (el) await el.screenshot({ path: path.join(OUT, name) }); };
    await shot('01-history-light.png');

    /* RE-POINTED 14 Oct 2026 (stage 5): on the Board the trail sits where the
       pointer was left by the sign-in press, and a hovered row fills its ring;
       the claims are about the trail at rest, so the pointer is moved off it. */
    await page.mouse.move(2, 2);
    await page.waitForTimeout(150);
    const m = await page.evaluate(PROBE);
    ok('0 the History tab mounts with the staged record on it', m.mounted && m.rows.length >= 5,
      m.mounted ? m.rows.length + ' rows' : 'no pane');
    const rows = m.rows || [];
    const find = s => rows.findIndex(r => r.text.includes(s));
    const iToday = find('Staged — today'), iEarlier = find('Staged — three days ago'), iYear = find('Staged — a year ago');
    const staged = iToday >= 0 && iEarlier >= 0 && iYear >= 0;
    ok('0b the three staged days are on the page', staged, `${iToday} · ${iEarlier} · ${iYear}`);

    /* ================= 1. NEWEST FIRST ================= */
    ok('1a the newest entry leads and the oldest comes last', staged && iToday < iEarlier && iEarlier < iYear,
      `today at ${iToday}, three days ago at ${iEarlier}, a year ago at ${iYear}`);
    const ats = rows.map(r => r.at).filter(Boolean);
    ok('1b every entry is later than or level with the one under it',
      ats.length === rows.length && ats.every((a, k) => k === 0 || String(ats[k - 1]) >= String(a)),
      ats.length === rows.length ? 'in order' : `${ats.length} of ${rows.length} rows carry their time`);
    ok('1c the head says which way it runs', /newest first/i.test(m.cap || ''), JSON.stringify(m.cap));

    /* ================= 2. THE DAY OVER THE TIME ================= */
    const expect = await page.evaluate(i => {
      const c = getContract(i), now = new Date();
      const loc = typeof langLocale === 'function' ? langLocale() : undefined;
      const want = iso => { const d = new Date(iso);
        const same = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
        return { day: same ? i18t('ct_hist_today') : d.toLocaleDateString(loc, d.getFullYear() === now.getFullYear()
          ? { day: 'numeric', month: 'short' } : { day: 'numeric', month: 'short', year: 'numeric' }),
          time: typeof negoWhen === 'function' ? negoWhen(iso) : '' }; };
      const by = s => (c.audit || []).find(a => a.detail === s);
      return { today: want(by('today').at), earlier: want(by('three days ago').at), year: want(by('a year ago').at),
        yearNo: String(new Date(by('a year ago').at).getFullYear()), thisYear: String(now.getFullYear()),
        /* Three days back crosses into last year on 1-3 January; on those days
           the claim below has nothing to say, and says so rather than failing. */
        earlierOtherYear: new Date(by('three days ago').at).getFullYear() !== now.getFullYear() };
    }, id);
    const rT = rows[iToday] || {}, rE = rows[iEarlier] || {}, rY = rows[iYear] || {};
    /* RE-POINTED 9 Oct 2026 (SAP batch 3, "build exactly the drawings"): the
       DAY is a heading over its entries — the whole date, as drawn, with its
       count — and each row carries its time. Reverses 24 Sep's day-over-time. */
    /* RE-POINTED 18 Oct 2026 (round 12, "Two sides", as drawn): the day's
       pill says the day as a person says it — "Thu 15 Oct", the year only
       where it is not this one — and its count rides the pill's hover */
    const full = await page.evaluate(i => { const c = getContract(i), now = new Date();
      const loc = typeof langLocale === 'function' ? langLocale() : undefined;
      const f = s => { const d = new Date((c.audit || []).find(a => a.detail === s).at);
        const o = d.getFullYear() === now.getFullYear() ? { weekday: 'short', day: 'numeric', month: 'short' } : { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' };
        return new Intl.DateTimeFormat(loc, o).formatToParts(d).filter(x => x.type !== 'literal').map(x => x.value).join(' '); };
      return { today: f('today'), earlier: f('three days ago'), year: f('a year ago') }; }, id);
    /* RE-POINTED (B1 pass 4, round 12 as drawn: "Today, Mon 19 Oct"): today's pill says so before the day */
    ok('2a today\'s entry sits under a pill naming its day, "Today, <day>"', !!rT.head && rT.head === `Today, ${full.today}`,
      `${JSON.stringify(rT.head)} · expected ${JSON.stringify('Today, ' + full.today)}`);
    ok('2b and the row carries its time, in the product\'s one clock', rT.time === expect.today.time
      && /\d{1,2}[:.]\d{2}/.test(rT.time || ''), `${JSON.stringify(rT.time)} · expected ${JSON.stringify(expect.today.time)}`);
    ok('2c an earlier day has its own heading', !!rE.head && rE.head === full.earlier && rE.time === expect.earlier.time,
      `${JSON.stringify(rE.head)} ${JSON.stringify(rE.time)}`);
    ok('2d a day from another year carries its year', !!rY.head && rY.head.includes(expect.yearNo), JSON.stringify(rY.head));
    ok('2e the heading counts its entries, on its hover', !!rT.headTip && /event/i.test(rT.headTip) && !/event/i.test(rT.head || ''), JSON.stringify({ head: rT.head, tip: rT.headTip }));
    ok('2f no row prints the raw record date', rows.every(r => !/\d{4}-\d{2}-\d{2}/.test(r.when)),
      rows.map(r => r.when.replace(/\s+/g, ' ').trim()).slice(0, 4).join(' | '));

    /* ================= 3. A RING IN THE KIND'S TONE ================= */
    /* RE-POINTED 18 Oct 2026 (round 12, "Two sides", as drawn: "16:24 · PN Per
       Nordvik"): in a bubble the time is followed by a dot of punctuation, not
       the kind's ring — the kind's name rides the time's hover, and the tone
       that says a refusal is the outcome's own pill. An entry on the middle
       line keeps its ring, a hollow disc in the page's surface. */
    const bubbles = rows.filter(r => r.lane === 'ours' || r.lane === 'theirs'), mids = rows.filter(r => r.lane === 'mid');
    ok('3a a bubble\'s time is followed by a dot of punctuation, its kind on the hover; the middle line keeps its ring',
      bubbles.length > 0 && bubbles.every(r => r.sep && !r.dot && r.whenTip) && mids.every(r => r.dot && r.dot.fill === m.surface && r.dot.ringW >= 2),
      JSON.stringify({ bubbles: bubbles.map(r => [r.sep, !!r.dot, r.whenTip]).slice(0, 3), mids: mids.map(r => r.dot && r.dot.fill) }) + ' · surface ' + m.surface);
    const toneSet = Object.values(m.tones || {});
    ok('3b and a ring that stands carries one of the kinds\' own tones, never a colour nobody chose',
      mids.every(r => r.dot && toneSet.includes(r.dot.ring)), mids.map(r => r.dot && r.dot.ring).join(' | '));
    const refused = rows.find(x => /rejected/i.test(x.text));
    ok('3c the refusal still reads as a refusal (its pill in the ruby tone, not green)',
      !!(refused && refused.pill && /\bis-r\b/.test(refused.pill.cls)),
      refused && refused.pill ? JSON.stringify(refused.pill) : 'none');

    /* ================= 4. ROWS, AND ONE LINE PER DAY (12 Oct 2026) =================
       The drawing rules each entry off from the next; the rings of one day are
       joined by a line (owner, 12 Oct 2026, reversing 9 Oct's "no line"). */
    /* RE-POINTED 12 Oct 2026 (owner: "where there are multiple bubbles in a
       day, they should be joined by a line like the previous iterations"):
       within a day the rings are joined, from the first ring's middle to the
       last's; a day heading breaks the line; a day of one entry draws none. */
    const days = []; rows.forEach(r => { const d = days[days.length - 1]; if (d && d.head === r.head) d.rows.push(r); else days.push({ head: r.head, rows: [r] }); });
    const near = (a, b) => Math.abs(a - b) <= 1.5;
    const dayOk = d => {
      if (d.rows.length === 1){ const r = d.rows[0]; return !r.line || r.line.bot - r.line.top <= 1; }
      return d.rows.every((r, i) => r.line && r.dot && near(r.line.x, r.dot.cx)
        && near(r.line.top, i === 0 ? r.dot.cy : r.rowTop) && near(r.line.bot, i === d.rows.length - 1 ? r.dot.cy : r.rowBot));
    };
    const many = days.filter(d => d.rows.length > 1), one = days.filter(d => d.rows.length === 1);
    /* RE-POINTED 17 Oct 2026 (round 12: the owner picked "Two sides"): the
       days run down ONE middle line between the two lanes, behind the day
       pills, so no row draws a line of its own; each entry is its own bubble
       (or, on the middle line, its own pill) instead of a ruled row.
       dayOk/many/one stay for the record of what 12 Oct asked. */
    void many; void one; void dayOk;
    ok('4a the days run down one middle line between the lanes; no row draws its own',
      !!(m.spine && Math.abs(m.spine.x - m.spine.mid) <= 2 && m.spine.w >= 1) && rows.every(r => !r.line),
      JSON.stringify(m.spine) + ' · row lines ' + rows.filter(r => r.line).length);
    ok('4b each entry stands in its own edge: a bubble in its lane, or a pill on the middle line', rows.length > 0 && rows.every(r => r.edge >= 1),
      rows.map(r => r.lane + ':' + r.edge).join(','));

    /* ================= 5. THE ROUND AT THE RIGHT WALL ================= */
    /* RE-POINTED 18 Oct 2026 (round 12, "Two sides", as drawn): a change's
       entry says what happened to which clause in words ("Proposed a change to
       clause 1, …: Net-30"), so no clause or round chip trails it; the round's
       whole name rides the time's hover */
    const ch1 = rows.find(r => /^Proposed a change to clause/.test(r.text) && /Net-30/.test(r.text));
    ok('5a a change\'s entry says what happened to which clause, in words', !!ch1, rows.map(r => r.text).slice(0, 4).join(' · '));
    ok('5b with the round\'s whole name on the time\'s hover', !!ch1 && /round 1/i.test(ch1.whenTip), ch1 ? JSON.stringify(ch1.whenTip) : 'none');
    ok('5c and no chip trails words that already name the clause', !!ch1 && ch1.round === null, ch1 ? JSON.stringify(ch1.round) : 'none');
    void m.strong;
    ok('5d an entry that belongs to no round carries no chip', rT.round === null, JSON.stringify(rT.round));

    /* ================= 6. THE SENTENCE IN BLACK ================= */
    const titles = rows.map(r => r.title).filter(Boolean);
    /* 6a is a CONTROL: the sentence was already in the page's own ink. What
       made it read grey was the weight, which is 6b. */
    ok('6a CONTROL every sentence above the names is in the page\'s own ink',
      titles.length === rows.length && titles.every(t => t.color === m.ink),
      titles.length ? `${titles[0].color} · ink ${m.ink}` : 'none');
    ok('6b at the label weight, so it reads black rather than grey',
      titles.length > 0 && titles.every(t => t.weight === m.label),
      titles.length ? `${titles[0].weight} · label ${m.label}` : 'none');

    /* ================= 7. CONTROLS ================= */
    /* RE-POINTED 9 Oct 2026: the five fold behind one Filter button, as drawn. */
    /* RE-POINTED 15 Oct 2026 (the overnight work order, step 8): Side left
       the fold for one switch in the open (All sides · Ours · Theirs); the
       other four fold behind Filter */
    const side = await page.evaluate(sel => [...document.querySelectorAll(sel + ' .hist-side [data-ht-side]')].filter(b => b.getBoundingClientRect().width > 0).map(b => b.textContent.trim()), HP);
    /* RE-POINTED 17 Oct 2026 (round 12): no side switch — the side is the lane */
    ok('7a the four other filters fold behind Filter, and no side switch (the side is the lane)', m.filters === 0 && side.length === 0, m.filters + ' filters showing · ' + side.join(' · '));
    await page.click('#hist-filter-btn');
    await page.waitForTimeout(300);
    const f5 = await page.evaluate(sel => [...document.querySelectorAll(sel + ' .hist-f select')].filter(s => s.getBoundingClientRect().width > 0).map(s => s.getAttribute('data-ht-filter')), HP);
    ok('7a2 and Filter opens the other four (clause, person, round, outcome)', JSON.stringify(f5) === JSON.stringify(['clauseId', 'actor', 'round', 'outcome']), f5.join(' · '));
    await page.click('#hist-filter-btn');
    await page.waitForTimeout(300);
    await page.click('#hist-detail');
    await page.waitForTimeout(500);
    const wording = await page.evaluate(sel => document.querySelectorAll(sel + ' .hist-redline').length, HP);
    ok('7b CONTROL "Show the wording" still prints a proposal\'s redline', wording > 0, wording + ' redlines');
    const w2 = await page.evaluate(PROBE);
    ok('7c and with the wording open every entry is still on the page', (w2.rows || []).length === rows.length,
      `${(w2.rows || []).length} of ${rows.length}`);
    await shot('02-history-wording.png');
    await page.click('#hist-detail');
    await page.waitForTimeout(300);

    /* ================= 8. THE DARK THEME ================= */
    await page.evaluate(i => { if (typeof setDark === 'function') setDark(true);
      const host = document.querySelector('#bs-strips [data-bs-host="hist"]');
      if (host) roomPaintHistory(getContract(i), host._histF || {}, host); else roomPaintHistory(getContract(i)); }, id);
    await page.waitForTimeout(400);
    const d = await page.evaluate(PROBE);
    const dRows = d.rows || [];
    ok('8a CONTROL at night the sentence takes the night ink', dRows.length > 0 && dRows.every(r => r.title && r.title.color === d.ink),
      dRows.length && dRows[0].title ? `${dRows[0].title.color} · ink ${d.ink}` : 'none');
    /* RE-POINTED 18 Oct 2026: a bubble wears no ring (3a); what stood in the
       page's surface by night is the bubble itself, and any ring that stands */
    const dBub = dRows.filter(r => r.lane === 'ours' || r.lane === 'theirs'), dMid = dRows.filter(r => r.lane === 'mid');
    ok('8b and at night each bubble, and any ring that stands, is the night surface',
      dBub.length > 0 && dBub.every(r => r.bubBg === d.surface) && dMid.every(r => r.dot && r.dot.fill === d.surface),
      dBub.length ? `${dBub[0].bubBg} · surface ${d.surface}` : 'none · lanes ' + dRows.map(r => r.lane).join(','));
    await shot('03-history-dark.png');
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(false); });

    ok('9 no page errors on the way', errors.length === 0, errors.join(' | ') || 'none');
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
