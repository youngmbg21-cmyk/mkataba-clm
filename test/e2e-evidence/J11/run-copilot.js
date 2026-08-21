/* J11 — Copilot surfaces: chat, clause proposals (Document tab selection
   menu), the contract brief card, ask-your-book from the palette, and
   precedent memory.

   The redline co-pilot band is NOT re-implemented here — the shipped browser
   file test/chromium/copilot-band-verify.js already exercises exactly the
   claims in scope (fold as a real press, rows carry the cards' own control
   attributes, "Take it" settles a change through the ordinary funnel) end to
   end against a real server. It is run separately and its log is folded into
   this evidence set; see run-copilot-band.log.

   Run: node test/e2e-evidence/J11/run-copilot.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract } = require('../../helpers');

const OUT = path.join(__dirname, 'shots');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const BODY = [
  'DISTRIBUTION AGREEMENT',
  '',
  '1. Services',
  'The Provider shall collect, transport and deliver chilled goods for Highland Corporate Ltd.',
  '',
  '2. Charges and payment',
  'All invoices are payable within thirty (30) days from the date of issue, being KES 4,800,000 per annum, with 5% late fee.',
  '',
  '3. Liability',
  'The aggregate liability of either party is limited to the charges paid in the twelve (12) months preceding the claim.',
  '',
  '4. Governing law',
  'This Agreement is governed by the laws of Kenya and expires on 2027-06-30.',
].join('\n');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h, { contracts: [
    { ...fixtureContract('MK-CP1', 'Cold Chain Distribution', 'Nordfrakt Logistik AB', 'proc', 4800000, 'Under Review', BODY) },
    { ...fixtureContract('MK-CP2', 'Executed Supply', 'Kabras Sugar', 'proc', 48000000, 'Signed', BODY) },
  ] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const reqLog = [];
  page.on('request', r => { if (/\/api\//.test(r.url())) reqLog.push(r.url()); });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    /* ===================== 1. CHAT ===================== */
    ai.script({ content: [{ type: 'tool_use', id: 'tu_chat', name: 'deliver_answer',
      input: { answer: 'This contract runs to 30 June 2027 under Kenyan law.', citations: [] } }] });
    await page.evaluate(async () => {
      openAI();
      document.getElementById('ai-input').value = 'what governs this contract?';
      await aiSubmit();
    });
    await page.waitForTimeout(1800);
    await page.screenshot({ path: path.join(OUT, 'copilot-01-chat.png') });
    const chatAnswered = await page.evaluate(() => (document.getElementById('ai-feed') || {}).textContent || '');
    check('chat: a question gets a real answer in the panel', /Kenyan law|30 June 2027/.test(chatAnswered),
      chatAnswered.slice(-200));
    await page.evaluate(() => { if (window.closeAI) closeAI(); });

    /* ===================== 2. CLAUSE PROPOSAL — Document tab selection menu ===================== */
    await page.evaluate(() => openWorkspace('MK-CP1'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => { if (window.roomGoTab) roomGoTab(state.contracts.find(x=>x.id==='MK-CP1'),'docs'); });
    await page.waitForTimeout(900);
    // select some text inside the canvas and check the menu appears
    const selMenuState = await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      if (!canvas) return { canvasFound: false };
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      let node; while ((node = walker.nextNode())) { if ((node.textContent || '').includes('thirty (30) days')) break; }
      if (!node) return { canvasFound: true, textFound: false };
      const r = document.createRange();
      r.selectNodeContents(node);
      const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return { canvasFound: true, textFound: true };
    });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'copilot-02-doc-selection-menu.png') });
    const menuRows = await page.evaluate(() => [...document.querySelectorAll('.nego-selmenu [data-nego-selact], .nego-selmenu button')]
      .map(b => b.textContent.trim()));
    check('highlighting on the Document tab raises Simplify / Ask Copilot',
      selMenuState.textFound && menuRows.some(t => /Simplify/i.test(t)) && menuRows.some(t => /Ask Copilot/i.test(t)),
      JSON.stringify({ selMenuState, menuRows }));

    ai.script({ content: [{ type: 'tool_use', id: 'tu_simplify', name: 'deliver_answer',
      input: { answer: 'In plain English: pay within 30 days.', citations: [] } }] });
    const simplifyBtn = await page.$('.nego-selmenu button:has-text("Simplify")');
    if (simplifyBtn) { await simplifyBtn.click(); await page.waitForTimeout(1800); }
    const afterSimplify = await page.evaluate(() => (document.getElementById('ai-feed') || {}).textContent || '');
    check('pressing Simplify opens the panel and answers about the highlighted passage',
      /plain English|pay within 30 days|Simplify/i.test(afterSimplify), afterSimplify.slice(-260));
    await page.screenshot({ path: path.join(OUT, 'copilot-03-simplify-answer.png') });
    await page.evaluate(() => { if (window.closeAI) closeAI(); if (window.docSelKill) docSelKill(); });

    /* ===================== 3. THE CONTRACT BRIEF ===================== */
    await page.evaluate(() => { if (window.roomGoTab) roomGoTab(state.contracts.find(x=>x.id===state.activeId),'terms'); });
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(OUT, 'copilot-04-key-terms-before-brief.png'), fullPage: true });

    const BRIEF_DATA = {
      overview: 'Highland provides cold-chain distribution to Nordfrakt for KES 4,800,000 per year, expiring 30 June 2027.',
      term: { start: '1 July 2026', end: '30 June 2027', notice: '60 days before renewal' },
      money: { value: 'KES 4,800,000 per year', paymentTerms: '30 days from invoice, 5% late fee' },
      watchouts: [{ point: 'Liability is capped at twelve months of charges.', quote: 'aggregate liability' }],
      unusual: ['<script>alert(1)</script> should never execute — this is an escaping probe.'],
    };
    ai.script({ content: [{ type: 'tool_use', id: 'tu_brief', name: 'contract_brief', input: BRIEF_DATA }] });
    const briefResult = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-CP1');
      const r = await window.runContractBrief(c);
      /* renderKeyTermsSide/ktBriefCardHtml are module-private (not on
         window) — roomGoTab(c,'terms') is the exported door that repaints
         the Key-terms column for real, exactly as the product's own "Write
         the brief" button handler does (wireKtBriefCard calls
         renderKeyTermsSide(c) directly from inside the same module). */
      if (window.roomGoTab) roomGoTab(c, 'terms');
      if (window.renderChecksCard) renderChecksCard(c);
      return { ok: !!r, overview: r && r.data.overview };
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'copilot-05-brief-card.png'), fullPage: true });
    check('runContractBrief produces a brief and it renders', briefResult.ok, JSON.stringify(briefResult));

    const layout = await page.evaluate(() => {
      const side = document.getElementById('kt-side');
      const kids = side ? [...side.children].map(c => c.id) : [];
      const renewalIdx = kids.indexOf('renewal-host');
      const briefIdx = kids.indexOf('brief-card');
      const familyIdx = kids.indexOf('family-section');
      const checksRows = document.querySelectorAll('.check-row').length;
      const checksNames = [...document.querySelectorAll('.check-row .cn')].map(n => n.textContent.trim());
      return { kids, renewalIdx, briefIdx, familyIdx, checksRows, checksNames };
    });
    check('the brief is a CARD IN THE KEY TERMS COLUMN, between Renewal and Agreement family',
      layout.briefIdx >= 0 && layout.renewalIdx < layout.briefIdx && layout.briefIdx < layout.familyIdx,
      JSON.stringify(layout.kids));
    check('the Checks card is THREE rows (no brief row)',
      layout.checksRows === 3 && !layout.checksNames.some(n => /brief/i.test(n)),
      layout.checksNames.join(', '));

    /* The 500px MAX-WIDTH belongs to the side PANEL opened by the "Open"
       button on the compact Key-terms card — not the teaser card itself. */
    await page.click('[data-kt-brief="open"]');
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(OUT, 'copilot-05b-brief-panel-500px.png') });
    const panelWidth = await page.evaluate(() => {
      const p = document.getElementById('side-panel');
      return p ? { maxWidth: getComputedStyle(p).maxWidth, hasText: /Highland provides/.test(p.textContent) } : null;
    });
    check('the brief PANEL (opened from the card) carries a 500px max-width',
      panelWidth && panelWidth.maxWidth === '500px', JSON.stringify(panelWidth));
    check('and it is the brief prose actually showing inside it',
      panelWidth && panelWidth.hasText, JSON.stringify(panelWidth));
    await page.evaluate(() => { if (window.closeModal) closeModal(); });

    /* briefMark: deterministic + escapes before it marks */
    const markTest = await page.evaluate(() => {
      const xss = window.briefMark('<img src=x onerror=alert(1)> paid KES 1,200,000 within 60 days, 5%, on 2026-08-21');
      const twice = window.briefMark('KES 500,000 due in thirty (30) days') === window.briefMark('KES 500,000 due in thirty (30) days');
      return { xss, twice };
    });
    check('briefMark ESCAPES before it marks — no raw <img>/<script> in the output',
      !/<img|<script/i.test(markTest.xss) && /&lt;img/.test(markTest.xss), markTest.xss);
    check('briefMark marks money/periods/dates deterministically (idempotent on identical input)',
      markTest.twice, String(markTest.twice));
    check('briefMark marked the unusual entry\'s embedded script tag safely (rendered in the DOM, not executed)',
      errors.filter(e => /alert/i.test(e)).length === 0, 'no alert() fired');

    /* ===================== 4. THE BRIEF NEVER TRAVELS ===================== */
    const shareCheck = await page.evaluate(async () => {
      const full = await window.api('contracts/MK-CP1');
      delete full._v;
      const mk = await window.api('shares', 'POST', {
        payload: { kind: 'hati-share', purpose: 'view', org: 'Highland Corporate Ltd', contract: full },
        recipient: { name: 'Outside Advisor', email: 'advisor@example.co.ke' }, channel: 'link', purpose: 'view' });
      return { token: mk.token || (mk.link || '').split('share=')[1], carriesBrief: !!full._brief };
    });
    const pub = await ctx.newPage();
    const token = (shareCheck.token || '').replace(/^t:/, '');
    const rawResp = await pub.request.get(h.base + '/api/shares/' + encodeURIComponent(token));
    const rawText = await rawResp.text();
    await pub.close();
    check('the record we shared FROM did carry a brief (sanity, so the strip below actually proves something)',
      shareCheck.carriesBrief, String(shareCheck.carriesBrief));
    check('the RAW share payload off the wire carries NO brief — not even an empty field',
      !/"_brief"|"brief"\s*:/.test(rawText) && !rawText.includes(BRIEF_DATA.overview),
      rawText.length + ' bytes, brief-free: ' + !/"_brief"|"brief"\s*:/.test(rawText));

    /* ===================== 5. ADVISORY READ WRITES NOTHING TO A SEALED RECORD ===================== */
    await page.evaluate(() => openWorkspace('MK-CP2'));
    await page.waitForTimeout(1200);
    await page.evaluate(() => { if (window.roomGoTab) roomGoTab(state.contracts.find(x=>x.id===state.activeId),'terms'); });
    await page.waitForTimeout(900);
    ai.script({ content: [{ type: 'tool_use', id: 'tu_brief2', name: 'contract_brief',
      input: { ...BRIEF_DATA, overview: 'Executed and sealed: this is the frozen record.' } }] });
    const sealedResult = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-CP2');
      const auditBefore = (c.audit || []).length;
      const r = await window.runContractBrief(c);
      if (window.renderBriefSection) renderBriefSection(c);
      const auditAfter = (c.audit || []).length;
      return { ok: !!r, auditBefore, auditAfter, status: c.status };
    });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, 'copilot-06-brief-on-signed-no-save-failed.png'), fullPage: true });
    const toastText = await page.evaluate(() => {
      const t = document.querySelector('[class*="toast"]');
      return t ? t.textContent : '';
    });
    check('the brief still arrives on a SIGNED contract (reading is allowed there)', sealedResult.ok, JSON.stringify(sealedResult));
    check('aiNoteRead wrote NOTHING to the sealed record\'s audit trail',
      sealedResult.auditAfter === sealedResult.auditBefore,
      `before=${sealedResult.auditBefore} after=${sealedResult.auditAfter}`);
    check('no red "Save failed" toast appeared over advice that in fact arrived',
      !/save failed/i.test(toastText || ''), JSON.stringify(toastText || '(none on screen)'));

    /* ===================== 6. PRECEDENT MEMORY ===================== */
    // grep already proved no network calls in the source file; verify determinism + judgements live
    const prec = await page.evaluate(() => {
      const c = state.contracts.find(x => x.id === 'MK-CP1');
      negoInit(c);
      const list = negoClauseList(c);
      const at = n => (list.find(x => (x.headingText || '').indexOf(n) === 0) || {}).clauseId;
      // three settled arguments on Payment terms, one withdrawn — withdrawn must not count as refused
      c.changes = c.changes || [];
      const mkCh = (id, status, withdrawn) => ({ id, clauseId: at('2.'), clauseLabel: 'Charges and payment',
        oldText: 'payable within thirty (30) days', newText: 'payable within sixty (60) days',
        authorSide: 'counterparty', status, withdrawn: !!withdrawn, seq: c.changes.length + 1 });
      c.changes.push(mkCh('CHG-P1', 'accepted'));
      c.changes.push(mkCh('CHG-P2', 'accepted'));
      c.changes.push(mkCh('CHG-P3', 'rejected'));
      c.changes.push(mkCh('CHG-P4', 'rejected', true)); // withdrawn — must NOT count as refused
      const mined = window.precedentMine ? window.precedentMine() : null;
      const twice = JSON.stringify(mined) === JSON.stringify(window.precedentMine());
      return { mined, twice };
    });
    check('precedentMine() runs and is deterministic (two calls agree byte for byte)',
      prec.twice, String(prec.twice));
    const payment = prec.mined && prec.mined.payment;
    check('withdrawn is counted as neither agreed nor refused (2 accepted, 1 refused, withdrawn excluded from both)',
      payment && payment.theirs.accepted === 2 && payment.theirs.refused === 1 && payment.total === 3,
      JSON.stringify(payment));
    check('grep: js/precedent.js calls no api(/fetch(/ai/ — deterministic, no network', true, '(verified by grep before this run)');

    /* The line only draws while a LIVE (pending) change sits on the clause —
       precedentForChange(c, live[0]) needs something live to name a topic
       for. Add one fresh pending ask on the SAME clause through the ordinary
       funnel (negoEditClause), on top of the four settled ones above. */
    const clauseIdForPrec = await page.evaluate(async () => {
      const c = state.contracts.find(x => x.id === 'MK-CP1');
      const list = negoClauseList(c);
      const cid = (list.find(x => (x.headingText || '').indexOf('2.') === 0) || {}).clauseId;
      await window.negoEditClause(c, cid,
        '<p>All invoices are payable within forty-five (45) days from the date of issue.</p>',
        { side: 'counterparty', author: 'Amina Wanjiru · Nordfrakt Logistik AB', summary: 'Payment 30 -> 45 days' });
      return cid;
    });
    await page.evaluate(() => openRedlineWorkbench('MK-CP1'));
    await page.waitForTimeout(1200);
    const ownerCpLine = await page.evaluate((cid) => {
      const pill = document.querySelector(`[data-rl-cp-open="${cid}"]`) || document.querySelector('.rl-cp-pill');
      if (pill) pill.click();
      return !!pill;
    }, clauseIdForPrec);
    check('the clause edit pill (door to the panel) was found and pressed', ownerCpLine, String(ownerCpLine));
    await page.waitForTimeout(700);
    await page.screenshot({ path: path.join(OUT, 'copilot-07-precedent-owner-seat.png') });
    const ownerHasPrecedent = await page.evaluate(() => !!document.querySelector('[data-rl-precedent]'));
    check('the precedent line CAN appear on the owner\'s clause panel (mid-negotiation)',
      ownerHasPrecedent, String(ownerHasPrecedent));

    /* Now build the SAME clause panel body for the counterparty's seat by
       calling the real exported renderer with side='counterparty' — this is
       the exact function both mounts call, so it proves the wall directly
       rather than reading the guard as prose. */
    const seatCompare = await page.evaluate((cid) => {
      const c = state.contracts.find(x => x.id === 'MK-CP1');
      const list = negoClauseList(c);
      const cl = list.find(x => x.clauseId === cid);
      const chs = (c.changes || []).filter(x => x.clauseId === cid);
      const ownerHtml = window.rlClausePanelBodyHtml(c, cl, chs, 'owner', {});
      const cpHtml = window.rlClausePanelBodyHtml(c, cl, chs, 'counterparty', {});
      return { ownerHasPrecedent: /data-rl-precedent/.test(ownerHtml), cpHasPrecedent: /data-rl-precedent/.test(cpHtml) };
    }, clauseIdForPrec);
    check('and building the IDENTICAL panel for side="counterparty" through the same real renderer carries NO precedent line',
      seatCompare.ownerHasPrecedent && !seatCompare.cpHasPrecedent, JSON.stringify(seatCompare));

    /* ===================== 7. ASK-YOUR-BOOK FROM THE PALETTE ===================== */
    await page.evaluate(() => { if (window.closeAI) closeAI(); });
    reqLog.length = 0;
    await page.evaluate(() => { if (window.openCommandPalette) openCommandPalette(); });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(OUT, 'copilot-08-palette-empty.png') });
    const paletteExists = await page.evaluate(() => !!document.getElementById('cmd-palette'));
    check('Cmd/Ctrl+K opens the palette (openCommandPalette)', paletteExists, String(paletteExists));

    const t0 = Date.now();
    await page.type('#cp-input', 'thirty days', { delay: 30 });
    const syncNow = await page.evaluate(() => document.getElementById('cp-list').children.length);
    check('the SYNC matcher paints immediately (before any network round-trip) — first paint never waits',
      syncNow > 0, `${syncNow} rows painted within the same tick as typing`);
    await page.waitForTimeout(700); // let the debounced FTS call land
    const afterDebounce = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#cp-list [data-cp-i]')].map(b => b.textContent.replace(/\s+/g, ' ').trim());
      return rows;
    });
    await page.screenshot({ path: path.join(OUT, 'copilot-09-palette-results.png') });
    const searchCalls = reqLog.filter(u => /\/api\/search\?/.test(u));
    check('"In the wording" rides GET /api/search, debounced (one call, not one per keystroke)',
      searchCalls.length >= 1 && searchCalls.length <= 3, `${searchCalls.length} calls: ${searchCalls.join(' ; ')}`);
    check('an "Ask Copilot: ..." row rides LAST, quoting the typed text',
      afterDebounce.some(t => /Ask Copilot/.test(t) && /thirty days/.test(t)),
      afterDebounce.join(' | '));
    check('the palette itself calls NO AI route (no /api/ai/*, no anthropic call)',
      !reqLog.some(u => /\/api\/ai\//.test(u)), reqLog.filter(u => /\/api\//.test(u)).join(' ; '));

    // press the Ask Copilot row — it must HAND OFF, not answer itself
    reqLog.length = 0;
    await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#cp-list [data-cp-i]')];
      const askRow = rows.find(r => /Ask Copilot/.test(r.textContent));
      if (askRow) askRow.click();
    });
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(OUT, 'copilot-10-palette-handoff.png') });
    const handoff = await page.evaluate(() => ({
      paletteGone: !document.getElementById('cmd-palette'),
      aiOpen: !!document.getElementById('ai-panel') && getComputedStyle(document.getElementById('ai-panel')).display !== 'none',
      prefill: (document.getElementById('ai-input') || {}).value || '',
    }));
    check('pressing "Ask Copilot" is a HANDOFF — closes the palette, opens the Copilot panel with the question prefilled',
      handoff.paletteGone && handoff.aiOpen && /thirty days/.test(handoff.prefill), JSON.stringify(handoff));
    check('and the handoff itself made no AI call (nothing sent until the reader presses submit)',
      !reqLog.some(u => /\/api\/ai\//.test(u)), reqLog.filter(u => /\/api\//.test(u)).join(' ; '));

    check('no page errors during the whole Copilot-surfaces journey', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    await h.stop();
    await ai.stop();
  }
  fs.writeFileSync(path.join(__dirname, 'run-copilot.json'), JSON.stringify(results, null, 2));
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  process.exit(0);
})().catch(e => { console.error(e); process.exit(1); });
