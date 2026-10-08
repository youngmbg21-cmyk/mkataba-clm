/* Chromium verification: NO PEN ON THE PAPER — CLICK, TYPE, SAVE (Young said
   "go", 9 Oct 2026 — the Paper and Counter review, changes 3 and 5).
   ====================================================================
   On a real server, our seat and theirs:
     1  Negotiate draws no pen on the paper, and its paper column takes no
        colour of its own (change 3);
     2  a click in a clause's wording puts the caret there and nothing else
        changes — no outline, no Discard · Save, no lock;
     3  the first keystroke: the dashed outline, Discard · Save at the clause's
        top right, the clause lock taken; the words typed are marked as added;
     4  Save files through the funnel: our draft on the record, NOT sent, the
        lock let go, the box gone;
     5  a clause a colleague holds does not open: its sign and "Ask for it"
        stand where Save would be;
     6  a highlight still offers Edit with Copilot (the full editor);
     7  the Document tab is never edited: a Draft's blanks on the paper take no
        typing, and a press on one goes to its box in the side panel's form;
     8  THEIR page: click, type, Save — which asks "Why this change?";
     9  no page errors.
   Gated on what each claim measures; waits ask for the state, bounded.
   AT THE PARENT (6a709b6) 1 (the pen is drawn; the column is grey), 2, 3, 4,
   7 and 8 fail: a press in the wording did nothing.

   Run: node test/chromium/click-type-save-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'click-type-save');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const DOC = '1. Supply\nThe Supplier shall supply 5000 metric tonnes of raw milk.\n2. Price\nInvoices fall due within 45 days of receipt.\n3. Term\nThis Agreement runs for two years.';
const until = async (page, fn, arg, ms = 8000) => { let v; const t0 = Date.now();
  while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(150); }
  return v; };
/* The point at the end of a clause's last words, on the page. */
const endOf = (page, sel) => page.evaluate(sel => {
  const sec = document.querySelector(sel); if (!sec) return null;
  const w = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT, { acceptNode: n => (n.parentElement.closest('.rl-clause-top, del') || !n.data.trim()) ? 2 : 1 });
  let last = null, t; while ((t = w.nextNode())) last = t;
  if (!last) return null;
  const r = document.createRange(); r.setStart(last, last.data.trimEnd().length - 1); r.setEnd(last, last.data.trimEnd().length);
  const b = r.getBoundingClientRect(); return { x: Math.round(b.right - 1), y: Math.round(b.top + b.height / 2) };
}, sel);

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    const c0 = fixtureContract('MK-CT1', 'Raw Material Supply Agreement', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
    Object.assign(c0, { owner: { id: me.id, name: me.name }, negotiation: { round: 1, turn: 'owner', turnAt: iso(-1), rounds: [] } });
    await W.admin.json('/api/contracts/MK-CT1', { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
    const d0 = fixtureContract('MK-CT2', 'Raw Material Supply — Draft', 'Nandi Dairy', FOLDER_A, 900000, 'Draft');
    Object.assign(d0, { owner: { id: me.id, name: me.name } });
    await W.admin.json('/api/contracts/MK-CT2', { method: 'PUT', body: { contract: d0, baseVersion: 0 } });

    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errs.push('owner: ' + String(e).slice(0, 200)));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-CT1'), null, { timeout: 20000 });
    await page.waitForTimeout(1500); await page.keyboard.press('Escape').catch(() => {});
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) { await en.click(); await page.waitForTimeout(300); }
    const ids = await page.evaluate(async () => { const c = getContract('MK-CT1'); if (window.ensureFull) await ensureFull(c);
      return negoClauseList(c).map(x => x.clauseId); });
    await page.evaluate(() => openRedlineWorkbench('MK-CT1'));
    await until(page, () => !!document.querySelector('.redline-page .rl-paper [data-nego-working]'), null, 10000);
    const sec = id => `.redline-page .rl-paper [data-nego-working="${id}"]`;

    /* ===== 1. NO PEN, NO GREY SHEET ===== */
    const p1 = await page.evaluate(() => {
      const paper = document.querySelector('.redline-page .rl-paper');
      const grid = document.querySelector('.redline-page #rl-grid');
      return { pens: paper.querySelectorAll('.rl-cp-pill, [data-rl-cp-editor]').length,
        grid: grid ? getComputedStyle(grid).backgroundColor : null,
        root: getComputedStyle(document.querySelector('.redline-page #nego-root') || document.body).backgroundColor };
    });
    ok('1a no pen on the paper', p1.pens === 0, String(p1.pens));
    ok('1b the paper\'s column takes no colour of its own (Negotiate)', p1.grid === 'rgba(0, 0, 0, 0)' && p1.root === 'rgba(0, 0, 0, 0)', JSON.stringify(p1));

    /* ===== 2. A CLICK PUTS THE CARET THERE, NOTHING ELSE ===== */
    const at = await endOf(page, sec(ids[1]));
    if (at) await page.mouse.click(at.x, at.y);
    const s2 = await until(page, id => { const box = document.querySelector('.redline-page .rl-inline-box'); if (!box) return null;
      const c = getContract('MK-CT1');
      return { focus: document.activeElement === box, inClause: !!box.closest(`[data-nego-working="${id}"]`),
        outline: box.closest('.rl-clause').classList.contains('rl-inline-typing'), acts: !!document.querySelector('.rl-inline-acts'),
        lock: !!(c.locks && c.locks[id]) }; }, ids[1], 4000);
    ok('2a a click in the wording puts the caret in that clause', !!s2 && s2.focus && s2.inClause, JSON.stringify(s2));
    ok('2b before a keystroke: no outline, no Discard · Save, no lock', !!s2 && !s2.outline && !s2.acts && !s2.lock, JSON.stringify(s2));
    await page.screenshot({ path: path.join(OUT, '2-caret.png') });

    /* ===== 3. THE FIRST KEYSTROKE ===== */
    if (s2) await page.keyboard.type(' Late payments carry interest');
    const s3 = await until(page, id => { const box = document.querySelector('.redline-page .rl-inline-box'); if (!box) return null;
      const sec = box.closest('.rl-clause'); const acts = sec.querySelector('.rl-clause-top .rl-inline-acts');
      const ins = [...box.querySelectorAll('ins')].map(x => x.textContent).join('|');
      if (!/Late payments/.test(ins)) return null;
      const c = getContract('MK-CT1'); const me = currentUser();
      return { outline: getComputedStyle(sec).outlineStyle, acts: acts ? acts.textContent.replace(/\s+/g, ' ').trim() : null, ins,
        lock: !!(c.locks && c.locks[id] && String(c.locks[id].by.id) === String(me.id)) }; }, ids[1], 5000);
    ok('3a the outline is dashed once you type', !!s3 && s3.outline === 'dashed', s3 && s3.outline);
    ok('3b Discard · Save at the clause\'s top right', !!s3 && /Discard/.test(s3.acts || '') && /Save/.test(s3.acts || ''), s3 && s3.acts);
    ok('3c the words typed are marked as added', !!s3 && /Late payments carry interest/.test(s3.ins), s3 && s3.ins);
    ok('3d the clause lock is taken on the first keystroke', !!s3 && s3.lock);
    await page.screenshot({ path: path.join(OUT, '3-typing.png') });

    /* ===== 4. SAVE FILES THROUGH THE FUNNEL, NOTHING SENT ===== */
    if (s3) await page.click('.rl-inline-acts [data-rl-inline="save"]');
    const s4 = await until(page, id => { const c = getContract('MK-CT1');
      const ch = (c.changes || []).find(x => x.authorSide === 'owner' && x.clauseId === id && x.status === 'pending');
      if (!ch) return null;
      return { newText: ch.newText, sent: !!ch.sentAt, box: !!document.querySelector('.redline-page .rl-inline-box'),
        lock: !!(c.locks && c.locks[id]) }; }, ids[1], 6000);
    ok('4a Save files our draft through the funnel', !!s4 && /Late payments carry interest/.test(s4.newText || ''), s4 && s4.newText);
    ok('4b it is not sent', !!s4 && !s4.sent);
    ok('4c the box is gone and the lock let go', !!s4 && !s4.box && !s4.lock, JSON.stringify(s4));
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (window.closeContextPanel) try { closeContextPanel(); } catch (_) {} });
    await page.waitForTimeout(400);

    /* ===== 5. A COLLEAGUE HOLDS THE CLAUSE ===== */
    await page.evaluate(id => { const c = getContract('MK-CT1'); c.locks = c.locks || {};
      c.locks[id] = { by: { id: 'u-rose', name: 'Rose Chebet' }, at: new Date().toISOString() }; renderRedline(); }, ids[2]);
    await until(page, id => !!document.querySelector(`[data-nego-working="${id}"] .rl-cp-lock`), ids[2], 4000);
    const at5 = await endOf(page, sec(ids[2]));
    if (at5) await page.mouse.click(at5.x, at5.y);
    await page.waitForTimeout(500);
    const s5 = await page.evaluate(id => { const s = document.querySelector(`.redline-page .rl-paper [data-nego-working="${id}"]`);
      return { box: !!s.querySelector('.rl-inline-box'), sign: (s.querySelector('.rl-clause-top .rl-cp-lock') || {}).textContent || '',
        ask: !!s.querySelector('.rl-clause-top [data-rl-lock-ask]') }; }, ids[2]);
    ok('5 a held clause does not open; its sign and "Ask for it" stand where Save would be', !s5.box && /Rose|RC/.test(s5.sign) && s5.ask, JSON.stringify(s5));
    await page.evaluate(id => { const c = getContract('MK-CT1'); delete c.locks[id]; renderRedline(); }, ids[2]);

    /* ===== 6. A HIGHLIGHT STILL OFFERS EDIT WITH COPILOT ===== */
    const s6 = await page.evaluate(async id => {
      const s = document.querySelector(`.redline-page .rl-paper [data-nego-working="${id}"]`);
      const t = [...s.querySelectorAll('p, div')].map(e => e.firstChild).find(n => n && n.nodeType === 3 && n.data.length > 12);
      if (!t) return 'no text';
      const r = document.createRange(); r.setStart(t, 4); r.setEnd(t, 12);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
      t.parentElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      await new Promise(res => setTimeout(res, 500));
      const m = document.querySelector('.nego-selmenu');
      return m ? m.textContent.replace(/\s+/g, ' ').trim() : null;
    }, ids[0]);
    ok('6 a highlight still offers Edit with Copilot', /Edit with Copilot/i.test(s6 || ''), s6);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => getSelection().removeAllRanges());

    /* ===== 7. THE DOCUMENT TAB IS NEVER EDITED ===== */
    await page.evaluate(() => { openWorkspace('MK-CT2'); });
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-CT2'), 'document'));
    const s7 = await until(page, () => { const cv = document.getElementById('doc-canvas'); if (!cv) return null;
      const boxes = [...cv.querySelectorAll('input, textarea')]; if (!boxes.length) return null;
      const bg = getComputedStyle(cv.closest('.pg-sheet').parentElement).backgroundColor;
      return { n: boxes.length, ro: boxes.every(b => b.readOnly), key: boxes[0].getAttribute('data-field') || boxes[0].getAttribute('data-sync'), bg }; }, null, 8000);
    ok('7a a Draft\'s blanks on the Document tab paper take no typing', !!s7 && s7.ro, JSON.stringify(s7));
    if (s7) {
      await page.evaluate(() => { const b = document.querySelector('#doc-canvas input'); b.scrollIntoView({ block: 'center' }); });
      const r = await page.evaluate(() => { const b = document.querySelector('#doc-canvas input').getBoundingClientRect(); return { x: b.left + 4, y: b.top + b.height / 2 }; });
      await page.mouse.click(r.x, r.y);
      const s7b = await until(page, () => { const a = document.activeElement; return a && a.closest && a.closest('#tplform-section') ? (a.getAttribute('data-blankf') || a.getAttribute('data-tplf') || a.tagName) : null; }, null, 3000);
      ok('7b a press on one goes to its box in the side panel\'s form', !!s7b, s7b);
    } else ok('7b a press on one goes to its box in the side panel\'s form', false, 'no blanks');
    await page.screenshot({ path: path.join(OUT, '7-document.png') });

    /* ===== 8. THEIR PAGE: CLICK, TYPE, SAVE — "WHY THIS CHANGE?" ===== */
    const tok = await page.evaluate(async () => {
      const full = await api('contracts/MK-CT1');
      const payload = buildSharePayload(full, await sha256(canonicalDoc(full)), null, { purpose: 'negotiate' });
      const r = await api('shares', 'POST', { payload, channel: 'link', recipient: { name: 'Erik Kiprop', email: 'erik@nandi.example' }, purpose: 'negotiate', durable: true });
      return r && r.token || null;
    });
    ok('8a a negotiate link for their seat', !!tok);
    if (tok) {
      const cp = await ctx.newPage();
      cp.on('pageerror', e => errs.push('counterparty: ' + String(e).slice(0, 200)));
      await cp.goto(h.base + '/#share=t:' + tok, { waitUntil: 'networkidle' });
      await until(cp, () => !!document.querySelector('.redline-page .rl-paper [data-nego-working]'), null, 12000);
      await cp.evaluate(() => { const t = document.querySelector('[data-pt-tab="redlines"], [data-pt-go="redlines"]'); if (t) t.click(); });
      await cp.waitForTimeout(600);
      const cpIds = await cp.evaluate(() => [...document.querySelectorAll('.redline-page .rl-paper [data-nego-working]')].map(s => s.getAttribute('data-nego-working')));
      const pens = await cp.evaluate(() => document.querySelectorAll('.redline-page .rl-paper .rl-cp-pill').length);
      ok('8b no pen on their paper either', pens === 0, String(pens));
      const sel3 = `.redline-page .rl-paper [data-nego-working="${cpIds[2]}"]`;
      await cp.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel3);
      const at8 = await endOf(cp, sel3);
      if (at8) await cp.mouse.click(at8.x, at8.y);
      const box8 = await until(cp, () => document.activeElement && document.activeElement.classList.contains('rl-inline-box'), null, 4000);
      ok('8c a click in their wording puts the caret there', !!box8);
      if (box8) {
        await cp.keyboard.type(', renewable by agreement');
        await until(cp, () => !!document.querySelector('.rl-inline-acts [data-rl-inline="save"]'), null, 3000);
        await cp.click('.rl-inline-acts [data-rl-inline="save"]');
        const ask = await until(cp, () => { const m = (document.body.innerText || '').match(/Why this change[^\n]*/); return m ? m[0] : null; }, null, 5000);
        ok('8d their Save asks "Why this change?"', !!ask, ask);
        const held = await cp.evaluate(() => { const side = document.querySelector('.redline-page #rl-side'); const send = document.querySelector('.redline-page .rl-unsent-go');
          return (side ? side.innerText.replace(/\s+/g, ' ') : '') + ' || ' + (send ? send.textContent.trim() : ''); });
        ok('8e their change is held on their page until they send', /renewable by agreement/.test(held) && /not sent/i.test(held), held.slice(0, 200));
        await cp.screenshot({ path: path.join(OUT, '8-their-save.png') });
      }
    }
    ok('9 no page errors', errs.length === 0, errs.join(' | '));
  } catch (e) {
    ok('run', false, e && e.stack ? e.stack.slice(0, 500) : String(e));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
