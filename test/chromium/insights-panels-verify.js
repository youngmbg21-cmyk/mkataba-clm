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
    /* ---- REVERSED IN PLACE 25 Aug 2026 ----
       Owner-asked, off a screenshot of Import contracts with its line ringed:
       "remove these explanations below the headers in all pages where the
       explanation is there". No page header draws a subtitle now.
       THE CLAIM THIS FILE WAS REALLY MAKING SURVIVES AND IS STRONGER: the
       13 Aug ask was "move the highlighted sentence to be next to the word
       Insights, and move the page up so the dashboards have more screen
       space" — the sentence was moved to buy the charts room, and removing it
       buys them the rest. So the two checks about WHERE it sat become one
       about it not being there, and the two about what that bought are
       untouched. */
    check('5 the page still says its name', f.title === 'Insights', f.title);
    check('5 and no sentence under it — none of them draws one now',
      f.sub === null, f.sub === null ? 'no <p> in the header' : `still there: ${f.sub}`);
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
        heads[t].sub === null && heads[t].headH === f.headH && heads[t].scrollH === f.scrollH),
      ['frame', 'friction', 'map'].map(t =>
        `${t}: ${heads[t].headH}px/${heads[t].scrollH}px`).join(' · '));

    /* ---- 5b. THE HEAD AND THE TABS ARE ONE WHITE CARD ----
       Owner-reported 24 Aug 2026, off a screenshot with both rows ringed: "the
       highlighted area should just be one big white card not divided into grey
       and white." The tab strip painted itself on the surface; the title line
       above it is the shell's #page-head, which painted nothing and so sat on
       the page's grey ground — two touching halves of one header in two
       colours. WRITTEN AS A RELATION: whatever the surface token resolves to,
       the two must resolve to the SAME thing, and there must be no gap between
       them for the ground to show through. Asked on every tab, because the
       strip is rebuilt per tab and the header is not. */
    const cards = {};
    for (const tab of ['frame', 'friction', 'map']){
      await page.evaluate(t => { intel.tab = t; renderIntel(); }, tab);
      await page.waitForTimeout(700);
      cards[tab] = await page.evaluate(() => {
        const head = document.getElementById('page-head');
        const strip = document.querySelector('#content header');
        if (!head || !strip) return null;
        const hb = head.getBoundingClientRect(), sb = strip.getBoundingClientRect();
        const surface = getComputedStyle(document.documentElement)
          .getPropertyValue('--color-surface').trim();
        return { head: getComputedStyle(head).backgroundColor,
          strip: getComputedStyle(strip).backgroundColor,
          surface, gap: Math.round(sb.top - hb.bottom),
          transparent: /rgba\(0, 0, 0, 0\)|transparent/.test(getComputedStyle(head).backgroundColor) };
      });
    }
    await page.evaluate(() => { intel.tab = 'frame'; renderIntel(); });
    await page.waitForTimeout(700);
    const c = cards.frame;
    check('5b the title line is painted, not the page ground showing through',
      c && !c.transparent, c && c.head);
    check('5b and it is the same colour as the tab strip under it',
      c && c.head === c.strip, c && { head: c.head, strip: c.strip });
    check('5b with nothing between them for the grey to come through',
      c && c.gap === 0, c && c.gap);
    check('5b on every tab, because the strip is rebuilt and the header is not',
      ['frame', 'friction', 'map'].every(t => cards[t] && cards[t].head === cards[t].strip
        && cards[t].gap === 0),
      ['frame', 'friction', 'map'].map(t => `${t}: ${cards[t] && cards[t].head}`).join(' · '));
    /* AND IT DOES NOT FOLLOW THE READER OFF THE PAGE. The rule is written into
       a style block inside #content, so leaving Insights takes it with it —
       otherwise one page would quietly repaint every other page's header. */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    await page.evaluate(() => setView('templates'));
    await page.waitForTimeout(900);
    const elsewhere = await page.evaluate(() => {
      const head = document.getElementById('page-head');
      return head ? getComputedStyle(head).backgroundColor : null;
    });
    check('5b and the rule does not follow the reader to another page',
      /rgba\(0, 0, 0, 0\)|transparent/.test(elsewhere || ''), elsewhere);
    await page.evaluate(() => { setView('intel'); });
    await page.waitForTimeout(900);

    /* REVERSED IN PLACE 25 Aug 2026 with the sentence itself. This asked that
       a narrow window WRAP the subtitle rather than hide it — "a header that
       hid the page's own description to save a line would be trading the wrong
       thing" — and there is no description to hide now. What the check becomes
       is the useful half: at 720px the header is still ONE line, so nothing
       has quietly reappeared under the title on a narrow screen. */
    /* 820, NOT THE 720 THIS USED TO USE. Below 768 the desktop shell is hidden
       outright and the phone draws, so #page-head measures 0 there — the old
       check read its textContent, which a hidden element still has, and so
       could never have caught a layout fault anyway. 820 is narrow enough that
       a title and a sentence could not have shared a line, and still desktop. */
    await page.setViewportSize({ width: 820, height: 950 });
    await page.waitForTimeout(800);
    const narrow = await page.evaluate(HEAD);
    check('5 and a narrow window has nothing to drop — the header stays one line',
      narrow.sub === null && narrow.headH > 0 && narrow.headH < 48,
      `${narrow.headH}px at 820px · sub ${narrow.sub === null ? 'none' : narrow.sub}`);
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.waitForTimeout(600);

    /* ---- 9 · PORTFOLIO SITS WHERE FRICTION SITS (owner-asked 25 Aug 2026:
       "the negotiation friction card keeps the same distance to the edge of the
       nav panel when the nav panel is open or collapsed. Portfolio card needs
       to do the same") ----
       Portfolio capped at 1280 and CENTRED, so its distance from the column was
       half of whatever was left over — it moved whenever the content area did,
       and on a wide monitor it sat 195px off. Friction's body is a plain div
       and hugs the page measure. Both are plain now.
       THE CLAIM IS THE RELATION, at two widths: the two tabs put their first
       panel at the same offset inside the same host, and that offset does not
       depend on how wide the nav happens to be. */
    const PANEL = `(() => {
      const nav = document.getElementById('side-nav').getBoundingClientRect();
      const host = [...document.querySelectorAll('#ig-frame, #ig-friction')]
        .find(e => { const r = e.getBoundingClientRect(); return r.width > 50 && r.height > 50; });
      if (!host) return null;
      /* THE TAB'S OWN BODY WRAPPER — the element each tab returns, which is
         exactly what caps and centres or does not. Hunting for "a white panel"
         finds whichever small card comes first in document order. */
      const p = [...host.children].find(e => {
        const r = e.getBoundingClientRect(); return r.width > 50 && r.height > 20; });
      if (!p) return null;
      const hr = host.getBoundingClientRect(), pr = p.getBoundingClientRect();
      const cs = getComputedStyle(p);
      return { host: host.id, inset: Math.round(pr.left - hr.left),
        width: Math.round(pr.width), navW: Math.round(nav.width),
        maxW: cs.maxWidth, mL: cs.marginLeft };
    })()`;
    const tab = async which => {
      await page.evaluate(() => setView('intel'));
      await page.waitForTimeout(1500);
      await page.evaluate(w => { const b = [...document.querySelectorAll('[data-ig-tab]')]
        .find(x => new RegExp(w, 'i').test(x.textContent)); if (b) b.click(); }, which);
      await page.waitForTimeout(1800);
      return page.evaluate(PANEL);
    };
    /* THE FRICTION TAB DRAWS AN EMPTY STATE WITH NO NEGOTIATIONS, and that
       state is a centred 960 box — nothing like the card being compared. */
    await page.evaluate(async () => {
      const live = state.contracts.filter(x => x.status !== 'Signed' && x.status !== 'Declined').slice(0, 6);
      for (const c of live){ negoInit(c); const cl = negoClauseList(c);
        if (cl[0]) await negoEditClause(c, cl[0].clauseId,
          cl[0].bodyHtml.replace(/\b(\d[\d,]*)\b/, m => String(Number(String(m).replace(/,/g, '')) + 500)),
          { author: 'Amina Otieno', side: 'owner', why: 'Volume alignment.' }); }
    });
    await page.waitForTimeout(1800);
    const seen = {};
    for (const W of [1440, 1920]){
      await page.setViewportSize({ width: W, height: 900 });
      await page.waitForTimeout(700);
      seen[W] = { pf: await tab('portfolio'), fr: await tab('friction') };
    }
    /* PORTFOLIO IS THE ONE THAT CHANGED, so it carries the claim. Friction is
       compared only where it has data to draw — with no negotiations it falls
       to a centred empty state, which is a different object and not what the
       owner is pointing at. */
    const frLive = W => seen[W].fr && seen[W].fr.maxW === 'none';
    check('9 Portfolio reads the page measure at 1440',
      seen[1440].pf && seen[1440].pf.maxW === 'none' && seen[1440].pf.mL === '0px',
      JSON.stringify(seen[1440].pf));
    check('9 and at 1920, where the column is pushed open',
      seen[1920].pf && seen[1920].pf.maxW === 'none' && seen[1920].pf.mL === '0px',
      JSON.stringify(seen[1920].pf));
    check('9 and where Friction has something to draw, the two agree',
      !frLive(1920) || seen[1920].pf.inset === seen[1920].fr.inset,
      frLive(1920) ? `pf ${seen[1920].pf.inset} · fr ${seen[1920].fr.inset}`
                   : 'friction had no negotiations to draw — not compared');
    check('9 Portfolio no longer caps and centres — its body fills the host',
      seen[1920].pf && seen[1920].pf.maxW === 'none' && seen[1920].pf.mL === '0px',
      seen[1920].pf ? `max ${seen[1920].pf.maxW}, margin ${seen[1920].pf.mL}` : 'no body');
    /* AND THE INSET IS THE HOST'S OWN PADDING, not a leftover: it is the same
       number at both widths, which is what "keeps the same distance" means. */
    check('9 and that distance does not move with the width',
      seen[1440].pf && seen[1920].pf && seen[1440].pf.inset === seen[1920].pf.inset,
      `${seen[1440].pf && seen[1440].pf.inset} vs ${seen[1920].pf && seen[1920].pf.inset}`);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(600);


    /* ---- 10. THE MOST-CONTESTED CLAUSES READ IN ONE FORMAT ----
       (owner-reported 10 Sep 2026, off this very page: "i still see some
       clauses in capital letters" — over "Clause 2 · SPECIFICATIO…" beside
       "Data Protection".)

       THIS PAGE ASKED clauseTitleCase FROM 26 Aug AND IT DID NOTHING. The
       acronym rule reads the WHOLE string: the word "Clause" carries a
       lowercase letter, so the label is not "shouting", so every capital word
       after it is read as an acronym somebody typed and kept exactly. Right
       for a bare heading, wrong for a label with a number in front of it —
       and a stamped clause name is always the second shape.

       MEASURED AS PAINTED TEXT, because the fault was invisible in the source:
       the page really was calling the case machinery, and the call really was
       a no-op. Only reading the rows off the page can tell those apart. */
    await page.evaluate(() => {
      /* STAGED, because this file's own book has no negotiations at all — the
         block simply does not draw, and a check run against that would pass
         over an absence. Three changes, stamped the three ways one document's
         own headings arrive: shouted, title case, and small. */
      const nowIso = new Date().toISOString();
      const mkCh = (id, label) => ({ id, clauseId: 'cl_' + id, clauseLabel: label,
        changeType: 'modify', status: 'rejected', authorSide: 'counterparty',
        author: 'B', summary: 's', createdAt: nowIso });
      state.contracts.push(Object.assign({ id: 'MK-FR1', name: 'Friction fixture',
        counterparty: 'Naivas', status: 'Under Review', value: 1000000,
        valueType: 'standard', audit: [], folder: 'proc', rounds: [] }, {
        negotiation: { startedAt: nowIso, round: 2, rounds: [] },
        changes: [
          mkCh('CHG-801', 'Clause 2 · SPECIFICATIONS, QUALITY & INSPECTION'),
          mkCh('CHG-802', 'Clause 5 · INDEMNIFICATION'),
          mkCh('CHG-803', 'Clause 4 · Governing Law'),
        ] }));
      intel.tab = 'friction'; renderIntel();
    });
    await page.waitForTimeout(700);
    const clauseRows = await page.evaluate(() => {
      /* The bar block names itself with an aria-label, which is the one handle
         on it that is not a style string. Its grid runs label · bar · % · +r,
         so the LABEL is the first cell of every group of four. */
      const grid = [...document.querySelectorAll('[role="img"]')]
        .find(e => /most-contested/i.test(e.getAttribute('aria-label') || ''));
      if (!grid) return null;
      const cells = [...grid.children]
        .map(e => (e.textContent || '').replace(/\s+/g, ' ').trim());
      return cells.filter((_, i) => i % 4 === 0).filter(Boolean);
    });
    const shouty = (Array.isArray(clauseRows) ? clauseRows : []).filter(t => {
      const words = t.replace(/…/g, '').split(/\s+/)
        .filter(w => /[A-Za-z]{2,}/.test(w) && !/^Clause$/i.test(w));
      return words.length > 0 && words.every(w => w === w.toUpperCase());
    });
    check('10 the most-contested list draws rows at all — the state this is about',
      Array.isArray(clauseRows) && clauseRows.length > 0,
      clauseRows ? `${clauseRows.length} row(s)` : 'no host found');
    check('10a THE REPORTED FAULT: not one of them shouts',
      shouty.length === 0, JSON.stringify(shouty).slice(0, 220));
    await page.screenshot({ path: path.join(OUT, '10-clause-names.png') });
    await page.evaluate(() => { intel.tab = 'frame'; renderIntel(); });
    await page.waitForTimeout(500);

    /* ================= 11. THE BLAST RADIUS (A-2, 11 Sep 2026) =============
       WORKORDER-contract-graph-nodes.md. A link on the graph is a fact off the
       record or it is not drawn, and a node's card says what would be
       affected if the contract ended. jsdom holds the reading (f290); this is
       the only place three of its claims can be asked at all — whether a
       family edge and a chain edge are VISIBLE LINES in two different dresses,
       whether the "If this ends" block is pixels on the card a real press
       opens, and whether "See the list" lands on a register narrowed to
       exactly those contracts. Against the parent the graph draws no edge but
       the hub fans, so 11a-11c report the fault verbatim. */
    await page.evaluate(() => {
      const by = id => state.contracts.find(c => c.id === id);
      /* MK-P6 is an amendment of MK-P1; MK-P2's first obligation waits on
         one stored on MK-P1 (a payment chain crossing a contract line). */
      by('MK-P6').parentId = 'MK-P1'; by('MK-P6').relation = 'amendment';
      by('MK-P1').obligations = [{ id: 'ob_p1_del', desc: 'Deliver the roof', due: '', status: 'open' }];
      by('MK-P2').obligations = [{ id: 'ob_p2_pay', desc: 'Pay on delivery', due: '', status: 'open', after: 'ob_p1_del' }];
      intel.groupBy = 'folder'; intel.lenses = []; intel.groups = null; intel.history = [];
      intel.tab = 'map'; renderIntel();
    });
    await page.waitForTimeout(1600);
    const links = await page.evaluate(() => {
      const paths = [...document.querySelectorAll('#ig-links path')];
      const read = p => { const cs = getComputedStyle(p); const b = p.getBBox();
        return { kind: p.getAttribute('data-ig-link') || 'group', dash: cs.strokeDasharray, stroke: cs.stroke, op: Number(cs.opacity), len: Math.round(Math.hypot(b.width, b.height)) }; };
      const all = paths.map(read);
      return { family: all.filter(x => x.kind === 'family'), chain: all.filter(x => x.kind === 'chain'), party: all.filter(x => x.kind === 'party'),
        group: all.filter(x => x.kind === 'group').length, total: all.length,
        legend: [...document.querySelectorAll('#ig-legend [data-ig-legend-link]')].map(e => e.getAttribute('data-ig-legend-link')) };
    });
    check('11a a family link is drawn — solid, visible, in the accent',
      links.family.length === 1 && links.family[0].len > 10 && links.family[0].op > 0.5 && /^none$/.test(links.family[0].dash),
      JSON.stringify(links.family));
    check('11b a payment-chain link is drawn — DASHED, so the two kinds are told apart by shape and not colour alone',
      links.chain.length === 1 && links.chain[0].len > 10 && links.chain[0].op > 0.5 && !/^none$/.test(links.chain[0].dash),
      JSON.stringify(links.chain));
    check('11c and the legend names exactly the kinds on the page — no party row under a folder grouping',
      links.legend.join(',') === 'family,chain' && links.party.length === 0,
      `legend ${links.legend.join(',')} · party links ${links.party.length}`);
    check('11c2 every other line is a hub fan — nothing name-matched survives',
      links.total === links.group + 2, `${links.total} lines, ${links.group} hub fans`);
    /* A REAL HOVER lights the dependents — igPaint's adjacency reads the
       record's own edges now, so hovering the master lights its amendment
       and the contract whose payment waits on it. */
    const hover = await page.evaluate(() => {
      const n = IG.nodes.find(x => x.id === 'MK-P1');
      n.g.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      const lit = IG.nodes.filter(x => x.kind === 'contract' && !x.g.classList.contains('dim')).map(x => x.id).sort();
      n.g.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
      return lit;
    });
    check('11d hovering MK-P1 lights MK-P2 and MK-P6 and dims the rest',
      hover.join(',') === 'MK-P1,MK-P2,MK-P6', hover.join(','));
    /* A REAL PRESS on the node opens the card in the dock, and the block is
       measured as pixels rather than as markup. */
    const card = await page.evaluate(() => {
      const n = IG.nodes.find(x => x.id === 'MK-P1');
      n.g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      const blk = document.querySelector('#ig-dock [data-ig-deps-block="MK-P1"]');
      if (!blk) return { there: false };
      const r = blk.getBoundingClientRect(), dock = document.getElementById('ig-dock').getBoundingClientRect();
      const btn = blk.querySelector('[data-ig-deps]');
      /* The reading's own answer, so the card is checked AGAINST it rather
         than against a count typed here — an earlier section adds a Naivas
         contract to this book, and a party dependent is a fact, not noise. */
      const d = (typeof graphDependents === 'function') ? graphDependents('MK-P1') : { contracts: [] };
      return { there: true, w: Math.round(r.width), h: Math.round(r.height), inDock: r.left >= dock.left && r.right <= dock.right + 1,
        text: (blk.textContent || '').replace(/\s+/g, ' ').trim(), btn: !!btn && btn.getBoundingClientRect().height > 0,
        n: d.contracts.length, ids: d.contracts.map(x => x.id).sort() };
    });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, '11-blast-radius.png') });
    check('11e the card carries "If this ends" as visible pixels inside the dock',
      card.there && card.w > 100 && card.h > 30 && card.inDock, JSON.stringify(card));
    check('11f and it counts what depends — the amendment, the payment step, the same-counterparty contract, and the money on them',
      card.there && card.n >= 2 && new RegExp(card.n + ' contracts depend on it').test(card.text) && /1 amendment/.test(card.text) && /1 payment step/.test(card.text) && /on those contracts/.test(card.text),
      card.text);
    /* "SEE THE LIST" IS THE REGISTER'S ONE DOOR: it lands on Contracts,
       narrowed to exactly the dependents, with the chip saying so. */
    /* Guarded, so a build without the door REPORTS 11g rather than aborting. */
    await page.evaluate(() => { const b = document.querySelector('#ig-dock [data-ig-deps="MK-P1"]'); if (b) b.click(); });
    await page.waitForTimeout(1200);
    const list = await page.evaluate(() => ({
      view: state.view,
      chip: (document.getElementById('reg-only-chip') || {}).textContent || '',
      rows: [...document.querySelectorAll('#content tr[data-row], #content tr[data-id]')].map(r => r.getAttribute('data-row') || r.getAttribute('data-id')).sort(),
    }));
    check('11g See the list lands on the Contracts page narrowed to exactly the dependents, and the chip says why',
      list.view === 'register' && /MK-P1/.test(list.chip) && list.rows.join(',') === (card.ids || []).join(',') && list.rows.includes('MK-P2') && list.rows.includes('MK-P6'),
      JSON.stringify(list) + ' vs ' + (card.ids || []).join(','));
    await page.evaluate(() => { const b = document.getElementById('reg-only-clear'); if (b) b.click(); intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(600);

    /* ================= 12. NODE FACTS (A-1, 11 Sep 2026) ===================
       The third line on a node and its hover card. f291 holds the readings;
       what only a browser can say is whether the line is PAINTED — the right
       fact in the right ink on the right node — and whether a real hover
       brings the card's rows up beside the node without covering it. Against
       the parent every node draws two lines and no hover card exists. */
    await page.evaluate(() => {
      const by = id => state.contracts.find(c => c.id === id);
      const day = off => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + off);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
      /* MK-P6: a late promise with money, and nothing read. (It is MK-P1's
         amendment since section 11, so it can carry no renewal clock of its
         own — an amendment never renews itself, renewalWindow's rule.) */
      by('MK-P6').obligations = [{ id: 'ob_p6_rep', desc: 'Quarterly report', due: day(-4), status: 'open', amount: 120000 }];
      delete by('MK-P6').scan; delete by('MK-P6').playbook; delete by('MK-P6')._brief; delete by('MK-P6')._hasBrief;
      /* MK-P1: signed, read, its renewal decision 45 days out. The term is
         FAMILY-AWARE (a signed amendment moves it), so the amendment's own
         expiry has to say 45 too or the master reads MK-P6's later date. */
      by('MK-P1').scan = { at: new Date().toISOString(), findings: [] }; by('MK-P1').obligations = []; by('MK-P1').expiry = day(45); by('MK-P6').expiry = day(45);
      /* MK-P4: read, no dates, nothing outstanding — nothing to say. */
      by('MK-P4').scan = { at: new Date().toISOString(), findings: [] };
      intel.groupBy = 'folder'; intel.lenses = []; intel.groups = null; intel.history = []; intel.tab = 'map'; renderIntel();
    });
    await page.waitForTimeout(1600);
    const facts = await page.evaluate(() => {
      const read = id => { const n = IG.nodes.find(x => x.id === id); if (!n) return null;
        const sp = [...n.g.querySelectorAll('[data-ig-fact]')].map(t => ({ k: t.getAttribute('data-ig-fact'), text: t.textContent, fill: getComputedStyle(t).fill, w: Math.round(t.getBBox().width) }));
        const chip = n.g.querySelector('.ig-chip');
        return { h: n.h, facts: sp, unread: n.g.classList.contains('unread'), chipOp: Number(getComputedStyle(chip).opacity), lines: n.g.querySelectorAll('text').length }; };
      const amber = getComputedStyle(document.documentElement).getPropertyValue('--st-amber-fg').trim();
      const ruby = getComputedStyle(document.documentElement).getPropertyValue('--st-ruby-fg').trim();
      const probe = document.createElement('span'); probe.style.color = amber; document.body.appendChild(probe); const amberRgb = getComputedStyle(probe).color;
      probe.style.color = ruby; const rubyRgb = getComputedStyle(probe).color; probe.remove();
      return { p6: read('MK-P6'), p1: read('MK-P1'), p4: read('MK-P4'), amberRgb, rubyRgb };
    });
    check('12a MK-P6 carries a third line — what is late, and not read; MK-P1 carries its renewal clock',
      facts.p6 && facts.p1 && facts.p6.facts.map(f => f.k).join(',') === 'overdue,unread' && facts.p6.lines === 3 && facts.p6.h > 40
        && facts.p1.facts.map(f => f.k).join(',') === 'decide' && /45 d/.test(facts.p1.facts[0].text),
      JSON.stringify({ p6: facts.p6 && facts.p6.facts.map(f => f.k + ':' + f.text), p1: facts.p1 && facts.p1.facts.map(f => f.k + ':' + f.text) }));
    check('12b the clock is painted amber and the late promise ruby — measured, not read off a class',
      facts.p6 && facts.p1 && facts.p1.facts[0] && facts.p6.facts[0] && facts.p1.facts[0].fill === facts.amberRgb && facts.p6.facts[0].fill === facts.rubyRgb && facts.p6.facts.every(f => f.w > 10),
      facts.p1 && facts.p6 && `${(facts.p1.facts[0] || {}).fill} vs amber ${facts.amberRgb} · ${(facts.p6.facts[0] || {}).fill} vs ruby ${facts.rubyRgb}`);
    check('12c an unread node is faded, a read one is not, and a node with nothing to say keeps two lines',
      facts.p6 && facts.p4 && facts.p6.unread && facts.p6.chipOp < 0.7 && !facts.p4.unread && facts.p4.chipOp === 1 && facts.p4.facts.length === 0 && facts.p4.lines === 2,
      JSON.stringify({ p6: facts.p6 && { unread: facts.p6.unread, op: facts.p6.chipOp }, p4: facts.p4 && { unread: facts.p4.unread, op: facts.p4.chipOp, lines: facts.p4.lines } }));
    /* A REAL HOVER brings the card's rows up beside the node, not over it. */
    const hov = await page.evaluate(() => {
      const n = IG.nodes.find(x => x.id === 'MK-P6');
      n.g.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true }));
      const el = document.getElementById('ig-hover'); if (!el || el.hidden) return { there: false };
      const r = el.getBoundingClientRect(), g = n.g.getBoundingClientRect();
      const rows = [...el.querySelectorAll('[data-ig-fact]')].map(e => e.getAttribute('data-ig-fact'));
      /* Geometry, not elementFromPoint: an earlier section leaves the
         Copilot scrim over this page, which is a probe artefact and not a
         fact about the hover card. */
      const beside = r.left >= g.right - 1;
      const out = { there: true, w: Math.round(r.width), h: Math.round(r.height), rows, text: el.textContent.replace(/\s+/g, ' ').trim(),
        overlaps: !(r.right <= g.left || r.left >= g.right || r.bottom <= g.top || r.top >= g.bottom),
        beside };
      n.g.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }));
      out.hiddenAfter = el.hidden;
      return out;
    });
    await page.evaluate(() => { const n = IG.nodes.find(x => x.id === 'MK-P6'); n.g.dispatchEvent(new PointerEvent('pointerenter', { bubbles: true })); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '12-node-facts.png') });
    await page.evaluate(() => { const n = IG.nodes.find(x => x.id === 'MK-P6'); n.g.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true })); });
    check('12d hovering a node draws the card\'s own rows as visible pixels',
      hov.there && hov.w > 150 && hov.h > 40 && hov.rows.join(',') === 'overdue,read' && /120K|120,000/.test(hov.text),
      JSON.stringify(hov));
    check('12e and the card sits beside the node, never over it, and goes when the pointer leaves',
      hov.there && !hov.overlaps && hov.beside && hov.hiddenAfter, JSON.stringify({ overlaps: hov.overlaps, beside: hov.beside, hidden: hov.hiddenAfter }));
    await page.evaluate(() => { intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(500);

    /* ================= 13. THE COUNTERPARTY NODE (A-3, 11 Sep 2026) ========
       Under the counterparty grouping the hub is the party and carries four
       lines and a share bar. f292 holds the readings; what only a browser can
       say is whether the lines are PAINTED on the hub, whether the bar's
       length is the share, and whether the press still narrows the graph to
       that party. Against the parent the hub is a name over a count. */
    await page.evaluate(() => {
      const by = id => state.contracts.find(c => c.id === id);
      /* Naivas: two live contracts on paper that says 30 and 60 days, as a
         supplier; one promise met on time, one missed. */
      for (const id of ['MK-P1', 'MK-P6']) Object.assign(by(id).metadata = by(id).metadata || {}, { category: 'supplier' });
      by('MK-P1').metadata.paymentTerms = '30 days'; by('MK-P6').metadata.paymentTerms = '60 days';
      by('MK-P6').obligations = [
        { id: 'ob_ok', desc: 'On time', due: '2026-01-10', status: 'done', completedAt: '2026-01-05' },
        { id: 'ob_late', desc: 'Late', due: '2026-01-10', status: 'done', completedAt: '2026-02-01' } ];
      intel.groupBy = 'counterparty'; intel.lenses = []; intel.groups = null; intel.history = []; intel.tab = 'map'; renderIntel();
    });
    await page.waitForTimeout(1600);
    const hub = await page.evaluate(() => {
      const n = IG.nodes.find(x => x.kind === 'hub' && /naivas/i.test(x.label)); if (!n) return { there: false };
      const lines = [...n.g.querySelectorAll('[data-ig-cp-line]')].map(t => ({ text: t.textContent, w: Math.round(t.getBBox().width), fill: getComputedStyle(t).fill }));
      const bar = n.g.querySelector('.ig-cp-share'); const track = bar && bar.previousSibling;
      const p = (typeof graphPartyStats === 'function') ? graphPartyStats('Naivas') : { share: null, contracts: 0 };
      return { there: true, h: n.h, lines, full: n.lines || [], bar: bar ? { w: Number(bar.getAttribute('width')), track: Number(track.getAttribute('width')) } : null,
        share: p.share, contracts: p.contracts, pay: p.pay, onTime: p.onTime };
    });
    check('13a the Naivas hub carries its lines as painted text — contracts and share, on-time, and the payment terms',
      hub.there && hub.lines.length === 3 && hub.lines.every((l, i) => l.w > 20 && hub.full[i].startsWith(l.text.replace(/…$/, ''))) && hub.h > 60
        && new RegExp(hub.contracts + ' contracts · ' + Math.round(hub.share * 100) + '% of the book').test(hub.full[0])
        && /1 of 2 met on time/.test(hub.full[1]) && /Pays 45 d out/.test(hub.full[2]),
      JSON.stringify(hub.lines && hub.lines.map(l => l.text)));
    check('13b the share bar\'s length IS the share — a second carrier beside the printed figure',
      hub.there && hub.bar && hub.share > 0 && Math.abs(hub.bar.w / hub.bar.track - hub.share) < 0.03,
      hub.bar && `${hub.bar.w}/${hub.bar.track} vs ${hub.share && hub.share.toFixed(3)}`);
    /* A REAL PRESS on the party hub still narrows the graph to that party. */
    const narrowed = await page.evaluate(() => {
      const n = IG.nodes.find(x => x.kind === 'hub' && /naivas/i.test(x.label));
      n.g.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      return { lenses: intel.lenses.map(l => l.label), shown: IG.nodes.filter(x => x.kind === 'contract').map(x => x.id).sort() };
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, '13-counterparty-hub.png') });
    check('13c pressing the party hub narrows the graph to that party\'s contracts',
      narrowed.lenses.some(l => /Naivas/.test(l)) && narrowed.shown.length >= 2 && narrowed.shown.includes('MK-P1') && narrowed.shown.includes('MK-P6'),
      JSON.stringify(narrowed));
    await page.evaluate(() => { intel.lenses = []; intel.groupBy = 'folder'; intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(500);

    /* ================= 14. THE RENEWAL CLIFF (A-4, 11 Sep 2026) =============
       f293 holds the grouping; what only a browser can say is whether the
       quarter hubs are laid out LEFT TO RIGHT IN TIME, whether the scrubber
       is a control on the note line that fades the passed nodes as a
       computed opacity and rewrites the hub lines without a repaint, and
       whether a crowded quarter is painted amber. Dates are built from
       quarter boundaries, never by counting days (the f183 rule). */
    await page.evaluate(() => {
      const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      /* The LAST day of the quarter, so this quarter's decision is never
         already behind today. */
      const qMid = off => { const d = new Date(); d.setHours(0, 0, 0, 0); const q = Math.floor(d.getMonth() / 3) + off;
        return iso(new Date(d.getFullYear() + Math.floor(q / 4), ((q % 4) + 4) % 4 * 3 + 3, 0)); };
      const by = id => state.contracts.find(c => c.id === id);
      /* Four signed contracts across three quarters, one of them crowded. */
      by('MK-P1').expiry = qMid(0); delete by('MK-P6').parentId; by('MK-P6').expiry = qMid(1); by('MK-P6').status = 'Signed';
      by('MK-P2').status = 'Signed'; by('MK-P2').expiry = qMid(1); by('MK-P3').status = 'Signed'; by('MK-P3').expiry = qMid(1);
      by('MK-P4').status = 'Signed'; by('MK-P4').expiry = qMid(2);
      intel.groupBy = 'decision'; intel.lenses = []; intel.groups = null; intel.history = []; intel.cliffDays = 0; intel.tab = 'map'; renderIntel();
    });
    await page.waitForTimeout(1800);
    const cliff = await page.evaluate(() => {
      const hubs = IG.nodes.filter(n => n.kind === 'hub').slice().sort((a, b) => a.order - b.order);
      const xs = hubs.map(h => Math.round(h.x));
      const sub = h => ({ text: h.g.querySelector('.ig-sub').textContent, fill: getComputedStyle(h.g.querySelector('.ig-sub')).fill });
      const q1 = hubs.find(h => h.order === 1), q0 = hubs.find(h => h.order === 0);
      const ctl = document.getElementById('ig-cliff'), note = document.getElementById('ig-note');
      const r = ctl && ctl.getBoundingClientRect();
      /* Guarded, so a build without the grouping REPORTS rather than throws. */
      if (!q0) return { labels: hubs.map(h => h.label), xs, inOrder: false, q1: null, thisQ: { text: '', fill: '' }, wantQ1: '', wantQ0: '', ctl: !!ctl, inNote: false, out: '' };
      /* The counts are checked AGAINST the reading rather than typed here:
         an earlier section adds a signed contract to this book. */
      const at = (typeof graphCliffAt === 'function') ? graphCliffAt(0) : { passed: [] };
      const want = h => { const ids = [...(IG.adj[h.id] || [])].filter(id => IG.byId[id] && IG.byId[id].kind === 'contract'); const p = ids.filter(id => at.passed.includes(id)).length; return `${p} passed · ${ids.length - p} ahead`; };
      return { labels: hubs.map(h => h.label), xs, inOrder: xs.every((x, i) => i === 0 || x > xs[i - 1]),
        q1: q1 && sub(q1), thisQ: sub(q0), wantQ1: q1 && want(q1), wantQ0: want(q0), amber: getComputedStyle(document.documentElement).getPropertyValue('--st-amber-dot').trim(),
        ctl: !!ctl && r.width > 100 && r.height > 0, inNote: !!ctl && !!note && note.contains(ctl), out: (document.getElementById('ig-cliff-out') || {}).textContent };
    });
    check('14a the quarter hubs sit left to right in time order',
      cliff.labels.length >= 3 && cliff.inOrder && cliff.labels[0] === 'This quarter', JSON.stringify({ labels: cliff.labels, xs: cliff.xs }));
    check('14b the scrubber is a control on the note line, starting at today',
      cliff.ctl && cliff.inNote && /today/i.test(cliff.out || ''), JSON.stringify({ ctl: cliff.ctl, inNote: cliff.inNote, out: cliff.out }));
    check('14c every quarter hub says how many are passed and how many ahead, and the crowded one says so in amber',
      cliff.q1 && cliff.q1.text === cliff.wantQ1 + ' · crowded' && cliff.thisQ.text === cliff.wantQ0 && /3 ahead|4 ahead/.test(cliff.q1.text) && /0 passed · 1 ahead/.test(cliff.thisQ.text),
      JSON.stringify({ q1: cliff.q1, thisQ: cliff.thisQ, wantQ1: cliff.wantQ1, wantQ0: cliff.wantQ0 }));
    const amberProbe = await page.evaluate(a => { const p = document.createElement('span'); p.style.color = a; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; }, cliff.amber);
    check('14d the crowded hub\'s line is painted amber; the quiet one is not',
      cliff.q1 && cliff.q1.fill === amberProbe && cliff.thisQ.fill !== amberProbe, `${cliff.q1 && cliff.q1.fill} vs amber ${amberProbe}; quiet ${cliff.thisQ && cliff.thisQ.fill}`);
    /* A REAL DRAG of the scrubber: the passed nodes fade, the hub lines
       move, and nothing is repainted (the same node elements survive). */
    await page.evaluate(() => { window._igBefore = IG.nodes.find(n => n.id === 'MK-P1').g;
      const ctl = document.getElementById('ig-cliff'); if (ctl){ ctl.value = '180'; ctl.dispatchEvent(new Event('input', { bubbles: true })); } });
    await page.waitForTimeout(400);   // the fade is a transition; read it once it has run
    const moved = await page.evaluate(() => {
      const before = window._igBefore;
      const op = id => Number(getComputedStyle(IG.nodes.find(n => n.id === id).g).opacity);
      const hubs = IG.nodes.filter(n => n.kind === 'hub'); const q0 = hubs.find(h => h.order === 0);
      return { p1: op('MK-P1'), p4: op('MK-P4'), sameEl: IG.nodes.find(n => n.id === 'MK-P1').g === before,
        thisQ: q0 ? q0.g.querySelector('.ig-sub').textContent : '', out: (document.getElementById('ig-cliff-out') || {}).textContent || '', days: intel.cliffDays };
    });
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT, '14-renewal-cliff.png') });
    check('14e dragging the scrubber six months on fades this quarter\'s decision as a computed opacity and leaves a later one lit',
      moved.p1 < 0.5 && moved.p4 === 1, `p1 ${moved.p1} · p4 ${moved.p4}`);
    check('14f and the hub line follows, the readout names the date, and nothing was repainted',
      /1 passed · 0 ahead/.test(moved.thisQ) && /to /.test(moved.out) && moved.sameEl && moved.days === 180, JSON.stringify(moved));
    await page.evaluate(() => { intel.cliffDays = 0; intel.groupBy = 'folder'; intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(500);

    /* ================= 15. MONEY THROUGH THE VALUE STREAM (A-5, 11 Sep 2026) =
       f294 holds the reading; what only a browser can say is whether the hub
       PAINTS In / Out / Net with "on paper" on it, whether the net's ink is
       the sign's, whether the links are really drawn at the width the value
       gives them (bounded 1.5–9px as a COMPUTED stroke), whether the legend
       says what was left out, and whether a reader without money rights gets
       a hub with a name and a count and nothing else. */
    await page.evaluate(() => {
      const by = id => state.contracts.find(c => c.id === id);
      const side = (id, s, f) => { const c = by(id); if (!c) return; c.metadata = c.metadata || {}; c.metadata.category = s; if (f) c.folder = f; };
      side('MK-P1', 'customer'); side('MK-P6', 'customer'); side('MK-P2', 'supplier');   // procurement: in 13M, out 5M
      side('MK-P3', 'supplier', 'sales');                                                 // sales: out 3M, nothing in
      side('MK-P4', 'works');                                                             // side not recorded: unsided, said in the legend
      intel.groupBy = 'folder'; intel.lenses = []; intel.groups = null; intel.history = []; intel.tab = 'map'; renderIntel();
    });
    await page.waitForTimeout(1500);
    const flow = await page.evaluate(() => {
      const F = (typeof graphStreamFlow === 'function') ? graphStreamFlow() : null;
      const hubs = IG.nodes.filter(n => n.kind === 'hub').map(h => {
        const lines = [...h.g.querySelectorAll('[data-ig-flow]')].map(t => ({ text: t.textContent, w: Math.round(t.getBBox().width), fill: getComputedStyle(t).fill }));
        const S = F && Object.values(F).find(x => (FOLDERS[x.folder]?.name || 'Other') === h.label);
        return { label: h.label, sub: h.g.querySelector('.ig-sub') ? h.g.querySelector('.ig-sub').textContent : '', lines, want: (S && typeof graphStreamLines === 'function') ? graphStreamLines(S).map(l => l.text) : [], net: S ? S.net : null, h: h.h };
      });
      const links = IG.edges.filter(e => String(e.from).startsWith('hub:')).map(e => ({ to: e.to, w: parseFloat(getComputedStyle(e.el).strokeWidth), attr: e.el.getAttribute('data-ig-w') }));
      const vOf = id => { const c = state.contracts.find(x => x.id === id); const h = (typeof fxHome === 'function') ? fxHome(c) : { v: c.value, missing: false }; return h.missing ? 0 : h.v; };
      const biggest = links.slice().sort((a, b) => vOf(b.to) - vOf(a.to))[0];
      const leg = document.getElementById('ig-legend'); const q = k => leg && leg.querySelector(`[data-ig-legend-flow="${k}"]`);
      const miss = F ? Object.values(F).reduce((a, S) => a + Object.values(S.missing || {}).reduce((x, y) => x + y, 0), 0) : 0, uns = F ? Object.values(F).reduce((a, S) => a + (S.unsided || 0), 0) : 0;
      const g = k => getComputedStyle(document.documentElement).getPropertyValue(k).trim();
      return { F: !!F, hubs, links, biggest: biggest && { to: biggest.to, w: biggest.w }, legend: { head: leg ? leg.textContent : '', in: !!q('in') && q('in').getBoundingClientRect().height > 0, out: !!q('out'), left: q('left') ? q('left').textContent : null, miss, uns },
        green: g('--st-green-dot'), ruby: g('--st-ruby-dot') };
    });
    const paint = async v => page.evaluate(a => { const p = document.createElement('span'); p.style.color = a; document.body.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; }, v);
    const green = await paint(flow.green), ruby = await paint(flow.ruby);
    const proc = flow.hubs.find(h => /procurement/i.test(h.label)), sales = flow.hubs.find(h => /sales/i.test(h.label));
    check('15a every stream hub paints In / Out / Net as text under its count, and every one says "on paper" on the hub itself',
      flow.F && flow.hubs.length >= 2 && flow.hubs.every(h => h.lines.length === 2 && h.lines.every((l, i) => l.w > 20 && h.want[i].startsWith(l.text.replace(/…$/, ''))) && /on paper/.test(h.want[1]) && /contracts?/.test(h.sub) && h.h > 60),
      JSON.stringify(flow.hubs.map(h => ({ label: h.label, sub: h.sub, lines: h.lines.map(l => l.text), want: h.want }))));
    check('15b the figures are the reading\'s: procurement is money in (customers) over money out (suppliers), sales is out alone',
      proc && sales && proc.net > 0 && sales.net < 0 && /^In KES 13M · Out KES 5M/.test(proc.want[0] || '') && /^Net \+KES 8M/.test(proc.want[1] || '') && /^Net −KES 3M/.test(sales.want[1] || ''),
      JSON.stringify({ proc: proc && proc.want, sales: sales && sales.want }));
    check('15c the net line\'s ink IS the sign: green on the stream that takes money in, ruby on the one that pays out',
      proc && sales && proc.lines[1] && proc.lines[1].fill === green && sales.lines[1] && sales.lines[1].fill === ruby,
      JSON.stringify({ proc: proc && proc.lines[1] && proc.lines[1].fill, sales: sales && sales.lines[1] && sales.lines[1].fill, green, ruby }));
    check('15d every hub link is drawn at a computed width between 1.5 and 9px, the biggest contract\'s link is the widest at 9, and the width is the edge\'s own',
      flow.links.length >= 5 && flow.links.every(l => l.w >= 1.5 && l.w <= 9 && (l.attr === null || Math.abs(parseFloat(l.attr) - l.w) < 0.05)) && flow.biggest && flow.biggest.w === 9 && flow.links.some(l => l.w < 9),
      JSON.stringify({ links: flow.links, biggest: flow.biggest }));
    check('15e the legend names in and out, prints what was left out as one sentence whose counts are the reading\'s, and says the money is what the paper says',
      flow.legend.in && flow.legend.out && /Money on paper/.test(flow.legend.head) && flow.legend.uns >= 1 && flow.legend.left === `Left out: ${flow.legend.miss} with no rate on file, ${flow.legend.uns} whose side is not recorded` && /what the paper says, not what was invoiced/i.test(flow.legend.head),
      JSON.stringify(flow.legend));
    await page.screenshot({ path: path.join(OUT, '15-money-flow.png') });
    /* A READER WITHOUT MONEY RIGHTS: the same page, the same grouping. */
    await page.evaluate(() => { window._igCvv = window.canViewValues; window.canViewValues = () => false; intel.history = []; renderIntel(); });
    await page.waitForTimeout(1200);
    const viewer = await page.evaluate(() => {
      const hubs = IG.nodes.filter(n => n.kind === 'hub');
      const leg = document.getElementById('ig-legend');
      return { flowLines: hubs.reduce((a, h) => a + h.g.querySelectorAll('[data-ig-flow]').length, 0), subs: hubs.map(h => h.g.querySelector('.ig-sub') ? h.g.querySelector('.ig-sub').textContent : ''),
        legend: leg ? /Money on paper/.test(leg.textContent) : null, widths: [...new Set(IG.edges.filter(e => String(e.from).startsWith('hub:')).map(e => getComputedStyle(e.el).strokeWidth))] };
    });
    check('15f a reader without money rights gets a hub with its name and count, no money lines, no money legend, and links all one width',
      viewer.flowLines === 0 && viewer.subs.every(s => /contracts?/.test(s)) && viewer.legend === false && viewer.widths.length === 1,
      JSON.stringify(viewer));
    await page.evaluate(() => { window.canViewValues = window._igCvv; intel.groupBy = 'folder'; intel.tab = 'frame'; setView('intel'); });
    await page.waitForTimeout(500);

    /* ================= 16. NO POP-UPS ON THIS PAGE ========================= */
    /* Owner-asked 11 Sep 2026 ("remove such pops in this page"), off a red
       toast reading "One quoted excerpt could not be matched to the contract
       text…" drawn over a dock answer that already carried the sentence. The
       journey is the owner's own: a question typed into THIS page's box, an
       answer citing a contract with a quote the contract does not contain, the
       server dropping the quote and sending its notice. What is measured is
       where that notice lands — under the answer, and NOT in the toast tray.
       The main Copilot panel is the CONTROL: not in the ask, still pops. */
    const BAD_QUOTE = 'these words appear nowhere in that agreement at all';
    const scriptBadQuote = () => { ai.reset(); ai.script(
      [{ type: 'tool_use', id: 'tu_q', name: 'deliver_answer',
        input: { answer: 'MK-P1 is a supply agreement — the term is stated in clause 3.', citations: [{ id: 'MK-P1', quote: BAD_QUOTE }] } }]); };
    await page.evaluate(() => { intelGoTab('map'); });
    await page.waitForTimeout(800);
    await page.evaluate(() => { document.getElementById('toast-root').innerHTML = ''; intel.history = []; });
    scriptBadQuote();
    await page.evaluate(async () => { await intelAsk('what does MK-P1 say about the term?'); });
    await page.waitForTimeout(1200);
    const dockNotice = await page.evaluate(() => {
      const last = intel.history[intel.history.length - 1] || {};
      const dock = document.getElementById('ig-dock');
      const toasts = [...document.querySelectorAll('#toast-root > *')].map(t => t.textContent.trim());
      return { role: last.role, inHistory: /could not be matched to the contract text/.test(last.text || ''),
        onScreen: !!dock && /could not be matched to the contract text/.test(dock.textContent),
        answerOnScreen: !!dock && /supply agreement/.test(dock.textContent),
        toasts, popped: toasts.some(t => /could not be matched/.test(t)) };
    });
    await page.screenshot({ path: path.join(OUT, '16-no-popup.png') });
    check('16a the dock\'s own answer arrived and the server\'s notice is printed UNDER it, on screen',
      dockNotice.role === 'assistant' && dockNotice.answerOnScreen && dockNotice.inHistory && dockNotice.onScreen, JSON.stringify(dockNotice));
    check('16b and nothing about it is in the pop-up tray', dockNotice.popped === false && dockNotice.toasts.length === 0,
      JSON.stringify(dockNotice.toasts));
    /* CONTROL — the same answer through the main Copilot panel still pops. */
    scriptBadQuote();
    await page.evaluate(async () => { document.getElementById('toast-root').innerHTML = ''; openAI(); document.getElementById('ai-input').value = 'what does MK-P1 say about the term?'; await aiSubmit(); });
    await page.waitForTimeout(1200);
    const mainPop = await page.evaluate(() => [...document.querySelectorAll('#toast-root > *')].map(t => t.textContent.trim()));
    check('16c CONTROL — the main Copilot panel was not in the ask and its pop-up still fires',
      mainPop.some(t => /could not be matched/.test(t)), JSON.stringify(mainPop));
    await page.evaluate(() => { if (typeof closeAI === 'function') closeAI(); });

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
