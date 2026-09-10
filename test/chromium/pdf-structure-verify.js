/* Chromium verification: A PDF KEEPS ITS STRUCTURE, AND PLAIN ENGLISH APPEARS
   ============================================================ (J-3.4)
   THE OWNER'S OWN WORDS (10 Sep 2026, a Financial Services Transfer Agreement
   uploaded as a PDF):

     "when I upload a pdf contract, I cant read it in plain english because the
      plain english button does not appear. Also, when i go from the document
      page to the negotiate page, the structure of the contract breaks and I am
      unable to follow the clauses and sub clauses. I need for the structure to
      stay intact and where there is a bold header to remain a bold header etc,
      same way a word document would."

   A REAL PDF THROUGH THE REAL FILE INPUT, and this file is where this feature's
   own claim lives. FOUR of these can be asked NOWHERE ELSE:

     - is the Plain English switch VISIBLE PIXELS on a PDF upload — the whole of
       the first half of the report, and a source check cannot see it, because
       the switch is drawn by the same code either way and what changed is
       whether the sheet it asks about holds any clauses;
     - does a bold heading RENDER bolder or larger than the body, on the
       Document tab AND on the Negotiate page — jsdom lays nothing out and would
       report a heading and a paragraph as the same thing;
     - is the file FRAME gone where the wording is laid out, so the reader is
       not handed a contract inside a contract;
     - the pixels above the first line of the agreement, which Q3 refuses to let
       this job grow.

   The READING is f233 (10)'s, proved there against real PDFs; what DRAWS is
   here. The two files name each other.

   Screenshots go to test/chromium/shots/pdf-structure/.
   Run: node test/chromium/pdf-structure-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'pdf-structure');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* ---- A REAL PDF, laid out line by line ----
   Each line gets its own font, size and baseline, which is all a page ever
   tells a reader about its structure. Built here rather than committed as a
   blob so the fixture's own shape is readable, and built as a PDF rather than
   as the line objects the reader is supposed to produce — a fixture that
   hand-writes those passes on the commit before the product could produce
   them. */
function makePdf(lines) {
  const ops = lines.map(l => {
    const f = l.bold ? '/FB' : '/F1';
    const txt = String(l.t).replace(/([()\\])/g, '\\$1');
    return `BT ${f} ${l.size || 11} Tf ${l.x || 60} ${l.y} Td (${txt}) Tj ET`;
  });
  const content = ops.join('\n');
  let out = '%PDF-1.5\n';
  const put = (n, b) => { out += `${n} 0 obj\n${b}\nendobj\n`; };
  put(1, '<</Type/Catalog/Pages 2 0 R>>');
  put(2, '<</Type/Pages/Kids[3 0 R]/Count 1>>');
  put(3, '<</Type/Page/Parent 2 0 R/Resources<</Font<</F1 5 0 R/FB 6 0 R>>>>'
       + '/MediaBox[0 0 612 792]/Contents 4 0 R>>');
  out += `4 0 obj\n<</Length ${content.length}>>\nstream\n${content}\nendstream\nendobj\n`;
  put(5, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>');
  put(6, '<</Type/Font/Subtype/Type1/BaseFont/Helvetica-Bold>>');
  out += 'trailer\n<</Size 7/Root 1 0 R>>\n%%EOF\n';
  return Uint8Array.from(out, ch => ch.charCodeAt(0) & 0xff);
}
/* The reported document: a title, bold MIXED-CASE article headings — which the
   ALL-CAPITALS guess cannot see — and numbered sub-clauses that soft-wrap. */
function reportedPdf() {
  let y = 740; const L = [];
  const add = (t, o = {}) => { L.push({ t, y, ...o }); y -= (o.gap || 16); };
  add('FINANCIAL SERVICES TRANSFER AGREEMENT', { bold: true, size: 15, gap: 34 });
  add('ARTICLE 1. Interpretation', { bold: true, size: 12, gap: 22 });
  add('1.1 In this Agreement the following expressions shall have the', {});
  add('meanings set out below unless the context otherwise requires.', { gap: 22 });
  add('ARTICLE 2. Obligations of the first party', { bold: true, size: 12, gap: 22 });
  add('2.1 The first party shall transfer the Services to the second party', {});
  add('in accordance with the timetable set out in Schedule 1.', { gap: 20 });
  add('2.2 The first party shall pay each undisputed invoice within thirty', {});
  add('(30) days of receipt.', { gap: 20 });
  add('2.3 Either party may terminate on six (6) months written notice.', {});
  return makePdf(L);
}
/* Flat prose: no bold, one size, no numbered clause. The document the
   guesswork exists for, and it must keep it. */
function flatPdf() {
  let y = 740; const L = [];
  ['This agreement is made between the parties named below on the date set',
   'out above. The parties have agreed the terms which follow and each',
   'intends them to be legally binding in every respect and at all times.',
   'The parties confirm they have taken their own advice before signing.'
  ].forEach(t => { L.push({ t, y }); y -= 16; });
  return makePdf(L);
}

/* The distance to the first line of the AGREEMENT, off a Range rather than a
   box: a box is the LINE box, and half-leading puts the glyphs elsewhere.
   Rooted at the PAPER, never at the canvas — on an upload the canvas's first
   text node is the file name inside the strip, which sits above the wording
   and cannot move, so a check rooted there measures the strip against itself. */
const INK = `(() => {
  const box = document.querySelector('.rl-paper, [data-anchor="redline"], .hati-doc')
    || document.getElementById('doc-canvas');
  if (!box) return null;
  const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walk.nextNode())) {
    const t = (n.nodeValue || '').trim();
    if (t.length < 8) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rect = r.getBoundingClientRect();
    if (rect.height > 0) return Math.round(rect.top);
  }
  return null;
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e.message || e)));

  const good = path.join(OUT, 'Financial_Services_Transfer_Agreement.pdf');
  const flat = path.join(OUT, 'Flat_Prose_Agreement.pdf');
  fs.writeFileSync(good, Buffer.from(reportedPdf()));
  fs.writeFileSync(flat, Buffer.from(flatPdf()));

  const upload = async file => {
    await page.evaluate(() => openUploadModal());
    await page.waitForTimeout(700);
    const input = await page.$('#up-file');
    if (!input) return null;
    await input.setInputFiles(file);
    await page.waitForTimeout(4500);
    await page.fill('#up-cp', 'Nordkust Industri AS').catch(() => {});
    const go = await page.$('#up-go');
    if (!go) return null;
    await go.click();
    await page.waitForTimeout(3500);
    return page.evaluate(n => {
      const c = state.contracts.find(x => x.source === 'upload'
        && (x.upload || {}).fileName === n);
      return c ? c.id : null;
    }, path.basename(file));
  };
  const openDoc = async id => {
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(1200);
    /* AN UPLOAD OPENS ON KEY TERMS — roomOpenOnTerms, which is right and means
       the sheet has to be asked for before it can be measured. The TAB IS
       PRESSED rather than routed to: roomGoTab takes the contract first and is
       a module function, so calling it by name from here does nothing at all
       and every measurement after it reads a pane that is still display:none. */
    await page.evaluate(() => {
      const b = document.querySelector('[data-ws-tab="docs"]');
      if (b) b.click();
    });
    await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(1400);
  };

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await page.waitForTimeout(2400);

    /* ---- Q3, BEFORE. Measured on a contract already in the book, on the same
       tab, so the number is this tab's own chrome rather than this file's. ---- */
    const beforeId = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed') || state.contracts[0];
      return c.id;
    });
    await openDoc(beforeId);
    const inkBefore = await page.evaluate(INK);

    /* ============ 1. THE REPORTED PDF, THROUGH THE REAL INPUT ============ */
    const id = await upload(good);
    check('1a the PDF is on the record', !!id, id || 'absent');
    if (!id) throw new Error('the upload did not produce a contract');

    const rec = await page.evaluate(i => {
      const c = getContract(i);
      return { rich: !!c.redlineText, format: c.format,
        report: (c.upload || {}).docStructure || null,
        chars: ((c.upload || {}).extractedText || '').length,
        body: String(c.redlineText || '').slice(0, 600) };
    }, id);
    check('1b it stored a STRUCTURED body, the way a Word upload does',
      !!(rec.rich && rec.format === 'rich'), `${rec.format} / ${rec.rich}`);
    check('1c and the reader reports what it FOUND on the page',
      !!(rec.report && rec.report.headings >= 2 && rec.report.numbered >= 3),
      JSON.stringify(rec.report));

    /* ============ 2. THE DOCUMENT TAB DRAWS THE AGREEMENT ============ */
    await openDoc(id);
    await page.screenshot({ path: path.join(OUT, '01-document-tab.png') });

    const drawn = await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      if (!canvas) return null;
      const heads = Array.from(canvas.querySelectorAll('h1,h2,h3,h4'))
        .filter(e => (e.textContent || '').trim())
        .map(e => { const cs = getComputedStyle(e), r = e.getBoundingClientRect();
          return { t: (e.textContent || '').trim().slice(0, 60), tag: e.tagName,
            size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) || 400,
            on: r.width > 0 && r.height > 0 }; });
      const ps = Array.from(canvas.querySelectorAll('p'))
        .filter(e => (e.textContent || '').trim().length > 40)
        .map(e => { const cs = getComputedStyle(e);
          return { t: (e.textContent || '').trim().slice(0, 60),
            size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) || 400 }; });
      return { heads, ps, frame: !!document.getElementById('uploaded-doc-frame') };
    });
    const article = (drawn.heads || []).find(x => /ARTICLE 2\./.test(x.t));
    const bodyP = (drawn.ps || [])[0];
    check('2a the bold mixed-case heading is a REAL heading on the sheet',
      !!(article && article.on), article ? `${article.tag} "${article.t}"` : 'not drawn');
    check('2b and it renders bolder or larger than the body — the reported fault',
      !!(article && bodyP && (article.weight > bodyP.weight || article.size > bodyP.size)),
      article && bodyP ? `head ${article.size}px/${article.weight} vs body ${bodyP.size}px/${bodyP.weight}` : '—');
    check('2c the sub-clauses are their own paragraphs, numbers intact',
      (drawn.ps || []).some(p => /^2\.1 /.test(p.t)) && (drawn.ps || []).some(p => /^2\.2 /.test(p.t)),
      (drawn.ps || []).map(p => p.t.slice(0, 12)).join(' | '));
    check('2d the file FRAME is gone — no contract inside a contract',
      drawn.frame === false, drawn.frame ? 'the iframe is still drawn' : 'absent');

    /* ---- Q3 — AND IT IS MEASURED AS WHAT THIS JOB ADDS, not as one screen
       against another. A BEFORE/AFTER NUMBER IS NOT AVAILABLE ON THIS SCREEN
       and saying so is the honest half: on the parent a PDF drew an <iframe>,
       so there was no first line of the agreement to measure at all. What CAN
       be asked, and is the thing Q3 exists to stop, is whether this job put
       anything of its own above the wording — so the same contract is measured
       with the structure line on the strip and with it taken away. The
       template contract's own number is reported beside it for scale and is
       deliberately not asserted: an upload carries a file strip a template
       contract does not, and comparing the two would be comparing chrome. */
    const inkWith = await page.evaluate(INK);
    const inkWithout = await page.evaluate(() => {
      const c = getContract(state.activeId);
      const keep = c.upload.docStructure;
      delete c.upload.docStructure;
      const dc = document.getElementById('doc-canvas');
      dc.innerHTML = docBodyStructured(c);
      const box = document.querySelector('.rl-paper, [data-anchor="redline"], .hati-doc') || dc;
      const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      let top = null;
      while (walk.nextNode()) {
        const n = walk.currentNode;
        if ((n.textContent || '').trim().length < 8) continue;
        const rg = document.createRange(); rg.selectNodeContents(n);
        const r = rg.getBoundingClientRect();
        if (r && r.height > 0) { top = Math.round(r.top); break; }
      }
      c.upload.docStructure = keep;
      dc.innerHTML = docBodyStructured(c);
      return top;
    });
    check('2e Q3 — this job adds nothing above the wording',
      inkWith != null && inkWithout != null && Math.abs(inkWith - inkWithout) <= 1,
      `with the line ${inkWith} · without it ${inkWithout} (a template contract, for scale: ${inkBefore})`);

    /* AND THE STRIP CANNOT GROW AT ANY WIDTH THIS PRODUCT SUPPORTS. 2e measures
       ONE window; the strip's own history is that it used to WRAP, and the
       growth then appeared only where the row ran out of room. */
    const stripAt = [];
    for (const w of [1500, 1440, 1366, 1280]) {
      await page.setViewportSize({ width: w, height: 900 });
      await page.waitForTimeout(250);
      const m = await page.evaluate(() => {
        const box = document.getElementById('doc-canvas'); if (!box) return null;
        const hit = [...box.querySelectorAll('span')].find(s => /Download original|Re-read|KB/i.test(s.textContent || ''))
          || [...box.querySelectorAll('div')].find(d => /Download original/i.test(d.textContent || ''));
        const row = hit && (hit.closest('div[style*="display:flex"]') || hit.closest('div'));
        if (!row) return null;
        const cs = getComputedStyle(row);
        return { h: Math.round(row.getBoundingClientRect().height), wrap: cs.flexWrap };
      });
      stripAt.push({ w, ...(m || {}) });
    }
    await page.setViewportSize({ width: 1500, height: 950 });
    await page.waitForTimeout(300);
    const tallest = Math.max(...stripAt.map(x => x.h || 0));
    const shortest = Math.min(...stripAt.map(x => x.h || 1e9));
    check('2f the file strip is ONE LINE at every supported width',
      stripAt.every(x => x.wrap === 'nowrap') && tallest - shortest <= 1,
      stripAt.map(x => `${x.w}:${x.h}px/${x.wrap}`).join(' · '));

    /* ============ 3. THE PLAIN ENGLISH SWITCH — THE REPORTED FAULT ============ */
    const sw = await page.evaluate(() => {
      const el = document.querySelector('[data-doc-read]');
      if (!el) return { on: false, why: 'not drawn' };
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      return { on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
        why: `${Math.round(r.width)}x${Math.round(r.height)}`,
        clauses: (typeof docReadClauses === 'function')
          ? docReadClauses(getContract(state.activeId)).length : -1 };
    });
    check('3a the Plain English switch is VISIBLE PIXELS on a PDF — the report',
      sw.on === true, `${sw.why} · ${sw.clauses} clauses on the sheet`);
    check('3b and the walk finds real clauses to read',
      sw.clauses >= 4, String(sw.clauses));

    /* ============ 4. THE NEGOTIATE PAGE KEEPS THE SHAPE ============ */
    await page.evaluate(i => openRedlineWorkbench(i), id);
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(OUT, '02-negotiate.png') });
    const nego = await page.evaluate(() => {
      const root = document.querySelector('.rl-doc, #rl-grid, .redline-page');
      if (!root) return null;
      const heads = Array.from(root.querySelectorAll('h1,h2,h3,h4'))
        .filter(e => (e.textContent || '').trim())
        .map(e => { const cs = getComputedStyle(e);
          return { t: (e.textContent || '').trim().slice(0, 60),
            size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) || 400 }; });
      const ps = Array.from(root.querySelectorAll('p'))
        .filter(e => (e.textContent || '').trim().length > 40)
        .map(e => { const cs = getComputedStyle(e);
          return { t: (e.textContent || '').trim().slice(0, 60),
            size: parseFloat(cs.fontSize), weight: Number(cs.fontWeight) || 400 }; });
      return { heads, ps };
    });
    const nArticle = (nego && nego.heads || []).find(x => /ARTICLE 2\./.test(x.t));
    const nBody = (nego && nego.ps || [])[0];
    check('4a the heading is still a heading on the Negotiate page',
      !!nArticle, nArticle ? `"${nArticle.t}"` : (nego ? nego.heads.map(h => h.t.slice(0, 20)).join(' | ') || 'none' : 'no page'));
    check('4b and it still reads bolder or larger than the body — the reported fault',
      !!(nArticle && nBody && (nArticle.weight > nBody.weight || nArticle.size > nBody.size)),
      nArticle && nBody ? `head ${nArticle.size}px/${nArticle.weight} vs body ${nBody.size}px/${nBody.weight}` : '—');

    /* ============ 5. A PDF WITH NOTHING TO READ IS UNCHANGED ============ */
    await page.evaluate(() => setView('register'));
    await page.waitForTimeout(900);
    const flatId = await upload(flat);
    check('5a the flat PDF is on the record', !!flatId, flatId || 'absent');
    if (flatId) {
      const fr = await page.evaluate(i => {
        const c = getContract(i);
        return { rich: !!c.redlineText, report: (c.upload || {}).docStructure || null };
      }, flatId);
      check('5b it stored NO structured body — the guesswork stays',
        fr.rich === false, fr.rich ? 'a body was stored' : 'none, as before');
      await openDoc(flatId);
      const ff = await page.evaluate(() => {
        const strip = document.getElementById('doc-canvas');
        return { frame: !!document.getElementById('uploaded-doc-frame'),
          says: /Structure read from the wording|struktur/i.test((strip || {}).textContent || '') };
      });
      check('5c and it still draws its file frame', ff.frame === true,
        ff.frame ? 'frame present' : 'the frame went with it');
      check('5d and still says its structure was read from the wording',
        ff.says === true, String(ff.says));
    }

    /* ---- and the READ one must NOT wear that sentence ---- */
    await openDoc(id);
    const saysRead = await page.evaluate(() => {
      const canvas = document.getElementById('doc-canvas');
      return /Structure read from the wording/i.test((canvas || {}).textContent || '');
    });
    check('5e a PDF whose structure was really READ does not claim it was guessed',
      saysRead === false, saysRead ? 'it wears the guessed phrase' : 'correct');

    /* ============ 7. A PDF ALREADY IN THE WORKSPACE — THE OWNER'S OWN CASE ============
       "You have not fixed 1 and 2", said on a contract that was ALREADY in the
       book. Everything above proves a NEW upload, and every one of those checks
       passed while the report was true — because NOTHING ALREADY UPLOADED IS
       RE-READ (D-5), deliberately, so the only route an existing PDF has is the
       Re-read control, and that control had only ever been taught about Word.

       SO THE STATE IS STAGED THE WAY A PRE-J-3.4 RECORD REALLY IS — the file
       still on the record, and the structure and the stored body taken off it —
       and then the REAL button is pressed. Staged rather than uploaded on the
       old code, because that code is two commits back; what matters is that
       the record is the shape those uploads left behind, which 7a proves by
       measuring the switch GONE before the press. */
    const oldId = await page.evaluate(i => {
      const c = getContract(i);
      delete c.redlineText; delete c.format;
      if (c.upload) delete c.upload.docStructure;
      return c.id;
    }, id);
    await openDoc(oldId);
    const swBefore = await page.evaluate(() => !!document.querySelector('[data-doc-read]'));
    check('7a a PDF filed before this shipped draws NO Plain English switch',
      swBefore === false, swBefore ? 'the switch is there — nothing was staged' : 'gone, as reported');

    const pressed = await page.evaluate(() => {
      const b = document.querySelector('[data-reread]');
      if (!b) return 'no Re-read control on the page';
      b.click(); return '';
    });
    check('7b the Re-read control is on the page to press', pressed === '', pressed || 'pressed');
    await page.waitForTimeout(6000);

    const after = await page.evaluate(i => {
      const c = getContract(i);
      return { rich: !!c.redlineText, report: (c.upload || {}).docStructure || null };
    }, oldId);
    check('7c re-reading a PDF stores its structure — the fix',
      after.rich === true && !!after.report && !!(after.report.headings || after.report.numbered),
      after.rich ? `headings ${(after.report||{}).headings}, numbered ${(after.report||{}).numbered}`
                 : 'no body stored — the door is still Word-only');

    await openDoc(oldId);
    const swAfter = await page.evaluate(() => {
      const el = document.querySelector('[data-doc-read]');
      if (!el) return { on: false, clauses: -1 };
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      return { on: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none',
        clauses: (typeof docReadClauses === 'function')
          ? docReadClauses(getContract(state.activeId)).length : -1 };
    });
    check('7d and the Plain English switch is VISIBLE PIXELS afterwards',
      swAfter.on === true, `${swAfter.on} · ${swAfter.clauses} clauses`);
    check('7e with real clauses on the sheet', swAfter.clauses >= 4, String(swAfter.clauses));
    await page.screenshot({ path: path.join(OUT, '03-after-reread.png') });

    check('6 no page errors anywhere in the journey', errors.length === 0,
      errors.slice(0, 3).join(' | ') || 'none');
  } catch (e) {
    check('the journey ran', false, e.message);
  }

  await browser.close();
  await h.stop();
  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} PASS`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(b => console.log('  - ' + b.name + ' — ' + b.detail)); }
  process.exit(bad.length ? 1 : 0);
})();
