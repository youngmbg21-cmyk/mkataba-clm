/* ============================================================
   COPILOT'S ANSWER ON THE PAPER, AND THE BUTTON THAT GLOWS (owner,
   8 Oct 2026 — work order "Copilot's answer on the paper", Part A)
   ============================================================
   Their round asks for 90 days instead of 45. The reader asks Copilot again,
   four times, for four answers:
     1  "counter at 60": the paper carries Copilot's wording in a dashed box
        under theirs (60 marked), NO words of note; Counter alone glows; nothing
        is filed
     2  Counter's press opens the clause editor with the wording APPLIED;
        still nothing filed
     3  "reject": a dashed line through their words; Reject alone glows; a
        press on it puts the glow out
     4  "accept": a dashed tick; Accept alone glows
     5  "ask a colleague": nothing on the paper; Ask for review glows
     6  reduced motion: the ring is still
     7  their page carries none of it
   AT THE PARENT every claim FAILS: no marks, no glow, no reject answer.
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');
const { roundPrepKey } = require('../../js/roundprep.js');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'copilot-answer-on-paper');
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++; console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const DOC = ['RAW MATERIAL SUPPLY AGREEMENT', '', '1. Supply', '', 'The Supplier shall supply 5000 metric tonnes per annum.', '',
  '2. Price', '', 'Invoices fall due within 45 days of receipt.'].join('\n');
const COUNTER = 'Invoices fall due within 60 days of receipt.';
function answer(body){
  const tool = (body.tool_choice && body.tool_choice.name) || '';
  const prompt = String(((body.messages || [])[0] || {}).content || '');
  const tu = input => [{ type: 'tool_use', id: 'tu_' + tool, name: tool, input }];
  if (tool !== 'round_answers') return tu({});
  const k = (prompt.match(/\nASK \d+ — /g) || []).length || 1;
  const note = (prompt.match(/Their note: "([^"]*)"/) || [])[1] || '';
  const v = /counter/i.test(note) ? 'counter' : /reject/i.test(note) ? 'reject' : /accept/i.test(note) ? 'accept' : 'escalate';
  return tu({ answers: Array.from({ length: k }, (_, i) => ({ ask: i + 1, verdict: v, why: 'As asked.', standard: 'Payment terms', wording: v === 'counter' ? COUNTER : '' })) });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const ai = await startScriptedAi(); ai.script(...Array(40).fill(answer));
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: '' });
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  for (const k of ['link', 'late', 'renew', 'paper', 'ours']) await W.admin.json('/api/agents/' + k + '/settings', { method: 'PUT', body: { on: false } }).catch(() => {});
  await W.admin.json('/api/settings', { method: 'PUT', body: { playbook: { _default: { label: 'Company standard', positions: [{ category: 'Payment terms', preferred: 'Pay within 45 days' }] } } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const c = fixtureContract('MK-CP1', 'Raw Material Supply Agreement', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
    c.owner = { id: me.id, name: me.name };
    await W.admin.json('/api/contracts/MK-CP1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@nandi.example' },
      payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
        contract: { id: 'MK-CP1', name: 'Raw Material Supply Agreement', counterparty: 'Nandi Dairy', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) { await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-CP1'), null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    const cl = await page.evaluate(async () => { const c = getContract('MK-CP1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      const y = negoClauseList(c).find(k => /45 days/.test(k.text || k.body || '')); return { id: y.clauseId, label: clauseLabel(y), text: String(y.text || y.body || '').trim() }; });
    const NEW = cl.text.replace('45 days', '90 days');
    await h.client('erik').raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-CP1', at: new Date().toISOString(),
      negoProposed: [{ clauseId: cl.id, clauseLabel: cl.label, oldText: cl.text, newText: NEW, why: 'Our payment cycle' }] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await page.waitForFunction(() => (getContract('MK-CP1').changes || []).length, null, { timeout: 10000 });
    for (let i = 0; i < 60; i++){ const x = await W.admin.json('/api/contracts/MK-CP1'); if (x._roundPrep) break; await new Promise(r => setTimeout(r, 150)); }
    const key = roundPrepKey(cl.id, NEW);
    const redo = async note => { const r = await W.admin.raw('/api/agents/round/sendback', { method: 'POST', body: { contractId: 'MK-CP1', key, note } }); return r.status; };
    const openNego = async () => {
      await page.reload({ waitUntil: 'networkidle' });
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-CP1'), null, { timeout: 20000 });
      await page.keyboard.press('Escape').catch(() => {});
      await page.evaluate(async () => { const c = getContract('MK-CP1'); const x = await api('contracts/MK-CP1'); if (x && x._roundPrep) c._roundPrep = x._roundPrep; openRedlineWorkbench('MK-CP1'); });
      await page.waitForFunction(() => state.view === 'redline' && document.querySelector('[data-nego-accept]'), null, { timeout: 10000 });
      await page.waitForTimeout(500);
    };
    const look = () => page.evaluate(() => {
      const glows = [...document.querySelectorAll('.rl-glow')].map(b => b.getAttribute('data-nego-accept') ? 'accept' : b.getAttribute('data-nego-reject') ? 'reject' : b.hasAttribute('data-rl-cp-editor-change') ? 'counter' : b.hasAttribute('data-rl-review') ? 'review' : 'other');
      const g = document.querySelector('.rl-glow'); let top = null;
      if (g){ g.scrollIntoView({ block: 'center' }); const r = g.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); top = !!t && (t === g || g.contains(t)); }
      const sec = document.querySelector('.rl-sug'); const box = document.querySelector('.rl-sug-box');
      return { glows, top, sug: sec ? [...sec.classList].filter(k => /^rl-sug-/.test(k)).join(' ') : '', box: box ? box.textContent.trim() : '', boxNew: box ? [...box.querySelectorAll('.rl-sug-new')].map(e => e.textContent).join(' ') : '',
        notes: [...document.querySelectorAll('.rl-paper .gl-say, .rl-paper [class*="sug-say"]')].length,
        filed: (getContract('MK-CP1').changes || []).length, ring: g ? getComputedStyle(g).boxShadow : '' };
    });

    /* 1 counter */
    ok('0 the redo is answered', (await redo('Counter at 60 days.')) === 200);
    await openNego();
    let L = await look();
    ok('1a counter: Copilot\'s wording sits in a dashed box under theirs, 60 marked', /rl-sug-counter/.test(L.sug) && /60 days/.test(L.box) && /60/.test(L.boxNew), JSON.stringify(L));
    ok('1b only Counter glows, and nothing is filed', L.glows.join() === 'counter' && L.top && L.filed === 1, JSON.stringify({ g: L.glows, top: L.top, filed: L.filed }));
    ok('1c no note on the paper: Copilot\'s answer is said once, on the row', L.notes === 0 && /Copilot: counter/.test(await page.evaluate(() => (document.querySelector('.rl-card-prep') || {}).innerText || '')));
    await page.screenshot({ path: path.join(OUT, '1-counter.png') });
    /* 1d Home's Paper, Deal tab: the paper carries the box, the change's door glows */
    await page.evaluate(() => { setView('dashboard'); igWalk(['MK-CP1'], 0, {}); });
    await page.waitForFunction(() => window.intel && intel.paper && intel.paper.id === 'MK-CP1' && document.querySelector('#ig-dock [data-pd-tab="deal"]'), null, { timeout: 10000 }).catch(() => {});
    await page.click('#ig-dock [data-pd-tab="deal"]').catch(() => {});
    const home = await page.waitForFunction(() => document.querySelector('#ig-paper .rl-sug-box') && document.querySelector('#pd-body .rl-glow') ? { box: document.querySelector('#ig-paper .rl-sug-box').textContent.trim(), door: document.querySelector('#pd-body .rl-glow').textContent.trim() } : null, null, { timeout: 10000 }).then(x => x.jsonValue(), () => null);
    ok('1d on Home\'s Paper the box is drawn too, and the Deal tab\'s door glows', !!home && /60 days/.test(home.box) && /Answer on Negotiate/.test(home.door), JSON.stringify(home));
    await page.screenshot({ path: path.join(OUT, '1d-home.png') });
    await page.evaluate(() => openRedlineWorkbench('MK-CP1'));
    await page.waitForFunction(() => state.view === 'redline' && document.querySelector('.rl-glow'), null, { timeout: 10000 }).catch(() => {});
    /* 2 the press */
    await page.click('.rl-glow');
    const applied = await page.waitForFunction(() => /60 days/.test([...document.querySelectorAll('.rl-paper, [contenteditable]')].map(e => e.innerText).join(' ')) && !!document.querySelector('[data-ce-apply]'), null, { timeout: 10000 }).then(() => true, () => false);
    const filed2 = await page.evaluate(() => (getContract('MK-CP1').changes || []).length);
    ok('2 Counter opens the clause editor with the wording applied; nothing filed yet', applied && filed2 === 1, String(filed2));
    await page.screenshot({ path: path.join(OUT, '2-editor.png') });

    /* 3 reject */
    ok('3a the second redo is answered', (await redo('Reject it, 45 days stays.')) === 200);
    await openNego(); L = await look();
    ok('3b reject: a dashed line through their words, Reject alone glows', /rl-sug-reject/.test(L.sug) && !L.box && L.glows.join() === 'reject', JSON.stringify(L));
    await page.screenshot({ path: path.join(OUT, '3-reject.png') });
    await page.click('.rl-glow');
    const cancel = await page.waitForSelector('#prompt-overlay #pd-cancel', { timeout: 5000 }).then(() => true, () => false);
    if (cancel) await page.click('#prompt-overlay #pd-cancel');
    await page.waitForTimeout(400);
    ok('3c a press on it puts the glow out', (await page.evaluate(() => document.querySelectorAll('.rl-glow').length)) === 0);

    /* 4 accept */
    await redo('Accept their 90 days.');
    await openNego(); L = await look();
    const tick = await page.evaluate(() => { const i = document.querySelector('.rl-sug-accept ins:last-of-type, .rl-sug-accept .nego-ins:last-of-type'); return i ? getComputedStyle(i, '::after').content : ''; });
    ok('4 accept: a dashed tick, Accept alone glows', /rl-sug-accept/.test(L.sug) && /✓/.test(tick) && L.glows.join() === 'accept', JSON.stringify({ L, tick }));
    await page.screenshot({ path: path.join(OUT, '4-accept.png') });

    /* 5 ask a colleague */
    await redo('Ask a colleague in Finance.');
    await openNego(); L = await look();
    ok('5 ask a colleague: nothing on the paper, Ask for review glows', !L.sug && L.glows.join() === 'review', JSON.stringify(L));
    await page.screenshot({ path: path.join(OUT, '5-review.png') });

    /* 6 reduced motion */
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const anim = await page.evaluate(() => { const g = document.querySelector('.rl-glow'); return g ? getComputedStyle(g).animationName : 'none-found'; });
    ok('6 reduced motion: the ring stands still', anim === 'none', anim);

    /* 7 their page */
    const cp = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await cp.goto(h.base + '/#share=t:' + s.token, { waitUntil: 'networkidle' }); await cp.waitForTimeout(2500);
    await cp.evaluate(() => { if (typeof portalSetTab === 'function') portalSetTab('redlines'); }).catch(() => {}); await cp.waitForTimeout(1200);
    const theirs = await cp.evaluate(() => ({ sug: document.querySelectorAll('.rl-sug, .rl-sug-box').length, glow: document.querySelectorAll('.rl-glow').length }));
    ok('7 their page carries none of it', theirs.sug === 0 && theirs.glow === 0, JSON.stringify(theirs));
    ok('no page errors', !errs.length, errs.join(' | '));
  } catch (e) {
    ok('the stage ran', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close().catch(() => {});
    await h.stop().catch(() => {});
    await ai.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
