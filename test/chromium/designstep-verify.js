/* Chromium verification of the Design step SCREEN.
   ============================================================
   structure-verify.js proves the structures do what they claim to the
   document. This file proves the screen a customer picks them on actually
   works — mounted in the real app, against the real server, through the
   product's own openDesignStep().

   A screen check rather than a node test because every claim here is about
   layout and cascade: whether a rail scrolls, whether a category header
   sticks, whether a control is on screen at all. jsdom has no layout engine,
   so it cannot answer any of them.

   WHAT IS MEASURED, and why each one:
     1  the step opens on STRUCTURE alone — one choice per screen. The style
        list used to sit below five structure cards, so finding it meant
        scrolling past the choice you had already made
     2  the rail SCROLLS rather than growing to fit. Tied to the window the
        panes simply grow until their content fits and then there is nothing
        left to scroll — on a tall monitor, no scrollbar at all
     3  the document pane scrolls independently of the rail
     4  the page itself does not scroll, AND the panes reach the bottom of the
        view rather than stopping short and leaving a band of dead space
     5  the colour control is on screen WITHOUT touching anything first. It
        used to appear only on designs that show an accent, which meant a
        customer sitting on a monochrome design could not find it
     5b Next moves to style, and the screen SAYS so three ways — the step rail,
        the rail's own number and title, and the button that changed
     5c Back returns to structure with the structure still chosen
     6  picking a structure reaches the preview — the paper gains the attribute
        and the layout actually changes
     7  a blocked pairing is drawn as unavailable, with its reason attached
     8  choosing a style that cannot take the current structure does not strand
        the customer on a combination the product refuses

   Screenshots go to test/chromium/shots/designstep/. */
const path = require('node:path');
const fs = require('node:fs');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'designstep');
const ROOT = path.join(__dirname, '..', '..');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass, detail: detail == null ? '' : String(detail) });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
};

const READ = () => {
  const scrolls = sel => { const el = document.querySelector(sel);
    return el ? { h: Math.round(el.clientHeight), scrolls: el.scrollHeight > el.clientHeight + 2 } : null; };
  /* WHICHEVER LIST IS ON SCREEN. Step 1 draws style cards (data-ds-pick) and
     step 2 draws structures (data-ds-structure); looking only for structures
     found no rail at all on the first step once the order was flipped. */
  const rail = document.querySelector('[data-ds-structure], [data-ds-pick]');
  const railPane = rail ? rail.parentElement : null;
  const paper = document.querySelector('[data-doc-body]');
  const onScreen = sel => { const el = document.querySelector(sel); if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < innerHeight; };
  return {
    structures: document.querySelectorAll('[data-ds-structure]').length,
    styles: document.querySelectorAll('[data-ds-pick]').length,
    contentsBtns: document.querySelectorAll('[data-ds-contents]').length,
    contentsOn: !!document.querySelector('[data-ds-contents="1"][aria-pressed="true"]'),
    /* Measured on the PREVIEW, not on the button. Whether the control looks
       pressed and whether the document actually gained a contents page are two
       different claims, and only the second one is the feature. */
    previewContents: !!document.querySelector('#ds-zoom [data-doc-contents]'),
    railHeading: (document.querySelector('[data-ds-step-title]') || {}).textContent
      ? document.querySelector('[data-ds-step-title]').textContent.trim() : '',
    /* Read off the rail's own hook rather than fished out by text: the footer
       note also says "Step 2 of 2", and a check that matches the wrong element
       reports on something nobody is looking at. */
    stepLabel: (() => { const el = document.querySelector('[data-ds-step]');
      return el ? el.textContent.trim().replace(/\s+/g, ' ') : ''; })(),
    stepNo: (document.querySelector('[data-ds-step]') || {}).getAttribute
      ? document.querySelector('[data-ds-step]').getAttribute('data-ds-step') : null,
    nextBtn: !!document.getElementById('ds-next'),
    publishBtn: !!document.getElementById('ds-publish') || !!document.getElementById('ds-save'),
    backLabel: (document.getElementById('ds-back') || {}).textContent ? document.getElementById('ds-back').textContent.trim() : '',
    /* The sheet is a PAGE at its own width, scaled by the zoom wrapper. The
       distinction is the whole defect: sizing the sheet while leaving the type
       alone shrank the page and not the words. offsetWidth is the layout width
       (pre-zoom), the rect is what lands on screen. */
    sheet: (() => { const el = document.querySelector('.ds-sheet'); if (!el) return null;
      const pane = document.getElementById('ds-docpane');
      const surf = el.querySelector('.doc-surface'), h1 = el.querySelector('.doc-surface h1');
      const wrap = document.getElementById('ds-zoom');
      return {
        layoutW: el.offsetWidth,
        onScreenW: Math.round(el.getBoundingClientRect().width),
        paneW: pane ? Math.round(pane.clientWidth) : null,
        zoom: wrap ? parseFloat(getComputedStyle(wrap).getPropertyValue('--ds-zoom')) : null,
        docFont: surf ? getComputedStyle(surf).fontSize : null,
        titleLines: h1 ? Math.round(h1.getBoundingClientRect().height / parseFloat(getComputedStyle(h1).lineHeight)) : null,
      }; })(),
    stepper: !!document.querySelector('.rl-type-step'),
    /* WHAT "STYLED" IS MADE OF, now that it cannot be made of a corner. This
       read the border-radius alone and wanted 12px — a fair proxy for "this
       control got dressed" until SQUARE CORNERS EVERYWHERE (20 Aug 2026) took
       the radius off every control in the product. The dress it actually wears
       is a filled ground, a hairline and padding, so those are what is read.
       ---- REVERSED IN PLACE 26 Aug 2026 ----
       It went on to assert the radius was 0px, pinning the 20 Aug squaring
       rather than merely tolerating it. The owner has since given the platform
       a 2px corner and kept the CONTRACT square, so a control at 0 is now the
       odd one out. The claim is the same claim — this control wears whatever
       the platform's furniture wears — and it is READ FROM THE APP rather than
       typed, so the next time that number moves this file costs no edit. */
    stepperStyled: (() => {
      const e = document.querySelector('.rl-type-step'); if (!e) return null;
      const s = getComputedStyle(e);
      const want = getComputedStyle(document.documentElement)
        .getPropertyValue('--radius').trim();
      return { radius: s.borderRadius, want, bg: s.backgroundColor,
               border: parseFloat(s.borderTopWidth) || 0, pad: parseFloat(s.paddingTop) || 0,
               /* The redesign's box has its own HEIGHT and no padding of its
                  own — the buttons inside it carry that now. */
               h: Math.round(e.getBoundingClientRect().height) };
    })(),
    focusBtn: !!document.getElementById('ds-focus'),
    railsVisible: document.querySelectorAll('.ds-rail-pane').length > 0
      && [...document.querySelectorAll('.ds-rail-pane')].every(e => e.getBoundingClientRect().width > 0),
    /* CHANGE 1 — no dead band under the columns */
    /* The column widths moved out of the inline style into .ds-cols so they can
       be retuned per breakpoint (index.html, RESPONSIVE VIEW GRIDS). Same
       element, named rather than matched on a literal pixel value; the old
       selector is kept as a fallback. */
    deadSpace: (() => { const cols = document.querySelector('.ds-cols')
        || document.querySelector('div[style*="grid-template-columns:268px"]');
      const view = document.querySelector('.view-enter');
      return cols && view ? Math.round(view.getBoundingClientRect().bottom - cols.getBoundingClientRect().bottom) : null; })(),
    blocked: Array.from(document.querySelectorAll('[data-ds-structure][disabled]'))
      .map(b => ({ id: b.getAttribute('data-ds-structure'), why: b.getAttribute('title') || '' })),
    categories: Array.from(document.querySelectorAll('h4'))
      .map(h => h.textContent.trim().replace(/\s+/g, ' ')).filter(t => /Structure|Style/i.test(t)),
    railPane: railPane ? { h: Math.round(railPane.clientHeight), scrolls: railPane.scrollHeight > railPane.clientHeight + 2 } : null,
    docPane: paper && paper.parentElement
      ? { h: Math.round(paper.parentElement.clientHeight), scrolls: paper.parentElement.scrollHeight > paper.parentElement.clientHeight + 2 }
      : null,
    pageScrollsY: document.body.scrollHeight > innerHeight + 2,
    pageScrollsX: document.body.scrollWidth > document.documentElement.clientWidth + 2,
    swatches: document.querySelectorAll('[data-ds-swatch]').length,
    hexField: onScreen('#ds-accent-hex'),
    colourWheel: onScreen('#ds-accent'),
    structureAttr: paper ? paper.getAttribute('data-doc-structure') : null,
    designAttr: paper ? paper.getAttribute('data-doc-body') : null,
    blockedStyles: Array.from(document.querySelectorAll('[data-ds-pick][disabled]'))
      .map(b => ({ id: b.getAttribute('data-ds-pick'), why: b.getAttribute('title') || '' })),
    columnCount: paper ? getComputedStyle(paper.querySelector('.doc-surface')).columnCount : null,
    selectedStructure: (document.querySelector('[data-ds-structure][style*="accent-100"]') || {})
      .getAttribute ? document.querySelector('[data-ds-structure][style*="accent-100"]').getAttribute('data-ds-structure') : null,
  };
};

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const h = await startHati();
  await seedWorkspace(h);

  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto(h.base, { waitUntil: 'networkidle' });
  await page.evaluate(() => fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.co.ke', password: 'adminpassword1' }) }).then(r => r.json()));
  await page.goto(h.base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);

  /* Opened the way Settings opens it — the product's own entry point. */
  await page.evaluate(() => window.openDesignStep({ mode: 'settings', onBack: () => {} }));
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(OUT, 'design-step.png') });

  const m = await page.evaluate(READ);
  check('1 · the step opens on style alone',
    m.styles === 8 && m.structures === 0,
    `${m.structures} structures, ${m.styles} styles on screen`);
  check('1 · and says which step it is, in words',
    /Step 1 of 2/.test(m.stepLabel) && /Choose a style/i.test(m.railHeading),
    `"${m.stepLabel}" · "${m.railHeading}"`);
  /* STYLE LEADS, SO NOTHING ON IT IS REFUSED. There is no structure yet for a
     style to be incompatible with — only a default nobody has looked at — and
     greying out the reader's FIRST choice on the strength of a decision they
     have not taken is the fault this asserts against. */
  check('1 · and no style is refused on the first choice',
    m.blockedStyles.length === 0, m.blockedStyles.map(b => b.id).join(', ') || 'none');
  check('2 · the rail scrolls rather than growing to fit',
    m.railPane && m.railPane.scrolls, m.railPane ? `${m.railPane.h}px tall` : 'no rail');
  check('4 · the page itself does not scroll in either direction',
    !m.pageScrollsY && !m.pageScrollsX, `y=${m.pageScrollsY} x=${m.pageScrollsX}`);
  check('4 · and the panes reach the bottom — no dead band beneath them',
    m.deadSpace !== null && m.deadSpace <= 20, `${m.deadSpace}px below the columns`);
  check('5 · the colour control is on screen untouched',
    m.swatches === 8 && m.hexField && m.colourWheel,
    `${m.swatches} swatches, hex=${m.hexField}, wheel=${m.colourWheel}`);
  /* ---- the sheet is a page, and the type on it is the document's own ---- */
  /* ---- READ AS A RELATION, NOT A LITERAL (re-pointed 23 Aug 2026) ----
     This pinned '13.5px', and the 22 Aug type pass moved every base size onto
     a whole pixel — so it reported a fault about a sheet that had not changed
     and was, if anything, more correct than before. The claim was never the
     number: it is that the preview draws a REAL PAGE at the DOCUMENT's own
     size rather than at the interface's. Pinned that way, the next type pass
     costs no test edit. */
  check('5 · the sheet is a real page at the document\'s own type size',
    m.sheet && m.sheet.layoutW === 680
      && parseFloat(m.sheet.docFont) >= 13 && parseFloat(m.sheet.docFont) <= 16,
    m.sheet ? `${m.sheet.layoutW}px page, ${m.sheet.docFont} text` : 'no sheet');
  /* THE DEFECT THIS CATCHES. The sheet was shrunk while the words were left at
     their absolute size, so a title that belongs on one line took four. A page
     scaled whole keeps the proportion whatever size it is drawn at. */
  check('5 · and the title sits on one line, not four',
    m.sheet && m.sheet.titleLines === 1, `title wraps to ${m.sheet && m.sheet.titleLines} line(s)`);
  check('5 · the page is scaled to fit the pane it is in',
    m.sheet && m.sheet.zoom > 0 && Math.abs(m.sheet.onScreenW - m.sheet.paneW) < 40,
    m.sheet ? `zoom ${m.sheet.zoom} → ${m.sheet.onScreenW}px in a ${m.sheet.paneW}px pane` : '');
  /* ---- THE SAME CLAIM IN THE REDESIGN'S CLOTHES (re-pointed 23 Aug 2026) ----
     It required pad > 0, which was how the pre-redesign THREE-CHIP pill said
     "styled". The 22 Aug redesign makes it ONE 28px bordered box with the
     buttons as bare glyphs inside it, so the group's own padding is 0 and the
     buttons carry it — and the rule was scoped to .redline-page, so this page
     kept the old dress until that scope came off (23 Aug). What the check has
     always meant is that the control is a BOX and not a bare run of buttons:
     a real background, a real border, and a real height. */
  check('5 · the workbench\'s own text-size stepper is here, styled',
    m.stepper && !!m.stepperStyled
      && m.stepperStyled.bg !== 'rgba(0, 0, 0, 0)' && m.stepperStyled.bg !== 'transparent'
      && m.stepperStyled.border > 0 && (m.stepperStyled.h || 0) >= 24,
    m.stepperStyled ? `bg=${m.stepperStyled.bg}, border=${m.stepperStyled.border}px, h=${m.stepperStyled.h}px`
                    : `stepper=${m.stepper}`);
  check('5 · and it wears the platform\'s own corner, like every other control',
    !!m.stepperStyled && m.stepperStyled.want !== ''
      && parseFloat(m.stepperStyled.radius) === parseFloat(m.stepperStyled.want),
    m.stepperStyled ? `radius=${m.stepperStyled.radius}, --radius=${m.stepperStyled.want}`
                    : 'no stepper');
  check('5 · and the focus control is here', m.focusBtn);
  check('5 · step 1 offers Next, not Publish', m.nextBtn && !m.publishBtn);

  /* ---- 6 · picking a style reaches the preview ---- */
  /* Ceremonial deliberately: it is the style that refuses two of the five
     layouts, so step 2 has a real refusal to draw rather than a happy path. */
  const firstStyle = await page.evaluate(() => {
    const pick = document.querySelector('[data-ds-pick="ceremonial"]')
      || document.querySelectorAll('[data-ds-pick]')[1];
    pick.click();
    return pick.getAttribute('data-ds-pick');
  });
  await page.waitForTimeout(400);
  const after = await page.evaluate(READ);
  check('6 · picking a style reaches the preview',
    after.designAttr === firstStyle, `sheet is ${after.designAttr}, picked ${firstStyle}`);
  await page.screenshot({ path: path.join(OUT, 'step1-style.png') });

  /* ---- 5b · Next moves to structure and says so ---- */
  await page.evaluate(() => document.getElementById('ds-next').click());
  await page.waitForTimeout(500);
  const two = await page.evaluate(READ);
  /* FOUR, not five: the contents page stopped being a structure card on
     10 Aug 2026 and is a yes/no above the list. Its own checks are at 5c. */
  check('5b · Next moves to structure, and only structure is offered',
    two.structures === 4 && two.styles === 0, `${two.structures} structures, ${two.styles} styles`);
  /* ---- 5c · the contents page is a choice of its own, off by default ---- */
  check('5c · the pair is drawn, and it opens on "not included"',
    two.contentsBtns === 2 && two.contentsOn === false && two.previewContents === false,
    `${two.contentsBtns} buttons, on=${two.contentsOn}, in preview=${two.previewContents}`);
  await page.evaluate(() => document.querySelector('[data-ds-contents="1"]').click());
  await page.waitForTimeout(400);
  const withC = await page.evaluate(READ);
  check('5c · choosing it puts a contents page on the document',
    withC.contentsOn === true && withC.previewContents === true && withC.structures === 4,
    `on=${withC.contentsOn}, in preview=${withC.previewContents}, layouts still ${withC.structures}`);
  await page.screenshot({ path: path.join(OUT, 'step2-contents.png') });
  await page.evaluate(() => document.querySelector('[data-ds-contents="0"]').click());
  await page.waitForTimeout(400);
  const noC = await page.evaluate(READ);
  check('5c · and it can be taken off again',
    noC.contentsOn === false && noC.previewContents === false,
    `on=${noC.contentsOn}, in preview=${noC.previewContents}`);

  check('5b · and the screen says so — step label, heading and button all change',
    /Step 2 of 2/.test(two.stepLabel) && /Choose a structure/i.test(two.railHeading)
      && two.publishBtn && !two.nextBtn && /Back to style/i.test(two.backLabel),
    `"${two.stepLabel}" · "${two.railHeading}" · back reads "${two.backLabel}"`);
  check('5b · the style chosen on step 1 is still the one on the sheet',
    two.designAttr === firstStyle, `sheet is ${two.designAttr}`);
  await page.screenshot({ path: path.join(OUT, 'step2-structure.png') });

  /* ---- 7 · blocked pairings, now shown against a STYLE already chosen ---- */
  const blocked = await page.evaluate(() => Array.from(document.querySelectorAll('[data-ds-structure][disabled]'))
    .map(b => ({ id: b.getAttribute('data-ds-structure'), why: b.getAttribute('title') || '' })));
  check('7 · a structure the chosen style cannot take is drawn unavailable, with its reason',
    blocked.length > 0 && blocked.every(b => b.why.length > 30),
    blocked.map(b => b.id).join(', ') || 'none');

  /* ---- 6b · and picking an allowed structure still reaches the preview ---- */
  const pickedStructure = await page.evaluate(() => {
    const free = Array.from(document.querySelectorAll('[data-ds-structure]')).filter(b => !b.disabled);
    const el = free.find(b => b.getAttribute('data-ds-structure') !== 'standard-flow') || free[0];
    el.click();
    return el.getAttribute('data-ds-structure');
  });
  await page.waitForTimeout(400);
  const withStruct = await page.evaluate(READ);
  check('6b · picking a structure reaches the preview',
    withStruct.structureAttr === pickedStructure,
    `sheet is ${withStruct.structureAttr}, picked ${pickedStructure}`);

  /* ---- 5c · Back returns to style, keeping the choice ---- */
  await page.evaluate(() => document.getElementById('ds-back').click());
  await page.waitForTimeout(450);
  const back = await page.evaluate(READ);
  check('5c · Back returns to style with the choice intact',
    back.styles === 8 && back.structures === 0 && back.designAttr === firstStyle
      && /Step 1 of 2/.test(back.stepLabel),
    `${back.stepLabel}, sheet still ${back.designAttr}`);

  /* ---- 9 · the resize and focus controls actually work ---- */
  /* ---- CLAIM REVERSED, 13 Aug 2026, OWNER-ASKED ----
     The preference used to MULTIPLY this page's zoom, so A⁺ was read off
     --ds-zoom. It sizes the TYPE now and the zoom is the fit alone, on all
     three screens that draw a document: with the preference in the zoom,
     asking for the new floor of 8 shrank the page to half its pane and left it
     floating. The claim is the same one — the press must make the contract
     bigger and store the choice — read off the thing that now carries it. */
  const type0 = await page.evaluate(() => parseFloat(getComputedStyle(
    document.querySelector('#ds-zoom .hati-doc')).fontSize));
  const z0 = await page.evaluate(() => parseFloat(getComputedStyle(document.getElementById('ds-zoom')).getPropertyValue('--ds-zoom')));
  await page.evaluate(() => document.querySelector('[data-rl-type="1"]').click());
  await page.waitForTimeout(300);
  const z1 = await page.evaluate(() => ({
    zoom: parseFloat(getComputedStyle(document.getElementById('ds-zoom')).getPropertyValue('--ds-zoom')),
    type: parseFloat(getComputedStyle(document.querySelector('#ds-zoom .hati-doc')).fontSize),
    readout: document.querySelector('.rl-type-out').textContent.trim(),
    stored: localStorage.getItem('hati.v1.rlDocType') }));
  check('9 · A+ makes the contract bigger, and stores the preference',
    z1.type > type0 && z1.readout !== '15px' && z1.stored,
    `type ${type0} → ${z1.type}, readout ${z1.readout}, stored ${z1.stored}`);
  check('9 · and the page itself keeps fitting its pane, whatever the type',
    Math.abs(z1.zoom - z0) < 0.001, `zoom ${z0} → ${z1.zoom}`);
  await page.evaluate(() => document.querySelector('[data-rl-type="-1"]').click());
  await page.waitForTimeout(250);

  const beforeFocus = await page.evaluate(READ);
  await page.evaluate(() => document.getElementById('ds-focus').click());
  await page.waitForTimeout(450);
  const inFocus = await page.evaluate(READ);
  check('9 · focus folds the rails away and gives the document the width',
    beforeFocus.railsVisible && !inFocus.railsVisible
      && inFocus.sheet.onScreenW > beforeFocus.sheet.onScreenW,
    `page ${beforeFocus.sheet.onScreenW}px → ${inFocus.sheet.onScreenW}px`);
  await page.screenshot({ path: path.join(OUT, 'focus.png') });
  await page.evaluate(() => document.getElementById('ds-focus').click());
  await page.waitForTimeout(400);

  /* ---- 10 · THE DEFECT THAT WAS REPORTED ----
     Every pick repainted the screen wholesale, so the rail returned to the top
     and the card just clicked went with it. On the fifth structure or the
     eighth style the selection vanished at the moment it was made.

     Asked on the STYLE list, which is step 1 now and the longer of the two —
     eight cards to five, so it is the list that actually has to scroll. Check
     5c left the screen there, so there is no step to move to first; pressing
     Next here is what made this look for style cards on the structure step. */
  const scrolled = await page.evaluate(() => {
    const rail = document.getElementById('ds-rail');
    rail.scrollTop = rail.scrollHeight;                 // down to the last style
    return rail.scrollTop;
  });
  await page.waitForTimeout(200);
  const lastStyle = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-ds-pick]:not([disabled])')];
    const el = cards[cards.length - 1];
    const before = el.getBoundingClientRect().top;
    el.click();
    return { id: el.getAttribute('data-ds-pick'), before: Math.round(before) };
  });
  await page.waitForTimeout(450);
  const held = await page.evaluate(id => {
    const rail = document.getElementById('ds-rail');
    const el = document.querySelector(`[data-ds-pick="${id}"]`);
    return { scrollTop: rail.scrollTop, cardTop: el ? Math.round(el.getBoundingClientRect().top) : null,
      inView: el ? (el.getBoundingClientRect().top >= 0 && el.getBoundingClientRect().bottom <= innerHeight) : false };
  }, lastStyle.id);
  check('10 · picking a card does not throw the rail back to the top',
    held.scrollTop > 10 && Math.abs(held.cardTop - lastStyle.before) < 8 && held.inView,
    `rail at ${Math.round(scrolled)} → ${Math.round(held.scrollTop)}, card stayed at ${held.cardTop}px (was ${lastStyle.before}px)`);

  check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed · shots in ${path.relative(ROOT, OUT)}`);
  if (failed.length) { console.error('FAILED: ' + failed.map(f => f.name).join('; ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
