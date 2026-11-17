/* Chromium verification: STANDARDS — THE LADDER (owner picked "The Ladder" by name, 17 Nov 2026).
   ============================================================
   RE-WRITTEN 17 Nov 2026. This file measured the old Our standards tab (rows that opened, the playbook learning from
   settled rounds); that page is gone, and the same name now measures the page that replaced it. f1091 pins the
   readings, the routes and the words; every claim here is a PRESS or a MEASUREMENT:
     1  the page draws: the list by how firm, the chosen standard as a ladder, Jambo's panel beside it, the head's
        facts and its three buttons; a press in the list chooses another standard
     2  an open departure stands on the ladder with Allow once · Refuse · Open the paper; Allow once asks a reason
     3  Edit the standard → Write it for me: Jambo's draft waits in HIS panel (never in a box), with its chips,
        Put in the standard and Try again; Put in fills the boxes, and nothing is saved
     4  Send for approval asks why; the change waits in History; the ladder is unchanged
     5  at the owner's three screens nothing spills sideways and the title's buttons stay on its line
   Run: node test/chromium/standards-page-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'standards-page');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SIZES = [[1440, 780], [1536, 730], [1366, 950]];
const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const DRAFT = { ask: 'Each party’s liability is capped at the fees paid in the twelve (12) months before the claim.', fallbacks: ['Capped at the total contract value.', 'Capped at six (6) months’ fees.'],
  never: 'Unlimited or uncapped liability.', why: 'Below six months, one failed delivery can cost more than the deal earns.', said: '' };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  h.ai.answerWith(tool => tool === 'write_standard' ? DRAFT : null);
  const W = await seedWorkspace(h, { approvalRules: [] });
  /* two live contracts that depart from the liability standard, one that holds it */
  const V = (status, quote, escalate) => ({ verdicts: [{ category: 'Liability cap', status, quote, escalate: !!escalate }] });
  const staged = [
    ['LD-1', 'Courier Services', 'Kilele Logistics', V('deviation', 'liability is limited to the fees paid in the preceding three (3) months', true)],
    ['LD-2', 'Cleaning Services', 'Safi Ltd', V('deviation', 'capped at fifty per cent of the fees')],
    ['LD-3', 'Packaging Supply', 'Kabras Sugar Ltd', V('aligned', 'twelve (12) months of fees')]];
  for (const [id, name, cp, pb] of staged){
    const c = Object.assign(fixtureContract(id, name, cp, 'proc', 900000, 'Under Review', 'AGREEMENT\n\n1. Liability\n\nThe liability is limited.'), { playbook: pb });
    await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  }
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const [w, ht] of SIZES){
      const tag = `${w}x${ht}`;
      const page = await (await browser.newContext({ viewport: { width: w, height: ht } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
      await page.waitForFunction(() => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c.id === 'LD-1'), null, { timeout: 20000 });
      await page.evaluate(async () => { if (typeof stPrefSet === 'function') await stPrefSet('newLook', true); if (typeof newLookApply === 'function') newLookApply(); });
      const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); } return v; };

      /* 1 THE PAGE */
      await page.evaluate(() => setView('playbook'));
      const P = await until(() => {
        const list = document.querySelector('.ld-list'), main = document.querySelector('.ld-main'), panel = document.getElementById('ins-panel');
        if (!list || !main || !panel) return null;
        return { groups: [...list.querySelectorAll('.ld-g')].map(g => g.textContent.trim()), items: list.querySelectorAll('[data-ld-pick]').length,
          title: (main.querySelector('.ld-title') || {}).textContent || '', rungs: main.querySelectorAll('.ld-rung').length,
          acts: [...document.querySelectorAll('#page-head-acts button')].map(b => b.textContent.trim()),
          facts: (document.getElementById('page-head-facts') || {}).textContent || '', panel: panel.getBoundingClientRect().width > 300 };
      });
      check(`${tag} 1a the list by how firm, a standard as a ladder, Jambo's panel beside it`, !!P && P.groups.length >= 2 && P.items >= 5 && P.rungs >= 1 && P.panel, P);
      check(`${tag} 1b the head: its facts, Departures · History · New standard`, !!P && /standards/.test(P.facts) && P.acts.length === 3 && /Departures/.test(P.acts[0]) && /History/.test(P.acts[1]) && /New standard/.test(P.acts[2]), P && { facts: P.facts, acts: P.acts });
      const chose = await page.evaluate(() => { const b = [...document.querySelectorAll('.ld-list [data-ld-pick]')].find(x => /Liability/.test(x.textContent)); if (!b) return false; b.click(); return true; })
        && await until(() => { const t = document.querySelector('.ld-main .ld-title'); return t && /Liability/.test(t.textContent) ? t.textContent : null; });
      check(`${tag} 1c a press in the list chooses that standard`, !!chose, chose);

      /* 2 DEPARTURES */
      const D = await until(() => { const d = [...document.querySelectorAll('.ld-dep')]; return d.length ? d.map(x => ({ t: x.textContent.replace(/\s+/g, ' ').trim(),
        acts: [...x.querySelectorAll('button')].map(b => b.textContent.trim()) })) : null; });
      check(`${tag} 2a each open departure on the ladder: Allow once · Refuse · Open the paper`, !!D && D.length === 2 && D.every(x => /Refuse/.test(x.acts.join()) && /Open the paper/.test(x.acts.join())) && D.some(x => /Kilele/.test(x.t) && /Legal says yes/.test(x.t)), D);
      await page.evaluate(() => document.querySelector('.ld-dep [data-ld-allow]')?.click());
      const ask = await until(() => { const d = document.querySelector('#prompt-overlay, [role="dialog"]'); return d && /reason|why/i.test(d.textContent) ? true : null; });
      check(`${tag} 2b Allow once asks a reason before anything is written`, !!ask, ask);
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);

      /* 3 JAMBO WRITES IT */
      await page.evaluate(() => document.querySelector('[data-ld-edit]')?.click());
      const ed = await until(() => document.querySelector('.ld-edit [data-ld-f="ask"]') ? (document.querySelector('.ld-edit [data-ld-f="ask"]').value) : null);
      check(`${tag} 3a Edit the standard opens its page with its words in the box`, !!ed && /liability/i.test(ed), ed && ed.slice(0, 60));
      await page.evaluate(() => document.querySelector('.ld-edit [data-ld-write]')?.click());
      const J = await until(() => { const d = document.querySelector('#ins-panel .ld-jdraft'); if (!d) return null;
        return { draft: d.textContent.slice(0, 60), chips: [...document.querySelectorAll('#ins-panel [data-ld-jb-chip]')].map(b => b.textContent.trim()),
          put: !!document.querySelector('#ins-panel [data-ld-jb-put]'), again: !!document.querySelector('#ins-panel [data-ld-jb-again]'),
          box: document.querySelector('.ld-edit [data-ld-f="ask"]').value }; }, null, 12000);
      check(`${tag} 3b Jambo's draft waits in his panel with Stricter · Softer · Shorter · Add a fallback, Put in, Try again`,
        !!J && J.chips.length === 4 && J.put && J.again && /fees paid in the twelve/.test(J.draft), J);
      check(`${tag} 3c nothing went into the boxes by itself`, !!J && J.box === ed, J && J.box.slice(0, 60));
      await page.evaluate(() => document.querySelector('#ins-panel [data-ld-jb-put]')?.click());
      const put = await until(() => { const b = document.querySelector('.ld-edit [data-ld-f="ask"]'); const f = document.querySelectorAll('.ld-edit [data-ld-f^="fb:"]');
        return b && /fees paid in the twelve/.test(b.value) ? { fallbacks: f.length } : null; });
      check(`${tag} 3d Put in the standard fills the ask and the fallbacks`, !!put && put.fallbacks === 2, put);
      const unsaved = await page.evaluate(() => { const cl = clauseLibrary().find(c => /liab/i.test(c.category)); return cl ? !/fees paid in the twelve \(12\) months before the claim\.$/.test(cl.preferred) : false; });
      check(`${tag} 3e and nothing is saved yet`, unsaved, unsaved);

      /* 5 FIT, on the edit page and the ladder */
      const fit = async () => page.evaluate(() => {
        const over = el => el ? Math.round(el.scrollWidth - el.clientWidth) : 0;
        const top = document.querySelector('.ld-main .ld-top'); const t = top && top.querySelector('.ld-title'), a = top && top.querySelector('.ld-top-a');
        return { page: document.documentElement.scrollWidth - innerWidth, sheet: over(document.querySelector('.ld-sheet')), panel: over(document.getElementById('ins-panel')),
          oneLine: !t || !a || Math.abs(t.getBoundingClientRect().top - a.getBoundingClientRect().top) < 24 };
      });
      let F = await fit();
      check(`${tag} 5a the edit page: nothing sideways`, F.page <= 0 && F.sheet <= 1 && F.panel <= 1, F);
      await page.screenshot({ path: path.join(OUT, `${tag}-edit.png`) });

      /* 4 SEND FOR APPROVAL (the first screen only: one change waits per standard) */
      if (w === SIZES[0][0]){
        await page.evaluate(() => document.querySelector('[data-ld-send]')?.click());
        const dlg = await until(() => !!document.getElementById('ld-why'));
        if (dlg){ await page.fill('#ld-why', 'Name the carve-outs.'); await page.evaluate(() => document.getElementById('ld-send-go')?.click()); }
        const H = await until(() => { if (document.querySelector('.ld-edit')) return null; document.querySelector('[data-ld-mode="history"]')?.click();
          const r = [...document.querySelectorAll('.ld-hrow')].map(x => x.textContent.replace(/\s+/g, ' ').trim()); return r.length ? r : null; });
        check(`${tag} 4a Send for approval asks why; the change waits in History`, !!dlg && !!H && /Waiting/.test(H[0]) && /Name the carve-outs/.test(H[0]), H);
        await page.evaluate(() => document.querySelector('[data-ld-mode="ladder"]')?.click());
        const still = await until(() => { const w0 = document.querySelector('.ld-rung .ld-w'); return w0 ? w0.textContent : null; });
        check(`${tag} 4b the ladder still shows the words that stand`, !!still && !/fees paid in the twelve \(12\) months before the claim\.$/.test(still), still && still.slice(0, 60));
      } else await page.evaluate(() => document.querySelector('[data-ld-cancel]')?.click());

      await page.evaluate(() => { const b = [...document.querySelectorAll('.ld-list [data-ld-pick]')].find(x => /Liability/.test(x.textContent)); if (b) b.click(); });
      await page.waitForTimeout(300);
      F = await fit();
      check(`${tag} 5b the ladder: nothing sideways, the buttons on the title's line`, F.page <= 0 && F.sheet <= 1 && F.panel <= 1 && F.oneLine, F);
      await page.screenshot({ path: path.join(OUT, `${tag}-ladder.png`) });
      await page.context().close();
    }
    check('no page errors', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('the run finished', false, String(e && e.message || e));
  } finally {
    await browser.close(); await h.stop();
    const bad = results.filter(r => !r.pass).length;
    console.log(bad ? `\n${bad} FAILED` : `\n${results.length}/${results.length} checks passed`);
    process.exit(bad ? 1 : 0);
  }
})();
