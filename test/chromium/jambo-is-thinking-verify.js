/* Chromium verification: JAMBO IS THINKING — A SIGN WHILE HE ANSWERS (owner, 28 Oct 2026)
   ============================================================
   The owner: "when i ask a long form question and the panel goes to jambo, while jambo is thinking there needs to
   be a sign that something is running or thinking so that you do not think the panel has frozen". Measured first:
   Home's panel, the lists and the ✦ window drew three 5px dots in a pale bubble; Settings drew nothing at all; the
   Calendar's planner already said "Jambo is reading your calendar…" with a spinner. On every panel, with the answer
   held back on the wire:
     1  within a beat of Enter a sign stands in the conversation: a spinner that MOVES and words saying he is at it
     2  the sign is read out to a screen reader (role=status)
     3  when the answer lands, the sign is gone
   AT THE PARENT (origin/main 8dd9eff) 1 fails everywhere but the Calendar (the dots carried no words, Settings had
   no sign), and 2 everywhere.
   Run: node test/chromium/jambo-is-thinking-verify.js   (HATI_THINK_ONLY=settings,board to run some) */
/* global state, setView, hbSetFace, roomHomeLand, closeModal, jlToWords, jamboTalkUp, jamboTalkBack, aiWinToggle, closeAI */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, startScriptedAi, seedWorkspace } = require('../helpers');
const { navContracts } = require('../nav-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => { console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); if (!pass) failures++; };
async function until(page, fn, arg, ms = 8000){
  const t0 = Date.now();
  while (Date.now() - t0 < ms){ const v = await page.evaluate(fn, arg).catch(() => null); if (v) return v; await page.waitForTimeout(100); }
  return null;
}
const PAGES = [
  ['board', "setView('dashboard'); hbSetFace('board')", '#ig-dock', '#igd-input'],
  ['contract', "roomHomeLand('MK-A2')", '#ig-dock', '#igd-input'],
  ['approvals', "setView('approvals')", '#ins-panel', '#jl-q'],
  ['settings', "setView('team')", '#st-side', '#st-jb-q'],
  ['calendar', "setView('calendar')", '#cal-plan', '#cal-plan-in'],
  ['window', "setView('obligations'); if (!(window.ai && ai.open && ai.win)) aiWinToggle()", '#ai-panel', '#ai-input'],
];
const HOLD_MS = 4000;
const deliver = a => ({ content: [{ type: 'tool_use', id: 'tu_t', name: 'deliver_answer', input: { answer: a, citations: [] } }] });

(async () => {
  const ai = await startScriptedAi();
  const h = await startHati({ ANTHROPIC_BASE_URL: ai.base, HATI_AGENTS_AUTO: 'off' });
  await seedWorkspace(h, { contracts: navContracts(), approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!(window.state && state.contracts && state.contracts.length > 5), null, 20000);
    await P.waitForTimeout(1000);
    /* every answer is held back on the wire, so "while he thinks" lasts long enough to be looked at */
    await P.route('**/api/ai/**', async r => { await new Promise(x => setTimeout(x, HOLD_MS)); r.continue(); });
    const ONLY = process.env.HATI_THINK_ONLY ? process.env.HATI_THINK_ONLY.split(',') : null;
    for (const [key, go, host, box] of PAGES){
      if (ONLY && !ONLY.includes(key)) continue;
      console.log(`\n· ${key}`);
      await P.evaluate(() => { try { closeModal(); } catch (_){} try { if (window.ai && ai.open) closeAI(); } catch (_){} });
      await P.evaluate(g => { eval(g); }, go);
      const up = await until(P, ([h0, b]) => { const e = document.querySelector(h0); const i = document.querySelector(b); return e && i && e.getBoundingClientRect().width > 200 && i.getClientRects().length ? true : null; }, [host, box], 8000);
      if (!up){ check(`${key}: the panel and its box are drawn`, false); continue; }
      await P.evaluate(() => { try { jlToWords(); } catch (_){} try { if (window.jamboTalkUp && jamboTalkUp()) jamboTalkBack(); } catch (_){} });
      await P.waitForTimeout(300);
      ai.reset(); ai.script(deliver('ANSWER-' + key), deliver('ANSWER-' + key));
      await P.fill(box, 'which of our contracts end in the next quarter, and why does that matter?'); await P.press(box, 'Enter');
      const S = await until(P, h0 => { const r = document.querySelector(h0); if (!r) return null;
        const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
        const sign = [...r.querySelectorAll('[data-jb-thinking], .cal-plan-busy')].find(vis); if (!sign) return null;
        const spin = sign.querySelector('.ob-spin'); const cs = spin && getComputedStyle(spin);
        return { words: sign.textContent.replace(/\s+/g, ' ').trim(), moves: !!cs && cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0,
          status: sign.getAttribute('role') === 'status' || sign.getAttribute('aria-busy') === 'true' }; }, host, 2500);
      check(`1 ${key}: while he thinks, a moving spinner and words that say so`, !!S && S.moves && /Jambo/.test(S.words), JSON.stringify(S));
      check(`2 ${key}: the sign is said to a screen reader`, !!S && S.status, JSON.stringify(S));
      const gone = await until(P, h0 => { const r = document.querySelector(h0); if (!r) return null;
        return ![...r.querySelectorAll('[data-jb-thinking], .cal-plan-busy')].some(e => e.getBoundingClientRect().height > 0) && !(window.ai && ai.busy) && !(window.intel && intel.busy) ? true : null; }, host, HOLD_MS * 3 + 4000);
      check(`3 ${key}: the answer lands and the sign is gone`, !!gone);
    }
    check('4 no page errors', errors.length === 0, errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the run stopped', false, String(e && e.message || e).slice(0, 300));
  } finally {
    await browser.close(); await h.stop(); await ai.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})();
