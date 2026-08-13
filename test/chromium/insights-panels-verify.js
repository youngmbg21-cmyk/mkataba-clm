/* Chromium verification: THE PANELS DRAW THE SAME, AND CAN NOW BE ASKED WHY.
   ============================================================
   Reported: a reader on Insights → Portfolio asked "why do I have a big
   workload runway today?" and Copilot answered about TEAM CAPACITY — it had
   never heard the phrase, and the panel's figures existed only inside the view.

   The panels are split now: one function counts and returns plain data, the
   renderer draws that data and counts nothing. f183 pins the split in jsdom.
   THIS file asks the two questions jsdom cannot answer.

   1  DID A PIXEL MOVE? A split is not a redesign. The charts are measured on
      the real page — the bars, the axis, the legend and the foot — and every
      figure drawn is checked against the number the panel counted, so a chart
      that quietly disagreed with its own data would fail here.

   2  DOES THE REPORTED QUESTION GET AN ANSWER? Asked VERBATIM, through the
      real Copilot panel, against a scripted provider so the loop is
      deterministic. What is checked is what actually reaches the model: the
      brief carrying the peak month, its driving contracts and WHY they are
      there, the tool being offered and called, and the tool's own reply
      carrying the drivers. A model handed the total alone can only read the
      chart back to somebody who is looking at it.

   Screenshots go to test/chromium/shots/insights-panels/.
   Run: node test/chromium/insights-panels-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'insights-panels');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const sysText = s => Array.isArray(s) ? s.map(b => (b && b.text) || '').join('\n') : String(s || '');
const QUESTION = 'why do I have a big workload runway today?';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1100 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- a book with a real spike, and two different reasons for it ----
       One large contract with no effective date, so its start defaults to the
       day it was signed; one that starts and ends inside a single month, so
       its whole value lands in one column. Both are invisible on the chart and
       both are the answer to "why". */
    await page.evaluate(() => {
      const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      const mk = o => Object.assign({ valueType: 'standard', audit: [], folder: 'proc', rounds: [] }, o);
      state.contracts = [
        mk({ id: 'MK-P1', name: 'Roofing — Block A', counterparty: 'Naivas', status: 'Signed',
          value: 9000000, expiry: day(120), signedAt: day(-4),
          metadata: { category: 'works', retentionPct: 10, warrantyMonths: 12 } }),
        mk({ id: 'MK-P2', name: 'One-month fit-out', counterparty: 'Siginon', status: 'Signed',
          value: 5000000, expiry: day(14), metadata: { category: 'works', effectiveDate: day(2), warrantyMonths: 6 } }),
        mk({ id: 'MK-P3', name: 'Long refurbishment', counterparty: 'Britam', status: 'Under Review',
          value: 3000000, expiry: day(320), metadata: { category: 'works', effectiveDate: day(-15), retentionPct: 5 } }),
        mk({ id: 'MK-P4', name: 'No dates at all', counterparty: 'Zamara', status: 'Under Review',
          value: 800000, metadata: { category: 'works', retentionPct: 4 } }),
        mk({ id: 'MK-P5', name: 'Lost bid', counterparty: 'Kwezi', status: 'Declined',
          value: 2000000, expiry: day(90), metadata: { category: 'works', effectiveDate: day(3) } }),
        mk({ id: 'MK-P6', name: 'Standing supply', counterparty: 'Naivas', status: 'Signed',
          value: 4000000, expiry: day(210), metadata: { category: 'supply' } }),
      ];
      if (window.wsSet) wsSet(['standing', 'project'], 'job');
      if (window.intel) intel.tab = 'frame';
      setView('intel');
    });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, '01-portfolio.png'), fullPage: true });

    /* ================= 1. THE PANELS STILL DRAW ============================ */
    const drawn = await page.evaluate(() => {
      const d = window.pfWorkloadRunwayData();
      /* By its own card, not by its aria text: two runways are drawn on this
         page and the label a reader sees is translated. */
      const card = Array.from(document.querySelectorAll('#content div'))
        .filter(el => (el.textContent || '').trim().indexOf(d.title) === 0 && el.querySelector('svg'))
        .sort((a, b) => (a.textContent || '').length - (b.textContent || '').length)[0];
      const runway = card ? card.querySelector('svg') : null;
      const box = runway ? runway.getBoundingClientRect() : null;
      const titles = runway ? Array.from(runway.querySelectorAll('title')).map(t => t.textContent) : [];
      const foot = card ? (card.textContent || '').replace(/\s+/g, ' ') : '';
      const bars = runway ? runway.querySelectorAll('rect').length : 0;
      const text = document.getElementById('content').textContent.replace(/\s+/g, ' ');
      return { there: !!runway, w: box ? Math.round(box.width) : 0, h: box ? Math.round(box.height) : 0,
        bars, titles, buckets: d.buckets.length, peakLabel: d.peak && d.peak.label,
        peakContracts: d.peak && d.peak.contracts, unplaced: d.excluded.couldNotPlace.count,
        pageSaysUnplaced: /could not be placed|no start|could not/i.test(foot) || /1 /.test(foot),
        foot: foot.slice(-160) };
    });
    check('the workload runway is on the page, with a real box',
      drawn.there && drawn.w > 200 && drawn.h > 60, `${drawn.w}x${drawn.h}`);
    check('it draws one bar group per month it counted', drawn.buckets === 18,
      `${drawn.buckets} buckets, ${drawn.bars} rects`);
    check('every bar carries its own month and count as a tooltip',
      drawn.titles.length === 18, `${drawn.titles.length} tooltips`);
    /* The chart and the data must agree about the peak — a renderer that had
       started counting for itself would show up right here. */
    const peakTip = drawn.titles.find(t => t.indexOf(drawn.peakLabel) === 0) || '';
    check('and the peak month on the chart says what the panel counted',
      peakTip.includes(String(drawn.peakContracts)), `${drawn.peakLabel}: ${peakTip}`);
    check('the work it could not place is said on the panel, not dropped',
      drawn.unplaced === 1 && drawn.pageSaysUnplaced, drawn.foot);

    const others = await page.evaluate(() => {
      const t = document.getElementById('content').textContent.replace(/\s+/g, ' ');
      const has = s => t.toLowerCase().includes(s.toLowerCase());
      return { held: has('held back') || has('retention'), promises: has('still live') || has('promise'),
        wonlost: has('won') && has('lost'), renewal: has('renewal'),
        panels: Object.keys(window.pfPanelsData()) };
    });
    check('the other shaped panels are drawn beside it',
      others.held && others.wonlost && others.renewal,
      `held=${others.held} wonlost=${others.wonlost} renewal=${others.renewal}`);
    check('and all five count themselves through one door',
      others.panels.length === 5, others.panels.join(', '));

    /* ================= 2. THE REPORTED QUESTION ============================ */
    /* The scripted model asks for the panel, then delivers. What is being
       measured is not the model's prose — it is what it was handed. */
    ai.reset();
    ai.script(
      [{ type: 'tool_use', id: 'tu_p', name: 'get_insights_panel', input: { panel: 'workload_runway' } }],
      [{ type: 'tool_use', id: 'tu_d', name: 'deliver_answer',
        input: { answer: 'Answered from the workload runway panel.', citations: [{ id: 'MK-P1' }] } }]);

    await page.evaluate(async q => {
      openAI();
      const inp = document.getElementById('ai-input');
      inp.value = q;
      await aiSubmit();
    }, QUESTION);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, '02-copilot.png') });

    const chat = ai.calls.filter(c => /messages/.test(c.url));
    check('the question reached the provider', chat.length >= 2, `${chat.length} provider calls`);
    const first = chat[0] || { body: {} };
    const sys = sysText(first.body.system);
    const asked = JSON.stringify((first.body.messages || []).map(m => m.content)).toLowerCase();
    check('and it is the reported question, verbatim', asked.includes(QUESTION.toLowerCase()),
      QUESTION);

    check('the brief says which Insights tab is open',
      /Within Insights they are on the "portfolio" tab/.test(sys));
    check('the rulebook reads "workload runway" as this chart, not as capacity',
      /workload runway/.test(sys) && /NOT about team capacity/i.test(sys));
    check('the panel figures ride along with the question',
      /INSIGHTS PANELS/.test(sys) && /workload_runway/.test(sys));
    const peakLine = (sys.match(/Peak month [^\n]*/) || [''])[0];
    check('the brief names the peak month and what is in it',
      /Peak month/.test(sys) && /Roofing — Block A|One-month fit-out/.test(peakLine),
      peakLine.slice(0, 150));
    check('and WHY it is there — the reason a total alone cannot give',
      /defaulted to its signature date|no start date on file|land(s)? in one column|one column/.test(peakLine + sys),
      /signature date/.test(sys) ? 'names the defaulted start date' : 'names the single-month work');
    check('what the chart could not place travels with it',
      /NOT ON THE CHART: 1 could not be placed/.test(sys),
      (sys.match(/NOT ON THE CHART[^\n]*/) || [''])[0].slice(0, 120));

    const toolNames = (first.body.tools || []).map(t => t.name);
    check('the tool is offered in the server loop', toolNames.includes('get_insights_panel'),
      toolNames.join(', '));

    /* The second call carries the tool RESULT — the figures actually handed
       back. Parsed rather than pattern-matched: the result is a JSON string
       inside a JSON message, so a regex would be reading escape characters. */
    const second = chat[1] || { body: {} };
    let panel = null;
    for (const m of (second.body.messages || [])) {
      if (!Array.isArray(m.content)) continue;
      for (const b of m.content) {
        if (b && b.type === 'tool_result' && typeof b.content === 'string') {
          try { const j = JSON.parse(b.content); if (j && j.panel === 'workload_runway') panel = j; } catch (_) {}
        }
      }
    }
    check('the model called it and got the panel back',
      !!panel && panel.found === true, panel ? 'found' : 'no tool result came back');
    const peak = (panel && panel.peak) || null;
    check('the reply names the contracts driving the peak, with their ids',
      !!peak && peak.drivers.length >= 2 && peak.drivers.every(x => /^MK-P/.test(x.id)),
      peak ? peak.drivers.map(x => `${x.name} (${x.id})`).join('; ') : 'no peak');
    check('and carries the why-counts per bucket',
      !!peak && typeof peak.why.startDateFromSignature === 'number'
        && typeof peak.why.singleMonth === 'number',
      peak ? JSON.stringify(peak.why) : '');
    check('and one of the two reasons a bar spikes is actually present here',
      !!peak && (peak.why.startDateFromSignature > 0 || peak.why.singleMonth > 0),
      peak ? JSON.stringify(peak.why) : '');
    check('and the work it could not place, with the reason',
      !!panel && panel.excluded.couldNotPlace.count === 1
        && /no start date/.test(panel.excluded.couldNotPlace.reasons[0].reason),
      panel ? JSON.stringify(panel.excluded.couldNotPlace.reasons[0]) : '');
    check('the figures in the reply are the ones the chart drew',
      !!panel && panel.buckets.length === drawn.buckets
        && panel.peak.label === drawn.peakLabel
        && panel.peak.contracts === drawn.peakContracts,
      panel ? `${panel.peak.label} · ${panel.peak.contracts}` : '');

    const answered = await page.evaluate(() =>
      (document.getElementById('ai-feed') || {}).textContent || '');
    check('and an answer lands in the panel', /workload runway/i.test(answered),
      answered.replace(/\s+/g, ' ').slice(-120));

    /* ============ 5. THE HEAD IS ONE LINE, AND THE CHARTS GET THE REST ======
       Owner-asked, 13 Aug 2026: "move the highlighted sentence to be next to
       the word Insights, and move the page up so the dashboards across the tabs
       have more screen space."

       Both halves are one measurement, and it can only be taken here: the
       header sits above #content-scroll as its own flex row, and the Insights
       tabs size themselves against exactly that room (height:var(--view-h)).
       Whether a sentence is "next to" a word is a question about two boxes on a
       screen, and how much room the charts got is the difference between two
       numbers — jsdom can answer neither. Baseline before the change, at this
       viewport: 63px of header, subtitle 29px below the title, 824px of chart. */
    const HEAD = `(() => {
      const head = document.getElementById('page-head');
      const h1 = head && head.querySelector('h1');
      const sub = head && head.querySelector('p');
      const sc = document.getElementById('content-scroll');
      const r = el => el ? el.getBoundingClientRect() : null;
      const a = r(h1), b = r(sub), s = r(sc);
      return {
        headH: head ? Math.round(r(head).height) : -1,
        title: h1 ? h1.textContent.trim() : null,
        sub: sub ? sub.textContent.trim() : null,
        /* NEXT TO, not merely present: same line means the two boxes share a
           vertical band, and the sentence starts to the RIGHT of the word. */
        sameLine: (a && b) ? Math.abs(a.top - b.top) < 12 : null,
        toTheRight: (a && b) ? b.left > a.right - 1 : null,
        scrollH: s ? Math.round(s.height) : -1,
        viewH: parseInt(getComputedStyle(document.documentElement).getPropertyValue('--view-h'), 10) || 0,
      };
    })()`;
    const heads = {};
    for (const tab of ['frame', 'friction', 'map']){
      await page.evaluate(t => { intel.tab = t; renderIntel(); }, tab);
      await page.waitForTimeout(700);
      heads[tab] = await page.evaluate(HEAD);
    }
    await page.evaluate(() => { intel.tab = 'frame'; renderIntel(); });
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, '05-one-line-head.png') });

    const f = heads.frame;
    check('5 the page still says its name and what is on it',
      f.title === 'Insights' && /portfolio frame/.test(f.sub || ''), `${f.title} — ${f.sub}`);
    check('5 THE SENTENCE IS NEXT TO THE WORD, not under it',
      f.sameLine && f.toTheRight, `same line ${f.sameLine} · to the right ${f.toTheRight}`);
    check('5 so the header is one line of chrome, not two',
      f.headH > 0 && f.headH < 48, `${f.headH}px (was 63)`);
    check('5 AND THE CHARTS GOT THE DIFFERENCE',
      f.scrollH >= 845 && f.viewH === f.scrollH,
      `${f.scrollH}px of chart (was 824) · --view-h ${f.viewH}px`);
    /* ACROSS THE THREE TABS, which is what was asked. The header is the shell's
       and the tabs are the page's, so this is really a check that switching
       tabs does not quietly redraw the header a different way. */
    check('5 and all three tabs read the same, because it is one header',
      ['frame', 'friction', 'map'].every(t =>
        heads[t].sameLine && heads[t].headH === f.headH && heads[t].scrollH === f.scrollH),
      ['frame', 'friction', 'map'].map(t =>
        `${t}: ${heads[t].headH}px/${heads[t].scrollH}px`).join(' · '));

    /* IT STILL WRAPS RATHER THAN HIDING. Narrow the window until the two cannot
       share a line: the sentence must come back on its own line, not vanish. */
    await page.setViewportSize({ width: 720, height: 950 });
    await page.waitForTimeout(800);
    const narrow = await page.evaluate(HEAD);
    check('5 on a narrow window the sentence drops to its own line and is still there',
      /portfolio frame/.test(narrow.sub || ''),
      narrow.sameLine ? 'still on one line at 720px' : 'wrapped, and still readable');
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.waitForTimeout(600);

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) { console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  process.exit(failed.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
