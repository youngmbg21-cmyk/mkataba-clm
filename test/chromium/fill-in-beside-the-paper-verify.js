/* ============================================================
   FILL IN THE DETAILS, BESIDE THE PAPER — THE LEGORA WAY (owner picked "The
   Legora way" by name, 20 Oct 2026; it REVERSES 14 Oct's Fill in face: "Why
   should I have to go elsewhere to enter the details?")
   ============================================================
     1  an upload lands on Home's paper, Jambo's panel on its Dossier; Still
        owed's grid asks each fact on its own row; a door (pdFillOpen) puts
        the cursor in the first owed box; the room never drawn; owed boxes amber
     2  typing shows on the paper at once; Confirm stores it, the grid
        shortens and the next row takes the hand
     3  a press on a blank on the paper lands on its row
     4  a HaTi template draft from New agreement lands on the Dossier, no
        frame of another screen
     5  a company template: the answer shows on the paper while the stored
        wording waits; Still owed's Fill the document writes it
     6  the last row: nothing owed, the dossier offers the next step
     7  no face, so nothing to go back from; "fill in" lands on the grid
     8  the checklist, the Contracts filter, Negotiate's "Fill them in" and
        the room's old Details door land on the grid; the room offers no
        Details tab
     9  the owner's three screens: the grid's head and the box in sight,
        nothing sideways; the paper does not move when the grid is asked
    10  Svenska
     node test/chromium/fill-in-beside-the-paper-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'fill-in-beside-the-paper');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000, arg) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn, arg).catch(() => false)) return true; await pause(100); } return false; };
/* the owner's three screens (CLAUDE.md: two laptops and an iPad Pro 12.9") */
const SCREENS = [[1440, 780], [1536, 730], [1366, 950]];

const WORDING = ['<h1>SOFTWARE AS A SERVICE AGREEMENT</h1>',
  '<p>between</p><p><strong>Highland Corporate Ltd</strong> (hereinafter “Customer”)</p><p>and</p>',
  '<p>[Supplier name]<br>[Supplier address]<br>Company reg. no.: [reg. no.]<br>(hereinafter “Supplier”)</p>',
  '<h4>1. Scope</h4><p>1.1 The Agreement sets out the terms and conditions for the delivery of Services to Customer or any of its Affiliates.</p>',
  '<h4>39. Notices</h4><p>39.1 Any required notices pursuant to this Agreement shall be sent in writing to the applicable Party’s representative.</p>',
  '<p>39.3 Supplier’s representative. For the purpose of the Agreement, Supplier’s representative is: [Supplier representative]</p>'].join('');
const UPLOAD = (id, over) => Object.assign({ id, name: 'SaaS Agreement', counterparty: '', party: 'Highland Corporate Ltd',
  folder: 'proc', status: 'Under Review', source: 'upload', format: 'rich', value: 0, template: null, fields: {}, redlineText: WORDING,
  upload: { fileName: 'SaaS_agreement_standard.docx', fileHash: id, mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  comments: [], rounds: [], versions: [], signatures: [], metadata: {}, compliance: { consent: false }, audit: [] }, over || {});
/* which screen stood in the window, frame by frame, until the face is up */
const WATCH = () => { window._frames = []; let n = 0;
  const tick = () => { const s = document.getElementById('na-root') ? 'na' : document.getElementById('pd-fillface') ? 'face' : document.getElementById('pd-glance') ? 'dossier' : ('other:' + state.view);
    window._frames.push(s); if (s !== 'face' && s !== 'dossier' && n++ < 2000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); };
/* RE-POINTED 20 Oct 2026 (the Legora way): what the grid holds and where the hand is */
const FACE = () => {
  const f = document.getElementById('pd-og');
  const a = document.activeElement;
  return { up: !!f, view: state.view, face: window.hbFace ? hbFace() : null, paper: intel.paper && intel.paper.id,
    focus: a && (a.getAttribute('data-kt') || a.getAttribute('data-blankf') || (a.hasAttribute('data-tplf') ? 'tplf' : null)),
    inFace: !!(a && a.closest && a.closest('#pd-og, #pd-kt')), pill: ((document.querySelector('#pd-needs .pd-gl-h b') || {}).innerText || '').trim(),
    rows: f ? f.querySelectorAll('tr.pd-og-row:not(.is-saved)').length : 0 };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const me = (await W.admin.json('/api/bootstrap')).me;
  const put = c => W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });
  await put(UPLOAD('MK-F1'));
  await put(UPLOAD('MK-F2', { name: 'SaaS Agreement (the checklist)', owner: { id: me.id, name: me.name } }));
  const tpl = await W.admin.json('/api/templates', { method: 'POST', body: { name: 'Restaurant Franchise Agreement', description: 'Franchising', category: 'sales', folder: '' } });
  const tid = tpl.template.id; const tdet = await W.admin.json('/api/templates/' + tid); const tv = tdet.versions[0].id;
  await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: { blocks: [
    { orderIndex: 0, blockType: 'heading', content: 'Restaurant Franchise Agreement' },
    { orderIndex: 1, blockType: 'fixed_text', content: 'Made on {{signed_on}} between {{org_name}} and {{franchisee}}, whose restaurant is at {{site}}.' }],
    fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', defaultValue: '{{org.company_name}}' },
      { fieldKey: 'franchisee', label: 'Franchisee name', fieldType: 'short_text' },
      { fieldKey: 'site', label: 'Restaurant address', fieldType: 'short_text' },
      { fieldKey: 'signed_on', label: 'Signed on', fieldType: 'date' }] } });
  await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 780 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await waitFor(page, () => window.state && Array.isArray(state.contracts) && state.contracts.length >= 2, 15000);
    await page.keyboard.press('Escape').catch(() => {});
    /* the bar's language buttons are gone (Chambers, 20 Oct 2026): the language is set through langSet, the one writer */
    await page.evaluate(() => { if (typeof langId === 'function' && langId() !== 'en' && typeof langSet === 'function') langSet('en'); });
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} setView('register'); }); await pause(500);

    /* ===== 1. AN UPLOAD LANDS BESIDE THE PAPER ===== */
    await page.evaluate(() => { window._roomSeen = 0; const was = window.renderWorkspace;
      window.renderWorkspace = function(){ window._roomSeen++; return was.apply(this, arguments); }; });
    await page.evaluate(WATCH);
    await page.evaluate(() => { roomOpenOnTerms('MK-F1'); openWorkspace('MK-F1', { room: true }); });
    const dos1 = await waitFor(page, () => !!document.getElementById('pd-glance') && intel.paper && intel.paper.id === 'MK-F1', 10000);
    const up1 = await waitFor(page, () => !!document.querySelector('#pd-og[data-pd-og-for="MK-F1"] [data-blankf]'), 10000);
    let f = await page.evaluate(FACE);
    check('1a0 it lands on the Dossier, no face, Still owed\'s grid asking each fact on its row', dos1 && up1 && !(await page.evaluate(() => !!document.getElementById('pd-fillface'))), JSON.stringify(f));
    await page.evaluate(() => pdFillOpen('MK-F1'));
    await waitFor(page, () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#pd-og')), 3000);
    f = await page.evaluate(FACE);
    const frames1 = await page.evaluate(() => [...new Set(window._frames || [])]);
    const room1 = await page.evaluate(() => window._roomSeen);
    check('1a an upload lands on Home\'s paper; a door puts the hand in the grid', f.up && f.view === 'dashboard' && f.face === 'paper' && f.paper === 'MK-F1', JSON.stringify(f));
    check('1b the cursor is in the first owed box', f.focus === 'counterparty' && f.inFace, f.focus);
    check('1c the room is never drawn on the way', room1 === 0 && !frames1.some(x => /workspace/.test(x)), JSON.stringify(frames1) + ' room paints ' + room1);
    const tones = await page.evaluate(() => {
      const probe = document.createElement('div'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
      const amber = getComputedStyle(probe).backgroundColor; probe.remove();
      const bg = el => { if (!el) return null; const face = el.nextElementSibling && el.nextElementSibling.classList.contains('dp-face') ? el.nextElementSibling : el; return getComputedStyle(face).backgroundColor === amber; };
      return { value: bg(document.querySelector('#pd-og [data-kt="value"]')), party: bg(document.querySelector('#pd-og [data-kt="party"]')),
        blank: bg(document.querySelector('#pd-og [data-blankf="up_supplier_address"]')) };
    });
    check('1d owed empty boxes are amber; who we are is never owed, so not asked', tones.value === true && tones.blank === true && tones.party !== true, JSON.stringify(tones));
    await page.screenshot({ path: path.join(OUT, '1-upload-lands.png') });

    /* ===== 2. TYPING SHOWS ON THE PAPER; CONFIRM STORES IT ===== */
    const left0 = await page.evaluate(() => detailsOf(getContract('MK-F1')).left);
    const rows0 = (await page.evaluate(FACE)).rows;
    await page.click('#pd-og [data-blankf="up_supplier_address"]');
    await page.keyboard.type('Strandvejen 70, Hellerup', { delay: 10 });
    const echo = await page.evaluate(() => [...document.querySelectorAll('#ig-canvas span.up-blank[data-upblank="up_supplier_address"]')].map(x => x.textContent));
    check('2a the words show on the paper while typing', echo.length > 0 && echo.every(t => t === 'Strandvejen 70, Hellerup'), JSON.stringify(echo));
    await page.screenshot({ path: path.join(OUT, '2-typing.png') });
    await page.click('#pd-og [data-pd-og-ok="up_supplier_address"]');
    await waitFor(page, n => detailsOf(getContract('MK-F1')).left === n - 1, 3000, left0);
    await waitFor(page, () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#pd-og')), 2000);
    f = await page.evaluate(FACE);
    const left1 = await page.evaluate(() => detailsOf(getContract('MK-F1')).left);
    const saved = await page.evaluate(() => !!document.querySelector('#pd-og tr.is-saved[data-pd-og-row="up_supplier_address"]'));
    check('2b Confirm stores it: the row says saved, the grid shortens, the next row takes the hand', left1 === left0 - 1 && saved && f.rows === rows0 - 1 && f.inFace, `${left0} → ${left1} · rows ${rows0} → ${f.rows} · saved ${saved} · focus ${f.focus}`);

    /* ===== 3. A PRESS ON A BLANK ON THE PAPER ===== */
    let sp = null;
    for (let k = 0; k < 4; k++) {
      sp = await page.$('#ig-canvas span.up-blank[data-upblank="up_supplier_representative"]');
      if (!sp) break;
      try { await sp.scrollIntoViewIfNeeded(); await sp.click(); break; } catch (e) { if (!/not attached/i.test(String(e && e.message))) throw e; sp = null; }
    }
    await waitFor(page, () => document.activeElement && document.activeElement.getAttribute('data-blankf') === 'up_supplier_representative', 3000);
    f = await page.evaluate(FACE);
    check('3 a press on a blank on the paper lands on its row', !!sp && f.focus === 'up_supplier_representative' && f.inFace, f.focus);

    /* ===== 4. A HATI TEMPLATE DRAFT LANDS THE SAME WAY ===== */
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(() => openNewAgreement({ pick: { kind: 'tid', id: 'RM' } }));
    await waitFor(page, () => !!document.getElementById('wz-counterparty'));
    await page.fill('#wz-counterparty', 'Kilima Foods Ltd');
    await page.evaluate(WATCH);
    await page.click('#na-create');
    const up4 = await waitFor(page, () => !!document.getElementById('pd-glance') && !document.getElementById('na-root'), 10000);
    await pause(300);
    const frames4 = await page.evaluate(() => [...new Set(window._frames || [])]);
    f = await page.evaluate(FACE);
    const cdUp = await page.evaluate(() => !!document.getElementById('cd-page'));
    check('4 a HaTi template draft lands on Home\'s paper on its Dossier, no frame of another screen',
      up4 && f.view === 'dashboard' && frames4.every(x => x === 'na' || x === 'dossier') && !cdUp, JSON.stringify(frames4) + ' ' + JSON.stringify(f));

    /* ===== 5. A COMPANY TEMPLATE: SHOWN AS TYPED, WRITTEN ON THE PRESS ===== */
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(id => openNewAgreement({ pick: { kind: 'lib', id } }), tid);
    await waitFor(page, () => !!document.getElementById('ce-counterparty'));
    await page.fill('#ce-counterparty', 'Nordic Bites AB');
    await page.click('#na-create');
    const up5 = await waitFor(page, () => !!document.querySelector('#pd-og [data-tplf]') && !document.getElementById('na-root'), 10000);
    const site = await page.evaluate(() => getContract(intel.paper.id).templateForm.fields.findIndex(x => x.fieldKey === 'site'));
    await page.click(`#pd-og [data-tplf="${site}"]`);
    await page.keyboard.type('Avenyn 12, Gothenburg', { delay: 10 });
    await page.click(`#pd-og [data-pd-og-ok="site"]`);
    await waitFor(page, () => /Avenyn 12/.test((document.getElementById('ig-canvas') || {}).textContent || ''), 3000);
    const pre = await page.evaluate(() => { const c = getContract(intel.paper.id); return { paper: /Avenyn 12/.test(document.getElementById('ig-canvas').textContent), stored: /Avenyn 12/.test(c.redlineText || ''), owed: tplFormPending(c) }; });
    check('5a the answer shows on the paper while the stored wording waits for the press', up5 && pre.paper && !pre.stored && pre.owed, JSON.stringify(pre));
    await page.screenshot({ path: path.join(OUT, '5-company-preview.png') });
    await waitFor(page, () => !!document.querySelector('#pd-needs [data-pd-og-docfill]'), 3000);
    await page.click('#pd-needs [data-pd-og-docfill]');
    await waitFor(page, () => { const c = getContract(intel.paper.id); return /Avenyn 12/.test(c.redlineText || ''); }, 3000);
    const post = await page.evaluate(() => { const c = getContract(intel.paper.id); return { stored: /Avenyn 12/.test(c.redlineText || ''), owed: tplFormPending(c), line: !!document.querySelector('#pd-needs [data-pd-og-docfill]') }; });
    check('5b Still owed\'s Fill the document writes it into the wording, and the line goes', post.stored && !post.owed && !post.line, JSON.stringify(post));

    /* ===== 6. THE LAST ROW: NOTHING OWED, AND THE NEXT STEP ===== */
    await page.evaluate(() => pdFillOpen('MK-F1'));
    await waitFor(page, () => intel.paper && intel.paper.id === 'MK-F1' && !!document.querySelector('#pd-og[data-pd-og-for="MK-F1"]'), 8000);
    for (let i = 0; i < 12; i++) {
      const next = await page.evaluate(() => { const r = [...document.querySelectorAll('#pd-og tr.pd-og-row:not(.is-saved)')].find(x => x.querySelector('[data-kt],[data-blankf]'));
        if (!r) return null; const b = r.querySelector('[data-kt]:not([type=checkbox]),[data-blankf]');
        return { key: r.getAttribute('data-pd-og-row'), sel: b.getAttribute('data-kt') ? '[data-kt="' + b.getAttribute('data-kt') + '"]' : '[data-blankf="' + b.getAttribute('data-blankf') + '"]', type: b.type }; });
      if (!next) break;
      const sel = '#pd-og ' + next.sel;
      if (next.type === 'date') await page.$eval(sel, el => { el.value = '2026-11-01'; el.dispatchEvent(new Event('change', { bubbles: true })); });
      else { await page.click(sel); await page.keyboard.type(/value/.test(next.sel) ? '180000' : /counterparty/.test(next.sel) ? 'Parcelway ApS' : 'Answered', { delay: 5 }); }
      await page.click(`#pd-og [data-pd-og-ok="${next.key}"]`).catch(() => {});
      await pause(300);
    }
    await waitFor(page, () => !detailsOf(getContract('MK-F1')).left, 4000);
    const done = await page.evaluate(() => ({ left: detailsOf(getContract('MK-F1')).left,
      owedRows: document.querySelectorAll('#pd-og tr.pd-og-row:not(.is-saved)[data-pd-og-kind="kt"], #pd-og tr.pd-og-row:not(.is-saved)[data-pd-og-kind="blank"]').length,
      saved: document.querySelectorAll('#pd-og tr.is-saved').length,
      next: [...document.querySelectorAll('#ig-dock .ds-nx button, #ig-dock .pd-nx button')].map(b => b.textContent.trim()).filter(Boolean) }));
    check('6 the last row: nothing owed, the answers said saved, the dossier offers the next step',
      done.left === 0 && done.owedRows === 0 && done.saved > 0 && done.next.length > 0, JSON.stringify(done));
    await page.screenshot({ path: path.join(OUT, '6-all-in.png') });

    /* ===== 7. NO FACE, AND THE WORD ===== */
    const backs = await page.evaluate(() => !!document.querySelector('#ig-dock [data-pd-back="fill"]'));
    check('7a no face, so nothing to go back from; the box stays', !backs && await page.evaluate(() => !!document.getElementById('igd-input')));
    await page.evaluate(() => pdOpenOnHome('MK-F2', 'copilot')); await pause(400);
    await page.evaluate(() => intelAsk('fill in'));
    check('7b "fill in" lands on the grid', await waitFor(page, () => !!document.querySelector('#pd-og') && pdTab() === 'copilot' && !document.getElementById('pd-fillface'), 4000));

    /* ===== 8. THE OTHER DOORS; THE ROOM'S TAB STANDS ===== */
    const onGrid = id => waitFor(page, x => !!document.querySelector(`#pd-og[data-pd-og-for="${x}"]`) && intel.paper && intel.paper.id === x, 6000, id);
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(() => needsYouGo('details', 'MK-F2'));
    check('8a the checklist lands on the grid on its contract', await onGrid('MK-F2'));
    await page.evaluate(() => { setView('register'); regSetScope && regSetScope('contracts'); state.reg = Object.assign(state.reg || {}, { view: 'details' }); });
    await pause(300);
    await page.evaluate(() => { try { regState().view = 'details'; } catch (_) {} regOpenContract('MK-F2'); });
    check('8b the Contracts filter "Details to fill" lands on the grid', await onGrid('MK-F2'));
    await page.evaluate(() => { try { regState().view = 'all'; } catch (_) {} setView('register'); }); await pause(300);
    await page.evaluate(() => negoBlanksFill(getContract('MK-F2')));
    check('8c Negotiate\'s "Fill them in" lands on the grid', await onGrid('MK-F2'));
    await page.evaluate(() => { openWorkspace('MK-F2', { room: true }); });
    await waitFor(page, () => state.view === 'workspace' && !!document.querySelector('.room-tabrow'), 6000);
    const roomTabs = await page.evaluate(() => [...document.querySelectorAll('.room-tabrow [data-ws-tab]')].map(b => b.getAttribute('data-ws-tab')));
    await page.evaluate(() => { roomGoTab(getContract('MK-F2'), 'details'); });
    const room = await waitFor(page, () => state.view === 'dashboard' && !!document.querySelector('#pd-og[data-pd-og-for="MK-F2"] [data-kt]')
      && !!document.querySelector('#pd-og [data-blankf]') && !document.getElementById('tplform-section'), 6000);
    check('8d the room\'s Details door lands on the grid, and the room offers no Details tab', room && !roomTabs.includes('details'), JSON.stringify(roomTabs));

    /* ===== 9. THE OWNER'S THREE SCREENS ===== */
    for (const [w, hgt] of SCREENS) {
      await page.setViewportSize({ width: w, height: hgt });
      await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-F2', 'doc'); }); await pause(400);
      const before = await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); const cv = document.getElementById('ig-canvas');
        return sc && cv ? { w: Math.round(sc.clientWidth), top: Math.round(cv.getBoundingClientRect().top) } : null; });
      await page.evaluate(() => pdFillOpen('MK-F2'));
      await waitFor(page, () => !!document.querySelector('#pd-og [data-kt]'), 5000);
      await pause(400);
      const m = await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); const cv = document.getElementById('ig-canvas'); const og = document.getElementById('pd-og');
        const head = document.querySelector('#pd-needs .pd-gl-h'); const box = document.getElementById('igd-input'); const dock = document.getElementById('ig-dock');
        const a = document.activeElement;
        const r = el => el ? el.getBoundingClientRect() : null; const hr = r(head), br = r(box), dr = r(dock), ar = r(a && a.closest && a.closest('#pd-og') ? a : null);
        return { w: sc ? Math.round(sc.clientWidth) : null, top: cv ? Math.round(cv.getBoundingClientRect().top) : null,
          handIn: !!(ar && ar.top >= dr.top && ar.bottom <= innerHeight), boxIn: !!(br && br.bottom <= innerHeight + 1 && br.top > 0),
          sideways: og ? og.scrollWidth - og.clientWidth : null, headSeen: !!hr }; });
      check(`9 ${w}×${hgt}: the row in the hand and the ask box in sight, nothing sideways`, m.handIn && m.boxIn && m.sideways <= 1 && m.headSeen, JSON.stringify(m));
      check(`9 ${w}×${hgt}: the paper keeps its width and its place when the grid is asked`, !!before && before.w === m.w && Math.abs(m.top - before.top) <= 40, JSON.stringify(before) + ' → ' + JSON.stringify({ w: m.w, top: m.top }));
      await page.screenshot({ path: path.join(OUT, `9-${w}x${hgt}.png`) });
    }

    /* ===== 10. SVENSKA =====
       RE-POINTED 20 Oct 2026 (Chambers): the bar's .lang-btn is gone; the language is changed in
       Settings › You, whose buttons call langSet — the one writer — so the switch is made through it */
    const sv = await page.evaluate(() => { if (typeof langSet !== 'function') return false; langSet('sv'); return typeof langId === 'function' && langId() === 'sv'; });
    await page.evaluate(() => { setView('dashboard'); pdFillOpen('MK-F2'); });
    await waitFor(page, () => !!document.querySelector('#pd-og th'), 5000);
    const title = await page.evaluate(() => (document.querySelector('#pd-og th') || {}).textContent || '');
    check('10 Svenska: the grid speaks the reader\'s language', !!sv && title === 'Uppgift · där Jambo läste den', title);
    await page.screenshot({ path: path.join(OUT, '10-svenska.png') });
    await page.evaluate(() => { if (typeof langSet === 'function') langSet('en'); });

    check('11 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + (e && e.stack || e)); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
