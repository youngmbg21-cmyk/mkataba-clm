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
     1  the step mounts and offers BOTH choices — five structures and eight
        styles, in one rail, under two category headers
     2  the rail SCROLLS rather than growing to fit. Tied to the window the
        panes simply grow until their content fits and then there is nothing
        left to scroll — on a tall monitor, no scrollbar at all
     3  the document pane scrolls independently of the rail
     4  the page itself does not scroll: the columns scroll inside themselves
     5  the colour control is on screen WITHOUT touching anything first. It
        used to appear only on designs that show an accent, which meant a
        customer sitting on a monochrome design could not find it
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
  check('1 · both catalogues are offered in one rail',
    m.structures === 5 && m.styles === 8 && m.categories.length === 2,
    `${m.structures} structures, ${m.styles} styles, headers: ${m.categories.join(' / ')}`);
  check('2 · the rail scrolls rather than growing to fit',
    m.railPane && m.railPane.scrolls, m.railPane ? `${m.railPane.h}px tall` : 'no rail');
  check('3 · the document pane scrolls independently',
    m.docPane && m.docPane.scrolls, m.docPane ? `${m.docPane.h}px tall` : 'no pane');
  check('4 · the page itself does not scroll in either direction',
    !m.pageScrollsY && !m.pageScrollsX, `y=${m.pageScrollsY} x=${m.pageScrollsX}`);
  check('5 · the colour control is on screen untouched',
    m.swatches === 8 && m.hexField && m.colourWheel,
    `${m.swatches} swatches, hex=${m.hexField}, wheel=${m.colourWheel}`);

  /* ---- 6 · picking a structure reaches the preview ---- */
  await page.evaluate(() => document.querySelector('[data-ds-structure="two-column"]').click());
  await page.waitForTimeout(400);
  const after = await page.evaluate(READ);
  check('6 · picking a structure reaches the preview',
    after.structureAttr === 'two-column' && after.columnCount === '2',
    `attr=${after.structureAttr}, column-count=${after.columnCount}`);
  await page.screenshot({ path: path.join(OUT, 'two-column-picked.png') });

  /* ---- 7 & 8 · blocked pairings ---- */
  await page.evaluate(() => document.querySelector('[data-ds-pick="ceremonial"]').click());
  await page.waitForTimeout(500);
  const blocked = await page.evaluate(READ);
  check('7 · a refused pairing is drawn unavailable, with its reason attached',
    blocked.blocked.length > 0 && blocked.blocked.every(b => b.why.length > 30),
    blocked.blocked.map(b => b.id).join(', ') || 'none');
  check('8 · switching style does not strand the customer on a refused pairing',
    blocked.structureAttr !== 'two-column',
    `structure is now ${blocked.structureAttr || 'standard-flow'}`);
  await page.screenshot({ path: path.join(OUT, 'blocked-pairing.png') });

  check('no page errors', errors.length === 0, errors.join(' | ') || 'clean');

  await browser.close();
  await h.stop();

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed · shots in ${path.relative(ROOT, OUT)}`);
  if (failed.length) { console.error('FAILED: ' + failed.map(f => f.name).join('; ')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
