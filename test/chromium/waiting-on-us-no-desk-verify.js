/* "WAITING ON US" COUNTS A NEGOTIATION NOBODY ON OUR SIDE HAS PICKED UP —
   measured in a real browser (the owner's list, 27 Sep 2026).

   "'The other side is waiting on us' needs an open desk, and a desk opens only
   when somebody on our side files a change or claims it. A negotiation where
   only the other side has filed never counts as waiting on us — on Home, in
   the bell or in the checklist."

   The real app, three people. The other side's proposal on MK-A2 is filed
   through the product's own funnel, dated two months ago, and nobody on our
   side has filed anything — so no desk. MK-A2 belongs to Unrestricted Legal.
   What the owner sees on the three surfaces the report names is read back:
   Home's "Needs your decision", the bell, and the side panel's checklist on
   the Contracts page. A colleague it does not belong to sees none of it.

   Against the parent (01bf6cc) this file reports 2a–2d red — none of the
   three surfaces says anything. 1 is the stage; 3 is the CONTROL that a
   colleague who does not own it is not told; 4 is the error sweep. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

let H;
async function login(browser, email, pass, errors) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(H.base + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.fill('#li-email', email);
  await page.fill('#li-pass', pass);
  await page.click('#li-go');
  await page.waitForTimeout(2400);
  return { ctx, page };
}

(async () => {
  H = await startHati();
  const W = await seedWorkspace(H);
  const U = W.users.unrestricted;
  { /* MK-A2 belongs to Unrestricted Legal. */
    const c = await W.admin.json('/api/contracts/MK-A2');
    const v = c._v; delete c._v;
    c.owner = { id: U.id, name: U.name };
    await W.admin.json('/api/contracts/MK-A2', { method: 'PUT', body: { contract: c, baseVersion: v } });
  }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    /* ================= 1 · THE STAGE: ONLY THEIR ASK, NO DESK ================= */
    const A = await login(browser, 'admin@example.co.ke', 'adminpassword1', errors);
    const staged = await A.page.evaluate(async () => {
      try {
        const c = getContract('MK-A2');
        await ensureFull(c);
        const cl = negoClauseList(c).find(x => !(window.negoIsFrontId && negoIsFrontId(x.clauseId)));
        if (!cl) return { error: 'no clause to ask about' };
        /* Two months ago whatever day this runs: always past a five-working-day
           standard, never a calendar claim that holds only some days. */
        const at = new Date(Date.now() - 60 * 864e5).toISOString();
        await negoEditClause(c, cl.clauseId, '<p>Fortnightly consignments to the mill gate, and nothing else.</p>',
          { side: 'counterparty', author: 'Grace Wanjiru · Nandi Dairy', summary: 'their ask', at });
        persist(c); await flushSaves();
        return { ok: true };
      } catch (e) { return { error: String(e && e.message || e) }; }
    });
    const stored = await W.admin.json('/api/contracts/MK-A2');
    const theirs = (stored.changes || []).filter(x => x.authorSide === 'counterparty' && x.status === 'pending').length;
    const ours = (stored.changes || []).filter(x => x.authorSide === 'owner').length;
    const desk = stored.desk && stored.desk.leadId;
    check('1 GATE — on file: one proposal of theirs, nothing of ours, nobody leading it',
      !staged.error && theirs === 1 && ours === 0 && !desk, JSON.stringify({ staged, theirs, ours, desk: desk || null }));
    await A.ctx.close();

    /* ================= 2 · THE OWNER IS TOLD, ON ALL THREE ================= */
    const O = await login(browser, U.email, 'their-own-pass-9', errors);
    await O.page.evaluate(() => { setView('dashboard'); });
    await O.page.waitForTimeout(1500);
    /* RE-POINTED 28 Sep 2026 (Young: "lets add just this part to the home
       page and discard the current 2 cards"): "Needs your decision" left
       Home. The owner is told on Home by Prepared by Copilot's "Their round
       came back" row, which names the deal; the sentence "nobody on our side
       has taken it yet" is carried by the bell (2c) and the checklist (2d). */
    const home = await O.page.evaluate(() => {
      const row = document.querySelector('[data-hm-agent-row="round"]');
      const ready = (typeof agentsData === 'function') ? agentsData().agents.round.ready.map(x => x.cid) : [];
      return { row: !!row, text: row ? row.textContent.replace(/\s+/g, ' ').trim() : '', ready };
    });
    check('2a Home\'s Prepared by Copilot carries it — under Their round came back',
      home.row && home.ready.includes('MK-A2'), JSON.stringify(home).slice(0, 200));
    check('2b and the row never says "led by" with no name after it',
      home.row && !/led by\s*(·|$)/.test(home.text), home.text.slice(0, 200) || 'no row');
    await O.page.click('#hdr-notify');
    await O.page.waitForTimeout(700);
    const bell = await O.page.evaluate(() => {
      const t = ((document.getElementById('context-panel') || {}).textContent || '').replace(/\s+/g, ' ');
      return { says: /Nandi Dairy has been waiting on us/.test(t), line: /nobody on our side has taken it yet/.test(t) };
    });
    check('2c the bell says it too, with the same line', bell.says && bell.line, JSON.stringify(bell));
    await O.page.keyboard.press('Escape');
    await O.page.evaluate(() => { if (window.insForce) insForce(true); setView('register'); });
    await O.page.waitForTimeout(1200);
    const row = O.page.locator('#reg-tbody tr[data-row="MK-A2"]').first();
    if (await row.count()) { await row.click(); await O.page.waitForTimeout(1000); }
    const panel = await O.page.evaluate(() => {
      const box = document.querySelector('.ins-need');
      return { drawn: !!box, text: box ? box.textContent.replace(/\s+/g, ' ').trim() : '' };
    });
    check('2d and the side panel\'s checklist on the Contracts page asks for an answer',
      panel.drawn && /Answer Nandi Dairy/.test(panel.text), panel.text.slice(0, 140) || 'no checklist');
    await O.ctx.close();

    /* ================= 3 · CONTROL: A COLLEAGUE IT DOES NOT BELONG TO ================= */
    const R = await login(browser, 'restricted@example.co.ke', 'their-own-pass-9', errors);
    await R.page.evaluate(() => { setView('dashboard'); });
    await R.page.waitForTimeout(1500);
    /* RE-POINTED 28 Sep 2026: Home's work card is now a digest of Copilot's
       work, which is the team's shared list (the agents page shows it to every
       colleague who can open the deal), so the PERSONAL claim moves to the
       bell — the one per-person list that says "has been waiting on us". */
    await R.page.click('#hdr-notify');
    await R.page.waitForTimeout(700);
    const other = await R.page.evaluate(() => ({
      signedIn: !!(window.currentUser && currentUser()),
      sees: !!(window.getContract && getContract('MK-A2')),
      row: /Nandi Dairy has been waiting on us/.test(((document.getElementById('context-panel') || {}).textContent || '').replace(/\s+/g, ' ')) }));
    await R.page.keyboard.press('Escape');
    check('3 CONTROL — a colleague who can see MK-A2 but does not own it is not told in their bell',
      other.signedIn && other.sees && !other.row, JSON.stringify(other));
    await R.ctx.close();
  } finally {
    check('4 no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
    await browser.close();
    await H.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
