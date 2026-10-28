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
     1  with a contract open, a question about the book or a contract named is
        the Board's: the page is let go, the Board answers, free
     2  with a contract open, a question about that one ("what are the risks",
        "when does it end", "who are the parties") still goes with that contract
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
  const holdOnHome = async () => {
    await page.evaluate(() => { intel.history = []; intel.busy = false; setView('dashboard'); });
    await until(() => state.view === 'dashboard' && !!document.getElementById('igd-input'));
    await page.evaluate(() => { hbSetFace('board'); });
    await page.waitForTimeout(300);
    await page.evaluate(() => { hbStripBring('MK-105'); });
    aiAsks.length = 0;
    return until(() => (typeof igHeldAskId === 'function' && igHeldAskId() === 'MK-105') ? 'held' : null, null, 6000);
  };
  const typeHome = async q => {
    /* RE-PINNED 28 Oct 2026 ("Door above the box": typed words are the brain's but a page's one name): asked as a chip asks */ await page.evaluate(w => intelAsk(w), q);
    await until(() => !intel.busy && intel.history.some(m => m.role === 'user'), null, 6000);
    await page.waitForTimeout(500);
    return page.evaluate(() => {
      const said = intel.history.filter(m => m.role === 'assistant').map(m => String(typeof m.text === 'function' ? m.text() : (m.text || '')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      return { held: typeof igHeldAskId === 'function' ? igHeldAskId() : null, page: (document.querySelector('#dk-page') || {}).textContent || '',
        said: said.join(' | ').slice(0, 160) };
    }).then(r => Object.assign(r, { asked: aiAsks.slice() }));
  };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForFunction(() => window.state && state.contracts && state.contracts.length > 20, null, { timeout: 20000 });
    await until(() => state.view === 'counter' || state.view === 'dashboard', null, 10000);
    await page.waitForTimeout(1500);

    /* ================= 1. THE BOOK IS STILL THE BOARD'S ================= */
    for (const q of ['show me drafts', 'contracts expiring in the next 90 days', 'show me the Carrefour contracts', 'negotiations', 'top 5 by value', 'open MK-105']) {
      const ok = await holdOnHome();
      if (!ok) { check(`1 "${q}": a contract is open on Home first`, false, 'MK-105 could not be brought up'); continue; }
      const r = await typeHome(q);
      const answered = !!r.said && !/wasn.?t able to finish|could not draw/i.test(r.said);
      check(`1 with MK-105 open, "${q}" is answered by the Board, free, not sent to the contract`, answered && !r.asked.length,
        JSON.stringify({ said: r.said, page: r.page.trim(), asked: r.asked }));
    }

    /* ================= 2. A QUESTION ABOUT THIS ONE STAYS WITH IT ================= */
    for (const q of ['what are the risks', 'when does it end', 'who are the parties']) {
      const ok = await holdOnHome();
      if (!ok) { check(`2 "${q}": a contract is open on Home first`, false, 'MK-105 could not be brought up'); continue; }
      const r = await typeHome(q);
      check(`2 with MK-105 open, "${q}" still goes with MK-105, its page still up`, r.asked.some(a => /:MK-105$/.test(a)) && r.held === 'MK-105',
        JSON.stringify({ asked: r.asked, held: r.held, page: r.page.trim() }));
    }

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
