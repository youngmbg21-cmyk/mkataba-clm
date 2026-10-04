/* WAITING ON YOU IS NOT ON HOME — measured in a real browser.
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
    const landed = await until(page, () => document.querySelectorAll('#hb-board .hb-fig').length === 6);
    ok('0 Home lands on the board', landed);

    /* ===== 1. THE CARD IS COPILOT'S, AND NOTHING IS WAITING ON IT ===== */
    const card = await until(page, () => !!document.getElementById('hm-agents'));
    ok('1a the card is on the board', card);
    const aiAtCard = aiCalls.length;
    /* THE BOOK REALLY DOES OWE THIS READER SOMETHING. Two renewals are due on
       it (one urgent), so a card drawing nothing is the ruling and not an
       empty desk — which is the only way this check means anything. */
    const owed = await page.evaluate(() => {
      try { return (hmDecisionItems(null, []) || []).map(x => ({ kind: x.kind, cid: x.cid })); }
      catch (_){ return null; }
    });
    ok('1b the reading still finds work waiting on this reader',
      !!owed && owed.filter(x => x.kind === 'renewal').length >= 2, JSON.stringify(owed));
    const A = await page.evaluate(() => {
      const el = document.getElementById('hm-agents');
      return { title: el ? (el.querySelector('.hb-ct') || {}).textContent : null,
        sub: el ? (el.querySelector('.hb-cs') || {}).textContent : null,
        needs: document.querySelectorAll('#hb-board [data-hb-need]').length,
        needCls: document.querySelectorAll('#hb-board .hb-need').length,
        agents: document.querySelectorAll('#hm-agents .hb-ag').length,
        reading: typeof window.hbNeedsData };
    });
    ok('1c it is called Prepared by Copilot again',
      !!A.title && /copilot/i.test(A.title), JSON.stringify(A.title));
    ok('1d not one waiting row is drawn anywhere on the board',
      A.needs === 0 && A.needCls === 0, `${A.needs} doors, ${A.needCls} rows`);
    ok('1e and the reading behind them is not published either',
      A.reading === 'undefined', A.reading);

    /* ===== 2. THE CARD STILL DOES ITS OWN JOB ===== */
    ok('2a Copilot\'s own rows are still drawn', A.agents > 0, String(A.agents));
    await page.click('#hm-agents [data-hb-prep="closed"]').catch(() => {});
    const gone = await until(page, () => !document.getElementById('hm-agents'));
    const back = await page.evaluate(() => {
      const b = document.querySelector('[data-hb-prep="open"]');
      const n = b && b.querySelector('.hb-pill');
      let ready = null; try { ready = hbAgentsData(null).ready; } catch (_){}
      return { label: b ? b.textContent.replace(/\s+/g, ' ').trim() : null,
        pill: n ? n.textContent.trim() : null, ready: ready == null ? null : String(ready) };
    });
    ok('2b the x closes it and leaves a way back', gone && !!back.label, JSON.stringify(back.label));
    ok('2c whose count is Copilot\'s work alone',
      back.pill != null && back.ready != null && back.pill === back.ready, JSON.stringify(back));
    await page.click('[data-hb-prep="open"]').catch(() => {});
    ok('2d and it comes back', await until(page, () => !!document.getElementById('hm-agents')));

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
      corners.length >= 3 && corners.every(c => c.last && c.gap <= 14), JSON.stringify(corners));
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
