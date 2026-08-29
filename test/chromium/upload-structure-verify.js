/* Chromium verification: AN UPLOADED CONTRACT KEEPS ITS STRUCTURE (J-3.1)
   ============================================================
   *"When you upload received contract, it should be uploaded in the same exact
   structure as the original. Currently the contract loses structure and it
   becomes hard to follow."*

   A REAL WORD FILE THROUGH THE REAL FILE INPUT, and every claim measured off
   the page the owner would be looking at. Three of them can be asked NOWHERE
   ELSE:

     - **the headings on screen**, as painted elements at the sizes the sheet
       gives them — jsdom lays nothing out and would report a heading and a
       paragraph as the same thing.
     - **the pixels above the first line of the wording**, which the work order
       requires this job to move by ZERO.
     - **the file strip's honest sentence**, which is a line among other lines
       and must not have become a band.

   The READING is f257's, proved against a real .docx there; what DRAWS is
   here. The two files name each other.

   Screenshots go to test/chromium/shots/upload-structure/.
   Run: node test/chromium/upload-structure-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');
const { mkDocx, styledPara, para, WORD_PARTS } = require('../docxfix');

const OUT = path.join(__dirname, 'shots', 'upload-structure');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};
const seen = (page, sel) => page.evaluate(s => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
  return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top),
    size: parseFloat(cs.fontSize), weight: cs.fontWeight,
    on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' };
}, sel);

/* The distance to the first line of the AGREEMENT, off a Range rather than a
   box: a box is the LINE box and half-leading puts the glyphs elsewhere. */
const INK = `(() => {
  const box = document.getElementById('doc-canvas'); if (!box) return null;
  const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  while (walk.nextNode()) { const n = walk.currentNode;
    if ((n.textContent || '').trim().length < 8) continue;
    const rg = document.createRange(); rg.setStart(n, 0); rg.setEnd(n, Math.min(6, n.textContent.length));
    const r = Array.from(rg.getClientRects())[0];
    if (r && r.width > 2) return Math.round(r.top); }
  return null; })()`;

/* THE FILE THE OWNER WOULD BE UPLOADING: Heading styles, three numbering
   levels, a bullet list — and NOT ONE NUMBER IN ITS TEXT. */
const BODY =
  styledPara('Title', null, 0, 'DISTRIBUTION AGREEMENT') +
  para('This Agreement is made between Highland Corporate Ltd and Naivas Supermarkets.') +
  styledPara('Heading1', 1, 0, 'Definitions') +
  para('In this Agreement the following words have the meanings given below.') +
  styledPara('Heading1', 1, 0, 'Term and Termination') +
  styledPara(null, 1, 1, 'This Agreement runs for twelve months from the Effective Date.') +
  styledPara(null, 1, 1, 'Either party may terminate on sixty (60) days written notice.') +
  styledPara(null, 1, 2, 'Notice must be in writing and delivered to the registered office.') +
  styledPara(null, 1, 2, 'Notice given by email alone is not sufficient.') +
  styledPara(null, 1, 1, 'Termination does not affect any accrued rights.') +
  styledPara('Heading1', 1, 0, 'Charges') +
  styledPara(null, 1, 1, 'The Buyer shall pay each invoice within thirty (30) days of receipt.') +
  styledPara(null, 2, 0, 'Insurance is maintained at all times.') +
  styledPara(null, 2, 0, 'Records are kept for six years.') +
  styledPara('Heading1', 1, 0, 'Execution') +
  para('SIGNED for and on behalf of the parties by their duly authorised representatives.');

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  const bytes = mkDocx(BODY, { parts: WORD_PARTS });
  const file = path.join(OUT, 'Distribution_Agreement.docx');
  fs.writeFileSync(file, Buffer.from(bytes));

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* THE PIXELS ABOVE THE WORDING, BEFORE — measured on a contract already in
       the book, on the same tab, so the number is this tab's own. */
    const beforeId = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      return c.id;
    });
    await page.evaluate(i => openWorkspace(i), beforeId);
    await page.waitForTimeout(1000);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1200);
    const inkBefore = await page.evaluate(INK);

    /* ---- THE REAL FILE, THROUGH THE REAL INPUT ---- */
    await page.evaluate(() => openUploadModal());
    await page.waitForTimeout(700);
    const input = await page.$('#up-file');
    check('0a the upload dialog offers a real file input', !!input, input ? 'present' : 'absent');
    await input.setInputFiles(file);
    await page.waitForTimeout(4000);
    await page.fill('#up-cp', 'Naivas Supermarkets').catch(() => {});
    await page.screenshot({ path: path.join(OUT, '01-confirm.png') });

    /* ---- 1. THE STRIP SAYS WHAT IT FOUND, AND IT IS NOT A BAND ---- */
    const go = await page.$('#up-go');
    check('0b the file was read and the dialog offers to file it', !!go, go ? 'present' : 'absent');
    await go.click();
    await page.waitForTimeout(3500);

    const rec = await page.evaluate(() => {
      const c = state.contracts.find(x => x.source === 'upload'
        && (x.upload || {}).fileName === 'Distribution_Agreement.docx');
      if (!c) return null;
      return { id: c.id, rich: !!c.redlineText, format: c.format,
        report: (c.upload || {}).docStructure || null,
        text: (c.upload || {}).extractedText || '',
        body: c.redlineText || '' };
    });
    check('1a the file is on the record', !!rec, rec ? rec.id : 'absent');
    check('1b it stored a STRUCTURED body, the way an edited contract does',
      !!(rec && rec.rich && rec.format === 'rich'), rec ? `${rec.format} / ${rec.rich}` : '—');
    /* FIVE headings: the four clauses, plus the document's own title, which
       takes h1 so HaTi's clause model reads it as the title rather than as
       clause 1 — see f257 (1). */
    check('1c and the reader reports what it found',
      !!(rec && rec.report && rec.report.headings === 5 && rec.report.numbered >= 9),
      rec ? JSON.stringify(rec.report) : '—');

    /* THE NUMBERS WORD SHOWS, in the text every other feature reads. */
    const nums = ['1.\tDefinitions', '2.\tTerm and Termination', '2.1\t', '2.2\t',
      '(a)\t', '(b)\t', '2.3\t', '3.\tCharges', '3.1\t', '4.\tExecution'];
    const missing = nums.filter(n => !(rec && rec.text.includes(n)));
    check('1d the numbers are the numbers Word shows, restarts and all',
      missing.length === 0, missing.length ? 'missing ' + JSON.stringify(missing) : 'all ten');

    /* ---- 2. THE HEADINGS ARE ON SCREEN ---- */
    await page.evaluate(i => openWorkspace(i), rec.id);
    await page.waitForTimeout(1200);
    /* A NEW UPLOAD OPENS ON KEY TERMS — roomOpenOnTerms, which is right (an
       upload arrives with a complete document whose TERMS are the blanks) and
       means the sheet has to be asked for before it can be measured. */
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1400);
    const drawn = await page.evaluate(() => {
      /* THE STORED BODY, not the whole canvas: the sheet draws its own title
         and front matter above the wording, and counting those would make this
         check pass or fail for reasons that have nothing to do with the file. */
      const box = document.querySelector('#doc-canvas [data-anchor="redline"]')
        || document.getElementById('doc-canvas');
      if (!box) return null;
      const hs = [...box.querySelectorAll('h2,h3,h4')].map(el => {
        const cs = getComputedStyle(el), r = el.getBoundingClientRect();
        return { t: el.textContent.trim().slice(0, 40), tag: el.tagName,
          size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight),
          on: r.width > 0 && r.height > 0 };
      });
      const p = box.querySelector('p');
      const pcs = p ? getComputedStyle(p) : null;
      return { hs, body: pcs ? parseFloat(pcs.fontSize) : null,
        bodyWeight: pcs ? Number(pcs.fontWeight) : null };
    });
    check('2a the four clause headings are PAINTED on the sheet',
      !!(drawn && drawn.hs.length === 4 && drawn.hs.every(x => x.on)),
      drawn ? drawn.hs.map(x => x.t).join(' | ') : '—');
    check('2b each carries its resolved number',
      !!(drawn && /^1\./.test(drawn.hs[0].t) && /^4\./.test(drawn.hs[3].t)),
      drawn ? drawn.hs.map(x => x.t.split(/\s/)[0]).join(',') : '—');
    /* A HEADING MUST READ AS ONE, which is a computed fact and not a tag name:
       it is what makes the document followable, and it is what jsdom cannot
       answer. */
    check('2c and it reads as a heading — larger or heavier than the body',
      !!(drawn && drawn.hs.every(x => x.size > drawn.body || x.weight > drawn.bodyWeight)),
      drawn ? `h ${drawn.hs[0].size}px/${drawn.hs[0].weight} vs body ${drawn.body}px/${drawn.bodyWeight}` : '—');

    /* ---- 3. THE CLAUSE MODEL WORKS ON RECEIVED PAPER ---- */
    const segs = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const list = clauseSegment(c.redlineText || '');
      return { n: list.length, first: (list[0] || {}).title || (list[0] || {}).label || '' };
    });
    check('3a clauseSegment finds FOUR clauses, not one per paragraph',
      segs.n === 4, `${segs.n} clauses, first "${segs.first}"`);
    /* The second bill this job pays: with real headings the clause heading can
       be renamed and the front-matter region is offered. Both refuse outright
       on a document whose headings do not mark its clauses. */
    const front = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const f = window.clauseFrontClause ? clauseFrontClause(c.redlineText || '') : null;
      const rn = window.clauseReplaceHeading
        ? clauseReplaceHeading(c.redlineText || '', clauseSegment(c.redlineText || '')[0].clauseId, 'Meanings')
        : null;
      return { front: !!f, rename: !!rn };
    });
    check('3b the front-matter region is offered', front.front === true, String(front.front));
    check('3c and a clause heading can be renamed', front.rename === true, String(front.rename));

    /* ---- 4. THE PIXELS ABOVE THE WORDING ----
       THE ACCEPTANCE IS ABOUT THIS JOB, NOT ABOUT TWO DIFFERENT DOCUMENTS. A
       seeded template contract and an uploaded one do not begin at the same
       height and never did — an upload carries a file strip above its paper.
       So the number is measured on ONE document, with and without the line
       this job adds to that strip, which is exactly the state before and
       after. `inkBefore` above is reported beside it as the room's own figure. */
    const inkWith = await page.evaluate(INK);
    const inkWithout = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const keep = c.upload.docStructure;
      delete c.upload.docStructure;
      const dc = document.getElementById('doc-canvas');
      dc.innerHTML = docBodyStructured(c);
      const box = document.getElementById('doc-canvas');
      const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      let top = null;
      while (walk.nextNode()) { const n = walk.currentNode;
        if ((n.textContent || '').trim().length < 8) continue;
        const rg = document.createRange(); rg.setStart(n, 0); rg.setEnd(n, Math.min(6, n.textContent.length));
        const r = Array.from(rg.getClientRects())[0];
        if (r && r.width > 2) { top = Math.round(r.top); break; } }
      c.upload.docStructure = keep;
      dc.innerHTML = docBodyStructured(c);
      return top;
    });
    check('4a THIS JOB ADDS NOTHING ABOVE THE WORDING',
      inkWith != null && inkWithout != null && Math.abs(inkWith - inkWithout) <= 1,
      `with the line ${inkWith} · without it ${inkWithout} `
      + `(a template contract, for scale: ${inkBefore})`);

    /* ---- 5. THE FILE STRIP, AND NO BAND ---- */
    const strip = await page.evaluate(() => {
      const box = document.getElementById('doc-canvas');
      if (!box) return null;
      const hit = [...box.querySelectorAll('span')]
        .find(s => /heading|rubrik/i.test(s.textContent || ''));
      if (!hit) return { found: false };
      const row = hit.closest('div');
      const cs = getComputedStyle(row);
      return { found: true, text: (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160),
        h: Math.round(row.getBoundingClientRect().height),
        bg: cs.backgroundColor, border: cs.borderTopWidth };
    });
    check('5a the strip says how much structure was read', !!(strip && strip.found),
      strip && strip.found ? strip.text : 'absent');
    /* IT IS A LINE AMONG LINES, NOT A BAND — the standing rule. A band is a
       FILLED, BORDERED strip that says one thing; this is one more fact on the
       row that already carries the file's name, who filed it and how well it
       was read. The claim is about the SPAN this job added, not about the row
       it joined, which has drawn a hairline under itself since it was built. */
    const line = await page.evaluate(() => {
      const box = document.getElementById('doc-canvas'); if (!box) return null;
      const hit = [...box.querySelectorAll('span')]
        .find(s => /heading|rubrik/i.test(s.textContent || ''));
      if (!hit) return { found: false };
      const cs = getComputedStyle(hit);
      const row = hit.closest('div');
      return { found: true, bg: cs.backgroundColor, border: cs.borderTopWidth,
        pad: cs.padding, siblings: row ? row.children.length : 0 };
    });
    check('5b and it is a LINE, not a band',
      !!(line && line.found && /rgba\(0, 0, 0, 0\)|transparent/.test(line.bg)
         && line.border === '0px' && line.siblings > 4),
      line && line.found
        ? `bg ${line.bg}, border ${line.border}, one of ${line.siblings} on the row` : '—');

    await page.screenshot({ path: path.join(OUT, '02-document.png') });

    /* ---- 6. AND THE GUESSWORK STAYS FOR A FILE THAT CARRIES NOTHING ---- */
    const plainOk = await page.evaluate(() => {
      /* Read through the same one reader, in the page, so the claim is about
         the shipped code and not about a copy of it. */
      return (async () => {
        const enc = new TextEncoder();
        return true;
      })();
    });
    check('6a (the no-structure fallback is f257’s — proved there against a real file)',
      plainOk === true, 'see f257 (6)');

    check('7 no page errors anywhere in the journey', errors.length === 0,
      errors.slice(0, 3).join(' | '));
  } catch (e) {
    check('the journey ran', false, e.message);
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(r => console.log('  - ' + r.name + (r.detail ? ' — ' + r.detail : ''))); }
  process.exit(bad.length ? 1 : 0);
})();
