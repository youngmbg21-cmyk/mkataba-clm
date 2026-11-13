/* A COMPANY STANDARD'S OWN FIELDS ARE FILLED ON THE PAPER (owner, 12 Nov 2026: "Fix all company-standard contracts so
   fields can be filled on the paper"; their MK-469 lease: "when i go to fill in on paper, it pushed me to the page" — the
   form). New look on, a lease made from a standard with a name, a date, a number and a choice:
     1 · Fill in the contract opens the paper with a line for each of the four fields (the choice a list), none for the
         signature field; the panel lists each under its own heading, and does not call them "no place on the paper"
     2 · a press inside a line types there: no form opens over the paper
     3 · a choice picked from HaTi's own list lands on the line
     4 · Save stores the answers through the standard's form and the wording carries them; the paper's line is gone
   At the parent 1–4 fail: only the two signature lines, the fields named "no place on the paper", a press opens the form.
   Run: node test/chromium/company-standard-on-the-paper-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const TF = require('../../js/templateform.js');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
let fails = 0;
const check = (name, ok, more) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${more ? ' — ' + (typeof more === 'string' ? more : JSON.stringify(more)) : ''}`); if (!ok) fails++; };
const until = async (page, fn, arg, ms = 12000) => { try { await page.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const form = { templateId: 'T9', templateName: 'Commercial Lease', versionNumber: 1,
    fields: [{ fieldKey: 'tenant', label: 'Tenant Name', fieldType: 'short_text', required: true },
      { fieldKey: 'start', label: 'Commencement Date', fieldType: 'date', required: true },
      { fieldKey: 'cover', label: 'Insurance Coverage Limit Per Occurrence', fieldType: 'number', required: true },
      { fieldKey: 'law', label: 'Governing Law Jurisdiction', fieldType: 'select', options: ['Kenya', 'England and Wales'], required: true },
      { fieldKey: 'sig', label: 'Signed', fieldType: 'signature_name_title' }],
    values: {},
    blocks: [{ blockType: 'heading', content: 'COMMERCIAL LEASE AGREEMENT', orderIndex: 0 },
      { blockType: 'paragraph', content: 'This lease is made with {{tenant}} and starts on {{start}}.', orderIndex: 1 },
      { blockType: 'heading', content: 'ARTICLE IV: INSURANCE AND INDEMNIFICATION', orderIndex: 2 },
      { blockType: 'paragraph', content: 'Tenant shall maintain insurance of not less than ${{cover}} per occurrence.', orderIndex: 3 },
      { blockType: 'heading', content: 'ARTICLE XVI: GOVERNING LAW', orderIndex: 4 },
      { blockType: 'paragraph', content: 'This Agreement is governed by the laws of {{law}}.', orderIndex: 5 }] };
  const c = { id: 'MK-TF1', name: 'Commercial Lease Agreement', counterparty: 'Ventura Capital', party: '', folder: 'proc', status: 'Draft', value: 0,
    template: null, format: 'rich', templateForm: form, redlineText: TF.templateFormDocHtml(form), fields: {}, comments: [], rounds: [], versions: [],
    signatures: [], metadata: {}, compliance: { consent: false }, audit: [] };
  await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => { console.log('PAGE ERROR', String(e).slice(0, 300)); fails++; });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    /* the sign-in's own landing on the Board is waited for first, or it paints over the contract */
    await until(page, () => typeof roomHomeLand === 'function' && !!window.getContract && !!getContract('MK-TF1') && window._cnSignedIn === false, null, 40000);
    await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); roomHomeLand('MK-TF1'); });
    await until(page, () => typeof pdOnPaper === 'function' && pdOnPaper(), null, 20000);
    await page.evaluate(() => { try { pd2WalkClose(); } catch (_) {} pdFillGo('MK-TF1'); });
    const up = await until(page, () => !!document.querySelector('#ig-canvas [data-pd2-bl]'), null, 8000);
    /* 1 */
    const A = await page.evaluate(() => ({ lines: [...document.querySelectorAll('#ig-canvas [data-pd2-bl]')].map(x => x.tagName + ':' + x.getAttribute('data-pd2-bl')),
      heads: [...document.querySelectorAll('#ig-dock .pd2-fp[data-pd2-fp-row]')].map(r => (r.querySelector('.pd2-fp-q') || {}).textContent || ''),
      rest: ((document.querySelector('#ig-dock .pd2-fp-rest') || {}).textContent || '') }));
    check('1 a line for each field on the paper, the choice a list, under its own heading; none "with no place on the paper"',
      up && A.lines.join() === 'INPUT:tenant,INPUT:start,INPUT:cover,SELECT:law' && A.heads.some(x => /ARTICLE IV: INSURANCE/.test(x)) && A.heads.some(x => /GOVERNING LAW/.test(x))
        && !/Tenant Name|Insurance Coverage|Governing Law/.test(A.rest), A);
    /* 2 */
    if (up){ await page.click('#ig-canvas [data-pd2-bl="cover"]'); await page.keyboard.type('5,000,000'); }
    await page.waitForTimeout(300);
    const B = await page.evaluate(() => ({ modal: !!document.querySelector('#modal-root .pd2-fm-t, #modal-root [data-pd-mid]'), on: (document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('data-pd2-bl') : '' }));
    check('2 a press inside a line types there; no form opens', up && !B.modal && B.on === 'cover', B);
    /* 3 */
    let law = '';
    if (up){ await page.click('#ig-canvas [data-pd2-bl="law"]'); await page.waitForTimeout(250);
      await page.getByText('Kenya', { exact: true }).last().click().catch(() => {}); await page.waitForTimeout(250);
      law = await page.evaluate(() => document.querySelector('#ig-canvas [data-pd2-bl="law"]').value); }
    check('3 a choice picked from HaTi\'s own list lands on the line', law === 'Kenya', law);
    /* 4 */
    if (up){ await page.click('#ig-canvas [data-pd2-bl="tenant"]'); await page.keyboard.type('Ventura Capital Ltd'); await page.click('[data-pd2-fill-save]'); }
    const saved = await until(page, () => !document.getElementById('pd2-fill-head'), null, 8000);
    await page.waitForTimeout(1200);
    const C = await page.evaluate(async () => { const r = await api('contracts/MK-TF1'); const cc = r.contract || r;
      return { vals: cc.templateForm.values, words: /5,000,000/.test(cc.redlineText) && /Kenya/.test(cc.redlineText) && /Ventura Capital Ltd/.test(cc.redlineText) }; });
    check('4 Save stores the answers through the standard\'s form; the wording carries them',
      saved && C.vals.tenant === 'Ventura Capital Ltd' && C.vals.cover === '5,000,000' && C.vals.law === 'Kenya' && C.words, C);
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
