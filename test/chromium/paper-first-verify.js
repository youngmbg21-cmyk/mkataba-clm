/* OUR PAPER'S BOOK, "PAPER FIRST" (round 21 of the redesign: the owner picked
   "Paper first" by name, 17 Oct 2026; js/views/library.js tplPfHtml)

   WHAT THIS PINS, driven in a real browser on Our paper → The book
     1 an index of every template under its shelf, and beside it the chosen
       template's own paper, drawn by the one renderer (its clauses on it)
     2 a press on another template brings its paper up; the find box narrows
       the index and keeps the caret
     3 the paper's doors are the template's own verbs (Draft a contract)
     4 the owner's three screens: the index and the paper side by side, each
       scrolling in its own box, nothing sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/paper-first-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const H = require('../helpers');

const EXEC = process.env.CHROMIUM_BIN
  || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.HATI_SHOT_DIR || '';
let failures = 0;
const check = (name, pass, detail) => {
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail != null ? ' — ' + detail : ''}`);
  if (!pass) failures++;
};

(async () => {
  const h = await H.startHati({ HATI_AGENTS_AUTO: 'off' });
  await H.seedWorkspace(h, { approvalRules: [] });
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const errors = [];
  try {
    const page = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
    page.on('pageerror', e => errors.push(e.message));
    const until = async (fn, arg, ms = 8000) => { let v; const t0 = Date.now();
      while (Date.now() - t0 < ms) { try { v = await page.evaluate(fn, arg); } catch (_) { v = null; } if (v) return v; await page.waitForTimeout(120); }
      return v; };
    await page.goto(h.base + '/', { waitUntil: 'networkidle' });
    await page.fill('#li-email', 'admin@example.co.ke'); await page.fill('#li-pass', 'adminpassword1'); await page.click('#li-go');
    await until(() => window.state && state.contracts && state.contracts.some(c => c.id === 'MK-A2'), null, 20000);
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { setView('templates'); if (typeof tplPageSetTab === 'function') tplPageSetTab('book'); });
    /* RE-POINTED 16 Nov 2026 (the new look is the only look, #762; OUR PAPER, THE LEGORA WAY, owner's pick 14 Nov 2026):
       the index is ONE list (.tpln-lrs) with the streams as chips over it in place of shelves; the chosen row is lit and
       its name heads the list (.tpln-line .tpln-name); the paper (.tpln-sheet, the one renderer's .tpl-pf-sheet) beside it */
    const A = await until(() => { const sec = document.querySelector('[data-tpl-sec="book"]'); if (!sec || !sec.querySelector('.tpln .tpln-lrs')) return null;
      return { rows: sec.querySelectorAll('.tpln-lrs [data-tpl-pf]').length, groups: [...sec.querySelectorAll('[data-tpln-chip]')].map(g => g.textContent.trim()),
        on: (sec.querySelector('.tpln-lr.is-on .tpln-n') || {}).textContent || '', title: (sec.querySelector('.tpln-line .tpln-name') || {}).textContent || '',
        clauses: sec.querySelectorAll('.tpl-pf-sheet h2, .tpl-pf-sheet h3, .tpl-pf-sheet h4, .tpl-pf-sheet [data-clause-id], .tpl-pf-sheet .hati-cl').length,
        words: ((sec.querySelector('.tpl-pf-sheet') || {}).textContent || '').length }; }, null, 12000);
    check('1 an index of every template with its streams as chips, and the chosen one\'s own paper beside it',
      !!A && A.rows >= 12 && A.groups.length >= 2 && !!A.on && A.title.indexOf(A.on) === 0 && A.words > 500, JSON.stringify(A && { rows: A.rows, groups: A.groups, on: A.on, title: A.title, words: A.words }));

    const target = await page.evaluate(() => { const b = [...document.querySelectorAll('[data-tpl-pf]')].find(x => /Non-Disclosure/i.test(x.textContent)); return b ? b.getAttribute('data-tpl-pf') : null; });
    if (target) await page.click(`[data-tpl-pf="${target}"]`);
    const B = await until(t => { const on = document.querySelector('.tpln-lr.is-on'), h = document.querySelector('.tpln-line .tpln-name'), sh = document.querySelector('.tpln-sheet .tpl-pf-sheet');
      return on && h && sh && on.getAttribute('data-tpl-pf') === t ? { title: h.textContent, text: sh.textContent.slice(0, 2000) } : null; }, target);
    check('2a a press on another template brings its paper up', !!B && /Non-Disclosure/i.test(B.title) && /confidential/i.test(B.text), JSON.stringify(B && { title: B.title }));
    /* RE-POINTED 16 Nov 2026 (#762): the find box is the one ask box [data-tpln-q]; the list narrows where it stands (rows hidden) */
    const all = await page.evaluate(() => document.querySelectorAll('.tpln-lrs [data-tpl-pf]').length);
    await page.click('[data-tpln-q]'); await page.keyboard.type('lease');
    const Q = await until(n => { const q = document.querySelector('[data-tpln-q]'); const rows = [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden);
      return q && q.value === 'lease' && rows.length && rows.length < n && rows.every(r => /lease/i.test(r.textContent)) ? { n: rows.length, focus: document.activeElement === q, caret: q.selectionStart } : null; }, all);
    check('2b the find box narrows the index and keeps the caret', !!Q && Q.focus && Q.caret === 5, JSON.stringify(Q));
    await page.fill('[data-tpln-q]', '');
    await until(() => [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden).length >= 12);

    const acts = await page.evaluate(() => [...document.querySelectorAll('[data-tpl-pf-act]')].map(b => b.textContent.trim()));
    /* RE-POINTED 19 Oct 2026 (round 21 as drawn, lane D): the head's verbs
       are "Draft from it" (the ONE New agreement form) beside the template's
       own — Make it ours on HaTi's paper, Open in the builder on ours */
    check('3 the paper\'s doors are the template\'s own verbs', acts.includes('Draft from it') && acts.includes('Make it ours'), JSON.stringify(acts));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'paper-first-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        /* RE-POINTED 16 Nov 2026 (#762; the Legora way): the paper is a peek in its own clipped frame that stays put
           (sticky) while the list beside it scrolls with the page — no longer two boxes each scrolling */
        const p = r('.tpln .tpln-sheet'), i = r('.tpln .tpln-side'), sh = document.querySelector('.tpln .tpln-sheet');
        return { side: document.documentElement.scrollWidth <= innerWidth + 1, beside: !!i && !!p && p.right <= i.left && Math.abs(i.top - p.top) < 2,
          inView: !!p && p.top < innerHeight && p.bottom <= innerHeight + 1, own: !!sh && getComputedStyle(sh).overflowY === 'hidden' && getComputedStyle(sh).position === 'sticky' }; });
      check(`4 ${w}×${ht}: the paper and the index side by side, the paper held in view in its own frame, nothing sideways`, F.side && F.beside && F.inView && F.own, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `paper-first-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
