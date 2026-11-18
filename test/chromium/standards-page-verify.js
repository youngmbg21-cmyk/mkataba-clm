/* Chromium verification: STANDARDS — THE LADDER (owner picked "The Ladder" by name, 17 Nov 2026).
   ============================================================
   RE-WRITTEN 17 Nov 2026. This file measured the old Our standards tab (rows that opened, the playbook learning from
   settled rounds); that page is gone, and the same name now measures the page that replaced it. f1091 pins the
   readings, the routes and the words; every claim here is a PRESS or a MEASUREMENT:
     1  the page draws: the list by how firm, the chosen standard as a ladder, Jambo's panel beside it, the head's
        facts and its three buttons; a press in the list chooses another standard
     2  an open departure stands on the ladder with Decide in Approvals (no Open the paper since 18 Nov 2026); on its
        Approvals row "See it in the paper ›" sits under the two buttons and opens THE PAPER IN A POP-UP: big, the
        paper and its notes beside it, landed on the departure's words, no buttons in the notes; Esc closes it; Open the
        Dossier › closes it and opens the contract
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
    /* the paper carries the words its check quoted, so the pop-up has somewhere to land (18 Nov 2026) */
    const body = 'AGREEMENT\n\n' + Array.from({ length: 14 }, (_, k) => `${k + 1}. Clause ${k + 1}\n\nThe parties agree to the terms of clause ${k + 1}, as written here.`).join('\n\n')
      + `\n\n15. Liability\n\nThe ${pb.verdicts[0].quote}.`;
    const c = Object.assign(fixtureContract(id, name, cp, 'proc', 900000, 'Under Review', body), { playbook: pb });
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
      check(`${tag} 1b the head: its facts, Departures · History · New position`, !!P && /positions/.test(P.facts) && P.acts.length === 3 && /Departures/.test(P.acts[0]) && /History/.test(P.acts[1]) && /New position/.test(P.acts[2]), P && { facts: P.facts, acts: P.acts });
      const chose = await page.evaluate(() => { const b = [...document.querySelectorAll('.ld-list [data-ld-pick]')].find(x => /Liability/.test(x.textContent)); if (!b) return false; b.click(); return true; })
        && await until(() => { const t = document.querySelector('.ld-main .ld-title'); return t && /Liability/.test(t.textContent) ? t.textContent : null; });
      check(`${tag} 1c a press in the list chooses that standard`, !!chose, chose);

      /* 2 DEPARTURES */
      const D = await until(() => { const d = [...document.querySelectorAll('.ld-dep')]; return d.length ? d.map(x => ({ t: x.textContent.replace(/\s+/g, ' ').trim(),
        acts: [...x.querySelectorAll('button')].map(b => b.textContent.trim()) })) : null; });
      /* RE-POINTED 17 Nov 2026 (one door for departures): the card sends the decision to Approvals & signing */
      check(`${tag} 2a each open departure on the ladder: Decide in Approvals, no Open the paper (18 Nov 2026), and no decision here`, !!D && D.length === 2
        && D.every(x => /Decide in Approvals/.test(x.acts.join()) && !/Open the paper/.test(x.acts.join()) && !/Allow once|Refuse/.test(x.acts.join()))
        && D.some(x => /Kilele/.test(x.t) && /Legal says yes/.test(x.t)), D);
      const key = await page.evaluate(() => { const b = document.querySelector('.ld-dep [data-ld-goap]'); const k = b && b.getAttribute('data-ld-goap'); if (b) b.click(); return k; });
      const landed = await until(k => { const tr = document.querySelector('#content tr.is-sel[data-ap-row]');
        return state.view === 'approvals' && tr && tr.getAttribute('data-ap-row') === k ? k : null; }, key);
      check(`${tag} 2b it lands on that departure's row in Approvals & signing, chosen`, !!key && landed === key, JSON.stringify({ key, landed }));
      /* 2c SEE IT IN THE PAPER (owner, 18 Nov 2026): under the row's two buttons, departures only; a large pop-up, the
         paper and its notes, landed on the departure's words; nothing to press in the notes; Esc closes it */
      const pk = await page.evaluate(k => {
        const b = [...document.querySelectorAll('#content [data-apn-peek]')].find(x => x.getAttribute('data-apn-peek') === k); if (!b) return null;
        const td = b.closest('td.apn-acts'), btns = td ? [...td.querySelectorAll('button')] : [];
        const r = { under: btns.length === 3 && btns[2] === b && b.getBoundingClientRect().top >= btns[0].getBoundingClientRect().bottom - 1,
          onStd: document.querySelectorAll('#content tr[data-ap-kind="stdchange"] [data-apn-peek]').length };
        b.click(); return r; }, key);
      check(`${tag} 2c "See it in the paper ›" sits under Allow once and Refuse, on departures only`, !!pk && pk.under && pk.onStd === 0, pk);
      const pop = await until(() => {
        const p = document.querySelector('.apn-pk'), sc = document.getElementById('apn-pk-scroll'), l = sc && sc.querySelector('.is-landed');
        if (!p || !l) return null;
        const d = p.closest('[role="dialog"]').getBoundingClientRect(), a = l.getBoundingClientRect(), v = sc.getBoundingClientRect();
        const notes = document.getElementById('apn-pk-notes');
        return { w: +(d.width / innerWidth).toFixed(2), h: +(d.height / innerHeight).toFixed(2), paper: !!sc.querySelector('#apn-pk-cv #apn-pk-doc, #apn-pk-cv .rl-paper'),
          notes: notes.querySelectorAll('.pd2-mn').length, beside: notes.getBoundingClientRect().left >= sc.querySelector('#apn-pk-cv').getBoundingClientRect().right - 1,
          pressable: notes.querySelectorAll('button:not(.pd2-mg-more):not(.pd2-mg-less), a').length,
          landed: /preceding three/.test(l.textContent), inView: a.top >= v.top && a.bottom <= v.bottom + 1, moved: sc.scrollTop > 0,
          scrolls: sc.scrollHeight > sc.clientHeight, go: !!p.querySelector('[data-apn-pk-go]') };
      });
      check(`${tag} 2d the pop-up is big: the paper with its notes beside it, landed on the departure's words, free to scroll`,
        !!pop && pop.w >= 0.85 && pop.h >= 0.8 && pop.paper && pop.notes >= 1 && pop.beside && pop.landed && pop.inView && pop.moved && pop.scrolls && pop.go, pop);
      check(`${tag} 2e the notes carry nothing to press: a look, never a decision`, !!pop && pop.pressable === 0, pop && pop.pressable);
      if (w === 1440) await page.screenshot({ path: path.join(OUT, `${tag}-paper-pop-up.png`) });
      await page.keyboard.press('Escape');
      const shut = await until(() => !document.querySelector('.apn-pk') && state.view === 'approvals');
      check(`${tag} 2f Esc closes it, back on Approvals`, !!shut);
      await page.evaluate(k => [...document.querySelectorAll('#content [data-apn-peek]')].find(x => x.getAttribute('data-apn-peek') === k)?.click(), key);
      await until(() => !!document.querySelector('.apn-pk [data-apn-pk-go]'));
      await page.evaluate(() => document.querySelector('.apn-pk [data-apn-pk-go]').click());
      const dos = await until(k => !document.querySelector('.apn-pk') && typeof pdContract === 'function' && pdContract() && ('dep:' + pdContract().id) === k.split(':').slice(0, 2).join(':') ? pdContract().id : null, key);
      check(`${tag} 2g Open the Dossier › closes it and opens that contract`, !!dos, dos);
      await page.evaluate(() => { setView('playbook'); });
      await until(() => !!document.querySelector('.ld-main .ld-rung'));
      await page.keyboard.press('Escape').catch(() => {});
      await page.waitForTimeout(300);

      /* 3 JAMBO WRITES IT */
      await page.evaluate(() => document.querySelector('[data-ld-edit]')?.click());
      const ed = await until(() => document.querySelector('.ld-edit [data-ld-f="ask"]') ? (document.querySelector('.ld-edit [data-ld-f="ask"]').value) : null);
      check(`${tag} 3a Edit the standard opens its page with its words in the box`, !!ed && /liability/i.test(ed), ed && ed.slice(0, 60));
      await page.evaluate(() => document.querySelector('.ld-edit [data-ld-write]')?.click());
      const J = await until(() => { const d = document.querySelector('#ins-panel .ld-jdraft'); if (!d) return null;
        return { draft: d.textContent.replace(/\s+/g, ' ').slice(0, 400), chips: [...document.querySelectorAll('#ins-panel [data-ld-jb-chip]')].map(b => b.textContent.trim()),
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
        /* while a change waits the standard is not edited again; the next screens edit it, so the change is withdrawn here */
        await page.evaluate(() => document.querySelector('.ld-main [data-ld-withdraw]')?.click());
        await until(() => !document.querySelector('.ld-main [data-ld-withdraw]') && !!document.querySelector('[data-ld-edit]'));
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
