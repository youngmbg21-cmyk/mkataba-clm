/* ============================================================
   A CONTRACT OPEN ON HOME DOES NOT SWALLOW EVERY QUESTION (owner, 19 Oct 2026)
   ============================================================
   "for some reason after the recent update, it is not moving me around the
   platform like it previously did"

   Measured: once a contract's page was brought up on Home's desk, every
   question typed after it went to that one contract's reading — "show me
   drafts", "contracts expiring in the next 90 days", "show me the Carrefour
   contracts", "negotiations", "open MK-105" all answered "I wasn't able to
   finish that" instead of the Board's own free answer. And from a list's
   Jambo box, "show me drafts" opened "What should we draft?".
     1, 2  RETIRED 9 Nov 2026 with the Board's contract card (nothing is held on the Board any more)
     3  from the Approvals list's box, "show me drafts" never opens the draft
        form; "new contract" still does
   Typed into the real boxes; what reaches Jambo's AI routes is watched (the
   test server's stand-in answers, nothing is spent).
   Run: node test/chromium/held-contract-asks-verify.js */
'use strict';
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const DAY = 864e5;
const BOOK = Array.from({ length: 30 }, (_, i) => {
  const c = fixtureContract('MK-' + (101 + i), 'Agreement ' + i, ['Carrefour Kenya', 'Naivas Supermarkets', 'Twiga Foods'][i % 3],
    ['proc', 'sales', 'mfg'][i % 3], (i + 5) * 1e6, ['Signed', 'Under Review', 'Draft'][i % 3]);
  c.expiry = new Date(Date.now() + (20 + i * 25) * DAY).toISOString().slice(0, 10);
  return c;
});

let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { contracts: BOOK, approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  /* what went to Jambo's AI routes (the stand-in answers; nothing is spent):
     the route and the contract it carried, if any */
  const aiAsks = [];
  page.on('request', r => { if (r.method() !== 'POST' || !/\/api\/ai\//.test(r.url())) return;
    const body = r.postData() || ''; const m = body.match(/MK-\d+/); aiAsks.push(r.url().replace(/^.*\/api\/ai\//, '') + ':' + (m ? m[0] : '')); });
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
    return v; };
  /* Home's Board with MK-105's page brought up on the desk; the contract's
     own reader is watched (it would spend) */
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 20, null, { timeout: 20000 });
    await until(() => (state.view === 'dashboard' && !document.body.classList.contains('pre-auth') && !!document.getElementById('hb-bhead')), null, 10000);
    await page.waitForTimeout(1500);

    /* 1 and 2 RETIRED 9 Nov 2026: they asked what a question does while a contract's page is HELD on the Board
       (igHeldAskId). The Board's contract card is gone, so nothing is held there any more; a contract brought up is
       its paper, whose questions are the paper's (igPaperAsk), measured where the paper's own box is. */

    /* ================= 3. A LIST'S BOX: "SHOW ME DRAFTS" IS A LIST ================= */
    for (const [q, wantForm] of [['show me drafts', false], ['new contract', true]]) {
      await page.evaluate(() => { intel.history = []; setView('approvals'); });
      const box = await until(() => !!document.querySelector('#jl-q'), null, 6000);
      if (!box) { check(`3 "${q}": the Approvals list has Jambo's box`, false, 'no #jl-q'); continue; }
      /* RE-PINNED 28 Oct 2026 ("Door above the box": typed words are the brain's but a page's one name): asked as a chip asks */ await page.evaluate(w => jlAsk(w), q);
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const said = (intel.history || []).filter(m => m.role === 'assistant').map(m => String(m.text || '') + ' ' + (m.act ? (m.act.kind || '') + ':' + (m.act.place || '') : ''));
        /* RE-POINTED 24 Oct 2026 (one door): "new contract" opens the one sheet itself, no card in the chat */
        return { form: !!document.getElementById('na-root') || said.some(s => /What should we draft|go:draft/i.test(s)), said: said.join(' | ').slice(0, 160), view: state.view };
      });
      await page.evaluate(() => { const b = document.getElementById('wz-pick-cancel'); if (b) b.click(); });
      check(`3 from the Approvals box, "${q}" ${wantForm ? 'opens' : 'never opens'} the draft form`, r.form === wantForm, JSON.stringify(r));
    }

    check('9 no page errors', !errors.length, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.stack || e.message);
  } finally {
    await browser.close().catch(() => {});
    if (h.stop) await h.stop().catch(() => {});
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
