/* STILL OWED, THE LEGORA WAY, EVERY DRAWN PART (owner picked "The Legora way"
   by name, 20 Oct 2026, from the four drawn options; it REVERSES round 8's
   "Owed first" face, whose drawn parts this file pinned until then;
   js/paperdesk.js pdOgHtml, pdOgFacts, pdOgConfirm, pdKtHtml)

   WHAT THIS PINS, driven in a real browser by a colleague who may not re-file
   (Restricted Legal), then by an admin, on an uploaded freight framework with
   blanks, a company form with answers not yet in its wording, an NDA whose
   wording says both facts, and an employment agreement in a private stream
     1 the head: "Still owed · N"; the grid's columns "Fact · where Jambo read
       it" · "Jambo read" · Confirm; each row says where it lands ("§3 on the
       paper"), a press on it lands on the spot through the one lander
     2 our standard as the reading in the box: "Our standard for <kind>: 90
       days"; Confirm stores it through the box's own writer, the paper shows
       it, the server holds it
     3 the answered ones are Key terms' lines under the grid, folded
     4 the company form: "3 answers are on the paper as you typed them, not
       yet in the wording." · Fill the document in Still owed; the paper's
       typed answers underlined, dotted; pressed, the wording carries them
     6 the owner's three screens: the first owed row in view, nothing sideways
     8 an NDA: both facts read — "· N read from the wording · Confirm all N",
       each row "§5" with the passage quoted, its reading in the box; Confirm
       all stores both; the rows say saved
     9 a private stream: the Dossier says who may open it; base pay is its
       row's Edit pay; What Jambo read waits for the press, its cost said
    10 nothing of Jambo sits over the grid at the owner's three screens —
       re-pointed 21 Oct 2026 (Chambers): the perch is gone, so no perched
       bird is drawn anywhere beside the paper
    11 no face, so the size stays the paper's own, above the sheet
   NOT CARRIED, by the pick (said to the owner): the face's "N of M done"
   head, its card frames, the stream chips and their Ask an admin, the Pay
   table beside the paper (the Board card keeps it).
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/owed-first-as-drawn-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');
const { ckOpenRowOf } = H;
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
      await until(i => !!document.querySelector(`#pd-og[data-pd-og-for="${i}"] tr.pd-og-row`), id, 10000);
      await page.waitForTimeout(400); };
    const GRID = () => { const og = document.getElementById('pd-og'); if (!og) return null; const t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      return { head: t(document.querySelector('#pd-needs .pd-gl-h')), cols: [...og.querySelectorAll('thead th')].map(t),
        rows: [...og.querySelectorAll('tr.pd-og-row')].map(r => ({ k: r.getAttribute('data-pd-og-row'), cls: r.className, src: t(r.querySelector('.pd-og-src')),
          chip: t(r.querySelector('.pd-og-cl')), ok: !!r.querySelector('[data-pd-og-ok]'), box: (r.querySelector('.pd-og-v input, .pd-og-v select') || {}).value })) }; };

    /* 1 the head, the columns, where each lands */
    await openFill('MK-0405');
    const G = await page.evaluate(GRID);
    const row = k => G.rows.find(r => r.k === k) || {};
    /* RE-POINTED 22 Oct 2026 (owner picked "1 · Checklist"): the head is "Needs you N" */
    check('1a the head "Needs you N"; the columns "Fact · where Jambo read it" · "Jambo read" · Confirm', /^Needs you \d+/.test(G.head) && G.cols[0] === 'FACT · WHERE JAMBO READ IT' && G.cols[1] === 'JAMBO READ', JSON.stringify({ head: G.head, cols: G.cols }));
    check('1c each blank says where it lands on the paper', row('up_start_date').chip === '§3' && /on the paper/.test(row('up_start_date').src) && row('up_expected_yearly_value').chip === '§4', JSON.stringify(G.rows));
    await ckOpenRowOf(page, '#pd-og [data-pd-og-spot="up_start_date"]'); await page.click('#pd-og [data-pd-og-spot="up_start_date"]');
    const atPress = await until(() => !!document.querySelector('#ig-canvas .is-landed[data-upblank="up_start_date"]'), null, 4000);
    check('1e pressed, "§3" lands on its spot on the paper through the one lander', !!atPress);
    await shot(page, '8-owed-first-1440x780');

    /* 2 our standard, the reading in the box */
    const N = await page.evaluate(() => ({ std: (document.querySelector('#pd-og tr[data-pd-og-row="up_notice_period"] [data-pd-ff-std]') || {}).innerText || '',
      box: (document.querySelector('#pd-og [data-blankf="up_notice_period"]') || {}).value, kind: pdFillStdKind(getContract('MK-0405')), cls: (document.querySelector('#pd-og tr[data-pd-og-row="up_notice_period"]') || {}).className }));
    check('2a the owed notice period: "Our standard for <the kind of contract>: 90 days", in the box as the reading', !!N.kind && N.kind !== 'termination' && N.std.trim() === `Our standard for ${N.kind}: 90 days` && N.box === '90 days' && /is-read/.test(N.cls), JSON.stringify(N));
    check('2b a box no standard names is offered nothing', !/Our standard/.test(row('up_start_date').src) && !row('up_start_date').box);
    await ckOpenRowOf(page, '#pd-og [data-pd-og-ok="up_notice_period"]'); await page.click('#pd-og [data-pd-og-ok="up_notice_period"]');
    const used = await until(() => { const c = getContract('MK-0405');
      return c.fields && c.fields.up_notice_period === '90 days' ? { paper: /90 days/.test(document.getElementById('ig-canvas').textContent), saved: !!document.querySelector('#pd-og tr.is-saved[data-pd-og-row="up_notice_period"]') } : null; }, null, 6000);
    check('2c Confirm: the box\'s own writer stored it, the paper shows it, the row says saved', !!used && used.paper && used.saved, JSON.stringify(used));
    await page.evaluate(() => window.flushSaves && flushSaves()).catch(() => {});
    const rec = await W.admin.json('/api/contracts/MK-0405');
    check('2d on the record, on the server', rec.fields && rec.fields.up_notice_period === '90 days', JSON.stringify(rec.fields));

    /* 3 the answered ones are Key terms' lines, folded */
    /* RE-POINTED 21 Oct 2026 (THE MIDDLE, owner): Key terms is one line under the grid; its table (the rows it draws) stands in the middle when pressed */
    const fold = await page.evaluate(() => { const k = document.querySelector('#ig-dock [data-pd-kt-mid]'); const c = pdContract(); return k && c ? { open: !!document.querySelector('[data-pd-mid-kt]'), carrier: pdKtFacts(c).some(f => f.key === 'up_carrier_address') } : null; });
    check('3a the answered ones are Key terms\' lines, one line under the grid', !!fold && !fold.open && fold.carrier, JSON.stringify(fold));

    /* 6 the three screens */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht });
      await page.evaluate(() => pdFillOpen('MK-0405'));
      await page.waitForTimeout(500);
      const S = await page.evaluate(() => { const r = document.querySelector('#pd-og tr.pd-og-row:not(.is-saved)'); const b = r && r.getBoundingClientRect();
        return { inView: !!b && b.top >= 0 && b.bottom <= window.innerHeight, side: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
      check(`6 ${w}×${ht}: the first owed row in view, nothing sideways`, S.inView && S.side, JSON.stringify(S));
      await shot(page, `8-owed-first-${w}x${ht}`);
    }
    await page.setViewportSize({ width: 1440, height: 780 });

    /* 4 the company form */
    await openFill('MK-0410');
    const D = await page.evaluate(() => (document.querySelector('#pd-needs [data-pd-gl="docfill"]') || {}).innerText || '');
    check('4a Still owed: "3 answers are on the paper as you typed them, not yet in the wording." · Fill the document',
      /^3 answers are on the paper as you typed them, not yet in the wording\.\s+Fill the document$/.test(D.trim()), D);
    const P4 = await page.evaluate(() => { const cv = document.getElementById('ig-canvas'); const amber = getComputedStyle(document.documentElement).getPropertyValue('--st-amber-bg').trim();
      const probe = document.createElement('i'); probe.style.background = amber; document.body.appendChild(probe); const want = getComputedStyle(probe).backgroundColor; probe.remove();
      const blank = cv.querySelector('.hati-field[data-field-key="notice"]'), done = [...cv.querySelectorAll('.hati-field-done[data-field-key]')];
      return { blank: blank ? getComputedStyle(blank).backgroundColor === want : null,
        pend: done.map(x => x.getAttribute('data-field-key') + ':' + getComputedStyle(x).textDecorationStyle + ':' + getComputedStyle(x).textDecorationLine).sort() }; });
    check('4d the paper: an owed blank amber; the three typed answers underlined, dotted', P4.blank === true && P4.pend.join('|') === 'carrier:dotted:underline|lane:dotted:underline|route:dotted:underline', JSON.stringify(P4));
    await page.click('#pd-needs [data-pd-og-docfill]');
    const filled = await until(() => { const c = getContract('MK-0410'); return !tplFormPending(c) && /Road/.test(c.redlineText || '') && !document.querySelector('#pd-needs [data-pd-og-docfill]'); }, null, 20000);
    check('4c pressed: the wording carries them, and the line goes from Still owed', !!filled);
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(350);
      await shot(page, `8-owed-first-company-${w}x${ht}`);
    }
    /* 8 and 9, as an admin, who is named on the private stream */
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
      await untilA(i => !!document.querySelector(`#pd-og[data-pd-og-for="${i}"]`), id, 10000); await pa.waitForTimeout(500); };
    await openA('MK-0406');
    const N8 = await pa.evaluate(() => { const t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const r = k => document.querySelector(`#pd-og tr[data-pd-og-row="${k}"]`);
      return { head: t(document.querySelector('#pd-needs .pd-gl-h')), all: !!document.querySelector('#pd-needs [data-pd-og-all]'),
        rows: ['ndaDir', 'ndaEnds'].map(k => ({ k, chip: t(r(k) && r(k).querySelector('.pd-og-cl')), q: t(r(k) && r(k).querySelector('q')), cls: r(k) && r(k).className,
          box: k === 'ndaDir' ? (r(k).querySelector('[data-pd-og-nda="dir"]') || {}).value : (r(k).querySelector('[data-pd-og-nda="ends"]') || {}).value })) }; });
    /* RE-POINTED 22 Oct 2026 (the Checklist): "Confirm N read" in the head, the count of readings on its hover */
    check('8a an NDA: "Confirm N read" in Needs you\'s head', /Confirm \d read/.test(N8.head) && N8.all, N8.head);
    /* the wording counts secrecy from the agreement's end, which this record does not hold yet: quoted, the day asked (amber) */
    check('8b each fact "§5", the passage quoted; who keeps it secret read into its box, the day asked where the end is not on the record', N8.rows.every(r => r.chip === '§5' && r.q.length > 10)
      && /is-read/.test(N8.rows[0].cls) && N8.rows[0].box === 'mutual' && /is-amb/.test(N8.rows[1].cls) && !N8.rows[1].box, JSON.stringify(N8.rows));
    await shot(pa, '8-owed-first-nda-1440x780');
    await pa.click('#pd-needs [data-pd-og-all]');
    const conf = await untilA(() => { const c = getContract('MK-0406'); return c.nda && c.nda.dir === 'mutual' && !!document.querySelector('#pd-og tr.is-saved[data-pd-og-row="ndaDir"]') ? c.nda : null; }, null, 6000);
    check('8c Confirm all stores both through the facts\' own writer, the rows say saved', !!conf && conf.dir === 'mutual', JSON.stringify(conf));
    await openA('MK-0407');
    const P9 = await pa.evaluate(() => { const t = el => (el ? el.innerText : '').replace(/\s+/g, ' ').trim();
      const v = document.querySelector('#pd-og tr[data-pd-og-row="value"]');
      return { priv: t(document.querySelector('#pd-glance [data-pd-ds-card="private"]')), pay: !!(v && v.querySelector('[data-pd-og-pay]')), payWord: t(v && v.querySelector('.pd-og-f b')),
        wait: t(document.querySelector('#pd-glance [data-pd-ds-card="read"] .pd-gl-h')), cost: (document.querySelector('#pd-glance [data-pd-ds-read]') || {}).title || '', door: ((document.querySelector('#pd-glance [data-pd-ds-read]') || {}).textContent || '').trim() }; });
    check('9a a private stream: the Dossier says who may open it', P9.priv.length > 0 && /Private|private/.test(P9.priv), P9.priv);
    check('9b base pay owed: its row reads as pay, its door Edit pay', P9.pay && /pay/i.test(P9.payWord), JSON.stringify(P9));
    /* RE-POINTED 22 Oct 2026 (the Checklist): the brief's own row carries the press, "Read" */
    check('9c What Jambo read waits for the press, its cost said in calls', /^Read$/.test(P9.door) && /Jambo call/.test(P9.cost), JSON.stringify(P9));
    /* 10 nothing of Jambo sits over the grid.
       RE-POINTED 21 Oct 2026 (Chambers, the owner picked it by name; it
       reverses "JAMBO, ALIVE", 16 Oct): the perch is gone (jamboPerchMount,
       .jb-perch, .jb-bird deleted), so the claim is held as its absence — no
       perched bird, and the dock wears no perch class, at the top of the
       Dossier and at its foot */
    const perchClear = () => pa.evaluate(() => { const dock = document.getElementById('ig-dock');
      return { glance: !!document.getElementById('pd-glance'), birds: document.querySelectorAll('.jb-perch, .jb-bird').length,
        perched: !!dock && (dock.classList.contains('jb-perched') || dock.classList.contains('jb-perched-ask')) }; });
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await pa.setViewportSize({ width: w, height: ht }); await pa.waitForTimeout(400);
      const top = await perchClear();
      await pa.evaluate(() => { let e = document.getElementById('pd-glance'); while (e && e !== document.body){ if (e.scrollHeight > e.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(e).overflowY)){ e.scrollTop = e.scrollHeight; break; } e = e.parentElement; } });
      await pa.waitForTimeout(250);
      const bot = await perchClear();
      const clear = x => x.glance && x.birds === 0 && !x.perched;
      check(`10 ${w}×${ht}: no perched Jambo sits over the Dossier (the perch is gone), at its top and at its foot`, clear(top) && clear(bot), JSON.stringify({ top, bot }));
      await shot(pa, `8-owed-first-private-${w}x${ht}`);
    }
    await pa.setViewportSize({ width: 1440, height: 780 }); await pa.waitForTimeout(300);
    /* 11 no face: the size is the paper's own, above the sheet */
    const Z = await pa.evaluate(() => { const vis = el => !!(el && el.getClientRects().length && getComputedStyle(el).display !== 'none');
      const strip = document.getElementById('ig-strip'), line = strip && strip.querySelector('.ig-zc-line'), row = document.querySelector('#ig-paper-scroll > .paper-zc-row');
      return { line: vis(line), row: vis(row) }; });
    check('11 no face beside the paper: the size is the paper\'s own, above the sheet', !Z.line && Z.row, JSON.stringify(Z));
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
