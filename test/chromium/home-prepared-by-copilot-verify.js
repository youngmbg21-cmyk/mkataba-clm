/* ============================================================
   HOME — PREPARED BY COPILOT (Young ruled 28 Sep 2026: "lets add just this
   part to the home page and discard the current 2 cards")
   ============================================================
   Home's two work cards — "Prepared for you" and "Needs your decision" —
   are gone. One card, "Prepared by Copilot", draws one row per agent with
   something ready on Copilot's work, with that agent's count and its first
   item, and "Review" opens that agent there. This drives it where the reader
   looks:
     1  the old cards are not drawn; the new one is, below the Map
     2  one row per agent with work ready, in Copilot's work's own order,
        each count that agent's own; the head's count is the side menu's
     3  Review opens Copilot's work on that agent; the head's link opens the page
     4  nothing ready → no card at all
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

    /* ===== 1. THE OLD CARDS ARE GONE, THE NEW ONE IS DRAWN ===== */
    const shape = await page.evaluate(() => {
      const card = document.getElementById('hm-agents');
      const map = document.getElementById('hb-book');
      return { card: !!card, desk: !!document.getElementById('hm-desk-rows'), dd: !!document.getElementById('hm-dd-rows'),
        needsyou: !!document.querySelector('[data-hm-go="needsyou"]'),
        below: !!(card && map && (map.compareDocumentPosition(card) & Node.DOCUMENT_POSITION_FOLLOWING)),
        title: card ? card.querySelector('.hb-ct').textContent.trim() : '',
        /* RE-POINTED TWICE IN ONE DAY, 4 Oct 2026, and this is the second.
           In the morning Young picked "One list, one place": the card became
           ONE list called "Your work", holding both what a colleague is
           waiting on you for and what Copilot had prepared, with a divider
           between them carrying Copilot's own name — so the title moved to
           the divider and this claim was re-pointed at it. By the evening:
           "Remove waiting on you from the home page permanently. It is not
           needed." There is one half again, so the card's own title carries
           Copilot's name as it did before the morning, there is no divider to
           name, and NO waiting row may be drawn at all. Asked of the
           dictionary rather than typed here, so neither can drift. */
        want: (window.i18t ? i18t('hm_ag_title') : ''),
        needs: (card ? card.querySelectorAll('.hb-need, [data-hb-need]').length : 0),
        divider: (() => { const d = card && card.querySelector('.hb-done span');
          return d ? d.textContent.trim() : ''; })() };
    });
    ok('1a "Prepared for you" and "Needs your decision" are not drawn', !shape.desk && !shape.dd && !shape.needsyou, JSON.stringify(shape));
    ok('1b the one work card is drawn, below Your book, titled Prepared by Copilot',
      shape.card && shape.below && !!shape.want && shape.title === shape.want, JSON.stringify(shape));
    ok('1b2 and nothing waiting on you is drawn in it, so it needs no divider',
      shape.needs === 0 && !shape.divider,
      JSON.stringify([shape.needs, shape.divider]));
    await page.screenshot({ path: path.join(OUT, '1-home.png'), fullPage: true });

    /* ===== 2. ONE ROW PER AGENT WITH WORK, EVERY NUMBER BORROWED ===== */
    const rows = await page.evaluate(() => {
      const D = agentsData();
      const want = AG_KEYS.filter(k => D.agents[k].ready.length).map(k => k + ':' + D.agents[k].ready.length);
      const got = [...document.querySelectorAll('[data-hm-agent-row]')].map(r => r.getAttribute('data-hm-agent-row') + ':'
        + ((r.querySelector('.hb-pill') || {}).textContent || '').trim());
      const sub = (document.querySelector('#hm-agents .hb-cs') || {}).textContent || '';
      const rail = ((document.querySelector('[data-count="agents"]') || {}).textContent || '').trim();
      return { want, got, sub, ready: D.ready, rail };
    });
    ok('2a one row per agent with work ready, in Copilot\'s work\'s order, each with that agent\'s count',
      rows.want.length >= 3 && rows.got.join(',') === rows.want.join(','), JSON.stringify(rows));
    ok('2b the rows are the three staged agents', ['round', 'late', 'ours'].every(k => rows.got.some(g => g.startsWith(k + ':'))), rows.got.join(','));
    ok('2c the head counts what Copilot\'s work counts, and the side menu agrees',
      new RegExp('^' + rows.ready + ' ready').test(rows.sub.trim()) && rows.rail === String(rows.ready), JSON.stringify({ sub: rows.sub, rail: rows.rail, ready: rows.ready }));
    const oursRow = await page.evaluate(() => { const r = document.querySelector('[data-hm-agent-row="ours"]'); return r ? r.textContent.replace(/\s+/g, ' ').trim() : ''; });
    ok('2d a row says the agent and its first item', /Our promises/.test(oursRow) && /Pay the storage deposit/.test(oursRow) && /due in 3 days/.test(oursRow), oursRow);
    await page.locator('#hm-agents').screenshot({ path: path.join(OUT, '2-card.png') });

    /* ===== 3. REVIEW OPENS THAT AGENT ===== */
    await page.click('[data-hm-agent-row="ours"] .hb-btn');
    ok('3 Review digs in: the board lists that agent\'s work first', await page.waitForFunction(() =>
      !!document.querySelector('#hb-board .hb-dig [data-hm-agent="ours"]'), null, { timeout: 8000 }).then(() => true, () => false));
    await page.click('#hb-board .hb-dig [data-hm-agent="ours"]');
    await page.waitForFunction(() => state.view === 'agents' && !!document.querySelector('.ag-row.on'), null, { timeout: 8000 }).catch(() => {});
    const landed = await page.evaluate(() => ({ view: state.view, on: (document.querySelector('.ag-row.on') || { getAttribute: () => '' }).getAttribute('data-ag-agent') }));
    ok('3a and its button opens Copilot\'s work on that agent', landed.view === 'agents' && landed.on === 'ours', JSON.stringify(landed));
    await page.evaluate(() => setView('dashboard'));
    await page.waitForSelector('#hm-agents', { timeout: 8000 }).catch(() => {});
    await page.click('#hm-agents [data-hm-agent=""]');
    await page.waitForFunction(() => state.view === 'agents', null, { timeout: 8000 }).catch(() => {});
    ok('3b the head\'s link opens Copilot\'s work', await page.evaluate(() => state.view === 'agents'));

    /* ===== 4. NOTHING READY, NO CARD ===== */
    const empty = await page.evaluate(() => {
      const keep = state.contracts; state.contracts = [];
      setView('dashboard');
      const drawn = !!document.getElementById('hm-agents');
      state.contracts = keep; setView('dashboard');
      return drawn;
    });
    ok('4a with nothing ready the card is not drawn', empty === false);

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
