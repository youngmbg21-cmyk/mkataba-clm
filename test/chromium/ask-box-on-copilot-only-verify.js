/* Chromium verification: THE ASK BOX UNDER EVERY TAB.
   RE-POINTED 22 Oct 2026 (owner, with a screenshot of Clauses and Obligations:
   "all side panels need to have jambo entry field and the bottom yet these two
   panels are missing it"). This file pinned the opposite, the owner's 12 Oct
   2026 ruling ("only Copilot tab ... should have a copilot field to Type in"),
   which the new words reverse; checks 2 and 3 are turned round with it.

   1 on Home's Document, the Copilot (Dossier) tab draws the ask box
   2 Clauses and Obligations draw it too
   3 a door that puts words in the box from Clauses (intelAskReady, the paper
     highlight's Ask) leaves the reader on Clauses, with the words in the box
   The full sweep (three screens, the slide-out panel): jambo-box-every-panel-verify.
   Run: node test/chromium/ask-box-on-copilot-only-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace, FIXTURES } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errs = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    /* a contract the SERVER holds (the page shows its own list first) */
    const id = FIXTURES[0].id;
    await page.waitForFunction(cid => window.state && Array.isArray(state.contracts) && state.contracts.some(c => c && c.id === cid), id, { timeout: 20000 });
    /* Home's first draw after sign-in can take the face back to the Board, so
       the open is asked again (at most three times) until Home's Document
       holds the contract and its tabs are up */
    /* Home has painted its first face and its panel before anything is opened */
    await page.waitForFunction(() => window.state && state.view === 'dashboard' && !!document.querySelector('#ig-dock [data-pd-tab="copilot"]')
      && !!document.querySelector('.hb-figs, #hb-board, #hb-head'), null, { timeout: 20000 }).catch(() => {});
    for (let i = 0; i < 3; i++) {
      await page.evaluate(cid => pdOpenOnHome(cid, 'copilot'), id);
      const up = await page.waitForFunction(cid => !!(window.intel && intel.paper && intel.paper.id === cid
        && document.querySelector('#ig-dock [data-pd-tab="doc"]')), id, { timeout: 6000 }).then(() => true, () => false);
      if (up) break;
    }
    const onTab = async t => {
      /* the reader's own press on the tab; if Home's late first draw took the
         face back to the Board meanwhile, the contract is opened again first */
      for (let i = 0; i < 3; i++) {
        if (!(await page.$('#ig-dock [data-pd-tab="doc"]'))) {
          await page.evaluate(cid => pdOpenOnHome(cid, 'copilot'), id);
          await page.waitForSelector('#ig-dock [data-pd-tab="doc"]', { timeout: 6000 }).catch(() => {});
        }
        await page.evaluate(tab => { const b = document.querySelector(`#ig-dock [data-pd-tab="${tab}"]`); if (b) b.click(); }, t);
        const on = await page.waitForFunction(tab => { const b = document.querySelector('#ig-dock .pd-tab.on');
          return !!b && b.getAttribute('data-pd-tab') === tab && !!document.querySelector('#ig-dock [data-pd-tab="doc"]'); }, t, { timeout: 4000 }).then(() => true, () => false);
        if (on) break;
      }
      return page.evaluate(() => ({ tab: (document.querySelector('#ig-dock .pd-tab.on') || { getAttribute: () => null }).getAttribute('data-pd-tab'),
        box: !!document.querySelector('#ig-dock #igd-input'), go: !!document.querySelector('#ig-dock #igd-go') }));
    };
    const cp = await onTab('copilot');
    ok('1 the Copilot tab draws the ask box', cp.tab === 'copilot' && cp.box && cp.go, JSON.stringify(cp));
    /* RE-POINTED 13 Oct 2026: the Overview tab is gone from Home's panel (owner) */
    for (const [t, name] of [['doc', 'Clauses'], ['oblig', 'Obligations']]) {
      const r = await onTab(t);
      ok(`2 ${name} draws the ask box too`, r.tab === t && r.box && r.go, JSON.stringify(r));
    }
    await onTab('doc');
    const ready = await page.evaluate(() => { const done = intelAskReady('What does the term clause say?');
      return { done, tab: (document.querySelector('#ig-dock .pd-tab.on') || { getAttribute: () => null }).getAttribute('data-pd-tab'),
        val: (document.getElementById('igd-input') || {}).value || null }; });
    ok('3 a door that fills the box from Clauses stays on Clauses, words in the box',
      ready.done && ready.tab === 'doc' && ready.val === 'What does the term clause say?', JSON.stringify(ready));
    ok('4 no page errors', errs.length === 0, errs.join(' | ').slice(0, 300));
  } finally { await browser.close(); await h.stop(); }
  console.log(`${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})();
