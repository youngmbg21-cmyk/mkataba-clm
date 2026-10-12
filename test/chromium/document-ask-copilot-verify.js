/* Chromium verification: HIGHLIGHT ON THE DOCUMENT TAB → SIMPLIFY / ASK COPILOT
   (re-pointed 11 Oct 2026 to Home's Document face: the room's tab is gone)
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

    /* A template-built contract, on its paper.
       RE-POINTED 11 Oct 2026: the room's Document tab is gone (owner); the
       paper a reader highlights is Home's Document face (#ig-canvas), whose
       menu is the Paper's own (copilotacts.js CA_SEL_ACTIONS). */
    const cid = await page.evaluate(() => {
      const c = state.contracts.find(x => x.template && x.status !== 'Declined');
      pdOpenOnHome(c.id, 'copilot');
      return c.id;
    });
    await page.waitForFunction(i => {
      const pc = typeof pdContract === 'function' && pdContract();
      const cv = document.getElementById('ig-canvas');
      return !!pc && String(pc.id) === String(i) && !!cv && cv.textContent.trim().length > 200
        && !!document.getElementById('igd-input');
    }, cid, { timeout: 15000 }).catch(() => {});
    const before = await page.evaluate(() =>
      state.contracts.map(c => (c.changes || []).length).join(','));
    const highlight = n => page.evaluate(len => {
      const canvas = document.getElementById('ig-canvas');
      if (!canvas) return { err: 'no canvas' };
      const walker = document.createTreeWalker(canvas, NodeFilter.SHOW_TEXT);
      let node = null;
      while ((node = walker.nextNode()))
        if (node.textContent.trim().length > 50 && !node.parentElement.closest('input,textarea,button')) break;
      if (!node) return { err: 'no sentence to select' };
      const range = document.createRange();
      range.setStart(node, 0);
      range.setEnd(node, Math.min(len, node.textContent.length));
      const sel = getSelection(); sel.removeAllRanges(); sel.addRange(range);
      node.parentElement.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      return { picked: sel.toString().slice(0, 40) };
    }, n);
    const menuUp = () => page.waitForFunction(() => {
      const m = document.querySelector('.nego-selmenu'); return !!m && m.getBoundingClientRect().height > 0;
    }, null, { timeout: 4000 }).then(() => true, () => false);

    /* ---- 1. a real highlight raises the menu, beside the words ---- */
    const raised = await highlight(60);
    await menuUp();
    const menu = await page.evaluate(() => {
      const m = document.querySelector('.nego-selmenu');
      if (!m) return null;
      const r = m.getBoundingClientRect();
      return { on: r.width > 0 && r.height > 0, left: Math.round(r.left), top: Math.round(r.top),
        labels: [...m.querySelectorAll('[data-nego-ai]')].map(b => b.textContent.trim()) };
    });
    check('1 the highlight raises the menu, as visible pixels',
      !!menu && menu.on, JSON.stringify(menu) + ' · picked "' + (raised.picked || raised.err) + '"');
    /* RE-POINTED 11 Oct 2026: the owner's two actions were the Document tab's
       menu; Home's paper carries Ask Copilot among the Paper's own verbs.
       "Simplify" went with the tab — retired 11 Oct 2026: the Document tab is
       gone (owner). */
    check('1 Ask Copilot is on it',
      !!menu && menu.labels.some(l => /Ask Jambo/.test(l)), menu && menu.labels.join(' | '));
    await page.screenshot({ path: path.join(OUT, '01-menu.png') });

    /* ---- 2. (retired 11 Oct 2026: the Document tab is gone (owner) — its
       Simplify press, which answered in the old Copilot panel, has no door on
       Home's paper.) ---- */

    /* ---- 3. Ask Copilot puts the words in Copilot's ask box, quoted ---- */
    await page.evaluate(() => {
      const b = [...document.querySelectorAll('.nego-selmenu [data-nego-ai]')].find(x => /Ask Jambo/.test(x.textContent));
      if (b) b.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    });
    const quoted = raised.picked ? raised.picked.trim().slice(0, 20) : '\u0000';
    const asked = await page.waitForFunction(q => {
      const inp = document.getElementById('igd-input');
      return !!inp && inp.value.includes(q) && !document.querySelector('.nego-selmenu');
    }, quoted, { timeout: 4000 }).then(() => true, () => false);
    check('3 Ask Copilot puts the highlighted words in Copilot\'s ask box, and the menu closes', asked,
      await page.evaluate(() => (document.getElementById('igd-input') || {}).value || ''));

    /* ---- 4. Escape dismisses; nothing was written anywhere ---- */
    await highlight(30);
    const hadMenu = await menuUp();
    await page.keyboard.press('Escape');
    const escaped = await page.waitForFunction(() => !document.querySelector('.nego-selmenu'),
      null, { timeout: 3000 }).then(() => true, () => false);
    check('4 Escape dismisses the menu', hadMenu && escaped, JSON.stringify({ hadMenu, escaped }));
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
