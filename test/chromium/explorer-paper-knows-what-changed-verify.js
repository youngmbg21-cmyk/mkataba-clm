/* Chromium verification: THE EXPLORER'S PAPER KNOWS WHAT CHANGED
   ============================================================
   Young asked 30 Sep 2026: "I want to be able to ask copilot in explorer
   page to summarize changes while the paper is open. It should have answers
   related to the paper as I read it with no limitations." — and picked the
   three recommendations: the original is the wording when the negotiation
   started; the record rides every question on the open paper; every change
   is in it, each labelled.

   DRIVEN ON THE REAL APP against a scripted provider. Two changes are filed
   on MK-A2 through the product's own funnel (negoEditClause), one is agreed
   (negoResolve) and one left waiting; then the paper is opened from the card
   and a question asked. What is measured is what the reader sees and what
   the provider was actually sent:
     1  the paper carries the agreed wording and not the waiting one;
     2  the ask box's hover counts the record in the cost;
     3  the question carries the record after the wording — the original
        wording, both changes, their status — under its own rule;
     4  a quote on the paper takes a pin; the OLD wording, quoted back, takes
        none (it is not on the paper to light).
   2–4 are red at the parent (2654ad5); 1 is a [wall] (the paper already
   followed the agreed wording).

   Screenshots go to test/chromium/shots/explorer-paper-knows-what-changed/.
   Run: node test/chromium/explorer-paper-knows-what-changed-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'explorer-paper-knows-what-changed');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const deliver = (id, answer, citations) => ({ content: [{ type: 'tool_use', id, name: 'deliver_answer', input: { answer, citations } }] });
const AGREED = 'Payment falls due fourteen (14) days after the invoice is received, without set-off.';
const WAITING = 'Either party may end this agreement on ninety (90) days written notice to the other.';

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
  const settled = () => page.waitForFunction(() => !window.intel || !intel.busy, null, { timeout: 20000 });

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => typeof getContract === 'function' && !!getContract('MK-A2'), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(600);

    /* ---- STAGE: two changes through the funnel, one agreed ---- */
    const staged = await page.evaluate(async ({ AGREED, WAITING }) => {
      const c = getContract('MK-A2');
      if (!c) return { ok: false, why: 'no MK-A2', ids: (state.contracts || []).map(x => x.id).slice(0, 8), view: state.view };
      if (c._light && !c._loaded) await ensureFull(c);
      const list = negoClauseList(c).filter(x => x.clauseId && (x.text || '').length > 40);
      if (list.length < 2) return { ok: false, why: `only ${list.length} clauses` };
      const a = list[0], b = list[1];
      const one = await negoEditClause(c, a.clauseId, `<p>${AGREED}</p>`);
      const two = await negoEditClause(c, b.clauseId, `<p>${WAITING}</p>`);
      if (!one || !two) return { ok: false, why: 'the funnel refused', refusal: window.negoLastRefusal || '' };
      const ok = !!negoResolve(c, one.id, 'accepted');
      persist(c); await flushSaves();
      return { ok, one: one.id, two: two.id, origA: (a.text || '').replace(/\s+/g, ' ').trim(), origB: (b.text || '').replace(/\s+/g, ' ').trim() };
    }, { AGREED, WAITING });
    check('stage: two changes filed through the funnel, the first agreed', staged.ok, JSON.stringify(staged).slice(0, 200));
    if (!staged.ok) throw new Error('stage failed');

    await page.evaluate(() => { intel.tab = 'map'; intel.history = []; intel.paper = null; intel.lenses = []; intel.groups = null; setView('intel'); });
    await page.waitForFunction(() => !!document.getElementById('ig-paper'), null, { timeout: 20000 });
    await page.evaluate(() => igExplain('MK-A2'));
    await settled();
    await page.waitForSelector('#ig-dock [data-ig-analyze]', { timeout: 20000 });
    await page.click('#ig-dock [data-ig-analyze]');
    await page.waitForFunction(() => { const cv = document.getElementById('ig-canvas'); return cv && cv.textContent.trim().length > 200; }, null, { timeout: 20000 });

    /* ================= 1. THE PAPER IS THE AGREED WORDING ================ */
    const paper = await page.evaluate(({ AGREED, WAITING }) => {
      const t = document.getElementById('ig-canvas').textContent.replace(/\s+/g, ' ');
      return { agreed: t.includes(AGREED), waiting: t.includes(WAITING), title: document.getElementById('igd-input').title };
    }, { AGREED, WAITING });
    check('1 [wall] the paper carries the agreed change and not the waiting one', paper.agreed && !paper.waiting, JSON.stringify(paper));

    /* ================= 2. THE COST SAYS THE RECORD GOES TOO ============== */
    check('2 the ask box\'s hover counts the record: "... and the record of its 2 changes (N words)"',
      /MK-A2/.test(paper.title) && /\b2\b/.test(paper.title) && /changes/.test(paper.title), paper.title);
    await page.screenshot({ path: path.join(OUT, '01-paper.png') });

    /* ================= 3. THE QUESTION CARRIES THE RECORD ================ */
    const oldQuote = staged.origA.slice(0, 160);
    ai.script(deliver('tu_ch', 'Two changes were proposed. The payment clause was agreed; the notice clause is still waiting.',
      [{ id: 'MK-A2', quote: AGREED }, { id: 'MK-A2', quote: oldQuote }]));
    await page.fill('#igd-input', 'Summarise the redline changes from the original paper to the current paper');
    await page.press('#igd-input', 'Enter');
    await settled();
    await page.waitForFunction(() => intel.history.some(m => m.role === 'assistant' && m.paperId), null, { timeout: 20000 }).catch(() => {});
    const call = ai.calls[ai.calls.length - 1] || { body: { messages: [] } };
    const msgs = (call.body && call.body.messages) || [];
    const lastMsg = msgs[msgs.length - 1] || {};
    const content = typeof lastMsg.content === 'string' ? lastMsg.content : JSON.stringify(lastMsg.content || '');
    const w = content.indexOf('=== THE WORDING OF MK-A2'), r = content.indexOf('=== THE NEGOTIATION RECORD OF MK-A2');
    check('3a the question went out with the wording AND, after it, the negotiation record', w > 0 && r > w, `wording at ${w}, record at ${r}`);
    check('3b the record carries each clause\'s wording when the negotiation started',
      content.includes(`Wording when the negotiation started: "`) && content.includes(staged.origA.slice(0, 60)) && content.includes(staged.origB.slice(0, 60)));
    check('3c both changes are in it, with their status: one agreed and on the paper, one waiting and not',
      content.includes(`${staged.one} (round 1)`) && content.includes(`${staged.two} (round 1)`)
      && /Status: AGREED, on the paper now/.test(content) && /Status: WAITING FOR AN ANSWER, not on the paper/.test(content)
      && content.includes(WAITING));
    check('3d under its own rule: answer from both, completely, and cite only the paper',
      /THE NEGOTIATION RECORD after the wording/.test(content) && /never a sample/.test(content) && /a citation quote comes from THE WORDING only/.test(content));

    /* ================= 4. A PIN LIGHTS ONLY WHAT IS ON THE PAPER ========= */
    const pins = await page.evaluate(() => {
      const turn = intel.history.filter(m => m.role === 'assistant').pop() || {};
      return { quotes: (turn.quotes || []).map(q => q.text), pins: intel.paper.pins.length,
        marks: document.querySelectorAll('#ig-canvas span.ig-mark').length,
        chips: document.querySelectorAll('#ig-dock .ig-cite[data-ig-cite]').length };
    });
    check('4a the agreed wording, quoted back, takes a pin and lights on the paper',
      pins.quotes.includes(AGREED) && pins.pins >= 1 && pins.marks >= 1, JSON.stringify(pins));
    check('4b the OLD wording, quoted back, takes no chip and no pin — it is not on the paper to light',
      !pins.quotes.some(q => q === oldQuote) && pins.chips === pins.quotes.length, JSON.stringify(pins));
    await page.screenshot({ path: path.join(OUT, '02-answer.png') });

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    await ai.stop().catch(() => {});
  }
  const failed = results.filter(x => !x.pass).length;
  console.log(`\n${results.length - failed} of ${results.length} PASS`);
  process.exit(failed ? 1 : 0);
})();
