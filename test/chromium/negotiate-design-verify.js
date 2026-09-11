/* Chromium verification: THE NEGOTIATE PAGE WEARS THE DOCUMENT'S OWN DESIGN
   ============================================================
   Young asked why the same contract looked different on the two pages —
   *"even company standard contracts look different especially the font"* —
   and then ruled: *"Make the Negotiate page use the document's style."*

   THIS CLAIM CAN BE MADE NOWHERE ELSE. The whole of it is a cascade question:
   nine designs, each an !important face rule, against a page whose own sheet
   sets a face of its own — and a rule that loses a cascade fight looks
   perfectly correct in the source. Only a rendered page knows which won.

   EVERY CLAIM IS A RELATION, NEVER A TYPEFACE BY NAME. What was reported is
   that the two pages DISAGREE, so what is pinned is that they agree; a check
   asserting "Times New Roman" would go red the day somebody re-picks the
   face for Formal legal, which is a decision rather than a regression.

   The READING is f129 (9); what DRAWS is here. The two files name each other.

   Screenshots go to test/chromium/shots/negotiate-design/.
   Run: node test/chromium/negotiate-design-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'negotiate-design');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* What the paper resolves to, and what the furniture standing on it resolves
   to. The face is read off the FIRST family in the stack, because that is the
   one the browser actually used for Latin text. */
const READ = `(() => {
  const face = el => el ? getComputedStyle(el).fontFamily.split(',')[0].replace(/['"]/g, '').trim() : null;
  const paper = document.querySelector('.redline-page .rl-paper') || document.querySelector('#doc-canvas');
  if (!paper) return { paper: null };
  const hook = (() => { let n = paper;
    for (let i = 0; i < 6 && n; i++) { if (n.getAttribute && n.getAttribute('data-doc-body')) return n.getAttribute('data-doc-body'); n = n.parentElement; }
    return null; })();
  /* A real paragraph of the agreement, not a caption: forty characters is
     past every label on either sheet. */
  const body = Array.from(paper.querySelectorAll('p'))
    .find(p => (p.textContent || '').trim().length > 40) || null;
  const head = paper.querySelector('h2,h3,h4') || null;
  const pencil = paper.querySelector('.rl-cp-pill') || null;
  const mark = pencil ? pencil.querySelector('svg') : null;
  return { paper: face(paper), hook,
    body: face(body), bodyAlign: body ? getComputedStyle(body).textAlign : null,
    head: face(head), headTT: head ? getComputedStyle(head).textTransform : null,
    pencil: face(pencil), pencilMark: face(mark),
    has: { body: !!body, head: !!head, pencil: !!pencil } };
})()`;

const openDoc = async (page, id) => {
  await page.evaluate(i => openWorkspace(i), id);
  await page.waitForTimeout(1100);
  await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
  await page.waitForSelector('#doc-canvas', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1100);
  return page.evaluate(READ);
};
const openNego = async (page, id) => {
  await page.evaluate(i => openRedlineWorkbench(i), id);
  await page.waitForSelector('.redline-page .rl-paper', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1400);
  return page.evaluate(READ);
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati({ seed: true });
  await seedWorkspace(h);
  const b = await chromium.launch({ executablePath: EXEC });
  const ctx = await b.newContext({ viewport: { width: 1500, height: 1000 } });
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

    const id = await page.evaluate(() => {
      const c = state.contracts.find(x => x.status !== 'Signed' && !x.execution) || state.contracts[0];
      return c.id;
    });

    /* ---- 0. THE CONTROL, FIRST ----
       A contract with NO design must read the same on both pages after this
       change as it did before it. Without this, "the two pages agree" is
       satisfied by a change that dressed every contract in the workspace. */
    await page.evaluate(i => { const c = getContract(i); if (c.branding) delete c.branding.designId; }, id);
    const plainDoc = await openDoc(page, id);
    const plainNeg = await openNego(page, id);
    check('0a CONTROL — with no design set, no design hook is on either paper',
      !plainDoc.hook && !plainNeg.hook, `doc ${plainDoc.hook} · nego ${plainNeg.hook}`);
    check('0b CONTROL — and the negotiate page keeps the platform’s own face',
      !!plainNeg.body && /Plex/.test(plainNeg.paper), plainNeg.paper);

    /* ---- 1. THE REPORTED FAULT, ON ONE CONTRACT, ON BOTH PAGES ---- */
    await page.evaluate(i => {
      const c = getContract(i);
      c.branding = { ...(c.branding || {}), designId: 'formal-legal' };
    }, id);
    const doc = await openDoc(page, id);
    await page.screenshot({ path: path.join(OUT, '01-document.png') });
    const neg = await openNego(page, id);
    await page.screenshot({ path: path.join(OUT, '02-negotiate.png') });

    check('1a the design reaches the negotiate paper at all',
      neg.hook === 'formal-legal', `hook ${neg.hook}`);
    check('1b both pages found a real paragraph of the agreement to measure',
      doc.has.body && neg.has.body, `doc ${doc.has.body} · nego ${neg.has.body}`);
    /* THE HEADLINE. Against the parent this reports the report itself. */
    check('1c the two pages set the agreement in ONE face',
      !!doc.body && doc.body === neg.body, `doc "${doc.body}" · nego "${neg.body}"`);
    check('1d and the face really is the design’s, not the platform’s',
      !!neg.body && !/Plex/.test(neg.body), neg.body);
    /* Formal legal justifies its paragraphs — a heading treatment, not a face,
       so it is the second half of "the style" and is checked apart from it. */
    check('1e the paragraph treatment agrees too',
      doc.bodyAlign === neg.bodyAlign, `doc ${doc.bodyAlign} · nego ${neg.bodyAlign}`);
    check('1f the clause headings agree',
      !!doc.head && doc.head === neg.head, `doc "${doc.head}" · nego "${neg.head}"`);

    /* ---- 2. THE PAPER WEARS IT; THE FURNITURE DOES NOT ----
       The clause pencil sits INSIDE the sheet, so the design's `*` rule
       reaches it. A Save button set in the contract's typeface is the page's
       own chrome pretending to be the agreement. */
    check('2a the negotiate page still draws its clause pencil',
      neg.has.pencil, neg.has.pencil ? 'present' : 'absent');
    check('2b the pencil keeps the product’s own face',
      !!neg.pencil && /Plex/.test(neg.pencil), neg.pencil);
    check('2c and so does the mark inside it',
      !neg.pencilMark || /Plex/.test(neg.pencilMark), neg.pencilMark);

    /* ---- 3. A SECOND DESIGN, SO 1c CANNOT PASS BY COINCIDENCE ----
       Ceremonial is a different family AND uppercases its headings, so this
       says the whole design travels rather than one typeface happening to
       match. */
    await page.evaluate(i => {
      const c = getContract(i);
      c.branding = { ...(c.branding || {}), designId: 'ceremonial' };
    }, id);
    const doc2 = await openDoc(page, id);
    const neg2 = await openNego(page, id);
    check('3a a second design travels as well',
      neg2.hook === 'ceremonial' && !!doc2.body && doc2.body === neg2.body,
      `hook ${neg2.hook} · doc "${doc2.body}" · nego "${neg2.body}"`);
    check('3b it is a DIFFERENT face from the first, so 1c was not a coincidence',
      !!neg2.body && neg2.body !== neg.body, `${neg.body} → ${neg2.body}`);
    check('3c and its heading treatment agrees on the two pages',
      doc2.headTT === neg2.headTT, `doc ${doc2.headTT} · nego ${neg2.headTT}`);

    /* ---- 4. A HEADING THE DESIGN ACTUALLY REACHES ----
       3c above came back `none · none`, and it was right to: a template
       contract's headings are h3 and h4 on BOTH pages, and every heading rule
       in the design block names h1 or h2. So it pinned that the two pages
       agree and proved nothing about the treatment itself.

       A contract whose wording is STORED — every upload since J-3.1, and every
       contract anybody has redlined — draws real h1s and h2s, which is where
       Formal legal's uppercase actually bites. So the body is planted here
       rather than the claim being quietly dropped. */
    await page.evaluate(i => {
      const c = getContract(i);
      c.branding = { ...(c.branding || {}), designId: 'formal-legal' };
      c.format = 'rich';
      c.redlineText = '<h1>Supply Agreement</h1>'
        + '<h2>Independent Contractor</h2>'
        + '<p>AIT shall act as an independent contractor and shall be solely responsible '
        + 'for the management, supervision and performance of its employees and agents.</p>'
        + '<h2>Limitation of Liability</h2>'
        + '<p>Neither party shall be liable to the other for any indirect, incidental or '
        + 'consequential damages, including loss of profits, revenue or goodwill.</p>';
      delete c.negotiation;
    }, id);
    const docR = await openDoc(page, id);
    const negR = await openNego(page, id);
    /* WHATEVER THIS PAGE DRAWS A CLAUSE HEADING AS. A first writing asked both
       pages for an `h2` and reported the negotiate page as `null` — which is
       the product working: that page rebuilds every clause heading as
       `h4.rl-clause-h`, so a renamed heading can carry its own redline marks.
       Asking each page for its own element is what makes this a comparison
       rather than a description of one page's markup. */
    const tt = `(() => {
      const box = document.querySelector('.redline-page .rl-paper') || document.querySelector('#doc-canvas');
      const h = box && (box.querySelector('.rl-clause-h') || box.querySelector('h2'));
      const cs = h ? getComputedStyle(h) : null;
      return h ? { tag: h.tagName, tt: cs.textTransform, weight: cs.fontWeight,
        /* the letterfit as a PROPORTION of this page's own size: the design
           states it in em, and each page keeps its own scale. */
        fit: Math.round((parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize)) * 1000) / 1000,
        size: parseFloat(cs.fontSize) } : null;
    })()`;
    await page.evaluate(i => openWorkspace(i), id);
    await page.waitForTimeout(900);
    await page.evaluate(() => roomGoTab(getContract(state.activeId), 'docs'));
    await page.waitForTimeout(1100);
    const ttDoc = await page.evaluate(tt);
    await openNego(page, id);
    const ttNeg = await page.evaluate(tt);
    check('4a each page drew its own clause heading for a stored body',
      !!ttDoc && !!ttNeg, `doc ${JSON.stringify(ttDoc)} · nego ${JSON.stringify(ttNeg)}`);
    check('4b the design’s heading treatment reaches BOTH pages',
      !!ttDoc && ttDoc.tt === 'uppercase' && !!ttNeg && ttNeg.tt === 'uppercase',
      `doc ${ttDoc && ttDoc.tt} · nego ${ttNeg && ttNeg.tt}`);
    /* THE LETTERFIT IS THE SAME PROPORTION, NOT THE SAME NUMBER OF PIXELS, and
       that is the design working as written: it states .08em, and each page
       keeps its own heading SIZE — which this job deliberately did not move,
       because the negotiate page's scale is one the owner tuned. A check on
       the pixel value would be asserting that the sizes travel too, which was
       never promised and is not wanted. */
    check('4c and its letterfit, as a proportion of each page’s own size',
      !!ttDoc && !!ttNeg && ttDoc.fit === ttNeg.fit,
      `doc ${ttDoc && ttDoc.fit}em @${ttDoc && ttDoc.size}px · nego ${ttNeg && ttNeg.fit}em @${ttNeg && ttNeg.size}px`);
    /* SAID OUT LOUD: the two pages agree on the TREATMENT and draw it on
       different tags, which is this page's own decision and not the design's. */
    check('4e — and they do it on their own heading elements',
      !!ttDoc && !!ttNeg && ttDoc.tag !== ttNeg.tag, `doc ${ttDoc && ttDoc.tag} · nego ${ttNeg && ttNeg.tag}`);
    check('4d the wording is set in the design’s face on both',
      !!docR.body && docR.body === negR.body && !/Plex/.test(negR.body),
      `doc "${docR.body}" · nego "${negR.body}"`);

    check('5a no page error was raised throughout', errors.length === 0,
      errors.length ? errors.join(' | ') : 'none');
  } catch (e) {
    check('the run completed', false, (e && e.message) || String(e));
  } finally {
    await b.close(); await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(r => console.log(' - ' + r.name + ' — ' + r.detail)); process.exit(1); }
  console.log('all checks passed');
})();
