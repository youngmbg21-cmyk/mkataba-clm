/* J11 — every thinking surface WITH NO AI KEY CONFIGURED.
   Walks: chat, clause proposals (Document tab), the contract brief, renewal
   advice, the redline co-pilot band, the palette handoff, and the health
   report — checking each says so honestly and never presents a dead press.

   Run: node test/e2e-evidence/J11/run-noaikey.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../../helpers');

const OUT = path.join(__dirname, 'shots');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BODY = [
  'DISTRIBUTION AGREEMENT', '', '1. Services',
  'The Provider shall collect, transport and deliver chilled goods for Highland Corporate Ltd.', '',
  '2. Charges and payment',
  'All invoices are payable within thirty (30) days from the date of issue, being KES 4,800,000 per annum.', '',
  '3. Liability',
  'The aggregate liability of either party is limited to the charges paid in the twelve (12) months preceding the claim.', '',
  '4. Governing law', 'This Agreement is governed by the laws of Kenya and expires on 2027-06-30.',
].join('\n');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  // NO AI KEY ANYWHERE: overriding ANTHROPIC_API_KEY to '' — the AI stub
  // helpers.js starts is irrelevant here since the server is never handed a
  // key to route through.
  const h = await startHati({ ANTHROPIC_API_KEY: '' });
  await seedWorkspace(h, { contracts: [
    { ...fixtureContract('MK-NK1', 'No-Key Distribution', 'Nordfrakt Logistik AB', 'proc', 4800000, 'Under Review', BODY) },
  ] });
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

    const aiConfigured = await page.evaluate(() => !!window.state && !!state.aiConfigured);
    check('sanity: this world really has NO AI key (state.aiConfigured is false)', !aiConfigured, String(aiConfigured));

    /* ===================== 1. CHAT — no dead press ===================== */
    await page.evaluate(async () => {
      openAI();
      document.getElementById('ai-input').value = 'what does this contract say about payment?';
      await aiSubmit();
    });
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'noaikey-01-chat.png') });
    const chatState = await page.evaluate(() => {
      const feed = document.getElementById('ai-feed');
      return { text: feed ? feed.textContent.replace(/\s+/g, ' ') : '', brain: (document.getElementById('ai-brain-sub') || {}).textContent };
    });
    check('chat: a question STILL gets an answer (the local keyword engine), not a dead panel',
      chatState.text.length > 100, chatState.text.slice(-200));
    check('chat: the brain indicator honestly says "Basic mode" rather than pretending to be Copilot',
      /Basic mode/i.test(chatState.brain || ''), chatState.brain);
    await page.evaluate(() => { if (window.closeAI) closeAI(); });

    /* ===================== 2. CLAUSE PROPOSAL — Document tab ===================== */
    await page.evaluate(() => openWorkspace('MK-NK1'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => { if (window.roomGoTab) roomGoTab(state.contracts.find(x => x.id === 'MK-NK1'), 'docs'); });
    await page.waitForTimeout(900);
    const selMenuState = await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      let node; while ((node = walker.nextNode())) { if ((node.textContent || '').includes('thirty (30) days')) break; }
      if (!node) return { textFound: false };
      const r = document.createRange(); r.selectNodeContents(node);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return { textFound: true };
    });
    await page.waitForTimeout(500);
    const menuRowsNK = await page.evaluate(() => [...document.querySelectorAll('.nego-selmenu button')].map(b => b.textContent.trim()));
    check('the selection menu still offers Simplify/Ask Copilot (the door stays; the honesty is behind it)',
      selMenuState.textFound && menuRowsNK.length === 2, JSON.stringify({ selMenuState, menuRowsNK }));
    const simplifyBtn = await page.$('.nego-selmenu button:has-text("Simplify")');
    if (simplifyBtn) await simplifyBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, 'noaikey-02-doc-selection-no-key.png') });
    const afterSimplify = await page.evaluate(() => (document.getElementById('ai-feed') || {}).textContent || '');
    check('pressing Simplify with no key opens the panel and says HONESTLY it is not connected — no dead press',
      /not connected/i.test(afterSimplify), afterSimplify.slice(-260));
    await page.evaluate(() => { if (window.closeAI) closeAI(); if (window.docSelKill) docSelKill(); });

    /* ===================== 3. THE CONTRACT BRIEF — honest refusal ===================== */
    await page.evaluate(() => { if (window.roomGoTab) roomGoTab(state.contracts.find(x => x.id === 'MK-NK1'), 'terms'); });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'noaikey-03-key-terms-brief-teaser.png') });
    const briefCardText = await page.evaluate(() => (document.getElementById('brief-card') || {}).textContent || '');
    check('the brief card teaser is drawn (not missing) before anything is pressed',
      /Contract brief/.test(briefCardText), briefCardText.slice(0, 120));
    const briefPressResult = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-NK1');
      const r = await window.runContractBrief(c);
      return { r };
    });
    await page.waitForTimeout(500);
    const toastAfterBrief = await page.evaluate(() => {
      const t = document.querySelector('[class*="toast"]');
      return t ? t.textContent : '';
    });
    await page.screenshot({ path: path.join(OUT, 'noaikey-04-brief-toast.png') });
    check('pressing "Write the brief" with no key returns null (no crash, no fake brief)',
      briefPressResult.r === null, JSON.stringify(briefPressResult));
    check('and says so HONESTLY via toast ("Copilot is not connected... the brief needs it") — not a dead press',
      /not connected/i.test(toastAfterBrief || ''), JSON.stringify(toastAfterBrief));

    /* ===================== 4. RENEWAL ADVICE — same honesty rule ===================== */
    const renewalResult = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-NK1');
      if (typeof window.runRenewalAdvice !== 'function') return { skipped: true };
      const r = await window.runRenewalAdvice(c);
      return { r, cardError: c._renewalAdviceError };
    });
    check('renewal advice with no key: refused honestly, `_renewalAdviceError` carries the sentence for the card to print',
      renewalResult.skipped || (renewalResult.r === null && /not connected/i.test(renewalResult.cardError || '')),
      JSON.stringify(renewalResult));

    /* ===================== 5. THE REDLINE CO-PILOT BAND — no AI used at all ===================== */
    await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-NK1');
      negoInit(c);
      const list = negoClauseList(c);
      const at = n => (list.find(x => (x.headingText || '').indexOf(n) === 0) || {}).clauseId;
      await window.negoEditClause(c, at('2.'), '<p>All invoices are payable within sixty (60) days from the date of issue.</p>',
        { side: 'counterparty', author: 'Amina Wanjiru · Nordfrakt Logistik AB', summary: 'Payment 30 -> 60 days' });
    });
    await page.waitForTimeout(900);
    await page.evaluate(() => openRedlineWorkbench('MK-NK1'));
    await page.waitForTimeout(1500);
    const bandVisible = await page.evaluate(() => {
      const el = document.querySelector('[data-rl-plan-toggle]');
      if (!el) return { there: false };
      const r = el.getBoundingClientRect();
      return { there: r.width > 2 && r.height > 2 };
    });
    check('the redline co-pilot band draws just the same with no AI key — it reads the playbook deterministically, no model involved',
      bandVisible.there, JSON.stringify(bandVisible));
    if (bandVisible.there) {
      await page.click('[data-rl-plan-toggle]');
      await page.waitForTimeout(500);
      const rows = await page.evaluate(() => document.querySelectorAll('.rl-plan-row').length);
      await page.screenshot({ path: path.join(OUT, 'noaikey-05-band-open.png') });
      check('and it opens with real rows, exactly as with a key configured', rows > 0, `${rows} rows`);
    }

    /* ===================== 6. THE PALETTE HANDOFF — opens the panel honestly ===================== */
    await page.evaluate(() => { if (window.closeAI) closeAI(); if (window.openCommandPalette) openCommandPalette(); });
    await page.waitForTimeout(400);
    await page.type('#cp-input', 'thirty days');
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'noaikey-06-palette.png') });
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#cp-list [data-cp-i]')];
      const askRow = rows.find(r => /Ask Copilot/.test(r.textContent));
      if (askRow) askRow.click();
    });
    await page.waitForTimeout(500);
    const handoffNK = await page.evaluate(() => ({
      paletteGone: !document.getElementById('cmd-palette'),
      prefill: (document.getElementById('ai-input') || {}).value || '',
    }));
    check('the palette handoff still works with no key — opens the panel, prefills the question (the honesty lives in the panel, not the palette)',
      handoffNK.paletteGone && /thirty days/.test(handoffNK.prefill), JSON.stringify(handoffNK));
    await page.evaluate(() => { if (window.closeAI) closeAI(); });

    /* ===================== 7. HEALTH REPORT — still deterministic, no key needed ===================== */
    const [hrPage] = await Promise.all([
      ctx.waitForEvent('page'),
      page.evaluate(() => window.openHealthReport()),
    ]);
    await hrPage.waitForTimeout(2000);
    await hrPage.screenshot({ path: path.join(OUT, 'noaikey-07-health-report.png'), fullPage: true });
    const hrText = await hrPage.evaluate(() => document.body.innerText);
    check('the health report STILL works with no AI key (it is deterministic, computed, never modelled)',
      hrText.length > 200 && !/not connected|no ai|error/i.test(hrText.slice(0, 300)), hrText.slice(0, 150));
    await hrPage.close();

    check('no page errors anywhere in the no-AI-key journey', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
  }
  fs.writeFileSync(path.join(__dirname, 'run-noaikey.json'), JSON.stringify(results, null, 2));
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
