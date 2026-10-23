/* Chromium verification: EDIT KEEPS THE CARD (Young, 9 Oct 2026)
   ============================================================
   "Delete the writing related to the terms on record", "for parties lets go
   with Directory", "for the terms field, there should be no more fields than
   what is in image 1 ... go with the soft fill", "the card should not expand
   when you click edit. the parties side should simply be on a scroll".
   At 1440, 1280 and 1100 (light only — RE-POINTED 20 Oct 2026, Chambers:
   HaTi has no dark mode any more, so the dark pass is removed):
     1. the sentence beside Read the brief is gone
     2. the essentials card is exactly as tall in Edit as at rest, and stays
        so with a person's form open
     3. Edit draws the eight terms' boxes and no other term
     4. a term box has no visible edge at rest (soft fill)
     5. the parties are the Directory; a person's press opens their form,
        inside the parties' own scroller
     6. no page errors
   Waits ask for the state, bounded. Red at main b36867d (1–5).
   Run: node test/chromium/edit-keeps-the-card-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const contract = { id: 'MK-EK1', contractNo: 'MK-EK1', name: 'Supply', counterparty: 'Juno Limited', counterpartyEmail: 'amina@juno.co.ke',
  party: 'Young', folder: 'proc', status: 'Draft', value: 300000, template: 'RM', fields: { effDate: '2026-07-31' },
  metadata: { paymentTerms: '30', contractType: 'Raw Material Supply', noticePeriodDays: 60, volumeRebate: '2%' },
  participants: [{ id: 'pt_a', name: 'Amina Wanjiru', email: 'amina2@juno.co.ke', role: 'negotiate', access: 'all' },
    { id: 'pt_b', name: 'Peter Otieno', email: 'peter@young.co', role: 'sign', access: 'all' }],
  obligations: [], comments: [], rounds: [], versions: [], signatures: [], compliance: { consent: false }, audit: [] };
const EIGHT = ['contractType', 'governingLaw', 'disputes', 'value', 'effDate', 'expiry', 'renewalType', 'paymentTerms', 'liabilityCapped'];

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  await W.admin.json('/api/contracts/MK-EK1', { method: 'PUT', body: { contract, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    for (const width of [1440, 1280, 1100]) {
      const tag = `light ${width}`;
      const page = await (await browser.newContext({ viewport: { width, height: 900 } })).newPage();
      page.on('pageerror', e => errors.push(e.message));
      const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
        while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
        return v; };
      await page.goto(h.base + '/', { waitUntil: 'networkidle' });
      await page.fill('#li-email', 'admin@example.co.ke');
      await page.fill('#li-pass', 'adminpassword1');
      await page.click('#li-go');
      await page.waitForFunction(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-EK1'), null, { timeout: 20000 });
      /* RE-POINTED 15 Oct 2026 (step 8, the room retired): the Overview's
         sheet is the contract strip's Details page on Home's Board — where the
         reader edits it now — opened by its one door (roomOverviewOpen) */
      /* RE-POINTED 22 Oct 2026 (owner's yes: the Details page RETIRED on a computer): the Overview's sheet still stands in the room opened by name (openWorkspace(id,{room:true})) and is checked there */
      await page.evaluate(() => { openWorkspace('MK-EK1', { room: true }); roomOverviewOpen(getContract('MK-EK1')); });
      const up = await until(() => !!document.querySelector('#kt-ov-terms [data-ov-edit="all"]') && !!document.getElementById('ov-ess'));
      if (!up) { check(`0. ${tag}: the Overview and its Edit are drawn`, false, await page.evaluate(() => state.view + ' ' + state.activeId + ' ' + !!document.querySelector('#kt-ov-terms') + ' ' + [...document.querySelectorAll('[data-ov-edit]')].map(e => e.getAttribute('data-ov-edit') + '<' + (e.parentElement.closest('[id]') || {}).id).join(','))); await page.close(); continue; }
      const H = () => page.evaluate(() => document.getElementById('ov-ess').getBoundingClientRect().height);
      check(`1. ${tag}: no sentence beside Read the brief`, await page.evaluate(() => !document.querySelector('.ov-top-note')
        && !document.querySelector('.ov-top').textContent.includes(i18t('ov_top_note').slice(0, 30))));
      /* RE-POINTED 21 Oct 2026 (THE BOARD READS, owner 20 Oct 2026, the Legora way): the sheet on the
         Board's card no longer turns into boxes — its Edit brings the paper up with Key terms standing in
         the middle (pdKtOpen → pdKtMid), so the card cannot grow; checks 3–5 (the eight boxes, the soft
         fill, the Directory inside the card) had no card left to measure and are retired with it */
      /* RE-POINTED 22 Oct 2026 (the Details page RETIRED on a computer; the Board's card is gone): the
         sheet is measured where it still stands, the room opened by name — its Edit turns the terms into
         boxes and the essentials card keeps its height (the owner's "the card should not expand") */
      const rest = await H();
      await page.click('#kt-ov-terms [data-ov-edit="all"]');
      const boxes = await until(() => { const n = document.querySelectorAll('#ov-ess [data-kt], #ov-ess [data-ktm]').length; return n ? n : null; });
      check(`2. ${tag}: Edit turns the essentials into boxes`, !!boxes, `${boxes} boxes`);
      const edit = await H();
      check(`2a. ${tag}: the essentials card is exactly as tall in Edit as at rest`, Math.abs(edit - rest) <= 1, `${rest.toFixed(1)} → ${edit.toFixed(1)}`);
      await page.close();
    }
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
