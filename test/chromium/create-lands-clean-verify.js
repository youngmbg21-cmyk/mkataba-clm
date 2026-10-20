/* ============================================================
   CREATE LANDS CLEAN, AND AN OWED BOX IS AMBER (owner, 13 Oct 2026)
   ============================================================
   "when I click on draft agreement, it glitches and first pushes me to the
   contracts page then to image 2. Regarding image 1, where a field needs to be
   filled out and it is empty, it should be amber like the fields in image 2.
   Make this the case across the platform."

   1  New agreement, a company standard: the boxes the contract owes (the
      other party, the value, the start date) are amber while empty; who we
      are, their email and the end date are not; typing takes the amber off.
   2  A HaTi template's form: the same.
   3  Create draft on a company standard (the server mints it — slowed here so
      the gap is measurable): no frame between New agreement and Home's paper
      with Jambo's Dossier beside it shows anything else, and Fill in is NOT
      opened for the reader; the pressed button turns while it waits. (Until
      14 Oct 2026 the landing was the room's Details tab; then Fill in beside
      the paper; since 20 Oct 2026 the Dossier — owner: "it pushes me to fill
      without my asking".)
   4  Create draft on a HaTi template: the same, with no server between.
   5  The Fill in face, opened by the reader's own press on Still owed's
      Fill in ›: an owed date's face is amber like its neighbours.

     node test/chromium/create-lands-clean-verify.js
   ============================================================ */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(process.env.HATI_SHOT_DIR || path.join(__dirname, 'shots'), 'create-lands-clean');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const pause = ms => new Promise(r => setTimeout(r, ms));
let pass = 0, fail = 0;
const check = (name, ok, detail) => { ok ? pass++ : fail++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`); };
const waitFor = async (page, fn, ms = 8000) => { const end = Date.now() + ms;
  while (Date.now() < end) { if (await page.evaluate(fn).catch(() => false)) return true; await pause(100); } return false; };

/* What a box looks like to the reader: its own ground, or its date face's. */
const TONES = sels => {
  const probe = document.createElement('div'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
  const amber = getComputedStyle(probe).backgroundColor; probe.remove();
  const out = { amber };
  for (const [k, s] of Object.entries(sels)) {
    let el = document.querySelector(s);
    if (el && el.nextElementSibling && el.nextElementSibling.classList.contains('dp-face')) el = el.nextElementSibling;
    out[k] = el ? getComputedStyle(el).backgroundColor === amber : null;
  }
  return out;
};

/* Every animation frame from the press until Home's paper stands with the
   Dossier beside it: which screen stood in the window ('fill' = Fill in
   opened unasked). */
const WATCH = () => { window._frames = []; let n = 0;
  const tick = () => { const s = document.getElementById('na-root') ? 'na' : document.getElementById('pd-fillface') ? 'fill' : document.getElementById('pd-glance') ? 'cd' : ('other:' + state.view);
    window._frames.push(s); if (s !== 'cd' && n++ < 2000) requestAnimationFrame(tick); };
  requestAnimationFrame(tick); };

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  const W = await seedWorkspace(h, { approvalRules: [] });
  const tpl = await W.admin.json('/api/templates', { method: 'POST', body: { name: 'Restaurant Franchise Agreement', description: 'Franchising', category: 'sales', folder: '' } });
  const tid = tpl.template.id; const tdet = await W.admin.json('/api/templates/' + tid); const tv = tdet.versions[0].id;
  await W.admin.json(`/api/templates/${tid}/versions/${tv}`, { method: 'PUT', body: { blocks: [
    { orderIndex: 0, blockType: 'heading', content: 'Restaurant Franchise Agreement' },
    { orderIndex: 1, blockType: 'fixed_text', content: 'Made on {{signed_on}} between {{org_name}} and {{franchisee}}.' }],
    fields: [{ fieldKey: 'org_name', label: 'Our company', fieldType: 'short_text', defaultValue: '{{org.company_name}}' },
      { fieldKey: 'franchisee', label: 'Franchisee name', fieldType: 'short_text' },
      { fieldKey: 'signed_on', label: 'Signed on', fieldType: 'date' }] } });
  await W.admin.json(`/api/templates/${tid}/versions/${tv}/publish`, { method: 'POST', body: { changeNote: 'v1' } });

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' }); await pause(400);
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go'); await pause(2400);
    await page.evaluate(async () => { try { await tplLibRefresh(); } catch (_) {} setView('register'); }); await pause(700);

    /* ===== 1. A COMPANY STANDARD'S FORM ===== */
    await page.evaluate(id => openNewAgreement({ pick: { kind: 'lib', id } }), tid);
    const up = await waitFor(page, () => !!document.getElementById('ce-counterparty'));
    const SEL = { party: '#ce-party', cp: '#ce-counterparty', email: '#ce-cpemail', value: '#ce-value', start: '#ce-effDate', end: '#ce-expiry' };
    let t = up ? await page.evaluate(TONES, SEL) : {};
    await page.screenshot({ path: path.join(OUT, '01-company-form.png') });
    check('1a the other party, the value and the start date are amber while empty',
      t.cp === true && t.value === true && t.start === true, JSON.stringify(t));
    check('1b who we are, their email and the end date are not',
      t.party === false && t.email === false && t.end === false, JSON.stringify(t));
    await page.fill('#ce-counterparty', 'Nordic Bites AB'); await page.click('#na-q');
    t = await page.evaluate(TONES, SEL);
    check('1c typing an answer takes the amber off', t.cp === false && t.value === true, JSON.stringify(t));

    /* ===== 3. CREATE ON A COMPANY STANDARD: NO OTHER SCREEN BETWEEN ===== */
    await page.route('**/api/templates/*/contracts', async r => { await pause(700); await r.continue(); });
    await page.evaluate(WATCH);
    await page.click('#na-create');
    await pause(150);
    const busy = await page.evaluate(() => { const b = document.getElementById('na-create');
      return { up: !!document.getElementById('na-root'), disabled: !!(b && b.disabled), ring: !!(b && b.querySelector('.ob-spin')) }; });
    check('3a while the server makes it, the page stays and the pressed button turns',
      busy.up && busy.disabled && busy.ring, JSON.stringify(busy));
    const cd1 = await waitFor(page, () => !!document.getElementById('pd-glance') && !document.getElementById('na-root'), 10000);
    await pause(200);
    let frames = await page.evaluate(() => window._frames || []);
    const others1 = frames.filter(f => f !== 'na' && f !== 'cd');
    check('3b New agreement hands straight over to Home\'s paper, Jambo\'s Dossier beside it, Fill in not opened — no frame of another screen',
      cd1 && others1.length === 0 && frames.includes('na'), `${frames.length} frames · others ${JSON.stringify([...new Set(others1)])} · landed ${cd1}`);
    await page.screenshot({ path: path.join(OUT, '02-complete.png') });

    /* ===== 5. IN STILL OWED'S GRID, AN OWED DATE IS AMBER TOO ===== */
    await waitFor(page, () => !!document.querySelector('#pd-og .pd-og-row.is-amb .dp-face'), 5000);
    const cdt = await page.evaluate(() => {
      const probe = document.createElement('div'); probe.style.background = 'var(--st-amber-bg)'; document.body.appendChild(probe);
      const amber = getComputedStyle(probe).backgroundColor; probe.remove();
      const faces = [...document.querySelectorAll('#pd-og .pd-og-row.is-amb .dp-face')];
      return { n: faces.length, amber: faces.filter(f => getComputedStyle(f).backgroundColor === amber).length };
    });
    check('5a every owed date in the grid wears the amber its neighbours wear', cdt.n > 0 && cdt.amber === cdt.n, JSON.stringify(cdt));
    await page.unroute('**/api/templates/*/contracts');
    await page.evaluate(() => { const b = document.getElementById('cd-later'); if (b) b.click(); }); await pause(500);
    await page.evaluate(() => setView('register')); await pause(500);

    /* ===== 2. A HATI TEMPLATE'S FORM ===== */
    await page.evaluate(() => openNewAgreement({ pick: { kind: 'tid', id: 'RM' } }));
    const up2 = await waitFor(page, () => !!document.getElementById('wz-counterparty'));
    t = up2 ? await page.evaluate(TONES, { cp: '#wz-counterparty', email: '#wz-cpemail' }) : {};
    await page.screenshot({ path: path.join(OUT, '03-hati-form.png') });
    check('2a a HaTi template: the other party is amber while empty, their email is not',
      t.cp === true && t.email === false, JSON.stringify(t));

    /* ===== 4. CREATE ON A HATI TEMPLATE ===== */
    await page.fill('#wz-counterparty', 'Popup Test Ltd');
    await page.evaluate(WATCH);
    await page.click('#na-create');
    const cd2 = await waitFor(page, () => !!document.getElementById('pd-glance') && !document.getElementById('na-root'), 10000);
    await pause(200);
    frames = await page.evaluate(() => window._frames || []);
    const others2 = frames.filter(f => f !== 'na' && f !== 'cd');
    const left2 = await page.evaluate(() => { const c = getContract(intel.paper && intel.paper.id); return c ? detailsOf(c).left : -1; });
    check('4a a HaTi template hands straight over too', cd2 && others2.length === 0,
      `${frames.length} frames · others ${JSON.stringify([...new Set(others2)])} · landed ${cd2} · details left ${left2}`);

    check('9 no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) { fail++; console.log('FAIL  the run threw — ' + e.message); }
  await browser.close(); await h.stop();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
