/* THE LAUNCHPAD — BENTO, THE LEGORA WAY (owner's pick by name, 19 Nov 2026; f1097 is its node half). It replaces the
   symbol strip (symbol-strip-verify retired with it). Driven with a real mouse and keyboard, in the new look:
     1 · the bar's top-left symbol opens the jump window in the middle; the typing box has the hand
     2 · as drawn: six chips, what waits on you on top (at most three, a large number, its button), every Guide page
         once in a quiet list by stage, the page you stand on said once — painted, not only present
     3 · the chips narrow it; the arrows walk it
     4 · typed, it is the jump list it always was; emptied, the launchpad returns
     5 · a press on a page goes there through the Guide's door and the window lets go
     6 · ⌘K and "/" outside a box open the same window; Esc closes it; a second press of the symbol closes it
     7 · the owner's three screens: the sheet fits the window, nothing sideways, no name spills out of its row
   Every driven half is guarded, so a missing feature reports FAIL rather than timing out.
   Run: node test/chromium/launchpad-verify.js */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { startHati } = require('../helpers');
const { seedHandbookWorld } = require('../handbook-world');

const EXEC = process.env.CHROMIUM_BIN || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const OUT = process.env.SHOTS_OUT || path.join(__dirname, 'shots', 'launchpad');
fs.mkdirSync(OUT, { recursive: true });
let failures = 0, passes = 0;
const check = (ok, what, detail) => { console.log((ok ? 'PASS  ' : 'FAIL  ') + what + (detail != null ? ' — ' + JSON.stringify(detail) : '')); if (ok) passes++; else failures++; };
const until = async (P, fn, arg, ms = 8000) => { try { await P.waitForFunction(fn, arg, { timeout: ms }); return true; } catch (_) { return false; } };
const isOpen = () => !!document.getElementById('cmd-palette');
const isShut = () => !document.getElementById('cmd-palette');

(async () => {
  const h = await startHati({});
  await seedHandbookWorld(h);
  const browser = await chromium.launch({ executablePath: EXEC, args: ['--no-sandbox'] });
  const P = await (await browser.newContext({ viewport: { width: 1440, height: 780 } })).newPage();
  const errors = []; P.on('pageerror', e => errors.push(String(e && e.message || e)));
  try {
    await P.goto(h.base + '/', { waitUntil: 'networkidle' });
    await P.fill('#li-email', 'admin@example.co.ke'); await P.fill('#li-pass', 'adminpassword1'); await P.click('#li-go');
    await until(P, () => !!document.getElementById('igd-input'), null, 20000);
    const has = await P.evaluate(() => !!document.getElementById('dk-nav') && typeof window.lpItems === 'function');
    check(has, '0 the launchpad and its symbol exist');
    if (!has) throw new Error('no launchpad');

    /* 1 the symbol opens it */
    await P.click('#dk-nav');
    const opened = await until(P, () => !!document.querySelector('#cmd-palette .lp-p'), null, 4000);
    /* the sheet arrives with a short motion: measure where it STANDS, once its motion has ended (bounded) */
    await until(P, () => { const s = document.querySelector('#cmd-palette .lp-sheet'); return !!s && s.getAnimations().every(a => a.playState !== 'running'); }, null, 3000);
    const one = await P.evaluate(() => ({ focus: document.activeElement && document.activeElement.id, exp: document.getElementById('dk-nav').getAttribute('aria-expanded'),
      sheet: (() => { const r = document.querySelector('#cmd-palette .lp-sheet').getBoundingClientRect(); return { l: Math.round(r.left), r: Math.round(innerWidth - r.right), t: Math.round(r.top), b: Math.round(innerHeight - r.bottom), w: Math.round(r.width) }; })() }));
    check(opened && one.focus === 'cp-input' && one.exp === 'true', '1a a press on the symbol opens the launchpad, the typing box has the hand', one);
    /* RE-POINTED 19 Nov 2026 (owner: "nav panel pop up should appear at the center of the page"): up and down as well */
    check(opened && Math.abs(one.sheet.l - one.sheet.r) <= 2 && Math.abs(one.sheet.t - one.sheet.b) <= 2 && one.sheet.w > 900, '1b in the middle of the screen, across and up and down, as wide as drawn', one.sheet);

    /* 2 as drawn */
    const drawn = await P.evaluate(() => {
      const pal = document.getElementById('cmd-palette');
      const guide = [...new Set(GUIDE_NL.flatMap(st => st.rows.flat()))].filter(k => k !== 'import' || typeof caMayAdd !== 'function' || caMayAdd());
      const rows = [...pal.querySelectorAll('.lp-p')];
      const tiles = [...pal.querySelectorAll('.lp-w')].map(t => ({ n: Number((t.querySelector('.lp-n b') || {}).textContent || 0), act: !!t.querySelector('.lp-act'), q: !!t.querySelector('q'), text: t.textContent.replace(/\s+/g, ' ').trim().slice(0, 80) }));
      const first = rows[0], r = first && first.getBoundingClientRect(), hit = r && document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { chips: pal.querySelectorAll('.lp-chip').length, rows: rows.length, guide: guide.length, owed: lpWaits().length, tiles,
        here: [...pal.querySelectorAll('[aria-current="page"]')].map(b => b.textContent.replace(/\s+/g, ' ').trim()), painted: !!(hit && first.contains(hit)),
        /* THE STRIPE WAY (owner, 20 Nov 2026): a line under every page, no symbols, what waits in ONE column at the right */
        lines: rows.filter(b => { const x = b.querySelector('.lp-wh'); return x && x.textContent.trim().length > 8 && x.getBoundingClientRect().height > 0; }).length,
        marks: pal.querySelectorAll('.lp-list svg, .lp-side svg, .lp-dot, .lp-ic').length,
        side: (() => { const sd = document.getElementById('lp-side'), ls = document.getElementById('cp-list'); if (!sd || sd.hidden) return null; const a = sd.getBoundingClientRect(), b = ls.getBoundingClientRect(), sh = pal.querySelector('.lp-sheet').getBoundingClientRect();
          const h1 = sd.querySelector('.lp-h').getBoundingClientRect(), h2 = ls.querySelector('.lp-st h5').getBoundingClientRect();
          return { right: a.left >= b.right - 1, top: Math.round(a.top - sh.top), tiles: sd.querySelectorAll('.lp-w').length, inList: ls.querySelectorAll('.lp-w').length, more: !!sd.querySelector('.lp-more'), level: Math.round(Math.abs(h1.bottom - h2.bottom)), two: !!pal.querySelector('#lp-ph b') }; })() };
    });
    check(drawn.chips === 6, '2a six chips: All · Waiting on you · Arrive · Deal · Live · Book', drawn.chips);
    check(drawn.rows === drawn.guide, '2b every Guide page once in the quiet list', { rows: drawn.rows, guide: drawn.guide });
    check(drawn.tiles.length === Math.min(3, drawn.owed) && drawn.tiles.every(t => t.n > 0 && t.act), '2c what waits on you: at most three, a large number and its button each', drawn.tiles);
    check(drawn.lines === drawn.rows && drawn.marks === 0, '2f every page says what is behind it in a line; no page symbols, no stage dots', { lines: drawn.lines, rows: drawn.rows, marks: drawn.marks });
    check(!drawn.owed || (!!drawn.side && drawn.side.right && drawn.side.top <= 2 && drawn.side.tiles === drawn.tiles.length && drawn.side.inList === 0 && drawn.side.more && drawn.side.level <= 2 && drawn.side.two),
      '2g what waits stands in ONE column at the right, from the window\'s top, its head level with the stages\' heads; the ask line in two tones', drawn.side);
    check(drawn.here.length === 1, '2d the page you stand on is said once', drawn.here);
    check(drawn.painted, '2e the rows are painted, not only present (elementFromPoint)');
    await P.screenshot({ path: path.join(OUT, 'open-1440x780.png') });

    /* 3 chips and arrows */
    await P.click('#cmd-palette [data-lp-chip="arrive"]');
    const arrive = await P.evaluate(() => ({ tiles: document.querySelectorAll('#cmd-palette .lp-w').length,
      rows: [...document.querySelectorAll('#cmd-palette .lp-p')].length, want: GUIDE_NL.find(s => s.k === 'arrive').rows.flat().filter(k => k !== 'import' || typeof caMayAdd !== 'function' || caMayAdd()).length,
      focus: document.activeElement && document.activeElement.id }));
    check(arrive.tiles === 0 && arrive.rows === arrive.want && arrive.focus === 'cp-input', '3a Arrive narrows it to its own pages, the hand stays in the box', arrive);
    await P.click('#cmd-palette [data-lp-chip="all"]');
    const a0 = await P.evaluate(() => document.getElementById('cp-input').getAttribute('aria-activedescendant'));
    await P.keyboard.press('ArrowDown');
    const a1 = await P.evaluate(() => ({ act: document.getElementById('cp-input').getAttribute('aria-activedescendant'), sel: document.querySelectorAll('#cmd-palette [aria-selected="true"]').length }));
    check(a0 === 'cp-opt-0' && a1.act === 'cp-opt-1' && a1.sel === 1, '3b the arrows walk it, one row chosen at a time', { a0, a1 });

    /* 4 typed, the jump list; emptied, the launchpad */
    await P.fill('#cp-input', 'cal');
    const h0 = await P.evaluate(() => Math.round(document.querySelector('#cmd-palette .lp-sheet').getBoundingClientRect().top));
    const typed = await until(P, () => document.getElementById('lp-chips').hidden && !document.querySelector('#cmd-palette .lp-p') && /calendar|kalender/i.test(document.getElementById('cp-list').textContent), null, 3000);
    check(typed, '4a typed, it is the jump list (chips away, Calendar found)');
    const h1 = await P.evaluate(() => Math.round(document.querySelector('#cmd-palette .lp-sheet').getBoundingClientRect().top));
    check(h0 === h1, '4c typing does not move the window (it keeps the height it opened at)', { before: h0, after: h1 });
    await P.fill('#cp-input', '');
    check(await until(P, () => !!document.querySelector('#cmd-palette .lp-p') && !document.getElementById('lp-chips').hidden, null, 3000), '4b emptied, the launchpad returns');

    /* 5 a page goes there */
    const cal = await P.locator('#cmd-palette .lp-p', { hasText: /Calendar|Kalender/ }).first();
    if (await cal.count()){
      await cal.click();
      const went = await until(P, () => typeof guideHereKey === 'function' && guideHereKey() === 'calendar' && !document.getElementById('cmd-palette'), null, 8000);
      check(went && await P.evaluate(() => document.getElementById('dk-nav').getAttribute('aria-expanded') === 'false'), '5 a press on Calendar goes there and the window lets go');
    } else check(false, '5 a press on Calendar goes there', 'no row');

    /* 6 ⌘K, "/", Esc, the symbol again */
    await P.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
    await P.keyboard.press('Control+k');
    check(await until(P, isOpen, null, 3000), '6a ⌘K / Ctrl K opens it');
    await P.keyboard.press('Escape');
    check(await until(P, isShut, null, 3000), '6b Esc closes it');
    await P.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); });
    await P.keyboard.press('/');
    check(await until(P, () => !!document.querySelector('#cmd-palette .lp-p'), null, 3000), '6c "/" outside a box opens the same window');
    const bb = await P.locator('#dk-nav').boundingBox();
    await P.mouse.click(bb.x + bb.width / 2, bb.y + bb.height / 2);
    check(await until(P, isShut, null, 3000), '6d a second press of the symbol closes it');

    /* 7 three screens */
    for (const [ww, hh] of [[1440, 780], [1536, 730], [1366, 950]]){
      await P.setViewportSize({ width: ww, height: hh });
      await P.waitForTimeout(150);
      await P.click('#dk-nav'); await until(P, () => !!document.querySelector('#cmd-palette .lp-p'), null, 3000);
      const fit = await P.evaluate(() => { const s = document.querySelector('#cmd-palette .lp-sheet'); if (!s) return null;
        const r = s.getBoundingClientRect();
        const spill = [...s.querySelectorAll('.lp-p, .lp-w')].filter(b => { const q = b.getBoundingClientRect(); return [...b.children].some(c => { const x = c.getBoundingClientRect(); return x.width && (x.right > q.right + 1 || x.left < q.left - 1); }); }).map(b => b.textContent.trim().slice(0, 30));
        return { top: Math.round(r.top), bottom: Math.round(r.bottom), ih: innerHeight, side: document.documentElement.scrollWidth > innerWidth || s.scrollWidth > s.clientWidth + 1, spill }; });
      check(!!fit && fit.top >= 0 && fit.bottom <= fit.ih && !fit.side && fit.spill.length === 0, `7 ${ww}×${hh}: the sheet fits, nothing sideways, no name spills`, fit);
      await P.screenshot({ path: path.join(OUT, `${ww}x${hh}.png`) });
      await P.keyboard.press('Escape'); await until(P, isShut, null, 2000);
    }
    check(errors.length === 0, 'no page errors', errors.join(' | '));
  } catch (e) { check(false, 'the run finished', String(e && e.message || e)); }
  finally { await browser.close(); await h.stop(); }
  console.log(`\n${passes} passed, ${failures} failed`);
  process.exit(failures ? 1 : 0);
})();
