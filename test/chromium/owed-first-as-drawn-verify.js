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
   THE SECOND PASS (the checker's list, 18 Oct 2026; node half f754):
     2a re-pointed — our standard named for the kind of contract whose book
        applies, not the standard's topic
     7 an example of the answer in each owed box ("e.g. <the first of next
       month>", "A number"); no "Fill from document" over the rows; no chips
       under the face
     4d the paper beside a company form: owed blanks amber, answers typed but
        not yet in the wording underlined, dotted
     8 an NDA's two facts in a card of their own, "Confidentiality · 2 to
       confirm", each "read from clause 5", its reading in a box, "Read from the
       wording, not yet confirmed by a person. · Confirm"
     9 an employment agreement in a private stream: "Private · <stream>", "only
       the people named on <stream> see it"; Pay in a card of its own (Part ·
       How often · Amount, base pay owed said, Edit pay ›); Jambo waits for a
       press, its cost said
   THE THIRD PASS (the checker's second list, 18 Oct 2026; main brought in;
   node half f754 (8)):
     1e re-pointed — "clause N" lands on the paper's spot through the one
        lander (LAND ON IT), the cursor kept in the box
     7a re-pointed — the owner's answer (5): no example in an empty owed box
     8c the NDA editor's own names ("Secret until"); "· Confirm" on its line
     9c re-pointed — the cost in Jambo calls; 9d base pay owed an amber pill
        with its dot; 9e the wait line straight under Pay, with Jambo's face
     10 Jambo perches over nothing of the face, at its top and foot, at the
        owner's three screens
     11 the size on the paper's line beside Fill in, nothing above the sheet;
        back above the sheet once Fill in closes
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
  /* 8 and 9 (pass 2): an NDA whose wording says both facts, and an employment agreement in a private stream */
  const NDA_TXT = 'MUTUAL NON-DISCLOSURE AGREEMENT\n\n1. Parties\nBetween Highland Corporate Ltd and Kettle & Co.\n\n5. Confidentiality\nThis is a mutual agreement: each party keeps the other party\'s confidential information secret. The obligations of confidentiality shall survive for a period of three (3) years following termination.';
  const nda = Object.assign({}, upload, { id: 'MK-0406', name: 'Mutual NDA with Kettle & Co', counterparty: 'Kettle & Co', fields: {}, valueType: 'none', metadata: { currency: 'KES', category: 'nda' },
    redlineText: '<h1>MUTUAL NON-DISCLOSURE AGREEMENT</h1><h4>5. Confidentiality</h4><p>Each party keeps the other\'s information secret, for three (3) years following termination.</p>',
    upload: { fileName: 'MK-0406.docx', fileHash: 'h-0406', mime: upload.upload.mime, extractedText: NDA_TXT } });
  const job = Object.assign({}, upload, { id: 'MK-0407', name: 'Employment agreement — CFO', counterparty: 'Annika Holm', folder: 'corp', fields: {}, metadata: { currency: 'KES', category: 'employment' },
    redlineText: '<h1>EMPLOYMENT AGREEMENT</h1><h4>2. Start</h4><p>The Employee starts on [Start date].</p>', upload: { fileName: 'MK-0407.docx', fileHash: 'h-0407', mime: upload.upload.mime },
    pay: { every: 'month', parts: [{ id: 'p1', label: 'Bonus', every: 'year', amount: null, words: 'up to 30 % of base pay' }] } });
  for (const c of [upload, company, nda, job]) await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const meA = (await W.admin.json('/api/bootstrap')).me;
  await W.admin.json('/api/private-streams/corp', { method: 'PUT', body: { on: true, ids: [meA.id] } });
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
    await page.evaluate(() => { const r = [...document.querySelectorAll('#pd-fillface [data-pd-owed]')].find(x => x.querySelector('[data-blankf="up_notice_period"]'));
      const b = r && r.querySelector('[data-pd-ff-at]'); if (b) b.click(); });
    /* RE-POINTED (the third pass; main's LAND ON IT): the spot is lit by the one lander (.is-landed) */
    const atPress = await until(() => { const lit = document.querySelector('#ig-canvas .is-landed[data-upblank="up_notice_period"]'); if (!lit) return null;
      return { focus: (document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('data-blankf') : null, lit: true,
        green: !!document.querySelector('#ig-canvas .is-fieldlit[data-upblank="up_notice_period"]') }; }, null, 4000);
    check('1e pressed, "clause 3" lands on its spot on the paper through the one lander, the cursor kept in the box', !!atPress && atPress.focus === 'up_notice_period' && atPress.lit, JSON.stringify(atPress));
    await shot(page, '8-owed-first-1440x780');

    /* 7 (pass 2) an example of the answer in each owed box; nothing over the rows; no chips */
    const E7 = await page.evaluate(() => { const f = document.getElementById('pd-fillface'), vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const ph = k => (f.querySelector(`[data-blankf="${k}"]`) || {}).placeholder;
      const d = new Date(todayISO() + 'T12:00:00Z'); d.setUTCDate(1); d.setUTCMonth(d.getUTCMonth() + 1);
      return { start: ph('up_start_date'), value: ph('up_expected_yearly_value'), notice: ph('up_notice_period'),
        want: 'e.g. ' + d.toLocaleDateString(langLocale(), { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
        fillDoc: vis(f.querySelector('#kt-fill')), chips: document.querySelectorAll('#ig-dock [data-ig-chips] button').length }; });
    /* RE-POINTED (the third pass; the owner's answer (5): empty owed boxes stay empty with the amber wash, no "e.g. …") */
    const EG = await page.evaluate(() => [...document.querySelectorAll('#pd-fillface [data-pd-owed="1"] :is(input, textarea)')].map(x => x.placeholder || '')
      .concat([...document.querySelectorAll('#pd-fillface [data-pd-owed="1"] .dp-v')].map(x => x.textContent)));
    check('7a no example in any empty owed box — no "e.g. …", no "A number"; a date says "Pick a date"', E7.start !== E7.want && EG.every(x => !/^e\.g\.|^t\.ex\.|^A number$/.test(x)), JSON.stringify({ E7, EG }));
    check('7b no "Fill from document" over the owed rows, no chips under the face', !E7.fillDoc && E7.chips === 0, JSON.stringify({ fillDoc: E7.fillDoc, chips: E7.chips }));
    /* 2 our standard */
    const N = await page.evaluate(() => { const r = document.querySelector('#pd-fillface [data-blankf="up_notice_period"]').closest('[data-pd-owed]'); const st = r.querySelector('[data-pd-ff-std]');
      return { owed: r.getAttribute('data-pd-owed'), std: st ? st.innerText.replace(/\s+/g, ' ').trim() : '', kind: pdFillStdKind(getContract('MK-0405')) }; });
    /* RE-POINTED (pass 2, 18 Oct 2026): named for the kind of contract whose book applies ("Our standard for freight: 6 months") */
    check('2a under the owed notice period: "Our standard for <the kind of contract>: 90 days · Use it"', !!N && !!N.kind && N.kind !== 'termination' && N.std === `Our standard for ${N.kind}: 90 days Use it`, JSON.stringify(N));
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
    /* 4d (pass 2) the paper beside it: owed blanks amber, answers not yet in the wording underlined */
    const P4 = await page.evaluate(() => { const cv = document.getElementById('ig-canvas'); const amber = getComputedStyle(document.documentElement).getPropertyValue('--st-amber-bg').trim();
      const probe = document.createElement('i'); probe.style.background = amber; document.body.appendChild(probe); const want = getComputedStyle(probe).backgroundColor; probe.remove();
      const blank = cv.querySelector('.hati-field[data-field-key="notice"]'), done = [...cv.querySelectorAll('.hati-field-done[data-field-key]')];
      return { blank: blank ? getComputedStyle(blank).backgroundColor === want : null,
        pend: done.map(x => x.getAttribute('data-field-key') + ':' + getComputedStyle(x).textDecorationStyle + ':' + getComputedStyle(x).textDecorationLine).sort() }; });
    check('4d the paper: an owed blank amber; the three typed answers underlined, dotted', P4.blank === true && P4.pend.join('|') === 'carrier:dotted:underline|lane:dotted:underline|route:dotted:underline', JSON.stringify(P4));
    await page.click('#pd-fillface [data-pd-ff-docfill]');
    const filled = await until(() => { const c = getContract('MK-0410'); const t = ((document.querySelector('#pd-fillface [data-pd-ff-doc]') || {}).innerText || '').replace(/\s+/g, ' ');
      return !tplFormPending(c) && /Road/.test(c.redlineText || '') ? t : null; }, null, 8000);
    check('4c pressed: the wording carries them, and the card says so', !!filled && /The answers are in the wording\./.test(filled), filled);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
      await shot(page, `8-owed-first-company-${w}x${ht}`);
    }
    /* 8 and 9 (pass 2), as an admin, who is named on the private stream */
    const pa = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    pa.on('pageerror', e => errors.push(e.message));
    const untilA = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await pa.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await pa.waitForTimeout(120); } return v; };
    await pa.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pa.fill('#li-email', 'admin@example.co.ke'); await pa.fill('#li-pass', 'adminpassword1'); await pa.click('#li-go');
    await untilA(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-0407'), null, 20000);
    await pa.keyboard.press('Escape').catch(() => {});
    const openA = async id => { await pa.evaluate(async i => { const c = getContract(i); if (c._light && window.ensureFull) await ensureFull(c); setView('dashboard'); pdOpenOnHome(i, 'copilot'); }, id);
      await untilA(i => window.intel && intel.paper && intel.paper.id === i && !!document.getElementById('ig-canvas'), id, 15000);
      await pa.evaluate(i => pdFillOpen(i), id);
      await untilA(() => !!document.querySelector('#pd-fillface [data-pd-owed]'), null, 10000); await pa.waitForTimeout(500); };
    await openA('MK-0406');
    const N8 = await pa.evaluate(() => { const f = document.getElementById('pd-fillface'), t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const rows = [...f.querySelectorAll('[data-pd-ff-card="nda"]')];
      return { head: t(f.querySelector('[data-pd-ff-ndh]')), rows: rows.map(r => ({ at: t(r.querySelector('.det-nda-at')), box: t(r.querySelector('.det-nda-box')), line: t(r.querySelector('.det-nda-line')) })),
        inStill: rows.some(r => r.getBoundingClientRect().top < (f.querySelector('[data-pd-ff-owend]') || r).getBoundingClientRect().top && r.getBoundingClientRect().top > (f.querySelector('[data-pd-ff-owh]') || r).getBoundingClientRect().bottom && !!f.querySelector('[data-pd-ff-owh] h4')) }; });
    check('8a an NDA\'s facts in a card of their own: "Confidentiality · 2 to confirm"', N8.head === 'Confidentiality 2 to confirm' && N8.rows.length === 2 && !N8.inStill, JSON.stringify(N8));
    /* (the third pass) the NDA's own editor's names, and "· Confirm" on its sentence's line */
    const N8c = await pa.evaluate(() => [...document.querySelectorAll('#pd-fillface [data-pd-ff-card="nda"]')].map(r => { const lab = r.querySelector('.cd-lab, span'), tail = r.querySelector('.det-nda-tail');
      return { label: (lab ? lab.textContent : '').replace(/\s*\*\s*$/, '').trim(), tail: tail ? tail.textContent.trim() : '', lines: tail ? tail.getClientRects().length : 0,
        alone: (() => { const b = r.querySelector('[data-det-nda]'), t = tail && tail.firstChild; if (!b || !t) return null;
          const range = document.createRange(); range.selectNodeContents(t); const tr = range.getBoundingClientRect(), br = b.getBoundingClientRect();
          return Math.abs((tr.top + tr.bottom) / 2 - (br.top + br.bottom) / 2) > 8; })() }; }));
    check('8c the facts by the NDA editor\'s own names — "Who keeps it secret", "Secret until" — and "· Confirm" never on a line of its own',
      N8c.length === 2 && N8c[0].label === 'Who keeps it secret' && N8c[1].label === 'Secret until' && N8c.every(r => r.tail === 'person. · Confirm' && r.lines === 1 && r.alone === false), JSON.stringify(N8c));
    check('8b each "read from clause 5", its reading in a box, "Read from the wording, not yet confirmed by a person. · Confirm"',
      N8.rows.length === 2 && N8.rows.every(r => r.at === 'read from clause 5' && r.line === 'Read from the wording, not yet confirmed by a person. · Confirm')
      && N8.rows[0].box === 'Both sides (mutual)' && N8.rows[1].box === '3 years after the agreement ends', JSON.stringify(N8.rows));
    await shot(pa, '8-owed-first-nda-1440x780');
    await openA('MK-0407');
    const P9 = await pa.evaluate(() => { const f = document.getElementById('pd-fillface'), t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const pay = f.querySelector('[data-pd-ff-pay]');
      return { priv: t(f.querySelector('.pd-ff-priv')), payHead: t(pay && pay.querySelector('.pd-ff-card-h')), th: pay ? [...pay.querySelectorAll('th')].map(t) : [],
        base: pay ? [...pay.querySelectorAll('tbody tr:first-child td')].map(t) : [], edit: t(pay && pay.querySelector('[data-pd-ff-pay-edit]')),
        payRow: [...f.querySelectorAll('[data-pd-ff-card="pay"]')].every(r => getComputedStyle(r).display === 'none'), wait: t(f.querySelector('[data-pd-ff-wait]')) }; });
    check('9a a private stream says so: "Private · <stream>", "only the people named on <stream> see it"', /^Private · .+ only the people named on .+ see it$/.test(P9.priv), P9.priv);
    check('9b Pay in a card of its own: "Pay · kept apart from deal value · never added to a total", Part · How often · Amount, base pay owed, Edit pay ›',
      P9.payHead === 'Pay · kept apart from deal value · never added to a total' && P9.th.join('|') === 'Part|How often|Amount' && P9.base.join('|') === 'Base pay|Monthly|not filled in yet · needed before signing'
      && P9.edit === 'Edit pay ›' && P9.payRow, JSON.stringify(P9));
    /* RE-POINTED (the third pass; the owner's answer (4)): the cost in Jambo calls, lower case mid-line */
    check('9c Jambo waits for a press, its cost said in calls', P9.wait === 'Jambo reads a private stream’s contract only when someone presses. Read it now · about three Jambo calls', P9.wait);
    /* 9d–9e (the third pass) as drawn: base pay owed an amber pill with its dot; the wait line straight under Pay, with Jambo's face */
    const P9b = await pa.evaluate(() => { const f = document.getElementById('pd-fillface'), pay = f.querySelector('[data-pd-ff-pay]'), wait = f.querySelector('[data-pd-ff-wait]');
      const pill = pay && pay.querySelector('tbody tr.is-base .pd-pill.is-warn'), dot = pill && pill.querySelector('i');
      const cards = [...f.querySelectorAll('.pd-ff-work > *')].filter(el => el.getClientRects().length && el !== wait && el !== pay && el.getBoundingClientRect().height > 8);
      const pr = pay.getBoundingClientRect(), wr = wait.getBoundingClientRect();
      const between = cards.filter(el => { const r = el.getBoundingClientRect(); return r.top >= pr.bottom - 1 && r.bottom <= wr.top + 1; }).map(el => el.className);
      return { pill: pill ? pill.textContent.trim() : null, dot: !!dot && parseFloat(getComputedStyle(dot).width) > 0, under: wr.top >= pr.bottom - 1 && wr.top - pr.bottom < 24, between,
        face: !!wait.querySelector('img.pd-ff-wait-face, .pd-ff-wait-face') }; });
    check('9d base pay owed: "● not filled in yet · needed before signing", the amber pill with its dot', P9b.pill === 'not filled in yet · needed before signing' && P9b.dot, JSON.stringify(P9b));
    check('9e the wait line stands straight under the Pay card, with Jambo\'s small face', P9b.under && !P9b.between.length && P9b.face, JSON.stringify(P9b));
    /* 10 (the third pass) Jambo perches in empty space: over nothing of the face, at any scroll, at every screen */
    const perchClear = () => pa.evaluate(() => { const p = document.querySelector('#ig-dock .jb-perch img'); if (!p) return { perch: false };
      const pr = p.getBoundingClientRect(), f = document.getElementById('pd-fillface');
      const hits = [...f.querySelectorAll('*')].filter(el => { if (!el.getClientRects().length || el.children.length) return false; const r = el.getBoundingClientRect();
        const sc = f.closest('.scroll-thin, #igd-body') || f; const vr = sc.getBoundingClientRect();
        const top = Math.max(r.top, vr.top), bot = Math.min(r.bottom, vr.bottom); if (bot <= top) return false;
        return r.right > pr.left + 1 && r.left < pr.right - 1 && bot > pr.top + 1 && top < pr.bottom - 1; }).map(el => el.tagName + '.' + el.className);
      return { perch: true, hits }; });
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await pa.setViewportSize({ width: w, height: ht }); await pa.waitForTimeout(400);
      const top = await perchClear();
      await pa.evaluate(() => { let e = document.getElementById('pd-fillface'); while (e && e !== document.body){ if (e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY)){ e.scrollTop = e.scrollHeight; break; } e = e.parentElement; } });
      await pa.waitForTimeout(250);
      const bot = await perchClear();
      check(`10 ${w}×${ht}: Jambo perches over nothing of the face, at its top and at its foot`, top.perch && bot.perch && !top.hits.length && !bot.hits.length, JSON.stringify({ top: top.hits, bot: bot.hits }));
      await shot(pa, `8-owed-first-private-${w}x${ht}`);
    }
    await pa.setViewportSize({ width: 1440, height: 780 }); await pa.waitForTimeout(300);
    /* 11 (the third pass) the size on the paper's line beside Fill in, nothing above the sheet; it goes back when Fill in closes */
    const Z = () => pa.evaluate(() => { const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const strip = document.getElementById('ig-strip'), line = strip && strip.querySelector('.ig-zc-line'), row = document.querySelector('#ig-paper-scroll > .paper-zc-row');
      const sheet = document.querySelector('#ig-paper .pg-sheet, #ig-paper .ig-sheet, #ig-canvas');
      return { line: vis(line) ? line.innerText.replace(/\s+/g, ' ').trim() : null, row: vis(row), gap: strip && sheet ? Math.round(sheet.getBoundingClientRect().top - strip.getBoundingClientRect().bottom) : null }; });
    const Z1 = await Z();
    check('11a beside Fill in the size stands on the paper\'s line, nothing above the sheet', !!Z1.line && /100%/.test(Z1.line) && !Z1.row && Z1.gap != null && Z1.gap <= 24, JSON.stringify(Z1));
    await pa.evaluate(() => pdFillClose()); await pa.waitForTimeout(500);
    const Z2 = await Z();
    check('11b Fill in closed, the size is the paper\'s own again, above the sheet', !Z2.line && Z2.row, JSON.stringify(Z2));
    await shot(pa, '8-owed-first-private-1440x780');
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
