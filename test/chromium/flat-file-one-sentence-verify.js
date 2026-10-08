/* A FLAT FILE GETS ONE HONEST SENTENCE (9 Oct 2026 review).
 *
 * Measured: a Word file with no headings and no numbering was uploaded; the file
 * strip said "Structure read from the wording" while the Clauses thread beside
 * it said "Nothing on this page reads as a clause". Two readings of one fact.
 * Now both say "No headings or numbering found — read as plain paragraphs".
 *
 * A REAL .docx through the real upload dialog; read where the reader looks. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const OUT = path.join(__dirname, 'shots', 'flat-file-one-sentence');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let pass = 0, fail = 0;
const ok = (n, g, d) => { g ? pass++ : fail++; console.log(`${g ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));
  const until = (fn, arg, ms = 12000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);
  const file = path.join(OUT, 'Plain_Letter_Agreement.docx');
  fs.writeFileSync(file, Buffer.from(mkDocx([
    'This letter records the agreement between the parties about the delivery of fresh produce each week.',
    'The supplier will deliver to the buyer\'s kitchen every Monday morning, and the buyer will check each delivery on arrival.',
    'The buyer will pay each invoice within thirty days of receiving it, by bank transfer to the account the supplier names.',
    'Either party may end this arrangement by giving the other one month\'s written notice at any time.',
  ].map(para).join(''))));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await until(() => typeof currentUser === 'function' && !!currentUser());
    await page.evaluate(() => openUploadModal());
    await page.waitForSelector('#up-file', { state: 'attached', timeout: 8000 });
    await (await page.$('#up-file')).setInputFiles(file);
    await until(() => !!document.querySelector('#up-go'), null, 15000);
    await page.fill('#up-cp', 'Shamba Fresh Ltd').catch(() => {});
    const t = await page.$('#up-triage'); if (t && await t.isChecked()) await t.uncheck();
    await page.click('#up-go');
    const id = await until(() => state.contracts.some(x => x.source === 'upload'
      && (x.upload || {}).fileName === 'Plain_Letter_Agreement.docx'), null, 15000)
      && await page.evaluate(() => state.contracts.find(x => (x.upload || {}).fileName === 'Plain_Letter_Agreement.docx').id);
    ok('1 the flat Word file is filed', !!id, id);
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(800);
    await page.evaluate(() => { const b = document.querySelector('[data-ws-tab="docs"]'); if (b) b.click(); });
    await until(() => !!document.querySelector('#doc-canvas'), null, 15000);
    await until(() => { const s = document.querySelector('[data-up-struct]'); return !!s && /No headings/.test(s.textContent); }, null, 8000);
    const read = await page.evaluate(() => {
      const s = document.querySelector('[data-up-struct]');
      const none = document.querySelector('#doc-thread .doc-xr-none');
      const door = document.querySelector('#ws-th-door');
      return { strip: s ? s.textContent.trim() : null, thread: none ? none.textContent.trim() : null,
        threadShown: !!(none && none.getClientRects().length), door: door ? door.textContent.replace(/\s+/g, ' ').trim() : null };
    });
    ok('2 the strip says the one sentence', /No headings or numbering found/.test(read.strip || ''), read.strip);
    ok('3 and never "Structure read from the wording" over a file nothing reads as clauses in',
      !/Structure read from the wording/.test(read.strip || ''), read.strip);
    ok('4 the thread, where it speaks, says the same sentence',
      read.thread == null || read.thread === read.strip, JSON.stringify(read));
    await page.screenshot({ path: path.join(OUT, '1-flat-file.png') });
  } catch (e) { ok('the run finished', false, String(e && e.stack || e)); }
  ok('no page error', errors.length === 0, errors.join(' | ') || 'none');
  await browser.close();
  await h.stop().catch(() => {});
  console.log(`\n${pass}/${pass + fail} checks passed`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
