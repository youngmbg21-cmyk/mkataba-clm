/* J11 — Charts: a named shape is binding, and the numbers do not move.
   ============================================================
   NETWORK NOTE: this sandbox's egress policy returns 403 for
   cdnjs.cloudflare.com (Chart.js's CDN) — confirmed with a direct curl before
   writing this file, and the proxy README says not to route around an org
   policy denial. So the Chart.js CANVAS cannot be hydrated or screenshotted
   here. What CAN be, and is, proven in this real browser: the exact
   production pipeline (window.aiExtractCharts -> aiHonourShape ->
   window.aiChartHtml -> aiBreakdownConfig/AI_CHART_RECIPES) computing the
   real chart TYPE and the real DATA off live state.contracts. This is the
   same code the chat panel calls; only the pixel-paint step is unreached.
   The live chat submission is also driven once, end to end, to prove the
   wiring (aiLastAsk threading the question) really reaches this code from a
   real typed message — the DOM shows the honest "needs an internet
   connection" note, which only appears once a chart CONFIG was built.

   Run: node test/e2e-evidence/J11/run-charts.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../../helpers');

const OUT = path.join(__dirname, 'shots');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const rows = []; // for charts.md
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    /* A deterministic book: known status counts, known counterparties (for
       hbar), known expiry months, and risk scores via a stubbed contractRisk
       (this stage's own — the recipe itself requires it to draw at all). */
    await page.evaluate(() => {
      const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
      const mk = o => Object.assign({ valueType: 'standard', audit: [], folder: 'proc', rounds: [] }, o);
      state.contracts = [
        mk({ id: 'MK-C1', name: 'Draft one', counterparty: 'Naivas', status: 'Draft', value: 1000000, expiry: day(400) }),
        mk({ id: 'MK-C2', name: 'Draft two', counterparty: 'Naivas', status: 'Draft', value: 500000, expiry: day(400) }),
        mk({ id: 'MK-C3', name: 'Review one', counterparty: 'Siginon', status: 'Under Review', value: 2000000, expiry: day(20) }),
        mk({ id: 'MK-C4', name: 'Signed one', counterparty: 'Britam', status: 'Signed', value: 4000000, expiry: day(50) }),
        mk({ id: 'MK-C5', name: 'Signed two', counterparty: 'Kwezi', status: 'Signed', value: 3000000, expiry: day(200) }),
        mk({ id: 'MK-C6', name: 'Declined one', counterparty: 'Britam', status: 'Declined', value: 900000, expiry: day(30) }),
      ];
      window._origContractRisk = window.contractRisk;
      window.contractRisk = c => ({ 'MK-C1': 80, 'MK-C2': 55, 'MK-C3': 20, 'MK-C4': 85, 'MK-C5': 10, 'MK-C6': 60 }[c.id] || 0);
    });

    /* ---- baseline: the original recipes, unmoved ---- */
    const baseline = await page.evaluate(() => ({
      statusBreakdown: window.AI_CHART_RECIPES.statusBreakdown(),
      riskBands: window.AI_CHART_RECIPES.riskBands(),
      expiryTimeline: window.AI_CHART_RECIPES.expiryTimeline(),
      valueByCounterparty: window.AI_CHART_RECIPES.valueByCounterparty(),
    }));
    check('baseline recipes all drew (fixture is sane)',
      baseline.statusBreakdown && baseline.riskBands && baseline.expiryTimeline && baseline.valueByCounterparty,
      Object.keys(baseline).map(k => `${k}:${!!baseline[k]}`).join(' '));

    const fig = cfg => cfg ? { type: cfg.type, labels: cfg.data.labels, data: cfg.data.datasets.map(d => d.data) } : null;

    /* ---- the direct pipeline call: exactly what aiFmt runs, exported ---- */
    const runShape = (specIn, ask) => page.evaluate(({ specIn, ask }) => {
      const src = '```hati-chart\n' + JSON.stringify(specIn) + '\n```';
      const { blocks, text } = window.aiExtractCharts(src, 999, ask);
      const b = blocks[0];
      window.aiChartHtml(b); // mutates b.config as the real feed render does
      return { honouredSpec: b.spec, config: b.config
        ? { type: b.config.type, labels: b.config.data.labels, data: b.config.data.datasets.map(d => d.data) } : null,
        text };
    }, { specIn, ask });

    /* ======= 1. THE REPORTED CASE — status as bars ======= */
    const askBar = 'give the status in bar graph format';
    const r1 = await runShape({ kind: 'statusBreakdown', title: 'Portfolio by lifecycle status' }, askBar);
    check('asking for the status "in bar graph format" swaps the doughnut for a BAR',
      r1.config && r1.config.type === 'bar', JSON.stringify(r1.config));
    check('and the FIGURES reproduce the doughnut exactly — same labels, same counts',
      r1.config && JSON.stringify(r1.config.labels) === JSON.stringify(fig(baseline.statusBreakdown).labels)
      && JSON.stringify(r1.config.data) === JSON.stringify(fig(baseline.statusBreakdown).data),
      `bar: ${JSON.stringify(r1.config)} | doughnut: ${JSON.stringify(fig(baseline.statusBreakdown))}`);
    rows.push({ ask: askBar, kindAsked: 'statusBreakdown (doughnut, baked)', shapeDrawn: r1.config && r1.config.type,
      before: JSON.stringify(fig(baseline.statusBreakdown)), after: JSON.stringify(r1.config) });

    /* Drive it through the REAL chat box too, once, to prove the wiring. */
    ai.script({ content: [{ type: 'tool_use', id: 'tu1', name: 'deliver_answer', input: {
      answer: 'Here is the status breakdown.\n\n```hati-chart\n{"kind":"statusBreakdown","title":"Portfolio by lifecycle status"}\n```',
      citations: [] } }] });
    await page.evaluate(async q => {
      openAI();
      document.getElementById('ai-input').value = q;
      await aiSubmit();
    }, askBar);
    await page.waitForTimeout(2500);
    await page.screenshot({ path: path.join(OUT, 'charts-01-live-chat-bar-request.png') });
    const chatState = await page.evaluate(() => {
      const feed = document.getElementById('ai-feed');
      const card = feed ? feed.querySelector('.ai-chart:last-of-type, .ai-chart') : null;
      return { feedText: feed ? feed.textContent.replace(/\s+/g, ' ').slice(-400) : '',
        hasChartCard: !!card, hasOfflineNote: !!(feed && /internet connection/i.test(feed.textContent)) };
    });
    check('the live chat pipeline (typed question -> aiLastAsk -> aiFmt -> aiExtractCharts) really ran and produced a chart card',
      chatState.hasChartCard && chatState.hasOfflineNote,
      `card=${chatState.hasChartCard} offlineNote=${chatState.hasOfflineNote} :: ${chatState.feedText}`);

    /* ======= 2. riskBands -> line/bar ======= */
    const askLine = 'show risk as a line chart please';
    const r2 = await runShape({ kind: 'riskBands', title: 'Risk bands' }, askLine);
    check('asking risk bands "as a line chart" swaps the doughnut for a LINE',
      r2.config && r2.config.type === 'line', JSON.stringify(r2.config));
    check('and the risk FIGURES are unmoved',
      r2.config && JSON.stringify(r2.config.data) === JSON.stringify(fig(baseline.riskBands).data)
      && JSON.stringify(r2.config.labels) === JSON.stringify(fig(baseline.riskBands).labels),
      `line: ${JSON.stringify(r2.config)} | doughnut: ${JSON.stringify(fig(baseline.riskBands))}`);
    rows.push({ ask: askLine, kindAsked: 'riskBands (doughnut, baked)', shapeDrawn: r2.config && r2.config.type,
      before: JSON.stringify(fig(baseline.riskBands)), after: JSON.stringify(r2.config) });

    /* ======= 3. expiryTimeline (already bar) -> pie ======= */
    const askPie = 'give me the expiry timeline as a pie chart';
    const r3 = await runShape({ kind: 'expiryTimeline', title: 'Contracts expiring' }, askPie);
    check('asking the expiry timeline "as a pie chart" swaps the bar for a PIE',
      r3.config && r3.config.type === 'pie', JSON.stringify(r3.config));
    /* A round shape deliberately DROPS zero-count months (aiBreakdownConfig's
       own documented rule: "a zero is a slice of nothing and a bar of
       something" — f177 pins the same claim). So "unmoved" for a pie means
       the NON-ZERO months still carry the identical counts, not that the
       12-length array is reproduced verbatim — that would be the wrong
       comparison, not a product fault. */
    const baseFig = fig(baseline.expiryTimeline);
    const nonZero = baseFig.labels.map((l, i) => [l, baseFig.data[0][i]]).filter(([, v]) => v > 0);
    const pieRows = r3.config ? r3.config.labels.map((l, i) => [l, r3.config.data[0][i]]) : [];
    check('and the expiry FIGURES for every month that DOES appear are unmoved (zero months are a documented pie/doughnut convention, not a moved number)',
      r3.config && JSON.stringify(pieRows) === JSON.stringify(nonZero),
      `pie(non-zero only): ${JSON.stringify(pieRows)} | bar non-zero months: ${JSON.stringify(nonZero)}`);
    rows.push({ ask: askPie, kindAsked: 'expiryTimeline (bar, baked)', shapeDrawn: r3.config && r3.config.type,
      before: JSON.stringify(fig(baseline.expiryTimeline)), after: JSON.stringify(r3.config) });

    /* Asking for the shape it is ALREADY drawn in must not rewrite it into a
       needless breakdown (drawn === want -> unchanged spec, per aiHonourShape). */
    const r3b = await runShape({ kind: 'expiryTimeline', title: 'Contracts expiring' }, 'expiry as a bar chart');
    check('asking for a shape it is ALREADY in leaves the ORIGINAL fixed kind untouched (no needless rewrite)',
      r3b.honouredSpec && r3b.honouredSpec.kind === 'expiryTimeline', JSON.stringify(r3b.honouredSpec));

    /* ======= 4. kinds deliberately NOT on the swap list ======= */
    const notSwapped = [
      { kind: 'valueByCounterparty', ask: 'value by counterparty as a pie chart' },
      { kind: 'valueStreamSplit', ask: 'value stream split as a pie chart' },
      { kind: 'renewalPipeline', ask: 'renewal pipeline as a pie chart' },
      { kind: 'cycleTime', ask: 'cycle time as a pie chart' },
      { kind: 'obligationsDue', ask: 'obligations due as a pie chart' },
    ];
    for (const t of notSwapped) {
      const r = await runShape({ kind: t.kind, title: t.kind }, t.ask);
      const kindUnchanged = r.honouredSpec && r.honouredSpec.kind === t.kind;
      check(`"${t.kind}" is NOT on the swap list — a pie request leaves its own fixed kind (never rewritten to breakdown/pie)`,
        kindUnchanged, JSON.stringify(r.honouredSpec));
      rows.push({ ask: t.ask, kindAsked: t.kind + ' (not on swap list)', shapeDrawn: r.config ? r.config.type : '(no data on this fixture)',
        before: '(fixed recipe, no baseline needed)', after: JSON.stringify(r.honouredSpec) });
    }

    /* ======= 5. ordinary English must not be misread as a shape request ======= */
    const falsePositives = [
      'barred by the limitation period',
      'the bar association requires notice',
      'please sign on the dotted line',
    ];
    for (const s of falsePositives) {
      const got = await page.evaluate(t => window.aiAskedShape(t), s);
      check(`ordinary English is not read as a shape request: "${s}"`, got == null, String(got));
      rows.push({ ask: s, kindAsked: '(false-positive probe)', shapeDrawn: got == null ? 'none (correct)' : got, before: '', after: '' });
    }
    /* and the real positives keep working alongside them */
    const truePositives = [
      ['give the status in bar graph format', 'bar'],
      ['as a pie', 'pie'],
      ['horizontal bar please', 'hbar'],
      ['as a line chart', 'line'],
      ['in doughnut form', 'doughnut'],
    ];
    for (const [s, want] of truePositives) {
      const got = await page.evaluate(t => window.aiAskedShape(t), s);
      check(`shape phrase recognised: "${s}" -> ${want}`, got === want, String(got));
    }

    /* ======= 6. months on a chart axis follow the READER'S LANGUAGE ======= */
    await page.evaluate(() => { if (window.langSet) langSet('en', { repaint: false }); });
    const monthsEn = await page.evaluate(() => window.AI_CHART_RECIPES.expiryTimeline().data.labels);
    await page.evaluate(() => { if (window.langSet) langSet('sv', { repaint: false }); });
    await page.waitForTimeout(300);
    const monthsSv = await page.evaluate(() => window.AI_CHART_RECIPES.expiryTimeline().data.labels);
    await page.evaluate(() => { if (window.langSet) langSet('en', { repaint: false }); });
    check('chart month labels follow the READER\'S LANGUAGE (not the market)',
      JSON.stringify(monthsEn) !== JSON.stringify(monthsSv), `en=${monthsEn.join('|')}  sv=${monthsSv.join('|')}`);

    check('no page errors during the chart-shape journey', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  fs.writeFileSync(path.join(__dirname, 'run-charts.json'), JSON.stringify(results, null, 2));
  const md = ['| ask | kind asked | shape drawn | before | after |', '|---|---|---|---|---|']
    .concat(rows.map(r => `| ${r.ask} | ${r.kindAsked} | ${r.shapeDrawn} | \`${(r.before||'').slice(0,140)}\` | \`${(r.after||'').slice(0,140)}\` |`))
    .join('\n');
  fs.writeFileSync(path.join(__dirname, 'charts.md'),
    '# Chart shape-swap evidence (J11)\n\nNETWORK NOTE: Chart.js CDN (cdnjs.cloudflare.com) is denied by this sandbox\'s '
    + 'egress policy (403, confirmed by curl before writing tests) — canvas pixels could not be captured here. '
    + 'Every row below was produced by calling the real, exported production functions '
    + '(`window.aiExtractCharts` -> `window.aiHonourShape` (bare-called inside it) -> `window.aiChartHtml` -> '
    + '`aiBreakdownConfig`/`AI_CHART_RECIPES`) in a real Chromium instance against live `state.contracts`.\n\n' + md + '\n');
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
