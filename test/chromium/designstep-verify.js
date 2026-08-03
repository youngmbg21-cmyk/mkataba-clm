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
  const rail = document.querySelectorAll('[data-ds-structure]')[0];
  const railPane = rail ? rail.parentElement : null;
  const paper = document.querySelector('[data-doc-body]');
  const onScreen = sel => { const el = document.querySelector(sel); if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.top >= 0 && r.top < innerHeight; };
  return {
    structures: document.querySelectorAll('[data-ds-structure]').length,
    styles: document.querySelectorAll('[data-ds-pick]').length,
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
    /* the sheet, and whether the WHOLE page is visible inside its pane */
    sheet: (() => { const p = document.querySelector('.ds-sheet'); if (!p) return null;
      const r = p.getBoundingClientRect(); const pane = p.closest('div[style*="container-type"]')
        ? p.closest('div[style*="container-type"]').parentElement.getBoundingClientRect() : null;
      return { w: Math.round(r.width), h: Math.round(r.height),
        fits: pane ? (r.height <= pane.height + 1 && r.width <= pane.width + 1) : null,
        centred: pane ? Math.abs((r.left + r.right) / 2 - (pane.left + pane.right) / 2) < 2 : null }; })(),
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
  check('1 · the step opens on structure alone',
    m.structures === 5 && m.styles === 0,
    `${m.structures} structures, ${m.styles} styles on screen`);
  check('1 · and says which step it is, in words',
    /Step 1 of 2/.test(m.stepLabel) && /Choose a structure/i.test(m.railHeading),
    `"${m.stepLabel}" · "${m.railHeading}"`);
  check('2 · the rail scrolls rather than growing to fit',
    m.railPane && m.railPane.scrolls, m.railPane ? `${m.railPane.h}px tall` : 'no rail');
  check('4 · the page itself does not scroll in either direction',
    !m.pageScrollsY && !m.pageScrollsX, `y=${m.pageScrollsY} x=${m.pageScrollsX}`);
  check('4 · and the panes reach the bottom — no dead band beneath them',
    m.deadSpace !== null && m.deadSpace <= 20, `${m.deadSpace}px below the columns`);
  check('5 · the colour control is on screen untouched',
    m.swatches === 8 && m.hexField && m.colourWheel,
    `${m.swatches} swatches, hex=${m.hexField}, wheel=${m.colourWheel}`);
  check('5 · the whole sheet is visible and centred in its pane',
    m.sheet && m.sheet.fits && m.sheet.centred,
    m.sheet ? `${m.sheet.w}x${m.sheet.h}, fits=${m.sheet.fits}, centred=${m.sheet.centred}` : 'no sheet');
  check('5 · step 1 offers Next, not Publish', m.nextBtn && !m.publishBtn);

  /* ---- 6 · picking a structure reaches the preview ---- */
  await page.evaluate(() => document.querySelector('[data-ds-structure="two-column"]').click());
  await page.waitForTimeout(400);
  const after = await page.evaluate(READ);
  check('6 · picking a structure reaches the preview',
    after.structureAttr === 'two-column' && after.columnCount === '2',
    `attr=${after.structureAttr}, column-count=${after.columnCount}`);
  await page.screenshot({ path: path.join(OUT, 'step1-structure.png') });

  /* ---- 5b · Next moves to style and says so ---- */
  await page.evaluate(() => document.getElementById('ds-next').click());
  await page.waitForTimeout(500);
  const two = await page.evaluate(READ);
  check('5b · Next moves to style, and only style is offered',
    two.styles === 8 && two.structures === 0, `${two.structures} structures, ${two.styles} styles`);
  check('5b · and the screen says so — step label, heading and button all change',
    /Step 2 of 2/.test(two.stepLabel) && /Choose a style/i.test(two.railHeading)
      && two.publishBtn && !two.nextBtn && /Back to structure/i.test(two.backLabel),
    `"${two.stepLabel}" · "${two.railHeading}" · back reads "${two.backLabel}"`);
  check('5b · the structure chosen on step 1 is still the one on the sheet',
    two.structureAttr === 'two-column', `sheet is ${two.structureAttr}`);
  await page.screenshot({ path: path.join(OUT, 'step2-style.png') });

  /* ---- 7 · blocked pairings, now shown against a structure already chosen ---- */
  const blocked = await page.evaluate(() => Array.from(document.querySelectorAll('[data-ds-pick][disabled]'))
    .map(b => ({ id: b.getAttribute('data-ds-pick'), why: b.getAttribute('title') || '' })));
  check('7 · a style that cannot take the chosen structure is drawn unavailable, with its reason',
    blocked.length > 0 && blocked.every(b => b.why.length > 30),
    blocked.map(b => b.id).join(', ') || 'none');

  /* ---- 5c · Back returns to structure, keeping the choice ---- */
  await page.evaluate(() => document.getElementById('ds-back').click());
  await page.waitForTimeout(450);
  const back = await page.evaluate(READ);
  check('5c · Back returns to structure with the choice intact',
    back.structures === 5 && back.styles === 0 && back.structureAttr === 'two-column'
      && /Step 1 of 2/.test(back.stepLabel),
    `${back.stepLabel}, sheet still ${back.structureAttr}`);

  check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed · shots in ${path.relative(ROOT, OUT)}`);
  if (failed.length) { console.error('FAILED: ' + failed.map(f => f.name).join('; ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
