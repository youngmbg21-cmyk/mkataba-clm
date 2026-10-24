/* A QUESTION ASKED WHILE JAMBO IS STILL ANSWERING WAITS ITS TURN (owner,
   22 Oct 2026: "fix the bug where Jambo drops questions while busy").

   WHAT THIS PINS, driven in a real browser as the admin (the model's answer
   is held back, so Jambo is still answering when the next words are sent):
     1 HOME'S PANEL, beside a contract: a second question sent while the first
       is being answered leaves the box, "Jambo will answer that next" is said,
       and once the first answer is in the second is asked — here "open
       explorer", which moves to Explorer.
     2 THE CHAT WINDOW: the same — the second question leaves the box, is
       said to be next, and is asked once the first answer is in.
   AT THE PARENT: Send did nothing while he was answering; the words sat in
   the box (1a, 1b, 1c, 2a, 2b fail).
   Run: node test/chromium/jambo-asks-in-turn-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    page.setDefaultTimeout(6000);
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    const toasts = [];
    await page.exposeFunction('__toastSeen', (m, k) => { toasts.push([String(m), k]); });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { const t = window.toast; window.toast = function (m, k){ try { window.__toastSeen(m, k); } catch (_){} return t.apply(this, arguments); }; });
    /* the model's answers are held until released, one at a time */
    let gates = [];
    /* RE-POINTED 24 Oct 2026 (#456, "One Jambo, two layers"): a question typed on Explorer goes to the map's
       own route (/api/ai/graph), so both the chat's and the map's answers are held */
    await page.route(/\/api\/ai\/(chat|graph)/, async route => { await new Promise(r => gates.push(r)); await route.continue(); });
    const release = () => { const g = gates; gates = []; g.forEach(r => r()); };

    /* ---- 1 Home's panel ---- */
    try {
      await page.evaluate(() => { openRedlineWorkbench('MK-A2'); });
      await until(() => !!document.getElementById('igd-input') && !!(window.intel && intel.paper), null, 12000);
      /* the panel settles before typing (22 Oct 2026: on arrival the panel can still be
         drawing its first face; a question typed in that instant met a box being replaced) */
      let busy = null;
      for (let i = 0; i < 3 && !busy; i++){
        await page.waitForTimeout(400);
        await page.fill('#igd-input', 'what should I watch for in this contract?'); await page.keyboard.press('Enter');
        busy = await until(() => (window.intel && intel.busy) ? true : null, null, 4000);
      }
      check('1 · Jambo is answering the first question', !!busy);
      const t0 = toasts.length;
      await page.click('#igd-input'); await page.fill('#igd-input', 'open explorer'); await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const box = await page.evaluate(() => document.getElementById('igd-input').value);
      check('1a the second question leaves the box', box === '', JSON.stringify(box));
      check('1b "Jambo will answer that next" is said', toasts.slice(t0).some(([m, k]) => /answer that next/.test(m) && k === 'ok'), JSON.stringify(toasts.slice(t0)));
      check('1b2 nothing moved yet: the first answer comes first', await page.evaluate(() => !(typeof hbFace === 'function' && hbFace() === 'explorer')));
      release();
      const moved = await until(() => (state.view === 'dashboard' && typeof hbFace === 'function' && hbFace() === 'explorer') ? true : null, null, 12000);
      check('1c once the first answer is in, the second is asked: Explorer', !!moved, await page.evaluate(() => typeof hbFace === 'function' ? hbFace() : null));
    } catch (e) { check('1 ran', false, String(e && e.message).split('\n')[0]); }

    /* ---- 2 the chat window ---- */
    try {
      release();
      await until(() => !(window.intel && intel.busy) ? true : null, null, 8000);
      await page.evaluate(() => { if (typeof aiWinToggle === 'function') aiWinToggle(true); else if (typeof openAI === 'function') openAI(); });
      const winBox = await until(() => { const b = aiEl && aiEl('ai-input'); return b && b.getBoundingClientRect().width > 0 ? true : null; }, null, 8000);
      check('2 · the chat window is open', !!winBox);
      await page.evaluate(() => { const b = aiEl('ai-input'); b.value = 'which clause worries you most?'; }); await page.evaluate(() => { aiSubmit(); });
      /* since #456 the window on Home hands its words to Home's box, so the busy one is Home's (intel.busy) */
      const busy2 = await until(() => ((window.ai && ai.busy) || (window.intel && intel.busy)) ? true : null, null, 8000);
      check('2 · Jambo is answering the window\'s first question', !!busy2);
      const n0 = await page.evaluate(() => ai.history.filter(m => m.role === 'user').length);
      const t0 = toasts.length;
      await page.evaluate(() => { const b = aiEl('ai-input'); b.value = 'and what is late?'; }); await page.evaluate(() => { aiSubmit(); });
      await page.waitForTimeout(300);
      const s = await page.evaluate(() => ({ box: aiEl('ai-input').value, users: ai.history.filter(m => m.role === 'user').map(m => m.text || m.raw || '') }));
      check('2a the second question leaves the box and waits', s.box === '' && s.users.length === n0, JSON.stringify(s));
      check('2a2 "Jambo will answer that next" is said', toasts.slice(t0).some(([m, k]) => /answer that next/.test(m) && k === 'ok'), JSON.stringify(toasts.slice(t0)));
      release();
      const asked = await until(() => (window.ai && ai.history.some(m => m.role === 'user' && /what is late/.test(m.text || m.raw || ''))) ? true : null, null, 12000);
      release();
      check('2b once the first answer is in, the second is asked in the window', !!asked);
    } catch (e) { check('2 ran', false, String(e && e.message).split('\n')[0]); }
    release();
    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})().catch(e => { console.error(e); process.exit(1); });
