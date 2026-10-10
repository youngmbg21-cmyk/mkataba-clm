/* THE TERMS A BUILT-IN PAPER PRINTS FREEZE AT THE FIRST SIGNATURE — measured
   in a real browser (the owner's list, 27 Sep 2026).

   "On contracts drafted from HaTi's built-in templates, the key terms can
   still be changed after the first person signs, so the next signer could see
   different paper."

   The server is the wall (f408). This file measures the grey on the screen a
   person uses: the real app, the Overview's `Edit these details` pressed on
   The deal and The record, the boxes counted. A contract from HaTi's own
   template with one signature taken offers no box for any term its paper
   prints — value, the two days, who they are, who we are — and each read-out
   says why on its hover. A term the paper does not print (the notice period)
   is still a box. The same contract unsigned is the CONTROL.

   Against the parent (3ee647b) this file reports 3 of 7 failed — every
   printed term is still a box after the first signature, nothing says why,
   and the server answers 200 to a changed value. 1 is the stage; 4 and 5 are
   controls; 7 is the error sweep. */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const PRINTED = ['value', 'effDate', 'expiry', 'counterparty', 'party'];

const contract = (id, signed) => ({
  id, name: 'Raw material supply — Kabras Sugar', counterparty: 'Kabras Sugar Ltd',
  counterpartyEmail: 'legal@kabras.example', party: 'Highland Corporate Ltd', folder: 'proc',
  status: 'Under Review', value: 62000000, valueType: 'estimated', template: 'RM',
  fields: { effDate: '2026-09-24' }, expiry: '2027-10-31',
  metadata: { noticePeriodDays: 90, governingLaw: 'Kenya' },
  comments: [], rounds: [], versions: [], signatures: [], compliance: { consent: false }, audit: [],
  signerPlan: [
    { id: 'sg-us-1', party: 'internal', order: 1, name: 'Amina Otieno', email: 'admin@example.co.ke', role: 'Director',
      signed, ...(signed ? { signedAt: '2026-09-27T09:00:00Z' } : {}) },
    { id: 'sg-cp-1', party: 'counterparty', order: 2, name: 'Grace Njeri', email: 'grace@kabras.example', role: 'Director', signed: false },
  ],
});

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  for (const c of [contract('MK-PF1', true), contract('MK-PF2', false)])
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* Open the Overview with BOTH sections in their edit posture — the acts a
       person presses — and read which printed terms are boxes. */
    const boxesOn = async id => {
      await page.evaluate(x => { state.activeId = x; state.selId = x; setView('workspace'); }, id);
      await page.waitForTimeout(1500);
      await page.click('#ws-tabs [data-ws-tab="terms"]');
      await page.waitForTimeout(1000);
      /* RE-POINTED IN PLACE 1 Oct 2026 (Read Down): nothing folds, and the
         sheet has ONE Edit that turns both postures on together. */
      await page.waitForTimeout(500);
      const b = page.locator('[data-ov-edit="all"]').first();
      if (await b.count()){ await b.click(); await page.waitForTimeout(700); }
      /* RE-POINTED 10 Oct 2026 — follows "Overview Edit keeps the card"
         (469bc5a, 9 Oct 2026): Edit draws the EIGHT terms only (value and the
         two days among them), and who they are / who we are moved to the ⋯
         row "Filing and stream" (`ws-filing` → ovOpenFiling, Young's yes,
         8 Oct 2026). So BOTH acts a person presses are pressed — Edit, then
         the filing row — and the printed terms are read across the Overview.
         The notice period is no longer drawn as a box in Edit (it is said on
         the renewal term's line), so the CONTROL is another recorded term
         this paper does not freeze: the governing law (`data-ktm`). */
      await page.evaluate(() => { const f = document.getElementById('ws-filing'); if (f) f.click(); });
      await page.waitForFunction(() => {
        const r = document.getElementById('ov-record');
        return r && r.getBoundingClientRect().height > 0;
      }, null, { timeout: 5000 }).catch(() => {});
      return page.evaluate(printed => {
        const host = document.getElementById('kt-ov-terms') || document;
        const has = k => !!host.querySelector(`[data-kt="${k}"]`);
        const why = [...host.querySelectorAll('span[title]')].map(x => x.getAttribute('title'))
          .filter(t => /Signing has started/.test(t)).length;
        return { boxes: printed.filter(has), notice: !!host.querySelector('[data-ktm="governingLaw"]'), why };
      }, PRINTED);
    };
    const signed = await boxesOn('MK-PF1');
    const open = await boxesOn('MK-PF2');
    check('1 GATE — unsigned, every printed term is a box behind Edit (the stage bites)',
      open.boxes.length === PRINTED.length, open.boxes.join(', '));
    check('2 once one party has signed, NONE of the printed terms is a box',
      signed.boxes.length === 0, 'still boxes: ' + (signed.boxes.join(', ') || 'none'));
    check('3 and the read-outs say why on their hover', signed.why >= PRINTED.length, signed.why + ' read-outs carry the reason');
    check('4 CONTROL — a term the paper does not freeze (the governing law) is still a box', signed.notice);
    check('5 CONTROL — unsigned, nothing says it is frozen', open.why === 0);
    const refused = await page.evaluate(async () => {
      const r = await fetch('/api/contracts/MK-PF1', { credentials: 'same-origin' });
      const c = await r.json(); const v = c._v; delete c._v;
      const put = await fetch('/api/contracts/MK-PF1', { method: 'PUT', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contract: { ...c, value: 1 }, baseVersion: v }) });
      return put.status;
    });
    check('6 and the server refuses the same change had anyone sent it', refused === 409, 'status ' + refused);
    check('7 no page error anywhere in the run', errors.length === 0, errors.join(' | ') || 'none');
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:\n  ' + bad.map(b => b.name).join('\n  ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
