/* THE FRONT PART IS FILLED ON A NEGOTIATED PAPER TOO (owner, 13 Nov 2026, of MK-469: "the top part brings me to the
   other middle page to fill in while the below part allows me to fill on paper"; picked option 1). A lease made from a
   company standard, its parties' details above the first heading, in negotiation (a change of theirs on the last
   clause):
     1 · Fill in the contract offers a line for each field in the front part as well as the clauses', none for the
         clause with the open change; the panel does not call the front fields "no place on the paper"
     2 · Save files the front answers as ONE change of ours on 'front', pending, carrying the words typed
   At the parent 1–2 fail: the front fields are no line, the panel names them, a press opens the form.
   Run: node test/chromium/front-part-on-a-negotiated-paper-verify.js */
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
      { fieldKey: 'addr', label: 'Tenant Principal Place of Business Address', fieldType: 'address', required: true },
      { fieldKey: 'cover', label: 'Insurance Coverage Limit Per Occurrence', fieldType: 'number', required: true },
      { fieldKey: 'law', label: 'Governing Law Jurisdiction', fieldType: 'select', options: ['Kenya', 'England and Wales'], required: true }],
    values: {},
    blocks: [{ blockType: 'heading', content: 'COMMERCIAL LEASE AGREEMENT', orderIndex: 0 },
      { blockType: 'paragraph', content: 'This lease is made between Landlord and {{tenant}}, having its place of business at {{addr}}.', orderIndex: 1 },
      { blockType: 'paragraph', content: 'RECITALS', orderIndex: 2 },
      { blockType: 'heading', content: '2. Insurance', orderIndex: 3 },
      { blockType: 'paragraph', content: 'Tenant shall maintain insurance of not less than ${{cover}} per occurrence.', orderIndex: 4 },
      { blockType: 'heading', content: '3. Rent', orderIndex: 5 },
      { blockType: 'paragraph', content: 'Rent is payable monthly in advance.', orderIndex: 6 },
      { blockType: 'heading', content: '4. Governing law', orderIndex: 7 },
      { blockType: 'paragraph', content: 'This Agreement is governed by the laws of {{law}}.', orderIndex: 8 }] };
  const c = { id: 'MK-TF2', name: 'Commercial Lease Agreement', counterparty: 'Ventura Capital', party: '', folder: 'proc', status: 'Draft', value: 0,
    template: null, format: 'rich', templateForm: form, redlineText: TF.templateFormDocHtml(form), fields: {}, comments: [], rounds: [], versions: [],
    signatures: [], metadata: {}, compliance: { consent: false }, audit: [] };
  await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 780 } });
    page.on('pageerror', e => { console.log('PAGE ERROR', String(e).slice(0, 300)); fails++; });
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(page, () => typeof roomHomeLand === 'function' && !!window.getContract && !!getContract('MK-TF2') && window._cnSignedIn === false, null, 40000);
    /* their change on the last clause makes the paper a negotiated one */
    await page.evaluate(async () => { await stPrefSet('newLook', true); newLookApply(); const k = getContract('MK-TF2'); await ensureFull(k);
      const cl = negoClauseList(k); const last = cl[cl.length - 1];
      await negoEditClause(k, last.clauseId, '<p>This Agreement is governed by the laws of England and Wales.</p>', { side: 'counterparty', author: 'Ventura Capital' });
      persist(k); roomHomeLand('MK-TF2'); });
    await until(page, () => typeof pdOnPaper === 'function' && pdOnPaper() && !!document.querySelector('.ig-redpaper'), null, 20000);
    await page.evaluate(() => { try { pd2WalkClose(); } catch (_) {} pdFillGo('MK-TF2'); });
    const up = await until(page, () => !!document.querySelector('#ig-canvas [data-pd2-bl]'), null, 8000);
    /* 1 */
    const A = await page.evaluate(() => ({ lines: [...document.querySelectorAll('#ig-canvas [data-pd2-bl]')].map(x => x.getAttribute('data-pd2-bl')),
      rest: ((document.querySelector('#ig-dock .pd2-fp-rest') || {}).textContent || '') }));
    check('1 the front part\'s fields are lines on the negotiated paper, the clauses\' too, none in the clause with an open change',
      up && A.lines.includes('nb~front~f:tenant~0') && A.lines.includes('nb~front~f:addr~0') && A.lines.some(k => /f:cover/.test(k)) && !A.lines.some(k => /f:law/.test(k))
        && !/Tenant Name|Tenant Principal/.test(A.rest), A);
    /* 2 */
    if (up){ await page.click('#ig-canvas [data-pd2-bl="nb~front~f:tenant~0"]'); await page.keyboard.type('Ventura Capital Ltd');
      await page.click('#ig-canvas [data-pd2-bl="nb~front~f:addr~0"]'); await page.keyboard.type('Riverside Drive, Nairobi');
      await page.click('[data-pd2-fill-save]'); }
    const saved = await until(page, () => !document.getElementById('pd2-fill-head'), null, 10000);
    await page.waitForTimeout(1500);
    const R = await page.evaluate(async () => { const r = await api('contracts/MK-TF2'); const k = r.contract || r;
      return (k.changes || []).filter(x => x.clauseId === 'front').map(x => ({ status: x.status, text: String(x.newText || '') })); });
    check('2 Save files the front answers as one change of ours on the front part, pending, with the words typed',
      saved && R.length === 1 && R[0].status === 'pending' && /Ventura Capital Ltd/.test(R[0].text) && /Riverside Drive, Nairobi/.test(R[0].text), R);
  } finally { await browser.close(); await h.stop(); }
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASS');
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
