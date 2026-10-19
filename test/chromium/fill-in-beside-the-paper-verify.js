/* ============================================================
   FILL IN THE DETAILS, BESIDE THE PAPER — stage 2 of the one-page Home plan
   (the owner picked "Form" by name on 14 Oct 2026, with all three
   recommendations: drafts and uploads land here alike; every way into filling
   in from outside the room opens this face, the room's Details tab staying
   until stage 5 — gone since, its door opening this face too; a company
   template's answers show on the paper as typed and reach the wording on Fill
   the document)
   ============================================================
     1  an upload lands on Home's paper, Jambo's panel on Fill in, the cursor
        in the first owed box, the room never drawn; owed boxes are amber
     2  typing shows on the paper at once; leaving the box stores it and the
        count drops
     3  a press on a blank on the paper lands on its box
     4  a HaTi template draft from New agreement lands the same way, with no
        frame of another screen
     5  a company template: the answer shows on the paper while the stored
        wording waits; Fill the document writes it
     6  the last box: All in, and the next step offered
     7  × goes back to the conversation; "fill in" opens the face again
     8  the checklist, the Contracts filter and Negotiate's "Fill them in"
        open the face; since stage 5 so does the room's old Details door, and
        the room offers no Details tab
     9  the owner's three screens: the face fits, the box stays in sight, the
        paper does not move or shrink when the face opens
    10  Svenska
   AT THE PARENT every claim FAILS: there is no Fill in face there.
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
  const tick = () => { const s = document.getElementById('na-root') ? 'na' : document.getElementById('pd-fillface') ? 'face' : ('other:' + state.view);
    window._frames.push(s); if (s !== 'face' && n++ < 2000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); };
const FACE = () => {
  const f = document.getElementById('pd-fillface');
  const a = document.activeElement;
  return { up: !!f, view: state.view, face: window.hbFace ? hbFace() : null, paper: intel.paper && intel.paper.id,
    focus: a && (a.getAttribute('data-kt') || a.getAttribute('data-blankf') || (a.hasAttribute('data-tplf') ? 'tplf' : null)),
    inFace: !!(a && f && f.contains(a)), pill: f ? ((f.querySelector('[data-pd-ff-pill]') || {}).innerText || '').trim() : '' };
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
    const en = await page.$('.lang-btn[data-lang="en"]'); if (en) await en.click();
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} setView('register'); }); await pause(500);

    /* ===== 1. AN UPLOAD LANDS BESIDE THE PAPER ===== */
    await page.evaluate(() => { window._roomSeen = 0; const was = window.renderWorkspace;
      window.renderWorkspace = function(){ window._roomSeen++; return was.apply(this, arguments); }; });
    await page.evaluate(WATCH);
    await page.evaluate(() => { roomOpenOnTerms('MK-F1'); openWorkspace('MK-F1', { room: true }); });
    const up1 = await waitFor(page, () => !!document.getElementById('pd-fillface') && !!document.querySelector('#pd-fillface [data-blankf]'), 10000);
    await waitFor(page, () => !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('#pd-fillface')), 3000);
    let f = await page.evaluate(FACE);
    const frames1 = await page.evaluate(() => [...new Set(window._frames || [])]);
    const room1 = await page.evaluate(() => window._roomSeen);
    check('1a an upload lands on Home\'s paper with Jambo\'s panel on Fill in', up1 && f.view === 'dashboard' && f.face === 'paper' && f.paper === 'MK-F1', JSON.stringify(f));
    check('1b the cursor is in the first owed box', f.focus === 'counterparty' && f.inFace, f.focus);
    check('1c the room is never drawn on the way', room1 === 0 && !frames1.some(x => /workspace/.test(x)), JSON.stringify(frames1) + ' room paints ' + room1);
    const tones = await page.evaluate(() => {
      const probe = document.createElement('div'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
      const amber = getComputedStyle(probe).backgroundColor; probe.remove();
      const bg = el => { if (!el) return null; const face = el.nextElementSibling && el.nextElementSibling.classList.contains('dp-face') ? el.nextElementSibling : el; return getComputedStyle(face).backgroundColor === amber; };
      return { value: bg(document.querySelector('#pd-fillface [data-kt="value"]')), party: bg(document.querySelector('#pd-fillface [data-kt="party"]')),
        blank: bg(document.querySelector('#pd-fillface [data-blankf="up_supplier_address"]')) };
    });
    check('1d owed empty boxes are amber, who we are is not', tones.value === true && tones.blank === true && tones.party === false, JSON.stringify(tones));
    await page.screenshot({ path: path.join(OUT, '1-upload-lands.png') });

    /* ===== 2. TYPING SHOWS ON THE PAPER; LEAVING STORES IT ===== */
    const left0 = await page.evaluate(() => detailsOf(getContract('MK-F1')).left);
    await page.click('#pd-fillface [data-blankf="up_supplier_address"]');
    await page.keyboard.type('Strandvejen 70, Hellerup', { delay: 10 });
    const echo = await page.evaluate(() => [...document.querySelectorAll('#ig-canvas span.up-blank[data-upblank="up_supplier_address"]')].map(x => x.textContent));
    check('2a the words show on the paper while typing', echo.length > 0 && echo.every(t => t === 'Strandvejen 70, Hellerup'), JSON.stringify(echo));
    await page.screenshot({ path: path.join(OUT, '2-typing.png') });
    await page.keyboard.press('Tab');
    await waitFor(page, n => detailsOf(getContract('MK-F1')).left === n - 1, 3000, left0);
    f = await page.evaluate(FACE);
    const left1 = await page.evaluate(() => detailsOf(getContract('MK-F1')).left);
    check('2b leaving the box stores it, the count drops, the cursor moves on in the face', left1 === left0 - 1 && f.inFace && new RegExp('^' + left1 + ' ').test(f.pill), `${left0} → ${left1} · pill "${f.pill}" · focus ${f.focus}`);

    /* ===== 3. A PRESS ON A BLANK ON THE PAPER ===== */
    /* The paper may be painted again after the save in 2b (seen on GitHub's
       runner, 14 Oct 2026: "Element is not attached to the DOM"); find the
       blank again at the press, a bounded few times — a real press. */
    let sp = null;
    for (let k = 0; k < 4; k++) {
      sp = await page.$('#ig-canvas span.up-blank[data-upblank="up_supplier_representative"]');
      if (!sp) break;
      try { await sp.scrollIntoViewIfNeeded(); await sp.click(); break; } catch (e) { if (!/not attached/i.test(String(e && e.message))) throw e; sp = null; }
    }
    await waitFor(page, () => document.activeElement && document.activeElement.getAttribute('data-blankf') === 'up_supplier_representative', 3000);
    f = await page.evaluate(FACE);
    check('3 a press on a blank on the paper lands on its box', !!sp && f.focus === 'up_supplier_representative' && f.inFace, f.focus);

    /* ===== 4. A HATI TEMPLATE DRAFT LANDS THE SAME WAY ===== */
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(() => openNewAgreement({ pick: { kind: 'tid', id: 'RM' } }));
    await waitFor(page, () => !!document.getElementById('wz-counterparty'));
    await page.fill('#wz-counterparty', 'Kilima Foods Ltd');
    await page.evaluate(WATCH);
    await page.click('#na-create');
    const up4 = await waitFor(page, () => !!document.getElementById('pd-fillface'), 10000);
    await pause(300);
    const frames4 = await page.evaluate(() => [...new Set(window._frames || [])]);
    f = await page.evaluate(FACE);
    const cdUp = await page.evaluate(() => !!document.getElementById('cd-page'));
    check('4 a HaTi template draft lands on Home\'s paper on Fill in, no frame of another screen',
      up4 && f.view === 'dashboard' && frames4.every(x => x === 'na' || x === 'face') && !cdUp, JSON.stringify(frames4) + ' ' + JSON.stringify(f));

    /* ===== 5. A COMPANY TEMPLATE: SHOWN AS TYPED, WRITTEN ON THE PRESS ===== */
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(id => openNewAgreement({ pick: { kind: 'lib', id } }), tid);
    await waitFor(page, () => !!document.getElementById('ce-counterparty'));
    await page.fill('#ce-counterparty', 'Nordic Bites AB');
    await page.click('#na-create');
    const up5 = await waitFor(page, () => !!document.querySelector('#pd-fillface [data-tplf]'), 10000);
    const site = await page.evaluate(() => getContract(intel.paper.id).templateForm.fields.findIndex(x => x.fieldKey === 'site'));
    await page.click(`#pd-fillface [data-tplf="${site}"]`);
    await page.keyboard.type('Avenyn 12, Gothenburg', { delay: 10 });
    await page.keyboard.press('Tab');
    await waitFor(page, () => /Avenyn 12/.test((document.getElementById('ig-canvas') || {}).textContent || ''), 3000);
    const pre = await page.evaluate(() => { const c = getContract(intel.paper.id); return { paper: /Avenyn 12/.test(document.getElementById('ig-canvas').textContent), stored: /Avenyn 12/.test(c.redlineText || ''), owed: tplFormPending(c) }; });
    check('5a the answer shows on the paper while the stored wording waits for the press', up5 && pre.paper && !pre.stored && pre.owed, JSON.stringify(pre));
    await page.screenshot({ path: path.join(OUT, '5-company-preview.png') });
    /* RE-POINTED 18 Oct 2026 (the gaps, round 8, f751): the press is in the document's own card, as drawn */
    await page.click('#pd-fillface [data-pd-ff-docfill]');
    await waitFor(page, () => { const c = getContract(intel.paper.id); return /Avenyn 12/.test(c.redlineText || ''); }, 3000);
    const post = await page.evaluate(() => { const c = getContract(intel.paper.id); return { stored: /Avenyn 12/.test(c.redlineText || ''), owed: tplFormPending(c) }; });
    check('5b Fill the document writes it into the wording', post.stored && !post.owed, JSON.stringify(post));

    /* ===== 6. THE LAST BOX: ALL IN, AND THE NEXT STEP ===== */
    await page.evaluate(() => pdFillOpen('MK-F1'));
    await waitFor(page, () => intel.paper && intel.paper.id === 'MK-F1' && !!document.querySelector('#pd-fillface [data-blankf]'), 8000);
    const fillAll = async () => {
      for (let i = 0; i < 12; i++) {
        const next = await page.evaluate(() => { const b = [...document.querySelectorAll('#pd-fillface .cd-fld.is-open input:not([type="checkbox"]), #pd-fillface [data-blankf]')].find(x => !String(x.value || '').trim());
          return b ? (b.getAttribute('data-kt') ? '[data-kt="' + b.getAttribute('data-kt') + '"]' : '[data-blankf="' + b.getAttribute('data-blankf') + '"]') : null; });
        if (!next) return;
        const sel = '#pd-fillface ' + next;
        const type = await page.$eval(sel, el => el.type);
        if (type === 'date') await page.$eval(sel, el => { el.value = '2026-11-01'; el.dispatchEvent(new Event('change', { bubbles: true })); });
        else { await page.click(sel); await page.keyboard.type(/value/.test(next) ? '180000' : /counterparty/.test(next) ? 'Parcelway ApS' : 'Answered', { delay: 5 }); await page.keyboard.press('Tab'); }
        await pause(250);
      }
    };
    await fillAll();
    await waitFor(page, () => !detailsOf(getContract('MK-F1')).left, 4000);
    const done = await page.evaluate(() => { const f = document.getElementById('pd-fillface'); return { left: detailsOf(getContract('MK-F1')).left,
      line: !!(f && f.querySelector('.pd-ff-done')), next: f ? [...f.querySelectorAll('.pd-ff-next button')].map(b => b.textContent.trim()) : [] }; });
    check('6 the last box: All in, the face says so and offers the next step, naming the other side in full',
      done.left === 0 && done.line && done.next.some(t => t === 'Send to Parcelway ApS'), JSON.stringify(done));
    await page.screenshot({ path: path.join(OUT, '6-all-in.png') });

    /* ===== 7. ‹ JAMBO AND THE WORD ===== */
    /* RE-POINTED 18 Oct 2026 (the gaps of rounds 8–11 as drawn): the face's head
       draws no × — its way back is "‹ Jambo" at the end of the panel's own row */
    await page.click('#ig-dock [data-pd-back="fill"]');
    const closed = await page.evaluate(() => ({ face: !!document.getElementById('pd-fillface'), feed: !!(document.getElementById('igd-feed') && !document.getElementById('igd-feed').hidden), box: !!document.getElementById('igd-input') }));
    check('7a ‹ Jambo goes back to the conversation; the box stays', !closed.face && closed.feed && closed.box, JSON.stringify(closed));
    await page.evaluate(() => intelAsk('fill in'));
    check('7b "fill in" opens the face again', await waitFor(page, () => !!document.getElementById('pd-fillface'), 4000));

    /* ===== 8. THE OTHER DOORS; THE ROOM'S TAB STANDS ===== */
    await page.evaluate(() => setView('register')); await pause(400);
    await page.evaluate(() => needsYouGo('details', 'MK-F2'));
    check('8a the checklist opens the face on its contract', await waitFor(page, () => !!document.getElementById('pd-fillface') && intel.paper && intel.paper.id === 'MK-F2', 6000));
    await page.evaluate(() => { setView('register'); regSetScope && regSetScope('contracts'); state.reg = Object.assign(state.reg || {}, { view: 'details' }); });
    await pause(300);
    await page.evaluate(() => { try { regState().view = 'details'; } catch (_) {} regOpenContract('MK-F2'); });
    check('8b the Contracts filter "Details to fill" opens the face', await waitFor(page, () => !!document.getElementById('pd-fillface') && intel.paper && intel.paper.id === 'MK-F2', 6000));
    await page.evaluate(() => { try { regState().view = 'all'; } catch (_) {} setView('register'); }); await pause(300);
    await page.evaluate(() => negoBlanksFill(getContract('MK-F2')));
    check('8c Negotiate\'s "Fill them in" opens the face', await waitFor(page, () => !!document.getElementById('pd-fillface') && intel.paper && intel.paper.id === 'MK-F2', 6000));
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5; the owner's
       yes to decision 2): the room's Details tab went home — the door that
       named it, from inside the room, opens this face, the room never left
       drawn behind it, and the room's tab row no longer offers it. */
    await page.evaluate(() => { openWorkspace('MK-F2', { room: true }); });
    await waitFor(page, () => state.view === 'workspace' && !!document.querySelector('.room-tabrow'), 6000);
    const roomTabs = await page.evaluate(() => [...document.querySelectorAll('.room-tabrow [data-ws-tab]')].map(b => b.getAttribute('data-ws-tab')));
    await page.evaluate(() => { roomGoTab(getContract('MK-F2'), 'details'); });
    const room = await waitFor(page, () => state.view === 'dashboard' && !!document.querySelector('#pd-fillface .pd-ff[data-pd-ff="MK-F2"] #det-basics [data-kt]')
      && !!document.querySelector('#pd-fillface #pd-fill [data-blankf]') && !document.getElementById('tplform-section'), 6000);
    check('8d the room\'s Details door opens this face, and the room offers no Details tab', room && !roomTabs.includes('details'), JSON.stringify(roomTabs));

    /* ===== 9. THE OWNER'S THREE SCREENS ===== */
    for (const [w, hgt] of SCREENS) {
      await page.setViewportSize({ width: w, height: hgt });
      await page.evaluate(() => { setView('dashboard'); pdOpenOnHome('MK-F2', 'copilot'); }); await pause(300);
      await page.evaluate(() => pdFillClose()); await pause(300);
      const before = await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); const cv = document.getElementById('ig-canvas');
        return sc && cv ? { w: Math.round(sc.clientWidth), top: Math.round(cv.getBoundingClientRect().top) } : null; });
      await page.evaluate(() => pdFillOpen('MK-F2'));
      await waitFor(page, () => !!document.querySelector('#pd-fillface [data-kt]'), 5000);
      await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); const s = document.getElementById('pd-fillface'); if (s) s.scrollTop = 0; });
      await pause(250);
      const m = await page.evaluate(() => { const sc = document.getElementById('ig-paper-scroll'); const cv = document.getElementById('ig-canvas'); const ff = document.getElementById('pd-fillface');
        const head = ff && ff.querySelector('.pd-ff-h'); const box = document.getElementById('igd-input'); const dock = document.getElementById('ig-dock');
        const r = el => el ? el.getBoundingClientRect() : null; const hr = r(head), br = r(box), dr = r(dock);
        return { w: sc ? Math.round(sc.clientWidth) : null, top: cv ? Math.round(cv.getBoundingClientRect().top) : null,
          headIn: !!(hr && dr && hr.top >= dr.top - 1 && hr.bottom <= innerHeight), boxIn: !!(br && br.bottom <= innerHeight + 1 && br.top > 0),
          sideways: ff ? ff.scrollWidth - ff.clientWidth : null, firstBox: !!(ff && ff.querySelector('[data-kt]') && ff.querySelector('[data-kt]').getBoundingClientRect().top < innerHeight) }; });
      check(`9 ${w}×${hgt}: the head and the box in sight, nothing sideways, the first box on screen`, m.headIn && m.boxIn && m.sideways <= 1 && m.firstBox, JSON.stringify(m));
      /* RE-POINTED (the gaps' third pass, 18 Oct 2026; round 8 "Owed first" as drawn: the size stands
         on the paper's line while Fill in is open, nothing above the sheet): the paper keeps its width
         and moves only UP, by the zoom row's room — never down, never narrower */
      check(`9 ${w}×${hgt}: the paper keeps its width, and moves only up (the zoom row's room) when the face opens`, !!before && before.w === m.w && m.top <= before.top && before.top - m.top <= 40, JSON.stringify(before) + ' → ' + JSON.stringify({ w: m.w, top: m.top }));
      await page.screenshot({ path: path.join(OUT, `9-${w}x${hgt}.png`) });
    }

    /* ===== 10. SVENSKA ===== */
    const sv = await page.$('.lang-btn[data-lang="sv"]');
    if (sv) await sv.click();
    await page.evaluate(() => { setView('dashboard'); pdFillOpen('MK-F2'); });
    await waitFor(page, () => !!document.querySelector('#pd-fillface h3'), 5000);
    const title = await page.evaluate(() => (document.querySelector('#pd-fillface h3') || {}).textContent || '');
    check('10 Svenska: the face speaks the reader\'s language', !!sv && title === 'Fyll i uppgifterna', title);
    await page.screenshot({ path: path.join(OUT, '10-svenska.png') });
    const en2 = await page.$('.lang-btn[data-lang="en"]'); if (en2) await en2.click();

    check('11 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + (e && e.stack || e)); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
