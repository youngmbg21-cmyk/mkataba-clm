/* Chromium verification: A DIALOG IS BALANCED BY CONSTRUCTION.
   ============================================================
   Owner-reported 13 Sep 2026, off two screenshots: the "What kind of
   template?" question and the "New standard template" form each sat with a
   blank column down the right — a box narrower than the frame that centred
   it. f312 reads the source and pins the rule (a dialog states its width once,
   on the frame); this file MEASURES the dialogs, because "balanced" and
   "centred" are geometry and only a rendered page knows whether the box fills
   the frame.

   RE-POINTED IN PLACE, 24 Sep 2026 (Young's go on "One Door to Standards").
   Neither photographed dialog has a door any more: "+ New standard contract"
   asks ONE question with three starts (section 1), and the name, category and
   value stream are no longer asked before the builder opens — they are chips
   at the top of the builder, each opening the Template details box, which
   carries the same Category · Value stream row (section 2). The rule is the
   same rule; it is measured on the dialogs a reader can reach.

   Run: node test/chromium/dialog-balance-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati, seedWorkspace } = require('../helpers');

const OUT = path.join(__dirname, 'shots', 'dialog-balance');
const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);

const results = [];
const check = (name, pass, detail) => {
  results.push({ name, pass: !!pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + JSON.stringify(detail) : ''}`);
};
const pause = ms => new Promise(r => setTimeout(r, ms));

/* The frame, its box, and every control inside — as rectangles. */
const MEASURE = () => {
  const dlg = document.querySelector('#modal-root [role="dialog"]'); if (!dlg) return null;
  const R = e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) }; };
  const box = dlg.firstElementChild;
  const cs = getComputedStyle(box);
  return {
    frame: R(dlg), box: R(box), pad: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft],
    vw: document.documentElement.clientWidth,
    tiles: [...dlg.querySelectorAll('.ns-tile')].map(R),
    /* An icon name the ICONS map does not carry draws an EMPTY svg (THE MAP:
       type-and-symbols-verify measures getBBox for this reason). */
    marks: [...dlg.querySelectorAll('.ns-tile .ic svg')].map(u => { try { const b = u.getBBox(); return Math.round(b.width * b.height); } catch (_) { return -1; } }),
    cancel: (() => { const b = [...dlg.querySelectorAll('button')].find(b => /cancel/i.test(b.textContent)); return b ? R(b) : null; })(),
    primaries: dlg.querySelectorAll('.ui-btn-primary').length,
    cat: dlg.querySelector('#tpllib-m-cat') ? R(dlg.querySelector('#tpllib-m-cat')) : null,
    stream: dlg.querySelector('#tpllib-m-stream') ? R(dlg.querySelector('#tpllib-m-stream')) : null,
    others: [...dlg.querySelectorAll('#tpllib-m-cat option')].filter(o => o.value === 'other').length,
    firstOpt: (dlg.querySelector('#tpllib-m-cat option') || {}).value,
    selected: (dlg.querySelector('#tpllib-m-cat') || {}).value,
    h3: (dlg.querySelector('h3') || {}).textContent,
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

  try {
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await pause(600);
    await page.fill('#li-email', 'admin@example.co.ke');
    await page.fill('#li-pass', 'adminpassword1');
    await page.click('#li-go');
    await pause(2400);
    await page.evaluate(() => setView('templates'));
    await pause(1200);

    /* ================= 1 · HOW DO YOU WANT TO START? ================ */
    const newBtn = await page.$('#tpl-new');
    check('0 · the + New standard contract door is on the page', !!newBtn);
    await page.click('#tpl-new');
    await pause(500);
    const k = await page.evaluate(MEASURE);
    const title = await page.evaluate(() => i18t('ns_title'));
    await page.screenshot({ path: path.join(OUT, '01-how-to-start.png') });
    check('1a · the question opened', !!k && (k.h3 || '').trim() === title, k && k.h3);
    check('1b · the box fills the frame — no blank column',
      !!k && Math.abs(k.frame.w - k.box.w) <= 2, k && { frame: k.frame.w, box: k.box.w });
    check('1c · the frame is centred on the screen',
      !!k && Math.abs((k.frame.x + k.frame.w / 2) - k.vw / 2) <= 2, k && { frameCentre: k.frame.x + k.frame.w / 2, screenCentre: k.vw / 2 });
    check('1d · three starts, one under another, each the same width',
      !!k && k.tiles.length === 3 && k.tiles.every(t => Math.abs(t.w - k.tiles[0].w) <= 1 && t.x === k.tiles[0].x)
        && k.tiles[1].y > k.tiles[0].y && k.tiles[2].y > k.tiles[1].y,
      k && k.tiles);
    check('1e · the starts reach the frame’s padding on both sides, and Cancel sits on the right edge they reach',
      !!k && k.tiles.length === 3 && Math.abs(k.tiles[0].x - (k.box.x + 24)) <= 1
        && Math.abs(k.tiles[0].r - (k.box.r - 24)) <= 1 && !!k.cancel && Math.abs(k.cancel.r - k.tiles[0].r) <= 1,
      k && { left: k.tiles[0] && k.tiles[0].x, boxLeft: k.box.x, right: k.tiles[0] && k.tiles[0].r, boxRight: k.box.r, cancel: k.cancel && k.cancel.r });
    check('1g · each start’s mark is an icon the product really carries — it paints, not an empty box',
      !!k && k.marks.length === 3 && k.marks.every(a => a > 0), k && k.marks);
    check('1f · 24 on every side, and no filled verb on a question',
      !!k && k.pad.every(p => p === '24px') && k.primaries === 0, k && { pad: k.pad, primaries: k.primaries });

    /* ================= 2 · TEMPLATE DETAILS, FROM THE BUILDER'S HEAD ================ */
    await page.keyboard.press('Escape'); await pause(300);
    const ids = await page.evaluate(async () => {
      const d = await api('templates', 'POST', { name: 'Balance probe', category: 'other', description: '' });
      const t = await api('templates/' + d.template.id);
      return { tid: d.template.id, vid: t.versions.find(v => v.status === 'draft').id };
    });
    await page.evaluate(i => openTemplateBuilder(i.tid, i.vid), ids);
    await pause(1200);
    await page.click('[data-tb-meta="category"]');
    await pause(600);
    const f = await page.evaluate(MEASURE);
    const detTitle = await page.evaluate(() => i18t('tl_template_details'));
    await page.screenshot({ path: path.join(OUT, '02-template-details.png') });
    check('2a · the Category chip opens the Template details box', !!f && (f.h3 || '').trim() === detTitle, f && f.h3);
    check('2b · its box fills its frame too', !!f && Math.abs(f.frame.w - f.box.w) <= 2, f && { frame: f.frame.w, box: f.box.w });
    check('2c · Category and Value stream share one row',
      !!f && !!f.cat && !!f.stream && f.cat.y === f.stream.y && f.stream.x > f.cat.r, f && { cat: f.cat, stream: f.stream });
    check('2d · the two answers split the row evenly', !!f && !!f.cat && !!f.stream && Math.abs(f.cat.w - f.stream.w) <= 1,
      f && { cat: f.cat && f.cat.w, stream: f.stream && f.stream.w });
    check('2e · “Other” is listed once, leads, and is what this template is filed as',
      !!f && f.others === 1 && f.firstOpt === 'other' && f.selected === 'other', f && { others: f.others, first: f.firstOpt, selected: f.selected });
    check('2f · one filled verb in the foot, 24 on every side',
      !!f && f.primaries === 1 && f.pad.every(p => p === '24px'), f && { primaries: f.primaries, pad: f.pad });
    check('2g · the frame is centred', !!f && Math.abs((f.frame.x + f.frame.w / 2) - f.vw / 2) <= 2);

    /* ================= 3 · NARROW: the starts stay inside the box ================ */
    await page.keyboard.press('Escape'); await pause(300);
    await page.evaluate(() => setView('templates')); await pause(900);
    await page.setViewportSize({ width: 420, height: 800 }); await pause(400);
    await page.evaluate(() => { if (typeof openNewStandard === 'function') openNewStandard(); else document.getElementById('tpl-new').click(); });
    await pause(500);
    const n = await page.evaluate(MEASURE);
    await page.screenshot({ path: path.join(OUT, '03-how-to-start-narrow.png') });
    check('3a · at 420px the three starts stay stacked and none leaves the box',
      !!n && n.tiles.length === 3 && n.tiles[1].y > n.tiles[0].y + n.tiles[0].h - 1
        && n.tiles.every(t => t.x >= n.box.x && t.r <= n.box.r + 1), n && { tiles: n.tiles, box: n.box });
    check('3b · and the box still fills the frame', !!n && Math.abs(n.frame.w - n.box.w) <= 2, n && { frame: n.frame.w, box: n.box.w });

    check('4 · the page threw nothing', errors.length === 0, errors.slice(0, 3));
  } catch (e) {
    check('harness', false, String(e && e.message || e));
  } finally {
    await browser.close();
    await h.stop();
  }

  const bad = results.filter(r => !r.pass);
  console.log(`\n${results.length - bad.length}/${results.length} checks passed`);
  if (bad.length) { bad.forEach(b => console.log('  FAIL ' + b.name)); process.exit(1); }
})();
