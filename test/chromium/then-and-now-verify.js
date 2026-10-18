/* THE BOARD'S BOOK, "THEN AND NOW" (round 17 of the redesign: the owner
   picked "Then and now" by name, 17 Oct 2026; js/views/homeboard.js
   hbBookHtml, hbStageThen)

   WHAT THIS PINS, driven in a real browser on the Board
     1 Your book is a table: Figure · the day six months ago · Today · Change ·
       Six months, one row per figure, the numbers in one column
     2 each row's "then" and "today" are its line's first and last points, and
       today is the door: a press opens the list behind it
     3 the stage bar is drawn twice, the day six months ago above Today; the
       then bar presses nothing; the key says then in brackets
     4 the owner's three screens: the table and both bars in view, nothing
       sideways
   Waits ask for the state, bounded; a missing part reports.
   Run: node test/chromium/then-and-now-verify.js */
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
    await page.evaluate(() => { if (typeof hbOpenHome === 'function') hbOpenHome('board'); else setView('dashboard'); });
    await until(() => !!document.querySelector('#hb-book .hb-tn .hb-fig'), null, 12000);

    /* ---- 1 the table ---- */
    const T = await page.evaluate(() => {
      const head = [...document.querySelectorAll('#hb-book .hb-tn-h > span')].map(s => s.textContent.trim());
      const rows = [...document.querySelectorAll('#hb-book .hb-tn > .hb-fig')];
      const right = rows.map(r => Math.round(r.querySelector('.hb-fig-n').getBoundingClientRect().right));
      const tops = rows.map(r => Math.round(r.getBoundingClientRect().top));
      return { head, n: rows.length, oneCol: new Set(right).size === 1, oneEach: new Set(tops).size === rows.length, then: hbThenWord() };
    });
    check('1 Your book is a table: Figure · six months ago · Today · Change · Six months, one row per figure, the numbers in one column',
      JSON.stringify(T.head) === JSON.stringify(['Figure', T.then, 'Today', 'Change', 'Six months']) && T.n === 5 && T.oneCol && T.oneEach, JSON.stringify(T));

    /* ---- 2 then and today are the line's ends; today is the door ---- */
    const R = await page.evaluate(() => {
      const d = hbBookData(hbS().lens || 'all');
      return [...document.querySelectorAll('#hb-book .hb-tn > .hb-fig')].map(r => { const k = r.getAttribute('data-hb-fig'), h = hbFigSeries(k, d);
        const f = HB_FIGS.find(x => x.k === k), fmt = k === 'value' ? (v => document.querySelector('#hb-book [data-hb-fig="value"] .hb-fig-n').textContent) : f.days ? null : (v => String(v));
        return { k, then: r.querySelector('.hb-fig-then').textContent, now: r.querySelector('.hb-fig-n').textContent,
          first: h.length >= 2 && fmt ? (k === 'value' ? null : fmt(h[0].v)) : null, last: h.length && fmt ? (k === 'value' ? null : fmt(h[h.length - 1].v)) : null,
          door: (r.querySelector('.hb-fig-main') || {}).getAttribute ? r.querySelector('.hb-fig-main').getAttribute('data-hb-dig') : null,
          thenInDoor: !!r.querySelector('.hb-fig-main .hb-fig-then') }; });
    });
    const counted = R.filter(r => r.first != null);
    check('2a each count\'s "then" and "today" are its line\'s first and last points',
      counted.length >= 3 && counted.every(r => r.then === r.first && r.now === r.last), JSON.stringify(R));
    const live = R.find(r => r.k === 'live') || {};
    check('2b today is the figure\'s door', live.door === 'f:live', JSON.stringify(live));
    await page.click('#hb-book [data-hb-fig="live"] .hb-fig-main');
    const opened = await until(() => !!document.querySelector('#hb-focus .hb-row, .hb-sheet'), null, 8000);
    check('2c a press opens the list behind it', !!opened, String(opened));
    await page.keyboard.press('Escape').catch(() => {});
    await page.evaluate(() => { if (typeof hbOpenHome === 'function') hbOpenHome('board'); });
    await until(() => !!document.querySelector('#hb-book .hb-tn .hb-fig'), null, 8000);

    /* ---- 3 the stage bar twice ---- */
    const B = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#hb-book .hb-stagerow')];
      return { labels: rows.map(r => (r.querySelector('.hb-sr-l') || {}).textContent), thenPress: rows[0] ? rows[0].querySelectorAll('button').length : -1,
        todayPress: rows[1] ? rows[1].querySelectorAll('button').length : 0, brackets: [...document.querySelectorAll('#hb-book .hb-sk-then')].map(x => x.textContent),
        note: (document.querySelector('#hb-book .hb-sk-note') || {}).textContent || '', then: hbThenWord(), month: hbThenWord(true) };
    });
    check('3 the stage bar twice: six months ago above Today; the then bar presses nothing; the key says then in brackets',
      JSON.stringify(B.labels) === JSON.stringify([B.then, 'Today']) && B.thenPress === 0 && B.todayPress > 0 && B.brackets.length === 3 && B.brackets.every(t => /^\(\d+\)$/.test(t)) && B.note === `${B.month} in brackets`, JSON.stringify(B));
    if (OUT) await page.screenshot({ path: path.join(OUT, 'then-and-now-1440x780.png') });

    /* ---- 4 the owner's three screens ---- */
    for (const [w, ht] of [[1440, 780], [1536, 730], [1366, 950]]) {
      await page.setViewportSize({ width: w, height: ht }); await page.waitForTimeout(400);
      await page.evaluate(() => { const b = document.getElementById('hb-board'); if (b) b.scrollTop = 0; });
      const F = await page.evaluate(() => { const r = s => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; };
        const key = r('#hb-book .hb-stagekey'), tbl = r('#hb-book .hb-tn');
        const cut = [...document.querySelectorAll('#hb-book .hb-fig-n, #hb-book .hb-fig-then')].filter(n => n.scrollWidth > n.clientWidth + 1).length;
        return { table: !!tbl && tbl.top >= 0, bars: !!key && key.bottom <= innerHeight, cut, side: document.documentElement.scrollWidth <= innerWidth + 1 }; });
      check(`4 ${w}×${ht}: the table and both bars in view, no number cut, nothing sideways`, F.table && F.bars && !F.cut && F.side, JSON.stringify(F));
      if (OUT) await page.screenshot({ path: path.join(OUT, `then-and-now-${w}x${ht}.png`) });
    }
  } catch (e) { check('the stage ran to the end', false, e && e.stack); }
  finally {
    check('no page errors', !errors.length, errors.slice(0, 3).join(' | '));
    await browser.close(); await h.stop();
    console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
    process.exit(failures ? 1 : 0);
  }
})();
