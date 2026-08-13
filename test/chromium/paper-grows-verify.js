/* Chromium verification: the contract grows on the negotiation and the
   counterparty pages.
   ============================================================
   Owner-asked, 13 Aug 2026: "widening the negotiation and counterparty pages
   must make the WORDING bigger, not the margin — the thing the Document tab
   already does."

   THE FAULT, and it is a measurement rather than an opinion. The redline paper
   was capped at a flat 720px and centred, so on a 1920px window with the
   divider dragged right the contract column was around 1180px and roughly 450
   of those were empty gutter. Dragging bought margin. The Document tab does
   not have this problem because it scales a fixed sheet to fill its column.

   TWO ATTEMPTS, AND THE FIRST ONE IS RECORDED BECAUSE IT WAS WRONG IN AN
   INSTRUCTIVE WAY. It let the SHEET grow toward the column with a ceiling tied
   to the type — more words per line, same size words — on the argument that a
   zoom layer is dangerous on a page full of interactive geometry. The owner
   read it on the real page and reported the feature still missing, and they
   were right: on the Document tab the contract visibly GROWS AND SHRINKS as
   the divider moves. More words per line is a different thing from bigger
   words.

   SO THE DOCUMENT TAB'S OWN MECHANISM IS USED HERE — a fixed 660px page inside
   a CSS-zoom wrapper fitted to the column, multiplied by the stepper's stored
   preference. The fear in the first attempt was of zooming the GRID, and it
   was a good fear: the resizer measures the grid's width, the card pop-out is
   placed from its card in the other column, and the queue overlay and its rail
   hang off the grid as absolute children. The wrapper goes INSIDE the document
   pane, so not one of those is in the zoom. The one reader that IS inside it
   — the selection menu, placed from a range rectangle in the paper — is
   measured below rather than assumed.

   WHY THIS FILE EXISTS. Every claim here is a width, a gutter or a cursor
   position. jsdom resolves no cascade and has no layout engine, so none of it
   can be asserted anywhere else. The rule-level claims live in f89.

   WHAT IS MEASURED:
     1  the sheet FILLS its column on both mounts, at four widths
     2  the WORDING itself grows and shrinks as the divider moves — the thing
        that was reported missing, measured on the rendered text
     3  the 2x ceiling is the Document tab's own and still holds
     4  the stepper is in the negotiation control row and works
     5  ONE preference, applied ONCE: the type is pinned inside the sheet so a
        single step cannot double the text
     6  the geometry that could have been broken is not: the resizer tracks the
        cursor one-to-one, the queue rail sits on the page's own border, the
        card pop-out lands beside its card, and a range rectangle inside the
        zoomed paper still reports where the words actually are
     7  the phone still gets the paper at full width, unzoomed

   TWO MOUNTS, NOT THREE. The work order named the owner's bench, "the contract
   tab's embed" and the counterparty's page. The contract tab's embed no longer
   exists — Negotiate left the room's tab row on 12 Aug 2026 and is its own
   page — so redlinePanesHtml has exactly two callers today. Both are measured
   below. Said out loud rather than quietly checking two and reporting three.

   Screenshots go to test/chromium/shots/paper/. */
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const { chromium } = require('playwright-core');

const OUT = path.join(__dirname, 'shots', 'paper');
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
const pause = ms => new Promise(r => setTimeout(r, ms));

/* The sheet, its column, and — the measurement this file exists for — how big
   the WORDING actually is on screen.

   `lineH` is the rendered height of a real line of the contract, read from its
   own rectangle. It is the honest measure of "the wording got bigger", and it
   is deliberately NOT the computed font-size: inside a zoom layer the font-size
   property still reads 15px while the text on screen is half as big again, so a
   check reading the property would pass while the reader saw nothing change.
   That is exactly the mistake the first attempt at this feature made. */
const SHEET = () => {
  const paper = document.querySelector('.redline-page .rl-paper');
  const col = document.querySelector('.redline-page #rl-doc')
    || (paper && paper.closest('.nego-scroll,.nego-pane'));
  if (!paper || !col) return null;
  const p = paper.getBoundingClientRect(), c = col.getBoundingClientRect();
  const line = paper.querySelector('.rl-clause-p, .rl-line, .nego-body, p');
  const wrap = paper.closest('.rl-zoom');
  return { paper: Math.round(p.width), col: Math.round(c.width),
    gutterL: Math.round(p.left - c.left), gutterR: Math.round(c.right - p.right),
    zoom: wrap ? Number(getComputedStyle(wrap).zoom) || 1 : null,
    lineH: line ? Math.round(line.getBoundingClientRect().height) : null,
    words: line ? Math.round(line.getBoundingClientRect().width) : null };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve();
  const PAGE = `http://127.0.0.1:${srv.address().port}/test/chromium/parity.html`;
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 940 }, deviceScaleFactor: 2 });
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(PAGE, { waitUntil: 'load' });
    await page.evaluate(() => window.READY);
    await pause(400);

    /* ---- 1 & 2. FOUR WIDTHS, BOTH MOUNTS ---- */
    for (const w of [1280, 1366, 1920, 2560]){
      await page.setViewportSize({ width: w, height: 940 });
      await pause(350);
      await page.evaluate(() => window.SHOW_OWNER());
      await pause(450);
      const own = await page.evaluate(SHEET);
      check(`${w} · owner: the sheet is measured at all`, !!own, own && `${own.paper} of ${own.col}`);
      if (own){
        /* FILLS IT, OR HAS REACHED THE CEILING. The 2x cap is the Document
           tab's own and it bites on a very wide column — that is the ceiling
           working, not the fault coming back, and section 3 measures it
           separately. */
        check(`${w} · owner: THE SHEET FILLS ITS COLUMN (or has hit the 2x cap)`,
          own.paper >= own.col - 12 || own.zoom >= 1.999,
          `${own.paper} of ${own.col}, zoom ${own.zoom}`);
        check(`${w} · owner: it is scaled, not merely widened`,
          own.zoom > 1, `zoom ${own.zoom}`);
        check(`${w} · owner: still centred — any spare width splits evenly`,
          Math.abs(own.gutterL - own.gutterR) <= 2, `${own.gutterL} / ${own.gutterR}`);
      }
      await page.evaluate(() => window.SHOW_COUNTERPARTY());
      await pause(500);
      const cp = await page.evaluate(SHEET);
      check(`${w} · counterparty: ONE FIX REACHES BOTH MOUNTS`,
        !!cp && cp.zoom > 1 && (cp.paper >= cp.col - 12 || cp.zoom >= 1.999),
        cp ? `${cp.paper} of ${cp.col}, zoom ${cp.zoom}` : 'no sheet');
    }
    await page.setViewportSize({ width: 1920, height: 940 });
    await pause(300);
    await page.evaluate(() => window.SHOW_OWNER());
    await pause(500);
    await page.screenshot({ path: path.join(OUT, '01-owner-1920.png') });

    /* ---- 3. DRAGGING SPENDS THE WIDTH ON WORDING, NOT ON GUTTER ----
       The reported fault, measured directly: widen the split and read whether
       the words got more room or the air did.

       MEASURED AT 1366, DELIBERATELY, and the reason is the design rather than
       the convenience. At 1920 the sheet is already sitting ON its ceiling
       with the default type, so dragging further can only add gutter — that is
       the ceiling working, not the fault coming back, and the reader's answer
       there is the stepper, which raises the ceiling with the type (proved in
       section 5). A ThinkPad-class window is where the column is still the
       binding constraint, which is exactly where the old flat 720 was spending
       the width on air. */
    await page.setViewportSize({ width: 1366, height: 940 });
    await pause(300);
    await page.evaluate(() => { localStorage.setItem('hati.v1.rlLeftFrac', '0.50');
      window.renderRedline(); });
    await pause(500);
    const before = await page.evaluate(SHEET);
    const dragged = await page.evaluate(async () => {
      const grid = document.querySelector('.redline-page .rl-grid');
      const rez = grid && grid.querySelector('#rl-resizer');
      if (!rez) return null;
      /* Through the product's own store and layout pass — the same route the
         drag takes when it lands, so this is not a second geometry. */
      localStorage.setItem('hati.v1.rlLeftFrac', '0.80');
      window.rlLayoutResizer(document);
      await new Promise(r => setTimeout(r, 250));
      return true;
    });
    await pause(350);
    const after = await page.evaluate(SHEET);
    check('dragging the divider was possible at all', !!dragged && !!after);
    if (before && after){
      check('THE COLUMN GREW', after.col > before.col, `${before.col} → ${after.col}`);
      /* THE REPORTED FAULT, MEASURED ON THE RENDERED TEXT. The first attempt
         at this passed a width check while the reader saw no change, because
         widening a sheet is not the same as enlarging its wording. This reads
         the height of a real line of the contract off its own rectangle. */
      check('AND THE WORDING ITSELF GOT BIGGER — not just wider, bigger',
        after.lineH > before.lineH && after.zoom > before.zoom,
        `line ${before.lineH}px → ${after.lineH}px, zoom ${before.zoom} → ${after.zoom}`);
      check('and the margin did not grow instead',
        (after.gutterL - before.gutterL) < 6,
        `gutter ${before.gutterL} → ${after.gutterL}`);
    }
    /* AND IT SHRINKS AGAIN COMING BACK. "grows and shrinks as you slide the
       divider back and forth" is the whole report; a one-way check would pass
       on a layout that never recovered. */
    await page.evaluate(() => { localStorage.setItem('hati.v1.rlLeftFrac', '0.45');
      window.rlLayoutResizer(document); });
    await pause(350);
    const back = await page.evaluate(SHEET);
    check('AND IT SHRINKS AGAIN WHEN THE DIVIDER COMES BACK',
      back && after && back.lineH < after.lineH && back.zoom < after.zoom,
      back && `line ${after.lineH}px → ${back.lineH}px, zoom ${after.zoom} → ${back.zoom}`);
    await page.screenshot({ path: path.join(OUT, '02-owner-dragged.png') });

    /* AND AT A WIDTH WHERE THE CEILING IS THE BINDING CONSTRAINT, the honest
       claim is the other one: the sheet stops growing, deliberately, because a
       line of contract text running the full width of a large monitor is
       unreadable for its own reason. Asserted rather than left implicit — a
       ceiling nobody tests is a ceiling somebody removes. */
    await page.setViewportSize({ width: 2560, height: 940 });
    await pause(300);
    await page.evaluate(() => { localStorage.setItem('hati.v1.rlLeftFrac', '0.80');
      window.renderRedline(); });
    await pause(500);
    const wide = await page.evaluate(SHEET);
    check('THE CEILING HOLDS on a large monitor — the Document tab\'s own 2x',
      wide && wide.zoom <= 2.001 && wide.paper < wide.col,
      wide && `${wide.paper} of ${wide.col}, zoom ${wide.zoom}`);
    await page.setViewportSize({ width: 1920, height: 940 });
    await pause(300);
    await page.evaluate(() => { localStorage.setItem('hati.v1.rlLeftFrac', String(2 / 3));
      window.renderRedline(); });
    await pause(500);

    /* ---- 4 & 5. THE STEPPER THIS PAGE NEVER HAD ---- */
    const step = await page.evaluate(() => {
      const row = document.querySelector('.redline-page .rl-tabrow');
      const st = row && row.querySelector('.rl-type-step');
      if (!st) return { there: false };
      const r = st.getBoundingClientRect();
      return { there: true, visible: r.width > 0 && r.height > 0,
        inRow: !!row.contains(st),
        readout: (st.querySelector('.rl-type-out') || {}).textContent,
        buttons: [...st.querySelectorAll('[data-rl-type]')].map(b => b.textContent.trim()) };
    });
    check('4 THE STEPPER IS IN THE NEGOTIATION CONTROL ROW',
      step.there && step.inRow && step.visible, JSON.stringify(step));
    check('4 with both buttons and its readout', step.buttons && step.buttons.length === 2,
      (step.buttons || []).join(' '));

    const stepped = await page.evaluate(async () => {
      const up = document.querySelector('.redline-page .rl-tabrow .rl-type-step [data-rl-type="1"]');
      const before = parseFloat(getComputedStyle(
        document.querySelector('.redline-page')).getPropertyValue('--rl-doc-type'));
      const lineOf = () => { const l = document.querySelector(
        '.redline-page .rl-paper .rl-clause-p, .redline-page .rl-paper .rl-line, .redline-page .rl-paper p');
        return l ? l.getBoundingClientRect().height : 0; };
      /* THE SHEET'S OWN TYPE, from inside the zoom wrapper. It MUST move with
         the stepper and the zoom must NOT — see the reversal below. Read from
         a clause line, because that is what the reader is being offered a
         choice about. */
      const typeIn = () => { const l = document.querySelector('.redline-page .rl-paper .rl-clause-p')
        || document.querySelector('.redline-page .rl-paper p');
        return l ? parseFloat(getComputedStyle(l).fontSize) : 0; };
      const zoomOf = () => Number(getComputedStyle(
        document.querySelector('.redline-page .rl-zoom')).zoom) || 1;
      /* AND THE PAGE'S OWN WIDTH ON SCREEN, which is the half of this the
         owner reported: whatever the type is set to, the sheet still fills its
         column. */
      const sheetW = () => { const el = document.querySelector('.redline-page .rl-paper');
        const col = document.querySelector('.redline-page #rl-doc') || el.parentElement;
        return [Math.round(el.getBoundingClientRect().width),
          Math.round(col.getBoundingClientRect().width)]; };
      const wBefore = sheetW();
      const lineBefore = lineOf(), typeBefore = typeIn(), zoomBefore = zoomOf();
      for (let i = 0; i < 5; i++){ if (!up.disabled) up.click(); }
      await new Promise(r => setTimeout(r, 250));
      return { before,
        after: parseFloat(getComputedStyle(
          document.querySelector('.redline-page')).getPropertyValue('--rl-doc-type')),
        stored: Number(localStorage.getItem('hati.v1.rlDocType')),
        readout: (document.querySelector('.redline-page .rl-type-out') || {}).textContent,
        lineBefore: Math.round(lineBefore), lineAfter: Math.round(lineOf()),
        typeBefore, typeAfter: typeIn(),
        wBefore, wAfter: sheetW(),
        /* The front matter has to follow the body, or the sheet is two
           documents. It used to follow the zoom; it follows the ratio now. */
        titleBefore: parseFloat(getComputedStyle(
          document.querySelector('.redline-page .rl-paper-title') || document.body).fontSize),
        zoomRatio: Math.round((zoomOf() / (zoomBefore || 1)) * 100) / 100 };
    });
    check('4 pressing A⁺ makes the contract text bigger ON SCREEN',
      stepped.after > stepped.before && stepped.lineAfter > stepped.lineBefore,
      `${stepped.before} → ${stepped.after}, line ${stepped.lineBefore}px → ${stepped.lineAfter}px`);
    check('5 ONE PREFERENCE — it writes the key the other screens read',
      stepped.stored === stepped.after, `stored ${stepped.stored}`);
    check('5 and the readout says the same number, in its own words',
      String(stepped.readout).trim() === stepped.after + 'px', stepped.readout);
    /* ---- APPLIED ONCE, AND ON THE OTHER SIDE OF THE MULTIPLICATION ----
       BOTH CLAIMS HERE ARE REVERSED, 13 Aug 2026, owner-asked, and the rule
       they were protecting is unchanged: the reader's preference may be
       carried by ONE mechanism, never two, or a single step doubles the text.

       It used to be the zoom, with the sheet's own type pinned to the base
       inside the wrapper. That is interchangeable with this for the TEXT — on
       screen it is fit × preference either way — and not for the PAGE. With
       the preference in the zoom, asking for the new floor of 8 shrank the
       sheet to half its column and left it floating in white space. "Lower it
       to 8 but keep the page filling the column."

       So now: the zoom does NOT move with the stepper, the sheet's own type
       DOES, and the page still fills its column at every setting — which is
       the third check, and the one the owner would look at. */
    check('5 THE ZOOM DOES NOT MOVE WITH THE STEPPER — it is the width-fit alone',
      stepped.zoomRatio > 0.99 && stepped.zoomRatio < 1.01,
      `15→20 scaled the zoom by ${stepped.zoomRatio}x (expected 1)`);
    check('5 THE SHEET\'S OWN TYPE CARRIES THE STEP, and by exactly the step',
      stepped.typeBefore > 0
      && stepped.typeAfter / stepped.typeBefore > 1.28
      && stepped.typeAfter / stepped.typeBefore < 1.39,
      `${stepped.typeBefore}px → ${stepped.typeAfter}px inside the sheet`);
    check('5 AND THE PAGE STILL FILLS ITS COLUMN — the reported half',
      stepped.wAfter[0] >= stepped.wAfter[1] - 12
      && stepped.wAfter[0] === stepped.wBefore[0],
      `${stepped.wBefore[0]} of ${stepped.wBefore[1]} → ${stepped.wAfter[0]} of ${stepped.wAfter[1]}`);
    check('5 and the front matter followed the body, so the sheet is one document',
      stepped.titleBefore > 20, `title ${stepped.titleBefore}px at 20`);
    /* ---- 5b. AND THE FLOOR IS 8 (owner-asked, 13 Aug 2026) ----
       "The fonts should be able to go low all the way to 8. Currently the
       smallest font is 11." Driven through the CONTROL rather than the store,
       because the thing being checked is that the reader can actually get
       there: A⁻ must keep working past 11 and stop at 8. */
    const floored = await page.evaluate(async () => {
      const down = document.querySelector('.redline-page .rl-tabrow .rl-type-step [data-rl-type="-1"]');
      const paper = () => document.querySelector('.redline-page .rl-paper');
      const col = () => document.querySelector('.redline-page #rl-doc') || paper().parentElement;
      const typeIn = () => { const l = document.querySelector('.redline-page .rl-paper .rl-clause-p')
        || document.querySelector('.redline-page .rl-paper p');
        return l ? parseFloat(getComputedStyle(l).fontSize) : 0; };
      const at15 = typeIn();
      /* Far more presses than the range needs — the bound is the button's job,
         not the loop's. */
      for (let i = 0; i < 30; i++){ if (!down.disabled) down.click(); }
      await new Promise(r => setTimeout(r, 300));
      return { stored: Number(localStorage.getItem('hati.v1.rlDocType')),
        readout: (document.querySelector('.redline-page .rl-type-out') || {}).textContent,
        disabled: !!down.disabled, at15, at8: typeIn(),
        sheet: Math.round(paper().getBoundingClientRect().width),
        col: Math.round(col().getBoundingClientRect().width),
        zoom: Number(getComputedStyle(document.querySelector('.redline-page .rl-zoom')).zoom) || 1,
        overflow: document.querySelector('.redline-page #rl-doc, .redline-page .nego-scroll')
          ? false : false };
    });
    check('5b A⁻ goes all the way down to 8 and stops there',
      floored.stored === 8 && String(floored.readout).trim() === '8px' && floored.disabled,
      `stored ${floored.stored}, readout ${floored.readout}, button disabled ${floored.disabled}`);
    check('5b the wording really is smaller at 8 than at 15',
      floored.at8 > 0 && floored.at8 < floored.at15 * 0.62,
      `${floored.at15}px → ${floored.at8}px`);
    check('5b AND THE PAGE STILL FILLS THE COLUMN — the whole point of the ask',
      floored.sheet >= floored.col - 12,
      `${floored.sheet} of ${floored.col}, zoom ${floored.zoom}`);
    await page.screenshot({ path: path.join(OUT, '04-owner-floor-8.png') });

    /* ---- 5c. AND THE FURNITURE ON THE SHEET FOLLOWS THE WORDS ----
       Owner-reported, 13 Aug 2026, on both seats: "the clause number pill, the
       copilot and edit direct pills do not proportionally shrink and expand
       with the page."

       This is the second half of 5's own lesson and it was missed for the same
       reason it was needed: the FIT still carried these (drag the divider and
       they grow), so nothing looked wrong until the stepper moved. Measured
       before the fix: the tag rendered at an identical 178.6 x 35.6 at 8px,
       15px AND 20px while the contract's own words went from 38.6px tall to
       241.3px — at the floor of 8 the label on a clause was bigger than the
       clause.

       RENDERED size, not the CSS number: the zoom and the type land in the same
       space and only the rendered box says what the reader actually sees.
       Driven through rlSetDocType because that is the stepper's own funnel,
       already proved in 5 to be what the buttons press. */
    const FURNITURE = `(() => {
      const box = sel => { const el = document.querySelector(sel); if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
      const words = document.querySelector('.redline-page .rl-paper .rl-clause p')
        || document.querySelector('.redline-page .rl-paper p');
      return { words: words ? +parseFloat(getComputedStyle(words).fontSize).toFixed(2) : 0,
        tag: box('.redline-page .rl-asktag'), tool: box('.redline-page .rl-tool') };
    })()`;
    const furnitureAt = async v => {
      await page.evaluate(t => window.rlSetDocType(t), v);
      await pause(350);
      return page.evaluate(FURNITURE);
    };
    const f8 = await furnitureAt(8), f15 = await furnitureAt(15), f20 = await furnitureAt(20);
    check('5c the sheet carries a clause tag and a clause tool to measure',
      !!(f15.tag && f15.tool), f15.tag ? `tag ${f15.tag.w}x${f15.tag.h}, tool ${f15.tool ? f15.tool.w : '—'}` : 'no tag on the sheet');
    if (f15.tag && f15.tool){
      /* The reported symptom, stated as the thing that must no longer be true:
         three different settings, three identical boxes. */
      check('5c THE CLAUSE TAG IS NO LONGER THE SAME SIZE AT EVERY SETTING',
        !(f8.tag.w === f15.tag.w && f15.tag.w === f20.tag.w),
        `8: ${f8.tag.w}x${f8.tag.h} · 15: ${f15.tag.w}x${f15.tag.h} · 20: ${f20.tag.w}x${f20.tag.h}`);
      check('5c AND IT MOVES THE WAY THE WORDS MOVE — smaller at 8, bigger at 20',
        f8.tag.w < f15.tag.w && f20.tag.w > f15.tag.w,
        `${f8.tag.w} < ${f15.tag.w} < ${f20.tag.w}`);
      /* PROPORTIONALLY is the word the report used, so it is the word measured:
         the tag against the body text it sits beside, at both ends of the
         range, within a small tolerance for borders and rounding. */
      const ratio = f => f.tag.h / f.words;
      check('5c and it stays in PROPORTION to the wording, which is what was asked',
        Math.abs(ratio(f8) - ratio(f15)) < 0.25 && Math.abs(ratio(f20) - ratio(f15)) < 0.25,
        `tag height ÷ body size — 8: ${ratio(f8).toFixed(2)} · 15: ${ratio(f15).toFixed(2)} · 20: ${ratio(f20).toFixed(2)}`);
      check('5c THE COPILOT / DIRECT EDIT PILLS FOLLOW TOO — reported in the same breath',
        f8.tool.w < f15.tool.w && f20.tool.w > f15.tool.w,
        `8: ${f8.tool.w} · 15: ${f15.tool.w} · 20: ${f20.tool.w}`);
    }
    await page.evaluate(() => window.rlSetDocType(20));
    await pause(300);
    await page.screenshot({ path: path.join(OUT, '04b-owner-furniture-20.png') });

    /* AND ON THEIR SIDE OF THE GLASS. The report named both seats, and the
       counterparty's page is a different MOUNT (redlineEmbed) with its own
       root — a root that has to be carrying --doc-scale for any of this to
       reach it. One rule, two mounts, exactly as section 1 proves for the fit. */
    await page.evaluate(() => window.SHOW_COUNTERPARTY());
    await pause(600);
    const cp15 = await furnitureAt(15), cp20 = await furnitureAt(20);
    await page.screenshot({ path: path.join(OUT, '04c-counterparty-furniture-20.png') });
    check('5c · counterparty: their sheet carries the same tag',
      !!(cp15.tag && cp20.tag), cp15.tag ? `${cp15.tag.w}x${cp15.tag.h}` : 'no tag');
    if (cp15.tag && cp20.tag)
      check('5c · counterparty: AND IT SCALES THERE TOO — one rule, both seats',
        cp20.tag.w > cp15.tag.w,
        `15: ${cp15.tag.w}x${cp15.tag.h} → 20: ${cp20.tag.w}x${cp20.tag.h}`);
    await page.evaluate(() => { window.rlSetDocType(15); window.SHOW_OWNER(); });
    await pause(600);

    await page.screenshot({ path: path.join(OUT, '03-owner-stepped.png') });

    /* Put the preference back before the geometry checks, so they measure the
       page a reader arrives on rather than one this file left behind. */
    await page.evaluate(() => { window.rlSetDocType(15);
      localStorage.setItem('hati.v1.rlLeftFrac', String(2 / 3)); window.renderRedline(); });
    await pause(500);

    /* ---- 6. THE GEOMETRY THAT COULD HAVE BEEN BROKEN ----
       This is why option B was refused, so it is the section that has to hold.
       Under A nothing is scaled, so all three of these should be untouched —
       "should be" is the reason to measure them. */
    const rail = await page.evaluate(() => {
      const grid = document.querySelector('.redline-page .rl-grid');
      const tab = grid && grid.querySelector('.rl-q-tab');
      if (!grid || !tab) return null;
      const g = grid.getBoundingClientRect(), t = tab.getBoundingClientRect();
      return { dx: Math.round(t.left - g.left), w: Math.round(t.width) };
    });
    check('6 the queue rail still hangs on the working area\'s own left border',
      !!rail && Math.abs(rail.dx) <= 2, rail && `${rail.dx}px from the grid edge`);

    const pop = await page.evaluate(async () => {
      const btn = document.querySelector('#rl-changes .rl-card [data-rl-pop]');
      if (!btn) return null;
      btn.click();
      await new Promise(r => setTimeout(r, 350));
      const panel = document.querySelector('.rl-pop');
      const card = btn.closest('.rl-card');
      if (!panel || !card) return { open: false };
      const p = panel.getBoundingClientRect(), c = card.getBoundingClientRect();
      return { open: p.width > 0 && p.height > 0,
        leftOfCard: p.right <= c.left + 4,
        onScreen: p.left >= 0 && p.right <= window.innerWidth + 1 };
    });
    check('6 the card pop-out still lands beside its card, on screen',
      pop && pop.open && pop.leftOfCard && pop.onScreen, JSON.stringify(pop));
    await page.evaluate(() => { const p = document.querySelector('.rl-pop');
      if (p) document.body.click(); });
    await pause(200);

    /* THE HANDLE TRACKS THE CURSOR ONE-TO-ONE. The fault this guards is real
       and was reported: a mismatch between the layout's geometry and the drag
       handler's made the handle fall hundreds of pixels behind. Driven with a
       real mouse, not a synthetic event. */
    const HANDLE = () => {
      const rez = document.querySelector('.redline-page #rl-resizer');
      const r = rez.getBoundingClientRect();
      return Math.round(r.left + r.width / 2);
    };
    const track = await page.evaluate(() => {
      const rez = document.querySelector('.redline-page #rl-resizer');
      const r = rez.getBoundingClientRect();
      return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + 60) };
    });
    await page.mouse.move(track.x, track.y);
    await page.mouse.down();
    await page.mouse.move(track.x + 120, track.y, { steps: 12 });
    await pause(150);
    const landed = await page.evaluate(HANDLE);
    await page.mouse.up();
    /* ONE-TO-ONE IS ABOUT THE DELTA, not about a coincidence of coordinates.
       The handle's painted centre and the point the drag reckons from differ
       by a constant few pixels (its own hit area), and always did; the fault
       this guards was a RATIO fault — one pixel of pointer bought less than
       one pixel of column and the handle fell hundreds of pixels behind. So
       the pointer's travel and the handle's travel are compared, which is the
       thing that was wrong and the thing a scaling layer would break.

       THE TOLERANCE IS MEASURED, NOT GUESSED. Driven this way the handle
       travels 128px for 120px of pointer, and it does so on the tree BEFORE
       this change as well as after — checked by running the same drag on both.
       That few-pixel over-travel is the drag's own rounding and is not what
       this check is for. The fault it guards multiplied the ratio, not the
       remainder: the handle fell HUNDREDS of pixels behind. */
    check('6 THE RESIZER STILL TRACKS THE CURSOR ONE-TO-ONE',
      Math.abs((landed - track.x) - 120) <= 10,
      `cursor moved 120, handle moved ${landed - track.x}`);
    await page.screenshot({ path: path.join(OUT, '04-owner-geometry.png') });

    /* ---- 7. THE PHONE ----
       Below 1023px the whole overlay unwinds and the grid is one column. The
       paper already gets the full width there; the new ceiling must not fight
       that. */
    const ph = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    ph.on('pageerror', e => errors.push('phone: ' + e.message));
    await ph.goto(PAGE, { waitUntil: 'load' });
    await ph.evaluate(() => window.READY);
    await pause(600);
    const phone = await ph.evaluate(SHEET);
    check('7 on a phone the sheet still fills its column, UNZOOMED',
      !!phone && phone.gutterL <= 8 && phone.gutterR <= 8 && phone.zoom <= 1.001,
      phone ? `${phone.paper} of ${phone.col}, gutters ${phone.gutterL}/${phone.gutterR}, zoom ${phone.zoom}` : 'no sheet');
    await ph.screenshot({ path: path.join(OUT, '05-phone.png') });
    await ph.close();

    check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');
  } finally {
    await browser.close();
    srv.close();
  }

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length){ console.log('FAILED:'); failed.forEach(f => console.log(' - ' + f.name + ' — ' + f.detail)); }
  console.log('screenshots → test/chromium/shots/paper');
  process.exit(failed.length ? 1 : 0);
})();
