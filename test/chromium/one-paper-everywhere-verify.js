/* ============================================================
   ONE PAPER EVERYWHERE — THE HOME PAPER (owner, 8 Oct 2026: "i am choosing
   the home paper" … "the background also needs to be exactly like the home
   page redlined version. No differences at all"; and Focus off Home's Paper)
   ============================================================
   One contract (two open asks of theirs), five screens: Home Redlined (the
   reference), Home Clean, the Document tab, the Negotiate page, their page.
     1  every screen's paper equals the reference: ground colour, gap above
        the sheet, sheet width, shadow, title, first clause heading position
        and type, body type, colour and indent; no corner marks
     2  Home Clean is the same canvas without marks (zero del/ins, no step
        labels, the standing wording) — Clean ⇄ Redlined does not move the page
     3  Home's Paper strip has no Focus
   AT THE PARENT 1–3 FAIL (Document 860 wide, Negotiate 850 with 15px type and
   pills, Home Clean the Document sheet, Focus on the strip).
   ============================================================ */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++; console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const DOC = ['RAW MATERIAL SUPPLY AGREEMENT', '', '1. Supply', '', 'The Supplier shall supply an estimated 5000 metric tonnes per annum.', '',
  '2. Price & Contract Value', '', 'Prices are exclusive of VAT and invoices fall due within 45 days of receipt.', '',
  '3. Governing Law', '', 'This Agreement is governed by the laws of Kenya.'].join('\n');
const M = () => {
  const sheet = document.querySelector('#ig-canvas article.nego-doc') || document.querySelector('.redline-page article.nego-doc')
    || [...document.querySelectorAll('.pg-sheet.pg-work')].find(e => e.getBoundingClientRect().width > 300);
  if (!sheet) return null;
  const r = sheet.getBoundingClientRect(); let g = null;
  for (let e = sheet.parentElement; e; e = e.parentElement){ const bg = getComputedStyle(e).backgroundColor; if (bg && bg !== 'rgba(0, 0, 0, 0)'){ g = e; break; } }
  const t = sheet.querySelector('h1, h3.rl-paper-title');
  const h = [...sheet.querySelectorAll('h2,h3,h4')].find(e => /^1\.\s*Supply/.test(e.textContent.trim()));
  const b = [...sheet.querySelectorAll('p,div')].find(e => /^The Supplier shall/.test(e.textContent.trim()) && e.children.length < 3);
  const cs = e => getComputedStyle(e);
  return { ground: g ? cs(g).backgroundColor : null, gap: g ? Math.round(r.top - g.getBoundingClientRect().top) : null, w: Math.round(r.width), shadow: cs(sheet).boxShadow,
    title: t ? [Math.round(t.getBoundingClientRect().top - r.top), cs(t).fontSize, cs(t).fontWeight].join('/') : null,
    head: h ? [Math.round(h.getBoundingClientRect().top - r.top), Math.round(h.getBoundingClientRect().left - r.left), cs(h).fontSize, cs(h).fontWeight].join('/') : null,
    body: b ? [cs(b).fontSize, cs(b).lineHeight, cs(b).color, Math.round(b.getBoundingClientRect().left - r.left)].join('/') : null,
    corners: [...sheet.querySelectorAll('.pg-corner')].filter(e => cs(e).display !== 'none').length,
    marks: sheet.querySelectorAll('del, ins, .rl-line-del').length, rungs: [...sheet.querySelectorAll('.rl-rung')].filter(e => cs(e).display !== 'none').length,
    text: sheet.innerText };
};
(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { contracts: [], approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const c = fixtureContract('MK-OP1', 'Raw Material Supply Agreement', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
    c.owner = { id: me.id, name: me.name };
    await W.admin.json('/api/contracts/MK-OP1', { method: 'PUT', body: { contract: c, baseVersion: 0 } });
    const s = await W.admin.json('/api/shares', { method: 'POST', body: { durable: true, channel: 'link', purpose: 'negotiate', recipient: { name: 'Erik', email: 'erik@nandi.example' },
      payload: { v: 1, kind: 'hati-share', org: 'Highland', sharedBy: 'Amina', at: new Date().toISOString(), docHash: 'h1', purpose: 'negotiate', purposeChosen: 'negotiate',
        contract: { id: 'MK-OP1', name: 'Raw Material Supply Agreement', counterparty: 'Nandi Dairy', fields: {}, redlineText: DOC, format: 'text', docText: DOC, versions: [] } } } });
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    page.on('pageerror', e => errs.push(String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    if (await page.$('#li-email')) { await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go'); }
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-OP1'), null, { timeout: 20000 });
    await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    const cl = await page.evaluate(async () => { const c = getContract('MK-OP1'); if (c._light && typeof ensureFull === 'function') await ensureFull(c);
      const L = negoClauseList(c); const f = re => { const y = L.find(k => re.test(k.text || k.body || '')); return { id: y.clauseId, label: clauseLabel(y), text: String(y.text || y.body || '').trim() }; };
      return { pay: f(/45 days/), law: f(/laws of Kenya/) }; });
    await h.client('erik').raw('/api/shares/' + s.token + '/respond', { method: 'POST', body: { kind: 'hati-response', action: 'decisions', decisions: [], name: 'Erik', id: 'MK-OP1', at: new Date().toISOString(),
      negoProposed: [{ clauseId: cl.pay.id, clauseLabel: cl.pay.label, oldText: cl.pay.text, newText: cl.pay.text.replace('45 days', '90 days') },
        { clauseId: cl.law.id, clauseLabel: cl.law.label, oldText: cl.law.text, newText: cl.law.text.replace('Kenya', 'Sweden') }] } });
    await page.evaluate(async () => { await pollPendingResponses(); });
    await page.waitForFunction(() => (getContract('MK-OP1').changes || []).length >= 2, null, { timeout: 10000 });
    const at = async (prep, pg = page) => { await prep(); await pg.waitForTimeout(1500); return pg.evaluate(M); };
    const out = {};
    out.homeRed = await at(async () => { await page.evaluate(() => { setView('dashboard'); igWalk(['MK-OP1'], 0, {}); }); await page.waitForTimeout(1500); await page.evaluate(() => document.querySelector('#ig-strip [data-ig-red="1"]').click()); });
    const focus = await page.evaluate(() => !!document.querySelector('#ig-strip [data-ig-focus]'));
    out.homeClean = await at(async () => { await page.evaluate(() => document.querySelector('#ig-strip [data-ig-red="0"]').click()); });
    out.document = await at(async () => { await page.evaluate(() => openWorkspace('MK-OP1')); await page.waitForTimeout(1200); await page.evaluate(() => roomGoTab('contract')); });
    out.negotiate = await at(async () => { await page.evaluate(() => openRedlineWorkbench('MK-OP1')); });
    const cp = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
    await cp.goto(h.base + '/#share=t:' + s.token, { waitUntil: 'networkidle' }); await cp.waitForTimeout(2500);
    out.theirs = await at(async () => { await cp.evaluate(() => { if (typeof portalSetTab === 'function') portalSetTab('redlines'); }).catch(() => {}); }, cp);

    const ref = out.homeRed;
    const keys = ['ground', 'gap', 'w', 'shadow', 'title', 'head', 'body', 'corners'];
    for (const k of ['homeClean', 'document', 'negotiate', 'theirs']){
      const v = out[k]; const diff = v ? keys.filter(q => v[q] !== ref[q]).map(q => `${q}: ${v[q]} ≠ ${ref[q]}`) : ['no paper'];
      ok(`1 ${k}: the same paper as Home Redlined`, !diff.length, diff.join(' | ') || null);
    }
    ok('2 Home Clean: the same canvas, no marks, no step labels, the standing wording', out.homeClean && out.homeClean.marks === 0 && out.homeClean.rungs === 0
      && /45 days/.test(out.homeClean.text) && !/90 days/.test(out.homeClean.text), JSON.stringify({ marks: out.homeClean && out.homeClean.marks, rungs: out.homeClean && out.homeClean.rungs }));
    ok('3 Home\'s Paper strip has no Focus', !focus);
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
