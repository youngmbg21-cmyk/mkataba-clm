/* Chromium verification: THREE THINGS A TEMPLATE COULD NOT SAY.
   ============================================================
   Young, 24 Sep 2026: "fix these", of three lines the one-door run wrote into
   BUGLOG.md as noticed and not fixed —
     1  a template could not be moved back to "no value stream";
     2  a category the company added in Settings could not be saved onto one;
     3  a template written from scratch printed its first section heading
        ("Parties") as the published contract's title.
   f377 pins the readings; this file PRESSES the doors a person presses — the
   builder's own chips, the details box, the Settings drawer, the one door's
   scratch start, the new-contract form — and reads the answer where the
   reader looks: the chip, the server's own record, the builder's paper, the
   preview beside the form and the contract's Document tab.

   Copilot is answered at the network edge (the outline), never stubbed in the
   page. Every driven half is GUARDED: a build without the fix REPORTS each
   claim as a failure rather than timing out on the first missing thing.

   Run: node test/chromium/template-says-what-it-is-verify.js
   HATI_SHOT_DIR=/some/dir puts the screenshots somewhere else. */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots', 'template-says-what-it-is');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

const OUTLINE = { title: 'Nordic Parcel Carrier Agreement', category: 'procurement', note: 'Three sections for a carrier agreement.', sections: [
  { heading: 'Parties', intent: 'Who the agreement is between.' },
  { heading: 'Services', intent: 'What the carrier collects and delivers.' },
  { heading: 'Payment terms', intent: 'When invoices are paid.' },
] };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(4000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.route('**/api/ai/outline', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(OUTLINE) }));
  await page.route('**/api/ai/blanks', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: [], answered: 0, asked: 0 }) }));

  const shot = n => page.screenshot({ path: path.join(OUT, n + '.png') });
  const waitFor = async (fn, arg, n = 25) => { for (let i = 0; i < n; i++) { if (await page.evaluate(fn, arg)) return true; await pause(300); } return false; };
  const head = () => page.evaluate(() => {
    const hd = document.getElementById('tb-head'); if (!hd) return null;
    const chip = k => { const b = hd.querySelector(`[data-tb-meta="${k}"]`); return b ? { empty: b.classList.contains('empty'), v: ((b.querySelector('.v') || {}).textContent || '').trim() } : null; };
    return { category: chip('category'), stream: chip('stream') };
  });
  const serverTemplate = tid => page.evaluate(async id => (await api('templates/' + id)).template, tid);
  const toasts = () => page.evaluate(() => [...document.querySelectorAll('#toast-root *, .toast, [role="status"]')].map(e => e.textContent.trim()).filter(Boolean).join(' | '));
  /* A template made the way the create route makes one, with two sections of
     wording in its draft — the stage, not the claim. */
  const makeTemplate = (body, blocks) => page.evaluate(async ({ body, blocks }) => {
    const r = await api('templates', 'POST', body);
    const det = await api('templates/' + r.template.id);
    const vid = det.versions.find(v => v.status === 'draft').id;
    if (blocks) await api(`templates/${r.template.id}/versions/${vid}`, 'PUT', { blocks: blocks.map((b, i) => ({ orderIndex: i, blockType: b[0], content: b[1] })), fields: [] });
    return { tid: r.template.id, vid };
  }, { body, blocks });
  const openBuilder = async ({ tid, vid }) => {
    await page.evaluate(({ tid, vid }) => { try { closeModal(); } catch (_) {} setView('templates'); openTemplateBuilder(tid, vid); }, { tid, vid });
    return waitFor(() => !!document.getElementById('tb-head') && !!document.getElementById('tb-paperslot'));
  };
  const WORDED = [['heading', 'Parties'], ['fixed_text', 'This agreement is between us and the Carrier.'],
    ['heading', 'Services'], ['fixed_text', 'The Carrier collects and delivers parcels.']];

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);

    /* ================= 1 · "NONE YET" TAKES IT OUT OF ITS STREAM ================= */
    try {
      const t1 = await makeTemplate({ name: 'Filing check agreement', category: 'other', folder: 'proc' }, WORDED);
      await openBuilder(t1);
      const before = await head();
      check('1a [control] the template opens filed under its stream, and the chip says so', before && before.stream && !before.stream.empty && /Procurement/.test(before.stream.v), before && before.stream);
      await page.click('[data-tb-meta="stream"]');
      await waitFor(() => !!document.getElementById('tpllib-m-stream'));
      await pause(200);
      await page.selectOption('#tpllib-m-stream', '');
      await shot('1-none-yet-chosen');
      await page.click('#tpllib-m-save');
      await waitFor(() => !document.getElementById('tpllib-m-stream'));
      await pause(600);
      const after = await head();
      check('1b after "None yet" and Save, the head\'s stream chip says the template is unfiled', after && after.stream && after.stream.empty, after && after.stream);
      const onServer = await serverTemplate(t1.tid);
      check('1c and the server\'s own record says no stream — the parent sent the old one back', onServer && onServer.folder === null, onServer && onServer.folder);
      await openBuilder(t1);
      const again = await head();
      check('1d opened again, it is still unfiled', again && again.stream && again.stream.empty, again && again.stream);
      await shot('1-unfiled');
    } catch (e) { check('1 · the stream journey ran', false, String(e && e.message).slice(0, 200)); }

    /* ================= 2 · A CATEGORY ADDED IN SETTINGS ================= */
    let t2 = null;
    try {
      /* The owner's own door: Settings, the filing panel, "Add a category". */
      await page.evaluate(() => openSettingsAt('platform', 'folders'));
      await waitFor(() => !!document.getElementById('st-cat-new'));
      await page.fill('#st-cat-new', 'Logistics');
      await page.click('#st-cat-add');
      await waitFor(() => (state.settings.templateCategories || []).some(x => x.name === 'Logistics'), null, 10);
      await pause(800);   /* the company's list is written by its own request */
      await page.keyboard.press('Escape');   /* the drawer closes the way a person closes it */
      await pause(400);
      const catId = await page.evaluate(() => { const c = (state.settings.templateCategories || []).find(x => x.name === 'Logistics'); return c ? c.id : null; });
      check('2a [control] the category is on the company\'s list', !!catId, catId);

      t2 = await makeTemplate({ name: 'Category check agreement', category: 'other', folder: 'proc' }, WORDED);
      await openBuilder(t2);
      await page.click('[data-tb-meta="category"]');
      await waitFor(() => !!document.getElementById('tpllib-m-cat'));
      await pause(200);
      await page.selectOption('#tpllib-m-cat', catId || 'tc_logistics');
      await page.click('#tpllib-m-save');
      await waitFor(() => !document.getElementById('tpllib-m-cat'), null, 10);
      await pause(600);
      const hd = await head();
      const onServer = await serverTemplate(t2.tid);
      check('2b Save files the template under it — the server\'s own record says so', onServer && onServer.category === catId, onServer && onServer.category);
      check('2c and the head\'s chip names it', hd && hd.category && hd.category.v === 'Logistics', hd && hd.category);
      check('2d the details box closed on Save — it was not refused', !(await page.evaluate(() => !!document.getElementById('tpllib-m-cat'))), await toasts());
      await shot('2-category-saved');

      /* And one made inside the box itself, saved at once. */
      await page.click('[data-tb-meta="category"]');
      await waitFor(() => !!document.getElementById('tpllib-m-cat'));
      await pause(200);
      await page.selectOption('#tpllib-m-cat', '__new__');
      await waitFor(() => !!document.getElementById('nf-name'));
      await page.fill('#nf-name', 'Cold chain');
      await page.click('#nf-save');
      await pause(150);
      await page.click('#tpllib-m-save');
      await waitFor(() => !document.getElementById('tpllib-m-cat'), null, 10);
      await pause(800);
      const made = await page.evaluate(() => { const c = (state.settings.templateCategories || []).find(x => x.name === 'Cold chain'); return c ? c.id : null; });
      const onServer2 = await serverTemplate(t2.tid);
      check('2e a category made inside the box and saved at once is filed too', !!made && onServer2 && onServer2.category === made, { made, filed: onServer2 && onServer2.category });
    } catch (e) { check('2 · the category journey ran', false, String(e && e.message).slice(0, 200)); }

    /* ================= 3 · THE TITLE IS THE TEMPLATE'S NAME ================= */
    try {
      /* The one door's scratch start, Copilot's outline answered at the edge. */
      await page.evaluate(() => { try { closeModal(); } catch (_) {} setView('templates'); });
      await pause(900);
      await page.click('#tpl-new');
      await pause(450);
      await page.click('[data-ns-start="scratch"]');
      await pause(400);
      await page.fill('#ns-say-box', 'A carrier agreement for parcel deliveries across the Nordics');
      await page.click('#ns-go');
      await waitFor(() => !!document.getElementById('tb-page') && !!document.querySelector('[data-tb-out-add]'));
      await page.click('[data-tb-out-add]');
      await waitFor(() => document.querySelectorAll('#tb-paperslot h3.tb-h').length >= 3);
      await pause(400);
      const paper = await page.evaluate(() => ({
        title: ((document.querySelector('#tb-paperslot .tb-title') || {}).textContent || '').trim(),
        heads: [...document.querySelectorAll('#tb-paperslot .tb-row-h h3.tb-h')].map(h => ((h.querySelector('.tb-n') || {}).textContent || '') + ' ' + ((h.querySelector('.tb-hed') || {}).textContent || '')).slice(0, 3),
      }));
      await shot('3-scratch-paper');
      check('3a [control] the builder\'s paper draws the template\'s name as the title', paper.title === 'Nordic Parcel Carrier Agreement', paper.title);
      check('3b and "Parties" is section 1 on the paper — the parent drew it bare and "Services" as 1', paper.heads[0] === '1. Parties' && paper.heads[1] === '2. Services', paper.heads);

      /* Publish a template written the same way, and draft a contract from it
         through the product's own form. */
      const t3 = await makeTemplate({ name: 'Nordic Parcel Carrier Agreement', category: 'procurement', folder: 'proc' }, WORDED);
      await page.evaluate(async ({ tid, vid }) => { await api(`templates/${tid}/versions/${vid}/publish`, 'POST', { changeNote: 'v1' }); await tplLibRefresh(); }, t3);
      await page.evaluate(() => { try { closeModal(); } catch (_) {} setView('templates'); });
      await pause(700);
      await page.evaluate(tid => tplLibNewContract(tid), t3.tid);
      await waitFor(() => !!document.getElementById('ce-skip'));
      /* THE TITLE IS READ WHERE THE PAPER DRAWS IT. The paper lifts a
         document's opening title into its own head (docPaperFrontHtml, the
         negotiate page's own clothes), so on screen it is .rl-paper-title —
         the stored wording's <h1>, drawn. */
      const titleOf = sel => { const p = document.querySelector(sel); if (!p) return null;
        const t = p.querySelector('.rl-paper-title, h1');
        return { title: t ? t.textContent.trim() : '', h2: [...p.querySelectorAll('h2')].map(x => x.textContent.trim()).slice(0, 2) }; };
      const previewed = await waitFor(() => { const p = document.getElementById('tf-preview'); return !!(p && p.querySelector('.rl-paper-title, h1')); }, null, 15);
      const pv = await page.evaluate(titleOf, '#tf-preview');
      await shot('3-preview-beside-the-form');
      check('3c the paper beside the new-contract form is titled by the name, and "Parties" is 1', previewed && pv && pv.title === 'Nordic Parcel Carrier Agreement' && /^1\.\s*Parties$/.test(pv.h2[0] || ''), pv);
      await page.click('#ce-skip');
      await waitFor(() => !!document.querySelector('[data-ws-tab="docs"]'), null, 20);
      await page.click('[data-ws-tab="docs"]');
      await waitFor(() => { const c = document.getElementById('doc-canvas'); return !!(c && c.querySelector('.rl-paper-title, h1')); }, null, 20);
      const docTab = await page.evaluate(titleOf, '#doc-canvas');
      const stored = await page.evaluate(() => String((state.contracts[0] || {}).redlineText || '').slice(0, 60));
      await shot('3-document-tab');
      check('3d the contract\'s Document tab prints the template\'s name as its title', docTab && docTab.title === 'Nordic Parcel Carrier Agreement', docTab);
      check('3d2 and the wording the contract stores opens with it — the parent stored <h1>Parties</h1>', /^<h1>Nordic Parcel Carrier Agreement<\/h1>/.test(stored), stored);
      check('3e and numbers "Parties" 1 and "Services" 2', docTab && /^1\.\s*Parties$/.test(docTab.h2[0] || '') && /^2\.\s*Services$/.test(docTab.h2[1] || ''), docTab && docTab.h2);
    } catch (e) { check('3 · the title journey ran', false, String(e && e.message).slice(0, 200)); }

    /* ================= 3 (a copied document keeps its own title) ================= */
    try {
      const t4 = await makeTemplate({ name: 'service_agreement_2024', category: 'other', folder: 'proc', origin: 'upload' },
        [['heading', 'SERVICE AGREEMENT'], ['fixed_text', 'This Agreement is made between the parties.'], ['heading', 'Definitions'], ['fixed_text', 'Words.']]);
      await openBuilder(t4);
      const p4 = await page.evaluate(() => ({
        name: !!document.querySelector('#tb-paperslot .tb-title'),
        first: (() => { const h = document.querySelector('#tb-paperslot .tb-row-h h3.tb-h'); return h ? { title: h.classList.contains('is-title'), no: ((h.querySelector('.tb-n') || {}).textContent || ''), text: h.textContent.trim(), align: getComputedStyle(h).justifyContent } : null; })(),
      }));
      await shot('3-copied-document-paper');
      check('3f a copied document\'s paper draws no library name above its own title — the parent drew "service_agreement_2024" there', !p4.name, p4);
      check('3g its own first heading is drawn AS the title: unnumbered, centred', p4.first && p4.first.title && !p4.first.no && p4.first.align === 'center', p4.first);
    } catch (e) { check('3 · the copied-document paper ran', false, String(e && e.message).slice(0, 200)); }

    check('no uncaught errors on the page', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('the run itself', false, String(e && e.stack).slice(0, 300));
  } finally {
    await browser.close();
    await h.stop();
    const n = results.filter(r => r.pass).length;
    console.log(`\n${n}/${results.length} checks passed`);
    process.exit(n === results.length ? 0 : 1);
  }
})();
