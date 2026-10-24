/* ============================================================
   DETAILS HOLDS WHAT THE PAPER OWES; THE OVERVIEW EDITS AGAIN
   (owner, 13 Oct 2026)
   ============================================================
   "Image 1, the card highlighted should be the same height as the card on
   the right. Image 2, the page adjustment buttons on the paper pages need to
   go back to what it was prior to the last update. Image 3, this area is only
   supposed to be used to fill in the blanks needed on the paper, the rest
   should go back to the overview page. Overview page should be able to read
   the relevant details from the details page otherwise the empty fields will
   be filled in in the overview page like it was previously."

   1  New agreement: the choices' card ends level with the questions' card.
   2  The paper's zoom (− 100% +) wears the grey hairline, not the buttons'
      accent edge.
   3  Details: the contract's card asks only what the paper owes (who we are,
      the other party, the value, the start date); no other terms, no
      parties/people/filing fold.
   4  Overview: Edit these details and + Add a party are back; Edit opens the
      boxes for the end date and the other terms; an answer typed on Details
      is read on the Overview.

     node test/chromium/details-owes-overview-edits-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const TF = require('../../js/templateform.js');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'details-owes-overview-edits');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const form = { templateId: 'T9', templateName: 'Franchise', versionNumber: 1,
    fields: [{ fieldKey: 'f0', label: 'Franchisee Name', fieldType: 'text', required: true, section: 'Parties' }],
    values: {}, blocks: [{ blockType: 'heading', content: 'FRANCHISE AGREEMENT', orderIndex: 0 },
      { blockType: 'field_group', content: 'The franchisee is {{f0}}.', orderIndex: 1 }] };
  const c = { id: 'MK-DO1', name: 'Restaurant Franchise Agreement', counterparty: '', party: '', folder: 'proc', status: 'Draft',
    value: 0, template: null, format: 'rich', templateForm: form, redlineText: TF.templateFormDocHtml(form), fields: {},
    comments: [], rounds: [], versions: [], signatures: [], metadata: {}, compliance: { consent: false }, audit: [] };
  await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
    while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await pause(120); }
    return v; };
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => !!(window.getContract && getContract('MK-DO1')), null, 20000);

    /* ===== 1. NEW AGREEMENT: THE TWO CARDS END LEVEL ===== */
    await page.evaluate(() => { setView('register'); openNewAgreement({ pick: { kind: 'tid', id: 'RM' } }); });
    await until(() => !!document.getElementById('wz-counterparty'));
    await pause(300);
    /* RETIRED 24 Oct 2026 (one door, the Legora way): there are no two cards side by side to end level —
       a picked paper puts the list away and its questions take the sheet. What stands: the list is put away. */
    const lv = await page.evaluate(() => { const r = document.getElementById('na-root'), l = document.getElementById('na-lists'), k = document.getElementById('na-card');
      return { picked: !!(r && r.classList.contains('is-picked')), listShown: !!(l && l.getClientRects().length), card: !!(k && k.getClientRects().length) }; });
    await page.screenshot({ path: path.join(OUT, '01-new-agreement.png') });
    check('1 a picked paper puts the list away and its questions take the sheet', !!lv && lv.picked && !lv.listShown && lv.card, JSON.stringify(lv));
    await page.evaluate(() => closeModal());

    /* ===== 3. DETAILS: ONLY WHAT THE PAPER OWES ===== */
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
       Details tab went home — the same door opens Jambo's Fill in face beside
       Home's paper; its root .pd-ff[data-pd-ff="MK-DO1"] is the old
       [data-doc-col="details"] column, its #pd-fill the old #tplform-section.
       Waited for by THIS contract's id: the last contract's face can still be
       up for a beat. */
    /* RE-POINTED 20 Oct 2026 (the Legora way): Details is Still owed's grid on the Dossier — only what is owed is asked */
    await page.evaluate(() => { openWorkspace('MK-DO1', { room: true }); roomGoTab(getContract('MK-DO1'), 'details'); });
    await until(() => !!document.querySelector('#pd-og[data-pd-og-for="MK-DO1"] tr[data-pd-og-kind="kt"]'));
    const det = await page.evaluate(() => { const og = document.querySelector('#pd-og[data-pd-og-for="MK-DO1"]');
      return { keys: [...og.querySelectorAll('tr.pd-og-row:not(.is-saved)[data-pd-og-kind="kt"]')].map(e => e.getAttribute('data-pd-og-row')),
        owed: detailsOf(getContract('MK-DO1')).items.filter(x => x.kind === 'kt' && x.open).map(x => x.key),
        fold: !!og.querySelector('details'), parties: !!og.querySelector('#ov-parties'), law: !!og.querySelector('[data-ktm]'), q: !!og.querySelector('[data-tplf]') }; });
    await page.screenshot({ path: path.join(OUT, '02-details.png') });
    check('3a Details asks only the contract\'s owed details — the other party, the value and the start date, never who we are',
      det.keys.length > 0 && JSON.stringify(det.keys) === JSON.stringify(det.owed) && det.keys.every(k => ['counterparty', 'value', 'effDate'].includes(k)), JSON.stringify(det));
    check('3b no other terms and no parties/people/filing in the grid; the paper\'s questions stay',
      !det.fold && !det.parties && !det.law && det.q, JSON.stringify(det));

    /* ===== 2. THE ZOOM'S EDGE ===== */
    const zc = await page.evaluate(() => { const z = document.querySelector('.paper-zc .rl-type-step');
      if (!z) return null; const p = document.createElement('i'); p.style.color = 'var(--btn-edge)'; document.body.appendChild(p);
      const grey = getComputedStyle(p).color; p.style.color = 'var(--accent-solid)'; const acc = getComputedStyle(p).color; p.remove();
      const e = getComputedStyle(z).borderTopColor; return { edge: e, grey, accent: acc }; });
    /* RE-POINTED 21 Oct 2026 (Chambers): the controls' grey hairline is --btn-edge,
       RESOLVED (Chambers' rule-strong, a shade firmer than the divider). */
    check('2 the paper\'s zoom wears the grey hairline again, not the accent edge', !!zc && zc.edge === zc.grey && zc.edge !== zc.accent, JSON.stringify(zc));

    /* an answer typed on Details is the Overview's to read */
    const cp = '#pd-og [data-kt="counterparty"]';
    await page.fill(cp, 'Nordic Bites AB'); await page.click('#pd-og [data-pd-og-ok="counterparty"]'); await pause(300);

    /* ===== 4. THE OVERVIEW EDITS AGAIN ===== */
    /* RE-POINTED 14 Oct 2026 (stage 5): Details is on Home now, so the
       Overview is reached by opening the room first, then its tab */
    /* RE-POINTED 15 Oct 2026 (step 8, the room retired): the Overview's sheet
       is the contract strip's Details page on Home's Board, opened by its one
       door (roomOverviewOpen) — and it reads what Details just saved */
    /* RE-POINTED 22 Oct 2026 (owner's yes: the Details page RETIRED on a computer): the Overview's sheet still stands in the room opened by name (openWorkspace(id,{room:true})) and is checked there */
    await page.evaluate(() => { openWorkspace('MK-DO1', { room: true }); roomOverviewOpen(getContract('MK-DO1')); });
    await until(() => state.view === 'workspace' && !!document.querySelector('#kt-ov-terms #ov-ess'));
    const ov = await page.evaluate(() => ({ edit: !!document.querySelector('#kt-ov-terms [data-ov-edit="all"]'),
      add: !!document.querySelector('#kt-ov-terms [data-py-add]'), door: !!document.querySelector('#kt-ov-terms [data-ov-go-details]'),
      reads: /Nordic Bites AB/.test((document.getElementById('ov-ess') || {}).textContent || '') }));
    check('4a the Overview has Edit these details and + Add a party again', ov.edit && ov.add && !ov.door, JSON.stringify(ov));
    check('4b the Overview reads the other party typed on Details', ov.reads, JSON.stringify(ov));
    /* RE-POINTED 20 Oct 2026 (the owner: "we should not be entering information in the board"): the
       Board's Edit opens the paper with its Key terms unfolded — the end date and the other terms, a Change on each line */
    await page.click('#kt-ov-terms [data-ov-edit="all"]'); await pause(600);
    /* RE-POINTED 22 Oct 2026 (the Details page RETIRED on a computer): the room opened by name keeps the
       sheet's own Edit — it opens the boxes for the end date and the other terms, as on 13 Oct */
    const ed = await until(() => { const e = document.getElementById('ov-ess'); if (!e) return null;
      const keys = [...e.querySelectorAll('[data-kt], [data-ktm]')].map(x => x.getAttribute('data-kt') || x.getAttribute('data-ktm'));
      return keys.length ? { keys, expiry: keys.includes('expiry') || keys.includes('expiryDate'), law: keys.includes('governingLaw') } : null; }, null, 6000);
    check('4c Edit opens the boxes for the end date and the other terms', !!ed && ed.expiry && ed.law, JSON.stringify(ed));

    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
