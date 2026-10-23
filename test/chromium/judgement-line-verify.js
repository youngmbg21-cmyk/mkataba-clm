/* A QUESTION OF JUDGEMENT SAYS THE STRONGER MODEL WEIGHED IT, WHERE THE READER LOOKS
   (owner, 23 Oct 2026: judgement questions on the stronger model, the cost shown)
   ============================================================
   f870 proves the server routes the question and sends `deep`; this asks the
   painted page: under the answer, in the Jambo window and in Home's panel, the
   one quiet line "Weighed by the stronger model · $…" is ON SCREEN (a painted
   pixel, elementFromPoint), inside its answer, on one line — and a lookup's
   answer carries none. Photographed at the owner's three screens.
   Screenshots: test/chromium/shots/judgement-line/. Run: node test/chromium/judgement-line-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = path.join(__dirname, 'shots', 'judgement-line');
fs.mkdirSync(OUT, { recursive: true });
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

let failures = 0;
const check = (ok, what, detail) => { console.log((ok ? '  ok  ' : '  FAIL') + ' — ' + what + (detail ? ` [${detail}]` : '')); if (!ok) failures++; };
const answer = text => [{ type: 'tool_use', id: 'tu_j', name: 'deliver_answer', input: { answer: text, citations: [] } }];

/* the line, read off the painted page: present, painted (the top pixel is it), one line, inside its answer */
const lineIn = (page, host) => page.evaluate(h => {
  const all = [...document.querySelectorAll(h + ' [data-ai-deep]')];
  const el = all[all.length - 1];
  if (!el) return { found: false, n: 0 };
  el.scrollIntoView({ block: 'center' });
  const r = el.getBoundingClientRect();
  const top = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
  const lh = parseFloat(getComputedStyle(el).lineHeight) || 16;
  return { found: true, n: all.length, text: el.textContent.trim(), painted: !!top && (top === el || el.contains(top)),
    oneLine: r.height <= lh * 1.5 + 1, inside: r.right <= (el.parentElement.getBoundingClientRect().right + 1) };
}, host);

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base });
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    for (const [w, ht] of SCREENS) {
      const ctx = await browser.newContext({ viewport: { width: w, height: ht } });
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(String(e.message || e)));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await page.waitForFunction(() => !!(window.currentUser && currentUser() && window.state && state.contracts && state.contracts.length), null, { timeout: 20000 });
      const tag = `${w}x${ht}`;

      /* ---- 1. the Jambo window (a page with no Jambo of its own) ---- */
      await page.evaluate(() => { window.setView('reports'); window.ai.history = []; window.openAI(); });
      await page.waitForFunction(() => document.getElementById('ai-panel').classList.contains('open'), null, { timeout: 5000 }).catch(() => {});
      ai.reset(); ai.script(answer('It leans their way: the cap is half the fee.'));
      await page.fill('#ai-input', 'is the liability cap in MK-A1 fair to us?');
      await page.evaluate(() => window.aiSubmit && window.aiSubmit());
      await page.waitForFunction(() => !!document.querySelector('#ai-feed [data-ai-deep]') || (window.ai && !ai.busy && ai.history.some(m => m.role === 'assistant')), null, { timeout: 15000 }).catch(() => {});
      let L = await lineIn(page, '#ai-feed');
      check(L.found, `${tag} · window: the line is drawn under a judgement answer`, JSON.stringify(L));
      check(L.painted, `${tag} · window: it is a painted pixel, not hidden`);
      check(L.oneLine && L.inside, `${tag} · window: one line, inside its answer`);
      check(/stronger model/.test(L.text || '') && /\$/.test(L.text || ''), `${tag} · window: says the stronger model and, to an admin, the cost`, L.text);
      await page.screenshot({ path: path.join(OUT, `${tag}-window.png`) });

      ai.reset(); ai.script(answer('Three agreements expire this year.'));
      await page.fill('#ai-input', 'how many contracts expire this year');
      await page.evaluate(() => window.aiSubmit && window.aiSubmit());
      await page.waitForFunction(() => window.ai && !ai.busy && ai.history.filter(m => m.role === 'assistant').length >= 2, null, { timeout: 15000 }).catch(() => {});
      L = await lineIn(page, '#ai-feed');
      check(L.n === 1, `${tag} · window: a lookup's answer carries no line (still one on the page)`, String(L.n));
      await page.evaluate(() => { try { window.closeAI(); } catch (_) {} });

      /* ---- 2. Home's panel (the same answer drawn by intelPushChatResult) ---- */
      await page.evaluate(() => { setView('dashboard'); if (window.intel) intel.history = []; });
      ai.reset(); ai.script(answer('Clause 9 lets them walk away on thirty days.'));
      const asked = await page.evaluate(async () => {
        if (typeof window.intelChatAsk !== 'function') return 'intelChatAsk is not published';
        /* as intelAsk's own talk path does: the turn, then the panel drawn */
        const q = 'what happens if they terminate MK-A1 early?';
        intel.history.push({ role: 'user', text: q }); intel.busy = true; renderIntelDock();
        try { await intelChatAsk(q); } finally { intel.busy = false; renderIntelDock(); }
        return '';
      });
      check(!asked, `${tag} · Home: the panel's own chat ask ran`, asked);
      await page.waitForFunction(() => !!document.querySelector('#ig-dock [data-ai-deep]'), null, { timeout: 8000 }).catch(() => {});
      L = await lineIn(page, '#ig-dock');
      check(L.found && L.painted && L.oneLine && L.inside, `${tag} · Home: the line is on screen under the answer, one line`, JSON.stringify(L));
      await page.screenshot({ path: path.join(OUT, `${tag}-home.png`) });

      check(!errors.length, `${tag} · no page errors`, errors.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } catch (e) { check(false, 'the check ran', String(e && e.message || e)); }
  await browser.close(); await h.stop(); await ai.stop();
  console.log(failures ? `\n${failures} FAILED` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();
