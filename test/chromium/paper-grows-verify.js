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

   OPTION A WAS BUILT, NOT B. B — move this paper to the Document tab's model,
   fixed sheet plus a fit-to-width zoom — is the tidier answer and the
   dangerous one here: this page is a working surface full of interactive
   geometry (the selection menu is placed from a range rectangle inside the
   paper, the card pop-out is fixed and placed from its card's rectangle, the
   resizer tracks the cursor against the grid's own width, and the queue
   overlay and its vertical rail hang off the grid as absolute children).
   Putting a zoom layer between fourteen rectangle readers and the viewport is
   where this codebase has already been burned. So: the paper's measure grows
   toward the column with a ceiling tied to the TYPE, and the negotiation page
   gains the A⁻/A⁺ stepper it never had.

   WHY THIS FILE EXISTS. Every claim here is a width, a gutter or a cursor
   position. jsdom resolves no cascade and has no layout engine, so none of it
   can be asserted anywhere else. The rule-level claims live in f89.

   WHAT IS MEASURED:
     1  the sheet grows past the old 720 on both mounts, at four widths
     2  it is still BOUNDED — 62 × the contract's own type — and centred
     3  dragging the divider spends the width on WORDING, not on gutter
     4  the stepper is in the negotiation control row and works
     5  ONE preference: stepping there is the size the other screens open at,
        and raising the type raises the ceiling with it
     6  the geometry that could have been broken is not: the resizer tracks the
        cursor one-to-one, the queue rail sits on the page's own border, and
        the card pop-out lands beside its card
     7  the phone still gets the paper at full width

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

/* The sheet, its column, and the two gutters — read from real rectangles.
   `type` is the contract's own computed font size, which is what the ceiling
   is expressed in, so the check can compute the ceiling rather than hard-code
   a number that would silently stop testing anything if the rule moved. */
const SHEET = () => {
  const paper = document.querySelector('.redline-page .rl-paper');
  const col = document.querySelector('.redline-page #rl-doc')
    || (paper && paper.closest('.nego-scroll,.nego-pane'));
  if (!paper || !col) return null;
  const p = paper.getBoundingClientRect(), c = col.getBoundingClientRect();
  const body = paper.querySelector('.nego-body, p');
  const root = paper.closest('.redline-page');
  const type = parseFloat(getComputedStyle(root).getPropertyValue('--rl-doc-type')) || 15;
  return { paper: Math.round(p.width), col: Math.round(c.width),
    gutterL: Math.round(p.left - c.left), gutterR: Math.round(c.right - p.right),
    type, ceiling: Math.round(type * 62),
    /* How much of the sheet the words actually occupy — the fault was that
       widening bought air, so the words' own box is the honest measure. */
    words: body ? Math.round(body.getBoundingClientRect().width) : null };
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
        check(`${w} · owner: the contract is WIDER than the old flat 720`,
          own.paper > 720, `${own.paper}px`);
        check(`${w} · owner: and still bounded by 62 × its own type`,
          own.paper <= own.ceiling + 1, `${own.paper} vs ceiling ${own.ceiling}`);
        check(`${w} · owner: still centred — the spare width splits evenly`,
          Math.abs(own.gutterL - own.gutterR) <= 2, `${own.gutterL} / ${own.gutterR}`);
      }
      await page.evaluate(() => window.SHOW_COUNTERPARTY());
      await pause(500);
      const cp = await page.evaluate(SHEET);
      check(`${w} · counterparty: ONE FIX REACHES BOTH MOUNTS`,
        !!cp && cp.paper > 720, cp ? `${cp.paper} of ${cp.col}` : 'no sheet');
      if (cp) check(`${w} · counterparty: bounded the same way`,
        cp.paper <= cp.ceiling + 1, `${cp.paper} vs ${cp.ceiling}`);
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
      check('AND THE WORDING GREW WITH IT, not the margin',
        after.words > before.words
          && (after.gutterL - before.gutterL) < (after.words - before.words),
        `words ${before.words}→${after.words}, gutter ${before.gutterL}→${after.gutterL}`);
    }
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
    check('THE CEILING HOLDS on a large monitor — the line does not run the window',
      wide && wide.paper <= wide.ceiling + 1 && wide.col > wide.paper + 100,
      wide && `${wide.paper} of ${wide.col}, ceiling ${wide.ceiling}`);
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
      for (let i = 0; i < 5; i++){ if (!up.disabled) up.click(); }
      await new Promise(r => setTimeout(r, 250));
      const paper = document.querySelector('.redline-page .rl-paper');
      return { before,
        after: parseFloat(getComputedStyle(
          document.querySelector('.redline-page')).getPropertyValue('--rl-doc-type')),
        stored: Number(localStorage.getItem('hati.v1.rlDocType')),
        readout: (document.querySelector('.redline-page .rl-type-out') || {}).textContent,
        paperW: Math.round(paper.getBoundingClientRect().width) };
    });
    check('4 pressing A⁺ makes the contract text bigger',
      stepped.after > stepped.before, `${stepped.before} → ${stepped.after}`);
    check('5 ONE PREFERENCE — it writes the key the other screens read',
      stepped.stored === stepped.after, `stored ${stepped.stored}`);
    check('5 and the readout says the same number, in its own words',
      String(stepped.readout).trim() === stepped.after + 'px', stepped.readout);
    check('5 AND THE CEILING RISES WITH THE TYPE — bigger text, wider sheet',
      after && stepped.paperW > after.paper, `${after && after.paper} → ${stepped.paperW}`);
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
    check('7 on a phone the sheet still fills its column',
      !!phone && phone.gutterL <= 8 && phone.gutterR <= 8,
      phone ? `${phone.paper} of ${phone.col}, gutters ${phone.gutterL}/${phone.gutterR}` : 'no sheet');
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
