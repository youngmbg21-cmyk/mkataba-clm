/* SAVE AFTER AN APPLY THAT PUTS THEIR CHANGE BACK (owner, 29 Oct 2026: "when you apply a redline, the save
   button does not active so you can save what you have redlined" — the clause editor on 4. Governing Law,
   their ask Sweden → Kenya, Jambo's Playbook wording applied, Save grey and "No changes yet")

   WHAT THIS PINS, in a real browser against a real server
     1 their ask on the clause, the editor opened on it, Jambo's wording applied that is EXACTLY what stands:
       Save is live and the foot says what it will do ("Their change is undone — Save rejects it")
     2 Save presses the Redlines row's own Reject (its reason question, over the editor, pressable); answered,
       their change is rejected with the reason, the clause keeps its wording, the editor stays open and settles
       (Save grey, "No changes yet")
     3 an applied wording that DIFFERS from what stands is the ordinary Save, unchanged
     4 the owner's three screens: Save is on screen and pressable
   AT THE PARENT 1 fails: Save is grey and the foot says "No changes yet".
   Run: node test/chromium/save-keeps-standing-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, fixtureContract, FOLDER_A } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const DOC = '1. Supply\nThe Supplier shall supply milk.\n2. Price\nInvoices fall due within 45 days.\n'
  + '4. Governing Law\nThis Agreement is governed by the laws of Sweden. Disputes go to the courts of Stockholm.';
const WHY = 'Swedish law stands, per our standard.';

(async () => {
  const h = await startHati({}, { HATI_AGENTS_AUTO: 'off' });
  const W = await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const me = (await W.admin.json('/api/bootstrap')).me;
    for (const id of ['MK-GL1', 'MK-GL2']) {
      const c0 = fixtureContract(id, 'Supply Agreement', 'Nandi Dairy', FOLDER_A, 900000, 'Under Review', DOC);
      Object.assign(c0, { owner: { id: me.id, name: me.name }, negotiation: { round: 1, turn: 'owner', turnAt: new Date().toISOString(), rounds: [] } });
      await W.admin.json('/api/contracts/' + id, { method: 'PUT', body: { contract: c0, baseVersion: 0 } });
    }
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-GL2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});

    /* their ask, through the product's own funnel; the editor on it; Jambo's wording applied */
    const stage = async (id, wording) => {
      const s = await page.evaluate(async id => {
        const c = getContract(id); if (c._light && window.ensureFull) await ensureFull(c);
        const cl = negoClauseList(c).find(x => /Governing/.test(JSON.stringify(x)));
        const ch = await negoFileChange(c, { clauseId: cl.clauseId, changeType: 'modify', side: 'counterparty', author: 'Erik',
          oldText: cl.text, newText: cl.text.replace('Sweden', 'Kenya').replace('Stockholm', 'Nairobi'), summary: 'Kenya', why: 'Our home' });
        await persist(c);
        openRedlineWorkbench(id);
        return { clauseId: cl.clauseId, text: cl.text, ch: ch && ch.id };
      }, id);
      await until(id => !!document.querySelector(`[data-nego-reject]`), id, 10000);
      await page.evaluate(s => rlOpenClauseEditor(getContract(s.id), s.clauseId, {}), { ...s, id });
      await until(() => !!document.querySelector('#clause-editor [data-ce-act="save"]'), null, 8000);
      const applied = await page.evaluate(w => ceApply(w, 'Playbook'), wording(s.text));
      return { ...s, applied };
    };
    const foot = () => page.evaluate(() => { const s = document.querySelector('#clause-editor [data-ce-act="save"]'), d = document.querySelector('#ce-draft');
      return { save: s && s.textContent, live: !!s && !s.disabled, title: s && s.title, draft: d && d.textContent.trim() }; });

    /* 1 */
    const S = await stage('MK-GL1', t => t);
    check('0 the stage: their ask filed and the standing wording applied', !!(S.ch && S.applied), JSON.stringify(S));
    const F1 = await foot();
    check('1a Save is live', F1.live, JSON.stringify(F1));
    check('1b the foot says what Save will do', F1.draft === 'Their change is undone — Save rejects it' && /^Rejects CHG-/.test(F1.title || ''), JSON.stringify(F1));

    /* 4 the three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(250);
      const G = await page.evaluate(() => { const s = document.querySelector('#clause-editor [data-ce-act="save"]'), r = s.getBoundingClientRect();
        return { hit: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === s, inView: r.bottom <= innerHeight && r.right <= innerWidth }; });
      check(`4 ${w}×${ht}: Save is on screen and pressable`, G.hit && G.inView, JSON.stringify(G));
    }

    /* 2 */
    await page.click('#clause-editor [data-ce-act="save"]');
    const asked = await until(() => { const ok = document.getElementById('pd-ok'); if (!ok) return null;
      const r = ok.getBoundingClientRect(); return document.elementFromPoint(r.left + 5, r.top + 5) === ok; }, null, 5000);
    check('2a the row\'s own reason question opens, over the editor', !!asked);
    if (asked) { await page.fill('#pd-input', WHY); await page.click('#pd-ok'); }
    const R = await until(id => { const c = getContract(id), ch = (c.changes || [])[0];
      return ch && ch.status !== 'pending' ? { status: ch.status, reply: ch.reply } : null; }, 'MK-GL1', 6000);
    check('2b their change is rejected, with the reason', R && R.status === 'rejected' && R.reply === WHY, JSON.stringify(R));
    const F2 = await until(() => { const s = document.querySelector('#clause-editor [data-ce-act="save"]'), d = document.querySelector('#ce-draft');
      return s && s.disabled && d && d.textContent.trim() === 'No changes yet' ? true : null; }, null, 4000);
    check('2c the editor stays open and settles: Save grey, "No changes yet"', !!F2, JSON.stringify(await foot()));
    const kept = await page.evaluate(id => { const c = getContract(id); const cl = negoClauseList(c).find(x => /Governing/.test(JSON.stringify(x))); return cl && cl.text; }, 'MK-GL1');
    check('2d the clause keeps its wording', /laws of Sweden/.test(kept || '') && !/Kenya/.test(kept || ''), kept);
    await page.evaluate(() => { try { rlCloseClauseEditor(); } catch (_) {} });

    /* 3 */
    await page.setViewportSize({ width: 1440, height: 780 });
    const S3 = await stage('MK-GL2', t => t.replace('Sweden', 'England and Wales'));
    const F3 = await foot();
    check('3 a wording that differs is the ordinary Save, unchanged', S3.applied && F3.live && /^Saves into CHG-/.test(F3.title || '') && /^Draft saved at/.test(F3.draft || ''), JSON.stringify(F3));
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
