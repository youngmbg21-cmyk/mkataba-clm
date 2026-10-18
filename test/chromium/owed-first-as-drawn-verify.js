/* FILL IN, "OWED FIRST", EVERY DRAWN PART (round 8 of the redesign, option 1
   "Owed first"; the owner's yes of 18 Oct 2026 to build every gap between the
   picked drawing and HaTi; js/paperdesk.js pdFillGroupsPaint,
   pdFillExtrasPaint, pdFillStreamAsk; js/standards.js stdValueFor)

   WHAT THIS PINS, driven in a real browser by a colleague who may not re-file
   (Restricted Legal), on an uploaded freight framework with blanks and on a
   company form with answers not yet in its wording
     1 the head: "N left", "N of M done · saved as you type"; "Still to fill"
       holds its rows as one card; each row says where it lands ("clause 3"),
       the row being typed in "on the paper · clause 3"
     2 under the owed notice period, Our standard: "Our standard for
       termination: 90 days · Use it" — Use it puts it in the box, the box's
       own writer stores it, the paper shows it
     3 the answered rows stay behind a shut "Filled", every one of them
     4 the document's card: "3 answers are on the paper as you typed them, not
       yet in the wording." · Fill the document — pressed, the wording carries
       them and the card says so
     5 the stream: "Moving a contract to another stream is an admin's act." ·
       Ask an admin — the ask is the Ask-an-admin record (the admin's list has
       it), and the row says when and whom it was asked of
     6 the owner's three screens: the first owed box in view, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/owed-first-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const TF = require('../../js/templateform.js');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};
const shot = async (page, name) => { if (!OUT) return; try { await page.screenshot({ path: path.join(OUT, name + '.png') }); } catch (_) {} };
const WORDING = ['<h1>FRAMEWORK AGREEMENT FOR FREIGHT SERVICES</h1>',
  '<p>between Highland Corporate Ltd (the “Customer”) and Baltic Freight Oy, Helsinki (the “Carrier”)</p>',
  '<h4>1. Scope</h4><p>1.1 The Carrier carries goods for the Customer by road and sea.</p>',
  '<h4>2. Parties</h4><p>2.1 The Carrier’s address is [Carrier address].</p>',
  '<h4>3. Term</h4><p>3.1 This Agreement starts on [Start date] and runs for two years. Either Party may end it on [Notice period] written notice.</p>',
  '<h4>4. Rates</h4><p>4.1 The expected yearly spend is [Expected yearly value].</p>'].join('');
const upload = { id: 'MK-0405', name: 'Framework agreement', counterparty: 'Baltic Freight Oy', party: 'Highland Corporate Ltd', folder: 'proc', status: 'Draft', source: 'upload', format: 'rich', value: 0,
  template: null, fields: { up_carrier_address: 'Satamakatu 4, Helsinki' }, redlineText: WORDING, upload: { fileName: 'MK-0405.docx', fileHash: 'h-0405', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  metadata: { currency: 'KES' }, comments: [], rounds: [], versions: [], signatures: [], compliance: { consent: false }, audit: [] };

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  const W = await H.seedWorkspace(h, { contracts: [], approvalRules: [] });
  const form = { templateId: 'T-FR', templateName: 'Freight framework', versionNumber: 2,
    fields: [{ fieldKey: 'carrier', label: 'Carrier', fieldType: 'text', required: true },
      { fieldKey: 'notice', label: 'Notice period', fieldType: 'text', required: true },
      { fieldKey: 'route', label: 'Routes', fieldType: 'text', required: false },
      { fieldKey: 'lane', label: 'Lane', fieldType: 'text', required: false }],
    values: {}, blocks: [{ blockType: 'heading', content: 'Framework agreement for freight services', orderIndex: 0 },
      { blockType: 'field_group', content: 'The Carrier is {{carrier}}. Either party may end it on {{notice}} notice. Routes: {{route}}. Lane: {{lane}}.', orderIndex: 1 }] };
  const wording = TF.templateFormDocHtml(form);
  form.filledSig = JSON.stringify([]);
  form.values = { carrier: 'Baltic Freight Oy', route: 'Sweden–Finland', lane: 'Road' };
  const company = { id: 'MK-0410', name: 'Freight framework', counterparty: 'Baltic Freight Oy', folder: 'proc', status: 'Draft', template: null, format: 'rich', value: 0,
    templateForm: form, redlineText: wording, fields: {}, metadata: { currency: 'KES' }, comments: [], rounds: [], versions: [], signatures: [], audit: [] };
  for (const c of [upload, company]) await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'restricted@example.co.ke'); await page.fill('#li-pass', 'their-own-pass-9'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0405'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    const openFill = async id => { await page.evaluate(async i => { const c = getContract(i); if (c._light && window.ensureFull) await ensureFull(c); setView('dashboard'); pdOpenOnHome(i, 'copilot'); }, id);
      await until(i => window.intel && intel.paper && intel.paper.id === i && !!document.getElementById('ig-canvas'), id, 15000);
      await page.evaluate(i => pdFillOpen(i), id);
      await until(() => !!document.querySelector('#pd-fillface [data-pd-owed="1"]'), null, 10000);
      await page.waitForTimeout(400); };
    const FACE = () => { const f = document.getElementById('pd-fillface'); if (!f) return null;
      const owh = f.querySelector('[data-pd-ff-owh]'), oe = f.querySelector('[data-pd-ff-owend]'), first = f.querySelector('[data-pd-owed="1"]');
      const oc = owh && getComputedStyle(owh), ec = oe && getComputedStyle(oe);
      return { count: (f.querySelector('[data-pd-ff-count]') || {}).textContent || '', pill: (f.querySelector('[data-pd-ff-pill]') || {}).textContent || '',
        card: !!(oc && ec && oc.borderTopStyle === 'solid' && parseFloat(oc.borderTopWidth) >= 1 && ec.borderBottomStyle === 'solid' && parseFloat(ec.borderBottomWidth) >= 1
          && first && owh.getBoundingClientRect().bottom <= first.getBoundingClientRect().top + 1 && first.getBoundingClientRect().bottom <= oe.getBoundingClientRect().top + 1),
        doc: (f.querySelector('[data-pd-ff-doc]') || {}).innerText || '', ro: ((f.querySelector('.pd-ff-ro') || {}).innerText || '').replace(/\s+/g, ' ').trim() }; };

    /* 1 the head, the card, where each lands */
    await openFill('MK-0405');
    const F = await page.evaluate(FACE);
    const R = await page.evaluate(() => { const f = document.getElementById('pd-fillface');
      const row = l => [...f.querySelectorAll('[data-pd-owed]')].find(x => ((x.querySelector('.cd-lab, span') || {}).textContent || '').replace(/\s*\*\s*$/, '').trim() === l);
      const at = r => r && r.querySelector('[data-pd-ff-at]') ? r.querySelector('[data-pd-ff-at]').innerText.trim() : '';
      return { start: at(row('Start date')), notice: at(row('Notice period')), value: at(row('Expected yearly value')) }; });
    check('1a the head: "N left" and "N of M done · saved as you type"', /^\d+ left$/.test(F.pill.trim()) && /^\d+ of \d+ done · saved as you type$/.test(F.count.trim()), JSON.stringify({ pill: F.pill, count: F.count }));
    check('1b "Still to fill" holds its owed rows as one card: its heading on top, its edge under the last', F.card, String(F.card));
    check('1c each row says where it lands on the paper', R.start === 'clause 3' && R.notice === 'clause 3' && R.value === 'clause 4', JSON.stringify(R));
    await page.click('#pd-fillface [data-blankf="up_start_date"]');
    const here = await page.evaluate(() => { const r = document.querySelector('#pd-fillface [data-blankf="up_start_date"]').closest('[data-pd-owed]'); return r.querySelector('[data-pd-ff-at]').innerText.trim(); });
    check('1d the row being typed in: "on the paper · clause 3"', here === 'on the paper · clause 3', here);
    const atPress = await page.evaluate(() => { const r = [...document.querySelectorAll('#pd-fillface [data-pd-owed]')].find(x => x.querySelector('[data-blankf="up_notice_period"]'));
      const b = r && r.querySelector('[data-pd-ff-at]'); if (!b) return null; b.click();
      return { focus: (document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('data-blankf') : null,
        lit: !!document.querySelector('#ig-canvas .is-fieldlit[data-upblank="up_notice_period"]') }; });
    check('1e pressed, "clause 3" puts the cursor in the box and lights its spot on the paper', !!atPress && atPress.focus === 'up_notice_period' && atPress.lit, JSON.stringify(atPress));
    await shot(page, '8-owed-first-1440x780');

    /* 2 our standard */
    const N = await page.evaluate(() => { const r = document.querySelector('#pd-fillface [data-blankf="up_notice_period"]').closest('[data-pd-owed]'); const st = r.querySelector('[data-pd-ff-std]');
      return { owed: r.getAttribute('data-pd-owed'), std: st ? st.innerText.replace(/\s+/g, ' ').trim() : '' }; });
    check('2a under the owed notice period: "Our standard for termination: 90 days · Use it"', !!N && N.std === 'Our standard for termination: 90 days Use it', JSON.stringify(N));
    const nodate = await page.evaluate(() => { const r = [...document.querySelectorAll('#pd-fillface [data-pd-owed]')].find(x => x.querySelector('[data-blankf="up_start_date"]')); return !r.querySelector('[data-pd-ff-std]'); });
    check('2b a box no standard names is offered nothing', nodate);
    await page.click('#pd-fillface [data-pd-ff-use]');
    const used = await until(() => { const b = document.querySelector('#pd-fillface [data-blankf="up_notice_period"]'); const c = getContract('MK-0405');
      return b && b.value === '90 days' && c.fields && c.fields.up_notice_period === '90 days' ? { paper: /90 days/.test(document.getElementById('ig-canvas').textContent), hint: !!b.closest('[data-pd-owed]').querySelector('[data-pd-ff-std]') } : null; }, null, 6000);
    check('2c Use it: the box holds it, the box\'s own writer stored it, the paper shows it, the offer is gone', !!used && used.paper && !used.hint, JSON.stringify(used));
    await page.evaluate(() => window.flushSaves && flushSaves()).catch(() => {});
    const rec = await W.admin.json('/api/contracts/MK-0405');
    check('2d on the record, on the server', rec.fields && rec.fields.up_notice_period === '90 days', JSON.stringify(rec.fields));

    /* 3 the fold holds on every row */
    const fold = await page.evaluate(() => { const r = [...document.querySelectorAll('#pd-fillface [data-pd-owed="0"]')]; const vis = el => !!(el.getClientRects().length && getComputedStyle(el).display !== 'none');
      return { n: r.length, shown: r.filter(vis).map(x => x.textContent.replace(/\s+/g, ' ').trim().slice(0, 30)), open: document.querySelector('#pd-fillface .pd-ff').classList.contains('is-filled-open') }; });
    check('3a behind a shut "Filled" every answered row is out of sight — the paper\'s questions too', fold.n >= 3 && !fold.open && !fold.shown.length, JSON.stringify(fold));
    await page.click('#pd-fillface [data-pd-ff-fold]');
    const opened = await page.evaluate(() => [...document.querySelectorAll('#pd-fillface [data-pd-owed="0"]')].every(el => el.getClientRects().length && getComputedStyle(el).display !== 'none'));
    check('3b opened, every one shows', opened);
    await page.click('#pd-fillface [data-pd-ff-fold]');

    /* 5 the stream: the rule's own door */
    const F5 = await page.evaluate(FACE);
    check('5a the stream says whose act it is, with Ask an admin', F5.ro === 'Moving a contract to another stream is an admin’s act. Ask an admin', F5.ro);
    await page.click('#pd-fillface [data-pd-ff-ask]');
    const asked = await until(() => { const t = ((document.querySelector('#pd-fillface .pd-ff-ro') || {}).innerText || '').replace(/\s+/g, ' ').trim(); return /Asked /.test(t) ? t : null; }, null, 8000);
    check('5b sent: the row says when and whom it was asked of', !!asked && /^Moving a contract to another stream is an admin’s act\. Asked Amina Otieno · .+$/.test(asked), asked);
    const asks = await W.admin.json('/api/settings-asks');
    const a = (asks.asks || []).find(x => x.panel === 'refile:MK-0405');
    check('5c it is the Ask-an-admin record, waiting in the admin\'s list', !!a && a.status === 'open' && a.what === 'Move MK-0405 Framework agreement to another stream', JSON.stringify(a));
    await shot(page, '8-owed-first-asked-1440x780');

    /* 6 the three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await page.waitForTimeout(400);
      const S = await page.evaluate(() => { const r = document.querySelector('#pd-fillface [data-pd-owed="1"]'); const b = r && r.getBoundingClientRect();
        return { inView: !!b && b.top >= 0 && b.bottom <= window.innerHeight, side: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
      check(`6 ${w}×${ht}: the first owed box in view, nothing sideways`, S.inView && S.side, JSON.stringify(S));
      await shot(page, `8-owed-first-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 4 the document's card */
    await openFill('MK-0410');
    const D = await page.evaluate(FACE);
    check('4a the document\'s card: "3 answers are on the paper as you typed them, not yet in the wording." · Fill the document',
      /^The document\s+3 answers are on the paper as you typed them, not yet in the wording\.\s+Fill the document$/.test(D.doc.trim()), D.doc);
    const own = await page.evaluate(() => { const b = document.querySelector('#pd-fill [data-tplf-fill]'); return b ? getComputedStyle(b).display : 'none'; });
    check('4b the press is said once: the form\'s own button stands behind the card\'s', own === 'none', own);
    await shot(page, '8-owed-first-document-1440x780');
    await page.click('#pd-fillface [data-pd-ff-docfill]');
    const filled = await until(() => { const c = getContract('MK-0410'); const t = ((document.querySelector('#pd-fillface [data-pd-ff-doc]') || {}).innerText || '').replace(/\s+/g, ' ');
      return !tplFormPending(c) && /Road/.test(c.redlineText || '') ? t : null; }, null, 8000);
    check('4c pressed: the wording carries them, and the card says so', !!filled && /The answers are in the wording\./.test(filled), filled);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
      await shot(page, `8-owed-first-company-${w}x${ht}`);
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
