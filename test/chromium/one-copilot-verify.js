/* ONE COPILOT, FROM ANY HIGHLIGHT — driven where the reader stands
   ==================================================================
   Young ruled both on 23 Sep 2026 (fixes 4 and 5 of the seven he approved),
   off his own screenshots:

     4  *"when i highlight a contract only two options appear and you cant edit
        with copilot because it is missing. Also when i click on the ask
        copilot, it brings up the main hati copilot chatbot instead of taking me
        to the copilot that edits contracts."*
     5  *"I want anytime you are editing with copilot it uses the image 3
        version ... When you then click it off the highlighted part in image 3,
        you can ask copilot about anything across the entire contract."*

   THE REAL APP, a real server, a scripted provider and a real mouse, because
   every claim here is about what a reader sees after a real gesture:

     A  a highlight in the parties block offers Ask · Edit · Comment, and Edit
        opens the editing Copilot holding those words;
     B  a highlight across two clauses offers Ask · Comment — never Edit — and
        Ask opens the EDITING Copilot, not the main chat, as a question;
     C  the pencil opens the same card, holding the whole clause, and the
        greeting sentence is gone;
     D  the ✕ turns Copilot to the whole contract — its card, its three
        questions, its box — and a question there sends the whole contract and
        is answered with no Apply.

   Every driven half is GUARDED so a build without the fix reports rather than
   times out. Screenshots land in test/chromium/shots/one-copilot/.
   Run: node test/chromium/one-copilot-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'one-copilot');
fs.mkdirSync(OUT, { recursive: true });

let failures = 0;
const check = (ok, what, detail) => {
  console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail != null ? ` [${detail}]` : ''));
  if (!ok) failures++;
};
const pause = ms => new Promise(r => setTimeout(r, ms));

const BODY = '<h1>WAREHOUSING AGREEMENT</h1>'
  + '<p>This Agreement is made between Apex Logistics Limited, a company incorporated in Kenya, and Savannah Consumer Goods Limited.</p>'
  + '<h2>1. Definitions</h2><p>In this Agreement the Goods means the goods stored at the Facility.</p>'
  + '<h2>2. Scope of Services</h2><p>The Logistics Provider shall store and handle the Goods with due care.</p>'
  + '<h2>3. Governing Law</h2><p>This Agreement is governed by the laws of Kenya.</p>';
const TEXT = 'WAREHOUSING AGREEMENT This Agreement is made between Apex Logistics Limited, a company incorporated in Kenya, '
  + 'and Savannah Consumer Goods Limited. 1. Definitions In this Agreement the Goods means the goods stored at the Facility. '
  + '2. Scope of Services The Logistics Provider shall store and handle the Goods with due care. '
  + '3. Governing Law This Agreement is governed by the laws of Kenya.';

/* Where to drag: the first letter of `from` to the last of `to`, inside `sel`. */
const phraseBox = (page, sel, from, to) => page.evaluate(({ sel, from, to }) => {
  const root = document.querySelector(sel); if (!root) return null;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let a = null, b = null;
  while (w.nextNode()){
    const n = w.currentNode;
    const i = n.data.indexOf(from);
    if (i >= 0 && !a){ const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + 1);
      const q = r.getBoundingClientRect(); a = [q.left + 1, q.top + q.height / 2]; }
    const j = n.data.indexOf(to);
    if (j >= 0 && a){ const r = document.createRange(); r.setStart(n, j + to.length - 1); r.setEnd(n, j + to.length);
      const q = r.getBoundingClientRect(); b = [q.right - 1, q.top + q.height / 2]; }
  }
  return a && b ? { a, b } : null;
}, { sel, from, to });
const drag = async (page, box) => {
  await page.mouse.move(box.a[0], box.a[1]); await page.mouse.down();
  await page.mouse.move(box.b[0], box.b[1], { steps: 8 }); await page.mouse.up(); await pause(500);
};
const menuRows = page => page.evaluate(() => {
  const m = document.querySelector('.nego-selmenu');
  return m ? [...m.querySelectorAll('[data-nego-ai]')].map(b => b.getAttribute('data-nego-ai')) : [];
});
const pressMenu = async (page, id) => {
  const b = await page.$(`.nego-selmenu [data-nego-ai="${id}"]`);
  if (!b) return false;
  const bb = await b.boundingBox(); if (!bb) return false;
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.up();
  await pause(900);
  return true;
};
const railState = page => page.evaluate(() => {
  const ed = document.getElementById('clause-editor');
  const card = document.querySelector('#ce-scope .ce-scope');
  return { open: !!ed, card: card ? card.className : '', text: card ? card.innerText.replace(/\s+/g, ' ').trim() : '',
    ph: (document.getElementById('ce-ask') || {}).placeholder || '',
    chips: [...document.querySelectorAll('#ce-chips button')].map(b => b.textContent.trim()),
    label: (document.querySelector('.ce-ah-cl') || {}).textContent || '',
    lane: ((document.getElementById('ce-lane') || {}).innerText || '').replace(/\s+/g, ' ').trim(),
    chatPanel: !!(document.getElementById('ai-panel') && getComputedStyle(document.getElementById('ai-panel')).display !== 'none'
      && document.getElementById('ai-panel').getBoundingClientRect().width > 0) };
});
const closeEditor = async page => {
  await page.evaluate(() => { try { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); } catch (_) {} });
  await pause(400);
  await page.evaluate(() => { const b = document.getElementById('cf-ok'); b && b.click(); });
  await pause(300);
};

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  const W = await seedWorkspace(h);
  const ID = 'MK-OC1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Warehousing Agreement', counterparty: 'Savannah Consumer Goods Limited', counterpartyEmail: 'legal@savannah.example',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: {},
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 1000000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    upload: { name: 'Warehousing.docx', extractedText: TEXT } } } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const chatPosts = [];
  page.on('request', r => { if (/\/api\/ai\/chat/.test(r.url()) && r.method() === 'POST') chatPosts.push(r.postData() || ''); });

  await page.goto(h.base + '/', { waitUntil: 'networkidle' });
  await pause(600);
  await page.fill('#li-email', 'admin@example.co.ke');
  await page.fill('#li-pass', 'adminpassword1');
  await page.click('#li-go');
  await pause(2400);
  await page.evaluate(id => openRedlineWorkbench(id), ID);
  await page.waitForSelector('.redline-page .rl-doc', { timeout: 15000 }).catch(() => {});
  await pause(1500);

  /* ============ A. THE PARTIES BLOCK OFFERS EDIT (fix 4) ============ */
  const ga = await phraseBox(page, '.rl-doc .rl-recital', 'Apex Logistics', 'Limited');
  check(!!ga, 'A- the control: the parties block is on the paper', ga ? 'found' : 'no recital');
  if (ga) await drag(page, ga);
  const rowsA = await menuRows(page);
  check(rowsA.join(',') === 'ask,edit,comment', 'A1 a highlight in the parties block offers Ask · Edit · Comment', rowsA.join(' · ') || 'no menu');
  await page.screenshot({ path: path.join(OUT, '01-parties-menu.png') });
  const pressedA = rowsA.includes('edit') && await pressMenu(page, 'edit');
  const railA = await railState(page);
  check(pressedA && railA.open && /Apex Logistics Limited/.test(railA.text) && !/is-asking/.test(railA.card),
    'A2 and Edit opens the editing Copilot holding those words', railA.text.slice(0, 90) || 'not opened');
  await page.screenshot({ path: path.join(OUT, '02-parties-edit.png') });
  await closeEditor(page);

  /* ============ B. ACROSS TWO CLAUSES: ASK OPENS THE EDITING COPILOT (fix 4) ============ */
  await page.evaluate(() => { window.getSelection().removeAllRanges(); document.querySelectorAll('.nego-selmenu').forEach(n => n.remove()); });
  const gb = await phraseBox(page, '.rl-doc', 'goods stored', 'store and handle');
  check(!!gb, 'B- the control: two clauses to drag across', gb ? 'found' : 'no words');
  if (gb) await drag(page, gb);
  const rowsB = await menuRows(page);
  check(rowsB.join(',') === 'ask,comment', 'B1 [wall] across two clauses: Ask · Comment — never Edit (the owner\u2019s decision, true before this change too)', rowsB.join(' · ') || 'no menu');
  /* THE MAIN CHAT'S DOOR, COUNTED: the Copilot panel is reached through
     docAiRead (rlAskCopilotPanel), so a press that goes there is a count. */
  await page.evaluate(() => { window.__mainChat = 0; const o = window.docAiRead;
    window.docAiRead = function(){ window.__mainChat++; return o ? o.apply(this, arguments) : null; }; });
  const pressedB = rowsB.includes('ask') && await pressMenu(page, 'ask');
  const railB = await railState(page);
  const mainChat = await page.evaluate(() => window.__mainChat || 0);
  check(pressedB && railB.open && mainChat === 0, 'B2 and Ask opens the EDITING Copilot, not the main chat',
    JSON.stringify({ editor: railB.open, mainChat }));
  check(/is-asking/.test(railB.card) && /goods stored/.test(railB.text) && /store and handle/.test(railB.text),
    'B3 holding every word highlighted, as a question', railB.text.slice(0, 120) || 'no card');
  await page.screenshot({ path: path.join(OUT, '03-across-ask.png') });
  await closeEditor(page);

  /* ============ C. THE PENCIL: THE WHOLE CLAUSE IN THE SAME CARD (fix 5) ============ */
  const clauseId = await page.evaluate(id => {
    const c = getContract(id);
    const cl = negoClauseList(c).find(x => /Scope of Services/i.test(x.headingText || ''));
    return cl ? cl.clauseId : null;
  }, ID);
  await page.evaluate(({ id, cl }) => rlOpenClauseEditor(getContract(id), cl, {}), { id: ID, cl: clauseId });
  await pause(900);
  const railC = await railState(page);
  check(railC.open && /is-clause/.test(railC.card) && /store and handle the Goods/.test(railC.text) && !/<p>/.test(railC.text),
    'C1 the pencil opens the same card, holding the whole clause — its words, not its markup', railC.text.slice(0, 100) || 'no card');
  check(railC.ph === await page.evaluate(() => i18t('ce_ask_ph_clause')), 'C2 and the box asks what this clause should say', railC.ph);
  check(!/Ask me anything about/.test(railC.lane), 'C3 the greeting sentence is gone', railC.lane.slice(0, 90) || '(empty)');
  await page.screenshot({ path: path.join(OUT, '04-pencil.png') });

  /* ============ D. THE ✕ TURNS TO THE WHOLE CONTRACT (fix 5) ============ */
  /* PRESSED IN THE PAGE, so a build where the main chat still covers the
     screen (the reported fault) REPORTS rather than times out on a click. */
  const x = await page.evaluate(() => { const b = document.querySelector('#ce-scope [data-ce-act="scope-off"]'); if (!b) return false; b.click(); return true; });
  await pause(500);
  const railD = await railState(page);
  const want = await page.evaluate(() => ({ ph: i18t('ce_ask_ph_contract'), label: i18t('ce_whole_contract'),
    chips: [i18t('ce_q_contract_risks'), i18t('ce_q_contract_missing'), i18t('ce_q_contract_end')] }));
  check(!!x && /is-whole/.test(railD.card) && /Warehousing Agreement/i.test(railD.text),
    'D1 the ✕ turns Copilot to the whole contract, and the card says so', railD.text.slice(0, 100) || 'no card');
  check(railD.ph === want.ph && railD.label.trim() === want.label && railD.chips.join('|') === want.chips.join('|'),
    'D2 with the whole contract\'s own questions, box and label', JSON.stringify({ ph: railD.ph, label: railD.label, chips: railD.chips }));
  await page.screenshot({ path: path.join(OUT, '05-whole-contract.png') });
  ai.script([{ type: 'tool_use', id: 'tu_ans', name: 'deliver_answer', input: {
    answer: JSON.stringify({ advice: 'Clause 3 (Governing Law) puts the agreement under the laws of Kenya.', proposedText: '' }),
    citations: [] } }]);
  const callsBefore = ai.calls.length, postsBefore = chatPosts.length;
  const chip = await page.evaluate(() => { const b = document.querySelector('#ce-chips button'); if (!b) return false; b.click(); return true; });
  if (chip) await page.waitForSelector('#ce-lane .ce-ans', { timeout: 15000 }).catch(() => {});
  await pause(600);
  const sent = ai.calls.slice(callsBefore).map(c => JSON.stringify(c.body.messages || [])).join(' ');
  const post = chatPosts.slice(postsBefore).join(' ');
  check(ai.calls.length > callsBefore && /stored at the Facility/.test(sent) && /governed by the laws of Kenya/.test(sent),
    'D3 a question there sends the WHOLE contract — the first clause and the last', `${ai.calls.length - callsBefore} call(s)`);
  check(/"wholeDoc":true/.test(post), 'D4 and says so, so the one message may carry it all', /"wholeDoc":true/.test(post) ? 'wholeDoc' : 'not said');
  const ans = await page.evaluate(() => {
    const a = [...document.querySelectorAll('#ce-lane .ce-ans')].pop();
    return { there: !!a, apply: !!document.querySelector('#ce-lane [data-ce-apply]'),
      editWith: !!(a && a.querySelector('[data-ce-edit-with]')) };
  });
  check(ans.there && !ans.apply && !ans.editWith, 'D5 and the answer is a reading — no Apply, no Edit with this', JSON.stringify(ans));
  await page.screenshot({ path: path.join(OUT, '06-whole-answer.png') });
  await closeEditor(page);

  check(errors.length === 0, 'no page errors', errors.join(' | ') || 'clean');
  await browser.close(); await h.stop(); await ai.stop();
  console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
