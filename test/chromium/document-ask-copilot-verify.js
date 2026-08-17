/* Chromium verification: HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT
   ============================================================
   (owner-asked 17 Aug 2026.) Highlight a sentence on the Document page and a
   menu appears beside it — Simplify and Ask Copilot — and both actions talk in
   the Copilot panel and never write to the contract.

   WHY A BROWSER FILE: the menu is anchored to a selection RECTANGLE, and jsdom
   ranges have no geometry — getBoundingClientRect on a jsdom range is zeros,
   so the node test can only prove the routing. Whether a real drag on the real
   paper raises a visible menu in the right place is answerable only here.

   The harness runs with the AI STUB connected (startHati wires
   ANTHROPIC_BASE_URL to a canned provider that echoes whatever tool it is
   offered), and the generic chat loop does not converge on that echo — so the
   ask is stubbed AT THE BROWSER BOUNDARY (copilotAsk) and what this file
   asserts is the whole visible journey: highlight → menu → panel → the quote →
   an answer in the stream — plus that nothing was written. The transport is
   the same chat door every panel question uses; f211 pins the request's shape
   (full passage, no-edits brief) and the no-key refusal in the node suite.

   Run: node test/chromium/document-ask-copilot-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'document-ask-copilot');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2200);

    /* A template-built contract, on its Document tab. */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.template && x.status !== 'Declined');
      state.activeId = c.id; state.selId = c.id; setView('workspace');
      if (window.roomGoTab) roomGoTab(c, 'docs');
      return c.id;
    });
    await page.waitForTimeout(900);
    const before = await page.evaluate(() =>
      state.contracts.map(c => (c.changes || []).length).join(','));

    /* ---- 1. a real highlight raises the menu, beside the words ---- */
    const raised = await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      if (!canvas) return { err: 'no canvas' };
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      let node = null;
      while ((node = walker.nextNode()))
        if (node.textContent.trim().length > 50 && !node.parentElement.closest('input,textarea,button')) break;
      if (!node) return { err: 'no sentence to select' };
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, Math.min(60, node.textContent.length));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return { picked: sel.toString().slice(0, 40) };
    });
    await page.waitForTimeout(250);
    const menu = await page.evaluate(() => {
      const m = document.querySelector('.nego-selmenu');
      if (!m) return null;
      const r = m.getBoundingClientRect();
      return { on: r.width > 0 && r.height > 0, left: Math.round(r.left), top: Math.round(r.top),
        labels: [...m.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim()) };
    });
    check('1 the highlight raises the menu, as visible pixels',
      !!menu && menu.on, JSON.stringify(menu) + ' · picked "' + (raised.picked || raised.err) + '"');
    check('1 with the two actions the owner chose',
      !!menu && menu.labels.length === 2 && /Simplify/.test(menu.labels[0]) && /Ask Copilot/.test(menu.labels[1]),
      menu && menu.labels.join(' | '));
    await page.screenshot({ path: path.join(OUT, '01-menu.png') });

    /* ---- 2. Simplify opens the panel and the answer lands in the stream ---- */
    await page.evaluate(() => {
      /* The server's own response shape — aiRenderServerAnswer reads .answer. */
      window.copilotAsk = async () => ({ answer: 'A plain version: the supplier delivers the goods.' });
      const b = document.querySelector('.nego-selmenu [data-nego-ai="simplify"]');
      b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    /* Long enough for the stubbed provider round trip. */
    await page.waitForTimeout(1200);
    const panel = await page.evaluate(() => {
      const p = document.getElementById('ai-panel');
      const open = !!p && p.classList.contains('open');
      const feed = (document.getElementById('ai-feed') || p || {}).textContent || '';
      return { open, gone: !document.querySelector('.nego-selmenu'),
        quoted: /Simplify/.test(feed), answered: /A plain version/i.test(feed) };
    });
    check('2 the press closes the menu and opens the Copilot panel',
      panel.open && panel.gone, JSON.stringify(panel));
    check('2 the ask is quoted in the reader\'s own stream', panel.quoted);
    check('2 AND THE ANSWER LANDS IN THE STREAM', panel.answered);
    await page.screenshot({ path: path.join(OUT, '02-simplify-panel.png') });

    /* ---- 3. Ask Copilot asks for the inquiry ---- */
    await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      let node = null;
      while ((node = walker.nextNode())) if (node.textContent.trim().length > 50) break;
      const range = document.createRange();
      range.setStart(node, 0); range.setEnd(node, 40);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    await page.waitForTimeout(250);
    await page.evaluate(() => {
      const b = document.querySelector('.nego-selmenu [data-nego-ai="ask"]');
      if (b) b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    await page.waitForTimeout(400);
    const asked = await page.evaluate(() => {
      const feed = (document.getElementById('ai-feed') || document.getElementById('ai-panel') || {}).textContent || '';
      return { greeted: /What would you like to know/i.test(feed) };
    });
    check('3 Ask Copilot asks for the inquiry in the panel', asked.greeted);

    /* ---- 4. Escape dismisses; nothing was written anywhere ---- */
    await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      let node = null;
      while ((node = walker.nextNode())) if (node.textContent.trim().length > 50) break;
      const range = document.createRange();
      range.setStart(node, 0); range.setEnd(node, 30);
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      canvas.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    });
    await page.waitForTimeout(250);
    const hadMenu = await page.evaluate(() => !!document.querySelector('.nego-selmenu'));
    await page.keyboard.press('Escape');
    await page.waitForTimeout(150);
    const escaped = await page.evaluate(() => !document.querySelector('.nego-selmenu'));
    check('4 Escape dismisses the menu', hadMenu && escaped);
    const after = await page.evaluate(() =>
      state.contracts.map(c => (c.changes || []).length).join(','));
    check('4 NOTHING WAS FILED — every contract\'s change count is untouched',
      after === before, before + ' → ' + after);

    check('no page errors on the whole journey', errors.length === 0, errors.join(' | ') || 'clean');
  } catch (e) {
    check('the run completed', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - bad}/${results.length} passed`);
  console.log(`screenshots → test/chromium/shots/document-ask-copilot`);
  if (bad) process.exit(1);
})();
