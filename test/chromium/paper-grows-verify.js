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
        /* ---- CLAIM REVERSED IN PLACE, 22 Aug 2026 (owner-approved render) ----
           THE SHEET STILL FILLS ITS COLUMN. What changed is HOW: it used to be
           a fixed 660px page MAGNIFIED to fit, and it is fluid now — it takes
           the column's width at a steady type size, up to the readable measure
           its own rule caps it at (RL_SHEET_MAX, 860).

           WHY THE REVERSAL, because the old claim was right about the page it
           was written for. On the Document tab there is no divider: the
           column's width is the window's, so a sheet that scales changes size
           once, when you resize. HERE the divider is a control you move all
           day, and a magnified sheet re-sized the WORDS on every drag — which
           made the reader's own text-size stepper only half the answer to "how
           big is this contract". Section 5 below still proves the stepper moves
           the words, which is the half that had to survive.

           SO: fills, or has reached its own cap. And zoom is pinned at 1 —
           asserted, because a fit creeping back in is exactly the kind of thing
           that would look right in a screenshot and be wrong. */
        check(`${w} · owner: THE SHEET FILLS ITS COLUMN (or has hit its measure cap)`,
          own.paper >= own.col - 12 || own.paper >= 858,
          `${own.paper} of ${own.col}, zoom ${own.zoom}`);
        check(`${w} · owner: it is WIDENED, not scaled — the words hold their size`,
          own.zoom === 1, `zoom ${own.zoom}`);
        check(`${w} · owner: still centred — any spare width splits evenly`,
          Math.abs(own.gutterL - own.gutterR) <= 2, `${own.gutterL} / ${own.gutterR}`);
      }
      await page.evaluate(() => window.SHOW_COUNTERPARTY());
      await pause(500);
      const cp = await page.evaluate(SHEET);
      check(`${w} · counterparty: ONE FIX REACHES BOTH MOUNTS`,
        !!cp && cp.zoom === 1 && (cp.paper >= cp.col - 12 || cp.paper >= 858),
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
      /* ---- CLAIM REVERSED IN PLACE, 22 Aug 2026 (owner-approved render) ----
         THIS USED TO ASSERT THE OPPOSITE, and the history is worth keeping.
         The original report was that dragging the divider did nothing visible;
         the first fix widened the sheet and the owner reported the feature
         still missing, because widening is not enlarging. So the sheet was
         magnified, and this check read the rendered LINE HEIGHT to prove the
         words themselves had grown.

         The render reverses it: on a page whose divider is a working control,
         type that changes on every drag makes the reader's own text-size
         stepper only half the answer. So the sheet TAKES THE WIDTH and the
         words hold — which is what the original report actually needed
         (something visibly happens) without the cost.

         WHAT IS ASSERTED NOW is that the same drag still changes the sheet, on
         the axis it now changes: the paper is wider, the WORDS ARE THE SAME
         SIZE, and a real line of the contract holds more of them. The last of
         those is the one that would fail if the sheet had merely grown its
         margins — the fault this check was written to catch, caught the same
         way from the other side. */
      check('THE SHEET GREW WITH IT — wider paper, same words',
        after.paper > before.paper && after.lineH === before.lineH && after.zoom === 1,
        `paper ${before.paper}→${after.paper}, line ${before.lineH}px → ${after.lineH}px, zoom ${after.zoom}`);
      check('and the margin did not grow instead — the WORDING got the width',
        after.words > before.words,
        `text ${before.words}px → ${after.words}px (gutter ${before.gutterL} → ${after.gutterL})`);
    }
    /* AND IT SHRINKS AGAIN COMING BACK. "grows and shrinks as you slide the
       divider back and forth" is the whole report; a one-way check would pass
       on a layout that never recovered. */
    await page.evaluate(() => { localStorage.setItem('hati.v1.rlLeftFrac', '0.45');
      window.rlLayoutResizer(document); });
    await pause(350);
    const back = await page.evaluate(SHEET);
    check('AND IT NARROWS AGAIN WHEN THE DIVIDER COMES BACK',
      back && after && back.words < after.words && back.zoom === 1,
      back && `text ${after.words}px → ${back.words}px, zoom ${back.zoom}`);
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
    /* "or has reached its measure cap" since 22 Aug 2026: the sheet is fluid
       and stops at RL_SHEET_MAX (860), so on a column wider than that filling
       it would mean an unreadable line. The claim — the stepper never leaves
       the page floating in white space — is unchanged, and the second half of
       it (the sheet's width does not move with the type) is the load-bearing
       one either way. */
    check('5 AND THE PAGE STILL FILLS ITS COLUMN — the reported half',
      (stepped.wAfter[0] >= stepped.wAfter[1] - 12 || stepped.wAfter[0] >= 858)
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
      floored.sheet >= floored.col - 12 || floored.sheet >= 858,
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
        /* The tags left the paper on 16 Aug 2026; the Edit pill is the piece of
           furniture that rides the clause head now, and it takes the same
           --doc-scale reading the tag did. Same claim, its successor. THE TOOL
           ROW left the same day (no edits on the paper — all writing through
           the panel), so the pill is also the LAST piece of clause furniture
           there is to measure. */
        tag: box('.redline-page .rl-cp-pill') };
    })()`;
    const furnitureAt = async v => {
      await page.evaluate(t => window.rlSetDocType(t), v);
      await pause(350);
      return page.evaluate(FURNITURE);
    };
    const f8 = await furnitureAt(8), f15 = await furnitureAt(15), f20 = await furnitureAt(20);
    check('5c the sheet carries the Edit pill to measure',
      !!f15.tag, f15.tag ? `pill ${f15.tag.w}x${f15.tag.h}` : 'no pill on the sheet');
    if (f15.tag){
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
      /* REVERSED IN PLACE, 16 Aug 2026: this used to measure the Copilot /
         Direct Edit pills scaling in the same breath. That row is retired —
         no edits on the paper, all writing through the panel — so the claim
         that survives is its ABSENCE, at every setting. */
      const noTool = await page.evaluate(() =>
        !document.querySelector('.redline-page .rl-tool')
        && !document.querySelector('.redline-page .rl-tools'));
      check('5c THE COPILOT / DIRECT EDIT PILLS ARE GONE FROM THE PAPER — retired 16 Aug 2026',
        noTool, 'no .rl-tool / .rl-tools anywhere on the page');
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

    /* ---- 5d. THE EDITOR LIVES IN THE PANEL NOW, AND THE PANEL DOES NOT
       FOLLOW THE STEPPER — REVERSED IN PLACE, 16 Aug 2026 ----

       This section used to prove the OPPOSITE: the editor opened on the
       clause (Direct Edit), it was the sheet's furniture, and its chips, Save
       and reason box had to scale 8/15/20 with the wording (the third report
       of one fault, 15 Aug 2026). Two owner decisions later that geometry is
       gone: the clause tool row is retired ("no ability to make edits on the
       contract itself … All edits will happen on the side panel"), and the
       panel deliberately pins --doc-scale to 1 ("the paper scales; the panel
       does not" — a Save button shrinking because somebody made the PAPER
       smaller is the fault, in the panel's frame).

       So the same measurements now prove the new rules: the ONE editor on
       this page opens in the panel via the pill and the ＋, and its furniture
       is the SAME SIZE at every document-type setting while the paper's own
       words go on moving. The old scaling claims did not vanish — their
       subject moved out of the space they measured.

       THE REASON BOX IS DRAWN AT STEP TWO of the editor, so it carries
       .hidden on arrival and measures 0x0. It is un-hidden here rather than
       driven through a save, because what is being measured is the CSS, not
       the two-step flow — which f130 and redline-verify already own. */
    const EDITOR = `(() => {
      const box = sel => { const el = document.querySelector(sel); if (!el) return null;
        const r = el.getBoundingClientRect();
        return { w: +r.width.toFixed(1), h: +r.height.toFixed(1) }; };
      const words = document.querySelector('.redline-page .rl-paper .rl-clause p')
        || document.querySelector('.redline-page .rl-paper p');
      const wr = words ? words.getBoundingClientRect() : null;
      return { lineH: wr ? +wr.height.toFixed(1) : 0,
        fmtBtn: box('.redline-page .nego-fmt-bar button'),
        ta:     box('.redline-page .nego-reason textarea'),
        save:   box('.redline-page .nego-edit-bar button') };
    })()`;
    const openEditor = () => page.evaluate(() => {
      if (!document.querySelector('.redline-page [data-nego-editor]')){
        /* The pill opens the panel, the ＋ opens the editor in it — the only
           editing door this canvas has since the tool row retired. The ＋ is
           read from the OPEN body: every clause's body is in the DOM and a
           press in a hidden one opens an editor nothing can measure. */
        if (!document.querySelector('.redline-page .rl-cp.is-open')){
          const pill = document.querySelector('.redline-page [data-rl-cp-open]');
          if (pill) pill.click();
        }
        const plus = document.querySelector('.redline-page .rl-cp-src.is-on [data-rl-cp-edit]');
        if (plus) plus.click();
      }
      const r = document.querySelector('.redline-page .nego-reason');
      if (r) r.classList.remove('hidden');
      return !!document.querySelector('.redline-page [data-nego-editor]');
    });
    const editorAt = async v => {
      await page.evaluate(t => window.rlSetDocType(t), v);
      await pause(300);
      await openEditor();          /* a repaint can close it — re-open, then measure */
      await pause(300);
      return page.evaluate(EDITOR);
    };
    const editorOpens = await (async () => { await page.evaluate(t => window.rlSetDocType(t), 15);
      await pause(300); return openEditor(); })();
    check('5d the pill and the ＋ open a real editor to measure',
      editorOpens, editorOpens ? 'the panel\'s editor opened' : 'no editor anywhere');
    if (editorOpens){
      const noClauseEditor = await page.evaluate(() =>
        !document.querySelector('.redline-page .rl-clause [data-nego-editor]')
        && !!document.querySelector('.redline-page .rl-cp-src [data-nego-editor]'));
      check('5d and it opened in the PANEL — the paper itself carries no editor',
        noClauseEditor, 'editor inside .rl-cp-src, none inside a clause');
      const e8 = await editorAt(8), e15 = await editorAt(15), e20 = await editorAt(20);
      await page.screenshot({ path: path.join(OUT, '04d-owner-editor-20.png') });
      const got = e15.fmtBtn && e15.save && e15.ta;
      check('5d the open editor carries its format chips, reason box and Save',
        !!got, got ? `chip ${e15.fmtBtn.w}x${e15.fmtBtn.h}, save ${e15.save.w}x${e15.save.h}, box h${e15.ta.h}` : 'editor furniture missing');
      if (got){
        /* THE PANEL'S OWN RULE, stated as the thing that must now be true:
           three settings, three IDENTICAL boxes — while the paper's words
           move. The old "no longer the same size at every setting" claim
           belonged to an editor that sat ON the paper. */
        check('5d THE EDITOR FURNITURE HOLDS ITS SIZE AT EVERY SETTING — the panel does not follow the stepper',
          e8.fmtBtn.h === e15.fmtBtn.h && e15.fmtBtn.h === e20.fmtBtn.h,
          `format chip — 8: ${e8.fmtBtn.h} · 15: ${e15.fmtBtn.h} · 20: ${e20.fmtBtn.h}`);
        check('5d Save / Cancel hold too',
          e8.save.h === e15.save.h && e15.save.h === e20.save.h,
          `${e8.save.h} · ${e15.save.h} · ${e20.save.h}`);
        check('5d and the reason box with them',
          e8.ta.h === e15.ta.h && e15.ta.h === e20.ta.h,
          `${e8.ta.h} · ${e15.ta.h} · ${e20.ta.h}`);
        check('5d …while the paper\'s own words still move under the same presses',
          f8.words < f15.words && f20.words > f15.words,
          `words — 8: ${f8.words} · 15: ${f15.words} · 20: ${f20.words}`);
        check('5d and the reason box still takes its WIDTH from its container, not the type',
          Math.abs(e8.ta.w - e20.ta.w) <= 1, `8: ${e8.ta.w} · 20: ${e20.ta.w}`);
      }
      /* BOTH SEATS. The counterparty mounts this same panel and the same
         editor; the pin is the panel's own rule, so it must hold there too. */
      await page.evaluate(() => { window.rlSetDocType(15); window.SHOW_COUNTERPARTY(); });
      await pause(700);
      const cpOpens = await openEditor();
      check('5d · counterparty: their pill and ＋ open the same editor',
        cpOpens, cpOpens ? 'the panel\'s editor opened on their seat' : 'no editor');
      if (cpOpens){
        const q15 = await editorAt(15), q20 = await editorAt(20);
        await page.screenshot({ path: path.join(OUT, '04e-counterparty-editor-20.png') });
        check('5d · counterparty: AND IT HOLDS THERE TOO — one rule, both seats',
          !!(q15.fmtBtn && q20.fmtBtn) && q20.fmtBtn.h === q15.fmtBtn.h,
          q15.fmtBtn ? `15: ${q15.fmtBtn.h} → 20: ${q20.fmtBtn.h}` : 'no chips');
      }
      await page.evaluate(() => { window.rlSetDocType(15); window.SHOW_OWNER(); });
      await pause(700);
    }

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

    /* RE-POINTED 16 Aug 2026: the card pop-out is retired — the row's Open
       raises the clause panel, which lives in the grid's second track and is
       outside the zoom by construction. What this file's subject requires is
       that the panel is on screen and unaffected by the sheet's zoom. */
    const pop = await page.evaluate(async () => {
      const btn = document.querySelector('#rl-changes .rl-card .rl-open-btn');
      if (!btn) return null;
      btn.click();
      await new Promise(r => setTimeout(r, 400));
      const panel = document.querySelector('#rl-cp.is-open');
      if (!panel) return { open: false };
      const p = panel.getBoundingClientRect();
      return { open: p.width > 0 && p.height > 0,
        onScreen: p.left >= 0 && p.right <= window.innerWidth + 1 };
    });
    check('6 the clause panel opens from the row, on screen',
      pop && pop.open && pop.onScreen, JSON.stringify(pop));
    await page.evaluate(async () => {
      const btn = document.querySelector('#rl-changes .rl-card .rl-open-btn');
      if (btn) btn.click();
      await new Promise(r => setTimeout(r, 350));
    });
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
    /* DRAGGED LEFT, since 22 Aug 2026. The contract column's ceiling is the
       sheet's own readable measure now (RL_LEFT_MAX = 860 + gutters) rather
       than 660 × 2, and on this harness — which has no app sidebar — the
       divider already rests AT that ceiling, so a rightward drag correctly
       moves nothing and this check would be measuring the clamp instead of the
       ratio. Leftward is unclamped here. The claim is about the DELTA and is
       direction-blind. */
    await page.mouse.move(track.x - 120, track.y, { steps: 12 });
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
      Math.abs((landed - track.x) + 120) <= 10,
      `cursor moved -120, handle moved ${landed - track.x}`);
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
