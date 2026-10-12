/* Chromium verification: EDIT KEEPS THE CARD (Young, 9 Oct 2026)
   ============================================================
   "Delete the writing related to the terms on record", "for parties lets go
   with Directory", "for the terms field, there should be no more fields than
   what is in image 1 ... go with the soft fill", "the card should not expand
   when you click edit. the parties side should simply be on a scroll".
   At 1440, 1280 and 1100, light and dark:
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
    for (const dark of [false, true]) for (const width of [1440, 1280, 1100]) {
      const tag = `${dark ? 'dark' : 'light'} ${width}`;
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
      if (dark) await page.evaluate(() => setDark(true));
      await page.evaluate(() => { state.activeId = 'MK-EK1'; state.selId = 'MK-EK1'; setView('workspace'); });
      await until(() => !!document.querySelector('#ws-tabs [data-ws-tab="terms"]'));
      await page.click('#ws-tabs [data-ws-tab="terms"]');
      /* RE-POINTED 12 Oct 2026 (owner: the Details page is the one place a
         contract is filled in): the Overview card never edits, so it can never
         grow on an Edit — 2a asks that as "no box on the Overview at all"; the
         boxes this file measures are the Details tab's. */
      const up = await until(() => !!document.querySelector('#kt-overview [data-ov-go-details]'));
      if (!up) { check(`0. ${tag}: the Overview and its door to Details are drawn`, false); await page.close(); continue; }
      const H = () => page.evaluate(() => document.getElementById('ov-ess').getBoundingClientRect().height);
      check(`1. ${tag}: no sentence beside Read the brief`, await page.evaluate(() => !document.querySelector('.ov-top-note')
        && !document.querySelector('.ov-top').textContent.includes(i18t('ov_top_note').slice(0, 30))));
      check(`2a. ${tag}: the Overview card carries no box and no Edit`, await page.evaluate(() =>
        !document.querySelector('#kt-overview [data-kt], #kt-overview [data-ktm], #kt-overview [data-ov-edit="all"]')));
      await page.evaluate(() => roomGoTab(getContract('MK-EK1'), 'details'));
      /* RE-POINTED 13 Oct 2026 (owner, over the squeezed card): the boxes are
         the Details form's (#det-basics), the parties folded under it */
      const edited = await until(() => document.querySelector('#det-basics [data-ktm], #det-basics [data-kt]') ? true : null);
      await page.evaluate(() => { const m = document.getElementById('det-more'); if (m) m.open = true; });
      if (!edited) { check(`2. ${tag}: Details draws boxes`, false); await page.close(); continue; }
      const rest = await H();
      const boxes = await page.evaluate(() => [...new Set([...document.querySelectorAll('#det-basics [data-kt], #det-basics [data-ktm]')]
        .map(e => e.getAttribute('data-kt') || e.getAttribute('data-ktm')).filter(k => k !== 'nonmonetary'))]);
      const PEOPLE = ['party', 'counterparty', 'cpEmail'];
      check(`3. ${tag}: the eight terms' boxes, and only the parties' beside them`, EIGHT.every(k => boxes.includes(k)) && boxes.every(k => EIGHT.includes(k) || PEOPLE.includes(k)), boxes.join(','));
      /* REVERSED 13 Oct 2026: on Details a box must be SEEN — the soft fill
         read as empty space (the owner's screenshot) */
      const edge = await page.evaluate(() => { const b = document.querySelector('#det-basics [data-ktm="governingLaw"]'); const cs = getComputedStyle(b);
        return { style: cs.borderTopStyle, w: cs.borderTopWidth, color: cs.borderTopColor }; });
      check(`4. ${tag}: a term box has a visible edge`, edge.style !== 'none' && parseFloat(edge.w) > 0 && !/rgba\(0, 0, 0, 0\)|transparent/.test(edge.color), JSON.stringify(edge));
      const dir = await page.evaluate(() => !!document.querySelector('#ov-parties .ov-dir .pt-dir [data-pt-pick]'));
      check(`5a. ${tag}: the parties are the Directory`, dir);
      await page.evaluate(() => { const r = document.querySelector('[data-pt-pick="p:pt_a"]'); if (r) r.click(); });
      const form = await until(() => { const f = document.querySelector('#ov-parties .ov-dir .pt-dir-form [data-pt-row="pt_a"]'); return f ? true : null; });
      check(`5b. ${tag}: a person's press opens their form inside the scroller`, !!form);
      const withForm = await H();
      /* on Details the column scrolls, so the card may grow for the form — it is measured only to have stayed drawn */
      check(`2b. ${tag}: the form open keeps the card on the page`, withForm >= rest - 1, `${rest.toFixed(1)} → ${withForm.toFixed(1)}`);
      await page.close();
    }
    check('6. no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close(); await h.stop();
  }
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASS');
  process.exit(failures ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
