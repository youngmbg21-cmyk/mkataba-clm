/* ============================================================
   AFTER YOU ANSWER THEIR ROUND, THE SEND IS ON SCREEN (owner, 8 Oct 2026 —
   work order "Copilot's answer on the paper", Part B)
   ============================================================
   Nandi Dairy deletes clause 3. We refuse it.
     1  before deciding: no hand-back send in the column (their ask is open)
     2  after refusing: "Whose move" reads Mine, the list's pill says an answer
        is waiting to go back
     3  "Send to Nandi Dairy" is in the Redlines column head and is the topmost
        element at its own centre (it was drawn under the paper)
     4  pressing it hands the round back: the turn is theirs, the button goes
   AT THE PARENT 2 and 3 FAIL: "Neither", and the only send is off screen.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'send-after-refusal');
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++; console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const DOC = ['RAW MATERIAL SUPPLY AGREEMENT', '', '1. Supply', '', 'The Supplier shall supply 5000 metric tonnes per annum.', '',
  '2. Price', '', 'Invoices fall due within 45 days of receipt.', '',
  '3. Quality & Rejection', '', 'Consignments failing specification may be rejected within 3 days of delivery.'].join('\n');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const c = fixtureContract('MK-SR1', 'Raw Material Supply Agreement', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
    c.owner = { id: me.id, name: me.name };
    await W.admin.json('/api/contracts/MK-SR1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@nandi.example' },
      payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
        contract: { id: 'MK-SR1', name: 'Raw Material Supply Agreement', counterparty: 'Nandi Dairy', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) { await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-SR1'), null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    const q = await page.evaluate(async () => { const c = getContract('MK-SR1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      const y = negoClauseList(c).find(k => /rejected within 3 days/.test(k.text || k.body || '')); return y ? { id: y.clauseId, label: clauseLabel(y), text: String(y.text || y.body || '').trim() } : null; });
    await h.client('erik').raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-SR1', at: new Date().toISOString(),
      negoProposed: [{ clauseId: q.id, clauseLabel: q.label, oldText: q.text, newText: '', changeType: 'deleteClause', why: 'No rejection window' }] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await page.waitForFunction(() => (getContract('MK-SR1').changes || []).length, null, { timeout: 10000 });
    await page.evaluate(() => openRedlineWorkbench('MK-SR1'));
    await page.waitForFunction(() => state.view === 'redline' && document.querySelector('[data-nego-reject]'), null, { timeout: 10000 });

    const before = await page.evaluate(() => !!document.querySelector('.rl-unsent-go[data-rl-decided]'));
    ok('1 before deciding, no hand-back send in the column', !before);

    await page.click('[data-nego-reject]');
    const asked = await page.waitForSelector('#prompt-overlay #pd-input, #prompt-overlay textarea', { timeout: 5000 }).then(() => true, () => false);
    if (asked) { await page.fill('#prompt-overlay #pd-input, #prompt-overlay textarea', 'The clause stays.'); await page.click('#prompt-overlay #pd-ok'); }
    await page.waitForFunction(() => (getContract('MK-SR1').changes || []).some(x => x.status === 'rejected'), null, { timeout: 8000 }).catch(() => {});
    const go = await page.waitForSelector('.rl-unsent-go[data-rl-decided]', { timeout: 8000 }).then(() => true, () => false);
    const m = await page.evaluate(() => { const c = getContract('MK-SR1'); const w = negWhoseMove(c); const say = negoMoveSay(c);
      const facts = [...document.querySelectorAll('*')].find(e => /^Whose move$/i.test((e.textContent || '').trim()) && e.children.length === 0);
      const cell = facts && facts.parentElement ? facts.parentElement.innerText : '';
      return { k: w.k, why: w.why, word: say.word, cell }; });
    ok('2 Whose move reads Mine, with an answer waiting to go back', m.k === 'you' && m.why === 'decided' && /Mine/i.test(m.cell), JSON.stringify(m));
    const top = await page.evaluate(() => { const b = document.querySelector('.rl-unsent-go[data-rl-decided]'); if (!b) return null; const r = b.getBoundingClientRect();
      const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return { text: b.textContent.trim(), top: !!t && (t === b || b.contains(t)) }; });
    ok('3 "Send to Nandi Dairy" is in the column head, on top of everything', go && top && top.top && /Send to Nandi Dairy/.test(top.text), JSON.stringify(top));
    await page.screenshot({ path: path.join(OUT, '1-send.png') });
    if (go) await page.click('.rl-unsent-go[data-rl-decided]');
    const conf = await page.$('#prompt-overlay #pd-ok, [data-confirm-ok]'); if (conf) await conf.click().catch(() => {});
    const handed = await page.waitForFunction(() => { const c = getContract('MK-SR1'); return c.negotiation && c.negotiation.turn === 'counterparty'; }, null, { timeout: 10000 }).then(() => true, () => false);
    await page.waitForTimeout(600);
    const gone = await page.evaluate(() => !document.querySelector('.rl-unsent-go[data-rl-decided]'));
    ok('4 pressing it hands the round back, and the button goes', handed && gone, await page.evaluate(() => JSON.stringify({ turn: getContract('MK-SR1').negotiation.turn, move: negWhoseMove(getContract('MK-SR1')).k })));
    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
