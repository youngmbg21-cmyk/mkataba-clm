/* Chromium verification: AN AMENDMENT'S BLANKS AND CLAUSES ON THE DOCUMENT TAB
   ============================================================
   Young, 8 Oct 2026, off MK-449 (Amendment No. 1 to a Mutual NDA): "when you
   are creating amendments … there is a field on the right panel that appears
   for you to fill in. That needs to happen for amendment process as well" and
   "this amendment was found to have 4 risks but they are not appearing on the
   side panel". Plus the Signing tab's long "Hand it over instead" sentence,
   which ran off both edges of a narrow panel.

   1  the fill panel draws on a new amendment with its ruled lines as boxes
   2  the date box is a date box, labelled with the paper's own words
   3  filling it writes the date INTO the wording, and the paper shows it
   4  the side panel's clause list reads the amendment's paragraphs
   5  a risk quoting an item's wording lands on that item in the side panel
   6  once a change is filed the panel stands down (Negotiate owns it)
   7  a standards check on an amendment says "missing" nowhere
   8  the "Hand it over" sentence wraps inside a narrow panel

   Run: node test/chromium/amendment-blanks-and-clauses-verify.js */
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
const waitFor = async (page, fn, arg, ms = 8000) => {
  const end = Date.now() + ms;
  for (;;) {
    let v = null; try { v = await page.evaluate(fn, arg); } catch (_) { v = null; }
    if (v) return v;
    if (Date.now() > end) return v;
    await page.waitForTimeout(120);
  }
};

(async () => {
  const h = await startHati();
  await seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);
    await waitFor(page, () => !!(window.state && state.contracts && state.contracts.length));

    /* A signed parent, and an amendment written with one change item. */
    const aid = await page.evaluate(() => {
      const parent = state.contracts.find(x => x.status === 'Signed' && !x.parentId) || state.contracts[0];
      const r = createAmendment(parent, { relation: 'amendment', items: [
        { clauseLabel: '4. Term', clauseNumber: '4', op: 'replace', signed: 'two years', amended: 'The term is extended to five years from the Effective Date.' }] });
      return r.contract ? r.contract.id : null;
    });
    check('0  an amendment was made', !!aid, aid);
    await page.evaluate(id => { openWorkspace(id); roomGoTab(getContract(id), 'docs'); }, aid);
    await waitFor(page, () => !!document.querySelector('#doc-canvas'));
    await page.waitForTimeout(800);

    const p1 = await waitFor(page, () => {
      const host = document.getElementById('tplform-section');
      const boxes = host ? Array.from(host.querySelectorAll('[data-blankf]')) : [];
      return boxes.length ? { n: boxes.length, keys: boxes.map(b => b.getAttribute('data-blankf')),
        types: boxes.map(b => b.type), labels: Array.from(host.querySelectorAll('label > span:first-child')).map(s => s.textContent.trim()) } : null;
    });
    check('1  the fill panel draws with the ruled lines as boxes', p1 && p1.n >= 1, JSON.stringify(p1));
    check('2  the date box is a date box named by the paper ("Made on")',
      p1 && p1.types[0] === 'date' && /^Made on$/.test(p1.labels[0] || ''), p1 && (p1.types[0] + ' / ' + p1.labels[0]));
    const marked = await page.evaluate(() => document.querySelectorAll('#doc-canvas span.hati-field[data-field-key^="own_"]').length);
    check('2b the paper marks the same blanks', p1 && marked === p1.n, `${marked} marked`);

    /* Fill the date through the panel's own box. */
    await page.evaluate(() => {
      const box = document.querySelector('#tplform-section [data-blankf="own_1"]');
      if (!box) return;
      box.value = '2026-10-08'; box.dispatchEvent(new Event('change', { bubbles: true }));
    });
    const p3 = await page.evaluate(id => {
      const c = getContract(id);
      const paper = document.querySelector('#doc-canvas span[data-field-key="own_1"]');
      return { stored: /made on <span class="hati-field-done" data-field-key="own_1">8 October 2026<\/span>/.test(c.redlineText),
        paper: paper ? paper.textContent : null, cls: paper ? paper.className : null,
        box: (document.querySelector('#tplform-section [data-blankf="own_1"]') || {}).value };
    }, aid);
    check('3  the date is written INTO the wording and shown on the paper',
      p3.stored && p3.paper === '8 October 2026' && p3.cls === 'hati-field-done', JSON.stringify(p3));
    /* It survives a repaint of the sheet (the stored wording is the truth). */
    await page.evaluate(id => docRepaintSheet(getContract(id)), aid);
    const p3b = await page.evaluate(() => {
      const paper = document.querySelector('#doc-canvas span[data-field-key="own_1"]');
      const box = document.querySelector('#tplform-section [data-blankf="own_1"]');
      return { paper: paper ? paper.textContent : null, box: box ? box.value : null };
    });
    check('3b after a repaint the paper and the box still hold it', p3b.paper === '8 October 2026' && p3b.box === '2026-10-08', JSON.stringify(p3b));

    /* The clause list beside the paper. */
    await page.evaluate(id => { const c = getContract(id); if (window.docThreadDrawerSet) docThreadDrawerSet(c, true); }, aid);
    const p4 = await waitFor(page, id => {
      const rows = docXrayRows(getContract(id)).map(x => docXrayLabel(x));
      return rows.length ? rows : null;
    }, aid);
    check('4  the side panel reads the amendment\'s paragraphs as its parts',
      p4 && p4.length >= 4 && p4.some(l => /^1\.\s*Term/.test(l)), JSON.stringify(p4));

    /* A risk quoting the item's words lands on that item. */
    const p5 = await page.evaluate(id => {
      const c = getContract(id);
      c.brief = c.brief || {};
      const watch = [{ say: 'Five years is long for an NDA', quote: 'extended to five years from the Effective Date', grade: 'red' }];
      const rows = docXrayRows(c);
      const item = rows.find(x => x.cite === '1');
      const hit = item ? docXrayPlace(docXrayRowText(item.row), watch[0].quote) : false;
      return { item: !!item, hit: !!hit };
    }, aid);
    check('5  a quote from the item\'s wording places on the item', p5.item && p5.hit, JSON.stringify(p5));

    /* 7 — the standards rule. */
    const p7b = await page.evaluate(id => {
      const c = getContract(id);
      /* The rule-based check (no model on this stage), through the same
         stamp rule every stored check takes. */
      if (typeof pbInParentVerdicts !== 'function') return { absent: 'pbInParentVerdicts' };
      const r = pbInParentVerdicts(c, playbookReviewHeuristic(c, playbookText(c)));
      return r && r.verdicts ? { missing: r.verdicts.filter(v => v.status === 'missing').length,
        inParent: r.verdicts.filter(v => v.inParent).length, words: r.verdicts.filter(v => v.inParent).map(v => pbVerdictWords(v))[0] || '' } : r;
    }, aid);
    check('7  a standards check on an amendment says "missing" nowhere',
      p7b && p7b.missing === 0 && p7b.inParent > 0 && /agreement this amends/.test(p7b.words), JSON.stringify(p7b));

    /* 6 — once a change is filed the panel stands down. */
    const p6 = await page.evaluate(id => {
      const c = getContract(id);
      if (typeof ownBlanksLive !== 'function') return { absent: 'ownBlanksLive' };
      c.changes = [{ id: 'CHG-001', status: 'pending' }];
      const live = ownBlanksLive(c);
      c.changes = [];
      return { live };
    }, aid);
    check('6  with a change on the table the panel stands down', p6.live === false, JSON.stringify(p6));

    /* 8 — the long sentence wraps inside the Signing tab's panel, measured
       where the reader sees it: on a narrow window, on a contract still open
       for signing. */
    await page.setViewportSize({ width: 1100, height: 900 });
    await page.evaluate(() => { const c = state.contracts.find(x => x.status !== 'Signed' && !x.parentId);
      openWorkspace(c.id); roomGoTab(c, 'sign'); });
    const p8 = await waitFor(page, () => {
      const b = Array.from(document.querySelectorAll('#sign-paper')).find(x => x.getBoundingClientRect().width > 0);
      if (!b) return null;
      const r = b.getBoundingClientRect(), p = b.parentElement.getBoundingClientRect();
      const line = parseFloat(getComputedStyle(b).lineHeight) || 16;
      return { ws: getComputedStyle(b).whiteSpace, sw: b.scrollWidth, cw: b.clientWidth,
        inside: r.left >= p.left - 1 && r.right <= p.right + 1, lines: Math.round(r.height / line) };
    });
    check('8  "Hand it over instead" wraps inside the Signing panel',
      p8 && p8.ws === 'normal' && p8.sw <= p8.cw + 1 && p8.inside && p8.lines >= 2, JSON.stringify(p8));

    await page.screenshot({ path: process.env.SHOT || '/tmp/amend-blanks.png' });
    check('9  no page errors', errors.length === 0, errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the run finished', false, e && e.stack);
  } finally {
    await browser.close();
    await h.stop();
  }
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} passed`);
  process.exit(bad.length ? 1 : 0);
})();
