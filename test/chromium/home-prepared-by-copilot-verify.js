/* ============================================================
   HOME — PREPARED BY COPILOT (Young ruled 28 Sep 2026: "lets add just this
   part to the home page and discard the current 2 cards")
   ============================================================
   Home's two work cards — "Prepared for you" and "Needs your decision" —
   are gone. One card, "Prepared by Copilot", draws one row per agent with
   something ready on Copilot's work, with that agent's count and its first
   item, and "Review" opens that agent there. This drives it where the reader
   looks:
     1  the old cards are not drawn; since 18 Oct 2026 (round 17 as drawn)
        Jambo's work is not on the Board either — it is the Counter's first row
     2  its pieces in Copilot's work's own order; its count is the work's own
     3  an agent's whole work still opens on the Board through its one door
     4  nothing ready → nothing offered
*/
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'home-prepared-by-copilot');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const day = n => iso(n).slice(0, 10);
const DOC = '1. TERM\nThis Agreement runs for twelve (12) months.\n2. PAYMENT\nInvoices are payable within thirty (30) days.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const owner = { id: me.id, name: me.name };
    const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    /* Their round came back: an ask of theirs waiting on us. */
    const round = fixtureContract('MK-HC1', 'Cane Supply Agreement', 'Juno Limited', FOLDER_A, 480000, 'Under Review', DOC);
    Object.assign(round, { owner, negotiation: { round: 2, turn: 'owner', turnAt: iso(-2), rounds: [] },
      changes: [{ id: 'CHG-2', clauseId: 'cl_pay', clauseLabel: '2. PAYMENT', status: 'pending', authorSide: 'counterparty',
        author: 'Erik Lindqvist', summary: '“30” → “90”', newText: 'Invoices are payable within ninety (90) days.',
        oldText: 'Invoices are payable within thirty (30) days.', createdAt: iso(-2) }] });
    await put(round);
    /* Late promises and Our promises, on one signed contract. */
    const ob = fixtureContract('MK-HC2', 'Stock reporting', 'Savanna Foods Ltd', FOLDER_A, 900000, 'Signed', DOC);
    Object.assign(ob, { owner, hash: 'x', counterpartyEmail: 'ops@savanna.example',
      obligations: [
        { id: 'o1', desc: 'Deliver the Q3 stock report', party: 'theirs', due: day(-5), status: 'open' },
        { id: 'o2', desc: 'Pay the storage deposit', party: 'ours', due: day(3), status: 'open' }] });
    await put(ob);

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    if (await page.$('#li-email')) {
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    }
    await page.waitForFunction(() => typeof window.renderDashboard === 'function' && window.state && Array.isArray(state.contracts)
      && state.contracts.length >= 2, null, { timeout: 15000 }).catch(() => {});
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); }
    await page.evaluate(() => { setView('dashboard'); });
    /* RE-POINTED IN PLACE 3 Oct 2026 (Young: Home is the board and the map):
       the card sits under Your book on the board, and Review digs in first. */
    await page.waitForSelector('#hb-book', { timeout: 10000 }).catch(() => {});

    /* ===== 1. THE OLD CARDS ARE GONE; JAMBO'S WORK IS THE COUNTER'S =====
       RE-POINTED 18 Oct 2026 (round 17 as drawn, the owner's yes: Needs you
       and Jambo's work LEAVE THE BOARD — they live on the Counter). The work
       is the first row of the Counter's Needs you and opens in place. */
    const shape = await page.evaluate(() => ({ card: !!document.getElementById('hm-agents'), desk: !!document.getElementById('hm-desk-rows'), dd: !!document.getElementById('hm-dd-rows'),
      needsyou: !!document.querySelector('[data-hm-go="needsyou"]') }));
    ok('1a "Prepared for you", "Needs your decision" and the work card are not drawn on the Board', !shape.desk && !shape.dd && !shape.needsyou && !shape.card, JSON.stringify(shape));
    await page.evaluate(() => setView('counter'));
    await page.waitForFunction(() => !!document.querySelector('#cn-needs [data-cn-jw]'), null, { timeout: 8000 }).catch(() => {});
    if (await page.$('#cn-needs [data-cn-jw][aria-expanded="false"]')) await page.click('#cn-needs [data-cn-jw]');
    await page.waitForTimeout(400);
    const cn = await page.evaluate(() => { const row = document.querySelector('#cn-needs .cn-jw');
      return { title: row ? ((row.querySelector('b') || {}).textContent || '').replace(/·.*$/, '').trim() : '', want: i18t('cn_jw'),
        first: !!(row && row === document.querySelector('#cn-needs .cn-r')), waiting: document.querySelectorAll('#cn-jw-list [data-cn-need]').length }; });
    ok('1b Jambo\'s work is the Counter\'s first row, under his own name', cn.title === cn.want && cn.first, JSON.stringify(cn));
    ok('1b2 and nothing waiting on you is drawn in it', cn.waiting === 0, String(cn.waiting));
    await page.screenshot({ path: path.join(OUT, '1-counter.png'), fullPage: true });

    /* ===== 2. ITS PIECES, IN COPILOT'S WORK'S ORDER, EVERY NUMBER BORROWED ===== */
    const rows = await page.evaluate(() => {
      const D = agentsData();
      const want = AG_KEYS.filter(k => !HB_OFF_BOARD.includes(k) && D.agents[k].ready.length);
      const got = [...new Set([...document.querySelectorAll('#cn-needs [data-cn-ag-item]')].map(r => (agFind(r.getAttribute('data-cn-ag-item')) || {}).agent).filter(Boolean))];
      const sub = ((document.querySelector('#cn-needs .cn-jw .cn-n') || {}).textContent || '').replace(/^\s*·\s*/, '');
      const rail = ((document.querySelector('[data-count="agents"]') || {}).textContent || '').trim();
      return { want, got, sub, ready: hbAgentsData(null).ready, rail };
    });
    ok('2a the pieces come in Copilot\'s work\'s order', rows.want.length >= 2 && rows.want.join(',').startsWith(rows.got.join(',')) && rows.got.length >= 1, JSON.stringify(rows));
    ok('2b the staged agents are there, and Our promises is not', ['round', 'late'].every(k => rows.want.includes(k)) && !rows.got.includes('ours'), rows.got.join(','));
    ok('2c its count is Copilot\'s work\'s, and there is no second door in the side menu',
      new RegExp('^' + rows.ready + '\\b').test(rows.sub.trim()) && rows.rail === ''
        && !(await page.$('#sidebar [data-view="agents"], nav [data-view="agents"]')), JSON.stringify({ sub: rows.sub, rail: rows.rail, ready: rows.ready }));
    const lateRow = await page.evaluate(() => { const r = [...document.querySelectorAll('#cn-needs [data-cn-ag-item]')].find(x => (agFind(x.getAttribute('data-cn-ag-item')) || {}).agent === 'late'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; });
    ok('2d a piece says its agent and what it is', /Late promises/.test(lateRow) && lateRow.length > 20, lateRow);

    /* ===== 3. AN AGENT'S WHOLE WORK STILL OPENS ON THE BOARD, THROUGH ITS ONE DOOR ===== */
    await page.evaluate(() => hbOpenAgent('late'));
    const shown = () => page.evaluate(() => ({ view: state.view,
      want: agentsData().agents.late.ready.map(x => x.key).slice(0, 8),
      got: [...document.querySelectorAll('#hb-focus [data-hb-ag-item]')].map(x => x.getAttribute('data-hb-ag-item')),
      acts: document.querySelectorAll('#hb-focus [data-hb-ag-item] [data-ag-act]').length }));
    await page.waitForFunction(() => !!document.querySelector('#hb-board [data-hb-ag-item]'), null, { timeout: 8000 }).catch(() => {});
    const s3 = await shown();
    ok('3 that agent\'s whole work opens on the Board, with its own buttons',
      s3.view === 'dashboard' && s3.got.length > 0 && s3.got.join(',') === s3.want.join(',') && s3.acts > 0, JSON.stringify(s3));
    await page.evaluate(() => setView('agents'));
    await page.waitForFunction(() => !!document.querySelector('#hb-board [data-hb-ag-item]'), null, { timeout: 8000 }).catch(() => {});
    const s3b = await page.evaluate(() => state.view);
    ok('3b the old page\'s address lands on the Board', s3b === 'dashboard', s3b);

    /* ===== 4. NOTHING READY, NOTHING OFFERED ===== */
    const empty = await page.evaluate(() => {
      const keep = state.contracts; state.contracts = [];
      setView('counter');
      const drawn = document.querySelectorAll('#cn-needs [data-cn-ag-item]').length;
      state.contracts = keep; setView('dashboard');
      return drawn;
    });
    ok('4a with nothing ready no piece is offered', empty === 0, String(empty));

    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the run finished', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
    console.log(`\n${pass} passed, ${fail} failed`);
    process.exit(fail ? 1 : 0);
  }
})();
