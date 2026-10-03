/* ONE LIST, ONE PLACE — measured in a real browser.
 *
 * Young, 4 Oct 2026: *"Idea 4 but this should be included inside the newly
 * built dashboard"*, then, confirming: *"waiting on you will be in the home
 * page dashboard and will have it as a suggestion prompt."* He picked the
 * option by name — One list, one place.
 *
 * WHAT THIS DRIVES, where the user looks:
 *   1. Home's card is YOUR WORK, and what is waiting on you is in it;
 *   2. every row is a prompt, not a number — it names what is owed, to whom,
 *      how long it has waited, and carries the act;
 *   3. waiting rows lead, and Copilot's prepared work follows under its own
 *      heading, so the only difference between two rows is who raised them;
 *   4. pressing a row lands where that kind is answered — the checklist's own
 *      door (needsYouGo), never a second one;
 *   5. the sub-line counts both halves, and the card's count survives being
 *      closed and brought back;
 *   6. THE SENTENCES ARE HaTi'S OWN. No AI route is called to draw this card:
 *      the words are worked out from the record, so they are free, instant,
 *      and cannot say something the contract does not.
 *   7. the list stays on the WHOLE BOOK while the board is counting a
 *      question — what is owed by you is not a property of the last question.
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

    /* ===== 1. THE CARD IS YOUR WORK, AND THE WAITING IS IN IT ===== */
    const card = await until(page, () => !!document.getElementById('hm-agents'));
    ok('1a the card is on the board', card);
    /* COUNTED HERE, before anything on the board is pressed. Opening a
       contract later starts Copilot reading it on arrival, which is a
       different feature paying for itself; what this stage is about is that
       DRAWING THE CARD costs nothing. */
    const aiAtCard = aiCalls.length;
    const A = await page.evaluate(() => {
      const el = document.getElementById('hm-agents');
      /* THE BOARD'S OWN READING, asked exactly as the card asks it —
         hmDecisionItems called straight would subtract the renewals a desk
         card would have shown, and no desk is drawn here. */
      const want = (typeof hbNeedsData === 'function') ? (hbNeedsData().rows || []) : null;
      const rows = [...document.querySelectorAll('#hm-agents .hb-need')];
      return { title: el ? (el.querySelector('.hb-ct') || {}).textContent : null,
        sub: el ? (el.querySelector('.hb-cs') || {}).textContent : null,
        want: want && want.map(x => ({ kind: x.kind, cid: x.cid, urgent: !!x.urgent })),
        drawn: rows.map(r => ({ kind: r.getAttribute('data-hb-need'), cid: r.getAttribute('data-hb-cid'),
          urgent: r.classList.contains('is-crit'),
          text: (r.querySelector('.hb-ag-t') || {}).textContent || '',
          meta: (r.querySelector('.hb-ag-s') || {}).textContent || '',
          tag: (r.querySelector('.hb-chip') || {}).textContent || '',
          verb: (r.querySelector('.hb-btn') || {}).textContent || '' })) };
    });
    ok('1b it is called Your work, not Prepared by Copilot',
      !!A.title && !/copilot/i.test(A.title), JSON.stringify(A.title));
    ok('1c the reading found both renewals, neither struck out by a card Home does not draw',
      !!A.want && A.want.filter(x => x.kind === 'renewal').length === 2
        && ['MK-W1', 'MK-W2'].every(id => A.want.some(x => x.cid === id)),
      JSON.stringify(A.want));
    ok('1d and the card draws exactly what the reading says, in its order',
      !!A.want && A.drawn.length === Math.min(A.want.length, 6)
        && A.drawn.every((r, i) => r.kind === A.want[i].kind && r.cid === A.want[i].cid),
      `${A.drawn.length} drawn of ${A.want ? A.want.length : '?'}`);

    /* ===== 2. EVERY ROW IS A PROMPT, NOT A NUMBER ===== */
    const r0 = A.drawn[0] || {};
    ok('2a it says what is owed, and names the contract in it',
      (r0.text || '').trim().length > 0 && /Packaging|Fleet/.test(r0.text || ''), JSON.stringify(r0.text));
    ok('2b it says who it is with', (r0.meta || '').trim().length > 0, JSON.stringify(r0.meta));
    ok('2c it says how long, as words rather than a raw date',
      (r0.tag || '').trim().length > 0 && !/^\d{4}-\d{2}-\d{2}$/.test((r0.tag || '').trim()), JSON.stringify(r0.tag));
    ok('2d and it carries the act', (r0.verb || '').trim().length > 0, JSON.stringify(r0.verb));
    const urgent = A.drawn.find(r => r.cid === 'MK-W2');
    ok('2e the nearer renewal is marked urgent and the further one is not',
      !!urgent && urgent.urgent === true && A.drawn.some(r => r.cid === 'MK-W1' && r.urgent === false),
      JSON.stringify(A.drawn.map(r => [r.cid, r.urgent])));

    /* ===== 3. ONE LIST: WAITING LEADS, COPILOT FOLLOWS ===== */
    const order = await page.evaluate(() => {
      const el = document.getElementById('hm-agents'); if (!el) return null;
      const kids = [...el.children];
      const idx = sel => kids.findIndex(k => k.matches(sel) || k.querySelector(sel));
      return { need: idx('.hb-need'), agent: idx('.hb-ag:not(.hb-need)'),
        agents: el.querySelectorAll('.hb-ag:not(.hb-need)').length };
    });
    ok('3a waiting on you comes before Copilot\'s prepared work',
      !!order && order.need >= 0 && (order.agent < 0 || order.need < order.agent), JSON.stringify(order));

    /* ===== 4. THE PRESS IS THE CHECKLIST'S OWN DOOR ===== */
    const went = await page.evaluate(() => {
      const seen = [];
      const real = window.needsYouGo;
      window.needsYouGo = (k, id) => { seen.push([k, id]); return true; };
      const b = document.querySelector('#hm-agents .hb-need .hb-btn');
      if (b) b.click();
      window.needsYouGo = real;
      return seen;
    });
    ok('4a pressing a row calls needsYouGo with its kind and its contract',
      went.length === 1 && went[0][0] === (A.drawn[0] || {}).kind && went[0][1] === (A.drawn[0] || {}).cid,
      JSON.stringify(went));
    /* AND IT REALLY LANDS. The stub above proves the door is pressed; this
       proves the door opens — a renewal lands on the contract's Overview. */
    await page.click('#hm-agents .hb-need .hb-btn').catch(() => {});
    const landedOn = await until(page, () => state.view === 'workspace', null, 6000);
    const where = await page.evaluate(() => ({ view: state.view, id: state.activeId,
      tab: typeof roomCurrentTab === 'function' ? roomCurrentTab() : null }));
    ok('4b and the contract really opens, on the tab that answers it',
      landedOn && where.id === (A.drawn[0] || {}).cid && where.tab === 'terms', JSON.stringify(where));
    await page.evaluate(() => setView('dashboard'));
    await until(page, () => !!document.getElementById('hm-agents'));

    /* ===== 5. THE SUB-LINE, AND THE CARD CLOSED AND BROUGHT BACK ===== */
    ok('5a the sub-line counts what is waiting on you',
      !!A.sub && /\d/.test(A.sub) && A.sub.trim().length > 0, JSON.stringify(A.sub));
    await page.click('#hm-agents [data-hb-prep="closed"]').catch(() => {});
    const gone = await until(page, () => !document.getElementById('hm-agents'));
    const backBtn = await page.evaluate(() => {
      const b = document.querySelector('[data-hb-prep="open"]');
      return b ? b.textContent.replace(/\s+/g, ' ').trim() : null;
    });
    ok('5b closing it leaves a way back that still carries the count',
      gone && !!backBtn && /\d/.test(backBtn), JSON.stringify(backBtn));
    await page.click('[data-hb-prep="open"]').catch(() => {});
    ok('5c and it comes back', await until(page, () => !!document.getElementById('hm-agents')));

    /* ===== 6. THE SENTENCES ARE HaTi'S OWN ===== */
    ok('6a drawing this card called no AI route at all', aiAtCard === 0,
      aiCalls.slice(0, aiAtCard).join(', ') || 'none');

    /* ===== 7. THE WHOLE BOOK, WHILE THE BOARD COUNTS A QUESTION ===== */
    await page.fill('#igd-input', 'suppliers only');
    await page.keyboard.press('Enter');
    await until(page, () => typeof hbS === 'function' && hbS().lens === 'suppliers', null, 9000);
    const narrowed = await page.evaluate(() => ({ lens: hbS().lens,
      rows: document.querySelectorAll('#hm-agents .hb-need').length }));
    ok('7a a narrowed board does not narrow what is waiting on you',
      narrowed.rows === A.drawn.length, JSON.stringify(narrowed));

    await page.screenshot({ path: path.join(OUT, '1-your-work.png'), fullPage: false });
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
