/* Chromium verification of document STRUCTURES.
   ============================================================
   THIS FILE EXISTS BECAUSE THE NODE TESTS CANNOT SEE WHAT IT MEASURES.

   f130 proves the contract of the structure layer: the ids are stable, the
   body string is returned untouched by every CSS structure, Contents First
   only prepends. All of that is true with the stylesheet deleted. Four of the
   five structures ARE the stylesheet — "the body sets in two columns" is a
   claim about a cascade and a layout engine, and jsdom has neither. A test
   that cannot see two columns cannot prove there are two.

   So every number below comes from getBoundingClientRect or getComputedStyle,
   on the product's own CSS, lifted out of the product's own index.html at load
   time (test/chromium/structure.html) rather than restated in the harness.

   WHAT IS MEASURED, and why each one:
     1  Standard Flow emits no attribute and lays out identically to no
        structure at all — the promise that a document without a structure is
        untouched by this feature
     2  Two Columns actually produces two columns, and the body gets NARROWER
        rather than merely being told to be
     3  Margin Numbers actually hangs the headings LEFT of the body text
     4  Ruled Clauses actually paints a rule above each clause
     5  Contents First puts a contents page in front, and it lists the clauses
     6  every clause id survives every structure, exactly once, in order —
        the negotiation record's anchors are not disturbed
     7  the body markup is byte-identical under every CSS structure
     8  each structure holds up under every design it is allowed to pair with,
        because a structure is chosen alongside a style, not instead of one

   Screenshots go to test/chromium/shots/structure/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'structure');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

function serve(){
  return new Promise(res => {
    const srv = http.createServer((req, rep) => {
      const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
      const file = path.join(ROOT, rel || 'index.html');
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()){
        rep.writeHead(404); rep.end('not found'); return;
      }
      rep.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(rep);
    });
    srv.listen(0, '127.0.0.1', () => res(srv));
  });
}

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

/* Read off the mounted document. Every value is the browser's own answer. */
const MEASURE = () => {
  const surface = document.querySelector('.doc-surface');
  const cs = getComputedStyle(surface);
  const heads = Array.from(surface.querySelectorAll('h2'));
  const paras = Array.from(surface.querySelectorAll('p'));
  const box = el => { const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), w: Math.round(r.width) }; };
  const firstP = paras.find(p => !p.closest('[data-doc-contents]'));
  return {
    columnCount: cs.columnCount,
    surfaceW: Math.round(surface.getBoundingClientRect().width),
    /* the widest line of running text — under two columns this must fall to
       roughly half, which is what "two columns" MEANS on the page */
    textW: firstP ? Math.round(firstP.getBoundingClientRect().width) : null,
    headLeft: heads.length ? box(heads[0]).left : null,
    bodyLeft: firstP ? box(firstP).left : null,
    headBorderTop: heads.length ? parseFloat(getComputedStyle(heads[0]).borderTopWidth) : null,
    hasContents: !!surface.querySelector('[data-doc-contents]'),
    contentsFirst: surface.firstElementChild ? surface.firstElementChild.hasAttribute('data-doc-contents') : false,
    contentsLinks: Array.from(surface.querySelectorAll('[data-doc-contents] li')).map(li => li.textContent.trim()),
    /* clause identity, read back off the live DOM in document order */
    clauseIds: Array.from(surface.querySelectorAll('[data-clause-id]')).map(el => el.getAttribute('data-clause-id')),
    clauseText: heads.map(h => h.textContent.trim()),
    bodyHtml: surface.innerHTML,
  };
};

const STRUCTURES = ['standard-flow', 'margin-numbers', 'two-column', 'ruled-clauses', 'contents-first'];
const IDS = ['cl_0001', 'cl_0002', 'cl_0003', 'cl_0004', 'cl_0005', 'cl_0006', 'cl_0007'];

async function main(){
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/structure.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 }, deviceScaleFactor: 2 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(PAGE, { waitUntil: 'load' });
  await page.waitForFunction(() => window.READY === true, { timeout: 15000 });

  const shot = async name => page.screenshot({ path: path.join(OUT, name + '.png') });
  const mount = async (design, structure) => {
    await page.evaluate(([d, s]) => window.MOUNT(d, s), [design, structure]);
    return page.evaluate(MEASURE);
  };

  /* ---- the baseline: no structure at all ---- */
  const bare = await mount('modern-minimal', null);
  const flow = await mount('modern-minimal', 'standard-flow');
  check('1 · Standard Flow emits no attribute',
    (await page.evaluate(() => document.querySelector('.paper').hasAttribute('data-doc-structure'))) === false);
  check('1 · Standard Flow lays out identically to no structure at all',
    flow.textW === bare.textW && flow.headLeft === bare.headLeft && flow.bodyHtml === bare.bodyHtml,
    `text ${bare.textW}px → ${flow.textW}px`);
  await shot('standard-flow');

  /* ---- 2 · two columns are really two columns ---- */
  const two = await mount('modern-minimal', 'two-column');
  const narrowed = two.textW !== null && flow.textW !== null && two.textW < flow.textW * 0.62;
  check('2 · Two Columns computes column-count:2', two.columnCount === '2', `column-count=${two.columnCount}`);
  check('2 · Two Columns actually narrows the measure', narrowed,
    `line ${flow.textW}px → ${two.textW}px of a ${two.surfaceW}px page`);
  await shot('two-column');

  /* ---- 3 · margin numbers really hang ---- */
  const margin = await mount('modern-minimal', 'margin-numbers');
  check('3 · Margin Numbers hangs the heading left of the body text',
    margin.headLeft !== null && margin.bodyLeft !== null && margin.headLeft < margin.bodyLeft - 8,
    `heading at ${margin.headLeft}px, body at ${margin.bodyLeft}px`);
  /* The defect this catches: the heading used to be pulled left twice and its
     first line landed outside the sheet, so the words ran off the paper. */
  const inside = await page.evaluate(() => {
    /* The TEXT, not the element box. The defect was a text-indent, and
       text-indent moves the first line inside a box it does not move — so an
       element-box measurement reads clean while the words sit outside the
       page. A Range gives the position of the glyphs themselves. */
    const paper = document.querySelector('.paper').getBoundingClientRect();
    const heads = Array.from(document.querySelectorAll('.doc-surface h1,.doc-surface h2'));
    const escaped = [];
    for (const h of heads) {
      const node = [...h.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
      if (!node) continue;
      const r = document.createRange(); r.selectNodeContents(node);
      const first = r.getClientRects()[0];
      if (first && first.left < paper.left - 0.5)
        escaped.push(h.textContent.trim().slice(0, 26) + ' @' + Math.round(first.left - paper.left) + 'px');
    }
    return { paperLeft: Math.round(paper.left), escaped };
  });
  check('3 · and no heading escapes the sheet', inside.escaped.length === 0,
    inside.escaped.length ? 'outside the paper: ' + inside.escaped.join(' | ') : 'every heading inside the page');
  /* THE DEFECT THAT WAS REPORTED. A clause heading is longer than a number
     column is wide, so it must cross the rule — the question is whether it
     crosses over or under. Struck through "Orders and Deliveries", it reads as
     a mistake. The heading has to paint the paper's own colour to break the
     rule behind it, so that is what is measured. */
  const strike = await page.evaluate(() => {
    const h = document.querySelector('.doc-surface h2');
    const cs = getComputedStyle(h);
    const paper = getComputedStyle(document.querySelector('.paper')).backgroundColor;
    const transparent = c => c === 'transparent' || /rgba\(0, 0, 0, 0\)/.test(c);
    return { bg: cs.backgroundColor, z: cs.zIndex, opaque: !transparent(cs.backgroundColor),
      matchesPaper: cs.backgroundColor === paper };
  });
  check('3 · and the rule breaks behind the heading rather than striking through it',
    strike.opaque && strike.z !== 'auto',
    `heading background ${strike.bg} (paper ${strike.matchesPaper ? 'matched' : 'DIFFERENT'}), z-index ${strike.z}`);
  await shot('margin-numbers');

  /* ---- 4 · ruled clauses really paint a rule ---- */
  const ruled = await mount('modern-minimal', 'ruled-clauses');
  check('4 · Ruled Clauses paints a rule above the clause',
    ruled.headBorderTop > 0 && !(flow.headBorderTop > 0),
    `border-top ${flow.headBorderTop}px → ${ruled.headBorderTop}px`);
  await shot('ruled-clauses');

  /* ---- 5 · contents first ---- */
  const contents = await mount('modern-minimal', 'contents-first');
  check('5 · Contents First puts a contents page first', contents.hasContents && contents.contentsFirst);
  check('5 · the contents page lists every clause, and not the title',
    contents.contentsLinks.length === 7
      && contents.contentsLinks[0].startsWith('1.')
      && !contents.contentsLinks.some(t => /Distribution Agreement/.test(t)),
    `${contents.contentsLinks.length} entries`);
  await shot('contents-first');

  /* ---- 6 & 7 · clause identity and body bytes, across every structure ---- */
  let idsOk = true, bytesOk = true, textOk = true;
  const detail = [];
  for (const s of STRUCTURES){
    const m = await mount('modern-minimal', s);
    const sameIds = JSON.stringify(m.clauseIds) === JSON.stringify(IDS);
    const sameText = JSON.stringify(m.clauseText) === JSON.stringify(flow.clauseText);
    if (!sameIds) { idsOk = false; detail.push(`${s} ids=${m.clauseIds.join(',')}`); }
    if (!sameText) { textOk = false; detail.push(`${s} headings changed`); }
    if (s !== 'contents-first' && m.bodyHtml !== flow.bodyHtml) { bytesOk = false; detail.push(`${s} markup differs`); }
  }
  check('6 · every clause id survives every structure, once each, in order', idsOk, detail.join(' | ') || `${IDS.length} ids`);
  check('6 · no structure alters a single clause heading', textOk);
  check('7 · every CSS structure leaves the markup byte-identical', bytesOk,
    'only Contents First emits anything, and only in front');

  /* ---- 8 · every allowed pairing holds up ---- */
  const designs = await page.evaluate(() => DOC_DESIGNS.map(d => d.id));
  let pairOk = true; const pairFail = [];
  for (const d of designs) for (const s of STRUCTURES){
    const blocked = await page.evaluate(([a, b]) => !!structureBlockedReason(a, b), [d, s]);
    if (blocked) continue;
    const m = await mount(d, s);
    const ok = JSON.stringify(m.clauseIds) === JSON.stringify(IDS)
      && m.surfaceW > 200
      && (s !== 'two-column' || m.columnCount === '2')
      && (s !== 'contents-first' || m.hasContents);
    if (!ok) { pairOk = false; pairFail.push(`${d}×${s}`); }
  }
  check('8 · every allowed design × structure pairing renders intact', pairOk, pairFail.join(', ') || 'all pairings');

  /* ---- 9 · print-honest: the structures must survive onto paper ----
     DESIGN-contract-designer.md makes print-honesty a condition of the
     feature, and a structure is worth nothing if the filed PDF ignores it.
     Measured under emulated print media, on the product's own print sheet. */
  await page.emulateMedia({ media: 'print' });
  const printed = {};
  for (const s of STRUCTURES){
    await page.evaluate(([d, x]) => window.MOUNT_PRINT(d, x), ['modern-minimal', s]);
    printed[s] = await page.evaluate(() => window.MEASURE_PRINT());
  }
  await page.screenshot({ path: path.join(OUT, 'print-two-column.png') });
  await page.emulateMedia({ media: 'screen' });

  check('9 · the print sheet still shows the document', STRUCTURES.every(s => printed[s] && printed[s].visible));
  check('9 · Two Columns survives onto paper', printed['two-column'].columnCount === '2',
    `column-count=${printed['two-column'].columnCount} in print`);
  check('9 · Margin Numbers survives onto paper',
    printed['margin-numbers'].headLeft < printed['margin-numbers'].bodyLeft - 8,
    `heading ${printed['margin-numbers'].headLeft}px vs body ${printed['margin-numbers'].bodyLeft}px`);
  check('9 · Ruled Clauses survives onto paper', printed['ruled-clauses'].headBorderTop > 0,
    `border-top ${printed['ruled-clauses'].headBorderTop}px in print`);
  check('9 · Contents First survives onto paper', printed['contents-first'].hasContents === true);
  check('9 · Standard Flow stays plain on paper',
    printed['standard-flow'].columnCount === 'auto' && !(printed['standard-flow'].headBorderTop > 0));

  check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  await browser.close();
  srv.close();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed · shots in ${path.relative(ROOT, OUT)}`);
  if (failed.length){ console.error('FAILED: ' + failed.map(f => f.name).join('; ')); process.exit(1); }
}

main().catch(e => { console.error(e); process.exit(1); });
