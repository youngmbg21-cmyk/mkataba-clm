/* JAMBO-MOVES-AND-OPENS — three asks of the owner's, 20 Oct 2026:

     1  "when you press to draft from our standards, you do not see anything
        happening … Add some movement so that someone does not think it is
        frozen": from the yes until the drafts are filed, the button wears the
        turning ring, says Jambo is drafting and cannot be pressed again; when
        it ends, nothing is left turning
     (the second, "Remove the wording highlighted and just leave the blue
        button" — the clause editor's chip without "Asking about" — is
        panel-tidy-and-risk-footer verify A1)
     3  "when i ask jambo to show me the guide or activitiy and so on, it
        should do so": typed into Home's box and Jambo's panel, Guide, Alerts
        and Activity open the right-hand panel on that tab; asked again it
        stays open

   Run: node test/chromium/jambo-moves-and-opens-verify.js */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FOLDER_A, chipEnter } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };

const TEXT = ['1. Definitions', 'In this Agreement the words below have the meanings given.',
  '2. Supply', 'The Supplier shall deliver the goods described in the order.',
  '3. Liability', 'The Supplier is liable for all loss, without limit.',
  '4. Governing Law', 'This Agreement is governed by the laws of Kenya.'].join('\n\n');
const BODY = TEXT.split('\n\n').map(p => /^\d+\./.test(p) ? `<h2>${p}</h2>` : `<p>${p}</p>`).join('');

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const ID = 'MK-JM1';
  await W.admin.json('/api/contracts/' + ID, { method: 'PUT', body: { contract: {
    id: ID, name: 'Nordkust supply agreement', counterparty: 'Nordkust Industri AB', counterpartyEmail: 'ola@nordkust.se',
    folder: FOLDER_A, status: 'Under Review', source: 'upload', template: null, fields: {}, metadata: { category: 'supplier' },
    obligations: [], audit: [], rounds: [], versions: [], signatures: [], comments: [], changes: [],
    value: 4800000, valueType: 'estimated', redlineText: BODY, format: 'rich',
    upload: { name: 'Supply.docx', extractedText: TEXT } } } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(id => window.state && state.contracts && state.contracts.some(c => c.id === id), ID, { timeout: 20000 });
    await page.waitForLoadState('networkidle');

    console.log('\n1 · Draft from our standards moves while Jambo works');
    await page.evaluate(id => openRedlineWorkbench(id), ID);
    const COL = '#pd-redface [data-rl-prepare]';
    const there = await until(s => { const b = document.querySelector(s); return b && b.getBoundingClientRect().width > 0 && !b.disabled; }, COL, 12000);
    check('1a the button is on the Redlines face', !!there);
    /* the review is held for a moment, as a real Jambo call takes one */
    await page.evaluate(() => { const run = window.runPlaybookReview; window._jmHeld = true;
      window.runPlaybookReview = async (...a) => { while (window._jmHeld) await new Promise(r => setTimeout(r, 50)); return run(...a); }; });
    if (there) await page.locator(COL).first().click();
    const ok = await until(() => { const b = document.getElementById('cf-ok'); return b && b.getBoundingClientRect().width > 0; }, null, 5000);
    if (ok) await page.click('#cf-ok');
    const busy = await until(s => { const b = document.querySelector(s); const ring = b && b.querySelector('.ob-spin');
      if (!ring) return null; const r = ring.getBoundingClientRect(), cs = getComputedStyle(ring);
      return { words: b.textContent.trim(), dis: b.disabled, w: Math.round(r.width), anim: cs.animationName, shown: cs.display !== 'none' }; }, COL, 5000);
    check('1b after the yes the button wears the turning ring, painted', !!busy && busy.shown && busy.w > 0 && busy.anim && busy.anim !== 'none', JSON.stringify(busy));
    check('1c … says Jambo is drafting', !!busy && /Jambo is drafting/.test(busy.words), busy && busy.words);
    check('1d … and cannot be pressed again', !!busy && busy.dis);
    await shot(page, '1-drafting');
    await page.evaluate(() => { window._jmHeld = false; });
    const after = await until(() => !document.querySelector('[data-rl-prepare] .ob-spin') && !document.querySelector('[data-rl-prepare][aria-busy]'), null, 15000);
    check('1e when the run ends nothing is left turning', !!after);

    await page.evaluate(() => setView('counter'));

    console.log('\n3 · "show me the guide" opens the Guide');
    const ask = async (sel, words) => {
      const box = await until(s => { const el = document.querySelector(s); return el && el.getBoundingClientRect().width > 0; }, sel, 8000);
      if (!box) return false;
      /* re-pinned 27 Oct 2026: words TYPED on Home go to the brain first; this tests the free readers, asked as a chip asks (counterAsk) */
      if (sel === '#cn-q'){ await page.evaluate(w => counterAsk(w), words); return true; }
      /* RE-PINNED 28 Oct 2026 ("Door above the box"): the panel's box too, asked as a chip asks */
      await page.fill(sel, words); await chipEnter(page, sel); return true; };
    const face = () => until(() => state.panelOpen && typeof panelFace === 'function' ? panelFace() : null, null, 5000);
    await page.evaluate(() => { state.panelOpen = false; if (typeof applyPanelLayout === 'function') applyPanelLayout(); setView('counter'); });
    const typed = await ask('#cn-q', 'show me the guide');
    check('3a Home\'s box takes the words', typed);
    const f1 = await face();
    check('3b the panel opens on the Guide', f1 === 'guide', f1);
    await shot(page, '3-guide');
    await ask('#cn-q', 'show me the guide');
    await page.waitForTimeout(400);
    check('3c asked again it stays open on the Guide', await page.evaluate(() => !!state.panelOpen && panelFace() === 'guide'));
    await ask('#cn-q', 'activity');
    check('3d "activity" turns it to Activity', (await until(() => state.panelOpen && panelFace() === 'activity' ? 'activity' : null)) === 'activity');
    await ask('#cn-q', 'open my alerts');
    check('3e "open my alerts" turns it to Alerts', (await until(() => state.panelOpen && panelFace() === 'alerts' ? 'alerts' : null)) === 'alerts');
    /* Jambo's panel beside the Board: the same words */
    await page.evaluate(() => { state.panelOpen = false; if (typeof applyPanelLayout === 'function') applyPanelLayout(); setView('dashboard'); });
    const onPanel = await ask('#igd-input', 'show me the guide');
    check('3f Jambo\'s panel takes the words', onPanel);
    check('3g … and the Guide opens', (await until(() => state.panelOpen && panelFace() === 'guide' ? 'guide' : null)) === 'guide');
    await page.evaluate(() => { state.panelOpen = false; if (typeof applyPanelLayout === 'function') applyPanelLayout(); });
    await ask('#igd-input', 'visa aktivitet');
    check('3h in Swedish, "visa aktivitet" opens Activity', (await until(() => state.panelOpen && panelFace() === 'activity' ? 'activity' : null)) === 'activity');
    await shot(page, '3-activity');
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} failed` : '\nall passed');
    process.exit(failures ? 1 : 0);
  }
})();
