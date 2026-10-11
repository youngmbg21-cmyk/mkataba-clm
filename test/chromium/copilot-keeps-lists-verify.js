/* COPILOT KEEPS LISTS AS LISTS, WHERE THE READER LOOKS (owner, 11 Oct 2026,
   docs/WORKORDER-four-builds.md item 2).

   A suggestion that runs (a) to (d) into one paragraph — the owner's
   screenshot — is applied in the clause editor the way a card's Apply does
   (ceApply), and the clause on the editor's paper must show a lead line and
   one paragraph per point, each starting with its own label, with not one
   word changed. f661 pins the rule and the net; this is the paper. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'copilot-keeps-lists');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (name, good, detail) => { good ? pass++ : fail++;
  console.log(`${good ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

const RUN_ON = 'The Supplier shall: (a) process personal data only on documented written instruction from the Buyer; '
  + '(b) ensure that persons authorised to process the personal data have committed to confidentiality; '
  + '(c) implement appropriate technical and organisational measures; and '
  + '(d) at the termination of this Agreement, delete or return all personal data.';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const until = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => window.state && state.contracts && state.contracts.length > 0, null, 15000);
    /* the seed's own contract, once the server's list has landed */
    await until(page, () => state.contracts.some(c => c.id === 'MK-B2'), null, 15000);
    const id = 'MK-B2';
    await page.evaluate(id => openRedlineWorkbench(id), id);
    await until(page, () => !!document.querySelector('#view-redline .rl-paper'));
    const opened = await page.evaluate(id => { const c = getContract(id); const cl = negoClauseList(c)[1] || negoClauseList(c)[0];
      return rlOpenClauseEditor(c, cl.clauseId, {}) !== false; }, id);
    ok('1 the clause editor opens', opened && await until(page, () => !!document.getElementById('clause-editor')));
    const applied = await page.evaluate(t => ceApply(t, 'test'), RUN_ON);
    ok('2 the run-together suggestion applies', applied !== false);
    await until(page, () => /\(d\)/.test((document.querySelector('#clause-editor .ce-live, #clause-editor [data-ce-live], #clause-editor') || {}).textContent || ''));
    const r = await page.evaluate(() => {
      const draft = ceDraftNow();
      const box = document.createElement('div'); box.innerHTML = draft;
      const blocks = [...box.querySelectorAll('p, li')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
      return { blocks, text: blocks.join(' ') };
    });
    const labelled = r.blocks.filter(b => /^\([a-d]\)\s/.test(b));
    ok('3 the clause holds a lead line and one paragraph per point', labelled.length === 4 && /shall:$/.test(r.blocks[0] || ''),
      r.blocks.map(b => b.slice(0, 18)).join(' | '));
    const w = s => String(s).replace(/\s+/g, ' ').trim();
    ok('4 not one word changed', w(r.text) === w(RUN_ON), w(r.text).slice(0, 80));
    await page.screenshot({ path: path.join(OUT, '1-editor.png') });
    ok('5 no page errors', errs.length === 0, errs.slice(0, 2).join(' | ') || null);
  } catch (e) { fail++; console.log('FAIL  the check threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
