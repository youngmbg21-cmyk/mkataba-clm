/* J3 — PAPER THAT CAME FROM OUTSIDE.
   An uploaded contract is a CONTRACT, not a file attachment: the wording is the
   page, the file is ONE strip, and a PDF keeps its file preview because there
   is no text to lay out. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('/home/user/mkataba-clm/test/helpers');
const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const SHOTS = path.join(__dirname, 'shots');
const results = [];
const check = (n, p, d) => { results.push({ name: n, pass: !!p, detail: d }); console.log(`${p ? 'PASS' : 'FAIL'}  ${n}${d != null ? ' — ' + d : ''}`); };

(async () => {
  fs.mkdirSync(SHOTS, { recursive: true });
  const h = await startHati(); const W = await seedWorkspace(h); const A = W.admin;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1500, height: 1000 } })).newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const BODY = ['SERVICES AGREEMENT', '', 'This agreement is made between Meridian Freight Ltd and Highland Corporate Ltd.',
    '', '1. Services', 'The supplier shall provide warehousing services.', '',
    '2. Payment', 'Payment falls due within forty-five (45) days of invoice.', '',
    '3. Term', 'This agreement expires on 2028-03-31.'].join('\n');
  try {
    /* A RECEIVED third-party upload, NOT executed outside — the branch that
       draws the "sign to record X's acceptance" banner naming OUR party. This
       is the exact state that once took the whole Document tab down. */
    await A.json('/api/contracts/MK-UP1', { method: 'PUT', body: { contract: {
      id: 'MK-UP1', name: 'Warehousing Agreement (received)', counterparty: 'Meridian Freight Ltd',
      folder: 'proc', value: 2000000, valueType: 'standard', status: 'Under Review', template: null,
      expiry: '2028-03-31', metadata: { value: 2000000, currency: 'KES' },
      party: 'Highland Corporate Ltd', source: 'upload',
      upload: { fileName: 'meridian-warehousing.docx', size: 48211, docKind: 'docx',
        mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        extractedText: BODY, at: new Date().toISOString(), by: 'Amina Otieno', quality: 'good' },
      format: 'text',
      fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Uploaded', detail: 'meridian-warehousing.docx' }] } } });
    /* And a PDF, which has no text to lay out. */
    await A.json('/api/contracts/MK-UP2', { method: 'PUT', body: { contract: {
      id: 'MK-UP2', name: 'Scanned lease (pdf)', counterparty: 'Meridian Freight Ltd',
      folder: 'proc', value: 500000, valueType: 'standard', status: 'Under Review', template: null,
      expiry: '2028-03-31', metadata: {}, party: 'Highland Corporate Ltd', source: 'upload',
      upload: { fileName: 'scanned-lease.pdf', size: 91022, docKind: 'pdf', mime: 'application/pdf',
        at: new Date().toISOString(), by: 'Amina Otieno' },
      format: 'text', fields: {}, comments: [], signatures: [], obligations: [], rounds: [],
      audit: [{ at: new Date().toISOString(), user: 'Amina Otieno', action: 'Uploaded', detail: 'scanned-lease.pdf' }] } } });

    await page.goto(h.base + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await page.waitForTimeout(2600);

    const openDoc = async id => {
      await page.evaluate(cid => { state.activeId = cid; state.selId = cid; setView('workspace'); }, id);
      await page.waitForTimeout(1600);
      await page.click('[data-ws-tab="docs"]');
      await page.waitForTimeout(1600);
    };

    /* ---------- the .docx ---------- */
    await openDoc('MK-UP1');
    await page.screenshot({ path: path.join(SHOTS, 'j3-docx-document-tab.png') });
    const docx = await page.evaluate(() => {
      const root = document.querySelector('#view-workspace') || document.body;
      const txt = root.innerText.replace(/\s+/g, ' ');
      const sheet = document.querySelector('.doc-surface, .hati-doc, .rl-paper');
      /* a "contract inside a contract" = a separately scrolling bordered box
         holding the wording */
      const boxed = [...root.querySelectorAll('div')].filter(d => {
        const cs = getComputedStyle(d);
        return /auto|scroll/.test(cs.overflowY) && d.innerText.includes('warehousing services')
          && d !== document.scrollingElement && cs.borderTopWidth !== '0px';
      });
      return { hasWording: /warehousing services/.test(txt),
        hasFileName: /meridian-warehousing\.docx/.test(txt),
        hasDownload: !!document.querySelector('[data-dl-original],[download],a[href*="original"]')
          || /download original/i.test(txt),
        hasReread: !!document.querySelector('[data-reread]') || /re-read/i.test(txt),
        boxedCount: boxed.length,
        iframes: document.querySelectorAll('#view-workspace iframe').length,
        sheetFont: sheet ? getComputedStyle(sheet).fontSize : null };
    });
    check('J3: the uploaded wording IS the page (the text was read and is drawn)', docx.hasWording, `found "warehousing services": ${docx.hasWording}`);
    check('J3: the file is named on the page (the file strip)', docx.hasFileName, String(docx.hasFileName));
    check('J3: "Download original" is offered', docx.hasDownload, String(docx.hasDownload));
    check('J3: "Re-read document" is offered', docx.hasReread, String(docx.hasReread));
    check('J3: the wording is NOT boxed in a separately-scrolling card', docx.boxedCount === 0, `boxed scrollers holding the wording: ${docx.boxedCount}`);
    check('J3: a .docx with text draws no file preview frame', docx.iframes === 0, `iframes=${docx.iframes}`);
    check('J3: the received-upload Document tab renders without throwing (the OURS crash)', errors.length === 0, errors.join(' | ') || 'none');

    /* ---- THE READER'S TEXT-SIZE STEPPER MUST REACH UPLOADED WORDING ----
       Driven by PRESSING the real A-minus / A-plus buttons, which is what a
       reader does; the token itself lives on #doc-zoom, so writing it onto
       documentElement from outside proves nothing. */
    const stepper = await page.evaluate(() => ({
      present: !!document.querySelector('[data-rl-type]'),
      readout: (document.querySelector('.rl-type-out') || {}).textContent || null,
      visible: (() => { const b = document.querySelector('[data-rl-type]');
        if (!b) return false; const r = b.getBoundingClientRect(); return r.width > 4 && r.height > 4; })(),
    }));
    check('J3: the text-size stepper is on the Document tab as visible pixels',
      stepper.present && stepper.visible, `present=${stepper.present} visible=${stepper.visible} readout=${stepper.readout}`);

    const sizeAt = () => page.evaluate(() => {
      /* The INNERMOST element carrying the sentence — the paragraph the reader
         reads. The outer .blueprint wrapper is page chrome at a fixed size and
         correctly does not scale, so matching that one measures the wrong box. */
      const el = [...document.querySelectorAll('*')]
        .filter(n => (n.textContent || '').includes('warehousing services')).pop();
      return { px: el ? getComputedStyle(el).fontSize : null,
        readout: (document.querySelector('.rl-type-out') || {}).textContent || null };
    });
    const press = async (dir, times) => { for (let i = 0; i < times; i++) {
      await page.click(`[data-rl-type="${dir}"]`).catch(() => {}); await page.waitForTimeout(160); } };
    const base = await sizeAt();
    await press('1', 5);                       // A-plus five times: 15 -> 20
    const bigger = await sizeAt();
    await press('-1', 12);                     // A-minus down to the floor of 8
    const smaller = await sizeAt();
    await page.screenshot({ path: path.join(SHOTS, 'j3-docx-textsize.png') });
    check('J3: pressing A-plus really enlarges the UPLOADED wording',
      base.px && bigger.px && parseFloat(bigger.px) > parseFloat(base.px),
      `${base.readout} -> ${base.px}   then ${bigger.readout} -> ${bigger.px}`);
    check('J3: pressing A-minus really shrinks it again',
      smaller.px && parseFloat(smaller.px) < parseFloat(bigger.px),
      `${bigger.readout} -> ${bigger.px}   then ${smaller.readout} -> ${smaller.px}`);

    /* ---------- the PDF ---------- */
    await openDoc('MK-UP2');
    await page.screenshot({ path: path.join(SHOTS, 'j3-pdf-document-tab.png') });
    const pdf = await page.evaluate(() => {
      const root = document.querySelector('#view-workspace') || document.body;
      const txt = root.innerText.replace(/\s+/g, ' ');
      return { iframes: root.querySelectorAll('iframe,embed,object').length,
        hasFileName: /scanned-lease\.pdf/.test(txt),
        pretendsText: /warehousing services/.test(txt),
        txt: txt.slice(0, 260) };
    });
    check('J3: a PDF keeps its file preview frame', pdf.iframes > 0 || /pdf/i.test(pdf.txt),
      `frames=${pdf.iframes} · ${pdf.txt.slice(0, 140)}`);
    check('J3: nothing pretends to have read text a PDF does not carry', !pdf.pretendsText, String(pdf.pretendsText));
    check('J3: the PDF names its own file', pdf.hasFileName, String(pdf.hasFileName));
  } catch (e) {
    check('J3 walk completed without throwing', false, e.message + '\n' + e.stack);
  } finally {
    const pass = results.filter(r => r.pass).length;
    console.log(`\n${pass}/${results.length} checks passed`);
    fs.writeFileSync(path.join(__dirname, 'results.json'), JSON.stringify(results, null, 2));
    await browser.close(); await h.stop(); process.exit(0);
  }
})();
