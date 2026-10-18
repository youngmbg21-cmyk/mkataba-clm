/* WAITING ON YOU IS NOT IN JAMBO'S WORK — measured in a real browser.
 *
 * NARROWED 15 Oct 2026: the owner picked "Jambo's note" by name and the list
 * of what is owed by name is back on the Board as ITS OWN card, first above
 * Jambo's work (test/chromium/needs-you-card-verify.js drives it). What this
 * file still holds is the half of the 4 Oct ruling that stands: Jambo's work
 * card draws none of it, and the 4 Oct merged card's rows and reading
 * ([data-hb-need], .hb-need, hbNeedsData) stay gone.
 *
 * This stage used to drive the opposite, and keeps its name because it guards
 * the same ruling, reversed. Young picked **One list, one place** by name on
 * the morning of 4 Oct 2026; the same day, having looked at it:
 *
 *   *"Remove waiting on you from the home page permanently. It is not
 *   needed."*
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. Home's card is PREPARED BY COPILOT again, and draws no waiting rows —
 *      proved on a book that really does have work waiting on this reader, so
 *      an empty desk cannot pass this by accident;
 *   2. nothing on the board carries the waiting row's door;
 *   3. the card still works: Copilot's own rows, closed and brought back with
 *      a count that is Copilot's alone;
 *   4. NOTHING WAS LOST — the side panel beside the very contract that raised
 *      the prompt still lists it, and its button still opens it;
 *   5. the board still costs no model.
 *
 * Every driven half is guarded, so a missing feature REPORTS rather than
 * times out (the house rule). */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'home-one-list');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const day = n => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
function mk(id, name, cp, folder, value, status, extra) {
  return { id, name, counterparty: cp, folder, value, valueType: 'standard', status, template: 'RM',
    lastAction: '10 Jul 2026', expiry: '2027-06-30', hash: null, signedAt: null,
    fields: { value: String(value) }, metadata: { value, currency: 'KES' },
    comments: [], audit: [{ at: new Date().toISOString(), user: 'System', action: 'Created', detail: 'fixture' }],
    signatures: [], obligations: [], rounds: [], ...extra };
}
/* TWO RENEWALS THIS READER OWNS. The server stamps the person who seeded the
   book as every contract's owner, which is the reader here, so ownership is
   not something this stage has to arrange. With no notice period the decision
   date IS the expiry (renewalDecisionDate), so forty days out is a decision
   due and not yet urgent while twelve days out is urgent — which is what the
   urgent row has to prove it can tell apart. TWO of them, because one alone
   would not have caught the fault this stage found: a single renewal was
   being struck out of the list for a desk card Home no longer draws.
   Day-relative, so no answer depends on the day it runs. */
const CONTRACTS = [
  mk('MK-W1', 'Packaging Supply', 'Kenya Cartons', 'proc', 12000000, 'Signed',
    { expiry: day(40), metadata: { value: 12000000, currency: 'KES', category: 'supplier' } }),
  mk('MK-W2', 'Fleet Servicing', 'Coast Motors', 'proc', 6000000, 'Signed',
    { expiry: day(12), metadata: { value: 6000000, currency: 'KES', category: 'supplier' } }),
  mk('MK-W4', 'Hotel Supply', 'Serena Group', 'sales', 9000000, 'Under Review', {}),
  ...FIXTURES,
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { contracts: CONTRACTS, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(e.message));
    /* EVERY AI ROUTE THIS PAGE COULD REACH, counted. The card's words must be
       worked out, never asked for — that is what makes them free and true. */
    /* The GENERATIVE routes only: /api/ai/usage and /api/ai/config are the
       shell asking what the key and the budget are, and they are asked on
       every page whatever is drawn. What must never happen is this card
       paying a model to write a sentence. */
    const aiCalls = [];
    await page.route('**/api/ai/**', r => {
      const u = r.request().url();
      if (!/\/api\/ai\/(usage|config|spend)\b/.test(u)) aiCalls.push(u);
      return r.continue();
    });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    await page.evaluate(() => setView('dashboard'));
    /* RE-POINTED 11 Oct 2026 (owner: "only 5 cards") */
    const landed = await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length === 5);
    ok('0 Home lands on the board', landed);

    /* ===== 1. JAMBO'S WORK IS COPILOT'S, AND NOTHING IS WAITING ON IT =====
       RE-POINTED 18 Oct 2026 (round 17 as drawn, the owner's yes): Jambo's
       work LEFT THE BOARD for the Counter, where it is the first row of Needs
       you and opens in place on its pieces. The ruling that stands is the
       same: Jambo's work draws no waiting row, and the merged card stays gone. */
    const aiAtCard = aiCalls.length;
    const owed = await page.evaluate(() => {
      try { return (hmDecisionItems(null, []) || []).map(x => ({ kind: x.kind, cid: x.cid })); }
      catch (_){ return null; }
    });
    const offBoard = await page.evaluate(() => ({ card: !!document.getElementById('hm-agents'), needs: document.querySelectorAll('#hb-board [data-hb-need], #hb-board .hb-need, #hb-board .hb-ny').length }));
    ok('1a Jambo\'s work is not on the Board, and nor is a waiting row', !offBoard.card && offBoard.needs === 0, JSON.stringify(offBoard));
    ok('1b the reading still finds work waiting on this reader',
      !!owed && owed.filter(x => x.kind === 'renewal').length >= 2, JSON.stringify(owed));
    await page.evaluate(() => setView('counter'));
    await until(page, () => !!document.querySelector('#cn-needs [data-cn-jw]'));
    if (await page.$('#cn-needs [data-cn-jw][aria-expanded="false"]')) await page.click('#cn-needs [data-cn-jw]');
    await page.waitForTimeout(400);
    const A = await page.evaluate(() => {
      const row = document.querySelector('#cn-needs .cn-jw');
      return { title: row ? ((row.querySelector('b') || {}).textContent || '').trim() : null,
        pieces: document.querySelectorAll('#cn-needs [data-cn-ag-item]').length,
        waitingInWork: document.querySelectorAll('#cn-jw-list [data-cn-need], #cn-jw-list [data-hb-need]').length,
        n: Number((((row && row.querySelector('.cn-n')) || {}).textContent || '').replace(/[^\d]/g, '') || 0),
        ready: hbAgentsData(null).ready, reading: typeof window.hbNeedsData };
    });
    ok('1c it is called Jambo\'s work, on the Counter', !!A.title && /jambo/i.test(A.title), JSON.stringify(A.title));
    ok('1d not one waiting row is drawn inside it', A.waitingInWork === 0, String(A.waitingInWork));
    ok('1e and the merged card\'s reading is not published', A.reading === 'undefined', A.reading);

    /* ===== 2. IT STILL DOES ITS OWN JOB ===== */
    ok('2a Copilot\'s own pieces are drawn', A.pieces > 0, String(A.pieces));
    ok('2c whose count is Copilot\'s work alone', A.n === A.ready && A.ready > 0, JSON.stringify(A));
    await page.evaluate(() => { hbS().face = 'board'; hbSave(); setView('dashboard'); });
    await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length === 5);

    /* ===== 3. THE X IS IN THE CARD'S RIGHT CORNER =====
       EVERY CARD THAT CLOSES, not whichever one happened to be open: a dig-in
       card (the one that was wrong — its controls huddled against the title
       with the card's right half empty) and a panel are opened first, or this
       check measures one card and reports a rule. */
    await page.evaluate(() => { try { hbDig('f:live'); } catch (_){} });
    await until(page, () => !!document.querySelector('.hb-dig .hb-x'));
    await page.evaluate(() => { try { hbAddPanel('obl'); hbPaintBoard(); } catch (_){} });
    await until(page, () => !!document.querySelector('.hb-panel .hb-x'));
    const corners = await page.evaluate(() => {
      const out = [];
      for (const h of document.querySelectorAll('#hb-board .hb-ch')){
        const x = h.querySelector('.hb-x'); if (!x) continue;
        const hb = h.getBoundingClientRect(), xb = x.getBoundingClientRect();
        const card = h.closest('.hb-card');
        out.push({ card: card ? (card.id || card.className) : '?',
          gap: +(hb.right - xb.right).toFixed(1),
          last: h.lastElementChild === x });
      }
      return out;
    });
    ok('3a every card that closes puts its x at the right edge, last in the row',
      /* RE-POINTED 11 Oct 2026 (the Board as drawn): a kept chart is removed from
         its ⋯ ("Remove from the board"), so the cards with a corner × are
         Copilot's work and the opened card */
      /* …and since 18 Oct 2026 (round 17) Jambo's work is the Counter's, so the opened card */
      corners.length >= 1 && corners.every(c => c.last && c.gap <= 14), JSON.stringify(corners));
    await page.evaluate(() => { try { hbDig(null); } catch (_){} const s = hbS(); s.path = []; s.panels = []; hbSave(); hbPaintBoard(); });
    await until(page, () => !document.querySelector('.hb-dig'));

    /* ===== 4. NOTHING WAS LOST: THE CHECKLIST STILL SAYS IT ===== */
    const cid = (owed.find(x => x.kind === 'renewal') || {}).cid;
    /* THE CHECKLIST IS BUILT FROM needsYouOf, so the honest question is
       whether that reading still answers for this contract AND whether the
       panel's builder still draws what it answers. Both, or neither means
       anything: a reading nothing draws is the thing this change removed from
       Home, and a builder reading nothing is an empty panel that passes. */
    const chk = await page.evaluate(id => {
      const c = state.contracts.find(x => x.id === id);
      let says = null, html = '';
      try { says = (needsYouOf(c) || []).map(r => r.kind); } catch (e) { return { err: e.message }; }
      try { html = (typeof insNeedsHtml === 'function') ? insNeedsHtml(c) : null; } catch (e) { html = null; }
      return { says, drew: html == null ? null : (html.match(/data-ins-need="([a-z]+)"/g) || []).length };
    }, cid);
    ok('4a the side panel beside that contract still lists what is waiting on you',
      !!chk.says && chk.says.length > 0 && chk.drew != null && chk.drew >= chk.says.length,
      JSON.stringify(chk));

    /* ===== 5. AND THE BOARD STILL COSTS NO MODEL ===== */
    ok('5a drawing the board called no AI route at all', aiAtCard === 0,
      aiCalls.slice(0, aiAtCard).join(', ') || 'none');
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => !!document.getElementById('hb-board'));

    await page.screenshot({ path: path.join(OUT, '1-prepared-by-copilot.png'), fullPage: false });
    ok('9 no page errors', errs.length === 0, errs.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    ok('the stage ran to the end', false, e && e.message);
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
