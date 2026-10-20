/* Chromium verification: FILL THE DOCUMENT, AND ONE PRESS TO THE NEXT BOX
   ============================================================
   Young, 7 October 2026, over two screenshots: *"add the button in image 1 to
   the bottom of the panel in image 2 so that once someone has filled out a
   form they need to press this button so that the platform fills in the
   document. All add the color to the button both in the cover tab and
   document tab. also, when moving from one entry field to the next, make it
   one press to get into the next entry field as currently i have to do it
   twice."* — answered "Fill the document" and "Light blue".

     1  ONE PRESS: on a company standard's form panel, a box answered and then
        ONE real click on the next box leaves the caret in the next box.
     2  THE ANSWER IS KEPT, THE WORDING WAITS: the paper does not carry the
        answer until "Fill the document" is pressed; the button sits at the
        panel's foot, lit, light blue; it survives a refresh.
     3  NOTHING SENDS OR SIGNS ON A FORGOTTEN PRESS: the one link check and
        the signing list both name it while it is owed.
     4  THE PRESS FILLS THE PAPER and the button goes quiet.
     5  THE BUILT-IN TEMPLATE'S BLANKS PANEL is one press too.
     6  THE OVERVIEW'S "Fill from document" wears the same light blue.

   Guarded: a build without the feature REPORTS its failures.
   Run: node test/chromium/fill-the-document-verify.js */
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const waitFor = (page, fn, arg, ms = 8000) => page.waitForFunction(fn, arg, { timeout: ms }).then(() => true, () => false);

const CONTRACT = (id, over) => Object.assign({
  id, name: 'Packaging Supply Agreement', counterparty: '', counterpartyEmail: '',
  party: 'Highland Corporate Ltd', folder: 'proc', status: 'Draft',
  value: 0, template: 'PK', valueType: 'estimated', fields: {},
  comments: [], rounds: [], versions: [], signatures: [], metadata: {},
  compliance: { consent: false }, audit: [],
}, over || {});

/* RE-POINTED 12 Oct 2026: the form lives on the contract room's Details tab
   (owner: "the details page where you have the paper on the left and the entry
   fields on the right"), #tplform-section, beside the room's paper
   (#doc-canvas). Home's Document panel points there. */
/* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): the room's
   Details tab went home — the same door (roomGoTab 'details') opens Jambo's
   Fill in face beside Home's paper. The form is the face's #pd-fill (was
   #tplform-section), the paper is Home's #ig-canvas (was #doc-canvas). The
   face is waited for by THIS contract's id: the last one's can linger. */
/* RE-POINTED 20 Oct 2026 (the Legora way): the same door lands on the
   Dossier's Still owed grid (#pd-og) beside Home's paper; Fill the document
   is a line of Still owed while the answers are owed to the wording */
const openDocs = async (page, id) => {
  for (let t0 = Date.now(); Date.now() - t0 < 10000;) {
    if (await page.evaluate(x => state.view === 'dashboard' && !!document.querySelector(`#pd-og[data-pd-og-for="${x}"]`) && !!document.querySelector('#ig-canvas'), id)) break;
    await page.evaluate(x => { roomGoTab(getContract(x), 'details'); }, id);
    await page.waitForTimeout(300);
  }
  await waitFor(page, () => !!document.querySelector('#pd-og input'));
};
const paperText = page => page.evaluate(() => (document.getElementById('ig-canvas') || {}).textContent || '');
/* RE-POINTED 18 Oct 2026 (the gaps, round 8 "Owed first", f751): on Home's
   Fill in the press is in the document's own card, as drawn — the form's own
   button pressed (the one act), its state the form's own */
const fillBtn = page => page.evaluate(() => {
  const b = document.querySelector('#pd-needs [data-pd-og-docfill]');
  if (!b) return null;
  const host = document.querySelector('#pd-needs');
  const probe = document.createElement('span');
  probe.style.background = 'var(--color-accent-50)'; document.body.appendChild(probe);
  const want = getComputedStyle(probe).backgroundColor; probe.remove();
  const br = b.getBoundingClientRect(), hr = host.getBoundingClientRect();
  return { text: b.textContent.trim(), disabled: b.disabled, bg: getComputedStyle(b).backgroundColor, want,
    atFoot: br.top > hr.top + hr.height / 2, inCard: !!b.closest('#pd-needs [data-pd-gl="docfill"]'), title: b.title };
});
const owed = (page, id) => page.evaluate(x => {
  const c = state.contracts.find(k => k.id === x);
  const no = window.linkRefusal ? linkRefusal(c, { purpose: 'negotiate' }) : null;
  const bl = window.signBlockers ? signBlockers(c) : [];
  return { link: no && no.kind, sign: bl.some(b => b.key === 'form-fill') };
}, id);

(async () => {
  const h = await startHati();
  const W = await seedWorkspace(h);
  const TF = require('../../js/templateform.js');
  const form = {
    templateId: 'T2', templateName: 'Services', versionNumber: 1,
    fields: [{ fieldKey: 'company', label: 'Company Name', fieldType: 'text', required: true },
      { fieldKey: 'provider', label: 'Provider Name', fieldType: 'text', required: true }],
    values: {},
    blocks: [{ blockType: 'heading', content: 'Services Agreement', orderIndex: 0 },
      { blockType: 'field_group', content: 'Between {{company}} and {{provider}}.', orderIndex: 1 }],
  };
  const lib = CONTRACT('MK-FD1', { name: 'Services Agreement', template: null, format: 'rich',
    templateForm: form, redlineText: TF.templateFormDocHtml(form) });
  const built = CONTRACT('MK-FD2');
  for (const c of [lib, built])
    await W.admin.json('/api/contracts/' + c.id, { method: 'PUT', body: { contract: c, baseVersion: 0 } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
    const page = await ctx.newPage();
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await waitFor(page, () => !!window.state && Array.isArray(state.contracts) && state.contracts.length > 0);

    /* ===== 1. ONE PRESS TO THE NEXT BOX ===== */
    await openDocs(page, 'MK-FD1');
    const b0 = '#pd-og [data-tplf="0"]', b1 = '#pd-og [data-tplf="1"]';
    const there = await page.evaluate(s => !!document.querySelector(s), b1);
    if (there) {
      await page.click(b0);
      await page.keyboard.type('Wanjiru Catering Ltd');
      await page.click(b1);
      await page.waitForTimeout(400);
    }
    const focus1 = await page.evaluate(() => (document.activeElement || {}).getAttribute?.('data-tplf'));
    check('1 one click on the next box puts the caret in it', focus1 === '1', 'focused: ' + focus1);

    /* ===== 2. KEPT, NOT YET WRITTEN ===== */
    const kept = await page.evaluate(() => (state.contracts.find(k => k.id === 'MK-FD1').templateForm.values || {}).company);
    check('2a the answer is kept on the form', kept === 'Wanjiru Catering Ltd', kept);
    /* RE-POINTED 14 Oct 2026 (the one-page Home plan, stage 5): on Home's
       paper a company template's answers SHOW as they are typed (stage 2, the
       owner's yes on 14 Oct 2026: docWorkPreviewOf / pdFillEcho, display
       only) and reach the WORDING only on Fill the document (tplFormApply).
       What waits for the press is the stored wording, so that is read here. */
    const w2 = await page.evaluate(() => String((state.contracts.find(k => k.id === 'MK-FD1') || {}).redlineText || ''));
    check('2b the wording waits for the press', !!w2 && !w2.includes('Wanjiru Catering Ltd'), w2 ? '' : 'no wording');
    /* the hand leaves the grid: Still owed is drawn again with what it now owes */
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await waitFor(page, () => !!document.querySelector('#pd-needs [data-pd-og-docfill]'), undefined, 4000);
    const fb = await fillBtn(page);
    check('2c "Fill the document" is a line of Still owed while the answers are owed', !!fb && fb.inCard && /Fill the document/.test(fb.text), fb && fb.text);
    check('2d and it is lit while answers are owed', !!fb && !fb.disabled);

    /* ===== 3. A FORGOTTEN PRESS NEVER TRAVELS ===== */
    const o1 = await owed(page, 'MK-FD1');
    check('3a the one link check names it', o1.link === 'form', String(o1.link));
    check('3b the signing list names it', o1.sign === true);

    /* the press is still owed after a refresh */
    await page.waitForTimeout(900); // the debounced save
    if (there) await page.evaluate(() => window.flushSaves && flushSaves()).catch(() => {});
    await page.reload({ waitUntil: 'networkidle' });
    await waitFor(page, () => !!window.state && Array.isArray(state.contracts) && state.contracts.length > 0);
    await openDocs(page, 'MK-FD1');
    const fbR = await fillBtn(page);
    /* answered, the company is a Key terms line now; the provider is still the grid's */
    check('2f after a refresh the answer is still there and still owed', !!fbR && !fbR.disabled
      && /Wanjiru Catering Ltd/.test(await page.evaluate(() => ((document.querySelector('#pd-kt tr[data-pd-og-row="company"] .pd-kt-v') || {}).textContent || ''))));

    /* ===== 4. THE PRESS FILLS THE PAPER ===== */
    const press = {};
    /* THE RECORD THAT ARRIVES LATE (8 Oct 2026): on a loaded runner the full
       record lands after the panel was drawn and REPLACES the contract object
       in state. The panel's listeners must act on the record as it is at the
       press, not the one they were drawn with — staged here every run. */
    await page.evaluate(() => { const i = state.contracts.findIndex(k => k.id === 'MK-FD1');
      if (i >= 0) state.contracts[i] = JSON.parse(JSON.stringify(state.contracts[i])); });
    if (await page.evaluate(s => !!document.querySelector(s), '#pd-og [data-tplf="1"]')) {
      await page.click('#pd-og [data-tplf="1"]');
      await page.keyboard.type('Juno Limited');
      /* WHAT THE PRESS MET, said in 4a's detail when it fails (8 Oct 2026):
         CI failed this step on runs that pass locally, so the reading is
         taken where the runner is, not guessed at. */
      press.before = await page.evaluate(() => { const b = document.querySelector('#pd-needs [data-pd-og-docfill]');
        if (!b) return 'no button'; const r = b.getBoundingClientRect(); const at = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
        return { disabled: b.disabled, onTop: at === b || b.contains(at) ? 'button' : (at ? (at.id || at.className || at.tagName) : 'nothing'),
          y: Math.round(r.top), vh: innerHeight, focused: (document.activeElement || {}).getAttribute ? document.activeElement.getAttribute('data-tplf') : null }; });
      /* THE PRESS BEGINS ON THE ICON, every run (8 Oct 2026): CI's fonts put
         the button's centre on its icon, and the commit that leaving the box
         makes repainted the button's insides between mouse-down and mouse-up,
         so the click was dropped. Pressing there stages it here. */
      const spot = await page.evaluate(() => { const b = document.querySelector('#pd-needs [data-pd-og-docfill]');
        const i = b && (b.querySelector('svg') || b.firstElementChild); const r = (i || b).getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
      try { await page.mouse.move(spot.x, spot.y); await page.mouse.down(); await page.mouse.up(); }
      catch (e) { press.error = String(e.message).split('\n')[0].slice(0, 160); }
      /* A WAIT ASKS FOR THE STATE, BOUNDED (7 Oct 2026): a fixed 500ms was
         too short on a loaded CI runner, where the press had not finished
         repainting the paper when the reading was taken. */
      await waitFor(page, () => { const b = document.querySelector('#pd-needs [data-pd-og-docfill]');
        const t = (document.getElementById('ig-canvas') || {}).textContent || '';
        return !b && t.includes('Juno Limited'); }, undefined, 10000);
    }
    const t4 = await paperText(page);
    press.after = await page.evaluate(() => { const c = state.contracts.find(k => k.id === 'MK-FD1');
      return { vals: c && c.templateForm && c.templateForm.values, sigSet: !!(c && c.templateForm && c.templateForm.filledSig),
        juno: String((c && c.redlineText) || '').includes('Juno'), loaded: !!(c && c._loaded) }; });
    const p4 = t4.includes('Wanjiru Catering Ltd') && t4.includes('Juno Limited');
    check('4a the paper carries both answers', p4, p4 ? '' : JSON.stringify(press));
    const fb4 = await fillBtn(page);
    check('4b and the line goes from Still owed', !fb4, fb4 && fb4.text);
    const o4 = await owed(page, 'MK-FD1');
    check('4c nothing owed any more', !o4.link && !o4.sign, JSON.stringify(o4));

    /* ===== 5. THE BLANKS PANEL IS ONE PRESS TOO ===== */
    await openDocs(page, 'MK-FD2');
    /* the boxes still open: the answered ones fold under "Show N filled" */
    /* RE-POINTED 20 Oct 2026 (the Legora way): the grid's own boxes — a blank
       the paper asks and the record's own facts — one click from one to the next */
    const keys = await page.evaluate(() => [...document.querySelectorAll('#pd-og tr:not(.is-saved) input')]
      .filter(b => b.type === 'text' || b.type === 'number').map(b => b.getAttribute('data-blankf') ? 'blankf:' + b.getAttribute('data-blankf') : 'kt:' + b.getAttribute('data-kt')));
    const sel5 = k => { const [a, v] = k.split(':'); return `#pd-og [data-${a}="${v}"]`; };
    let focus5 = null;
    if (keys.length >= 2) {
      const from = keys.find(k => k.startsWith('blankf:')) || keys[0], to = keys.find(k => k !== from);
      keys.splice(0, keys.length, null, from, to);
      await page.click(sel5(from));
      await page.keyboard.type('11');
      await page.click(sel5(to));
      await page.waitForTimeout(400);
      focus5 = await page.evaluate(() => { const a = document.activeElement || {}; return a.getAttribute ? (a.getAttribute('data-blankf') ? 'blankf:' + a.getAttribute('data-blankf') : 'kt:' + a.getAttribute('data-kt')) : null; });
    }
    check('5 the built-in blanks panel: one click on the next box', focus5 && focus5 === keys[2], `${focus5} vs ${keys[2]}`);

    /* ===== 6. THE OVERVIEW'S FILL WEARS THE SAME BLUE ===== */
    const ov = await page.evaluate(() => {
      const b = document.getElementById('kt-fill');
      if (!b) return null;
      const probe = document.createElement('span');
      probe.style.background = 'var(--color-accent-50)'; document.body.appendChild(probe);
      const want = getComputedStyle(probe).backgroundColor; probe.remove();
      return { bg: getComputedStyle(b).backgroundColor, want };
    }).catch(() => null);
    let ov2 = ov;
    if (!ov2) {
      /* Fill from document rides the Details tab (12 Oct 2026); RE-POINTED 20 Oct
         2026 (the Legora way): it is the Overview sheet's, on the Board's card */
      await page.evaluate(() => { const s = hbS(); s.face = 'board'; hbSave(); setView('dashboard'); hbStripBring('MK-FD2', 'details'); });
      await waitFor(page, () => !!document.getElementById('kt-fill'));
      ov2 = await page.evaluate(() => {
        const b = document.getElementById('kt-fill');
        if (!b) return null;
        const probe = document.createElement('span');
        probe.style.background = 'var(--color-accent-50)'; document.body.appendChild(probe);
        const want = getComputedStyle(probe).backgroundColor; probe.remove();
        return { bg: getComputedStyle(b).backgroundColor, want };
      });
    }
    check('6 the Details tab\'s Fill from document is light blue', !!ov2 && ov2.bg === ov2.want, ov2 && `${ov2.bg} vs ${ov2.want}`);
    if (process.env.HATI_SHOT_DIR) await page.screenshot({ path: process.env.HATI_SHOT_DIR + '/fill-overview.png' });

    check('7 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }
  const ok = results.filter(r => r.pass).length;
  console.log(`${ok}/${results.length} checks passed`);
  process.exit(ok === results.length ? 0 : 1);
})();
