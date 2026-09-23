/* Chromium verification: SIGNING WITHOUT THE FACTS — THE THREE QUICK FIXES
   ============================================================
   Young, 23 September 2026, after a review of what a contract could be signed
   without: *"Go ahead but start from the latest main."* — the go on three
   quick fixes, each checked here where a person actually looks.

     1  AN EMPTY BOX IN OUR OWN PAPER HOLDS. A supply contract whose start date
        and material were never filled used to reach the Sign button with
        nothing in the way, and the signed copy said "Material: —". Measured on
        the Signing tab (the row, its sentence, its door, the button), on the
        Overview (the start date is the one box it owns, so its cell is marked
        and its mark is a door), and on the Send screen of a draft (the block
        and its tick).
     2  THE EFFECTIVE DATE AN UPLOAD READ REACHES THE OVERVIEW. A real Word
        file is uploaded through the real dialog and the date it carries is
        read back off the Overview's own cell.
     3  A COMPANY STANDARD WITH THE VALUE SKIPPED IS NOT "NON-MONETARY". Made
        through the real route with "Skip for now", then read off the Overview
        at rest and in its edit posture.

   Everything is read off the RENDERED page, never the source. A section that
   cannot be staged reports its failure rather than timing out.

   Run: node test/chromium/signing-without-the-facts-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, para } = require('../docxfix');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || fs.mkdtempSync(path.join(os.tmpdir(), 'f367-'));

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* THE SIGNING TAB'S ROW FOR THE EMPTY BOXES, as drawn. */
const readRow = page => page.evaluate(() => {
  const row = document.querySelector('#sign-check [data-sc-row="bl:blanks"]');
  const btn = document.getElementById('sign-btn');
  return {
    row: !!row,
    holds: !!(row && row.classList.contains('is-hold')),
    title: row ? ((row.querySelector('.sc-find-t span:not(.sc-mark):not(.sc-esc)') || {}).textContent || '').trim() : '',
    why: row ? ((row.querySelector('.sc-find-w') || {}).getAttribute
      ? ((row.querySelector('.sc-find-w').getAttribute('title') || row.querySelector('.sc-find-w').textContent) || '').trim() : '') : '',
    acts: row ? [...row.querySelectorAll('.sc-find-a button')].map(b => b.textContent.trim()) : [],
    signHolds: btn ? Number(btn.getAttribute('data-sign-holds') || 0) : -1,
    signText: btn ? btn.textContent.replace(/\s+/g, ' ').trim() : '',
  };
});

(async () => {
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ===== 1. THE EMPTY BOXES HOLD THE SIGNATURE =====
       MK-A2 is a Raw Material Supply contract under review whose start date
       and material were never filled — exactly the shape the review found.
       Staged at the door: a signer each side, a brief on file and read, the
       standards and the obligations read against this wording, no approval
       rule in the way — so the only thing left to hold it is the paper. */
    const staged = await page.evaluate(async () => {
      try {
        const c = getContract('MK-A2');
        await ensureFull(c);
        const me = currentUser();
        c.signerPlan = [
          { id: 'sg_me', party: 'internal', name: me.name, memberId: me.id, email: me.email, order: 1, signed: false },
          { id: 'sg_cp', party: 'counterparty', name: 'Ola Nordmann', email: 'ola@nandi.co.ke', order: 2, signed: false } ];
        c._brief = { v: 1, at: new Date(Date.now() + 60000).toISOString(), by: 'Stage', truncated: false, data: {} };
        if (window.briefMarkRead) briefMarkRead(c);
        const hash = playbookHashOf(playbookText(c));
        c.playbook = { label: 'Default', wordingHash: hash, verdicts: [] };
        c.obligationsReadHash = hash; c.signCheck = { at: new Date().toISOString(), wordingHash: hash };
        c.fields = { value: String(c.value) };
        state.settings = { ...(state.settings || {}), approvalRules: [] };
        persist(c); await flushSaves();
        openWorkspace(c.id);
        await new Promise(r => setTimeout(r, 500));
        roomGoTab(c, 'sign');
        await new Promise(r => setTimeout(r, 700));
        return { ok: true };
      } catch (e) { return { ok: false, err: String(e && e.message) }; }
    });
    check('1 · stage: MK-A2 at the door with its start date and material empty', staged.ok, staged.err);
    /* THE PAPER'S OWN DASHES: every box left empty is sealed as "—"
       (readOnlyDocHtml), so the count is a measurement of the signed copy. */
    const dashes = () => page.evaluate(() => { roomGoTab(getContract('MK-A2'), 'docs'); return new Promise(res => setTimeout(() => {
      const cv = document.getElementById('doc-canvas');
      res(cv ? [...cv.querySelectorAll('.field-frozen')].filter(x => x.textContent.trim() === '—').length : -1); }, 700)); });
    const dashesBefore = await dashes();
    await page.evaluate(() => { roomGoTab(getContract('MK-A2'), 'sign'); });
    await page.waitForTimeout(700);
    let r = await readRow(page);
    await page.screenshot({ path: path.join(OUT, '1-signing-tab.png') });
    check('1a the Before-you-sign list has a row for the empty boxes, and it holds', r.row && r.holds, JSON.stringify(r));
    check('1b it is titled for what it is', r.title === 'Fields left empty', r.title);
    check('1c it names the boxes rather than counting them',
      /2 fields in the wording are still empty: Start date, Material/.test(r.why), r.why);
    check('1d past Draft, a box only the wording holds is filled by proposing the words — the negotiation is the door',
      r.acts.length === 1 && r.acts[0] === 'Open the negotiation', JSON.stringify(r.acts));
    check('1e the Sign button counts it and does not promise a signature', r.signHolds >= 1 && /to settle/i.test(r.signText),
      `holds ${r.signHolds} · "${r.signText}"`);
    const before = await page.evaluate(() => (getContract('MK-A2').signatures || []).length);
    await page.click('#sign-btn');
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => ({ sigs: (getContract('MK-A2').signatures || []).length, pad: !!document.querySelector('.sig-pad, #sig-pad, [data-sig-pad]') }));
    check('1f pressing Sign signs nothing and opens no signature pad', after.sigs === before && !after.pad, JSON.stringify(after));

    /* ===== 2. THE OVERVIEW MARKS THE ONE BOX IT OWNS ===== */
    await page.evaluate(() => { roomGoTab(getContract('MK-A2'), 'terms'); });
    await page.waitForTimeout(900);
    const ov = await page.evaluate(() => {
      const cells = [...document.querySelectorAll('.sec-fields .sec-f')];
      const eff = cells.find(f => /effective/i.test((f.querySelector('.sec-f-l') || {}).textContent || ''));
      const note = eff && eff.querySelector('.sec-f-n');
      return { eff: !!eff, note: note ? note.textContent.trim() : '', hold: !!(note && note.classList.contains('is-hold')),
        door: note ? note.getAttribute('data-ov-fix') : '', title: note ? note.getAttribute('title') || '' : '' };
    });
    await page.screenshot({ path: path.join(OUT, '2-overview-mark.png') });
    check('2a the Overview\'s Effective cell says it is needed to sign', ov.eff && ov.hold && /needed to sign/i.test(ov.note), JSON.stringify(ov));
    check('2b and its hover names the boxes the signature waits on', /Start date/.test(ov.title), ov.title);
    await page.evaluate(() => { const b = document.querySelector('.sec-f-n.is-hold[data-ov-fix="effDate"]'); if (b) b.click(); });
    await page.waitForTimeout(1600);
    const landed = await page.evaluate(() => { const a = document.activeElement;
      return { key: a && a.getAttribute && a.getAttribute('data-kt'), type: a && a.type }; });
    check('2c the mark is a door: it lands the cursor in the Effective date box', landed.key === 'effDate', JSON.stringify(landed));
    await page.evaluate(() => {
      const el = document.querySelector('[data-kt="effDate"]');
      if (el) { el.value = '2026-10-01'; el.dispatchEvent(new Event('change', { bubbles: true })); }
    });
    await page.waitForTimeout(500);
    await page.evaluate(() => { roomGoTab(getContract('MK-A2'), 'sign'); });
    await page.waitForTimeout(800);
    r = await readRow(page);
    check('2d typing the start date on the Overview fills the paper\'s box — the row now names only what is left',
      r.row && /1 field in the wording is still empty: Material/.test(r.why), r.why);
    /* REOPENED FIRST. The Document tab keeps its canvas from the last full
       paint, so a term typed on the Overview reaches the paper on the next
       paint of the room, not on a tab switch — true at the parent too, and
       logged as its own finding rather than folded into this change. */
    await page.evaluate(() => { openWorkspace('MK-A2'); });
    await page.waitForTimeout(800);
    const dashesNow = await dashes();
    check('2e and the paper itself now carries the date where it drew a dash — one empty box left on it, not two',
      dashesBefore === 2 && dashesNow === 1, `${dashesBefore} → ${dashesNow}`);

    /* ===== 3. A DRAFT: THE SEND SCREEN ASKS, AND THE DOOR FILLS THE BOX ===== */
    const draft = await page.evaluate(async () => {
      const c = getContract('MK-A2');
      c.status = 'Draft'; c.fields = { value: String(c.value) };
      persist(c); await flushSaves();
      openWorkspace(c.id);
      await new Promise(r => setTimeout(r, 400));
      roomGoTab(c, 'sign');
      await new Promise(r => setTimeout(r, 700));
      return true;
    });
    r = await readRow(page);
    check('3a in Draft the row\'s door is the fill panel', draft && r.acts.length === 1 && r.acts[0] === 'Fill them in', JSON.stringify(r.acts));
    await page.evaluate(() => { const b = document.querySelector('#sign-check [data-sc-row="bl:blanks"] [data-sc-blanks]'); if (b) b.click(); });
    await page.waitForTimeout(1200);
    const focus = await page.evaluate(() => { const a = document.activeElement;
      return { inPanel: !!(a && a.closest && a.closest('#tplform-section')), key: a && a.getAttribute && (a.getAttribute('data-blankf') || a.getAttribute('data-field') || ''),
        tab: (document.querySelector('#ws-tabs .on, #ws-tabs [aria-selected="true"]') || {}).textContent || '' }; });
    check('3b pressing it lands on the Document tab with the cursor in the first empty box', focus.inPanel && focus.key === 'effDate', JSON.stringify(focus));
    await page.evaluate(() => openShareModal(getContract('MK-A2')));
    await page.waitForTimeout(1600);
    const send = await page.evaluate(() => {
      const p = document.getElementById('share-readiness');
      return { panel: p ? p.innerText.replace(/\s+/g, ' ') : '', tick: !!document.getElementById('sh-ack') };
    });
    await page.screenshot({ path: path.join(OUT, '3-send-screen.png') });
    check('3c the Send screen names the empty boxes as a reason it is not ready',
      /2 fields in the wording are still empty: Start date, Material/.test(send.panel), send.panel.slice(0, 200));
    check('3d and asks for the tick the Send screen already uses — sending anyway stays possible', send.tick);
    /* THE TICK IS WHAT STANDS IN THE WAY, measured both ways: pressed
       without it nothing goes, pressed with it the send goes through — so a
       refusal for any OTHER reason (a missing address, a dialog in a different
       shape) cannot pass this. */
    /* SENT AS A NEGOTIATION, which binds to no signer — a signing link asks
       which signer it is for, and that is the Send screen's own rule, not the
       one measured here. The block and its tick are the contract's, and ride
       on every purpose. */
    await page.evaluate(() => { const n = document.querySelector('[data-share-purpose="negotiate"]'); if (n) n.click(); });
    await page.waitForTimeout(400);
    await page.evaluate(() => { const e = document.getElementById('sh-email'); if (e) { e.value = 'ola@nandi.co.ke'; e.dispatchEvent(new Event('input', { bubbles: true })); } });
    const shares = () => page.evaluate(async () => { try { return ((await api('contracts/MK-A2/shares')).shares || []).length; } catch (_) { return -1; } });
    const sharesBefore = await shares();
    await page.evaluate(() => { const b = document.getElementById('share-send'); if (b) b.click(); });
    await page.waitForTimeout(1500);
    const sharesHeld = await shares();
    const ticked = await page.evaluate(() => { const t = document.getElementById('sh-ack'); if (!t) return false; if (!t.checked) t.click(); return t.checked; });
    await page.evaluate(() => { const b = document.getElementById('share-send'); if (b) b.click(); });
    await page.waitForTimeout(2500);
    const sharesSent = await shares();
    check('3e without the tick nothing is sent; with it, the send goes through',
      sharesHeld === sharesBefore && ticked && sharesSent === sharesBefore + 1,
      `${sharesBefore} → ${sharesHeld} unticked → ${sharesSent} ticked`);

    /* A CLEAN PAGE FOR THE NEXT SECTION, whatever the send left open. The
       session survives a reload. */
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);

    /* ===== 4. THE EFFECTIVE DATE A REAL UPLOAD READ ===== */
    const docxBytes = mkDocx([
      para('SOFTWARE AS A SERVICE AGREEMENT'),
      para('This Agreement is made between Nordkust Industri AB and Highland Corporate Ltd.'),
      para('1. Term. This Agreement is effective from 1 October 2026 and continues until 31 December 2027.'),
      para('2. Services. The Provider shall make the Services available to the Customer throughout the Term.'),
      para('3. Fees. The Customer shall pay the fees set out in the Order Form within thirty days of invoice.'),
      para('4. Governing law. This Agreement is governed by the laws of Denmark.'),
    ].join(''));
    const tmpDocx = path.join(OUT, 'saas.docx');
    fs.writeFileSync(tmpDocx, Buffer.from(docxBytes));
    /* NO COPILOT ON THIS STAGE. The test server reports a key and answers
       with a stand-in that reads nothing, so the upload would arrive with no
       dates at all. The pattern reader is the path every workspace without a
       key takes; what is measured is what the CONFIRM does with a date it was
       handed, which is the same whoever read it. */
    await page.evaluate(() => { state.aiConfigured = false; if (window.closeModal) closeModal(); openUploadModal(); });
    await page.waitForTimeout(400);
    await page.setInputFiles('#up-file', tmpDocx);
    let step2 = true;
    try {
      await page.waitForFunction(() => { const s2 = document.getElementById('up-step-2'); return s2 && !s2.classList.contains('hidden'); }, null, { timeout: 20000 });
    } catch (_) { step2 = false; }
    check('4 · stage: the upload dialog read the file', step2);
    const read = await page.evaluate(() => {
      const eff = document.querySelector('[data-umf="effectiveDate"]');
      return { eff: eff ? eff.value : '(not offered)', exp: (document.getElementById('up-expiry') || {}).value || '' };
    });
    /* [control] the dialog always showed the date; what was lost is what the
       confirm did with it (4b, 4c). */
    check('4a [control] the dialog shows the effective date it read, for the person to confirm', read.eff === '2026-10-01', JSON.stringify(read));
    const cpNow = await page.evaluate(() => document.getElementById('up-cp').value);
    if (!cpNow) await page.fill('#up-cp', 'Nordkust Industri AB');
    await page.evaluate(() => { const t = document.querySelector('#up-triage, [data-up-triage] input, input[name="up-triage"]'); if (t && t.checked) t.click(); });
    await page.click('#up-go');
    await page.waitForTimeout(1800);
    const filed = await page.evaluate(() => { const c = state.contracts[0];
      return { id: c.id, eff: (c.fields || {}).effDate || '', exp: c.expiry || '' }; });
    await page.evaluate(() => { roomGoTab(getContract(state.contracts[0].id), 'terms'); });
    await page.waitForTimeout(900);
    const effCell = await page.evaluate(() => {
      const f = [...document.querySelectorAll('.sec-fields .sec-f')].find(x => /effective/i.test((x.querySelector('.sec-f-l') || {}).textContent || ''));
      return f ? ((f.querySelector('.sec-f-v') || {}).textContent || '').trim() : '(no cell)';
    });
    await page.screenshot({ path: path.join(OUT, '4-upload-overview.png') });
    check('4b the date the person confirmed is on the record beside the expiry', filed.eff === '2026-10-01' && filed.exp === '2027-12-31', JSON.stringify(filed));
    check('4c and the Overview prints it rather than a dash', effCell && effCell !== '—' && /2026|Oct/.test(effCell), effCell);

    /* ===== 5. A COMPANY STANDARD WITH THE VALUE SKIPPED ===== */
    const madeTpl = await page.evaluate(async () => {
      try {
        const t = await api('templates', 'POST', { name: 'Supply standard', category: 'sales' });
        const id = t.template.id;
        const d = await api('templates/' + id);
        const vid = d.versions[0].id;
        await api(`templates/${id}/versions/${vid}`, 'PUT', { blocks: [
          { orderIndex: 0, blockType: 'heading', content: 'SUPPLY AGREEMENT' },
          { orderIndex: 1, blockType: 'fixed_text', content: 'Article 1. The Supplier shall supply the goods.' }], fields: [] });
        await api(`templates/${id}/versions/${vid}/publish`, 'POST', { changeNote: 'v1' });
        if (window.tplLibRefresh) await tplLibRefresh();
        return { ok: true, id };
      } catch (e) { return { ok: false, err: String(e && e.message) }; }
    });
    /* THE VERY PRESS: the company standard's own essentials form, and its own
       "Skip for now" button, pressed as a person would. */
    let made = { ok: false, err: 'the essentials form did not open' };
    if (madeTpl.ok) {
      await page.evaluate(id => { if (window.closeModal) closeModal(); tplLibNewContract(id); }, madeTpl.id);
      try {
        await page.waitForSelector('#ce-skip', { timeout: 8000 });
        const n0 = await page.evaluate(() => state.contracts.length);
        await page.click('#ce-skip');
        await page.waitForFunction(n => state.contracts.length > n, n0, { timeout: 8000 });
        await page.waitForTimeout(700);
        made = await page.evaluate(() => { const c = state.contracts[0];
          return { ok: true, id: c.id, vt: c.valueType === undefined ? '(absent)' : c.valueType, mon: isMonetary(c) }; });
      } catch (e) { made = { ok: false, err: String(e && e.message).slice(0, 200) }; }
    }
    check('5 · stage: a contract made from a company standard with "Skip for now"', made.ok, made.err);
    check('5a it is not stored as "no money passes"', made.vt === '(absent)' && made.mon === true, JSON.stringify(made));
    await page.evaluate(id => { openWorkspace(id); roomGoTab(getContract(id), 'terms'); }, made.id);
    await page.waitForTimeout(1200);
    const valueCell = await page.evaluate(() => {
      const f = [...document.querySelectorAll('.sec-fields .sec-f')].find(x => /value/i.test((x.querySelector('.sec-f-l') || {}).textContent || ''));
      return f ? ((f.querySelector('.sec-f-v') || {}).textContent || '').trim() : '(no cell)';
    });
    await page.screenshot({ path: path.join(OUT, '5-standard-overview.png') });
    check('5b the Overview\'s value reads as unanswered, not "Non-monetary"', valueCell === '—', valueCell);
    await page.evaluate(() => { const b = [...document.querySelectorAll('[data-ov-edit]')].find(x => /deal/.test(x.getAttribute('data-ov-edit') || '')); if (b) b.click(); });
    await page.waitForTimeout(900);
    const box = await page.evaluate(() => { const v = document.querySelector('[data-kt="value"]'); const n = document.querySelector('[data-kt="nonmonetary"]');
      return { box: !!v, disabled: v ? v.disabled : null, ticked: n ? n.checked : null }; });
    check('5c and in Edit these details the value box is open and "Non-monetary" is not ticked',
      box.box && box.disabled === false && box.ticked === false, JSON.stringify(box));

    check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the file ran to the end', false, String(e && e.stack || e).slice(0, 400));
  } finally {
    await browser.close();
    await h.stop();
  }
  const failed = results.filter(r => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed · shots in ${OUT}`);
  process.exit(failed ? 1 : 0);
})();
