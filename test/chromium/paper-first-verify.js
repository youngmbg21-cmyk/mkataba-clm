/* OUR PAPER'S BOOK, "PAPER FIRST" (round 21 of the redesign: the owner picked
   "Paper first" by name, 17 Oct 2026; js/views/library.js tplPfHtml)

   RE-POINTED 17 Nov 2026 (#762, Our paper: shelves, then the Legora way): the index and the paper are now two
   steps of the book (the list, then the paper); see the note in the stage below.
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
    /* RE-POINTED 17 Nov 2026 (#762; Our paper: shelves, then the Legora way, owner's pick by prototype): the index and
       the paper no longer stand side by side. The book is three steps — Shelves › a folder's list (or All) › the paper.
       The promises are kept on the steps that now carry them: the list (All) is the index of every template with its
       streams as chips; a row press chooses and a second opens that template's own paper, drawn by the one renderer
       (.tpl-pf-sheet), its name the step's head; the find box narrows the list where it stands and keeps the caret;
       the paper's doors are the template's own verbs; at the owner's three screens the paper and its facts and doors
       stand side by side, the paper's top in view, nothing sideways. */
    await until(() => document.querySelector('[data-tpl-sec="book"] .tpln5.is-shelves'), null, 12000);
    await page.evaluate(() => { const b = document.querySelector('[data-tpl-sec="book"] [data-tpln-view="list"]'); if (b) b.click(); });
    const L = await until(() => { const sec = document.querySelector('[data-tpl-sec="book"]'); if (!sec || !sec.querySelector('.tpln5.is-list .tpln-lrs')) return null;
      return { rows: sec.querySelectorAll('.tpln-lrs [data-tpl-pf]').length, groups: [...sec.querySelectorAll('[data-tpln-chip]')].map(g => g.textContent.trim()) }; }, null, 8000);
    /* press a row twice: the first chooses, the second opens its paper */
    const open2 = async (re) => {
      const k = await page.evaluate(src => { const b = [...document.querySelectorAll('[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf]')].find(x => !x.hidden && new RegExp(src, 'i').test(x.textContent)); return b ? b.getAttribute('data-tpl-pf') : null; }, re);
      if (!k) return null;
      const name = await page.evaluate(t => ((document.querySelector(`[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf="${t}"] .tpln-n`) || {}).textContent || '').trim(), k);
      /* the first press chooses (a row already chosen opens at once), the second opens */
      await page.click(`[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf="${k}"]`);
      const step = await until(t => { const p = tplPlace(); return p.pick === t ? p.view : null; }, k);
      if (step === 'list') await page.click(`[data-tpl-sec="book"] .tpln-lrs [data-tpl-pf="${k}"]`);
      return until(a => { const t = a.t; const sec = document.querySelector('[data-tpl-sec="book"]'), sh = sec && sec.querySelector('.tpln5.is-paper .tpl-pf-sheet'), h = document.querySelector('.tpln5-h1');
        return sh && h && tplPlace().pick === t ? { key: t, name: a.name, title: h.textContent.trim(), words: sh.textContent.length, text: sh.textContent.slice(0, 2000),
          clauses: sh.querySelectorAll('h2, h3, h4, [data-clause-id], .hati-cl').length } : null; }, { t: k, name });
    };
    const A = await open2('.');
    check('1 an index of every template with its streams as chips; a chosen one opens its own paper, its name the head',
      !!L && L.rows >= 12 && L.groups.length >= 2 && !!A && A.title === A.name && A.words > 500, JSON.stringify({ L, A: A && { name: A.name, title: A.title, words: A.words, clauses: A.clauses } }));

    await page.click('[data-tpln-back]');
    await until(() => document.querySelector('[data-tpl-sec="book"] .tpln5.is-list .tpln-lrs'));
    const B = await open2('Non-Disclosure');
    check('2a a press on another template brings its paper up', !!B && /Non-Disclosure/i.test(B.title) && /confidential/i.test(B.text), JSON.stringify(B && { title: B.title }));
    await page.click('[data-tpln-back]');
    await until(() => document.querySelector('[data-tpl-sec="book"] .tpln5.is-list .tpln-lrs'));
    const all = await page.evaluate(() => [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden).length);
    await page.click('[data-tpln-q]'); await page.keyboard.type('lease');
    const Q = await until(n => { const q = document.querySelector('[data-tpln-q]'); const rows = [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden);
      return q && q.value === 'lease' && rows.length && rows.length < n && rows.every(r => /lease/i.test(r.textContent)) ? { n: rows.length, of: n, focus: document.activeElement === q, caret: q.selectionStart } : null; }, all);
    check('2b the find box narrows the index and keeps the caret', !!Q && Q.focus && Q.caret === 5, JSON.stringify(Q));
    await page.fill('[data-tpln-q]', '');
    await until(() => [...document.querySelectorAll('.tpln-lrs [data-tpl-pf]')].filter(r => !r.hidden).length >= 12);

    await open2('Non-Disclosure');
    const acts = await page.evaluate(() => [...document.querySelectorAll('[data-tpl-sec="book"] .tpln5.is-paper [data-tpl-pf-act]')].map(b => b.textContent.trim()));
    /* RE-POINTED 19 Oct 2026 (round 21 as drawn, lane D): the head's verbs
       are "Draft from it" (the ONE New agreement form) beside the template's
       own — Make it ours on HaTi's paper, Open in the builder on ours */
    check('3 the paper\'s doors are the template\'s own verbs', acts.includes('Draft from it') && acts.includes('Make it ours'), JSON.stringify(acts));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'paper-first-1440x780.png') });

    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const p = r('.tpln5.is-paper .tpln-sheet'), i = r('.tpln5.is-paper .tpln5-side'), a = r('.tpln5.is-paper .tpln-acts');
        return { side: document.documentElement.scrollWidth <= innerWidth + 1, beside: !!i && !!p && p.right <= i.left && Math.abs(i.top - p.top) < 2,
          inView: !!p && p.top >= 0 && p.top < innerHeight - 200, doors: !!a && a.bottom <= innerHeight && a.right <= innerWidth }; });
      check(`4 ${w}×${ht}: the paper and its facts and doors side by side, the paper's top and the doors in view, nothing sideways`, F.side && F.beside && F.inView && F.doors, JSON.stringify(F));
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
