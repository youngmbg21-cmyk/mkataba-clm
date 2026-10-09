/* Chromium verification: THE PAPER READS — EDIT CLAUSE OPENS THE EDIT ROOM
   (Young, 9 Oct 2026: "you should not have the ability to edit a paper unless
   you are in the edit room … there should be a button or door available to
   bring you there"; he named it "Edit Clause"). Replaces click · type · save.
   ====================================================================
   On a real server, our seat and theirs:
     1  Negotiate draws no pen on the paper, its column takes no colour of its
        own; "Add a clause" still opens the editor on a new clause;
     2  a click in a clause's wording opens nothing to type in, takes no lock;
     3  "Edit clause" stands right of Focus, a press really reaches it, and it
        opens the clause editor on the clause being read (the first, at rest);
     4  scrolled down the paper, it opens the clause then at the top instead;
     5  a highlight still offers Edit with Copilot (the full editor);
     6  the Document tab is never edited: a Draft's blanks take no typing;
     7  at 820px Edit clause opens the clause panel instead;
     8  THEIR page: no pen, a click in their wording opens nothing, their
        Edit at the top is the door;
     9  no page errors.
   AT THE PARENT 2 and 8c fail (a click typed in place) and 3, 4 and 7 fail
   (no Edit clause button).

   Run: node test/chromium/edit-clause-door-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'edit-clause-door');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

let pass = 0, fail = 0;
const ok = (name, good, detail) => {
  good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const iso = n => new Date(Date.now() + n * 864e5).toISOString();
const FILL = ' Each party shall act in good faith, keep proper records and give the other reasonable notice of anything that may affect performance under this clause.';
const DOC = '1. Supply\nThe Supplier shall supply 5000 metric tonnes of raw milk.' + FILL.repeat(4)
  + '\n2. Price\nInvoices fall due within 45 days of receipt.' + FILL.repeat(4)
  + '\n3. Term\nThis Agreement runs for two years.' + FILL.repeat(4)
  + '\n4. Notices\nNotices go to the registered office.' + FILL.repeat(4)
  + '\n5. Law\nThe laws of Kenya govern this Agreement.' + FILL.repeat(4);
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

    /* ===== 1c. "ADD A CLAUSE" — a plain door for a new clause (review item) ===== */
    const add = await page.evaluate(() => ({ empty: !!document.querySelector('.redline-page .rl-empty-acts [data-rl-add-clause]:not([disabled])'),
      menu: document.querySelectorAll('.redline-page [data-rl-add-clause]').length }));
    ok('1c "Add a clause" sits beside "Edit a clause" in the empty column, and in the More menu', add.empty && add.menu >= 2, JSON.stringify(add));
    if (add.empty) {
      await page.click('.redline-page .rl-empty-acts [data-rl-add-clause]');
      const opened = await until(page, () => !!document.querySelector('#clause-editor') && typeof ceIsNew === 'function' && ceIsNew(), null, 5000);
      ok('1d it opens the clause editor on a new clause', !!opened);
      await page.evaluate(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); });
      await page.waitForTimeout(400);
    } else ok('1d it opens the clause editor on a new clause', false, 'no door');

    /* ===== 2. A CLICK IN THE WORDING OPENS NOTHING ===== */
    const at = await endOf(page, sec(ids[1]));
    if (at) await page.mouse.click(at.x, at.y);
    await page.waitForTimeout(500);
    const s2 = await page.evaluate(id => { const c = getContract('MK-CT1');
      return { box: !!document.querySelector('.redline-page .rl-inline-box, .redline-page .rl-paper [contenteditable="true"]'),
        acts: !!document.querySelector('.rl-inline-acts'), lock: !!(c.locks && c.locks[id]),
        editor: !!document.querySelector('#clause-editor') }; }, ids[1]);
    ok('2 a click in the wording opens nothing to type in, takes no lock', !!at && !s2.box && !s2.acts && !s2.lock && !s2.editor, JSON.stringify(s2));

    /* ===== 3. EDIT CLAUSE, RIGHT OF FOCUS ===== */
    const s3 = await page.evaluate(() => {
      const b = document.querySelector('.redline-page .rl-head [data-rl-edit-clause]');
      const f = document.querySelector('.redline-page .rl-head .rl-focus-door');
      if (!b || !f) return { b: !!b, f: !!f };
      const r = b.getBoundingClientRect(), rf = f.getBoundingClientRect();
      const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { b: true, f: true, text: b.textContent.trim(), to: b.getAttribute('data-rl-edit-clause'), disabled: b.disabled,
        right: r.left >= rf.right - 1 && Math.abs((r.top + r.height / 2) - (rf.top + rf.height / 2)) < 4,
        painted: !!hit && (hit === b || b.contains(hit)) };
    });
    ok('3a "Edit clause" stands right of Focus, live, and a press reaches it',
      !!s3.b && s3.text === 'Edit clause' && s3.to === 'editor' && !s3.disabled && s3.right && s3.painted, JSON.stringify(s3));
    await page.screenshot({ path: path.join(OUT, '3-edit-clause.png') });
    const want3 = await page.evaluate(() => rlClauseInView(document.querySelector('.redline-page')));
    if (s3.b) await page.click('.redline-page .rl-head [data-rl-edit-clause]');
    const got3 = await until(page, () => { const sel = document.querySelector('#clause-editor #ce-pick-sel'); return sel ? String(sel.value) : null; }, null, 5000);
    ok('3b it opens the clause editor on the clause being read', !!want3 && got3 === want3, `${got3} vs ${want3}`);
    await page.evaluate(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); });
    await until(page, () => !document.querySelector('#clause-editor'), null, 4000);
    await until(page, () => !!document.querySelector('.redline-page .rl-paper [data-nego-working]'), null, 6000);

    /* ===== 4. SCROLLED DOWN, IT OPENS THE CLAUSE AT THE TOP ===== */
    const s4 = await page.evaluate(id => {
      const sc = document.getElementById('nego-scroll-work'); const el = document.querySelector(`.redline-page .rl-paper [data-nego-working="${id}"]`);
      if (!sc || !el) return null;
      sc.scrollTo({ top: sc.scrollTop + el.getBoundingClientRect().top - sc.getBoundingClientRect().top + 4, behavior: 'instant' });
      return true;
    }, ids[ids.length - 2]) && await until(page, id => { const v = rlClauseInView(document.querySelector('.redline-page')); return v === id ? v : null; }, ids[ids.length - 2], 3000)
      || await page.evaluate(() => rlClauseInView(document.querySelector('.redline-page')));
    ok('4a scrolled down, the clause being read is that clause', s4 === ids[ids.length - 2], `${s4} vs ${ids[ids.length - 2]}`);
    await page.click('.redline-page .rl-head [data-rl-edit-clause]');
    const got4 = await until(page, () => { const sel = document.querySelector('#clause-editor #ce-pick-sel'); return sel ? String(sel.value) : null; }, null, 5000);
    ok('4b and Edit clause opens it there', got4 === ids[ids.length - 2], `${got4}`);
    await page.evaluate(() => { if (window.rlCloseClauseEditor) rlCloseClauseEditor(); });
    await until(page, () => !document.querySelector('#clause-editor'), null, 4000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(400);

    /* ===== 5. A HIGHLIGHT STILL OFFERS EDIT WITH COPILOT ===== */
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
    ok('5 a highlight still offers Edit with Copilot', /Edit with Copilot/i.test(s6 || ''), s6);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => getSelection().removeAllRanges());

    /* ===== 6. THE DOCUMENT TAB IS NEVER EDITED ===== */
    await page.evaluate(() => { openWorkspace('MK-CT2'); });
    await page.waitForTimeout(1200);
    await page.evaluate(() => roomGoTab(getContract('MK-CT2'), 'document'));
    const s7 = await until(page, () => { const cv = document.getElementById('doc-canvas'); if (!cv) return null;
      const boxes = [...cv.querySelectorAll('input, textarea')]; if (!boxes.length) return null;
      const bg = getComputedStyle(cv.closest('.pg-sheet').parentElement).backgroundColor;
      return { n: boxes.length, ro: boxes.every(b => b.readOnly), key: boxes[0].getAttribute('data-field') || boxes[0].getAttribute('data-sync'), bg }; }, null, 8000);
    ok('6a a Draft\'s blanks on the Document tab paper take no typing', !!s7 && s7.ro, JSON.stringify(s7));
    if (s7) {
      await page.evaluate(() => { const b = document.querySelector('#doc-canvas input'); b.scrollIntoView({ block: 'center' }); });
      const r = await page.evaluate(() => { const b = document.querySelector('#doc-canvas input').getBoundingClientRect(); return { x: b.left + 4, y: b.top + b.height / 2 }; });
      await page.mouse.click(r.x, r.y);
      const s7b = await until(page, () => { const a = document.activeElement; return a && a.closest && a.closest('#tplform-section') ? (a.getAttribute('data-blankf') || a.getAttribute('data-tplf') || a.tagName) : null; }, null, 3000);
      ok('6b a press on one goes to its box in the side panel\'s form', !!s7b, s7b);
    } else ok('6b a press on one goes to its box in the side panel\'s form', false, 'no blanks');
    await page.screenshot({ path: path.join(OUT, '7-document.png') });

    /* ===== 7. A TABLET (820px) ===== */
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.evaluate(() => openRedlineWorkbench('MK-CT1'));
    await until(page, () => !!document.querySelector('.redline-page .rl-paper [data-nego-working]'), null, 8000);
    const s7c = await until(page, id => { if (window.rlCpSetShown) rlCpSetShown(document.querySelector('.redline-page') || document, id);
      const b = document.querySelector(`.rl-cp-src[data-rl-cp-for="${id}"] .rl-cp-act-ai`);
      return b ? { disabled: b.disabled, title: b.getAttribute('title') || '', door: b.hasAttribute('data-nego-ai-clause') } : null; }, ids[0], 5000);
    ok('7a at 820px the clause panel\'s Edit with Copilot is greyed with the reason, not offered then refused',
      !!s7c && s7c.disabled && /too narrow/i.test(s7c.title) && !s7c.door, JSON.stringify(s7c));
    await page.evaluate(() => { if (window.rlCpSetShown) rlCpSetShown(document.querySelector('.redline-page') || document, null); });
    const to7 = await page.evaluate(() => { const b = document.querySelector('.redline-page [data-rl-edit-clause]'); return b ? b.getAttribute('data-rl-edit-clause') : null; });
    if (to7) await page.evaluate(() => document.querySelector('.redline-page [data-rl-edit-clause]').click());
    const panel7 = await until(page, () => !!(window.rlCpOpenId && rlCpOpenId()) && !document.querySelector('#clause-editor'), null, 4000);
    ok('7b at 820px Edit clause opens the clause panel instead', to7 === 'panel' && !!panel7, `${to7} ${panel7}`);
    await page.setViewportSize({ width: 1440, height: 900 });

    /* ===== 8. THEIR PAGE: THE PAPER READS; EDIT AT THE TOP IS THE DOOR ===== */
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
      await cp.waitForTimeout(500);
      const box8 = await cp.evaluate(() => !!document.querySelector('.redline-page .rl-inline-box, .redline-page .rl-paper [contenteditable="true"]'));
      ok('8c a click in their wording opens nothing to type in', !!at8 && !box8);
      const edit8 = await cp.evaluate(() => { const b = document.getElementById('pt-edit'); return b ? b.textContent.trim() : null; });
      ok('8d their Edit at the top is the door', /Edit/.test(edit8 || ''), edit8);
      await cp.screenshot({ path: path.join(OUT, '8-their-page.png') });
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
