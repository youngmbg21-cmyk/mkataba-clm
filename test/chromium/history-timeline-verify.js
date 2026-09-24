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
const PROBE = `(() => {
  const pane = document.getElementById('ws-history-pane');
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
    const drawn = b.content && b.content !== 'none' && b.position === 'absolute';
    const lineX = drawn ? rr.left + px(b.left) + px(b.width) / 2 : null;
    const lineTop = drawn ? rr.top + px(b.top) : null;
    const lineBot = drawn ? rr.bottom - px(b.bottom) : null;
    const day = r.querySelector('.hist-day'), time = r.querySelector('.hist-time');
    const text = r.querySelector('.hist-text'), rnd = r.querySelector('.hist-round');
    const tcs = text ? getComputedStyle(text) : null;
    return {
      text: text ? text.textContent.trim() : '',
      at: r.getAttribute('data-hist-at'),
      when: (r.querySelector('.hist-when') || {}).textContent || '',
      day: day ? day.textContent.trim() : null,
      time: time ? time.textContent.trim() : null,
      stacked: day && time ? time.getBoundingClientRect().top >= day.getBoundingClientRect().bottom - 1 : null,
      dot: dr ? { w: Math.round(dr.width), cx: dr.left + dr.width / 2, cy: dr.top + dr.height / 2,
        fill: dcs.backgroundColor, ring: dcs.borderTopColor, ringW: px(dcs.borderTopWidth) } : null,
      line: drawn ? { x: lineX, top: lineTop, bot: lineBot, w: px(b.width), color: b.backgroundColor } : null,
      rowTop: rr.top, rowBot: rr.bottom, rule: px(getComputedStyle(r).borderBottomWidth),
      title: tcs ? { color: tcs.color, weight: tcs.fontWeight } : null,
      round: rnd ? { text: rnd.textContent.trim(), hover: rnd.getAttribute('title') || '',
        weight: getComputedStyle(rnd).fontWeight } : null,
    };
  });
  /* The tones a kind can wear, resolved live — HIST_KIND and HIST_OUTCOME_TONE
     are the one table, and a ring in any colour NOT on it is a ring nobody
     chose (the Tailwind preflight's own grey, for instance). */
  const tones = {};
  for (const v of ['--color-accent', '--st-green-dot', '--st-ruby-dot', '--st-amber-dot',
    '--st-steel-dot', '--color-neutral-400']) tones[v] = bg(v);
  return { mounted: true, rows: out,
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
    await page.evaluate(i => window.openWorkspace(i), id);
    await page.waitForTimeout(1200);
    await page.click('#ws-tabs [data-room-tab="history"]');
    await page.waitForTimeout(800);

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
      roomPaintHistory(c);
    }, id);
    await page.waitForTimeout(400);
    /* The pane is looked up afresh for every photograph: a theme change
       repaints the room and a handle taken earlier would point at nothing. */
    const shot = async name => { const el = await page.$('#ws-history-pane');
      if (el) await el.screenshot({ path: path.join(OUT, name) }); };
    await shot('01-history-light.png');

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
    ok('2a today reads "Today", not a date', rT.day === expect.today.day && /today/i.test(rT.day || ''),
      `${JSON.stringify(rT.day)} · expected ${JSON.stringify(expect.today.day)}`);
    ok('2b and its time sits UNDER the day, in the product\'s one clock', rT.time === expect.today.time
      && /\d{1,2}[:.]\d{2}/.test(rT.time || '') && rT.stacked === true,
      `${JSON.stringify(rT.time)} · expected ${JSON.stringify(expect.today.time)} · stacked ${rT.stacked}`);
    ok('2c an earlier day this year reads as a day and a month', rE.day === expect.earlier.day && rE.time === expect.earlier.time,
      `${JSON.stringify(rE.day)} ${JSON.stringify(rE.time)} · expected ${JSON.stringify(expect.earlier.day)} ${JSON.stringify(expect.earlier.time)}`);
    ok('2d a day from another year carries its year', rY.day === expect.year.day && (rY.day || '').includes(expect.yearNo),
      `${JSON.stringify(rY.day)} · expected ${JSON.stringify(expect.year.day)}`);
    ok('2e this year\'s days do not repeat the year', !!rE.day && (expect.earlierOtherYear || !rE.day.includes(expect.thisYear)),
      JSON.stringify(rE.day));
    ok('2f no row prints the raw record date', rows.every(r => !/\d{4}-\d{2}-\d{2}/.test(r.when)),
      rows.map(r => r.when.replace(/\s+/g, ' ').trim()).slice(0, 4).join(' | '));

    /* ================= 3. A RING IN THE KIND'S TONE ================= */
    const dots = rows.map(r => r.dot).filter(Boolean);
    ok('3a every entry carries a ring: a hollow disc in the page\'s own surface',
      dots.length === rows.length && dots.every(d => d.fill === m.surface && d.ringW >= 2),
      dots.slice(0, 3).map(d => `${d.w}px fill ${d.fill} ring ${d.ringW}px`).join(' | '));
    const toneSet = Object.values(m.tones || {});
    ok('3b and the ring carries one of the kinds\' own tones, never a colour nobody chose',
      dots.length === rows.length && dots.every(d => toneSet.includes(d.ring)),
      dots.slice(0, 3).map(d => d.ring).join(' | '));
    const refused = rows.find(x => /rejected/i.test(x.text));
    ok('3c the refusal still reads as a refusal (the ruby tone, not green)',
      !!(refused && refused.dot && m.tones && refused.dot.ring === m.tones['--st-ruby-dot']),
      refused && refused.dot ? `${refused.dot.ring} · ruby ${m.tones && m.tones['--st-ruby-dot']}` : 'none');

    /* ================= 4. ONE LINE JOINS THEM ================= */
    const lined = rows.filter(r => r.line && r.dot);
    ok('4a every entry draws its piece of the line, 1px wide',
      lined.length === rows.length && lined.every(r => Math.abs(r.line.w - 1) < 0.01),
      `${lined.length} of ${rows.length}`);
    ok('4b the line runs through the middle of every ring',
      lined.length > 0 && lined.every(r => Math.abs(r.line.x - r.dot.cx) <= 1),
      lined.slice(0, 3).map(r => `line ${r.line.x.toFixed(1)} · ring ${r.dot.cx.toFixed(1)}`).join(' | '));
    const first = lined[0], last = lined[lined.length - 1];
    ok('4c it starts at the first ring, not above it',
      !!first && Math.abs(first.line.top - first.dot.cy) <= 1.5,
      first ? `line from ${first.line.top.toFixed(1)} · ring centre ${first.dot.cy.toFixed(1)}` : 'no line');
    ok('4d and ends at the last ring, not below it',
      !!last && Math.abs(last.line.bot - last.dot.cy) <= 1.5,
      last ? `line to ${last.line.bot.toFixed(1)} · ring centre ${last.dot.cy.toFixed(1)}` : 'no line');
    const gaps = lined.slice(0, -1).map((r, k) => Math.abs(r.line.bot - lined[k + 1].line.top));
    ok('4e with no break between one entry and the next', gaps.length > 0 && gaps.every(g => g <= 1),
      gaps.map(g => g.toFixed(1)).join(', '));
    ok('4f in the page\'s own rule colour', lined.length > 0 && lined.every(r => r.line.color === m.rule),
      lined.length ? `${lined[0].line.color} · rule ${m.rule}` : 'no line');
    ok('4g and no rule runs across the page between entries', rows.length > 0 && rows.every(r => r.rule === 0),
      rows.map(r => r.rule).join(','));

    /* ================= 5. THE ROUND AT THE RIGHT WALL ================= */
    const r1 = rows.find(r => r.round && /^R1$/.test(r.round.text));
    ok('5a a round reads "R1"', !!r1, rows.map(r => r.round ? r.round.text : '∅').join(' · '));
    ok('5b with the round\'s whole name on the hover', !!r1 && /round 1/i.test(r1.round.hover),
      r1 ? JSON.stringify(r1.round.hover) : 'no R1');
    ok('5c at the product\'s strong weight', !!r1 && r1.round.weight === m.strong,
      r1 ? `${r1.round.weight} · strong ${m.strong}` : 'no R1');
    ok('5d an entry that belongs to no round says so with a dash', !!(rT.round && rT.round.text === '—'),
      JSON.stringify(rT.round));

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
    ok('7a CONTROL the five filters are still in the open', m.filters === 5, m.filters + ' filters');
    await page.click('#hist-detail');
    await page.waitForTimeout(500);
    const wording = await page.evaluate(() => document.querySelectorAll('#ws-history-pane .hist-redline').length);
    ok('7b CONTROL "Show the wording" still prints a proposal\'s redline', wording > 0, wording + ' redlines');
    const w2 = await page.evaluate(PROBE);
    const lined2 = (w2.rows || []).filter(r => r.line);
    const gaps2 = lined2.slice(0, -1).map((r, k) => Math.abs(r.line.bot - lined2[k + 1].line.top));
    ok('7c and with the wording open the line still joins every entry', gaps2.length > 0 && gaps2.every(g => g <= 1),
      gaps2.map(g => g.toFixed(1)).join(', '));
    await shot('02-history-wording.png');
    await page.click('#hist-detail');
    await page.waitForTimeout(300);

    /* ================= 8. THE DARK THEME ================= */
    await page.evaluate(() => { if (typeof setDark === 'function') setDark(true); roomPaintHistory(getContract(state.activeId)); });
    await page.waitForTimeout(400);
    const d = await page.evaluate(PROBE);
    const dRows = d.rows || [];
    ok('8a CONTROL at night the sentence takes the night ink', dRows.length > 0 && dRows.every(r => r.title && r.title.color === d.ink),
      dRows.length && dRows[0].title ? `${dRows[0].title.color} · ink ${d.ink}` : 'none');
    ok('8b and the ring is filled with the night surface, so the line still passes behind it',
      dRows.length > 0 && dRows.every(r => r.dot && r.dot.fill === d.surface),
      dRows.length && dRows[0].dot ? `${dRows[0].dot.fill} · surface ${d.surface}` : 'none');
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
