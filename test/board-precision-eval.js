/* THE BOARD'S PRECISION, THE COPILOT HALF (the owner's work order, Part 7,
   4 Oct 2026). Run: npm run eval:board

   Only with a real Copilot key (ANTHROPIC_API_KEY, or HATI_EVAL_KEY): CI has
   none, so CI never runs it, and without one it says so and stops — nothing
   is spent. With a key it starts HaTi on the book's own contracts, opens Home's
   board in a real browser, asks every 'copilot' request of the precision book
   through the panel exactly as a person would (the real /api/ai/graph route,
   with the board on screen), and compares what Copilot pressed against the
   book's want with the same judge the free half uses. It writes a dated
   report to docs/BOARD-PRECISION.md: the hit rate, every miss with what came
   back, and what the run cost (the spend page's own total). */
const fs = require('node:fs');
const path = require('node:path');
const { startHati, seedWorkspace } = require('./helpers');
const { ROOT, readBook, bookContracts, judgeCopilot } = require('./board-precision');

const KEY = process.env.HATI_EVAL_KEY || process.env.ANTHROPIC_API_KEY || '';
const OUT = process.env.HATI_EVAL_OUT || path.join(ROOT, 'docs', 'BOARD-PRECISION.md');

(async () => {
  if (!KEY || KEY === 'test-key-not-real'){
    console.log('eval:board — skipped: no Copilot key (set ANTHROPIC_API_KEY or HATI_EVAL_KEY). Nothing was sent and nothing was spent.');
    process.exit(0);
  }
  const { chromium } = require('playwright-core');
  const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const book = readBook();
  const asks = book.requests.filter(r => r.road === 'copilot');
  const h = await startHati({ ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: process.env.HATI_EVAL_BASE_URL || 'https://api.anthropic.com' });
  const seeded = await seedWorkspace(h, { contracts: bookContracts(), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const rows = [];
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 0, null, { timeout: 30000 });
    for (const r of asks){
      await page.evaluate(() => { const s = hbS(); s.face = 'board'; s.panels = []; s.path = []; s.recipe = {}; s.undo = []; hbSave(); setView('dashboard'); intel.history = []; });
      await page.waitForFunction(() => !!document.getElementById('hb-board'), null, { timeout: 15000 });
      if (r.after) await page.evaluate(async q => { await intelAsk(q); }, r.after);
      /* this request's own answer: a slow reply to the one before is never
         counted against this one */
      const mine = res => { if (!/\/api\/ai\/graph$/.test(new URL(res.url()).pathname) || res.request().method() !== 'POST') return false;
        try { return String((res.request().postDataJSON() || {}).query || '').includes(r.q); } catch (_){ return false; } };
      const answer = page.waitForResponse(mine, { timeout: 120000 });
      await page.evaluate(async q => { await intelAsk(q); }, r.q);
      let res = null, misses;
      try { res = await (await answer).json(); misses = judgeCopilot(res, r.want); }
      catch (e){ misses = ['no answer from the route: ' + e.message]; }
      rows.push({ r, res, misses });
      console.log(`${misses.length ? 'MISS' : 'HIT '}  ${r.q}${misses.length ? ' — ' + misses.join('; ') : ''}`);
    }
  } finally {
    let spend = null;
    try { spend = await seeded.admin.json('/api/ai/spend'); } catch (_){ spend = null; }
    await browser.close(); await h.stop();
    const hits = rows.filter(x => !x.misses.length).length;
    const rate = rows.length ? Math.floor(100 * hits / rows.length) : 0;
    const day = new Date().toISOString().slice(0, 10);
    const cost = spend && typeof spend.total === 'number' ? `${spend.total.toFixed(4)} (the spend page's total for the run's own workspace, ${spend.requests} requests)` : 'not read';
    const lines = [
      '# The board\'s precision — the Copilot half',
      '',
      `Run ${day}. Written by \`npm run eval:board\` (test/board-precision-eval.js) from test/board-precision-book.json. The free half is measured on every change by f502.`,
      '',
      `- Hit rate: **${rate}%** (${hits} of ${rows.length} Copilot requests).`,
      `- Cost: ${cost}.`,
      '',
      '## Misses, with what came back',
      '',
      ...(rows.filter(x => x.misses.length).map(x => `- ${x.r.after ? '(after "' + x.r.after + '") ' : ''}"${x.r.q}": ${x.misses.join('; ')}\n  - came back: \`${JSON.stringify(x.res ? { actions: x.res.actions, choices: x.res.choices, answer: x.res.answer } : null).slice(0, 600)}\``)),
      ...(rows.some(x => x.misses.length) ? [] : ['None.']),
      '',
    ];
    fs.writeFileSync(OUT, lines.join('\n'));
    console.log(`\neval:board — ${hits}/${rows.length} = ${rate}%. Report: ${path.relative(ROOT, OUT)}`);
  }
})().catch(e => { console.error(e); process.exit(1); });
