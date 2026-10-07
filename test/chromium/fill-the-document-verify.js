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

const openDocs = async (page, id) => {
  await page.evaluate(x => { state.activeId = x; state.selId = x; setView('workspace'); }, id);
  await page.waitForTimeout(1400);
  await page.click('#ws-tabs [data-ws-tab="docs"]').catch(() => {});
  await waitFor(page, () => !!document.querySelector('#tplform-section input'));
};
const paperText = page => page.evaluate(() => (document.getElementById('doc-canvas') || {}).textContent || '');
const fillBtn = page => page.evaluate(() => {
  const b = document.querySelector('#tplform-section [data-tplf-fill]');
  if (!b) return null;
  const host = document.getElementById('tplform-section');
  const probe = document.createElement('span');
  probe.style.background = 'var(--color-accent-50)'; document.body.appendChild(probe);
  const want = getComputedStyle(probe).backgroundColor; probe.remove();
  const br = b.getBoundingClientRect(), hr = host.getBoundingClientRect();
  return { text: b.textContent.trim(), disabled: b.disabled, bg: getComputedStyle(b).backgroundColor, want,
    atFoot: br.top > hr.top + hr.height / 2, title: b.title };
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
    const b0 = '#tplform-section [data-tplf="0"]', b1 = '#tplform-section [data-tplf="1"]';
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
    check('2b the paper waits for the press', !(await paperText(page)).includes('Wanjiru Catering Ltd'));
    const fb = await fillBtn(page);
    check('2c "Fill the document" sits at the foot of the panel', !!fb && fb.atFoot && /Fill the document/.test(fb.text), fb && fb.text);
    check('2d and it is lit while answers are owed', !!fb && !fb.disabled);
    check('2e light blue: the accent wash', !!fb && fb.bg === fb.want, fb && `${fb.bg} vs ${fb.want}`);

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
    check('2f after a refresh the answer is still there and still owed', !!fbR && !fbR.disabled
      && (await page.evaluate(s => (document.querySelector(s) || {}).value, b0)) === 'Wanjiru Catering Ltd');

    /* ===== 4. THE PRESS FILLS THE PAPER ===== */
    if (await page.evaluate(s => !!document.querySelector(s), b1)) {
      await page.click(b1);
      await page.keyboard.type('Juno Limited');
      await page.click('#tplform-section [data-tplf-fill]').catch(() => {});
      await page.waitForTimeout(500);
    }
    const t4 = await paperText(page);
    check('4a the paper carries both answers', t4.includes('Wanjiru Catering Ltd') && t4.includes('Juno Limited'));
    const fb4 = await fillBtn(page);
    check('4b and the button goes quiet', !!fb4 && fb4.disabled && /Document filled/.test(fb4.text), fb4 && fb4.text);
    const o4 = await owed(page, 'MK-FD1');
    check('4c nothing owed any more', !o4.link && !o4.sign, JSON.stringify(o4));

    /* ===== 5. THE BLANKS PANEL IS ONE PRESS TOO ===== */
    await openDocs(page, 'MK-FD2');
    const keys = await page.evaluate(() => [...document.querySelectorAll('#tplform-section [data-blankf]')]
      .filter(b => b.type === 'text' || b.type === 'number' || b.tagName === 'INPUT').map(b => b.getAttribute('data-blankf')));
    let focus5 = null;
    if (keys.length >= 3) {
      await page.click(`#tplform-section [data-blankf="${keys[1]}"]`);
      await page.keyboard.type('11');
      await page.click(`#tplform-section [data-blankf="${keys[2]}"]`);
      await page.waitForTimeout(400);
      focus5 = await page.evaluate(() => (document.activeElement || {}).getAttribute?.('data-blankf'));
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
      await page.click('#ws-tabs [data-ws-tab="terms"]').catch(() => {});
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
    check('6 the Overview\'s Fill from document is light blue', !!ov2 && ov2.bg === ov2.want, ov2 && `${ov2.bg} vs ${ov2.want}`);
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
