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
   box: a box is the LINE box and half-leading puts the glyphs elsewhere.

   IT IS ROOTED AT THE PAPER, NOT AT THE CANVAS, AND THAT IS THE WHOLE CHECK.
   Rooted at #doc-canvas the first text node of eight characters on an UPLOAD
   is the FILE NAME inside the strip — which sits above the wording and whose
   own top never moves however many lines the strip wraps to. So the check
   compared the strip's top against the strip's top, reported PASS, and could
   not fail: it measured the one thing this job cannot move while the wording
   underneath it moved 36px. A net that cannot fail is worse than no net,
   because it reads as a measurement. */
const INK = `(() => {
  const box = document.querySelector('.rl-paper, [data-anchor="redline"], .hati-doc')
    || document.getElementById('doc-canvas'); if (!box) return null;
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
      /* The PAPER, for the same reason the shared helper reads it — rooted at
         the canvas this walker found the file name and reported the strip's
         own top on both sides of the comparison. */
      const box = document.querySelector('.rl-paper, [data-anchor="redline"], .hati-doc') || dc;
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

    /* ---- 4b. AND IT CANNOT GROW AT ANY WIDTH THIS PRODUCT SUPPORTS ----
       4a measures ONE window. The strip used to WRAP, so the growth appeared
       only where the row ran out of room — measured at 1440 and 1280 and not
       at 1500 or 1366, which is exactly the shape a single-width check misses.
       The strip is nowrap now, so the claim is that it is ONE LINE at every
       laptop width on laptops-verify's own set, whatever is on it. */
    const stripAt = [];
    for (const w of [1500, 1440, 1366, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      const m = await page.evaluate(() => {
        const box = document.getElementById('doc-canvas'); if (!box) return null;
        const hit = [...box.querySelectorAll('span')].find(s => /Download original|Re-read|KB/i.test(s.textContent || ''))
          || [...box.querySelectorAll('div')].find(d => /Download original/i.test(d.textContent || ''));
        const row = hit && (hit.closest('div[style*="display:flex"]') || hit.closest('div'));
        if (!row) return null;
        const cs = getComputedStyle(row);
        return { h: Math.round(row.getBoundingClientRect().height),
          line: Math.round(parseFloat(cs.lineHeight) || 0), wrap: cs.flexWrap };
      });
      stripAt.push({ w, ...(m || {}) });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    const tallest = Math.max(...stripAt.map(x => x.h || 0));
    const shortest = Math.min(...stripAt.map(x => x.h || 1e9));
    check('4b the file strip is ONE LINE at every supported width',
      stripAt.every(x => x.wrap === 'nowrap') && tallest - shortest <= 1,
      stripAt.map(x => `${x.w}:${x.h}px/${x.wrap}`).join(' · '));

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

    /* ---- 6. AND THE GUESSWORK STAYS FOR A FILE THAT CARRIES NOTHING ----
       REWRITTEN 30 Aug 2026. This was an async IIFE whose whole body was
       `const enc = new TextEncoder(); return true;` — it could not return
       anything but true, so the check was a hardcoded pass sitting in the
       run's tally that no product change could turn red. A green check that
       measures nothing is worse than no check, because it reads as a
       measurement.

       WHAT IT ASKS NOW is the claim itself, driven in the page: a Word file
       with real numbering and NO heading styles — the ordinary counterparty
       shape, headings typed in capitals — must still come out with headings,
       because the guesswork is kept exactly where the file declares none. */
    const plain = await page.evaluate(async () => {
      const p = t => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
      const body = p('SUPPLY AGREEMENT') + p('Between Highland Ltd and Naivas Ltd.')
        + p('DEFINITIONS') + p('In this Agreement the words below have the meanings given.')
        + p('PAYMENT') + p('The Buyer shall pay within thirty (30) days.');
      const xml = '<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/'
        + 'wordprocessingml/2006/main"><w:body>' + body + '</w:body></w:document>';
      const out = docxXmlToRich(xml, {});
      const heads = (out.html.match(/<h[1-4]>/g) || []).length;
      const segs = (window.clauseSegment ? clauseSegment(out.html) : []).length;
      return { heads, segs, styled: out.report.styled, html: out.html.slice(0, 120) };
    });
    check('6a a file with NO heading styles still finds its clauses — the guesswork stays',
      !!(plain && plain.styled === false && plain.heads >= 3 && plain.segs === 2),
      plain ? `${plain.heads} headings, ${plain.segs} clauses, styled ${plain.styled}` : '—');

    /* ---- 8. THE MAERSK SHAPE: THE NUMBERS AND THE SPACES ON THE PAPER
       (Young reported it 23 Sep 2026; f370 is the reading) ----
       A list that points at another list through a list style, and spaces
       Word kept in runs of their own, bold or underlined. At the parent the
       sheet printed "3.1" where the file says 3.3, and "Order.Unless". Read
       off the PAINTED sheet, because that is where the owner saw it. */
    try {
      const W8 = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
      const R8 = (t, o) => `<w:r>${o ? `<w:rPr>${o}</w:rPr>` : ''}<w:t xml:space="preserve">${t}</w:t></w:r>`;
      const P8 = (st, id, lv, runs) => `<w:p><w:pPr>${st ? `<w:pStyle w:val="${st}"/>` : ''}<w:numPr><w:ilvl w:val="${lv}"/><w:numId w:val="${id}"/></w:numPr></w:pPr>${runs}</w:p>`;
      const L8 = [0, 1, 2].map(i => `<w:lvl w:ilvl="${i}"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="${['%1', '%1.%2', '%1.%2.%3'][i]}"/></w:lvl>`).join('');
      const H8 = n => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:pPr><w:outlineLvl w:val="${n - 1}"/></w:pPr></w:style>`;
      const body8 = P8('Heading1', 1, 0, R8('DEFINITIONS')) + P8('Heading1', 1, 0, R8('SERVICES'))
        + P8('Heading1', 1, 0, R8('TERM AND TERMINATION'))
        + P8('Heading2', 2, 1, R8('Term of the Agreement.', '<w:b/>') + R8(' This Agreement shall commence on the Effective Date.'))
        + P8('Heading2', 2, 1, R8('Term of Service Order.', '<w:b/>') + R8(' ', '<w:b/>') + R8('Unless otherwise specified, the term of any agreed') + R8(' ', '<w:u w:val="single"/>') + R8('Service Order(s) is six (6) months.'))
        + P8('Heading2', 1, 1, R8('Extension of a Service Order.', '<w:b/>') + R8(' If relevant, Maersk may renew the Service Order(s).'))
        + P8('Heading2', 1, 1, R8('Termination for convenience'))
        + P8('Heading3', 2, 2, R8('The Agreement.', '<w:b/>') + R8(' Maersk may terminate the Agreement upon three (3) months notice.'));
      const bytes8 = mkDocx(body8, { parts: [
        { name: 'word/numbering.xml', data: `<?xml version="1.0"?><w:numbering ${W8}><w:abstractNum w:abstractNumId="10"><w:styleLink w:val="MaerskList"/>${L8}</w:abstractNum><w:abstractNum w:abstractNumId="11"><w:numStyleLink w:val="MaerskList"/></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="10"/></w:num><w:num w:numId="2"><w:abstractNumId w:val="11"/></w:num></w:numbering>` },
        { name: 'word/styles.xml', data: `<?xml version="1.0"?><w:styles ${W8}>${H8(1)}${H8(2)}${H8(3)}</w:styles>` },
      ] });
      const file8 = path.join(OUT, 'Maersk_Shape.docx');
      fs.writeFileSync(file8, Buffer.from(bytes8));
      await page.evaluate(() => openUploadModal());
      await page.waitForTimeout(700);
      const in8 = await page.$('#up-file');
      await in8.setInputFiles(file8);
      await page.waitForTimeout(4000);
      await page.fill('#up-cp', 'Maersk A/S').catch(() => {});
      const go8 = await page.$('#up-go');
      if (go8) await go8.click();
      await page.waitForTimeout(3500);
      const id8 = await page.evaluate(() => {
        const c = state.contracts.find(x => x.source === 'upload' && (x.upload || {}).fileName === 'Maersk_Shape.docx');
        return c ? c.id : null;
      });
      if (id8){
        await page.evaluate(i => openWorkspace(i), id8);
        await page.waitForTimeout(1200);
        await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
        await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1400);
      }
      const sheet = await page.evaluate(() => {
        const box = document.querySelector('#doc-canvas [data-anchor="redline"]') || document.getElementById('doc-canvas');
        return box ? box.innerText.replace(/[ \t ]+/g, ' ') : '';
      });
      const at = (num, words) => new RegExp('(^|\\n)\\s*' + num.replace(/\./g, '\\.') + ' ' + words).test(sheet);
      const wanted = [['3.1', 'Term of the Agreement'], ['3.2', 'Term of Service Order'], ['3.3', 'Extension of a Service Order'],
        ['3.4', 'Termination for convenience'], ['3.4.1', 'The Agreement']];
      const wrong = wanted.filter(([n, w]) => !at(n, w)).map(([n]) => n);
      check('8a the painted sheet numbers the Maersk clauses as Word does — 3.1 to 3.4.1',
        !!id8 && wrong.length === 0, id8 ? (wrong.length ? 'not found: ' + wrong.join(', ') : 'all five') : 'the upload did not file');
      check('8b and no word is joined to its neighbour',
        /Order\. Unless/.test(sheet) && /agreed Service/.test(sheet) && !/Order\.Unless|agreedService/.test(sheet),
        (sheet.match(/Term of Service Order[^\n]{0,70}/) || [''])[0]);
      await page.screenshot({ path: path.join(OUT, '08-maersk-shape.png') });
    } catch (e) {
      check('8 the Maersk-shaped upload ran', false, e.message);
    }

    /* ---- 9. THE WAREHOUSING SHAPE: A PAGE BANNER IS NOT A CLAUSE
       (Young ruled it 23 Sep 2026; f371 is the reading) ----
       Unnumbered "PAGE 1 OF 2" lines set as Heading 2 over numbered clauses set
       as Heading 3. At the parent the negotiate page drew the two banners as
       two clauses, each holding a whole page. Measured on the PAINTED
       negotiate page, because that is where the owner saw it. */
    try {
      const W9 = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
      const R9 = t => `<w:r><w:t xml:space="preserve">${t}</w:t></w:r>`;
      const S9 = (st, t) => `<w:p><w:pPr><w:pStyle w:val="${st}"/></w:pPr>${R9(t)}</w:p>`;
      const P9 = t => `<w:p>${R9(t)}</w:p>`;
      const H9 = n => `<w:style w:type="paragraph" w:styleId="Heading${n}"><w:name w:val="heading ${n}"/><w:pPr><w:outlineLvl w:val="${n - 1}"/></w:pPr></w:style>`;
      const body9 = S9('Heading1', 'WAREHOUSING AGREEMENT')
        + P9('This Agreement is made between Apex Logistics Limited and Savannah Consumer Goods Limited.')
        + S9('Heading3', 'RECITALS:') + P9('WHEREAS the Logistics Provider stores and handles goods.')
        + S9('Heading2', 'PAGE 1 OF 2: DEFINITIONS AND SCOPE')
        + S9('Heading3', '1. DEFINITIONS') + P9('In this Agreement the words below have these meanings.')
        + S9('Heading3', '2. SCOPE OF SERVICES') + P9('The Logistics Provider shall store the Goods at the Facility.')
        + S9('Heading2', 'PAGE 2 OF 2: FEES AND LAW')
        + S9('Heading3', '3. CHARGES AND PAYMENT') + P9('The Customer shall pay each invoice within thirty (30) days.')
        + S9('Heading3', '4. GOVERNING LAW') + P9('This Agreement is governed by the laws of Kenya.');
      const bytes9 = mkDocx(body9, { parts: [
        { name: 'word/styles.xml', data: `<?xml version="1.0"?><w:styles ${W9}>${H9(1)}${H9(2)}${H9(3)}</w:styles>` },
      ] });
      const file9 = path.join(OUT, 'Warehousing_Shape.docx');
      fs.writeFileSync(file9, Buffer.from(bytes9));
      await page.evaluate(() => { try { closeModal(); } catch (_) {} });
      await page.evaluate(() => openUploadModal());
      await page.waitForTimeout(700);
      const in9 = await page.$('#up-file');
      await in9.setInputFiles(file9);
      await page.waitForTimeout(4000);
      await page.fill('#up-cp', 'Savannah Consumer Goods Limited').catch(() => {});
      const go9 = await page.$('#up-go');
      if (go9) await go9.click();
      await page.waitForTimeout(3500);
      const id9 = await page.evaluate(() => {
        const c = state.contracts.find(x => x.source === 'upload' && (x.upload || {}).fileName === 'Warehousing_Shape.docx');
        return c ? c.id : null;
      });
      if (id9){
        await page.evaluate(i => openRedlineWorkbench(i), id9);
        await page.waitForSelector('.redline-page .rl-doc', { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(1500);
      }
      const paper = await page.evaluate(() => {
        const doc = document.querySelector('.redline-page .rl-doc');
        if (!doc) return null;
        const clauses = Array.from(doc.querySelectorAll('section.rl-clause[data-clause]'));
        const sects = Array.from(doc.querySelectorAll('.rl-sect'));
        const shown = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
        return {
          clauses: clauses.length,
          heads: clauses.map(s => (s.querySelector('.rl-clause-h') || {}).textContent || '').map(t => t.trim()),
          sects: sects.filter(shown).map(s => s.textContent.trim()),
          doorsInSect: sects.reduce((n, s) => n + s.querySelectorAll('button,[data-rl-cp-editor],[data-rl-cp-open],[data-clause]').length, 0),
          pageAsClause: clauses.some(s => /PAGE \d OF/.test((s.querySelector('.rl-clause-h') || {}).textContent || '')),
        };
      });
      check('9a the negotiate page draws the numbered clauses as the clauses — five, not three',
        !!paper && paper.clauses === 5 && !paper.pageAsClause,
        paper ? `${paper.clauses} clauses: ${paper.heads.join(' | ')}` : (id9 ? 'no paper' : 'the upload did not file'));
      check('9b and each page banner is still on the paper, as a section title',
        !!paper && paper.sects.length === 2 && /PAGE 1 OF 2/.test(paper.sects[0]) && /PAGE 2 OF 2/.test(paper.sects[1]),
        paper ? JSON.stringify(paper.sects) : '—');
      check('9c a section title is not a door — no pencil, no clause behind it',
        !!paper && paper.sects.length === 2 && paper.doorsInSect === 0,
        paper ? `${paper.doorsInSect} doors in the section titles` : '—');
      await page.screenshot({ path: path.join(OUT, '09-warehousing-shape.png') });
    } catch (e) {
      check('9 the Warehousing-shaped upload ran', false, e.message);
    }

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
