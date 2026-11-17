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
    rows: [...dlg.querySelectorAll('.sap-li')].map(R),
    rowWords: [...dlg.querySelectorAll('.sap-li')].map(l => { const t = l.querySelector('span > span'), m = l.querySelector('.sap-m'); return [t ? t.textContent.trim() : '', m ? m.textContent.trim() : '']; }),
    starts: [...dlg.querySelectorAll('.sap-li input[type="radio"]')].map(i => i.getAttribute('data-ns-start') || i.id),
    list: dlg.querySelector('.sap-list') ? R(dlg.querySelector('.sap-list')) : null,
    cont: dlg.querySelector('#ns-continue') ? R(dlg.querySelector('#ns-continue')) : null,
    lastBtn: (() => { const bs = [...dlg.querySelectorAll('button')].filter(b => b.offsetParent); const b = bs[bs.length - 1]; return b ? b.id : null; })(),
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
    /* RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): "no New standard here any more: From
       scratch starts on the New agreement page, the one door" (MAP; owner, 14 Nov 2026). Check 0 asks for that door;
       the four starts open IN the sheet's From scratch tab (naNewPaperPaneHtml), not in a pop-up. The claims about the
       starts themselves are asked there: one list, one row under another, each the same width and inside the sheet,
       each a name and a line under it, Continue the one filled verb.
       RETIRED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): 1a "the question opened" (its h3), 1b "the
       box fills the frame", 1c "the frame is centred", 1e "Cancel on the right edge" and 1f's 16/18 frame padding —
       the starts no longer sit in a dialog frame on a computer, so there is no frame to balance. Section 3 still
       measures the pop-up form of the starts (openNewStandard() with no host), and section 2 the Template details
       box. */
    await page.evaluate(() => openNewAgreement({}));
    await page.waitForSelector('[data-na-newpaper]', { timeout: 8000 }).catch(() => {});
    const newBtn = await page.$('[data-na-newpaper]');
    check('0 · the one door to a new standard — From scratch on the New agreement sheet — is there for an admin', !!newBtn,
      await page.evaluate(() => [...document.querySelectorAll('.na-ptab')].map(b => b.textContent.trim())));
    if (newBtn) await newBtn.click();
    await pause(500);
    const k = await page.evaluate(() => {
      const pane = document.getElementById('na-np'); if (!pane || pane.hidden) return null;
      const R = e => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height), r: Math.round(r.right) }; };
      const rows = [...pane.querySelectorAll('.na-np-row')];
      return { pane: R(pane), rows: rows.map(R), starts: rows.map(l => (l.querySelector('input') || {}).value),
        rowWords: rows.map(l => { const t = l.querySelector('b'), m = l.querySelector('b + span'); return [t ? t.textContent.trim() : '', m ? m.textContent.trim() : '']; }),
        primaries: [...pane.querySelectorAll('.ui-btn-primary')].filter(b => b.offsetParent).length, cont: !!pane.querySelector('#na-np-go'),
        vw: document.documentElement.clientWidth };
    });
    await page.screenshot({ path: path.join(OUT, '01-how-to-start.png') });
    check('1d · the starts are one list, one row under another, each the same width',
      !!k && k.starts.join(',') === 'scratch,template,contract,cp' && k.rows.length === 4
        && k.rows.every(t => Math.abs(t.w - k.rows[0].w) <= 1 && t.x === k.rows[0].x) && k.rows.every((t, i) => !i || t.y > k.rows[i - 1].y)
        && k.rows.every(t => t.x >= k.pane.x && t.r <= k.pane.r + 1 && t.r <= k.vw),
      k && { starts: k.starts, rows: k.rows, pane: k.pane });
    check('1g · each start says what it is: a name and a line under it',
      !!k && k.rowWords.length === 4 && k.rowWords.every(([t, m]) => t.length > 2 && m.length > 2), k && k.rowWords);
    check('1f · Continue the one filled verb',
      !!k && k.primaries === 1 && k.cont, k && { primaries: k.primaries });
    await page.evaluate(() => { try { closeModal(); } catch (_) {} });
    await pause(300);

    /* ================= 2 · TEMPLATE DETAILS, FROM THE BUILDER'S HEAD ================ */
    await page.evaluate(() => setView('templates')); await pause(600);
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
    /* RE-POINTED 10 Oct 2026 (the pop-ups as drawn): the frame's padding is 16/18 now */
    check('2f · one filled verb in the foot, 16/18 on the sides',
      !!f && f.primaries === 1 && f.pad.join(' ') === '16px 18px 16px 18px', f && { primaries: f.primaries, pad: f.pad });
    check('2g · the frame is centred', !!f && Math.abs((f.frame.x + f.frame.w / 2) - f.vw / 2) <= 2);

    /* ================= 3 · NARROW: the starts stay inside the box ================ */
    await page.keyboard.press('Escape'); await pause(300);
    await page.evaluate(() => setView('templates')); await pause(900);
    await page.setViewportSize({ width: 420, height: 800 }); await pause(400);
    await page.evaluate(() => { if (typeof openNewStandard === 'function') openNewStandard(); else document.getElementById('tpl-new').click(); });
    await pause(500);
    const n = await page.evaluate(MEASURE);
    await page.screenshot({ path: path.join(OUT, '03-how-to-start-narrow.png') });
    /* RE-POINTED 10 Oct 2026 (the pop-ups as drawn): the starts are the list's rows */
    check('3a · at 420px the starts stay stacked and none leaves the box',
      !!n && n.rows.length === 4 && n.rows.every((t, i) => !i || t.y >= n.rows[i - 1].y + n.rows[i - 1].h - 1)
        && n.rows.every(t => t.x >= n.box.x && t.r <= n.box.r + 1), n && { rows: n.rows, box: n.box });
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
